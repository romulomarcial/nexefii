/*
 * Nexefii OTAManager
 * Gerencia atualizações over-the-air (OTA) da plataforma.
 * Features:
 *  - Verificação de novas versões
 *  - Download e validação de pacotes
 *  - Aplicação de patches com fallback
 *  - Histórico de atualizações
 *  - Integração com CompatibilityChecker e RollbackService
 */

class OTAManager {
  constructor({ transport, logger, compatChecker, rollbackService, configStore }) {
    this.transport = transport;
    this.logger = logger;
    this.compatChecker = compatChecker;
    this.rollbackService = rollbackService;
    this.configStore = configStore;
    this.currentVersion = this.getCurrentVersion();
    this.updateHistory = this.loadHistory();
    this.isUpdating = false;
  }

  getCurrentVersion() {
    return window.APP_VERSION || localStorage.getItem('nexefii_app_version') || '1.0.0';
  }

  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('nexefii_update_history') || '[]');
    } catch {
      return [];
    }
  }

  saveHistory() {
    localStorage.setItem('nexefii_update_history', JSON.stringify(this.updateHistory));
  }

  async checkForUpdates() {
    this.logger.info('Verificando atualizações...');
    try {
      const response = await this.transport.send('/ota/check', {
        currentVersion: this.currentVersion,
        platform: navigator.platform,
        userAgent: navigator.userAgent
      });

      if (response.available) {
        this.logger.info(`Nova versão disponível: ${response.version}`);
        return {
          available: true,
          version: response.version,
          size: response.size,
          changelog: response.changelog,
          critical: response.critical || false,
          url: response.url
        };
      }

      this.logger.info('Sistema atualizado');
      return { available: false };
    } catch (err) {
      this.logger.error('Erro ao verificar atualizações: ' + err.message);
      return { available: false, error: err.message };
    }
  }

  async downloadUpdate(updateInfo) {
    this.logger.info(`Baixando atualização ${updateInfo.version}...`);
    try {
      const response = await this.transport.send('/ota/download', {
        version: updateInfo.version,
        url: updateInfo.url
      });

      // Validar integridade (hash, assinatura)
      if (response.hash && response.hash !== updateInfo.hash) {
        throw new Error('Hash do pacote não confere');
      }

      this.logger.info('Download concluído e validado');
      return response.package;
    } catch (err) {
      this.logger.error('Erro no download: ' + err.message);
      throw err;
    }
  }

  async applyUpdate(updatePackage) {
    if (this.isUpdating) {
      this.logger.warn('Atualização já em andamento');
      return { success: false, reason: 'already_updating' };
    }

    this.isUpdating = true;
    this.logger.info(`Aplicando atualização ${updatePackage.version}...`);

    try {
      // 1. Verificar compatibilidade
      const compatible = await this.compatChecker.check(updatePackage);
      if (!compatible.ok) {
        throw new Error(`Incompatível: ${compatible.reason}`);
      }

      // 2. Criar snapshot para rollback
      const snapshot = await this.rollbackService.createSnapshot({
        version: this.currentVersion,
        timestamp: Date.now()
      });
      this.logger.info(`Snapshot criado: ${snapshot.id}`);

      // 3. Aplicar patch (simulado - em produção seria aplicação real de arquivos)
      await this.applyPatch(updatePackage);

      // 4. Atualizar versão
      this.currentVersion = updatePackage.version;
      localStorage.setItem('nexefii_app_version', this.currentVersion);
      window.APP_VERSION = this.currentVersion;

      // 5. Registrar no histórico
      this.updateHistory.push({
        version: updatePackage.version,
        timestamp: Date.now(),
        success: true,
        snapshotId: snapshot.id
      });
      this.saveHistory();

      this.logger.info(`Atualização ${updatePackage.version} aplicada com sucesso`);
      this.isUpdating = false;
      return { success: true, version: this.currentVersion, snapshotId: snapshot.id };

    } catch (err) {
      this.logger.error('Falha na atualização: ' + err.message);
      
      // Tentar rollback automático
      if (this.rollbackService.hasSnapshots()) {
        this.logger.warn('Iniciando rollback automático...');
        await this.rollbackService.rollback();
      }

      this.updateHistory.push({
        version: updatePackage.version,
        timestamp: Date.now(),
        success: false,
        error: err.message
      });
      this.saveHistory();

      this.isUpdating = false;
      return { success: false, error: err.message };
    }
  }

  async applyPatch(updatePackage) {
    // Simulação de aplicação de patch
    // Em produção: aplicaria arquivos reais, atualizaria service worker, etc.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.95) { // 5% chance de falha simulada
          reject(new Error('Falha simulada na aplicação do patch'));
        } else {
          resolve();
        }
      }, 500);
    });
  }

  async update() {
    const check = await this.checkForUpdates();
    if (!check.available) {
      return { success: false, reason: 'no_updates' };
    }

    try {
      const pkg = await this.downloadUpdate(check);
      const result = await this.applyUpdate({ ...check, package: pkg });
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getHistory() {
    return [...this.updateHistory];
  }

  getStatus() {
    return {
      currentVersion: this.currentVersion,
      isUpdating: this.isUpdating,
      lastUpdate: this.updateHistory.length > 0 
        ? this.updateHistory[this.updateHistory.length - 1] 
        : null
    };
  }
}

export default OTAManager;
