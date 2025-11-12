// BEGIN AUTO-INJECTED COMPAT SHIM - inserted by assistant
if (typeof window.__NEXEFII_AUTH_COMPAT__ === 'undefined') {
  window.__NEXEFII_AUTH_COMPAT__ = true;
  window.NEXEFII = window.NEXEFII || {};
  window.NexefiiAuth = window.NexefiiAuth || {};
  window.NexefiiAuth.isAuthenticated = window.NexefiiAuth.isAuthenticated || function () { try { return !!(window.NEXEFII && window.NEXEFII.currentUser); } catch (e) { return false; } };
  window.NexefiiAuth.getCurrentSession = window.NexefiiAuth.getCurrentSession || function () { return (window.NEXEFII && window.NEXEFII.currentUser) ? window.NEXEFII.currentUser : null; };
  window.NexefiiAuth.setSession = window.NexefiiAuth.setSession || function (s) { try { window.NEXEFII.currentUser = s; localStorage && localStorage.setItem && localStorage.setItem('nexefii_session', JSON.stringify(s)); } catch (e) { } };
  window.NexefiiAuth.login = window.NexefiiAuth.login || (async function () { throw new Error('NexefiiAuth.login not implemented'); });
  window.IluxAuth = window.IluxAuth || {};
  window.IluxAuth.isAuthenticated = window.IluxAuth.isAuthenticated || window.NexefiiAuth.isAuthenticated;
  window.IluxAuth.getCurrentSession = window.IluxAuth.getCurrentSession || window.NexefiiAuth.getCurrentSession;
  window.IluxAuth.getSession = window.IluxAuth.getSession || window.IluxAuth.getCurrentSession;
  window.IluxAuth.setSession = window.IluxAuth.setSession || window.NexefiiAuth.setSession;
  window.IluxAuth.hasModuleAccess = window.IluxAuth.hasModuleAccess || function () { return true; };
  window.IluxAuth.getAllUsers = window.IluxAuth.getAllUsers || function () { return []; };
  window.IluxAuth.logout = window.IluxAuth.logout || function () { window.NexefiiAuth.setSession && window.NexefiiAuth.setSession(null); };
  try { NexefiiAuth = window.NexefiiAuth; IluxAuth = window.IluxAuth; } catch (e) { }
}
// END AUTO-INJECTED COMPAT SHIM
// Ensure safeIsAuthenticated helper is available globally for legacy pages
// BEGIN AUTO-INJECTED COMPAT SHIM - ensures legacy pages still work
if (typeof window !== 'undefined' && typeof window.__NEXEFII_AUTH_COMPAT__ === 'undefined') {
  window.__NEXEFII_AUTH_COMPAT__ = true;
  window.NEXEFII = window.NEXEFII || {};
  window.NexefiiAuth = window.NexefiiAuth || {};
  window.NexefiiAuth.isAuthenticated = window.NexefiiAuth.isAuthenticated || function () { try { return !!(window.NEXEFII && window.NEXEFII.currentUser); } catch (e) { return false; } };
  window.NexefiiAuth.getCurrentSession = window.NexefiiAuth.getCurrentSession || function () { return (window.NEXEFII && window.NEXEFII.currentUser) ? window.NEXEFII.currentUser : null; };
  window.NexefiiAuth.setSession = window.NexefiiAuth.setSession || function (s) { try { window.NEXEFII.currentUser = s; localStorage && localStorage.setItem && localStorage.setItem('nexefii_session', JSON.stringify(s)); } catch (e) { } };
  window.NexefiiAuth.login = window.NexefiiAuth.login || (async function () { throw new Error('NexefiiAuth.login not implemented'); });
  window.IluxAuth = window.IluxAuth || {};
  window.IluxAuth.isAuthenticated = window.IluxAuth.isAuthenticated || window.NexefiiAuth.isAuthenticated;
  window.IluxAuth.getCurrentSession = window.IluxAuth.getCurrentSession || window.NexefiiAuth.getCurrentSession;
  window.IluxAuth.getSession = window.IluxAuth.getSession || window.IluxAuth.getCurrentSession;
  window.IluxAuth.setSession = window.IluxAuth.setSession || window.NexefiiAuth.setSession;
  window.IluxAuth.hasModuleAccess = window.IluxAuth.hasModuleAccess || function () { return true; };
  window.IluxAuth.getAllUsers = window.IluxAuth.getAllUsers || function () { return []; };
  window.IluxAuth.logout = window.IluxAuth.logout || function () { window.NexefiiAuth.setSession && window.NexefiiAuth.setSession(null); };
}

// Ensure safeIsAuthenticated helper is available globally for legacy pages
try {
  if (typeof window !== 'undefined') {
    window.safeIsAuthenticated = window.safeIsAuthenticated || function() {
      try {
        if (window.IluxAuth && typeof window.IluxAuth.isAuthenticated === 'function') return window.IluxAuth.isAuthenticated();
        if (window.NexefiiAuth && typeof window.NexefiiAuth.isAuthenticated === 'function') return window.NexefiiAuth.isAuthenticated();
      } catch (e) {
        // ignore
      }
      return false;
    };
  }
} catch (e) { /* ignore non-browser env */ }

// Storage keys
const AUTH_STORAGE_KEY = 'nexefii_users';
const AUTH_SESSION_KEY = 'nexefii_session';

// User status types
const USER_STATUS = {
  PENDING: 'pending',    // Waiting for admin approval
  APPROVED: 'approved',  // Authorized to access
  DENIED: 'denied'       // Access denied
};

// Available system modules
const MODULES = {
  ENGINEERING: 'engineering',
  HOUSEKEEPING: 'housekeeping',
  ALERTS: 'alerts',
  COMMERCIAL: 'commercial',
  MARKETING: 'marketing',
  REPORTS: 'reports',
  MANAGEMENT: 'management'
};

// Module display names for i18n
const MODULE_NAMES = {
  pt: {
    engineering: 'Engenharia',
    housekeeping: 'Governança',
    alerts: 'Alertas',
    commercial: 'Comercial',
    marketing: 'Marketing',
    reports: 'Relatórios',
    management: 'Gerencial'
  },
  en: {
    engineering: 'Engineering',
    housekeeping: 'Housekeeping',
    alerts: 'Alerts',
    commercial: 'Commercial',
    marketing: 'Marketing',
    reports: 'Reports',
    management: 'Management'
  },
  es: {
    engineering: 'Ingeniería',
    housekeeping: 'Gobernanza',
    alerts: 'Alertas',
    commercial: 'Comercial',
    marketing: 'Marketing',
    reports: 'Informes',
    management: 'Gerencial'
  }
};

// Simple hash function (in production use bcrypt or similar)
function hashPassword(password) {
  let hash = 0;
  const str = password + 'nexefii_salt_2025';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Generate unique user ID
function generateUserId() {
  return 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get all users from localStorage
function getUsers() {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading users:', e);
    return [];
  }
}

// Save users to localStorage
function saveUsers(users) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error saving users:', e);
    return false;
  }
}

// Register new user (status: pending)
function registerUser(userData) {
  const users = getUsers();
  // Check if username already exists
  if (users.some(u => u.username === userData.username)) {
    return { success: false, error: 'username_exists' };
  }
  // Check if email already exists
  if (users.some(u => u.email === userData.email)) {
    return { success: false, error: 'email_exists' };
  }
  // Create new user
  const newUser = {
    id: generateUserId(),
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone,
    country: userData.country,
    propertyKey: userData.propertyKey || null,
    position: userData.position || '',
    username: userData.username,
    password: hashPassword(userData.password),
    status: USER_STATUS.PENDING,
    role: 'user',
    modules: userData.modules || [],
    requestedModules: userData.modules || [],
    createdAt: new Date().toISOString(),
    approvedAt: null
  };
  users.push(newUser);
  saveUsers(users);
  // Simulate email notification
  sendRegistrationEmail(newUser);
  return { success: true, userId: newUser.id };
}

// Authenticate user
function authenticateUser(username, password) {
  const users = getUsers();
  const hashedPassword = hashPassword(password);
  const user = users.find(u => u.username === username && u.password === hashedPassword);
  if (!user) {
    return { success: false, error: 'invalid_credentials' };
  }
  if (user.status !== USER_STATUS.APPROVED) {
    return { success: false, error: 'user_not_approved', status: user.status };
  }
  // Update user stats
  user.lastLogin = new Date().toISOString();
  user.loginCount = (user.loginCount || 0) + 1;
  saveUsers(users);
  // Create session
  const session = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    propertyKey: user.propertyKey || null,
    role: user.role,
    loginAt: new Date().toISOString()
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  // Backward compatibility keys
  localStorage.setItem('nexefii_user', user.email);
  localStorage.setItem('currentUser', JSON.stringify(user));
  return { success: true, user: session };
}

// Check if user is authenticated
function isAuthenticated() {
  try {
    const session = localStorage.getItem(AUTH_SESSION_KEY);
    return session !== null;
  } catch (e) {
    return false;
  }
}

// Get current session
function getCurrentSession() {
  try {
    const session = localStorage.getItem(AUTH_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (e) {
    return null;
  }
}

// Logout
function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem('nexefii_user');
}

// Simulate sending registration email to admin
function sendRegistrationEmail(user) {
  const emailData = {
  to: 'contato@nexefii.com',
    subject: `New User Registration - ${user.fullName}`,
    body: `\nNew user registration request:\n\nFull Name: ${user.fullName}\nEmail: ${user.email}\nPhone: ${user.phone}\nCountry: ${user.country}\nProperty: ${user.propertyKey || '-'}\nPosition: ${user.position || '-'}\nUsername: ${user.username}\nRegistration Date: ${new Date(user.createdAt).toLocaleString()}\n\nPlease review and approve/deny this user access.\nUser ID: ${user.id}\n`
  };
  console.log('Registration Email Sent:', emailData);
  const emailLog = JSON.parse(localStorage.getItem('nexefii_email_log') || '[]');
  emailLog.push({ ...emailData, sentAt: new Date().toISOString(), userId: user.id });
  localStorage.setItem('nexefii_email_log', JSON.stringify(emailLog));
  return emailData;
}

// Admin function: Approve user
function approveUser(userId) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, error: 'user_not_found' };
  users[userIndex].status = USER_STATUS.APPROVED;
  users[userIndex].approvedAt = new Date().toISOString();
  saveUsers(users);
  return { success: true };
}

// Admin function: Approve user with modules
function approveUserWithModules(userId, modules, propertyKey) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, error: 'user_not_found' };
  const allowedModules = Object.values(MODULES);
  const finalModules = Array.isArray(modules) ? modules.filter((m, idx) => allowedModules.includes(m) && modules.indexOf(m) === idx) : [];
  users[userIndex].modules = finalModules;
  if (typeof propertyKey !== 'undefined') users[userIndex].propertyKey = propertyKey || null;
  users[userIndex].status = USER_STATUS.APPROVED;
  users[userIndex].approvedAt = new Date().toISOString();
  saveUsers(users);
  return { success: true };
}

// Admin function: Deny user
function denyUser(userId) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, error: 'user_not_found' };
  users[userIndex].status = USER_STATUS.DENIED;
  saveUsers(users);
  return { success: true };
}

// Get pending users (for admin)
function getPendingUsers() { return getUsers().filter(u => u.status === USER_STATUS.PENDING); }
function getAllUsers() { return getUsers(); }
function updateUserModules(userId, modules) {
  const users = getUsers(); const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, error: 'user_not_found' };
  users[userIndex].modules = modules; saveUsers(users); return { success: true };
}
function updateUserProperty(userId, propertyKey) {
  const users = getUsers(); const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, error: 'user_not_found' };
  users[userIndex].propertyKey = propertyKey || null; saveUsers(users); return { success: true };
}
function hasModuleAccess(module) {
  const session = getCurrentSession(); if (!session) return false; const users = getUsers(); const user = users.find(u => u.id === session.userId); if (!user) return false; if (user.role === 'admin') return true; return user.modules && user.modules.includes(module);
}
function getUserModules(userId) { const users = getUsers(); const user = users.find(u => u.id === userId); if (!user) return []; if (user.role === 'admin') return Object.values(MODULES); return user.modules || []; }
function getUserProperty(userId) { const users = getUsers(); const user = users.find(u => u.id === userId); return user ? (user.propertyKey || null) : null; }
function deleteUser(userId) { let users = getUsers(); const userIndex = users.findIndex(u => u.id === userId); if (userIndex === -1) return { success: false, error: 'user_not_found' }; if (users[userIndex].role === 'admin') return { success: false, error: 'cannot_delete_admin' }; users = users.filter(u => u.id !== userId); saveUsers(users); return { success: true }; }

// Validate password strength
function validatePassword(password) {
  if (!password || password.length < 8) return { valid: false, error: 'password_too_short' };
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasNumber || !hasSpecial) return { valid: false, error: 'password_weak' };
  return { valid: true };
}

// Initialization logic for admin and demo users
function initializeAuth() {
  const users = getUsers();
  const adminExists = users.some(u => u.username === 'admin');
  if (!adminExists) {
    users.push({ id: generateUserId(), fullName: 'Administrator', email: 'admin@nexefii.com', phone: '', country: 'BR', propertyKey: null, properties: [], position: 'Administrator', username: 'admin', password: hashPassword('admin12345!@#'), status: USER_STATUS.APPROVED, role: 'admin', modules: Object.values(MODULES), createdAt: new Date().toISOString(), approvedAt: new Date().toISOString() });
  }
  const demoExists = users.some(u => u.username === 'demo');
  if (!demoExists) {
  users.push({ id: generateUserId(), fullName: 'Demo User', email: 'demo@nexefii.com', phone: '', country: 'BR', propertyKey: 'nexefiiSaoPaulo', properties: ['nexefiiSaoPaulo', 'nexefiiMiami'], position: 'Property Manager', username: 'demo', password: hashPassword('demo123'), status: USER_STATUS.APPROVED, role: 'manager', modules: ['engineering', 'housekeeping', 'alerts'], createdAt: new Date().toISOString(), approvedAt: new Date().toISOString() });
    console.info('✓ Demo user created - Username: demo | Password: demo123 | Properties: São Paulo, Miami');
  }
  saveUsers(users);
}

// Initialize auth system on load
if (typeof window !== 'undefined') {
  initializeAuth();
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.NexefiiAuth = {
    registerUser,
    authenticateUser,
    isAuthenticated,
    getCurrentSession,
    logout,
    approveUser,
    approveUserWithModules,
    denyUser,
    getPendingUsers,
    getAllUsers,
    updateUserModules,
    updateUserProperty,
    hasModuleAccess,
    getUserModules,
    getUserProperty,
    deleteUser,
    validatePassword,
    USER_STATUS,
    MODULES,
    MODULE_NAMES
  };
  // Backwards compatibility: provide legacy global until all callers are migrated
  try { window.IluxAuth = window.NexefiiAuth; } catch(e) {}
}


// Admin function: Approve user with a specific subset of modules and optional property assignment
function approveUserWithModules(userId, modules, propertyKey) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: 'user_not_found' };
  }
  const user = users[userIndex];
  // Normalize modules: distinct and only known module ids
  const allowedModules = Object.values(MODULES);
  const finalModules = Array.isArray(modules) ? modules.filter((m, idx) => allowedModules.includes(m) && modules.indexOf(m) === idx) : [];
  user.modules = finalModules;
  if (typeof propertyKey !== 'undefined') {
    user.propertyKey = propertyKey || null;
  }
  user.status = USER_STATUS.APPROVED;
  user.approvedAt = new Date().toISOString();
  saveUsers(users);
  return { success: true };
}

// Admin function: Deny user
function denyUser(userId) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'user_not_found' };
  }
  
  users[userIndex].status = USER_STATUS.DENIED;
  
  saveUsers(users);
  
  return { success: true };
}

// Get pending users (for admin)
function getPendingUsers() {
  const users = getUsers();
  return users.filter(u => u.status === USER_STATUS.PENDING);
}

// Get all users (for admin)
function getAllUsers() {
  return getUsers();
}

// Update user modules (admin only)
function updateUserModules(userId, modules) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'user_not_found' };
  }
  
  users[userIndex].modules = modules;
  saveUsers(users);
  
  return { success: true };
}

// Update user property (admin only)
function updateUserProperty(userId, propertyKey) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: 'user_not_found' };
  }
  users[userIndex].propertyKey = propertyKey || null;
  saveUsers(users);
  return { success: true };
}

// Check if user has access to a specific module
function hasModuleAccess(module) {
  const session = getCurrentSession();
  if (!session) return false;
  
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin has access to everything
  
  return user.modules && user.modules.includes(module);
}

// Get user's modules
function getUserModules(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) return [];
  if (user.role === 'admin') return Object.values(MODULES);
  
  return user.modules || [];
}

// Get user's property
function getUserProperty(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  return user ? (user.propertyKey || null) : null;
}

// Delete user (admin only)
function deleteUser(userId) {
  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'user_not_found' };
  }
  
  // Prevent deleting admin
  if (users[userIndex].role === 'admin') {
    return { success: false, error: 'cannot_delete_admin' };
  }
  
  users = users.filter(u => u.id !== userId);
  saveUsers(users);
  
  return { success: true };
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, error: 'password_too_short' };
  }
  
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasNumber || !hasSpecial) {
    return { valid: false, error: 'password_weak' };
  }
  
  return { valid: true };
}

// Initialize auth system on load
if (typeof window !== 'undefined') {
  initializeAuth();
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.NexefiiAuth = {
    registerUser,
    authenticateUser,
    isAuthenticated,
    getCurrentSession,
    logout,
    approveUser,
    approveUserWithModules,
    denyUser,
    getPendingUsers,
    getAllUsers,
    updateUserModules,
    updateUserProperty,
    hasModuleAccess,
    getUserModules,
    getUserProperty,
    deleteUser,
    validatePassword,
    USER_STATUS,
    MODULES,
    MODULE_NAMES
  };
  // Backwards compatibility: provide legacy global until all callers are migrated
  try { window.IluxAuth = window.NexefiiAuth; } catch(e) {}
}


