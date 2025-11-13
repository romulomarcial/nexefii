/**
 * Nexefii I18n Manager
 * Global internationalization system for shell and pages
 */
if (typeof I18nManager === 'undefined') {
class I18nManager {
  constructor() {
    this.translations = null;
    this.currentLang = this.loadSavedLanguage();
    this.fallbackLang = 'pt';
    this.observers = [];
  }

  /**
   * Load saved language from localStorage or detect browser language
   */
  loadSavedLanguage() {
    const saved = localStorage.getItem('nexefii_language');
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      return saved;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    return ['pt', 'en', 'es'].includes(browserLang) ? browserLang : 'pt';
  }

  /**
   * Save language preference
   */
  saveLanguage(lang) {
    localStorage.setItem('nexefii_language', lang);
  }

  /**
   * Load translations from i18n.json
   */
  async loadTranslations() {
    // Modular loader: attempts legacy monolithic, then merges segment files
    // Segments live at /i18n/{lang}/{common.json, wizard.json, ...}
    const languages = ['pt', 'en', 'es'];
  const segments = ['common', 'wizard', 'dashboard', 'rooms', 'frontdesk', 'reservations']; // extend list as more segment files are added
    const aggregated = {};

    // Legacy monolithic (non-blocking). Useful while transitioning.
    try {
      const legacyResp = await fetch('/i18n.json', { cache: 'no-store' });
      if (legacyResp.ok) {
        const legacyData = await legacyResp.json();
        Object.assign(aggregated, legacyData);
        console.log('[I18n] Legacy monolithic loaded for seeding');
      }
    } catch (e) {
      console.warn('[I18n] Legacy monolithic unavailable:', e?.message || e);
    }

    for (const lang of languages) {
      if (!aggregated[lang]) aggregated[lang] = {};
      for (const seg of segments) {
        try {
          const url = `/i18n/${lang}/${seg}.json`;
          const resp = await fetch(url, { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            this.deepMerge(aggregated[lang], data);
            console.log(`[I18n] Segment loaded: ${seg} (${lang})`);
          } else {
            console.warn(`[I18n] Segment missing: ${seg} (${lang})`);
          }
        } catch (e) {
          console.warn(`[I18n] Segment error ${seg} (${lang}):`, e?.message || e);
        }
      }
    }

    // Migration complete: using only modular segments
    this.translations = aggregated;

    // Basic validation
    const langsReady = Object.keys(this.translations);
    if (!langsReady.length) {
      console.error('[I18n] No translations loaded, falling back to defaults');
      this.translations = this.getDefaultTranslations();
      return false;
    }

    console.log('[I18n] Languages ready:', langsReady);
    return true;
  }

  /**
   * Lazy-load a missing segment at runtime (for feature pages loaded later)
   * Adds a cache marker to avoid duplicate fetches.
   */
  async loadSegment(lang, segment) {
    if (!lang) lang = this.currentLang;
    if (!this.translations) this.translations = {};
    if (!this.translations[lang]) this.translations[lang] = {};
    const cacheFlag = `__loaded_${segment}`;
    if (this.translations[lang][cacheFlag]) {
      return true; // already loaded
    }
    try {
      const resp = await fetch(`/i18n/${lang}/${segment}.json`, { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        this.deepMerge(this.translations[lang], data);
        this.translations[lang][cacheFlag] = true;
        console.log(`[I18n] Lazy segment loaded: ${segment} (${lang})`);
        this.applyToDOM();
        return true;
      } else {
        console.warn(`[I18n] Lazy segment missing: ${segment} (${lang})`);
        return false;
      }
    } catch (e) {
      console.warn(`[I18n] Lazy segment error: ${segment} (${lang})`, e?.message || e);
      return false;
    }
  }

  /**
   * Deep merge helper (mutates target)
   */
  deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach(key => {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (Array.isArray(srcVal)) {
        target[key] = srcVal.slice();
      } else if (srcVal && typeof srcVal === 'object') {
        if (!tgtVal || typeof tgtVal !== 'object') target[key] = {};
        this.deepMerge(target[key], srcVal);
      } else {
        target[key] = srcVal;
      }
    });
    return target;
  }

  /**
   * Get translation for a key path (e.g., "wizard.step1.title")
   */
  t(keyPath, interpolations = {}) {
    if (!this.translations) {
      console.warn('[I18n] Translations not loaded');
      return keyPath;
    }

    const keys = keyPath.split('.');
    let value = this.translations[this.currentLang];

    // Navigate through nested keys
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Try fallback language
        value = this.translations[this.fallbackLang];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return keyPath; // Return key if not found
          }
        }
        break;
      }
    }

    // If value is still an object, return the keyPath
    if (typeof value === 'object') {
      return keyPath;
    }

    // Interpolate variables
    if (typeof value === 'string' && Object.keys(interpolations).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return interpolations[key] !== undefined ? interpolations[key] : match;
      });
    }

    return value || keyPath;
  }

    /**
     * Register an observer callback that will be called when language changes
     * @param {function} cb
     */
    addObserver(cb) {
      if (!this.observers) this.observers = [];
      if (typeof cb === 'function' && this.observers.indexOf(cb) === -1) this.observers.push(cb);
    }

    removeObserver(cb) {
      if (!this.observers) return;
      const i = this.observers.indexOf(cb);
      if (i !== -1) this.observers.splice(i, 1);
    }

    notifyObservers() {
      if (!this.observers) return;
      this.observers.forEach(cb => {
        try { cb(); } catch (e) { console.warn('[I18n] observer error', e); }
      });
    }

    /**
     * Change current language and re-apply translations
     */
    async setLanguage(lang) {
      if (!lang || !['pt','en','es'].includes(lang)) return false;
      this.currentLang = lang;
      this.saveLanguage(lang);
      // Try to lazy-load segments for new lang if not loaded
      if (!this.translations || !this.translations[lang]) {
        await this.loadTranslations();
      }
      try { this.applyToDOM(); } catch(e) { console.warn('[I18n] applyToDOM failed on setLanguage', e); }
      this.notifyObservers();
      return true;
    }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Set language and notify observers
   */
  async setLanguage(lang) {
    if (!['pt', 'en', 'es'].includes(lang)) {
      console.warn('[I18n] Invalid language:', lang);
      return false;
    }

    this.currentLang = lang;
    this.saveLanguage(lang);
    
    // Notify observers
    this.notifyObservers();
    
    console.log('[I18n] Language changed to:', lang);
    return true;
  }

  getLanguage() {
    return this.currentLang;
  }

  /**
   * Subscribe to language changes
   */
  onChange(callback) {
    this.observers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all observers of language change
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.currentLang);
      } catch (error) {
        console.error('[I18n] Observer error:', error);
      }
    });
  }

  /**
   * Apply translations to DOM elements with data-i18n attribute
   * Usage: <span data-i18n="wizard.step1.title"></span>
   */
  applyToDOM(container = document) {
    // If caller passed null/undefined (common when element not present), silently skip
    if (container == null) return;
    if (typeof container.querySelectorAll !== 'function') {
      console.debug('[I18n] applyToDOM: invalid container or missing querySelectorAll — skipping');
      return;
    }
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    });
    console.log(`[I18n] Applied translations to ${elements.length} elements`);
  }

  /**
   * Get language options for dropdown
   */
  getLanguageOptions() {
    return [
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];
  }

  /**
   * Default translations fallback (minimal wizard translations)
   */
  getDefaultTranslations() {
    return {
      pt: {
        wizard: {
          title: "Criar Nova Propriedade",
          steps: {
            basic: "Informações Básicas",
            location: "Localização",
            type: "Tipo de Propriedade",
            config: "Configuração",
            preview: "Revisar",
            finish: "Concluir"
          }
        },
        common: {
          next: "Próximo",
          previous: "Anterior",
          cancel: "Cancelar",
          save: "Salvar",
          create: "Criar"
        }
      },
      en: {
        wizard: {
          title: "Create New Property",
          steps: {
            basic: "Basic Information",
            location: "Location",
            type: "Property Type",
            config: "Configuration",
            preview: "Review",
            finish: "Finish"
          }
        },
        common: {
          next: "Next",
          previous: "Previous",
          cancel: "Cancel",
          save: "Save",
          create: "Create"
        }
      },
      es: {
        wizard: {
          title: "Crear Nueva Propiedad",
          steps: {
            basic: "Información Básica",
            location: "Ubicación",
            type: "Tipo de Propiedad",
            config: "Configuración",
            preview: "Revisar",
            finish: "Finalizar"
          }
        },
        common: {
          next: "Siguiente",
          previous: "Anterior",
          cancel: "Cancelar",
          save: "Guardar",
          create: "Crear"
        }
      }
    };
  }
}

// Initialize global instance
if (typeof window !== 'undefined') {
  window.NEXEFII = window.NEXEFII || {};
  if (!window.NEXEFII.i18n) {
    window.NEXEFII.i18n = new I18nManager();
  }
}
}
