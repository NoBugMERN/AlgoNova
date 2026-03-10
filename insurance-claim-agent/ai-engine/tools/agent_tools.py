# ai-engine/tools/agent_tools.py
"""
Simulated tool implementations required by the problem statement:
  get_patient_ehr()
  get_insurance_policy_rules()
  lookup_icd10_code()
  check_document_availability()
  assemble_preauth_form()
  score_rejection_risk()        ← calls risk_predictor.py
  notify_doctor()
"""

import re
import json
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from data.mock_data import PATIENT_EHR, INSURANCE_POLICY_RULES, REJECTION_LOG
from tools.icd10_lookup import lookup_icd10_code          # existing tool


# ── 1. get_patient_ehr ───────────────────────────────────────────────────────
def get_patient_ehr(patient_id: str) -> dict:
    """Returns full EHR for a patient including diagnosis history, labs,
    medications, and prior treatments."""
    ehr = PATIENT_EHR.get(patient_id)
    if not ehr:
        return {"error": f"No EHR found for patient {patient_id}"}
    return ehr


# ── 2. get_insurance_policy_rules ────────────────────────────────────────────
def get_insurance_policy_rules(insurer_id: str, procedure_code: str) -> dict:
    """Returns required documents, qualifying ICD-10 codes, pre-auth
    timeline, and max approved amount for a given insurer + procedure."""
    key = (insurer_id.strip().upper(), procedure_code.strip().upper())
    rules = INSURANCE_POLICY_RULES.get(key)
    if not rules:
        return {"error": f"No policy rules found for {insurer_id} + {procedure_code}"}
    return rules


# ── 3. lookup_icd10_code (re-exported from existing tool) ────────────────────
# Already implemented in icd10_lookup.py — re-exported here for agent use.


# ── 4. check_document_availability ──────────────────────────────────────────
def check_document_availability(patient_id: str, document_type: str) -> dict:
    """
    Checks whether a specific document type is present in the patient's EHR.
    Returns found/not_found with the matching record if found.
    """
    ehr = PATIENT_EHR.get(patient_id, {})
    doc_lower = document_type.lower()

    # Map document type keywords → EHR fields to search
    KEYWORD_MAP = {
        "mri":                    ("lab_reports", ["mri"]),
        "x-ray":                  ("lab_reports", ["x-ray", "xray", "x ray"]),
        "nerve conduction":       ("lab_reports", ["nerve conduction", "ncs", "emg"]),
        "lab":                    ("lab_reports", []),
        "physical therapy":       ("prior_treatments", ["physical therapy", "physiotherapy", "pt"]),
        "conservative treatment": ("prior_treatments", []),
        "steroid injection":      ("prior_treatments", ["injection", "steroid"]),
        "medication":             ("medications", []),
        "surgeon":                (None, None),     # external document — never in EHR
        "certificate":            (None, None),     # external document — never in EHR
        "medical necessity":      (None, None),     # external document — never in EHR
        "prior endoscopy":        ("lab_reports", ["endoscopy"]),
        "h. pylori":              ("lab_reports", ["pylori", "h pylori"]),
    }

    matched_field, keywords = None, []
    for key, (field, kws) in KEYWORD_MAP.items():
        if key in doc_lower:
            matched_field, keywords = field, kws
            break

    # External documents (surgeon letter, CMN) are never auto-found in EHR
    if matched_field is None:
        return {
            "document_type": document_type,
            "status":        "NOT_FOUND",
            "reason":        "External document — must be provided by surgeon/billing team",
            "record":        None,
        }

    records = ehr.get(matched_field, [])
    for record in records:
        searchable = json.dumps(record).lower()
        if not keywords or any(kw in searchable for kw in keywords):
            return {
                "document_type": document_type,
                "status":        "FOUND",
                "record":        record,
            }

    return {
        "document_type": document_type,
        "status":        "NOT_FOUND",
        "reason":        f"No matching {document_type} found in patient EHR",
        "record":        None,
    }


# ── 5. assemble_preauth_form ─────────────────────────────────────────────────
def assemble_preauth_form(patient_id: str, procedure_code: str, evidence_map: dict) -> dict:
    """
    Assembles a pre-authorization form JSON with all required fields
    filled from the EHR evidence map.
    """
    ehr   = PATIENT_EHR.get(patient_id, {})
    rules = None
    insurer_id = ehr.get("insurer_id", "UNKNOWN")
    key = (insurer_id, procedure_code.upper())
    rules = INSURANCE_POLICY_RULES.get(key, {})

    # Relevant labs (filtered to procedure-relevant only)
    relevant_labs = [
        f"{lab['type']} ({lab['date']}): {lab['result']}"
        for lab in ehr.get("lab_reports", [])
        if lab.get("relevant")
    ]

    # Conservative treatments attempted
    prior_tx = [
        f"{tx['type']} — {tx.get('duration','')} — Outcome: {tx['outcome']}"
        for tx in ehr.get("prior_treatments", [])
    ]

    form = {
        "form_type":              "Pre-Authorization Request",
        "submission_date":        evidence_map.get("submission_date", "2023-07-22"),
        "patient": {
            "id":     patient_id,
            "name":   ehr.get("name"),
            "age":    ehr.get("age"),
            "gender": ehr.get("gender"),
        },
        "insurer_id":             insurer_id,
        "procedure": {
            "cpt_code":    procedure_code,
            "description": rules.get("procedure", evidence_map.get("procedure_description", "")),
        },
        "diagnosis": {
            "icd10_code":  evidence_map.get("icd10_code"),
            "description": evidence_map.get("diagnosis_description"),
            "confirmed_in_ehr": any(
                d["icd10"] == evidence_map.get("icd10_code")
                for d in ehr.get("diagnosis_history", [])
            ),
        },
        "supporting_evidence": {
            "relevant_lab_reports":       relevant_labs,
            "conservative_treatments":    prior_tx,
            "current_medications":        [m["name"] for m in ehr.get("medications", [])],
            "diagnosis_history_summary":  [
                f"{d['date']}: {d['icd10']} — {d['description']}"
                for d in ehr.get("diagnosis_history", [])
            ],
        },
        "submitted_documents":    evidence_map.get("available_documents", []),
        "missing_documents":      evidence_map.get("missing_documents", []),
        "max_approved_amount":    rules.get("max_approved_amount"),
        "preauth_timeline_days":  rules.get("preauth_timeline_days"),
        "policy_notes":           rules.get("notes"),
        "status":                 "READY_TO_SUBMIT" if not evidence_map.get("missing_documents") else "INCOMPLETE — MISSING DOCUMENTS",
    }
    return form


# ── 6. score_rejection_risk (bridge to risk_predictor.py) ───────────────────
def score_rejection_risk(claim_package: dict) -> dict:
    """
    Scores rejection risk using the hybrid rule-based + ML model.
    Enhances result with historical rejection patterns for similar claims.
    """
    # Import here to avoid circular dependency
    try:
        from tools.risk_predictor import score_rejection_risk as _score
        result = _score(claim_package)
    except Exception as e:
        result = {"level": "UNKNOWN", "score": 50, "error": str(e)}

    # Augment with historical pattern from rejection log
    cpt      = claim_package.get("cpt_code", "")
    insurer  = claim_package.get("insurer_id", "")
    historic = [r for r in REJECTION_LOG if r["cpt"] == cpt and r["insurer"] == insurer]

    if historic:
        result["historical_rejections"] = {
            "count":        len(historic),
            "common_reasons": list({r["reason"] for r in historic}),
            "warning":      f"{len(historic)} past rejection(s) found for {cpt} + {insurer} — review common reasons above",
        }
    else:
        result["historical_rejections"] = {"count": 0, "warning": "No historical rejections found for this combination"}

    return result


# ── 7. notify_doctor ─────────────────────────────────────────────────────────
def notify_doctor(doctor_id: str, missing_docs_list: list, patient_id: str = "", procedure: str = "") -> dict:
    """
    Sends (simulates) a gap alert to the treating doctor with specific,
    actionable requests for each missing document.
    """
    ACTIONABLE_REQUESTS = {
        "Surgeon Recommendation Letter":              "Please provide a signed recommendation letter specifying procedure ({procedure}), medical necessity, and failed conservative treatments.",
        "Certificate of Medical Necessity":           "Please complete and sign the Certificate of Medical Necessity (CMN) form for {procedure}.",
        "MRI report confirming disc herniation":      "Attach the most recent MRI report (must be within 6 months). If unavailable, please order a new MRI.",
        "Nerve Conduction Study or EMG":              "Attach NCS/EMG report confirming radiculopathy. If not performed, please order immediately.",
        "Proof of failed conservative treatment (min 6 weeks)": "Provide documented records of at least 6 weeks of physical therapy or other conservative treatment with outcomes.",
        "Proof of failed conservative treatment (min 3 months)": "Provide documented records of at least 3 months of conservative treatment (PT, injections, etc.) with outcomes.",
        "X-Ray or MRI showing Grade 3/4 osteoarthritis": "Attach X-Ray or MRI report confirming Grade 3 or 4 osteoarthritis (must be within 12 months).",
        "Referring Physician Note":                   "Provide a referral note from the patient's primary care physician for {procedure}.",
        "Prior endoscopy report (if repeat procedure)":"Attach the report from the previous endoscopy if this is a repeat procedure within 12 months.",
        "H. pylori test result":                      "Attach H. pylori test result (breath test, stool antigen, or biopsy).",
    }

    alerts = []
    for doc in missing_docs_list:
        action = ACTIONABLE_REQUESTS.get(doc, f"Please provide: {doc}")
        action = action.replace("{procedure}", procedure)
        alerts.append({"missing_document": doc, "action_required": action})

    notification = {
        "to":        doctor_id,
        "patient_id": patient_id,
        "subject":   f"ACTION REQUIRED: Missing documents for pre-authorization — {procedure}",
        "priority":  "HIGH" if len(missing_docs_list) >= 2 else "MEDIUM",
        "alerts":    alerts,
        "footer":    "Please provide the above documents within 48 hours to avoid delays in pre-authorization.",
        "status":    "SENT (simulated)",
    }
    return notification