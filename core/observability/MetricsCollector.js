/*
 * Nexefii MetricsCollector
 * Coleta e agrega métricas de performance, uso de recursos e comportamento do sistema.
 */

class MetricsCollector {
  constructor({ logger, interval = 5000 }) {
    this.logger = logger;
    this.interval = interval;
    this.metrics = {
      performance: [],
      resources: [],
      custom: new Map()
    };
    this.collectors = [];
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    
    this.logger?.info('MetricsCollector iniciado', { interval: this.interval });
    
    // Coleta periódica
    this.intervalId = setInterval(() => {
      this.collect();
    }, this.interval);

    // Coleta inicial
    this.collect();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger?.info('MetricsCollector parado');
    }
  }

  collect() {
    this.collectPerformance();
    this.collectResources();
    this.runCustomCollectors();
  }

  collectPerformance() {
    const perf = performance.now();
    const mem = performance.memory;
    
    const entry = {
      timestamp: Date.now(),
      uptime: perf,
      memory: mem ? {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit
      } : null,
      timing: performance.timing ? {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      } : null
    };

    this.metrics.performance.push(entry);
    
    // Manter últimas 1000 amostras
    if (this.metrics.performance.length > 1000) {
      this.metrics.performance.shift();
    }
  }

  collectResources() {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) return;

    navigator.storage.estimate().then(estimate => {
      const entry = {
        timestamp: Date.now(),
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage,
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };

      this.metrics.resources.push(entry);

      if (this.metrics.resources.length > 500) {
        this.metrics.resources.shift();
      }
    });
  }

  runCustomCollectors() {
    for (const collector of this.collectors) {
      try {
        const result = collector();
        if (result && result.name && result.value !== undefined) {
          this.recordCustom(result.name, result.value, result.metadata);
        }
      } catch (err) {
        this.logger?.error('Custom collector failed', { error: err.message });
      }
    }
  }

  // Métricas customizadas
  recordCustom(name, value, metadata = {}) {
    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, []);
    }

    const samples = this.metrics.custom.get(name);
    samples.push({
      timestamp: Date.now(),
      value,
      metadata
    });

    if (samples.length > 500) {
      samples.shift();
    }
  }

  registerCollector(fn) {
    this.collectors.push(fn);
  }

  // Análise
  analyze(metricName, options = {}) {
    let data;
    
    if (metricName === 'performance') {
      data = this.metrics.performance.map(e => e.uptime);
    } else if (metricName === 'resources') {
      data = this.metrics.resources.map(e => e.usage);
    } else if (this.metrics.custom.has(metricName)) {
      data = this.metrics.custom.get(metricName).map(e => e.value);
    } else {
      return null;
    }

    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: data.length,
      sum,
      avg,
      min,
      max,
      median,
      p95,
      p99,
      stdDev: this.calculateStdDev(data, avg)
    };
  }

  calculateStdDev(data, avg) {
    const squaredDiffs = data.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(variance);
  }

  // Agregações
  getSnapshot() {
    return {
      timestamp: Date.now(),
      performance: this.analyze('performance'),
      resources: this.analyze('resources'),
      custom: Object.fromEntries(
        Array.from(this.metrics.custom.keys()).map(name => [
          name,
          this.analyze(name)
        ])
      )
    };
  }

  // Exportação
  export() {
    return {
      generatedAt: new Date().toISOString(),
      snapshot: this.getSnapshot(),
      rawData: {
        performance: this.metrics.performance.slice(-100),
        resources: this.metrics.resources.slice(-100),
        custom: Object.fromEntries(
          Array.from(this.metrics.custom.entries()).map(([k, v]) => [k, v.slice(-100)])
        )
      }
    };
  }

  // Limites e alertas
  checkThresholds(thresholds = {}) {
    const alerts = [];
    const snapshot = this.getSnapshot();

    // Memory check
    if (thresholds.memoryPercent && this.metrics.resources.length > 0) {
      const latest = this.metrics.resources[this.metrics.resources.length - 1];
      if (parseFloat(latest.percentUsed) > thresholds.memoryPercent) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `Storage usage at ${latest.percentUsed}% (threshold: ${thresholds.memoryPercent}%)`
        });
      }
    }

    // Performance check
    if (thresholds.avgPerformance && snapshot.performance) {
      if (snapshot.performance.avg > thresholds.avgPerformance) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Average performance ${snapshot.performance.avg.toFixed(2)}ms (threshold: ${thresholds.avgPerformance}ms)`
        });
      }
    }

    return alerts;
  }
}

export default MetricsCollector;
