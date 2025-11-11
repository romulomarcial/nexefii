# ✅ Checklist de Validação - Backup V3.0

Use este checklist para validar todas as funcionalidades do novo sistema de backup.

---

## 🎯 Pré-requisitos

- [ ] Navegador moderno (Chrome, Edge, Firefox)
- [ ] Console do navegador aberto (F12)
- [ ] Sistema com usuários cadastrados
- [ ] Usuários com propriedades atribuídas

---

## 📋 Validação Visual (Interface)

### Property Backups

- [ ] **Help Panel (❓)**
  - [ ] Ao clicar no "?", painel abre
  - [ ] Texto explica Full Backup (cópia completa)
  - [ ] Texto explica Incremental (apenas mudanças)
  - [ ] Path informado: `../bkp/property/full_bkp/` ou `.../incremental/`

- [ ] **Seletor de Propriedade**
  - [ ] Dropdown aparece com propriedades
  - [ ] Ao menos uma propriedade disponível
  - [ ] Se vazio, verificar console logs

- [ ] **Botões de Ação**
  - [ ] Botão "💾 Full Backup" visível
  - [ ] Botão "📦 Incremental" visível
  - [ ] NENHUM botão de storage location (Local/Cloud/On-Premise)

- [ ] **Área de Histórico**
  - [ ] Div `propertyBackupsCatalog` visível
  - [ ] Mensagem inicial: "Nenhum backup encontrado"

### General Structure

- [ ] **Help Panel (❓)**
  - [ ] Ao clicar no "?", painel abre
  - [ ] Texto explica Full Backup (sistema completo)
  - [ ] Texto explica Snapshot (captura rápida)
  - [ ] Path informado: `../bkp/full_bkp/` ou `.../snapshot/`

- [ ] **Botões de Ação**
  - [ ] Botão "🏗️ Full Backup" visível
  - [ ] Botão "📸 Snapshot" visível
  - [ ] NENHUM botão de storage location

- [ ] **Área de Histórico**
  - [ ] Div `generalBackupsCatalog` visível
  - [ ] Mensagem inicial: "Nenhum backup encontrado"

---

## 🔧 Validação Funcional

### Criar Property Full Backup

1. **Preparação**
   - [ ] Selecionar propriedade no dropdown
   - [ ] Verificar console: nenhum erro

2. **Criação**
   - [ ] Clicar "💾 Full Backup"
   - [ ] Notificação aparece: "Criando backup de propriedade..."
   - [ ] Download inicia automaticamente
   - [ ] Arquivo sugerido: `bkp_property_full_bkp_backup_[prop]_[data].json`

3. **Salvamento**
   - [ ] Salvar arquivo em: `../bkp/property/full_bkp/`
   - [ ] Arquivo JSON é legível (formatado)

4. **Histórico**
   - [ ] Card aparece no histórico
   - [ ] Nome do arquivo correto
   - [ ] Data/hora formatada (dd/mm/yyyy hh:mm:ss)
   - [ ] Tamanho exibido (KB ou MB)
   - [ ] Path exibido: `../bkp/property/full_bkp/...`
   - [ ] Badge "full" visível
   - [ ] 3 botões: ⬇️ Baixar, ↩️ Restaurar, 🗑️ Deletar

5. **Console**
   - [ ] Log: "BackupManager: Carregando propriedades..."
   - [ ] Log: "BackupManager: Propriedades encontradas: [...]"
   - [ ] Nenhum erro JavaScript

### Criar Property Incremental Backup

1. **Criação**
   - [ ] Selecionar mesma propriedade
   - [ ] Clicar "📦 Incremental"
   - [ ] Download automático
   - [ ] Arquivo sugerido: `bkp_property_incremental_backup_[prop]_[data].json`

2. **Salvamento**
   - [ ] Salvar em: `../bkp/property/incremental/`

3. **Histórico**
   - [ ] Card aparece com badge "incremental"
   - [ ] Path correto: `.../incremental/...`

### Criar General Full Backup

1. **Criação**
   - [ ] Ir para aba "General Structure"
   - [ ] Clicar "🏗️ Full Backup"
   - [ ] Download automático
   - [ ] Arquivo sugerido: `bkp_full_bkp_backup_general_[data].json`

2. **Salvamento**
   - [ ] Salvar em: `../bkp/full_bkp/`

3. **Histórico**
   - [ ] Card aparece com badge "full"
   - [ ] Path correto: `.../full_bkp/...`

### Criar General Snapshot

1. **Criação**
   - [ ] Clicar "📸 Snapshot"
   - [ ] Download automático
   - [ ] Arquivo sugerido: `bkp_snapshot_backup_general_[data].json`

2. **Salvamento**
   - [ ] Salvar em: `../bkp/snapshot/`

3. **Histórico**
   - [ ] Card aparece com badge "snapshot"
   - [ ] Path correto: `.../snapshot/...`

### Restaurar Property Backup

1. **Preparação**
   - [ ] Ter um arquivo de backup salvo
   - [ ] Selecionar propriedade correspondente

2. **Restauração**
   - [ ] Clicar "↩️ Restaurar" no card
   - [ ] Dialog de seleção de arquivo abre
   - [ ] Aceita apenas .json
   - [ ] Selecionar arquivo correto

3. **Confirmação**
   - [ ] Alert aparece: "Tem certeza? Dados serão substituídos"
   - [ ] Clicar "OK"

4. **Execução**
   - [ ] Notificação: "Restaurando backup..."
   - [ ] Notificação: "Backup restaurado! Recarregando..."
   - [ ] Página recarrega automaticamente
   - [ ] Dados restaurados corretamente

5. **Erros (testar)**
   - [ ] Upload de arquivo inválido → Erro: "Estrutura inválida"
   - [ ] Cancelar upload → Nada acontece
   - [ ] Cancelar confirmação → Nada acontece

### Restaurar General Backup

1. **Restauração**
   - [ ] Clicar "↩️ Restaurar" no card de general backup
   - [ ] Dialog de seleção abre
   - [ ] Selecionar arquivo .json

2. **Confirmação e Execução**
   - [ ] Alert de confirmação
   - [ ] Notificações de progresso
   - [ ] Página recarrega
   - [ ] Dados restaurados

### Botão "Baixar"

1. **Teste**
   - [ ] Clicar "⬇️ Baixar" em qualquer card
   - [ ] Notificação aparece: "Para baixar novamente, crie um novo backup..."
   - [ ] Nenhum download acontece (esperado)

### Deletar Backup

1. **Property Backup**
   - [ ] Clicar "🗑️ Deletar" em card
   - [ ] Alert: "Tem certeza? Deletar do histórico"
   - [ ] Confirmar
   - [ ] Card desaparece
   - [ ] Notificação: "Registro removido do histórico"

2. **General Backup**
   - [ ] Mesmo fluxo
   - [ ] Card desaparece do histórico

---

## 🐛 Validação de Erros (Console)

### Sem Propriedades

1. **Cenário**: Sistema sem usuários ou sem propriedades atribuídas
   - [ ] Console: "BackupManager: Carregando propriedades de 0 usuários"
   - [ ] Console: "BackupManager: Propriedades encontradas: []"
   - [ ] Dropdown vazio com mensagem padrão
   - [ ] Botões Full/Incremental desabilitados OU mostram aviso

### Backup Sem Propriedade Selecionada

1. **Cenário**: Clicar Full Backup sem selecionar propriedade
   - [ ] Notificação: "Selecione uma propriedade para fazer backup"
   - [ ] Nenhum download acontece

### Arquivo JSON Inválido

1. **Cenário**: Upload de JSON corrompido ou estrutura errada
   - [ ] Erro capturado
   - [ ] Notificação: "Estrutura de backup inválida"
   - [ ] Dados não são alterados

---

## 📁 Validação de Arquivos

### Estrutura de Pastas

```
bkp/
├── README.md                    [ ] Existe e está legível
├── property/
│   ├── full_bkp/               [ ] Pasta criada
│   │   └── *.json              [ ] Pode salvar arquivos
│   └── incremental/            [ ] Pasta criada
│       └── *.json              [ ] Pode salvar arquivos
├── full_bkp/                   [ ] Pasta criada
│   └── *.json                  [ ] Pode salvar arquivos
└── snapshot/                   [ ] Pasta criada
    └── *.json                  [ ] Pode salvar arquivos
```

### Formato JSON (Property Backup)

```json
{
  "propertyId": "...",           [ ] Campo presente
  "type": "full|incremental",    [ ] Tipo correto
  "timestamp": "...",            [ ] ISO 8601
  "data": {                      [ ] Objeto data presente
    "propertyId": "...",
    "reservations": [...],       [ ] Array (pode ser vazio)
    "inventory": [...],          [ ] Array (pode ser vazio)
    "configurations": [...]      [ ] Array (pode ser vazio)
  }
}
```

### Formato JSON (General Backup)

```json
{
  "type": "general",             [ ] Campo presente
  "backupType": "full|snapshot", [ ] Tipo correto
  "timestamp": "...",            [ ] ISO 8601
  "data": {                      [ ] Objeto data presente
    "timestamp": "...",
    "users": [...],              [ ] Array de usuários
    "configs": [...]             [ ] Array de configs
  }
}
```

---

## 📊 Validação de Performance

- [ ] Criação de backup < 2 segundos (propriedade pequena)
- [ ] Download inicia imediatamente
- [ ] Upload e restauração < 3 segundos
- [ ] Interface não trava durante operações
- [ ] Notificações aparecem e desaparecem corretamente

---

## 🎯 Resultado Esperado

### ✅ Todos os itens marcados
- Sistema funcionando perfeitamente
- Pronto para uso em produção

### ⚠️ Alguns itens falharam
- Verificar console logs
- Verificar estrutura de dados (usuários, propriedades)
- Verificar permissões de arquivos
- Revisar documentação

### ❌ Muitos itens falharam
- Verificar se arquivos foram modificados corretamente
- Verificar se há erros de sintaxe (F12 Console)
- Limpar cache do navegador (Ctrl+Shift+Del)
- Recarregar página com Ctrl+F5

---

## 📞 Troubleshooting Rápido

### Problema: Dropdown de propriedades vazio

**Verificar**:
1. Console logs: "Carregando propriedades de X usuários"
2. Console logs: "Propriedades encontradas: []"

**Se lista vazia**:
- Criar usuários em Gestão de Usuários
- Atribuir propriedades aos usuários (campo `properties`)

### Problema: Download não inicia

**Verificar**:
1. Navegador bloqueia downloads? (verificar configurações)
2. Console tem erros JavaScript?
3. Função `downloadBackupFile()` existe?

### Problema: Restauração falha

**Verificar**:
1. Arquivo JSON está bem formatado?
2. Estrutura do JSON está correta?
3. Propriedade existe no sistema?

### Problema: Notificações não aparecem

**Verificar**:
1. CSS da página carregou?
2. Função `showNotification()` existe?
3. Elemento `.notification` existe no HTML?

---

**Data**: 07/11/2025  
**Versão**: 3.0  
**Status**: Pronto para validação
