// monitoring-system.js - SISTEMA DE MONITOREO Y ALERTAS EN TIEMPO REAL
// Detecta errores, problemas de rendimiento y estado del sistema

class RealTimeMonitoringSystem {
    constructor() {
        this.metrics = {
            errors: [],
            performance: {},
            userActions: [],
            systemHealth: {},
            alerts: []
        };
        
        this.thresholds = {
            maxErrorsPerMinute: 5,
            maxLoadTime: 2000,
            maxMemoryUsage: 100000000, // 100MB
            minSuccessRate: 95
        };
        
        this.monitoring = {
            active: true,
            interval: null,
            errorCount: 0,
            lastErrorTime: 0
        };
        
        this.startMonitoring();
        this.setupErrorDetection();
        this.setupPerformanceMonitoring();
        this.setupUserActionTracking();
        
        console.log('📊 [MONITOR] Sistema de monitoreo en tiempo real iniciado');
    }

    startMonitoring() {
        // Monitoreo cada 5 segundos
        this.monitoring.interval = setInterval(() => {
            this.collectMetrics();
            this.analyzeSystemHealth();
            this.checkThresholds();
        }, 5000);

        console.log('🔄 [MONITOR] Monitoreo continuo activado (5s intervals)');
    }

    setupErrorDetection() {
        // Captura errores globales
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                url: window.location.href
            });
        });

        // Captura promises rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: Date.now(),
                url: window.location.href
            });
        });

        // Interceptar console.error para captura adicional
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.recordError({
                type: 'console',
                message: args.join(' '),
                timestamp: Date.now(),
                url: window.location.href
            });
            originalConsoleError.apply(console, args);
        };

        console.log('🚨 [MONITOR] Detección de errores configurada');
    }

    setupPerformanceMonitoring() {
        // Monitorear navegación y recursos
        if ('PerformanceObserver' in window) {
            // Monitorear cargas de recursos
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > this.thresholds.maxLoadTime) {
                        this.recordAlert({
                            type: 'performance',
                            severity: 'warning',
                            message: `Recurso lento: ${entry.name} (${entry.duration.toFixed(2)}ms)`,
                            data: { resource: entry.name, duration: entry.duration }
                        });
                    }
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });

            // Monitorear métricas de navegación
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.performance.navigation = {
                        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                        loadComplete: entry.loadEventEnd - entry.loadEventStart,
                        firstPaint: entry.loadEventEnd - entry.fetchStart
                    };
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });
        }

        // Monitorear memoria (si está disponible)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.performance.memory = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit
                };

                if (memory.usedJSHeapSize > this.thresholds.maxMemoryUsage) {
                    this.recordAlert({
                        type: 'memory',
                        severity: 'warning',
                        message: `Alto uso de memoria: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                        data: { memoryUsage: memory.usedJSHeapSize }
                    });
                }
            }, 10000); // Cada 10 segundos
        }

        console.log('📈 [MONITOR] Monitoreo de rendimiento configurado');
    }

    setupUserActionTracking() {
        // Rastrear clics críticos
        const criticalButtons = [
            'addProductBtn',
            'generateQuotationPdfBtn', 
            'saveProductBtn',
            'resetQuotationBtn'
        ];

        criticalButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.recordUserAction({
                        type: 'click',
                        element: buttonId,
                        timestamp: Date.now(),
                        success: true // Se actualiza si hay error
                    });
                });
            }
        });

        // Rastrear envíos de formulario
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                this.recordUserAction({
                    type: 'form_submit',
                    form: form.id || 'unnamed',
                    timestamp: Date.now()
                });
            });
        });

        console.log('👤 [MONITOR] Tracking de acciones de usuario configurado');
    }

    recordError(error) {
        this.metrics.errors.push(error);
        this.monitoring.errorCount++;
        this.monitoring.lastErrorTime = Date.now();

        // Mantener solo los últimos 100 errores
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }

        // Alerta inmediata para errores críticos
        if (error.type === 'javascript' && error.message) {
            this.recordAlert({
                type: 'error',
                severity: 'error',
                message: `Error JavaScript: ${error.message}`,
                data: error
            });
        }

        console.error('🚨 [MONITOR] Error registrado:', error);
        
        // Trigger análisis inmediato si hay muchos errores
        if (this.getRecentErrors().length >= this.thresholds.maxErrorsPerMinute) {
            this.triggerEmergencyAnalysis();
        }
    }

    recordUserAction(action) {
        this.metrics.userActions.push(action);
        
        // Mantener solo las últimas 50 acciones
        if (this.metrics.userActions.length > 50) {
            this.metrics.userActions = this.metrics.userActions.slice(-50);
        }

        console.log('👤 [MONITOR] Acción registrada:', action);
    }

    recordAlert(alert) {
        alert.timestamp = Date.now();
        alert.id = this.generateAlertId();
        
        this.metrics.alerts.push(alert);
        
        // Mantener solo las últimas 50 alertas
        if (this.metrics.alerts.length > 50) {
            this.metrics.alerts = this.metrics.alerts.slice(-50);
        }

        console.warn(`🔔 [ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
        
        // Mostrar alerta crítica al usuario
        if (alert.severity === 'error' || alert.severity === 'critical') {
            this.showUserAlert(alert);
        }
    }

    collectMetrics() {
        // Métricas del sistema de cotizaciones
        this.metrics.systemHealth = {
            quotationSystemReady: window.quotationSystemReady || false,
            systemManagerAvailable: typeof window.systemManager === 'object',
            authSystemInitialized: window.authSystemInitialized || false,
            quotationDatabaseAvailable: typeof window.quotationDB === 'object',
            criticalElementsVisible: this.checkCriticalElements(),
            timestamp: Date.now()
        };

        // Métricas de rendimiento actuales
        if (window.systemPerformance) {
            this.metrics.performance.systemPerformance = window.systemPerformance;
        }

        // Métricas de conexión
        if (navigator.connection) {
            this.metrics.performance.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
    }

    analyzeSystemHealth() {
        const health = this.metrics.systemHealth;
        let healthScore = 0;
        let maxScore = 0;

        // Evaluar componentes críticos
        const checks = [
            { key: 'quotationSystemReady', weight: 25, name: 'Sistema de Cotizaciones' },
            { key: 'systemManagerAvailable', weight: 20, name: 'System Manager' },
            { key: 'authSystemInitialized', weight: 15, name: 'Sistema de Autenticación' },
            { key: 'quotationDatabaseAvailable', weight: 15, name: 'Base de Datos' },
            { key: 'criticalElementsVisible', weight: 25, name: 'Elementos DOM Críticos' }
        ];

        checks.forEach(check => {
            maxScore += check.weight;
            if (health[check.key]) {
                healthScore += check.weight;
            } else {
                this.recordAlert({
                    type: 'health',
                    severity: 'warning',
                    message: `Componente no saludable: ${check.name}`,
                    data: { component: check.key, status: health[check.key] }
                });
            }
        });

        const healthPercentage = (healthScore / maxScore) * 100;
        this.metrics.systemHealth.healthScore = healthPercentage;

        if (healthPercentage < 80) {
            this.recordAlert({
                type: 'system',
                severity: healthPercentage < 50 ? 'critical' : 'warning',
                message: `Salud del sistema baja: ${healthPercentage.toFixed(1)}%`,
                data: { healthScore: healthPercentage }
            });
        }
    }

    checkCriticalElements() {
        const criticalElements = [
            'quotationNumber',
            'addProductBtn',
            'quotationForm',
            'productsList'
        ];

        const visible = criticalElements.filter(id => {
            const element = document.getElementById(id);
            return element && element.offsetParent !== null;
        });

        return visible.length === criticalElements.length;
    }

    checkThresholds() {
        // Verificar errores por minuto
        const recentErrors = this.getRecentErrors();
        if (recentErrors.length >= this.thresholds.maxErrorsPerMinute) {
            this.recordAlert({
                type: 'threshold',
                severity: 'critical',
                message: `Demasiados errores: ${recentErrors.length} en el último minuto`,
                data: { errorCount: recentErrors.length }
            });
        }

        // Verificar tasa de éxito de acciones del usuario
        const recentActions = this.getRecentUserActions();
        if (recentActions.length > 5) {
            const successfulActions = recentActions.filter(action => action.success !== false);
            const successRate = (successfulActions.length / recentActions.length) * 100;
            
            if (successRate < this.thresholds.minSuccessRate) {
                this.recordAlert({
                    type: 'threshold',
                    severity: 'warning',
                    message: `Baja tasa de éxito: ${successRate.toFixed(1)}%`,
                    data: { successRate }
                });
            }
        }
    }

    getRecentErrors(minutes = 1) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.metrics.errors.filter(error => error.timestamp > cutoff);
    }

    getRecentUserActions(minutes = 5) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.metrics.userActions.filter(action => action.timestamp > cutoff);
    }

    triggerEmergencyAnalysis() {
        console.error('🆘 [MONITOR] ANÁLISIS DE EMERGENCIA ACTIVADO');
        
        const emergencyReport = {
            timestamp: Date.now(),
            trigger: 'high_error_rate',
            systemHealth: this.metrics.systemHealth,
            recentErrors: this.getRecentErrors(2),
            recentAlerts: this.metrics.alerts.slice(-10),
            systemStatus: this.getSystemStatus()
        };

        // Intentar recuperación automática
        if (window.systemManager && typeof window.systemManager.attemptRecovery === 'function') {
            console.log('🔧 [MONITOR] Iniciando recuperación automática...');
            window.systemManager.attemptRecovery()
                .then(() => {
                    this.recordAlert({
                        type: 'recovery',
                        severity: 'info',
                        message: 'Recuperación automática exitosa',
                        data: emergencyReport
                    });
                })
                .catch((error) => {
                    this.recordAlert({
                        type: 'recovery',
                        severity: 'critical',
                        message: 'Recuperación automática fallida',
                        data: { error: error.message, report: emergencyReport }
                    });
                });
        }

        // Notificar al usuario de problemas graves
        this.showEmergencyNotification(emergencyReport);
    }

    showUserAlert(alert) {
        // Crear notificación temporal para el usuario
        const notification = document.createElement('div');
        notification.className = 'monitoring-alert';
        notification.innerHTML = `
            <div class="alert-content ${alert.severity}">
                <strong>${alert.severity.toUpperCase()}</strong>
                <p>${alert.message}</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Estilos para la alerta
        if (!document.querySelector('#monitoring-styles')) {
            const style = document.createElement('style');
            style.id = 'monitoring-styles';
            style.textContent = `
                .monitoring-alert {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                    max-width: 350px;
                }
                .alert-content {
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    position: relative;
                }
                .alert-content.error { background: #fee; border-left: 4px solid #e74c3c; }
                .alert-content.warning { background: #ffeaa7; border-left: 4px solid #f39c12; }
                .alert-content.critical { background: #e74c3c; color: white; }
                .alert-content button {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: inherit;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remover después de 8 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }

    showEmergencyNotification(report) {
        const notification = document.createElement('div');
        notification.className = 'emergency-notification';
        notification.innerHTML = `
            <div class="emergency-content">
                <h3>🆘 Sistema en Estado Crítico</h3>
                <p>Se han detectado múltiples errores. El sistema está intentando recuperarse automáticamente.</p>
                <div class="emergency-actions">
                    <button onclick="window.location.reload()">🔄 Refrescar Página</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">Continuar</button>
                </div>
                <details>
                    <summary>Detalles Técnicos</summary>
                    <pre>${JSON.stringify(report, null, 2)}</pre>
                </details>
            </div>
        `;

        // Estilos para notificación de emergencia
        const style = document.createElement('style');
        style.textContent = `
            .emergency-notification {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20000;
                font-family: Arial, sans-serif;
            }
            .emergency-content {
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                text-align: center;
            }
            .emergency-actions {
                margin: 20px 0;
            }
            .emergency-actions button {
                margin: 0 10px;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            .emergency-actions button:first-child {
                background: #e74c3c;
                color: white;
            }
            .emergency-actions button:last-child {
                background: #bdc3c7;
                color: #2c3e50;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
    }

    getSystemStatus() {
        return {
            monitoring: this.monitoring,
            metrics: {
                totalErrors: this.metrics.errors.length,
                totalAlerts: this.metrics.alerts.length,
                healthScore: this.metrics.systemHealth.healthScore,
                recentErrorRate: this.getRecentErrors().length
            },
            timestamp: Date.now()
        };
    }

    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Método público para obtener métricas
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }

    // Método público para obtener estado de salud
    getHealthStatus() {
        return {
            healthy: this.metrics.systemHealth.healthScore > 80,
            score: this.metrics.systemHealth.healthScore,
            issues: this.metrics.alerts.filter(alert => 
                alert.severity === 'error' || alert.severity === 'critical'
            ).length
        };
    }

    // Método público para limpiar métricas
    clearMetrics() {
        this.metrics.errors = [];
        this.metrics.alerts = [];
        this.metrics.userActions = [];
        this.monitoring.errorCount = 0;
        
        console.log('🧹 [MONITOR] Métricas limpiadas');
    }

    // Detener monitoreo
    stopMonitoring() {
        if (this.monitoring.interval) {
            clearInterval(this.monitoring.interval);
            this.monitoring.active = false;
            console.log('⏹️ [MONITOR] Monitoreo detenido');
        }
    }
}

// Crear instancia global automáticamente si no existe
if (typeof window !== 'undefined' && !window.realTimeMonitor) {
    window.realTimeMonitor = new RealTimeMonitoringSystem();
    
    // Exponer métricas en consola para debugging
    window.getSystemMetrics = () => window.realTimeMonitor.getMetrics();
    window.getSystemHealth = () => window.realTimeMonitor.getHealthStatus();
    
    console.log('📊 [MONITOR] Sistema de monitoreo en tiempo real activado globalmente');
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeMonitoringSystem;
}