const GapAnalysisService = require('./gapAnalysis');
const RiskEngine = require('./riskEngine');
const ICDMatcher = require('./icdMatcher');

class InsuranceLogicManager {
    constructor(paths) {
        this.gap = new GapAnalysisService(paths.gapCsv);
        this.risk = new RiskEngine(paths.riskCsv);
        this.matcher = new ICDMatcher(paths.icdCsv);
    }

    async init() {
        await Promise.all([
            this.gap.loadRules(),
            this.risk.loadData(),
            this.matcher.loadCodes()
        ]);
        console.log("🚀 Member 3: All Logic Modules Active");
    }

    async processPreAuth(input) {
        // 1. Map the diagnosis to a code
        const icdResult = this.matcher.lookupICD10Code(input.diagnosisText);

        // 2. Check for missing documents
        const gapResult = this.gap.checkDocumentAvailability(
            input.insurerId,
            input.procedureCode,
            input.extractedDocs
        );

        // 3. Calculate Risk
        const riskResult = this.risk.scoreRejectionRisk({
            insurerId: input.insurerId,
            procedureCode: input.procedureCode,
            hasGap: gapResult.hasGap,
            missingDocs: gapResult.missingDocs,
            icd10Code: icdResult.icd10
        });

        return {
            diagnosis: icdResult,
            gaps: gapResult,
            risk: riskResult,
            isReady: !gapResult.hasGap && icdResult.success && riskResult.riskScore < 50
        };
    }
}

module.exports = InsuranceLogicManager;