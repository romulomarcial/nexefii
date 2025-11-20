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

  // Modal helpers for the canonical user modal
  function openUserModal(){
    const modal = document.getElementById('userModal');
    if (!modal) { console.warn('[Users] userModal não encontrado'); return; }
    modal.style.display = 'flex';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    try { document.body.style.overflow = 'hidden'; } catch(e){}
    try { const card = document.getElementById('userFormCard'); if (card) card.style.display='block'; } catch(e){}
  }

  function closeUserModal(){
    const modal = document.getElementById('userModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
    try { document.body.style.overflow = ''; } catch(e){}
    try { const card = document.getElementById('userFormCard'); if (card) card.style.display='none'; } catch(e){}
  }

  function init(){
    if (!ensureMaster()) return;
    const listArea = $id('usersListArea');
    const btnCreate = $id('btnCreateUser');
    const btnSeed = $id('btnSeedDemo');
    const formCard = $id('userFormCard');
    let editingId = null;

    // Wire create button to our canonical modal (prefer modal over inline panel)
    if (btnCreate) {
      btnCreate.addEventListener('click', (e)=>{ e.preventDefault(); openUserModal(); });
    }
    if (btnSeed) btnSeed.addEventListener('click', ()=>{ if (window.DemoSeeder && typeof window.DemoSeeder.seedDemoEnvironment === 'function') { window.DemoSeeder.seedDemoEnvironment(); renderList(); populatePropsChecklist(); } else { alert('DemoSeeder não disponível'); } });
    const ufCancelEl = $id('uf_cancel'); if (ufCancelEl) ufCancelEl.addEventListener('click', ()=>{ if (formCard) formCard.style.display='none'; editingId=null; });
    const ufSaveEl = $id('uf_save'); if (ufSaveEl) ufSaveEl.addEventListener('click', saveForm);

    // attach data-user-modal-close handlers
    Array.from(document.querySelectorAll('[data-user-modal-close]')).forEach(btn => {
      try { btn.addEventListener('click', (e)=>{ e.preventDefault(); closeUserModal(); }); } catch(e){}
    });

    renderList();
    populatePropsChecklist();

    // toolbar de propriedades (busca / selecionar tudo / limpar)
    const propsSearchEl = $id('uf_props_search');
    const propsSelectAllEl = $id('uf_props_select_all');
    const propsClearAllEl = $id('uf_props_clear_all');

    if (propsSearchEl) {
      propsSearchEl.addEventListener('input', () => {
        const term = propsSearchEl.value || '';
        populatePropsChecklist(term);
      });
    }

    if (propsSelectAllEl) {
      propsSelectAllEl.addEventListener('click', () => {
        Array.from(document.querySelectorAll('#uf_props input[type=checkbox]')).forEach(cb => { cb.checked = true; });
      });
    }

    if (propsClearAllEl) {
      propsClearAllEl.addEventListener('click', () => {
        Array.from(document.querySelectorAll('#uf_props input[type=checkbox]')).forEach(cb => { cb.checked = false; });
      });
    }
  }

  // cache simples em memória para evitar reprocessar a origem toda hora
  let _ufAllPropsCache = null;

  function populatePropsChecklist(filterText) {
    const listEl = $id('uf_props');
    if (!listEl) return;

    // preservar seleção atual antes de redesenhar
    const previouslySelected = new Set(
      Array.from(listEl.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value.toString())
    );

    listEl.innerHTML = '';

    // carregar cache se ainda não carregado
    if (!_ufAllPropsCache) {
      let props = [];
      try {
        if (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') {
          props = window.NexefiiProps.listProperties() || [];
        } else {
          const raw = localStorage.getItem('nexefii_properties') || '{}';
          const parsed = JSON.parse(raw);
          props = Object.keys(parsed).map(k => parsed[k]);
        }
      } catch (e) {
        console.warn('[Users] populatePropsChecklist(): erro ao carregar propriedades', e);
        props = [];
      }
      _ufAllPropsCache = props || [];
    }

    let propsToRender = _ufAllPropsCache;

    // aplicar filtro de texto (case-insensitive) se fornecido
    const ft = (filterText || '').toString().trim().toLowerCase();
    if (ft) {
      propsToRender = _ufAllPropsCache.filter(p => {
        const name = (p.name || p.key || p.slug || '').toString().toLowerCase();
        return name.includes(ft);
      });
    }

    if (!propsToRender.length) {
      listEl.innerHTML = '<div style="color:#666;font-size:13px;">Nenhuma propriedade encontrada.</div>';
      return;
    }

    propsToRender.forEach(p => {
      const idValue = (p.id || p.key || p.slug || p.name || '').toString();
      const labelText = (p.name || p.key || p.slug || idValue || 'Propriedade').toString();
      const checkboxId = 'propcb_' + idValue.replace(/[^a-z0-9]/gi, '');

      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-label';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '4px';
      wrapper.style.fontSize = '13px';

      wrapper.innerHTML = `
        <input
          id="${checkboxId}"
          type="checkbox"
          value="${idValue}"
          data-propname="${labelText}"
        />
        <span>${labelText}</span>
      `;

      const cb = wrapper.querySelector('input[type=checkbox]');
      if (cb && previouslySelected.has(idValue)) {
        cb.checked = true;
      }

      listEl.appendChild(wrapper);
    });
  }

  function renderList(){
    const area = $id('usersListArea');
    const tbody = $id('usersTableBody');
    const users = (window.UserModel && typeof window.UserModel.getAllUsers === 'function') ? window.UserModel.getAllUsers() : [];

    if (!area && !tbody) {
      console.warn('[Users] renderList(): container #usersListArea ou #usersTableBody não encontrado; abortando render.');
      return;
    }

    if(!users.length){
      if (area) { area.innerHTML = '<div style="color:#666">Nenhum usuário registrado.</div>'; }
      if (tbody) { tbody.innerHTML = '<tr><td colspan="7" style="color:#666">Nenhum usuário registrado.</td></tr>'; }
      try { document.getElementById('totalUsers').innerText = 0; document.getElementById('activeUsers').innerText = 0; } catch(e){}
      return;
    }

    // If page provides a tbody (#usersTableBody) prefer populating it, otherwise render full table into #usersListArea
    if (tbody) {
      tbody.innerHTML = '';
      users.forEach(u=>{
        const tr = document.createElement('tr'); tr.style.borderTop='1px solid #eee';
        const propsCount = Array.isArray(u.properties) ? u.properties.length : 0;
        const tdUser = document.createElement('td'); tdUser.textContent = u.name||'';
        const tdEmail = document.createElement('td'); tdEmail.textContent = u.email||'';
        const tdRole = document.createElement('td'); tdRole.textContent = u.role||'';
        const tdProps = document.createElement('td'); tdProps.textContent = propsCount;
        const tdStatus = document.createElement('td'); tdStatus.textContent = u.isActive? 'Ativo':'Inativo';
        const tdActions = document.createElement('td');
        const btnEdit = document.createElement('button'); btnEdit.className='btn'; btnEdit.innerText='Editar'; btnEdit.addEventListener('click',()=>openForm(u.id));
        const btnToggle = document.createElement('button'); btnToggle.className='btn'; btnToggle.style.marginLeft='6px'; btnToggle.innerText = u.isActive? 'Desativar':'Ativar'; btnToggle.addEventListener('click',()=>{ toggleActive(u.id); });
        const btnReset = document.createElement('button'); btnReset.className='btn'; btnReset.style.marginLeft='6px'; btnReset.innerText='Resetar senha'; btnReset.addEventListener('click',()=>{ resetPassword(u.id); });
        tdActions.appendChild(btnEdit); tdActions.appendChild(btnToggle); tdActions.appendChild(btnReset);
        tr.appendChild(tdUser); tr.appendChild(tdEmail); tr.appendChild(tdRole); tr.appendChild(tdProps); tr.appendChild(tdStatus); tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
    } else {
      // fallback: render full table into list area
      const table = document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse';
      table.innerHTML = `<thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Props</th><th>Status</th><th>Ações</th></tr></thead>`;
      const tb = document.createElement('tbody');
      users.forEach(u=>{
        const tr = document.createElement('tr'); tr.style.borderTop='1px solid #eee';
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
    }

    // update stats in master-control dashboard
    try { document.getElementById('totalUsers').innerText = users.length; document.getElementById('activeUsers').innerText = users.filter(u=>u.isActive).length; } catch(e){}
  }

  function openForm(id){
    // If no id -> create flow: open centralized modal and reset form
    if (!id) {
      openUserModal();
      const pwdEl = document.getElementById('uf_password'); if (pwdEl) pwdEl.value='';
      const titleEl = document.getElementById('userFormTitle'); if (titleEl) titleEl.innerText = 'Criar usuário';
      const nameEl = document.getElementById('uf_name'); if (nameEl) nameEl.value='';
      const emailEl = document.getElementById('uf_email'); if (emailEl) emailEl.value='';
      const roleEl = document.getElementById('uf_role'); if (roleEl) roleEl.value='USER';
      Array.from(document.querySelectorAll('#uf_props input[type=checkbox]')).forEach(cb=>cb.checked=false);
      window._mc_editingUser = null;
      return;
    }

    // Edit flow: open modal and populate fields
    const u = window.UserModel.findById ? window.UserModel.findById(id) : null;
    if (!u) return;
    window._mc_editingUser = u.id;
    openUserModal();
    const titleEl2 = document.getElementById('userFormTitle'); if (titleEl2) titleEl2.innerText = 'Editar usuário';
    const nameEl2 = document.getElementById('uf_name'); if (nameEl2) nameEl2.value = u.name || '';
    const emailEl2 = document.getElementById('uf_email'); if (emailEl2) emailEl2.value = u.email || '';
    const roleEl2 = document.getElementById('uf_role'); if (roleEl2) roleEl2.value = u.role || 'USER';
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
    var cardEl = document.getElementById('userFormCard'); if (cardEl) cardEl.style.display='none'; window._mc_editingUser=null; renderList(); try { closeUserModal(); } catch(e){}
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
