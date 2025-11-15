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
// i18n-loader.js - Sprint 13 review version
console.log('[i18n] loader boot');

function resolveLang() {
  const htmlLang = (document.documentElement.lang || 'pt-BR').toLowerCase();
  if (htmlLang.startsWith('en')) return 'en';
  if (htmlLang.startsWith('es')) return 'es';
  return 'pt';
}

async function loadPageI18n() {
  const page = document.body.dataset.page;
  const lang = resolveLang();
  if (!page) {
    console.warn('[i18n] body[data-page] não definido, não vou carregar dicionário.');
    return;
  }

  const path = `translations/${page}.${lang}.json`;
  console.log('[i18n] carregando', path);

  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    const dict = await res.json();

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (key && dict[key]) {
        el.textContent = dict[key];
      }
    });

    console.log('[i18n] aplicado para página', page, 'lang', lang);
  } catch (err) {
    console.warn('[i18n] falha ao carregar', path, err);
  }
}

document.addEventListener('DOMContentLoaded', loadPageI18n);