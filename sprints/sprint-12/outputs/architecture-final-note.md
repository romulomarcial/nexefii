Architecture Final Note - Post AI/Gateway

This note summarizes how the platform components interact after Sprint 12.

Components:
- Web (static SPA) - port 8080
- Demo PMS (demo-property-service) - 8082
- Lock-service mock - 8081
- BI service - 8086
- AI service - 8087
- Gateway (BFF) - 8088
- Housekeeping - 8083, Alerts - 8084, DND Adapter - 8085
- Postgres - 5432

Gateway role:
- Single integration point for external clients
- Centralizes CORS and lightweight API-key auth
- Proxies to internal services and aggregates responses for BFF use

AI role:
- Stateless aggregator and insights simulator
- Consumes BI and housekeeping endpoints to produce recommendations

Operational notes:
- All services include healthchecks for Docker Compose orchestration
- For production, move gateway behind API Gateway and add JWT/OAuth

