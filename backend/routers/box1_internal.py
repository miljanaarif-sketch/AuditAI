from datetime import datetime

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from services import store
from services.seed_data import DOC_OWNERS

router = APIRouter(prefix="/box1", tags=["Box 1 - Internal Documentation"])

DOC_STATUSES = ("uploaded", "pending", "expired", "oig")
LEVELS = ("OIG", "BU")


class DocumentUpdate(BaseModel):
    doc_status: str | None = None
    level: str | None = None
    owner: str | None = None
    owner_email: str | None = None


class AddEntry(BaseModel):
    category: str
    name: str
    folder: str | None = None

CATEGORIES = ["Legal pack", "Group policies", "Contracts and agreements", "Structure and governance"]


@router.get("/categories")
def list_categories():
    return CATEGORIES


@router.get("/key-management")
def key_management():
    return store.load("key_management")


@router.get("/documents")
def list_documents(category: str | None = None):
    docs = [d for d in store.load("documents") if d["is_current"]]
    if category:
        docs = [d for d in docs if d["category"] == category]
    return sorted(docs, key=lambda d: (d["category"], d["name"]))


@router.get("/documents/{document_id}/history")
def document_history(document_id: str):
    docs = store.load("documents")
    current = next((d for d in docs if d["id"] == document_id), None)
    if not current:
        raise HTTPException(404, "Document not found")
    return sorted(
        [d for d in docs if d["name"] == current["name"] and d["category"] == current["category"]],
        key=lambda d: d["version"],
    )


@router.post("/documents/{document_id}/update")
def update_document(document_id: str, body: DocumentUpdate):
    docs = store.load("documents")
    doc = next((d for d in docs if d["id"] == document_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    if body.doc_status is not None:
        if body.doc_status not in DOC_STATUSES:
            raise HTTPException(400, f"doc_status must be one of {DOC_STATUSES}")
        doc["doc_status"] = body.doc_status
        # the blue "oig" status means the document is provided at parent level
        if body.doc_status == "oig":
            doc["level"] = "OIG"
    if body.level is not None:
        if body.level not in LEVELS:
            raise HTTPException(400, f"level must be one of {LEVELS}")
        doc["level"] = body.level
        # OIG-level documents are provided by the parent -> automatically OK
        if body.level == "OIG":
            doc["doc_status"] = "oig"
        elif doc.get("doc_status") == "oig":
            doc["doc_status"] = "pending"
    if body.owner is not None:
        doc["owner"] = body.owner
    if body.owner_email is not None:
        doc["owner_email"] = body.owner_email
    store.save("documents", docs)
    return doc


@router.post("/documents/{document_id}/remind")
def send_reminder(document_id: str):
    docs = store.load("documents")
    doc = next((d for d in docs if d["id"] == document_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    if not doc.get("owner_email"):
        raise HTTPException(400, "No responsible email configured for this document")
    emails = store.load("comms_emails")
    record = dict(
        id=store.new_id(),
        to=doc["owner_email"],
        subject=f"Reminder: {doc['name']} — required for the FY2025 audit",
        body=(
            f"Dear {doc.get('owner') or 'colleague'},\n\n"
            f"This is a reminder that the document \"{doc['name']}\" ({doc['category']}) "
            f"is currently marked as {doc.get('doc_status', 'pending')} in the NAWRAS audit platform. "
            f"Please upload the latest version at your earliest convenience.\n\n"
            f"Regards,\nAudit Admin"
        ),
        sent_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        status="logged (prototype — not dispatched)",
    )
    emails.insert(0, record)
    store.save("comms_emails", emails)
    return record


@router.post("/documents/add-entry")
def add_entry(body: AddEntry):
    """Add a document placeholder one-by-one (no file yet) — e.g. a new bank loan
    agreement. The file can be uploaded later from the Document Database tab."""
    docs = store.load("documents")
    owner, owner_email = DOC_OWNERS.get(body.category, ("", ""))
    new_doc = dict(
        id=store.new_id(), category=body.category, name=body.name, version=1,
        filename="", uploaded_at="—", is_current=True,
        owner=owner, owner_email=owner_email, folder=body.folder, doc_status="pending", level="BU",
    )
    docs.append(new_doc)
    store.save("documents", docs)
    return new_doc


@router.post("/documents/upload")
async def upload_document(
    category: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    folder: str | None = Form(None),
):
    docs = store.load("documents")
    prior = [d for d in docs if d["category"] == category and d["name"] == name]
    for d in prior:
        d["is_current"] = False
    next_version = (max((d["version"] for d in prior), default=0)) + 1

    upload_path = store.upload_dir("box1")
    contents = await file.read()
    dest = f"{upload_path}/{store.new_id()}_{file.filename}"
    with open(dest, "wb") as f:
        f.write(contents)

    owner, owner_email = DOC_OWNERS.get(category, ("", ""))
    level = "BU"
    if prior:
        owner = prior[-1].get("owner", owner)
        owner_email = prior[-1].get("owner_email", owner_email)
        level = prior[-1].get("level", level)
        if folder is None:
            folder = prior[-1].get("folder")
    new_doc = dict(
        id=store.new_id(), category=category, name=name, version=next_version,
        filename=file.filename, uploaded_at=datetime.utcnow().strftime("%Y-%m-%d"), is_current=True,
        owner=owner, owner_email=owner_email, folder=folder, doc_status="uploaded", level=level,
    )
    docs.append(new_doc)
    store.save("documents", docs)
    return new_doc
