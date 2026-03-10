import pickle
import numpy as np

# Load models
with open("../data/models/risk_scorer.pkl", "rb") as f:
    risk_bundle = pickle.load(f)

with open("../data/models/gap_detector.pkl", "rb") as f:
    gap_bundle = pickle.load(f)

risk_model = risk_bundle["model"]
gap_model  = gap_bundle["model"]


# ── Hybrid Risk Scorer ───────────────────────────────────────────────────────
def score_rejection_risk(claim_package: dict) -> dict:
    """
    Hybrid: rule-based logic (primary) + ML model (secondary signal).
    Rule layer is explainable and reliable; ML layer adds pattern-based signal.
    """
    missing_docs   = claim_package.get("missing_documents", [])
    missing_count  = len(missing_docs)
    icd10_code     = claim_package.get("icd10_code", "")
    insurer_id     = claim_package.get("insurer_id", "")
    cpt_code       = claim_package.get("cpt_code", "")
    diagnosis_ok   = claim_package.get("diagnosis_confirmed", False)
    conservative   = claim_package.get("conservative_treatment_tried", False)
    labs_available = claim_package.get("labs_available", 0)

    # FIX: use real claim fields instead of hardcoded dummies
    claim_amount      = claim_package.get("claim_amount", 50000)
    patient_age       = claim_package.get("patient_age", 45)
    claim_type        = claim_package.get("claim_type", "Routine")
    submission_method = claim_package.get("submission_method", "Online")

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
        factors.append({"factor": "2 documents missing", "impact": -40, "positive": False})
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
        threshold = risk_bundle.get("threshold", 0.5)

        # FIX: encode real values from claim_package, fall back gracefully for unseen labels
        def safe_encode(encoder, value):
            classes = list(encoder.classes_)
            return classes.index(str(value)) if str(value) in classes else 0

        insurer_enc  = safe_encode(encoders["insurer"], insurer_id)
        cpt_enc      = safe_encode(encoders["cpt"], cpt_code)
        type_enc     = safe_encode(encoders["type"], claim_type)
        method_enc   = safe_encode(encoders["method"], submission_method)

        # Derive engineered features the same way as training
        # amount_vs_median: approximate median from training if not stored
        amount_median = risk_bundle.get("amount_median", 50000)
        amount_vs_median    = claim_amount / (amount_median + 1)
        is_high_amount      = int(claim_amount > amount_median)
        is_very_high_amount = int(claim_amount > risk_bundle.get("amount_90p", 100000))
        is_paper_submission = int(submission_method == "Paper")
        is_routine          = int(claim_type == "Routine")
        is_emergency        = int(claim_type == "Emergency")
        is_older_patient    = int(patient_age > 60)
        is_pediatric        = int(patient_age < 18)
        age_bucket          = (0 if patient_age < 18 else
                               1 if patient_age < 35 else
                               2 if patient_age < 50 else
                               3 if patient_age < 65 else 4)

        # Build feature vector aligned to training feature order
        feature_map = {
            "insurer_enc": insurer_enc, "cpt_enc": cpt_enc,
            "type_enc": type_enc, "method_enc": method_enc,
            "claim_amount": claim_amount, "patient_age": patient_age,
            "amount_vs_median": amount_vs_median,
            "is_high_amount": is_high_amount,
            "is_very_high_amount": is_very_high_amount,
            "is_paper_submission": is_paper_submission,
            "is_routine": is_routine, "is_emergency": is_emergency,
            "is_older_patient": is_older_patient,
            "is_pediatric": is_pediatric, "age_bucket": age_bucket,
        }
        features = [[feature_map[f] for f in risk_bundle["features"]]]

        ml_prob = risk_model.predict_proba(features)[0][1]

        if ml_prob >= threshold:
            score -= 10
            factors.append({
                "factor": f"ML model flags similar claims as high risk ({ml_prob*100:.0f}% probability)",
                "impact": -10,
                "positive": False
            })
        else:
            factors.append({
                "factor": f"ML model shows low rejection probability ({ml_prob*100:.0f}%)",
                "impact": 0,
                "positive": True
            })
    except Exception as e:
        # ML signal is optional — rule-based layer always runs
        factors.append({"factor": f"ML signal unavailable ({e})", "impact": 0, "positive": True})

    # ── Final level ──────────────────────────────────────────────────────────
    score = max(0, min(100, score))

    if score >= 75:
        level, color = "LOW", "green"
        message = "Claim is well-documented. Safe to submit."
    elif score >= 50:
        level, color = "MEDIUM", "amber"
        message = "Some gaps detected. Review before submitting."
    else:
        level, color = "HIGH", "red"
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
        "claim_amount": 85000,          # now passed through to ML model
        "patient_age": 58,              # now passed through to ML model
        "claim_type": "Routine",
        "submission_method": "Paper",   # paper → higher risk
        "missing_documents": ["Surgeon Recommendation Letter", "Certificate of Medical Necessity"],
        "diagnosis_confirmed": True,
        "conservative_treatment_tried": True,
        "labs_available": 2
    }

    result = score_rejection_risk(test_claim)
    print(json.dumps(result, indent=2))