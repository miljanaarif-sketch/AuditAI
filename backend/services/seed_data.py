"""Seeds the JSON data store with a fictitious entity: Horizon Manufacturing Co.
Only runs once — if data files already exist, seeding is skipped.
"""
import re

from . import store


# Requirement wording is kept generic: drop "(sample ...)" notes and specific-year
# dates so the listing reads as a reusable checklist rather than a one-off request.
_DATE_SUBS = [
    (r"for the year ended 31 December 2025", "for the year"),
    (r"the year ended 31 December 2025", "the year"),
    (r"from January 2025 to December 2025", "for the full year"),
    (r"January to December 2025", "for the full year"),
    (r"as of 31 December 2025", "as at year end"),
    (r"as at 31 December 2025", "as at year end"),
    (r"around 31 December 2025", "around year end"),
    (r"ending 31 December 2025", "at year end"),
    (r"at 31 December 2025", "at year end"),
    (r"31 December 2025", "year end"),
    (r"year end 2025", "year end"),
    (r"for December 2025", "for December"),
    (r"December 2025", "December"),
    (r"2025 repayments", "repayments made during the year"),
    (r"during FY2025", "during the year"),
    (r"for FY2025", "for the year"),
    (r"FY2025", "the year"),
    (r"for Q4 of 2025", "for Q4"),
    (r"for Q4 2025", "for Q4"),
    (r"Q4 of 2025", "Q4"),
    (r"Q4 2025", "Q4"),
    (r"entered during 2025", "entered during the year"),
    (r"during 2025", "during the year"),
    (r"for 2025\b(?! and)", "for the year"),
]


def _genericise(text: str) -> str:
    # remove any parenthetical that mentions a sample (e.g. "(sample will be shared)")
    text = re.sub(r"\s*\([^)]*[Ss]ample[^)]*\)", "", text)
    for pat, repl in _DATE_SUBS:
        text = re.sub(pat, repl, text)
    return re.sub(r"\s{2,}", " ", text).strip()

ENTITY_NAME = "Obeikan Plastic"

GL_ACCOUNTS = [
    dict(code="1000", name="Cash and Bank", category="Cash", balance=2450000,
         expected_doc_types=["Bank Statement", "Bank Confirmation", "Bank Reconciliation"], attached_doc_count=3),
    dict(code="1100", name="Accounts Receivable", category="Receivables", balance=8200000,
         expected_doc_types=["Customer Contract", "Invoice", "Customer Confirmation", "Aging Report"], attached_doc_count=4),
    dict(code="1200", name="Inventory - Raw Materials", category="Inventory", balance=3100000,
         expected_doc_types=["Purchase Order", "GRN", "Invoice", "Valuation Working"], attached_doc_count=4),
    dict(code="1210", name="Inventory - Finished Goods", category="Inventory", balance=2650000,
         expected_doc_types=["Production Report", "Dispatch Note", "Valuation Working", "NRV Testing"], attached_doc_count=2),
    dict(code="1300", name="Prepayments and Other Assets", category="Other", balance=950000,
         expected_doc_types=["Prepayment Agreement", "Invoice"], attached_doc_count=2),
    dict(code="1400", name="Property, Plant and Equipment", category="PPE", balance=14800000,
         expected_doc_types=["Fixed Asset Register", "Capex Invoice", "Board Approval", "Impairment Working"], attached_doc_count=2),
    dict(code="1500", name="Right-of-Use Assets", category="PPE", balance=1200000,
         expected_doc_types=["Lease Contract", "IFRS16 Calculation"], attached_doc_count=2),
    dict(code="2000", name="Accounts Payable", category="Payables", balance=4300000,
         expected_doc_types=["Supplier Contract", "Invoice", "Supplier Confirmation", "GRN"], attached_doc_count=4),
    dict(code="2100", name="Accrued Expenses", category="Payables", balance=780000,
         expected_doc_types=["Accrual Basis Schedule"], attached_doc_count=1),
    dict(code="2200", name="VAT Payable", category="Payables", balance=210000,
         expected_doc_types=["VAT Return", "VAT Reconciliation"], attached_doc_count=2),
    dict(code="2300", name="Employees End of Service Benefits", category="Payroll", balance=1650000,
         expected_doc_types=["Actuarial Valuation", "EOSB Calculation"], attached_doc_count=2),
    dict(code="2400", name="Long-term Loan", category="Payables", balance=6000000,
         expected_doc_types=["Loan Agreement", "Bank Confirmation", "Repayment Schedule"], attached_doc_count=2),
    dict(code="2500", name="Lease Liabilities", category="Payables", balance=1150000,
         expected_doc_types=["Lease Contract", "IFRS16 Calculation"], attached_doc_count=2),
    dict(code="3000", name="Share Capital", category="Equity", balance=10000000,
         expected_doc_types=["Articles of Association", "Shareholder Resolution"], attached_doc_count=2),
    dict(code="3100", name="Retained Earnings", category="Equity", balance=5850000,
         expected_doc_types=["Board Minutes", "Prior Year Financial Statements"], attached_doc_count=2),
    dict(code="4000", name="Revenue", category="Revenue", balance=32400000,
         expected_doc_types=["Customer Contract", "Sales Invoice", "Delivery Note", "Revenue Cut-off Testing"], attached_doc_count=4),
    dict(code="5000", name="Cost of Sales", category="COGS", balance=21600000,
         expected_doc_types=["Purchase Order", "GRN", "Cost Breakdown"], attached_doc_count=3),
    dict(code="6000", name="Payroll Expense", category="Payroll", balance=4200000,
         expected_doc_types=["Payroll Summary", "GOSI Reconciliation", "Bank Transfer Support"], attached_doc_count=3),
    dict(code="6100", name="General and Administrative Expenses", category="Other", balance=2100000,
         expected_doc_types=["Expense Schedule", "Supporting Invoices"], attached_doc_count=2),
    dict(code="6200", name="Finance Costs", category="Other", balance=480000,
         expected_doc_types=["Interest Computation", "Bank Payment Support"], attached_doc_count=2),
    dict(code="6300", name="Other Income", category="Other", balance=150000,
         expected_doc_types=["Scrap Sale Approval", "Other Income Breakup"], attached_doc_count=1),
]

JOURNAL_TEMPLATES = [
    ("2025-03-14", "Monthly recurring entry", "system", True, []),
    ("2025-06-30", "Mid-year adjustment", "manual", True, []),
    ("2025-09-20", "Weekend posting - vendor settlement", "manual", True, ["weekend_posting"]),
    ("2025-12-31", "Period-end adjustment", "manual", False, ["period_end", "no_approval"]),
    ("2025-11-05", "Routine transaction", "system", True, []),
]

CUSTOMERS = [
    ("Al Faisal Trading Co.", 2100000, "matched"),
    ("Gulf Medical Supplies", 1650000, "received"),
    ("Al Noor Retail Group", 1200000, "matched"),
    ("Eastern Province Distributors", 980000, "sent"),
    ("Capital Health Systems", 750000, "not_sent"),
    ("Riyadh Care Hospital", 640000, "not_sent"),
    ("Jeddah Medical Center", 520000, "not_sent"),
    ("Dammam Wholesale Co.", 430000, "not_sent"),
    ("Makkah Trading Est.", 360000, "not_sent"),
    ("Taibah Distributors", 280000, "not_sent"),
    ("Najran Supplies Co.", 190000, "not_sent"),
    ("Hail Retail Group", 120000, "not_sent"),
]

SUPPLIERS = [
    ("Saudi Steel Industries", 1450000, "matched"),
    ("Gulf Packaging Co.", 980000, "received"),
    ("Al Yamamah Chemicals", 720000, "matched"),
    ("Prime Logistics Co.", 560000, "sent"),
    ("National Spare Parts Est.", 410000, "not_sent"),
    ("Arabian Polymers Co.", 350000, "not_sent"),
    ("Red Sea Freight", 300000, "not_sent"),
    ("Desert Tools Trading", 250000, "not_sent"),
    ("Modern Machinery Est.", 200000, "not_sent"),
    ("Falcon Electricals", 150000, "not_sent"),
    ("Oasis Maintenance Co.", 100000, "not_sent"),
    ("Sahara Consumables", 60000, "not_sent"),
]

BANKS = [
    ("Riyadh Bank", 1450000, "matched"),
    ("Arab National Bank (ANB)", 1000000, "received"),
]

RELATED_PARTY = [
    ("Obeikan Investment Group (ultimate parent)", 3200000, "matched"),
    ("Obeikan Glass Co. (fellow subsidiary)", 1450000, "sent"),
    ("Obeikan Paper Industries (fellow subsidiary)", 780000, "not_sent"),
]

LEGAL = [
    ("Al Rashid Law Firm (litigation)", 0, "received"),
]

# (document name, folder, status, level) — folder groups big lists inside a category;
# status: uploaded (green) / pending (red) / expired (yellow) / oig (blue, provided at parent level);
# OIG (parent) level is used ONLY for Group policies; everything else is BU. level: OIG / BU
DOCUMENTS_VERSION = 7

INTERNAL_DOCS = {
    "Legal pack": [
        ("Commercial Registration (CR)", None, "uploaded", "BU"),
        ("Articles of Association", None, "uploaded", "BU"),
        ("SAGIA Certificate", None, "uploaded", "BU"),
        ("VAT Registration Certificate", None, "uploaded", "BU"),
        ("GOSI Certificate", None, "expired", "BU"),
        ("Zakat Registration Certificate", None, "uploaded", "BU"),
    ],
    "Group policies": [
        ("Accounting Policy Manual", None, "oig", "OIG"),
        ("HR Policy Manual", None, "oig", "OIG"),
        ("Supply Chain Policy Manual", None, "oig", "OIG"),
        ("IT Policy Manual", None, "oig", "OIG"),
        ("Authority Matrix", None, "oig", "OIG"),
    ],
    "Contracts and agreements": [
        ("Customer Master Agreement - Al Faisal Trading Co.", "Customer contracts", "uploaded", "BU"),
        ("Customer Contract - Gulf Medical Supplies", "Customer contracts", "uploaded", "BU"),
        ("Customer Contract - Al Noor Retail Group", "Customer contracts", "expired", "BU"),
        ("Customer Contract - Eastern Province Distributors", "Customer contracts", "uploaded", "BU"),
        ("Customer Contract - Capital Health Systems", "Customer contracts", "pending", "BU"),
        ("Supplier Agreement - Saudi Steel Industries", "Supplier contracts", "uploaded", "BU"),
        ("Supplier Agreement - Gulf Packaging Co.", "Supplier contracts", "uploaded", "BU"),
        ("Supplier Agreement - Al Yamamah Chemicals", "Supplier contracts", "uploaded", "BU"),
        ("Supplier Agreement - Prime Logistics Co.", "Supplier contracts", "uploaded", "BU"),
        ("Supplier Agreement - National Spare Parts Est.", "Supplier contracts", "pending", "BU"),
        ("Lease Agreement - HQ Building", "Lease agreements", "uploaded", "BU"),
        ("Lease Agreement - Dammam Warehouse", "Lease agreements", "uploaded", "BU"),
        ("Rent Agreement - Riyadh Sales Office", "Rent agreements", "uploaded", "BU"),
        ("Rent Agreement - Staff Accommodation", "Rent agreements", "pending", "BU"),
        ("Service Agreement - IT Managed Services", "Service agreements", "uploaded", "BU"),
        ("Service Agreement - Security Services", "Service agreements", "uploaded", "BU"),
        ("Service Agreement - Facility Maintenance", "Service agreements", "expired", "BU"),
        ("Loan Agreement - Riyadh Bank", "Bank loan agreements", "uploaded", "BU"),
        ("Loan Agreement - Arab National Bank (ANB)", "Bank loan agreements", "uploaded", "BU"),
    ],
    "Structure and governance": [
        ("Organization Chart", None, "uploaded", "BU"),
        ("Board Resolution Appointing External Auditor (Ministry of Commerce notification)", None, "uploaded", "BU"),
        ("Shareholders Resolution", None, "uploaded", "BU"),
        ("UBO Declaration", None, "pending", "BU"),
    ],
}

# Key management personnel — designation, role and annual compensation (SAR)
KEY_MANAGEMENT = [
    dict(name="Abdullah Al-Rashid", designation="Chief Executive Officer",
         role="Overall strategy and management", compensation=1850000),
    dict(name="Faisal Al-Mutairi", designation="Chief Financial Officer",
         role="Finance, treasury and reporting", compensation=1420000),
    dict(name="Nadia Hassan", designation="Financial Controller",
         role="Accounting and controls", compensation=920000),
    dict(name="Yousef Al-Qahtani", designation="Treasury Manager",
         role="Cash, banking and financing", compensation=780000),
    dict(name="Maha Al-Otaibi", designation="HR Manager",
         role="Human resources and payroll", compensation=690000),
    dict(name="Tariq Mahmoud", designation="IT Manager",
         role="Information technology", compensation=650000),
]

# Auditor-communication tickets — the query/request queue with a message thread
TICKETS = [
    dict(number=1243, subject="Confirmation reply pending — Capital Health Systems", status="pending",
         severity="high", type="Confirmation", group="AR Team", assigned_to="Sara Al-Harbi", days_open=2,
         messages=[
             dict(sender="System", at="2026-01-05 09:10", text="Confirmation request sent to Capital Health Systems (SAR 750,000)."),
             dict(sender="Audit Team", at="2026-01-06 14:22", text="No reply received yet. Please follow up with the client's AR contact."),
         ]),
    dict(number=1244, subject="Bank reconciliation variance — Riyadh Bank", status="open",
         severity="high", type="Reconciliation", group="Treasury", assigned_to="Omar Siddiqui", days_open=1,
         messages=[
             dict(sender="Audit Team", at="2026-01-07 10:05", text="Adjusted book balance ties to the bank statement — please confirm the outstanding cheques list."),
         ]),
    dict(number=1245, subject="Missing: supporting documents for major capital additions (PPE)", status="pending",
         severity="normal", type="Document Request", group="Fixed Assets", assigned_to="Nadia Hassan", days_open=5,
         messages=[
             dict(sender="Audit Team", at="2026-01-03 11:40", text="Capex additions >SAR 1m need PO, invoice and board approval."),
             dict(sender="Client", at="2026-01-04 16:10", text="Gathering the approvals — expect to share by end of week."),
         ]),
    dict(number=1246, subject="NAWRAS API export — payroll summary (Jan–Dec)", status="open",
         severity="normal", type="Integration", group="Payroll", assigned_to="Maha Al-Otaibi", days_open=1,
         messages=[
             dict(sender="System", at="2026-01-07 08:30", text="Payroll summary pulled from NAWRAS ERP. Names excluded per policy."),
         ]),
    dict(number=1247, subject="Legal confirmation letter — litigation status", status="pending",
         severity="high", type="Confirmation", group="Legal", assigned_to="Reem Al-Saleh", days_open=3,
         messages=[
             dict(sender="Audit Team", at="2026-01-05 13:15", text="Request sent to Al Rashid Law Firm for litigation status confirmation."),
         ]),
    dict(number=1248, subject="Clarify EOSB actuarial assumptions", status="closed",
         severity="normal", type="Query", group="HR", assigned_to="Tariq Mahmoud", days_open=7,
         messages=[
             dict(sender="Audit Team", at="2026-01-01 09:00", text="Please confirm discount rate and salary-escalation used in the EOSB actuarial valuation."),
             dict(sender="Client", at="2026-01-02 10:30", text="Discount 4.5%, escalation 3.0% — actuary report attached."),
             dict(sender="Audit Team", at="2026-01-02 15:45", text="Received and agreed. Closing this query."),
         ]),
]

# responsible person per Box 1 category — surfaced in the drill-down
DOC_OWNERS = {
    "Legal pack": ("Reem Al-Saleh", "r.alsaleh@obeikanplastic.example.sa"),
    "Group policies": ("Nadia Hassan", "n.hassan@obeikanplastic.example.sa"),
    "Contracts and agreements": ("Faisal Al-Mutairi", "f.almutairi@obeikanplastic.example.sa"),
    "Structure and governance": ("Abdullah Al-Rashid", "a.alrashid@obeikanplastic.example.sa"),
}

# Bank reconciliation workings — book balance vs bank balance with reconciling items
BANK_RECONCILIATIONS = [
    dict(
        bank="Riyadh Bank", account="Main Operating - 401-xxxx-3030",
        book_balance=1450000, bank_statement_balance=1387500,
        items=[
            dict(label="Add: Deposits in transit", amount=85000),
            dict(label="Less: Outstanding cheques", amount=-140000),
            dict(label="Less: Bank charges not recorded", amount=-7500),
        ],
    ),
    dict(
        bank="Arab National Bank (ANB)", account="Payroll - 402-xxxx-9000",
        book_balance=1000000, bank_statement_balance=1003200,
        items=[
            dict(label="Add: Direct deposit not recorded", amount=12000),
            dict(label="Less: Outstanding payroll cheques", amount=-8800),
        ],
    ),
]

MODULE_REPORTS = [
    dict(module="Bank", gl_account_code="1000", module_balance=2447500, threshold_amount=10000),
    dict(module="AR Aging", gl_account_code="1100", module_balance=8235000, threshold_amount=10000),
    dict(module="AP Aging", gl_account_code="2000", module_balance=4302000, threshold_amount=10000),
    dict(module="Inventory", gl_account_code="1210", module_balance=2610000, threshold_amount=10000),
    dict(module="Payroll", gl_account_code="6000", module_balance=4198500, threshold_amount=10000),
    dict(module="Tax", gl_account_code="2200", module_balance=210000, threshold_amount=10000),
]

# Full required-reports list (PBC), organised exactly as the client's "List of Req" file:
# each row is assigned to a Box and to a named sub-folder within that box.
# (box, folder, note_or_None, [item_names...])
ANNEXURE_VERSION = 12

ANNEXURE = [
    # ---- Box 1 · Internal Documentation ----
    ("box1", "General & Planning", None, [
        "Management assessment of going concern",
        "Impairment working for PPE",
        "Details of all contingencies and commitments at year end (letters of guarantee / letters of credit / capital commitments)",
        "Details of significant subsequent events post year end",
        "Approved budget (CAPEX and OPEX)",
        "Responses to the fraud inquiries",
        "Board / management approvals for capital projects",
    ]),
    ("box1", "Financial assumptions", None, [
        "Basis of discount rate used in the calculation of IFRS 16",
    ]),
    ("box1", "Related Party", None, [
        "List of key management personnel with designation, respective roles and their compensation for the year",
    ]),

    # ---- Box 2 · External Confirmation ----
    ("box2", "Accounts Receivables", None, [
        "Confirmation of receivable balances as at 31 December 2025 directly to auditors (sample will be shared)",
    ]),

    # ---- Box 3 · General Ledger ----
    ("box3", "On Top — GL Dump", "To be developed below the GL dump, until further instructions.", [
        "GL dump of all account balances for the entire year (matching the trial balance) ending 31 December 2025",
        "All journal entries recorded during the year",
    ]),
    ("box3", "Revenue Drill-down", "Make a note for the revenue drill-down.", [
        "Sales order",
        "GDN",
        "Delivery challan with customer acknowledgement",
        "Commercial invoice",
    ]),
    ("box3", "On Top — Income Statement", None, [
        "Schedules of all expenses under general and admin expense incurred during the year",
        "List of professional services engaged during the year with agreements (service / support fees), or basis of expenses with supports",
        "Supporting invoices for the expenses incurred during the year (sampled per category)",
    ]),

    # ---- Box 4 · Integrated Reports & Recon ----
    ("box4", "Bank Statements", None, [
        "Bank statements for all banks (full year and subsequent to year end)",
    ]),
    ("box4", "Bank Balances & Reconciliation", None, [
        "Listing of all bank balances as at year end",
        "Bank reconciliation for December for all accounts",
        "Direct confirmation from the bank",
    ]),
    ("box4", "Zakat and Tax", None, [
        "Zakat and income tax working and payment details for the year, and amounts payable as at year end",
        "Zakat and income tax returns for all the quarters filed during the year",
        "VAT, WHT and deferred tax calculations and returns filed during the year",
        "List and status of open assessments as at 31 December 2025 for VAT, WHT and Zakat, with related correspondence",
        "Calculation of VAT receivable with VAT return for Q4 of 2025",
    ]),
    ("box4", "Fixed Assets", None, [
        "Fixed asset register showing opening balance, additions, disposals and depreciation for FY2025",
        "Supporting documents for major capital additions during FY2025",
        "Disposal documentation for assets retired or scrapped during FY2025",
        "Depreciation calculation methodology and useful life assumptions",
        "Ownership documents of the land and building",
    ]),
    ("box4", "Assets Under Construction", None, [
        "AUC register / project-wise schedule (project name, location, dates, opening balance, additions, transfers to PPE, closing balance)",
        "Project progress reports / engineer certificates indicating percentage of completion",
        "Breakdown of costs capitalized per project (materials, labour, contractors, consultants) with expected transfer dates to PPE",
    ]),
    ("box4", "Right-of-Use Assets", None, [
        "Additions and deletions / disposals of leases, with lease liability and ROU calculation for additions",
        "Signed copies of all contracts related to ROU balances outstanding as at year end 2025",
    ]),
    ("box4", "Investments & Property", None, [
        "Investment valuation report",
        "Property valuation report",
        "Title deed copies",
    ]),
    ("box4", "Related Party", None, [
        "Complete list of related parties along with the relationship with each party",
        "Complete list of balances due from and due to related parties as at 31 December 2025",
        "Confirmation of all related party balances duly stamped and signed by authorized signatory",
        "Transfer pricing details of transactions entered during 2025",
    ]),
    ("box4", "Accounts Receivables", None, [
        "Complete list of trade receivables along with aging as at 31 December 2025",
        "Subsequent to year end receipts from receivables balances",
        "List of outstanding invoices for all receivables at year end (invoice date, amount, party)",
        "Details of advance from customer",
    ]),
    ("box4", "ECL", None, [
        "ECL calculation on receivables balances as at year end, with the ECL model and basis / assumptions used",
    ]),
    ("box4", "Inventory — Raw Materials", None, [
        "Final raw materials inventory listing as of 31 December 2025 (item codes, quantities, rates, values, location)",
        "Raw materials movement report (opening, purchases, issues, closing)",
        "Raw materials valuation working file with supporting data for selected items",
        "Raw materials aging report with obsolete / slow-moving / damaged items and related provision",
    ]),
    ("box4", "Inventory — Work in Progress", None, [
        "Final WIP listing as of 31 December 2025 (job/order reference, stage of completion, quantities, values)",
        "WIP movement report (opening, additions, transfers to finished goods, closing)",
        "WIP valuation working file (material, labour, overhead components and allocation basis)",
        "Production reports and supporting schedules evidencing stage of completion at year end",
        "WIP aging analysis with obsolete / non-recoverable WIP and related provision",
        "Cut-off testing — WIP: production reports around year end, jobs transferred to FG, costs included up to 31 December only",
    ]),
    ("box4", "Inventory — Finished Goods", None, [
        "Final finished goods inventory listing as of 31 December 2025 (item codes, quantities, rates, values, location)",
        "Finished goods movement report (opening, production transfers, sales/dispatches, closing)",
        "Finished goods valuation working file (cost build-up, overhead allocation, Weighted Average)",
        "Dispatch notes / delivery challans for finished goods issued near year end",
        "Finished goods aging report with slow-moving / obsolete items and related provision",
        "NRV testing: subsequent sales report to verify FG recorded at lower of cost or NRV",
    ]),
    ("box4", "Inventory — Spare Parts", None, [
        "Final spare parts inventory listing as of 31 December 2025 (item codes, quantities, rates, values, location)",
        "Spare parts movement report (opening, purchases, issues, closing)",
        "Spare parts valuation working file (Weighted Average basis)",
        "Spare parts aging report highlighting slow-moving / obsolete / non-usable items and provision",
    ]),
    ("box4", "Purchase Invoices", None, [
        "GRNs and purchase invoices recorded (raw materials and spare parts: PO, delivery challan, vendor invoice, GRN)",
    ]),
    ("box4", "Prepayment", None, [
        "Breakup of advances, prepayments and other assets",
        "Employee-wise detail of advances to employees (sample will be shared for approval)",
        "Agreements of prepayments and invoices, with support of amounts paid",
    ]),
    ("box4", "ESOB", None, [
        "End of service benefits calculations per Saudi labour law (with movement from opening to closing)",
        "Payments made to leaving employees during the period, with employee list and final settlement files",
    ]),
    ("box4", "Actuarial Valuation", None, [
        "Actuarial valuation report",
        "Engagement letter",
    ]),
    ("box4", "Borrowings", None, [
        "Signed loan agreements",
        "All amendments, side letters, waivers or covenant modification letters applicable during 2025",
        "Signed repayment schedule",
        "Bank statements / payment advices supporting 2025 repayments, plus direct bank confirmation",
        "Interest computation schedules for 2025 (long-term and short-term loans)",
        "Upfront fee amortization schedule for SIDF loan and supporting invoices",
        "Support for interest payments (traced to bank statements on sample)",
        "L/C charges breakup",
    ]),
    ("box4", "Accounts Payable", None, [
        "Schedule of trade payables",
        "Supporting invoices and payments made subsequent to year end for trade payables",
        "Confirmations to third-party payable balances (sample will be provided)",
        "Details of advance to suppliers",
    ]),
    ("box4", "Accruals", None, [
        "Schedule of accruals and other liabilities as at year end, with calculations, basis and supports",
        "Supporting invoices and payments made subsequent to year end for accruals and other liabilities",
    ]),
    ("box4", "Revenue", None, [
        "Party-wise details and listing of all revenue vouchers and invoices for 2025 (by product category, customer group, region)",
        "Price lists, approval matrix and master data reports",
        "Sales return and credit note listing for the year",
    ]),
    ("box4", "Purchase", None, [
        "List of all purchase orders entered during the year",
        "Break of material cost",
        "Breakdown of production cost",
    ]),
    ("box4", "Employee Cost", None, [
        "Full list of payroll summary from January 2025 to December 2025 (exclude names)",
        "Joiner and leavers listing",
        "Employee loan",
    ]),
    ("box4", "Other Income", None, [
        "Details of scrap sale along with the approval of sale",
        "Breakup of the miscellaneous other income",
    ]),
]

# Box 4 folders are presented under three financial-statement groupings
FOLDER_GROUPS = {
    # Income Statement items
    "Revenue": "Income Statement items",
    "Purchase": "Income Statement items",
    "Employee Cost": "Income Statement items",
    "Other Income": "Income Statement items",
    # Balance Sheet items
    "Bank Statements": "Balance Sheet items",
    "Bank Balances & Reconciliation": "Balance Sheet items",
    "Fixed Assets": "Balance Sheet items",
    "Assets Under Construction": "Balance Sheet items",
    "Right-of-Use Assets": "Balance Sheet items",
    "Investments & Property": "Balance Sheet items",
    "Related Party": "Balance Sheet items",
    "Accounts Receivables": "Balance Sheet items",
    "ECL": "Balance Sheet items",
    "Inventory — Raw Materials": "Balance Sheet items",
    "Inventory — Work in Progress": "Balance Sheet items",
    "Inventory — Finished Goods": "Balance Sheet items",
    "Inventory — Spare Parts": "Balance Sheet items",
    "Prepayment": "Balance Sheet items",
    "ESOB": "Balance Sheet items",
    "Actuarial Valuation": "Balance Sheet items",
    "Borrowings": "Balance Sheet items",
    "Accounts Payable": "Balance Sheet items",
    "Accruals": "Balance Sheet items",
    # Other items
    "Zakat and Tax": "Other items",
    "Purchase Invoices": "Other items",
}

# Folders where the NAWRAS ERP API cannot auto-populate — these are manual documents
# (management judgement, legal, actuarial, signed agreements) and only support upload.
NO_NAWRAS_FOLDERS = {
    "General & Planning",
    "Financial assumptions",
    "Related Party",
    "Actuarial Valuation",
    "Bank Statements",
}

# items deliberately left "missing" so the dashboard's pending actions stay realistic
MISSING_ITEMS = {
    "Supporting documents for major capital additions during FY2025",
    "NRV testing: subsequent sales report to verify FG recorded at lower of cost or NRV",
    "All amendments, side letters, waivers or covenant modification letters applicable during 2025",
    "Breakup of the miscellaneous other income",
}


def _confirmation_records(conf_type: str, entries: list[tuple[str, float, str]]) -> list[dict]:
    records = []
    for name, balance, status in entries:
        confirmed = balance if status == "matched" else (balance - 15000 if status == "received" else None)
        records.append(dict(
            id=store.new_id(), type=conf_type, party_name=name, gl_balance=balance, status=status,
            confirmed_amount=confirmed,
            difference=(round(confirmed - balance, 2) if confirmed is not None else None),
            letter_text=(
                f"To Whom It May Concern,\n\nAs part of the annual audit of {ENTITY_NAME}, please confirm "
                f"directly to our auditors the balance due {'to' if conf_type == 'supplier' else 'from'} "
                f"{name} as at 31 December 2025, stated in our records as SAR {balance:,.2f}.\n\n"
                f"Kindly reply directly to the audit team.\n\nRegards,\n{ENTITY_NAME}"
            ),
            sent_date="2026-01-05" if status != "not_sent" else None,
            received_date="2026-01-15" if status in ("received", "matched") else None,
        ))
    return records


def _seed_documents_if_outdated() -> None:
    meta = store.load_obj("meta")
    if meta.get("documents_version") == DOCUMENTS_VERSION and store.exists("documents"):
        return
    internal_docs = []
    for category, entries in INTERNAL_DOCS.items():
        owner, owner_email = DOC_OWNERS[category]
        for name, folder, doc_status, level in entries:
            internal_docs.append(dict(
                id=store.new_id(), category=category, name=name, version=1,
                filename=f"{name.lower().replace(' ', '_')}.pdf", uploaded_at="2025-06-01", is_current=True,
                owner=owner, owner_email=owner_email, folder=folder, doc_status=doc_status, level=level,
            ))
    store.save("documents", internal_docs)
    meta["documents_version"] = DOCUMENTS_VERSION
    store.save_obj("meta", meta)


def _seed_annexure_if_outdated() -> None:
    meta = store.load_obj("meta")
    if meta.get("annexure_version") == ANNEXURE_VERSION and store.exists("annexure_items"):
        return
    missing_generic = {_genericise(m) for m in MISSING_ITEMS}
    annexure_items = []
    folder_order = 0
    for linked_box, folder, note, items in ANNEXURE:
        folder_order += 1
        for raw_name in items:
            item_name = _genericise(raw_name)
            if item_name in missing_generic:
                status = "missing"
            else:
                status = "reviewed" if len(annexure_items) % 3 == 0 else "uploaded"
            # cross-link: Box 4 "Signed loan agreements" reads from the Box 1
            # Contracts & agreements → Bank loan agreements folder (single source of truth)
            linked_docs_folder = (
                "Bank loan agreements"
                if linked_box == "box4" and folder == "Borrowings" and item_name == "Signed loan agreements"
                else None
            )
            annexure_items.append(dict(
                id=store.new_id(), linked_box=linked_box, folder=folder, folder_order=folder_order,
                folder_note=note,
                folder_group=(FOLDER_GROUPS.get(folder) if linked_box == "box4" else None),
                nawras_applicable=folder not in NO_NAWRAS_FOLDERS,
                linked_docs_folder=linked_docs_folder,
                item_name=item_name, status=status,
            ))
    store.save("annexure_items", annexure_items)
    meta["annexure_version"] = ANNEXURE_VERSION
    store.save_obj("meta", meta)


def seed_if_empty() -> None:
    _seed_annexure_if_outdated()
    _seed_documents_if_outdated()
    if not store.exists("key_management"):
        store.save("key_management", [dict(id=store.new_id(), **k) for k in KEY_MANAGEMENT])
    if not store.exists("tickets"):
        store.save("tickets", [dict(id=store.new_id(), **t) for t in TICKETS])
    if store.exists("gl_accounts"):
        return

    accounts = []
    for a in GL_ACCOUNTS:
        accounts.append(dict(id=store.new_id(), **a))
    store.save("gl_accounts", accounts)
    code_to_id = {a["code"]: a["id"] for a in accounts}

    journals = []
    for account in accounts:
        for i, (date, desc, source, approved, flags) in enumerate(JOURNAL_TEMPLATES):
            amount = round(abs(account["balance"]) / len(JOURNAL_TEMPLATES), 2)
            is_debit_side = account["category"] in ("Cash", "Receivables", "Inventory", "PPE", "Other", "COGS", "Payroll")
            journals.append(dict(
                id=store.new_id(), account_id=account["id"], date=date, description=desc,
                debit=amount if is_debit_side else 0,
                credit=0 if is_debit_side else amount,
                source=source, has_approval=approved, flags=flags,
            ))
    store.save("journals", journals)

    documents = []
    for j in journals[::2]:
        documents.append(dict(
            id=store.new_id(), journal_id=j["id"], doc_type="Supporting Document",
            filename=f"support_{j['id']}.pdf", uploaded_at="2026-01-10",
        ))
    store.save("source_documents", documents)

    confirmations = (
        _confirmation_records("customer", CUSTOMERS)
        + _confirmation_records("supplier", SUPPLIERS)
        + _confirmation_records("bank", BANKS)
        + _confirmation_records("related_party", RELATED_PARTY)
        + _confirmation_records("legal", LEGAL)
    )
    store.save("confirmations", confirmations)

    module_reports = []
    for m in MODULE_REPORTS:
        gl_account_id = code_to_id[m["gl_account_code"]]
        gl_balance = next(a["balance"] for a in accounts if a["id"] == gl_account_id)
        module_reports.append(dict(
            id=store.new_id(), module=m["module"], gl_account_id=gl_account_id,
            module_balance=m["module_balance"], gl_balance=gl_balance, threshold_amount=m["threshold_amount"],
        ))
    store.save("module_reports", module_reports)

    bank_recons = []
    for r in BANK_RECONCILIATIONS:
        adjusted_book = r["book_balance"] + sum(i["amount"] for i in r["items"])
        bank_recons.append(dict(
            id=store.new_id(), bank=r["bank"], account=r["account"],
            book_balance=r["book_balance"], bank_statement_balance=r["bank_statement_balance"],
            items=r["items"], adjusted_book_balance=adjusted_book,
            difference=round(adjusted_book - r["bank_statement_balance"], 2),
        ))
    store.save("bank_reconciliations", bank_recons)

    # Box 5 · assembled financial statements, derived from the seeded GL
    def bal(name: str) -> float:
        return next(a["balance"] for a in accounts if a["name"] == name)

    statement_lines = [
        dict(statement="BS", section="Assets", line_item="Cash and Bank",
             amount=bal("Cash and Bank"), gl_account_ids=[code_to_id["1000"]], contributing_module="Bank"),
        dict(statement="BS", section="Assets", line_item="Accounts Receivable",
             amount=bal("Accounts Receivable"), gl_account_ids=[code_to_id["1100"]], contributing_module="AR Aging"),
        dict(statement="BS", section="Assets", line_item="Inventory",
             amount=bal("Inventory - Raw Materials") + bal("Inventory - Finished Goods"),
             gl_account_ids=[code_to_id["1200"], code_to_id["1210"]], contributing_module="Inventory"),
        dict(statement="BS", section="Assets", line_item="Prepayments and Other Assets",
             amount=bal("Prepayments and Other Assets"), gl_account_ids=[code_to_id["1300"]]),
        dict(statement="BS", section="Assets", line_item="Property, Plant and Equipment",
             amount=bal("Property, Plant and Equipment") + bal("Right-of-Use Assets"),
             gl_account_ids=[code_to_id["1400"], code_to_id["1500"]]),
        dict(statement="BS", section="Liabilities", line_item="Accounts Payable",
             amount=bal("Accounts Payable"), gl_account_ids=[code_to_id["2000"]], contributing_module="AP Aging"),
        dict(statement="BS", section="Liabilities", line_item="Accrued Expenses and VAT Payable",
             amount=bal("Accrued Expenses") + bal("VAT Payable"),
             gl_account_ids=[code_to_id["2100"], code_to_id["2200"]], contributing_module="Tax"),
        dict(statement="BS", section="Liabilities", line_item="Employees End of Service Benefits",
             amount=bal("Employees End of Service Benefits"), gl_account_ids=[code_to_id["2300"]]),
        dict(statement="BS", section="Liabilities", line_item="Long-term Loan and Lease Liabilities",
             amount=bal("Long-term Loan") + bal("Lease Liabilities"),
             gl_account_ids=[code_to_id["2400"], code_to_id["2500"]]),
        dict(statement="BS", section="Equity", line_item="Share Capital",
             amount=bal("Share Capital"), gl_account_ids=[code_to_id["3000"]]),
        dict(statement="BS", section="Equity", line_item="Retained Earnings",
             amount=bal("Retained Earnings"), gl_account_ids=[code_to_id["3100"]]),
        dict(statement="IS", section="Income", line_item="Revenue",
             amount=bal("Revenue"), gl_account_ids=[code_to_id["4000"]]),
        dict(statement="IS", section="Expenses", line_item="Cost of Sales",
             amount=-bal("Cost of Sales"), gl_account_ids=[code_to_id["5000"]]),
        dict(statement="IS", section="Expenses", line_item="Payroll Expense",
             amount=-bal("Payroll Expense"), gl_account_ids=[code_to_id["6000"]], contributing_module="Payroll"),
        dict(statement="IS", section="Expenses", line_item="General and Administrative Expenses",
             amount=-bal("General and Administrative Expenses"), gl_account_ids=[code_to_id["6100"]]),
        dict(statement="IS", section="Expenses", line_item="Finance Costs",
             amount=-bal("Finance Costs"), gl_account_ids=[code_to_id["6200"]]),
        dict(statement="IS", section="Income", line_item="Other Income",
             amount=bal("Other Income"), gl_account_ids=[code_to_id["6300"]]),
    ]
    for line in statement_lines:
        line["id"] = store.new_id()
    store.save("statement_lines", statement_lines)
