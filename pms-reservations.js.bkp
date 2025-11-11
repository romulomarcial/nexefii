// PMS - Reservations Module (Módulo de Reservas)
// Scalable architecture: Small → Medium → Large properties
// Performance-optimized with unified Rate Plan Engine

// ============================================
// RATE PLAN ENGINE - Unified Layer
// ============================================
class RatePlanEngine {
  constructor() {
    this.storageKey = 'pms_rate_plans';
    this.loadPlans();
  }

  loadPlans() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.plans = data ? JSON.parse(data) : this.getDefaultPlans();
    } catch (e) {
      console.warn('[RatePlan] Failed to load plans:', e);
      this.plans = this.getDefaultPlans();
    }
  }

  savePlans() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.plans));
    } catch (e) {
      console.error('[RatePlan] Failed to save plans:', e);
    }
  }

  getDefaultPlans() {
    return [
      {
        id: 'rack',
        code: 'RACK',
        name: { pt: 'Tarifa Balcão', en: 'Rack Rate', es: 'Tarifa Mostrador' },
        type: 'public',
        priority: 1,
        restrictions: {},
        active: true
      },
      {
        id: 'corporate',
        code: 'CORP',
        name: { pt: 'Tarifa Corporativa', en: 'Corporate Rate', es: 'Tarifa Corporativa' },
        type: 'negotiated',
        priority: 2,
        restrictions: { minStay: 1 },
        active: true
      },
      {
        id: 'nonRefundable',
        code: 'NRF',
        name: { pt: 'Não Reembolsável', en: 'Non-Refundable', es: 'No Reembolsable' },
        type: 'promotional',
        priority: 3,
        restrictions: { cancellationPolicy: 'no_refund', advancePurchase: 7 },
        active: true
      }
    ];
  }

  // Calculate rate based on room type, date, and plan
  calculateRate(roomTypeId, checkInDate, checkOutDate, planId = 'rack', occupancy = 2) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan || !plan.active) return null;

    // Get base rate for room type
    const baseRate = this.getBaseRate(roomTypeId, checkInDate);
    
    // Apply seasonal adjustments
    const seasonalRate = this.applySeasonalAdjustments(baseRate, checkInDate);
    
    // Apply plan modifiers
    const planRate = this.applyPlanModifiers(seasonalRate, plan);
    
    // Apply occupancy adjustments
    const finalRate = this.applyOccupancyAdjustments(planRate, occupancy);
    
    return {
      baseRate,
      seasonalRate,
      planRate,
      finalRate,
      currency: 'BRL',
      plan: plan.code,
      restrictions: plan.restrictions
    };
  }

  getBaseRate(roomTypeId, date) {
    // TODO: Fetch from property room types configuration
    const baseRates = {
      standard: 350,
      deluxe: 500,
      suite: 800,
      presidential: 1500
    };
    return baseRates[roomTypeId] || 350;
  }

  applySeasonalAdjustments(baseRate, date) {
    const month = new Date(date).getMonth();
    const highSeasonMonths = [11, 0, 1, 6, 7]; // Dec, Jan, Feb, Jul, Aug
    
    if (highSeasonMonths.includes(month)) {
      return baseRate * 1.3; // +30% high season
    }
    return baseRate;
  }

  applyPlanModifiers(rate, plan) {
    const modifiers = {
      public: 1.0,
      negotiated: 0.85, // -15% corporate
      promotional: 0.75 // -25% promotional
    };
    return rate * (modifiers[plan.type] || 1.0);
  }

  applyOccupancyAdjustments(rate, occupancy) {
    // Single occupancy: -10%, Triple+: +20%
    if (occupancy === 1) return rate * 0.9;
    if (occupancy >= 3) return rate * 1.2;
    return rate;
  }

  // Add or update rate plan
  upsertPlan(plan) {
    const idx = this.plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      this.plans[idx] = { ...this.plans[idx], ...plan };
    } else {
      this.plans.push({ ...plan, id: plan.id || `plan_${Date.now()}` });
    }
    this.savePlans();
  }

  // Get all active plans
  getActivePlans() {
    return this.plans.filter(p => p.active);
  }
}

// ============================================
// RESERVATION ENGINE - Core Logic
// ============================================
class ReservationEngine {
  constructor(propertyKey) {
    this.propertyKey = propertyKey;
    this.storageKey = `pms_reservations_${propertyKey}`;
    this.ratePlan = new RatePlanEngine();
    this.inventory = window.getHotelInventory(propertyKey);
    this.loadReservations();
  }

  loadReservations() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.reservations = data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[Reservation] Failed to load:', e);
      this.reservations = [];
    }
  }

  saveReservations() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.reservations));
      return true;
    } catch (e) {
      console.error('[Reservation] Failed to save:', e);
      return false;
    }
  }

  // Get count of reserved rooms for a room type in date range
  getReservedCount(roomTypeId, checkInDate, checkOutDate, excludeReservationId = null) {
    const reserved = this.reservations.filter(r => {
      if (r.status === 'cancelled') return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;
      if (r.roomTypeId !== roomTypeId) return false;
      
      // Check date overlap: reservation must start before period ends AND end after period starts
      const overlaps = r.checkInDate < checkOutDate && r.checkOutDate > checkInDate;
      
      if (overlaps) {
        console.log('[Reservation] Found overlapping reservation:', {
          guest: r.guestName,
          status: r.status,
          checkIn: r.checkInDate,
          checkOut: r.checkOutDate,
          roomType: r.roomTypeId,
          periodStart: checkInDate,
          periodEnd: checkOutDate
        });
      }
      
      return overlaps;
    });
    
    console.log(`[Reservation] getReservedCount(${roomTypeId}, ${checkInDate}, ${checkOutDate}): ${reserved.length} rooms`);
    return reserved.length;
  }

  // Check availability using hotel inventory
  checkAvailability(roomTypeId, checkInDate, checkOutDate, roomsNeeded = 1, excludeReservationId = null) {
    console.log('[Reservation] Checking availability:', { roomTypeId, checkInDate, checkOutDate, roomsNeeded });
    
    // Validate with inventory manager
    const validation = this.inventory.validateBooking(roomTypeId, checkInDate, checkOutDate, 2, 0);
    if (!validation.valid) {
      return {
        available: false,
        reason: validation.error,
        details: validation
      };
    }

    // Check actual availability
    const availableRooms = this.inventory.getAvailableRooms(roomTypeId, checkInDate, checkOutDate, excludeReservationId);
    
    return {
      available: availableRooms >= roomsNeeded,
      availableRooms,
      requestedRooms: roomsNeeded,
      roomType: this.inventory.getRoomType(roomTypeId)
    };
  }

  // Create new reservation
  createReservation(data) {
    // Validate availability first
    const availability = this.checkAvailability(
      data.roomTypeId, 
      data.checkInDate, 
      data.checkOutDate,
      data.roomsCount || 1
    );

    if (!availability.available) {
      console.error('[Reservation] No availability:', availability);
      throw new Error(`no_availability: ${availability.reason || 'rooms_not_available'}`);
    }

    // Validate booking rules
    const validation = this.inventory.validateBooking(
      data.roomTypeId,
      data.checkInDate,
      data.checkOutDate,
      data.adults || 2,
      data.children || 0
    );

    if (!validation.valid) {
      console.error('[Reservation] Validation failed:', validation);
      throw new Error(`validation_failed: ${validation.error}`);
    }

    const reservation = {
      id: `RES${Date.now()}`,
      confirmationNumber: this.generateConfirmationNumber(),
      status: data.status || 'confirmed', // confirmed, pending, cancelled, checked_in, checked_out, no_show
      type: data.type || 'individual', // individual, group, allotment, block
      
      // Guest info
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      guestDocument: data.guestDocument || null,
      guestCountry: data.guestCountry || 'Brasil',
      
      // Stay details
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights: this.calculateNights(data.checkInDate, data.checkOutDate),
      
      // Room details
      roomTypeId: data.roomTypeId,
      roomNumber: data.roomNumber || null, // Assigned later
      adults: data.adults || 2,
      children: data.children || 0,
      
      // Rate details
      ratePlanId: data.ratePlanId || 'rack',
      ratePerNight: data.ratePerNight,
      totalAmount: data.totalAmount,
      currency: data.currency || 'BRL',
      
      // Payment
      paymentMethod: data.paymentMethod || 'credit_card',
      paymentStatus: data.paymentStatus || 'pending', // pending, authorized, paid, refunded
      depositAmount: data.depositAmount || 0,
      
      // Channel
      source: data.source || 'direct', // direct, ota, phone, walk_in, corporate, gds
      otaName: data.otaName || null,
      
      // Special requests
      specialRequests: data.specialRequests || [],
      
      // Metadata
      createdAt: Date.now(),
      createdBy: data.createdBy || 'system',
      updatedAt: Date.now(),
      
      // Cancellation
      cancellationPolicy: data.cancellationPolicy || 'standard',
      cancelledAt: null,
      cancellationReason: null
    };

    this.reservations.push(reservation);
    this.saveReservations();
    
    console.log('[Reservation] Created:', reservation.confirmationNumber);
    return reservation;
  }

  // Update reservation
  updateReservation(reservationId, updates) {
    const idx = this.reservations.findIndex(r => r.id === reservationId);
    if (idx < 0) return null;

    this.reservations[idx] = {
      ...this.reservations[idx],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveReservations();
    return this.reservations[idx];
  }

  // Cancel reservation
  cancelReservation(reservationId, reason = 'guest_request') {
    return this.updateReservation(reservationId, {
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancellationReason: reason
    });
  }

  // Get reservation by confirmation number
  getByConfirmationNumber(confirmationNumber) {
    return this.reservations.find(r => r.confirmationNumber === confirmationNumber);
  }

  // Get reservations by date range
  getByDateRange(startDate, endDate, includeCheckOut = true) {
    return this.reservations.filter(r => {
      const checkIn = new Date(r.checkInDate);
      const checkOut = new Date(r.checkOutDate);
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (includeCheckOut) {
        return (checkIn >= start && checkIn <= end) || 
               (checkOut >= start && checkOut <= end) ||
               (checkIn <= start && checkOut >= end);
      } else {
        return checkIn >= start && checkIn <= end;
      }
    });
  }

  // Get availability for date range (updated to use inventory)
  getAvailability(checkInDate, checkOutDate, roomTypeId = null) {
    if (roomTypeId) {
      // Get availability for specific room type
      const available = this.inventory.getAvailableRooms(roomTypeId, checkInDate, checkOutDate);
      const total = this.inventory.getTotalInventory(roomTypeId);
      const roomType = this.inventory.getRoomType(roomTypeId);
      
      return {
        available,
        total,
        occupied: total - available,
        occupancy: total > 0 ? Math.round((total - available) / total * 100) : 0,
        roomType: roomType ? roomType.name : null
      };
    }

    // Get overall property availability
    const occupancy = this.inventory.getPropertyOccupancy(checkInDate);
    
    return {
      available: occupancy.available,
      total: occupancy.total,
      occupied: occupancy.occupied,
      occupancy: occupancy.occupancyRate
    };
  }

  // Calculate nights between dates
  calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Generate unique confirmation number
  generateConfirmationNumber() {
    const prefix = 'ILX';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Get statistics
  getStats(startDate, endDate) {
    const reservations = this.getByDateRange(startDate, endDate, false);
    
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    const checkedIn = reservations.filter(r => r.status === 'checked_in').length;
    const checkedOut = reservations.filter(r => r.status === 'checked_out').length;
    
    const totalRevenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    
    const avgRate = reservations.length > 0 
      ? totalRevenue / reservations.length 
      : 0;

    return {
      total: reservations.length,
      confirmed,
      cancelled,
      checkedIn,
      checkedOut,
      cancellationRate: reservations.length > 0 ? (cancelled / reservations.length) * 100 : 0,
      totalRevenue,
      avgRate,
      avgStay: reservations.length > 0 
        ? reservations.reduce((sum, r) => sum + r.nights, 0) / reservations.length 
        : 0
    };
  }

  // =============================
  // FRONT DESK OPERATIONS
  // =============================
  // Ensure reservation has a folio container
  ensureFolio(reservation) {
    if (!reservation.folios || !Array.isArray(reservation.folios) || reservation.folios.length === 0) {
      reservation.folios = [
        {
          id: 'A',
          name: 'Folio A',
          items: [], // {id, date, description, amount, type: charge|credit, ref}
          payments: [], // {id, date, method, amount, ref}
          totalCharges: 0,
          totalPayments: 0,
          balance: 0
        }
      ];
    }
  }

  // Assign a physical room number (auto-pick if none provided)
  assignRoom(reservationId, roomNumber = null) {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };

    // If already assigned and no override requested
    if (r.roomNumber && !roomNumber) return { success: true, roomNumber: r.roomNumber, reservation: r };

    const inventory = this.inventory;
    // Candidate rooms: same type, not blocked/out_of_order
    const candidates = inventory.rooms.filter(room =>
      room.roomTypeId === r.roomTypeId && !room.blocked && room.status !== 'out_of_order' && room.status !== 'maintenance'
    );

    let chosen = null;
    if (roomNumber) {
      chosen = candidates.find(c => c.roomNumber === String(roomNumber));
      if (!chosen) return { success: false, error: 'room_not_available_or_wrong_type' };
    } else {
      // Auto-pick: first room not used by overlapping reservation
      const overlaps = (res, roomNo) => (res.roomNumber === roomNo) && (res.status !== 'cancelled') && (res.checkInDate < r.checkOutDate && res.checkOutDate > r.checkInDate);
      chosen = candidates.find(c => !this.reservations.some(res => overlaps(res, c.roomNumber)));
    }

    if (!chosen) return { success: false, error: 'no_room_available' };

    r.roomNumber = chosen.roomNumber;
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, roomNumber: r.roomNumber, reservation: r };
  }

  // Add a charge to folio (defaults to Folio A)
  addFolioItem(reservationId, item, folioId = 'A') {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    this.ensureFolio(r);
    const folio = r.folios.find(f => f.id === folioId) || r.folios[0];
    const entry = {
      id: `CHG_${Date.now()}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      description: item.description || 'Charge',
      amount: Number(item.amount) || 0,
      type: item.type || 'charge',
      ref: item.ref || null
    };
    folio.items.push(entry);
    folio.totalCharges += entry.type === 'charge' ? entry.amount : 0;
    folio.totalPayments += entry.type === 'credit' ? entry.amount : 0;
    folio.balance = folio.totalCharges - folio.totalPayments;
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, folio, reservation: r };
  }

  // Record a payment to folio
  addPayment(reservationId, payment, folioId = 'A') {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    this.ensureFolio(r);
    const folio = r.folios.find(f => f.id === folioId) || r.folios[0];
    const p = {
      id: `PMT_${Date.now()}`,
      date: payment.date || new Date().toISOString().slice(0, 10),
      method: payment.method || r.paymentMethod || 'cash',
      amount: Number(payment.amount) || 0,
      ref: payment.ref || null
    };
    folio.payments.push(p);
    folio.totalPayments += p.amount;
    folio.balance = folio.totalCharges - folio.totalPayments;
    r.updatedAt = Date.now();
    // Update reservation payment status heuristically
    if (folio.balance <= 0) r.paymentStatus = 'paid';
    this.saveReservations();
    return { success: true, folio, reservation: r };
  }

  // Split folio: create a new folio and optionally move items
  createFolio(reservationId, folioId = 'B', name = 'Folio B') {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    this.ensureFolio(r);
    if (r.folios.find(f => f.id === folioId)) return { success: false, error: 'folio_exists' };
    r.folios.push({ id: folioId, name, items: [], payments: [], totalCharges: 0, totalPayments: 0, balance: 0 });
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, reservation: r };
  }

  moveFolioItems(reservationId, itemIds = [], fromFolio = 'A', toFolio = 'B') {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    const src = r.folios.find(f => f.id === fromFolio);
    const dst = r.folios.find(f => f.id === toFolio);
    if (!src || !dst) return { success: false, error: 'folio_not_found' };
    const moving = src.items.filter(it => itemIds.includes(it.id));
    src.items = src.items.filter(it => !itemIds.includes(it.id));
    dst.items.push(...moving);
    // Recalc totals
    const recalc = (f) => {
      f.totalCharges = f.items.filter(i => i.type === 'charge').reduce((s, i) => s + i.amount, 0);
      f.totalPayments = f.items.filter(i => i.type === 'credit').reduce((s, i) => s + i.amount, 0) + f.payments.reduce((s, p) => s + p.amount, 0);
      f.balance = f.totalCharges - f.totalPayments;
    };
    recalc(src); recalc(dst);
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, reservation: r };
  }

  // Upgrade room type (simple validation)
  upgradeRoomType(reservationId, newRoomTypeId) {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    if (r.status === 'checked_in') return { success: false, error: 'cannot_upgrade_after_checkin' };
    const ok = this.inventory.isAvailable(newRoomTypeId, r.checkInDate, r.checkOutDate);
    if (!ok) return { success: false, error: 'no_availability_new_type' };
    r.roomTypeId = newRoomTypeId;
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, reservation: r };
  }

  // Check-in operation
  checkInReservation(reservationId) {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    if (r.status === 'cancelled') return { success: false, error: 'reservation_cancelled' };
    if (r.status === 'checked_in') return { success: true, reservation: r };

    // Validate dates: allow early/late check-in in demo
    // Ensure room assignment
    const assigned = this.assignRoom(reservationId);
    if (!assigned.success) return assigned;

    r.status = 'checked_in';
    r.checkedInAt = Date.now();
    r.updatedAt = Date.now();
    this.saveReservations();
    return { success: true, reservation: r };
  }

  // Check-out operation
  checkOutReservation(reservationId, options = { force: false }) {
    const r = this.reservations.find(x => x.id === reservationId);
    if (!r) return { success: false, error: 'reservation_not_found' };
    if (r.status !== 'checked_in') return { success: false, error: 'not_checked_in' };

    // Validate folio balance
    this.ensureFolio(r);
    const mainFolio = r.folios[0];
    const totalBalance = r.folios.reduce((sum, f) => sum + (f.balance || 0), 0);
    if (totalBalance > 0 && !options.force) {
      return { success: false, error: 'outstanding_balance', balance: totalBalance };
    }

    r.status = 'checked_out';
    r.checkedOutAt = Date.now();
    r.updatedAt = Date.now();
    this.saveReservations();

    // Optionally mark room dirty on checkout
    if (r.roomNumber) {
      try { this.inventory.updateRoomStatus(r.roomNumber, 'dirty'); } catch (e) {}
    }

    return { success: true, reservation: r };
  }
}

// ============================================
// GROUP RESERVATIONS MANAGER
// ============================================
class GroupReservationsManager {
  constructor(propertyKey) {
    this.propertyKey = propertyKey;
    this.storageKey = `pms_groups_${propertyKey}`;
    this.loadGroups();
  }

  loadGroups() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.groups = data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[GroupReservations] Failed to load:', e);
      this.groups = [];
    }
  }

  saveGroups() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.groups));
      return true;
    } catch (e) {
      console.error('[GroupReservations] Failed to save:', e);
      return false;
    }
  }

  createGroup(data) {
    const group = {
      id: `GRP${Date.now()}`,
      groupName: data.groupName,
      groupCode: data.groupCode || this.generateGroupCode(),
      organizerName: data.organizerName,
      organizerEmail: data.organizerEmail,
      organizerPhone: data.organizerPhone,
      
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      
      roomsBlocked: data.roomsBlocked || 0,
      roomsBooked: 0,
      roomTypeId: data.roomTypeId,
      
      ratePlanId: data.ratePlanId || 'corporate',
      negotiatedRate: data.negotiatedRate,
      
      cutoffDate: data.cutoffDate, // Date when unbooked rooms release back to inventory
      
      reservations: [], // Array of reservation IDs
      
      status: 'active', // active, confirmed, completed, cancelled
      
      specialRequests: data.specialRequests || [],
      
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.groups.push(group);
    this.saveGroups();
    
    return group;
  }

  generateGroupCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `GRP${timestamp}`;
  }

  addReservationToGroup(groupId, reservationId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    if (!group.reservations.includes(reservationId)) {
      group.reservations.push(reservationId);
      group.roomsBooked = group.reservations.length;
      group.updatedAt = Date.now();
      this.saveGroups();
    }

    return true;
  }

  getGroup(groupId) {
    return this.groups.find(g => g.id === groupId);
  }

  getGroupByCode(groupCode) {
    return this.groups.find(g => g.groupCode === groupCode);
  }
}

// ============================================
// CHANNEL MANAGER INTEGRATION (OTA)
// ============================================
class ChannelManagerIntegration {
  constructor(propertyKey) {
    this.propertyKey = propertyKey;
    this.storageKey = `pms_channels_${propertyKey}`;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.config = data ? JSON.parse(data) : this.getDefaultConfig();
    } catch (e) {
      console.warn('[ChannelManager] Failed to load config:', e);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: false,
      channels: {
        bookingCom: { active: false, apiKey: null },
        expedia: { active: false, apiKey: null },
        airbnb: { active: false, apiKey: null },
        decolar: { active: false, apiKey: null }
      },
      updateFrequency: 'realtime', // realtime, hourly, daily
      autoUpdate: true
    };
  }

  // Push availability update to OTAs
  async pushAvailability(roomTypeId, date, available) {
    if (!this.config.enabled) return { success: false, reason: 'Channel manager disabled' };

    console.log('[ChannelManager] Pushing availability:', { roomTypeId, date, available });
    
    // Simulate API call
    const activeChannels = Object.keys(this.config.channels).filter(
      ch => this.config.channels[ch].active
    );

    const results = activeChannels.map(channel => ({
      channel,
      success: true,
      timestamp: Date.now()
    }));

    return { success: true, results };
  }

  // Push rate update to OTAs
  async pushRate(roomTypeId, date, rate, ratePlanId) {
    if (!this.config.enabled) return { success: false, reason: 'Channel manager disabled' };

    console.log('[ChannelManager] Pushing rate:', { roomTypeId, date, rate, ratePlanId });
    
    // Simulate API call
    return { success: true, timestamp: Date.now() };
  }

  // Fetch reservations from OTAs
  async fetchReservations() {
    if (!this.config.enabled) return [];

    console.log('[ChannelManager] Fetching OTA reservations');
    
    // Simulate API call - would return new reservations from channels
    return [];
  }
}

// ============================================
// GLOBAL INSTANCE MANAGER
// ============================================
window.ReservationEngines = window.ReservationEngines || {};

function getReservationEngine(propertyKey) {
  if (!window.ReservationEngines[propertyKey]) {
    window.ReservationEngines[propertyKey] = new ReservationEngine(propertyKey);
  }
  return window.ReservationEngines[propertyKey];
}

function getGroupManager(propertyKey) {
  const key = `group_${propertyKey}`;
  if (!window.ReservationEngines[key]) {
    window.ReservationEngines[key] = new GroupReservationsManager(propertyKey);
  }
  return window.ReservationEngines[key];
}

function getChannelManager(propertyKey) {
  const key = `channel_${propertyKey}`;
  if (!window.ReservationEngines[key]) {
    window.ReservationEngines[key] = new ChannelManagerIntegration(propertyKey);
  }
  return window.ReservationEngines[key];
}

// Export for global access
window.getReservationEngine = getReservationEngine;
window.getGroupManager = getGroupManager;
window.getChannelManager = getChannelManager;
window.RatePlanEngine = RatePlanEngine;
