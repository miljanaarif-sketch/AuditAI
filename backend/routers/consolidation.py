from fastapi import APIRouter, Body, HTTPException

from services import consol_data, consol_worksheets, rp_recon_data, store

router = APIRouter(prefix="/consolidation", tags=["Consolidation"])

# Manual FX-rate control table — average rate (Income Statement), closing rate (Balance Sheet).
FX_DEFAULT = {
    "EUR": {"name": "Euro", "entity": "MDF Spain", "avg": 4.0, "closing": 4.05},
    "EGP": {"name": "Egyptian Pound", "entity": "Egypt", "avg": 0.078, "closing": 0.076},
    "USD": {"name": "US Dollar", "entity": "O3", "avg": 3.75, "closing": 3.75},
    "CHF": {"name": "Swiss Franc", "entity": "KSA Service", "avg": 4.15, "closing": 4.2},
}


@router.get("/fx-rates")
def get_fx_rates():
    saved = store.load_obj("fx_rates")
    return saved if saved else FX_DEFAULT


@router.put("/fx-rates")
def set_fx_rates(rates: dict = Body(...)):
    """Persist the manually-entered FX control table."""
    clean = {}
    for cur, r in rates.items():
        d = FX_DEFAULT.get(cur, {})
        clean[cur] = {
            "name": r.get("name", d.get("name", cur)),
            "entity": r.get("entity", d.get("entity", "")),
            "avg": float(r.get("avg") or 0),
            "closing": float(r.get("closing") or 0),
        }
    store.save_obj("fx_rates", clean)
    return {"ok": True, "rates": clean}


def _is_agg(name: str) -> bool:
    n = name.strip().lower()
    return (n.startswith("total") or "consolidation" in n or "head office" in n
            or "affiliates and" in n or "grand" in n or n.startswith("net "))


@router.get("/rp-recon")
def rp_recon_companies():
    """Companies that can be reconciled (intercompany current accounts)."""
    return [{"key": c, "name": rp_recon_data.DISPLAY.get(c, c)}
            for c in rp_recon_data.COMPANIES if not _is_agg(rp_recon_data.DISPLAY.get(c, c))]


@router.get("/rp-recon/{company}")
def rp_recon(company: str):
    a = company.strip().lower()
    if a not in rp_recon_data.DF:
        raise HTTPException(404, "Unknown company")
    DF, DT, disp = rp_recon_data.DF, rp_recon_data.DT, rp_recon_data.DISPLAY
    rows = []
    tot_deb = tot_cred = tot_dd = tot_dc = 0.0
    counterparties = sorted(set(list(DF.get(a, {})) + [b for b in DF if a in DF.get(b, {})]))
    for b in counterparties:
        if b == a or _is_agg(disp.get(b, b)):
            continue
        debit = DF.get(a, {}).get(b, 0.0)          # A's due FROM B (A's books)
        credit = DT.get(b, {}).get(a, 0.0)         # B's due TO A (B's books)
        if not debit and not credit:
            continue
        diff = round(debit - credit, 2)
        rows.append({
            "code": b, "company": disp.get(b, b),
            "debit": debit, "credit": credit,
            "diff_debit": diff if diff > 0 else 0.0,
            "diff_credit": -diff if diff < 0 else 0.0,
        })
        tot_deb += debit; tot_cred += credit
        tot_dd += diff if diff > 0 else 0.0
        tot_dc += -diff if diff < 0 else 0.0
    rows.sort(key=lambda r: -(abs(r["debit"]) + abs(r["credit"])))
    return {
        "company": disp.get(a, a),
        "rows": rows,
        "totals": {"debit": round(tot_deb, 2), "credit": round(tot_cred, 2),
                   "diff_debit": round(tot_dd, 2), "diff_credit": round(tot_dc, 2)},
    }


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
