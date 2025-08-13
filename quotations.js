// quotations.js - Sistema de cotizaciones SIMPLE y FUNCIONAL
// Reestructurado completamente para eliminar complejidad innecesaria

// Variables globales simples
let quotationProducts = [];
let editingProductIndex = -1;
let quotationDB;

// ==========================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ==========================================

function initializeQuotationSystem() {
    try {
        console.log('🚀 Iniciando sistema de cotizaciones...');
        
        // 1. Configurar fecha actual
        setCurrentQuotationDate();
        
        // 2. Generar número de cotización
        generateQuotationNumber();
        
        // 3. Inicializar base de datos
        try {
            quotationDB = new QuotationDatabase();
            window.quotationDB = quotationDB;
            console.log('✅ Base de datos inicializada');
        } catch (error) {
            console.warn('⚠️ Error en base de datos:', error);
        }
        
        // 4. Configurar event listeners
        setupEventListeners();
        
        // 5. Configurar autocompletado
        setupClientAutoComplete();
        
        console.log('✅ Sistema de cotizaciones inicializado exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando cotizaciones:', error);
        return false;
    }
}

// ==========================================
// CONFIGURACIÓN DE FECHA
// ==========================================

function setCurrentQuotationDate() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const dateElement = document.getElementById('quotationDate');
        if (dateElement) {
            dateElement.value = today;
            console.log('✅ Fecha configurada:', today);
        }
    } catch (error) {
        console.error('❌ Error configurando fecha:', error);
    }
}

// ==========================================
// GENERACIÓN DE NÚMEROS DE COTIZACIÓN
// ==========================================

function generateQuotationNumber() {
    try {
        console.log('🔢 Generando número de cotización...');
        
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Sistema de contador diario
        const dayKey = `ciaociao_cotiz_counter_${year}${month}${day}`;
        const dailyCounter = parseInt(localStorage.getItem(dayKey) || '1');
        const number = String(dailyCounter).padStart(3, '0');
        const quotationNumber = `COTIZ-${year}${month}${day}-${number}`;
        
        // Asignar al campo
        const numberElement = document.getElementById('quotationNumber');
        if (numberElement) {
            numberElement.value = quotationNumber;
            localStorage.setItem(dayKey, (dailyCounter + 1).toString());
            console.log('✅ Número generado:', quotationNumber);
            return quotationNumber;
        } else {
            console.error('❌ Campo quotationNumber no encontrado');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error generando número:', error);
        return null;
    }
}

// ==========================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    try {
        console.log('🎯 Configurando event listeners...');
        
        // Botón principal: Agregar Producto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.onclick = function() {
                showAddProductModal();
            };
            console.log('✅ Botón "Agregar Producto" configurado');
        } else {
            console.error('❌ Botón addProductBtn no encontrado');
        }
        
        // Otros botones principales
        const buttons = [
            { id: 'previewQuotationBtn', handler: showQuotationPreview },
            { id: 'generateQuotationPdfBtn', handler: generateQuotationPDF },
            { id: 'shareQuotationWhatsappBtn', handler: shareQuotationWhatsApp },
            { id: 'quotationHistoryBtn', handler: showQuotationHistory },
            { id: 'convertToReceiptBtn', handler: convertToReceipt },
            { id: 'resetQuotationBtn', handler: resetQuotationForm }
        ];
        
        buttons.forEach(btn => {
            const element = document.getElementById(btn.id);
            if (element) {
                element.onclick = btn.handler;
                console.log(`✅ Botón ${btn.id} configurado`);
            }
        });
        
        // Modal de producto
        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) {
            saveProductBtn.onclick = saveProduct;
        }
        
        const cancelProductBtn = document.getElementById('cancelProductBtn');
        if (cancelProductBtn) {
            cancelProductBtn.onclick = function() {
                document.getElementById('addProductModal').style.display = 'none';
            };
        }
        
        // Descuento global
        const globalDiscount = document.getElementById('globalDiscount');
        if (globalDiscount) {
            globalDiscount.oninput = calculateQuotationTotals;
        }
        
        console.log('✅ Event listeners configurados');
        
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

// ==========================================
// GESTIÓN DE PRODUCTOS
// ==========================================

function showAddProductModal() {
    try {
        console.log('📦 Abriendo modal de producto...');
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'block';
            clearProductForm();
            console.log('✅ Modal abierto');
        } else {
            console.error('❌ Modal no encontrado');
            alert('Error: No se pudo abrir el modal de productos');
        }
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
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
            }
        });
        
        editingProductIndex = -1;
        
    } catch (error) {
        console.error('❌ Error limpiando formulario:', error);
    }
}

function saveProduct() {
    try {
        console.log('💾 Guardando producto...');
        
        // Obtener valores
        const type = document.getElementById('productType')?.value;
        const material = document.getElementById('productMaterial')?.value;
        const description = document.getElementById('productDescription')?.value;
        const quantity = parseInt(document.getElementById('productQuantity')?.value) || 1;
        const price = parseFloat(document.getElementById('productPrice')?.value) || 0;
        const discount = parseFloat(document.getElementById('productDiscount')?.value) || 0;
        const sku = document.getElementById('productSKU')?.value || '';
        
        // Validar
        if (!type || !material || !description || price <= 0) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        // Crear producto
        const product = {
            type,
            material,
            description,
            sku,
            quantity,
            price,
            discount,
            subtotal: quantity * price,
            discountAmount: (quantity * price * discount) / 100,
            total: (quantity * price) - ((quantity * price * discount) / 100)
        };
        
        // Agregar o actualizar
        if (editingProductIndex >= 0) {
            quotationProducts[editingProductIndex] = product;
        } else {
            quotationProducts.push(product);
        }
        
        // Actualizar interfaz
        renderProductsList();
        calculateQuotationTotals();
        
        // Cerrar modal
        document.getElementById('addProductModal').style.display = 'none';
        
        console.log('✅ Producto guardado');
        
    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        alert('Error al guardar el producto');
    }
}

function renderProductsList() {
    try {
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
        
    } catch (error) {
        console.error('❌ Error renderizando productos:', error);
    }
}

function editProduct(index) {
    try {
        const product = quotationProducts[index];
        if (!product) return;
        
        document.getElementById('productType').value = product.type;
        document.getElementById('productMaterial').value = product.material;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productSKU').value = product.sku || '';
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDiscount').value = product.discount;
        
        editingProductIndex = index;
        document.getElementById('addProductModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error editando producto:', error);
    }
}

function removeProduct(index) {
    try {
        if (confirm('¿Está seguro de eliminar este producto?')) {
            quotationProducts.splice(index, 1);
            renderProductsList();
            calculateQuotationTotals();
        }
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
    }
}

// ==========================================
// CÁLCULOS
// ==========================================

function calculateQuotationTotals() {
    try {
        let subtotal = 0;
        quotationProducts.forEach(product => {
            subtotal += product.subtotal;
        });
        
        const globalDiscount = parseFloat(document.getElementById('globalDiscount')?.value) || 0;
        const discountAmount = (subtotal * globalDiscount) / 100;
        const total = subtotal - discountAmount;
        
        // Actualizar elementos
        const elements = [
            { id: 'quotationSubtotal', value: formatCurrency(subtotal) },
            { id: 'discountAmount', value: '-' + formatCurrency(discountAmount) },
            { id: 'quotationTotal', value: formatCurrency(total) }
        ];
        
        elements.forEach(el => {
            const element = document.getElementById(el.id);
            if (element) {
                element.textContent = el.value;
            }
        });
        
    } catch (error) {
        console.error('❌ Error calculando totales:', error);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// ==========================================
// FUNCIONES DUMMY (a implementar según necesidad)
// ==========================================

function showQuotationPreview() {
    alert('Vista previa (función a implementar)');
}

function generateQuotationPDF() {
    alert('Generar PDF (función a implementar)');
}

function shareQuotationWhatsApp() {
    alert('Compartir WhatsApp (función a implementar)');
}

function showQuotationHistory() {
    alert('Historial (función a implementar)');
}

function convertToReceipt() {
    alert('Convertir a recibo (función a implementar)');
}

function resetQuotationForm() {
    if (confirm('¿Está seguro de limpiar el formulario?')) {
        document.getElementById('quotationForm').reset();
        quotationProducts = [];
        renderProductsList();
        calculateQuotationTotals();
        setCurrentQuotationDate();
        generateQuotationNumber();
    }
}

function setupClientAutoComplete() {
    // Función a implementar
    console.log('ℹ️ Autocompletado de clientes (pendiente)');
}

// ==========================================
// CLASE BASE DE DATOS SIMPLE
// ==========================================

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
    
    // Métodos básicos a implementar según necesidad
}

// ==========================================
// EXPORTACIONES GLOBALES
// ==========================================

// CRÍTICO: Exponer función principal para auth.js
window.initializeQuotationSystem = initializeQuotationSystem;

// Funciones para onclick en HTML
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.showAddProductModal = showAddProductModal;

console.log('📄 quotations.js cargado - Sistema simplificado listo');