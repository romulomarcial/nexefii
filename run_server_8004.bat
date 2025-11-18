@echo off
REM Run the static dev server on port 8004
cd /d "%~dp0"
python -m http.server 8004
