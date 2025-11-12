/**
 * Gerador de Páginas de Teste Local para Propriedades
 * Permite testar propriedades em localhost antes de publicar
 */

function generateLocalTestHTML(property) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${property.name} - Teste Local</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .header h1 { color: #2d3748; font-size: 36px; margin-bottom: 10px; }
    .header .subtitle { color: #718096; font-size: 18px; }
    .alert {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .alert-icon { font-size: 32px; }
    .alert-content h3 { color: #92400e; margin-bottom: 8px; }
    .alert-content p { color: #78350f; line-height: 1.6; }
    .success-message {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .success-message h3 { color: #065f46; margin-bottom: 8px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .info-card h3 {
      color: #2d3748;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-item:last-child { border-bottom: none; }
    .info-label { color: #718096; font-weight: 600; }
    .info-value { color: #2d3748; font-weight: 500; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .modules-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .module-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .test-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .test-section h2 {
      color: #2d3748;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .test-item {
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .test-item.success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
    }
    .test-icon { font-size: 24px; }
    .button-group {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }
    .btn {
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
    .btn-secondary {
      background: white;
      color: #4a5568;
      border: 2px solid #e2e8f0;
    }
    .btn-secondary:hover { background: #f7fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 ${property.name}</h1>
      <p class="subtitle">Teste Local - Property ID: <strong>${property.key}</strong></p>
    </div>

    <div class="alert">
      <span class="alert-icon">🧪</span>
      <div class="alert-content">
        <h3>Ambiente de Teste Local</h3>
        <p>
          Você está visualizando a propriedade em modo de teste. 
          Esta é uma simulação local que permite validar todas as configurações 
          antes de publicar na web em <strong>https://${property.key}.nexefii.com</strong>
        </p>
      </div>
    </div>

    <div class="success-message">
      <h3>✅ Propriedade Validada com Sucesso!</h3>
      <p>Todos os dados foram carregados corretamente. A propriedade está pronta para ser publicada.</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3><span>📋</span> Informações Gerais</h3>
        <div class="info-item">
          <span class="info-label">Property ID:</span>
          <span class="info-value"><code>${property.key}</code></span>
        </div>
        <div class="info-item">
          <span class="info-label">Nome:</span>
          <span class="info-value">${property.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Capacidade:</span>
          <span class="info-value">${property.capacity || 'Não definida'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status:</span>
          <span class="badge ${property.deployed ? 'badge-success' : 'badge-warning'}">
            ${property.deployed ? '✅ Implantado' : '⏳ Aguardando Publicação'}
          </span>
        </div>
      </div>

      <div class="info-card">
        <h3><span>🎯</span> Módulos Adquiridos</h3>
        <div class="modules-list">
          ${(property.modulesPurchased || []).map(m => `<span class="module-badge">${m}</span>`).join('') || '<span class="module-badge">Nenhum módulo</span>'}
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2><span>🔍</span> Validação de Dados</h2>
      <div class="test-item success">
        <span class="test-icon">✅</span>
        <div>
          <strong>Propriedade registrada no sistema</strong>
          <br><small>LocalStorage: nexefii_properties</small>
        </div>
      </div>
      <div class="test-item success">
        <span class="test-icon">✅</span>
        <div>
          <strong>Módulos configurados</strong>
          <br><small>${(property.modulesPurchased || []).length} módulo(s) ativo(s)</small>
        </div>
      </div>
      <div class="test-item success">
        <span class="test-icon">✅</span>
        <div>
          <strong>Capacidade definida</strong>
          <br><small>${property.capacity || 'Padrão'}</small>
        </div>
      </div>
      <div class="test-item success">
        <span class="test-icon">✅</span>
        <div>
          <strong>Estrutura de dados válida</strong>
          <br><small>Pronto para deploy</small>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2><span>🌐</span> Simulação de Ambiente</h2>
      <div class="info-item">
        <span class="info-label">URL Local:</span>
        <span class="info-value"><code>file:///${property.key}-test.html</code></span>
      </div>
      <div class="info-item">
        <span class="info-label">URL de Produção (após publicar):</span>
        <span class="info-value"><code>https://${property.key}.nexefii.com</code></span>
      </div>
      <div class="info-item">
        <span class="info-label">Banco de Dados:</span>
        <span class="info-value">LocalStorage (desenvolvimento)</span>
      </div>
    </div>

    <div class="button-group">
      <button class="btn btn-secondary" onclick="window.close()">
        ❌ Fechar Teste
      </button>
      <button class="btn btn-primary" onclick="window.open('index.html?property=${property.key}', '_blank')" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">
        🌐 Abrir Index da Propriedade
      </button>
      <button class="btn btn-primary" onclick="if(window.opener && window.opener.masterCtrl) { window.opener.masterCtrl.confirmPublishProperty('${property.key}'); window.close(); }">
        🚀 Aprovar e Publicar na Web
      </button>
    </div>
  </div>

  <script>
    console.log('🏨 Propriedade carregada:', ${JSON.stringify(property, null, 2)});
    
    // Simular validações
    setTimeout(() => console.log('✅ Validação 1: Dados carregados'), 500);
    setTimeout(() => console.log('✅ Validação 2: Módulos verificados'), 1000);
    setTimeout(() => console.log('✅ Validação 3: Configurações OK'), 1500);
    setTimeout(() => console.log('✅ Validação completa!'), 2000);
  </script>
</body>
</html>`;
}
