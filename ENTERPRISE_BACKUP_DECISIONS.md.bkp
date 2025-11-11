# Enterprise Backup System - Decisões Técnicas

## 📋 Documento de Decisões de Arquitetura (ADR - Architecture Decision Records)

### ADR-001: Separação de Responsabilidades
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Sistema cresceu e precisa de backup/release management robusto  

**Decisão:**
- Criar classes separadas: `EnterpriseBackupSystem` e `ReleaseManagementSystem`
- Integração via `master-control-enterprise.js` sem modificar código legado
- Manter `master-control.js` focado em controle geral

**Consequências:**
- ✅ Código modular e testável
- ✅ Fácil manutenção
- ✅ Possível extrair para serviço separado no futuro
- ⚠️ Mais arquivos para gerenciar

---

### ADR-002: Multi-Tenant por PropertyId
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Sistema atende múltiplos clientes/propriedades isoladamente  

**Decisão:**
- Todas operações de backup incluem `tenantId` (propertyId)
- Backups de estrutura geral são independentes
- Restore pode ser por tenant ou geral

**Consequências:**
- ✅ Isolamento de dados entre clientes
- ✅ Backups independentes por propriedade
- ✅ Facilita migração para multi-tenant database no futuro
- ⚠️ Mais complexidade na gestão de backups

---

### ADR-003: LocalStorage como Storage Principal
**Data:** 2025-11-06  
**Status:** Temporário (migrar para backend no futuro)  
**Contexto:** Sistema atual usa LocalStorage, precisa de backup rápido  

**Decisão:**
- Usar LocalStorage com prefixo `enterprise_*`
- Estrutura de chaves: `enterprise_tenant_backup_{id}`, `enterprise_general_backup_{id}`, `enterprise_release_{id}`
- Preparar estrutura para migração futura (FileSystem API, S3, backend)

**Consequências:**
- ✅ Implementação rápida sem mudanças de infraestrutura
- ✅ Funciona imediatamente em browser
- ⚠️ Limitado a ~10MB por domínio
- ⚠️ Não sincroniza entre dispositivos
- ⚠️ Usuário pode limpar localStorage

**Plano de Migração:**
1. Fase 1: LocalStorage (atual)
2. Fase 2: IndexedDB (maior capacidade, ~1GB)
3. Fase 3: File System Access API (Chrome/Edge)
4. Fase 4: Backend REST API + S3/Azure Blob

---

### ADR-004: Checksums para Integridade
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Backups podem corromper, precisa validação  

**Decisão:**
- Calcular SHA-256 hash de todo payload de backup
- Armazenar checksum no manifesto
- Validar antes de restore (opcional mas recomendado)

**Consequências:**
- ✅ Detecta corrupção de dados
- ✅ Auditável (checksum imutável)
- ⚠️ Overhead de cálculo (~10-50ms para backups médios)

**Implementação:**
```javascript
// Simulado no frontend (async para não bloquear UI)
const checksum = await this.calculateChecksum(data);
// No backend, usar crypto.createHash('sha256')
```

---

### ADR-005: Soft Delete ao invés de Hard Delete
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Usuário pode excluir backup por engano  

**Decisão:**
- Backups "excluídos" recebem flag `deleted: true` e `deleted_at`
- Permanecem no storage por período de retenção
- UI não mostra deletados (filtro)
- Possível recuperar via console/API

**Consequências:**
- ✅ Recuperação de erros humanos
- ✅ Auditoria completa
- ⚠️ Ocupa espaço até cleanup
- ⚠️ Precisa de processo de limpeza periódica

---

### ADR-006: Restore com Safety Backup Automático
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Restore pode falhar e deixar sistema inconsistente  

**Decisão:**
- Antes de restore, criar backup de segurança automático
- Marcar como `type: 'safety'` com referência ao restore
- Manter por 7 dias mínimo
- Se restore falhar, auto-rollback para safety backup

**Consequências:**
- ✅ Zero downtime em caso de falha
- ✅ Usuário pode reverter manualmente
- ⚠️ Dobra uso de storage temporariamente

---

### ADR-007: Semantic Versioning para Releases
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Releases precisam de versionamento claro e compreensível  

**Decisão:**
- Usar SemVer: `MAJOR.MINOR.PATCH`
- MAJOR: breaking changes
- MINOR: novas features compatíveis
- PATCH: bug fixes
- Parser valida formato no frontend

**Consequências:**
- ✅ Padrão da indústria
- ✅ Fácil de entender
- ✅ Facilita gestão de dependências

**Exemplo:**
```
v2.5.3 → v2.6.0  (nova feature)
v2.6.0 → v3.0.0  (breaking change)
v3.0.0 → v3.0.1  (bug fix)
```

---

### ADR-008: Migrations Bidirecionais (Forward/Backward)
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Deploy pode precisar de mudanças de schema, rollback deve reverter  

**Decisão:**
- Cada release pode ter migrations: `{ id, type: 'forward'|'backward', sql }`
- Deploy executa forwards em ordem
- Rollback executa backwards em ordem reversa
- Migrations são idempotentes

**Consequências:**
- ✅ Rollback seguro com reversão de schema
- ✅ Zero downtime deployments
- ⚠️ Desenvolvedor precisa escrever ambas versões
- ⚠️ Backward pode falhar se dados incompatíveis

**Exemplo:**
```json
{
  "migrations": [
    {
      "id": "001_add_email_verified",
      "type": "forward",
      "sql": "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE"
    },
    {
      "id": "001_add_email_verified",
      "type": "backward",
      "sql": "ALTER TABLE users DROP COLUMN email_verified"
    }
  ]
}
```

---

### ADR-009: Feature Flags com Rollout Gradual
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Novas features precisam de testes progressivos  

**Decisão:**
- Feature flags com controle de percentage (0-100%)
- Targeting por tenant (clientes específicos)
- Persistência em localStorage (migrar para backend depois)
- API: `isFeatureEnabled(flagName, tenantId?)`

**Consequências:**
- ✅ Deploy sem risco (feature off por padrão)
- ✅ A/B testing
- ✅ Rollback instantâneo (toggle flag)
- ⚠️ Complexidade no código (if/else baseado em flags)

**Exemplo de Uso:**
```javascript
if (releaseManagement.isFeatureEnabled('new_dashboard', propertyId)) {
  renderNewDashboard();
} else {
  renderOldDashboard();
}
```

---

### ADR-010: Retention Policies Configuráveis
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Backups acumulam, precisa de limpeza automática  

**Decisão:**
- Políticas por tenant:
  - Diários: manter N dias (default: 7)
  - Semanais: manter N semanas (default: 4)
  - Mensais: manter N meses (default: 3)
  - Pre-deploy: manter N dias (default: 30)
- Job rodando a cada 6h verifica e limpa

**Consequências:**
- ✅ Storage gerenciável
- ✅ Backups históricos mantidos
- ✅ Compliance (GDPR, LGPD)
- ⚠️ Usuário pode perder backups antigos (documentar bem)

**Exemplo de Configuração:**
```json
{
  "propertyId": "hotel_sunset",
  "retention": {
    "daily": 7,    // 7 dias
    "weekly": 4,   // 4 semanas
    "monthly": 3   // 3 meses
  }
}
```

---

### ADR-011: Audit Log para Conformidade
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Operações críticas precisam rastreabilidade  

**Decisão:**
- Toda operação crítica loga: backup, restore, deploy, rollback
- Formato: `{ timestamp, type, level, operation, user, details, success }`
- Exportável em JSON e CSV
- Armazenado em `enterprise_audit_log` (array)

**Consequências:**
- ✅ Auditoria completa
- ✅ Troubleshooting facilitado
- ✅ Compliance (SOC2, ISO27001)
- ⚠️ Logs crescem indefinidamente (precisa rotação)

**Níveis de Log:**
- `info`: operações normais
- `warning`: operações com risco
- `error`: falhas
- `critical`: operações que afetam produção

---

### ADR-012: Modo de Manutenção durante Rollback
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Rollback pode deixar sistema temporariamente inconsistente  

**Decisão:**
- Rollback pode ativar modo de manutenção (checkbox, default: on)
- Exibe mensagem "Sistema em manutenção" para usuários finais
- Master continua com acesso
- Desativa automaticamente após sucesso

**Consequências:**
- ✅ Usuários não veem erros durante rollback
- ✅ Expectativa gerenciada (mensagem clara)
- ⚠️ Downtime visível (mas controlado)

---

### ADR-013: Wizard de 3 Passos para Restore
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Restore é operação complexa, usuário pode errar  

**Decisão:**
- Passo 1: Escolher modo (full/selective/merge)
- Passo 2: Confirmar ponto de restore
- Passo 3: Validar e executar
- Botões Next/Previous, Execute só no final

**Consequências:**
- ✅ UX guiada, reduz erros
- ✅ Validações em cada passo
- ✅ Usuário tem controle e visibilidade
- ⚠️ Mais cliques (mas vale a segurança)

---

### ADR-014: Cron-like Scheduling
**Data:** 2025-11-06  
**Status:** Aprovado  
**Contexto:** Backups precisam ser automáticos  

**Decisão:**
- Usar formato cron: `minuto hora dia mês dia-da-semana`
- Exemplos:
  - `0 2 * * *` → 2am diariamente
  - `0 3 * * 0` → 3am aos domingos
  - `0 1 1 * *` → 1am no dia 1 de cada mês
- Runner checa a cada 30 segundos (como scheduler de propriedades existente)

**Consequências:**
- ✅ Flexibilidade total
- ✅ Padrão conhecido por devs
- ⚠️ Curva de aprendizado para não-técnicos (UI com exemplos)

---

### ADR-015: SBOM (Software Bill of Materials) em Releases
**Data:** 2025-11-06  
**Status:** Preparado (implementar quando migrar para npm)  
**Contexto:** Rastreamento de dependências para segurança  

**Decisão:**
- Releases incluem SBOM com lista de arquivos e hashes
- Formato: `{ artifacts: [{ file, hash, size_bytes }] }`
- Facilita detecção de mudanças não autorizadas

**Consequências:**
- ✅ Segurança (detecção de tampering)
- ✅ Conformidade (SBOM requerido em muitas indústrias)
- ⚠️ Overhead de geração (mas automatizado)

---

## 🎯 SLOs (Service Level Objectives)

### Backup
- **RPO (Recovery Point Objective):** ≤ 24h (com incrementais diários)
- **Tempo de Backup Completo:** ≤ 30s (propriedade média)
- **Tempo de Backup Incremental:** ≤ 5s

### Restore
- **TTR (Time To Restore):** ≤ 30min (restore completo de tenant)
- **Taxa de Sucesso:** ≥ 99.5%

### Rollback
- **Tempo de Rollback:** ≤ 15min (incluindo migrations)
- **Taxa de Sucesso:** ≥ 99%

### Storage
- **Limite LocalStorage:** 8MB (deixar margem para 10MB)
- **Limpeza Automática:** a cada 6h

---

## 📊 Métricas Monitoradas

### Operacionais
- Total de backups criados
- Taxa de falha de backup
- Tempo médio de backup
- Tamanho médio de backup
- Total de restores executados
- Taxa de sucesso de restore
- TTR médio

### Releases
- Versão ativa
- Total de releases
- Total de deployments
- Total de rollbacks
- Feature flags ativas

### Storage
- Uso total de storage
- Storage por tenant
- Storage de estrutura geral
- Taxa de crescimento

---

## 🔒 Segurança

### Controle de Acesso
- **RBAC:** Apenas Master pode acessar enterprise backup
- **Validação:** Sempre verificar `currentUser.role === 'master'`

### Integridade
- **Checksums:** SHA-256 para todos os backups
- **Validação:** Antes de restore (opcional mas recomendado)

### Auditoria
- **Logs:** Todas operações críticas logadas
- **Rastreabilidade:** Quem, quando, o quê
- **Export:** JSON/CSV para análise externa

### Futuro (quando migrar para backend)
- **Encryption at rest:** AES-256
- **Encryption in transit:** HTTPS/TLS 1.3
- **Access tokens:** JWT com expiração
- **2FA:** Para operações críticas (deploy, rollback)

---

## 🚀 Roadmap de Melhorias

### Curto Prazo (1-3 meses)
- [ ] Migrar para IndexedDB (maior capacidade)
- [ ] Implementar runner de scheduled backups
- [ ] Adicionar compressão real (CompressionStream API)
- [ ] Adicionar criptografia básica (Web Crypto API)

### Médio Prazo (3-6 meses)
- [ ] Backend REST API para backups
- [ ] Storage em S3/Azure Blob
- [ ] SMTP alerts para falhas
- [ ] Dashboard de métricas real-time
- [ ] Testes automatizados de DR

### Longo Prazo (6-12 meses)
- [ ] Multi-region replication
- [ ] Point-in-time restore (PITR)
- [ ] Continuous backup (CDC - Change Data Capture)
- [ ] AI-powered anomaly detection
- [ ] Self-healing restore

---

## 📝 Lições Aprendidas

### Do Incidente que Motivou este Sistema
1. **Backup legado inadequado:** Sistema antigo não versionava estrutura geral
2. **Rollback manual propenso a erro:** Precisa automação
3. **Falta de validação:** Backups corrompidos descobertos tarde demais
4. **Sem audit trail:** Difícil entender o que foi feito

### Princípios Aplicados
1. **Defense in Depth:** Múltiplas camadas de proteção
2. **Fail-Safe:** Safety backups antes de restore
3. **Idempotência:** Operações podem ser repetidas sem efeitos colaterais
4. **Observabilidade:** Logs e métricas para tudo
5. **Progressive Rollout:** Feature flags para reduzir risco

---

**Última Atualização:** 2025-11-06  
**Responsável:** Master Control Team  
**Revisão:** Trimestral ou após incidentes
