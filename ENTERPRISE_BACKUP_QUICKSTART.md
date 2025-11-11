# Guia Rápido - Enterprise Backup System

## 🚀 Quick Start

### 1. Inicialização

```javascript
// O sistema já é inicializado automaticamente no Master Control
// Acesse via:
const eb = window.enterpriseBackupSystem;
const rm = window.releaseManagement;
```

### 2. Operações Comuns

#### Backup Rápido de um Cliente

```javascript
// Backup completo
await eb.createTenantBackup('property1', { type: 'full' });

// Backup incremental
await eb.createIncrementalTenantBackup('property1');
```

#### Restaurar um Cliente

```javascript
// Listar backups disponíveis
const backups = eb.getTenantBackupCatalog('property1');

// Restaurar (com validação)
await eb.restoreTenantBackup('property1', backups[0].id, {
  mode: 'full',
  validate: true
});
```

#### Deploy de Nova Versão

```javascript
// 1. Criar release
const release = await rm.createRelease({
  version: '2.6.0',
  name: 'November Update',
  channel: 'prod',
  changelog: ['New features', 'Bug fixes']
});

// 2. Deploy (com backup automático)
await rm.deployRelease(release.id);
```

#### Rollback de Emergência

```javascript
// Rollback para versão anterior
const previousRelease = rm.getReleaseHistory()[1]; // Segunda mais recente
await rm.rollbackRelease(previousRelease.id, {
  maintenanceMode: true
});
```

## 📋 Checklist de Operações

### Antes de um Deploy

- [ ] Criar release com changelog completo
- [ ] Validar migrations (forward/backward)
- [ ] Gerar plano de rollback
- [ ] Notificar equipe
- [ ] Backup de segurança criado automaticamente ✅

### Durante um Problema

- [ ] Verificar logs de audit
- [ ] Checar métricas e falhas recentes
- [ ] Avaliar necessidade de rollback
- [ ] Se crítico: executar rollback imediato
- [ ] Documentar incidente

### Após um Rollback

- [ ] Validar sistema está operacional
- [ ] Verificar checksums e integridade
- [ ] Exportar logs para análise
- [ ] Revisar causa raiz
- [ ] Atualizar runbook se necessário

## 🔍 Troubleshooting

### Backup Falhando

```javascript
// Verificar métricas
const metrics = eb.getMetricsDashboard();
console.log('Failed backups:', metrics.tenant_backups.failed_count);

// Ver últimas falhas no audit log
const failures = eb.getAuditLog({
  type: 'tenant_backup',
  level: 'error'
});
console.log('Recent failures:', failures.slice(0, 5));

// Tentar backup manual com mais detalhes
try {
  await eb.createTenantBackup('property1', { type: 'full' });
} catch (error) {
  console.error('Detailed error:', error);
}
```

### Restore Não Completa

```javascript
// Verificar integridade do backup
const backup = eb.findTenantBackup('property1', 'backup_id');
const valid = eb.verifyBackupIntegrity(backup);
console.log('Backup integrity:', valid);

// Tentar restore seletivo primeiro
await eb.restoreTenantBackup('property1', 'backup_id', {
  mode: 'selective',
  modules: ['users'] // Restaurar apenas usuários
});
```

### Deploy Falhando em Pré-checks

```javascript
// Ver detalhes dos checks
const release = rm.findRelease('release_id');
const checks = await rm.runPreDeploymentChecks(release);
console.log('Failed checks:', checks);

// Corrigir problemas e tentar novamente
await rm.deployRelease('release_id');
```

## 📊 Monitoramento

### Dashboard de Saúde

```javascript
// Métricas gerais
const metrics = eb.getMetricsDashboard();

console.log(`
Tenant Backups:
- Total: ${metrics.tenant_backups.total_count}
- Última 24h: ${metrics.tenant_backups.last_24h}
- Taxa de falha: ${(metrics.tenant_backups.failed_count / metrics.tenant_backups.total_count * 100).toFixed(2)}%
- Tempo médio: ${(metrics.tenant_backups.avg_duration_ms / 1000).toFixed(1)}s
- Tamanho médio: ${(metrics.tenant_backups.avg_size_bytes / 1024 / 1024).toFixed(2)} MB

Restores:
- Total: ${metrics.restores.total_count}
- Taxa de sucesso: ${(metrics.restores.success_count / metrics.restores.total_count * 100).toFixed(2)}%
- TTR médio: ${(metrics.restores.avg_ttr_ms / 1000).toFixed(1)}s

Releases:
- Versão ativa: ${metrics.releases.active_version}
- Total de rollbacks: ${metrics.releases.rollback_count}
`);
```

### Alertas Recomendados

Configurar alertas para:

1. **Taxa de falha > 5%** em backups
2. **TTR > 30 minutos** em restores
3. **Rollback executado** (sempre crítico)
4. **Espaço de storage > 80%**
5. **Backup não executado em 48h** para tenant crítico

## 🔐 Segurança

### Verificar Permissões

```javascript
// Apenas Master pode acessar
if (!eb.currentUser || eb.currentUser.role !== 'master') {
  console.error('Acesso negado - Master role necessário');
}
```

### Export de Audit Logs

```javascript
// JSON (para SIEM)
const jsonLogs = eb.exportAuditLog('json');
// Enviar para SIEM ou salvar localmente

// CSV (para análise em Excel)
const csvLogs = eb.exportAuditLog('csv');
// Download via browser ou enviar para storage
```

### Rotação de Backups Antigos

```javascript
// Aplicar política de retenção manualmente
await eb.applyRetentionPolicy('property1');

// Verificar backups restantes
const catalog = eb.getTenantBackupCatalog('property1');
console.log(`Backups após retenção: ${catalog.length}`);
```

## 📞 Suporte

### Informações para Suporte

Ao abrir ticket, incluir:

```javascript
// 1. Métricas gerais
const metrics = eb.getMetricsDashboard();

// 2. Últimos logs de audit
const recentLogs = eb.getAuditLog({ 
  startDate: new Date(Date.now() - 24*60*60*1000) // Últimas 24h
});

// 3. Release ativo
const activeRelease = rm.getActiveRelease();

// 4. Histórico de deployments
const deployHistory = rm.getDeploymentHistory(10);

// Exportar tudo
const supportPackage = {
  timestamp: new Date().toISOString(),
  metrics,
  recent_logs: recentLogs.slice(0, 100),
  active_release: activeRelease,
  deploy_history: deployHistory,
  browser: navigator.userAgent,
  storage_usage: eb.calculateStorageUsage()
};

console.log(JSON.stringify(supportPackage, null, 2));
// Copiar e colar no ticket
```

## 🎯 Metas de Performance

### SLAs Internos

| Operação | Meta | Atual |
|----------|------|-------|
| Backup incremental | < 5s | Ver métricas |
| Backup completo | < 30s | Ver métricas |
| Restore completo | < 30min | Ver métricas |
| Rollback | < 15min | Ver métricas |

### Como Verificar

```javascript
const m = eb.getMetricsDashboard();

console.log(`
Performance Atual:
- Backup: ${(m.tenant_backups.avg_duration_ms / 1000).toFixed(1)}s
- Restore: ${(m.restores.avg_ttr_ms / 60000).toFixed(1)}min
`);

// Se acima das metas, investigar:
const slowBackups = eb.getAuditLog({
  type: 'tenant_backup',
  // Filtrar por duration_ms > threshold
});
```

## 🔄 Manutenção Periódica

### Diária
- Verificar métricas de saúde
- Conferir backups executados
- Revisar logs de erro

### Semanal
- Exportar audit logs
- Testar restore de um tenant (rotativo)
- Verificar espaço de storage
- Revisar feature flags ativas

### Mensal
- Teste completo de DR
- Revisar políticas de retenção
- Atualizar documentação de runbooks
- Análise de tendências de performance

### Trimestral
- Teste de DR completo (site alternativo)
- Revisão de segurança
- Auditoria de acessos
- Treinamento da equipe

---

**Dúvidas?** Consulte o [README completo](./ENTERPRISE_BACKUP_README.md)
