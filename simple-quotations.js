// simple-quotations.js - SISTEMA SIMPLE QUE FUNCIONA
// Solo lo esencial: número de cotización y agregar productos

console.log('📄 Iniciando sistema simple de cotizaciones...');

// Variables globales simples
let quotationProducts = [];
let editingProductIndex = -1;

// INICIALIZACIÓN SIMPLE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando sistema...');
    
    // Configurar fecha actual
    const today = new Date().toISOString().split('T')[0];
    const dateElement = document.getElementById('quotationDate');
    if (dateElement) {
        dateElement.value = today;
        console.log('✅ Fecha configurada:', today);
    }
    
    // Generar número de cotización
    generateSimpleQuotationNumber();
    
    // Configurar botones
    setupSimpleButtons();
    
    console.log('✅ Sistema simple iniciado exitosamente');
});

// GENERAR NÚMERO DE COTIZACIÓN SIMPLE
function generateSimpleQuotationNumber() {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Contador simple basado en timestamp
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const quotationNumber = `COTIZ-${year}${month}${day}-${time}`;
    
    const numberElement = document.getElementById('quotationNumber');
    if (numberElement) {
        numberElement.value = quotationNumber;
        console.log('✅ Número generado:', quotationNumber);
    }
}

// CONFIGURAR BOTONES SIMPLES
function setupSimpleButtons() {
    console.log('🎯 Configurando botones...');
    
    // Botón principal: Agregar Producto
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) {
        addBtn.onclick = function() {
            console.log('🔘 Botón agregar producto clickeado');
            showAddProductModal();
        };
        console.log('✅ Botón agregar producto configurado');
    }
    
    // Botón guardar producto
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
        saveBtn.onclick = function() {
            console.log('💾 Guardando producto...');
            saveProduct();
        };
    }
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancelProductBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            console.log('❌ Cancelando...');
            hideAddProductModal();
        };
    }
    
    // Descuento global
    const discountInput = document.getElementById('globalDiscount');
    if (discountInput) {
        discountInput.oninput = function() {
            calculateTotals();
        };
    }
    
    // Cerrar modales
    const modals = document.querySelectorAll('.modal .close');
    modals.forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });
    
    console.log('✅ Botones configurados');
}

// MOSTRAR MODAL AGREGAR PRODUCTO
function showAddProductModal() {
    console.log('📦 Abriendo modal de producto...');
    
    const modal = document.getElementById('addProductModal');
    if (modal) {
        // Limpiar formulario
        clearProductForm();
        
        // Mostrar modal
        modal.style.display = 'block';
        console.log('✅ Modal abierto');
    } else {
        console.error('❌ Modal no encontrado');
        alert('Error: No se pudo abrir el modal');
    }
}

// OCULTAR MODAL
function hideAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// LIMPIAR FORMULARIO DE PRODUCTO
function clearProductForm() {
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
        }
    });
    
    editingProductIndex = -1;
}

// GUARDAR PRODUCTO
function saveProduct() {
    console.log('💾 Guardando producto...');
    
    // Obtener valores
    const type = document.getElementById('productType')?.value;
    const material = document.getElementById('productMaterial')?.value;
    const description = document.getElementById('productDescription')?.value;
    const quantity = parseInt(document.getElementById('productQuantity')?.value) || 1;
    const price = parseFloat(document.getElementById('productPrice')?.value) || 0;
    const discount = parseFloat(document.getElementById('productDiscount')?.value) || 0;
    const sku = document.getElementById('productSKU')?.value || '';
    
    // Validación simple
    if (!type || !material || !description || price <= 0) {
        alert('Por favor complete todos los campos requeridos (Tipo, Material, Descripción y Precio)');
        return;
    }
    
    // Crear producto
    const subtotal = quantity * price;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    
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
    
    // Agregar o actualizar
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
    
    console.log('✅ Producto guardado exitosamente');
}

// RENDERIZAR LISTA DE PRODUCTOS
function renderProductsList() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    if (quotationProducts.length === 0) {
        productsList.innerHTML = '<p class="no-products">No hay productos agregados. Haz clic en "➕ Agregar Producto" para comenzar.</p>';
        return;
    }
    
    let html = '<div class="products-table"><table class="product-list-table">';
    html += '<thead><tr><th>#</th><th>Descripción</th><th>SKU</th><th>Cant.</th><th>P. Unit.</th><th>Desc.</th><th>Total</th><th>Acciones</th></tr></thead><tbody>';
    
    quotationProducts.forEach((product, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${product.type} ${product.material}</strong><br><small>${product.description}</small></td>
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
    
    html += '</tbody></table></div>';
    productsList.innerHTML = html;
}

// EDITAR PRODUCTO
function editProduct(index) {
    const product = quotationProducts[index];
    if (!product) return;
    
    // Llenar formulario
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

// ELIMINAR PRODUCTO
function removeProduct(index) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        quotationProducts.splice(index, 1);
        renderProductsList();
        calculateTotals();
    }
}

// CALCULAR TOTALES
function calculateTotals() {
    let subtotal = 0;
    quotationProducts.forEach(product => {
        subtotal += product.subtotal;
    });
    
    const globalDiscount = parseFloat(document.getElementById('globalDiscount')?.value) || 0;
    const discountAmount = (subtotal * globalDiscount) / 100;
    const total = subtotal - discountAmount;
    
    // Actualizar elementos
    const subtotalEl = document.getElementById('quotationSubtotal');
    const discountEl = document.getElementById('discountAmount');
    const totalEl = document.getElementById('quotationTotal');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (discountEl) discountEl.textContent = '-' + formatCurrency(discountAmount);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

// FORMATEAR MONEDA
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// FUNCIONES DUMMY PARA OTROS BOTONES
function showQuotationPreview() {
    alert('Vista previa próximamente');
}

function generateQuotationPDF() {
    alert('Generar PDF próximamente');
}

function shareQuotationWhatsApp() {
    alert('Compartir WhatsApp próximamente');
}

function showQuotationHistory() {
    alert('Historial próximamente');
}

function convertToReceipt() {
    alert('Convertir a recibo próximamente');
}

function resetQuotationForm() {
    if (confirm('¿Está seguro de limpiar el formulario?')) {
        document.getElementById('quotationForm').reset();
        quotationProducts = [];
        renderProductsList();
        calculateTotals();
        
        // Reconfigurar fecha y número
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quotationDate').value = today;
        generateSimpleQuotationNumber();
    }
}

// EXPONER FUNCIONES GLOBALMENTE
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.showAddProductModal = showAddProductModal;
window.showQuotationPreview = showQuotationPreview;
window.generateQuotationPDF = generateQuotationPDF;
window.shareQuotationWhatsApp = shareQuotationWhatsApp;
window.showQuotationHistory = showQuotationHistory;
window.convertToReceipt = convertToReceipt;
window.resetQuotationForm = resetQuotationForm;

console.log('✅ Sistema simple de cotizaciones cargado y funcionando');