from fastapi import APIRouter
from pydantic import BaseModel

from services import store

router = APIRouter(prefix="/setup", tags=["Audit Setup (Cover Page)"])

DEFAULT_SETUP = {
    "company": {
        "company_name": "Obeikan Plastic",
        "registration_no": "CR-1010456789",
        "vat_no": "300123456700003",
        "financial_year_end": "31 December 2025",
        "functional_currency": "SAR",
        "engagement_date": "15 November 2025",
        "audit_timeline": "Interim: Nov 2025 · Year-end fieldwork: Jan-Feb 2026 · Sign-off: Mar 2026",
    },
    "audit_team": {
        "audit_firm": "BDO Dr. Al Amri & Co.",
        "audit_firm_email": "audit.team@bdo.example.sa",
        "engagement_partner": "Khalid Al-Amri",
        "engagement_partner_email": "khalid.alamri@bdo.example.sa",
        "audit_manager": "Sara Al-Harbi",
        "audit_manager_email": "sara.alharbi@bdo.example.sa",
        "audit_senior_1": "Omar Siddiqui",
        "audit_senior_1_email": "omar.siddiqui@bdo.example.sa",
        "audit_senior_2": "Lina Kanaan",
        "audit_senior_2_email": "lina.kanaan@bdo.example.sa",
    },
    "contacts": {
        "ceo": "Abdullah Al-Rashid",
        "ceo_email": "a.alrashid@obeikanplastic.example.sa",
        "cfo": "Faisal Al-Mutairi",
        "cfo_email": "f.almutairi@obeikanplastic.example.sa",
        "financial_controller": "Nadia Hassan",
        "financial_controller_email": "n.hassan@obeikanplastic.example.sa",
        "treasury_manager": "Yousef Al-Qahtani",
        "treasury_manager_email": "y.alqahtani@obeikanplastic.example.sa",
        "hr_manager": "Maha Al-Otaibi",
        "hr_manager_email": "m.alotaibi@obeikanplastic.example.sa",
        "it_manager": "Tariq Mahmoud",
        "it_manager_email": "t.mahmoud@obeikanplastic.example.sa",
        "legal_contact": "Reem Al-Saleh",
        "legal_contact_email": "r.alsaleh@obeikanplastic.example.sa",
    },
    "banking": [
        {
            "bank_name": "Riyadh Bank",
            "account_name": "Obeikan Plastic - Main Operating",
            "relationship_manager": "Hassan Al-Zahrani",
            "email": "hassan.z@riyadbank.example.sa",
            "phone": "+966 11 401 3030",
        },
        {
            "bank_name": "Arab National Bank (ANB)",
            "account_name": "Obeikan Plastic - Payroll",
            "relationship_manager": "Noura Al-Shehri",
            "email": "noura.s@anb.example.sa",
            "phone": "+966 11 402 9000",
        },
    ],
    "legal": {
        "law_firm": "Al Rashid Law Firm",
        "contact_person": "Majed Al-Rashid",
        "email": "majed@alrashidlaw.example.sa",
        "phone": "+966 11 462 8890",
    },
}


class SetupPayload(BaseModel):
    company: dict
    audit_team: dict
    contacts: dict
    banking: list[dict]
    legal: dict


@router.get("")
def get_setup():
    setup = store.load_obj("setup")
    if not setup:
        store.save_obj("setup", DEFAULT_SETUP)
        return DEFAULT_SETUP
    # migrate pre-multi-bank data where banking was a single object
    changed = False
    if isinstance(setup.get("banking"), dict):
        setup["banking"] = [setup["banking"]]
        changed = True
    # backfill fields added after the setup was first saved (e.g. emails, engagement dates)
    for section, defaults in DEFAULT_SETUP.items():
        if isinstance(defaults, dict):
            existing = setup.setdefault(section, {})
            for key, value in defaults.items():
                if key not in existing:
                    existing[key] = value
                    changed = True
    if changed:
        store.save_obj("setup", setup)
    return setup


@router.put("")
def save_setup(payload: SetupPayload):
    store.save_obj("setup", payload.model_dump())
    return payload
