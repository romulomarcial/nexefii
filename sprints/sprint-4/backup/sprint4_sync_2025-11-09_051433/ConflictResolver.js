/*
 * Nexefii ConflictResolver
 * Resolve conflitos de sincronização com estratégia automática (last-write-wins)
 * e opção de intervenção manual via callback.
 */

class ConflictResolver {
  constructor({ logger, manualHandler } = {}) {
    this.logger = logger || { info:()=>{}, warn:()=>{}, error:()=>{} };
    this.manualHandler = manualHandler; // async (conflict) => { action, payload }
  }

  // conflict: { id, local, remote, meta }
  async resolve(conflict) {
    try {
      // Estratégia automática: last-write-wins por timestamp
      const lt = conflict?.local?.updatedAt || 0;
      const rt = conflict?.remote?.updatedAt || 0;

      if (rt > lt) {
        // Aplicar remoto
        return { action: 'apply', payload: { id: conflict.id, source: 'remote', record: conflict.remote } };
      } else if (lt > rt) {
        // Aplicar local
        return { action: 'apply', payload: { id: conflict.id, source: 'local', record: conflict.local } };
      }

      // Empate: se existir handler manual, delega
      if (typeof this.manualHandler === 'function') {
        this.logger.warn('Conflito empatado, solicitando resolução manual id=' + conflict.id);
        const manual = await this.manualHandler(conflict);
        if (manual) return manual;
      }

      // Padrão seguro: não aplicar
      this.logger.warn('Conflito sem resolução. Skip id=' + conflict.id);
      return { action: 'skip' };
    } catch (err) {
      this.logger.error('Erro ao resolver conflito: ' + err.message);
      return { action: 'skip' };
    }
  }
}

export default ConflictResolver;
