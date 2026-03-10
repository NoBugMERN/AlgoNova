const express = require("express");
const router = express.Router();
const { getDoctorAlerts } = require("../lib/claimStore");

/** GET /api/alerts — Doctor alerts (missing-document notifications) */
router.get("/", async (req, res) => {
  try {
    const alerts = await getDoctorAlerts();
    return res.json({ alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
