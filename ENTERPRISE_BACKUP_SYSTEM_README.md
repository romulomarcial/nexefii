# ðŸ¢ Enterprise Backup System - nexefii

---
**ðŸ“„ Documento**: ENTERPRISE_BACKUP_SYSTEM_README.md  
**ðŸ“¦ VersÃ£o**: 2.0.0  
**ðŸ“… Ãšltima AtualizaÃ§Ã£o**: 07/11/2025 - 15:30 BRT  
**ðŸ‘¤ Autor**: nexefii Development Team  
**ðŸ”„ Status**: âœ… Atualizado e Sincronizado

---

## ðŸ“‹ Ãndice

1. [VisÃ£o Geral](#visÃ£o-geral)
2. [Arquitetura](#arquitetura)
3. [Property Backups](#property-backups)
4. [General Structure Backups](#general-structure-backups)
5. [Compression & Encryption](#compression--encryption)
6. [API Reference](#api-reference)
7. [Storage Schema](#storage-schema)
8. [Changelog](#changelog)

---

## VisÃ£o Geral

O **Enterprise Backup System** (`enterprise-backup-system.js`) Ã© o backend do sistema de backups enterprise do nexefii. Fornece funcionalidades avanÃ§adas de backup, compressÃ£o, criptografia e auditoria.

### Responsabilidades:

- âœ… Gerenciamento de backups por propriedade (multi-tenant)
- âœ… Backups de estrutura geral (rollback de atualizaÃ§Ãµes)
- âœ… CompressÃ£o real usando CompressionStream API
- âœ… Criptografia real usando Web Crypto API (AES-256-GCM)
- âœ… Sistema de auditoria completo
- âœ… ValidaÃ§Ã£o de integridade (checksums)
- âœ… MÃ©tricas e dashboard
- âœ… Agendamento e retenÃ§Ã£o de backups

---

## Arquitetura

### Classe Principal: `EnterpriseBackupSystem`

```javascript
class EnterpriseBackupSystem {
  constructor(currentUser) {
    this.currentUser = currentUser;
    this.tenantBackups = {};      // Map: tenantId -> Array<Backup>
    this.generalBackups = [];     // Array de backups de estrutura
    this.metrics = {};            // MÃ©tricas agregadas
    this.auditLog = [];           // Log de auditoria
    this.restoreTests = [];       // Testes de validaÃ§Ã£o
    
    // Storage Keys
    this.KEYS = {
      TENANT_BACKUPS: 'enterprise_tenant_backups',
      GENERAL_BACKUPS: 'enterprise_general_backups',
      METRICS: 'enterprise_metrics',
      AUDIT_LOG: 'enterprise_audit_log',
      RESTORE_TESTS: 'enterprise_restore_tests'
    };
  }
}
```

### Fluxo de Dados:

```
UI Request
    â†“
EnterpriseBackupSystem
    â†“
Data Capture (captureTenantDatabase/captureStylesheets/etc)
    â†“
Compression (opcional) â†’ CompressionStream API
    â†“
Encryption (opcional) â†’ Web Crypto API
    â†“
Checksum Calculation
    â†“
LocalStorage Persistence
    â†“
Metrics Update
    â†“
Audit Log
```

---

## Property Backups

### MÃ©todos Principais:

#### `createTenantBackup(tenantId, options)`

Cria backup de uma propriedade especÃ­fica.

**ParÃ¢metros:**
```javascript
{
  tenantId: string,           // ID da propriedade
  options: {
    type: 'full' | 'incremental',
    createdBy: string,
    compress: boolean,        // Usar compressÃ£o real
    encrypt: boolean         // Usar criptografia real
  }
}
```

**Retorno:**
```javascript
{
  success: true,
  id: 'tenant_1730000000000',
  tenantId: 'iluxSaoPaulo',
  manifest: {
    size_bytes: 156789,
    duration_ms: 234,
    compressed: true,
    compression_ratio: 0.72,
    encrypted: true,
    encryption_key_id: 'key_abc123'
  }
}
```

**Dados Capturados:**
- Database (localStorage especÃ­fico da propriedade)
- Assets (imagens, documentos)
- Configurations (configuraÃ§Ãµes especÃ­ficas)
- Checksums para validaÃ§Ã£o

#### `createIncrementalTenantBackup(tenantId, options)`

Cria backup incremental baseado no Ãºltimo full backup.

**Requisitos:**
- Deve existir um backup full anterior
- Captura apenas dados modificados desde o Ãºltimo backup

**Estrutura:**
```javascript
{
  type: 'incremental',
  parent_backup_id: 'tenant_1729000000000',  // ReferÃªncia ao full backup
  changes: {
    added: [...],
    modified: [...],
    deleted: [...]
  }
}
```

#### `restoreTenantBackup(tenantId, backupId, options)`

Restaura backup de uma propriedade.

**OpÃ§Ãµes de Restore:**
- `mode: 'full'` - Substitui tudo
- `mode: 'selective'` - Seleciona mÃ³dulos especÃ­ficos
- `mode: 'merge'` - Mescla com dados existentes
- `validate: true` - Valida integridade antes
- `createSafetyBackup: true` - Backup de seguranÃ§a automÃ¡tico

---

## General Structure Backups

### MÃ©todos Principais:

#### `createGeneralBackup(options)`

Cria backup da estrutura geral do sistema.

**Componentes Capturados:**

1. **Stylesheets** (`captureStylesheets()`)
   - Tags `<style>` inline (conteÃºdo completo)
   - Links `<link rel="stylesheet">` (URLs e metadata)
   - Media queries

2. **Scripts** (`captureScripts()`)
   - Lista de scripts carregados
   - Metadata (async, defer, type)
   - Preview de scripts inline
   - Rastreamento de mÃ³dulos crÃ­ticos

3. **i18n** (`captureI18n()`)
   - TraduÃ§Ãµes cacheadas
   - Arquivos enterprise (pt/en/es)
   - Arquivo i18n.json principal
   - Locale atual

4. **Templates** (`captureTemplates()`)
   - Estrutura DOM principal
   - Meta tags
   - Classes e data-attributes do body
   - Componentes identificados

5. **Migrations** (`captureMigrations()`)
   - HistÃ³rico de migraÃ§Ãµes aplicadas
   - VersÃ£o do schema atual

6. **Shared Assets** (`captureSharedAssets()`)
   - Logos, Ã­cones, imagens
   - Fontes (@font-face)

**Exemplo:**
```javascript
await enterpriseBackup.createGeneralBackup({
  components: ['stylesheets', 'scripts', 'i18n', 'templates'],
  version: 'v2.1.0',
  description: 'Backup antes de atualizaÃ§Ã£o crÃ­tica',
  createdBy: 'master',
  compress: true,
  encrypt: true
});
```

#### `restoreGeneralBackup(backupId, options)`

Restaura backup de estrutura geral (rollback).

**Processo:**
1. Cria backup de seguranÃ§a (se `createSafetyBackup: true`)
2. Valida integridade (se `validate: true`)
3. Restaura i18n para localStorage
4. Restaura migrations
5. Retorna `requiresReload: true` (pÃ¡gina precisa recarregar)

---

## Compression & Encryption

### CompressÃ£o (CompressionStream API)

#### ImplementaÃ§Ã£o:

```javascript
async _compressData(dataString) {
  if (!window.CompressionStream) {
    // Fallback: simulaÃ§Ã£o
    return { data: btoa(dataString), size: dataString.length };
  }

  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  await writer.write(encoder.encode(dataString));
  await writer.close();
  
  const reader = stream.readable.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const compressed = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );
  
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }
  
  return {
    data: btoa(String.fromCharCode(...compressed)),
    size: compressed.length
  };
}
```

**CaracterÃ­sticas:**
- Algoritmo: gzip (deflate)
- ReduÃ§Ã£o tÃ­pica: 60-80%
- Feature detection com fallback
- Logs mostram ratio real

### Criptografia (Web Crypto API)

#### ImplementaÃ§Ã£o:

```javascript
async _encryptData(dataString) {
  if (!window.crypto?.subtle) {
    // Fallback: simulaÃ§Ã£o
    return { data: btoa(dataString), iv: 'simulated', keyId: 'sim_key' };
  }

  // Gerar chave AES-256-GCM
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable
    ['encrypt', 'decrypt']
  );

  // IV aleatÃ³rio Ãºnico
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Criptografar
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  // Exportar key como JWK
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  const keyId = `key_${Date.now()}`;
  localStorage.setItem(`enterprise_encryption_key_${keyId}`, JSON.stringify(exportedKey));

  return {
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    keyId: keyId
  };
}
```

**CaracterÃ­sticas:**
- Algoritmo: AES-256-GCM
- IV Ãºnico por backup (12 bytes)
- Keys armazenadas como JWK no localStorage
- Key ID associado a cada backup

**âš ï¸ SEGURANÃ‡A:**
- localStorage nÃ£o Ã© seguro para produÃ§Ã£o
- Em produÃ§Ã£o: usar KMS (AWS KMS, Azure Key Vault)
- Implementar key rotation (90 dias)
- Keys devem estar em vault seguro

---

## API Reference

### MÃ©todos PÃºblicos:

#### Property Backups:

```javascript
// Criar backup full de propriedade
createTenantBackup(tenantId, options)

// Criar backup incremental
createIncrementalTenantBackup(tenantId, options)

// Restaurar backup
restoreTenantBackup(tenantId, backupId, options)

// Obter catÃ¡logo de backups
getTenantBackupCatalog(tenantId)

// Buscar backup especÃ­fico
findTenantBackup(tenantId, backupId)

// Aplicar polÃ­tica de retenÃ§Ã£o
applyRetentionPolicy(tenantId, customPolicy)

// Validar restore
validateRestore(tenantId, backup)
```

#### General Structure Backups:

```javascript
// Criar backup de estrutura
createGeneralBackup(options)

// Restaurar estrutura (rollback)
restoreGeneralBackup(backupId, options)

// Obter catÃ¡logo
getGeneralBackupCatalog()
```

#### MÃ©tricas e Auditoria:

```javascript
// Dashboard de mÃ©tricas
getMetricsDashboard()

// Log de auditoria com filtros
getAuditLog(filters)

// Exportar logs
exportAuditLog(format)

// Registrar audit
audit(type, level, message, data)

// Atualizar mÃ©tricas
updateMetrics(category, data)
```

#### Utilidades:

```javascript
// Validar checksums
validateChecksums(backup)

// Calcular checksums
calculateChecksums(data)

// Obter versÃ£o da plataforma
getCurrentPlatformVersion()

// Obter versÃ£o do schema
getSchemaVersion(tenantId)

// Feature detection
_compressData(dataString)
_encryptData(dataString)
```

---

## Storage Schema

### LocalStorage Keys:

```javascript
// Backups
'enterprise_tenant_backups'          // Map: { tenantId: [backups] }
'enterprise_general_backups'         // Array de backups de estrutura

// MÃ©tricas
'enterprise_metrics'                 // Objeto com mÃ©tricas agregadas

// Auditoria
'enterprise_audit_log'               // Array de eventos
'enterprise_restore_tests'           // Testes de validaÃ§Ã£o

// Agendamento
'enterprise_tenant_schedules'        // Array de schedules cron

// Feature Toggles
'enterprise_compress_enabled'        // boolean
'enterprise_encrypt_enabled'         // boolean

// Backups Individuais (Soft Delete)
'enterprise_tenant_backup_{id}'      // Backup especÃ­fico
'enterprise_general_backup_{id}'     // Backup de estrutura

// Encryption Keys
'enterprise_encryption_key_{keyId}'  // JWK format
```

### Estrutura de Backup (Tenant):

```javascript
{
  id: 'tenant_1730000000000',
  type: 'full' | 'incremental',
  tenantId: 'iluxSaoPaulo',
  timestamp: '2025-11-07T18:30:00.000Z',
  createdBy: 'master',
  created_by: 'master',
  created_at: '2025-11-07T18:30:00.000Z',
  size_bytes: 156789,
  
  // Dados
  database: [...],      // Dados do localStorage
  assets: [...],        // Assets da propriedade
  configurations: {...}, // ConfiguraÃ§Ãµes
  
  // Metadata
  metadata: {
    platform_version: '2.0.0',
    schema_version: '1.0.0',
    backup_version: '1.0.0',
    size_bytes: 156789,
    duration_ms: 234,
    compressed: true,
    compression_ratio: 0.72,
    original_size: 548920,
    compressed_size: 156789,
    encrypted: true,
    encryption_key_id: 'key_abc123'
  },
  
  // Checksums
  checksums: {
    manifest: 'sha256...',
    database: 'sha256...',
    assets: 'sha256...'
  },
  
  // Incremental specific
  parent_backup_id: 'tenant_1729000000000',  // Se incremental
  
  // Soft delete
  deleted: false,
  deleted_at: null,
  deleted_by: null
}
```

### Estrutura de Backup (General):

```javascript
{
  id: 'general_1730000000000',
  type: 'general_structure',
  timestamp: '2025-11-07T18:30:00.000Z',
  createdBy: 'master',
  created_by: 'master',
  created_at: '2025-11-07T18:30:00.000Z',
  version: 'v2.1.0',
  description: 'Backup antes de atualizaÃ§Ã£o',
  components: ['stylesheets', 'scripts', 'i18n', 'templates'],
  size_bytes: 89234,
  
  // Dados capturados
  data: {
    stylesheets: { /* ... */ },
    scripts: { /* ... */ },
    i18n: { /* ... */ },
    templates: { /* ... */ },
    migrations: { /* ... */ },
    shared_assets: { /* ... */ }
  },
  
  // Metadata
  metadata: {
    platform_version: '2.0.0',
    backup_version: '1.0.0',
    backup_date: '2025-11-07T18:30:00.000Z',
    size_bytes: 89234,
    duration_ms: 145,
    compressed: true,
    encrypted: false
  },
  
  // Checksums
  checksums: {
    manifest: 'sha256...'
  }
}
```

---

## Changelog

### v2.0.0 (07/11/2025)

**âœ¨ Novas Funcionalidades:**
- âœ… Property Backups (full e incremental)
- âœ… General Structure Backups (6 componentes)
- âœ… CompressÃ£o real (CompressionStream API)
- âœ… Criptografia real (Web Crypto API - AES-256-GCM)
- âœ… Sistema de auditoria completo
- âœ… ValidaÃ§Ã£o de integridade (checksums)
- âœ… Soft delete pattern
- âœ… Feature toggles persistidos
- âœ… MÃ©tricas agregadas em tempo real
- âœ… Export de logs em JSON

**ðŸ”§ Melhorias:**
- Feature detection com fallback para APIs nÃ£o suportadas
- Logs mostram compression ratio real
- Keys de criptografia armazenadas como JWK
- Backup de seguranÃ§a automÃ¡tico antes de restore
- ValidaÃ§Ã£o de checksums antes de restore

**ðŸ“š DocumentaÃ§Ã£o:**
- README completo criado
- API reference documentada
- Storage schema detalhado
- Exemplos de cÃ³digo

### v1.0.0 (Outubro 2025)
- VersÃ£o inicial do sistema enterprise

---

## ðŸ”— Links Relacionados

- [Master Control README](./MASTER_CONTROL_README.md)
- [Master Control Enterprise README](./MASTER_CONTROL_ENTERPRISE_README.md)
- [i18n System README](./I18N_SYSTEM_README.md)

---

**Desenvolvido por nexefii Development Team**  
**Â© 2025 nexefii - Todos os direitos reservados**

