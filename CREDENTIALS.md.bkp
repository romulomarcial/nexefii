# 🔐 IluxSys - Credenciais de Acesso

## USUÁRIO MASTER (Super Administrador)

```
URL: http://localhost/master-control.html
Username: master
Password: Master2025!@#$
```

**Nível de Acesso**: MASTER ⭐⭐⭐⭐⭐
- ✅ Acesso total a TODAS as funcionalidades
- ✅ Backup & Restore completo do sistema
- ✅ Versionamento e controle de marcos
- ✅ Gestão completa de usuários (criar, editar, deletar)
- ✅ Visualizar e editar TODAS as propriedades
- ✅ Acesso a logs e auditoria
- ✅ Configurações avançadas do sistema
- ✅ Manutenção e otimização
- ✅ Reset do sistema

**Quando usar**: 
- Gerenciamento de backups
- Criação/edição de administradores
- Configuração do sistema
- Manutenção e troubleshooting
- Versionamento de código/dados

---

## USUÁRIO ADMIN (Administrador)

```
URL: http://localhost/index.html
Username: admin  
Password: admin12345!@#
```

**Nível de Acesso**: ADMIN ⭐⭐⭐⭐
- ✅ Acesso a todas as propriedades
- ✅ Gestão de usuários regulares
- ✅ Acesso a todos os módulos (PMS, Engineering, etc.)
- ✅ Relatórios e dashboards
- ✅ Configurações operacionais
- ❌ Sem acesso a Master Control Panel
- ❌ Não pode criar outros admins
- ❌ Não pode fazer backup/restore do sistema

**Quando usar**:
- Operação diária do sistema
- Gestão de propriedades
- Aprovação de usuários
- Configurações operacionais

---

## HIERARQUIA DE NÍVEIS

```
MASTER (Super Admin)
  └─ Acesso total + Master Control Panel
     └─ Pode criar/editar ADMINS
        
        ADMIN (Administrador)
        └─ Acesso a todas propriedades
           └─ Pode criar/editar MANAGERS e USERS
              
              MANAGER (Gerente)
              └─ Acesso a múltiplas propriedades
                 └─ Pode gerenciar sua(s) propriedade(s)
                    
                    USER (Usuário)
                    └─ Acesso a uma propriedade específica
                       └─ Módulos limitados
```

---

## FLUXO DE AUTENTICAÇÃO

### Login Master:
1. Acesse: `master-control.html`
2. OU faça login normal - sistema detecta role "master" e redireciona automaticamente
3. Username: `master` | Password: `Master2025!@#$`
4. ✅ Redirecionado para Master Control Panel

### Login Admin:
1. Acesse: `login.html` ou `index.html`
2. Username: `admin` | Password: `admin12345!@#`
3. ✅ Redirecionado para Dashboard principal

### Login User Regular:
1. Acesse: `login.html`
2. Credenciais personalizadas (criadas pelo admin/master)
3. ✅ Redirecionado para módulos permitidos

---

## MUDANÇA DE SENHA (RECOMENDADO)

### Para Master:
```javascript
// No Master Control Panel:
1. Vá para aba "👥 Gestão de Usuários"
2. Encontre usuário "master"
3. Clique em ✏️ Editar
4. Altere a senha
5. Salve

// OU via Console:
const users = JSON.parse(localStorage.getItem('iluxsys_users'));
const master = users.find(u => u.username === 'master');
master.password = 'NOVA_SENHA_HASH'; // Use função de hash
localStorage.setItem('iluxsys_users', JSON.stringify(users));
```

### Para Admin:
```javascript
// Mesmo processo acima, ou:
// Admin pode alterar própria senha no perfil
```

---

## SEGURANÇA - CHECKLIST

- [ ] ⚠️ Trocar senha padrão do Master
- [ ] ⚠️ Trocar senha padrão do Admin  
- [ ] ✅ Limitar acesso ao Master Control Panel (apenas pessoas autorizadas)
- [ ] ✅ Habilitar criptografia de backups
- [ ] ✅ Configurar backup automático
- [ ] ✅ Fazer download de backups regularmente
- [ ] ✅ Revisar logs de auditoria semanalmente
- [ ] ✅ Documentar quem tem acesso master/admin

---

## ARQUIVOS PRINCIPAIS

```
master-control.html     → Interface do Master Control Panel
master-control.js       → Lógica do sistema Master
auth.js                 → Sistema de autenticação (cria users master/admin)
app.js                  → Aplicação principal (reconhece role master)
login.html              → Tela de login
index.html              → Dashboard principal
```

---

## PRIMEIROS PASSOS

### 1. Testar Acesso Master
```bash
1. Abra: master-control.html
2. Login com credenciais master
3. Explore as 6 abas principais
4. Crie um backup de teste
```

### 2. Criar Primeiro Marco
```bash
1. No Master Control Panel
2. Aba "🗂️ Versionamento"  
3. Clique "📸 Criar Marco"
4. Descrição: "Estado inicial do sistema"
```

### 3. Configurar Backup Automático
```bash
1. Aba "⚙️ Sistema"
2. Backup Automático: "Diário"
3. Retenção: 30 dias
4. Versionamento Automático: "Habilitado"
5. Clique "💾 Salvar Configurações"
```

### 4. Criar Primeiro Usuário
```bash
1. Aba "👥 Gestão de Usuários"
2. Clique "➕ Criar Usuário"
3. Preencha dados
4. Escolha nível (manager/user)
5. Defina propriedades
6. Salvar
```

---

## BACKUP RÁPIDO (Emergência)

Se precisar fazer backup AGORA:

```javascript
// Cole no Console do navegador (F12):
const masterCtrl = window.masterCtrl;
if (masterCtrl) {
  masterCtrl.createFullBackup();
  alert('✅ Backup de emergência criado!');
  
  // Download imediato:
  const backups = JSON.parse(localStorage.getItem('master_backups'));
  const lastBackup = backups[backups.length - 1];
  const blob = new Blob([JSON.stringify(lastBackup, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `emergency_backup_${Date.now()}.json`;
  a.click();
}
```

---

## RESTORE RÁPIDO (Emergência)

Se precisar restaurar backup:

```javascript
// 1. Carregue o arquivo de backup
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const backupData = JSON.parse(event.target.result);
    
    // 2. Restaure
    Object.entries(backupData.data).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          localStorage.setItem(item.key, item.value);
        });
      }
    });
    
    alert('✅ Backup restaurado! Recarregue a página.');
    location.reload();
  };
  reader.readAsText(file);
};
input.click();
```

---

## SUPORTE TÉCNICO

**Em caso de problemas críticos:**

1. ✅ Fazer backup imediato (script acima)
2. ✅ Documentar o erro (screenshot + descrição)
3. ✅ Verificar logs no Master Control Panel
4. ✅ Tentar reparar integridade (Aba Sistema → Manutenção)
5. ⚠️ Se nada funcionar, considerar restore de backup anterior

**Contatos:**
- 📧 Email: master@iluxsys.com
- 📱 Suporte: [A definir]

---

## NOTAS IMPORTANTES

⚠️ **LocalStorage tem limite de ~5MB**
- Use backups incrementais
- Baixe backups grandes externamente
- Monitore uso de armazenamento

⚠️ **Dados sensíveis**
- LocalStorage não é criptografado por padrão
- Use opção "criptografar backup" para dados sensíveis
- Considere implementar backend com DB real

⚠️ **Navegador Privado / Incognito**
- LocalStorage é limpo ao fechar
- NÃO use para produção em modo privado
- Apenas para testes

✅ **Para Produção**
- Implemente backend com banco de dados
- Use autenticação JWT
- Backups em cloud (S3, Azure)
- SSL/HTTPS obrigatório

---

**Documento**: Credenciais de Acesso IluxSys  
**Versão**: 1.0.0  
**Data**: Novembro 2025  
**Classificação**: 🔒 CONFIDENCIAL - USO RESTRITO
