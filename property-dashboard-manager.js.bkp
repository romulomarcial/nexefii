/**
 * Property Dashboard Manager
 * Sistema de gerenciamento de dashboard com foco em:
 * - Performance (cache, lazy loading)
 * - Escalabilidade (suporte a múltiplas propriedades)
 * - Segurança (sanitização, validação)
 * - UX (comparativos, métricas)
 */

(function() {
  'use strict';

  // ========================================
  // SECURITY & VALIDATION
  // ========================================

  const SecurityManager = {
    // Sanitiza strings para prevenir XSS
    sanitizeHTML: function(str) {
      if (typeof str !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    // Valida se propriedade tem todos os dados obrigatórios
    validatePropertyData: function(property) {
      const required = ['key', 'name', 'modulesPurchased', 'userCapacity', 'deployed', 'active'];
      const missing = required.filter(field => !property.hasOwnProperty(field));
      
      if (missing.length > 0) {
        console.warn(`Property ${property.key} missing fields:`, missing);
        return false;
      }

      // Valida tipos
      if (typeof property.name !== 'string' || property.name.trim() === '') return false;
      if (!Array.isArray(property.modulesPurchased) || property.modulesPurchased.length === 0) return false;
      if (typeof property.deployed !== 'boolean') return false;
      if (typeof property.active !== 'boolean') return false;

      return true;
    },

    // Valida permissões do usuário
    validateUserPermissions: function(user, propertyKey) {
      if (!user) return false;
      
      // Master e Admin têm acesso a tudo
      if (user.role === 'master' || user.role === 'admin') return true;
      
      // Verifica se usuário tem acesso específico à propriedade
      if (user.properties && Array.isArray(user.properties)) {
        return user.properties.includes(propertyKey);
      }
      
      return false;
    }
  };

  // ========================================
  // CACHE MANAGER
  // ========================================

  const CacheManager = {
    cache: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutos

    set: function(key, value) {
      this.cache.set(key, {
        value: value,
        timestamp: Date.now()
      });
    },

    get: function(key) {
      const item = this.cache.get(key);
      if (!item) return null;
      
      // Verifica se expirou
      if (Date.now() - item.timestamp > this.ttl) {
        this.cache.delete(key);
        return null;
      }
      
      return item.value;
    },

    clear: function() {
      this.cache.clear();
    },

    invalidate: function(pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  };

  // ========================================
  // DATA MANAGER
  // ========================================

  const DataManager = {
    // Carrega propriedades do localStorage
    loadProperties: function() {
      const cacheKey = 'properties_all';
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;

      try {
        const raw = localStorage.getItem('iluxsys_properties');
        if (!raw) return {};
        
        const properties = JSON.parse(raw);
        CacheManager.set(cacheKey, properties);
        return properties;
      } catch (e) {
        console.error('Error loading properties:', e);
        return {};
      }
    },

    // Carrega usuário atual
    loadCurrentUser: function() {
      const cacheKey = 'current_user';
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;

      try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return null;
        
        const user = JSON.parse(raw);
        CacheManager.set(cacheKey, user);
        return user;
      } catch (e) {
        console.error('Error loading current user:', e);
        return null;
      }
    },

    // Filtra propriedades que o usuário tem permissão
    getAuthorizedProperties: function(user) {
      const allProperties = this.loadProperties();
      const authorized = [];

      for (const key in allProperties) {
        const property = allProperties[key];
        
        // Verifica se propriedade está ativa, implantada e completa
        if (!property.active || !property.deployed) continue;
        if (!SecurityManager.validatePropertyData(property)) continue;
        if (!SecurityManager.validateUserPermissions(user, key)) continue;

        authorized.push(property);
      }

      return authorized;
    },

    // Carrega métricas simuladas (em produção, viria de API do PMS)
    loadPropertyMetrics: function(propertyKey) {
      const cacheKey = `metrics_${propertyKey}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;

      // PRIORIDADE 1: Verificar se existem dados demo gerados
      const demoMetrics = localStorage.getItem(`pms_metrics_${propertyKey}`);
      if (demoMetrics) {
        try {
          const metrics = JSON.parse(demoMetrics);
          console.log(`[Dashboard] Usando métricas DEMO para ${propertyKey}`);
          CacheManager.set(cacheKey, metrics);
          return metrics;
        } catch (e) {
          console.warn(`[Dashboard] Erro ao parsear métricas demo:`, e);
        }
      }

      // PRIORIDADE 2: Simulação de métricas do PMS (fallback)
      console.log(`[Dashboard] Usando métricas SIMULADAS para ${propertyKey}`);
      const properties = this.loadProperties();
      const property = properties[propertyKey];
      const roomCount = property?.roomCount || 50;

      const occupancyRate = Math.floor(Math.random() * 40) + 60; // 60-100%
      const roomsSold = Math.floor(roomCount * occupancyRate / 100);
      const roomsAvailable = roomCount - roomsSold;

      // Métricas avançadas do PMS
      const averageDailyRate = Math.floor(Math.random() * 200) + 300; // ADR: R$ 300-500
      const revenue = roomsSold * averageDailyRate;
      const revPAR = Math.floor(revenue / roomCount); // Revenue Per Available Room
      
      // Métricas de forecast
      const forecastOccupancy = Math.min(100, occupancyRate + Math.floor(Math.random() * 10));
      const forecastRevenue = Math.floor(revenue * 1.15); // +15% estimado

      // Métricas operacionais (difíceis de ver a olho nu)
      const checkInsToday = Math.floor(roomsSold * 0.3); // 30% check-in hoje
      const checkOutsToday = Math.floor(roomsSold * 0.25); // 25% check-out hoje
      const stayovers = roomsSold - checkOutsToday; // Hóspedes que permanecem
      const noShows = Math.floor(Math.random() * 3); // No-shows
      const earlyCheckouts = Math.floor(Math.random() * 2); // Saídas antecipadas

      // Análise de tendência (comparativo com ontem)
      const yesterdayOccupancy = occupancyRate - Math.floor(Math.random() * 10 - 5);
      const occupancyTrend = occupancyRate > yesterdayOccupancy ? 'up' : 
                             occupancyRate < yesterdayOccupancy ? 'down' : 'stable';

      const metrics = {
        // Métricas básicas
        occupancyRate,
        totalRooms: roomCount,
        roomsSold,
        roomsAvailable,
        revenue,
        
        // Métricas avançadas do PMS
        adr: averageDailyRate, // Average Daily Rate
        revPAR, // Revenue Per Available Room
        
        // Forecast
        forecastOccupancy,
        forecastRevenue,
        
        // Operacionais (insights difíceis de visualizar)
        checkInsToday,
        checkOutsToday,
        stayovers,
        noShows,
        earlyCheckouts,
        
        // Tendências
        occupancyTrend,
        yesterdayOccupancy,
        occupancyChange: occupancyRate - yesterdayOccupancy,
        
        // Alertas
        alerts: noShows + earlyCheckouts + Math.floor(Math.random() * 5),
        
        // Metadata
        lastUpdate: new Date().toISOString(),
        dataSource: 'PMS_SIMULATION' // Em produção: 'PMS_API'
      };

      CacheManager.set(cacheKey, metrics);
      return metrics;
    },

    // Carrega dados de clima (OpenWeatherMap API)
    loadWeatherData: async function(propertyKey) {
      const cacheKey = `weather_${propertyKey}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) return cached;

      const properties = this.loadProperties();
      const property = properties[propertyKey];
      
      if (!property?.location?.coordinates) {
        return this.getDefaultWeather();
      }

      try {
        // Em produção, usar sua própria API key do OpenWeatherMap
        // const API_KEY = 'SUA_API_KEY_AQUI';
        // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=pt_br`;
        
        // Por enquanto, retornar dados simulados baseados na localização
        const weather = this.getSimulatedWeather(property.location);
        CacheManager.set(cacheKey, weather);
        return weather;
      } catch (e) {
        console.error('Error loading weather:', e);
        return this.getDefaultWeather();
      }
    },

    // Clima simulado baseado na localização
    getSimulatedWeather: function(location) {
      // Simulação baseada em clima típico da região
      const isTropical = location.coordinates.lat > -30 && location.coordinates.lat < 30;
      const isUS = location.country === 'USA';
      
      const temp = isTropical ? 
        Math.floor(Math.random() * 10) + 24 : // 24-34°C
        Math.floor(Math.random() * 15) + 15;  // 15-30°C
      
      const conditions = ['clear', 'clouds', 'rain', 'partly-cloudy'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        temp: isUS ? Math.floor(temp * 9/5 + 32) : temp, // Fahrenheit para US
        unit: isUS ? 'F' : 'C',
        condition: condition,
        description: this.getWeatherDescription(condition),
        humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        icon: this.getWeatherIcon(condition)
      };
    },

    getDefaultWeather: function() {
      return {
        temp: 22,
        unit: 'C',
        condition: 'clear',
        description: 'Ensolarado',
        humidity: 60,
        windSpeed: 10,
        icon: '☀️'
      };
    },

    getWeatherDescription: function(condition) {
      const descriptions = {
        'clear': 'Ensolarado',
        'clouds': 'Nublado',
        'rain': 'Chuvoso',
        'partly-cloudy': 'Parcialmente nublado'
      };
      return descriptions[condition] || 'Bom tempo';
    },

    getWeatherIcon: function(condition) {
      const icons = {
        'clear': '☀️',
        'clouds': '☁️',
        'rain': '🌧️',
        'partly-cloudy': '⛅'
      };
      return icons[condition] || '🌤️';
    }
  };

  // ========================================
  // METRICS CALCULATOR
  // ========================================

  const MetricsCalculator = {
    // Calcula comparativos entre propriedades com KPIs avançados do PMS
    calculateComparative: function(properties) {
      if (!properties || properties.length === 0) return null;

      const metricsArray = properties.map(prop => ({
        property: prop,
        metrics: DataManager.loadPropertyMetrics(prop.key)
      }));

      // Calcula totais
      const totals = metricsArray.reduce((acc, item) => {
        acc.totalRooms += item.metrics.totalRooms;
        acc.roomsSold += item.metrics.roomsSold;
        acc.roomsAvailable += item.metrics.roomsAvailable;
        acc.revenue += item.metrics.revenue;
        acc.alerts += item.metrics.alerts;
        acc.checkInsToday += item.metrics.checkInsToday;
        acc.checkOutsToday += item.metrics.checkOutsToday;
        acc.stayovers += item.metrics.stayovers;
        acc.noShows += item.metrics.noShows;
        acc.forecastRevenue += item.metrics.forecastRevenue;
        acc.adrSum += item.metrics.adr;
        acc.revPARSum += item.metrics.revPAR;
        return acc;
      }, {
        totalRooms: 0,
        roomsSold: 0,
        roomsAvailable: 0,
        revenue: 0,
        alerts: 0,
        checkInsToday: 0,
        checkOutsToday: 0,
        stayovers: 0,
        noShows: 0,
        forecastRevenue: 0,
        adrSum: 0,
        revPARSum: 0
      });

      // Calcula médias
      const count = metricsArray.length;
      const averages = {
        occupancyRate: Math.floor((totals.roomsSold / totals.totalRooms) * 100),
        adr: Math.floor(totals.adrSum / count),
        revPAR: Math.floor(totals.revPARSum / count),
        forecastOccupancy: metricsArray.reduce((sum, item) => 
          sum + item.metrics.forecastOccupancy, 0) / count
      };

      // Encontra melhor e pior desempenho
      const sorted = [...metricsArray].sort((a, b) => 
        b.metrics.occupancyRate - a.metrics.occupancyRate
      );
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      return {
        totals,
        averages,
        best,
        worst,
        properties: metricsArray
      };
    },

    // Formata valor monetário
    formatCurrency: function(value, locale = 'pt-BR', currency = 'BRL') {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    },

    // Formata percentual
    formatPercent: function(value) {
      return `${Math.floor(value)}%`;
    }
  };

  // ========================================
  // UI RENDERER
  // ========================================

  const UIRenderer = {
    // Renderiza card de propriedade com KPIs do PMS
    renderPropertyCard: async function(property, metrics) {
      const name = SecurityManager.sanitizeHTML(property.name);
  const imageUrl = SecurityManager.sanitizeHTML(property.imageUrl || 'assets/images/default-hotel-1.jpg');
      
      // Calcula classes de status
      const occClass = metrics.occupancyRate >= 80 ? 'high' : 
                       metrics.occupancyRate >= 60 ? 'medium' : 'low';

      // Carrega dados de clima
      const weather = await DataManager.loadWeatherData(property.key);

      // Indicador de tendência
      const trendIcon = metrics.occupancyTrend === 'up' ? '↗️' : 
                        metrics.occupancyTrend === 'down' ? '↘️' : '→';
      const trendClass = metrics.occupancyTrend === 'up' ? 'trend-up' : 
                         metrics.occupancyTrend === 'down' ? 'trend-down' : 'trend-stable';

      return `
        <div class="hotel-card" data-property-key="${property.key}">
          <img class="thumb" src="${imageUrl}" alt="${name}" loading="lazy">
          
          <!-- Badge de clima -->
          <div class="weather-badge">
            <span class="weather-icon">${weather.icon}</span>
            <span class="weather-temp">${weather.temp}°${weather.unit}</span>
          </div>

          <!-- Indicador de ocupação -->
          <div class="occupancy-badge ${occClass}">
            <span class="occupancy-value">${metrics.occupancyRate}%</span>
            <span class="occupancy-trend ${trendClass}">${trendIcon}</span>
          </div>

          <div class="hotel-body">
            <div class="hotel-header">
              <div class="hotel-title">${name}</div>
              <div class="hotel-location">
                <span>📍</span>
                <span>${property.location.city}, ${property.location.state}</span>
              </div>
            </div>

            <!-- KPIs Principais do PMS -->
            <div class="pms-kpis">
              <div class="kpi-item">
                <span class="kpi-icon">💰</span>
                <div class="kpi-content">
                  <span class="kpi-label" data-i18n="dashboard.kpi.revenue">Receita Hoje</span>
                  <span class="kpi-value">${MetricsCalculator.formatCurrency(metrics.revenue)}</span>
                </div>
              </div>

              <div class="kpi-item">
                <span class="kpi-icon">🛏️</span>
                <div class="kpi-content">
                  <span class="kpi-label" data-i18n="dashboard.kpi.rooms">Quartos</span>
                  <span class="kpi-value">${metrics.roomsSold}/${metrics.totalRooms}</span>
                  <span class="kpi-detail">${metrics.roomsAvailable} disponíveis</span>
                </div>
              </div>

              <div class="kpi-item">
                <span class="kpi-icon">�</span>
                <div class="kpi-content">
                  <span class="kpi-label">ADR / RevPAR</span>
                  <span class="kpi-value">${MetricsCalculator.formatCurrency(metrics.adr)}</span>
                  <span class="kpi-detail">${MetricsCalculator.formatCurrency(metrics.revPAR)}</span>
                </div>
              </div>

              <!-- Insights Operacionais (difíceis de ver a olho nu) -->
              <div class="kpi-item operational">
                <span class="kpi-icon">�</span>
                <div class="kpi-content">
                  <span class="kpi-label" data-i18n="dashboard.kpi.operations">Operações Hoje</span>
                  <span class="kpi-value">${metrics.checkInsToday} check-ins • ${metrics.checkOutsToday} check-outs</span>
                  <span class="kpi-detail">${metrics.stayovers} stayovers${metrics.noShows > 0 ? ` • ${metrics.noShows} no-shows` : ''}</span>
                </div>
              </div>

              ${metrics.alerts > 0 ? `
              <div class="kpi-item alert">
                <span class="kpi-icon">⚠️</span>
                <div class="kpi-content">
                  <span class="kpi-label" data-i18n="dashboard.kpi.alerts">Alertas Ativos</span>
                  <span class="kpi-value">${metrics.alerts}</span>
                </div>
              </div>
              ` : ''}
            </div>

            <!-- Forecast -->
            <div class="forecast-section">
              <div class="forecast-label">
                <span>📈</span>
                <span data-i18n="dashboard.forecast">Previsão (7 dias)</span>
              </div>
              <div class="forecast-metrics">
                <div class="forecast-item">
                  <span class="forecast-metric">Ocupação: ${metrics.forecastOccupancy}%</span>
                  <span class="forecast-change ${metrics.forecastOccupancy > metrics.occupancyRate ? 'positive' : 'negative'}">
                    ${metrics.forecastOccupancy > metrics.occupancyRate ? '+' : ''}${metrics.forecastOccupancy - metrics.occupancyRate}%
                  </span>
                </div>
                <div class="forecast-item">
                  <span class="forecast-metric">Receita: ${MetricsCalculator.formatCurrency(metrics.forecastRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" onclick="PropertyDashboard.openProperty('${property.key}')">
              <span data-i18n="dashboard.openControl">Abrir Controle</span>
            </button>
            <button class="btn secondary" onclick="PropertyDashboard.openAutomation('${property.key}')">
              <span data-i18n="dashboard.openAutomation">Central Virtual de Automação</span>
            </button>
          </div>
        </div>
      `;
    },

    // Renderiza dashboard comparativo com KPIs do PMS
    renderComparative: function(comparative) {
      if (!comparative) return '';

      const { totals, averages, best, worst } = comparative;

      return `
        <div class="comparative-dashboard-pms">
          <h3 data-i18n="dashboard.comparative.title">📊 KPIs Consolidados - Todas as Propriedades</h3>
          
          <div class="kpi-grid-comparative">
            <!-- Ocupação -->
            <div class="kpi-card">
              <div class="kpi-card-icon">📊</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.avgOccupancy">Ocupação Média</div>
              <div class="kpi-card-value">${averages.occupancyRate}%</div>
              <div class="kpi-card-detail">${totals.roomsSold} quartos ocupados de ${totals.totalRooms}</div>
            </div>

            <!-- Receita Total -->
            <div class="kpi-card revenue">
              <div class="kpi-card-icon">💰</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.totalRevenue">Receita Total Hoje</div>
              <div class="kpi-card-value">${MetricsCalculator.formatCurrency(totals.revenue)}</div>
              <div class="kpi-card-detail">ADR Médio: ${MetricsCalculator.formatCurrency(averages.adr)}</div>
            </div>

            <!-- RevPAR Médio -->
            <div class="kpi-card">
              <div class="kpi-card-icon">📈</div>
              <div class="kpi-card-label">RevPAR Médio</div>
              <div class="kpi-card-value">${MetricsCalculator.formatCurrency(averages.revPAR)}</div>
              <div class="kpi-card-detail">Revenue Per Available Room</div>
            </div>

            <!-- Operações Hoje -->
            <div class="kpi-card operations">
              <div class="kpi-card-icon">�</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.operations">Operações Hoje</div>
              <div class="kpi-card-value">${totals.checkInsToday + totals.checkOutsToday}</div>
              <div class="kpi-card-detail">
                ${totals.checkInsToday} check-ins • ${totals.checkOutsToday} check-outs
              </div>
            </div>

            <!-- Stayovers -->
            <div class="kpi-card">
              <div class="kpi-card-icon">🏨</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.stayovers">Stayovers</div>
              <div class="kpi-card-value">${totals.stayovers}</div>
              <div class="kpi-card-detail">Hóspedes permanecendo</div>
            </div>

            <!-- Forecast -->
            <div class="kpi-card forecast">
              <div class="kpi-card-icon">📅</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.forecast">Previsão 7 dias</div>
              <div class="kpi-card-value">${MetricsCalculator.formatCurrency(totals.forecastRevenue)}</div>
              <div class="kpi-card-detail">Ocupação prevista: ${averages.forecastOccupancy}%</div>
            </div>

            ${totals.alerts > 0 ? `
            <div class="kpi-card alert">
              <div class="kpi-card-icon">⚠️</div>
              <div class="kpi-card-label" data-i18n="dashboard.comparative.totalAlerts">Alertas Ativos</div>
              <div class="kpi-card-value">${totals.alerts}</div>
              <div class="kpi-card-detail" data-i18n="dashboard.comparative.requiresAttention">Requer atenção</div>
            </div>
            ` : ''}

            ${totals.noShows > 0 ? `
            <div class="kpi-card warning">
              <div class="kpi-card-icon">❌</div>
              <div class="kpi-card-label">No-Shows</div>
              <div class="kpi-card-value">${totals.noShows}</div>
              <div class="kpi-card-detail">Reservas não compareceram</div>
            </div>
            ` : ''}
          </div>

          <!-- Análise Comparativa de Performance -->
          <div class="performance-analysis">
            <h4>🏆 Análise de Performance</h4>
            <div class="performance-grid">
              <div class="performance-card best">
                <div class="performance-header">
                  <span class="performance-icon">👑</span>
                  <span class="performance-label" data-i18n="dashboard.comparative.bestPerformance">Melhor Desempenho</span>
                </div>
                <div class="performance-name">${SecurityManager.sanitizeHTML(best.property.name)}</div>
                <div class="performance-metrics">
                  <div class="perf-metric">
                    <span class="perf-label">Ocupação:</span>
                    <span class="perf-value">${best.metrics.occupancyRate}%</span>
                  </div>
                  <div class="perf-metric">
                    <span class="perf-label">Receita:</span>
                    <span class="perf-value">${MetricsCalculator.formatCurrency(best.metrics.revenue)}</span>
                  </div>
                  <div class="perf-metric">
                    <span class="perf-label">RevPAR:</span>
                    <span class="perf-value">${MetricsCalculator.formatCurrency(best.metrics.revPAR)}</span>
                  </div>
                </div>
              </div>

              ${worst.property.key !== best.property.key ? `
              <div class="performance-card improvement">
                <div class="performance-header">
                  <span class="performance-icon">�</span>
                  <span class="performance-label">Oportunidade de Melhoria</span>
                </div>
                <div class="performance-name">${SecurityManager.sanitizeHTML(worst.property.name)}</div>
                <div class="performance-metrics">
                  <div class="perf-metric">
                    <span class="perf-label">Ocupação:</span>
                    <span class="perf-value">${worst.metrics.occupancyRate}%</span>
                  </div>
                  <div class="perf-metric">
                    <span class="perf-label">Receita:</span>
                    <span class="perf-value">${MetricsCalculator.formatCurrency(worst.metrics.revenue)}</span>
                  </div>
                  <div class="perf-metric">
                    <span class="perf-label">Potencial:</span>
                    <span class="perf-value">+${best.metrics.occupancyRate - worst.metrics.occupancyRate}%</span>
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    },

    // Converte código de módulo para nome amigável
    getModuleName: function(moduleCode) {
      const modules = {
        'engineering': '🔧 Engenharia',
        'housekeeping': '🧹 Governança',
        'alerts': '⚠️ Alertas',
        'reservations': '📅 Reservas',
        'pos': '💳 POS',
        'analytics': '📊 Analytics'
      };
      return modules[moduleCode] || moduleCode;
    }
  };

  // ========================================
  // MAIN DASHBOARD CONTROLLER
  // ========================================

  const PropertyDashboard = {
    initialized: false,
    currentUser: null,
    properties: [],

    // Inicializa o dashboard
    init: function() {
      if (this.initialized) return;

      console.log('🚀 Initializing Property Dashboard...');

      // Carrega usuário atual
      this.currentUser = DataManager.loadCurrentUser();
      if (!this.currentUser) {
        console.error('No user logged in');
        return;
      }

      // Carrega propriedades autorizadas
      this.properties = DataManager.getAuthorizedProperties(this.currentUser);
      console.log(`✅ Found ${this.properties.length} authorized properties`);

      // Renderiza dashboard
      this.render();

      this.initialized = true;
    },

    // Renderiza o dashboard completo
    render: async function() {
      const container = document.querySelector('.hotels');
      if (!container) {
        console.error('Container .hotels not found');
        return;
      }

      // Limpa container
      container.innerHTML = '';

      // Se não há propriedades, mostra mensagem
      if (this.properties.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🏨</div>
            <h3 data-i18n="dashboard.noProperties">Nenhuma propriedade disponível</h3>
            <p data-i18n="dashboard.noPropertiesDesc">
              Você não tem acesso a nenhuma propriedade implantada ou suas propriedades ainda estão em configuração.
            </p>
          </div>
        `;
        return;
      }

      // Renderiza cards de propriedades (assíncrono por causa do clima)
      for (const property of this.properties) {
        const metrics = DataManager.loadPropertyMetrics(property.key);
        const cardHTML = await UIRenderer.renderPropertyCard(property, metrics);
        container.insertAdjacentHTML('beforeend', cardHTML);
      }

      // Renderiza comparativo (se mais de uma propriedade)
      if (this.properties.length > 1) {
        this.renderComparative();
      }

      // Aplica traduções se i18n disponível
      if (typeof applyI18n === 'function') {
        applyI18n();
      }
    },

    // Renderiza seção comparativa
    renderComparative: function() {
      const section = document.getElementById('compareSection');
      if (!section) return;

      const comparative = MetricsCalculator.calculateComparative(this.properties);
      const html = UIRenderer.renderComparative(comparative);

      const grid = document.getElementById('compareGrid');
      if (grid) {
        grid.innerHTML = html;
        section.style.display = 'block';
      }
    },

    // Abre propriedade (integra com openControl existente)
    openProperty: function(propertyKey) {
      const property = this.properties.find(p => p.key === propertyKey);
      if (!property) {
        console.error('Property not found:', propertyKey);
        return;
      }

      // Chama função existente openControl
      if (typeof openControl === 'function') {
        openControl(property.name);
      } else {
        console.warn('openControl function not found');
      }
    },

    // Abre Central Virtual de Automação (antigo RTI)
    openAutomation: function(propertyKey) {
      const property = this.properties.find(p => p.key === propertyKey);
      if (!property) {
        console.error('Property not found:', propertyKey);
        return;
      }

      // Chama função existente openRTI (renomeada conceitualmente)
      if (typeof openRTI === 'function') {
        openRTI(property.name);
      } else {
        console.warn('openRTI function not found');
      }
    },

    // Testa propriedade localmente (integra com sistema existente)
    testLocally: function(propertyKey) {
      const property = this.properties.find(p => p.key === propertyKey);
      if (!property) {
        console.error('Property not found:', propertyKey);
        return;
      }

      // Verifica se sistema de teste local está disponível
      if (typeof masterCtrl !== 'undefined' && typeof masterCtrl.testPropertyLocally === 'function') {
        masterCtrl.testPropertyLocally(propertyKey);
      } else if (typeof MasterControlSystem !== 'undefined') {
        const masterSystem = new MasterControlSystem();
        if (typeof masterSystem.testPropertyLocally === 'function') {
          masterSystem.testPropertyLocally(propertyKey);
        }
      } else {
        console.warn('Test locally system not available');
        alert('Sistema de teste local não disponível nesta página.');
      }
    },

    // Atualiza métricas (refresh)
    refresh: function() {
      console.log('🔄 Refreshing dashboard...');
      CacheManager.clear();
      this.properties = DataManager.getAuthorizedProperties(this.currentUser);
      this.render();
    },

    // Invalida cache de propriedade específica
    invalidateProperty: function(propertyKey) {
      CacheManager.invalidate(propertyKey);
      this.refresh();
    }
  };

  // ========================================
  // EXPORT TO GLOBAL
  // ========================================

  window.PropertyDashboard = PropertyDashboard;

  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  // Listener para atualização de dados demo
  window.addEventListener('demoDataUpdated', function(event) {
    const { propertyKey, timestamp } = event.detail;
    console.log(`[Dashboard] 🎭 Dados demo atualizados para ${propertyKey}`, new Date(timestamp));
    
    // Limpar cache da propriedade específica
    CacheManager.clear(`metrics_${propertyKey}`);
    CacheManager.clear(`weather_${propertyKey}`);
    
    // Refresh dashboard se estiver inicializado
    if (window.PropertyDashboard && window.PropertyDashboard.properties) {
      window.PropertyDashboard.refresh();
    }
  });

  // Auto-inicializa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PropertyDashboard.init());
  } else {
    PropertyDashboard.init();
  }

  console.log('✅ Property Dashboard Manager loaded');

})();
