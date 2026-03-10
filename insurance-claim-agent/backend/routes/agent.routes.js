/**
 * Insurance Claim Optimization Agent — simulated tools (problem statement).
 * Full pipeline: POST /api/analyze (ingests note, runs all steps, returns package + preauth form + doctor alert).
 * Bonus: monitor insurer responses and auto-draft appeals on rejection.
 */
const express = require("express");
const router = express.Router();
const { runRejectionMonitor } = require("../lib/claimStore");

/** GET or POST /api/agent/check-rejections — Monitor: check for insurer responses, auto-identify rejections, map to actions, draft appeal */
router.get("/check-rejections", async (req, res) => {
  try {
    const rate = parseFloat(req.query.simulateRejectionRate) || 0.15;
    const result = await runRejectionMonitor({ simulateRejectionRate: rate });
    return res.json({
      success: true,
      message: "Monitor ran. Rejections auto-mapped to actions and appeal drafts created.",
      ...result,
    });
  } catch (err) {
    console.error("Monitor error:", err);
    return res.status(500).json({ error: err.message });
  }
});
router.post("/check-rejections", async (req, res) => {
  try {
    const rate = parseFloat(req.body?.simulateRejectionRate ?? req.query.simulateRejectionRate) || 0.15;
    const result = await runRejectionMonitor({ simulateRejectionRate: rate });
    return res.json({
      success: true,
      message: "Monitor ran. Rejections auto-mapped to actions and appeal drafts created.",
      ...result,
    });
  } catch (err) {
    console.error("Monitor error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/agent/tools — List of tools the agent uses (for demo/docs) */
router.get("/tools", (req, res) => {
  res.json({
    agent: "Insurance Claim Optimization Agent",
    description: "Proactive pre-auth assembly with gap analysis, risk scoring, and submission-ready package.",
    pipeline: "POST /api/analyze (surgeon note + patient/insurer/procedure) runs the full flow.",
    tools: [
      { name: "get_patient_ehr", id: "patient_id", returns: "Diagnosis history, labs, medications, prior treatments", endpoint: "GET /api/ehr/:patientId" },
      { name: "get_insurance_policy_rules", id: "insurer_id, procedure_code", returns: "Required docs, qualifying ICD-10, preauth timeline, max amount", endpoint: "GET /api/insurance/:insurerId" },
      { name: "lookup_icd10_code", id: "diagnosis_text", returns: "Matching ICD-10 codes", endpoint: "Via LogicManager (ICD matcher)" },
      { name: "check_document_availability", id: "patient_id, document_type", returns: "Found / not found per required doc", endpoint: "Via gap analysis in /api/analyze" },
      { name: "assemble_preauth_form", id: "patient_id, procedure_code, evidence_map", returns: "Filled form JSON with cited evidence", endpoint: "Returned in response.preauth_form" },
      { name: "score_rejection_risk", id: "claim_package", returns: "Low/Medium/High + reasons", endpoint: "Returned in response.risk" },
      { name: "notify_doctor", id: "doctor_id, missing_docs_alert_list", returns: "Alert sent receipt", endpoint: "Returned in response.doctor_alert when gaps exist" },
    ],
    bonus: {
      rejection_monitor: "GET /api/agent/check-rejections — polls submitted claims, simulates insurer response, on rejection auto-maps to actions and drafts appeal",
      insurer_webhook: "POST /api/insurer/response — simulate insurer sending rejection (claimId, status, rejectionReason, rejectionCategory); agent auto-creates appeal",
      action_mapper: "Maps rejection category to corrective actions (included in appeal)",
      appeal_drafter: "Draft appeal letter (included in response); list via GET /api/appeals",
    },
  });
});

module.exports = router;
