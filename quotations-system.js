// quotations-system.js - SISTEMA COMPLETO DE COTIZACIONES
// Simple, robusto y 100% funcional
// ===========================================

console.log('📄 Iniciando Sistema de Cotizaciones v2.0...');

// ===========================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ===========================================

const CONFIG = {
    storageKey: 'quotations_ciaociao',
    maxQuotations: 500,
    defaultValidityDays: 30,
    companyInfo: {
        name: 'ciaociao.mx',
        phone: '+52 1 55 9211 2643',
        email: 'info@ciaociao.mx',
        address: 'México',
        logo: 'https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png'
    }
};

// Variables globales del sistema
let quotationProducts = [];
let editingProductIndex = -1;
let currentQuotation = null;
let quotationsHistory = [];

// ===========================================
// INICIALIZACIÓN DEL SISTEMA
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Cargado - Inicializando sistema...');
    
    try {
        // Cargar historial desde localStorage
        loadQuotationsHistory();
        
        // Configurar fecha actual
        setCurrentDate();
        
        // Generar número de cotización
        generateQuotationNumber();
        
        // Configurar todos los event listeners
        setupEventListeners();
        
        // Configurar validez por defecto
        setupDefaultValues();
        
        console.log('✅ Sistema de cotizaciones inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error durante inicialización:', error);
        alert('Error al inicializar el sistema. Por favor recarga la página.');
    }
});

// ===========================================
// FUNCIONES DE INICIALIZACIÓN
// ===========================================

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateElement = document.getElementById('quotationDate');
    if (dateElement) {
        dateElement.value = today;
        console.log('📅 Fecha configurada:', today);
    }
}

function generateQuotationNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Obtener contador del día desde localStorage
    const dayKey = `quotation_counter_${year}${month}${day}`;
    let counter = parseInt(localStorage.getItem(dayKey) || '0') + 1;
    
    // Formato: COTIZ-20241213-001
    const quotationNumber = `COTIZ-${year}${month}${day}-${String(counter).padStart(3, '0')}`;
    
    // Asignar al campo
    const numberElement = document.getElementById('quotationNumber');
    if (numberElement) {
        numberElement.value = quotationNumber;
        // Guardar contador actualizado
        localStorage.setItem(dayKey, counter.toString());
        console.log('🔢 Número generado:', quotationNumber);
    }
    
    return quotationNumber;
}

function setupDefaultValues() {
    // Validez por defecto
    const validityElement = document.getElementById('validity');
    if (validityElement && !validityElement.value) {
        validityElement.value = CONFIG.defaultValidityDays;
    }
}

// ===========================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ===========================================

function setupEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Botón Agregar Producto
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductModal);
        console.log('✅ Botón agregar producto configurado');
    }
    
    // Modal de Producto - Botones
    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProduct);
    }
    
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', hideAddProductModal);
    }
    
    // Descuento Global
    const globalDiscount = document.getElementById('globalDiscount');
    if (globalDiscount) {
        globalDiscount.addEventListener('input', calculateTotals);
    }
    
    // Botones principales
    const previewBtn = document.getElementById('previewQuotationBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showQuotationPreview);
    }
    
    const generatePdfBtn = document.getElementById('generateQuotationPdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generateQuotationPDF);
    }
    
    const whatsappBtn = document.getElementById('shareQuotationWhatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', shareQuotationWhatsApp);
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
    
    // Cerrar modales con X
    const closeButtons = document.querySelectorAll('.modal .close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Cerrar modales clickeando fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    console.log('✅ Event listeners configurados correctamente');
}

// ===========================================
// GESTIÓN DE PRODUCTOS
// ===========================================

function showAddProductModal() {
    console.log('📦 Abriendo modal de producto...');
    const modal = document.getElementById('addProductModal');
    if (modal) {
        clearProductForm();
        modal.style.display = 'block';
    }
}

function hideAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function clearProductForm() {
    document.getElementById('productType').value = '';
    document.getElementById('productMaterial').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productSKU').value = '';
    document.getElementById('productQuantity').value = '1';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDiscount').value = '0';
    editingProductIndex = -1;
}

function saveProduct() {
    console.log('💾 Guardando producto...');
    
    // Obtener valores del formulario
    const type = document.getElementById('productType').value;
    const material = document.getElementById('productMaterial').value;
    const description = document.getElementById('productDescription').value;
    const sku = document.getElementById('productSKU').value;
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const discount = parseFloat(document.getElementById('productDiscount').value) || 0;
    
    // Validación
    if (!type || !material || !description || price <= 0) {
        alert('Por favor complete todos los campos requeridos correctamente');
        return;
    }
    
    // Calcular totales del producto
    const subtotal = quantity * price;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    
    // Crear objeto producto
    const product = {
        type,
        material,
        description,
        sku,
        quantity,
        price,
        discount,
        subtotal,
        discountAmount,
        total
    };
    
    // Agregar o actualizar producto
    if (editingProductIndex >= 0) {
        quotationProducts[editingProductIndex] = product;
        console.log('✅ Producto actualizado');
    } else {
        quotationProducts.push(product);
        console.log('✅ Producto agregado');
    }
    
    // Actualizar interfaz
    renderProductsList();
    calculateTotals();
    
    // Cerrar modal
    hideAddProductModal();
}

function renderProductsList() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    if (quotationProducts.length === 0) {
        productsList.innerHTML = `
            <p class="no-products">
                No hay productos agregados. 
                Haz clic en "➕ Agregar Producto" para comenzar.
            </p>
        `;
        return;
    }
    
    let html = `
        <div class="products-table">
            <table class="product-list-table">
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
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${product.type} ${product.material}</strong><br>
                    <small>${product.description}</small>
                </td>
                <td>${product.sku || '-'}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.discount}%</td>
                <td><strong>${formatCurrency(product.total)}</strong></td>
                <td>
                    <button onclick="editProduct(${index})" class="btn-edit-product">✏️</button>
                    <button onclick="removeProduct(${index})" class="btn-remove-product">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    productsList.innerHTML = html;
}

function editProduct(index) {
    const product = quotationProducts[index];
    if (!product) return;
    
    // Llenar formulario con datos del producto
    document.getElementById('productType').value = product.type;
    document.getElementById('productMaterial').value = product.material;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productSKU').value = product.sku || '';
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDiscount').value = product.discount;
    
    editingProductIndex = index;
    showAddProductModal();
}

function removeProduct(index) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        quotationProducts.splice(index, 1);
        renderProductsList();
        calculateTotals();
        console.log('🗑️ Producto eliminado');
    }
}

// ===========================================
// CÁLCULOS FINANCIEROS
// ===========================================

function calculateTotals() {
    let subtotal = 0;
    
    // Calcular subtotal sumando todos los productos
    quotationProducts.forEach(product => {
        subtotal += product.subtotal;
    });
    
    // Obtener descuento global
    const globalDiscountInput = document.getElementById('globalDiscount');
    const globalDiscount = parseFloat(globalDiscountInput?.value || 0);
    
    // Calcular descuento global
    const globalDiscountAmount = (subtotal * globalDiscount) / 100;
    
    // Calcular total final
    const total = subtotal - globalDiscountAmount;
    
    // Actualizar elementos en la interfaz
    updateTotalElements(subtotal, globalDiscountAmount, total);
}

function updateTotalElements(subtotal, discountAmount, total) {
    const subtotalElement = document.getElementById('quotationSubtotal');
    const discountElement = document.getElementById('discountAmount');
    const totalElement = document.getElementById('quotationTotal');
    
    if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(subtotal);
    }
    
    if (discountElement) {
        discountElement.textContent = '-' + formatCurrency(discountAmount);
    }
    
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

// ===========================================
// FUNCIONES DE VISTA PREVIA
// ===========================================

function showQuotationPreview() {
    console.log('👁️ Mostrando vista previa...');
    
    // Validar que hay datos
    if (quotationProducts.length === 0) {
        alert('Agregue al menos un producto antes de generar la vista previa');
        return;
    }
    
    // Recolectar datos del formulario
    const quotationData = collectQuotationData();
    
    // Generar HTML de vista previa
    const previewHTML = generateQuotationHTML(quotationData);
    
    // Mostrar en modal
    const modal = document.getElementById('quotationPreviewModal');
    const previewDiv = document.getElementById('quotationPreview');
    
    if (modal && previewDiv) {
        previewDiv.innerHTML = previewHTML;
        modal.style.display = 'block';
    }
}

function collectQuotationData() {
    const subtotal = quotationProducts.reduce((sum, p) => sum + p.subtotal, 0);
    const globalDiscount = parseFloat(document.getElementById('globalDiscount')?.value || 0);
    const globalDiscountAmount = (subtotal * globalDiscount) / 100;
    const total = subtotal - globalDiscountAmount;
    
    return {
        number: document.getElementById('quotationNumber')?.value || '',
        date: document.getElementById('quotationDate')?.value || '',
        validity: document.getElementById('validity')?.value || '30',
        clientName: document.getElementById('clientNameQuote')?.value || '',
        clientPhone: document.getElementById('clientPhoneQuote')?.value || '',
        clientEmail: document.getElementById('clientEmailQuote')?.value || '',
        products: quotationProducts,
        subtotal: subtotal,
        globalDiscount: globalDiscount,
        globalDiscountAmount: globalDiscountAmount,
        total: total,
        terms: document.getElementById('terms')?.value || '',
        observations: document.getElementById('quotationObservations')?.value || ''
    };
}

function generateQuotationHTML(data) {
    const validityDate = new Date(data.date);
    validityDate.setDate(validityDate.getDate() + parseInt(data.validity));
    
    let productsHTML = '';
    data.products.forEach((product, index) => {
        productsHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${product.type} ${product.material} - ${product.description}</td>
                <td>${product.sku || '-'}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.discount}%</td>
                <td>${formatCurrency(product.total)}</td>
            </tr>
        `;
    });
    
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="${CONFIG.companyInfo.logo}" alt="Logo" style="height: 60px; margin-bottom: 10px;">
                <h2 style="color: #007bff; margin: 10px 0;">COTIZACIÓN</h2>
                <p style="margin: 5px 0;">${CONFIG.companyInfo.name}</p>
                <p style="margin: 5px 0;">Tel: ${CONFIG.companyInfo.phone}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <table style="width: 100%;">
                    <tr>
                        <td><strong>Número:</strong> ${data.number}</td>
                        <td style="text-align: right;"><strong>Fecha:</strong> ${formatDate(data.date)}</td>
                    </tr>
                    <tr>
                        <td><strong>Cliente:</strong> ${data.clientName}</td>
                        <td style="text-align: right;"><strong>Válida hasta:</strong> ${formatDate(validityDate)}</td>
                    </tr>
                    <tr>
                        <td><strong>Teléfono:</strong> ${data.clientPhone}</td>
                        <td style="text-align: right;"><strong>Email:</strong> ${data.clientEmail || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #007bff; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">#</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">SKU</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Cant.</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">P. Unit.</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Desc.</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-bottom: 20px;">
                <p><strong>Subtotal:</strong> ${formatCurrency(data.subtotal)}</p>
                ${data.globalDiscount > 0 ? `<p><strong>Descuento (${data.globalDiscount}%):</strong> -${formatCurrency(data.globalDiscountAmount)}</p>` : ''}
                <p style="font-size: 1.2em; color: #007bff;"><strong>TOTAL:</strong> ${formatCurrency(data.total)}</p>
            </div>
            
            ${data.terms ? `
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa;">
                <h4>Términos y Condiciones:</h4>
                <p style="white-space: pre-wrap;">${data.terms}</p>
            </div>
            ` : ''}
            
            ${data.observations ? `
            <div style="margin-top: 20px;">
                <h4>Observaciones:</h4>
                <p>${data.observations}</p>
            </div>
            ` : ''}
        </div>
    `;
}

// ===========================================
// GENERACIÓN DE PDF
// ===========================================

async function generateQuotationPDF() {
    console.log('📄 Generando PDF...');
    
    // Validar datos
    if (quotationProducts.length === 0) {
        alert('Agregue al menos un producto antes de generar el PDF');
        return;
    }
    
    const quotationData = collectQuotationData();
    
    // Validar cliente
    if (!quotationData.clientName) {
        alert('Por favor ingrese el nombre del cliente');
        return;
    }
    
    try {
        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            alert('Error: La librería de PDF no está cargada. Por favor recarga la página.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar fuente y colores
        doc.setFontSize(20);
        doc.setTextColor(0, 123, 255);
        doc.text('COTIZACIÓN', 105, 20, { align: 'center' });
        
        // Información de la empresa
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(CONFIG.companyInfo.name, 105, 30, { align: 'center' });
        doc.text('Tel: ' + CONFIG.companyInfo.phone, 105, 36, { align: 'center' });
        
        // Línea separadora
        doc.setDrawColor(0, 123, 255);
        doc.line(20, 45, 190, 45);
        
        // Información de la cotización
        doc.setFontSize(10);
        doc.text(`Número: ${quotationData.number}`, 20, 55);
        doc.text(`Fecha: ${formatDate(quotationData.date)}`, 120, 55);
        
        doc.text(`Cliente: ${quotationData.clientName}`, 20, 62);
        doc.text(`Teléfono: ${quotationData.clientPhone}`, 120, 62);
        
        if (quotationData.clientEmail) {
            doc.text(`Email: ${quotationData.clientEmail}`, 20, 69);
        }
        
        const validityDate = new Date(quotationData.date);
        validityDate.setDate(validityDate.getDate() + parseInt(quotationData.validity));
        doc.text(`Válida hasta: ${formatDate(validityDate)}`, 120, 69);
        
        // Tabla de productos
        let yPosition = 85;
        
        // Encabezados de tabla
        doc.setFillColor(0, 123, 255);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, yPosition, 170, 8, 'F');
        
        doc.text('#', 25, yPosition + 6);
        doc.text('Descripción', 35, yPosition + 6);
        doc.text('Cant.', 120, yPosition + 6);
        doc.text('P. Unit.', 140, yPosition + 6);
        doc.text('Total', 170, yPosition + 6);
        
        // Productos
        doc.setTextColor(0, 0, 0);
        yPosition += 10;
        
        quotationData.products.forEach((product, index) => {
            doc.text(String(index + 1), 25, yPosition);
            
            // Descripción puede ser larga, la cortamos si es necesario
            const description = `${product.type} ${product.material} - ${product.description}`;
            const maxLength = 60;
            const shortDesc = description.length > maxLength 
                ? description.substring(0, maxLength) + '...' 
                : description;
            doc.text(shortDesc, 35, yPosition);
            
            doc.text(String(product.quantity), 120, yPosition);
            doc.text(formatCurrency(product.price), 140, yPosition);
            doc.text(formatCurrency(product.total), 170, yPosition);
            
            yPosition += 7;
            
            // Verificar si necesitamos nueva página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });
        
        // Línea antes de totales
        yPosition += 5;
        doc.line(120, yPosition, 190, yPosition);
        yPosition += 7;
        
        // Totales
        doc.text('Subtotal:', 140, yPosition);
        doc.text(formatCurrency(quotationData.subtotal), 170, yPosition);
        
        if (quotationData.globalDiscount > 0) {
            yPosition += 7;
            doc.text(`Descuento (${quotationData.globalDiscount}%):`, 140, yPosition);
            doc.text('-' + formatCurrency(quotationData.globalDiscountAmount), 170, yPosition);
        }
        
        yPosition += 7;
        doc.setFontSize(12);
        doc.setTextColor(0, 123, 255);
        doc.text('TOTAL:', 140, yPosition);
        doc.text(formatCurrency(quotationData.total), 170, yPosition);
        
        // Términos y condiciones
        if (quotationData.terms) {
            yPosition += 20;
            
            if (yPosition > 230) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('Términos y Condiciones:', 20, yPosition);
            yPosition += 7;
            
            // Dividir términos en líneas
            const lines = doc.splitTextToSize(quotationData.terms, 170);
            lines.forEach(line => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += 5;
            });
        }
        
        // Guardar PDF
        const fileName = `Cotizacion_${quotationData.number}_${quotationData.clientName.replace(/\s/g, '_')}.pdf`;
        doc.save(fileName);
        
        console.log('✅ PDF generado:', fileName);
        
        // Guardar cotización en historial
        saveQuotationToHistory(quotationData);
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
}

// ===========================================
// COMPARTIR POR WHATSAPP
// ===========================================

function shareQuotationWhatsApp() {
    console.log('📱 Compartiendo por WhatsApp...');
    
    if (quotationProducts.length === 0) {
        alert('Agregue al menos un producto antes de compartir');
        return;
    }
    
    const data = collectQuotationData();
    
    if (!data.clientPhone) {
        alert('Por favor ingrese el teléfono del cliente');
        return;
    }
    
    // Formatear mensaje
    let message = `💎 *COTIZACIÓN - ${CONFIG.companyInfo.name}*\n`;
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `📋 N° ${data.number}\n`;
    message += `📅 Fecha: ${formatDate(data.date)}\n`;
    message += `👤 Cliente: ${data.clientName}\n\n`;
    
    message += `*PRODUCTOS:*\n`;
    data.products.forEach((product, index) => {
        message += `${index + 1}. ${product.type} ${product.material}\n`;
        message += `   ${product.description}\n`;
        message += `   Cant: ${product.quantity} | Precio: ${formatCurrency(product.price)}\n`;
        if (product.discount > 0) {
            message += `   Desc: ${product.discount}%\n`;
        }
        message += `   Total: ${formatCurrency(product.total)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `Subtotal: ${formatCurrency(data.subtotal)}\n`;
    if (data.globalDiscount > 0) {
        message += `Descuento: -${formatCurrency(data.globalDiscountAmount)}\n`;
    }
    message += `*TOTAL: ${formatCurrency(data.total)}*\n\n`;
    
    const validityDate = new Date(data.date);
    validityDate.setDate(validityDate.getDate() + parseInt(data.validity));
    message += `✓ Válida hasta: ${formatDate(validityDate)}\n`;
    message += `📞 ${CONFIG.companyInfo.phone}\n`;
    
    // Limpiar número de teléfono
    let phoneNumber = data.clientPhone.replace(/\D/g, '');
    if (!phoneNumber.startsWith('52')) {
        phoneNumber = '52' + phoneNumber;
    }
    
    // Crear enlace de WhatsApp
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp
    window.open(whatsappURL, '_blank');
    
    console.log('✅ WhatsApp abierto con mensaje');
}

// ===========================================
// HISTORIAL Y PERSISTENCIA
// ===========================================

function loadQuotationsHistory() {
    try {
        const stored = localStorage.getItem(CONFIG.storageKey);
        if (stored) {
            quotationsHistory = JSON.parse(stored);
            console.log(`📚 Historial cargado: ${quotationsHistory.length} cotizaciones`);
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
        quotationsHistory = [];
    }
}

function saveQuotationToHistory(quotationData) {
    try {
        // Agregar timestamp y estado
        quotationData.timestamp = Date.now();
        quotationData.status = 'pending';
        
        // Agregar al historial
        quotationsHistory.unshift(quotationData);
        
        // Limitar cantidad de cotizaciones
        if (quotationsHistory.length > CONFIG.maxQuotations) {
            quotationsHistory = quotationsHistory.slice(0, CONFIG.maxQuotations);
        }
        
        // Guardar en localStorage
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(quotationsHistory));
        
        console.log('✅ Cotización guardada en historial');
        
    } catch (error) {
        console.error('Error guardando cotización:', error);
        alert('Advertencia: No se pudo guardar la cotización en el historial');
    }
}

function showQuotationHistory() {
    console.log('📚 Mostrando historial...');
    
    const modal = document.getElementById('quotationHistoryModal');
    const historyList = document.getElementById('quotationHistoryList');
    
    if (!modal || !historyList) return;
    
    if (quotationsHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; padding: 20px;">No hay cotizaciones en el historial</p>';
    } else {
        let html = '<div class="history-items">';
        
        quotationsHistory.forEach((quotation, index) => {
            const date = new Date(quotation.date);
            const statusClass = getStatusClass(quotation.status);
            const statusText = getStatusText(quotation.status);
            
            html += `
                <div class="history-item ${statusClass}">
                    <div class="history-item-header">
                        <strong>${quotation.number}</strong>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="history-item-body">
                        <p><strong>Cliente:</strong> ${quotation.clientName}</p>
                        <p><strong>Fecha:</strong> ${formatDate(date)}</p>
                        <p><strong>Total:</strong> ${formatCurrency(quotation.total)}</p>
                        <p><strong>Productos:</strong> ${quotation.products.length} items</p>
                    </div>
                    <div class="history-item-actions">
                        <button onclick="loadQuotation(${index})" class="btn-small">📂 Cargar</button>
                        <button onclick="deleteQuotation(${index})" class="btn-small btn-danger">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        historyList.innerHTML = html;
    }
    
    modal.style.display = 'block';
}

function loadQuotation(index) {
    const quotation = quotationsHistory[index];
    if (!quotation) return;
    
    if (confirm('¿Desea cargar esta cotización? Los datos actuales se perderán.')) {
        // Cargar datos en el formulario
        document.getElementById('quotationNumber').value = quotation.number;
        document.getElementById('quotationDate').value = quotation.date;
        document.getElementById('validity').value = quotation.validity;
        document.getElementById('clientNameQuote').value = quotation.clientName;
        document.getElementById('clientPhoneQuote').value = quotation.clientPhone;
        document.getElementById('clientEmailQuote').value = quotation.clientEmail || '';
        document.getElementById('terms').value = quotation.terms || '';
        document.getElementById('quotationObservations').value = quotation.observations || '';
        document.getElementById('globalDiscount').value = quotation.globalDiscount || 0;
        
        // Cargar productos
        quotationProducts = [...quotation.products];
        renderProductsList();
        calculateTotals();
        
        // Cerrar modal
        document.getElementById('quotationHistoryModal').style.display = 'none';
        
        console.log('✅ Cotización cargada');
    }
}

function deleteQuotation(index) {
    if (confirm('¿Está seguro de eliminar esta cotización del historial?')) {
        quotationsHistory.splice(index, 1);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(quotationsHistory));
        showQuotationHistory(); // Refrescar lista
        console.log('🗑️ Cotización eliminada del historial');
    }
}

// ===========================================
// FUNCIONES ADICIONALES
// ===========================================

function convertToReceipt() {
    if (quotationProducts.length === 0) {
        alert('No hay productos en la cotización para convertir');
        return;
    }
    
    const data = collectQuotationData();
    
    if (confirm('¿Desea convertir esta cotización en un recibo? Será redirigido al modo de recibos.')) {
        // Guardar datos temporalmente
        sessionStorage.setItem('quotationToReceipt', JSON.stringify(data));
        
        // Redirigir a modo recibos
        window.location.href = 'receipt-mode.html';
    }
}

function resetQuotationForm() {
    if (confirm('¿Está seguro de limpiar todo el formulario?')) {
        // Limpiar productos
        quotationProducts = [];
        renderProductsList();
        calculateTotals();
        
        // Resetear formulario
        document.getElementById('quotationForm').reset();
        
        // Regenerar número y fecha
        setCurrentDate();
        generateQuotationNumber();
        setupDefaultValues();
        
        console.log('🔄 Formulario limpiado');
    }
}

// ===========================================
// FUNCIONES UTILITARIAS
// ===========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('es-MX', options);
}

function getStatusClass(status) {
    const classes = {
        pending: 'status-pending',
        accepted: 'status-accepted',
        rejected: 'status-rejected',
        expired: 'status-expired'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        pending: 'Pendiente',
        accepted: 'Aceptada',
        rejected: 'Rechazada',
        expired: 'Vencida'
    };
    return texts[status] || 'Pendiente';
}

// ===========================================
// EXPORTAR FUNCIONES GLOBALES
// ===========================================

// Funciones que necesitan ser globales para onclick en HTML
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.loadQuotation = loadQuotation;
window.deleteQuotation = deleteQuotation;

// Botón de cerrar preview modal
document.addEventListener('DOMContentLoaded', function() {
    const closePreviewBtn = document.getElementById('closeQuotationPreview');
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', function() {
            document.getElementById('quotationPreviewModal').style.display = 'none';
        });
    }
    
    const confirmPdfBtn = document.getElementById('confirmGenerateQuotationPdf');
    if (confirmPdfBtn) {
        confirmPdfBtn.addEventListener('click', function() {
            document.getElementById('quotationPreviewModal').style.display = 'none';
            generateQuotationPDF();
        });
    }
    
    const closeHistoryBtn = document.getElementById('closeQuotationHistory');
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', function() {
            document.getElementById('quotationHistoryModal').style.display = 'none';
        });
    }
});

console.log('✅ Sistema de Cotizaciones v2.0 - Cargado y Funcional');