from . import store
from .recon_engine import compute_variance


def account_with_journals(account_id: str) -> dict | None:
    accounts = store.load("gl_accounts")
    account = next((a for a in accounts if a["id"] == account_id), None)
    if not account:
        return None
    journals = [j for j in store.load("journals") if j["account_id"] == account_id]
    return {"account": account, "journals": journals}


def journal_with_documents(journal_id: str) -> dict | None:
    journals = store.load("journals")
    journal = next((j for j in journals if j["id"] == journal_id), None)
    if not journal:
        return None
    documents = [d for d in store.load("source_documents") if d["journal_id"] == journal_id]
    return {"journal": journal, "documents": documents}


def trace_statement_line(line_id: str) -> dict | None:
    lines = store.load("statement_lines")
    line = next((l for l in lines if l["id"] == line_id), None)
    if not line:
        return None
    accounts = [a for a in store.load("gl_accounts") if a["id"] in line.get("gl_account_ids", [])]
    module_reports = []
    if line.get("contributing_module"):
        module_reports = [
            {**m, **compute_variance(m["module_balance"], m["gl_balance"])}
            for m in store.load("module_reports")
            if m["module"] == line["contributing_module"] and m["gl_account_id"] in line.get("gl_account_ids", [])
        ]
    confirmations = []
    account_names = {a["name"] for a in accounts}
    if account_names & {"Accounts Receivable", "Cash and Bank"}:
        conf_type = "customer" if "Accounts Receivable" in account_names else "bank"
        confirmations = [c for c in store.load("confirmations") if c["type"] == conf_type]
    return {
        "line": line,
        "gl_accounts": accounts,
        "module_reports": module_reports,
        "confirmations": confirmations,
    }
