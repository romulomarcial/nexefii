AI DB Note

The `ai_service` currently operates as a stateless service that aggregates metrics from BI and housekeeping services.

If persistence is desired, create table `ai_insight_logs` to store request/response JSON payloads (see migration V006__ai_insight_logs.sql).

Design notes:
- Use JSONB for request/response to allow flexible schemas.
- Include indexing on `property_id` and `created_at` for fast queries.
- In production, consider a dedicated analytics DB or timeseries store for large volumes.
