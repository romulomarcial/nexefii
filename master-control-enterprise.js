
// master-control-enterprise.js
// Canonical single implementation: one getAllProperties and no duplicate global declarations.

(function (global) {
	'use strict';

	if (!global.MasterControlSystem) {
		console.warn('[Enterprise] MasterControlSystem not found; skipping enterprise wiring.');
		return;
	}

	function safeParseJSON(str, fallback) {
		try {
			return str ? JSON.parse(str) : fallback;
		} catch (e) {
			return fallback;
		}
	}

	Object.assign(global.MasterControlSystem.prototype, {
		initEnterpriseBackupSystems() {
			try {
				if (!this.enterpriseBackup && global.EnterpriseBackupSystem) {
					this.enterpriseBackup = new EnterpriseBackupSystem();
					global.enterpriseBackupSystem = this.enterpriseBackup;
				}
				if (!this.releaseManagement && global.ReleaseManagementSystem && this.enterpriseBackup) {
					this.releaseManagement = new ReleaseManagementSystem(this.enterpriseBackup);
					global.releaseManagement = this.releaseManagement;
				}
			} catch (err) { console.error('[Enterprise] initEnterpriseBackupSystems error:', err); }
		},

		initEnterpriseUI() {
			try {
				this.initPropertyBackupsUI && this.initPropertyBackupsUI();
				this.initGeneralBackupsUI && this.initGeneralBackupsUI();
			} catch (err) { console.error('[Enterprise] initEnterpriseUI error:', err); this.showToast && this.showToast('Erro ao inicializar UI enterprise', 'error'); }
		},

		getAllProperties() {
			const allProps = [];
			const seen = new Set();

			try {
				if (global.NexefiiProps && typeof global.NexefiiProps.listProperties === 'function') {
					const list = global.NexefiiProps.listProperties() || [];
					list.forEach(p => { const id = p && (p.key || p.id || p.slug); if (id && !seen.has(id)) { seen.add(id); allProps.push({ id, name: (p && p.name) || id }); } });
				}
			} catch (e) { console.warn('[Enterprise] error reading NexefiiProps:', e); }

			if (allProps.length === 0 && typeof this.getPropertiesList === 'function') {
				try { const ids = this.getPropertiesList() || []; ids.forEach(id => { if (id && !seen.has(id)) { seen.add(id); allProps.push({ id, name: id }); } }); } catch (e) { console.warn('[Enterprise] error reading getPropertiesList:', e); }
			}

			if (allProps.length === 0) {
				try { const map = safeParseJSON(global.localStorage.getItem('nexefii_properties'), {}); Object.keys(map || {}).forEach(id => { if (id && !seen.has(id)) { seen.add(id); allProps.push({ id, name: id }); } }); } catch (e) { console.warn('[Enterprise] error reading nexefii_properties from localStorage:', e); }
			}

			try { if (this.enterpriseBackup && this.enterpriseBackup.tenantBackups) { Object.keys(this.enterpriseBackup.tenantBackups).forEach(tid => { if (tid && !seen.has(tid)) { seen.add(tid); allProps.push({ id: tid, name: tid }); } }); } } catch (e) { console.warn('[Enterprise] error reading tenantBackups:', e); }

			return allProps;
		},

		initPropertyBackupsUI() { try { const props = this.getAllProperties(); this._populateSelectWithProperties && this._populateSelectWithProperties('tbPropertySelect', props); this._populateSelectWithProperties && this._populateSelectWithProperties('schedulePropertySelect', props); this.updatePropertyBackupMetrics && this.updatePropertyBackupMetrics(); this.loadPropertyBackupCatalog && this.loadPropertyBackupCatalog(); this.loadPropertyBackupSchedules && this.loadPropertyBackupSchedules(); this.startPropertyBackupScheduler && this.startPropertyBackupScheduler(); } catch (e) { console.error('[Enterprise] initPropertyBackupsUI error:', e); } },

		_populateSelectWithProperties(selectId, props) { try { const select = global.document.getElementById(selectId); if (!select) return; while (select.options.length > 1) select.remove(1); (props || []).forEach(p => { const opt = global.document.createElement('option'); opt.value = p.id; opt.textContent = p.name || p.id; select.appendChild(opt); }); } catch (e) { console.warn('[Enterprise] _populateSelectWithProperties error:', e); } },

		isEnterpriseCompressionEnabled() { try { const v = global.localStorage.getItem('enterprise_compress_enabled'); if (v === null) return true; return v !== '0' && v !== 'false'; } catch { return true; } },
		isEnterpriseEncryptionEnabled() { try { const v = global.localStorage.getItem('enterprise_encrypt_enabled'); if (v === null) return false; return v === '1' || v === 'true'; } catch { return false; } }

	});

})(this);
