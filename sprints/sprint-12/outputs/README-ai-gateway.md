Sprint 12 - AI + Gateway (dev)

How to run (recommended: Docker Compose)

From repository root:

```powershell
Set-Location 'r:\Development\Projects\nexefii'
docker compose up -d --build ai gateway web bi housekeeping alerts demo-property-service postgres
```

Access:
- Gateway UI (AI Console served via web static pages): http://localhost:8080/sprints/sprint-12/outputs/web/ai-console.html
- Gateway API base: http://localhost:8088
- AI service: http://localhost:8087/ai/health

Testing (smoke):
```powershell
Set-Location 'r:\Development\Projects\nexefii\sprints\sprint-12\outputs\qa'
.\ai_gateway_smoke.ps1
```

Notes:
- Gateway requires header `X-Api-Key: devkey` by default.
- AI service is a simulated layer and does not call any external AI provider.
