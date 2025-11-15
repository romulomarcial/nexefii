// Minimal i18n loader for restructured pages
(function(){
  async function load(lang){
    if(!lang) lang = localStorage.getItem('nexefii_lang') || 'pt';
    try{
      const res = await fetch('./translations/' + (document.body.dataset.page || 'app') + '.' + lang + '.json');
      if(!res.ok) throw new Error('no-translation');
      const data = await res.json();
      apply(data);
    }catch(e){
      // fallback: try pt
      try{ const r2 = await fetch('./translations/' + (document.body.dataset.page || 'app') + '.pt.json'); const d2 = await r2.json(); apply(d2);}catch(e2){}
    }
  }
  function apply(dict){
    if(!dict || typeof dict !== 'object') return;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(key && dict[key]) el.innerText = dict[key];
    });
  }
  window.addEventListener('DOMContentLoaded', ()=>{ load(); });
  window.NexefiiI18n = { load };
})();
// Simple i18n loader used by sprint-13 restructured pages
(function(){
  async function loadTranslations(page){
    const lang = (localStorage.getItem('nexefii_lang') || navigator.language || 'pt').split('-')[0];
    const candidates = [lang, 'pt'];
    for(const l of candidates){
      try{
        const path = `translations/${page}.${l}.json`;
        const resp = await fetch(path, {cache:'no-store'});
        if(!resp.ok) continue;
        const data = await resp.json();
        applyI18n(data);
        return;
      }catch(e){ /* try next */ }
    }
  }

  function applyI18n(data){
    if(!data) return;
    // apply top-level keys to elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = lookupKey(data, key);
      if(typeof val === 'string') el.innerText = val;
    });
  }

  function lookupKey(obj, key){
    // support dot notation
    if(!key) return null;
    const parts = key.split('.');
    let cur = obj;
    for(const p of parts){ if(cur && p in cur) cur = cur[p]; else return null; }
    return cur;
  }

  window.__nexefii_i18n = { loadTranslations };

  document.addEventListener('DOMContentLoaded', ()=>{
    const page = document.body && document.body.dataset && document.body.dataset.page;
    if(page) loadTranslations(page);
  });
})();
