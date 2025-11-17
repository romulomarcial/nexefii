// UserModel: centralized user storage and helpers
// User schema (example):
// {
//   id: 'user-uuid',
//   email: 'user@example.com',
//   name: 'User Name',
//   role: 'MASTER' | 'SUPERADMIN' | 'USER',
//   properties: [ { id, key, slug, name } , ... ],
//   passwordHash: '...', // simple hash via btoa for mock
//   isActive: true
// }
(function(global){
  const STORAGE_KEY = 'nexefii_users';

  function _read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
  }
  function _write(list) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list || [])); } catch(e){} }

  function _genId() {
    return 'user-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36);
  }

  function hashPassword(p) {
    try { return btoa(String(p || '') ); } catch(e){ return String(p || ''); }
  }

  function getAllUsers() { return _read(); }
  function saveUsers(list) { _write(list || []); return getAllUsers(); }

  function findByEmail(email) {
    if(!email) return null;
    const e = String(email).toLowerCase();
    return getAllUsers().find(u => (u.email||'').toLowerCase() === e) || null;
  }
  function findById(id) {
    if(!id) return null;
    return getAllUsers().find(u => u.id === id) || null;
  }

  function createUser(opts) {
    const users = getAllUsers();
    const now = Date.now();
    const u = {
      id: opts.id || _genId(),
      email: (opts.email || '').toLowerCase(),
      name: opts.name || opts.email || 'Unnamed',
      role: (opts.role || 'USER').toUpperCase(),
      properties: Array.isArray(opts.properties) ? opts.properties : (opts.properties ? [opts.properties] : []),
      passwordHash: opts.password ? hashPassword(opts.password) : (opts.passwordHash || ''),
      isActive: typeof opts.isActive === 'boolean' ? opts.isActive : true,
      createdAt: opts.createdAt || now,
      updatedAt: now
    };
    users.push(u);
    _write(users);
    return u;
  }

  function updateUser(partial) {
    if(!partial || !partial.id) return null;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === partial.id);
    if (idx === -1) return null;
    const target = users[idx];
    const merged = Object.assign({}, target, partial, { updatedAt: Date.now() });
    // normalize role
    if (merged.role) merged.role = String(merged.role).toUpperCase();
    // Corrige passwordHash: se password informado, gera novo hash
    if (partial.password) {
      merged.passwordHash = hashPassword(partial.password);
    }
    users[idx] = merged;
    _write(users);
    return merged;
  }

  function deleteUser(id) {
    if(!id) return false;
    const users = getAllUsers().filter(u => u.id !== id);
    _write(users);
    return true;
  }

  function ensureInitialized() {
    try {
      let users = getAllUsers();
      if (!users || !users.length) {
        // Attempt to bootstrap from existing nexefii_user
        let raw = null;
        try { raw = JSON.parse(localStorage.getItem('nexefii_user') || 'null'); } catch(e) { raw = null; }
        if (raw && raw.email) {
          const boot = createUser({ email: raw.email, name: raw.name || raw.email, role: raw.role || 'MASTER', properties: raw.properties || [], password: raw.password || 'master' });
          // ensure the stored nexefii_user references the created id
          try { localStorage.setItem('nexefii_user', JSON.stringify(Object.assign({}, raw, { id: boot.id }))); } catch(e){}
          users = getAllUsers();
        } else {
          // create default local master for dev
          const master = createUser({ email: 'master@local', name: 'Master Admin', role: 'MASTER', password: 'master' });
          try { localStorage.setItem('nexefii_user', JSON.stringify({ id: master.id, email: master.email, name: master.name, role: master.role, properties: master.properties })); } catch(e){}
        }
      }
    } catch (e) { /* noop */ }
  }

  /**
   * Ensure default users exist: MASTER and SUPERADMIN
   */
  function ensureDefaultUsers() {
    try {
      // Remove qualquer MASTER antigo que não seja master@nexefii.local
      getAllUsers().filter(u => u.role === 'MASTER' && u.email !== 'master@nexefii.local').forEach(u => deleteUser(u.id));

      // Cria/atualiza MASTER padronizado
      let master = findByEmail('master@nexefii.local');
      if (!master) {
        master = createUser({
          email: 'master@nexefii.local',
          name: 'System Master',
          role: 'MASTER',
          password: 'Admin@456',
          properties: [],
          isActive: true
        });
      } else {
        master = updateUser({
          id: master.id,
          email: 'master@nexefii.local',
          name: 'System Master',
          role: 'MASTER',
          password: 'Admin@456',
          properties: master.properties || [],
          isActive: true
        });
      }
      // Sempre cria/atualiza SUPERADMIN
      let superadmin = findByEmail('superadmin@nexefii.local');
      if (!superadmin) {
        superadmin = createUser({
          email: 'superadmin@nexefii.local',
          name: 'Super Admin',
          role: 'SUPERADMIN',
          password: 'Super@123',
          properties: [],
          isActive: true
        });
      } else {
        superadmin = updateUser({
          id: superadmin.id,
          email: 'superadmin@nexefii.local',
          name: 'Super Admin',
          role: 'SUPERADMIN',
          password: 'Super@123',
          properties: superadmin.properties || [],
          isActive: true
        });
      }
      // Garante referência de sessão MASTER
      if (master) {
        try {
          localStorage.setItem('nexefii_user', JSON.stringify({ id: master.id, email: master.email, name: master.name, role: master.role, properties: master.properties }));
        } catch (e) { /* noop */ }
      }
    } catch (e) { /* noop */ }
  }

  /**
   * Authenticate using local user store
   * Returns user object when success, null when fail
   */
  function authenticateLocal(email, password) {
    try {
      if (!email || !password) {
        console.warn('[UserModel] authenticateLocal: email ou senha vazios');
        return null;
      }
      const u = findByEmail(email);
      if (!u) {
        console.warn('[UserModel] authenticateLocal: usuário não encontrado para', email);
        return null;
      }
      if (!u.isActive) {
        console.warn('[UserModel] authenticateLocal: usuário inativo', email);
        return null;
      }
      const hash = hashPassword(password);
      console.log('[UserModel] authenticateLocal: comparando hashes', 'esperado:', u.passwordHash, 'informado:', hash);
      if (u.passwordHash === hash) {
        console.log('[UserModel] authenticateLocal: senha correta para', email);
        return u;
      }
      console.warn('[UserModel] authenticateLocal: senha incorreta para', email);
      return null;
    } catch (e) { console.warn('[UserModel] authenticateLocal: erro', e); return null; }
  }

  function syncSessionUser(sessionObj) {
    if (!sessionObj || !sessionObj.email) return null;
    const existing = findByEmail(sessionObj.email);
    if (existing) {
      // merge some fields
      const merged = updateUser(Object.assign({}, existing, { name: sessionObj.name || existing.name, properties: sessionObj.properties || existing.properties, role: sessionObj.role || existing.role }));
      // ensure nexefii_user references merged
      try { localStorage.setItem('nexefii_user', JSON.stringify(Object.assign({}, merged, { passwordHash: merged.passwordHash }))); } catch(e){}
      return merged;
    }
    // create new user
    const created = createUser({ email: sessionObj.email, name: sessionObj.name || sessionObj.email, role: sessionObj.role || 'USER', properties: sessionObj.properties || [], password: sessionObj.password || 'changeme' });
    try { localStorage.setItem('nexefii_user', JSON.stringify(Object.assign({}, created, { passwordHash: created.passwordHash }))); } catch(e){}
    return created;
  }

  // Expose
  global.UserModel = {
    getAllUsers,
    saveUsers,
    findByEmail,
    findById,
    createUser,
    updateUser,
    deleteUser,
    ensureInitialized,
    ensureDefaultUsers,
    authenticateLocal,
    hashPassword,
    syncSessionUser
  };

  // Auto-initialize on load (best-effort)
  try { ensureInitialized(); } catch(e){}
  // Ensure default users exist (non-intrusive)
  try { if (typeof ensureDefaultUsers === 'function') ensureDefaultUsers(); } catch(e){}

})(window);
