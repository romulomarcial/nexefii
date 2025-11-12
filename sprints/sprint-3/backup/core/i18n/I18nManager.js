/**
 * Nexefii I18n Manager
 * Global internationalization system for shell and pages
 */

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
    try {
      const response = await fetch('/i18n.json', { cache: 'no-store' });
      this.translations = await response.json();
      console.log('[I18n] Translations loaded:', Object.keys(this.translations));
      return true;
    } catch (error) {
      console.error('[I18n] Failed to load translations:', error);
      this.translations = this.getDefaultTranslations();
      return false;
    }
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
  window.NEXEFII.i18n = new I18nManager();
}
