Nexefii API Gateway Contract

Base URL (gateway): http://localhost:8088
Authentication: Header `X-Api-Key: <key>` (default in dev: `devkey`)

Endpoints (selected):

- GET /api/bi/kpis
  - Proxies to BI: /bi/kpis
  - Response: JSON with keys `occupancy_pct`, `revpar`, `kwh`, `open_tickets`

- GET /api/bi/reports?page={page}&size={size}
  - Proxies to BI: /bi/reports
  - Response: { page, size, total, items: [{id,name,description,updated_at}] }

- POST /api/ai/insights
  - Proxies to AI: /ai/insights
  - Body: { scope, propertyId, horizon, metrics }
  - Response: { propertyId, summary, highlights: [...], raw: {...} }

- POST /api/ai/predict
  - Proxies to AI: /ai/predict

- POST /api/ai/optimize
  - Proxies to AI: /ai/optimize

- GET /api/pms/{path}
  - Proxies to demo-property-service (stub for PMS)

- GET /api/ems/{path}
  - Proxies to housekeeping/alerts

Notes:
- Gateway performs a simple API key check. Include `X-Api-Key` header in requests.
- Responses are proxied transparently; gateway forwards status codes and bodies when possible.
