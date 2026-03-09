from __future__ import annotations
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from extraction.ehr_extractor import extract_ehr_evidence
from ingestion.note_parser import parse_surgeon_note
from tools.icd10_lookup import lookup_icd10_code
from tools.risk_predictor import score_rejection_risk
import uvicorn

app = FastAPI(title="Insurance Claim AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/parse_note")
def parse_note(payload: dict):
    text = (payload or {}).get("text", "")
    result = parse_surgeon_note(text)
    return result.model_dump()

@app.post("/extract_ehr")
def extract_ehr(payload: dict):
    ehr = (payload or {}).get("ehr", {}) or {}
    requirements = (payload or {}).get("requirements", []) or []
    return extract_ehr_evidence(ehr, list(requirements))

@app.get("/icd10/{query}")
def icd10(query: str):
    return {"query": query, "results": lookup_icd10_code(query)}

@app.post("/predict_risk")
def predict_risk(payload: dict):
    return score_rejection_risk(payload)

@app.post("/analyze")
def analyze(payload: dict):
    # 1. Load mock files
    with open("data/mock/patient_ehr.json") as f:
        ehr = json.load(f)
    with open("data/mock/insurance_policies.json") as f:
        policies = json.load(f)

    # 2. Parse surgeon note
    note_text = (payload or {}).get("note", "")
    extracted = parse_surgeon_note(note_text)

    # 3. Get policy rules
    insurer_id = ehr.get("insurer_id", "INS_A")
    cpt_key = f"CPT_{extracted.cpt_code.replace('CPT_', '')}"
    policy = policies.get(insurer_id, {}).get("procedures", {}).get(cpt_key, {})
    requirements = policy.get("required_documents", [])

    # 4. Extract EHR evidence
    evidence = extract_ehr_evidence(ehr, requirements)

    # 5. Score risk
    risk_input = {
        "insurer_id": insurer_id,
        "cpt_code": extracted.cpt_code,
        "icd10_code": extracted.icd10_code,
        "missing_documents": evidence.get("missing_documents", []),
        "diagnosis_confirmed": evidence["evidence_summary"]["diagnosis_confirmed"],
        "conservative_treatment_tried": evidence["evidence_summary"]["conservative_treatment_tried"],
        "labs_available": evidence["evidence_summary"]["labs_available"]
    }
    risk = score_rejection_risk(risk_input)

    return {
        "extracted": extracted.model_dump(),
        "policy": policy,
        "evidence": evidence,
        "risk": risk
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)