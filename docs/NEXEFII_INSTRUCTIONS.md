**Overview**
- **Purpose:**: Documento de referência para desenvolvedores e designers sobre o portal NEXEFII — estrutura das páginas principais (`portal`, `index.html`, `property-portal.js`), arquitetura do `dashboard` e diretrizes de UX.
- **Audience:**: Engenheiros front-end, UX designers, devops e integradores que trabalharão no produto on-premises e cloud.

**Portal (Visão Geral)**
- **Arquitetura:**: O portal NEXEFII é uma aplicação estática com JS vanilla organizada em páginas estáticas + módulos JS que dependem de dados em `localStorage` e adaptadores (por exemplo `NexefiiProps`).
- **Entradas principais:**: `index.html` (página pública/portal), `master-control.html` (painel administrativo), `pages/wizard.html` (wizard de propriedades), `property-portal` (SPA-like module).
- **Integrações:**: Pontos de integração são feitos por meio de funções globais (ex.: `window.NexefiiProps`), e hooks expostos em `master-control.js` (por exemplo `initEnterpriseBackupSystems`). Não introduza dependências assíncronas sem guardas.

**`index.html`**
- **Papel:**: Porta de entrada pública ou de clientes. Deve conter apenas o necessário: carregamento de CSS, `i18n` (guardado), e scripts mínimos.
- **Recomendações:**
  - Carregar `i18n` de maneira idempotente (verificar `window.I18nLoaded` antes de reincluir).
  - Scripts: use caminhos absolutos coerentes (`/js/...`) para evitar duplicidade de recursos em ambientes com servidores reversos.
  - Evite lógica de negócios no HTML; exponha pontos (ex.: `data-*` attributes) e deixe a inicialização para `property-portal.js`.

**`property-portal.js` (responsabilidades & convenções)**
- **Responsabilidades principais:**
  - Inicializar a UI do portal de propriedade, carregando dados via `NexefiiProps` ou `localStorage`.
  - Fornecer funções públicas mínimas, por exemplo: `listProperties()`, `getProperty(key)`, `onPropertySelected(callback)`.
  - Garantir falha graciosa quando adaptadores não estiverem disponíveis.
- **Eventos & Inicialização:**
  - Use `DOMContentLoaded` ou `load` para inicializar elementos do DOM.
  - Não dependa de inline handlers; utilize `addEventListener` no JS.
- **Boas práticas de desempenho:**
  - Debounce em entradas de busca.
  - Evitar innerHTML massivo em loops; prefira DocumentFragment ou templates.
  - Paginação ou virtualização para listas longas (quando aplicável).

**Dashboard**
- **Componentes:**: resumo (cards), gráficos (pequenas bibliotecas inline ou SVG), tabelas (resumos) e ações rápidas.
- **Fontes de dados:**: `localStorage`, `logs`, `versions`, `backups` já carregados por `master-control.js`.
- **Recomendações arquiteturais:**
  - Centralizar leitura de dados em funções (ex.: `getDashboardData()`), evitar lógica duplicada.
  - Separar render (DOM) da lógica (cálculos/transformações) para testabilidade.
  - Atualizações incrementais: ao invés de rerender total, manipular apenas nós que mudaram.

**UX Guidelines (User Friendly & Acessibilidade)**
- **Consistência visual:**: reutilize as classes existentes: `mc-shell`, `mc-breadcrumb`, `mc-section-header`, `mc-page-title`, `mc-title-underline`, `master-card mc-card`, `mc-card-body`, `mc-card-toolbar`, `mc-users-toolbar`, `mc-users-filter`, `mc-field`, `mc-session-footer`.
- **Feedback instantâneo:**: ações que alteram estado devem fornecer `showToast` ou indicador inline. Para operações longas, mostrar spinner dentro do botão.
- **Acessibilidade:**
  - Use `aria-*` em modais e elementos dinâmicos (ex.: `aria-hidden`, `role="dialog"`).
  - Todos os controles com `button` devem ter `aria-label` quando não houver texto visível.
- **Mobile / Responsividade:**: grade fluida; cards empilháveis. Evitar layouts fixos que depenem de largura.
- **Ícones:**: preferir SVG inline ou emoji como fallback, evitar caracteres não-renderizáveis que causam boxes.

**IDs e Pontos de Integração (manter intactos)**
- **`master-control.js` depende de IDs específicos; NÃO os renomeie:**
  - `tab-settings` — container da aba Configurações
  - `btnSaveSystemSettings` — botão de salvar (já tratado em `initUI`)
  - `settingsCategory` — select de categorias
  - `settingsContent` — área onde o conteúdo dinâmico de configurações é renderizado
  - `filterLogType`, `filterLogLevel`, `filterLogDate`, `logsList` — (logs) — já mantidos
  - `confirmModal`, `confirmTitle`, `confirmMessage`, `btnConfirmOk`, `btnConfirmCancel` — modal canônico, não altere

**i18n (traduções)**
- **Padrão:**: usar `data-i18n` nos elementos, manter chaves sem duplicidade.
- **Carregamento:**: Prefira carregar os arquivos de tradução no início da aplicação e armazenar em `localStorage` para acessos futuros.
- **Evitar duplicidade:**: Só uma inclusão de script `i18n.js` por página; verificar `window.I18nManager` se já estiver disponível.

**Performance & Escalabilidade**
- **Estratégia on-premises:**: minimizar leituras síncronas do disco/localStorage durante interações críticas.
- **Cache:**: agrupar e compactar dados de leitura e expirar caches previsivelmente.
- **Modularidade:**: isolar adaptadores de dados (`NexefiiProps`, `enterpriseBackup`) para permitir mocks e testes locais.

**Testes & Debugging**
- **Fluxos principais para validar localmente:**
  - Inicialização do `master-control` (check console for missing IDs).
  - Render de `Properties`, `Users`, `Logs` — verificar se `render*()` populam containers esperados.
  - Export / Clear logs actions (botões ligados a `exportLogs()` e `clearLogsView()`).
- **Ferramentas úteis:**: usar `console.table` e `console.group` para depuração de listas; `localStorage` inspector para verificar keys salvas.

**Deployment & Paths**
- **Caminhos recomendados:**: use caminhos absolutos para assets e scripts (`/css/...`, `/js/...`) quando for servir por um server web (evita inconsistências com subpaths).
- **Backups e migrações:** documentar as chaves de `localStorage` críticas (`nexefii_properties`, `nexefii_logs`, `nexefii_versions`).

**Boas práticas de contribuição (PRs)**
- Pequenas mudanças separadas: HTML sem JS, JS sem CSS.
- Testes manuais rápidos antes do commit: navegar pelas abas principais e acionar ações críticas.
- Evitar renomear IDs usados por `master-control.js`.

**Change Log / Authoring**
- Documento criado: 2025-11-21
- Autor: equipe NEXEFII (documentação gerada por assistente)


---
Para ajustes/adições ao documento explique quais tópicos deseja expandir (ex.: exemplos de código para `property-portal.js`, padrões de testes automatizados, ou snippets de SVG para ícones).