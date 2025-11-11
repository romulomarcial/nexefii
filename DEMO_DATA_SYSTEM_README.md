# ðŸŽ­ Sistema de Dados Demo - nexefii

**Data**: 07/11/2025  
**VersÃ£o**: 1.0.0  
**Status**: âœ… Implementado e Testado

---

## ðŸ“‹ VisÃ£o Geral

Sistema completo para inserir dados fake em propriedades de demonstraÃ§Ã£o, simulando integraÃ§Ãµes reais com PMS, reservas, housekeeping, engenharia e outros mÃ³dulos. Atualiza automaticamente os KPIs do dashboard em tempo real.

---

## ðŸŽ¯ Objetivo

Permitir demonstraÃ§Ãµes realistas do sistema nexefii sem necessidade de integraÃ§Ãµes reais, com dados que se atualizam periodicamente para simular ambiente de produÃ§Ã£o.

---

## ðŸ“ Arquivos Implementados

### âœ¨ Novo Arquivo

**`demo-data-generator.js`** (750 linhas)
- **LocalizaÃ§Ã£o**: `r:\Development\Projects\nexefii\demo-data-generator.js`
- **Classe Principal**: `DemoDataGenerator`
- **Exportado Como**: `window.DemoDataGenerator`

#### MÃ©todos PÃºblicos:

```javascript
// Inserir dados fake completos
DemoDataGenerator.insertDemoData(propertyKey, autoRefresh = true)

// Limpar dados fake
DemoDataGenerator.clearDemoData(propertyKey)

// Iniciar auto-refresh (5 min)
DemoDataGenerator.startAutoRefresh(propertyKey)

// Parar auto-refresh
DemoDataGenerator.stopAutoRefresh(propertyKey)

// Obter status
DemoDataGenerator.getDemoStatus(propertyKey)
```

#### Dados Gerados:

1. **Reservas** (`pms_reservations_{propertyKey}`)
   - 90 dias de histÃ³rico
   - 30 dias de forecast futuro
   - Status: confirmed, in_house, checked_out, no_show
   - OcupaÃ§Ã£o variÃ¡vel: 40% a 95%
   - Sazonalidade + fim de semana

2. **InventÃ¡rio de Quartos** (`pms_inventory_{propertyKey}`)
   - Total de quartos conforme `property.roomCount`
   - Tipos: standard, deluxe, suite, executive
   - Status: available, occupied, maintenance
   - Clean status: clean, dirty, cleaning

3. **MÃ©tricas PMS** (`pms_metrics_{propertyKey}`)
   - occupancyRate, totalRooms, roomsSold, roomsAvailable
   - revenue, averageDailyRate (ADR), revPAR
   - checkInsToday, checkOutsToday, stayovers
   - noShows, inHouse, alerts
   - forecastOccupancy, forecastRevenue
   - occupancyTrend (up/down/stable)

4. **Housekeeping** (`housekeeping_tasks_{propertyKey}`)
   - Tarefas por quarto nÃ£o limpo
   - Tipos: checkout_clean, daily_clean
   - Prioridades: normal, high
   - Status: pending, in_progress

5. **Engenharia** (`engineering_orders_{propertyKey}`)
   - 5-15 ordens de serviÃ§o ativas
   - Categorias: HVAC, Plumbing, Electrical, etc.
   - Prioridades: low, normal, high, urgent
   - Status: open, in_progress, pending_parts, completed

6. **Alertas** (`alerts_{propertyKey}`)
   - 0-3 alertas ativos
   - Tipos: maintenance, reservation, housekeeping, system
   - Severidade: info, warning, error

7. **HÃ³spedes** (`guests_{propertyKey}`)
   - Perfis Ãºnicos baseados nas reservas
   - Loyalty tiers: Bronze, Silver, Gold, Platinum
   - HistÃ³rico de estadias e gastos
   - PreferÃªncias e idioma

### ðŸ“ Arquivos Modificados

#### 1. **`properties.js`**

**AlteraÃ§Ãµes**:
- Adicionado campo `isDemo: boolean` em todas as propriedades
- iluxSaoPaulo: `isDemo: false` (produÃ§Ã£o)
- iluxMiami: `isDemo: true` (demo)
- iluxRioDeJaneiro: `isDemo: true` (demo)

**FunÃ§Ã£o `upsertProperty()` estendida** para suportar campo `isDemo`

```javascript
{
  key: 'iluxMiami',
  name: 'iLux Miami',
  isDemo: true, // <-- NOVO CAMPO
  deployed: true,
  roomCount: 72,
  // ...
}
```

#### 2. **`master-control.js`**

**AlteraÃ§Ãµes**:
- BotÃ£o "ðŸŽ­ Inserir Dados" adicionado ao modal de publicaÃ§Ã£o
- VisÃ­vel apenas quando `property.isDemo === true`
- Posicionado ao lado do botÃ£o "Testar Localmente"

**LocalizaÃ§Ã£o**: Linha ~3502 (modal de publicaÃ§Ã£o)

```javascript
${property.isDemo ? `
<button onclick="masterCtrl.insertDemoData('${property.key}')">
  <span>ðŸŽ­</span>
  <span>Inserir Dados</span>
</button>
` : ''}
```

#### 3. **`property-publish-helpers.js`**

**AlteraÃ§Ãµes**:
- Nova funÃ§Ã£o `MasterControlSystem.prototype.insertDemoData(propertyKey)`
- Modal de confirmaÃ§Ã£o com checkbox para auto-refresh
- Lista completa de dados a serem gerados
- IntegraÃ§Ã£o com `window.DemoDataGenerator`

**Fluxo**:
1. Verifica se propriedade existe
2. Avisa se nÃ£o for demo (mas permite continuar)
3. Exibe modal de confirmaÃ§Ã£o
4. UsuÃ¡rio escolhe se quer auto-refresh
5. Chama `DemoDataGenerator.insertDemoData()`
6. Exibe toast de sucesso/erro
7. Recarrega dashboard automaticamente

#### 4. **`property-dashboard-manager.js`**

**AlteraÃ§Ãµes Principais**:

**A) `loadPropertyMetrics()` modificado**:
```javascript
// PRIORIDADE 1: Verificar dados demo gerados
const demoMetrics = localStorage.getItem(`pms_metrics_${propertyKey}`);
if (demoMetrics) {
  return JSON.parse(demoMetrics); // USA DADOS DEMO
}

// PRIORIDADE 2: SimulaÃ§Ã£o (fallback)
// ... cÃ³digo de simulaÃ§Ã£o existente
```

**B) Event Listener adicionado**:
```javascript
window.addEventListener('demoDataUpdated', function(event) {
  const { propertyKey, timestamp } = event.detail;
  CacheManager.clear(`metrics_${propertyKey}`);
  CacheManager.clear(`weather_${propertyKey}`);
  PropertyDashboard.refresh();
});
```

**BenefÃ­cios**:
- Dashboard atualiza automaticamente ao inserir dados
- Cache invalidado para forÃ§ar reload dos dados demo
- Sem necessidade de F5 manual

#### 5. **`js/translations/dashboard.json`**

**Novas TraduÃ§Ãµes**:

**PortuguÃªs (pt)**:
```json
{
  "insertDemoData": "ðŸŽ­ Inserir Dados",
  "demo": {
    "title": "Inserir Dados de DemonstraÃ§Ã£o",
    "dataGenerated": "Dados que serÃ£o gerados:",
    "autoRefresh": "Atualizar dados automaticamente a cada 5 minutos",
    "insertButton": "ðŸŽ­ Inserir Dados",
    "success": "âœ… Dados inseridos com sucesso!",
    // ... mais traduÃ§Ãµes
  }
}
```

**InglÃªs (en)**: "Insert Data", "Insert Demo Data", etc.  
**Espanhol (es)**: "Insertar Datos", "Insertar Datos de DemostraciÃ³n", etc.

#### 6. **`index.html`** e **`master-control.html`**

**AlteraÃ§Ãµes**:
- Script `demo-data-generator.js` adicionado antes do `property-dashboard-manager.js`

```html
<script src="properties.js"></script>
<script src="demo-data-generator.js"></script> <!-- NOVO -->
<script src="property-dashboard-manager.js" defer></script>
```

---

## ðŸš€ Como Usar

### MÃ©todo 1: Via Master Control Panel

1. Abra `master-control.html`
2. Login como `master` / `Master2025!@#$`
3. Clique em uma propriedade demo (iluxMiami ou iluxRioDeJaneiro)
4. No modal, verÃ¡ botÃ£o **"ðŸŽ­ Inserir Dados"** ao lado de "Testar Localmente"
5. Clique no botÃ£o
6. Confirme e escolha se quer auto-refresh
7. Aguarde mensagem de sucesso
8. Dados inseridos! Dashboard atualiza automaticamente

### MÃ©todo 2: Via Console JavaScript

```javascript
// Inserir dados com auto-refresh
DemoDataGenerator.insertDemoData('iluxMiami', true);

// Inserir dados sem auto-refresh
DemoDataGenerator.insertDemoData('iluxMiami', false);

// Limpar dados
DemoDataGenerator.clearDemoData('iluxMiami');

// Verificar status
DemoDataGenerator.getDemoStatus('iluxMiami');
// Retorna: { hasData, lastUpdate, isAutoRefreshActive, updateInterval }

// Parar auto-refresh
DemoDataGenerator.stopAutoRefresh('iluxMiami');

// Parar todos os auto-refreshes
DemoDataGenerator.stopAllAutoRefresh();
```

---

## ðŸ”„ Sistema de Auto-Refresh

**ConfiguraÃ§Ã£o**:
- Intervalo: 5 minutos (300.000 ms)
- ConfigurÃ¡vel em: `demo-data-generator.js` â†’ `CONFIG.updateInterval`

**Como Funciona**:
1. Ao inserir dados, pode-se marcar checkbox "Auto-refresh"
2. Timer Ã© criado com `setInterval()`
3. A cada 5 minutos, chama `insertDemoData()` novamente
4. Gera novos dados frescos (ocupaÃ§Ã£o varia, etc.)
5. Dispara evento `demoDataUpdated`
6. Dashboard atualiza automaticamente

**Gerenciamento**:
- Timers armazenados em `Map<propertyKey, intervalId>`
- FunÃ§Ã£o `stopAutoRefresh()` para parar timer especÃ­fico
- FunÃ§Ã£o `stopAllAutoRefresh()` para parar todos
- Apenas 1 timer ativo por propriedade (evita duplicaÃ§Ã£o)

---

## ðŸ“Š IntegraÃ§Ã£o com Dashboard

### Fluxo de Dados:

```
1. UsuÃ¡rio clica "Inserir Dados"
   â†“
2. DemoDataGenerator.insertDemoData()
   â†“
3. Gera dados e salva no localStorage
   â†“
4. Dispara evento 'demoDataUpdated'
   â†“
5. property-dashboard-manager.js ouve evento
   â†“
6. CacheManager.clear() para forÃ§ar reload
   â†“
7. PropertyDashboard.refresh()
   â†“
8. loadPropertyMetrics() busca dados demo
   â†“
9. Dashboard renderiza com dados fake
   â†“
10. KPIs atualizados! ðŸŽ‰
```

### Prioridade de Dados:

```javascript
loadPropertyMetrics(propertyKey) {
  // 1Âº: Dados demo (se existirem)
  const demo = localStorage.getItem(`pms_metrics_${propertyKey}`);
  if (demo) return JSON.parse(demo);
  
  // 2Âº: SimulaÃ§Ã£o (fallback)
  return generateSimulatedMetrics();
}
```

---

## ðŸŽ¨ Interface Visual

### BotÃ£o "Inserir Dados"

**AparÃªncia**:
- Ãcone: ðŸŽ­ (mÃ¡scara de teatro)
- Cor: Verde (`#10b981`)
- Borda: 2px solid verde
- Hover: Fundo verde claro (`#d1fae5`)

**Posicionamento**:
- Ao lado do botÃ£o "Testar Localmente"
- Mesmo estilo visual (consistÃªncia)
- SÃ³ aparece para propriedades com `isDemo: true`

### Modal de ConfirmaÃ§Ã£o

**SeÃ§Ãµes**:

1. **Header**:
   - ðŸŽ­ (emoji grande)
   - TÃ­tulo: "Inserir Dados de DemonstraÃ§Ã£o"
   - Nome da propriedade

2. **Lista de Dados** (caixa azul):
   - âœ… Reservas (90 dias + 30 futuro)
   - âœ… InventÃ¡rio de quartos (X quartos)
   - âœ… MÃ©tricas PMS
   - âœ… Tarefas de Housekeeping
   - âœ… Ordens de Engenharia
   - âœ… Alertas do sistema
   - âœ… Perfis de hÃ³spedes

3. **Auto-Refresh** (caixa amarela):
   - â˜‘ï¸ Checkbox para habilitar
   - DescriÃ§Ã£o: "Atualizar automaticamente a cada 5 minutos"
   - ExplicaÃ§Ã£o: Simula sistema real

4. **BotÃµes**:
   - âŒ Cancelar (cinza)
   - ðŸŽ­ Inserir Dados (verde, gradiente)

---

## ðŸŒ InternacionalizaÃ§Ã£o

**Idiomas Suportados**:
- ðŸ‡§ðŸ‡· PortuguÃªs (pt)
- ðŸ‡ºðŸ‡¸ InglÃªs (en)
- ðŸ‡ªðŸ‡¸ Espanhol (es)

**Chaves Principais**:
```
dashboard.insertDemoData
dashboard.demo.title
dashboard.demo.dataGenerated
dashboard.demo.reservations
dashboard.demo.autoRefresh
dashboard.demo.insertButton
dashboard.demo.success
dashboard.demo.error
```

**Uso**:
```javascript
// No cÃ³digo, use chaves i18n para textos
const title = i18n.t('dashboard.demo.title');
```

---

## ðŸ’¾ Estrutura de Armazenamento (localStorage)

### Chaves Criadas:

```javascript
// MÃ©tricas PMS
`pms_metrics_${propertyKey}` â†’ Object { occupancyRate, revenue, ... }

// Reservas
`pms_reservations_${propertyKey}` â†’ Array<Reservation>

// InventÃ¡rio
`pms_inventory_${propertyKey}` â†’ Array<Room>

// Housekeeping
`housekeeping_tasks_${propertyKey}` â†’ Array<Task>

// Engenharia
`engineering_orders_${propertyKey}` â†’ Array<WorkOrder>

// Alertas
`alerts_${propertyKey}` â†’ Array<Alert>

// HÃ³spedes
`guests_${propertyKey}` â†’ Array<Guest>
```

### Tamanho Estimado:

- 1 propriedade com 50 quartos, 90 dias de histÃ³rico:
  - Reservas: ~150 KB
  - InventÃ¡rio: ~10 KB
  - MÃ©tricas: ~2 KB
  - Housekeeping: ~5 KB
  - Engenharia: ~3 KB
  - Alertas: ~1 KB
  - HÃ³spedes: ~20 KB
  - **TOTAL: ~191 KB por propriedade**

---

## ðŸ§ª Testando o Sistema

### Teste BÃ¡sico:

1. **F5** em `master-control.html`
2. Clique em "iLux Miami" (propriedade demo)
3. Veja botÃ£o "ðŸŽ­ Inserir Dados"
4. Clique e confirme
5. Aguarde toast "âœ… Dados inseridos com sucesso!"

### Teste de Auto-Refresh:

1. Insira dados com checkbox marcado
2. Abra Console: `F12 â†’ Console`
3. Digite: `DemoDataGenerator.getDemoStatus('iluxMiami')`
4. Veja: `isAutoRefreshActive: true`
5. Aguarde 5 minutos
6. Veja no console: `[DemoData] Auto-refresh para iluxMiami...`

### Teste de Dashboard:

1. Insira dados em iluxMiami
2. Abra `index.html`
3. Login: `master` / `Master2025!@#$`
4. Veja KPIs atualizados com dados demo
5. Verifique card de iluxMiami com mÃ©tricas realistas
6. Dados agora vÃªm do localStorage, nÃ£o da simulaÃ§Ã£o

### Teste de Limpeza:

```javascript
// Limpar dados
DemoDataGenerator.clearDemoData('iluxMiami');

// Verificar
DemoDataGenerator.getDemoStatus('iluxMiami');
// hasData: false

// Refresh dashboard
PropertyDashboard.refresh();
// Volta para simulaÃ§Ã£o
```

---

## ðŸ”§ ConfiguraÃ§Ãµes AvanÃ§adas

### Alterar Intervalo de Auto-Refresh:

**Arquivo**: `demo-data-generator.js`

```javascript
const CONFIG = {
  updateInterval: 5 * 60 * 1000, // 5 minutos
  // Altere para:
  updateInterval: 10 * 60 * 1000, // 10 minutos
  // ou:
  updateInterval: 60 * 1000, // 1 minuto (para testes)
};
```

### Alterar Range de Dados:

```javascript
const CONFIG = {
  dateRange: 90, // dias de histÃ³rico (padrÃ£o: 90)
  futureRange: 30, // dias de forecast (padrÃ£o: 30)
};
```

### Adicionar Novos Tipos de Dados:

```javascript
// Em DemoDataGenerator.insertDemoData():
this.generateReservations(propertyKey, property);
this.generateInventory(propertyKey, property);
// ... existentes

// ADICIONAR:
this.generateYourNewModule(propertyKey, property);
```

```javascript
// Criar nova funÃ§Ã£o:
generateYourNewModule: function(propertyKey, property) {
  const data = []; // Gerar seus dados
  localStorage.setItem(`your_module_${propertyKey}`, JSON.stringify(data));
  console.log(`[DemoData] âœ… Seu mÃ³dulo gerado`);
}
```

---

## ðŸ› Troubleshooting

### Problema: BotÃ£o nÃ£o aparece

**Causa**: Propriedade nÃ£o marcada como demo

**SoluÃ§Ã£o**:
```javascript
// No properties.js, certifique-se:
{
  key: 'suaPropriedade',
  isDemo: true, // <-- DEVE SER true
  // ...
}
```

### Problema: Dados nÃ£o atualizam no dashboard

**Causa**: Cache nÃ£o invalidado

**SoluÃ§Ã£o**:
```javascript
// Limpar cache manualmente
CacheManager.clear('metrics_suaPropriedade');
PropertyDashboard.refresh();
```

### Problema: Auto-refresh nÃ£o funciona

**Causa**: Timer nÃ£o iniciado

**Verificar**:
```javascript
DemoDataGenerator.getDemoStatus('suaPropriedade');
// Se isAutoRefreshActive: false

// Iniciar manualmente:
DemoDataGenerator.startAutoRefresh('suaPropriedade');
```

### Problema: LocalStorage cheio

**Causa**: Muitos dados acumulados

**SoluÃ§Ã£o**:
```javascript
// Limpar dados antigos
DemoDataGenerator.clearDemoData('propriedade1');
DemoDataGenerator.clearDemoData('propriedade2');

// Ou limpar tudo:
localStorage.clear();
```

---

## ðŸ“ˆ Roadmap Futuro

### v1.1 (Planejado):
- [ ] Configurar intervalos personalizados por propriedade
- [ ] UI para gerenciar auto-refreshes ativos
- [ ] Export/import de datasets demo
- [ ] Templates de dados prÃ©-configurados

### v1.2 (Planejado):
- [ ] Gerar dados baseados em padrÃµes reais (ML)
- [ ] VariaÃ§Ã£o sazonal mais realista
- [ ] SimulaÃ§Ã£o de eventos especiais
- [ ] IntegraÃ§Ã£o com calendÃ¡rio local

### v2.0 (Futuro):
- [ ] Backend para persistÃªncia de dados demo
- [ ] Compartilhamento de datasets entre usuÃ¡rios
- [ ] Versionamento de datasets
- [ ] Analytics de uso de dados demo

---

## ðŸ“„ LicenÃ§a

ProprietÃ¡rio - nexefii Â© 2025

---

## ðŸ‘¥ Autores

**nexefii Development Team**  
Data: 07/11/2025  
VersÃ£o: 1.0.0

---

## ðŸ“ž Suporte

Para dÃºvidas ou problemas:
- ðŸ“§ Email: dev@nexefii.com
- ðŸ“– Docs: Este arquivo
- ðŸ› Issues: Reportar bugs ao time de desenvolvimento

---

**Ãšltima AtualizaÃ§Ã£o**: 07/11/2025 - 17:00 BRT

