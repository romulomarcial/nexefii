window.i18n = {
  lang: 'pt',
  translations: {},
  load: function(page, lang) {
    return fetch(`translations/${page}.json`).then(r => r.json()).then(obj => {
      this.translations = obj[lang || this.lang] || obj['pt'];
      this.lang = lang || this.lang;
      this.apply();
    });
  },
  apply: function() {
    // Example: update all elements with data-i18n="key"
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      let val = this.translations;
      key.split('.').forEach(k => { if (val) val = val[k]; });
      if (val) el.textContent = val;
    });
  },
  setLang: function(lang) {
    this.load(this.page, lang);
  },
  init: function(page) {
    this.page = page;
    this.load(page, this.lang);
  }
};
