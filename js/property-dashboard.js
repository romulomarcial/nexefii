// Renders property dashboard UI
(function(){
  const SC = window.SessionContext;
  const svc = window.PropertyDashboardService;

  // Provide a minimal I18nManager stub to avoid ReferenceError if the real
  // I18nManager script fails to load. This is non-destructive: if the real
  // manager loads later it will overwrite this stub.
  if (typeof window.I18nManager === 'undefined') {
    window.I18nManager = function(){
      this.loadTranslations = function(){};
      this.loadSegment = function(){};
      this.applyToDOM = function(doc){};
      this.t = function(k, v){ return (k || ''); };
      this.onChange = function(cb){};
    };
  }

  function el(tag, props, children){ const e = document.createElement(tag); if(props) Object.keys(props).forEach(k=>{ if(k==='text') e.textContent=props[k]; else e.setAttribute(k,props[k]); }); if(children) children.forEach(c=>e.appendChild(c)); return e; }

  function renderKpis(kpis){
    const grid = document.getElementById('kpiGrid'); grid.innerHTML='';
    const items = [
      {key:'dashboard.kpis.occupancy', value: kpis.occupancyPercent + '%'},
      {key:'dashboard.kpis.roomsOccupied', value: kpis.roomsOccupied},
      {key:'dashboard.kpis.roomsAvailable', value: kpis.roomsAvailable},
      {key:'dashboard.kpis.reservations7d', value: kpis.reservationsNext7Days},
      {key:'dashboard.kpis.revenue', value: '$' + kpis.revenueProjection}
    ];
    items.forEach(it=>{
      const card = el('div',{class:'kpi-card'});
      // Set data-i18n attribute only; do not seed the element with the raw key
      const title = el('div',{class:'kpi-title', 'data-i18n': it.key});
      const val = el('div',{class:'kpi-value', text: it.value});
      card.appendChild(title); card.appendChild(val); grid.appendChild(card);
    });
  }

  function renderModules(modStatus, property){
    const grid = document.getElementById('modulesGrid');
    if (grid) grid.innerHTML = '';
    // Determine modules configuration permissively: caller may pass modules map as first arg
    // or pass the full resolved property as second arg. Prefer property.modules when available.
    var modulesConfig = null;
    if (property) {
      if (Array.isArray(property.modulesPurchased) && property.modulesPurchased.length) {
        modulesConfig = {};
        property.modulesPurchased.forEach(function(m){ modulesConfig[m] = true; });
      } else if (property.modules || property.features || property.moduleFlags) {
        modulesConfig = property.modules || property.features || property.moduleFlags || null;
      }
    } else if (modStatus && typeof modStatus === 'object') {
      modulesConfig = modStatus;
    }

    if (!modulesConfig) {
      console.warn('[PropertyDashboard] renderModules(): no modules configuration found for property', property || modStatus);
      if (grid) {
        grid.innerHTML = '<div class="module-card">Nenhum módulo disponível</div>';
      }
      return;
    }

    const mapping = {
      pms: 'dashboard.modules.pms',
      housekeeping: 'dashboard.modules.housekeeping',
      engineering: 'dashboard.modules.engineering',
      bi: 'dashboard.modules.bi'
    };

    Object.keys(mapping).forEach(function(moduleKey){
      var enabled = false;
      try {
        enabled = !!(modulesConfig[moduleKey] && (modulesConfig[moduleKey].enabled === undefined ? modulesConfig[moduleKey] : modulesConfig[moduleKey].enabled));
      } catch(e){ enabled = false; }
      if (!enabled) return;

      const card = el('div',{class:'module-card', 'data-module-key': moduleKey});
      try { card.style.cursor = 'pointer'; } catch(e){}
      const title = el('div',{class:'module-title', 'data-i18n': mapping[moduleKey]});
      card.appendChild(title);

      // PMS submodules
      if (moduleKey === 'pms'){
        const sub = el('div',{class:'submodules'});
        const subs = [
          {k:'dashboard.submodules.rooms', href:'/pms-rooms.html'},
          {k:'dashboard.submodules.reservations', href:'/pms-reservations-ui.html'},
          {k:'dashboard.submodules.frontdesk', href:'/pms-frontdesk.html'}
        ];
        subs.forEach(s=>{
          const a = document.createElement('a'); a.className='submodule'; a.href = s.href; a.setAttribute('data-i18n', s.k);
          // If i18n is available now, use it to set the label immediately to avoid a flash of raw keys
          try {
            if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.t === 'function') {
              a.textContent = window.NEXEFII.i18n.t(s.k);
            } else {
              a.textContent = s.k;
            }
          } catch(e){ a.textContent = s.k; }
          sub.appendChild(a);
          // Request the specific segment for this submodule (best-effort) so translations load quicker
          try {
            if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.loadSegment === 'function') {
              const parts = (s.k || '').split('.');
              const segment = parts.length ? parts[parts.length-1] : null;
              if (segment) {
                // load in background; may or may not return a Promise
                try {
                  var maybe = window.NEXEFII.i18n.loadSegment(null, segment);
                  if (maybe && typeof maybe.then === 'function') {
                    maybe.then(()=>{ try { window.NEXEFII.i18n.applyToDOM(a); } catch(e){} }).catch(()=>{});
                  } else {
                    try { window.NEXEFII.i18n.applyToDOM(a); } catch(e){}
                  }
                } catch(e){}
              }
            }
          } catch(e){}
        });
        card.appendChild(sub);
      }
      if (grid) grid.appendChild(card);
    });

    // Depois de renderizar os módulos, ligar os cliques para navegar ao Master Control
    try {
      wireModuleClicks();
    } catch (e) {
      console.warn('[PropertyDashboard] wireModuleClicks failed', e);
    }
  }

  function loadAndRender(property){
    const pid = property && (property.id || property.key || property.slug);
    try {
      var maybe = svc.getPropertyKpis(pid);
      if (maybe && typeof maybe.then === 'function') {
        // async service: wait for KPIs then render
        maybe.then(function(kpis){
          try { renderKpis(kpis); } catch(e){}
          try { renderModules(kpis && kpis.modulesStatus, property); } catch(e){}
          try { if (window.NEXEFII && window.NEXEFII.i18n) window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
          // If translations are not loaded yet, trigger load and applyToDOM when done — defensive
          try {
            if (window.NEXEFII && window.NEXEFII.i18n && !window.NEXEFII.i18n.translations && typeof window.NEXEFII.i18n.loadTranslations === 'function') {
              var m = window.NEXEFII.i18n.loadTranslations();
              if (m && typeof m.then === 'function') {
                m.then(function(){ try { window.NEXEFII.i18n.applyToDOM(document); } catch(e){} }).catch(function(){ /* ignore */ });
              }
            }
          } catch(e){}
        }).catch(function(err){ console.warn('[PropertyDashboard] loadAndRender: failed to load KPIs', err); });
      } else {
        // synchronous return
        const kpis = maybe;
        renderKpis(kpis);
        renderModules(kpis && kpis.modulesStatus, property);
        try { if (window.NEXEFII && window.NEXEFII.i18n) window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
      }
    } catch(e){ console.warn('[PropertyDashboard] loadAndRender error', e); }
  }

  // Utility: robustly determine the desired property key for the dashboard
  function getDashboardPropertyKey(){
    try {
      const params = new URLSearchParams(window.location.search);
      const queryPropertyKey = params.get('propertyKey');
      const queryPropertyId = params.get('propertyId'); // legacy

      let sessionActive = null;
      try {
        if (window.SessionContext) {
          // prefer a direct property key field if present
          sessionActive = window.SessionContext.activePropertyKey || (typeof window.SessionContext.getActiveProperty === 'function' ? window.SessionContext.getActiveProperty() : null) || null;
          if (sessionActive && typeof sessionActive === 'object') sessionActive = sessionActive.id || sessionActive.key || sessionActive.slug || null;
        }
      } catch(e){ console.warn('[PropertyDashboard] Erro lendo SessionContext for activePropertyKey:', e); }

      let storageActive = null;
      try { storageActive = window.localStorage ? window.localStorage.getItem('nexefii_active_property') : null; } catch(e){ console.warn('[PropertyDashboard] Erro lendo localStorage:', e); }

      const finalKey = queryPropertyKey || queryPropertyId || sessionActive || storageActive || null;
      console.log('[PropertyDashboard] getDashboardPropertyKey():', {
        queryPropertyKey,
        queryPropertyId,
        sessionActive,
        storageActive,
        finalKey
      });
      return finalKey;
    } catch(e){ console.warn('[PropertyDashboard] Erro lendo URL/Session/localStorage:', e); return null; }
  }

  // Navigation helper: navigate to Master Control with selected module and property
  function navigateToModule(moduleKey){
    try {
      const property = getDashboardPropertyKey();
      console.info('[PropertyDashboard] navigateToModule()', { moduleKey, property });
      const params = new URLSearchParams();
      if (property) params.set('selectedProperty', property);
      if (moduleKey) {
        // Allow mapping: housekeeping is known as 'governance' in master control
        const moduleParam = (moduleKey === 'housekeeping') ? 'governance' : moduleKey;
        params.set('module', moduleParam);
      }
      window.location.href = '/master-control.html?' + params.toString();
    } catch(e){ console.warn('[PropertyDashboard] navigateToModule error', e); }
  }

  function wireModuleClicks(){
    try {
      const nodes = document.querySelectorAll('[data-module-key]');
      if (!nodes || nodes.length === 0) {
        console.info('[PropertyDashboard] wireModuleClicks: no module cards found');
        return;
      }
      Array.prototype.forEach.call(nodes, function(n){
        try { n.style.cursor='pointer'; } catch(e){}
        n.addEventListener('click', function(){
          var key = n.getAttribute('data-module-key');
          navigateToModule(key);
        });
      });
      console.info('[PropertyDashboard] wireModuleClicks(): wired modules =', nodes.length);
    } catch(e){ console.warn('[PropertyDashboard] wireModuleClicks error', e); }
  }

  // Resolve property object given an activePropertyKey using existing model helpers
  function resolveDashboardProperty(activePropertyKey) {
    if (!activePropertyKey) {
      console.warn('[PropertyDashboard] resolveDashboardProperty(): no activePropertyKey provided');
      return null;
    }

    let allProps = null;
    let resolved = null;

    try {
      if (window.NexefiiProps) {
        if (typeof NexefiiProps.listProperties === 'function') {
          allProps = NexefiiProps.listProperties();
        } else if (Array.isArray(NexefiiProps.allProperties)) {
          allProps = NexefiiProps.allProperties;
        }
      }
    } catch (err) {
      console.error('[PropertyDashboard] Error while fetching all properties from NexefiiProps:', err);
      allProps = null;
    }

    // fallback to global `properties` variable if present
    try {
      if (!allProps && window.properties && Array.isArray(window.properties)) {
        allProps = window.properties;
      }
    } catch (err) { /* ignore */ }

    if (!allProps) {
      console.warn('[PropertyDashboard] resolveDashboardProperty(): no allProps list found');
    } else {
      const loweredKey = String(activePropertyKey).toLowerCase();
      resolved =
        allProps.find(p => String(p.key || '').toLowerCase() === loweredKey) ||
        allProps.find(p => String(p.id || '').toLowerCase() === loweredKey) ||
        allProps.find(p => String(p.code || '').toLowerCase() === loweredKey) ||
        allProps.find(p => String(p.slug || '').toLowerCase() === loweredKey) ||
        allProps.find(p => String(p.name || '').toLowerCase() === loweredKey) ||
        null;

      console.log('[PropertyDashboard] resolveDashboardProperty(): candidates =', allProps.map(p => ({ key: p.key, id: p.id, code: p.code, slug: p.slug, name: p.name })));
    }

    console.log('[PropertyDashboard] resolveDashboardProperty(): activePropertyKey =', activePropertyKey, 'resolved =', resolved);
    return resolved || null;
  }

  // Ensure translations are loaded before rendering dynamic content
  function whenI18nReady(cb) {
    try {
      var i = window.NEXEFII && window.NEXEFII.i18n;
      if (i && !i.translations && typeof i.loadTranslations === 'function') {
        var p = i.loadTranslations();
        if (p && typeof p.then === 'function') {
          p.then(function(){ try{ i.applyToDOM(document); } catch(e){}; cb(); }).catch(function(){ cb(); });
          return;
        }
      }
    } catch(e){}
    cb();
  }

  // Gather all available properties from SessionContext, NexefiiProps or global
  function getAllDashboardProperties(){
    let props = [];
    try {
      if (window.SessionContext && typeof SessionContext.getAccessibleProperties === 'function'){
        const sessionProps = SessionContext.getAccessibleProperties() || [];
        if (Array.isArray(sessionProps) && sessionProps.length) props = sessionProps;
      }
    } catch(e){ console.warn('[PropertyDashboard] Error reading SessionContext.getAccessibleProperties():', e); }

    if ((!props || !props.length) && window.NexefiiProps && typeof NexefiiProps.listProperties === 'function'){
      try { props = NexefiiProps.listProperties() || []; } catch(err){ console.error('[PropertyDashboard] Error calling NexefiiProps.listProperties():', err); }
    }

    if ((!props || !props.length) && Array.isArray(window.properties)) props = window.properties;

    console.log('[PropertyDashboard] getAllDashboardProperties(): count =', (props && props.length) || 0);
    return props || [];
  }

  function renderSinglePropertyFocus(property){
    // Hide selector if present
    const selWrap = document.getElementById('propSelect');
    if (selWrap) selWrap.style.display = 'none';
    const title = document.getElementById('propertyTitle');
    if (title) title.textContent = property.name || property.slug || '';
    loadAndRender(property);
  }

  function renderMultiPropertyGrid(props){
    // Clear main grids and show a card grid
    const container = document.getElementById('multiPropertyGrid');
    if (!container) return;
    container.innerHTML = '';
    // fetch KPIs in parallel (cached)
    var maybeMap = null;
    try { maybeMap = svc.getAllPropertiesKpis(props); } catch(e){ maybeMap = null; }

    function renderWithMap(map){
      props.forEach(p=>{
        const pid = p.id || p.key || p.slug;
        const k = map[pid] || map[String(pid)] || null;
      const card = document.createElement('div'); card.className = 'property-card'; card.style.border='1px solid #eee'; card.style.padding='12px'; card.style.borderRadius='8px'; card.style.margin='8px'; card.style.width='260px'; card.style.display='inline-block'; card.style.verticalAlign='top';
      card.innerHTML = `<h4>${p.name||p.slug||pid}</h4>`;
      if (k) {
        card.innerHTML += `<div>Ocupação: ${k.occupancyPercent}%</div><div>Quartos ocupados: ${k.roomsOccupied}</div><div>Reservas 7d: ${k.reservationsNext7Days}</div>`;
      }
      const enterBtn = document.createElement('button'); enterBtn.className='btn btn-primary'; enterBtn.style.marginTop='8px'; enterBtn.innerText='Entrar'; enterBtn.addEventListener('click', function(){ SC.setActiveProperty(pid); renderSinglePropertyFocus(p); });
      card.appendChild(enterBtn);
      // modules quick access (use KPI modulesStatus or property.modulesPurchased)
      const mods = document.createElement('div'); mods.style.marginTop='8px'; mods.style.display='flex'; mods.style.gap='6px';
      if (k && k.modulesStatus) {
        const moduleKeys = Object.keys(k.modulesStatus || {});
        moduleKeys.forEach(mk=>{
          const enabled = (Array.isArray(p.modulesPurchased) && p.modulesPurchased.indexOf(mk) !== -1) || !!k.modulesStatus[mk];
          if (!enabled) return;
          const b = document.createElement('button'); b.className='btn'; b.innerText = mk;
          b.addEventListener('click', ()=>{ window.location.href = (mk==='pms'?'/pms-rooms.html':'/'); });
          mods.appendChild(b);
        });
      }
      card.appendChild(mods);
        container.appendChild(card);
      });
    }

    if (maybeMap && typeof maybeMap.then === 'function') {
      maybeMap.then(function(map){ try { renderWithMap(map || {}); } catch(e){} }).catch(function(err){ console.warn('[PropertyDashboard] renderMultiPropertyGrid: failed to load KPI map', err); });
    } else {
      renderWithMap(maybeMap || {});
    }
    // apply translations
    try { if (window.NEXEFII && window.NEXEFII.i18n) window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
  }

  // Exact populatePropertySelector implementation required by dashboard UX
  function populatePropertySelector(props, activePropertyKey) {
    const selectEl = document.getElementById("propSelect");
    if (!selectEl) {
      console.warn("[PropertyDashboard] populatePropertySelector(): #propSelect not found");
      return;
    }

    // ensure visible
    try { selectEl.style.display = ''; } catch(e){}

    selectEl.innerHTML = "";

    if (!Array.isArray(props) || props.length === 0) {
      try { if (window.NexefiiProps && typeof NexefiiProps.listProperties === 'function') props = NexefiiProps.listProperties() || []; } catch(e){}
    }
    if (!Array.isArray(props) || props.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Nenhuma propriedade disponível";
      selectEl.appendChild(opt);
      return;
    }

    const activeLower = activePropertyKey ? String(activePropertyKey).toLowerCase() : null;

    props.forEach(p => {
      const key = p.key || p.id || p.code || p.slug || p.name;
      if (!key) return;

      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = p.name || p.label || key;

      if (activeLower && String(key).toLowerCase() === activeLower) {
        opt.selected = true;
      }

      selectEl.appendChild(opt);
    });

    console.log("[PropertyDashboard] populatePropertySelector(): options =", selectEl.options.length, "activePropertyKey =", activePropertyKey);

    // attach onchange handler as required
    selectEl.onchange = function(){
      const v = this.value; if(!v) return;
      try { const url=new URL(window.location.href); url.searchParams.set('propertyKey', v); window.location.href = url.toString(); } catch(e){ window.location.href = '/pages/property-dashboard.html?propertyKey=' + encodeURIComponent(v); }
    };
  }
    // Listen for external storage changes (e.g., wizard created property in another window)
    window.addEventListener('storage', function(e){
      try {
        if (!e || !e.key) return;
        if (e.key === 'nexefii_active_property') {
          const newId = e.newValue;
          if (!newId) return;
          const selEl = document.getElementById('propSelect');
          if (selEl) {
            // try to set selector value if option exists
            const found = Array.from(selEl.options).some(o => { if (o.value === newId) { selEl.value = newId; return true; } return false; });
            const props = SC.getAccessibleProperties() || [];
            const foundProp = props.find(p => (p.id && p.id.toString() === newId.toString()) || (p.key && p.key.toString() === newId.toString()) || (p.slug && p.slug === newId));
            if (foundProp) whenI18nReady(function(){ loadAndRender(foundProp); });
          }
        }
      } catch (err) { /* ignore */ }
    });

    // Also respond to same-window custom events
    window.addEventListener('nexefii-active-change', function(ev){
      try {
        const id = ev && ev.detail && ev.detail.id;
        if (!id) return;
        const selEl = document.getElementById('propSelect');
        if (selEl) {
          const found = Array.from(selEl.options).some(o => {
            if (o.value === id) { selEl.value = id; return true; }
            return false;
          });
        }
        const props = SC.getAccessibleProperties() || [];
        const foundProp = props.find(p => (p.id && p.id.toString() === id.toString()) || (p.key && p.key.toString() === id.toString()) || (p.slug && p.slug === id));
        if (foundProp) whenI18nReady(function(){ loadAndRender(foundProp); });
      } catch(_){}
    });

  function init() {
    const user = (SC && typeof SC.getCurrentUser === 'function') ? SC.getCurrentUser() : null;
    // Determine requested property key from URL / session / localStorage
    const activePropertyKey = getDashboardPropertyKey();
    console.log('[PropertyDashboard] activePropertyKey =', activePropertyKey);
    const requestedKey = activePropertyKey;
    var resolvedProp = null;
    try {
      if (requestedKey && window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function') {
        resolvedProp = window.NexefiiProps.getProperty(requestedKey) || null;
      }
    } catch(e){ console.warn('[PropertyDashboard] error resolving requested property', e); }

    // If list-based resolution didn't find the property, try direct getter as a fallback
    if (!resolvedProp) {
      try {
        if (requestedKey && window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function') {
          resolvedProp = window.NexefiiProps.getProperty(requestedKey) || null;
        }
      } catch(e){ /* ignore */ }
    }

    // Log resolved property for diagnostics
    console.log('[PropertyDashboard] resolvedProp =', resolvedProp);

    // Synchronize SessionContext and localStorage with the active property key
    try {
      const currentSessionActive = (SC && typeof SC.getActiveProperty === 'function') ? SC.getActiveProperty() : null;
      console.log('[PropertyDashboard] sessionActiveProperty (before sync) =', currentSessionActive);
      if (requestedKey) {
        const normalizedKey = resolvedProp ? (resolvedProp.id || resolvedProp.key || resolvedProp.slug || requestedKey) : requestedKey;
        if (SC && typeof SC.setActiveProperty === 'function') {
          try { SC.setActiveProperty(normalizedKey); } catch(e) { console.warn('[PropertyDashboard] could not set SessionContext active property', e); }
        }
        try { localStorage.setItem('nexefii_active_property', String(normalizedKey)); } catch(e) { /* ignore */ }
      } else if (resolvedProp) {
        // No explicit requestedKey but we resolved a property object (unlikely) — ensure session/localStorage updated
        const normalizedKey = resolvedProp.id || resolvedProp.key || resolvedProp.slug;
        if (normalizedKey) {
          if (SC && typeof SC.setActiveProperty === 'function') {
            try { SC.setActiveProperty(normalizedKey); } catch(e){ /* ignore */ }
          }
          try { localStorage.setItem('nexefii_active_property', String(normalizedKey)); } catch(e){}
        }
      }
      const afterSessionActive = (SC && typeof SC.getActiveProperty === 'function') ? SC.getActiveProperty() : null;
      console.log('[PropertyDashboard] sessionActiveProperty (after sync) =', afterSessionActive);
    } catch(e){ console.warn('[PropertyDashboard] error syncing SessionContext/localStorage', e); }

    // Redirect MASTER users only when there's no property specified or active
    try {
      const isMaster = SC && typeof SC.isMasterUser === 'function' ? SC.isMasterUser() : false;
      const hasActive = (SC && typeof SC.getActiveProperty === 'function' && SC.getActiveProperty()) || resolvedProp || (activePropertyKey ? true : false);
      console.log('[PropertyDashboard] isMaster=', isMaster, 'hasActive=', !!hasActive);
      if (isMaster && !activePropertyKey && !hasActive) { window.location.href = '/master-control.html'; return; }
    } catch(e){ /* ignore */ }

    // First try SessionContext accessible properties
    let props = (SC && typeof SC.getAccessibleProperties === 'function') ? SC.getAccessibleProperties() || [] : [];
    // If SessionContext returned no properties, try NexefiiProps.listProperties() or global `properties`
    if (!props || !props.length) {
      try {
        if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
          props = NexefiiProps.listProperties() || [];
          console.log('[PropertyDashboard] loaded props from NexefiiProps.listProperties():', props.map(p => p.key || p.id));
        }
      } catch (e) { console.warn('[PropertyDashboard] error reading NexefiiProps.listProperties()', e); }
    }
    if ((!props || !props.length) && window.properties && Array.isArray(window.properties)) {
      props = window.properties;
      console.log('[PropertyDashboard] loaded props from global `properties` array');
    }
    if (!props.length) {
      document.getElementById('kpiGrid').innerHTML = '<div class="kpi-card">Nenhuma propriedade disponível</div>';
      return;
    }

    // populate the selector with found properties
    try {
      const canonicalKey = resolvedProp ? (resolvedProp.key || resolvedProp.id || resolvedProp.slug) : activePropertyKey;
      populatePropertySelector(props, canonicalKey);
    } catch(e){ console.warn('[PropertyDashboard] populatePropertySelector failed', e); }

    // If a specific property was requested via URL, prefer showing it
    if (requestedKey) {
      // try to resolve from the list we loaded
      if (!resolvedProp) resolvedProp = resolveDashboardProperty(requestedKey);
      if (resolvedProp) {
        // ensure selector shows the requested property
        try { const sel = document.getElementById('propSelect'); if (sel) sel.value = resolvedProp.id || resolvedProp.key || resolvedProp.slug; } catch(e){}
        // Keep selector visible when a propertyKey was provided in URL.
        // Populate and render the KPIs/modules for the requested property
        // without hiding the selector (user expects to be able to switch).
        whenI18nReady(function(){ loadAndRender(resolvedProp); });
        return;
      } else {
        // requestedKey present but couldn't be resolved
        document.getElementById('kpiGrid').innerHTML = `<div class="kpi-card">Propriedade "${requestedKey}" não encontrada</div>`;
        return;
      }
    }
    // If only one property, show focused view without selector
    if (props.length === 1) {
      const only = props[0];
      // Show single property details but keep selector visible
      whenI18nReady(function(){ loadAndRender(only); });
      return;
    }

    // multiple properties: populate selector and show a grid overview
    try {
      const canonicalKey = resolvedProp ? (resolvedProp.key || resolvedProp.id || resolvedProp.slug) : activePropertyKey;
      populatePropertySelector(props, canonicalKey);
    } catch(e){ console.warn('[PropertyDashboard] populatePropertySelector failed', e); }
    const active = SC.getActiveProperty() || props[0];
    if (active) SC.setActiveProperty(active.id || active.key || active.slug);
    document.getElementById('propSelect').value = (active.id || active.key || active.slug);
    // render overview grid for multiple properties
    // ensure container exists
    let multi = document.getElementById('multiPropertyGrid');
    if (!multi) {
      multi = document.createElement('div'); multi.id='multiPropertyGrid'; multi.style.display='flex'; multi.style.flexWrap='wrap'; multi.style.gap='12px'; document.getElementById('kpiGrid').parentNode.insertBefore(multi, document.getElementById('kpiGrid'));
    }
    renderMultiPropertyGrid(props);

    // listen to language changes
    // If the i18n manager arrives later than dashboard initialization,
    // re-apply translations to dynamic content once available.
    (function waitForI18nAndApply(){
      if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.applyToDOM === 'function') {
        try{ window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
      } else {
        let tries = 0;
        const tid = setInterval(()=>{
          tries++;
          if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.applyToDOM === 'function') {
            try{ window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
            clearInterval(tid);
          } else if (tries > 25) {
            clearInterval(tid);
          }
        }, 200);
      }
    })();

    try { if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.onChange === 'function') {
      window.NEXEFII.i18n.onChange(()=>{ try { loadAndRender(SC.getActiveProperty()); } catch(e){} });
    } } catch(e){}
  }

  window.addEventListener('DOMContentLoaded', init);
})();
