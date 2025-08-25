// database.js - Sistema robusto de base de datos local con encriptación AES-256
class ReceiptDatabase {
    constructor() {
        this.dbName = 'ciaociao_receipts';
        this.clientsDbName = 'ciaociao_clients';
        this.quotationsDbName = 'ciaociao_quotations';
        this.maxReceipts = 1000;
        this.maxQuotations = 500;
        this.backupInterval = 5;
        this.securityManager = null; // Se inicializará cuando esté disponible
        this.backupManager = null;   // Integración con BackupManager enterprise
        this.encryptionEnabled = false;
        this.autoBackupEnabled = true;
        this.lastBackupTrigger = null;
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            // Verificar si localStorage está disponible
            if (typeof(Storage) === "undefined") {
                throw new Error("LocalStorage no está disponible en este navegador");
            }

            // Esperar a que SecurityManager esté disponible
            await this.waitForSecurityManager();
            
            // Integrar con BackupManager enterprise
            await this.integrateBackupManager();

            // Inicializar base de datos si no existe
            if (!localStorage.getItem(this.dbName)) {
                await this.setItem(this.dbName, []);
            }
            
            if (!localStorage.getItem(this.clientsDbName)) {
                await this.setItem(this.clientsDbName, []);
            }
            
            if (!localStorage.getItem(this.quotationsDbName)) {
                await this.setItem(this.quotationsDbName, []);
            }

            // Verificar integridad de datos
            this.validateDatabase();
            
            // Limpiar datos antiguos si excede el límite
            this.cleanOldReceipts();
            
            console.log('✅ Base de datos inicializada correctamente' + 
                       (this.encryptionEnabled ? ' con encriptación AES-256' : ' (sin encriptación)') +
                       (this.backupManager ? ' + BackupManager enterprise' : ''));
        } catch (error) {
            console.error('❌ Error inicializando base de datos:', error);
            this.handleDatabaseError(error);
        }
    }

    /**
     * Espera a que SecurityManager esté disponible
     */
    async waitForSecurityManager(maxAttempts = 15) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.authManager?.securityManager) {
                this.securityManager = window.authManager.securityManager;
                this.encryptionEnabled = true;
                console.log('✅ Database: Encriptación AES-256 habilitada');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.warn('⚠️ Database: SecurityManager no disponible, datos sin encriptar');
        this.encryptionEnabled = false;
    }
    
    /**
     * Integra con BackupManager enterprise para protección completa
     */
    async integrateBackupManager(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.backupManager && window.backupManager.isInitialized) {
                this.backupManager = window.backupManager;
                console.log('✅ Database: Integración con BackupManager enterprise completada');
                
                // Configurar triggers automáticos
                this.setupAutomaticBackupTriggers();
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        console.warn('⚠️ Database: BackupManager no disponible, usando sistema legacy');
        this.backupManager = null;
    }
    
    /**
     * Configura triggers automáticos de backup
     */
    setupAutomaticBackupTriggers() {
        if (!this.backupManager || !this.autoBackupEnabled) {
            return;
        }
        
        // Configurar backup inteligente basado en actividad
        this.backupTriggerCount = 0;
        this.lastSignificantChange = Date.now();
        
        console.log('🔄 Triggers automáticos de backup configurados');
    }

    /**
     * Método de almacenamiento con encriptación AES-256
     */
    async setItem(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            
            if (this.encryptionEnabled && this.securityManager) {
                // Encriptar datos sensibles usando SecurityManager
                const encryptedData = await this.securityManager.encryptData(jsonData);
                localStorage.setItem(key + '_encrypted', encryptedData);
                console.log(`🔒 Datos encriptados guardados: ${key}`);
            } else {
                // Fallback sin encriptación
                localStorage.setItem(key, jsonData);
                console.log(`💾 Datos guardados sin encriptar: ${key}`);
            }
        } catch (error) {
            console.error('❌ Error guardando datos:', error);
            // Fallback a almacenamiento sin encriptar en caso de error
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    /**
     * Método de lectura con desencriptación AES-256
     */
    async getItem(key) {
        try {
            // Intentar leer datos encriptados primero
            if (this.encryptionEnabled && this.securityManager) {
                const encryptedData = localStorage.getItem(key + '_encrypted');
                if (encryptedData) {
                    const decryptedData = await this.securityManager.decryptData(encryptedData);
                    console.log(`🔓 Datos desencriptados leídos: ${key}`);
                    return JSON.parse(decryptedData);
                }
            }
            
            // Fallback a datos sin encriptar
            const rawData = localStorage.getItem(key);
            if (rawData) {
                console.log(`📖 Datos sin encriptar leídos: ${key}`);
                return JSON.parse(rawData);
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error leyendo datos:', error);
            // Fallback a datos sin encriptar en caso de error
            const rawData = localStorage.getItem(key);
            return rawData ? JSON.parse(rawData) : [];
        }
    }

    validateDatabase() {
        try {
            const receipts = JSON.parse(localStorage.getItem(this.dbName) || '[]');
            const clients = JSON.parse(localStorage.getItem(this.clientsDbName) || '[]');
            const quotations = JSON.parse(localStorage.getItem(this.quotationsDbName) || '[]');
            
            // Validar que sean arrays
            if (!Array.isArray(receipts) || !Array.isArray(clients) || !Array.isArray(quotations)) {
                throw new Error('Formato de base de datos corrupto');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Base de datos corrupta, reiniciando...', error);
            localStorage.setItem(this.dbName, JSON.stringify([]));
            localStorage.setItem(this.clientsDbName, JSON.stringify([]));
            localStorage.setItem(this.quotationsDbName, JSON.stringify([]));
            return false;
        }
    }

    async saveReceipt(receiptData) {
        try {
            // Validar datos del recibo
            if (!this.validateReceiptData(receiptData)) {
                throw new Error('Datos del recibo inválidos');
            }

            const receipts = await this.getAllReceipts();
            
            // Agregar timestamp y ID único
            receiptData.id = this.generateUniqueId();
            receiptData.createdAt = new Date().toISOString();
            receiptData.updatedAt = new Date().toISOString();
            receiptData.status = receiptData.status || 'pending';
            
            // Agregar al inicio del array (más recientes primero)
            receipts.unshift(receiptData);
            
            // Guardar con encriptación AES-256
            await this.setItem(this.dbName, receipts);
            
            // Guardar cliente si es nuevo
            await this.saveClientIfNew(receiptData);
            
            // Trigger de backup inteligente
            await this.triggerIntelligentBackup('receipt_saved', {
                receiptId: receiptData.id,
                totalReceipts: receipts.length
            });
            
            console.log('✅ Recibo guardado:', receiptData.receiptNumber);
            return { success: true, data: receiptData };
            
        } catch (error) {
            console.error('❌ Error guardando recibo:', error);
            return { success: false, error: error.message };
        }
    }

    validateReceiptData(data) {
        // Campos obligatorios
        const requiredFields = ['receiptNumber', 'clientName', 'clientPhone', 'price'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                console.error(`Campo requerido faltante: ${field}`);
                return false;
            }
        }
        
        // Validar tipos de datos
        if (typeof data.price !== 'number' || data.price < 0) {
            console.error('Precio inválido');
            return false;
        }
        
        // Validar formato de teléfono (básico)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(data.clientPhone)) {
            console.error('Formato de teléfono inválido');
            return false;
        }
        
        return true;
    }

    async getAllReceipts() {
        try {
            return await this.getItem(this.dbName);
        } catch (error) {
            console.error('❌ Error obteniendo recibos:', error);
            return [];
        }
    }

    async getReceiptById(id) {
        try {
            const receipts = await this.getAllReceipts();
            return receipts.find(r => r.id === id) || null;
        } catch (error) {
            console.error('❌ Error buscando recibo:', error);
            return null;
        }
    }

    getReceiptByNumber(receiptNumber) {
        try {
            const receipts = this.getAllReceipts();
            return receipts.find(r => r.receiptNumber === receiptNumber) || null;
        } catch (error) {
            console.error('❌ Error buscando recibo:', error);
            return null;
        }
    }

    searchReceipts(query) {
        try {
            const receipts = this.getAllReceipts();
            const searchTerm = query.toLowerCase();
            
            return receipts.filter(receipt => {
                return (
                    receipt.receiptNumber.toLowerCase().includes(searchTerm) ||
                    receipt.clientName.toLowerCase().includes(searchTerm) ||
                    receipt.clientPhone.includes(searchTerm) ||
                    (receipt.clientEmail && receipt.clientEmail.toLowerCase().includes(searchTerm)) ||
                    (receipt.pieceType && receipt.pieceType.toLowerCase().includes(searchTerm))
                );
            });
        } catch (error) {
            console.error('❌ Error buscando recibos:', error);
            return [];
        }
    }

    async updateReceipt(id, updates) {
        try {
            const receipts = await this.getAllReceipts();
            const index = receipts.findIndex(r => r.id === id);
            
            if (index === -1) {
                throw new Error('Recibo no encontrado');
            }
            
            // Actualizar recibo
            receipts[index] = {
                ...receipts[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Guardar cambios con encriptación
            await this.setItem(this.dbName, receipts);
            
            console.log('✅ Recibo actualizado con seguridad:', id);
            return { success: true, data: receipts[index] };
            
        } catch (error) {
            console.error('❌ Error actualizando recibo:', error);
            return { success: false, error: error.message };
        }
    }

    deleteReceipt(id) {
        try {
            if (!confirm('¿Está seguro de eliminar este recibo? Esta acción no se puede deshacer.')) {
                return { success: false, error: 'Cancelado por usuario' };
            }
            
            const receipts = this.getAllReceipts();
            const filtered = receipts.filter(r => r.id !== id);
            
            if (filtered.length === receipts.length) {
                throw new Error('Recibo no encontrado');
            }
            
            localStorage.setItem(this.dbName, JSON.stringify(filtered));
            
            console.log('✅ Recibo eliminado:', id);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error eliminando recibo:', error);
            return { success: false, error: error.message };
        }
    }

    // Sistema de clientes
    saveClientIfNew(receiptData) {
        try {
            const clients = this.getAllClients();
            const existingClient = clients.find(c => 
                c.phone === receiptData.clientPhone || 
                c.name === receiptData.clientName
            );
            
            if (!existingClient) {
                const newClient = {
                    id: this.generateUniqueId(),
                    name: receiptData.clientName,
                    phone: receiptData.clientPhone,
                    email: receiptData.clientEmail || '',
                    createdAt: new Date().toISOString(),
                    lastPurchase: new Date().toISOString(),
                    totalPurchases: 1,
                    totalSpent: receiptData.price
                };
                
                clients.push(newClient);
                localStorage.setItem(this.clientsDbName, JSON.stringify(clients));
                console.log('✅ Nuevo cliente guardado:', newClient.name);
            } else {
                // Actualizar estadísticas del cliente
                existingClient.lastPurchase = new Date().toISOString();
                existingClient.totalPurchases += 1;
                existingClient.totalSpent += receiptData.price;
                
                const index = clients.findIndex(c => c.id === existingClient.id);
                clients[index] = existingClient;
                localStorage.setItem(this.clientsDbName, JSON.stringify(clients));
            }
        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
        }
    }

    getAllClients() {
        try {
            return JSON.parse(localStorage.getItem(this.clientsDbName) || '[]');
        } catch (error) {
            console.error('❌ Error obteniendo clientes:', error);
            return [];
        }
    }

    searchClients(query) {
        try {
            const clients = this.getAllClients();
            const searchTerm = query.toLowerCase();
            
            return clients.filter(client => {
                return (
                    client.name.toLowerCase().includes(searchTerm) ||
                    client.phone.includes(searchTerm) ||
                    (client.email && client.email.toLowerCase().includes(searchTerm))
                );
            });
        } catch (error) {
            console.error('❌ Error buscando clientes:', error);
            return [];
        }
    }

    getClientHistory(clientPhone) {
        try {
            const receipts = this.getAllReceipts();
            return receipts.filter(r => r.clientPhone === clientPhone);
        } catch (error) {
            console.error('❌ Error obteniendo historial del cliente:', error);
            return [];
        }
    }

    // Estadísticas
    getStatistics(period = 'month') {
        try {
            const receipts = this.getAllReceipts();
            const now = new Date();
            let startDate;
            
            switch(period) {
                case 'day':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = new Date(0); // Todos los tiempos
            }
            
            const filteredReceipts = receipts.filter(r => 
                new Date(r.createdAt) >= startDate
            );
            
            const stats = {
                totalReceipts: filteredReceipts.length,
                totalRevenue: filteredReceipts.reduce((sum, r) => sum + (r.price || 0), 0),
                totalDeposits: filteredReceipts.reduce((sum, r) => sum + (r.deposit || 0), 0),
                totalPending: filteredReceipts.reduce((sum, r) => sum + (r.balance || 0), 0),
                byType: {},
                byStatus: {},
                topClients: []
            };
            
            // Estadísticas por tipo
            filteredReceipts.forEach(r => {
                if (r.transactionType) {
                    stats.byType[r.transactionType] = (stats.byType[r.transactionType] || 0) + 1;
                }
                if (r.status) {
                    stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
                }
            });
            
            // Top clientes
            const clientMap = {};
            filteredReceipts.forEach(r => {
                if (!clientMap[r.clientPhone]) {
                    clientMap[r.clientPhone] = {
                        name: r.clientName,
                        phone: r.clientPhone,
                        count: 0,
                        total: 0
                    };
                }
                clientMap[r.clientPhone].count++;
                clientMap[r.clientPhone].total += r.price || 0;
            });
            
            stats.topClients = Object.values(clientMap)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);
            
            return stats;
        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error);
            return null;
        }
    }

    // Utilidades
    generateUniqueId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    cleanOldReceipts() {
        try {
            const receipts = this.getAllReceipts();
            if (receipts.length > this.maxReceipts) {
                const cleaned = receipts.slice(0, this.maxReceipts);
                localStorage.setItem(this.dbName, JSON.stringify(cleaned));
                console.log(`✅ Limpieza: ${receipts.length - this.maxReceipts} recibos antiguos eliminados`);
            }
        } catch (error) {
            console.error('❌ Error limpiando recibos antiguos:', error);
        }
    }

    /**
     * Sistema de backup inteligente enterprise
     */
    async triggerIntelligentBackup(trigger, metadata = {}) {
        if (!this.autoBackupEnabled) {
            return;
        }
        
        try {
            this.backupTriggerCount++;
            this.lastSignificantChange = Date.now();
            
            // Usar BackupManager enterprise si está disponible
            if (this.backupManager && this.backupManager.isInitialized) {
                // Backup incremental inteligente
                const shouldBackup = this.shouldTriggerBackup(trigger, metadata);
                
                if (shouldBackup.incremental) {
                    console.log(`🔄 Triggering incremental backup: ${trigger}`);
                    await this.backupManager.performIncrementalBackup(`database_${trigger}`);
                    this.lastBackupTrigger = { type: 'incremental', trigger, timestamp: Date.now() };
                }
                
                if (shouldBackup.full) {
                    console.log(`🔄 Triggering full backup: ${trigger}`);
                    await this.backupManager.performFullBackup(`database_${trigger}`);
                    this.lastBackupTrigger = { type: 'full', trigger, timestamp: Date.now() };
                }
                
            } else {
                // Fallback al sistema legacy
                if (this.backupTriggerCount % this.backupInterval === 0) {
                    this.createLegacyBackup();
                }
            }
            
        } catch (error) {
            console.error('❌ Error en backup inteligente:', error);
        }
    }
    
    /**
     * Determina si debe disparar backup basado en heurísticas
     */
    shouldTriggerBackup(trigger, metadata) {
        const result = { incremental: false, full: false };
        const now = Date.now();
        
        try {
            // Reglas para backup incremental
            if (trigger === 'receipt_saved' || trigger === 'client_saved' || trigger === 'quotation_saved') {
                // Backup incremental cada 5 cambios significativos
                if (this.backupTriggerCount % 5 === 0) {
                    result.incremental = true;
                }
            }
            
            if (trigger === 'bulk_operation' || trigger === 'data_migration') {
                result.incremental = true;
            }
            
            // Reglas para backup completo
            if (trigger === 'daily_maintenance' || trigger === 'system_shutdown') {
                result.full = true;
            }
            
            // Backup completo si ha pasado mucho tiempo
            const lastFullBackup = this.lastBackupTrigger?.type === 'full' ? 
                this.lastBackupTrigger.timestamp : 0;
            const timeSinceLastFull = now - lastFullBackup;
            
            if (timeSinceLastFull > (24 * 60 * 60 * 1000)) { // 24 horas
                result.full = true;
            }
            
            // Backup completo si hay muchos cambios acumulados
            if (this.backupTriggerCount > 50) {
                result.full = true;
                this.backupTriggerCount = 0; // Reset counter
            }
            
        } catch (error) {
            console.error('Error evaluando reglas de backup:', error);
        }
        
        return result;
    }
    
    // Backup legacy (mantener compatibilidad)
    createLegacyBackup() {
        try {
            const backup = {
                version: '1.0',
                date: new Date().toISOString(),
                receipts: this.getAllReceipts(),
                clients: this.getAllClients()
            };
            
            const backupString = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_legacy_ciaociao_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            console.log('✅ Backup legacy creado exitosamente');
            
        } catch (error) {
            console.error('❌ Error creando backup legacy:', error);
        }
    }
    
    /**
     * Backup manual enterprise
     */
    async createBackup(type = 'full') {
        if (this.backupManager && this.backupManager.isInitialized) {
            try {
                if (type === 'incremental') {
                    return await this.backupManager.performIncrementalBackup('manual_database');
                } else {
                    return await this.backupManager.performFullBackup('manual_database');
                }
            } catch (error) {
                console.error('Error en backup enterprise, usando legacy:', error);
                this.createLegacyBackup();
            }
        } else {
            this.createLegacyBackup();
        }
    }

    /**
     * Sistema de restauración enterprise
     */
    async restoreFromBackup(file) {
        return new Promise(async (resolve, reject) => {
            try {
                // Intentar restauración enterprise primero
                if (this.backupManager && this.backupManager.isInitialized) {
                    try {
                        const backupId = await this.backupManager.importBackup(file);
                        const result = await this.backupManager.restoreFromBackup(backupId, {
                            skipSafetyBackup: false,
                            reloadAfterRestore: true
                        });
                        
                        console.log('✅ Restauración enterprise exitosa:', result);
                        resolve({
                            success: true,
                            message: 'Backup restaurado exitosamente con BackupManager enterprise',
                            details: result
                        });
                        return;
                        
                    } catch (enterpriseError) {
                        console.warn('⚠️ Restauración enterprise falló, usando método legacy:', enterpriseError);
                        // Continuar con método legacy
                    }
                }
                
                // Método legacy como fallback
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        
                        // Validar estructura del backup
                        if (!backup.version || !backup.receipts || !backup.clients) {
                            throw new Error('Formato de backup inválido');
                        }
                        
                        // Confirmar restauración
                        if (!confirm('¿Está seguro de restaurar desde este backup? Esto reemplazará todos los datos actuales.')) {
                            reject('Restauración cancelada por el usuario');
                            return;
                        }
                        
                        // Crear backup de seguridad antes de restaurar
                        if (this.backupManager) {
                            try {
                                await this.backupManager.performFullBackup('safety_before_legacy_restore');
                                console.log('💾 Backup de seguridad creado antes de restauración legacy');
                            } catch (safetyError) {
                                console.warn('⚠️ No se pudo crear backup de seguridad:', safetyError);
                            }
                        }
                        
                        // Restaurar datos usando métodos encriptados si están disponibles
                        if (this.encryptionEnabled && this.setItem) {
                            await this.setItem(this.dbName, backup.receipts);
                            await this.setItem(this.clientsDbName, backup.clients);
                            if (backup.quotations) {
                                await this.setItem(this.quotationsDbName, backup.quotations);
                            }
                        } else {
                            // Fallback sin encriptación
                            localStorage.setItem(this.dbName, JSON.stringify(backup.receipts));
                            localStorage.setItem(this.clientsDbName, JSON.stringify(backup.clients));
                            if (backup.quotations) {
                                localStorage.setItem(this.quotationsDbName, JSON.stringify(backup.quotations));
                            }
                        }
                        
                        console.log('✅ Backup legacy restaurado exitosamente');
                        resolve({ 
                            success: true, 
                            message: 'Backup restaurado exitosamente (método legacy)',
                            method: 'legacy'
                        });
                        
                        // Recargar página para aplicar cambios
                        setTimeout(() => location.reload(), 1000);
                        
                    } catch (error) {
                        console.error('❌ Error procesando backup:', error);
                        reject(error.message);
                    }
                };
                
                reader.onerror = () => {
                    reject('Error leyendo archivo');
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                reject(error.message);
            }
        });
    }
    
    /**
     * Obtiene lista de backups disponibles (enterprise)
     */
    getAvailableBackups() {
        if (this.backupManager && this.backupManager.isInitialized) {
            return this.backupManager.getAvailableBackups();
        }
        return [];
    }
    
    /**
     * Restaura desde backup específico por ID (enterprise)
     */
    async restoreFromBackupId(backupId, options = {}) {
        if (!this.backupManager || !this.backupManager.isInitialized) {
            throw new Error('BackupManager no disponible');
        }
        
        return await this.backupManager.restoreFromBackup(backupId, options);
    }
    
    /**
     * Obtiene estado del sistema de backup
     */
    getBackupStatus() {
        if (this.backupManager && this.backupManager.isInitialized) {
            return this.backupManager.getSystemStatus();
        }
        
        return {
            available: false,
            method: 'legacy',
            lastBackup: this.lastBackupTrigger,
            autoBackupEnabled: this.autoBackupEnabled
        };
    }

    exportToExcel() {
        try {
            const receipts = this.getAllReceipts();
            
            // Crear CSV
            const headers = [
                'Número de Recibo',
                'Fecha',
                'Cliente',
                'Teléfono',
                'Email',
                'Tipo de Transacción',
                'Tipo de Pieza',
                'Material',
                'Precio Total',
                'Anticipo',
                'Saldo',
                'Estado'
            ];
            
            const rows = receipts.map(r => [
                r.receiptNumber,
                new Date(r.receiptDate).toLocaleDateString('es-MX'),
                r.clientName,
                r.clientPhone,
                r.clientEmail || '',
                r.transactionType || '',
                r.pieceType || '',
                r.material || '',
                r.price || 0,
                r.deposit || 0,
                r.balance || 0,
                r.status || 'pending'
            ]);
            
            // Convertir a CSV
            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            });
            
            // Descargar archivo
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `recibos_ciaociao_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            URL.revokeObjectURL(url);
            console.log('✅ Archivo Excel exportado');
            
        } catch (error) {
            console.error('❌ Error exportando a Excel:', error);
        }
    }

    handleDatabaseError(error) {
        // Manejo centralizado de errores
        const errorMessage = `
            ⚠️ Error en la base de datos: ${error.message}
            
            Posibles soluciones:
            1. Limpiar caché del navegador
            2. Verificar espacio de almacenamiento
            3. Contactar soporte técnico
        `;
        
        console.error(errorMessage);
        
        // Intentar recuperación automática
        if (error.message.includes('corrupto')) {
            this.validateDatabase();
        }
    }

    // ===================================
    // MÉTODOS PARA COTIZACIONES
    // ===================================
    
    saveQuotation(quotationData) {
        try {
            // Validar datos de la cotización
            if (!this.validateQuotationData(quotationData)) {
                throw new Error('Datos de la cotización inválidos');
            }

            const quotations = this.getAllQuotations();
            
            // Agregar timestamp y ID único
            quotationData.id = this.generateUniqueId();
            quotationData.createdAt = new Date().toISOString();
            quotationData.updatedAt = new Date().toISOString();
            quotationData.status = quotationData.status || 'pending';
            
            // Verificar si ya existe para actualizar
            const existingIndex = quotations.findIndex(q => q.quotationNumber === quotationData.quotationNumber);
            
            if (existingIndex >= 0) {
                quotations[existingIndex] = quotationData;
            } else {
                // Agregar al inicio del array (más recientes primero)
                quotations.unshift(quotationData);
            }
            
            // Guardar en localStorage
            localStorage.setItem(this.quotationsDbName, JSON.stringify(quotations));
            
            // Guardar cliente si es nuevo
            this.saveClientIfNew({
                clientName: quotationData.clientName,
                clientPhone: quotationData.clientPhone,
                clientEmail: quotationData.clientEmail
            });
            
            // Limpiar cotizaciones antiguas si excede el límite
            this.cleanOldQuotations();
            
            console.log('✅ Cotización guardada:', quotationData.quotationNumber);
            return { success: true, data: quotationData };
            
        } catch (error) {
            console.error('❌ Error guardando cotización:', error);
            return { success: false, error: error.message };
        }
    }
    
    validateQuotationData(data) {
        // Campos obligatorios para cotizaciones
        const requiredFields = ['quotationNumber', 'clientName', 'clientPhone', 'products'];
        
        for (let field of requiredFields) {
            if (!data[field] || data[field] === '') {
                console.error(`❌ Campo requerido faltante: ${field}`);
                return false;
            }
        }
        
        // Validar que tenga productos
        if (!Array.isArray(data.products) || data.products.length === 0) {
            console.error('❌ La cotización debe tener al menos un producto');
            return false;
        }
        
        return true;
    }
    
    getAllQuotations() {
        try {
            return JSON.parse(localStorage.getItem(this.quotationsDbName) || '[]');
        } catch (error) {
            console.error('❌ Error obteniendo cotizaciones:', error);
            return [];
        }
    }
    
    getQuotation(quotationNumber) {
        try {
            const quotations = this.getAllQuotations();
            return quotations.find(q => q.quotationNumber === quotationNumber) || null;
        } catch (error) {
            console.error('❌ Error obteniendo cotización:', error);
            return null;
        }
    }
    
    updateQuotationStatus(quotationNumber, status) {
        try {
            const quotations = this.getAllQuotations();
            const quotationIndex = quotations.findIndex(q => q.quotationNumber === quotationNumber);
            
            if (quotationIndex >= 0) {
                quotations[quotationIndex].status = status;
                quotations[quotationIndex].updatedAt = new Date().toISOString();
                
                localStorage.setItem(this.quotationsDbName, JSON.stringify(quotations));
                
                console.log(`✅ Estado de cotización actualizado: ${quotationNumber} -> ${status}`);
                return { success: true };
            } else {
                throw new Error('Cotización no encontrada');
            }
        } catch (error) {
            console.error('❌ Error actualizando estado de cotización:', error);
            return { success: false, error: error.message };
        }
    }
    
    searchQuotations(searchTerm) {
        try {
            const quotations = this.getAllQuotations();
            const term = searchTerm.toLowerCase();
            
            return quotations.filter(quotation => 
                quotation.clientName.toLowerCase().includes(term) ||
                quotation.clientPhone.includes(term) ||
                quotation.quotationNumber.toLowerCase().includes(term) ||
                (quotation.products && quotation.products.some(p => 
                    p.description.toLowerCase().includes(term) ||
                    p.type.toLowerCase().includes(term) ||
                    p.material.toLowerCase().includes(term)
                ))
            );
        } catch (error) {
            console.error('❌ Error buscando cotizaciones:', error);
            return [];
        }
    }
    
    cleanOldQuotations() {
        try {
            const quotations = this.getAllQuotations();
            
            if (quotations.length > this.maxQuotations) {
                // Mantener solo las más recientes
                const cleanedQuotations = quotations.slice(0, this.maxQuotations);
                localStorage.setItem(this.quotationsDbName, JSON.stringify(cleanedQuotations));
                
                console.log(`✅ Limpieza automática: eliminadas ${quotations.length - this.maxQuotations} cotizaciones antiguas`);
            }
        } catch (error) {
            console.error('❌ Error limpiando cotizaciones antiguas:', error);
        }
    }
    
    exportQuotationsToExcel() {
        try {
            const quotations = this.getAllQuotations();
            
            if (quotations.length === 0) {
                alert('No hay cotizaciones para exportar');
                return;
            }
            
            // Headers para CSV
            const headers = [
                'Número de Cotización',
                'Fecha',
                'Cliente',
                'Teléfono',
                'Email',
                'Productos',
                'Subtotal',
                'Descuento',
                'Total',
                'Estado',
                'Validez',
                'Fecha de Creación'
            ];
            
            // Preparar datos
            const rows = quotations.map(q => [
                q.quotationNumber,
                q.quotationDate,
                q.clientName,
                q.clientPhone,
                q.clientEmail || '',
                q.products ? q.products.length + ' productos' : '0 productos',
                q.subtotal || 0,
                q.discountAmount || 0,
                q.total || 0,
                q.status || 'pending',
                q.validity + ' días',
                new Date(q.createdAt).toLocaleDateString('es-MX')
            ]);
            
            // Convertir a CSV
            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
            });
            
            // Descargar archivo
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cotizaciones_ciaociao_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            URL.revokeObjectURL(url);
            console.log('✅ Archivo de cotizaciones exportado');
            
        } catch (error) {
            console.error('❌ Error exportando cotizaciones a Excel:', error);
        }
    }
    
    getQuotationStats() {
        try {
            const quotations = this.getAllQuotations();
            const today = new Date().toISOString().split('T')[0];
            
            const stats = {
                total: quotations.length,
                pending: quotations.filter(q => q.status === 'pending').length,
                accepted: quotations.filter(q => q.status === 'accepted').length,
                rejected: quotations.filter(q => q.status === 'rejected').length,
                expired: quotations.filter(q => q.status === 'expired').length,
                today: quotations.filter(q => q.quotationDate === today).length,
                totalValue: quotations.reduce((sum, q) => sum + (q.total || 0), 0),
                averageValue: quotations.length > 0 ? quotations.reduce((sum, q) => sum + (q.total || 0), 0) / quotations.length : 0,
                conversionRate: quotations.length > 0 ? (quotations.filter(q => q.status === 'accepted').length / quotations.length * 100).toFixed(2) : 0
            };
            
            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de cotizaciones:', error);
            return null;
        }
    }

    // Método para obtener espacio usado (actualizado para incluir cotizaciones)
    getStorageInfo() {
        try {
            const receiptsSize = new Blob([localStorage.getItem(this.dbName) || '']).size;
            const clientsSize = new Blob([localStorage.getItem(this.clientsDbName) || '']).size;
            const quotationsSize = new Blob([localStorage.getItem(this.quotationsDbName) || '']).size;
            const totalSize = receiptsSize + clientsSize + quotationsSize;
            
            return {
                receipts: (receiptsSize / 1024).toFixed(2) + ' KB',
                clients: (clientsSize / 1024).toFixed(2) + ' KB',
                quotations: (quotationsSize / 1024).toFixed(2) + ' KB',
                total: (totalSize / 1024).toFixed(2) + ' KB',
                percentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) + '%' // 5MB límite típico
            };
        } catch (error) {
            console.error('❌ Error obteniendo información de almacenamiento:', error);
            return null;
        }
    }
}

// Clase específica para cotizaciones (hereda de ReceiptDatabase)
class QuotationDatabase extends ReceiptDatabase {
    constructor() {
        super();
        this.quotationsStorageKey = 'quotations_ciaociao';
    }
    
    saveQuotation(quotationData) {
        return super.saveQuotation(quotationData);
    }
    
    getAllQuotations() {
        return super.getAllQuotations();
    }
    
    getQuotation(quotationNumber) {
        return super.getQuotation(quotationNumber);
    }
    
    searchQuotations(searchTerm) {
        return super.searchQuotations(searchTerm);
    }
    
    updateQuotationStatus(quotationNumber, status) {
        return super.updateQuotationStatus(quotationNumber, status);
    }
    
    exportToExcel() {
        return super.exportQuotationsToExcel();
    }
    
    getStats() {
        return super.getQuotationStats();
    }
    
    // Método específico para verificar cotizaciones vencidas
    checkExpiredQuotations() {
        try {
            const quotations = this.getAllQuotations();
            const today = new Date();
            let updatedCount = 0;
            
            quotations.forEach((quotation, index) => {
                if (quotation.status === 'pending') {
                    const quotationDate = new Date(quotation.quotationDate);
                    const validUntil = new Date(quotationDate);
                    validUntil.setDate(validUntil.getDate() + parseInt(quotation.validity || 30));
                    
                    if (today > validUntil) {
                        quotations[index].status = 'expired';
                        quotations[index].updatedAt = new Date().toISOString();
                        updatedCount++;
                    }
                }
            });
            
            if (updatedCount > 0) {
                localStorage.setItem(this.quotationsDbName, JSON.stringify(quotations));
                console.log(`✅ ${updatedCount} cotizaciones marcadas como vencidas`);
            }
            
            return updatedCount;
        } catch (error) {
            console.error('❌ Error verificando cotizaciones vencidas:', error);
            return 0;
        }
    }
    
    // Método para obtener cotizaciones por estado
    getQuotationsByStatus(status) {
        try {
            const quotations = this.getAllQuotations();
            return quotations.filter(q => q.status === status);
        } catch (error) {
            console.error('❌ Error filtrando cotizaciones por estado:', error);
            return [];
        }
    }
    
    // Método para obtener resumen de cotizaciones del mes
    getMonthlySummary(year, month) {
        try {
            const quotations = this.getAllQuotations();
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            
            const monthlyQuotations = quotations.filter(q => 
                q.quotationDate && q.quotationDate.startsWith(monthStr)
            );
            
            return {
                count: monthlyQuotations.length,
                totalValue: monthlyQuotations.reduce((sum, q) => sum + (q.total || 0), 0),
                pending: monthlyQuotations.filter(q => q.status === 'pending').length,
                accepted: monthlyQuotations.filter(q => q.status === 'accepted').length,
                rejected: monthlyQuotations.filter(q => q.status === 'rejected').length,
                expired: monthlyQuotations.filter(q => q.status === 'expired').length
            };
        } catch (error) {
            console.error('❌ Error obteniendo resumen mensual:', error);
            return null;
        }
    }
}

// Exportar para uso global
window.ReceiptDatabase = ReceiptDatabase;
window.QuotationDatabase = QuotationDatabase;