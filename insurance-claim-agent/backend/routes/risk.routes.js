const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();

const FASTAPI_URL = "http://localhost:8001";

async function readJson(filename) {
  const p = path.join(__dirname, "..", "..", "data", "mock", filename);
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

// From API docs: 0=LOW, 1-2=MEDIUM, 3+=HIGH
function scoreRisk(missingDocsCount) {
  if (missingDocsCount === 0) {
    return { level: "LOW", reason: "All documents present — claim ready to submit." };
  }
  if (missingDocsCount <= 2) {
    return {
      level: "MEDIUM",
      reason: `${missingDocsCount} document(s) missing — claim may face delays.`,
    };
  }
  return {
    level: "HIGH",
    reason: `${missingDocsCount} documents missing — high rejection risk.`,
  };
}

// GET /api/risk/:patientId?insurer=INS_A&cpt=CPT_63030
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { insurer, cpt } = req.query;

    if (!insurer || !cpt) {
      return res.status(400).json({ error: "Query params required: insurer, cpt" });
    }

    // Load EHR + policy to build the correct /extract_ehr request
    const [ehr, policies] = await Promise.all([
      readJson("patient_ehr.json"),
      readJson("insurance_policies.json"),
    ]);

    if (ehr.patient_id !== patientId) {
      return res.status(404).json({ error: `Patient ${patientId} not found.` });
    }

    const requirements = policies[insurer]?.procedures?.[cpt]?.required_documents || [];

    const ehrResponse = await fetch(`${FASTAPI_URL}/extract_ehr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ehr, requirements }),
    });

    let missingDocs = [];
    let evidenceSummary = {};

    if (ehrResponse.ok) {
      const ehrData = await ehrResponse.json();
      missingDocs = ehrData.missing_documents || [];
      evidenceSummary = ehrData.evidence_summary || {};
    }

    const risk = scoreRisk(missingDocs.length);

    return res.json({
      success: true,
      patientId,
      insurer,
      cpt,
      risk,                    // { level: "LOW/MEDIUM/HIGH", reason }
      missing_documents: missingDocs,
      evidence_summary: evidenceSummary,
    });

  } catch (err) {
    return res.status(500).json({ error: "Risk scoring failed", details: err.message });
  }
});

module.exports = router;