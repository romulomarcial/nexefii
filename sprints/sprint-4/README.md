# Sprint 4 – Sync Service (Nexefii Platform)

## Visão Geral
A Sprint 4 entrega o módulo de sincronização de dados entre o storage local (IndexedDB/localStorage) e o servidor, com suporte a múltiplos modos (manual, agendado e contínuo), tratamento de conflitos e coleta de métricas. Esta base sustenta as próximas sprints de OTA & Rollback.

## Componentes
- `core/sync/SyncService.js` – Núcleo de sincronização (fila, delta stub, retry exponencial, métricas)
- `core/sync/ConflictResolver.js` – Estratégia de resolução de conflitos (LWW + manual)
- `core/sync/SyncLogger.js` – Logs estruturados e métricas exportáveis
- `core/sync/SyncConfigPage.js` – Orquestra página de configuração
- `pages/sync-config.html` – Interface de configuração
- `qa-baseline/sprint4-sync-qa.html` – QA automatizado da sprint

## Como testar
1. Abra `pages/sync-config.html`
2. Altere o modo de sincronização (Manual / Agendado / Contínuo)
3. Clique em “Sincronizar Agora” e/ou configure intervalo
4. Acompanhe `Status` e exporte o log para diagnóstico

QA dedicado:
- Abra `qa-baseline/sprint4-sync-qa.html` e clique “Executar QA Completo”

## Critérios de Sucesso
- Latência média por lote ≤ 2s (ambiente simulado)
- Fila vazia ao final dos testes
- Conflitos tratados sem exceções

## Próximos Passos (Sprint 5)
- OTAManager (atualizações over-the-air)
- CompatibilityChecker
- RollbackService

## Licença
Proprietário – Nexefii Platform
