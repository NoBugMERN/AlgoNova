const express = require("express");
const router = express.Router();
const { recordRejectionAndAppeal, getAppeals } = require("../lib/claimStore");

/** POST /api/appeals/reject — Bonus: on rejection, map to actions and draft appeal letter */
router.post("/reject", async (req, res) => {
  try {
    const { claimId, patientId, rejectionReason, rejectionCategory } = req.body || {};
    if (!claimId || !rejectionReason) {
      return res.status(400).json({ error: "claimId and rejectionReason are required" });
    }
    const appeal = await recordRejectionAndAppeal(
      claimId,
      patientId || "Unknown",
      rejectionReason,
      rejectionCategory
    );
    return res.json({
      success: true,
      appeal: {
        id: appeal.id,
        claimId: appeal.claimId,
        patientId: appeal.patientId,
        rejectionReason: appeal.rejectionReason,
        rejectionCategory: appeal.rejectionCategory,
        recommendedActions: appeal.recommendedActions,
        appealLetter: appeal.appealLetter,
        status: appeal.status,
        createdAt: appeal.createdAt,
      },
    });
  } catch (err) {
    console.error("Appeal/reject error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/appeals — List all draft appeals */
router.get("/", async (req, res) => {
  try {
    const appeals = await getAppeals();
    return res.json({ appeals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
