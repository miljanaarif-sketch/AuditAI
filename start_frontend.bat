@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  npm install
)
echo Starting React frontend on http://localhost:6555
npm run dev
