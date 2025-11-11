
# NEXEFII Â· Portal de HotÃ©is (v4_4)

Estrutura organizada para apresentaÃ§Ã£o/POC com i18n (PT/EN/ES).

## Pastas e arquivos

- `index.html` â€” Portal (cards dos hotÃ©is, KPIs por hotel, botÃµes de Controle/RTI).
- `login.html` â€” Tela de login com i18n em tempo real (PT/EN/ES), campo de senha e persistÃªncia de idioma/usuÃ¡rio.
- `app.js` â€” LÃ³gica do portal, i18n das telas internas, calendÃ¡rio, modais (Controle e RTI).
- `style.css` â€” Estilos gerais (layout leve, claro).
- `assets/` â€” Imagens (logo e fotos dos hotÃ©is).

## i18n
- O **login** contÃ©m bloco i18n prÃ³prio, isolado e simples de editar (`I18N_LOGIN`).
- As telas internas usam o i18n do `app.js`, que lÃª o idioma salvo em `localStorage.nexefii_lang`.
- Idiomas suportados: PortuguÃªs (pt), English (en), EspaÃ±ol (es).

## Fluxo
1. Abrir `login.html`, escolher idioma, informar usuÃ¡rio/senha e entrar.
2. O idioma Ã© salvo e aplicado no portal e modais.
3. BotÃ£o **Logout** no topo do portal limpa usuÃ¡rio e retorna ao login.

## ObservaÃ§Ãµes
- Todos os textos dinÃ¢micos possuem IDs para facilitar manutenÃ§Ã£o.
- Dados (KPIs e calendÃ¡rio) simulados para demo.

## Servidor de Desenvolvimento (Porta 8004)

Fornecemos agora um servidor Node minimal (`server.js`) para evitar erros de rota e cache agressivo durante testes com Service Worker.

### Iniciar

PrÃ©-requisito: Node instalado e estar na pasta do projeto:

```powershell
Set-Location R:\Development\Projects\nexefii
node server.js
```

Ou usando o script:
```powershell
npm start
```

O servidor sobe em: http://localhost:8004/

### Acessar a SPA
Abra diretamente:
```
http://localhost:8004/shell.html#/
```
O hash `#/` garante que o Router (modo hash) resolva a rota inicial corretamente.

### ForÃ§ar atualizaÃ§Ã£o do Service Worker
1. DevTools > Application > Service Workers > Unregister
2. Application > Clear storage > Clear site data
3. Network > marcar "Disable cache"
4. Hard reload (Ctrl+Shift+R)
5. Verificar no Console: versÃ£o `nexefii-v1.0.1` e Router com `mode: 'hash'`
6. (Opcional) Executar no Console se precisar limpar cache novamente:
```js
window.NEXEFII.clearSWCache()
```

### Erros de conexÃ£o (ERR_CONNECTION_REFUSED)
Se aparecer, o servidor nÃ£o estÃ¡ rodando ou porta mudou.
Verificar se algo estÃ¡ escutando:
```powershell
netstat -ano | Select-String ":8004"
```
Se ocupado, alterar a porta (ex.: set variÃ¡vel antes de rodar):
```powershell
$env:PORT=8010
node server.js
```
EntÃ£o acessar:
```
http://localhost:8010/shell.html#/
```

### Porque hash mode?
Como servidor estÃ¡tico simples nÃ£o faz rewrite de todas as rotas para `shell.html`, usamos `mode: 'hash'` para evitar 404 do navegador em refresh profundo.



## i18n externo
- Agora hÃ¡ um `i18n.json` com textos de **login** e **app**.
- Quando abrir pelo **Live Server** (http://127.0.0.1:5500/), os textos sÃ£o carregados desse JSON.
- Em `file://`, se o `fetch` nÃ£o puder ler o arquivo, hÃ¡ **fallback** embutido, entÃ£o a UI continua funcionando.

## Sprint 4 â€“ Sync Service (Resumo)
- ConfiguraÃ§Ã£o: abra `pages/sync-config.html` para escolher o modo (Manual / Agendado / ContÃ­nuo) e exportar logs.
- NÃºcleo: `core/sync/SyncService.js` com fila priorizada, retry exponencial e mÃ©tricas.
- Conflitos: `core/sync/ConflictResolver.js` (estratÃ©gia LWW + manual opcional).
- Logs/MÃ©tricas: `core/sync/SyncLogger.js` (export JSON).
- QA: `qa-baseline/sprint4-sync-qa.html` executa testes automatizados (latÃªncia â‰¤ 2s e fila zerada ao final).

Atualização: Sprint 5 concluída. Ver SPRINT_SUMMARY_5.md

Atualização: Sprint 5 concluída. Ver SPRINT_SUMMARY_5.md

