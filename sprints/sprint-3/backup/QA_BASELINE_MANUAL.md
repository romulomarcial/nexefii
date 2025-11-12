# 📸 QA Baseline - Manual de Captura

**Data:** 08/11/2025  
**Objetivo:** Capturar estado visual e funcional do sistema ANTES da refatoração arquitetural  
**Propósito:** Garantir zero regressão visual/funcional após transformação SaaS

---

## 🎯 Visão Geral

Este baseline servirá como **referência golden** para validar que a refatoração arquitetural:
- ✅ Não alterou aparência visual
- ✅ Não quebrou funcionalidades
- ✅ Mantém performance
- ✅ Preserva dados

---

## 🚀 Passo 1: Executar Script Automatizado

### 1.1 Abrir Master Control Panel

1. Navegue até: `r:\Development\Projects\iluxsys\master-control.html`
2. Faça login com credenciais master
3. Abra Developer Tools (F12)

### 1.2 Carregar Script de Captura

```javascript
// No console do navegador, execute:
const script = document.createElement('script');
script.src = 'qa-baseline-capture.js';
document.head.appendChild(script);
```

**Aguarde mensagem:**
```
╔════════════════════════════════════════════════════════════════╗
║                 🎯 QA Baseline Capture System                  ║
╚════════════════════════════════════════════════════════════════╝
```

### 1.3 Capturar Baseline Automaticamente

```javascript
// Execute no console:
await qaBaseline.captureFullBaseline();
```

**Resultado esperado:**
```
🎯 Iniciando captura de QA Baseline...
📦 Capturando estado do LocalStorage...
✅ Capturados X chaves do LocalStorage
📄 Capturando página atual...
✅ Página capturada: Master Control Panel
🎨 Capturando computed styles...
✅ Capturados computed styles de X componentes
⚙️ Capturando funcionalidades...
✅ Capturadas X funcionalidades
📊 Gerando relatório...
✅ Relatório salvo no localStorage
✅ Baseline capturado com sucesso!
```

### 1.4 Exportar Relatórios

```javascript
// Exportar JSON (dados brutos)
qaBaseline.exportReport();

// Exportar HTML (relatório visual)
qaBaseline.exportHTMLReport();
```

**Arquivos gerados:**
- `qa-baseline-2025-11-08.json` (dados estruturados)
- `qa-baseline-report-2025-11-08.html` (relatório visual)

---

## 📸 Passo 2: Capturas Manuais de Screenshots

### 2.1 Master Control Panel - Dashboard

**URL:** `master-control.html`  
**Tab:** Dashboard (primeira tab)

**Capturas necessárias:**

1. **Estado inicial**
   - [ ] Dashboard completo visível
   - [ ] Estatísticas do sistema exibidas
   - [ ] Ações rápidas visíveis
   - [ ] Métricas enterprise visíveis
   - Screenshot: `01-dashboard-initial.png`

2. **Modal de Backups**
   - [ ] Clicar em "📋 Ver Backups"
   - [ ] Modal aberto com lista
   - [ ] Filtros visíveis
   - Screenshot: `02-dashboard-backups-modal.png`

3. **Confirmação de operação**
   - [ ] Clicar em "💾 Backup Completo"
   - [ ] Modal de confirmação aberto
   - Screenshot: `03-dashboard-confirm-modal.png`

### 2.2 Master Control Panel - Backup & Restore

**Tab:** Backup & Restore

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Backup & Restore" ativa
   - [ ] Formulário de backup visível
   - [ ] Opções de tipo (Completo/Incremental/Seletivo)
   - [ ] Checkboxes de opções
   - Screenshot: `04-backup-main.png`

2. **Seleção de módulos**
   - [ ] Selecionar "Backup Seletivo"
   - [ ] Lista de módulos exibida
   - Screenshot: `05-backup-selective.png`

3. **Lista de backups**
   - [ ] Scroll até seção "Backups Disponíveis"
   - [ ] Tabela de backups visível
   - [ ] Ações (Restaurar/Ver/Excluir) visíveis
   - Screenshot: `06-backup-list.png`

4. **Modal de detalhes**
   - [ ] Clicar em "👁️ Ver" em qualquer backup
   - [ ] Modal de detalhes aberto
   - Screenshot: `07-backup-details-modal.png`

5. **Restore wizard**
   - [ ] Clicar em "♻️ Restaurar"
   - [ ] Wizard de restauração aberto
   - Screenshot: `08-restore-wizard.png`

### 2.3 Master Control Panel - Property Backups

**Tab:** Property Backups

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Property Backups" ativa
   - [ ] Métricas por propriedade visíveis
   - [ ] Cards de estatísticas
   - Screenshot: `09-property-backups-main.png`

2. **Criar backup de propriedade**
   - [ ] Formulário de criação visível
   - [ ] Select de propriedade aberto
   - [ ] Opções de tipo (Full/Incremental)
   - Screenshot: `10-property-backup-create.png`

3. **Catálogo de backups**
   - [ ] Tabela de backups por propriedade
   - [ ] Filtros visíveis (All/Full/Incremental)
   - [ ] Busca funcional
   - Screenshot: `11-property-backup-catalog.png`

4. **Restore wizard por propriedade**
   - [ ] Clicar em "Restore" em um backup
   - [ ] Wizard com 3 steps visível
   - Screenshot: `12-property-restore-wizard.png`

5. **Agendamento**
   - [ ] Seção de agendamento visível
   - [ ] Formulário de cron schedule
   - [ ] Lista de schedules ativos
   - Screenshot: `13-property-backup-schedule.png`

### 2.4 Master Control Panel - General Structure

**Tab:** General Structure Backups

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "General Structure" ativa
   - [ ] Métricas de estrutura geral
   - [ ] Formulário de criação
   - Screenshot: `14-general-backup-main.png`

2. **Criar backup de estrutura**
   - [ ] Checkboxes de componentes visíveis
   - [ ] Campo de tag de versão
   - [ ] Campo de descrição
   - [ ] Opções compress/encrypt
   - Screenshot: `15-general-backup-create.png`

3. **Lista de backups de estrutura**
   - [ ] Tabela com backups criados
   - [ ] Colunas: Version, Components, Date, Size
   - [ ] Ações: Restore, View, Delete
   - Screenshot: `16-general-backup-list.png`

4. **Detalhes de backup**
   - [ ] Modal de detalhes aberto
   - [ ] Componentes capturados listados
   - [ ] Metadata visível
   - Screenshot: `17-general-backup-details.png`

### 2.5 Master Control Panel - Releases & Rollback

**Tab:** Releases & Rollback

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Releases & Rollback" ativa
   - [ ] Timeline de releases
   - [ ] Formulário de criação
   - Screenshot: `18-releases-main.png`

2. **Criar release**
   - [ ] Formulário preenchido
   - [ ] Tags (stable/beta/alpha)
   - [ ] Campo de changelog
   - Screenshot: `19-releases-create.png`

3. **Histórico de releases**
   - [ ] Lista de releases criados
   - [ ] Indicador de release atual
   - [ ] Botões de rollback
   - Screenshot: `20-releases-history.png`

### 2.6 Master Control Panel - Gestão de Usuários

**Tab:** Gestão de Usuários

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Gestão de Usuários" ativa
   - [ ] Tabela de usuários
   - [ ] Filtros de status/role
   - Screenshot: `21-users-main.png`

2. **Criar usuário**
   - [ ] Modal de criação aberto
   - [ ] Formulário completo
   - [ ] Campos: username, email, role, properties
   - Screenshot: `22-users-create.png`

3. **Editar usuário**
   - [ ] Modal de edição aberto
   - [ ] Dados de usuário carregados
   - [ ] Select de properties (multiple)
   - Screenshot: `23-users-edit.png`

4. **Detalhes de usuário**
   - [ ] Modal de detalhes aberto
   - [ ] Todas as informações visíveis
   - Screenshot: `24-users-details.png`

### 2.7 Master Control Panel - Logs & Auditoria

**Tab:** Logs & Auditoria

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Logs & Auditoria" ativa
   - [ ] Filtros avançados visíveis
   - [ ] Tabela de logs
   - Screenshot: `25-logs-main.png`

2. **Filtros aplicados**
   - [ ] Filtrar por tipo (tenant_backup)
   - [ ] Filtrar por nível (info)
   - [ ] Filtrar por data range
   - [ ] Resultados filtrados
   - Screenshot: `26-logs-filtered.png`

3. **Detalhes de log**
   - [ ] Expandir detalhes de um log
   - [ ] JSON completo visível
   - Screenshot: `27-logs-details.png`

### 2.8 Master Control Panel - Configurações

**Tab:** Configurações do Sistema

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Configurações" ativa
   - [ ] Seções: Backup, Retenção, Versionamento, Logs
   - [ ] Feature toggles (compress/encrypt)
   - Screenshot: `28-settings-main.png`

2. **Configurações alteradas**
   - [ ] Modificar alguma configuração
   - [ ] Estado antes de salvar
   - Screenshot: `29-settings-modified.png`

### 2.9 Master Control Panel - Manutenção

**Tab:** Manutenção do Sistema

**Capturas necessárias:**

1. **Tela principal**
   - [ ] Tab "Manutenção" ativa
   - [ ] Botões de manutenção
   - [ ] Seção de storage
   - Screenshot: `30-maintenance-main.png`

2. **Storage monitor**
   - [ ] Gráfico de uso visível
   - [ ] Estatísticas de espaço
   - Screenshot: `31-maintenance-storage.png`

### 2.10 Índice do Sistema (index.html)

**URL:** `index.html`

**Capturas necessárias:**

1. **Página inicial sem property**
   - [ ] index.html sem query string
   - [ ] Estado padrão
   - Screenshot: `32-index-default.png`

2. **Página com property selecionada**
   - [ ] index.html?property=modelhotel
   - [ ] Conteúdo da propriedade carregado
   - Screenshot: `33-index-with-property.png`

### 2.11 Property Test Generator

**URL:** Acesso via Master Control → Properties → Test Property

**Capturas necessárias:**

1. **Tela de teste de propriedade**
   - [ ] Informações da propriedade
   - [ ] Módulos listados
   - [ ] Validação de dados
   - [ ] Botões de ação
   - Screenshot: `34-property-test-main.png`

2. **Modal de aprovação**
   - [ ] Clicar em "Aprovar e Publicar"
   - [ ] Modal de confirmação
   - Screenshot: `35-property-test-approve.png`

---

## 🎨 Passo 3: Captura de Estados Variados

### 3.1 Estados de Sucesso

Capturar toasts/alertas de sucesso:

- [ ] Backup criado com sucesso
- [ ] Usuário criado com sucesso
- [ ] Configurações salvas
- [ ] Restauração concluída
- Screenshots: `success-*.png`

### 3.2 Estados de Erro

Capturar validações e erros:

- [ ] Campo obrigatório não preenchido
- [ ] Erro de validação (email inválido)
- [ ] Erro de operação (backup falhou)
- Screenshots: `error-*.png`

### 3.3 Estados de Confirmação

Capturar modals de confirmação:

- [ ] Confirmar exclusão de usuário
- [ ] Confirmar reset do sistema
- [ ] Confirmar restauração completa
- Screenshots: `confirm-*.png`

---

## 📊 Passo 4: Validação de Computed Styles

### 4.1 Verificar Captura Automática

```javascript
// No console, verifique:
const report = JSON.parse(localStorage.getItem('qa_baseline_report'));
console.log('Components capturados:', report.components.length);
console.log('Selectors:', report.components.map(c => c.selector));
```

**Expected output:**
```
Components capturados: 15+
Selectors: [".tab-btn", ".tab-btn.active", ".card", ".btn", ...]
```

### 4.2 Selectors Críticos

Confirme que foram capturados:

- [ ] `.tab-btn` e `.tab-btn.active`
- [ ] `.card` e `.stat-card`
- [ ] `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`
- [ ] `.modal` e `.modal-overlay`
- [ ] `table`, `th`, `td`
- [ ] `input`, `select`, `textarea`

---

## 🔍 Passo 5: Checklist de Funcionalidades

### 5.1 Master Control Panel

**Dashboard:**
- [ ] Estatísticas atualizam corretamente
- [ ] Ações rápidas funcionam
- [ ] Modals abrem/fecham
- [ ] Métricas carregam

**Backup & Restore:**
- [ ] Criar backup completo ✅
- [ ] Criar backup incremental ✅
- [ ] Criar backup seletivo ✅
- [ ] Restaurar backup (completo) ✅
- [ ] Restaurar backup (mesclar) ✅
- [ ] Restaurar backup (seletivo) ✅
- [ ] Excluir backup ✅
- [ ] Ver detalhes de backup ✅
- [ ] Exportar backup ✅

**Property Backups:**
- [ ] Criar full backup de propriedade ✅
- [ ] Criar incremental backup ✅
- [ ] Restaurar property backup ✅
- [ ] Agendar backups automáticos ✅
- [ ] Buscar backups por propriedade ✅
- [ ] Filtrar por tipo (Full/Incremental) ✅
- [ ] Excluir backup de propriedade ✅

**General Structure:**
- [ ] Criar backup de estrutura geral ✅
- [ ] Selecionar componentes específicos ✅
- [ ] Tag de versão funciona ✅
- [ ] Compressão habilitada ✅
- [ ] Criptografia habilitada ✅
- [ ] Restaurar estrutura (rollback) ✅
- [ ] Ver detalhes de backup de estrutura ✅

**Releases & Rollback:**
- [ ] Criar release ✅
- [ ] Marcar como stable/beta/alpha ✅
- [ ] Rollback para release anterior ✅
- [ ] Ver changelog ✅
- [ ] Histórico completo ✅

**Gestão de Usuários:**
- [ ] Criar usuário ✅
- [ ] Editar usuário ✅
- [ ] Excluir usuário ✅
- [ ] Suspender usuário ✅
- [ ] Ativar usuário ✅
- [ ] Ver detalhes ✅
- [ ] Associar properties (multiple select) ✅
- [ ] Filtrar por role/status ✅

**Logs & Auditoria:**
- [ ] Visualizar todos os logs ✅
- [ ] Filtrar por tipo ✅
- [ ] Filtrar por nível ✅
- [ ] Filtrar por data range ✅
- [ ] Busca de texto ✅
- [ ] Exportar logs (JSON) ✅
- [ ] Ver detalhes de log ✅

**Configurações:**
- [ ] Alterar configurações ✅
- [ ] Salvar alterações ✅
- [ ] Toggles funcionam ✅
- [ ] Reset para padrões ✅

**Manutenção:**
- [ ] Limpeza de cache ✅
- [ ] Otimizar banco ✅
- [ ] Reparar integridade ✅
- [ ] Monitor de storage ✅
- [ ] Reset sistema (com confirmação) ✅

### 5.2 Property Management

**Properties:**
- [ ] Criar propriedade ✅ (FIXED: async/await)
- [ ] Editar propriedade ✅
- [ ] Excluir propriedade ✅ (FIXED: confirmAction)
- [ ] Auto-criar admin user ✅ (FIXED: getAllUsers/createUser)
- [ ] Associar módulos ✅
- [ ] Test property ✅ (FIXED: modulesPurchased)
- [ ] Abrir index da propriedade ✅ (NEW: green button)

**Property Test Generator:**
- [ ] Gerar página de teste ✅
- [ ] Validar dados completos ✅ (FIXED: validation)
- [ ] Mostrar módulos corretos ✅ (FIXED: field name)
- [ ] Aprovar e publicar ✅
- [ ] Navegação para index ✅ (NEW: button)

### 5.3 i18n

**Internacionalização:**
- [ ] Trocar idioma (pt/en/es) ✅
- [ ] Traduções carregam ✅
- [ ] Deep merge funciona ✅
- [ ] Enterprise i18n funciona ✅
- [ ] Fallback para pt ✅

---

## 📋 Passo 6: Acceptance Criteria

### 6.1 Visual Acceptance

**Após refatoração, validar:**

- [ ] **Layout idêntico**: Nenhum elemento moveu de posição
- [ ] **Cores idênticas**: RGB values exatos (use eyedropper)
- [ ] **Fontes idênticas**: Tamanho, família, peso
- [ ] **Espaçamentos idênticos**: Padding/margin preservados
- [ ] **Bordas idênticas**: Radius, color, width
- [ ] **Sombras idênticas**: Box-shadow values
- [ ] **Transições idênticas**: Animações funcionam igual
- [ ] **Responsividade idêntica**: Breakpoints funcionam

### 6.2 Functional Acceptance

**Após refatoração, validar:**

- [ ] **Todas as funcionalidades** da checklist acima funcionam
- [ ] **Nenhum erro no console**
- [ ] **Performance** igual ou melhor (medir com DevTools)
- [ ] **LocalStorage** estrutura preservada
- [ ] **Dados não perdidos**
- [ ] **Novos bugs**: Zero

### 6.3 Data Acceptance

**Após refatoração, validar:**

- [ ] **Usuários**: Todos presentes e corretos
- [ ] **Properties**: Todas presentes com módulos corretos
- [ ] **Backups**: Todos acessíveis
- [ ] **Logs**: Histórico preservado
- [ ] **Configurações**: Settings mantidos
- [ ] **Sessões**: Login/logout funciona
- [ ] **Migrations**: Applied correctly

---

## 💾 Passo 7: Armazenar Baseline

### 7.1 Organizar Arquivos

Criar estrutura:

```
r:\Development\Projects\iluxsys\qa-baseline\
  ├── 2025-11-08\
  │   ├── reports\
  │   │   ├── qa-baseline-2025-11-08.json
  │   │   └── qa-baseline-report-2025-11-08.html
  │   ├── screenshots\
  │   │   ├── 01-dashboard-initial.png
  │   │   ├── 02-dashboard-backups-modal.png
  │   │   └── ... (todos os screenshots)
  │   ├── computed-styles\
  │   │   └── extracted-from-report.json
  │   └── acceptance-criteria\
  │       └── checklist.md (este documento)
```

### 7.2 Backup Externo

**CRÍTICO:**

- [ ] Copiar pasta `qa-baseline\` para local seguro
- [ ] Upload para cloud (Dropbox, Google Drive, etc.)
- [ ] Criar ZIP compactado
- [ ] Commit no Git (se houver repositório)

### 7.3 Documentar Versão

Criar arquivo `VERSION.txt`:

```
QA Baseline - Pre-Refactor
==========================

Date: 2025-11-08
System: IluxSys
Version: Current (before SaaS transformation)
Branch: master (if applicable)
Commit: [git hash] (if applicable)

Purpose:
--------
Golden reference for architectural refactoring from
monolithic to multi-tenant SaaS hybrid architecture.

Changes Planned:
----------------
- PropertyDatabase.js (isolated storage per property)
- Router.js (SPA routing /property/{slug})
- Shell architecture (dynamic page loading)
- Implementation Wizard
- Multi-Property Dashboard
- Sync Service
- OTA Updates

Acceptance:
-----------
After refactor, system must be:
- Visually identical
- Functionally identical
- Zero data loss
- Zero performance degradation
- Zero new bugs

Contact:
--------
[Your name/email]
```

---

## ✅ Passo 8: Checklist Final

Antes de prosseguir com refatoração:

### 8.1 Capturas Completas

- [ ] Todas as 35+ screenshots capturadas
- [ ] Estados de sucesso/erro/confirmação
- [ ] Modals em diferentes estados
- [ ] Tabs ativas/inativas

### 8.2 Relatórios Gerados

- [ ] JSON report exportado
- [ ] HTML report exportado
- [ ] Computed styles validados
- [ ] LocalStorage snapshot completo

### 8.3 Funcionalidades Validadas

- [ ] Checklist de 80+ funcionalidades completa
- [ ] Todas testadas e funcionando
- [ ] Bugs conhecidos documentados (se houver)

### 8.4 Backup Seguro

- [ ] Arquivos organizados em pasta estruturada
- [ ] Backup externo criado (cloud/zip)
- [ ] VERSION.txt documentado
- [ ] Commit no Git (se aplicável)

### 8.5 Acceptance Criteria Definido

- [ ] Critérios visuais claros
- [ ] Critérios funcionais claros
- [ ] Critérios de dados claros
- [ ] Método de comparação definido

---

## 🚀 Próximos Passos

Após completar este baseline:

1. **Revisar ARCHITECTURE_REFACTOR_PLAN.md**
2. **Decidir implementação**: Sprint 1-2 (Foundation) ou PoC
3. **Criar branch**: `feature/saas-transformation`
4. **Iniciar implementação**: PropertyDatabase.js first
5. **Validar incrementalmente**: Comparar com baseline após cada mudança

---

## 📞 Suporte

Em caso de dúvidas durante captura:

- Consultar `MASTER_CONTROL_README.md`
- Consultar `ARCHITECTURE_REFACTOR_PLAN.md`
- Revisar código em `master-control.js`

---

**✅ Este documento será atualizado conforme captura progride.**

**Última atualização:** 08/11/2025
