from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import store
from services.seed_data import ENTITY_NAME

router = APIRouter(prefix="/box2", tags=["Box 2 - External Confirmations"])

# Outbound circularisation workflow: Generate the request letter -> Approve -> Send
SEND_STAGES = ["generate", "approved", "sent"]


class StatusUpdate(BaseModel):
    status: str
    confirmed_amount: float | None = None


class SampleSelect(BaseModel):
    type: str
    mode: str            # "all" | "top" | "none"
    n: int | None = None


def _ensure_workflow(conf: dict) -> dict:
    """Backfill the send-stage workflow, mail log and circularisation selection."""
    if "send_stage" not in conf:
        conf["send_stage"] = "generate" if conf["status"] == "not_sent" else "sent"
    if "mail_log" not in conf:
        log = []
        if conf["send_stage"] == "sent":
            log.append(dict(at=conf.get("sent_date") or "2026-01-05", type="sent",
                            text=f"Confirmation request sent to {conf['party_name']}"))
        if conf["status"] in ("received", "matched", "difference"):
            log.append(dict(at=conf.get("received_date") or "2026-01-15", type="received",
                            text=f"Reply received from {conf['party_name']}"))
        conf["mail_log"] = log
    if "selected" not in conf:
        # Banks / related parties / legal default to full circularisation; trade
        # customers & suppliers start with only the already-circularised parties selected.
        if conf["type"] in ("customer", "supplier"):
            conf["selected"] = conf["status"] != "not_sent"
        else:
            conf["selected"] = True
    return conf


@router.get("/confirmations")
def list_confirmations(type: str | None = None):
    confs = store.load("confirmations")
    changed = any(k not in c for c in confs for k in ("send_stage", "mail_log", "selected"))
    for c in confs:
        _ensure_workflow(c)
    if changed:
        store.save("confirmations", confs)
    if type:
        confs = [c for c in confs if c["type"] == type]
    return confs


@router.post("/select-sample")
def select_sample(body: SampleSelect):
    """Phase 1 — pick the circularisation sample for a confirmation type:
    all parties, the top-N by balance, or none."""
    confs = store.load("confirmations")
    group = [c for c in confs if c["type"] == body.type]
    for c in confs:
        _ensure_workflow(c)
    if body.mode == "all":
        for c in group:
            c["selected"] = True
    elif body.mode == "none":
        for c in group:
            c["selected"] = False
    elif body.mode == "top":
        n = body.n or 0
        ranked = sorted(group, key=lambda c: c["gl_balance"], reverse=True)
        top_ids = {c["id"] for c in ranked[:n]}
        for c in group:
            c["selected"] = c["id"] in top_ids
    else:
        raise HTTPException(400, "mode must be all | top | none")
    store.save("confirmations", confs)
    return [c for c in confs if c["type"] == body.type]


@router.post("/confirmations/{confirmation_id}/toggle-select")
def toggle_select(confirmation_id: str):
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")
    _ensure_workflow(conf)
    conf["selected"] = not conf.get("selected", False)
    store.save("confirmations", confs)
    return conf


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


@router.post("/confirmations/{confirmation_id}/advance")
def advance_stage(confirmation_id: str):
    """Move a confirmation to the next step: generate -> approved -> sent.
    Reaching 'sent' logs an email both on the confirmation and in the central Sent Log."""
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")
    _ensure_workflow(conf)
    current = conf["send_stage"]
    idx = SEND_STAGES.index(current)
    if idx >= len(SEND_STAGES) - 1:
        raise HTTPException(400, "Confirmation has already been sent")

    conf["send_stage"] = SEND_STAGES[idx + 1]
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    if conf["send_stage"] == "sent":
        if conf["status"] == "not_sent":
            conf["status"] = "sent"
        conf["sent_date"] = today
        conf.setdefault("mail_log", []).append(
            dict(at=now, type="sent", text=f"Confirmation request sent to {conf['party_name']}")
        )
        # mirror into the central Auditor Communications Sent Log
        emails = store.load("comms_emails")
        emails.insert(0, dict(
            id=store.new_id(),
            to=conf["party_name"],
            subject=f"Audit confirmation request — {conf['party_name']}",
            body=conf.get("letter_text", ""),
            sent_at=now,
            status="logged (prototype — not dispatched)",
        ))
        store.save("comms_emails", emails)

    store.save("confirmations", confs)
    return conf


@router.post("/confirmations/{confirmation_id}/status")
def update_status(confirmation_id: str, update: StatusUpdate):
    confs = store.load("confirmations")
    conf = next((c for c in confs if c["id"] == confirmation_id), None)
    if not conf:
        raise HTTPException(404, "Confirmation not found")

    _ensure_workflow(conf)
    prev_status = conf["status"]
    conf["status"] = update.status
    if update.confirmed_amount is not None:
        conf["confirmed_amount"] = update.confirmed_amount
        conf["difference"] = round(update.confirmed_amount - conf["gl_balance"], 2)
    if update.status in ("sent",):
        conf["sent_date"] = datetime.utcnow().strftime("%Y-%m-%d")
    if update.status in ("received", "matched", "difference"):
        conf["received_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        if prev_status not in ("received", "matched", "difference"):
            conf.setdefault("mail_log", []).append(dict(
                at=datetime.utcnow().strftime("%Y-%m-%d %H:%M"), type="received",
                text=f"Reply received from {conf['party_name']}",
            ))

    store.save("confirmations", confs)
    return conf
