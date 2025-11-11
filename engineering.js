// Sample room data organized by floor
const allRoomData = {
    "3": [
        { room: '301', occupied: 'yes', sold: 'sold', dnd: 'yes', hvac: 'On', thermostat: 'Offline', roomTemp: '70°', hvacMode: 'Cool', humidity: 57, alert: false, lastUpdate: '5/29/23, 2:10 pm' },
        { room: '302', occupied: 'yes', sold: 'sold', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '68°', hvacMode: 'Cool', humidity: 55, alert: false, lastUpdate: '5/29/23, 2:10 pm' },
        { room: '303', occupied: '--', sold: 'sold', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '71°', hvacMode: 'Cool', humidity: 57, alert: false, lastUpdate: '5/29/23, 2:12 pm' },
        { room: '304', occupied: '--', sold: '--', dnd: '--', hvac: 'Off', thermostat: 'Offline', roomTemp: '--', hvacMode: '--', humidity: 60, alert: true, alertType: 'highHumidity', lastUpdate: '5/29/23, 2:13 pm' },
        { room: '305', occupied: '--', sold: '--', dnd: '--', hvac: 'Off', thermostat: 'Offline', roomTemp: '--', hvacMode: '--', humidity: '--', alert: true, alertType: 'filterChange', lastUpdate: '5/29/23, 2:15 pm' },
        { room: '306', occupied: 'yes', sold: 'sold', dnd: 'yes', hvac: 'On', thermostat: 'Offline', roomTemp: '--', hvacMode: 'Fan', humidity: '--', alert: false, lastUpdate: '5/29/23, 2:16 pm' },
        { room: '307', occupied: '--', sold: '--', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '71°', hvacMode: 'Cool', humidity: 58, alert: false, lastUpdate: '5/29/23, 2:10 pm' },
        { room: '308', occupied: 'yes', sold: 'sold', dnd: '--', hvac: 'Off', thermostat: 'Offline', roomTemp: '--', hvacMode: '--', humidity: '--', alert: true, alertType: 'doorWindowACOn', lastUpdate: '5/29/23, 2:10 pm' }
    ],
    "2": [
        { room: '201', occupied: 'yes', sold: 'sold', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '72°', hvacMode: 'Cool', humidity: 56, alert: false, lastUpdate: '5/29/23, 2:10 pm' },
        { room: '202', occupied: '--', sold: '--', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '69°', hvacMode: 'Cool', humidity: 54, alert: false, lastUpdate: '5/29/23, 2:11 pm' }
    ],
    "1": [
        { room: '101', occupied: 'yes', sold: 'sold', dnd: 'yes', hvac: 'On', thermostat: 'Offline', roomTemp: '71°', hvacMode: 'Cool', humidity: 55, alert: false, lastUpdate: '5/29/23, 2:10 pm' },
        { room: '102', occupied: '--', sold: 'sold', dnd: '--', hvac: 'On', thermostat: 'Offline', roomTemp: '70°', hvacMode: 'Cool', humidity: 56, alert: false, lastUpdate: '5/29/23, 2:12 pm' }
    ]
};

let currentFloor = "3";
// Cached DOM refs and localized alert texts map for performance
let _roomRowsEl = null;
let _floorSelectEl = null;
let _roomSearchEl = null;
let _btnSearchEl = null;
let _alertTextMap = {};
// Maps for incremental rendering
let _roomRowMap = {}; // roomNumber -> DOM element
let _roomDataMap = {}; // roomNumber -> last rendered data object

// Pagination state (safe defaults if pagination controls are not present)
// If the page has no Prev/Next controls, keep PAGE_SIZE large to show all rows.
let PAGE_SIZE = 1000;
let CURRENT_ROWS = [];
let CURRENT_PAGE = 1;

// Simple debounce helper
function debounce(fn, wait){
    let t = null;
    return function(...args){
        clearTimeout(t);
        t = setTimeout(()=> fn.apply(this,args), wait);
    };
}

// showToast: non-blocking localized toast message
function showToast(message, ms){
    try{
        const container = document.getElementById('toastContainer') || (function(){
            const c = document.createElement('div'); c.id='toastContainer'; c.className='toast-container'; document.body.appendChild(c); return c; })();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role','status');
        toast.innerText = message;
        container.appendChild(toast);
        // force reflow then show
        void toast.offsetWidth;
        toast.classList.add('show');
        const keep = ms || 3000;
        const to = setTimeout(()=>{
            toast.classList.remove('show');
            setTimeout(()=>{ try{ container.removeChild(toast);}catch(e){} }, 280);
        }, keep);
        // allow manual dismiss on click
        toast.addEventListener('click', ()=>{ clearTimeout(to); toast.classList.remove('show'); setTimeout(()=>{ try{ container.removeChild(toast);}catch(e){} }, 120); });
    }catch(e){ console.warn('showToast failed', e); }
}

function populateRoomGrid(rooms) {
    // Cache container ref
    const container = _roomRowsEl || document.getElementById('roomRows');
    _roomRowsEl = container;
    // Use DocumentFragment to minimize reflows
    const frag = document.createDocumentFragment();

    // Build rows using a string builder for innerHTML per-row (fast) but append once
    rooms.forEach(room => {
        const row = buildRowElement(room);
        // store maps for incremental updates
        _roomRowMap[room.room] = row;
        _roomDataMap[room.room] = Object.assign({}, room);
        frag.appendChild(row);
    });

    // Clear and append fragment in one operation
    container.innerHTML = '';
    container.appendChild(frag);
}

// Build a single row element from room data
function buildRowElement(room){
    const row = document.createElement('div');
    row.className = 'room-row';
    row.setAttribute('data-room', room.room);
    // support multiple alerts: room.alerts can be an array of types or a single alertType string
    const alertTypes = normalizeAlertTypes(room);
    const alertHtml = (alertTypes && alertTypes.length) ? alertTypes.map(at=>`<span class="alert-icon alert-type-${at}" data-alert-type="${at}" title="${escapeHtml(_alertTextMap[at] || getAlertText(at))}">${getAlertIconSvg(at)}</span>`).join(' ') : '--';

    const occupiedHtml = (String(room.occupied || '').toLowerCase() === 'yes' || String(room.occupied || '').toLowerCase() === 'ocupado') ? `<div style="color:#ef4444">Ocupado</div>` : `<div>—</div>`;
    const soldHtml = (String(room.sold || '').toLowerCase() === 'sold' || String(room.sold || '').toLowerCase() === 'vendido') ? `<div style="color:#22c55e">Vendido</div>` : `<div>—</div>`;
    row.innerHTML = `
        <div>${room.room}</div>
        ${occupiedHtml}
        ${soldHtml}
        <div>${room.dnd}</div>
        <div class="${room.hvac === 'On' ? 'status-on' : 'status-off'}">${room.hvac}</div>
        <div>${room.thermostat}</div>
        <div class="temp-normal">${room.roomTemp}</div>
        <div>${room.hvacMode}</div>
        <div>${room.humidity}</div>
        <div>${alertHtml}</div>
        <div>${room.lastUpdate}</div>
    `;
    return row;
}

// Normalize alert types from room data to an array of type strings
function normalizeAlertTypes(room){
    if(!room) return [];
    // preferred: room.alerts is array of strings or objects with type
    if(Array.isArray(room.alerts)){
        return room.alerts.map(a => typeof a === 'string' ? a : (a && a.type) ? a.type : null).filter(Boolean);
    }
    // legacy single-field support: alertType or alert boolean
    if(room.alertType) return [room.alertType];
    if(room.alert && room.alert === true) return [ 'other' ];
    return [];
}

// Update grid incrementally for a given floor
function updateGridForFloor(floor, rooms){
    try{
        const container = _roomRowsEl || document.getElementById('roomRows');
        if(!container) return;

        const newRoomMap = {};
        // iterate new rooms and update existing rows or append new ones
        rooms.forEach((room, idx) => {
            const rn = room.room;
            newRoomMap[rn] = true;
            const existingRow = _roomRowMap[rn];
            if(existingRow){
                // compare with cached data, update changed cells
                const old = _roomDataMap[rn] || {};
                if(!shallowEqualRoom(old, room)){
                    updateRowElement(existingRow, old, room);
                    _roomDataMap[rn] = Object.assign({}, room);
                }
                // ensure order: if position changed, move node
                const desiredChild = container.children[idx];
                if(desiredChild !== existingRow){
                    container.insertBefore(existingRow, desiredChild || null);
                }
            } else {
                // new row -> build and insert at correct position
                const newRow = buildRowElement(room);
                _roomRowMap[rn] = newRow;
                _roomDataMap[rn] = Object.assign({}, room);
                const desiredChild = container.children[idx];
                container.insertBefore(newRow, desiredChild || null);
            }
        });

        // remove rows that no longer exist
        Object.keys(_roomRowMap).forEach(rn => {
            if(!newRoomMap[rn]){
                const el = _roomRowMap[rn];
                try{ if(el && el.parentNode) el.parentNode.removeChild(el); }catch(e){}
                delete _roomRowMap[rn];
                delete _roomDataMap[rn];
            }
        });
    }catch(e){ console.warn('updateGridForFloor failed', e); }
}

// shallow compare fields relevant to display
function shallowEqualRoom(a,b){
    if(!a || !b) return false;
    const alertsA = normalizeAlertTypes(a).join('|');
    const alertsB = normalizeAlertTypes(b).join('|');
    return a.occupied===b.occupied && a.sold===b.sold && a.dnd===b.dnd && a.hvac===b.hvac && a.thermostat===b.thermostat && a.roomTemp===b.roomTemp && a.hvacMode===b.hvacMode && String(a.humidity)===String(b.humidity) && alertsA===alertsB && a.lastUpdate===b.lastUpdate;
}

// update a row element's children based on changed fields
function updateRowElement(row, old, room){
    try{
        const ch = row.children;
        if(!ch || ch.length < 11) return;
        // 1 occupied
        if(old.occupied !== room.occupied) {
            const occ = String(room.occupied || '').toLowerCase();
            ch[1].innerText = (occ === 'yes' || occ === 'ocupado') ? 'Ocupado' : '—';
            ch[1].style.color = (occ === 'yes' || occ === 'ocupado') ? '#ef4444' : '';
        }
        if(old.sold !== room.sold) {
            const sold = String(room.sold || '').toLowerCase();
            ch[2].innerText = (sold === 'sold' || sold === 'vendido') ? 'Vendido' : '—';
            ch[2].style.color = (sold === 'sold' || sold === 'vendido') ? '#22c55e' : '';
        }
        if(old.dnd !== room.dnd) ch[3].innerText = room.dnd;
        if(old.hvac !== room.hvac){ ch[4].innerText = room.hvac; ch[4].className = (room.hvac === 'On' ? 'status-on' : 'status-off'); }
        if(old.thermostat !== room.thermostat) ch[5].innerText = room.thermostat;
        if(old.roomTemp !== room.roomTemp) ch[6].innerText = room.roomTemp;
        if(old.hvacMode !== room.hvacMode) ch[7].innerText = room.hvacMode;
        if(String(old.humidity) !== String(room.humidity)) ch[8].innerText = room.humidity;
        if(old.lastUpdate !== room.lastUpdate) ch[10].innerText = room.lastUpdate;

        // alert cell (index 9) may contain span or text
        // alerts may be multiple; compare normalized arrays
        const oldAlerts = normalizeAlertTypes(old || {});
        const newAlerts = normalizeAlertTypes(room || {});
        if(oldAlerts.join('|') !== newAlerts.join('|')){
            if(newAlerts.length){
                ch[9].innerHTML = newAlerts.map(at=>`<span class="alert-icon alert-type-${at}" data-alert-type="${at}" title="${escapeHtml(_alertTextMap[at] || getAlertText(at))}">${getAlertIconSvg(at)}</span>`).join(' ');
            } else {
                ch[9].innerHTML = '--';
            }
        }
        // Notify thermostat modal (if open) about the updated room data so it can sync statuses
        try{
            if(window.thermostatControl && typeof window.thermostatControl.updateRoomDataFromExternal === 'function'){
                window.thermostatControl.updateRoomDataFromExternal(room);
            }
        }catch(e){ console.warn('notify thermostatControl failed', e); }
    }catch(e){ console.warn('updateRowElement error', e); }
}

// Return a small SVG icon string for an alert type. Uses currentColor so CSS color classes apply.
// Icon style variant (can be toggled at runtime). Options: 'default', 'detailed', 'line'
let ALERT_ICON_STYLE = 'default';

function setAlertIconStyle(style){
    if(!style) return;
    ALERT_ICON_STYLE = style;
    // Update any icons already in the DOM
    try{ updateIconsInDOM(); }catch(e){ console.warn('setAlertIconStyle update failed', e); }
}

function getAlertIconStyle(){ return ALERT_ICON_STYLE; }

// Update existing alert icons in the document and refresh popover if open
function updateIconsInDOM(){
    try{
        const icons = document.querySelectorAll('.alert-icon');
        icons.forEach(ic => {
            const at = ic.getAttribute('data-alert-type');
            ic.innerHTML = getAlertIconSvg(at);
        });
        // refresh popover content if open so it uses new SVGs
        refreshOpenAlertPopover();
    }catch(e){ console.warn('updateIconsInDOM failed', e); }
}

// Return a small SVG icon string per alert type and current style. Icons use currentColor so CSS classes apply.
function getAlertIconSvg(type){
    const t = type || 'other';
    // default: compact filled shapes (fast rendering)
    if(ALERT_ICON_STYLE === 'default'){
        switch(t){
            case 'highHumidity': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M12 2s-7 6.5-7 11a7 7 0 0 0 14 0c0-4.5-7-11-7-11z"/></svg>`;
            case 'doorWindowACOn': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="3" width="14" height="18" rx="1" stroke="none" fill="currentColor"/><circle cx="17" cy="12" r="0.9" fill="#fff"/></svg>`;
            case 'filterChange': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M3 4h18v2l-7 6v6l-4 2v-8L3 6V4z"/></svg>`;
            default: return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M1 21h22L12 2 1 21z"/></svg>`;
        }
    }

    // detailed: slightly larger/complex shapes with inner paths
    if(ALERT_ICON_STYLE === 'detailed'){
        switch(t){
            case 'highHumidity':
                return `<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2s-7 6.5-7 11a7 7 0 0 0 14 0c0-4.5-7-11-7-11z" fill="currentColor"/><path d="M12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="rgba(255,255,255,0.18)"/></svg>`;
            case 'doorWindowACOn':
                return `<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 3h10v18H6z" fill="currentColor"/><path d="M16 12a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" fill="rgba(255,255,255,0.9)"/></svg>`;
            case 'filterChange':
                return `<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 4h18v2l-7 6v6l-4 2v-8L3 6V4z" fill="currentColor"/><path d="M10 14h4v2h-4z" fill="rgba(255,255,255,0.12)"/></svg>`;
            default:
                return `<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 21h22L12 2 1 21z" fill="currentColor"/><path d="M12 9v4" stroke="rgba(255,255,255,0.9)" stroke-width="1" stroke-linecap="round"/></svg>`;
        }
    }

    // line: stroke-only, lighter visual weight
    if(ALERT_ICON_STYLE === 'line'){
        switch(t){
            case 'highHumidity':
                return `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2s-7 6.5-7 11a7 7 0 0 0 14 0c0-4.5-7-11-7-11z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            case 'doorWindowACOn':
                return `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="3" width="12" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="16" cy="12" r="0.7" fill="currentColor"/></svg>`;
            case 'filterChange':
                return `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 4h18v2l-7 6v6l-4 2v-8L3 6V4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            default:
                return `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 21h22L12 2 1 21z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
        }
    }

    // fallback to default if unknown style
    return getAlertIconSvg(type);
}

// expose setter/getter to allow runtime toggling from console or UI
window.setAlertIconStyle = setAlertIconStyle;
window.getAlertIconStyle = getAlertIconStyle;

// Return alert entries with optional desc and ts for a room (supports legacy and new formats)
function getAlertEntries(room){
    const out = [];
    if(!room) return out;
    if(Array.isArray(room.alerts)){
        room.alerts.forEach(a => {
            if(typeof a === 'string') out.push({ type: a, desc: null, ts: room.lastUpdate || null });
            else if(a && typeof a === 'object') out.push({ type: a.type || 'other', desc: a.desc || a.text || null, ts: a.ts || a.time || room.lastUpdate || null });
        });
        return out;
    }
    if(room.alertType) { out.push({ type: room.alertType, desc: room.alertDesc || null, ts: room.alertTs || room.lastUpdate || null }); return out; }
    if(room.alert && room.alert === true) { out.push({ type: 'other', desc: null, ts: room.lastUpdate || null }); }
    return out;
}

// small helper to escape title strings used in innerHTML
function escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function changeFloor(floor) {
    currentFloor = floor;
    // Build filtered rows
    let rooms = [];
    if(String(floor).toLowerCase()==='all'){
        Object.keys(allRoomData).forEach(f => { (allRoomData[f]||[]).forEach(r => rooms.push(r)); });
        // sort by numeric room id
        rooms.sort((a,b)=> parseInt(a.room,10) - parseInt(b.room,10));
    } else {
        rooms = (allRoomData[floor] || []).slice();
    }
    CURRENT_ROWS = rooms;
    CURRENT_PAGE = 1;
    renderCurrentView();
    const rs = document.getElementById('roomSearch'); if(rs) rs.value = '';
    clearRoomSelection();
}

function renderCurrentView(){
    const start = (CURRENT_PAGE-1)*PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageRows = CURRENT_ROWS.slice(start, end);
    populateRoomGrid(pageRows);
    updatePaginationUI();
}

function updatePaginationUI(){
    const info = document.getElementById('page-info');
    const total = Math.max(1, Math.ceil(CURRENT_ROWS.length / PAGE_SIZE));
    if(info) info.innerText = `${CURRENT_PAGE} / ${total}`;
    const prev = document.getElementById('btn-prev'); if(prev) prev.disabled = (CURRENT_PAGE<=1);
    const next = document.getElementById('btn-next'); if(next) next.disabled = (CURRENT_PAGE>=total);
}

function prevPage(){ if(CURRENT_PAGE>1){ CURRENT_PAGE--; renderCurrentView(); } }
function nextPage(){ const total = Math.max(1, Math.ceil(CURRENT_ROWS.length / PAGE_SIZE)); if(CURRENT_PAGE<total){ CURRENT_PAGE++; renderCurrentView(); } }
window.prevPage = prevPage;
window.nextPage = nextPage;

function searchRoom() {
    const roomNumber = document.getElementById('roomSearch').value;
    if (!roomNumber) return;
    // Search across all floors for an exact match and ignore the floor select
    let foundFloor = null;
    Object.keys(allRoomData).forEach(f => {
        const found = (allRoomData[f] || []).some(r => r.room === roomNumber);
        if (found) foundFloor = f;
    });

    if (foundFloor) {
        const sel = document.getElementById('floorSelect');
        const usingAll = sel && sel.value === 'all';
        if(usingAll){
            changeFloor('all');
            const idx = CURRENT_ROWS.findIndex(r => r.room === roomNumber);
            if(idx>=0){ CURRENT_PAGE = Math.floor(idx / PAGE_SIZE) + 1; renderCurrentView(); }
        } else {
            if (currentFloor !== foundFloor) {
                if (sel) sel.value = foundFloor;
                changeFloor(foundFloor);
            }
        }
        selectRoom(roomNumber);
    } else {
        // localized not-found message as non-blocking toast
        const msg = (typeof STR !== 'undefined' && STR.searchNotFound) ? STR.searchNotFound : (function(){ try{ const c=localStorage.getItem('i18n_cache'); if(!c) return 'Search not found'; const parsed=JSON.parse(c); const lang=localStorage.getItem('ilux_lang')||'pt'; return (parsed[lang] && parsed[lang].app && parsed[lang].app.searchNotFound) ? parsed[lang].app.searchNotFound : 'Search not found'; } catch(e){return 'Search not found';}})();
        showToast(msg, 3600);
    }
}

function selectRoom(roomNumber) {
    try {
        console.log('selectRoom called for', roomNumber);
        clearRoomSelection();
        
        // Get room data
        const roomData = _roomDataMap[roomNumber];
        if (!roomData) return;
        
        // Highlight selected row
        const row = _roomRowMap[roomNumber];
        if (row) row.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        
        // Initialize and show thermostat control. If thermostatControl is not yet loaded,
        // retry a few times with short delay so the UI that registers it can finish loading.
        const tryInit = (attemptsLeft) => {
            if (window.thermostatControl && typeof window.thermostatControl.initializeThermostat === 'function') {
                try {
                    window.thermostatControl.initializeThermostat(roomData);
                } catch (e) {
                    console.warn('thermostatControl.initializeThermostat threw', e);
                }
                return;
            }
            if (attemptsLeft <= 0) {
                console.warn('thermostatControl not available after retries');
                return;
            }
            // retry after 200ms
            setTimeout(() => tryInit(attemptsLeft - 1), 200);
        };
        tryInit(10); // ~2 seconds total
    } catch(e) {
        console.warn('Error selecting room:', e);
    }
}
    

function clearRoomSelection() {
    const rows = document.querySelectorAll('.room-row');
    rows.forEach(row => {
        row.style.backgroundColor = '';
    });
    // Close thermostat modal if open
    try {
        window.thermostatControl.closeThermostat();
    } catch(e) {}
}

// Room control update functions
function updateRoomTemperature(room, temp) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].roomTemp = temp;
        const row = _roomRowMap[room];
        if (row) {
            const tempCell = row.children[6];
            if (tempCell) tempCell.innerText = temp + '°C';
        }
    } catch(e) {
        console.warn('Error updating room temperature:', e);
    }
}

function updateRoomFanSpeed(room, speed) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].fanSpeed = speed;
        // Update UI if needed
    } catch(e) {
        console.warn('Error updating fan speed:', e);
    }
}

function updateRoomPrivacy(room, status) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].privacy = status;
        // Update UI if needed
    } catch(e) {
        console.warn('Error updating privacy status:', e);
    }
}

function updateRoomService(room, status) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].service = status;
        // Update UI if needed
    } catch(e) {
        console.warn('Error updating service status:', e);
    }
}

function updateRoomCollectTray(room, status) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].collectTray = status;
        // Update UI if needed
    } catch(e) {
        console.warn('Error updating collect tray status:', e);
    }
}

// Update set point (from thermostat UI) - stored separately from roomTemp
function updateRoomSetPoint(room, setPointC) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].setPoint = setPointC;
        // Optionally reflect visually: append ' (SP: xx°C)' in temp column
        const row = _roomRowMap[room];
        if (row) {
            const tempCell = row.children[6];
            if (tempCell) tempCell.innerText = (_roomDataMap[room].roomTemp ? _roomDataMap[room].roomTemp : '--') + ' (SP: ' + setPointC + '°C)';
        }
    } catch(e) { console.warn('Error updating room set point:', e); }
}

// Update HVAC mode (from thermostat auto logic)
function updateRoomHvacMode(room, mode) {
    try {
        if (!_roomDataMap[room]) return;
        _roomDataMap[room].hvacMode = mode;
        const row = _roomRowMap[room];
        if (row) {
            const hvacCell = row.children[7];
            if (hvacCell) hvacCell.innerText = mode;
            // also update hvac status cell (index 4) - On/Off based on mode
            const hvacStatusCell = row.children[4];
            if (hvacStatusCell) hvacStatusCell.innerText = (mode && mode !== 'Off') ? 'On' : 'Off';
        }
    } catch(e) { console.warn('Error updating room hvac mode:', e); }
}

// Make update functions available to thermostat control
window.updateRoomTemperature = updateRoomTemperature;
window.updateRoomFanSpeed = updateRoomFanSpeed;
window.updateRoomPrivacy = updateRoomPrivacy;
window.updateRoomService = updateRoomService;
window.updateRoomCollectTray = updateRoomCollectTray;
window.updateRoomSetPoint = updateRoomSetPoint;
window.updateRoomHvacMode = updateRoomHvacMode;
// Language selector handler - syncs with main app when possible
async function onLangChange(newLang) {
    try { localStorage.setItem('ilux_lang', newLang); } catch (e) { console.warn('Could not write language to localStorage', e); }

    // Force clear i18n cache and reload
    try {
        localStorage.removeItem('i18n_cache');
        localStorage.removeItem('i18n_cache_time');
        if (window.opener && typeof window.opener.loadAppI18N === 'function') {
            await window.opener.loadAppI18N();
            // Small delay to ensure localStorage is updated
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (e) { console.warn('Failed to reload i18n from opener', e); }

    // Prefer to reuse the main app i18n if available in this window
    try {
        if (typeof changeLanguage === 'function') {
            // changeLanguage handles loadAppI18N/initTexts and updates STR
            await changeLanguage(newLang);
            // apply engineering-specific labels using STR from app.js
            applyEngineeringTextsFromSTR();
            return;
        }
    } catch (err) {
        console.warn('Error calling changeLanguage locally', err);
    }

    // Otherwise, if opener has changeLanguage, call it and still update local labels
    try {
        if (window.opener && typeof window.opener.changeLanguage === 'function') {
            window.opener.changeLanguage(newLang);
        }
    } catch (err) {
        console.warn('Error invoking opener.changeLanguage:', err);
    }

    // Fallback: local load & apply
    loadAndApplyI18N(newLang).then(() => applyEngineeringTextsFromSTR()).catch(e => console.warn('i18n apply error', e));
}

function applyEngineeringTextsFromSTR(){
    try{
        // Try to get translations from cache if STR is not available
        let s;
        try {
            const cache = localStorage.getItem('i18n_cache');
            if (cache) {
                const parsed = JSON.parse(cache);
                const lang = localStorage.getItem('ilux_lang') || 'pt';
                s = (parsed[lang] && parsed[lang].app) ? parsed[lang].app : null;
            }
        } catch(e) {
            console.warn('Failed to load from cache:', e);
        }
        
        // If no cache or failed, use default strings
        if (!s) {
            s = {
                engineeringTitle: 'ENGINEERING',
                portalTitle: 'iLuxSys · Portal',
                close: 'Close',
                floorLabel: 'Floor',
                roomLabel: 'Room',
                iconStyleLabel: 'Icon',
                search: 'Search',
                colRoom: 'ROOM',
                colOccupied: 'OCCUPIED',
                colSold: 'SOLD',
                colDnd: 'DND',
                colHvac: 'HVAC',
                colThermostat: 'THERMOSTAT',
                colRoomTemp: 'ROOM TEMP.',
                colHvacMode: 'HVAC MODE',
                colHumidity: '% HUMIDITY',
                colAlert: 'ALERT',
                colLastUpdate: 'LAST UPDATE'
            };
        }

        const safe = (k, fallback) => (s && s[k]) ? s[k] : fallback;

        // Apply translations
        t('engTitle', safe('engineeringTitle','ENGINEERING'));
        
        // Header title and close button
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.innerText = `${safe('portalTitle','iLuxSys · Portal')} · ${safe('engineeringTitle','ENGINEERING')}`;
        }
        
        // Find and translate close button
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.innerText && ['fechar', 'close', 'cerrar'].some(word => b.innerText.toLowerCase().includes(word))
        );
        if (closeBtn) closeBtn.innerText = safe('close','Close');

    // Labels
    t('lbl-floor', safe('floorLabel','Floor'));
        t('lbl-room', safe('roomLabel','Room'));
        t('lbl-icon-style', safe('iconStyleLabel','Icon'));

        // Search button
        const btnSearch = document.getElementById('btn-search');
        if (btnSearch) btnSearch.innerText = safe('search','Search');

        // Grid headers
        t('col-room', safe('colRoom','ROOM'));
        t('col-occupied', safe('colOccupied','OCCUPIED'));
        t('col-sold', safe('colSold','SOLD'));
        t('col-dnd', safe('colDnd','DND'));
        t('col-hvac', safe('colHvac','HVAC'));
        t('col-thermostat', safe('colThermostat','THERMOSTAT'));
        t('col-roomtemp', safe('colRoomTemp','ROOM TEMP.'));
        t('col-hvacmode', safe('colHvacMode','HVAC MODE'));
        t('col-humidity', safe('colHumidity','% HUMIDITY'));
        t('col-alert', safe('colAlert','ALERT'));
        t('col-lastupdate', safe('colLastUpdate','LAST UPDATE'));
        const btn = document.getElementById('btn-search'); if(btn) btn.innerText = safe('search','Buscar');
        t('col-room', safe('colRoom','ROOM'));
        t('col-occupied', safe('colOccupied','OCCUPIED'));
        t('col-sold', safe('colSold','SOLD'));
        t('col-dnd', safe('colDnd','DND'));
        t('col-hvac', safe('colHvac','HVAC'));
        t('col-thermostat', safe('colThermostat','THERMOSTAT'));
        t('col-roomtemp', safe('colRoomTemp','ROOM TEMP.'));
        t('col-hvacmode', safe('colHvacMode','HVAC MODE'));
        t('col-humidity', safe('colHumidity','% HUMIDITY'));
        t('col-alert', safe('colAlert','ALERT'));
        t('col-lastupdate', safe('colLastUpdate','LAST UPDATE'));
    // New UI elements
    const lang = localStorage.getItem('ilux_lang') || 'pt';
    const optAll = document.getElementById('opt-all-floors'); if(optAll) optAll.innerText = (s && s.allFloors) ? s.allFloors : (lang==='en'?'All floors':(lang==='es'?'Todos los pisos':'Todos os andares'));
    const btnPrev = document.getElementById('btn-prev'); if(btnPrev) btnPrev.innerText = (s && s.previous) ? s.previous : (lang==='en'?'Previous':(lang==='es'?'Anterior':'Anterior'));
    const btnNext = document.getElementById('btn-next'); if(btnNext) btnNext.innerText = (s && s.next) ? s.next : (lang==='en'?'Next':(lang==='es'?'Siguiente':'Próximo'));
    const btnCsv = document.getElementById('btn-export-csv'); if(btnCsv) btnCsv.innerText = (s && s.exportCSV) ? s.exportCSV : (lang==='en'?'Export CSV':(lang==='es'?'Exportar CSV':'Exportar CSV'));
        
        // build alert text map once for performance and update icons
        try{
            _alertTextMap = {
                highHumidity: safe('alertHighHumidity','High Humidity'),
                doorWindowACOn: safe('alertDoorWindowOpenACOn','Door or window open with AC on'),
                filterChange: safe('alertFilterChange','Filter change required'),
                other: safe('alertOther','Alert')
            };
            const icons = document.querySelectorAll('.alert-icon');
            icons.forEach(ic => {
                const at = ic.getAttribute('data-alert-type');
                ic.title = _alertTextMap[at] || _alertTextMap.other;
            });
            // refresh open popover if present so texts update immediately
            try{ refreshOpenAlertPopover(); }catch(e){}
            // notify thermostat modal to re-apply texts if present
            try{ if(window.thermostatControl && typeof window.thermostatControl.applyI18N === 'function') window.thermostatControl.applyI18N(); }catch(e){}
        }catch(e){}
    }catch(e){console.warn('applyEngineeringTextsFromSTR failed',e);}
}

// Load i18n.json (with simple caching) and apply texts to engineering page
async function loadAndApplyI18N(requestedLang) {
    const keyCache = 'i18n_cache';
    const now = Date.now();
    let data = null;
    try {
        const cached = localStorage.getItem(keyCache);
        if (cached) data = JSON.parse(cached);
    } catch (e) {
        console.warn('Could not read i18n cache', e);
    }

    if (!data) {
        // fetch fresh
        const res = await fetch('i18n.json?t=' + now, {cache:'no-store'});
        if (!res.ok) throw new Error('i18n fetch failed');
        data = await res.json();
        try { localStorage.setItem(keyCache, JSON.stringify(data)); } catch(e){/*ignore*/}
    }

    const lang = requestedLang || (localStorage.getItem('ilux_lang') || 'pt');
    const pack = (data && data[lang] && data[lang].app) ? data[lang].app : (data && data.pt && data.pt.app) ? data.pt.app : {};
    applyEngineeringTexts(pack);
}

function applyEngineeringTexts(STR) {
    try {
        const set = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
        set('engTitle', STR.engineeringTitle || 'ENGENHARIA');
        // header title and close button
        const headerTitle = document.getElementById('header-title'); if (headerTitle) headerTitle.innerText = ((STR.portalTitle || 'iLuxSys · Portal') + ' · ' + (STR.engineeringTitle || 'ENGENHARIA'));
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b=>b.innerText && (b.innerText.toLowerCase().includes('fechar') || b.innerText.toLowerCase().includes('close') || b.innerText.toLowerCase().includes('salir')));
        if (closeBtn) closeBtn.innerText = STR.close || 'Close';
        set('lbl-floor', STR.floorLabel || 'Pavimento:');
        set('lbl-room', STR.roomLabel || 'Quarto:');
        // Search button
        const btn = document.getElementById('btn-search'); if(btn) btn.innerText = STR.search || 'Buscar';

        // Grid headers - try to use common keys where possible
        set('col-room', STR.colRoom || 'ROOM');
        set('col-occupied', STR.colOccupied || 'OCCUPIED');
        set('col-sold', STR.colSold || 'SOLD');
        set('col-dnd', STR.colDnd || 'DND');
        set('col-hvac', STR.colHvac || 'HVAC');
        set('col-thermostat', STR.colThermostat || 'THERMOSTAT');
        set('col-roomtemp', STR.colRoomTemp || 'ROOM TEMP.');
        set('col-hvacmode', STR.colHvacMode || 'HVAC MODE');
        set('col-humidity', STR.colHumidity || '% HUMIDITY');
        set('col-alert', STR.colAlert || 'ALERT');
        set('col-lastupdate', STR.colLastUpdate || 'LAST UPDATE');

    // Icon style label
    set('lbl-icon-style', STR.iconStyleLabel || 'Ícone');

        // update any alert icons with localized title
        try{
            const icons = document.querySelectorAll('.alert-icon');
            icons.forEach(ic => {
                const at = ic.getAttribute('data-alert-type');
                const txt = (function(){ switch(at){ case 'highHumidity': return STR.alertHighHumidity; case 'doorWindowACOn': return STR.alertDoorWindowOpenACOn; case 'filterChange': return STR.alertFilterChange; default: return STR.alertOther; } })();
                if(txt) ic.title = txt;
            });
        }catch(e){}

        // You can expand STR with more keys if desired; fallback to existing text when missing
    } catch (e) {
        console.warn('applyEngineeringTexts error', e);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Get language from URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam) {
        localStorage.setItem('ilux_lang', langParam);
    }
    
    // cache some DOM refs
    _roomRowsEl = document.getElementById('roomRows');
    _floorSelectEl = document.getElementById('floorSelect');
    _roomSearchEl = document.getElementById('roomSearch');
    _btnSearchEl = document.getElementById('btn-search');

    // Default to All floors view
    const sel = document.getElementById('floorSelect'); if(sel) sel.value = 'all';
    changeFloor('all');

    // Provide thermostat control with the full room list for quick-switch
    try{
        const roomList = [];
        Object.keys(allRoomData).forEach(f => { (allRoomData[f]||[]).forEach(r => roomList.push(r)); });
        if(window.thermostatControl && typeof window.thermostatControl.setRoomList === 'function') {
            window.thermostatControl.setRoomList(roomList);
        }
    }catch(e){console.warn('could not set thermostat room list', e)}

    // event delegation for row clicks (single listener)
    try{
        if(_roomRowsEl){
            _roomRowsEl.addEventListener('click', function(ev){
                // if the click was on an alert icon, open popover instead of selecting the row
                const alertIcon = ev.target.closest && ev.target.closest('.alert-icon');
                if(alertIcon){
                    ev.stopPropagation();
                    // show popover for this icon
                    const row = alertIcon.closest('.room-row');
                    const roomNumber = row ? row.getAttribute('data-room') : null;
                    showAlertPopover(alertIcon, roomNumber);
                    return;
                }

                const rr = ev.target.closest && ev.target.closest('.room-row');
                if(rr && rr.getAttribute('data-room')) selectRoom(rr.getAttribute('data-room'));
            });
        }
    }catch(e){console.warn('event delegation setup failed', e);}    

    // Initialize language selector to stored value (if present)
    try {
        const sel = document.getElementById('langSelect');
        const stored = localStorage.getItem('ilux_lang') || 'pt';
        if (sel) sel.value = stored;

        // Prefer to reuse app.js i18n helpers if available
        if (typeof loadAppI18N === 'function') {
            try {
                await loadAppI18N();
                // ensure STR from app.js is current
                if (typeof getStrings === 'function') {
                    STR = getStrings(localStorage.getItem('ilux_lang') || 'pt');
                }
                // apply engineering-specific labels using app STR
                applyEngineeringTextsFromSTR();
            } catch (e) {
                // fallback to local loader
                loadAndApplyI18N(stored).catch(e=>console.warn('i18n init fallback error',e));
            }
        } else {
            // fallback
            loadAndApplyI18N(stored).catch(e=>console.warn('i18n init error',e));
        }
    } catch (e) {
        console.warn('Could not initialize language selector', e);
    }

    // attach debounced search handler
    try{
        if(_roomSearchEl){
            const deb = debounce(()=> searchRoom(), 250);
            _roomSearchEl.addEventListener('input', deb);
        }
    }catch(e){console.warn('could not attach debounced search', e);}    

    // Wire the icon style selector (if present) to allow runtime switching
    try{
        const iconSel = document.getElementById('iconStyleSelect');
        if(iconSel){
            try{ iconSel.value = (typeof getAlertIconStyle === 'function') ? getAlertIconStyle() : 'default'; }catch(_){}
            iconSel.addEventListener('change', function(){ try{ setAlertIconStyle(this.value); }catch(e){ console.warn('icon style change failed', e); } });
        }
    }catch(e){ console.warn('could not wire icon style selector', e); }

    // Hide loading overlay
    const lo = document.getElementById('loadingOverlay');
    if (lo) lo.style.display = 'none';
});

// Listen for storage events so the engineering window updates when the main portal changes language
window.addEventListener('storage', function(e){
    try{
        if(!e) return;
        // React when language or the i18n cache is updated in another window
        if(e.key === 'ilux_lang' || e.key === 'i18n_cache' || e.key === 'i18n_cache_timestamp'){
            const newLang = localStorage.getItem('ilux_lang') || e.newValue || 'pt';
            
            // Update language selector
            const sel = document.getElementById('langSelect');
            if(sel) sel.value = newLang;
            
            // Try to get translations from opener window first
            let gotTranslations = false;
            try {
                if(window.opener && typeof window.opener.getStrings === 'function') {
                    const openerStrings = window.opener.getStrings(newLang);
                    if(openerStrings) {
                        STR = openerStrings;
                        applyEngineeringTextsFromSTR();
                        gotTranslations = true;
                    }
                }
            } catch(err) {
                console.warn('Failed to get translations from opener:', err);
            }
            
            // If we couldn't get translations from opener, load them directly
            if(!gotTranslations) {
                loadAndApplyI18N(newLang).then(() => {
                    applyEngineeringTextsFromSTR();
                }).catch(err => {
                    console.warn('Failed to load translations:', err);
                    // Still try to apply from cache as last resort
                    applyEngineeringTextsFromSTR();
                });
            }
        }
    }catch(err){ console.warn('storage handler error', err); }
});

// Alert popover management
let _openAlertPopover = null;
let _openAlertContext = null; // { roomNumber }

function showAlertPopover(iconEl, roomNumber){
    try{
        hideAlertPopover(); // close existing
        const container = document.getElementById('alertPopoverContainer') || (function(){ const c=document.createElement('div'); c.id='alertPopoverContainer'; document.body.appendChild(c); return c; })();
        const roomData = (_roomDataMap && _roomDataMap[roomNumber]) ? _roomDataMap[roomNumber] : (function(){
            // fallback search in allRoomData
            for(const f in allRoomData){ const r = (allRoomData[f]||[]).find(x=>x.room===roomNumber); if(r) return r; } return null;
        })();

        const alertTypes = normalizeAlertTypes(roomData || {});

    const pop = document.createElement('div');
        pop.className = 'alert-popover';
        pop.setAttribute('role','dialog');
        pop.setAttribute('aria-label','Alert details');

        // header
        const h = document.createElement('h4');
        h.innerText = (typeof STR !== 'undefined' && STR.alertsTitle) ? STR.alertsTitle : ((typeof STR !== 'undefined' && STR.alertsTitle===undefined)? 'ALERTS' : 'ALERTS');
        pop.appendChild(h);

        // close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ap-close';
        closeBtn.innerText = '✕';
        closeBtn.onclick = hideAlertPopover;
        pop.appendChild(closeBtn);

        if(alertTypes && alertTypes.length){
            // use detailed entries when available
            const entries = getAlertEntries(roomData || {});
            entries.forEach(en => {
                const at = en.type || 'other';
                const item = document.createElement('div'); item.className='ap-item';
                const icon = document.createElement('div'); icon.className='ap-icon type-'+at; icon.innerHTML = getAlertIconSvg(at);
                const text = document.createElement('div'); text.className='ap-text';
                const title = document.createElement('div'); title.innerText = (_alertTextMap && _alertTextMap[at]) ? _alertTextMap[at] : getAlertText(at);
                text.appendChild(title);
                if(en.desc){ const d = document.createElement('div'); d.className='ap-desc'; d.innerText = en.desc; text.appendChild(d); }
                const time = document.createElement('div'); time.className='ap-time'; time.innerText = en.ts ? ( (typeof STR !== 'undefined' && STR.colLastUpdate) ? (STR.colLastUpdate + ': ' + en.ts) : ('Last update: ' + en.ts) ) : '';
                if(time.innerText) text.appendChild(time);
                item.appendChild(icon);
                item.appendChild(text);
                pop.appendChild(item);
            });
        } else {
            const p = document.createElement('div'); p.className='ap-item'; p.innerText = (typeof STR !== 'undefined' && STR.searchNotFound) ? STR.searchNotFound : 'No alerts'; pop.appendChild(p);
        }

        container.appendChild(pop);
        _openAlertPopover = pop;
    _openAlertContext = { roomNumber: roomNumber };

        // position popover near icon
        const rect = iconEl.getBoundingClientRect();
        const docEl = document.documentElement;
        const scrollTop = window.pageYOffset || docEl.scrollTop || document.body.scrollTop || 0;
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || document.body.scrollLeft || 0;
        // prefer above icon if enough space, else below
        const popRect = pop.getBoundingClientRect();
        let top = rect.top + scrollTop - popRect.height - 8;
        if(top < scrollTop + 8) top = rect.bottom + scrollTop + 8;
        let left = rect.left + scrollLeft - (popRect.width/2) + (rect.width/2);
        if(left < 8) left = 8;
        if(left + popRect.width > (window.innerWidth - 8)) left = window.innerWidth - popRect.width - 8;
        pop.style.top = top + 'px';
        pop.style.left = left + 'px';

        // click outside or Esc closes
        setTimeout(()=>{ document.addEventListener('click', _docClickClose); document.addEventListener('keydown', _escClose); }, 50);
    }catch(e){ console.warn('showAlertPopover failed', e); }
}

function hideAlertPopover(){
    try{
        if(_openAlertPopover){
            const parent = _openAlertPopover.parentNode; if(parent) parent.removeChild(_openAlertPopover);
            _openAlertPopover = null;
        }
        document.removeEventListener('click', _docClickClose);
        document.removeEventListener('keydown', _escClose);
    }catch(e){}
}

function _docClickClose(ev){
    if(!_openAlertPopover) return;
    if(ev.target.closest && ev.target.closest('.alert-popover')) return; // clicked inside popover
    if(ev.target.closest && ev.target.closest('.alert-icon')) return; // clicked another icon (the handler will handle)
    hideAlertPopover();
}

function _escClose(ev){ if(ev.key === 'Escape') hideAlertPopover(); }

// If a popover is open, refresh its contents (used after language change)
function refreshOpenAlertPopover(){
    try{
        if(!_openAlertPopover || !_openAlertContext) return;
        const roomNumber = _openAlertContext.roomNumber;
        // find current anchor icon in DOM
        const row = _roomRowMap[roomNumber] || (function(){ for(const f in allRoomData){ const r = (allRoomData[f]||[]).find(x=>x.room===roomNumber); if(r){ const container = _roomRowsEl || document.getElementById('roomRows'); return container && container.querySelector(`.room-row[data-room="${roomNumber}"]`); } } return null; })();
        const iconEl = row ? row.querySelector('.alert-icon') : null;
        // re-show popover using current icon (this closes old one)
        if(iconEl){
            hideAlertPopover();
            showAlertPopover(iconEl, roomNumber);
        }
    }catch(e){console.warn('refreshOpenAlertPopover failed', e);}    
}

// Function to update room data (would be called by your real-time updates)
function updateRoomData(newData) {
    // `newData` expected to be an object keyed by floor (e.g. {"3": [...]} )
    try {
        Object.keys(newData || {}).forEach(f => {
            allRoomData[f] = newData[f];
            // Rebuild CURRENT_ROWS if current view is affected
            if(String(currentFloor).toLowerCase()==='all' || f === currentFloor){
                // rebuild current rows and rerender current page
                if(String(currentFloor).toLowerCase()==='all'){
                    CURRENT_ROWS = [];
                    Object.keys(allRoomData).forEach(ff => { (allRoomData[ff]||[]).forEach(r => CURRENT_ROWS.push(r)); });
                    CURRENT_ROWS.sort((a,b)=> parseInt(a.room,10) - parseInt(b.room,10));
                } else {
                    CURRENT_ROWS = (allRoomData[currentFloor]||[]).slice();
                }
                renderCurrentView();
            }
        });
    } catch (err) {
        console.warn('updateRoomData error', err);
    }
}

// Return localized alert text for a given alert type key
function getAlertText(alertType){
    try{
        const s = (typeof STR !== 'undefined') ? STR : (function(){ try{ const c=localStorage.getItem('i18n_cache'); if(!c) return {}; const parsed=JSON.parse(c); const lang=localStorage.getItem('ilux_lang')||'pt'; return (parsed[lang] && parsed[lang].app)? parsed[lang].app : {}; } catch(e){return {};}})();
        if(!alertType) return (s.alertOther || 'Alert');
        switch(alertType){
            case 'highHumidity': return s.alertHighHumidity || 'High Humidity';
            case 'doorWindowACOn': return s.alertDoorWindowOpenACOn || 'Door or window open with AC on';
            case 'filterChange': return s.alertFilterChange || 'Filter change required';
            default: return s.alertOther || 'Alert';
        }
    }catch(e){return 'Alert';}
}

// CSV export for current filtered rows (all pages)
function exportEngineeringCSV(){
    try{
        const lang = localStorage.getItem('ilux_lang')||'pt';
        const headers = [
            (typeof STR!== 'undefined' && STR.colRoom) ? STR.colRoom : (lang==='en'?'ROOM':(lang==='es'?'HABITACIÓN':'QUARTO')),
            (typeof STR!== 'undefined' && STR.colOccupied) ? STR.colOccupied : (lang==='en'?'OCCUPIED':(lang==='es'?'OCUPADO':'OCUPADO')),
            (typeof STR!== 'undefined' && STR.colSold) ? STR.colSold : (lang==='en'?'SOLD':(lang==='es'?'VENDIDO':'VENDIDO')),
            (typeof STR!== 'undefined' && STR.colDnd) ? STR.colDnd : 'DND',
            (typeof STR!== 'undefined' && STR.colHvac) ? STR.colHvac : 'HVAC',
            (typeof STR!== 'undefined' && STR.colThermostat) ? STR.colThermostat : 'THERMOSTAT',
            (typeof STR!== 'undefined' && STR.colRoomTemp) ? STR.colRoomTemp : (lang==='en'?'ROOM TEMP.':(lang==='es'?'TEMP. HAB.':'TEMP. QUARTO')),
            (typeof STR!== 'undefined' && STR.colHvacMode) ? STR.colHvacMode : 'HVAC MODE',
            (typeof STR!== 'undefined' && STR.colHumidity) ? STR.colHumidity : '% HUMIDITY',
            (typeof STR!== 'undefined' && STR.colAlert) ? STR.colAlert : 'ALERT',
            (typeof STR!== 'undefined' && STR.colLastUpdate) ? STR.colLastUpdate : (lang==='en'?'LAST UPDATE':(lang==='es'?'ÚLTIMA ACTUALIZACIÓN':'ÚLTIMA ATUALIZAÇÃO'))
        ];
        const rows = CURRENT_ROWS.map(r=>{
            const alerts = normalizeAlertTypes(r).map(t=> getAlertText(t)).join('; ');
            return [
                r.room,
                r.occupied || '',
                r.sold || '',
                r.dnd || '',
                r.hvac || '',
                r.thermostat || '',
                r.roomTemp || '',
                r.hvacMode || '',
                (r.humidity!=null ? r.humidity : ''),
                alerts || '',
                r.lastUpdate || ''
            ];
        });
        const csv = [headers].concat(rows).map(line=> line.map(col=>`"${String(col).replace(/"/g,'""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `engineering_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }catch(e){ console.warn('exportEngineeringCSV failed', e); }
}
window.exportEngineeringCSV = exportEngineeringCSV;