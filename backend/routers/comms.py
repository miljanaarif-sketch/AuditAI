from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from services import store

router = APIRouter(prefix="/comms", tags=["Auditor Communications"])


class ChatRequest(BaseModel):
    message: str


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str


def _now() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M")


def _bot_reply(message: str) -> str:
    m = message.lower()
    annexure = store.load("annexure_items")
    confs = store.load("confirmations")

    if any(w in m for w in ("missing", "gap", "not received", "outstanding item")):
        missing = [a["item_name"] for a in annexure if a["status"] == "missing"]
        if not missing:
            return "Nothing is flagged as missing right now — all required items are uploaded or reviewed."
        lines = "\n".join(f"• {name}" for name in missing)
        return f"{len(missing)} required items are still missing:\n{lines}\n\nYou can chase these from the Full Item Listing page."

    if "confirmation" in m or "circular" in m:
        outstanding = [c for c in confs if c["status"] in ("not_sent", "sent")]
        matched = sum(1 for c in confs if c["status"] == "matched")
        lines = "\n".join(f"• {c['party_name']} — {c['status'].replace('_', ' ')}" for c in outstanding)
        return (
            f"Confirmations: {matched} of {len(confs)} matched. "
            f"{len(outstanding)} still outstanding:\n{lines}\n\n"
            "Use the email panel on the right to chase them, or generate letters from Box 2."
        )

    if any(w in m for w in ("progress", "status", "overall", "where are we")):
        reviewed = sum(1 for a in annexure if a["status"] == "reviewed")
        uploaded = sum(1 for a in annexure if a["status"] == "uploaded")
        missing = sum(1 for a in annexure if a["status"] == "missing")
        return (
            f"Current position for Obeikan Plastic FY2025:\n"
            f"• Required items: {reviewed} reviewed, {uploaded} uploaded, {missing} missing (of {len(annexure)})\n"
            f"• Confirmations matched: {sum(1 for c in confs if c['status'] == 'matched')} of {len(confs)}\n"
            "The dashboard shows the weighted overall progress bar."
        )

    if any(w in m for w in ("who", "contact", "responsible", "email address")):
        setup = store.load_obj("setup")
        contacts = setup.get("contacts", {})
        pairs = [
            ("CFO", contacts.get("cfo"), contacts.get("cfo_email")),
            ("Financial Controller", contacts.get("financial_controller"), contacts.get("financial_controller_email")),
            ("Treasury Manager", contacts.get("treasury_manager"), contacts.get("treasury_manager_email")),
            ("Legal Contact", contacts.get("legal_contact"), contacts.get("legal_contact_email")),
        ]
        lines = "\n".join(f"• {role}: {name} — {email}" for role, name, email in pairs if name)
        return f"Key contacts at Obeikan Plastic:\n{lines}\n\nThe full list is in Master Data Configuration."

    return (
        "I'm the NAWRAS assistant. I can answer from the live audit file — try asking:\n"
        "• \"What is the overall progress?\"\n"
        "• \"Which confirmations are outstanding?\"\n"
        "• \"What items are missing?\"\n"
        "• \"Who is the contact for treasury?\""
    )


@router.get("/messages")
def list_messages():
    return store.load("comms_messages")


@router.post("/chat")
def chat(body: ChatRequest):
    messages = store.load("comms_messages")
    messages.append(dict(id=store.new_id(), sender="user", text=body.message, time=_now()))
    reply = _bot_reply(body.message)
    assistant = dict(id=store.new_id(), sender="assistant", text=reply, time=_now())
    messages.append(assistant)
    store.save("comms_messages", messages)
    return assistant


@router.get("/emails")
def list_emails():
    return store.load("comms_emails")


@router.post("/email")
def send_email(body: EmailRequest):
    emails = store.load("comms_emails")
    record = dict(
        id=store.new_id(), to=body.to, subject=body.subject, body=body.body,
        sent_at=_now(), status="logged (prototype — not dispatched)",
    )
    emails.insert(0, record)
    store.save("comms_emails", emails)
    return record
