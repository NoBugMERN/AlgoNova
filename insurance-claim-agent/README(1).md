# Insurance Claim Agent (Scaffold)

End-to-end starter scaffold for a pre-authorization / insurance-claim support agent:

- `backend/`: Node.js/Express API (serves EHR + insurer policy + orchestrates analysis)
- `ai-engine/`: Python engine (note parsing, EHR evidence extraction, ICD-10 lookup)
- `logic/`: Gap analysis + rejection risk scoring (pure JS modules)
- `frontend/`: Minimal UI stub (static HTML + placeholder React component files)
- `data/`: `raw/` (never edit), `processed/` (cleaned), `mock/` (frozen Phase 1 JSON)
- `shared/`: Frozen request/response shapes (`api_contract.json`)
- `bonus/`: Optional appeal automation scripts (stubs)

## Quick start

### 1) Backend API (Node/Express)

From `insurance-claim-agent/backend`:

```bash
npm install express cors morgan
node server.js
```

API runs on `http://localhost:3001`.

Useful endpoints:

- `GET /api/ehr/PAT_001`
- `GET /api/insurance/INS_A`
- `POST /api/analyze` (runs AI + logic using mock inputs)

### 2) AI Engine (Python)

From `insurance-claim-agent/ai-engine`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

AI engine runs on `http://localhost:8001`.

### 3) Frontend (static)

Open `insurance-claim-agent/frontend/index.html` in a browser.  
It calls the backend endpoints directly (no build step).

## Notes

- This repo is intentionally lightweight: the “AI” parts run with deterministic fallbacks unless you wire in Ollama/LangChain.
- All inter-service JSON shapes are declared in `shared/api_contract.json`. Treat that file as the source of truth.

