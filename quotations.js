// quotations.js - Sistema completo de cotizaciones

// Variables globales
let quotationProducts = [];
let editingProductIndex = -1;
let quotationDB;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeQuotationSystem();
});

function initializeQuotationSystem() {
    try {
        console.log('🚀 Iniciando sistema de cotizaciones...');
        
        // Configurar formulario básico primero
        setCurrentQuotationDate();
        generateQuotationNumber();
        
        // Inicializar base de datos (con verificación)
        try {
            if (typeof QuotationDatabase !== 'undefined') {
                quotationDB = new QuotationDatabase();
                window.quotationDB = quotationDB;
                console.log('✅ Base de datos de cotizaciones inicializada');
            } else {
                console.warn('⚠️ QuotationDatabase no disponible, usando funciones básicas');
            }
        } catch (dbError) {
            console.error('❌ Error inicializando base de datos:', dbError);
        }
        
        // Configurar event listeners
        setupQuotationEventListeners();
        
        // Cargar clientes para autocompletado
        setupClientAutoComplete();
        
        console.log('✅ Sistema de cotizaciones inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema de cotizaciones:', error);
    }
}

function setCurrentQuotationDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quotationDate').value = today;
}

function generateQuotationNumber() {
    try {
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Obtener contador del día actual para cotizaciones
        const dayKey = `quotation_${year}${month}${day}`;
        const dailyCounter = parseInt(localStorage.getItem(`counter_${dayKey}`) || '1');
        
        const number = String(dailyCounter).padStart(3, '0');
        const quotationNumber = `COTIZ-${year}${month}${day}-${number}`;
        
        // Verificar que el elemento existe antes de asignar valor
        const quotationNumberElement = document.getElementById('quotationNumber');
        if (quotationNumberElement) {
            quotationNumberElement.value = quotationNumber;
            console.log('✅ Número de cotización generado:', quotationNumber);
        } else {
            console.error('❌ Elemento quotationNumber no encontrado');
        }
        
        // Guardar contador actualizado
        localStorage.setItem(`counter_${dayKey}`, (dailyCounter + 1).toString());
        
        return quotationNumber;
    } catch (error) {
        console.error('❌ Error generando número de cotización:', error);
        return null;
    }
}

function setupQuotationEventListeners() {
    try {
        // Botones principales (con verificación de existencia)
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', showAddProductModal);
            console.log('✅ Event listener para addProductBtn configurado');
        } else {
            console.error('❌ Elemento addProductBtn no encontrado');
        }
        
        const previewBtn = document.getElementById('previewQuotationBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', showQuotationPreview);
        }
        
        const generatePdfBtn = document.getElementById('generateQuotationPdfBtn');
        if (generatePdfBtn) {
            generatePdfBtn.addEventListener('click', generateQuotationPDF);
        }
        
        const shareWhatsappBtn = document.getElementById('shareQuotationWhatsappBtn');
        if (shareWhatsappBtn) {
            shareWhatsappBtn.addEventListener('click', shareQuotationWhatsApp);
        }
        
        const historyBtn = document.getElementById('quotationHistoryBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', showQuotationHistory);
        }
        
        const convertBtn = document.getElementById('convertToReceiptBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', convertToReceipt);
        }
        
        const resetBtn = document.getElementById('resetQuotationBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetQuotationForm);
        }
        
        // Modal de producto (con verificación)
        const addProductModalClose = document.querySelector('#addProductModal .close');
        if (addProductModalClose) {
            addProductModalClose.addEventListener('click', () => closeModal('addProductModal'));
        }
        
        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', saveProduct);
            console.log('✅ Event listener para saveProductBtn configurado');
        }
        
        const cancelProductBtn = document.getElementById('cancelProductBtn');
        if (cancelProductBtn) {
            cancelProductBtn.addEventListener('click', () => closeModal('addProductModal'));
        }
        
        // Modal de vista previa (con verificación)
        const previewModalClose = document.querySelector('#quotationPreviewModal .close');
        if (previewModalClose) {
            previewModalClose.addEventListener('click', () => closeModal('quotationPreviewModal'));
        }
        
        const closePreviewBtn = document.getElementById('closeQuotationPreview');
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => closeModal('quotationPreviewModal'));
        }
        
        const confirmPdfBtn = document.getElementById('confirmGenerateQuotationPdf');
        if (confirmPdfBtn) {
            confirmPdfBtn.addEventListener('click', function() {
                closeModal('quotationPreviewModal');
                generateQuotationPDF();
            });
        }
        
        // Modal de historial (con verificación)
        const historyModalClose = document.querySelector('#quotationHistoryModal .close');
        if (historyModalClose) {
            historyModalClose.addEventListener('click', () => closeModal('quotationHistoryModal'));
        }
        
        const closeHistoryBtn = document.getElementById('closeQuotationHistory');
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', () => closeModal('quotationHistoryModal'));
        }
        
        const historySearch = document.getElementById('quotationHistorySearch');
        if (historySearch) {
            historySearch.addEventListener('input', searchQuotationHistory);
        }
        
        const statusFilter = document.getElementById('quotationStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', filterQuotationHistory);
        }
        
        const exportBtn = document.getElementById('exportQuotationsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportQuotations);
        }
        
        // Cálculo automático (con verificación)
        const globalDiscountInput = document.getElementById('globalDiscount');
        if (globalDiscountInput) {
            globalDiscountInput.addEventListener('input', calculateQuotationTotals);
        }
        
        // Autocompletado de clientes (con verificación)
        const clientNameInput = document.getElementById('clientNameQuote');
        if (clientNameInput) {
            clientNameInput.addEventListener('input', handleClientQuoteInput);
        }
        
        const clientPhoneInput = document.getElementById('clientPhoneQuote');
        if (clientPhoneInput) {
            clientPhoneInput.addEventListener('input', handleClientQuoteInput);
        }
        
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

// Gestión de Productos
function showAddProductModal() {
    try {
        console.log('🔄 Abriendo modal de agregar producto...');
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'block';
            clearProductForm();
            console.log('✅ Modal de producto abierto');
        } else {
            console.error('❌ Modal addProductModal no encontrado');
            alert('Error: No se pudo abrir el modal de productos');
        }
    } catch (error) {
        console.error('❌ Error abriendo modal de producto:', error);
        alert('Error al abrir el modal de productos');
    }
}

function clearProductForm() {
    try {
        const fields = [
            { id: 'productType', value: '' },
            { id: 'productMaterial', value: '' },
            { id: 'productDescription', value: '' },
            { id: 'productSKU', value: '' },
            { id: 'productQuantity', value: '1' },
            { id: 'productPrice', value: '' },
            { id: 'productDiscount', value: '0' }
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.value = field.value;
            } else {
                console.warn(`⚠️ Campo ${field.id} no encontrado en el formulario`);
            }
        });
        
        editingProductIndex = -1;
        console.log('✅ Formulario de producto limpiado');
    } catch (error) {
        console.error('❌ Error limpiando formulario de producto:', error);
    }
}

function saveProduct() {
    try {
        console.log('🔄 Guardando producto...');
        
        // Validar campos requeridos con verificación de existencia
        const typeElement = document.getElementById('productType');
        const materialElement = document.getElementById('productMaterial');
        const descriptionElement = document.getElementById('productDescription');
        const quantityElement = document.getElementById('productQuantity');
        const priceElement = document.getElementById('productPrice');
        const discountElement = document.getElementById('productDiscount');
        const skuElement = document.getElementById('productSKU');
        
        if (!typeElement || !materialElement || !descriptionElement || !quantityElement || !priceElement) {
            console.error('❌ Elementos del formulario no encontrados');
            alert('Error: Formulario de producto no disponible');
            return;
        }
        
        const type = typeElement.value;
        const material = materialElement.value;
        const description = descriptionElement.value;
        const quantity = parseInt(quantityElement.value) || 1;
        const price = parseFloat(priceElement.value) || 0;
        const discount = parseFloat(discountElement ? discountElement.value : '0') || 0;
        const sku = skuElement ? skuElement.value : '';
        
        // Validar datos
        if (!type || !material || !description || price <= 0) {
            alert('Por favor complete todos los campos requeridos (Tipo, Material, Descripción y Precio)');
            return;
        }
        
        // Crear objeto producto
        const product = {
            type,
            material,
            description,
            sku: sku || '',
            quantity,
            price,
            discount,
            subtotal: quantity * price,
            discountAmount: (quantity * price * discount) / 100,
            total: (quantity * price) - ((quantity * price * discount) / 100)
        };
        
        console.log('✅ Producto creado:', product);
        
        // Agregar o actualizar producto
        if (editingProductIndex >= 0) {
            quotationProducts[editingProductIndex] = product;
            console.log('✅ Producto actualizado en índice:', editingProductIndex);
        } else {
            quotationProducts.push(product);
            console.log('✅ Nuevo producto agregado. Total productos:', quotationProducts.length);
        }
        
        // Actualizar interfaz
        renderProductsList();
        calculateQuotationTotals();
        closeModal('addProductModal');
        showNotification(editingProductIndex >= 0 ? 'Producto actualizado' : 'Producto agregado', 'success');
        
        console.log('✅ Producto guardado exitosamente');
        
    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        alert('Error al guardar el producto: ' + error.message);
    }
}

function renderProductsList() {
    try {
        const productsList = document.getElementById('productsList');
        
        if (!productsList) {
            console.error('❌ Elemento productsList no encontrado');
            return;
        }
        
        console.log('🔄 Renderizando lista de productos. Total:', quotationProducts.length);
        
        if (quotationProducts.length === 0) {
            productsList.innerHTML = '<p class="no-products">No hay productos agregados. Haz clic en "➕ Agregar Producto" para comenzar.</p>';
            console.log('ℹ️ Lista de productos vacía mostrada');
            return;
        }
    
    let html = '<div class="products-table">';
    html += '<table class="product-list-table">';
    html += `
        <thead>
            <tr>
                <th>#</th>
                <th>Descripción</th>
                <th>SKU</th>
                <th>Cant.</th>
                <th>P. Unit.</th>
                <th>Desc.</th>
                <th>Total</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    quotationProducts.forEach((product, index) => {
        const materialLabel = getMaterialLabel(product.material);
        const typeLabel = getTypeLabel(product.type);
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${typeLabel} ${materialLabel}</strong><br>
                    <small>${product.description}</small>
                </td>
                <td>${product.sku || '-'}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.discount}%</td>
                <td><strong>${formatCurrency(product.total)}</strong></td>
                <td class="product-actions">
                    <button onclick="editProduct(${index})" class="btn-edit-product">✏️</button>
                    <button onclick="removeProduct(${index})" class="btn-remove-product">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    productsList.innerHTML = html;
    
    console.log('✅ Lista de productos renderizada exitosamente');
    
    } catch (error) {
        console.error('❌ Error renderizando lista de productos:', error);
    }
}

function editProduct(index) {
    const product = quotationProducts[index];
    
    document.getElementById('productType').value = product.type;
    document.getElementById('productMaterial').value = product.material;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productSKU').value = product.sku || '';
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDiscount').value = product.discount;
    
    editingProductIndex = index;
    document.getElementById('addProductModal').style.display = 'block';
}

function removeProduct(index) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        quotationProducts.splice(index, 1);
        renderProductsList();
        calculateQuotationTotals();
        showNotification('Producto eliminado', 'info');
    }
}

// Cálculos
function calculateQuotationTotals() {
    let subtotal = 0;
    
    quotationProducts.forEach(product => {
        subtotal += product.subtotal;
    });
    
    const globalDiscount = parseFloat(document.getElementById('globalDiscount').value) || 0;
    const discountAmount = (subtotal * globalDiscount) / 100;
    const total = subtotal - discountAmount;
    
    document.getElementById('quotationSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('discountAmount').textContent = '-' + formatCurrency(discountAmount);
    document.getElementById('quotationTotal').textContent = formatCurrency(total);
}

// Vista Previa y PDF
function showQuotationPreview() {
    if (!validateQuotationForm()) {
        return;
    }
    
    const previewHTML = generateQuotationHTML();
    document.getElementById('quotationPreview').innerHTML = previewHTML;
    document.getElementById('quotationPreviewModal').style.display = 'block';
}

function validateQuotationForm() {
    const clientName = document.getElementById('clientNameQuote').value;
    const clientPhone = document.getElementById('clientPhoneQuote').value;
    
    if (!clientName || !clientPhone) {
        alert('Por favor complete los datos del cliente');
        return false;
    }
    
    if (quotationProducts.length === 0) {
        alert('Por favor agregue al menos un producto');
        return false;
    }
    
    return true;
}

function generateQuotationHTML() {
    const formData = collectQuotationFormData();
    const validUntil = calculateValidityDate(formData.validity);
    
    let html = `
        <div class="quotation-document">
            <div class="document-header">
                <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" alt="ciaociao.mx" class="document-logo">
                <h2>COTIZACIÓN</h2>
                <p class="watermark-text">NO VÁLIDO COMO RECIBO</p>
            </div>
            
            <div class="document-info">
                <div class="info-section">
                    <h3>Información de la Cotización</h3>
                    <dl>
                        <dt>Número:</dt>
                        <dd>${formData.quotationNumber}</dd>
                        <dt>Fecha:</dt>
                        <dd>${formatDate(formData.quotationDate)}</dd>
                        <dt>Válida hasta:</dt>
                        <dd>${formatDate(validUntil)}</dd>
                    </dl>
                </div>
                
                <div class="info-section">
                    <h3>Datos del Cliente</h3>
                    <dl>
                        <dt>Nombre:</dt>
                        <dd>${formData.clientName}</dd>
                        <dt>Teléfono:</dt>
                        <dd>${formData.clientPhone}</dd>
                        ${formData.clientEmail ? `
                            <dt>Email:</dt>
                            <dd>${formData.clientEmail}</dd>
                        ` : ''}
                    </dl>
                </div>
            </div>
            
            <div class="products-section">
                <h3>Productos Cotizados</h3>
                <table class="quotation-products-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Descripción</th>
                            <th>Cant.</th>
                            <th>P. Unit.</th>
                            <th>Desc.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    quotationProducts.forEach((product, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${getTypeLabel(product.type)} ${getMaterialLabel(product.material)}</strong><br>
                    ${product.description}
                    ${product.sku ? `<br><small>SKU: ${product.sku}</small>` : ''}
                </td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.discount}%</td>
                <td>${formatCurrency(product.total)}</td>
            </tr>
        `;
    });
    
    const subtotal = quotationProducts.reduce((sum, p) => sum + p.subtotal, 0);
    const globalDiscount = parseFloat(document.getElementById('globalDiscount').value) || 0;
    const discountAmount = (subtotal * globalDiscount) / 100;
    const total = subtotal - discountAmount;
    
    html += `
                    </tbody>
                </table>
                
                <div class="quotation-totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(subtotal)}</span>
                    </div>
                    ${globalDiscount > 0 ? `
                        <div class="total-row">
                            <span>Descuento (${globalDiscount}%):</span>
                            <span>-${formatCurrency(discountAmount)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row total">
                        <span>TOTAL:</span>
                        <span>${formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
            
            ${formData.terms ? `
                <div class="terms-section">
                    <h3>Términos y Condiciones</h3>
                    <p>${formData.terms.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${formData.observations ? `
                <div class="observations-section">
                    <h3>Observaciones</h3>
                    <p>${formData.observations}</p>
                </div>
            ` : ''}
            
            <div class="document-footer">
                <p>ciaociao.mx • Tel: +52 1 55 9211 2643</p>
                <p>Esta cotización es válida por ${formData.validity} días a partir de la fecha de emisión</p>
            </div>
        </div>
    `;
    
    return html;
}

function collectQuotationFormData() {
    return {
        quotationNumber: document.getElementById('quotationNumber').value,
        quotationDate: document.getElementById('quotationDate').value,
        validity: document.getElementById('validity').value,
        clientName: document.getElementById('clientNameQuote').value,
        clientPhone: document.getElementById('clientPhoneQuote').value,
        clientEmail: document.getElementById('clientEmailQuote').value,
        terms: document.getElementById('terms').value,
        observations: document.getElementById('quotationObservations').value,
        products: quotationProducts,
        globalDiscount: document.getElementById('globalDiscount').value
    };
}

async function generateQuotationPDF() {
    if (!validateQuotationForm()) {
        return;
    }
    
    try {
        showNotification('Generando PDF de cotización...', 'info');
        
        const formData = collectQuotationFormData();
        const { jsPDF } = window.jspdf;
        
        // Crear contenedor temporal para el HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = generateQuotationHTML();
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm';
        document.body.appendChild(tempContainer);
        
        // Generar canvas con html2canvas
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // Crear PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Guardar PDF
        const fileName = `Cotizacion_${formData.quotationNumber}_${formData.clientName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        // Limpiar
        document.body.removeChild(tempContainer);
        
        // Guardar en base de datos
        saveQuotation();
        
        showNotification('PDF de cotización generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
}

function saveQuotation() {
    try {
        const formData = collectQuotationFormData();
        const subtotal = quotationProducts.reduce((sum, p) => sum + p.subtotal, 0);
        const globalDiscount = parseFloat(document.getElementById('globalDiscount').value) || 0;
        const discountAmount = (subtotal * globalDiscount) / 100;
        const total = subtotal - discountAmount;
        
        const quotation = {
            ...formData,
            subtotal,
            discountAmount,
            total,
            status: 'pending',
            createdAt: new Date().toISOString(),
            convertedToReceipt: null
        };
        
        quotationDB.saveQuotation(quotation);
        
    } catch (error) {
        console.error('❌ Error guardando cotización:', error);
    }
}

// WhatsApp
function shareQuotationWhatsApp() {
    if (!validateQuotationForm()) {
        return;
    }
    
    const formData = collectQuotationFormData();
    const validUntil = calculateValidityDate(formData.validity);
    const subtotal = quotationProducts.reduce((sum, p) => sum + p.subtotal, 0);
    const globalDiscount = parseFloat(document.getElementById('globalDiscount').value) || 0;
    const discountAmount = (subtotal * globalDiscount) / 100;
    const total = subtotal - discountAmount;
    
    let message = `💎 *COTIZACIÓN - ciaociao.mx*\n`;
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `*N°* ${formData.quotationNumber}\n\n`;
    
    message += `*CLIENTE:*\n`;
    message += `${formData.clientName}\n`;
    message += `Tel: ${formData.clientPhone}\n\n`;
    
    message += `*PRODUCTOS:*\n`;
    quotationProducts.forEach((product, index) => {
        message += `${index + 1}. ${getTypeLabel(product.type)} ${getMaterialLabel(product.material)}\n`;
        message += `   ${product.description}\n`;
        message += `   Cant: ${product.quantity} • ${formatCurrency(product.total)}\n`;
    });
    
    message += `\n*RESUMEN:*\n`;
    message += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (globalDiscount > 0) {
        message += `Descuento: -${formatCurrency(discountAmount)}\n`;
    }
    message += `*TOTAL: ${formatCurrency(total)}*\n\n`;
    
    message += `✓ Válida hasta: ${formatDate(validUntil)}\n`;
    message += `✓ Precios en MXN\n`;
    message += `✓ ${formData.validity} días de validez\n\n`;
    
    message += `📞 *ciaociao.mx*\n`;
    message += `Tel: +52 1 55 9211 2643\n`;
    
    const whatsappUrl = `https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    saveQuotation();
    showNotification('Abriendo WhatsApp...', 'success');
}

// Conversión a Recibo
function convertToReceipt() {
    if (!validateQuotationForm()) {
        return;
    }
    
    if (!confirm('¿Desea convertir esta cotización en un recibo?')) {
        return;
    }
    
    const formData = collectQuotationFormData();
    
    // Guardar datos para transferir al modo de recibos
    const conversionData = {
        fromQuotation: true,
        quotationNumber: formData.quotationNumber,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        products: quotationProducts,
        total: calculateQuotationTotal()
    };
    
    localStorage.setItem('quotationConversion', JSON.stringify(conversionData));
    
    // Marcar cotización como aceptada
    const quotations = JSON.parse(localStorage.getItem('quotations_ciaociao') || '[]');
    const quotationIndex = quotations.findIndex(q => q.quotationNumber === formData.quotationNumber);
    if (quotationIndex >= 0) {
        quotations[quotationIndex].status = 'accepted';
        quotations[quotationIndex].convertedAt = new Date().toISOString();
        localStorage.setItem('quotations_ciaociao', JSON.stringify(quotations));
    }
    
    // Navegar al modo de recibos
    window.location.href = 'receipt-mode.html';
}

function calculateQuotationTotal() {
    const subtotal = quotationProducts.reduce((sum, p) => sum + p.subtotal, 0);
    const globalDiscount = parseFloat(document.getElementById('globalDiscount').value) || 0;
    const discountAmount = (subtotal * globalDiscount) / 100;
    return subtotal - discountAmount;
}

// Historial
function showQuotationHistory() {
    loadQuotationHistory();
    document.getElementById('quotationHistoryModal').style.display = 'block';
}

function loadQuotationHistory() {
    const quotations = quotationDB.getAllQuotations();
    renderQuotationHistory(quotations);
}

function renderQuotationHistory(quotations) {
    const historyList = document.getElementById('quotationHistoryList');
    
    if (quotations.length === 0) {
        historyList.innerHTML = '<p class="no-history">No hay cotizaciones guardadas</p>';
        return;
    }
    
    let html = '<div class="history-items">';
    
    quotations.reverse().forEach(quotation => {
        const statusClass = `status-${quotation.status || 'pending'}`;
        const statusLabel = getStatusLabel(quotation.status || 'pending');
        
        html += `
            <div class="history-item ${statusClass}">
                <div class="history-item-header">
                    <h4>${quotation.quotationNumber}</h4>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="history-item-body">
                    <p><strong>${quotation.clientName}</strong> - ${quotation.clientPhone}</p>
                    <p>${formatDate(quotation.quotationDate)} • ${quotation.products.length} productos</p>
                    <p>Total: ${formatCurrency(quotation.total)}</p>
                </div>
                <div class="history-item-actions">
                    <button onclick="loadQuotation('${quotation.quotationNumber}')" class="btn-mini">👁️ Ver</button>
                    ${quotation.status === 'pending' ? `
                        <button onclick="markQuotationAccepted('${quotation.quotationNumber}')" class="btn-mini btn-success">✅ Aceptada</button>
                        <button onclick="markQuotationRejected('${quotation.quotationNumber}')" class="btn-mini btn-danger">❌ Rechazada</button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    historyList.innerHTML = html;
}

function searchQuotationHistory() {
    const searchTerm = document.getElementById('quotationHistorySearch').value.toLowerCase();
    const quotations = quotationDB.searchQuotations(searchTerm);
    renderQuotationHistory(quotations);
}

function filterQuotationHistory() {
    const status = document.getElementById('quotationStatusFilter').value;
    let quotations = quotationDB.getAllQuotations();
    
    if (status) {
        quotations = quotations.filter(q => q.status === status);
    }
    
    renderQuotationHistory(quotations);
}

function exportQuotations() {
    if (quotationDB) {
        quotationDB.exportToExcel();
        showNotification('Cotizaciones exportadas', 'success');
    }
}

// Utilidades
function calculateValidityDate(days) {
    const date = new Date(document.getElementById('quotationDate').value);
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString().split('T')[0];
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-MX', options);
}

function getMaterialLabel(material) {
    const materials = {
        'oro-10k': 'Oro 10k',
        'oro-14k': 'Oro 14k',
        'oro-18k': 'Oro 18k',
        'oro-24k': 'Oro 24k',
        'plata-925': 'Plata .925',
        'platino': 'Platino',
        'oro-blanco': 'Oro Blanco',
        'acero': 'Acero Inoxidable',
        'otro': 'Otro'
    };
    return materials[material] || material;
}

function getTypeLabel(type) {
    const types = {
        'anillo': 'Anillo',
        'collar': 'Collar',
        'pulsera': 'Pulsera',
        'aretes': 'Aretes',
        'reloj': 'Reloj',
        'dije': 'Dije',
        'brazalete': 'Brazalete',
        'broche': 'Broche',
        'otro': 'Otro'
    };
    return types[type] || type;
}

function getStatusLabel(status) {
    const statuses = {
        'pending': 'Pendiente',
        'accepted': 'Aceptada',
        'rejected': 'Rechazada',
        'expired': 'Vencida'
    };
    return statuses[status] || status;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNotification(message, type = 'info') {
    if (window.utils && window.utils.showNotification) {
        window.utils.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

function resetQuotationForm() {
    if (confirm('¿Está seguro de limpiar el formulario?')) {
        document.getElementById('quotationForm').reset();
        quotationProducts = [];
        renderProductsList();
        calculateQuotationTotals();
        setCurrentQuotationDate();
        generateQuotationNumber();
        showNotification('Formulario limpiado', 'info');
    }
}

// Base de datos de cotizaciones
class QuotationDatabase {
    constructor() {
        this.storageKey = 'quotations_ciaociao';
        this.init();
    }
    
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }
    
    saveQuotation(quotation) {
        try {
            const quotations = this.getAllQuotations();
            
            // Verificar si ya existe
            const existingIndex = quotations.findIndex(q => q.quotationNumber === quotation.quotationNumber);
            
            if (existingIndex >= 0) {
                quotations[existingIndex] = quotation;
            } else {
                quotations.push(quotation);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(quotations));
            return true;
        } catch (error) {
            console.error('Error guardando cotización:', error);
            return false;
        }
    }
    
    getAllQuotations() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }
    
    getQuotation(quotationNumber) {
        const quotations = this.getAllQuotations();
        return quotations.find(q => q.quotationNumber === quotationNumber);
    }
    
    searchQuotations(searchTerm) {
        const quotations = this.getAllQuotations();
        return quotations.filter(q => 
            q.clientName.toLowerCase().includes(searchTerm) ||
            q.clientPhone.includes(searchTerm) ||
            q.quotationNumber.toLowerCase().includes(searchTerm)
        );
    }
    
    updateQuotationStatus(quotationNumber, status) {
        const quotations = this.getAllQuotations();
        const index = quotations.findIndex(q => q.quotationNumber === quotationNumber);
        
        if (index >= 0) {
            quotations[index].status = status;
            quotations[index].updatedAt = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(quotations));
            return true;
        }
        
        return false;
    }
    
    exportToExcel() {
        const quotations = this.getAllQuotations();
        
        // Crear CSV
        let csv = 'Número,Fecha,Cliente,Teléfono,Productos,Subtotal,Descuento,Total,Estado,Validez\n';
        
        quotations.forEach(q => {
            const productsCount = q.products ? q.products.length : 0;
            csv += `"${q.quotationNumber}","${q.quotationDate}","${q.clientName}","${q.clientPhone}",`;
            csv += `"${productsCount} productos","${q.subtotal}","${q.discountAmount}","${q.total}",`;
            csv += `"${q.status}","${q.validity} días"\n`;
        });
        
        // Descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Cotizaciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Funciones globales para onclick
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.loadQuotation = function(quotationNumber) {
    const quotation = quotationDB.getQuotation(quotationNumber);
    if (quotation) {
        // Cargar datos en el formulario
        document.getElementById('quotationNumber').value = quotation.quotationNumber;
        document.getElementById('quotationDate').value = quotation.quotationDate;
        document.getElementById('validity').value = quotation.validity;
        document.getElementById('clientNameQuote').value = quotation.clientName;
        document.getElementById('clientPhoneQuote').value = quotation.clientPhone;
        document.getElementById('clientEmailQuote').value = quotation.clientEmail || '';
        document.getElementById('terms').value = quotation.terms || '';
        document.getElementById('quotationObservations').value = quotation.observations || '';
        document.getElementById('globalDiscount').value = quotation.globalDiscount || 0;
        
        quotationProducts = quotation.products || [];
        renderProductsList();
        calculateQuotationTotals();
        
        closeModal('quotationHistoryModal');
        showNotification('Cotización cargada', 'success');
    }
};

window.markQuotationAccepted = function(quotationNumber) {
    quotationDB.updateQuotationStatus(quotationNumber, 'accepted');
    loadQuotationHistory();
    showNotification('Cotización marcada como aceptada', 'success');
};

window.markQuotationRejected = function(quotationNumber) {
    quotationDB.updateQuotationStatus(quotationNumber, 'rejected');
    loadQuotationHistory();
    showNotification('Cotización marcada como rechazada', 'info');
};

// Autocompletado de clientes
function setupClientAutoComplete() {
    try {
        const clients = getUniqueClients();
        
        // Crear datalist para autocompletado
        const datalistName = document.createElement('datalist');
        datalistName.id = 'clientNamesQuote';
        
        const datalistPhone = document.createElement('datalist');
        datalistPhone.id = 'clientPhonesQuote';
        
        clients.forEach(client => {
            const optionName = document.createElement('option');
            optionName.value = client.name;
            datalistName.appendChild(optionName);
            
            const optionPhone = document.createElement('option');
            optionPhone.value = client.phone;
            datalistPhone.appendChild(optionPhone);
        });
        
        document.body.appendChild(datalistName);
        document.body.appendChild(datalistPhone);
        
        document.getElementById('clientNameQuote').setAttribute('list', 'clientNamesQuote');
        document.getElementById('clientPhoneQuote').setAttribute('list', 'clientPhonesQuote');
        
    } catch (error) {
        console.error('Error configurando autocompletado:', error);
    }
}

function getUniqueClients() {
    const receipts = JSON.parse(localStorage.getItem('receipts_ciaociao') || '[]');
    const quotations = JSON.parse(localStorage.getItem('quotations_ciaociao') || '[]');
    
    const clientsMap = new Map();
    
    // De recibos
    receipts.forEach(r => {
        if (r.clientName && r.clientPhone) {
            clientsMap.set(r.clientPhone, {
                name: r.clientName,
                phone: r.clientPhone,
                email: r.clientEmail
            });
        }
    });
    
    // De cotizaciones
    quotations.forEach(q => {
        if (q.clientName && q.clientPhone) {
            clientsMap.set(q.clientPhone, {
                name: q.clientName,
                phone: q.clientPhone,
                email: q.clientEmail
            });
        }
    });
    
    return Array.from(clientsMap.values());
}

function handleClientQuoteInput(event) {
    const inputId = event.target.id;
    const value = event.target.value;
    
    if (inputId === 'clientNameQuote') {
        // Buscar por nombre y autocompletar teléfono
        const clients = getUniqueClients();
        const client = clients.find(c => c.name === value);
        if (client) {
            document.getElementById('clientPhoneQuote').value = client.phone;
            document.getElementById('clientEmailQuote').value = client.email || '';
        }
    } else if (inputId === 'clientPhoneQuote') {
        // Buscar por teléfono y autocompletar nombre
        const clients = getUniqueClients();
        const client = clients.find(c => c.phone === value);
        if (client) {
            document.getElementById('clientNameQuote').value = client.name;
            document.getElementById('clientEmailQuote').value = client.email || '';
        }
    }
}