// database.js - Sistema robusto de base de datos local
class ReceiptDatabase {
    constructor() {
        this.dbName = 'ciaociao_receipts';
        this.clientsDbName = 'ciaociao_clients';
        this.maxReceipts = 1000;
        this.backupInterval = 5;
        this.initializeDatabase();
    }

    initializeDatabase() {
        try {
            // Verificar si localStorage está disponible
            if (typeof(Storage) === "undefined") {
                throw new Error("LocalStorage no está disponible en este navegador");
            }

            // Inicializar base de datos si no existe
            if (!localStorage.getItem(this.dbName)) {
                localStorage.setItem(this.dbName, JSON.stringify([]));
            }
            
            if (!localStorage.getItem(this.clientsDbName)) {
                localStorage.setItem(this.clientsDbName, JSON.stringify([]));
            }

            // Verificar integridad de datos
            this.validateDatabase();
            
            // Limpiar datos antiguos si excede el límite
            this.cleanOldReceipts();
            
            console.log('✅ Base de datos inicializada correctamente');
        } catch (error) {
            console.error('❌ Error inicializando base de datos:', error);
            this.handleDatabaseError(error);
        }
    }

    validateDatabase() {
        try {
            const receipts = JSON.parse(localStorage.getItem(this.dbName) || '[]');
            const clients = JSON.parse(localStorage.getItem(this.clientsDbName) || '[]');
            
            // Validar que sean arrays
            if (!Array.isArray(receipts) || !Array.isArray(clients)) {
                throw new Error('Formato de base de datos corrupto');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Base de datos corrupta, reiniciando...', error);
            localStorage.setItem(this.dbName, JSON.stringify([]));
            localStorage.setItem(this.clientsDbName, JSON.stringify([]));
            return false;
        }
    }

    saveReceipt(receiptData) {
        try {
            // Validar datos del recibo
            if (!this.validateReceiptData(receiptData)) {
                throw new Error('Datos del recibo inválidos');
            }

            const receipts = this.getAllReceipts();
            
            // Agregar timestamp y ID único
            receiptData.id = this.generateUniqueId();
            receiptData.createdAt = new Date().toISOString();
            receiptData.updatedAt = new Date().toISOString();
            receiptData.status = receiptData.status || 'pending';
            
            // Agregar al inicio del array (más recientes primero)
            receipts.unshift(receiptData);
            
            // Guardar en localStorage
            localStorage.setItem(this.dbName, JSON.stringify(receipts));
            
            // Guardar cliente si es nuevo
            this.saveClientIfNew(receiptData);
            
            // Hacer backup automático cada X recibos
            if (receipts.length % this.backupInterval === 0) {
                this.createBackup();
            }
            
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

    getAllReceipts() {
        try {
            const receipts = JSON.parse(localStorage.getItem(this.dbName) || '[]');
            return receipts;
        } catch (error) {
            console.error('❌ Error obteniendo recibos:', error);
            return [];
        }
    }

    getReceiptById(id) {
        try {
            const receipts = this.getAllReceipts();
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

    updateReceipt(id, updates) {
        try {
            const receipts = this.getAllReceipts();
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
            
            // Guardar cambios
            localStorage.setItem(this.dbName, JSON.stringify(receipts));
            
            console.log('✅ Recibo actualizado:', id);
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

    // Backup y restauración
    createBackup() {
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
            link.download = `backup_ciaociao_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            console.log('✅ Backup creado exitosamente');
            
        } catch (error) {
            console.error('❌ Error creando backup:', error);
        }
    }

    restoreFromBackup(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
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
                        
                        // Restaurar datos
                        localStorage.setItem(this.dbName, JSON.stringify(backup.receipts));
                        localStorage.setItem(this.clientsDbName, JSON.stringify(backup.clients));
                        
                        console.log('✅ Backup restaurado exitosamente');
                        resolve({ success: true, message: 'Backup restaurado exitosamente' });
                        
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

    // Método para obtener espacio usado
    getStorageInfo() {
        try {
            const receiptsSize = new Blob([localStorage.getItem(this.dbName) || '']).size;
            const clientsSize = new Blob([localStorage.getItem(this.clientsDbName) || '']).size;
            const totalSize = receiptsSize + clientsSize;
            
            return {
                receipts: (receiptsSize / 1024).toFixed(2) + ' KB',
                clients: (clientsSize / 1024).toFixed(2) + ' KB',
                total: (totalSize / 1024).toFixed(2) + ' KB',
                percentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) + '%' // 5MB límite típico
            };
        } catch (error) {
            console.error('❌ Error obteniendo información de almacenamiento:', error);
            return null;
        }
    }
}

// Exportar para uso global
window.ReceiptDatabase = ReceiptDatabase;