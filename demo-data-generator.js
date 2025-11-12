/**
 * Demo Data Generator - nexefii
 * Gera dados fake realistas para propriedades de demonstraÃ§Ã£o
 * Preenche PMS, reservas, inventÃ¡rio, mÃ©tricas, KPIs e integraÃ§Ãµes
 * Atualiza periodicamente para simular sistema em tempo real
 * 
 * @version 1.0.0
 * @date 2025-11-07
 */

(function() {
  'use strict';

  // ==================== CONFIGURAÃ‡Ã•ES ====================
  const CONFIG = {
    updateInterval: 5 * 60 * 1000, // 5 minutos
    dateRange: 90, // dias para histÃ³rico
    futureRange: 30, // dias para forecast
    guestNames: [
      'JoÃ£o Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
      'Fernanda Lima', 'Roberto Alves', 'Juliana Rodrigues', 'Marcos Pereira', 'Patricia Martins',
      'John Smith', 'Emma Johnson', 'Michael Brown', 'Sophia Davis', 'James Wilson',
      'Olivia Martinez', 'William Garcia', 'Isabella Rodriguez', 'David Lee', 'Mia Anderson'
    ],
    roomTypes: [
      { type: 'standard', name: 'Standard', rate: 350 },
      { type: 'deluxe', name: 'Deluxe', rate: 520 },
      { type: 'suite', name: 'Suite', rate: 890 },
      { type: 'executive', name: 'Executive Suite', rate: 1250 }
    ],
    countries: ['Brasil', 'USA', 'Argentina', 'Chile', 'MÃ©xico', 'ColÃ´mbia', 'CanadÃ¡', 'UK', 'FranÃ§a', 'Espanha'],
    channels: ['Booking.com', 'Expedia', 'Direct', 'Airbnb', 'TripAdvisor', 'Hotels.com', 'Phone', 'Walk-in']
  };

  // ==================== CLASSE PRINCIPAL ====================
  class DemoDataGenerator {
    constructor() {
      this.timers = new Map(); // propertyKey -> intervalId
      this.lastUpdate = new Map(); // propertyKey -> timestamp
    }

    // ==================== MÃ‰TODOS PÃšBLICOS ====================

    /**
     * Insere dados fake completos para uma propriedade
     * @param {string} propertyKey - Chave da propriedade
     * @param {boolean} autoRefresh - Ativar atualizaÃ§Ã£o automÃ¡tica
     */
    insertDemoData(propertyKey, autoRefresh = true) {
      console.log(`[DemoData] Inserindo dados fake para ${propertyKey}...`);
      
      const property = this.getProperty(propertyKey);
      if (!property) {
        console.error(`[DemoData] Propriedade ${propertyKey} nÃ£o encontrada`);
        return { success: false, error: 'property_not_found' };
      }

      // Sistema agora permite inserir dados em QUALQUER propriedade (demo ou nÃ£o)
      console.log(`[DemoData] Gerando dados para: ${property.name} (isDemo: ${property.isDemo || false})`);

      try {
        // Gerar dados para todos os mÃ³dulos
        this.generateReservations(propertyKey, property);
        this.generateInventory(propertyKey, property);
        this.generatePMSMetrics(propertyKey, property);
        this.generateHousekeeping(propertyKey, property);
        this.generateEngineering(propertyKey, property);
        this.generateAlerts(propertyKey, property);
        this.generateGuests(propertyKey, property);

        // Marcar timestamp
        this.lastUpdate.set(propertyKey, Date.now());

        // Configurar auto-refresh
        if (autoRefresh) {
          this.startAutoRefresh(propertyKey);
        }

        console.log(`[DemoData] âœ… Dados inseridos com sucesso para ${propertyKey}`);
        
        // Disparar evento para dashboard
        window.dispatchEvent(new CustomEvent('demoDataUpdated', { 
          detail: { propertyKey, timestamp: Date.now() } 
        }));

        return { 
          success: true, 
          propertyKey, 
          timestamp: Date.now(),
          autoRefresh,
          message: 'Dados fake inseridos com sucesso!'
        };

      } catch (error) {
        console.error(`[DemoData] Erro ao inserir dados:`, error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Limpa dados fake de uma propriedade
     */
    clearDemoData(propertyKey) {
      console.log(`[DemoData] Limpando dados fake de ${propertyKey}...`);
      
      this.stopAutoRefresh(propertyKey);
      
      // Limpar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(propertyKey)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      this.lastUpdate.delete(propertyKey);
      
      console.log(`[DemoData] âœ… Dados limpos: ${keysToRemove.length} chaves removidas`);
      return { success: true, removedKeys: keysToRemove.length };
    }

    /**
     * Inicia atualizaÃ§Ã£o automÃ¡tica periÃ³dica
     */
    startAutoRefresh(propertyKey) {
      // Parar timer existente
      this.stopAutoRefresh(propertyKey);

      const intervalId = setInterval(() => {
        console.log(`[DemoData] Auto-refresh para ${propertyKey}...`);
        this.insertDemoData(propertyKey, false); // NÃ£o reiniciar timer
      }, CONFIG.updateInterval);

      this.timers.set(propertyKey, intervalId);
      console.log(`[DemoData] Auto-refresh iniciado para ${propertyKey} (${CONFIG.updateInterval / 60000} min)`);
    }

    /**
     * Para atualizaÃ§Ã£o automÃ¡tica
     */
    stopAutoRefresh(propertyKey) {
      if (this.timers.has(propertyKey)) {
        clearInterval(this.timers.get(propertyKey));
        this.timers.delete(propertyKey);
        console.log(`[DemoData] Auto-refresh parado para ${propertyKey}`);
      }
    }

    /**
     * Para todos os timers
     */
    stopAllAutoRefresh() {
      this.timers.forEach((intervalId, propertyKey) => {
        clearInterval(intervalId);
        console.log(`[DemoData] Auto-refresh parado para ${propertyKey}`);
      });
      this.timers.clear();
    }

    // ==================== GERADORES DE DADOS ====================

    /**
     * Gera reservas fake (PMS)
     */
    generateReservations(propertyKey, property) {
      const reservations = [];
      const roomCount = property.roomCount || 50;
      const today = new Date();

      // Gerar reservas para 90 dias (passado + futuro)
      for (let dayOffset = -CONFIG.dateRange; dayOffset < CONFIG.futureRange; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);

        // OcupaÃ§Ã£o variÃ¡vel (40% a 95%)
        const baseOccupancy = 0.65;
        const seasonality = Math.sin(dayOffset / 30) * 0.15; // VariaÃ§Ã£o sazonal
        const dayOfWeekFactor = [6, 7].includes(date.getDay()) ? 0.15 : 0; // Fim de semana mais cheio
        const occupancyRate = Math.min(0.95, Math.max(0.40, baseOccupancy + seasonality + dayOfWeekFactor));
        
        const roomsSold = Math.floor(roomCount * occupancyRate);

        // Gerar reservas individuais
        for (let i = 0; i < roomsSold; i++) {
          const stayLength = Math.floor(Math.random() * 4) + 1; // 1-4 noites
          const checkIn = new Date(date);
          const checkOut = new Date(date);
          checkOut.setDate(checkOut.getDate() + stayLength);

          const roomType = CONFIG.roomTypes[Math.floor(Math.random() * CONFIG.roomTypes.length)];
          const rateVariation = (Math.random() * 0.3) - 0.15; // Â±15%
          const dailyRate = Math.round(roomType.rate * (1 + rateVariation));
          const totalRevenue = dailyRate * stayLength;

          const status = dayOffset < 0 ? 'checked_out' : dayOffset === 0 ? 'in_house' : 'confirmed';
          const isNoShow = status === 'confirmed' && Math.random() < 0.02; // 2% no-show

          reservations.push({
            id: `${propertyKey}_res_${date.toISOString().split('T')[0]}_${i}`,
            propertyKey,
            confirmationNumber: `CNF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            guestName: CONFIG.guestNames[Math.floor(Math.random() * CONFIG.guestNames.length)],
            guestEmail: `guest${i}@email.com`,
            guestCountry: CONFIG.countries[Math.floor(Math.random() * CONFIG.countries.length)],
            roomNumber: 100 + i,
            roomType: roomType.type,
            roomTypeName: roomType.name,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            nights: stayLength,
            adults: Math.floor(Math.random() * 2) + 1,
            children: Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0,
            dailyRate,
            totalRevenue,
            status: isNoShow ? 'no_show' : status,
            channel: CONFIG.channels[Math.floor(Math.random() * CONFIG.channels.length)],
            specialRequests: Math.random() < 0.2 ? ['Late check-out', 'High floor', 'Extra pillows'][Math.floor(Math.random() * 3)] : '',
            createdAt: new Date(checkIn.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Salvar no localStorage
      const storageKey = `pms_reservations_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(reservations));
      console.log(`[DemoData] âœ… ${reservations.length} reservas geradas`);
    }

    /**
     * Gera inventÃ¡rio de quartos
     */
    generateInventory(propertyKey, property) {
      const roomCount = property.roomCount || 50;
      const inventory = [];

      for (let i = 1; i <= roomCount; i++) {
        const roomType = CONFIG.roomTypes[i % CONFIG.roomTypes.length];
        const floor = Math.floor((i - 1) / 10) + 1;
        const roomNumber = (floor * 100) + ((i - 1) % 10) + 1;

        // Status: 80% disponÃ­vel, 15% ocupado, 5% manutenÃ§Ã£o
        const rand = Math.random();
        let status = 'available';
        if (rand < 0.15) status = 'occupied';
        else if (rand < 0.20) status = 'maintenance';

        inventory.push({
          id: `${propertyKey}_room_${roomNumber}`,
          propertyKey,
          roomNumber,
          floor,
          roomType: roomType.type,
          roomTypeName: roomType.name,
          baseRate: roomType.rate,
          status,
          cleanStatus: status === 'available' ? 'clean' : status === 'occupied' ? 'dirty' : 'cleaning',
          features: ['Wi-Fi', 'TV', 'AC', 'Minibar'].filter(() => Math.random() > 0.3),
          bedType: ['King', 'Queen', 'Twin'][Math.floor(Math.random() * 3)],
          maxOccupancy: roomType.type === 'suite' ? 4 : 2,
          smoking: false,
          accessible: i % 10 === 1,
          updatedAt: new Date().toISOString()
        });
      }

      const storageKey = `pms_inventory_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(inventory));
      console.log(`[DemoData] âœ… ${inventory.length} quartos gerados`);
    }

    /**
     * Gera mÃ©tricas PMS para dashboard
     */
    generatePMSMetrics(propertyKey, property) {
      const roomCount = property.roomCount || 50;
      const today = new Date();

      // Calcular mÃ©tricas baseadas nas reservas
      const reservations = this.getReservations(propertyKey);
      
      // Hoje
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      
      const todayReservations = reservations.filter(r => {
        const checkIn = new Date(r.checkIn);
        return checkIn >= todayStart && checkIn <= todayEnd;
      });

      const inHouse = reservations.filter(r => r.status === 'in_house').length;
      const checkInsToday = todayReservations.filter(r => new Date(r.checkIn).toDateString() === today.toDateString()).length;
      const checkOutsToday = reservations.filter(r => {
        const checkOut = new Date(r.checkOut);
        return checkOut.toDateString() === today.toDateString();
      }).length;

      const roomsSold = inHouse;
      const roomsAvailable = roomCount - roomsSold;
      const occupancyRate = Math.round((roomsSold / roomCount) * 100);
      
      const todayRevenue = todayReservations.reduce((sum, r) => sum + r.totalRevenue, 0);
      const averageDailyRate = roomsSold > 0 ? Math.round(todayRevenue / roomsSold) : 0;
      const revPAR = Math.round(todayRevenue / roomCount);

      const noShows = reservations.filter(r => r.status === 'no_show' && new Date(r.checkIn).toDateString() === today.toDateString()).length;
      const stayovers = inHouse - checkInsToday;

      // Forecast 7 dias
      const forecastOccupancy = Math.round(occupancyRate + (Math.random() * 10 - 5));
      const forecastRevenue = Math.round(todayRevenue * (1 + (Math.random() * 0.2 - 0.1)));

      // TendÃªncia
      const yesterdayOccupancy = Math.round(occupancyRate - (Math.random() * 10 - 5));
      const occupancyChange = occupancyRate - yesterdayOccupancy;
      const occupancyTrend = occupancyChange > 2 ? 'up' : occupancyChange < -2 ? 'down' : 'stable';

      const metrics = {
        propertyKey,
        date: today.toISOString(),
        totalRooms: roomCount,
        roomsSold,
        roomsAvailable,
        occupancyRate,
        revenue: todayRevenue,
        averageDailyRate,
        revPAR,
        checkInsToday,
        checkOutsToday,
        stayovers,
        noShows,
        inHouse,
        forecastOccupancy,
        forecastRevenue,
        occupancyTrend,
        occupancyChange,
        yesterdayOccupancy,
        alerts: Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0,
        dataSource: 'DEMO_GENERATED',
        updatedAt: new Date().toISOString()
      };

      const storageKey = `pms_metrics_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(metrics));
      console.log(`[DemoData] âœ… MÃ©tricas PMS geradas`);
      
      return metrics;
    }

    /**
     * Gera dados de housekeeping
     */
    generateHousekeeping(propertyKey, property) {
      const inventory = this.getInventory(propertyKey);
      const tasks = [];

      inventory.forEach(room => {
        if (room.cleanStatus !== 'clean' || Math.random() < 0.2) {
          const priority = room.status === 'maintenance' ? 'high' : 'normal';
          const taskType = room.cleanStatus === 'dirty' ? 'checkout_clean' : 'daily_clean';
          
          tasks.push({
            id: `${propertyKey}_hk_${room.roomNumber}_${Date.now()}`,
            propertyKey,
            roomNumber: room.roomNumber,
            floor: room.floor,
            taskType,
            priority,
            status: Math.random() < 0.6 ? 'pending' : 'in_progress',
            assignedTo: `Housekeeping ${Math.floor(Math.random() * 5) + 1}`,
            estimatedTime: Math.floor(Math.random() * 30) + 15, // 15-45 min
            notes: '',
            createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      const storageKey = `housekeeping_tasks_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(tasks));
      console.log(`[DemoData] âœ… ${tasks.length} tarefas de housekeeping geradas`);
    }

    /**
     * Gera ordens de serviÃ§o de engenharia
     */
    generateEngineering(propertyKey, property) {
      const workOrders = [];
      const categories = ['HVAC', 'Plumbing', 'Electrical', 'Furniture', 'Appliances', 'General Maintenance'];
      const priorities = ['low', 'normal', 'high', 'urgent'];

      // 5-15 ordens de serviÃ§o ativas
      const orderCount = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < orderCount; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = ['open', 'in_progress', 'pending_parts', 'completed'][Math.floor(Math.random() * 4)];

        workOrders.push({
          id: `${propertyKey}_wo_${Date.now()}_${i}`,
          propertyKey,
          orderNumber: `WO${Date.now().toString().substr(-6)}${i}`,
          category,
          priority,
          status,
          location: Math.random() < 0.7 ? `Room ${100 + Math.floor(Math.random() * property.roomCount)}` : ['Lobby', 'Pool', 'Restaurant', 'Gym'][Math.floor(Math.random() * 4)],
          description: `${category} issue - ${['Repair needed', 'Not working', 'Maintenance required', 'Inspection'][Math.floor(Math.random() * 4)]}`,
          reportedBy: 'Front Desk',
          assignedTo: status !== 'open' ? `Tech ${Math.floor(Math.random() * 3) + 1}` : null,
          estimatedCost: Math.floor(Math.random() * 500) + 50,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const storageKey = `engineering_orders_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(workOrders));
      console.log(`[DemoData] âœ… ${workOrders.length} ordens de engenharia geradas`);
    }

    /**
     * Gera alertas do sistema
     */
    generateAlerts(propertyKey, property) {
      const alerts = [];
      const alertTypes = [
        { type: 'maintenance', severity: 'warning', message: 'HVAC unit in room 305 needs maintenance' },
        { type: 'reservation', severity: 'info', message: 'VIP guest checking in tomorrow' },
        { type: 'housekeeping', severity: 'warning', message: '3 rooms pending checkout cleaning' },
        { type: 'system', severity: 'error', message: 'PMS integration delay detected' },
        { type: 'occupancy', severity: 'info', message: 'High occupancy expected this weekend' }
      ];

      // 0-3 alertas ativos
      const alertCount = Math.floor(Math.random() * 4);

      for (let i = 0; i < alertCount; i++) {
        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        alerts.push({
          id: `${propertyKey}_alert_${Date.now()}_${i}`,
          propertyKey,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          acknowledged: false,
          createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const storageKey = `alerts_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(alerts));
      console.log(`[DemoData] âœ… ${alerts.length} alertas gerados`);
    }

    /**
     * Gera perfis de hÃ³spedes
     */
    generateGuests(propertyKey, property) {
      const guests = [];
      const reservations = this.getReservations(propertyKey);

      // Criar perfil para cada hÃ³spede Ãºnico
      const uniqueGuests = new Map();
      reservations.forEach(r => {
        if (!uniqueGuests.has(r.guestEmail)) {
          uniqueGuests.set(r.guestEmail, {
            id: `${propertyKey}_guest_${r.guestEmail.replace(/[^a-z0-9]/gi, '')}`,
            propertyKey,
            name: r.guestName,
            email: r.guestEmail,
            phone: `+${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 900000000) + 100000000}`,
            country: r.guestCountry,
            language: ['pt', 'en', 'es'][Math.floor(Math.random() * 3)],
            loyaltyTier: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)],
            totalStays: Math.floor(Math.random() * 10) + 1,
            totalSpent: Math.floor(Math.random() * 50000) + 5000,
            preferences: ['Non-smoking', 'High floor', 'Away from elevator'].filter(() => Math.random() > 0.5),
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      guests.push(...uniqueGuests.values());

      const storageKey = `guests_${propertyKey}`;
      localStorage.setItem(storageKey, JSON.stringify(guests));
      console.log(`[DemoData] âœ… ${guests.length} perfis de hÃ³spedes gerados`);
    }

    // ==================== MÃ‰TODOS AUXILIARES ====================

    getProperty(propertyKey) {
      if (window.NexefiiProps && typeof window.NexefiiProps.getProperty === 'function') {
        return window.NexefiiProps.getProperty(propertyKey);
      }
      return null;
    }

    getReservations(propertyKey) {
      try {
        const data = localStorage.getItem(`pms_reservations_${propertyKey}`);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    getInventory(propertyKey) {
      try {
        const data = localStorage.getItem(`pms_inventory_${propertyKey}`);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    /**
     * ObtÃ©m status de uma propriedade demo
     */
    getDemoStatus(propertyKey) {
      const hasData = !!localStorage.getItem(`pms_metrics_${propertyKey}`);
      const lastUpdate = this.lastUpdate.get(propertyKey);
      const isAutoRefreshActive = this.timers.has(propertyKey);

      return {
        propertyKey,
        hasData,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
        isAutoRefreshActive,
        updateInterval: isAutoRefreshActive ? CONFIG.updateInterval / 60000 : null // em minutos
      };
    }
  }

  // ==================== EXPORTAR ====================
  window.DemoDataGenerator = new DemoDataGenerator();
  console.log('[DemoData] ðŸŽ­ Demo Data Generator carregado');

})();

