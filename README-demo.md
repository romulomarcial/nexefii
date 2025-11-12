# Nexefii Sprint 9 — Local Demo (Docker Compose)

This demo composes a small local environment for development and smoke testing:

- PostgreSQL (5432)
- Lock Service Mock (8081)
- Demo Property Service (8082)
- Web static server serving `sprints/sprint-8/outputs` (8080)

Prerequisites
- Docker and Docker Compose (Compose v2 recommended)
- PowerShell for the smoke script (Windows) or equivalent shell

Build and run

1. Build and start in background

   docker compose up -d --build

2. Wait for containers to become healthy (healthchecks configured)

3. Open the demo web UI

   http://localhost:8080/

Service endpoints

- Web UI: http://localhost:8080/
- Web health: http://localhost:8080/health
- Lock service mock: http://localhost:8081/
- Lock service health: http://localhost:8081/health
- Demo property service: http://localhost:8082/
- Demo property health: http://localhost:8082/health

Stop and remove

   docker compose down -v

Notes
- Postgres data is stored in a named Docker volume `postgres_data`.
- Environment variables are loaded from `.env` in the project root.
