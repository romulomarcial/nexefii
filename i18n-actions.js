(function(){
  'use strict';

  /* Correção de duplicações e padronização de i18n — init idempotente, IDs únicos, listeners guardados */


  function safeLog() { try { console.log.apply(console, arguments); } catch(e){} }

  function downloadJSON(filename, data) {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 500);
    } catch (e) { safeLog('downloadJSON failed', e); }
  }

  function flattenKeys(obj, prefix = '') {
    const out = {};
    Object.keys(obj || {}).forEach(k => {
      const val = obj[k];
      const path = prefix ? prefix + '.' + k : k;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(out, flattenKeys(val, path));
      } else {
        out[path] = val;
      }
    });
    return out;
  }

  function unflattenToLang(flat, langObj) {
    // merge flat map into nested langObj
    Object.keys(flat).forEach(k => {
      const parts = k.split('.');
      let cur = langObj;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (i === parts.length - 1) {
          cur[p] = flat[k];
        } else {
          if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
          cur = cur[p];
        }
      }
    });
    return langObj;
  }

  function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        try { resolve(JSON.parse(r.result)); } catch(e){ reject(e); }
      };
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
  }

  // UI helpers
  function el(id) { return document.getElementById(id); }
  function q(sel, root){ return (root||document).querySelector(sel); }

  // Main wiring
  function initI18nActions() {
    if (!window.masterCtrl || !masterCtrl.i18n) {
      safeLog('[i18n-actions] masterCtrl.i18n not available yet, will retry');
      return setTimeout(initI18nActions, 500);
    }

    const i18n = masterCtrl.i18n; // expected structure: { en: {...}, pt: {...}, es: {...} }

    // Map of node ids (prefixed with `i18n-` to avoid collisions)
    // nodes.container may be created dynamically if missing to ensure the UI is isolated.
    const nodes = {
      langList: el('i18n-active-list'),
      btnAddLang: el('i18n-add-lang'),
      btnExport: el('i18n-export'),
      btnImport: el('i18n-import'),
      filter: el('i18n-filter'),
      btnNewKey: el('i18n-new-key'),
      keysBody: el('i18n-keys-body'),
      btnValidate: el('i18n-validate'),
      coveragePt: el('i18n-coverage-pt'),
      coverageEn: el('i18n-coverage-en'),
      coverageEs: el('i18n-coverage-es'),
      alerts: el('i18n-alerts'),
      container: el('tab-i18n')
    };

    // If the `#tab-i18n` container does not exist in the page, create it and append
    // it before the security footer so it participates in the tab system and remains hidden by default.
    if (!nodes.container) {
      try {
        const footer = document.getElementById('mc-footer-user') ? document.querySelector('.mc-footer-security') : null;
        const container = document.createElement('div');
        container.id = 'tab-i18n';
        container.className = 'tab-content nx-section';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Internacionalização');
        container.style.display = 'none';
        if (footer && footer.parentNode) {
          footer.parentNode.insertBefore(container, footer);
        } else {
          // fallback to append near page container
          const page = document.querySelector('.nx-page-container') || document.body;
          page.appendChild(container);
        }
        nodes.container = container;
      } catch (e) { safeLog('create tab-i18n failed', e); }
    }

    // Idempotent renderer: mounts the core i18n UI structure if not already present
    function renderInternationalizationStructure() {
      if (!nodes.container) return;
      // If already rendered, bail
      if (nodes.container.dataset.rendered === '1') return;
      // Build the required structure in specified ordered blocks
      nodes.container.innerHTML = '';

      // 1) Section header
      const header = document.createElement('div');
      header.className = 'section-header mc-section-header';
      header.innerHTML = `
        <div class="mc-breadcrumb" aria-hidden="true"><span>Admin</span> &nbsp;/&nbsp; <strong>Internacionalização</strong></div>
        <div style="display:flex; align-items:center; gap:12px;">
          <h2 class="mc-page-title" data-i18n="i18n.title">Internacionalização</h2>
          <div class="mc-title-underline" aria-hidden="true"></div>
          <button class="btn-help" data-help="help-i18n" aria-label="Ajuda">?</button>
        </div>
      `;
      nodes.container.appendChild(header);

      // 2) Languages card
      const langsCard = document.createElement('div'); langsCard.className = 'mc-card mc-i18n-languages';
      langsCard.innerHTML = `
        <div class="mc-card-header"><strong data-i18n="i18n.languages.title">Idiomas Disponíveis</strong></div>
        <div class="mc-card-body" style="display:flex; flex-direction:column; gap:10px;">
          <div id="i18n-active-list" style="display:flex; gap:8px; flex-wrap:wrap;"></div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" id="i18n-add-lang" data-i18n="i18n.languages.add">Adicionar</button>
            <button class="btn btn-outline" id="i18n-export" data-i18n="i18n.languages.export">Exportar</button>
            <button class="btn btn-outline" id="i18n-import" data-i18n="i18n.languages.import">Importar</button>
          </div>
        </div>
      `;
      nodes.container.appendChild(langsCard);

      // 3) Keys card
      const keysCard = document.createElement('div'); keysCard.className = 'mc-card mc-i18n-keys';
      keysCard.innerHTML = `
        <div class="mc-card-header"><strong data-i18n="i18n.keys.title">Chaves de Tradução</strong></div>
        <div class="mc-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
            <div>
              <label for="i18n-filter" data-i18n="i18n.keys.filter">Filtrar por idioma</label>
              <select id="i18n-filter" style="margin-left:8px;"><option value="">Todos</option></select>
            </div>
            <div>
              <button class="btn btn-primary" id="i18n-new-key" data-i18n="i18n.keys.new">Nova Chave</button>
            </div>
          </div>
          <div style="overflow:auto;">
            <table id="i18n-keys-table" style="width:100%; border-collapse:collapse;">
              <thead><tr><th style="width:30%;">Chave</th><th>PT</th><th>EN</th><th>ES</th><th>Ações</th></tr></thead>
              <tbody id="i18n-keys-body"></tbody>
            </table>
          </div>
        </div>
      `;
      nodes.container.appendChild(keysCard);

      // 4) Validation card
      const valCard = document.createElement('div'); valCard.className = 'mc-card mc-i18n-validation';
      valCard.innerHTML = `
        <div class="mc-card-header"><strong data-i18n="i18n.validation.title">Validação</strong></div>
        <div class="mc-card-body" style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; gap:12px;">
            <div><strong>PT:</strong> <span id="i18n-coverage-pt">-</span></div>
            <div><strong>EN:</strong> <span id="i18n-coverage-en">-</span></div>
            <div><strong>ES:</strong> <span id="i18n-coverage-es">-</span></div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-primary" id="i18n-validate" data-i18n="i18n.validation.validate">Validar Traduções</button>
            <div id="i18n-alerts" style="flex:1"></div>
          </div>
        </div>
      `;
      nodes.container.appendChild(valCard);

      nodes.container.dataset.rendered = '1';
    }

    // Ensure structure exists before node lookups
    renderInternationalizationStructure();

    // Refresh node references (elements were created by the renderer)
    nodes.langList = el('i18n-active-list');
    nodes.btnAddLang = el('i18n-add-lang');
    nodes.btnExport = el('i18n-export');
    nodes.btnImport = el('i18n-import');
    nodes.filter = el('i18n-filter');
    nodes.btnNewKey = el('i18n-new-key');
    nodes.keysBody = el('i18n-keys-body');
    nodes.btnValidate = el('i18n-validate');
    nodes.coveragePt = el('i18n-coverage-pt');
    nodes.coverageEn = el('i18n-coverage-en');
    nodes.coverageEs = el('i18n-coverage-es');
    nodes.alerts = el('i18n-alerts');

    function getLanguages() {
      try { return Object.keys(masterCtrl.i18n || {}); } catch(e){ return []; }
    }

    function renderLanguages() {
      if (!nodes.langList) return;
      nodes.langList.innerHTML = '';
      getLanguages().forEach(code => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-chip';
        btn.textContent = code.toUpperCase();
        btn.setAttribute('data-lang', code);
        // guard attach
        const onClick = () => { if (nodes.filter) nodes.filter.value = code; populateI18nKeysTable(); };
        if (window.addBoundListener) window.addBoundListener(btn, 'click', onClick); else if (!btn.dataset.bound) { btn.addEventListener('click', onClick); btn.dataset.bound = '1'; }
        nodes.langList.appendChild(btn);
      });
      // populate filter select
      try {
        if (nodes.filter) {
          nodes.filter.innerHTML = '<option value="">Todos</option>' + getLanguages().map(l => '<option value="'+l+'">'+l.toUpperCase()+'</option>').join('');
        }
      } catch(e) { safeLog('populate filter failed', e); }
    }

    function populateI18nKeysTable() {
      if (!nodes.keysBody) return;
      const langFilter = nodes.filter && nodes.filter.value ? nodes.filter.value : null;

      // Build union of keys across languages
      const allLangs = getLanguages();
      const flatByLang = {};
      allLangs.forEach(l => flatByLang[l] = flattenKeys(masterCtrl.i18n[l] || {}));

      const allKeys = new Set();
      Object.values(flatByLang).forEach(f => Object.keys(f).forEach(k => allKeys.add(k)));
      const keys = Array.from(allKeys).sort();

      nodes.keysBody.innerHTML = '';

      keys.forEach(key => {
        if (langFilter && !allLangs.includes(langFilter)) return; // guard
        const tr = document.createElement('tr');
        const tdKey = document.createElement('td'); tdKey.textContent = key; tdKey.style.width = '40%';
        tr.appendChild(tdKey);

        allLangs.forEach(l => {
          const td = document.createElement('td');
          td.style.width = `${60 / allLangs.length}%`;
          const val = flatByLang[l] && (flatByLang[l][key] !== undefined) ? flatByLang[l][key] : '';
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.value = val;
          inp.style.width = '100%';
          inp.dataset.lang = l;
          inp.dataset.key = key;
          const onInpChange = (evt) => {
            try {
              const newVal = evt.target.value;
              // update in-memory structure
              const flat = {};
              flat[key] = newVal;
              masterCtrl.i18n[l] = unflattenToLang(flat, masterCtrl.i18n[l] || {});
              // persist to localStorage override namespace to avoid altering server sources
              try {
                const storageKey = 'master_i18n_overrides_' + l;
                const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
                existing[key] = newVal;
                localStorage.setItem(storageKey, JSON.stringify(existing));
                showToast('Tradução salva localmente (override)', 'success');
              } catch(e){ safeLog('persist i18n override failed', e); showToast('Falha ao salvar override', 'error'); }
            } catch(e) { safeLog('input change err', e); }
          };
          if (window.addBoundListener) window.addBoundListener(inp, 'change', onInpChange); else if (!inp.dataset.bound) { inp.addEventListener('change', onInpChange); inp.dataset.bound = '1'; }
          td.appendChild(inp);
          tr.appendChild(td);
        });

        // actions cell (edit/delete)
        const tdAct = document.createElement('td');
        tdAct.style.whiteSpace = 'nowrap';
        const btnDel = document.createElement('button'); btnDel.className='btn btn-sm btn-danger'; btnDel.textContent='Remover';
        const onDel = () => {
          if (!confirm('Remover chave "' + key + '" das traduções locais?')) return;
          getLanguages().forEach(l => {
            try {
              const storageKey = 'master_i18n_overrides_' + l;
              const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
              delete existing[key];
              localStorage.setItem(storageKey, JSON.stringify(existing));
              // also remove from in-memory masterCtrl.i18n if present
              const flat = flattenKeys(masterCtrl.i18n[l] || {});
              delete flat[key];
              masterCtrl.i18n[l] = unflattenToLang(flat, {});
            } catch(e){ safeLog('delete override failed', e); }
          });
          populateI18nKeysTable();
          showToast('Chave removida localmente', 'success');
        };
        if (window.addBoundListener) window.addBoundListener(btnDel, 'click', onDel); else if (!btnDel.dataset.bound) { btnDel.addEventListener('click', onDel); btnDel.dataset.bound = '1'; }
        tdAct.appendChild(btnDel);
        tr.appendChild(tdAct);

        nodes.keysBody.appendChild(tr);
      });
    }

    function showToast(msg, type) {
      try { if (window.masterCtrl && typeof masterCtrl.showToast === 'function') masterCtrl.showToast(msg, type); else alert(msg); } catch(e){ try{ alert(msg); }catch(e){} }
    }

    function exportTranslations() {
      const bundle = {};
      getLanguages().forEach(l => bundle[l] = masterCtrl.i18n[l] || {});
      downloadJSON('translations-export-' + Date.now() + '.json', bundle);
    }

    function importTranslations() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', async (evt) => {
        const f = evt.target.files && evt.target.files[0];
        if (!f) return;
        try {
          const data = await readFileAsJson(f);
          // Expecting { en: {...}, pt: {...} }
          if (typeof data !== 'object') { showToast('Arquivo inválido', 'error'); return; }
          if (!confirm('Importar e mesclar traduções do arquivo? Isso cria overrides locais.')) return;
          Object.keys(data).forEach(lang => {
            // merge flat into existing
            masterCtrl.i18n[lang] = Object.assign({}, masterCtrl.i18n[lang] || {}, data[lang]);
            // persist entire language as override (safe approach)
            try { localStorage.setItem('master_i18n_overrides_' + lang, JSON.stringify(flattenKeys(data[lang]))); } catch(e){ safeLog('persist overrides import', e); }
          });
          renderLanguages();
          populateI18nKeysTable();
          showToast('Traduções importadas localmente', 'success');
        } catch(e) { safeLog('import error', e); showToast('Erro ao importar: ' + e.message, 'error'); }
      });
      input.click();
    }

    function addLanguage() {
      const code = prompt('Digite o código do idioma (ex: pt, en, es):');
      if (!code) return;
      const c = code.trim().toLowerCase();
      if (!c) return;
      if (masterCtrl.i18n[c]) { showToast('Idioma já existe', 'warning'); return; }
      masterCtrl.i18n[c] = {};
      try { localStorage.setItem('master_i18n_overrides_' + c, JSON.stringify({})); } catch(e){}
      renderLanguages();
      populateI18nKeysTable();
      showToast('Idioma adicionado (local)', 'success');
    }

    function newI18nKey() {
      const key = prompt('Chave (use ponto para namespaces), ex: app.title');
      if (!key) return;
      const defaultVal = prompt('Valor padrão para o idioma padrão (deixe em branco para vazio):', '');
      // add to all languages as blank or default for current
      getLanguages().forEach(l => {
        try {
          const flat = {};
          flat[key] = l === getLanguages()[0] ? (defaultVal || '') : '';
          masterCtrl.i18n[l] = unflattenToLang(flat, masterCtrl.i18n[l] || {});
        } catch(e){ safeLog('new key add', e); }
      });
      populateI18nKeysTable();
      showToast('Chave criada localmente', 'success');
    }

    function validateTranslations() {
      const langs = getLanguages();
      const flatByLang = {};
      langs.forEach(l => flatByLang[l] = flattenKeys(masterCtrl.i18n[l] || {}));
      const allKeys = new Set();
      Object.values(flatByLang).forEach(f => Object.keys(f).forEach(k => allKeys.add(k)));
      const total = allKeys.size || 1;
      langs.forEach(l => {
        const count = Object.keys(flatByLang[l] || {}).length;
        const pct = Math.round((count / total) * 100);
        const el = nodes['coverage' + l.charAt(0).toUpperCase() + l.slice(1)];
        if (el) el.textContent = pct + '%';
      });

      // produce alerts for missing keys per language
      const alerts = [];
      allKeys.forEach(k => {
        langs.forEach(l => {
          if (!flatByLang[l] || flatByLang[l][k] === undefined || flatByLang[l][k] === '') {
            alerts.push({ key: k, lang: l });
          }
        });
      });
      if (nodes.alerts) {
        nodes.alerts.innerHTML = '';
        if (alerts.length === 0) {
          nodes.alerts.innerHTML = '<div class="mc-alert mc-alert-success">Todas as traduções presentes</div>';
        } else {
          const map = {};
          alerts.forEach(a => { map[a.lang] = map[a.lang] || []; map[a.lang].push(a.key); });
          Object.keys(map).forEach(lang => {
            const d = document.createElement('div');
            d.className = 'mc-alert mc-alert-warning';
            d.innerHTML = '<strong>' + lang.toUpperCase() + '</strong>: ' + map[lang].slice(0,10).join(', ') + (map[lang].length>10 ? '...':'');
            nodes.alerts.appendChild(d);
          });
        }
      }
    }

    // Wire UI buttons (guarded bind to avoid duplicates)
    try {
      if (nodes.btnExport) { if (window.addBoundListener) window.addBoundListener(nodes.btnExport, 'click', exportTranslations); else if (!nodes.btnExport.dataset.bound) { nodes.btnExport.addEventListener('click', exportTranslations); nodes.btnExport.dataset.bound = '1'; } }
      if (nodes.btnImport) { if (window.addBoundListener) window.addBoundListener(nodes.btnImport, 'click', importTranslations); else if (!nodes.btnImport.dataset.bound) { nodes.btnImport.addEventListener('click', importTranslations); nodes.btnImport.dataset.bound = '1'; } }
      if (nodes.btnAddLang) { if (window.addBoundListener) window.addBoundListener(nodes.btnAddLang, 'click', addLanguage); else if (!nodes.btnAddLang.dataset.bound) { nodes.btnAddLang.addEventListener('click', addLanguage); nodes.btnAddLang.dataset.bound = '1'; } }
      if (nodes.btnNewKey) { if (window.addBoundListener) window.addBoundListener(nodes.btnNewKey, 'click', newI18nKey); else if (!nodes.btnNewKey.dataset.bound) { nodes.btnNewKey.addEventListener('click', newI18nKey); nodes.btnNewKey.dataset.bound = '1'; } }
      if (nodes.btnValidate) { if (window.addBoundListener) window.addBoundListener(nodes.btnValidate, 'click', validateTranslations); else if (!nodes.btnValidate.dataset.bound) { nodes.btnValidate.addEventListener('click', validateTranslations); nodes.btnValidate.dataset.bound = '1'; } }
      if (nodes.filter) { if (window.addBoundListener) window.addBoundListener(nodes.filter, 'change', populateI18nKeysTable); else if (!nodes.filter.dataset.bound) { nodes.filter.addEventListener('change', populateI18nKeysTable); nodes.filter.dataset.bound = '1'; } }
    } catch(e){ safeLog('wire ui', e); }

    renderLanguages();
    populateI18nKeysTable();
    validateTranslations();

    // expose render function for idempotent re-renders
    if (nodes.container) nodes.container.renderInternationalization = function(){ renderLanguages(); populateI18nKeysTable(); validateTranslations(); };

    safeLog('[i18n-actions] initialized');
    // Expose a guarded public API so other scripts (e.g., master-control.js) can call actions
    try {
      window.i18nActions = window.i18nActions || { _queue: [], ready: false };
      window.i18nActions.exportTranslations = exportTranslations;
      window.i18nActions.importTranslations = importTranslations;
      window.i18nActions.addLanguage = addLanguage;
      window.i18nActions.newKey = newI18nKey;
      window.i18nActions.validate = validateTranslations;
      window.i18nActions.render = function(){ if (nodes.container && nodes.container.renderInternationalization) nodes.container.renderInternationalization(); };
      window.i18nActions.ready = true;
      // flush queued calls
      if (window.i18nActions._queue && Array.isArray(window.i18nActions._queue)) {
        window.i18nActions._queue.forEach(item => { try { if (typeof window.i18nActions[item.name] === 'function') window.i18nActions[item.name].apply(null, item.args || []); } catch(e){} });
        window.i18nActions._queue = [];
      }
    } catch(e){ safeLog('expose i18nActions failed', e); }
  }

  // Wait for masterCtrl to be ready (compat with other scripts)
  function waitForMasterCtrlAndInit() {
    if (window.masterCtrl && masterCtrl.i18n) {
      initI18nActions();
    } else {
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(waitForMasterCtrlAndInit, 200); });
      setTimeout(waitForMasterCtrlAndInit, 300);
    }
  }

  // small CSS to make inputs and table tidy if not already present
  (function injectSmallStyles(){
    try {
      const s = document.createElement('style');
      s.textContent = `
        #i18nKeysTable input { padding:6px; border:1px solid #ddd; border-radius:4px; }
        #i18nKeysTable td { vertical-align: middle; }
        .btn-chip { margin: 2px; padding: 6px 8px; border-radius: 999px; border: 1px solid #ddd; background: #f7f7f7; }
        .mc-alert { padding:8px; border-radius:6px; margin:6px 0; }
        .mc-alert-warning { background:#fff4e5; border:1px solid #ffd8a8; }
        .mc-alert-success { background:#ecfdf5; border:1px solid #bbf7d0; }
      `;
      document.head.appendChild(s);
    } catch(e){}
  })();

  // start
  waitForMasterCtrlAndInit();

  // Visibility observer: render the i18n UI only when its tab container becomes visible.
  (function observeI18nTabVisibility(){
    try {
      var attempts = 0;
      var maxAttempts = 200; // ~40s
      var t = setInterval(function(){
        attempts++;
        var c = document.getElementById('tab-i18n');
        if (!c) return;
        var visible = (c.offsetParent !== null) || (c.style.display && c.style.display !== 'none') || c.classList.contains('active');
        if (visible) {
          try { if (window.i18nActions && typeof window.i18nActions.render === 'function') window.i18nActions.render(); } catch(e){}
          clearInterval(t);
          return;
        }
        if (attempts > maxAttempts) clearInterval(t);
      }, 200);
    } catch(e) { safeLog('observeI18nTabVisibility failed', e); }
  })();

})();


