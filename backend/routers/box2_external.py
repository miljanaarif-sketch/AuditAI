from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import store
from services.seed_data import ENTITY_NAME

router = APIRouter(prefix="/box2", tags=["Box 2 - External Confirmations"])


class StatusUpdate(BaseModel):
    status: str
    confirmed_amount: float | None = None


@router.get("/confirmations")
def list_confirmations(type: str | None = None):
    confs = store.load("confirmations")
    if type:
        confs = [c for c in confs if c["type"] == type]
    return confs


@router.get("/summary")
def summary():
    confs = store.load("confirmations")
    counts = {}
    for c in confs:
        counts[c["status"]] = counts.get(c["status"], 0) + 1
    return {"total": len(confs), "by_status": counts}


@router.post("/confirmations/{confirmation_id}/generate-letter")
def generate_letter(confirmation_id: str):
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")
    return {"letter_text": conf["letter_text"]}


@router.get("/confirmations/{confirmation_id}/received-letter")
def received_letter(confirmation_id: str):
    """The reply received back from the third party — available once status is received/matched."""
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")
    if conf["status"] not in ("received", "matched", "difference"):
        raise HTTPException(400, "No reply has been received for this confirmation yet")

    confirmed = conf.get("confirmed_amount")
    gl = conf["gl_balance"]
    diff = conf.get("difference")
    confirmed_line = (
        f"We confirm the balance as SAR {confirmed:,.2f}." if confirmed is not None
        else "We confirm the balance as stated."
    )
    diff_line = (
        f"\n\nNote: this differs from your records (SAR {gl:,.2f}) by SAR {diff:,.2f}, "
        "which relates to items in transit at year-end."
        if diff else ""
    )
    text = (
        f"[RECEIVED — stamped reply]\n\n"
        f"Date received: {conf.get('received_date') or 'n/a'}\n\n"
        f"To the Auditors,\n\n"
        f"In response to the audit confirmation request for {ENTITY_NAME} as at 31 December 2025, "
        f"we, {conf['party_name']}, respond as follows.\n\n"
        f"{confirmed_line}{diff_line}\n\n"
        f"This confirmation is provided directly to the auditors and is duly signed and stamped.\n\n"
        f"Authorised signatory\n{conf['party_name']}"
    )
    return {
        "received_letter_text": text,
        "received_date": conf.get("received_date"),
        "confirmed_amount": confirmed,
        "difference": diff,
    }


@router.post("/confirmations/{confirmation_id}/status")
def update_status(confirmation_id: str, update: StatusUpdate):
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")

    conf["status"] = update.status
    if update.confirmed_amount is not None:
        conf["confirmed_amount"] = update.confirmed_amount
        conf["difference"] = round(update.confirmed_amount - conf["gl_balance"], 2)
    if update.status in ("sent",):
        conf["sent_date"] = datetime.utcnow().strftime("%Y-%m-%d")
    if update.status in ("received", "matched", "difference"):
        conf["received_date"] = datetime.utcnow().strftime("%Y-%m-%d")

    store.save("confirmations", confs)
    return conf
