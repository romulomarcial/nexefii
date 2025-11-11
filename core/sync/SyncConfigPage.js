/*
 * Nexefii SyncConfigPage
 * Renderização da interface de configuração de sincronização.
 */
import SyncService from './SyncService.js';
import ConflictResolver from './ConflictResolver.js';
import SyncLogger from './SyncLogger.js';

class SyncConfigPage {
  constructor({ transport, configStore }) {
    this.transport = transport;
    this.configStore = configStore;
    this.logger = new SyncLogger();
    this.conflictResolver = new ConflictResolver({ logger: this.logger });
    this.syncService = new SyncService({ transport, logger: this.logger, conflictResolver: this.conflictResolver, configStore });
  }

  mount(root) {
    this.syncService.init();
    root.innerHTML = this.template();
    this.bindEvents(root);
    this.refreshStatus(root);
  }

  template() {
    const config = this.configStore.getSyncConfig() || { mode: 'manual', intervalMs: 60000 };
    return `
      <div class="sync-config">
        <h1>🔄 Configuração de Sincronização</h1>
        <p>Modo atual: <strong id="syncMode">${config.mode}</strong></p>
        <div class="modes">
          <button data-mode="manual">Manual</button>
          <button data-mode="scheduled">Agendado</button>
          <button data-mode="continuous">Contínuo</button>
        </div>
        <div class="interval">
          <label>Intervalo (ms): <input id="intervalMs" type="number" value="${config.intervalMs}" min="1000" step="1000" /></label>
        </div>
        <div class="actions">
          <button id="forceSync">⚡ Sincronizar Agora</button>
          <button id="exportLog">📤 Exportar Log</button>
        </div>
        <div class="status">
          <h2>Status</h2>
          <pre id="syncStatus">Carregando...</pre>
        </div>
      </div>
    `;
  }

  bindEvents(root) {
    root.querySelectorAll('button[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        const intervalMs = parseInt(root.querySelector('#intervalMs').value, 10) || 60000;
        this.syncService.configureMode(mode, intervalMs);
        root.querySelector('#syncMode').textContent = mode;
        this.refreshStatus(root);
      });
    });

    root.querySelector('#forceSync').addEventListener('click', async () => {
      await this.syncService.sync();
      this.refreshStatus(root);
    });

    root.querySelector('#exportLog').addEventListener('click', () => {
      const exported = this.logger.export();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sync-log.json';
      a.click();
    });

    root.querySelector('#intervalMs').addEventListener('change', () => {
      const mode = this.syncService.mode;
      const intervalMs = parseInt(root.querySelector('#intervalMs').value, 10) || 60000;
      if (mode === 'scheduled') {
        this.syncService.configureMode(mode, intervalMs);
      }
    });
  }

  refreshStatus(root) {
    const statusEl = root.querySelector('#syncStatus');
    const metrics = this.syncService.exportMetrics();
    statusEl.textContent = JSON.stringify(metrics, null, 2);
  }
}

export default SyncConfigPage;
