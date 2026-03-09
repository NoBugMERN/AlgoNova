const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const router = express.Router();

async function readPolicies() {
  const p = path.join(__dirname, "..", "..", "data", "mock", "insurance_policies.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

router.get("/:insurerId", async (req, res) => {
  try {
    const policies = await readPolicies();
    const insurer = policies?.[req.params.insurerId];
    if (!insurer) return res.status(404).json({ error: "insurer not found" });
    return res.json({ insurer_id: req.params.insurerId, ...insurer });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
});

module.exports = router;

