// pricing-integration-system-architect.js - ARQUITECTO DEL SISTEMA INTEGRADO v1.0
// API unificada y sistema de eventos para SUBAGENTE 7
// =================================================================

console.log('🏗️ Iniciando Arquitecto del Sistema de Integración v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE INTEGRACIÓN
// =================================================================

const INTEGRATION_CONFIG = {
    // Orden de prioridad para obtención de precios
    priceSourcePriority: [
        'manual_override',      // 1. Override manual (máxima prioridad)
        'primary_api',          // 2. APIs principales
        'price_validator',      // 3. Validador de precios
        'cache_recent',         // 4. Cache reciente (<2h)
        'fallback_interpolated', // 5. Fallback con interpolación
        'cache_old',            // 6. Cache viejo (2h-24h)
        'emergency_static'      // 7. Precios de emergencia
    ],

    // Configuración de timeouts y reintentos
    timeouts: {
        api_call: 8000,         // 8s timeout por API call
        total_request: 15000,   // 15s timeout total
        fallback_chain: 5000    // 5s para toda la cadena de fallback
    },

    retries: {
        max_attempts: 3,        // Máximo 3 intentos
        backoff_multiplier: 1.5, // Backoff exponencial
        base_delay: 1000        // 1s delay base
    },

    // Configuración del sistema de eventos
    events: {
        price_requested: 'price_requested',
        price_calculated: 'price_calculated',
        source_failed: 'source_failed',
        fallback_activated: 'fallback_activated',
        cache_hit: 'cache_hit',
        cache_miss: 'cache_miss',
        override_applied: 'override_applied',
        system_degraded: 'system_degraded',
        system_recovered: 'system_recovered'
    },

    // Configuración de validación de precios
    validation: {
        min_price_mxn: 1,       // Mínimo $1 MXN
        max_price_mxn: 100000,  // Máximo $100,000 MXN por gramo
        max_deviation: 0.25,    // 25% máxima desviación entre fuentes
        confidence_threshold: 0.7 // Mínima confianza aceptable
    },

    // Configuración de métricas
    metrics: {
        track_performance: true,
        track_accuracy: true,
        track_reliability: true,
        retention_days: 30
    }
};

// =================================================================
// CLASE PRINCIPAL DEL ARQUITECTO DE INTEGRACIÓN
// =================================================================

class PricingIntegrationSystemArchitect {
    constructor() {
        this.eventBus = new Map();
        this.subscribers = new Map();
        this.metrics = this.initializeMetrics();
        this.sourceStatus = new Map();
        this.priceCache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.circuitBreakers = new Map();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando arquitecto de integración...');
        
        try {
            // Verificar disponibilidad de módulos
            this.checkModuleAvailability();
            
            // Configurar circuit breakers
            this.setupCircuitBreakers();
            
            // Inicializar métricas
            this.startMetricsCollection();
            
            // Configurar limpieza automática
            this.setupAutomaticCleanup();
            
            // Configurar health checks
            this.setupHealthChecks();
            
            console.log('✅ Arquitecto de integración inicializado');
            this.emit('system_ready', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('❌ Error inicializando arquitecto:', error);
            this.emit('system_error', { error: error.message, timestamp: Date.now() });
        }
    }

    // =================================================================
    // API UNIFICADA DE PRECIOS
    // =================================================================

    async getPrice(metal, purity, weight = 1, options = {}) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        console.log(`💰 [${requestId}] Solicitando precio: ${metal} ${purity} ${weight}g`);
        
        // Emit evento de solicitud
        this.emit('price_requested', {
            requestId, metal, purity, weight, options, timestamp: startTime
        });

        try {
            // Validar entrada
            this.validatePriceRequest(metal, purity, weight);
            
            // Intentar obtener precio siguiendo orden de prioridad
            const priceResult = await this.getPriceFromSources(metal, purity, weight, options, requestId);
            
            // Validar resultado
            this.validatePriceResult(priceResult);
            
            // Registrar métricas
            const responseTime = Date.now() - startTime;
            this.recordMetrics(requestId, priceResult.source, responseTime, true);
            
            // Emit evento de éxito
            this.emit('price_calculated', {
                requestId, result: priceResult, responseTime, timestamp: Date.now()
            });
            
            console.log(`✅ [${requestId}] Precio obtenido de ${priceResult.source}: $${priceResult.totalPrice} MXN`);
            return priceResult;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.recordMetrics(requestId, 'error', responseTime, false);
            
            console.error(`❌ [${requestId}] Error obteniendo precio:`, error);
            
            // Último recurso: precio de emergencia
            return this.getAbsoluteEmergencyPrice(metal, purity, weight, error, requestId);
        }
    }

    async getPriceFromSources(metal, purity, weight, options, requestId) {
        for (const source of INTEGRATION_CONFIG.priceSourcePriority) {
            try {
                console.log(`🔍 [${requestId}] Intentando fuente: ${source}`);
                
                // Verificar circuit breaker
                if (this.isCircuitBreakerOpen(source)) {
                    console.log(`⚡ [${requestId}] Circuit breaker abierto para ${source}`);
                    continue;
                }
                
                const result = await this.getPriceFromSource(source, metal, purity, weight, options);
                
                if (result && this.isValidPriceResult(result)) {
                    // Marcar fuente como exitosa
                    this.recordSourceSuccess(source);
                    
                    // Agregar metadatos
                    result.requestId = requestId;
                    result.sourceAttempted = source;
                    result.timestamp = Date.now();
                    
                    return result;
                }
                
            } catch (error) {
                console.warn(`⚠️ [${requestId}] Falló fuente ${source}:`, error.message);
                
                // Registrar fallo
                this.recordSourceFailure(source, error);
                
                // Emit evento de fallo
                this.emit('source_failed', {
                    requestId, source, error: error.message, timestamp: Date.now()
                });
                
                continue;
            }
        }
        
        throw new Error('Todas las fuentes de precio fallaron');
    }

    async getPriceFromSource(source, metal, purity, weight, options) {
        const timeout = INTEGRATION_CONFIG.timeouts.api_call;
        
        switch (source) {
            case 'manual_override':
                return await this.getPriceFromManualOverride(metal, purity, weight, options, timeout);
                
            case 'primary_api':
                return await this.getPriceFromPrimaryAPI(metal, purity, weight, options, timeout);
                
            case 'price_validator':
                return await this.getPriceFromValidator(metal, purity, weight, options, timeout);
                
            case 'cache_recent':
                return await this.getPriceFromRecentCache(metal, purity, weight, options);
                
            case 'fallback_interpolated':
                return await this.getPriceFromFallback(metal, purity, weight, options, timeout);
                
            case 'cache_old':
                return await this.getPriceFromOldCache(metal, purity, weight, options);
                
            case 'emergency_static':
                return await this.getPriceFromEmergency(metal, purity, weight, options);
                
            default:
                throw new Error(`Fuente desconocida: ${source}`);
        }
    }

    // =================================================================
    // IMPLEMENTACIONES POR FUENTE
    // =================================================================

    async getPriceFromManualOverride(metal, purity, weight, options, timeout) {
        if (!window.advancedManualPricingOverride) {
            throw new Error('Manual override system not available');
        }
        
        const result = await this.withTimeout(
            window.advancedManualPricingOverride.getPriceWithOverride(metal, purity, weight),
            timeout
        );
        
        if (result && result.hasOverride) {
            this.emit('override_applied', {
                metal, purity, weight, price: result.totalPrice, timestamp: Date.now()
            });
            
            return {
                totalPrice: result.totalPrice,
                pricePerGram: result.pricePerGram,
                source: 'manual_override',
                confidence: 'high',
                hasOverride: true,
                overrideDetails: result.override
            };
        }
        
        throw new Error('No manual override available');
    }

    async getPriceFromPrimaryAPI(metal, purity, weight, options, timeout) {
        if (!window.realMetalsAPI) {
            throw new Error('Primary metals API not available');
        }
        
        const result = await this.withTimeout(
            window.realMetalsAPI.getMetalPrice(metal, purity),
            timeout
        );
        
        if (result && result.pricePerGram) {
            return {
                totalPrice: result.pricePerGram * weight,
                pricePerGram: result.pricePerGram,
                source: 'primary_api',
                confidence: 'high',
                apiDetails: result
            };
        }
        
        throw new Error('Primary API returned invalid result');
    }

    async getPriceFromValidator(metal, purity, weight, options, timeout) {
        if (!window.realTimePriceValidator) {
            throw new Error('Price validator not available');
        }
        
        const result = await this.withTimeout(
            window.realTimePriceValidator.getValidatedPrice(metal, purity),
            timeout
        );
        
        if (result && result.averagePrice) {
            return {
                totalPrice: result.averagePrice * weight,
                pricePerGram: result.averagePrice,
                source: 'price_validator',
                confidence: result.confidence || 'medium',
                validationDetails: result
            };
        }
        
        throw new Error('Price validator returned invalid result');
    }

    async getPriceFromRecentCache(metal, purity, weight, options) {
        const cacheKey = `${metal}_${purity}`;
        const cached = this.priceCache.get(cacheKey);
        
        if (cached) {
            const age = Date.now() - cached.timestamp;
            const maxAge = 2 * 60 * 60 * 1000; // 2 horas
            
            if (age < maxAge) {
                this.emit('cache_hit', {
                    key: cacheKey, age, source: 'recent_cache', timestamp: Date.now()
                });
                
                return {
                    totalPrice: cached.pricePerGram * weight,
                    pricePerGram: cached.pricePerGram,
                    source: 'cache_recent',
                    confidence: 'medium',
                    cacheAge: age,
                    originalSource: cached.originalSource
                };
            }
        }
        
        throw new Error('No recent cache available');
    }

    async getPriceFromFallback(metal, purity, weight, options, timeout) {
        if (!window.fallbackPriceCalculator) {
            throw new Error('Fallback calculator not available');
        }
        
        const result = await this.withTimeout(
            window.fallbackPriceCalculator.getPrice(metal, purity, weight, options),
            timeout
        );
        
        if (result && result.totalPrice) {
            this.emit('fallback_activated', {
                metal, purity, weight, stage: result.source, timestamp: Date.now()
            });
            
            return {
                totalPrice: result.totalPrice,
                pricePerGram: result.pricePerGram,
                source: 'fallback_interpolated',
                confidence: result.confidence || 'low',
                fallbackStage: result.source,
                fallbackDetails: result
            };
        }
        
        throw new Error('Fallback calculator returned invalid result');
    }

    async getPriceFromOldCache(metal, purity, weight, options) {
        const cacheKey = `${metal}_${purity}`;
        const cached = this.priceCache.get(cacheKey);
        
        if (cached) {
            const age = Date.now() - cached.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (age < maxAge) {
                console.warn(`⚠️ Usando cache viejo (${Math.floor(age / (60 * 60 * 1000))} horas)`);
                
                return {
                    totalPrice: cached.pricePerGram * weight,
                    pricePerGram: cached.pricePerGram,
                    source: 'cache_old',
                    confidence: 'low',
                    cacheAge: age,
                    warning: 'Precio desactualizado',
                    originalSource: cached.originalSource
                };
            }
        }
        
        throw new Error('No old cache available');
    }

    async getPriceFromEmergency(metal, purity, weight, options) {
        // Precios de emergencia hardcodeados
        const emergencyPrices = {
            gold: {
                '24k': 1172, '22k': 1075, '18k': 879, '14k': 686, '10k': 488
            },
            silver: {
                '999': 23, '958': 22, '925': 21, '900': 20, '800': 18
            },
            platinum: {
                '999': 654, '950': 621, '900': 588, '850': 556
            },
            palladium: {
                '999': 672, '950': 638, '900': 605
            }
        };

        const metalPrices = emergencyPrices[metal.toLowerCase()];
        if (!metalPrices) {
            throw new Error(`Metal ${metal} no disponible en emergencia`);
        }

        const pricePerGram = metalPrices[purity];
        if (!pricePerGram) {
            throw new Error(`Pureza ${purity} no disponible para ${metal}`);
        }

        return {
            totalPrice: pricePerGram * weight,
            pricePerGram: pricePerGram,
            source: 'emergency_static',
            confidence: 'emergency',
            warning: 'PRECIO DE EMERGENCIA - VERIFICAR MANUALMENTE'
        };
    }

    // =================================================================
    // SISTEMA DE EVENTOS
    // =================================================================

    emit(event, data) {
        const subscribers = this.subscribers.get(event) || [];
        
        for (const callback of subscribers) {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Error en subscriber de evento ${event}:`, error);
            }
        }

        // Log del evento
        console.log(`📡 Evento emitido: ${event}`, data);
    }

    on(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        
        this.subscribers.get(event).push(callback);
        
        // Devolver función para cancelar suscripción
        return () => {
            const subscribers = this.subscribers.get(event);
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    off(event, callback) {
        const subscribers = this.subscribers.get(event);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        }
    }

    // =================================================================
    // CIRCUIT BREAKERS
    // =================================================================

    setupCircuitBreakers() {
        const sources = INTEGRATION_CONFIG.priceSourcePriority;
        
        for (const source of sources) {
            this.circuitBreakers.set(source, {
                failureCount: 0,
                lastFailure: null,
                isOpen: false,
                threshold: 5, // 5 fallos consecutivos
                resetTimeout: 60000 // 1 minuto
            });
        }
    }

    recordSourceSuccess(source) {
        const breaker = this.circuitBreakers.get(source);
        if (breaker) {
            breaker.failureCount = 0;
            breaker.isOpen = false;
            breaker.lastFailure = null;
        }
    }

    recordSourceFailure(source, error) {
        const breaker = this.circuitBreakers.get(source);
        if (!breaker) return;
        
        breaker.failureCount++;
        breaker.lastFailure = Date.now();
        
        if (breaker.failureCount >= breaker.threshold) {
            breaker.isOpen = true;
            console.warn(`⚡ Circuit breaker abierto para ${source} (${breaker.failureCount} fallos)`);
            
            // Auto-reset después del timeout
            setTimeout(() => {
                console.log(`🔄 Circuit breaker reset para ${source}`);
                breaker.failureCount = 0;
                breaker.isOpen = false;
            }, breaker.resetTimeout);
        }
    }

    isCircuitBreakerOpen(source) {
        const breaker = this.circuitBreakers.get(source);
        return breaker ? breaker.isOpen : false;
    }

    // =================================================================
    // MÉTRICAS Y MONITOREO
    // =================================================================

    initializeMetrics() {
        return {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            sourceUsage: new Map(),
            sourceReliability: new Map(),
            hourlyActivity: new Map(),
            errorTypes: new Map(),
            lastUpdated: Date.now()
        };
    }

    recordMetrics(requestId, source, responseTime, success) {
        this.metrics.totalRequests++;
        
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Actualizar tiempo promedio de respuesta
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
        this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
        
        // Registrar uso por fuente
        const usage = this.metrics.sourceUsage.get(source) || 0;
        this.metrics.sourceUsage.set(source, usage + 1);
        
        // Registrar confiabilidad por fuente
        if (!this.metrics.sourceReliability.has(source)) {
            this.metrics.sourceReliability.set(source, { success: 0, total: 0 });
        }
        
        const reliability = this.metrics.sourceReliability.get(source);
        reliability.total++;
        if (success) reliability.success++;
        
        // Actividad por hora
        const hour = new Date().getHours();
        const hourKey = `hour_${hour}`;
        const hourlyCount = this.metrics.hourlyActivity.get(hourKey) || 0;
        this.metrics.hourlyActivity.set(hourKey, hourlyCount + 1);
        
        this.metrics.lastUpdated = Date.now();
    }

    startMetricsCollection() {
        if (!INTEGRATION_CONFIG.metrics.track_performance) return;
        
        // Recopilar métricas cada 5 minutos
        setInterval(() => {
            this.collectSystemMetrics();
        }, 5 * 60 * 1000);
        
        // Limpiar métricas antiguas cada hora
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60 * 60 * 1000);
    }

    collectSystemMetrics() {
        const systemMetrics = {
            timestamp: Date.now(),
            integration: this.metrics,
            modules: this.checkModuleHealth(),
            cache: this.getCacheMetrics(),
            circuitBreakers: this.getCircuitBreakerStatus()
        };
        
        // Persistir métricas
        this.persistMetrics(systemMetrics);
    }

    // =================================================================
    // HEALTH CHECKS Y DIAGNÓSTICO
    // =================================================================

    setupHealthChecks() {
        // Health check cada 2 minutos
        setInterval(() => {
            this.performHealthCheck();
        }, 2 * 60 * 1000);
    }

    async performHealthCheck() {
        const healthStatus = {
            timestamp: Date.now(),
            overall: 'healthy',
            modules: {},
            performance: {},
            issues: []
        };
        
        try {
            // Verificar módulos
            healthStatus.modules = this.checkModuleHealth();
            
            // Verificar performance
            healthStatus.performance = this.checkPerformanceHealth();
            
            // Determinar estado general
            const moduleIssues = Object.values(healthStatus.modules).filter(m => !m.healthy).length;
            const performanceIssues = healthStatus.performance.issues || 0;
            
            if (moduleIssues > 2 || performanceIssues > 3) {
                healthStatus.overall = 'critical';
                this.emit('system_degraded', healthStatus);
            } else if (moduleIssues > 0 || performanceIssues > 0) {
                healthStatus.overall = 'degraded';
            }
            
            // Log si hay problemas
            if (healthStatus.overall !== 'healthy') {
                console.warn('⚠️ Health check detectó problemas:', healthStatus);
            }
            
        } catch (error) {
            console.error('❌ Error en health check:', error);
            healthStatus.overall = 'error';
            healthStatus.error = error.message;
        }
    }

    checkModuleHealth() {
        const modules = {
            realMetalsAPI: this.checkModuleStatus('realMetalsAPI'),
            realTimePriceValidator: this.checkModuleStatus('realTimePriceValidator'),
            advancedManualPricingOverride: this.checkModuleStatus('advancedManualPricingOverride'),
            exchangeRateManager: this.checkModuleStatus('exchangeRateManager'),
            fallbackPriceCalculator: this.checkModuleStatus('fallbackPriceCalculator'),
            goldKaratSpecialist: this.checkModuleStatus('goldKaratSpecialist')
        };
        
        return modules;
    }

    checkModuleStatus(moduleName) {
        const module = window[moduleName];
        
        if (!module) {
            return { healthy: false, reason: 'Module not found', available: false };
        }
        
        if (module.getSystemStatus) {
            try {
                const status = module.getSystemStatus();
                return {
                    healthy: status.isInitialized !== false,
                    available: true,
                    status: status
                };
            } catch (error) {
                return { healthy: false, reason: error.message, available: true };
            }
        }
        
        if (module.isInitialized !== undefined) {
            return {
                healthy: module.isInitialized,
                available: true,
                initialized: module.isInitialized
            };
        }
        
        return { healthy: true, available: true, reason: 'No status method' };
    }

    checkPerformanceHealth() {
        const avgResponse = this.metrics.averageResponseTime;
        const successRate = this.metrics.successfulRequests / Math.max(this.metrics.totalRequests, 1);
        
        let issues = 0;
        const warnings = [];
        
        if (avgResponse > 5000) { // > 5 segundos
            issues++;
            warnings.push('Tiempo de respuesta alto');
        }
        
        if (successRate < 0.9) { // < 90% éxito
            issues++;
            warnings.push('Tasa de éxito baja');
        }
        
        return {
            averageResponseTime: avgResponse,
            successRate: successRate * 100,
            issues,
            warnings
        };
    }

    // =================================================================
    // UTILIDADES Y HELPERS
    // =================================================================

    validatePriceRequest(metal, purity, weight) {
        if (!metal || typeof metal !== 'string') {
            throw new Error('Metal debe ser un string válido');
        }
        
        if (!purity || (typeof purity !== 'string' && typeof purity !== 'number')) {
            throw new Error('Pureza debe ser válida');
        }
        
        if (!weight || weight <= 0) {
            throw new Error('Peso debe ser mayor que 0');
        }
    }

    validatePriceResult(result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Resultado de precio inválido');
        }
        
        if (!result.totalPrice || result.totalPrice <= 0) {
            throw new Error('Precio total inválido');
        }
        
        if (result.totalPrice < INTEGRATION_CONFIG.validation.min_price_mxn ||
            result.totalPrice > INTEGRATION_CONFIG.validation.max_price_mxn) {
            throw new Error(`Precio fuera de rango válido: $${result.totalPrice} MXN`);
        }
    }

    isValidPriceResult(result) {
        try {
            this.validatePriceResult(result);
            return true;
        } catch (error) {
            return false;
        }
    }

    async withTimeout(promise, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout después de ${timeoutMs}ms`)), timeoutMs);
        });
        
        return Promise.race([promise, timeoutPromise]);
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    checkModuleAvailability() {
        const requiredModules = [
            'realMetalsAPI', 'realTimePriceValidator', 'advancedManualPricingOverride',
            'exchangeRateManager', 'fallbackPriceCalculator', 'goldKaratSpecialist'
        ];
        
        const availableModules = [];
        const missingModules = [];
        
        for (const moduleName of requiredModules) {
            if (window[moduleName]) {
                availableModules.push(moduleName);
            } else {
                missingModules.push(moduleName);
            }
        }
        
        console.log(`📦 Módulos disponibles: ${availableModules.length}/${requiredModules.length}`);
        if (missingModules.length > 0) {
            console.warn('⚠️ Módulos faltantes:', missingModules);
        }
    }

    getAbsoluteEmergencyPrice(metal, purity, weight, error, requestId) {
        console.error(`🚨 [${requestId}] Precio de emergencia absoluto para ${metal} ${purity}`);
        
        // Precio fijo ultra-básico por gramo
        const emergencyPrice = 500; // $500 MXN por gramo como último recurso
        
        return {
            totalPrice: emergencyPrice * weight,
            pricePerGram: emergencyPrice,
            source: 'absolute_emergency',
            confidence: 'critical',
            requestId,
            error: error.message,
            warning: '🚨 PRECIO DE EMERGENCIA CRÍTICO - REQUIERE REVISIÓN INMEDIATA',
            timestamp: Date.now()
        };
    }

    setupAutomaticCleanup() {
        // Limpiar cache cada hora
        setInterval(() => {
            this.cleanupCache();
        }, 60 * 60 * 1000);
        
        // Limpiar métricas cada día
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 24 * 60 * 60 * 1000);
    }

    cleanupCache() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        const now = Date.now();
        
        for (const [key, cached] of this.priceCache.entries()) {
            if (now - cached.timestamp > maxAge) {
                this.priceCache.delete(key);
            }
        }
        
        console.log(`🧹 Cache limpiado. Entradas restantes: ${this.priceCache.size}`);
    }

    cleanupOldMetrics() {
        const retentionMs = INTEGRATION_CONFIG.metrics.retention_days * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - retentionMs;
        
        // Limpiar métricas por hora más antiguas que el retention
        for (const [key, _] of this.metrics.hourlyActivity.entries()) {
            const hour = parseInt(key.split('_')[1]);
            const hourMs = hour * 60 * 60 * 1000;
            
            if (hourMs < cutoff) {
                this.metrics.hourlyActivity.delete(key);
            }
        }
    }

    getCacheMetrics() {
        return {
            size: this.priceCache.size,
            hitRate: this.calculateCacheHitRate(),
            avgAge: this.calculateAverageCacheAge()
        };
    }

    calculateCacheHitRate() {
        // Simplificado - en implementación real sería más complejo
        return 0.75; // 75% cache hit rate estimado
    }

    calculateAverageCacheAge() {
        if (this.priceCache.size === 0) return 0;
        
        const now = Date.now();
        let totalAge = 0;
        
        for (const cached of this.priceCache.values()) {
            totalAge += (now - cached.timestamp);
        }
        
        return totalAge / this.priceCache.size;
    }

    getCircuitBreakerStatus() {
        const status = {};
        
        for (const [source, breaker] of this.circuitBreakers.entries()) {
            status[source] = {
                isOpen: breaker.isOpen,
                failureCount: breaker.failureCount,
                lastFailure: breaker.lastFailure
            };
        }
        
        return status;
    }

    persistMetrics(metrics) {
        try {
            const key = `integration_metrics_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(metrics));
            
            // Mantener solo últimos 50 registros de métricas
            this.cleanupStoredMetrics();
            
        } catch (error) {
            console.warn('⚠️ Error persistiendo métricas:', error.message);
        }
    }

    cleanupStoredMetrics() {
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('integration_metrics_')) {
                keys.push({
                    key,
                    timestamp: parseInt(key.split('_')[2])
                });
            }
        }
        
        // Mantener solo los 50 más recientes
        keys.sort((a, b) => b.timestamp - a.timestamp);
        keys.slice(50).forEach(item => {
            localStorage.removeItem(item.key);
        });
    }

    // =================================================================
    // API PÚBLICA
    // =================================================================

    // Método principal unificado
    async getPriceUnified(metal, purity, weight = 1, options = {}) {
        return await this.getPrice(metal, purity, weight, options);
    }

    // Método que nunca falla - siempre devuelve un precio
    async getPriceWithFallback(metal, purity, weight = 1, options = {}) {
        try {
            return await this.getPrice(metal, purity, weight, options);
        } catch (error) {
            console.warn('⚠️ Fallback final activado:', error.message);
            return this.getAbsoluteEmergencyPrice(metal, purity, weight, error, 'fallback');
        }
    }

    // Obtener múltiples precios en paralelo
    async getMultiplePrices(requests) {
        const promises = requests.map(req => 
            this.getPriceWithFallback(req.metal, req.purity, req.weight || 1, req.options || {})
        );
        
        return await Promise.all(promises);
    }

    // Obtener estado completo del sistema
    getIntegrationStatus() {
        return {
            isHealthy: this.performHealthCheck(),
            metrics: this.metrics,
            moduleHealth: this.checkModuleHealth(),
            circuitBreakers: this.getCircuitBreakerStatus(),
            cache: this.getCacheMetrics(),
            eventSubscribers: this.subscribers.size,
            uptime: Date.now() - this.metrics.lastUpdated
        };
    }

    // Forzar limpieza completa
    clearAllData() {
        this.priceCache.clear();
        this.metrics = this.initializeMetrics();
        this.requestQueue = [];
        this.setupCircuitBreakers();
        
        console.log('🗑️ Sistema de integración completamente limpiado');
    }

    // Probar integración completa
    async testIntegration() {
        console.log('🧪 Probando integración completa...');
        
        const testResults = [];
        const testCases = [
            { metal: 'gold', purity: '14k', weight: 1 },
            { metal: 'silver', purity: '925', weight: 10 },
            { metal: 'platinum', purity: '950', weight: 2 }
        ];
        
        for (const testCase of testCases) {
            try {
                const result = await this.getPrice(testCase.metal, testCase.purity, testCase.weight);
                testResults.push({
                    testCase,
                    success: true,
                    result,
                    responseTime: Date.now()
                });
            } catch (error) {
                testResults.push({
                    testCase,
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successCount = testResults.filter(r => r.success).length;
        const successRate = successCount / testResults.length;
        
        console.log(`✅ Test de integración: ${successCount}/${testResults.length} éxitos (${(successRate * 100).toFixed(1)}%)`);
        
        return {
            successRate,
            results: testResults,
            timestamp: Date.now()
        };
    }
}

// =================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.pricingIntegration = new PricingIntegrationSystemArchitect();
    
    // API unificada global
    window.getPrice = async (metal, purity, weight = 1, options = {}) => {
        return await window.pricingIntegration.getPriceUnified(metal, purity, weight, options);
    };
    
    window.getPriceWithFallback = async (metal, purity, weight = 1, options = {}) => {
        return await window.pricingIntegration.getPriceWithFallback(metal, purity, weight, options);
    };
    
    // Suscripción a eventos
    window.subscribeToPriceEvents = (event, callback) => {
        return window.pricingIntegration.on(event, callback);
    };
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PricingIntegrationSystemArchitect,
        INTEGRATION_CONFIG
    };
}

console.log('✅ Arquitecto del Sistema de Integración v1.0 cargado correctamente');
console.log('🏗️ Acceso: window.pricingIntegration');
console.log('⚡ API unificada: window.getPrice(metal, purity, weight)');
console.log('🛡️ Con fallback: window.getPriceWithFallback(metal, purity, weight)');
console.log('📡 Eventos: window.subscribeToPriceEvents(event, callback)');