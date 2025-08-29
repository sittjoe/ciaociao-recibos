// rate-limiting-system.js - SISTEMA DE RATE LIMITING Y MONITOREO DE CUOTAS v1.0
// Protección contra sobrecarga de APIs y control de costos
// =================================================================

console.log('🚥 Iniciando Sistema de Rate Limiting v1.0...');

// =================================================================
// CONFIGURACIÓN DEL RATE LIMITING
// =================================================================

const RATE_LIMIT_CONFIG = {
    // Configuración por API
    apis: {
        'metals-api': {
            name: 'Metals-API',
            tiers: {
                free: {
                    requestsPerMinute: 10,
                    requestsPerHour: 100,
                    requestsPerDay: 1000,
                    requestsPerMonth: 1000,
                    cost: 0
                },
                bronze: {
                    requestsPerMinute: 50,
                    requestsPerHour: 1000,
                    requestsPerDay: 10000,
                    requestsPerMonth: 100000,
                    cost: 9.99
                },
                silver: {
                    requestsPerMinute: 100,
                    requestsPerHour: 5000,
                    requestsPerDay: 50000,
                    requestsPerMonth: 500000,
                    cost: 49.99
                }
            },
            currentTier: 'free',
            warningThresholds: {
                yellow: 0.7,  // 70% de uso
                orange: 0.85, // 85% de uso
                red: 0.95     // 95% de uso
            }
        },
        'metalprice-api': {
            name: 'MetalpriceAPI',
            tiers: {
                free: {
                    requestsPerMinute: 5,
                    requestsPerHour: 100,
                    requestsPerDay: 100,
                    requestsPerMonth: 100,
                    cost: 0
                },
                starter: {
                    requestsPerMinute: 60,
                    requestsPerHour: 1000,
                    requestsPerDay: 10000,
                    requestsPerMonth: 100000,
                    cost: 19.99
                }
            },
            currentTier: 'free',
            warningThresholds: {
                yellow: 0.7,
                orange: 0.85,
                red: 0.95
            }
        },
        'exchange-api': {
            name: 'ExchangeRate-API',
            tiers: {
                free: {
                    requestsPerMinute: 30,
                    requestsPerHour: 1000,
                    requestsPerDay: 1500,
                    requestsPerMonth: 1500,
                    cost: 0
                }
            },
            currentTier: 'free',
            warningThresholds: {
                yellow: 0.7,
                orange: 0.85,
                red: 0.95
            }
        }
    },

    // Configuración de ventanas de tiempo
    timeWindows: {
        minute: 60 * 1000,      // 1 minuto
        hour: 60 * 60 * 1000,   // 1 hora
        day: 24 * 60 * 60 * 1000, // 1 día
        month: 30 * 24 * 60 * 60 * 1000 // 30 días
    },

    // Configuración de alertas
    alerting: {
        enableNotifications: true,
        enableEmail: false,
        enableSlack: false,
        cooldownPeriod: 15 * 60 * 1000 // 15 minutos entre alertas del mismo tipo
    },

    // Configuración de persistencia
    persistence: {
        localStoragePrefix: 'rate_limit_',
        backupInterval: 5 * 60 * 1000, // 5 minutos
        retentionDays: 30
    }
};

// =================================================================
// CLASE PRINCIPAL DE RATE LIMITING
// =================================================================

class RateLimitManager {
    constructor() {
        this.counters = new Map();
        this.alerts = new Map();
        this.lastAlerts = new Map();
        this.isInitialized = false;
        this.observers = [];
        
        // Inicializar contadores para cada API
        this.initializeCounters();
        
        // Configurar persistencia
        this.setupPersistence();
        
        // Configurar limpieza automática
        this.setupCleanup();
    }

    initializeCounters() {
        Object.keys(RATE_LIMIT_CONFIG.apis).forEach(apiKey => {
            this.counters.set(apiKey, {
                minute: [],
                hour: [],
                day: [],
                month: [],
                totalRequests: 0,
                lastReset: {
                    minute: Date.now(),
                    hour: Date.now(),
                    day: Date.now(),
                    month: Date.now()
                }
            });
        });

        console.log('🔄 Contadores de rate limiting inicializados');
    }

    setupPersistence() {
        // Cargar datos persistidos
        this.loadPersistedData();
        
        // Configurar auto-guardado
        setInterval(() => {
            this.persistData();
        }, RATE_LIMIT_CONFIG.persistence.backupInterval);
    }

    setupCleanup() {
        // Limpiar contadores expirados cada minuto
        setInterval(() => {
            this.cleanupExpiredCounters();
        }, 60 * 1000);
    }

    // =================================================================
    // MÉTODOS PRINCIPALES DE RATE LIMITING
    // =================================================================

    async checkRateLimit(apiKey, operation = 'default') {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        if (!apiConfig) {
            console.warn(`API ${apiKey} no configurada en rate limiting`);
            return { allowed: true, status: 'unknown' };
        }

        const currentTier = apiConfig.tiers[apiConfig.currentTier];
        const counter = this.counters.get(apiKey);
        const now = Date.now();

        // Limpiar contadores expirados
        this.cleanupCountersForAPI(apiKey, now);

        // Verificar límites en todas las ventanas de tiempo
        const checks = {
            minute: this.checkWindow(counter.minute, currentTier.requestsPerMinute, now, RATE_LIMIT_CONFIG.timeWindows.minute),
            hour: this.checkWindow(counter.hour, currentTier.requestsPerHour, now, RATE_LIMIT_CONFIG.timeWindows.hour),
            day: this.checkWindow(counter.day, currentTier.requestsPerDay, now, RATE_LIMIT_CONFIG.timeWindows.day),
            month: this.checkWindow(counter.month, currentTier.requestsPerMonth, now, RATE_LIMIT_CONFIG.timeWindows.month)
        };

        // Encontrar la restricción más estricta
        const mostRestrictive = Object.entries(checks).reduce((prev, [window, check]) => {
            if (!check.allowed) {
                return { window, ...check };
            }
            if (check.usage > prev.usage) {
                return { window, ...check };
            }
            return prev;
        }, { window: 'minute', allowed: true, usage: 0 });

        // Determinar si está permitido
        const allowed = Object.values(checks).every(check => check.allowed);

        // Registrar uso si está permitido
        if (allowed) {
            this.recordUsage(apiKey, now, operation);
        }

        // Verificar y enviar alertas
        this.checkAndSendAlerts(apiKey, mostRestrictive.usage);

        return {
            allowed: allowed,
            apiKey: apiKey,
            tier: apiConfig.currentTier,
            usage: mostRestrictive.usage,
            window: mostRestrictive.window,
            limits: currentTier,
            checks: checks,
            nextResetTime: this.getNextResetTime(mostRestrictive.window),
            operation: operation
        };
    }

    checkWindow(windowCounters, limit, now, windowSize) {
        // Filtrar requests dentro de la ventana
        const validRequests = windowCounters.filter(timestamp => now - timestamp < windowSize);
        const usage = validRequests.length / limit;
        
        return {
            allowed: validRequests.length < limit,
            current: validRequests.length,
            limit: limit,
            usage: usage,
            remaining: Math.max(0, limit - validRequests.length)
        };
    }

    recordUsage(apiKey, timestamp, operation = 'default') {
        const counter = this.counters.get(apiKey);
        if (!counter) return;

        // Agregar timestamp a todas las ventanas
        counter.minute.push(timestamp);
        counter.hour.push(timestamp);
        counter.day.push(timestamp);
        counter.month.push(timestamp);
        counter.totalRequests++;

        // Notificar observadores
        this.notifyObservers('usage_recorded', {
            apiKey: apiKey,
            timestamp: timestamp,
            operation: operation,
            totalRequests: counter.totalRequests
        });

        console.log(`📊 Uso registrado para ${apiKey}: ${operation} (total: ${counter.totalRequests})`);
    }

    // =================================================================
    // SISTEMA DE ALERTAS
    // =================================================================

    checkAndSendAlerts(apiKey, usagePercent) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        const thresholds = apiConfig.warningThresholds;
        const now = Date.now();
        
        // Determinar nivel de alerta
        let alertLevel = null;
        if (usagePercent >= thresholds.red) {
            alertLevel = 'red';
        } else if (usagePercent >= thresholds.orange) {
            alertLevel = 'orange';
        } else if (usagePercent >= thresholds.yellow) {
            alertLevel = 'yellow';
        }

        if (!alertLevel) return;

        // Verificar cooldown
        const lastAlert = this.lastAlerts.get(`${apiKey}_${alertLevel}`);
        if (lastAlert && (now - lastAlert) < RATE_LIMIT_CONFIG.alerting.cooldownPeriod) {
            return; // Está en cooldown
        }

        // Enviar alerta
        this.sendAlert(apiKey, alertLevel, usagePercent);
        this.lastAlerts.set(`${apiKey}_${alertLevel}`, now);
    }

    sendAlert(apiKey, level, usagePercent) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        const alert = {
            timestamp: Date.now(),
            apiKey: apiKey,
            apiName: apiConfig.name,
            level: level,
            usagePercent: usagePercent,
            tier: apiConfig.currentTier,
            message: this.generateAlertMessage(apiKey, level, usagePercent)
        };

        // Guardar alerta
        if (!this.alerts.has(apiKey)) {
            this.alerts.set(apiKey, []);
        }
        this.alerts.get(apiKey).push(alert);

        // Enviar notificaciones
        this.triggerNotifications(alert);

        // Notificar observadores
        this.notifyObservers('alert_triggered', alert);

        console.warn(`🚨 Alerta ${level.toUpperCase()} para ${apiConfig.name}: ${usagePercent.toFixed(1)}% de uso`);
    }

    generateAlertMessage(apiKey, level, usagePercent) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        const messages = {
            yellow: `${apiConfig.name} ha alcanzado el ${usagePercent.toFixed(1)}% de su límite de uso. Considere monitorear el consumo.`,
            orange: `${apiConfig.name} está cerca del límite: ${usagePercent.toFixed(1)}% de uso. Considere reducir la frecuencia de requests.`,
            red: `${apiConfig.name} está muy cerca del límite: ${usagePercent.toFixed(1)}% de uso. ¡Riesgo de bloqueo inmediato!`
        };
        
        return messages[level] || `Alerta para ${apiConfig.name}`;
    }

    triggerNotifications(alert) {
        if (!RATE_LIMIT_CONFIG.alerting.enableNotifications) return;

        // Notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Rate Limit Alert: ${alert.apiName}`, {
                body: alert.message,
                icon: this.getAlertIcon(alert.level),
                tag: `rate-limit-${alert.apiKey}-${alert.level}`
            });
        }

        // Notificación visual en la interfaz
        this.showVisualAlert(alert);
    }

    showVisualAlert(alert) {
        // Crear elemento de alerta visual
        const alertElement = document.createElement('div');
        alertElement.className = `rate-limit-alert alert-${alert.level}`;
        alertElement.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getAlertEmoji(alert.level)}</span>
                <span class="alert-text">${alert.message}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Insertar en el DOM
        document.body.insertAdjacentElement('afterbegin', alertElement);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 10000);
    }

    getAlertIcon(level) {
        const icons = {
            yellow: '⚠️',
            orange: '⚠️',
            red: '🚨'
        };
        return icons[level] || '📊';
    }

    getAlertEmoji(level) {
        return this.getAlertIcon(level);
    }

    // =================================================================
    // GESTIÓN DE CONTADORES
    // =================================================================

    cleanupCountersForAPI(apiKey, now) {
        const counter = this.counters.get(apiKey);
        if (!counter) return;

        // Limpiar cada ventana de tiempo
        Object.keys(RATE_LIMIT_CONFIG.timeWindows).forEach(window => {
            const windowSize = RATE_LIMIT_CONFIG.timeWindows[window];
            counter[window] = counter[window].filter(timestamp => now - timestamp < windowSize);
        });
    }

    cleanupExpiredCounters() {
        const now = Date.now();
        
        this.counters.forEach((counter, apiKey) => {
            this.cleanupCountersForAPI(apiKey, now);
        });

        // Limpiar alertas antiguas (mantener solo 24 horas)
        this.alerts.forEach((alertList, apiKey) => {
            const cutoff = now - (24 * 60 * 60 * 1000);
            this.alerts.set(apiKey, alertList.filter(alert => alert.timestamp > cutoff));
        });
    }

    getNextResetTime(window) {
        const now = Date.now();
        const windowSize = RATE_LIMIT_CONFIG.timeWindows[window];
        
        switch (window) {
            case 'minute':
                return now + (60 * 1000 - (now % (60 * 1000)));
            case 'hour':
                return now + (60 * 60 * 1000 - (now % (60 * 60 * 1000)));
            case 'day':
                const nextDay = new Date(now);
                nextDay.setHours(24, 0, 0, 0);
                return nextDay.getTime();
            case 'month':
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
                nextMonth.setHours(0, 0, 0, 0);
                return nextMonth.getTime();
            default:
                return now + windowSize;
        }
    }

    // =================================================================
    // MÉTODOS DE CONFIGURACIÓN
    // =================================================================

    setAPITier(apiKey, tierName) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        if (!apiConfig) {
            throw new Error(`API ${apiKey} no configurada`);
        }

        if (!apiConfig.tiers[tierName]) {
            throw new Error(`Tier ${tierName} no existe para ${apiKey}`);
        }

        apiConfig.currentTier = tierName;
        console.log(`📊 ${apiConfig.name} configurado para tier: ${tierName}`);
        
        // Persistir cambio
        this.persistData();
        
        // Notificar observadores
        this.notifyObservers('tier_changed', {
            apiKey: apiKey,
            newTier: tierName,
            limits: apiConfig.tiers[tierName]
        });
    }

    updateAPILimits(apiKey, customLimits) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        if (!apiConfig) {
            throw new Error(`API ${apiKey} no configurada`);
        }

        // Crear tier personalizado
        apiConfig.tiers.custom = {
            ...apiConfig.tiers[apiConfig.currentTier],
            ...customLimits
        };
        
        apiConfig.currentTier = 'custom';
        console.log(`⚙️ Límites personalizados configurados para ${apiConfig.name}`);
        
        this.persistData();
    }

    // =================================================================
    // MÉTODOS DE CONSULTA Y ESTADÍSTICAS
    // =================================================================

    getUsageStats(apiKey = null) {
        const now = Date.now();
        
        if (apiKey) {
            return this.getAPIUsageStats(apiKey, now);
        }

        // Estadísticas para todas las APIs
        const stats = {};
        this.counters.forEach((counter, key) => {
            stats[key] = this.getAPIUsageStats(key, now);
        });
        
        return stats;
    }

    getAPIUsageStats(apiKey, now) {
        const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
        const counter = this.counters.get(apiKey);
        
        if (!apiConfig || !counter) {
            return null;
        }

        const currentTier = apiConfig.tiers[apiConfig.currentTier];
        const stats = {
            apiKey: apiKey,
            apiName: apiConfig.name,
            tier: apiConfig.currentTier,
            totalRequests: counter.totalRequests,
            limits: currentTier,
            usage: {},
            costs: {
                currentTier: currentTier.cost,
                estimatedMonthlyCost: this.calculateEstimatedCost(apiKey)
            }
        };

        // Calcular uso por ventana de tiempo
        Object.keys(RATE_LIMIT_CONFIG.timeWindows).forEach(window => {
            const windowSize = RATE_LIMIT_CONFIG.timeWindows[window];
            const validRequests = counter[window].filter(timestamp => now - timestamp < windowSize);
            const limit = currentTier[`requestsPer${window.charAt(0).toUpperCase() + window.slice(1)}`];
            
            stats.usage[window] = {
                current: validRequests.length,
                limit: limit,
                usage: validRequests.length / limit,
                remaining: Math.max(0, limit - validRequests.length)
            };
        });

        return stats;
    }

    calculateEstimatedCost(apiKey) {
        const stats = this.getAPIUsageStats(apiKey, Date.now());
        if (!stats) return 0;

        const monthlyUsage = stats.usage.month.current;
        const currentTierCost = stats.costs.currentTier;
        
        // Si está en tier gratuito y se acerca al límite, estimar costo del siguiente tier
        if (currentTierCost === 0 && stats.usage.month.usage > 0.8) {
            const apiConfig = RATE_LIMIT_CONFIG.apis[apiKey];
            const tierNames = Object.keys(apiConfig.tiers);
            const currentIndex = tierNames.indexOf(apiConfig.currentTier);
            
            if (currentIndex < tierNames.length - 1) {
                const nextTier = apiConfig.tiers[tierNames[currentIndex + 1]];
                return nextTier.cost;
            }
        }
        
        return currentTierCost;
    }

    getAlerts(apiKey = null, hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        
        if (apiKey) {
            const alerts = this.alerts.get(apiKey) || [];
            return alerts.filter(alert => alert.timestamp > cutoff);
        }

        // Todas las alertas
        const allAlerts = [];
        this.alerts.forEach((alertList, key) => {
            const filtered = alertList.filter(alert => alert.timestamp > cutoff);
            allAlerts.push(...filtered);
        });
        
        return allAlerts.sort((a, b) => b.timestamp - a.timestamp);
    }

    // =================================================================
    // PERSISTENCIA
    // =================================================================

    persistData() {
        try {
            const data = {
                counters: Object.fromEntries(this.counters),
                alerts: Object.fromEntries(this.alerts),
                lastAlerts: Object.fromEntries(this.lastAlerts),
                config: RATE_LIMIT_CONFIG,
                timestamp: Date.now()
            };

            localStorage.setItem(
                RATE_LIMIT_CONFIG.persistence.localStoragePrefix + 'data',
                JSON.stringify(data)
            );

        } catch (error) {
            console.error('Error persistiendo datos de rate limiting:', error);
        }
    }

    loadPersistedData() {
        try {
            const stored = localStorage.getItem(
                RATE_LIMIT_CONFIG.persistence.localStoragePrefix + 'data'
            );
            
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Verificar que no sea muy antiguo
            const age = Date.now() - data.timestamp;
            const maxAge = RATE_LIMIT_CONFIG.persistence.retentionDays * 24 * 60 * 60 * 1000;
            
            if (age > maxAge) {
                console.log('📊 Datos de rate limiting expirados, iniciando fresh');
                return;
            }

            // Restaurar contadores
            if (data.counters) {
                Object.entries(data.counters).forEach(([apiKey, counter]) => {
                    this.counters.set(apiKey, counter);
                });
            }

            // Restaurar alertas
            if (data.alerts) {
                Object.entries(data.alerts).forEach(([apiKey, alerts]) => {
                    this.alerts.set(apiKey, alerts);
                });
            }

            // Restaurar último tiempo de alertas
            if (data.lastAlerts) {
                Object.entries(data.lastAlerts).forEach(([key, timestamp]) => {
                    this.lastAlerts.set(key, timestamp);
                });
            }

            console.log('📊 Datos de rate limiting restaurados desde persistencia');

        } catch (error) {
            console.error('Error cargando datos persistidos:', error);
        }
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
                callback(event, data);
            } catch (error) {
                console.error('Error en observer de rate limiting:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS ADICIONALES
    // =================================================================

    reset(apiKey = null) {
        if (apiKey) {
            this.counters.set(apiKey, {
                minute: [],
                hour: [],
                day: [],
                month: [],
                totalRequests: 0,
                lastReset: {
                    minute: Date.now(),
                    hour: Date.now(),
                    day: Date.now(),
                    month: Date.now()
                }
            });
            this.alerts.set(apiKey, []);
            console.log(`🔄 Rate limiting reset para ${apiKey}`);
        } else {
            this.initializeCounters();
            this.alerts.clear();
            this.lastAlerts.clear();
            console.log('🔄 Rate limiting reset completo');
        }
        
        this.persistData();
    }

    getSystemHealth() {
        const stats = this.getUsageStats();
        const now = Date.now();
        
        let overallHealth = 'green';
        let criticalAPIs = [];
        
        Object.values(stats).forEach(apiStats => {
            if (!apiStats) return;
            
            const maxUsage = Math.max(
                apiStats.usage.minute?.usage || 0,
                apiStats.usage.hour?.usage || 0,
                apiStats.usage.day?.usage || 0,
                apiStats.usage.month?.usage || 0
            );
            
            if (maxUsage >= 0.95) {
                overallHealth = 'red';
                criticalAPIs.push(apiStats.apiName);
            } else if (maxUsage >= 0.85 && overallHealth !== 'red') {
                overallHealth = 'orange';
            } else if (maxUsage >= 0.7 && overallHealth === 'green') {
                overallHealth = 'yellow';
            }
        });
        
        return {
            status: overallHealth,
            timestamp: now,
            criticalAPIs: criticalAPIs,
            totalAPIs: Object.keys(stats).length,
            recentAlerts: this.getAlerts(null, 1).length // Alertas en la última hora
        };
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.rateLimitManager = new RateLimitManager();

// Integrar con sistema principal de APIs
if (window.kitcoPricing) {
    // Sobrescribir fetch para incluir rate limiting
    const originalFetch = window.kitcoPricing.fetchLatestPrices;
    
    window.kitcoPricing.fetchLatestPricesWithRateLimit = async function(symbols, useBackup = false) {
        const apiKey = useBackup ? 'metalprice-api' : 'metals-api';
        
        // Verificar rate limit
        const rateLimitResult = await window.rateLimitManager.checkRateLimit(apiKey, 'fetch_metals');
        
        if (!rateLimitResult.allowed) {
            const error = new Error(`Rate limit excedido para ${apiKey}. Próximo reset: ${new Date(rateLimitResult.nextResetTime).toLocaleString()}`);
            error.rateLimitInfo = rateLimitResult;
            throw error;
        }
        
        // Proceder con la llamada original
        try {
            const result = await originalFetch.call(this, symbols, useBackup);
            return {
                ...result,
                rateLimitInfo: rateLimitResult
            };
        } catch (error) {
            // En caso de error, no contar el uso
            console.warn('Error en API call, no se contabiliza en rate limit');
            throw error;
        }
    };
}

// Configurar CSS para alertas visuales
const alertStyles = `
<style>
.rate-limit-alert {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    animation: slideIn 0.3s ease-out;
}

.rate-limit-alert.alert-yellow {
    background: #FFF3CD;
    border-left: 4px solid #FFC107;
    color: #856404;
}

.rate-limit-alert.alert-orange {
    background: #FCF8E3;
    border-left: 4px solid #FF9800;
    color: #8A6914;
}

.rate-limit-alert.alert-red {
    background: #F8D7DA;
    border-left: 4px solid #DC3545;
    color: #721C24;
}

.alert-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 8px;
}

.alert-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.alert-text {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
}

.alert-close {
    background: none;
    border: none;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.alert-close:hover {
    opacity: 1;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
</style>
`;

// Inyectar estilos
if (!document.head.querySelector('#rate-limit-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'rate-limit-styles';
    styleElement.innerHTML = alertStyles;
    document.head.appendChild(styleElement);
}

// Solicitar permisos de notificación
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimitManager;
}

console.log('✅ Sistema de Rate Limiting v1.0 cargado correctamente');
console.log('📊 Ver estadísticas: window.rateLimitManager.getUsageStats()');
console.log('🚨 Ver alertas: window.rateLimitManager.getAlerts()');
console.log('🏥 Estado del sistema: window.rateLimitManager.getSystemHealth()');