// pricing-validation-engine.js - MOTOR DE VALIDACIÓN DE PRECIOS v1.0
// Sistema inteligente de validaciones para overrides manuales
// =================================================================

console.log('🔍 Iniciando Motor de Validación de Precios v1.0...');

// =================================================================
// CONFIGURACIÓN DEL MOTOR DE VALIDACIÓN
// =================================================================

const VALIDATION_CONFIG = {
    // Rangos de validación por metal (MXN/gramo)
    priceRanges: {
        gold: {
            '10k': { min: 300, max: 1800, market: 488 },   // 10k: 1172 * 0.417
            '14k': { min: 400, max: 2500, market: 686 },   // 14k: 1172 * 0.585
            '18k': { min: 600, max: 3200, market: 879 },   // 18k: 1172 * 0.750
            '22k': { min: 800, max: 4000, market: 1075 },  // 22k: 1172 * 0.917
            '24k': { min: 900, max: 4500, market: 1172 }   // 24k: 1172 * 1.000
        },
        silver: {
            '925': { min: 5, max: 80, market: 21 }         // Plata 925: 23 * 0.925
        },
        platinum: {
            '950': { min: 200, max: 1200, market: 621 }    // Platino 950: 654 * 0.950
        },
        palladium: {
            '950': { min: 200, max: 1200, market: 638 }    // Paladio 950: 672 * 0.950
        }
    },

    // Thresholds de alerta (porcentajes)
    alertThresholds: {
        extreme: 0.50,    // 50% - Diferencia extrema
        high: 0.30,       // 30% - Diferencia alta
        moderate: 0.20,   // 20% - Diferencia moderada
        low: 0.10         // 10% - Diferencia baja
    },

    // Configuración de límites diarios
    dailyLimits: {
        maxChanges: 100,
        maxExtremeChanges: 10,
        warningThreshold: 80
    },

    // Patrones sospechosos
    suspiciousPatterns: {
        rapidChanges: 5,      // 5 cambios en 5 minutos
        timeWindow: 5 * 60 * 1000, // 5 minutos
        priceFluctuation: 0.15 // 15% fluctuación
    },

    // Configuración de alertas
    alerts: {
        duration: 5000,       // 5 segundos
        positions: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
        defaultPosition: 'top-right'
    }
};

// =================================================================
// CLASE PRINCIPAL DEL MOTOR DE VALIDACIÓN
// =================================================================

class PricingValidationEngine {
    constructor() {
        this.validationHistory = [];
        this.alertQueue = [];
        this.dailyStats = this.loadDailyStats();
        this.suspiciousActivityLog = [];
        this.activeAlerts = new Map();
        
        this.initialize();
    }

    initialize() {
        console.log('🚀 Inicializando motor de validación...');
        
        try {
            this.setupValidationRules();
            this.setupAlertSystem();
            this.loadValidationHistory();
            
            console.log('✅ Motor de validación inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando motor de validación:', error);
            throw error;
        }
    }

    // =================================================================
    // SISTEMA DE VALIDACIÓN PRINCIPAL
    // =================================================================

    async validatePriceChange(metal, purity, newPrice, oldPrice, context = {}) {
        const validationResult = {
            isValid: true,
            severity: 'none',
            warnings: [],
            errors: [],
            recommendations: [],
            metadata: {
                metal,
                purity,
                newPrice,
                oldPrice,
                timestamp: Date.now(),
                context
            }
        };

        try {
            // 1. Validación de rangos básicos
            this.validatePriceRange(validationResult);

            // 2. Validación de desviación del mercado
            this.validateMarketDeviation(validationResult);

            // 3. Validación de límites diarios
            this.validateDailyLimits(validationResult);

            // 4. Validación de patrones sospechosos
            this.validateSuspiciousPatterns(validationResult);

            // 5. Validación de contexto y coherencia
            this.validateContextualCoherence(validationResult);

            // 6. Registrar validación
            this.recordValidation(validationResult);

            // 7. Generar alertas si es necesario
            this.generateAlerts(validationResult);

            return validationResult;

        } catch (error) {
            console.error('❌ Error en validación:', error);
            validationResult.isValid = false;
            validationResult.errors.push(`Error interno de validación: ${error.message}`);
            return validationResult;
        }
    }

    validatePriceRange(result) {
        const { metal, purity, newPrice } = result.metadata;
        const ranges = VALIDATION_CONFIG.priceRanges[metal]?.[purity];

        if (!ranges) {
            result.errors.push(`Configuración de rangos no encontrada para ${metal} ${purity}`);
            result.isValid = false;
            return;
        }

        // Validar mínimo absoluto
        if (newPrice < ranges.min) {
            result.errors.push(
                `Precio ${newPrice.toFixed(2)} está por debajo del mínimo permitido (${ranges.min} MXN/g)`
            );
            result.isValid = false;
            result.severity = 'critical';
        }

        // Validar máximo absoluto
        if (newPrice > ranges.max) {
            result.errors.push(
                `Precio ${newPrice.toFixed(2)} está por encima del máximo permitido (${ranges.max} MXN/g)`
            );
            result.isValid = false;
            result.severity = 'critical';
        }

        // Validar cercanía a límites
        const minBuffer = ranges.min * 1.1; // 10% buffer sobre mínimo
        const maxBuffer = ranges.max * 0.9; // 10% buffer bajo máximo

        if (newPrice < minBuffer) {
            result.warnings.push(
                `Precio ${newPrice.toFixed(2)} está muy cerca del límite mínimo (${ranges.min} MXN/g)`
            );
            result.severity = this.escalateSeverity(result.severity, 'high');
        }

        if (newPrice > maxBuffer) {
            result.warnings.push(
                `Precio ${newPrice.toFixed(2)} está muy cerca del límite máximo (${ranges.max} MXN/g)`
            );
            result.severity = this.escalateSeverity(result.severity, 'high');
        }
    }

    validateMarketDeviation(result) {
        const { metal, purity, newPrice } = result.metadata;
        const ranges = VALIDATION_CONFIG.priceRanges[metal]?.[purity];
        
        if (!ranges?.market) return;

        const marketPrice = ranges.market;
        const deviation = Math.abs(newPrice - marketPrice) / marketPrice;
        const deviationPercent = deviation * 100;

        // Clasificar desviación
        if (deviation >= VALIDATION_CONFIG.alertThresholds.extreme) {
            result.warnings.push(
                `DESVIACIÓN EXTREMA: El precio difiere ${deviationPercent.toFixed(1)}% del mercado (${marketPrice.toFixed(2)} MXN/g). Verificar justificación.`
            );
            result.severity = this.escalateSeverity(result.severity, 'critical');
            result.recommendations.push('Revisar cálculos y justificación para esta desviación extrema');
        } else if (deviation >= VALIDATION_CONFIG.alertThresholds.high) {
            result.warnings.push(
                `Desviación alta: El precio difiere ${deviationPercent.toFixed(1)}% del mercado (${marketPrice.toFixed(2)} MXN/g)`
            );
            result.severity = this.escalateSeverity(result.severity, 'high');
            result.recommendations.push('Verificar razones comerciales para esta desviación');
        } else if (deviation >= VALIDATION_CONFIG.alertThresholds.moderate) {
            result.warnings.push(
                `Desviación moderada: El precio difiere ${deviationPercent.toFixed(1)}% del mercado (${marketPrice.toFixed(2)} MXN/g)`
            );
            result.severity = this.escalateSeverity(result.severity, 'moderate');
        }

        // Análisis de dirección de la desviación
        if (newPrice > marketPrice) {
            if (deviation >= VALIDATION_CONFIG.alertThresholds.moderate) {
                result.recommendations.push('Precio por encima del mercado - verificar margen de ganancia');
            }
        } else {
            if (deviation >= VALIDATION_CONFIG.alertThresholds.moderate) {
                result.recommendations.push('Precio por debajo del mercado - verificar impacto en rentabilidad');
            }
        }
    }

    validateDailyLimits(result) {
        // Verificar límite general
        if (this.dailyStats.totalChanges >= VALIDATION_CONFIG.dailyLimits.maxChanges) {
            result.errors.push(
                `Límite diario de cambios alcanzado (${VALIDATION_CONFIG.dailyLimits.maxChanges})`
            );
            result.isValid = false;
            result.severity = 'critical';
            return;
        }

        // Advertencia cuando se acerca al límite
        if (this.dailyStats.totalChanges >= VALIDATION_CONFIG.dailyLimits.warningThreshold) {
            result.warnings.push(
                `Acercándose al límite diario: ${this.dailyStats.totalChanges}/${VALIDATION_CONFIG.dailyLimits.maxChanges} cambios`
            );
            result.severity = this.escalateSeverity(result.severity, 'moderate');
        }

        // Verificar límite de cambios extremos
        const severity = result.severity;
        if (severity === 'critical' || severity === 'high') {
            if (this.dailyStats.extremeChanges >= VALIDATION_CONFIG.dailyLimits.maxExtremeChanges) {
                result.errors.push(
                    `Límite diario de cambios extremos alcanzado (${VALIDATION_CONFIG.dailyLimits.maxExtremeChanges})`
                );
                result.isValid = false;
                result.severity = 'critical';
            }
        }
    }

    validateSuspiciousPatterns(result) {
        const { metal, purity, newPrice } = result.metadata;
        const now = Date.now();
        const timeWindow = VALIDATION_CONFIG.suspiciousPatterns.timeWindow;

        // Obtener cambios recientes para el mismo metal/purity
        const recentChanges = this.validationHistory.filter(v => 
            v.metadata.metal === metal &&
            v.metadata.purity === purity &&
            (now - v.metadata.timestamp) <= timeWindow
        );

        // Detectar cambios rápidos
        if (recentChanges.length >= VALIDATION_CONFIG.suspiciousPatterns.rapidChanges) {
            result.warnings.push(
                `Patrón sospechoso: ${recentChanges.length} cambios en los últimos 5 minutos para ${metal} ${purity}`
            );
            result.severity = this.escalateSeverity(result.severity, 'high');
            
            this.recordSuspiciousActivity({
                type: 'rapid_changes',
                metal,
                purity,
                count: recentChanges.length,
                timestamp: now
            });
        }

        // Detectar fluctuaciones extremas
        if (recentChanges.length >= 2) {
            const prices = recentChanges.map(v => v.metadata.newPrice);
            prices.push(newPrice);
            
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            const fluctuation = (maxPrice - minPrice) / minPrice;

            if (fluctuation >= VALIDATION_CONFIG.suspiciousPatterns.priceFluctuation) {
                result.warnings.push(
                    `Fluctuación alta detectada: ${(fluctuation * 100).toFixed(1)}% en período corto`
                );
                result.severity = this.escalateSeverity(result.severity, 'moderate');
            }
        }
    }

    validateContextualCoherence(result) {
        const { context, metal, purity, newPrice, oldPrice } = result.metadata;

        // Validar coherencia con razón proporcionada
        if (context.reason) {
            const reasonAnalysis = this.analyzeReason(context.reason, newPrice, oldPrice);
            if (reasonAnalysis.warnings.length > 0) {
                result.warnings.push(...reasonAnalysis.warnings);
                result.severity = this.escalateSeverity(result.severity, reasonAnalysis.severity);
            }
            if (reasonAnalysis.recommendations.length > 0) {
                result.recommendations.push(...reasonAnalysis.recommendations);
            }
        }

        // Validar coherencia con tipo de cambio
        if (context.changeType) {
            const changeAnalysis = this.analyzeChangeType(context.changeType, newPrice, oldPrice);
            if (changeAnalysis.warnings.length > 0) {
                result.warnings.push(...changeAnalysis.warnings);
                result.severity = this.escalateSeverity(result.severity, changeAnalysis.severity);
            }
        }
    }

    // =================================================================
    // ANÁLISIS CONTEXTUAL
    // =================================================================

    analyzeReason(reason, newPrice, oldPrice) {
        const analysis = {
            warnings: [],
            recommendations: [],
            severity: 'none'
        };

        const priceChange = newPrice - (oldPrice || 0);
        const priceChangePercent = oldPrice ? (priceChange / oldPrice) * 100 : 0;

        // Mapeo de razones esperadas vs cambios de precio
        const reasonPatterns = {
            'Promoción especial': { expectedChange: 'negative', minChange: -30 },
            'Cliente mayorista': { expectedChange: 'negative', minChange: -20 },
            'Precio de competencia': { expectedChange: 'either', minChange: -25, maxChange: 10 },
            'Costos adicionales de fabricación': { expectedChange: 'positive', minChange: 5 },
            'Calidad premium del material': { expectedChange: 'positive', minChange: 10 },
            'Urgencia del pedido': { expectedChange: 'positive', minChange: 5 },
            'Liquidación de inventario': { expectedChange: 'negative', minChange: -40 }
        };

        const pattern = reasonPatterns[reason];
        if (pattern) {
            // Verificar dirección del cambio
            if (pattern.expectedChange === 'negative' && priceChange > 0) {
                analysis.warnings.push(
                    `Inconsistencia: "${reason}" normalmente implica reducción de precio, pero se está aumentando`
                );
                analysis.severity = 'moderate';
            } else if (pattern.expectedChange === 'positive' && priceChange < 0) {
                analysis.warnings.push(
                    `Inconsistencia: "${reason}" normalmente implica aumento de precio, pero se está reduciendo`
                );
                analysis.severity = 'moderate';
            }

            // Verificar magnitud del cambio
            if (pattern.minChange && priceChangePercent < pattern.minChange) {
                analysis.recommendations.push(
                    `Para "${reason}", se esperaría un cambio de al menos ${Math.abs(pattern.minChange)}%`
                );
            }

            if (pattern.maxChange && priceChangePercent > pattern.maxChange) {
                analysis.warnings.push(
                    `Cambio de ${priceChangePercent.toFixed(1)}% parece excesivo para "${reason}"`
                );
                analysis.severity = 'moderate';
            }
        }

        return analysis;
    }

    analyzeChangeType(changeType, newPrice, oldPrice) {
        const analysis = {
            warnings: [],
            recommendations: [],
            severity: 'none'
        };

        // Análisis basado en tipo de cambio
        switch (changeType) {
            case 'percentage':
                if (Math.abs(newPrice - oldPrice) / oldPrice > 0.5) {
                    analysis.warnings.push('Cambio porcentual mayor al 50% - verificar cálculo');
                    analysis.severity = 'moderate';
                }
                break;

            case 'fixed_amount':
                const difference = Math.abs(newPrice - oldPrice);
                if (difference > oldPrice * 0.3) {
                    analysis.warnings.push('Cantidad fija representa más del 30% del precio base');
                    analysis.severity = 'moderate';
                }
                break;

            case 'absolute':
                const deviation = Math.abs(newPrice - oldPrice) / oldPrice;
                if (deviation > 0.4) {
                    analysis.warnings.push('Precio absoluto difiere significativamente del precio base');
                    analysis.severity = 'moderate';
                }
                break;
        }

        return analysis;
    }

    // =================================================================
    // SISTEMA DE ALERTAS
    // =================================================================

    setupAlertSystem() {
        // Crear contenedor de alertas si no existe
        if (!document.getElementById('validation-alerts-container')) {
            const container = document.createElement('div');
            container.id = 'validation-alerts-container';
            container.className = 'validation-alerts-container';
            document.body.appendChild(container);
        }

        // Inyectar estilos CSS
        this.injectAlertStyles();
    }

    generateAlerts(validationResult) {
        const { severity, warnings, errors, recommendations } = validationResult;

        // Alertas por errores críticos
        if (errors.length > 0) {
            this.showAlert({
                type: 'error',
                title: 'Error de Validación',
                messages: errors,
                severity: 'critical',
                persistent: true
            });
        }

        // Alertas por advertencias
        if (warnings.length > 0) {
            this.showAlert({
                type: 'warning',
                title: 'Advertencia de Validación',
                messages: warnings,
                severity: severity,
                persistent: severity === 'critical'
            });
        }

        // Recomendaciones (solo para severidad alta)
        if (recommendations.length > 0 && (severity === 'high' || severity === 'critical')) {
            this.showAlert({
                type: 'info',
                title: 'Recomendaciones',
                messages: recommendations,
                severity: 'moderate',
                persistent: false
            });
        }
    }

    showAlert(alertConfig) {
        const alertId = this.generateAlertId();
        const alert = this.createAlertElement(alertId, alertConfig);
        
        const container = document.getElementById('validation-alerts-container');
        container.appendChild(alert);

        // Activar animación
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Auto-remover si no es persistente
        if (!alertConfig.persistent) {
            setTimeout(() => {
                this.removeAlert(alertId);
            }, this.getAlertDuration(alertConfig.severity));
        }

        // Registrar alerta activa
        this.activeAlerts.set(alertId, {
            ...alertConfig,
            timestamp: Date.now(),
            element: alert
        });

        return alertId;
    }

    createAlertElement(alertId, config) {
        const alert = document.createElement('div');
        alert.id = `validation-alert-${alertId}`;
        alert.className = `validation-alert validation-alert-${config.type} severity-${config.severity}`;

        const iconMap = {
            error: '🚨',
            warning: '⚠️',
            info: '💡',
            success: '✅'
        };

        alert.innerHTML = `
            <div class="alert-header">
                <span class="alert-icon">${iconMap[config.type] || '📋'}</span>
                <span class="alert-title">${config.title}</span>
                <button class="alert-close" onclick="pricingValidator.removeAlert('${alertId}')">✕</button>
            </div>
            <div class="alert-body">
                ${config.messages.map(msg => `<div class="alert-message">${msg}</div>`).join('')}
            </div>
            ${config.severity === 'critical' ? '<div class="alert-pulse"></div>' : ''}
        `;

        return alert;
    }

    removeAlert(alertId) {
        const alert = document.getElementById(`validation-alert-${alertId}`);
        if (alert) {
            alert.classList.add('hide');
            setTimeout(() => {
                alert.remove();
                this.activeAlerts.delete(alertId);
            }, 300);
        }
    }

    clearAllAlerts() {
        this.activeAlerts.forEach((_, alertId) => {
            this.removeAlert(alertId);
        });
    }

    // =================================================================
    // UTILIDADES Y HELPERS
    // =================================================================

    escalateSeverity(currentSeverity, newSeverity) {
        const severityLevels = {
            'none': 0,
            'low': 1,
            'moderate': 2,
            'high': 3,
            'critical': 4
        };

        const currentLevel = severityLevels[currentSeverity] || 0;
        const newLevel = severityLevels[newSeverity] || 0;

        return newLevel > currentLevel ? newSeverity : currentSeverity;
    }

    getAlertDuration(severity) {
        const durations = {
            'low': 3000,
            'moderate': 5000,
            'high': 7000,
            'critical': 10000
        };
        return durations[severity] || VALIDATION_CONFIG.alerts.duration;
    }

    generateAlertId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // =================================================================
    // PERSISTENCIA Y GESTIÓN DE DATOS
    // =================================================================

    recordValidation(validationResult) {
        this.validationHistory.unshift(validationResult);

        // Mantener solo las últimas 1000 validaciones
        if (this.validationHistory.length > 1000) {
            this.validationHistory = this.validationHistory.slice(0, 1000);
        }

        // Actualizar estadísticas diarias
        this.updateDailyStats(validationResult);

        // Persistir datos
        this.saveValidationHistory();
        this.saveDailyStats();
    }

    recordSuspiciousActivity(activity) {
        this.suspiciousActivityLog.unshift(activity);

        // Mantener solo las últimas 100 actividades sospechosas
        if (this.suspiciousActivityLog.length > 100) {
            this.suspiciousActivityLog = this.suspiciousActivityLog.slice(0, 100);
        }

        this.saveSuspiciousActivityLog();
    }

    updateDailyStats(validationResult) {
        const today = new Date().toDateString();
        
        if (this.dailyStats.date !== today) {
            this.resetDailyStats();
        }

        this.dailyStats.totalChanges++;

        if (validationResult.severity === 'critical' || validationResult.severity === 'high') {
            this.dailyStats.extremeChanges++;
        }

        if (validationResult.errors.length > 0) {
            this.dailyStats.rejectedChanges++;
        }

        if (validationResult.warnings.length > 0) {
            this.dailyStats.warningChanges++;
        }
    }

    loadDailyStats() {
        try {
            const stored = localStorage.getItem('pricing_validation_daily_stats');
            if (stored) {
                const stats = JSON.parse(stored);
                const today = new Date().toDateString();
                
                if (stats.date === today) {
                    return stats;
                }
            }
        } catch (error) {
            console.warn('Error cargando estadísticas diarias:', error);
        }

        return this.createDefaultDailyStats();
    }

    createDefaultDailyStats() {
        return {
            date: new Date().toDateString(),
            totalChanges: 0,
            extremeChanges: 0,
            rejectedChanges: 0,
            warningChanges: 0,
            lastReset: Date.now()
        };
    }

    resetDailyStats() {
        this.dailyStats = this.createDefaultDailyStats();
        this.saveDailyStats();
    }

    saveDailyStats() {
        try {
            localStorage.setItem('pricing_validation_daily_stats', JSON.stringify(this.dailyStats));
        } catch (error) {
            console.error('Error guardando estadísticas diarias:', error);
        }
    }

    loadValidationHistory() {
        try {
            const stored = localStorage.getItem('pricing_validation_history');
            if (stored) {
                this.validationHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Error cargando historial de validaciones:', error);
            this.validationHistory = [];
        }
    }

    saveValidationHistory() {
        try {
            localStorage.setItem('pricing_validation_history', JSON.stringify(this.validationHistory));
        } catch (error) {
            console.error('Error guardando historial de validaciones:', error);
        }
    }

    saveSuspiciousActivityLog() {
        try {
            localStorage.setItem('pricing_suspicious_activity', JSON.stringify(this.suspiciousActivityLog));
        } catch (error) {
            console.error('Error guardando log de actividad sospechosa:', error);
        }
    }

    // =================================================================
    // API PÚBLICA
    // =================================================================

    getValidationStats() {
        return {
            dailyStats: { ...this.dailyStats },
            historySize: this.validationHistory.length,
            suspiciousActivities: this.suspiciousActivityLog.length,
            activeAlerts: this.activeAlerts.size,
            lastValidation: this.validationHistory[0]?.metadata.timestamp || null
        };
    }

    getValidationHistory(filters = {}) {
        let filtered = [...this.validationHistory];

        if (filters.metal) {
            filtered = filtered.filter(v => v.metadata.metal === filters.metal);
        }

        if (filters.severity) {
            filtered = filtered.filter(v => v.severity === filters.severity);
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(v => v.metadata.timestamp >= filters.dateFrom);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(v => v.metadata.timestamp <= filters.dateTo);
        }

        return filtered.slice(0, filters.limit || 50);
    }

    getSuspiciousActivities(limit = 20) {
        return this.suspiciousActivityLog.slice(0, limit);
    }

    // =================================================================
    // ESTILOS CSS PARA ALERTAS
    // =================================================================

    injectAlertStyles() {
        if (document.getElementById('validation-alert-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'validation-alert-styles';
        styles.textContent = `
            .validation-alerts-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }

            .validation-alert {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }

            .validation-alert.show {
                opacity: 1;
                transform: translateX(0);
            }

            .validation-alert.hide {
                opacity: 0;
                transform: translateX(100%);
            }

            .validation-alert-error {
                border-left: 4px solid #e74c3c;
            }

            .validation-alert-warning {
                border-left: 4px solid #f39c12;
            }

            .validation-alert-info {
                border-left: 4px solid #3498db;
            }

            .validation-alert-success {
                border-left: 4px solid #27ae60;
            }

            .severity-critical {
                animation: pulse-red 2s infinite;
            }

            .severity-high {
                border-left-width: 6px;
            }

            .alert-header {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }

            .alert-icon {
                font-size: 1.2em;
            }

            .alert-title {
                font-weight: 600;
                color: #2c3e50;
                flex: 1;
            }

            .alert-close {
                background: none;
                border: none;
                font-size: 1.1em;
                color: #95a5a6;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .alert-close:hover {
                background: #ecf0f1;
                color: #7f8c8d;
            }

            .alert-body {
                padding: 12px 16px;
            }

            .alert-message {
                color: #495057;
                line-height: 1.4;
                margin-bottom: 8px;
                font-size: 0.9em;
            }

            .alert-message:last-child {
                margin-bottom: 0;
            }

            .alert-pulse {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #e74c3c, transparent);
                animation: pulse-bar 1.5s infinite;
            }

            @keyframes pulse-red {
                0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                50% { box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3); }
            }

            @keyframes pulse-bar {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            @media (max-width: 768px) {
                .validation-alerts-container {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }

                .validation-alert {
                    transform: translateY(-100%);
                }

                .validation-alert.show {
                    transform: translateY(0);
                }

                .validation-alert.hide {
                    transform: translateY(-100%);
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.pricingValidator = new PricingValidationEngine();

    // Integrar con sistema de overrides si existe
    if (window.advancedManualPricingOverride) {
        window.advancedManualPricingOverride.addObserver((event, data) => {
            if (event === 'override_created' || event === 'override_updated') {
                window.pricingValidator.validatePriceChange(
                    data.metal,
                    data.purity,
                    data.finalPrice,
                    data.basePrice,
                    {
                        reason: data.reason,
                        changeType: data.overrideType,
                        user: data.createdBy || data.updatedBy
                    }
                );
            }
        });
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PricingValidationEngine,
        VALIDATION_CONFIG
    };
}

console.log('✅ Motor de Validación de Precios v1.0 cargado correctamente');
console.log('🔍 Acceso: window.pricingValidator');
console.log('📊 Estadísticas: window.pricingValidator.getValidationStats()');