/*
 * Nexefii SyncLogger
 * Coleta logs estruturados + métricas de sincronização
 */
class SyncLogger {
  constructor() {
    this.logs = [];
    this.startTime = performance.now();
    this.metrics = {
      events: 0,
      warnings: 0,
      errors: 0,
      latencySamples: [],
    };
  }

  info(msg, ctx) { this._push('INFO', msg, ctx); }
  warn(msg, ctx) { this.metrics.warnings++; this._push('WARN', msg, ctx); }
  error(msg, ctx) { this.metrics.errors++; this._push('ERROR', msg, ctx); }
  debug(msg, ctx) { this._push('DEBUG', msg, ctx); }

  _push(level, msg, ctx) {
    const entry = {
      ts: Date.now(),
      level,
      msg,
      ctx: ctx || null
    };
    this.logs.push(entry);
    if (this.logs.length > 5000) this.logs.shift(); // simple cap
  }

  recordLatency(ms) {
    this.metrics.latencySamples.push(ms);
    if (this.metrics.latencySamples.length > 2000) this.metrics.latencySamples.shift();
  }

  export() {
    return {
      generatedAt: new Date().toISOString(),
      uptimeMs: performance.now() - this.startTime,
      metrics: {
        ...this.metrics,
        avgLatency: this._avg(this.metrics.latencySamples)
      },
      logs: this.logs.slice(-1000) // últimos 1000 registros
    };
  }

  _avg(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
}

export default SyncLogger;
