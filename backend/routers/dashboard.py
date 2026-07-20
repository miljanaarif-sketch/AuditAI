from fastapi import APIRouter

from services import store
from services.recon_engine import compute_variance, flag_status

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def summary():
    docs = [d for d in store.load("documents") if d["is_current"]]
    confs = store.load("confirmations")
    accounts = store.load("gl_accounts")
    reports = store.load("module_reports")
    annexure = store.load("annexure_items")

    flagged_reports = 0
    for r in reports:
        diff = compute_variance(r["module_balance"], r["gl_balance"])
        if flag_status(diff["variance"], threshold_amount=r["threshold_amount"]) == "flagged":
            flagged_reports += 1

    accounts_missing_evidence = sum(1 for a in accounts if a["attached_doc_count"] < len(a["expected_doc_types"]))

    annexure_reviewed = sum(1 for a in annexure if a["status"] == "reviewed")
    annexure_progress = round(annexure_reviewed / len(annexure) * 100, 1) if annexure else 0

    def annexure_pct(box: str) -> int:
        # "not_applicable" items are excluded from the base — they need no action
        items = [a for a in annexure if a["linked_box"] == box and a["status"] != "not_applicable"]
        if not items:
            return 0
        score = sum(1.0 if a["status"] == "reviewed" else 0.5 if a["status"] == "uploaded" else 0.0 for a in items)
        return round(score / len(items) * 100)

    progress = [
        {"section": "Internal Documentation", "weight": 10, "pct": annexure_pct("box1")},
        {"section": "External Confirmations", "weight": 10,
         "pct": round(sum(1 for c in confs if c["status"] == "matched") / len(confs) * 100) if confs else 0},
        {"section": "General Ledger", "weight": 35,
         "pct": round((len(accounts) - accounts_missing_evidence) / len(accounts) * 100) if accounts else 0},
        {"section": "Integrated Reports & Recons", "weight": 20,
         "pct": round((len(reports) - flagged_reports) / len(reports) * 100) if reports else 0},
        {"section": "Financial Reporting", "weight": 15,
         "pct": round(len({l["statement"] for l in store.load("statement_lines")}) / 4 * 100)},
    ]
    total_weight = sum(p["weight"] for p in progress)
    overall_pct = round(sum(p["weight"] * p["pct"] for p in progress) / total_weight) if total_weight else 0

    pending_actions = []
    for c in confs:
        if c["status"] == "not_sent":
            owner = ("Treasury" if c["type"] == "bank"
                     else "Legal" if c["type"] == "legal"
                     else "Finance" if c["type"] == "related_party"
                     else "Finance")
            pending_actions.append({"priority": "high", "item": f"Send confirmation — {c['party_name']}",
                                    "owner": owner, "due": "Today"})
    for r in reports:
        diff = compute_variance(r["module_balance"], r["gl_balance"])
        if flag_status(diff["variance"], threshold_amount=r["threshold_amount"]) == "flagged":
            owner = "Operations" if r["module"] == "Inventory" else "Finance"
            pending_actions.append({"priority": "high", "item": f"Resolve {r['module']} reconciliation variance",
                                    "owner": owner, "due": "Tomorrow"})
    for a in annexure:
        if a["status"] == "missing":
            pending_actions.append({"priority": "medium", "item": f"Obtain: {a['item_name']}",
                                    "owner": a.get("folder", "Audit Team"), "due": "This Week"})
    pending_actions.sort(key=lambda p: 0 if p["priority"] == "high" else 1)

    return {
        "progress": progress,
        "overall_pct": overall_pct,
        "pending_actions": pending_actions[:10],
        "box1": {"documents": len(docs)},
        "box2": {
            "total": len(confs),
            "matched": sum(1 for c in confs if c["status"] == "matched"),
            "outstanding": sum(1 for c in confs if c["status"] in ("sent", "not_sent")),
        },
        "box3": {"accounts": len(accounts), "missing_evidence": accounts_missing_evidence},
        "box4": {"reports": len(reports), "flagged": flagged_reports},
        "box5": {"statements": len({l["statement"] for l in store.load("statement_lines")})},
        "annexure": {"total": len(annexure), "reviewed": annexure_reviewed, "progress_pct": annexure_progress},
    }
