from typing import Optional
from pydantic import BaseModel


# ---------- Box 1 · Internal Documentation ----------

class InternalDocument(BaseModel):
    id: str
    category: str          # Legal pack | Group policies | Contracts & agreements | Structure & governance
    name: str
    version: int
    filename: str
    uploaded_at: str
    is_current: bool = True


# ---------- Box 2 · External Confirmations ----------

class Confirmation(BaseModel):
    id: str
    type: str               # customer | supplier | bank | legal_rp
    party_name: str
    gl_balance: float
    status: str = "not_sent"   # not_sent | sent | received | matched | difference
    confirmed_amount: Optional[float] = None
    difference: Optional[float] = None
    letter_text: Optional[str] = None
    sent_date: Optional[str] = None
    received_date: Optional[str] = None


# ---------- Box 3 · General Ledger ----------

class GLAccount(BaseModel):
    id: str
    code: str
    name: str
    category: str            # Cash | Receivables | Inventory | PPE | Payables | Equity | Revenue | COGS | Payroll | Other
    balance: float
    expected_doc_types: list[str]
    attached_doc_count: int = 0

    @property
    def missing_evidence(self) -> bool:
        return self.attached_doc_count < len(self.expected_doc_types)


class Journal(BaseModel):
    id: str
    account_id: str
    date: str
    description: str
    debit: float
    credit: float
    source: str               # manual | system
    has_approval: bool
    flags: list[str] = []


class SourceDocument(BaseModel):
    id: str
    journal_id: str
    doc_type: str
    filename: str
    uploaded_at: str


# ---------- Box 4 · Modules & Reconciliations ----------

class ModuleReport(BaseModel):
    id: str
    module: str                # Bank | AR Aging | AP Aging | Inventory | Payroll | Tax
    gl_account_id: str
    module_balance: float
    gl_balance: float
    threshold_amount: float = 10000.0

    @property
    def variance(self) -> float:
        return round(self.module_balance - self.gl_balance, 2)

    @property
    def variance_pct(self) -> float:
        if self.gl_balance == 0:
            return 0.0
        return round(abs(self.variance) / abs(self.gl_balance) * 100, 2)

    @property
    def status(self) -> str:
        return "flagged" if abs(self.variance) > self.threshold_amount else "ok"


# ---------- Box 5 · Financial Reporting ----------

class StatementLine(BaseModel):
    id: str
    statement: str              # BS | IS | CF | Equity
    section: str
    line_item: str
    amount: float
    gl_account_ids: list[str] = []
    contributing_module: Optional[str] = None


# ---------- Parallel Run ----------

class ParallelRun(BaseModel):
    id: str
    category: str                # Bank Recon | AR Aging | Inventory Valuation | Payroll Recon
    manual_amount: Optional[float] = None
    system_amount: Optional[float] = None
    tolerance_pct: float = 1.0
    status: str = "pending"       # pending | validated | override
    reviewer_note: Optional[str] = None
    signed_off_by: Optional[str] = None
    signed_off_at: Optional[str] = None

    @property
    def variance(self) -> Optional[float]:
        if self.manual_amount is None or self.system_amount is None:
            return None
        return round(self.system_amount - self.manual_amount, 2)

    @property
    def variance_pct(self) -> Optional[float]:
        if self.manual_amount in (None, 0) or self.system_amount is None:
            return None
        return round(abs(self.variance) / abs(self.manual_amount) * 100, 2)

    @property
    def within_tolerance(self) -> Optional[bool]:
        if self.variance_pct is None:
            return None
        return self.variance_pct <= self.tolerance_pct


class SignOffRequest(BaseModel):
    signed_off_by: str
    reviewer_note: Optional[str] = None
    override: bool = False


class ParallelUploadRequest(BaseModel):
    manual_amount: Optional[float] = None
    system_amount: Optional[float] = None


# ---------- Annexure Checklist ----------

class AnnexureItem(BaseModel):
    id: str
    category_number: int
    category_name: str
    item_name: str
    status: str = "missing"      # missing | uploaded | reviewed
    linked_box: Optional[str] = None
