const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs/promises");

const ehrRoutes = require("./routes/ehr.routes");
const insuranceRoutes = require("./routes/insurance.routes");
const documentsRoutes = require("./routes/documents.routes");

const { analyzeGaps } = require("../logic/gap_analyzer");
const { scoreRejectionRisk } = require("../logic/risk_scorer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/ehr", ehrRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/documents", documentsRoutes);

async function readDataJson(...parts) {
  const p = path.join(__dirname, "..", "data", ...parts);
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}

async function callAiEngine(endpoint, payload) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch not available. Use Node 18+.");
  }
  const url = `http://localhost:8001${endpoint}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`AI engine error (${resp.status}): ${text}`);
  }
  return await resp.json();
}

function localParseNote(text) {
  const lower = (text || "").toLowerCase();
  const procedureMentioned =
    lower.includes("arthroscopy") ? "knee arthroscopy" : lower.includes("mri") ? "mri" : "unspecified procedure";

  const indicationMatch = (text || "").match(/(indication|reason|diagnosis)\s*:\s*(.+)/i);
  const indication = indicationMatch ? indicationMatch[2].trim() : "Not specified";

  const missingFields = [];
  if (!/diagnosis|icd/i.test(text || "")) missingFields.push("diagnosis");
  if (!/failed|conservative|pt|therapy|nsaid/i.test(text || "")) missingFields.push("conservative_treatment_history");
  if (!/imaging|mri|x-?ray|radiograph/i.test(text || "")) missingFields.push("imaging_evidence");

  return {
    procedureMentioned,
    indication,
    suggestedIcd10: [],
    missingFields
  };
}

function localExtractEhr(ehr, requirements) {
  const joined = JSON.stringify(ehr || {}).toLowerCase();
  const matchedEvidence = [];
  const missingEvidence = [];

  for (const req of requirements || []) {
    const key = String(req).toLowerCase();
    const hit =
      (key.includes("mri") && joined.includes("mri")) ||
      (key.includes("x-ray") && (joined.includes("x-ray") || joined.includes("xray"))) ||
      (key.includes("physical therapy") && joined.includes("therapy")) ||
      (key.includes("lab") && joined.includes("labs"));
    if (hit) {
      matchedEvidence.push({ requirement: req, evidence: "Found supporting mention in EHR", source: "ehr_json" });
    } else {
      missingEvidence.push(req);
    }
  }
  return { matchedEvidence, missingEvidence };
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { patientId, insurerId, procedureId, surgeonNoteText } = req.body || {};
    if (!patientId || !insurerId || !procedureId) {
      return res.status(400).json({ error: "patientId, insurerId, procedureId are required" });
    }

    const ehr = await readDataJson("mock", "patient_ehr.json");
    if (ehr?.patient_id && ehr.patient_id !== patientId) {
      return res.status(404).json({ error: `patientId ${patientId} not found in mock dataset` });
    }

    const policies = await readDataJson("mock", "insurance_policies.json");
    const insurer = policies?.[insurerId];
    if (!insurer) {
      return res.status(404).json({ error: `insurerId ${insurerId} not found in mock dataset` });
    }

    const procedurePolicy = insurer?.procedures?.[procedureId];
    if (!procedurePolicy) {
      return res.status(404).json({ error: `procedureId ${procedureId} not found for insurer ${insurerId}` });
    }

    let parsedNote;
    try {
      parsedNote = await callAiEngine("/parse_note", { text: surgeonNoteText || "" });
    } catch (_e) {
      parsedNote = localParseNote(surgeonNoteText || "");
    }

    let ehrEvidence;
    try {
      ehrEvidence = await callAiEngine("/extract_ehr", {
        ehr,
        requirements: procedurePolicy.required_documents || []
      });
    } catch (_e) {
      ehrEvidence = localExtractEhr(ehr, procedurePolicy.required_documents || []);
    }

    const gapAnalysis = analyzeGaps({
      policy: procedurePolicy,
      parsedNote,
      ehrEvidence
    });

    const historical = await readDataJson("mock", "historical_rejections.json");
    const risk = scoreRejectionRisk({
      procedurePolicy,
      parsedNote,
      ehrEvidence,
      gapAnalysis,
      historicalRejections: historical
    });

    return res.json({
      request: { patientId, insurerId, procedureId },
      parsedNote,
      ehrEvidence,
      gapAnalysis,
      risk
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});

