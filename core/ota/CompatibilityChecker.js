/*
 * Nexefii CompatibilityChecker
 * Valida compatibilidade de atualizações com versão/schema atual.
 * Previne atualizações que quebrem o sistema.
 */

class CompatibilityChecker {
  constructor({ logger, schemaStore }) {
    this.logger = logger;
    this.schemaStore = schemaStore; // Acesso ao schema atual do DB
    this.rules = this.loadRules();
  }

  loadRules() {
    // Regras de compatibilidade (podem ser carregadas dinamicamente)
    return {
      minVersion: '0.9.0', // Versão mínima suportada
      breakingChanges: {
        '2.0.0': 'Migração de schema necessária',
        '3.0.0': 'Requer reconfiguração completa'
      },
      schemaVersions: {
        '1.0.0': 1,
        '1.1.0': 2,
        '2.0.0': 3
      }
    };
  }

  async check(updatePackage) {
    this.logger.info(`Verificando compatibilidade para ${updatePackage.version}`);

    try {
      // 1. Verificar versão mínima
      if (!this.meetsMinVersion(updatePackage.version)) {
        return { 
          ok: false, 
          reason: `Versão ${updatePackage.version} abaixo da mínima (${this.rules.minVersion})` 
        };
      }

      // 2. Verificar breaking changes
      const breaking = this.rules.breakingChanges[updatePackage.version];
      if (breaking && !updatePackage.forceApply) {
        this.logger.warn(`Breaking change detectado: ${breaking}`);
        return { 
          ok: false, 
          reason: breaking,
          requiresManualAction: true 
        };
      }

      // 3. Verificar compatibilidade de schema
      const currentSchema = this.schemaStore.getVersion();
      const targetSchema = this.rules.schemaVersions[updatePackage.version];
      
      if (targetSchema && targetSchema < currentSchema) {
        return { 
          ok: false, 
          reason: 'Downgrade de schema não suportado' 
        };
      }

      // 4. Verificar dependências
      if (updatePackage.dependencies) {
        const depsOk = await this.checkDependencies(updatePackage.dependencies);
        if (!depsOk.ok) {
          return depsOk;
        }
      }

      // 5. Verificar espaço disponível (simulado)
      const hasSpace = await this.checkStorage(updatePackage.size);
      if (!hasSpace) {
        return { 
          ok: false, 
          reason: 'Espaço insuficiente no storage' 
        };
      }

      this.logger.info('Compatibilidade verificada com sucesso');
      return { ok: true };

    } catch (err) {
      this.logger.error('Erro na verificação: ' + err.message);
      return { ok: false, reason: err.message };
    }
  }

  meetsMinVersion(targetVersion) {
    return this.compareVersions(targetVersion, this.rules.minVersion) >= 0;
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  async checkDependencies(deps) {
    // Verificação simplificada - em produção verificaria módulos reais
    for (const [name, version] of Object.entries(deps)) {
      this.logger.debug(`Verificando dependência: ${name}@${version}`);
    }
    return { ok: true };
  }

  async checkStorage(requiredBytes) {
    // Estimativa de storage disponível
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota || 0) - (estimate.usage || 0);
      return available > requiredBytes;
    }
    return true; // Assume disponível se API não existir
  }
}

export default CompatibilityChecker;
