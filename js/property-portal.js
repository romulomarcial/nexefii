(function(){
  // Resolve property key from URL with fallbacks: propertyKey, property, propertyId, id
  const _url = new URL(window.location.href);
  const key = _url.searchParams.get('propertyKey') || _url.searchParams.get('property') || _url.searchParams.get('propertyId') || _url.searchParams.get('id');
  // canonical name inside this module
  const propertyKey = key;
  console.log('[Portal] URL propertyKey =', propertyKey);

  function safeGetProperty(k){
    try{ return window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function' ? window.NexefiiProps.getProperty(k) : null; }catch(e){return null}
  }

  const prop = safeGetProperty(key);
  console.log('[Portal] resolved property from NexefiiProps:', !!prop, key);

  // Minimal i18n for the portal (will not overwrite any existing i18n implementation)
  (function(){
    try{
      window.NEXEFII = window.NEXEFII || {};
      if (!window.NEXEFII.i18n) {
        const resources = {
          pt: {
            'portal.title_not_found': 'Propriedade não encontrada',
            'portal.not_found_desc': 'Não foi possível localizar a propriedade solicitada: {key}',
            'portal.not_found_help': 'Verifique o identificador ou retorne à lista de propriedades.',
            'portal.modulesTitle': 'Módulos adquiridos',
            'portal.btnOpenDashboard': 'Abrir Dashboard',
            'portal.btnOpenProdUrl': 'Abrir URL de Produção',
            'portal.btnBack': 'Voltar'
          },
          en: {
            'portal.title_not_found': 'Property not found',
            'portal.not_found_desc': 'Could not find requested property: {key}',
            'portal.not_found_help': 'Check the identifier or return to the properties list.',
            'portal.modulesTitle': 'Purchased modules',
            'portal.btnOpenDashboard': 'Open Dashboard',
            'portal.btnOpenProdUrl': 'Open Production URL',
            'portal.btnBack': 'Back'
          },
          es: {
            'portal.title_not_found': 'Propiedad no encontrada',
            'portal.not_found_desc': 'No se pudo localizar la propiedad solicitada: {key}',
            'portal.not_found_help': 'Verifique el identificador o regrese a la lista de propiedades.',
            'portal.modulesTitle': 'Módulos adquiridos',
            'portal.btnOpenDashboard': 'Abrir Panel',
            'portal.btnOpenProdUrl': 'Abrir URL de Producción',
            'portal.btnBack': 'Volver'
          }
        };

        const listeners = [];
        let lang = localStorage.getItem('nexefii_lang') || 'pt';
        window.NEXEFII.i18n = {
          getLanguage: ()=> lang,
          setLanguage: (l)=>{ if(!resources[l]) return; lang = l; try{ localStorage.setItem('nexefii_lang', l); }catch(e){}; listeners.forEach(cb=>cb(l)); },
          t: (key, vars)=>{
            const seg = resources[lang] && resources[lang][key] ? resources[lang][key] : (resources['pt'][key]||key);
            if(!vars) return seg;
            return seg.replace(/\{(\w+)\}/g, (_,n)=> vars[n] || '');
          },
          onChange: (cb)=>{ if(typeof cb==='function') listeners.push(cb); }
        };
      }
    }catch(e){}
  })();

  // Update title if possible
  try{
    if(prop && prop.name) document.title = `${prop.name} · NEXEFII`;
    const pageTitle = document.getElementById('page-title');
    if(pageTitle && prop && prop.name) pageTitle.textContent = `${prop.name} · Portal de Propriedade`;
  }catch(e){}

  // Create a simple overlay/landing inside the body
  const wrap = document.createElement('div');
  wrap.id = 'property-portal';
  wrap.style.cssText = 'min-height:100vh;padding:36px;background:linear-gradient(180deg,#f7fafc,white);font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

  if(!prop){
    wrap.innerHTML = `
      <div style="max-width:900px;margin:40px auto;padding:28px;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center;">
        <h1 data-i18n="portal.title_not_found" style="margin-bottom:8px;color:#2d3748;">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.title_not_found') : 'Propriedade não encontrada'}</h1>
        <p style="color:#4a5568;margin-bottom:18px;">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.not_found_desc',{key}) : `Não foi possível localizar a propriedade solicitada: ${key}`}</p>
        <p style="color:#718096" data-i18n="portal.not_found_help">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.not_found_help') : 'Verifique o identificador ou retorne à lista de propriedades.'}</p>
      </div>
    `;
  } else {
    const modules = (prop.modulesPurchased || []).map(m=>`<span style="display:inline-block;background:#edf2ff;color:#2c5282;padding:6px 12px;border-radius:12px;margin:4px;font-weight:600;font-size:13px;">${m}</span>`).join('');
    wrap.innerHTML = `
      <div style="max-width:1100px;margin:24px auto;padding:28px;background:white;border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,0.08);">
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:16px;">
          <img src="${prop.imageUrl||'assets/images/default-hotel-1.jpg'}" alt="${prop.name}" style="width:96px;height:96px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;">
          <div>
            <h1 style="margin:0;color:#2d3748;font-size:26px;">${prop.name}</h1>
            <div style="color:#718096;font-size:14px;margin-top:6px;">ID: <strong>${prop.key}</strong> · ${prop.location && prop.location.city ? prop.location.city + (prop.location.state?(', '+prop.location.state):'') : ''}</div>
          </div>
        </div>

        <div style="margin:12px 0 20px 0;">
          <strong style="color:#2d3748;" data-i18n="portal.modulesTitle">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.modulesTitle') : 'Módulos adquiridos'}</strong>
          <div style="margin-top:8px;">${modules || '<span style="color:#718096">Nenhum módulo</span>'}</div>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
          <a id="openDashboardBtn" data-action="open-dashboard" href="/pages/property-dashboard.html?propertyKey=${prop.key}" style="padding:10px 16px;background:linear-gradient(90deg,#667eea,#764ba2);color:white;border-radius:8px;text-decoration:none;font-weight:600;" data-i18n="portal.btnOpenDashboard">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.btnOpenDashboard') : 'Abrir Dashboard'}</a>
          <a id="openProdBtn" href="${prop.deployedUrl||'#'}" style="padding:10px 16px;background:#edf2f7;color:#234; border-radius:8px;text-decoration:none;font-weight:600;" data-i18n="portal.btnOpenProdUrl">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.btnOpenProdUrl') : 'Abrir URL de Produção'}</a>
          <button id="backBtn" style="padding:10px 16px;border:1px solid #e2e8f0;background:white;border-radius:8px;" data-i18n="portal.btnBack">${window.NEXEFII && window.NEXEFII.i18n ? window.NEXEFII.i18n.t('portal.btnBack') : 'Voltar'}</button>
        </div>
      </div>
    `;
  }

  // Insert near top of body and always render (card or not-found)
  document.addEventListener('DOMContentLoaded', ()=>{
    console.log('[Portal] inserting portal markup; prop present?', !!prop);
    // prefer placing before existing main sections if any
    const first = document.body.firstChild;
    try { document.body.insertBefore(wrap, first); } catch(e){ document.body.appendChild(wrap); }
    // Wire back button to master-control with selectedProperty
    try{
      const backBtn = document.getElementById('backBtn');
      if(backBtn){
        backBtn.addEventListener('click', ()=>{
          if(!key) { window.location.href = '/master-control.html'; return; }
          const params = new URLSearchParams({ selectedProperty: key });
          window.location.href = '/master-control.html?' + params.toString();
        });
      }
      // ensure open dashboard opens internal pages property-dashboard
      const openDashboardBtn = document.getElementById('openDashboardBtn');
      if(openDashboardBtn){
        // remove any previously attached inline handler on the element to avoid accidental navigation
        try { openDashboardBtn.onclick = null; } catch(e){}

        openDashboardBtn.addEventListener('click', (ev)=>{
          try{
            ev && ev.preventDefault && ev.preventDefault();
            if(!propertyKey){
              console.warn('[Portal] Abrir Dashboard: propertyKey ausente');
              return;
            }
            const params = new URLSearchParams({ propertyKey: propertyKey });
            const url = '/pages/property-dashboard.html?' + params.toString();
            console.log('[Portal] Abrir Dashboard →', url);
            window.location.href = url;
          }catch(err){ console.warn('[Portal] openDashboard handler failed', err); }
        });
      }
      // If i18n exists, update texts on language change
      try{
        const i18n = window.NEXEFII && window.NEXEFII.i18n;
        if(i18n && typeof i18n.onChange === 'function'){
          i18n.onChange(()=>{
            // refresh portal texts
            const els = wrap.querySelectorAll('[data-i18n]');
            els.forEach(el=>{
              const key = el.getAttribute('data-i18n');
              if(!key) return;
              el.textContent = i18n.t(key, { key });
            });
          });
        }
      }catch(e){}
    }catch(e){/* ignore wiring errors */}
  });

})();
