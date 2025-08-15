// documentation-error-reporter.js - SISTEMA DE DOCUMENTACIÓN Y REPORTES v1.0
// Documentación completa, logs detallados y reportes de precisión para SUBAGENTE 10
// =================================================================================

console.log('📚 Iniciando Sistema de Documentación y Error Reporter v1.0...');

// =================================================================================
// CONFIGURACIÓN DEL SISTEMA DE DOCUMENTACIÓN
// =================================================================================

const DOCUMENTATION_CONFIG = {
    // Configuración de logging
    logging: {
        levels: {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            FATAL: 5
        },
        defaultLevel: 'INFO',
        maxLogSize: 10 * 1024 * 1024,      // 10MB máximo
        maxLogFiles: 100,                   // Máximo 100 archivos de log
        rotateDaily: true,
        includeStackTrace: true,
        includeTimestamp: true,
        includeModuleInfo: true
    },

    // Configuración de reportes
    reports: {
        precision: {
            enabled: true,
            interval: 24 * 60 * 60 * 1000,    // Diario
            thresholds: {
                accuracy: 0.95,                 // 95% precisión mínima
                availability: 0.99,             // 99% disponibilidad
                responseTime: 3000              // 3s máximo
            }
        },
        performance: {
            enabled: true,
            interval: 60 * 60 * 1000,         // Cada hora
            metrics: ['response_time', 'cache_hit_rate', 'error_rate', 'throughput']
        },
        errors: {
            enabled: true,
            grouping: true,                    // Agrupar errores similares
            alertThreshold: 10,                // Alertar después de 10 errores
            emailAlert: false,
            slackAlert: false
        }
    },

    // Configuración de documentación automática
    autodoc: {
        enabled: true,
        generateAPI: true,                     // Documentar APIs automáticamente
        generateFlowcharts: false,             // Requiere librerías adicionales
        generateMetrics: true,
        includeExamples: true,
        outputFormat: 'markdown'
    },

    // Configuración de alertas
    alerts: {
        channels: ['console', 'localStorage'], // Sin email/slack por default
        critical: {
            systemDown: true,
            dataCorruption: true,
            securityBreach: true
        },
        warning: {
            performanceDegradation: true,
            highErrorRate: true,
            cacheFailure: true
        }
    }
};

// =================================================================================
// CLASE PRINCIPAL DE DOCUMENTACIÓN Y REPORTES
// =================================================================================

class DocumentationErrorReporter {
    constructor() {
        this.logs = [];
        this.errorGroups = new Map();
        this.metrics = new Map();
        this.reports = [];
        this.alerts = [];
        this.apiDocs = new Map();
        this.currentLogLevel = DOCUMENTATION_CONFIG.logging.levels[DOCUMENTATION_CONFIG.logging.defaultLevel];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de documentación...');
        
        try {
            // Configurar logging
            this.setupLogging();
            
            // Configurar recolección de métricas
            this.setupMetricsCollection();
            
            // Configurar generación de reportes
            this.setupReportGeneration();
            
            // Configurar documentación automática
            this.setupAutoDocumentation();
            
            // Configurar manejo de errores globales
            this.setupGlobalErrorHandling();
            
            // Cargar datos existentes
            this.loadStoredData();
            
            this.info('Sistema de documentación y reportes inicializado correctamente');
            
        } catch (error) {
            this.fatal('Error inicializando sistema de documentación', error);
        }
    }

    // =================================================================================
    // SISTEMA DE LOGGING AVANZADO
    // =================================================================================

    setupLogging() {
        // Configurar rotación de logs
        this.setupLogRotation();
        
        // Interceptar console para logging
        this.interceptConsole();
        
        this.debug('Sistema de logging configurado');
    }

    log(level, message, data = null, module = null) {
        const levelNum = typeof level === 'string' ? DOCUMENTATION_CONFIG.logging.levels[level.toUpperCase()] : level;
        
        if (levelNum < this.currentLogLevel) {
            return; // No logear si está por debajo del nivel configurado
        }

        const logEntry = {
            id: this.generateLogId(),
            timestamp: Date.now(),
            level: Object.keys(DOCUMENTATION_CONFIG.logging.levels).find(
                key => DOCUMENTATION_CONFIG.logging.levels[key] === levelNum
            ),
            message,
            data: this.sanitizeLogData(data),
            module: module || this.detectModule(),
            stackTrace: DOCUMENTATION_CONFIG.logging.includeStackTrace ? this.getStackTrace() : null,
            sessionId: this.getSessionId(),
            userId: this.getCurrentUserId()
        };

        // Agregar a logs en memoria
        this.logs.push(logEntry);

        // Mantener límite de logs en memoria
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        // Persistir logs críticos
        if (levelNum >= DOCUMENTATION_CONFIG.logging.levels.ERROR) {
            this.persistLog(logEntry);
        }

        // Mostrar en consola con formato
        this.displayLog(logEntry);

        // Procesar alertas si es necesario
        if (levelNum >= DOCUMENTATION_CONFIG.logging.levels.WARN) {
            this.processAlert(logEntry);
        }
    }

    // Métodos de logging por nivel
    trace(message, data, module) { this.log('TRACE', message, data, module); }
    debug(message, data, module) { this.log('DEBUG', message, data, module); }
    info(message, data, module) { this.log('INFO', message, data, module); }
    warn(message, data, module) { this.log('WARN', message, data, module); }
    error(message, data, module) { this.log('ERROR', message, data, module); }
    fatal(message, data, module) { this.log('FATAL', message, data, module); }

    displayLog(logEntry) {
        const timestamp = new Date(logEntry.timestamp).toISOString();
        const level = logEntry.level.padEnd(5);
        const module = logEntry.module ? `[${logEntry.module}]` : '';
        const message = logEntry.message;
        
        const logMessage = `${timestamp} ${level} ${module} ${message}`;
        
        // Usar console apropiado según nivel
        switch (logEntry.level) {
            case 'TRACE':
            case 'DEBUG':
                console.debug(logMessage, logEntry.data);
                break;
            case 'INFO':
                console.info(logMessage, logEntry.data);
                break;
            case 'WARN':
                console.warn(logMessage, logEntry.data);
                break;
            case 'ERROR':
            case 'FATAL':
                console.error(logMessage, logEntry.data);
                break;
        }
    }

    sanitizeLogData(data) {
        if (!data) return null;
        
        try {
            // Convertir a JSON y back para hacer deep copy
            let sanitized = JSON.parse(JSON.stringify(data));
            
            // Remover información sensible
            sanitized = this.removeSensitiveData(sanitized);
            
            return sanitized;
        } catch (error) {
            return { error: 'Failed to sanitize log data', original: data?.toString() };
        }
    }

    removeSensitiveData(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'apikey'];
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeSensitiveData(item));
        }
        
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                result[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                result[key] = this.removeSensitiveData(value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    detectModule() {
        const stack = new Error().stack;
        if (!stack) return 'unknown';
        
        const lines = stack.split('\n');
        for (let i = 2; i < Math.min(lines.length, 5); i++) {
            const line = lines[i];
            
            // Buscar patrones conocidos
            if (line.includes('realMetalsAPI')) return 'MetalsAPI';
            if (line.includes('realTimePriceValidator')) return 'PriceValidator';
            if (line.includes('exchangeRateManager')) return 'ExchangeRate';
            if (line.includes('fallbackPriceCalculator')) return 'Fallback';
            if (line.includes('goldKaratSpecialist')) return 'GoldKarat';
            if (line.includes('pricingIntegration')) return 'Integration';
            if (line.includes('cachePerformanceOptimizer')) return 'Cache';
            if (line.includes('testingQA')) return 'Testing';
            if (line.includes('advancedManualPricingOverride')) return 'ManualOverride';
        }
        
        return 'PricingSystem';
    }

    getStackTrace() {
        try {
            const stack = new Error().stack;
            return stack ? stack.split('\n').slice(3, 8).join('\n') : null;
        } catch {
            return null;
        }
    }

    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    getSessionId() {
        if (!window.currentSessionId) {
            window.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        }
        return window.currentSessionId;
    }

    getCurrentUserId() {
        // Integrar con sistema de auth si existe
        return window.auth?.getCurrentUser?.()?.id || 'anonymous';
    }

    // =================================================================================
    // SISTEMA DE MÉTRICAS Y REPORTES
    // =================================================================================

    setupMetricsCollection() {
        // Recopilar métricas cada minuto
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60 * 1000);

        // Recopilar métricas de performance cada 5 minutos
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 5 * 60 * 1000);

        this.debug('Recolección de métricas configurada');
    }

    collectSystemMetrics() {
        try {
            const metrics = {
                timestamp: Date.now(),
                memory: this.getMemoryMetrics(),
                pricing: this.getPricingMetrics(),
                cache: this.getCacheMetrics(),
                apis: this.getAPIMetrics(),
                errors: this.getErrorMetrics()
            };

            this.recordMetric('system', metrics);
            
        } catch (error) {
            this.error('Error recopilando métricas del sistema', error);
        }
    }

    collectPerformanceMetrics() {
        try {
            const performance = {
                timestamp: Date.now(),
                responseTime: this.calculateAverageResponseTime(),
                throughput: this.calculateThroughput(),
                availability: this.calculateAvailability(),
                errorRate: this.calculateErrorRate(),
                cacheHitRate: this.calculateCacheHitRate()
            };

            this.recordMetric('performance', performance);
            
            // Verificar thresholds
            this.checkPerformanceThresholds(performance);
            
        } catch (error) {
            this.error('Error recopilando métricas de performance', error);
        }
    }

    getMemoryMetrics() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
            };
        }
        return null;
    }

    getPricingMetrics() {
        const integration = window.pricingIntegration;
        if (integration) {
            return integration.getMetrics();
        }
        return null;
    }

    getCacheMetrics() {
        const optimizer = window.cachePerformanceOptimizer;
        if (optimizer) {
            return optimizer.getMetrics();
        }
        return null;
    }

    getAPIMetrics() {
        const metrics = {};
        
        // Métricas de APIs principales
        if (window.realMetalsAPI) {
            metrics.metalsAPI = window.realMetalsAPI.getSystemStatus?.() || { available: true };
        }
        
        if (window.realTimePriceValidator) {
            metrics.validator = window.realTimePriceValidator.getSystemStatus?.() || { available: true };
        }
        
        if (window.exchangeRateManager) {
            metrics.exchangeRate = window.exchangeRateManager.getSystemStatus?.() || { available: true };
        }
        
        return metrics;
    }

    getErrorMetrics() {
        const now = Date.now();
        const lastHour = now - 60 * 60 * 1000;
        
        const recentErrors = this.logs.filter(log => 
            log.timestamp >= lastHour && 
            DOCUMENTATION_CONFIG.logging.levels[log.level] >= DOCUMENTATION_CONFIG.logging.levels.ERROR
        );

        const errorsByLevel = {};
        const errorsByModule = {};
        
        for (const error of recentErrors) {
            errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
            errorsByModule[error.module] = (errorsByModule[error.module] || 0) + 1;
        }

        return {
            totalErrors: recentErrors.length,
            errorsByLevel,
            errorsByModule,
            errorRate: recentErrors.length / 60 // errores por minuto
        };
    }

    recordMetric(category, data) {
        if (!this.metrics.has(category)) {
            this.metrics.set(category, []);
        }
        
        const categoryMetrics = this.metrics.get(category);
        categoryMetrics.push(data);
        
        // Mantener solo últimas 1000 métricas por categoría
        if (categoryMetrics.length > 1000) {
            this.metrics.set(category, categoryMetrics.slice(-1000));
        }
    }

    // =================================================================================
    // GENERACIÓN DE REPORTES
    // =================================================================================

    setupReportGeneration() {
        // Reporte de precisión diario
        if (DOCUMENTATION_CONFIG.reports.precision.enabled) {
            setInterval(() => {
                this.generatePrecisionReport();
            }, DOCUMENTATION_CONFIG.reports.precision.interval);
        }

        // Reporte de performance por hora
        if (DOCUMENTATION_CONFIG.reports.performance.enabled) {
            setInterval(() => {
                this.generatePerformanceReport();
            }, DOCUMENTATION_CONFIG.reports.performance.interval);
        }

        this.debug('Generación automática de reportes configurada');
    }

    async generatePrecisionReport() {
        try {
            this.info('Generando reporte de precisión...');
            
            const report = {
                id: this.generateReportId(),
                type: 'precision',
                timestamp: Date.now(),
                period: {
                    start: Date.now() - 24 * 60 * 60 * 1000,
                    end: Date.now()
                },
                metrics: await this.calculatePrecisionMetrics(),
                analysis: null,
                recommendations: []
            };

            // Análisis automático
            report.analysis = this.analyzePrecisionMetrics(report.metrics);
            report.recommendations = this.generatePrecisionRecommendations(report.analysis);

            this.reports.push(report);
            this.persistReport(report);
            
            this.info('Reporte de precisión generado', { reportId: report.id });
            
            return report;
            
        } catch (error) {
            this.error('Error generando reporte de precisión', error);
            return null;
        }
    }

    async generatePerformanceReport() {
        try {
            this.info('Generando reporte de performance...');
            
            const report = {
                id: this.generateReportId(),
                type: 'performance',
                timestamp: Date.now(),
                period: {
                    start: Date.now() - 60 * 60 * 1000,
                    end: Date.now()
                },
                metrics: this.calculatePerformanceMetrics(),
                analysis: null,
                recommendations: []
            };

            report.analysis = this.analyzePerformanceMetrics(report.metrics);
            report.recommendations = this.generatePerformanceRecommendations(report.analysis);

            this.reports.push(report);
            this.persistReport(report);
            
            this.info('Reporte de performance generado', { reportId: report.id });
            
            return report;
            
        } catch (error) {
            this.error('Error generando reporte de performance', error);
            return null;
        }
    }

    async calculatePrecisionMetrics() {
        const metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            apiAvailability: {},
            priceAccuracy: {},
            dataConsistency: {}
        };

        // Obtener métricas de integración
        if (window.pricingIntegration) {
            const integrationMetrics = window.pricingIntegration.getMetrics();
            metrics.totalRequests = integrationMetrics.requests?.total || 0;
            metrics.successfulRequests = integrationMetrics.requests?.successful || 0;
            metrics.failedRequests = integrationMetrics.requests?.failed || 0;
            metrics.averageResponseTime = integrationMetrics.requests?.averageResponseTime || 0;
        }

        // Calcular disponibilidad de APIs
        metrics.apiAvailability = this.calculateAPIAvailability();

        // Obtener métricas de testing si están disponibles
        if (window.testingQA) {
            const testResults = window.testingQA.getTestResults();
            if (testResults && testResults.summary) {
                metrics.priceAccuracy.testSuccessRate = parseFloat(testResults.summary.successRate) / 100;
            }
        }

        return metrics;
    }

    calculatePerformanceMetrics() {
        const performanceMetrics = this.metrics.get('performance') || [];
        const systemMetrics = this.metrics.get('system') || [];
        
        if (performanceMetrics.length === 0) {
            return { error: 'No hay métricas de performance disponibles' };
        }

        const latest = performanceMetrics[performanceMetrics.length - 1];
        const hourAgo = performanceMetrics.filter(m => m.timestamp >= Date.now() - 60 * 60 * 1000);
        
        return {
            current: latest,
            hourly: {
                average: this.calculateAverageMetrics(hourAgo),
                trend: this.calculateMetricsTrend(hourAgo),
                peak: this.findPeakMetrics(hourAgo)
            },
            memory: systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].memory : null
        };
    }

    calculateAPIAvailability() {
        const apis = ['realMetalsAPI', 'realTimePriceValidator', 'exchangeRateManager', 'fallbackPriceCalculator'];
        const availability = {};
        
        for (const api of apis) {
            const module = window[api];
            if (module) {
                const status = module.getSystemStatus?.();
                availability[api] = {
                    available: !!module,
                    initialized: status?.isInitialized !== false,
                    healthy: this.isAPIHealthy(api)
                };
            } else {
                availability[api] = { available: false, initialized: false, healthy: false };
            }
        }
        
        return availability;
    }

    isAPIHealthy(apiName) {
        // Buscar errores recientes relacionados con esta API
        const recentErrors = this.logs.filter(log => 
            log.timestamp >= Date.now() - 30 * 60 * 1000 && // Últimos 30 minutos
            log.level === 'ERROR' &&
            (log.module === apiName || log.message.toLowerCase().includes(apiName.toLowerCase()))
        );
        
        return recentErrors.length < 5; // Saludable si menos de 5 errores en 30 min
    }

    // =================================================================================
    // ANÁLISIS AUTOMÁTICO
    // =================================================================================

    analyzePrecisionMetrics(metrics) {
        const analysis = {
            accuracy: 'unknown',
            availability: 'unknown',
            performance: 'unknown',
            issues: [],
            strengths: []
        };

        // Analizar precisión
        const successRate = metrics.totalRequests > 0 ? 
                           metrics.successfulRequests / metrics.totalRequests : 0;
        
        if (successRate >= DOCUMENTATION_CONFIG.reports.precision.thresholds.accuracy) {
            analysis.accuracy = 'excellent';
            analysis.strengths.push('Alta tasa de éxito en requests');
        } else if (successRate >= 0.9) {
            analysis.accuracy = 'good';
        } else if (successRate >= 0.8) {
            analysis.accuracy = 'fair';
            analysis.issues.push('Tasa de éxito por debajo del 90%');
        } else {
            analysis.accuracy = 'poor';
            analysis.issues.push('Tasa de éxito crítica');
        }

        // Analizar disponibilidad
        const availableAPIs = Object.values(metrics.apiAvailability || {})
                                   .filter(api => api.available && api.healthy).length;
        const totalAPIs = Object.keys(metrics.apiAvailability || {}).length;
        const availabilityRate = totalAPIs > 0 ? availableAPIs / totalAPIs : 0;
        
        if (availabilityRate >= 0.9) {
            analysis.availability = 'excellent';
            analysis.strengths.push('Alta disponibilidad de APIs');
        } else if (availabilityRate >= 0.7) {
            analysis.availability = 'good';
        } else {
            analysis.availability = 'poor';
            analysis.issues.push('Baja disponibilidad de APIs');
        }

        // Analizar performance
        if (metrics.averageResponseTime <= DOCUMENTATION_CONFIG.reports.precision.thresholds.responseTime) {
            analysis.performance = 'excellent';
            analysis.strengths.push('Excelente tiempo de respuesta');
        } else if (metrics.averageResponseTime <= 5000) {
            analysis.performance = 'good';
        } else {
            analysis.performance = 'poor';
            analysis.issues.push('Tiempo de respuesta elevado');
        }

        return analysis;
    }

    analyzePerformanceMetrics(metrics) {
        if (metrics.error) {
            return { error: metrics.error };
        }

        const analysis = {
            trend: 'stable',
            bottlenecks: [],
            recommendations: [],
            alerts: []
        };

        // Analizar tendencia
        if (metrics.hourly.trend) {
            analysis.trend = metrics.hourly.trend.direction || 'stable';
        }

        // Detectar cuellos de botella
        if (metrics.current.responseTime > 3000) {
            analysis.bottlenecks.push('High response time');
        }
        
        if (metrics.current.cacheHitRate < 0.7) {
            analysis.bottlenecks.push('Low cache hit rate');
        }
        
        if (metrics.current.errorRate > 0.05) {
            analysis.bottlenecks.push('High error rate');
        }

        // Verificar memoria
        if (metrics.memory && metrics.memory.usagePercentage > 80) {
            analysis.alerts.push('High memory usage');
        }

        return analysis;
    }

    generatePrecisionRecommendations(analysis) {
        const recommendations = [];

        if (analysis.accuracy === 'poor' || analysis.accuracy === 'fair') {
            recommendations.push({
                priority: 'high',
                category: 'accuracy',
                title: 'Mejorar tasa de éxito',
                description: 'Investigar y corregir causas de fallos en requests',
                actions: [
                    'Revisar logs de errores',
                    'Verificar configuración de APIs',
                    'Mejorar manejo de timeouts'
                ]
            });
        }

        if (analysis.availability === 'poor') {
            recommendations.push({
                priority: 'high',
                category: 'availability',
                title: 'Mejorar disponibilidad de APIs',
                description: 'Restaurar funcionamiento de APIs críticas',
                actions: [
                    'Verificar conectividad de red',
                    'Renovar claves de API',
                    'Implementar circuit breakers'
                ]
            });
        }

        if (analysis.performance === 'poor') {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                title: 'Optimizar rendimiento',
                description: 'Reducir tiempo de respuesta del sistema',
                actions: [
                    'Optimizar cache',
                    'Reducir concurrencia',
                    'Implementar request batching'
                ]
            });
        }

        return recommendations;
    }

    generatePerformanceRecommendations(analysis) {
        const recommendations = [];

        for (const bottleneck of analysis.bottlenecks) {
            switch (bottleneck) {
                case 'High response time':
                    recommendations.push({
                        priority: 'high',
                        title: 'Optimizar tiempo de respuesta',
                        actions: ['Implementar caching agresivo', 'Optimizar queries', 'Reducir payload']
                    });
                    break;
                    
                case 'Low cache hit rate':
                    recommendations.push({
                        priority: 'medium',
                        title: 'Mejorar eficiencia de cache',
                        actions: ['Ajustar TTL', 'Precargar datos frecuentes', 'Optimizar claves de cache']
                    });
                    break;
                    
                case 'High error rate':
                    recommendations.push({
                        priority: 'high',
                        title: 'Reducir tasa de errores',
                        actions: ['Mejorar validación', 'Implementar retry logic', 'Verificar APIs']
                    });
                    break;
            }
        }

        return recommendations;
    }

    // =================================================================================
    // DOCUMENTACIÓN AUTOMÁTICA
    // =================================================================================

    setupAutoDocumentation() {
        if (!DOCUMENTATION_CONFIG.autodoc.enabled) return;

        // Documentar APIs disponibles
        this.documentAvailableAPIs();
        
        // Configurar actualización automática de documentación
        setInterval(() => {
            this.updateAPIDocumentation();
        }, 60 * 60 * 1000); // Cada hora

        this.debug('Documentación automática configurada');
    }

    documentAvailableAPIs() {
        const apis = [
            'realMetalsAPI',
            'realTimePriceValidator', 
            'advancedManualPricingOverride',
            'exchangeRateManager',
            'fallbackPriceCalculator',
            'goldKaratSpecialist',
            'pricingIntegration',
            'cachePerformanceOptimizer',
            'testingQA'
        ];

        for (const apiName of apis) {
            const api = window[apiName];
            if (api) {
                this.documentAPI(apiName, api);
            }
        }

        this.info(`Documentación generada para ${this.apiDocs.size} APIs`);
    }

    documentAPI(name, apiObject) {
        try {
            const doc = {
                name,
                description: this.getAPIDescription(name),
                methods: [],
                properties: [],
                events: [],
                examples: [],
                lastUpdated: Date.now()
            };

            // Documentar métodos públicos
            for (const prop in apiObject) {
                if (typeof apiObject[prop] === 'function' && !prop.startsWith('_')) {
                    doc.methods.push({
                        name: prop,
                        description: this.getMethodDescription(name, prop),
                        parameters: this.extractMethodParameters(apiObject[prop]),
                        returns: this.getMethodReturnType(name, prop),
                        example: this.generateMethodExample(name, prop)
                    });
                }
            }

            // Documentar propiedades
            for (const prop in apiObject) {
                if (typeof apiObject[prop] !== 'function' && !prop.startsWith('_')) {
                    doc.properties.push({
                        name: prop,
                        type: typeof apiObject[prop],
                        description: this.getPropertyDescription(name, prop),
                        value: this.getPropertyValue(apiObject[prop])
                    });
                }
            }

            // Agregar ejemplos de uso
            doc.examples = this.generateAPIExamples(name);

            this.apiDocs.set(name, doc);
            
        } catch (error) {
            this.error(`Error documentando API ${name}`, error);
        }
    }

    getAPIDescription(name) {
        const descriptions = {
            'realMetalsAPI': 'API principal para obtener precios de metales preciosos en tiempo real',
            'realTimePriceValidator': 'Validador de precios que compara múltiples fuentes',
            'advancedManualPricingOverride': 'Sistema de overrides manuales de precios',
            'exchangeRateManager': 'Gestor de tipos de cambio USD/MXN en tiempo real',
            'fallbackPriceCalculator': 'Calculadora de precios de emergencia con interpolación',
            'goldKaratSpecialist': 'Especialista en cálculos de quilates de oro',
            'pricingIntegration': 'Sistema de integración unificado para todos los módulos',
            'cachePerformanceOptimizer': 'Optimizador de cache y performance',
            'testingQA': 'Sistema de testing y quality assurance'
        };
        
        return descriptions[name] || 'API del sistema de precios';
    }

    generateAPIExamples(name) {
        const examples = {
            'realMetalsAPI': [
                'const price = await window.realMetalsAPI.getMetalPrice("gold", "14k");',
                'const status = window.realMetalsAPI.getSystemStatus();'
            ],
            'goldKaratSpecialist': [
                'const price = await window.getGoldPrice("14k", 5.2);',
                'const info = window.getKaratInfo("18k");',
                'const comparison = window.compareGoldKarats("14k", "18k", 10);'
            ],
            'pricingIntegration': [
                'const price = await window.getPrice("gold", "14k", 5);',
                'const safePrize = await window.getPriceWithFallback("silver", "925", 10);'
            ]
        };
        
        return examples[name] || [`// Usar ${name} según documentación`];
    }

    updateAPIDocumentation() {
        this.documentAvailableAPIs();
        this.info('Documentación de APIs actualizada');
    }

    generateAPIDocumentationMarkdown() {
        let markdown = '# Documentación de APIs - Sistema de Precios\n\n';
        markdown += `*Generado automáticamente el ${new Date().toISOString()}*\n\n`;

        for (const [name, doc] of this.apiDocs) {
            markdown += `## ${name}\n\n`;
            markdown += `${doc.description}\n\n`;

            if (doc.methods.length > 0) {
                markdown += '### Métodos\n\n';
                for (const method of doc.methods) {
                    markdown += `#### ${method.name}\n\n`;
                    if (method.description) {
                        markdown += `${method.description}\n\n`;
                    }
                    if (method.example) {
                        markdown += '```javascript\n';
                        markdown += `${method.example}\n`;
                        markdown += '```\n\n';
                    }
                }
            }

            if (doc.examples.length > 0) {
                markdown += '### Ejemplos de Uso\n\n';
                for (const example of doc.examples) {
                    markdown += '```javascript\n';
                    markdown += `${example}\n`;
                    markdown += '```\n\n';
                }
            }

            markdown += '---\n\n';
        }

        return markdown;
    }

    // =================================================================================
    // MANEJO DE ERRORES GLOBALES
    // =================================================================================

    setupGlobalErrorHandling() {
        // Capturar errores de JavaScript no manejados
        window.addEventListener('error', (event) => {
            this.error('Error global no manejado', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // Capturar promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Promise rechazada no manejada', {
                reason: event.reason,
                promise: event.promise
            });
        });

        this.debug('Manejo global de errores configurado');
    }

    // =================================================================================
    // SISTEMA DE ALERTAS
    // =================================================================================

    processAlert(logEntry) {
        const alert = {
            id: this.generateAlertId(),
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            module: logEntry.module,
            data: logEntry.data,
            status: 'active'
        };

        // Agrupar errores similares
        if (DOCUMENTATION_CONFIG.reports.errors.grouping) {
            const similar = this.findSimilarAlert(alert);
            if (similar) {
                similar.count = (similar.count || 1) + 1;
                similar.lastOccurrence = alert.timestamp;
                return; // No crear nueva alerta
            }
        }

        this.alerts.push(alert);

        // Verificar threshold de alertas
        if (this.alerts.filter(a => a.status === 'active').length >= 
            DOCUMENTATION_CONFIG.reports.errors.alertThreshold) {
            this.escalateAlerts();
        }

        // Enviar notificación
        this.sendAlertNotification(alert);
    }

    findSimilarAlert(newAlert) {
        const timeWindow = 10 * 60 * 1000; // 10 minutos
        const now = Date.now();

        return this.alerts.find(alert => 
            alert.status === 'active' &&
            alert.level === newAlert.level &&
            alert.module === newAlert.module &&
            alert.message === newAlert.message &&
            (now - alert.timestamp) < timeWindow
        );
    }

    sendAlertNotification(alert) {
        const channels = DOCUMENTATION_CONFIG.alerts.channels;

        if (channels.includes('console')) {
            console.warn(`🚨 ALERTA [${alert.level}] ${alert.module}: ${alert.message}`);
        }

        if (channels.includes('localStorage')) {
            this.persistAlert(alert);
        }

        // Aquí se pueden agregar más canales como email, Slack, etc.
    }

    escalateAlerts() {
        this.error('Threshold de alertas alcanzado - escalando', {
            activeAlerts: this.alerts.filter(a => a.status === 'active').length,
            threshold: DOCUMENTATION_CONFIG.reports.errors.alertThreshold
        });

        // Marcar algunas alertas como escaladas
        const activeAlerts = this.alerts.filter(a => a.status === 'active');
        for (let i = 0; i < Math.min(5, activeAlerts.length); i++) {
            activeAlerts[i].status = 'escalated';
        }
    }

    // =================================================================================
    // PERSISTENCIA Y STORAGE
    // =================================================================================

    loadStoredData() {
        try {
            // Cargar logs almacenados
            const storedLogs = localStorage.getItem('documentation_logs');
            if (storedLogs) {
                const logs = JSON.parse(storedLogs);
                this.logs = logs.slice(-500); // Últimos 500 logs
            }

            // Cargar reportes almacenados
            const storedReports = localStorage.getItem('documentation_reports');
            if (storedReports) {
                const reports = JSON.parse(storedReports);
                this.reports = reports.slice(-50); // Últimos 50 reportes
            }

            // Cargar alertas almacenadas
            const storedAlerts = localStorage.getItem('documentation_alerts');
            if (storedAlerts) {
                const alerts = JSON.parse(storedAlerts);
                this.alerts = alerts.slice(-100); // Últimas 100 alertas
            }

            this.debug('Datos almacenados cargados correctamente');
            
        } catch (error) {
            this.error('Error cargando datos almacenados', error);
        }
    }

    persistLog(logEntry) {
        try {
            const storedLogs = JSON.parse(localStorage.getItem('documentation_logs') || '[]');
            storedLogs.push(logEntry);
            
            // Mantener solo últimos 1000 logs
            if (storedLogs.length > 1000) {
                storedLogs.splice(0, storedLogs.length - 1000);
            }
            
            localStorage.setItem('documentation_logs', JSON.stringify(storedLogs));
            
        } catch (error) {
            console.error('Error persistiendo log:', error);
        }
    }

    persistReport(report) {
        try {
            const storedReports = JSON.parse(localStorage.getItem('documentation_reports') || '[]');
            storedReports.push(report);
            
            // Mantener solo últimos 100 reportes
            if (storedReports.length > 100) {
                storedReports.splice(0, storedReports.length - 100);
            }
            
            localStorage.setItem('documentation_reports', JSON.stringify(storedReports));
            
        } catch (error) {
            this.error('Error persistiendo reporte', error);
        }
    }

    persistAlert(alert) {
        try {
            const storedAlerts = JSON.parse(localStorage.getItem('documentation_alerts') || '[]');
            storedAlerts.push(alert);
            
            // Mantener solo últimas 200 alertas
            if (storedAlerts.length > 200) {
                storedAlerts.splice(0, storedAlerts.length - 200);
            }
            
            localStorage.setItem('documentation_alerts', JSON.stringify(storedAlerts));
            
        } catch (error) {
            console.error('Error persistiendo alerta:', error);
        }
    }

    // =================================================================================
    // UTILIDADES
    // =================================================================================

    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    setupLogRotation() {
        // Limpiar logs antiguos cada día
        setInterval(() => {
            this.rotateLogs();
        }, 24 * 60 * 60 * 1000);
    }

    rotateLogs() {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
        const cutoff = Date.now() - maxAge;
        
        this.logs = this.logs.filter(log => log.timestamp >= cutoff);
        this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
        
        this.info(`Rotación de logs completada - ${this.logs.length} logs, ${this.alerts.length} alertas mantenidos`);
    }

    interceptConsole() {
        // Interceptar console.error para logging automático
        const originalError = console.error;
        console.error = (...args) => {
            this.error('Console error intercepted', { args });
            originalError.apply(console, args);
        };

        // Interceptar console.warn
        const originalWarn = console.warn;
        console.warn = (...args) => {
            this.warn('Console warning intercepted', { args });
            originalWarn.apply(console, args);
        };
    }

    calculateAverageResponseTime() {
        const recent = this.logs
            .filter(log => 
                log.timestamp >= Date.now() - 60 * 60 * 1000 && 
                log.data?.responseTime
            )
            .map(log => log.data.responseTime);
        
        return recent.length > 0 ? 
               recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    }

    calculateThroughput() {
        const lastHour = Date.now() - 60 * 60 * 1000;
        const requests = this.logs.filter(log => 
            log.timestamp >= lastHour && 
            log.message.includes('request')
        );
        
        return requests.length / 60; // requests per minute
    }

    calculateAvailability() {
        const successful = this.logs.filter(log => 
            log.timestamp >= Date.now() - 60 * 60 * 1000 &&
            log.level === 'INFO' &&
            log.message.includes('successful')
        ).length;
        
        const failed = this.logs.filter(log => 
            log.timestamp >= Date.now() - 60 * 60 * 1000 &&
            log.level === 'ERROR'
        ).length;
        
        const total = successful + failed;
        return total > 0 ? successful / total : 1;
    }

    calculateErrorRate() {
        const lastHour = Date.now() - 60 * 60 * 1000;
        const errors = this.logs.filter(log => 
            log.timestamp >= lastHour && 
            DOCUMENTATION_CONFIG.logging.levels[log.level] >= DOCUMENTATION_CONFIG.logging.levels.ERROR
        );
        
        return errors.length / 60; // errors per minute
    }

    calculateCacheHitRate() {
        if (window.cachePerformanceOptimizer) {
            const metrics = window.cachePerformanceOptimizer.getMetrics();
            return metrics?.cache?.hitRate || 0;
        }
        return 0;
    }

    // =================================================================================
    // API PÚBLICA
    // =================================================================================

    // Logging público
    logInfo(message, data, module) { this.info(message, data, module); }
    logWarn(message, data, module) { this.warn(message, data, module); }
    logError(message, data, module) { this.error(message, data, module); }
    logDebug(message, data, module) { this.debug(message, data, module); }

    // Obtener logs
    getLogs(level = null, module = null, limit = 100) {
        let filtered = this.logs;
        
        if (level) {
            const levelNum = DOCUMENTATION_CONFIG.logging.levels[level.toUpperCase()];
            filtered = filtered.filter(log => 
                DOCUMENTATION_CONFIG.logging.levels[log.level] >= levelNum
            );
        }
        
        if (module) {
            filtered = filtered.filter(log => log.module === module);
        }
        
        return filtered.slice(-limit);
    }

    // Obtener reportes
    getReports(type = null) {
        if (type) {
            return this.reports.filter(report => report.type === type);
        }
        return this.reports;
    }

    // Obtener alertas
    getAlerts(status = null) {
        if (status) {
            return this.alerts.filter(alert => alert.status === status);
        }
        return this.alerts;
    }

    // Generar reporte bajo demanda
    async generateReport(type = 'precision') {
        if (type === 'precision') {
            return await this.generatePrecisionReport();
        } else if (type === 'performance') {
            return await this.generatePerformanceReport();
        }
        return null;
    }

    // Obtener documentación
    getAPIDocumentation(format = 'object') {
        if (format === 'markdown') {
            return this.generateAPIDocumentationMarkdown();
        }
        return Object.fromEntries(this.apiDocs);
    }

    // Obtener métricas
    getMetrics(category = null) {
        if (category) {
            return this.metrics.get(category) || [];
        }
        return Object.fromEntries(this.metrics);
    }

    // Configurar nivel de logging
    setLogLevel(level) {
        if (DOCUMENTATION_CONFIG.logging.levels[level.toUpperCase()] !== undefined) {
            this.currentLogLevel = DOCUMENTATION_CONFIG.logging.levels[level.toUpperCase()];
            this.info(`Nivel de logging cambiado a ${level.toUpperCase()}`);
        }
    }

    // Limpiar datos
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('documentation_logs');
        this.info('Logs limpiados');
    }

    clearReports() {
        this.reports = [];
        localStorage.removeItem('documentation_reports');
        this.info('Reportes limpiados');
    }

    clearAlerts() {
        this.alerts = [];
        localStorage.removeItem('documentation_alerts');
        this.info('Alertas limpiadas');
    }

    // Exportar datos
    exportData(format = 'json') {
        const data = {
            logs: this.logs,
            reports: this.reports,
            alerts: this.alerts,
            metrics: Object.fromEntries(this.metrics),
            apiDocs: Object.fromEntries(this.apiDocs),
            exportTimestamp: Date.now()
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            // Exportar logs como CSV
            const headers = ['timestamp', 'level', 'module', 'message'];
            const rows = this.logs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.level,
                log.module,
                log.message
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        return data;
    }

    // Estado del sistema
    getSystemStatus() {
        return {
            logging: {
                totalLogs: this.logs.length,
                currentLevel: Object.keys(DOCUMENTATION_CONFIG.logging.levels)
                    .find(key => DOCUMENTATION_CONFIG.logging.levels[key] === this.currentLogLevel),
                recentErrors: this.logs.filter(log => 
                    log.timestamp >= Date.now() - 60 * 60 * 1000 && 
                    log.level === 'ERROR'
                ).length
            },
            reports: {
                total: this.reports.length,
                lastGenerated: this.reports.length > 0 ? 
                               this.reports[this.reports.length - 1].timestamp : null
            },
            alerts: {
                active: this.alerts.filter(a => a.status === 'active').length,
                escalated: this.alerts.filter(a => a.status === 'escalated').length
            },
            documentation: {
                apisDocumented: this.apiDocs.size,
                lastUpdated: Math.max(...Array.from(this.apiDocs.values()).map(doc => doc.lastUpdated))
            }
        };
    }
}

// =================================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// =================================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.documentationReporter = new DocumentationErrorReporter();
    
    // API de conveniencia
    window.logInfo = (msg, data, module) => window.documentationReporter.logInfo(msg, data, module);
    window.logWarn = (msg, data, module) => window.documentationReporter.logWarn(msg, data, module);
    window.logError = (msg, data, module) => window.documentationReporter.logError(msg, data, module);
    window.logDebug = (msg, data, module) => window.documentationReporter.logDebug(msg, data, module);
    
    window.getSystemLogs = (level, module, limit) => window.documentationReporter.getLogs(level, module, limit);
    window.getSystemReports = (type) => window.documentationReporter.getReports(type);
    window.generateSystemReport = (type) => window.documentationReporter.generateReport(type);
    window.getAPIDocumentation = (format) => window.documentationReporter.getAPIDocumentation(format);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DocumentationErrorReporter,
        DOCUMENTATION_CONFIG
    };
}

console.log('✅ Sistema de Documentación y Error Reporter v1.0 cargado correctamente');
console.log('📚 Acceso: window.documentationReporter');
console.log('📝 Logging: window.logInfo/logWarn/logError/logDebug');
console.log('📊 Reportes: window.generateSystemReport("precision")');
console.log('📖 Docs: window.getAPIDocumentation("markdown")');