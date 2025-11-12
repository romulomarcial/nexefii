# Sprint 8 Implementation Plan — Nexefii Core v0.0

This plan lists work packages, owners (suggested), acceptance criteria and estimated effort for Sprint 8 finalizing the core multi-domain foundation.

## Work packages

1. Core Services (Auth, API Gateway, Module Registry)
   - Owner: Backend
   - Acceptance: OAuth2 token issuance, gateway routing, module registration API
   - Effort: 5 dev days

2. Tenant Schema & DB bootstrapping
   - Owner: DB
   - Acceptance: create/teardown tenant schemas, sample tenant created via API
   - Effort: 3 dev days

3. Demo Property Service & Fake Data Engine
   - Owner: Backend / Demo
   - Acceptance: create demo tenant, worker generates KPIs every X minutes, dashboard shows updates
   - Effort: 2 dev days

4. Door Lock Wizard (PMS module)
   - Owner: PMS UI
   - Acceptance: JSON schema + simple wireframe implemented; API to provision lock
   - Effort: 2 dev days

5. Lock Service OpenAPI & security
   - Owner: Backend / Security
   - Acceptance: OpenAPI spec with OAuth2 and mTLS; basic mock server
   - Effort: 2 dev days

6. Analytics core (basic rollups)
   - Owner: Data
   - Acceptance: aggregator job that computes hourly aggregates
   - Effort: 3 dev days

7. Master Portal UX for demo creation & metrics
   - Owner: Frontend
   - Acceptance: Master portal can create demo tenants and view KPIs
   - Effort: 4 dev days

## KPIs / Business metrics (Sprint deliverables)

- Time-to-provision demo tenant (target < 30s)
- Average demo data generation interval (configurable) and stable KPI updates
- Module activation time (target < 60s)
- Audit log completeness (percentage of user actions captured: target 99%)

## Deliverables

- All artifacts in `/sprints/sprint-8/outputs/`
- Migration-safe changes to runtime code
- Unit tests for critical backend components (auth, tenant bootstrap)
