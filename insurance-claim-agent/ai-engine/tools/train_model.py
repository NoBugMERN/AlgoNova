import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve
from sklearn.preprocessing import LabelEncoder
import pickle
import os

os.makedirs("data/models", exist_ok=True)

def find_best_threshold(model, X_val, y_val, beta=1.0):
    """
    Find threshold that maximises F-beta score on validation data.
    beta=1 → balanced precision/recall; beta=2 → prioritise recall (fewer missed rejections).
    """
    probs = model.predict_proba(X_val)[:, 1]
    precisions, recalls, thresholds = precision_recall_curve(y_val, probs)
    f_scores = ((1 + beta**2) * precisions * recalls) / (beta**2 * precisions + recalls + 1e-9)
    best_idx = np.argmax(f_scores[:-1])   # last element has no threshold
    return thresholds[best_idx], f_scores[best_idx]


# ── 1. Train Risk Scorer ─────────────────────────────────────────────────────
print("Training rejection risk scorer...")
risk_df = pd.read_csv("data/processed/risk_training_data.csv").dropna()

le_insurer = LabelEncoder()
le_cpt     = LabelEncoder()
le_type    = LabelEncoder()
le_method  = LabelEncoder()

risk_df["insurer_enc"]  = le_insurer.fit_transform(risk_df["insurer_id"].astype(str))
risk_df["cpt_enc"]      = le_cpt.fit_transform(risk_df["cpt_code"].astype(str))
risk_df["type_enc"]     = le_type.fit_transform(risk_df["claim_type"].astype(str))
risk_df["method_enc"]   = le_method.fit_transform(risk_df["submission_method"].astype(str))

RISK_FEATURES = [
    "insurer_enc", "cpt_enc", "type_enc", "method_enc",
    "claim_amount", "patient_age", "amount_vs_median",
    "is_high_amount", "is_very_high_amount",
    "is_paper_submission", "is_routine", "is_emergency",
    "is_older_patient", "is_pediatric", "age_bucket",
]
# Keep only columns that exist (graceful if prepare_data added them)
RISK_FEATURES = [f for f in RISK_FEATURES if f in risk_df.columns]

X = risk_df[RISK_FEATURES]
y = risk_df["label_rejected"]

# Hold out 20% for threshold tuning, then eval on the remaining 20%
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.2, random_state=42, stratify=y_temp
)

# FIX 1: class_weight='balanced' — critical for imbalanced labels
risk_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_leaf=5,
    class_weight="balanced",   # ← was missing entirely
    random_state=42,
    n_jobs=-1
)
risk_model.fit(X_train, y_train)

# FIX 2: tune decision threshold on validation set (not default 0.5)
best_thresh, best_f1 = find_best_threshold(risk_model, X_val, y_val, beta=1.5)
print(f"  Best threshold (F1.5): {best_thresh:.3f}  (val F-score: {best_f1:.3f})")

y_pred = (risk_model.predict_proba(X_test)[:, 1] >= best_thresh).astype(int)
auc    = roc_auc_score(y_test, risk_model.predict_proba(X_test)[:, 1])

print("\nRisk Scorer Report:")
print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {auc:.3f}   (threshold: {best_thresh:.3f})")

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_auc = cross_val_score(risk_model, X, y, cv=cv, scoring="roc_auc")
print(f"Cross-val ROC-AUC: {cv_auc.mean():.3f} (+/- {cv_auc.std():.3f})")

# FIX 3: log feature importances so you can see what actually matters
feat_imp = pd.Series(risk_model.feature_importances_, index=RISK_FEATURES)
print("\nTop feature importances (risk scorer):")
print(feat_imp.sort_values(ascending=False).to_string())

with open("data/models/risk_scorer.pkl", "wb") as f:
    pickle.dump({
        "model": risk_model,
        "features": RISK_FEATURES,
        "threshold": best_thresh,
        "encoders": {
            "insurer": le_insurer,
            "cpt": le_cpt,
            "type": le_type,
            "method": le_method
        }
    }, f)
print("\nSaved → data/models/risk_scorer.pkl")


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
    # FIX 4: removed billed_vs_paid (data leakage — it encodes the outcome)
    # Replaced with pre-outcome billing signals:
    "log_billed_amount", "billed_zscore",
]
GAP_FEATURES = [f for f in GAP_FEATURES if f in gap_df.columns]

X_gap = gap_df[GAP_FEATURES]
y_gap = gap_df["label_has_gap"]

X_temp_g, X_test_g, y_temp_g, y_test_g = train_test_split(
    X_gap, y_gap, test_size=0.2, random_state=42, stratify=y_gap
)
X_train_g, X_val_g, y_train_g, y_val_g = train_test_split(
    X_temp_g, y_temp_g, test_size=0.2, random_state=42, stratify=y_temp_g
)

gap_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    min_samples_leaf=5,
    class_weight="balanced",   # ← was missing entirely
    random_state=42,
    n_jobs=-1
)
gap_model.fit(X_train_g, y_train_g)

best_thresh_g, best_f1_g = find_best_threshold(gap_model, X_val_g, y_val_g, beta=1.5)
print(f"  Best threshold (F1.5): {best_thresh_g:.3f}  (val F-score: {best_f1_g:.3f})")

y_pred_g = (gap_model.predict_proba(X_test_g)[:, 1] >= best_thresh_g).astype(int)
auc_g    = roc_auc_score(y_test_g, gap_model.predict_proba(X_test_g)[:, 1])

print("\nGap Detector Report:")
print(classification_report(y_test_g, y_pred_g))
print(f"ROC-AUC: {auc_g:.3f}   (threshold: {best_thresh_g:.3f})")

cv_auc_g = cross_val_score(gap_model, X_gap, y_gap, cv=cv, scoring="roc_auc")
print(f"Cross-val ROC-AUC: {cv_auc_g.mean():.3f} (+/- {cv_auc_g.std():.3f})")

feat_imp_g = pd.Series(gap_model.feature_importances_, index=GAP_FEATURES)
print("\nTop feature importances (gap detector):")
print(feat_imp_g.sort_values(ascending=False).to_string())

with open("data/models/gap_detector.pkl", "wb") as f:
    pickle.dump({
        "model": gap_model,
        "features": GAP_FEATURES,
        "threshold": best_thresh_g,
        "encoders": {
            "insurer": le_gap_insurer,
            "procedure": le_gap_procedure
        }
    }, f)
print("\nSaved → data/models/gap_detector.pkl")

print("\nAll models trained and saved!")