// Renders property dashboard UI
(function(){
  const SC = window.SessionContext;
  const svc = window.PropertyDashboardService;

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
      const title = el('div',{class:'kpi-title', 'data-i18n': it.key, text: it.key});
      const val = el('div',{class:'kpi-value', text: it.value});
      card.appendChild(title); card.appendChild(val); grid.appendChild(card);
    });
  }

  function renderModules(modStatus, property){
    const grid = document.getElementById('modulesGrid'); grid.innerHTML='';
    const mapping = {
      pms: 'dashboard.modules.pms',
      housekeeping: 'dashboard.modules.housekeeping',
      engineering: 'dashboard.modules.engineering',
      bi: 'dashboard.modules.bi'
    };
    Object.keys(mapping).forEach(moduleKey=>{
      const enabled = (property && property.modules && property.modules[moduleKey]) || !!modStatus[moduleKey];
      if (!enabled) return;
      const card = el('div',{class:'module-card'});
      const title = el('div',{class:'module-title', 'data-i18n': mapping[moduleKey], text: mapping[moduleKey]});
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
          const a = document.createElement('a'); a.className='submodule'; a.href = s.href; a.setAttribute('data-i18n', s.k); a.textContent = s.k; sub.appendChild(a);
        });
        card.appendChild(sub);
      }
      grid.appendChild(card);
    });
  }

  async function loadAndRender(property){
    const pid = property && (property.id || property.key || property.slug);
    const kpis = await svc.getPropertyKpis(pid);
    renderKpis(kpis);
    renderModules(kpis.modulesStatus, property);
    // apply i18n after render
    try { if (window.NEXEFII && window.NEXEFII.i18n) window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
  }

  async function renderSinglePropertyFocus(property){
    // Hide selector if present
    const selWrap = document.getElementById('propSelect');
    if (selWrap) selWrap.style.display = 'none';
    const title = document.getElementById('propertyTitle');
    if (title) title.textContent = property.name || property.slug || '';
    await loadAndRender(property);
  }

  async function renderMultiPropertyGrid(props){
    // Clear main grids and show a card grid
    const container = document.getElementById('multiPropertyGrid');
    if (!container) return;
    container.innerHTML = '';
    // fetch KPIs in parallel (cached)
    const map = await svc.getAllPropertiesKpis(props);
    props.forEach(p=>{
      const pid = p.id || p.key || p.slug;
      const k = map[pid] || map[String(pid)] || null;
      const card = document.createElement('div'); card.className = 'property-card'; card.style.border='1px solid #eee'; card.style.padding='12px'; card.style.borderRadius='8px'; card.style.margin='8px'; card.style.width='260px'; card.style.display='inline-block'; card.style.verticalAlign='top';
      card.innerHTML = `<h4>${p.name||p.slug||pid}</h4>`;
      if (k) {
        card.innerHTML += `<div>Ocupação: ${k.occupancyPercent}%</div><div>Quartos ocupados: ${k.roomsOccupied}</div><div>Reservas 7d: ${k.reservationsNext7Days}</div>`;
      }
      const enterBtn = document.createElement('button'); enterBtn.className='btn btn-primary'; enterBtn.style.marginTop='8px'; enterBtn.innerText='Entrar'; enterBtn.addEventListener('click', async ()=>{ SC.setActiveProperty(pid); await renderSinglePropertyFocus(p); });
      card.appendChild(enterBtn);
      // modules quick access
      const mods = document.createElement('div'); mods.style.marginTop='8px'; mods.style.display='flex'; mods.style.gap='6px'; if (k && k.modulesStatus && p.modules) {
        const moduleKeys = Object.keys(k.modulesStatus);
        moduleKeys.forEach(mk=>{ const enabled = p.modules ? p.modules[mk] : k.modulesStatus[mk]; if (!enabled) return; const b = document.createElement('button'); b.className='btn'; b.innerText = mk; b.addEventListener('click', ()=>{ window.location.href = (mk==='pms'?'/pms-rooms.html':'/'); }); mods.appendChild(b); });
      }
      card.appendChild(mods);
      container.appendChild(card);
    });
    // apply translations
    try { if (window.NEXEFII && window.NEXEFII.i18n) window.NEXEFII.i18n.applyToDOM(document); } catch(e){}
  }

  function populatePropertySelector(props){
    const sel = document.getElementById('propSelect'); sel.innerHTML='';
    props.forEach(p=>{
      const o = document.createElement('option'); o.value = p.id || p.key || p.slug; o.textContent = p.name || p.slug || (p.key || p.id);
      sel.appendChild(o);
    });
    sel.addEventListener('change', (e)=>{
      const val = e.target.value;
      // persist via SessionContext (writes nexefii_active_property)
      try { SC.setActiveProperty(val); } catch(e) { try { localStorage.setItem('nexefii_active_property', String(val)); } catch(_){} }
      // notify same-window listeners (storage event doesn't fire in same window)
      try { window.dispatchEvent(new CustomEvent('nexefii-active-change', { detail: { id: val } })); } catch(_) {}
      const active = SC.getActiveProperty(); loadAndRender(active);
    });

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
            if (foundProp) loadAndRender(foundProp);
          }
        }
      } catch (err) { /* ignore */ }
    });

    // Also respond to same-window custom events
    window.addEventListener('nexefii-active-change', function(ev){ try { const id = ev && ev.detail && ev.detail.id; if (!id) return; const selEl = document.getElementById('propSelect'); if (selEl) { const found = Array.from(selEl.options).some(o => { if (o.value === id) { selEl.value = id; return true; } return false; }); } const props = SC.getAccessibleProperties() || []; const foundProp = props.find(p => (p.id && p.id.toString() === id.toString()) || (p.key && p.key.toString() === id.toString()) || (p.slug && p.slug === id)); if (foundProp) loadAndRender(foundProp); } catch(_){} });
  }

  async function init() {
    const user = SC.getCurrentUser();
    // Redirect MASTER users to master-control (they shouldn't see dashboard)
    if (SC.isMasterUser()) { window.location.href = '/master-control.html'; return; }
    const props = SC.getAccessibleProperties() || [];
    if (!props.length) {
      document.getElementById('kpiGrid').innerHTML = '<div class="kpi-card">Nenhuma propriedade disponível</div>';
      return;
    }
    // If only one property, show focused view without selector
    if (props.length === 1) {
      const only = props[0];
      // optionally hide selector UI
      const sel = document.getElementById('propSelect'); if (sel) sel.style.display = 'none';
      await renderSinglePropertyFocus(only);
      return;
    }

    // multiple properties: populate selector and show a grid overview
    populatePropertySelector(props);
    const active = SC.getActiveProperty() || props[0];
    if (active) SC.setActiveProperty(active.id || active.key || active.slug);
    document.getElementById('propSelect').value = (active.id || active.key || active.slug);
    // render overview grid for multiple properties
    // ensure container exists
    let multi = document.getElementById('multiPropertyGrid');
    if (!multi) {
      multi = document.createElement('div'); multi.id='multiPropertyGrid'; multi.style.display='flex'; multi.style.flexWrap='wrap'; multi.style.gap='12px'; document.getElementById('kpiGrid').parentNode.insertBefore(multi, document.getElementById('kpiGrid'));
    }
    await renderMultiPropertyGrid(props);

    // listen to language changes
    try { if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.onChange === 'function') {
      window.NEXEFII.i18n.onChange(()=>{ try { loadAndRender(SC.getActiveProperty()); } catch(e){} });
    } } catch(e){}
  }

  window.addEventListener('DOMContentLoaded', init);
})();
