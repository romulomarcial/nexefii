
# NEXEFII · Portal de Hotéis (v4_4)

Estrutura organizada para apresentação/POC com i18n (PT/EN/ES).

## Pastas e arquivos

- `index.html` — Portal (cards dos hotéis, KPIs por hotel, botões de Controle/RTI).
- `login.html` — Tela de login com i18n em tempo real (PT/EN/ES), campo de senha e persistência de idioma/usuário.
- `app.js` — Lógica do portal, i18n das telas internas, calendário, modais (Controle e RTI).
- `style.css` — Estilos gerais (layout leve, claro).
- `assets/` — Imagens (logo e fotos dos hotéis).

## i18n
- O **login** contém bloco i18n próprio, isolado e simples de editar (`I18N_LOGIN`).
- As telas internas usam o i18n do `app.js`, que lê o idioma salvo em `localStorage.nexefii_lang`.
- Idiomas suportados: Português (pt), English (en), Español (es).

## Fluxo
1. Abrir `login.html`, escolher idioma, informar usuário/senha e entrar.
2. O idioma é salvo e aplicado no portal e modais.
3. Botão **Logout** no topo do portal limpa usuário e retorna ao login.

## Observações
- Todos os textos dinâmicos possuem IDs para facilitar manutenção.
- Dados (KPIs e calendário) simulados para demo.

## Servidor de Desenvolvimento (Porta 8004)

Fornecemos agora um servidor Node minimal (`server.js`) para evitar erros de rota e cache agressivo durante testes com Service Worker.

### Iniciar

Pré-requisito: Node instalado e estar na pasta do projeto:

```powershell
Set-Location R:\Development\Projects\iluxsys
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

### Forçar atualização do Service Worker
1. DevTools > Application > Service Workers > Unregister
2. Application > Clear storage > Clear site data
3. Network > marcar "Disable cache"
4. Hard reload (Ctrl+Shift+R)
5. Verificar no Console: versão `nexefii-v1.0.1` e Router com `mode: 'hash'`
6. (Opcional) Executar no Console se precisar limpar cache novamente:
```js
window.NEXEFII.clearSWCache()
```

### Erros de conexão (ERR_CONNECTION_REFUSED)
Se aparecer, o servidor não está rodando ou porta mudou.
Verificar se algo está escutando:
```powershell
netstat -ano | Select-String ":8004"
```
Se ocupado, alterar a porta (ex.: set variável antes de rodar):
```powershell
$env:PORT=8010
node server.js
```
Então acessar:
```
http://localhost:8010/shell.html#/
```

### Porque hash mode?
Como servidor estático simples não faz rewrite de todas as rotas para `shell.html`, usamos `mode: 'hash'` para evitar 404 do navegador em refresh profundo.



## i18n externo
- Agora há um `i18n.json` com textos de **login** e **app**.
- Quando abrir pelo **Live Server** (http://127.0.0.1:5500/), os textos são carregados desse JSON.
- Em `file://`, se o `fetch` não puder ler o arquivo, há **fallback** embutido, então a UI continua funcionando.
