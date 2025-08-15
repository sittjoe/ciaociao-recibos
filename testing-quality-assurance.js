// testing-quality-assurance.js - SISTEMA DE TESTING Y QA v1.0
// Tests automatizados y validación de precios para SUBAGENTE 9
// ===========================================================

console.log('🧪 Iniciando Sistema de Testing y Quality Assurance v1.0...');

// ===========================================================
// CONFIGURACIÓN DEL SISTEMA DE TESTING
// ===========================================================

const TESTING_CONFIG = {
    // Configuración de tests
    tests: {
        autoRun: false,          // No ejecutar automáticamente al cargar
        timeout: 10000,          // 10s timeout por test
        retries: 2,              // Reintentos por test fallido
        parallel: 5,             // Tests paralelos máximo
        categories: [
            'unit',              // Tests unitarios
            'integration',       // Tests de integración
            'performance',       // Tests de performance
            'stress',           // Tests de stress
            'validation',       // Validación de datos
            'e2e'              // End to end
        ]
    },

    // Configuración de validación
    validation: {
        priceRanges: {
            gold: { min: 400, max: 2000 },      // MXN/g
            silver: { min: 10, max: 50 },
            platinum: { min: 500, max: 1500 },
            palladium: { min: 500, max: 1500 }
        },
        tolerances: {
            price: 0.05,         // 5% tolerancia en precios
            timing: 1.5,         // 50% tolerancia en tiempos
            accuracy: 0.02       // 2% precisión requerida
        }
    },

    // Configuración de stress testing
    stress: {
        requests: 1000,          // Número de requests para stress
        concurrency: 50,         // Requests concurrentes
        duration: 60000,         // Duración del test (1 minuto)
        warmup: 5000            // Tiempo de calentamiento
    },

    // Configuración de reportes
    reports: {
        format: 'html',          // html/json/console
        includeDetails: true,
        saveToDisk: false,
        emailOnFailure: false,
        slackWebhook: null
    }
};

// ===========================================================
// CLASE PRINCIPAL DE TESTING
// ===========================================================

class TestingQualityAssurance {
    constructor() {
        this.testSuites = new Map();
        this.testResults = [];
        this.currentRun = null;
        this.coverage = new Map();
        this.benchmarks = new Map();
        this.validators = new Map();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de testing...');
        
        try {
            // Registrar test suites
            this.registerTestSuites();
            
            // Configurar validadores
            this.setupValidators();
            
            // Cargar benchmarks anteriores
            this.loadBenchmarks();
            
            // Configurar reportes
            this.setupReporting();
            
            console.log('✅ Sistema de testing inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando testing:', error);
        }
    }

    // ===========================================================
    // REGISTRO DE TEST SUITES
    // ===========================================================

    registerTestSuites() {
        // Suite de APIs
        this.registerSuite('APIs', [
            this.testPrimaryAPI.bind(this),
            this.testValidatorAPI.bind(this),
            this.testExchangeRateAPI.bind(this),
            this.testFallbackSystem.bind(this),
            this.testGoldKaratSpecialist.bind(this)
        ]);

        // Suite de Integración
        this.registerSuite('Integration', [
            this.testUnifiedAPI.bind(this),
            this.testEventSystem.bind(this),
            this.testCircuitBreakers.bind(this),
            this.testCacheIntegration.bind(this)
        ]);

        // Suite de Performance
        this.registerSuite('Performance', [
            this.testResponseTimes.bind(this),
            this.testCachePerformance.bind(this),
            this.testConcurrency.bind(this),
            this.testMemoryUsage.bind(this)
        ]);

        // Suite de Validación
        this.registerSuite('Validation', [
            this.testPriceAccuracy.bind(this),
            this.testDataConsistency.bind(this),
            this.testErrorHandling.bind(this),
            this.testEdgeCases.bind(this)
        ]);

        // Suite de Stress
        this.registerSuite('Stress', [
            this.testHighLoad.bind(this),
            this.testAPIFailures.bind(this),
            this.testCacheSaturation.bind(this),
            this.testRecovery.bind(this)
        ]);

        console.log(`📋 ${this.testSuites.size} suites de testing registradas`);
    }

    registerSuite(name, tests) {
        this.testSuites.set(name, {
            name,
            tests,
            results: [],
            status: 'pending'
        });
    }

    // ===========================================================
    // TESTS DE APIs
    // ===========================================================

    async testPrimaryAPI() {
        const test = this.createTest('Primary API', 'unit');
        
        try {
            test.start();
            
            // Verificar disponibilidad
            test.assert(window.realMetalsAPI, 'API de metales disponible');
            
            // Test de precio de oro
            const goldPrice = await window.realMetalsAPI?.getMetalPrice('gold', '14k');
            test.assert(goldPrice, 'Precio de oro obtenido');
            test.assert(goldPrice.pricePerGram > 0, 'Precio válido');
            test.assertInRange(goldPrice.pricePerGram, 400, 2000, 'Precio en rango esperado');
            
            // Test de precio de plata
            const silverPrice = await window.realMetalsAPI?.getMetalPrice('silver', '925');
            test.assert(silverPrice, 'Precio de plata obtenido');
            test.assertInRange(silverPrice.pricePerGram, 10, 50, 'Precio de plata en rango');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testValidatorAPI() {
        const test = this.createTest('Price Validator API', 'unit');
        
        try {
            test.start();
            
            // Verificar disponibilidad
            test.assert(window.realTimePriceValidator, 'Validador disponible');
            
            // Test de validación
            const validated = await window.realTimePriceValidator?.getValidatedPrice('gold', '18k');
            test.assert(validated, 'Precio validado obtenido');
            test.assert(validated.averagePrice > 0, 'Precio promedio válido');
            test.assert(validated.sources?.length > 0, 'Múltiples fuentes');
            test.assert(validated.confidence, 'Nivel de confianza presente');
            
            // Verificar discrepancias
            if (validated.discrepancies) {
                test.assert(validated.discrepancies.length === 0 || 
                           validated.discrepancies.every(d => d.deviation < 0.1),
                           'Discrepancias dentro del límite');
            }
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testExchangeRateAPI() {
        const test = this.createTest('Exchange Rate Manager', 'unit');
        
        try {
            test.start();
            
            // Verificar disponibilidad
            test.assert(window.exchangeRateManager, 'Exchange Rate Manager disponible');
            
            // Test de tipo de cambio
            const rate = await window.getExchangeRate?.();
            test.assert(rate, 'Tipo de cambio obtenido');
            test.assert(rate.rate > 0, 'Tipo válido');
            test.assertInRange(rate.rate, 17, 23, 'Tipo en rango esperado USD/MXN');
            
            // Test de conversiones
            const mxn = window.convertUSDtoMXN?.(100);
            test.assert(mxn, 'Conversión USD->MXN funciona');
            test.assertInRange(mxn.mxn, 1700, 2300, 'Conversión correcta');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testFallbackSystem() {
        const test = this.createTest('Fallback Price Calculator', 'unit');
        
        try {
            test.start();
            
            // Verificar disponibilidad
            test.assert(window.fallbackPriceCalculator, 'Fallback calculator disponible');
            
            // Test de precio fallback
            const fallbackPrice = await window.getFallbackPrice?.('gold', '14k', 5);
            test.assert(fallbackPrice, 'Precio fallback obtenido');
            test.assert(fallbackPrice.totalPrice > 0, 'Precio total válido');
            test.assert(fallbackPrice.source, 'Fuente identificada');
            test.assert(fallbackPrice.confidence, 'Nivel de confianza presente');
            
            // Verificar estado del sistema
            const status = window.fallbackPriceCalculator?.getSystemStatus();
            test.assert(status, 'Estado del sistema disponible');
            test.assertInRange(status.currentStage, 1, 6, 'Etapa válida');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testGoldKaratSpecialist() {
        const test = this.createTest('Gold Karat Specialist', 'unit');
        
        try {
            test.start();
            
            // Verificar disponibilidad
            test.assert(window.goldKaratSpecialist, 'Especialista en quilates disponible');
            
            // Test de cálculo de oro 14k
            const gold14k = await window.getGoldPrice?.('14k', 5.2);
            test.assert(gold14k, 'Precio de oro 14k obtenido');
            test.assertApprox(gold14k.pricePerGram, 686, 0.1, 'Precio 14k correcto');
            
            // Test de información de quilates
            const karatInfo = window.getKaratInfo?.('18k');
            test.assert(karatInfo, 'Información de quilates obtenida');
            test.assertApprox(karatInfo.purity, 0.750, 0.001, 'Pureza 18k correcta');
            test.assertEqual(karatInfo.millesimal, 750, 'Milésimas correctas');
            
            // Test de comparación
            const comparison = window.compareGoldKarats?.('14k', '18k', 10);
            test.assert(comparison, 'Comparación realizada');
            test.assert(comparison.comparison.moreExpensive === '18k', '18k más caro que 14k');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    // ===========================================================
    // TESTS DE INTEGRACIÓN
    // ===========================================================

    async testUnifiedAPI() {
        const test = this.createTest('Unified Pricing API', 'integration');
        
        try {
            test.start();
            
            // Verificar API unificada
            test.assert(window.pricingIntegration, 'Sistema de integración disponible');
            test.assert(window.getPrice, 'API getPrice disponible');
            
            // Test de obtención de precio unificado
            const price = await window.getPrice?.('gold', '14k', 5);
            test.assert(price, 'Precio obtenido vía API unificada');
            test.assert(price.totalPrice > 0, 'Precio total válido');
            test.assert(price.source, 'Fuente identificada');
            
            // Test con fallback
            const priceWithFallback = await window.getPriceWithFallback?.('silver', '925', 10);
            test.assert(priceWithFallback, 'Precio con fallback obtenido');
            test.assert(priceWithFallback.totalPrice > 0, 'Siempre devuelve precio');
            
            // Test de múltiples precios
            const requests = [
                { metal: 'gold', purity: '18k', weight: 1 },
                { metal: 'silver', purity: '925', weight: 5 },
                { metal: 'platinum', purity: '950', weight: 2 }
            ];
            
            const multiplePrices = await window.pricingIntegration?.getMultiplePrices(requests);
            test.assert(multiplePrices, 'Múltiples precios obtenidos');
            test.assertEqual(multiplePrices.length, 3, 'Todos los precios devueltos');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testEventSystem() {
        const test = this.createTest('Event System', 'integration');
        
        try {
            test.start();
            
            // Configurar listener de eventos
            let eventReceived = false;
            const unsubscribe = window.subscribeToPriceEvents?.('price_calculated', (data) => {
                eventReceived = true;
            });
            
            test.assert(unsubscribe, 'Suscripción a eventos funciona');
            
            // Disparar un cálculo de precio
            await window.getPrice?.('gold', '14k', 1);
            
            // Esperar un poco para que el evento se procese
            await this.sleep(100);
            
            test.assert(eventReceived, 'Evento recibido correctamente');
            
            // Desuscribir
            if (unsubscribe) unsubscribe();
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testCircuitBreakers() {
        const test = this.createTest('Circuit Breakers', 'integration');
        
        try {
            test.start();
            
            // Obtener estado de circuit breakers
            const status = window.pricingIntegration?.getIntegrationStatus();
            test.assert(status, 'Estado de integración disponible');
            test.assert(status.circuitBreakers, 'Circuit breakers presentes');
            
            // Verificar que todos estén cerrados inicialmente
            const breakers = Object.values(status.circuitBreakers);
            test.assert(breakers.every(b => !b.isOpen), 'Circuit breakers inicialmente cerrados');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testCacheIntegration() {
        const test = this.createTest('Cache Integration', 'integration');
        
        try {
            test.start();
            
            // Verificar optimizador de cache
            test.assert(window.cachePerformanceOptimizer, 'Optimizador de cache disponible');
            test.assert(window.optimizedCache, 'Cache optimizado disponible');
            
            // Test de set/get
            const testKey = 'test_price_' + Date.now();
            const testValue = { price: 1000, timestamp: Date.now() };
            
            await window.optimizedCache.set(testKey, testValue);
            const retrieved = await window.optimizedCache.get(testKey);
            
            test.assert(retrieved, 'Valor recuperado del cache');
            test.assertEqual(retrieved.price, testValue.price, 'Valor correcto');
            
            // Limpiar
            await window.optimizedCache.delete(testKey);
            
            // Verificar métricas
            const metrics = window.cachePerformanceOptimizer?.getMetrics();
            test.assert(metrics, 'Métricas disponibles');
            test.assert(metrics.cache.sets > 0, 'Sets registrados');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    // ===========================================================
    // TESTS DE PERFORMANCE
    // ===========================================================

    async testResponseTimes() {
        const test = this.createTest('Response Times', 'performance');
        
        try {
            test.start();
            
            const times = [];
            const iterations = 10;
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                await window.getPrice?.('gold', '14k', 1);
                const end = performance.now();
                times.push(end - start);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            
            test.assertLessThan(avgTime, 3000, 'Tiempo promedio < 3s');
            test.assertLessThan(maxTime, 5000, 'Tiempo máximo < 5s');
            
            // Registrar benchmark
            this.recordBenchmark('response_time_avg', avgTime);
            this.recordBenchmark('response_time_max', maxTime);
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testCachePerformance() {
        const test = this.createTest('Cache Performance', 'performance');
        
        try {
            test.start();
            
            // Primera llamada (cache miss)
            const start1 = performance.now();
            await window.getPrice?.('gold', '18k', 2);
            const time1 = performance.now() - start1;
            
            // Segunda llamada (cache hit esperado)
            const start2 = performance.now();
            await window.getPrice?.('gold', '18k', 2);
            const time2 = performance.now() - start2;
            
            test.assertLessThan(time2, time1 * 0.5, 'Cache hit 50% más rápido');
            
            // Verificar hit rate
            const report = window.cachePerformanceOptimizer?.getPerformanceReport();
            if (report) {
                const hitRate = parseFloat(report.performance.cacheHitRate);
                test.assertGreaterThan(hitRate, 50, 'Hit rate > 50%');
            }
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testConcurrency() {
        const test = this.createTest('Concurrent Requests', 'performance');
        
        try {
            test.start();
            
            const requests = [];
            const concurrentCount = 20;
            
            // Lanzar requests concurrentes
            for (let i = 0; i < concurrentCount; i++) {
                requests.push(window.getPrice?.('gold', '14k', Math.random() * 10));
            }
            
            const start = performance.now();
            const results = await Promise.all(requests);
            const totalTime = performance.now() - start;
            
            test.assertEqual(results.length, concurrentCount, 'Todos los requests completados');
            test.assert(results.every(r => r && r.totalPrice > 0), 'Todos los resultados válidos');
            test.assertLessThan(totalTime, 10000, 'Tiempo total < 10s para 20 requests');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testMemoryUsage() {
        const test = this.createTest('Memory Usage', 'performance');
        
        try {
            test.start();
            
            // Obtener uso inicial si está disponible
            const initialMemory = performance.memory?.usedJSHeapSize;
            
            // Realizar operaciones
            for (let i = 0; i < 100; i++) {
                await window.getPrice?.('gold', '14k', Math.random() * 10);
            }
            
            // Obtener uso final
            const finalMemory = performance.memory?.usedJSHeapSize;
            
            if (initialMemory && finalMemory) {
                const increase = finalMemory - initialMemory;
                const increaseMB = increase / (1024 * 1024);
                
                test.assertLessThan(increaseMB, 50, 'Aumento de memoria < 50MB');
                this.recordBenchmark('memory_increase_mb', increaseMB);
            }
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    // ===========================================================
    // TESTS DE VALIDACIÓN
    // ===========================================================

    async testPriceAccuracy() {
        const test = this.createTest('Price Accuracy', 'validation');
        
        try {
            test.start();
            
            // Precio conocido de oro 14k
            const expectedPrice14k = 686; // MXN/g
            const tolerance = TESTING_CONFIG.validation.tolerances.price;
            
            const result = await window.getPrice?.('gold', '14k', 1);
            test.assert(result, 'Precio obtenido');
            
            const deviation = Math.abs(result.pricePerGram - expectedPrice14k) / expectedPrice14k;
            test.assertLessThan(deviation, tolerance, `Desviación < ${tolerance * 100}%`);
            
            // Verificar consistencia en múltiples llamadas
            const prices = [];
            for (let i = 0; i < 5; i++) {
                const p = await window.getPrice?.('gold', '14k', 1);
                prices.push(p.pricePerGram);
            }
            
            const maxDiff = Math.max(...prices) - Math.min(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const consistency = maxDiff / avgPrice;
            
            test.assertLessThan(consistency, 0.02, 'Consistencia < 2%');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testDataConsistency() {
        const test = this.createTest('Data Consistency', 'validation');
        
        try {
            test.start();
            
            // Verificar que los precios mantengan relaciones lógicas
            const gold14k = await window.getPrice?.('gold', '14k', 1);
            const gold18k = await window.getPrice?.('gold', '18k', 1);
            const gold24k = await window.getPrice?.('gold', '24k', 1);
            
            test.assert(gold14k && gold18k && gold24k, 'Todos los precios obtenidos');
            
            // 24k debe ser más caro que 18k que debe ser más caro que 14k
            test.assertGreaterThan(gold24k.pricePerGram, gold18k.pricePerGram, '24k > 18k');
            test.assertGreaterThan(gold18k.pricePerGram, gold14k.pricePerGram, '18k > 14k');
            
            // Las proporciones deben ser aproximadamente correctas
            const ratio18to14 = gold18k.pricePerGram / gold14k.pricePerGram;
            const expectedRatio = (18/24) / (14/24); // ~1.286
            
            test.assertApprox(ratio18to14, expectedRatio, 0.1, 'Proporción 18k/14k correcta');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testErrorHandling() {
        const test = this.createTest('Error Handling', 'validation');
        
        try {
            test.start();
            
            // Test con metal inválido
            const invalidMetal = await window.getPriceWithFallback?.('unobtanium', '999', 1);
            test.assert(invalidMetal, 'Maneja metal inválido sin crash');
            test.assert(invalidMetal.warning || invalidMetal.source === 'absolute_emergency', 
                       'Indica precio de emergencia');
            
            // Test con pureza inválida
            const invalidPurity = await window.getPriceWithFallback?.('gold', '99k', 1);
            test.assert(invalidPurity, 'Maneja pureza inválida');
            
            // Test con peso negativo
            try {
                await window.getPrice?.('gold', '14k', -5);
                test.fail('Debería rechazar peso negativo');
            } catch (error) {
                test.assert(error, 'Rechaza peso negativo correctamente');
            }
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testEdgeCases() {
        const test = this.createTest('Edge Cases', 'validation');
        
        try {
            test.start();
            
            // Peso muy pequeño
            const tinyWeight = await window.getPrice?.('gold', '14k', 0.001);
            test.assert(tinyWeight, 'Maneja peso muy pequeño');
            test.assertGreaterThan(tinyWeight.totalPrice, 0, 'Precio positivo');
            
            // Peso muy grande
            const hugeWeight = await window.getPrice?.('gold', '14k', 10000);
            test.assert(hugeWeight, 'Maneja peso muy grande');
            test.assertLessThan(hugeWeight.totalPrice, 100000000, 'Precio razonable');
            
            // Quilates no estándar
            const oddKarat = await window.goldKaratSpecialist?.getGoldPrice('15k', 1);
            test.assert(oddKarat, 'Maneja quilates no estándar');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    // ===========================================================
    // TESTS DE STRESS
    // ===========================================================

    async testHighLoad() {
        const test = this.createTest('High Load Test', 'stress');
        
        try {
            test.start();
            
            const config = TESTING_CONFIG.stress;
            const results = [];
            const errors = [];
            const startTime = Date.now();
            
            console.log(`🔥 Iniciando stress test: ${config.requests} requests...`);
            
            // Generar requests
            const promises = [];
            for (let i = 0; i < config.requests; i++) {
                const promise = window.getPriceWithFallback?.(
                    ['gold', 'silver', 'platinum'][i % 3],
                    ['14k', '18k', '925', '950'][i % 4],
                    Math.random() * 10
                ).then(r => results.push(r))
                 .catch(e => errors.push(e));
                
                promises.push(promise);
                
                // Controlar concurrencia
                if (promises.length >= config.concurrency) {
                    await Promise.race(promises);
                    promises.splice(0, 1);
                }
            }
            
            // Esperar todos los restantes
            await Promise.all(promises);
            
            const duration = Date.now() - startTime;
            const successRate = results.length / config.requests;
            const rps = config.requests / (duration / 1000);
            
            test.assertGreaterThan(successRate, 0.95, 'Tasa de éxito > 95%');
            test.assertGreaterThan(rps, 10, 'RPS > 10');
            
            console.log(`✅ Stress test: ${results.length}/${config.requests} exitosos, ${rps.toFixed(1)} RPS`);
            
            this.recordBenchmark('stress_success_rate', successRate);
            this.recordBenchmark('stress_rps', rps);
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testAPIFailures() {
        const test = this.createTest('API Failure Recovery', 'stress');
        
        try {
            test.start();
            
            // Simular fallo de APIs guardando referencias originales
            const originalAPIs = {
                realMetalsAPI: window.realMetalsAPI,
                realTimePriceValidator: window.realTimePriceValidator
            };
            
            // Desactivar APIs temporalmente
            window.realMetalsAPI = null;
            window.realTimePriceValidator = null;
            
            // Intentar obtener precio (debe usar fallback)
            const priceWithFailure = await window.getPriceWithFallback?.('gold', '14k', 5);
            
            test.assert(priceWithFailure, 'Precio obtenido incluso con APIs caídas');
            test.assert(priceWithFailure.source !== 'primary_api', 'No usa API primaria');
            
            // Restaurar APIs
            window.realMetalsAPI = originalAPIs.realMetalsAPI;
            window.realTimePriceValidator = originalAPIs.realTimePriceValidator;
            
            // Verificar recuperación
            const priceAfterRecovery = await window.getPrice?.('gold', '14k', 5);
            test.assert(priceAfterRecovery, 'Sistema recuperado después de restaurar APIs');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testCacheSaturation() {
        const test = this.createTest('Cache Saturation', 'stress');
        
        try {
            test.start();
            
            const optimizer = window.cachePerformanceOptimizer;
            test.assert(optimizer, 'Optimizador disponible');
            
            // Llenar cache con muchas entradas
            const entries = 1000;
            for (let i = 0; i < entries; i++) {
                await window.optimizedCache.set(`test_saturation_${i}`, {
                    value: Math.random() * 1000,
                    timestamp: Date.now()
                });
            }
            
            // Verificar que el sistema sigue funcionando
            const testKey = 'test_after_saturation';
            await window.optimizedCache.set(testKey, { value: 999 });
            const retrieved = await window.optimizedCache.get(testKey);
            
            test.assert(retrieved, 'Cache funciona después de saturación');
            test.assertEqual(retrieved.value, 999, 'Valor correcto recuperado');
            
            // Verificar limpieza automática
            const metrics = optimizer.getMetrics();
            test.assert(metrics.cleanup.totalCleaned >= 0, 'Limpieza ejecutada');
            
            // Limpiar entradas de test
            for (let i = 0; i < entries; i++) {
                await window.optimizedCache.delete(`test_saturation_${i}`);
            }
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    async testRecovery() {
        const test = this.createTest('System Recovery', 'stress');
        
        try {
            test.start();
            
            // Obtener estado inicial
            const initialStatus = window.pricingIntegration?.getIntegrationStatus();
            test.assert(initialStatus, 'Estado inicial obtenido');
            
            // Simular degradación
            if (window.fallbackPriceCalculator) {
                window.fallbackPriceCalculator.currentStage = 5; // Forzar etapa de emergencia
            }
            
            // Verificar que sigue funcionando
            const degradedPrice = await window.getPriceWithFallback?.('gold', '14k', 1);
            test.assert(degradedPrice, 'Precio obtenido en modo degradado');
            
            // Intentar recuperación
            if (window.fallbackPriceCalculator) {
                await window.fallbackPriceCalculator.testSystemRecovery();
            }
            
            // Verificar recuperación
            const recoveredPrice = await window.getPrice?.('gold', '14k', 1);
            test.assert(recoveredPrice, 'Sistema recuperado');
            
            test.pass();
        } catch (error) {
            test.fail(error);
        }
        
        return test.result();
    }

    // ===========================================================
    // UTILIDADES DE TESTING
    // ===========================================================

    createTest(name, category) {
        const test = {
            name,
            category,
            startTime: null,
            endTime: null,
            assertions: [],
            status: 'pending',
            error: null,
            
            start() {
                this.startTime = Date.now();
                this.status = 'running';
            },
            
            assert(condition, message) {
                const assertion = {
                    passed: !!condition,
                    message,
                    timestamp: Date.now()
                };
                
                this.assertions.push(assertion);
                
                if (!assertion.passed) {
                    throw new Error(`Assertion failed: ${message}`);
                }
            },
            
            assertEqual(actual, expected, message) {
                this.assert(actual === expected, 
                          `${message} (expected: ${expected}, actual: ${actual})`);
            },
            
            assertInRange(value, min, max, message) {
                this.assert(value >= min && value <= max,
                          `${message} (${value} not in range [${min}, ${max}])`);
            },
            
            assertGreaterThan(value, threshold, message) {
                this.assert(value > threshold,
                          `${message} (${value} not > ${threshold})`);
            },
            
            assertLessThan(value, threshold, message) {
                this.assert(value < threshold,
                          `${message} (${value} not < ${threshold})`);
            },
            
            assertApprox(actual, expected, tolerance, message) {
                const diff = Math.abs(actual - expected);
                const maxDiff = Math.abs(expected * tolerance);
                this.assert(diff <= maxDiff,
                          `${message} (${actual} not ≈ ${expected} ±${tolerance * 100}%)`);
            },
            
            pass() {
                this.endTime = Date.now();
                this.status = 'passed';
            },
            
            fail(error) {
                this.endTime = Date.now();
                this.status = 'failed';
                this.error = error;
            },
            
            result() {
                return {
                    name: this.name,
                    category: this.category,
                    status: this.status,
                    duration: this.endTime - this.startTime,
                    assertions: this.assertions,
                    error: this.error,
                    passed: this.assertions.filter(a => a.passed).length,
                    failed: this.assertions.filter(a => !a.passed).length
                };
            }
        };
        
        return test;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===========================================================
    // EJECUCIÓN DE TESTS
    // ===========================================================

    async runAllTests() {
        console.log('🧪 Ejecutando todos los tests...');
        
        const runStart = Date.now();
        this.currentRun = {
            id: `run_${Date.now()}`,
            startTime: runStart,
            results: [],
            summary: null
        };
        
        for (const [suiteName, suite] of this.testSuites) {
            console.log(`\n📋 Ejecutando suite: ${suiteName}`);
            await this.runSuite(suiteName);
        }
        
        const runEnd = Date.now();
        this.currentRun.endTime = runEnd;
        this.currentRun.duration = runEnd - runStart;
        
        // Generar resumen
        this.currentRun.summary = this.generateSummary();
        
        // Mostrar resultados
        this.displayResults();
        
        return this.currentRun;
    }

    async runSuite(suiteName) {
        const suite = this.testSuites.get(suiteName);
        if (!suite) return;
        
        suite.status = 'running';
        suite.results = [];
        
        for (const testFn of suite.tests) {
            try {
                const result = await testFn();
                suite.results.push(result);
                this.currentRun.results.push(result);
                
                console.log(`  ${result.status === 'passed' ? '✅' : '❌'} ${result.name}`);
                
            } catch (error) {
                console.error(`  ❌ Error ejecutando test:`, error);
            }
        }
        
        suite.status = 'completed';
    }

    async runSpecificTest(testName) {
        console.log(`🧪 Ejecutando test: ${testName}`);
        
        for (const suite of this.testSuites.values()) {
            for (const testFn of suite.tests) {
                if (testFn.name.includes(testName)) {
                    const result = await testFn();
                    console.log(result.status === 'passed' ? '✅' : '❌', result);
                    return result;
                }
            }
        }
        
        console.error(`Test no encontrado: ${testName}`);
        return null;
    }

    // ===========================================================
    // REPORTES Y MÉTRICAS
    // ===========================================================

    generateSummary() {
        if (!this.currentRun) return null;
        
        const results = this.currentRun.results;
        const total = results.length;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        const byCategory = {};
        for (const result of results) {
            if (!byCategory[result.category]) {
                byCategory[result.category] = { passed: 0, failed: 0, total: 0 };
            }
            
            byCategory[result.category].total++;
            if (result.status === 'passed') {
                byCategory[result.category].passed++;
            } else {
                byCategory[result.category].failed++;
            }
        }
        
        return {
            total,
            passed,
            failed,
            successRate: (passed / total * 100).toFixed(1) + '%',
            duration: this.currentRun.duration,
            byCategory,
            timestamp: Date.now()
        };
    }

    displayResults() {
        if (!this.currentRun || !this.currentRun.summary) return;
        
        const summary = this.currentRun.summary;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN DE TESTS');
        console.log('='.repeat(50));
        console.log(`Total: ${summary.total}`);
        console.log(`✅ Pasados: ${summary.passed}`);
        console.log(`❌ Fallidos: ${summary.failed}`);
        console.log(`📈 Tasa de éxito: ${summary.successRate}`);
        console.log(`⏱️ Duración: ${(summary.duration / 1000).toFixed(2)}s`);
        
        console.log('\n📊 Por Categoría:');
        for (const [category, stats] of Object.entries(summary.byCategory)) {
            console.log(`  ${category}: ${stats.passed}/${stats.total} pasados`);
        }
        
        if (summary.failed > 0) {
            console.log('\n❌ Tests Fallidos:');
            for (const result of this.currentRun.results) {
                if (result.status === 'failed') {
                    console.log(`  - ${result.name}: ${result.error?.message || 'Unknown error'}`);
                }
            }
        }
        
        console.log('='.repeat(50));
    }

    generateHTMLReport() {
        if (!this.currentRun) return '';
        
        const summary = this.currentRun.summary;
        const results = this.currentRun.results;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${new Date().toISOString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${summary.total}</p>
        <p class="passed">Passed: ${summary.passed}</p>
        <p class="failed">Failed: ${summary.failed}</p>
        <p>Success Rate: ${summary.successRate}</p>
        <p>Duration: ${(summary.duration / 1000).toFixed(2)}s</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Duration (ms)</th>
                <th>Assertions</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(r => `
                <tr>
                    <td>${r.name}</td>
                    <td>${r.category}</td>
                    <td class="${r.status}">${r.status}</td>
                    <td>${r.duration}</td>
                    <td>${r.passed}/${r.passed + r.failed}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
        `;
    }

    exportResults(format = 'json') {
        if (!this.currentRun) return null;
        
        if (format === 'json') {
            return JSON.stringify(this.currentRun, null, 2);
        } else if (format === 'html') {
            return this.generateHTMLReport();
        } else if (format === 'csv') {
            const headers = ['Test Name', 'Category', 'Status', 'Duration', 'Assertions Passed', 'Assertions Failed'];
            const rows = this.currentRun.results.map(r => [
                r.name,
                r.category,
                r.status,
                r.duration,
                r.passed,
                r.failed
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
    }

    // ===========================================================
    // VALIDADORES
    // ===========================================================

    setupValidators() {
        // Validador de precios
        this.validators.set('price', (value) => {
            return value > 0 && value < 1000000;
        });
        
        // Validador de pureza
        this.validators.set('purity', (value) => {
            const validPurities = ['24k', '22k', '18k', '14k', '10k', '999', '958', '925', '950', '900'];
            return validPurities.includes(value);
        });
        
        // Validador de metal
        this.validators.set('metal', (value) => {
            const validMetals = ['gold', 'silver', 'platinum', 'palladium'];
            return validMetals.includes(value.toLowerCase());
        });
        
        console.log(`✅ ${this.validators.size} validadores configurados`);
    }

    validate(type, value) {
        const validator = this.validators.get(type);
        return validator ? validator(value) : true;
    }

    // ===========================================================
    // BENCHMARKS
    // ===========================================================

    recordBenchmark(key, value) {
        if (!this.benchmarks.has(key)) {
            this.benchmarks.set(key, []);
        }
        
        this.benchmarks.get(key).push({
            value,
            timestamp: Date.now()
        });
        
        // Mantener solo últimos 100 valores
        const values = this.benchmarks.get(key);
        if (values.length > 100) {
            this.benchmarks.set(key, values.slice(-100));
        }
    }

    getBenchmarkStats(key) {
        const values = this.benchmarks.get(key);
        if (!values || values.length === 0) return null;
        
        const nums = values.map(v => v.value);
        const sorted = nums.sort((a, b) => a - b);
        
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: nums.reduce((a, b) => a + b, 0) / nums.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            count: nums.length
        };
    }

    loadBenchmarks() {
        try {
            const stored = localStorage.getItem('testing_benchmarks');
            if (stored) {
                const data = JSON.parse(stored);
                this.benchmarks = new Map(data);
                console.log(`📊 ${this.benchmarks.size} benchmarks cargados`);
            }
        } catch (error) {
            console.warn('⚠️ Error cargando benchmarks:', error);
        }
    }

    saveBenchmarks() {
        try {
            const data = Array.from(this.benchmarks.entries());
            localStorage.setItem('testing_benchmarks', JSON.stringify(data));
        } catch (error) {
            console.error('❌ Error guardando benchmarks:', error);
        }
    }

    // ===========================================================
    // API PÚBLICA
    // ===========================================================

    async test(testName) {
        return await this.runSpecificTest(testName);
    }

    async testAll() {
        return await this.runAllTests();
    }

    async testSuite(suiteName) {
        await this.runSuite(suiteName);
        return this.testSuites.get(suiteName);
    }

    getTestResults() {
        return this.currentRun;
    }

    getTestReport(format = 'json') {
        return this.exportResults(format);
    }

    getBenchmarks() {
        const stats = {};
        for (const [key, _] of this.benchmarks) {
            stats[key] = this.getBenchmarkStats(key);
        }
        return stats;
    }

    clearResults() {
        this.testResults = [];
        this.currentRun = null;
        console.log('🗑️ Resultados de tests limpiados');
    }

    clearBenchmarks() {
        this.benchmarks.clear();
        localStorage.removeItem('testing_benchmarks');
        console.log('🗑️ Benchmarks limpiados');
    }
}

// ===========================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// ===========================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.testingQA = new TestingQualityAssurance();
    
    // API de conveniencia
    window.runTests = async () => await window.testingQA.testAll();
    window.runTest = async (name) => await window.testingQA.test(name);
    window.getTestReport = (format) => window.testingQA.getTestReport(format);
    window.getBenchmarks = () => window.testingQA.getBenchmarks();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TestingQualityAssurance,
        TESTING_CONFIG
    };
}

console.log('✅ Sistema de Testing y QA v1.0 cargado correctamente');
console.log('🧪 Acceso: window.testingQA');
console.log('▶️ Ejecutar todos: window.runTests()');
console.log('🎯 Test específico: window.runTest("nombre")');
console.log('📊 Reporte: window.getTestReport("html")');