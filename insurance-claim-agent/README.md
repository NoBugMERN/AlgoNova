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

- `GET /api/ehr/:patientId` — get_patient_ehr (diagnosis, labs, medications, prior treatments)
- `GET /api/insurance/:insurerId` — get_insurance_policy_rules (required docs, qualifying ICD-10, max amount)
- `POST /api/analyze` — **full agent pipeline**: ingest note → EHR + policy → gap analysis → risk score → preauth form + doctor alert; **persists claim** for analytics
- `GET /api/analytics` — dashboard stats, charts (by insurer, by status), claims list (CSV + submitted)
- `GET /api/agent/tools` — list of simulated agent tools (for demo)
- `GET /api/alerts` — doctor alerts (missing-document notifications)
- `GET /api/appeals` — list appeal drafts
- `POST /api/appeals/reject` — **bonus**: record rejection → action mapping + draft appeal letter

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

## Agent flow (problem statement)

1. **Ingest** surgeon note → procedure, ICD-10, CPT (FastAPI `/parse_note`).
2. **Retrieve** policy rules for insurer + procedure (mock `insurance_policies.json`).
3. **Search** patient EHR for supporting evidence (FastAPI `/extract_ehr`).
4. **Gap analysis** → missing docs flagged; **notify_doctor** stores actionable alert.
5. **Assemble** pre-auth form with cited evidence (`response.preauth_form`).
6. **Score** rejection risk (Low/Medium/High) via `logic/riskEngine.js` + historical CSV.
7. **Persist** submitted claim → appears in analytics/history after refresh.

**Bonus — Rejection monitor:** After a claim is submitted, the agent can monitor the insurer's response. If a rejection arrives, it automatically identifies the reason, maps it to a corrective action, and drafts an appeal letter (ready for the billing team).
- **Monitor:** `GET` or `POST /api/agent/check-rejections` — checks submitted claims, simulates insurer responses (configurable rate), and for each rejection runs action mapping + appeal draft.
- **Webhook:** `POST /api/insurer/response` — body `{ claimId, status: "rejected", rejectionReason, rejectionCategory }` to simulate insurer sending a rejection; agent immediately creates the appeal draft.
- **Manual:** `POST /api/appeals/reject` — same as above with explicit payload; list drafts via `GET /api/appeals`.
- **Python:** `python bonus/rejection_monitor.py` (calls backend monitor); `python bonus/rejection_monitor.py --standalone` (processes `data/mock/insurer_responses.json` locally).

## Notes

- This repo is intentionally lightweight: the “AI” parts run with deterministic fallbacks unless you wire in Ollama/LangChain.
- All inter-service JSON shapes are declared in `shared/api_contract.json`. Treat that file as the source of truth.
- Submitted claims are stored in `data/mock/submitted_claims.json` and merged into `GET /api/analytics`.

