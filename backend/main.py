from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.seed_data import seed_if_empty
from routers import box1_internal, box2_external, box3_ledger, box4_modules, box5_reporting, annexure, dashboard, setup, comms

seed_if_empty()

app = FastAPI(title="Audit Automation Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(setup.router)
app.include_router(box1_internal.router)
app.include_router(box2_external.router)
app.include_router(box3_ledger.router)
app.include_router(box4_modules.router)
app.include_router(box5_reporting.router)
app.include_router(annexure.router)
app.include_router(comms.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "Audit Automation Platform"}
