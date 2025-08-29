// storage-monitor.js - Sistema de monitoreo crítico de almacenamiento
// Previene pérdida de datos por límites de localStorage

class StorageMonitor {
    constructor() {
        this.storageQuotaWarned = false;
        this.criticalThreshold = 0.8; // 80% de capacidad
        this.warningThreshold = 0.7;  // 70% de capacidad
        this.checkInterval = 30000;   // 30 segundos
        this.maxRetries = 3;
        
        // Inicializar monitoreo
        this.initializeMonitoring();
        
        // Interceptar operaciones de localStorage
        this.interceptStorageOperations();
        
        console.log('🔍 Sistema de monitoreo de almacenamiento inicializado');
    }
    
    // Obtener información de uso de almacenamiento
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            const breakdown = {};
            
            // Calcular tamaño de todos los elementos
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    const size = new Blob([key + value]).size;
                    totalSize += size;
                    itemCount++;
                    
                    // Categorizar por prefijo
                    const category = this.categorizeKey(key);
                    if (!breakdown[category]) {
                        breakdown[category] = { size: 0, count: 0 };
                    }
                    breakdown[category].size += size;
                    breakdown[category].count++;
                }
            }
            
            // Estimación de cuota (varía por navegador)
            const estimatedQuota = this.estimateStorageQuota();
            const usagePercentage = (totalSize / estimatedQuota) * 100;
            
            return {
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                itemCount,
                estimatedQuota,
                estimatedQuotaMB: (estimatedQuota / (1024 * 1024)).toFixed(2),
                usagePercentage: Math.round(usagePercentage * 100) / 100,
                breakdown,
                isNearLimit: usagePercentage > (this.warningThreshold * 100),
                isCritical: usagePercentage > (this.criticalThreshold * 100)
            };
        } catch (error) {
            console.error('❌ Error obteniendo información de almacenamiento:', error);
            return null;
        }
    }
    
    // Estimar cuota de almacenamiento según navegador
    estimateStorageQuota() {
        const userAgent = navigator.userAgent;
        
        // Estimaciones conservadoras basadas en navegadores conocidos
        if (userAgent.includes('Chrome')) {
            return 10 * 1024 * 1024; // 10MB típico
        } else if (userAgent.includes('Firefox')) {
            return 10 * 1024 * 1024; // 10MB típico
        } else if (userAgent.includes('Safari')) {
            return 5 * 1024 * 1024;  // 5MB más restrictivo
        } else {
            return 5 * 1024 * 1024;  // Conservador para navegadores desconocidos
        }
    }
    
    // Categorizar claves de localStorage
    categorizeKey(key) {
        if (key.includes('receipt')) return 'Recibos';
        if (key.includes('quotation')) return 'Cotizaciones';
        if (key.includes('client')) return 'Clientes';
        if (key.includes('payment')) return 'Pagos';
        if (key.includes('session')) return 'Sesión';
        if (key.includes('cache')) return 'Cache';
        return 'Otros';
    }
    
    // Verificar estado del almacenamiento
    checkStorageStatus() {
        const info = this.getStorageInfo();
        if (!info) return;
        
        console.log(`📊 Uso de almacenamiento: ${info.usagePercentage}% (${info.totalSizeMB}MB / ${info.estimatedQuotaMB}MB)`);
        
        if (info.isCritical) {
            this.handleCriticalStorage(info);
        } else if (info.isNearLimit) {
            this.handleWarningStorage(info);
        }
        
        return info;
    }
    
    // Manejar almacenamiento crítico
    handleCriticalStorage(info) {
        console.error('🚨 ALMACENAMIENTO CRÍTICO: ' + info.usagePercentage + '%');
        
        // Mostrar alerta crítica al usuario
        const message = `🚨 ESPACIO DE ALMACENAMIENTO CRÍTICO

Uso actual: ${info.usagePercentage}% (${info.totalSizeMB}MB)

El sistema puede fallar en cualquier momento.
Se requiere acción INMEDIATA:

1. Exportar datos importantes ahora
2. Eliminar datos antiguos
3. Crear respaldo manual

¿Desea exportar los datos ahora?`;

        if (confirm(message)) {
            this.initiateEmergencyBackup();
        }
        
        // Mostrar notificación persistente
        this.showPersistentWarning('critical');
        
        // Intentar limpieza automática de cache
        this.performEmergencyCleanup();
    }
    
    // Manejar almacenamiento en advertencia
    handleWarningStorage(info) {
        if (this.storageQuotaWarned) return; // Evitar spam de notificaciones
        
        console.warn('⚠️ Advertencia de almacenamiento: ' + info.usagePercentage + '%');
        
        const message = `⚠️ ADVERTENCIA: Espacio de almacenamiento bajo

Uso actual: ${info.usagePercentage}% (${info.totalSizeMB}MB)

Recomendaciones:
• Exportar datos regularmente
• Eliminar registros antiguos
• Considerar crear respaldo

¿Desea ver detalles del uso?`;

        if (confirm(message)) {
            this.showStorageBreakdown(info);
        }
        
        this.storageQuotaWarned = true;
        
        // Mostrar notificación visual
        this.showStorageWarning('warning');
        
        // Resetear advertencia después de 1 hora
        setTimeout(() => {
            this.storageQuotaWarned = false;
        }, 3600000);
    }
    
    // Mostrar desglose detallado del almacenamiento
    showStorageBreakdown(info) {
        let breakdown = 'DESGLOSE DE ALMACENAMIENTO:\n\n';
        
        for (const [category, data] of Object.entries(info.breakdown)) {
            const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
            breakdown += `${category}: ${sizeMB}MB (${data.count} elementos)\n`;
        }
        
        breakdown += `\nTotal: ${info.totalSizeMB}MB de ${info.estimatedQuotaMB}MB disponibles`;
        
        alert(breakdown);
    }
    
    // Iniciar respaldo de emergencia
    initiateEmergencyBackup() {
        try {
            console.log('🚀 Iniciando respaldo de emergencia...');
            
            // Recopilar todos los datos críticos
            const backupData = {
                timestamp: new Date().toISOString(),
                emergency: true,
                data: {}
            };
            
            // Obtener datos de recibos
            const receipts = localStorage.getItem('receipts_ciaociao');
            if (receipts) {
                backupData.data.receipts = JSON.parse(receipts);
            }
            
            // Obtener datos de cotizaciones
            const quotations = localStorage.getItem('quotations_ciaociao');
            if (quotations) {
                backupData.data.quotations = JSON.parse(quotations);
            }
            
            // Obtener datos de clientes
            const clients = localStorage.getItem('clients_ciaociao');
            if (clients) {
                backupData.data.clients = JSON.parse(clients);
            }
            
            // Crear archivo de respaldo
            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ciaociao-backup-emergency-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Respaldo de emergencia completado');
            alert('✅ Respaldo de emergencia descargado.\n\nGuarde este archivo en lugar seguro.');
            
        } catch (error) {
            console.error('❌ Error en respaldo de emergencia:', error);
            alert('❌ Error generando respaldo. Copie manualmente los datos importantes.');
        }
    }
    
    // Limpieza de emergencia de datos no críticos
    performEmergencyCleanup() {
        try {
            console.log('🧹 Realizando limpieza de emergencia...');
            
            let cleaned = 0;
            
            // Eliminar cache antiguo
            for (let key in localStorage) {
                if (key.includes('cache_') || key.includes('temp_')) {
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
            
            // Eliminar logs antiguos
            for (let key in localStorage) {
                if (key.includes('log_') || key.includes('debug_')) {
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
            
            console.log(`✅ Limpieza completada: ${cleaned} elementos removidos`);
            
            if (cleaned > 0) {
                // Verificar nueva situación
                const newInfo = this.getStorageInfo();
                if (newInfo) {
                    alert(`🧹 Limpieza completada.\n\nEspacio liberado: ${cleaned} elementos\nNuevo uso: ${newInfo.usagePercentage}%`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error en limpieza de emergencia:', error);
        }
    }
    
    // Mostrar advertencia visual persistente
    showPersistentWarning(level) {
        const existingWarning = document.getElementById('storage-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const warning = document.createElement('div');
        warning.id = 'storage-warning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            padding: 15px;
            background: ${level === 'critical' ? '#dc3545' : '#ffc107'};
            color: ${level === 'critical' ? 'white' : '#212529'};
            text-align: center;
            font-weight: bold;
            cursor: pointer;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        const icon = level === 'critical' ? '🚨' : '⚠️';
        const text = level === 'critical' ? 
            'CRÍTICO: Almacenamiento lleno. Haga clic para exportar datos.' :
            'ADVERTENCIA: Espacio de almacenamiento bajo. Haga clic para detalles.';
        
        warning.innerHTML = `${icon} ${text}`;
        
        warning.onclick = () => {
            if (level === 'critical') {
                this.initiateEmergencyBackup();
            } else {
                const info = this.getStorageInfo();
                if (info) this.showStorageBreakdown(info);
            }
        };
        
        document.body.appendChild(warning);
        
        // Auto-remover después de 30 segundos para advertencias
        if (level !== 'critical') {
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.remove();
                }
            }, 30000);
        }
    }
    
    // Mostrar advertencia temporal
    showStorageWarning(level) {
        if (window.utils && utils.showNotification) {
            const message = level === 'critical' ? 
                'CRÍTICO: Almacenamiento lleno. Exporte datos inmediatamente.' :
                'Advertencia: Espacio de almacenamiento bajo.';
            
            utils.showNotification(message, level === 'critical' ? 'error' : 'warning');
        }
    }
    
    // Interceptar operaciones de localStorage
    interceptStorageOperations() {
        const originalSetItem = Storage.prototype.setItem;
        const monitor = this;
        
        Storage.prototype.setItem = function(key, value) {
            try {
                // Intentar operación normal
                originalSetItem.call(this, key, value);
                
                // Verificar si se acercó al límite después de la operación
                setTimeout(() => monitor.checkStorageStatus(), 100);
                
            } catch (error) {
                // Manejar errores de cuota excedida
                if (error.name === 'QuotaExceededError' || error.name === 'QUOTA_EXCEEDED_ERR') {
                    console.error('🚨 CUOTA DE ALMACENAMIENTO EXCEDIDA');
                    
                    alert(`🚨 ERROR CRÍTICO: Almacenamiento lleno

No se pueden guardar más datos.

Acción requerida INMEDIATAMENTE:
1. Exportar todos los datos
2. Eliminar registros antiguos
3. Reiniciar la aplicación

¿Exportar datos ahora?`);
                    
                    monitor.initiateEmergencyBackup();
                    
                } else {
                    throw error; // Re-lanzar otros errores
                }
            }
        };
    }
    
    // Inicializar monitoreo automático
    initializeMonitoring() {
        // Verificación inicial
        setTimeout(() => this.checkStorageStatus(), 5000);
        
        // Verificaciones periódicas
        setInterval(() => {
            this.checkStorageStatus();
        }, this.checkInterval);
        
        // Verificación antes de cerrar/recargar página
        window.addEventListener('beforeunload', () => {
            const info = this.getStorageInfo();
            if (info && info.isCritical) {
                return 'ADVERTENCIA: Almacenamiento crítico. Se recomienda exportar datos antes de salir.';
            }
        });
        
        // Verificación al ganar foco
        window.addEventListener('focus', () => {
            setTimeout(() => this.checkStorageStatus(), 1000);
        });
    }
    
    // Obtener estadísticas para dashboard
    getStats() {
        const info = this.getStorageInfo();
        if (!info) return null;
        
        return {
            usage: info.usagePercentage,
            totalSize: info.totalSizeMB,
            availableSize: (info.estimatedQuotaMB - info.totalSizeMB).toFixed(2),
            itemCount: info.itemCount,
            status: info.isCritical ? 'critical' : info.isNearLimit ? 'warning' : 'good',
            breakdown: info.breakdown
        };
    }
    
    // Funciones utilitarias públicas
    exportAllData() {
        this.initiateEmergencyBackup();
    }
    
    cleanCache() {
        this.performEmergencyCleanup();
    }
    
    showDetails() {
        const info = this.getStorageInfo();
        if (info) {
            this.showStorageBreakdown(info);
        }
    }
}

// Inicializar monitor global
window.storageMonitor = new StorageMonitor();

// Exponer funciones para uso manual
window.checkStorage = () => window.storageMonitor.checkStorageStatus();
window.exportData = () => window.storageMonitor.exportAllData();
window.cleanCache = () => window.storageMonitor.cleanCache();

console.log('🔍 Sistema de monitoreo de almacenamiento cargado');
console.log('💡 Comandos disponibles: checkStorage(), exportData(), cleanCache()');