const fs = require("fs").promises;
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data", "mock");
const SUBMITTED_PATH = path.join(DATA_DIR, "submitted_claims.json");
const ALERTS_PATH = path.join(DATA_DIR, "doctor_alerts.json");
const APPEALS_PATH = path.join(DATA_DIR, "appeals.json");
const INSURER_RESPONSES_PATH = path.join(DATA_DIR, "insurer_responses.json");
const HISTORICAL_REJECTIONS_PATH = path.join(DATA_DIR, "historical_rejections.json");

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** Persist a submitted claim so it appears in analytics/history. */
async function appendSubmittedClaim(claim) {
  const list = await readJson(SUBMITTED_PATH);
  list.unshift({
    id: claim.id,
    patientId: claim.patientId,
    patientName: claim.patientName,
    procedure: claim.procedure,
    cpt_code: claim.cpt_code,
    insurerId: claim.insurerId,
    insurerName: claim.insurerName,
    cost: claim.cost,
    submitted: claim.submitted,
    submittedAt: claim.submittedAt || new Date().toISOString(),
    risk: claim.risk,
    status: claim.status,
    missingDocs: claim.missingDocs || [],
  });
  await writeJson(SUBMITTED_PATH, list);
  return claim;
}

/** Return all submitted claims (for analytics merge). */
async function getSubmittedClaims() {
  return readJson(SUBMITTED_PATH);
}

/** Record a doctor alert (missing docs). */
async function notifyDoctor(doctorId, claimId, patientId, patientName, missingDocs) {
  const list = await readJson(ALERTS_PATH);
  const alert = {
    id: `ALT_${Date.now()}`,
    doctorId,
    claimId,
    patientId,
    patientName,
    missingDocs: missingDocs || [],
    message: `Action required: Please provide the following for claim ${claimId}: ${(missingDocs || []).join(", ")}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  list.unshift(alert);
  await writeJson(ALERTS_PATH, list);
  return alert;
}

/** Get all doctor alerts. */
async function getDoctorAlerts() {
  return readJson(ALERTS_PATH);
}

/** Rejection → action mapping (problem statement bonus). */
const REJECTION_ACTIONS = {
  MISSING_DOCUMENT: ["Request missing document from provider", "Re-submit pre-auth packet"],
  INCORRECT_CODING: ["Validate ICD-10/CPT mapping", "Correct codes and re-submit"],
  POLICY_MISMATCH: ["Check policy constraints", "Collect additional supporting evidence"],
  STALE_DOCUMENT: ["Obtain current report within policy timeframe", "Re-submit with updated document"],
  INSUFFICIENT_TREATMENT_HISTORY: ["Document conservative treatment duration", "Re-submit with complete history"],
  INVALID_DOCUMENT: ["Obtain signed/valid document", "Re-submit corrected document"],
};
function mapRejectionToActions(rejectionCategory) {
  return REJECTION_ACTIONS[rejectionCategory] || ["Review rejection details", "Collect supporting evidence"];
}

/** Draft appeal letter (bonus). */
function draftAppealLetter(patientId, claimId, reason) {
  return `To Whom It May Concern,

Re: Appeal for Claim ${claimId} (Patient ${patientId})

We are writing to appeal the denial based on: ${reason}

We have attached the requested documentation and confirm medical necessity per the enclosed evidence. We request reconsideration and approval of this pre-authorization.

Sincerely,
Billing Team`;
}

/** Record rejection and create appeal; return appeal record. */
async function recordRejectionAndAppeal(claimId, patientId, rejectionReason, rejectionCategory) {
  const actions = mapRejectionToActions(rejectionCategory || "MISSING_DOCUMENT");
  const letter = draftAppealLetter(patientId, claimId, rejectionReason);
  const appeals = await readJson(APPEALS_PATH);
  const appeal = {
    id: `APL_${Date.now()}`,
    claimId,
    patientId,
    rejectionReason,
    rejectionCategory: rejectionCategory || "MISSING_DOCUMENT",
    recommendedActions: actions,
    appealLetter: letter,
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  appeals.unshift(appeal);
  await writeJson(APPEALS_PATH, appeals);
  return appeal;
}

async function getAppeals() {
  return readJson(APPEALS_PATH);
}

// ─── Insurer response API (simulated) ───────────────────────────────────────

async function getInsurerResponses() {
  const data = await readJson(INSURER_RESPONSES_PATH);
  return Array.isArray(data) ? data : [];
}

async function getInsurerResponseByClaimId(claimId) {
  const list = await getInsurerResponses();
  return list.find((r) => r.claimId === claimId);
}

/** Save or update insurer response (e.g. webhook from insurer). */
async function saveInsurerResponse(record) {
  const list = await getInsurerResponses();
  const idx = list.findIndex((r) => r.claimId === record.claimId);
  const entry = {
    claimId: record.claimId,
    patientId: record.patientId || "Unknown",
    status: record.status || "pending",
    rejectionReason: record.rejectionReason || null,
    rejectionCategory: record.rejectionCategory || "MISSING_DOCUMENT",
    receivedAt: record.receivedAt || new Date().toISOString(),
    processedAt: record.processedAt || null,
    appealId: record.appealId || null,
  };
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.unshift(entry);
  await writeJson(INSURER_RESPONSES_PATH, list);
  return entry;
}

/** Get historical rejection reasons for realistic simulation. */
async function getHistoricalRejectionTemplates() {
  try {
    const data = await fs.readFile(HISTORICAL_REJECTIONS_PATH, "utf-8");
    const parsed = JSON.parse(data);
    const log = parsed.rejection_log || parsed;
    return Array.isArray(log) ? log : [];
  } catch (e) {
    if (e.code === "ENOENT") return [];
    return [];
  }
}

/**
 * Monitor: check submitted claims for insurer responses; simulate rejections for demo;
 * for each new rejection, map to actions + draft appeal and store.
 * Returns { checked, newRejections, newAppeals }.
 */
async function runRejectionMonitor(options = {}) {
  const { simulateRejectionRate = 0.15 } = options; // 15% of pending claims get simulated rejection
  const submitted = await getSubmittedClaims();
  const responses = await getInsurerResponses();
  const byClaim = new Map(responses.map((r) => [r.claimId, r]));
  const templates = await getHistoricalRejectionTemplates();
  const newRejections = [];
  const newAppeals = [];

  for (const claim of submitted) {
    const claimId = claim.id || claim.claimId;
    if (!claimId) continue;
    if (byClaim.has(claimId)) continue; // already has a response

    // Simulate insurer response (in production this would be a real API poll)
    const isRejection = Math.random() < simulateRejectionRate;
    const status = isRejection ? "rejected" : "approved";
    const template = templates[Math.floor(Math.random() * templates.length)] || {};
    const rejectionReason = isRejection ? (template.rejection_reason || "Documentation incomplete") : null;
    const rejectionCategory = isRejection ? (template.rejection_category || "MISSING_DOCUMENT") : null;

    await saveInsurerResponse({
      claimId,
      patientId: claim.patientId || "Unknown",
      status,
      rejectionReason,
      rejectionCategory,
      receivedAt: new Date().toISOString(),
    });
    byClaim.set(claimId, { status, rejectionReason, rejectionCategory });

    if (isRejection) {
      newRejections.push({ claimId, patientId: claim.patientId, rejectionReason, rejectionCategory });
      const appeal = await recordRejectionAndAppeal(
        claimId,
        claim.patientId || "Unknown",
        rejectionReason,
        rejectionCategory
      );
      newAppeals.push(appeal);
      await saveInsurerResponse({
        claimId,
        patientId: claim.patientId,
        status: "rejected",
        rejectionReason,
        rejectionCategory,
        processedAt: new Date().toISOString(),
        appealId: appeal.id,
      });
    }
  }

  return {
    checked: submitted.length,
    newRejections,
    newAppeals,
  };
}

module.exports = {
  appendSubmittedClaim,
  getSubmittedClaims,
  notifyDoctor,
  getDoctorAlerts,
  mapRejectionToActions,
  draftAppealLetter,
  recordRejectionAndAppeal,
  getAppeals,
  getInsurerResponses,
  getInsurerResponseByClaimId,
  saveInsurerResponse,
  runRejectionMonitor,
};
