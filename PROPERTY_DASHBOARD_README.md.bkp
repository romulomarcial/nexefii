# 🏨 Property Dashboard System - Documentação

**Versão**: 1.0.0  
**Data**: 07/11/2025  
**Sistema**: Dashboard Dinâmico de Propriedades

---

## 📋 Visão Geral

Sistema completamente reestruturado de exibição de propriedades no `index.html`, com foco em:

- ✅ **Performance**: Cache inteligente, lazy loading de imagens
- ✅ **Escalabilidade**: Suporte a múltiplas propriedades sem degradação
- ✅ **Segurança**: Validação de dados, sanitização XSS, controle de permissões
- ✅ **UX**: Comparativos automáticos, métricas em tempo real, layout moderno

---

## 🎯 Funcionalidades Implementadas

### 1. Renderização Dinâmica de Cards

**Antes**: Cards hardcoded em HTML (3 cards fixos)
**Agora**: Cards renderizados dinamicamente com base em:
- Propriedades **ativas** e **implantadas** (deployed = true)
- Dados **completos** (validação obrigatória)
- **Permissões do usuário** (role-based access control)

### 2. Sistema de Permissões

**Níveis de Acesso**:
- **Master/Admin**: Vê todas as propriedades implantadas
- **Manager**: Vê apenas propriedades na lista `properties` do usuário
- **User**: Acesso restrito conforme configuração

**Exemplos de Usuários**:
```javascript
// Master - vê TODAS as propriedades
{
  username: 'master',
  role: 'master',
  properties: [] // Empty = acesso total
}

// Demo - vê apenas São Paulo e Miami
{
  username: 'demo',
  role: 'manager',
  properties: ['iluxSaoPaulo', 'iluxMiami']
}
```

### 3. Dashboard Comparativo

Quando usuário tem acesso a **2 ou mais propriedades**, exibe automaticamente:

**Métricas Totais**:
- 🏨 Total de quartos (vendidos + disponíveis)
- 💰 Receita total consolidada
- 📊 Taxa média de ocupação
- ⚠️ Total de alertas ativos

**Análise de Performance**:
- 🏆 Melhor desempenho (maior ocupação)
- 📉 Menor desempenho (menor ocupação)

### 4. Validação de Dados

**Campos Obrigatórios**:
```javascript
{
  key: 'iluxSaoPaulo',                    // ✅ Obrigatório
  name: 'iLux São Paulo',                 // ✅ Obrigatório
  modulesPurchased: [...],                // ✅ Obrigatório (array não vazio)
  userCapacity: '50to100',                // ✅ Obrigatório
  deployed: true,                         // ✅ Obrigatório (boolean)
  active: true,                           // ✅ Obrigatório (boolean)
  roomCount: 56,                          // ⚡ Recomendado
  location: {...},                        // ⚡ Recomendado
  imageUrl: 'assets/hotel_sp.jpg'         // ⚡ Recomendado
}
```

**Propriedades sem dados completos = NÃO APARECEM no dashboard**

### 5. Integração com Sistemas Existentes

**Botão "Abrir Controle"**:
- Chama função `openControl()` do `app.js`
- Abre modal de controle da propriedade
- Funcionalidade preservada

**Botão "🔍 Testar Local"**:
- Integra com `testPropertyLocally()` do Master Control
- Abre simulador HTML completo da propriedade
- Permite validação antes de publicar

### 6. Sistema de Cache

**Cache Manager**:
- TTL: 5 minutos
- Invalidação por padrão
- Clear manual disponível

**Benefícios**:
- Menos reads no localStorage
- Melhor performance
- Dados sempre frescos

### 7. Segurança

**Sanitização XSS**:
```javascript
SecurityManager.sanitizeHTML(userInput)
// Previne injeção de código malicioso
```

**Validação de Permissões**:
```javascript
SecurityManager.validateUserPermissions(user, propertyKey)
// Verifica role-based access
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:

**1. `property-dashboard-manager.js` (573 linhas)**
- SecurityManager: Validação e sanitização
- CacheManager: Gerenciamento de cache
- DataManager: Carregamento de dados
- MetricsCalculator: Cálculos e comparativos
- UIRenderer: Renderização de HTML
- PropertyDashboard: Controller principal

**2. `css/property-dashboard.css` (486 linhas)**
- Estilos para occupancy badges
- Cards de métricas
- Dashboard comparativo
- Performance cards
- Empty state
- Responsividade
- Acessibilidade (prefers-reduced-motion, high-contrast)

**3. `js/translations/dashboard.json`**
- Traduções pt/en/es
- Todas as chaves do novo dashboard
- Mensagens de erro/empty state

### Arquivos Modificados:

**4. `index.html`**
- Adicionado CSS: `css/property-dashboard.css`
- Adicionado JS: `property-dashboard-manager.js`
- Limpeza da seção `.hotels` (agora renderizada dinamicamente)
- Placeholder de loading

**5. `properties.js`**
- Adicionados campos: `roomCount`, `location`, `deployedAt`, `deployedUrl`
- iluxSaoPaulo: `deployed = true` (para teste)
- iluxMiami: `deployed = true` (para teste)
- iluxRioDeJaneiro: `deployed = false` (não aparece)

**6. `auth.js`**
- Adicionado campo `properties` array aos usuários
- Master/Admin: `properties = []` (acesso total)
- Criado usuário demo: `properties = ['iluxSaoPaulo', 'iluxMiami']`

---

## 🧪 Guia de Testes

### Passo 1: Limpar Cache

```powershell
# No navegador (Chrome/Edge/Firefox)
CTRL + SHIFT + DELETE
# Selecionar: "Últimas 24 horas" + "Cache" + "Cookies"
# Clicar em "Limpar dados"

# OU simplesmente
CTRL + F5  # Hard reload
```

### Passo 2: Login com Usuários Diferentes

**Teste A - Master (vê tudo)**:
```
Username: master
Password: Master2025!@#$
Resultado esperado: 2 cards (São Paulo + Miami)
Comparativo: Visível (múltiplas propriedades)
```

**Teste B - Admin (vê tudo)**:
```
Username: admin
Password: admin12345!@#
Resultado esperado: 2 cards (São Paulo + Miami)
Comparativo: Visível
```

**Teste C - Demo (permissões limitadas)**:
```
Username: demo
Password: demo123
Resultado esperado: 2 cards (São Paulo + Miami apenas)
Comparativo: Visível
```

**Teste D - Usuário sem permissões**:
```
Criar novo usuário sem array properties preenchido
Resultado esperado: Empty state (nenhuma propriedade)
```

### Passo 3: Verificar Cards

**Elementos Visíveis**:
- ✅ Imagem da propriedade (lazy loading)
- ✅ Badge de ocupação (canto superior direito)
  - Verde: >= 80%
  - Amarelo: 60-79%
  - Vermelho: < 60%
- ✅ Nome da propriedade
- ✅ Status online (dot verde pulsante)
- ✅ Métricas (4 itens):
  - 🛏️ Quartos vendidos/total
  - 💰 Receita
  - 📊 ADR
  - ⚠️ Alertas (se > 0)
- ✅ Badges de módulos (coloridos, gradient roxo)
- ✅ Botões:
  - "Abrir Controle" (primário, roxo)
  - "🔍 Testar Local" (ghost, cinza)

### Passo 4: Testar Interações

**Botão "Abrir Controle"**:
1. Clicar no botão
2. Verificar que modal de controle abre
3. Verificar que título mostra nome correto da propriedade
4. Fechar modal

**Botão "🔍 Testar Local"**:
1. Clicar no botão
2. NOTA: Função só funciona na página master-control.html
3. Em index.html mostra alert: "Sistema de teste local não disponível nesta página"
4. Isso é comportamento esperado (integração futura)

### Passo 5: Verificar Dashboard Comparativo

**Se 2+ propriedades visíveis**:

1. Verificar seção "📊 Visão Geral" aparece
2. Verificar cards:
   - Total de Quartos (soma de todas)
   - Receita Total (soma consolidada)
   - Ocupação Média (percentual geral)
   - Total de Alertas (se houver)
3. Verificar seção de performance:
   - 🏆 Melhor Desempenho (maior ocupação)
   - 📉 Menor Desempenho (menor ocupação)

### Passo 6: Testar Responsividade

**Desktop (> 768px)**:
- Cards em grid (múltiplas colunas)
- Métricas em 2 colunas

**Mobile (< 768px)**:
- Cards em coluna única
- Métricas em coluna única
- Badge de ocupação menor
- Touch targets adequados

### Passo 7: Verificar Console

Abrir DevTools (F12) → Console

**Mensagens esperadas**:
```
✅ Property Dashboard Manager loaded
🚀 Initializing Property Dashboard...
✅ Found 2 authorized properties
```

**Se houver erros**:
- Copiar mensagem completa
- Verificar qual arquivo
- Verificar linha do erro

### Passo 8: Testar Traduções

**Trocar idioma**:
1. Selecionar "English" no seletor de idioma
2. Verificar se textos mudam:
   - "Quartos" → "Rooms"
   - "Receita" → "Revenue"
   - "Módulos" → "Modules"
   - "Abrir Controle" → "Open Control"

3. Selecionar "Español"
4. Verificar traduções espanholas

### Passo 9: Testar Performance

**Chrome DevTools**:
1. F12 → Performance tab
2. Clicar em Record (círculo vermelho)
3. Recarregar página (F5)
4. Parar gravação após carregamento
5. Verificar:
   - Tempo de renderização < 500ms
   - Sem long tasks (> 50ms)
   - Layout shifts mínimos

**Lighthouse**:
1. F12 → Lighthouse tab
2. Selecionar "Performance"
3. Generate report
4. Score esperado: > 90

### Passo 10: Testar Acessibilidade

**Teclado**:
1. Pressionar TAB repetidamente
2. Verificar que:
   - Foco visível em todos os elementos
   - Ordem lógica de navegação
   - Botões acionáveis com ENTER/SPACE

**Screen Reader** (opcional):
1. Ativar NVDA/JAWS (Windows) ou VoiceOver (Mac)
2. Navegar pelos cards
3. Verificar leitura compreensível

---

## 🐛 Troubleshooting

### Problema: Cards não aparecem

**Possíveis causas**:
1. Propriedades com `deployed = false`
2. Usuário sem permissões
3. Dados incompletos

**Solução**:
```javascript
// No Console do navegador (F12)
localStorage.getItem('iluxsys_properties')
// Verificar se tem deployed: true

localStorage.getItem('currentUser')
// Verificar campo "properties"
```

### Problema: Comparativo não aparece

**Causa**: Menos de 2 propriedades visíveis

**Solução**: Verificar permissões do usuário e status deployed das propriedades

### Problema: Erro "Cannot read properties of undefined"

**Causa**: Cache desatualizado

**Solução**:
```javascript
// No Console
PropertyDashboard.refresh()
// OU
localStorage.clear()
// Depois F5
```

### Problema: Botão "Testar Local" não funciona

**Causa**: Função não disponível em index.html

**Solução**: Comportamento esperado. Para testar:
1. Ir para `master-control.html`
2. Aba "Properties"
3. Clicar no 🏨 icon
4. "Testar Localmente"

### Problema: Imagens não carregam

**Verificar**:
1. Arquivos existem em `assets/hotel_*.jpg`
2. Caminhos corretos no properties.js
3. Console mostra erro 404

**Solução temporária**:
```javascript
// Usar placeholder se imagem não existir
imageUrl: 'assets/hotel_default.jpg'
// OU URL externa
imageUrl: 'https://via.placeholder.com/400x250'
```

---

## 🚀 Próximos Passos (Roadmap)

### v1.1 (Curto Prazo)
- [ ] Integração com API real (substituir métricas simuladas)
- [ ] WebSocket para métricas em tempo real
- [ ] Filtros (por módulo, por ocupação, por receita)
- [ ] Ordenação (alfabética, ocupação, receita)
- [ ] Busca de propriedades

### v1.2 (Médio Prazo)
- [ ] Gráficos de tendência (Chart.js)
- [ ] Export de relatórios (PDF, Excel)
- [ ] Notificações push de alertas
- [ ] Modo escuro (dark theme)
- [ ] PWA (Progressive Web App)

### v1.3 (Longo Prazo)
- [ ] Dashboards customizáveis (drag & drop)
- [ ] Widgets de terceiros
- [ ] Integração com BI tools
- [ ] Multi-tenant isolado (data segregation)
- [ ] Analytics avançado (ML predictions)

---

## 📊 Métricas de Performance

**Targets Atuais**:
- ✅ First Contentful Paint: < 1.5s
- ✅ Time to Interactive: < 3s
- ✅ Total Bundle Size: < 500KB
- ✅ Cache Hit Rate: > 80%

**Monitoramento**:
```javascript
// Performance marks
performance.mark('dashboard-start');
PropertyDashboard.init();
performance.mark('dashboard-end');
performance.measure('dashboard-init', 'dashboard-start', 'dashboard-end');
console.table(performance.getEntriesByType('measure'));
```

---

## 🔒 Segurança

### Validações Implementadas

**1. XSS Protection**:
```javascript
SecurityManager.sanitizeHTML(userInput)
// Escapa HTML especial characters
```

**2. Role-Based Access Control**:
```javascript
SecurityManager.validateUserPermissions(user, propertyKey)
// Verifica role e array properties
```

**3. Data Validation**:
```javascript
SecurityManager.validatePropertyData(property)
// Verifica campos obrigatórios e tipos
```

### Boas Práticas

- ✅ Nunca confiar em dados do cliente
- ✅ Validar no frontend E backend
- ✅ Sanitizar TODOS os inputs
- ✅ Usar Content Security Policy (CSP)
- ✅ HTTPS obrigatório em produção
- ✅ Rate limiting em APIs
- ✅ Logs de auditoria

---

## 📞 Suporte

**Documentação**:
- README principal: `MASTER_CONTROL_README.md`
- Este documento: `PROPERTY_DASHBOARD_README.md`

**Debug**:
```javascript
// Ativar modo debug
PropertyDashboard.debug = true;

// Ver cache
console.table(CacheManager.cache);

// Ver propriedades carregadas
console.table(PropertyDashboard.properties);

// Refresh manual
PropertyDashboard.refresh();
```

---

**Versão**: 1.0.0  
**Última Atualização**: 07/11/2025  
**Status**: ✅ Pronto para Testes
