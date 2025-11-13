Sprint 11 - Architecture Note: BI/Commercial (mocked)

Overview
- This sprint provides a mocked BI microservice and static pages for dashboard, reports, and exports.
- The BI service exposes simple endpoints consumed by the web UI. In Sprint 12 the BI service will connect to PMS/EMS via internal APIs and secure with JWT/API-GW.

How BI would consume PMS/EMS (future)
- BI will query PMS endpoints for bookings/transactions and EMS endpoints for energy telemetry.
- In production, BI will fetch aggregated data from internal APIs (service-to-service calls) with mutual TLS or JWT via API Gateway.
- Data pipeline options: incremental ETL using Kafka/consumer, or near-real-time aggregations via push from EMS.

Current (mock) behavior
- `GET /bi/kpis` returns mocked KPI metrics (occupancy_pct, revpar, kwh, open_tickets).
- `GET /bi/reports` returns an in-memory catalog (seed available in `V005__bi_seed.sql`).
- `POST /bi/export` generates CSV/JSON/XLSX on-the-fly and returns as attachment.

Security & CORS
- No authentication in this sprint (mock). CORS is intentionally permissive only for localhost origins to ease local testing.

Scaling notes
- For real workloads, move exports to background jobs (Celery/RQ) and store artifacts on object storage (S3) with signed URLs.

Next steps (Sprint 12+)
- Add authentication (JWT/API-GW), integrate with PMS/EMS, implement caching and background export workers, add observability (metrics, traces).
