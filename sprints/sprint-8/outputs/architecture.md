# Nexefii Core Architecture (v0.0)

This document explains the core architecture designed for Sprint 8 to support multiple verticals (PMS, CMS, BMS, EMS) under a unified Master Administration layer.

## High-level layers

- API Gateway
  - Single ingress endpoint: /api/{tenant}/{module}/{endpoint}
  - Handles routing, auth validation (JWT introspection / OAuth2 token verification) and basic rate-limiting.

- Core Layer
  - NexefiiAuth: central auth service (OAuth2 Authorization Server + JWT issuance). Supports tenant-scoped tokens and RBAC.
  - Tenant isolation: schema-per-tenant strategy to isolate data and simplify backups/restore.
  - Module registry: metadata-driven plugin catalog with licensing and lifecycle state.
  - Audit & telemetry: centralized logging, audit trail, and metrics ingestion.
  - Analytics core: aggregator service that composes KPIs across modules.

- Master Administration Portal
  - Web-based UI to manage tenants, assign modules, create demo tenants with synthetic data, and monitor usage.

- Tenant Environments
  - Each tenant can enable modules (PMS, CMS, etc.). Modules implement a common contract (metadata, OpenAPI fragment, UI bundle).
  - Optional Edge Gateway (container) for on-prem or hybrid scenarios.

## Data isolation and multi-tenancy

- Use separate database schemas per tenant (or separate databases per tenant depending on scale & cloud provider). This reduces cross-tenant leaks and eases compliance.
- Shared tables (module registry, licensing, global audit index) live in the Core management DB; tenant-specific data lives in tenant schemas.

## Module contract

- Each module must expose:
  - Metadata: id, name, version, category, required roles
  - OpenAPI fragment for its endpoints
  - UI bundle reference (HTML/JS/React component URL) for embedding inside master/tenant portals
  - Event hooks for analytics and inter-module events

## Demo environment

- Master portal can spawn demo tenants flagged `demo=true`.
- A Demo Property Service keeps generating synthetic data (configurable interval) and provides KPIs and dashboards.

## Deployment

- Container-first: Docker images for Core services, API Gateway, Master Portal, Demo Service, Analytics Core.
- Cloud-ready: support for Kubernetes orchestration (Helm charts later), managed DB instances, and optional edge containers.

---

For diagrams, see `architecture.svg`.
