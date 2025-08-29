// kitco-pricing-api.js - SISTEMA AVANZADO DE PRECIOS GLOBALES v2.0
// Integración con APIs de metales preciosos en tiempo real
// =================================================================

console.log('🔥 Iniciando Sistema de Precios Globales Kitco v2.0...');

// =================================================================
// CONFIGURACIÓN DE APIs Y CONSTANTES
// =================================================================

const PRICING_CONFIG = {
    // API Principal: MetalpriceAPI (100 requests/mes gratis)
    primary: {
        name: 'MetalpriceAPI',
        baseURL: 'https://api.metalpriceapi.com/v1',
        apiKey: 'live_metalpriceapi_demo_key', // Demo key - configurar con clave real
        rateLimits: {
            requestsPerMinute: 10,
            requestsPerMonth: 100
        },
        updateFrequency: 120000, // 2 minutos para conservar quota
        endpoints: {
            latest: '/latest',
            historical: '/historical'
        }
    },
    
    // API Backup: ExchangeRate API (gratuita, sin límites)
    fallback: {
        name: 'ExchangeRateAPI',
        baseURL: 'https://api.exchangerate-api.com/v4',
        apiKey: null, // No requiere API key
        rateLimits: {
            requestsPerMinute: 60,
            requestsPerMonth: 999999
        },
        updateFrequency: 180000, // 3 minutos
        endpoints: {
            latest: '/latest'
        }
    },
    
    // API Tertiary: Banco de México (oficial y gratuita)
    tertiary: {
        name: 'BancoMexico',
        baseURL: 'https://www.banxico.org.mx/SieAPIRest/service/v1/series',
        apiKey: null, // Token gratuito disponible
        rateLimits: {
            requestsPerMinute: 60,
            requestsPerMonth: 999999
        },
        updateFrequency: 300000, // 5 minutos
        endpoints: {
            usd: '/SF43718/datos/oportuno' // Serie USD/MXN oficial
        },
        parseResponse: (data) => {
            try {
                const serie = data.bmx?.series?.[0];
                const dato = serie?.datos?.[0];
                if (dato && dato.dato) {
                    return {
                        success: true,
                        exchangeRate: parseFloat(dato.dato),
                        timestamp: Date.now(),
                        source: 'Banco de México'
                    };
                }
            } catch (error) {
                console.error('Error parseando respuesta de Banxico:', error);
            }
            return { success: false };
        }
    },

    // Cache TTL estratificado por tipo de dato
    cacheTTL: {
        realtime: 60000,      // 1 minuto para precios en tiempo real
        historical: 3600000,  // 1 hora para datos históricos
        exchange: 300000,     // 5 minutos para tipos de cambio
        manual: 86400000      // 24 horas para overrides manuales
    },

    // Símbolos de metales preciosos (formato ISO 4217)
    metals: {
        gold: 'XAU',      // Oro
        silver: 'XAG',    // Plata 
        platinum: 'XPT',  // Platino
        palladium: 'XPD'  // Paladio
    },

    // Multiplicadores de pureza para oro
    goldPurity: {
        '24k': 1.000,     // 24 quilates = 100% oro
        '22k': 0.9167,    // 22 quilates = 91.67% oro
        '18k': 0.750,     // 18 quilates = 75% oro
        '14k': 0.5833,    // 14 quilates = 58.33% oro
        '10k': 0.4167     // 10 quilates = 41.67% oro
    },

    // Conversiones de peso
    weights: {
        ozToGrams: 31.1035,        // Onza troy a gramos
        gramsToPennyweight: 0.6430 // Gramos a pennyweights
    },

    // Monedas soportadas
    currencies: {
        base: 'USD',
        target: 'MXN'
    }
};

// =================================================================
// CLASE PRINCIPAL DE GESTIÓN DE PRECIOS
// =================================================================

class KitcoPricingManager {
    constructor() {
        this.cache = new Map();
        this.rateLimiters = new Map();
        this.circuitBreakers = new Map();
        this.exchangeRate = 19.8; // USD a MXN por defecto (actualizado enero 2025)
        this.isInitialized = false;
        this.lastUpdate = null;
        this.priceHistory = [];
        this.listeners = [];

        // Configurar circuit breakers para cada API
        this.setupCircuitBreakers();
        
        // Inicializar auto-limpieza de cache
        this.setupCacheCleanup();
    }

    // =================================================================
    // INICIALIZACIÓN DEL SISTEMA
    // =================================================================

    async initialize() {
        console.log('🚀 Inicializando sistema de precios globales...');
        
        try {
            // Cargar configuración guardada
            await this.loadConfiguration();
            
            // Obtener tipo de cambio USD/MXN
            await this.updateExchangeRate();
            
            // Cargar precios iniciales
            await this.updateAllPrices();
            
            // Configurar auto-actualización
            this.setupAutoUpdate();
            
            this.isInitialized = true;
            console.log('✅ Sistema de precios inicializado correctamente');
            
            // Notificar a listeners
            this.notifyListeners('initialized', { 
                timestamp: Date.now(),
                exchangeRate: this.exchangeRate 
            });
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de precios:', error);
            throw error;
        }
    }

    setupCircuitBreakers() {
        // Circuit breaker para API principal
        this.circuitBreakers.set('primary', {
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            failureCount: 0,
            failureThreshold: 5,
            timeout: 300000, // 5 minutos
            lastFailureTime: null
        });

        // Circuit breaker para API fallback
        this.circuitBreakers.set('fallback', {
            state: 'CLOSED',
            failureCount: 0,
            failureThreshold: 3,
            timeout: 600000, // 10 minutos
            lastFailureTime: null
        });
    }

    setupCacheCleanup() {
        // Limpiar cache expirado cada 5 minutos
        setInterval(() => {
            this.cleanExpiredCache();
        }, 300000);
    }

    setupAutoUpdate() {
        // Actualizar precios cada minuto
        setInterval(async () => {
            try {
                await this.updateAllPrices();
            } catch (error) {
                console.warn('⚠️ Error en auto-actualización:', error.message);
            }
        }, PRICING_CONFIG.primary.updateFrequency);
    }

    // =================================================================
    // GESTIÓN DE APIS EXTERNAS
    // =================================================================

    async updateAllPrices() {
        console.log('📊 Actualizando precios de metales preciosos...');
        
        try {
            const symbols = Object.values(PRICING_CONFIG.metals);
            const prices = await this.fetchLatestPrices(symbols);
            
            if (prices && prices.rates) {
                // Procesar y convertir precios
                const processedPrices = this.processPriceData(prices);
                
                // Guardar en cache
                this.setCacheData('latest_prices', processedPrices, PRICING_CONFIG.cacheTTL.realtime);
                
                // Agregar al historial
                this.addToHistory(processedPrices);
                
                this.lastUpdate = Date.now();
                
                // Notificar cambios a listeners
                this.notifyListeners('pricesUpdated', processedPrices);
                
                console.log('✅ Precios actualizados exitosamente');
                return processedPrices;
            }
            
        } catch (error) {
            console.error('❌ Error actualizando precios:', error);
            
            // Intentar usar datos en cache si están disponibles
            const cachedPrices = this.getCacheData('latest_prices');
            if (cachedPrices) {
                console.warn('⚠️ Usando precios en cache debido a error de API');
                return cachedPrices;
            }
            
            throw error;
        }
    }

    async fetchLatestPrices(symbols, useBackup = false) {
        const apiConfig = useBackup ? PRICING_CONFIG.fallback : PRICING_CONFIG.primary;
        const apiKey = useBackup ? 'fallback' : 'primary';
        
        // Verificar circuit breaker
        if (!this.isCircuitBreakerClosed(apiKey)) {
            if (!useBackup) {
                console.warn('🔄 API principal bloqueada, intentando con backup...');
                return await this.fetchLatestPrices(symbols, true);
            } else {
                throw new Error('Todas las APIs están temporalmente no disponibles');
            }
        }

        // Verificar rate limits
        if (!this.checkRateLimit(apiKey)) {
            throw new Error(`Rate limit excedido para ${apiConfig.name}`);
        }

        try {
            const url = `${apiConfig.baseURL}${apiConfig.endpoints.latest}`;
            let params;
            
            // Configurar parámetros según la API
            if (apiConfig.name === 'MetalpriceAPI') {
                params = new URLSearchParams({
                    api_key: apiConfig.apiKey,
                    base: PRICING_CONFIG.currencies.base,
                    currencies: symbols.join(',')
                });
            } else if (apiConfig.name === 'MetalsDev') {
                params = new URLSearchParams({
                    api_key: apiConfig.apiKey,
                    base: PRICING_CONFIG.currencies.base,
                    symbols: symbols.join(',')
                });
            } else {
                // Formato genérico
                params = new URLSearchParams({
                    access_key: apiConfig.apiKey,
                    base: PRICING_CONFIG.currencies.base,
                    symbols: symbols.join(',')
                });
            }

            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error?.info || 'Error desconocido de API');
            }

            // Reset circuit breaker en caso de éxito
            this.resetCircuitBreaker(apiKey);
            
            // Actualizar rate limiter
            this.updateRateLimit(apiKey);
            
            return data;

        } catch (error) {
            // Manejar fallas de circuit breaker
            this.handleCircuitBreakerFailure(apiKey);
            
            // Intentar backup si no lo estábamos usando
            if (!useBackup) {
                console.warn('🔄 Error en API principal, intentando backup...');
                return await this.fetchLatestPrices(symbols, true);
            }
            
            throw error;
        }
    }

    // =================================================================
    // PROCESAMIENTO DE DATOS DE PRECIOS
    // =================================================================

    processPriceData(rawData) {
        const processed = {
            timestamp: rawData.timestamp || Date.now(),
            base: rawData.base,
            rates: {},
            pricesPerGram: {},
            pricesPerOz: {},
            source: rawData.source || 'MetalsAPI'
        };

        // Procesar cada metal
        Object.entries(PRICING_CONFIG.metals).forEach(([metal, symbol]) => {
            if (rawData.rates && rawData.rates[symbol]) {
                const pricePerOz = 1 / rawData.rates[symbol]; // Convertir de rate a precio
                const pricePerGram = pricePerOz / PRICING_CONFIG.weights.ozToGrams;
                
                processed.rates[symbol] = rawData.rates[symbol];
                processed.pricesPerOz[metal] = pricePerOz;
                processed.pricesPerGram[metal] = pricePerGram;
                
                // Calcular precios por quilates para oro
                if (metal === 'gold') {
                    processed.goldByKarat = {};
                    Object.entries(PRICING_CONFIG.goldPurity).forEach(([karat, purity]) => {
                        processed.goldByKarat[karat] = {
                            pricePerGram: pricePerGram * purity,
                            pricePerOz: pricePerOz * purity,
                            purity: purity
                        };
                    });
                }
            }
        });

        // Convertir a pesos mexicanos
        processed.pricesInMXN = this.convertToPesos(processed);
        
        return processed;
    }

    convertToPesos(priceData) {
        const mxnPrices = {
            pricesPerGram: {},
            pricesPerOz: {},
            goldByKarat: {}
        };

        // Convertir precios por gramo
        Object.entries(priceData.pricesPerGram).forEach(([metal, price]) => {
            mxnPrices.pricesPerGram[metal] = price * this.exchangeRate;
        });

        // Convertir precios por onza
        Object.entries(priceData.pricesPerOz).forEach(([metal, price]) => {
            mxnPrices.pricesPerOz[metal] = price * this.exchangeRate;
        });

        // Convertir precios de oro por quilates
        if (priceData.goldByKarat) {
            Object.entries(priceData.goldByKarat).forEach(([karat, data]) => {
                mxnPrices.goldByKarat[karat] = {
                    pricePerGram: data.pricePerGram * this.exchangeRate,
                    pricePerOz: data.pricePerOz * this.exchangeRate,
                    purity: data.purity
                };
            });
        }

        return mxnPrices;
    }

    // =================================================================
    // GESTIÓN DE TIPOS DE CAMBIO
    // =================================================================

    async updateExchangeRate() {
        try {
            const cacheKey = 'exchange_rate_usd_mxn';
            const cached = this.getCacheData(cacheKey);
            
            if (cached) {
                this.exchangeRate = cached.rate;
                return cached.rate;
            }

            console.log('💱 Actualizando tipo de cambio USD/MXN...');

            // Intentar múltiples fuentes para el tipo de cambio
            const sources = [
                {
                    name: 'ExchangeRate-API',
                    url: 'https://api.exchangerate-api.com/v4/latest/USD',
                    parser: (data) => data.rates?.MXN
                },
                {
                    name: 'Fixer.io',
                    url: 'https://api.fixer.io/latest?access_key=demo&symbols=MXN&base=USD',
                    parser: (data) => data.rates?.MXN
                },
                {
                    name: 'CurrencyAPI',
                    url: 'https://api.currencyapi.com/v3/latest?apikey=demo&currencies=MXN&base_currency=USD',
                    parser: (data) => data.data?.MXN?.value
                }
            ];

            for (const source of sources) {
                try {
                    console.log(`🔄 Intentando ${source.name}...`);
                    
                    const response = await fetch(source.url, {
                        timeout: 8000,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'ciaociao.mx/1.0'
                        }
                    });
                    
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    const rate = source.parser(data);
                    
                    if (rate && rate > 15 && rate < 25) { // Validación básica del rango
                        this.exchangeRate = rate;
                        
                        // Guardar en cache por 30 minutos
                        this.setCacheData(cacheKey, {
                            rate: this.exchangeRate,
                            source: source.name,
                            timestamp: Date.now()
                        }, 30 * 60 * 1000);
                        
                        console.log(`✅ Tipo de cambio actualizado desde ${source.name}: $${this.exchangeRate.toFixed(4)} MXN/USD`);
                        return this.exchangeRate;
                    }
                    
                } catch (error) {
                    console.warn(`⚠️ Error con ${source.name}:`, error.message);
                    continue;
                }
            }

            // Si todas las fuentes fallan, usar valor por defecto actualizado
            console.warn('⚠️ No se pudo obtener tipo de cambio de APIs, usando valor por defecto');
            
            // Valor por defecto basado en promedio de mercado (agosto 2025)
            this.exchangeRate = 19.85;
            
            return this.exchangeRate;
            
        } catch (error) {
            console.warn('⚠️ Error general actualizando tipo de cambio:', error.message);
            this.exchangeRate = 19.85; // Fallback seguro
            return this.exchangeRate;
        }
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA CALCULADORA
    // =================================================================

    async getMetalPrice(metal, karats = null, weight = 1) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const priceData = this.getCacheData('latest_prices');
        if (!priceData) {
            throw new Error('No hay datos de precios disponibles');
        }

        let pricePerGram;
        
        if (metal === 'gold' || metal === 'oro') {
            if (karats && priceData.pricesInMXN.goldByKarat[karats]) {
                pricePerGram = priceData.pricesInMXN.goldByKarat[karats].pricePerGram;
            } else {
                pricePerGram = priceData.pricesInMXN.pricesPerGram.gold;
            }
        } else {
            // Mapear nombres en español
            const metalMap = {
                'plata': 'silver',
                'platino': 'platinum',
                'paladio': 'palladium'
            };
            
            const englishMetal = metalMap[metal] || metal;
            pricePerGram = priceData.pricesInMXN.pricesPerGram[englishMetal];
        }

        if (!pricePerGram) {
            throw new Error(`Precio no disponible para ${metal}`);
        }

        return {
            pricePerGram: pricePerGram,
            totalPrice: pricePerGram * weight,
            metal: metal,
            karats: karats,
            weight: weight,
            timestamp: priceData.timestamp,
            source: priceData.source
        };
    }

    async getAllCurrentPrices() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const priceData = this.getCacheData('latest_prices');
        if (!priceData) {
            throw new Error('No hay datos de precios disponibles');
        }

        return {
            timestamp: priceData.timestamp,
            lastUpdate: this.lastUpdate,
            exchangeRate: this.exchangeRate,
            source: priceData.source,
            usdPrices: {
                gold: priceData.pricesPerGram.gold,
                silver: priceData.pricesPerGram.silver,
                platinum: priceData.pricesPerGram.platinum,
                palladium: priceData.pricesPerGram.palladium
            },
            mxnPrices: priceData.pricesInMXN.pricesPerGram,
            goldByKarat: priceData.pricesInMXN.goldByKarat
        };
    }

    // =================================================================
    // SISTEMA DE CACHE AVANZADO
    // =================================================================

    setCacheData(key, data, ttl) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        });
        
        // También guardar en localStorage para persistencia
        try {
            localStorage.setItem(`kitco_cache_${key}`, JSON.stringify({
                data: data,
                timestamp: Date.now(),
                ttl: ttl
            }));
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
        }
    }

    getCacheData(key) {
        // Primero verificar cache en memoria
        const memoryCache = this.cache.get(key);
        if (memoryCache && this.isCacheValid(memoryCache)) {
            return memoryCache.data;
        }

        // Si no está en memoria, verificar localStorage
        try {
            const localCache = localStorage.getItem(`kitco_cache_${key}`);
            if (localCache) {
                const parsed = JSON.parse(localCache);
                if (this.isCacheValid(parsed)) {
                    // Restaurar en cache de memoria
                    this.cache.set(key, parsed);
                    return parsed.data;
                }
            }
        } catch (error) {
            console.warn('Error leyendo cache de localStorage:', error);
        }

        return null;
    }

    isCacheValid(cacheEntry) {
        return cacheEntry && (Date.now() - cacheEntry.timestamp) < cacheEntry.ttl;
    }

    cleanExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;

        // Limpiar cache en memoria
        for (const [key, value] of this.cache.entries()) {
            if (!this.isCacheValid(value)) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        // Limpiar localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kitco_cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (!this.isCacheValid(data)) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cache limpiado: ${cleanedCount} entradas expiradas eliminadas`);
        }
    }

    // =================================================================
    // CIRCUIT BREAKERS Y RATE LIMITING
    // =================================================================

    isCircuitBreakerClosed(apiKey) {
        const breaker = this.circuitBreakers.get(apiKey);
        if (!breaker) return true;

        if (breaker.state === 'OPEN') {
            // Verificar si es momento de intentar nuevamente
            if (Date.now() - breaker.lastFailureTime > breaker.timeout) {
                breaker.state = 'HALF_OPEN';
                console.log(`🔄 Circuit breaker ${apiKey} cambió a HALF_OPEN`);
            }
        }

        return breaker.state !== 'OPEN';
    }

    handleCircuitBreakerFailure(apiKey) {
        const breaker = this.circuitBreakers.get(apiKey);
        if (!breaker) return;

        breaker.failureCount++;
        breaker.lastFailureTime = Date.now();

        if (breaker.failureCount >= breaker.failureThreshold) {
            breaker.state = 'OPEN';
            console.warn(`⚠️ Circuit breaker ${apiKey} ABIERTO por fallas múltiples`);
        }
    }

    resetCircuitBreaker(apiKey) {
        const breaker = this.circuitBreakers.get(apiKey);
        if (breaker) {
            breaker.failureCount = 0;
            breaker.state = 'CLOSED';
            breaker.lastFailureTime = null;
        }
    }

    checkRateLimit(apiKey) {
        const now = Date.now();
        const limiter = this.rateLimiters.get(apiKey) || {
            requests: [],
            window: 60000 // 1 minuto
        };

        // Limpiar requests antiguos
        limiter.requests = limiter.requests.filter(time => now - time < limiter.window);

        const config = apiKey === 'primary' ? PRICING_CONFIG.primary : PRICING_CONFIG.fallback;
        const limit = config.rateLimits.requestsPerMinute;

        return limiter.requests.length < limit;
    }

    updateRateLimit(apiKey) {
        const now = Date.now();
        const limiter = this.rateLimiters.get(apiKey) || {
            requests: [],
            window: 60000
        };

        limiter.requests.push(now);
        this.rateLimiters.set(apiKey, limiter);
    }

    // =================================================================
    // GESTIÓN DE HISTORIAL
    // =================================================================

    addToHistory(priceData) {
        this.priceHistory.push({
            ...priceData,
            id: Date.now()
        });

        // Mantener solo los últimos 1000 registros
        if (this.priceHistory.length > 1000) {
            this.priceHistory = this.priceHistory.slice(-1000);
        }

        // Guardar historial en localStorage
        try {
            localStorage.setItem('kitco_price_history', JSON.stringify(this.priceHistory));
        } catch (error) {
            console.warn('No se pudo guardar historial:', error);
        }
    }

    loadConfiguration() {
        try {
            // Cargar historial de precios
            const storedHistory = localStorage.getItem('kitco_price_history');
            if (storedHistory) {
                this.priceHistory = JSON.parse(storedHistory);
            }

            // Cargar configuración personalizada
            const storedConfig = localStorage.getItem('kitco_user_config');
            if (storedConfig) {
                const userConfig = JSON.parse(storedConfig);
                // Aplicar configuración del usuario
                if (userConfig.exchangeRate) {
                    this.exchangeRate = userConfig.exchangeRate;
                }
            }

        } catch (error) {
            console.warn('Error cargando configuración:', error);
        }
    }

    // =================================================================
    // SISTEMA DE EVENTOS/LISTENERS
    // =================================================================

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error en listener:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS DE UTILIDAD
    // =================================================================

    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            lastUpdate: this.lastUpdate,
            exchangeRate: this.exchangeRate,
            cacheSize: this.cache.size,
            historySize: this.priceHistory.length,
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            rateLimiters: Object.fromEntries(this.rateLimiters)
        };
    }

    async forceUpdate() {
        console.log('🔄 Forzando actualización de precios...');
        // Limpiar cache para forzar fetch fresco
        this.cache.delete('latest_prices');
        return await this.updateAllPrices();
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.kitcoPricing = new KitcoPricingManager();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KitcoPricingManager;
}

console.log('✅ Sistema de Precios Globales Kitco v2.0 cargado correctamente');