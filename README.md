# NAWRAS — End-to-End Audit Automation Platform (Prototype)

End-to-end prototype of the Five-Box Model audit platform described in the
*End to End Audit Automation BRD* (June 2026). Seeded with a fictitious entity,
**Obeikan Plastic** (FY2025), so every screen works out of the box.

## Quick start

Double-click `start_all.bat` (or run `start_backend.bat` and `start_frontend.bat`
in two terminals), then open **http://localhost:5174** — the NAWRAS launch page; click **Enter Platform** for the dashboard.

- Backend: FastAPI on http://localhost:8000 (interactive API docs at `/docs`)
- Frontend: React + Vite on http://localhost:5174

## The Five Boxes

| Box | Screen | What it does |
|-----|--------|--------------|
| 1 · Internal Docs | `/box1` | Central repository of non-system documents (legal pack, policies, contracts, governance). Uploading a document with the same name creates a new version; only the latest is current. |
| 2 · External Confirmations | `/box2` | Circularisation list (customer / supplier / bank / legal-RP), auto-generated request letters, status tracking (sent → received → matched / difference) against GL balances. |
| 3 · General Ledger | `/box3` | Drillable trial balance: balance → account → journal → source document. Each account carries a document-definition range and a missing-evidence flag. JE-testing panel: manual vs system split and flagged entries (weekend posting, no approval, period-end). |
| 4 · Integrated Reports & Recons | `/box4` | Integrated reports from the operational modules (Production, Payroll & HR, Procurement, Sales, Treasury, Tax) reconciled to GL with a >SAR 10,000 variance threshold. |
| 5 · Financial Reporting | `/box5` | Assembled BS / IS with notes. Click any line to trace it down: FS line → GL account → module report → confirmation. |

## Required Reports (PBC) (`/annexure`)

The full 22-category required-reports list (114 items) with per-item status
(missing / uploaded / reviewed). Every item is assigned to its box —
documents → Box 1, third-party evidence → Box 2, GL & source documents → Box 3,
operational reports → Box 4, FS workings → Box 5 — and each box page shows its
own assigned items in a "Required Reports & Evidence" section.

## Master Data Configuration (`/master-data`)

Engagement cover-page data (company, audit team, key contacts, banks, legal
advisors) as collapsible sections. Covers only what is not already available in
the NAWRAS ERP. Supports multiple banks.

## Resetting the sample data

Delete the JSON files in `backend/data/` and restart the backend — it reseeds
automatically on startup.

## Stack

- Backend: FastAPI + Pydantic, JSON-file persistence (`backend/data/`), no database needed
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, react-router, axios
