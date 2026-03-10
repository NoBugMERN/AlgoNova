const fs = require('fs');
const csv = require('csv-parser');
const _ = require('lodash');

class RiskEngine {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.historicalData = [];
    }

    // Load historical rejection data
    async loadData() {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(this.csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    this.historicalData = results;
                    resolve(results);
                })
                .on('error', (err) => reject(err));
        });
    }

    /**
     * Core Logic: score_rejection_risk
     * @param {Object} claimPackage - Contains insurerId, procedureCode, and gapAnalysis results
     */
    scoreRejectionRisk(claimPackage) {
        let score = 0;
        let reasons = [];

        // 1. Check Gap Analysis Results (Highest Weight)
        if (claimPackage.hasGap) {
            const gapPenalty = claimPackage.missingDocs.length * 25;
            score += gapPenalty;
            reasons.push(`Missing critical documentation: ${claimPackage.missingDocs.join(', ')}`);
        }

        // 2. Check Historical Rejection Trends for this Insurer/Procedure
        const history = this.historicalData.filter(d => 
            d.insurer_id === claimPackage.insurerId && 
            d.cpt_code === claimPackage.procedureCode
        );

        if (history.length > 0) {
            const rejectionRate = history.filter(d => d.label_rejected === '1').length / history.length;
            if (rejectionRate > 0.5) {
                score += 30;
                reasons.push("High historical rejection rate for this insurer and procedure combination.");
            }
        }

        // 3. Consistency Checks (e.g., matching codes)
        if (!claimPackage.icd10Code) {
            score += 20;
            reasons.push("Missing or unvalidated ICD-10 diagnosis code.");
        }

        // Final normalization (cap at 100)
        const finalScore = Math.min(score, 100);
        
        let riskLevel = "Low";
        if (finalScore > 40) riskLevel = "Medium";
        if (finalScore > 75) riskLevel = "High";

        return {
            riskScore: finalScore,
            riskLevel: riskLevel,
            reasons: reasons.length > 0 ? reasons : ["All submission criteria met."],
            recommendation: finalScore > 40 ? "Review missing docs or historical precedents before filing." : "Ready for submission."
        };
    }
}

module.exports = RiskEngine;    