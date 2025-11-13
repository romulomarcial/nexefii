# Sprint 10 – Nexefii: Housekeeping, DND, Alertas, i18n

## Objetivo
- Modularizar plataforma Nexefii (sem iluxsys)
- Implementar Housekeeping, DND, Alertas (Flask microservices)
- Interface responsiva e multilíngue (i18n centralizado)
- QA automatizado, Docker Compose atualizado

## Estrutura de Diretórios
```
sprints/sprint-10/outputs/web/
  ├── about.html
  ├── alerts.html
  ├── commercial-portfolio.html
  ├── contact.html
  ├── healthcare-portfolio.html
  ├── hk-config.html
  ├── housekeeping.html
  ├── hospitality-portfolio.html
  ├── index.html
  ├── institutional.html
  ├── portfolio-section.html
  ├── portfolio.html
  ├── residential-portfolio.html
  ├── services.html
  ├── style.css
  ├── translations/
  │     ├── about.json
  │     ├── alerts.json
  │     ├── commercial-portfolio.json
  │     ├── contact.json
  │     ├── healthcare-portfolio.json
  │     ├── hk-config.json
  │     ├── housekeeping.json
  │     ├── hospitality-portfolio.json
  │     ├── index.json
  │     ├── institutional.json
  │     ├── portfolio-section.json
  │     ├── portfolio.json
  │     ├── residential-portfolio.json
  │     ├── services.json
  │     └── i18n.js
```

## i18n Centralizado
- Cada página possui seu próprio arquivo JSON de tradução (pt/en).
- Loader central `i18n.js` carrega e aplica traduções dinâmicas via atributo `data-i18n`.
- Exemplo de uso:
  ```html
  <h1 data-i18n="title">Housekeeping</h1>
  <script src="translations/i18n.js"></script>
  <body onload="i18n.init('housekeeping')">
  ```

## Microservices (Flask)
- `housekeeping_service.py`, `alerts_service.py`, `dnd_adapter_mock.py` implementam APIs REST.
- Banco: Postgres, migrado via `V004__housekeeping_alerts.sql`.
- Docker Compose atualizado para todos serviços, healthchecks em Python.

## QA Automatizado
- Scripts PowerShell: `qa/hk_smoke.ps1`, `qa/alerts_smoke.ps1` para validação de endpoints.

## UI/UX
- Todas páginas HTML usam CSS responsivo (`style.css`).
- Navegação multilíngue, integração total com i18n.

## Checklist Sprint 10
- [x] Remoção total de iluxsys
- [x] Flask microservices criados e testados
- [x] Docker Compose atualizado
- [x] Migração SQL aplicada
- [x] QA scripts criados
- [x] UI responsiva e multilíngue
- [x] i18n modular e centralizado
- [x] Validação final concluída

## Próximos Passos (Sprint 11)
- Novos módulos e integrações
- Expansão de microservices
- Melhorias em QA e automação
- Novos idiomas e internacionalização
- Refino de UI/UX

---

Para dúvidas, consulte este README ou solicite documentação detalhada de cada módulo.