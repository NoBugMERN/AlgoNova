const fs = require('fs');
const csv = require('csv-parser');
const _ = require('lodash');

/**
 * Service to identify missing medical evidence
 */
class GapAnalysisService {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.rules = [];
    }

    // Load the gap_analysis_data.csv into memory
    async loadRules() {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(this.csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    this.rules = results;
                    resolve(results);
                })
                .on('error', (err) => reject(err));
        });
    }

    /**
     * Core Logic: check_document_availability
     * @param {string} insurerId - ID of the insurance provider
     * @param {string} procedureCode - The CPT/Procedure code
     * @param {Array} providedDocs - List of docs found in patient EHR
     */
    checkDocumentAvailability(insurerId, procedureCode, providedDocs) {
        // 1. Find the rule for this specific insurer and procedure
        const rule = _.find(this.rules, { 
            insurer_id: insurerId, 
            procedure_id: procedureCode 
        });

        if (!rule) {
            return { status: "error", message: "No policy rules found for this combination." };
        }

        // 2. Parse the required documents (stored as JSON string in CSV)
        const requiredDocs = JSON.parse(rule.required_documents_json);
        
        // 3. Identify the Gap
        const missingDocs = _.difference(
            requiredDocs.map(d => d.toLowerCase().trim()), 
            providedDocs.map(d => d.toLowerCase().trim())
        );

        const hasGap = missingDocs.length > 0;

        return {
            insurerId,
            procedureCode,
            hasGap,
            missingDocs: hasGap ? missingDocs : [],
            status: hasGap ? "Action Required" : "Ready for Submission",
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = GapAnalysisService;