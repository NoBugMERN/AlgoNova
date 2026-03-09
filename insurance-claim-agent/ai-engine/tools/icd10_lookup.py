from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ICD10Result:
    icd10: str
    label: str


_MINI_CODESET = [
    ICD10Result("M51.1", "Lumbar and other intervertebral disc disorders with radiculopathy"),
    ICD10Result("M54.5", "Low back pain"),
    ICD10Result("K81.0", "Acute cholecystitis"),
    ICD10Result("K80.20", "Calculus of gallbladder without cholecystitis, without obstruction"),
    ICD10Result("M17.11", "Unilateral primary osteoarthritis, right knee"),
]


def lookup_icd10_code(query: str) -> list[dict]:
    q = (query or "").strip().lower()
    if not q:
        return []
    out: list[dict] = []
    for row in _MINI_CODESET:
        if q in row.icd10.lower() or q in row.label.lower():
            out.append({"icd10": row.icd10, "label": row.label})
    return out[:10]

