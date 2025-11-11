/*
 * Nexefii Logger (Advanced)
 * Sistema avançado de logs estruturados com níveis, categorias e exportação.
 * Substitui/estende SyncLogger com recursos enterprise.
 */

class Logger {
  constructor(config = {}) {
    this.levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };
    this.currentLevel = this.levels[config.level || 'INFO'];
    this.maxEntries = config.maxEntries || 10000;
    this.entries = [];
    this.categories = new Map(); // Performance por categoria
    this.startTime = performance.now();
    this.listeners = []; // Para streaming em tempo real
  }

  log(level, message, context = {}) {
    const levelNum = this.levels[level];
    if (levelNum < this.currentLevel) return; // Skip se abaixo do nível

    const entry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      category: context.category || 'general',
      uptime: (performance.now() - this.startTime).toFixed(2)
    };

    this.entries.push(entry);
    
    // Rotação automática
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Estatísticas por categoria
    const cat = entry.category;
    if (!this.categories.has(cat)) {
      this.categories.set(cat, { count: 0, errors: 0 });
    }
    const stats = this.categories.get(cat);
    stats.count++;
    if (level === 'ERROR' || level === 'FATAL') stats.errors++;

    // Notificar listeners
    this.notifyListeners(entry);

    // Console mirror (apenas WARN+)
    if (levelNum >= this.levels.WARN) {
      const method = level === 'FATAL' ? 'error' : level.toLowerCase();
      console[method](`[${level}] ${message}`, context);
    }
  }

  debug(msg, ctx) { this.log('DEBUG', msg, ctx); }
  info(msg, ctx) { this.log('INFO', msg, ctx); }
  warn(msg, ctx) { this.log('WARN', msg, ctx); }
  error(msg, ctx) { this.log('ERROR', msg, ctx); }
  fatal(msg, ctx) { this.log('FATAL', msg, ctx); }

  // Performance tracking
  time(label) {
    return {
      end: () => {
        const duration = performance.now() - performance.now();
        this.info(`Timer: ${label}`, { duration, category: 'performance' });
        return duration;
      }
    };
  }

  // Filtros e consultas
  query(filters = {}) {
    let results = [...this.entries];

    if (filters.level) {
      results = results.filter(e => e.level === filters.level);
    }
    if (filters.category) {
      results = results.filter(e => e.category === filters.category);
    }
    if (filters.since) {
      results = results.filter(e => e.timestamp >= filters.since);
    }
    if (filters.text) {
      const regex = new RegExp(filters.text, 'i');
      results = results.filter(e => regex.test(e.message));
    }

    return results;
  }

  // Estatísticas
  getStats() {
    const byLevel = {};
    for (const level of Object.keys(this.levels)) {
      byLevel[level] = this.entries.filter(e => e.level === level).length;
    }

    return {
      total: this.entries.length,
      byLevel,
      byCategory: Object.fromEntries(this.categories),
      uptimeMs: performance.now() - this.startTime,
      memoryUsageKB: (JSON.stringify(this.entries).length / 1024).toFixed(2)
    };
  }

  // Streaming (listeners em tempo real)
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  notifyListeners(entry) {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error('Listener error:', err);
      }
    }
  }

  // Exportação
  export(format = 'json') {
    const data = {
      generatedAt: new Date().toISOString(),
      stats: this.getStats(),
      entries: this.entries
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    if (format === 'csv') {
      const header = 'timestamp,level,category,message\n';
      const rows = this.entries.map(e => 
        `${e.timestamp},${e.level},${e.category},"${e.message.replace(/"/g, '""')}"`
      ).join('\n');
      return header + rows;
    }
    return data;
  }

  // Persistência
  save() {
    try {
      localStorage.setItem('nexefii_logger_state', JSON.stringify({
        entries: this.entries.slice(-1000), // Últimos 1000
        categories: Object.fromEntries(this.categories)
      }));
    } catch (err) {
      console.warn('Failed to save logger state:', err);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('nexefii_logger_state');
      if (saved) {
        const data = JSON.parse(saved);
        this.entries = data.entries || [];
        this.categories = new Map(Object.entries(data.categories || {}));
      }
    } catch (err) {
      console.warn('Failed to load logger state:', err);
    }
  }

  clear() {
    this.entries = [];
    this.categories.clear();
  }
}

export default Logger;
