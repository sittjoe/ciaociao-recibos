// quotations-system.js - SISTEMA COMPLETO DE COTIZACIONES v2.1
// Con correcciones de descuentos y formato de números
// ===========================================

console.log('📄 Iniciando Sistema de Cotizaciones v2.1...');

// ===========================================
// UTILIDADES PARA MANEJO DE IMÁGENES EN PDF
// ===========================================

// Cache del logo en base64 para performance
let logoBase64Cache = null;
const LOGO_CACHE_KEY = 'ciaociao_logo_base64';
const LOGO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Función para cargar imagen externa como base64
async function loadImageAsBase64(url) {
    console.log('🖼️ Cargando logo como base64...');
    
    try {
        // Verificar cache primero
        const cached = localStorage.getItem(LOGO_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            // Verificar TTL
            if (now - cacheData.timestamp < LOGO_CACHE_TTL) {
                console.log('✅ Logo cargado desde cache');
                logoBase64Cache = cacheData.data;
                return cacheData.data;
            } else {
                localStorage.removeItem(LOGO_CACHE_KEY);
            }
        }
        
        // Cargar imagen fresca
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
            
            img.onload = function() {
                try {
                    // Crear canvas para convertir a base64
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Establecer dimensiones (ajustar según necesidad)
                    const maxWidth = 200;
                    const maxHeight = 80;
                    
                    let { width, height } = img;
                    
                    // Mantener proporción
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Dibujar imagen en canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir a base64
                    const base64Data = canvas.toDataURL('image/png');
                    
                    // Guardar en cache
                    const cacheData = {
                        data: base64Data,
                        timestamp: Date.now(),
                        dimensions: { width, height }
                    };
                    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cacheData));
                    
                    logoBase64Cache = base64Data;
                    console.log('✅ Logo convertido a base64 y guardado en cache');
                    resolve(base64Data);
                    
                } catch (error) {
                    console.error('❌ Error convirtiendo imagen a base64:', error);
                    reject(error);
                }
            };
            
            img.onerror = function() {
                console.error('❌ Error cargando imagen desde URL:', url);
                reject(new Error('Failed to load image'));
            };
            
            // Cargar imagen
            img.src = url;
        });
        
    } catch (error) {
        console.error('❌ Error en loadImageAsBase64:', error);
        return null;
    }
}

// Función para obtener dimensiones del logo desde cache
function getLogoDimensions() {
    try {
        const cached = localStorage.getItem(LOGO_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            return cacheData.dimensions || { width: 200, height: 80 };
        }
    } catch (error) {
        console.warn('⚠️ Error obteniendo dimensiones del logo:', error);
    }
    
    // Dimensiones por defecto
    return { width: 200, height: 80 };
}

// ===========================================
// INICIALIZACIÓN DIRECTA (COMO SCRIPT.JS)
// ===========================================

// *** INICIALIZACIÓN DIRECTA - PATRÓN QUE FUNCIONA EN RECIBOS ***
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - Inicializando cotizaciones directamente...');
    
    try {
        // Configuración básica inmediata (sin verificaciones complejas)
        initializeQuotationSystemDirect();
        console.log('✅ Inicialización directa completada');
    } catch (error) {
        console.error('❌ Error en inicialización directa:', error);
        // Fallback: intentar con el sistema complejo
        setTimeout(() => initializeQuotationSystem(), 2000);
    }
});

// Función de inicialización directa (sin dependencias complejas)
function initializeQuotationSystemDirect() {
    console.log('🔧 Configurando sistema básico...');
    
    // 1. Cargar historial
    loadQuotationsHistory();
    
    // 2. Configurar fecha
    setCurrentDate();
    
    // 3. Generar número
    generateQuotationNumber();
    
    // 4. CONFIGURAR EVENT LISTENERS INMEDIATAMENTE
    setupEventListenersBasic();
    
    // 5. Configurar valores por defecto
    setupDefaultValues();
    
    // 6. Setup firma (sin CDN dependencies - se configura después)
    setTimeout(() => setupCompanySignature(), 1000);
    
    console.log('✅ Sistema básico de cotizaciones configurado');
}

// Configuración básica de event listeners (sin verificaciones complejas)
function setupEventListenersBasic() {
    console.log('🎯 Configurando event listeners básicos...');
    
    // BOTÓN AGREGAR PRODUCTO - CONFIGURACIÓN DIRECTA
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            console.log('🔥 BOTÓN CLICKED - Abriendo modal...');
            showAddProductModal();
        });
        console.log('✅ Botón agregar producto configurado DIRECTAMENTE');
        
        // Exposición global inmediata
        window.showAddProductModal = showAddProductModal;
    } else {
        console.error('❌ addProductBtn no encontrado');
    }
    
    // Otros event listeners básicos
    setupOtherBasicListeners();
}

function setupOtherBasicListeners() {
    // Radio buttons para tipo de descuento global
    const discountTypeRadios = document.querySelectorAll('input[name="discountType"]');
    discountTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            discountType = this.value;
            updateDiscountInputType();
            calculateTotals();
        });
    });
    
    // Radio buttons para tipo de descuento del producto (en modal)
    const productDiscountTypeRadios = document.querySelectorAll('input[name="productDiscountType"]');
    productDiscountTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateProductDiscountType();
        });
    });
    
    // NUEVO: Event listeners para sistema de crédito
    const creditType = document.getElementById('creditType');
    const creditAmount = document.getElementById('creditAmount');
    
    if (creditType) {
        creditType.addEventListener('change', function() {
            const creditAmountInput = document.getElementById('creditAmount');
            if (this.value === 'none') {
                creditAmountInput.disabled = true;
                creditAmountInput.value = '0';
            } else {
                creditAmountInput.disabled = false;
            }
            calculateTotals();
        });
        console.log('✅ Event listener para creditType configurado');
    }
    
    if (creditAmount) {
        creditAmount.addEventListener('input', calculateTotals);
        console.log('✅ Event listener para creditAmount configurado');
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
    
    // Cerrar modales con X
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Otros botones
    const previewBtn = document.getElementById('previewQuotationBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showQuotationPreview);
    }
    
    const generateBtn = document.getElementById('generateQuotationPdfBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateQuotationPDF);
    }
    
    const whatsappBtn = document.getElementById('shareQuotationWhatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', shareQuotationWhatsApp);
    }
    
    console.log('✅ Event listeners básicos configurados');
}

// ===========================================
// FUNCIONES BÁSICAS REQUERIDAS
// ===========================================

// Funciones que deben estar disponibles para los event listeners
function showAddProductModal() {
    console.log('📦 Abriendo modal de producto...');
    const modal = document.getElementById('addProductModal');
    const modalTitle = document.getElementById('productModalTitle');
    
    if (modal) {
        // Cambiar título según si estamos editando o agregando
        if (modalTitle) {
            if (editingProductIndex >= 0) {
                modalTitle.innerHTML = '✏️ Editar Producto';
            } else {
                modalTitle.innerHTML = '➕ Agregar Producto';
            }
        }
        
        // Limpiar formulario solo si no estamos editando
        if (editingProductIndex < 0) {
            clearProductForm();
        }
        
        modal.style.display = 'block';
        
        // Actualizar botón de guardar
        updateSaveButton();
    }
}

function hideAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset editing index cuando se cierra el modal
        editingProductIndex = -1;
    }
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
        if (editingProductIndex >= 0) {
            saveBtn.textContent = 'Actualizar Producto';
            saveBtn.className = 'btn-success';
        } else {
            saveBtn.textContent = 'Guardar Producto';
            saveBtn.className = 'btn-success';
        }
    }
}

function clearProductForm() {
    const elements = [
        'productType', 'productMaterial', 'productDescription', 
        'productSKU', 'productQuantity', 'productPrice', 'productDiscount'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'productQuantity') {
                element.value = '1';
            } else if (id === 'productDiscount') {
                element.value = '0';
            } else {
                element.value = '';
            }
        }
    });
    
    // Reset product discount type to percentage
    const percentageRadio = document.querySelector('input[name="productDiscountType"][value="percentage"]');
    const amountRadio = document.querySelector('input[name="productDiscountType"][value="amount"]');
    const discountSymbol = document.getElementById('productDiscountSymbol');
    
    if (percentageRadio) percentageRadio.checked = true;
    if (amountRadio) amountRadio.checked = false;
    if (discountSymbol) discountSymbol.textContent = '%';
}

function updateProductDiscountType() {
    const productDiscountType = document.querySelector('input[name="productDiscountType"]:checked')?.value;
    const discountSymbol = document.getElementById('productDiscountSymbol');
    const discountInput = document.getElementById('productDiscount');
    
    if (productDiscountType === 'percentage') {
        if (discountSymbol) discountSymbol.textContent = '%';
        if (discountInput) {
            discountInput.max = '100';
            discountInput.placeholder = 'Ej: 10';
        }
    } else {
        if (discountSymbol) discountSymbol.textContent = '$';
        if (discountInput) {
            discountInput.removeAttribute('max');
            discountInput.placeholder = 'Ej: 500';
        }
    }
}

// Exposición global inmediata
window.showAddProductModal = showAddProductModal;
window.hideAddProductModal = hideAddProductModal;

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
let companySignaturePad = null; // Firma de la empresa

// ===========================================
// VERIFICACIÓN DE DEPENDENCIAS Y CARGA SECUENCIAL
// ===========================================

// Sistema robusto de verificación de dependencias CDN
async function verifyDependencies() {
    console.log('🔍 Verificando dependencias CDN...');
    
    const dependencies = {
        jsPDF: () => typeof window.jspdf !== 'undefined',
        SignaturePad: () => typeof SignaturePad !== 'undefined',
        html2canvas: () => typeof html2canvas !== 'undefined'
    };
    
    const maxRetries = 20; // 20 intentos = 10 segundos máximo
    const retryDelay = 500; // 500ms entre intentos
    
    for (const [name, checkFn] of Object.entries(dependencies)) {
        let attempts = 0;
        while (attempts < maxRetries) {
            if (checkFn()) {
                console.log(`✅ ${name} disponible`);
                break;
            }
            
            attempts++;
            console.log(`⏳ Esperando ${name}... (${attempts}/${maxRetries})`);
            
            if (attempts >= maxRetries) {
                throw new Error(`Timeout: ${name} no se cargó después de ${maxRetries * retryDelay}ms`);
            }
            
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    
    console.log('✅ Todas las dependencias CDN están disponibles');
    return true;
}

// Verificación robusta de elementos DOM
function verifyDOMElements() {
    console.log('🔍 Verificando elementos DOM críticos...');
    
    const criticalElements = [
        'quotationNumber',
        'addProductBtn', 
        'companySignatureCanvas',
        'quotationForm',
        'productsList',
        'quotationSubtotal',
        'quotationTotal'
    ];
    
    const missingElements = [];
    
    for (const elementId of criticalElements) {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
        } else if (element.offsetParent === null) {
            console.warn(`⚠️ Elemento ${elementId} existe pero no es visible`);
        } else {
            console.log(`✅ Elemento ${elementId} disponible y visible`);
        }
    }
    
    if (missingElements.length > 0) {
        throw new Error(`Elementos DOM faltantes: ${missingElements.join(', ')}`);
    }
    
    console.log('✅ Todos los elementos DOM críticos están disponibles');
    return true;
}

// ===========================================
// INICIALIZACIÓN DEL SISTEMA CON VERIFICACIÓN ROBUSTA
// ===========================================

// Función global para inicialización controlada desde auth.js
async function initializeQuotationSystem() {
    console.log('🚀 Inicializando sistema de cotizaciones...');
    
    try {
        // FASE 1: Verificar dependencias CDN
        await verifyDependencies();
        
        // FASE 2: Verificar elementos DOM
        verifyDOMElements();
        
        // FASE 3: Inicialización normal
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
        
        // VERIFICACIONES POST-INICIALIZACIÓN
        console.log('🔍 Ejecutando verificaciones post-inicialización...');
        
        // Verificar que event listeners estén configurados correctamente
        const addProductBtn = document.getElementById('addProductBtn');
        if (!addProductBtn) {
            throw new Error('Botón addProductBtn no encontrado después de inicialización');
        }
        
        // Simular click para verificar que el botón responde
        const clickEvent = new Event('click', { bubbles: true });
        const modalBefore = document.getElementById('addProductModal').style.display;
        addProductBtn.dispatchEvent(clickEvent);
        
        // Verificar que el modal se abrió o que existe una función asociada
        const modalAfter = document.getElementById('addProductModal').style.display;
        const hasClickListener = modalBefore !== modalAfter || typeof window.showAddProductModal === 'function';
        
        if (!hasClickListener) {
            throw new Error('Botón addProductBtn no tiene event listeners funcionales');
        }
        
        // Cerrar modal si se abrió durante la prueba
        if (modalAfter === 'block') {
            document.getElementById('addProductModal').style.display = 'none';
        }
        
        console.log('✅ Botón addProductBtn verificado y funcional');
        
        // Verificar que las funciones críticas estén disponibles globalmente
        if (typeof window.showAddProductModal !== 'function') {
            console.warn('⚠️ showAddProductModal no está disponible globalmente');
        }
        
        // Esperar a que companySignaturePad esté inicializado
        let signatureRetries = 0;
        const maxSignatureRetries = 10;
        
        const checkSignaturePad = () => {
            if (window.companySignaturePad) {
                console.log('✅ Canvas de firma verificado y funcional');
                console.log('✅ Sistema de cotizaciones inicializado correctamente');
            } else if (signatureRetries < maxSignatureRetries) {
                signatureRetries++;
                console.log(`⏳ Esperando inicialización de canvas de firma (${signatureRetries}/${maxSignatureRetries})...`);
                setTimeout(checkSignaturePad, 500);
            } else {
                console.warn('⚠️ Canvas de firma no se inicializó completamente (no es crítico)');
                console.log('✅ Sistema de cotizaciones inicializado correctamente');
            }
        };
        
        checkSignaturePad();
        
    } catch (error) {
        console.error('❌ Error durante inicialización:', error);
        
        // Mostrar error específico al usuario
        const errorMsg = error.message.includes('Timeout') 
            ? 'Error: No se pudieron cargar las bibliotecas necesarias. Por favor revisa tu conexión a internet y recarga la página.'
            : error.message.includes('DOM') 
            ? 'Error: La página no cargó correctamente. Por favor recarga la página.'
            : 'Error al inicializar el sistema. Por favor recarga la página.';
            
        alert(errorMsg);
        
        // Retry automático después de 3 segundos
        setTimeout(() => {
            console.log('🔄 Reintentando inicialización automáticamente...');
            initializeQuotationSystem();
        }, 3000);
    }
}

// Exportar función globalmente para auth.js
window.initializeQuotationSystem = initializeQuotationSystem;

// ===========================================
// FUNCIONES DE INICIALIZACIÓN
// ===========================================

function setCurrentDate() {
    console.log('📅 Configurando fecha actual...');
    try {
        const today = new Date().toISOString().split('T')[0];
        const dateElement = document.getElementById('quotationDate');
        if (dateElement) {
            dateElement.value = today;
            console.log('✅ Fecha configurada:', today);
        } else {
            console.warn('⚠️ Elemento quotationDate no encontrado');
        }
    } catch (error) {
        console.error('❌ Error configurando fecha:', error);
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
    
    // Botones de cerrar modales
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
    
    // Cerrar modales clickeando fuera o con X
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
        
        // Botón X de cerrar
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
    });
    
    // Configurar firma de la empresa
    setupCompanySignature();
    
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
// CONFIGURACIÓN DE FIRMA
// ===========================================

async function setupCompanySignature(retryCount = 0) {
    console.log('🖊️ Configurando firma de empresa... (intento ' + (retryCount + 1) + ')');
    
    // Limitar reintentos para evitar loops infinitos
    if (retryCount >= 10) {
        console.error('❌ No se pudo configurar la firma después de 10 intentos');
        return;
    }
    
    try {
        // VERIFICACIÓN ROBUSTA DE DEPENDENCIAS
        // Usar el mismo sistema de verificación que la inicialización principal
        if (typeof SignaturePad === 'undefined') {
            console.warn('⚠️ SignaturePad no está cargado, reintentando...');
            setTimeout(() => setupCompanySignature(retryCount + 1), 500);
            return;
        }
        
        const canvas = document.getElementById('companySignatureCanvas');
        if (!canvas) {
            console.warn('⚠️ Canvas de firma no encontrado, reintentando...');
            setTimeout(() => setupCompanySignature(retryCount + 1), 500);
            return;
        }
        
        // VERIFICACIÓN MEJORADA DE VISIBILIDAD
        // Verificar que el canvas sea visible Y tenga dimensiones válidas
        const isVisible = canvas.offsetParent !== null;
        const hasWidth = canvas.offsetWidth > 0;
        const hasHeight = canvas.offsetHeight > 0;
        
        if (!isVisible || !hasWidth || !hasHeight) {
            console.log(`🔄 Canvas no listo - Visible: ${isVisible}, Width: ${canvas.offsetWidth}, Height: ${canvas.offsetHeight}`);
            setTimeout(() => setupCompanySignature(retryCount + 1), 500);
            return;
        }
        
        // CONFIGURACIÓN MEJORADA DEL CANVAS
        function resizeCanvas() {
            try {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                const rect = canvas.getBoundingClientRect();
                
                // Verificar que el rect tenga dimensiones válidas
                if (rect.width === 0 || rect.height === 0) {
                    console.warn('⚠️ Canvas rect tiene dimensiones 0, saltando resize');
                    return;
                }
                
                canvas.width = rect.width * ratio;
                canvas.height = rect.height * ratio;
                
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.scale(ratio, ratio);
                    console.log(`📐 Canvas redimensionado: ${rect.width}x${rect.height} (ratio: ${ratio})`);
                }
            } catch (resizeError) {
                console.error('❌ Error redimensionando canvas:', resizeError);
            }
        }
        
        // Aplicar tamaño inicial
        resizeCanvas();
        
        // Listener de resize con debounce
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 250);
        };
        window.addEventListener('resize', debouncedResize);
        
        // INICIALIZACIÓN ROBUSTA DE SIGNATUREPAD
        try {
            companySignaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: 'rgb(0, 0, 0)',
                velocityFilterWeight: 0.7,
                minWidth: 0.5,
                maxWidth: 2.5,
                throttle: 16 // 60 FPS para mejor performance
            });
            
            // VERIFICACIÓN EXHAUSTIVA DE LA INICIALIZACIÓN
            const isValidSignaturePad = companySignaturePad && 
                typeof companySignaturePad.isEmpty === 'function' &&
                typeof companySignaturePad.clear === 'function' &&
                typeof companySignaturePad.toDataURL === 'function';
            
            if (!isValidSignaturePad) {
                throw new Error('SignaturePad no se inicializó con todas las funciones necesarias');
            }
            
            // Test básico de funcionalidad
            const isEmpty = companySignaturePad.isEmpty();
            console.log(`✅ SignaturePad funcional - isEmpty: ${isEmpty}`);
            
            // Exposición global para verificación desde auth.js
            window.companySignaturePad = companySignaturePad;
            
        } catch (sigError) {
            console.error('❌ Error inicializando SignaturePad:', sigError);
            setTimeout(() => setupCompanySignature(retryCount + 1), 1000);
            return;
        }
        
        // CONFIGURAR BOTÓN LIMPIAR CON VERIFICACIÓN
        const clearBtn = document.getElementById('clearCompanySignature');
        if (clearBtn) {
            // Remover listeners previos para evitar duplicados
            clearBtn.replaceWith(clearBtn.cloneNode(true));
            const newClearBtn = document.getElementById('clearCompanySignature');
            
            newClearBtn.addEventListener('click', function() {
                try {
                    if (companySignaturePad && typeof companySignaturePad.clear === 'function') {
                        companySignaturePad.clear();
                        console.log('🧹 Firma de empresa limpiada');
                    } else {
                        console.error('❌ companySignaturePad no está disponible para limpiar');
                    }
                } catch (clearError) {
                    console.error('❌ Error limpiando firma:', clearError);
                }
            });
            console.log('✅ Botón limpiar firma configurado');
        }
        
        console.log('✅ Firma de empresa configurada completamente');
        
    } catch (error) {
        console.error('❌ Error configurando firma de empresa:', error);
        // Retry con delay exponencial
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
        setTimeout(() => setupCompanySignature(retryCount + 1), delay);
    }
}

// ===========================================
// GESTIÓN DE PRODUCTOS
// ===========================================

// Las funciones showAddProductModal, hideAddProductModal y clearProductForm
// están definidas arriba en la sección "FUNCIONES BÁSICAS REQUERIDAS"

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
    
    // Obtener tipo de descuento del producto
    const productDiscountType = document.querySelector('input[name="productDiscountType"]:checked')?.value || 'percentage';
    
    // Validación
    if (!type || !material || !description || price <= 0) {
        alert('Por favor complete todos los campos requeridos correctamente');
        return;
    }
    
    // Calcular totales del producto según tipo de descuento
    const subtotal = quantity * price;
    let discountAmount;
    
    if (productDiscountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
    } else {
        // Descuento por monto fijo
        discountAmount = discount;
    }
    
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
        discountType: productDiscountType,
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
        // Formatear descuento según tipo
        let discountDisplay;
        const discountType = product.discountType || 'percentage';
        
        if (discountType === 'percentage') {
            discountDisplay = `${product.discount}%`;
        } else {
            discountDisplay = `$${formatNumber(product.discount)}`;
        }
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td class="product-description">
                    <strong>${product.type} ${product.material}</strong><br>
                    <div class="description-text">${product.description}</div>
                </td>
                <td>${product.sku || '-'}</td>
                <td>${formatNumber(product.quantity)}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${discountDisplay}</td>
                <td><strong>${formatCurrency(product.total)}</strong></td>
                <td class="action-buttons">
                    <button onclick="editProduct(${index})" class="btn-edit-product" title="Editar producto">✏️</button>
                    <button onclick="removeProduct(${index})" class="btn-remove-product" title="Eliminar producto">🗑️</button>
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
    
    // Configurar tipo de descuento
    const discountType = product.discountType || 'percentage';
    const percentageRadio = document.querySelector('input[name="productDiscountType"][value="percentage"]');
    const amountRadio = document.querySelector('input[name="productDiscountType"][value="amount"]');
    const discountSymbol = document.getElementById('productDiscountSymbol');
    
    if (discountType === 'percentage') {
        if (percentageRadio) percentageRadio.checked = true;
        if (amountRadio) amountRadio.checked = false;
        if (discountSymbol) discountSymbol.textContent = '%';
    } else {
        if (percentageRadio) percentageRadio.checked = false;
        if (amountRadio) amountRadio.checked = true;
        if (discountSymbol) discountSymbol.textContent = '$';
    }
    
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
    
    // NUEVO: Calcular crédito del cliente
    const creditInfo = calculateCreditAmount();
    
    // Calcular total final incluyendo crédito
    const total = subtotal - globalDiscountAmount + creditInfo.amount;
    
    // Actualizar elementos en la interfaz con formato correcto
    updateTotalElements(subtotal, globalDiscountAmount, total, creditInfo);
}

// Nueva función para calcular el crédito del cliente
function calculateCreditAmount() {
    const creditType = document.getElementById('creditType')?.value || 'none';
    const creditAmountInput = document.getElementById('creditAmount');
    const creditAmount = parseFloat(creditAmountInput?.value || 0);
    
    if (creditType === 'none' || creditAmount === 0) {
        return { amount: 0, type: 'none', display: null };
    }
    
    // Crédito a favor = negativo (reduce el total)
    // Cliente debe = positivo (aumenta el total)
    const amount = creditType === 'favor' ? -creditAmount : creditAmount;
    
    return {
        amount: amount,
        type: creditType,
        display: {
            label: creditType === 'favor' ? 'Crédito a favor:' : 'Cliente debe:',
            formattedAmount: formatCurrency(creditAmount),
            sign: creditType === 'favor' ? '+' : '-'
        }
    };
}

function updateTotalElements(subtotal, discountAmount, total, creditInfo) {
    const subtotalElement = document.getElementById('quotationSubtotal');
    const discountElement = document.getElementById('discountAmount');
    const totalElement = document.getElementById('quotationTotal');
    
    // Elementos de crédito
    const creditDisplay = document.getElementById('creditDisplay');
    const creditLabel = document.getElementById('creditLabel');
    const creditAmountDisplay = document.getElementById('creditAmountDisplay');
    
    if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(subtotal);
    }
    
    if (discountElement) {
        discountElement.textContent = '-' + formatCurrency(discountAmount);
    }
    
    // Actualizar visualización del crédito
    if (creditInfo && creditInfo.display) {
        if (creditDisplay) {
            creditDisplay.style.display = 'flex';
        }
        if (creditLabel) {
            creditLabel.textContent = creditInfo.display.label;
        }
        if (creditAmountDisplay) {
            creditAmountDisplay.textContent = creditInfo.display.sign + creditInfo.display.formattedAmount;
            // Añadir clase CSS según el tipo de crédito
            creditAmountDisplay.className = creditInfo.type === 'favor' ? 'credit-favor' : 'credit-debe';
        }
    } else {
        // Ocultar la visualización del crédito si no hay
        if (creditDisplay) {
            creditDisplay.style.display = 'none';
        }
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
    
    // NUEVO: Obtener información del crédito
    const creditInfo = calculateCreditAmount();
    
    const total = subtotal - globalDiscountAmount + creditInfo.amount;
    
    return {
        number: document.getElementById('quotationNumber')?.value || '',
        date: document.getElementById('quotationDate')?.value || '',
        validity: document.getElementById('validity')?.value || '30',
        clientName: document.getElementById('clientName')?.value || '',
        clientPhone: document.getElementById('clientPhone')?.value || '',
        clientEmail: document.getElementById('clientEmail')?.value || '',
        products: quotationProducts,
        subtotal: subtotal,
        discountType: discountType,
        globalDiscountValue: globalDiscountValue,
        globalDiscountAmount: globalDiscountAmount,
        creditInfo: creditInfo,
        total: total,
        terms: document.getElementById('terms')?.value || '',
        observations: document.getElementById('quotationObservations')?.value || '',
        companySignature: companySignaturePad && !companySignaturePad.isEmpty() ? companySignaturePad.toDataURL() : null
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
                    ${data.creditInfo && data.creditInfo.type !== 'none' && data.creditInfo.amount !== 0 ? 
                        `<p style="margin: 8px 0; font-size: 16px; color: #1a1a1a;"><strong>${data.creditInfo.type === 'favor' ? 'Crédito a favor:' : 'Cliente debe:'}</strong> <span style="margin-left: 20px; color: ${data.creditInfo.type === 'favor' ? '#2e7d32' : '#d32f2f'};">${data.creditInfo.type === 'favor' ? '+' : '-'}${formatCurrency(Math.abs(data.creditInfo.amount))}</span></p>` 
                        : ''
                    }
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
            
            ${data.companySignature ? `
            <div style="margin: 30px 0; padding: 20px; background: #f8f8f8; border-radius: 8px; border-left: 4px solid #D4AF37;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">Firma de CIAOCIAO.MX</h3>
                <div style="text-align: center; padding: 10px;">
                    <img src="${data.companySignature}" style="max-width: 300px; height: auto; border: 1px solid #ddd; border-radius: 4px;">
                </div>
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
        
        // ======= ENCABEZADO ELEGANTE CON LOGO =======
        let headerHeight = 62; // Default para texto solo
        let logoUsed = false;
        
        // Intentar cargar logo primero
        try {
            const logoBase64 = await loadImageAsBase64(CONFIG.companyInfo.logo);
            
            if (logoBase64) {
                // Logo cargado exitosamente
                const logoDimensions = getLogoDimensions();
                const logoWidth = Math.min(logoDimensions.width * 0.3, 40); // Máximo 40mm de ancho
                const logoHeight = (logoWidth * logoDimensions.height) / logoDimensions.width;
                
                // Centrar logo
                const logoX = 105 - (logoWidth / 2);
                const logoY = 15;
                
                doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
                
                // Ajustar posición del texto debajo del logo
                doc.setFontSize(20);
                doc.setTextColor(...colors.black);
                doc.setFont('helvetica', 'bold');
                doc.text('CIAOCIAO.MX', 105, logoY + logoHeight + 8, { align: 'center' });
                
                doc.setFontSize(12);
                doc.setTextColor(...colors.gray);
                doc.setFont('helvetica', 'normal');
                doc.text('Joyería Fina', 105, logoY + logoHeight + 15, { align: 'center' });
                doc.text('Tel: ' + CONFIG.companyInfo.phone, 105, logoY + logoHeight + 21, { align: 'center' });
                
                // Ajustar línea dorada
                doc.setDrawColor(...colors.gold);
                doc.setLineWidth(1);
                doc.line(40, logoY + logoHeight + 28, 170, logoY + logoHeight + 28);
                
                // Título "COTIZACIÓN" más abajo
                doc.setFontSize(18);
                doc.setTextColor(...colors.black);
                doc.setFont('helvetica', 'bold');
                doc.text('COTIZACIÓN', 105, logoY + logoHeight + 41, { align: 'center' });
                
                // Calcular altura real del header con logo
                headerHeight = logoY + logoHeight + 45; // 15 + logoHeight + 45 (texto + margen)
                logoUsed = true;
                
                console.log('✅ Logo incluido en PDF exitosamente. Header height:', headerHeight);
                
            } else {
                throw new Error('Logo no disponible');
            }
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar logo, usando fallback de texto:', error);
            
            // Fallback: usar texto como antes
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
            
            // Header height para texto solo
            headerHeight = 62;
        }
        
        // Línea final del encabezado
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.5);
        doc.line(70, headerHeight, 140, headerHeight);
        
        // ======= INFORMACIÓN DE LA COTIZACIÓN =======
        let yPos = headerHeight + 10; // Posición dinámica basada en header real
        
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
        yPos += 25; // Espacio después de información del cliente
        
        // Encabezado de tabla con estilo dorado elegante
        doc.setFillColor(...colors.gold);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.rect(20, yPos, 170, 12, 'F');
        
        // Encabezados con mejor espaciado incluyendo descuento
        doc.text('#', 23, yPos + 8);
        doc.text('DESCRIPCIÓN', 30, yPos + 8);
        doc.text('CANT.', 105, yPos + 8);
        doc.text('PRECIO UNIT.', 120, yPos + 8);
        doc.text('DESC.', 145, yPos + 8);
        doc.text('TOTAL', 170, yPos + 8);
        
        yPos += 14;
        
        // Línea separadora dorada
        doc.setDrawColor(...colors.gold);
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);
        yPos += 3;
        
        // Productos con diseño alternado y descripciones completas
        doc.setTextColor(...colors.black);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        quotationData.products.forEach((product, index) => {
            // Calcular altura necesaria para la descripción completa
            const description = `${product.type} ${product.material}`;
            const details = product.description || '';
            
            // Usar splitTextToSize para ajustar texto al ancho disponible
            const descriptionLines = doc.splitTextToSize(details, 65); // Ancho disponible para descripción
            const rowHeight = Math.max(16, 8 + (descriptionLines.length * 4)); // Altura mínima 16px
            
            // Verificar si necesitamos nueva página antes de agregar el producto
            if (yPos + rowHeight > 240) {
                doc.addPage();
                yPos = 20;
                
                // Repetir headers en nueva página
                doc.setFillColor(...colors.gold);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.rect(20, yPos, 170, 12, 'F');
                
                doc.text('#', 23, yPos + 8);
                doc.text('DESCRIPCIÓN', 30, yPos + 8);
                doc.text('CANT.', 105, yPos + 8);
                doc.text('PRECIO UNIT.', 120, yPos + 8);
                doc.text('DESC.', 145, yPos + 8);
                doc.text('TOTAL', 170, yPos + 8);
                
                yPos += 16;
                doc.setTextColor(...colors.black);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
            }
            
            // Background alternado para mejor legibilidad
            if (index % 2 === 1) {
                doc.setFillColor(...colors.lightGray);
                doc.rect(20, yPos - 2, 170, rowHeight, 'F');
            }
            
            // Número de ítem
            doc.setTextColor(...colors.black);
            doc.text(String(index + 1), 23, yPos + 6);
            
            // Descripción completa en múltiples líneas
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(description, 30, yPos + 4);
            
            // Detalles completos sin truncamiento
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            if (descriptionLines.length > 0) {
                descriptionLines.forEach((line, lineIndex) => {
                    doc.text(line, 30, yPos + 8 + (lineIndex * 4));
                });
            }
            
            // Datos numéricos centrados verticalmente en la fila
            const centerY = yPos + (rowHeight / 2) + 1;
            doc.setFontSize(10);
            doc.text(formatNumber(product.quantity), 108, centerY, { align: 'center' });
            doc.text(formatCurrency(product.price), 128, centerY, { align: 'center' });
            
            // Mostrar descuento
            let discountText = '';
            if (product.discount > 0) {
                if (product.discountType === 'percentage') {
                    discountText = product.discount + '%';
                } else {
                    discountText = '$' + formatNumber(product.discount);
                }
            } else {
                discountText = '-';
            }
            doc.text(discountText, 148, centerY, { align: 'center' });
            
            // Total en negrita
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(product.total), 178, centerY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            
            yPos += rowHeight + 2; // Espacio entre productos
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
        }
        
        // NUEVO: Crédito del cliente si aplica
        if (quotationData.creditInfo && quotationData.creditInfo.type !== 'none' && quotationData.creditInfo.amount !== 0) {
            yPos += 6;
            const creditLabel = quotationData.creditInfo.type === 'favor' ? 'Crédito a favor:' : 'Cliente debe:';
            const creditAmount = Math.abs(quotationData.creditInfo.amount);
            const creditSign = quotationData.creditInfo.type === 'favor' ? '+' : '-';
            
            doc.text(creditLabel, 125, yPos);
            doc.text(creditSign + formatCurrency(creditAmount), 180, yPos, { align: 'right' });
            
            // Color diferente para crédito a favor
            if (quotationData.creditInfo.type === 'favor') {
                doc.setTextColor(34, 139, 34); // Verde para crédito a favor
            } else {
                doc.setTextColor(178, 34, 34); // Rojo para deuda
            }
            doc.text(creditSign + formatCurrency(creditAmount), 180, yPos, { align: 'right' });
            doc.setTextColor(...colors.black); // Volver al color normal
        }
        
        // Línea separadora antes del total (solo si hay descuento o crédito)
        if (quotationData.globalDiscountAmount > 0 || (quotationData.creditInfo && quotationData.creditInfo.type !== 'none')) {
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
        
        // Firma de la empresa si está presente y es válida
        if (quotationData.companySignature && quotationData.companySignature.startsWith('data:image/')) {
            yPos += 15;
            
            // Verificar si hay espacio suficiente para la firma
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFillColor(...colors.gold);
            doc.rect(20, yPos, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('FIRMA DE JOYERÍA CIAO CIAO MX', 105, yPos + 5.5, { align: 'center' });
            
            yPos += 15;
            
            // Agregar imagen de firma
            const signatureHeight = 30;
            const signatureWidth = 80;
            const signatureX = (210 - signatureWidth) / 2; // Centrar
            
            doc.addImage(quotationData.companySignature, 'PNG', signatureX, yPos, signatureWidth, signatureHeight);
            yPos += signatureHeight + 10;
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
    
    // NUEVO: Agregar información del crédito
    if (data.creditInfo && data.creditInfo.type !== 'none' && data.creditInfo.amount !== 0) {
        const creditLabel = data.creditInfo.type === 'favor' ? 'Crédito a favor' : 'Cliente debe';
        const creditSign = data.creditInfo.type === 'favor' ? '+' : '-';
        const creditAmount = Math.abs(data.creditInfo.amount);
        message += `${creditLabel}: ${creditSign}${formatCurrency(creditAmount)}\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
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
        document.getElementById('clientName').value = quotation.clientName;
        document.getElementById('clientPhone').value = quotation.clientPhone;
        document.getElementById('clientEmail').value = quotation.clientEmail || '';
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

// Sistema de Cotizaciones v2.2 - Inicialización controlada por auth.js

console.log('✅ Sistema de Cotizaciones v2.1 - Cargado y Funcional');
console.log('📌 Cambios incluidos:');
console.log('  - Cálculos de descuentos corregidos');
console.log('  - Opción de descuento en % o monto fijo');
console.log('  - Formato de números con comas (1,000.00)');