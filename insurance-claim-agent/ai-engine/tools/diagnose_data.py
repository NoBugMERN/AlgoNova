"""
Run this to diagnose whether your raw data has learnable signal.
Usage: python ai-engine/tools/diagnose_data.py
"""
import pandas as pd
import numpy as np
from scipy import stats

RAW = "data/raw"
PROCESSED = "data/processed"

print("=" * 60)
print("RISK DATA DIAGNOSIS")
print("=" * 60)

enhanced = pd.read_csv(RAW + "/enhanced_claims.csv")
print(f"\nColumns: {list(enhanced.columns)}")
print(f"Shape: {enhanced.shape}")
print(f"\nClaimStatus distribution:\n{enhanced['ClaimStatus'].value_counts()}")

denied  = enhanced[enhanced["ClaimStatus"] == "Denied"]
allowed = enhanced[enhanced["ClaimStatus"] != "Denied"]

print(f"\n--- ClaimAmount ---")
print(f"  Denied  mean: ${denied['ClaimAmount'].mean():,.0f}   median: ${denied['ClaimAmount'].median():,.0f}")
print(f"  Allowed mean: ${allowed['ClaimAmount'].mean():,.0f}   median: ${allowed['ClaimAmount'].median():,.0f}")
t, p = stats.ttest_ind(denied["ClaimAmount"].dropna(), allowed["ClaimAmount"].dropna())
print(f"  t-test p-value: {p:.4f}  {'✓ significant' if p < 0.05 else '✗ NOT significant — no signal'}")

print(f"\n--- PatientAge ---")
print(f"  Denied  mean: {denied['PatientAge'].mean():.1f}")
print(f"  Allowed mean: {allowed['PatientAge'].mean():.1f}")
t, p = stats.ttest_ind(denied["PatientAge"].dropna(), allowed["PatientAge"].dropna())
print(f"  t-test p-value: {p:.4f}  {'✓ significant' if p < 0.05 else '✗ NOT significant — no signal'}")

print(f"\n--- ClaimSubmissionMethod vs rejection rate ---")
print(enhanced.groupby("ClaimSubmissionMethod")["ClaimStatus"].apply(
    lambda x: (x == "Denied").mean()
).rename("rejection_rate").round(3))

print(f"\n--- ClaimType vs rejection rate ---")
print(enhanced.groupby("ClaimType")["ClaimStatus"].apply(
    lambda x: (x == "Denied").mean()
).rename("rejection_rate").round(3))

print(f"\n--- Top 10 ProviderID rejection rates (min 20 claims) ---")
prov = enhanced.groupby("ProviderID").agg(
    total=("ClaimStatus", "count"),
    rejection_rate=("ClaimStatus", lambda x: (x == "Denied").mean())
).query("total >= 20").sort_values("rejection_rate", ascending=False)
print(prov.head(10))

print("\n" + "=" * 60)
print("GAP DATA DIAGNOSIS")
print("=" * 60)

synthetic = pd.read_csv(RAW + "/synthetic_hc_claims.csv")
print(f"\nColumns: {list(synthetic.columns)}")
print(f"\nOutcome distribution:\n{synthetic['Outcome'].value_counts()}")

has_gap = synthetic[synthetic["Outcome"].isin(["Denied", "Partially Paid"])]
no_gap  = synthetic[~synthetic["Outcome"].isin(["Denied", "Partially Paid"])]

print(f"\n--- AR Status vs gap rate ---")
print(synthetic.groupby("AR Status")["Outcome"].apply(
    lambda x: x.isin(["Denied", "Partially Paid"]).mean()
).rename("gap_rate").round(3))

print(f"\n--- Claim Status vs gap rate ---")
print(synthetic.groupby("Claim Status")["Outcome"].apply(
    lambda x: x.isin(["Denied", "Partially Paid"]).mean()
).rename("gap_rate").round(3))

print(f"\n--- Follow-up Required vs gap rate ---")
print(synthetic.groupby("Follow-up Required")["Outcome"].apply(
    lambda x: x.isin(["Denied", "Partially Paid"]).mean()
).rename("gap_rate").round(3))

print(f"\n--- Billed Amount ---")
print(f"  Has gap mean:  ${has_gap['Billed Amount'].mean():,.0f}")
print(f"  No gap mean:   ${no_gap['Billed Amount'].mean():,.0f}")
t, p = stats.ttest_ind(has_gap["Billed Amount"].dropna(), no_gap["Billed Amount"].dropna())
print(f"  t-test p-value: {p:.4f}  {'✓ significant' if p < 0.05 else '✗ NOT significant — no signal'}")

print(f"\n--- Paid Amount vs gap (WARNING: this is leakage if included as feature) ---")
print(f"  Has gap paid mean:  ${has_gap['Paid Amount'].mean():,.0f}")
print(f"  No gap paid mean:   ${no_gap['Paid Amount'].mean():,.0f}")

print("\n✓ Diagnosis complete. Look for '✗ NOT significant' lines — those explain poor AUC.")