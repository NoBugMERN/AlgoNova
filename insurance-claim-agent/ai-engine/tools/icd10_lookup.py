import pandas as pd

# ── 1. Load the cleaned CSV ──────────────────────────────────────────────────
df = pd.read_csv("data/processed/icd10_lookup_clean.csv")

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
    query = diagnosis_text.strip().lower()

    # Check alias map first
    keywords = ALIASES.get(query, [query])

    # All keywords must match (AND logic)
    mask = pd.Series([True] * len(df))
    for kw in keywords:
        mask = mask & df["description"].str.contains(kw, case=False, na=False)

    results = df[mask].head(top_n)

    # Fallback: try OR logic if AND returns nothing
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
        "lumbar disc herniation",
        "knee osteoarthritis",
        "cholecystitis",
        "low back pain"
    ]

    for test in tests:
        print(f"\nQuery: '{test}'")
        matches = lookup_icd10_code(test)
        for m in matches:
            print(f"  {m['icd10_code']} → {m['description']}")