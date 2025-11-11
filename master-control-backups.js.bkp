/**
 * Master Control - Backup Management System
 * Gerencia backups de propriedades com upload/download
 * Suporta Cloud e On-Premise
 */

(function() {
  'use strict';

  // Esperar masterCtrl estar disponível
  function waitForMasterCtrl(callback) {
    if (typeof masterCtrl !== 'undefined') {
      callback();
    } else {
      setTimeout(() => waitForMasterCtrl(callback), 100);
    }
  }

  // ========================================
  // BACKUP MANAGER
  // ========================================

  class BackupManager {
    constructor(masterCtrl) {
      this.masterCtrl = masterCtrl;
      this.backupStorage = new Map(); // {propertyId: [{id, name, type, date, size, relativePath}, ...]}
      this.loadBackupMetadata();
    }

    // === PROPRIEDADES ===
    getPropertiesList() {
      const props = [];
      const propsSet = new Set(); // Usar Set para evitar duplicatas
      
      try {
        const users = this.masterCtrl.getAllUsers();
        console.log('BackupManager: Carregando propriedades de', users.length, 'usuários');
        
        users.forEach(u => {
          // Verificar array de properties
          if (u.properties && Array.isArray(u.properties)) {
            u.properties.forEach(p => {
              if (p && typeof p === 'string' && p.trim()) {
                propsSet.add(p.trim());
              }
            });
          }
          
          // Também verificar propertyId individual
          if (u.propertyId && typeof u.propertyId === 'string' && u.propertyId.trim()) {
            propsSet.add(u.propertyId.trim());
          }
        });
        
        // Converter Set para Array
        propsSet.forEach(p => props.push(p));
        
        console.log('BackupManager: Propriedades encontradas:', props);
        
      } catch (e) {
        console.error('Error getting properties:', e);
      }
      
      return props.sort();
    }

    populatePropertySelect(selectId) {
      const select = document.getElementById(selectId);
      if (!select) return;

      const props = this.getPropertiesList();
      let html = '<option value="">-- Selecione uma propriedade --</option>';
      
      props.forEach(p => {
        html += `<option value="${p}">${p}</option>`;
      });

      select.innerHTML = html;
    }

    // === METADATA ===
    loadBackupMetadata() {
      try {
        const data = localStorage.getItem('backup_metadata') || '{}';
        const parsed = JSON.parse(data);
        this.backupStorage.clear();
        
        Object.entries(parsed).forEach(([propId, backups]) => {
          this.backupStorage.set(propId, backups);
        });
      } catch (e) {
        console.warn('Error loading backup metadata:', e);
      }
    }

    saveBackupMetadata() {
      try {
        const data = {};
        this.backupStorage.forEach((backups, propId) => {
          data[propId] = backups;
        });
        localStorage.setItem('backup_metadata', JSON.stringify(data));
      } catch (e) {
        console.warn('Error saving backup metadata:', e);
      }
    }

    // === CRIAR BACKUP ===
    async createPropertyBackup(propertyId, backupType = 'full') {
      if (!propertyId) {
        this.showNotification('Selecione uma propriedade para fazer backup', 'warning');
        return;
      }

      try {
        this.showNotification('Criando backup de propriedade...', 'info');

        const backupData = {
          propertyId: propertyId,
          type: backupType,
          timestamp: new Date().toISOString(),
          data: this.collectPropertyData(propertyId)
        };

        const backupJson = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupJson], { type: 'application/json' });
        
        // Definir pasta baseada no tipo
        const folder = backupType === 'full' ? 'full_bkp' : 'incremental';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup_${propertyId}_${timestamp}.json`;
        const relativePath = `../bkp/property/${folder}/${filename}`;

        // Salvar metadados
        const backupInfo = {
          id: `backup_${Date.now()}`,
          propertyId: propertyId,
          name: filename,
          relativePath: relativePath,
          type: backupType,
          date: new Date().toLocaleString('pt-BR'),
          size: this.formatBytes(blob.size),
          sizeBytes: blob.size,
          timestamp: new Date().toISOString()
        };

        if (!this.backupStorage.has(propertyId)) {
          this.backupStorage.set(propertyId, []);
        }

        this.backupStorage.get(propertyId).push(backupInfo);
        this.saveBackupMetadata();

        // Fazer download do arquivo
        this.downloadBackupFile(blob, filename, folder, 'property');

        this.showNotification(`✅ Backup criado: ${relativePath}`, 'success');
        this.renderPropertyBackupsList(propertyId);

        // Log
        if (this.masterCtrl.logActivity) {
          this.masterCtrl.logActivity('backup', 'info', `Property backup created: ${propertyId}`, {
            backupId: backupInfo.id,
            size: blob.size,
            path: relativePath
          });
        }

      } catch (error) {
        console.error('Error creating backup:', error);
        this.showNotification(`❌ Erro ao criar backup: ${error.message}`, 'error');
      }
    }

    // === COLETAR DADOS DA PROPRIEDADE ===
    collectPropertyData(propertyId) {
      const data = {
        propertyId: propertyId,
        reservations: [],
        inventory: [],
        configurations: []
      };

      try {
        // Coletar reservas da propriedade
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('reservation_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key));
              if (item && (item.propertyId === propertyId || (item.property && item.property.id === propertyId))) {
                data.reservations.push(item);
              }
            } catch (e) {}
          }
        }

        // Coletar inventário da propriedade
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('inventory_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key));
              if (item && (item.propertyId === propertyId || (item.property && item.property.id === propertyId))) {
                data.inventory.push(item);
              }
            } catch (e) {}
          }
        }

        // Coletar configurações da propriedade
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('config_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key));
              if (item && item.propertyId === propertyId) {
                data.configurations.push(item);
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Error collecting property data:', e);
      }

      return data;
    }

    // === DOWNLOAD BACKUP FILE ===
    downloadBackupFile(blob, filename, folder, type) {
      try {
        // Criar link de download com nome sugerido incluindo estrutura de pasta
        const suggestedName = type === 'property' 
          ? `bkp_property_${folder}_${filename}`
          : `bkp_${folder}_${filename}`;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = suggestedName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Também salvar referência em localStorage para histórico
        const backupData = {
          filename: filename,
          folder: folder,
          type: type,
          timestamp: new Date().toISOString()
        };
        
        const history = JSON.parse(localStorage.getItem('backup_download_history') || '[]');
        history.push(backupData);
        if (history.length > 50) history.shift(); // Manter últimos 50
        localStorage.setItem('backup_download_history', JSON.stringify(history));
        
      } catch (e) {
        console.warn('Error downloading backup file:', e);
        throw e;
      }
    }

    // === LISTAR BACKUPS ===
    renderPropertyBackupsList(propertyId) {
      const container = document.getElementById('propertyBackupsCatalog');
      if (!container) return;

      const backups = this.backupStorage.get(propertyId) || [];

      if (backups.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhum backup encontrado para esta propriedade</div>';
        return;
      }

      let html = '<div class="backups-list">';

      backups.forEach(backup => {
        const pathDisplay = backup.relativePath || `../bkp/property/${backup.type === 'full' ? 'full_bkp' : 'incremental'}/${backup.name}`;
        html += `
          <div class="backup-card">
            <div class="backup-card-header">
              <span class="backup-icon">📦</span>
              <h4>${backup.name}</h4>
              <span class="backup-type badge-${backup.type}">${backup.type}</span>
            </div>
            <div class="backup-card-body">
              <p><strong>Data:</strong> ${backup.date}</p>
              <p><strong>Tamanho:</strong> ${backup.size}</p>
              <p><strong>Local:</strong> ${pathDisplay}</p>
            </div>
            <div class="backup-card-actions">
              <button class="btn btn-sm" onclick="backupManager.downloadBackupAgain('${propertyId}', '${backup.name}')">
                ⬇️ Baixar
              </button>
              <button class="btn btn-sm btn-success" onclick="backupManager.restorePropertyBackup('${propertyId}', '${backup.name}')">
                ↩️ Restaurar
              </button>
              <button class="btn btn-sm btn-danger" onclick="backupManager.deleteBackup('${propertyId}', '${backup.name}')">
                🗑️ Deletar
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    }

    // === DOWNLOAD BACKUP AGAIN ===
    downloadBackupAgain(propertyId, filename) {
      this.showNotification('ℹ️ Para baixar novamente, crie um novo backup. Os backups são salvos automaticamente ao serem criados.', 'info');
    }

    // === RESTAURAR BACKUP ===
    async restorePropertyBackup(propertyId, filename) {
      // Criar input file para upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirmed = confirm('⚠️ Tem certeza que deseja restaurar este backup? Dados atuais da propriedade serão substituídos.');
        if (!confirmed) return;

        try {
          this.showNotification('Restaurando backup...', 'info');

          const text = await file.text();
          const backupData = JSON.parse(text);

          // Validar estrutura
          if (!backupData.data) {
            throw new Error('Estrutura de backup inválida');
          }

          // Restaurar dados
          const data = backupData.data;
          
          data.reservations?.forEach(item => {
            localStorage.setItem(`reservation_${item.id}`, JSON.stringify(item));
          });

          data.inventory?.forEach(item => {
            localStorage.setItem(`inventory_${item.id}`, JSON.stringify(item));
          });

          data.configurations?.forEach(item => {
            localStorage.setItem(`config_${item.id}`, JSON.stringify(item));
          });

          this.showNotification('✅ Backup restaurado com sucesso! Recarregando...', 'success');

          if (this.masterCtrl.logActivity) {
            this.masterCtrl.logActivity('restore', 'info', `Property backup restored: ${propertyId}`, {
              filename: file.name
            });
          }

          setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
          console.error('Error restoring backup:', error);
          this.showNotification(`❌ Erro ao restaurar backup: ${error.message}`, 'error');
        }
      };

      input.click();
    }

    // === DELETAR BACKUP ===
    deleteBackup(propertyId, filename) {
      const confirmed = confirm('⚠️ Tem certeza que deseja deletar este backup do histórico?');
      if (!confirmed) return;

      try {
        // Remover apenas metadados (arquivo já foi baixado pelo usuário)
        const backups = this.backupStorage.get(propertyId) || [];
        const filtered = backups.filter(b => b.name !== filename);
        
        if (filtered.length === 0) {
          this.backupStorage.delete(propertyId);
        } else {
          this.backupStorage.set(propertyId, filtered);
        }

        this.saveBackupMetadata();
        this.showNotification('✅ Registro de backup removido do histórico', 'success');
        this.renderPropertyBackupsList(propertyId);

      } catch (error) {
        console.error('Error deleting backup:', error);
        this.showNotification(`❌ Erro ao deletar registro: ${error.message}`, 'error');
      }
    }

    // === GENERAL STRUCTURE BACKUPS ===
    async createGeneralBackup(backupType = 'full') {
      try {
        this.showNotification('Criando backup de estrutura geral...', 'info');

        const backupData = {
          type: 'general',
          backupType: backupType,
          timestamp: new Date().toISOString(),
          data: this.collectGeneralData()
        };

        const backupJson = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupJson], { type: 'application/json' });
        
        // Definir pasta baseada no tipo
        const folder = backupType === 'full' ? 'full_bkp' : 'snapshot';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup_general_${timestamp}.json`;
        const relativePath = `../bkp/${folder}/${filename}`;

        // Salvar metadados
        const backupInfo = {
          id: `backup_general_${Date.now()}`,
          name: filename,
          relativePath: relativePath,
          type: backupType,
          date: new Date().toLocaleString('pt-BR'),
          size: this.formatBytes(blob.size),
          sizeBytes: blob.size,
          timestamp: new Date().toISOString()
        };

        if (!this.backupStorage.has('__general__')) {
          this.backupStorage.set('__general__', []);
        }

        this.backupStorage.get('__general__').push(backupInfo);
        this.saveBackupMetadata();

        // Fazer download do arquivo
        this.downloadBackupFile(blob, filename, folder, 'general');

        this.showNotification(`✅ Backup de estrutura criado: ${relativePath}`, 'success');
        this.renderGeneralBackupsList();

        if (this.masterCtrl.logActivity) {
          this.masterCtrl.logActivity('backup', 'info', `General structure backup created`, {
            backupId: backupInfo.id,
            size: blob.size,
            path: relativePath
          });
        }

      } catch (error) {
        console.error('Error creating general backup:', error);
        this.showNotification(`❌ Erro ao criar backup: ${error.message}`, 'error');
      }
    }

    collectGeneralData() {
      return {
        timestamp: new Date().toISOString(),
        users: this.masterCtrl.getAllUsers ? this.masterCtrl.getAllUsers() : [],
        configs: []
      };
    }

    renderGeneralBackupsList() {
      const container = document.getElementById('generalBackupsCatalog');
      if (!container) return;

      const backups = this.backupStorage.get('__general__') || [];

      if (backups.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhum backup de estrutura encontrado</div>';
        return;
      }

      let html = '<div class="backups-list">';

      backups.forEach(backup => {
        const pathDisplay = backup.relativePath || `../bkp/${backup.type === 'full' ? 'full_bkp' : 'snapshot'}/${backup.name}`;
        html += `
          <div class="backup-card">
            <div class="backup-card-header">
              <span class="backup-icon">🏗️</span>
              <h4>${backup.name}</h4>
              <span class="backup-type badge-${backup.type}">${backup.type}</span>
            </div>
            <div class="backup-card-body">
              <p><strong>Data:</strong> ${backup.date}</p>
              <p><strong>Tamanho:</strong> ${backup.size}</p>
              <p><strong>Local:</strong> ${pathDisplay}</p>
            </div>
            <div class="backup-card-actions">
              <button class="btn btn-sm" onclick="backupManager.downloadBackupAgain('__general__', '${backup.name}')">
                ⬇️ Baixar
              </button>
              <button class="btn btn-sm btn-success" onclick="backupManager.restoreGeneralBackup('${backup.name}')">
                ↩️ Restaurar
              </button>
              <button class="btn btn-sm btn-danger" onclick="backupManager.deleteGeneralBackup('${backup.name}')">
                🗑️ Deletar
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    }

    async restoreGeneralBackup(filename) {
      // Criar input file para upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirmed = confirm('⚠️ Tem certeza que deseja restaurar este backup? Dados gerais serão substituídos.');
        if (!confirmed) return;

        try {
          this.showNotification('Restaurando backup de estrutura...', 'info');

          const text = await file.text();
          const backupData = JSON.parse(text);

          // Validar estrutura
          if (!backupData.data) {
            throw new Error('Estrutura de backup inválida');
          }

          // Restaurar usuários
          backupData.data.users?.forEach(user => {
            localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
          });

          this.showNotification('✅ Backup de estrutura restaurado! Recarregando...', 'success');

          if (this.masterCtrl.logActivity) {
            this.masterCtrl.logActivity('restore', 'info', `General structure backup restored`, {
              filename: file.name
            });
          }

          setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
          console.error('Error restoring general backup:', error);
          this.showNotification(`❌ Erro ao restaurar: ${error.message}`, 'error');
        }
      };

      input.click();
    }

    deleteGeneralBackup(filename) {
      const confirmed = confirm('⚠️ Tem certeza que deseja deletar este backup do histórico?');
      if (!confirmed) return;

      try {
        // Remover apenas metadados (arquivo já foi baixado pelo usuário)
        const backups = this.backupStorage.get('__general__') || [];
        const filtered = backups.filter(b => b.name !== filename);

        if (filtered.length === 0) {
          this.backupStorage.delete('__general__');
        } else {
          this.backupStorage.set('__general__', filtered);
        }

        this.saveBackupMetadata();
        this.showNotification('✅ Registro de backup removido do histórico', 'success');
        this.renderGeneralBackupsList();

      } catch (error) {
        console.error('Error deleting general backup:', error);
        this.showNotification(`❌ Erro ao deletar: ${error.message}`, 'error');
      }
    }

    // === UTILITIES ===
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
      const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };

      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
      `;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          if (notification.parentElement) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }
  }

  // ========================================
  // INICIALIZAÇÃO
  // ========================================

  waitForMasterCtrl(() => {
    window.backupManager = new BackupManager(masterCtrl);

    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }

      .backups-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .backup-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        background: #f9f9f9;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .backup-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .backup-icon {
        font-size: 24px;
      }

      .backup-card-header h4 {
        margin: 0;
        flex: 1;
        word-break: break-word;
        font-size: 14px;
      }

      .backup-type {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }

      .badge-full {
        background: #dbeafe;
        color: #1e40af;
      }

      .badge-incremental {
        background: #dcfce7;
        color: #166534;
      }

      .badge-snapshot {
        background: #fce7f3;
        color: #831843;
      }

      .backup-card-body {
        margin-bottom: 12px;
      }

      .backup-card-body p {
        margin: 4px 0;
        font-size: 13px;
        color: #666;
      }

      .backup-card-actions {
        display: flex;
        gap: 8px;
      }

      .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
      }

      .btn-success {
        background: #22c55e;
        color: white;
      }

      .empty-state {
        padding: 40px;
        text-align: center;
        color: #999;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);

    console.log('✅ Backup Manager initialized successfully!');
  });

})();
