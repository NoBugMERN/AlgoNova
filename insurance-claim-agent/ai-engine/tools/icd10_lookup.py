import pandas as pd
import re

# ── 1. Load the cleaned CSV ──────────────────────────────────────────────────
df = pd.read_csv("../data/processed/icd10_lookup_clean.csv")

# ── 2. Keyword alias map ─────────────────────────────────────────────────────
ALIASES = {
    "lumbar disc herniation": ["intervertebral disc", "lumbar"],
    "disc herniation": ["intervertebral disc", "displacement"],
    "knee osteoarthritis": ["osteoarthritis", "knee"],
    "knee replacement": ["osteoarthritis", "knee"],
    "cholecystitis": ["cholecystitis"],
    "gallstones": ["calculus", "gallbladder"],
    "low back pain": ["low back pain"],
}

# ── 3. Lookup function ───────────────────────────────────────────────────────
def lookup_icd10_code(diagnosis_text: str, top_n: int = 5) -> list:
    query = diagnosis_text.strip()

    # FIX: if query looks like a bare ICD-10 code (e.g. "M51.1"), match the
    # code column directly — don't search descriptions for "M51.1"
    if re.match(r'^[A-Z]\d{2}\.?\w{0,4}$', query.upper()):
        code_upper = query.upper()
        # Exact match first
        exact = df[df["icd10_code"].str.upper() == code_upper]
        if not exact.empty:
            return exact.head(top_n).to_dict(orient="records")
        # Prefix match (e.g. M51 matches M51.1, M51.16...)
        prefix = df[df["icd10_code"].str.upper().str.startswith(code_upper)]
        if not prefix.empty:
            return prefix.head(top_n).to_dict(orient="records")
        return [{"icd10_code": "NOT_FOUND", "description": f"No ICD-10 code found for: {query}"}]

    # Otherwise: text/keyword search (original behaviour)
    query_lower = query.lower()
    keywords = ALIASES.get(query_lower, [query_lower])

    # AND logic — all keywords must match
    mask = pd.Series([True] * len(df))
    for kw in keywords:
        mask = mask & df["description"].str.contains(kw, case=False, na=False)
    results = df[mask].head(top_n)

    # Fallback: OR logic
    if results.empty:
        mask = pd.Series([False] * len(df))
        for kw in keywords:
            mask = mask | df["description"].str.contains(kw, case=False, na=False)
        results = df[mask].head(top_n)

    if results.empty:
        return [{"icd10_code": "NOT_FOUND", "description": f"No match for: {query}"}]

    return results.to_dict(orient="records")


# ── 4. Test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        "M51.1",                  # direct code lookup
        "lumbar disc herniation", # text search
        "knee osteoarthritis",
        "M17.11",                 # direct code lookup
        "low back pain",
    ]
    for test in tests:
        print(f"\nQuery: '{test}'")
        matches = lookup_icd10_code(test)
        for m in matches:
            print(f"  {m['icd10_code']} → {m['description']}")