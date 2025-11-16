// IntegrationModel: manage integrations per property (localStorage-backed)
(function(global){
  const STORAGE_KEY = 'nexefii_integrations';

  function _read(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }
  function _write(list){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list || [])); } catch(e){} }

  function _genId(){ return 'integration-' + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36); }

  function listAllIntegrations(){ return _read(); }

  function getIntegrationsForProperty(propertyId){
    if(!propertyId) return [];
    const all = listAllIntegrations();
    return all.filter(i => String(i.propertyId) === String(propertyId));
  }

  function upsertIntegration(propertyId, integration){
    if(!propertyId || !integration) return null;
    const all = listAllIntegrations();
    if (!integration.id) integration.id = _genId();
    integration.propertyId = propertyId;
    integration.updatedAt = new Date().toISOString();
    const idx = all.findIndex(i => i.id === integration.id);
    if (idx === -1) all.push(integration); else all[idx] = Object.assign({}, all[idx], integration);
    _write(all);
    return integration;
  }

  function deleteIntegration(propertyId, integrationId){
    if(!propertyId || !integrationId) return false;
    let all = listAllIntegrations();
    const before = all.length;
    all = all.filter(i => !(i.id === integrationId && String(i.propertyId) === String(propertyId)));
    _write(all);
    return all.length !== before;
  }

  function seedDemoIntegrations(propertyId){
    if(!propertyId) return [];
    const demo = [];
    // lightweight placeholders depending on propertyId hash
    demo.push({ id: _genId(), propertyId, module:'PMS', provider:'OPERA', enabled:true, environment:'sandbox', apiBaseUrl:'https://sandbox.opera.example', apiKey:'demo-key', apiSecret:'demo-secret', hotelCode:'DEMO_'+propertyId, pollingIntervalSec:300, lastSyncAt:null, lastSyncStatus:'OK', mappings: { roomMap:[] } });
    demo.push({ id: _genId(), propertyId, module:'OTA', provider:'OMNIBEES', enabled:true, environment:'sandbox', apiBaseUrl:'https://api.omnibees.example', apiKey:'demo-key', lastSyncAt:null, lastSyncStatus:'OK', mappings: { roomTypes:[] } });
    demo.push({ id: _genId(), propertyId, module:'IOT', provider:'SIMONIOT', enabled:true, environment:'sandbox', apiBaseUrl:'https://iot.simoniot.example', apiKey:'demo-key', lastSyncAt:null, lastSyncStatus:'OK', mappings: { roomsToDevices:[] } });
    const inserted = demo.map(d => upsertIntegration(propertyId, d));
    return inserted;
  }

  global.IntegrationModel = {
    listAllIntegrations,
    getIntegrationsForProperty,
    upsertIntegration,
    deleteIntegration,
    seedDemoIntegrations
  };

})(window);
