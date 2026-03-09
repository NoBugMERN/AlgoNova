const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();

const FASTAPI_URL = "http://localhost:8001";
const FASTAPI_TIMEOUT_MS = 60000; // LLM can take 10-20s, docs say use 60s

async function readJson(filename) {
  const p = path.join(__dirname, "..", "..", "data", "mock", filename);
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

// POST /api/analyze
// Body: { patientId: "PAT_001", note: "surgeon note text...", insurerId: "INS_A" }
router.post("/", async (req, res) => {
  try {
    const { patientId, note, insurerId } = req.body;

    if (!patientId || !note || !insurerId) {
      return res.status(400).json({
        error: "Missing required fields: patientId, note, insurerId",
      });
    }

    // ── Step 1: Parse surgeon note → get CPT + ICD-10 from FastAPI ──
    const parseController = new AbortController();
    const parseTimeout = setTimeout(() => parseController.abort(), FASTAPI_TIMEOUT_MS);

    let parsedNote;
    try {
      const parseResponse = await fetch(`${FASTAPI_URL}/parse_note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note }),
        signal: parseController.signal,
      });
      clearTimeout(parseTimeout);

      if (!parseResponse.ok) {
        const errText = await parseResponse.text();
        return res.status(502).json({ error: "FastAPI /parse_note failed", details: errText });
      }
      parsedNote = await parseResponse.json();
    } catch (err) {
      clearTimeout(parseTimeout);
      if (err.name === "AbortError") {
        return res.status(504).json({ error: "FastAPI /parse_note timed out after 60s" });
      }
      throw err;
    }

    // parsedNote = { procedure, cpt_code, icd10_code, urgency }
    const cptKey = `CPT_${parsedNote.cpt_code}`; // e.g. "CPT_63030"

    // ── Step 2: Load EHR + policy requirements from mock JSON ──
    const [ehr, policies] = await Promise.all([
      readJson("patient_ehr.json"),
      readJson("insurance_policies.json"),
    ]);

    if (ehr.patient_id !== patientId) {
      return res.status(404).json({ error: `Patient ${patientId} not found in EHR.` });
    }

    const insurerData = policies[insurerId];
    if (!insurerData) {
      return res.status(404).json({ error: `Insurer ${insurerId} not found.` });
    }

    const procedurePolicy = insurerData.procedures?.[cptKey];
    if (!procedurePolicy) {
      return res.status(404).json({
        error: `No policy found for insurer ${insurerId} + procedure ${cptKey}`,
      });
    }

    // required_documents is the array FastAPI's /extract_ehr expects
    const requirements = procedurePolicy.required_documents || [];

    // ── Step 3: Extract EHR evidence + get missing docs from FastAPI ──
    const ehrResponse = await fetch(`${FASTAPI_URL}/extract_ehr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // API docs: body must have { ehr, requirements }
      body: JSON.stringify({ ehr, requirements }),
    });

    if (!ehrResponse.ok) {
      const errText = await ehrResponse.text();
      return res.status(502).json({ error: "FastAPI /extract_ehr failed", details: errText });
    }

    const ehrResult = await ehrResponse.json();

    // ── Return combined result for Member 3 + Member 5 ──
    return res.json({
      success: true,
      patientId,
      insurerId,
      parsed_note: parsedNote,        // { procedure, cpt_code, icd10_code, urgency }
      ehr_analysis: ehrResult,        // { matched_diagnoses, relevant_labs, missing_documents, evidence_summary, ... }
      policy_used: {
        cpt: cptKey,
        required_documents: requirements,
      },
    });

  } catch (err) {
    return res.status(500).json({ error: "Analyze pipeline failed", details: err.message });
  }
});

module.exports = router;