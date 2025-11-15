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

  function populatePropertySelector(props){
    const sel = document.getElementById('propSelect'); sel.innerHTML='';
    props.forEach(p=>{
      const o = document.createElement('option'); o.value = p.id || p.key || p.slug; o.textContent = p.name || p.slug || (p.key || p.id);
      sel.appendChild(o);
    });
    sel.addEventListener('change', (e)=>{
      const val = e.target.value; SC.setActiveProperty(val); const active = SC.getActiveProperty(); loadAndRender(active);
    });
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
    populatePropertySelector(props);
    const active = SC.getActiveProperty() || props[0];
    if (active) SC.setActiveProperty(active.id || active.key || active.slug);
    document.getElementById('propSelect').value = (active.id || active.key || active.slug);
    await loadAndRender(active);

    // listen to language changes
    try { if (window.NEXEFII && window.NEXEFII.i18n && typeof window.NEXEFII.i18n.onChange === 'function') {
      window.NEXEFII.i18n.onChange(()=>{ try { loadAndRender(SC.getActiveProperty()); } catch(e){} });
    } } catch(e){}
  }

  window.addEventListener('DOMContentLoaded', init);
})();
