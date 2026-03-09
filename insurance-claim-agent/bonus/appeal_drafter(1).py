def draft_appeal_letter(patient_id: str, claim_id: str, reason: str) -> str:
    return f"""To Whom It May Concern,

Re: Appeal for Claim {claim_id} (Patient {patient_id})

We are writing to appeal the denial based on: {reason}

Please reconsider this claim based on the attached documentation and medical necessity.

Sincerely,
Billing Team
"""


if __name__ == "__main__":
    print(draft_appeal_letter("PAT_001", "CLM_999", "Missing document"))

