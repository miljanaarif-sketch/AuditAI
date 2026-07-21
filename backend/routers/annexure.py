from datetime import datetime

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from services import store

router = APIRouter(prefix="/annexure", tags=["Annexure Checklist"])


class StatusUpdate(BaseModel):
    status: str


def _slug(text: str) -> str:
    keep = [c.lower() if c.isalnum() else "_" for c in text]
    return "".join(keep).strip("_")[:40]


def _enrich_linked(item: dict, documents: list[dict]) -> None:
    """For items cross-linked to a Box 1 folder, pull in the current documents and
    auto-derive status so the required item reflects what's already on file."""
    folder = item.get("linked_docs_folder")
    if not folder:
        return
    linked = [
        {"name": d["name"], "filename": d.get("filename", ""), "doc_status": d.get("doc_status", "pending")}
        for d in documents
        if d.get("is_current") and d.get("folder") == folder
    ]
    item["linked_documents"] = linked
    item["status"] = "reviewed" if linked else "missing"


@router.get("/items")
def list_items():
    """Grouped by box → folder (sub-folder), as laid out in the client 'List of Req' file."""
    items = store.load("annexure_items")
    documents = store.load("documents")
    for item in items:
        _enrich_linked(item, documents)
    grouped: dict[str, dict] = {}
    for item in items:
        key = f"{item['linked_box']}::{item['folder']}"
        grouped.setdefault(key, {
            "linked_box": item["linked_box"],
            "folder": item["folder"],
            "folder_order": item.get("folder_order", 0),
            "folder_note": item.get("folder_note"),
            "folder_group": item.get("folder_group"),
            "items": [],
        })
        grouped[key]["items"].append(item)
    return sorted(grouped.values(), key=lambda g: g["folder_order"])


@router.get("/summary")
def summary():
    items = store.load("annexure_items")
    counts = {}
    for i in items:
        counts[i["status"]] = counts.get(i["status"], 0) + 1
    return {"total": len(items), "by_status": counts}


@router.post("/items/{item_id}/status")
def update_status(item_id: str, body: StatusUpdate):
    items = store.load("annexure_items")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(404, "Item not found")
    item["status"] = body.status
    store.save("annexure_items", items)
    return item


@router.post("/items/{item_id}/upload")
async def upload_item(item_id: str, file: UploadFile = File(...), category: str = Form(None)):
    """Attach a manually uploaded document to a required item."""
    items = store.load("annexure_items")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(404, "Item not found")

    upload_path = store.upload_dir("annexure")
    contents = await file.read()
    with open(f"{upload_path}/{store.new_id()}_{file.filename}", "wb") as f:
        f.write(contents)

    item["status"] = "uploaded"
    item["source"] = "upload"
    item["filename"] = file.filename
    item["populated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    store.save("annexure_items", items)
    return item


@router.post("/items/{item_id}/pull-nawras")
def pull_from_nawras(item_id: str):
    """Simulate auto-populating a required report directly from the NAWRAS ERP.

    In production this endpoint would call the NAWRAS ERP API and stream the report
    back. Here it records a synthetic export so the integration flow is demonstrable.
    """
    items = store.load("annexure_items")
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(404, "Item not found")

    item["status"] = "reviewed"
    item["source"] = "nawras"
    item["filename"] = f"NAWRAS_{_slug(item['folder'])}_{_slug(item['item_name'])}.xlsx"
    item["populated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    store.save("annexure_items", items)
    return item
