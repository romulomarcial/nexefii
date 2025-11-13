Sprint 11 - Commercial/BI + Exports

This folder contains the Sprint-11 deliverables for the BI/Commercial module (mocked service + static pages).

How to run (development):

1) Build and start the BI service via Docker Compose (recommended, uses port 8086):

   cd r:\Development\Projects\nexefii
   docker compose up -d --build bi web postgres

2) Alternatively run the Flask service directly (Python 3.11 required):

   cd r:\Development\Projects\nexefii\sprints\sprint-11\outputs\services
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install flask openpyxl
   python bi_service.py

URLs:
 - BI health: http://localhost:8086/bi/health
 - BI KPIs:   http://localhost:8086/bi/kpis
 - BI reports: http://localhost:8086/bi/reports
 - Export endpoint: POST http://localhost:8086/bi/export  (JSON body: {reportId, format, params})
 - Static pages (served by web server or open locally): sprints/sprint-11/outputs/web/bi-dashboard.html

Notes:
 - CORS: service sets Access-Control-Allow-Origin only if Origin header contains 'localhost'.
 - Exports: CSV/JSON/XLSX generated in-memory; XLSX uses openpyxl.
