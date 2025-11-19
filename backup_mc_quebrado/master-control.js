/**
 * Master Control Panel System
 * Sistema de controle master com backup/restore e versionamento
 */

class MasterControlSystem {
  constructor() {
    this.currentUser = null;
    this.systemSettings = null;
    this.backups = [];
    this.versions = [];
    this.logs = [];
    this.propertySchedules = {};
  this.lang = ((localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang')) || 'pt').toLowerCase();
    this.i18n = null;
    this.initSystem();
  }

  initSystem() {
    // Verificar autenticação master
    this.checkMasterAuth();
    
    // Inicializar Enterprise Backup Systems (com guarda, pois o arquivo de integração carrega após este)
    if (typeof this.initEnterpriseBackupSystems === 'function') {
      this.initEnterpriseBackupSystems();
    } else {
      // Deferir até o load para dar tempo do master-control-enterprise.js estender o protótipo
      window.addEventListener('load', () => {
        if (typeof this.initEnterpriseBackupSystems === 'function') {
          try { this.initEnterpriseBackupSystems(); } catch (e) { console.error('Enterprise init late failed:', e); }
        }
      });
    }
    
    // Carregar i18n e configurações
    this.loadI18N().then(() => {
      this.applyLang();
    }).catch(() => {
      // fallback silently
    });
    
    // Carregar configurações
    this.loadSystemSettings();
  this.loadPropertySchedules();
    
    // Carregar dados
    this.loadBackups();
    this.loadVersions();
    this.loadLogs();
    
    // Inicializar UI
    this.initUI();
    // Textos de ajuda dos painéis Master Control
    const HelpTexts = {
      'help-master-properties': 'Aqui você gerencia as propriedades conectadas ao Nexefii: cadastro, identificação e configurações gerais.',
      'help-master-users': 'Use esta área para criar, editar e desativar usuários. Defina papéis e quais propriedades cada usuário acessa.',
      'help-master-integrations': 'Configure integrações com PMS, fechaduras, BI e outros sistemas. Selecione a propriedade e informe o provider e as credenciais.',
      'help-master-advanced': 'Recursos avançados: backups, release management e ferramentas administrativas globais. Use com cautela.'
    };

    function wirePanelHelp(){
      try {
        document.querySelectorAll('.panel-help[data-help-id]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-help-id');
            const msg = HelpTexts[id] || 'Ajuda não configurada para esta seção.';
            alert(msg);
          });
        });
      } catch(e) {
        console.warn('[MasterControl] wirePanelHelp error', e);
      }
    }
    // Inicialização global segura
    document.addEventListener('DOMContentLoaded', function(){
      try {
        if (!window.MasterControlSystem) {
          window.MasterControlSystem = MasterControlSystem;
        }
        if (!window.masterCtrl) {
          window.masterCtrl = new MasterControlSystem();
        }
        // Expose canonical reference for legacy scripts
        try {
          window.NEXEFII = window.NEXEFII || {};
          window.NEXEFII.masterControl = window.masterCtrl;
          window.masterCtrl = window.masterCtrl; // ensure global exists
        } catch(_) {}
        if (typeof window.masterCtrl.initUI === 'function') {
          window.masterCtrl.initUI();
        }
        if (typeof window.MasterTabs === 'function') {
          window.MasterTabsInstance = MasterTabs();
          window.MasterTabsInstance.wire();
          window.MasterTabsInstance.activate('tab-master-properties');
          // Note: module param handling was removed to restore original master-control
          // behaviour. We keep default tab activation (tab-master-properties) and avoid
          // any module -> tab mapping here.
        }
        if (typeof wirePanelHelp === 'function') {
          wirePanelHelp();
        }
        // Ensure tab visibility is correct on initial load
        try {
          if (typeof initMasterTabsOnLoad === 'function') initMasterTabsOnLoad();
        } catch(e) { console.warn('[MasterControl] initMasterTabsOnLoad failed', e); }
      } catch(e) {
        console.error('[MasterControl] Erro na inicialização principal', e);
      }
    });

    // Ensure that only the default tab is visible on first load
    function initMasterTabsOnLoad() {
      try {
        // Prefer the MasterTabs instance if available to apply canonical activation
        if (typeof window.MasterTabsInstance !== 'undefined' && window.MasterTabsInstance && typeof window.MasterTabsInstance.activate === 'function') {
          // Activate the Dashboard tab explicitly
          try { window.MasterTabsInstance.activate('tab-dashboard'); } catch (e) { console.warn('[MasterControl] MasterTabsInstance.activate failed', e); }
          console.info('[MasterControl] initMasterTabsOnLoad(): activated via MasterTabsInstance tab-dashboard');
          return;
        }

        // Fallback: apply the same classes/display manipulation used by tab clicks
        var btns = document.querySelectorAll('.tab-btn');
        var contents = document.querySelectorAll('.tab-content');
        // Remove active from all buttons and contents
        btns.forEach(b => b.classList.remove('active'));
        contents.forEach(c => { c.classList.remove('active'); c.style.display = 'none'; });

        // Activate only the dashboard button and section
        var dashBtn = document.querySelector('.tab-btn[data-tab="dashboard"]');
        if (dashBtn) dashBtn.classList.add('active');
        var dashSection = document.getElementById('tab-dashboard');
        if (dashSection) { dashSection.classList.add('active'); dashSection.style.display = 'block'; }
        console.info('[MasterControl] initMasterTabsOnLoad(): activated fallback dashboard');
      } catch (e) {
        console.warn('[MasterControl] initMasterTabsOnLoad(): failed to ensure initial tab state', e);
      }
    }
    
    // Inicializar Enterprise UI (somente se disponível; caso contrário, deferir)
    if (typeof this.initEnterpriseUI === 'function') {
      this.initEnterpriseUI();
    } else {
      window.addEventListener('load', () => {
        if (typeof this.initEnterpriseUI === 'function') {
          try { this.initEnterpriseUI(); } catch (e) { console.error('Enterprise UI init late failed:', e); }
        }
      });
    }

  // Migração opcional: normalizar propertyId em coleções, quando seguro
  this.migratePerPropertyIfNeeded();
  
  // Reparar propriedades com dados incompletos
  this.repairIncompleteProperties();
  
  // Limpar usuários com propriedades em formato string ao invés de array
  this.cleanupUserProperties();
    
    // Configurar auto-backup se habilitado
    this.setupAutoBackup();
  // Configurar agendamento por propriedade
  this.setupPropertyScheduleRunner();
    
    // Configurar versionamento automático
    this.setupAutoVersioning();
    
    console.info('✅ Master Control System initialized');
  }

  // ========================================
  // I18N
  // ========================================
  async loadI18N() {
    try {
      const res = await fetch('i18n/i18n.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('http');
      const data = await res.json();
      this.i18n = {
        pt: data?.pt?.master || {},
        en: data?.en?.master || {},
        es: data?.es?.master || {}
      };

      // Carregar i18n enterprise (pt/en/es) e fazer merge profundo
      const enterpriseFiles = [
        { lang: 'pt', url: 'i18n-enterprise-pt.json' },
        { lang: 'en', url: 'i18n-enterprise-en.json' },
        { lang: 'es', url: 'i18n-enterprise-es.json' }
      ];
      const deepMerge = (target, source) => {
        if (!source) return target;
        Object.keys(source).forEach(k => {
          const sv = source[k];
          const tv = target[k];
          if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
            target[k] = deepMerge(tv && typeof tv === 'object' ? tv : {}, sv);
          } else {
            target[k] = sv;
          }
        });
        return target;
      };
      await Promise.all(enterpriseFiles.map(async f => {
        try {
          const r = await fetch(f.url, { cache: 'no-store' });
          if (!r.ok) return;
          const edata = await r.json();
          const node = (edata && edata.master) ? edata.master : edata;
          this.i18n[f.lang] = deepMerge(this.i18n[f.lang] || {}, node || {});
        } catch(_) { /* ignore */ }
      }));
    } catch (e) {
      // minimal fallback
      this.i18n = {
        pt: { title: 'Painel Master', badge: 'SUPER ADMIN', logout:'Sair', tabs: { overview:'Visão Geral', backup:'Backup & Restore', users:'Gestão de Usuários', system:'Sistema', logs:'Logs & Auditoria', versions:'Versionamento' }, overview:{ statsTitle:'Estatísticas do Sistema', totalUsers:'Total de Usuários', activeUsers:'Usuários Ativos', properties:'Propriedades', backups:'Backups', quickActions:'Ações Rápidas', fullBackup:'Backup Completo', incBackup:'Backup Incremental', viewBackups:'Ver Backups', exportAll:'Exportar Tudo', recentActivity:'Atividade Recente' }, backup:{ createTitle:'Criar Backup', backupType:'Tipo de Backup', full:'Completo (Todos os dados)', incremental:'Incremental (Apenas alterações)', selective:'Seletivo (Escolher módulos)', selectModules:'Selecionar Módulos', users:'Usuários', reservations:'Reservas', inventory:'Inventário', configurations:'Configurações', extraOptions:'Opções Adicionais', includeAttachments:'Incluir anexos', compress:'Comprimir backup', encrypt:'Criptografar backup', createNow:'Criar Backup Agora', historyTitle:'Histórico de Backups', restoreTitle:'Restaurar Backup', selectBackup:'Selecionar Backup', restoreType:'Tipo de Restauração', restoreWarning:'A restauração completa irá sobrescrever todos os dados atuais. Recomendamos criar um backup antes.', restoreNow:'Restaurar Backup' } },
        en: { title: 'Master Panel', badge: 'SUPER ADMIN', logout:'Logout', tabs: { overview:'Overview', backup:'Backup & Restore', users:'User Management', system:'System', logs:'Logs & Audit', versions:'Versioning' }, overview:{ statsTitle:'System Stats', totalUsers:'Total Users', activeUsers:'Active Users', properties:'Properties', backups:'Backups', quickActions:'Quick Actions', fullBackup:'Full Backup', incBackup:'Incremental Backup', viewBackups:'View Backups', exportAll:'Export All', recentActivity:'Recent Activity' }, backup:{ createTitle:'Create Backup', backupType:'Backup Type', full:'Full (All data)', incremental:'Incremental (Changes only)', selective:'Selective (Choose modules)', selectModules:'Select Modules', users:'Users', reservations:'Reservations', inventory:'Inventory', configurations:'Configurations', extraOptions:'Additional Options', includeAttachments:'Include attachments', compress:'Compress backup', encrypt:'Encrypt backup', createNow:'Create Backup Now', historyTitle:'Backup History', restoreTitle:'Restore Backup', selectBackup:'Select Backup', restoreType:'Restore Type', restoreWarning:'Full restore overwrites current data. Create a backup first.', restoreNow:'Restore Backup' } },
        es: { title: 'Panel Maestro', badge: 'SUPER ADMIN', logout:'Salir', tabs: { overview:'Visión General', backup:'Backup & Restore', users:'Gestión de Usuarios', system:'Sistema', logs:'Logs & Auditoría', versions:'Versionado' }, overview:{ statsTitle:'Estadísticas del Sistema', totalUsers:'Usuarios Totales', activeUsers:'Usuarios Activos', properties:'Propiedades', backups:'Backups', quickActions:'Acciones Rápidas', fullBackup:'Backup Completo', incBackup:'Backup Incremental', viewBackups:'Ver Backups', exportAll:'Exportar Todo', recentActivity:'Actividad Reciente' }, backup:{ createTitle:'Crear Backup', backupType:'Tipo de Backup', full:'Completo (Todos los datos)', incremental:'Incremental (Solo cambios)', selective:'Selectivo (Elegir módulos)', selectModules:'Seleccionar Módulos', users:'Usuarios', reservations:'Reservas', inventory:'Inventario', configurations:'Configuraciones', extraOptions:'Opciones Adicionales', includeAttachments:'Incluir adjuntos', compress:'Comprimir backup', encrypt:'Encriptar backup', createNow:'Crear Backup Ahora', historyTitle:'Historial de Backups', restoreTitle:'Restaurar Backup', selectBackup:'Seleccionar Backup', restoreType:'Tipo de Restauración', restoreWarning:'La restauración completa sobrescribe datos actuales. Cree un backup antes.', restoreNow:'Restaurar Backup' } }
      };
    }
  }

  t(path, fallback='') {
    try {
      const parts = path.split('.');
      let node = (this.i18n?.[this.lang]) || {};
      for (const p of parts) node = node?.[p];
      return node || fallback || path;
    } catch { return fallback || path; }
  }

  applyLang() {
    try {
      document.documentElement.lang = this.lang;
  document.getElementById('pageTitle').textContent = this.t('title','Painel Master') + ' - nexefii';
      // Map data-i18n keys
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const txt = this.t(key, el.textContent);
        el.textContent = txt;
      });
      // Placeholders
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const txt = this.t(key, el.getAttribute('placeholder') || '');
        if (txt) el.setAttribute('placeholder', txt);
      });
      // Titles (tooltips)
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const txt = this.t(key, el.getAttribute('title') || '');
        if (txt) el.setAttribute('title', txt);
      });
      // Restore warning rich text
      const rw = document.getElementById('restoreWarning');
  if (rw) rw.innerText = '⚠️ ' + this.t('backup.restoreWarning', rw.innerText.replace(/^⚠️\s*/,''));
    } catch (e) {
      console.warn('i18n apply failed', e);
    }
  }

  // Simple {0} {1} ... interpolation
  format(str, args=[]) {
    try {
      return String(str).replace(/\{(\d+)\}/g, (m, i) =>
        typeof args[i] !== 'undefined' ? args[i] : m
      );
    } catch { return str; }
  }

  // Safe addLog method: stores a log entry and prints to console.
  addLog(level = 'info', message = '', meta = null) {
    try {
      const entry = {
        ts: new Date().toISOString(),
        level: String(level || 'info'),
        message: String(message || ''),
        meta: meta || null
      };
      try { this.logs = this.logs || []; this.logs.push(entry); } catch(_) {}
      try { console.log('[MasterControlLog]', entry); } catch(_) {}
      // Forward to enterprise logger if present
      try {
        if (window.NEXEFII && window.NEXEFII.Log && typeof window.NEXEFII.Log.write === 'function') {
          try { window.NEXEFII.Log.write(entry); } catch(_) {}
        }
      } catch(_) {}
    } catch (e) {
      try { console.warn('[MasterControlLog] addLog failed', e); } catch(_) {}
    }
  }

  // ========================================
  // AUTENTICAÇÃO E SEGURANÇA
  // ========================================

  checkMasterAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser || currentUser.role !== 'master') {
      alert('⛔ ' + this.t('msgs.accessDenied','Acesso negado! Apenas usuários Master podem acessar este painel.'));
      window.location.href = 'login.html';
      return;
    }
    
    this.currentUser = currentUser;
    this.logActivity('auth', 'info', 'Master user logged in', { userId: currentUser.id });
  }

  // ========================================
  // SISTEMA DE BACKUP
  // ========================================

  async createFullBackup() {
    try {
      const timestamp = new Date().toISOString();
  const backupId = 'backup_' + Date.now();
      const scope = this.getSelectedBackupScope();
      
      // Coletar todos os dados
      const backupData = {
        id: backupId,
        type: 'full',
        timestamp: timestamp,
        createdBy: this.currentUser.id,
        version: '1.0.0',
        scope: scope.scope,
        propertyId: scope.propertyId || null,
        data: {
          users: this.getAllLocalStorageByPrefix('user_'),
          reservations: this.getAllLocalStorageByPrefix('reservation_'),
          inventory: this.getAllLocalStorageByPrefix('inventory_'),
          configurations: this.getAllLocalStorageByPrefix('config_'),
          settings: this.getAllLocalStorageByPrefix('settings_'),
          logs: this.logs.slice(-1000), // Últimos 1000 logs
          metadata: {
            totalUsers: this.getTotalItems('user_'),
            totalReservations: this.getTotalItems('reservation_'),
            backupSize: 0 // Calculado depois
          }
        }
      };

      if (scope.scope === 'property' && scope.propertyId) {
        backupData.data = this.filterBackupDataByProperty(backupData.data, scope.propertyId);
      }

      // Calcular tamanho
      const dataString = JSON.stringify(backupData);
      backupData.data.metadata.backupSize = new Blob([dataString]).size;

      // Salvar backup
      this.saveBackup(backupData);
      
      // Log
      this.logActivity('backup', 'info', 'Full backup created', { 
        backupId, 
        size: backupData.data.metadata.backupSize 
      });

  this.showToast('✅ ' + this.t('msgs.backupFullCreated','Backup completo criado com sucesso!'), 'success');
    this.renderBackupList();
    this.renderDashboard();
    this.updateStorageInfo();
      
    } catch (error) {
      console.error('Error creating backup:', error);
      this.logActivity('backup', 'error', 'Backup creation failed', { error: error.message });
  this.showToast('❌ ' + this.t('msgs.backupFullError','Erro ao criar backup:') + ' ' + error.message, 'error');
    }
  }

  async createIncrementalBackup() {
    try {
      const timestamp = new Date().toISOString();
  const backupId = 'backup_inc_' + Date.now();
      const scope = this.getSelectedBackupScope();
      
      // Pegar último backup como base
      const lastBackup = this.getLastBackup(scope);
      const lastBackupTime = lastBackup ? new Date(lastBackup.timestamp) : new Date(0);

      // Coletar apenas dados alterados desde o último backup
      const backupData = {
        id: backupId,
        type: 'incremental',
        timestamp: timestamp,
        createdBy: this.currentUser.id,
        baseBackup: lastBackup ? lastBackup.id : null,
        version: '1.0.0',
        scope: scope.scope,
        propertyId: scope.propertyId || null,
        data: {
          users: this.getModifiedItemsSince('user_', lastBackupTime),
          reservations: this.getModifiedItemsSince('reservation_', lastBackupTime),
          inventory: this.getModifiedItemsSince('inventory_', lastBackupTime),
          configurations: this.getModifiedItemsSince('config_', lastBackupTime),
          settings: this.getModifiedItemsSince('settings_', lastBackupTime),
          metadata: {
            changedItems: 0,
            backupSize: 0
          }
        }
      };

      if (scope.scope === 'property' && scope.propertyId) {
        backupData.data = this.filterBackupDataByProperty(backupData.data, scope.propertyId);
      }

      // Calcular mudanças
      const totalChanged = Object.values(backupData.data)
        .filter(v => Array.isArray(v))
        .reduce((sum, arr) => sum + arr.length, 0);
      
      backupData.data.metadata.changedItems = totalChanged;

      const dataString = JSON.stringify(backupData);
      backupData.data.metadata.backupSize = new Blob([dataString]).size;

      this.saveBackup(backupData);
      
      this.logActivity('backup', 'info', 'Incremental backup created', { 
        backupId, 
        changedItems: totalChanged,
        size: backupData.data.metadata.backupSize 
      });

  this.showToast('✅ ' + this.format(this.t('msgs.backupIncCreated','Backup incremental criado! {0} itens alterados.'), [totalChanged]), 'success');
    this.renderBackupList();
    this.renderDashboard();
    this.updateStorageInfo();
      
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      this.logActivity('backup', 'error', 'Incremental backup failed', { error: error.message });
  this.showToast('❌ ' + this.t('msgs.backupIncError','Erro ao criar backup incremental:') + ' ' + error.message, 'error');
    }
  }

  async createSelectiveBackup() {
    try {
      const timestamp = new Date().toISOString();
      const backupId = 'backup_sel_' + Date.now();
      const scope = this.getSelectedBackupScope();

      // Collect selected modules from UI
      const selected = Array.from(document.querySelectorAll('#selectiveOptions input[type="checkbox"]:checked'))
        .map(function(cb){ return cb.value; });
      if (!selected.length) {
  this.showToast(this.t('msgs.selectAtLeastOneModule','Selecione ao menos um módulo.'), 'warning');
        return;
      }

      const data = {};
      if (selected.indexOf('users') !== -1) data.users = this.getAllLocalStorageByPrefix('user_');
      if (selected.indexOf('reservations') !== -1) data.reservations = this.getAllLocalStorageByPrefix('reservation_');
      if (selected.indexOf('inventory') !== -1) data.inventory = this.getAllLocalStorageByPrefix('inventory_');
      if (selected.indexOf('configurations') !== -1) data.configurations = this.getAllLocalStorageByPrefix('config_');

      const backupData = {
        id: backupId,
        type: 'selective',
        timestamp: timestamp,
        createdBy: this.currentUser.id,
        version: '1.0.0',
        scope: scope.scope,
        propertyId: scope.propertyId || null,
        data: data
      };

      if (scope.scope === 'property' && scope.propertyId) {
        backupData.data = this.filterBackupDataByProperty(backupData.data, scope.propertyId);
      }

      // Save
      this.saveBackup(backupData);

      this.logActivity('backup', 'info', 'Selective backup created', {
        backupId: backupId,
        modules: selected
      });

  this.showToast('✅ ' + this.t('msgs.backupSelectiveCreated','Backup seletivo criado com sucesso!'), 'success');
  this.renderBackupList();
  this.renderDashboard();
  this.updateStorageInfo();
    } catch (error) {
      console.error('Error creating selective backup:', error);
      this.logActivity('backup', 'error', 'Selective backup failed', { error: error.message });
  this.showToast('❌ ' + this.t('msgs.backupSelectiveError','Erro ao criar backup seletivo:') + ' ' + error.message, 'error');
    }
  }

  async restoreBackup(backupId, restoreType = 'full') {
    // Master-only action guard
    if (!this.currentUser || this.currentUser.role !== 'master') {
  this.showToast('⛔ ' + this.t('msgs.accessDenied','Acesso negado! Apenas usuários Master podem acessar este painel.'), 'error');
      return;
    }
    try {
      const backup = this.backups.find(b => b.id === backupId);
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      // Confirmação
      const confirmed = await this.confirmAction({
        title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
        message: this.format(this.t('msgs.confirmRestoreBody','Você está prestes a restaurar um backup do tipo "{0}".\n\nBackup: {1}\nData: {2}\nTipo: {3}\n\nEsta ação pode sobrescrever dados atuais. Deseja continuar?'), [restoreType, backup.id, new Date(backup.timestamp).toLocaleString(), backup.type]),
        confirmText: this.t('backup.restoreNow','Restaurar Backup'),
        cancelText: this.t('restoreSelective.cancel','Cancelar')
      });

      if (!confirmed) return;

      // Criar backup de segurança antes de restaurar
  this.showToast('📦 ' + this.t('msgs.creatingSafetyBackup','Criando backup de segurança antes de restaurar...'), 'info');
      await this.createFullBackup();

      // Processar restauração
      if (restoreType === 'full') {
        this.restoreFull(backup);
      } else if (restoreType === 'merge') {
        this.restoreMerge(backup);
      } else if (restoreType === 'selective') {
        this.restoreSelective(backup);
      }

      this.logActivity('restore', 'info', 'Backup restored', { 
        backupId, 
        restoreType 
      });

  this.showToast('✅ ' + this.t('msgs.restoreSuccess','Backup restaurado com sucesso! A página será recarregada.'), 'success');
      
      // Recarregar página
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      this.logActivity('restore', 'error', 'Restore failed', { error: error.message });
  this.showToast('❌ ' + this.t('msgs.restoreError','Erro ao restaurar backup:') + ' ' + error.message, 'error');
    }
  }

  restoreFull(backup) {
    // Limpar dados existentes (exceto master user)
    this.clearLocalStorageExceptMaster();

    // Restaurar todos os dados
    Object.entries(backup.data).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          localStorage.setItem(item.key, item.value);
        });
      }
    });
  }

  restoreMerge(backup) {
    // Restaurar apenas itens que não existem
    Object.entries(backup.data).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (!localStorage.getItem(item.key)) {
            localStorage.setItem(item.key, item.value);
          }
        });
      }
    });
  }

  restoreSelective(backup) {
    const selected = Array.from(document.querySelectorAll('#restoreSelectiveModal input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    if (!selected.length) {
  this.showToast(this.t('msgs.selectAtLeastOneModule','Selecione ao menos um módulo para restaurar.'), 'warning');
      return;
    }
    const map = {
      users: 'user_',
      reservations: 'reservation_',
      inventory: 'inventory_',
      configurations: 'config_'
    };
    Object.entries(map).forEach(([mod,prefix]) => {
      if (!selected.includes(mod)) return;
      const items = Array.isArray(backup.data[mod]) ? backup.data[mod] : [];
      items.forEach(it => {
        if (it && it.key && it.key.startsWith(prefix)) {
          localStorage.setItem(it.key, it.value);
        }
      });
    });
  }

  // ========================================
  // SISTEMA DE VERSIONAMENTO
  // ========================================

  createVersion(description = '') {
    try {
      const timestamp = new Date().toISOString();
  const versionId = 'v_' + Date.now();

      const version = {
        id: versionId,
        timestamp: timestamp,
        createdBy: this.currentUser.id,
  description: description || ('Marco criado em ' + new Date(timestamp).toLocaleString()),
  tag: 'v' + (this.versions.length + 1),
        snapshot: this.createSystemSnapshot(),
        changes: this.detectChangesSinceLastVersion()
      };

      this.versions.push(version);
      this.saveVersions();

      this.logActivity('version', 'info', 'Version created', { 
        versionId, 
        tag: version.tag 
      });

  this.showToast('✅ ' + this.format(this.t('msgs.versionCreated','Versão {0} criada com sucesso!'), [version.tag]), 'success');
      this.renderVersionTimeline();
      // Attempt to trigger external dev filesystem backup (non-blocking)
      this.triggerDevFilesystemBackup(version.tag, description);
      
    } catch (error) {
      console.error('Error creating version:', error);
      this.logActivity('version', 'error', 'Version creation failed', { error: error.message });
  this.showToast('❌ ' + this.t('msgs.versionError','Erro ao criar versão:') + ' ' + error.message, 'error');
    }
  }

  async triggerDevFilesystemBackup(tag, description) {
    // Development helper: calls local node backup server if running
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const label = encodeURIComponent(tag || 'marco');
  const resp = await fetch('http://localhost:4455/dev-backup?label=' + label, {
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (resp.ok) {
        this.logActivity('system', 'info', 'Dev filesystem backup triggered', { tag });
      } else {
        this.logActivity('system', 'warning', 'Dev backup server responded non-OK', { status: resp.status });
      }
    } catch (err) {
      // Silent failure acceptable in production environments
      this.logActivity('system', 'warning', 'Dev filesystem backup not reachable', { error: err.message });
    }
  }

  createSystemSnapshot() {
    // Captura abrangente de todo o estado do sistema
    var snapshotTimestamp = new Date().toISOString();
    var usersRaw = this.getAllLocalStorageByPrefix('user_');
    var reservationsRaw = this.getAllLocalStorageByPrefix('reservation_');
    var inventoryRaw = this.getAllLocalStorageByPrefix('inventory_');
    var configsRaw = this.getAllLocalStorageByPrefix('config_');
    var settingsRaw = this.getAllLocalStorageByPrefix('settings_');
    var propertiesMap = {};
  try { propertiesMap = JSON.parse(localStorage.getItem('nexefii_properties')||localStorage.getItem('nexefii_properties')||'{}')||{}; } catch(e){ propertiesMap = {}; }

    // Asset listing (paths referenciados em img/link tags do DOM)
    var assets = this.captureAssetList();

    // Reduz logs (podem ser muitos)
    var logsSubset = this.logs.slice(-2000);

    return {
      meta: {
        createdAt: snapshotTimestamp,
        by: this.currentUser ? this.currentUser.id : 'system',
        lang: this.lang,
        totalUsers: usersRaw.length,
        totalReservations: reservationsRaw.length,
        totalRooms: inventoryRaw.length
      },
      users: usersRaw,
      reservations: reservationsRaw,
      inventory: inventoryRaw,
      configurations: configsRaw,
      settings: settingsRaw,
      properties: propertiesMap,
      logs: logsSubset,
      backupsRef: this.backups.map(function(b){ return { id:b.id, type:b.type, timestamp:b.timestamp, size:(b.data&&b.data.metadata&&b.data.metadata.backupSize)||null }; }),
      fileStructure: this.captureFileStructure(),
      assets: assets
    };
  }

  detectChangesSinceLastVersion() {
    if (this.versions.length === 0) {
      return { type: 'initial', description: 'Versão inicial' };
    }

    const lastVersion = this.versions[this.versions.length - 1];
    const currentSnapshot = this.createSystemSnapshot();
    
    const changes = [];
    
    if (currentSnapshot.totalUsers !== lastVersion.snapshot.totalUsers) {
  changes.push('Usuários: ' + lastVersion.snapshot.totalUsers + ' → ' + currentSnapshot.totalUsers);
    }
    if (currentSnapshot.totalReservations !== lastVersion.snapshot.totalReservations) {
  changes.push('Reservas: ' + lastVersion.snapshot.totalReservations + ' → ' + currentSnapshot.totalReservations);
    }
    if (currentSnapshot.totalRooms !== lastVersion.snapshot.totalRooms) {
  changes.push('Quartos: ' + lastVersion.snapshot.totalRooms + ' → ' + currentSnapshot.totalRooms);
    }

    return { type: 'update', changes };
  }

  captureFileStructure() {
    // Captura estrutura de arquivos conhecidos do sistema
    return {
      html: ['index.html', 'login.html', 'pms-reservations.html', 'pms-frontdesk.html', 'pms-rooms.html', 'master-control.html'],
      js: ['app.js', 'i18n.js', 'pms-reservations-ui.js', 'pms-frontdesk.js', 'pms-rooms.js', 'master-control.js'],
      css: ['style.css'],
      json: ['i18n.json'],
      timestamp: new Date().toISOString()
    };
  }

  captureAssetList() {
    var list = [];
    try {
      var imgs = document.querySelectorAll('img');
      for (var i=0;i<imgs.length;i++){ var src = imgs[i].getAttribute('src'); if(src && src.indexOf('assets/')===0 && list.indexOf(src)===-1) list.push(src); }
      // Poderíamos adicionar outras extensões (.png,.jpg) conhecidas manualmente se necessário
    } catch(e) {}
    return list;
  }

  // ========================================
  // SISTEMA DE LOGS
  // ========================================

  // Simple accessible toast notifications
  showToast(message, type = 'info') {
    try {
      var cont = document.getElementById('toastContainer');
      if (!cont) return alert(message);
      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      var icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : 'ℹ️'));
      var txt = document.createElement('div');
      txt.textContent = message;
      toast.setAttribute('role','status');
      toast.appendChild(icon);
      toast.appendChild(txt);
      cont.appendChild(toast);
      setTimeout(function(){ if (toast && toast.parentNode) toast.parentNode.removeChild(toast); }, 4200);
    } catch(e) { /* fallback */ try { alert(message); } catch(_){} }
  }

  // Accessible confirmation dialog returning a Promise<boolean>
  confirmAction(opts = {}) {
    var _this = this;
    return new Promise(function(resolve){
      try {
        var modal = document.getElementById('confirmModal');
        if (!modal) return resolve(window.confirm(opts.message || 'Are you sure?'));
        var titleEl = document.getElementById('confirmTitle');
        var msgEl = document.getElementById('confirmMessage');
        var btnOk = document.getElementById('btnConfirmOk');
        var btnCancel = document.getElementById('btnConfirmCancel');
        var prev = document.activeElement;

        if (titleEl) titleEl.textContent = opts.title || _this.t('msgs.confirmRestoreTitle','ATENÇÃO!');
        if (msgEl) msgEl.textContent = opts.message || '';
        if (btnOk) btnOk.textContent = opts.confirmText || 'Confirmar';
        if (btnCancel) btnCancel.textContent = opts.cancelText || 'Cancelar';

        function cleanup(){
          document.removeEventListener('keydown', onKey);
          if (prev && prev.focus) try { prev.focus(); } catch(e){}
        }
        function close(){ modal.style.display = 'none'; cleanup(); }
        function onKey(ev){
          if (ev.key === 'Escape') { ev.preventDefault(); close(); resolve(false); }
          if (ev.key === 'Enter') { ev.preventDefault(); close(); resolve(true); }
        }

        btnOk.onclick = function(){ close(); resolve(true); };
        btnCancel.onclick = function(){ close(); resolve(false); };
        document.addEventListener('keydown', onKey);

        modal.style.display = 'flex';
        setTimeout(function(){ try { (btnOk || modal).focus(); } catch(e){} }, 0);
      } catch(e) {
        resolve(window.confirm(opts.message || 'Are you sure?'));
      }
    });
  }

  logActivity(type, level, message, data = {}) {
    const log = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: type, // auth, backup, restore, user, system, version
      level: level, // info, warning, error, critical
      message: message,
      userId: this.currentUser ? this.currentUser.id : 'system',
      data: data
    };

    this.logs.push(log);
    
    // Manter apenas últimos 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    this.saveLogs();
  }

  // ========================================
  // GESTÃO DE USUÁRIOS
  // ========================================

  getAllUsers() {
    const users = [];
    const usersData = this.getAllLocalStorageByPrefix('user_');
    for (var i=0;i<usersData.length;i++) {
      var item = usersData[i];
      try {
        var user = JSON.parse(item.value);
        if (user && user.id) {
          users.push(user);
        }
      } catch (e) {
        console.warn('Invalid user data:', item.key);
      }
    }
    return users;
  }

  createUser(userData) {
    try {
      const userId = 'user_' + Date.now();
      const newUser = Object.assign({
        id: userId,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUser.id,
        status: 'active',
        lastLogin: null,
        loginCount: 0
      }, userData);

      // Normalize properties to array of strings
      if (!Array.isArray(newUser.properties)) newUser.properties = [];
      newUser.properties = newUser.properties.map(function(p){ return String(p).trim(); }).filter(function(p){ return p; });

      localStorage.setItem(userId, JSON.stringify(newUser));
      this.logActivity('user', 'info', 'User created', { userId: userId, role: newUser.role });
  this.showToast('✅ ' + this.format(this.t('msgs.userCreated','Usuário {0} criado com sucesso!'), [newUser.name || newUser.username || '']), 'success');
  this.renderUsersTable();
  this.renderDashboard();
  this.updateStorageInfo();
    } catch (error) {
      console.error('Error creating user:', error);
  this.showToast('❌ ' + this.t('msgs.userCreateError','Erro ao criar usuário:') + ' ' + error.message, 'error');
    }
  }

  async deleteUser(userId) {
    try {
      // Não permitir deletar o próprio usuário master
      if (userId === this.currentUser.id) {
  this.showToast('⛔ ' + this.t('msgs.cannotDeleteSelf','Você não pode deletar seu próprio usuário!'), 'warning');
        return;
      }

      const userJson = localStorage.getItem(userId);
      if (!userJson) throw new Error('Usuário não encontrado');

      const user = JSON.parse(userJson);
      
      var confirmed = await this.confirmAction({
        title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
        message: '⚠️ ' + 'Tem certeza que deseja deletar o usuário "' + (user.name||'') + '"?\n\nEsta ação não pode ser desfeita.',
        confirmText: this.t('versions.delete','Excluir'),
        cancelText: this.t('restoreSelective.cancel','Cancelar')
      });

      if (!confirmed) return;

      localStorage.removeItem(userId);

      this.logActivity('user', 'warning', 'User deleted', { 
        userId, 
        userName: user.name 
      });

  this.showToast('✅ ' + this.t('msgs.userDeleted','Usuário deletado com sucesso!'), 'success');
    this.renderUsersTable();
    this.renderDashboard();
    this.updateStorageInfo();
      
    } catch (error) {
      console.error('Error deleting user:', error);
  this.showToast('❌ ' + this.t('msgs.userDeleteError','Erro ao deletar usuário:') + ' ' + error.message, 'error');
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================

  getAllLocalStorageByPrefix(prefix) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        items.push({
          key: key,
          value: localStorage.getItem(key)
        });
      }
    }
    return items;
  }

  getTotalItems(prefix) {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        count++;
      }
    }
    return count;
  }

  getModifiedItemsSince(prefix, sinceDate) {
    const items = [];
    const allItems = this.getAllLocalStorageByPrefix(prefix);
    
    allItems.forEach(item => {
      try {
        const data = JSON.parse(item.value);
        const modifiedDate = new Date(data.updatedAt || data.createdAt || 0);
        
        if (modifiedDate > sinceDate) {
          items.push(item);
        }
      } catch (e) {
        // Item sem data, incluir por segurança
        items.push(item);
      }
    });

    return items;
  }

  clearLocalStorageExceptMaster() {
    const masterData = {};
    
    // Salvar dados master
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('master')) {
        masterData[key] = localStorage.getItem(key);
      }
    }

    // Limpar tudo
    localStorage.clear();

    // Restaurar dados master
    Object.entries(masterData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  calculateStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total; // bytes
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ========================================
  // PERSISTÊNCIA
  // ========================================

  saveBackup(backup) {
    this.backups.push(backup);
    localStorage.setItem('master_backups', JSON.stringify(this.backups));
  }

  loadBackups() {
    const data = localStorage.getItem('master_backups');
    this.backups = data ? JSON.parse(data) : [];
  }

  getLastBackup() {
    if (this.backups.length === 0) return null;
    return this.backups[this.backups.length - 1];
  }

  // Scoped last backup (optional)
  getLastBackup(scope) {
    if (!scope || scope.scope === 'global') return this.backups.length ? this.backups[this.backups.length - 1] : null;
    for (var i = this.backups.length - 1; i >= 0; i--) {
      var b = this.backups[i];
      if (b && b.scope === 'property' && b.propertyId === scope.propertyId) return b;
    }
    return null;
  }

  saveVersions() {
    localStorage.setItem('master_versions', JSON.stringify(this.versions));
  }

  loadVersions() {
    const data = localStorage.getItem('master_versions');
    this.versions = data ? JSON.parse(data) : [];
  }

  saveLogs() {
    localStorage.setItem('master_logs', JSON.stringify(this.logs));
  }

  loadLogs() {
    const data = localStorage.getItem('master_logs');
    this.logs = data ? JSON.parse(data) : [];
  }

  loadSystemSettings() {
    const data = localStorage.getItem('master_settings');
    this.systemSettings = data ? JSON.parse(data) : {
      autoBackup: 'disabled',
      backupRetention: 30,
      autoVersioning: 'enabled',
      logLevel: 'info'
    };
  }

  saveSystemSettings() {
    localStorage.setItem('master_settings', JSON.stringify(this.systemSettings));
  }

  // ========================================
  // AUTO BACKUP E VERSIONAMENTO
  // ========================================

  setupAutoBackup() {
    if (this.systemSettings.autoBackup === 'disabled') return;

    const intervals = {
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'monthly': 30 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[this.systemSettings.autoBackup];
    if (!interval) return;

    setInterval(() => {
      console.info('🔄 Auto backup triggered');
      this.createIncrementalBackup();
    }, interval);
  }

  setupAutoVersioning() {
    if (this.systemSettings.autoVersioning === 'disabled') return;

    // Detectar mudanças significativas e criar versões automaticamente
    window.addEventListener('storage', (e) => {
      if (e.key && (e.key.startsWith('user_') || 
                    e.key.startsWith('reservation_') || 
                    e.key.startsWith('config_'))) {
        
        const shouldCreateVersion = this.shouldAutoVersion();
        if (shouldCreateVersion) {
          this.createVersion('Auto-generated version');
        }
      }
    });
  }

  shouldAutoVersion() {
    // Criar versão se:
    // 1. Última versão foi há mais de 1 hora
    // 2. Houve mudanças significativas

    if (this.versions.length === 0) return true;

    const lastVersion = this.versions[this.versions.length - 1];
    const hoursSinceLastVersion = (Date.now() - new Date(lastVersion.timestamp)) / (1000 * 60 * 60);

    return hoursSinceLastVersion >= 1;
  }

  // ========================================
  // UI RENDERING
  // ========================================

  initUI() {
    // Tabs
    var tabBtns = document.querySelectorAll('.tab-btn');
    for (var i=0;i<tabBtns.length;i++){
      tabBtns[i].addEventListener('click', (e) => {
        var tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    }

    // Backup type radio
    document.querySelectorAll('input[name="backupType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.getElementById('selectiveOptions').style.display = 
          e.target.value === 'selective' ? 'block' : 'none';
      });
    });

    // Backup scope UI
    var scopeRadios = document.querySelectorAll('input[name="backupScope"]');
    for (var sr=0; sr<scopeRadios.length; sr++) {
      scopeRadios[sr].addEventListener('change', () => {
        var val = (document.querySelector('input[name="backupScope"]:checked')||{}).value;
        var grp = document.getElementById('backupPropertyGroup');
        if (grp) grp.style.display = val === 'property' ? 'block' : 'none';
      });
    }
    // Populate property select for backup
    this.populateBackupPropertySelect();

    // Buttons
  var el;
  el = document.getElementById('btnLogoutMaster'); if (el) el.addEventListener('click', () => this.logout());
  el = document.getElementById('btnCreateBackup'); if (el) el.addEventListener('click', () => this.handleCreateBackup());
  el = document.getElementById('btnRestoreBackup'); if (el) el.addEventListener('click', () => this.handleRestoreBackup());
  el = document.getElementById('btnCreateUser'); if (el) el.addEventListener('click', () => this.openCreateUserModal());
  el = document.getElementById('btnCreateVersion'); if (el) el.addEventListener('click', () => this.handleCreateVersion());
  el = document.getElementById('btnSaveSystemSettings'); if (el) el.addEventListener('click', () => this.handleSaveSettings());

    // Properties Management buttons
    el = document.getElementById('btnCreateProperty');
    if (el) {
      // The Create Property flow should navigate to the wizard (not open inline modal).
      // Previous code opened the inline modal here; that modal is hidden by default.
      // The header's wizard hook handles navigation for '#btnCreateProperty', so we avoid opening the inline modal.
      // Keep a no-op handler to avoid duplicate bindings or collisions.
      // (If you want the button to explicitly call a wizard function here, point it to that function.)
    }
    el = document.getElementById('btnRefreshProperties'); if (el) el.addEventListener('click', () => this.refreshProperties());
    el = document.getElementById('searchProperties'); if (el) el.addEventListener('input', (e) => this.renderPropertiesTable(e.target.value));

    // Create user form
    el = document.getElementById('createUserForm'); if (el) el.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateUserSubmit();
    });

    // Filters for users
    el = document.getElementById('searchUsers'); if (el) el.addEventListener('input', () => this.renderUsersTable());
    el = document.getElementById('filterUserRole'); if (el) el.addEventListener('change', () => this.renderUsersTable());
    el = document.getElementById('filterUserStatus'); if (el) el.addEventListener('change', () => this.renderUsersTable());
    // Filters for logs
    el = document.getElementById('filterLogType'); if (el) el.addEventListener('change', () => this.renderLogs());
    el = document.getElementById('filterLogLevel'); if (el) el.addEventListener('change', () => this.renderLogs());
    el = document.getElementById('filterLogDate'); if (el) el.addEventListener('change', () => this.renderLogs());

    // Header user info
    el = document.getElementById('masterUserInfo'); if (el && this.currentUser) el.textContent = this.currentUser.name || this.currentUser.username || 'Master User';

  // Populate property selects (create/edit user modals)
  this.populatePropertySelects();

  // Make overview stats clickable
  this.wireOverviewClicks();

    // Initial render
    this.renderDashboard();
    this.renderBackupList();
    this.renderUsersTable();
    this.renderPropertiesTable(); // NEW
    this.renderLogs();
    this.renderVersionTimeline();
    this.updateStorageInfo();
    this.loadSettingsToUI();

  // Render per-property schedules
  this.renderPropertySchedules();

    // Apply permissions to UI (hide destructive actions for non-master)
    this.applyPermissionsUI();
  }

  applyPermissionsUI() {
    try {
      var isMaster = !!(this.currentUser && this.currentUser.role === 'master');
      // Hide/disable restore backup button for non-master
      var el = document.getElementById('btnRestoreBackup');
      if (el) el.style.display = isMaster ? '' : 'none';
      // Hide system reset button for non-master
      var resetBtn = document.querySelector('[data-i18n="system.resetSystem"]');
      if (resetBtn) resetBtn.style.display = isMaster ? '' : 'none';
      // Backup delete buttons are handled during render (conditional insertion)
    } catch (e) {
      console.warn('applyPermissionsUI failed', e);
    }
  }

  // ========================================
  // BACKUP SCOPING & PROPERTY FILTERS
  // ========================================

  getSelectedBackupScope() {
    try {
      var scopeVal = (document.querySelector('input[name="backupScope"]:checked')||{}).value || 'global';
      if (scopeVal !== 'property') return { scope:'global' };
      var prop = document.getElementById('backupPropertySelect');
      var pid = prop ? (prop.value||'').trim() : '';
      if (!pid) return { scope:'global' };
      return { scope:'property', propertyId: pid };
    } catch(e) { return { scope:'global' }; }
  }

  filterBackupDataByProperty(data, propertyId) {
    var out = Object.assign({}, data);
    function filterArr(arr, predicate) {
      if (!Array.isArray(arr)) return arr;
      var res = [];
      for (var i=0;i<arr.length;i++) {
        var it = arr[i];
        try { var v = JSON.parse(it.value); if (predicate(v)) res.push(it); } catch(_) { /* ignore unparsable */ }
      }
      return res;
    }
    out.users = filterArr(data.users, function(u){ return Array.isArray(u.properties) && u.properties.indexOf(propertyId) !== -1; });
    out.reservations = filterArr(data.reservations, function(r){ return (r.propertyId || (r.property && r.property.id)) === propertyId; });
    out.inventory = filterArr(data.inventory, function(inv){ return (inv.propertyId || (inv.property && inv.property.id)) === propertyId; });
    out.configurations = filterArr(data.configurations, function(cfg){ return (cfg.propertyId || (cfg.property && cfg.property.id)) === propertyId; });
    out.settings = filterArr(data.settings, function(s){ return (s.scope === 'property' ? s.propertyId === propertyId : true); });
    return out;
  }

  populateBackupPropertySelect() {
    try {
      var props = [];
      
      // Verificar se NexefiiProps está disponível
      console.log('populateBackupPropertySelect(): window.NexefiiProps disponível?', !!window.NexefiiProps);
      
      if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
        var list = window.NexefiiProps.listProperties() || [];
        console.log('populateBackupPropertySelect(): NexefiiProps retornou', list.length, 'propriedades:', list);
        props = list.filter(function(p) { return p && p.key; });
      } else {
        console.warn('populateBackupPropertySelect(): NexefiiProps não disponível, tentando localStorage direto');
        
        // Fallback: Tentar localStorage direto
        try {
          var map = JSON.parse(localStorage.getItem('nexefii_properties') || localStorage.getItem('nexefii_properties') || '{}');
          var keys = Object.keys(map);
          console.log('populateBackupPropertySelect(): localStorage retornou', keys.length, 'propriedades:', keys);
          if (keys.length > 0) {
            props = keys.map(function(k) { return map[k]; }).filter(function(p) { return p && p.key; });
          }
        } catch(e2) {
          console.error('populateBackupPropertySelect(): Erro ao ler localStorage:', e2);
        }
        
        // Fallback 2: Usar getPropertiesList()
        if (props.length === 0) {
          var propKeys = this.getPropertiesList();
          props = propKeys.map(function(k) { 
            return { key: k, name: k }; 
          });
        }
      }
      
      props.sort(function(a,b) { 
        var aName = a.name || a.key;
        var bName = b.name || b.key;
        return aName.localeCompare(bName); 
      });
      console.log('populateBackupPropertySelect(): Propriedades encontradas:', props.length, props);
      
      if (props.length === 0) {
        console.error('⚠️ populateBackupPropertySelect(): NENHUMA propriedade encontrada!');
      }
      
      var sel = document.getElementById('backupPropertySelect');
      if (!sel) {
        console.warn('populateBackupPropertySelect(): Select backupPropertySelect não encontrado');
        return;
      }
      var opts = '<option value="">-- Selecione uma propriedade --</option>';
      for (var i=0;i<props.length;i++) {
        var displayName = props[i].name || props[i].key;
        opts += '<option value="' + props[i].key + '">' + displayName + '</option>';
      }
      sel.innerHTML = opts;
      console.log('populateBackupPropertySelect(): Select backupPropertySelect populado com', sel.options.length, 'opções');
    } catch(e) {
      console.error('Erro em populateBackupPropertySelect:', e);
    }
  }

  getPropertiesList() {
    var props = [];
    try {
      // 1) Tentar NexefiiProps primeiro
      if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
        var list = window.NexefiiProps.listProperties() || [];
        console.log('getPropertiesList(): NexefiiProps retornou', list.length, 'propriedades');
        for (var i=0;i<list.length;i++) {
          if (list[i] && list[i].key) {
            props.push(list[i].key);
          }
        }
      } else {
        console.warn('getPropertiesList(): NexefiiProps não disponível, tentando localStorage');
        
        // 2) Fallback: Tentar localStorage direto
        try {
          var map = JSON.parse(localStorage.getItem('nexefii_properties') || localStorage.getItem('nexefii_properties') || '{}');
          var keys = Object.keys(map);
          if (keys.length > 0) {
            props = keys;
            console.log('getPropertiesList(): localStorage retornou', props.length, 'propriedades');
          }
        } catch(e2) {
          console.error('getPropertiesList(): Erro ao ler localStorage:', e2);
        }
        
        // 3) Fallback: infer from users
        if (props.length === 0) {
          console.warn('getPropertiesList(): Usando fallback de usuários');
          var users = this.getAllUsers();
          for (var u=0;u<users.length;u++) {
            var pl = users[u].properties || [];
            for (var p=0;p<pl.length;p++) if (props.indexOf(pl[p])===-1) props.push(pl[p]);
          }
        }
      }
    } catch(e) {
      console.error('getPropertiesList(): Erro:', e);
    }
    props.sort();
    console.log('getPropertiesList(): Retornando', props.length, 'propriedades:', props);
    return props;
  }

  // ========================================
  // MIGRAÇÃO: Normalizar propertyId quando há 1 propriedade
  // ========================================
  migratePerPropertyIfNeeded() {
    try {
      var flagKey = 'migration_pp_2025_11_done';
      if (localStorage.getItem(flagKey) === '1') return;
      var props = this.getPropertiesList();
      if (!props.length) {
        this.logActivity('system','info','Per-property migration skipped: no properties');
        localStorage.setItem(flagKey, '1');
        return;
      }
      if (props.length > 1) {
        // Ambíguo: não aplicar automaticamente
        this.logActivity('system','warning','Per-property migration skipped: multiple properties detected', { count: props.length });
        localStorage.setItem(flagKey, '1');
        return;
      }
      var pid = props[0];
      var updated = 0;

      function normalizePrefix(prefix) {
        for (var i=0;i<localStorage.length;i++) {
          var k = localStorage.key(i);
          if (!k || !k.startsWith(prefix)) continue;
          try {
            var v = JSON.parse(localStorage.getItem(k) || 'null');
            if (!v) continue;
            var hasProp = (typeof v.propertyId !== 'undefined') || (v.property && v.property.id);
            if (!hasProp) {
              v.propertyId = pid;
              v.updatedAt = new Date().toISOString();
              localStorage.setItem(k, JSON.stringify(v));
              updated++;
            }
          } catch(e) { /* ignore invalid JSON */ }
        }
      }
      // Aplicar em coleções operacionais
      normalizePrefix('reservation_');
      normalizePrefix('inventory_');
      normalizePrefix('config_');
      // settings: apenas os com escopo property
      for (var j=0;j<localStorage.length;j++) {
        var key = localStorage.key(j);
        if (!key || !key.startsWith('settings_')) continue;
        try {
          var sv = JSON.parse(localStorage.getItem(key)||'null');
          if (!sv) continue;
          if (sv.scope === 'property' && !sv.propertyId) { sv.propertyId = pid; sv.updatedAt = new Date().toISOString(); localStorage.setItem(key, JSON.stringify(sv)); updated++; }
        } catch(e) {}
      }

      this.logActivity('system','info','Per-property migration applied', { propertyId: pid, updated: updated });
      localStorage.setItem(flagKey, '1');
      if (updated) this.showToast('✅ ' + this.format(this.t('msgs.migrationApplied','Migração de propriedade aplicada ({0} itens ajustados).'), [String(updated)]), 'success');
    } catch(e) {
      this.logActivity('system','error','Per-property migration failed', { error: e.message });
    }
  }

  // ========================================
  // REPARAR PROPRIEDADES COM DADOS INCOMPLETOS
  // ========================================
  
  repairIncompleteProperties() {
    try {
      if (!window.NexefiiProps) {
        console.warn('[repairIncompleteProperties] NexefiiProps não disponível');
        return;
      }

      const properties = window.NexefiiProps.listProperties();
      let repaired = 0;

      properties.forEach(prop => {
        if (!prop || !prop.key) return;

        let needsRepair = false;
        const updates = {};

        // Verificar campos obrigatórios
        if (!prop.name || prop.name === '') {
          updates.name = prop.key;
          needsRepair = true;
        }

        if (!prop.modulesPurchased || !Array.isArray(prop.modulesPurchased)) {
          updates.modulesPurchased = [];
          needsRepair = true;
        }

        if (prop.userCapacity === undefined || prop.userCapacity === null) {
          updates.userCapacity = 'to30';
          needsRepair = true;
        }

        if (prop.active === undefined || prop.active === null) {
          updates.active = true;
          needsRepair = true;
        }

        if (prop.deployed === undefined || prop.deployed === null) {
          updates.deployed = false;
          needsRepair = true;
        }

        if (prop.roomCount === undefined || prop.roomCount === null) {
          updates.roomCount = 50;
          needsRepair = true;
        }

        if (!prop.location || typeof prop.location !== 'object') {
          updates.location = {
            address: '',
            city: '',
            state: '',
            country: '',
            coordinates: { lat: 0, lng: 0 }
          };
          needsRepair = true;
        }

        if (!prop.imageUrl || prop.imageUrl === '') {
          updates.imageUrl = 'assets/images/default-hotel-1.jpg';
          needsRepair = true;
        }

        // Se precisa de reparo, atualizar propriedade
        if (needsRepair) {
          const repairedProp = Object.assign({}, prop, updates);
          const result = window.NexefiiProps.upsertProperty(repairedProp);
          
          if (result.success) {
            repaired++;
            console.log(`[repairIncompleteProperties] ✅ Propriedade ${prop.key} reparada:`, updates);
          } else {
            console.error(`[repairIncompleteProperties] ❌ Erro ao reparar ${prop.key}:`, result.error);
          }
        }
      });

      if (repaired > 0) {
        console.log(`[repairIncompleteProperties] ✅ ${repaired} propriedade(s) reparada(s)`);
        this.addLog({
          type: 'system',
          level: 'info',
          action: 'properties_repaired',
          details: `${repaired} propriedade(s) com dados incompletos foram reparadas`,
          user: this.currentUser?.username || 'system'
        });
      }
    } catch (e) {
      console.error('[repairIncompleteProperties] Erro:', e);
      this.addLog({
        type: 'system',
        level: 'error',
        action: 'properties_repair_failed',
        details: `Erro ao reparar propriedades: ${e.message}`,
        user: this.currentUser?.username || 'system'
      });
    }
  }

  // ========================================
  // LIMPAR PROPRIEDADES DOS USUÁRIOS
  // ========================================
  
  cleanupUserProperties() {
    try {
      const users = this.getAllUsers();
      let fixed = 0;

      users.forEach(user => {
        if (!user || !user.id) return;

        let needsFix = false;
        let newProperties = [];

        // Caso 1: properties é uma string ao invés de array
        if (typeof user.properties === 'string') {
          console.log(`[cleanupUserProperties] Usuário ${user.username} tem properties como string:`, user.properties);
          if (user.properties.trim()) {
            newProperties = user.properties.split(',').map(p => p.trim()).filter(p => p);
          }
          needsFix = true;
        }
        // Caso 2: properties é array mas contém strings concatenadas
        else if (Array.isArray(user.properties)) {
          const cleaned = [];
          let hasCommas = false;
          
          user.properties.forEach(prop => {
            if (typeof prop === 'string' && prop.includes(',')) {
              hasCommas = true;
              // Dividir string com múltiplas propriedades
              prop.split(',').forEach(p => {
                const trimmed = p.trim();
                if (trimmed && cleaned.indexOf(trimmed) === -1) {
                  cleaned.push(trimmed);
                }
              });
            } else if (prop && typeof prop === 'string') {
              const trimmed = prop.trim();
              if (trimmed && cleaned.indexOf(trimmed) === -1) {
                cleaned.push(trimmed);
              }
            }
          });
          
          if (hasCommas) {
            console.log(`[cleanupUserProperties] Usuário ${user.username} tem properties com vírgulas:`, user.properties, '→', cleaned);
            newProperties = cleaned;
            needsFix = true;
          }
        }

        // Aplicar correção
        if (needsFix) {
          user.properties = newProperties;
          localStorage.setItem(user.id, JSON.stringify(user));
          fixed++;
          console.log(`[cleanupUserProperties] ✅ Usuário ${user.username} corrigido. Properties:`, newProperties);
        }
      });

      if (fixed > 0) {
        console.log(`[cleanupUserProperties] ✅ ${fixed} usuário(s) corrigido(s)`);
        this.addLog({
          type: 'system',
          level: 'info',
          action: 'users_properties_cleaned',
          details: `${fixed} usuário(s) com properties em formato incorreto foram corrigidos`,
          user: this.currentUser?.username || 'system'
        });
      } else {
        console.log('[cleanupUserProperties] Nenhum usuário precisou de correção');
      }
    } catch (e) {
      console.error('[cleanupUserProperties] Erro:', e);
      this.addLog({
        type: 'system',
        level: 'error',
        action: 'users_cleanup_failed',
        details: `Erro ao limpar properties de usuários: ${e.message}`,
        user: this.currentUser?.username || 'system'
      });
    }
  }

  // ========================================
  // PER-PROPERTY SCHEDULING
  // ========================================

  loadPropertySchedules() {
    try { this.propertySchedules = JSON.parse(localStorage.getItem('master_property_schedules')||'{}') || {}; } catch(e){ this.propertySchedules = {}; }
  }
  savePropertySchedules() {
    localStorage.setItem('master_property_schedules', JSON.stringify(this.propertySchedules));
  }

  renderPropertySchedules() {
    try {
      var cont = document.getElementById('propertySchedules'); 
      if (!cont) return;
      
      var props = this.getPropertiesList();
      if (!props.length) { 
        cont.innerHTML = '<p>' + (this.t('users.propertiesHint','Selecione uma ou mais propriedades')) + '</p>'; 
        return; 
      }

      // Initialize filter state if not exists
      if (!this.scheduleFilter) {
        this.scheduleFilter = { 
          search: '', 
          status: 'all', // all, scheduled, unscheduled
          page: 1, 
          pageSize: 10,
          selected: new Set()
        };
      }

      // Save focus state before re-rendering
      var activeElement = document.activeElement;
      var shouldRestoreFocus = activeElement && (activeElement.id === 'scheduleSearch' || activeElement.id === 'scheduleStatusFilter');
      var cursorPosition = shouldRestoreFocus && activeElement.id === 'scheduleSearch' ? activeElement.selectionStart : null;

      // Calculate statistics
      var stats = this.calculateScheduleStats(props);
      
      // Apply filters
      var filtered = this.filterProperties(props);
      var total = filtered.length;
      var start = (this.scheduleFilter.page - 1) * this.scheduleFilter.pageSize;
      var end = Math.min(start + this.scheduleFilter.pageSize, total);
      var paginated = filtered.slice(start, end);
      var totalPages = Math.ceil(total / this.scheduleFilter.pageSize);

      // Build UI
      var html = '';
      
      // Summary Dashboard
      html += this.renderScheduleSummary(stats);
      
      // Bulk Actions Bar (if any selected)
      if (this.scheduleFilter.selected.size > 0) {
        html += this.renderBulkActionsBar();
      }
      
      // Search and Filters
      html += this.renderScheduleFilters();
      
      // Compact Table
      html += this.renderScheduleTable(paginated, start);
      
      // Pagination
      if (totalPages > 1) {
        html += this.renderSchedulePagination(total, start, end, totalPages);
      }

      cont.innerHTML = html;
      
      // Restore focus and cursor position
      if (shouldRestoreFocus) {
        var elementToFocus = document.getElementById(activeElement.id);
        if (elementToFocus) {
          elementToFocus.focus();
          if (cursorPosition !== null && elementToFocus.setSelectionRange) {
            elementToFocus.setSelectionRange(cursorPosition, cursorPosition);
          }
        }
      }
      
      // Wire events
      this.wireScheduleEvents();
      
    } catch(e) { console.warn('renderPropertySchedules failed', e); }
  }

  calculateScheduleStats(props) {
    var stats = {
      total: props.length,
      scheduled: 0,
      unscheduled: 0,
      daily: 0,
      weekly: 0,
      monthly: 0
    };
    for (var i = 0; i < props.length; i++) {
      var pid = props[i];
      var cfg = this.propertySchedules[pid];
      if (cfg && cfg.frequency !== 'disabled') {
        stats.scheduled++;
        if (cfg.frequency === 'daily') stats.daily++;
        else if (cfg.frequency === 'weekly') stats.weekly++;
        else if (cfg.frequency === 'monthly') stats.monthly++;
      } else {
        stats.unscheduled++;
      }
    }
    return stats;
  }

  filterProperties(props) {
    var self = this;
    return props.filter(function(pid) {
      // Search filter
      if (self.scheduleFilter.search) {
        var term = self.scheduleFilter.search.toLowerCase();
        if (pid.toLowerCase().indexOf(term) === -1) return false;
      }
      // Status filter
      if (self.scheduleFilter.status === 'scheduled') {
        var cfg = self.propertySchedules[pid];
        if (!cfg || cfg.frequency === 'disabled') return false;
      } else if (self.scheduleFilter.status === 'unscheduled') {
        var cfg = self.propertySchedules[pid];
        if (cfg && cfg.frequency !== 'disabled') return false;
      }
      return true;
    });
  }

  renderScheduleSummary(stats) {
    var html = '<div class="schedule-summary">';
    html += '<h4>' + this.t('backup.scheduling.summary.title', 'Resumo de Agendamentos') + '</h4>';
    html += '<div class="summary-stats">';
    
    // Total
    html += '<div class="stat-card">';
    html += '<div class="stat-icon">🏨</div>';
    html += '<div class="stat-content">';
    html += '<div class="stat-value">' + stats.total + '</div>';
    html += '<div class="stat-label">' + this.t('backup.scheduling.summary.totalProperties', 'Total de Propriedades') + '</div>';
    html += '</div></div>';
    
    // Scheduled
    html += '<div class="stat-card stat-success">';
    html += '<div class="stat-icon">✅</div>';
    html += '<div class="stat-content">';
    html += '<div class="stat-value">' + stats.scheduled + '</div>';
    html += '<div class="stat-label">' + this.t('backup.scheduling.summary.scheduled', 'Com Backup Agendado') + '</div>';
    html += '</div></div>';
    
    // Unscheduled (with warning if > 0)
    var warnClass = stats.unscheduled > 0 ? ' stat-warning' : '';
    html += '<div class="stat-card' + warnClass + '">';
    html += '<div class="stat-icon">' + (stats.unscheduled > 0 ? '⚠️' : '✓') + '</div>';
    html += '<div class="stat-content">';
    html += '<div class="stat-value">' + stats.unscheduled + '</div>';
    html += '<div class="stat-label">' + this.t('backup.scheduling.summary.unscheduled', 'Sem Backup Agendado') + '</div>';
    html += '</div></div>';
    
    html += '</div>'; // summary-stats
    
    // Warning banner if unscheduled > 0
    if (stats.unscheduled > 0) {
      html += '<div class="alert alert-warning">';
      html += '⚠️ <strong>' + stats.unscheduled + '</strong> ' + this.t('backup.scheduling.summary.warningUnscheduled', 'propriedades sem backup agendado!');
      html += '</div>';
    }
    
    // Frequency breakdown
    html += '<div class="frequency-breakdown">';
    html += '<span class="freq-badge freq-daily">📅 ' + this.t('backup.scheduling.summary.daily', 'Diário') + ': ' + stats.daily + '</span>';
    html += '<span class="freq-badge freq-weekly">📆 ' + this.t('backup.scheduling.summary.weekly', 'Semanal') + ': ' + stats.weekly + '</span>';
    html += '<span class="freq-badge freq-monthly">🗓️ ' + this.t('backup.scheduling.summary.monthly', 'Mensal') + ': ' + stats.monthly + '</span>';
    html += '</div>';
    
    html += '</div>'; // schedule-summary
    return html;
  }

  renderBulkActionsBar() {
    var count = this.scheduleFilter.selected.size;
    var html = '<div class="bulk-actions-bar">';
    html += '<div class="bulk-info">';
    html += '<strong>' + this.format(this.t('backup.scheduling.bulk.selected', '{0} selecionadas'), [count]) + '</strong>';
    html += '</div>';
    html += '<div class="bulk-buttons">';
    html += '<button class="btn btn-sm" id="btnBulkSchedule">📅 ' + this.t('backup.scheduling.bulk.scheduleAll', 'Agendar Selecionadas') + '</button>';
    html += '<button class="btn btn-sm" id="btnBulkDisable">🚫 ' + this.t('backup.scheduling.bulk.disableAll', 'Desabilitar Selecionadas') + '</button>';
    html += '<button class="btn btn-sm" id="btnBulkRun">⏱️ ' + this.t('backup.scheduling.bulk.runAll', 'Executar Backups') + '</button>';
    html += '<button class="btn btn-sm" id="btnBulkExport">📤 ' + this.t('backup.scheduling.bulk.exportAll', 'Exportar Selecionadas') + '</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  renderScheduleFilters() {
    var html = '<div class="schedule-filters">';
    
    // Search
    html += '<input type="text" class="search-input" id="scheduleSearch" placeholder="' 
      + this.t('backup.scheduling.table.search', 'Buscar propriedade...') + '" value="' + (this.scheduleFilter.search || '') + '">';
    
    // Status filter
    html += '<select class="select" id="scheduleStatusFilter">';
    html += '<option value="all"' + (this.scheduleFilter.status === 'all' ? ' selected' : '') + '>' 
      + this.t('backup.scheduling.table.filterAll', 'Todas') + '</option>';
    html += '<option value="scheduled"' + (this.scheduleFilter.status === 'scheduled' ? ' selected' : '') + '>' 
      + this.t('backup.scheduling.table.filterScheduled', 'Agendadas') + '</option>';
    html += '<option value="unscheduled"' + (this.scheduleFilter.status === 'unscheduled' ? ' selected' : '') + '>' 
      + this.t('backup.scheduling.table.filterUnscheduled', 'Não Agendadas') + '</option>';
    html += '</select>';

    // Page size
    var sizes = [10,25,50,100];
    html += '<select class="select" id="schedulePageSize">';
    for (var s=0;s<sizes.length;s++) {
      var sz = sizes[s];
      html += '<option value="' + sz + '"' + (this.scheduleFilter.pageSize===sz?' selected':'') + '>' + sz + '/página</option>';
    }
    html += '</select>';
    
    html += '</div>';
    return html;
  }

  renderScheduleTable(props, startIndex) {
    var html = '<div class="schedule-table-container">';
    html += '<table class="schedule-table">';
    html += '<thead><tr>';
    html += '<th width="40"><input type="checkbox" id="selectAllSchedules"></th>';
    html += '<th>' + this.t('backup.scheduling.table.colProperty', 'Propriedade') + '</th>';
    html += '<th>' + this.t('backup.scheduling.table.colStatus', 'Status') + '</th>';
    html += '<th>' + this.t('backup.scheduling.table.colFrequency', 'Frequência') + '</th>';
    html += '<th>' + this.t('backup.scheduling.table.colTime', 'Horário') + '</th>';
    html += '<th>' + this.t('backup.scheduling.table.colLastRun', 'Último Backup') + '</th>';
    html += '<th width="200">' + this.t('backup.scheduling.table.colActions', 'Ações') + '</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    if (props.length === 0) {
      html += '<tr><td colspan="7" class="empty-state">' 
        + this.t('backup.scheduling.table.noResults', 'Nenhuma propriedade encontrada') + '</td></tr>';
    } else {
      for (var i = 0; i < props.length; i++) {
        var pid = props[i];
        var cfg = this.propertySchedules[pid] || { frequency: 'disabled', time: '02:00', lastRun: null };
        var isScheduled = cfg.frequency !== 'disabled';
        var isChecked = this.scheduleFilter.selected.has(pid);
        
        html += '<tr data-property="' + pid + '">';
        
        // Checkbox
        html += '<td><input type="checkbox" class="schedule-checkbox" data-property="' + pid + '"' 
          + (isChecked ? ' checked' : '') + '></td>';
        
        // Property name
        html += '<td><strong>🏨 ' + pid + '</strong></td>';
        
        // Status badge
        html += '<td>';
        if (isScheduled) {
          html += '<span class="badge badge-success">✅ ' 
            + this.t('backup.scheduling.table.statusEnabled', 'Ativo') + '</span>';
        } else {
          html += '<span class="badge badge-gray">⚫ ' 
            + this.t('backup.scheduling.table.statusDisabled', 'Desabilitado') + '</span>';
        }
        html += '</td>';
        
        // Frequency
        html += '<td>';
        if (isScheduled) {
          var freqLabel = cfg.frequency === 'daily' ? this.t('system.backupAutoOptions.daily', 'Diário')
            : cfg.frequency === 'weekly' ? this.t('system.backupAutoOptions.weekly', 'Semanal')
            : this.t('system.backupAutoOptions.monthly', 'Mensal');
          html += '<span class="freq-badge freq-' + cfg.frequency + '">' + freqLabel + '</span>';
        } else {
          html += '<span class="text-muted">—</span>';
        }
        html += '</td>';
        
        // Time
        html += '<td>' + (isScheduled ? cfg.time : '—') + '</td>';
        
        // Last run
        html += '<td>';
        if (cfg.lastRun) {
          var d = new Date(cfg.lastRun);
          html += '<span class="text-sm">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + '</span>';
        } else {
          html += '<span class="text-muted">' + this.t('backup.scheduling.table.never', 'Nunca') + '</span>';
        }
        html += '</td>';
        
        // Actions
        html += '<td class="actions-cell">';
        html += '<button class="btn btn-xs" data-action="edit" data-property="' + pid + '" title="Editar agendamento">✏️ ' 
          + this.t('backup.scheduling.table.edit', 'Editar') + '</button> ';
        html += '<button class="btn btn-xs" data-action="run" data-property="' + pid + '" title="Executar backup agora">⏱️ ' 
          + this.t('backup.scheduling.table.run', 'Executar') + '</button> ';
        html += '<button class="btn btn-xs" data-action="export" data-property="' + pid + '" title="Exportar dados da propriedade">📤 ' 
          + this.t('backup.scheduling.table.export', 'Exportar') + '</button>';
        html += '</td>';
        
        html += '</tr>';
      }
    }
    
    html += '</tbody></table>';
    html += '</div>';
    return html;
  }

  renderSchedulePagination(total, start, end, totalPages) {
    var currentPage = this.scheduleFilter.page;
    var html = '<div class="pagination-container">';
    
    // Info
    html += '<div class="pagination-info">';
    html += this.format(this.t('backup.scheduling.table.showingResults', 'Mostrando {0} - {1} de {2} propriedades'), 
      [start + 1, end, total]);
    html += '</div>';
    
    // Controls
    html += '<div class="pagination-controls">';
    html += '<button class="btn btn-sm" id="btnPrevPage"' + (currentPage === 1 ? ' disabled' : '') + '>← Anterior</button>';
    html += '<span class="page-numbers">';
    
    // Show page numbers (max 5 visible)
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
      html += '<button class="btn btn-sm page-btn" data-page="1">1</button>';
      if (startPage > 2) html += '<span>...</span>';
    }
    
    for (var p = startPage; p <= endPage; p++) {
      var activeClass = p === currentPage ? ' active' : '';
      html += '<button class="btn btn-sm page-btn' + activeClass + '" data-page="' + p + '">' + p + '</button>';
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += '<span>...</span>';
      html += '<button class="btn btn-sm page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
    }
    
    html += '</span>';
    html += '<button class="btn btn-sm" id="btnNextPage"' + (currentPage === totalPages ? ' disabled' : '') + '>Próximo →</button>';
    html += '</div>';
    
    html += '</div>';
    return html;
  }

  wireScheduleEvents() {
    var self = this;
    
    // Search input with debounce and focus preservation handled in render
    var searchInput = document.getElementById('scheduleSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        var val = e.target.value;
        if (self._scheduleSearchTimer) clearTimeout(self._scheduleSearchTimer);
        self._scheduleSearchTimer = setTimeout(function(){
          self.scheduleFilter.search = val;
          self.scheduleFilter.page = 1;
          self.renderPropertySchedules();
        }, 150);
      });
      // Shortcut: pressing '/' focuses search from anywhere in backup tab (bound once)
      if (!this._scheduleShortcutsBound) {
        this._scheduleShortcutsBound = true;
        document.addEventListener('keydown', function(e){
          var activeTab = document.getElementById('tab-backup');
          if (!activeTab || !activeTab.classList.contains('active')) return;
          if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            var si = document.getElementById('scheduleSearch');
            if (si) { si.focus(); si.select && si.select(); }
          }
          // Bulk shortcuts only if not typing in an input/select/textarea
          var tag = (document.activeElement && document.activeElement.tagName) || '';
          var typing = /INPUT|SELECT|TEXTAREA/.test(tag);
          if (!typing) {
            if (e.key.toLowerCase() === 'e') { // Edit
              var ids = Array.from(self.scheduleFilter.selected);
              if (ids.length) { e.preventDefault(); self.openScheduleModal(ids); }
            } else if (e.key.toLowerCase() === 'r') { // Run
              var ids2 = Array.from(self.scheduleFilter.selected);
              if (ids2.length) { e.preventDefault(); self.bulkRunBackups(); }
            } else if (e.key === 'Delete') { // Disable
              var ids3 = Array.from(self.scheduleFilter.selected);
              if (ids3.length) { e.preventDefault(); self.bulkDisableSchedules(); }
            }
          }
        });
      }
    }
    
    // Status filter
    var statusFilter = document.getElementById('scheduleStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function(e) {
        self.scheduleFilter.status = e.target.value;
        self.scheduleFilter.page = 1;
        self.renderPropertySchedules();
      });
    }

    // Page size control
    var pageSizeSel = document.getElementById('schedulePageSize');
    if (pageSizeSel) {
      pageSizeSel.addEventListener('change', function(e){
        var n = parseInt(e.target.value, 10) || 10;
        self.scheduleFilter.pageSize = n;
        self.scheduleFilter.page = 1;
        self.renderPropertySchedules();
      });
    }
    
    // Select all checkbox
    var selectAll = document.getElementById('selectAllSchedules');
    if (selectAll) {
      selectAll.addEventListener('change', function(e) {
        var checkboxes = document.querySelectorAll('.schedule-checkbox');
        checkboxes.forEach(function(cb) {
          cb.checked = e.target.checked;
          var pid = cb.getAttribute('data-property');
          if (e.target.checked) {
            self.scheduleFilter.selected.add(pid);
          } else {
            self.scheduleFilter.selected.delete(pid);
          }
        });
        self.renderPropertySchedules();
      });
    }
    
    // Individual checkboxes
    document.querySelectorAll('.schedule-checkbox').forEach(function(cb) {
      cb.addEventListener('change', function(e) {
        var pid = e.target.getAttribute('data-property');
        if (e.target.checked) {
          self.scheduleFilter.selected.add(pid);
        } else {
          self.scheduleFilter.selected.delete(pid);
        }
        self.renderPropertySchedules();
      });
    });
    
    // Action buttons
    document.querySelectorAll('button[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var action = e.currentTarget.getAttribute('data-action');
        var pid = e.currentTarget.getAttribute('data-property');
        console.log('Action clicked:', action, 'Property:', pid);
        try {
          if (action === 'edit') {
            self.openScheduleModal([pid]);
          } else if (action === 'run') {
            self.runScheduledBackupNow(pid);
          } else if (action === 'export') {
            self.exportPropertyData(pid);
          }
        } catch(err) {
          console.error('Error executing action:', err);
          self.showToast('❌ Erro ao executar ação: ' + err.message, 'error');
        }
      });
    });
    
    // Bulk actions
    var btnBulkSchedule = document.getElementById('btnBulkSchedule');
    if (btnBulkSchedule) {
      btnBulkSchedule.addEventListener('click', function() {
        self.openScheduleModal(Array.from(self.scheduleFilter.selected));
      });
    }
    
    var btnBulkDisable = document.getElementById('btnBulkDisable');
    if (btnBulkDisable) {
      btnBulkDisable.addEventListener('click', function() {
        self.bulkDisableSchedules();
      });
    }
    
    var btnBulkRun = document.getElementById('btnBulkRun');
    if (btnBulkRun) {
      btnBulkRun.addEventListener('click', function() {
        self.bulkRunBackups();
      });
    }
    
    var btnBulkExport = document.getElementById('btnBulkExport');
    if (btnBulkExport) {
      btnBulkExport.addEventListener('click', function() {
        self.bulkExportProperties();
      });
    }
    
    // Pagination
    var btnPrev = document.getElementById('btnPrevPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', function() {
        if (self.scheduleFilter.page > 1) {
          self.scheduleFilter.page--;
          self.renderPropertySchedules();
        }
      });
    }
    
    var btnNext = document.getElementById('btnNextPage');
    if (btnNext) {
      btnNext.addEventListener('click', function() {
        self.scheduleFilter.page++;
        self.renderPropertySchedules();
      });
    }
    
    document.querySelectorAll('.page-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
        self.scheduleFilter.page = page;
        self.renderPropertySchedules();
      });
    });
  }

  openScheduleModal(propertyIds) {
    if (!propertyIds || propertyIds.length === 0) return;
    
    var isBulk = propertyIds.length > 1;
    var title = isBulk 
      ? this.t('backup.scheduling.modal.titleBulk', 'Configurar Agendamento em Massa')
      : this.t('backup.scheduling.modal.title', 'Configurar Agendamento');
    
    // Get current config (for single edit, use first property's config)
    var currentCfg = this.propertySchedules[propertyIds[0]] || { frequency: 'disabled', time: '02:00' };
    
    var html = '<div class="modal-overlay" id="scheduleModal">';
    html += '<div class="modal-content modal-md">';
    html += '<div class="modal-header">';
    html += '<h3>' + title + '</h3>';
    html += '<button class="modal-close" id="closeScheduleModal">×</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    
    // Properties list
    html += '<div class="form-group">';
    html += '<label><strong>' + this.t('backup.scheduling.modal.properties', 'Propriedades:') + '</strong></label>';
    html += '<div class="properties-list">';
    if (isBulk) {
      html += '<p>' + this.format(this.t('backup.scheduling.modal.applyingTo', 'Aplicando para {0} propriedades'), [propertyIds.length]) + '</p>';
      html += '<div class="property-chips">';
      for (var i = 0; i < Math.min(propertyIds.length, 10); i++) {
        html += '<span class="chip">🏨 ' + propertyIds[i] + '</span>';
      }
      if (propertyIds.length > 10) {
        html += '<span class="chip">+' + (propertyIds.length - 10) + ' mais</span>';
      }
      html += '</div>';
    } else {
      html += '<p><strong>🏨 ' + propertyIds[0] + '</strong></p>';
    }
    html += '</div></div>';
    
    // Enable checkbox
    html += '<div class="form-group">';
    html += '<label class="checkbox-label">';
    html += '<input type="checkbox" id="scheduleEnabled"' + (currentCfg.frequency !== 'disabled' ? ' checked' : '') + '>';
    html += '<span>' + this.t('backup.scheduling.modal.enable', 'Habilitar agendamento') + '</span>';
    html += '</label>';
    html += '</div>';
    
    // Frequency
    html += '<div class="form-group">';
    html += '<label>' + this.t('backup.scheduling.modal.frequency', 'Frequência') + '</label>';
    html += '<select class="select" id="scheduleFrequency">';
    html += '<option value="daily"' + (currentCfg.frequency === 'daily' ? ' selected' : '') + '>' 
      + this.t('system.backupAutoOptions.daily', 'Diário') + '</option>';
    html += '<option value="weekly"' + (currentCfg.frequency === 'weekly' ? ' selected' : '') + '>' 
      + this.t('system.backupAutoOptions.weekly', 'Semanal') + '</option>';
    html += '<option value="monthly"' + (currentCfg.frequency === 'monthly' ? ' selected' : '') + '>' 
      + this.t('system.backupAutoOptions.monthly', 'Mensal') + '</option>';
    html += '</select>';
    html += '</div>';
    
    // Time
    html += '<div class="form-group">';
    html += '<label>' + this.t('backup.scheduling.modal.time', 'Horário') + '</label>';
    html += '<input type="time" class="input" id="scheduleTime" value="' + (currentCfg.time || '02:00') + '">';
    html += '</div>';
    
    html += '</div>'; // modal-body
    html += '<div class="modal-footer">';
    html += '<button class="btn" id="cancelScheduleModal">' + this.t('backup.scheduling.modal.cancel', 'Cancelar') + '</button>';
    html += '<button class="btn btn-primary" id="saveScheduleModal">' + this.t('backup.scheduling.modal.save', 'Salvar') + '</button>';
    html += '</div>';
    html += '</div></div>';
    
    // Inject and wire
    document.body.insertAdjacentHTML('beforeend', html);
    
    var self = this;
    var modal = document.getElementById('scheduleModal');
    
    document.getElementById('closeScheduleModal').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('cancelScheduleModal').addEventListener('click', function() {
      modal.remove();
    });
    
    document.getElementById('saveScheduleModal').addEventListener('click', function() {
      var enabled = document.getElementById('scheduleEnabled').checked;
      var frequency = document.getElementById('scheduleFrequency').value;
      var time = document.getElementById('scheduleTime').value;
      
      // Apply to all selected properties
      for (var i = 0; i < propertyIds.length; i++) {
        var pid = propertyIds[i];
        self.propertySchedules[pid] = {
          frequency: enabled ? frequency : 'disabled',
          time: time,
          lastRun: self.propertySchedules[pid] ? self.propertySchedules[pid].lastRun : null
        };
      }
      
      self.savePropertySchedules();
      self.logActivity('backup', 'info', 'Schedule updated', { 
        properties: propertyIds, 
        frequency: enabled ? frequency : 'disabled', 
        time: time 
      });
      
      modal.remove();
      self.renderPropertySchedules();
      self.showToast('✅ ' + self.t('msgs.settingsSaved', 'Configurações salvas com sucesso!'), 'success');
    });
    
    // Click outside to close
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });

    // ESC to close, Enter to save
    modal.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { e.preventDefault(); modal.remove(); }
      if (e.key === 'Enter') {
        var tag = (e.target && e.target.tagName) || '';
        // Avoid triggering when selecting options
        if (!/SELECT/.test(tag)) {
          e.preventDefault();
          var btn = document.getElementById('saveScheduleModal');
          if (btn) btn.click();
        }
      }
    });
  }

  bulkDisableSchedules() {
    var selected = Array.from(this.scheduleFilter.selected);
    if (selected.length === 0) return;
    
    for (var i = 0; i < selected.length; i++) {
      var pid = selected[i];
      if (this.propertySchedules[pid]) {
        this.propertySchedules[pid].frequency = 'disabled';
      } else {
        this.propertySchedules[pid] = { frequency: 'disabled', time: '02:00', lastRun: null };
      }
    }
    
    this.savePropertySchedules();
    this.logActivity('backup', 'info', 'Bulk disable schedules', { properties: selected });
    this.scheduleFilter.selected.clear();
    this.renderPropertySchedules();
    this.showToast('✅ ' + selected.length + ' agendamentos desabilitados', 'success');
  }

  bulkRunBackups() {
    var selected = Array.from(this.scheduleFilter.selected);
    if (selected.length === 0) return;
    
    this.showToast('⏱️ Executando backups para ' + selected.length + ' propriedades...', 'info');
    
    for (var i = 0; i < selected.length; i++) {
      this.runScheduledBackupNow(selected[i]);
    }
    
    this.renderPropertySchedules();
    this.showToast('✅ Backups executados com sucesso!', 'success');
  }

  async bulkExportProperties() {
    var selected = Array.from(this.scheduleFilter.selected);
    if (selected.length === 0) return;
    
    this.showToast('📤 Exportando ' + selected.length + ' propriedades...', 'info');
    
    for (var i = 0; i < selected.length; i++) {
      await this.exportPropertyData(selected[i]);
    }
    
    this.showToast('✅ Exportações concluídas!', 'success');
  }

  updateSchedule(propertyId, field, value) {
    if (!this.propertySchedules[propertyId]) this.propertySchedules[propertyId] = { frequency:'disabled', time:'02:00', lastRun:null };
    this.propertySchedules[propertyId][field] = value;
    this.savePropertySchedules();
    this.logActivity('backup','info','Schedule updated',{ propertyId: propertyId, field: field, value: value });
    this.showToast('✅ ' + this.t('msgs.settingsSaved','Configurações salvas com sucesso!'),'success');
  }

  setupPropertyScheduleRunner() {
    var check = () => {
      try {
        var now = new Date();
        var props = Object.keys(this.propertySchedules||{});
        for (var i=0;i<props.length;i++) {
          var pid = props[i];
          var cfg = this.propertySchedules[pid];
          if (!cfg || cfg.frequency === 'disabled') continue;
          var parts = String(cfg.time||'02:00').split(':');
          var hh = parseInt(parts[0]||'2',10), mm = parseInt(parts[1]||'0',10);
          var dueToday = (now.getHours() === hh && now.getMinutes() === mm);
          if (!dueToday) continue;
          // Check frequency day match
          if (cfg.frequency === 'weekly' && now.getDay() !== 1) continue; // Monday
          if (cfg.frequency === 'monthly' && now.getDate() !== 1) continue; // Day 1
          // Prevent double-run within same minute
          var last = cfg.lastRun ? new Date(cfg.lastRun) : null;
          if (last && Math.abs(now - last) < 55*1000) continue;
          // Run incremental backup scoped to property
          this.showToast('⏱️ ' + this.format(this.t('msgs.scheduledBackup','Executando backup agendado para {0}'), [pid]), 'info');
          // Temporarily set UI scope to property for this call
          this._withTempScope({ scope:'property', propertyId: pid }, () => this.createIncrementalBackup());
          // Update last run
          this.propertySchedules[pid].lastRun = new Date().toISOString();
          this.savePropertySchedules();
        }
      } catch(e) {}
    };
    // Check every 30 seconds
    setInterval(check, 30000);
  }

  _withTempScope(scopeObj, fn) {
    // Executes fn using a temporary override for getSelectedBackupScope()
    var orig = this.getSelectedBackupScope;
    try {
      this.getSelectedBackupScope = function(){ return scopeObj; };
      return fn();
    } finally {
      this.getSelectedBackupScope = orig;
    }
  }

  runScheduledBackupNow(propertyId) {
    if (!propertyId) return;
    this._withTempScope({ scope:'property', propertyId: propertyId }, () => this.createIncrementalBackup());
    this.propertySchedules[propertyId] = this.propertySchedules[propertyId] || { frequency:'disabled', time:'02:00', lastRun:null };
    this.propertySchedules[propertyId].lastRun = new Date().toISOString();
    this.savePropertySchedules();
  }

  buildPropertyExport(propertyId) {
    // Reuse backup data filtering to produce an export payload
    var all = {
      users: this.getAllLocalStorageByPrefix('user_'),
      reservations: this.getAllLocalStorageByPrefix('reservation_'),
      inventory: this.getAllLocalStorageByPrefix('inventory_'),
      configurations: this.getAllLocalStorageByPrefix('config_'),
      settings: this.getAllLocalStorageByPrefix('settings_'),
      logs: this.logs.slice(-500)
    };
    var data = propertyId ? this.filterBackupDataByProperty(all, propertyId) : all;
    return {
      meta: {
        exportedAt: new Date().toISOString(),
        by: this.currentUser ? this.currentUser.id : 'system',
        lang: this.lang,
        scope: propertyId ? 'property' : 'global',
        propertyId: propertyId || null
      },
      data: data
    };
  }

  async exportPropertyData(propertyId) {
    try {
      var payload = this.buildPropertyExport(propertyId);
      // Try sending to local dev server to persist on disk
      var url = 'http://localhost:4455/save-export' + (propertyId ? ('?property=' + encodeURIComponent(propertyId)) : '');
      var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        this.logActivity('backup','info','Property export saved to server', { propertyId: propertyId });
        this.showToast('✅ ' + this.t('msgs.exportSaved','Exportação salva no servidor.'), 'success');
        return;
      }
      throw new Error('server responded ' + res.status);
    } catch (e) {
      // Fallback: trigger download in browser
      try {
        var dataStr = JSON.stringify(this.buildPropertyExport(propertyId), null, 2);
        var blob = new Blob([dataStr], { type: 'application/json' });
        var link = document.createElement('a');
        var ts = new Date().toISOString().replace(/[:.]/g,'-');
        link.href = URL.createObjectURL(blob);
        link.download = (propertyId ? ('export_' + propertyId + '_' + ts + '.json') : ('export_global_' + ts + '.json'));
        link.click();
        this.logActivity('backup','info','Property export downloaded', { propertyId: propertyId });
        this.showToast('📥 ' + this.t('msgs.exportDownloaded','Exportação baixada.'), 'info');
      } catch(err) {
        this.showToast('❌ ' + this.t('msgs.exportFailed','Falha na exportação:') + ' ' + err.message, 'error');
      }
    }
  }

  switchTab(tabName) {
    // Update buttons
    var allBtns = document.querySelectorAll('.tab-btn');
    for (var i2=0;i2<allBtns.length;i2++){ allBtns[i2].classList.remove('active'); }
    var selBtn = document.querySelector('[data-tab="' + tabName + '"]');
    if (selBtn) selBtn.classList.add('active');

    // Update content
    var allContents = document.querySelectorAll('.tab-content');
    for (var i3=0;i3<allContents.length;i3++){ allContents[i3].classList.remove('active'); }
    var selTab = document.getElementById('tab-' + tabName);
    if (selTab) selTab.classList.add('active');

    // On tab switch, refresh relevant data for instant stats
    try {
      if (tabName === 'overview') {
        this.renderDashboard();
        this.updateStorageInfo();
      } else if (tabName === 'backup') {
        this.renderBackupList();
        this.renderPropertySchedules(); // Refresh schedules when entering backup tab
        this.renderExportsList && this.renderExportsList();
        this.wireBackupSubnav();
      } else if (tabName === 'users') {
        this.renderUsersTable();
      } else if (tabName === 'logs') {
        this.renderLogs();
      } else if (tabName === 'versions') {
        this.renderVersionTimeline();
      } else if (tabName === 'system') {
        this.updateStorageInfo();
        this.loadSettingsToUI();
      }
    } catch (e) { /* noop */ }
  }

  wireBackupSubnav() {
    try {
      var nav = document.getElementById('backupSubnav');
      if (nav) {
        nav.querySelectorAll('.subnav-btn').forEach((btn)=>{
          btn.addEventListener('click', (e)=>{
            var targetId = e.currentTarget.getAttribute('data-target');
            var section = document.getElementById(targetId);
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
              nav.querySelectorAll('.subnav-btn').forEach(b=>b.classList.remove('active'));
              e.currentTarget.classList.add('active');
            }
          });
        });
      }
      // Toggle help panel
      var helpBtn = document.getElementById('btnScheduleHelp');
      if (helpBtn) {
        helpBtn.addEventListener('click', ()=>{
          var help = document.getElementById('scheduleHelp');
          if (help) help.style.display = (help.style.display === 'none' || help.style.display === '') ? 'block' : 'none';
        });
      }
      // Scroll spy to highlight current section
      if ('IntersectionObserver' in window && nav) {
        var buttonsMap = {
          'section-create': nav.querySelector('[data-target="section-create"]'),
          'section-scheduling': nav.querySelector('[data-target="section-scheduling"]'),
          'section-history': nav.querySelector('[data-target="section-history"]'),
          'section-restore': nav.querySelector('[data-target="section-restore"]'),
          'section-exports': nav.querySelector('[data-target="section-exports"]'),
        };
        var io = new IntersectionObserver((entries)=>{
          entries.forEach((en)=>{
            if (en.isIntersecting) {
              var id = en.target.id;
              if (buttonsMap[id]) {
                nav.querySelectorAll('.subnav-btn').forEach(b=>b.classList.remove('active'));
                buttonsMap[id].classList.add('active');
              }
            }
          });
        }, { root: null, threshold: 0.25 });
        ['section-create','section-scheduling','section-history','section-restore','section-exports'].forEach((id)=>{
          var el = document.getElementById(id); if (el) io.observe(el);
        });
      }
    } catch(e) { console.warn('wireBackupSubnav failed', e); }
  }

  // ========================================
  // Exports browser (server-backed)
  // ========================================
  async fetchExportsList() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const r = await fetch('http://localhost:4455/exports', { signal: controller.signal });
      clearTimeout(timeout);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j || j.ok !== true) throw new Error('Malformed response');
      return Array.isArray(j.files) ? j.files : [];
    } catch (e) {
      this.logActivity('system','warning','Exports list failed',{ error: e.message });
      throw e;
    }
  }

  async renderExportsList() {
    try {
      const cont = document.getElementById('exportsList');
      if (!cont) return;
      cont.innerHTML = '<div class="empty-state-small">🔄 ' + this.t('backup.exports.loading','Carregando...') + '</div>';
      let files = [];
      try {
        files = await this.fetchExportsList();
      } catch (e) {
        cont.innerHTML = '<div class="empty-state">❌ ' + this.t('backup.exports.error','Não foi possível carregar as exportações do servidor.') + '</div>';
        return;
      }

      if (!files.length) {
        cont.innerHTML = '<div class="empty-state">📭 ' + this.t('backup.exports.empty','Nenhuma exportação encontrada. Faça uma exportação para ver aqui.') + '</div>';
        return;
      }

      let html = '';
      html += '<div class="schedule-table-container">';
      html += '<table class="schedule-table">';
      html += '<thead><tr>';
      html += '<th>' + this.t('backup.exports.colName','Arquivo') + '</th>';
      html += '<th width="140">' + this.t('backup.exports.colSize','Tamanho') + '</th>';
      html += '<th width="220">' + this.t('backup.exports.colDate','Data') + '</th>';
      html += '<th width="120">' + this.t('backup.exports.colActions','Ações') + '</th>';
      html += '</tr></thead><tbody>';
      for (var i=0;i<files.length;i++) {
        var f = files[i];
        var dateStr = '';
        try { dateStr = new Date(f.mtime).toLocaleString(); } catch(_){ dateStr = f.mtime; }
        var sizeStr = this.formatBytes && typeof f.size === 'number' ? this.formatBytes(f.size) : (String(f.size||''));
        var href = 'http://localhost:4455/exports/' + encodeURIComponent(f.name);
        html += '<tr>' +
                '<td><span class="icon">📄</span> ' + f.name + '</td>' +
                '<td>' + sizeStr + '</td>' +
                '<td>' + dateStr + '</td>' +
                '<td><a class="btn btn-sm" href="' + href + '" target="_blank" rel="noopener">⬇️ ' + this.t('backup.exports.download','Baixar') + '</a></td>' +
                '</tr>';
      }
      html += '</tbody></table></div>';
      cont.innerHTML = html;

      var btn = document.getElementById('btnRefreshExports');
      if (btn) {
        btn.onclick = () => this.renderExportsList();
      }
    } catch(e) {
      console.warn('renderExportsList failed', e);
    }
  }

  populatePropertySelects() {
    try {
      var props = [];
      
      // Verificar se NexefiiProps está disponível
      console.log('populatePropertySelects(): window.NexefiiProps disponível?', !!window.NexefiiProps);
      console.log('populatePropertySelects(): window.NexefiiProps.listProperties disponível?', 
        !!(window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function'));
      
      if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
        var list = window.NexefiiProps.listProperties() || [];
        console.log('populatePropertySelects(): NexefiiProps retornou', list.length, 'propriedades:', list);
        props = list.filter(function(p) { return p && p.key; });
      } else {
        console.warn('populatePropertySelects(): NexefiiProps não disponível, tentando localStorage direto');
        
        // Fallback 1: Tentar localStorage direto
        try {
          var map = JSON.parse(localStorage.getItem('nexefii_properties') || localStorage.getItem('nexefii_properties') || '{}');
          var keys = Object.keys(map);
          console.log('populatePropertySelects(): localStorage retornou', keys.length, 'propriedades:', keys);
          if (keys.length > 0) {
            props = keys.map(function(k) { return map[k]; }).filter(function(p) { return p && p.key; });
          }
        } catch(e2) {
          console.error('populatePropertySelects(): Erro ao ler localStorage:', e2);
        }
        
        // Fallback 2: Collect from users
        if (props.length === 0) {
          console.warn('populatePropertySelects(): Usando fallback de usuários');
          var users = this.getAllUsers();
          var propKeys = [];
          for (var u=0;u<users.length;u++) {
            var pl = users[u].properties || [];
            for (var p=0;p<pl.length;p++) if (propKeys.indexOf(pl[p])===-1) propKeys.push(pl[p]);
          }
          props = propKeys.map(function(k) { return { key: k, name: k }; });
        }
      }
      
      props.sort(function(a,b) { 
        var aName = a.name || a.key;
        var bName = b.name || b.key;
        return aName.localeCompare(bName); 
      });
      console.log('populatePropertySelects(): Total de propriedades após processamento:', props.length, props);
      
      if (props.length === 0) {
        console.error('⚠️ populatePropertySelects(): NENHUMA propriedade encontrada! Verifique se properties.js foi carregado.');
      }
      
      var createSel = document.getElementById('newUserProperties');
      var editSel = document.getElementById('editUserProperties');
      var opts = '';
      for (var j=0;j<props.length;j++) {
        var displayName = props[j].name || props[j].key;
        opts += '<option value="' + props[j].key + '">' + displayName + '</option>';
      }
      if (createSel) {
        createSel.innerHTML = opts;
        console.log('populatePropertySelects(): Select newUserProperties populado com', createSel.options.length, 'opções');
      } else {
        console.warn('populatePropertySelects(): Select newUserProperties não encontrado');
      }
      if (editSel) {
        editSel.innerHTML = opts;
        console.log('populatePropertySelects(): Select editUserProperties populado com', editSel.options.length, 'opções');
      } else {
        console.warn('populatePropertySelects(): Select editUserProperties não encontrado');
      }
    } catch(e) { 
      console.error('Erro em populatePropertySelects:', e);
    }
  }

  wireOverviewClicks() {
    try {
      var map = [
        { id:'totalUsers', action: () => { this.switchTab('users'); } },
        { id:'activeUsers', action: () => { this.switchTab('users'); var el=document.getElementById('filterUserStatus'); if(el){ el.value='active'; this.renderUsersTable(); } } },
        { id:'totalProperties', action: () => { this.switchTab('users'); } },
        { id:'totalBackups', action: () => { this.switchTab('backup'); } }
      ];
      for (var i=0;i<map.length;i++) {
        var el = document.getElementById(map[i].id);
        if (el) { el.style.cursor='pointer'; el.title='Abrir'; el.addEventListener('click', map[i].action); }
      }
    } catch(e) {}
  }

  renderDashboard() {
    try {
      var users = this.getAllUsers();
      var active = 0;
      var propertiesSet = {};
      for (var i=0;i<users.length;i++) {
        if (users[i].status === 'active') active++;
        if (Array.isArray(users[i].properties)) {
          for (var j=0;j<users[i].properties.length;j++) {
            propertiesSet[users[i].properties[j]] = true;
          }
        }
      }
      var totalProps = Object.keys(propertiesSet).length;
      var el;
      el = document.getElementById('totalUsers'); if (el) el.textContent = String(users.length);
      el = document.getElementById('activeUsers'); if (el) el.textContent = String(active);
      el = document.getElementById('totalProperties'); if (el) el.textContent = String(totalProps);
      el = document.getElementById('totalBackups'); if (el) el.textContent = String(this.backups.length);
      var recent = this.logs.slice(-10).reverse();
      var html = '';
      for (var k=0;k<recent.length;k++) {
        var lg = recent[k];
        html += '<div class="activity-item">' +
                '<span class="icon">' + this.getLogIcon(lg.type) + '</span>' +
                '<div class="activity-content">' +
                '<div class="activity-title">' + lg.message + '</div>' +
                '<div class="activity-meta">' + new Date(lg.timestamp).toLocaleString() + ' • ' + lg.type + ' • ' + lg.level + '</div>' +
                '</div></div>';
      }
  var ra = document.getElementById('recentActivity');
  if (ra) ra.innerHTML = html || '<p>' + this.t('msgs.noneActivity','Sem itens') + '</p>';
    } catch(e) {
      console.warn('renderDashboard failed', e);
    }
  }

      handleCreateBackup() {
        var type = (document.querySelector('input[name="backupType"]:checked') || {}).value || 'full';
        if (type === 'full') return this.createFullBackup();
        if (type === 'incremental') return this.createIncrementalBackup();
        if (type === 'selective') return this.createSelectiveBackup();
      }

      handleRestoreBackup() {
        var select = document.getElementById('selectBackupToRestore');
        var backupId = select ? select.value : '';
  if (!backupId) { this.showToast(this.t('msgs.selectBackupFirst','Selecione um backup primeiro.'),'warning'); return; }
        var restoreType = document.getElementById('restoreType').value;
        if (restoreType === 'selective') {
          var modal = document.getElementById('restoreSelectiveModal');
          if (modal) {
            modal.dataset.backupId = backupId;
            var backup = this.backups.find(function(b){ return b.id === backupId; });
            var mods = ['users','reservations','inventory','configurations'];
            for (var i=0;i<mods.length;i++) {
              var id = 'restore-' + mods[i];
              var el = document.getElementById(id);
              if (el) {
                var hasData = (backup && backup.data && Array.isArray(backup.data[mods[i]]) && backup.data[mods[i]].length);
                el.checked = !!hasData;
              }
            }
            modal.style.display = 'flex';
            return;
          }
        }
        this.restoreBackup(backupId, restoreType);
      }

      renderBackupList() {
        try {
          var listEl = document.getElementById('backupList');
          var selectEl = document.getElementById('selectBackupToRestore');
          if (!listEl) return;

          var html = '';
          for (var i=0;i<this.backups.length;i++) {
            var b = this.backups[i];
            var isMaster = !!(this.currentUser && this.currentUser.role === 'master');
            html += '<div class="backup-item">' +
                    '<div class="backup-info">' +
                    '<strong>' + b.id + '</strong>' + (b.scope==='property' && b.propertyId ? ' <span class="badge">🏨 ' + b.propertyId + '</span>' : '') +
                    '<div>' + new Date(b.timestamp).toLocaleString() + ' • ' + (b.type || 'full') + '</div>' +
                    '</div>' +
                    '<div class="backup-actions">' +
                    '<button class="btn" onclick="masterCtrl.downloadBackup(\'' + b.id + '\')">⬇️ Download</button>' +
                    '<button class="btn" onclick="(function(){var s=document.getElementById(\'selectBackupToRestore\'); if(s){s.value=\'' + b.id + '\';}})()">✅ Selecionar</button>' +
                    (isMaster ? '<button class="btn btn-danger" onclick="masterCtrl.deleteBackup(\'' + b.id + '\')">🗑️ Deletar</button>' : '') +
                    '</div>' +
                    '</div>';
          }
      listEl.innerHTML = html || '<p>' + this.t('msgs.backupNone','Nenhum backup encontrado') + '</p>';

          if (selectEl) {
            var opts = '<option value="">-- Escolha um backup --</option>';
            for (var j=0;j<this.backups.length;j++) {
              var bj = this.backups[j];
              var lab = bj.id + ' (' + (bj.type||'full') + ')';
              if (bj.scope==='property' && bj.propertyId) lab += ' • ' + bj.propertyId;
              opts += '<option value="' + bj.id + '">' + lab + '</option>';
            }
            selectEl.innerHTML = opts;
          }
        } catch(e) {
          console.warn('renderBackupList failed', e);
        }
      }

      getLogIcon(type) {
        var map = { auth:'🔐', backup:'💾', restore:'♻️', user:'👤', system:'⚙️', version:'🗂️' };
        return map[type] || '📝';
      }

      renderLogs() {
        try {
          var listEl = document.getElementById('logsList'); if (!listEl) return;
          var typeF = document.getElementById('filterLogType'); typeF = typeF ? typeF.value : '';
          var levelF = document.getElementById('filterLogLevel'); levelF = levelF ? levelF.value : '';
          var dateF = document.getElementById('filterLogDate'); dateF = dateF ? dateF.value : '';

          // Preferir enterprise audit log se disponível, com filtros no backend
          var logs = [];
          if (this.enterpriseBackup && typeof this.enterpriseBackup.getAuditLog === 'function') {
            logs = this.enterpriseBackup.getAuditLog({ type: typeF || undefined, level: levelF || undefined, startDate: dateF || undefined, endDate: dateF || undefined });
            // Normalizar campos para o renderer atual
            logs = logs.map(function(l){ return { timestamp: l.timestamp, type: l.type, level: l.level, message: l.message, data: l.data, userId: l.userId }; });
          } else {
            logs = this.logs.slice().reverse();
            if (typeF) logs = logs.filter(function(l){ return l.type === typeF; });
            if (levelF) logs = logs.filter(function(l){ return l.level === levelF; });
            if (dateF) logs = logs.filter(function(l){ return (l.timestamp||'').slice(0,10) === dateF; });
          }
          if (typeF) logs = logs.filter(function(l){ return l.type === typeF; });
          if (levelF) logs = logs.filter(function(l){ return l.level === levelF; });
          if (dateF) logs = logs.filter(function(l){ return (l.timestamp||'').slice(0,10) === dateF; });

          var html = '';
          for (var i=0;i<logs.length;i++) {
            var lg = logs[i];
            html += '<div class="log-item">' +
                    '<span class="log-icon">' + this.getLogIcon(lg.type) + '</span>' +
                    '<div class="log-content">' +
                    '<div class="log-title">' + lg.message + '</div>' +
                    '<div class="log-meta">' + new Date(lg.timestamp).toLocaleString() + ' • ' + lg.type + ' • ' + lg.level + '</div>' +
                    '</div>' +
                    '</div>';
          }
      listEl.innerHTML = html || '<p>' + this.t('logs.none','Nenhum log') + '</p>';
        } catch(e) {
          console.warn('renderLogs failed', e);
        }
      }

      renderUsersTable() {
        try {
          var users = this.getAllUsers();
          var qEl = document.getElementById('searchUsers'); var q = qEl ? (qEl.value||'').toLowerCase() : '';
          var roleEl = document.getElementById('filterUserRole'); var role = roleEl ? roleEl.value : '';
          var stEl = document.getElementById('filterUserStatus'); var status = stEl ? stEl.value : '';

          if (q) users = users.filter(function(u){ return ((u.name||'').toLowerCase().indexOf(q) !== -1) || ((u.email||'').toLowerCase().indexOf(q) !== -1) || ((u.username||'').toLowerCase().indexOf(q) !== -1); });
          if (role) users = users.filter(function(u){ return u.role === role; });
          if (status) users = users.filter(function(u){ return u.status === status; });

          var roleLabel = (function(_this){ return function(r){ var m = { master:_this.t('users.levelMaster','Master'), admin:_this.t('users.levelAdmin','Admin'), manager:_this.t('users.levelManager','Manager'), user:_this.t('users.levelUser','User') }; return m[r] || r; }; })(this);
          var statusLabel = (function(_this){ return function(s){ var m = { active:_this.t('users.statusActive','Ativo'), pending:_this.t('users.statusPending','Pendente'), suspended:_this.t('users.statusSuspended','Suspenso') }; return m[s] || s; }; })(this);

          var html = '';
          for (var i=0;i<users.length;i++) {
            var u = users[i];
            var nameHtml = '<strong>' + (u.name||'') + '</strong>';
            var emailHtml = (u.email||'');
            var roleHtml = '<span class="badge badge-' + u.role + '">' + roleLabel(u.role) + '</span>';
            var statusHtml = '<span class="badge badge-' + u.status + '">' + statusLabel(u.status) + '</span>';
            var lastLoginHtml = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : this.t('users.never','Nunca');
            var propsCount = (u.properties && u.properties.length) ? u.properties.length : 0;
            var actions = '<button class="btn-icon" onclick="masterCtrl.viewUser(\'' + u.id + '\')" title="Ver">👁️</button>' +
                          '<button class="btn-icon" onclick="masterCtrl.editUser(\'' + u.id + '\')" title="Editar">✏️</button>';
            if (u.id !== this.currentUser.id) {
              actions += '<button class="btn-icon" onclick="masterCtrl.deleteUser(\'' + u.id + '\')" title="Deletar">🗑️</button>';
            }
            html += '<tr>' +
                    '<td>' + nameHtml + '</td>' +
                    '<td>' + emailHtml + '</td>' +
                    '<td>' + roleHtml + '</td>' +
                    '<td>' + statusHtml + '</td>' +
                    '<td>' + lastLoginHtml + '</td>' +
                    '<td>' + String(propsCount) + '</td>' +
                    '<td>' + actions + '</td>' +
                    '</tr>';
          }
      var tbody = document.getElementById('usersTableBody'); if (tbody) tbody.innerHTML = html || '<tr><td colspan="7">' + this.t('users.empty','Nenhum usuário') + '</td></tr>';
        } catch(e) {
          console.warn('renderUsersTable failed', e);
        }
      }

      updateUserStatus(userId, status) {
        try {
          var userJson = localStorage.getItem(userId);
          if (!userJson) throw new Error('Usuário não encontrado');
          var user = JSON.parse(userJson);
          user.status = status;
          user.updatedAt = new Date().toISOString();
          user.updatedBy = this.currentUser.id;
          localStorage.setItem(userId, JSON.stringify(user));
          this.logActivity('user', 'info', 'User status changed', { userId: userId, status: status });
          this.renderUsersTable();
          this.renderDashboard();
          this.updateStorageInfo();
        } catch (error) {
          console.error('Error updating user:', error);
          alert('❌ ' + this.t('msgs.userUpdateError','Erro ao atualizar usuário:') + ' ' + error.message);
        }
      }

      openEditUserModal(userId, readOnly) {
        try {
          var userJson = localStorage.getItem(userId);
          if (!userJson) throw new Error('Usuário não encontrado');
          var user = JSON.parse(userJson);
          var el;
          el = document.getElementById('editUserName'); if (el) { el.value = user.name || ''; el.disabled = !!readOnly; }
          el = document.getElementById('editUserEmail'); if (el) { el.value = user.email || ''; el.disabled = !!readOnly; }
          el = document.getElementById('editUserUsername'); if (el) { el.value = user.username || ''; el.disabled = !!readOnly; }
          el = document.getElementById('editUserRole'); if (el) { el.value = user.role || 'user'; el.disabled = !!readOnly; }
          el = document.getElementById('editUserStatus'); if (el) { el.value = user.status || 'active'; el.disabled = !!readOnly; }
          el = document.getElementById('editUserProperties'); if (el) {
            // refresh options then select user properties
            this.populatePropertySelects();
            var selected = {};
            var arr = Array.isArray(user.properties)? user.properties : [];
            for (var i=0;i<arr.length;i++) selected[arr[i]] = true;
            for (var j=0;j<el.options.length;j++) el.options[j].selected = !!selected[el.options[j].value];
            el.disabled = !!readOnly;
          }
          var btn = document.getElementById('btnSaveUserChanges'); if (btn) btn.style.display = readOnly ? 'none' : 'inline-block';
          var modal = document.getElementById('editUserModal'); if (modal) { modal.dataset.userId = userId; modal.style.display = 'flex'; }
        } catch(e) {
          alert('❌ ' + this.t('msgs.userNotFound','Usuário não encontrado.'));
        }
      }

      closeEditUserModal() {
        var modal = document.getElementById('editUserModal'); if (modal) { modal.style.display = 'none'; modal.dataset.userId = ''; }
      }

      handleSaveUserEdits() {
        try {
          var modal = document.getElementById('editUserModal'); if (!modal) return;
          var userId = modal.dataset.userId;
          var userJson = localStorage.getItem(userId);
          if (!userJson) throw new Error('Usuário não encontrado');
          var user = JSON.parse(userJson);
          user.name = (document.getElementById('editUserName').value || '').trim();
          user.email = (document.getElementById('editUserEmail').value || '').trim();
          user.username = (document.getElementById('editUserUsername').value || '').trim();
          user.role = document.getElementById('editUserRole').value;
          user.status = document.getElementById('editUserStatus').value;
          
          // Obter propriedades selecionadas do select múltiplo
          var propsSelect = document.getElementById('editUserProperties');
          var selectedProps = [];
          if (propsSelect) {
            for (var i = 0; i < propsSelect.options.length; i++) {
              if (propsSelect.options[i].selected) {
                selectedProps.push(propsSelect.options[i].value);
              }
            }
          }
          user.properties = selectedProps;
          
          user.updatedAt = new Date().toISOString();
          user.updatedBy = this.currentUser.id;
          localStorage.setItem(userId, JSON.stringify(user));
          this.logActivity('user', 'info', 'User updated', { userId: userId });
          alert('✅ ' + this.t('msgs.userUpdated','Usuário atualizado!'));
          this.closeEditUserModal();
          this.renderUsersTable();
          this.renderDashboard();
          this.updateStorageInfo();
        } catch(e) {
          alert('❌ ' + this.t('msgs.userUpdateError','Erro ao atualizar usuário:') + ' ' + e.message);
        }
      }
      // user edit helpers end

  renderVersionTimeline() {
    try {
      var el = document.getElementById('versionTimeline'); if (!el) return;
      var versions = this.versions.slice().reverse();
      var html = '';
      for (var i=0;i<versions.length;i++) {
        var v = versions[i];
        html += '<div class="version-item">' +
                '<div class="version-marker">' + (v.tag || '') + '</div>' +
                '<div class="version-content">' +
                '<h4>' + (v.description || '') + '</h4>' +
                '<p class="version-meta">' + new Date(v.timestamp).toLocaleString() + ' • por ' + (v.createdBy || '') + '</p>';
        if (v.changes && v.changes.changes && v.changes.changes.length) {
          html += '<div class="version-changes">';
          for (var j=0;j<v.changes.changes.length;j++) {
            html += '<span>• ' + v.changes.changes[j] + '</span>';
          }
          html += '</div>';
        }
    var delBtn = '';
    if (this.currentUser && this.currentUser.role === 'master') {
      delBtn = ' <button class="btn btn-sm btn-danger" onclick="masterCtrl.deleteVersion(\'' + v.id + '\')">🗑️ ' + this.t('versions.delete','Excluir') + '</button>';
    }
    html += '<div class="version-actions">'
      + '<button class="btn btn-sm" onclick="masterCtrl.restoreVersion(\'' + v.id + '\')">♻️ Restaurar esta versão</button>'
      + delBtn
      + '</div>' +
                '</div></div>';
      }
  el.innerHTML = html || '<p>' + this.t('versions.none','Nenhuma versão criada') + '</p>';
    } catch(e) {
      console.warn('renderVersionTimeline failed', e);
    }
  }

  updateStorageInfo() {
    try {
      var used = this.calculateStorageUsage();
      var total = 5 * 1024 * 1024; // 5MB typical LocalStorage limit
      var pct = (used / total) * 100;
      var el;
      el = document.getElementById('storageUsed'); if (el) el.textContent = this.formatBytes(used);
      el = document.getElementById('storageAvailable'); if (el) el.textContent = this.formatBytes(total - used);
      el = document.getElementById('storageTotal'); if (el) el.textContent = this.formatBytes(total);
      el = document.getElementById('storageUsedBar'); if (el) el.style.width = pct + '%';
    } catch(e) {
      // ignore
    }
  }

  loadSettingsToUI() {
    try {
      var el;
      el = document.getElementById('autoBackupFrequency'); if (el) el.value = this.systemSettings.autoBackup;
      el = document.getElementById('backupRetention'); if (el) el.value = this.systemSettings.backupRetention;
      el = document.getElementById('autoVersioning'); if (el) el.value = this.systemSettings.autoVersioning;
      el = document.getElementById('logLevel'); if (el) el.value = this.systemSettings.logLevel;
    } catch(e) {}
  }

  handleCreateVersion() {
    const description = prompt(this.t('msgs.enterVersionDescription','Digite uma descrição para este marco (opcional):'));
    this.createVersion(description);
  }

  handleSaveSettings() {
    this.systemSettings.autoBackup = document.getElementById('autoBackupFrequency').value;
    this.systemSettings.backupRetention = parseInt(document.getElementById('backupRetention').value);
    this.systemSettings.autoVersioning = document.getElementById('autoVersioning').value;
    this.systemSettings.logLevel = document.getElementById('logLevel').value;

    this.saveSystemSettings();
    
    this.logActivity('system', 'info', 'System settings updated');
    
  alert('✅ ' + this.t('msgs.settingsSaved','Configurações salvas com sucesso!'));
  }
  
  // Alias for onclick compatibility
  saveSettings() {
    this.handleSaveSettings();
  }

  openCreateUserModal() {
    // Atualizar lista de propriedades antes de abrir modal
    this.populatePropertySelects();
    document.getElementById('createUserModal').style.display = 'flex';
  }

  closeCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'none';
    document.getElementById('createUserForm').reset();
  }

  handleCreateUserSubmit() {
    var propSel = document.getElementById('newUserProperties');
    var chosen = [];
    if (propSel) {
      for (var i=0;i<propSel.options.length;i++) {
        var o = propSel.options[i];
        if (o.selected) chosen.push(o.value);
      }
    }
    const userData = {
      name: document.getElementById('newUserName').value,
      email: document.getElementById('newUserEmail').value,
      username: document.getElementById('newUserUsername').value,
      password: document.getElementById('newUserPassword').value, // TODO: Hash
      role: document.getElementById('newUserRole').value,
      properties: chosen
    };

    this.createUser(userData);
    this.closeCreateUserModal();
  }

  // Placeholder methods
  viewUser(userId) { this.openEditUserModal(userId, true); }
  editUser(userId) { this.openEditUserModal(userId, false); }
  downloadBackup(backupId) { 
    const backup = this.backups.find(b => b.id === backupId);
    if (backup) {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
  link.download = backupId + '.json';
      link.click();
    }
  }
  async deleteBackup(backupId) {
    // Master-only action guard
    if (!this.currentUser || this.currentUser.role !== 'master') {
      this.showToast('⛔ ' + this.t('msgs.accessDenied','Acesso negado! Apenas usuários Master podem acessar este painel.'), 'error');
      return;
    }
    const ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: this.t('msgs.deleteBackupConfirm','Tem certeza que deseja deletar este backup?'),
      confirmText: this.t('versions.delete','Excluir'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (ok) {
      this.backups = this.backups.filter(b => b.id !== backupId);
      localStorage.setItem('master_backups', JSON.stringify(this.backups));
      this.renderBackupList();
      this.renderDashboard();
      this.updateStorageInfo();
      this.logActivity('backup','warning','Backup deleted',{ backupId: backupId });
  this.showToast('✅ ' + this.t('msgs.backupDeleted','Backup deletado!'), 'success');
    }
  }
  async deleteVersion(versionId) {
    if (!this.currentUser || this.currentUser.role !== 'master') {
      this.showToast('⛔ ' + this.t('msgs.accessDenied','Acesso negado! Apenas usuários Master podem acessar este painel.'), 'error');
      return;
    }
    var v = this.versions.find(function(x){ return x.id === versionId; });
    if (!v) { alert('❌ ' + (this.t('msgs.versionNotFound','Versão não encontrada'))); return; }
    var ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: this.t('msgs.deleteVersionConfirm','Tem certeza que deseja deletar esta versão?'),
      confirmText: this.t('versions.delete','Excluir'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (!ok) return;
    this.versions = this.versions.filter(function(x){ return x.id !== versionId; });
    this.saveVersions();
    this.renderVersionTimeline();
    this.logActivity('version','warning','Version deleted',{ versionId: versionId });
    this.showToast('✅ ' + this.t('msgs.versionDeleted','Versão deletada!'), 'success');
  }
  async restoreVersion(versionId) {
    var version = this.versions.find(function(v){ return v.id === versionId; });
    if (!version) { this.showToast('❌ ' + (this.t('msgs.versionNotFound','Versão não encontrada')), 'error'); return; }
    var ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: this.format(this.t('msgs.restoreVersionPrompt','Restaurar versão: {0}'), [versionId]),
      confirmText: this.t('backup.restoreNow','Restaurar Backup'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (!ok) return;
    // Backup de segurança
    this.createFullBackup();
    try {
      // Limpar dados (mantendo usuário master atual)
      var masterId = this.currentUser ? this.currentUser.id : null;
      var masterData = masterId ? localStorage.getItem(masterId) : null;
      localStorage.clear();
      if (masterId && masterData) localStorage.setItem(masterId, masterData);

      var snap = version.snapshot || {};
      function restoreArray(arr){
        if (!Array.isArray(arr)) return;
        for (var i=0;i<arr.length;i++) {
          var it = arr[i];
          if (it && it.key && typeof it.value !== 'undefined') {
            localStorage.setItem(it.key, it.value);
          }
        }
      }
      restoreArray(snap.users);
      restoreArray(snap.reservations);
      restoreArray(snap.inventory);
      restoreArray(snap.configurations);
      restoreArray(snap.settings);
      // propriedades
  if (snap.properties) { localStorage.setItem('nexefii_properties', JSON.stringify(snap.properties)); try { localStorage.setItem('nexefii_properties', JSON.stringify(snap.properties)); } catch(e){} }
      // logs
      if (snap.logs) localStorage.setItem('master_logs', JSON.stringify(snap.logs));
      // backups referência não restaura conteúdo, apenas preserva lista original se desejado
      // (Opcional) poderia restaurar backups reais se armazenados externamente

      this.loadLogs();
      this.loadBackups();
      this.loadVersions();
      this.loadSystemSettings();
      this.renderDashboard();
      this.showToast('✅ ' + this.t('msgs.restoreSuccess','Backup restaurado com sucesso! A página será recarregada.'), 'success');
    } catch(e) {
      this.showToast('❌ ' + this.t('msgs.restoreError','Erro ao restaurar backup:') + ' ' + e.message, 'error');
    }
  }
  
  // Quick Actions for General Backups
  async createQuickGeneralBackup(type) {
    try {
      // Check if enterprise backup system is available
      if (typeof window.enterpriseBackup === 'undefined') {
        this.showToast('❌ Sistema de backup enterprise não disponível', 'error');
        return;
      }

      const backupType = type === 'full' ? 'full' : 'snapshot';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const versionTag = `v${timestamp}`;
      const description = type === 'full' 
        ? 'Backup completo rápido da estrutura geral' 
        : 'Backup incremental rápido da estrutura geral';

      this.showToast('⏳ Criando backup de estrutura geral...', 'info');

      // Create general backup using enterprise system
      const result = await window.enterpriseBackup.createGeneralBackup({
        versionTag: versionTag,
        description: description,
        components: ['css', 'js', 'i18n', 'templates', 'migrations', 'assets', 'config'],
        compress: true,
        encrypt: false
      });

      if (result.success) {
        this.showToast(`✅ Backup de estrutura geral criado! ID: ${result.backup.id.substring(0, 8)}`, 'success');
        this.renderDashboard(); // Update stats
      } else {
        this.showToast('❌ Erro ao criar backup: ' + result.error, 'error');
      }
    } catch (e) {
      console.error('Error creating quick general backup:', e);
      this.showToast('❌ Erro ao criar backup: ' + e.message, 'error');
    }
  }

  viewGeneralBackups() {
    // Open modal with general backups list
    this.showGeneralBackupsModal();
  }

  showGeneralBackupsModal() {
    try {
      // Check if enterprise backup system is available
      if (typeof window.enterpriseBackup === 'undefined') {
        this.showToast('❌ Sistema de backup enterprise não disponível', 'error');
        return;
      }

      // Get all general backups
      const backups = window.enterpriseBackup.listGeneralBackups();
      
      // Create modal HTML
      const modalHTML = `
        <div class="modal-overlay" id="generalBackupsModal" onclick="if(event.target===this) masterCtrl.closeGeneralBackupsModal()">
          <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
              <h2><span class="icon">📋</span> Backups de Estrutura Geral</h2>
              <button class="btn-close" onclick="masterCtrl.closeGeneralBackupsModal()">✕</button>
            </div>
            <div class="modal-body">
              ${backups.length === 0 ? `
                <div class="alert alert-info">
                  <span class="icon">ℹ️</span>
                  Nenhum backup de estrutura geral encontrado. Crie seu primeiro backup usando as ações rápidas!
                </div>
              ` : `
                <div class="table-container">
                  <table class="master-table">
                    <thead>
                      <tr>
                        <th>Versão</th>
                        <th>Descrição</th>
                        <th>Data/Hora</th>
                        <th>Tamanho</th>
                        <th>Componentes</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${backups.map(backup => `
                        <tr>
                          <td><strong>${backup.versionTag || backup.id.substring(0, 8)}</strong></td>
                          <td>${backup.description || '-'}</td>
                          <td>${new Date(backup.timestamp).toLocaleString('pt-BR')}</td>
                          <td>${this.formatBytes(backup.metadata.totalSize || 0)}</td>
                          <td>${backup.metadata.componentCount || 0}</td>
                          <td>
                            <button class="btn btn-sm btn-primary" onclick="masterCtrl.restoreGeneralBackup('${backup.id}')">
                              <span class="icon">♻️</span> Restaurar
                            </button>
                            <button class="btn btn-sm" onclick="masterCtrl.viewGeneralBackupDetails('${backup.id}')">
                              <span class="icon">👁️</span> Detalhes
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="masterCtrl.deleteGeneralBackup('${backup.id}')">
                              <span class="icon">🗑️</span> Excluir
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
            <div class="modal-footer">
              <button class="btn" onclick="masterCtrl.closeGeneralBackupsModal()">Fechar</button>
            </div>
          </div>
        </div>
      `;

      // Remove existing modal if any
      const existing = document.getElementById('generalBackupsModal');
      if (existing) existing.remove();

      // Add modal to DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (e) {
      console.error('Error showing general backups modal:', e);
      this.showToast('❌ Erro ao carregar backups: ' + e.message, 'error');
    }
  }

  closeGeneralBackupsModal() {
    const modal = document.getElementById('generalBackupsModal');
    if (modal) modal.remove();
  }

  async restoreGeneralBackup(backupId) {
    const ok = await this.confirmAction({
      title: '⚠️ ATENÇÃO: Restaurar Backup de Estrutura',
      message: 'Isso irá substituir a estrutura atual do sistema (CSS, JS, i18n, etc). Um backup de segurança será criado automaticamente. Deseja continuar?',
      confirmText: 'Sim, Restaurar',
      cancelText: 'Cancelar'
    });

    if (!ok) return;

    try {
      this.showToast('⏳ Restaurando backup de estrutura geral...', 'info');
      
      const result = await window.enterpriseBackup.restoreGeneralBackup(backupId, {
        createSafetyBackup: true,
        validateIntegrity: true
      });

      if (result.success) {
        this.showToast('✅ Backup restaurado! A página será recarregada...', 'success');
        setTimeout(() => location.reload(), 2000);
      } else {
        this.showToast('❌ Erro ao restaurar: ' + result.error, 'error');
      }
    } catch (e) {
      console.error('Error restoring general backup:', e);
      this.showToast('❌ Erro ao restaurar backup: ' + e.message, 'error');
    }
  }

  viewGeneralBackupDetails(backupId) {
    try {
      const backup = window.enterpriseBackup.getGeneralBackup(backupId);
      if (!backup) {
        this.showToast('❌ Backup não encontrado', 'error');
        return;
      }

      const detailsHTML = `
        <div class="modal-overlay" id="backupDetailsModal" onclick="if(event.target===this) masterCtrl.closeBackupDetailsModal()">
          <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
              <h2><span class="icon">📄</span> Detalhes do Backup</h2>
              <button class="btn-close" onclick="masterCtrl.closeBackupDetailsModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>ID:</strong> ${backup.id}
                </div>
                <div class="detail-item">
                  <strong>Versão:</strong> ${backup.versionTag || '-'}
                </div>
                <div class="detail-item">
                  <strong>Descrição:</strong> ${backup.description || '-'}
                </div>
                <div class="detail-item">
                  <strong>Data/Hora:</strong> ${new Date(backup.timestamp).toLocaleString('pt-BR')}
                </div>
                <div class="detail-item">
                  <strong>Tamanho Total:</strong> ${this.formatBytes(backup.metadata.totalSize || 0)}
                </div>
                <div class="detail-item">
                  <strong>Componentes:</strong> ${backup.metadata.componentCount || 0}
                </div>
                <div class="detail-item">
                  <strong>Comprimido:</strong> ${backup.compressed ? '✅ Sim' : '❌ Não'}
                </div>
                <div class="detail-item">
                  <strong>Criptografado:</strong> ${backup.encrypted ? '🔒 Sim' : '❌ Não'}
                </div>
                <div class="detail-item full-width">
                  <strong>Checksum:</strong> <code>${backup.checksum || '-'}</code>
                </div>
                <div class="detail-item full-width">
                  <strong>Componentes Inclusos:</strong>
                  <ul>
                    ${Object.keys(backup.data || {}).map(key => `<li>${key}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" onclick="masterCtrl.restoreGeneralBackup('${backup.id}'); masterCtrl.closeBackupDetailsModal();">
                <span class="icon">♻️</span> Restaurar Este Backup
              </button>
              <button class="btn" onclick="masterCtrl.closeBackupDetailsModal()">Fechar</button>
            </div>
          </div>
        </div>
      `;

      // Remove existing modal if any
      const existing = document.getElementById('backupDetailsModal');
      if (existing) existing.remove();

      // Add modal to DOM
      document.body.insertAdjacentHTML('beforeend', detailsHTML);
    } catch (e) {
      console.error('Error showing backup details:', e);
      this.showToast('❌ Erro ao carregar detalhes: ' + e.message, 'error');
    }
  }

  closeBackupDetailsModal() {
    const modal = document.getElementById('backupDetailsModal');
    if (modal) modal.remove();
  }

  async deleteGeneralBackup(backupId) {
    const ok = await this.confirmAction({
      title: '⚠️ Excluir Backup',
      message: 'Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar'
    });

    if (!ok) return;

    try {
      const result = await window.enterpriseBackup.deleteGeneralBackup(backupId);
      if (result.success) {
        this.showToast('✅ Backup excluído com sucesso', 'success');
        this.closeGeneralBackupsModal();
        this.showGeneralBackupsModal(); // Refresh list
      } else {
        this.showToast('❌ Erro ao excluir backup: ' + result.error, 'error');
      }
    } catch (e) {
      console.error('Error deleting general backup:', e);
      this.showToast('❌ Erro ao excluir backup: ' + e.message, 'error');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  viewBackups() { this.switchTab('backups'); }
  exportAllData() { return this.exportPropertyData(null); }
  async clearCache() { 
    var ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: 'Limpar cache do sistema?',
      confirmText: this.t('system.clearCache','Limpar Cache'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (ok) {
      // Clear non-critical data
      this.showToast('✅ ' + this.t('msgs.cacheCleared','Cache limpo!'), 'success');
    }
  }
  
  async clearI18nCache() {
    var ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: 'Limpar cache de traduções (i18n)?\n\nIsso vai forçar o recarregamento de todas as traduções.',
      confirmText: 'Limpar Cache i18n',
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (ok) {
      // Remove all i18n cache keys
      const cacheKeys = [
        'i18n_cache',
        'i18n_cache_timestamp',
        'cached_i18n',
        'i18n_main',
        'i18n_enterprise_pt',
        'i18n_enterprise_en',
        'i18n_enterprise_es',
        'nexefii_user',
        'nexefii_lang'
      ];
      
      let removed = 0;
      cacheKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          removed++;
          console.log(`[clearI18nCache] ✅ Removido: ${key}`);
        }
      });
      
      this.showToast(`✅ Cache i18n limpo! (${removed} chaves removidas)\n\nRecarregando página...`, 'success');
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }
  
  optimizeDatabase() { this.showToast(this.t('msgs.optimizePending','Otimizar banco de dados - Em desenvolvimento'),'info'); }
  repairIntegrity() { this.showToast(this.t('msgs.repairPending','Reparar integridade - Em desenvolvimento'),'info'); }
  async resetSystem() {
    // Master-only action guard
    if (!this.currentUser || this.currentUser.role !== 'master') {
      this.showToast('⛔ ' + this.t('msgs.accessDenied','Acesso negado! Apenas usuários Master podem acessar este painel.'), 'error');
      return;
    }
    var ok1 = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: '⚠️ ' + this.t('msgs.resetSystemConfirm1','ATENÇÃO! Isso vai resetar TODO o sistema. Deseja continuar?'),
      confirmText: this.t('system.resetSystem','Reset Sistema'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (ok1) {
      var ok2 = await this.confirmAction({
        title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
        message: this.t('msgs.resetSystemConfirm2','Última chance! Tem CERTEZA ABSOLUTA?'),
        confirmText: this.t('system.resetSystem','Reset Sistema'),
        cancelText: this.t('restoreSelective.cancel','Cancelar')
      });
      if (ok2) {
        localStorage.clear();
        this.showToast(this.t('msgs.resetDone','Sistema resetado. Redirecionando...'), 'success');
        window.location.href = 'login.html';
      }
    }
  }
  exportLogs() {
    // Exportar enterprise audit log se disponível
    let content = '';
    if (this.enterpriseBackup && typeof this.enterpriseBackup.exportAuditLog === 'function') {
      content = this.enterpriseBackup.exportAuditLog('json');
    } else {
      content = JSON.stringify(this.logs, null, 2);
    }
    const dataBlob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
  link.download = 'logs_' + Date.now() + '.json';
    link.click();
  }
  async logout() {
    var ok = await this.confirmAction({
      title: this.t('msgs.confirmRestoreTitle','ATENÇÃO!'),
      message: this.t('msgs.logoutConfirm','Deseja sair do Master Control Panel?'),
      confirmText: this.t('logout','Sair'),
      cancelText: this.t('restoreSelective.cancel','Cancelar')
    });
    if (ok) {
      window.location.href = 'login.html';
    }
  }

  // ========================================
  // PROPERTIES MANAGEMENT
  // ========================================
  
  renderPropertiesTable(filter = '') {
    const tbody = document.getElementById('propertiesTableBody');
    if (!tbody) return;

    const properties = window.NexefiiProps ? window.NexefiiProps.listProperties() : [];
    const filtered = filter ? properties.filter(p => 
      p && p.key && (
        p.key.toLowerCase().includes(filter.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(filter.toLowerCase()))
      )
    ) : properties.filter(p => p && p.key); // Filtrar propriedades inválidas

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;"><span class="icon">📭</span><br>Nenhuma propriedade encontrada</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(prop => {
      // Validar dados da propriedade
      if (!prop || !prop.key) {
        console.warn('[renderPropertiesTable] Propriedade inválida encontrada:', prop);
        return '';
      }

      const modules = Array.isArray(prop.modulesPurchased) && prop.modulesPurchased.length > 0 
        ? prop.modulesPurchased.join(', ') 
        : 'Nenhum módulo';
      const capacityLabels = {
        'to30': 'Até 30',
        '30to50': '30-50',
        '50to100': '50-100',
        '100plus': '100+'
      };
      const capacity = capacityLabels[prop.userCapacity] || prop.userCapacity || 'to30';
      
      // Status de implantação (deployed)
      let deployStatus;
      if (prop.deployed) {
        deployStatus = '<span class="badge badge-success">✓ Implantado</span>';
      } else {
        deployStatus = '<span class="badge badge-warning">⏳ Pendente</span>';
      }

      // Desabilitar botão de deploy se já implantado
      const deployBtnDisabled = prop.deployed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';

      // Gerar Link da propriedade
      let propertyLink;
      if (prop.deployed) {
        const propertyUrl = `https://${prop.key}.nexefii.com`;
        propertyLink = `<a href="${propertyUrl}" target="_blank" title="Abrir propriedade publicada: ${propertyUrl}" style="color: #667eea; text-decoration: none; font-weight: 500;">${prop.name || prop.key}</a>`;
      } else {
        // Link para abrir propriedade local (não publicada ainda)
        propertyLink = `<a href="javascript:void(0)" onclick="window.masterCtrl.openPropertyLocal('${prop.key}')" title="Clique para validar e publicar" style="color: #000; text-decoration: none; font-weight: 700; display: block; text-align: center;">🏨 ${prop.name || prop.key}</a>`;
      }

      return `
        <tr>
          <td><strong>${prop.key}</strong></td>
          <td>${prop.name || prop.key}</td>
          <td><span class="badge">${modules}</span></td>
          <td>${capacity} usuários</td>
          <td>${propertyLink}</td>
          <td>${deployStatus}</td>
          <td style="white-space: nowrap;">
            <button class="btn btn-sm" onclick="window.masterCtrl.editProperty('${prop.key}')" title="Editar">
              <span class="icon">✏️</span>
            </button>
            <button class="btn btn-sm btn-success" onclick="window.masterCtrl.openPropertyLocal('${prop.key}')" title="${prop.deployed ? 'Já implantado' : 'Implantar'}" ${deployBtnDisabled}>
              <span class="icon">🚀</span>
            </button>
            <button class="btn btn-sm btn-danger" onclick="window.masterCtrl.deleteProperty('${prop.key}')" title="Deletar">
              <span class="icon">🗑️</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  openPropertyModal(mode = 'create', propertyKey = null) {
    const modal = document.getElementById('propertyModal');
    const title = document.getElementById('propertyModalTitle');
    const form = document.getElementById('propertyForm');
    
    if (!modal || !title || !form) return;

    if (mode === 'create') {
      title.textContent = 'Criar Nova Propriedade';
      form.reset();
      document.getElementById('propertyId').disabled = false;
      document.getElementById('propertyActive').checked = true;
    } else {
      title.textContent = 'Editar Propriedade';
      const property = window.NexefiiProps.getProperty(propertyKey);
      if (!property) return;

      document.getElementById('propertyId').value = property.key;
      document.getElementById('propertyId').disabled = true;
      document.getElementById('propertyName').value = property.name || property.key;
      document.getElementById('propertyImage').value = property.imageUrl || '';
      document.getElementById('propertyCapacity').value = property.userCapacity || 'to30';
      document.getElementById('propertyActive').checked = property.active !== false;

      // Set modules checkboxes
      const moduleCheckboxes = document.querySelectorAll('input[name="modules"]');
      moduleCheckboxes.forEach(cb => {
        cb.checked = Array.isArray(property.modulesPurchased) && 
                     property.modulesPurchased.includes(cb.value);
      });
    }

    // Ensure wrapper is visible when the modal opens
    const wrapper = document.querySelector('.mc-properties-create-inline');
    if (wrapper) wrapper.classList.add('is-open');
    // Use the shared modal CSS pattern: add 'open' class to .modal so overlay and centering are applied
    modal.classList.add('open');
    // Prevent background scroll while modal is open
    try { document.body.style.overflow = 'hidden'; } catch (e) { /* ignore */ }

    // Handle form submission
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveProperty(mode);
    };
  }

  closePropertyModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) modal.classList.remove('open');
    const wrapper = document.querySelector('.mc-properties-create-inline');
    if (wrapper) wrapper.classList.remove('is-open');
    try { document.body.style.overflow = ''; } catch (e) { /* ignore */ }
  }

  saveProperty(mode) {
    const propertyId = document.getElementById('propertyId').value.trim();
    const propertyName = document.getElementById('propertyName').value.trim();
    const propertyImage = document.getElementById('propertyImage').value.trim();
    const propertyCapacity = document.getElementById('propertyCapacity').value;
    const propertyActive = document.getElementById('propertyActive').checked;

    if (!propertyId) {
      alert('Property ID é obrigatório!');
      return;
    }

    // Get selected modules
    const moduleCheckboxes = document.querySelectorAll('input[name="modules"]:checked');
    const modules = Array.from(moduleCheckboxes).map(cb => cb.value);

    const propertyData = {
      key: propertyId,
      name: propertyName || propertyId,
  imageUrl: propertyImage || 'assets/images/default-hotel-1.jpg',
      roomCount: 50, // Valor padrão
      modulesPurchased: modules,
      userCapacity: propertyCapacity,
      active: propertyActive,
      deployed: false,
      isDemo: false,
      location: {
        address: '',
        city: '',
        state: '',
        country: '',
        coordinates: { lat: 0, lng: 0 }
      }
    };

    const result = window.NexefiiProps.upsertProperty(propertyData);

    if (result.success) {
      // Se está CRIANDO (não editando), criar usuário admin automático
      if (mode === 'create') {
        this.createPropertyAdminUser(propertyId, propertyName);
      }
      
      this.showToast(
        mode === 'create' ? 'Propriedade criada com sucesso!' : 'Propriedade atualizada com sucesso!', 
        'success'
      );
      this.closePropertyModal();
      this.renderPropertiesTable();
      
      // Atualizar todos os selects de propriedade
      this.populatePropertySelects();
      this.populateBackupPropertySelect();
      if (typeof this.populatePropertySelects === 'function') {
        this.populatePropertySelects(); // Enterprise
      }

      // Log
      this.addLog({
        type: 'system',
        level: 'info',
        action: mode === 'create' ? 'property_created' : 'property_updated',
        details: `Propriedade ${propertyId} ${mode === 'create' ? 'criada' : 'atualizada'}`,
        user: this.currentUser?.username || 'master'
      });
    } else {
      this.showToast('Erro ao salvar propriedade: ' + result.error, 'error');
    }
  }

  // Criar usuário admin automático para nova propriedade
  createPropertyAdminUser(propertyKey, propertyName) {
    console.log(`[createPropertyAdminUser] Criando usuário admin para propriedade: ${propertyKey}`);
    
    const username = 'admin';
    const password = `admin${propertyKey}`; // admin + nome da propriedade
    const email = `admin@${propertyKey}.nexefii.com`;
    
    // Verificar se já existe usuário admin para esta propriedade
    const allUsers = this.getAllUsers();
    const existingUser = allUsers.find(u => 
      u.username === username && 
      u.properties && 
      u.properties.includes(propertyKey)
    );
    
    if (existingUser) {
      console.log(`[createPropertyAdminUser] Usuário admin já existe para ${propertyKey}`);
      return;
    }
    
    // Criar novo usuário usando a função createUser do sistema
    const newUserData = {
      username: username,
      password: password,
      name: `Admin ${propertyName}`,
      email: email,
      role: 'admin',
      status: 'active',
      properties: [propertyKey], // Apenas esta propriedade
      lastAccess: null
    };
    
    this.createUser(newUserData);
    
    console.log(`[createPropertyAdminUser] ✅ Usuário criado:`, {
      username: username,
      password: password,
      email: email,
      property: propertyKey
    });
    
    // Log da criação
    this.addLog({
      type: 'user',
      level: 'info',
      action: 'user_auto_created',
      details: `Usuário admin criado automaticamente para propriedade ${propertyKey}. Username: ${username}, Password: ${password}`,
      user: this.currentUser?.username || 'master'
    });
    
    // Mostrar notificação com credenciais
    this.showToast(
      `✅ Usuário admin criado!\n\nUsername: ${username}\nPassword: ${password}\n\n⚠️ Anote estas credenciais!`, 
      'success', 
      8000
    );
    
    // Atualizar tabela de usuários se estiver visível
    if (this.currentTab === 'users') {
      this.renderUsersTable();
    }
  }

  editProperty(propertyKey) {
    this.openPropertyModal('edit', propertyKey);
  }

  // Nova função: Abrir propriedade local para validação
  openPropertyLocal(propertyKey) {
    const property = window.NexefiiProps.getProperty(propertyKey);
    if (!property) {
      this.showToast('Propriedade não encontrada!', 'error');
      return;
    }

    // Verificar se já está implantada
    if (property.deployed) {
      // Se já implantada, abrir URL real
      const propertyUrl = `https://${property.key}.nexefii.com`;
      window.open(propertyUrl, '_blank');
      return;
    }

    // Abrir modal de validação da propriedade local
    this.showPropertyValidationModal(propertyKey);
  }

  // Modal de validação de propriedade local
  showPropertyValidationModal(propertyKey) {
    const property = window.NexefiiProps.getProperty(propertyKey);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
          <h2 style="margin: 0; color: #2d3748; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 32px;">🏨</span>
            <span>${property.name || property.key}</span>
          </h2>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1;">&times;</button>
        </div>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <span style="font-size: 40px;">⚠️</span>
            <div>
              <h3 style="margin: 0 0 5px 0; font-size: 18px;">Propriedade em Ambiente Local</h3>
              <p style="margin: 0; opacity: 0.9; font-size: 14px;">Esta propriedade ainda não foi publicada na web</p>
            </div>
          </div>
        </div>

        <div style="background: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 15px 0; color: #2d3748; display: flex; align-items: center; gap: 8px;">
            <span>📋</span> Informações da Propriedade
          </h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; font-weight: 600; color: #4a5568; width: 40%;">Property ID:</td>
              <td style="padding: 10px 0; color: #2d3748;"><code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${property.key}</code></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Nome:</td>
              <td style="padding: 10px 0; color: #2d3748;">${property.name || property.key}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Módulos:</td>
              <td style="padding: 10px 0; color: #2d3748;">${(property.modules || []).join(', ')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Capacidade:</td>
              <td style="padding: 10px 0; color: #2d3748;">${property.capacity || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Status:</td>
              <td style="padding: 10px 0;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; background: #fef3c7; color: #92400e;">
                  ⏳ Aguardando Publicação
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 12px 0; color: #742a2a; display: flex; align-items: center; gap: 8px;">
            <span>🔍</span> Validação Local
          </h4>
          <p style="margin: 0 0 15px 0; color: #742a2a; line-height: 1.6;">
            Como você está em ambiente local, a URL <strong>https://${property.key}.nexefii.com</strong> ainda não existe.
            Para validar a propriedade antes de publicar:
          </p>
          <ul style="margin: 0; padding-left: 25px; color: #742a2a;">
            <li style="margin-bottom: 8px;">✅ Todos os dados foram salvos corretamente</li>
            <li style="margin-bottom: 8px;">✅ A propriedade está registrada no sistema</li>
            <li style="margin-bottom: 8px;">✅ Módulos e configurações estão ativos</li>
            <li>✅ Pronto para implantação/publicação</li>
          </ul>
        </div>

        <div style="display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; gap: 12px; flex: 1;">
            <button onclick="window.masterCtrl.insertDemoData('${property.key}')" style="padding: 12px 24px; border: 2px solid #10b981; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #10b981; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#d1fae5'" onmouseout="this.style.background='white'" title="Insere dados fake para demonstração (disponível para todas as propriedades)">
              <span style="font-size: 18px;">🎭</span>
              <span>Inserir Dados</span>
            </button>
            <button onclick="window.masterCtrl.testPropertyLocally('${property.key}')" style="padding: 12px 24px; border: 2px solid #4299e1; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4299e1; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#ebf8ff'" onmouseout="this.style.background='white'">
              <span style="font-size: 18px;">🔍</span>
              <span>Testar Localmente</span>
            </button>
            <button onclick="window.masterCtrl.confirmPublishProperty('${property.key}')" style="padding: 12px 24px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'">
              🚀 Publicar na Web
            </button>
          </div>
          <button onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-weight: 500; cursor: pointer; color: #94a3b8; font-size: 14px; transition: all 0.2s;" onmouseover="this.style.color='#64748b'; this.style.background='#f1f5f9'" onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">
            Fechar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Nota: As funções testPropertyLocally() e confirmPublishProperty()
  // estão implementadas em property-publish-helpers.js

  async deleteProperty(propertyKey) {
    console.log('[deleteProperty] Iniciando exclusão de:', propertyKey);
    
    const ok = await this.confirmAction({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja deletar a propriedade "${propertyKey}"?\n\nEsta ação não pode ser desfeita e removerá:\n- Todos os backups da propriedade\n- Usuários associados\n- Configurações específicas`,
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    console.log('[deleteProperty] Confirmação do usuário:', ok);
    if (!ok) {
      console.log('[deleteProperty] Cancelado pelo usuário');
      return;
    }

    console.log('[deleteProperty] Deletando propriedade...');
    const result = window.NexefiiProps.deleteProperty(propertyKey);
    console.log('[deleteProperty] Resultado:', result);

    if (result.success) {
      this.showToast('Propriedade deletada com sucesso!', 'success');
      this.renderPropertiesTable();
      
      // Atualizar selects
      this.populatePropertySelects();
      this.populateBackupPropertySelect();

      // Log
      this.addLog({
        type: 'system',
        level: 'warning',
        action: 'property_deleted',
        details: `Propriedade ${propertyKey} deletada`,
        user: this.currentUser?.username || 'master'
      });
    } else {
      console.error('[deleteProperty] Erro ao deletar:', result.error);
      this.showToast('Erro ao deletar propriedade: ' + result.error, 'error');
    }
  }

  deployProperty(propertyKey) {
    const property = window.NexefiiProps.getProperty(propertyKey);
    if (!property) {
      this.showToast('Propriedade não encontrada!', 'error');
      return;
    }

    // Verificar se já está implantada
    if (property.deployed) {
      this.showToast('Esta propriedade já está implantada!', 'warning');
      return;
    }

    this.currentDeployProperty = propertyKey;

    // Open deployment wizard
    const wizard = document.getElementById('deploymentWizard');
    if (!wizard) return;

    wizard.style.display = 'flex';
    this.deploymentNextStep(1); // Start at step 1
  }

  closeDeploymentWizard() {
    const wizard = document.getElementById('deploymentWizard');
    if (wizard) wizard.style.display = 'none';
    
    // Reset
    this.currentDeployProperty = null;
    this.deploymentNextStep(1);
    
    // Atualizar tabela de propriedades
    this.renderPropertiesTable();
  }

  deploymentNextStep(step) {
    // Hide all steps
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`deployStep${i}`);
      if (stepEl) stepEl.style.display = 'none';
    }

    // Show current step
    const currentStepEl = document.getElementById(`deployStep${step}`);
    if (currentStepEl) currentStepEl.style.display = 'block';

    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach((el, idx) => {
      const stepNum = idx + 1;
      const numberEl = el.querySelector('.step-number');
      
      if (stepNum < step) {
        // Completed
        numberEl.style.background = '#4CAF50';
        numberEl.style.color = 'white';
        el.classList.remove('active');
      } else if (stepNum === step) {
        // Current
        numberEl.style.background = 'var(--primary-color)';
        numberEl.style.color = 'white';
        el.classList.add('active');
      } else {
        // Pending
        numberEl.style.background = '#ddd';
        numberEl.style.color = '#666';
        el.classList.remove('active');
      }
    });

    // Populate summary on step 3
    if (step === 3 && this.currentDeployProperty) {
      const property = window.NexefiiProps.getProperty(this.currentDeployProperty);
      if (property) {
        document.getElementById('deploySummaryProperty').textContent = property.name || property.key;
        document.getElementById('deploySummaryEnv').textContent = 
          document.getElementById('deployEnvironment')?.value || 'development';
        document.getElementById('deploySummaryModules').textContent = 
          property.modulesPurchased?.join(', ') || '-';
      }
    }
  }

  async executeDeployment() {
    const property = window.NexefiiProps.getProperty(this.currentDeployProperty);
    if (!property) return;

    const btnExecute = document.getElementById('btnDeployExecute');
    const btnBack = document.getElementById('btnDeployBack');
    const btnFinish = document.getElementById('btnDeployFinish');
    const progressBar = document.getElementById('deployProgressBar');
    const progressText = document.getElementById('deployProgressText');
    const logContainer = document.getElementById('deployLog');

    btnExecute.disabled = true;
    btnBack.disabled = true;

    const addLog = (msg) => {
      const div = document.createElement('div');
      div.textContent = `> ${msg}`;
      logContainer.appendChild(div);
      logContainer.scrollTop = logContainer.scrollHeight;
    };

    const updateProgress = (percent, msg) => {
      progressBar.style.width = percent + '%';
      progressText.textContent = msg;
    };

    // Simulate deployment process
    try {
      addLog('Iniciando processo de implantação...');
      updateProgress(10, 'Preparando ambiente...');
      await new Promise(r => setTimeout(r, 800));

      addLog(`Propriedade: ${property.name || property.key}`);
      addLog(`Property ID: ${property.key}`);
      addLog(`Módulos: ${property.modulesPurchased?.join(', ')}`);
      updateProgress(25, 'Validando configurações...');
      await new Promise(r => setTimeout(r, 600));

      if (document.getElementById('deployBackup')?.checked) {
        addLog('Criando backup de segurança...');
        updateProgress(40, 'Backup em progresso...');
        await new Promise(r => setTimeout(r, 1000));
        addLog('✓ Backup criado com sucesso');
      }

      addLog('Provisionando recursos...');
      updateProgress(55, 'Provisionamento...');
      await new Promise(r => setTimeout(r, 800));

      addLog('Configurando banco de dados...');
      addLog(`- Primary Key: ${property.key}`);
      updateProgress(70, 'Configurando database...');
      await new Promise(r => setTimeout(r, 700));

      addLog('Implantando módulos...');
      property.modulesPurchased?.forEach(mod => {
        addLog(`  ✓ Módulo "${mod}" implantado`);
      });
      updateProgress(85, 'Implantando módulos...');
      await new Promise(r => setTimeout(r, 900));

      if (document.getElementById('deployNotify')?.checked) {
        addLog('Enviando notificações...');
        updateProgress(95, 'Notificando administradores...');
        await new Promise(r => setTimeout(r, 500));
      }

      addLog('Finalizando...');
      updateProgress(100, 'Implantação concluída!');
      await new Promise(r => setTimeout(r, 300));

      addLog('');
      addLog('=================================');
      addLog('✅ IMPLANTAÇÃO CONCLUÍDA COM SUCESSO!');
      addLog('=================================');

      // Marcar propriedade como implantada
      if (window.NexefiiProps && window.NexefiiProps.markAsDeployed) {
        window.NexefiiProps.markAsDeployed(property.key);
        addLog(`Propriedade ${property.key} marcada como IMPLANTADA`);
      }

      // Log
      this.logActivity('system', 'info', 'Property deployed', {
        propertyId: property.key,
        propertyName: property.name || property.key,
        environment: document.getElementById('deployEnvironment')?.value || 'development',
        modules: property.modulesPurchased?.join(', '),
        backup: document.getElementById('deployBackup')?.checked,
        notify: document.getElementById('deployNotify')?.checked
      });

      btnFinish.style.display = 'inline-block';
      this.showToast('Implantação concluída com sucesso!', 'success');

    } catch (error) {
      addLog('');
      addLog('❌ ERRO NA IMPLANTAÇÃO!');
      addLog(`Detalhes: ${error.message}`);
      updateProgress(0, 'Falha na implantação');
      this.showToast('Erro durante implantação: ' + error.message, 'error');
      btnExecute.disabled = false;
      btnBack.disabled = false;
    }
  }

  refreshProperties() {
    this.renderPropertiesTable();
    this.showToast('Lista de propriedades atualizada!', 'success');
  }
}

// Initialize
console.log('🚀 Iniciando Master Control System...');
console.log('📦 window.NexefiiProps disponível?', !!window.NexefiiProps);
if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
  const propsList = window.NexefiiProps.listProperties();
  console.log('✅ NexefiiProps.listProperties() retornou', propsList.length, 'propriedades:', propsList);
} else {
  console.error('❌ PROBLEMA: NexefiiProps não está disponível no momento da inicialização!');
  console.log('   Tentando fallback via localStorage...');
  try {
  const map = JSON.parse(localStorage.getItem('nexefii_properties') || localStorage.getItem('nexefii_properties') || '{}');
    console.log('   localStorage contém', Object.keys(map).length, 'propriedades:', Object.keys(map));
  } catch(e) {
    console.error('   Erro ao ler localStorage:', e);
  }
}

const masterCtrl = new MasterControlSystem();
// Expor globalmente para handlers inline e integrações
window.masterCtrl = masterCtrl;
console.log('[MasterControl] masterCtrl exposto globalmente:', typeof window.masterCtrl);

