# Sprint 13 — Outputs

Overview
- Restructured navigation and pages for Master Control, PMS, Engineering and Housekeeping.
- Originals moved to `sprints/sprint-13/old-files/` for archival.

Files
- `web/` — restructured HTML pages and supporting JS/translation bundles
  - `master-control.html`, `pms-frontdesk.html`, `pms-rooms.html`, `pms-reservations.html`, `pms-reservations-diagnostics.html`, `engineering-control.html`, `engineering-list.html`, `housekeeping-control.html`, `register.html`, `register_backup.html`
  - `js/i18n-loader.js` — lightweight loader to fetch `translations/<page>.<lang>.json` and apply keys
  - `js/thermostat-adapter.js` — mock thermostat adapter (init, listZones, getZone, setSetpoint)
  - `translations/` — per-page `{page}.{lang}.json` translation files (pt/en/es)

- `config/thermostat-config.json` — central thermostat config (mock). Update to point to real BMS/PMS adapters when available.

Navigation map (how pages link)
- `master-control.html` → contains nav links to `pms-frontdesk.html`, `engineering-list.html`, `housekeeping-control.html` and BI (placeholder)
- `pms-*` pages link to each other via `pmsModuleSwitcher` and the shared navbar
- `engineering-*` and `housekeeping-*` pages include an easy return link back to `master-control.html`

Thermostat configuration
- `config/thermostat-config.json` contains a `provider` field and `zones` listing. The mock adapter reads this file.
- `web/js/thermostat-adapter.js` exposes `window.thermostatAdapter.init()`, `listZones()`, `getZone(id)`, `setSetpoint(id,value)`.
- Comments in `thermostat-adapter.js` show where to plug real BMS/PMS HTTP adapters or websockets.

How to test locally
- Serve the files from `sprints/sprint-13/outputs/web/` (e.g., copy files to your web server root). Example using Python simple server from that folder:

```powershell
cd sprints/sprint-13/outputs/web
python -m http.server 8085
```

- Open `http://localhost:8085/pms-frontdesk.html` and `http://localhost:8085/master-control.html` to verify navigation and translations.
