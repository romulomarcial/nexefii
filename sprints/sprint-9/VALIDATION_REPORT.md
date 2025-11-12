# Sprint 9 — Local Demo Validation Report

Generated: 2025-11-12T00:00:00Z

Summary: All required files created and basic validation checks passed.

Checks performed:

- docker-compose.yml parsed: PASS
  - Found services: postgres, lock-service-mock, demo-property-service, web
  - Port mappings present: 5432, 8081, 8082, 8080
  - Network: nexefii_net present

- Dockerfiles existence: PASS
  - `Dockerfile.lock-service-mock` : present
  - `Dockerfile.demo-property-service` : present
  - `Dockerfile.web` : present

- .env presence: PASS
  - `.env` created with POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB and service URLs

- Health page: PASS
  - `health/index.html` created (contains "Nexefii Demo Running ✅")

- README-demo.md & smoke_docker_demo.ps1 encoding: PASS
  - Files read successfully and contain expected instructions and health checks

Notes / Next steps

- To run the demo locally:
  1) docker compose up -d --build
  2) Wait for services to become healthy (healthchecks are configured)
  3) Run the smoke script from PowerShell: `./smoke_docker_demo.ps1`

- The demo uses `sprints/sprint-8/outputs/demo-property-service.py` and the `lock-service-openapi.yaml` as included artifacts. Ensure those files exist in the repo (they were present when this demo was created).

Result: ALL CHECKS: OK
