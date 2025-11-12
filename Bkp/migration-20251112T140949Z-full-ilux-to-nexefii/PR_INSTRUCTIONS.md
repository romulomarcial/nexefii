InstruÃ§Ãµes para commitar, criar branch e abrir PR â€” nexefii (guard-auth fixes)

Resumo
- Este repositÃ³rio jÃ¡ recebeu correÃ§Ãµes automÃ¡ticas de "guards" (compat shims) e correÃ§Ãµes manuais para remover um erro de sintaxe introduzido pela automaÃ§Ã£o.
- Backups foram criados para cada arquivo modificado com o sufixo `.bak.assistant`.
- Um ZIP completo foi gerado em `R:\Development\Projects\nexefii-auth-guards-20251110.zip` contendo o estado atual (arquivos modificados + backups + `qa/headless-report.json`).

Objetivo
- Criar um branch, commitar as mudanÃ§as presentes na Ã¡rvore de trabalho e abrir um Pull Request para revisÃ£o antes de merge.

Passos (execute localmente no seu ambiente com Git configurado)

1) Verifique o estado atual

Abra o PowerShell em `R:\Development\Projects\nexefii` e rode:

```powershell
# confirmar branch atual e alteraÃ§Ãµes
git status --porcelain

# ver diffs rÃ¡pidos (opcional)
git --no-pager diff --name-only
```

2) Crie o branch e commit

```powershell
# criar branch
git checkout -b fix/auth-guards-sprint7

# adicionar todos os arquivos (inclui backups .bak.assistant e qa/headless-report.json)
git add -A

# criar commit com mensagem informativa
git commit -m "fix: apply guarded auth wrappers and repair syntax errors; include backups and headless report"
```

3) Rodar o headless smoke test localmente (recomendado antes do push)

```powershell
# instalar dependÃªncias caso necessÃ¡rio
npm install

# executar o headless check (usa Puppeteer)
node qa\headless-check.js

# o resultado serÃ¡ em qa\headless-report.json
Get-Content qa\headless-report.json -Raw | Out-File -FilePath qa\headless-report-for-pr.json
```

Confirme que `qa\headless-report.json` nÃ£o contÃ©m erros de sintaxe ou console.errors crÃ­ticos nas pÃ¡ginas principais (index, shell, post-login pages).

4) Push e abrir PR

```powershell
# enviar branch ao remoto
git push -u origin fix/auth-guards-sprint7
```

Depois, abra o repositÃ³rio no GitHub e crie um PR do branch `fix/auth-guards-sprint7` para `main` (ou a branch de destino que sua organizaÃ§Ã£o usa). Se vocÃª usa o CLI `gh`, pode abrir o PR com:

```powershell
# opÃ§Ã£o com gh
gh pr create --title "fix: guarded auth wrappers & syntax repairs" --body-file qa\pr-body.txt --base main
```

(Se `gh` nÃ£o estiver disponÃ­vel, crie o PR via interface web do GitHub.)

Template sugerido para o corpo do PR (arquivo `qa\pr-body.txt` pode ser criado localmente):

--- PR Body Start ---
Resumo
- Aplica guardas e adaptaÃ§Ãµes para chamadas de autenticaÃ§Ã£o (`NexefiiAuth`, `IluxAuth`) para evitar ReferenceErrors quando adaptadores nÃ£o estÃ£o carregados.
- Corrige um erro de sintaxe causado por substituiÃ§Ãµes automÃ¡ticas (parenthesis/ternary mismatched) no `index.html` e em outros arquivos.

Arquivos principais alterados
- `index.html` (bloco inline safeIsAuthenticated + demoLogin + shims)
- `auth.js` (compat shim prepended)
- `app.js` (corrigidos ternÃ¡rios/missing parens em hasModuleAccess checks)
- `alerts-control.html`, `housekeeping-control.html`, `engineering-list.html`, `pms-frontdesk.js`, `pms-reservations-ui.js`, `pms-rooms.js` (exemplos de arquivos patchados)

Backups
- Backups automÃ¡ticos foram criados com sufixo `.bak.assistant` para cada arquivo modificado.
- Ex.: `index.html.bak.assistant`, `app.js.bak.assistant`, `auth.js.bak.assistant`.

Testes realizados
- Headless smoke test executado com `qa/headless-check.js`. O relatÃ³rio foi salvo em `qa/headless-report.json` e nÃ£o contÃ©m erros de sintaxe apÃ³s as correÃ§Ãµes.

Checklist para revisÃ£o
- [ ] Verificar se a lÃ³gica protegida por `hasModuleAccess` continua com o comportamento esperado (nÃ£o sÃ³ sintaxe).
- [ ] Revisar chamadas que foram convertidas para `safeIsAuthenticated()` â€” garantir que nÃ£o alteram a ordem de avaliaÃ§Ã£o em expressÃµes complexas.
- [ ] Validar manualmente telas crÃ­ticas no navegador (index -> shell -> post-login pages).
- [ ] Confirmar que backups `.bak.assistant` estejam acessÃ­veis e consistentes.

Rollback
- Para reverter uma alteraÃ§Ã£o, use o backup correspondente (ex.: `git checkout -- path/to/file.html.bak.assistant` ou substitua o arquivo manualmente a partir do backup).

Notas finais
- Recomendo merge apenas apÃ³s um revisor humano validar a lÃ³gica (nÃ£o apenas a sintaxe). As mudanÃ§as foram aplicadas inicialmente por regex; hÃ¡ risco baixo de transformar cÃ³digo com efeitos colaterais. Se aceito, podemos depois refatorar `qa/apply-guards.js` para usar AST e prevenir regressÃµes futuras.

--- PR Body End ---

O que eu preciso de vocÃª durante o processo
- Quando for criar o branch/push, me avise com o link do PR (ou o nÃºmero do PR) e eu posso:
  - inserir um comentÃ¡rio de resumo automÃ¡tico no PR com detalhes adicionais;
  - executar validaÃ§Ãµes extras e preparar uma lista de verificaÃ§Ãµes para a equipe;
  - abrir um conjunto de sugestÃµes (review) se encontrar pontos de melhoria.

Se quiser que eu gere o arquivo `qa\pr-body.txt` e o adicione ao ZIP antes de vocÃª commitar, diga e eu o crio aqui.

Obrigado â€” quando quiser, diga se quer que eu adicione o `qa\pr-body.txt` ao ZIP (sim/nÃ£o) ou se prefere criar o PR agora localmente.
