# 📸 QA Baseline - Captura Simplificada (Opção B)

**Tempo estimado:** 30 minutos  
**Screenshots:** 12 principais telas  
**Objetivo:** Capturar estado visual crítico antes da refatoração

---

## 🎯 Como Capturar Screenshots

### Método: Windows Snipping Tool
1. Pressione: **Win + Shift + S**
2. Selecione a área (capture a janela inteira do navegador)
3. Clique no toast que aparece no canto
4. Clique em "Salvar como"
5. Salve em: `R:\Development\Projects\iluxsys\qa-baseline\2025-11-08\screenshots\`

---

## 📸 Screenshots Essenciais (12 total)

### 1️⃣ Dashboard
**Arquivo:** `01-dashboard.png`
- Tab "Dashboard" ativa
- Estatísticas visíveis
- Ações rápidas
- Métricas enterprise

### 2️⃣ Backup & Restore - Principal
**Arquivo:** `02-backup-restore.png`
- Tab "Backup & Restore" ativa
- Formulário de backup
- Opções (Completo/Incremental/Seletivo)
- Lista de backups abaixo

### 3️⃣ Property Backups - Principal
**Arquivo:** `03-property-backups.png`
- Tab "Property Backups" ativa
- Métricas por propriedade
- Formulário de criação
- Catálogo de backups

### 4️⃣ General Structure - Principal
**Arquivo:** `04-general-structure.png`
- Tab "General Structure" ativa
- Checkboxes de componentes
- Campo de versão/descrição
- Lista de backups de estrutura

### 5️⃣ Releases & Rollback
**Arquivo:** `05-releases.png`
- Tab "Releases & Rollback" ativa
- Timeline/histórico de releases
- Formulário de criação

### 6️⃣ Gestão de Usuários - Lista
**Arquivo:** `06-users-list.png`
- Tab "Gestão de Usuários" ativa
- Tabela com todos os usuários
- Filtros de status/role
- Botão "Criar Novo Usuário"

### 7️⃣ Gestão de Usuários - Editar
**Arquivo:** `07-users-edit.png`
- Modal de edição de usuário aberto
- Formulário preenchido
- **IMPORTANTE:** Select de properties (multiple) visível
- Mostrar que properties são selecionadas corretamente

### 8️⃣ Logs & Auditoria
**Arquivo:** `08-logs.png`
- Tab "Logs & Auditoria" ativa
- Filtros avançados visíveis
- Tabela de logs
- Alguns logs expandidos

### 9️⃣ Configurações
**Arquivo:** `09-settings.png`
- Tab "Configurações" ativa
- Todas as seções visíveis
- Feature toggles (compress/encrypt)

### 🔟 Manutenção
**Arquivo:** `10-maintenance.png`
- Tab "Manutenção" ativa
- Botões de manutenção
- Storage monitor com gráfico

### 1️⃣1️⃣ Property Test Generator
**Arquivo:** `11-property-test.png`
- Página de teste de propriedade
- Informações da propriedade
- **Módulos listados corretamente** (modulesPurchased)
- Botões: "Fechar", "Aprovar", "🌐 Abrir Index"

### 1️⃣2️⃣ Modal de Confirmação (Qualquer)
**Arquivo:** `12-modal-confirm.png`
- Qualquer modal de confirmação aberto
- Exemplo: Confirmar exclusão, confirmar restauração, etc.
- Mostra overlay e modal centralizado

---

## ✅ Checklist de Captura

Marque conforme captura:

- [ ] `01-dashboard.png`
- [ ] `02-backup-restore.png`
- [ ] `03-property-backups.png`
- [ ] `04-general-structure.png`
- [ ] `05-releases.png`
- [ ] `06-users-list.png`
- [ ] `07-users-edit.png`
- [ ] `08-logs.png`
- [ ] `09-settings.png`
- [ ] `10-maintenance.png`
- [ ] `11-property-test.png`
- [ ] `12-modal-confirm.png`

---

## 🎯 Pontos Críticos para Validar

### Screenshot 07 - Users Edit (CRÍTICO):
✅ **Validar que select de properties mostra múltiplas opções**
✅ **Validar que apenas properties selecionadas ficam marcadas** (BUG CORRIGIDO)

### Screenshot 11 - Property Test (CRÍTICO):
✅ **Validar que módulos aparecem corretamente** (BUG CORRIGIDO - modulesPurchased)
✅ **Validar botão verde "🌐 Abrir Index"** (FEATURE NOVA)

---

## 📁 Após Capturar Todos

Verifique que tem os 12 arquivos:

```powershell
dir qa-baseline\2025-11-08\screenshots\*.png
```

Deve listar 12 arquivos.

---

**Pronto! Essa captura simplificada é suficiente para validar as correções principais e o estado visual do sistema.**
