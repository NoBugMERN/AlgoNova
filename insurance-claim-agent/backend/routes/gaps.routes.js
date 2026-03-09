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

// From Member 3's gap_analyzer logic in the screenshots
function analyzeGaps(missingDocs) {
  return missingDocs.map((doc) => ({
    missing: doc,
    action: `Please obtain "${doc}" and upload to patient file`,
    severity: "REQUIRED",
    blocking: true,
  }));
}

// GET /api/gaps/:patientId?insurer=INS_A&cpt=CPT_63030
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { insurer, cpt } = req.query;

    if (!insurer || !cpt) {
      return res.status(400).json({ error: "Query params required: insurer, cpt" });
    }

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

    if (ehrResponse.ok) {
      const ehrData = await ehrResponse.json();
      missingDocs = ehrData.missing_documents || [];
    }

    const alerts = analyzeGaps(missingDocs);

    return res.json({
      success: true,
      patientId,
      insurer,
      cpt,
      gap_count: alerts.length,
      alerts,                  // Array of { missing, action, severity, blocking }
    });

  } catch (err) {
    return res.status(500).json({ error: "Gap analysis failed", details: err.message });
  }
});

module.exports = router;