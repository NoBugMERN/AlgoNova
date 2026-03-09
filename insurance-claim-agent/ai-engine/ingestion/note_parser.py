from __future__ import annotations

import re


def parse_surgeon_note(text: str) -> dict:
    """
    Lightweight deterministic parser.
    (Swap for LangChain/Ollama later; keep the output shape stable.)
    """
    t = text or ""
    lower = t.lower()

    procedure = "unspecified procedure"
    if "discectomy" in lower:
        procedure = "Lumbar Discectomy"
    elif "cholecystectomy" in lower:
        procedure = "Laparoscopic Cholecystectomy"
    elif "knee" in lower and ("replacement" in lower or "arthroplasty" in lower):
        procedure = "Total Knee Replacement"

    indication = "Not specified"
    m = re.search(r"(indication|reason|diagnosis)\s*:\s*(.+)", t, re.IGNORECASE)
    if m:
        indication = m.group(2).strip()

    missing_fields: list[str] = []
    if not re.search(r"\bicd\b|\bicd-?10\b|diagnos", lower):
        missing_fields.append("diagnosis")
    if not re.search(r"physio|physical therapy|conservative|nsaid|failed", lower):
        missing_fields.append("conservative_treatment_history")
    if not re.search(r"mri|x-?ray|ultrasound|imaging", lower):
        missing_fields.append("imaging_evidence")

    suggested = []
    if "disc herniation" in lower or "radiculopathy" in lower:
        suggested.append("M51.1")
    if "cholecystitis" in lower:
        suggested.append("K81.0")

    return {
        "procedureMentioned": procedure,
        "indication": indication,
        "suggestedIcd10": suggested,
        "missingFields": missing_fields,
    }

