def map_rejection_to_actions(rejection_category: str) -> list[str]:
    mapping = {
        "MISSING_DOCUMENT": ["Request missing document from provider", "Re-submit pre-auth packet"],
        "INCORRECT_CODING": ["Validate ICD-10/CPT mapping", "Correct codes and re-submit"],
        "POLICY_MISMATCH": ["Check policy constraints", "Collect additional supporting evidence"],
    }
    return mapping.get(rejection_category, ["Review rejection details", "Collect supporting evidence"])


if __name__ == "__main__":
    print(map_rejection_to_actions("MISSING_DOCUMENT"))

