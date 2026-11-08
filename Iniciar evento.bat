@echo off
REM Doble clic para arrancar el servidor del evento (sin internet)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-evento.ps1"
pause
