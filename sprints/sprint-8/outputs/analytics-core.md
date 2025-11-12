# Nexefii Analytics Core (v0.0)

The Analytics Core aggregates KPIs and usage metrics from all modules and tenants. It provides a set of aggregation endpoints and a lightweight event ingestion API.

## Responsibilities

- Ingest metrics (usage_metrics table or event streams)
- Aggregate and store time-series KPIs per tenant and per module
- Provide endpoints for dashboard queries and cross-tenant analytics (for Master Portal)

## Ingestion model

- HTTP ingest endpoint (POST /ingest) for simple metrics
- Optional connector to message brokers (Kafka/Redis Streams)

## Data model

- Store raw metrics in `usage_metrics` (shared DB) and roll up hourly/daily aggregates into `analytics_rollups` table.

## Simple API

- GET /api/{tenant}/analytics/kpis?from=...&to=...&metric=...

## Notes

- For v0.0 we prefer a pull-based aggregator from `usage_metrics` to limit infrastructure complexity. Later we can move to a streaming-first architecture.
