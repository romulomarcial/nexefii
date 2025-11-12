# 🔍 LOG DE DIAGNÓSTICO - Revisão Completa iLux → Nexefii
**Data:** 2025-11-09
**Objetivo:** Eliminar todas as referências à marca iLux

---

## ARQUIVOS CRÍTICOS (afetam funcionalidade):
1. ✅ i18n.json - JÁ CORRIGIDO
2. ❌ index.html - Contém referências iLux Hotel
3. ❌ auth.js - ARQUIVO CORROMPIDO, contém IluxAuth
4. ❌ master-control.html - Placeholders e título
5. ❌ master-control.js - Múltiplas referências IluxProps, ilux_lang
6. ❌ master-control-enterprise.js - Referências IluxProps
7. ❌ test-properties.html - Referências IluxProps
8. ❌ property-local-test-generator.js - URLs iluxsys.com
9. ❌ property-publish-helpers.js - URLs e IluxProps
10. ❌ property-dashboard-manager.js - localStorage iluxsys_properties
11. ❌ demo-data-generator.js - Título e IluxProps
12. ❌ clear-cache.html - Título e chaves ilux_user, ilux_lang
13. ❌ qa-baseline-capture.js - Sistema IluxSys, chaves storage
14. ❌ test-property-dashboard.html - localStorage keys
15. ❌ migrate-storage.html - Subtítulo iLuxSys

## ARQUIVOS DE DOCUMENTAÇÃO (baixa prioridade):
- README.md, README_PWA.md, README_Shell.md
- MASTER_CONTROL_README.md
- PROPERTY_DASHBOARD_README.md
- DEMO_DATA_SYSTEM_README.md
- ARCHITECTURE_REFACTOR_PLAN.md
- MIGRATION_NEXEFII.md (ironicamente documenta a migração)
- QA_BASELINE_*.md
- core/database/README_PropertyDatabase.md
- core/router/README_Router.md
- core/wizard/README_Wizard.md
- bkp/README.md
- INDICE_DOCUMENTACAO_BACKUP.md

## ARQUIVOS DE CONFIGURAÇÃO:
- ❌ package.json - descrição iluxsys
- ❌ rebranding.py - Script de rebranding (contém OLD_NAME)
- ❌ server.js - Comentário com path iluxsys
- ❌ start-server.ps1 - Path iluxsys

## ARQUIVOS DE BACKUP/QA (não críticos mas devem ser corrigidos):
- qa-baseline/2025-11-08/VERSION.txt
- qa-baseline/2025-11-08/acceptance-criteria/CHECKLIST.md

---

## PRIORIDADES DE CORREÇÃO:
### 🔴 ALTA PRIORIDADE (Arquivos JS/HTML funcionais):
1. auth.js (CORROMPIDO - revisar estrutura)
2. master-control.js
3. master-control-enterprise.js  
4. index.html
5. master-control.html
6. property-dashboard-manager.js
7. demo-data-generator.js

### 🟡 MÉDIA PRIORIDADE (Arquivos de teste/utilitários):
8. test-properties.html
9. property-local-test-generator.js
10. property-publish-helpers.js
11. clear-cache.html
12. qa-baseline-capture.js
13. test-property-dashboard.html
14. migrate-storage.html

### 🟢 BAIXA PRIORIDADE (Documentação):
15. Todos os arquivos .md

---

## PADRÕES DE SUBSTITUIÇÃO NECESSÁRIOS:
```
iLux Hotel → Nexefii Hotel
iluxSaoPaulo → nexefiiSaoPaulo
iluxMiami → nexefiiMiami
iluxRioDeJaneiro → nexefiiRioDeJaneiro
IluxAuth → NexefiiAuth (NOTA: auth.js corrompido)
IluxProps → NexefiiProps
ilux_lang → nexefii_lang
ilux_user → nexefii_user
iluxsys_users → nexefii_users
iluxsys_session → nexefii_session
iluxsys_properties → nexefii_properties
iluxsys_email_log → nexefii_email_log
iluxsys.com → nexefii.com
admin@iluxsys.com → admin@nexefii.com
demo@iluxsys.com → demo@nexefii.com
master@iluxsys.com → master@nexefii.com
IluxSys → NEXEFII
iluxsys → nexefii
```

---

## PRÓXIMOS PASSOS:
1. Corrigir arquivos de ALTA prioridade
2. Testar funcionalidade após cada correção crítica
3. Corrigir arquivos de MÉDIA prioridade
4. Atualizar documentação (BAIXA prioridade)
5. Executar varredura final para confirmar 0 ocorrências
