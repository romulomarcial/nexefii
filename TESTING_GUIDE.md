# ðŸ§ª Guia de Testes - Nexefii Platform

**Servidor:** http://localhost:8004  
**Data:** 2025-11-09

---

## ðŸš€ Como Iniciar

### 1. Servidor Local
```powershell
cd r:\Development\Projects\nexefii
node server.js
```
âœ… Servidor rodando em: **http://localhost:8004**

---

## ðŸ“‹ Testes por Sprint

### âœ… Sprint 3: Image Upload + UX
**PÃ¡gina de teste:** `http://localhost:8004/index.html`

**O que testar:**
1. **Upload de Imagem via Galeria**
   - Clicar em botÃ£o de upload
   - Selecionar imagem da galeria (6 SVGs disponÃ­veis)
   - âœ… Preview deve aparecer
   - âœ… Imagem deve ser salva

2. **Upload de Arquivo**
   - Arrastar arquivo para Ã¡rea de drop
   - âœ… Feedback visual durante drag
   - âœ… Preview da imagem
   - âœ… Arquivo processado

3. **Upload via URL**
   - Inserir URL de imagem
   - âœ… Download e preview
   - âœ… Salvamento correto

4. **AnimaÃ§Ãµes**
   - âœ… Fade-in ao carregar
   - âœ… Hover effects nos botÃµes
   - âœ… TransiÃ§Ãµes suaves

**Resultado esperado:** 27/27 testes passando (conforme QA)

---

### âœ… Sprint 4: Sync Service
**PÃ¡gina de teste:** `http://localhost:8004/pages/sync-config.html`

**O que testar:**
1. **Sync Manual**
   - Clicar em "Sincronizar Agora"
   - âœ… Evento adicionado Ã  fila
   - âœ… Status atualizado
   - âœ… Log de sincronizaÃ§Ã£o

2. **Sync Agendado**
   - Selecionar modo "Agendado"
   - Definir cron (ex: `0 2 * * *` = 2AM diÃ¡rio)
   - âœ… Timer ativado
   - âœ… PrÃ³ximo sync agendado visÃ­vel

3. **Sync ContÃ­nuo**
   - Selecionar modo "ContÃ­nuo"
   - âœ… Debounce de 30s ativo
   - âœ… Auto-sync apÃ³s mudanÃ§as

4. **ResoluÃ§Ã£o de Conflitos**
   - Criar conflito (editar mesmo registro local e remoto)
   - âœ… PolÃ­tica last-write-wins aplicada
   - âœ… Log de conflitos

**Console esperado:**
```
[SyncService] Iniciado (modo: manual)
[SyncService] Evento enfileirado: {...}
[SyncService] Processando lote (50 eventos)
[SyncService] Delta sync: 12 registros modificados
```

---

### âœ… Sprint 5: OTA & Rollback
**PÃ¡gina de teste:** `http://localhost:8004/pages/ota-manager.html`

**O que testar:**
1. **Check de AtualizaÃ§Ãµes**
   - Clicar em "Verificar AtualizaÃ§Ãµes"
   - âœ… VersÃ£o atual exibida (ex: 1.0.0)
   - âœ… VersÃ£o disponÃ­vel verificada
   - âœ… Changelog exibido

2. **Compatibilidade**
   - Verificar compatibilidade antes de aplicar
   - âœ… Schema version validado
   - âœ… DependÃªncias verificadas
   - âœ… Storage disponÃ­vel checado

3. **Aplicar Update**
   - Clicar em "Aplicar Update"
   - âœ… Snapshot criado automaticamente
   - âœ… Migrations executadas
   - âœ… VersÃ£o atualizada
   - â±ï¸ Tempo: ~2s

4. **Rollback**
   - Simular falha no update
   - âœ… Rollback automÃ¡tico disparado
   - âœ… Estado anterior restaurado
   - âœ… Log de rollback

5. **Snapshots Manuais**
   - Criar snapshot manual
   - Listar snapshots disponÃ­veis
   - Restaurar snapshot especÃ­fico
   - âœ… Max 5 snapshots (rotaÃ§Ã£o)

**Console esperado:**
```
[OTAManager] Check: versÃ£o atual 1.0.0
[OTAManager] DisponÃ­vel: 1.1.0
[CompatibilityChecker] Schema v1.0.0 â†’ v1.1.0 compatÃ­vel
[RollbackService] Snapshot criado: snap_1699524000000
[OTAManager] Update aplicado com sucesso
```

---

### âœ… Sprint 6: Observability
**PÃ¡gina de teste:** `http://localhost:8004/pages/observability.html`

**O que testar:**
1. **Dashboard Inicial**
   - Abrir pÃ¡gina
   - âœ… 3 cards: MÃ©tricas, Logs, Alertas
   - âœ… Estado inicial "Aguardando dados..."

2. **Iniciar Monitoramento**
   - Clicar em "â–¶ï¸ Iniciar Monitoramento"
   - âœ… MetricsCollector iniciado (intervalo 3s)
   - âœ… AlertManager iniciado (check 30s)
   - âœ… Heartbeat logs a cada 5s

3. **Logger em AÃ§Ã£o**
   - Verificar seÃ§Ã£o "Logs Recentes"
   - âœ… Logs aparecem em tempo real
   - âœ… Formato: `[HH:MM:SS] [LEVEL] message`
   - âœ… NÃ­veis: INFO, WARN, ERROR visÃ­veis

4. **MÃ©tricas**
   - Verificar card "MÃ©tricas Gerais"
   - âœ… Performance Avg (ms)
   - âœ… Performance P95 (ms)
   - âœ… Memory Usage (%)
   - â±ï¸ AtualizaÃ§Ã£o a cada 2s

5. **Alertas**
   - Simular condiÃ§Ã£o de alerta (memÃ³ria >85%)
   - âœ… Alerta dispara
   - âœ… Card "Alertas Ativos" incrementa
   - âœ… HistÃ³rico exibe alerta com timestamp
   - âœ… BotÃ£o "âœ“ OK" para acknowledge

6. **Export**
   - Clicar em "ðŸ“¤ Exportar"
   - âœ… Download de `observability-export.json`
   - âœ… Arquivo contÃ©m: logger, metrics, alerts

**Console esperado:**
```
[INFO] Sistema inicializado
[DEBUG] Debug mode ativo
[INFO] Observability iniciado
[INFO] Heartbeat {category: "system"}
[WARN] [ALERT WARNING] Alto uso de memÃ³ria em 87%
```

---

### âœ… Sprint 6: QA Automatizado
**PÃ¡gina de teste:** `http://localhost:8004/qa-baseline/sprint6-observability-qa.html`

**O que acontece:**
- âœ… 7 testes executam automaticamente ao carregar
- âœ… Resultados aparecem em ~5s
- âœ… Cada teste mostra: âœ… PASS ou âŒ FALHOU

**Testes incluÃ­dos:**
1. Logger: NÃ­veis e Categorias
2. Logger: Export e Subscribe
3. MetricsCollector: Performance & Resources
4. MetricsCollector: AnÃ¡lise EstatÃ­stica (P95/P99)
5. AlertManager: Regras e Triggers
6. AlertManager: Cooldown e Acknowledge
7. Performance: Overhead <100ms

**Resultado esperado:** 7/7 testes PASS âœ…

---

## ðŸŽ¯ Testes Completos (Todas as Sprints)

### Checklist RÃ¡pido

```powershell
# 1. Servidor rodando?
Test-NetConnection localhost -Port 8004

# 2. Abrir pÃ¡ginas principais
Start-Process "http://localhost:8004/index.html"
Start-Process "http://localhost:8004/pages/sync-config.html"
Start-Process "http://localhost:8004/pages/ota-manager.html"
Start-Process "http://localhost:8004/pages/observability.html"

# 3. Abrir QA
Start-Process "http://localhost:8004/qa-baseline/sprint6-observability-qa.html"
```

### Verificar Console do Navegador

Pressione **F12** (DevTools) e verifique:

âœ… **Sem erros 404** (todos os mÃ³dulos carregaram)  
âœ… **MÃ³dulos ES6 importados** (Logger, MetricsCollector, AlertManager)  
âœ… **Logs estruturados** aparecem no console  
âœ… **Performance** nÃ£o degradada (FCP <2s)

---

## ðŸ” Troubleshooting

### Erro: "Failed to load module"
**Causa:** Caminho de import incorreto  
**SoluÃ§Ã£o:** Verificar que servidor estÃ¡ em `r:\Development\Projects\nexefii`

### Erro: "Cannot read property of undefined"
**Causa:** MÃ³dulo nÃ£o carregou antes de ser usado  
**SoluÃ§Ã£o:** Verificar ordem de imports no HTML

### QA nÃ£o executa automaticamente
**Causa:** Script de auto-run pode estar desabilitado  
**SoluÃ§Ã£o:** Clicar manualmente no botÃ£o "ðŸš€ Executar Todos os Testes"

### MÃ©tricas nÃ£o atualizam
**Causa:** Monitoramento nÃ£o foi iniciado  
**SoluÃ§Ã£o:** Clicar em "â–¶ï¸ Iniciar Monitoramento" no dashboard

---

## ðŸ“Š Performance Esperada

| MÃ©trica | Target | Como Verificar |
|---------|--------|----------------|
| FCP | <2s | DevTools > Performance > Record |
| Sync LatÃªncia | <2s | Console logs de SyncService |
| OTA Update | ~2s | Console logs de OTAManager |
| Observability Overhead | <100ms | QA Test #7 |

---

## ðŸŽ“ Dicas de Teste

1. **Use Modo IncÃ³gnito:** Evita cache antigo
2. **Limpe localStorage:** `localStorage.clear()` no console
3. **Monitore Network:** DevTools > Network para ver requisiÃ§Ãµes
4. **Console sempre aberto:** Logs sÃ£o essenciais
5. **Teste em diferentes navegadores:** Chrome, Edge, Firefox

---

## ðŸ“ Reportar Problemas

Se encontrar bugs, anote:
- âœ… URL da pÃ¡gina
- âœ… AÃ§Ã£o realizada
- âœ… Erro no console (screenshot)
- âœ… Comportamento esperado vs observado

---

**Ãšltima atualizaÃ§Ã£o:** 2025-11-09 08:52:00  
**Servidor ativo:** âœ… http://localhost:8004

