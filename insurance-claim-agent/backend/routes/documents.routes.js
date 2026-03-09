const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const router = express.Router();

async function safeReadJson(filename) {
  try {
    const p = path.join(__dirname, "..", "..", "data", "mock", filename);
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null; 
  }
}

router.get("/check", async (req, res) => {
  try {
    const { patient_id, document_type } = req.query;
    
    if (!patient_id || !document_type) {
      return res.status(400).json({ error: "Missing patient_id or document_type" });
    }

    const ehrData = await safeReadJson("patient_ehr.json");
    const notesData = await safeReadJson("surgeon_notes.json");
    
    let isAvailable = false;
    const docLower = document_type.toLowerCase();

    // 1. Check if it's a Surgeon Note
    if (docLower.includes("surgeon")) {
      if (notesData) {
        // Look through all notes to see if one belongs to this patient
        const allNotes = Object.values(notesData);
        const patientNote = allNotes.find(note => note.patient_id === patient_id);
        if (patientNote) isAvailable = true;
      }
    } 
    // 2. Check if it's in the EHR (Labs or Physiotherapy)
    else if (ehrData && ehrData.patient_id === patient_id) {
      const ehrString = JSON.stringify(ehrData).toLowerCase();
      
      // Extract the core word (e.g., "MRI" from "MRI Lumbar Spine")
      const searchKey = docLower.split(" ")[0]; 
      
      if (ehrString.includes(searchKey) || ehrString.includes(docLower)) {
         isAvailable = true;
      }
    }

    return res.json({
      success: true,
      patient_id,
      document_type,
      status: isAvailable ? "Found" : "Not Found"
    });
  } catch (err) {
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;