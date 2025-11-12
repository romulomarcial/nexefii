// PMS Front Desk (Check-in / Check-out)


// Utility: Render PMS module switcher dynamically for i18n/scale
function renderPMSModuleSwitcher(modules, current, i18nDict) {
  const sel = document.getElementById('pmsModuleSwitcher');
  if (!sel) return;
  console.info('[renderPMSModuleSwitcher] Chamado. modules:', modules, 'current:', current, 'i18nDict:', i18nDict);
  sel.innerHTML = '';
  modules.forEach(mod => {
    const opt = document.createElement('option');
    opt.value = mod.value;
    opt.selected = mod.value === current;
    // Emoji + label from i18n
    opt.textContent = `${mod.emoji} ${(i18nDict[mod.i18nKey] || mod.fallback)}`;
    sel.appendChild(opt);
  });
}

class FrontDeskController {
  constructor() {
    this.propertyKey = 'property_default';
    this.engine = window.getReservationEngine(this.propertyKey);
    this.inventory = window.getHotelInventory(this.propertyKey);
    this.integrations = new window.PMSIntegrations(this.propertyKey);
    this.lang = localStorage.getItem('ilux_lang') || 'pt';
    this.i18n = {};
    this.init();
  }

  async init() {
    try {
      await this.loadI18n();
    } catch (e) { console.warn('[FrontDesk] i18n load error', e); }

    // Render module switcher dynamically for i18n/scale
    const mods = [
      { value: 'pms-frontdesk.html', i18nKey: 'fdTitle', emoji: '🔑', fallback: 'Check-in / Check-out' },
      { value: 'pms-reservations.html', i18nKey: 'resPageTitle', emoji: '📅', fallback: 'Reservas' }
    ];
    try {
      const session = window.IluxAuth && IluxAuth.getCurrentSession ? ((window.IluxAuth && IluxAuth.getCurrentSession) ? IluxAuth.getCurrentSession() : (window.NexefiiAuth && NexefiiAuth.getCurrentSession ? ((window.NexefiiAuth && NexefiiAuth.getCurrentSession) ? NexefiiAuth.getCurrentSession() : (window.IluxAuth && IluxAuth.getCurrentSession ? IluxAuth.getCurrentSession() : null)) : null)) : null;
      if (session && session.role === 'master') {
        mods.unshift({ value: 'master-control.html', i18nKey: 'masterControl', emoji: '🔐', fallback: 'Master Control' });
      }
    } catch(e){}
    renderPMSModuleSwitcher(mods, 'pms-frontdesk.html', this.i18n);

    try {
      this.applyI18n();
    } catch (e) { console.warn('[FrontDesk] applyI18n error', e); }
    try {
      this.renderAll();
    } catch (e) { console.error('[FrontDesk] renderAll error', e); }
    // Auto refresh every 20s
    setInterval(() => this.renderAll(), 20000);
  }

  async loadI18n() {
    try {
      const res = await fetch('i18n.json');
      const data = await res.json();
      this.i18n = (data[this.lang] && data[this.lang].app) || {};
    } catch (e) { console.warn('i18n load failed', e); }
  }

  t(key, fallback = '') { return this.i18n[key] || fallback || key; }
  fmtDate(d) { const [y,m,day] = d.split('-'); return `${day}/${m}/${y}`; }
  money(v) {
    // Map language to locale and currency
    const currencyMap = {
      'pt': { locale: 'pt-BR', currency: 'BRL' },
      'en': { locale: 'en-US', currency: 'USD' },
      'es': { locale: 'es-ES', currency: 'EUR' }
    };
    const config = currencyMap[this.lang] || currencyMap['pt'];
    return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }).format(v||0);
  }

  applyI18n() {
    const dict = this.i18n || {};
    let count = 0;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (dict[k]) { el.textContent = dict[k]; count++; }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.getAttribute('data-i18n-placeholder');
      if (dict[k]) { el.setAttribute('placeholder', dict[k]); count++; }
    });
    console.info('[FrontDesk] i18n applied to elements:', count);
  }

  renderAll() {
    // Always reload from storage to avoid stale data when switching pages
    try { this.engine.loadReservations(); } catch (e) { console.warn('[FrontDesk] loadReservations failed', e); }

    const today = new Date();
    const todayStr = this.formatDate(today);
    const all = this.engine.reservations || [];
    console.log('[FrontDesk] Total reservas carregadas:', all.length, 'Hoje:', todayStr);
    if (all.length) {
      console.table(all.map(r => ({ id: r.id, status: r.status, in: r.checkInDate, out: r.checkOutDate, roomType: r.roomTypeId, room: r.roomNumber })));
    }

    const arrivals = all.filter(r => (r.status === 'confirmed' || r.status === 'pending') && r.checkInDate === todayStr);
    const inHouse = all.filter(r => r.status === 'checked_in');
    const departures = all.filter(r => r.status === 'checked_in' && r.checkOutDate === todayStr);

    this.setText('fdArrivalsCount', arrivals.length);
    this.setText('fdInHouseCount', inHouse.length);
    this.setText('fdDeparturesCount', departures.length);

    this.renderArrivals(arrivals);
    this.renderInHouse(inHouse);
    this.renderDepartures(departures);
  }

  renderArrivals(list) {
    const el = document.getElementById('fdArrivalsList');
    if (!el) return;
    if (list.length === 0) { el.innerHTML = `<div class="empty-state">${this.t('resNoResults','Nenhuma reserva')}</div>`; return; }
    el.innerHTML = list.map(r => `
      <div class="fd-item" data-id="${r.id}">
        <div>
          <div class="fd-guest">${this.escape(r.guestName)} <span class="chip">${r.confirmationNumber}</span></div>
          <div class="fd-sub">${this.t('resRoomType','Quarto')}: ${r.roomTypeId.toUpperCase()} • ${this.t('resNights','noites')}: ${r.nights}</div>
          <div class="fd-chips">
            ${r.roomNumber ? `<span class="chip">#${r.roomNumber}</span>` : ''}
            <span class="chip">${this.money(r.totalAmount)}</span>
            <span class="chip">${this.t('resPaymentStatus','Pagamento')}: ${this.t(this.mapPayment(r.paymentStatus), r.paymentStatus)}</span>
          </div>
        </div>
        <div class="fd-buttons">
          <button class="btn" data-action="precheckin">📝 ${this.t('fdPreCheckIn','Pré check-in')}</button>
          <button class="btn" data-action="assign">🚪 ${this.t('fdAssignRoom','Alocar')}</button>
          <button class="btn" data-action="key">🔑 ${this.t('fdIssueKey','Chave')}</button>
          <button class="btn-primary" data-action="checkin">✅ ${this.t('fdCheckIn','Check-in')}</button>
        </div>
      </div>
    `).join('');
    this.bindListActions(el);
  }

  renderInHouse(list) {
    const el = document.getElementById('fdInHouseList');
    if (!el) return;
    if (list.length === 0) { el.innerHTML = `<div class="empty-state">${this.t('fdNoInHouse','Nenhum hóspede in-house')}</div>`; return; }
    el.innerHTML = list.map(r => {
      const balance = this.getFolioBalance(r);
      return `
      <div class="fd-item" data-id="${r.id}">
        <div>
          <div class="fd-guest">${this.escape(r.guestName)} ${r.roomNumber ? `<span class="chip">#${r.roomNumber}</span>` : ''}</div>
          <div class="fd-sub">${this.t('resCheckOutDate','Check-out')}: ${this.fmtDate(r.checkOutDate)} • ${this.t('fdBalance','Saldo')}: ${this.money(balance)}</div>
          <div class="fd-chips">
            <span class="chip">${this.t('resRoomType','Quarto')}: ${r.roomTypeId.toUpperCase()}</span>
            <span class="chip">${this.t('resPaymentStatus','Pagamento')}: ${this.t(this.mapPayment(r.paymentStatus), r.paymentStatus)}</span>
          </div>
        </div>
        <div class="fd-buttons">
          <button class="btn" data-action="charge">➕ ${this.t('fdAddCharge','Lançar')}</button>
          <button class="btn" data-action="payment">💳 ${this.t('fdPayment','Pagamento')}</button>
          <button class="btn" data-action="split">🪓 ${this.t('fdSplitFolio','Split folio')}</button>
          <button class="btn" data-action="upgrade">⬆️ ${this.t('fdUpgrade','Upgrade')}</button>
          <button class="btn-primary" data-action="checkout">📤 ${this.t('fdCheckOut','Check-out')}</button>
        </div>
      </div>`;
    }).join('');
    this.bindListActions(el);
  }

  renderDepartures(list) {
    const el = document.getElementById('fdDeparturesList');
    if (!el) return;
    if (list.length === 0) { el.innerHTML = `<div class="empty-state">${this.t('fdNoDepartures','Nenhuma saída hoje')}</div>`; return; }
    el.innerHTML = list.map(r => {
      const balance = this.getFolioBalance(r);
      return `
      <div class="fd-item" data-id="${r.id}">
        <div>
          <div class="fd-guest">${this.escape(r.guestName)} ${r.roomNumber ? `<span class="chip">#${r.roomNumber}</span>` : ''}</div>
          <div class="fd-sub">${this.t('fdBalance','Saldo')}: ${this.money(balance)}</div>
        </div>
        <div class="fd-buttons">
          <button class="btn" data-action="invoice">🧾 ${this.t('fdReceipt','Recibo')}</button>
          <button class="btn" data-action="payment">💳 ${this.t('fdPayment','Pagamento')}</button>
          <button class="btn-primary" data-action="checkout">📤 ${this.t('fdCheckOut','Check-out')}</button>
        </div>
      </div>`;
    }).join('');
    this.bindListActions(el);
  }

  bindListActions(container) {
    container.querySelectorAll('.fd-item .btn, .fd-item .btn-primary').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.closest('.fd-item').dataset.id;
        this.onAction(action, id);
      });
    });
  }

  onAction(action, id) {
    switch(action) {
      case 'precheckin':
        alert(this.t('fdPreCheckInDone','Pré check-in registrado.'));
        break;
      case 'assign':
        {
          const result = this.engine.assignRoom(id);
          if (!result.success) { alert(`Erro: ${result.error}`); return; }
          alert(this.t('fdRoomAssigned','Quarto alocado') + `: #${result.roomNumber}`);
          this.renderAll();
        }
        break;
      case 'key':
        {
          const r = this.engine.reservations.find(x => x.id === id);
          if (!r.roomNumber) { alert(this.t('fdAssignRoomFirst','Aloque um quarto antes.')); return; }
          const keyInfo = { code: `K${Math.random().toString(36).slice(2,8).toUpperCase()}`, issuedAt: Date.now() };
          r.keys = r.keys || [];
          r.keys.push(keyInfo);
          this.engine.saveReservations();
          this.integrations.onIssueKey(r, keyInfo);
          alert(this.t('fdKeyIssued','Chave emitida') + `: ${keyInfo.code}`);
        }
        break;
      case 'checkin':
        {
          const result = this.engine.checkInReservation(id);
          if (!result.success) { alert(`Erro: ${result.error}`); return; }
          this.integrations.onCheckIn(result.reservation);
          alert(this.t('fdCheckedIn','Check-in realizado'));
          this.renderAll();
        }
        break;
      case 'charge':
        {
          const desc = prompt(this.t('fdChargeDesc','Descrição do lançamento'), 'Minibar');
          if (!desc) return;
          const val = Number(prompt(this.t('fdChargeValue','Valor'), '50'));
          if (isNaN(val)) return;
          this.engine.addFolioItem(id, { description: desc, amount: val, type: 'charge' });
          this.renderAll();
        }
        break;
      case 'payment':
        {
          const val = Number(prompt(this.t('fdPaymentValue','Valor recebido'), '100'));
          if (isNaN(val)) return;
          const method = prompt(this.t('fdPaymentMethod','Método (pix, cash, credit_card)'), 'pix') || 'cash';
          this.engine.addPayment(id, { amount: val, method });
          this.renderAll();
        }
        break;
      case 'split':
        {
          const r = this.engine.reservations.find(x => x.id === id);
          this.engine.createFolio(id, 'B', 'Folio B');
          alert(this.t('fdSplitCreated','Folio B criado. Para mover itens, implemente a seleção avançada.'));
          this.renderAll();
        }
        break;
      case 'upgrade':
        {
          const newType = prompt(this.t('fdUpgradeTo','Novo tipo (standard/deluxe/suite)'), 'deluxe');
          if (!newType) return;
          const res = this.engine.upgradeRoomType(id, newType);
          if (!res.success) { alert(`Erro: ${res.error}`); return; }
          alert(this.t('fdUpgradeDone','Upgrade realizado.'));
          this.renderAll();
        }
        break;
      case 'invoice':
        {
          const r = this.engine.reservations.find(x => x.id === id);
          const balance = this.getFolioBalance(r);
          alert(`${this.t('fdReceipt','Recibo')}:\n${r.guestName} - ${r.confirmationNumber}\n${this.t('fdBalance','Saldo')}: ${this.money(balance)}`);
        }
        break;
      case 'checkout':
        {
          const res = this.engine.checkOutReservation(id);
          if (!res.success) {
            if (res.error === 'outstanding_balance') {
              const proceed = confirm(this.t('fdBalancePending','Saldo pendente. Deseja forçar?'));
              if (proceed) {
                const forced = this.engine.checkOutReservation(id, { force: true });
                if (forced.success) {
                  this.integrations.onCheckOut(forced.reservation);
                  alert(this.t('fdCheckedOut','Check-out realizado'));
                } else {
                  alert(`Erro: ${forced.error}`);
                }
              }
            } else {
              alert(`Erro: ${res.error}`);
            }
          } else {
            this.integrations.onCheckOut(res.reservation);
            alert(this.t('fdCheckedOut','Check-out realizado'));
          }
          this.renderAll();
        }
        break;
      default:
        console.warn('Unknown action', action);
    }
  }

  getFolioBalance(r) {
    if (!r.folios || r.folios.length === 0) return 0;
    return r.folios.reduce((sum, f) => sum + (f.balance || 0), 0);
  }

  mapPayment(status) {
    switch (status) {
      case 'pending': return 'resPaymentPending';
      case 'authorized': return 'resPaymentAuthorized';
      case 'paid': return 'resPaymentPaid';
      default: return status;
    }
  }

  setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  escape(t) { const div = document.createElement('div'); div.textContent = t || ''; return div.innerHTML; }
  formatDate(date) { const d = new Date(date); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
}

window.addEventListener('DOMContentLoaded', () => {
  window.frontDesk = new FrontDeskController();
});
