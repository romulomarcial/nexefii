@echo off
REM Change to the script directory and run server (works when moved)
cd /d %~dp0
echo Starting NEXEFII Dev Server from %CD%...
node simple-server.js
pause
