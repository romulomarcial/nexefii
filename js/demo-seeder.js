// DemoSeeder: seeds demo properties, users and integrations
(function(global){
  function _genId(prefix){ return prefix + '-' + Math.random().toString(36).slice(2,8) + '-' + Date.now().toString(36); }

  function seedDemoProperties(){
    const key = 'nexefii_properties';
    let props = {};
    try { props = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){ props = {}; }
    // create Rio if missing
    if (!Object.values(props).find(p=>p && p.name && p.name.includes('Nexefii Demo - Rio'))){
      const p1 = { id: _genId('prop'), key: 'nexefii_demo_rio', slug: 'demo-rio', name: 'Nexefii Demo - Rio', modules: { pms:true, housekeeping:true, engineering:true, bi:true, iot:true, doorLock:true } };
      props[p1.key] = p1;
    }
    // create Miami if missing
    if (!Object.values(props).find(p=>p && p.name && p.name.includes('Nexefii Demo - Miami'))){
      const p2 = { id: _genId('prop'), key: 'nexefii_demo_miami', slug: 'demo-miami', name: 'Nexefii Demo - Miami', modules: { pms:true, housekeeping:false, engineering:true, bi:true, iot:false, doorLock:true } };
      props[p2.key] = p2;
    }
    try { localStorage.setItem(key, JSON.stringify(props)); } catch(e){}
    return Object.keys(props).map(k=>props[k]);
  }

  function seedDemoUsers(){
    if (!window.UserModel) return [];
    // ensure default users
    try { if (typeof window.UserModel.ensureDefaultUsers === 'function') window.UserModel.ensureDefaultUsers(); } catch(e){}
    const created = [];
    // user single property (Rio)
    if (!window.UserModel.findByEmail('user-rio@demo.com')){
      const u = window.UserModel.createUser({ email:'user-rio@demo.com', name:'User Rio', role:'USER', properties: [], password:'Demo@123' });
      created.push(u);
    }
    // user multi property
    if (!window.UserModel.findByEmail('user-multi@demo.com')){
      const u = window.UserModel.createUser({ email:'user-multi@demo.com', name:'User Multi', role:'USER', properties: [], password:'Demo@123' });
      created.push(u);
    }
    return created;
  }

  function seedDemoIntegrationsForProps(props){
    if (!window.IntegrationModel) return [];
    const created = [];
    props.forEach(p=>{
      const existing = window.IntegrationModel.getIntegrationsForProperty(p.id || p.key || p.slug) || [];
      if (!existing.length){
        const inserted = window.IntegrationModel.seedDemoIntegrations(p.id || p.key || p.slug);
        created.push(...inserted);
      }
    });
    return created;
  }

  async function seedDemoEnvironment(){
    // properties
    const props = seedDemoProperties();
    // ensure user model defaults and create demo users
    try { seedDemoUsers(); } catch(e){}
    // associate demo users to properties
    const users = window.UserModel ? window.UserModel.getAllUsers() : [];
    const rio = props.find(p=>p.name && p.name.includes('Rio'));
    const miami = props.find(p=>p.name && p.name.includes('Miami'));
    // assign user-rio to rio
    const ur = users.find(u=>u.email==='user-rio@demo.com');
    if (ur && rio) { ur.properties = [ { id: rio.id, key: rio.key, slug: rio.slug, name: rio.name } ]; window.UserModel.updateUser(ur); }
    // assign user-multi to both
    const um = users.find(u=>u.email==='user-multi@demo.com');
    if (um) { um.properties = []; if (rio) um.properties.push({ id:rio.id, key:rio.key, slug:rio.slug, name:rio.name }); if (miami) um.properties.push({ id:miami.id, key:miami.key, slug:miami.slug, name:miami.name }); window.UserModel.updateUser(um); }
    // seed integrations
    seedDemoIntegrationsForProps(props);
    alert('Ambiente demo criado com sucesso. Credenciais: master@nexefii.local / Master@123 | superadmin@nexefii.local / Super@123\nUsuários demo: user-rio@demo.com / Demo@123 , user-multi@demo.com / Demo@123');
  }

  global.DemoSeeder = { seedDemoEnvironment };

})(window);
