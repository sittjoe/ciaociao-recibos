// real-time-price-validator.js - SISTEMA DE VALIDACIÓN DE PRECIOS EN TIEMPO REAL v1.0
// Validación cruzada, alertas inteligentes y sistema de confianza
// =================================================================

console.log('🛡️ Iniciando Sistema de Validación de Precios v1.0...');

// =================================================================
// CONFIGURACIÓN DE VALIDACIÓN Y REFERENCIAS
// =================================================================

const VALIDATION_CONFIG = {
    // Precios de referencia VERIFICADOS agosto 2025
    reference_prices: {
        'XAU': {
            name: 'Oro',
            karats: {
                '24k': { mxn_per_gram: 1710, tolerance: 0.05 }, // ±5%
                '22k': { mxn_per_gram: 1567, tolerance: 0.05 },
                '18k': { mxn_per_gram: 1283, tolerance: 0.05 },
                '14k': { mxn_per_gram: 1172, tolerance: 0.05 }, // VERIFICADO
                '10k': { mxn_per_gram: 712, tolerance: 0.05 }
            },
            extreme_range: { min: 500, max: 3000 } // Detección de errores graves
        },
        'XAG': {
            name: 'Plata',
            mxn_per_gram: 23, // VERIFICADO
            tolerance: 0.08, // ±8% (más volátil)
            extreme_range: { min: 5, max: 80 }
        },
        'XPT': {
            name: 'Platino',
            mxn_per_gram: 654, // VERIFICADO
            tolerance: 0.06, // ±6%
            extreme_range: { min: 300, max: 1500 }
        },
        'XPD': {
            name: 'Paladio',
            mxn_per_gram: 672, // VERIFICADO
            tolerance: 0.10, // ±10% (muy volátil)
            extreme_range: { min: 200, max: 2000 }
        }
    },

    // Configuración de alertas
    alerts: {
        discrepancy_threshold: 0.05, // 5% diferencia entre fuentes
        critical_threshold: 0.15, // 15% diferencia crítica
        cooldown_period: 300000, // 5 minutos entre alertas del mismo tipo
        max_alerts_per_hour: 10,
        alert_retention: 24 * 60 * 60 * 1000 // 24 horas
    },

    // Sistema de scoring de fuentes
    scoring: {
        initial_score: 100,
        error_penalty: -5,
        critical_error_penalty: -10,
        accuracy_bonus: 2,
        daily_decay: 0.02, // 2% decay diario
        minimum_score: 10, // Score mínimo antes de desactivar
        recovery_rate: 1 // Puntos de recuperación por validación exitosa
    },

    // Configuración de histórico
    history: {
        max_validations: 1000,
        cleanup_interval: 24 * 60 * 60 * 1000, // 24 horas
        persistent_storage: true
    }
};

// =================================================================
// CLASE PRINCIPAL DE VALIDACIÓN DE PRECIOS
// =================================================================

class RealTimePriceValidator {
    constructor() {
        this.sourceScores = new Map();
        this.validationHistory = [];
        this.alertHistory = [];
        this.lastAlerts = new Map();
        this.isInitialized = false;
        
        // Contadores de sesión
        this.sessionStats = {
            validations: 0,
            discrepancies: 0,
            critical_errors: 0,
            start_time: Date.now()
        };

        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de validación...');
        
        try {
            // Cargar datos persistentes
            this.loadPersistedData();
            
            // Configurar limpieza automática
            this.setupCleanupSchedule();
            
            // Configurar decay diario de scores
            this.setupDailyDecay();
            
            this.isInitialized = true;
            console.log('✅ Sistema de validación inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando validador:', error);
            this.initializeDefaults();
        }
    }

    loadPersistedData() {
        try {
            // Cargar scores de fuentes
            const storedScores = localStorage.getItem('price_validator_scores');
            if (storedScores) {
                const scoresData = JSON.parse(storedScores);
                Object.entries(scoresData).forEach(([source, scoreData]) => {
                    this.sourceScores.set(source, scoreData);
                });
                console.log(`📊 Cargados scores de ${this.sourceScores.size} fuentes`);
            }

            // Cargar historial de validaciones
            const storedHistory = localStorage.getItem('price_validator_history');
            if (storedHistory) {
                this.validationHistory = JSON.parse(storedHistory);
                console.log(`📚 Cargado historial con ${this.validationHistory.length} validaciones`);
            }

        } catch (error) {
            console.warn('⚠️ Error cargando datos persistentes:', error);
        }
    }

    initializeDefaults() {
        this.sourceScores.clear();
        this.validationHistory = [];
        this.alertHistory = [];
        this.isInitialized = true;
        console.log('🔄 Inicializado con valores por defecto');
    }

    setupCleanupSchedule() {
        // Limpieza automática cada 24 horas
        setInterval(() => {
            this.performCleanup();
        }, VALIDATION_CONFIG.history.cleanup_interval);
    }

    setupDailyDecay() {
        // Decay de scores cada 24 horas
        setInterval(() => {
            this.applyDailyDecay();
        }, 24 * 60 * 60 * 1000);
    }

    // =================================================================
    // MÉTODOS PRINCIPALES DE VALIDACIÓN
    // =================================================================

    async validatePricesFromSources(sourcesData) {
        console.log('🔍 Iniciando validación cruzada de precios...');
        
        const validation = {
            id: Date.now(),
            timestamp: Date.now(),
            sources: {},
            discrepancies: [],
            alerts: [],
            overall_status: 'unknown',
            metals_validated: 0,
            passed_validations: 0
        };

        try {
            // Procesar cada fuente
            Object.entries(sourcesData).forEach(([sourceName, sourceData]) => {
                validation.sources[sourceName] = this.validateSingleSource(sourceName, sourceData);
            });

            // Detectar discrepancias entre fuentes
            validation.discrepancies = this.detectDiscrepancies(validation.sources);

            // Generar alertas si es necesario
            validation.alerts = await this.generateAlerts(validation.discrepancies);

            // Actualizar scores de fuentes
            this.updateSourceScores(validation);

            // Determinar status general
            validation.overall_status = this.determineOverallStatus(validation);

            // Actualizar estadísticas
            this.updateSessionStats(validation);

            // Guardar en historial
            this.addToHistory(validation);

            console.log(`✅ Validación completada: ${validation.overall_status}`);
            return validation;

        } catch (error) {
            console.error('❌ Error durante validación:', error);
            validation.overall_status = 'error';
            validation.error = error.message;
            return validation;
        }
    }

    validateSingleSource(sourceName, sourceData) {
        const sourceValidation = {
            source: sourceName,
            timestamp: Date.now(),
            metals: {},
            passed: 0,
            failed: 0,
            warnings: 0,
            overall_score: 0
        };

        try {
            // Obtener o inicializar score de fuente
            this.ensureSourceScore(sourceName);

            if (!sourceData.metals) {
                sourceValidation.error = 'No metal data available';
                return sourceValidation;
            }

            // Validar cada metal
            Object.entries(sourceData.metals).forEach(([symbol, metalData]) => {
                const metalValidation = this.validateMetalPrice(symbol, metalData, sourceName);
                sourceValidation.metals[symbol] = metalValidation;

                if (metalValidation.status === 'passed') {
                    sourceValidation.passed++;
                } else if (metalValidation.status === 'failed') {
                    sourceValidation.failed++;
                } else if (metalValidation.status === 'warning') {
                    sourceValidation.warnings++;
                }
            });

            // Calcular score general de la fuente
            const totalValidations = sourceValidation.passed + sourceValidation.failed + sourceValidation.warnings;
            if (totalValidations > 0) {
                sourceValidation.overall_score = (
                    (sourceValidation.passed * 100) + 
                    (sourceValidation.warnings * 50)
                ) / (totalValidations * 100);
            }

            return sourceValidation;

        } catch (error) {
            sourceValidation.error = error.message;
            return sourceValidation;
        }
    }

    validateMetalPrice(symbol, metalData, sourceName) {
        const validation = {
            symbol: symbol,
            source: sourceName,
            timestamp: Date.now(),
            status: 'unknown',
            messages: [],
            score: 0
        };

        try {
            const reference = VALIDATION_CONFIG.reference_prices[symbol];
            if (!reference) {
                validation.status = 'skipped';
                validation.messages.push(`No reference price for ${symbol}`);
                return validation;
            }

            // Validar rango extremo (detección de errores graves)
            if (metalData.mxn_per_gram) {
                const price = metalData.mxn_per_gram;
                
                if (price < reference.extreme_range.min || price > reference.extreme_range.max) {
                    validation.status = 'failed';
                    validation.messages.push(`Price ${price} outside extreme range [${reference.extreme_range.min}, ${reference.extreme_range.max}]`);
                    return validation;
                }
            }

            // Validar quilates para oro
            if (symbol === 'XAU' && metalData.karats) {
                validation.karat_validations = {};
                let karatPassed = 0, karatTotal = 0;

                Object.entries(metalData.karats).forEach(([karat, karatData]) => {
                    const karatValidation = this.validateGoldKarat(karat, karatData.mxn_per_gram, reference.karats[karat]);
                    validation.karat_validations[karat] = karatValidation;
                    karatTotal++;
                    if (karatValidation.status === 'passed') karatPassed++;
                });

                validation.score = karatPassed / karatTotal;
                validation.status = validation.score > 0.5 ? 'passed' : 'warning';
                validation.messages.push(`Gold karats: ${karatPassed}/${karatTotal} passed`);

            } else {
                // Validar metal simple
                const result = this.validateSimpleMetal(metalData.mxn_per_gram, reference);
                validation.status = result.status;
                validation.messages = result.messages;
                validation.score = result.score;
            }

            return validation;

        } catch (error) {
            validation.status = 'error';
            validation.messages.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    validateGoldKarat(karat, price, reference) {
        if (!reference) {
            return { status: 'skipped', message: `No reference for ${karat}` };
        }

        const deviation = Math.abs(price - reference.mxn_per_gram) / reference.mxn_per_gram;
        
        if (deviation <= reference.tolerance) {
            return { 
                status: 'passed', 
                deviation: deviation,
                message: `${karat}: ${price} MXN/g (${(deviation * 100).toFixed(2)}% deviation)` 
            };
        } else if (deviation <= reference.tolerance * 2) {
            return { 
                status: 'warning', 
                deviation: deviation,
                message: `${karat}: ${price} MXN/g - High deviation (${(deviation * 100).toFixed(2)}%)` 
            };
        } else {
            return { 
                status: 'failed', 
                deviation: deviation,
                message: `${karat}: ${price} MXN/g - Critical deviation (${(deviation * 100).toFixed(2)}%)` 
            };
        }
    }

    validateSimpleMetal(price, reference) {
        if (!price || !reference.mxn_per_gram) {
            return { 
                status: 'error', 
                messages: ['Missing price data'],
                score: 0 
            };
        }

        const deviation = Math.abs(price - reference.mxn_per_gram) / reference.mxn_per_gram;
        
        if (deviation <= reference.tolerance) {
            return { 
                status: 'passed', 
                messages: [`Price ${price} MXN/g within tolerance (${(deviation * 100).toFixed(2)}% deviation)`],
                score: 1.0 
            };
        } else if (deviation <= reference.tolerance * 2) {
            return { 
                status: 'warning', 
                messages: [`Price ${price} MXN/g - High deviation (${(deviation * 100).toFixed(2)}%)`],
                score: 0.5 
            };
        } else {
            return { 
                status: 'failed', 
                messages: [`Price ${price} MXN/g - Critical deviation (${(deviation * 100).toFixed(2)}%)`],
                score: 0.0 
            };
        }
    }

    // =================================================================
    // DETECCIÓN DE DISCREPANCIAS ENTRE FUENTES
    // =================================================================

    detectDiscrepancies(sourcesData) {
        const discrepancies = [];
        const metals = new Set();

        // Recolectar todos los metales validados
        Object.values(sourcesData).forEach(source => {
            if (source.metals) {
                Object.keys(source.metals).forEach(metal => metals.add(metal));
            }
        });

        // Analizar discrepancias por metal
        metals.forEach(metal => {
            const metalPrices = this.collectMetalPricesFromSources(metal, sourcesData);
            if (metalPrices.length >= 2) {
                const discrepancy = this.analyzeMetalDiscrepancy(metal, metalPrices);
                if (discrepancy) {
                    discrepancies.push(discrepancy);
                }
            }
        });

        return discrepancies;
    }

    collectMetalPricesFromSources(metal, sourcesData) {
        const prices = [];

        Object.entries(sourcesData).forEach(([sourceName, sourceData]) => {
            if (sourceData.metals && sourceData.metals[metal]) {
                const metalData = sourceData.metals[metal];
                
                if (metal === 'XAU' && metalData.karats) {
                    // Para oro, usar precio 14k como referencia principal
                    if (metalData.karats['14k']) {
                        prices.push({
                            source: sourceName,
                            price: metalData.karats['14k'].mxn_per_gram,
                            type: '14k_gold'
                        });
                    }
                } else if (metalData.mxn_per_gram) {
                    prices.push({
                        source: sourceName,
                        price: metalData.mxn_per_gram,
                        type: 'base_metal'
                    });
                }
            }
        });

        return prices;
    }

    analyzeMetalDiscrepancy(metal, prices) {
        if (prices.length < 2) return null;

        const priceValues = prices.map(p => p.price);
        const avgPrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
        const maxDeviation = Math.max(...priceValues.map(price => Math.abs(price - avgPrice) / avgPrice));

        if (maxDeviation > VALIDATION_CONFIG.alerts.discrepancy_threshold) {
            const severity = maxDeviation > VALIDATION_CONFIG.alerts.critical_threshold ? 'critical' : 'warning';
            
            return {
                metal: metal,
                type: 'cross_source_discrepancy',
                severity: severity,
                max_deviation: maxDeviation,
                average_price: avgPrice,
                sources: prices,
                timestamp: Date.now(),
                message: `${metal} shows ${(maxDeviation * 100).toFixed(2)}% price discrepancy between sources`
            };
        }

        return null;
    }

    // =================================================================
    // SISTEMA DE ALERTAS INTELIGENTES
    // =================================================================

    async generateAlerts(discrepancies) {
        const alerts = [];

        discrepancies.forEach(discrepancy => {
            const alertKey = `${discrepancy.type}_${discrepancy.metal}`;
            
            if (this.shouldGenerateAlert(alertKey, discrepancy.severity)) {
                const alert = this.createAlert(discrepancy);
                alerts.push(alert);
                this.recordAlert(alertKey, alert);
            }
        });

        return alerts;
    }

    shouldGenerateAlert(alertKey, severity) {
        const config = VALIDATION_CONFIG.alerts;
        const lastAlert = this.lastAlerts.get(alertKey);
        
        // Verificar cooldown
        if (lastAlert && (Date.now() - lastAlert.timestamp) < config.cooldown_period) {
            return false;
        }

        // Verificar límite por hora
        const recentAlerts = this.alertHistory.filter(alert => 
            Date.now() - alert.timestamp < 3600000 // 1 hora
        );
        
        if (recentAlerts.length >= config.max_alerts_per_hour) {
            return false;
        }

        return true;
    }

    createAlert(discrepancy) {
        return {
            id: Date.now(),
            timestamp: Date.now(),
            type: discrepancy.type,
            severity: discrepancy.severity,
            metal: discrepancy.metal,
            message: discrepancy.message,
            data: discrepancy,
            status: 'active'
        };
    }

    recordAlert(alertKey, alert) {
        this.lastAlerts.set(alertKey, alert);
        this.alertHistory.unshift(alert);
        
        // Mantener límite de alertas
        if (this.alertHistory.length > 100) {
            this.alertHistory = this.alertHistory.slice(0, 100);
        }

        console.warn(`🚨 ALERTA ${alert.severity.toUpperCase()}: ${alert.message}`);
    }

    // =================================================================
    // SISTEMA DE SCORING DE FUENTES
    // =================================================================

    ensureSourceScore(sourceName) {
        if (!this.sourceScores.has(sourceName)) {
            this.sourceScores.set(sourceName, {
                source: sourceName,
                score: VALIDATION_CONFIG.scoring.initial_score,
                last_updated: Date.now(),
                total_validations: 0,
                successful_validations: 0,
                failed_validations: 0,
                created_at: Date.now()
            });
        }
    }

    updateSourceScores(validation) {
        Object.entries(validation.sources).forEach(([sourceName, sourceData]) => {
            const scoreData = this.sourceScores.get(sourceName);
            if (!scoreData) return;

            scoreData.total_validations++;
            scoreData.last_updated = Date.now();

            if (sourceData.overall_score >= 0.8) {
                // Validación exitosa
                scoreData.successful_validations++;
                scoreData.score += VALIDATION_CONFIG.scoring.accuracy_bonus;
            } else if (sourceData.overall_score >= 0.5) {
                // Validación con warnings
                scoreData.score += VALIDATION_CONFIG.scoring.recovery_rate;
            } else {
                // Validación fallida
                scoreData.failed_validations++;
                const penalty = sourceData.overall_score < 0.2 ? 
                    VALIDATION_CONFIG.scoring.critical_error_penalty : 
                    VALIDATION_CONFIG.scoring.error_penalty;
                scoreData.score += penalty;
            }

            // Asegurar límites
            scoreData.score = Math.max(0, Math.min(150, scoreData.score));

            this.sourceScores.set(sourceName, scoreData);
        });

        this.persistSourceScores();
    }

    applyDailyDecay() {
        const decayRate = VALIDATION_CONFIG.scoring.daily_decay;
        
        this.sourceScores.forEach((scoreData, sourceName) => {
            scoreData.score *= (1 - decayRate);
            scoreData.score = Math.max(VALIDATION_CONFIG.scoring.minimum_score, scoreData.score);
        });

        this.persistSourceScores();
        console.log('📉 Decay diario aplicado a scores de fuentes');
    }

    persistSourceScores() {
        if (VALIDATION_CONFIG.history.persistent_storage) {
            try {
                const scoresObj = Object.fromEntries(this.sourceScores);
                localStorage.setItem('price_validator_scores', JSON.stringify(scoresObj));
            } catch (error) {
                console.warn('⚠️ Error persistiendo scores:', error);
            }
        }
    }

    // =================================================================
    // MÉTODOS PÚBLICOS DE REPORTE
    // =================================================================

    getValidationReport(days = 7) {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentValidations = this.validationHistory.filter(v => v.timestamp >= cutoffTime);

        const report = {
            period_days: days,
            total_validations: recentValidations.length,
            successful_validations: recentValidations.filter(v => v.overall_status === 'passed').length,
            warnings: recentValidations.filter(v => v.overall_status === 'warning').length,
            failures: recentValidations.filter(v => v.overall_status === 'failed').length,
            source_rankings: this.getSourceRankings(),
            recent_discrepancies: recentValidations.flatMap(v => v.discrepancies).slice(0, 10),
            session_stats: this.sessionStats
        };

        report.success_rate = report.total_validations > 0 ? 
            (report.successful_validations / report.total_validations) * 100 : 0;

        return report;
    }

    getSourceRankings() {
        const rankings = Array.from(this.sourceScores.values())
            .sort((a, b) => b.score - a.score)
            .map((scoreData, index) => ({
                rank: index + 1,
                source: scoreData.source,
                score: Math.round(scoreData.score),
                accuracy: scoreData.total_validations > 0 ? 
                    (scoreData.successful_validations / scoreData.total_validations) * 100 : 0,
                total_validations: scoreData.total_validations,
                is_active: scoreData.score >= VALIDATION_CONFIG.scoring.minimum_score
            }));

        return rankings;
    }

    getCurrentAlerts() {
        const activeAlerts = this.alertHistory.filter(alert => 
            alert.status === 'active' && 
            Date.now() - alert.timestamp < VALIDATION_CONFIG.alerts.alert_retention
        );

        return activeAlerts.sort((a, b) => b.timestamp - a.timestamp);
    }

    // =================================================================
    // MÉTODOS DE MANTENIMIENTO
    // =================================================================

    addToHistory(validation) {
        this.validationHistory.unshift(validation);
        
        if (this.validationHistory.length > VALIDATION_CONFIG.history.max_validations) {
            this.validationHistory = this.validationHistory.slice(0, VALIDATION_CONFIG.history.max_validations);
        }

        this.persistHistory();
    }

    persistHistory() {
        if (VALIDATION_CONFIG.history.persistent_storage) {
            try {
                localStorage.setItem('price_validator_history', JSON.stringify(this.validationHistory));
            } catch (error) {
                console.warn('⚠️ Error persistiendo historial:', error);
            }
        }
    }

    updateSessionStats(validation) {
        this.sessionStats.validations++;
        
        if (validation.discrepancies.length > 0) {
            this.sessionStats.discrepancies++;
        }
        
        const criticalErrors = validation.discrepancies.filter(d => d.severity === 'critical').length;
        this.sessionStats.critical_errors += criticalErrors;
    }

    determineOverallStatus(validation) {
        const totalSources = Object.keys(validation.sources).length;
        const passedSources = Object.values(validation.sources).filter(s => s.overall_score >= 0.8).length;
        const warningSources = Object.values(validation.sources).filter(s => s.overall_score >= 0.5 && s.overall_score < 0.8).length;

        if (passedSources / totalSources >= 0.8) {
            return 'passed';
        } else if ((passedSources + warningSources) / totalSources >= 0.6) {
            return 'warning';
        } else {
            return 'failed';
        }
    }

    performCleanup() {
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 días

        // Limpiar historial viejo
        this.validationHistory = this.validationHistory.filter(v => v.timestamp >= cutoffTime);
        
        // Limpiar alertas viejas
        this.alertHistory = this.alertHistory.filter(a => a.timestamp >= cutoffTime);

        console.log('🧹 Limpieza automática completada');
    }

    // =================================================================
    // MÉTODOS DE UTILIDAD PÚBLICA
    // =================================================================

    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            source_count: this.sourceScores.size,
            validation_count: this.validationHistory.length,
            active_alerts: this.getCurrentAlerts().length,
            session_stats: this.sessionStats,
            uptime: Date.now() - this.sessionStats.start_time
        };
    }

    resetSourceScore(sourceName) {
        if (this.sourceScores.has(sourceName)) {
            const scoreData = this.sourceScores.get(sourceName);
            scoreData.score = VALIDATION_CONFIG.scoring.initial_score;
            scoreData.total_validations = 0;
            scoreData.successful_validations = 0;
            scoreData.failed_validations = 0;
            scoreData.last_updated = Date.now();
            
            this.persistSourceScores();
            console.log(`🔄 Score reiniciado para ${sourceName}`);
        }
    }

    clearAlert(alertId) {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'cleared';
            alert.cleared_at = Date.now();
        }
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global con inicialización diferida
if (typeof window !== 'undefined') {
    setTimeout(() => {
        window.priceValidator = new RealTimePriceValidator();
        console.log('🛡️ Price Validator disponible globalmente');
    }, 3000);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RealTimePriceValidator, VALIDATION_CONFIG };
}

console.log('✅ Sistema de Validación de Precios v1.0 cargado correctamente');
console.log('🎯 Precios de referencia: Oro 14k = 1,172 MXN/g, Plata = 23 MXN/g');
console.log('⚡ Validación automática con alertas inteligentes activada');