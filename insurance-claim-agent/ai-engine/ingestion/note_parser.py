from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
import json
import re

# ── 1. Output shape ──────────────────────────────────────────────────────────
class ExtractedNote(BaseModel):
    procedure: str
    cpt_code: str
    icd10_code: str
    urgency: str

# ── 2. Load LLM ──────────────────────────────────────────────────────────────
llm = OllamaLLM(model="llama3.2:3b", temperature=0)

# ── 3. Prompt ────────────────────────────────────────────────────────────────
prompt = PromptTemplate(
    input_variables=["note"],
    template="""You are a medical coding assistant specializing in ICD-10 and CPT codes.

Read the surgeon note and extract these 4 fields:
- procedure: the exact surgical procedure name
- cpt_code: the correct CPT code (e.g. Lumbar Discectomy = 63030, Knee Replacement = 27447, Cholecystectomy = 47562)
- icd10_code: the correct ICD-10 code (e.g. L4-L5 disc herniation = M51.1, knee osteoarthritis = M17.11, cholecystitis = K81.0)
- urgency: Elective if planned, Urgent if needed soon, Emergency if immediate

Common mappings to help you:
- Lumbar Discectomy → CPT 63030, ICD-10 M51.1
- Total Knee Replacement → CPT 27447, ICD-10 M17.11
- Laparoscopic Cholecystectomy → CPT 47562, ICD-10 K81.0

Return ONLY a valid JSON object. No explanation. No markdown.

{{
  "procedure": "...",
  "cpt_code": "...",
  "icd10_code": "...",
  - urgency: MUST be Elective if the note says "recommend" or "planned". Urgent only if the note says "immediate" or "urgent". Emergency if life-threatening.
}}

Surgeon Note:
{note}
"""
)

# ── 4. Chain ─────────────────────────────────────────────────────────────────
chain = prompt | llm

# ── 5. Main function ─────────────────────────────────────────────────────────
def parse_surgeon_note(note_text: str) -> ExtractedNote:
    raw_output = chain.invoke({"note": note_text})
    cleaned = re.sub(r"```json|```", "", raw_output).strip()
    data = json.loads(cleaned)
    return ExtractedNote(**data)

# ── 6. Test ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample_note = """
    Patient Rajesh Kumar, 45-year-old male, presents with severe lower back pain
    radiating to the left leg for over 14 months. MRI confirms L4-L5 disc herniation
    with significant nerve root compression. Conservative treatments including 6 weeks
    of physiotherapy and two epidural steroid injections have failed to provide lasting
    relief. I strongly recommend proceeding with Lumbar Discectomy (L4-L5).
    The procedure is medically necessary to prevent permanent neurological damage.
    """

    print("Parsing surgeon note...")
    result = parse_surgeon_note(sample_note)
    print("\nExtracted Result:")
    print(result.model_dump_json(indent=2))