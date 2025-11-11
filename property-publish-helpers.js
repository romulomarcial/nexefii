/**
 * FunÃ§Ãµes auxiliares para teste local e publicaÃ§Ã£o de propriedades
 * Este arquivo complementa o master-control.js com funÃ§Ãµes mais simples
 */

// Aguardar masterCtrl estar disponÃ­vel e adicionar as funÃ§Ãµes
(function() {
  console.log('[property-publish-helpers] Carregando helpers...');
  
  // FunÃ§Ã£o para esperar masterCtrl estar disponÃ­vel
  const waitForMasterCtrl = () => {
    if (window.masterCtrl) {
      console.log('[property-publish-helpers] masterCtrl encontrado, adicionando funÃ§Ãµes...');
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
  
  const property = window.IluxProps.getProperty(propertyKey);
  if (!property) {
    console.error('[testPropertyLocally] Propriedade nÃ£o encontrada:', propertyKey);
    this.showToast('Propriedade nÃ£o encontrada!', 'error');
    return;
  }

  console.log('[testPropertyLocally] Propriedade encontrada:', property);

  // Verificar se generateLocalTestHTML existe
  if (typeof generateLocalTestHTML !== 'function') {
    console.error('[testPropertyLocally] generateLocalTestHTML nÃ£o estÃ¡ disponÃ­vel!');
    console.log('[testPropertyLocally] Tipo de generateLocalTestHTML:', typeof generateLocalTestHTML);
    this.showToast('âŒ Gerador de teste nÃ£o carregado! Verifique se property-local-test-generator.js estÃ¡ carregado.', 'error');
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
    this.showToast('âœ… Teste local aberto em nova janela!', 'success');
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
    this.showToast('ðŸ“¥ Arquivo de teste baixado! Abra o arquivo HTML para testar.', 'info');
  }
};

// CONFIRMAÃ‡ÃƒO DE PUBLICAÃ‡ÃƒO
window.masterCtrl.confirmPublishProperty = function(propertyKey) {
  console.log('[confirmPublishProperty] Iniciando publicaÃ§Ã£o para:', propertyKey);
  
  const property = window.IluxProps.getProperty(propertyKey);
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
      <div style="font-size: 64px; margin-bottom: 20px;">âš ï¸</div>
      <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 28px;">Confirmar PublicaÃ§Ã£o na Web</h2>
      <p style="color: #718096; font-size: 16px; line-height: 1.6;">
        VocÃª estÃ¡ prestes a publicar a propriedade <strong>${property.name}</strong> no ambiente de produÃ§Ã£o.
      </p>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; display: flex; align-items: center; gap: 8px;">
        <span>ðŸ“‹</span> Checklist de ValidaÃ§Ã£o
      </h4>
      <div style="color: #78350f;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Testei localmente e validei todos os dados</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Todos os mÃ³dulos estÃ£o configurados corretamente</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Estou ciente que a URL <strong>https://${property.key}.nexefii.com</strong> serÃ¡ criada</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" class="publish-check" style="width: 18px; height: 18px; cursor: pointer;">
          <span>Confirmo que desejo publicar na web</span>
        </label>
      </div>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center;">
      <button id="cancelPublishBtn" style="padding: 14px 28px; border: 2px solid #e2e8f0; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4a5568; font-size: 16px;">
        âŒ Cancelar
      </button>
      <button id="confirmPublishBtn" disabled style="padding: 14px 28px; border: none; background: #cbd5e0; color: white; border-radius: 8px; font-weight: 600; cursor: not-allowed; font-size: 16px;">
        ðŸš€ Confirmar PublicaÃ§Ã£o
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
  
  const property = window.IluxProps.getProperty(propertyKey);
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
      <div style="font-size: 64px; margin-bottom: 20px;">ðŸŽ­</div>
      <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 28px;">Inserir Dados de DemonstraÃ§Ã£o</h2>
      <p style="color: #718096; font-size: 16px; line-height: 1.6;">
        Propriedade: <strong>${property.name}</strong>
      </p>
    </div>

    <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #0c4a6e; display: flex; align-items: center; gap: 8px;">
        <span>ðŸ“Š</span> Dados que serÃ£o gerados:
      </h4>
      <div style="color: #075985; line-height: 1.8;">
        âœ… Reservas (90 dias de histÃ³rico + 30 futuro)<br>
        âœ… InventÃ¡rio de quartos (${property.roomCount} quartos)<br>
        âœ… MÃ©tricas PMS (ocupaÃ§Ã£o, receita, ADR, RevPAR)<br>
        âœ… Tarefas de Housekeeping<br>
        âœ… Ordens de Engenharia<br>
        âœ… Alertas do sistema<br>
        âœ… Perfis de hÃ³spedes
      </div>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; display: flex; align-items: center; gap: 8px;">
        <span>ðŸ”„</span> AtualizaÃ§Ã£o AutomÃ¡tica
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
        âŒ Cancelar
      </button>
      <button id="confirmDemoBtn" style="padding: 14px 28px; border: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
        ðŸŽ­ Inserir Dados
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
    this.showToast('ðŸŽ­ Gerando dados fake...', 'info');
    
    // Inserir dados (pequeno delay para UX)
    setTimeout(() => {
      const result = window.DemoDataGenerator.insertDemoData(propertyKey, autoRefresh);
      
      if (result.success) {
        const autoRefreshMsg = autoRefresh ? ' (auto-refresh ativado)' : '';
        this.showToast(`âœ… Dados inseridos com sucesso!${autoRefreshMsg}`, 'success');
        
        // Recarregar dashboard se estiver aberto
        if (typeof window.PropertyDashboard !== 'undefined' && window.PropertyDashboard.refresh) {
          setTimeout(() => {
            window.PropertyDashboard.refresh();
          }, 500);
        }
      } else {
        this.showToast(`âŒ Erro ao inserir dados: ${result.error}`, 'error');
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

    console.log('[property-publish-helpers] âœ… FunÃ§Ãµes adicionadas com sucesso!');
  };
  
  // Iniciar espera pelo masterCtrl
  waitForMasterCtrl();
})();

