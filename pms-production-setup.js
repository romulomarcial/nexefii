// PMS - Production Setup & Data Management
// Use this file to prepare system for real production data

// ============================================
// DATA CLEANUP UTILITIES
// ============================================
class PMSDataManager {
  constructor() {
    this.storageKeys = {
      reservations: 'pms_reservations_property_default',
      inventory: 'pms_inventory_property_default',
      ratePlans: 'pms_rate_plans',
      language: 'nexefii_lang'
    };
  }

  // Clear ALL demo data (use before production)
  clearAllDemoData() {
    console.log('[PMS Setup] Clearing all demo data...');
    
    const confirmed = confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Esta ação irá REMOVER TODOS OS DADOS de demonstração:\n\n' +
      '• Todas as reservas\n' +
      '• Configurações de inventário\n' +
      '• Planos tarifários\n\n' +
      'Esta ação NÃO PODE SER DESFEITA!\n\n' +
      'Deseja continuar?'
    );

    if (!confirmed) {
      console.log('[PMS Setup] Operação cancelada pelo usuário');
      return false;
    }

    // Clear reservations
    localStorage.removeItem(this.storageKeys.reservations);
    console.log('[PMS Setup] ✓ Reservas removidas');

    // Clear inventory (but keep structure)
    localStorage.removeItem(this.storageKeys.inventory);
    console.log('[PMS Setup] ✓ Inventário resetado');

    // Keep rate plans but can reset if needed
    // localStorage.removeItem(this.storageKeys.ratePlans);

    console.log('[PMS Setup] ✓✓✓ Todos os dados de demonstração foram removidos!');
    console.log('[PMS Setup] Recarregue a página para inicializar com dados em branco.');
    
    return true;
  }

  // Clear only reservations (keep inventory config)
  clearReservationsOnly() {
    console.log('[PMS Setup] Clearing reservations only...');
    
    const confirmed = confirm(
      'Remover apenas as reservas de demonstração?\n\n' +
      'O inventário e configurações serão mantidos.'
    );

    if (!confirmed) return false;

    localStorage.removeItem(this.storageKeys.reservations);
    console.log('[PMS Setup] ✓ Reservas removidas. Recarregue a página.');
    
    return true;
  }

  // Disable sample data generation
  disableSampleDataGeneration() {
    localStorage.setItem('pms_disable_sample_data', 'true');
    console.log('[PMS Setup] ✓ Geração automática de dados de demonstração DESATIVADA');
    console.log('[PMS Setup] Recarregue a página.');
  }

  // Enable sample data generation
  enableSampleDataGeneration() {
    localStorage.removeItem('pms_disable_sample_data');
    console.log('[PMS Setup] ✓ Geração automática de dados de demonstração ATIVADA');
  }

  // Export all data to JSON (backup before production)
  exportAllData() {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      reservations: JSON.parse(localStorage.getItem(this.storageKeys.reservations) || '[]'),
      inventory: JSON.parse(localStorage.getItem(this.storageKeys.inventory) || '{}'),
      ratePlans: JSON.parse(localStorage.getItem(this.storageKeys.ratePlans) || '[]'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pms-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[PMS Setup] ✓ Backup exportado com sucesso!');
  }

  // Import data from JSON file
  importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (data.reservations) {
        localStorage.setItem(this.storageKeys.reservations, JSON.stringify(data.reservations));
        console.log('[PMS Setup] ✓ Reservas importadas:', data.reservations.length);
      }

      if (data.inventory) {
        localStorage.setItem(this.storageKeys.inventory, JSON.stringify(data.inventory));
        console.log('[PMS Setup] ✓ Inventário importado');
      }

      if (data.ratePlans) {
        localStorage.setItem(this.storageKeys.ratePlans, JSON.stringify(data.ratePlans));
        console.log('[PMS Setup] ✓ Planos tarifários importados');
      }

      console.log('[PMS Setup] ✓✓✓ Importação concluída! Recarregue a página.');
      return true;
    } catch (e) {
      console.error('[PMS Setup] ✗ Erro ao importar dados:', e);
      return false;
    }
  }

  // Get current data statistics
  getDataStats() {
    const stats = {
      reservations: {
        total: 0,
        byStatus: {},
        dateRange: { oldest: null, newest: null }
      },
      inventory: {
        totalRooms: 0,
        roomTypes: 0,
        blockedRooms: 0
      },
      ratePlans: {
        total: 0,
        active: 0
      }
    };

    // Reservations stats
    try {
      const reservations = JSON.parse(localStorage.getItem(this.storageKeys.reservations) || '[]');
      stats.reservations.total = reservations.length;

      reservations.forEach(r => {
        stats.reservations.byStatus[r.status] = (stats.reservations.byStatus[r.status] || 0) + 1;
        
        if (!stats.reservations.dateRange.oldest || r.checkInDate < stats.reservations.dateRange.oldest) {
          stats.reservations.dateRange.oldest = r.checkInDate;
        }
        if (!stats.reservations.dateRange.newest || r.checkInDate > stats.reservations.dateRange.newest) {
          stats.reservations.dateRange.newest = r.checkInDate;
        }
      });
    } catch (e) {
      console.error('[PMS Setup] Error reading reservations:', e);
    }

    // Inventory stats
    try {
      const inventory = JSON.parse(localStorage.getItem(this.storageKeys.inventory) || '{}');
      if (inventory.rooms) {
        stats.inventory.totalRooms = inventory.rooms.length;
        stats.inventory.blockedRooms = inventory.rooms.filter(r => r.blocked).length;
      }
      if (inventory.roomTypes) {
        stats.inventory.roomTypes = inventory.roomTypes.length;
      }
    } catch (e) {
      console.error('[PMS Setup] Error reading inventory:', e);
    }

    // Rate plans stats
    try {
      const ratePlans = JSON.parse(localStorage.getItem(this.storageKeys.ratePlans) || '[]');
      stats.ratePlans.total = ratePlans.length;
      stats.ratePlans.active = ratePlans.filter(p => p.active).length;
    } catch (e) {
      console.error('[PMS Setup] Error reading rate plans:', e);
    }

    return stats;
  }

  // Display statistics in console
  showStats() {
    const stats = this.getDataStats();
    
    console.log('═══════════════════════════════════════════');
    console.log('📊 PMS DATA STATISTICS');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('📅 RESERVATIONS:', stats.reservations.total);
    console.log('   By Status:', stats.reservations.byStatus);
    console.log('   Date Range:', stats.reservations.dateRange.oldest, '→', stats.reservations.dateRange.newest);
    console.log('');
    console.log('🏨 INVENTORY:');
    console.log('   Total Rooms:', stats.inventory.totalRooms);
    console.log('   Room Types:', stats.inventory.roomTypes);
    console.log('   Blocked Rooms:', stats.inventory.blockedRooms);
    console.log('');
    console.log('💰 RATE PLANS:', stats.ratePlans.total, '(', stats.ratePlans.active, 'active)');
    console.log('');
    console.log('═══════════════════════════════════════════');
    
    return stats;
  }

  // Validate data integrity
  validateDataIntegrity() {
    console.log('[PMS Setup] Validating data integrity...');
    const issues = [];

    try {
      // Check reservations
      const reservations = JSON.parse(localStorage.getItem(this.storageKeys.reservations) || '[]');
      
      reservations.forEach((r, idx) => {
        // Required fields
        if (!r.id) issues.push(`Reservation ${idx}: Missing ID`);
        if (!r.confirmationNumber) issues.push(`Reservation ${idx}: Missing confirmation number`);
        if (!r.guestName) issues.push(`Reservation ${idx}: Missing guest name`);
        if (!r.checkInDate) issues.push(`Reservation ${idx}: Missing check-in date`);
        if (!r.checkOutDate) issues.push(`Reservation ${idx}: Missing check-out date`);
        if (!r.roomTypeId) issues.push(`Reservation ${idx}: Missing room type`);
        if (!r.status) issues.push(`Reservation ${idx}: Missing status`);

        // Date validation
        if (r.checkInDate && r.checkOutDate && r.checkInDate >= r.checkOutDate) {
          issues.push(`Reservation ${r.confirmationNumber}: Check-in date >= Check-out date`);
        }

        // Status validation
        const validStatuses = ['confirmed', 'pending', 'cancelled', 'checked_in', 'checked_out', 'no_show'];
        if (r.status && !validStatuses.includes(r.status)) {
          issues.push(`Reservation ${r.confirmationNumber}: Invalid status '${r.status}'`);
        }
      });

      // Check inventory
      const inventory = JSON.parse(localStorage.getItem(this.storageKeys.inventory) || '{}');
      
      if (!inventory.roomTypes || inventory.roomTypes.length === 0) {
        issues.push('Inventory: No room types defined');
      }

      if (!inventory.rooms || inventory.rooms.length === 0) {
        issues.push('Inventory: No physical rooms defined');
      }

      // Check rate plans
      const ratePlans = JSON.parse(localStorage.getItem(this.storageKeys.ratePlans) || '[]');
      
      if (ratePlans.length === 0) {
        issues.push('Rate Plans: No rate plans defined');
      }

    } catch (e) {
      issues.push(`Critical error during validation: ${e.message}`);
    }

    if (issues.length === 0) {
      console.log('[PMS Setup] ✓✓✓ Data integrity check PASSED!');
      return { valid: true, issues: [] };
    } else {
      console.log('[PMS Setup] ✗ Data integrity check FAILED!');
      console.log('[PMS Setup] Issues found:');
      issues.forEach(issue => console.log('  ✗', issue));
      return { valid: false, issues };
    }
  }
}

// ============================================
// GLOBAL ACCESS & CONSOLE COMMANDS
// ============================================
window.PMSDataManager = new PMSDataManager();

// Convenience commands for browser console
console.log('═══════════════════════════════════════════════════════════');
console.log('🛠️  PMS PRODUCTION SETUP - COMANDOS DISPONÍVEIS');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📊 Ver estatísticas:');
console.log('   PMSDataManager.showStats()');
console.log('');
console.log('🧹 Limpar dados de demonstração:');
console.log('   PMSDataManager.clearAllDemoData()           - Remove TUDO');
console.log('   PMSDataManager.clearReservationsOnly()      - Remove só reservas');
console.log('');
console.log('🔄 Controlar geração automática:');
console.log('   PMSDataManager.disableSampleDataGeneration() - Desativar dados demo');
console.log('   PMSDataManager.enableSampleDataGeneration()  - Ativar dados demo');
console.log('');
console.log('💾 Backup e Restauração:');
console.log('   PMSDataManager.exportAllData()              - Exportar backup JSON');
console.log('   PMSDataManager.importData(jsonData)         - Importar dados');
console.log('');
console.log('✅ Validação:');
console.log('   PMSDataManager.validateDataIntegrity()      - Verificar integridade');
console.log('');
console.log('═══════════════════════════════════════════════════════════');

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PMSDataManager;
}
