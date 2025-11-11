// PMS - Hotel Inventory & Availability Management
// Manages: Rooms, Room Types, Inventory, Availability, Blocking Rules

// ============================================
// HOTEL INVENTORY MANAGER
// ============================================
class HotelInventoryManager {
  constructor(propertyId) {
    this.propertyId = propertyId;
    this.storageKey = `pms_inventory_${propertyId}`;
    this.loadInventory();
  }

  loadInventory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.property = parsed.property;
        this.roomTypes = parsed.roomTypes || [];
        this.rooms = parsed.rooms || [];
        this.policies = parsed.policies || {};
      } else {
        this.initializeDefaultInventory();
      }
    } catch (e) {
      console.error('[Inventory] Failed to load:', e);
      this.initializeDefaultInventory();
    }
  }

  saveInventory() {
    try {
      const data = {
        property: this.property,
        roomTypes: this.roomTypes,
        rooms: this.rooms,
        policies: this.policies,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('[Inventory] Saved successfully');
    } catch (e) {
      console.error('[Inventory] Failed to save:', e);
    }
  }

  initializeDefaultInventory() {
    console.log('[Inventory] Initializing default inventory for:', this.propertyId);
    
    // Property information
    this.property = {
      id: this.propertyId,
      name: 'Hotel Demo',
      totalRooms: 50,
      floors: 5,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo'
    };

    // Room Types configuration
    this.roomTypes = [
      {
        id: 'standard',
        code: 'STD',
        name: { pt: 'Standard', en: 'Standard', es: 'Standard' },
        description: { 
          pt: 'Quarto padrão com cama de casal ou solteiro',
          en: 'Standard room with double or single bed',
          es: 'Habitación estándar con cama doble o individual'
        },
        maxOccupancy: 2,
        maxAdults: 2,
        maxChildren: 1,
        baseRate: 350,
        amenities: ['wifi', 'tv', 'ac', 'minibar'],
        bedTypes: ['queen', 'twin'],
        size: 25, // m²
        inventory: 20, // Total rooms of this type
        active: true
      },
      {
        id: 'deluxe',
        code: 'DLX',
        name: { pt: 'Deluxe', en: 'Deluxe', es: 'Deluxe' },
        description: { 
          pt: 'Quarto superior com varanda e vista',
          en: 'Superior room with balcony and view',
          es: 'Habitación superior con balcón y vista'
        },
        maxOccupancy: 3,
        maxAdults: 2,
        maxChildren: 1,
        baseRate: 500,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'safe'],
        bedTypes: ['king', 'queen'],
        size: 35,
        inventory: 20,
        active: true
      },
      {
        id: 'suite',
        code: 'STE',
        name: { pt: 'Suíte', en: 'Suite', es: 'Suite' },
        description: { 
          pt: 'Suíte espaçosa com sala de estar separada',
          en: 'Spacious suite with separate living area',
          es: 'Suite espaciosa con sala de estar separada'
        },
        maxOccupancy: 4,
        maxAdults: 2,
        maxChildren: 2,
        baseRate: 800,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'safe', 'jacuzzi', 'living_room'],
        bedTypes: ['king'],
        size: 55,
        inventory: 8,
        active: true
      },
      {
        id: 'presidential',
        code: 'PRE',
        name: { pt: 'Presidencial', en: 'Presidential', es: 'Presidencial' },
        description: { 
          pt: 'Suíte presidencial de luxo com 2 quartos',
          en: 'Luxury presidential suite with 2 bedrooms',
          es: 'Suite presidencial de lujo con 2 dormitorios'
        },
        maxOccupancy: 6,
        maxAdults: 4,
        maxChildren: 2,
        baseRate: 1500,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'safe', 'jacuzzi', 'living_room', 'kitchen', 'butler'],
        bedTypes: ['king'],
        size: 120,
        inventory: 2,
        active: true
      }
    ];

    // Individual rooms (physical units)
    this.rooms = [];
    let roomNumber = 101;
    
    this.roomTypes.forEach(roomType => {
      for (let i = 0; i < roomType.inventory; i++) {
        const floor = Math.floor((roomNumber - 100) / 10);
        this.rooms.push({
          id: `room_${roomNumber}`,
          number: String(roomNumber),
          roomType: roomType.id,
          floor: floor,
          status: 'vacant', // HTNG: vacant, occupied, out_of_order, out_of_service
          cleaningStatus: 'clean', // clean, dirty, cleaning, inspected
          features: roomType.amenities,
          blocked: false,
          blockReason: null,
          notes: '',
          lastUpdated: new Date().toISOString()
        });
        roomNumber++;
        if (roomNumber % 10 === 9) roomNumber += 2; // Skip to next floor
      }
    });

    // Property policies
    this.policies = {
      cancellation: {
        free: 24, // hours before check-in
        partial: 48, // 50% refund
        noShow: 100 // % charged
      },
      children: {
        freeAge: 5, // Children under 5 are free
        maxPerRoom: 2
      },
      payment: {
        deposit: 50, // % required at booking
        methods: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'pix']
      },
      stayRestrictions: {
        minStay: 1,
        maxStay: 30,
        checkInDays: [0, 1, 2, 3, 4, 5, 6], // All days allowed
        checkOutDays: [0, 1, 2, 3, 4, 5, 6]
      }
    };

    this.saveInventory();
  }

  // Get room type by ID
  getRoomType(roomTypeId) {
    return this.roomTypes.find(rt => rt.id === roomTypeId);
  }

  // Get all active room types
  getActiveRoomTypes() {
    return this.roomTypes.filter(rt => rt.active);
  }

  // Get total inventory for a room type
  getTotalInventory(roomTypeId) {
    const roomType = this.getRoomType(roomTypeId);
    return roomType ? roomType.inventory : 0;
  }

  // Get available rooms of a type for a date range
  getAvailableRooms(roomTypeId, checkInDate, checkOutDate, excludeReservationId = null) {
    const total = this.getTotalInventory(roomTypeId);
    const blocked = this.getBlockedRooms(roomTypeId, checkInDate, checkOutDate);
    const reserved = this.getReservedRooms(roomTypeId, checkInDate, checkOutDate, excludeReservationId);
    
    return Math.max(0, total - blocked - reserved);
  }

  // Get blocked rooms (maintenance, out of order, etc)
  getBlockedRooms(roomTypeId, checkInDate, checkOutDate) {
    return this.rooms.filter(room => {
      return room.roomTypeId === roomTypeId && 
             (room.blocked || room.status === 'out_of_order' || room.status === 'maintenance');
    }).length;
  }

  // Get reserved rooms - needs ReservationEngine integration
  getReservedRooms(roomTypeId, checkInDate, checkOutDate, excludeReservationId = null) {
    // This will be called from ReservationEngine
    const engine = window.getReservationEngine(this.propertyId);
    if (!engine) return 0;

    return engine.getReservedCount(roomTypeId, checkInDate, checkOutDate, excludeReservationId);
  }

  // Check if specific dates are available
  isAvailable(roomTypeId, checkInDate, checkOutDate, roomsNeeded = 1, excludeReservationId = null) {
    const available = this.getAvailableRooms(roomTypeId, checkInDate, checkOutDate, excludeReservationId);
    return available >= roomsNeeded;
  }

  // Get availability for all room types in a date range
  getAvailabilityMatrix(startDate, endDate) {
    const matrix = {};
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = this.formatDate(currentDate);
      matrix[dateStr] = {};

      this.roomTypes.forEach(roomType => {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = this.formatDate(nextDay);

        const available = this.getAvailableRooms(roomType.id, dateStr, nextDayStr);
        const total = roomType.inventory;
        
        matrix[dateStr][roomType.id] = {
          available,
          total,
          occupied: total - available,
          occupancy: total > 0 ? Math.round((total - available) / total * 100) : 0
        };
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return matrix;
  }

  // Block/Unblock specific room
  blockRoom(roomId, reason = 'maintenance') {
    const room = this.rooms.find(r => r.id === roomId || r.roomNumber === roomId);
    if (room) {
      room.blocked = true;
      room.blockReason = reason;
      this.saveInventory();
      return true;
    }
    return false;
  }

  unblockRoom(roomId) {
    const room = this.rooms.find(r => r.id === roomId || r.roomNumber === roomId);
    if (room) {
      room.blocked = false;
      room.blockReason = null;
      this.saveInventory();
      return true;
    }
    return false;
  }

  // Update room status
  updateRoomStatus(roomId, status) {
    const validStatuses = ['clean', 'dirty', 'maintenance', 'out_of_order'];
    if (!validStatuses.includes(status)) {
      console.error('[Inventory] Invalid room status:', status);
      return false;
    }

    const room = this.rooms.find(r => r.id === roomId || r.roomNumber === roomId);
    if (room) {
      room.status = status;
      this.saveInventory();
      return true;
    }
    return false;
  }

  // Get rooms by status
  getRoomsByStatus(status) {
    return this.rooms.filter(r => r.status === status);
  }

  // Get occupancy rate for property
  getPropertyOccupancy(date) {
    const dateStr = this.formatDate(new Date(date));
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = this.formatDate(nextDay);

    let totalRooms = 0;
    let occupiedRooms = 0;

    this.roomTypes.forEach(roomType => {
      const total = roomType.inventory;
      const available = this.getAvailableRooms(roomType.id, dateStr, nextDayStr);
      totalRooms += total;
      occupiedRooms += (total - available);
    });

    return {
      total: totalRooms,
      occupied: occupiedRooms,
      available: totalRooms - occupiedRooms,
      occupancyRate: totalRooms > 0 ? Math.round(occupiedRooms / totalRooms * 100) : 0
    };
  }

  // Helper: Format date to YYYY-MM-DD
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Validate booking rules
  validateBooking(roomTypeId, checkInDate, checkOutDate, adults, children) {
    const roomType = this.getRoomType(roomTypeId);
    if (!roomType) {
      return { valid: false, error: 'room_type_not_found' };
    }

    if (!roomType.active) {
      return { valid: false, error: 'room_type_inactive' };
    }

    // Check occupancy limits
    const totalGuests = adults + children;
    if (totalGuests > roomType.maxOccupancy) {
      return { valid: false, error: 'exceeds_max_occupancy', max: roomType.maxOccupancy };
    }

    if (adults > roomType.maxAdults) {
      return { valid: false, error: 'exceeds_max_adults', max: roomType.maxAdults };
    }

    if (children > roomType.maxChildren) {
      return { valid: false, error: 'exceeds_max_children', max: roomType.maxChildren };
    }

    // Check stay restrictions
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights < this.policies.stayRestrictions.minStay) {
      return { valid: false, error: 'below_min_stay', min: this.policies.stayRestrictions.minStay };
    }

    if (nights > this.policies.stayRestrictions.maxStay) {
      return { valid: false, error: 'exceeds_max_stay', max: this.policies.stayRestrictions.maxStay };
    }

    // Check availability
    if (!this.isAvailable(roomTypeId, checkInDate, checkOutDate)) {
      return { valid: false, error: 'no_availability' };
    }

    return { valid: true };
  }

  // Save rooms state
  saveRooms() {
    this.saveInventory();
  }
}

// ============================================
// GLOBAL ACCESSOR
// ============================================
window.hotelInventoryManagers = window.hotelInventoryManagers || {};

window.getHotelInventory = function(propertyId = 'property_default') {
  if (!window.hotelInventoryManagers[propertyId]) {
    window.hotelInventoryManagers[propertyId] = new HotelInventoryManager(propertyId);
  }
  return window.hotelInventoryManagers[propertyId];
};

console.log('[PMS] Hotel Inventory Manager loaded');
