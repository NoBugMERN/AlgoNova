const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();
const { appendSubmittedClaim, notifyDoctor } = require("../lib/claimStore");
const { assemblePreauthForm } = require("../lib/preauthForm");

const FASTAPI_URL = "http://localhost:8001";
const TIMEOUT_MS  = 60000;

async function readJson(filename) {
  const p = path.join(__dirname, "..", "..", "data", "mock", filename);
  return JSON.parse(await fs.readFile(p, "utf-8"));
}

function applyEhrOverrides(ehr, body, parsedNote) {
  if (!ehr || typeof ehr !== "object") return ehr;
  const {
    patientName,
    age,
    gender,
    insurerId,
    doctorId,
    diagnosisDesc,
    icd10,
    diagnosisDate,
    labType,
    labDate,
    labFindings,
    prevTreatments,
    treatDuration,
    treatOutcome,
    mriDate,
    ultrasoundDate,
  } = body || {};

  if (patientName) ehr.name = patientName;
  if (gender) ehr.gender = gender;
  if (doctorId) ehr.doctor_id = doctorId;
  if (insurerId) ehr.insurer_id = insurerId;
  if (age !== undefined && age !== null && String(age).trim() !== "") {
    const n = Number(age);
    if (Number.isFinite(n)) ehr.age = n;
  }

  // Diagnosis: if user provided, prefer it (prepend newest entry)
  if (icd10 || diagnosisDesc || parsedNote?.icd10_code) {
    const entry = {
      date: diagnosisDate || new Date().toISOString().split("T")[0],
      icd10: (icd10 || parsedNote?.icd10_code || "").toString(),
      description: diagnosisDesc || "Primary Diagnosis",
    };
    const existing = Array.isArray(ehr.diagnosis_history) ? ehr.diagnosis_history : [];
    ehr.diagnosis_history = [entry, ...existing.filter((_, idx) => idx !== 0)];
  }

  // Labs: ensure at least one relevant lab is present if user provided it
  if (labType || labFindings) {
    const existing = Array.isArray(ehr.lab_reports) ? ehr.lab_reports : [];
    const dyn = {
      id: "LAB_OVERRIDE_1",
      type: labType || "Lab Report",
      date: labDate || new Date().toISOString().split("T")[0],
      result: labFindings || "No findings provided",
      relevant: true,
    };
    const kept = existing.filter((x) => x?.id !== dyn.id);
    ehr.lab_reports = [dyn, ...kept];
  }

  // Imaging helper dates (optional)
  if (mriDate) {
    const existing = Array.isArray(ehr.lab_reports) ? ehr.lab_reports : [];
    const id = "LAB_OVERRIDE_MRI";
    const kept = existing.filter((x) => x?.id !== id);
    ehr.lab_reports = [
      { id, type: "MRI", date: mriDate, result: "MRI study uploaded", relevant: true },
      ...kept,
    ];
  }
  if (ultrasoundDate) {
    const existing = Array.isArray(ehr.lab_reports) ? ehr.lab_reports : [];
    const id = "LAB_OVERRIDE_US";
    const kept = existing.filter((x) => x?.id !== id);
    ehr.lab_reports = [
      { id, type: "Ultrasound", date: ultrasoundDate, result: "Ultrasound study uploaded", relevant: true },
      ...kept,
    ];
  }

  // Prior treatment override
  if (prevTreatments) {
    const existing = Array.isArray(ehr.prior_treatments) ? ehr.prior_treatments : [];
    const entry = {
      type: prevTreatments,
      duration: treatDuration || "Unknown",
      date: new Date().toISOString().split("T")[0],
      outcome: treatOutcome || "Unknown",
    };
    ehr.prior_treatments = [entry, ...existing.filter((_, idx) => idx !== 0)];
  }

  return ehr;
}

// POST /api/analyze
router.post("/", async (req, res) => {
  try {
    const { 
        patientId, insurerId, procedureId, surgeonNoteText, note,
        patientName, dob, age, gender, policyNumber, doctorId, hospital,
        diagnosisDesc, icd10, diagnosisDate, diagnosisNotes, surgeryDate, costEstimate,
        prevTreatments, treatDuration, treatOutcome,
        labType, labDate, labFindings, mriDate, ultrasoundDate,
        certSurgeon, medicalLicense, claimId, submissionDate, bmi 
    } = req.body;
    const noteText = surgeonNoteText || note || "";

    if (!patientId || !noteText) {
      return res.status(400).json({ error: "Missing required fields: patientId, surgeonNoteText" });
    }

    // ── Step 1: Parse surgeon note via FastAPI ──────────────────────────────
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    let parsedNote;
    try {
      const r = await fetch(`${FASTAPI_URL}/parse_note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error(await r.text());
      parsedNote = await r.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError")
        return res.status(504).json({ error: "FastAPI /parse_note timed out" });
      throw err;
    }

    const cptKey = parsedNote.cpt_code
      ? `CPT_${parsedNote.cpt_code}`
      : (procedureId || "CPT_63030");

    // ── Step 2: Load EHR + policy from mock JSON ────────────────────────────
    const [allEhr, policies] = await Promise.all([
      readJson("patient_ehr.json"),
      readJson("insurance_policies.json"),
    ]);

    let ehr = allEhr[patientId] || (allEhr.patient_id === patientId ? allEhr : null);
    
    if (!ehr) {
      // Build dynamic EHR based on request parameters
      console.log(`[analyze] Patient ${patientId} not found in mock data. Generating dynamic EHR...`);
      ehr = {
        patient_id: patientId,
        name: patientName || "Unknown Patient",
        age: age ? parseInt(age) : 45,
        gender: gender || "Unknown",
        insurer_id: insurerId || "Unknown",
        doctor_id: doctorId || "Unknown",
        diagnosis_history: [],
        lab_reports: [],
        medications: [],
        prior_treatments: []
      };

      if (icd10 || diagnosisDesc) {
         ehr.diagnosis_history.push({
           date: diagnosisDate || new Date().toISOString().split('T')[0],
           icd10: icd10 || parsedNote?.icd10_code || 'N/A',
           description: diagnosisDesc || 'Primary Diagnosis'
         });
      }

      if (labType || labFindings) {
         ehr.lab_reports.push({
           id: "LAB_DYN_1",
           type: labType || "Lab Report",
           date: labDate || new Date().toISOString().split('T')[0],
           result: labFindings || "No findings provided",
           relevant: true
         });
      }

      if (mriDate && labType !== 'MRI') {
          ehr.lab_reports.push({
              id: "LAB_DYN_2", type: "MRI", date: mriDate, result: "MRI study uploaded", relevant: true
          });
      }
      if (ultrasoundDate && labType !== 'Ultrasound') {
          ehr.lab_reports.push({
              id: "LAB_DYN_3", type: "Ultrasound", date: ultrasoundDate, result: "Ultrasound study uploaded", relevant: true
          });
      }

      if (prevTreatments) {
          ehr.prior_treatments.push({
              type: prevTreatments,
              duration: treatDuration || "Unknown",
              date: new Date().toISOString().split('T')[0],
              outcome: treatOutcome || "Unknown"
          });
      }
    }

    // Even when patient exists in mock data (e.g. PAT_001), apply UI-entered overrides
    ehr = applyEhrOverrides(ehr, req.body, parsedNote);

    ehr.insurer_id = insurerId || ehr.insurer_id;
    ehr.cpt_code   = cptKey;

    const insurerKey = insurerId || ehr.insurer_id;
    const procedurePolicy = policies[insurerKey]?.procedures?.[cptKey];
    let requirements = procedurePolicy?.required_documents || [];

    // Fallback if the user typed a completely unmapped/novel procedure
    if (requirements.length === 0) {
        requirements = [
            "Physician Intake Notes",
            "Proof of Medical Necessity",
            "Surgical Clearance"
        ];
    }

    // ── Step 3: Extract EHR evidence + gaps via FastAPI ─────────────────────
    const ehrResp = await fetch(`${FASTAPI_URL}/extract_ehr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ehr, requirements }),
    });

    if (!ehrResp.ok) {
      return res.status(502).json({ error: "FastAPI /extract_ehr failed", details: await ehrResp.text() });
    }

    const ehrResult = await ehrResp.json();

    // ── Step 4: Run Node Logic Modules ─────────────────────────────
    const logicManager = req.logicManager;
    const logicResult = await logicManager.processPreAuth({
        diagnosisText: parsedNote.icd10_desc || parsedNote.icd10_code || noteText,
        insurerId: insurerKey,
        procedureCode: cptKey,
        extractedDocs: ehrResult.found_documents || []
    });

    const missingDocs = logicResult.gaps.missingDocs || [];
    const docId = ehr?.doctor_id || doctorId || "UNKNOWN";
    const claimIdForStore = claimId || `CLM_${Date.now()}`;

    // Assemble pre-auth form with cited evidence (problem statement #5)
    const preauthForm = assemblePreauthForm({
      patientId,
      patientName: ehrResult.patient_name || patientName || "Unknown",
      procedure: parsedNote.procedure,
      cptCode: cptKey,
      icd10Code: logicResult.diagnosis.icd10 || parsedNote.icd10_code,
      insurerId: insurerKey,
      policyNumber: ehrResult.policy_number || policyNumber,
      requiredDocuments: requirements,
      foundDocuments: ehrResult.found_documents || [],
      ehrEvidence: ehrResult,
      riskLevel: logicResult.risk.riskLevel,
      riskScore: logicResult.risk.riskScore,
      topDrivers: logicResult.risk.reasons,
      maxApproved: procedurePolicy?.max_approved_amount,
      preauthDays: procedurePolicy?.preauth_timeline_days,
    });

    // Notify doctor if gaps (problem statement #4 — actionable alert)
    let doctorAlert = null;
    if (missingDocs.length > 0) {
      doctorAlert = await notifyDoctor(
        docId,
        claimIdForStore,
        patientId,
        ehrResult.patient_name || patientName || "Unknown",
        missingDocs
      );
    }

    const riskLevel = logicResult.risk.riskLevel.toUpperCase();
    const status = riskLevel === "HIGH" ? "Rejected" : (riskLevel === "MEDIUM" ? "Pending" : "Approved");

    // Persist so claim appears in analytics/history after refresh
    await appendSubmittedClaim({
      id: claimIdForStore,
      patientId,
      patientName: ehrResult.patient_name || patientName || "Unknown",
      procedure: parsedNote.procedure || "Procedure",
      cpt_code: cptKey,
      insurerId: insurerKey,
      insurerName: policies[insurerKey]?.name || insurerKey,
      cost: costEstimate ? `₹${Number(costEstimate).toLocaleString("en-IN")}` : "₹0",
      submitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      submittedAt: new Date().toISOString(),
      risk: riskLevel === "HIGH" ? "High" : (riskLevel === "MEDIUM" ? "Medium" : "Low"),
      status,
      missingDocs,
    });

    return res.json({
      success: true,
      parsedNote: {
        procedure:  parsedNote.procedure,
        cpt_code:   parsedNote.cpt_code || cptKey.replace("CPT_", ""),
        icd10_code: logicResult.diagnosis.icd10 || parsedNote.icd10_code,
        urgency:    parsedNote.urgency,
      },
      ehrEvidence: {
        patient_name:      ehrResult.patient_name,
        policy_number:     ehrResult.policy_number,
        matched_diagnoses: ehrResult.matched_diagnoses || [],
        relevant_labs:     ehrResult.relevant_labs || [],
        prior_treatments:  ehrResult.prior_treatments || [],
        medications:       ehrResult.medications || [],
        missing_documents: missingDocs,
        evidence_summary:  ehrResult.evidence_summary || {},
      },
      gapAnalysis: {
        missingEvidence: missingDocs,
      },
      risk: {
        level:      riskLevel,
        score:      logicResult.risk.riskScore,
        topDrivers: logicResult.risk.reasons || [],
      },
      request: { patientId, insurerId: insurerKey, claimId: claimIdForStore, costEstimate },
      policy_used: {
        cpt:                cptKey,
        required_documents: requirements,
        max_approved:       procedurePolicy?.max_approved_amount || 0,
        preauth_days:       procedurePolicy?.preauth_timeline_days || 14,
      },
      preauth_form: preauthForm,
      doctor_alert:  doctorAlert ? { sent: true, alertId: doctorAlert.id, message: doctorAlert.message, missing_docs: doctorAlert.missingDocs } : null,
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Analyze pipeline failed", details: err.message });
  }
});

module.exports = router;