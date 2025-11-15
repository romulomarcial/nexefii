// Mock thermostat adapter for UI integration
(function(){
// thermostat-adapter.js - Sprint 13 review version (modo global, sem ES modules)
(function () {
  console.log('[ThermostatAdapter] loaded');

  const CONFIG_URL = 'config/thermostat-config.json';

  async function loadThermostatConfig() {
    try {
      const res = await fetch(CONFIG_URL);
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      const data = await res.json();
      window.NexefiiThermostatConfig = data;
      console.log('[ThermostatAdapter] config carregada', data);
    } catch (err) {
      console.error('[ThermostatAdapter] erro ao carregar config', err);
    }
  }

  // Stubs para futura integração real
  function getRoomThermostatState(roomId) {
    const cfg = window.NexefiiThermostatConfig;
    if (!cfg || !cfg.rooms) return null;
    return cfg.rooms[roomId] || null;
  }

  function setRoomSetpoint(roomId, newSetpoint) {
    console.log('[ThermostatAdapter] setpoint fake', { roomId, newSetpoint });
    // Aqui no futuro chamaremos o backend/gateway real.
    return Promise.resolve({ ok: true });
  }

  // Expõe em um namespace global simples
  window.NexefiiThermostat = {
    loadConfig: loadThermostatConfig,
    getRoomThermostatState,
    setRoomSetpoint,
  };

  document.addEventListener('DOMContentLoaded', loadThermostatConfig);
})();
















})();  document.addEventListener('DOMContentLoaded', ()=>{ init().catch(()=>{}); });
n  // auto init (non-blocking)  };    init, listZones, getZone, setSetpoint, _state: state  window.thermostatAdapter = {
n  // Export  function setSetpoint(id, value){ if(state.zones[id]) state.zones[id].setpoint = Number(value); return getZone(id); }  function getZone(id){ return state.zones[id] || null; }
n  function listZones(){ return Object.values(state.zones); }  }    (cfg && cfg.zones || []).forEach(z => state.zones[z.id] = { id:z.id, name:z.name, setpoint: cfg.defaultSetpoint || 22 });    state.config = cfg || { provider:'mock', zones: [] };    const cfg = await loadConfig();
n  async function init(){n  const state = { zones: {}, config: null };