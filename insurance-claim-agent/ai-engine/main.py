"""
FastAPI AI Engine — serves the Express backend at http://localhost:8001
Endpoints:
  GET  /health
  POST /parse_note      ← extracts CPT, ICD-10, procedure, urgency from text
  POST /extract_ehr     ← matches EHR against requirements, returns evidence + gaps
  POST /extract_pdf     ← extracts text from uploaded PDF
"""

import re
import sys
import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

sys.path.insert(0, os.path.dirname(__file__))

from tools.icd10_lookup import lookup_icd10_code
from tools.risk_predictor import score_rejection_risk

app = FastAPI(title="Insurance Claim AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class ParseNoteRequest(BaseModel):
    text: str

class ExtractEHRRequest(BaseModel):
    ehr: dict
    requirements: list[str]

# ── /health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True, "service": "insurance-claim-ai-engine"}

# ── /parse_note ───────────────────────────────────────────────────────────────

CPT_DESCRIPTIONS = {
    "63030": "Lumbar Discectomy",
    "27447": "Total Knee Arthroplasty",
    "47562": "Laparoscopic Cholecystectomy",
    "43239": "Upper GI Endoscopy with Biopsy",
    "70553": "MRI Brain with Contrast",
    "93306": "Echocardiography",
    "99283": "Emergency Department Visit",
    "44950": "Laparoscopic Appendectomy",
    "92928": "Percutaneous Coronary Intervention (PCI) with Stenting",
}

def extract_urgency(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in ["urgent", "emergency", "immediately", "prevent permanent"]):
        return "URGENT"
    if any(w in lower for w in ["elective", "routine", "scheduled"]):
        return "ROUTINE"
    return "STANDARD"

@app.post("/parse_note")
def parse_note(req: ParseNoteRequest):
    text = req.text

    # Extract CPT
    cpt_match = re.search(r'CPT[\s_]?(?:code)?[\s:_#]*(\d{5})', text, re.IGNORECASE)
    cpt_raw   = cpt_match.group(1) if cpt_match else None

    # Extract ICD-10 (explicit label first, then bare code pattern)
    icd_match = re.search(r'ICD-?10[:\s]*([\w]\d{2}\.?\w*)', text, re.IGNORECASE)
    if not icd_match:
        icd_match = re.search(r'\b([A-Z]\d{2}\.?\d{0,2})\b', text)
    icd10 = icd_match.group(1).upper() if icd_match else None

    # If no CPT in text, infer from procedure keywords
    if not cpt_raw:
        lower = text.lower()
        if "discectomy" in lower or "lumbar disc" in lower:
            cpt_raw = "63030"
        elif "knee replacement" in lower or "knee arthroplasty" in lower:
            cpt_raw = "27447"
        elif "cholecystectomy" in lower:
            cpt_raw = "47562"
        elif "endoscopy" in lower:
            cpt_raw = "43239"
        elif "appendectomy" in lower or "appendicitis" in lower or "appendix" in lower:
            cpt_raw = "44950"
        elif "stenting" in lower or "percutaneous coronary" in lower or "pci" in lower or "cardiac" in lower:
            cpt_raw = "92928"

    # If no ICD-10, infer from keywords
    if not icd10:
        lower = text.lower()
        if "disc herniation" in lower or "discectomy" in lower or "lumbar" in lower:
            icd10 = "M51.1"
        elif "knee" in lower and ("osteoarthritis" in lower or "replacement" in lower):
            icd10 = "M17.11"
        elif "cholecystitis" in lower or "gallbladder" in lower:
            icd10 = "K80.20"
        elif "appendicitis" in lower or "appendectomy" in lower or "appendix" in lower:
            icd10 = "K37"
        elif "coronary" in lower or "stenosis" in lower or "angina" in lower or "atherosclerotic" in lower:
            icd10 = "I25.10"

    procedure = CPT_DESCRIPTIONS.get(cpt_raw, "Surgical Procedure")

    # Validate ICD-10 description
    icd_desc = None
    if icd10:
        matches  = lookup_icd10_code(icd10)
        icd_desc = matches[0]["description"] if matches and matches[0].get("icd10_code") != "NOT_FOUND" else icd10

    return {
        "procedure":   procedure,
        "cpt_code":    cpt_raw,
        "icd10_code":  icd10,
        "icd10_desc":  icd_desc,
        "urgency":     extract_urgency(text),
    }

# ── /extract_ehr ──────────────────────────────────────────────────────────────

# Maps document name fragments to search keywords across EHR sections.
# Keys are lowercase substrings that appear in the policy-required document names.
DOCUMENT_KEYWORDS = {
    # Imaging
    "mri":                         ["mri", "magnetic resonance"],
    "x-ray":                       ["x-ray", "xray", "radiograph"],
    "ultrasound":                  ["ultrasound", "sonograph"],
    "coronary angiogram":          ["angiogram", "angiography", "cath"],
    "electrocardiogram":           ["ecg", "electrocardiogram", "ekg"],
    "echocardiogram":              ["echo", "echocardiogram", "2d echo"],
    # Lab reports
    "cbc":                         ["cbc", "complete blood count", "blood report", "wbc", "haematology"],
    "cbc & blood":                 ["cbc", "complete blood count", "blood report", "wbc"],
    "lab report":                  ["lab", "blood", "cbc", "panel", "report"],
    "nerve conduction":            ["nerve conduction", "ncs", "emg", "electromyograph"],
    # Treatment records
    "physiotherapy":               ["physical therapy", "physiotherapy", "pt record"],
    "conservative treatment":      ["physical therapy", "physiotherapy", "injection", "chiropractic", "nsaid"],
    # External / clinician-issued docs — these can NEVER be auto-satisfied from EHR entries
    "surgeon":                     None,   # always missing
    "surgeon's certificate":       None,   # always missing
    "certificate of medical":      None,   # always missing
    "proof of medical necessity":  None,   # always missing
    "medical necessity":           None,   # always missing
    "surgical clearance":          None,   # always missing
    "hospital admission":          ["admission", "admit", "inpatient"],
    # Endoscopy / GI
    "prior endoscopy":             ["endoscopy", "scope"],
    "h. pylori":                   ["pylori", "h pylori"],
}

def doc_is_in_ehr(doc_type: str, ehr: dict) -> bool:
    """
    Check whether a required document can be satisfied from the patient's EHR data.
    Returns False (missing) for clinician-issued external documents that cannot be
    auto-pulled from the EHR, and performs keyword search for objective evidence.
    """
    doc_lower = doc_type.lower()

    # Check explicit None (always missing) rules first
    for key, kws in DOCUMENT_KEYWORDS.items():
        if key in doc_lower and kws is None:
            return False

    # Find keyword list for this document type
    keywords = None
    for key, kws in DOCUMENT_KEYWORDS.items():
        if kws is not None and key in doc_lower:
            keywords = kws
            break

    # Fallback: use the first meaningful word
    if keywords is None:
        words = [w for w in doc_lower.split() if len(w) > 3]
        keywords = words[:2] if words else [doc_lower[:6]]

    labs       = ehr.get("lab_reports", [])
    treatments = ehr.get("prior_treatments", [])
    diagnoses  = ehr.get("diagnosis_history", [])

    for lab in labs:
        lab_text = (lab.get("type", "") + " " + lab.get("result", "")).lower()
        if any(kw in lab_text for kw in keywords):
            return True

    for tx in treatments:
        tx_text = (tx.get("type", "") + " " + tx.get("outcome", "")).lower()
        if any(kw in tx_text for kw in keywords):
            return True

    # Admission form — can be validated from diagnosis history metadata
    if "hospital admission" in doc_lower or "admission form" in doc_lower:
        return len(diagnoses) > 0

    return False

@app.post("/extract_ehr")
def extract_ehr(req: ExtractEHRRequest):
    ehr          = req.ehr
    requirements = req.requirements

    # Matched diagnoses
    matched_diagnoses = ehr.get("diagnosis_history", [])

    # Relevant labs only
    relevant_labs = [
        {
            "type":     lab["type"],
            "date":     lab.get("date", ""),
            "findings": lab.get("result", ""),
        }
        for lab in ehr.get("lab_reports", [])
        if lab.get("relevant", False)
    ]

    # Prior treatments
    prior_treatments = ehr.get("prior_treatments", [])

    # Medications — return full objects for evidence-based justification (problem statement: current medications)
    medications = [
        {
            "name": m.get("name", ""),
            "dosage": m.get("dosage", ""),
            "frequency": m.get("frequency", ""),
            "purpose": m.get("purpose", ""),
            "start_date": m.get("start_date", ""),
        }
        for m in ehr.get("medications", [])
    ]

    # Gap analysis — check each required doc
    missing_documents = []
    found_documents   = []
    for doc in requirements:
        if doc_is_in_ehr(doc, ehr):
            found_documents.append(doc)
        else:
            missing_documents.append(doc)

    # Build risk claim package and score it
    claim_package = {
        "insurer_id":                   ehr.get("insurer_id", ""),
        "cpt_code":                     ehr.get("cpt_code", ""),
        "icd10_code":                   matched_diagnoses[0]["icd10"] if matched_diagnoses else "",
        "claim_amount":                 50000,
        "patient_age":                  ehr.get("age", 45),
        "claim_type":                   "Inpatient",
        "submission_method":            "Online",
        "missing_documents":            missing_documents,
        "diagnosis_confirmed":          len(matched_diagnoses) > 0,
        "conservative_treatment_tried": len(prior_treatments) > 0,
        "labs_available":               len(relevant_labs),
    }
    risk_result = score_rejection_risk(claim_package)

    # Build top risk drivers for the UI
    top_drivers = [
        f["factor"] for f in risk_result.get("factors", [])
        if not f.get("positive", True)
    ]

    return {
        "matched_diagnoses":  matched_diagnoses,
        "relevant_labs":      relevant_labs,
        "prior_treatments":   prior_treatments,
        "medications":        medications,
        "missing_documents":  missing_documents,
        "found_documents":    found_documents,
        "patient_name":       ehr.get("name", ""),
        "policy_number":      f"POL-{ehr.get('insurer_id','')}-2024",
        "evidence_summary": {
            "total_labs":          len(ehr.get("lab_reports", [])),
            "relevant_labs":       len(relevant_labs),
            "treatments_count":    len(prior_treatments),
            "diagnoses_count":     len(matched_diagnoses),
            "medications_count":   len(medications),
            "medications_summary": ", ".join(m.get("name", "") for m in medications) if medications else "",
        },
        "risk": {
            "level":      risk_result.get("level", "MEDIUM"),
            "score":      risk_result.get("score", 50),
            "topDrivers": top_drivers,
        },
    }

# ── /extract_pdf ──────────────────────────────────────────────────────────────

@app.post("/extract_pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Extract text from uploaded PDF using pdfplumber."""
    try:
        import pdfplumber, io
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        return {"text": text.strip(), "pages": len(pdf.pages)}
    except ImportError:
        # pdfplumber not installed — return empty, frontend falls back to paste
        return {"text": "", "error": "pdfplumber not installed — pip install pdfplumber"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)