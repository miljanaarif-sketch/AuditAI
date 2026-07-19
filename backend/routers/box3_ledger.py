from fastapi import APIRouter, HTTPException

from services import store, drilldown

router = APIRouter(prefix="/box3", tags=["Box 3 - General Ledger"])


def _with_missing_flag(account: dict) -> dict:
    return {**account, "missing_evidence": account["attached_doc_count"] < len(account["expected_doc_types"])}


@router.get("/accounts")
def list_accounts():
    return [_with_missing_flag(a) for a in store.load("gl_accounts")]


@router.get("/accounts/{account_id}")
def get_account(account_id: str):
    result = drilldown.account_with_journals(account_id)
    if not result:
        raise HTTPException(404, "Account not found")
    result["account"] = _with_missing_flag(result["account"])
    return result


@router.get("/journals/{journal_id}")
def get_journal(journal_id: str):
    result = drilldown.journal_with_documents(journal_id)
    if not result:
        raise HTTPException(404, "Journal not found")
    return result


@router.get("/je-testing")
def je_testing_stats():
    journals = store.load("journals")
    total = len(journals)
    manual = sum(1 for j in journals if j["source"] == "manual")
    system = total - manual
    flagged = [j for j in journals if j["flags"]]
    return {
        "total": total,
        "manual": manual,
        "system": system,
        "manual_pct": round(manual / total * 100, 1) if total else 0,
        "system_pct": round(system / total * 100, 1) if total else 0,
        "flagged_count": len(flagged),
        "flagged": flagged,
    }
