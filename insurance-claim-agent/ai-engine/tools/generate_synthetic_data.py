"""
Regenerates enhanced_claims.csv and synthetic_hc_claims.csv with
realistic, learnable rejection logic instead of random labels.

Usage: python ai-engine/tools/generate_synthetic_data.py
Outputs → data/raw/enhanced_claims.csv
          data/raw/synthetic_hc_claims.csv
"""
import pandas as pd
import numpy as np
import os

np.random.seed(42)
RAW = "data/raw"
os.makedirs(RAW, exist_ok=True)

N_CLAIMS  = 4500
N_GAP     = 1000

# ── Shared lookup tables ─────────────────────────────────────────────────────
INSURERS = {
    "INS_A": {"base_denial": 0.20, "paper_penalty": 0.15},  # lenient
    "INS_B": {"base_denial": 0.30, "paper_penalty": 0.20},
    "INS_C": {"base_denial": 0.40, "paper_penalty": 0.25},  # strict
    "INS_D": {"base_denial": 0.35, "paper_penalty": 0.18},
    "INS_E": {"base_denial": 0.25, "paper_penalty": 0.10},
}

# High-cost procedures are denied more often
CPT_RISK = {
    "CPT_99213": 0.05,   # office visit — low risk
    "CPT_99214": 0.08,
    "CPT_27447": 0.30,   # knee replacement — high cost, often denied
    "CPT_63030": 0.28,   # lumbar discectomy
    "CPT_43239": 0.22,   # upper GI endoscopy
    "CPT_70553": 0.18,   # MRI brain
    "CPT_93306": 0.12,   # echocardiography
    "CPT_99283": 0.10,   # ED visit
    "CPT_36415": 0.03,   # routine venipuncture
    "CPT_71046": 0.08,   # chest X-ray
}

SPECIALTIES = ["Orthopedics", "Cardiology", "Neurology",
               "General Practice", "Emergency Medicine", "Radiology"]

LOCATIONS   = ["CA", "NY", "TX", "FL", "IL", "WA"]
GENDERS     = ["M", "F"]
MARITAL     = ["Single", "Married", "Divorced"]
EMPLOYMENT  = ["Employed", "Self-Employed", "Unemployed", "Retired"]
CLAIM_TYPES = ["Routine", "Inpatient", "Outpatient", "Emergency"]
METHODS     = ["Online", "Paper", "Phone"]
DX_CODES    = ["M51.1", "M17.11", "K80.20", "I10", "J18.9",
               "S72.001A", "Z00.00", "E11.9", "G43.909", "R10.9"]


# ══════════════════════════════════════════════════════════════════════════════
# 1. enhanced_claims.csv  (risk scorer training data)
# ══════════════════════════════════════════════════════════════════════════════
print("Generating enhanced_claims.csv...")

cpt_codes   = np.random.choice(list(CPT_RISK.keys()), N_CLAIMS)
insurer_ids = np.random.choice(list(INSURERS.keys()), N_CLAIMS)
methods     = np.random.choice(METHODS, N_CLAIMS, p=[0.60, 0.25, 0.15])
claim_types = np.random.choice(CLAIM_TYPES, N_CLAIMS, p=[0.40, 0.20, 0.25, 0.15])
ages        = np.random.randint(18, 85, N_CLAIMS)

# Claim amounts: correlated with procedure (high-cost CPTs → higher amounts)
base_amounts = {
    "CPT_99213": 150,  "CPT_99214": 250,  "CPT_27447": 18000,
    "CPT_63030": 15000,"CPT_43239": 3500, "CPT_70553": 2800,
    "CPT_93306": 1200, "CPT_99283": 800,  "CPT_36415": 35,
    "CPT_71046": 180,
}
claim_amounts = np.array([
    int(base_amounts[c] * np.random.uniform(0.7, 1.5))
    for c in cpt_codes
])

# ── Realistic denial probability ─────────────────────────────────────────────
def compute_denial_prob(cpt, insurer, method, claim_type, age, amount):
    p = INSURERS[insurer]["base_denial"]
    p += CPT_RISK[cpt]                                      # procedure risk
    if method == "Paper":
        p += INSURERS[insurer]["paper_penalty"]             # paper → more errors
    if claim_type == "Emergency":
        p -= 0.10                                           # emergency usually covered
    if claim_type == "Routine" and amount > 10000:
        p += 0.15                                           # expensive routine = suspicious
    if age > 70:
        p += 0.05                                           # elderly → more scrutiny
    if amount > 15000:
        p += 0.10                                           # very high cost → more scrutiny
    return np.clip(p, 0.02, 0.90)

denial_probs = np.array([
    compute_denial_prob(cpt_codes[i], insurer_ids[i], methods[i],
                        claim_types[i], ages[i], claim_amounts[i])
    for i in range(N_CLAIMS)
])

rand_draws = np.random.rand(N_CLAIMS)
statuses   = np.where(
    rand_draws < denial_probs, "Denied",
    np.where(rand_draws < denial_probs + 0.30, "Pending", "Approved")
)

enhanced = pd.DataFrame({
    "ClaimID":               [f"CLM_{i:05d}" for i in range(N_CLAIMS)],
    "PatientID":             [f"PAT_{i:05d}" for i in range(N_CLAIMS)],
    "ProviderID":            insurer_ids,
    "ClaimAmount":           claim_amounts,
    "ClaimDate":             pd.date_range("2023-01-01", periods=N_CLAIMS, freq="3h").strftime("%Y-%m-%d"),
    "DiagnosisCode":         np.random.choice(DX_CODES, N_CLAIMS),
    "ProcedureCode":         cpt_codes,
    "PatientAge":            ages,
    "PatientGender":         np.random.choice(GENDERS, N_CLAIMS),
    "ProviderSpecialty":     np.random.choice(SPECIALTIES, N_CLAIMS),
    "ClaimStatus":           statuses,
    "PatientIncome":         np.random.randint(25000, 150000, N_CLAIMS),
    "PatientMaritalStatus":  np.random.choice(MARITAL, N_CLAIMS),
    "PatientEmploymentStatus": np.random.choice(EMPLOYMENT, N_CLAIMS),
    "ProviderLocation":      np.random.choice(LOCATIONS, N_CLAIMS),
    "ClaimType":             claim_types,
    "ClaimSubmissionMethod": methods,
})

enhanced.to_csv(RAW + "/enhanced_claims.csv", index=False)
denial_rate = (enhanced["ClaimStatus"] == "Denied").mean()
print(f"  Saved {N_CLAIMS} rows  |  Denial rate: {denial_rate*100:.1f}%")


# ══════════════════════════════════════════════════════════════════════════════
# 2. synthetic_hc_claims.csv  (gap detector training data)
# ══════════════════════════════════════════════════════════════════════════════
print("Generating synthetic_hc_claims.csv...")

PROCEDURE_BASE_BILL = {
    "PROC_001": 500,   "PROC_002": 1200,  "PROC_003": 3000,
    "PROC_004": 8000,  "PROC_005": 15000, "PROC_006": 300,
    "PROC_007": 750,   "PROC_008": 200,   "PROC_009": 5000,
    "PROC_010": 2200,
}

INSURER_PAY_RATE = {
    "INS_A": 0.85, "INS_B": 0.70, "INS_C": 0.55,
    "INS_D": 0.65, "INS_E": 0.80,
}

AR_STATUSES     = ["Open", "Closed", "Pending", "On Hold", "Partially Paid", "Denied"]
CLAIM_STATUSES  = ["Paid", "Denied", "Under Review"]
INS_TYPES       = ["Commercial", "Medicare", "Medicaid", "Self-Pay"]

g_proc      = np.random.choice(list(PROCEDURE_BASE_BILL.keys()), N_GAP)
g_insurer   = np.random.choice(list(INSURER_PAY_RATE.keys()), N_GAP)
g_ins_type  = np.random.choice(INS_TYPES, N_GAP, p=[0.50, 0.25, 0.15, 0.10])
g_billed    = np.array([
    int(PROCEDURE_BASE_BILL[p] * np.random.uniform(0.8, 1.3))
    for p in g_proc
])
g_follow_up = np.random.choice(["Yes", "No"], N_GAP, p=[0.40, 0.60])
g_ar_status = np.random.choice(AR_STATUSES, N_GAP)

# ── Realistic gap probability ─────────────────────────────────────────────────
def compute_gap_prob(proc, insurer, ins_type, billed, follow_up, ar_status):
    base = 1.0 - INSURER_PAY_RATE[insurer]                  # strict insurers → more gaps
    if ins_type == "Medicaid":
        base += 0.20                                         # Medicaid denies more
    if ins_type == "Self-Pay":
        base += 0.30                                         # self-pay almost always gaps
    if billed > 5000:
        base += 0.15                                         # high-cost → more scrutiny
    if follow_up == "Yes":
        base += 0.10                                         # unresolved follow-up
    if ar_status in ["Open", "Pending", "On Hold"]:
        base += 0.12                                         # open AR → likely disputed
    if ar_status == "Denied":
        base += 0.35                                         # denied AR = almost certain gap
    return np.clip(base, 0.05, 0.95)

gap_probs = np.array([
    compute_gap_prob(g_proc[i], g_insurer[i], g_ins_type[i],
                     g_billed[i], g_follow_up[i], g_ar_status[i])
    for i in range(N_GAP)
])

gap_rand    = np.random.rand(N_GAP)
g_outcomes  = np.where(
    gap_rand < gap_probs * 0.5, "Denied",
    np.where(gap_rand < gap_probs, "Partially Paid", "Paid")
)

# Claim status: correlated with outcome but not perfectly so
g_claim_status = np.where(
    g_outcomes == "Paid", 
    np.random.choice(["Paid", "Under Review"], N_GAP, p=[0.85, 0.15]),
    np.random.choice(["Denied", "Under Review"], N_GAP, p=[0.60, 0.40])
)

g_pay_rate  = np.array([INSURER_PAY_RATE[i] for i in g_insurer])
g_allowed   = (g_billed * g_pay_rate * np.random.uniform(0.9, 1.0, N_GAP)).astype(int)
g_paid      = np.where(
    g_outcomes == "Paid", g_allowed,
    np.where(g_outcomes == "Partially Paid",
             (g_allowed * np.random.uniform(0.3, 0.7, N_GAP)).astype(int),
             0)
)

synthetic_hc = pd.DataFrame({
    "Claim ID":          [f"GAP_{i:04d}" for i in range(N_GAP)],
    "Provider ID":       g_insurer,
    "Patient ID":        [f"PT_{i:04d}" for i in range(N_GAP)],
    "Date of Service":   pd.date_range("2023-01-01", periods=N_GAP, freq="8h").strftime("%Y-%m-%d"),
    "Billed Amount":     g_billed,
    "Procedure Code":    g_proc,
    "Diagnosis Code":    np.random.choice(DX_CODES, N_GAP),
    "Allowed Amount":    g_allowed,
    "Paid Amount":       g_paid,
    "Insurance Type":    g_ins_type,
    "Claim Status":      g_claim_status,
    "Reason Code":       np.random.choice(["CO-4", "CO-11", "CO-97", "PR-1", "OA-23"], N_GAP),
    "Follow-up Required": g_follow_up,
    "AR Status":         g_ar_status,
    "Outcome":           g_outcomes,
})

synthetic_hc.to_csv(RAW + "/synthetic_hc_claims.csv", index=False)
gap_rate = synthetic_hc["Outcome"].isin(["Denied", "Partially Paid"]).mean()
print(f"  Saved {N_GAP} rows  |  Gap rate: {gap_rate*100:.1f}%")

print("\nDone! Now rerun: prepare_data.py → train_model.py → diagnose_data.py")