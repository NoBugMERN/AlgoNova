function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function analyzeGaps({ policy, parsedNote, ehrEvidence }) {
  const requiredDocuments = policy?.required_documents || [];
  const missingDocuments = [];

  // Minimal heuristic: map note missing fields to common “documents”
  const missingFields = parsedNote?.missingFields || parsedNote?.missing_fields || [];
  if (missingFields.includes("diagnosis")) missingDocuments.push("Diagnosis / ICD-10 coding");
  if (missingFields.includes("imaging_evidence")) missingDocuments.push("Imaging report (MRI/X-Ray/Ultrasound)");
  if (missingFields.includes("conservative_treatment_history")) missingDocuments.push("Conservative treatment records");

  const missingEvidence = ehrEvidence?.missingEvidence || [];

  const policyRedFlags = [];
  const notes = String(policy?.notes || "");
  if (notes.toLowerCase().includes("bmi")) policyRedFlags.push("Policy includes BMI constraint");
  if (notes.toLowerCase().includes("strict")) policyRedFlags.push("Policy marked as strict documentation");

  return {
    missingDocuments: uniq(missingDocuments),
    missingEvidence: uniq(missingEvidence.length ? missingEvidence : requiredDocuments),
    policyRedFlags: uniq(policyRedFlags)
  };
}

module.exports = { analyzeGaps };

