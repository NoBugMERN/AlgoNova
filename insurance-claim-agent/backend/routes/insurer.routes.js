/**
 * Simulated insurer response API (bonus feature).
 * When insurer sends a rejection (webhook or manual test), agent auto-maps to actions and drafts appeal.
 */
const express = require("express");
const router = express.Router();
const { saveInsurerResponse, recordRejectionAndAppeal, getSubmittedClaims } = require("../lib/claimStore");

/** POST /api/insurer/response — Simulate insurer sending response (e.g. rejection webhook) */
router.post("/response", async (req, res) => {
  try {
    const { claimId, patientId, status, rejectionReason, rejectionCategory } = req.body || {};
    if (!claimId) {
      return res.status(400).json({ error: "claimId is required" });
    }
    const effectiveStatus = (status || "pending").toLowerCase();
    const isRejection = effectiveStatus === "rejected";

    if (isRejection && !rejectionReason) {
      return res.status(400).json({ error: "rejectionReason is required when status is rejected" });
    }

    let appeal = null;
    if (isRejection) {
      const submitted = await getSubmittedClaims();
      const claim = submitted.find((c) => (c.id || c.claimId) === claimId);
      appeal = await recordRejectionAndAppeal(
        claimId,
        patientId || claim?.patientId || "Unknown",
        rejectionReason,
        rejectionCategory || "MISSING_DOCUMENT"
      );
      await saveInsurerResponse({
        claimId,
        patientId: patientId || claim?.patientId,
        status: "rejected",
        rejectionReason,
        rejectionCategory: rejectionCategory || "MISSING_DOCUMENT",
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        appealId: appeal.id,
      });
    } else {
      await saveInsurerResponse({
        claimId,
        patientId: patientId || "Unknown",
        status: effectiveStatus,
        receivedAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      message: isRejection
        ? "Rejection received. Appeal draft created and ready for billing team."
        : "Insurer response recorded.",
      claimId,
      status: effectiveStatus,
      appeal: appeal
        ? {
            id: appeal.id,
            recommendedActions: appeal.recommendedActions,
            appealLetter: appeal.appealLetter,
          }
        : null,
    });
  } catch (err) {
    console.error("Insurer response error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/insurer/responses — List recorded insurer responses (for demo) */
router.get("/responses", async (req, res) => {
  try {
    const { getInsurerResponses } = require("../lib/claimStore");
    const responses = await getInsurerResponses();
    return res.json({ responses });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
