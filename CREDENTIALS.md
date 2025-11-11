# ðŸ” nexefii - Credenciais de Acesso

## USUÃRIO MASTER (Super Administrador)

```
URL: http://localhost/master-control.html
Username: master
Password: Master2025!@#$
```

**NÃ­vel de Acesso**: MASTER â­â­â­â­â­
- âœ… Acesso total a TODAS as funcionalidades
- âœ… Backup & Restore completo do sistema
- âœ… Versionamento e controle de marcos
- âœ… GestÃ£o completa de usuÃ¡rios (criar, editar, deletar)
- âœ… Visualizar e editar TODAS as propriedades
- âœ… Acesso a logs e auditoria
- âœ… ConfiguraÃ§Ãµes avanÃ§adas do sistema
- âœ… ManutenÃ§Ã£o e otimizaÃ§Ã£o
- âœ… Reset do sistema

**Quando usar**: 
- Gerenciamento de backups
- CriaÃ§Ã£o/ediÃ§Ã£o de administradores
- ConfiguraÃ§Ã£o do sistema
- ManutenÃ§Ã£o e troubleshooting
- Versionamento de cÃ³digo/dados

---

## USUÃRIO ADMIN (Administrador)

```
URL: http://localhost/index.html
Username: admin  
Password: admin12345!@#
```

**NÃ­vel de Acesso**: ADMIN â­â­â­â­
- âœ… Acesso a todas as propriedades
- âœ… GestÃ£o de usuÃ¡rios regulares
- âœ… Acesso a todos os mÃ³dulos (PMS, Engineering, etc.)
- âœ… RelatÃ³rios e dashboards
- âœ… ConfiguraÃ§Ãµes operacionais
- âŒ Sem acesso a Master Control Panel
- âŒ NÃ£o pode criar outros admins
- âŒ NÃ£o pode fazer backup/restore do sistema

**Quando usar**:
- OperaÃ§Ã£o diÃ¡ria do sistema
- GestÃ£o de propriedades
- AprovaÃ§Ã£o de usuÃ¡rios
- ConfiguraÃ§Ãµes operacionais

---

## HIERARQUIA DE NÃVEIS

```
MASTER (Super Admin)
  â””â”€ Acesso total + Master Control Panel
     â””â”€ Pode criar/editar ADMINS
        
        ADMIN (Administrador)
        â””â”€ Acesso a todas propriedades
           â””â”€ Pode criar/editar MANAGERS e USERS
              
              MANAGER (Gerente)
              â””â”€ Acesso a mÃºltiplas propriedades
                 â””â”€ Pode gerenciar sua(s) propriedade(s)
                    
                    USER (UsuÃ¡rio)
                    â””â”€ Acesso a uma propriedade especÃ­fica
                       â””â”€ MÃ³dulos limitados
```

---

## FLUXO DE AUTENTICAÃ‡ÃƒO

### Login Master:
1. Acesse: `master-control.html`
2. OU faÃ§a login normal - sistema detecta role "master" e redireciona automaticamente
3. Username: `master` | Password: `Master2025!@#$`
4. âœ… Redirecionado para Master Control Panel

### Login Admin:
1. Acesse: `login.html` ou `index.html`
2. Username: `admin` | Password: `admin12345!@#`
3. âœ… Redirecionado para Dashboard principal

### Login User Regular:
1. Acesse: `login.html`
2. Credenciais personalizadas (criadas pelo admin/master)
3. âœ… Redirecionado para mÃ³dulos permitidos

---

## MUDANÃ‡A DE SENHA (RECOMENDADO)

### Para Master:
```javascript
// No Master Control Panel:
1. VÃ¡ para aba "ðŸ‘¥ GestÃ£o de UsuÃ¡rios"
2. Encontre usuÃ¡rio "master"
3. Clique em âœï¸ Editar
4. Altere a senha
5. Salve

// OU via Console:
const users = JSON.parse(localStorage.getItem('nexefii_users'));
const master = users.find(u => u.username === 'master');
master.password = 'NOVA_SENHA_HASH'; // Use funÃ§Ã£o de hash
localStorage.setItem('nexefii_users', JSON.stringify(users));
```

### Para Admin:
```javascript
// Mesmo processo acima, ou:
// Admin pode alterar prÃ³pria senha no perfil
```

---

## SEGURANÃ‡A - CHECKLIST

- [ ] âš ï¸ Trocar senha padrÃ£o do Master
- [ ] âš ï¸ Trocar senha padrÃ£o do Admin  
- [ ] âœ… Limitar acesso ao Master Control Panel (apenas pessoas autorizadas)
- [ ] âœ… Habilitar criptografia de backups
- [ ] âœ… Configurar backup automÃ¡tico
- [ ] âœ… Fazer download de backups regularmente
- [ ] âœ… Revisar logs de auditoria semanalmente
- [ ] âœ… Documentar quem tem acesso master/admin

---

## ARQUIVOS PRINCIPAIS

```
master-control.html     â†’ Interface do Master Control Panel
master-control.js       â†’ LÃ³gica do sistema Master
auth.js                 â†’ Sistema de autenticaÃ§Ã£o (cria users master/admin)
app.js                  â†’ AplicaÃ§Ã£o principal (reconhece role master)
login.html              â†’ Tela de login
index.html              â†’ Dashboard principal
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
2. Aba "ðŸ—‚ï¸ Versionamento"  
3. Clique "ðŸ“¸ Criar Marco"
4. DescriÃ§Ã£o: "Estado inicial do sistema"
```

### 3. Configurar Backup AutomÃ¡tico
```bash
1. Aba "âš™ï¸ Sistema"
2. Backup AutomÃ¡tico: "DiÃ¡rio"
3. RetenÃ§Ã£o: 30 dias
4. Versionamento AutomÃ¡tico: "Habilitado"
5. Clique "ðŸ’¾ Salvar ConfiguraÃ§Ãµes"
```

### 4. Criar Primeiro UsuÃ¡rio
```bash
1. Aba "ðŸ‘¥ GestÃ£o de UsuÃ¡rios"
2. Clique "âž• Criar UsuÃ¡rio"
3. Preencha dados
4. Escolha nÃ­vel (manager/user)
5. Defina propriedades
6. Salvar
```

---

## BACKUP RÃPIDO (EmergÃªncia)

Se precisar fazer backup AGORA:

```javascript
// Cole no Console do navegador (F12):
const masterCtrl = window.masterCtrl;
if (masterCtrl) {
  masterCtrl.createFullBackup();
  alert('âœ… Backup de emergÃªncia criado!');
  
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

## RESTORE RÃPIDO (EmergÃªncia)

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
    
    alert('âœ… Backup restaurado! Recarregue a pÃ¡gina.');
    location.reload();
  };
  reader.readAsText(file);
};
input.click();
```

---

## SUPORTE TÃ‰CNICO

**Em caso de problemas crÃ­ticos:**

1. âœ… Fazer backup imediato (script acima)
2. âœ… Documentar o erro (screenshot + descriÃ§Ã£o)
3. âœ… Verificar logs no Master Control Panel
4. âœ… Tentar reparar integridade (Aba Sistema â†’ ManutenÃ§Ã£o)
5. âš ï¸ Se nada funcionar, considerar restore de backup anterior

**Contatos:**
- ðŸ“§ Email: master@nexefii.com
- ðŸ“± Suporte: [A definir]

---

## NOTAS IMPORTANTES

âš ï¸ **LocalStorage tem limite de ~5MB**
- Use backups incrementais
- Baixe backups grandes externamente
- Monitore uso de armazenamento

âš ï¸ **Dados sensÃ­veis**
- LocalStorage nÃ£o Ã© criptografado por padrÃ£o
- Use opÃ§Ã£o "criptografar backup" para dados sensÃ­veis
- Considere implementar backend com DB real

âš ï¸ **Navegador Privado / Incognito**
- LocalStorage Ã© limpo ao fechar
- NÃƒO use para produÃ§Ã£o em modo privado
- Apenas para testes

âœ… **Para ProduÃ§Ã£o**
- Implemente backend com banco de dados
- Use autenticaÃ§Ã£o JWT
- Backups em cloud (S3, Azure)
- SSL/HTTPS obrigatÃ³rio

---

**Documento**: Credenciais de Acesso nexefii  
**VersÃ£o**: 1.0.0  
**Data**: Novembro 2025  
**ClassificaÃ§Ã£o**: ðŸ”’ CONFIDENCIAL - USO RESTRITO

