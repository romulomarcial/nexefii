// Real-time housekeeping data from SIM_SUITES (access via window.parent or snapshot)
let HK_CURRENT_FLOOR = "3";
let HK_SUITES = [];
// Pagination state
let HK_PAGE_SIZE = 10;
let HK_CURRENT_PAGE = 1;
let HK_CURRENT_ROWS = [];

// Load SIM_SUITES from opener or snapshot
function loadHKSuites(){
  try{
    if(window.opener && window.opener.SIM_SUITES && Array.isArray(window.opener.SIM_SUITES)){
      HK_SUITES = window.opener.SIM_SUITES;
      return;
    }
  }catch(e){}
  // fallback: load from snapshot
  try{
    const snap = localStorage.getItem('sim_suites_snapshot');
    if(snap) HK_SUITES = JSON.parse(snap);
  }catch(e){}
}

// Transform SIM_SUITES item to housekeeping row
function mapSuiteToHKRow(s){
  const room = (s.floor*100 + s.suite).toString();
  const occupied = (String(s.occupied||'').toLowerCase()==='yes') ? 'yes' : '--';
  const sold = (String(s.sold||'').toLowerCase()==='sold') ? 'sold' : '--';
  const dnd = (s.hk === 'DND' || String(s.dnd||'').toLowerCase()==='yes') ? 'yes' : '--';
  const mur = (s.hk === 'MUR' || String(s.mur||'').toLowerCase()==='ok') ? 'ok' : '--';
  const callService = (s.hk === 'CallService' || String(s.callService||'').toLowerCase()==='yes') ? 'yes' : '--';
  const callTime = s.callTime || '-----';
  const lastUpdate = s.lastUpdate || '-----';
  return { room, occupied, sold, dnd, mur, callService, callTime, lastUpdate };
}

function hkPopulateGrid(rooms){
  const container = document.getElementById('hkRoomRows');
  if(!container) return;
  const lang = localStorage.getItem('ilux_lang')||'pt';
  const L = (typeof getStrings === 'function') ? getStrings(lang) : {};
  
  // Translation maps
  const yesText = (lang==='en'?'Yes':(lang==='es'?'SÃ­':'Sim'));
  const soldText = (lang==='en'?'Sold':(lang==='es'?'Vendido':'Vendido'));
  const okText = (lang==='en'?'OK':(lang==='es'?'OK':'OK'));
  
  const frag = document.createDocumentFragment();
  rooms.forEach(r => {
    const row = document.createElement('div');
    row.className = 'room-row';
    const occHtml = (String(r.occupied||'').toLowerCase()==='yes') ? `<div class="status-yes">${yesText}</div>` : '<div class="muted">-----</div>';
    const soldHtml = (String(r.sold||'').toLowerCase()==='sold') ? `<div class="status-sold">${soldText}</div>` : '<div class="muted">-----</div>';
    const dndHtml = (String(r.dnd||'').toLowerCase()==='yes') ? `<div class="status-yes">${yesText}</div>` : '<div class="muted">-----</div>';
    const murHtml = (String(r.mur||'').toLowerCase()==='ok') ? `<div class="status-sold">${okText}</div>` : '<div class="muted">-----</div>';
    const csHtml = (String(r.callService||'').toLowerCase()==='yes') ? `<div class="status-yes">${yesText}</div>` : '<div class="muted">-----</div>';
    // One combined time column: service time if available, else last update
    const timeVal = (String(r.callService||'').toLowerCase()==='yes' && r.callTime && r.callTime!=='-----') ? r.callTime : (r.lastUpdate || '-----');

    row.innerHTML = `
      <div>${r.room}</div>
      ${occHtml}
      ${soldHtml}
      ${dndHtml}
      ${murHtml}
      <div>${csHtml}</div>
      <div>${timeVal}</div>
    `;
    frag.appendChild(row);
  });
  container.innerHTML = '';
  container.appendChild(frag);
}

function hkUpdatePaginationUI(){
  const info = document.getElementById('page-info');
  const totalPages = Math.max(1, Math.ceil(HK_CURRENT_ROWS.length / HK_PAGE_SIZE));
  if(info) info.textContent = `${HK_CURRENT_PAGE} / ${totalPages}`;
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if(prev) prev.disabled = (HK_CURRENT_PAGE <= 1);
  if(next) next.disabled = (HK_CURRENT_PAGE >= totalPages);
}

function hkRender(){
  const start = (HK_CURRENT_PAGE - 1) * HK_PAGE_SIZE;
  const end = start + HK_PAGE_SIZE;
  const pageRows = HK_CURRENT_ROWS.slice(start, end);
  hkPopulateGrid(pageRows);
  hkUpdatePaginationUI();
}

function hkPrevPage(){ if(HK_CURRENT_PAGE>1){ HK_CURRENT_PAGE--; hkRender(); } }
function hkNextPage(){ const t = Math.max(1, Math.ceil(HK_CURRENT_ROWS.length / HK_PAGE_SIZE)); if(HK_CURRENT_PAGE<t){ HK_CURRENT_PAGE++; hkRender(); } }
window.hkPrevPage = hkPrevPage;
window.hkNextPage = hkNextPage;

function hkChangeFloor(floor){
  HK_CURRENT_FLOOR = floor;
  HK_CURRENT_PAGE = 1;
  loadHKSuites();
  let suites = [];
  if(String(floor).toLowerCase()==='all'){
    suites = HK_SUITES.slice();
  } else {
    const floorNum = parseInt(floor, 10);
    suites = HK_SUITES.filter(s => s.floor === floorNum);
  }
  // sort by room number for stable order
  suites.sort((a,b)=> (a.floor*100+a.suite) - (b.floor*100+b.suite));
  HK_CURRENT_ROWS = suites.map(mapSuiteToHKRow);
  hkRender();
  const rs = document.getElementById('roomSearch'); if(rs) rs.value = '';
}

function hkSearchRoom(){
  const val = (document.getElementById('roomSearch')||{}).value || '';
  if(!val) return;
  loadHKSuites();
  // find across all floors
  let foundFloor = null; let found = null;
  HK_SUITES.forEach(s=>{
    const rn = (s.floor*100 + s.suite).toString();
    if(rn === val){ foundFloor = s.floor; found = s; }
  });
  if(foundFloor){
    const sel = document.getElementById('floorSelect');
    const usingAll = sel && sel.value === 'all';
    if(usingAll){
      hkChangeFloor('all');
      const idx = HK_CURRENT_ROWS.findIndex(r => r.room === val);
      if(idx>=0){ HK_CURRENT_PAGE = Math.floor(idx / HK_PAGE_SIZE) + 1; hkRender(); }
    } else {
      if(sel) sel.value = foundFloor.toString();
      hkChangeFloor(foundFloor.toString());
    }
    // highlight
    try{
      const container = document.getElementById('hkRoomRows');
      const node = Array.from(container.children).find(ch => ch.firstElementChild && ch.firstElementChild.textContent === val);
      if(node){ node.style.background = 'rgba(59,130,246,0.1)'; setTimeout(()=>{ node.style.background=''; }, 1800); }
    }catch(e){}
  }
}

async function hkLoadAndApplyI18N(requestedLang) {
    console.log('[HK] hkLoadAndApplyI18N called with lang:', requestedLang);
    const keyCache = 'i18n_cache';
    const now = Date.now();
    let data = null;
    try {
        const cached = localStorage.getItem(keyCache);
        if (cached) {
            data = JSON.parse(cached);
            console.log('[HK] Loaded i18n from cache, keys:', data ? Object.keys(data) : 'none');
        } else {
            console.log('[HK] No i18n cache found');
        }
    } catch (e) {
        console.warn('[HK] Could not read i18n cache', e);
    }

    if (!data) {
        // fetch fresh
        console.log('[HK] Fetching i18n.json...');
        try {
            const res = await fetch('i18n.json?t=' + now, {cache:'no-store'});
            console.log('[HK] Fetch response status:', res.status);
            if (res.ok) {
                data = await res.json();
                console.log('[HK] Fetched i18n.json, keys:', data ? Object.keys(data) : 'none');
                try { localStorage.setItem(keyCache, JSON.stringify(data)); } catch(e){console.warn('[HK] Could not cache i18n', e);}
            }
        } catch(e) {
            console.warn('[HK] Could not fetch i18n.json', e);
        }
    }

    const lang = requestedLang || (localStorage.getItem('ilux_lang') || 'pt');
    console.log('[HK] Using language:', lang);
    const S = (data && data[lang] && data[lang].app) ? data[lang].app : (data && data.pt && data.pt.app) ? data.pt.app : {};
    console.log('[HK] Strings pack has keys:', S ? Object.keys(S).length : 0);
    hkApplyTexts(S, lang);
}

function hkApplyTexts(S, langParam) {
    console.log('[HK] hkApplyTexts called with lang:', langParam, 'S keys:', S ? Object.keys(S).length : 0);
    const title = (langParam==='en' ? 'nexefii Â· Housekeeping Control' : (langParam==='es' ? 'nexefii Â· Control de Gobernanza' : 'nexefii Â· Controle de GovernanÃ§a'));
    const headerEl = document.getElementById('header-title');
    if(headerEl) {
        headerEl.textContent = title;
        console.log('[HK] Set header-title to:', title);
    }
    const hkTitleEl = document.getElementById('hkTitle');
    if(hkTitleEl) {
        hkTitleEl.textContent = 'Room Information - ' + (S.housekeepingTitle || 'GOVERNANÃ‡A');
        console.log('[HK] Set hkTitle to:', hkTitleEl.textContent);
    }
    // column labels
    const set = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent = txt; };
    set('col-room', (S && S.colRoom) ? S.colRoom : (langParam==='en'?'ROOM':(langParam==='es'?'HABITACIÃ“N':'QUARTO')));
    set('col-occupied', (S && S.colOccupied) ? S.colOccupied : (langParam==='en'?'OCCUPIED':(langParam==='es'?'OCUPADO':'OCUPADO')));
    set('col-sold', (S && S.colSold) ? S.colSold : (langParam==='en'?'SOLD':(langParam==='es'?'VENDIDO':'VENDIDO')));
    set('col-dnd', (S && S.hkDnd) ? S.hkDnd : (langParam==='en'?'DND':(langParam==='es'?'DND':'DND')));
    set('col-mur', (S && S.hkMur) ? S.hkMur : (langParam==='en'?'MUR':(langParam==='es'?'MUR':'MUR')));
  // Rename to COLLECT TRAY and merge time columns into one
  const collectTray = (S && S.collectTray) ? S.collectTray : (langParam==='en'?'Collect Tray':(langParam==='es'?'Recoger Bandeja':'Coletar Bandeja'));
  set('col-callservice', String(collectTray).toUpperCase());
  const serviceTime = (S && S.serviceTime) ? S.serviceTime : (langParam==='en'?'Service Time':(langParam==='es'?'Hora Servicio':'Hora ServiÃ§o'));
  const lastUpdate = (S && S.colLastUpdate) ? S.colLastUpdate : (langParam==='en'?'Last Update':(langParam==='es'?'Ãšltima ActualizaciÃ³n':'Ãšltima AtualizaÃ§Ã£o'));
  set('col-servicetime', `${String(serviceTime).toUpperCase()} / ${String(lastUpdate).toUpperCase()}`);
    set('lbl-floor', (S && S.floorLabel) ? S.floorLabel : (langParam==='en'?'Floor':(langParam==='es'?'Piso':'Pavimento:')));
    set('lbl-room', (S && S.roomLabel) ? S.roomLabel : (langParam==='en'?'Room:':(langParam==='es'?'HabitaciÃ³n:':'Quarto:')));
    const btn = document.getElementById('btn-search'); if(btn) btn.textContent = (S && S.search) ? S.search : (langParam==='en'?'Search':(langParam==='es'?'Buscar':'Buscar'));
    const closeBtn = document.querySelector('header button.btn.ghost'); if(closeBtn) closeBtn.textContent = (S && S.close) ? S.close : (langParam==='en'?'Close':(langParam==='es'?'Cerrar':'Fechar'));
  const optAll = document.getElementById('opt-all-floors'); if(optAll) optAll.textContent = (S && S.allFloors) ? S.allFloors : (langParam==='en'?'All floors':(langParam==='es'?'Todos los pisos':'Todos os andares'));
  const btnPrev = document.getElementById('btn-prev'); if(btnPrev) btnPrev.textContent = (S && S.previous) ? S.previous : (langParam==='en'?'Previous':(langParam==='es'?'Anterior':'Anterior'));
  const btnNext = document.getElementById('btn-next'); if(btnNext) btnNext.textContent = (S && S.next) ? S.next : (langParam==='en'?'Next':(langParam==='es'?'Siguiente':'PrÃ³ximo'));
  const btnCsv = document.getElementById('btn-export-csv'); if(btnCsv) btnCsv.textContent = (S && S.exportCSV) ? S.exportCSV : (langParam==='en'?'Export CSV':(langParam==='es'?'Exportar CSV':'Exportar CSV'));
}

async function hkInitI18N(){
  console.log('[HK] hkInitI18N called');
  try{
    // IMPORTANT: Prefer localStorage over URL parameter after initial load
    // URL parameter is only used on first load, then localStorage takes precedence
    const storedLang = localStorage.getItem('ilux_lang');
    const urlLang = new URLSearchParams(location.search).get('lang');
    const langParam = storedLang || urlLang || 'pt';
    
    console.log('[HK] Language determined:', langParam, 'from storage:', storedLang, 'from URL:', urlLang);
    localStorage.setItem('ilux_lang', langParam);
    const select = document.getElementById('langSelect'); 
    if(select) {
        select.value = langParam;
        console.log('[HK] Set langSelect to:', langParam);
    }
    
    // Prefer to reuse app.js i18n helpers if available
    if (typeof loadAppI18N === 'function') {
        console.log('[HK] loadAppI18N function is available, calling it...');
        try {
            await loadAppI18N();
            console.log('[HK] loadAppI18N completed successfully');
            // Try to read i18n app pack from cache for harmonized labels
            let S = null; 
            try{ 
                const c=localStorage.getItem('i18n_cache'); 
                if(c){ 
                    const p=JSON.parse(c); 
                    S = (p[langParam] && p[langParam].app) ? p[langParam].app : null;
                    console.log('[HK] Got S from cache, keys:', S ? Object.keys(S).length : 0);
                } 
            }catch(_){ S=null; console.warn('[HK] Failed to parse i18n_cache', _); }
            if(S) {
                console.log('[HK] Using cached S pack');
                hkApplyTexts(S, langParam);
            } else {
                console.log('[HK] No S pack in cache, calling hkLoadAndApplyI18N');
                await hkLoadAndApplyI18N(langParam);
            }
        } catch (e) {
            // fallback to local loader
            console.warn('[HK] loadAppI18N failed, using fallback', e);
            await hkLoadAndApplyI18N(langParam);
        }
    } else {
        // fallback
        console.log('[HK] loadAppI18N not available, using hkLoadAndApplyI18N');
        await hkLoadAndApplyI18N(langParam);
    }
    console.log('[HK] hkInitI18N completed');
  }catch(e){ console.error('[HK] hkInitI18N failed', e); }
}

// Expose changeLanguage for header language select
async function changeLanguage(newLang){
  console.log('[HK] changeLanguage called with:', newLang);
  // CRITICAL: Set the language FIRST before any cache operations
  localStorage.setItem('ilux_lang', newLang);
  const select = document.getElementById('langSelect'); 
  if(select) select.value = newLang;
  console.log('[HK] Language stored in localStorage:', newLang);
  
  // Force clear i18n cache and reload
  try{
    console.log('[HK] Clearing i18n cache...');
    localStorage.removeItem('i18n_cache');
    localStorage.removeItem('i18n_cache_time');
    if(window.opener && typeof window.opener.loadAppI18N === 'function'){
      console.log('[HK] window.opener.loadAppI18N is available, calling it...');
      await window.opener.loadAppI18N();
      console.log('[HK] window.opener.loadAppI18N completed');
      // Small delay to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.log('[HK] window.opener.loadAppI18N not available');
    }
  }catch(e){ console.error('[HK] Failed to reload i18n from opener', e); }
  
  // Reload and apply translations - ALWAYS use the newLang parameter, not from storage
  console.log('[HK] Calling hkLoadAndApplyI18N with:', newLang);
  await hkLoadAndApplyI18N(newLang);
  
  // Re-render current floor with updated language
  console.log('[HK] Re-rendering floor:', HK_CURRENT_FLOOR);
  hkChangeFloor(HK_CURRENT_FLOOR);
  console.log('[HK] changeLanguage completed');
}
window.changeLanguage = changeLanguage;

window.addEventListener('DOMContentLoaded', async ()=>{
  console.log('[HK] DOMContentLoaded event fired');
  await hkInitI18N();
  console.log('[HK] After hkInitI18N');
  loadHKSuites();
  console.log('[HK] After loadHKSuites');
  const sel = document.getElementById('floorSelect'); if(sel) sel.value = 'all';
  hkChangeFloor('all');
  console.log('[HK] DOMContentLoaded completed');
});

// React to language/i18n cache changes from other windows (e.g., opened from index.html)
window.addEventListener('storage', async function(e){
  try{
    if(!e) return;
    console.log('[HK] Storage event:', e.key, 'newValue:', e.newValue);
    if(e.key === 'ilux_lang' || e.key === 'i18n_cache' || e.key === 'i18n_cache_timestamp'){
      const newLang = localStorage.getItem('ilux_lang') || 'pt';
      console.log('[HK] Language change detected, new lang:', newLang);
      const sel = document.getElementById('langSelect'); if(sel) sel.value = newLang;
      // Use hkLoadAndApplyI18N directly instead of hkInitI18N to avoid URL override
      await hkLoadAndApplyI18N(newLang);
      hkRender();
      console.log('[HK] Storage event processing completed');
    }
  }catch(err){ console.error('[HK] storage handler hk failed', err); }
});

// CSV Export for current filtered rows
function hkExportCSV(){
  try{
    const lang = localStorage.getItem('ilux_lang')||'pt';
    let S = null; try{ const c=localStorage.getItem('i18n_cache'); if(c){ const p=JSON.parse(c); S = (p[lang] && p[lang].app) ? p[lang].app : null; } }catch(_){ S=null; }
    const headers = [
      (S && S.colRoom) ? S.colRoom : (lang==='en'?'ROOM':(lang==='es'?'HABITACIÃ“N':'QUARTO')),
      (S && S.colOccupied) ? S.colOccupied : (lang==='en'?'OCCUPIED':(lang==='es'?'OCUPADO':'OCUPADO')),
      (S && S.colSold) ? S.colSold : (lang==='en'?'SOLD':(lang==='es'?'VENDIDO':'VENDIDO')),
      (S && S.hkDnd) ? S.hkDnd : 'DND',
      (S && S.hkMur) ? S.hkMur : 'MUR',
      ((S && S.collectTray) ? S.collectTray : (lang==='en'?'Collect Tray':(lang==='es'?'Recoger Bandeja':'Coletar Bandeja'))),
      `${((S && S.serviceTime) ? S.serviceTime : (lang==='en'?'Service Time':(lang==='es'?'Hora Servicio':'Hora ServiÃ§o')))} / ${((S && S.colLastUpdate) ? S.colLastUpdate : (lang==='en'?'Last Update':(lang==='es'?'Ãšltima ActualizaciÃ³n':'Ãšltima AtualizaÃ§Ã£o')))} `.toUpperCase()
    ];
    const yesText = (lang==='en'?'Yes':(lang==='es'?'SÃ­':'Sim'));
    const soldText = (lang==='en'?'Sold':(lang==='es'?'Vendido':'Vendido'));
    const okText = (lang==='en'?'OK':(lang==='es'?'OK':'OK'));
    const toVal = (key, r)=>{
      const v = String(r[key]||'').toLowerCase();
      if(key==='occupied' || key==='dnd' || key==='callService') return v==='yes' ? yesText : '';
      if(key==='sold') return v==='sold' ? soldText : '';
      if(key==='mur') return v==='ok' ? okText : '';
      return r[key] || '';
    };
    const rows = HK_CURRENT_ROWS.map(r=>{
      const timeVal = (String(r.callService||'').toLowerCase()==='yes' && r.callTime && r.callTime!=='-----') ? r.callTime : (r.lastUpdate || '');
      return [
      r.room,
      toVal('occupied',r),
      toVal('sold',r),
      toVal('dnd',r),
      toVal('mur',r),
      toVal('callService',r),
      timeVal
    ];});
    const csv = [headers].concat(rows).map(line=> line.map(col=>`"${String(col).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dt = new Date();
    a.download = `housekeeping_${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){ console.warn('CSV export failed', e); }
}
window.hkExportCSV = hkExportCSV;

