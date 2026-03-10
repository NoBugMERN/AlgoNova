# ai-engine/agent.py
"""
InsuranceClaimOptimizationAgent
================================
Orchestrates the full 7-step pre-authorization pipeline:
  1. Parse surgeon note → extract procedure, ICD-10, CPT
  2. Retrieve insurance policy rules
  3. Extract EHR supporting evidence
  4. Proactive gap analysis
  5. Assemble pre-auth form
  6. Score rejection risk
  7. Deliver submission-ready package

Bonus: Auto-draft appeal letter on rejection.

Usage:
  python ai-engine/agent.py --patient PAT_001 --note NOTE_001
  python ai-engine/agent.py --patient PAT_002 --note NOTE_002
  python ai-engine/agent.py --appeal CLM_H004
"""

import json
import re
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from data.mock_data import SURGEON_NOTES, REJECTION_LOG
from tools.agent_tools import (
    get_patient_ehr,
    get_insurance_policy_rules,
    check_document_availability,
    assemble_preauth_form,
    score_rejection_risk,
    notify_doctor,
)
from tools.icd10_lookup import lookup_icd10_code


# ── Formatting helpers ────────────────────────────────────────────────────────
def header(text):
    print(f"\n{'═'*62}")
    print(f"  {text}")
    print(f"{'═'*62}")

def section(text):
    print(f"\n── {text} {'─' * (55 - len(text))}")

def ok(text):  print(f"  ✅  {text}")
def warn(text):print(f"  ⚠️   {text}")
def err(text): print(f"  ❌  {text}")
def info(text):print(f"  ℹ️   {text}")


# ════════════════════════════════════════════════════════════════════════════
# STEP 1 — Parse surgeon note
# ════════════════════════════════════════════════════════════════════════════
def parse_surgeon_note(note_text: str) -> dict:
    """
    Extracts procedure, CPT code, and ICD-10 code from free-text surgeon note
    using regex patterns. Falls back to ICD-10 lookup if code not explicit.
    """
    # CPT code
    cpt_match = re.search(r'CPT[\s_]?(?:code)?[\s:_#]*(\d{5})', note_text, re.IGNORECASE)
    cpt_code  = f"CPT_{cpt_match.group(1)}" if cpt_match else None

    # ICD-10 code
    icd_match  = re.search(r'ICD-?10[:\s]*([\w]\d{2}\.?\w*)', note_text, re.IGNORECASE)
    icd10_code = icd_match.group(1) if icd_match else None

    # Procedure description (sentence containing CPT mention)
    proc_match = re.search(r'recommend[^\.\n]+(CPT[^\.\n]+)', note_text, re.IGNORECASE)
    procedure  = proc_match.group(0).strip() if proc_match else "See surgeon note"

    # Diagnosis description (fallback: lookup from ICD-10)
    diag_desc  = None
    if icd10_code:
        matches   = lookup_icd10_code(icd10_code)
        diag_desc = matches[0]["description"] if matches else None

    return {
        "cpt_code":              cpt_code,
        "icd10_code":            icd10_code,
        "procedure_description": procedure,
        "diagnosis_description": diag_desc,
        "raw_note":              note_text.strip(),
    }


# ════════════════════════════════════════════════════════════════════════════
# MAIN AGENT PIPELINE
# ════════════════════════════════════════════════════════════════════════════
def run_agent(patient_id: str, note_id: str) -> dict:
    header(f"INSURANCE CLAIM OPTIMIZATION AGENT")
    print(f"  Patient: {patient_id}  |  Note: {note_id}")

    # ── STEP 1: Parse surgeon note ───────────────────────────────────────────
    section("STEP 1 — Parsing Surgeon Note")
    note_text = SURGEON_NOTES.get(note_id)
    if not note_text:
        err(f"Surgeon note {note_id} not found.")
        return {}

    parsed = parse_surgeon_note(note_text)
    cpt_code  = parsed["cpt_code"]
    icd10     = parsed["icd10_code"]
    ok(f"Procedure CPT: {cpt_code}")
    ok(f"Diagnosis ICD-10: {icd10} — {parsed['diagnosis_description'] or 'see EHR'}")

    # ── STEP 2: Retrieve insurance policy rules ──────────────────────────────
    section("STEP 2 — Retrieving Insurance Policy Rules")
    ehr = get_patient_ehr(patient_id)
    if "error" in ehr:
        err(ehr["error"]); return {}

    insurer_id = ehr["insurer_id"]

    if not cpt_code:
        err("Could not extract CPT code from surgeon note. Check note format.")
        return {}

    rules = get_insurance_policy_rules(insurer_id, cpt_code)
    if "error" in rules:
        warn(rules["error"])
        rules = {}
    else:
        ok(f"Insurer: {insurer_id}  |  Procedure: {rules['procedure']}")
        ok(f"Pre-auth timeline: {rules['preauth_timeline_days']} days  |  Max approved: ${rules['max_approved_amount']:,}")
        info(f"Policy note: {rules.get('notes','')}")

    required_docs     = rules.get("required_documents", [])
    qualifying_icd10  = rules.get("qualifying_icd10", [])

    # ICD-10 qualification check
    if qualifying_icd10:
        if icd10 in qualifying_icd10:
            ok(f"ICD-10 {icd10} qualifies under policy")
        else:
            warn(f"ICD-10 {icd10} NOT in qualifying codes: {qualifying_icd10}")
            # Try to find a better code from EHR
            for dx in ehr.get("diagnosis_history", []):
                if dx["icd10"] in qualifying_icd10:
                    icd10 = dx["icd10"]
                    warn(f"  → Using {icd10} from EHR diagnosis history instead")
                    break

    # ── STEP 3: Extract EHR supporting evidence ──────────────────────────────
    section("STEP 3 — Extracting EHR Supporting Evidence")
    relevant_labs = [l for l in ehr.get("lab_reports", []) if l.get("relevant")]
    ok(f"Relevant lab reports: {len(relevant_labs)}/{len(ehr.get('lab_reports',[]))}")
    for lab in relevant_labs:
        info(f"  {lab['type']} ({lab['date']}): {lab['result'][:70]}")

    prior_tx = ehr.get("prior_treatments", [])
    ok(f"Prior conservative treatments: {len(prior_tx)}")
    for tx in prior_tx:
        info(f"  {tx['type']} — {tx['outcome']}")

    meds = ehr.get("medications", [])
    ok(f"Current medications: {', '.join(m['name'] for m in meds)}")

    # ── STEP 4: Proactive gap analysis ───────────────────────────────────────
    section("STEP 4 — Proactive Gap Analysis")
    available_docs = []
    missing_docs   = []

    for doc in required_docs:
        result = check_document_availability(patient_id, doc)
        if result["status"] == "FOUND":
            ok(f"FOUND:     {doc}")
            available_docs.append(doc)
        else:
            err(f"MISSING:   {doc}")
            missing_docs.append(doc)

    if missing_docs:
        warn(f"\n  {len(missing_docs)} document(s) missing — notifying Dr. {ehr['doctor_id']}")
        notification = notify_doctor(
            doctor_id    = ehr["doctor_id"],
            missing_docs_list = missing_docs,
            patient_id   = patient_id,
            procedure    = rules.get("procedure", cpt_code),
        )
        print(f"\n  📨 Notification to {notification['to']} [{notification['priority']} priority]")
        for alert in notification["alerts"]:
            print(f"     • {alert['missing_document']}")
            print(f"       → {alert['action_required']}")
    else:
        ok("All required documents present — no gaps detected!")

    # ── STEP 5: Assemble pre-auth form ───────────────────────────────────────
    section("STEP 5 — Assembling Pre-Authorization Form")
    evidence_map = {
        "icd10_code":            icd10,
        "diagnosis_description": parsed["diagnosis_description"],
        "procedure_description": rules.get("procedure", cpt_code),
        "available_documents":   available_docs,
        "missing_documents":     missing_docs,
        "submission_date":       "2023-07-22",
    }
    form = assemble_preauth_form(patient_id, cpt_code, evidence_map)
    ok(f"Form status: {form['status']}")
    ok(f"Evidence fields populated: {len(form['supporting_evidence']['relevant_lab_reports'])} labs, {len(form['supporting_evidence']['conservative_treatments'])} treatments")

    # ── STEP 6: Score rejection risk ─────────────────────────────────────────
    section("STEP 6 — Scoring Rejection Risk")
    claim_package = {
        "insurer_id":                   insurer_id,
        "cpt_code":                     cpt_code,
        "icd10_code":                   icd10,
        "claim_amount":                 rules.get("max_approved_amount", 10000),
        "patient_age":                  ehr.get("age", 45),
        "claim_type":                   "Inpatient",
        "submission_method":            "Online",
        "missing_documents":            missing_docs,
        "diagnosis_confirmed":          icd10 in [d["icd10"] for d in ehr.get("diagnosis_history", [])],
        "conservative_treatment_tried": len(prior_tx) > 0,
        "labs_available":               len(relevant_labs),
    }
    risk = score_rejection_risk(claim_package)

    RISK_ICONS = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🔴", "UNKNOWN": "⚪"}
    print(f"\n  {RISK_ICONS.get(risk['level'],'⚪')}  Risk Level: {risk['level']}  |  Score: {risk.get('score','N/A')}/100")
    print(f"  {risk.get('message','')}")
    for factor in risk.get("factors", []):
        icon = "✅" if factor["positive"] else "⚠️ "
        print(f"    {icon}  {factor['factor']}")
    hist = risk.get("historical_rejections", {})
    if hist.get("count", 0) > 0:
        warn(f"\n  Historical: {hist['warning']}")
        for r in hist.get("common_reasons", []):
            info(f"    Past rejection reason: {r}")

    # ── STEP 7: Deliver submission-ready package ─────────────────────────────
    section("STEP 7 — Submission-Ready Package")
    package = {
        "agent":          "InsuranceClaimOptimizationAgent v1.0",
        "patient_id":     patient_id,
        "patient_name":   ehr.get("name"),
        "insurer_id":     insurer_id,
        "cpt_code":       cpt_code,
        "icd10_code":     icd10,
        "risk_level":     risk["level"],
        "risk_score":     risk.get("score"),
        "risk_factors":   risk.get("factors", []),
        "preauth_form":   form,
        "ready_to_submit": len(missing_docs) == 0,
        "missing_docs":   missing_docs,
        "doctor_notified": ehr["doctor_id"] if missing_docs else None,
    }

    if package["ready_to_submit"]:
        ok("✅  Package is COMPLETE. Ready to submit to billing team.")
    else:
        warn(f"Package is INCOMPLETE. {len(missing_docs)} document(s) still required.")
        warn("Do NOT submit until missing documents are received.")

    # Save package to file
    out_path = f"data/output/package_{patient_id}_{cpt_code}.json"
    os.makedirs("data/output", exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(package, f, indent=2)
    ok(f"Package saved → {out_path}")

    return package


# ════════════════════════════════════════════════════════════════════════════
# BONUS — Auto-draft appeal letter on rejection
# ════════════════════════════════════════════════════════════════════════════
CORRECTIVE_ACTIONS = {
    "Missing MRI report":                          "Attach the most recent MRI report (within 6 months of surgery date).",
    "Conservative treatment < 3 months":           "Provide PT/treatment records spanning at least 3 months with documented outcomes.",
    "ICD-10 code mismatch":                        "Correct ICD-10 code to the qualifying code per policy (verify against insurer's qualifying list).",
    "Missing Certificate of Medical Necessity":    "Complete and attach a signed Certificate of Medical Necessity (CMN) from the treating surgeon.",
    "X-Ray older than 12 months":                  "Order updated X-Ray and attach the new report before resubmission.",
    "No nerve conduction study on file":           "Attach NCS/EMG report confirming neurological deficit.",
    "Surgeon letter missing procedure justification": "Amend surgeon recommendation letter to explicitly state medical necessity and failed conservative treatments.",
    "Duplicate claim within 12 months":            "Verify this is not a duplicate. If unique, attach clinical notes justifying repeat procedure.",
    "MRI older than 6 months at submission":       "Attach a new MRI ordered within 6 months of the planned surgery date.",
}

def draft_appeal_letter(claim_id: str) -> str:
    """
    Bonus: Given a rejected claim ID, identifies rejection reason,
    maps to corrective action, and drafts an appeal letter.
    """
    header(f"BONUS — Auto-Drafting Appeal Letter for {claim_id}")

    rejection = next((r for r in REJECTION_LOG if r["claim_id"] == claim_id), None)
    if not rejection:
        err(f"Claim {claim_id} not found in rejection log.")
        return ""

    reason = rejection["reason"]
    action = None
    for key, fix in CORRECTIVE_ACTIONS.items():
        if key.lower() in reason.lower() or reason.lower() in key.lower():
            action = fix
            break
    if not action:
        action = f"Please review the rejection reason '{reason}' and attach supporting documentation."

    ok(f"Rejection reason identified: {reason}")
    ok(f"Corrective action: {action}")

    letter = f"""
═══════════════════════════════════════════════════════════════
INSURANCE CLAIM APPEAL LETTER
═══════════════════════════════════════════════════════════════

Date: 2023-08-01
Claim ID: {claim_id}
Procedure CPT: {rejection['cpt']}
Insurer: {rejection['insurer']}

To Whom It May Concern,

We are writing to formally appeal the denial of claim {claim_id}
for procedure {rejection['cpt']} submitted to {rejection['insurer']}.

REASON FOR DENIAL (as communicated):
  {reason}

CORRECTIVE ACTION TAKEN:
  {action}

We respectfully request that this claim be reviewed again in
light of the additional documentation now provided. This
procedure is medically necessary as documented in the attached
supporting evidence, including physician notes, lab reports,
and proof of failed conservative treatment.

We request a response within the standard appeal review period.
Please contact our billing team with any questions.

Sincerely,
Revenue Cycle Team
[Hospital / Clinic Name]

[READY FOR BILLING TEAM REVIEW AND SIGNATURE]
═══════════════════════════════════════════════════════════════
"""
    print(letter)

    out_path = f"data/output/appeal_{claim_id}.txt"
    os.makedirs("data/output", exist_ok=True)
    with open(out_path, "w") as f:
        f.write(letter)
    ok(f"Appeal letter saved → {out_path}")
    return letter


# ── CLI entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Insurance Claim Optimization Agent")
    parser.add_argument("--patient", default="PAT_001", help="Patient ID")
    parser.add_argument("--note",    default="NOTE_001", help="Surgeon note ID")
    parser.add_argument("--appeal",  default=None,       help="Claim ID to draft appeal for")
    args = parser.parse_args()

    if args.appeal:
        draft_appeal_letter(args.appeal)
    else:
        run_agent(args.patient, args.note)