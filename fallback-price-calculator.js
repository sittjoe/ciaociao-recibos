// fallback-price-calculator.js - SISTEMA DE PRECIOS DE EMERGENCIA v1.0
// Algoritmos de interpolación y precios de respaldo para SUBAGENTE 5
// ========================================================================

console.log('🛡️ Iniciando Sistema de Precios de Emergencia v1.0...');

// ========================================================================
// CONFIGURACIÓN DEL SISTEMA DE FALLBACK
// ========================================================================

const FALLBACK_CONFIG = {
    // Precios base verificados (Agosto 2025) - última actualización confiable
    baselinePrices: {
        metals: {
            gold: {
                spot: 2700.00, // USD por onza troy
                lastUpdate: '2025-08-13',
                confidence: 'high',
                karats: {
                    '24k': 1.0,    // 100% pureza
                    '22k': 0.917,  // 91.7% pureza  
                    '18k': 0.750,  // 75% pureza
                    '14k': 0.585,  // 58.5% pureza
                    '10k': 0.417   // 41.7% pureza
                }
            },
            silver: {
                spot: 38.00, // USD por onza troy
                lastUpdate: '2025-08-13',
                confidence: 'high',
                purities: {
                    '999': 1.0,    // Plata fina
                    '958': 0.958,  // Británnica
                    '925': 0.925,  // Sterling
                    '900': 0.900,  // Moneda
                    '800': 0.800   // Europea
                }
            },
            platinum: {
                spot: 975.00, // USD por onza troy
                lastUpdate: '2025-08-13', 
                confidence: 'medium',
                purities: {
                    '999': 1.0,
                    '950': 0.950,
                    '900': 0.900,
                    '850': 0.850
                }
            },
            palladium: {
                spot: 1400.00, // USD por onza troy
                lastUpdate: '2025-08-13',
                confidence: 'medium',
                purities: {
                    '999': 1.0,
                    '950': 0.950,
                    '900': 0.900
                }
            }
        },

        // Factores de ajuste por volatilidad histórica
        volatilityFactors: {
            gold: 0.15,      // ±15% variación típica
            silver: 0.25,    // ±25% variación típica
            platinum: 0.20,  // ±20% variación típica
            palladium: 0.35  // ±35% variación típica (más volátil)
        },

        // Tipos de cambio de respaldo
        exchangeRates: {
            'USD-MXN': {
                rate: 19.80,
                lastUpdate: '2025-08-13',
                range: { min: 18.50, max: 21.00 }
            },
            'USD-EUR': {
                rate: 0.85,
                lastUpdate: '2025-08-13', 
                range: { min: 0.80, max: 0.90 }
            }
        }
    },

    // Configuración de interpolación
    interpolation: {
        methods: ['linear', 'polynomial', 'exponential'],
        defaultMethod: 'linear',
        timeWindows: {
            short: 24 * 60 * 60 * 1000,      // 24 horas
            medium: 7 * 24 * 60 * 60 * 1000,  // 7 días
            long: 30 * 24 * 60 * 60 * 1000    // 30 días
        },
        confidenceThresholds: {
            high: 0.9,     // Datos frescos y confiables
            medium: 0.7,   // Datos moderadamente antiguos
            low: 0.5,      // Datos antiguos o estimados
            emergency: 0.3 // Solo precios baseline
        }
    },

    // Configuración de degradación
    degradation: {
        stages: {
            1: 'apis_available',        // Todas las APIs funcionando
            2: 'partial_apis',          // Algunas APIs fallan
            3: 'cached_only',           // Solo datos en cache
            4: 'interpolated',          // Datos interpolados
            5: 'baseline_adjusted',     // Precios base con ajustes
            6: 'static_emergency'       // Precios fijos de emergencia
        },
        
        triggers: {
            apiFailureThreshold: 0.7,   // 70% de APIs fallan → degradar
            cacheAgeThreshold: 4 * 60 * 60 * 1000, // 4 horas → degradar
            dataPointsMinimum: 3        // Mínimo para interpolación
        }
    },

    // Configuración de alertas
    alerts: {
        degradationLevel: 3,    // Alertar desde nivel 3
        priceDeviations: {
            warning: 0.10,      // 10% desviación → warning
            critical: 0.20      // 20% desviación → crítico
        },
        emergencyContacts: ['admin@ciaociao.mx']
    }
};

// ========================================================================
// CLASE PRINCIPAL DEL SISTEMA DE FALLBACK
// ========================================================================

class FallbackPriceCalculator {
    constructor() {
        this.currentStage = 1;
        this.lastKnownPrices = new Map();
        this.historicalData = new Map();
        this.interpolationCache = new Map();
        this.alertsSent = new Set();
        this.degradationHistory = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de precios de emergencia...');
        
        try {
            // Cargar datos almacenados
            this.loadStoredData();
            
            // Verificar estado inicial del sistema
            await this.assessSystemHealth();
            
            // Configurar monitoreo continuo
            this.setupContinuousMonitoring();
            
            // Precargar interpolaciones comunes
            this.precacheCommonInterpolations();
            
            console.log('✅ Sistema de fallback inicializado - Etapa:', this.currentStage);
            
        } catch (error) {
            console.error('❌ Error inicializando fallback system:', error);
            this.degradeToEmergency();
        }
    }

    // ========================================================================
    // EVALUACIÓN DE SALUD DEL SISTEMA
    // ========================================================================

    async assessSystemHealth() {
        console.log('🔍 Evaluando salud del sistema de precios...');
        
        const healthMetrics = {
            apisAvailable: await this.checkAPIsHealth(),
            cacheStatus: this.checkCacheHealth(), 
            dataFreshness: this.checkDataFreshness(),
            exchangeRateStatus: this.checkExchangeRateHealth()
        };

        // Determinar etapa de degradación apropiada
        this.currentStage = this.determineStage(healthMetrics);
        
        console.log('📊 Métricas de salud:', healthMetrics);
        console.log('🎯 Etapa actual:', this.currentStage);
        
        // Registrar cambio de etapa si es significativo
        if (this.currentStage >= 3) {
            this.recordDegradation(this.currentStage, healthMetrics);
        }
    }

    async checkAPIsHealth() {
        const apis = [
            'window.realMetalsAPI',
            'window.realTimePriceValidator', 
            'window.exchangeRateManager'
        ];

        let availableCount = 0;
        const results = {};

        for (const api of apis) {
            try {
                const apiObject = this.getNestedProperty(window, api.replace('window.', ''));
                if (apiObject && typeof apiObject === 'object') {
                    // Verificar si el API responde
                    const isHealthy = await this.testAPIHealth(apiObject);
                    results[api] = isHealthy;
                    if (isHealthy) availableCount++;
                }
            } catch (error) {
                results[api] = false;
            }
        }

        return {
            available: availableCount,
            total: apis.length,
            ratio: availableCount / apis.length,
            details: results
        };
    }

    async testAPIHealth(apiObject) {
        try {
            // Test básico de funcionalidad
            if (apiObject.getSystemStatus) {
                const status = apiObject.getSystemStatus();
                return status && status.isInitialized !== false;
            }
            
            if (apiObject.isInitialized !== undefined) {
                return apiObject.isInitialized;
            }
            
            // Si no hay métodos de status, asumir que está disponible
            return true;
            
        } catch (error) {
            return false;
        }
    }

    checkCacheHealth() {
        const caches = [
            'metal_prices_cache',
            'exchange_rate_current',
            'pricing_validation_cache'
        ];

        let validCaches = 0;
        const details = {};

        for (const cacheKey of caches) {
            try {
                const cacheData = localStorage.getItem(cacheKey);
                if (cacheData) {
                    const parsed = JSON.parse(cacheData);
                    const age = Date.now() - (parsed.timestamp || parsed.lastUpdate || 0);
                    const isValid = age < 4 * 60 * 60 * 1000; // 4 horas máximo
                    
                    details[cacheKey] = { exists: true, age, isValid };
                    if (isValid) validCaches++;
                } else {
                    details[cacheKey] = { exists: false };
                }
            } catch (error) {
                details[cacheKey] = { exists: false, error: error.message };
            }
        }

        return {
            valid: validCaches,
            total: caches.length,
            ratio: validCaches / caches.length,
            details
        };
    }

    checkDataFreshness() {
        const now = Date.now();
        const freshness = {
            metals: this.getDataAge('metal_prices_cache'),
            exchange: this.getDataAge('exchange_rate_current'),
            validation: this.getDataAge('pricing_validation_cache')
        };

        const avgAge = Object.values(freshness).reduce((sum, age) => sum + age, 0) / 3;
        
        return {
            averageAge: avgAge,
            details: freshness,
            isFresh: avgAge < 2 * 60 * 60 * 1000, // 2 horas
            isStale: avgAge > 6 * 60 * 60 * 1000   // 6 horas
        };
    }

    checkExchangeRateHealth() {
        try {
            const exchangeData = localStorage.getItem('exchange_rate_current');
            if (!exchangeData) return { available: false, reason: 'No data' };
            
            const parsed = JSON.parse(exchangeData);
            const age = Date.now() - (parsed.timestamp || 0);
            const rate = parsed.rate;
            
            // Verificar que el rate esté en rango razonable
            const isValidRange = rate >= 17.0 && rate <= 23.0;
            const isFresh = age < 60 * 60 * 1000; // 1 hora
            
            return {
                available: true,
                rate,
                age,
                isValidRange,
                isFresh,
                quality: isValidRange && isFresh ? 'good' : 'degraded'
            };
            
        } catch (error) {
            return { available: false, reason: error.message };
        }
    }

    determineStage(healthMetrics) {
        // Etapa 1: Todo funciona bien
        if (healthMetrics.apisAvailable.ratio >= 0.8 && 
            healthMetrics.cacheStatus.ratio >= 0.7 &&
            healthMetrics.dataFreshness.isFresh) {
            return 1;
        }
        
        // Etapa 2: Algunos APIs fallan pero cache es bueno
        if (healthMetrics.apisAvailable.ratio >= 0.5 && 
            healthMetrics.cacheStatus.ratio >= 0.5) {
            return 2;
        }
        
        // Etapa 3: Solo cache disponible
        if (healthMetrics.cacheStatus.ratio >= 0.3 && 
            !healthMetrics.dataFreshness.isStale) {
            return 3;
        }
        
        // Etapa 4: Cache viejo, necesita interpolación
        if (healthMetrics.cacheStatus.ratio >= 0.1) {
            return 4;
        }
        
        // Etapa 5: Solo precios baseline
        if (this.hasBaselinePrices()) {
            return 5;
        }
        
        // Etapa 6: Emergencia total
        return 6;
    }

    // ========================================================================
    // OBTENCIÓN DE PRECIOS CON FALLBACK INTELIGENTE
    // ========================================================================

    async getPrice(metal, purity, weight = 1, options = {}) {
        const requestId = this.generateRequestId();
        console.log(`🔍 [${requestId}] Solicitando precio: ${metal} ${purity} ${weight}g`);
        
        try {
            // Intentar obtener precio según etapa actual
            const priceResult = await this.getPriceByStage(metal, purity, weight, options);
            
            // Validar resultado
            if (this.isValidPriceResult(priceResult)) {
                console.log(`✅ [${requestId}] Precio obtenido (Etapa ${this.currentStage}):`, priceResult);
                return priceResult;
            }
            
            // Si falla, degradar e intentar siguiente etapa
            console.warn(`⚠️ [${requestId}] Precio inválido, degradando...`);
            await this.degradeStage();
            
            return await this.getPriceByStage(metal, purity, weight, options);
            
        } catch (error) {
            console.error(`❌ [${requestId}] Error obteniendo precio:`, error);
            return this.getEmergencyPrice(metal, purity, weight);
        }
    }

    async getPriceByStage(metal, purity, weight, options) {
        const methodMap = {
            1: () => this.getPriceFromAPIs(metal, purity, weight, options),
            2: () => this.getPriceFromPartialAPIs(metal, purity, weight, options),
            3: () => this.getPriceFromCache(metal, purity, weight, options),
            4: () => this.getPriceFromInterpolation(metal, purity, weight, options),
            5: () => this.getPriceFromBaseline(metal, purity, weight, options),
            6: () => this.getEmergencyPrice(metal, purity, weight, options)
        };

        const method = methodMap[this.currentStage];
        if (!method) {
            throw new Error(`Etapa inválida: ${this.currentStage}`);
        }

        return await method();
    }

    // ========================================================================
    // MÉTODOS DE OBTENCIÓN POR ETAPA
    // ========================================================================

    async getPriceFromAPIs(metal, purity, weight, options) {
        console.log('📡 Intentando obtener precio de APIs principales...');
        
        // Intentar API principal de metales
        if (window.realMetalsAPI) {
            try {
                const result = await window.realMetalsAPI.getMetalPrice(metal, purity);
                if (result && result.pricePerGram) {
                    return this.formatPriceResult(result.pricePerGram * weight, {
                        source: 'primary_api',
                        confidence: 'high',
                        metal, purity, weight,
                        breakdown: result
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error con API principal:', error.message);
            }
        }

        // Intentar validador de precios como respaldo
        if (window.realTimePriceValidator) {
            try {
                const result = await window.realTimePriceValidator.getValidatedPrice(metal, purity);
                if (result && result.averagePrice) {
                    return this.formatPriceResult(result.averagePrice * weight, {
                        source: 'price_validator',
                        confidence: 'high',
                        metal, purity, weight,
                        breakdown: result
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error con validador de precios:', error.message);
            }
        }

        throw new Error('APIs principales no disponibles');
    }

    async getPriceFromPartialAPIs(metal, purity, weight, options) {
        console.log('📊 Obteniendo precio de APIs parciales + cache...');
        
        // Intentar cualquier API disponible
        const apiAttempts = [
            () => window.realMetalsAPI?.getMetalPrice(metal, purity),
            () => window.realTimePriceValidator?.getValidatedPrice(metal, purity)
        ];

        for (const apiCall of apiAttempts) {
            try {
                const result = await apiCall();
                if (result && (result.pricePerGram || result.averagePrice)) {
                    const price = (result.pricePerGram || result.averagePrice) * weight;
                    return this.formatPriceResult(price, {
                        source: 'partial_api',
                        confidence: 'medium',
                        metal, purity, weight,
                        breakdown: result
                    });
                }
            } catch (error) {
                continue;
            }
        }

        // Si APIs fallan, usar cache como respaldo
        return this.getPriceFromCache(metal, purity, weight, options);
    }

    async getPriceFromCache(metal, purity, weight, options) {
        console.log('💾 Obteniendo precio desde cache...');
        
        try {
            // Buscar en cache de precios metales
            const metalCache = localStorage.getItem('metal_prices_cache');
            if (metalCache) {
                const cached = JSON.parse(metalCache);
                const metalData = cached[metal.toLowerCase()];
                
                if (metalData && metalData[purity]) {
                    const cacheAge = Date.now() - (metalData.timestamp || 0);
                    const price = metalData[purity] * weight;
                    
                    return this.formatPriceResult(price, {
                        source: 'cache',
                        confidence: cacheAge < 2 * 60 * 60 * 1000 ? 'medium' : 'low',
                        metal, purity, weight,
                        cacheAge,
                        originalData: metalData
                    });
                }
            }

            // Buscar en último precio conocido
            const lastKnownKey = `${metal}_${purity}`;
            if (this.lastKnownPrices.has(lastKnownKey)) {
                const lastKnown = this.lastKnownPrices.get(lastKnownKey);
                const price = lastKnown.pricePerGram * weight;
                
                return this.formatPriceResult(price, {
                    source: 'last_known',
                    confidence: 'low',
                    metal, purity, weight,
                    age: Date.now() - lastKnown.timestamp
                });
            }

            throw new Error('No hay datos en cache');
            
        } catch (error) {
            console.warn('⚠️ Error accediendo cache:', error.message);
            throw error;
        }
    }

    async getPriceFromInterpolation(metal, purity, weight, options) {
        console.log('📈 Calculando precio por interpolación...');
        
        try {
            // Obtener datos históricos para interpolación
            const historicalPoints = this.getHistoricalDataPoints(metal, purity);
            
            if (historicalPoints.length < 2) {
                throw new Error('Datos insuficientes para interpolación');
            }

            // Realizar interpolación
            const interpolatedPrice = this.performInterpolation(historicalPoints, options);
            const price = interpolatedPrice * weight;
            
            // Aplicar factor de incertidumbre
            const uncertaintyFactor = this.calculateUncertaintyFactor(historicalPoints);
            
            return this.formatPriceResult(price, {
                source: 'interpolation',
                confidence: uncertaintyFactor > 0.8 ? 'medium' : 'low',
                metal, purity, weight,
                interpolationMethod: options.method || 'linear',
                dataPoints: historicalPoints.length,
                uncertainty: uncertaintyFactor
            });

        } catch (error) {
            console.warn('⚠️ Error en interpolación:', error.message);
            throw error;
        }
    }

    async getPriceFromBaseline(metal, purity, weight, options) {
        console.log('📊 Calculando precio desde baseline + ajustes...');
        
        try {
            const baselineData = FALLBACK_CONFIG.baselinePrices.metals[metal.toLowerCase()];
            if (!baselineData) {
                throw new Error(`Metal ${metal} no encontrado en baseline`);
            }

            // Obtener precio spot base
            let spotPrice = baselineData.spot;
            
            // Aplicar factor de pureza
            const purityFactors = baselineData.karats || baselineData.purities;
            const purityFactor = purityFactors[purity];
            
            if (!purityFactor) {
                throw new Error(`Pureza ${purity} no encontrada para ${metal}`);
            }

            // Convertir de onzas troy a gramos
            const gramsPerOz = 31.1035;
            let pricePerGram = (spotPrice * purityFactor) / gramsPerOz;

            // Aplicar ajustes de volatilidad y tiempo
            pricePerGram = this.applyBaselineAdjustments(pricePerGram, metal, options);

            // Convertir a MXN si es necesario
            if (options.currency === 'MXN' || !options.currency) {
                const exchangeRate = this.getExchangeRate();
                pricePerGram *= exchangeRate;
            }

            const totalPrice = pricePerGram * weight;

            return this.formatPriceResult(totalPrice, {
                source: 'baseline_adjusted',
                confidence: 'low',
                metal, purity, weight,
                spotPrice,
                purityFactor,
                pricePerGram,
                adjustments: this.getAppliedAdjustments(metal),
                exchangeRate: options.currency === 'USD' ? null : this.getExchangeRate()
            });

        } catch (error) {
            console.warn('⚠️ Error con baseline:', error.message);
            throw error;
        }
    }

    getEmergencyPrice(metal, purity, weight, options = {}) {
        console.log('🚨 Generando precio de emergencia...');
        
        try {
            // Precios hardcodeados de emergencia (MXN por gramo, Agosto 2025)
            const emergencyPrices = {
                gold: {
                    '24k': 1172,
                    '22k': 1075,
                    '18k': 879,
                    '14k': 686,
                    '10k': 488
                },
                silver: {
                    '999': 23,
                    '958': 22,
                    '925': 21,
                    '900': 20,
                    '800': 18
                },
                platinum: {
                    '999': 654,
                    '950': 621,
                    '900': 588,
                    '850': 556
                },
                palladium: {
                    '999': 672,
                    '950': 638,
                    '900': 605
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

            const totalPrice = pricePerGram * weight;

            return this.formatPriceResult(totalPrice, {
                source: 'emergency_static',
                confidence: 'emergency',
                metal, purity, weight,
                pricePerGram,
                warning: 'Precio de emergencia - verificar conexión y APIs',
                lastResort: true
            });

        } catch (error) {
            console.error('🚨 Error crítico en precio de emergencia:', error);
            
            // Último recurso absoluto
            return this.formatPriceResult(1000 * weight, {
                source: 'absolute_fallback',
                confidence: 'critical',
                metal, purity, weight,
                error: error.message,
                warning: 'PRECIO ESTIMADO - REQUIERE VERIFICACIÓN MANUAL'
            });
        }
    }

    // ========================================================================
    // ALGORITMOS DE INTERPOLACIÓN
    // ========================================================================

    performInterpolation(dataPoints, options) {
        const method = options.interpolationMethod || FALLBACK_CONFIG.interpolation.defaultMethod;
        
        switch (method) {
            case 'linear':
                return this.linearInterpolation(dataPoints);
            case 'polynomial':
                return this.polynomialInterpolation(dataPoints);
            case 'exponential':
                return this.exponentialInterpolation(dataPoints);
            default:
                return this.linearInterpolation(dataPoints);
        }
    }

    linearInterpolation(dataPoints) {
        // Ordenar por timestamp
        const sortedPoints = dataPoints.sort((a, b) => a.timestamp - b.timestamp);
        const now = Date.now();
        
        // Encontrar los dos puntos más cercanos en el tiempo
        let point1 = sortedPoints[0];
        let point2 = sortedPoints[sortedPoints.length - 1];
        
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            if (sortedPoints[i].timestamp <= now && sortedPoints[i + 1].timestamp >= now) {
                point1 = sortedPoints[i];
                point2 = sortedPoints[i + 1];
                break;
            }
        }

        // Interpolación lineal
        const timeDiff = point2.timestamp - point1.timestamp;
        const priceDiff = point2.price - point1.price;
        const timeProgress = (now - point1.timestamp) / timeDiff;
        
        return point1.price + (priceDiff * timeProgress);
    }

    polynomialInterpolation(dataPoints) {
        // Implementación simplificada de regresión polinomial de grado 2
        if (dataPoints.length < 3) {
            return this.linearInterpolation(dataPoints);
        }

        const sortedPoints = dataPoints.sort((a, b) => a.timestamp - b.timestamp);
        const n = Math.min(sortedPoints.length, 10); // Limitar a 10 puntos más recientes
        const recentPoints = sortedPoints.slice(-n);
        
        // Normalizar timestamps para evitar números muy grandes
        const baseTime = recentPoints[0].timestamp;
        const normalizedPoints = recentPoints.map(p => ({
            x: (p.timestamp - baseTime) / (1000 * 60 * 60), // Horas desde el primer punto
            y: p.price
        }));

        // Calcular coeficientes usando método de mínimos cuadrados
        const { a, b, c } = this.calculatePolynomialCoefficients(normalizedPoints);
        
        // Evaluar polinomial en tiempo actual
        const currentTimeNormalized = (Date.now() - baseTime) / (1000 * 60 * 60);
        const interpolatedPrice = a * Math.pow(currentTimeNormalized, 2) + b * currentTimeNormalized + c;
        
        // Validar que el resultado sea razonable
        const avgPrice = recentPoints.reduce((sum, p) => sum + p.price, 0) / recentPoints.length;
        const maxDeviation = avgPrice * 0.5; // 50% máximo de desviación
        
        if (Math.abs(interpolatedPrice - avgPrice) > maxDeviation) {
            console.warn('⚠️ Interpolación polinomial fuera de rango, usando promedio');
            return avgPrice;
        }
        
        return interpolatedPrice;
    }

    calculatePolynomialCoefficients(points) {
        const n = points.length;
        let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumY = 0, sumXY = 0, sumX2Y = 0;
        
        for (const point of points) {
            const x = point.x;
            const y = point.y;
            
            sumX += x;
            sumX2 += x * x;
            sumX3 += x * x * x;
            sumX4 += x * x * x * x;
            sumY += y;
            sumXY += x * y;
            sumX2Y += x * x * y;
        }

        // Sistema de ecuaciones para ax² + bx + c
        // Usando método de eliminación de Gauss simplificado
        const denominator = n * sumX2 * sumX4 + 2 * sumX * sumX2 * sumX3 - sumX2 * sumX2 * sumX2 - sumX * sumX * sumX4 - n * sumX3 * sumX3;
        
        if (Math.abs(denominator) < 1e-10) {
            // Sistema singular, usar interpolación lineal
            console.warn('⚠️ Sistema singular en interpolación polinomial');
            return { a: 0, b: (sumXY - sumX * sumY / n) / (sumX2 - sumX * sumX / n), c: sumY / n };
        }

        const a = (n * sumX2Y - sumX2 * sumY - sumX * sumXY + sumX * sumX * sumY / n) / (n * sumX4 - sumX2 * sumX2);
        const b = (sumXY - a * sumX3 - c * sumX) / sumX2;
        const c = (sumY - a * sumX2 - b * sumX) / n;

        return { a: a || 0, b: b || 0, c: c || 0 };
    }

    exponentialInterpolation(dataPoints) {
        // Interpolación exponencial para capturar tendencias de mercado
        if (dataPoints.length < 3) {
            return this.linearInterpolation(dataPoints);
        }

        const sortedPoints = dataPoints.sort((a, b) => a.timestamp - b.timestamp);
        const recentPoints = sortedPoints.slice(-5); // Últimos 5 puntos
        
        // Calcular tasa de crecimiento promedio
        let totalGrowthRate = 0;
        let growthCount = 0;
        
        for (let i = 1; i < recentPoints.length; i++) {
            const prev = recentPoints[i - 1];
            const curr = recentPoints[i];
            
            const timeDeltaHours = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60);
            const priceRatio = curr.price / prev.price;
            
            if (timeDeltaHours > 0 && priceRatio > 0) {
                const hourlyGrowthRate = Math.pow(priceRatio, 1 / timeDeltaHours) - 1;
                totalGrowthRate += hourlyGrowthRate;
                growthCount++;
            }
        }

        if (growthCount === 0) {
            return this.linearInterpolation(dataPoints);
        }

        const avgGrowthRate = totalGrowthRate / growthCount;
        const lastPoint = recentPoints[recentPoints.length - 1];
        const hoursElapsed = (Date.now() - lastPoint.timestamp) / (1000 * 60 * 60);
        
        // Aplicar crecimiento exponencial
        const projectedPrice = lastPoint.price * Math.pow(1 + avgGrowthRate, hoursElapsed);
        
        // Limitar volatilidad extrema (máximo 20% de cambio por día)
        const maxDailyChange = 0.20;
        const daysElapsed = hoursElapsed / 24;
        const maxChange = Math.pow(1 + maxDailyChange, Math.abs(daysElapsed));
        
        const minPrice = lastPoint.price / maxChange;
        const maxPrice = lastPoint.price * maxChange;
        
        return Math.max(minPrice, Math.min(maxPrice, projectedPrice));
    }

    // ========================================================================
    // UTILIDADES Y HELPERS
    // ========================================================================

    applyBaselineAdjustments(basePrice, metal, options) {
        let adjustedPrice = basePrice;
        
        // Factor de volatilidad histórica
        const volatilityFactor = FALLBACK_CONFIG.baselinePrices.volatilityFactors[metal.toLowerCase()] || 0.15;
        
        // Aplicar ajuste temporal (precios tienden a subir con el tiempo)
        const baselineDate = new Date('2025-08-13').getTime();
        const currentDate = Date.now();
        const daysSinceBaseline = (currentDate - baselineDate) / (1000 * 60 * 60 * 24);
        
        // Ajuste inflacionario conservador (2% anual = 0.0055% diario)
        const inflationAdjustment = Math.pow(1.0000548, daysSinceBaseline); // 2% anual
        adjustedPrice *= inflationAdjustment;
        
        // Aplicar banda de volatilidad si no hay datos recientes
        if (options.applyVolatilityBand) {
            const volatilityMultiplier = 1 + (volatilityFactor / 2); // Usar mitad de la volatilidad típica
            adjustedPrice *= volatilityMultiplier;
        }
        
        return adjustedPrice;
    }

    getAppliedAdjustments(metal) {
        const baselineDate = new Date('2025-08-13').getTime();
        const daysSinceBaseline = (Date.now() - baselineDate) / (1000 * 60 * 60 * 24);
        const inflationAdjustment = Math.pow(1.0000548, daysSinceBaseline);
        
        return {
            inflationFactor: inflationAdjustment,
            daysSinceBaseline: Math.floor(daysSinceBaseline),
            volatilityFactor: FALLBACK_CONFIG.baselinePrices.volatilityFactors[metal.toLowerCase()]
        };
    }

    getExchangeRate() {
        // Intentar obtener tipo actual
        if (window.exchangeRateManager && window.exchangeRateManager.currentRate) {
            return window.exchangeRateManager.currentRate;
        }
        
        // Fallback desde localStorage
        try {
            const exchangeData = localStorage.getItem('exchange_rate_current');
            if (exchangeData) {
                const parsed = JSON.parse(exchangeData);
                return parsed.rate;
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo exchange rate:', error.message);
        }
        
        // Último recurso
        return FALLBACK_CONFIG.baselinePrices.exchangeRates['USD-MXN'].rate;
    }

    formatPriceResult(price, metadata) {
        return {
            totalPrice: parseFloat(price.toFixed(2)),
            pricePerGram: metadata.weight ? parseFloat((price / metadata.weight).toFixed(2)) : null,
            currency: 'MXN',
            timestamp: Date.now(),
            ...metadata
        };
    }

    isValidPriceResult(result) {
        return result &&
               typeof result.totalPrice === 'number' &&
               result.totalPrice > 0 &&
               !isNaN(result.totalPrice) &&
               result.source;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ========================================================================
    // GESTIÓN DE DEGRADACIÓN
    // ========================================================================

    async degradeStage() {
        const previousStage = this.currentStage;
        this.currentStage = Math.min(this.currentStage + 1, 6);
        
        if (this.currentStage !== previousStage) {
            console.warn(`⬇️ Degradando sistema: Etapa ${previousStage} → ${this.currentStage}`);
            this.recordDegradation(this.currentStage, { reason: 'Manual degradation due to failure' });
            
            // Enviar alerta si es necesario
            if (this.currentStage >= FALLBACK_CONFIG.alerts.degradationLevel) {
                this.sendDegradationAlert(previousStage, this.currentStage);
            }
        }
    }

    degradeToEmergency() {
        const previousStage = this.currentStage;
        this.currentStage = 6;
        
        console.error(`🚨 DEGRADACIÓN CRÍTICA: Etapa ${previousStage} → 6 (EMERGENCIA)`);
        this.recordDegradation(6, { reason: 'Critical system failure', emergency: true });
        this.sendDegradationAlert(previousStage, 6);
    }

    recordDegradation(stage, details) {
        const degradationRecord = {
            timestamp: Date.now(),
            fromStage: this.degradationHistory.length > 0 ? 
                      this.degradationHistory[this.degradationHistory.length - 1].stage : 1,
            toStage: stage,
            details
        };
        
        this.degradationHistory.push(degradationRecord);
        
        // Mantener solo últimos 50 registros
        if (this.degradationHistory.length > 50) {
            this.degradationHistory = this.degradationHistory.slice(-50);
        }
        
        // Persistir
        this.persistDegradationHistory();
    }

    sendDegradationAlert(fromStage, toStage) {
        const alertKey = `degradation_${toStage}_${Date.now()}`;
        
        if (this.alertsSent.has(alertKey)) {
            return; // Ya enviada
        }
        
        const alert = {
            type: 'system_degradation',
            fromStage,
            toStage,
            timestamp: Date.now(),
            severity: toStage >= 5 ? 'critical' : toStage >= 3 ? 'high' : 'medium',
            message: `Sistema de precios degradado a etapa ${toStage}`
        };
        
        console.error('🚨 ALERTA DE DEGRADACIÓN:', alert);
        this.alertsSent.add(alertKey);
        
        // Limpiar alertas antiguas
        setTimeout(() => {
            this.alertsSent.delete(alertKey);
        }, 60 * 60 * 1000); // 1 hora
    }

    // ========================================================================
    // MONITOREO CONTINUO
    // ========================================================================

    setupContinuousMonitoring() {
        // Evaluar salud cada 5 minutos
        setInterval(async () => {
            await this.assessSystemHealth();
        }, 5 * 60 * 1000);
        
        // Limpiar cache de interpolación cada hora
        setInterval(() => {
            this.cleanupInterpolationCache();
        }, 60 * 60 * 1000);
    }

    cleanupInterpolationCache() {
        const now = Date.now();
        const ttl = 60 * 60 * 1000; // 1 hora
        
        for (const [key, entry] of this.interpolationCache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.interpolationCache.delete(key);
            }
        }
        
        console.log(`🧹 Cache limpiado. Entradas restantes: ${this.interpolationCache.size}`);
    }

    precacheCommonInterpolations() {
        // Pre-calcular interpolaciones para metales/purezas comunes
        const commonRequests = [
            { metal: 'gold', purity: '14k' },
            { metal: 'gold', purity: '18k' },
            { metal: 'silver', purity: '925' },
            { metal: 'platinum', purity: '950' }
        ];
        
        for (const request of commonRequests) {
            try {
                const historicalPoints = this.getHistoricalDataPoints(request.metal, request.purity);
                if (historicalPoints.length >= 2) {
                    const interpolated = this.performInterpolation(historicalPoints, {});
                    const cacheKey = `${request.metal}_${request.purity}`;
                    
                    this.interpolationCache.set(cacheKey, {
                        price: interpolated,
                        timestamp: Date.now(),
                        dataPoints: historicalPoints.length
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Error precaching ${request.metal} ${request.purity}:`, error.message);
            }
        }
    }

    // ========================================================================
    // DATOS HISTÓRICOS Y UTILIDADES
    // ========================================================================

    getHistoricalDataPoints(metal, purity) {
        const key = `${metal.toLowerCase()}_${purity}`;
        
        if (this.historicalData.has(key)) {
            return this.historicalData.get(key);
        }
        
        // Intentar reconstruir desde cache y localStorage
        const reconstructed = this.reconstructHistoricalData(metal, purity);
        this.historicalData.set(key, reconstructed);
        
        return reconstructed;
    }

    reconstructHistoricalData(metal, purity) {
        const dataPoints = [];
        
        try {
            // Datos del cache principal
            const metalCache = localStorage.getItem('metal_prices_cache');
            if (metalCache) {
                const cached = JSON.parse(metalCache);
                const metalData = cached[metal.toLowerCase()];
                
                if (metalData && metalData[purity] && metalData.timestamp) {
                    dataPoints.push({
                        timestamp: metalData.timestamp,
                        price: metalData[purity],
                        source: 'metal_cache'
                    });
                }
            }
            
            // Datos del validador
            const validatorCache = localStorage.getItem('pricing_validation_cache');
            if (validatorCache) {
                const cached = JSON.parse(validatorCache);
                const key = `${metal}_${purity}`;
                
                if (cached[key] && cached[key].averagePrice) {
                    dataPoints.push({
                        timestamp: cached[key].timestamp || Date.now(),
                        price: cached[key].averagePrice,
                        source: 'validator_cache'
                    });
                }
            }
            
            // Último precio conocido
            const lastKnownKey = `${metal}_${purity}`;
            if (this.lastKnownPrices.has(lastKnownKey)) {
                const lastKnown = this.lastKnownPrices.get(lastKnownKey);
                dataPoints.push({
                    timestamp: lastKnown.timestamp,
                    price: lastKnown.pricePerGram,
                    source: 'last_known'
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Error reconstruyendo datos históricos:', error.message);
        }
        
        // Eliminar duplicados y ordenar por timestamp
        const uniquePoints = dataPoints.filter((point, index, arr) => 
            arr.findIndex(p => Math.abs(p.timestamp - point.timestamp) < 60000) === index
        );
        
        return uniquePoints.sort((a, b) => a.timestamp - b.timestamp);
    }

    calculateUncertaintyFactor(dataPoints) {
        if (dataPoints.length < 2) return 0.3;
        
        // Calcular variabilidad de los datos
        const prices = dataPoints.map(p => p.price);
        const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;
        
        // Calcular freshness de los datos
        const newestTimestamp = Math.max(...dataPoints.map(p => p.timestamp));
        const dataAge = Date.now() - newestTimestamp;
        const ageHours = dataAge / (1000 * 60 * 60);
        
        // Factor de incertidumbre combinado
        let uncertainty = 0.9; // Base alta
        
        // Reducir por variabilidad (datos más estables = más certeza)
        uncertainty *= Math.max(0.5, 1 - coefficientOfVariation * 2);
        
        // Reducir por freshness (datos más frescos = más certeza)
        uncertainty *= Math.max(0.3, 1 - (ageHours / 24) * 0.1);
        
        // Reducir por cantidad de datos
        uncertainty *= Math.min(1, dataPoints.length / 5);
        
        return Math.max(0.1, Math.min(1, uncertainty));
    }

    getDataAge(cacheKey) {
        try {
            const data = localStorage.getItem(cacheKey);
            if (!data) return Infinity;
            
            const parsed = JSON.parse(data);
            const timestamp = parsed.timestamp || parsed.lastUpdate || 0;
            
            return Date.now() - timestamp;
        } catch (error) {
            return Infinity;
        }
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    hasBaselinePrices() {
        return FALLBACK_CONFIG.baselinePrices && 
               FALLBACK_CONFIG.baselinePrices.metals &&
               Object.keys(FALLBACK_CONFIG.baselinePrices.metals).length > 0;
    }

    // ========================================================================
    // PERSISTENCIA
    // ========================================================================

    loadStoredData() {
        try {
            // Cargar datos de degradación
            const degradationData = localStorage.getItem('fallback_degradation_history');
            if (degradationData) {
                this.degradationHistory = JSON.parse(degradationData);
            }
            
            // Cargar últimos precios conocidos
            const lastKnownData = localStorage.getItem('fallback_last_known_prices');
            if (lastKnownData) {
                const entries = JSON.parse(lastKnownData);
                this.lastKnownPrices = new Map(entries);
            }
            
            console.log('💾 Datos de fallback cargados');
            
        } catch (error) {
            console.warn('⚠️ Error cargando datos de fallback:', error.message);
        }
    }

    persistDegradationHistory() {
        try {
            localStorage.setItem('fallback_degradation_history', JSON.stringify(this.degradationHistory));
        } catch (error) {
            console.error('❌ Error persistiendo historial de degradación:', error);
        }
    }

    persistLastKnownPrices() {
        try {
            const entries = Array.from(this.lastKnownPrices.entries());
            localStorage.setItem('fallback_last_known_prices', JSON.stringify(entries));
        } catch (error) {
            console.error('❌ Error persistiendo últimos precios:', error);
        }
    }

    // ========================================================================
    // API PÚBLICA
    // ========================================================================

    async getMetalPrice(metal, purity, weight = 1, options = {}) {
        return await this.getPrice(metal, purity, weight, options);
    }

    getSystemStatus() {
        return {
            currentStage: this.currentStage,
            stageDescription: FALLBACK_CONFIG.degradation.stages[this.currentStage],
            degradationHistory: this.degradationHistory.slice(-5),
            lastKnownPricesCount: this.lastKnownPrices.size,
            historicalDataPointsCount: Array.from(this.historicalData.values()).reduce((sum, arr) => sum + arr.length, 0),
            interpolationCacheSize: this.interpolationCache.size
        };
    }

    async testSystemRecovery() {
        console.log('🔄 Probando recuperación del sistema...');
        
        const previousStage = this.currentStage;
        await this.assessSystemHealth();
        
        if (this.currentStage < previousStage) {
            console.log(`✅ Sistema recuperado: Etapa ${previousStage} → ${this.currentStage}`);
            return true;
        } else {
            console.log(`⚠️ Sin recuperación: Mantiene etapa ${this.currentStage}`);
            return false;
        }
    }

    clearAllData() {
        this.currentStage = 1;
        this.lastKnownPrices.clear();
        this.historicalData.clear();
        this.interpolationCache.clear();
        this.degradationHistory = [];
        this.alertsSent.clear();
        
        // Limpiar localStorage
        localStorage.removeItem('fallback_degradation_history');
        localStorage.removeItem('fallback_last_known_prices');
        
        console.log('🗑️ Datos de fallback completamente limpiados');
    }

    exportSystemData() {
        return {
            currentStage: this.currentStage,
            lastKnownPrices: Array.from(this.lastKnownPrices.entries()),
            historicalDataSummary: Array.from(this.historicalData.entries()).map(([key, data]) => ({
                key,
                dataPoints: data.length,
                newest: data.length > 0 ? Math.max(...data.map(p => p.timestamp)) : null,
                oldest: data.length > 0 ? Math.min(...data.map(p => p.timestamp)) : null
            })),
            degradationHistory: this.degradationHistory,
            exportTimestamp: Date.now()
        };
    }
}

// ========================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// ========================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.fallbackPriceCalculator = new FallbackPriceCalculator();
    
    // Funciones de conveniencia
    window.getFallbackPrice = async (metal, purity, weight = 1, options = {}) => {
        return await window.fallbackPriceCalculator.getPrice(metal, purity, weight, options);
    };
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FallbackPriceCalculator,
        FALLBACK_CONFIG
    };
}

console.log('✅ Sistema de Precios de Emergencia v1.0 cargado correctamente');
console.log('🛡️ Acceso: window.fallbackPriceCalculator');
console.log('⚡ Función rápida: window.getFallbackPrice(metal, purity, weight)');
console.log('📊 Estado: window.fallbackPriceCalculator.getSystemStatus()');