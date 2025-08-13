// quotations.js - SISTEMA DE COTIZACIONES BULLETPROOF
// Integrado con SystemInitializationManager para eliminar race conditions

// Variables globales simples
let quotationProducts = [];
let editingProductIndex = -1;
let quotationDB;

// ==========================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN - BULLETPROOF
// ==========================================

function initializeQuotationSystem() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🚀 [BULLETPROOF] Iniciando sistema de cotizaciones...');
            const startTime = performance.now();
            
            // PASO 1: Verificación exhaustiva de prerrequisitos
            const validationResult = validateSystemPrerequisites();
            if (!validationResult.success) {
                throw new Error(`Prerrequisitos fallidos: ${validationResult.errors.join(', ')}`);
            }
            
            // PASO 2: Inicialización secuencial con error recovery
            Promise.resolve()
                .then(() => setCurrentQuotationDate())
                .then(() => generateQuotationNumber())
                .then(() => initializeDatabase())
                .then(() => setupEventListeners())
                .then(() => setupClientAutoComplete())
                .then(() => validateSystemIntegrity())
                .then(() => {
                    const duration = performance.now() - startTime;
                    console.log(`✅ [BULLETPROOF] Sistema de cotizaciones inicializado exitosamente en ${duration.toFixed(2)}ms`);
                    
                    // Marcar sistema como completamente operativo
                    window.quotationSystemReady = true;
                    window.quotationSystemInitializedAt = new Date().toISOString();
                    
                    resolve(true);
                })
                .catch((error) => {
                    console.error('❌ [BULLETPROOF] Error en inicialización:', error);
                    
                    // Intentar recuperación automática
                    attemptSystemRecovery(error)
                        .then(() => {
                            console.log('✅ [RECOVERY] Sistema recuperado exitosamente');
                            resolve(true);
                        })
                        .catch((recoveryError) => {
                            console.error('❌ [RECOVERY] Fallo en recuperación:', recoveryError);
                            reject(new Error(`Inicialización fallida: ${error.message}, Recovery fallida: ${recoveryError.message}`));
                        });
                });
            
        } catch (error) {
            console.error('❌ [BULLETPROOF] Error crítico en inicialización:', error);
            reject(error);
        }
    });
}

// ==========================================
// VALIDACIÓN DE PRERREQUISITOS
// ==========================================

function validateSystemPrerequisites() {
    console.log('🔍 [VALIDATION] Verificando prerrequisitos del sistema...');
    const errors = [];
    
    // Verificar elementos DOM críticos
    const requiredElements = [
        'quotationForm',
        'quotationNumber', 
        'quotationDate',
        'addProductBtn',
        'productsList',
        'quotationSubtotal',
        'quotationTotal'
    ];
    
    const missingElements = requiredElements.filter(id => {
        const element = document.getElementById(id);
        if (!element) {
            errors.push(`Elemento DOM faltante: ${id}`);
            return true;
        }
        if (element.offsetParent === null) {
            errors.push(`Elemento DOM oculto: ${id}`);
            return true;
        }
        return false;
    });
    
    // Verificar dependencias JavaScript
    if (typeof QuotationDatabase !== 'function') {
        errors.push('Clase QuotationDatabase no disponible');
    }
    
    // Verificar localStorage disponible
    try {
        localStorage.setItem('test_bulletproof', '1');
        localStorage.removeItem('test_bulletproof');
    } catch (e) {
        errors.push('localStorage no disponible');
    }
    
    const success = errors.length === 0;
    if (success) {
        console.log('✅ [VALIDATION] Todos los prerrequisitos verificados');
    } else {
        console.error('❌ [VALIDATION] Errores en prerrequisitos:', errors);
    }
    
    return { success, errors };
}

// ==========================================
// RECUPERACIÓN AUTOMÁTICA DEL SISTEMA
// ==========================================

async function attemptSystemRecovery(originalError) {
    console.log('🔧 [RECOVERY] Intentando recuperación automática...');
    
    // Estrategia 1: Reinicializar elementos críticos
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Dar tiempo al DOM
        
        const validationResult = validateSystemPrerequisites();
        if (validationResult.success) {
            console.log('✅ [RECOVERY] Prerrequisitos ahora válidos, reintentando...');
            return initializeQuotationSystem();
        }
    } catch (e) {
        console.warn('⚠️ [RECOVERY] Estrategia 1 fallida:', e.message);
    }
    
    // Estrategia 2: Inicialización parcial con funcionalidad básica
    try {
        console.log('🔧 [RECOVERY] Intentando inicialización parcial...');
        
        // Solo elementos críticos mínimos
        if (document.getElementById('quotationNumber')) {
            await generateQuotationNumber();
        }
        
        if (document.getElementById('quotationDate')) {
            setCurrentQuotationDate();
        }
        
        // Configurar solo event listeners básicos que existan
        setupBasicEventListeners();
        
        console.log('✅ [RECOVERY] Inicialización parcial exitosa');
        return true;
        
    } catch (e) {
        console.error('❌ [RECOVERY] Todas las estrategias de recuperación fallaron');
        throw new Error(`Recovery fallida: ${e.message}`);
    }
}

// ==========================================
// VALIDACIÓN DE INTEGRIDAD DEL SISTEMA
// ==========================================

function validateSystemIntegrity() {
    console.log('🔍 [INTEGRITY] Validando integridad del sistema...');
    
    const checks = [
        {
            name: 'Número de cotización generado',
            test: () => {
                const numberElement = document.getElementById('quotationNumber');
                return numberElement && numberElement.value && numberElement.value.includes('COTIZ-');
            }
        },
        {
            name: 'Fecha configurada',
            test: () => {
                const dateElement = document.getElementById('quotationDate');
                return dateElement && dateElement.value;
            }
        },
        {
            name: 'Event listeners configurados',
            test: () => {
                const addBtn = document.getElementById('addProductBtn');
                return addBtn && addBtn.onclick;
            }
        },
        {
            name: 'Base de datos disponible',
            test: () => quotationDB && typeof quotationDB.init === 'function'
        }
    ];
    
    const failures = checks.filter(check => {
        try {
            const result = check.test();
            if (!result) {
                console.warn(`⚠️ [INTEGRITY] Falla: ${check.name}`);
            }
            return !result;
        } catch (e) {
            console.error(`❌ [INTEGRITY] Error en ${check.name}:`, e);
            return true;
        }
    });
    
    if (failures.length === 0) {
        console.log('✅ [INTEGRITY] Sistema completamente íntegro');
        return true;
    } else {
        throw new Error(`Fallas de integridad: ${failures.map(f => f.name).join(', ')}`);
    }
}

// ==========================================
// INICIALIZACIÓN DE BASE DE DATOS
// ==========================================

function initializeDatabase() {
    console.log('🗄️ [DATABASE] Inicializando base de datos...');
    
    try {
        quotationDB = new QuotationDatabase();
        window.quotationDB = quotationDB;
        console.log('✅ [DATABASE] Base de datos inicializada exitosamente');
        return Promise.resolve();
    } catch (error) {
        console.error('❌ [DATABASE] Error inicializando base de datos:', error);
        return Promise.reject(error);
    }
}

// ==========================================
// EVENT LISTENERS BÁSICOS (RECOVERY MODE)
// ==========================================

function setupBasicEventListeners() {
    console.log('🎯 [BASIC_EVENTS] Configurando event listeners básicos...');
    
    try {
        // Solo configurar elementos que existan y sean visibles
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn && addProductBtn.offsetParent !== null) {
            addProductBtn.onclick = function() {
                showAddProductModal();
            };
            console.log('✅ [BASIC_EVENTS] Botón agregar producto configurado');
        }

        // Botón de resetear formulario
        const resetBtn = document.getElementById('resetQuotationBtn');
        if (resetBtn && resetBtn.offsetParent !== null) {
            resetBtn.onclick = function() {
                if (confirm('¿Está seguro de limpiar el formulario?')) {
                    resetQuotationForm();
                }
            };
            console.log('✅ [BASIC_EVENTS] Botón reset configurado');
        }

        // Descuento global
        const globalDiscount = document.getElementById('globalDiscount');
        if (globalDiscount && globalDiscount.offsetParent !== null) {
            globalDiscount.oninput = calculateQuotationTotals;
            console.log('✅ [BASIC_EVENTS] Descuento global configurado');
        }

        console.log('✅ [BASIC_EVENTS] Event listeners básicos configurados');
        return true;
        
    } catch (error) {
        console.error('❌ [BASIC_EVENTS] Error configurando event listeners básicos:', error);
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
    return new Promise((resolve, reject) => {
        try {
            console.log('🔢 [NUMBER] Generando número de cotización...');
            
            const now = new Date();
            const year = String(now.getFullYear());
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            
            // Sistema de contador diario único
            const dayKey = `ciaociao_cotiz_counter_${year}${month}${day}`;
            const dailyCounter = parseInt(localStorage.getItem(dayKey) || '1');
            const number = String(dailyCounter).padStart(3, '0');
            const quotationNumber = `COTIZ-${year}${month}${day}-${number}`;
            
            // Verificar elemento con retry logic
            let attempts = 0;
            const maxAttempts = 10;
            
            const tryAssignNumber = () => {
                attempts++;
                const numberElement = document.getElementById('quotationNumber');
                
                if (!numberElement) {
                    if (attempts >= maxAttempts) {
                        const error = new Error(`Campo quotationNumber no encontrado después de ${maxAttempts} intentos`);
                        console.error('❌ [NUMBER]', error.message);
                        reject(error);
                        return;
                    }
                    
                    console.log(`⏳ [NUMBER] Esperando elemento quotationNumber... (${attempts}/${maxAttempts})`);
                    setTimeout(tryAssignNumber, 100);
                    return;
                }
                
                if (numberElement.offsetParent === null) {
                    if (attempts >= maxAttempts) {
                        const error = new Error(`Campo quotationNumber oculto después de ${maxAttempts} intentos`);
                        console.error('❌ [NUMBER]', error.message);
                        reject(error);
                        return;
                    }
                    
                    console.log(`⏳ [NUMBER] Esperando visibilidad de quotationNumber... (${attempts}/${maxAttempts})`);
                    setTimeout(tryAssignNumber, 100);
                    return;
                }
                
                // Asignar número exitosamente
                try {
                    numberElement.value = quotationNumber;
                    
                    // Solo incrementar contador si la asignación fue exitosa
                    localStorage.setItem(dayKey, (dailyCounter + 1).toString());
                    
                    console.log(`✅ [NUMBER] Número generado y asignado: ${quotationNumber}`);
                    
                    // Verificar que realmente se asignó
                    if (numberElement.value === quotationNumber) {
                        resolve(quotationNumber);
                    } else {
                        throw new Error('Verificación de asignación fallida');
                    }
                    
                } catch (assignError) {
                    console.error('❌ [NUMBER] Error asignando número:', assignError);
                    reject(assignError);
                }
            };
            
            // Iniciar proceso de asignación
            tryAssignNumber();
            
        } catch (error) {
            console.error('❌ [NUMBER] Error crítico generando número:', error);
            reject(error);
        }
    });
}

// ==========================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🎯 [EVENTS] Configurando event listeners robustos...');
            let successCount = 0;
            let totalEvents = 0;
            
            // Función helper para configurar eventos con validación
            function configureEventSafely(elementId, eventType, handler, description) {
                totalEvents++;
                const element = document.getElementById(elementId);
                
                if (!element) {
                    console.warn(`⚠️ [EVENTS] Elemento ${elementId} no encontrado`);
                    return false;
                }
                
                if (element.offsetParent === null) {
                    console.warn(`⚠️ [EVENTS] Elemento ${elementId} no visible`);
                    return false;
                }
                
                try {
                    if (eventType === 'onclick') {
                        element.onclick = handler;
                    } else {
                        element.addEventListener(eventType, handler);
                    }
                    
                    successCount++;
                    console.log(`✅ [EVENTS] ${description} configurado`);
                    return true;
                } catch (e) {
                    console.error(`❌ [EVENTS] Error configurando ${description}:`, e);
                    return false;
                }
            }
            
            // BOTÓN PRINCIPAL: Agregar Producto (CRÍTICO)
            const addProductSuccess = configureEventSafely(
                'addProductBtn', 'onclick', 
                () => showAddProductModal(), 
                'Botón Agregar Producto [CRÍTICO]'
            );
            
            // Otros botones principales
            const buttons = [
                { id: 'previewQuotationBtn', handler: showQuotationPreview, desc: 'Vista Previa' },
                { id: 'generateQuotationPdfBtn', handler: generateQuotationPDF, desc: 'Generar PDF' },
                { id: 'shareQuotationWhatsappBtn', handler: shareQuotationWhatsApp, desc: 'Compartir WhatsApp' },
                { id: 'quotationHistoryBtn', handler: showQuotationHistory, desc: 'Historial' },
                { id: 'convertToReceiptBtn', handler: convertToReceipt, desc: 'Convertir a Recibo' },
                { id: 'resetQuotationBtn', handler: () => {
                    if (confirm('¿Está seguro de limpiar el formulario?')) {
                        resetQuotationForm();
                    }
                }, desc: 'Reset Formulario' }
            ];
            
            buttons.forEach(btn => {
                configureEventSafely(btn.id, 'onclick', btn.handler, btn.desc);
            });
            
            // Modal de producto - Botones críticos
            configureEventSafely('saveProductBtn', 'onclick', saveProduct, 'Guardar Producto [CRÍTICO]');
            configureEventSafely('cancelProductBtn', 'onclick', () => {
                const modal = document.getElementById('addProductModal');
                if (modal) modal.style.display = 'none';
            }, 'Cancelar Producto');
            
            // Descuento global - Input crítico
            configureEventSafely('globalDiscount', 'input', calculateQuotationTotals, 'Descuento Global [CRÍTICO]');
            
            // Modales - Cerrar
            const modals = ['quotationPreviewModal', 'quotationHistoryModal', 'addProductModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    const closeBtn = modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.onclick = () => modal.style.display = 'none';
                    }
                    
                    // Cerrar al hacer click fuera del modal
                    modal.onclick = (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    };
                }
            });
            
            // Verificar éxito de configuración
            const successRate = (successCount / totalEvents) * 100;
            console.log(`📊 [EVENTS] Event listeners configurados: ${successCount}/${totalEvents} (${successRate.toFixed(1)}%)`);
            
            // El botón Agregar Producto es CRÍTICO - debe funcionar
            if (!addProductSuccess) {
                const error = new Error('Botón Agregar Producto crítico no configurado');
                console.error('❌ [EVENTS] Error crítico:', error);
                reject(error);
                return;
            }
            
            if (successRate >= 80) { // Al menos 80% de eventos configurados
                console.log('✅ [EVENTS] Event listeners configurados exitosamente');
                resolve(true);
            } else {
                const warning = `Tasa de éxito baja: ${successRate.toFixed(1)}%`;
                console.warn(`⚠️ [EVENTS] ${warning}`);
                resolve(true); // Continuar aunque algunos eventos fallen
            }
            
        } catch (error) {
            console.error('❌ [EVENTS] Error crítico configurando event listeners:', error);
            reject(error);
        }
    });
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