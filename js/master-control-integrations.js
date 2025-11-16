// Master Control - Integrations UI
(function(){
  function $id(id){return document.getElementById(id);} 
  function ensureMaster(){ try{ if(window.SessionContext && typeof window.SessionContext.isMasterUser === 'function'){ if(!window.SessionContext.isMasterUser()){ window.location.href='/pages/property-dashboard.html'; return false; } } }catch(e){} return true; }

  function init(){ if(!ensureMaster()) return; const propSelect = $id('int_prop_select'); const listArea = $id('int_list_area'); const btnAdd = $id('int_add_btn');
    populateProps();
    propSelect.addEventListener('change', ()=>{ renderListFor(propSelect.value); });
    btnAdd.addEventListener('click', ()=>{ openForm(); });
  }

  function populateProps(){ const sel = $id('int_prop_select'); sel.innerHTML=''; let props=[]; try{ props = (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function')? window.NexefiiProps.listProperties() : Object.keys(JSON.parse(localStorage.getItem('nexefii_properties')||'{}')).map(k=>JSON.parse(localStorage.getItem('nexefii_properties')||'{}')[k]); }catch(e){ props=[]; }
    if(!props.length){ sel.innerHTML = '<option value="">-- Nenhuma propriedade --</option>'; return; }
    sel.appendChild(Object.assign(document.createElement('option'),{ value:'', text:'-- Selecione --' }));
    props.forEach(p=>{ const o=document.createElement('option'); o.value = p.id || p.key || p.slug; o.text = p.name || p.slug || o.value; sel.appendChild(o); });
  }

  function renderListFor(propertyId){ const area = $id('int_list_area'); area.innerHTML=''; if(!propertyId){ area.innerHTML='<div style="color:#666">Selecione uma propriedade</div>'; return; } const ints = (window.IntegrationModel && typeof window.IntegrationModel.getIntegrationsForProperty === 'function')? window.IntegrationModel.getIntegrationsForProperty(propertyId) : [];
    if(!ints.length) { area.innerHTML='<div style="color:#666">Nenhuma integração configurada para esta propriedade.</div>'; return; }
    ints.forEach(i=>{ const card=document.createElement('div'); card.className='master-card'; card.style.marginBottom='8px'; card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${i.module}</strong> - ${i.provider}</div><div>${i.enabled?'<span style=\"color:green\">Ativo</span>':'<span style=\"color:#999\">Desativado</span>'}</div></div><div style="margin-top:6px">Env: ${i.environment} | Last: ${i.lastSyncStatus||'N/A'}</div>`;
+      const actions = document.createElement('div'); actions.style.marginTop='8px';
+      const btnEdit = document.createElement('button'); btnEdit.className='btn'; btnEdit.innerText='Editar'; btnEdit.addEventListener('click', ()=>{ openForm(i.propertyId, i); });
+      const btnToggle = document.createElement('button'); btnToggle.className='btn'; btnToggle.style.marginLeft='6px'; btnToggle.innerText = i.enabled? 'Desativar':'Ativar'; btnToggle.addEventListener('click', ()=>{ toggleEnabled(i.propertyId, i.id); });
+      const btnDel = document.createElement('button'); btnDel.className='btn'; btnDel.style.marginLeft='6px'; btnDel.innerText='Remover'; btnDel.addEventListener('click', ()=>{ if(confirm('Remover integração?')){ if(window.IntegrationModel) window.IntegrationModel.deleteIntegration(i.propertyId, i.id); renderListFor(propertyId); } });
+      actions.appendChild(btnEdit); actions.appendChild(btnToggle); actions.appendChild(btnDel);
+      card.appendChild(actions);
+      area.appendChild(card);
    });
  }

  function openForm(propertyId, existing){
    const modal = document.getElementById('int_form'); if(!modal) return; modal.style.display='block';
    // fill property select
    const psel = document.getElementById('int_form_prop'); psel.innerHTML='';
    let props=[]; try{ props = (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function')? window.NexefiiProps.listProperties() : Object.keys(JSON.parse(localStorage.getItem('nexefii_properties')||'{}')).map(k=>JSON.parse(localStorage.getItem('nexefii_properties')||'{}')[k]); }catch(e){ props=[]; }
    props.forEach(p=>{ const o = document.createElement('option'); o.value=p.id||p.key||p.slug; o.text = p.name || p.slug; psel.appendChild(o); });
    if(propertyId) psel.value = propertyId;
    // reset fields
    document.getElementById('int_form_module').value = existing? existing.module : 'PMS';
    document.getElementById('int_form_provider').value = existing? existing.provider : '';
    document.getElementById('int_form_env').value = existing? existing.environment : 'sandbox';
    document.getElementById('int_form_apiBase').value = existing? existing.apiBaseUrl : '';
    document.getElementById('int_form_apiKey').value = existing? existing.apiKey : '';
    document.getElementById('int_form_id').value = existing? existing.id : '';
  }

  function closeForm(){ const modal = document.getElementById('int_form'); if(modal) modal.style.display='none'; }

  function saveForm(){ const id = document.getElementById('int_form_id').value; const propertyId = document.getElementById('int_form_prop').value; const module = document.getElementById('int_form_module').value; const provider = document.getElementById('int_form_provider').value; const env = document.getElementById('int_form_env').value; const apiBase = document.getElementById('int_form_apiBase').value; const apiKey = document.getElementById('int_form_apiKey').value;
    if(!propertyId || !module || !provider){ alert('Preencha pelo menos propriedade, módulo e provider'); return; }
    const obj = { id: id||undefined, module: module, provider: provider, environment: env, apiBaseUrl: apiBase, apiKey: apiKey, enabled: true, mappings: {} };
    if (window.IntegrationModel) window.IntegrationModel.upsertIntegration(propertyId, obj);
    closeForm(); renderListFor(propertyId);
  }

  function toggleEnabled(propertyId, integrationId){ const ints = window.IntegrationModel.getIntegrationsForProperty(propertyId) || []; const target = ints.find(i=>i.id===integrationId); if(!target) return; target.enabled = !target.enabled; if(!target.enabled) target.lastSyncStatus='DISABLED'; window.IntegrationModel.upsertIntegration(propertyId, target); renderListFor(propertyId); }

  // wire modal buttons
  document.addEventListener('DOMContentLoaded', ()=>{
    const modalSave = document.getElementById('int_form_save'); if(modalSave) modalSave.addEventListener('click', saveForm);
    const modalClose = document.getElementById('int_form_close'); if(modalClose) modalClose.addEventListener('click', closeForm);
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init,50); else document.addEventListener('DOMContentLoaded', init);
  });

})();
