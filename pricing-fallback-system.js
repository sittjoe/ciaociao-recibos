// pricing-fallback-system.js - SISTEMA DE RESPALDO Y CIRCUIT BREAKER v1.0
// Manejo robusto de múltiples APIs con failover automático
// =================================================================

console.log('🔄 Iniciando Sistema de Respaldo de APIs v1.0...');

// =================================================================
// CONFIGURACIÓN DE MÚLTIPLES APIS
// =================================================================

const FALLBACK_CONFIG = {
    // Orden de prioridad de APIs
    apiPriority: ['metals-api', 'metalprice-api', 'fallback-static'],
    
    // Configuración específica de cada API
    apis: {
        'metals-api': {
            name: 'Metals-API',
            baseURL: 'https://metals-api.com/api',
            apiKey: 'YOUR_METALS_API_KEY',
            rateLimits: {
                requestsPerMinute: 200,
                requestsPerMonth: 100000
            },
            endpoints: {
                latest: '/latest',
                historical: '/historical'
            },
            parseResponse: (data) => ({
                success: data.success,
                rates: data.rates,
                timestamp: data.timestamp,
                base: data.base
            })
        },
        
        'metalprice-api': {
            name: 'MetalpriceAPI',
            baseURL: 'https://api.metalpriceapi.com/v1',
            apiKey: 'YOUR_METALPRICE_API_KEY',
            rateLimits: {
                requestsPerMinute: 60,
                requestsPerMonth: 100
            },
            endpoints: {
                latest: '/latest',
                historical: '/historical'
            },
            parseResponse: (data) => ({
                success: data.success,
                rates: data.rates,
                timestamp: data.timestamp || Date.now(),
                base: data.base
            })
        },
        
        'fallback-static': {
            name: 'Static Fallback',
            type: 'static',
            // Precios de emergencia actualizados enero 2025
            staticPrices: {
                XAU: 0.00037037, // $2,700/oz (oro)
                XAG: 0.02632,    // $38/oz (plata)  
                XPT: 0.001026,   // $975/oz (platino)
                XPD: 0.000714    // $1,400/oz (paladio)
            },
            lastUpdate: '2025-01-15T00:00:00Z'
        }
    },

    // Configuración de Circuit Breakers
    circuitBreaker: {
        failureThreshold: 5,     // Fallas antes de abrir el circuito
        successThreshold: 3,     // Éxitos para cerrar circuito en half-open
        timeout: 300000,         // 5 minutos antes de intentar half-open
        monitorWindow: 600000    // 10 minutos de ventana de monitoreo
    },

    // Configuración de timeouts
    timeouts: {
        request: 10000,          // 10 segundos por request
        totalOperation: 30000    // 30 segundos para operación completa
    },

    // Configuración de reintentos
    retry: {
        maxAttempts: 3,
        baseDelay: 1000,         // 1 segundo
        maxDelay: 5000,          // 5 segundos máximo
        backoffMultiplier: 2     // Exponential backoff
    }
};

// =================================================================
// CLASE PRINCIPAL DE CIRCUIT BREAKER
// =================================================================

class CircuitBreaker {
    constructor(name, config = FALLBACK_CONFIG.circuitBreaker) {
        this.name = name;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.config = config;
        this.metrics = this.resetMetrics();
        this.lastStateChange = Date.now();
        this.listeners = [];
    }

    resetMetrics() {
        return {
            failures: 0,
            successes: 0,
            requests: 0,
            lastFailure: null,
            lastSuccess: null,
            requestTimes: []
        };
    }

    async execute(operation) {
        // Verificar si el circuito está abierto
        if (this.state === 'OPEN') {
            if (this.shouldAttemptHalfOpen()) {
                this.setState('HALF_OPEN');
                console.log(`🔄 Circuit breaker ${this.name} cambió a HALF_OPEN`);
            } else {
                throw new Error(`Circuit breaker ${this.name} está ABIERTO`);
            }
        }

        this.metrics.requests++;
        const startTime = Date.now();

        try {
            const result = await operation();
            this.onSuccess(Date.now() - startTime);
            return result;
        } catch (error) {
            this.onFailure(error, Date.now() - startTime);
            throw error;
        }
    }

    onSuccess(responseTime) {
        this.metrics.successes++;
        this.metrics.lastSuccess = Date.now();
        this.metrics.requestTimes.push(responseTime);

        // Mantener solo los últimos 100 tiempos de respuesta
        if (this.metrics.requestTimes.length > 100) {
            this.metrics.requestTimes = this.metrics.requestTimes.slice(-100);
        }

        if (this.state === 'HALF_OPEN') {
            if (this.metrics.successes >= this.config.successThreshold) {
                this.setState('CLOSED');
                this.metrics = this.resetMetrics();
                console.log(`✅ Circuit breaker ${this.name} CERRADO después de éxitos consecutivos`);
            }
        }

        this.notifyListeners('success', { responseTime });
    }

    onFailure(error, responseTime) {
        this.metrics.failures++;
        this.metrics.lastFailure = Date.now();
        
        if (this.state === 'CLOSED') {
            if (this.metrics.failures >= this.config.failureThreshold) {
                this.setState('OPEN');
                console.warn(`⚠️ Circuit breaker ${this.name} ABIERTO por fallas múltiples`);
            }
        } else if (this.state === 'HALF_OPEN') {
            this.setState('OPEN');
            console.warn(`⚠️ Circuit breaker ${this.name} volvió a ABIERTO en half-open`);
        }

        this.notifyListeners('failure', { error, responseTime });
    }

    shouldAttemptHalfOpen() {
        const timeSinceLastFailure = Date.now() - (this.metrics.lastFailure || 0);
        return timeSinceLastFailure >= this.config.timeout;
    }

    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.lastStateChange = Date.now();
        this.notifyListeners('stateChange', { oldState, newState });
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, { ...data, circuitBreaker: this.name, state: this.state });
            } catch (error) {
                console.error('Error en listener de circuit breaker:', error);
            }
        });
    }

    getStatus() {
        return {
            name: this.name,
            state: this.state,
            metrics: { ...this.metrics },
            lastStateChange: this.lastStateChange,
            config: this.config
        };
    }

    reset() {
        this.state = 'CLOSED';
        this.metrics = this.resetMetrics();
        this.lastStateChange = Date.now();
        console.log(`🔄 Circuit breaker ${this.name} reiniciado manualmente`);
    }
}

// =================================================================
// GESTOR DE APIS CON FALLBACK
// =================================================================

class APIFallbackManager {
    constructor() {
        this.circuitBreakers = new Map();
        this.rateLimiters = new Map();
        this.currentAPIIndex = 0;
        this.successfulAPIs = new Set();
        
        // Inicializar circuit breakers para cada API
        this.initializeCircuitBreakers();
        
        // Configurar monitoreo de salud
        this.setupHealthMonitoring();
    }

    initializeCircuitBreakers() {
        FALLBACK_CONFIG.apiPriority.forEach(apiKey => {
            const breaker = new CircuitBreaker(apiKey);
            
            // Agregar listener para logging
            breaker.addListener((event, data) => {
                console.log(`🔧 Circuit Breaker ${data.circuitBreaker}: ${event}`, data);
            });
            
            this.circuitBreakers.set(apiKey, breaker);
        });
    }

    setupHealthMonitoring() {
        // Verificar salud de APIs cada 5 minutos
        setInterval(() => {
            this.performHealthCheck();
        }, 300000);
    }

    async fetchWithFallback(symbols = ['XAU', 'XAG', 'XPT', 'XPD'], forceAPI = null) {
        const startTime = Date.now();
        let lastError = null;
        
        const apiList = forceAPI ? [forceAPI] : FALLBACK_CONFIG.apiPriority;
        
        for (const apiKey of apiList) {
            try {
                console.log(`🔍 Intentando API: ${apiKey}`);
                
                const result = await this.fetchFromAPI(apiKey, symbols);
                
                if (result && result.success) {
                    this.recordSuccess(apiKey);
                    const totalTime = Date.now() - startTime;
                    
                    console.log(`✅ Éxito con ${apiKey} en ${totalTime}ms`);
                    
                    return {
                        ...result,
                        source: FALLBACK_CONFIG.apis[apiKey].name,
                        apiKey: apiKey,
                        responseTime: totalTime,
                        fallbackUsed: apiKey !== FALLBACK_CONFIG.apiPriority[0]
                    };
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Falla en ${apiKey}: ${error.message}`);
                continue;
            }
        }
        
        // Si todas las APIs fallaron, lanzar el último error
        throw new Error(`Todas las APIs fallaron. Último error: ${lastError?.message}`);
    }

    async fetchFromAPI(apiKey, symbols) {
        const apiConfig = FALLBACK_CONFIG.apis[apiKey];
        const circuitBreaker = this.circuitBreakers.get(apiKey);
        
        if (!apiConfig) {
            throw new Error(`API ${apiKey} no configurada`);
        }

        // Verificar rate limits
        if (!this.checkRateLimit(apiKey)) {
            throw new Error(`Rate limit excedido para ${apiKey}`);
        }

        // Usar circuit breaker para ejecutar la operación
        return await circuitBreaker.execute(async () => {
            
            // API estática (fallback de emergencia)
            if (apiConfig.type === 'static') {
                return this.getStaticPrices(apiConfig, symbols);
            }
            
            // APIs reales
            return await this.makeHTTPRequest(apiConfig, symbols);
        });
    }

    async makeHTTPRequest(apiConfig, symbols) {
        const url = `${apiConfig.baseURL}${apiConfig.endpoints.latest}`;
        const params = new URLSearchParams({
            access_key: apiConfig.apiKey,
            base: 'USD',
            symbols: symbols.join(',')
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, FALLBACK_CONFIG.timeouts.request);

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Usar el parser específico de la API
            const parsedData = apiConfig.parseResponse(data);
            
            if (!parsedData.success) {
                throw new Error(parsedData.error?.message || 'Error desconocido de API');
            }

            // Actualizar rate limiter
            this.updateRateLimit(apiConfig.name);
            
            return parsedData;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    getStaticPrices(apiConfig, symbols) {
        console.log('📊 Usando precios estáticos de emergencia');
        
        const rates = {};
        symbols.forEach(symbol => {
            if (apiConfig.staticPrices[symbol]) {
                rates[symbol] = apiConfig.staticPrices[symbol];
            }
        });

        return {
            success: true,
            rates: rates,
            timestamp: new Date(apiConfig.lastUpdate).getTime(),
            base: 'USD',
            warning: 'Usando precios estáticos de emergencia - actualizar manualmente'
        };
    }

    // =================================================================
    // GESTIÓN DE RATE LIMITS
    // =================================================================

    checkRateLimit(apiKey) {
        const now = Date.now();
        const apiConfig = FALLBACK_CONFIG.apis[apiKey];
        
        if (!apiConfig || apiConfig.type === 'static') {
            return true; // Sin límites para API estática
        }

        const limiter = this.rateLimiters.get(apiKey) || {
            requests: [],
            window: 60000 // 1 minuto
        };

        // Limpiar requests antiguos
        limiter.requests = limiter.requests.filter(time => now - time < limiter.window);

        const limit = apiConfig.rateLimits.requestsPerMinute;
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
    // MONITOREO DE SALUD
    // =================================================================

    async performHealthCheck() {
        console.log('🏥 Realizando verificación de salud de APIs...');
        
        const healthStatus = {};
        
        for (const apiKey of FALLBACK_CONFIG.apiPriority) {
            if (FALLBACK_CONFIG.apis[apiKey].type === 'static') {
                healthStatus[apiKey] = { status: 'available', type: 'static' };
                continue;
            }

            try {
                const result = await this.fetchFromAPI(apiKey, ['XAU']);
                healthStatus[apiKey] = {
                    status: result.success ? 'healthy' : 'unhealthy',
                    lastCheck: Date.now(),
                    circuitState: this.circuitBreakers.get(apiKey).state
                };
            } catch (error) {
                healthStatus[apiKey] = {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: Date.now(),
                    circuitState: this.circuitBreakers.get(apiKey).state
                };
            }
        }

        // Guardar estado de salud
        localStorage.setItem('api_health_status', JSON.stringify(healthStatus));
        
        console.log('📊 Estado de salud de APIs:', healthStatus);
    }

    recordSuccess(apiKey) {
        this.successfulAPIs.add(apiKey);
        
        // Si es una API diferente a la principal, considerar cambiar prioridad
        if (apiKey !== FALLBACK_CONFIG.apiPriority[0]) {
            console.log(`🔄 API ${apiKey} funcionando - disponible para priorización`);
        }
    }

    // =================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================

    async getLatestPrices(symbols = ['XAU', 'XAG', 'XPT', 'XPD']) {
        try {
            return await this.fetchWithFallback(symbols);
        } catch (error) {
            console.error('❌ Error obteniendo precios con todas las APIs:', error);
            throw error;
        }
    }

    getSystemStatus() {
        const circuitStatus = {};
        this.circuitBreakers.forEach((breaker, key) => {
            circuitStatus[key] = breaker.getStatus();
        });

        const rateLimitStatus = {};
        this.rateLimiters.forEach((limiter, key) => {
            rateLimitStatus[key] = {
                currentRequests: limiter.requests.length,
                limit: FALLBACK_CONFIG.apis[key]?.rateLimits?.requestsPerMinute || 'N/A'
            };
        });

        return {
            circuitBreakers: circuitStatus,
            rateLimiters: rateLimitStatus,
            successfulAPIs: Array.from(this.successfulAPIs),
            configuration: FALLBACK_CONFIG
        };
    }

    resetAllCircuitBreakers() {
        this.circuitBreakers.forEach(breaker => breaker.reset());
        console.log('🔄 Todos los circuit breakers reiniciados');
    }

    setAPIKey(apiKey, keyValue) {
        if (FALLBACK_CONFIG.apis[apiKey]) {
            FALLBACK_CONFIG.apis[apiKey].apiKey = keyValue;
            console.log(`🔑 API key actualizada para ${apiKey}`);
        }
    }

    // =================================================================
    // UTILIDADES DE CONFIGURACIÓN
    // =================================================================

    updateStaticPrices(newPrices) {
        const staticAPI = FALLBACK_CONFIG.apis['fallback-static'];
        if (staticAPI) {
            staticAPI.staticPrices = { ...staticAPI.staticPrices, ...newPrices };
            staticAPI.lastUpdate = new Date().toISOString();
            console.log('📊 Precios estáticos actualizados:', newPrices);
        }
    }

    getHealthStatus() {
        try {
            const stored = localStorage.getItem('api_health_status');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }
}

// =================================================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// =================================================================

class EnhancedKitcoPricingManager extends KitcoPricingManager {
    constructor() {
        super();
        this.fallbackManager = new APIFallbackManager();
    }

    async fetchLatestPrices(symbols, useBackup = false) {
        try {
            // Usar el nuevo sistema de fallback
            return await this.fallbackManager.getLatestPrices(symbols);
        } catch (error) {
            console.error('❌ Sistema de fallback falló completamente:', error);
            
            // Como último recurso, usar precios en cache si están disponibles
            const cachedPrices = this.getCacheData('latest_prices');
            if (cachedPrices) {
                console.warn('⚠️ Usando datos en cache como último recurso');
                return {
                    ...cachedPrices,
                    warning: 'Datos en cache - APIs no disponibles'
                };
            }
            
            throw error;
        }
    }

    getExtendedStatus() {
        return {
            ...this.getSystemStatus(),
            fallbackManager: this.fallbackManager.getSystemStatus(),
            apiHealth: this.fallbackManager.getHealthStatus()
        };
    }

    setAPIKeys(keys) {
        Object.entries(keys).forEach(([api, key]) => {
            this.fallbackManager.setAPIKey(api, key);
        });
    }
}

// =================================================================
// EXPORTACIÓN Y INSTANCIA GLOBAL
// =================================================================

// Reemplazar instancia global con versión mejorada
if (typeof window !== 'undefined') {
    window.kitcoPricing = new EnhancedKitcoPricingManager();
    window.apiFallbackManager = new APIFallbackManager();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedKitcoPricingManager,
        APIFallbackManager,
        CircuitBreaker
    };
}

console.log('✅ Sistema de Respaldo y Circuit Breaker v1.0 cargado correctamente');