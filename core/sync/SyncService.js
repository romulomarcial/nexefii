/*
 * Nexefii SyncService
 * Responsável por sincronização entre storage local e servidor remoto.
 * Features:
 *  - Fila de eventos com prioridade
 *  - Modos: manual, agendado, contínuo
 *  - Delta updates (diff por hash)
 *  - Compressão (JSON + LZ fallback futuro)
 *  - Retry exponencial
 *  - Métricas (latência, itens, throughput)
 */

class SyncService {
  constructor({ transport, logger, conflictResolver, configStore }) {
    this.transport = transport; // Abstração de rede (fetch wrapper)
    this.logger = logger; // SyncLogger
    this.conflictResolver = conflictResolver; // ConflictResolver
    this.configStore = configStore; // Persistência de config
    this.queue = []; // Fila de eventos pendentes
    this.isSyncing = false;
    this.mode = 'manual'; // manual | scheduled | continuous
    this.intervalId = null;
    this.metrics = {
      lastSyncStart: null,
      lastSyncEnd: null,
      totalItemsSynced: 0,
      avgLatencyMs: 0,
      failures: 0,
      consecutiveFailures: 0,
    };
  }

  init() {
    const saved = this.configStore.getSyncConfig();
    if (saved) {
      this.mode = saved.mode || 'manual';
      if (this.mode !== 'manual') {
        this.configureMode(this.mode, saved.intervalMs || 60000);
      }
    }
    this.logger.info('SyncService inicializado | modo=' + this.mode);
  }

  configureMode(mode, intervalMs = 60000) {
    this.mode = mode;
    if (this.intervalId) clearInterval(this.intervalId);

    if (mode === 'scheduled') {
      this.intervalId = setInterval(() => this.sync(), intervalMs);
      this.logger.info(`Sync agendado a cada ${intervalMs}ms`);
    } else if (mode === 'continuous') {
      // Loop leve não bloqueante
      const loop = async () => {
        await this.sync();
        if (this.mode === 'continuous') requestIdleCallback(loop, { timeout: 2000 });
      };
      requestIdleCallback(loop, { timeout: 1000 });
      this.logger.info('Sync contínuo iniciado');
    } else {
      this.logger.info('Sync manual configurado');
    }

    this.configStore.saveSyncConfig({ mode, intervalMs });
  }

  enqueue(event) {
    // event: {type, payload, priority, timestamp}
    event.timestamp = Date.now();
    if (!event.priority) event.priority = 5; // menor prioridade
    this.queue.push(event);
    // Ordena por prioridade ASC, timestamp ASC
    this.queue.sort((a, b) => a.priority - b.priority || a.timestamp - b.timestamp);
    this.logger.debug(`Evento enfileirado: ${event.type} p=${event.priority}`);
  }

  async sync() {
    if (this.isSyncing) {
      this.logger.debug('Sync ignorado (já em progresso)');
      return;
    }
    if (this.queue.length === 0) {
      this.logger.debug('Fila vazia, nada para sincronizar');
      return;
    }
    this.isSyncing = true;
    this.metrics.lastSyncStart = performance.now();
    const batch = this.queue.splice(0, Math.min(this.queue.length, 50)); // lote
    this.logger.info(`Iniciando sync | itens=${batch.length}`);

    try {
      // Pré-processa delta
      const payload = this.buildDeltaPayload(batch);
      const result = await this.transport.send('/sync/apply', payload);

      if (result.conflicts && result.conflicts.length > 0) {
        this.logger.warn(`Conflitos detectados: ${result.conflicts.length}`);
        await this.handleConflicts(result.conflicts);
      }

      this.metrics.totalItemsSynced += batch.length;
      this.metrics.lastSyncEnd = performance.now();
      const latency = this.metrics.lastSyncEnd - this.metrics.lastSyncStart;
      this.metrics.avgLatencyMs = this.computeNewAvg(latency);
      this.metrics.consecutiveFailures = 0;
      this.logger.info(`Sync concluído em ${latency.toFixed(1)}ms`);
    } catch (err) {
      this.metrics.failures++;
      this.metrics.consecutiveFailures++;
      this.logger.error('Falha no sync: ' + err.message);
      // Retry exponencial simples
      if (this.metrics.consecutiveFailures <= 5) {
        const backoff = 500 * Math.pow(2, this.metrics.consecutiveFailures - 1);
        this.logger.warn(`Agendando retry em ${backoff}ms`);
        setTimeout(() => this.sync(), backoff);
      } else {
        this.logger.error('Máximo de retries atingido. Abortar.');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  buildDeltaPayload(batch) {
    // Futuro: calcular hash antes/depois e enviar apenas diffs
    return {
      timestamp: Date.now(),
      items: batch.map(e => ({ type: e.type, data: e.payload, ts: e.timestamp })),
      client: this.getClientMeta(),
    };
  }

  getClientMeta() {
    return {
      appVersion: window.APP_VERSION || 'dev',
      locale: navigator.language,
      tzOffset: new Date().getTimezoneOffset(),
    };
  }

  async handleConflicts(conflicts) {
    for (const c of conflicts) {
      const resolution = await this.conflictResolver.resolve(c);
      if (resolution && resolution.action === 'apply') {
        await this.transport.send('/sync/conflict/apply', resolution.payload);
        this.logger.info('Conflito resolvido (apply) id=' + c.id);
      } else if (resolution && resolution.action === 'skip') {
        this.logger.info('Conflito ignorado id=' + c.id);
      } else if (resolution && resolution.action === 'rollback') {
        await this.transport.send('/sync/conflict/rollback', { id: c.id });
        this.logger.info('Rollback aplicado id=' + c.id);
      }
    }
  }

  computeNewAvg(currentLatency) {
    const prev = this.metrics.avgLatencyMs;
    const totalSyncs = this.metrics.totalItemsSynced || 1; // aproximação
    return (prev * 0.9) + (currentLatency * 0.1);
  }

  exportMetrics() {
    return { ...this.metrics, queueSize: this.queue.length };
  }
}

export default SyncService;
