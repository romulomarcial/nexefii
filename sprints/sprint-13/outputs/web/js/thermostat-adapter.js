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
