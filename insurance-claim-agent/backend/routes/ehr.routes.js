const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();

async function readMockEhr() {
  const p = path.join(__dirname, "..", "..", "data", "mock", "patient_ehr.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

router.get("/:patientId", async (req, res) => {
  try {
    const db = await readMockEhr();
    const requestedId = req.params.patientId;
    
    // Since your JSON is just one object, we check if the ID matches
    if (db.patient_id === requestedId) {
      return res.json({ success: true, data: db });
    } else {
      return res.status(404).json({ error: `Patient ${requestedId} not found in EHR.` });
    }
  } catch (err) {
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;