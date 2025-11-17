(function(global){
	'use strict';

	function $id(id){ return global.document.getElementById(id); }

	function ensureMaster(){
		try {
			if (global.SessionContext && typeof global.SessionContext.isMasterUser === 'function') {
				if (!global.SessionContext.isMasterUser()) {
					global.location.href = '/pages/property-dashboard.html';
					return false;
				}
			}
		} catch (e) {}
		return true;
	}

	function getProperties(){
		let props = [];
		try {
			if (global.NexefiiProps && typeof global.NexefiiProps.listProperties === 'function') {
				props = global.NexefiiProps.listProperties() || [];
			} else {
				const raw = global.localStorage.getItem('nexefii_properties') || '{}';
				const obj = JSON.parse(raw);
				props = Object.keys(obj).map(function(k){ return obj[k]; });
			}
		} catch (e) { props = []; }
		if (!Array.isArray(props)) props = [];
		return props;
	}

	function populateProps(){
		const sel = $id('int_prop_select');
		if (!sel) return;

		sel.innerHTML = '';
		const props = getProperties();

		if (!props.length){
			sel.innerHTML = '<option value="">-- Nenhuma propriedade --</option>';
			return;
		}

		var opt = global.document.createElement('option');
		opt.value = '';
		opt.textContent = '-- Selecione --';
		sel.appendChild(opt);

		props.forEach(function(p){
			var o = global.document.createElement('option');
			o.value = p.id || p.key || p.slug;
			o.textContent = p.name || p.slug || o.value;
			sel.appendChild(o);
		});
	}

	function renderListFor(propertyId){
		const area = $id('int_list_area');
		if (!area) return;

		area.innerHTML = '';
		if (!propertyId){
			area.innerHTML = '<div style="color:#666">Selecione uma propriedade</div>';
			return;
		}

		const ints = (global.IntegrationModel && typeof global.IntegrationModel.getIntegrationsForProperty === 'function')
			? (global.IntegrationModel.getIntegrationsForProperty(propertyId) || [])
			: [];

		if (!ints.length){
			area.innerHTML = '<div style="color:#666">Nenhuma integração configurada para esta propriedade.</div>';
			return;
		}

		ints.forEach(function(i){
			var card = global.document.createElement('div');
			card.className = 'int-card';
			card.style.border = '1px solid #e5e7eb';
			card.style.borderRadius = '8px';
			card.style.padding = '10px';
			card.style.marginTop = '8px';

			var header = global.document.createElement('div');
			header.innerHTML = '<strong>' + (i.module || 'Módulo') + '</strong> — ' +
												 (i.provider || '') + ' (' + (i.environment || '') + ')';
			card.appendChild(header);

			var meta = global.document.createElement('div');
			meta.style.fontSize = '12px';
			meta.style.color = '#64748b';
			meta.textContent = i.apiBaseUrl || '';
			card.appendChild(meta);

			var status = global.document.createElement('div');
			status.style.marginTop = '6px';
			status.innerHTML =
				'Status: ' +
				(i.enabled ? '<span style="color:green">Ativo</span>' : '<span style="color:#999">Desativado</span>') +
				' | Última sincronização: ' + (i.lastSyncStatus || 'N/A');
			card.appendChild(status);

			var actions = global.document.createElement('div');
			actions.style.marginTop = '8px';

			var btnEdit = global.document.createElement('button');
			btnEdit.className = 'btn';
			btnEdit.textContent = 'Editar';
			btnEdit.addEventListener('click', function(){
				openForm(i.propertyId || propertyId, i);
			});
			actions.appendChild(btnEdit);

			var btnToggle = global.document.createElement('button');
			btnToggle.className = 'btn';
			btnToggle.style.marginLeft = '6px';
			btnToggle.textContent = i.enabled ? 'Desativar' : 'Ativar';
			btnToggle.addEventListener('click', function(){
				toggleEnabled(i.propertyId || propertyId, i.id);
			});
			actions.appendChild(btnToggle);

			var btnDel = global.document.createElement('button');
			btnDel.className = 'btn';
			btnDel.style.marginLeft = '6px';
			btnDel.textContent = 'Remover';
			btnDel.addEventListener('click', function(){
				if (global.confirm('Remover integração?')) {
					if (global.IntegrationModel && typeof global.IntegrationModel.deleteIntegration === 'function') {
						global.IntegrationModel.deleteIntegration(i.propertyId || propertyId, i.id);
					}
					renderListFor(propertyId);
				}
			});
			actions.appendChild(btnDel);

			card.appendChild(actions);
			area.appendChild(card);
		});
	}

	function openForm(propertyId, existing){
		const modal = $id('int_form');
		if (!modal) return;

		modal.style.display = 'block';

		const psel = $id('int_form_prop');
		psel.innerHTML = '';

		const props = getProperties();
		props.forEach(function(p){
			var o = global.document.createElement('option');
			o.value = p.id || p.key || p.slug;
			o.textContent = p.name || p.slug || o.value;
			psel.appendChild(o);
		});

		if (propertyId) psel.value = propertyId;

		$id('int_form_module').value   = existing && existing.module      ? existing.module      : 'PMS';
		$id('int_form_provider').value = existing && existing.provider    ? existing.provider    : '';
		$id('int_form_env').value      = existing && existing.environment ? existing.environment : 'sandbox';
		$id('int_form_apiBase').value  = existing && existing.apiBaseUrl  ? existing.apiBaseUrl  : '';
		$id('int_form_apiKey').value   = existing && existing.apiKey      ? existing.apiKey      : '';
		$id('int_form_id').value       = existing && existing.id          ? existing.id          : '';
	}

	function closeForm(){
		const modal = $id('int_form');
		if (modal) modal.style.display = 'none';
	}

	function saveForm(){
		const id         = $id('int_form_id').value;
		const propertyId = $id('int_form_prop').value;
		const module     = $id('int_form_module').value;
		const provider   = $id('int_form_provider').value;
		const env        = $id('int_form_env').value;
		const apiBase    = $id('int_form_apiBase').value;
		const apiKey     = $id('int_form_apiKey').value;

		if (!propertyId || !module || !provider){
			global.alert('Preencha pelo menos propriedade, módulo e provider');
			return;
		}

		const obj = {
			id: id || undefined,
			module: module,
			provider: provider,
			environment: env,
			apiBaseUrl: apiBase,
			apiKey: apiKey,
			enabled: true,
			mappings: {}
		};

		if (global.IntegrationModel && typeof global.IntegrationModel.upsertIntegration === 'function'){
			global.IntegrationModel.upsertIntegration(propertyId, obj);
		}

		closeForm();
		renderListFor(propertyId);
	}

	function toggleEnabled(propertyId, integrationId){
		if (!global.IntegrationModel || typeof global.IntegrationModel.getIntegrationsForProperty !== 'function') return;

		const ints = global.IntegrationModel.getIntegrationsForProperty(propertyId) || [];
		const target = ints.find(function(i){ return i.id === integrationId; });
		if (!target) return;

		target.enabled = !target.enabled;
		if (!target.enabled) target.lastSyncStatus = 'DISABLED';

		if (typeof global.IntegrationModel.upsertIntegration === 'function'){
			global.IntegrationModel.upsertIntegration(propertyId, target);
		}

		renderListFor(propertyId);
	}

	function init(){
		if (!ensureMaster()) return;

		populateProps();

		const propSelect = $id('int_prop_select');
		const btnAdd     = $id('int_add_btn');

		if (propSelect){
			propSelect.addEventListener('change', function(){
				renderListFor(propSelect.value);
			});
		}

		if (btnAdd){
			btnAdd.addEventListener('click', function(){
				const current = propSelect ? propSelect.value : '';
				openForm(current || '', null);
			});
		}

		const modalSave  = $id('int_form_save');
		const modalClose = $id('int_form_close');

		if (modalSave)  modalSave.addEventListener('click', saveForm);
		if (modalClose) modalClose.addEventListener('click', closeForm);
	}

	global.document.addEventListener('DOMContentLoaded', function(){
		if ($id('int_prop_select') && $id('int_list_area')){
			init();
		}
	});

})(window);
