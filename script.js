// script.js - Archivo principal integrado con todos los módulos
// Variables globales
let signaturePad;
let receiptCounter = parseInt(localStorage.getItem('receiptCounter') || '1');
let receiptDB;
let cameraManager;
let paymentManager;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        console.log('🚀 Iniciando aplicación ciaociao.mx...');
        
        // Inicializar sistemas principales
        initializeModules();
        
        // Configurar aplicación
        setCurrentDate();
        generateReceiptNumber();
        initializeSignaturePad();
        setupEventListeners();
        setupClientAutoComplete();
        
        // Configuraciones específicas
        handleTransactionTypeChange();
        
        // Restaurar auto-guardado si existe
        if (window.utils) {
            window.utils.restoreAutoSave();
        }
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        alert('Error iniciando la aplicación. Por favor recarga la página.');
    }
}

function initializeModules() {
    try {
        // Inicializar base de datos
        receiptDB = new ReceiptDatabase();
        window.receiptDB = receiptDB;
        
        // Inicializar cámara
        cameraManager = new CameraManager();
        window.cameraManager = cameraManager;
        
        // Inicializar sistema de pagos
        paymentManager = new PaymentManager();
        window.paymentManager = paymentManager;
        
        console.log('✅ Módulos inicializados');
    } catch (error) {
        console.error('❌ Error inicializando módulos:', error);
        throw error;
    }
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receiptDate').value = today;
}

function generateReceiptNumber() {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Obtener contador del día actual para evitar duplicados
    const dayKey = `${year}${month}${day}`;
    const dailyCounter = parseInt(localStorage.getItem(`receiptCounter_${dayKey}`) || '1');
    
    const number = String(dailyCounter).padStart(3, '0');
    const receiptNumber = `CIAO-${year}${month}${day}-${number}`;
    
    document.getElementById('receiptNumber').value = receiptNumber;
    
    // Guardar contador actualizado para este día
    localStorage.setItem(`receiptCounter_${dayKey}`, (dailyCounter + 1).toString());
}

function initializeSignaturePad() {
    try {
        const canvas = document.getElementById('signatureCanvas');
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    } catch (error) {
        console.error('❌ Error inicializando firma digital:', error);
    }
}

function resizeCanvas() {
    try {
        const canvas = document.getElementById('signatureCanvas');
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        if (signaturePad) {
            signaturePad.clear();
        }
    } catch (error) {
        console.error('❌ Error redimensionando canvas:', error);
    }
}

function setupEventListeners() {
    try {
        // Cambio de tipo de transacción
        document.getElementById('transactionType').addEventListener('change', handleTransactionTypeChange);
        
        // Cálculo automático del saldo
        document.getElementById('price').addEventListener('input', calculateBalance);
        document.getElementById('contribution').addEventListener('input', calculateBalance);
        document.getElementById('deposit').addEventListener('input', calculateBalance);
        
        // Autocompletado de clientes
        document.getElementById('clientName').addEventListener('input', handleClientInput);
        document.getElementById('clientPhone').addEventListener('input', handleClientInput);
        
        // Botón limpiar firma
        document.getElementById('clearSignature').addEventListener('click', function() {
            if (signaturePad) {
                signaturePad.clear();
                utils.showNotification('Firma limpiada', 'info');
            }
        });
        
        // Botones principales
        document.getElementById('previewBtn').addEventListener('click', showPreview);
        document.getElementById('generatePdfBtn').addEventListener('click', generatePDF);
        document.getElementById('shareWhatsappBtn').addEventListener('click', shareWhatsApp);
        document.getElementById('historyBtn').addEventListener('click', showHistory);
        document.getElementById('resetBtn').addEventListener('click', resetForm);
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.logout();
            }
        });
        
        // Botón configurar plan de pagos
        document.getElementById('configurePaymentPlan').addEventListener('click', showPaymentPlanModal);
        
        // Botones de fotografía
        document.getElementById('takePhotoBtn').addEventListener('click', takePhoto);
        document.getElementById('uploadPhoto').addEventListener('change', uploadPhotos);
        
        // Modal event listeners
        setupModalEventListeners();
        
        console.log('✅ Event listeners configurados');
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

function setupModalEventListeners() {
    try {
        // Modal de vista previa
        document.querySelector('#previewModal .close').addEventListener('click', () => closeModal('previewModal'));
        document.getElementById('closePreview').addEventListener('click', () => closeModal('previewModal'));
        document.getElementById('confirmGeneratePdf').addEventListener('click', function() {
            closeModal('previewModal');
            generatePDF();
        });
        
        // Modal de historial
        document.querySelector('#historyModal .close').addEventListener('click', () => closeModal('historyModal'));
        document.getElementById('closeHistory').addEventListener('click', () => closeModal('historyModal'));
        document.getElementById('historySearch').addEventListener('input', searchHistory);
        document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
        
        // Modal de pagos
        document.querySelector('#paymentsModal .close').addEventListener('click', () => closeModal('paymentsModal'));
        document.getElementById('closePayments').addEventListener('click', () => closeModal('paymentsModal'));
        document.getElementById('addPaymentBtn').addEventListener('click', showAddPaymentForm);
        
        // Modal de plan de pagos
        document.querySelector('#paymentPlanModal .close').addEventListener('click', () => closeModal('paymentPlanModal'));
        document.getElementById('closePlanModal').addEventListener('click', () => closeModal('paymentPlanModal'));
        document.getElementById('savePlan').addEventListener('click', savePaymentPlan);
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                const modalId = event.target.id;
                closeModal(modalId);
            }
        });
    } catch (error) {
        console.error('❌ Error configurando modales:', error);
    }
}

function setupClientAutoComplete() {
    try {
        const clientNameInput = document.getElementById('clientName');
        const clientPhoneInput = document.getElementById('clientPhone');
        
        // Crear contenedor de sugerencias si no existe
        if (!document.getElementById('clientSuggestions')) {
            const suggestions = document.createElement('div');
            suggestions.id = 'clientSuggestions';
            suggestions.className = 'client-suggestions';
            suggestions.style.display = 'none';
            clientNameInput.parentNode.appendChild(suggestions);
        }
        
        // Debounce para optimizar búsquedas
        const debouncedSearch = utils.debounce(searchClients, 300);
        
        clientNameInput.addEventListener('input', debouncedSearch);
        clientPhoneInput.addEventListener('input', debouncedSearch);
        
    } catch (error) {
        console.error('❌ Error configurando autocompletado:', error);
    }
}

function searchClients() {
    try {
        const nameQuery = document.getElementById('clientName').value.trim();
        const phoneQuery = document.getElementById('clientPhone').value.trim();
        
        if (nameQuery.length < 2 && phoneQuery.length < 3) {
            hideSuggestions();
            return;
        }
        
        const query = nameQuery || phoneQuery;
        const clients = receiptDB.searchClients(query);
        
        if (clients.length > 0) {
            showClientSuggestions(clients.slice(0, 5)); // Máximo 5 sugerencias
        } else {
            hideSuggestions();
        }
        
    } catch (error) {
        console.error('❌ Error buscando clientes:', error);
    }
}

function showClientSuggestions(clients) {
    try {
        const suggestionsDiv = document.getElementById('clientSuggestions');
        
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'block';
        
        clients.forEach(client => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.innerHTML = `
                <strong>${client.name}</strong><br>
                <small>${client.phone} ${client.email ? '• ' + client.email : ''}</small>
            `;
            
            suggestion.addEventListener('click', () => {
                fillClientData(client);
                hideSuggestions();
            });
            
            suggestionsDiv.appendChild(suggestion);
        });
        
    } catch (error) {
        console.error('❌ Error mostrando sugerencias:', error);
    }
}

function hideSuggestions() {
    const suggestionsDiv = document.getElementById('clientSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

function fillClientData(client) {
    try {
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientEmail').value = client.email || '';
        
        utils.showNotification('Datos del cliente cargados', 'success');
    } catch (error) {
        console.error('❌ Error llenando datos del cliente:', error);
    }
}

function handleTransactionTypeChange() {
    const transactionType = document.getElementById('transactionType').value;
    const repairSection = document.getElementById('repairSection');
    
    if (transactionType === 'reparacion') {
        repairSection.style.display = 'block';
    } else {
        repairSection.style.display = 'none';
    }
}

function handleClientInput(event) {
    try {
        const input = event.target;
        
        // Validación en tiempo real
        if (input.id === 'clientPhone') {
            if (input.value && !utils.validatePhone(input.value)) {
                utils.highlightError(input);
            } else {
                utils.removeHighlight(input);
            }
        }
        
        if (input.id === 'clientEmail') {
            if (input.value && !utils.validateEmail(input.value)) {
                utils.highlightError(input);
            } else {
                utils.removeHighlight(input);
            }
        }
        
    } catch (error) {
        console.error('❌ Error validando entrada del cliente:', error);
    }
}

function calculateBalance() {
    try {
        const price = parseFloat(document.getElementById('price').value) || 0;
        const contribution = parseFloat(document.getElementById('contribution').value) || 0;
        const deposit = parseFloat(document.getElementById('deposit').value) || 0;
        
        // Calcular subtotal (precio + aportación)
        const subtotal = price + contribution;
        document.getElementById('subtotal').value = subtotal.toFixed(2);
        
        // Calcular saldo pendiente
        const balance = Math.max(0, subtotal - deposit);
        document.getElementById('balance').value = balance.toFixed(2);
    } catch (error) {
        console.error('❌ Error calculando saldo:', error);
    }
}

// ==================== FOTOGRAFÍAS ====================

async function takePhoto() {
    try {
        const imageData = await cameraManager.captureFromCamera();
        if (imageData) {
            const success = cameraManager.addImage(imageData);
            if (success) {
                updateImageGallery();
                utils.showNotification('Foto capturada exitosamente', 'success');
            }
        }
    } catch (error) {
        console.error('❌ Error capturando foto:', error);
        utils.showNotification('Error al capturar foto', 'error');
    }
}

async function uploadPhotos(event) {
    try {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (cameraManager.images.length >= cameraManager.maxImages) {
                utils.showNotification(`Máximo ${cameraManager.maxImages} imágenes permitidas`, 'warning');
                break;
            }
            
            const imageData = await cameraManager.loadFromFile(file);
            if (imageData) {
                cameraManager.addImage(imageData);
            }
        }
        
        updateImageGallery();
        utils.showNotification(`${files.length} imagen(es) cargadas`, 'success');
        
        // Limpiar input
        event.target.value = '';
        
    } catch (error) {
        console.error('❌ Error cargando fotos:', error);
        utils.showNotification('Error al cargar fotos', 'error');
    }
}

function updateImageGallery() {
    try {
        const container = document.getElementById('imageGallery');
        cameraManager.createImageGallery(container);
    } catch (error) {
        console.error('❌ Error actualizando galería:', error);
    }
}

// ==================== VALIDACIÓN Y FORMULARIO ====================

function validateForm() {
    try {
        const requiredFields = [
            { id: 'receiptDate', label: 'Fecha' },
            { id: 'transactionType', label: 'Tipo de Transacción' },
            { id: 'clientName', label: 'Nombre del Cliente' },
            { id: 'clientPhone', label: 'Teléfono', type: 'phone' },
            { id: 'pieceType', label: 'Tipo de Pieza' },
            { id: 'material', label: 'Material' },
            { id: 'price', label: 'Precio Total', type: 'number' }
        ];
        
        const validation = utils.validateRequiredFields(requiredFields);
        
        if (!validation.isValid) {
            const errorMessage = validation.errors.join('\n');
            alert('Por favor corrija los siguientes errores:\n\n' + errorMessage);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error validando formulario:', error);
        return false;
    }
}

function collectFormData() {
    try {
        return {
            receiptNumber: document.getElementById('receiptNumber').value,
            receiptDate: document.getElementById('receiptDate').value,
            transactionType: document.getElementById('transactionType').value,
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            clientEmail: document.getElementById('clientEmail').value,
            pieceType: document.getElementById('pieceType').value,
            material: document.getElementById('material').value,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            size: document.getElementById('size').value,
            sku: document.getElementById('sku').value,
            stones: document.getElementById('stones').value,
            orderNumber: document.getElementById('orderNumber').value,
            description: document.getElementById('description').value,
            pieceCondition: document.getElementById('pieceCondition').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            contribution: parseFloat(document.getElementById('contribution').value) || 0,
            subtotal: parseFloat(document.getElementById('subtotal').value) || 0,
            deposit: parseFloat(document.getElementById('deposit').value) || 0,
            balance: parseFloat(document.getElementById('balance').value) || 0,
            deliveryDate: document.getElementById('deliveryDate').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            observations: document.getElementById('observations').value,
            images: cameraManager.getImages(),
            signature: signaturePad && !signaturePad.isEmpty() ? signaturePad.toDataURL() : null,
            paymentPlan: currentPaymentPlan
        };
    } catch (error) {
        console.error('❌ Error recolectando datos del formulario:', error);
        return {};
    }
}

// ==================== VISTA PREVIA Y PDF ====================

function showPreview() {
    try {
        if (!validateForm()) {
            return;
        }
        
        const previewContent = generateReceiptHTML();
        document.getElementById('receiptPreview').innerHTML = previewContent;
        document.getElementById('previewModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error mostrando vista previa:', error);
        utils.showNotification('Error generando vista previa', 'error');
    }
}

function generateReceiptHTML() {
    try {
        const formData = collectFormData();
        const images = cameraManager.getImagesForPDF();
        
        let imagesHTML = '';
        if (images.length > 0) {
            imagesHTML = `
                <div class="receipt-section">
                    <h3>Fotografías</h3>
                    <div class="receipt-images">
                        ${images.map((img, index) => `
                            <img src="${img.data}" alt="Imagen ${index + 1}" style="max-width: 150px; margin: 5px; border-radius: 5px;">
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="receipt-header">
                <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" alt="ciaociao.mx">
                <h2>RECIBO</h2>
                <div class="receipt-info">
                    <p>ciaociao.mx - Fine Jewelry</p>
                    <p>Tel: +52 1 55 9211 2643</p>
                </div>
                <div class="receipt-number">No. ${formData.receiptNumber}</div>
            </div>
            
            <div class="receipt-section">
                <h3>Información General</h3>
                <dl class="receipt-details">
                    <dt>Fecha:</dt>
                    <dd>${utils.formatDate(formData.receiptDate)}</dd>
                    <dt>Tipo de Transacción:</dt>
                    <dd>${utils.capitalize(formData.transactionType)}</dd>
                    ${formData.deliveryDate ? `
                        <dt>Fecha de Entrega:</dt>
                        <dd>${utils.formatDate(formData.deliveryDate)}</dd>
                    ` : ''}
                    ${formData.orderNumber ? `
                        <dt>Número de Pedido:</dt>
                        <dd>${formData.orderNumber}</dd>
                    ` : ''}
                </dl>
            </div>
            
            <div class="receipt-section">
                <h3>Datos del Cliente</h3>
                <dl class="receipt-details">
                    <dt>Nombre:</dt>
                    <dd>${formData.clientName}</dd>
                    <dt>Teléfono:</dt>
                    <dd>${utils.formatPhone(formData.clientPhone)}</dd>
                    ${formData.clientEmail ? `
                        <dt>Email:</dt>
                        <dd>${formData.clientEmail}</dd>
                    ` : ''}
                </dl>
            </div>
            
            <div class="receipt-section">
                <h3>Detalles de la Pieza</h3>
                <table class="receipt-table">
                    <tr>
                        <th>Tipo</th>
                        <td>${utils.capitalize(formData.pieceType)}</td>
                    </tr>
                    <tr>
                        <th>Material</th>
                        <td>${formData.material.replace('-', ' ').toUpperCase()}</td>
                    </tr>
                    ${formData.weight ? `
                        <tr>
                            <th>Peso</th>
                            <td>${formData.weight} gramos</td>
                        </tr>
                    ` : ''}
                    ${formData.size ? `
                        <tr>
                            <th>Talla/Medida</th>
                            <td>${formData.size}</td>
                        </tr>
                    ` : ''}
                    ${formData.sku ? `
                        <tr>
                            <th>SKU/Código</th>
                            <td>${formData.sku}</td>
                        </tr>
                    ` : ''}
                    ${formData.stones ? `
                        <tr>
                            <th>Piedras</th>
                            <td>${formData.stones}</td>
                        </tr>
                    ` : ''}
                    ${formData.description ? `
                        <tr>
                            <th>Descripción</th>
                            <td>${formData.description}</td>
                        </tr>
                    ` : ''}
                    ${formData.pieceCondition ? `
                        <tr>
                            <th>Estado/Reparación</th>
                            <td>${formData.pieceCondition}</td>
                        </tr>
                    ` : ''}
                </table>
            </div>
            
            ${imagesHTML}
            
            ${formData.observations ? `
                <div class="receipt-section">
                    <h3>Observaciones</h3>
                    <p>${formData.observations}</p>
                </div>
            ` : ''}
            
            <div class="receipt-totals">
                <div class="total-row">
                    <span>Precio Base:</span>
                    <span>${utils.formatCurrency(formData.price)}</span>
                </div>
                ${formData.contribution > 0 ? `
                    <div class="total-row">
                        <span>Aportación:</span>
                        <span>${utils.formatCurrency(formData.contribution)}</span>
                    </div>
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>${utils.formatCurrency(formData.subtotal)}</span>
                    </div>
                ` : ''}
                ${formData.deposit > 0 ? `
                    <div class="total-row">
                        <span>Anticipo:</span>
                        <span>${utils.formatCurrency(formData.deposit)}</span>
                    </div>
                    <div class="total-row final">
                        <span>Saldo Pendiente:</span>
                        <span>${utils.formatCurrency(formData.balance)}</span>
                    </div>
                ` : ''}
                ${formData.paymentMethod ? `
                    <div class="total-row">
                        <span>Método de Pago:</span>
                        <span>${utils.capitalize(formData.paymentMethod)}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    ${formData.signature ? 
                        `<img src="${formData.signature}" style="max-width: 200px; height: 80px;">` : 
                        '<div style="height: 80px;"></div>'
                    }
                    <div class="signature-line">
                        <div class="signature-label">Firma del Cliente</div>
                    </div>
                </div>
                <div class="signature-box">
                    <div style="height: 80px;"></div>
                    <div class="signature-line">
                        <div class="signature-label">Firma Autorizada</div>
                    </div>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p><strong>TÉRMINOS Y CONDICIONES</strong></p>
                <p>• Los artículos no reclamados después de 30 días están sujetos a cargo por almacenamiento.</p>
                <p>• No nos hacemos responsables por artículos no reclamados después de 90 días.</p>
                <p>• Este recibo debe presentarse para recoger el artículo.</p>
                <p style="margin-top: 15px;">Gracias por su preferencia - ciaociao.mx</p>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generando HTML del recibo:', error);
        return '<p>Error generando vista previa del recibo</p>';
    }
}

async function generatePDF() {
    try {
        if (!validateForm()) {
            return;
        }
        
        utils.showLoading('Generando PDF...');
        
        // Guardar recibo en la base de datos
        const formData = collectFormData();
        const saveResult = receiptDB.saveReceipt(formData);
        
        if (!saveResult.success) {
            throw new Error(saveResult.error);
        }
        
        // Registrar anticipo si existe
        if (formData.deposit > 0) {
            const totalAmount = formData.contribution > 0 ? formData.subtotal : formData.price;
            const paymentData = {
                receiptId: saveResult.data.id,
                receiptNumber: formData.receiptNumber,
                amount: formData.deposit,
                method: formData.paymentMethod || 'efectivo',
                totalAmount: totalAmount,
                type: 'anticipo'
            };
            
            paymentManager.registerPayment(paymentData);
        }
        
        // Crear contenedor temporal para el recibo
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateReceiptHTML();
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '40px';
        document.body.appendChild(tempDiv);
        
        // Esperar un momento para que se carguen las imágenes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        let heightLeft = imgHeight;
        let position = 0;
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Guardar PDF
        const fileName = `Recibo_${formData.receiptNumber}_${formData.clientName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        // Limpiar
        document.body.removeChild(tempDiv);
        utils.hideLoading();
        
        // Incrementar contador
        receiptCounter++;
        localStorage.setItem('receiptCounter', receiptCounter.toString());
        
        utils.showNotification('PDF generado exitosamente', 'success');
        
        // Preguntar si desea crear nuevo recibo
        setTimeout(() => {
            if (confirm('¿Desea crear un nuevo recibo?')) {
                resetForm();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        utils.hideLoading();
        utils.showNotification('Error al generar PDF: ' + error.message, 'error');
    }
}

// ==================== HISTORIAL ====================

function showHistory() {
    try {
        const receipts = receiptDB.getAllReceipts();
        renderHistoryList(receipts);
        document.getElementById('historyModal').style.display = 'block';
    } catch (error) {
        console.error('❌ Error mostrando historial:', error);
        utils.showNotification('Error cargando historial', 'error');
    }
}

function renderHistoryList(receipts) {
    try {
        const historyList = document.getElementById('historyList');
        
        if (receipts.length === 0) {
            historyList.innerHTML = '<p>No hay recibos guardados</p>';
            return;
        }
        
        historyList.innerHTML = receipts.map(receipt => {
            const status = getReceiptStatusInfo(receipt);
            const totalAmount = receipt.subtotal || receipt.price; // Use subtotal if available, otherwise price
            const balance = paymentManager.getBalanceForReceipt(receipt.id, totalAmount);
            
            return `
                <div class="history-item" onclick="viewReceiptDetails('${receipt.id}')">
                    <div class="history-item-info">
                        <h4>${receipt.receiptNumber}</h4>
                        <p><strong>${receipt.clientName}</strong> - ${receipt.clientPhone}</p>
                        <p>${utils.formatDate(receipt.receiptDate)} • ${utils.capitalize(receipt.transactionType)}</p>
                        <p>Total: ${utils.formatCurrency(totalAmount)} ${balance > 0 ? `• Saldo: ${utils.formatCurrency(balance)}` : ''}</p>
                    </div>
                    <div class="history-item-status status-${status.status}">
                        ${status.label}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error renderizando lista de historial:', error);
    }
}

function getReceiptStatusInfo(receipt) {
    try {
        const totalPaid = paymentManager.getTotalPaidForReceipt(receipt.id);
        const balance = receipt.price - totalPaid;
        
        if (receipt.status === 'delivered') {
            return { status: 'delivered', label: 'Entregado' };
        } else if (balance <= 0) {
            return { status: 'paid', label: 'Pagado' };
        } else if (totalPaid > 0) {
            return { status: 'partial', label: 'Abonado' };
        } else {
            return { status: 'pending', label: 'Pendiente' };
        }
    } catch (error) {
        console.error('❌ Error obteniendo estado del recibo:', error);
        return { status: 'pending', label: 'Pendiente' };
    }
}

function searchHistory() {
    try {
        const query = document.getElementById('historySearch').value.trim();
        
        if (query.length === 0) {
            const allReceipts = receiptDB.getAllReceipts();
            renderHistoryList(allReceipts);
        } else {
            const results = receiptDB.searchReceipts(query);
            renderHistoryList(results);
        }
    } catch (error) {
        console.error('❌ Error buscando en historial:', error);
    }
}

function viewReceiptDetails(receiptId) {
    try {
        const receipt = receiptDB.getReceiptById(receiptId);
        if (!receipt) {
            utils.showNotification('Recibo no encontrado', 'error');
            return;
        }
        
        // Cargar datos del recibo en el formulario
        fillFormWithReceiptData(receipt);
        
        // Cerrar modal de historial
        closeModal('historyModal');
        
        // Mostrar modal de pagos si hay saldo pendiente
        const balance = paymentManager.getBalanceForReceipt(receiptId, receipt.price);
        if (balance > 0) {
            setTimeout(() => showPaymentModal(receiptId), 500);
        }
        
        utils.showNotification('Recibo cargado', 'success');
        
    } catch (error) {
        console.error('❌ Error viendo detalles del recibo:', error);
        utils.showNotification('Error cargando recibo', 'error');
    }
}

function fillFormWithReceiptData(receipt) {
    try {
        // Llenar campos básicos
        Object.keys(receipt).forEach(key => {
            const element = document.getElementById(key);
            if (element && receipt[key] !== undefined && receipt[key] !== null) {
                element.value = receipt[key];
            }
        });
        
        // Cargar imágenes si existen
        if (receipt.images && receipt.images.length > 0) {
            cameraManager.clearImages();
            receipt.images.forEach(img => {
                cameraManager.addImage(img.data);
            });
            updateImageGallery();
        }
        
        // Cargar firma si existe
        if (receipt.signature && signaturePad) {
            const img = new Image();
            img.onload = () => {
                const canvas = signaturePad._canvas;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
            };
            img.src = receipt.signature;
        }
        
        // Recalcular valores
        calculateBalance();
        handleTransactionTypeChange();
        
    } catch (error) {
        console.error('❌ Error llenando formulario con datos del recibo:', error);
    }
}

function exportHistory() {
    try {
        const receipts = receiptDB.getAllReceipts();
        receiptDB.exportToExcel();
        utils.showNotification('Historial exportado', 'success');
    } catch (error) {
        console.error('❌ Error exportando historial:', error);
        utils.showNotification('Error exportando historial', 'error');
    }
}

// ==================== PAGOS ====================

function showPaymentModal(receiptId) {
    try {
        const receipt = receiptDB.getReceiptById(receiptId);
        if (!receipt) {
            utils.showNotification('Recibo no encontrado', 'error');
            return;
        }
        
        const paymentSummary = paymentManager.getPaymentSummary(receiptId, receipt.price);
        renderPaymentModal(receipt, paymentSummary);
        
        document.getElementById('paymentsModal').style.display = 'block';
    } catch (error) {
        console.error('❌ Error mostrando modal de pagos:', error);
        utils.showNotification('Error cargando pagos', 'error');
    }
}

function renderPaymentModal(receipt, summary) {
    try {
        const content = document.getElementById('paymentContent');
        
        content.innerHTML = `
            <div class="payment-summary">
                <h4>Resumen de Pagos - ${receipt.receiptNumber}</h4>
                <div class="payment-row">
                    <span>Cliente:</span>
                    <span>${receipt.clientName}</span>
                </div>
                <div class="payment-row">
                    <span>Total:</span>
                    <span>${utils.formatCurrency(summary.totalAmount)}</span>
                </div>
                <div class="payment-row">
                    <span>Pagado:</span>
                    <span>${utils.formatCurrency(summary.totalPaid)}</span>
                </div>
                <div class="payment-row total">
                    <span>Saldo:</span>
                    <span>${utils.formatCurrency(summary.balance)}</span>
                </div>
                <div class="payment-row">
                    <span>Progreso:</span>
                    <span>${summary.percentage}%</span>
                </div>
            </div>
            
            <div class="payment-form" id="paymentForm" style="display: none;">
                <h4>Registrar Nuevo Pago</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Monto a Pagar</label>
                        <input type="number" id="paymentAmount" step="0.01" min="0" max="${summary.balance}">
                    </div>
                    <div class="form-group">
                        <label>Método de Pago</label>
                        <select id="paymentMethodSelect">
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Referencia (opcional)</label>
                        <input type="text" id="paymentReference" placeholder="Número de autorización, etc.">
                    </div>
                    <div class="form-group">
                        <label>Notas (opcional)</label>
                        <input type="text" id="paymentNotes" placeholder="Notas adicionales">
                    </div>
                </div>
                <button onclick="processPayment('${receipt.id}')" class="btn-success">💰 Procesar Pago</button>
                <button onclick="hidePaymentForm()" class="btn-secondary">Cancelar</button>
            </div>
            
            <div class="payment-history">
                <h4>Historial de Pagos</h4>
                ${summary.payments.length > 0 ? 
                    summary.payments.map(payment => `
                        <div class="payment-item">
                            <span>${utils.formatDate(payment.date, 'full')} - ${utils.formatCurrency(payment.amount)} (${utils.capitalize(payment.method)})</span>
                            ${payment.reference ? `<small>Ref: ${payment.reference}</small>` : ''}
                        </div>
                    `).join('') : 
                    '<p>No hay pagos registrados</p>'
                }
            </div>
        `;
    } catch (error) {
        console.error('❌ Error renderizando modal de pagos:', error);
    }
}

function showAddPaymentForm() {
    try {
        const form = document.getElementById('paymentForm');
        form.style.display = 'block';
        document.getElementById('paymentAmount').focus();
    } catch (error) {
        console.error('❌ Error mostrando formulario de pago:', error);
    }
}

function hidePaymentForm() {
    try {
        const form = document.getElementById('paymentForm');
        form.style.display = 'none';
        
        // Limpiar campos
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentReference').value = '';
        document.getElementById('paymentNotes').value = '';
    } catch (error) {
        console.error('❌ Error ocultando formulario de pago:', error);
    }
}

function processPayment(receiptId) {
    try {
        const receipt = receiptDB.getReceiptById(receiptId);
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const method = document.getElementById('paymentMethodSelect').value;
        const reference = document.getElementById('paymentReference').value;
        const notes = document.getElementById('paymentNotes').value;
        
        if (!amount || amount <= 0) {
            utils.showNotification('Ingrese un monto válido', 'error');
            return;
        }
        
        const paymentData = {
            receiptId: receiptId,
            receiptNumber: receipt.receiptNumber,
            amount: amount,
            method: method,
            reference: reference,
            notes: notes,
            totalAmount: receipt.price
        };
        
        const result = paymentManager.registerPayment(paymentData);
        
        if (result.success) {
            utils.showNotification('Pago registrado exitosamente', 'success');
            
            // Actualizar modal
            const summary = paymentManager.getPaymentSummary(receiptId, receipt.price);
            renderPaymentModal(receipt, summary);
            hidePaymentForm();
            
            // Actualizar historial si está abierto
            if (document.getElementById('historyModal').style.display === 'block') {
                const receipts = receiptDB.getAllReceipts();
                renderHistoryList(receipts);
            }
        } else {
            utils.showNotification('Error: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        utils.showNotification('Error procesando pago', 'error');
    }
}

// ==================== WHATSAPP ====================

function shareWhatsApp() {
    try {
        if (!validateForm()) {
            return;
        }
        
        const formData = collectFormData();
        const balance = paymentManager.getBalanceForReceipt(formData.receiptNumber, formData.price);
        
        let message = `*RECIBO ${formData.receiptNumber}*\n\n`;
        message += `*Cliente:* ${formData.clientName}\n`;
        message += `*Teléfono:* ${formData.clientPhone}\n`;
        message += `*Fecha:* ${utils.formatDate(formData.receiptDate)}\n\n`;
        message += `*DETALLES DE LA PIEZA*\n`;
        message += `*Tipo:* ${utils.capitalize(formData.pieceType)}\n`;
        message += `*Material:* ${formData.material.replace('-', ' ').toUpperCase()}\n`;
        
        if (formData.weight) message += `*Peso:* ${formData.weight} gramos\n`;
        if (formData.size) message += `*Talla:* ${formData.size}\n`;
        if (formData.sku) message += `*Código SKU:* ${formData.sku}\n`;
        if (formData.stones) message += `*Piedras:* ${formData.stones}\n`;
        if (formData.description) message += `*Descripción:* ${formData.description}\n`;
        
        message += `\n*INFORMACIÓN FINANCIERA*\n`;
        message += `*Precio Base:* ${utils.formatCurrency(formData.price)}\n`;
        if (formData.contribution > 0) {
            message += `*Aportación:* ${utils.formatCurrency(formData.contribution)}\n`;
            message += `*Total:* ${utils.formatCurrency(formData.subtotal)}\n`;
        }
        
        // Incluir plan de pagos si existe
        if (formData.paymentPlan && formData.paymentPlan.length > 1) {
            message += `\n*PLAN DE PAGOS:*\n`;
            formData.paymentPlan.forEach((payment, index) => {
                const status = payment.status === 'paid' ? '✅' : payment.status === 'overdue' ? '🔴' : '🔄';
                message += `${status} ${payment.description}: ${utils.formatCurrency(payment.amount)} (${utils.formatDate(payment.dueDate)})\n`;
            });
        } else if (formData.deposit > 0) {
            message += `*Anticipo:* ${utils.formatCurrency(formData.deposit)}\n`;
            message += `*Saldo Pendiente:* ${utils.formatCurrency(balance)}\n`;
        }
        
        if (formData.deliveryDate) {
            message += `\n*Fecha de Entrega:* ${utils.formatDate(formData.deliveryDate)}\n`;
        }
        
        message += `\n*Métodos de pago disponibles:*\n`;
        message += `💰 Efectivo en tienda\n`;
        message += `💳 Tarjeta/PayPal\n`;
        message += `📲 Transferencia\n`;
        
        message += `\n_¡Gracias por su preferencia!_\n*ciaociao.mx* ✨\n`;
        message += `Tel: +52 1 55 9211 2643`;
        
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = formData.clientPhone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
    } catch (error) {
        console.error('❌ Error compartiendo por WhatsApp:', error);
        utils.showNotification('Error compartiendo por WhatsApp', 'error');
    }
}

// ==================== PLAN DE PAGOS ====================

let currentPaymentPlan = null;

function showPaymentPlanModal() {
    try {
        const priceInput = document.getElementById('price');
        const price = parseFloat(priceInput.value);
        
        if (!price || price <= 0) {
            utils.showNotification('Ingrese el precio total antes de configurar el plan de pagos', 'warning');
            priceInput.focus();
            return;
        }
        
        // Resetear selección
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.remove('selected');
            option.addEventListener('click', selectPlan);
        });
        
        // Ocultar detalles
        document.getElementById('planDetails').style.display = 'none';
        document.getElementById('savePlan').style.display = 'none';
        
        document.getElementById('paymentPlanModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error mostrando modal de plan de pagos:', error);
        utils.showNotification('Error abriendo configurador de pagos', 'error');
    }
}

function selectPlan(event) {
    try {
        const planOption = event.currentTarget;
        const planNumber = parseInt(planOption.dataset.plan);
        
        // Limpiar selección anterior
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Seleccionar actual
        planOption.classList.add('selected');
        
        if (planNumber === 1) {
            // Pago único - ocultar detalles
            document.getElementById('planDetails').style.display = 'none';
            document.getElementById('savePlan').style.display = 'inline-block';
            currentPaymentPlan = null;
        } else {
            // Mostrar detalles del plan
            showPlanDetails(planNumber);
        }
        
    } catch (error) {
        console.error('❌ Error seleccionando plan:', error);
    }
}

function showPlanDetails(numberOfPayments) {
    try {
        const price = parseFloat(document.getElementById('price').value);
        const frequency = parseInt(document.getElementById('paymentFrequency').value) || 30;
        
        // Generar plan de ejemplo
        const plan = paymentManager.createPaymentPlan(price, numberOfPayments, frequency);
        currentPaymentPlan = plan;
        
        // Mostrar timeline del plan
        const timelineHTML = paymentManager.generatePaymentTimeline(plan);
        document.getElementById('planSchedule').innerHTML = timelineHTML;
        
        // Mostrar sección de detalles
        document.getElementById('planDetails').style.display = 'block';
        document.getElementById('savePlan').style.display = 'inline-block';
        
        // Event listener para cambio de frecuencia
        document.getElementById('paymentFrequency').addEventListener('change', () => {
            showPlanDetails(numberOfPayments);
        });
        
    } catch (error) {
        console.error('❌ Error mostrando detalles del plan:', error);
    }
}

function savePaymentPlan() {
    try {
        if (currentPaymentPlan && currentPaymentPlan.length > 1) {
            // Guardar plan en el formulario (como campo oculto)
            const formData = collectFormData();
            formData.paymentPlan = currentPaymentPlan;
            
            // Actualizar el anticipo con el primer pago del plan
            document.getElementById('deposit').value = currentPaymentPlan[0].amount;
            calculateBalance();
            
            utils.showNotification(`Plan de ${currentPaymentPlan.length} pagos configurado`, 'success');
        } else {
            // Pago único
            currentPaymentPlan = null;
            utils.showNotification('Configurado para pago único', 'success');
        }
        
        closeModal('paymentPlanModal');
        
    } catch (error) {
        console.error('❌ Error guardando plan de pagos:', error);
        utils.showNotification('Error guardando plan de pagos', 'error');
    }
}

// ==================== UTILIDADES ====================

function resetForm() {
    try {
        if (confirm('¿Está seguro de que desea limpiar todo el formulario?')) {
            document.getElementById('receiptForm').reset();
            
            if (signaturePad) {
                signaturePad.clear();
            }
            
            cameraManager.clearImages();
            updateImageGallery();
            
            setCurrentDate();
            generateReceiptNumber();
            handleTransactionTypeChange();
            
            utils.showNotification('Formulario limpiado', 'info');
        }
    } catch (error) {
        console.error('❌ Error limpiando formulario:', error);
    }
}

function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Error cerrando modal:', error);
    }
}

// ==================== FUNCIONES GLOBALES ====================

// Hacer funciones disponibles globalmente para eventos onclick
window.viewReceiptDetails = viewReceiptDetails;
window.processPayment = processPayment;
window.showAddPaymentForm = showAddPaymentForm;
window.hidePaymentForm = hidePaymentForm;

// Funciones de limpieza al cerrar la aplicación
window.addEventListener('beforeunload', function() {
    try {
        if (cameraManager) {
            cameraManager.cleanup();
        }
        
        if (utils) {
            utils.autoSaveForm();
        }
    } catch (error) {
        console.error('❌ Error en limpieza final:', error);
    }
});

console.log('✅ Script principal cargado completamente');