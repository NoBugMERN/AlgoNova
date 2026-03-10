"""
Bonus: After a claim is submitted, the agent monitors the insurer's response API.
If a rejection arrives, it automatically identifies the rejection reason,
maps it to a corrective action, and drafts an appeal letter — ready for the billing team.

Usage:
  python rejection_monitor.py              # call backend monitor API (default)
  python rejection_monitor.py --standalone # read JSON locally and run logic (no backend)
  python rejection_monitor.py --rate 0.25  # 25% simulated rejection rate
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Default backend URL when using API mode
DEFAULT_API_BASE = "http://localhost:3001"


def run_via_api(api_base: str, simulate_rejection_rate: float) -> dict:
    """Call backend GET /api/agent/check-rejections."""
    try:
        import urllib.request

        url = f"{api_base}/api/agent/check-rejections?simulateRejectionRate={simulate_rejection_rate}"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"success": False, "error": str(e), "message": "Backend not reachable. Start server: node server.js"}


def run_standalone(data_dir: Path) -> dict:
    """Read submitted_claims and insurer_responses from data/mock; for any claim without response, skip (no simulation in standalone). For rejections in insurer_responses without appealId, run action_mapper + appeal_drafter and append to appeals."""
    from action_mapper import map_rejection_to_actions
    from appeal_drafter import draft_appeal_letter

    mock_dir = data_dir / "mock"
    submitted_path = mock_dir / "submitted_claims.json"
    responses_path = mock_dir / "insurer_responses.json"
    appeals_path = mock_dir / "appeals.json"
    historical_path = mock_dir / "historical_rejections.json"

    if not submitted_path.exists():
        return {"checked": 0, "newAppeals": [], "message": "No submitted claims file"}

    submitted = json.loads(submitted_path.read_text()) if submitted_path.exists() else []
    responses = json.loads(responses_path.read_text()) if responses_path.exists() else []
    appeals = json.loads(appeals_path.read_text()) if appeals_path.exists() else []
    by_claim = {r.get("claimId") or r.get("claim_id"): r for r in responses}
    new_appeals = []

    for claim in submitted:
        claim_id = claim.get("id") or claim.get("claimId")
        if not claim_id:
            continue
        resp = by_claim.get(claim_id)
        if not resp or resp.get("status") != "rejected":
            continue
        if resp.get("appealId") or resp.get("processedAt"):
            continue
        reason = resp.get("rejectionReason") or "Documentation incomplete"
        category = resp.get("rejection_category") or resp.get("rejectionCategory") or "MISSING_DOCUMENT"
        patient_id = claim.get("patientId") or claim.get("patient_id") or "Unknown"
        actions = map_rejection_to_actions(category)
        letter = draft_appeal_letter(patient_id, claim_id, reason)
        appeal = {
            "id": f"APL_{len(appeals) + len(new_appeals) + 1}",
            "claimId": claim_id,
            "patientId": patient_id,
            "rejectionReason": reason,
            "rejectionCategory": category,
            "recommendedActions": actions,
            "appealLetter": letter,
            "status": "draft",
        }
        new_appeals.append(appeal)
        appeals.insert(0, appeal)
        for i, r in enumerate(responses):
            if (r.get("claimId") or r.get("claim_id")) == claim_id:
                responses[i] = {**r, "appealId": appeal["id"], "processedAt": "now"}
                break

    if new_appeals:
        appeals_path.parent.mkdir(parents=True, exist_ok=True)
        appeals_path.write_text(json.dumps(appeals, indent=2))
        responses_path.write_text(json.dumps(responses, indent=2))

    return {
        "checked": len(submitted),
        "newRejections": [],
        "newAppeals": new_appeals,
        "message": f"Processed {len(new_appeals)} rejection(s); appeal draft(s) ready for billing team.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Insurance claim rejection monitor (bonus)")
    parser.add_argument("--standalone", action="store_true", help="Run without backend (read/write JSON in data/mock)")
    parser.add_argument("--rate", type=float, default=0.15, help="Simulated rejection rate (0–1) when using API")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE, help="Backend base URL")
    args = parser.parse_args()

    if args.standalone:
        data_dir = Path(__file__).resolve().parent.parent / "data"
        result = run_standalone(data_dir)
    else:
        result = run_via_api(args.api_base, args.rate)

    print(json.dumps(result, indent=2))
    if isinstance(result.get("success"), bool) and not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
