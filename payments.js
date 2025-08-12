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

    // Generar PDF de recibo de abono individual
    async generatePaymentReceiptPDF(paymentId) {
        try {
            const payment = this.payments.find(p => p.id === paymentId);
            if (!payment) {
                throw new Error('Pago no encontrado');
            }

            // Obtener información del recibo principal
            const receipt = window.receiptDB ? window.receiptDB.getReceiptById(payment.receiptId) : null;
            if (!receipt) {
                throw new Error('Recibo principal no encontrado');
            }

            // Obtener todos los pagos del recibo para calcular progreso
            const allPayments = this.getPaymentsForReceipt(payment.receiptId);
            const paymentIndex = allPayments.findIndex(p => p.id === paymentId) + 1;
            const totalPaid = this.getTotalPaidForReceipt(payment.receiptId);
            const totalAmount = receipt.subtotal || receipt.price;
            const balance = totalAmount - totalPaid;
            const progressPercentage = Math.round((totalPaid / totalAmount) * 100);

            // Generar número de recibo de abono
            const paymentReceiptNumber = `${receipt.receiptNumber}-A${paymentIndex}`;

            // Crear HTML del recibo de abono
            const paymentReceiptHTML = this.generatePaymentReceiptHTML({
                payment,
                receipt,
                paymentReceiptNumber,
                paymentIndex,
                allPayments,
                totalPaid,
                totalAmount,
                balance,
                progressPercentage
            });

            // Crear contenedor temporal para el recibo
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = paymentReceiptHTML;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '800px';
            tempDiv.style.background = 'white';
            tempDiv.style.padding = '40px';
            document.body.appendChild(tempDiv);

            // Esperar un momento para que se renderice
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generar imagen con html2canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            // Crear PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            // Guardar PDF
            const fileName = `Abono_${paymentReceiptNumber}_${receipt.clientName.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);

            // Limpiar
            document.body.removeChild(tempDiv);

            console.log('✅ Recibo de abono generado:', paymentReceiptNumber);
            return { success: true, fileName, receiptNumber: paymentReceiptNumber };

        } catch (error) {
            console.error('❌ Error generando PDF de recibo de abono:', error);
            if (window.utils) {
                window.utils.showNotification('Error al generar recibo de abono: ' + error.message, 'error');
            }
            return { success: false, error: error.message };
        }
    }

    // Generar HTML para recibo de abono
    generatePaymentReceiptHTML(data) {
        const { payment, receipt, paymentReceiptNumber, paymentIndex, allPayments, totalPaid, totalAmount, balance, progressPercentage } = data;
        
        return `
            <div class="payment-receipt">
                <div class="receipt-header">
                    <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" alt="ciaociao.mx" style="max-height: 80px;">
                    <h2>RECIBO DE ABONO #${paymentIndex}</h2>
                    <div class="receipt-info">
                        <p>ciaociao.mx - Fine Jewelry</p>
                        <p>Tel: +52 1 55 9211 2643</p>
                    </div>
                    <div class="receipt-number">No. ${paymentReceiptNumber}</div>
                </div>
                
                <div class="receipt-section">
                    <h3>Información del Recibo Principal</h3>
                    <dl class="receipt-details">
                        <dt>Recibo Principal:</dt>
                        <dd>${receipt.receiptNumber}</dd>
                        <dt>Fecha Original:</dt>
                        <dd>${this.formatDate(receipt.receiptDate)}</dd>
                        <dt>Tipo:</dt>
                        <dd>${receipt.transactionType.charAt(0).toUpperCase() + receipt.transactionType.slice(1)}</dd>
                    </dl>
                </div>
                
                <div class="receipt-section">
                    <h3>Datos del Cliente</h3>
                    <dl class="receipt-details">
                        <dt>Nombre:</dt>
                        <dd>${receipt.clientName}</dd>
                        <dt>Teléfono:</dt>
                        <dd>${receipt.clientPhone}</dd>
                        ${receipt.clientEmail ? `
                            <dt>Email:</dt>
                            <dd>${receipt.clientEmail}</dd>
                        ` : ''}
                    </dl>
                </div>
                
                <div class="receipt-section">
                    <h3>Producto</h3>
                    <table class="receipt-table">
                        <tr>
                            <th>Tipo</th>
                            <td>${receipt.pieceType.charAt(0).toUpperCase() + receipt.pieceType.slice(1)}</td>
                        </tr>
                        <tr>
                            <th>Material</th>
                            <td>${receipt.material.replace('-', ' ').toUpperCase()}</td>
                        </tr>
                        ${receipt.description ? `
                            <tr>
                                <th>Descripción</th>
                                <td>${receipt.description}</td>
                            </tr>
                        ` : ''}
                    </table>
                </div>
                
                <div class="receipt-section payment-detail">
                    <h3>Detalle del Abono</h3>
                    <table class="receipt-table">
                        <tr>
                            <th>Abono #</th>
                            <td>${paymentIndex} de ${allPayments.length}</td>
                        </tr>
                        <tr>
                            <th>Monto</th>
                            <td>${this.formatCurrency(payment.amount)}</td>
                        </tr>
                        <tr>
                            <th>Fecha</th>
                            <td>${this.formatDate(payment.date)}</td>
                        </tr>
                        <tr>
                            <th>Método de Pago</th>
                            <td>${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</td>
                        </tr>
                        ${payment.reference ? `
                            <tr>
                                <th>Referencia</th>
                                <td>${payment.reference}</td>
                            </tr>
                        ` : ''}
                        ${payment.notes ? `
                            <tr>
                                <th>Notas</th>
                                <td>${payment.notes}</td>
                            </tr>
                        ` : ''}
                    </table>
                </div>
                
                <div class="receipt-section">
                    <h3>Resumen de Pagos</h3>
                    <table class="receipt-table">
                        <tr>
                            <th>Total del Producto</th>
                            <td>${this.formatCurrency(totalAmount)}</td>
                        </tr>
                        <tr>
                            <th>Total Pagado</th>
                            <td>${this.formatCurrency(totalPaid)}</td>
                        </tr>
                        <tr class="total-row">
                            <th>Saldo Pendiente</th>
                            <td>${this.formatCurrency(balance)}</td>
                        </tr>
                        <tr>
                            <th>Progreso</th>
                            <td>${progressPercentage}% completado</td>
                        </tr>
                    </table>
                </div>
                
                <div class="progress-bar-section">
                    <div class="progress-label">Progreso de Pagos</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%; background: #D4AF37;"></div>
                    </div>
                    <div class="progress-text">${allPayments.length} abono(s) de ${Math.ceil(totalAmount / (totalAmount / allPayments.length))} registrados</div>
                </div>
                
                <div class="receipt-footer">
                    <p><strong>IMPORTANTE</strong></p>
                    <p>• Este es un recibo de abono parcial del producto.</p>
                    <p>• Conserve este comprobante para sus registros.</p>
                    <p>• El producto será entregado al completar el pago total.</p>
                    <p style="margin-top: 15px;">Gracias por su abono - ciaociao.mx</p>
                </div>
            </div>
            
            <style>
                .payment-receipt { font-family: 'Inter', sans-serif; }
                .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
                .receipt-section { margin-bottom: 25px; }
                .receipt-section h3 { color: #D4AF37; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
                .receipt-details { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
                .receipt-details dt { font-weight: bold; }
                .receipt-table { width: 100%; border-collapse: collapse; }
                .receipt-table th, .receipt-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                .receipt-table th { background: #f5f5f5; font-weight: bold; }
                .total-row { background: #f9f9f9; font-weight: bold; }
                .payment-detail { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                .progress-bar-section { margin: 20px 0; }
                .progress-label { font-weight: bold; margin-bottom: 10px; }
                .progress-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; border-radius: 10px; }
                .progress-text { text-align: center; margin-top: 10px; font-size: 14px; color: #666; }
                .receipt-footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; }
            </style>
        `;
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