/**
 * BACKUP MANAGER - Sistema de backup automático enterprise-grade
 * Complementa el SecurityManager y XSSProtection existentes
 * Integración perfecta con database.js para protección completa de datos
 * 
 * CARACTERÍSTICAS:
 * - Backup automático con versionado
 * - Backup incremental y completo
 * - Integridad con checksums SHA-256
 * - Compresión y encriptación AES-256
 * - Auto-cleanup de backups antiguos
 * - Recovery system completo
 * - Cross-tab synchronization
 * - Métricas y logging exhaustivo
 */

class BackupManager {
    constructor() {
        // Configuración básica
        this.version = '1.0.0';
        this.backupPrefix = 'ciaociao_backup_';
        this.checksumPrefix = 'backup_checksum_';
        this.metadataPrefix = 'backup_metadata_';
        this.recoveryPrefix = 'backup_recovery_';
        
        // Configuración de backup
        this.config = {
            enabled: true,
            maxBackups: 50,
            maxIncrementalBackups: 20,
            fullBackupInterval: 24 * 60 * 60 * 1000, // 24 horas
            incrementalInterval: 30 * 60 * 1000,     // 30 minutos
            compressionLevel: 6, // 1-9
            retentionDays: 30,
            autoCleanup: true,
            crossTabSync: true,
            encryptionEnabled: true,
            checksumValidation: true,
            alertOnFailure: true,
            performanceMode: 'balanced' // 'fast', 'balanced', 'thorough'
        };
        
        // Estado del sistema
        this.isInitialized = false;
        this.isBackupInProgress = false;
        this.isRecoveryInProgress = false;
        this.lastBackupTime = null;
        this.lastFullBackupTime = null;
        this.activeOperations = new Set();
        
        // Referencias a sistemas existentes
        this.securityManager = null;
        this.xssProtection = null;
        this.database = null;
        
        // Métricas y estadísticas
        this.metrics = {
            totalBackups: 0,
            successfulBackups: 0,
            failedBackups: 0,
            totalRecoveries: 0,
            successfulRecoveries: 0,
            failedRecoveries: 0,
            dataIntegrityChecks: 0,
            corruptedBackups: 0,
            totalDataSaved: 0,
            averageBackupTime: 0,
            averageRecoveryTime: 0,
            compressionRatio: 0,
            lastError: null,
            performanceMetrics: []
        };
        
        // Workers y scheduling
        this.workers = new Map();
        this.scheduledOperations = new Map();
        this.crossTabChannel = null;
        
        // Inicializar sistema
        this.initializeBackupSystem();
    }
    
    /**
     * Inicializa el sistema de backup completo
     */
    async initializeBackupSystem() {
        const startTime = performance.now();
        
        try {
            console.log('🔄 Inicializando BackupManager enterprise-grade...');
            
            // PASO 1: Verificar soporte del navegador
            await this.verifyBrowserSupport();
            
            // PASO 2: Integrar con sistemas existentes
            await this.integrateWithExistingSystems();
            
            // PASO 3: Configurar compresión y encriptación
            await this.setupCompressionEngine();
            await this.setupEncryptionSystem();
            
            // PASO 4: Configurar cross-tab synchronization
            await this.setupCrossTabSync();
            
            // PASO 5: Configurar scheduling automático
            await this.setupAutomaticScheduling();
            
            // PASO 6: Verificar integridad de backups existentes
            await this.verifyExistingBackups();
            
            // PASO 7: Configurar monitoring y cleanup
            await this.setupMonitoringAndCleanup();
            
            // PASO 8: Configurar recovery system
            await this.setupRecoverySystem();
            
            this.isInitialized = true;
            const initTime = performance.now() - startTime;
            
            this.logOperation('initialization', 'success', {
                duration: initTime,
                version: this.version,
                config: this.config
            });
            
            console.log(`✅ BackupManager inicializado exitosamente en ${initTime.toFixed(2)}ms`);
            
            // Ejecutar primer backup si es necesario
            await this.performInitialBackupCheck();
            
        } catch (error) {
            this.handleCriticalError('initialization', error);
            throw error;
        }
    }
    
    /**
     * Verifica soporte del navegador para funciones avanzadas
     */
    async verifyBrowserSupport() {
        const requirements = {
            localStorage: typeof Storage !== 'undefined',
            webCrypto: !!(window.crypto && window.crypto.subtle),
            compressionStreams: typeof CompressionStream !== 'undefined',
            broadcastChannel: typeof BroadcastChannel !== 'undefined',
            workers: typeof Worker !== 'undefined',
            performance: typeof performance !== 'undefined'
        };
        
        const missing = Object.entries(requirements)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (missing.length > 0) {
            console.warn('⚠️ Algunas funciones avanzadas no están disponibles:', missing);
            // Ajustar configuración según soporte
            this.adjustConfigForBrowserSupport(missing);
        }
        
        return requirements;
    }
    
    /**
     * Integra con sistemas existentes de seguridad
     */
    async integrateWithExistingSystems() {
        // Integrar con SecurityManager
        if (window.securityManager || window.SecurityManager) {
            this.securityManager = window.securityManager || new window.SecurityManager();
            console.log('🔗 Integración con SecurityManager completada');
        }
        
        // Integrar con XSSProtection
        if (window.xssProtection || window.XSSProtection) {
            this.xssProtection = window.xssProtection || new window.XSSProtection();
            console.log('🔗 Integración con XSSProtection completada');
        }
        
        // Integrar con ReceiptDatabase
        if (window.ReceiptDatabase) {
            // Esperar a que la instancia global esté disponible
            await this.waitForDatabaseInstance();
            console.log('🔗 Integración con ReceiptDatabase completada');
        }
        
        // Verificar integraciones
        const integrations = {
            security: !!this.securityManager,
            xssProtection: !!this.xssProtection,
            database: !!this.database
        };
        
        console.log('📊 Estado de integraciones:', integrations);
        return integrations;
    }
    
    /**
     * Espera a que la instancia de base de datos esté disponible
     */
    async waitForDatabaseInstance(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.database && typeof window.database.getAllReceipts === 'function') {
                this.database = window.database;
                return;
            }
            
            // Buscar instancias globales alternativas
            const globalVars = ['receiptDB', 'db', 'dataManager'];
            for (const varName of globalVars) {
                if (window[varName] && typeof window[varName].getAllReceipts === 'function') {
                    this.database = window[varName];
                    return;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.warn('⚠️ No se encontró instancia de database, usando acceso directo a localStorage');
        this.database = null;
    }
    
    /**
     * Configurar motor de compresión
     */
    async setupCompressionEngine() {
        try {
            // Verificar soporte nativo
            if (typeof CompressionStream !== 'undefined') {
                this.compressionSupported = true;
                console.log('✅ Compresión nativa disponible');
            } else {
                // Fallback a compresión básica
                this.compressionSupported = false;
                console.log('⚠️ Usando compresión fallback');
            }
        } catch (error) {
            console.warn('⚠️ Error configurando compresión:', error);
            this.compressionSupported = false;
        }
    }
    
    /**
     * Configurar sistema de encriptación
     */
    async setupEncryptionSystem() {
        if (!this.config.encryptionEnabled) {
            console.log('ℹ️ Encriptación de backups deshabilitada');
            return;
        }
        
        try {
            if (this.securityManager && this.securityManager.encryptionKey) {
                this.encryptionEnabled = true;
                console.log('🔐 Encriptación de backups habilitada con SecurityManager');
            } else if (window.crypto && window.crypto.subtle) {
                // Generar clave específica para backups
                await this.generateBackupEncryptionKey();
                this.encryptionEnabled = true;
                console.log('🔐 Encriptación de backups habilitada con clave dedicada');
            } else {
                this.encryptionEnabled = false;
                console.warn('⚠️ Encriptación no disponible, backups sin encriptar');
            }
        } catch (error) {
            console.error('❌ Error configurando encriptación:', error);
            this.encryptionEnabled = false;
        }
    }
    
    /**
     * Genera clave de encriptación específica para backups
     */
    async generateBackupEncryptionKey() {
        try {
            this.backupEncryptionKey = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false, // No extraible
                ['encrypt', 'decrypt']
            );
            
            // Guardar huella digital de la clave
            const keyId = await this.generateKeyFingerprint();
            localStorage.setItem('backup_key_id', keyId);
            
        } catch (error) {
            console.error('Error generando clave de backup:', error);
            throw error;
        }
    }
    
    /**
     * Genera huella digital de la clave
     */
    async generateKeyFingerprint() {
        const timestamp = Date.now();
        const random = crypto.getRandomValues(new Uint8Array(16));
        const data = new Uint8Array([...new Uint8Array(new ArrayBuffer(8)), ...random]);
        
        // Crear vista para timestamp
        const view = new DataView(data.buffer);
        view.setBigUint64(0, BigInt(timestamp), true);
        
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Configurar sincronización cross-tab
     */
    async setupCrossTabSync() {
        if (!this.config.crossTabSync || typeof BroadcastChannel === 'undefined') {
            console.log('ℹ️ Cross-tab sync deshabilitado o no disponible');
            return;
        }
        
        try {
            this.crossTabChannel = new BroadcastChannel('ciaociao_backup_sync');
            
            this.crossTabChannel.addEventListener('message', (event) => {
                this.handleCrossTabMessage(event.data);
            });
            
            // Anunciar presencia
            this.broadcastMessage({
                type: 'presence',
                tabId: this.generateTabId(),
                timestamp: Date.now()
            });
            
            console.log('📡 Cross-tab synchronization activado');
            
        } catch (error) {
            console.warn('⚠️ Error configurando cross-tab sync:', error);
            this.config.crossTabSync = false;
        }
    }
    
    /**
     * Genera ID único para la pestaña
     */
    generateTabId() {
        if (!this.tabId) {
            this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.tabId;
    }
    
    /**
     * Configurar scheduling automático
     */
    async setupAutomaticScheduling() {
        if (!this.config.enabled) {
            console.log('ℹ️ Backup automático deshabilitado');
            return;
        }
        
        // Backup completo diario
        this.scheduleOperation('fullBackup', this.config.fullBackupInterval, () => {
            this.performFullBackup('scheduled');
        });
        
        // Backup incremental cada 30 minutos
        this.scheduleOperation('incrementalBackup', this.config.incrementalInterval, () => {
            this.performIncrementalBackup('scheduled');
        });
        
        // Cleanup diario
        this.scheduleOperation('cleanup', 24 * 60 * 60 * 1000, () => {
            this.performCleanup('scheduled');
        });
        
        // Verificación de integridad semanal
        this.scheduleOperation('integrityCheck', 7 * 24 * 60 * 60 * 1000, () => {
            this.performIntegrityCheck('scheduled');
        });
        
        console.log('⏰ Scheduling automático configurado');
    }
    
    /**
     * Programa una operación recurrente
     */
    scheduleOperation(name, interval, callback) {
        // Cancelar operación existente
        if (this.scheduledOperations.has(name)) {
            clearInterval(this.scheduledOperations.get(name));
        }
        
        // Programar nueva operación
        const intervalId = setInterval(callback, interval);
        this.scheduledOperations.set(name, intervalId);
        
        console.log(`📅 Operación '${name}' programada cada ${interval / 1000}s`);
    }
    
    /**
     * Verifica backups existentes al inicializar
     */
    async verifyExistingBackups() {
        const startTime = performance.now();
        
        try {
            const backups = this.listExistingBackups();
            const corrupted = [];
            const valid = [];
            
            console.log(`🔍 Verificando ${backups.length} backups existentes...`);
            
            for (const backup of backups) {
                try {
                    const isValid = await this.verifyBackupIntegrity(backup);
                    if (isValid) {
                        valid.push(backup);
                    } else {
                        corrupted.push(backup);
                    }
                } catch (error) {
                    corrupted.push(backup);
                    console.warn(`⚠️ Error verificando backup ${backup}:`, error);
                }
            }
            
            if (corrupted.length > 0) {
                console.warn(`⚠️ Se encontraron ${corrupted.length} backups corruptos`);
                this.metrics.corruptedBackups = corrupted.length;
                
                // Marcar para cleanup
                for (const backup of corrupted) {
                    this.markBackupForCleanup(backup);
                }
            }
            
            console.log(`✅ Verificación completada: ${valid.length} válidos, ${corrupted.length} corruptos`);
            
            const verificationTime = performance.now() - startTime;
            this.recordPerformanceMetric('backupVerification', verificationTime);
            
            return { valid, corrupted };
            
        } catch (error) {
            console.error('❌ Error verificando backups existentes:', error);
            return { valid: [], corrupted: [] };
        }
    }
    
    /**
     * Lista todos los backups existentes
     */
    listExistingBackups() {
        const backups = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.backupPrefix)) {
                    backups.push(key);
                }
            }
            
            // Ordenar por timestamp (más reciente primero)
            backups.sort((a, b) => {
                const timeA = this.extractTimestampFromKey(a);
                const timeB = this.extractTimestampFromKey(b);
                return timeB - timeA;
            });
            
        } catch (error) {
            console.error('Error listando backups:', error);
        }
        
        return backups;
    }
    
    /**
     * Extrae timestamp de una clave de backup
     */
    extractTimestampFromKey(key) {
        try {
            const match = key.match(/(\d{13})/); // Buscar timestamp de 13 dígitos
            return match ? parseInt(match[1]) : 0;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Configurar monitoring y cleanup automático
     */
    async setupMonitoringAndCleanup() {
        // Monitor de performance cada 5 minutos
        this.scheduleOperation('performanceMonitor', 5 * 60 * 1000, () => {
            this.monitorPerformance();
        });
        
        // Cleanup automático diario
        if (this.config.autoCleanup) {
            this.scheduleOperation('autoCleanup', 24 * 60 * 60 * 1000, () => {
                this.performAutomaticCleanup();
            });
        }
        
        // Monitor de espacio de almacenamiento cada hora
        this.scheduleOperation('storageMonitor', 60 * 60 * 1000, () => {
            this.monitorStorageUsage();
        });
        
        console.log('📊 Monitoring y cleanup configurados');
    }
    
    /**
     * Configurar sistema de recovery
     */
    async setupRecoverySystem() {
        // Preparar sistema de recovery points
        this.recoveryPoints = new Map();
        
        // Verificar recovery points existentes
        await this.loadRecoveryPoints();
        
        console.log('🔄 Sistema de recovery configurado');
    }
    
    /**
     * Carga recovery points existentes
     */
    async loadRecoveryPoints() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.recoveryPrefix)) {
                    const recoveryData = JSON.parse(localStorage.getItem(key));
                    this.recoveryPoints.set(key, recoveryData);
                }
            }
            
            console.log(`📁 ${this.recoveryPoints.size} recovery points cargados`);
            
        } catch (error) {
            console.error('Error cargando recovery points:', error);
        }
    }
    
    /**
     * Realiza check inicial de backup si es necesario
     */
    async performInitialBackupCheck() {
        try {
            const lastBackup = this.getLastBackupInfo();
            const now = Date.now();
            
            if (!lastBackup || (now - lastBackup.timestamp) > this.config.fullBackupInterval) {
                console.log('🔄 Realizando backup inicial...');
                await this.performFullBackup('initial');
            } else {
                console.log('ℹ️ Backup reciente encontrado, no es necesario backup inicial');
            }
            
        } catch (error) {
            console.error('Error en backup inicial:', error);
        }
    }
    
    /**
     * MÉTODO PRINCIPAL: Realizar backup completo
     */
    async performFullBackup(trigger = 'manual') {
        if (this.isBackupInProgress) {
            console.warn('⚠️ Backup ya en progreso, saltando...');
            return null;
        }
        
        this.isBackupInProgress = true;
        const backupId = this.generateBackupId('full');
        const startTime = performance.now();
        
        try {
            console.log(`🔄 Iniciando backup completo (${trigger})...`);
            
            // PASO 1: Recopilar datos de todas las fuentes
            const backupData = await this.collectAllData();
            
            // PASO 2: Crear metadata del backup
            const metadata = this.createBackupMetadata(backupId, 'full', backupData, trigger);
            
            // PASO 3: Comprimir datos si está habilitado
            const compressedData = await this.compressData(backupData);
            
            // PASO 4: Encriptar datos si está habilitado
            const encryptedData = await this.encryptData(compressedData);
            
            // PASO 5: Generar checksum para integridad
            const checksum = await this.generateChecksum(encryptedData);
            
            // PASO 6: Crear paquete de backup final
            const backupPackage = {
                id: backupId,
                version: this.version,
                type: 'full',
                timestamp: Date.now(),
                trigger: trigger,
                data: encryptedData,
                metadata: metadata,
                checksum: checksum,
                compressed: !!this.compressionSupported,
                encrypted: this.encryptionEnabled
            };
            
            // PASO 7: Almacenar backup
            await this.storeBackup(backupId, backupPackage);
            
            // PASO 8: Crear recovery point
            await this.createRecoveryPoint(backupId, metadata);
            
            // PASO 9: Actualizar métricas
            const backupTime = performance.now() - startTime;
            this.updateBackupMetrics('full', true, backupTime, backupPackage);
            
            // PASO 10: Notificar cross-tab
            this.broadcastBackupCompletion(backupId, 'full', true);
            
            this.lastBackupTime = Date.now();
            this.lastFullBackupTime = Date.now();
            
            console.log(`✅ Backup completo exitoso en ${backupTime.toFixed(2)}ms (ID: ${backupId})`);
            
            return backupId;
            
        } catch (error) {
            this.handleBackupError('full', error, backupId);
            return null;
            
        } finally {
            this.isBackupInProgress = false;
        }
    }
    
    /**
     * MÉTODO PRINCIPAL: Realizar backup incremental
     */
    async performIncrementalBackup(trigger = 'manual') {
        if (this.isBackupInProgress) {
            console.warn('⚠️ Backup ya en progreso, saltando...');
            return null;
        }
        
        this.isBackupInProgress = true;
        const backupId = this.generateBackupId('incremental');
        const startTime = performance.now();
        
        try {
            console.log(`🔄 Iniciando backup incremental (${trigger})...`);
            
            // PASO 1: Obtener último backup para comparación
            const lastBackup = this.getLastBackupInfo();
            if (!lastBackup) {
                console.log('ℹ️ No hay backup previo, realizando backup completo');
                return await this.performFullBackup('incremental_fallback');
            }
            
            // PASO 2: Recopilar solo datos modificados
            const incrementalData = await this.collectIncrementalData(lastBackup);
            
            if (this.isDataEmpty(incrementalData)) {
                console.log('ℹ️ No hay cambios desde el último backup');
                return null;
            }
            
            // PASO 3: Crear metadata del backup incremental
            const metadata = this.createBackupMetadata(backupId, 'incremental', incrementalData, trigger, lastBackup.id);
            
            // PASO 4: Comprimir y encriptar
            const compressedData = await this.compressData(incrementalData);
            const encryptedData = await this.encryptData(compressedData);
            const checksum = await this.generateChecksum(encryptedData);
            
            // PASO 5: Crear paquete incremental
            const backupPackage = {
                id: backupId,
                version: this.version,
                type: 'incremental',
                timestamp: Date.now(),
                trigger: trigger,
                basedOn: lastBackup.id,
                data: encryptedData,
                metadata: metadata,
                checksum: checksum,
                compressed: !!this.compressionSupported,
                encrypted: this.encryptionEnabled
            };
            
            // PASO 6: Almacenar backup incremental
            await this.storeBackup(backupId, backupPackage);
            
            // PASO 7: Actualizar métricas y notificar
            const backupTime = performance.now() - startTime;
            this.updateBackupMetrics('incremental', true, backupTime, backupPackage);
            this.broadcastBackupCompletion(backupId, 'incremental', true);
            
            this.lastBackupTime = Date.now();
            
            console.log(`✅ Backup incremental exitoso en ${backupTime.toFixed(2)}ms (ID: ${backupId})`);
            
            return backupId;
            
        } catch (error) {
            this.handleBackupError('incremental', error, backupId);
            return null;
            
        } finally {
            this.isBackupInProgress = false;
        }
    }
    
    /**
     * Recopila todos los datos para backup completo
     */
    async collectAllData() {
        const data = {
            receipts: null,
            clients: null,
            quotations: null,
            settings: null,
            security: null,
            metadata: {
                collectionTime: Date.now(),
                source: 'backup-manager',
                version: this.version
            }
        };
        
        try {
            // Datos de recibos
            if (this.database && typeof this.database.getAllReceipts === 'function') {
                data.receipts = await this.database.getAllReceipts();
                console.log(`📄 ${data.receipts?.length || 0} recibos recopilados`);
            } else {
                // Fallback directo a localStorage
                data.receipts = this.getDirectFromStorage('ciaociao_receipts');
            }
            
            // Datos de clientes
            if (this.database && typeof this.database.getAllClients === 'function') {
                data.clients = this.database.getAllClients();
                console.log(`👥 ${data.clients?.length || 0} clientes recopilados`);
            } else {
                data.clients = this.getDirectFromStorage('ciaociao_clients');
            }
            
            // Datos de cotizaciones
            if (this.database && typeof this.database.getAllQuotations === 'function') {
                data.quotations = this.database.getAllQuotations();
                console.log(`💰 ${data.quotations?.length || 0} cotizaciones recopiladas`);
            } else {
                data.quotations = this.getDirectFromStorage('ciaociao_quotations');
            }
            
            // Configuraciones del sistema
            data.settings = this.collectSystemSettings();
            
            // Estado de seguridad (sin datos sensibles)
            data.security = this.collectSecurityMetadata();
            
            // Sanitizar datos con XSS Protection si está disponible
            if (this.xssProtection) {
                data = this.xssProtection.sanitizeJSON(data);
            }
            
            return data;
            
        } catch (error) {
            console.error('Error recopilando datos:', error);
            throw new Error(`Error recopilando datos: ${error.message}`);
        }
    }
    
    /**
     * Obtiene datos directamente del localStorage (fallback)
     */
    getDirectFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error obteniendo ${key}:`, error);
            return [];
        }
    }
    
    /**
     * Recopila configuraciones del sistema
     */
    collectSystemSettings() {
        const settings = {};
        
        try {
            // Configuraciones conocidas (sin datos sensibles)
            const settingsKeys = [
                'ciaociao_config',
                'user_preferences',
                'app_settings',
                'theme_settings'
            ];
            
            for (const key of settingsKeys) {
                const value = localStorage.getItem(key);
                if (value) {
                    settings[key] = JSON.parse(value);
                }
            }
            
        } catch (error) {
            console.error('Error recopilando configuraciones:', error);
        }
        
        return settings;
    }
    
    /**
     * Recopila metadata de seguridad (sin datos sensibles)
     */
    collectSecurityMetadata() {
        const metadata = {};
        
        try {
            // Métricas de seguridad (sin claves ni tokens)
            if (this.securityManager && typeof this.securityManager.getSecurityStats === 'function') {
                const stats = this.securityManager.getSecurityStats();
                metadata.securityStats = {
                    hasEncryptionKey: stats.hasEncryptionKey,
                    sessionExists: stats.sessionExists,
                    isRateLimited: stats.isRateLimited
                };
            }
            
            if (this.xssProtection && typeof this.xssProtection.getMetrics === 'function') {
                metadata.xssMetrics = this.xssProtection.getMetrics();
            }
            
        } catch (error) {
            console.error('Error recopilando metadata de seguridad:', error);
        }
        
        return metadata;
    }
    
    /**
     * Recopila datos modificados para backup incremental
     */
    async collectIncrementalData(lastBackup) {
        const data = {
            receipts: null,
            clients: null,
            quotations: null,
            settings: null,
            changes: [],
            metadata: {
                collectionTime: Date.now(),
                basedOn: lastBackup.id,
                lastBackupTime: lastBackup.timestamp
            }
        };
        
        try {
            // Comparar recibos
            const currentReceipts = this.database ? 
                await this.database.getAllReceipts() : 
                this.getDirectFromStorage('ciaociao_receipts');
            
            const receiptChanges = this.detectChanges(
                lastBackup.data?.receipts || [], 
                currentReceipts, 
                'receipts'
            );
            
            if (receiptChanges.length > 0) {
                data.receipts = receiptChanges;
                data.changes.push({
                    type: 'receipts',
                    count: receiptChanges.length
                });
            }
            
            // Comparar clientes
            const currentClients = this.database ? 
                this.database.getAllClients() : 
                this.getDirectFromStorage('ciaociao_clients');
            
            const clientChanges = this.detectChanges(
                lastBackup.data?.clients || [], 
                currentClients, 
                'clients'
            );
            
            if (clientChanges.length > 0) {
                data.clients = clientChanges;
                data.changes.push({
                    type: 'clients',
                    count: clientChanges.length
                });
            }
            
            // Comparar cotizaciones
            const currentQuotations = this.database ? 
                this.database.getAllQuotations() : 
                this.getDirectFromStorage('ciaociao_quotations');
            
            const quotationChanges = this.detectChanges(
                lastBackup.data?.quotations || [], 
                currentQuotations, 
                'quotations'
            );
            
            if (quotationChanges.length > 0) {
                data.quotations = quotationChanges;
                data.changes.push({
                    type: 'quotations',
                    count: quotationChanges.length
                });
            }
            
            console.log(`🔍 Detectados ${data.changes.length} tipos de cambios`);
            return data;
            
        } catch (error) {
            console.error('Error recopilando datos incrementales:', error);
            throw error;
        }
    }
    
    /**
     * Detecta cambios entre datasets
     */
    detectChanges(oldData, newData, type) {
        const changes = [];
        
        try {
            if (!Array.isArray(oldData) || !Array.isArray(newData)) {
                return newData || [];
            }
            
            // Crear mapa de elementos antiguos para búsqueda rápida
            const oldMap = new Map();
            oldData.forEach(item => {
                const key = item.id || item.receiptNumber || item.quotationNumber || item.phone;
                if (key) {
                    oldMap.set(key, item);
                }
            });
            
            // Detectar nuevos elementos y modificados
            newData.forEach(item => {
                const key = item.id || item.receiptNumber || item.quotationNumber || item.phone;
                if (!key) return;
                
                const oldItem = oldMap.get(key);
                
                if (!oldItem) {
                    // Elemento nuevo
                    changes.push({
                        action: 'added',
                        item: item
                    });
                } else {
                    // Verificar si fue modificado
                    const oldHash = this.generateDataHash(oldItem);
                    const newHash = this.generateDataHash(item);
                    
                    if (oldHash !== newHash) {
                        changes.push({
                            action: 'modified',
                            item: item,
                            previous: oldItem
                        });
                    }
                }
            });
            
            // Detectar elementos eliminados
            oldData.forEach(item => {
                const key = item.id || item.receiptNumber || item.quotationNumber || item.phone;
                if (!key) return;
                
                const exists = newData.some(newItem => {
                    const newKey = newItem.id || newItem.receiptNumber || newItem.quotationNumber || newItem.phone;
                    return newKey === key;
                });
                
                if (!exists) {
                    changes.push({
                        action: 'deleted',
                        item: item
                    });
                }
            });
            
        } catch (error) {
            console.error(`Error detectando cambios en ${type}:`, error);
        }
        
        return changes;
    }
    
    /**
     * Genera hash rápido para comparación de datos
     */
    generateDataHash(data) {
        try {
            const str = JSON.stringify(data, Object.keys(data).sort());
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString(16);
        } catch (error) {
            return Math.random().toString(16);
        }
    }
    
    /**
     * Verifica si los datos están vacíos
     */
    isDataEmpty(data) {
        if (!data || typeof data !== 'object') {
            return true;
        }
        
        const hasContent = data.receipts?.length > 0 || 
                          data.clients?.length > 0 || 
                          data.quotations?.length > 0 ||
                          data.changes?.length > 0;
        
        return !hasContent;
    }
    
    /**
     * Crea metadata del backup
     */
    createBackupMetadata(backupId, type, data, trigger, basedOn = null) {
        const metadata = {
            id: backupId,
            version: this.version,
            type: type,
            timestamp: Date.now(),
            trigger: trigger,
            basedOn: basedOn,
            dataStats: this.analyzeDataStats(data),
            systemInfo: {
                userAgent: navigator.userAgent.substring(0, 100),
                url: window.location.href,
                timestamp: Date.now()
            },
            integrations: {
                securityManager: !!this.securityManager,
                xssProtection: !!this.xssProtection,
                database: !!this.database
            }
        };
        
        return metadata;
    }
    
    /**
     * Analiza estadísticas de los datos
     */
    analyzeDataStats(data) {
        const stats = {
            totalItems: 0,
            receiptsCount: 0,
            clientsCount: 0,
            quotationsCount: 0,
            dataSize: 0
        };
        
        try {
            if (data.receipts) {
                stats.receiptsCount = Array.isArray(data.receipts) ? data.receipts.length : 0;
                stats.totalItems += stats.receiptsCount;
            }
            
            if (data.clients) {
                stats.clientsCount = Array.isArray(data.clients) ? data.clients.length : 0;
                stats.totalItems += stats.clientsCount;
            }
            
            if (data.quotations) {
                stats.quotationsCount = Array.isArray(data.quotations) ? data.quotations.length : 0;
                stats.totalItems += stats.quotationsCount;
            }
            
            // Calcular tamaño aproximado
            stats.dataSize = JSON.stringify(data).length;
            
        } catch (error) {
            console.error('Error analizando estadísticas:', error);
        }
        
        return stats;
    }
    
    /**
     * Comprime datos si la compresión está habilitada
     */
    async compressData(data) {
        if (!this.compressionSupported || !data) {
            return data;
        }
        
        try {
            const jsonString = JSON.stringify(data);
            const originalSize = jsonString.length;
            
            if (typeof CompressionStream !== 'undefined') {
                // Usar compresión nativa del navegador
                const stream = new CompressionStream('gzip');
                const writer = stream.writable.getWriter();
                const reader = stream.readable.getReader();
                
                writer.write(new TextEncoder().encode(jsonString));
                writer.close();
                
                const chunks = [];
                let done = false;
                
                while (!done) {
                    const result = await reader.read();
                    done = result.done;
                    if (result.value) {
                        chunks.push(result.value);
                    }
                }
                
                const compressed = new Uint8Array(
                    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
                );
                let offset = 0;
                for (const chunk of chunks) {
                    compressed.set(chunk, offset);
                    offset += chunk.length;
                }
                
                const compressedSize = compressed.length;
                this.metrics.compressionRatio = (1 - compressedSize / originalSize) * 100;
                
                return Array.from(compressed); // Convert to regular array for JSON serialization
                
            } else {
                // Fallback: compresión básica
                return this.basicCompress(jsonString);
            }
            
        } catch (error) {
            console.warn('Error comprimiendo datos, usando datos sin comprimir:', error);
            return data;
        }
    }
    
    /**
     * Compresión básica para fallback
     */
    basicCompress(str) {
        try {
            // LZ77-style compression básico
            const compressed = [];
            let i = 0;
            
            while (i < str.length) {
                let match = '';
                let matchLength = 0;
                let matchDistance = 0;
                
                // Buscar coincidencias hacia atrás
                for (let j = Math.max(0, i - 255); j < i; j++) {
                    let length = 0;
                    while (i + length < str.length && 
                           str[j + length] === str[i + length] && 
                           length < 255) {
                        length++;
                    }
                    
                    if (length > matchLength) {
                        matchLength = length;
                        matchDistance = i - j;
                    }
                }
                
                if (matchLength >= 3) {
                    compressed.push([matchDistance, matchLength]);
                    i += matchLength;
                } else {
                    compressed.push(str[i]);
                    i++;
                }
            }
            
            return compressed;
            
        } catch (error) {
            console.error('Error en compresión básica:', error);
            return str;
        }
    }
    
    /**
     * Encripta datos si la encriptación está habilitada
     */
    async encryptData(data) {
        if (!this.encryptionEnabled || !data) {
            return data;
        }
        
        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Usar SecurityManager si está disponible
            if (this.securityManager && typeof this.securityManager.encryptData === 'function') {
                return await this.securityManager.encryptData(jsonString);
            }
            
            // Usar clave específica de backup
            if (this.backupEncryptionKey) {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(jsonString);
                
                const iv = crypto.getRandomValues(new Uint8Array(12));
                
                const encryptedBuffer = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv },
                    this.backupEncryptionKey,
                    dataBuffer
                );
                
                // Combinar IV + datos encriptados
                const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                result.set(iv);
                result.set(new Uint8Array(encryptedBuffer), iv.length);
                
                return btoa(String.fromCharCode(...result));
            }
            
            return data;
            
        } catch (error) {
            console.warn('Error encriptando datos:', error);
            return data;
        }
    }
    
    /**
     * Genera checksum SHA-256 para verificar integridad
     */
    async generateChecksum(data) {
        if (!this.config.checksumValidation) {
            return null;
        }
        
        try {
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataString);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
        } catch (error) {
            console.error('Error generando checksum:', error);
            return null;
        }
    }
    
    /**
     * Almacena el backup en localStorage
     */
    async storeBackup(backupId, backupPackage) {
        try {
            const backupKey = this.backupPrefix + backupId;
            const backupString = JSON.stringify(backupPackage);
            
            // Verificar espacio disponible
            if (this.wouldExceedStorage(backupString.length)) {
                console.warn('⚠️ Espacio insuficiente, limpiando backups antiguos...');
                await this.emergencyCleanup();
            }
            
            // Almacenar backup
            localStorage.setItem(backupKey, backupString);
            
            // Almacenar checksum por separado para verificación rápida
            if (backupPackage.checksum) {
                localStorage.setItem(
                    this.checksumPrefix + backupId, 
                    backupPackage.checksum
                );
            }
            
            // Almacenar metadata por separado para consultas rápidas
            localStorage.setItem(
                this.metadataPrefix + backupId,
                JSON.stringify(backupPackage.metadata)
            );
            
            console.log(`💾 Backup almacenado: ${backupKey} (${(backupString.length / 1024).toFixed(2)} KB)`);
            
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.error('❌ Cuota de almacenamiento excedida');
                await this.handleStorageQuotaExceeded();
                throw new Error('Espacio de almacenamiento insuficiente');
            } else {
                console.error('Error almacenando backup:', error);
                throw error;
            }
        }
    }
    
    /**
     * Crea un recovery point
     */
    async createRecoveryPoint(backupId, metadata) {
        try {
            const recoveryPoint = {
                backupId: backupId,
                timestamp: Date.now(),
                type: metadata.type,
                dataStats: metadata.dataStats,
                canRestore: true,
                quickRestore: metadata.type === 'full' // Los backups completos permiten restore rápido
            };
            
            const recoveryKey = this.recoveryPrefix + backupId;
            localStorage.setItem(recoveryKey, JSON.stringify(recoveryPoint));
            
            this.recoveryPoints.set(recoveryKey, recoveryPoint);
            
            console.log(`🎯 Recovery point creado: ${backupId}`);
            
        } catch (error) {
            console.error('Error creando recovery point:', error);
        }
    }
    
    // Continúa en el siguiente fragmento...
    
    /**
     * Genera ID único para backup
     */
    generateBackupId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `${type}_${timestamp}_${random}`;
    }
    
    /**
     * Obtiene información del último backup
     */
    getLastBackupInfo() {
        try {
            const backups = this.listExistingBackups();
            if (backups.length === 0) {
                return null;
            }
            
            const lastBackupKey = backups[0]; // Ya están ordenados por timestamp
            const backupData = JSON.parse(localStorage.getItem(lastBackupKey));
            
            return {
                id: backupData.id,
                type: backupData.type,
                timestamp: backupData.timestamp,
                data: backupData.data,
                metadata: backupData.metadata
            };
            
        } catch (error) {
            console.error('Error obteniendo último backup:', error);
            return null;
        }
    }
    
    /**
     * Actualiza métricas de backup
     */
    updateBackupMetrics(type, success, duration, backupPackage) {
        try {
            this.metrics.totalBackups++;
            
            if (success) {
                this.metrics.successfulBackups++;
                
                // Actualizar tiempo promedio
                const prevAvg = this.metrics.averageBackupTime;
                const count = this.metrics.successfulBackups;
                this.metrics.averageBackupTime = (prevAvg * (count - 1) + duration) / count;
                
                // Actualizar tamaño total guardado
                if (backupPackage && backupPackage.metadata) {
                    this.metrics.totalDataSaved += backupPackage.metadata.dataStats?.dataSize || 0;
                }
                
            } else {
                this.metrics.failedBackups++;
            }
            
            // Registrar métrica de performance
            this.recordPerformanceMetric(`backup_${type}`, duration);
            
            console.log(`📊 Métricas actualizadas - Total: ${this.metrics.totalBackups}, Exitosos: ${this.metrics.successfulBackups}`);
            
        } catch (error) {
            console.error('Error actualizando métricas:', error);
        }
    }
    
    /**
     * Registra métrica de performance
     */
    recordPerformanceMetric(operation, duration) {
        try {
            const metric = {
                operation: operation,
                duration: duration,
                timestamp: Date.now()
            };
            
            this.metrics.performanceMetrics.push(metric);
            
            // Mantener solo métricas recientes (últimas 100)
            if (this.metrics.performanceMetrics.length > 100) {
                this.metrics.performanceMetrics.shift();
            }
            
        } catch (error) {
            console.error('Error registrando métrica:', error);
        }
    }
    
    /**
     * Maneja errores de backup
     */
    handleBackupError(type, error, backupId) {
        this.metrics.failedBackups++;
        this.metrics.lastError = {
            type: type,
            backupId: backupId,
            error: error.message,
            timestamp: Date.now()
        };
        
        console.error(`❌ Error en backup ${type}:`, error);
        
        // Limpiar backup parcial si existe
        if (backupId) {
            this.cleanupFailedBackup(backupId);
        }
        
        // Notificar cross-tab del error
        this.broadcastBackupCompletion(backupId, type, false, error.message);
        
        // Alertar si está configurado
        if (this.config.alertOnFailure) {
            this.showBackupAlert(`Error en backup ${type}: ${error.message}`, 'error');
        }
    }
    
    /**
     * Limpia backup fallido
     */
    cleanupFailedBackup(backupId) {
        try {
            const keysToRemove = [
                this.backupPrefix + backupId,
                this.checksumPrefix + backupId,
                this.metadataPrefix + backupId,
                this.recoveryPrefix + backupId
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.recoveryPoints.delete(this.recoveryPrefix + backupId);
            
            console.log(`🧹 Backup fallido limpiado: ${backupId}`);
            
        } catch (error) {
            console.error('Error limpiando backup fallido:', error);
        }
    }
    
    /**
     * Difunde mensaje de backup completado a otras pestañas
     */
    broadcastBackupCompletion(backupId, type, success, error = null) {
        if (!this.crossTabChannel) return;
        
        try {
            this.crossTabChannel.postMessage({
                type: 'backup_completed',
                backupId: backupId,
                backupType: type,
                success: success,
                error: error,
                timestamp: Date.now(),
                tabId: this.tabId
            });
            
        } catch (error) {
            console.error('Error difundiendo mensaje:', error);
        }
    }
    
    /**
     * MÉTODO PRINCIPAL: Restaurar desde backup
     */
    async restoreFromBackup(backupId, options = {}) {
        if (this.isRecoveryInProgress) {
            throw new Error('Recovery ya en progreso');
        }
        
        this.isRecoveryInProgress = true;
        const startTime = performance.now();
        
        try {
            console.log(`🔄 Iniciando restauración desde backup: ${backupId}`);
            
            // PASO 1: Validar backup
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                throw new Error(`Backup no encontrado: ${backupId}`);
            }
            
            // PASO 2: Verificar integridad
            const isValid = await this.verifyBackupIntegrity(backupId);
            if (!isValid && !options.forceRestore) {
                throw new Error('Backup corrupto o inválido');
            }
            
            // PASO 3: Crear backup de seguridad del estado actual
            let safetyBackupId = null;
            if (!options.skipSafetyBackup) {
                safetyBackupId = await this.performFullBackup('safety_before_restore');
                console.log(`💾 Backup de seguridad creado: ${safetyBackupId}`);
            }
            
            // PASO 4: Desencriptar y descomprimir datos
            const restoredData = await this.prepareBackupData(backup);
            
            // PASO 5: Aplicar restauración según tipo de backup
            let fullData;
            if (backup.type === 'full') {
                fullData = restoredData;
            } else if (backup.type === 'incremental') {
                fullData = await this.reconstructFromIncremental(backupId);
            } else {
                throw new Error(`Tipo de backup no soportado: ${backup.type}`);
            }
            
            // PASO 6: Validar datos antes de aplicar
            this.validateRestoredData(fullData);
            
            // PASO 7: Aplicar datos restaurados
            await this.applyRestoredData(fullData, options);
            
            // PASO 8: Verificar resultado
            const verification = await this.verifyRestorationSuccess(fullData);
            if (!verification.success) {
                throw new Error(`Verificación falló: ${verification.error}`);
            }
            
            // PASO 9: Actualizar métricas
            const recoveryTime = performance.now() - startTime;
            this.updateRecoveryMetrics(true, recoveryTime);
            
            // PASO 10: Notificar éxito
            this.broadcastRecoveryCompletion(backupId, true, safetyBackupId);
            
            console.log(`✅ Restauración exitosa en ${recoveryTime.toFixed(2)}ms`);
            
            return {
                success: true,
                backupId: backupId,
                safetyBackupId: safetyBackupId,
                restoredData: this.getRestorationSummary(fullData)
            };
            
        } catch (error) {
            this.handleRecoveryError(backupId, error);
            throw error;
            
        } finally {
            this.isRecoveryInProgress = false;
        }
    }
    
    /**
     * Carga backup del almacenamiento
     */
    async loadBackup(backupId) {
        try {
            const backupKey = this.backupPrefix + backupId;
            const backupData = localStorage.getItem(backupKey);
            
            if (!backupData) {
                return null;
            }
            
            return JSON.parse(backupData);
            
        } catch (error) {
            console.error(`Error cargando backup ${backupId}:`, error);
            return null;
        }
    }
    
    /**
     * Verifica integridad de un backup
     */
    async verifyBackupIntegrity(backupId) {
        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                return false;
            }
            
            // Verificar checksum si está disponible
            if (backup.checksum && this.config.checksumValidation) {
                const storedChecksum = localStorage.getItem(this.checksumPrefix + backupId);
                if (storedChecksum && storedChecksum !== backup.checksum) {
                    console.error(`Checksum mismatch para backup ${backupId}`);
                    return false;
                }
                
                // Recalcular checksum de los datos
                const calculatedChecksum = await this.generateChecksum(backup.data);
                if (calculatedChecksum !== backup.checksum) {
                    console.error(`Checksum calculado no coincide para backup ${backupId}`);
                    return false;
                }
            }
            
            // Verificar estructura básica
            if (!backup.id || !backup.version || !backup.type || !backup.data) {
                console.error(`Estructura de backup inválida: ${backupId}`);
                return false;
            }
            
            this.metrics.dataIntegrityChecks++;
            return true;
            
        } catch (error) {
            console.error(`Error verificando integridad de backup ${backupId}:`, error);
            return false;
        }
    }
    
    /**
     * Prepara datos de backup para restauración
     */
    async prepareBackupData(backup) {
        try {
            let data = backup.data;
            
            // Desencriptar si está encriptado
            if (backup.encrypted) {
                data = await this.decryptData(data);
            }
            
            // Descomprimir si está comprimido
            if (backup.compressed) {
                data = await this.decompressData(data);
            }
            
            // Parsear JSON si es string
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            
            return data;
            
        } catch (error) {
            console.error('Error preparando datos de backup:', error);
            throw new Error('Error procesando datos de backup');
        }
    }
    
    /**
     * Desencripta datos
     */
    async decryptData(encryptedData) {
        if (!this.encryptionEnabled) {
            return encryptedData;
        }
        
        try {
            // Usar SecurityManager si está disponible
            if (this.securityManager && typeof this.securityManager.decryptData === 'function') {
                return await this.securityManager.decryptData(encryptedData);
            }
            
            // Usar clave específica de backup
            if (this.backupEncryptionKey && typeof encryptedData === 'string') {
                const combined = new Uint8Array(
                    atob(encryptedData).split('').map(char => char.charCodeAt(0))
                );
                
                const iv = combined.slice(0, 12);
                const encryptedBuffer = combined.slice(12);
                
                const decryptedBuffer = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    this.backupEncryptionKey,
                    encryptedBuffer
                );
                
                const decoder = new TextDecoder();
                return decoder.decode(decryptedBuffer);
            }
            
            return encryptedData;
            
        } catch (error) {
            console.error('Error desencriptando datos:', error);
            throw new Error('Error desencriptando datos de backup');
        }
    }
    
    /**
     * Descomprime datos
     */
    async decompressData(compressedData) {
        if (!this.compressionSupported) {
            return compressedData;
        }
        
        try {
            if (Array.isArray(compressedData) && typeof CompressionStream !== 'undefined') {
                // Descompresión nativa
                const compressed = new Uint8Array(compressedData);
                const stream = new DecompressionStream('gzip');
                const writer = stream.writable.getWriter();
                const reader = stream.readable.getReader();
                
                writer.write(compressed);
                writer.close();
                
                const chunks = [];
                let done = false;
                
                while (!done) {
                    const result = await reader.read();
                    done = result.done;
                    if (result.value) {
                        chunks.push(result.value);
                    }
                }
                
                const decompressed = new Uint8Array(
                    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
                );
                let offset = 0;
                for (const chunk of chunks) {
                    decompressed.set(chunk, offset);
                    offset += chunk.length;
                }
                
                return new TextDecoder().decode(decompressed);
            } else if (Array.isArray(compressedData)) {
                // Descompresión básica
                return this.basicDecompress(compressedData);
            }
            
            return compressedData;
            
        } catch (error) {
            console.warn('Error descomprimiendo, usando datos como están:', error);
            return compressedData;
        }
    }
    
    /**
     * Descompresión básica
     */
    basicDecompress(compressedArray) {
        try {
            let result = '';
            
            for (const item of compressedArray) {
                if (typeof item === 'string') {
                    result += item;
                } else if (Array.isArray(item) && item.length === 2) {
                    // [distancia, longitud]
                    const [distance, length] = item;
                    const startPos = Math.max(0, result.length - distance);
                    
                    for (let i = 0; i < length; i++) {
                        result += result[startPos + (i % distance)];
                    }
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('Error en descompresión básica:', error);
            return JSON.stringify(compressedArray);
        }
    }
    
    /**
     * Reconstruye datos completos desde backup incremental
     */
    async reconstructFromIncremental(backupId) {
        try {
            console.log(`🔄 Reconstruyendo desde backup incremental: ${backupId}`);
            
            // Obtener cadena de backups incrementales
            const backupChain = await this.buildBackupChain(backupId);
            
            // Encontrar backup base (completo)
            const baseBackup = backupChain.find(b => b.type === 'full');
            if (!baseBackup) {
                throw new Error('No se encontró backup base para reconstrucción');
            }
            
            // Cargar datos base
            let fullData = await this.prepareBackupData(baseBackup);
            
            // Aplicar cambios incrementales en orden
            const incrementals = backupChain
                .filter(b => b.type === 'incremental')
                .sort((a, b) => a.timestamp - b.timestamp);
            
            for (const incremental of incrementals) {
                const incrementalData = await this.prepareBackupData(incremental);
                fullData = this.applyIncrementalChanges(fullData, incrementalData);
            }
            
            console.log(`✅ Reconstrucción completada con ${incrementals.length} cambios incrementales`);
            return fullData;
            
        } catch (error) {
            console.error('Error reconstruyendo desde incremental:', error);
            throw error;
        }
    }
    
    /**
     * Construye cadena de backups para reconstrucción
     */
    async buildBackupChain(backupId) {
        const chain = [];
        let currentBackupId = backupId;
        
        try {
            while (currentBackupId) {
                const backup = await this.loadBackup(currentBackupId);
                if (!backup) {
                    break;
                }
                
                chain.unshift(backup); // Agregar al inicio para orden cronológico
                
                // Si es backup completo, terminamos
                if (backup.type === 'full') {
                    break;
                }
                
                // Buscar backup base
                currentBackupId = backup.basedOn;
            }
            
            return chain;
            
        } catch (error) {
            console.error('Error construyendo cadena de backups:', error);
            return [];
        }
    }
    
    /**
     * Aplica cambios incrementales a los datos base
     */
    applyIncrementalChanges(baseData, incrementalData) {
        try {
            const result = JSON.parse(JSON.stringify(baseData)); // Deep copy
            
            // Aplicar cambios de recibos
            if (incrementalData.receipts) {
                result.receipts = this.applyArrayChanges(
                    result.receipts || [], 
                    incrementalData.receipts
                );
            }
            
            // Aplicar cambios de clientes
            if (incrementalData.clients) {
                result.clients = this.applyArrayChanges(
                    result.clients || [], 
                    incrementalData.clients
                );
            }
            
            // Aplicar cambios de cotizaciones
            if (incrementalData.quotations) {
                result.quotations = this.applyArrayChanges(
                    result.quotations || [], 
                    incrementalData.quotations
                );
            }
            
            return result;
            
        } catch (error) {
            console.error('Error aplicando cambios incrementales:', error);
            return baseData;
        }
    }
    
    /**
     * Aplica cambios a un array de datos
     */
    applyArrayChanges(baseArray, changes) {
        let result = [...baseArray];
        
        try {
            for (const change of changes) {
                const { action, item } = change;
                
                if (action === 'added') {
                    result.push(item);
                } else if (action === 'modified') {
                    const index = result.findIndex(r => r.id === item.id);
                    if (index >= 0) {
                        result[index] = item;
                    } else {
                        result.push(item); // Si no se encuentra, agregar
                    }
                } else if (action === 'deleted') {
                    result = result.filter(r => r.id !== item.id);
                }
            }
            
        } catch (error) {
            console.error('Error aplicando cambios al array:', error);
        }
        
        return result;
    }
    
    /**
     * Valida datos restaurados antes de aplicar
     */
    validateRestoredData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Datos de restauración inválidos');
        }
        
        // Validar estructura básica
        const requiredFields = ['receipts', 'clients', 'quotations'];
        for (const field of requiredFields) {
            if (data[field] && !Array.isArray(data[field])) {
                throw new Error(`Campo ${field} debe ser un array`);
            }
        }
        
        // Sanitizar datos si XSS Protection está disponible
        if (this.xssProtection) {
            return this.xssProtection.sanitizeJSON(data);
        }
        
        return data;
    }
    
    /**
     * Aplica datos restaurados al sistema
     */
    async applyRestoredData(data, options = {}) {
        try {
            // Aplicar recibos
            if (data.receipts && Array.isArray(data.receipts)) {
                await this.restoreDataToStorage('ciaociao_receipts', data.receipts);
                console.log(`📄 ${data.receipts.length} recibos restaurados`);
            }
            
            // Aplicar clientes
            if (data.clients && Array.isArray(data.clients)) {
                await this.restoreDataToStorage('ciaociao_clients', data.clients);
                console.log(`👥 ${data.clients.length} clientes restaurados`);
            }
            
            // Aplicar cotizaciones
            if (data.quotations && Array.isArray(data.quotations)) {
                await this.restoreDataToStorage('ciaociao_quotations', data.quotations);
                console.log(`💰 ${data.quotations.length} cotizaciones restauradas`);
            }
            
            // Aplicar configuraciones si están incluidas
            if (data.settings && typeof data.settings === 'object') {
                for (const [key, value] of Object.entries(data.settings)) {
                    localStorage.setItem(key, JSON.stringify(value));
                }
                console.log(`⚙️ Configuraciones restauradas`);
            }
            
            // Notificar a la aplicación sobre la restauración
            if (options.reloadAfterRestore !== false) {
                setTimeout(() => {
                    console.log('🔄 Recargando aplicación después de restauración...');
                    window.location.reload();
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error aplicando datos restaurados:', error);
            throw error;
        }
    }
    
    /**
     * Restaura datos a localStorage con encriptación si está disponible
     */
    async restoreDataToStorage(key, data) {
        try {
            if (this.database && typeof this.database.setItem === 'function') {
                // Usar método encriptado de database si está disponible
                await this.database.setItem(key, data);
            } else {
                // Fallback a localStorage directo
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (error) {
            console.error(`Error restaurando ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Verifica el éxito de la restauración
     */
    async verifyRestorationSuccess(expectedData) {
        try {
            // Verificar recibos
            const currentReceipts = this.database ? 
                await this.database.getAllReceipts() : 
                this.getDirectFromStorage('ciaociao_receipts');
            
            if (expectedData.receipts && currentReceipts.length !== expectedData.receipts.length) {
                return {
                    success: false,
                    error: 'Cantidad de recibos no coincide después de restauración'
                };
            }
            
            // Verificar clientes
            const currentClients = this.database ? 
                this.database.getAllClients() : 
                this.getDirectFromStorage('ciaociao_clients');
            
            if (expectedData.clients && currentClients.length !== expectedData.clients.length) {
                return {
                    success: false,
                    error: 'Cantidad de clientes no coincide después de restauración'
                };
            }
            
            // Verificar cotizaciones
            const currentQuotations = this.database ? 
                this.database.getAllQuotations() : 
                this.getDirectFromStorage('ciaociao_quotations');
            
            if (expectedData.quotations && currentQuotations.length !== expectedData.quotations.length) {
                return {
                    success: false,
                    error: 'Cantidad de cotizaciones no coincide después de restauración'
                };
            }
            
            return { success: true };
            
        } catch (error) {
            return {
                success: false,
                error: `Error verificando restauración: ${error.message}`
            };
        }
    }
    
    /**
     * Obtiene resumen de restauración
     */
    getRestorationSummary(data) {
        return {
            receipts: data.receipts ? data.receipts.length : 0,
            clients: data.clients ? data.clients.length : 0,
            quotations: data.quotations ? data.quotations.length : 0,
            settings: data.settings ? Object.keys(data.settings).length : 0
        };
    }
    
    /**
     * Actualiza métricas de recovery
     */
    updateRecoveryMetrics(success, duration) {
        this.metrics.totalRecoveries++;
        
        if (success) {
            this.metrics.successfulRecoveries++;
            
            const prevAvg = this.metrics.averageRecoveryTime;
            const count = this.metrics.successfulRecoveries;
            this.metrics.averageRecoveryTime = (prevAvg * (count - 1) + duration) / count;
        } else {
            this.metrics.failedRecoveries++;
        }
        
        this.recordPerformanceMetric('recovery', duration);
    }
    
    /**
     * Maneja errores de recovery
     */
    handleRecoveryError(backupId, error) {
        this.metrics.failedRecoveries++;
        this.metrics.lastError = {
            type: 'recovery',
            backupId: backupId,
            error: error.message,
            timestamp: Date.now()
        };
        
        console.error(`❌ Error en recovery ${backupId}:`, error);
        this.broadcastRecoveryCompletion(backupId, false, null, error.message);
    }
    
    /**
     * Difunde resultado de recovery
     */
    broadcastRecoveryCompletion(backupId, success, safetyBackupId = null, error = null) {
        if (!this.crossTabChannel) return;
        
        try {
            this.crossTabChannel.postMessage({
                type: 'recovery_completed',
                backupId: backupId,
                success: success,
                safetyBackupId: safetyBackupId,
                error: error,
                timestamp: Date.now(),
                tabId: this.tabId
            });
        } catch (error) {
            console.error('Error difundiendo recovery:', error);
        }
    }
    
    /**
     * CLEANUP Y MANTENIMIENTO
     */
    
    /**
     * Realiza cleanup automático
     */
    async performAutomaticCleanup() {
        try {
            console.log('🧹 Iniciando cleanup automático...');
            
            const cleanupResults = {
                oldBackups: 0,
                corruptedBackups: 0,
                freedSpace: 0
            };
            
            // Limpiar backups antiguos
            const oldBackups = await this.cleanOldBackups();
            cleanupResults.oldBackups = oldBackups.length;
            
            // Limpiar backups corruptos
            const corruptedBackups = await this.cleanCorruptedBackups();
            cleanupResults.corruptedBackups = corruptedBackups.length;
            
            // Limpiar recovery points huérfanos
            await this.cleanOrphanedRecoveryPoints();
            
            // Calcular espacio liberado (aproximado)
            cleanupResults.freedSpace = this.calculateFreedSpace(oldBackups, corruptedBackups);
            
            console.log(`✅ Cleanup completado:`, cleanupResults);
            
            this.logOperation('cleanup', 'success', cleanupResults);
            
        } catch (error) {
            console.error('❌ Error en cleanup automático:', error);
            this.logOperation('cleanup', 'error', { error: error.message });
        }
    }
    
    /**
     * Limpia backups antiguos según retention policy
     */
    async cleanOldBackups() {
        const oldBackups = [];
        const cutoffDate = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
        
        try {
            const allBackups = this.listExistingBackups();
            
            for (const backupKey of allBackups) {
                const timestamp = this.extractTimestampFromKey(backupKey);
                
                if (timestamp < cutoffDate) {
                    // Verificar si no es el último backup completo
                    const backup = await this.loadBackup(this.extractBackupIdFromKey(backupKey));
                    
                    if (backup && backup.type === 'full' && this.isLastFullBackup(backup.id)) {
                        console.log(`⚠️ Manteniendo último backup completo: ${backup.id}`);
                        continue;
                    }
                    
                    this.removeBackup(backupKey);
                    oldBackups.push(backupKey);
                }
            }
            
        } catch (error) {
            console.error('Error limpiando backups antiguos:', error);
        }
        
        return oldBackups;
    }
    
    /**
     * Limpia backups corruptos
     */
    async cleanCorruptedBackups() {
        const corruptedBackups = [];
        
        try {
            const allBackups = this.listExistingBackups();
            
            for (const backupKey of allBackups) {
                const backupId = this.extractBackupIdFromKey(backupKey);
                const isValid = await this.verifyBackupIntegrity(backupId);
                
                if (!isValid) {
                    this.removeBackup(backupKey);
                    corruptedBackups.push(backupKey);
                    console.log(`🗑️ Backup corrupto eliminado: ${backupId}`);
                }
            }
            
        } catch (error) {
            console.error('Error limpiando backups corruptos:', error);
        }
        
        return corruptedBackups;
    }
    
    /**
     * Limpia recovery points huérfanos
     */
    async cleanOrphanedRecoveryPoints() {
        try {
            const existingBackups = new Set(
                this.listExistingBackups().map(key => this.extractBackupIdFromKey(key))
            );
            
            const orphanedPoints = [];
            
            for (const [recoveryKey, recoveryPoint] of this.recoveryPoints) {
                if (!existingBackups.has(recoveryPoint.backupId)) {
                    localStorage.removeItem(recoveryKey);
                    this.recoveryPoints.delete(recoveryKey);
                    orphanedPoints.push(recoveryKey);
                }
            }
            
            if (orphanedPoints.length > 0) {
                console.log(`🧹 ${orphanedPoints.length} recovery points huérfanos eliminados`);
            }
            
        } catch (error) {
            console.error('Error limpiando recovery points:', error);
        }
    }
    
    /**
     * Extrae ID de backup de la clave
     */
    extractBackupIdFromKey(key) {
        return key.replace(this.backupPrefix, '');
    }
    
    /**
     * Verifica si es el último backup completo
     */
    isLastFullBackup(backupId) {
        try {
            const fullBackups = this.listExistingBackups()
                .map(key => this.extractBackupIdFromKey(key))
                .filter(id => id.startsWith('full_'))
                .sort((a, b) => {
                    const timeA = this.extractTimestampFromKey(this.backupPrefix + a);
                    const timeB = this.extractTimestampFromKey(this.backupPrefix + b);
                    return timeB - timeA;
                });
            
            return fullBackups.length > 0 && fullBackups[0] === backupId;
            
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Remueve backup y sus archivos asociados
     */
    removeBackup(backupKey) {
        try {
            const backupId = this.extractBackupIdFromKey(backupKey);
            
            const keysToRemove = [
                backupKey,
                this.checksumPrefix + backupId,
                this.metadataPrefix + backupId,
                this.recoveryPrefix + backupId
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.recoveryPoints.delete(this.recoveryPrefix + backupId);
            
        } catch (error) {
            console.error('Error removiendo backup:', error);
        }
    }
    
    /**
     * Calcula espacio liberado (aproximado)
     */
    calculateFreedSpace(oldBackups, corruptedBackups) {
        let freedBytes = 0;
        
        try {
            const allRemovedBackups = [...oldBackups, ...corruptedBackups];
            
            for (const backupKey of allRemovedBackups) {
                // Estimación basada en el nombre de la clave
                freedBytes += 50000; // Estimación de 50KB por backup
            }
            
        } catch (error) {
            console.error('Error calculando espacio liberado:', error);
        }
        
        return Math.round(freedBytes / 1024); // Retornar en KB
    }
    
    /**
     * Cleanup de emergencia por falta de espacio
     */
    async emergencyCleanup() {
        try {
            console.log('🚨 Iniciando cleanup de emergencia por falta de espacio...');
            
            // Eliminar backups incrementales más antiguos primero
            const incrementalBackups = this.listExistingBackups()
                .filter(key => key.includes('incremental_'))
                .slice(this.config.maxIncrementalBackups);
            
            for (const backup of incrementalBackups) {
                this.removeBackup(backup);
            }
            
            // Si aún no hay espacio, eliminar backups completos antiguos (excepto los últimos 3)
            const fullBackups = this.listExistingBackups()
                .filter(key => key.includes('full_'))
                .slice(3); // Mantener últimos 3
            
            for (const backup of fullBackups) {
                this.removeBackup(backup);
            }
            
            console.log('✅ Cleanup de emergencia completado');
            
        } catch (error) {
            console.error('❌ Error en cleanup de emergencia:', error);
        }
    }
    
    /**
     * Verifica si añadir datos excedería el límite de almacenamiento
     */
    wouldExceedStorage(additionalBytes) {
        try {
            // Estimar uso actual de localStorage
            let currentSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                if (key && value) {
                    currentSize += key.length + value.length;
                }
            }
            
            // Límite típico de localStorage: 5-10MB
            const estimatedLimit = 5 * 1024 * 1024; // 5MB
            const projectedSize = currentSize + additionalBytes;
            
            return projectedSize > (estimatedLimit * 0.9); // 90% del límite
            
        } catch (error) {
            console.error('Error verificando límite de almacenamiento:', error);
            return false;
        }
    }
    
    /**
     * Maneja exceso de cuota de almacenamiento
     */
    async handleStorageQuotaExceeded() {
        try {
            console.log('🚨 Cuota de almacenamiento excedida, realizando cleanup agresivo...');
            
            await this.emergencyCleanup();
            
            // Intentar liberar más espacio
            this.clearNonEssentialData();
            
        } catch (error) {
            console.error('Error manejando exceso de cuota:', error);
        }
    }
    
    /**
     * Limpia datos no esenciales
     */
    clearNonEssentialData() {
        try {
            // Limpiar logs antiguos
            const logsToRemove = ['xss_security_logs', 'security_events', 'auth_attempts'];
            logsToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Limpiar métricas de performance antiguas
            this.metrics.performanceMetrics = this.metrics.performanceMetrics.slice(-10);
            
            console.log('🧹 Datos no esenciales limpiados');
            
        } catch (error) {
            console.error('Error limpiando datos no esenciales:', error);
        }
    }
    
    /**
     * MONITOREO Y MÉTRICAS
     */
    
    /**
     * Monitorea performance del sistema
     */
    monitorPerformance() {
        try {
            const metrics = this.getPerformanceMetrics();
            
            // Alertar sobre performance degradada
            if (metrics.avgBackupTime > 5000) { // > 5 segundos
                console.warn('⚠️ Performance de backup degradada:', metrics.avgBackupTime + 'ms');
            }
            
            if (metrics.storageUsagePercent > 80) {
                console.warn('⚠️ Uso de almacenamiento alto:', metrics.storageUsagePercent + '%');
            }
            
            // Log métricas periódicamente
            this.logOperation('performance_check', 'info', metrics);
            
        } catch (error) {
            console.error('Error monitoreando performance:', error);
        }
    }
    
    /**
     * Monitorea uso de almacenamiento
     */
    monitorStorageUsage() {
        try {
            const usage = this.getStorageUsage();
            
            if (usage.usagePercent > 90) {
                console.warn('🚨 Almacenamiento casi lleno, iniciando cleanup...');
                this.performAutomaticCleanup();
            } else if (usage.usagePercent > 80) {
                console.warn('⚠️ Uso de almacenamiento alto:', usage.usagePercent + '%');
            }
            
        } catch (error) {
            console.error('Error monitoreando almacenamiento:', error);
        }
    }
    
    /**
     * Obtiene métricas de performance
     */
    getPerformanceMetrics() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        const recentMetrics = this.metrics.performanceMetrics
            .filter(m => m.timestamp > oneHourAgo);
        
        const avgDuration = recentMetrics.length > 0 
            ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
            : 0;
        
        return {
            totalBackups: this.metrics.totalBackups,
            successfulBackups: this.metrics.successfulBackups,
            failedBackups: this.metrics.failedBackups,
            avgBackupTime: this.metrics.averageBackupTime,
            avgRecoveryTime: this.metrics.averageRecoveryTime,
            compressionRatio: this.metrics.compressionRatio,
            recentAvgDuration: avgDuration,
            storageUsagePercent: this.getStorageUsage().usagePercent
        };
    }
    
    /**
     * Obtiene uso de almacenamiento
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let backupSize = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (key && value) {
                    const size = key.length + value.length;
                    totalSize += size;
                    
                    if (key.startsWith(this.backupPrefix) || 
                        key.startsWith(this.checksumPrefix) || 
                        key.startsWith(this.metadataPrefix)) {
                        backupSize += size;
                    }
                }
            }
            
            const estimatedLimit = 5 * 1024 * 1024; // 5MB
            
            return {
                totalSize: Math.round(totalSize / 1024), // KB
                backupSize: Math.round(backupSize / 1024), // KB
                usagePercent: Math.round((totalSize / estimatedLimit) * 100),
                backupPercent: Math.round((backupSize / totalSize) * 100)
            };
            
        } catch (error) {
            console.error('Error calculando uso de almacenamiento:', error);
            return { totalSize: 0, backupSize: 0, usagePercent: 0, backupPercent: 0 };
        }
    }
    
    /**
     * UTILIDADES Y HELPERS
     */
    
    /**
     * Ajusta configuración según soporte del navegador
     */
    adjustConfigForBrowserSupport(missing) {
        if (missing.includes('compressionStreams')) {
            this.config.compressionLevel = 0;
            console.log('ℹ️ Compresión deshabilitada - no hay soporte nativo');
        }
        
        if (missing.includes('webCrypto')) {
            this.config.encryptionEnabled = false;
            console.log('ℹ️ Encriptación deshabilitada - Web Crypto API no disponible');
        }
        
        if (missing.includes('broadcastChannel')) {
            this.config.crossTabSync = false;
            console.log('ℹ️ Cross-tab sync deshabilitado - BroadcastChannel no disponible');
        }
        
        if (missing.includes('workers')) {
            console.log('ℹ️ Web Workers no disponibles - operaciones en thread principal');
        }
    }
    
    /**
     * Maneja mensajes cross-tab
     */
    handleCrossTabMessage(data) {
        try {
            switch (data.type) {
                case 'backup_completed':
                    this.handleCrossTabBackupCompleted(data);
                    break;
                    
                case 'recovery_completed':
                    this.handleCrossTabRecoveryCompleted(data);
                    break;
                    
                case 'presence':
                    this.handleCrossTabPresence(data);
                    break;
                    
                default:
                    console.log('Mensaje cross-tab desconocido:', data.type);
            }
            
        } catch (error) {
            console.error('Error manejando mensaje cross-tab:', error);
        }
    }
    
    /**
     * Maneja notificación de backup completado en otra pestaña
     */
    handleCrossTabBackupCompleted(data) {
        if (data.tabId === this.tabId) return; // Ignorar nuestros propios mensajes
        
        console.log(`📡 Backup ${data.success ? 'exitoso' : 'fallido'} en otra pestaña: ${data.backupId}`);
        
        // Actualizar nuestra vista de backups disponibles
        if (data.success) {
            this.refreshBackupsList();
        }
    }
    
    /**
     * Maneja notificación de recovery completado
     */
    handleCrossTabRecoveryCompleted(data) {
        if (data.tabId === this.tabId) return;
        
        console.log(`📡 Recovery ${data.success ? 'exitoso' : 'fallido'} en otra pestaña: ${data.backupId}`);
        
        if (data.success) {
            // Otra pestaña realizó recovery, podríamos necesitar recargar
            console.log('ℹ️ Datos restaurados en otra pestaña - considera recargar esta pestaña');
        }
    }
    
    /**
     * Maneja presencia de otra pestaña
     */
    handleCrossTabPresence(data) {
        if (data.tabId === this.tabId) return;
        
        console.log(`📡 Otra pestaña detectada: ${data.tabId}`);
    }
    
    /**
     * Difunde mensaje a otras pestañas
     */
    broadcastMessage(message) {
        if (!this.crossTabChannel) return;
        
        try {
            this.crossTabChannel.postMessage({
                ...message,
                tabId: this.tabId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error difundiendo mensaje:', error);
        }
    }
    
    /**
     * Refresca lista de backups
     */
    refreshBackupsList() {
        // Limpiar caché interno si existiera
        this.backupListCache = null;
    }
    
    /**
     * Log de operaciones
     */
    logOperation(operation, status, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation,
            status: status,
            data: data,
            version: this.version
        };
        
        console.log(`📝 BackupManager Log [${status.toUpperCase()}]:`, logEntry);
        
        // Almacenar en métricas si es necesario
        if (status === 'error') {
            this.metrics.lastError = logEntry;
        }
    }
    
    /**
     * Maneja errores críticos
     */
    handleCriticalError(operation, error) {
        this.metrics.errors = (this.metrics.errors || 0) + 1;
        
        const errorInfo = {
            operation: operation,
            error: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            config: this.config
        };
        
        console.error('❌ Error crítico en BackupManager:', errorInfo);
        
        this.logOperation(operation, 'critical_error', errorInfo);
        
        if (this.config.alertOnFailure) {
            this.showBackupAlert(`Error crítico: ${error.message}`, 'error');
        }
    }
    
    /**
     * Muestra alerta de backup al usuario
     */
    showBackupAlert(message, type = 'info') {
        try {
            // Intentar usar sistema de notificaciones existente
            if (window.utils && typeof window.utils.showNotification === 'function') {
                window.utils.showNotification(message, type);
            } else if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                // Fallback a console
                console.log(`🔔 BackupManager Alert [${type.toUpperCase()}]: ${message}`);
            }
        } catch (error) {
            console.error('Error mostrando alerta:', error);
        }
    }
    
    /**
     * Marca backup para cleanup
     */
    markBackupForCleanup(backupKey) {
        try {
            const cleanupList = JSON.parse(localStorage.getItem('backup_cleanup_queue') || '[]');
            cleanupList.push({
                backupKey: backupKey,
                markedAt: Date.now()
            });
            localStorage.setItem('backup_cleanup_queue', JSON.stringify(cleanupList));
        } catch (error) {
            console.error('Error marcando backup para cleanup:', error);
        }
    }
    
    /**
     * API PÚBLICA
     */
    
    /**
     * Obtiene lista de backups disponibles
     */
    getAvailableBackups() {
        try {
            const backups = this.listExistingBackups();
            const backupInfo = [];
            
            for (const backupKey of backups) {
                try {
                    const backupId = this.extractBackupIdFromKey(backupKey);
                    const metadata = localStorage.getItem(this.metadataPrefix + backupId);
                    
                    if (metadata) {
                        const meta = JSON.parse(metadata);
                        backupInfo.push({
                            id: backupId,
                            type: meta.type,
                            timestamp: meta.timestamp,
                            trigger: meta.trigger,
                            dataStats: meta.dataStats,
                            canRestore: true,
                            size: this.getBackupSize(backupKey)
                        });
                    }
                } catch (error) {
                    console.warn(`Error procesando backup ${backupKey}:`, error);
                }
            }
            
            return backupInfo.sort((a, b) => b.timestamp - a.timestamp);
            
        } catch (error) {
            console.error('Error obteniendo backups disponibles:', error);
            return [];
        }
    }
    
    /**
     * Obtiene tamaño de un backup
     */
    getBackupSize(backupKey) {
        try {
            const data = localStorage.getItem(backupKey);
            return data ? Math.round(data.length / 1024) : 0; // KB
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Exporta backup a archivo
     */
    async exportBackup(backupId) {
        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                throw new Error('Backup no encontrado');
            }
            
            const exportData = {
                backupManager: {
                    version: this.version,
                    exported: new Date().toISOString()
                },
                backup: backup
            };
            
            const exportString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([exportString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            console.log(`📤 Backup exportado: ${backupId}`);
            return true;
            
        } catch (error) {
            console.error('Error exportando backup:', error);
            return false;
        }
    }
    
    /**
     * Importa backup desde archivo
     */
    async importBackup(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (!importData.backup || !importData.backup.id) {
                            throw new Error('Formato de backup inválido');
                        }
                        
                        const backup = importData.backup;
                        
                        // Verificar compatibilidad de versión
                        if (backup.version && backup.version !== this.version) {
                            console.warn('⚠️ Versión de backup diferente:', backup.version);
                        }
                        
                        // Almacenar backup importado
                        await this.storeBackup(backup.id, backup);
                        
                        console.log(`📥 Backup importado exitosamente: ${backup.id}`);
                        resolve(backup.id);
                        
                    } catch (error) {
                        console.error('Error procesando archivo de backup:', error);
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Error leyendo archivo'));
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Obtiene estado del sistema
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            version: this.version,
            config: this.config,
            isBackupInProgress: this.isBackupInProgress,
            isRecoveryInProgress: this.isRecoveryInProgress,
            lastBackupTime: this.lastBackupTime,
            lastFullBackupTime: this.lastFullBackupTime,
            integrations: {
                securityManager: !!this.securityManager,
                xssProtection: !!this.xssProtection,
                database: !!this.database
            },
            capabilities: {
                encryption: this.encryptionEnabled,
                compression: this.compressionSupported,
                crossTabSync: this.config.crossTabSync
            },
            metrics: this.metrics,
            storage: this.getStorageUsage()
        };
    }
    
    /**
     * Obtiene métricas completas
     */
    getMetrics() {
        return {
            ...this.metrics,
            performance: this.getPerformanceMetrics(),
            storage: this.getStorageUsage(),
            system: {
                uptime: Date.now() - (this.initTime || Date.now()),
                backupsAvailable: this.listExistingBackups().length,
                recoveryPointsAvailable: this.recoveryPoints.size
            }
        };
    }
    
    /**
     * Actualiza configuración
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        console.log('🔧 Configuración de BackupManager actualizada');
        
        // Reconfigurar scheduling si cambió
        if (oldConfig.fullBackupInterval !== this.config.fullBackupInterval ||
            oldConfig.incrementalInterval !== this.config.incrementalInterval) {
            this.setupAutomaticScheduling();
        }
        
        this.logOperation('config_update', 'success', { oldConfig, newConfig: this.config });
    }
    
    /**
     * Destructor - limpia recursos
     */
    destroy() {
        try {
            // Cancelar operaciones programadas
            for (const [name, intervalId] of this.scheduledOperations) {
                clearInterval(intervalId);
                console.log(`⏹️ Operación '${name}' cancelada`);
            }
            this.scheduledOperations.clear();
            
            // Cerrar canal cross-tab
            if (this.crossTabChannel) {
                this.crossTabChannel.close();
                this.crossTabChannel = null;
            }
            
            // Limpiar referencias
            this.securityManager = null;
            this.xssProtection = null;
            this.database = null;
            
            this.isInitialized = false;
            
            console.log('🏁 BackupManager destruido correctamente');
            
        } catch (error) {
            console.error('Error destruyendo BackupManager:', error);
        }
    }
}

// ============================================================
// INICIALIZACIÓN GLOBAL
// ============================================================

// Crear instancia global
let backupManager;

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            backupManager = new BackupManager();
            window.backupManager = backupManager;
            console.log('✅ BackupManager inicializado globalmente');
        } catch (error) {
            console.error('❌ Error inicializando BackupManager:', error);
        }
    });
} else {
    // DOM ya está listo
    setTimeout(async () => {
        try {
            backupManager = new BackupManager();
            window.backupManager = backupManager;
            console.log('✅ BackupManager inicializado globalmente');
        } catch (error) {
            console.error('❌ Error inicializando BackupManager:', error);
        }
    }, 100);
}

// Funciones globales de conveniencia
window.performBackup = (type = 'full') => {
    if (!window.backupManager || !window.backupManager.isInitialized) {
        console.error('❌ BackupManager no inicializado');
        return Promise.reject(new Error('BackupManager no disponible'));
    }
    
    if (type === 'incremental') {
        return window.backupManager.performIncrementalBackup('manual');
    } else {
        return window.backupManager.performFullBackup('manual');
    }
};

window.restoreBackup = (backupId, options = {}) => {
    if (!window.backupManager || !window.backupManager.isInitialized) {
        console.error('❌ BackupManager no inicializado');
        return Promise.reject(new Error('BackupManager no disponible'));
    }
    
    return window.backupManager.restoreFromBackup(backupId, options);
};

window.getBackupStatus = () => {
    if (!window.backupManager) {
        return null;
    }
    
    return window.backupManager.getSystemStatus();
};

window.listBackups = () => {
    if (!window.backupManager) {
        return [];
    }
    
    return window.backupManager.getAvailableBackups();
};

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupManager;
}

console.log('💾 BackupManager enterprise-grade cargado - Protección completa de datos con integración SecurityManager + XSSProtection');