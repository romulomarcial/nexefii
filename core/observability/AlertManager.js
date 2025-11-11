/*
 * Nexefii AlertManager
 * Sistema de alertas configurável com múltiplos canais e severidades.
 */

class AlertManager {
  constructor({ logger, metricsCollector }) {
    this.logger = logger;
    this.metricsCollector = metricsCollector;
    this.rules = [];
    this.alerts = [];
    this.handlers = new Map();
    this.intervalId = null;
    this.checkInterval = 30000; // 30s padrão
  }

  // Adicionar regra de alerta
  addRule(rule) {
    /*
     * rule: {
     *   id: string,
     *   name: string,
     *   condition: (snapshot) => boolean,
     *   severity: 'info' | 'warning' | 'critical',
     *   message: string | function,
     *   cooldown: number (ms),
     *   enabled: boolean
     * }
     */
    rule.enabled = rule.enabled !== false;
    rule.lastTriggered = 0;
    rule.cooldown = rule.cooldown || 60000; // 1min padrão
    
    this.rules.push(rule);
    this.logger?.info('Regra de alerta adicionada', { ruleId: rule.id, name: rule.name });
  }

  removeRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      this.logger?.info('Regra removida', { ruleId });
      return true;
    }
    return false;
  }

  // Handlers de alerta (canais)
  registerHandler(channel, handler) {
    /*
     * channel: 'console' | 'ui' | 'webhook' | 'email' | custom
     * handler: async (alert) => void
     */
    this.handlers.set(channel, handler);
    this.logger?.info('Handler registrado', { channel });
  }

  // Iniciar monitoramento
  start() {
    if (this.intervalId) return;
    
    this.logger?.info('AlertManager iniciado', { interval: this.checkInterval });
    
    this.intervalId = setInterval(() => {
      this.check();
    }, this.checkInterval);

    // Check inicial
    this.check();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger?.info('AlertManager parado');
    }
  }

  // Verificar regras
  async check() {
    if (!this.metricsCollector) {
      this.logger?.warn('MetricsCollector não disponível');
      return;
    }

    const snapshot = this.metricsCollector.getSnapshot();
    const now = Date.now();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Cooldown check
      if (now - rule.lastTriggered < rule.cooldown) continue;

      try {
        const triggered = rule.condition(snapshot);
        
        if (triggered) {
          rule.lastTriggered = now;
          await this.trigger(rule, snapshot);
        }
      } catch (err) {
        this.logger?.error('Erro ao avaliar regra', { ruleId: rule.id, error: err.message });
      }
    }
  }

  // Disparar alerta
  async trigger(rule, snapshot) {
    const message = typeof rule.message === 'function' 
      ? rule.message(snapshot) 
      : rule.message;

    const alert = {
      id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message,
      timestamp: Date.now(),
      snapshot: this.getRelevantSnapshot(snapshot, rule)
    };

    this.alerts.push(alert);
    
    // Limitar histórico
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    // Log
    const logMethod = rule.severity === 'critical' ? 'error' : 'warn';
    this.logger?.[logMethod]('Alerta disparado', {
      ruleId: rule.id,
      severity: rule.severity,
      message: alert.message
    });

    // Notificar handlers
    await this.notify(alert);

    return alert;
  }

  getRelevantSnapshot(snapshot, rule) {
    // Retorna apenas dados relevantes para reduzir tamanho
    const relevant = { timestamp: snapshot.timestamp };
    
    if (rule.relevantMetrics) {
      for (const metric of rule.relevantMetrics) {
        if (snapshot[metric]) {
          relevant[metric] = snapshot[metric];
        }
      }
    } else {
      // Se não especificado, retorna tudo
      return snapshot;
    }

    return relevant;
  }

  async notify(alert) {
    const promises = [];

    for (const [channel, handler] of this.handlers.entries()) {
      try {
        promises.push(handler(alert));
      } catch (err) {
        this.logger?.error('Handler falhou', { channel, error: err.message });
      }
    }

    await Promise.allSettled(promises);
  }

  // Consultas
  getAlerts(filters = {}) {
    let results = [...this.alerts];

    if (filters.severity) {
      results = results.filter(a => a.severity === filters.severity);
    }
    if (filters.ruleId) {
      results = results.filter(a => a.ruleId === filters.ruleId);
    }
    if (filters.since) {
      results = results.filter(a => a.timestamp >= filters.since);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  getActiveRules() {
    return this.rules.filter(r => r.enabled);
  }

  // Reconhecer alerta (para UIs)
  acknowledge(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    return false;
  }

  // Clear
  clearAlerts(olderThan = null) {
    if (olderThan) {
      this.alerts = this.alerts.filter(a => a.timestamp >= olderThan);
    } else {
      this.alerts = [];
    }
  }

  // Exportação
  export() {
    return {
      generatedAt: new Date().toISOString(),
      rules: this.rules.map(r => ({
        id: r.id,
        name: r.name,
        severity: r.severity,
        enabled: r.enabled,
        lastTriggered: r.lastTriggered
      })),
      alerts: this.alerts.slice(-100), // Últimos 100
      stats: {
        totalRules: this.rules.length,
        activeRules: this.rules.filter(r => r.enabled).length,
        totalAlerts: this.alerts.length,
        bySeverity: {
          info: this.alerts.filter(a => a.severity === 'info').length,
          warning: this.alerts.filter(a => a.severity === 'warning').length,
          critical: this.alerts.filter(a => a.severity === 'critical').length
        }
      }
    };
  }
}

// Regras pré-definidas
AlertManager.DefaultRules = {
  highMemoryUsage: {
    id: 'high_memory',
    name: 'Alto uso de memória',
    condition: (snapshot) => {
      return snapshot.resources?.percentUsed > 85;
    },
    severity: 'warning',
    message: (snapshot) => `Uso de memória em ${snapshot.resources.percentUsed}%`,
    relevantMetrics: ['resources']
  },

  slowPerformance: {
    id: 'slow_perf',
    name: 'Performance degradada',
    condition: (snapshot) => {
      return snapshot.performance?.avg > 5000;
    },
    severity: 'warning',
    message: 'Performance média acima de 5s',
    relevantMetrics: ['performance']
  },

  criticalError: {
    id: 'critical_error',
    name: 'Erro crítico detectado',
    condition: () => false, // Deve ser disparado manualmente
    severity: 'critical',
    message: 'Erro crítico no sistema'
  }
};

export default AlertManager;
