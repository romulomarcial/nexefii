# CHANGELOG - Sprint 11 (Commercial/BI + Exports)

## 2025-11-12
- Added BI static pages: `bi-dashboard.html`, `bi-reports.html`, `exports.html`.
- Added `style-bi.css` for lightweight responsive UI.
- Added page translations under `web/translations` (PT/EN bundles).
- Implemented Flask mock BI microservice (`bi_service.py`) with endpoints: `/bi/health`, `/bi/kpis`, `/bi/reports`, `/bi/export` (CSV/JSON/XLSX).
- Added `Dockerfile.bi` for containerizing the BI service.
- Added SQL migration `V005__bi_seed.sql` to seed `bi_report_catalog`.
- Added QA smoke script `bi_smoke.ps1` and placeholder `QA_REPORT.md`.
- Added documentation files: `README.md`, `architecture-note.md`.
