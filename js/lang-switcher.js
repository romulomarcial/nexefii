// Global language switcher: injects a small UI and wires to window.NEXEFII.i18n
(function() {
  function createSwitcher() {
    try {
      const container = document.createElement('div');
      container.id = 'global-lang-switcher';
      container.style.position = 'fixed';
      container.style.top = '10px';
      container.style.right = '10px';
      container.style.zIndex = 9999;
      container.style.display = 'flex';
      container.style.gap = '6px';

      const langs = [ {code: 'pt', label: 'PT'}, {code: 'en', label: 'EN'}, {code: 'es', label: 'ES'} ];
      langs.forEach(l => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-lang-switcher';
        btn.dataset.lang = l.code;
        btn.textContent = l.label;
        btn.style.padding = '6px 8px';
        btn.style.border = '1px solid #ddd';
        btn.style.background = 'white';
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
          try {
            const i18n = window.NEXEFII && window.NEXEFII.i18n;
            if (i18n && typeof i18n.setLanguage === 'function') i18n.setLanguage(btn.dataset.lang);
            try { localStorage.setItem('nexefii_lang', btn.dataset.lang); } catch(e) {}
            updateActive(btn.dataset.lang);
          } catch(e) { console.warn('lang switch failed', e); }
        });
        container.appendChild(btn);
      });

      document.body && document.body.appendChild(container);
      // initial active state
      const saved = (window.NEXEFII && window.NEXEFII.i18n && window.NEXEFII.i18n.getLanguage) ? (window.NEXEFII.i18n.getLanguage() || localStorage.getItem('nexefii_lang')) : localStorage.getItem('nexefii_lang');
      updateActive(saved || 'pt');

      // subscribe to i18n changes if available
      try {
        const i18n = window.NEXEFII && window.NEXEFII.i18n;
        if (i18n && typeof i18n.onChange === 'function') {
          i18n.onChange((lang) => updateActive(lang));
        }
      } catch(e) {}

      function updateActive(lang) {
        const btns = document.querySelectorAll('#global-lang-switcher [data-lang]');
        btns.forEach(b => {
          if (b.dataset.lang === lang) {
            b.style.borderColor = '#E42121';
            b.style.background = '#FFF5F5';
            b.style.fontWeight = '700';
          } else {
            b.style.borderColor = '#ddd';
            b.style.background = 'white';
            b.style.fontWeight = '400';
          }
        });
      }
    } catch (e) { /* fail silently */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createSwitcher);
  else createSwitcher();
})();
