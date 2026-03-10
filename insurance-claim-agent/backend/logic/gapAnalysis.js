const fs = require('fs');
const path = require('path');

/**
 * Document keywords that map fragments of policy document names to EHR evidence
 * keywords. A `null` value means the document can NEVER be auto-satisfied from
 * EHR data — it is a clinician-signed external document and is therefore always
 * flagged as missing unless explicitly provided.
 */
const ALWAYS_MISSING_FRAGMENTS = [
  "surgeon recommendation letter",
  "surgeon's certificate",
  "certificate of medical necessity",
  "medical necessity",
  "surgical clearance",
  "proof of medical necessity",
];

const DOC_KEYWORDS = {
  "mri":                 ["mri", "magnetic resonance"],
  "x-ray":               ["x-ray", "xray", "radiograph"],
  "ultrasound":          ["ultrasound", "sonograph"],
  "coronary angiogram":  ["angiogram", "angiography", "cath"],
  "electrocardiogram":   ["ecg", "electrocardiogram", "ekg"],
  "echocardiogram":      ["echo", "echocardiogram", "2d echo"],
  "cbc":                 ["cbc", "complete blood count", "blood report", "wbc"],
  "blood report":        ["cbc", "complete blood count", "blood report", "wbc"],
  "nerve conduction":    ["nerve conduction", "ncs", "emg", "electromyograph"],
  "physiotherapy":       ["physical therapy", "physiotherapy", "pt record"],
  "hospital admission":  ["admission"],
};

class GapAnalysisService {
    constructor(csvPath) {
        // csvPath kept for interface compatibility but we use policies JSON now
        this.csvPath = csvPath;
        this.policies = null;
        this.policyPath = path.join(__dirname, '..', 'data', 'mock', 'insurance_policies.json');
    }

    async loadRules() {
        try {
            const raw = fs.readFileSync(this.policyPath, 'utf-8');
            this.policies = JSON.parse(raw);
            console.log('✅ GapAnalysisService: Loaded', Object.keys(this.policies).length, 'insurer policies');
        } catch (e) {
            console.error('❌ GapAnalysisService: Failed to load policies:', e.message);
            this.policies = {};
        }
    }

    /**
     * Determine if an EHR can satisfy a required document.
     * @param {string} docName - Policy-required document name
     * @param {Array}  ehrDocs - List of document names found in EHR by Python engine
     */
    _isDocSatisfied(docName, ehrDocs) {
        const lower = docName.toLowerCase().trim();

        // Clinician-signed docs are ALWAYS missing unless Python engine found them
        if (ALWAYS_MISSING_FRAGMENTS.some(f => lower.includes(f))) {
            // Check if the Python EHR engine explicitly found it
            return ehrDocs.some(d => d.toLowerCase().includes(lower.split(' ')[0]));
        }

        // Check directly by name against EHR docs list
        if (ehrDocs.some(d => d.toLowerCase().includes(lower.split(' ')[0]))) {
            return true;
        }

        // Keyword-based match against known imaging/lab types in ehrDocs
        for (const [fragment, keywords] of Object.entries(DOC_KEYWORDS)) {
            if (lower.includes(fragment)) {
                return ehrDocs.some(d => {
                    const dl = d.toLowerCase();
                    return keywords.some(kw => dl.includes(kw));
                });
            }
        }

        return false;
    }

    /**
     * Core Logic: check_document_availability
     * Compares policy-required documents against what was found in EHR.
     * @param {string} insurerId
     * @param {string} procedureCode  e.g. "CPT_44950"
     * @param {Array}  providedDocs   documents found by the Python EHR extractor
     */
    checkDocumentAvailability(insurerId, procedureCode, providedDocs) {
        const insurer = this.policies?.[insurerId];
        if (!insurer) {
            return { status: "error", message: `No policy found for insurer: ${insurerId}`, hasGap: false, missingDocs: [] };
        }

        const procedure = insurer.procedures?.[procedureCode];
        if (!procedure) {
            // Fallback: flag surgeon letter as missing (safe default)
            return {
                insurerId, procedureCode,
                hasGap: true,
                missingDocs: ["Surgeon Recommendation Letter"],
                status: "Action Required",
                timestamp: new Date().toISOString(),
            };
        }

        const requiredDocs = procedure.required_documents || [];

        const missingDocs = requiredDocs.filter(
            doc => !this._isDocSatisfied(doc, providedDocs)
        );

        const hasGap = missingDocs.length > 0;

        return {
            insurerId,
            procedureCode,
            hasGap,
            missingDocs,
            status: hasGap ? "Action Required" : "Ready for Submission",
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = GapAnalysisService;