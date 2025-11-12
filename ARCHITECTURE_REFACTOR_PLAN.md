# ðŸ—ï¸ Plano de ReestruturaÃ§Ã£o Arquitetural - nexefii SaaS HÃ­brida

---
**ðŸ“„ Documento**: ARCHITECTURE_REFACTOR_PLAN.md  
**ðŸ“¦ VersÃ£o**: 1.0.0  
**ðŸ“… Criado em**: 08/11/2025  
**ðŸ‘¤ Autor**: nexefii Development Team  
**ðŸŽ¯ Objetivo**: Transformar sistema monolÃ­tico em arquitetura SaaS hÃ­brida/cloud-native

---

## ðŸŽ¯ VisÃ£o Geral da TransformaÃ§Ã£o

### Estado Atual (AS-IS)
- âŒ Arquivos HTML estÃ¡ticos por propriedade
- âŒ LocalStorage Ãºnico compartilhado
- âŒ Sem isolamento de dados por tenant
- âŒ Sem versionamento de schema
- âŒ Sem sincronizaÃ§Ã£o cloud
- âŒ Backups manuais sem automaÃ§Ã£o

### Estado Futuro (TO-BE)
- âœ… **Roteamento lÃ³gico** via `/property/{slug}`
- âœ… **DB/Schema isolado** por propriedade
- âœ… **Versionamento** com migrations forward/reverse
- âœ… **OTA global** com compatibility gate
- âœ… **Sync Service** hÃ­brido com delta sync
- âœ… **Backups automatizados** por propriedade
- âœ… **Shell Architecture** com loading dinÃ¢mico
- âœ… **Multi-tenant dashboard** com KPIs comparativos

---

## ðŸ“ Arquitetura Proposta

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     MASTER CONTROL PANEL                         â”‚
â”‚  (Orquestrador Central - GovernanÃ§a & AdministraÃ§Ã£o)            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â€¢ Implementation Wizard    â€¢ Sync Configuration                â”‚
â”‚  â€¢ Multi-Property Dashboard â€¢ Backups & Restore                 â”‚
â”‚  â€¢ OTA Management          â€¢ Logs & Audit                       â”‚
â”‚  â€¢ Settings & i18n         â€¢ Releases & Rollback                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    SHELL ARCHITECTURE                            â”‚
â”‚  index.html (Shell) â†’ Core Loader (Router, i18n, Auth, Tokens) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â†“
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚   Property A     â”‚   Property B     â”‚   Property C     â”‚
        â”‚  /property/miami â”‚ /property/paulo  â”‚ /property/rio    â”‚
        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
        â”‚ â€¢ Isolated DB    â”‚ â€¢ Isolated DB    â”‚ â€¢ Isolated DB    â”‚
        â”‚ â€¢ schema_v1.0.0  â”‚ â€¢ schema_v1.0.0  â”‚ â€¢ schema_v1.0.0  â”‚
        â”‚ â€¢ Admin User     â”‚ â€¢ Admin User     â”‚ â€¢ Admin User     â”‚
        â”‚ â€¢ PMS+EMS+BMS    â”‚ â€¢ PMS only       â”‚ â€¢ PMS+EMS        â”‚
        â”‚ â€¢ Auto Backups   â”‚ â€¢ Auto Backups   â”‚ â€¢ Auto Backups   â”‚
        â”‚ â€¢ Delta Sync     â”‚ â€¢ Delta Sync     â”‚ â€¢ Delta Sync     â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    SYNC SERVICE (HÃ­brido)                        â”‚
â”‚  â€¢ Delta Sync     â€¢ Conflict Resolution   â€¢ Retry Logic         â”‚
â”‚  â€¢ Queue Manager  â€¢ Status Monitor        â€¢ Error Recovery      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CLOUD BACKEND (Futuro)                        â”‚
â”‚  â€¢ REST API       â€¢ PostgreSQL Multi-tenant  â€¢ S3 Backups       â”‚
â”‚  â€¢ Auth Service   â€¢ Key Management Service   â€¢ Observability    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸŽ¯ Fase 1: Foundation & Core Refactoring

### 1.1 Database Abstraction Layer (DAL)
**Objetivo**: Criar camada de abstraÃ§Ã£o para isolar dados por propriedade

**Arquivos a criar:**
```
/core/
  database/
    PropertyDatabase.js       # Classe base para DB por propriedade
    SchemaManager.js          # Gerenciador de schemas e migrations
    MigrationRunner.js        # Executor de migrations
    QueryBuilder.js           # Builder para queries isoladas
    IndexedDBAdapter.js       # Adapter para IndexedDB (futuro)
```

**PropertyDatabase.js - Estrutura:**
```javascript
class PropertyDatabase {
  constructor(propertyKey) {
    this.propertyKey = propertyKey;
    this.prefix = `property_${propertyKey}_`;
    this.schemaVersion = null;
    this.migrations = [];
  }

  // CRUD Operations isoladas
  async set(collection, id, data) {
    const key = `${this.prefix}${collection}_${id}`;
    const record = {
      ...data,
      propertyId: this.propertyKey,
      _version: this.schemaVersion,
      _timestamp: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(record));
  }

  async get(collection, id) {
    const key = `${this.prefix}${collection}_${id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async query(collection, filter) {
    const prefix = `${this.prefix}${collection}_`;
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const data = JSON.parse(localStorage.getItem(key));
        if (!filter || filter(data)) {
          results.push(data);
        }
      }
    }
    return results;
  }

  async delete(collection, id) {
    const key = `${this.prefix}${collection}_${id}`;
    localStorage.removeItem(key);
  }

  // Schema Management
  async getCurrentVersion() {
    const versionKey = `${this.prefix}_schema_version`;
    return localStorage.getItem(versionKey) || '0.0.0';
  }

  async setVersion(version) {
    const versionKey = `${this.prefix}_schema_version`;
    localStorage.setItem(versionKey, version);
    this.schemaVersion = version;
  }

  // Migration Support
  async runMigrations(targetVersion) {
    // Implementar lÃ³gica de migrations forward/reverse
  }
}
```

### 1.2 Router & Shell System
**Objetivo**: Implementar roteamento lÃ³gico SPA

**Arquivos a criar:**
```
/core/
  router/
    Router.js                 # Router principal com history API
    RouteConfig.js            # ConfiguraÃ§Ã£o de rotas
    RouteGuards.js            # Guards de autenticaÃ§Ã£o/autorizaÃ§Ã£o
    PropertyResolver.js       # Resolve propriedade da rota
```

**Router.js - Estrutura:**
```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentProperty = null;
    this.guards = [];
    this.init();
  }

  init() {
    window.addEventListener('popstate', (e) => this.handleRoute());
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault();
        this.navigate(e.target.getAttribute('data-route'));
      }
    });
    this.handleRoute();
  }

  register(path, handler, guards = []) {
    this.routes.set(path, { handler, guards });
  }

  async navigate(path, replaceState = false) {
    if (replaceState) {
      history.replaceState({}, '', path);
    } else {
      history.pushState({}, '', path);
    }
    await this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    
    // Parse property slug: /property/{slug}/page
    const propertyMatch = path.match(/^\/property\/([^\/]+)(\/.*)?$/);
    if (propertyMatch) {
      const [, slug, subpath] = propertyMatch;
      await this.loadProperty(slug);
      return await this.loadPage(subpath || '/dashboard');
    }

    // Master Control routes
    if (path.startsWith('/master')) {
      return await this.loadMasterPage(path);
    }

    // Default route
    return await this.loadMultiPropertyDashboard();
  }

  async loadProperty(slug) {
    // Carregar contexto da propriedade
    const property = await this.resolveProperty(slug);
    if (!property) {
      return this.navigate('/404');
    }
    
    this.currentProperty = property;
    
    // Inicializar DB da propriedade
    window.propertyDB = new PropertyDatabase(property.key);
    
    // Carregar mÃ³dulos habilitados
    await this.loadPropertyModules(property.modulesPurchased);
    
    // Atualizar UI
    this.updatePropertyContext(property);
  }

  async loadPage(pagePath) {
    // Carregar pÃ¡gina dinamicamente
    const page = await this.fetchPage(pagePath);
    this.renderPage(page);
  }
}
```

### 1.3 Shell HTML
**Objetivo**: Criar shell que carrega conteÃºdo dinamicamente

**index.html - Novo:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>nexefii - Property Management System</title>
  
  <!-- Core CSS (MÃ­nimo) -->
  <link rel="stylesheet" href="/core/styles/shell.css">
  <link rel="stylesheet" href="/core/styles/variables.css">
  
  <!-- Core Scripts -->
  <script src="/core/database/PropertyDatabase.js" defer></script>
  <script src="/core/router/Router.js" defer></script>
  <script src="/core/auth/AuthService.js" defer></script>
  <script src="/core/i18n/I18nService.js" defer></script>
  <script src="/core/loader/PageLoader.js" defer></script>
  <script src="/core/init.js" defer></script>
</head>
<body>
  <!-- Loading Screen -->
  <div id="app-loader" class="loader-overlay">
    <div class="loader-spinner"></div>
    <p>Carregando nexefii...</p>
  </div>

  <!-- Shell Container -->
  <div id="app-shell" style="display: none;">
    <!-- Top Bar (Sempre visÃ­vel) -->
    <header id="app-header">
      <!-- Renderizado dinamicamente -->
    </header>

    <!-- Content Area (DinÃ¢mico) -->
    <main id="app-content">
      <!-- PÃ¡ginas carregadas aqui -->
    </main>

    <!-- Toasts/Notifications -->
    <div id="app-toasts"></div>

    <!-- Modals Container -->
    <div id="app-modals"></div>
  </div>

  <!-- Error Screen -->
  <div id="app-error" style="display: none;">
    <h1>âš ï¸ Erro ao Carregar</h1>
    <p id="error-message"></p>
    <button onclick="location.reload()">Recarregar</button>
  </div>
</body>
</html>
```

---

## ðŸŽ¯ Fase 2: Implementation Wizard

### 2.1 Wizard de CriaÃ§Ã£o de Propriedade
**Objetivo**: Interface guiada para provisionamento completo

**Arquivos a criar:**
```
/master/
  implementation/
    ImplementationWizard.js   # Controller do wizard
    WizardSteps.js            # DefiniÃ§Ã£o dos passos
    PropertyProvisioner.js    # LÃ³gica de provisioning
    ModuleSelector.js         # Seletor de mÃ³dulos
    AdminCreator.js           # CriaÃ§Ã£o de admin local
```

**WizardSteps.js - Passos:**
```javascript
const WIZARD_STEPS = [
  {
    id: 'property-info',
    title: 'InformaÃ§Ãµes da Propriedade',
    fields: [
      { name: 'key', label: 'Property ID', type: 'text', required: true },
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'slug', label: 'URL Slug', type: 'text', required: true },
      { name: 'category', label: 'Categoria', type: 'select', options: ['hotel', 'resort', 'hostel'] }
    ]
  },
  {
    id: 'modules',
    title: 'SeleÃ§Ã£o de MÃ³dulos',
    description: 'Escolha os mÃ³dulos que serÃ£o habilitados',
    modules: [
      { id: 'pms', name: 'PMS', description: 'Property Management System', required: true },
      { id: 'ems', name: 'EMS', description: 'Engineering Management System' },
      { id: 'bms', name: 'BMS', description: 'Building Management System' }
    ]
  },
  {
    id: 'admin-user',
    title: 'Administrador Local',
    fields: [
      { name: 'adminName', label: 'Nome Completo', type: 'text', required: true },
      { name: 'adminEmail', label: 'E-mail', type: 'email', required: true },
      { name: 'adminUsername', label: 'Username', type: 'text', default: 'admin' },
      { name: 'adminPassword', label: 'Senha', type: 'password', required: true }
    ]
  },
  {
    id: 'backup-config',
    title: 'ConfiguraÃ§Ã£o de Backups',
    fields: [
      { name: 'autoBackup', label: 'Backup AutomÃ¡tico', type: 'checkbox', default: true },
      { name: 'backupFrequency', label: 'FrequÃªncia', type: 'select', options: ['daily', 'weekly'] },
      { name: 'retentionDays', label: 'RetenÃ§Ã£o (dias)', type: 'number', default: 30 }
    ]
  },
  {
    id: 'ota-config',
    title: 'Canal de AtualizaÃ§Ã£o',
    fields: [
      { name: 'otaChannel', label: 'Canal OTA', type: 'select', options: ['stable', 'beta', 'alpha'] },
      { name: 'autoUpdate', label: 'Auto-Update', type: 'checkbox', default: true }
    ]
  },
  {
    id: 'review',
    title: 'RevisÃ£o Final',
    type: 'summary'
  }
];
```

**PropertyProvisioner.js - LÃ³gica:**
```javascript
class PropertyProvisioner {
  async provision(wizardData) {
    const steps = [
      () => this.createProperty(wizardData),
      () => this.provisionDatabase(wizardData.key),
      () => this.runMigrations(wizardData.key),
      () => this.createAdminUser(wizardData),
      () => this.activateModules(wizardData.key, wizardData.modules),
      () => this.configureBackups(wizardData.key, wizardData.backupConfig),
      () => this.registerOTA(wizardData.key, wizardData.otaChannel),
      () => this.auditLog(wizardData)
    ];

    for (let i = 0; i < steps.length; i++) {
      const stepName = steps[i].name;
      try {
        await steps[i]();
        this.updateProgress(i + 1, steps.length, `âœ… ${stepName}`);
      } catch (error) {
        this.updateProgress(i + 1, steps.length, `âŒ ${stepName}: ${error.message}`);
        throw new Error(`Provisioning failed at step: ${stepName}`);
      }
    }

    return {
      success: true,
      propertyKey: wizardData.key,
      slug: wizardData.slug,
      adminCredentials: {
        username: wizardData.adminUsername,
        password: wizardData.adminPassword // Exibir uma Ãºnica vez!
      }
    };
  }

  async createProperty(data) {
    const property = {
      key: data.key,
      name: data.name,
      slug: data.slug,
      category: data.category,
      modulesPurchased: data.modules,
      created: new Date().toISOString(),
      status: 'provisioning'
    };

    await window.NexefiiProps.upsertProperty(property);
  }

  async provisionDatabase(propertyKey) {
    const db = new PropertyDatabase(propertyKey);
    await db.initialize();
    await db.setVersion('1.0.0');
  }

  async runMigrations(propertyKey) {
    const db = new PropertyDatabase(propertyKey);
    const schemaManager = new SchemaManager(db);
    await schemaManager.runMigrations('1.0.0');
  }

  async createAdminUser(data) {
    const db = new PropertyDatabase(data.key);
    const user = {
      id: 'user_' + Date.now(),
      username: data.adminUsername,
      password: this.hashPassword(data.adminPassword),
      name: data.adminName,
      email: data.adminEmail,
      role: 'admin',
      properties: [data.key],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await db.set('users', user.id, user);
  }

  async activateModules(propertyKey, modules) {
    for (const moduleId of modules) {
      await this.loadModuleManifest(propertyKey, moduleId);
    }
  }
}
```

---

## ðŸŽ¯ Fase 3: Multi-Property Dashboard

### 3.1 Dashboard com KPIs
**Objetivo**: VisÃ£o consolidada de todas as propriedades

**Arquivos a criar:**
```
/master/
  dashboard/
    MultiPropertyDashboard.js
    KPICalculator.js
    PropertyCard.js
    ComparisonChart.js
```

**MultiPropertyDashboard.js:**
```javascript
class MultiPropertyDashboard {
  async render() {
    const properties = await this.loadAllProperties();
    const kpis = await this.calculateKPIs(properties);

    return `
      <div class="multi-property-dashboard">
        <header>
          <h1>ðŸ¨ Multi-Property Dashboard</h1>
          <div class="summary-cards">
            <div class="summary-card">
              <h3>Total de Propriedades</h3>
              <p class="metric">${properties.length}</p>
            </div>
            <div class="summary-card">
              <h3>OcupaÃ§Ã£o MÃ©dia</h3>
              <p class="metric">${kpis.averageOccupancy}%</p>
            </div>
            <div class="summary-card">
              <h3>ADR MÃ©dio</h3>
              <p class="metric">R$ ${kpis.averageADR}</p>
            </div>
          </div>
        </header>

        <div class="properties-grid">
          ${properties.map(p => this.renderPropertyCard(p, kpis[p.key])).join('')}
        </div>
      </div>
    `;
  }

  renderPropertyCard(property, kpi) {
    return `
      <div class="property-card">
        <h3>${property.name}</h3>
        <div class="kpi-row">
          <span>Vendidos:</span>
          <strong>${kpi.roomsSold}/${kpi.totalRooms}</strong>
        </div>
        <div class="kpi-row">
          <span>OcupaÃ§Ã£o:</span>
          <strong>${kpi.occupancy}%</strong>
        </div>
        <div class="kpi-row">
          <span>ADR:</span>
          <strong>R$ ${kpi.adr}</strong>
        </div>
        <button 
          data-route="/property/${property.slug}" 
          class="btn btn-primary">
          Abrir Controle
        </button>
      </div>
    `;
  }

  async calculateKPIs(properties) {
    const kpis = {};
    for (const property of properties) {
      const db = new PropertyDatabase(property.key);
      const reservations = await db.query('reservations', r => r.status === 'confirmed');
      const inventory = await db.query('inventory');

      kpis[property.key] = {
        totalRooms: inventory.length,
        roomsSold: reservations.length,
        occupancy: (reservations.length / inventory.length * 100).toFixed(1),
        adr: this.calculateADR(reservations)
      };
    }
    return kpis;
  }
}
```

---

## ðŸŽ¯ Fase 4: Sync Service (HÃ­brido)

### 4.1 Sync Configuration Page
**Arquivos a criar:**
```
/master/
  sync/
    SyncConfigPage.js
    SyncService.js
    ConflictResolver.js
    SyncQueue.js
    SyncMonitor.js
```

**SyncService.js - Estrutura:**
```javascript
class SyncService {
  constructor() {
    this.queue = new SyncQueue();
    this.config = this.loadConfig();
    this.isRunning = false;
  }

  async sync(propertyKey) {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Delta sync
      const delta = await this.calculateDelta(propertyKey);
      await this.pushDelta(propertyKey, delta);
      await this.pullChanges(propertyKey);
      
      this.logSuccess(propertyKey, delta);
    } catch (error) {
      this.logError(propertyKey, error);
      await this.queue.retry(propertyKey);
    } finally {
      this.isRunning = false;
    }
  }

  async calculateDelta(propertyKey) {
    const db = new PropertyDatabase(propertyKey);
    const lastSync = await this.getLastSyncTimestamp(propertyKey);
    
    const changes = await db.query('*', record => 
      new Date(record._timestamp) > new Date(lastSync)
    );

    return {
      timestamp: new Date().toISOString(),
      changes: changes,
      count: changes.length
    };
  }

  async resolveConflict(local, remote) {
    const policy = this.config.conflictPolicy;
    
    switch (policy) {
      case 'cloud_wins':
        return remote;
      case 'last_write_wins':
        return new Date(local._timestamp) > new Date(remote._timestamp) ? local : remote;
      case 'merge':
        return this.mergeRecords(local, remote);
      default:
        throw new Error('Invalid conflict policy');
    }
  }
}
```

---

## ðŸŽ¯ Fase 5: OTA Management

### 5.1 Over-The-Air Updates
**Arquivos a criar:**
```
/master/
  ota/
    OTAManager.js
    CompatibilityChecker.js
    RollbackService.js
    UpdateChannel.js
```

**OTAManager.js:**
```javascript
class OTAManager {
  async checkForUpdates(propertyKey) {
    const currentVersion = await this.getCurrentVersion(propertyKey);
    const latestVersion = await this.fetchLatestVersion();
    
    if (this.compareVersions(latestVersion, currentVersion) > 0) {
      const compatible = await this.checkCompatibility(propertyKey, latestVersion);
      
      if (compatible) {
        return {
          available: true,
          version: latestVersion,
          changes: await this.fetchChangelog(latestVersion)
        };
      } else {
        return {
          available: false,
          reason: 'incompatible',
          requiredMigrations: await this.getRequiredMigrations(currentVersion, latestVersion)
        };
      }
    }
    
    return { available: false };
  }

  async applyUpdate(propertyKey, version) {
    // Criar backup de seguranÃ§a
    await this.createRollbackPoint(propertyKey);
    
    try {
      // Aplicar migrations
      await this.runMigrations(propertyKey, version);
      
      // Atualizar cÃ³digo
      await this.updateCode(propertyKey, version);
      
      // Verificar integridade
      await this.verifyIntegrity(propertyKey);
      
      // Atualizar versÃ£o
      await this.setVersion(propertyKey, version);
      
      return { success: true };
    } catch (error) {
      // Rollback automÃ¡tico
      await this.rollback(propertyKey);
      throw error;
    }
  }
}
```

---

## ðŸŽ¯ Fase 6: Observability

### 6.1 Logs, MÃ©tricas e Alertas
**Arquivos a criar:**
```
/core/
  observability/
    Logger.js
    MetricsCollector.js
    AlertManager.js
    TraceService.js
```

**MetricsCollector.js:**
```javascript
class MetricsCollector {
  collect(metric) {
    const metrics = {
      // Performance
      'page.load.time': () => performance.now(),
      'api.response.time': (endpoint) => this.measureAPITime(endpoint),
      
      // Business
      'sync.delta.size': (propertyKey) => this.getSyncDeltaSize(propertyKey),
      'backup.success.rate': () => this.getBackupSuccessRate(),
      
      // Resources
      'storage.usage': () => this.getStorageUsage(),
      'memory.usage': () => performance.memory?.usedJSHeapSize || 0
    };

    return metrics[metric]?.() || null;
  }

  alert(condition, message) {
    if (condition) {
      window.alertManager.trigger({
        level: 'warning',
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

---

## ðŸ“‹ Cronograma de ImplementaÃ§Ã£o

### Sprint 1 (Semana 1-2): Foundation
- âœ… PropertyDatabase.js
- âœ… SchemaManager.js
- âœ… Router.js
- âœ… Shell HTML/CSS
- âœ… QA Baseline (screenshots + computed CSS)

### Sprint 2 (Semana 3-4): Implementation Wizard
- âœ… ImplementationWizard.js
- âœ… PropertyProvisioner.js
- âœ… AdminCreator.js
- âœ… QA Wizard completo

### Sprint 3 (Semana 5-6): Multi-Property Dashboard
- âœ… MultiPropertyDashboard.js
- âœ… KPICalculator.js
- âœ… PropertyCard.js
- âœ… QA Dashboard + navegaÃ§Ã£o

### Sprint 4 (Semana 7-8): Sync Service
- âœ… SyncService.js
- âœ… SyncConfigPage.js
- âœ… ConflictResolver.js
- âœ… QA Sync completo

### Sprint 5 (Semana 9-10): OTA & Rollback
- âœ… OTAManager.js
- âœ… CompatibilityChecker.js
- âœ… RollbackService.js
- âœ… QA Updates + rollback

### Sprint 6 (Semana 11-12): Observability & Polish âœ… CONCLUÃDA
- âœ… Logger.js (nÃ­veis, categorias, export, persistÃªncia)
- âœ… MetricsCollector.js (performance, recursos, anÃ¡lise P95/P99)
- âœ… AlertManager.js (regras, handlers, cooldown, acknowledge)
- âœ… observability.html (dashboard interativo)
- âœ… QA Final + Performance (7/7 PASS, overhead <100ms)

---

## âœ… CritÃ©rios de Aceite (Checklist)

### Foundation
- [ ] PropertyDatabase isola dados corretamente por tenant
- [ ] Router navega via /property/{slug} sem reload
- [ ] Shell carrega pÃ¡ginas dinamicamente
- [ ] Visual/funcional idÃªntico ao baseline (QA aprovado)

### Implementation Wizard
- [ ] Wizard cria propriedade com DB isolado
- [ ] schema_version definido corretamente
- [ ] Admin local criado e funcional
- [ ] MÃ³dulos ativados conforme seleÃ§Ã£o
- [ ] Backups agendados automaticamente
- [ ] Auditoria registrada

### Multi-Property Dashboard
- [ ] Lista todas as propriedades
- [ ] Exibe KPIs (vendidos/disponÃ­veis/ocupaÃ§Ã£o/ADR)
- [ ] BotÃ£o "Abrir controle" navega para /property/{slug}
- [ ] Performance aceitÃ¡vel (FCP < 2s)

### Sync Service
- [ ] Sync Config Page funcional
- [ ] Delta sync calcula mudanÃ§as corretamente
- [ ] PolÃ­tica de conflito aplicada
- [ ] Logs e status visÃ­veis
- [ ] Retry automÃ¡tico em falhas

### OTA
- [ ] Verifica compatibilidade antes de atualizar
- [ ] Rollback disponÃ­vel e funcional
- [ ] Migrations executadas corretamente
- [ ] Integridade verificada pÃ³s-update

### Observability
- [ ] Logs estruturados e consultÃ¡veis
- [ ] MÃ©tricas coletadas (performance, business)
- [ ] Alertas disparados em falhas
- [ ] Dashboard de monitoramento

### QA Final
- [ ] Todos os screenshots baseline vs pÃ³s-refactor idÃªnticos
- [ ] Computed CSS mantido
- [ ] NavegaÃ§Ã£o funcional em todos os fluxos
- [ ] i18n funcionando (pt/en/es)
- [ ] Modais e interaÃ§Ãµes preservadas
- [ ] FCP < 2s, peso CSS/JS nÃ£o aumentou significativamente

---

## ðŸš€ PrÃ³ximos Passos Imediatos

1. **Criar branch de refactor**: `git checkout -b feature/saas-architecture-refactor`
2. **QA Baseline**: Capturar screenshots e computed CSS do estado atual
3. **Implementar PropertyDatabase.js**: Primeira classe da camada DAL
4. **Implementar Router.js**: Sistema de roteamento SPA
5. **Criar shell index.html**: Nova estrutura de carregamento

---

**ðŸ“Œ Importante**: Esta transformaÃ§Ã£o Ã© **nÃ£o-regressiva**. Qualquer quebra visual ou funcional nÃ£o planejada **bloqueia a entrega** atÃ© correÃ§Ã£o.


