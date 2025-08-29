// pricing-system-integration.js - INTEGRACIÓN COMPLETA DEL SISTEMA DE OVERRIDES v1.0
// Integración con todos los sistemas existentes y funcionalidad completa
// =================================================================

console.log('🔗 Iniciando Integración Completa del Sistema de Overrides v1.0...');

// =================================================================
// CONFIGURACIÓN DE INTEGRACIÓN
// =================================================================

const INTEGRATION_CONFIG = {
    // Sistemas a integrar
    targetSystems: [
        'kitcoPricing',
        'calculatorSystem', 
        'quotationSystem',
        'receiptSystem',
        'globalMarkupSystem',
        'complexityPricingEngine'
    ],

    // Eventos de integración
    integrationEvents: {
        PRICE_REQUEST: 'price_request',
        PRICE_OVERRIDE_APPLIED: 'price_override_applied',
        SYSTEM_SYNC: 'system_sync',
        FALLBACK_TRIGGERED: 'fallback_triggered',
        INTEGRATION_ERROR: 'integration_error'
    },

    // Configuración de fallback
    fallback: {
        enableAutoFallback: true,
        maxRetries: 3,
        retryDelay: 1000,
        fallbackPriority: ['market', 'cached', 'default']
    },

    // Configuración de caché
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutos
        maxEntries: 1000
    }
};

// =================================================================
// CLASE PRINCIPAL DE INTEGRACIÓN
// =================================================================

class PricingSystemIntegration {
    constructor() {
        this.isInitialized = false;
        this.integratedSystems = new Map();
        this.priceCache = new Map();
        this.fallbackChain = [];
        this.observers = [];
        this.performance = this.initializePerformanceTracking();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando integración del sistema de precios...');
        
        try {
            await this.detectAndIntegrateSystems();
            this.setupPriceInterception();
            this.setupEventBridge();
            this.setupFallbackChain();
            this.setupCache();
            this.registerGlobalMethods();
            
            this.isInitialized = true;
            console.log('✅ Integración completa inicializada');
            
            // Notificar a otros sistemas
            this.notifySystemReady();
            
        } catch (error) {
            console.error('❌ Error inicializando integración:', error);
            throw error;
        }
    }

    // =================================================================
    // DETECCIÓN E INTEGRACIÓN DE SISTEMAS
    // =================================================================

    async detectAndIntegrateSystems() {
        const detectedSystems = [];
        
        for (const systemName of INTEGRATION_CONFIG.targetSystems) {
            try {
                const system = await this.detectSystem(systemName);
                if (system) {
                    await this.integrateSystem(systemName, system);
                    detectedSystems.push(systemName);
                }
            } catch (error) {
                console.warn(`⚠️ Error integrando ${systemName}:`, error);
            }
        }
        
        console.log(`🔗 Sistemas integrados: ${detectedSystems.join(', ')}`);
        return detectedSystems;
    }

    async detectSystem(systemName) {
        // Esperar hasta 5 segundos para que el sistema esté disponible
        const maxWait = 5000;
        const checkInterval = 100;
        let elapsed = 0;
        
        while (elapsed < maxWait) {
            const system = this.getSystemReference(systemName);
            if (system) {
                return system;
            }
            
            await this.delay(checkInterval);
            elapsed += checkInterval;
        }
        
        return null;
    }

    getSystemReference(systemName) {
        if (typeof window === 'undefined') return null;
        
        const systemMap = {
            'kitcoPricing': window.kitcoPricing,
            'calculatorSystem': window.calculatorSystem,
            'quotationSystem': window.quotationSystem, 
            'receiptSystem': window.receiptSystem,
            'globalMarkupSystem': window.globalMarkupSystem,
            'complexityPricingEngine': window.complexityPricingEngine
        };
        
        return systemMap[systemName] || null;
    }

    async integrateSystem(systemName, system) {
        const integration = {
            name: systemName,
            system,
            originalMethods: new Map(),
            isIntegrated: false,
            lastSync: null,
            errorCount: 0
        };
        
        try {
            // Backup métodos originales
            await this.backupOriginalMethods(integration);
            
            // Aplicar interceptores específicos del sistema
            await this.applySystemInterceptors(integration);
            
            // Configurar sincronización
            await this.setupSystemSync(integration);
            
            integration.isIntegrated = true;
            integration.lastSync = Date.now();
            
            this.integratedSystems.set(systemName, integration);
            
            console.log(`✅ ${systemName} integrado correctamente`);
            
        } catch (error) {
            console.error(`❌ Error integrando ${systemName}:`, error);
            throw error;
        }
    }

    async backupOriginalMethods(integration) {
        const { name, system } = integration;
        
        const methodsToBackup = {
            'kitcoPricing': ['getMetalPrice', 'getAllCurrentPrices', 'fetchLatestPrices'],
            'calculatorSystem': ['calculateMetalCost', 'updatePrices'],
            'quotationSystem': ['calculateItemPrice', 'updateQuotationPrices'],
            'receiptSystem': ['calculateReceiptTotal'],
            'globalMarkupSystem': ['applyMarkup'],
            'complexityPricingEngine': ['calculateComplexityPrice']
        };
        
        const methods = methodsToBackup[name] || [];
        
        for (const methodName of methods) {
            if (system[methodName] && typeof system[methodName] === 'function') {
                integration.originalMethods.set(methodName, system[methodName].bind(system));
            }
        }
    }

    async applySystemInterceptors(integration) {
        const { name, system } = integration;
        
        switch (name) {
            case 'kitcoPricing':
                this.integrateKitcoPricing(system, integration);
                break;
            case 'calculatorSystem':
                this.integrateCalculatorSystem(system, integration);
                break;
            case 'quotationSystem':
                this.integrateQuotationSystem(system, integration);
                break;
            case 'receiptSystem':
                this.integrateReceiptSystem(system, integration);
                break;
            default:
                this.integrateGenericSystem(system, integration);
        }
    }

    // =================================================================
    // INTERCEPTORES ESPECÍFICOS POR SISTEMA
    // =================================================================

    integrateKitcoPricing(system, integration) {
        const originalGetPrice = integration.originalMethods.get('getMetalPrice');
        const originalGetAllPrices = integration.originalMethods.get('getAllCurrentPrices');
        
        // Interceptar getMetalPrice
        system.getMetalPrice = async (metal, weight = 1, karats = '14k') => {
            const startTime = performance.now();
            
            try {
                // Intentar obtener precio con override
                const overrideResult = await this.getPriceWithOverride(metal, karats, weight);
                
                if (overrideResult.hasOverride) {
                    this.trackPerformance('override_price', startTime);
                    this.trackEvent(INTEGRATION_CONFIG.integrationEvents.PRICE_OVERRIDE_APPLIED, {
                        metal, karats, weight,
                        originalPrice: overrideResult.marketPrice,
                        overridePrice: overrideResult.finalPrice,
                        source: 'kitcoPricing.getMetalPrice'
                    });
                    
                    return {
                        ...overrideResult,
                        source: 'manual_override_integrated'
                    };
                }
                
                // Fallback al método original
                const result = originalGetPrice ? 
                    await originalGetPrice(metal, weight, karats) :
                    await this.getFallbackPrice(metal, karats, weight);
                
                this.trackPerformance('market_price', startTime);
                return result;
                
            } catch (error) {
                console.error('Error en integración getMetalPrice:', error);
                this.trackEvent(INTEGRATION_CONFIG.integrationEvents.INTEGRATION_ERROR, {
                    system: 'kitcoPricing',
                    method: 'getMetalPrice',
                    error: error.message,
                    params: { metal, weight, karats }
                });
                
                return this.handlePricingError(error, metal, karats, weight, originalGetPrice);
            }
        };

        // Interceptar getAllCurrentPrices
        system.getAllCurrentPrices = async () => {
            const startTime = performance.now();
            
            try {
                const originalPrices = originalGetAllPrices ? 
                    await originalGetAllPrices() : 
                    await this.getFallbackAllPrices();
                
                const enhancedPrices = await this.enhancePricesWithOverrides(originalPrices);
                
                this.trackPerformance('all_prices', startTime);
                return enhancedPrices;
                
            } catch (error) {
                console.error('Error en integración getAllCurrentPrices:', error);
                this.trackEvent(INTEGRATION_CONFIG.integrationEvents.INTEGRATION_ERROR, {
                    system: 'kitcoPricing',
                    method: 'getAllCurrentPrices',
                    error: error.message
                });
                
                return this.handleAllPricesError(error, originalGetAllPrices);
            }
        };
    }

    integrateCalculatorSystem(system, integration) {
        const originalCalculate = integration.originalMethods.get('calculateMetalCost');
        
        if (originalCalculate) {
            system.calculateMetalCost = async (metal, weight, purity) => {
                try {
                    const overrideResult = await this.getPriceWithOverride(metal, purity, weight);
                    
                    if (overrideResult.hasOverride) {
                        return {
                            metalCost: overrideResult.totalPrice,
                            pricePerGram: overrideResult.pricePerGram,
                            weight,
                            metal,
                            purity,
                            source: 'manual_override',
                            override: overrideResult.override
                        };
                    }
                    
                    return await originalCalculate(metal, weight, purity);
                    
                } catch (error) {
                    console.error('Error en integración calculateMetalCost:', error);
                    return await originalCalculate(metal, weight, purity);
                }
            };
        }
    }

    integrateQuotationSystem(system, integration) {
        // Similar a calculatorSystem pero para cotizaciones
        const originalCalculateItem = integration.originalMethods.get('calculateItemPrice');
        
        if (originalCalculateItem) {
            system.calculateItemPrice = async (item) => {
                try {
                    if (item.metal && item.weight && item.purity) {
                        const overrideResult = await this.getPriceWithOverride(
                            item.metal, 
                            item.purity, 
                            item.weight
                        );
                        
                        if (overrideResult.hasOverride) {
                            return {
                                ...await originalCalculateItem(item),
                                metalCost: overrideResult.totalPrice,
                                overrideApplied: true,
                                overrideDetails: overrideResult.override
                            };
                        }
                    }
                    
                    return await originalCalculateItem(item);
                    
                } catch (error) {
                    console.error('Error en integración calculateItemPrice:', error);
                    return await originalCalculateItem(item);
                }
            };
        }
    }

    integrateReceiptSystem(system, integration) {
        // Integración para sistema de recibos
        const originalCalculateTotal = integration.originalMethods.get('calculateReceiptTotal');
        
        if (originalCalculateTotal) {
            system.calculateReceiptTotal = async (items) => {
                try {
                    const enhancedItems = await Promise.all(
                        items.map(async (item) => {
                            if (item.metal && item.weight && item.purity) {
                                const overrideResult = await this.getPriceWithOverride(
                                    item.metal,
                                    item.purity,
                                    item.weight
                                );
                                
                                if (overrideResult.hasOverride) {
                                    return {
                                        ...item,
                                        metalCost: overrideResult.totalPrice,
                                        pricePerGram: overrideResult.pricePerGram,
                                        overrideApplied: true
                                    };
                                }
                            }
                            return item;
                        })
                    );
                    
                    return await originalCalculateTotal(enhancedItems);
                    
                } catch (error) {
                    console.error('Error en integración calculateReceiptTotal:', error);
                    return await originalCalculateTotal(items);
                }
            };
        }
    }

    integrateGenericSystem(system, integration) {
        // Integración genérica para sistemas no específicos
        console.log(`🔗 Aplicando integración genérica a ${integration.name}`);
        
        // Buscar métodos que puedan beneficiarse de overrides
        const methodNames = Object.getOwnPropertyNames(system);
        
        methodNames.forEach(methodName => {
            if (typeof system[methodName] === 'function' && 
                (methodName.includes('price') || methodName.includes('cost'))) {
                
                const originalMethod = system[methodName];
                integration.originalMethods.set(methodName, originalMethod.bind(system));
                
                system[methodName] = async (...args) => {
                    try {
                        // Intentar detectar parámetros de metal/purity en argumentos
                        const metalParams = this.extractMetalParams(args);
                        
                        if (metalParams) {
                            const overrideResult = await this.getPriceWithOverride(
                                metalParams.metal,
                                metalParams.purity,
                                metalParams.weight
                            );
                            
                            if (overrideResult.hasOverride) {
                                // Modificar args para usar precio override
                                args = this.modifyArgsWithOverride(args, overrideResult);
                            }
                        }
                        
                        return await originalMethod(...args);
                        
                    } catch (error) {
                        console.error(`Error en integración genérica ${methodName}:`, error);
                        return await originalMethod(...args);
                    }
                };
            }
        });
    }

    // =================================================================
    // LÓGICA PRINCIPAL DE PRECIOS
    // =================================================================

    async getPriceWithOverride(metal, purity, weight = 1) {
        const startTime = performance.now();
        
        try {
            // Verificar caché primero
            const cacheKey = `${metal}_${purity}_${weight}`;
            const cached = this.getCachedPrice(cacheKey);
            
            if (cached) {
                this.trackPerformance('cache_hit', startTime);
                return cached;
            }
            
            // Obtener precio del sistema de overrides
            let overridePrice = null;
            let hasOverride = false;
            
            if (window.advancedManualPricingOverride) {
                const priceResult = window.advancedManualPricingOverride.getPrice(metal, purity, weight);
                
                if (priceResult.source === 'manual_override') {
                    overridePrice = priceResult;
                    hasOverride = true;
                }
            }
            
            // Obtener precio de mercado para comparación
            const marketPrice = await this.getMarketPrice(metal, purity, weight);
            
            const result = {
                pricePerGram: hasOverride ? overridePrice.pricePerGram : marketPrice.pricePerGram,
                totalPrice: hasOverride ? overridePrice.totalPrice : marketPrice.totalPrice,
                hasOverride,
                source: hasOverride ? 'manual_override' : 'market',
                marketPrice: marketPrice.pricePerGram,
                finalPrice: hasOverride ? overridePrice.pricePerGram : marketPrice.pricePerGram,
                override: hasOverride ? overridePrice.override : null,
                metal,
                purity,
                weight,
                timestamp: Date.now()
            };
            
            // Cachear resultado
            this.setCachedPrice(cacheKey, result);
            
            this.trackPerformance('price_calculation', startTime);
            
            // Trackear evento
            this.trackEvent(INTEGRATION_CONFIG.integrationEvents.PRICE_REQUEST, {
                metal, purity, weight, hasOverride,
                source: result.source,
                responseTime: performance.now() - startTime
            });
            
            return result;
            
        } catch (error) {
            console.error('Error obteniendo precio con override:', error);
            this.trackEvent(INTEGRATION_CONFIG.integrationEvents.INTEGRATION_ERROR, {
                error: error.message,
                metal, purity, weight
            });
            
            throw error;
        }
    }

    async getMarketPrice(metal, purity, weight = 1) {
        // Usar precios verificados como fallback
        const verifiedPrices = window.ADVANCED_OVERRIDE_CONFIG?.verifiedPrices;
        
        if (verifiedPrices && verifiedPrices[metal]) {
            const metalConfig = verifiedPrices[metal];
            const purityConfig = metalConfig.purities[purity];
            
            if (purityConfig) {
                const pricePerGram = metalConfig.basePrice * purityConfig.multiplier;
                return {
                    pricePerGram,
                    totalPrice: pricePerGram * weight,
                    source: 'verified_market',
                    metal,
                    purity,
                    weight
                };
            }
        }
        
        // Fallback a sistema original si existe
        const kitco = this.integratedSystems.get('kitcoPricing');
        if (kitco && kitco.originalMethods.has('getMetalPrice')) {
            const originalMethod = kitco.originalMethods.get('getMetalPrice');
            return await originalMethod(metal, weight, purity);
        }
        
        throw new Error(`No se pudo obtener precio de mercado para ${metal} ${purity}`);
    }

    async enhancePricesWithOverrides(originalPrices) {
        if (!originalPrices) return originalPrices;
        
        try {
            const enhanced = { ...originalPrices };
            
            // Si el objeto tiene estructura de precios por metal
            if (enhanced.mxnPrices) {
                for (const [metal, price] of Object.entries(enhanced.mxnPrices)) {
                    // Verificar override para cada metal (usar purity por defecto)
                    const defaultPurity = this.getDefaultPurity(metal);
                    const overrideResult = await this.getPriceWithOverride(metal, defaultPurity, 1);
                    
                    if (overrideResult.hasOverride) {
                        enhanced.mxnPrices[metal] = overrideResult.pricePerGram;
                        
                        // Marcar que hay override aplicado
                        if (!enhanced.overrides) enhanced.overrides = {};
                        enhanced.overrides[metal] = {
                            originalPrice: price,
                            overridePrice: overrideResult.pricePerGram,
                            reason: overrideResult.override?.reason
                        };
                    }
                }
            }
            
            return enhanced;
            
        } catch (error) {
            console.error('Error enhancing prices with overrides:', error);
            return originalPrices;
        }
    }

    getDefaultPurity(metal) {
        const defaults = {
            'gold': '14k',
            'silver': '925',
            'platinum': '950',
            'palladium': '950'
        };
        return defaults[metal] || '14k';
    }

    // =================================================================
    // SISTEMA DE CACHÉ
    // =================================================================

    getCachedPrice(key) {
        if (!INTEGRATION_CONFIG.cache.enabled) return null;
        
        const cached = this.priceCache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > INTEGRATION_CONFIG.cache.ttl) {
            this.priceCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCachedPrice(key, data) {
        if (!INTEGRATION_CONFIG.cache.enabled) return;
        
        this.priceCache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Limpiar caché si excede el límite
        if (this.priceCache.size > INTEGRATION_CONFIG.cache.maxEntries) {
            this.cleanCache();
        }
    }

    cleanCache() {
        const entries = Array.from(this.priceCache.entries());
        const now = Date.now();
        
        // Remover entradas expiradas
        entries.forEach(([key, value]) => {
            if (now - value.timestamp > INTEGRATION_CONFIG.cache.ttl) {
                this.priceCache.delete(key);
            }
        });
        
        // Si aún excede el límite, remover las más antiguas
        if (this.priceCache.size > INTEGRATION_CONFIG.cache.maxEntries) {
            const sortedEntries = entries
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(0, this.priceCache.size - INTEGRATION_CONFIG.cache.maxEntries);
            
            sortedEntries.forEach(([key]) => {
                this.priceCache.delete(key);
            });
        }
    }

    // =================================================================
    // MANEJO DE ERRORES Y FALLBACKS
    // =================================================================

    async handlePricingError(error, metal, purity, weight, originalMethod) {
        console.error('Error en pricing, aplicando fallback:', error);
        
        this.trackEvent(INTEGRATION_CONFIG.integrationEvents.FALLBACK_TRIGGERED, {
            error: error.message,
            metal, purity, weight,
            fallbackMethod: 'original_method'
        });
        
        if (originalMethod) {
            try {
                return await originalMethod(metal, weight, purity);
            } catch (fallbackError) {
                console.error('Error en método original, usando fallback final:', fallbackError);
                return this.getFallbackPrice(metal, purity, weight);
            }
        }
        
        return this.getFallbackPrice(metal, purity, weight);
    }

    async handleAllPricesError(error, originalMethod) {
        console.error('Error obteniendo todos los precios:', error);
        
        if (originalMethod) {
            try {
                return await originalMethod();
            } catch (fallbackError) {
                console.error('Error en método original de todos los precios:', fallbackError);
                return this.getFallbackAllPrices();
            }
        }
        
        return this.getFallbackAllPrices();
    }

    async getFallbackPrice(metal, purity, weight) {
        // Usar precios verificados como último recurso
        const verifiedPrices = window.ADVANCED_OVERRIDE_CONFIG?.verifiedPrices;
        
        if (verifiedPrices && verifiedPrices[metal]) {
            const metalConfig = verifiedPrices[metal];
            const purityConfig = metalConfig.purities[purity];
            
            if (purityConfig) {
                const pricePerGram = metalConfig.basePrice * purityConfig.multiplier;
                return {
                    pricePerGram,
                    totalPrice: pricePerGram * weight,
                    source: 'fallback_verified',
                    metal,
                    purity,
                    weight
                };
            }
        }
        
        throw new Error(`No hay precio fallback disponible para ${metal} ${purity}`);
    }

    async getFallbackAllPrices() {
        const verifiedPrices = window.ADVANCED_OVERRIDE_CONFIG?.verifiedPrices;
        
        if (verifiedPrices) {
            const mxnPrices = {};
            
            Object.keys(verifiedPrices).forEach(metal => {
                const metalConfig = verifiedPrices[metal];
                mxnPrices[metal] = metalConfig.basePrice;
            });
            
            return {
                mxnPrices,
                source: 'fallback_verified',
                timestamp: Date.now()
            };
        }
        
        throw new Error('No hay precios fallback disponibles');
    }

    // =================================================================
    // UTILIDADES Y HELPERS
    // =================================================================

    extractMetalParams(args) {
        // Intentar detectar parámetros de metal en argumentos
        const params = {};
        
        args.forEach((arg, index) => {
            if (typeof arg === 'string') {
                if (['gold', 'silver', 'platinum', 'palladium'].includes(arg.toLowerCase())) {
                    params.metal = arg.toLowerCase();
                } else if (['10k', '14k', '18k', '22k', '24k', '925', '950'].includes(arg)) {
                    params.purity = arg;
                }
            } else if (typeof arg === 'number' && !params.weight) {
                params.weight = arg;
            }
        });
        
        return params.metal ? params : null;
    }

    modifyArgsWithOverride(args, overrideResult) {
        // Modificar argumentos para usar precio override
        // Esta es una implementación genérica que puede necesitar ajustes
        return args.map(arg => {
            if (typeof arg === 'number' && arg > 0 && arg < 10000) {
                // Probablemente un precio, reemplazar con override
                return overrideResult.pricePerGram;
            }
            return arg;
        });
    }

    setupEventBridge() {
        // Configurar puente de eventos entre sistemas
        if (window.advancedManualPricingOverride) {
            window.advancedManualPricingOverride.addObserver((event, data) => {
                this.onOverrideSystemEvent(event, data);
            });
        }
        
        if (window.pricingValidator) {
            window.pricingValidator.addObserver((event, data) => {
                this.onValidationEvent(event, data);
            });
        }
        
        if (window.pricingTracker) {
            // El tracker ya está integrado automáticamente
        }
    }

    onOverrideSystemEvent(event, data) {
        // Invalidar caché cuando hay cambios en overrides
        if (['override_created', 'override_updated', 'override_deactivated'].includes(event)) {
            this.invalidateCache(data.metal, data.purity);
            
            // Notificar a sistemas integrados
            this.notifyIntegratedSystems('price_changed', {
                metal: data.metal,
                purity: data.purity,
                event,
                data
            });
        }
    }

    onValidationEvent(event, data) {
        // Manejar eventos de validación
        this.trackEvent(INTEGRATION_CONFIG.integrationEvents.SYSTEM_SYNC, {
            source: 'validation',
            event,
            data
        });
    }

    invalidateCache(metal = null, purity = null) {
        if (metal && purity) {
            // Invalidar caché específico
            const keys = Array.from(this.priceCache.keys());
            keys.forEach(key => {
                if (key.startsWith(`${metal}_${purity}_`)) {
                    this.priceCache.delete(key);
                }
            });
        } else {
            // Invalidar todo el caché
            this.priceCache.clear();
        }
    }

    notifyIntegratedSystems(event, data) {
        this.integratedSystems.forEach((integration, systemName) => {
            try {
                if (integration.system && integration.system.onPriceSystemEvent) {
                    integration.system.onPriceSystemEvent(event, data);
                }
            } catch (error) {
                console.warn(`Error notificando a ${systemName}:`, error);
            }
        });
    }

    registerGlobalMethods() {
        // Registrar métodos globales para fácil acceso
        if (typeof window !== 'undefined') {
            window.getPriceWithOverride = this.getPriceWithOverride.bind(this);
            window.refreshPriceCache = this.invalidateCache.bind(this);
            window.getIntegrationStatus = this.getIntegrationStatus.bind(this);
        }
    }

    // =================================================================
    // TRACKING Y MÉTRICAS
    // =================================================================

    initializePerformanceTracking() {
        return {
            requests: {
                total: 0,
                cache_hits: 0,
                cache_misses: 0,
                override_hits: 0,
                market_hits: 0,
                errors: 0
            },
            timing: {
                average_response: 0,
                fastest_response: Infinity,
                slowest_response: 0
            },
            lastReset: Date.now()
        };
    }

    trackPerformance(type, startTime) {
        const duration = performance.now() - startTime;
        
        this.performance.requests.total++;
        
        switch (type) {
            case 'cache_hit':
                this.performance.requests.cache_hits++;
                break;
            case 'override_price':
                this.performance.requests.override_hits++;
                break;
            case 'market_price':
                this.performance.requests.market_hits++;
                break;
        }
        
        // Actualizar timing
        this.performance.timing.fastest_response = Math.min(
            this.performance.timing.fastest_response, 
            duration
        );
        this.performance.timing.slowest_response = Math.max(
            this.performance.timing.slowest_response, 
            duration
        );
        
        // Calcular promedio móvil
        const currentAvg = this.performance.timing.average_response;
        this.performance.timing.average_response = 
            (currentAvg * (this.performance.requests.total - 1) + duration) / 
            this.performance.requests.total;
    }

    trackEvent(eventType, data) {
        if (window.pricingTracker) {
            window.pricingTracker.trackEvent(eventType, data, {
                source: 'pricing_integration'
            });
        }
    }

    // =================================================================
    // CONFIGURACIÓN Y UTILIDADES
    // =================================================================

    setupFallbackChain() {
        // Configurar cadena de fallback
        this.fallbackChain = INTEGRATION_CONFIG.fallback.fallbackPriority.map(type => {
            switch (type) {
                case 'market':
                    return this.getMarketPrice.bind(this);
                case 'cached':
                    return this.getCachedFallbackPrice.bind(this);
                case 'default':
                    return this.getDefaultPrice.bind(this);
                default:
                    return null;
            }
        }).filter(Boolean);
    }

    async getCachedFallbackPrice(metal, purity, weight) {
        // Buscar en caché cualquier precio reciente
        const keys = Array.from(this.priceCache.keys());
        const matchingKey = keys.find(key => key.startsWith(`${metal}_${purity}_`));
        
        if (matchingKey) {
            const cached = this.priceCache.get(matchingKey);
            if (cached) {
                return {
                    ...cached.data,
                    weight: weight,
                    totalPrice: cached.data.pricePerGram * weight,
                    source: 'cached_fallback'
                };
            }
        }
        
        throw new Error('No cached fallback available');
    }

    async getDefaultPrice(metal, purity, weight) {
        // Precios por defecto muy básicos
        const defaultPrices = {
            'gold': { '14k': 1000 },
            'silver': { '925': 20 },
            'platinum': { '950': 600 },
            'palladium': { '950': 650 }
        };
        
        const price = defaultPrices[metal]?.[purity];
        if (price) {
            return {
                pricePerGram: price,
                totalPrice: price * weight,
                source: 'default_fallback',
                metal,
                purity,
                weight
            };
        }
        
        throw new Error('No default price available');
    }

    setupCache() {
        // Configurar limpieza automática de caché
        setInterval(() => {
            this.cleanCache();
        }, INTEGRATION_CONFIG.cache.ttl);
    }

    setupSystemSync() {
        // Configurar sincronización automática con sistemas
        setInterval(() => {
            this.syncWithIntegratedSystems();
        }, 30000); // Cada 30 segundos
    }

    async syncWithIntegratedSystems() {
        for (const [systemName, integration] of this.integratedSystems.entries()) {
            try {
                if (integration.system && integration.system.sync) {
                    await integration.system.sync();
                    integration.lastSync = Date.now();
                }
            } catch (error) {
                integration.errorCount++;
                console.warn(`Error sincronizando ${systemName}:`, error);
            }
        }
    }

    notifySystemReady() {
        this.trackEvent(INTEGRATION_CONFIG.integrationEvents.SYSTEM_SYNC, {
            type: 'system_ready',
            integratedSystems: Array.from(this.integratedSystems.keys()),
            timestamp: Date.now()
        });
        
        // Disparar evento personalizado
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pricingSystemReady', {
                detail: {
                    integratedSystems: Array.from(this.integratedSystems.keys()),
                    isInitialized: this.isInitialized
                }
            }));
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =================================================================
    // API PÚBLICA
    // =================================================================

    getIntegrationStatus() {
        return {
            isInitialized: this.isInitialized,
            integratedSystems: Array.from(this.integratedSystems.keys()),
            systemDetails: Object.fromEntries(
                Array.from(this.integratedSystems.entries()).map(([name, integration]) => [
                    name,
                    {
                        isIntegrated: integration.isIntegrated,
                        lastSync: integration.lastSync,
                        errorCount: integration.errorCount,
                        methodsIntegrated: Array.from(integration.originalMethods.keys())
                    }
                ])
            ),
            performance: this.performance,
            cacheStats: {
                size: this.priceCache.size,
                maxSize: INTEGRATION_CONFIG.cache.maxEntries,
                enabled: INTEGRATION_CONFIG.cache.enabled
            }
        };
    }

    getPerformanceMetrics() {
        return {
            ...this.performance,
            cacheHitRate: this.performance.requests.cache_hits / Math.max(this.performance.requests.total, 1),
            overrideRate: this.performance.requests.override_hits / Math.max(this.performance.requests.total, 1),
            errorRate: this.performance.requests.errors / Math.max(this.performance.requests.total, 1)
        };
    }

    resetPerformanceMetrics() {
        this.performance = this.initializePerformanceTracking();
    }

    async testIntegration() {
        console.log('🧪 Ejecutando test de integración...');
        
        const testResults = {
            systems: {},
            pricing: {},
            performance: {},
            errors: []
        };
        
        try {
            // Test de sistemas integrados
            for (const [systemName, integration] of this.integratedSystems.entries()) {
                testResults.systems[systemName] = {
                    isIntegrated: integration.isIntegrated,
                    hasOriginalMethods: integration.originalMethods.size > 0,
                    lastSync: integration.lastSync,
                    errorCount: integration.errorCount
                };
            }
            
            // Test de precios
            const testMetals = ['gold', 'silver'];
            const testPurities = { gold: '14k', silver: '925' };
            
            for (const metal of testMetals) {
                const purity = testPurities[metal];
                const startTime = performance.now();
                
                try {
                    const result = await this.getPriceWithOverride(metal, purity, 1);
                    testResults.pricing[`${metal}_${purity}`] = {
                        success: true,
                        hasOverride: result.hasOverride,
                        source: result.source,
                        responseTime: performance.now() - startTime
                    };
                } catch (error) {
                    testResults.pricing[`${metal}_${purity}`] = {
                        success: false,
                        error: error.message,
                        responseTime: performance.now() - startTime
                    };
                    testResults.errors.push(`Pricing test failed for ${metal} ${purity}: ${error.message}`);
                }
            }
            
            // Test de performance
            testResults.performance = this.getPerformanceMetrics();
            
            console.log('✅ Test de integración completado:', testResults);
            return testResults;
            
        } catch (error) {
            console.error('❌ Error en test de integración:', error);
            testResults.errors.push(`General test error: ${error.message}`);
            return testResults;
        }
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    // Esperar a que otros sistemas estén disponibles
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.pricingIntegration = new PricingSystemIntegration();
        }, 1000); // Esperar 1 segundo para que otros sistemas se carguen
    });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PricingSystemIntegration,
        INTEGRATION_CONFIG
    };
}

console.log('✅ Sistema de Integración de Precios v1.0 cargado correctamente');
console.log('🔗 Acceso: window.pricingIntegration (disponible después de DOMContentLoaded)');
console.log('🧪 Test: window.pricingIntegration.testIntegration()');