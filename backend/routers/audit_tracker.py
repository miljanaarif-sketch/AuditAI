from collections import Counter

from fastapi import APIRouter

from services import audit_tracker_data as data

router = APIRouter(prefix="/tracker", tags=["Audit Tracker"])


@router.get("/info")
def info():
    return {**data.INFO, "level_titles": data.LEVEL_TITLES,
            "scopes": data.SCOPES, "status_cols": data.STATUS_COLS}


@router.get("/items")
def items():
    return data.ITEMS


@router.get("/summary")
def summary():
    overall = Counter(i["overall"] for i in data.ITEMS)
    per_level = {}
    for lvl, title in data.LEVEL_TITLES.items():
        rows = [i for i in data.ITEMS if i["level"] == lvl]
        per_level[lvl] = {
            "title": title,
            "total": len(rows),
            "ready": sum(1 for i in rows if i["overall"] == "Ready"),
            "blocked": sum(1 for i in rows if i["overall"] == "Blocked"),
            "counts": dict(Counter(i["overall"] for i in rows)),
        }
    return {"overall": dict(overall), "per_level": per_level, "total": len(data.ITEMS)}
