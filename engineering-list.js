(function(){
  const qs = new URLSearchParams(location.search);
  const metricParam = qs.get('metric') || 'On';
  const langParam = qs.get('lang') || (localStorage.getItem('ilux_lang')||'pt');
  // keep language consistent with the rest of the app
  try{ localStorage.setItem('ilux_lang', langParam); }catch(e){}

  const STR = (typeof getStrings === 'function') ? getStrings(langParam) : {
    engineeringTitle:'ENGENHARIA', hvacOn:'HVAC On', hvacCool:'Cool', hvacHeat:'Heat', hvacAuto:'Auto', hvacOff:'HVAC Off'
  };

  const optionLabels = {
    On: STR.hvacOn || 'HVAC On',
    Cool: STR.hvacCool || 'Cool',
    Heat: STR.hvacHeat || 'Heat',
    Auto: STR.hvacAuto || 'Auto',
    Off: STR.hvacOff || 'HVAC Off'
  };

  const selectMap = {
    'hvac_on':'On','hvac_cool':'Cool','hvac_heat':'Heat','hvac_auto':'Auto','hvac_off':'Off'
  };
  const reverseSelectMap = Object.fromEntries(Object.entries(selectMap).map(([k,v])=>[v,k]));

  // DOM refs
  const listTitle = document.getElementById('header-title');
  const headingLbl = document.getElementById('metricLabel');
  const metricSelect = document.getElementById('categoryFilter') || document.getElementById('metricSelect');
  const floorFilter = document.getElementById('floorFilter');
  const sortBy = document.getElementById('sortBy');
  const searchBox = document.getElementById('searchBox');
  const tbody = document.getElementById('roomsTbody');
  const grid = document.getElementById('roomGrid');
  const resInfo = document.getElementById('resultInfo');
  const thRoom = document.getElementById('th-room');
  const thHvac = document.getElementById('th-hvac');
  const thHk = document.getElementById('th-hk');
  const thAlerts = document.getElementById('th-alerts');

  // Page labels
  if(listTitle) listTitle.innerText = (STR.engineeringTitle||'ENGENHARIA') + ' · Lista';

  // Build options in select if empty
  if(metricSelect && metricSelect.options.length<=0){
    metricSelect.innerHTML = [
      `<option value="hvac_on">${optionLabels.On}</option>`,
      `<option value="hvac_cool">${optionLabels.Cool}</option>`,
      `<option value="hvac_heat">${optionLabels.Heat}</option>`,
      `<option value="hvac_auto">${optionLabels.Auto}</option>`,
      `<option value="hvac_off">${optionLabels.Off}</option>`
    ].join('');
  }

  // Choose initial metric
  const initialMetric = (['On','Cool','Heat','Auto','Off'].includes(metricParam)) ? metricParam : (selectMap[metricParam]||'On');
  if(metricSelect) metricSelect.value = reverseSelectMap[initialMetric] || 'hvac_on';
  if(headingLbl) headingLbl.innerText = optionLabels[initialMetric];

  // Suites data snapshot
  let suites = [];
  try{ suites = JSON.parse(localStorage.getItem('sim_suites_snapshot')||'[]'); }catch(e){suites=[]}
  if(!Array.isArray(suites) || suites.length===0){
    if(typeof buildInitialSuites === 'function') suites = buildInitialSuites(11,9);
    else suites = [];
  }

  function roomNumber(s){ return s.floor*100 + s.suite; }

  function filterSuites(metricKey){
    // metricKey in ['On','Cool','Heat','Auto','Off']
    let arr = suites.filter(s=>s.hvac===metricKey);
    const floorVal = floorFilter && floorFilter.value !== 'all' ? parseInt(floorFilter.value,10) : null;
    if(floorVal) arr = arr.filter(s=>s.floor===floorVal);
    const q = (searchBox && searchBox.value || '').trim();
    if(q){ arr = arr.filter(s => (roomNumber(s)+ '').includes(q)); }
    // sort by room by default
    arr.sort((a,b)=> roomNumber(a) - roomNumber(b));
    return arr;
  }

  function render(){
    const metricKey = selectMap[metricSelect.value] || 'On';
    if(headingLbl) headingLbl.innerText = optionLabels[metricKey];

    const list = filterSuites(metricKey);
    if(resInfo) resInfo.innerText = `${list.length} quartos encontrados`;

    // Prefer grid if exists in HTML; else render table tbody
    if(grid){
      grid.innerHTML = list.map(s=>{
        const rn = roomNumber(s);
        const alerts = (s.alerts && s.alerts.length) ? s.alerts.join(', ') : '-';
        return `
          <div class="room-card">
            <div class="room-header">
              <div class="room-number">${rn}</div>
              <span class="badge">${s.hvac}</span>
            </div>
            <div class="room-info">
              <div class="info-row"><span class="info-label">HVAC</span><span>${s.hvac}</span></div>
              <div class="info-row"><span class="info-label">Governança</span><span>${s.hk||'-'}</span></div>
              <div class="info-row"><span class="info-label">Alertas</span><span>${alerts}</span></div>
            </div>
          </div>`;
      }).join('');
      return;
    }

    if(!tbody) return;
    tbody.innerHTML = list.map(s=>{
      const rn = roomNumber(s);
      const alerts = (s.alerts && s.alerts.length) ? s.alerts.join(', ') : '-';
      return `<tr>
        <td>${rn}</td><td>${s.hvac}</td><td>${s.hk||'-'}</td><td>${alerts}</td>
      </tr>`; 
    }).join('');
  }

  function onChange(){
    // persist current suites for refresh/back
    try{ localStorage.setItem('sim_suites_snapshot', JSON.stringify(suites)); }catch(e){}
    // Update URL param without reloading
    const mk = selectMap[metricSelect.value] || 'On';
    const url = new URL(location.href);
    url.searchParams.set('metric', mk);
    history.replaceState({}, '', url);
    render();
  }

  // Bind events
  if(metricSelect) metricSelect.addEventListener('change', onChange);
  if(floorFilter) floorFilter.addEventListener('change', render);
  if(sortBy) sortBy.addEventListener('change', render);
  if(searchBox) searchBox.addEventListener('input', ()=>{ render(); });

  // Initial render
  render();
})();
