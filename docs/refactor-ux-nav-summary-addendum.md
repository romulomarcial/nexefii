- **Propriedades tab inner button:** Propriedades tab inner 'Criar Propriedade' button wired to reuse the header `btnCreateProperty` wizard flow (no layout or markup changes).
 
- **I18n boot fix:** Ensured `I18nManager.js` is loaded before usage in `master-control.html` and wrapped I18n-dependent init in `DOMContentLoaded` + safety polling to eliminate `I18nManager is not defined` at boot.
 
- **Portal & Test Local:**
	- Fixed mojibake in local test validation logs using UTF-8 safe Unicode escapes and corrected UI strings in `property-local-test-generator.js` and `property-publish-helpers.js`.
	- Added a minimal `js/property-portal.js` to render `index.html?property=<key>` with a basic landing (name, ID, modules, actions).
	- Updated portal action URLs: `Abrir Dashboard` now opens `/pages/property-dashboard.html?propertyId=<key>` and `Voltar` returns to `/master-control.html?selectedProperty=<key>`.
	- Ensured `index.html` includes the portal script and page encoding is UTF-8.



- **DemoData (saída reduzida + proteção contra quota):**
	- Introduzido modo demo `light` para reduzir volume de dados gerados pelo `DemoDataGenerator` ao inserir dados de demonstração (menos dias de histórico/futuro por padrão).
	- `property-publish-helpers.js` passa `demoMode: 'light'` nas chamadas a `insertDemoData` e envolve o gerador com um wrapper que trata `QuotaExceededError` e alerta o usuário de forma amigável.
	- Recomenda-se adaptar `demo-data-generator.js` para respeitar `options.demoMode` e usar `safeSetItem` ao gravar grandes blobs no `localStorage`.