// payments.js - Sistema de gestión de pagos y transacciones
class PaymentManager {
    constructor() {
        this.payments = [];
        this.paymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'paypal', 'mixto'];
        this.receiptStatuses = {
            PENDING: 'pending',
            PARTIAL: 'partial',
            PAID: 'paid',
            DELIVERED: 'delivered',
            CANCELLED: 'cancelled',
            OVERDUE: 'overdue',
            DUE_SOON: 'due_soon'
        };
        this.initializePayments();
    }

    initializePayments() {
        try {
            console.log('✅ Sistema de pagos inicializado');
            this.loadPaymentHistory();
        } catch (error) {
            console.error('❌ Error inicializando sistema de pagos:', error);
        }
    }

    // Cargar historial de pagos desde localStorage
    loadPaymentHistory() {
        try {
            const stored = localStorage.getItem('ciaociao_payments');
            if (stored) {
                this.payments = JSON.parse(stored);
                this.validatePaymentData();
            }
        } catch (error) {
            console.error('❌ Error cargando historial de pagos:', error);
            this.payments = [];
        }
    }

    // Validar integridad de datos de pagos
    validatePaymentData() {
        try {
            this.payments = this.payments.filter(payment => {
                return payment && 
                       payment.receiptId && 
                       typeof payment.amount === 'number' &&
                       payment.amount >= 0;
            });
            return true;
        } catch (error) {
            console.error('❌ Error validando datos de pagos:', error);
            return false;
        }
    }

    // Registrar nuevo pago
    registerPayment(paymentData) {
        try {
            // Validar datos del pago
            if (!this.validatePayment(paymentData)) {
                throw new Error('Datos de pago inválidos');
            }

            // Calcular si hay sobrepago
            const totalPaid = this.getTotalPaidForReceipt(paymentData.receiptId);
            const newTotal = totalPaid + paymentData.amount;
            
            if (newTotal > paymentData.totalAmount) {
                const overpayment = newTotal - paymentData.totalAmount;
                if (!confirm(`Este pago genera un sobrepago de ${this.formatCurrency(overpayment)}. ¿Desea continuar?`)) {
                    return { success: false, error: 'Pago cancelado por el usuario' };
                }
            }

            // Crear registro de pago
            const payment = {
                id: this.generatePaymentId(),
                receiptId: paymentData.receiptId,
                receiptNumber: paymentData.receiptNumber,
                amount: this.roundMoney(paymentData.amount),
                method: paymentData.method,
                reference: paymentData.reference || '',
                notes: paymentData.notes || '',
                date: new Date().toISOString(),
                registeredBy: paymentData.registeredBy || 'Sistema',
                type: paymentData.type || 'abono' // abono, anticipo, liquidacion
            };

            // Agregar a la lista de pagos
            this.payments.push(payment);
            
            // Guardar en localStorage
            this.savePayments();
            
            // Actualizar estado del recibo
            this.updateReceiptStatus(paymentData.receiptId, paymentData.totalAmount);
            
            console.log('✅ Pago registrado:', payment);
            return { success: true, data: payment };
            
        } catch (error) {
            console.error('❌ Error registrando pago:', error);
            return { success: false, error: error.message };
        }
    }

    // Validar datos del pago
    validatePayment(data) {
        try {
            // Validaciones básicas
            if (!data.receiptId || !data.receiptNumber) {
                console.error('Falta ID o número de recibo');
                return false;
            }
            
            if (typeof data.amount !== 'number' || data.amount <= 0) {
                console.error('Monto inválido');
                return false;
            }
            
            if (!this.paymentMethods.includes(data.method)) {
                console.error('Método de pago inválido');
                return false;
            }
            
            // Validar que no sea NaN o Infinity
            if (!isFinite(data.amount)) {
                console.error('Monto debe ser un número finito');
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error validando pago:', error);
            return false;
        }
    }

    // Obtener todos los pagos de un recibo
    getPaymentsForReceipt(receiptId) {
        try {
            return this.payments.filter(p => p.receiptId === receiptId)
                                .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('❌ Error obteniendo pagos del recibo:', error);
            return [];
        }
    }

    // Calcular total pagado para un recibo
    getTotalPaidForReceipt(receiptId) {
        try {
            const payments = this.getPaymentsForReceipt(receiptId);
            const total = payments.reduce((sum, p) => sum + p.amount, 0);
            return this.roundMoney(total);
        } catch (error) {
            console.error('❌ Error calculando total pagado:', error);
            return 0;
        }
    }

    // Calcular saldo pendiente
    getBalanceForReceipt(receiptId, totalAmount) {
        try {
            const paid = this.getTotalPaidForReceipt(receiptId);
            const balance = totalAmount - paid;
            return this.roundMoney(Math.max(0, balance));
        } catch (error) {
            console.error('❌ Error calculando saldo:', error);
            return totalAmount;
        }
    }

    // Actualizar estado del recibo basado en pagos
    updateReceiptStatus(receiptId, totalAmount) {
        try {
            const paid = this.getTotalPaidForReceipt(receiptId);
            const balance = this.getBalanceForReceipt(receiptId, totalAmount);
            
            let status;
            if (balance === 0) {
                status = this.receiptStatuses.PAID;
            } else if (paid > 0) {
                status = this.receiptStatuses.PARTIAL;
            } else {
                status = this.receiptStatuses.PENDING;
            }
            
            // Actualizar en la base de datos principal
            if (window.receiptDB) {
                window.receiptDB.updateReceipt(receiptId, { 
                    status: status,
                    totalPaid: paid,
                    balance: balance
                });
            }
            
            console.log(`✅ Estado actualizado: ${status} (Pagado: ${paid}, Saldo: ${balance})`);
            return status;
            
        } catch (error) {
            console.error('❌ Error actualizando estado del recibo:', error);
            return this.receiptStatuses.PENDING;
        }
    }

    // Cancelar pago
    cancelPayment(paymentId, reason) {
        try {
            const payment = this.payments.find(p => p.id === paymentId);
            if (!payment) {
                throw new Error('Pago no encontrado');
            }
            
            if (!confirm(`¿Está seguro de cancelar este pago de ${this.formatCurrency(payment.amount)}?`)) {
                return { success: false, error: 'Cancelación abortada por el usuario' };
            }
            
            // Marcar como cancelado (no eliminar para mantener historial)
            payment.cancelled = true;
            payment.cancelledDate = new Date().toISOString();
            payment.cancelledReason = reason || 'Sin especificar';
            
            this.savePayments();
            
            // Recalcular estado del recibo
            if (window.receiptDB) {
                const receipt = window.receiptDB.getReceiptById(payment.receiptId);
                if (receipt) {
                    this.updateReceiptStatus(payment.receiptId, receipt.price);
                }
            }
            
            console.log('✅ Pago cancelado:', paymentId);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error cancelando pago:', error);
            return { success: false, error: error.message };
        }
    }

    // Generar recibo de pago
    generatePaymentReceipt(paymentId) {
        try {
            const payment = this.payments.find(p => p.id === paymentId);
            if (!payment) {
                throw new Error('Pago no encontrado');
            }
            
            const receipt = {
                title: 'RECIBO DE PAGO',
                paymentId: payment.id,
                receiptNumber: payment.receiptNumber,
                date: new Date(payment.date).toLocaleDateString('es-MX'),
                amount: this.formatCurrency(payment.amount),
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes,
                timestamp: new Date().toISOString()
            };
            
            return receipt;
            
        } catch (error) {
            console.error('❌ Error generando recibo de pago:', error);
            return null;
        }
    }

    // Crear plan de pagos
    createPaymentPlan(totalAmount, numberOfPayments, frequency = 30, startDate = new Date()) {
        try {
            if (numberOfPayments <= 0 || totalAmount <= 0) {
                throw new Error('Parámetros inválidos para plan de pagos');
            }
            
            const plan = [];
            
            for (let i = 0; i < numberOfPayments; i++) {
                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + (frequency * i));
                
                // Calcular monto - el último pago ajusta diferencias por redondeo
                let amount;
                if (numberOfPayments === 2) {
                    amount = (i === 0) ? this.roundMoney(totalAmount * 0.5) : this.roundMoney(totalAmount * 0.5);
                } else if (numberOfPayments === 3) {
                    if (i < 2) {
                        amount = this.roundMoney(totalAmount * 0.33);
                    } else {
                        amount = this.roundMoney(totalAmount - (this.roundMoney(totalAmount * 0.33) * 2));
                    }
                } else if (numberOfPayments === 4) {
                    amount = this.roundMoney(totalAmount * 0.25);
                    if (i === 3) {
                        amount = this.roundMoney(totalAmount - (this.roundMoney(totalAmount * 0.25) * 3));
                    }
                } else {
                    // Para otros casos, dividir equitativamente
                    const baseAmount = this.roundMoney(totalAmount / numberOfPayments);
                    amount = (i === numberOfPayments - 1) 
                        ? this.roundMoney(totalAmount - (baseAmount * (numberOfPayments - 1)))
                        : baseAmount;
                }
                
                plan.push({
                    paymentNumber: i + 1,
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: amount,
                    status: 'pending',
                    description: i === 0 ? 'Anticipo' : `Abono ${i}`,
                    method: ''
                });
            }
            
            console.log('✅ Plan de pagos creado:', plan);
            return plan;
            
        } catch (error) {
            console.error('❌ Error creando plan de pagos:', error);
            return [];
        }
    }
    
    // Obtener estado del pago basado en fecha de vencimiento
    getPaymentStatus(dueDate, isPaid = false) {
        try {
            if (isPaid) return this.receiptStatuses.PAID;
            
            const today = new Date();
            const due = new Date(dueDate);
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                return this.receiptStatuses.OVERDUE; // Vencido
            } else if (diffDays <= 3) {
                return this.receiptStatuses.DUE_SOON; // Por vencer
            } else {
                return this.receiptStatuses.PENDING; // Pendiente normal
            }
        } catch (error) {
            console.error('❌ Error obteniendo estado de pago:', error);
            return this.receiptStatuses.PENDING;
        }
    }
    
    // Generar HTML para progress bar
    generateProgressBar(totalAmount, paidAmount) {
        try {
            const percentage = Math.min(100, Math.round((paidAmount / totalAmount) * 100));
            const remaining = totalAmount - paidAmount;
            
            return `
                <div class="payment-progress">
                    <div class="progress-info">
                        <span class="progress-text">${percentage}% Pagado</span>
                        <span class="progress-amounts">${this.formatCurrency(paidAmount)} / ${this.formatCurrency(totalAmount)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    ${remaining > 0 ? `<div class="progress-remaining">Saldo pendiente: ${this.formatCurrency(remaining)}</div>` : ''}
                </div>
            `;
        } catch (error) {
            console.error('❌ Error generando progress bar:', error);
            return '';
        }
    }
    
    // Generar timeline visual de pagos
    generatePaymentTimeline(paymentPlan, payments = []) {
        try {
            if (!paymentPlan || paymentPlan.length === 0) {
                return '<p>No hay plan de pagos configurado</p>';
            }
            
            let timelineHTML = '<div class="payment-timeline">';
            
            paymentPlan.forEach((plannedPayment, index) => {
                // Buscar si este pago ya fue realizado
                const actualPayment = payments.find(p => p.paymentNumber === plannedPayment.paymentNumber);
                const status = actualPayment ? 'paid' : this.getPaymentStatus(plannedPayment.dueDate);
                
                const statusIcons = {
                    'paid': '✅',
                    'overdue': '🔴',
                    'due_soon': '🟡',
                    'pending': '🔄'
                };
                
                const statusClasses = {
                    'paid': 'timeline-paid',
                    'overdue': 'timeline-overdue', 
                    'due_soon': 'timeline-due-soon',
                    'pending': 'timeline-pending'
                };
                
                timelineHTML += `
                    <div class="timeline-item ${statusClasses[status]}">
                        <div class="timeline-icon">${statusIcons[status]}</div>
                        <div class="timeline-content">
                            <h5>${plannedPayment.description}</h5>
                            <p class="timeline-amount">${this.formatCurrency(plannedPayment.amount)}</p>
                            <p class="timeline-date">${this.formatDate(plannedPayment.dueDate)}</p>
                            ${actualPayment ? `<small>Pagado: ${this.formatDate(actualPayment.date)} (${actualPayment.method})</small>` : ''}
                        </div>
                    </div>
                `;
            });
            
            timelineHTML += '</div>';
            return timelineHTML;
            
        } catch (error) {
            console.error('❌ Error generando timeline:', error);
            return '<p>Error generando timeline de pagos</p>';
        }
    }
    
    // Formatear fecha para mostrar
    formatDate(dateString) {
        try {
            if (!dateString) return '';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('es-MX', options);
        } catch (error) {
            return dateString;
        }
    }

    // Obtener resumen de pagos
    getPaymentSummary(receiptId, totalAmount) {
        try {
            const payments = this.getPaymentsForReceipt(receiptId);
            const validPayments = payments.filter(p => !p.cancelled);
            const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalAmount - totalPaid;
            
            return {
                totalAmount: this.roundMoney(totalAmount),
                totalPaid: this.roundMoney(totalPaid),
                balance: this.roundMoney(Math.max(0, balance)),
                numberOfPayments: validPayments.length,
                lastPaymentDate: validPayments[0]?.date || null,
                status: this.getPaymentStatus(totalPaid, totalAmount),
                payments: validPayments,
                percentage: Math.min(100, Math.round((totalPaid / totalAmount) * 100))
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo resumen de pagos:', error);
            return null;
        }
    }

    // Determinar estado del pago
    getPaymentStatus(paid, total) {
        const percentage = (paid / total) * 100;
        
        if (percentage === 0) return this.receiptStatuses.PENDING;
        if (percentage < 100) return this.receiptStatuses.PARTIAL;
        if (percentage === 100) return this.receiptStatuses.PAID;
        if (percentage > 100) return 'overpaid';
        
        return this.receiptStatuses.PENDING;
    }

    // Estadísticas de pagos
    getPaymentStatistics(period = 'month') {
        try {
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
                    startDate = new Date(0);
            }
            
            const filteredPayments = this.payments.filter(p => 
                new Date(p.date) >= startDate && !p.cancelled
            );
            
            const stats = {
                totalCollected: this.roundMoney(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0)
                ),
                numberOfPayments: filteredPayments.length,
                averagePayment: 0,
                byMethod: {},
                topPayments: []
            };
            
            if (stats.numberOfPayments > 0) {
                stats.averagePayment = this.roundMoney(
                    stats.totalCollected / stats.numberOfPayments
                );
            }
            
            // Estadísticas por método de pago
            filteredPayments.forEach(p => {
                if (!stats.byMethod[p.method]) {
                    stats.byMethod[p.method] = {
                        count: 0,
                        total: 0
                    };
                }
                stats.byMethod[p.method].count++;
                stats.byMethod[p.method].total = this.roundMoney(
                    stats.byMethod[p.method].total + p.amount
                );
            });
            
            // Top 5 pagos más altos
            stats.topPayments = filteredPayments
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map(p => ({
                    receiptNumber: p.receiptNumber,
                    amount: p.amount,
                    date: new Date(p.date).toLocaleDateString('es-MX'),
                    method: p.method
                }));
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error calculando estadísticas de pagos:', error);
            return null;
        }
    }

    // Exportar historial de pagos
    exportPaymentHistory(format = 'json') {
        try {
            const data = this.payments.filter(p => !p.cancelled);
            
            if (format === 'json') {
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `pagos_ciaociao_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                
                URL.revokeObjectURL(url);
            } else if (format === 'csv') {
                const headers = ['ID', 'Recibo', 'Fecha', 'Monto', 'Método', 'Referencia', 'Notas'];
                const rows = data.map(p => [
                    p.id,
                    p.receiptNumber,
                    new Date(p.date).toLocaleDateString('es-MX'),
                    p.amount,
                    p.method,
                    p.reference || '',
                    p.notes || ''
                ]);
                
                let csvContent = headers.join(',') + '\n';
                rows.forEach(row => {
                    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
                });
                
                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `pagos_ciaociao_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                
                URL.revokeObjectURL(url);
            }
            
            console.log('✅ Historial de pagos exportado');
            return true;
            
        } catch (error) {
            console.error('❌ Error exportando historial de pagos:', error);
            return false;
        }
    }

    // Utilidades
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    roundMoney(amount) {
        // Redondeo bancario a 2 decimales
        return Math.round(amount * 100) / 100;
    }

    generatePaymentId() {
        return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    savePayments() {
        try {
            localStorage.setItem('ciaociao_payments', JSON.stringify(this.payments));
            console.log('✅ Pagos guardados en localStorage');
        } catch (error) {
            console.error('❌ Error guardando pagos:', error);
        }
    }

    // Limpiar pagos antiguos (mantenimiento)
    cleanOldPayments(daysToKeep = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const before = this.payments.length;
            this.payments = this.payments.filter(p => 
                new Date(p.date) > cutoffDate
            );
            const after = this.payments.length;
            
            if (before > after) {
                this.savePayments();
                console.log(`✅ Limpieza: ${before - after} pagos antiguos eliminados`);
            }
            
        } catch (error) {
            console.error('❌ Error limpiando pagos antiguos:', error);
        }
    }
}

// Exportar para uso global
window.PaymentManager = PaymentManager;