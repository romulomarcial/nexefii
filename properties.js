// NEXEFII Properties Management
// Stores property metadata and entitlements in localStorage

(function(){
  const PROPERTIES_STORAGE_KEY = 'nexefii_properties';

  const DEFAULT_PROPERTIES = {
    nexefiiSaoPaulo: {
      key: 'nexefiiSaoPaulo',
      name: 'Nexefii São Paulo',
  imageUrl: 'assets/images/default-hotel-1.jpg',
      location: { 
        city: 'São Paulo', 
        state: 'SP', 
        country: 'Brasil', 
        timezone: 'America/Sao_Paulo',
        coordinates: { lat: -23.5505, lng: -46.6333 } // Coordenadas para API de clima
      },
      roomCount: 56,
      modulesPurchased: ['engineering','housekeeping','alerts'],
      userCapacity: '50to100',
      active: true,
      deployed: true,
      isDemo: false, // Propriedade real (produção)
      deployedAt: '2024-01-15T10:00:00Z',
      deployedUrl: 'https://nexefiiSaoPaulo.nexefii.com'
    },
    nexefiiMiami: {
      key: 'nexefiiMiami',
      name: 'Nexefii Miami',
  imageUrl: 'assets/images/default-hotel-2.jpg',
      location: { 
        city: 'Miami', 
        state: 'FL', 
        country: 'USA', 
        timezone: 'America/New_York',
        coordinates: { lat: 25.7617, lng: -80.1918 }
      },
      roomCount: 72,
      modulesPurchased: ['engineering','housekeeping','alerts'],
      userCapacity: '30to50',
      active: true,
      deployed: true,
      isDemo: true, // Propriedade de demonstração (dados fake)
      deployedAt: '2024-02-20T14:00:00Z',
      deployedUrl: 'https://nexefiiMiami.nexefii.com'
    },
    nexefiiRioDeJaneiro: {
      key: 'nexefiiRioDeJaneiro',
      name: 'Nexefii Rio de Janeiro',
  imageUrl: 'assets/images/default-hotel-3.jpg',
      location: { 
        city: 'Rio de Janeiro', 
        state: 'RJ', 
        country: 'Brasil', 
        timezone: 'America/Sao_Paulo',
        coordinates: { lat: -22.9068, lng: -43.1729 }
      },
      roomCount: 64,
      modulesPurchased: ['engineering','housekeeping','alerts'],
      userCapacity: '50to100',
      active: true,
      deployed: false,
      isDemo: true, // Propriedade de demonstração (não implantada ainda)
      deployedAt: null,
      deployedUrl: null
    }
  };

  function loadMap(){
    try{
      const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      if(!raw){
        // seed defaults
        localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(DEFAULT_PROPERTIES));
        return JSON.parse(JSON.stringify(DEFAULT_PROPERTIES));
        }
      const obj = JSON.parse(raw);
      return obj && typeof obj==='object' ? obj : {};
    }catch(e){ return {}; }
  }
  function saveMap(map){
    try{
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(map||{}));
      return true;
    }catch(e){ return false; }
  }
  function listProperties(){
    const map = loadMap();
    return Object.values(map);
  }
  function getProperty(key){
    const map = loadMap();
    return map[key] || null;
  }
  function upsertProperty(prop){
    if(!prop || !prop.key) return {success:false, error:'invalid_property'};
    const map = loadMap();
    const existing = map[prop.key] || {};
    map[prop.key] = {
      key: prop.key,
      name: prop.name || prop.key,
      imageUrl: prop.imageUrl || '',
      location: prop.location || existing.location || {},
      roomCount: prop.roomCount || existing.roomCount || 50,
      modulesPurchased: Array.isArray(prop.modulesPurchased) ? prop.modulesPurchased.filter((m,i,arr)=>arr.indexOf(m)===i) : [],
      userCapacity: prop.userCapacity || 'to30',
      active: prop.active!==false,
      deployed: prop.deployed !== undefined ? prop.deployed : (existing.deployed || false),
      isDemo: prop.isDemo !== undefined ? prop.isDemo : (existing.isDemo || false),
      deployedAt: prop.deployedAt || existing.deployedAt || null,
      deployedUrl: prop.deployedUrl || existing.deployedUrl || null
    };
    saveMap(map);
    return {success:true};
  }
  function deleteProperty(key){
    const map = loadMap();
    if(!(key in map)) return {success:false, error:'not_found'};
    delete map[key];
    saveMap(map);
    return {success:true};
  }
  function markAsDeployed(key){
    const map = loadMap();
    if(!(key in map)) return {success:false, error:'not_found'};
    map[key].deployed = true;
    saveMap(map);
    return {success:true};
  }

  // Export
  if(typeof window!=='undefined'){
    window.NexefiiProps = {
      listProperties,
      getProperty,
      upsertProperty,
      deleteProperty,
      markAsDeployed
    };
  }
})();
