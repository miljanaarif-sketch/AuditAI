from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import store

router = APIRouter(prefix="/annexure", tags=["Annexure Checklist"])


class StatusUpdate(BaseModel):
    status: str


@router.get("/items")
def list_items():
    """Grouped by box → folder (sub-folder), as laid out in the client 'List of Req' file."""
    items = store.load("annexure_items")
    grouped: dict[str, dict] = {}
    for item in items:
        key = f"{item['linked_box']}::{item['folder']}"
        grouped.setdefault(key, {
            "linked_box": item["linked_box"],
            "folder": item["folder"],
            "folder_order": item.get("folder_order", 0),
            "folder_note": item.get("folder_note"),
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
