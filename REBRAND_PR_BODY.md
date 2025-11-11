Title: chore(rebrand): Nexefii rebranding snapshot (safe)

Description:
This PR contains a controlled rebranding snapshot where nexefii/nexefii has been migrated to NEXEFII/nexefii in a subset of files. The changes are intended to be safe and backward-compatible where needed.

What changed (high-level):
- Updated branding strings and assets in several UI and documentation files.
- Added compatibility reads so existing localStorage keys (nexefii_*) are still honored where applicable.
- Created backup files for every modified file with suffix `.bak.assistant`.
- Executed a headless smoke test: see `qa/headless-report.json` attached in the repo (green â€” no runtime errors for index/login/shell in the snapshot).

Files of note (examples):
- `index.html` (+ `index.html.bak.assistant`)
- `master-control.html` (+ backup)
- `clear-cache.html` (+ backup)
- `test-properties.html` (+ backup)
- `README_PWA.md` (+ backup)
- `auth.js`, `app.js`, `pms-*` scripts and various control pages (backups present)

Checklist for reviewers:
- [ ] Verify the changed UI strings are appropriate and do not break translations
- [ ] Confirm that localStorage compatibility is sufficient (reads `nexefii_*` and writes `nexefii_*` where appropriate)
- [ ] Validate absolute paths in scripts (`start-server.ps1`, QA scripts) and adjust to relative/variable if desired
- [ ] Run the headless smoke test locally (`node qa/headless-check.js`) and attach the resulting `qa/headless-report.json` to the PR
- [ ] Confirm assets/logo updates are correct and optimized for web

Instructions to run locally (PowerShell):
```powershell
cd R:\Development\Projects\nexefii
# start static server
node simple-server.js
# in another terminal
node qa/headless-check.js
# then inspect qa/headless-report.json
Get-Content qa\headless-report.json -Raw | ConvertFrom-Json | Format-List
```

Notes:
- Every modified file has a `.bak.assistant` backup at the repo root (search for `*.bak.assistant`).
- This PR intentionally avoids mass replacements that could be risky (it updated a curated list of files). If you want a full repository rename (all occurrences), we should run a targeted audit + AST-based replacements.

If you'd like, I can also:
- Generate a summarized diff of all changed files for inclusion in the PR description
- Run a leftover-scan for any remaining `nexefii` references and attach the report

â€” Ready for review. If you want me to expand the scope, say so and I'll prepare the next patch.
