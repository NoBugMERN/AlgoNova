from __future__ import annotations

from fastapi import FastAPI

from extraction.ehr_extractor import extract_ehr_evidence
from ingestion.note_parser import parse_surgeon_note
from tools.icd10_lookup import lookup_icd10_code

app = FastAPI(title="insurance-claim-agent ai-engine", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/parse_note")
def parse_note(payload: dict):
    text = (payload or {}).get("text", "")
    return parse_surgeon_note(text)


@app.post("/extract_ehr")
def extract_ehr(payload: dict):
    ehr = (payload or {}).get("ehr", {}) or {}
    requirements = (payload or {}).get("requirements", []) or []
    return extract_ehr_evidence(ehr, list(requirements))


@app.get("/icd10/{query}")
def icd10(query: str):
    return {"query": query, "results": lookup_icd10_code(query)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)

