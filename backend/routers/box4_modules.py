from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import store
from services.recon_engine import compute_variance, flag_status

router = APIRouter(prefix="/box4", tags=["Box 4 - Modules and Reconciliations"])


class ModuleBalanceUpdate(BaseModel):
    module_balance: float


def _enriched(report: dict) -> dict:
    diff = compute_variance(report["module_balance"], report["gl_balance"])
    status = flag_status(diff["variance"], threshold_amount=report["threshold_amount"])
    return {**report, **diff, "status": status}


@router.get("/reports")
def list_reports():
    accounts = {a["id"]: a for a in store.load("gl_accounts")}
    reports = store.load("module_reports")
    enriched = []
    for r in reports:
        item = _enriched(r)
        account = accounts.get(r["gl_account_id"])
        item["gl_account_name"] = account["name"] if account else None
        item["gl_account_code"] = account["code"] if account else None
        enriched.append(item)
    return enriched


@router.get("/bank-reconciliation")
def bank_reconciliation():
    return store.load("bank_reconciliations")


@router.post("/reports/{report_id}/upload")
def upload_module_balance(report_id: str, update: ModuleBalanceUpdate):
    reports = store.load("module_reports")
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        raise HTTPException(404, "Module report not found")
    report["module_balance"] = update.module_balance
    store.save("module_reports", reports)
    return _enriched(report)
