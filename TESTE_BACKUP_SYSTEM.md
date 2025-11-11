# 🧪 Guia Rápido de Teste - Sistema de Backup

## ⚡ Teste Rápido (5 minutos)

### 1. Recarregar Página
```
Pressione: Ctrl + F5
```
Limpa cache e carrega novo BackupManager.

---

### 2. Abrir Console (F12)
Verificar mensagens de inicialização:
```
✅ Backup Manager initialized successfully!
✅ Backup Actions initialized
```

---

## 🎯 Testes por Seção

### Property Backups

#### Teste 1: Propriedades Carregam
1. Ir para aba **"Backups"** → **"Property Backups"**
2. Verificar: Dropdown com propriedades aparece
   - ✅ Deve mostrar propriedades do sistema
   - ✅ Dropdown não está vazio

**Se falhar:**
- [ ] Nenhuma propriedade aparece → Nenhum usuário cadastrado com propriedades
- [ ] Dropdown erro → Verificar console (F12)

---

#### Teste 2: Selecionar Local
1. Clicar em **"💻 Local"** (já ativo por padrão)
2. Clicar em **"☁️ Cloud"** → Button fica azul/ativo
3. Clicar em **"🔒 On-Premise"** → Button fica azul/ativo
4. Voltar para **"💻 Local"**

**Resultado esperado:**
- ✅ Botões mudam de cor (active/inactive)
- ✅ Local selecionado persiste no localStorage

---

#### Teste 3: Selecionar Propriedade
1. Dropdown: Selecionar qualquer propriedade
2. Verificar abaixo: Mensagem "Nenhum backup encontrado" aparece

**Resultado esperado:**
- ✅ Propriedade selecionada
- ✅ Lista de backups renderizada (vazia no início)

---

#### Teste 4: Criar Full Backup
1. **Propriedade selecionada?** Sim
2. **Local selecionado?** Sim (qualquer um)
3. Clicar em **"💾 Full Backup"**

**Resultado esperado:**
- ✅ Notificação azul: "Criando backup de propriedade..."
- ✅ Notificação verde: "✅ Backup criado: backup_propertyId_timestamp.json"
- ✅ Card de backup aparece na lista com:
  - Nome do arquivo
  - Tipo: "full" (badge azul)
  - Data
  - Tamanho
  - Local selecionado
  - 3 botões: Baixar, Restaurar, Deletar

**Se falhar:**
- [ ] Sem notificação → Verificar console (F12)
- [ ] Card não aparece → Verificar localStorage na F12

---

#### Teste 5: Criar Incremental Backup
1. Clicar em **"📦 Incremental"**

**Resultado esperado:**
- ✅ Novo card aparece com tipo "incremental" (badge verde)
- ✅ Notificação de sucesso

---

#### Teste 6: Baixar Backup
1. Card do backup → Clicar em **"⬇️ Baixar"**

**Resultado esperado:**
- ✅ Notificação verde: "✅ Backup baixado com sucesso"
- ✅ Arquivo JSON baixa automaticamente
- ✅ Arquivo: `backup_propertyId_timestamp.json`

**Verificar arquivo:**
```json
{
  "propertyId": "nome-propriedade",
  "type": "full",
  "timestamp": "2025-11-07T...",
  "data": {
    "reservations": [...],
    "inventory": [...],
    "configurations": [...]
  }
}
```

---

#### Teste 7: Deletar Backup
1. Card → Clicar em **"🗑️ Deletar"**
2. Confirmar na dialog: "Tem certeza?"

**Resultado esperado:**
- ✅ Dialog de confirmação aparece
- ✅ Após confirmar: Notificação verde "✅ Backup deletado"
- ✅ Card desaparece da lista

---

#### Teste 8: Restaurar Backup
1. Criar novo backup (Full)
2. Fazer alguma alteração no sistema
3. Card → Clicar em **"↩️ Restaurar"**
4. Confirmar na dialog

**Resultado esperado:**
- ✅ Dialog: "⚠️ Tem certeza que deseja restaurar?"
- ✅ Notificação azul: "Restaurando backup..."
- ✅ Notificação verde: "✅ Backup restaurado com sucesso! Recarregando..."
- ✅ Página recarrega em 1.5s
- ✅ Dados originais restaurados

---

### General Structure Backups

**Mesmo fluxo do Property Backups, mas:**

#### Teste 9: Seleção de Local
1. Ir para **"General Structure"**
2. Clicar em **"☁️ Cloud"** → Button ativo
3. Verificar: É separado do Property Backups

**Resultado esperado:**
- ✅ Botões independentes do Property Backups
- ✅ Local pode ser diferente

---

#### Teste 10: Criar Full Backup Geral
1. Clicar em **"💾 Full Backup"**

**Resultado esperado:**
- ✅ Notificação: "Criando backup de estrutura geral..."
- ✅ Notificação: "✅ Backup de estrutura criado: backup_general_timestamp.json"
- ✅ Card com tipo "full"
- ✅ Arquivo menor que Property Backup (sem dados de propriedades)

---

#### Teste 11: Criar Snapshot
1. Clicar em **"📸 Snapshot"**

**Resultado esperado:**
- ✅ Card com tipo "snapshot" (badge rosa)
- ✅ Arquivo salvo

---

#### Teste 12: Restaurar General Backup
1. Card → Clicar em **"↩️ Restaurar"**
2. Confirmar

**Resultado esperado:**
- ✅ Dialog de confirmação
- ✅ Notificação de restauração
- ✅ Página recarrega
- ✅ Dados gerais restaurados (usuários, etc)

---

## 📋 Checklist de Validação

### Property Backups
- [ ] Propriedades carregam do dropdown
- [ ] Local pode ser selecionado (Local/Cloud/On-Premise)
- [ ] Full Backup cria arquivo
- [ ] Incremental Backup cria arquivo
- [ ] Card exibe metadados corretos
- [ ] Botão "Baixar" funciona
- [ ] Botão "Restaurar" funciona
- [ ] Botão "Deletar" funciona
- [ ] Notificações aparecem corretas

### General Structure
- [ ] Seleção de local independente
- [ ] Full Backup funciona
- [ ] Snapshot funciona
- [ ] Restauração funciona
- [ ] Dados corretos persistem

### UI/UX
- [ ] Botões com cores apropriadas
- [ ] Cards bem formatados
- [ ] Notificações legíveis
- [ ] Sem erros no console (F12)
- [ ] Responsivo em diferentes tamanhos

---

## 🐛 Troubleshooting

### Problema: Dropdown vazio
**Causa:** Nenhuma propriedade cadastrada
**Solução:** Criar usuários com propriedades associadas

### Problema: Botões não respondem
**Verificar:**
1. Abrir F12 → Console
2. Procurar por erros em vermelho
3. Digitar: `console.log(typeof backupManager)` → Deve retornar `'object'`
4. Digitar: `console.log(backupManager.getPropertiesList())` → Deve retornar array

### Problema: Backup não salva
**Verificar:**
1. localStorage não cheio? F12 → Application → Local Storage → Buscar "backup_metadata"
2. Arquivo salvo? F12 → Application → Local Storage → Buscar "backup_file_"

### Problema: Notificações não aparecem
**Solução:** Verificar se há erro em `showNotification()` no console

---

## 🎉 Teste Completo

### Scenario: Backup e Restauração
```
1. Propriedade: "propriedade-1"
2. Local: "Local"
3. Tipo: "Full Backup"
4. ✅ Arquivo criado
5. ✅ Card aparece
6. ✅ Alteração no sistema
7. ✅ Restaurar backup
8. ✅ Dados volta ao original
```

---

## 📊 Resultado Esperado

✅ **Sistema totalmente funcional**
✅ **Propriedades carregam**
✅ **Backups criam e restauram**
✅ **Downloads funcionam**
✅ **Sem erros no console**
✅ **Notificações aparecem**

---

**Data:** 7 de novembro de 2025  
**Versão:** 2.5  
**Status:** PRONTO PARA TESTE
