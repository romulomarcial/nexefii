/**
 * QA Baseline Capture System
 * Captura screenshots, computed styles, e estado funcional
 * antes de refatoração arquitetural
 * 
 * @version 1.0.0
 * @date 2025-11-08
 */

class QABaselineCapture {
  constructor() {
    this.baseline = {
      metadata: {
        capturedAt: new Date().toISOString(),
        version: '1.0.0',
        system: 'IluxSys',
        purpose: 'Pre-refactor baseline for architectural transformation'
      },
      pages: [],
      components: [],
      interactions: [],
      localStorage: {},
      screenshots: []
    };
  }

  /**
   * Inicia captura completa do baseline
   */
  async captureFullBaseline() {
    console.log('🎯 Iniciando captura de QA Baseline...');
    
    try {
      // 1. Capturar estado do LocalStorage
      this.captureLocalStorageState();
      
      // 2. Capturar página atual
      await this.captureCurrentPage();
      
      // 3. Capturar computed styles de componentes críticos
      this.captureComponentStyles();
      
      // 4. Capturar interações funcionais
      this.captureFunctionalInteractions();
      
      // 5. Gerar relatório
      const report = this.generateReport();
      
      console.log('✅ Baseline capturado com sucesso!');
      return report;
      
    } catch (error) {
      console.error('❌ Erro ao capturar baseline:', error);
      throw error;
    }
  }

  /**
   * Captura estado completo do LocalStorage
   */
  captureLocalStorageState() {
    console.log('📦 Capturando estado do LocalStorage...');
    
    const state = {};
    const keysToCapture = [
      'iluxsys_users',
      'iluxsys_session',
      'currentUser',
      'master_backups',
      'master_versions',
      'master_logs',
      'master_settings',
      'enterprise_tenant_backups',
      'enterprise_general_backups',
      'enterprise_metrics',
      'i18n_locale',
      'cached_i18n'
    ];
    
    keysToCapture.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          state[key] = JSON.parse(value);
        } catch {
          state[key] = value; // String literal
        }
      }
    });
    
    // Capturar contadores de itens
    state._statistics = {
      totalKeys: localStorage.length,
      usersCount: state.iluxsys_users ? state.iluxsys_users.length : 0,
      backupsCount: state.master_backups ? state.master_backups.length : 0,
      propertiesCount: window.IluxProps ? window.IluxProps.listProperties().length : 0
    };
    
    this.baseline.localStorage = state;
    console.log(`✅ Capturados ${Object.keys(state).length} chaves do LocalStorage`);
  }

  /**
   * Captura informações da página atual
   */
  async captureCurrentPage() {
    console.log('📄 Capturando página atual...');
    
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      bodyClasses: Array.from(document.body.classList),
      metaTags: this.captureMetaTags(),
      structure: this.capturePageStructure()
    };
    
    // Tentar capturar screenshot (via html2canvas se disponível)
    if (typeof html2canvas !== 'undefined') {
      try {
        const canvas = await html2canvas(document.body);
        pageInfo.screenshot = canvas.toDataURL('image/png');
        console.log('📸 Screenshot capturado!');
      } catch (err) {
        console.warn('⚠️ Não foi possível capturar screenshot:', err);
        pageInfo.screenshot = null;
      }
    } else {
      pageInfo.screenshot = null;
      console.log('ℹ️ html2canvas não disponível - screenshots manuais necessários');
    }
    
    this.baseline.pages.push(pageInfo);
    console.log(`✅ Página capturada: ${pageInfo.title}`);
  }

  /**
   * Captura meta tags da página
   */
  captureMetaTags() {
    const metaTags = {};
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });
    return metaTags;
  }

  /**
   * Captura estrutura da página (componentes principais)
   */
  capturePageStructure() {
    const structure = {
      tabs: [],
      modals: [],
      tables: [],
      forms: [],
      buttons: []
    };
    
    // Tabs
    document.querySelectorAll('.tab-btn, [role="tab"]').forEach(tab => {
      structure.tabs.push({
        id: tab.id,
        text: tab.textContent.trim(),
        classes: Array.from(tab.classList),
        dataTarget: tab.getAttribute('data-tab') || tab.getAttribute('aria-controls')
      });
    });
    
    // Modals
    document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
      structure.modals.push({
        id: modal.id,
        classes: Array.from(modal.classList),
        title: modal.querySelector('.modal-title, h2, h3')?.textContent.trim()
      });
    });
    
    // Tables
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
      structure.tables.push({
        id: table.id,
        headers: headers,
        rowCount: table.querySelectorAll('tbody tr').length
      });
    });
    
    // Forms
    document.querySelectorAll('form').forEach(form => {
      const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
        name: input.name,
        type: input.type,
        id: input.id,
        required: input.required
      }));
      structure.forms.push({
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: inputs
      });
    });
    
    // Buttons importantes
    document.querySelectorAll('.btn, button').forEach(btn => {
      if (btn.textContent.trim()) {
        structure.buttons.push({
          id: btn.id,
          text: btn.textContent.trim(),
          classes: Array.from(btn.classList),
          onclick: btn.onclick ? 'function' : null
        });
      }
    });
    
    return structure;
  }

  /**
   * Captura computed styles de componentes críticos
   */
  captureComponentStyles() {
    console.log('🎨 Capturando computed styles...');
    
    const selectors = [
      '.tab-btn',
      '.tab-btn.active',
      '.tab-content',
      '.card',
      '.btn',
      '.btn-primary',
      '.btn-success',
      '.btn-danger',
      '.modal',
      '.modal-overlay',
      'table',
      'th',
      'td',
      '.stat-card',
      '.metric-item',
      'input',
      'select',
      'textarea'
    ];
    
    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const computed = window.getComputedStyle(element);
        const styles = {
          selector: selector,
          display: computed.display,
          position: computed.position,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          padding: computed.padding,
          margin: computed.margin,
          border: computed.border,
          borderRadius: computed.borderRadius,
          width: computed.width,
          height: computed.height,
          boxShadow: computed.boxShadow,
          transition: computed.transition,
          opacity: computed.opacity,
          zIndex: computed.zIndex
        };
        
        this.baseline.components.push(styles);
      }
    });
    
    console.log(`✅ Capturados computed styles de ${this.baseline.components.length} componentes`);
  }

  /**
   * Captura funcionalidades e interações disponíveis
   */
  captureFunctionalInteractions() {
    console.log('⚙️ Capturando funcionalidades...');
    
    const interactions = [];
    
    // Master Control features
    if (typeof MasterControl !== 'undefined') {
      interactions.push({
        feature: 'Master Control Panel',
        available: true,
        functions: Object.getOwnPropertyNames(MasterControl.prototype).filter(f => 
          typeof MasterControl.prototype[f] === 'function' && !f.startsWith('_')
        )
      });
    }
    
    // Enterprise Backup features
    if (typeof EnterpriseBackupSystem !== 'undefined') {
      interactions.push({
        feature: 'Enterprise Backup System',
        available: true,
        functions: Object.getOwnPropertyNames(EnterpriseBackupSystem.prototype).filter(f => 
          typeof EnterpriseBackupSystem.prototype[f] === 'function' && !f.startsWith('_')
        )
      });
    }
    
    // Property management
    if (typeof window.IluxProps !== 'undefined') {
      const props = window.IluxProps.listProperties();
      interactions.push({
        feature: 'Property Management',
        available: true,
        propertiesCount: props.length,
        properties: props.map(p => ({
          key: p.key,
          name: p.name,
          modulesCount: p.modulesPurchased ? p.modulesPurchased.length : 0
        }))
      });
    }
    
    // User management
    const users = JSON.parse(localStorage.getItem('iluxsys_users') || '[]');
    interactions.push({
      feature: 'User Management',
      available: true,
      usersCount: users.length,
      roles: [...new Set(users.map(u => u.role))]
    });
    
    // Backup system
    const backups = JSON.parse(localStorage.getItem('master_backups') || '[]');
    interactions.push({
      feature: 'Backup & Restore',
      available: true,
      backupsCount: backups.length,
      types: [...new Set(backups.map(b => b.type))]
    });
    
    // i18n
    const locale = localStorage.getItem('i18n_locale') || 'pt';
    interactions.push({
      feature: 'Internationalization',
      available: true,
      currentLocale: locale,
      supportedLocales: ['pt', 'en', 'es']
    });
    
    this.baseline.interactions = interactions;
    console.log(`✅ Capturadas ${interactions.length} funcionalidades`);
  }

  /**
   * Gera relatório HTML/JSON do baseline
   */
  generateReport() {
    console.log('📊 Gerando relatório...');
    
    const report = {
      ...this.baseline,
      summary: {
        totalPages: this.baseline.pages.length,
        totalComponents: this.baseline.components.length,
        totalInteractions: this.baseline.interactions.length,
        localStorageKeys: Object.keys(this.baseline.localStorage).length,
        capturedAt: this.baseline.metadata.capturedAt
      }
    };
    
    // Salvar no localStorage
    localStorage.setItem('qa_baseline_report', JSON.stringify(report));
    console.log('✅ Relatório salvo no localStorage (chave: qa_baseline_report)');
    
    return report;
  }

  /**
   * Exporta relatório como JSON para download
   */
  exportReport() {
    const report = JSON.parse(localStorage.getItem('qa_baseline_report'));
    if (!report) {
      alert('Nenhum relatório encontrado. Execute captureFullBaseline() primeiro.');
      return;
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-baseline-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Relatório exportado!');
  }

  /**
   * Gera relatório HTML visual
   */
  generateHTMLReport() {
    const report = JSON.parse(localStorage.getItem('qa_baseline_report'));
    if (!report) {
      alert('Nenhum relatório encontrado. Execute captureFullBaseline() primeiro.');
      return '';
    }
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Baseline Report - IluxSys</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    h3 { color: #7f8c8d; margin-top: 20px; margin-bottom: 10px; }
    .metadata { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .metadata p { margin: 5px 0; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card h3 { color: white; margin: 0; }
    .stat-card .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #3498db; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", monospace; }
    pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .screenshot { max-width: 100%; border: 2px solid #ddd; border-radius: 5px; margin: 10px 0; }
    .component { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #3498db; }
    .feature { background: #e8f5e9; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .feature h4 { color: #2e7d32; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 QA Baseline Report</h1>
    <div class="metadata">
      <p><strong>System:</strong> ${report.metadata.system}</p>
      <p><strong>Version:</strong> ${report.metadata.version}</p>
      <p><strong>Captured:</strong> ${new Date(report.metadata.capturedAt).toLocaleString('pt-BR')}</p>
      <p><strong>Purpose:</strong> ${report.metadata.purpose}</p>
    </div>

    <h2>📊 Summary</h2>
    <div class="summary">
      <div class="stat-card">
        <h3>Pages</h3>
        <div class="value">${report.summary.totalPages}</div>
      </div>
      <div class="stat-card">
        <h3>Components</h3>
        <div class="value">${report.summary.totalComponents}</div>
      </div>
      <div class="stat-card">
        <h3>Features</h3>
        <div class="value">${report.summary.totalInteractions}</div>
      </div>
      <div class="stat-card">
        <h3>Storage Keys</h3>
        <div class="value">${report.summary.localStorageKeys}</div>
      </div>
    </div>

    <h2>📄 Pages Captured</h2>
    ${report.pages.map(page => `
      <div class="component">
        <h3>${page.title}</h3>
        <p><strong>URL:</strong> <code>${page.url}</code></p>
        <p><strong>Viewport:</strong> ${page.viewport.width}x${page.viewport.height}</p>
        <p><strong>Tabs:</strong> ${page.structure.tabs.length} | 
           <strong>Modals:</strong> ${page.structure.modals.length} | 
           <strong>Tables:</strong> ${page.structure.tables.length} | 
           <strong>Forms:</strong> ${page.structure.forms.length} | 
           <strong>Buttons:</strong> ${page.structure.buttons.length}</p>
        ${page.screenshot ? `<img src="${page.screenshot}" class="screenshot" alt="Screenshot">` : '<p><em>Screenshot não disponível</em></p>'}
      </div>
    `).join('')}

    <h2>⚙️ Functional Features</h2>
    ${report.interactions.map(feature => `
      <div class="feature">
        <h4>✅ ${feature.feature}</h4>
        ${feature.functions ? `<p><strong>Functions:</strong> ${feature.functions.length}</p>` : ''}
        ${feature.propertiesCount !== undefined ? `<p><strong>Properties:</strong> ${feature.propertiesCount}</p>` : ''}
        ${feature.usersCount !== undefined ? `<p><strong>Users:</strong> ${feature.usersCount}</p>` : ''}
        ${feature.backupsCount !== undefined ? `<p><strong>Backups:</strong> ${feature.backupsCount}</p>` : ''}
        ${feature.currentLocale ? `<p><strong>Locale:</strong> ${feature.currentLocale}</p>` : ''}
      </div>
    `).join('')}

    <h2>📦 LocalStorage State</h2>
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Type</th>
          <th>Value Preview</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(report.localStorage).filter(([k]) => !k.startsWith('_')).map(([key, value]) => `
          <tr>
            <td><code>${key}</code></td>
            <td>${Array.isArray(value) ? 'Array' : typeof value}</td>
            <td>${Array.isArray(value) ? `${value.length} items` : typeof value === 'object' ? 'Object' : String(value).substring(0, 50)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🎨 Component Styles</h2>
    <p>Captured computed styles for ${report.components.length} component types.</p>
    <details>
      <summary>View Component Styles</summary>
      <pre>${JSON.stringify(report.components, null, 2)}</pre>
    </details>

    <h2>📋 Acceptance Criteria</h2>
    <div class="feature">
      <h4>✅ Visual Validation</h4>
      <ul>
        <li>All screenshots match current state</li>
        <li>Computed styles are identical</li>
        <li>Layout and positioning preserved</li>
      </ul>
    </div>
    <div class="feature">
      <h4>✅ Functional Validation</h4>
      <ul>
        <li>All features remain available</li>
        <li>User management works correctly</li>
        <li>Backup/restore functional</li>
        <li>Property management intact</li>
        <li>i18n working properly</li>
      </ul>
    </div>
    <div class="feature">
      <h4>✅ Data Validation</h4>
      <ul>
        <li>LocalStorage structure unchanged</li>
        <li>All data accessible</li>
        <li>No data loss</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `;
    
    return html;
  }

  /**
   * Exporta relatório HTML para download
   */
  exportHTMLReport() {
    const html = this.generateHTMLReport();
    if (!html) return;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-baseline-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Relatório HTML exportado!');
  }
}

// Instância global
window.qaBaseline = new QABaselineCapture();

// Instruções de uso
console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 🎯 QA Baseline Capture System                  ║
╚════════════════════════════════════════════════════════════════╝

📋 Como usar:

1. Capturar baseline completo:
   await qaBaseline.captureFullBaseline()

2. Exportar relatório JSON:
   qaBaseline.exportReport()

3. Exportar relatório HTML:
   qaBaseline.exportHTMLReport()

4. Ver relatório no console:
   JSON.parse(localStorage.getItem('qa_baseline_report'))

⚠️ IMPORTANTE:
- Execute na página master-control.html
- Capture em diferentes tabs/estados
- Faça screenshots manuais se necessário
- Guarde os relatórios antes de refatorar!

✅ Após captura, prosseguir para implementação da arquitetura.
`);
