/**
 * Master System Initialization Script
 * Run this script to initialize or reset the Master Control System
 */

(function() {
  'use strict';

  console.log('ðŸ” Master System Initialization Script');
  console.log('=====================================\n');

  // Check if NexefiiAuth is loaded
  if (typeof window.NexefiiAuth === 'undefined') {
    console.error('âŒ NexefiiAuth not loaded! Make sure auth.js is included.');
    return;
  }

  // Initialize authentication system
  NexefiiAuth.init();

  // Verify master user exists
  const users = NexefiiAuth.getAllUsers();
  const masterUser = users.find(u => u.username === 'master');
  
  if (masterUser) {
    console.log('âœ… Master user found!');
    console.log('   Username:', masterUser.username);
    console.log('   Email:', masterUser.email);
    console.log('   Role:', masterUser.role);
    console.log('   Status:', masterUser.status);
    console.log('   Created:', new Date(masterUser.createdAt).toLocaleString());
  } else {
    console.log('âš ï¸  Master user not found! Creating...');
    
    // Create master user manually if needed
    const newMaster = {
      id: 'usr_master_' + Date.now(),
  fullName: 'Master Administrator',
  email: 'master@nexefii.com',
      phone: '+55 11 99999-9999',
      country: 'BR',
      propertyKey: null,
      approvedProperties: [],
      position: 'Super Administrator',
      username: 'master',
      password: NexefiiAuth.hashPassword('Master2025!@#$'),
      status: 'approved',
      role: 'master',
      modules: ['engineering', 'housekeeping', 'alerts', 'commercial', 'marketing', 'reports', 'management'],
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      lastLogin: null,
      loginCount: 0
    };
    
    users.push(newMaster);
    // Prefer new key but keep legacy key for backward compatibility
    localStorage.setItem('nexefii_users', JSON.stringify(users));
    try {
      localStorage.setItem('nexefii_users', JSON.stringify(users));
    } catch (e) {
      // ignore if localStorage write for legacy key fails
    }
    console.log('âœ… Master user created successfully!');
  }

  // Verify admin user
  const adminUser = users.find(u => u.username === 'admin');
  if (adminUser) {
    console.log('\nâœ… Admin user found!');
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
  }

  // Initialize Master Control System storage if not exists
  if (!localStorage.getItem('master_backups')) {
    localStorage.setItem('master_backups', JSON.stringify([]));
    console.log('\nâœ… Master backups storage initialized');
  }

  if (!localStorage.getItem('master_versions')) {
    localStorage.setItem('master_versions', JSON.stringify([]));
    console.log('âœ… Master versions storage initialized');
  }

  if (!localStorage.getItem('master_logs')) {
    localStorage.setItem('master_logs', JSON.stringify([]));
    console.log('âœ… Master logs storage initialized');
  }

  if (!localStorage.getItem('master_settings')) {
    const defaultSettings = {
      autoBackup: 'disabled',
      backupRetention: 30,
      autoVersioning: 'enabled',
      logLevel: 'info'
    };
    localStorage.setItem('master_settings', JSON.stringify(defaultSettings));
    console.log('âœ… Master settings initialized');
  }

  // Create initial version/snapshot
  const versions = JSON.parse(localStorage.getItem('master_versions') || '[]');
  if (versions.length === 0) {
    const initialVersion = {
      id: 'v_initial_' + Date.now(),
      timestamp: new Date().toISOString(),
      createdBy: 'system',
      description: 'Sistema Master inicializado - Estado inicial',
      tag: 'v1.0.0',
      snapshot: {
        totalUsers: users.length,
        totalReservations: 0,
        totalRooms: 0,
        configurations: [],
        fileStructure: {
          html: ['master-control.html', 'index.html', 'login.html'],
          js: ['master-control.js', 'auth.js', 'app.js'],
          css: ['style.css'],
          timestamp: new Date().toISOString()
        }
      },
      changes: {
        type: 'initial',
        description: 'VersÃ£o inicial do sistema'
      }
    };
    versions.push(initialVersion);
    localStorage.setItem('master_versions', JSON.stringify(versions));
    console.log('âœ… Initial version snapshot created: v1.0.0');
  }

  // Add initialization log
  const logs = JSON.parse(localStorage.getItem('master_logs') || '[]');
  logs.push({
    id: 'log_init_' + Date.now(),
    timestamp: new Date().toISOString(),
    type: 'system',
    level: 'info',
    message: 'Master Control System initialized',
    userId: 'system',
    data: {
      totalUsers: users.length,
      masterUserExists: !!masterUser,
      adminUserExists: !!adminUser
    }
  });
  localStorage.setItem('master_logs', JSON.stringify(logs));

  // Display summary
  console.log('\nðŸ“Š SYSTEM SUMMARY');
  console.log('=================');
  console.log('Total Users:', users.length);
  console.log('Master Users:', users.filter(u => u.role === 'master').length);
  console.log('Admin Users:', users.filter(u => u.role === 'admin').length);
  console.log('Total Backups:', JSON.parse(localStorage.getItem('master_backups') || '[]').length);
  console.log('Total Versions:', versions.length);
  console.log('Total Logs:', logs.length);

  // Calculate storage usage
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log('Storage Used:', totalSizeMB, 'MB');

  console.log('\nðŸ” ACCESS CREDENTIALS');
  console.log('====================');
  console.log('Master User:');
  console.log('  URL: master-control.html');
  console.log('  Username: master');
  console.log('  Password: Master2025!@#$');
  console.log('\nAdmin User:');
  console.log('  URL: login.html');
  console.log('  Username: admin');
  console.log('  Password: admin12345!@#');

  console.log('\nâœ… Master System ready!');
  console.log('ðŸ“š Read MASTER_CONTROL_README.md for full documentation');
  console.log('ðŸ”’ Read CREDENTIALS.md for security guidelines\n');

})();

// Export utility functions for console use
window.MasterUtils = {
  
  // Quick backup
  quickBackup: function() {
    if (window.masterCtrl) {
      masterCtrl.createFullBackup();
    } else {
      console.error('Master Control Panel not loaded. Open master-control.html first.');
    }
  },

  // Show all users
  listUsers: function() {
    const users = JSON.parse(localStorage.getItem('nexefii_users') || localStorage.getItem('nexefii_users') || '[]');
    console.table(users.map(u => ({
      Username: u.username,
      Email: u.email,
      Role: u.role,
      Status: u.status,
      Created: new Date(u.createdAt).toLocaleDateString()
    })));
  },

  // Show storage info
  storageInfo: function() {
    let total = 0;
    const items = {};
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length + key.length;
        total += size;
        items[key] = (size / 1024).toFixed(2) + ' KB';
      }
    }
    
    console.log('Total Storage:', (total / 1024 / 1024).toFixed(2), 'MB');
    console.log('\nBreakdown:');
    console.table(items);
  },

  // Export all data
  exportAll: function() {
    const data = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        try {
          data[key] = JSON.parse(localStorage[key]);
        } catch (e) {
          data[key] = localStorage[key];
        }
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  a.download = `nexefii_full_export_${Date.now()}.json`;
    a.click();
    
    console.log('âœ… Full system export downloaded!');
  },

  // Clear all except master/admin
  resetDevelopment: function() {
    if (!confirm('âš ï¸ This will delete all data except master/admin users! Continue?')) {
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('nexefii_users') || localStorage.getItem('nexefii_users') || '[]');
    const masterAdmin = users.filter(u => u.role === 'master' || u.role === 'admin');
    
    localStorage.clear();
    // Preserve master/admin users under the new key and also write legacy key for compatibility
    localStorage.setItem('nexefii_users', JSON.stringify(masterAdmin));
    try {
      localStorage.setItem('nexefii_users', JSON.stringify(masterAdmin));
    } catch (e) {}
    
    console.log('âœ… Development reset complete! Reload the page.');
  },

  // Show help
  help: function() {
    console.log('ðŸ”§ Master Utilities');
    console.log('==================\n');
    console.log('MasterUtils.quickBackup()      - Create full backup');
    console.log('MasterUtils.listUsers()        - Show all users');
    console.log('MasterUtils.storageInfo()      - Show storage usage');
    console.log('MasterUtils.exportAll()        - Download full export');
    console.log('MasterUtils.resetDevelopment() - Reset to clean state');
    console.log('MasterUtils.help()             - Show this help');
  }
};

console.log('\nðŸ’¡ TIP: Type MasterUtils.help() for utility functions');

