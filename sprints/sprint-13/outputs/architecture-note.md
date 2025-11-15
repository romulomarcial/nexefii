# Architecture Note — Sprint 13

Purpose
- Provide a lightweight restructured UI surface that centralizes navigation between Master Control, PMS, Engineering, Housekeeping and BI.

High-level flow
- Master-control acts as an operations console with tabs to each subsystem.
- PMS pages (reservations, rooms, front-desk) are modular and interlinked via a shared navbar and the `pmsModuleSwitcher` selector.
- Engineering and Housekeeping pages surface room HVAC/thermostat controls and cleaning/service workflows.

Thermostat integration
- A central `thermostat-config.json` describes zones and provider.
- `thermostat-adapter.js` provides a mock layer. To integrate a real BMS or PMS thermostat API, replace the adapter's `init()` implementation with calls to the real endpoints and adapt the `getZone` / `setSetpoint` wiring.

Internationalization
- Each restructured page maps to `translations/<page>.<lang>.json` and uses `js/i18n-loader.js` to fetch and apply keys.

Notes & next steps
- Replace mock adapter with a backend service when available (BMS gateway or PMS thermostat interface).
- Add full translation coverage and align keys with existing sprints 10–12 translation patterns if needed.
