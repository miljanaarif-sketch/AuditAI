# Audit Automation Platform — Project To-Do List
NAWRAS Five-Box Audit · Master Data + Box 1–5 + Auditor Communication

_Format: Comments/Next before Status; Status column left blank to fill in._

---

## TASK 1 — Master Data Configuration
*Engagement reference data (cover page), collected once during implementation*

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 1.1 | Company Information | Ability to configure business/entity data (name, reg. no, VAT no, FYE, currency, engagement date, timeline) | Link headers into cover pages, FS, confirmation letters, audit report | |
| 1.2 | Audit Team | Configure audit firm & engagement team (partner, manager, seniors + emails) | Feed sign-off blocks, engagement letter, comms sender | |
| 1.3 | Key Internal Contacts | Configure client management contacts (CEO, CFO, FC, Treasury, HR, IT, Legal + emails) | Route confirmations & queries to right contact | |
| 1.4 | Banking Information | Add/remove multiple bank relationships (bank, account, RM, email, phone) | Feed Box 2 bank confirmations & Box 4 bank recon | |
| 1.5 | Legal Advisors | Configure legal counsel (firm, contact, email, phone) | Feed Box 2 legal/litigation confirmation | |

---

## TASK 2 — Box 1 · Internal Documentation

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 2.1 | Legal pack | Maintain statutory documents: CR, Articles of Association, SAGIA, VAT Registration, GOSI, Zakat Registration | Expiry tracking feeds dashboard pending actions | |
| 2.2 | Group policies | Maintain group manuals: Accounting, HR, Supply Chain, IT, Authority Matrix | Marked OIG (blue) = parent/group-provided, auto-OK | |
| 2.3 | Contracts & agreements | Sub-folders: Customer, Supplier, Lease, Rent, Service, Bank loan agreements | Bank loan agreements cross-links to Box 4 Borrowings | |
| 2.4 | Structure & governance | Org Chart, Board Resolution appointing auditor, Shareholders Resolution, UBO Declaration | | |
| 2.5 | General & Planning (requirements) | Going concern, PPE impairment, contingencies & commitments, subsequent events, approved budget, fraud responses, capital approvals | Manual documents (no NAWRAS API) | |
| 2.6 | Financial assumptions (requirements) | Basis of discount rate used in IFRS 16 | Manual document | |
| 2.7 | Related Party (requirements) | List of key management personnel — designation, role, compensation | Ties to Master Data contacts and Box 4 related party | |
| 2.8 | Document handling | Two tabs per folder (Summary + Database); add entries one-by-one; 4-light status (uploaded / pending / expired / OIG) | Latest version only | |
| 2.9 | Responsible person + reminders (all docs) | Each document has a responsible person in the group — configure their email and send reminder emails to upload / renew pending or expiring documents | Make owner email editable; add Send reminder + auto-schedule | |
| 2.10 | OCR validity & expiry check (all docs) | On upload, OCR the document to confirm validity and read its expiry date, then auto-flag if expired | Auto-drives the expired light; triggers 2.9 reminder | |
| 2.11 | Document workflow (per document) | Stepper: Request → Assign to responsible person → Reminder → Upload → OCR check → Audit review / approve → Expiry monitor (auto re-request) | Mirrors Box 2 workflow; ties together 2.9 + 2.10 + status lights | |

---

## TASK 3 — Box 2 · External Confirmations
*Each confirmation runs Generate → Approve → Send; replies and mail history are logged (mirrored to Auditor Communications → Sent Log)*

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 3.1 | Customer Confirmations | Circularise receivable balances directly to auditors (per-party list) | Pull live balances from AR ledger; recipients from Master Data contacts | |
| 3.2 | Supplier Confirmations | Circularise payable balances directly to auditors | Pull live balances from AP ledger | |
| 3.3 | Bank Confirmations | Confirm bank balances directly with each bank | Pull bank list from Master Data (Banking Information) | |
| 3.4 | Related Party Confirmations | Confirm related-party balances (due to / due from) | Tie to Box 4 related-party list; stamped & signed by authorised signatory | |
| 3.5 | Legal Confirmations | Litigation confirmation — upload the lawyer's response letter (plain document, no workflow) | Pull law firm from Master Data (Legal Advisors) | |
| 3.6 | Circularisation sampling | Select all / Top 50 / 40 / 20 / 10 by balance, plus per-row checkbox; run workflow on selected only | Sampling basis (by balance) to be logged for the file | |
| 3.7 | Confirmation workflow | Generate → Approve → Send stepper per confirmation | "Send" currently simulated — wire to real email / SMTP | |
| 3.8 | Reply logging | Record reply status (received / matched / difference) and view received letter | Auto-flag differences (Δ) for follow-up | |
| 3.9 | Mail history + Sent Log | Per-confirmation mail history, mirrored to central Auditor Communications → Sent Log | Single source of truth for all sent correspondence | |

---

## TASK 4 — Box 3 · General Ledger
*Trial balance → account → journal → source document*

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 4.1 | GL Dump engine | Load the full general-ledger dump — every account balance for the year, tying to the trial balance — then drill account → journal → source document | To be developed; feeds from NAWRAS ERP API | |
| 4.2 | JE Dump engine | Load the complete journal-entry population — manual vs system, approvals, segregation of duties, cut-off and period controls — for journal-entry testing | To be developed; feeds from NAWRAS ERP API | |
| 4.3 | Revenue drill-down | From any revenue figure drill to source set: sales order → GDN / delivery note → customer-acknowledged delivery challan → commercial invoice | Instructions shown; needs API to make live | |
| 4.4 | Income-statement drill-down | Every income-statement line traces to its supporting schedules, the GL and source documents (incl. G&A expense schedules, professional-service agreements, supporting invoices) | Needs API | |
| 4.5 | Balance-sheet drill-down | Every balance-sheet line traces to its account, the movement schedule and supporting evidence — source documents and third-party confirmations | Needs API; links to Box 2 confirmations | |
| 4.6 | GL / JE testing workflow | Stepper: Load dump → tie to trial balance → auto-flag risk (manual / weekend posting / no approval / period-end) → sample → drill to source → test → conclude | Mirrors Box 1 & Box 2 workflow; risk flags already modelled in data | |

---

## TASK 5 — Box 4 · Integrated Reports & Reconciliations

### Reconciliation framework

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 5.1 | Bank Reconciliation panel | Book balance vs bank-statement balance with reconciling items (deposits in transit, outstanding cheques, unrecorded charges); drill into each recon | Built; wire to live bank feed | |
| 5.2 | Reconciliation engine | Automated tie-out of each module report to its GL balance, with threshold/variance flags | To be developed; extends bank recon across all modules | |
| 5.3 | Reconciliation workflow | Stepper: Pull module report → tie to GL → flag variance vs threshold → investigate → clear / raise query → conclude | Mirrors other boxes' workflow; raises tickets in Auditor Comms | |

### Balance Sheet items (folders)

| # | Folder | To-Do — collect, load & reconcile to GL | Comments / Next | Status |
|---|---|---|---|---|
| 5.4 | Bank Statements | Bank statements for all banks (full year + subsequent to year end) | Manual upload (no API) | |
| 5.5 | Bank Balances & Reconciliation | Listing of all bank balances; December bank reconciliation for all accounts; direct bank confirmation | Links to 5.1 and Box 2 bank confirmations | |
| 5.6 | Fixed Assets | FA register (opening, additions, disposals, depreciation); capex supports; disposal docs; depreciation methodology & useful lives; land & building ownership | Major capital additions support currently flagged missing | |
| 5.7 | Assets Under Construction | AUC register / project-wise schedule; progress reports / % completion; cost breakdown per project with expected transfer dates to PPE | | |
| 5.8 | Right-of-Use Assets | Lease additions/disposals with ROU & lease-liability calc; signed copies of all ROU contracts outstanding at year end | Links to Box 1 lease agreements | |
| 5.9 | Investments & Property | Investment valuation report; property valuation report; title-deed copies | | |
| 5.10 | Related Party | List of related parties & relationships; balances due to/from; signed & stamped confirmation; transfer-pricing details | Manual; ties to Box 2 RP confirmations & Master Data | |
| 5.11 | Accounts Receivables | Trade receivables + aging; subsequent receipts; outstanding invoices listing; advances from customers | Ties to Box 2 customer confirmations | |
| 5.12 | ECL | ECL calculation on receivables with model, basis & assumptions | | |
| 5.13 | Inventory — Raw Materials | Listing; movement (opening/purchases/issues/closing); valuation working; aging & provision | | |
| 5.14 | Inventory — Work in Progress | Listing; movement; valuation (material/labour/overhead); production reports / stage of completion; aging & provision; cut-off testing | | |
| 5.15 | Inventory — Finished Goods | Listing; movement; valuation (cost build-up, weighted average); dispatch notes near year end; aging & provision; NRV testing | NRV testing currently flagged missing | |
| 5.16 | Inventory — Spare Parts | Listing; movement; valuation (weighted average); aging & provision | | |
| 5.17 | Prepayment | Breakup of advances, prepayments & other assets; employee-wise advances; agreements & invoices with payment support | | |
| 5.18 | ESOB (End of Service) | EOSB calculation per Saudi labour law (opening→closing movement); payments to leavers with settlement files | | |
| 5.19 | Actuarial Valuation | Actuarial valuation report; engagement letter | Manual upload (no API) | |
| 5.20 | Borrowings | Signed loan agreements; amendments/waivers; repayment schedule; bank statements/advices + direct confirmation; interest computation; upfront-fee amortisation; interest-payment support; L/C charges | Signed loan agreements cross-link from Box 1; amendments flagged missing | |
| 5.21 | Accounts Payable | Trade-payables schedule; subsequent invoices/payments; third-party confirmations; advances to suppliers | Ties to Box 2 supplier confirmations | |
| 5.22 | Accruals | Accruals & other-liabilities schedule with basis & support; subsequent invoices/payments | | |

### Income Statement items (folders)

| # | Folder | To-Do — collect, load & reconcile to GL | Comments / Next | Status |
|---|---|---|---|---|
| 5.23 | Revenue | Party-wise revenue vouchers & invoices (by product/customer/region); price lists, approval matrix & master data; sales returns & credit notes | Ties to Box 3 revenue drill-down | |
| 5.24 | Purchase | All purchase orders for the year; material-cost breakup; production-cost breakdown | | |
| 5.25 | Employee Cost | Payroll summary Jan–Dec (names excluded); joiners & leavers listing; employee loans | | |
| 5.26 | Other Income | Scrap-sale details with approval; miscellaneous other-income breakup | Misc other-income breakup flagged missing | |

### Other items (folders)

| # | Folder | To-Do — collect, load & reconcile to GL | Comments / Next | Status |
|---|---|---|---|---|
| 5.27 | Zakat and Tax | Zakat & income-tax workings/payments and year-end payable; quarterly returns; VAT/WHT/deferred-tax calcs & returns; open-assessment status & correspondence; VAT-receivable calc (Q4) | | |
| 5.28 | Purchase Invoices | GRNs & purchase invoices for raw materials and spare parts (PO, delivery challan, vendor invoice, GRN) | | |

---

## TASK 6 — Box 5 · Financial Reporting
*Assembled statements and notes — every line traces back through reports, GL, confirmations, documents*

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 6.1 | Assembled financial statements | FS + notes populate automatically once the GL is connected to the NAWRAS ERP | To be developed; depends on Box 3 GL feed | |
| 6.2 | One-click IFRS report | Generate print-ready IFRS statements — Statement of Financial Position, Statement of Profit or Loss & OCI — with cover page (company, year, SOCPA/IFRS basis) | Built; currently from seeded GL → drive from live GL | |
| 6.3 | Notes to the financial statements | Generate and maintain the notes to the FS, printed with the statements | Wire to live GL / disclosures | |
| 6.4 | Full traceability (drill-down) | Every FS line traces back through the integrated reports, the GL, confirmations and source documents | Links Box 5 → Box 4 → Box 3 → Box 2 → Box 1 | |
| 6.5 | Reporting workflow | Assemble from GL → reconcile to Box 4 reports → generate IFRS statements + notes → audit review → partner sign-off → issue | Sign-off names from Master Data (Audit Team) | |

---

## TASK 7 — Auditor Communication
*The single channel to raise issues, chase evidence, and track every outstanding item to closure — with days outstanding, ownership and escalation*

### Raise, classify, route & notify

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 7.1 | Raise an issue / query | Auditor can raise a query or request from anywhere — a box item, a confirmation difference, a missing document, a reconciliation variance — which opens a tracked ticket | Auto-create from source or manual | |
| 7.2 | Classify the ticket | Set type (Query / Document Request / Confirmation / Reconciliation / Integration), severity (High / Normal / Low) and the related box / account / item | Severity drives escalation timing | |
| 7.3 | Link to source | Every ticket links back to the exact item it concerns (document, confirmation, GL line, module report) | Two-way link so the box item shows "query open" | |
| 7.4 | Assign owner | Assign each ticket to a responsible party — client contact or audit-team member | Pull people/emails from Master Data | |
| 7.5 | Notify by email | On raise/assign, email the responsible person; replies flow back into the ticket thread | Real email/SMTP; client can respond without logging in | |
| 7.6 | Reminders & follow-ups | Auto-reminders for items still outstanding, at set intervals, plus manual "Chase now" | Ties to days-outstanding | |

### Pending items & days outstanding

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 7.7 | Pending items list | Single list of all outstanding items across every box — subject, owner, type, severity, status | The auditor's "what's still open" view | |
| 7.8 | Days outstanding | Show days open per item, with aging buckets (0–3 / 4–7 / 8–14 / 15+ days) | Colour-coded; sortable by oldest | |
| 7.9 | SLA & escalation | Define response targets by severity; overdue items auto-escalate (High > 3 days → manager, > 7 → partner) | Escalation notification + flag on dashboard | |
| 7.10 | Ownership & aging by party | Group outstanding items by owner (client dept / team member) with counts and oldest item | Shows who is holding up the audit | |

### Communicate & resolve

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 7.11 | Message thread | Full message chain per ticket (auditor ↔ client ↔ system), with sender and timestamp | Built | |
| 7.12 | Attachments / evidence | Attach or receive documents directly on the ticket; accepted evidence updates the linked box item | Closes the loop with Box 1–4 | |
| 7.13 | Status lifecycle | Open → Pending → Answered → Closed, with reason on close | Built (Open/Pending/Closed) — extend with "Answered" | |
| 7.14 | Bulk actions | Send all pending requests at once; chase all overdue; close resolved in bulk | Efficiency for large request lists | |

### Oversight, assistant & workflow

| # | Item | To-Do — capability | Comments / Next | Status |
|---|---|---|---|---|
| 7.15 | Communication dashboard | Counts by status/severity, oldest outstanding, escalations, response-time trend | One-glance health of the engagement | |
| 7.16 | Full audit trail / log | Immutable log of every request, reminder, reply and status change | Central Sent Log already receives Box 2 mail | |
| 7.17 | Export for the file | Export the outstanding-items list and communication log (PDF / Excel) for the audit file | Working-paper evidence | |
| 7.18 | Assistant Q&A | Ask the assistant about the live audit file — progress, outstanding confirmations, missing items, oldest queries | Built (rule-based) → upgrade to Claude API | |
| 7.19 | Assistant actions | Assistant can draft a request/reminder, summarise a thread, or list "what's overdue today" | Drafts require auditor approval before send | |
| 7.20 | Communication workflow | Stepper: Raise → classify & link → assign → notify → track days outstanding → remind / escalate → receive response & evidence → verify → close | Ties Boxes 1–5 into one issue-to-closure loop | |
