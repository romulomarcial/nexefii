
// ---- i18n external loader (app) with safe fallback and cache ----
let I18N_APP = null;
let I18N_HOTELS = null;
let I18N_CACHE = null;
let I18N_CACHE_TIMESTAMP = 0;
const CACHE_DURATION = 3600000; // 1 hora em milissegundos

// ---- Property-based access helpers ----
// Canonical hotel keys as used in i18n.json
const ALL_HOTEL_KEYS = ['iluxSaoPaulo','iluxMiami','iluxRioDeJaneiro'];
const HOTEL_KEY_BY_NAME = {
  'SÃ£o Paulo':'iluxSaoPaulo',
  'Miami':'iluxMiami',
  'Rio de Janeiro':'iluxRioDeJaneiro'
};
const HOTEL_DOM_CODE_BY_KEY = {
  iluxSaoPaulo: 'sp',
  iluxMiami: 'mi',
  iluxRioDeJaneiro: 'rio'
};
const HOTEL_CITY_NAME_BY_KEY = {
  iluxSaoPaulo: 'SÃ£o Paulo',
  iluxMiami: 'Miami',
  iluxRioDeJaneiro: 'Rio de Janeiro'
};
const HOTEL_DISPLAY_NAME_BY_KEY = {
  iluxSaoPaulo: 'iLux Hotel SÃ£o Paulo',
  iluxMiami: 'iLux Hotel Miami',
  iluxRioDeJaneiro: 'iLux Hotel Rio de Janeiro'
};

function getAllowedHotelKeys(){
  try{
    const session = (window.IluxAuth && IluxAuth.getCurrentSession) ? ((window.IluxAuth && IluxAuth.getCurrentSession) ? IluxAuth.getCurrentSession() : (window.NexefiiAuth && NexefiiAuth.getCurrentSession ? ((window.NexefiiAuth && NexefiiAuth.getCurrentSession) ? NexefiiAuth.getCurrentSession() : (window.IluxAuth && IluxAuth.getCurrentSession ? IluxAuth.getCurrentSession() : null)) : null)) : null;
    if(!session) return [];
    // Master and Admin see all
    if(session.role === 'master' || session.role === 'admin') return [...ALL_HOTEL_KEYS];
    // Try to get approvedProperties from user record if available
    if(window.IluxAuth && IluxAuth.getAllUsers){
      const users = IluxAuth.getAllUsers();
      const user = users.find(u=>u.id===session.userId);
      if(user){
        if(Array.isArray(user.approvedProperties) && user.approvedProperties.length){
          // Sanitize to known keys only
          return user.approvedProperties.filter(k=>ALL_HOTEL_KEYS.includes(k));
        }
        if(user.propertyKey){
          return ALL_HOTEL_KEYS.includes(user.propertyKey) ? [user.propertyKey] : [];
        }
      }
    }
    // Fallback to session propertyKey if present
    if(session.propertyKey && ALL_HOTEL_KEYS.includes(session.propertyKey)){
      return [session.propertyKey];
    }
    return [];
  }catch(e){ return []; }
}

function isHotelAllowedByName(name){
  const key = HOTEL_KEY_BY_NAME[name] || null;
  if(!key) return false;
  const allowed = getAllowedHotelKeys();
  return allowed.includes(key);
}

function applyPropertyFilter(){
  const allowed = getAllowedHotelKeys();
  // If admin, nothing to filter
  const session = (window.IluxAuth && IluxAuth.getCurrentSession) ? ((window.IluxAuth && IluxAuth.getCurrentSession) ? IluxAuth.getCurrentSession() : (window.NexefiiAuth && NexefiiAuth.getCurrentSession ? ((window.NexefiiAuth && NexefiiAuth.getCurrentSession) ? NexefiiAuth.getCurrentSession() : (window.IluxAuth && IluxAuth.getCurrentSession ? IluxAuth.getCurrentSession() : null)) : null)) : null;
    const isAdmin = !!(session && (session.role==='admin' || session.role==='master'));
  // Summary tiles (order: SP, Miami, Rio)
  const tiles = document.querySelectorAll('.summary-grid .tile');
  if(tiles && tiles.length){
    const tileKeys = ['iluxSaoPaulo','iluxMiami','iluxRioDeJaneiro'];
    tiles.forEach((tile, idx)=>{
      const k = tileKeys[idx];
      if(!isAdmin && !allowed.includes(k)){
        tile.style.display = 'none';
      }else{
        tile.style.display = '';
      }
    });
  }
  // Hotel cards: inspect each card and hide if not allowed
  const cards = document.querySelectorAll('.hotels .hotel-card');
  if(cards && cards.length){
    cards.forEach(card=>{
      const titleEl = card.querySelector('.hotel-title');
      let k = null;
      if(titleEl){
        // Detect by id suffix if present (hotel-name-sp/mi/rio) or by text
        const id = titleEl.id || '';
        if(id.endsWith('-sp')) k='iluxSaoPaulo';
        else if(id.endsWith('-mi')) k='iluxMiami';
        else if(id.endsWith('-rio')) k='iluxRioDeJaneiro';
        else {
          const txt = (titleEl.textContent||'').trim();
          k = HOTEL_KEY_BY_NAME['SÃ£o Paulo'] && txt.includes('SÃ£o Paulo') ? 'iluxSaoPaulo'
            : (txt.includes('Miami') ? 'iluxMiami'
            : (txt.includes('Rio') ? 'iluxRioDeJaneiro' : null));
        }
      }
      const show = isAdmin || (k && allowed.includes(k));
      card.style.display = show ? '' : 'none';
    });
  }
  // If none allowed (non-admin), show a friendly hint in hotels section
  const container = document.querySelector('.hotels');
  if(container){
    const visibleCards = Array.from(container.querySelectorAll('.hotel-card')).filter(el=>el.style.display!== 'none');
    let emptyHint = document.getElementById('hotels-empty-hint');
    if(!isAdmin && visibleCards.length===0){
      if(!emptyHint){
        emptyHint = document.createElement('div');
        emptyHint.id = 'hotels-empty-hint';
        emptyHint.className = 'sub';
        emptyHint.style.margin = '8px 0 12px 0';
        container.parentElement.insertBefore(emptyHint, container);
      }
      const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
      emptyHint.innerText = (L && L.noHotelsAccess) || 'Nenhum hotel autorizado para o seu usuÃ¡rio.';
    }else if(emptyHint){
      emptyHint.remove();
    }
  }
}

// Render comparison KPIs when user has access to multiple hotels
function renderHotelComparisons(){
  try{
    const section = document.getElementById('compareSection');
    const grid = document.getElementById('compareGrid');
    if(!section || !grid) return;
    const allowed = getAllowedHotelKeys();
    if(!allowed || allowed.length < 2){
      section.style.display = 'none';
      grid.innerHTML = '';
      return;
    }
    section.style.display = '';
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); const d = now.getDate();
    const cards = allowed.map(k => {
      const city = HOTEL_CITY_NAME_BY_KEY[k];
      const disp = HOTEL_DISPLAY_NAME_BY_KEY[k] || city || k;
      const ms = monthStats(y, m, city);
      const occToday = dailyOccPercent(d, m, city);
      const soldFmt = ms.sold.toLocaleString(lang==='en'?'en-US':'pt-BR');
      const lblOccToday = STR.occToday || 'OcupaÃ§Ã£o hoje';
      const lblRevM = STR.revM || 'Receita (M)';
      const lblADR = (STR.pills && STR.pills.adr) || 'ADR';
      const lblSoldMonth = (STR.pills && STR.pills.soldMonth) || 'Quartos vendidos (mÃªs)';
      return `<div class="tile"><h4>${disp}</h4><div class="kpis">
        <div class="kpi"><div class="label">${lblOccToday}</div><div class="value">${occToday}%</div></div>
        <div class="kpi"><div class="label">${lblRevM}</div><div class="value">${fmtCurrency(ms.revenue)}</div></div>
        <div class="kpi"><div class="label">${lblADR}</div><div class="value">${fmtCurrency(ms.adr)}</div></div>
        <div class="kpi"><div class="label">${lblSoldMonth}</div><div class="value">${soldFmt}</div></div>
      </div></div>`;
    }).join('');
    grid.innerHTML = cards;
    const titleEl = document.getElementById('t-compare');
    if(titleEl){
      titleEl.innerText = (lang==='en' ? 'Hotel Comparison' : (lang==='es' ? 'ComparaciÃ³n de Hoteles' : 'Comparativo de HotÃ©is'));
    }
  }catch(e){ /* no-op */ }
}

// Function to open engineering control window
function openEngineeringControl() {
    // Pass the current language as a URL parameter
    const currentLang = localStorage.getItem('ilux_lang') || 'pt';
    const url = `engineering-control.html?lang=${currentLang}`;
    window.open(url, 'EngineeringControl', 
        'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
}

// Function to open housekeeping (governanÃ§a) control window
function openHousekeepingControl() {
  // Snapshot current suites so the control page can access them
  try{
    if (typeof SIM_SUITES !== 'undefined' && Array.isArray(SIM_SUITES) && SIM_SUITES.length){
      localStorage.setItem('sim_suites_snapshot', JSON.stringify(SIM_SUITES));
    }
  }catch(e){ /* ignore quota issues */ }
  const currentLang = localStorage.getItem('ilux_lang') || 'pt';
  const url = `housekeeping-control.html?lang=${currentLang}`;
  window.open(url, 'HousekeepingControl',
    'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
}

// Function to open alerts control window
function openAlertsControl() {
  // Snapshot current suites so the control page can access them
  try{
    if (typeof SIM_SUITES !== 'undefined' && Array.isArray(SIM_SUITES) && SIM_SUITES.length){
      localStorage.setItem('sim_suites_snapshot', JSON.stringify(SIM_SUITES));
    }
  }catch(e){ /* ignore quota issues */ }
  const currentLang = localStorage.getItem('ilux_lang') || 'pt';
  const url = `alerts-control.html?lang=${currentLang}`;
  window.open(url, 'AlertsControl',
    'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
}

// Function to open engineering list page for a specific metric (On, Cool, Heat, Auto, Off)
function openEngineeringList(metric){
  try{
    // snapshot current suites so the list page can render the same state
    if (typeof SIM_SUITES !== 'undefined' && Array.isArray(SIM_SUITES) && SIM_SUITES.length){
      localStorage.setItem('sim_suites_snapshot', JSON.stringify(SIM_SUITES));
    }
  }catch(e){ /* ignore quota issues */ }
  const currentLang = localStorage.getItem('ilux_lang') || 'pt';
  const url = `engineering-list.html?metric=${encodeURIComponent(metric||'On')}&lang=${encodeURIComponent(currentLang)}`;
  window.open(url, 'EngineeringList', 'width=980,height=720,menubar=no,toolbar=no,location=no,status=no');
}

async function loadAppI18N(){
  try {
    const now = Date.now();
    
    // Tenta carregar do cache do localStorage primeiro
    const cachedData = localStorage.getItem('i18n_cache');
    const cachedTimestamp = parseInt(localStorage.getItem('i18n_cache_timestamp') || '0');
    
    if (cachedData && (now - cachedTimestamp < CACHE_DURATION)) {
      I18N_CACHE = JSON.parse(cachedData);
      I18N_CACHE_TIMESTAMP = cachedTimestamp;
      I18N_APP = { pt:I18N_CACHE.pt.app, en:I18N_CACHE.en.app, es:I18N_CACHE.es.app };
      I18N_HOTELS = { pt:I18N_CACHE.pt.hotels, en:I18N_CACHE.en.hotels, es:I18N_CACHE.es.hotels };
      return;
    }

    // Se nÃ£o tem cache ou expirou, carrega do servidor
    // Adiciona timestamp para evitar cache do navegador
    const res = await fetch(`i18n.json?t=${now}`, {cache:'no-store'});
    if(!res.ok) throw new Error('http');
    const data = await res.json();
    
    // Atualiza o cache em memÃ³ria e localStorage
    I18N_CACHE = data;
    I18N_CACHE_TIMESTAMP = now;
    localStorage.setItem('i18n_cache', JSON.stringify(data));
    localStorage.setItem('i18n_cache_timestamp', now.toString());
    
    // Atualiza as referÃªncias
    I18N_APP = { pt:data.pt.app, en:data.en.app, es:data.es.app };
    I18N_HOTELS = { pt:data.pt.hotels, en:data.en.hotels, es:data.es.hotels };
  }catch(e){
    // minimal fallback so UI nÃ£o quebra em file://
    I18N_APP = {
      pt:{summary:'Resumo por hotel',legend:'Legenda',low:'Baixa',medium:'MÃ©dia',high:'Alta',hotels:'HotÃ©is',
          openControl:'Abrir Controle',openRTI:'Abrir Painel Virtual RTI',logout:'Sair',status:'Status',shortcuts:'Atalhos',livePreview:'VisualizaÃ§Ã£o ao Vivo (simulaÃ§Ã£o)',close:'Fechar',revenueM:'Receita (M)',sold:'Vendidos',available:'DisponÃ­veis',occToday:'OcupaÃ§Ã£o hoje',rooms:'Quartos',adr:'ADR',days:'Dias',calendarTitle:'CalendÃ¡rio de Reservas',reservedRate:'Taxa de reserva'},
      en:{summary:'Summary per hotel',legend:'Legend',low:'Low',medium:'Medium',high:'High',hotels:'Hotels',
          openControl:'Open Control',openRTI:'Open RTI Virtual Panel',logout:'Logout',status:'Status',shortcuts:'Shortcuts',livePreview:'Live Preview (simulation)',close:'Close',revenueM:'Revenue (M)',sold:'Sold',available:'Available',occToday:'Occupancy today',rooms:'Rooms',adr:'ADR',days:'Days',calendarTitle:'Reservations Calendar',reservedRate:'Reservation rate'},
      es:{summary:'Resumen por hotel',legend:'Leyenda',low:'Baja',medium:'Media',high:'Alta',hotels:'Hoteles',
          openControl:'Abrir Control',openRTI:'Abrir RTI Virtual Panel',logout:'Salir',status:'Estado',shortcuts:'Atajos',livePreview:'Live Preview (simulaciÃ³n)',close:'Cerrar',revenueM:'Ingreso (M)',sold:'Vendidos',available:'Disponibles',occToday:'OcupaciÃ³n hoy',rooms:'Cuartos',adr:'ADR',days:'DÃ­as',calendarTitle:'Calendario de Reservas',reservedRate:'Tasa de reserva'}
    };
  }
}

// app.js (modular) â€” v4_1 i18n expanded
function getStrings(lang){
  const packs={
    pt:{
      portalTitle:"nexefii Â· Portal de HotÃ©is",
      summary:"Resumo por hotel", legend:"Legenda", low:"Baixa", mid:"MÃ©dia", high:"Alta",
      click:"Clique em um hotel para abrir o painel de controle ou o calendÃ¡rio do mÃªs.",
      hotels:"HotÃ©is", logout:"Sair",
      rtiTexts:{conn:"ConexÃ£o", ip:"IP", port:"Porta", profile:"Perfil", user:"UsuÃ¡rio", areas:"Ambientes", lightsLobby:"Luzes Â· Lobby", climateRestaurant:"Clima Â· Restaurante", audioPool:"Ãudio Â· Piscina", scenesSuites:"Cenas Â· SuÃ­tes", liveHint:"Aqui pode entrar um iframe/app quando o RTI real estiver disponÃ­vel."},
      occ:"OcupaÃ§Ã£o", revM:"Receita (MÃªs)", sold:"Vendidos", avail:"DisponÃ­veis",
  openControl:"Abrir Controle", openRTI:"Abrir Painel Virtual RTI",
  rtiTitle:"Painel Virtual RTI", status:"Status", shortcuts:"Atalhos", livePreview:"VisualizaÃ§Ã£o ao Vivo (simulaÃ§Ã£o)",
      close:"Fechar",
      controlTitle:"Controle do Hotel Â· {hotel}", roomStatus:"Hotel Status",
      calTitle:"CalendÃ¡rio de Reservas Â· {month} {year}",
      pills:{
        totalRooms:"Quartos Totais", occupied:"Ocupados", unoccupied:"Desocupados",
        checkin:"Check-in Hoje", checkout:"Check-out Hoje", unavailable:"IndisponÃ­veis",
        revMonth:"Receita (mÃªs)", revForecast:"PrevisÃ£o mÃªs", soldMonth:"Quartos vendidos (mÃªs)",
        adr:"ADR", rooms:"Quartos", days:"Dias"
      },
      months:["janeiro","fevereiro","marÃ§o","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
      weekdays:["Seg","Ter","Qua","Qui","Sex","SÃ¡b","Dom"],
      occToday:"OcupaÃ§Ã£o hoje",
      rooms:"Quartos",
      // Dashboard cards
      metricsTitle:"MÃ©tricas do MÃªs",
      metricRevenue:"Receita",
      metricForecast:"PrevisÃ£o",
      metricRoomsSold:"Quartos Vendidos",
      engineeringTitle:"ENGENHARIA",
      housekeepingTitle:"GOVERNANÃ‡A",
      alertsTitle:"ALERTAS",
      hvacOn:"HVAC Ligado",
      hvacCool:"Resfriamento",
      hvacHeat:"Aquecimento",
      hvacAuto:"AutomÃ¡tico",
      hvacOff:"HVAC Desligado",
      hkDnd:"NÃ£o Perturbe",
      hkCallService:"Chamada de ServiÃ§o",
      hkMur:"Limpeza do Quarto",
      alertThermostatOffline:"Termostato Desconectado",
      alertHvacMaintenance:"ManutenÃ§Ã£o HVAC",
      alertHighHumidity:"Umidade Alta",
      openEngineering:"Abrir Controle de Engenharia",
      openHousekeeping:"Abrir Controle de GovernanÃ§a",
      openAlerts:"Gerenciar Alertas"
    },
    en:{
      portalTitle:"nexefii Â· Hotel Portal",
      summary:"Summary per hotel", legend:"Legend", low:"Low", mid:"Medium", high:"High",
      click:"Click a hotel to open control panel or the monthly calendar.",
      hotels:"Hotels",
      logout:"Logout",
      rtiTexts:{
        conn:"Connection", ip:"IP", port:"Port",
        profile:"Profile", user:"User", areas:"Areas",
        lightsLobby:"Lights Â· Lobby", climateRestaurant:"Climate Â· Restaurant",
        audioPool:"Audio Â· Pool", scenesSuites:"Scenes Â· Suites",
        liveHint:"An iframe/app can be embedded here when the real RTI is available."
      },

      occ:"Occupancy", revM:"Revenue (M)", sold:"Sold", avail:"Available",
      openControl:"Open Control", openRTI:"Open RTI Virtual Panel",
  rtiTitle:"RTI Virtual Panel", status:"Status", shortcuts:"Shortcuts", livePreview:"Live Preview (simulation)",
      close:"Close",
      controlTitle:"Hotel Control Â· {hotel}", roomStatus:"Hotel Status",
      calTitle:"Reservations Calendar Â· {month} {year}",
      pills:{
        totalRooms:"Total Rooms", occupied:"Occupied", unoccupied:"Unoccupied",
        checkin:"Check-in Today", checkout:"Check-out Today", unavailable:"Unavailable",
        revMonth:"Revenue (month)", revForecast:"Forecast (month)", soldMonth:"Rooms sold (month)",
        adr:"ADR", rooms:"Rooms", days:"Days"
      },
      months:["January","February","March","April","May","June","July","August","September","October","November","December"],
      weekdays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      occToday:"Occupancy today",
      rooms:"Rooms",
      // Dashboard cards
      metricsTitle:"Month Metrics",
      metricRevenue:"Revenue",
      metricForecast:"Forecast",
      metricRoomsSold:"Rooms Sold",
      engineeringTitle:"ENGINEERING",
      housekeepingTitle:"HOUSEKEEPING",
      alertsTitle:"ALERTS",
      hvacOn:"HVAC On",
      hvacCool:"Cool",
      hvacHeat:"Heat",
      hvacAuto:"Auto",
      hvacOff:"HVAC Off",
      hkDnd:"DND",
      hkCallService:"Call Service",
      hkMur:"MUR",
      alertThermostatOffline:"Thermostat Offline",
      alertHvacMaintenance:"HVAC Maintenance",
      alertHighHumidity:"High Humidity",
      openEngineering:"Open Engineering Control",
      openHousekeeping:"Open Housekeeping Control",
      openAlerts:"Manage Alerts"
    },
    es:{
      portalTitle:"nexefii Â· Portal de Hoteles",
      summary:"Resumen por hotel", legend:"Leyenda", low:"Baja", mid:"Media", high:"Alta",
      click:"Haga clic en un hotel para abrir el panel de control o el calendario mensual.",
      hotels:"Hoteles", logout:"Salir",
      rtiTexts:{conn:"ConexiÃ³n", ip:"IP", port:"Puerto", profile:"Perfil", user:"Usuario", areas:"Ambientes", lightsLobby:"Luces Â· Lobby", climateRestaurant:"Clima Â· Restaurante", audioPool:"Audio Â· Piscina", scenesSuites:"Escenas Â· Suites", liveHint:"AquÃ­ se puede insertar un iframe/app cuando el RTI real estÃ© disponible."},
      occ:"OcupaciÃ³n", revM:"Ingresos (Mes)", sold:"Vendidas", avail:"Disponibles",
      openControl:"Control Abierto", openRTI:"Panel RTI Virtual Abierto",
      rtiTitle:"RTI Virtual Panel", status:"Estado", shortcuts:"Atajos", livePreview:"Vista en vivo (simulaciÃ³n)",
      close:"Cerrar",
      controlTitle:"Control del Hotel Â· {hotel}", roomStatus:"Estado del Hotel",
      calTitle:"Calendario de Reservas Â· {month} {year}",
      pills:{
        totalRooms:"Habitaciones Totales", occupied:"Ocupadas", unoccupied:"Desocupadas",
        checkin:"Check-in Hoy", checkout:"Check-out Hoy", unavailable:"No disponibles",
        revMonth:"Ingresos (mes)", revForecast:"PronÃ³stico (mes)", soldMonth:"Habitaciones vendidas (mes)",
        adr:"ADR", rooms:"Habitaciones", days:"DÃ­as"
      },
      months:["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
      weekdays:["Lun","Mar","MiÃ©","Jue","Vie","SÃ¡b","Dom"],
      occToday:"OcupaciÃ³n hoy",
      rooms:"Habitaciones",
      // Dashboard cards
      metricsTitle:"MÃ©tricas del Mes",
      metricRevenue:"Ingresos",
      metricForecast:"PronÃ³stico",
      metricRoomsSold:"Habitaciones Vendidas",
      engineeringTitle:"INGENIERÃA",
      housekeepingTitle:"GOBERNANZA",
      alertsTitle:"ALERTAS",
      hvacOn:"HVAC Encendido",
      hvacCool:"Enfriamiento",
      hvacHeat:"CalefacciÃ³n",
      hvacAuto:"AutomÃ¡tico",
      hvacOff:"HVAC Apagado",
      hkDnd:"No Molestar",
      hkCallService:"Llamar Servicio",
      hkMur:"Hacer HabitaciÃ³n",
      alertThermostatOffline:"Termostato Desconectado",
      alertHvacMaintenance:"Mantenimiento HVAC",
      alertHighHumidity:"Humedad Alta",
      openEngineering:"Abrir Control de IngenierÃ­a",
      openHousekeeping:"Abrir Control de Gobernanza",
      openAlerts:"Gestionar Alertas"
    }
  };
  // base pack
  const base = packs[lang]||packs.pt;
  // Se I18N_APP tiver sido carregado, mescla chaves de app (top-level) sobre o base
  if(I18N_APP && I18N_APP[lang]){
    return Object.assign({}, base, I18N_APP[lang]);
  }
  return base;
}
let lang=localStorage.getItem('ilux_lang')||'pt';
let STR=getStrings(lang);
function t(id,text){
  const el=document.getElementById(id); 
  if(el) {
    el.innerText=text;
    return true;
  }
  return false;
}

function fmtCurrency(x){ 
  const symbol = (lang==='pt') ? 'R$ ' : '$ ';
  const locale = (lang==='pt') ? 'pt-BR' : (lang==='en' ? 'en-US' : 'es-ES');
  return symbol + x.toLocaleString(locale); 
}

async function changeLanguage(newLang) {
  // Mostra o loading
  document.getElementById('loadingOverlay').classList.add('show');
  
  // Adiciona classe de transiÃ§Ã£o em todos elementos traduzÃ­veis
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => el.classList.add('changing'));

  // Aguarda a transiÃ§Ã£o de opacidade terminar
  await new Promise(resolve => setTimeout(resolve, 300));
  
  lang = newLang;
  localStorage.setItem('ilux_lang', lang);
  await loadAppI18N();
  STR = getStrings(lang);
  
  // Atualiza todos os textos da pÃ¡gina
  await initTexts();
  
  // FORÃ‡A atualizaÃ§Ã£o dos botÃµes (garantia extra)
  setTimeout(() => {
    // Atualiza botÃµes novamente para garantir
    t('btn-ctl-sp', STR.openControl);
    t('btn-rti-sp', STR.openRTI);
    t('btn-ctl-mi', STR.openControl);
    t('btn-rti-mi', STR.openRTI);
    t('btn-ctl-rj', STR.openControl);
    t('btn-rti-rj', STR.openRTI);
    t('t-rooms', STR.rooms);
    t('t-rooms-mi', STR.rooms);
    t('t-rooms-rio', STR.rooms);
  }, 100);
  
  // Remove classe de transiÃ§Ã£o apÃ³s atualizar textos
  setTimeout(() => {
    elements.forEach(el => el.classList.remove('changing'));
    // Esconde o loading
    document.getElementById('loadingOverlay').classList.remove('show');
  }, 50);
  bindHomeKPIs(); // recarrega KPIs para atualizar formataÃ§Ã£o de moeda/nÃºmeros
  renderHotelComparisons(); // atualiza comparativo multi-hotÃ©is (se aplicÃ¡vel)
  // Re-renderiza cards do dashboard se estiver aberto
  if(document.getElementById('controlModal') && document.getElementById('controlModal').classList.contains('open')) {
    renderDashboardCards();
  }
}

async function initTexts(){
  STR = getStrings(lang);
  
  // Atualiza tÃ­tulo do portal
  t('page-title', STR.portalTitle || 'nexefii Â· Portal de HotÃ©is');
  t('header-title', STR.portalTitle || 'nexefii Â· Portal de HotÃ©is');
  
  // Header logout
  const lo=document.getElementById('btnLogout'); if(lo) lo.innerText=STR.logout;

  const user=localStorage.getItem('ilux_user')||'demo@nexefii.com';
  t('userBox', user);
  t('t-summary', STR.summary);
  t('t-legend-title', STR.legend);
  t('t-low', STR.low); t('t-mid', STR.mid); t('t-high', STR.high);
  const h3=document.querySelector('h3'); if(h3) h3.innerText=STR.hotels;

  // KPI labels
  t('l-occ1', STR.occ); t('l-rev1', STR.revM); t('l-sold1', STR.sold); t('l-av1', STR.avail);
  t('l-occ2', STR.occ); t('l-rev2', STR.revM); t('l-sold2', STR.sold); t('l-av2', STR.avail);
  t('l-occ3', STR.occ); t('l-rev3', STR.revM); t('l-sold3', STR.sold); t('l-av3', STR.avail);

  // Legend hint
  t('t-click', STR.click);

  // Hotel cards - botÃµes e "Quartos"
  // SÃ£o Paulo
  t('t-rooms', STR.rooms);  // ID sem sufixo para SÃ£o Paulo
  t('btn-ctl-sp', STR.openControl);
  t('btn-rti-sp', STR.openRTI);
  
  // Miami
  t('t-rooms-mi', STR.rooms);
  t('btn-ctl-mi', STR.openControl);
  t('btn-rti-mi', STR.openRTI);
  
  // Rio
  t('t-rooms-rio', STR.rooms);  // ID com -rio (nÃ£o -rj)
  t('btn-ctl-rj', STR.openControl);
  t('btn-rti-rj', STR.openRTI);
  
  // Hotel names (opcional - pode manter como estÃ£o se forem marcas)
  const hotelNames = {
    'sp': 'iLux Hotel SÃ£o Paulo',
    'mi': 'iLux Hotel Miami',
    'rio': 'iLux Hotel Rio de Janeiro'
  };
  Object.entries(hotelNames).forEach(([code, name]) => {
    t('hotel-name-'+code, name);
  });
  
  // Traduz o tÃ­tulo das mÃ©tricas se existir
  const metricsTitle = document.getElementById('t-metrics');
  if(metricsTitle) {
    metricsTitle.innerText = STR.metricsTitle || 'MÃ©tricas do MÃªs';
  }
  
  // Traduz os labels das mÃ©tricas
  t('t-metric-revenue', STR.metricRevenue || 'Receita');
  t('t-metric-forecast', STR.metricForecast || 'PrevisÃ£o');
  t('t-metric-rooms-sold', STR.metricRoomsSold || 'Quartos Vendidos');
}

// KPI helpers (unchanged)
function kpis(seed,rooms){const occ=Math.max(0.15,Math.min(0.98,0.7+Math.sin(seed)*0.25)); const sold=Math.round(rooms*occ); const avail=rooms-sold; const rev=Math.round(sold*780); return {occ:Math.round(occ*100),sold,avail,rev};}
function roomsByHotel(h){return h==='Miami'?72:(h==='Rio de Janeiro'?64:56);}
function dailyOccPercent(d,m,h){const sh=(h==='Miami'?2:(h==='Rio de Janeiro'?4:0)); const r=Math.max(0.15,Math.min(0.98,0.7+Math.sin((d+sh+m*0.7))*0.25-(d%11===0?0.25:0))); return Math.round(r*100);}
function monthStats(y,m,h){const rooms=roomsByHotel(h); const days=new Date(y,m+1,0).getDate(); let sold=0; for(let d=1; d<=days; d++) sold+=Math.round(rooms*(dailyOccPercent(d,m,h)/100)); const adr=780; const revenue=sold*adr; return {rooms,days,sold,revenue,adr};}

function bindHomeKPIs(){
  const d=new Date().getDate(); const sp=kpis(d,56), mi=kpis(d+2,72), rj=kpis(d+4,64);
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.innerText=val;};
  set('v-occ1', sp.occ+'%'); set('v-rev1', fmtCurrency(sp.rev)); set('v-sold1', sp.sold); set('v-av1', sp.avail); t('occ-sp', STR.occToday+': '+sp.occ+'%');
  set('v-occ2', mi.occ+'%'); set('v-rev2', fmtCurrency(mi.rev)); set('v-sold2', mi.sold); set('v-av2', mi.avail); t('occ-miami', STR.occToday+': '+mi.occ+'%');
  set('v-occ3', rj.occ+'%'); set('v-rev3', fmtCurrency(rj.rev)); set('v-sold3', rj.sold); set('v-av3', rj.avail); t('occ-rio', STR.occToday+': '+rj.occ+'%');
}

// Control modal
let calState={year:new Date().getFullYear(),month:new Date().getMonth(),hotel:'SÃ£o Paulo'};

function openControl(h){
  // Property-based access guard
  if(!isHotelAllowedByName(h)){
    const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
    alert((L && L.accessDeniedHotel) || 'Acesso negado para este hotel.');
    return;
  }
  calState.hotel = h;
  const ctlText = STR.controlTitle.replace('{hotel}', h);
  document.getElementById('controlTitle').innerText = ctlText;
  const ctlSub = document.getElementById('controlSubtitle'); if(ctlSub) ctlSub.innerText = ctlText;
  const rs=document.getElementById('roomStats'); rs.innerHTML='';
  const pills=STR.pills;
  // Usar 11 pavimentos x 9 suÃ­tes = 99 quartos para esta visualizaÃ§Ã£o
  const totalRooms = 11 * 9;
  const occupied = Math.round(totalRooms * 0.68);
  const unoccupied = totalRooms - occupied;
  [[pills.totalRooms,totalRooms],[pills.occupied,occupied],[pills.unoccupied,unoccupied],[pills.checkin,6],[pills.checkout,12],[pills.unavailable,5]].forEach(([k,v])=>{
    const d=document.createElement('div'); d.className='pill'; d.innerHTML=`<b>${k}</b>: ${v}`; rs.appendChild(d);
  });
  document.getElementById('roomStatusTitle').innerText = STR.roomStatus;
  document.getElementById('btn-close-control').innerText = STR.close;
  renderCalendar();
  document.getElementById('controlModal').classList.add('open');

  // Inicia a simulaÃ§Ã£o do dashboard (11 pavimentos x 9 suÃ­tes)
  startDashboardSimulation(11, 9);
}

function closeControl(){ 
  document.getElementById('controlModal').classList.remove('open'); 
  // Para a simulaÃ§Ã£o quando o modal Ã© fechado
  stopDashboardSimulation();
}

// RTI modal
function openRTI(h){
  // Property-based access guard
  if(!isHotelAllowedByName(h)){
    const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
    alert((L && L.accessDeniedHotel) || 'Acesso negado para este hotel.');
    return;
  }
  const rtiText = STR.rtiTitle+' Â· '+h+' (simulated)';
  document.getElementById('rtiTitle').innerText = rtiText;
  const rtiSub = document.getElementById('rtiSubtitle'); if(rtiSub) rtiSub.innerText = rtiText;
  document.getElementById('btn-close-rti').innerText = STR.close;
  document.querySelector('#rtiModal .rti-title').innerText = STR.status;
  document.querySelectorAll('#rtiModal .rti-title')[1].innerText = STR.shortcuts;
  document.querySelectorAll('#rtiModal .rti-title')[2].innerText = STR.livePreview;
  // Status localized
  const T=STR.rtiTexts;
  const sb=document.getElementById('rtiStatusBox');
  sb.innerHTML = `<b>${T.conn}:</b> Online Â· <b>${T.ip}:</b> 10.0.0.15 Â· <b>${T.port}:</b> 49153`+
                 `<br><b>${T.profile}:</b> Hotel Â· <b>${T.user}:</b> operador`+
                 `<br><b>${T.areas}:</b> Lobby, Restaurante, Piscina, SuÃ­tes`;
  // Shortcut buttons
  document.getElementById('btn-rti-l1').innerText = T.lightsLobby;
  document.getElementById('btn-rti-l2').innerText = T.climateRestaurant;
  document.getElementById('btn-rti-l3').innerText = T.audioPool;
  document.getElementById('btn-rti-l4').innerText = T.scenesSuites;
  // Live hint
  document.getElementById('rtiLiveHint').innerText = T.liveHint;
  document.getElementById('rtiModal').classList.add('open');
}
function closeRTI(){ document.getElementById('rtiModal').classList.remove('open'); }

// Calendar
function navCal(d){ calState.month+=d; if(calState.month<0){calState.month=11; calState.year--;} if(calState.month>11){calState.month=0; calState.year++;} renderCalendar(); }
function renderCalendar(){
  const y=calState.year, m=calState.month, h=calState.hotel;
  document.getElementById('calTitle').innerText = STR.calTitle.replace('{month}', STR.months[m]).replace('{year}', y);
  const box=document.getElementById('calendarBox'); box.innerHTML='';
  const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate();
  const table=document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse';
  table.innerHTML = "<thead><tr>"+STR.weekdays.map(w=>`<th>${w}</th>`).join('')+"</tr></thead>";
  const tb=document.createElement('tbody'); let dd=1;
  for(let r=0;r<6;r++){ const tr=document.createElement('tr');
    for(let c=0;c<7;c++){ const td=document.createElement('td');
      if(r===0&&c<start || dd>days){ td.innerHTML='&nbsp;'; td.style.background='#f8f9fa'; }
      else{ const pct=dailyOccPercent(dd,m,h); const col=pct<60?'#ef4444':(pct<80?'#f59e0b':'#16a34a');
            td.innerHTML=`<div style='display:flex;justify-content:space-between;font-size:12px;color:#64748b;height:100%'><span>${dd}</span><span style='background:${col};color:#fff;border-radius:6px;padding:2px 6px;font-weight:800'>${pct}%</span></div>`; dd++; }
      tr.appendChild(td); }
    tb.appendChild(tr); if(dd>days) break; }
  table.appendChild(tb); box.appendChild(table);

  const ms=monthStats(y,m,h);
  document.getElementById('kpiRoomsSold').innerText = STR.pills.soldMonth + ': ' + ms.sold.toLocaleString(lang==='en'?'en-US':'pt-BR');
  document.getElementById('kpiRevMonth').innerText  = STR.pills.revMonth + ': ' + fmtCurrency(ms.revenue);
  document.getElementById('kpiRevForecast').innerText = STR.pills.revForecast + ': ' + fmtCurrency(Math.round(ms.revenue*1.04));
  document.getElementById('calMini').innerHTML = `<span class="pill"><b>${STR.pills.adr}</b>: ${fmtCurrency(ms.adr)}</span>`
    + ` <span class='pill'><b>${STR.pills.rooms}</b>: ${ms.rooms}</span>`
    + ` <span class='pill'><b>${STR.pills.days}</b>: ${ms.days}</span>`;
}

// Expose
window.openControl=openControl; window.closeControl=closeControl;
window.openRTI=openRTI; window.closeRTI=closeRTI;
window.openEngineeringList=openEngineeringList;
window.openEngineeringListModal=openEngineeringListModal;
window.closeEngineeringListModal=closeEngineeringListModal;
window.openHousekeepingControl=openHousekeepingControl;
window.openHousekeepingListModal=openHousekeepingListModal;
window.closeHousekeepingListModal=closeHousekeepingListModal;
window.openAlertsControl=openAlertsControl;
window.openAlertsListModal=openAlertsListModal;
window.closeAlertsListModal=closeAlertsListModal;
window.navCal=navCal;
window.loadAppI18N=loadAppI18N;
window.getStrings=getStrings;

// Ensure controls are bound once DOM is ready (for modal)
window.addEventListener('DOMContentLoaded', ()=>{
  bindEngListControls();
  bindHkListControls();
  bindAlertListControls();
});

window.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('t-summary')){
    // Show admin button if user is admin
    const session = ((window.IluxAuth && IluxAuth.getCurrentSession) ? IluxAuth.getCurrentSession() : (window.NexefiiAuth && NexefiiAuth.getCurrentSession ? ((window.NexefiiAuth && NexefiiAuth.getCurrentSession) ? NexefiiAuth.getCurrentSession() : (window.IluxAuth && IluxAuth.getCurrentSession ? IluxAuth.getCurrentSession() : null)) : null));
      if(session && (session.role === 'admin' || session.role === 'master')) {
      const adminBtn = document.getElementById('btnAdmin');
      if(adminBtn) adminBtn.style.display = 'inline-flex';
    }
    
    const langSelect = document.getElementById('langSelect');
    if(langSelect) {
      langSelect.value = localStorage.getItem('ilux_lang') || 'pt';
    }
    // Load i18n once, then init texts and KPIs
    loadAppI18N().then(()=>{
      initTexts();
      bindHomeKPIs();
      updateTimeAndWeather();
      applyModulePermissions();
      // Apply property-based filtering after texts/bindings
      applyPropertyFilter();
      // Render multi-hotel comparisons when applicable
      renderHotelComparisons();
    });
  }
});

function logout(){ 
  if(window.IluxAuth) {
    IluxAuth.logout();
  }
  localStorage.removeItem('ilux_user'); 
  window.location.href='login.html'; 
}

// Apply module-based permissions to hide/show UI elements
function applyModulePermissions() {
  // Module mapping: button ID -> module name
  const moduleButtons = {
    'btn-alerts': 'alerts',
    'btn-housekeeping': 'housekeeping',
    'btn-engineering': 'engineering'
    // Add more as new modules are created:
    // 'btn-commercial': 'commercial',
    // 'btn-marketing': 'marketing',
    // 'btn-reports': 'reports',
    // 'btn-management': 'management'
  };

    Object.entries(moduleButtons).forEach(([buttonId, module]) => {
      const btn = document.getElementById(buttonId);
      if(btn && !((window.IluxAuth && IluxAuth.hasModuleAccess) ? IluxAuth.hasModuleAccess(module) : true)) {
        btn.style.display = 'none';
      // Also hide parent card if it exists
      const card = btn.closest('.control-card');
      if(card) card.style.display = 'none';
    }
  });
}

// --- Weather SVG Icons ---
function createWeatherIcon(type) {
  const icons = {
    'sunny': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#FCD34D" stroke="#F59E0B" stroke-width="1"/>
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    
    'partly-cloudy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="3" fill="#FCD34D" stroke="#F59E0B" stroke-width="1"/>
      <path d="M10 4v1m-5.66 1.66l.71.71M2 10h1m15.5 5a2.5 2.5 0 0 0 0-5c-.5-1.5-2-2.5-3.5-2.5-1 0-2 .5-2.5 1.5" stroke="#9CA3AF" stroke-width="1.5" fill="none"/>
      <path d="M8 15c-1.5 0-3 1.5-3 3s1.5 3 3 3h8.5c1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1"/>
    </svg>`,
    
    'cloudy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1.5"/>
      <path d="M6 16a3 3 0 0 1 3-3h2" fill="none" stroke="#D1D5DB" stroke-width="1"/>
    </svg>`,
    
    'rainy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#9CA3AF" stroke="#6B7280" stroke-width="1.5"/>
      <path d="M9 19l1-2m3 3l1-2m3 1l1-2" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
      <path d="M11 21l1-2m3 1l1-2" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    'stormy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#6B7280" stroke="#374151" stroke-width="1.5"/>
      <path d="M12 16l-2 4h4l-2-4z" fill="#FCD34D" stroke="#F59E0B" stroke-width="1"/>
      <path d="M8 18l1-2m6 2l1-2" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    'windy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2m7.6-6.8A2 2 0 1 1 11 8H2m5.6 8.2A2 2 0 1 0 9 20H2" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6 8h4m-2 4h6m-4 4h3" stroke="#6B7280" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    </svg>`,
    
    'night-clear': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#FCD34D" stroke="#F59E0B" stroke-width="1"/>
      <circle cx="18" cy="6" r="1" fill="#FCD34D"/>
      <circle cx="20" cy="8" r="0.5" fill="#FCD34D"/>
      <circle cx="16" cy="4" r="0.5" fill="#FCD34D"/>
    </svg>`,
    
    'night-cloudy': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#FCD34D" stroke="#F59E0B" stroke-width="1"/>
      <path d="M8 15c-1.5 0-3 1.5-3 3s1.5 3 3 3h6c1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1"/>
    </svg>`
  };
  
  return icons[type] || icons['sunny'];
}

// --- Real-time weather and time management ---
function getWeatherByTime(hour, season) {
  // Define weather patterns based on time of day
  if (hour >= 6 && hour < 9) {
    // Morning - often clearer
    return ['sunny', 'partly-cloudy'][Math.floor(Math.random() * 2)];
  } else if (hour >= 9 && hour < 12) {
    // Mid-morning - sunny periods
    return ['sunny', 'partly-cloudy'][Math.floor(Math.random() * 2)];
  } else if (hour >= 12 && hour < 15) {
    // Midday - hot and sunny or cloudy
    return ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)];
  } else if (hour >= 15 && hour < 18) {
    // Afternoon - possible rain
    return ['cloudy', 'stormy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)];
  } else if (hour >= 18 && hour < 21) {
    // Evening - clearing up
    return ['partly-cloudy', 'cloudy', 'windy'][Math.floor(Math.random() * 3)];
  } else {
    // Night - clear or cloudy
    return ['night-clear', 'night-cloudy'][Math.floor(Math.random() * 2)];
  }
}

function updateTimeAndWeather(){
  const cityData = {
    'SÃ£o Paulo': {
      timezone: 'America/Sao_Paulo',
      baseTemp: 24,
      unit: 'C',
      elementIds: {weather: 'weather-sp', time: 'time-sp'}
    },
    'Miami': {
      timezone: 'America/New_York', // Miami is in Eastern Time
      baseTemp: 82,
      unit: 'F', 
      elementIds: {weather: 'weather-mi', time: 'time-mi'}
    },
    'Rio de Janeiro': {
      timezone: 'America/Sao_Paulo',
      baseTemp: 26,
      unit: 'C',
      elementIds: {weather: 'weather-rio', time: 'time-rio'}
    }
  };
  
  Object.keys(cityData).forEach(city => {
    const data = cityData[city];
    
    // Get real local time for each city
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", {timeZone: data.timezone}));
    const hour = localTime.getHours();
    
    // Format time display
    const timeString = localTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Calculate temperature based on time of day
    let baseTemp = data.baseTemp;
    let tempVariation = 0;
    
    // Temperature varies by time of day
    if (hour >= 6 && hour < 12) {
      tempVariation = -2; // Cooler in morning
    } else if (hour >= 12 && hour < 16) {
      tempVariation = 2; // Warmer in afternoon
    } else if (hour >= 16 && hour < 20) {
      tempVariation = 0; // Normal in evening
    } else {
      tempVariation = -4; // Cooler at night
    }
    
    // Add some random variation
    const randomVar = data.unit === 'F' ? 
      Math.round((Math.random() - 0.5) * 6) : // Â±3Â°F
      Math.round((Math.random() - 0.5) * 4);   // Â±2Â°C
    
    const temp = baseTemp + tempVariation + randomVar;
    const tempUnit = data.unit === 'F' ? 'Â°F' : 'Â°C';
    
    // Get weather icon based on time
    const iconType = getWeatherByTime(hour);
    const iconSVG = createWeatherIcon(iconType);
    
    // Update DOM elements
    const weatherElement = document.getElementById(data.elementIds.weather);
    const timeElement = document.getElementById(data.elementIds.time);
    
    if(weatherElement) {
      weatherElement.querySelector('.weather-icon').innerHTML = iconSVG;
      weatherElement.querySelector('.weather-temp').textContent = `${temp}${tempUnit}`;
    }
    
    if(timeElement) {
      timeElement.textContent = timeString;
    }
  });
}

// Efficient function to update only time display
function updateTimeDisplay(){
  const cityData = {
    'SÃ£o Paulo': {timezone: 'America/Sao_Paulo', elementId: 'time-sp'},
    'Miami': {timezone: 'America/New_York', elementId: 'time-mi'},
    'Rio de Janeiro': {timezone: 'America/Sao_Paulo', elementId: 'time-rio'}
  };
  
  Object.keys(cityData).forEach(city => {
    const data = cityData[city];
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", {timeZone: data.timezone}));
    
    const timeString = localTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const timeElement = document.getElementById(data.elementId);
    if(timeElement) {
      timeElement.textContent = timeString;
    }
  });
}

// Update time every second
setInterval(() => {
  // Update only time display every second (more efficient)
  updateTimeDisplay();
}, 1000);

// Update weather every 60 seconds (1 minute)
setInterval(() => {
  updateTimeAndWeather();
}, 60000);

// --- Dashboard simulation (11 floors x 9 suites) ---
let SIM_INTERVAL = null;
let SIM_SUITES = [];

function rndChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function buildInitialSuites(floors, suitesPerFloor){
  const arr=[];
  const now = new Date();
  const timestamp = now.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}) + ' ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  for(let f=1; f<=floors; f++){
    for(let s=1; s<=suitesPerFloor; s++){
      // Generate initial alerts randomly (10% chance for each suite to have 1-2 alerts)
      const initialAlerts = [];
      if(Math.random() < 0.10) {
        const alertTypes = ['Thermostat Offline', 'HVAC Maintenance', 'High Humidity'];
        const numAlerts = Math.random() < 0.7 ? 1 : 2; // 70% one alert, 30% two alerts
        for(let a=0; a<numAlerts; a++){
          const alertType = rndChoice(alertTypes);
          if(!initialAlerts.includes(alertType)) initialAlerts.push(alertType);
        }
      }
      
      arr.push({
        floor:f, 
        suite:s, 
        hvac: rndChoice(['On','Cool','Heat','Auto','Off']), 
        hk: rndChoice(['None','None','None','DND','CollectTray','MUR']), // 50% None, 50% with requests
        alerts: initialAlerts,
        occupied: rndChoice(['yes','yes','no']), // 66% occupied
        sold: rndChoice(['sold','available','available']), // 33% sold
        dnd: rndChoice(['yes','no','no']), // 33% DND
        mur: rndChoice(['ok','pending']), // 50% ok
        collectTray: rndChoice(['yes','no','no','no']), // 25% collect tray
        callTime: Math.random()>0.7 ? timestamp : '-----', // 30% have call time
        lastUpdate: timestamp,
        humidity: Math.floor(Math.random()*40)+40, // 40-79%
        roomTemp: Math.floor(Math.random()*6)+20, // 20-25Â°C
        thermostat: Math.floor(Math.random()*6)+20 // 20-25Â°C
      });
    }
  }
  return arr;
}

function randomUpdateSuites(){
  const total = SIM_SUITES.length;
  // change a few suites per tick
  const changes = Math.max(1, Math.round(total * 0.03));
  const now = new Date();
  const timestamp = now.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}) + ' ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  for(let i=0;i<changes;i++){
    const idx = Math.floor(Math.random()*total);
    const s = SIM_SUITES[idx];
    // small chance to change hvac or housekeeping
    if(Math.random()<0.25){ 
      s.hvac = rndChoice(['On','Cool','Heat','Auto','Off']);
      s.lastUpdate = timestamp;
    }
    if(Math.random()<0.12){ 
      s.hk = rndChoice(['None','None','None','DND','CollectTray','MUR']);
      s.lastUpdate = timestamp;
    }
    // update housekeeping fields occasionally
    if(Math.random()<0.08){ 
      s.occupied = rndChoice(['yes','no']);
      s.lastUpdate = timestamp;
    }
    if(Math.random()<0.06){ 
      s.sold = rndChoice(['sold','available']);
      s.lastUpdate = timestamp;
    }
    if(Math.random()<0.07){ 
      s.dnd = rndChoice(['yes','no']);
      s.lastUpdate = timestamp;
    }
    if(Math.random()<0.05){ 
      s.collectTray = rndChoice(['yes','no']);
      if(s.collectTray==='yes') s.callTime = timestamp;
      else s.callTime = '-----';
      s.lastUpdate = timestamp;
    }
    // alerts: small chance to add or remove
    if(Math.random()<0.06){
      const al = rndChoice(['Thermostat Offline','HVAC Maintenance','High Humidity']);
      if(!s.alerts.includes(al)){ 
        s.alerts.push(al);
        s.lastUpdate = timestamp;
      }
    }
    if(Math.random()<0.04 && s.alerts.length>0){ 
      s.alerts.splice(Math.floor(Math.random()*s.alerts.length),1);
      s.lastUpdate = timestamp;
    }
    // update temperature/humidity occasionally
    if(Math.random()<0.10){
      s.humidity = Math.floor(Math.random()*40)+40;
      s.roomTemp = Math.floor(Math.random()*6)+20;
      s.lastUpdate = timestamp;
    }
  }
}

function computeCounts(){
  const eng = {On:0,Cool:0,Heat:0,Auto:0,Off:0};
  const hk = {DND:0,CollectTray:0,MUR:0,None:0};
  const alerts = {'Thermostat Offline':0,'HVAC Maintenance':0,'High Humidity':0};
  SIM_SUITES.forEach(s=>{
    if(s.hvac==='On') eng.On++;
    if(s.hvac==='Cool') eng.Cool++;
    if(s.hvac==='Heat') eng.Heat++;
    if(s.hvac==='Auto') eng.Auto++;
    if(s.hvac==='Off') eng.Off++;
    if(s.hk==='DND') hk.DND++;
    if(s.hk==='CollectTray') hk.CollectTray++;
    if(s.hk==='MUR') hk.MUR++;
    if(!s.hk || s.hk==='None' || s.hk==='--') hk.None++;
    s.alerts.forEach(a=>{ if(alerts[a]!==undefined) alerts[a]++; });
  });
  
  // Validation: Check that housekeeping total equals total apartments
  const hkTotal = hk.DND + hk.CollectTray + hk.MUR + hk.None;
  const totalApartments = SIM_SUITES.length;
  if(hkTotal !== totalApartments){
    console.warn(`[Housekeeping Validation] Mismatch: HK Total=${hkTotal}, Total Apartments=${totalApartments}`, hk);
  }
  
  return {eng, hk, alerts};
}

// -------- Engineering List Modal (in-Control) --------
const ENG_LIST_STATE = { open:false, metric:'On', search:'', floor:'all', sort:'room', page:1, pageSize:10 };
const HK_LIST_STATE = { open:false, metric:'DND', search:'', floor:'all', page:1, pageSize:10 };
const ALERT_LIST_STATE = { open:false, metric:'all', search:'', floor:'all', page:1, pageSize:10 };

function openEngineeringListModal(metric){
  ENG_LIST_STATE.open = true;
  if(metric) ENG_LIST_STATE.metric = metric;
  ENG_LIST_STATE.page = 1;
  // Fill selects with localized labels
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('engMetricSelect');
  if(sel && sel.options.length===0){
    sel.innerHTML = `
      <option value="On">${L.hvacOn || 'HVAC On'}</option>
      <option value="Cool">${L.hvacCool || 'Cool'}</option>
      <option value="Heat">${L.hvacHeat || 'Heat'}</option>
      <option value="Auto">${L.hvacAuto || 'Auto'}</option>
      <option value="Off">${L.hvacOff || 'HVAC Off'}</option>`;
  }
  if(sel) sel.value = ENG_LIST_STATE.metric;
  const hdr = document.getElementById('engListHeading');
  const lbl = document.getElementById('engMetricLabel');
  if(hdr) hdr.firstChild && (hdr.firstChild.textContent = (L.engineeringTitle||'ENGENHARIA') + ' Â· ');
  if(lbl) lbl.innerText = (sel ? sel.options[sel.selectedIndex].text : (L.hvacOn||'HVAC On'));
  const btnClose = document.getElementById('btn-close-englist'); if(btnClose) btnClose.innerText = L.close || 'Fechar';
  const title = document.getElementById('engListTitle'); if(title) title.innerText = (L.engineeringTitle||'ENGENHARIA') + ' Â· Lista';
  const sub = document.getElementById('engListSubtitle'); if(sub) sub.innerText = (L.engineeringTitle||'ENGENHARIA') + ' Â· ' + (lbl? lbl.innerText : '');
  document.getElementById('engListModal').classList.add('open');
  renderEngListModal();
}

function closeEngineeringListModal(){
  ENG_LIST_STATE.open=false;
  const m=document.getElementById('engListModal'); if(m) m.classList.remove('open');
}

function getMetricBaseList(){
  if(!Array.isArray(SIM_SUITES)) return [];
  return SIM_SUITES.filter(s=> s.hvac===ENG_LIST_STATE.metric);
}

function filterEngList(){
  let list = getMetricBaseList();
  if(ENG_LIST_STATE.floor !== 'all'){
    const f = parseInt(ENG_LIST_STATE.floor,10); list = list.filter(s=>s.floor===f);
  }
  if(ENG_LIST_STATE.search){
    const q = ENG_LIST_STATE.search.toLowerCase();
    list = list.filter(s => (s.floor*100 + s.suite + '').includes(q));
  }
  if(ENG_LIST_STATE.sort==='hvac'){
    list.sort((a,b)=> (a.hvac||'').localeCompare(b.hvac||'') || (a.floor*100+a.suite) - (b.floor*100+b.suite));
  }else{
    list.sort((a,b)=> (a.floor*100+a.suite) - (b.floor*100+b.suite));
  }
  return list;
}

function computeEngFloorCounts(){
  const base = getMetricBaseList();
  const counts = new Array(11).fill(0);
  base.forEach(s=>{ if(s.floor>=1 && s.floor<=11) counts[s.floor-1]++; });
  return counts; // index 0 => floor 1
}

function renderEngListModal(){
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('engMetricSelect');
  if(sel) sel.value = ENG_LIST_STATE.metric;
  const lbl = document.getElementById('engMetricLabel');
  if(lbl && sel) lbl.innerText = sel.options[sel.selectedIndex].text;
  const info = document.getElementById('engListInfo');
  const tbody = document.getElementById('engListBody');
  const list = filterEngList();
  // clamp page
  const total = list.length; const pages = Math.max(1, Math.ceil(total / ENG_LIST_STATE.pageSize));
  if(ENG_LIST_STATE.page>pages) ENG_LIST_STATE.page = pages;
  if(ENG_LIST_STATE.page<1) ENG_LIST_STATE.page = 1;
  const start = (ENG_LIST_STATE.page-1)*ENG_LIST_STATE.pageSize;
  const pageList = list.slice(start, start+ENG_LIST_STATE.pageSize);
  const from = total? (start+1) : 0; const to = Math.min(start+ENG_LIST_STATE.pageSize, total);

  if(info) info.innerText = `${total} ${L.rooms || 'Quartos'} â€¢ ${from}â€“${to}`;

  // Floor counters
  const fc = computeEngFloorCounts();
  const fcBox = document.getElementById('engFloorCounters');
  if(fcBox){
    fcBox.innerHTML = fc.map((cnt, idx)=>{
      const floor = idx+1; const active = (ENG_LIST_STATE.floor!=="all" && parseInt(ENG_LIST_STATE.floor,10)===floor);
      return `<span class="floor-chip${active?' active':''}" data-floor="${floor}">${floor}Âº Â· ${cnt}</span>`;
    }).join('');
    // click handlers
    Array.from(fcBox.querySelectorAll('.floor-chip')).forEach(el=>{
      el.addEventListener('click', ()=>{
        const f = el.getAttribute('data-floor');
        ENG_LIST_STATE.floor = (ENG_LIST_STATE.floor===f? 'all' : f);
        ENG_LIST_STATE.page = 1;
        renderEngListModal();
      });
    });
  }

  const pageInfo = document.getElementById('engPageInfo');
  if(pageInfo) pageInfo.innerText = `PÃ¡gina ${ENG_LIST_STATE.page}/${pages}`;

  // Update pagination buttons visibility and state
  const prevBtn = document.getElementById('engPrev');
  const nextBtn = document.getElementById('engNext');
  const pager = document.getElementById('engPager');
  
  if(pager) {
    // Always show pager if there are results
    if(total > 0) {
      pager.style.display = 'flex';
      if(prevBtn) {
        prevBtn.disabled = (ENG_LIST_STATE.page <= 1);
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
      }
      if(nextBtn) {
        nextBtn.disabled = (ENG_LIST_STATE.page >= pages);
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
      }
    } else {
      pager.style.display = 'none';
    }
  }

  // (no-op) Do not adjust Alerts table header here; handled inside renderAlertListModal

  if(tbody){
    tbody.innerHTML = pageList.map(s=>{
      const rn = s.floor*100 + s.suite;
      const alerts = (s.alerts && s.alerts.length) ? s.alerts.join(', ') : '-';
      const isThermostatOffline = s.alerts && s.alerts.includes('Thermostat Offline');
      const hvacClass = (s.hvac==='Cool'?'hvac-cool': s.hvac==='Heat'?'hvac-heat': s.hvac==='Auto'?'hvac-auto': s.hvac==='Off'?'hvac-off':'hvac-on');
      const hvacDisplay = isThermostatOffline ? '<span class="hvac-chip hvac-off" style="opacity:0.6">Offline</span>' : `<span class="hvac-chip ${hvacClass}">${s.hvac}</span>`;
      return `<tr>
        <td style="padding:8px;border-top:1px dashed var(--line)">${rn}</td>
        <td style="padding:8px;border-top:1px dashed var(--line)">${hvacDisplay}</td>
        <td style="padding:8px;border-top:1px dashed var(--line)">${alerts}</td>
      </tr>`;
    }).join('');
  }
}

function bindEngListControls(){
  const metricSel = document.getElementById('engMetricSelect');
  const floorSel = document.getElementById('engFloorSelect');
  const search = document.getElementById('engSearch');
  const exportBtn = document.getElementById('engExportBtn');
  const prevBtn = document.getElementById('engPrev');
  const nextBtn = document.getElementById('engNext');
  if(metricSel && !metricSel._bound){ metricSel._bound=true; metricSel.addEventListener('change',()=>{ENG_LIST_STATE.metric=metricSel.value; renderEngListModal();}); }
  if(floorSel && !floorSel._bound){ floorSel._bound=true; floorSel.addEventListener('change',()=>{ENG_LIST_STATE.floor=floorSel.value; ENG_LIST_STATE.page=1; renderEngListModal();}); }
  if(search && !search._bound){ search._bound=true; search.addEventListener('input',()=>{ENG_LIST_STATE.search=search.value; ENG_LIST_STATE.page=1; renderEngListModal();}); }
  if(exportBtn && !exportBtn._bound){ exportBtn._bound=true; exportBtn.addEventListener('click', exportEngListCSV); }
  if(prevBtn && !prevBtn._bound){ 
    prevBtn._bound=true; 
    prevBtn.addEventListener('click', ()=>{ 
      if(ENG_LIST_STATE.page > 1) {
        ENG_LIST_STATE.page--; 
        renderEngListModal(); 
      }
    }); 
  }
  if(nextBtn && !nextBtn._bound){ 
    nextBtn._bound=true; 
    nextBtn.addEventListener('click', ()=>{ 
      const list = filterEngList();
      const pages = Math.max(1, Math.ceil(list.length / ENG_LIST_STATE.pageSize));
      if(ENG_LIST_STATE.page < pages) {
        ENG_LIST_STATE.page++; 
        renderEngListModal(); 
      }
    }); 
  }
}

function exportEngListCSV(){
  const list = filterEngList();
  const header = ['Room','HVAC','AlertsCount','Alerts'];
  const rows = list.map(s=>{
    const rn = s.floor*100 + s.suite;
    const alerts = s.alerts || [];
    return [rn, s.hvac||'', alerts.length, alerts.join('; ')];
  });
  const csv = [header, ...rows].map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'engineering_list.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// -------- Housekeeping List Modal --------
function openHousekeepingListModal(metric){
  HK_LIST_STATE.open = true;
  if(metric) HK_LIST_STATE.metric = metric;
  HK_LIST_STATE.page = 1;
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('hkMetricSelect');
  if(sel && sel.options.length===0){
    sel.innerHTML = `
      <option value="DND">${L.hkDnd || 'DND'}</option>
      <option value="CollectTray">${L.hkCollectTray || 'Collect Tray'}</option>
      <option value="MUR">${L.hkMur || 'MUR'}</option>
      <option value="None">${L.hkNone || 'Sem SolicitaÃ§Ã£o'}</option>`;
  }
  if(sel) sel.value = HK_LIST_STATE.metric;
  const hdr = document.getElementById('hkListHeading');
  const lbl = document.getElementById('hkMetricLabel');
  if(hdr) hdr.firstChild && (hdr.firstChild.textContent = (L.housekeepingTitle||'GOVERNANÃ‡A') + ' Â· ');
  if(lbl) lbl.innerText = (sel ? sel.options[sel.selectedIndex].text : (L.hkDnd||'DND'));
  const btnClose = document.getElementById('btn-close-hklist'); if(btnClose) btnClose.innerText = L.close || 'Fechar';
  const title = document.getElementById('hkListTitle'); if(title) title.innerText = (L.housekeepingTitle||'GOVERNANÃ‡A') + ' Â· Lista';
  const sub = document.getElementById('hkListSubtitle'); if(sub) sub.innerText = (L.housekeepingTitle||'GOVERNANÃ‡A') + ' Â· ' + (lbl? lbl.innerText : '');
  document.getElementById('hkListModal').classList.add('open');
  renderHkListModal();
}

function closeHousekeepingListModal(){
  HK_LIST_STATE.open=false;
  const m=document.getElementById('hkListModal'); if(m) m.classList.remove('open');
}

function getHkMetricBaseList(){
  if(!Array.isArray(SIM_SUITES)) return [];
  // Special handling for "None" - rooms with no housekeeping request
  if(HK_LIST_STATE.metric === 'None'){
    return SIM_SUITES.filter(s=> !s.hk || s.hk==='None' || s.hk==='--');
  }
  return SIM_SUITES.filter(s=> s.hk===HK_LIST_STATE.metric);
}

function filterHkList(){
  let list = getHkMetricBaseList();
  if(HK_LIST_STATE.floor !== 'all'){
    const f = parseInt(HK_LIST_STATE.floor,10); list = list.filter(s=>s.floor===f);
  }
  if(HK_LIST_STATE.search){
    const q = HK_LIST_STATE.search.toLowerCase();
    list = list.filter(s => (s.floor*100 + s.suite + '').includes(q));
  }
  list.sort((a,b)=> (a.floor*100+a.suite) - (b.floor*100+b.suite));
  return list;
}

function computeHkFloorCounts(){
  const base = getHkMetricBaseList();
  const counts = new Array(11).fill(0);
  base.forEach(s=>{ if(s.floor>=1 && s.floor<=11) counts[s.floor-1]++; });
  return counts;
}

function renderHkListModal(){
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('hkMetricSelect');
  if(sel) sel.value = HK_LIST_STATE.metric;
  const lbl = document.getElementById('hkMetricLabel');
  if(lbl && sel) lbl.innerText = sel.options[sel.selectedIndex].text;
  const info = document.getElementById('hkListInfo');
  const tbody = document.getElementById('hkListBody');
  const list = filterHkList();
  const total = list.length; const pages = Math.max(1, Math.ceil(total / HK_LIST_STATE.pageSize));
  if(HK_LIST_STATE.page>pages) HK_LIST_STATE.page = pages;
  if(HK_LIST_STATE.page<1) HK_LIST_STATE.page = 1;
  const start = (HK_LIST_STATE.page-1)*HK_LIST_STATE.pageSize;
  const pageList = list.slice(start, start+HK_LIST_STATE.pageSize);
  const from = total? (start+1) : 0; const to = Math.min(start+HK_LIST_STATE.pageSize, total);

  if(info) info.innerText = `${total} ${L.rooms || 'Quartos'} â€¢ ${from}â€“${to}`;

  const fc = computeHkFloorCounts();
  const fcBox = document.getElementById('hkFloorCounters');
  if(fcBox){
    fcBox.innerHTML = fc.map((cnt, idx)=>{
      const floor = idx+1; const active = (HK_LIST_STATE.floor!=="all" && parseInt(HK_LIST_STATE.floor,10)===floor);
      return `<span class="floor-chip${active?' active':''}" data-floor="${floor}">${floor}Âº Â· ${cnt}</span>`;
    }).join('');
    Array.from(fcBox.querySelectorAll('.floor-chip')).forEach(el=>{
      el.addEventListener('click', ()=>{
        const f = el.getAttribute('data-floor');
        HK_LIST_STATE.floor = (HK_LIST_STATE.floor===f? 'all' : f);
        HK_LIST_STATE.page = 1;
        renderHkListModal();
      });
    });
  }

  const pageInfo = document.getElementById('hkPageInfo');
  if(pageInfo) pageInfo.innerText = `PÃ¡gina ${HK_LIST_STATE.page}/${pages}`;

  const prevBtn = document.getElementById('hkPrev');
  const nextBtn = document.getElementById('hkNext');
  const pager = document.getElementById('hkPager');
  
  if(pager) {
    if(total > 0) {
      pager.style.display = 'flex';
      if(prevBtn) {
        prevBtn.disabled = (HK_LIST_STATE.page <= 1);
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
      }
      if(nextBtn) {
        nextBtn.disabled = (HK_LIST_STATE.page >= pages);
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
      }
    } else {
      pager.style.display = 'none';
    }
  }

  if(tbody){
    tbody.innerHTML = pageList.map(s=>{
      const rn = s.floor*100 + s.suite;
      const hkClass = (s.hk==='DND'?'hk-dnd': s.hk==='CollectTray'?'hk-service': s.hk==='MUR'?'hk-mur': (!s.hk || s.hk==='None')?'hk-none':'hk-clean');
      const isThermostatOffline = s.alerts && s.alerts.includes('Thermostat Offline');
      const hvacClass = (s.hvac==='Cool'?'hvac-cool': s.hvac==='Heat'?'hvac-heat': s.hvac==='Auto'?'hvac-auto': s.hvac==='Off'?'hvac-off':'hvac-on');
      const hvacDisplay = isThermostatOffline ? '<span class="hvac-chip hvac-off" style="opacity:0.6">Offline</span>' : `<span class="hvac-chip ${hvacClass}">${s.hvac}</span>`;
      const hkDisplay = (!s.hk || s.hk==='None') ? 'Sem SolicitaÃ§Ã£o' : s.hk;
      return `<tr>
        <td style="padding:8px;border-top:1px dashed var(--line)">${rn}</td>
        <td style="padding:8px;border-top:1px dashed var(--line)"><span class="hk-chip ${hkClass}">${hkDisplay}</span></td>
        <td style="padding:8px;border-top:1px dashed var(--line)">${hvacDisplay}</td>
      </tr>`;
    }).join('');
  }
}

function bindHkListControls(){
  const metricSel = document.getElementById('hkMetricSelect');
  const floorSel = document.getElementById('hkFloorSelect');
  const search = document.getElementById('hkSearch');
  const exportBtn = document.getElementById('hkExportBtn');
  const prevBtn = document.getElementById('hkPrev');
  const nextBtn = document.getElementById('hkNext');
  if(metricSel && !metricSel._bound){ metricSel._bound=true; metricSel.addEventListener('change',()=>{HK_LIST_STATE.metric=metricSel.value; renderHkListModal();}); }
  if(floorSel && !floorSel._bound){ floorSel._bound=true; floorSel.addEventListener('change',()=>{HK_LIST_STATE.floor=floorSel.value; HK_LIST_STATE.page=1; renderHkListModal();}); }
  if(search && !search._bound){ search._bound=true; search.addEventListener('input',()=>{HK_LIST_STATE.search=search.value; HK_LIST_STATE.page=1; renderHkListModal();}); }
  if(exportBtn && !exportBtn._bound){ exportBtn._bound=true; exportBtn.addEventListener('click', exportHkListCSV); }
  if(prevBtn && !prevBtn._bound){ 
    prevBtn._bound=true; 
    prevBtn.addEventListener('click', ()=>{ 
      if(HK_LIST_STATE.page > 1) {
        HK_LIST_STATE.page--; 
        renderHkListModal(); 
      }
    }); 
  }
  if(nextBtn && !nextBtn._bound){ 
    nextBtn._bound=true; 
    nextBtn.addEventListener('click', ()=>{ 
      const list = filterHkList();
      const pages = Math.max(1, Math.ceil(list.length / HK_LIST_STATE.pageSize));
      if(HK_LIST_STATE.page < pages) {
        HK_LIST_STATE.page++; 
        renderHkListModal(); 
      }
    }); 
  }
}

function exportHkListCSV(){
  const list = filterHkList();
  const header = ['Room','Status','HVAC'];
  const rows = list.map(s=>{
    const rn = s.floor*100 + s.suite;
    return [rn, s.hk||'', s.hvac||''];
  });
  const csv = [header, ...rows].map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'housekeeping_list.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// -------- Alerts List Modal --------
function openAlertsListModal(metric){
  ALERT_LIST_STATE.open = true;
  if(metric) ALERT_LIST_STATE.metric = metric;
  ALERT_LIST_STATE.page = 1;
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('alertMetricSelect');
  if(sel && sel.options.length===0){
    sel.innerHTML = `
      <option value="all">Todos os Alertas</option>
      <option value="Thermostat Offline">${L.alertThermostatOffline || 'Thermostat Offline'}</option>
      <option value="HVAC Maintenance">${L.alertHvacMaintenance || 'HVAC Maintenance'}</option>
      <option value="High Humidity">${L.alertHighHumidity || 'High Humidity'}</option>`;
  }
  if(sel) sel.value = ALERT_LIST_STATE.metric;
  const hdr = document.getElementById('alertListHeading');
  const lbl = document.getElementById('alertMetricLabel');
  if(hdr) hdr.firstChild && (hdr.firstChild.textContent = (L.alertsTitle||'ALERTAS') + ' Â· ');
  if(lbl) lbl.innerText = (sel ? sel.options[sel.selectedIndex].text : 'Todos');
  const btnClose = document.getElementById('btn-close-alertlist'); if(btnClose) btnClose.innerText = L.close || 'Fechar';
  const title = document.getElementById('alertListTitle'); if(title) title.innerText = (L.alertsTitle||'ALERTAS') + ' Â· Lista';
  const sub = document.getElementById('alertListSubtitle'); if(sub) sub.innerText = (L.alertsTitle||'ALERTAS') + ' Â· ' + (lbl? lbl.innerText : '');
  document.getElementById('alertListModal').classList.add('open');
  renderAlertListModal();
}

function closeAlertsListModal(){
  ALERT_LIST_STATE.open=false;
  const m=document.getElementById('alertListModal'); if(m) m.classList.remove('open');
}

function getAlertMetricBaseList(){
  if(!Array.isArray(SIM_SUITES)) return [];
  if(ALERT_LIST_STATE.metric === 'all'){
    return SIM_SUITES.filter(s=> s.alerts && s.alerts.length>0);
  }
  return SIM_SUITES.filter(s=> s.alerts && s.alerts.includes(ALERT_LIST_STATE.metric));
}

function filterAlertList(){
  let list = getAlertMetricBaseList();
  if(ALERT_LIST_STATE.floor !== 'all'){
    const f = parseInt(ALERT_LIST_STATE.floor,10); list = list.filter(s=>s.floor===f);
  }
  if(ALERT_LIST_STATE.search){
    const q = ALERT_LIST_STATE.search.toLowerCase();
    list = list.filter(s => (s.floor*100 + s.suite + '').includes(q));
  }
  list.sort((a,b)=> (a.floor*100+a.suite) - (b.floor*100+b.suite));
  return list;
}

function computeAlertFloorCounts(){
  const base = getAlertMetricBaseList();
  const counts = new Array(11).fill(0);
  base.forEach(s=>{ if(s.floor>=1 && s.floor<=11) counts[s.floor-1]++; });
  return counts;
}

function renderAlertListModal(){
  const L = getStrings(localStorage.getItem('ilux_lang')||'pt');
  const sel = document.getElementById('alertMetricSelect');
  if(sel) sel.value = ALERT_LIST_STATE.metric;
  const lbl = document.getElementById('alertMetricLabel');
  if(lbl && sel) lbl.innerText = sel.options[sel.selectedIndex].text;
  const info = document.getElementById('alertListInfo');
  const tbody = document.getElementById('alertListBody');
  const thead = document.querySelector('#alertListTable thead');
  const list = filterAlertList();
  const total = list.length; const pages = Math.max(1, Math.ceil(total / ALERT_LIST_STATE.pageSize));
  if(ALERT_LIST_STATE.page>pages) ALERT_LIST_STATE.page = pages;
  if(ALERT_LIST_STATE.page<1) ALERT_LIST_STATE.page = 1;
  const start = (ALERT_LIST_STATE.page-1)*ALERT_LIST_STATE.pageSize;
  const pageList = list.slice(start, start+ALERT_LIST_STATE.pageSize);
  const from = total? (start+1) : 0; const to = Math.min(start+ALERT_LIST_STATE.pageSize, total);

  if(info) info.innerText = `${total} ${L.rooms || 'Quartos'} â€¢ ${from}â€“${to}`;

  const fc = computeAlertFloorCounts();
  const fcBox = document.getElementById('alertFloorCounters');
  if(fcBox){
    fcBox.innerHTML = fc.map((cnt, idx)=>{
      const floor = idx+1; const active = (ALERT_LIST_STATE.floor!=="all" && parseInt(ALERT_LIST_STATE.floor,10)===floor);
      return `<span class="floor-chip${active?' active':''}" data-floor="${floor}">${floor}Âº Â· ${cnt}</span>`;
    }).join('');
    Array.from(fcBox.querySelectorAll('.floor-chip')).forEach(el=>{
      el.addEventListener('click', ()=>{
        const f = el.getAttribute('data-floor');
        ALERT_LIST_STATE.floor = (ALERT_LIST_STATE.floor===f? 'all' : f);
        ALERT_LIST_STATE.page = 1;
        renderAlertListModal();
      });
    });
  }

  const pageInfo = document.getElementById('alertPageInfo');
  if(pageInfo) pageInfo.innerText = `PÃ¡gina ${ALERT_LIST_STATE.page}/${pages}`;

  const prevBtn = document.getElementById('alertPrev');
  const nextBtn = document.getElementById('alertNext');
  const pager = document.getElementById('alertPager');
  
  if(pager) {
    if(total > 0) {
      pager.style.display = 'flex';
      if(prevBtn) {
        prevBtn.disabled = (ALERT_LIST_STATE.page <= 1);
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
      }
      if(nextBtn) {
        nextBtn.disabled = (ALERT_LIST_STATE.page >= pages);
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
      }
    } else {
      pager.style.display = 'none';
    }
  }

  // Ensure header always includes HVAC column
  if(thead){
    thead.innerHTML = `<tr>
      <th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Quarto</th>
      <th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">Alertas</th>
      <th style="text-align:left;padding:8px;border-bottom:1px solid var(--line)">HVAC</th>
    </tr>`;
  }

  if(tbody){
    tbody.innerHTML = pageList.map(s=>{
      const rn = s.floor*100 + s.suite;
      const alerts = (s.alerts && s.alerts.length) ? s.alerts.join(', ') : '-';
      const isThermostatOffline = s.alerts && s.alerts.includes('Thermostat Offline');
      const metricIsThermostatOffline = ALERT_LIST_STATE.metric === 'Thermostat Offline';
      const hvacClass = (s.hvac==='Cool'?'hvac-cool': s.hvac==='Heat'?'hvac-heat': s.hvac==='Auto'?'hvac-auto': s.hvac==='Off'?'hvac-off':'hvac-on');
      const hvacDisplay = metricIsThermostatOffline
        ? 'N/A'
        : (isThermostatOffline
            ? '<span class="hvac-chip hvac-off" style="opacity:0.6">Offline</span>'
            : `<span class="hvac-chip ${hvacClass}">${s.hvac}</span>`);
      return `
      <tr>
        <td style="padding:8px;border-top:1px dashed var(--line)">${rn}</td>
        <td style="padding:8px;border-top:1px dashed var(--line)">${alerts}</td>
        <td style="padding:8px;border-top:1px dashed var(--line)">${hvacDisplay}</td>
      </tr>`;
    }).join('');
  }
}

function bindAlertListControls(){
  const metricSel = document.getElementById('alertMetricSelect');
  const floorSel = document.getElementById('alertFloorSelect');
  const search = document.getElementById('alertSearch');
  const exportBtn = document.getElementById('alertExportBtn');
  const prevBtn = document.getElementById('alertPrev');
  const nextBtn = document.getElementById('alertNext');
  if(metricSel && !metricSel._bound){ metricSel._bound=true; metricSel.addEventListener('change',()=>{ALERT_LIST_STATE.metric=metricSel.value; renderAlertListModal();}); }
  if(floorSel && !floorSel._bound){ floorSel._bound=true; floorSel.addEventListener('change',()=>{ALERT_LIST_STATE.floor=floorSel.value; ALERT_LIST_STATE.page=1; renderAlertListModal();}); }
  if(search && !search._bound){ search._bound=true; search.addEventListener('input',()=>{ALERT_LIST_STATE.search=search.value; ALERT_LIST_STATE.page=1; renderAlertListModal();}); }
  if(exportBtn && !exportBtn._bound){ exportBtn._bound=true; exportBtn.addEventListener('click', exportAlertListCSV); }
  if(prevBtn && !prevBtn._bound){ 
    prevBtn._bound=true; 
    prevBtn.addEventListener('click', ()=>{ 
      if(ALERT_LIST_STATE.page > 1) {
        ALERT_LIST_STATE.page--; 
        renderAlertListModal(); 
      }
    }); 
  }
  if(nextBtn && !nextBtn._bound){ 
    nextBtn._bound=true; 
    nextBtn.addEventListener('click', ()=>{ 
      const list = filterAlertList();
      const pages = Math.max(1, Math.ceil(list.length / ALERT_LIST_STATE.pageSize));
      if(ALERT_LIST_STATE.page < pages) {
        ALERT_LIST_STATE.page++; 
        renderAlertListModal(); 
      }
    }); 
  }
}

function exportAlertListCSV(){
  const list = filterAlertList();
  const metricIsThermostatOffline = ALERT_LIST_STATE.metric === 'Thermostat Offline';
  const header = ['Room','Alerts','HVAC'];
  const rows = list.map(s=>{
    const rn = s.floor*100 + s.suite;
    const alerts = (s.alerts && s.alerts.length) ? s.alerts.join('; ') : '';
    const hvac = metricIsThermostatOffline ? 'N/A' : (s.hvac||'');
    return [rn, alerts, hvac];
  });
  const csv = [header, ...rows].map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'alerts_list.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// Card view state: track list vs chart mode per module
const CARD_VIEW_STATE = {
  engineering: 'list',
  housekeeping: 'list',
  alerts: 'list'
};

function renderDashboardCards(){
  const container = document.getElementById('dashboardCards');
  if(!container) return;
  const curLang = localStorage.getItem('ilux_lang') || 'pt';
  const L = getStrings(curLang);
  const counts = computeCounts();
  const eng = counts.eng; const hk = counts.hk; const al = counts.alerts;

  // Check permissions for each module
  const hasEngineering = (window.IluxAuth && IluxAuth.hasModuleAccess) ? IluxAuth.hasModuleAccess('engineering') : true;
  const hasHousekeeping = (window.IluxAuth && IluxAuth.hasModuleAccess) ? IluxAuth.hasModuleAccess('housekeeping') : true;
  const hasAlerts = (window.IluxAuth && IluxAuth.hasModuleAccess) ? IluxAuth.hasModuleAccess('alerts') : true;

  let html = '';

  // Engineering card
  if(hasEngineering){
    const viewMode = CARD_VIEW_STATE.engineering;
    html += `
      <div class="dashboard-card">
        <h4>${L.engineeringTitle || 'ENGENHARIA'}</h4>
        <div class="chart-toggle">
          <button class="${viewMode==='list'?'active':''}" onclick="toggleCardView('engineering','list')">
            ðŸ“‹ Lista
          </button>
          <button class="${viewMode==='chart'?'active':''}" onclick="toggleCardView('engineering','chart')">
            ðŸ“Š GrÃ¡fico
          </button>
        </div>
        <div class="card-content">
          ${viewMode==='list' ? renderEngineeringList(eng, L) : renderEngineeringChart(eng)}
        </div>
        <div class="dashboard-card-button">
          <button class="btn primary" onclick="openEngineeringControl()" id="btn-engineering">
            ${L.openEngineering || 'Abrir Controle de Engenharia'}
          </button>
        </div>
      </div>
    `;
  }

  // Housekeeping card
  if(hasHousekeeping){
    const viewMode = CARD_VIEW_STATE.housekeeping;
    html += `
      <div class="dashboard-card">
        <h4>${L.housekeepingTitle || 'HOUSEKEEPING'}</h4>
        <div class="chart-toggle">
          <button class="${viewMode==='list'?'active':''}" onclick="toggleCardView('housekeeping','list')">
            ðŸ“‹ Lista
          </button>
          <button class="${viewMode==='chart'?'active':''}" onclick="toggleCardView('housekeeping','chart')">
            ðŸ“Š GrÃ¡fico
          </button>
        </div>
        <div class="card-content">
          ${viewMode==='list' ? renderHousekeepingList(hk, L) : renderHousekeepingChart(hk)}
        </div>
        <div class="dashboard-card-button">
          <button class="btn primary" onclick="openHousekeepingControl()" id="btn-housekeeping">
            ${L.openHousekeeping || 'Abrir Controle de GovernanÃ§a'}
          </button>
        </div>
      </div>
    `;
  }

  // Alerts card
  if(hasAlerts){
    const viewMode = CARD_VIEW_STATE.alerts;
    html += `
      <div class="dashboard-card">
        <h4>${L.alertsTitle || 'ALERTAS'}</h4>
        <div class="chart-toggle">
          <button class="${viewMode==='list'?'active':''}" onclick="toggleCardView('alerts','list')">
            ðŸ“‹ Lista
          </button>
          <button class="${viewMode==='chart'?'active':''}" onclick="toggleCardView('alerts','chart')">
            ðŸ“Š GrÃ¡fico
          </button>
        </div>
        <div class="card-content">
          ${viewMode==='list' ? renderAlertsList(al, L) : renderAlertsChart(al)}
        </div>
        <div class="dashboard-card-button">
          <button class="btn primary" onclick="openAlertsControl()" id="btn-alerts">
            ${L.openAlerts || 'Gerenciar Alertas'}
          </button>
        </div>
      </div>
    `;
  }

  // PMS Card - Property Management System
  const hasPMS = (window.IluxAuth && IluxAuth.hasModuleAccess) ? IluxAuth.hasModuleAccess('pms') : true;
  if(hasPMS){
    html += `
      <div class="dashboard-card pms-card">
        <h4 style="display:flex;align-items:center;gap:8px">
          ðŸ¨ ${L.pmsTitle || 'PMS - Sistema de GestÃ£o'}
        </h4>
        <div class="card-content">
          <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
            ${L.pmsFrontOffice || 'Front Office'}
          </div>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
            <li style="padding:8px;background:var(--bg);border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg)'" onclick="openPMSModule('reservations')">
              <div style="display:flex;align-items:center;gap:8px">
                <span>ðŸ“…</span>
                <span style="font-weight:500">${L.pmsReservations || 'Reservas'}</span>
              </div>
            </li>
            <li style="padding:8px;background:var(--bg);border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg)'" onclick="openPMSModule('checkInOut')">
              <div style="display:flex;align-items:center;gap:8px">
                <span>ðŸ”‘</span>
                <span style="font-weight:500">${L.pmsCheckInOut || 'Check-in / Check-out'}</span>
              </div>
            </li>
            <li style="padding:8px;background:var(--bg);border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg)'" onclick="openPMSModule('guestProfile')">
              <div style="display:flex;align-items:center;gap:8px">
                <span>ðŸ‘¤</span>
                <span style="font-weight:500">${L.pmsGuestProfile || 'Perfil do HÃ³spede / CRM'}</span>
              </div>
            </li>
            <li style="padding:8px;background:var(--bg);border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg)'" onclick="openPMSModule('roomAssignment')">
              <div style="display:flex;align-items:center;gap:8px">
                <span>ðŸšª</span>
                <span style="font-weight:500">${L.pmsRoomAssignment || 'AlocaÃ§Ã£o de Quartos'}</span>
              </div>
            </li>
            <li style="padding:8px;background:var(--bg);border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg)'" onclick="openPMSModule('concierge')">
              <div style="display:flex;align-items:center;gap:8px">
                <span>ðŸŽ©</span>
                <span style="font-weight:500">${L.pmsConcierge || 'Concierge / Bell Desk'}</span>
              </div>
            </li>
          </ul>
        </div>
        <div class="dashboard-card-button">
          <button class="btn primary" onclick="openPMSConfig()">
            ${L.pmsModulesConfig || 'Configurar MÃ³dulos PMS'}
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function toggleCardView(module, mode){
  CARD_VIEW_STATE[module] = mode;
  renderDashboardCards();
}

function renderEngineeringList(eng, L){
  return `
    <ul>
      <li style="cursor:pointer" onclick="(window.openEngineeringListModal||openEngineeringList)('On')">${L.hvacOn || 'HVAC On'} <span class="count-badge">${eng.On}</span></li>
      <li style="cursor:pointer" onclick="(window.openEngineeringListModal||openEngineeringList)('Cool')">${L.hvacCool || 'Cool'} <span class="count-badge">${eng.Cool}</span></li>
      <li style="cursor:pointer" onclick="(window.openEngineeringListModal||openEngineeringList)('Heat')">${L.hvacHeat || 'Heat'} <span class="count-badge">${eng.Heat}</span></li>
      <li style="cursor:pointer" onclick="(window.openEngineeringListModal||openEngineeringList)('Auto')">${L.hvacAuto || 'Auto'} <span class="count-badge">${eng.Auto}</span></li>
      <li style="cursor:pointer" onclick="(window.openEngineeringListModal||openEngineeringList)('Off')">${L.hvacOff || 'HVAC Off'} <span class="count-badge">${eng.Off}</span></li>
    </ul>
  `;
}

function renderHousekeepingList(hk, L){
  return `
    <ul>
      <li style="cursor:pointer" onclick="(window.openHousekeepingListModal||function(){})('DND')">${L.hkDnd || 'DND'} <span class="count-badge">${hk.DND}</span></li>
      <li style="cursor:pointer" onclick="(window.openHousekeepingListModal||function(){})('CollectTray')">${L.hkCollectTray || 'Collect Tray'} <span class="count-badge">${hk.CollectTray}</span></li>
      <li style="cursor:pointer" onclick="(window.openHousekeepingListModal||function(){})('MUR')">${L.hkMur || 'MUR'} <span class="count-badge">${hk.MUR}</span></li>
      <li style="cursor:pointer" onclick="(window.openHousekeepingListModal||function(){})('None')">${L.hkNone || 'Sem SolicitaÃ§Ã£o'} <span class="count-badge">${hk.None}</span></li>
    </ul>
  `;
}

function renderAlertsList(al, L){
  return `
    <ul>
      <li style="cursor:pointer" onclick="(window.openAlertsListModal||function(){})('Thermostat Offline')">${L.alertThermostatOffline || 'Thermostat Offline'} <span class="count-badge">${al['Thermostat Offline']}</span></li>
      <li style="cursor:pointer" onclick="(window.openAlertsListModal||function(){})('HVAC Maintenance')">${L.alertHvacMaintenance || 'HVAC Maintenance'} <span class="count-badge">${al['HVAC Maintenance']}</span></li>
      <li style="cursor:pointer" onclick="(window.openAlertsListModal||function(){})('High Humidity')">${L.alertHighHumidity || 'High Humidity'} <span class="count-badge">${al['High Humidity']}</span></li>
    </ul>
  `;
}

function renderEngineeringChart(eng){
  const totalApartments = (typeof SIM_SUITES !== 'undefined' && Array.isArray(SIM_SUITES)) ? SIM_SUITES.length : 0;
  const data = [
    {label:'On',value:eng.On,color:'#10b981'},
    {label:'Cool',value:eng.Cool,color:'#3b82f6'},
    {label:'Heat',value:eng.Heat,color:'#ef4444'},
    {label:'Auto',value:eng.Auto,color:'#f59e0b'},
    {label:'Off',value:eng.Off,color:'#6b7280'}
  ];
  return createPieChart(data, totalApartments);
}

function renderHousekeepingChart(hk){
  const totalApartments = (typeof SIM_SUITES !== 'undefined' && Array.isArray(SIM_SUITES)) ? SIM_SUITES.length : 0;
  const data = [
    {label:'DND',value:hk.DND,color:'#8b5cf6'},
    {label:'Collect Tray',value:hk.CollectTray,color:'#ec4899'},
    {label:'MUR',value:hk.MUR,color:'#14b8a6'},
    {label:'Sem SolicitaÃ§Ã£o',value:hk.None,color:'#94a3b8'}
  ];
  return createBarChart(data, totalApartments);
}

function renderAlertsChart(al){
  const data = [
    {label:'Thermostat Offline',value:al['Thermostat Offline'],color:'#ef4444'},
    {label:'HVAC Maintenance',value:al['HVAC Maintenance'],color:'#f59e0b'},
    {label:'High Humidity',value:al['High Humidity'],color:'#3b82f6'}
  ];
  return createBarChart(data);
}

function createPieChart(data, totalApartments){
  const total = data.reduce((sum,d)=>sum+d.value,0);
  if(total===0) return '<div class="chart-container" style="color:var(--muted)">Sem dados</div>';
  
  let html = '<div class="chart-container" style="flex-direction:row;gap:16px;align-items:center">';
  html += '<svg width="140" height="140" viewBox="0 0 160 160">';
  let currentAngle = -90;
  const cx = 80, cy = 80, r = 70;
  
  data.forEach(d=>{
    if(d.value===0) return;
    const percent = d.value/total;
    const angle = percent*360;
    const endAngle = currentAngle+angle;
    const largeArc = angle>180 ? 1 : 0;
    
    const x1 = cx + r*Math.cos(currentAngle*Math.PI/180);
    const y1 = cy + r*Math.sin(currentAngle*Math.PI/180);
    const x2 = cx + r*Math.cos(endAngle*Math.PI/180);
    const y2 = cy + r*Math.sin(endAngle*Math.PI/180);
    
    html += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${d.color}" opacity="0.85"/>`;
    currentAngle = endAngle;
  });
  
  html += '</svg>';
  
  // Add legend
  html += '<div style="display:flex;flex-direction:column;gap:6px;font-size:12px">';
  data.forEach(d=>{
    if(d.value===0) return;
    const percentage = totalApartments > 0 ? Math.round((d.value / totalApartments) * 100) : 0;
    html += `
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:12px;height:12px;border-radius:2px;background:${d.color};flex-shrink:0"></div>
        <span style="color:var(--ink);font-weight:500">${d.label}</span>
        <span style="color:var(--muted);margin-left:auto;font-weight:700">${d.value}</span>
        <span style="color:var(--muted);font-size:10px">(${percentage}%)</span>
      </div>
    `;
  });
  // Add total apartments info
  if(totalApartments > 0){
    html += `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:11px;color:var(--muted)">
        <b>Total:</b> ${totalApartments} apartamentos
      </div>
    `;
  }
  html += '</div>';
  
  html += '</div>';
  return html;
}

function createBarChart(data, totalApartments){
  const maxVal = Math.max(...data.map(d=>d.value), 1);
  let html = '<div class="chart-container" style="flex-direction:column;gap:8px;align-items:stretch">';
  
  data.forEach(d=>{
    const width = maxVal>0 ? (d.value/maxVal)*100 : 0;
    const percentage = totalApartments > 0 ? Math.round((d.value / totalApartments) * 100) : 0;
    html += `
      <div style="display:flex;align-items:center;gap:8px;font-size:12px">
        <span style="flex:0 0 100px;text-align:right;color:var(--muted)">${d.label}</span>
        <div style="flex:1;background:var(--bg);border-radius:4px;height:24px;position:relative">
          <div style="width:${width}%;background:${d.color};height:100%;border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:6px">
            <b style="color:#fff;font-size:11px">${d.value}</b>
          </div>
        </div>
        <span style="color:var(--muted);font-size:10px;flex:0 0 40px;text-align:right">${percentage}%</span>
      </div>
    `;
  });
  
  // Add total apartments info
  if(totalApartments > 0){
    html += `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);text-align:center">
        <b>Total:</b> ${totalApartments} apartamentos
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

function startDashboardSimulation(floors=11, suitesPerFloor=9){
  // Build initial
  SIM_SUITES = buildInitialSuites(floors, suitesPerFloor);
  renderDashboardCards();
  if(SIM_INTERVAL) clearInterval(SIM_INTERVAL);
  SIM_INTERVAL = setInterval(()=>{
    randomUpdateSuites();
    renderDashboardCards();
    // If engineering list modal is open, refresh it in real-time
    if (typeof ENG_LIST_STATE !== 'undefined' && ENG_LIST_STATE.open) {
      bindEngListControls();
      renderEngListModal();
    }
    if (typeof HK_LIST_STATE !== 'undefined' && HK_LIST_STATE.open) {
      bindHkListControls();
      renderHkListModal();
    }
    if (typeof ALERT_LIST_STATE !== 'undefined' && ALERT_LIST_STATE.open) {
      bindAlertListControls();
      renderAlertListModal();
    }
  }, 3000);
}


function stopDashboardSimulation(){
  if(SIM_INTERVAL) clearInterval(SIM_INTERVAL);
  SIM_INTERVAL = null;
}

// -------- PMS Module Functions --------
function openPMSModule(moduleId) {
  console.log('[PMS] Opening module:', moduleId);
  const curLang = localStorage.getItem('ilux_lang') || 'pt';
  const L = getStrings(curLang);
  
  // Get module info
  if(!window.PMSModuleManager) {
    console.warn('[PMS] PMSModuleManager not loaded');
    alert('PMS Module Manager nÃ£o carregado. Recarregue a pÃ¡gina.');
    return;
  }
  
  const module = window.PMSModuleManager.getModule(moduleId);
  if(!module) {
    console.warn('[PMS] Module not found:', moduleId);
    return;
  }
  
  const moduleName = module.name[curLang] || module.name.pt;
  
  // Open module in new window
  if(moduleId === 'reservations') {
    // Ensure language is set before opening
    localStorage.setItem('ilux_lang', curLang);
    // Open reservations module
    window.open('pms-reservations.html', '_blank', 'width=1400,height=900');
  } else if (moduleId === 'checkInOut') {
    // Ensure language is set before opening
    localStorage.setItem('ilux_lang', curLang);
    // Open front desk (check-in/out)
    window.open('pms-frontdesk.html', '_blank', 'width=1400,height=900');
  } else {
    // Placeholder: Show coming soon message for other modules
    alert(`ðŸš§ ${moduleName}\n\nMÃ³dulo em desenvolvimento.\nEm breve vocÃª terÃ¡ acesso a todas as funcionalidades!`);
  }
  
  // TODO: Implement other module opening logic
  // Example: if(moduleId === 'checkin') window.open('pms-checkin.html', '_blank');
}

function openPMSConfig() {
  console.log('[PMS] Opening PMS configuration');
  const curLang = localStorage.getItem('ilux_lang') || 'pt';
  const L = getStrings(curLang);
  
  alert(`âš™ï¸ ${L.pmsModulesConfig || 'ConfiguraÃ§Ã£o de MÃ³dulos PMS'}\n\nInterface de configuraÃ§Ã£o em desenvolvimento.\nAcesse o painel administrativo para configurar propriedades e mÃ³dulos.`);
  
  // TODO: Open configuration modal or redirect to admin page
}


