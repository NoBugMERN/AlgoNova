# ai-engine/data/mock_data.py
"""
All mock data required by the problem statement:
  - Patient EHR JSON (diagnosis history, 5 labs, medications, prior treatments)
  - Insurance policy rules (3 insurers × 3 procedures)
  - Surgeon recommendation notes (2 procedures)
  - Historical rejection log (10 past claims)
"""

# ── Patient EHRs ─────────────────────────────────────────────────────────────
PATIENT_EHR = {
    "PAT_001": {
        "patient_id":   "PAT_001",
        "name":         "Rajesh Kumar",
        "age":          58,
        "gender":       "Male",
        "diagnosis_history": [
            {"date": "2023-06-10", "icd10": "M51.1", "description": "Lumbar disc herniation with radiculopathy"},
            {"date": "2023-01-15", "icd10": "M54.5", "description": "Low back pain"},
            {"date": "2022-09-20", "icd10": "M54.4", "description": "Lumbago with sciatica"},
        ],
        "lab_reports": [
            {"id": "LAB_001", "type": "MRI Lumbar Spine",      "date": "2023-07-01", "result": "Large L4-L5 disc herniation with nerve root compression", "relevant": True},
            {"id": "LAB_002", "type": "X-Ray Lumbar Spine",    "date": "2023-05-15", "result": "Degenerative disc disease L4-L5, L5-S1",                  "relevant": True},
            {"id": "LAB_003", "type": "Complete Blood Count",  "date": "2023-07-10", "result": "WBC 7.2, RBC 4.8, Hemoglobin 14.2 — Normal",              "relevant": False},
            {"id": "LAB_004", "type": "Lipid Panel",           "date": "2023-06-20", "result": "Total cholesterol 195 mg/dL — Normal",                    "relevant": False},
            {"id": "LAB_005", "type": "Nerve Conduction Study","date": "2023-07-05", "result": "Abnormal — L4 radiculopathy confirmed",                   "relevant": True},
        ],
        "medications": [
            {"name": "Ibuprofen 400mg",   "start_date": "2023-01-15", "purpose": "Pain management"},
            {"name": "Gabapentin 300mg",  "start_date": "2023-06-10", "purpose": "Neuropathic pain"},
            {"name": "Cyclobenzaprine",   "start_date": "2023-06-10", "purpose": "Muscle relaxant"},
        ],
        "prior_treatments": [
            {"type": "Physical Therapy",      "duration": "6 weeks", "date": "2023-02-01", "outcome": "Partial relief, recurrence"},
            {"type": "Epidural Steroid Injection", "date": "2023-04-15", "outcome": "Temporary relief, symptoms returned"},
            {"type": "Chiropractic Care",     "duration": "4 weeks", "date": "2022-11-01", "outcome": "Minimal improvement"},
        ],
        "doctor_id":    "DR_101",
        "insurer_id":   "INS_C",
    },

    "PAT_002": {
        "patient_id":   "PAT_002",
        "name":         "Priya Sharma",
        "age":          64,
        "gender":       "Female",
        "diagnosis_history": [
            {"date": "2023-05-20", "icd10": "M17.11", "description": "Primary osteoarthritis, right knee"},
            {"date": "2022-12-10", "icd10": "M25.561","description": "Pain in right knee"},
        ],
        "lab_reports": [
            {"id": "LAB_006", "type": "X-Ray Right Knee",  "date": "2023-06-01", "result": "Severe joint space narrowing, osteophyte formation Grade 4", "relevant": True},
            {"id": "LAB_007", "type": "MRI Right Knee",    "date": "2023-06-20", "result": "Complete cartilage loss medial compartment",                  "relevant": True},
            {"id": "LAB_008", "type": "HbA1c",             "date": "2023-06-15", "result": "5.9% — Pre-diabetic range",                                   "relevant": False},
            {"id": "LAB_009", "type": "ESR",               "date": "2023-06-15", "result": "28 mm/hr — Mildly elevated",                                  "relevant": False},
            {"id": "LAB_010", "type": "Bone Density Scan", "date": "2023-05-30", "result": "T-score -1.8 — Osteopenia",                                   "relevant": False},
        ],
        "medications": [
            {"name": "Celecoxib 200mg", "start_date": "2022-12-10", "purpose": "Arthritis pain"},
            {"name": "Calcium + Vit D", "start_date": "2023-01-01", "purpose": "Bone health"},
        ],
        "prior_treatments": [
            {"type": "Physical Therapy",    "duration": "8 weeks", "date": "2023-01-10", "outcome": "No significant improvement"},
            {"type": "Corticosteroid Injection", "date": "2023-03-20", "outcome": "Relief lasted 6 weeks, pain returned"},
            {"type": "Hyaluronic Acid Injection","date": "2023-05-01", "outcome": "Minimal improvement"},
        ],
        "doctor_id":    "DR_202",
        "insurer_id":   "INS_A",
    },
}

# ── Insurance Policy Rules ───────────────────────────────────────────────────
INSURANCE_POLICY_RULES = {
    ("INS_A", "CPT_27447"): {   # INS_A + Knee Replacement
        "insurer": "INS_A", "procedure": "Total Knee Arthroplasty", "cpt": "CPT_27447",
        "required_documents": [
            "Surgeon Recommendation Letter",
            "X-Ray or MRI showing Grade 3/4 osteoarthritis",
            "Proof of failed conservative treatment (min 3 months)",
            "Certificate of Medical Necessity",
        ],
        "qualifying_icd10":   ["M17.11", "M17.12", "M17.31", "M17.9"],
        "preauth_timeline_days": 10,
        "max_approved_amount":   25000,
        "notes": "Conservative treatment must be documented for at least 3 months prior.",
    },
    ("INS_C", "CPT_63030"): {   # INS_C + Lumbar Discectomy
        "insurer": "INS_C", "procedure": "Lumbar Discectomy", "cpt": "CPT_63030",
        "required_documents": [
            "Surgeon Recommendation Letter",
            "MRI report confirming disc herniation",
            "Nerve Conduction Study or EMG",
            "Proof of failed conservative treatment (min 6 weeks)",
            "Certificate of Medical Necessity",
        ],
        "qualifying_icd10":   ["M51.1", "M51.16", "M51.17"],
        "preauth_timeline_days": 14,
        "max_approved_amount":   18000,
        "notes": "MRI must be within 6 months of surgery date. Conservative treatment must include PT.",
    },
    ("INS_B", "CPT_43239"): {   # INS_B + Upper GI Endoscopy
        "insurer": "INS_B", "procedure": "Upper GI Endoscopy with Biopsy", "cpt": "CPT_43239",
        "required_documents": [
            "Referring Physician Note",
            "Prior endoscopy report (if repeat procedure)",
            "H. pylori test result",
            "Certificate of Medical Necessity",
        ],
        "qualifying_icd10":   ["K25.9", "K27.9", "K29.70", "K21.0"],
        "preauth_timeline_days": 5,
        "max_approved_amount":   4500,
        "notes": "Prior endoscopy required if repeat procedure within 12 months.",
    },
}

# ── Surgeon Notes ────────────────────────────────────────────────────────────
SURGEON_NOTES = {
    "NOTE_001": """
    Patient: Rajesh Kumar | DOB: 1965-03-12 | ID: PAT_001
    Date: 2023-07-15 | Surgeon: Dr. Anil Mehta, MS Ortho

    I have evaluated Mr. Rajesh Kumar, a 58-year-old male presenting with severe lower back pain
    and left leg radiculopathy for over 14 months. MRI of the lumbar spine dated July 1, 2023
    confirms a large L4-L5 intervertebral disc herniation with significant nerve root compression.
    Nerve conduction studies confirm L4 radiculopathy.

    The patient has undergone 6 weeks of physical therapy, epidural steroid injections, and
    chiropractic care without sustained relief. Given the failure of conservative management
    and progressive neurological symptoms, I recommend a lumbar discectomy at L4-L5
    (CPT code: 63030, ICD-10: M51.1) as the appropriate surgical intervention.

    This procedure is medically necessary to prevent permanent neurological damage.
    """,

    "NOTE_002": """
    Patient: Priya Sharma | DOB: 1959-08-24 | ID: PAT_002
    Date: 2023-07-20 | Surgeon: Dr. Sunita Rao, MS Ortho

    Mrs. Priya Sharma, a 64-year-old female, presents with end-stage osteoarthritis of the
    right knee (Grade 4, Kellgren-Lawrence scale). X-ray and MRI confirm complete cartilage
    loss in the medial compartment with severe joint space narrowing.

    She has failed conservative treatment including 8 weeks of physical therapy, corticosteroid
    injections, and hyaluronic acid injections. Pain is now constant and significantly impairs
    her daily activities and quality of life.

    I recommend a total knee replacement (CPT: 27447, ICD-10: M17.11) as the only remaining
    treatment option. The procedure is medically necessary and urgent.
    """,
}

# ── Historical Rejection Log ─────────────────────────────────────────────────
REJECTION_LOG = [
    {"claim_id": "CLM_H001", "cpt": "CPT_63030", "insurer": "INS_C", "reason": "Missing MRI report",                          "resolved": True,  "resolution": "Attached MRI, resubmitted — approved"},
    {"claim_id": "CLM_H002", "cpt": "CPT_27447", "insurer": "INS_A", "reason": "Conservative treatment < 3 months",           "resolved": True,  "resolution": "Submitted PT records, approved on appeal"},
    {"claim_id": "CLM_H003", "cpt": "CPT_63030", "insurer": "INS_C", "reason": "ICD-10 code mismatch (M54.5 used, not M51.1)","resolved": True,  "resolution": "Corrected code, resubmitted — approved"},
    {"claim_id": "CLM_H004", "cpt": "CPT_43239", "insurer": "INS_B", "reason": "Missing Certificate of Medical Necessity",     "resolved": False, "resolution": None},
    {"claim_id": "CLM_H005", "cpt": "CPT_27447", "insurer": "INS_A", "reason": "X-Ray older than 12 months",                  "resolved": True,  "resolution": "New X-ray ordered, resubmitted"},
    {"claim_id": "CLM_H006", "cpt": "CPT_63030", "insurer": "INS_C", "reason": "No nerve conduction study on file",           "resolved": True,  "resolution": "NCS added, approved"},
    {"claim_id": "CLM_H007", "cpt": "CPT_27447", "insurer": "INS_A", "reason": "Surgeon letter missing procedure justification","resolved": True, "resolution": "Amended letter submitted"},
    {"claim_id": "CLM_H008", "cpt": "CPT_43239", "insurer": "INS_B", "reason": "Duplicate claim within 12 months",            "resolved": False, "resolution": None},
    {"claim_id": "CLM_H009", "cpt": "CPT_63030", "insurer": "INS_C", "reason": "MRI older than 6 months at submission",       "resolved": True,  "resolution": "Recent MRI attached, approved"},
    {"claim_id": "CLM_H010", "cpt": "CPT_27447", "insurer": "INS_A", "reason": "Missing Certificate of Medical Necessity",    "resolved": True,  "resolution": "CMN form submitted, approved"},
]