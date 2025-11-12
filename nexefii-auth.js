const NexefiiAuth = {
  async login(email, password) {
    const users = [
      { email: "admin@nexefii.com", password: "admin123", name: "Admin NEXEFII", role: "admin", properties: [] },
      { email: "demo@nexefii.com", password: "demo123", name: "Demo User", role: "user", properties: [] }
    ];
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Email ou senha invalidos");
    const session = { email: user.email, name: user.name, role: user.role, properties: user.properties, loginAt: new Date().toISOString() };
    localStorage.setItem("nexefii_session", JSON.stringify(session));
    return session;
  },
  logout() {
    localStorage.removeItem("nexefii_session");
    window.location.href = "/login.html";
  },
  getSession() {
    const sessionData = localStorage.getItem("nexefii_session");
    if (!sessionData) return null;
    try { return JSON.parse(sessionData); } catch (e) { return null; }
  },
  isAuthenticated() {
    return this.getSession() !== null;
  }
  ,
  // setSession: convenience method used by demoLogin and compatibility shims
  setSession(session) {
    try {
      if (!session) return;
      localStorage.setItem('nexefii_session', JSON.stringify(session));
    } catch (e) { console.warn('NexefiiAuth.setSession failed', e); }
  }
};

// Expose compatibility shims/globals for pages that expect a global safeIsAuthenticated helper
try {
  if (typeof window !== 'undefined') {
    window.NexefiiAuth = window.NexefiiAuth || NexefiiAuth;
    window.safeIsAuthenticated = window.safeIsAuthenticated || function() {
      try {
        if (window.NexefiiAuth && typeof window.NexefiiAuth.isAuthenticated === 'function') {
          return window.NexefiiAuth.isAuthenticated();
        }
        if (window.NexefiiAuth && typeof window.NexefiiAuth.isAuthenticated === 'function') {
          return window.NexefiiAuth.isAuthenticated();
        }
      } catch (e) {
        // swallow and return false
      }
      return false;
    };
  }
} catch (e) { /* ignore in non-browser env */ }
