// Session Context utilities
// Stores and reads current user and active property from localStorage (nexefii_user)
(function(global){
  const STORAGE_KEY = 'nexefii_user';
  const ACTIVE_PROPERTY_KEY = 'nexefii_active_property';

  function readRawUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // fallbacks for legacy/demo keys
        const alt = localStorage.getItem('nexefii_session') || localStorage.getItem('currentUser') || localStorage.getItem('nexefii_session');
        if (!alt) return null;
        try { return JSON.parse(alt); } catch(e) { return null; }
      }
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function writeRawUser(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {})); } catch(e){}
  }

  function getCurrentUser() {
    const u = readRawUser();
    if (!u) return null;
    // retrocompat: if no role, treat as MASTER
    if (!u.role) u.role = 'MASTER';
    // normalize some legacy role names
    if (typeof u.role === 'string') {
      const r = u.role.toLowerCase();
      if (r === 'admin' || r === 'master' || r === 'administrator') u.role = 'MASTER';
      else if (r === 'superadmin' || r === 'super_admin' || r === 'super') u.role = 'SUPERADMIN';
      else if (r === 'manager' || r === 'user' || r === 'normal' || r === 'guest') u.role = 'USER';
      else u.role = u.role.toUpperCase();
    }
    // ensure properties array exists
    if (!Array.isArray(u.properties)) u.properties = u.properties ? [u.properties] : [];
    return u;
  }

  function getUserRole() {
    const u = getCurrentUser();
    return u ? (u.role || 'MASTER') : 'MASTER';
  }

  function isMasterUser() { return getUserRole() === 'MASTER'; }
  function isSuperAdmin() { return getUserRole() === 'SUPERADMIN'; }
  function isNormalUser() { return getUserRole() === 'USER'; }

  function getAccessibleProperties() {
    const u = getCurrentUser();
    if (!u) return [];
    if (isMasterUser()) {
      // MASTER: current behaviour is admin elsewhere; return empty to discourage dashboard
      // but to avoid breaking, return any properties if present
      return u.properties || [];
    }
    if (isSuperAdmin()) {
      // SUPERADMIN: sees all properties persisted in localStorage under nexefii_properties
      try {
        const all = JSON.parse(localStorage.getItem('nexefii_properties') || '{}');
        return Object.keys(all).map(k => all[k]);
      } catch(e) { return u.properties || []; }
    }
    // Normal user: only assigned properties
    return u.properties || [];
  }

  function getActiveProperty() {
    try {
      const id = localStorage.getItem(ACTIVE_PROPERTY_KEY);
      const props = getAccessibleProperties();
      if (!props || !props.length) return null;
      if (id) {
        const found = props.find(p => (p.id && p.id.toString() === id.toString()) || (p.key && p.key.toString() === id.toString()) || (p.slug && p.slug === id));
        if (found) return found;
      }
      // If no active id, default to first accessible property
      return props[0] || null;
    } catch(e){ return null; }
  }

  function setActiveProperty(propertyId) {
    try {
      if (!propertyId) { localStorage.removeItem(ACTIVE_PROPERTY_KEY); return; }
      localStorage.setItem(ACTIVE_PROPERTY_KEY, propertyId.toString());
    } catch(e){}
  }

  // expose
  global.SessionContext = {
    getCurrentUser,
    getUserRole,
    getAccessibleProperties,
    getActiveProperty,
    setActiveProperty,
    isMasterUser,
    isSuperAdmin,
    isNormalUser
  };

})(window);

// Ensure user model is initialized if available (non-blocking)
try {
  if (window.UserModel && typeof window.UserModel.ensureInitialized === 'function') {
    window.UserModel.ensureInitialized();
  }
} catch (e) { /* noop */ }
