// Master Control - Users management (client-side, localStorage-backed)
(function(){
  function $id(id){return document.getElementById(id);}

  function ensureMaster() {
    try {
      if (window.SessionContext && typeof window.SessionContext.isMasterUser === 'function') {
        if (!window.SessionContext.isMasterUser()) {
          // redirect non-master to dashboard
          window.location.href = '/pages/property-dashboard.html';
          return false;
        }
      }
    } catch(e){ /* ignore */ }
    return true;
  }

  function init(){
    if (!ensureMaster()) return;
    const listArea = $id('usersListArea');
    const btnCreate = $id('btnCreateUser');
    const btnSeed = $id('btnSeedDemo');
    const formCard = $id('userFormCard');
    let editingId = null;

    btnCreate.addEventListener('click', ()=>{ openForm(); });
    if (btnSeed) btnSeed.addEventListener('click', ()=>{ if (window.DemoSeeder && typeof window.DemoSeeder.seedDemoEnvironment === 'function') { window.DemoSeeder.seedDemoEnvironment(); renderList(); populatePropsChecklist(); } else { alert('DemoSeeder não disponível'); } });
    $id('uf_cancel').addEventListener('click', ()=>{ formCard.style.display='none'; editingId=null; });
    $id('uf_save').addEventListener('click', saveForm);

    renderList();
    populatePropsChecklist();
  }

  function populatePropsChecklist(){
    const container = $id('uf_props');
    container.innerHTML = '';
    let props = [];
    try { props = (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') ? window.NexefiiProps.listProperties() : (JSON.parse(localStorage.getItem('nexefii_properties')||'{}') ? Object.keys(JSON.parse(localStorage.getItem('nexefii_properties')||'{}')).map(k=>JSON.parse(localStorage.getItem('nexefii_properties')||'{}')[k]) : []); } catch(e){ props = []; }
    if (!props || !props.length) {
      container.innerHTML = '<div style="color:#666;font-size:13px">Nenhuma propriedade cadastrada.</div>';
      return;
    }
    props.forEach(p=>{
      const id = 'propcb_'+(p.id||p.key||p.slug||p.name).toString().replace(/[^a-z0-9]/gi,'');
      const wrapper = document.createElement('label'); wrapper.className='checkbox-label'; wrapper.style.marginRight='8px';
      wrapper.innerHTML = `<input type="checkbox" value="${p.id||p.key||p.slug||p.name}" data-propname="${p.name||p.slug||p.key}" /> <span>${p.name||p.key||p.slug}</span>`;
      container.appendChild(wrapper);
    });
  }

  function renderList(){
    const area = $id('usersListArea');
    const users = (window.UserModel && typeof window.UserModel.getAllUsers === 'function') ? window.UserModel.getAllUsers() : [];
    if(!users.length){ area.innerHTML = '<div style="color:#666">Nenhum usuário registrado.</div>'; return; }
    const table = document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse';
    table.innerHTML = `<thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Props</th><th>Status</th><th>Ações</th></tr></thead>`;
    const tb = document.createElement('tbody');
    users.forEach(u=>{
      const tr = document.createElement('tr');
      tr.style.borderTop='1px solid #eee';
      const propsCount = Array.isArray(u.properties) ? u.properties.length : 0;
      tr.innerHTML = `<td>${u.name||''}</td><td>${u.email||''}</td><td>${u.role||''}</td><td>${propsCount}</td><td>${u.isActive? 'Ativo':'Inativo'}</td><td></td>`;
      const actions = tr.querySelector('td:last-child');
      const btnEdit = document.createElement('button'); btnEdit.className='btn'; btnEdit.innerText='Editar'; btnEdit.addEventListener('click',()=>openForm(u.id));
      const btnToggle = document.createElement('button'); btnToggle.className='btn'; btnToggle.style.marginLeft='6px'; btnToggle.innerText = u.isActive? 'Desativar':'Ativar'; btnToggle.addEventListener('click',()=>{ toggleActive(u.id); });
      const btnReset = document.createElement('button'); btnReset.className='btn'; btnReset.style.marginLeft='6px'; btnReset.innerText='Resetar senha'; btnReset.addEventListener('click',()=>{ resetPassword(u.id); });
      actions.appendChild(btnEdit); actions.appendChild(btnToggle); actions.appendChild(btnReset);
      tb.appendChild(tr);
    });
    table.appendChild(tb); area.innerHTML=''; area.appendChild(table);
    // update stats in master-control dashboard
    try { document.getElementById('totalUsers').innerText = users.length; document.getElementById('activeUsers').innerText = users.filter(u=>u.isActive).length; } catch(e){}
  }

  function openForm(id){
    const card = document.getElementById('userFormCard'); card.style.display='block';
    document.getElementById('uf_password').value='';
    if (!id) {
      document.getElementById('userFormTitle').innerText = 'Criar usuário';
      document.getElementById('uf_name').value='';
      document.getElementById('uf_email').value='';
      document.getElementById('uf_role').value='USER';
      Array.from(document.querySelectorAll('#uf_props input[type=checkbox]')).forEach(cb=>cb.checked=false);
      window._mc_editingUser = null;
      return;
    }
    const u = window.UserModel.findById ? window.UserModel.findById(id) : null;
    if (!u) return;
    window._mc_editingUser = u.id;
    document.getElementById('userFormTitle').innerText = 'Editar usuário';
    document.getElementById('uf_name').value = u.name || '';
    document.getElementById('uf_email').value = u.email || '';
    document.getElementById('uf_role').value = u.role || 'USER';
    const assigned = (u.properties||[]).map(p => (p.id||p.key||p.slug||p).toString());
    Array.from(document.querySelectorAll('#uf_props input[type=checkbox]')).forEach(cb=>{ cb.checked = assigned.indexOf(cb.value.toString())!==-1; });
  }

  function saveForm(){
    const name = document.getElementById('uf_name').value.trim();
    const email = document.getElementById('uf_email').value.trim().toLowerCase();
    const role = document.getElementById('uf_role').value;
    const pwd = document.getElementById('uf_password').value;
    if(!email) { alert('Email é obrigatório'); return; }
    // collect selected props
    const props = Array.from(document.querySelectorAll('#uf_props input[type=checkbox]:checked')).map(cb=>({ id: cb.value, name: cb.getAttribute('data-propname') }));
    if (window._mc_editingUser) {
      const updated = { id: window._mc_editingUser, name, email, role, properties: props };
      if (pwd) updated.passwordHash = window.UserModel.hashPassword ? window.UserModel.hashPassword(pwd) : btoa(pwd);
      window.UserModel.updateUser(updated);
    } else {
      // prevent duplicate email
      if (window.UserModel.findByEmail && window.UserModel.findByEmail(email)) { alert('Email já existe'); return; }
      window.UserModel.createUser({ email, name, role, properties: props, password: pwd || 'changeme' });
    }
    document.getElementById('userFormCard').style.display='none'; window._mc_editingUser=null; renderList();
  }

  function toggleActive(id){
    const u = window.UserModel.findById ? window.UserModel.findById(id) : null; if (!u) return; window.UserModel.updateUser({ id: u.id, isActive: !u.isActive }); renderList();
  }

  function resetPassword(id){
    const newPwd = prompt('Nova senha temporária:'); if (!newPwd) return; const u = window.UserModel.findById ? window.UserModel.findById(id) : null; if (!u) return; window.UserModel.updateUser({ id: u.id, passwordHash: window.UserModel.hashPassword ? window.UserModel.hashPassword(newPwd) : btoa(newPwd) }); alert('Senha redefinida');
  }

  // init on DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init,50); else document.addEventListener('DOMContentLoaded', init);

})();
