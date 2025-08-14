// pricing-integration-system.js - INTEGRACIÓN COMPLETA DE SISTEMAS DE PRECIOS v1.0
// Conexión de todos los módulos: APIs, manual, markup, fallback
// =================================================================

console.log('🔗 Iniciando Sistema de Integración de Precios v1.0...');

// =================================================================
// CONTROLADOR PRINCIPAL DE PRECIOS
// =================================================================

class JewelryPricingMaster {
    constructor() {
        this.kitcoPricing = null;
        this.manualPricing = null;
        this.globalMarkup = null;
        this.fallbackManager = null;
        
        this.isInitialized = false;
        this.currentExchangeRate = 19.8; // USD/MXN enero 2025
        this.lastPriceUpdate = null;
        this.observers = [];
        
        // Estado de salud del sistema
        this.systemHealth = {
            apis: 'unknown',
            manual: 'unknown',
            markup: 'unknown',
            fallback: 'unknown'
        };
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando Sistema Maestro de Precios...');
        
        try {
            // Esperar a que los módulos estén disponibles
            await this.waitForModules();
            
            // Conectar con cada subsistema
            await this.connectToSubsystems();
            
            // Configurar sincronización automática
            this.setupAutoSync();
            
            // Configurar monitores de salud
            this.setupHealthMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Sistema Maestro de Precios inicializado correctamente');
            
            // Notificar inicialización
            this.notifyObservers('system_initialized', {
                timestamp: Date.now(),
                exchangeRate: this.currentExchangeRate,
                health: this.systemHealth
            });
            
        } catch (error) {
            console.error('❌ Error inicializando Sistema Maestro:', error);
            await this.initializeFallbackMode();
        }
    }

    async waitForModules() {
        const maxWaitTime = 10000; // 10 segundos máximo
        const checkInterval = 200; // Revisar cada 200ms
        let waitTime = 0;
        
        while (waitTime < maxWaitTime) {
            if (typeof window !== 'undefined') {
                const hasKitco = window.kitcoPricing || window.EnhancedKitcoPricingManager;
                const hasManual = window.manualPricingSystem;
                const hasMarkup = window.globalMarkupSystem;
                
                if (hasKitco && hasManual && hasMarkup) {
                    console.log('✅ Todos los módulos detectados');
                    return;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
        }
        
        console.warn('⚠️ Algunos módulos no detectados, continuando con modo degradado');
    }

    async connectToSubsystems() {
        // Conectar con Kitco API System
        if (typeof window !== 'undefined' && window.kitcoPricing) {
            this.kitcoPricing = window.kitcoPricing;
            
            // Agregar listener para cambios de precios
            if (this.kitcoPricing.addListener) {
                this.kitcoPricing.addListener((event, data) => {
                    if (event === 'pricesUpdated') {
                        this.handlePriceUpdate('kitco', data);
                    }
                });
            }
            
            this.systemHealth.apis = 'connected';
            console.log('🔗 Conectado con Kitco Pricing System');
        } else {
            this.systemHealth.apis = 'offline';
        }

        // Conectar con Manual Pricing System
        if (typeof window !== 'undefined' && window.manualPricingSystem) {
            this.manualPricing = window.manualPricingSystem;
            this.systemHealth.manual = 'connected';
            console.log('🔗 Conectado con Manual Pricing System');
        } else {
            this.systemHealth.manual = 'offline';
        }

        // Conectar con Global Markup System
        if (typeof window !== 'undefined' && window.globalMarkupSystem) {
            this.globalMarkup = window.globalMarkupSystem;
            
            // Agregar observer para cambios de markup
            if (this.globalMarkup.addObserver) {
                this.globalMarkup.addObserver((event, data) => {
                    if (event === 'markup_changed') {
                        this.handleMarkupUpdate(data);
                    }
                });
            }
            
            this.systemHealth.markup = 'connected';
            console.log('🔗 Conectado con Global Markup System');
        } else {
            this.systemHealth.markup = 'offline';
        }

        // Conectar con Fallback Manager
        if (typeof window !== 'undefined' && window.apiFallbackManager) {
            this.fallbackManager = window.apiFallbackManager;
            this.systemHealth.fallback = 'connected';
            console.log('🔗 Conectado con API Fallback Manager');
        } else {
            this.systemHealth.fallback = 'offline';
        }
    }

    async initializeFallbackMode() {
        console.log('🆘 Inicializando modo de respaldo...');
        
        // Usar precios estáticos actualizados enero 2025
        this.fallbackPrices = {
            gold: {
                '24k': 1710,  // MXN por gramo
                '22k': 1567,  // 91.67% de 24k
                '18k': 1283,  // 75% de 24k
                '14k': 997,   // 58.33% de 24k
                '10k': 712    // 41.67% de 24k
            },
            silver: 24,       // MXN por gramo (925)
            platinum: 620,    // MXN por gramo
            palladium: 890,   // MXN por gramo
            lastUpdate: Date.now()
        };
        
        this.systemHealth = {
            apis: 'fallback',
            manual: 'fallback',
            markup: 'fallback',
            fallback: 'active'
        };
        
        this.isInitialized = true;
        console.log('✅ Modo de respaldo activado con precios enero 2025');
    }

    // =================================================================
    // API UNIFICADA DE PRECIOS
    // =================================================================

    async getPrice(metal, options = {}) {
        const {
            karats = null,
            weight = 1,
            complexity = 'medium',
            customerTier = 'retail',
            includeMarkup = true,
            forceSource = null
        } = options;

        try {
            let basePrice = 0;
            let source = 'unknown';

            // 1. Intentar obtener precio manual (prioridad más alta)
            if (this.manualPricing && forceSource !== 'market') {
                try {
                    const manualResult = await this.manualPricing.getPrice(metal, karats, weight);
                    if (manualResult.source === 'manual_override') {
                        console.log(`💰 Usando precio manual: ${metal} ${karats || ''}`);
                        return {
                            ...manualResult,
                            source: 'manual_override',
                            systemSource: 'integrated'
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Error obteniendo precio manual:', error.message);
                }
            }

            // 2. Intentar obtener precio de mercado (APIs)
            if (this.kitcoPricing && forceSource !== 'manual') {
                try {
                    const marketResult = await this.kitcoPricing.getMetalPrice(metal, karats, weight);
                    basePrice = marketResult.pricePerGram * weight;
                    source = 'market_api';
                    console.log(`📊 Precio de mercado obtenido: ${metal} ${karats || ''} = ${basePrice} MXN`);
                } catch (error) {
                    console.warn('⚠️ Error obteniendo precio de mercado:', error.message);
                }
            }

            // 3. Usar precio fallback si no se obtuvo de APIs
            if (basePrice === 0) {
                basePrice = this.getFallbackPrice(metal, karats) * weight;
                source = 'fallback_static';
                console.log(`🆘 Usando precio fallback: ${metal} ${karats || ''} = ${basePrice} MXN`);
            }

            // 4. Aplicar markup si se solicita
            let finalResult = {
                pricePerGram: basePrice / weight,
                totalPrice: basePrice,
                metal: metal,
                karats: karats,
                weight: weight,
                source: source,
                systemSource: 'integrated',
                timestamp: Date.now()
            };

            if (includeMarkup && this.globalMarkup) {
                try {
                    const markupResult = this.globalMarkup.calculatePrice(basePrice, {
                        complexity: complexity,
                        customerTier: customerTier
                    });
                    
                    finalResult.markup = markupResult;
                    finalResult.finalPrice = markupResult.breakdown.finalPrice;
                    finalResult.markupApplied = true;
                    
                    console.log(`📈 Markup aplicado: ${basePrice} MXN → ${finalResult.finalPrice} MXN`);
                } catch (error) {
                    console.warn('⚠️ Error aplicando markup:', error.message);
                    finalResult.markupApplied = false;
                }
            }

            return finalResult;

        } catch (error) {
            console.error('❌ Error en getPrice integrado:', error);
            throw new Error(`Error obteniendo precio para ${metal}: ${error.message}`);
        }
    }

    getFallbackPrice(metal, karats) {
        if (!this.fallbackPrices) {
            console.warn('⚠️ Precios fallback no inicializados');
            return 0;
        }

        if (metal === 'gold' && karats) {
            return this.fallbackPrices.gold[karats] || this.fallbackPrices.gold['18k'];
        }

        return this.fallbackPrices[metal] || 0;
    }

    async getAllCurrentPrices() {
        try {
            const prices = {
                timestamp: Date.now(),
                exchangeRate: this.currentExchangeRate,
                source: 'integrated_system',
                metals: {}
            };

            // Obtener precios de todos los metales principales
            const metals = ['gold', 'silver', 'platinum', 'palladium'];
            
            for (const metal of metals) {
                try {
                    if (metal === 'gold') {
                        // Para oro, obtener todos los quilates
                        prices.metals.gold = {};
                        const karats = ['10k', '14k', '18k', '22k', '24k'];
                        
                        for (const karat of karats) {
                            const priceResult = await this.getPrice('gold', { karats: karat, includeMarkup: false });
                            prices.metals.gold[karat] = {
                                pricePerGram: priceResult.pricePerGram,
                                source: priceResult.source
                            };
                        }
                    } else {
                        const priceResult = await this.getPrice(metal, { includeMarkup: false });
                        prices.metals[metal] = {
                            pricePerGram: priceResult.pricePerGram,
                            source: priceResult.source
                        };
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo precio de ${metal}:`, error.message);
                    prices.metals[metal] = {
                        pricePerGram: 0,
                        source: 'error',
                        error: error.message
                    };
                }
            }

            return prices;

        } catch (error) {
            console.error('❌ Error obteniendo todos los precios:', error);
            throw error;
        }
    }

    // =================================================================
    // GESTIÓN DE EVENTOS Y SINCRONIZACIÓN
    // =================================================================

    setupAutoSync() {
        // Sincronización automática cada 5 minutos
        setInterval(async () => {
            try {
                await this.syncAllSystems();
            } catch (error) {
                console.warn('⚠️ Error en sincronización automática:', error.message);
            }
        }, 300000); // 5 minutos
    }

    setupHealthMonitoring() {
        // Monitoreo de salud cada 2 minutos
        setInterval(() => {
            this.checkSystemHealth();
        }, 120000); // 2 minutos
    }

    async syncAllSystems() {
        console.log('🔄 Iniciando sincronización de sistemas...');
        
        try {
            // Actualizar tipo de cambio si es posible
            if (this.kitcoPricing && this.kitcoPricing.updateExchangeRate) {
                const newRate = await this.kitcoPricing.updateExchangeRate();
                if (newRate && newRate !== this.currentExchangeRate) {
                    this.currentExchangeRate = newRate;
                    this.notifyObservers('exchange_rate_updated', { 
                        oldRate: this.currentExchangeRate,
                        newRate: newRate 
                    });
                }
            }

            // Actualizar precios de mercado si es posible
            if (this.kitcoPricing && this.kitcoPricing.updateAllPrices) {
                await this.kitcoPricing.updateAllPrices();
                this.lastPriceUpdate = Date.now();
            }

            // Verificar overrides manuales expirados
            if (this.manualPricing && this.manualPricing.getAllActiveOverrides) {
                const activeOverrides = this.manualPricing.getAllActiveOverrides();
                console.log(`📋 Overrides manuales activos: ${activeOverrides.size}`);
            }

            console.log('✅ Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error durante sincronización:', error);
        }
    }

    checkSystemHealth() {
        const health = { ...this.systemHealth };
        
        // Verificar cada subsistema
        if (this.kitcoPricing) {
            const kitcoStatus = this.kitcoPricing.getSystemStatus ? 
                this.kitcoPricing.getSystemStatus() : null;
            health.apis = kitcoStatus ? 'healthy' : 'degraded';
        }

        if (this.manualPricing) {
            health.manual = 'healthy';
        }

        if (this.globalMarkup) {
            health.markup = 'healthy';
        }

        if (this.fallbackManager) {
            const fallbackStatus = this.fallbackManager.getSystemStatus ? 
                this.fallbackManager.getSystemStatus() : null;
            health.fallback = fallbackStatus ? 'healthy' : 'degraded';
        }

        // Actualizar estado si cambió
        const healthChanged = JSON.stringify(health) !== JSON.stringify(this.systemHealth);
        if (healthChanged) {
            this.systemHealth = health;
            this.notifyObservers('system_health_changed', health);
            console.log('🏥 Estado de salud del sistema actualizado:', health);
        }
    }

    handlePriceUpdate(source, data) {
        console.log(`📊 Precios actualizados desde ${source}`);
        this.lastPriceUpdate = Date.now();
        
        this.notifyObservers('prices_updated', {
            source: source,
            timestamp: this.lastPriceUpdate,
            data: data
        });
    }

    handleMarkupUpdate(data) {
        console.log('📈 Configuración de markup actualizada');
        
        this.notifyObservers('markup_updated', {
            timestamp: Date.now(),
            data: data
        });
    }

    // =================================================================
    // SISTEMA DE OBSERVADORES
    // =================================================================

    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, { ...data, masterSystem: true, timestamp: Date.now() });
            } catch (error) {
                console.error('Error en observer del sistema maestro:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // =================================================================

    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            lastPriceUpdate: this.lastPriceUpdate,
            exchangeRate: this.currentExchangeRate,
            systemHealth: this.systemHealth,
            connectedModules: {
                kitcoPricing: !!this.kitcoPricing,
                manualPricing: !!this.manualPricing,
                globalMarkup: !!this.globalMarkup,
                fallbackManager: !!this.fallbackManager
            },
            fallbackPricesAvailable: !!this.fallbackPrices,
            observerCount: this.observers.length
        };
    }

    async refreshAllPrices() {
        console.log('🔄 Forzando actualización de todos los precios...');
        
        try {
            await this.syncAllSystems();
            const allPrices = await this.getAllCurrentPrices();
            
            this.notifyObservers('all_prices_refreshed', {
                timestamp: Date.now(),
                prices: allPrices
            });
            
            return allPrices;
            
        } catch (error) {
            console.error('❌ Error refrescando precios:', error);
            throw error;
        }
    }

    // Método de utilidad para cotizaciones
    async calculateQuotationPrice(items, options = {}) {
        const {
            customerTier = 'retail',
            includeMarkup = true,
            globalDiscount = 0
        } = options;

        try {
            const results = {
                items: [],
                subtotal: 0,
                discount: globalDiscount,
                total: 0,
                timestamp: Date.now(),
                source: 'integrated_system'
            };

            for (const item of items) {
                const {
                    type,
                    material,
                    karats,
                    weight,
                    quantity = 1,
                    complexity = 'medium'
                } = item;

                const priceResult = await this.getPrice(material, {
                    karats: karats,
                    weight: weight,
                    complexity: complexity,
                    customerTier: customerTier,
                    includeMarkup: includeMarkup
                });

                const itemTotal = (priceResult.finalPrice || priceResult.totalPrice) * quantity;

                results.items.push({
                    ...item,
                    priceResult: priceResult,
                    unitPrice: priceResult.finalPrice || priceResult.totalPrice,
                    totalPrice: itemTotal
                });

                results.subtotal += itemTotal;
            }

            // Aplicar descuento global
            results.total = results.subtotal * (1 - globalDiscount / 100);

            return results;

        } catch (error) {
            console.error('❌ Error calculando precio de cotización:', error);
            throw error;
        }
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global con inicialización diferida
if (typeof window !== 'undefined') {
    // Esperar a que otros sistemas estén cargados
    setTimeout(() => {
        window.jewelryPricingMaster = new JewelryPricingMaster();
    }, 2000); // 2 segundos para permitir carga de otros módulos
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JewelryPricingMaster };
}

console.log('✅ Sistema de Integración de Precios v1.0 cargado correctamente');
console.log('⏱️ Inicialización automática en 2 segundos...');