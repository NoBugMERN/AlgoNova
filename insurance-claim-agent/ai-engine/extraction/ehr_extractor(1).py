import json

def get_patient_ehr(patient_id: str) -> dict:
    with open("data/mock/patient_ehr.json", "r") as f:
        ehr = json.load(f)
    if ehr["patient_id"] != patient_id:
        return {"error": f"Patient {patient_id} not found"}
    return ehr

def extract_ehr_evidence(ehr: dict, requirements: list) -> dict:
    relevant_labs = [
        lab for lab in ehr.get("lab_reports", [])
        if lab.get("relevant") == True
    ]
    available_doc_types = [lab["type"] for lab in ehr.get("lab_reports", [])]
    missing_docs = [
        req for req in requirements
        if not any(req.lower() in doc.lower() for doc in available_doc_types)
    ]
    matched_diagnoses = ehr.get("diagnosis_history", [])
    prior_treatments = ehr.get("prior_treatments", [])
    medications = ehr.get("medications", [])
    return {
        "patient_id": ehr.get("patient_id"),
        "patient_name": ehr.get("name"),
        "insurer_id": ehr.get("insurer_id"),
        "policy_number": ehr.get("policy_number"),
        "matched_diagnoses": matched_diagnoses,
        "relevant_labs": relevant_labs,
        "prior_treatments": prior_treatments,
        "medications": medications,
        "missing_documents": missing_docs,
        "evidence_summary": {
            "diagnosis_confirmed": len(matched_diagnoses) > 0,
            "labs_available": len(relevant_labs),
            "conservative_treatment_tried": len(prior_treatments) > 0,
            "missing_docs_count": len(missing_docs),
            "total_evidence_items": len(matched_diagnoses) + len(relevant_labs) + len(prior_treatments)
        }
    }

if __name__ == "__main__":
    with open("data/mock/patient_ehr.json", "r") as f:
        ehr = json.load(f)
    requirements = [
        "MRI Lumbar Spine",
        "Surgeon Recommendation Letter",
        "Physiotherapy Records",
        "Certificate of Medical Necessity"
    ]
    result = extract_ehr_evidence(ehr, requirements)
    print(json.dumps(result, indent=2))
