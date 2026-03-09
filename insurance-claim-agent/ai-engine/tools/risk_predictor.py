import pickle
import numpy as np

# Load models
with open("data/models/risk_scorer.pkl", "rb") as f:
    risk_bundle = pickle.load(f)

with open("data/models/gap_detector.pkl", "rb") as f:
    gap_bundle = pickle.load(f)

risk_model = risk_bundle["model"]
gap_model  = gap_bundle["model"]

# ── Hybrid Risk Scorer ───────────────────────────────────────────────────────
def score_rejection_risk(claim_package: dict) -> dict:
    """
    Hybrid: rule-based logic (primary) + ML model (secondary signal)
    This is more explainable and reliable than pure ML on synthetic data.
    """
    missing_docs   = claim_package.get("missing_documents", [])
    missing_count  = len(missing_docs)
    icd10_code     = claim_package.get("icd10_code", "")
    insurer_id     = claim_package.get("insurer_id", "")
    cpt_code       = claim_package.get("cpt_code", "")
    diagnosis_ok   = claim_package.get("diagnosis_confirmed", False)
    conservative   = claim_package.get("conservative_treatment_tried", False)
    labs_available = claim_package.get("labs_available", 0)

    factors = []
    score   = 100  # Start at 100, deduct for issues

    # ── Rule-based deductions ────────────────────────────────────────────────
    if missing_count == 0:
        factors.append({"factor": "All required documents present", "impact": 0, "positive": True})
    elif missing_count == 1:
        score -= 20
        factors.append({"factor": f"1 document missing: {missing_docs[0]}", "impact": -20, "positive": False})
    elif missing_count == 2:
        score -= 40
        factors.append({"factor": f"2 documents missing", "impact": -40, "positive": False})
    else:
        score -= 60
        factors.append({"factor": f"{missing_count} documents missing — high rejection risk", "impact": -60, "positive": False})

    if diagnosis_ok:
        factors.append({"factor": "Diagnosis confirmed in EHR", "impact": 0, "positive": True})
    else:
        score -= 25
        factors.append({"factor": "Diagnosis not confirmed in EHR", "impact": -25, "positive": False})

    if conservative:
        factors.append({"factor": "Conservative treatment documented", "impact": 0, "positive": True})
    else:
        score -= 15
        factors.append({"factor": "No conservative treatment history", "impact": -15, "positive": False})

    if labs_available >= 2:
        factors.append({"factor": f"{labs_available} relevant lab reports available", "impact": 0, "positive": True})
    elif labs_available == 1:
        score -= 10
        factors.append({"factor": "Only 1 relevant lab report found", "impact": -10, "positive": False})
    else:
        score -= 20
        factors.append({"factor": "No relevant lab reports found", "impact": -20, "positive": False})

    # ── ML model as additional signal ────────────────────────────────────────
    try:
        encoders = risk_bundle["encoders"]
        insurer_enc  = encoders["insurer"].transform([str(insurer_id)])[0]
        cpt_enc      = encoders["cpt"].transform([str(cpt_code)])[0]
        type_enc     = encoders["type"].transform(["Routine"])[0]
        method_enc   = encoders["method"].transform(["Online"])[0]

        features = [[insurer_enc, cpt_enc, type_enc, method_enc,
                     50000, 45, 0, 0, 1, 0]]
        ml_prob = risk_model.predict_proba(features)[0][1]

        if ml_prob > 0.5:
            score -= 10
            factors.append({"factor": f"ML model flags similar claims as high risk ({ml_prob*100:.0f}% probability)", "impact": -10, "positive": False})
        else:
            factors.append({"factor": f"ML model shows low rejection probability ({ml_prob*100:.0f}%)", "impact": 0, "positive": True})
    except Exception:
        pass  # ML signal is optional — rule-based always works

    # ── Final level ──────────────────────────────────────────────────────────
    score = max(0, min(100, score))

    if score >= 75:
        level = "LOW"
        color = "green"
        message = "Claim is well-documented. Safe to submit."
    elif score >= 50:
        level = "MEDIUM"
        color = "amber"
        message = "Some gaps detected. Review before submitting."
    else:
        level = "HIGH"
        color = "red"
        message = "Critical issues detected. Do not submit until resolved."

    return {
        "level": level,
        "score": score,
        "color": color,
        "message": message,
        "factors": factors,
        "missing_documents": missing_docs
    }


# ── Test ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    test_claim = {
        "insurer_id": "INS_A",
        "cpt_code": "CPT_63030",
        "icd10_code": "M51.1",
        "missing_documents": ["Surgeon Recommendation Letter", "Certificate of Medical Necessity"],
        "diagnosis_confirmed": True,
        "conservative_treatment_tried": True,
        "labs_available": 2
    }

    result = score_rejection_risk(test_claim)
    print(json.dumps(result, indent=2))