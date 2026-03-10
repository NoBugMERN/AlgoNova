const express = require("express");

const router = express.Router();

// Placeholder for “upload documents” / “list required docs” flows.
router.get("/required", (req, res) => {
  const { insurerId, procedureId } = req.query || {};
  return res.json({
    insurerId: insurerId || null,
    procedureId: procedureId || null,
    requiredDocuments: [],
    notes: "Stub endpoint. Use /api/analyze for current gap checks."
  });
});

module.exports = router;

