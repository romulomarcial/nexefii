// Real-time alerts data from SIM_SUITES
const ALERTS_DEBUG = false;
let ALERTS_CURRENT_FLOOR = "all";
let ALERTS_SUITES = [];
let ALERTS_PAGE_SIZE = 10;
let ALERTS_CURRENT_PAGE = 1;
let ALERTS_CURRENT_ROWS = [];
let ALERTS_CURRENT_TYPE = 'all';
let ALERTS_I18N_S = null;
let ALERTS_LANG = 'pt';

// Load SIM_SUITES from opener or snapshot
function loadAlertsSuites(){
  if(ALERTS_DEBUG) console.log('[ALERTS] loadAlertsSuites called');
  try{
    if(window.opener && window.opener.SIM_SUITES && Array.isArray(window.opener.SIM_SUITES)){
      ALERTS_SUITES = window.opener.SIM_SUITES;
      if(ALERTS_DEBUG) console.log('[ALERTS] Loaded suites from opener:', ALERTS_SUITES.length);
      return;
    }
  }catch(e){ if(ALERTS_DEBUG) console.warn('[ALERTS] Could not load from opener', e); }
  // fallback: load from snapshot
  try{
    const snap = localStorage.getItem('sim_suites_snapshot');
    if(snap) {
      ALERTS_SUITES = JSON.parse(snap);
      if(ALERTS_DEBUG) console.log('[ALERTS] Loaded suites from snapshot:', ALERTS_SUITES.length);
    }
  }catch(e){ if(ALERTS_DEBUG) console.warn('[ALERTS] Could not load from snapshot', e); }
}

// Transform SIM_SUITES item to alerts row
function mapSuiteToAlertsRow(s){
  const room = (s.floor*100 + s.suite).toString();
  const lang = ALERTS_LANG || (localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang')) || 'pt';
  
  // Translate alert types
  const translateAlert = (alertType) => {
    if(alertType === 'Thermostat Offline') {
      return lang === 'en' ? 'Thermostat Offline' : (lang === 'es' ? 'Termostato Desconectado' : 'Termostato Desconectado');
    }
    if(alertType === 'HVAC Maintenance') {
      return lang === 'en' ? 'HVAC Maintenance' : (lang === 'es' ? 'Mantenimiento HVAC' : 'ManutenÃ§Ã£o HVAC');
    }
    if(alertType === 'High Humidity') {
      return lang === 'en' ? 'High Humidity' : (lang === 'es' ? 'Humedad Alta' : 'Umidade Alta');
    }
    return alertType;
  };
  
  const alerts = (s.alerts && s.alerts.length) ? s.alerts.map(a => {
    const cls = (a==='Thermostat Offline'?'alert-offline':(a==='HVAC Maintenance'?'alert-maintenance':'alert-humidity'));
    return `<span class="alert-chip ${cls}">${translateAlert(a)}</span>`;
  }).join(' ') : '-----';
  
  const hvac = s.hvac || '-----';
  const thermostatStatus = (s.alerts && s.alerts.includes('Thermostat Offline')) ? 
    (lang === 'en' ? 'Offline' : (lang === 'es' ? 'Desconectado' : 'Desconectado')) :
    (lang === 'en' ? 'Online' : (lang === 'es' ? 'En lÃ­nea' : 'Online'));
  const humidity = (s.humidity !== undefined && s.humidity !== null) ? s.humidity + '%' : '-----';
  const lastUpdate = s.lastUpdate || '-----';
  
  return { room, alerts, hvac, thermostat: thermostatStatus, humidity, lastUpdate, alertsRaw: s.alerts || [] };
}

function alertsPopulateGrid(rooms){
  const container = document.getElementById('alertsRoomRows');
  if(!container) return;
  if(ALERTS_DEBUG) console.log('[ALERTS] Populating grid with', rooms.length, 'rooms');
  if(!rooms.length){
    const lang = ALERTS_LANG || (localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang')) || 'pt';
    const emptyMsg = (lang==='en'?'No alerts at the moment':(lang==='es'?'Sin alertas en este momento':'Nenhum alerta no momento'));
    container.innerHTML = `<div class="muted" style="padding:12px">${emptyMsg}</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  rooms.forEach(r => {
    const row = document.createElement('div');
    row.className = 'room-row';
    row.innerHTML = `
      <div>${r.room}</div>
      <div>${r.alerts}</div>
      <div>${r.hvac}</div>
      <div>${r.thermostat}</div>
      <div>${r.humidity}</div>
      <div>${r.lastUpdate}</div>
    `;
    frag.appendChild(row);
  });
  container.innerHTML = '';
  container.appendChild(frag);
}

function alertsUpdatePaginationUI(){
  const info = document.getElementById('page-info');
  const totalPages = Math.max(1, Math.ceil(ALERTS_CURRENT_ROWS.length / ALERTS_PAGE_SIZE));
  if(info) info.textContent = `${ALERTS_CURRENT_PAGE} / ${totalPages}`;
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if(prev) prev.disabled = (ALERTS_CURRENT_PAGE <= 1);
  if(next) next.disabled = (ALERTS_CURRENT_PAGE >= totalPages);
}

function alertsRender(){
  const start = (ALERTS_CURRENT_PAGE - 1) * ALERTS_PAGE_SIZE;
  const end = start + ALERTS_PAGE_SIZE;
  const pageRows = ALERTS_CURRENT_ROWS.slice(start, end);
  alertsPopulateGrid(pageRows);
  alertsUpdatePaginationUI();
}

function alertsPrevPage(){ 
  if(ALERTS_CURRENT_PAGE > 1){ 
    ALERTS_CURRENT_PAGE--; 
    alertsRender(); 
  } 
}

function alertsNextPage(){ 
  const t = Math.max(1, Math.ceil(ALERTS_CURRENT_ROWS.length / ALERTS_PAGE_SIZE)); 
  if(ALERTS_CURRENT_PAGE < t){ 
    ALERTS_CURRENT_PAGE++; 
    alertsRender(); 
  } 
}
window.alertsPrevPage = alertsPrevPage;
window.alertsNextPage = alertsNextPage;

function alertsApplyFiltersAndRender(){
  let suites = [];
  const floor = ALERTS_CURRENT_FLOOR;
  const type = ALERTS_CURRENT_TYPE;
  if(String(floor).toLowerCase() === 'all'){
    suites = ALERTS_SUITES.slice();
  } else {
    const floorNum = parseInt(floor, 10);
    suites = ALERTS_SUITES.filter(s => s.floor === floorNum);
  }
  // only suites that have any alerts
  suites = suites.filter(s => s.alerts && s.alerts.length > 0);
  // filter by type
  if(type && type !== 'all'){
    const typeMap = {
      offline: 'Thermostat Offline',
      maintenance: 'HVAC Maintenance',
      humidity: 'High Humidity'
    };
    const want = typeMap[type];
    suites = suites.filter(s => Array.isArray(s.alerts) && s.alerts.includes(want));
  }
  // sort and map
  suites.sort((a,b) => (a.floor*100+a.suite) - (b.floor*100+b.suite));
  ALERTS_CURRENT_ROWS = suites.map(mapSuiteToAlertsRow);
  alertsRender();
  alertsUpdateFloorCounts();
}

function alertsChangeFloor(floor){
  if(ALERTS_DEBUG) console.log('[ALERTS] alertsChangeFloor called with:', floor);
  ALERTS_CURRENT_FLOOR = floor;
  ALERTS_CURRENT_PAGE = 1;
  loadAlertsSuites();
  alertsApplyFiltersAndRender();
  const rs = document.getElementById('roomSearch'); if(rs) rs.value = '';
}

function alertsChangeType(val){
  if(ALERTS_DEBUG) console.log('[ALERTS] alertsChangeType:', val);
  ALERTS_CURRENT_TYPE = val || 'all';
  ALERTS_CURRENT_PAGE = 1;
  alertsApplyFiltersAndRender();
}
window.alertsChangeType = alertsChangeType;

function alertsUpdateFloorCounts(){
  try{
    const box = document.getElementById('floorCounts');
    if(!box) return;
    const counts = { };
    const type = ALERTS_CURRENT_TYPE;
    const typeMap = {
      offline: 'Thermostat Offline',
      maintenance: 'HVAC Maintenance',
      humidity: 'High Humidity'
    };
    const want = type && type !== 'all' ? typeMap[type] : null;
    ALERTS_SUITES.forEach(s => {
      if(!s.alerts || !s.alerts.length) return;
      if(want && !(Array.isArray(s.alerts) && s.alerts.includes(want))) return;
      counts[s.floor] = (counts[s.floor]||0) + 1;
    });
    const floors = Object.keys(counts).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    if(!floors.length){ box.innerHTML = ''; return; }
    box.innerHTML = floors.map(f => `<span class="count-chip">${f}Âº: ${counts[f]}</span>`).join('');
  }catch(e){ console.warn('[ALERTS] alertsUpdateFloorCounts failed', e); }
}

function alertsSearchRoom(){
  const val = (document.getElementById('roomSearch')||{}).value || '';
  if(!val) return;
  if(ALERTS_DEBUG) console.log('[ALERTS] Searching for room:', val);
  loadAlertsSuites();
  let foundFloor = null; let found = null;
  ALERTS_SUITES.forEach(s=>{
    const rn = (s.floor*100 + s.suite).toString();
    if(rn === val && s.alerts && s.alerts.length > 0){ 
      foundFloor = s.floor; 
      found = s;
    }
  });
  if(foundFloor){
    if(ALERTS_DEBUG) console.log('[ALERTS] Found room on floor:', foundFloor);
    const sel = document.getElementById('floorSelect');
    const usingAll = sel && sel.value === 'all';
    if(usingAll){
      alertsChangeFloor('all');
      const idx = ALERTS_CURRENT_ROWS.findIndex(r => r.room === val);
      if(idx >= 0){ ALERTS_CURRENT_PAGE = Math.floor(idx / ALERTS_PAGE_SIZE) + 1; alertsRender(); }
    } else {
      if(sel) sel.value = foundFloor.toString();
      alertsChangeFloor(foundFloor.toString());
    }
    try{
      const container = document.getElementById('alertsRoomRows');
      const node = Array.from(container.children).find(ch => ch.firstElementChild && ch.firstElementChild.textContent === val);
      if(node){ node.style.background = 'rgba(59,130,246,0.1)'; setTimeout(()=>{ node.style.background=''; }, 1800); }
    }catch(e){}
  } else {
    if(ALERTS_DEBUG) console.log('[ALERTS] Room not found or has no alerts');
  }
}

async function alertsLoadAndApplyI18N(requestedLang) {
    if(ALERTS_DEBUG) console.log('[ALERTS] alertsLoadAndApplyI18N called with lang:', requestedLang);
    const keyCache = 'i18n_cache';
    const now = Date.now();
    let data = null;
    try {
        const cached = localStorage.getItem(keyCache);
        if (cached) {
            data = JSON.parse(cached);
            if(ALERTS_DEBUG) console.log('[ALERTS] Loaded i18n from cache');
        }
    } catch (e) {
        if(ALERTS_DEBUG) console.warn('[ALERTS] Could not read i18n cache', e);
    }

    if (!data) {
        if(ALERTS_DEBUG) console.log('[ALERTS] Fetching i18n.json...');
        try {
            const res = await fetch('i18n.json?t=' + now, {cache:'no-store'});
            if (res.ok) {
                data = await res.json();
                try { localStorage.setItem(keyCache, JSON.stringify(data)); } catch(e){}
            }
        } catch(e) {
            if(ALERTS_DEBUG) console.warn('[ALERTS] Could not fetch i18n.json', e);
        }
    }

    const lang = requestedLang || ((localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang')) || 'pt');
    ALERTS_LANG = lang;
    const S = (data && data[lang] && data[lang].app) ? data[lang].app : (data && data.pt && data.pt.app) ? data.pt.app : {};
    ALERTS_I18N_S = S;
    alertsApplyTexts(S, lang);
}

function alertsApplyTexts(S, langParam) {
    if(ALERTS_DEBUG) console.log('[ALERTS] alertsApplyTexts');
    ALERTS_LANG = langParam;
    const title = (langParam==='en' ? 'nexefii Â· Manage Alerts' : (langParam==='es' ? 'nexefii Â· Gestionar Alertas' : 'nexefii Â· Gerenciar Alertas'));
    const headerEl = document.getElementById('header-title');
    if(headerEl) headerEl.textContent = title;
    const alertsTitleEl = document.getElementById('alertsTitle');
    if(alertsTitleEl) alertsTitleEl.textContent = 'Room Information - ' + (S.alertsTitle || 'ALERTAS');
    
    const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent = txt; };
    set('col-room', (S && S.colRoom) ? S.colRoom : (langParam==='en'?'ROOM':(langParam==='es'?'HABITACIÃ“N':'QUARTO')));
    set('col-alerts', (S && S.colAlert) ? S.colAlert+'S' : (langParam==='en'?'ALERTS':(langParam==='es'?'ALERTAS':'ALERTAS')));
    set('col-hvac', (S && S.colHvac) ? S.colHvac : 'HVAC');
    set('col-thermostat', (S && S.colThermostat) ? S.colThermostat : (langParam==='en'?'THERMOSTAT':(langParam==='es'?'TERMOSTATO':'TERMOSTATO')));
    set('col-humidity', (S && S.colHumidity) ? S.colHumidity : (langParam==='en'?'HUMIDITY':(langParam==='es'?'HUMEDAD':'UMIDADE')));
    set('col-lastupdate', (S && S.colLastUpdate) ? S.colLastUpdate : (langParam==='en'?'LAST UPDATE':(langParam==='es'?'ÃšLTIMA ACTUALIZACIÃ“N':'ÃšLTIMA ATUALIZAÃ‡ÃƒO')));
    set('lbl-floor', (S && S.floorLabel) ? S.floorLabel : (langParam==='en'?'Floor:':(langParam==='es'?'Piso:':'Pavimento:')));
    set('lbl-room', (S && S.roomLabel) ? S.roomLabel : (langParam==='en'?'Room:':(langParam==='es'?'HabitaciÃ³n:':'Quarto:')));
    set('lbl-type', (S && S.typeLabel) ? S.typeLabel : (langParam==='en'?'Type:':(langParam==='es'?'Tipo:':'Tipo:')));
    const btn = document.getElementById('btn-search'); if(btn) btn.textContent = (S && S.search) ? S.search : (langParam==='en'?'Search':(langParam==='es'?'Buscar':'Buscar'));
    const closeBtn = document.querySelector('header button.btn.ghost'); if(closeBtn) closeBtn.textContent = (S && S.close) ? S.close : (langParam==='en'?'Close':(langParam==='es'?'Cerrar':'Fechar'));
    const optAll = document.getElementById('opt-all-floors'); if(optAll) optAll.textContent = (S && S.allFloors) ? S.allFloors : (langParam==='en'?'All floors':(langParam==='es'?'Todos los pisos':'Todos os andares'));
    const btnPrev = document.getElementById('btn-prev'); if(btnPrev) btnPrev.textContent = (S && S.previous) ? S.previous : (langParam==='en'?'Previous':(langParam==='es'?'Anterior':'Anterior'));
    const btnNext = document.getElementById('btn-next'); if(btnNext) btnNext.textContent = (S && S.next) ? S.next : (langParam==='en'?'Next':(langParam==='es'?'Siguiente':'PrÃ³ximo'));
    const btnCsv = document.getElementById('btn-export-csv'); if(btnCsv) btnCsv.textContent = (S && S.exportCSV) ? S.exportCSV : (langParam==='en'?'Export CSV':(langParam==='es'?'Exportar CSV':'Exportar CSV'));
    const oAll = document.getElementById('opt-type-all'); if(oAll) oAll.textContent = (S && S.filterAll) ? S.filterAll : (langParam==='en'?'All':(langParam==='es'?'Todos':'Todos'));
    const oOff = document.getElementById('opt-type-offline'); if(oOff) oOff.textContent = (S && S.filterThermOffline) ? S.filterThermOffline : (langParam==='en'?'Thermostat Offline':(langParam==='es'?'Termostato Desconectado':'Termostato Desconectado'));
    const oMaint = document.getElementById('opt-type-maintenance'); if(oMaint) oMaint.textContent = (S && S.filterHVACMaint) ? S.filterHVACMaint : (langParam==='en'?'HVAC Maintenance':(langParam==='es'?'Mantenimiento HVAC':'ManutenÃ§Ã£o HVAC'));
    const oHum = document.getElementById('opt-type-humidity'); if(oHum) oHum.textContent = (S && S.filterHighHumidity) ? S.filterHighHumidity : (langParam==='en'?'High Humidity':(langParam==='es'?'Humedad Alta':'Umidade Alta'));
}

async function alertsInitI18N(){
  if(ALERTS_DEBUG) console.log('[ALERTS] alertsInitI18N called');
  try{
    const storedLang = (localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang'));
    const urlLang = new URLSearchParams(location.search).get('lang');
    const langParam = storedLang || urlLang || 'pt';
    
    try{ localStorage.setItem('nexefii_lang',langParam); }catch(e){} try{ localStorage.setItem('nexefii_lang',langParam); }catch(e){};
    const select = document.getElementById('langSelect'); 
    if(select) select.value = langParam;
    
    if (typeof loadAppI18N === 'function') {
        try {
            await loadAppI18N();
            let S = null; 
            try{ 
                const c=localStorage.getItem('i18n_cache'); 
                if(c){ 
                    const p=JSON.parse(c); 
                    S = (p[langParam] && p[langParam].app) ? p[langParam].app : null;
                } 
            }catch(_){ S=null; }
            if(S) {
                ALERTS_I18N_S = S;
                ALERTS_LANG = langParam;
                alertsApplyTexts(S, langParam);
            } else {
                await alertsLoadAndApplyI18N(langParam);
            }
        } catch (e) {
            console.warn('[ALERTS] loadAppI18N failed, using fallback', e);
            await alertsLoadAndApplyI18N(langParam);
        }
    } else {
        await alertsLoadAndApplyI18N(langParam);
    }
  }catch(e){ console.error('[ALERTS] alertsInitI18N failed', e); }
}

async function changeLanguage(newLang){
  if(ALERTS_DEBUG) console.log('[ALERTS] changeLanguage called with:', newLang);
  try{ localStorage.setItem('nexefii_lang',newLang); }catch(e){} try{ localStorage.setItem('nexefii_lang',newLang); }catch(e){};
  const select = document.getElementById('langSelect'); 
  if(select) select.value = newLang;
  
  try{
    localStorage.removeItem('i18n_cache');
    localStorage.removeItem('i18n_cache_time');
    if(window.opener && typeof window.opener.loadAppI18N === 'function'){
      await window.opener.loadAppI18N();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }catch(e){ console.error('[ALERTS] Failed to reload i18n from opener', e); }
  
  await alertsLoadAndApplyI18N(newLang);
  alertsChangeFloor(ALERTS_CURRENT_FLOOR);
}
window.changeLanguage = changeLanguage;

window.addEventListener('DOMContentLoaded', async ()=>{
  if(ALERTS_DEBUG) console.log('[ALERTS] DOMContentLoaded event fired');
  await alertsInitI18N();
  loadAlertsSuites();
  const sel = document.getElementById('floorSelect'); if(sel) sel.value = 'all';
  const ts = document.getElementById('typeSelect'); if(ts) ts.value = 'all';
  alertsChangeFloor('all');
  try{
    setInterval(()=>{
      loadAlertsSuites();
      alertsApplyFiltersAndRender();
    }, 5000);
  }catch(e){ console.warn('[ALERTS] could not start refresh interval', e); }
});

window.addEventListener('storage', async function(e){
  try{
    if(!e) return;
    if(e.key === 'nexefii_lang' || e.key === 'i18n_cache' || e.key === 'i18n_cache_timestamp'){
      const newLang = (localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang')) || 'pt';
      const sel = document.getElementById('langSelect'); if(sel) sel.value = newLang;
      await alertsLoadAndApplyI18N(newLang);
      alertsRender();
    }
  }catch(err){ console.error('[ALERTS] storage handler failed', err); }
});

function alertsExportCSV(){
  try{
    const lang = ALERTS_LANG || ((localStorage.getItem('nexefii_lang') || localStorage.getItem('nexefii_lang'))||'pt');
    let S = ALERTS_I18N_S;
    if(!S){
      try{ const c=localStorage.getItem('i18n_cache'); if(c){ const p=JSON.parse(c); S = (p[lang] && p[lang].app) ? p[lang].app : null; } }catch(_){ S=null; }
    }
    
    const headers = [
      (S && S.colRoom) ? S.colRoom : (lang==='en'?'ROOM':(lang==='es'?'HABITACIÃ“N':'QUARTO')),
      (S && S.colAlert) ? S.colAlert+'S' : (lang==='en'?'ALERTS':(lang==='es'?'ALERTAS':'ALERTAS')),
      (S && S.colHvac) ? S.colHvac : 'HVAC',
      (S && S.colThermostat) ? S.colThermostat : (lang==='en'?'THERMOSTAT':(lang==='es'?'TERMOSTATO':'TERMOSTATO')),
      (S && S.colHumidity) ? S.colHumidity : (lang==='en'?'HUMIDITY':(lang==='es'?'HUMEDAD':'UMIDADE')),
      (S && S.colLastUpdate) ? S.colLastUpdate : (lang==='en'?'LAST UPDATE':(lang==='es'?'ÃšLTIMA ACTUALIZACIÃ“N':'ÃšLTIMA ATUALIZAÃ‡ÃƒO'))
    ];
    
    const translateAlert = (alertType) => {
      if(alertType === 'Thermostat Offline') {
        return lang === 'en' ? 'Thermostat Offline' : (lang === 'es' ? 'Termostato Desconectado' : 'Termostato Desconectado');
      }
      if(alertType === 'HVAC Maintenance') {
        return lang === 'en' ? 'HVAC Maintenance' : (lang === 'es' ? 'Mantenimiento HVAC' : 'ManutenÃ§Ã£o HVAC');
      }
      if(alertType === 'High Humidity') {
        return lang === 'en' ? 'High Humidity' : (lang === 'es' ? 'Humedad Alta' : 'Umidade Alta');
      }
      return alertType;
    };
    
    const rows = ALERTS_CURRENT_ROWS.map(r=>{
      const alertsText = r.alertsRaw && r.alertsRaw.length ? r.alertsRaw.map(translateAlert).join('; ') : '';
      return [
        r.room,
        alertsText,
        r.hvac || '',
        r.thermostat || '',
        r.humidity || '',
        r.lastUpdate || ''
      ];
    });
    
    const csv = [headers].concat(rows).map(line=> line.map(col=>`"${String(col).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dt = new Date();
    a.download = `alerts_${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){
    console.error('[ALERTS] CSV export failed', e);
  }
}
window.alertsExportCSV = alertsExportCSV;

