// Minimal page-level i18n loader used by Sprint-11 static pages
// It exposes window.__PAGE_I18N when loaded; pages may use existing global i18n instead.
(async function(){
  try{
    const path = location.pathname.split('/').pop();
    const mapping = {
      'bi-dashboard.html':'translations/bi-dashboard.json',
      'bi-reports.html':'translations/bi-reports.json',
      'exports.html':'translations/exports.json'
    };
    const file = mapping[path];
    if(!file) return;
    const res = await fetch(file);
    if(!res.ok) return;
    window.__PAGE_I18N = await res.json();
    // apply simple replacements for elements with data-i18n
    function apply(lang){
      const langKey = (lang||navigator.language||'pt').split('-')[0];
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key = el.getAttribute('data-i18n');
        const parts = key.split('.');
        let cur = window.__PAGE_I18N[langKey];
        for(const p of parts){ if(cur && p in cur) cur = cur[p]; else { cur = null; break; } }
        if(cur && typeof cur==='string'){
          if(el.tagName==='TITLE' || el.tagName==='H1' || el.tagName==='P' || el.tagName==='DIV' || el.tagName==='SPAN' || el.tagName==='LABEL' || el.tagName==='BUTTON') el.textContent = cur;
          if(el.tagName==='OPTION' || el.tagName==='A') el.textContent = cur;
        }
      });
    }
    // initial apply
    apply((localStorage.getItem('nexefii_language')||navigator.language||'pt').split('-')[0]);
    // simple language observer via storage event
    window.addEventListener('storage', (ev)=>{ if(ev.key==='nexefii_language') apply(ev.newValue); });
  }catch(e){ console.warn('i18n loader failed', e); }
})();