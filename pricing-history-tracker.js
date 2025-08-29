// pricing-history-tracker.js - SISTEMA DE HISTORIAL Y TRACKING v1.0
// Tracking completo de cambios de precios con auditoría avanzada
// =================================================================

console.log('📚 Iniciando Sistema de Historial y Tracking v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE TRACKING
// =================================================================

const TRACKING_CONFIG = {
    // Configuración de almacenamiento
    storage: {
        maxHistoryEntries: 5000,
        maxAuditEntries: 2000,
        maxUserSessions: 100,
        backupInterval: 60 * 60 * 1000, // 1 hora
        compressionThreshold: 1000 // Comprimir después de 1000 entradas
    },

    // Tipos de eventos a trackear
    eventTypes: {
        OVERRIDE_CREATED: 'override_created',
        OVERRIDE_UPDATED: 'override_updated',
        OVERRIDE_DEACTIVATED: 'override_deactivated',
        OVERRIDE_RESTORED: 'override_restored',
        BULK_OPERATION: 'bulk_operation',
        PRICE_INQUIRY: 'price_inquiry',
        SYSTEM_EVENT: 'system_event',
        USER_ACTION: 'user_action',
        VALIDATION_EVENT: 'validation_event',
        EXPORT_IMPORT: 'export_import'
    },

    // Niveles de auditoría
    auditLevels: {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4
    },

    // Configuración de reportes
    reports: {
        defaultTimespan: 30 * 24 * 60 * 60 * 1000, // 30 días
        maxExportEntries: 10000,
        aggregationIntervals: ['day', 'week', 'month']
    },

    // Configuración de alertas
    alerts: {
        unusualActivity: {
            rapidChanges: 10,      // 10 cambios en 1 hora
            timeWindow: 60 * 60 * 1000, // 1 hora
            priceVolatility: 0.25   // 25% volatilidad
        },
        auditTrail: {
            missingEntries: 5,     // 5 entradas faltantes consecutivas
            inconsistentData: 3     // 3 inconsistencias
        }
    }
};

// =================================================================
// CLASE PRINCIPAL DEL SISTEMA DE TRACKING
// =================================================================

class PricingHistoryTracker {
    constructor() {
        this.history = [];
        this.auditTrail = [];
        this.userSessions = new Map();
        this.currentSession = null;
        this.metrics = this.initializeMetrics();
        this.filters = new Map();
        this.eventQueue = [];
        this.isProcessing = false;
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de tracking...');
        
        try {
            this.loadStoredData();
            this.initializeSession();
            this.setupEventProcessing();
            this.setupAutoBackup();
            this.startMetricsCollection();
            
            console.log('✅ Sistema de tracking inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando tracking:', error);
            throw error;
        }
    }

    // =================================================================
    // GESTIÓN DE EVENTOS Y TRACKING
    // =================================================================

    trackEvent(eventType, data, metadata = {}) {
        const event = this.createEvent(eventType, data, metadata);
        
        // Agregar a la cola de procesamiento
        this.eventQueue.push(event);
        
        // Procesar cola si no está ya procesándose
        if (!this.isProcessing) {
            this.processEventQueue();
        }
        
        return event.id;
    }

    createEvent(eventType, data, metadata) {
        const timestamp = Date.now();
        const sessionId = this.currentSession?.id || 'unknown';
        
        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp,
            sessionId,
            userId: metadata.userId || this.getCurrentUserId(),
            data: this.sanitizeData(data),
            metadata: {
                ...metadata,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                ip: metadata.ip || 'unknown',
                source: metadata.source || 'manual_override_system'
            },
            auditLevel: this.determineAuditLevel(eventType, data),
            checksum: this.calculateChecksum(data)
        };

        return event;
    }

    async processEventQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) return;
        
        this.isProcessing = true;
        
        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                await this.processEvent(event);
            }
        } catch (error) {
            console.error('Error procesando cola de eventos:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processEvent(event) {
        try {
            // Agregar al historial principal
            this.addToHistory(event);
            
            // Agregar al trail de auditoría si es necesario
            if (event.auditLevel >= TRACKING_CONFIG.auditLevels.MEDIUM) {
                this.addToAuditTrail(event);
            }
            
            // Actualizar métricas
            this.updateMetrics(event);
            
            // Detectar patrones sospechosos
            this.detectAnomalies(event);
            
            // Triggers de eventos especiales
            this.handleSpecialEvents(event);
            
            // Persistir datos si es necesario
            if (this.shouldPersist(event)) {
                this.persistData();
            }
            
        } catch (error) {
            console.error('Error procesando evento:', error);
            this.trackSystemError(error, event);
        }
    }

    // =================================================================
    // GESTIÓN DE HISTORIAL
    // =================================================================

    addToHistory(event) {
        this.history.unshift(event);
        
        // Mantener límite de entradas
        if (this.history.length > TRACKING_CONFIG.storage.maxHistoryEntries) {
            this.compressOldEntries();
        }
    }

    addToAuditTrail(event) {
        const auditEntry = {
            ...event,
            auditTimestamp: Date.now(),
            previousState: this.getPreviousState(event),
            integrityHash: this.calculateIntegrityHash(event)
        };
        
        this.auditTrail.unshift(auditEntry);
        
        // Mantener límite de auditoría
        if (this.auditTrail.length > TRACKING_CONFIG.storage.maxAuditEntries) {
            this.auditTrail = this.auditTrail.slice(0, TRACKING_CONFIG.storage.maxAuditEntries);
        }
    }

    compressOldEntries() {
        const compressionThreshold = TRACKING_CONFIG.storage.compressionThreshold;
        const toCompress = this.history.slice(compressionThreshold);
        const toKeep = this.history.slice(0, compressionThreshold);
        
        // Comprimir entradas antiguas (mantener solo datos esenciales)
        const compressed = this.compressEntries(toCompress);
        
        this.history = [...toKeep, ...compressed];
    }

    compressEntries(entries) {
        return entries.map(entry => ({
            id: entry.id,
            type: entry.type,
            timestamp: entry.timestamp,
            userId: entry.userId,
            summary: this.createEntrySummary(entry),
            compressed: true
        }));
    }

    createEntrySummary(entry) {
        switch (entry.type) {
            case TRACKING_CONFIG.eventTypes.OVERRIDE_CREATED:
                return `Override creado: ${entry.data.metal} ${entry.data.purity} - $${entry.data.finalPrice?.toFixed(2)}`;
            case TRACKING_CONFIG.eventTypes.OVERRIDE_UPDATED:
                return `Override actualizado: ${entry.data.metal} ${entry.data.purity}`;
            case TRACKING_CONFIG.eventTypes.OVERRIDE_DEACTIVATED:
                return `Override desactivado: ${entry.data.metal} ${entry.data.purity}`;
            default:
                return `${entry.type}: ${Object.keys(entry.data).join(', ')}`;
        }
    }

    // =================================================================
    // ANÁLISIS Y MÉTRICAS
    // =================================================================

    initializeMetrics() {
        return {
            totalEvents: 0,
            eventsByType: new Map(),
            eventsByUser: new Map(),
            dailyActivity: new Map(),
            averageEventsPerSession: 0,
            peakActivityHour: 0,
            mostActiveUser: null,
            suspiciousActivityCount: 0,
            dataIntegrityScore: 100,
            lastUpdated: Date.now()
        };
    }

    updateMetrics(event) {
        this.metrics.totalEvents++;
        
        // Por tipo de evento
        const typeCount = this.metrics.eventsByType.get(event.type) || 0;
        this.metrics.eventsByType.set(event.type, typeCount + 1);
        
        // Por usuario
        const userCount = this.metrics.eventsByUser.get(event.userId) || 0;
        this.metrics.eventsByUser.set(event.userId, userCount + 1);
        
        // Actividad diaria
        const day = new Date(event.timestamp).toDateString();
        const dayCount = this.metrics.dailyActivity.get(day) || 0;
        this.metrics.dailyActivity.set(day, dayCount + 1);
        
        // Usuario más activo
        const mostActiveUser = Array.from(this.metrics.eventsByUser.entries())
            .sort((a, b) => b[1] - a[1])[0];
        this.metrics.mostActiveUser = mostActiveUser ? mostActiveUser[0] : null;
        
        // Hora pico
        this.updatePeakActivityHour(event.timestamp);
        
        this.metrics.lastUpdated = Date.now();
    }

    updatePeakActivityHour(timestamp) {
        const hour = new Date(timestamp).getHours();
        const hourKey = `hour_${hour}`;
        
        if (!this.hourlyActivity) {
            this.hourlyActivity = new Map();
        }
        
        const hourCount = this.hourlyActivity.get(hourKey) || 0;
        this.hourlyActivity.set(hourKey, hourCount + 1);
        
        // Encontrar hora pico
        const peakHour = Array.from(this.hourlyActivity.entries())
            .sort((a, b) => b[1] - a[1])[0];
        
        if (peakHour) {
            this.metrics.peakActivityHour = parseInt(peakHour[0].split('_')[1]);
        }
    }

    // =================================================================
    // DETECCIÓN DE ANOMALÍAS
    // =================================================================

    detectAnomalies(event) {
        this.detectRapidChanges(event);
        this.detectPriceVolatility(event);
        this.detectUnusualPatterns(event);
        this.validateDataIntegrity(event);
    }

    detectRapidChanges(event) {
        if (!this.isPriceChangeEvent(event)) return;
        
        const timeWindow = TRACKING_CONFIG.alerts.unusualActivity.timeWindow;
        const threshold = TRACKING_CONFIG.alerts.unusualActivity.rapidChanges;
        const now = event.timestamp;
        
        const recentChanges = this.history.filter(h => 
            this.isPriceChangeEvent(h) &&
            (now - h.timestamp) <= timeWindow
        );
        
        if (recentChanges.length >= threshold) {
            this.flagSuspiciousActivity({
                type: 'rapid_changes',
                event,
                relatedEvents: recentChanges,
                severity: 'high',
                description: `${recentChanges.length} cambios de precio en ${timeWindow / 60000} minutos`
            });
        }
    }

    detectPriceVolatility(event) {
        if (!this.isPriceChangeEvent(event)) return;
        
        const metal = event.data.metal;
        const purity = event.data.purity;
        
        const recentPrices = this.history
            .filter(h => 
                this.isPriceChangeEvent(h) &&
                h.data.metal === metal &&
                h.data.purity === purity
            )
            .slice(0, 10)
            .map(h => h.data.finalPrice)
            .filter(price => price !== undefined);
        
        if (recentPrices.length >= 3) {
            const volatility = this.calculateVolatility(recentPrices);
            const threshold = TRACKING_CONFIG.alerts.unusualActivity.priceVolatility;
            
            if (volatility > threshold) {
                this.flagSuspiciousActivity({
                    type: 'price_volatility',
                    event,
                    severity: 'medium',
                    description: `Alta volatilidad detectada: ${(volatility * 100).toFixed(1)}% para ${metal} ${purity}`,
                    metadata: { volatility, recentPrices }
                });
            }
        }
    }

    detectUnusualPatterns(event) {
        // Detectar patrones de uso inusuales por usuario
        const userId = event.userId;
        const userEvents = this.history.filter(h => h.userId === userId).slice(0, 50);
        
        if (userEvents.length >= 10) {
            const patterns = this.analyzeUserPatterns(userEvents);
            
            if (patterns.anomalies.length > 0) {
                this.flagSuspiciousActivity({
                    type: 'unusual_pattern',
                    event,
                    severity: 'low',
                    description: `Patrón inusual detectado para usuario ${userId}`,
                    metadata: patterns
                });
            }
        }
    }

    validateDataIntegrity(event) {
        const expectedChecksum = this.calculateChecksum(event.data);
        
        if (event.checksum !== expectedChecksum) {
            this.flagSuspiciousActivity({
                type: 'data_integrity',
                event,
                severity: 'critical',
                description: 'Checksum de datos no coincide - posible corrupción',
                metadata: { expected: expectedChecksum, actual: event.checksum }
            });
            
            this.metrics.dataIntegrityScore = Math.max(0, this.metrics.dataIntegrityScore - 1);
        }
    }

    flagSuspiciousActivity(activity) {
        console.warn('🚨 Actividad sospechosa detectada:', activity);
        
        this.metrics.suspiciousActivityCount++;
        
        // Crear evento de auditoría
        this.trackEvent(TRACKING_CONFIG.eventTypes.SYSTEM_EVENT, {
            type: 'suspicious_activity',
            activity
        }, {
            auditLevel: TRACKING_CONFIG.auditLevels.HIGH
        });
    }

    // =================================================================
    // ANÁLISIS Y REPORTES
    // =================================================================

    generateReport(options = {}) {
        const {
            timespan = TRACKING_CONFIG.reports.defaultTimespan,
            eventTypes = null,
            userId = null,
            format = 'object'
        } = options;
        
        const endTime = Date.now();
        const startTime = endTime - timespan;
        
        let filteredHistory = this.history.filter(event => 
            event.timestamp >= startTime && event.timestamp <= endTime
        );
        
        if (eventTypes) {
            filteredHistory = filteredHistory.filter(event => 
                eventTypes.includes(event.type)
            );
        }
        
        if (userId) {
            filteredHistory = filteredHistory.filter(event => 
                event.userId === userId
            );
        }
        
        const report = {
            metadata: {
                generatedAt: Date.now(),
                timespan: { startTime, endTime },
                totalEvents: filteredHistory.length,
                filters: { eventTypes, userId }
            },
            summary: this.generateReportSummary(filteredHistory),
            timeline: this.generateTimeline(filteredHistory),
            analytics: this.generateAnalytics(filteredHistory),
            anomalies: this.getSuspiciousActivities(startTime),
            topUsers: this.getTopUsers(filteredHistory),
            eventBreakdown: this.getEventBreakdown(filteredHistory)
        };
        
        return format === 'json' ? JSON.stringify(report, null, 2) : report;
    }

    generateReportSummary(events) {
        const priceChanges = events.filter(e => this.isPriceChangeEvent(e));
        const uniqueMetals = new Set(priceChanges.map(e => e.data.metal));
        const uniqueUsers = new Set(events.map(e => e.userId));
        
        return {
            totalEvents: events.length,
            priceChanges: priceChanges.length,
            metalsAffected: uniqueMetals.size,
            usersInvolved: uniqueUsers.size,
            averageEventsPerDay: this.calculateAverageEventsPerDay(events),
            mostActiveHour: this.findMostActiveHour(events),
            integrityScore: this.calculateIntegrityScore(events)
        };
    }

    generateTimeline(events) {
        const timeline = [];
        const eventsByDay = new Map();
        
        events.forEach(event => {
            const day = new Date(event.timestamp).toDateString();
            if (!eventsByDay.has(day)) {
                eventsByDay.set(day, []);
            }
            eventsByDay.get(day).push(event);
        });
        
        for (const [day, dayEvents] of eventsByDay.entries()) {
            timeline.push({
                date: day,
                eventCount: dayEvents.length,
                priceChanges: dayEvents.filter(e => this.isPriceChangeEvent(e)).length,
                topEventType: this.getMostFrequentEventType(dayEvents),
                significantEvents: dayEvents.filter(e => 
                    e.auditLevel >= TRACKING_CONFIG.auditLevels.HIGH
                )
            });
        }
        
        return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    generateAnalytics(events) {
        return {
            eventFrequency: this.analyzeEventFrequency(events),
            userBehavior: this.analyzeUserBehavior(events),
            priceAnalysis: this.analyzePriceChanges(events),
            sessionAnalysis: this.analyzeSessionPatterns(events),
            errorAnalysis: this.analyzeErrors(events)
        };
    }

    // =================================================================
    // UTILIDADES DE ANÁLISIS
    // =================================================================

    isPriceChangeEvent(event) {
        return [
            TRACKING_CONFIG.eventTypes.OVERRIDE_CREATED,
            TRACKING_CONFIG.eventTypes.OVERRIDE_UPDATED,
            TRACKING_CONFIG.eventTypes.OVERRIDE_DEACTIVATED
        ].includes(event.type);
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        const standardDeviation = Math.sqrt(variance);
        
        return standardDeviation / mean;
    }

    analyzeUserPatterns(userEvents) {
        const patterns = {
            averageEventsPerSession: 0,
            mostCommonEventType: null,
            timePatterns: [],
            anomalies: []
        };
        
        // Análisis de patrones temporales
        const hourCounts = new Map();
        userEvents.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });
        
        patterns.timePatterns = Array.from(hourCounts.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Detectar anomalías en el patrón
        const avgEventsPerHour = userEvents.length / 24;
        patterns.timePatterns.forEach(([hour, count]) => {
            if (count > avgEventsPerHour * 3) {
                patterns.anomalies.push({
                    type: 'unusual_time_concentration',
                    hour,
                    count,
                    expected: avgEventsPerHour
                });
            }
        });
        
        return patterns;
    }

    // =================================================================
    // GESTIÓN DE SESIONES
    // =================================================================

    initializeSession() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            userId: this.getCurrentUserId(),
            events: [],
            metadata: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
            }
        };
        
        this.userSessions.set(this.currentSession.id, this.currentSession);
        this.trackEvent(TRACKING_CONFIG.eventTypes.SYSTEM_EVENT, {
            type: 'session_started',
            sessionId: this.currentSession.id
        });
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            
            this.trackEvent(TRACKING_CONFIG.eventTypes.SYSTEM_EVENT, {
                type: 'session_ended',
                sessionId: this.currentSession.id,
                duration: this.currentSession.duration,
                eventCount: this.currentSession.events.length
            });
            
            this.currentSession = null;
        }
    }

    // =================================================================
    // UTILIDADES Y HELPERS
    // =================================================================

    sanitizeData(data) {
        // Remover información sensible
        const sanitized = { ...data };
        
        // Lista de campos sensibles a remover
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'private'];
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    calculateIntegrityHash(event) {
        const data = {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            checksum: event.checksum
        };
        
        return this.calculateChecksum(data);
    }

    determineAuditLevel(eventType, data) {
        switch (eventType) {
            case TRACKING_CONFIG.eventTypes.OVERRIDE_CREATED:
            case TRACKING_CONFIG.eventTypes.OVERRIDE_UPDATED:
                return TRACKING_CONFIG.auditLevels.HIGH;
            
            case TRACKING_CONFIG.eventTypes.OVERRIDE_DEACTIVATED:
                return TRACKING_CONFIG.auditLevels.MEDIUM;
            
            case TRACKING_CONFIG.eventTypes.BULK_OPERATION:
                return TRACKING_CONFIG.auditLevels.CRITICAL;
            
            default:
                return TRACKING_CONFIG.auditLevels.LOW;
        }
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSessionId() {
        return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentUserId() {
        // Integrar con sistema de autenticación si existe
        if (typeof window !== 'undefined' && window.auth && window.auth.getCurrentUser) {
            return window.auth.getCurrentUser().id || 'anonymous';
        }
        return 'system';
    }

    shouldPersist(event) {
        return event.auditLevel >= TRACKING_CONFIG.auditLevels.MEDIUM ||
               this.history.length % 10 === 0; // Persistir cada 10 eventos
    }

    // =================================================================
    // PERSISTENCIA Y BACKUP
    // =================================================================

    loadStoredData() {
        try {
            // Cargar historial
            const historyData = localStorage.getItem('pricing_history_tracker');
            if (historyData) {
                this.history = JSON.parse(historyData);
            }
            
            // Cargar trail de auditoría
            const auditData = localStorage.getItem('pricing_audit_trail');
            if (auditData) {
                this.auditTrail = JSON.parse(auditData);
            }
            
            // Cargar métricas
            const metricsData = localStorage.getItem('pricing_tracking_metrics');
            if (metricsData) {
                const stored = JSON.parse(metricsData);
                this.metrics = { ...this.metrics, ...stored };
                // Convertir Maps almacenados
                this.metrics.eventsByType = new Map(stored.eventsByType);
                this.metrics.eventsByUser = new Map(stored.eventsByUser);
                this.metrics.dailyActivity = new Map(stored.dailyActivity);
            }
            
            console.log(`📚 Datos cargados: ${this.history.length} eventos, ${this.auditTrail.length} auditorías`);
            
        } catch (error) {
            console.warn('Error cargando datos de tracking:', error);
        }
    }

    persistData() {
        try {
            // Guardar historial
            localStorage.setItem('pricing_history_tracker', JSON.stringify(this.history));
            
            // Guardar auditoría
            localStorage.setItem('pricing_audit_trail', JSON.stringify(this.auditTrail));
            
            // Guardar métricas (convertir Maps a arrays)
            const metricsToSave = {
                ...this.metrics,
                eventsByType: Array.from(this.metrics.eventsByType.entries()),
                eventsByUser: Array.from(this.metrics.eventsByUser.entries()),
                dailyActivity: Array.from(this.metrics.dailyActivity.entries())
            };
            localStorage.setItem('pricing_tracking_metrics', JSON.stringify(metricsToSave));
            
        } catch (error) {
            console.error('Error persistiendo datos de tracking:', error);
        }
    }

    setupAutoBackup() {
        setInterval(() => {
            this.createBackup();
        }, TRACKING_CONFIG.storage.backupInterval);
    }

    createBackup() {
        const backup = {
            version: '1.0',
            timestamp: Date.now(),
            history: this.history,
            auditTrail: this.auditTrail,
            metrics: this.metrics,
            metadata: {
                totalEvents: this.metrics.totalEvents,
                integrityScore: this.metrics.dataIntegrityScore,
                suspiciousActivities: this.metrics.suspiciousActivityCount
            }
        };
        
        const backupKey = `pricing_tracker_backup_${Date.now()}`;
        try {
            localStorage.setItem(backupKey, JSON.stringify(backup));
            this.cleanupOldBackups();
            console.log('💾 Backup creado:', backupKey);
        } catch (error) {
            console.error('Error creando backup:', error);
        }
    }

    cleanupOldBackups() {
        const backupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pricing_tracker_backup_')) {
                backupKeys.push({
                    key,
                    timestamp: parseInt(key.split('_')[3])
                });
            }
        }
        
        // Mantener solo los 5 backups más recientes
        backupKeys.sort((a, b) => b.timestamp - a.timestamp);
        backupKeys.slice(5).forEach(backup => {
            localStorage.removeItem(backup.key);
        });
    }

    // =================================================================
    // API PÚBLICA
    // =================================================================

    getMetrics() {
        return {
            ...this.metrics,
            sessionInfo: this.currentSession ? {
                id: this.currentSession.id,
                duration: Date.now() - this.currentSession.startTime,
                eventCount: this.currentSession.events.length
            } : null
        };
    }

    getHistory(options = {}) {
        const {
            limit = 100,
            offset = 0,
            eventTypes = null,
            userId = null,
            startTime = null,
            endTime = null
        } = options;
        
        let filtered = [...this.history];
        
        if (eventTypes) {
            filtered = filtered.filter(event => eventTypes.includes(event.type));
        }
        
        if (userId) {
            filtered = filtered.filter(event => event.userId === userId);
        }
        
        if (startTime) {
            filtered = filtered.filter(event => event.timestamp >= startTime);
        }
        
        if (endTime) {
            filtered = filtered.filter(event => event.timestamp <= endTime);
        }
        
        return {
            events: filtered.slice(offset, offset + limit),
            total: filtered.length,
            hasMore: filtered.length > offset + limit
        };
    }

    getAuditTrail(limit = 50) {
        return this.auditTrail.slice(0, limit);
    }

    getSuspiciousActivities(since = Date.now() - 24 * 60 * 60 * 1000) {
        return this.history
            .filter(event => 
                event.type === TRACKING_CONFIG.eventTypes.SYSTEM_EVENT &&
                event.data.type === 'suspicious_activity' &&
                event.timestamp >= since
            )
            .map(event => event.data.activity);
    }

    exportData(format = 'json') {
        const exportData = {
            version: '1.0',
            exportTimestamp: Date.now(),
            totalEvents: this.history.length,
            data: {
                history: this.history.slice(0, TRACKING_CONFIG.reports.maxExportEntries),
                auditTrail: this.auditTrail,
                metrics: this.getMetrics()
            }
        };
        
        if (format === 'csv') {
            return this.convertToCSV(exportData.data.history);
        }
        
        return JSON.stringify(exportData, null, 2);
    }

    convertToCSV(events) {
        const headers = ['ID', 'Tipo', 'Timestamp', 'Usuario', 'Metal', 'Purity', 'Precio', 'Razón'];
        const rows = events.map(event => [
            event.id,
            event.type,
            new Date(event.timestamp).toISOString(),
            event.userId,
            event.data.metal || '',
            event.data.purity || '',
            event.data.finalPrice || '',
            event.data.reason || ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Integración con otros sistemas
    setupIntegration() {
        if (typeof window !== 'undefined') {
            // Integrar con sistema de overrides
            if (window.advancedManualPricingOverride) {
                window.advancedManualPricingOverride.addObserver((event, data) => {
                    this.trackEvent(event, data);
                });
            }
            
            // Integrar con validador
            if (window.pricingValidator) {
                window.pricingValidator.addObserver((event, data) => {
                    this.trackEvent(TRACKING_CONFIG.eventTypes.VALIDATION_EVENT, {
                        validationEvent: event,
                        ...data
                    });
                });
            }
        }
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.pricingTracker = new PricingHistoryTracker();
    
    // Configurar integración con otros sistemas
    window.pricingTracker.setupIntegration();
    
    // Limpiar al cerrar la ventana
    window.addEventListener('beforeunload', () => {
        window.pricingTracker.endSession();
        window.pricingTracker.persistData();
    });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PricingHistoryTracker,
        TRACKING_CONFIG
    };
}

console.log('✅ Sistema de Historial y Tracking v1.0 cargado correctamente');
console.log('📚 Acceso: window.pricingTracker');
console.log('📊 Métricas: window.pricingTracker.getMetrics()');
console.log('📋 Historial: window.pricingTracker.getHistory()');