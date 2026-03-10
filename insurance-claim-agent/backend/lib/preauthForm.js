/**
 * Assemble pre-authorization form with cited evidence (problem statement item 5).
 * Returns a submission-ready package with each required field filled from EHR evidence.
 */
function assemblePreauthForm(options) {
  const {
    patientId,
    patientName,
    procedure,
    cptCode,
    icd10Code,
    insurerId,
    policyNumber,
    requiredDocuments,
    foundDocuments,
    ehrEvidence,
    riskLevel,
    riskScore,
    topDrivers,
    maxApproved,
    preauthDays,
  } = options;

  const cited = [];
  const missing = [];

  (requiredDocuments || []).forEach((doc) => {
    const normalized = String(doc).toLowerCase().trim();
    const found = (foundDocuments || []).some(
      (d) => String(d).toLowerCase().trim() === normalized
    );
    let citation = null;
    if (ehrEvidence) {
      if (ehrEvidence.relevant_labs && ehrEvidence.relevant_labs.length) {
        const lab = ehrEvidence.relevant_labs.find(
          (l) => (l.type || "").toLowerCase().includes(normalized) || normalized.includes((l.type || "").toLowerCase())
        );
        if (lab) citation = `EHR Lab: ${lab.type} (${lab.date}) — ${(lab.result || lab.findings || "").slice(0, 80)}`;
      }
      if (!citation && ehrEvidence.matched_diagnoses && ehrEvidence.matched_diagnoses.length)
        citation = `EHR Diagnosis: ${ehrEvidence.matched_diagnoses.map((d) => d.icd10 || d.description).join(", ")}`;
      if (!citation && normalized.includes("surgeon") && ehrEvidence.patient_name)
        citation = `Patient: ${ehrEvidence.patient_name}; Treating physician documentation on file.`;
      if (!citation && (normalized.includes("physiotherapy") || normalized.includes("physical therapy")) && ehrEvidence.prior_treatments && ehrEvidence.prior_treatments.length)
        citation = `EHR Prior treatments: ${ehrEvidence.prior_treatments.map((t) => `${t.type} (${t.duration || "—"})`).join("; ")}`;
      if (!citation && (normalized.includes("medical necessity") || normalized.includes("necessity") || normalized.includes("medication")) && ehrEvidence.medications && ehrEvidence.medications.length) {
        const medList = ehrEvidence.medications.map((m) => (typeof m === "string" ? m : m.name || "")).filter(Boolean).join(", ");
        if (medList) citation = `EHR Current medications: ${medList}`;
      }
    }
    if (found || citation) {
      cited.push({
        document: doc,
        status: "provided",
        citation: citation || "Attached",
      });
    } else {
      missing.push({
        document: doc,
        status: "missing",
        citation: null,
      });
    }
  });

  return {
    formType: "Pre-Authorization Request",
    generatedAt: new Date().toISOString(),
    patient: {
      patientId,
      patientName: patientName || "—",
      policyNumber: policyNumber || "—",
      insurerId,
    },
    procedure: {
      procedureName: procedure || "—",
      cptCode: cptCode || "—",
      icd10Code: icd10Code || "—",
    },
    policy: {
      maxApprovedAmount: maxApproved ?? 0,
      preauthTimelineDays: preauthDays ?? 14,
    },
    requiredDocuments: [...cited, ...missing],
    evidenceSummary: {
      documentsProvided: cited.length,
      documentsMissing: missing.length,
      riskLevel: riskLevel || "—",
      riskScore: riskScore ?? 0,
      topDrivers: topDrivers || [],
    },
    submissionReady: missing.length === 0,
  };
}

module.exports = { assemblePreauthForm };
