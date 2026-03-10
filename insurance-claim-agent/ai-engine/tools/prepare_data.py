import pandas as pd
import numpy as np
import os

RAW = "data/raw"
PROCESSED = "data/processed"
os.makedirs(PROCESSED, exist_ok=True)

# ── 1. Clean ICD-10 codeset ──────────────────────────────────────────────────
print("Cleaning icd10_codeset.csv...")
icd = pd.read_csv(RAW + "/icd10_codeset.csv")

icd = icd.rename(columns={
    "ICDCode": "icd10_code",
    "Description": "description"
})
icd["icd10_code"] = icd["icd10_code"].str.strip()
icd["description"] = icd["description"].str.strip().str.lower()
icd = icd.dropna()
icd = icd.drop_duplicates(subset="icd10_code")

icd.to_csv(PROCESSED + "/icd10_lookup_clean.csv", index=False)
print(f"Saved {len(icd)} ICD-10 codes → processed/icd10_lookup_clean.csv")

# ── 2. Clean medical claims ──────────────────────────────────────────────────
print("\nCleaning medical_claims.csv...")
med = pd.read_csv(RAW + "/medical_claims.csv")

med = med[[
    "encounter_id",
    "patient_id",
    "MedicalCondition",
    "admission_type",
    "medication",
    "test_resultS",
    "insurance_provider_name"
]]

med = med.rename(columns={
    "MedicalCondition": "medical_condition",
    "test_resultS": "test_results"
})

med["medical_condition"] = med["medical_condition"].str.strip().str.lower()
med["medication"] = med["medication"].str.strip()
med = med.dropna(subset=["medical_condition"])

med.to_csv(PROCESSED + "/medical_claims_clean.csv", index=False)
print(f"Saved {len(med)} claims → processed/medical_claims_clean.csv")

# ── 3. Build risk_training_data.csv ─────────────────────────────────────────
print("\nBuilding risk_training_data.csv...")
enhanced = pd.read_csv(RAW + "/enhanced_claims.csv")

risk = pd.DataFrame()
risk["claim_id"]          = enhanced["ClaimID"]
risk["insurer_id"]        = enhanced["ProviderID"]
risk["cpt_code"]          = enhanced["ProcedureCode"]
risk["claim_amount"]      = enhanced["ClaimAmount"]
risk["patient_age"]       = enhanced["PatientAge"]
risk["claim_type"]        = enhanced["ClaimType"]
risk["submission_method"] = enhanced["ClaimSubmissionMethod"]

# ── Richer engineered features (keep continuous values, not just booleans) ──
amount_median = enhanced["ClaimAmount"].median()
amount_75p    = enhanced["ClaimAmount"].quantile(0.75)
amount_90p    = enhanced["ClaimAmount"].quantile(0.90)

risk["is_high_amount"]      = (enhanced["ClaimAmount"] > amount_median).astype(int)
risk["is_very_high_amount"] = (enhanced["ClaimAmount"] > amount_90p).astype(int)
risk["amount_vs_median"]    = enhanced["ClaimAmount"] / (amount_median + 1)   # ratio, not binary

risk["is_paper_submission"] = (enhanced["ClaimSubmissionMethod"] == "Paper").astype(int)
risk["is_routine"]          = (enhanced["ClaimType"] == "Routine").astype(int)
risk["is_emergency"]        = (enhanced["ClaimType"] == "Emergency").astype(int)

risk["is_older_patient"]    = (enhanced["PatientAge"] > 60).astype(int)
risk["is_pediatric"]        = (enhanced["PatientAge"] < 18).astype(int)
risk["age_bucket"]          = pd.cut(
    enhanced["PatientAge"],
    bins=[0, 18, 35, 50, 65, 120],
    labels=[0, 1, 2, 3, 4],
    include_lowest=True         # catches age == 0 edge case
).cat.add_categories(-1).fillna(-1).astype(int)  # -1 = unknown age

# Label: 1 = rejected/denied
risk["label_rejected"] = (enhanced["ClaimStatus"] == "Denied").astype(int)

risk = risk.dropna()
risk.to_csv(PROCESSED + "/risk_training_data.csv", index=False)
print(f"Saved {len(risk)} rows → processed/risk_training_data.csv")
print(f"Rejection rate: {risk['label_rejected'].mean()*100:.1f}%")

# ── 4. Build gap_analysis_data.csv ──────────────────────────────────────────
# FIX: Remove `billed_vs_paid` — it IS the label (data leakage).
# Use only features that would be known BEFORE the outcome.
print("\nBuilding gap_analysis_data.csv...")
synthetic = pd.read_csv(RAW + "/synthetic_hc_claims.csv")

gap = pd.DataFrame()
gap["case_id"]      = synthetic["Claim ID"]
gap["insurer_id"]   = synthetic["Provider ID"]
gap["procedure_id"] = synthetic["Procedure Code"]

# Features knowable BEFORE outcome is determined
gap["follow_up_required"] = (synthetic["Follow-up Required"] == "Yes").astype(int)
gap["is_under_review"]    = (synthetic["Claim Status"] == "Under Review").astype(int)
gap["is_pending_ar"]      = (synthetic["AR Status"] == "Pending").astype(int)
gap["is_open_ar"]         = (synthetic["AR Status"] == "Open").astype(int)

# Billed amount alone (not ratio with paid — paid is post-outcome)
gap["billed_amount"]      = synthetic["Billed Amount"]
gap["log_billed_amount"]  = np.log1p(synthetic["Billed Amount"])

# Is billed amount unusually high for this procedure? (z-score per procedure)
gap["billed_zscore"] = (
    gap.groupby("procedure_id")["billed_amount"]
    .transform(lambda x: (x - x.mean()) / (x.std() + 1e-9))
)

# Label: 1 = has a gap (denied or partially paid)
gap["label_has_gap"] = (
    synthetic["Outcome"].isin(["Denied", "Partially Paid"])
).astype(int)

gap = gap.dropna()
gap.to_csv(PROCESSED + "/gap_analysis_data.csv", index=False)
print(f"Saved {len(gap)} rows → processed/gap_analysis_data.csv")
print(f"Gap rate: {gap['label_has_gap'].mean()*100:.1f}%")

print("\nAll preprocessing done!")