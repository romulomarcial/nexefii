/*
 * Nexefii RollbackService
 * Gerencia snapshots de estado e rollback de versões.
 * Permite reverter sistema para estado anterior em caso de falha.
 */

class RollbackService {
  constructor({ logger, storage }) {
    this.logger = logger;
    this.storage = storage || localStorage;
    this.snapshots = this.loadSnapshots();
    this.maxSnapshots = 5; // Manter últimos 5 snapshots
  }

  loadSnapshots() {
    try {
      return JSON.parse(this.storage.getItem('nexefii_snapshots') || '[]');
    } catch {
      return [];
    }
  }

  saveSnapshots() {
    this.storage.setItem('nexefii_snapshots', JSON.stringify(this.snapshots));
  }

  async createSnapshot(metadata = {}) {
    this.logger.info('Criando snapshot do sistema...');

    const snapshot = {
      id: 'snap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      version: metadata.version || window.APP_VERSION || '1.0.0',
      state: await this.captureState(),
      metadata
    };

    // Adicionar e limitar quantidade
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      const removed = this.snapshots.shift();
      this.logger.debug(`Snapshot antigo removido: ${removed.id}`);
    }

    this.saveSnapshots();
    this.logger.info(`Snapshot criado: ${snapshot.id}`);
    return snapshot;
  }

  async captureState() {
    // Captura estado crítico do sistema
    const state = {
      appVersion: window.APP_VERSION || '1.0.0',
      config: {},
      data: {}
    };

    // Capturar configurações relevantes
    try {
      const keys = ['nexefii_sync_config', 'nexefii_lang', 'nexefii_user'];
      for (const key of keys) {
        const value = this.storage.getItem(key);
        if (value) {
          state.config[key] = value;
        }
      }
    } catch (err) {
      this.logger.warn('Erro ao capturar config: ' + err.message);
    }

    // Capturar dados críticos (simplificado)
    try {
      // Em produção: seria mais abrangente, incluindo IndexedDB
      state.data.timestamp = Date.now();
    } catch (err) {
      this.logger.warn('Erro ao capturar dados: ' + err.message);
    }

    return state;
  }

  async rollback(snapshotId = null) {
    if (this.snapshots.length === 0) {
      this.logger.error('Nenhum snapshot disponível para rollback');
      return { success: false, reason: 'no_snapshots' };
    }

    // Usar snapshot específico ou o mais recente
    let snapshot;
    if (snapshotId) {
      snapshot = this.snapshots.find(s => s.id === snapshotId);
      if (!snapshot) {
        this.logger.error(`Snapshot ${snapshotId} não encontrado`);
        return { success: false, reason: 'snapshot_not_found' };
      }
    } else {
      snapshot = this.snapshots[this.snapshots.length - 1];
    }

    this.logger.info(`Executando rollback para ${snapshot.id} (${snapshot.version})...`);

    try {
      await this.restoreState(snapshot.state);
      
      // Atualizar versão
      window.APP_VERSION = snapshot.version;
      this.storage.setItem('nexefii_app_version', snapshot.version);

      this.logger.info('Rollback concluído com sucesso');
      return { 
        success: true, 
        version: snapshot.version,
        snapshotId: snapshot.id 
      };

    } catch (err) {
      this.logger.error('Falha no rollback: ' + err.message);
      return { success: false, error: err.message };
    }
  }

  async restoreState(state) {
    // Restaurar configurações
    for (const [key, value] of Object.entries(state.config)) {
      this.storage.setItem(key, value);
    }

    // Restaurar dados (simplificado)
    // Em produção: restauraria IndexedDB, arquivos, etc.
    
    this.logger.info('Estado restaurado');
  }

  hasSnapshots() {
    return this.snapshots.length > 0;
  }

  listSnapshots() {
    return this.snapshots.map(s => ({
      id: s.id,
      version: s.version,
      timestamp: s.timestamp,
      date: new Date(s.timestamp).toISOString()
    }));
  }

  deleteSnapshot(snapshotId) {
    const index = this.snapshots.findIndex(s => s.id === snapshotId);
    if (index !== -1) {
      this.snapshots.splice(index, 1);
      this.saveSnapshots();
      this.logger.info(`Snapshot ${snapshotId} removido`);
      return true;
    }
    return false;
  }

  clearAllSnapshots() {
    this.snapshots = [];
    this.saveSnapshots();
    this.logger.info('Todos os snapshots removidos');
  }
}

export default RollbackService;
