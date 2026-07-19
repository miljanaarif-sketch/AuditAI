@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  npm install
)
echo Starting React frontend on http://localhost:5174
npm run dev
