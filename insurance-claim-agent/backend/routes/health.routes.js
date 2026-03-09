const express = require("express");
const router = express.Router();

const FASTAPI_URL = "http://localhost:8001";

// GET /api/health
// Checks both this Express server AND the FastAPI AI engine
router.get("/", async (req, res) => {
  let aiEngineStatus = "unreachable";
  let aiEngineOk = false;

  try {
    const response = await fetch(`${FASTAPI_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      aiEngineOk = data.ok === true;
      aiEngineStatus = aiEngineOk ? "ok" : "error";
    }
  } catch {
    aiEngineStatus = "unreachable — run: python ai-engine/main.py";
  }

  return res.status(aiEngineOk ? 200 : 503).json({
    express_server: "ok",
    ai_engine: aiEngineStatus,
    ai_engine_url: FASTAPI_URL,
    ready: aiEngineOk,
  });
});

module.exports = router;