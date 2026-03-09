from __future__ import annotations


def extract_ehr_evidence(ehr: dict, requirements: list[str]) -> dict:
    text = str(ehr).lower()
    matched = []
    missing = []

    for req in requirements or []:
        r = (req or "").lower()
        hit = False
        if "mri" in r and "mri" in text:
            hit = True
        elif "x-ray" in r and ("x-ray" in text or "xray" in text):
            hit = True
        elif "ultrasound" in r and "ultrasound" in text:
            hit = True
        elif "physio" in r and "physio" in text:
            hit = True
        elif "cbc" in r and "blood" in text:
            hit = True

        if hit:
            matched.append({"requirement": req, "evidence": "Found supporting mention in EHR", "source": "ehr_json"})
        else:
            missing.append(req)

    return {"matchedEvidence": matched, "missingEvidence": missing}

