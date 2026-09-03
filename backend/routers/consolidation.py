from fastapi import APIRouter, HTTPException

from services import consol_data, consol_worksheets

router = APIRouter(prefix="/consolidation", tags=["Consolidation"])


@router.get("/worksheets")
def worksheets():
    """Index of the by-division consolidation worksheets."""
    return [
        {"key": w["key"], "title": w["title"], "subtitle": w["subtitle"],
         "cols": len(w["columns"]), "rows": len(w["rows"])}
        for w in consol_worksheets.WORKSHEETS.values()
    ]


@router.get("/worksheets/{key}")
def worksheet(key: str):
    w = consol_worksheets.WORKSHEETS.get(key.upper())
    if not w:
        raise HTTPException(404, "Unknown worksheet")
    return w


@router.get("/group")
def group():
    return consol_data.GROUP_INFO


@router.get("/entities")
def entities():
    return consol_data.ENTITIES


@router.get("/statements")
def statements():
    """Lightweight index of the five primary statements."""
    return [
        {"key": s["key"], "title": s["title"], "subtitle": s["subtitle"]}
        for s in consol_data.STATEMENTS.values()
    ]


@router.get("/statements/{key}")
def statement(key: str):
    st = consol_data.STATEMENTS.get(key.upper())
    if not st:
        raise HTTPException(404, "Unknown statement")
    return st


@router.get("/notes")
def notes():
    return consol_data.NOTES


@router.get("/notes/{num}")
def note(num: str):
    for n in consol_data.NOTES:
        if str(n["num"]).lower() == num.lower():
            return n
    raise HTTPException(404, "Note not found")
