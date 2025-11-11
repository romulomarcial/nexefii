// PMS (Property Management System) - Modular Architecture
// Each module can be sold separately and enabled per property

// Module Registry - All available PMS modules
const PMS_MODULES = {
  // Front Office Category
  reservations: {
    id: 'reservations',
    category: 'frontOffice',
    name: { pt: 'Reservas', en: 'Reservations', es: 'Reservas' },
    description: {
      pt: 'Gestão completa de reservas individuais e de grupos, tarifas dinâmicas, upgrades e cancelamentos',
      en: 'Complete management of individual and group reservations, dynamic rates, upgrades and cancellations',
      es: 'Gestión completa de reservas individuales y grupales, tarifas dinámicas, upgrades y cancelaciones'
    },
    features: ['individual', 'group', 'rates', 'upgrades', 'cancellations', 'modifications'],
    icon: '📅',
    color: '#3b82f6'
  },
  checkInOut: {
    id: 'checkInOut',
    category: 'frontOffice',
    name: { pt: 'Check-in / Check-out', en: 'Check-in / Check-out', es: 'Check-in / Check-out' },
    description: {
      pt: 'Registro de hóspedes, emissão de chaves, pré-autorização, gestão de folio e faturamento',
      en: 'Guest registration, key issuance, pre-authorization, folio management and billing',
      es: 'Registro de huéspedes, emisión de llaves, pre-autorización, gestión de folio y facturación'
    },
    features: ['registration', 'keyCards', 'preAuth', 'folio', 'billing', 'express'],
    icon: '🔑',
    color: '#10b981'
  },
  guestProfile: {
    id: 'guestProfile',
    category: 'frontOffice',
    name: { pt: 'Perfil do Hóspede / CRM', en: 'Guest Profile / CRM', es: 'Perfil del Huésped / CRM' },
    description: {
      pt: 'Histórico completo, preferências, programa de fidelidade e comunicação personalizada',
      en: 'Complete history, preferences, loyalty program and personalized communication',
      es: 'Historial completo, preferencias, programa de fidelidad y comunicación personalizada'
    },
    features: ['history', 'preferences', 'loyalty', 'communication', 'notes', 'vip'],
    icon: '👤',
    color: '#8b5cf6'
  },
  roomAssignment: {
    id: 'roomAssignment',
    category: 'frontOffice',
    name: { pt: 'Alocação de Quartos', en: 'Room Assignment', es: 'Asignación de Habitaciones' },
    description: {
      pt: 'Controle de status de quartos, alocação automática, prioridades VIP e otimização',
      en: 'Room status control, automatic allocation, VIP priorities and optimization',
      es: 'Control de estado de habitaciones, asignación automática, prioridades VIP y optimización'
    },
    features: ['status', 'autoAssign', 'vipPriority', 'optimization', 'blockRooms', 'roomTypes'],
    icon: '🚪',
    color: '#f59e0b'
  },
  concierge: {
    id: 'concierge',
    category: 'frontOffice',
    name: { pt: 'Concierge / Bell Desk', en: 'Concierge / Bell Desk', es: 'Concierge / Bell Desk' },
    description: {
      pt: 'Serviços especiais, controle de bagagens, transporte e solicitações dos hóspedes',
      en: 'Special services, luggage control, transportation and guest requests',
      es: 'Servicios especiales, control de equipaje, transporte y solicitudes de huéspedes'
    },
    features: ['luggage', 'transport', 'specialRequests', 'tickets', 'tours', 'recommendations'],
    icon: '🎩',
    color: '#ec4899'
  }
};

// PMS Module Access Control
class PMSModuleManager {
  constructor() {
    this.storageKey = 'pms_modules_config';
    this.loadConfig();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.config = stored ? JSON.parse(stored) : this.getDefaultConfig();
    } catch (e) {
      console.warn('Failed to load PMS config:', e);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    // Default: all modules enabled for all properties
    return {
      properties: {},
      globalModules: Object.keys(PMS_MODULES)
    };
  }

  saveConfig() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save PMS config:', e);
    }
  }

  // Check if a property has access to a specific PMS module
  hasModuleAccess(propertyKey, moduleId) {
    if (!propertyKey || !moduleId) return false;
    
    // Check property-specific config
    const propConfig = this.config.properties[propertyKey];
    if (propConfig && Array.isArray(propConfig.enabledModules)) {
      return propConfig.enabledModules.includes(moduleId);
    }
    
    // Fallback to global config
    return this.config.globalModules.includes(moduleId);
  }

  // Get all modules accessible by a property
  getPropertyModules(propertyKey) {
    const modules = [];
    Object.keys(PMS_MODULES).forEach(moduleId => {
      if (this.hasModuleAccess(propertyKey, moduleId)) {
        modules.push({
          ...PMS_MODULES[moduleId],
          enabled: true
        });
      }
    });
    return modules;
  }

  // Enable/disable module for a property
  setModuleAccess(propertyKey, moduleId, enabled) {
    if (!this.config.properties[propertyKey]) {
      this.config.properties[propertyKey] = {
        enabledModules: [...this.config.globalModules]
      };
    }
    
    const modules = this.config.properties[propertyKey].enabledModules;
    const idx = modules.indexOf(moduleId);
    
    if (enabled && idx === -1) {
      modules.push(moduleId);
    } else if (!enabled && idx !== -1) {
      modules.splice(idx, 1);
    }
    
    this.saveConfig();
  }

  // Get modules by category
  getModulesByCategory(category) {
    return Object.values(PMS_MODULES).filter(m => m.category === category);
  }

  // Get module info
  getModule(moduleId) {
    return PMS_MODULES[moduleId] || null;
  }

  // Get localized module name
  getModuleName(moduleId, lang = 'pt') {
    const module = this.getModule(moduleId);
    return module ? (module.name[lang] || module.name.pt) : '';
  }

  // Get localized module description
  getModuleDescription(moduleId, lang = 'pt') {
    const module = this.getModule(moduleId);
    return module ? (module.description[lang] || module.description.pt) : '';
  }
}

// Global instance
window.PMSModuleManager = new PMSModuleManager();

// Property configuration enhancement
const PROPERTY_CONFIG_SCHEMA = {
  // Basic Info
  propertyKey: { type: 'string', required: true },
  propertyName: { type: 'string', required: true },
  propertyType: { type: 'select', options: ['hotel', 'resort', 'hostel', 'aparthotel', 'motel', 'pousada'], required: true },
  
  // Location
  address: { type: 'text', required: true },
  city: { type: 'string', required: true },
  state: { type: 'string', required: true },
  country: { type: 'string', required: true },
  zipCode: { type: 'string', required: false },
  timezone: { type: 'select', options: ['America/Sao_Paulo', 'America/New_York', 'Europe/London'], required: true },
  
  // Contact
  phone: { type: 'tel', required: true },
  email: { type: 'email', required: true },
  website: { type: 'url', required: false },
  
  // Capacity & Structure
  totalRooms: { type: 'number', required: true, min: 1 },
  totalFloors: { type: 'number', required: true, min: 1 },
  roomsPerFloor: { type: 'number', required: false, min: 1 },
  
  // Room Distribution (detailed)
  roomDistribution: {
    type: 'array',
    schema: {
      floor: { type: 'number' },
      roomNumbers: { type: 'array' }, // ['101', '102', '103']
      roomTypes: { type: 'object' } // {'101': 'standard', '102': 'deluxe'}
    }
  },
  
  // Room Types & Categories
  roomTypes: {
    type: 'array',
    schema: {
      id: { type: 'string' },
      name: { type: 'object' }, // {pt: 'Standard', en: 'Standard'}
      quantity: { type: 'number' },
      maxOccupancy: { type: 'number' },
      baseRate: { type: 'number' }
    }
  },
  
  // Operational Settings
  checkInTime: { type: 'time', default: '14:00' },
  checkOutTime: { type: 'time', default: '12:00' },
  currency: { type: 'select', options: ['BRL', 'USD', 'EUR'], default: 'BRL' },
  
  // PMS Modules
  enabledPMSModules: { type: 'array', default: [] },
  
  // Features & Amenities
  amenities: { type: 'array', default: [] },
  
  // Staff & Access
  adminUsers: { type: 'array', default: [] },
  
  // Integration
  pmsSystem: { type: 'string', required: false }, // External PMS integration
  channelManager: { type: 'string', required: false },
  
  // Status
  active: { type: 'boolean', default: true },
  createdAt: { type: 'timestamp' },
  updatedAt: { type: 'timestamp' }
};

// Enhanced property data structure
function createPropertyConfig(data) {
  const config = {
    propertyKey: data.propertyKey,
    propertyName: data.propertyName,
    propertyType: data.propertyType || 'hotel',
    
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || 'Brasil',
    zipCode: data.zipCode || '',
    timezone: data.timezone || 'America/Sao_Paulo',
    
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    
    totalRooms: parseInt(data.totalRooms) || 0,
    totalFloors: parseInt(data.totalFloors) || 0,
    roomsPerFloor: parseInt(data.roomsPerFloor) || 0,
    
    roomDistribution: data.roomDistribution || generateRoomDistribution(
      data.totalFloors,
      data.roomsPerFloor,
      data.totalRooms
    ),
    
    roomTypes: data.roomTypes || [
      { id: 'standard', name: { pt: 'Standard', en: 'Standard', es: 'Estándar' }, quantity: 0, maxOccupancy: 2, baseRate: 0 }
    ],
    
    checkInTime: data.checkInTime || '14:00',
    checkOutTime: data.checkOutTime || '12:00',
    currency: data.currency || 'BRL',
    
    enabledPMSModules: data.enabledPMSModules || [],
    amenities: data.amenities || [],
    
    active: data.active !== false,
    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  
  return config;
}

// Generate room distribution based on floors and rooms
function generateRoomDistribution(floors, roomsPerFloor, totalRooms) {
  const distribution = [];
  let roomCount = 0;
  
  for (let f = 1; f <= floors && roomCount < totalRooms; f++) {
    const floor = {
      floor: f,
      roomNumbers: [],
      roomTypes: {}
    };
    
    const roomsInFloor = Math.min(roomsPerFloor, totalRooms - roomCount);
    
    for (let r = 1; r <= roomsInFloor; r++) {
      const roomNumber = `${f}${String(r).padStart(2, '0')}`;
      floor.roomNumbers.push(roomNumber);
      floor.roomTypes[roomNumber] = 'standard'; // Default type
      roomCount++;
    }
    
    distribution.push(floor);
  }
  
  return distribution;
}

// Property storage helper
const PropertyManager = {
  storageKey: 'properties_config',
  
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load properties:', e);
      return [];
    }
  },
  
  get(propertyKey) {
    const all = this.getAll();
    return all.find(p => p.propertyKey === propertyKey) || null;
  },
  
  save(propertyConfig) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.propertyKey === propertyConfig.propertyKey);
    
    if (idx >= 0) {
      all[idx] = { ...propertyConfig, updatedAt: Date.now() };
    } else {
      all.push({ ...propertyConfig, createdAt: Date.now(), updatedAt: Date.now() });
    }
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Failed to save property:', e);
      return false;
    }
  },
  
  delete(propertyKey) {
    const all = this.getAll();
    const filtered = all.filter(p => p.propertyKey !== propertyKey);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Failed to delete property:', e);
      return false;
    }
  }
};

window.PropertyManager = PropertyManager;
