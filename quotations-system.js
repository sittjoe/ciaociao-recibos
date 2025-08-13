// quotations-system.js - SISTEMA COMPLETO DE COTIZACIONES v2.1
// Con correcciones de descuentos y formato de números
// ===========================================

console.log('📄 Iniciando Sistema de Cotizaciones v2.1...');

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
let discountType = 'percentage'; // 'percentage' o 'amount'

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
    
    // Radio buttons para tipo de descuento
    const discountTypeRadios = document.querySelectorAll('input[name="discountType"]');
    discountTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            discountType = this.value;
            updateDiscountInputType();
            calculateTotals();
        });
    });
    
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
// FUNCIONES DE TIPO DE DESCUENTO
// ===========================================

function updateDiscountInputType() {
    const discountSymbol = document.getElementById('discountSymbol');
    const discountInput = document.getElementById('globalDiscount');
    
    if (discountType === 'percentage') {
        discountSymbol.textContent = '%';
        discountInput.setAttribute('max', '100');
        discountInput.setAttribute('placeholder', 'Ej: 15');
    } else {
        discountSymbol.textContent = '$';
        discountInput.removeAttribute('max');
        discountInput.setAttribute('placeholder', 'Ej: 500');
    }
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
                <td>${formatNumber(product.quantity)}</td>
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
// CÁLCULOS FINANCIEROS CORREGIDOS
// ===========================================

function calculateTotals() {
    let subtotal = 0;
    
    // Calcular subtotal sumando TOTALES de productos (ya con descuentos individuales)
    quotationProducts.forEach(product => {
        subtotal += product.total; // Usar total, no subtotal
    });
    
    // Obtener valor del descuento global
    const globalDiscountInput = document.getElementById('globalDiscount');
    const globalDiscountValue = parseFloat(globalDiscountInput?.value || 0);
    
    // Calcular descuento según el tipo seleccionado
    let globalDiscountAmount = 0;
    if (discountType === 'percentage') {
        // Descuento en porcentaje
        globalDiscountAmount = (subtotal * globalDiscountValue) / 100;
    } else {
        // Descuento en monto fijo
        globalDiscountAmount = Math.min(globalDiscountValue, subtotal); // No puede ser mayor que el subtotal
    }
    
    // Calcular total final
    const total = subtotal - globalDiscountAmount;
    
    // Actualizar elementos en la interfaz con formato correcto
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
    // Calcular totales correctamente
    let subtotal = 0;
    quotationProducts.forEach(p => {
        subtotal += p.total; // Usar total con descuento individual aplicado
    });
    
    const globalDiscountValue = parseFloat(document.getElementById('globalDiscount')?.value || 0);
    
    // Calcular descuento según tipo
    let globalDiscountAmount = 0;
    if (discountType === 'percentage') {
        globalDiscountAmount = (subtotal * globalDiscountValue) / 100;
    } else {
        globalDiscountAmount = Math.min(globalDiscountValue, subtotal);
    }
    
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
        discountType: discountType,
        globalDiscountValue: globalDiscountValue,
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
        const rowStyle = index % 2 === 0 
            ? 'background: #ffffff;' 
            : 'background: #f9f9f9;';
        
        productsHTML += `
            <tr style="${rowStyle}">
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; font-weight: 600; color: #1a1a1a;">${index + 1}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E4E2; color: #1a1a1a;">
                    <div style="font-weight: 600; margin-bottom: 3px;">${product.type} ${product.material}</div>
                    <div style="font-size: 12px; color: #666666;">${product.description}</div>
                </td>
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; color: #666666; font-size: 12px;">${product.sku || '-'}</td>
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; font-weight: 600; color: #1a1a1a;">${formatNumber(product.quantity)}</td>
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; color: #1a1a1a;">${formatCurrency(product.price)}</td>
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; color: ${product.discount > 0 ? '#d32f2f' : '#666666'};">${product.discount}%</td>
                <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #E5E4E2; font-weight: 700; color: #D4AF37; font-size: 14px;">${formatCurrency(product.total)}</td>
            </tr>
        `;
    });
    
    // Texto del descuento según tipo
    const discountLabel = data.discountType === 'percentage' 
        ? `Descuento (${formatNumber(data.globalDiscountValue)}%):` 
        : `Descuento:`;
    
    return `
        <div style="font-family: 'Inter', Arial, sans-serif; padding: 30px; background: #ffffff; max-width: 800px; margin: 0 auto;">
            <!-- Encabezado elegante -->
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px;">
                <img src="${CONFIG.companyInfo.logo}" alt="Logo" style="height: 70px; margin-bottom: 15px;">
                <h1 style="color: #1a1a1a; margin: 15px 0; font-size: 28px; font-weight: 700;">${CONFIG.companyInfo.name.toUpperCase()}</h1>
                <p style="margin: 5px 0; color: #666666; font-size: 16px;">Joyería Fina</p>
                <p style="margin: 5px 0; color: #666666;">Tel: ${CONFIG.companyInfo.phone}</p>
                <div style="margin-top: 15px; background: #D4AF37; color: white; padding: 8px 20px; display: inline-block; border-radius: 4px;">
                    <strong style="font-size: 18px;">COTIZACIÓN</strong>
                </div>
            </div>
            
            <!-- Información de la cotización -->
            <div style="background: #F4E4BC; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
                    <div>
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Número:</strong> ${data.number}</p>
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Cliente:</strong> ${data.clientName}</p>
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Teléfono:</strong> ${data.clientPhone}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Fecha:</strong> ${formatDate(data.date)}</p>
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Válida hasta:</strong> ${formatDate(validityDate)}</p>
                        <p style="margin: 8px 0; color: #1a1a1a;"><strong>Email:</strong> ${data.clientEmail || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Tabla de productos elegante -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white;">
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">#</th>
                        <th style="padding: 15px; text-align: left; font-size: 11px; font-weight: 600;">DESCRIPCIÓN</th>
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">SKU</th>
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">CANT.</th>
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">P. UNIT.</th>
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">DESC.</th>
                        <th style="padding: 15px 10px; text-align: center; font-size: 11px; font-weight: 600;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>
            
            <!-- Sección de totales con diseño profesional -->
            <div style="background: #F7E7CE; padding: 25px; border-radius: 8px; border: 2px solid #D4AF37; margin-bottom: 30px;">
                <div style="text-align: right;">
                    <p style="margin: 8px 0; font-size: 16px; color: #1a1a1a;"><strong>Subtotal:</strong> <span style="margin-left: 20px;">${formatCurrency(data.subtotal)}</span></p>
                    ${data.globalDiscountAmount > 0 ? `<p style="margin: 8px 0; font-size: 16px; color: #1a1a1a;"><strong>${discountLabel}</strong> <span style="margin-left: 20px; color: #d32f2f;">-${formatCurrency(data.globalDiscountAmount)}</span></p>` : ''}
                    <hr style="border: none; border-top: 2px solid #D4AF37; margin: 15px 0;">
                    <p style="font-size: 20px; color: #1a1a1a; margin: 15px 0;"><strong>TOTAL: <span style="background: #D4AF37; color: white; padding: 5px 15px; border-radius: 4px; margin-left: 20px;">${formatCurrency(data.total)}</span></strong></p>
                </div>
            </div>
            
            ${data.terms ? `
            <div style="margin: 30px 0; padding: 20px; background: #f8f8f8; border-radius: 8px; border-left: 4px solid #D4AF37;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">Términos y Condiciones</h3>
                <div style="color: #666666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.terms}</div>
            </div>
            ` : ''}
            
            ${data.observations ? `
            <div style="margin: 20px 0; padding: 20px; background: #f8f8f8; border-radius: 8px; border-left: 4px solid #D4AF37;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">Observaciones</h3>
                <div style="color: #666666; font-size: 14px; line-height: 1.6;">${data.observations}</div>
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
        
        // Colores profesionales para joyería
        const colors = {
            gold: [212, 175, 55],        // #D4AF37
            darkGold: [184, 148, 31],    // #B8941F
            black: [26, 26, 26],         // #1a1a1a
            gray: [102, 102, 102],       // #666666
            lightGray: [229, 228, 226]   // #E5E4E2
        };
        
        // ======= ENCABEZADO ELEGANTE =======
        // Logo y nombre de empresa
        doc.setFontSize(24);
        doc.setTextColor(...colors.black);
        doc.setFont('helvetica', 'bold');
        doc.text('CIAOCIAO.MX', 105, 25, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(...colors.gray);
        doc.setFont('helvetica', 'normal');
        doc.text('Joyería Fina', 105, 32, { align: 'center' });
        doc.text('Tel: ' + CONFIG.companyInfo.phone, 105, 38, { align: 'center' });
        
        // Línea dorada elegante
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(1);
        doc.line(40, 45, 170, 45);
        
        // Título "COTIZACIÓN"
        doc.setFontSize(18);
        doc.setTextColor(...colors.black);
        doc.setFont('helvetica', 'bold');
        doc.text('COTIZACIÓN', 105, 58, { align: 'center' });
        
        // Línea dorada debajo del título
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.5);
        doc.line(70, 62, 140, 62);
        
        // ======= INFORMACIÓN DE LA COTIZACIÓN =======
        let yPos = 75;
        
        // Información en dos columnas elegantes
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        
        // Columna izquierda
        doc.text('N°', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(quotationData.number, 35, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 20, yPos + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(quotationData.clientName, 35, yPos + 7);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono:', 20, yPos + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(quotationData.clientPhone, 40, yPos + 14);
        
        // Columna derecha
        const validityDate = new Date(quotationData.date);
        validityDate.setDate(validityDate.getDate() + parseInt(quotationData.validity));
        
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', 120, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(quotationData.date), 135, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Válida hasta:', 120, yPos + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(validityDate), 145, yPos + 7);
        
        if (quotationData.clientEmail) {
            doc.setFont('helvetica', 'bold');
            doc.text('Email:', 120, yPos + 14);
            doc.setFont('helvetica', 'normal');
            doc.text(quotationData.clientEmail, 135, yPos + 14);
        }
        
        // ======= TABLA DE PRODUCTOS ELEGANTE =======
        yPos = 105;
        
        // Encabezado de tabla con estilo dorado elegante
        doc.setFillColor(...colors.gold);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.rect(20, yPos, 170, 10, 'F');
        
        // Encabezados con mejor espaciado
        doc.text('#', 23, yPos + 7);
        doc.text('DESCRIPCIÓN', 30, yPos + 7);
        doc.text('CANT.', 120, yPos + 7);
        doc.text('PRECIO UNIT.', 135, yPos + 7);
        doc.text('TOTAL', 170, yPos + 7);
        
        yPos += 12;
        
        // Línea separadora dorada
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);
        yPos += 3;
        
        // Productos con diseño alternado
        doc.setTextColor(...colors.black);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        quotationData.products.forEach((product, index) => {
            // Background alternado para mejor legibilidad
            if (index % 2 === 1) {
                doc.setFillColor(...colors.lightGray);
                doc.rect(20, yPos - 2, 170, 8, 'F');
            }
            
            // Número de ítem
            doc.setTextColor(...colors.black);
            doc.text(String(index + 1), 23, yPos + 4);
            
            // Descripción completa y elegante
            const description = `${product.type} ${product.material}`;
            const details = product.description;
            
            doc.setFont('helvetica', 'bold');
            doc.text(description, 30, yPos + 2);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            
            // Truncar detalles si es muy largo
            const maxLength = 45;
            const shortDetails = details.length > maxLength 
                ? details.substring(0, maxLength) + '...' 
                : details;
            doc.text(shortDetails, 30, yPos + 6);
            
            // Cantidad, precio y total alineados
            doc.setFontSize(9);
            doc.text(formatNumber(product.quantity), 123, yPos + 4, { align: 'center' });
            doc.text(formatCurrency(product.price), 150, yPos + 4, { align: 'center' });
            
            // Total en negrita
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(product.total), 178, yPos + 4, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            
            yPos += 10;
            
            // Verificar si necesitamos nueva página
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
        });
        
        // Línea final de la tabla
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.8);
        doc.line(20, yPos + 2, 190, yPos + 2);
        
        // ======= SECCIÓN DE TOTALES PROFESIONAL =======
        yPos += 10;
        
        // Marco dorado elegante para totales
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(1);
        doc.rect(120, yPos, 70, 35);
        
        // Background sutil para la sección de totales
        doc.setFillColor(252, 249, 240);
        doc.rect(121, yPos + 1, 68, 33, 'F');
        
        yPos += 8;
        
        // Subtotal
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        doc.text('Subtotal:', 125, yPos);
        doc.text(formatCurrency(quotationData.subtotal), 180, yPos, { align: 'right' });
        
        // Descuento si aplica
        if (quotationData.globalDiscountAmount > 0) {
            yPos += 6;
            const discountText = quotationData.discountType === 'percentage' 
                ? `Descuento (${formatNumber(quotationData.globalDiscountValue)}%):` 
                : 'Descuento:';
            doc.text(discountText, 125, yPos);
            doc.text('-' + formatCurrency(quotationData.globalDiscountAmount), 180, yPos, { align: 'right' });
            
            // Línea separadora antes del total
            yPos += 4;
            doc.setDrawColor(...colors.gold);
            doc.setLineWidth(0.5);
            doc.line(125, yPos, 185, yPos);
        }
        
        // Total final con estilo destacado
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...colors.black);
        doc.text('TOTAL:', 125, yPos);
        
        // Total con fondo dorado sutil
        doc.setFillColor(...colors.gold);
        doc.rect(155, yPos - 4, 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(formatCurrency(quotationData.total), 180, yPos, { align: 'right' });
        
        // ======= TÉRMINOS Y CONDICIONES PROFESIONALES =======
        yPos += 20;
        
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }
        
        // Encabezado de términos con diseño elegante
        doc.setFillColor(...colors.gold);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TÉRMINOS Y CONDICIONES', 105, yPos + 5.5, { align: 'center' });
        
        yPos += 15;
        doc.setTextColor(...colors.black);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const termsText = quotationData.terms || 
        `Los precios están sujetos a cambios sin previo aviso después de la fecha de vencimiento.
Esta cotización no garantiza la disponibilidad del producto.
Los tiempos de entrega están sujetos a disponibilidad de materiales.
Se requiere un anticipo del 30% para confirmar el pedido.
Puede apartar su producto con el 30% de anticipo.
Garantía de por vida en mano de obra.`;
        
        const termsLines = doc.splitTextToSize(termsText, 150);
        
        // Background sutil para términos
        const termsHeight = termsLines.length * 4 + 6;
        doc.setFillColor(248, 248, 248);
        doc.rect(20, yPos - 3, 170, termsHeight, 'F');
        doc.setDrawColor(...colors.lightGray);
        doc.setLineWidth(0.5);
        doc.rect(20, yPos - 3, 170, termsHeight);
        
        doc.text(termsLines, 25, yPos + 2);
        yPos += termsHeight + 10;
        
        // Observaciones si están presentes
        if (quotationData.observations && quotationData.observations.trim()) {
            doc.setFillColor(...colors.gold);
            doc.rect(20, yPos, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('OBSERVACIONES', 105, yPos + 5.5, { align: 'center' });
            
            yPos += 15;
            doc.setTextColor(...colors.black);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            const observationsLines = doc.splitTextToSize(quotationData.observations, 150);
            
            // Background para observaciones
            const obsHeight = observationsLines.length * 4 + 6;
            doc.setFillColor(248, 248, 248);
            doc.rect(20, yPos - 3, 170, obsHeight, 'F');
            doc.setDrawColor(...colors.lightGray);
            doc.setLineWidth(0.5);
            doc.rect(20, yPos - 3, 170, obsHeight);
            
            doc.text(observationsLines, 25, yPos + 2);
            yPos += obsHeight + 10;
        }
        
        // Línea de cierre elegante
        yPos += 5;
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.8);
        doc.line(40, yPos, 170, yPos);
        
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
    
    // Formatear mensaje profesional sin emojis
    let message = `*COTIZACIÓN - ${CONFIG.companyInfo.name.toUpperCase()}*\n`;
    message += `Joyería Fina\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*DETALLES DE LA COTIZACIÓN:*\n`;
    message += `Número: ${data.number}\n`;
    message += `Fecha: ${formatDate(data.date)}\n`;
    message += `Cliente: ${data.clientName}\n\n`;
    
    message += `*PRODUCTOS COTIZADOS:*\n`;
    data.products.forEach((product, index) => {
        message += `${index + 1}. *${product.type} ${product.material}*\n`;
        message += `   ${product.description}\n`;
        message += `   Cantidad: ${formatNumber(product.quantity)}\n`;
        message += `   Precio unitario: ${formatCurrency(product.price)}\n`;
        if (product.discount > 0) {
            message += `   Descuento aplicado: ${product.discount}%\n`;
        }
        message += `   Subtotal: ${formatCurrency(product.total)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*RESUMEN FINANCIERO:*\n`;
    message += `Subtotal: ${formatCurrency(data.subtotal)}\n`;
    if (data.globalDiscountAmount > 0) {
        const discountText = data.discountType === 'percentage' 
            ? `Descuento global (${formatNumber(data.globalDiscountValue)}%)` 
            : 'Descuento global';
        message += `${discountText}: -${formatCurrency(data.globalDiscountAmount)}\n`;
    }
    message += `*TOTAL: ${formatCurrency(data.total)}*\n\n`;
    
    const validityDate = new Date(data.date);
    validityDate.setDate(validityDate.getDate() + parseInt(data.validity));
    message += `*VALIDEZ:*\n`;
    message += `Esta cotización es válida hasta: ${formatDate(validityDate)}\n\n`;
    message += `*CONTACTO:*\n`;
    message += `${CONFIG.companyInfo.phone}\n`;
    message += `${CONFIG.companyInfo.name}`;
    
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
        
        // Cargar tipo de descuento y valor
        if (quotation.discountType) {
            discountType = quotation.discountType;
            const radios = document.querySelectorAll('input[name="discountType"]');
            radios.forEach(radio => {
                radio.checked = radio.value === discountType;
            });
            updateDiscountInputType();
        }
        document.getElementById('globalDiscount').value = quotation.globalDiscountValue || 0;
        
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
        
        // Resetear tipo de descuento
        discountType = 'percentage';
        document.querySelector('input[name="discountType"][value="percentage"]').checked = true;
        updateDiscountInputType();
        
        // Regenerar número y fecha
        setCurrentDate();
        generateQuotationNumber();
        setupDefaultValues();
        
        console.log('🔄 Formulario limpiado');
    }
}

// ===========================================
// FUNCIONES UTILITARIAS CON FORMATO CORRECTO
// ===========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
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

console.log('✅ Sistema de Cotizaciones v2.1 - Cargado y Funcional');
console.log('📌 Cambios incluidos:');
console.log('  - Cálculos de descuentos corregidos');
console.log('  - Opción de descuento en % o monto fijo');
console.log('  - Formato de números con comas (1,000.00)');