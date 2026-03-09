const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();

async function readPolicies() {
  const p = path.join(__dirname, "..", "..", "data", "mock", "insurance_policies.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

router.get("/:insurerId/:procedureCode", async (req, res) => {
  try {
    const policies = await readPolicies();
    const insurerId = req.params.insurerId;     // e.g., INS_A
    const procCode = req.params.procedureCode;  // e.g., CPT_63030
    
    const insurerData = policies[insurerId];
    if (!insurerData) {
      return res.status(404).json({ error: `Insurer ${insurerId} not found.` });
    }

    const procedureData = insurerData.procedures[procCode];
    if (!procedureData) {
       return res.status(404).json({ error: `Procedure ${procCode} not found for insurer ${insurerId}.` });
    }

    // Return the specific rules for that procedure
    return res.json({ success: true, data: procedureData });
  } catch (err) {
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;