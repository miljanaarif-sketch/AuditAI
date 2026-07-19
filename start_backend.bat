@echo off
cd /d "%~dp0backend"
if not exist .venv (
  py -3 -m venv .venv
)
echo Installing Python dependencies...
.venv\Scripts\pip install -q -r requirements.txt
echo.
echo Starting FastAPI backend on http://localhost:8000
.venv\Scripts\python -m uvicorn main:app --reload --port 8000
