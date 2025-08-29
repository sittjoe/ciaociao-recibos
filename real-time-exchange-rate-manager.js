// real-time-exchange-rate-manager.js - SISTEMA DE TIPOS DE CAMBIO v1.0
// Gestión completa de USD/MXN con histórico y cache inteligente para SUBAGENTE 4
// =============================================================================

console.log('💱 Iniciando Sistema de Tipos de Cambio USD/MXN v1.0...');

// =============================================================================
// CONFIGURACIÓN DEL SISTEMA DE EXCHANGE RATE
// =============================================================================

const EXCHANGE_CONFIG = {
    // APIs de tipos de cambio (gratis y de pago)
    apis: {
        exchangeRateApi: {
            url: 'https://api.exchangerate-api.com/v4/latest/USD',
            key: null, // Gratuita, no requiere key
            rateLimit: 1500, // requests por mes gratis
            name: 'ExchangeRate-API'
        },
        currencyFreaks: {
            url: 'https://api.currencyfreaks.com/v2.0/rates/latest',
            key: 'YOUR_CURRENCYFREAKS_API_KEY', // Reemplazar con key real
            rateLimit: 1000, // requests por mes gratis
            name: 'CurrencyFreaks'
        },
        fixer: {
            url: 'https://api.fixer.io/latest',
            key: 'YOUR_FIXER_API_KEY', // Reemplazar con key real
            rateLimit: 100, // requests por mes gratis
            name: 'Fixer.io'
        },
        currencyLayer: {
            url: 'https://api.currencylayer.com/live',
            key: 'YOUR_CURRENCYLAYER_API_KEY', // Reemplazar con key real
            rateLimit: 1000, // requests por mes gratis
            name: 'CurrencyLayer'
        }
    },

    // Configuración de cache inteligente
    cache: {
        ttl: 15 * 60 * 1000, // 15 minutos TTL para tipos de cambio
        maxEntries: 1000, // Máximo de entradas en cache
        compressionThreshold: 500 // Comprimir después de 500 entradas
    },

    // Configuración de rate limiting
    rateLimiting: {
        requestsPerHour: 60, // Máximo requests por hora
        requestsPerDay: 1000, // Máximo requests por día
        backoffMultiplier: 2, // Multiplicador para exponential backoff
        maxRetries: 3 // Máximo de reintentos
    },

    // Configuración de análisis histórico
    historical: {
        dataPoints: 365, // Mantener 1 año de datos
        aggregationIntervals: ['hourly', 'daily', 'weekly', 'monthly'],
        analysisMetrics: ['volatility', 'trend', 'support', 'resistance'],
        alertThresholds: {
            volatility: 0.02, // 2% cambio en 1 hora
            trend: 0.05, // 5% cambio en 1 día
            extremeMove: 0.10 // 10% cambio (alerta crítica)
        }
    },

    // Configuración de fallback
    fallback: {
        staticRate: 19.80, // Tipo fijo si todas las APIs fallan
        lastKnownGoodTime: 24 * 60 * 60 * 1000, // 24 horas máximo
        emergencyContacts: ['admin@ciaociao.mx'], // Notificar en emergencia
        backupDataSources: ['https://www.xe.com', 'https://www.oanda.com']
    }
};

// =============================================================================
// CLASE PRINCIPAL DEL SISTEMA DE EXCHANGE RATE
// =============================================================================

class RealTimeExchangeRateManager {
    constructor() {
        this.cache = new Map();
        this.historicalData = [];
        this.rateLimitTracking = new Map();
        this.currentRate = null;
        this.lastUpdate = null;
        this.apiStatus = new Map();
        this.alerts = [];
        this.subscribers = [];
        this.isInitialized = false;
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando gestor de tipos de cambio...');
        
        try {
            // Cargar datos almacenados
            this.loadStoredData();
            
            // Configurar APIs y rate limiting
            this.setupRateLimiting();
            
            // Cargar tipo de cambio inicial
            await this.loadInitialExchangeRate();
            
            // Configurar actualización automática
            this.setupAutoUpdate();
            
            // Configurar análisis histórico
            this.setupHistoricalAnalysis();
            
            // Configurar sistema de alertas
            this.setupAlertSystem();
            
            this.isInitialized = true;
            console.log('✅ Sistema de tipos de cambio inicializado');
            
            // Notificar a suscriptores
            this.notifySubscribers('initialized', {
                currentRate: this.currentRate,
                lastUpdate: this.lastUpdate
            });
            
        } catch (error) {
            console.error('❌ Error inicializando exchange rate manager:', error);
            await this.handleInitializationError(error);
        }
    }

    // =============================================================================
    // OBTENCIÓN DE TIPOS DE CAMBIO EN TIEMPO REAL
    // =============================================================================

    async getCurrentExchangeRate(forceRefresh = false) {
        try {
            // Si tenemos cache válido y no se fuerza refresh
            if (this.isCacheValid() && !forceRefresh) {
                console.log('📊 Usando tipo de cambio en cache:', this.currentRate);
                return {
                    rate: this.currentRate,
                    lastUpdate: this.lastUpdate,
                    source: 'cache',
                    age: Date.now() - this.lastUpdate
                };
            }

            // Obtener de APIs en orden de prioridad
            const exchangeData = await this.fetchFromAPIs();
            
            if (exchangeData) {
                // Actualizar cache y datos
                this.updateExchangeData(exchangeData);
                
                return {
                    rate: this.currentRate,
                    lastUpdate: this.lastUpdate,
                    source: exchangeData.source,
                    confidence: exchangeData.confidence || 'high'
                };
            }

            // Fallback a último rate conocido o estático
            return this.getFallbackRate();

        } catch (error) {
            console.error('❌ Error obteniendo tipo de cambio:', error);
            return this.getFallbackRate();
        }
    }

    async fetchFromAPIs() {
        const availableAPIs = this.getAvailableAPIs();
        
        for (const apiConfig of availableAPIs) {
            try {
                // Verificar rate limit
                if (!this.canMakeRequest(apiConfig.name)) {
                    console.log(`⏳ Rate limit alcanzado para ${apiConfig.name}, saltando...`);
                    continue;
                }

                const exchangeData = await this.fetchFromAPI(apiConfig);
                
                if (exchangeData && this.isValidRate(exchangeData.rate)) {
                    // Actualizar tracking de API
                    this.updateAPIStatus(apiConfig.name, 'success');
                    
                    return {
                        rate: exchangeData.rate,
                        timestamp: Date.now(),
                        source: apiConfig.name,
                        confidence: this.calculateConfidence(exchangeData)
                    };
                }

            } catch (error) {
                console.warn(`⚠️ Error con API ${apiConfig.name}:`, error.message);
                this.updateAPIStatus(apiConfig.name, 'error', error);
            }
        }

        throw new Error('Todas las APIs fallaron');
    }

    async fetchFromAPI(apiConfig) {
        console.log(`📡 Consultando ${apiConfig.name}...`);
        
        // Registrar request para rate limiting
        this.recordRequest(apiConfig.name);
        
        let url = apiConfig.url;
        const headers = { 'User-Agent': 'ciaociao-mx-jewelry-system/1.0' };
        
        // Configurar según el API
        switch (apiConfig.name) {
            case 'ExchangeRate-API':
                // No requiere key, URL base ya correcta
                break;
                
            case 'CurrencyFreaks':
                url += `?apikey=${apiConfig.key}&symbols=MXN`;
                break;
                
            case 'Fixer.io':
                url += `?access_key=${apiConfig.key}&symbols=MXN&base=USD`;
                break;
                
            case 'CurrencyLayer':
                url += `?access_key=${apiConfig.key}&currencies=MXN&source=USD&format=1`;
                break;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseAPIResponse(data, apiConfig.name);

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    parseAPIResponse(data, apiName) {
        console.log(`🔍 Parseando respuesta de ${apiName}`);
        
        try {
            let rate = null;
            
            switch (apiName) {
                case 'ExchangeRate-API':
                    rate = data.rates?.MXN;
                    break;
                    
                case 'CurrencyFreaks':
                    rate = parseFloat(data.rates?.MXN);
                    break;
                    
                case 'Fixer.io':
                    rate = data.rates?.MXN;
                    break;
                    
                case 'CurrencyLayer':
                    rate = data.quotes?.USDMXN;
                    break;
            }

            if (!rate || isNaN(rate)) {
                throw new Error(`Formato de respuesta inválido: ${JSON.stringify(data)}`);
            }

            // Validar rango razonable (15-25 MXN por USD)
            if (rate < 15 || rate > 25) {
                throw new Error(`Tipo de cambio fuera de rango: ${rate}`);
            }

            return {
                rate: parseFloat(rate.toFixed(4)),
                timestamp: Date.now(),
                metadata: {
                    source: apiName,
                    originalData: data
                }
            };

        } catch (error) {
            console.error(`❌ Error parseando respuesta de ${apiName}:`, error);
            throw error;
        }
    }

    // =============================================================================
    // SISTEMA DE CACHE INTELIGENTE
    // =============================================================================

    isCacheValid() {
        if (!this.currentRate || !this.lastUpdate) return false;
        
        const cacheAge = Date.now() - this.lastUpdate;
        const ttl = EXCHANGE_CONFIG.cache.ttl;
        
        return cacheAge < ttl;
    }

    updateExchangeData(exchangeData) {
        const previousRate = this.currentRate;
        
        this.currentRate = exchangeData.rate;
        this.lastUpdate = exchangeData.timestamp || Date.now();
        
        // Agregar a histórico
        this.addToHistoricalData({
            timestamp: this.lastUpdate,
            rate: this.currentRate,
            source: exchangeData.source,
            confidence: exchangeData.confidence
        });

        // Detectar cambios significativos
        if (previousRate) {
            const changePercent = Math.abs((this.currentRate - previousRate) / previousRate);
            if (changePercent > EXCHANGE_CONFIG.historical.alertThresholds.volatility) {
                this.triggerAlert('volatility', {
                    previousRate,
                    currentRate: this.currentRate,
                    changePercent: changePercent * 100
                });
            }
        }

        // Guardar en localStorage
        this.persistData();

        console.log(`💱 Tipo de cambio actualizado: $1 USD = $${this.currentRate} MXN`);
        
        // Notificar suscriptores del cambio
        this.notifySubscribers('rate_updated', {
            rate: this.currentRate,
            previousRate,
            timestamp: this.lastUpdate,
            source: exchangeData.source
        });
    }

    addToHistoricalData(dataPoint) {
        this.historicalData.push(dataPoint);
        
        // Mantener solo los últimos N puntos de datos
        const maxPoints = EXCHANGE_CONFIG.historical.dataPoints;
        if (this.historicalData.length > maxPoints) {
            this.historicalData = this.historicalData.slice(-maxPoints);
        }
    }

    // =============================================================================
    // ANÁLISIS HISTÓRICO Y TENDENCIAS
    // =============================================================================

    getHistoricalAnalysis(timeframe = '24h') {
        if (this.historicalData.length < 2) {
            return { error: 'Datos insuficientes para análisis' };
        }

        const now = Date.now();
        let startTime;
        
        switch (timeframe) {
            case '1h': startTime = now - 60 * 60 * 1000; break;
            case '24h': startTime = now - 24 * 60 * 60 * 1000; break;
            case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
            case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
            default: startTime = now - 24 * 60 * 60 * 1000;
        }

        const timeframeData = this.historicalData.filter(d => d.timestamp >= startTime);
        
        if (timeframeData.length < 2) {
            return { error: `Datos insuficientes para timeframe ${timeframe}` };
        }

        const analysis = this.calculateAnalysisMetrics(timeframeData);
        
        return {
            timeframe,
            dataPoints: timeframeData.length,
            startRate: timeframeData[0].rate,
            endRate: timeframeData[timeframeData.length - 1].rate,
            ...analysis
        };
    }

    calculateAnalysisMetrics(data) {
        const rates = data.map(d => d.rate);
        
        // Estadísticas básicas
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        
        // Volatilidad (desviación estándar)
        const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
        const volatility = Math.sqrt(variance);
        
        // Tendencia (pendiente de regresión lineal simple)
        const trend = this.calculateTrend(data);
        
        // Cambio porcentual total
        const totalChange = ((rates[rates.length - 1] - rates[0]) / rates[0]) * 100;
        
        // Niveles de soporte y resistencia
        const support = this.findSupportLevel(rates);
        const resistance = this.findResistanceLevel(rates);

        return {
            min: parseFloat(min.toFixed(4)),
            max: parseFloat(max.toFixed(4)),
            mean: parseFloat(mean.toFixed(4)),
            volatility: parseFloat(volatility.toFixed(4)),
            volatilityPercent: parseFloat(((volatility / mean) * 100).toFixed(2)),
            trend: trend.slope > 0 ? 'alcista' : trend.slope < 0 ? 'bajista' : 'lateral',
            trendStrength: Math.abs(trend.slope),
            totalChangePercent: parseFloat(totalChange.toFixed(2)),
            support: parseFloat(support.toFixed(4)),
            resistance: parseFloat(resistance.toFixed(4)),
            tradingRange: parseFloat((max - min).toFixed(4))
        };
    }

    calculateTrend(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        data.forEach((point, index) => {
            const x = index;
            const y = point.rate;
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    findSupportLevel(rates) {
        // Nivel de soporte = percentil 10
        const sorted = [...rates].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.10);
        return sorted[index];
    }

    findResistanceLevel(rates) {
        // Nivel de resistencia = percentil 90
        const sorted = [...rates].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.90);
        return sorted[index];
    }

    // =============================================================================
    // SISTEMA DE RATE LIMITING
    // =============================================================================

    setupRateLimiting() {
        // Limpiar tracking cada hora
        setInterval(() => {
            this.cleanupRateLimiting();
        }, 60 * 60 * 1000); // 1 hora
    }

    canMakeRequest(apiName) {
        const tracking = this.rateLimitTracking.get(apiName) || {
            hourlyCount: 0,
            dailyCount: 0,
            lastHourReset: Date.now(),
            lastDayReset: Date.now(),
            backoffUntil: null
        };

        const now = Date.now();

        // Verificar backoff
        if (tracking.backoffUntil && now < tracking.backoffUntil) {
            return false;
        }

        // Reset counters si es necesario
        if (now - tracking.lastHourReset >= 60 * 60 * 1000) { // 1 hora
            tracking.hourlyCount = 0;
            tracking.lastHourReset = now;
        }

        if (now - tracking.lastDayReset >= 24 * 60 * 60 * 1000) { // 1 día
            tracking.dailyCount = 0;
            tracking.lastDayReset = now;
        }

        // Verificar límites
        const config = EXCHANGE_CONFIG.rateLimiting;
        if (tracking.hourlyCount >= config.requestsPerHour ||
            tracking.dailyCount >= config.requestsPerDay) {
            return false;
        }

        return true;
    }

    recordRequest(apiName) {
        const tracking = this.rateLimitTracking.get(apiName) || {
            hourlyCount: 0,
            dailyCount: 0,
            lastHourReset: Date.now(),
            lastDayReset: Date.now(),
            backoffUntil: null
        };

        tracking.hourlyCount++;
        tracking.dailyCount++;
        
        this.rateLimitTracking.set(apiName, tracking);
    }

    cleanupRateLimiting() {
        const now = Date.now();
        
        for (const [apiName, tracking] of this.rateLimitTracking.entries()) {
            if (now - tracking.lastDayReset >= 24 * 60 * 60 * 1000) {
                tracking.dailyCount = 0;
                tracking.lastDayReset = now;
            }
            
            if (now - tracking.lastHourReset >= 60 * 60 * 1000) {
                tracking.hourlyCount = 0;
                tracking.lastHourReset = now;
            }

            // Limpiar backoff expirado
            if (tracking.backoffUntil && now >= tracking.backoffUntil) {
                tracking.backoffUntil = null;
            }
        }
    }

    // =============================================================================
    // SISTEMA DE ALERTAS Y MONITOREO
    // =============================================================================

    setupAlertSystem() {
        // Verificar alertas cada 5 minutos
        setInterval(() => {
            this.checkAlerts();
        }, 5 * 60 * 1000);
    }

    checkAlerts() {
        if (this.historicalData.length < 2) return;

        const latest = this.historicalData[this.historicalData.length - 1];
        const oneHourAgo = this.historicalData.find(d => 
            latest.timestamp - d.timestamp >= 60 * 60 * 1000
        );

        if (oneHourAgo) {
            const hourlyChange = Math.abs((latest.rate - oneHourAgo.rate) / oneHourAgo.rate);
            
            if (hourlyChange > EXCHANGE_CONFIG.historical.alertThresholds.volatility) {
                this.triggerAlert('high_volatility', {
                    timeframe: '1h',
                    changePercent: hourlyChange * 100,
                    from: oneHourAgo.rate,
                    to: latest.rate
                });
            }
        }

        // Verificar si el cache está muy viejo
        if (this.lastUpdate) {
            const cacheAge = Date.now() - this.lastUpdate;
            if (cacheAge > 60 * 60 * 1000) { // 1 hora sin actualizar
                this.triggerAlert('stale_data', {
                    ageMinutes: Math.floor(cacheAge / (60 * 1000)),
                    lastUpdate: new Date(this.lastUpdate).toISOString()
                });
            }
        }
    }

    triggerAlert(type, data) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: Date.now(),
            data,
            severity: this.getAlertSeverity(type)
        };

        this.alerts.push(alert);
        
        // Mantener solo las últimas 50 alertas
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        console.warn(`🚨 Alerta de tipo de cambio [${type}]:`, data);

        // Notificar suscriptores
        this.notifySubscribers('alert', alert);
    }

    getAlertSeverity(type) {
        const severityMap = {
            'volatility': 'medium',
            'high_volatility': 'high',
            'stale_data': 'low',
            'api_failure': 'medium',
            'all_apis_failed': 'critical'
        };
        
        return severityMap[type] || 'low';
    }

    // =============================================================================
    // SISTEMA DE FALLBACK
    // =============================================================================

    getFallbackRate() {
        // Intentar último rate conocido si no es muy viejo
        if (this.currentRate && this.lastUpdate) {
            const age = Date.now() - this.lastUpdate;
            if (age < EXCHANGE_CONFIG.fallback.lastKnownGoodTime) {
                console.log('⚡ Usando último tipo conocido (fallback)');
                return {
                    rate: this.currentRate,
                    lastUpdate: this.lastUpdate,
                    source: 'fallback_cached',
                    age
                };
            }
        }

        // Usar rate estático
        console.log('🔴 Usando tipo de cambio estático de emergencia');
        return {
            rate: EXCHANGE_CONFIG.fallback.staticRate,
            lastUpdate: null,
            source: 'fallback_static',
            warning: 'Usando tipo de cambio fijo - verificar conectividad'
        };
    }

    // =============================================================================
    // UTILIDADES Y HELPERS
    // =============================================================================

    getAvailableAPIs() {
        // Ordenar APIs por status y prioridad
        const apiConfigs = Object.values(EXCHANGE_CONFIG.apis);
        
        return apiConfigs
            .filter(config => this.isAPIAvailable(config.name))
            .sort((a, b) => {
                const statusA = this.apiStatus.get(a.name) || { successRate: 0 };
                const statusB = this.apiStatus.get(b.name) || { successRate: 0 };
                return statusB.successRate - statusA.successRate;
            });
    }

    isAPIAvailable(apiName) {
        const status = this.apiStatus.get(apiName);
        if (!status) return true; // Sin historial, asumir disponible

        // API no disponible si ha fallado muchas veces recientemente
        return status.successRate > 0.3; // 30% mínimo de éxito
    }

    updateAPIStatus(apiName, result, error = null) {
        const status = this.apiStatus.get(apiName) || {
            totalRequests: 0,
            successfulRequests: 0,
            successRate: 0,
            lastSuccess: null,
            lastError: null,
            consecutiveFailures: 0
        };

        status.totalRequests++;
        
        if (result === 'success') {
            status.successfulRequests++;
            status.lastSuccess = Date.now();
            status.consecutiveFailures = 0;
        } else {
            status.lastError = { timestamp: Date.now(), error: error?.message };
            status.consecutiveFailures++;
        }

        status.successRate = status.successfulRequests / status.totalRequests;
        this.apiStatus.set(apiName, status);
    }

    isValidRate(rate) {
        return rate && 
               !isNaN(rate) && 
               rate > 0 && 
               rate >= 15 && 
               rate <= 25;
    }

    calculateConfidence(exchangeData) {
        // Calcular confianza basada en fuente y consistencia
        const sourceReliability = {
            'ExchangeRate-API': 0.9,
            'CurrencyFreaks': 0.85,
            'Fixer.io': 0.8,
            'CurrencyLayer': 0.8
        };

        let confidence = sourceReliability[exchangeData.source] || 0.7;

        // Ajustar confianza basada en consistencia con datos recientes
        if (this.currentRate) {
            const deviation = Math.abs((exchangeData.rate - this.currentRate) / this.currentRate);
            if (deviation > 0.01) { // Más de 1% de diferencia
                confidence *= 0.8;
            }
        }

        return confidence > 0.9 ? 'high' : confidence > 0.7 ? 'medium' : 'low';
    }

    // =============================================================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // =============================================================================

    setupAutoUpdate() {
        // Actualizar cada 15 minutos durante horas hábiles
        const updateInterval = setInterval(async () => {
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();
            
            // Solo durante horas hábiles (6 AM - 10 PM, Lun-Vie)
            if (day >= 1 && day <= 5 && hour >= 6 && hour <= 22) {
                try {
                    await this.getCurrentExchangeRate(true); // Force refresh
                } catch (error) {
                    console.error('❌ Error en actualización automática:', error);
                }
            }
        }, EXCHANGE_CONFIG.cache.ttl);

        // Limpiar interval si la página se cierra
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                clearInterval(updateInterval);
            });
        }
    }

    // =============================================================================
    // SUSCRIPCIONES Y NOTIFICACIONES
    // =============================================================================

    subscribe(callback) {
        this.subscribers.push(callback);
        
        // Devolver función para cancelar suscripción
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    notifySubscribers(event, data) {
        this.subscribers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('❌ Error notificando suscriptor:', error);
            }
        });
    }

    // =============================================================================
    // PERSISTENCIA Y RECUPERACIÓN DE DATOS
    // =============================================================================

    loadStoredData() {
        try {
            // Cargar tipo actual y timestamp
            const currentData = localStorage.getItem('exchange_rate_current');
            if (currentData) {
                const parsed = JSON.parse(currentData);
                this.currentRate = parsed.rate;
                this.lastUpdate = parsed.timestamp;
            }

            // Cargar datos históricos
            const historicalData = localStorage.getItem('exchange_rate_historical');
            if (historicalData) {
                this.historicalData = JSON.parse(historicalData);
            }

            // Cargar estado de APIs
            const apiStatus = localStorage.getItem('exchange_rate_api_status');
            if (apiStatus) {
                const statusEntries = JSON.parse(apiStatus);
                this.apiStatus = new Map(statusEntries);
            }

            console.log(`💾 Datos cargados: Rate=${this.currentRate}, Histórico=${this.historicalData.length} puntos`);

        } catch (error) {
            console.warn('⚠️ Error cargando datos almacenados:', error);
        }
    }

    persistData() {
        try {
            // Guardar tipo actual
            const currentData = {
                rate: this.currentRate,
                timestamp: this.lastUpdate
            };
            localStorage.setItem('exchange_rate_current', JSON.stringify(currentData));

            // Guardar datos históricos (últimos 365 puntos)
            const historicalToSave = this.historicalData.slice(-365);
            localStorage.setItem('exchange_rate_historical', JSON.stringify(historicalToSave));

            // Guardar estado de APIs
            const apiStatusEntries = Array.from(this.apiStatus.entries());
            localStorage.setItem('exchange_rate_api_status', JSON.stringify(apiStatusEntries));

        } catch (error) {
            console.error('❌ Error persistiendo datos:', error);
        }
    }

    async loadInitialExchangeRate() {
        console.log('🔄 Cargando tipo de cambio inicial...');
        
        try {
            const rateData = await this.getCurrentExchangeRate(false);
            console.log('✅ Tipo de cambio inicial cargado:', rateData);
        } catch (error) {
            console.error('❌ Error cargando tipo inicial:', error);
            // Usar fallback si falla la carga inicial
            const fallback = this.getFallbackRate();
            console.log('⚡ Usando fallback para inicialización:', fallback);
        }
    }

    async handleInitializationError(error) {
        console.error('🚨 Error crítico en inicialización de exchange rate:', error);
        
        // Intentar recuperación básica
        const fallback = this.getFallbackRate();
        this.currentRate = fallback.rate;
        this.lastUpdate = Date.now();
        
        // Marcar como inicializado con advertencia
        this.isInitialized = true;
        
        // Programar reintento
        setTimeout(() => {
            console.log('🔄 Reintentando inicialización...');
            this.initialize();
        }, 60000); // Reintentar en 1 minuto
    }

    // =============================================================================
    // API PÚBLICA
    // =============================================================================

    // Método principal para obtener tipo de cambio
    async getUSDtoMXN(forceRefresh = false) {
        const result = await this.getCurrentExchangeRate(forceRefresh);
        return result;
    }

    // Convertir USD a MXN
    convertUSDtoMXN(amountUSD, customRate = null) {
        const rate = customRate || this.currentRate || EXCHANGE_CONFIG.fallback.staticRate;
        return {
            usd: amountUSD,
            mxn: parseFloat((amountUSD * rate).toFixed(2)),
            rate: rate,
            timestamp: this.lastUpdate || Date.now()
        };
    }

    // Convertir MXN a USD
    convertMXNtoUSD(amountMXN, customRate = null) {
        const rate = customRate || this.currentRate || EXCHANGE_CONFIG.fallback.staticRate;
        return {
            mxn: amountMXN,
            usd: parseFloat((amountMXN / rate).toFixed(2)),
            rate: rate,
            timestamp: this.lastUpdate || Date.now()
        };
    }

    // Obtener análisis histórico
    getAnalysis(timeframe = '24h') {
        return this.getHistoricalAnalysis(timeframe);
    }

    // Obtener estado del sistema
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            currentRate: this.currentRate,
            lastUpdate: this.lastUpdate,
            cacheValid: this.isCacheValid(),
            historicalDataPoints: this.historicalData.length,
            apiStatus: Object.fromEntries(this.apiStatus),
            recentAlerts: this.alerts.slice(-5)
        };
    }

    // Forzar actualización
    async forceUpdate() {
        console.log('🔄 Forzando actualización del tipo de cambio...');
        return await this.getCurrentExchangeRate(true);
    }

    // Limpiar datos
    clearCache() {
        this.cache.clear();
        this.currentRate = null;
        this.lastUpdate = null;
        localStorage.removeItem('exchange_rate_current');
        console.log('🗑️ Cache de tipo de cambio limpiado');
    }

    // Exportar datos históricos
    exportHistoricalData(format = 'json') {
        const exportData = {
            currentRate: this.currentRate,
            lastUpdate: this.lastUpdate,
            historicalData: this.historicalData,
            exportTimestamp: Date.now()
        };

        if (format === 'csv') {
            const headers = ['timestamp', 'rate', 'source'];
            const rows = this.historicalData.map(d => [
                new Date(d.timestamp).toISOString(),
                d.rate,
                d.source || 'unknown'
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        return JSON.stringify(exportData, null, 2);
    }
}

// =============================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// =============================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.exchangeRateManager = new RealTimeExchangeRateManager();
    
    // Función de conveniencia global
    window.getExchangeRate = async (forceRefresh = false) => {
        return await window.exchangeRateManager.getUSDtoMXN(forceRefresh);
    };
    
    window.convertUSDtoMXN = (amount, customRate = null) => {
        return window.exchangeRateManager.convertUSDtoMXN(amount, customRate);
    };
    
    window.convertMXNtoUSD = (amount, customRate = null) => {
        return window.exchangeRateManager.convertMXNtoUSD(amount, customRate);
    };
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RealTimeExchangeRateManager,
        EXCHANGE_CONFIG
    };
}

console.log('✅ Sistema de Tipos de Cambio USD/MXN v1.0 cargado correctamente');
console.log('💱 Acceso: window.exchangeRateManager');
console.log('🔄 Función rápida: window.getExchangeRate()');
console.log('💰 Conversiones: window.convertUSDtoMXN(100) / window.convertMXNtoUSD(1980)');