@echo off
start "Audit Platform - Backend" cmd /k "%~dp0start_backend.bat"
start "Audit Platform - Frontend" cmd /k "%~dp0start_frontend.bat"
