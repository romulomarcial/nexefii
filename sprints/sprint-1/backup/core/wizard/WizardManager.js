/**
 * NEXEFII Implementation Wizard Manager
 * 
 * Manages the 6-step property provisioning wizard:
 * 1. Basic Info (name, slug, icon)
 * 2. Property Details (type, rooms count, address)
 * 3. Room Configuration (categories, pricing)
 * 4. Settings (currency, timezone, language)
 * 5. Seed Data (sample rooms, guests)
 * 6. Review & Create
 * 
 * @version 1.0.0
 */

class WizardManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 7;
    this.data = {
      // Step 1: Basic Info
      name: '',
      slug: '',
      icon: '🏨',
      description: '',
      
      // Step 2: Property Details
      type: 'hotel', // hotel, resort, hostel, pousada
      roomsCount: 0,
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Brasil'
      },
      
      // Step 3: Room Configuration
      roomCategories: [],
      
      // Step 4: Settings
      settings: {
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        checkInTime: '14:00',
        checkOutTime: '12:00'
      },
      
      // Step 5: Seed Data
      seedData: {
        createSampleRooms: true,
        createSampleGuests: true,
        createSampleReservations: false
      },
      
      // Step 2.5: Modules
      modules: []
    };
    
    this.validationErrors = {};
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateStep(this.currentStep)) {
        this.currentStep++;
        return true;
      }
      return false;
    }
    return false;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  goToStep(step) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      return true;
    }
    return false;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  validateStep(step) {
    this.validationErrors = {};
    switch(step) {
      case 1:
        return this.validateBasicInfo();
      case 2:
        return this.validatePropertyDetails();
      case 3:
        return true; // Module selection has no validation
      case 4:
        return this.validateRoomConfiguration();
      case 5:
        return this.validateSettings();
      case 6:
        return this.validateSeedData();
      case 7:
        return true; // Review step has no validation
      default:
        return true;
    }
  }

  validateBasicInfo() {
    let valid = true;

    // Name is required
    if (!this.data.name || this.data.name.trim().length === 0) {
      this.validationErrors.name = 'Nome da propriedade é obrigatório';
      valid = false;
    } else if (this.data.name.length < 3) {
      this.validationErrors.name = 'Nome deve ter pelo menos 3 caracteres';
      valid = false;
    }

    // Slug is required and must be valid
    if (!this.data.slug || this.data.slug.trim().length === 0) {
      this.validationErrors.slug = 'Slug é obrigatório';
      valid = false;
    } else if (!/^[a-z0-9-]+$/.test(this.data.slug)) {
      this.validationErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
      valid = false;
    } else if (this.data.slug.length < 3) {
      this.validationErrors.slug = 'Slug deve ter pelo menos 3 caracteres';
      valid = false;
    }

    // Icon is required
    if (!this.data.icon || this.data.icon.trim().length === 0) {
      this.validationErrors.icon = 'Selecione um ícone';
      valid = false;
    }

    return valid;
  }

  validatePropertyDetails() {
    let valid = true;

    // Type is required
    if (!this.data.type) {
      this.validationErrors.type = 'Tipo de propriedade é obrigatório';
      valid = false;
    }

    // Rooms count must be positive
    if (!this.data.roomsCount || this.data.roomsCount <= 0) {
      this.validationErrors.roomsCount = 'Número de quartos deve ser maior que zero';
      valid = false;
    } else if (this.data.roomsCount > 1000) {
      this.validationErrors.roomsCount = 'Número de quartos não pode exceder 1000';
      valid = false;
    }

    // Address validation (optional but if provided, must be valid)
    if (this.data.address.city && this.data.address.city.length < 2) {
      this.validationErrors.city = 'Nome da cidade inválido';
      valid = false;
    }

    return valid;
  }

  validateRoomConfiguration() {
    let valid = true;

    // At least one room category required
    if (!this.data.roomCategories || this.data.roomCategories.length === 0) {
      this.validationErrors.roomCategories = 'Adicione pelo menos uma categoria de quarto';
      valid = false;
    } else {
      // Validate each category
      this.data.roomCategories.forEach((cat, idx) => {
        if (!cat.name || cat.name.trim().length === 0) {
          this.validationErrors[`category_${idx}_name`] = 'Nome da categoria é obrigatório';
          valid = false;
        }
        if (!cat.price || cat.price <= 0) {
          this.validationErrors[`category_${idx}_price`] = 'Preço deve ser maior que zero';
          valid = false;
        }
        if (!cat.count || cat.count <= 0) {
          this.validationErrors[`category_${idx}_count`] = 'Quantidade deve ser maior que zero';
          valid = false;
        }
      });

      // Total rooms must match roomsCount
      const totalRooms = this.data.roomCategories.reduce((sum, cat) => sum + (cat.count || 0), 0);
      if (totalRooms !== this.data.roomsCount) {
        this.validationErrors.totalRooms = `Total de quartos (${totalRooms}) deve ser igual a ${this.data.roomsCount}`;
        valid = false;
      }
    }

    return valid;
  }

  validateSettings() {
    let valid = true;

    // Currency is required
    if (!this.data.settings.currency) {
      this.validationErrors.currency = 'Moeda é obrigatória';
      valid = false;
    }

    // Timezone is required
    if (!this.data.settings.timezone) {
      this.validationErrors.timezone = 'Fuso horário é obrigatório';
      valid = false;
    }

    // Check-in/out times validation
    if (!this.data.settings.checkInTime) {
      this.validationErrors.checkInTime = 'Horário de check-in é obrigatório';
      valid = false;
    }

    if (!this.data.settings.checkOutTime) {
      this.validationErrors.checkOutTime = 'Horário de check-out é obrigatório';
      valid = false;
    }

    return valid;
  }

  validateSeedData() {
    // Seed data step has no validation (all optional)
    return true;
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  updateData(field, value) {
    // Support nested fields like "address.city"
    const keys = field.split('.');
    let obj = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;

    // Auto-generate slug from name
    if (field === 'name') {
      this.data.slug = this.generateSlug(value);
    }
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/-+/g, '-'); // Multiple hyphens to single
  }

  addRoomCategory(category) {
    this.data.roomCategories.push({
      name: category.name || '',
      code: category.code || '',
      price: category.price || 0,
      count: category.count || 0,
      capacity: category.capacity || 2,
      amenities: category.amenities || []
    });
  }

  removeRoomCategory(index) {
    if (index >= 0 && index < this.data.roomCategories.length) {
      this.data.roomCategories.splice(index, 1);
    }
  }

  updateRoomCategory(index, field, value) {
    if (index >= 0 && index < this.data.roomCategories.length) {
      this.data.roomCategories[index][field] = value;
    }
  }

  // ============================================================================
  // Property Creation
  // ============================================================================

  async createProperty() {
    console.log('[Wizard] Creating property...', this.data);

    // Validate all steps
    for (let step = 1; step <= 6; step++) {
      if (!this.validateStep(step)) {
        console.error('[Wizard] Validation failed at step', step, this.validationErrors);
        throw new Error(`Validação falhou no passo ${step}`);
      }
    }

    // Create property key
    const propertyKey = this.data.slug;

    // Initialize PropertyDatabase
    const db = new PropertyDatabase(propertyKey);

    // Create property metadata
    const property = {
      id: Date.now(),
      key: propertyKey,
      slug: this.data.slug,
      name: this.data.name,
      icon: this.data.icon,
      description: this.data.description,
      type: this.data.type,
      address: this.data.address,
      settings: this.data.settings,
      createdAt: new Date().toISOString(),
      stats: {
        rooms: this.data.roomsCount,
        occupancy: 0,
        reservations: 0
      }
    };

    // Save property info
    await db.set('_meta', 'property', property);

    // Create room categories
    for (const category of this.data.roomCategories) {
      await db.set('room_categories', category.code || category.name.toLowerCase(), category);
    }

    // Generate seed data if requested
    if (this.data.seedData.createSampleRooms) {
      await this.createSampleRooms(db);
    }

    if (this.data.seedData.createSampleGuests) {
      await this.createSampleGuests(db);
    }

    if (this.data.seedData.createSampleReservations) {
      await this.createSampleReservations(db);
    }

    // Add property to user's properties list
    await this.addPropertyToUser(property);

    console.log('[Wizard] Property created successfully:', property);

    return property;
  }

  async createSampleRooms(db) {
    let roomNumber = 101;

    for (const category of this.data.roomCategories) {
      for (let i = 0; i < category.count; i++) {
        const room = {
          number: roomNumber,
          category: category.name,
          status: 'available', // available, occupied, maintenance, cleaning
          price: category.price,
          capacity: category.capacity,
          amenities: category.amenities || [],
          floor: Math.floor(roomNumber / 100)
        };

        await db.set('rooms', `room-${roomNumber}`, room);
        roomNumber++;
      }
    }

    console.log('[Wizard] Created sample rooms');
  }

  async createSampleGuests(db) {
    const sampleGuests = [
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        document: '123.456.789-00',
        nationality: 'Brasileiro'
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(21) 99876-5432',
        document: '987.654.321-00',
        nationality: 'Brasileiro'
      },
      {
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '(31) 97654-3210',
        document: '456.789.123-00',
        nationality: 'Brasileiro'
      }
    ];

    for (let i = 0; i < sampleGuests.length; i++) {
      await db.set('guests', `guest-${i + 1}`, sampleGuests[i]);
    }

    console.log('[Wizard] Created sample guests');
  }

  async createSampleReservations(db) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleReservations = [
      {
        guestId: 'guest-1',
        guestName: 'João Silva',
        roomNumber: 101,
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: nextWeek.toISOString().split('T')[0],
        status: 'confirmed',
        totalPrice: this.data.roomCategories[0]?.price * 6 || 900
      }
    ];

    for (let i = 0; i < sampleReservations.length; i++) {
      await db.set('reservations', `res-${i + 1}`, sampleReservations[i]);
    }

    console.log('[Wizard] Created sample reservations');
  }

  async addPropertyToUser(property) {
    // Get current user session
    const sessionData = localStorage.getItem('nexefii_session');
    
    if (sessionData) {
      const user = JSON.parse(sessionData);
      
      // Add property to user's properties
      if (!user.properties) {
        user.properties = [];
      }
      
      user.properties.push({
        id: property.id,
        key: property.key,
        slug: property.slug,
        name: property.name,
        icon: property.icon,
        description: property.description,
        stats: property.stats
      });
      
      // Save updated user session
      localStorage.setItem('nexefii_session', JSON.stringify(user));
      
      console.log('[Wizard] Property added to user session');
    }
  }

  // ============================================================================
  // Templates & Presets
  // ============================================================================

  applyTemplate(templateName) {
    switch(templateName) {
      case 'small-hotel':
        this.applySmallHotelTemplate();
        break;
      case 'medium-hotel':
        this.applyMediumHotelTemplate();
        break;
      case 'resort':
        this.applyResortTemplate();
        break;
      case 'hostel':
        this.applyHostelTemplate();
        break;
      default:
        console.warn('[Wizard] Unknown template:', templateName);
    }
  }

  applySmallHotelTemplate() {
    this.data.type = 'hotel';
    this.data.roomsCount = 20;
    this.data.roomCategories = [
      { name: 'Standard', code: 'STD', price: 200, count: 12, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado'] },
      { name: 'Deluxe', code: 'DLX', price: 350, count: 6, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Frigobar'] },
      { name: 'Suite', code: 'STE', price: 500, count: 2, capacity: 3, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Frigobar', 'Jacuzzi'] }
    ];
  }

  applyMediumHotelTemplate() {
    this.data.type = 'hotel';
    this.data.roomsCount = 50;
    this.data.roomCategories = [
      { name: 'Standard', code: 'STD', price: 250, count: 30, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado'] },
      { name: 'Deluxe', code: 'DLX', price: 400, count: 15, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Frigobar'] },
      { name: 'Suite', code: 'STE', price: 600, count: 5, capacity: 3, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Frigobar', 'Jacuzzi'] }
    ];
  }

  applyResortTemplate() {
    this.data.type = 'resort';
    this.data.roomsCount = 100;
    this.data.roomCategories = [
      { name: 'Standard', code: 'STD', price: 400, count: 60, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Varanda'] },
      { name: 'Deluxe', code: 'DLX', price: 650, count: 25, capacity: 3, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Varanda', 'Vista Mar'] },
      { name: 'Suite Premium', code: 'PRM', price: 900, count: 10, capacity: 4, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Varanda', 'Vista Mar', 'Jacuzzi'] },
      { name: 'Villa', code: 'VLA', price: 1500, count: 5, capacity: 6, amenities: ['Wi-Fi', 'TV', 'Ar Condicionado', 'Piscina Privada', 'Cozinha'] }
    ];
  }

  applyHostelTemplate() {
    this.data.type = 'hostel';
    this.data.roomsCount = 30;
    this.data.roomCategories = [
      { name: 'Dormitório 4 camas', code: 'DRM4', price: 60, count: 10, capacity: 4, amenities: ['Wi-Fi', 'Armários'] },
      { name: 'Dormitório 6 camas', code: 'DRM6', price: 50, count: 10, capacity: 6, amenities: ['Wi-Fi', 'Armários'] },
      { name: 'Quarto Privado', code: 'PRV', price: 150, count: 10, capacity: 2, amenities: ['Wi-Fi', 'TV', 'Banheiro Privado'] }
    ];
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getProgress() {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  isFirstStep() {
    return this.currentStep === 1;
  }

  isLastStep() {
    return this.currentStep === this.totalSteps;
  }

  reset() {
    this.currentStep = 1;
    this.data = {
      name: '',
      slug: '',
      icon: '🏨',
      description: '',
      type: 'hotel',
      roomsCount: 0,
      address: { street: '', city: '', state: '', zip: '', country: 'Brasil' },
      roomCategories: [],
      settings: {
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        checkInTime: '14:00',
        checkOutTime: '12:00'
      },
      seedData: {
        createSampleRooms: true,
        createSampleGuests: true,
        createSampleReservations: false
      },
      modules: []
    };
    this.validationErrors = {};
  }

  getData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  getValidationErrors() {
    return this.validationErrors;
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.WizardManager = WizardManager;
}
