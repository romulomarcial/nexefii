- **Propriedades tab inner button:** Propriedades tab inner 'Criar Propriedade' button wired to reuse the header `btnCreateProperty` wizard flow (no layout or markup changes).
 
- **I18n boot fix:** Ensured `I18nManager.js` is loaded before usage in `master-control.html` and wrapped I18n-dependent init in `DOMContentLoaded` + safety polling to eliminate `I18nManager is not defined` at boot.