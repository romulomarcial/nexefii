Instruções para commitar, criar branch e abrir PR — iLuxSys (guard-auth fixes)

Resumo
- Este repositório já recebeu correções automáticas de "guards" (compat shims) e correções manuais para remover um erro de sintaxe introduzido pela automação.
- Backups foram criados para cada arquivo modificado com o sufixo `.bak.assistant`.
- Um ZIP completo foi gerado em `R:\Development\Projects\iluxsys-auth-guards-20251110.zip` contendo o estado atual (arquivos modificados + backups + `qa/headless-report.json`).

Objetivo
- Criar um branch, commitar as mudanças presentes na árvore de trabalho e abrir um Pull Request para revisão antes de merge.

Passos (execute localmente no seu ambiente com Git configurado)

1) Verifique o estado atual

Abra o PowerShell em `R:\Development\Projects\iluxsys` e rode:

```powershell
# confirmar branch atual e alterações
git status --porcelain

# ver diffs rápidos (opcional)
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
# instalar dependências caso necessário
npm install

# executar o headless check (usa Puppeteer)
node qa\headless-check.js

# o resultado será em qa\headless-report.json
Get-Content qa\headless-report.json -Raw | Out-File -FilePath qa\headless-report-for-pr.json
```

Confirme que `qa\headless-report.json` não contém erros de sintaxe ou console.errors críticos nas páginas principais (index, shell, post-login pages).

4) Push e abrir PR

```powershell
# enviar branch ao remoto
git push -u origin fix/auth-guards-sprint7
```

Depois, abra o repositório no GitHub e crie um PR do branch `fix/auth-guards-sprint7` para `main` (ou a branch de destino que sua organização usa). Se você usa o CLI `gh`, pode abrir o PR com:

```powershell
# opção com gh
gh pr create --title "fix: guarded auth wrappers & syntax repairs" --body-file qa\pr-body.txt --base main
```

(Se `gh` não estiver disponível, crie o PR via interface web do GitHub.)

Template sugerido para o corpo do PR (arquivo `qa\pr-body.txt` pode ser criado localmente):

--- PR Body Start ---
Resumo
- Aplica guardas e adaptações para chamadas de autenticação (`NexefiiAuth`, `IluxAuth`) para evitar ReferenceErrors quando adaptadores não estão carregados.
- Corrige um erro de sintaxe causado por substituições automáticas (parenthesis/ternary mismatched) no `index.html` e em outros arquivos.

Arquivos principais alterados
- `index.html` (bloco inline safeIsAuthenticated + demoLogin + shims)
- `auth.js` (compat shim prepended)
- `app.js` (corrigidos ternários/missing parens em hasModuleAccess checks)
- `alerts-control.html`, `housekeeping-control.html`, `engineering-list.html`, `pms-frontdesk.js`, `pms-reservations-ui.js`, `pms-rooms.js` (exemplos de arquivos patchados)

Backups
- Backups automáticos foram criados com sufixo `.bak.assistant` para cada arquivo modificado.
- Ex.: `index.html.bak.assistant`, `app.js.bak.assistant`, `auth.js.bak.assistant`.

Testes realizados
- Headless smoke test executado com `qa/headless-check.js`. O relatório foi salvo em `qa/headless-report.json` e não contém erros de sintaxe após as correções.

Checklist para revisão
- [ ] Verificar se a lógica protegida por `hasModuleAccess` continua com o comportamento esperado (não só sintaxe).
- [ ] Revisar chamadas que foram convertidas para `safeIsAuthenticated()` — garantir que não alteram a ordem de avaliação em expressões complexas.
- [ ] Validar manualmente telas críticas no navegador (index -> shell -> post-login pages).
- [ ] Confirmar que backups `.bak.assistant` estejam acessíveis e consistentes.

Rollback
- Para reverter uma alteração, use o backup correspondente (ex.: `git checkout -- path/to/file.html.bak.assistant` ou substitua o arquivo manualmente a partir do backup).

Notas finais
- Recomendo merge apenas após um revisor humano validar a lógica (não apenas a sintaxe). As mudanças foram aplicadas inicialmente por regex; há risco baixo de transformar código com efeitos colaterais. Se aceito, podemos depois refatorar `qa/apply-guards.js` para usar AST e prevenir regressões futuras.

--- PR Body End ---

O que eu preciso de você durante o processo
- Quando for criar o branch/push, me avise com o link do PR (ou o número do PR) e eu posso:
  - inserir um comentário de resumo automático no PR com detalhes adicionais;
  - executar validações extras e preparar uma lista de verificações para a equipe;
  - abrir um conjunto de sugestões (review) se encontrar pontos de melhoria.

Se quiser que eu gere o arquivo `qa\pr-body.txt` e o adicione ao ZIP antes de você commitar, diga e eu o crio aqui.

Obrigado — quando quiser, diga se quer que eu adicione o `qa\pr-body.txt` ao ZIP (sim/não) ou se prefere criar o PR agora localmente.