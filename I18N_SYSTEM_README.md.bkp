# 🌐 Internationalization System (i18n) - IluxSys

---
**📄 Documento**: I18N_SYSTEM_README.md  
**📦 Versão**: 2.0.0  
**📅 Última Atualização**: 07/11/2025 - 15:30 BRT  
**👤 Autor**: IluxSys Development Team  
**🔄 Status**: ✅ Atualizado e Sincronizado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Idiomas Suportados](#idiomas-suportados)
3. [Arquitetura](#arquitetura)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Deep Merge System](#deep-merge-system)
6. [API Reference](#api-reference)
7. [Como Usar](#como-usar)
8. [Adicionar Novos Idiomas](#adicionar-novos-idiomas)
9. [Changelog](#changelog)

---

## Visão Geral

O **Sistema de Internacionalização (i18n)** do IluxSys permite suporte multi-idioma com carregamento dinâmico, deep merge de traduções e aplicação automática via atributos HTML.

### Características:

- ✅ 3 idiomas suportados (Português, Inglês, Espanhol)
- ✅ Deep merge de arquivos i18n (main + enterprise)
- ✅ Carregamento assíncrono e dinâmico
- ✅ Aplicação automática via `data-i18n`
- ✅ Placeholders traduzíveis via `data-i18n-placeholder`
- ✅ Fallback para idioma padrão (pt)
- ✅ Cache de traduções no localStorage

---

## Idiomas Suportados

### 🇧🇷 Português (pt) - Padrão
- Código: `pt`
- Flag: 🇧🇷
- Arquivo principal: `i18n.json`
- Arquivo enterprise: `i18n-enterprise-pt.json`

### 🇺🇸 Inglês (en)
- Código: `en`
- Flag: 🇺🇸
- Arquivo principal: `i18n.json`
- Arquivo enterprise: `i18n-enterprise-en.json`

### 🇪🇸 Espanhol (es)
- Código: `es`
- Flag: 🇪🇸
- Arquivo principal: `i18n.json`
- Arquivo enterprise: `i18n-enterprise-es.json`

---

## Arquitetura

### Fluxo de Carregamento:

```
Inicialização
    ↓
loadI18N() → master-control.js
    ↓
Fetch i18n.json (principal)
    ↓
Fetch i18n-enterprise-{locale}.json
    ↓
Deep Merge (main + enterprise)
    ↓
Cache no localStorage
    ↓
applyTranslations()
    ↓
DOM atualizado com traduções
```

### Sistema de Deep Merge:

O sistema combina traduções do arquivo principal com arquivos enterprise sem sobrescrever, usando merge recursivo:

```javascript
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  return Object.assign(target || {}, source);
}
```

**Exemplo:**

```javascript
// i18n.json (main)
{
  "master": {
    "title": "Master Panel",
    "tabs": {
      "overview": "Overview"
    }
  }
}

// i18n-enterprise-en.json
{
  "master": {
    "tabs": {
      "propertyBackups": "Property Backups",
      "generalBackups": "General Structure"
    }
  }
}

// Resultado do merge:
{
  "master": {
    "title": "Master Panel",
    "tabs": {
      "overview": "Overview",
      "propertyBackups": "Property Backups",
      "generalBackups": "General Structure"
    }
  }
}
```

---

## Estrutura de Arquivos

### i18n.json (Principal)

Contém traduções básicas do sistema para todos os idiomas:

```json
{
  "pt": {
    "master": {
      "title": "Painel Master",
      "badge": "SUPER ADMIN",
      "logout": "Sair"
    }
  },
  "en": {
    "master": {
      "title": "Master Panel",
      "badge": "SUPER ADMIN",
      "logout": "Logout"
    }
  },
  "es": {
    "master": {
      "title": "Panel Maestro",
      "badge": "SUPER ADMIN",
      "logout": "Salir"
    }
  }
}
```

### i18n-enterprise-pt.json

Traduções enterprise em Português:

```json
{
  "master": {
    "tabs": {
      "propertyBackups": "Backup de Propriedades",
      "generalBackups": "Estrutura Geral",
      "releases": "Releases & Rollback"
    },
    "propertyBackups": {
      "metricsTitle": "Métricas de Backup por Propriedade",
      "totalBackups": "Total de Backups",
      "last24h": "Últimas 24h",
      "successRate": "Taxa de Sucesso"
    }
  }
}
```

### i18n-enterprise-en.json

Traduções enterprise em Inglês:

```json
{
  "master": {
    "tabs": {
      "propertyBackups": "Property Backups",
      "generalBackups": "General Structure",
      "releases": "Releases & Rollback"
    },
    "propertyBackups": {
      "metricsTitle": "Per-Property Backup Metrics",
      "totalBackups": "Total Backups",
      "last24h": "Last 24h",
      "successRate": "Success Rate"
    }
  }
}
```

### i18n-enterprise-es.json

Traduções enterprise em Espanhol:

```json
{
  "master": {
    "tabs": {
      "propertyBackups": "Backups de Propiedades",
      "generalBackups": "Estructura General",
      "releases": "Releases & Rollback"
    },
    "propertyBackups": {
      "metricsTitle": "Métricas de Backup por Propiedad",
      "totalBackups": "Backups Totales",
      "last24h": "Últimas 24h",
      "successRate": "Tasa de Éxito"
    }
  }
}
```

---

## Deep Merge System

### Implementação (master-control.js):

```javascript
async loadI18N(locale = 'pt') {
  try {
    // 1. Carregar i18n.json principal
    const mainResponse = await fetch('./i18n.json');
    const mainI18n = await mainResponse.json();
    
    // 2. Carregar i18n enterprise específico do locale
    let enterpriseI18n = {};
    try {
      const enterpriseResponse = await fetch(`./i18n-enterprise-${locale}.json`);
      if (enterpriseResponse.ok) {
        enterpriseI18n = await enterpriseResponse.json();
      }
    } catch (e) {
      console.warn(`Could not load enterprise i18n for ${locale}`, e);
    }
    
    // 3. Deep merge
    const mergedTranslations = this.deepMerge(
      mainI18n[locale] || {},
      enterpriseI18n
    );
    
    // 4. Cachear
    this.translations = mergedTranslations;
    localStorage.setItem('cached_i18n', JSON.stringify(mergedTranslations));
    localStorage.setItem('i18n_locale', locale);
    
    // 5. Aplicar traduções
    this.applyTranslations();
    
  } catch (error) {
    console.error('Error loading i18n:', error);
    // Fallback para português
    if (locale !== 'pt') {
      await this.loadI18N('pt');
    }
  }
}

deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (this.isObject(target) && this.isObject(source)) {
    Object.keys(source).forEach(key => {
      if (this.isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = this.deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
```

---

## API Reference

### Métodos Principais:

#### `loadI18N(locale = 'pt')`

Carrega traduções para o locale especificado.

**Parâmetros:**
- `locale` (string): Código do idioma ('pt', 'en', 'es')

**Comportamento:**
1. Fetch do i18n.json principal
2. Fetch do i18n-enterprise-{locale}.json
3. Deep merge das traduções
4. Cache no localStorage
5. Aplicação automática no DOM

**Exemplo:**
```javascript
await masterCtrl.loadI18N('en'); // Carregar inglês
```

#### `applyTranslations()`

Aplica traduções carregadas aos elementos HTML.

**Busca elementos com:**
- `data-i18n="key.path"` - Para textos
- `data-i18n-placeholder="key.path"` - Para placeholders

**Exemplo HTML:**
```html
<h1 data-i18n="master.title">Título padrão</h1>
<input data-i18n-placeholder="propertyBackups.search" placeholder="Search...">
```

#### `t(key)`

Obtém tradução por chave (helper function).

**Parâmetros:**
- `key` (string): Caminho da chave (ex: 'master.tabs.overview')

**Retorno:**
- string: Tradução encontrada ou a própria chave se não encontrada

**Exemplo:**
```javascript
const title = masterCtrl.t('master.title');
// Retorna: "Painel Master" (pt) ou "Master Panel" (en)
```

#### `switchLanguage(locale)`

Troca idioma dinamicamente.

**Parâmetros:**
- `locale` (string): Novo idioma ('pt', 'en', 'es')

**Comportamento:**
1. Carrega novo idioma via loadI18N()
2. Reaplica todas as traduções
3. Atualiza flag/indicador de idioma

**Exemplo:**
```javascript
masterCtrl.switchLanguage('es'); // Trocar para espanhol
```

---

## Como Usar

### No HTML:

#### Traduzir Textos:

```html
<!-- Título -->
<h1 data-i18n="master.title">Título Padrão</h1>

<!-- Botão -->
<button data-i18n="common.save">Salvar</button>

<!-- Span dentro de elemento -->
<label>
  <span data-i18n="propertyBackups.selectProperty">Selecionar</span>
</label>

<!-- Nested keys -->
<span data-i18n="master.tabs.propertyBackups">Property Backups</span>
```

#### Traduzir Placeholders:

```html
<!-- Input -->
<input 
  type="text" 
  data-i18n-placeholder="propertyBackups.search"
  placeholder="Buscar por propriedade...">

<!-- Textarea -->
<textarea 
  data-i18n-placeholder="generalBackups.description"
  placeholder="Descrição..."></textarea>
```

#### Traduzir Options:

```html
<select>
  <option value="all" data-i18n="propertyBackups.filterAll">Todos</option>
  <option value="full" data-i18n="propertyBackups.filterFull">Completo</option>
  <option value="incremental" data-i18n="propertyBackups.filterIncremental">Incremental</option>
</select>
```

### No JavaScript:

#### Obter Tradução:

```javascript
// Usando método t()
const title = this.t('master.title');
console.log(title); // "Painel Master"

// Usando translations diretamente
const translations = this.translations;
const tabName = translations.master.tabs.propertyBackups;
console.log(tabName); // "Backup de Propriedades"
```

#### Tradução Dinâmica:

```javascript
// Criar elemento com tradução
const button = document.createElement('button');
button.setAttribute('data-i18n', 'common.save');
button.textContent = this.t('common.save');
document.body.appendChild(button);

// Reaplicar traduções após adicionar elementos
this.applyTranslations();
```

#### Trocar Idioma:

```javascript
// HTML para seletor de idioma
<select id="languageSelector">
  <option value="pt">🇧🇷 Português</option>
  <option value="en">🇺🇸 English</option>
  <option value="es">🇪🇸 Español</option>
</select>

// JavaScript
document.getElementById('languageSelector').addEventListener('change', (e) => {
  masterCtrl.switchLanguage(e.target.value);
});
```

---

## Adicionar Novos Idiomas

### Passo 1: Criar Arquivo i18n-enterprise-{locale}.json

Exemplo para Francês (fr):

```json
{
  "master": {
    "tabs": {
      "propertyBackups": "Sauvegardes de Propriété",
      "generalBackups": "Structure Générale",
      "releases": "Versions & Retour"
    },
    "propertyBackups": {
      "metricsTitle": "Métriques de Sauvegarde par Propriété",
      "totalBackups": "Sauvegardes Totales",
      "last24h": "Dernières 24h",
      "successRate": "Taux de Réussite"
    }
  }
}
```

### Passo 2: Adicionar ao i18n.json Principal

```json
{
  "fr": {
    "master": {
      "title": "Panneau Maître",
      "badge": "SUPER ADMIN",
      "logout": "Déconnexion"
    }
  }
}
```

### Passo 3: Atualizar Seletor de Idioma

```html
<select id="languageSelector">
  <option value="pt">🇧🇷 Português</option>
  <option value="en">🇺🇸 English</option>
  <option value="es">🇪🇸 Español</option>
  <option value="fr">🇫🇷 Français</option>
</select>
```

### Passo 4: Testar

```javascript
await masterCtrl.loadI18N('fr');
```

---

## Estrutura de Chaves

### Padrão de Nomenclatura:

```
{section}.{subsection}.{key}
```

**Exemplos:**
- `master.title` - Título do Master Panel
- `master.tabs.overview` - Aba de visão geral
- `propertyBackups.metricsTitle` - Título das métricas
- `common.save` - Botão salvar (comum)
- `common.cancel` - Botão cancelar (comum)

### Seções Principais:

#### master
- Traduções do Master Control Panel
- Subseções: tabs, badge, logout

#### propertyBackups
- Traduções de Property Backups
- Subseções: metrics, catalog, restore, scheduling

#### generalBackups
- Traduções de General Structure Backups
- Subseções: components, metrics

#### releases
- Traduções de Releases & Rollback

#### common
- Traduções comuns (botões, mensagens)
- Exemplos: save, cancel, delete, confirm

#### errors
- Mensagens de erro traduzidas

#### success
- Mensagens de sucesso traduzidas

---

## Cache e Performance

### LocalStorage Cache:

O sistema cacheia traduções para melhorar performance:

```javascript
// Chaves de cache
'cached_i18n'      // Traduções merged
'i18n_locale'      // Idioma atual
'i18n_main'        // i18n.json completo
'i18n_enterprise_pt'  // Enterprise PT
'i18n_enterprise_en'  // Enterprise EN
'i18n_enterprise_es'  // Enterprise ES
```

### Estratégia de Carregamento:

1. **Primeira carga:**
   - Fetch de todos os arquivos
   - Deep merge
   - Cache no localStorage

2. **Cargas subsequentes:**
   - Tentar ler do cache primeiro
   - Se não houver ou for muito antigo, re-fetch
   - Sempre fazer deep merge

3. **Troca de idioma:**
   - Carrega novo idioma
   - Merge com cache existente
   - Atualiza DOM instantaneamente

---

## Changelog

### v2.0.0 (07/11/2025)

**✨ Novas Funcionalidades:**
- ✅ Sistema de deep merge implementado
- ✅ Arquivos enterprise separados (pt/en/es)
- ✅ Suporte para 3 idiomas completo
- ✅ Cache inteligente no localStorage
- ✅ Tradução de placeholders via data-i18n-placeholder
- ✅ Fallback automático para idioma padrão

**🔧 Melhorias:**
- Performance otimizada com cache
- Deep merge recursivo sem sobrescrever
- Feature detection para idiomas não suportados
- Aplicação automática de traduções no DOM

**🐛 Correções:**
- Emoji duplicado no botão de logout corrigido
- Renomeado "Tenant Backups" → "Property Backups" em todos os idiomas

**📚 Documentação:**
- README completo criado
- Exemplos de uso documentados
- Guia para adicionar novos idiomas

### v1.0.0 (Outubro 2025)
- Sistema i18n básico implementado
- Suporte apenas para português

---

## 🔗 Links Relacionados

- [Master Control README](./MASTER_CONTROL_README.md)
- [Enterprise Backup System README](./ENTERPRISE_BACKUP_SYSTEM_README.md)

---

**Desenvolvido por IluxSys Development Team**  
**© 2025 IluxSys - Todos os direitos reservados**
