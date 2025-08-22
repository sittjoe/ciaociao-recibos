// script.js - Archivo principal integrado con todos los módulos
// Variables globales
let signaturePad;
let companySignaturePad; // Firma de la empresa
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
        // Configuración común para ambas firmas
        const signatureConfig = {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            velocityFilterWeight: 0.7,
            minWidth: 0.5,
            maxWidth: 2.5
        };
        
        // Firma del cliente con verificación robusta
        const clientCanvas = document.getElementById('signatureCanvas');
        if (clientCanvas && clientCanvas.offsetParent !== null) {
            signaturePad = new SignaturePad(clientCanvas, signatureConfig);
            console.log('✅ Firma del cliente inicializada');
        } else if (clientCanvas) {
            console.log('🔄 Canvas de cliente no visible, reintentando...');
            setTimeout(() => {
                if (clientCanvas.offsetParent !== null) {
                    signaturePad = new SignaturePad(clientCanvas, signatureConfig);
                    console.log('✅ Firma del cliente inicializada (retry)');
                }
            }, 500);
        }
        
        // Firma de la empresa - inicialización mejorada
        const companyCanvas = document.getElementById('companySignatureCanvas');
        if (companyCanvas && companyCanvas.offsetParent !== null) {
            initializeCompanySignature(companyCanvas, signatureConfig);
        } else if (companyCanvas) {
            console.log('🔄 Canvas de empresa no visible, reintentando...');
            setTimeout(() => {
                if (companyCanvas.offsetParent !== null) {
                    initializeCompanySignature(companyCanvas, signatureConfig);
                }
            }, 500);
        }
        
        // Configurar resize con debounce
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 250);
        };
        
        window.addEventListener('resize', debouncedResize);
        
        // Inicializar dimensiones
        setTimeout(resizeCanvas, 100);
        
        console.log('✅ Firmas digitales configuradas');
    } catch (error) {
        console.error('❌ Error inicializando firma digital:', error);
    }
}

// Función auxiliar para inicializar firma de empresa
function initializeCompanySignature(canvas, config) {
    try {
        if (canvas && canvas.offsetWidth > 0) {
            companySignaturePad = new SignaturePad(canvas, config);
            console.log('✅ Firma de empresa inicializada correctamente');
        } else {
            console.warn('⚠️ Canvas de empresa aún no está listo');
        }
    } catch (error) {
        console.error('❌ Error inicializando firma de empresa:', error);
    }
}

function resizeCanvas() {
    try {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // Redimensionar canvas del cliente
        const clientCanvas = document.getElementById('signatureCanvas');
        if (clientCanvas && clientCanvas.offsetWidth > 0) {
            // Guardar firma existente si existe
            let clientSignatureData = null;
            if (signaturePad && !signaturePad.isEmpty()) {
                clientSignatureData = signaturePad.toDataURL();
            }
            
            clientCanvas.width = clientCanvas.offsetWidth * ratio;
            clientCanvas.height = clientCanvas.offsetHeight * ratio;
            clientCanvas.getContext('2d').scale(ratio, ratio);
            
            // Restaurar firma si existía
            if (clientSignatureData && signaturePad) {
                const img = new Image();
                img.onload = () => {
                    const ctx = clientCanvas.getContext('2d');
                    ctx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
                    ctx.drawImage(img, 0, 0, clientCanvas.offsetWidth, clientCanvas.offsetHeight);
                };
                img.src = clientSignatureData;
            }
        }
        
        // Redimensionar canvas de la empresa
        const companyCanvas = document.getElementById('companySignatureCanvas');
        if (companyCanvas && companyCanvas.offsetWidth > 0) {
            // Guardar firma existente si existe
            let companySignatureData = null;
            if (companySignaturePad && !companySignaturePad.isEmpty()) {
                companySignatureData = companySignaturePad.toDataURL();
            }
            
            companyCanvas.width = companyCanvas.offsetWidth * ratio;
            companyCanvas.height = companyCanvas.offsetHeight * ratio;
            companyCanvas.getContext('2d').scale(ratio, ratio);
            
            // Restaurar firma si existía
            if (companySignatureData && companySignaturePad) {
                const img = new Image();
                img.onload = () => {
                    const ctx = companyCanvas.getContext('2d');
                    ctx.clearRect(0, 0, companyCanvas.width, companyCanvas.height);
                    ctx.drawImage(img, 0, 0, companyCanvas.offsetWidth, companyCanvas.offsetHeight);
                };
                img.src = companySignatureData;
            }
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

        // Botón limpiar firma de empresa - con verificación robusta
        const clearCompanyBtn = document.getElementById('clearCompanySignature');
        if (clearCompanyBtn) {
            clearCompanyBtn.addEventListener('click', function() {
                if (companySignaturePad) {
                    companySignaturePad.clear();
                    utils.showNotification('Firma de empresa limpiada', 'info');
                } else {
                    console.warn('⚠️ companySignaturePad no inicializado');
                }
            });
        }
        
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
        // Obtener elementos con validación
        const priceInput = document.getElementById('price');
        const contributionInput = document.getElementById('contribution');
        const depositInput = document.getElementById('deposit');
        const subtotalInput = document.getElementById('subtotal');
        const balanceInput = document.getElementById('balance');
        
        if (!priceInput || !contributionInput || !depositInput || !subtotalInput || !balanceInput) {
            console.warn('⚠️ Algunos campos de cálculo no están disponibles');
            return;
        }
        
        // Obtener valores y validar
        const price = Math.max(0, parseFloat(priceInput.value) || 0);
        const contribution = Math.max(0, parseFloat(contributionInput.value) || 0);
        const deposit = Math.max(0, parseFloat(depositInput.value) || 0);
        
        // Calcular subtotal (precio + aportación)
        const subtotal = price + contribution;
        
        // Calcular saldo pendiente
        const balance = Math.max(0, subtotal - deposit);
        
        // Actualizar campos con formato correcto
        if (utils && typeof utils.formatNumber === 'function') {
            subtotalInput.value = utils.formatNumber(subtotal);
            balanceInput.value = utils.formatNumber(balance);
        } else {
            // Fallback si utils no está disponible
            subtotalInput.value = subtotal.toFixed(2);
            balanceInput.value = balance.toFixed(2);
        }
        
        // Validar que el anticipo no sea mayor que el subtotal
        if (deposit > subtotal && deposit > 0) {
            utils.showNotification('El anticipo no puede ser mayor al subtotal', 'warning');
            depositInput.value = subtotal.toFixed(2);
            calculateBalance(); // Recalcular
        }
        
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

// Función helper para obtener datos válidos de firma
function getValidSignatureData(signaturePad) {
    try {
        if (signaturePad && typeof signaturePad.isEmpty === 'function' && !signaturePad.isEmpty()) {
            const signatureData = signaturePad.toDataURL();
            // Verificar que los datos de la firma no estén corruptos
            if (signatureData && signatureData.startsWith('data:image/')) {
                return signatureData;
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo datos de firma:', error);
        return null;
    }
}

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
            signature: getValidSignatureData(signaturePad),
            companySignature: getValidSignatureData(companySignaturePad),
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
        console.log('🏗️ Generando HTML del recibo...');
        const formData = collectFormData();
        const images = cameraManager.getImagesForPDF();
        
        console.log('📋 Datos del formulario para HTML:', {
            receiptNumber: formData.receiptNumber,
            clientName: formData.clientName,
            hasImages: images.length > 0,
            hasSignature: !!formData.signature,
            hasCompanySignature: !!formData.companySignature
        });
        
        // Generar HTML de imágenes con estilos mejorados
        let imagesHTML = '';
        if (images.length > 0) {
            console.log(`📸 Incluyendo ${images.length} imágenes en el PDF`);
            imagesHTML = `
                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #D4AF37;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Fotografías</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                        ${images.map((img, index) => `
                            <img src="${img.data}" 
                                 alt="Imagen ${index + 1}" 
                                 style="max-width: 150px; max-height: 150px; margin: 5px; border-radius: 5px; border: 1px solid #ddd; object-fit: cover;">
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Generar HTML optimizado para html2canvas con estilos inline completos
        const html = `
            <div style="width: 100%; max-width: 800px; margin: 0 auto; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000000; background: #ffffff;">
                <!-- Header del recibo -->
                <div style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 3px solid #D4AF37; background: #ffffff;">
                    <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" 
                         alt="ciaociao.mx" 
                         crossorigin="anonymous"
                         style="max-width: 180px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
                    <h2 style="font-size: 24px; margin: 15px 0; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">RECIBO</h2>
                    <div style="margin: 10px 0; line-height: 1.6;">
                        <p style="font-size: 16px; margin: 5px 0; font-weight: 600; color: #1a1a1a; font-family: Arial, sans-serif;">ciaociao.mx - Fine Jewelry</p>
                        <p style="font-size: 14px; margin: 5px 0; color: #1a1a1a; font-family: Arial, sans-serif;">Tel: +52 1 55 9211 2643</p>
                    </div>
                    <div style="font-size: 18px; font-weight: bold; background: #D4AF37; color: #ffffff; padding: 8px 16px; border-radius: 5px; display: inline-block; margin-top: 10px; font-family: Arial, sans-serif;">No. ${formData.receiptNumber}</div>
                </div>
                
                <!-- Información General -->
                <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #D4AF37;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Información General</h3>
                    <div style="margin: 0; line-height: 2; font-family: Arial, sans-serif;">
                        <div style="margin-bottom: 8px;">
                            <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Fecha:</span>
                            <span style="color: #000000; font-family: Arial, sans-serif;">${utils.formatDate(formData.receiptDate)}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Tipo de Transacción:</span>
                            <span style="color: #000000; font-family: Arial, sans-serif;">${utils.capitalize(formData.transactionType)}</span>
                        </div>
                        ${formData.deliveryDate ? `
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Fecha de Entrega:</span>
                                <span style="color: #000000; font-family: Arial, sans-serif;">${utils.formatDate(formData.deliveryDate)}</span>
                            </div>
                        ` : ''}
                        ${formData.orderNumber ? `
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Número de Pedido:</span>
                                <span style="color: #000000; font-family: Arial, sans-serif;">${formData.orderNumber}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Datos del Cliente -->
                <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #D4AF37;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Datos del Cliente</h3>
                    <div style="margin: 0; line-height: 2; font-family: Arial, sans-serif;">
                        <div style="margin-bottom: 8px;">
                            <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Nombre:</span>
                            <span style="color: #000000; font-family: Arial, sans-serif;">${formData.clientName}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Teléfono:</span>
                            <span style="color: #000000; font-family: Arial, sans-serif;">${utils.formatPhone(formData.clientPhone)}</span>
                        </div>
                        ${formData.clientEmail ? `
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 140px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">Email:</span>
                                <span style="color: #000000; font-family: Arial, sans-serif;">${formData.clientEmail}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Detalles de la Pieza -->
                <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #D4AF37;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Detalles de la Pieza</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 15px; font-family: Arial, sans-serif;">
                        <tr>
                            <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Tipo</th>
                            <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${utils.capitalize(formData.pieceType)}</td>
                        </tr>
                        <tr>
                            <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Material</th>
                            <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.material.replace('-', ' ').toUpperCase()}</td>
                        </tr>
                        ${formData.weight ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Peso</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.weight} gramos</td>
                            </tr>
                        ` : ''}
                        ${formData.size ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Talla/Medida</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.size}</td>
                            </tr>
                        ` : ''}
                        ${formData.sku ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">SKU/Código</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.sku}</td>
                            </tr>
                        ` : ''}
                        ${formData.stones ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Piedras</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.stones}</td>
                            </tr>
                        ` : ''}
                        ${formData.description ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Descripción</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.description}</td>
                            </tr>
                        ` : ''}
                        ${formData.pieceCondition ? `
                            <tr>
                                <th style="padding: 12px; border: 1px solid #dddddd; background: #e9ecef; font-weight: bold; text-align: left; width: 140px; color: #000000; font-family: Arial, sans-serif;">Estado/Reparación</th>
                                <td style="padding: 12px; border: 1px solid #dddddd; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">${formData.pieceCondition}</td>
                            </tr>
                        ` : ''}
                    </table>
                </div>
                
                <!-- Imágenes -->
                ${imagesHTML}
                
                <!-- Observaciones -->
                ${formData.observations ? `
                    <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #D4AF37;">
                        <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Observaciones</h3>
                        <p style="color: #000000; font-family: Arial, sans-serif; line-height: 1.6; margin: 0;">${formData.observations}</p>
                    </div>
                ` : ''}
                
                <!-- Información Financiera -->
                <div style="margin: 30px 0; padding: 25px; background: #f8f9fa; border-radius: 10px; border: 2px solid #D4AF37;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dddddd; font-size: 16px; font-family: Arial, sans-serif;">
                        <span style="font-weight: bold; color: #000000;">Precio Base:</span>
                        <span style="font-weight: bold; color: #D4AF37;">${utils.formatCurrency(formData.price)}</span>
                    </div>
                    ${formData.contribution > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dddddd; font-size: 16px; font-family: Arial, sans-serif;">
                            <span style="font-weight: bold; color: #000000;">Aportación:</span>
                            <span style="font-weight: bold; color: #D4AF37;">${utils.formatCurrency(formData.contribution)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dddddd; font-size: 16px; font-family: Arial, sans-serif;">
                            <span style="font-weight: bold; color: #000000;">Subtotal:</span>
                            <span style="font-weight: bold; color: #D4AF37;">${utils.formatCurrency(formData.subtotal)}</span>
                        </div>
                    ` : ''}
                    ${formData.deposit > 0 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dddddd; font-size: 16px; font-family: Arial, sans-serif;">
                            <span style="font-weight: bold; color: #000000;">Anticipo:</span>
                            <span style="font-weight: bold; color: #28a745;">${utils.formatCurrency(formData.deposit)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; background: #fff3cd; border-radius: 5px; margin-top: 10px; font-size: 18px; font-family: Arial, sans-serif;">
                            <span style="font-weight: bold; margin-left: 10px; color: #000000;">Saldo Pendiente:</span>
                            <span style="font-weight: bold; color: #dc3545; margin-right: 10px;">${utils.formatCurrency(formData.balance)}</span>
                        </div>
                    ` : ''}
                    ${formData.paymentMethod ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; margin-top: 10px; font-size: 16px; font-family: Arial, sans-serif;">
                            <span style="font-weight: bold; color: #000000;">Método de Pago:</span>
                            <span style="font-weight: bold; color: #000000;">${utils.capitalize(formData.paymentMethod)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Sección de Firmas -->
                <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-family: Arial, sans-serif;">
                    <div style="text-align: center;">
                        ${formData.signature ? 
                            `<img src="${formData.signature}" style="max-width: 200px; height: 80px; border: 1px solid #dddddd; background: #ffffff;">` : 
                            '<div style="height: 80px; border: 1px solid #dddddd; background: #ffffff;"></div>'
                        }
                        <div style="border-top: 2px solid #000000; margin-top: 60px; padding-top: 10px;">
                            <div style="font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif;">Firma del Cliente</div>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        ${formData.companySignature ? 
                            `<img src="${formData.companySignature}" style="max-width: 200px; height: 80px; border: 1px solid #dddddd; background: #ffffff;">` : 
                            '<div style="height: 80px; border: 1px solid #dddddd; background: #ffffff;"></div>'
                        }
                        <div style="border-top: 2px solid #000000; margin-top: 60px; padding-top: 10px;">
                            <div style="font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif;">CIAOCIAO.MX</div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer con términos -->
                <div style="margin-top: 30px; padding: 15px; border-top: 1px solid #dddddd; font-family: Arial, sans-serif;">
                    <p style="font-weight: bold; margin-bottom: 10px; color: #000000; font-family: Arial, sans-serif;">TÉRMINOS Y CONDICIONES</p>
                    <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Los artículos no reclamados después de 30 días están sujetos a cargo por almacenamiento.</p>
                    <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• No nos hacemos responsables por artículos no reclamados después de 90 días.</p>
                    <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Este recibo debe presentarse para recoger el artículo.</p>
                    <p style="margin-top: 15px; text-align: center; color: #D4AF37; font-weight: bold; font-family: Arial, sans-serif;">Gracias por su preferencia - ciaociao.mx</p>
                </div>
            </div>
        `;
        
        console.log('✅ HTML del recibo generado exitosamente');
        return html;
    } catch (error) {
        console.error('❌ Error generando HTML del recibo:', error);
        return '<p>Error generando vista previa del recibo</p>';
    }
}

async function generatePDF() {
    try {
        console.log('🔄 Iniciando generación de PDF...');
        
        if (!validateForm()) {
            console.log('❌ Validación de formulario falló');
            return;
        }
        
        utils.showLoading('Generando PDF...');
        
        // Guardar recibo en la base de datos
        const formData = collectFormData();
        console.log('📋 Datos del formulario recolectados:', formData);
        
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
        
        console.log('🎨 Generando HTML del recibo...');
        
        // Crear contenedor temporal para el recibo con configuración optimizada para PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateReceiptHTML();
        
        // Configuración mejorada del contenedor temporal
        tempDiv.style.cssText = `
            position: absolute !important;
            left: -9999px !important;
            top: 0 !important;
            width: 900px !important;
            min-height: 800px !important;
            background: #ffffff !important;
            padding: 60px !important;
            font-size: 16px !important;
            line-height: 1.8 !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
            color: #000000 !important;
            box-sizing: border-box !important;
            z-index: -1000 !important;
        `;
        
        tempDiv.className = 'pdf-content';
        document.body.appendChild(tempDiv);
        
        console.log('📐 Contenedor temporal creado y agregado al DOM');
        
        // Verificar que el contenido se agregó correctamente
        if (!tempDiv.innerHTML.trim()) {
            throw new Error('El HTML del recibo está vacío');
        }
        
        // Aplicar estilos inline a todos los elementos para evitar problemas de CSS
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            // Asegurar que todos los elementos tengan colores explícitos
            if (window.getComputedStyle(el).color === 'rgba(0, 0, 0, 0)' || !window.getComputedStyle(el).color) {
                el.style.color = '#000000';
            }
            if (window.getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)' || !window.getComputedStyle(el).backgroundColor) {
                if (el.tagName.toLowerCase() !== 'img') {
                    el.style.backgroundColor = 'transparent';
                }
            }
        });
        
        console.log(`🖼️ Procesando ${tempDiv.querySelectorAll('img').length} imágenes...`);
        
        // Esperar a que todas las imágenes se carguen completamente
        const images = tempDiv.querySelectorAll('img');
        const imageLoadPromises = Array.from(images).map((img, index) => {
            return new Promise((resolve) => {
                console.log(`📸 Cargando imagen ${index + 1}: ${img.src.substring(0, 50)}...`);
                
                if (img.complete && img.naturalWidth !== 0) {
                    console.log(`✅ Imagen ${index + 1} ya estaba cargada`);
                    resolve();
                } else {
                    img.onload = () => {
                        console.log(`✅ Imagen ${index + 1} cargada exitosamente`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`⚠️ Error cargando imagen ${index + 1}, continuando...`);
                        resolve(); // Continuar aunque la imagen falle
                    };
                    
                    // Timeout para imágenes que no cargan
                    setTimeout(() => {
                        console.warn(`⏰ Timeout para imagen ${index + 1}, continuando...`);
                        resolve();
                    }, 10000);
                }
            });
        });
        
        await Promise.all(imageLoadPromises);
        console.log('🖼️ Todas las imágenes procesadas');
        
        // Tiempo adicional para asegurar renderizado completo
        console.log('⏳ Esperando renderizado completo...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar que el elemento aún está en el DOM
        if (!document.body.contains(tempDiv)) {
            throw new Error('El contenedor temporal fue removido del DOM');
        }
        
        console.log('🎨 Iniciando captura con html2canvas...');
        
        // Configuración mejorada de html2canvas
        const canvasOptions = {
            scale: 2, // Reducir scale para evitar problemas de memoria
            logging: true, // Habilitar logging para debug
            useCORS: true,
            allowTaint: false, // Cambiar a false para mayor compatibilidad
            backgroundColor: '#ffffff',
            foreignObjectRendering: false, // Cambiar a false para mejor compatibilidad
            removeContainer: false,
            imageTimeout: 30000, // Aumentar timeout
            letterRendering: true, // Mejorar renderizado de texto
            width: 900,
            height: null, // Permitir altura automática
            scrollX: 0,
            scrollY: 0,
            windowWidth: 900,
            windowHeight: window.innerHeight
        };
        
        console.log('📸 Configuración html2canvas:', canvasOptions);
        
        const canvas = await html2canvas(tempDiv, canvasOptions);
        
        console.log(`✅ Canvas generado - Dimensiones: ${canvas.width}x${canvas.height}`);
        
        // Verificar que el canvas no está vacío
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('El canvas generado está vacío (dimensiones 0x0)');
        }
        
        // Verificar que el canvas tiene contenido (no está completamente transparente/blanco)
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasContent = false;
        
        // Verificar si hay píxeles no blancos
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Si encontramos un pixel que no es blanco puro o transparente
            if (!(r === 255 && g === 255 && b === 255) && a > 0) {
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            console.warn('⚠️ El canvas parece estar vacío o completamente blanco');
            // No lanzar error, continuar con la generación para debug
        }
        
        console.log('📄 Creando PDF con jsPDF...');
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Convertir canvas a imagen con máxima calidad
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        console.log(`📏 Dimensiones PDF: ${imgWidth}mm x ${imgHeight}mm`);
        
        // Verificar que imgData no está vacío
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
            throw new Error('Los datos de imagen están vacíos o corruptos');
        }
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Agregar páginas adicionales si es necesario
        let pageCount = 1;
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            pageCount++;
        }
        
        console.log(`📄 PDF creado con ${pageCount} página(s)`);
        
        // Guardar PDF
        const fileName = `Recibo_${formData.receiptNumber}_${formData.clientName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        console.log(`💾 PDF guardado como: ${fileName}`);
        
        // Limpiar
        document.body.removeChild(tempDiv);
        utils.hideLoading();
        
        // Incrementar contador
        receiptCounter++;
        localStorage.setItem('receiptCounter', receiptCounter.toString());
        
        utils.showNotification('PDF generado exitosamente', 'success');
        console.log('✅ PDF generado exitosamente');
        
        // Preguntar si desea crear nuevo recibo
        setTimeout(() => {
            if (confirm('¿Desea crear un nuevo recibo?')) {
                resetForm();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        console.error('Stack trace:', error.stack);
        utils.hideLoading();
        
        // Limpiar elemento temporal si existe
        const tempDiv = document.querySelector('div[style*="position: absolute"][style*="left: -9999px"]');
        if (tempDiv && tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
            console.log('🧹 Elemento temporal limpiado');
        }
        
        // Mostrar error específico según el tipo
        let errorMessage = 'Error al generar PDF';
        if (error.message.includes('Canvas') || error.message.includes('html2canvas')) {
            errorMessage = 'Error procesando el contenido. Intente nuevamente.';
        } else if (error.message.includes('jsPDF') || error.message.includes('pdf')) {
            errorMessage = 'Error generando archivo PDF. Verifique los datos del formulario.';
        } else if (error.message.includes('signature') || error.message.includes('firma')) {
            errorMessage = 'Error procesando firmas digitales. Intente limpiar y re-firmar.';
        } else if (error.message.includes('vacío') || error.message.includes('empty')) {
            errorMessage = 'Error: el contenido del recibo está vacío. Verifique los datos.';
        }
        
        console.error('Mensaje de error para el usuario:', errorMessage);
        utils.showNotification(errorMessage, 'error');
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
                <div class="history-item">
                    <div class="history-item-info" onclick="viewReceiptDetails('${receipt.id}')">
                        <h4>${receipt.receiptNumber}</h4>
                        <p><strong>${receipt.clientName}</strong> - ${receipt.clientPhone}</p>
                        <p>${utils.formatDate(receipt.receiptDate)} • ${utils.capitalize(receipt.transactionType)}</p>
                        <p>Total: ${utils.formatCurrency(totalAmount)} ${balance > 0 ? `• Saldo: ${utils.formatCurrency(balance)}` : ''}</p>
                    </div>
                    <div class="history-item-actions">
                        <div class="history-item-status status-${status.status}">
                            ${status.label}
                        </div>
                        <div class="history-buttons">
                            <button onclick="openPaymentModal('${receipt.id}')" class="btn-mini" title="Gestionar pagos y abonos">
                                💰 Pagos
                            </button>
                            <button onclick="viewReceiptDetails('${receipt.id}')" class="btn-mini" title="Ver y editar recibo">
                                👁️ Ver
                            </button>
                        </div>
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
        const totalAmount = receipt.subtotal || receipt.price;
        const balance = totalAmount - totalPaid;
        
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
        const totalAmount = receipt.subtotal || receipt.price;
        const balance = paymentManager.getBalanceForReceipt(receiptId, totalAmount);
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
        
        // Usar subtotal si existe, sino precio base
        const totalAmount = receipt.subtotal || receipt.price;
        const paymentSummary = paymentManager.getPaymentSummary(receiptId, totalAmount);
        renderPaymentModal(receipt, paymentSummary);
        
        document.getElementById('paymentsModal').style.display = 'block';
    } catch (error) {
        console.error('❌ Error mostrando modal de pagos:', error);
        utils.showNotification('Error cargando pagos', 'error');
    }
}

// Función para abrir modal de pagos directamente (sin depender del saldo)
function openPaymentModal(receiptId) {
    try {
        const receipt = receiptDB.getReceiptById(receiptId);
        if (!receipt) {
            utils.showNotification('Recibo no encontrado', 'error');
            return;
        }
        
        // Siempre abrir el modal independientemente del saldo
        showPaymentModal(receiptId);
        
    } catch (error) {
        console.error('❌ Error abriendo modal de pagos:', error);
        utils.showNotification('Error abriendo gestión de pagos', 'error');
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
                    summary.payments.map((payment, index) => `
                        <div class="payment-item">
                            <div class="payment-info">
                                <span>${utils.formatDate(payment.date, 'full')} - ${utils.formatCurrency(payment.amount)} (${utils.capitalize(payment.method)})</span>
                                ${payment.reference ? `<small>Ref: ${payment.reference}</small>` : ''}
                            </div>
                            <div class="payment-actions">
                                <button onclick="generatePaymentReceipt('${payment.id}')" class="btn-mini" title="Generar recibo de este abono">
                                    📄 Recibo Abono #${index + 1}
                                </button>
                                <button onclick="sharePaymentWhatsApp('${payment.id}', '${receipt.id}')" class="btn-mini btn-whatsapp" title="Enviar por WhatsApp">
                                    📱 WhatsApp
                                </button>
                            </div>
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

// ==================== RECIBOS DE ABONO ====================

async function generatePaymentReceipt(paymentId) {
    try {
        if (!paymentManager) {
            utils.showNotification('Sistema de pagos no disponible', 'error');
            return;
        }

        utils.showLoading('Generando recibo de abono...');

        const result = await paymentManager.generatePaymentReceiptPDF(paymentId);
        
        utils.hideLoading();

        if (result.success) {
            utils.showNotification(`Recibo de abono ${result.receiptNumber} generado exitosamente`, 'success');
        } else {
            utils.showNotification('Error: ' + result.error, 'error');
        }

    } catch (error) {
        console.error('❌ Error generando recibo de abono:', error);
        utils.hideLoading();
        utils.showNotification('Error al generar recibo de abono', 'error');
    }
}

function sharePaymentWhatsApp(paymentId, receiptId) {
    try {
        if (!paymentManager || !receiptDB) {
            utils.showNotification('Sistema no disponible', 'error');
            return;
        }

        const payment = paymentManager.payments.find(p => p.id === paymentId);
        const receipt = receiptDB.getReceiptById(receiptId);
        
        if (!payment || !receipt) {
            utils.showNotification('Datos no encontrados', 'error');
            return;
        }

        // Obtener todos los pagos para calcular progreso
        const allPayments = paymentManager.getPaymentsForReceipt(receiptId);
        const paymentIndex = allPayments.findIndex(p => p.id === paymentId) + 1;
        const totalPaid = paymentManager.getTotalPaidForReceipt(receiptId);
        const totalAmount = receipt.subtotal || receipt.price;
        const balance = totalAmount - totalPaid;
        const progressPercentage = Math.round((totalPaid / totalAmount) * 100);
        const paymentReceiptNumber = `${receipt.receiptNumber}-A${paymentIndex}`;

        let message = `*RECIBO DE ABONO #${paymentIndex}* ✅\n\n`;
        message += `*Número:* ${paymentReceiptNumber}\n`;
        message += `*Cliente:* ${receipt.clientName}\n`;
        message += `*Teléfono:* ${receipt.clientPhone}\n`;
        message += `*Producto:* ${utils.capitalize(receipt.pieceType)} ${receipt.material.replace('-', ' ').toUpperCase()}\n\n`;
        
        message += `*ABONO RECIBIDO:*\n`;
        message += `💰 Monto: ${utils.formatCurrency(payment.amount)}\n`;
        message += `📅 Fecha: ${utils.formatDate(payment.date)}\n`;
        message += `💳 Método: ${utils.capitalize(payment.method)}\n`;
        
        if (payment.reference) {
            message += `🔗 Referencia: ${payment.reference}\n`;
        }
        
        message += `\n*ESTADO DE PAGOS:*\n`;
        message += `📊 Total del producto: ${utils.formatCurrency(totalAmount)}\n`;
        message += `✅ Total pagado: ${utils.formatCurrency(totalPaid)} (${progressPercentage}%)\n`;
        message += `💸 Saldo pendiente: ${utils.formatCurrency(balance)}\n`;
        message += `📈 Progreso: ${paymentIndex} de ${allPayments.length} abonos\n\n`;
        
        if (balance > 0) {
            message += `*Próximo abono sugerido:* ${utils.formatCurrency(Math.min(balance, payment.amount))}\n\n`;
        } else {
            message += `🎉 *¡PRODUCTO TOTALMENTE PAGADO!*\n`;
            message += `Ya puede pasar a recoger su producto.\n\n`;
        }
        
        message += `¡Gracias por su abono!\n*ciaociao.mx* ✨\n`;
        message += `Tel: +52 1 55 9211 2643`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = receipt.clientPhone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        utils.showNotification('Mensaje de WhatsApp preparado', 'success');

    } catch (error) {
        console.error('❌ Error compartiendo abono por WhatsApp:', error);
        utils.showNotification('Error al preparar mensaje de WhatsApp', 'error');
    }
}

// ==================== FUNCIONES GLOBALES ====================

// Hacer funciones disponibles globalmente para eventos onclick
window.viewReceiptDetails = viewReceiptDetails;
window.processPayment = processPayment;
window.showAddPaymentForm = showAddPaymentForm;
window.hidePaymentForm = hidePaymentForm;
window.generatePaymentReceipt = generatePaymentReceipt;
window.sharePaymentWhatsApp = sharePaymentWhatsApp;
window.openPaymentModal = openPaymentModal;

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