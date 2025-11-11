# Development Filesystem Backup Tool

This adds a lightweight Node-based backup system to create versioned ZIP archives of both `iluxsys/` and `IluxPrime_website/` folders.

## Features
- Zip archive with timestamp and optional label (e.g. marco tag)
- Automatic trigger after each version (marco) via `master-control.js` calling local backup server if running
- Manual CLI usage (`npm run backup`) with optional label
- Lightweight HTTP server (`npm run dev-backup-server`) exposes POST `/dev-backup` endpoint

## Setup
1. Open PowerShell in `iluxsys/`
2. Install dependencies:
   npm install
3. (Optional) Start server for automatic backups:
   npm run dev-backup-server

## Manual Backup
Run:
   npm run backup
Add a label:
   npm run backup -- label=marco-1

Output files appear in `iluxsys/backups/` as:
`dev-backup_YYYY-MM-DD_HH-mm-ss[_label].zip`

## Automatic on Version Creation
When a Master user creates a version (marco) in the UI, `createVersion()` attempts a POST to:
`http://localhost:4455/dev-backup?label=vX`
If the server responds OK, an activity log entry is recorded. Failure is silent.

## HTTP API
Start server:
   npm run dev-backup-server
Endpoints:
- GET /health → check server status
- POST /dev-backup?label=mytag → perform backup; returns script output

## Exclusions
Ignored paths: node_modules, .git, backups, *.zip, *.tmp

## Troubleshooting
- If auto backup not triggered: ensure server running on port 4455
- Permission errors: run PowerShell as Administrator if needed
- Large ZIP timeouts: increase timeout inside `triggerDevFilesystemBackup()` (currently 2500ms)

## Next Enhancements
- Add encryption (AES) before zipping
- Cloud upload (S3/Azure/GCS) after archive creation
- Incremental diff-based backups for code

## Security Note
This tool is development-only. Do not expose the dev server publicly. For production, integrate authentication and cloud storage.
