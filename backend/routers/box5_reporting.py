from fastapi import APIRouter, HTTPException

from services import store, drilldown

router = APIRouter(prefix="/box5", tags=["Box 5 - Financial Reporting"])

NOTES = [
    dict(title="Basis of preparation", body="The financial statements are prepared in accordance with IFRS as endorsed in the Kingdom of Saudi Arabia (SOCPA)."),
    dict(title="Going concern", body="Management has assessed the entity's ability to continue as a going concern and concluded no material uncertainty exists."),
    dict(title="Impairment of PPE", body="No indicators of impairment were identified for property, plant and equipment during the year."),
    dict(title="Subsequent events", body="No significant subsequent events have been identified requiring adjustment or disclosure."),
    dict(title="Related party transactions", body="Balances and transactions with the ultimate parent, Obeikan Investment Group, are disclosed and were conducted on an arm's-length basis."),
]


@router.get("/statements/{statement}")
def get_statement(statement: str):
    statement = statement.upper()
    lines = [l for l in store.load("statement_lines") if l["statement"] == statement]
    if not lines:
        raise HTTPException(404, "No lines found for this statement")
    sections: dict[str, list[dict]] = {}
    for line in lines:
        sections.setdefault(line["section"], []).append(line)
    total = round(sum(l["amount"] for l in lines), 2)
    return {"statement": statement, "sections": sections, "total": total}


@router.get("/notes")
def get_notes():
    return NOTES


@router.get("/trace/{line_id}")
def trace(line_id: str):
    result = drilldown.trace_statement_line(line_id)
    if not result:
        raise HTTPException(404, "Statement line not found")
    return result
