/**
 * Funções auxiliares para teste local e publicação de propriedades
 * Este arquivo complementa o master-control.js com funções mais simples
 */

// Aguardar masterCtrl estar disponível e adicionar as funções
(function() {
  console.log('[property-publish-helpers] Carregando helpers...');
  
  // Função para esperar masterCtrl estar disponível
  const waitForMasterCtrl = () => {
    if (window.masterCtrl) {
      console.log('[property-publish-helpers] masterCtrl encontrado, adicionando funções...');
      addHelperFunctions();
    } else {
      console.log('[property-publish-helpers] Aguardando masterCtrl...');
      setTimeout(waitForMasterCtrl, 100);
    }
  };
  
  const addHelperFunctions = () => {
    
    // TESTE LOCAL
    window.masterCtrl.testPropertyLocally = function(propertyKey) {
  console.log('[testPropertyLocally] Iniciando teste para:', propertyKey);
  
  const property = window.NexefiiProps.getProperty(propertyKey);
  if (!property) {
    console.error('[testPropertyLocally] Propriedade não encontrada:', propertyKey);
    this.showToast('Propriedade não encontrada!', 'error');
    return;
  }

  console.log('[testPropertyLocally] Propriedade encontrada:', property);

  // Verificar se generateLocalTestHTML existe
  if (typeof generateLocalTestHTML !== 'function') {
    console.error('[testPropertyLocally] generateLocalTestHTML não está disponível!');
    console.log('[testPropertyLocally] Tipo de generateLocalTestHTML:', typeof generateLocalTestHTML);
    this.showToast('❌ Gerador de teste não carregado! Verifique se property-local-test-generator.js está carregado.', 'error');
    return;
  }

  console.log('[testPropertyLocally] Gerando HTML de teste...');
  const testHTML = generateLocalTestHTML(property);
  
  console.log('[testPropertyLocally] Abrindo janela de teste...');
  const testWindow = window.open('', '_blank', 'width=1200,height=800');
  
  if (testWindow) {
    testWindow.document.write(testHTML);
    testWindow.document.close();
    console.log('[testPropertyLocally] Janela de teste aberta com sucesso!');
    this.showToast('✓ Teste local aberto em nova janela!', 'success');
  } else {
    console.warn('[testPropertyLocally] Popup bloqueado, fazendo download...');
    // Download se popup bloqueado
    const blob = new Blob([testHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyKey}-test-local.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[testPropertyLocally] Download iniciado');
    this.showToast('💾 Arquivo de teste baixado! Abra o arquivo HTML para testar.', 'info');
  }
};

// CONFIRMAÃ‡ÃƒO DE PUBLICAÃ‡ÃƒO
window.masterCtrl.confirmPublishProperty = function(propertyKey) {
  console.log('[confirmPublishProperty] Iniciando publicaÃ§Ã£o para:', propertyKey);
  
  const property = window.NexefiiProps.getProperty(propertyKey);
  if (!property) {
    console.error('[confirmPublishProperty] Propriedade nÃ£o encontrada:', propertyKey);
    this.showToast('Propriedade nÃ£o encontrada!', 'error');
    return;
  }

  console.log('[confirmPublishProperty] Propriedade encontrada:', property);
  console.log('[confirmPublishProperty] Abrindo modal de confirmaÃ§Ã£o...');

  // Criar modal de confirmaÃ§Ã£o
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;';
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'background: white; border-radius: 16px; padding: 40px; max-width: 600px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.4);';
  
  modalContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
      <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 28px;">Confirmar Publicação na Web</h2>
      <p style="color: #718096; font-size: 16px; line-height: 1.6;">
        Você está prestes a publicar a propriedade <strong>${property.name}</strong> no ambiente de produção.
      </p>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; display: flex; align-items: center; gap: 8px;">
        <span>🔍</span> Checklist de Validação
      </h4>
      <div style="color: #78350f;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Testei localmente e validei todos os dados</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Todos os módulos estão configurados corretamente</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Estou ciente que a URL <strong>https://${property.key}.nexefii.com</strong> será criada</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Confirmo que desejo publicar na web</span>
        </label>
      </div>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center;">
      <button id="cancelPublishBtn" style="padding: 14px 28px; border: 2px solid #e2e8f0; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4a5568; font-size: 16px;">
        ✖ Cancelar
      </button>
      <button id="confirmPublishBtn" disabled style="padding: 14px 28px; border: none; background: #cbd5e0; color: white; border-radius: 8px; font-weight: 600; cursor: not-allowed; font-size: 16px;">
        🚀 Confirmar Publicação
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Controlar checkboxes
  const checkboxes = modalContent.querySelectorAll('.publish-check');
  const confirmBtn = modalContent.querySelector('#confirmPublishBtn');
  const cancelBtn = modalContent.querySelector('#cancelPublishBtn');

  const updateButton = () => {
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    if (allChecked) {
      confirmBtn.disabled = false;
      confirmBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      confirmBtn.style.cursor = 'pointer';
      confirmBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    } else {
      confirmBtn.disabled = true;
      confirmBtn.style.background = '#cbd5e0';
      confirmBtn.style.cursor = 'not-allowed';
      confirmBtn.style.boxShadow = 'none';
    }
  };

  checkboxes.forEach(cb => cb.addEventListener('change', updateButton));

  // BotÃ£o cancelar
  cancelBtn.onclick = () => modal.remove();

  // BotÃ£o confirmar
  confirmBtn.onclick = () => {
    if (!confirmBtn.disabled) {
      modal.remove();
      this.startDeployment(propertyKey);
    }
  };

  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// INSERIR DADOS FAKE
window.masterCtrl.insertDemoData = function(propertyKey) {
  console.log('[insertDemoData] Iniciando inserÃ§Ã£o para:', propertyKey);
  
  const property = window.NexefiiProps.getProperty(propertyKey);
  if (!property) {
    console.error('[insertDemoData] Propriedade nÃ£o encontrada:', propertyKey);
    this.showToast('Propriedade nÃ£o encontrada!', 'error');
    return;
  }

  console.log('[insertDemoData] Propriedade encontrada:', property);

  // Verificar se DemoDataGenerator estÃ¡ disponÃ­vel
  if (typeof window.DemoDataGenerator === 'undefined') {
    console.error('[insertDemoData] DemoDataGenerator nÃ£o estÃ¡ disponÃ­vel!');
    console.log('[insertDemoData] window.DemoDataGenerator:', window.DemoDataGenerator);
    this.showToast('âŒ Sistema de dados fake nÃ£o carregado! Verifique se demo-data-generator.js estÃ¡ carregado.', 'error');
    return;
  }

  console.log('[insertDemoData] DemoDataGenerator disponÃ­vel, abrindo modal...');

  // Mostrar modal de confirmaÃ§Ã£o
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;';
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'background: white; border-radius: 16px; padding: 40px; max-width: 600px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.4);';
  
  modalContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🧪</div>
      <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 28px;">Inserir Dados de Demonstração</h2>
      <p style="color: #718096; font-size: 16px; line-height: 1.6;">
        Propriedade: <strong>${property.name}</strong>
      </p>
    </div>

    <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #0c4a6e; display: flex; align-items: center; gap: 8px;">
        <span>📦</span> Dados que serão gerados:
      </h4>
      <div style="color: #075985; line-height: 1.8;">
        ✓ Reservas (90 dias de histórico + 30 futuro)<br>
        ✓ Inventário de quartos (${property.roomCount} quartos)<br>
        ✓ Métricas PMS (ocupação, receita, ADR, RevPAR)<br>
        ✓ Tarefas de Housekeeping<br>
        ✓ Ordens de Engenharia<br>
        ✓ Alertas do sistema<br>
        ✓ Perfis de hóspedes
      </div>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; display: flex; align-items: center; gap: 8px;">
        <span>🔁</span> Atualização Automática
      </h4>
      <div style="color: #78350f;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="autoRefreshCheck" checked style="width: 18px; height: 18px; cursor: pointer;">
          <span>Atualizar dados automaticamente a cada 5 minutos</span>
        </label>
        <p style="margin: 10px 0 0 28px; font-size: 14px; color: #92400e;">
          Simula sistema real com dados sendo atualizados em tempo real
        </p>
      </div>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center;">
      <button id="cancelDemoBtn" style="padding: 14px 28px; border: 2px solid #e2e8f0; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4a5568; font-size: 16px;">
        ✖ Cancelar
      </button>
      <button id="confirmDemoBtn" style="padding: 14px 28px; border: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
        🧪 Inserir Dados
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // BotÃ£o cancelar
  modalContent.querySelector('#cancelDemoBtn').onclick = () => modal.remove();

  // BotÃ£o confirmar
  modalContent.querySelector('#confirmDemoBtn').onclick = () => {
    const autoRefresh = modalContent.querySelector('#autoRefreshCheck').checked;
    modal.remove();
    
    // Mostrar loading
    this.showToast('🧪 Gerando dados fake...', 'info');
    
    // Inserir dados (pequeno delay para UX)
    setTimeout(() => {
      // Ensure DemoDataGenerator insert is wrapped to default to light mode and catch quota errors
      try {
        if (window.DemoDataGenerator && typeof window.DemoDataGenerator.insertDemoData === 'function' && !window.DemoDataGenerator.__wrappedForSafety) {
          const orig = window.DemoDataGenerator.insertDemoData.bind(window.DemoDataGenerator);
          window.DemoDataGenerator.insertDemoData = function(pk, options){
            try {
              options = options || {};
              if (!options.demoMode) options.demoMode = 'light';
              return orig(pk, options);
            } catch (err) {
              if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
                console.error('[DemoData] Quota exceeded while saving', pk, err);
                alert('Limite de dados locais atingido ao inserir dados de demonstração. Limpe dados antigos do navegador ou escolha um modo de demonstração mais leve.');
                return { success: false, error: 'quota_exceeded' };
              }
              throw err;
            }
          };
          window.DemoDataGenerator.__wrappedForSafety = true;
        }
      } catch(e){ console.warn('[insertDemoData] wrapper setup failed', e); }

      const result = (window.DemoDataGenerator && typeof window.DemoDataGenerator.insertDemoData === 'function')
        ? window.DemoDataGenerator.insertDemoData(propertyKey, { demoMode: 'light', autoRefresh })
        : { success: false, error: 'no_generator' };
      
      if (result.success) {
        const autoRefreshMsg = autoRefresh ? ' (auto-refresh ativado)' : '';
        this.showToast(`✓ Dados inseridos com sucesso!${autoRefreshMsg}`, 'success');
        
        // Recarregar dashboard se estiver aberto
        if (typeof window.PropertyDashboard !== 'undefined' && window.PropertyDashboard.refresh) {
          setTimeout(() => {
            window.PropertyDashboard.refresh();
          }, 500);
        }
      } else {
        this.showToast(`❌ Erro ao inserir dados: ${result.error}`, 'error');
      }
    }, 300);
  };

  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

    console.log('[property-publish-helpers] ✓ Funções adicionadas com sucesso!');

    // Attach click delegation for property actions in the properties table
    try {
      // avoid double-binding
      if (!window.__propPublishHelpersBound) {
        window.__propPublishHelpersBound = true;
        const tbody = document.getElementById('propertiesTableBody');
        if (tbody) {
          tbody.addEventListener('click', function(ev){
            try {
              const btn = ev.target.closest('button');
              if (!btn) return;
              const txt = (btn.textContent || btn.innerText || '').trim().toLowerCase();
              const row = btn.closest('tr');
              if (!row) return;
              // Attempt to find canonical property key from data attributes or row content
              let propKey = row.dataset && (row.dataset.key || row.dataset.propertyKey || row.dataset.slug || row.dataset.id);
              if (!propKey) {
                // try to heuristically find by name/slug in row text
                const rowText = (row.textContent || '').trim();
                const list = (window.NexefiiProps && typeof window.NexefiiProps.listProperties === 'function') ? window.NexefiiProps.listProperties() : [];
                for (const p of list) {
                  if (!p) continue;
                  const matches = [p.key, p.slug, p.propertySlug, p.id, p.name].filter(Boolean).map(String);
                  if (matches.some(m => rowText.indexOf(String(m)) !== -1)) { propKey = p.key || p.slug || p.id; break; }
                }
              }

              // Normalize buttons by label
              if (txt.indexOf('implantar') !== -1 || txt.indexOf('implantar') === 0) {
                if (propKey && typeof window.masterCtrl.startDeployment === 'function') {
                  window.masterCtrl.startDeployment(propKey);
                } else {
                  console.warn('[property-publish-helpers] startDeployment not available or propKey missing', propKey);
                }
                ev.preventDefault();
                return;
              }

              if (txt.indexOf('testar') !== -1 || txt.indexOf('teste') !== -1 || txt.indexOf('test') !== -1) {
                if (propKey && typeof window.masterCtrl.testPropertyLocally === 'function') {
                  window.masterCtrl.testPropertyLocally(propKey);
                } else {
                  console.warn('[property-publish-helpers] testPropertyLocally not available or propKey missing', propKey);
                }
                ev.preventDefault();
                return;
              }

              if (txt.indexOf('publicar') !== -1 || txt.indexOf('publica') !== -1) {
                if (propKey && typeof window.masterCtrl.confirmPublishProperty === 'function') {
                  window.masterCtrl.confirmPublishProperty(propKey);
                } else {
                  console.warn('[property-publish-helpers] confirmPublishProperty not available or propKey missing', propKey);
                }
                ev.preventDefault();
                return;
              }

            } catch (e) { console.warn('[property-publish-helpers] table click handler error', e); }
          });
        }
      }
    } catch(e) { console.warn('[property-publish-helpers] attach handlers failed', e); }

    // Implement startDeployment (persist deploy config and mark property deployed)
    window.masterCtrl.startDeployment = function(propertyKey, config) {
      try {
        console.log('[startDeployment] Starting deployment for', propertyKey, config || {});
        const property = (window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function') ? window.NexefiiProps.getProperty(propertyKey) : null;
        if (!property) {
          console.warn('[startDeployment] property not found', propertyKey);
          this.showToast && this.showToast('Propriedade não encontrada!', 'error');
          return false;
        }
        // attach deploy metadata
        property._deployed = true;
        property._deployConfig = Object.assign({}, property._deployConfig || {}, config || {});
        // persist via NexefiiProps.upsertProperty if available
        try {
          if (window.NexefiiProps && typeof window.NexefiiProps.upsertProperty === 'function') {
            window.NexefiiProps.upsertProperty(Object.assign({}, property, { key: property.key || property.id || property.slug }));
          } else if (typeof localStorage !== 'undefined') {
            try { const m = JSON.parse(localStorage.getItem('nexefii_properties')||'{}'); m[property.key || property.id || property.slug] = property; localStorage.setItem('nexefii_properties', JSON.stringify(m)); } catch(e){}
          }
        } catch(e){ console.warn('[startDeployment] persist failed', e); }

        // Optionally insert demo data if DemoDataGenerator present and config requests it
        try {
          if (config && config.demoEnabled && window.DemoDataGenerator && typeof window.DemoDataGenerator.insertDemoData === 'function') {
              setTimeout(() => {
                try {
                  // ensure wrapper exists
                  try {
                    if (!window.DemoDataGenerator.__wrappedForSafety) {
                      const orig = window.DemoDataGenerator.insertDemoData.bind(window.DemoDataGenerator);
                      window.DemoDataGenerator.insertDemoData = function(pk, options){
                        try { options = options || {}; if (!options.demoMode) options.demoMode = 'light'; return orig(pk, options); } catch(err){ if (err && (err.name==='QuotaExceededError' || err.code===22)) { alert('Limite de dados locais atingido ao inserir dados de demonstração.'); return { success:false, error:'quota_exceeded' }; } throw err; }
                      };
                      window.DemoDataGenerator.__wrappedForSafety = true;
                    }
                  } catch(e){}

                  window.DemoDataGenerator.insertDemoData(propertyKey, { demoMode: 'light', autoRefresh: !!config.autoRefresh });
                } catch(e){ console.warn('[startDeployment] demo insert failed', e); }
              }, 200);
            }
        } catch(e) { /* ignore */ }

        this.showToast && this.showToast('Configuração de implantação salva', 'success');
        return true;
      } catch(e) { console.error('[startDeployment] error', e); return false; }
    };

    // Implement publishProperty (mark published and compute public URL)
    window.masterCtrl.publishProperty = function(propertyKey) {
      try {
        const property = (window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function') ? window.NexefiiProps.getProperty(propertyKey) : null;
        if (!property) { console.warn('[publishProperty] property not found', propertyKey); this.showToast && this.showToast('Propriedade não encontrada!', 'error'); return null; }
        property._published = true;
        const slug = property.slug || property.propertySlug || property.key || property.id;
        const publicUrl = slug ? (`/property/${slug}/dashboard`) : null;
        property.publicUrl = publicUrl;
        // persist
        try { if (window.NexefiiProps && typeof window.NexefiiProps.upsertProperty === 'function') window.NexefiiProps.upsertProperty(property); else { const m = JSON.parse(localStorage.getItem('nexefii_properties')||'{}'); m[property.key||property.id||property.slug]=property; localStorage.setItem('nexefii_properties', JSON.stringify(m)); } } catch(e){console.warn('[publishProperty] persist failed', e);}        
        console.log('[Publish] Property', slug, 'published at', publicUrl);
        this.showToast && this.showToast('Propriedade publicada em ' + publicUrl, 'success');
        return publicUrl;
      } catch(e) { console.error('[publishProperty] error', e); return null; }
    };
  };
  
  // Iniciar espera pelo masterCtrl
  waitForMasterCtrl();
})();

