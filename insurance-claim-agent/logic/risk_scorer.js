function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreToLevel(score) {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function scoreRejectionRisk({ procedurePolicy, parsedNote, ehrEvidence, gapAnalysis, historicalRejections }) {
  const drivers = [];
  let score = 0;

  const missingDocs = gapAnalysis?.missingDocuments || [];
  const missingEvidence = gapAnalysis?.missingEvidence || ehrEvidence?.missingEvidence || [];

  if (missingDocs.length) {
    score += 25 + 10 * Math.min(3, missingDocs.length);
    drivers.push(`Missing documents: ${missingDocs.slice(0, 3).join(", ")}`);
  }

  if (missingEvidence.length) {
    score += 20 + 8 * Math.min(3, missingEvidence.length);
    drivers.push(`Missing evidence: ${missingEvidence.slice(0, 3).join(", ")}`);
  }

  const missingFields = parsedNote?.missingFields || parsedNote?.missing_fields || [];
  if (missingFields.length) {
    score += 10;
    drivers.push("Surgeon note missing key fields");
  }

  const rejectionLog = historicalRejections?.rejection_log || historicalRejections?.rejectionLog || [];
  const cpt = parsedNote?.cpt_code || parsedNote?.cptCode || null;
  const policyNotes = String(procedurePolicy?.notes || "");
  if (policyNotes.toLowerCase().includes("strict")) {
    score += 10;
    drivers.push("Insurer policy flagged as strict");
  }

  // Historical signal (very lightweight): if many missing-document rejections exist, bump a bit
  const missingDocRate =
    rejectionLog.length === 0
      ? 0
      : rejectionLog.filter((r) => String(r.rejection_category || "").includes("MISSING")).length / rejectionLog.length;
  if (missingDocRate >= 0.4) {
    score += 10;
    drivers.push("Insurer history shows frequent missing-document denials");
  }

  // CPT-specific bump if present in history
  if (cpt && rejectionLog.some((r) => r.cpt_code === cpt)) {
    score += 5;
    drivers.push(`Procedure ${cpt} appears in rejection history`);
  }

  score = clamp(Math.round(score), 0, 100);
  return {
    score,
    level: scoreToLevel(score),
    topDrivers: drivers.slice(0, 5)
  };
}

module.exports = { scoreRejectionRisk };

