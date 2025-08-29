// data-integrity-guardian.js - Sistema de protección integral de datos
// Detecta y repara corrupción de datos en localStorage

class DataIntegrityGuardian {
    constructor() {
        this.corruptionPatterns = [
            /undefined/gi,
            /\[object Object\]/gi,
            /NaN/gi,
            /null,null/gi,
            /"":"/gi,
            /,,,/gi
        ];
        
        this.criticalKeys = [
            'receipts_ciaociao',
            'quotations_ciaociao', 
            'clients_ciaociao',
            'payments_ciaociao',
            'session_ciaociao'
        ];
        
        this.backupRetentionDays = 7;
        this.maxBackupsPerKey = 5;
        
        console.log('🛡️ Data Integrity Guardian inicializado');
        this.initializeGuardian();
    }
    
    // Inicializar sistema de protección
    initializeGuardian() {
        // Verificación inicial de integridad
        this.performIntegrityCheck();
        
        // Interceptar operaciones de localStorage
        this.interceptStorageOperations();
        
        // Crear respaldos automáticos
        this.scheduleAutoBackups();
        
        // Configurar validación periódica
        this.schedulePeriodicValidation();
        
        console.log('✅ Sistema de integridad de datos activo');
    }
    
    // Verificar integridad de datos
    performIntegrityCheck() {
        console.log('🔍 Verificando integridad de datos...');
        
        const results = {
            total: 0,
            valid: 0,
            corrupted: 0,
            repaired: 0,
            failed: 0,
            details: []
        };
        
        for (const key of this.criticalKeys) {
            const result = this.validateKey(key);
            results.details.push(result);
            results.total++;
            
            if (result.isValid) {
                results.valid++;
            } else if (result.isCorrupted) {
                results.corrupted++;
                
                // Intentar reparación
                const repairResult = this.attemptRepair(key, result);
                if (repairResult.success) {
                    results.repaired++;
                    console.log(`✅ Datos reparados para: ${key}`);
                } else {
                    results.failed++;
                    console.error(`❌ No se pudo reparar: ${key}`, repairResult.error);
                }
            }
        }
        
        // Generar reporte
        console.log('📊 Reporte de integridad de datos:', results);
        
        // Alertar si hay problemas críticos
        if (results.corrupted > 0 || results.failed > 0) {
            this.handleIntegrityIssues(results);
        }
        
        return results;
    }
    
    // Validar una clave específica
    validateKey(key) {
        const result = {
            key,
            exists: false,
            isValid: false,
            isCorrupted: false,
            size: 0,
            errors: [],
            data: null
        };
        
        try {
            const rawData = localStorage.getItem(key);
            
            if (!rawData) {
                result.exists = false;
                return result;
            }
            
            result.exists = true;
            result.size = new Blob([rawData]).size;
            
            // Verificar patrones de corrupción
            for (const pattern of this.corruptionPatterns) {
                if (pattern.test(rawData)) {
                    result.isCorrupted = true;
                    result.errors.push(`Patrón de corrupción detectado: ${pattern}`);
                }
            }
            
            // Verificar JSON válido
            try {
                const parsedData = JSON.parse(rawData);
                result.data = parsedData;
                
                // Validaciones específicas por tipo de datos
                const typeValidation = this.validateDataType(key, parsedData);
                if (!typeValidation.isValid) {
                    result.isCorrupted = true;
                    result.errors.push(...typeValidation.errors);
                }
                
                if (!result.isCorrupted) {
                    result.isValid = true;
                }
                
            } catch (jsonError) {
                result.isCorrupted = true;
                result.errors.push(`JSON inválido: ${jsonError.message}`);
            }
            
        } catch (error) {
            result.isCorrupted = true;
            result.errors.push(`Error de acceso: ${error.message}`);
        }
        
        return result;
    }
    
    // Validar estructura de datos específica
    validateDataType(key, data) {
        const result = { isValid: true, errors: [] };
        
        try {
            if (key.includes('receipts')) {
                if (!Array.isArray(data)) {
                    result.isValid = false;
                    result.errors.push('Recibos debe ser un array');
                } else {
                    // Validar estructura de recibos
                    data.forEach((receipt, index) => {
                        if (!receipt.id || !receipt.receiptNumber || !receipt.clientName) {
                            result.errors.push(`Recibo ${index} falta campos obligatorios`);
                        }
                        if (receipt.price && isNaN(parseFloat(receipt.price))) {
                            result.errors.push(`Recibo ${index} precio inválido`);
                        }
                    });
                }
            }
            
            else if (key.includes('quotations')) {
                if (!Array.isArray(data)) {
                    result.isValid = false;
                    result.errors.push('Cotizaciones debe ser un array');
                } else {
                    data.forEach((quotation, index) => {
                        if (!quotation.id || !quotation.quotationNumber) {
                            result.errors.push(`Cotización ${index} falta campos obligatorios`);
                        }
                    });
                }
            }
            
            else if (key.includes('clients')) {
                if (!Array.isArray(data)) {
                    result.isValid = false;
                    result.errors.push('Clientes debe ser un array');
                } else {
                    data.forEach((client, index) => {
                        if (!client.name && !client.phone) {
                            result.errors.push(`Cliente ${index} falta información básica`);
                        }
                    });
                }
            }
            
            else if (key.includes('session')) {
                if (!data.timestamp || !data.isAuthenticated) {
                    result.errors.push('Sesión falta campos obligatorios');
                }
            }
            
            if (result.errors.length > 0) {
                result.isValid = false;
            }
            
        } catch (error) {
            result.isValid = false;
            result.errors.push(`Error de validación: ${error.message}`);
        }
        
        return result;
    }
    
    // Intentar reparar datos corruptos
    attemptRepair(key, validationResult) {
        console.log(`🔧 Intentando reparar: ${key}`);
        
        try {
            // Crear respaldo antes de la reparación
            this.createBackup(key, 'pre-repair');
            
            let repairSuccess = false;
            let repairedData = null;
            
            // Estrategia 1: Intentar reparar JSON malformado
            if (validationResult.errors.some(e => e.includes('JSON inválido'))) {
                repairedData = this.repairMalformedJSON(key);
                if (repairedData) {
                    repairSuccess = true;
                    console.log(`✅ JSON reparado para ${key}`);
                }
            }
            
            // Estrategia 2: Limpiar patrones de corrupción
            if (!repairSuccess) {
                repairedData = this.cleanCorruptionPatterns(key);
                if (repairedData) {
                    repairSuccess = true;
                    console.log(`✅ Patrones de corrupción limpiados para ${key}`);
                }
            }
            
            // Estrategia 3: Restaurar desde respaldo reciente
            if (!repairSuccess) {
                repairedData = this.restoreFromBackup(key);
                if (repairedData) {
                    repairSuccess = true;
                    console.log(`✅ Datos restaurados desde respaldo para ${key}`);
                }
            }
            
            // Estrategia 4: Inicializar con estructura vacía válida
            if (!repairSuccess) {
                repairedData = this.initializeEmptyStructure(key);
                repairSuccess = true;
                console.warn(`⚠️ Inicializado con estructura vacía para ${key}`);
            }
            
            // Aplicar la reparación
            if (repairedData) {
                localStorage.setItem(key, JSON.stringify(repairedData));
                
                // Verificar que la reparación funcionó
                const verificationResult = this.validateKey(key);
                if (!verificationResult.isValid) {
                    throw new Error('La reparación no produjo datos válidos');
                }
            }
            
            return { success: repairSuccess, data: repairedData };
            
        } catch (error) {
            console.error(`❌ Error reparando ${key}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    // Reparar JSON malformado
    repairMalformedJSON(key) {
        try {
            const rawData = localStorage.getItem(key);
            if (!rawData) return null;
            
            // Intentar reparaciones comunes de JSON
            let cleaned = rawData
                .replace(/,\s*}/g, '}')  // Comas finales en objetos
                .replace(/,\s*]/g, ']')  // Comas finales en arrays
                .replace(/'/g, '"')       // Comillas simples a dobles
                .replace(/(\w+):/g, '"$1":') // Agregar comillas a claves
                .replace(/undefined/g, 'null') // undefined a null
                .replace(/NaN/g, 'null');      // NaN a null
            
            return JSON.parse(cleaned);
            
        } catch (error) {
            console.warn(`⚠️ No se pudo reparar JSON para ${key}:`, error);
            return null;
        }
    }
    
    // Limpiar patrones de corrupción conocidos
    cleanCorruptionPatterns(key) {
        try {
            const rawData = localStorage.getItem(key);
            if (!rawData) return null;
            
            let cleaned = rawData;
            
            // Aplicar limpieza de patrones
            for (const pattern of this.corruptionPatterns) {
                cleaned = cleaned.replace(pattern, '');
            }
            
            // Intentar parsear el resultado limpio
            return JSON.parse(cleaned);
            
        } catch (error) {
            console.warn(`⚠️ Limpieza de patrones falló para ${key}:`, error);
            return null;
        }
    }
    
    // Restaurar desde respaldo
    restoreFromBackup(key) {
        try {
            console.log(`🔄 Buscando respaldos para ${key}...`);
            
            // Buscar respaldos disponibles
            const backups = [];
            for (let storageKey in localStorage) {
                if (storageKey.startsWith(`backup_${key}_`)) {
                    const backupData = localStorage.getItem(storageKey);
                    if (backupData) {
                        try {
                            const parsed = JSON.parse(backupData);
                            backups.push({
                                key: storageKey,
                                timestamp: parsed.timestamp,
                                data: parsed.data
                            });
                        } catch (e) {
                            // Respaldo también corrupto, ignorar
                        }
                    }
                }
            }
            
            if (backups.length === 0) {
                console.warn(`⚠️ No hay respaldos disponibles para ${key}`);
                return null;
            }
            
            // Usar el respaldo más reciente
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const latestBackup = backups[0];
            
            console.log(`✅ Restaurando desde respaldo: ${latestBackup.key}`);
            return latestBackup.data;
            
        } catch (error) {
            console.error(`❌ Error restaurando respaldo para ${key}:`, error);
            return null;
        }
    }
    
    // Inicializar estructura vacía válida
    initializeEmptyStructure(key) {
        const emptyStructures = {
            'receipts_ciaociao': [],
            'quotations_ciaociao': [],
            'clients_ciaociao': [],
            'payments_ciaociao': [],
            'session_ciaociao': {
                isAuthenticated: false,
                timestamp: Date.now(),
                duration: 8 * 60 * 60 * 1000
            }
        };
        
        return emptyStructures[key] || {};
    }
    
    // Crear respaldo automático
    createBackup(key, suffix = '') {
        try {
            const data = localStorage.getItem(key);
            if (!data) return;
            
            const backupKey = `backup_${key}_${Date.now()}${suffix ? '_' + suffix : ''}`;
            const backupData = {
                originalKey: key,
                timestamp: new Date().toISOString(),
                data: JSON.parse(data)
            };
            
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Limpiar respaldos antiguos
            this.cleanOldBackups(key);
            
            console.log(`💾 Respaldo creado: ${backupKey}`);
            
        } catch (error) {
            console.error(`❌ Error creando respaldo para ${key}:`, error);
        }
    }
    
    // Limpiar respaldos antiguos
    cleanOldBackups(key) {
        try {
            const backups = [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.backupRetentionDays);
            
            for (let storageKey in localStorage) {
                if (storageKey.startsWith(`backup_${key}_`)) {
                    const backupData = localStorage.getItem(storageKey);
                    if (backupData) {
                        try {
                            const parsed = JSON.parse(backupData);
                            const backupDate = new Date(parsed.timestamp);
                            
                            if (backupDate < cutoffDate) {
                                localStorage.removeItem(storageKey);
                                console.log(`🗑️ Respaldo antiguo eliminado: ${storageKey}`);
                            } else {
                                backups.push({ key: storageKey, date: backupDate });
                            }
                        } catch (e) {
                            // Respaldo corrupto, eliminarlo
                            localStorage.removeItem(storageKey);
                        }
                    }
                }
            }
            
            // Si hay demasiados respaldos, eliminar los más antiguos
            if (backups.length > this.maxBackupsPerKey) {
                backups.sort((a, b) => a.date - b.date);
                const toDelete = backups.slice(0, backups.length - this.maxBackupsPerKey);
                
                toDelete.forEach(backup => {
                    localStorage.removeItem(backup.key);
                    console.log(`🗑️ Exceso de respaldos eliminado: ${backup.key}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error limpiando respaldos antiguos:', error);
        }
    }
    
    // Manejar problemas de integridad
    handleIntegrityIssues(results) {
        const criticalIssues = results.failed;
        const repairedIssues = results.repaired;
        
        let message = '🔍 REPORTE DE INTEGRIDAD DE DATOS\n\n';
        
        if (repairedIssues > 0) {
            message += `✅ ${repairedIssues} problemas reparados automáticamente\n`;
        }
        
        if (criticalIssues > 0) {
            message += `🚨 ${criticalIssues} problemas críticos no reparados\n\n`;
            message += 'Se recomienda:\n';
            message += '• Exportar datos inmediatamente\n';
            message += '• Reiniciar la aplicación\n';
            message += '• Contactar soporte si persiste\n\n';
            message += '¿Exportar datos de respaldo ahora?';
            
            if (confirm(message)) {
                this.exportIntegrityReport(results);
            }
        } else if (repairedIssues > 0) {
            // Solo mostrar notificación para reparaciones exitosas
            if (window.utils && utils.showNotification) {
                utils.showNotification(`Datos reparados: ${repairedIssues} problemas resueltos`, 'success');
            }
        }
    }
    
    // Exportar reporte de integridad
    exportIntegrityReport(results) {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                system: 'Data Integrity Guardian',
                results: results,
                backups: this.getAllBackups()
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data-integrity-report-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Reporte de integridad exportado');
            
        } catch (error) {
            console.error('❌ Error exportando reporte:', error);
        }
    }
    
    // Obtener todos los respaldos disponibles
    getAllBackups() {
        const backups = {};
        
        for (let key in localStorage) {
            if (key.startsWith('backup_')) {
                try {
                    const data = localStorage.getItem(key);
                    const parsed = JSON.parse(data);
                    const originalKey = parsed.originalKey;
                    
                    if (!backups[originalKey]) {
                        backups[originalKey] = [];
                    }
                    
                    backups[originalKey].push({
                        backupKey: key,
                        timestamp: parsed.timestamp,
                        size: new Blob([data]).size
                    });
                } catch (e) {
                    // Ignorar respaldos corruptos
                }
            }
        }
        
        return backups;
    }
    
    // Interceptar operaciones de localStorage
    interceptStorageOperations() {
        const originalSetItem = Storage.prototype.setItem;
        const guardian = this;
        
        Storage.prototype.setItem = function(key, value) {
            // Solo crear respaldos para claves críticas
            if (guardian.criticalKeys.includes(key)) {
                // Crear respaldo antes de sobrescribir
                const existing = localStorage.getItem(key);
                if (existing && existing !== value) {
                    guardian.createBackup(key, 'auto');
                }
            }
            
            // Llamar al método original
            return originalSetItem.call(this, key, value);
        };
    }
    
    // Programar respaldos automáticos
    scheduleAutoBackups() {
        // Respaldo cada 30 minutos
        setInterval(() => {
            console.log('💾 Creando respaldos automáticos...');
            for (const key of this.criticalKeys) {
                if (localStorage.getItem(key)) {
                    this.createBackup(key, 'scheduled');
                }
            }
        }, 30 * 60 * 1000);
        
        console.log('📅 Respaldos automáticos programados cada 30 minutos');
    }
    
    // Programar validaciones periódicas
    schedulePeriodicValidation() {
        // Validación cada 10 minutos
        setInterval(() => {
            this.performIntegrityCheck();
        }, 10 * 60 * 1000);
        
        console.log('🕐 Validaciones periódicas programadas cada 10 minutos');
    }
    
    // Funciones públicas
    manualCheck() {
        return this.performIntegrityCheck();
    }
    
    manualBackup() {
        for (const key of this.criticalKeys) {
            if (localStorage.getItem(key)) {
                this.createBackup(key, 'manual');
            }
        }
        console.log('✅ Respaldo manual completado');
    }
    
    getBackupInfo() {
        return this.getAllBackups();
    }
    
    repairSpecificKey(key) {
        const validationResult = this.validateKey(key);
        if (!validationResult.isValid) {
            return this.attemptRepair(key, validationResult);
        }
        return { success: true, message: 'Los datos ya están íntegros' };
    }
}

// Inicializar guardian global
window.dataIntegrityGuardian = new DataIntegrityGuardian();

// Funciones de utilidad para acceso manual
window.checkDataIntegrity = () => window.dataIntegrityGuardian.manualCheck();
window.createDataBackup = () => window.dataIntegrityGuardian.manualBackup();
window.getBackupInfo = () => window.dataIntegrityGuardian.getBackupInfo();

console.log('🛡️ Data Integrity Guardian cargado y activo');
console.log('💡 Comandos: checkDataIntegrity(), createDataBackup(), getBackupInfo()');