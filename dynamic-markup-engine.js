// dynamic-markup-engine.js - MOTOR DE MARKUP DINÁMICO v1.0
// Sistema inteligente de precios con multiplicadores por material y condiciones de mercado
// ========================================================================================

console.log('💰 Iniciando Motor de Markup Dinámico v1.0...');

// ========================================================================================
// CONFIGURACIÓN DEL MOTOR DE MARKUP DINÁMICO
// ========================================================================================

const DYNAMIC_MARKUP_CONFIG = {
    // Multiplicadores base por tipo de material
    materialMultipliers: {
        gold: {
            name: 'Oro',
            baseMultiplier: 1.0,         // Base de referencia
            volatilityFactor: 0.15,      // ±15% por volatilidad de mercado
            priceRange: {
                low: 1800,               // USD/oz precio bajo
                medium: 2200,            // USD/oz precio medio
                high: 2800               // USD/oz precio alto
            },
            marketAdjustments: {
                bearish: 0.95,           // Mercado a la baja -5%
                stable: 1.0,             // Mercado estable
                bullish: 1.08            // Mercado alcista +8%
            },
            purityMultipliers: {
                '24k': 1.0,              // Oro puro base
                '22k': 0.92,             // 22/24 = 0.917
                '18k': 0.75,             // 18/24 = 0.75
                '14k': 0.58,             // 14/24 = 0.583
                '10k': 0.42              // 10/24 = 0.417
            },
            color: '#FFD700'
        },
        silver: {
            name: 'Plata',
            baseMultiplier: 1.10,        // +10% vs oro como especificado
            volatilityFactor: 0.25,      // ±25% más volátil que oro
            priceRange: {
                low: 18,                 // USD/oz precio bajo
                medium: 25,              // USD/oz precio medio
                high: 35                 // USD/oz precio alto
            },
            marketAdjustments: {
                bearish: 0.92,           // Mercado a la baja -8%
                stable: 1.0,             // Mercado estable
                bullish: 1.12            // Mercado alcista +12%
            },
            purityMultipliers: {
                '999': 1.0,              // Plata pura
                '925': 0.925,            // Sterling silver
                '900': 0.90,             // Plata 900
                '800': 0.80              // Plata 800
            },
            color: '#C0C0C0'
        },
        platinum: {
            name: 'Platino',
            baseMultiplier: 1.15,        // +15% vs oro como especificado
            volatilityFactor: 0.12,      // Menos volátil que oro
            priceRange: {
                low: 900,                // USD/oz precio bajo
                medium: 1200,            // USD/oz precio medio
                high: 1600               // USD/oz precio alto
            },
            marketAdjustments: {
                bearish: 0.96,           // Mercado a la baja -4%
                stable: 1.0,             // Mercado estable
                bullish: 1.06            // Mercado alcista +6%
            },
            purityMultipliers: {
                '950': 1.0,              // Platino 950 (estándar joyería)
                '900': 0.95,             // Platino 900
                '850': 0.89              // Platino 850
            },
            color: '#E5E4E2'
        },
        palladium: {
            name: 'Paladio',
            baseMultiplier: 1.08,        // +8% vs oro
            volatilityFactor: 0.30,      // Muy volátil
            priceRange: {
                low: 1500,               // USD/oz precio bajo
                medium: 2000,            // USD/oz precio medio
                high: 3000               // USD/oz precio alto
            },
            marketAdjustments: {
                bearish: 0.88,           // Mercado a la baja -12%
                stable: 1.0,             // Mercado estable
                bullish: 1.18            // Mercado alcista +18%
            },
            purityMultipliers: {
                '950': 1.0,              // Paladio 950
                '500': 0.53              // Paladio 500 (aleación)
            },
            color: '#CED0DD'
        }
    },

    // Condiciones de mercado y factores externos
    marketConditions: {
        economic: {
            recession: 0.92,             // Recesión -8%
            stable: 1.0,                 // Economía estable
            growth: 1.05,                // Crecimiento +5%
            boom: 1.12                   // Boom económico +12%
        },
        inflation: {
            deflation: 0.95,             // Deflación -5%
            low: 1.0,                    // Inflación baja <3%
            moderate: 1.03,              // Inflación moderada 3-6%
            high: 1.08                   // Inflación alta >6%
        },
        supply_chain: {
            shortage: 1.15,              // Escasez de materiales +15%
            normal: 1.0,                 // Cadena de suministro normal
            surplus: 0.95                // Surplus de materiales -5%
        },
        geopolitical: {
            stable: 1.0,                 // Estabilidad geopolítica
            tension: 1.06,               // Tensiones +6%
            crisis: 1.15                 // Crisis +15%
        }
    },

    // Multiplicadores por demanda estacional
    seasonalMultipliers: {
        // Basado en el mercado mexicano de joyería
        january: 0.95,                   // Enero post-navidad
        february: 1.08,                  // San Valentín +8%
        march: 0.98,                     // Marzo normal
        april: 1.02,                     // Semana Santa +2%
        may: 1.12,                       // Día de las Madres +12%
        june: 1.05,                      // Bodas de verano +5%
        july: 0.96,                      // Julio bajo
        august: 0.94,                    // Agosto regreso a clases
        september: 1.03,                 // Septiembre Patrio +3%
        october: 1.02,                   // Halloween/Novios +2%
        november: 1.06,                  // Pre-navidad +6%
        december: 1.15                   // Navidad +15%
    },

    // Multiplicadores por región (México)
    regionalMultipliers: {
        'cdmx': 1.0,                     // Ciudad de México base
        'guadalajara': 0.95,             // Guadalajara -5%
        'monterrey': 1.02,               // Monterrey +2%
        'cancun': 1.10,                  // Cancún turístico +10%
        'puerto_vallarta': 1.08,         // Puerto Vallarta +8%
        'playa_del_carmen': 1.12,        // Playa del Carmen +12%
        'tijuana': 0.92,                 // Tijuana frontera -8%
        'otros': 0.88                    // Otras ciudades -12%
    },

    // Configuración de cálculo dinámico
    calculationSettings: {
        updateFrequency: 300000,         // 5 minutos en millisegundos
        volatilityThreshold: 0.05,       // 5% cambio para alertas
        maxMarkupIncrease: 0.25,         // 25% incremento máximo
        minMarkupDecrease: -0.15,        // -15% decremento máximo
        smoothingFactor: 0.3,            // Suavizado de cambios bruscos
        historicalWeights: {
            current: 0.5,                // Peso del precio actual
            hour: 0.3,                   // Peso de hace 1 hora
            day: 0.2                     // Peso de hace 1 día
        }
    },

    // Configuración de almacenamiento
    storage: {
        marketDataKey: 'dynamic_market_data',
        priceHistoryKey: 'price_history_data',
        markupHistoryKey: 'markup_history_data',
        alertsKey: 'price_alerts_data',
        maxHistoryDays: 30               // Días de historial a mantener
    },

    // Configuración de alertas
    alerts: {
        priceSpike: 0.10,               // Alerta si precio sube >10%
        priceDrop: -0.10,               // Alerta si precio baja <-10%
        volatilityHigh: 0.20,           // Alerta si volatilidad >20%
        markupOutOfRange: 0.30          // Alerta si markup >30% del normal
    }
};

// ========================================================================================
// CLASE PRINCIPAL DEL MOTOR DE MARKUP DINÁMICO
// ========================================================================================

class DynamicMarkupEngine {
    constructor() {
        this.config = DYNAMIC_MARKUP_CONFIG;
        this.currentPrices = new Map();
        this.priceHistory = new Map();
        this.markupHistory = new Map();
        this.marketConditions = {};
        this.alerts = [];
        this.observers = [];
        this.updateTimer = null;
        this.isUpdating = false;
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando Motor de Markup Dinámico...');
        
        try {
            // Cargar datos históricos
            this.loadHistoricalData();
            
            // Cargar condiciones actuales del mercado
            this.loadMarketConditions();
            
            // Obtener precios iniciales
            await this.updateAllPrices();
            
            // Configurar actualizaciones automáticas
            this.setupAutoUpdates();
            
            // Configurar integración con otros sistemas
            this.setupSystemIntegration();
            
            console.log('✅ Motor de Markup Dinámico inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando motor de markup:', error);
            this.loadFallbackData();
        }
    }

    loadHistoricalData() {
        try {
            const priceHistory = localStorage.getItem(this.config.storage.priceHistoryKey);
            if (priceHistory) {
                this.priceHistory = new Map(JSON.parse(priceHistory));
                console.log('📊 Datos históricos de precios cargados');
            }

            const markupHistory = localStorage.getItem(this.config.storage.markupHistoryKey);
            if (markupHistory) {
                this.markupHistory = new Map(JSON.parse(markupHistory));
                console.log('📈 Historial de markup cargado');
            }

            const alerts = localStorage.getItem(this.config.storage.alertsKey);
            if (alerts) {
                this.alerts = JSON.parse(alerts);
                console.log(`🚨 ${this.alerts.length} alertas cargadas`);
            }

        } catch (error) {
            console.warn('⚠️ Error cargando datos históricos:', error);
        }
    }

    loadMarketConditions() {
        try {
            const marketData = localStorage.getItem(this.config.storage.marketDataKey);
            if (marketData) {
                this.marketConditions = JSON.parse(marketData);
            } else {
                // Condiciones por defecto
                this.marketConditions = {
                    economic: 'stable',
                    inflation: 'moderate',
                    supply_chain: 'normal',
                    geopolitical: 'stable',
                    lastUpdated: Date.now()
                };
            }
            
            console.log('🌍 Condiciones de mercado cargadas:', this.marketConditions);
            
        } catch (error) {
            console.warn('⚠️ Error cargando condiciones de mercado:', error);
            this.marketConditions = {
                economic: 'stable',
                inflation: 'low',
                supply_chain: 'normal',
                geopolitical: 'stable'
            };
        }
    }

    async updateAllPrices() {
        if (this.isUpdating) {
            console.log('⏳ Actualización ya en progreso...');
            return;
        }

        this.isUpdating = true;
        console.log('💰 Actualizando precios de todos los materiales...');

        try {
            const materials = Object.keys(this.config.materialMultipliers);
            const pricePromises = materials.map(material => this.fetchMaterialPrice(material));
            
            const results = await Promise.allSettled(pricePromises);
            
            results.forEach((result, index) => {
                const material = materials[index];
                if (result.status === 'fulfilled') {
                    this.updateMaterialPrice(material, result.value);
                } else {
                    console.warn(`❌ Error actualizando precio de ${material}:`, result.reason);
                    this.useFallbackPrice(material);
                }
            });

            // Actualizar markup dinámico
            this.calculateDynamicMarkups();
            
            // Guardar datos
            this.saveHistoricalData();
            
            // Notificar observadores
            this.notifyObservers('prices_updated', {
                timestamp: Date.now(),
                prices: Object.fromEntries(this.currentPrices)
            });

        } catch (error) {
            console.error('❌ Error en actualización de precios:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    async fetchMaterialPrice(material) {
        // Integración con APIs existentes
        const materialConfig = this.config.materialMultipliers[material];
        
        try {
            // Usar sistema existente de APIs si está disponible
            if (typeof window !== 'undefined' && window.kitcoPricingManager) {
                const apiPrice = await window.kitcoPricingManager.getMetalPrice(material);
                return {
                    price: apiPrice.pricePerGram,
                    currency: 'USD',
                    timestamp: Date.now(),
                    source: 'api'
                };
            }

            // Fallback a precios estimados basados en volatilidad
            const basePrice = materialConfig.priceRange.medium;
            const volatility = materialConfig.volatilityFactor;
            const randomVariation = (Math.random() - 0.5) * 2 * volatility;
            const estimatedPrice = basePrice * (1 + randomVariation);

            return {
                price: estimatedPrice / 31.1035, // Convertir oz a gramos
                currency: 'USD',
                timestamp: Date.now(),
                source: 'estimated'
            };

        } catch (error) {
            console.error(`❌ Error obteniendo precio de ${material}:`, error);
            throw error;
        }
    }

    updateMaterialPrice(material, priceData) {
        // Agregar al historial
        if (!this.priceHistory.has(material)) {
            this.priceHistory.set(material, []);
        }
        
        const history = this.priceHistory.get(material);
        history.push(priceData);
        
        // Mantener solo los últimos 30 días
        const cutoffTime = Date.now() - (this.config.storage.maxHistoryDays * 24 * 60 * 60 * 1000);
        const filteredHistory = history.filter(entry => entry.timestamp > cutoffTime);
        this.priceHistory.set(material, filteredHistory);

        // Actualizar precio actual
        this.currentPrices.set(material, priceData);
        
        // Verificar alertas
        this.checkPriceAlerts(material, priceData);
        
        console.log(`💎 ${material} actualizado: $${priceData.price.toFixed(2)}/g USD`);
    }

    useFallbackPrice(material) {
        const materialConfig = this.config.materialMultipliers[material];
        const fallbackPrice = {
            price: materialConfig.priceRange.medium / 31.1035, // oz to grams
            currency: 'USD',
            timestamp: Date.now(),
            source: 'fallback'
        };
        
        this.currentPrices.set(material, fallbackPrice);
        console.log(`🔄 Usando precio fallback para ${material}: $${fallbackPrice.price.toFixed(2)}/g`);
    }

    calculateDynamicMarkups() {
        console.log('📊 Calculando markups dinámicos...');
        
        const materials = Object.keys(this.config.materialMultipliers);
        const currentMonth = new Date().getMonth() + 1;
        const monthName = Object.keys(this.config.seasonalMultipliers)[currentMonth - 1];
        const seasonalMultiplier = this.config.seasonalMultipliers[monthName];
        
        materials.forEach(material => {
            const markup = this.calculateMaterialMarkup(material, seasonalMultiplier);
            
            // Guardar en historial
            if (!this.markupHistory.has(material)) {
                this.markupHistory.set(material, []);
            }
            
            this.markupHistory.get(material).push({
                markup: markup,
                timestamp: Date.now(),
                conditions: { ...this.marketConditions },
                seasonal: seasonalMultiplier
            });
            
            console.log(`📈 Markup dinámico para ${material}: ${(markup * 100).toFixed(2)}%`);
        });
    }

    calculateMaterialMarkup(material, seasonalMultiplier) {
        const materialConfig = this.config.materialMultipliers[material];
        const currentPrice = this.currentPrices.get(material);
        
        if (!currentPrice) {
            console.warn(`⚠️ No hay precio actual para ${material}, usando markup base`);
            return materialConfig.baseMultiplier;
        }

        // 1. Multiplicador base del material
        let markup = materialConfig.baseMultiplier;

        // 2. Ajuste por condiciones del mercado
        const economicMultiplier = this.config.marketConditions.economic[this.marketConditions.economic] || 1.0;
        const inflationMultiplier = this.config.marketConditions.inflation[this.marketConditions.inflation] || 1.0;
        const supplyMultiplier = this.config.marketConditions.supply_chain[this.marketConditions.supply_chain] || 1.0;
        const geopoliticalMultiplier = this.config.marketConditions.geopolitical[this.marketConditions.geopolitical] || 1.0;

        markup *= economicMultiplier * inflationMultiplier * supplyMultiplier * geopoliticalMultiplier;

        // 3. Ajuste estacional
        markup *= seasonalMultiplier;

        // 4. Ajuste por volatilidad del precio
        const volatility = this.calculatePriceVolatility(material);
        const volatilityAdjustment = 1 + (volatility * materialConfig.volatilityFactor);
        markup *= volatilityAdjustment;

        // 5. Ajuste por tendencia del precio
        const trend = this.calculatePriceTrend(material);
        const trendAdjustment = materialConfig.marketAdjustments[trend] || 1.0;
        markup *= trendAdjustment;

        // 6. Aplicar límites de seguridad
        const originalMarkup = materialConfig.baseMultiplier;
        const maxIncrease = originalMarkup * (1 + this.config.calculationSettings.maxMarkupIncrease);
        const minDecrease = originalMarkup * (1 + this.config.calculationSettings.minMarkupDecrease);
        
        markup = Math.max(minDecrease, Math.min(maxIncrease, markup));

        return markup;
    }

    calculatePriceVolatility(material) {
        const history = this.priceHistory.get(material);
        if (!history || history.length < 2) {
            return 0.05; // Volatilidad por defecto 5%
        }

        // Calcular volatilidad de las últimas 24 horas
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentPrices = history
            .filter(entry => entry.timestamp > dayAgo)
            .map(entry => entry.price);

        if (recentPrices.length < 2) {
            return 0.05;
        }

        const mean = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recentPrices.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev / mean; // Coeficiente de variación
    }

    calculatePriceTrend(material) {
        const history = this.priceHistory.get(material);
        if (!history || history.length < 5) {
            return 'stable';
        }

        // Analizar últimas 5 entradas
        const recentPrices = history.slice(-5).map(entry => entry.price);
        const firstPrice = recentPrices[0];
        const lastPrice = recentPrices[recentPrices.length - 1];
        
        const change = (lastPrice - firstPrice) / firstPrice;

        if (change > 0.05) return 'bullish';
        if (change < -0.05) return 'bearish';
        return 'stable';
    }

    checkPriceAlerts(material, priceData) {
        const history = this.priceHistory.get(material);
        if (!history || history.length < 2) return;

        const previousPrice = history[history.length - 2].price;
        const currentPrice = priceData.price;
        const change = (currentPrice - previousPrice) / previousPrice;

        const alertsConfig = this.config.alerts;
        let alertTriggered = false;

        if (change > alertsConfig.priceSpike) {
            this.addAlert({
                type: 'price_spike',
                material: material,
                change: change,
                currentPrice: currentPrice,
                previousPrice: previousPrice,
                timestamp: Date.now()
            });
            alertTriggered = true;
        } else if (change < alertsConfig.priceDrop) {
            this.addAlert({
                type: 'price_drop',
                material: material,
                change: change,
                currentPrice: currentPrice,
                previousPrice: previousPrice,
                timestamp: Date.now()
            });
            alertTriggered = true;
        }

        const volatility = this.calculatePriceVolatility(material);
        if (volatility > alertsConfig.volatilityHigh) {
            this.addAlert({
                type: 'high_volatility',
                material: material,
                volatility: volatility,
                timestamp: Date.now()
            });
            alertTriggered = true;
        }

        if (alertTriggered) {
            this.notifyObservers('alert_triggered', {
                material: material,
                alerts: this.alerts.filter(alert => alert.material === material && 
                    Date.now() - alert.timestamp < 60000) // Últimos 60 segundos
            });
        }
    }

    addAlert(alertData) {
        this.alerts.unshift(alertData);
        
        // Mantener solo las últimas 100 alertas
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(0, 100);
        }

        console.log(`🚨 Nueva alerta: ${alertData.type} para ${alertData.material}`);
        this.saveAlertsData();
    }

    // ========================================================================================
    // MÉTODOS PÚBLICOS DE CÁLCULO
    // ========================================================================================

    calculatePrice(material, weight, purity = null, region = 'cdmx') {
        const materialConfig = this.config.materialMultipliers[material];
        if (!materialConfig) {
            throw new Error(`Material ${material} no soportado`);
        }

        const currentPrice = this.currentPrices.get(material);
        if (!currentPrice) {
            throw new Error(`No hay precio actual para ${material}`);
        }

        // 1. Precio base por gramo
        let pricePerGram = currentPrice.price;

        // 2. Aplicar pureza si se especifica
        if (purity && materialConfig.purityMultipliers[purity]) {
            pricePerGram *= materialConfig.purityMultipliers[purity];
        }

        // 3. Aplicar markup dinámico
        const currentMonth = new Date().getMonth() + 1;
        const monthName = Object.keys(this.config.seasonalMultipliers)[currentMonth - 1];
        const seasonalMultiplier = this.config.seasonalMultipliers[monthName];
        const dynamicMarkup = this.calculateMaterialMarkup(material, seasonalMultiplier);
        
        pricePerGram *= dynamicMarkup;

        // 4. Aplicar multiplicador regional
        const regionalMultiplier = this.config.regionalMultipliers[region] || 1.0;
        pricePerGram *= regionalMultiplier;

        // 5. Calcular precio total
        const totalPrice = pricePerGram * weight;

        return {
            material: material,
            weight: weight,
            purity: purity,
            region: region,
            pricePerGram: pricePerGram,
            totalPrice: totalPrice,
            currency: currentPrice.currency,
            breakdown: {
                basePricePerGram: currentPrice.price,
                purityMultiplier: purity ? materialConfig.purityMultipliers[purity] : 1.0,
                dynamicMarkup: dynamicMarkup,
                regionalMultiplier: regionalMultiplier,
                seasonalMultiplier: seasonalMultiplier
            },
            timestamp: Date.now(),
            dataSource: currentPrice.source
        };
    }

    getMarkupAnalysis() {
        const analysis = {};
        const materials = Object.keys(this.config.materialMultipliers);

        materials.forEach(material => {
            const materialConfig = this.config.materialMultipliers[material];
            const currentMonth = new Date().getMonth() + 1;
            const monthName = Object.keys(this.config.seasonalMultipliers)[currentMonth - 1];
            const seasonalMultiplier = this.config.seasonalMultipliers[monthName];
            const dynamicMarkup = this.calculateMaterialMarkup(material, seasonalMultiplier);

            analysis[material] = {
                name: materialConfig.name,
                baseMultiplier: materialConfig.baseMultiplier,
                currentMarkup: dynamicMarkup,
                markupChange: ((dynamicMarkup / materialConfig.baseMultiplier) - 1) * 100,
                volatility: this.calculatePriceVolatility(material),
                trend: this.calculatePriceTrend(material),
                lastUpdate: this.currentPrices.get(material)?.timestamp || null
            };
        });

        return analysis;
    }

    getPriceProjections(material, days = 7) {
        const history = this.priceHistory.get(material);
        if (!history || history.length < 5) {
            return null;
        }

        const recentPrices = history.slice(-10).map(entry => entry.price);
        const trend = this.calculatePriceTrend(material);
        const volatility = this.calculatePriceVolatility(material);
        const currentPrice = recentPrices[recentPrices.length - 1];

        const projections = [];
        
        for (let day = 1; day <= days; day++) {
            let projectedPrice = currentPrice;
            
            // Aplicar tendencia
            const trendFactor = {
                'bullish': 0.002 * day,   // +0.2% por día
                'bearish': -0.002 * day,  // -0.2% por día
                'stable': 0               // Sin cambio
            }[trend] || 0;
            
            // Agregar ruido aleatorio basado en volatilidad
            const randomFactor = (Math.random() - 0.5) * 2 * volatility * 0.5;
            
            projectedPrice *= (1 + trendFactor + randomFactor);
            
            projections.push({
                day: day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                projectedPrice: projectedPrice,
                confidence: Math.max(0.3, 1 - (day * 0.1)) // Confianza decrece con días
            });
        }

        return projections;
    }

    // ========================================================================================
    // CONFIGURACIÓN Y GESTIÓN
    // ========================================================================================

    updateMarketConditions(conditions) {
        this.marketConditions = { ...this.marketConditions, ...conditions, lastUpdated: Date.now() };
        localStorage.setItem(this.config.storage.marketDataKey, JSON.stringify(this.marketConditions));
        
        console.log('🌍 Condiciones de mercado actualizadas:', conditions);
        
        // Recalcular markups
        this.calculateDynamicMarkups();
        
        // Notificar cambios
        this.notifyObservers('market_conditions_updated', this.marketConditions);
    }

    setupAutoUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(() => {
            console.log('🔄 Actualización automática de precios...');
            this.updateAllPrices();
        }, this.config.calculationSettings.updateFrequency);

        console.log(`⏰ Actualizaciones automáticas configuradas cada ${this.config.calculationSettings.updateFrequency / 60000} minutos`);
    }

    setupSystemIntegration() {
        // Integración con sistema de markup global
        if (typeof window !== 'undefined') {
            window.dynamicMarkupEngine = this;
            
            // Integrar con sistema de precios existente
            if (window.globalMarkupSystem) {
                window.globalMarkupSystem.dynamicEngine = this;
                
                // Función para obtener markup dinámico
                window.globalMarkupSystem.getDynamicMarkup = (material, options = {}) => {
                    const { weight = 1, purity = null, region = 'cdmx' } = options;
                    return this.calculatePrice(material, weight, purity, region);
                };
                
                console.log('🔗 Motor de markup dinámico integrado con sistema global');
            }
        }
    }

    // ========================================================================================
    // PERSISTENCIA DE DATOS
    // ========================================================================================

    saveHistoricalData() {
        try {
            localStorage.setItem(
                this.config.storage.priceHistoryKey,
                JSON.stringify(Array.from(this.priceHistory.entries()))
            );
            
            localStorage.setItem(
                this.config.storage.markupHistoryKey,
                JSON.stringify(Array.from(this.markupHistory.entries()))
            );

            console.log('💾 Datos históricos guardados');
        } catch (error) {
            console.error('❌ Error guardando datos históricos:', error);
        }
    }

    saveAlertsData() {
        try {
            localStorage.setItem(this.config.storage.alertsKey, JSON.stringify(this.alerts));
        } catch (error) {
            console.error('❌ Error guardando alertas:', error);
        }
    }

    exportData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            currentPrices: Object.fromEntries(this.currentPrices),
            priceHistory: Object.fromEntries(this.priceHistory),
            markupHistory: Object.fromEntries(this.markupHistory),
            marketConditions: this.marketConditions,
            alerts: this.alerts
        };
    }

    importData(data) {
        try {
            if (data.currentPrices) {
                this.currentPrices = new Map(Object.entries(data.currentPrices));
            }
            if (data.priceHistory) {
                this.priceHistory = new Map(Object.entries(data.priceHistory));
            }
            if (data.markupHistory) {
                this.markupHistory = new Map(Object.entries(data.markupHistory));
            }
            if (data.marketConditions) {
                this.marketConditions = data.marketConditions;
            }
            if (data.alerts) {
                this.alerts = data.alerts;
            }

            console.log('📥 Datos importados exitosamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            return { success: false, error: error.message };
        }
    }

    loadFallbackData() {
        console.log('🔄 Cargando datos de fallback...');
        
        const materials = Object.keys(this.config.materialMultipliers);
        materials.forEach(material => {
            this.useFallbackPrice(material);
        });
        
        this.calculateDynamicMarkups();
    }

    // ========================================================================================
    // SISTEMA DE OBSERVADORES
    // ========================================================================================

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
                callback(event, data);
            } catch (error) {
                console.error('Error in dynamic markup engine observer:', error);
            }
        });
    }

    // ========================================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // ========================================================================================

    getSystemStatus() {
        return {
            isRunning: !!this.updateTimer,
            lastUpdate: Math.max(...Array.from(this.currentPrices.values()).map(price => price.timestamp || 0)),
            materialsTracked: this.currentPrices.size,
            activeAlerts: this.alerts.filter(alert => Date.now() - alert.timestamp < 24 * 60 * 60 * 1000).length,
            marketConditions: this.marketConditions,
            updateFrequency: this.config.calculationSettings.updateFrequency / 60000, // en minutos
            cacheHealth: {
                priceHistoryEntries: Array.from(this.priceHistory.values()).reduce((sum, history) => sum + history.length, 0),
                markupHistoryEntries: Array.from(this.markupHistory.values()).reduce((sum, history) => sum + history.length, 0)
            }
        };
    }

    getCurrentPrices() {
        const prices = {};
        this.currentPrices.forEach((priceData, material) => {
            prices[material] = {
                ...priceData,
                name: this.config.materialMultipliers[material]?.name || material
            };
        });
        return prices;
    }

    getActiveAlerts(timeframe = 24) { // horas
        const cutoffTime = Date.now() - (timeframe * 60 * 60 * 1000);
        return this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }

    // Método para testing y debugging
    simulateMarketCondition(condition, duration = 300000) { // 5 minutos por defecto
        const originalConditions = { ...this.marketConditions };
        
        this.updateMarketConditions(condition);
        
        setTimeout(() => {
            this.updateMarketConditions(originalConditions);
            console.log('🔄 Simulación de condición de mercado completada');
        }, duration);
        
        console.log(`🧪 Simulando condición de mercado por ${duration/60000} minutos:`, condition);
    }
}

// ========================================================================================
// FUNCIONES AUXILIARES Y UTILIDADES
// ========================================================================================

function formatCurrency(amount, currency = 'USD') {
    const locale = currency === 'USD' ? 'en-US' : 'es-MX';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

function formatPercentage(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
}

function calculatePriceChange(currentPrice, previousPrice) {
    if (!previousPrice || previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice);
}

// ========================================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// ========================================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.dynamicMarkupEngine = new DynamicMarkupEngine();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DynamicMarkupEngine,
        DYNAMIC_MARKUP_CONFIG,
        formatCurrency,
        formatPercentage,
        calculatePriceChange
    };
}

console.log('✅ Motor de Markup Dinámico v1.0 cargado correctamente');
console.log('💰 Ver estado: window.dynamicMarkupEngine.getSystemStatus()');
console.log('📊 Análisis de markup: window.dynamicMarkupEngine.getMarkupAnalysis()');
console.log('💎 Calcular precio: window.dynamicMarkupEngine.calculatePrice("gold", 5.2, "18k", "cdmx")');
console.log('🚨 Alertas activas: window.dynamicMarkupEngine.getActiveAlerts()');