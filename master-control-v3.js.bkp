/* ============================================
   MASTER CONTROL V3 - JAVASCRIPT ENHANCEMENTS
   New UI Interactions for Restructured Navigation
   ============================================ */

// === HELP SYSTEM ===
function initHelpSystem() {
  // Attach click handlers to all help buttons
  document.querySelectorAll('.btn-help').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const helpId = this.getAttribute('data-help');
      toggleHelpPanel(helpId);
    });
  });
}

function toggleHelpPanel(helpId) {
  const panel = document.getElementById(`help-${helpId}`);
  if (!panel) return;
  
  // Toggle visibility
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    // Animate
    panel.style.animation = 'slideDown 0.3s ease';
  } else {
    panel.style.display = 'none';
  }
}

// === BACKUP SUBTABS NAVIGATION ===
function initBackupSubnavigation() {
  const subnavButtons = document.querySelectorAll('#backupSubnav .subnav-btn');
  
  subnavButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active from all buttons
      subnavButtons.forEach(b => b.classList.remove('active'));
      
      // Add active to clicked button
      this.classList.add('active');
      
      // Get target section
      const targetId = this.getAttribute('data-target');
      
      // Hide all sections
      document.querySelectorAll('#tab-backups .master-card[id^="section-"]').forEach(section => {
        section.style.display = 'none';
      });
      
      // Show target section
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = 'block';
        // Update breadcrumb if needed
        updateBreadcrumb(targetId);
      }
    });
  });
}

function updateBreadcrumb(sectionId) {
  // Optional: Update breadcrumb based on current section
  // Example: Add third level to breadcrumb
  const breadcrumb = document.querySelector('#tab-backups .breadcrumb');
  if (!breadcrumb) return;
  
  // Remove existing third level if any
  const existingThirdLevel = breadcrumb.querySelector('.breadcrumb-third');
  if (existingThirdLevel) {
    existingThirdLevel.remove();
  }
  
  // Add new third level based on section
  let thirdLevelText = '';
  if (sectionId === 'section-property-backups') {
    thirdLevelText = 'Property Backups';
  } else if (sectionId === 'section-general-structure') {
    thirdLevelText = 'General Structure';
  }
  
  if (thirdLevelText) {
    const separator = document.createElement('span');
    separator.className = 'separator';
    separator.textContent = '›';
    
    const thirdLevel = document.createElement('span');
    thirdLevel.className = 'breadcrumb-third';
    thirdLevel.textContent = thirdLevelText;
    
    breadcrumb.appendChild(separator);
    breadcrumb.appendChild(thirdLevel);
  }
}

// === LANGUAGE SELECTOR ===
function initLanguageSelector() {
  const languageButtons = document.querySelectorAll('.language-btn');
  
  languageButtons.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      // Remove active from all buttons
      languageButtons.forEach(b => b.classList.remove('active'));
      
      // Add active to clicked button
      this.classList.add('active');
      
      // Get selected language
      const lang = this.getAttribute('data-lang');
      
      // Load i18n for selected language
      if (typeof masterCtrl !== 'undefined' && masterCtrl.loadI18N) {
        await masterCtrl.loadI18N(lang);
      }
      
      // Show success notification
      showNotification(`Idioma alterado para: ${lang.toUpperCase()}`, 'success');
    });
  });
}

// === I18N TEST FUNCTION ===
function initI18nTest() {
  const testBtn = document.getElementById('btnTestI18n');
  if (!testBtn) return;
  
  testBtn.addEventListener('click', function() {
    const keyInput = document.getElementById('testI18nKey');
    const resultDiv = document.getElementById('testI18nResult');
    
    if (!keyInput || !resultDiv) return;
    
    const key = keyInput.value.trim();
    if (!key) {
      showNotification('Por favor, insira uma chave de tradução', 'warning');
      return;
    }
    
    // Test translation
    if (typeof masterCtrl !== 'undefined' && masterCtrl.t) {
      const translation = masterCtrl.t(key);
      
      // Display result
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
          <strong>Chave:</strong> ${key}<br>
          <strong>Tradução:</strong> ${translation}
        </div>
      `;
    } else {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
          <strong>Erro:</strong> Sistema i18n não disponível
        </div>
      `;
    }
  });
}

// === SETTINGS MANAGEMENT ===
function initSettings() {
  const saveBtn = document.getElementById('btnSaveSettings');
  if (!saveBtn) return;
  
  saveBtn.addEventListener('click', function() {
    // Collect settings
    const settings = {
      autoBackupFrequency: document.getElementById('autoBackupFrequency')?.value || 'disabled',
      backupRetention: document.getElementById('backupRetention')?.value || 30,
      compressBackups: document.getElementById('compressBackups')?.checked || false,
      encryptBackups: document.getElementById('encryptBackups')?.checked || false,
      logLevel: document.getElementById('logLevel')?.value || 'info',
      autoVersioning: document.getElementById('autoVersioning')?.value || 'enabled',
      doubleConfirmation: document.getElementById('doubleConfirmation')?.checked || true
    };
    
    // Save to localStorage
    localStorage.setItem('master_control_settings', JSON.stringify(settings));
    
    // Show success notification
    showNotification('Configurações salvas com sucesso!', 'success');
    
    // Log to audit
    if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
      masterCtrl.logActivity('SETTINGS', 'Configurações do sistema atualizadas');
    }
  });
  
  // Load saved settings
  loadSettings();
}

function loadSettings() {
  const savedSettings = localStorage.getItem('master_control_settings');
  if (!savedSettings) return;
  
  try {
    const settings = JSON.parse(savedSettings);
    
    // Apply settings to UI
    if (document.getElementById('autoBackupFrequency')) {
      document.getElementById('autoBackupFrequency').value = settings.autoBackupFrequency;
    }
    if (document.getElementById('backupRetention')) {
      document.getElementById('backupRetention').value = settings.backupRetention;
    }
    if (document.getElementById('compressBackups')) {
      document.getElementById('compressBackups').checked = settings.compressBackups;
    }
    if (document.getElementById('encryptBackups')) {
      document.getElementById('encryptBackups').checked = settings.encryptBackups;
    }
    if (document.getElementById('logLevel')) {
      document.getElementById('logLevel').value = settings.logLevel;
    }
    if (document.getElementById('autoVersioning')) {
      document.getElementById('autoVersioning').value = settings.autoVersioning;
    }
    if (document.getElementById('doubleConfirmation')) {
      document.getElementById('doubleConfirmation').checked = settings.doubleConfirmation;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// === MAINTENANCE ACTIONS ===
function initMaintenanceActions() {
  // Clear Cache
  const clearCacheBtn = document.getElementById('btnClearCache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async function() {
      if (await confirmAction('Deseja limpar todo o cache do sistema?')) {
        clearCache();
      }
    });
  }
  
  // Clear i18n Cache
  const clearI18nCacheBtn = document.getElementById('btnClearI18nCache');
  if (clearI18nCacheBtn) {
    clearI18nCacheBtn.addEventListener('click', async function() {
      if (await confirmAction('Deseja limpar o cache de traduções?')) {
        clearI18nCache();
      }
    });
  }
  
  // Optimize Database
  const optimizeDbBtn = document.getElementById('btnOptimizeDb');
  if (optimizeDbBtn) {
    optimizeDbBtn.addEventListener('click', async function() {
      if (await confirmAction('Deseja otimizar o banco de dados?')) {
        optimizeDatabase();
      }
    });
  }
  
  // Analyze Database
  const analyzeDbBtn = document.getElementById('btnAnalyzeDb');
  if (analyzeDbBtn) {
    analyzeDbBtn.addEventListener('click', function() {
      analyzeDatabase();
    });
  }
  
  // Repair Integrity
  const repairBtn = document.getElementById('btnRepairIntegrity');
  if (repairBtn) {
    repairBtn.addEventListener('click', async function() {
      if (await confirmAction('Deseja reparar a integridade dos dados?')) {
        repairIntegrity();
      }
    });
  }
  
  // Validate Integrity
  const validateBtn = document.getElementById('btnValidateIntegrity');
  if (validateBtn) {
    validateBtn.addEventListener('click', function() {
      validateIntegrity();
    });
  }
  
  // Reset System
  const resetBtn = document.getElementById('btnResetSystem');
  if (resetBtn) {
    resetBtn.addEventListener('click', async function() {
      const confirmed = await confirmAction(
        'ATENÇÃO: Esta ação irá resetar o sistema ao estado inicial. Todos os dados serão perdidos. Deseja continuar?',
        'danger'
      );
      if (confirmed) {
        const doubleConfirm = await confirmAction(
          'Confirme novamente: Todos os dados serão permanentemente excluídos!',
          'danger'
        );
        if (doubleConfirm) {
          resetSystem();
        }
      }
    });
  }
  
  // Quick Backup
  const quickBackupBtn = document.getElementById('btnQuickBackupMaintenance');
  if (quickBackupBtn) {
    quickBackupBtn.addEventListener('click', function() {
      if (typeof masterCtrl !== 'undefined' && masterCtrl.createFullBackup) {
        masterCtrl.createFullBackup();
      }
    });
  }
}

// === MAINTENANCE FUNCTIONS ===
function clearCache() {
  try {
    // Clear specific cache keys
    const cacheKeys = [
      'cached_i18n',
      'cached_metrics',
      'cached_dashboard'
    ];
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    showNotification('Cache limpo com sucesso!', 'success');
    
    if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
      masterCtrl.logActivity('MAINTENANCE', 'Cache do sistema limpo');
    }
  } catch (error) {
    showNotification('Erro ao limpar cache: ' + error.message, 'error');
  }
}

function clearI18nCache() {
  try {
    localStorage.removeItem('cached_i18n');
    localStorage.removeItem('i18n_main');
    localStorage.removeItem('i18n_enterprise_pt');
    localStorage.removeItem('i18n_enterprise_en');
    localStorage.removeItem('i18n_enterprise_es');
    
    showNotification('Cache i18n limpo com sucesso! Recarregue a página.', 'success');
    
    if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
      masterCtrl.logActivity('MAINTENANCE', 'Cache i18n limpo');
    }
  } catch (error) {
    showNotification('Erro ao limpar cache i18n: ' + error.message, 'error');
  }
}

function optimizeDatabase() {
  try {
    // Simulate database optimization
    showNotification('Otimizando banco de dados...', 'info');
    
    setTimeout(() => {
      // Compact localStorage
      const storageKeys = Object.keys(localStorage);
      let optimizedCount = 0;
      
      storageKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            // Re-store to compact
            localStorage.setItem(key, data);
            optimizedCount++;
          }
        } catch (e) {
          console.error(`Error optimizing key ${key}:`, e);
        }
      });
      
      showNotification(`Banco otimizado! ${optimizedCount} registros processados.`, 'success');
      
      if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
        masterCtrl.logActivity('MAINTENANCE', `Banco de dados otimizado (${optimizedCount} registros)`);
      }
    }, 1500);
  } catch (error) {
    showNotification('Erro ao otimizar banco: ' + error.message, 'error');
  }
}

function analyzeDatabase() {
  try {
    const storageKeys = Object.keys(localStorage);
    let totalSize = 0;
    let issues = [];
    
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
        
        // Check for potential issues
        try {
          JSON.parse(data);
        } catch (e) {
          issues.push(`Chave "${key}" contém dados inválidos`);
        }
      }
    });
    
    const sizeInKB = (totalSize / 1024).toFixed(2);
    
    let message = `Análise concluída:\n`;
    message += `- Total de chaves: ${storageKeys.length}\n`;
    message += `- Tamanho total: ${sizeInKB} KB\n`;
    message += `- Problemas encontrados: ${issues.length}`;
    
    if (issues.length > 0) {
      message += `\n\nProblemas:\n- ${issues.join('\n- ')}`;
    }
    
    showNotification(message, issues.length > 0 ? 'warning' : 'success');
    
    if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
      masterCtrl.logActivity('MAINTENANCE', `Análise de integridade executada (${issues.length} problemas)`);
    }
  } catch (error) {
    showNotification('Erro ao analisar banco: ' + error.message, 'error');
  }
}

function repairIntegrity() {
  try {
    showNotification('Reparando integridade...', 'info');
    
    setTimeout(() => {
      const storageKeys = Object.keys(localStorage);
      let repairedCount = 0;
      let removedCount = 0;
      
      storageKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            JSON.parse(data);
          } catch (e) {
            // Remove invalid data
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      });
      
      showNotification(`Reparo concluído! ${removedCount} chaves corrompidas removidas.`, 'success');
      
      if (typeof masterCtrl !== 'undefined' && masterCtrl.logActivity) {
        masterCtrl.logActivity('MAINTENANCE', `Integridade reparada (${removedCount} chaves removidas)`);
      }
    }, 1500);
  } catch (error) {
    showNotification('Erro ao reparar integridade: ' + error.message, 'error');
  }
}

function validateIntegrity() {
  analyzeDatabase();
}

function resetSystem() {
  try {
    showNotification('Resetando sistema...', 'info');
    
    setTimeout(() => {
      // Clear all localStorage except login credentials
      const keysToKeep = ['master_credentials'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      showNotification('Sistema resetado! Recarregando...', 'success');
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }, 1500);
  } catch (error) {
    showNotification('Erro ao resetar sistema: ' + error.message, 'error');
  }
}

// === UTILITY FUNCTIONS ===
function confirmAction(message, type = 'warning') {
  return new Promise((resolve) => {
    const confirmed = confirm(message);
    resolve(confirmed);
  });
}

function showNotification(message, type = 'info') {
  // Simple notification (can be enhanced with toast library)
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
    word-wrap: break-word;
    white-space: pre-line;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 5000);
}

// === INITIALIZE ALL V3 FEATURES ===
function initMasterControlV3() {
  console.log('🚀 Initializing Master Control V3...');
  
  // Initialize all systems
  initHelpSystem();
  initBackupSubnavigation();
  initLanguageSelector();
  initI18nTest();
  initSettings();
  initMaintenanceActions();
  
  console.log('✅ Master Control V3 initialized successfully!');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMasterControlV3);
} else {
  initMasterControlV3();
}

// === ANIMATIONS ===
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
