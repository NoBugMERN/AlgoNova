import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import pickle
import os

os.makedirs("data/models", exist_ok=True)

# ── 1. Train Risk Scorer ─────────────────────────────────────────────────────
print("Training rejection risk scorer...")
risk_df = pd.read_csv("data/processed/risk_training_data.csv").dropna()

# Encode categoricals
le_insurer = LabelEncoder()
le_cpt = LabelEncoder()
le_type = LabelEncoder()
le_method = LabelEncoder()

risk_df["insurer_enc"]  = le_insurer.fit_transform(risk_df["insurer_id"].astype(str))
risk_df["cpt_enc"]      = le_cpt.fit_transform(risk_df["cpt_code"].astype(str))
risk_df["type_enc"]     = le_type.fit_transform(risk_df["claim_type"].astype(str))
risk_df["method_enc"]   = le_method.fit_transform(risk_df["submission_method"].astype(str))

RISK_FEATURES = [
    "insurer_enc", "cpt_enc", "type_enc", "method_enc",
    "claim_amount", "patient_age",
    "is_high_amount", "is_paper_submission",
    "is_routine", "is_older_patient"
]

X = risk_df[RISK_FEATURES]
y = risk_df["label_rejected"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Use GradientBoosting — better than RandomForest for imbalanced data
risk_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    random_state=42
)
risk_model.fit(X_train, y_train)

print("\nRisk Scorer Report:")
print(classification_report(y_test, risk_model.predict(X_test)))

cv_scores = cross_val_score(risk_model, X, y, cv=5)
print(f"Cross-val accuracy: {cv_scores.mean()*100:.1f}% (+/- {cv_scores.std()*100:.1f}%)")

# Save model + encoders together
with open("data/models/risk_scorer.pkl", "wb") as f:
    pickle.dump({
        "model": risk_model,
        "features": RISK_FEATURES,
        "encoders": {
            "insurer": le_insurer,
            "cpt": le_cpt,
            "type": le_type,
            "method": le_method
        }
    }, f)
print("Saved → data/models/risk_scorer.pkl")

# ── 2. Train Gap Detector ────────────────────────────────────────────────────
print("\nTraining gap detector...")
gap_df = pd.read_csv("data/processed/gap_analysis_data.csv").dropna()

le_gap_insurer   = LabelEncoder()
le_gap_procedure = LabelEncoder()

gap_df["insurer_enc"]   = le_gap_insurer.fit_transform(gap_df["insurer_id"].astype(str))
gap_df["procedure_enc"] = le_gap_procedure.fit_transform(gap_df["procedure_id"].astype(str))

GAP_FEATURES = [
    "insurer_enc", "procedure_enc",
    "follow_up_required", "is_under_review",
    "is_pending_ar", "is_open_ar",
    "billed_vs_paid"
]

X_gap = gap_df[GAP_FEATURES]
y_gap = gap_df["label_has_gap"]

X_train_g, X_test_g, y_train_g, y_test_g = train_test_split(
    X_gap, y_gap, test_size=0.2, random_state=42, stratify=y_gap
)

gap_model = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    random_state=42
)
gap_model.fit(X_train_g, y_train_g)

print("\nGap Detector Report:")
print(classification_report(y_test_g, gap_model.predict(X_test_g)))

cv_scores_g = cross_val_score(gap_model, X_gap, y_gap, cv=5)
print(f"Cross-val accuracy: {cv_scores_g.mean()*100:.1f}% (+/- {cv_scores_g.std()*100:.1f}%)")

with open("data/models/gap_detector.pkl", "wb") as f:
    pickle.dump({
        "model": gap_model,
        "features": GAP_FEATURES,
        "encoders": {
            "insurer": le_gap_insurer,
            "procedure": le_gap_procedure
        }
    }, f)
print("Saved → data/models/gap_detector.pkl")

print("\nAll models trained and saved!")