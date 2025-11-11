/**
 * Master Control - Enterprise Backup Integration
 * Integra EnterpriseBackupSystem e ReleaseManagementSystem no Master Control Panel
 * 
 * DECISÃ•ES DE DESIGN:
 * 1. SeparaÃ§Ã£o de Responsabilidades: LÃ³gica de backup/release isolada em classes prÃ³prias
 * 2. Multi-Tenant: Todas operaÃ§Ãµes scope por propertyId
 * 3. Auditabilidade: Logs detalhados de todas operaÃ§Ãµes crÃ­ticas
 * 4. Confiabilidade: ValidaÃ§Ãµes antes de restore, backups de seguranÃ§a automÃ¡ticos
 * 5. Performance: OperaÃ§Ãµes assÃ­ncronas, mÃ©tricas em cache
 */

// Adicionar mÃ©todos ao MasterControlSystem
Object.assign(MasterControlSystem.prototype, {
  
  // ========================================
  // INICIALIZAÃ‡ÃƒO ENTERPRISE SYSTEMS
  // ========================================
  
  initEnterpriseBackupSystems() {
    console.info('ðŸ—ï¸ Initializing Enterprise Backup Systems...');
    
    try {
      // Inicializar Enterprise Backup System
      this.enterpriseBackup = new EnterpriseBackupSystem();
      window.enterpriseBackupSystem = this.enterpriseBackup; // Global access for debugging
      
      // Inicializar Release Management System
      this.releaseManagement = new ReleaseManagementSystem(this.enterpriseBackup);
      window.releaseManagement = this.releaseManagement; // Global access for debugging
      
      console.info('âœ… Enterprise Backup Systems initialized');
    } catch (error) {
      console.error('âŒ Failed to initialize Enterprise Backup Systems:', error);
      this.showToast('Erro ao inicializar sistemas enterprise', 'error');
    }
  },
  
  // ========================================
  // INICIALIZAÃ‡ÃƒO UI ENTERPRISE
  // ========================================
  
  initEnterpriseUI() {
    console.info('ðŸŽ¨ Initializing Enterprise UI...');
    
    try {
      // Property Backups Tab
      this.initPropertyBackupsUI();
      
      // General Backups Tab
      this.initGeneralBackupsUI();
      
      // Releases Tab
      this.initReleasesUI();
      
      console.info('âœ… Enterprise UI initialized');
    } catch (error) {
      console.error('âŒ Failed to initialize Enterprise UI:', error);
      this.showToast('Erro ao inicializar UI enterprise', 'error');
    }
  },
  
  // ========================================
  // PROPERTY BACKUPS UI
  // ========================================
  
  initPropertyBackupsUI() {
    // Populate property selects
    this.populatePropertySelects();
    
    // Load initial metrics
    this.updatePropertyBackupMetrics();
    
    // Load catalog
    this.loadPropertyBackupCatalog();
    
    // Event listeners
    document.getElementById('btnTenantFullBackup')?.addEventListener('click', () => this.handlePropertyFullBackup());
    document.getElementById('btnTenantIncrementalBackup')?.addEventListener('click', () => this.handlePropertyIncrementalBackup());
    document.getElementById('btnTenantViewCatalog')?.addEventListener('click', () => this.loadPropertyBackupCatalog());
    
    // Search and filters
    document.getElementById('tbSearchInput')?.addEventListener('input', (e) => this.filterPropertyBackupCatalog(e.target.value));
    document.getElementById('tbFilterType')?.addEventListener('change', () => this.loadPropertyBackupCatalog());
    
    // Restore wizard
    document.getElementById('btnCancelRestore')?.addEventListener('click', () => this.closePropertyRestoreWizard());
    document.getElementById('btnNextStep')?.addEventListener('click', () => this.nextRestoreStep());
    document.getElementById('btnPrevStep')?.addEventListener('click', () => this.prevRestoreStep());
    document.getElementById('btnExecuteRestore')?.addEventListener('click', () => this.executePropertyRestore());
    
    // Restore mode toggle
    document.querySelectorAll('input[name="restoreMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const selectiveDiv = document.getElementById('selectiveModules');
        if (selectiveDiv) {
          selectiveDiv.style.display = e.target.value === 'selective' ? 'block' : 'none';
        }
      });
    });
    
    // Scheduling
    document.getElementById('btnSaveSchedule')?.addEventListener('click', () => this.savePropertyBackupSchedule());
    this.loadPropertyBackupSchedules();

    // Iniciar scheduler automÃ¡tico
    this.startPropertyBackupScheduler();
  },
  
  populatePropertySelects() {
    const properties = this.getAllProperties();
    console.log('populatePropertySelects(): Populando selects com', properties.length, 'propriedades:', properties);
    
    const selects = ['tbPropertySelect', 'schedulePropertySelect'];
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) {
        console.warn('populatePropertySelects(): Select nÃ£o encontrado:', selectId);
        return;
      }
      
      console.log('populatePropertySelects(): Populando select', selectId);
      
      // Clear existing options (keep first placeholder)
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add properties
      properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = prop.name;
        select.appendChild(option);
      });
      
      console.log('populatePropertySelects(): Select', selectId, 'agora tem', select.options.length, 'opÃ§Ãµes');
    });
  },
  
  getAllProperties() {
    // Obter propriedades de fontes mÃºltiplas para maior robustez
    const allProps = [];
    const seen = new Set();
    
    // 1) Tentar IluxProps PRIMEIRO (fonte primÃ¡ria de propriedades)
    try {
      if (window.IluxProps && typeof window.IluxProps.listProperties === 'function') {
        const list = window.IluxProps.listProperties() || [];
        console.log('Enterprise getAllProperties(): IluxProps retornou', list.length, 'propriedades:', list);
        list.forEach(p => {
          if (p && p.key && !seen.has(p.key)) {
            seen.add(p.key);
            allProps.push({ id: p.key, name: p.key });
          }
        });
      }
    } catch (e) { 
      console.error('Erro ao obter propriedades via IluxProps:', e);
    }

    // 2) Fallback: Tentar via master control getPropertiesList
    if (allProps.length === 0) {
      try {
        if (typeof this.getPropertiesList === 'function') {
          const ids = this.getPropertiesList(); // ex.: ['iluxSaoPaulo', 'iluxMiami']
          console.log('Enterprise getAllProperties(): getPropertiesList retornou', ids.length, 'propriedades:', ids);
          if (Array.isArray(ids) && ids.length) {
            ids.forEach(id => {
              if (id && !seen.has(id)) {
                seen.add(id);
                allProps.push({ id, name: id });
              }
            });
          }
        }
      } catch (e) { 
        console.error('Erro ao obter propriedades via getPropertiesList:', e);
      }
    }

    // 3) Fallback: Tentar mapa persistido diretamente
    if (allProps.length === 0) {
      try {
        const map = JSON.parse(localStorage.getItem('nexefii_properties') || '{}') || {};
        const keys = Object.keys(map);
        console.log('Enterprise getAllProperties(): localStorage retornou', keys.length, 'propriedades:', keys);
        keys.forEach(id => {
          if (id && !seen.has(id)) {
            seen.add(id);
            allProps.push({ id, name: id });
          }
        });
      } catch (e) { 
        console.error('Erro ao obter propriedades via localStorage:', e);
      }
    }

    // 4) Adicionar quaisquer tenants detectados via backups enterprise
    try {
      if (this.enterpriseBackup && this.enterpriseBackup.tenantBackups) {
        Object.keys(this.enterpriseBackup.tenantBackups).forEach(tid => {
          if (tid && !seen.has(tid)) { 
            seen.add(tid); 
            allProps.push({ id: tid, name: tid }); 
          }
        });
      }
    } catch (e) { 
      console.error('Erro ao obter propriedades via tenantBackups:', e);
    }

    console.log('Enterprise getAllProperties(): Total de propriedades encontradas:', allProps.length, allProps);
    return allProps;
  },
  
  updatePropertyBackupMetrics() {
    const metrics = this.enterpriseBackup.getMetricsDashboard();
    const tb = metrics.tenant_backups;
    
    document.getElementById('tbTotalCount').textContent = tb.total_count;
    document.getElementById('tbLast24h').textContent = tb.last_24h;
    
    const successRate = tb.total_count > 0 
      ? ((tb.success_count / tb.total_count) * 100).toFixed(1)
      : 0;
    document.getElementById('tbSuccessRate').textContent = successRate + '%';
    
    const avgDuration = (tb.avg_duration_ms / 1000).toFixed(1);
    document.getElementById('tbAvgDuration').textContent = avgDuration + 's';
    
    const avgSize = (tb.avg_size_bytes / 1024 / 1024).toFixed(2);
    document.getElementById('tbAvgSize').textContent = avgSize + ' MB';
    
    const totalStorage = (tb.total_storage_bytes / 1024 / 1024).toFixed(2);
    document.getElementById('tbTotalStorage').textContent = totalStorage + ' MB';
  },
  
  async handlePropertyFullBackup() {
    const propertyId = document.getElementById('tbPropertySelect')?.value;
    if (!propertyId) {
      this.showToast('Selecione uma propriedade', 'warning');
      return;
    }
    
    try {
      this.showToast('Criando backup completo...', 'info');
      
      const result = await this.enterpriseBackup.createTenantBackup(propertyId, {
        type: 'full',
        createdBy: this.currentUser?.username || 'master',
        compress: this.isEnterpriseCompressionEnabled(),
        encrypt: this.isEnterpriseEncryptionEnabled()
      });
      
      this.showToast(`Backup completo criado: ${result.id}`, 'success');
      this.updatePropertyBackupMetrics();
      this.loadPropertyBackupCatalog();
      
      // Log activity
      this.addActivityLog('tenant_backup', `Backup completo criado para ${propertyId}`);
      
    } catch (error) {
      console.error('Error creating tenant backup:', error);
      this.showToast('Erro ao criar backup: ' + error.message, 'error');
    }
  },
  
  async handlePropertyIncrementalBackup() {
    const propertyId = document.getElementById('tbPropertySelect')?.value;
    if (!propertyId) {
      this.showToast('Selecione uma propriedade', 'warning');
      return;
    }
    
    try {
      this.showToast('Criando backup incremental...', 'info');
      
      const result = await this.enterpriseBackup.createIncrementalTenantBackup(propertyId, {
        createdBy: this.currentUser?.username || 'master',
        compress: this.isEnterpriseCompressionEnabled(),
        encrypt: this.isEnterpriseEncryptionEnabled()
      });
      
      this.showToast(`Backup incremental criado: ${result.id}`, 'success');
      this.updatePropertyBackupMetrics();
      this.loadPropertyBackupCatalog();
      
      // Log activity
      this.addActivityLog('tenant_backup', `Backup incremental criado para ${propertyId}`);
      
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      this.showToast('Erro ao criar backup incremental: ' + error.message, 'error');
    }
  },
  
  loadPropertyBackupCatalog() {
    const filterType = document.getElementById('tbFilterType')?.value || 'all';
    const searchTerm = document.getElementById('tbSearchInput')?.value.toLowerCase() || '';
    
    // Get all tenant backups
    let allBackups = [];
    const properties = this.getAllProperties();
    const nameMap = {};
    properties.forEach(p => { nameMap[p.id] = p.name || p.id; });

    // Caminho principal: usar a lista de propriedades conhecida
    if (properties.length) {
      properties.forEach(prop => {
        const catalog = this.enterpriseBackup.getTenantBackupCatalog(prop.id);
        catalog.forEach(backup => {
          allBackups.push({
            ...backup,
            propertyName: nameMap[backup.tenantId] || prop.name || backup.tenantId
          });
        });
      });
    }

    // Fallback: se nada foi encontrado (ou lista vazia), varrer diretamente os backups enterprise
    if (!allBackups.length && this.enterpriseBackup && this.enterpriseBackup.tenantBackups) {
      Object.entries(this.enterpriseBackup.tenantBackups).forEach(([tenantId, arr]) => {
        (arr || []).forEach(b => {
          // Respeitar soft-delete
          try {
            const ov = localStorage.getItem('enterprise_tenant_backup_' + b.id);
            if (ov) { const j = JSON.parse(ov); if (j && j.deleted) return; }
          } catch {}
          allBackups.push({
            id: b.id,
            tenantId: tenantId,
            type: b.type,
            created_at: b.timestamp,
            timestamp: b.timestamp,
            size_bytes: (b.metadata && b.metadata.size_bytes) || 0,
            checksum: (b.checksums && (b.checksums.manifest || Object.values(b.checksums)[0])) || '',
            modules: (Array.isArray(b.database) ? b.database.map(it => it.type).filter(Boolean) : []),
            propertyName: nameMap[tenantId] || tenantId
          });
        });
      });
    }
    
    // Filter
    let filtered = allBackups;
    if (filterType !== 'all') {
      filtered = filtered.filter(b => b.type === filterType);
    }
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.propertyName.toLowerCase().includes(searchTerm) ||
        b.tenantId.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Render table
    const tbody = document.getElementById('tenantBackupTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum backup encontrado</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map(backup => `
      <tr>
        <td><strong>${backup.propertyName}</strong><br><small>${backup.tenantId}</small></td>
        <td><span class="badge badge-${backup.type === 'full' ? 'primary' : 'info'}">${backup.type}</span></td>
        <td>${new Date(backup.created_at).toLocaleString('pt-BR')}</td>
        <td>${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
        <td><code style="font-size:11px;">${backup.checksum.substring(0, 12)}...</code></td>
        <td>
          <button class="btn btn-sm" onclick="masterCtrl.viewPropertyBackup('${backup.id}')" title="Ver detalhes">
            <span class="icon">ðŸ‘ï¸</span>
          </button>
          <button class="btn btn-sm btn-success" onclick="masterCtrl.openPropertyRestoreWizard('${backup.id}')" title="Restaurar">
            <span class="icon">â™»ï¸</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="masterCtrl.deletePropertyBackup('${backup.id}')" title="Excluir">
            <span class="icon">ðŸ—‘ï¸</span>
          </button>
        </td>
      </tr>
    `).join('');
  },
  
  filterPropertyBackupCatalog(searchTerm) {
    this.loadPropertyBackupCatalog();
  },
  
  viewPropertyBackup(backupId) {
    const backup = this.enterpriseBackup.findTenantBackup(null, backupId);
    if (!backup) {
      this.showToast('Backup nÃ£o encontrado', 'error');
      return;
    }
    
    const details = `
      <strong>ID:</strong> ${backup.id}<br>
      <strong>Propriedade:</strong> ${backup.tenantId}<br>
      <strong>Tipo:</strong> ${backup.type}<br>
      <strong>Data:</strong> ${new Date(backup.created_at).toLocaleString('pt-BR')}<br>
      <strong>Tamanho:</strong> ${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB<br>
      <strong>Checksum:</strong> <code>${backup.checksum}</code><br>
      <strong>Criado por:</strong> ${backup.created_by}<br>
      ${backup.parent_backup_id ? `<strong>Backup pai:</strong> ${backup.parent_backup_id}<br>` : ''}
      <strong>MÃ³dulos:</strong> ${backup.modules.join(', ')}
    `;
    
    this.showCustomModal('Detalhes do Backup', details);
  },
  
  async deletePropertyBackup(backupId) {
    const confirmed = await this.confirmAction(
      'Confirmar ExclusÃ£o',
      'Tem certeza que deseja excluir este backup? Esta aÃ§Ã£o nÃ£o pode ser desfeita.'
    );
    
    if (!confirmed) return;
    
    try {
      // Find and remove backup
      // DECISÃƒO: Soft delete - marcar como deleted ao invÃ©s de remover fisicamente
      const backup = this.enterpriseBackup.findTenantBackup(null, backupId);
      if (!backup) throw new Error('Backup nÃ£o encontrado');
      
      backup.deleted = true;
      backup.deleted_at = new Date().toISOString();
      backup.deleted_by = this.currentUser?.username || 'master';
      
      // Save back
      localStorage.setItem(`enterprise_tenant_backup_${backupId}`, JSON.stringify(backup));
      
      this.showToast('Backup excluÃ­do com sucesso', 'success');
      this.loadPropertyBackupCatalog();
      this.updatePropertyBackupMetrics();
      
    } catch (error) {
      console.error('Error deleting backup:', error);
      this.showToast('Erro ao excluir backup: ' + error.message, 'error');
    }
  },
  
  // Restore Wizard
  currentRestoreBackupId: null,
  currentRestoreStep: 1,
  
  openPropertyRestoreWizard(backupId) {
    this.currentRestoreBackupId = backupId;
    this.currentRestoreStep = 1;
    
    const wizard = document.getElementById('tenantRestoreWizard');
    if (wizard) {
      wizard.style.display = 'block';
      wizard.scrollIntoView({ behavior: 'smooth' });
      this.updateRestoreWizardSteps();
    }
  },
  
  closePropertyRestoreWizard() {
    const wizard = document.getElementById('tenantRestoreWizard');
    if (wizard) wizard.style.display = 'none';
    
    this.currentRestoreBackupId = null;
    this.currentRestoreStep = 1;
  },
  
  nextRestoreStep() {
    if (this.currentRestoreStep < 3) {
      this.currentRestoreStep++;
      this.updateRestoreWizardSteps();
    }
  },
  
  prevRestoreStep() {
    if (this.currentRestoreStep > 1) {
      this.currentRestoreStep--;
      this.updateRestoreWizardSteps();
    }
  },
  
  updateRestoreWizardSteps() {
    // Update step visibility
    document.querySelectorAll('.wizard-step').forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.toggle('active', stepNum === this.currentRestoreStep);
    });
    
    // Update buttons
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnExecute = document.getElementById('btnExecuteRestore');
    
    if (btnPrev) btnPrev.style.display = this.currentRestoreStep > 1 ? 'inline-block' : 'none';
    if (btnNext) btnNext.style.display = this.currentRestoreStep < 3 ? 'inline-block' : 'none';
    if (btnExecute) btnExecute.style.display = this.currentRestoreStep === 3 ? 'inline-block' : 'none';
    
    // Step 2: Show backup info
    if (this.currentRestoreStep === 2) {
      const backup = this.enterpriseBackup.findTenantBackup(null, this.currentRestoreBackupId);
      const infoBox = document.getElementById('selectedBackupInfo');
      if (backup && infoBox) {
        infoBox.innerHTML = `
          <strong>Propriedade:</strong> ${backup.tenantId}<br>
          <strong>Tipo:</strong> ${backup.type}<br>
          <strong>Data:</strong> ${new Date(backup.created_at).toLocaleString('pt-BR')}<br>
          <strong>Tamanho:</strong> ${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB
        `;
      }
    }
    
    // Step 3: Validate if enabled
    if (this.currentRestoreStep === 3) {
      const validateCheckbox = document.getElementById('validateBeforeRestore');
      if (validateCheckbox && validateCheckbox.checked) {
        this.validateRestoreBackup();
      }
    }
  },
  
  async validateRestoreBackup() {
    const resultsBox = document.getElementById('validationResults');
    if (!resultsBox) return;
    
    resultsBox.style.display = 'block';
    resultsBox.innerHTML = '<p>Validando integridade do backup...</p>';
    
    try {
      const backup = this.enterpriseBackup.findTenantBackup(null, this.currentRestoreBackupId);
      const isValid = await this.enterpriseBackup.validateRestore(backup);
      
      if (isValid) {
        resultsBox.innerHTML = `
          <div class="alert alert-success">
            <span class="icon">âœ…</span>
            <strong>ValidaÃ§Ã£o bem-sucedida!</strong><br>
            O backup estÃ¡ Ã­ntegro e pronto para restauraÃ§Ã£o.
          </div>
        `;
      } else {
        resultsBox.innerHTML = `
          <div class="alert alert-danger">
            <span class="icon">âŒ</span>
            <strong>Falha na validaÃ§Ã£o!</strong><br>
            O backup pode estar corrompido. NÃ£o recomendado prosseguir.
          </div>
        `;
      }
    } catch (error) {
      resultsBox.innerHTML = `
        <div class="alert alert-danger">
          <span class="icon">âš ï¸</span>
          <strong>Erro na validaÃ§Ã£o:</strong> ${error.message}
        </div>
      `;
    }
  },
  
  async executePropertyRestore() {
    const backup = this.enterpriseBackup.findTenantBackup(null, this.currentRestoreBackupId);
    if (!backup) {
      this.showToast('Backup nÃ£o encontrado', 'error');
      return;
    }
    
    const confirmed = await this.confirmAction(
      'Confirmar RestauraÃ§Ã£o',
      `Esta operaÃ§Ã£o irÃ¡ restaurar o backup de ${backup.tenantId} criado em ${new Date(backup.created_at).toLocaleString('pt-BR')}. Continuar?`
    );
    
    if (!confirmed) return;
    
    try {
      this.showToast('Restaurando backup...', 'info');
      
      // Get restore options
      const restoreMode = document.querySelector('input[name="restoreMode"]:checked')?.value || 'full';
      const validate = document.getElementById('validateBeforeRestore')?.checked || false;
      const createSafety = document.getElementById('createSafetyBackup')?.checked || false;
      
      const options = {
        mode: restoreMode,
        validate,
        createSafetyBackup: createSafety
      };
      
      // Selective modules
      if (restoreMode === 'selective') {
        const modules = [];
        document.querySelectorAll('#selectiveModules input[type="checkbox"]:checked').forEach(cb => {
          modules.push(cb.value);
        });
        options.modules = modules;
      }
      
      const result = await this.enterpriseBackup.restoreTenantBackup(
        backup.tenantId,
        this.currentRestoreBackupId,
        options
      );
      
      this.showToast('Backup restaurado com sucesso!', 'success');
      this.closePropertyRestoreWizard();
      
      // Log activity
      this.addActivityLog('tenant_restore', `Backup ${this.currentRestoreBackupId} restaurado para ${backup.tenantId}`);
      
      // Reload page to reflect changes
      setTimeout(() => {
        if (confirm('RestauraÃ§Ã£o concluÃ­da. Recarregar pÃ¡gina para aplicar mudanÃ§as?')) {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      this.showToast('Erro ao restaurar backup: ' + error.message, 'error');
    }
  },
  
  // Scheduling
  savePropertyBackupSchedule() {
    const propertyId = document.getElementById('schedulePropertySelect')?.value;
    const backupType = document.getElementById('scheduleBackupType')?.value;
    const frequency = document.getElementById('scheduleFrequency')?.value;
    const retentionDaily = parseInt(document.getElementById('retentionDaily')?.value) || 7;
    const retentionWeekly = parseInt(document.getElementById('retentionWeekly')?.value) || 4;
    const retentionMonthly = parseInt(document.getElementById('retentionMonthly')?.value) || 3;
    
    if (!propertyId || !frequency) {
      this.showToast('Preencha todos os campos obrigatÃ³rios', 'warning');
      return;
    }
    
    // DECISÃƒO: Usar estrutura simples de agendamento
    // Formato: cron-like para flexibilidade futura
    const schedule = {
      id: `schedule_${propertyId}_${Date.now()}`,
      propertyId,
      backupType,
      frequency, // cron format: "0 2 * * *" = 2am daily
      retention: {
        daily: retentionDaily,
        weekly: retentionWeekly,
        monthly: retentionMonthly
      },
      enabled: true,
      createdAt: new Date().toISOString(),
      createdBy: this.currentUser?.username || 'master'
    };
    
    // Save to localStorage
    const schedules = this.getPropertyBackupSchedules();
    schedules.push(schedule);
    localStorage.setItem('enterprise_tenant_schedules', JSON.stringify(schedules));
    
    this.showToast('Agendamento salvo com sucesso', 'success');
    this.loadPropertyBackupSchedules();
    
    // Clear form
    document.getElementById('schedulePropertySelect').value = '';
    document.getElementById('scheduleFrequency').value = '';
  },
  
  getPropertyBackupSchedules() {
    try {
      const data = localStorage.getItem('enterprise_tenant_schedules');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Scheduler simples baseado em cron (min hora dia mes dow)
  startPropertyBackupScheduler() {
    if (this._tenantBackupSchedulerStarted) return;
    this._tenantBackupSchedulerStarted = true;

    // Executa a cada 60s
    setInterval(async () => {
      try {
        const now = new Date();
        const schedules = this.getPropertyBackupSchedules().filter(s => s.enabled !== false);
        for (const s of schedules) {
          if (this._shouldRunCron(s.frequency, now)) {
            // Evitar rodar mÃºltiplas vezes no mesmo minuto
            const minuteKey = now.getUTCFullYear()+"-"+(now.getUTCMonth()+1)+"-"+now.getUTCDate()+" "+now.getUTCHours()+":"+now.getUTCMinutes();
            if (s._lastRunMinute === minuteKey) continue;
            s._lastRunMinute = minuteKey;

            // Persistir lastRun no storage (best-effort)
            try {
              const list = this.getTenantBackupSchedules();
              const idx = list.findIndex(x => x.id === s.id);
              if (idx >= 0) { list[idx]._lastRunMinute = minuteKey; localStorage.setItem('enterprise_tenant_schedules', JSON.stringify(list)); }
            } catch {}

            // Executar backup
            const type = (s.backupType || 'incremental').toLowerCase();
            this.showToast(`[Scheduler] Iniciando backup ${type} para ${s.propertyId}`, 'info');
            try {
              if (type === 'full') {
                await this.enterpriseBackup.createTenantBackup(s.propertyId, { type: 'full', createdBy: this.currentUser?.username || 'scheduler', compress: this.isEnterpriseCompressionEnabled(), encrypt: this.isEnterpriseEncryptionEnabled() });
              } else {
                await this.enterpriseBackup.createIncrementalTenantBackup(s.propertyId, { createdBy: this.currentUser?.username || 'scheduler', compress: this.isEnterpriseCompressionEnabled(), encrypt: this.isEnterpriseEncryptionEnabled() });
              }
              this.showToast(`[Scheduler] Backup ${type} concluÃ­do para ${s.propertyId}`, 'success');
              // Atualizar mÃ©tricas e catÃ¡logo se a aba estiver aberta
              this.updateTenantBackupMetrics();
              this.loadTenantBackupCatalog();

              // Aplicar polÃ­tica de retenÃ§Ã£o
              await this.enterpriseBackup.applyRetentionPolicy(s.propertyId, s.retention);
            } catch (e) {
              console.error('Scheduled backup failed:', e);
              this.showToast(`[Scheduler] Falha no backup ${type} para ${s.propertyId}: ${e.message}`, 'error');
            }
          }
        }
      } catch (e) {
        console.warn('Scheduler tick error:', e);
      }
    }, 60000);
  },

  _shouldRunCron(expr, dateObj) {
    // Suporta formato: "m h dom mon dow" com *, nÃºmeros e listas separadas por vÃ­rgula
    if (!expr || typeof expr !== 'string') return false;
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const [m, h, dom, mon, dow] = parts;
    const mNow = dateObj.getMinutes();
    const hNow = dateObj.getHours();
    const domNow = dateObj.getDate();
    const monNow = dateObj.getMonth() + 1; // 1-12
    const dowNow = dateObj.getDay(); // 0-6 (0=domingo)

    const match = (field, value) => {
      if (field === '*') return true;
      // lista "1,15,30"
      if (field.includes(',')) {
        return field.split(',').map(x => parseInt(x.trim(), 10)).includes(value);
      }
      // intervalo "1-5"
      if (field.includes('-')) {
        const [a,b] = field.split('-').map(x => parseInt(x.trim(), 10));
        return value >= a && value <= b;
      }
      // nÃºmero exato
      const n = parseInt(field, 10);
      return !isNaN(n) && n === value;
    };

    return match(m, mNow) && match(h, hNow) && match(dom, domNow) && match(mon, monNow) && match(dow, dowNow);
  },
  
  loadPropertyBackupSchedules() {
    const schedules = this.getPropertyBackupSchedules();
    const container = document.getElementById('scheduleListContent');
    if (!container) return;
    
    if (schedules.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum agendamento configurado</p>';
      return;
    }
    
    container.innerHTML = schedules.map(schedule => `
      <div class="schedule-item" style="border:1px solid #ddd; padding:12px; margin-bottom:8px; border-radius:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${schedule.propertyId}</strong> - ${schedule.backupType}
            <br><small>FrequÃªncia: ${schedule.frequency}</small>
            <br><small>RetenÃ§Ã£o: ${schedule.retention.daily}d / ${schedule.retention.weekly}w / ${schedule.retention.monthly}m</small>
          </div>
          <div>
            <button class="btn btn-sm" onclick="masterCtrl.toggleSchedule('${schedule.id}')" title="${schedule.enabled ? 'Desabilitar' : 'Habilitar'}">
              ${schedule.enabled ? 'â¸ï¸' : 'â–¶ï¸'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="masterCtrl.deleteSchedule('${schedule.id}')" title="Excluir">
              ðŸ—‘ï¸
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  toggleSchedule(scheduleId) {
    const schedules = this.getPropertyBackupSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.enabled = !schedule.enabled;
      localStorage.setItem('enterprise_tenant_schedules', JSON.stringify(schedules));
      this.loadPropertyBackupSchedules();
      this.showToast(`Agendamento ${schedule.enabled ? 'habilitado' : 'desabilitado'}`, 'success');
    }
  },
  
  deleteSchedule(scheduleId) {
    const schedules = this.getPropertyBackupSchedules();
    const filtered = schedules.filter(s => s.id !== scheduleId);
    localStorage.setItem('enterprise_tenant_schedules', JSON.stringify(filtered));
    this.loadPropertyBackupSchedules();
    this.showToast('Agendamento excluÃ­do', 'success');
  },
  
  // Feature toggles (persisted) for compression/encryption
  isEnterpriseCompressionEnabled() {
    try { const v = localStorage.getItem('enterprise_compress_enabled'); if (v===null) return true; return v !== '0' && v !== 'false'; } catch(_) { return true; }
  },
  isEnterpriseEncryptionEnabled() {
    try { const v = localStorage.getItem('enterprise_encrypt_enabled'); if (v===null) return false; return v === '1' || v === 'true'; } catch(_) { return false; }
  },
  
  // ========================================
  // GENERAL BACKUPS UI
  // ========================================
  
  initGeneralBackupsUI() {
    // Load metrics
    this.updateGeneralBackupMetrics();
    
    // Load catalog
    this.loadGeneralBackupCatalog();
    
    // Event listeners
    document.getElementById('btnCreateGeneralBackup')?.addEventListener('click', () => this.handleCreateGeneralBackup());
    document.getElementById('gbSearchInput')?.addEventListener('input', () => this.loadGeneralBackupCatalog());
    document.getElementById('btnCancelGeneralRestore')?.addEventListener('click', () => this.closeGeneralRestorePanel());
    document.getElementById('btnExecuteGeneralRestore')?.addEventListener('click', () => this.executeGeneralRestore());
  },
  
  updateGeneralBackupMetrics() {
    const metrics = this.enterpriseBackup.getMetricsDashboard();
    const gb = metrics.general_backups;
    
    document.getElementById('gbTotalCount').textContent = gb.total_count;
    document.getElementById('gbLastBackup').textContent = gb.last_backup 
      ? new Date(gb.last_backup).toLocaleString('pt-BR')
      : '-';
    
    const totalSize = (gb.total_size_bytes / 1024 / 1024).toFixed(2);
    document.getElementById('gbTotalSize').textContent = totalSize + ' MB';
    
    // Count unique components across all backups
    const allComponents = new Set();
    const backups = this.enterpriseBackup.getGeneralBackupCatalog();
    backups.forEach(b => b.components.forEach(c => allComponents.add(c)));
    document.getElementById('gbComponentCount').textContent = allComponents.size;
  },
  
  async handleCreateGeneralBackup() {
    // Get selected components
    const components = [];
    document.querySelectorAll('.backup-config input[type="checkbox"]:checked').forEach(cb => {
      components.push(cb.value);
    });
    
    if (components.length === 0) {
      this.showToast('Selecione pelo menos um componente', 'warning');
      return;
    }
    
    const version = document.getElementById('gbVersionTag')?.value || `v${Date.now()}`;
    const description = document.getElementById('gbDescription')?.value || 'Backup manual';
    
    try {
      this.showToast('Criando backup de estrutura geral...', 'info');
      
      const result = await this.enterpriseBackup.createGeneralBackup({
        components,
        version,
        description,
        createdBy: this.currentUser?.username || 'master',
        compress: this.isEnterpriseCompressionEnabled(),
        encrypt: this.isEnterpriseEncryptionEnabled()
      });
      
      this.showToast(`Backup de estrutura criado: ${result.version}`, 'success');
      this.updateGeneralBackupMetrics();
      this.loadGeneralBackupCatalog();
      
      // Clear form
      document.getElementById('gbVersionTag').value = '';
      document.getElementById('gbDescription').value = '';
      
      // Log activity
      this.addActivityLog('general_backup', `Backup de estrutura criado: ${version}`);
      
    } catch (error) {
      console.error('Error creating general backup:', error);
      this.showToast('Erro ao criar backup: ' + error.message, 'error');
    }
  },
  
  loadGeneralBackupCatalog() {
    const searchTerm = document.getElementById('gbSearchInput')?.value.toLowerCase() || '';
    const catalog = this.enterpriseBackup.getGeneralBackupCatalog();
    
    // Filter
    let filtered = catalog;
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.version.toLowerCase().includes(searchTerm) ||
        b.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Render table
    const tbody = document.getElementById('generalBackupTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum backup encontrado</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map(backup => `
      <tr>
        <td><strong>${backup.version}</strong><br><small>${backup.description}</small></td>
        <td>${new Date(backup.created_at).toLocaleString('pt-BR')}</td>
        <td>${backup.components.join(', ')}</td>
        <td>${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
        <td><code style="font-size:11px;">${backup.checksum.substring(0, 12)}...</code></td>
        <td>
          <button class="btn btn-sm" onclick="masterCtrl.viewGeneralBackup('${backup.id}')" title="Ver detalhes">
            <span class="icon">ðŸ‘ï¸</span>
          </button>
          <button class="btn btn-sm btn-success" onclick="masterCtrl.openGeneralRestorePanel('${backup.id}')" title="Restaurar">
            <span class="icon">â™»ï¸</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="masterCtrl.deleteGeneralBackup('${backup.id}')" title="Excluir">
            <span class="icon">ðŸ—‘ï¸</span>
          </button>
        </td>
      </tr>
    `).join('');
  },
  
  viewGeneralBackup(backupId) {
    const catalog = this.enterpriseBackup.getGeneralBackupCatalog();
    const backup = catalog.find(b => b.id === backupId);
    
    if (!backup) {
      this.showToast('Backup nÃ£o encontrado', 'error');
      return;
    }
    
    const details = `
      <strong>ID:</strong> ${backup.id}<br>
      <strong>VersÃ£o:</strong> ${backup.version}<br>
      <strong>DescriÃ§Ã£o:</strong> ${backup.description}<br>
      <strong>Data:</strong> ${new Date(backup.created_at).toLocaleString('pt-BR')}<br>
      <strong>Tamanho:</strong> ${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB<br>
      <strong>Checksum:</strong> <code>${backup.checksum}</code><br>
      <strong>Criado por:</strong> ${backup.created_by}<br>
      <strong>Componentes:</strong><br>
      <ul>${backup.components.map(c => `<li>${c}</li>`).join('')}</ul>
    `;
    
    this.showCustomModal('Detalhes do Backup de Estrutura', details);
  },
  
  currentGeneralRestoreBackupId: null,
  
  openGeneralRestorePanel(backupId) {
    this.currentGeneralRestoreBackupId = backupId;
    
    const catalog = this.enterpriseBackup.getGeneralBackupCatalog();
    const backup = catalog.find(b => b.id === backupId);
    
    if (!backup) {
      this.showToast('Backup nÃ£o encontrado', 'error');
      return;
    }
    
    const panel = document.getElementById('generalRestorePanel');
    const infoBox = document.getElementById('gbRestoreInfo');
    
    if (panel && infoBox) {
      infoBox.innerHTML = `
        <div class="info-box">
          <strong>VersÃ£o:</strong> ${backup.version}<br>
          <strong>Data:</strong> ${new Date(backup.created_at).toLocaleString('pt-BR')}<br>
          <strong>Componentes:</strong> ${backup.components.join(', ')}<br>
          <strong>Tamanho:</strong> ${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB
        </div>
      `;
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
    }
  },
  
  closeGeneralRestorePanel() {
    const panel = document.getElementById('generalRestorePanel');
    if (panel) panel.style.display = 'none';
    this.currentGeneralRestoreBackupId = null;
  },
  
  async executeGeneralRestore() {
    if (!this.currentGeneralRestoreBackupId) return;
    
    const confirmed = await this.confirmAction(
      'Confirmar RestauraÃ§Ã£o de Estrutura',
      'ATENÃ‡ÃƒO: Esta operaÃ§Ã£o irÃ¡ restaurar a estrutura geral do sistema. Um backup de seguranÃ§a serÃ¡ criado automaticamente. Continuar?'
    );
    
    if (!confirmed) return;
    
    try {
      this.showToast('Restaurando estrutura geral...', 'info');
      
      const validate = document.getElementById('gbValidateIntegrity')?.checked !== false;
      const createSafety = document.getElementById('gbCreateSafetyBackup')?.checked !== false;
      
      // Executar restore usando o sistema enterprise
      const result = await this.enterpriseBackup.restoreGeneralBackup(
        this.currentGeneralRestoreBackupId,
        {
          validate,
          createSafetyBackup: createSafety,
          createdBy: this.currentUser?.username || 'master'
        }
      );
      
      this.showToast(`Estrutura geral restaurada: ${result.version}!`, 'success');
      this.closeGeneralRestorePanel();
      
      // Log activity
      this.addActivityLog('general_restore', `Estrutura geral restaurada: ${result.version} (${result.restoredComponents.join(', ')})`);
      
      // Reload page to apply changes
      setTimeout(() => {
        if (confirm('RestauraÃ§Ã£o concluÃ­da. A pÃ¡gina serÃ¡ recarregada para aplicar as mudanÃ§as.')) {
          window.location.reload();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error restoring general backup:', error);
      this.showToast('Erro ao restaurar estrutura: ' + error.message, 'error');
    }
  },
  
  async deleteGeneralBackup(backupId) {
    const confirmed = await this.confirmAction(
      'Confirmar ExclusÃ£o',
      'Tem certeza que deseja excluir este backup de estrutura?'
    );
    
    if (!confirmed) return;
    
    try {
      // Soft delete
      const key = `enterprise_general_backup_${backupId}`;
      const backup = JSON.parse(localStorage.getItem(key) || '{}');
      backup.deleted = true;
      backup.deleted_at = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(backup));
      
      this.showToast('Backup excluÃ­do com sucesso', 'success');
      this.loadGeneralBackupCatalog();
      this.updateGeneralBackupMetrics();
      
    } catch (error) {
      console.error('Error deleting general backup:', error);
      this.showToast('Erro ao excluir backup: ' + error.message, 'error');
    }
  },
  
  // ========================================
  // RELEASES UI
  // ========================================
  
  initReleasesUI() {
    // Load metrics
    this.updateReleaseMetrics();
    
    // Load timeline
    this.loadReleaseTimeline();
    
    // Load feature flags
    this.loadFeatureFlags();
    
    // Event listeners
    document.getElementById('btnCreateRelease')?.addEventListener('click', () => this.handleCreateRelease());
    document.getElementById('releaseFilterChannel')?.addEventListener('change', () => this.loadReleaseTimeline());
    document.getElementById('btnCreateFeatureFlag')?.addEventListener('click', () => this.showCreateFeatureFlagModal());
    document.getElementById('btnCancelRollback')?.addEventListener('click', () => this.closeRollbackPanel());
    document.getElementById('btnExecuteRollback')?.addEventListener('click', () => this.executeRollback());
  },
  
  updateReleaseMetrics() {
    const metrics = this.enterpriseBackup.getMetricsDashboard();
    const rm = metrics.releases;
    
    document.getElementById('rmActiveVersion').textContent = rm.active_version || '-';
    document.getElementById('rmTotalReleases').textContent = rm.total_count;
    document.getElementById('rmLastDeploy').textContent = rm.last_deploy 
      ? new Date(rm.last_deploy).toLocaleString('pt-BR')
      : '-';
    document.getElementById('rmRollbackCount').textContent = rm.rollback_count;
  },
  
  async handleCreateRelease() {
    const version = document.getElementById('releaseVersion')?.value;
    const name = document.getElementById('releaseName')?.value;
    const channel = document.getElementById('releaseChannel')?.value || 'dev';
    const changelog = document.getElementById('releaseChangelog')?.value;
    const migrationsStr = document.getElementById('releaseMigrations')?.value;
    const filesStr = document.getElementById('releaseFiles')?.value;
    
    if (!version || !name) {
      this.showToast('Preencha versÃ£o e nome da release', 'warning');
      return;
    }
    
    // Parse migrations
    let migrations = [];
    if (migrationsStr) {
      try {
        migrations = JSON.parse(migrationsStr);
      } catch (e) {
        this.showToast('Formato invÃ¡lido de migrations (deve ser JSON array)', 'error');
        return;
      }
    }
    
    // Parse files
    const files = filesStr ? filesStr.split(',').map(f => f.trim()) : [];
    
    try {
      this.showToast('Criando release...', 'info');
      
      const release = await this.releaseManagement.createRelease({
        version,
        name,
        channel,
        changelog: changelog.split('\n').filter(l => l.trim()),
        migrations,
        files,
        createdBy: this.currentUser?.username || 'master'
      });
      
      this.showToast(`Release ${version} criada com sucesso!`, 'success');
      this.updateReleaseMetrics();
      this.loadReleaseTimeline();
      
      // Clear form
      document.getElementById('releaseVersion').value = '';
      document.getElementById('releaseName').value = '';
      document.getElementById('releaseChangelog').value = '';
      document.getElementById('releaseMigrations').value = '';
      document.getElementById('releaseFiles').value = '';
      
      // Log activity
      this.addActivityLog('release_created', `Release ${version} criada`);
      
    } catch (error) {
      console.error('Error creating release:', error);
      this.showToast('Erro ao criar release: ' + error.message, 'error');
    }
  },
  
  loadReleaseTimeline() {
    const filterChannel = document.getElementById('releaseFilterChannel')?.value || 'all';
    const history = this.releaseManagement.getReleaseHistory();
    
    // Filter
    let filtered = history;
    if (filterChannel !== 'all') {
      filtered = filtered.filter(r => r.channel === filterChannel);
    }
    
    // Render timeline
    const timeline = document.getElementById('releaseTimeline');
    if (!timeline) return;
    
    if (filtered.length === 0) {
      timeline.innerHTML = '<p class="text-center text-muted">Nenhuma release encontrada</p>';
      return;
    }
    
    timeline.innerHTML = filtered.map(release => {
      const isActive = release.status === 'deployed';
      const canRollback = isActive && release !== filtered[filtered.length - 1]; // Not the oldest
      
      return `
        <div class="release-item" style="border-left:4px solid ${isActive ? '#28a745' : '#6c757d'}; padding:16px; margin-bottom:16px; background:#f8f9fa; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
              <h4 style="margin:0 0 8px 0;">
                <span class="badge badge-${release.channel === 'prod' ? 'danger' : release.channel === 'staging' ? 'warning' : 'info'}">${release.channel}</span>
                ${release.version} - ${release.name}
                ${isActive ? '<span class="badge badge-success">ATIVO</span>' : ''}
              </h4>
              <p style="margin:0 0 8px 0; font-size:13px; color:#666;">
                Criado em ${new Date(release.created_at).toLocaleString('pt-BR')} por ${release.created_by}
              </p>
              ${release.changelog && release.changelog.length > 0 ? `
                <details style="margin-top:8px;">
                  <summary style="cursor:pointer; font-weight:500;">Changelog</summary>
                  <ul style="margin:8px 0 0 20px; font-size:13px;">
                    ${release.changelog.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </details>
              ` : ''}
            </div>
            <div style="display:flex; gap:8px;">
              ${!isActive && release.status !== 'deployed' ? `
                <button class="btn btn-sm btn-primary" onclick="masterCtrl.deployRelease('${release.id}')" title="Deploy">
                  <span class="icon">ðŸš€</span> Deploy
                </button>
              ` : ''}
              ${canRollback ? `
                <button class="btn btn-sm btn-danger" onclick="masterCtrl.openRollbackPanel('${release.id}')" title="Rollback">
                  <span class="icon">âª</span> Rollback
                </button>
              ` : ''}
              <button class="btn btn-sm" onclick="masterCtrl.viewRelease('${release.id}')" title="Detalhes">
                <span class="icon">ðŸ‘ï¸</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },
  
  async deployRelease(releaseId) {
    const confirmed = await this.confirmAction(
      'Confirmar Deploy',
      'Esta operaÃ§Ã£o irÃ¡ fazer o deploy da release. Um backup automÃ¡tico serÃ¡ criado antes. Continuar?'
    );
    
    if (!confirmed) return;
    
    try {
      this.showToast('Iniciando deploy...', 'info');
      
      const result = await this.releaseManagement.deployRelease(releaseId);
      
      this.showToast('Deploy realizado com sucesso!', 'success');
      this.updateReleaseMetrics();
      this.loadReleaseTimeline();
      
      // Log activity
      this.addActivityLog('release_deployed', `Release ${releaseId} deployed`);
      
      // Reload page
      setTimeout(() => {
        if (confirm('Deploy concluÃ­do. Recarregar pÃ¡gina para aplicar mudanÃ§as?')) {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error deploying release:', error);
      this.showToast('Erro no deploy: ' + error.message, 'error');
    }
  },
  
  viewRelease(releaseId) {
    const release = this.releaseManagement.findRelease(releaseId);
    if (!release) {
      this.showToast('Release nÃ£o encontrada', 'error');
      return;
    }
    
    const details = `
      <strong>VersÃ£o:</strong> ${release.version}<br>
      <strong>Nome:</strong> ${release.name}<br>
      <strong>Canal:</strong> ${release.channel}<br>
      <strong>Status:</strong> ${release.status}<br>
      <strong>Criado em:</strong> ${new Date(release.created_at).toLocaleString('pt-BR')}<br>
      <strong>Criado por:</strong> ${release.created_by}<br>
      ${release.deployed_at ? `<strong>Deploy em:</strong> ${new Date(release.deployed_at).toLocaleString('pt-BR')}<br>` : ''}
      ${release.changelog && release.changelog.length > 0 ? `
        <strong>Changelog:</strong><br>
        <ul>${release.changelog.map(item => `<li>${item}</li>`).join('')}</ul>
      ` : ''}
      ${release.files && release.files.length > 0 ? `
        <strong>Arquivos:</strong> ${release.files.join(', ')}<br>
      ` : ''}
      ${release.migrations && release.migrations.length > 0 ? `
        <strong>Migrations:</strong> ${release.migrations.length} migration(s)<br>
      ` : ''}
    `;
    
    this.showCustomModal('Detalhes da Release', details);
  },
  
  currentRollbackReleaseId: null,
  
  async openRollbackPanel(releaseId) {
    this.currentRollbackReleaseId = releaseId;
    
    // Generate rollback plan
    const plan = await this.releaseManagement.generateRollbackPlan(releaseId);
    
    const panel = document.getElementById('rollbackPanel');
    const infoBox = document.getElementById('rollbackInfo');
    const planBox = document.getElementById('rollbackPlan');
    
    if (panel && infoBox && planBox) {
      infoBox.innerHTML = `
        <div class="info-box">
          <strong>Reverter para:</strong> ${plan.targetRelease.version} (${plan.targetRelease.name})<br>
          <strong>Release atual:</strong> ${plan.currentRelease.version}<br>
          <strong>Data do target:</strong> ${new Date(plan.targetRelease.created_at).toLocaleString('pt-BR')}
        </div>
      `;
      
      planBox.innerHTML = `
        <h4>Plano de Rollback</h4>
        <ol style="font-size:13px;">
          ${plan.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
        ${plan.backwardMigrations.length > 0 ? `
          <p><strong>Migrations backward:</strong> ${plan.backwardMigrations.length} migration(s) serÃ£o executadas</p>
        ` : ''}
      `;
      
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
    }
  },
  
  closeRollbackPanel() {
    const panel = document.getElementById('rollbackPanel');
    if (panel) panel.style.display = 'none';
    this.currentRollbackReleaseId = null;
  },
  
  async executeRollback() {
    if (!this.currentRollbackReleaseId) return;
    
    const doubleConfirm = await this.confirmAction(
      'ðŸš¨ CONFIRMAÃ‡ÃƒO FINAL DE ROLLBACK',
      'Esta Ã© uma operaÃ§Ã£o CRÃTICA que irÃ¡ reverter o sistema. Modo de manutenÃ§Ã£o serÃ¡ ativado. Tem ABSOLUTA CERTEZA?'
    );
    
    if (!doubleConfirm) return;
    
    try {
      this.showToast('Executando rollback...', 'info');
      
      const maintenanceMode = document.getElementById('rollbackMaintenanceMode')?.checked || false;
      const runMigrations = document.getElementById('rollbackRunMigrations')?.checked || false;
      
      const result = await this.releaseManagement.rollbackRelease(this.currentRollbackReleaseId, {
        maintenanceMode,
        runBackwardMigrations: runMigrations
      });
      
      this.showToast('Rollback executado com sucesso!', 'success');
      this.closeRollbackPanel();
      this.updateReleaseMetrics();
      this.loadReleaseTimeline();
      
      // Log activity
      this.addActivityLog('rollback_executed', `Rollback para release ${this.currentRollbackReleaseId}`);
      
      // Force reload
      setTimeout(() => {
        alert('Rollback concluÃ­do. A pÃ¡gina serÃ¡ recarregada.');
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error executing rollback:', error);
      this.showToast('Erro no rollback: ' + error.message, 'error');
    }
  },
  
  // Feature Flags
  loadFeatureFlags() {
    const flags = this.releaseManagement.getFeatureFlags();
    const tbody = document.getElementById('featureFlagsTableBody');
    if (!tbody) return;
    
    if (flags.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma feature flag configurada</td></tr>';
      return;
    }
    
    tbody.innerHTML = flags.map(flag => `
      <tr>
        <td><strong>${flag.name}</strong></td>
        <td><span class="badge badge-${flag.enabled ? 'success' : 'secondary'}">${flag.enabled ? 'Ativo' : 'Inativo'}</span></td>
        <td>${flag.rolloutPercentage}%</td>
        <td>${flag.targetTenants.length > 0 ? flag.targetTenants.join(', ') : 'Todos'}</td>
        <td>
          <button class="btn btn-sm" onclick="masterCtrl.toggleFeatureFlag('${flag.name}')" title="${flag.enabled ? 'Desativar' : 'Ativar'}">
            ${flag.enabled ? 'ðŸ”´' : 'ðŸŸ¢'}
          </button>
          <button class="btn btn-sm" onclick="masterCtrl.editFeatureFlag('${flag.name}')" title="Editar">
            âœï¸
          </button>
          <button class="btn btn-sm btn-danger" onclick="masterCtrl.deleteFeatureFlag('${flag.name}')" title="Excluir">
            ðŸ—‘ï¸
          </button>
        </td>
      </tr>
    `).join('');
  },
  
  showCreateFeatureFlagModal() {
    const html = `
      <div class="form-group">
        <label>Nome da Flag</label>
        <input type="text" id="ffName" class="input" placeholder="new_dashboard_ui">
      </div>
      <div class="form-group">
        <label>Rollout Percentage (0-100)</label>
        <input type="number" id="ffRollout" class="input" value="0" min="0" max="100">
      </div>
      <div class="form-group">
        <label>Clientes Alvo (separados por vÃ­rgula, deixe vazio para todos)</label>
        <input type="text" id="ffTenants" class="input" placeholder="property1, property2">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="ffEnabled" checked> Ativar imediatamente
        </label>
      </div>
      <button class="btn btn-primary" onclick="masterCtrl.saveFeatureFlag()">Criar Feature Flag</button>
    `;
    
    this.showCustomModal('Nova Feature Flag', html);
  },
  
  saveFeatureFlag() {
    const name = document.getElementById('ffName')?.value;
    const rolloutPercentage = parseInt(document.getElementById('ffRollout')?.value) || 0;
    const tenantsStr = document.getElementById('ffTenants')?.value || '';
    const enabled = document.getElementById('ffEnabled')?.checked || false;
    
    if (!name) {
      this.showToast('Informe o nome da flag', 'warning');
      return;
    }
    
    const targetTenants = tenantsStr ? tenantsStr.split(',').map(t => t.trim()) : [];
    
    this.releaseManagement.setFeatureFlag(name, enabled, {
      rolloutPercentage,
      targetTenants
    });
    
    this.showToast('Feature flag criada com sucesso', 'success');
    this.loadFeatureFlags();
    this.closeCustomModal();
  },
  
  toggleFeatureFlag(name) {
    const flags = this.releaseManagement.getFeatureFlags();
    const flag = flags.find(f => f.name === name);
    if (flag) {
      this.releaseManagement.setFeatureFlag(name, !flag.enabled, {
        rolloutPercentage: flag.rolloutPercentage,
        targetTenants: flag.targetTenants
      });
      this.showToast(`Feature flag ${name} ${!flag.enabled ? 'ativada' : 'desativada'}`, 'success');
      this.loadFeatureFlags();
    }
  },
  
  deleteFeatureFlag(name) {
    // Remove flag from storage
    const flags = this.releaseManagement.getFeatureFlags();
    const filtered = flags.filter(f => f.name !== name);
    localStorage.setItem('enterprise_feature_flags', JSON.stringify(filtered));
    
    this.showToast('Feature flag excluÃ­da', 'success');
    this.loadFeatureFlags();
  },
  
  // ========================================
  // HELPERS
  // ========================================
  
  showCustomModal(title, content) {
    // Create modal if not exists
    let modal = document.getElementById('customModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h2 id="customModalTitle"></h2>
            <button class="modal-close" onclick="masterCtrl.closeCustomModal()">&times;</button>
          </div>
          <div class="modal-body" id="customModalBody"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    document.getElementById('customModalTitle').textContent = title;
    document.getElementById('customModalBody').innerHTML = content;
    modal.style.display = 'flex';
  },
  
  closeCustomModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
  },
  
  addActivityLog(type, message) {
    // Add to existing activity log system
    if (typeof this.addLog === 'function') {
      this.addLog(type, message);
    }
  }
  
});

console.info('âœ… Master Control Enterprise Integration loaded');

// Se o controlador jÃ¡ estiver instanciado, inicializar Enterprise Systems/UI agora
try {
  if (window.masterCtrl) {
    if (typeof window.masterCtrl.initEnterpriseBackupSystems === 'function' && !window.masterCtrl.enterpriseBackup) {
      window.masterCtrl.initEnterpriseBackupSystems();
    }
    if (typeof window.masterCtrl.initEnterpriseUI === 'function') {
      window.masterCtrl.initEnterpriseUI();
    }
  }
} catch (e) {
  console.warn('Deferred enterprise initialization failed:', e);
}

