const fs = require('fs');
const csv = require('csv-parser');
const Fuse = require('fuse.js');

class ICDMatcher {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.codes = [];
        this.fuse = null;
    }

    // Load the cleaned ICD-10 codeset
    async loadCodes() {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(this.csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    this.codes = results;
                    
                    // Initialize Fuzzy Search configuration
                    const options = {
                        keys: ['label', 'normalized_label'], // Search in these columns
                        threshold: 0.4, // 0.0 is perfect match, 1.0 matches everything
                        includeScore: true
                    };
                    
                    this.fuse = new Fuse(this.codes, options);
                    resolve(results);
                })
                .on('error', (err) => reject(err));
        });
    }

    /**
     * Core Logic: lookup_icd10_code
     * @param {string} searchTerm - The diagnosis text from the surgeon's note
     */
    lookupICD10Code(searchTerm) {
        if (!this.fuse) return { error: "Matcher not initialized" };

        const results = this.fuse.search(searchTerm);

        if (results.length === 0) {
            return {
                success: false,
                match: null,
                message: "No matching ICD-10 code found for this diagnosis."
            };
        }

        // Return the best match (top result)
        const bestMatch = results[0].item;
        return {
            success: true,
            icd10: bestMatch.icd10,
            description: bestMatch.label,
            confidence: (1 - results[0].score).toFixed(2), // Convert distance to confidence %
            allMatches: results.slice(0, 3).map(r => r.item.icd10) // Top 3 suggestions
        };
    }
}

module.exports = ICDMatcher;