/**
 * INITIALIZATION COORDINATOR
 * Sistema maestro de inicialización para el sistema de recibos CIAOCIAO.MX
 * Coordina y sincroniza la inicialización de todos los módulos
 * Elimina race conditions y doble inicialización
 */

// Estado global del sistema
window.SystemState = {
    initialized: false,
    modules: {
        auth: false,
        database: false,
        utils: false,
        camera: false,
        payments: false,
        autocomplete: false,
        smartDropdown: false,
        mainApp: false
    },
    errors: [],
    warnings: [],
    startTime: Date.now()
};

// Logger del sistema
const SystemLogger = {
    logs: [],
    
    log(level, message, data = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            elapsed: Date.now() - window.SystemState.startTime
        };
        
        this.logs.push(entry);
        
        // Console output con colores
        const colors = {
            'INFO': 'color: #2196F3',
            'SUCCESS': 'color: #4CAF50',
            'WARNING': 'color: #FF9800',
            'ERROR': 'color: #F44336',
            'DEBUG': 'color: #9C27B0'
        };
        
        console.log(`%c[${level}] ${message}`, colors[level] || '', data || '');
        
        if (level === 'ERROR') {
            window.SystemState.errors.push(entry);
        } else if (level === 'WARNING') {
            window.SystemState.warnings.push(entry);
        }
    },
    
    getReport() {
        return {
            totalLogs: this.logs.length,
            errors: window.SystemState.errors.length,
            warnings: window.SystemState.warnings.length,
            modules: window.SystemState.modules,
            initialized: window.SystemState.initialized,
            totalTime: Date.now() - window.SystemState.startTime
        };
    }
};

/**
 * Verificador de dependencias CDN
 */
function verifyExternalDependencies() {
    SystemLogger.log('INFO', '🔍 Verificando dependencias externas...');
    
    const dependencies = {
        jsPDF: {
            check: () => typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined',
            critical: true,
            fallback: null
        },
        html2canvas: {
            check: () => typeof window.html2canvas === 'function',
            critical: true,
            fallback: null
        },
        SignaturePad: {
            check: () => typeof window.SignaturePad === 'function',
            critical: true,
            fallback: null
        }
    };
    
    let allLoaded = true;
    let criticalMissing = false;
    
    for (const [name, dep] of Object.entries(dependencies)) {
        if (dep.check()) {
            SystemLogger.log('SUCCESS', `✅ ${name} cargado correctamente`);
        } else {
            SystemLogger.log('ERROR', `❌ ${name} NO está disponible`);
            allLoaded = false;
            if (dep.critical) {
                criticalMissing = true;
            }
        }
    }
    
    if (criticalMissing) {
        SystemLogger.log('ERROR', '⚠️ Dependencias críticas faltantes - algunas funciones no estarán disponibles');
    }
    
    return allLoaded;
}

/**
 * Verificador de elementos DOM requeridos
 */
function verifyDOMElements() {
    SystemLogger.log('INFO', '🔍 Verificando elementos DOM...');
    
    const requiredElements = [
        'receiptForm',
        'receiptNumber',
        'receiptDate',
        'clientName',
        'clientPhone',
        'previewBtn',
        'generatePdfBtn',
        'shareWhatsappBtn',
        'historyBtn',
        'signatureCanvas'
    ];
    
    const missingElements = [];
    
    for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
            SystemLogger.log('WARNING', `⚠️ Elemento faltante: ${elementId}`);
        }
    }
    
    if (missingElements.length === 0) {
        SystemLogger.log('SUCCESS', '✅ Todos los elementos DOM requeridos encontrados');
        return true;
    } else {
        SystemLogger.log('ERROR', `❌ ${missingElements.length} elementos DOM faltantes`, missingElements);
        return false;
    }
}

/**
 * Inicializador de módulos base
 */
async function initializeBaseModules() {
    SystemLogger.log('INFO', '🚀 Inicializando módulos base...');
    
    try {
        // Verificar que los módulos existan
        if (typeof ReceiptDatabase !== 'undefined') {
            window.receiptDB = new ReceiptDatabase();
            window.SystemState.modules.database = true;
            SystemLogger.log('SUCCESS', '✅ Base de datos inicializada');
        } else {
            SystemLogger.log('ERROR', '❌ ReceiptDatabase no está definida');
        }
        
        if (typeof CameraManager !== 'undefined') {
            window.cameraManager = new CameraManager();
            window.SystemState.modules.camera = true;
            SystemLogger.log('SUCCESS', '✅ Cámara inicializada');
        } else {
            SystemLogger.log('ERROR', '❌ CameraManager no está definida');
        }
        
        if (typeof PaymentManager !== 'undefined') {
            window.paymentManager = new PaymentManager();
            window.SystemState.modules.payments = true;
            SystemLogger.log('SUCCESS', '✅ Sistema de pagos inicializado');
        } else {
            SystemLogger.log('ERROR', '❌ PaymentManager no está definida');
        }
        
        if (typeof window.utils !== 'undefined') {
            window.SystemState.modules.utils = true;
            SystemLogger.log('SUCCESS', '✅ Utilidades disponibles');
        } else {
            SystemLogger.log('ERROR', '❌ Utils no está disponible');
        }
        
    } catch (error) {
        SystemLogger.log('ERROR', '❌ Error inicializando módulos base', error);
        throw error;
    }
}

/**
 * Wrapper seguro para event listeners
 */
window.safeAddEventListener = function(elementId, event, handler, options = {}) {
    const maxRetries = options.maxRetries || 5;
    const retryDelay = options.retryDelay || 500;
    let retryCount = 0;
    
    function attemptAttach() {
        try {
            const element = document.getElementById(elementId);
            
            if (!element) {
                retryCount++;
                if (retryCount < maxRetries) {
                    SystemLogger.log('WARNING', `⚠️ Elemento ${elementId} no encontrado, reintento ${retryCount}/${maxRetries}`);
                    setTimeout(attemptAttach, retryDelay);
                } else {
                    SystemLogger.log('ERROR', `❌ No se pudo encontrar elemento ${elementId} después de ${maxRetries} intentos`);
                }
                return;
            }
            
            // Wrapper con manejo de errores
            const safeHandler = function(event) {
                try {
                    handler(event);
                } catch (error) {
                    SystemLogger.log('ERROR', `❌ Error en handler de ${elementId}`, error);
                    
                    // Mostrar notificación al usuario si utils está disponible
                    if (window.utils && window.utils.showNotification) {
                        window.utils.showNotification('Error procesando la acción. Por favor intente de nuevo.', 'error');
                    } else {
                        alert('Error procesando la acción. Por favor intente de nuevo.');
                    }
                    
                    // Intentar fallback si está disponible
                    if (options.fallback) {
                        try {
                            options.fallback(error);
                        } catch (fallbackError) {
                            SystemLogger.log('ERROR', '❌ Error en fallback', fallbackError);
                        }
                    }
                }
            };
            
            element.addEventListener(event, safeHandler);
            SystemLogger.log('SUCCESS', `✅ Event listener agregado: ${elementId}.${event}`);
            
        } catch (error) {
            SystemLogger.log('ERROR', `❌ Error agregando event listener a ${elementId}`, error);
        }
    }
    
    attemptAttach();
};

/**
 * Sistema de re-inicialización de emergencia
 */
window.emergencyReinitialize = function() {
    SystemLogger.log('WARNING', '🚨 RE-INICIALIZACIÓN DE EMERGENCIA ACTIVADA');
    
    try {
        // Re-verificar dependencias
        verifyExternalDependencies();
        
        // Re-verificar DOM
        verifyDOMElements();
        
        // Re-inicializar módulos base
        initializeBaseModules();
        
        // Re-configurar event listeners
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
            SystemLogger.log('SUCCESS', '✅ Event listeners re-configurados');
        }
        
        // Re-inicializar firma digital
        if (typeof initializeSignaturePad === 'function') {
            initializeSignaturePad();
            SystemLogger.log('SUCCESS', '✅ Firma digital re-inicializada');
        }
        
        SystemLogger.log('SUCCESS', '✅ Re-inicialización completada');
        
        // Mostrar notificación
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification('Sistema re-inicializado correctamente', 'success');
        }
        
    } catch (error) {
        SystemLogger.log('ERROR', '❌ Error en re-inicialización de emergencia', error);
    }
};

/**
 * Health Check System - Monitoreo automático
 */
function startHealthMonitoring() {
    SystemLogger.log('INFO', '🏥 Iniciando monitoreo de salud del sistema...');
    
    setInterval(() => {
        const health = {
            buttons: checkButtonsHealth(),
            database: checkDatabaseHealth(),
            signatures: checkSignatureHealth(),
            memory: checkMemoryHealth()
        };
        
        // Auto-reparación si es necesario
        if (!health.buttons) {
            SystemLogger.log('WARNING', '🔧 Detectado problema con botones - auto-reparando...');
            repairButtons();
        }
        
        if (!health.database && window.receiptDB) {
            SystemLogger.log('WARNING', '🔧 Detectado problema con base de datos - re-inicializando...');
            window.receiptDB = new ReceiptDatabase();
        }
        
    }, 10000); // Cada 10 segundos
}

function checkButtonsHealth() {
    const buttons = [
        { id: 'previewBtn', handler: 'showPreview' },
        { id: 'generatePdfBtn', handler: 'generatePDF' },
        { id: 'shareWhatsappBtn', handler: 'shareWhatsApp' },
        { id: 'historyBtn', handler: 'showHistory' }
    ];
    
    let healthyButtons = 0;
    for (const btnConfig of buttons) {
        const btn = document.getElementById(btnConfig.id);
        const handler = window[btnConfig.handler];
        
        if (!btn) {
            SystemLogger.log('WARNING', `⚠️ Button ${btnConfig.id} not found in DOM`);
            continue;
        }
        
        if (typeof handler !== 'function') {
            SystemLogger.log('WARNING', `⚠️ Handler ${btnConfig.handler} not available`);
            continue;
        }
        
        // Check if button has event listener attached
        const hasOnClick = typeof btn.onclick === 'function';
        if (hasOnClick) {
            healthyButtons++;
        } else {
            SystemLogger.log('WARNING', `⚠️ Button ${btnConfig.id} has no onclick handler`);
        }
    }
    
    const isHealthy = healthyButtons >= buttons.length;
    SystemLogger.log(isHealthy ? 'SUCCESS' : 'WARNING', 
        `Button health: ${healthyButtons}/${buttons.length} buttons functional`);
    
    return isHealthy;
}

function checkDatabaseHealth() {
    try {
        return window.receiptDB && typeof window.receiptDB.getAllReceipts === 'function';
    } catch {
        return false;
    }
}

function checkSignatureHealth() {
    try {
        return window.signaturePad && typeof window.signaturePad.clear === 'function';
    } catch {
        return false;
    }
}

function checkMemoryHealth() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percentage = (used / limit) * 100;
        
        if (percentage > 90) {
            SystemLogger.log('WARNING', `⚠️ Uso de memoria alto: ${percentage.toFixed(2)}%`);
            return false;
        }
    }
    return true;
}

function repairButtons() {
    SystemLogger.log('INFO', '🔧 Iniciando reparación automática de botones...');
    
    const buttonConfigs = [
        { id: 'previewBtn', handler: 'showPreview', label: 'vista previa' },
        { id: 'generatePdfBtn', handler: 'generatePDF', label: 'generar PDF' },
        { id: 'shareWhatsappBtn', handler: 'shareWhatsApp', label: 'compartir WhatsApp' },
        { id: 'historyBtn', handler: 'showHistory', label: 'historial' }
    ];
    
    let repaired = 0;
    let failed = 0;
    
    buttonConfigs.forEach(config => {
        try {
            const btn = document.getElementById(config.id);
            const handler = window[config.handler];
            
            if (!btn) {
                SystemLogger.log('ERROR', `❌ Botón ${config.label} (${config.id}) no encontrado`);
                failed++;
                return;
            }
            
            if (typeof handler !== 'function') {
                SystemLogger.log('ERROR', `❌ Handler ${config.handler} no disponible para ${config.label}`);
                failed++;
                return;
            }
            
            // Clear any existing handlers and set new one
            btn.onclick = null;
            btn.onclick = handler;
            
            // Verify the repair worked
            if (typeof btn.onclick === 'function') {
                SystemLogger.log('SUCCESS', `✅ Botón ${config.label} reparado correctamente`);
                repaired++;
            } else {
                SystemLogger.log('ERROR', `❌ Fallo reparando ${config.label}`);
                failed++;
            }
            
        } catch (error) {
            SystemLogger.log('ERROR', `❌ Error reparando ${config.label}:`, error);
            failed++;
        }
    });
    
    SystemLogger.log('INFO', `🔧 Reparación completada: ${repaired} exitosas, ${failed} fallidas`);
    
    // If most buttons failed, try calling setupEventListeners
    if (failed > repaired && typeof window.setupEventListeners === 'function') {
        SystemLogger.log('WARNING', '🔄 Mayoría de reparaciones fallaron, re-ejecutando setupEventListeners...');
        try {
            window.setupEventListeners();
        } catch (error) {
            SystemLogger.log('ERROR', '❌ Error re-ejecutando setupEventListeners:', error);
        }
    }
}

/**
 * INICIALIZADOR MAESTRO
 * Coordina toda la inicialización del sistema
 */
window.InitializationCoordinator = {
    async initialize() {
        SystemLogger.log('INFO', '🚀 INICIANDO COORDINADOR DE INICIALIZACIÓN MAESTRO');
        
        try {
            // Paso 1: Verificar dependencias externas
            const depsLoaded = verifyExternalDependencies();
            if (!depsLoaded) {
                SystemLogger.log('WARNING', '⚠️ Algunas dependencias no cargaron - continuando con funcionalidad limitada');
            }
            
            // Paso 2: Esperar a que el DOM esté completamente listo
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Paso 3: Verificar elementos DOM
            const domReady = verifyDOMElements();
            if (!domReady) {
                SystemLogger.log('WARNING', '⚠️ Algunos elementos DOM faltantes - funcionalidad puede estar limitada');
            }
            
            // Paso 4: Inicializar módulos base
            await initializeBaseModules();
            
            // Paso 5: Inicializar aplicación principal si está disponible
            if (typeof window.initializeApp === 'function') {
                SystemLogger.log('INFO', '🎯 Llamando a initializeApp()...');
                window.initializeApp();
                window.SystemState.modules.mainApp = true;
            } else {
                SystemLogger.log('ERROR', '❌ initializeApp() no está disponible');
            }
            
            // Paso 6: Iniciar monitoreo de salud
            startHealthMonitoring();
            
            // Marcar sistema como inicializado
            window.SystemState.initialized = true;
            SystemLogger.log('SUCCESS', '✅ SISTEMA COMPLETAMENTE INICIALIZADO');
            
            // Mostrar reporte final
            const report = SystemLogger.getReport();
            console.log('📊 REPORTE DE INICIALIZACIÓN:', report);
            
            // Notificar éxito si utils está disponible
            if (window.utils && window.utils.showNotification) {
                window.utils.showNotification('Sistema de recibos cargado correctamente', 'success');
            }
            
        } catch (error) {
            SystemLogger.log('ERROR', '❌ ERROR CRÍTICO EN INICIALIZACIÓN', error);
            
            // Intentar recuperación de emergencia
            setTimeout(() => {
                SystemLogger.log('WARNING', '🔄 Intentando recuperación automática...');
                window.emergencyReinitialize();
            }, 2000);
        }
    },
    
    // Método para verificar estado
    getStatus() {
        return {
            initialized: window.SystemState.initialized,
            modules: window.SystemState.modules,
            errors: window.SystemState.errors.length,
            warnings: window.SystemState.warnings.length,
            uptime: Date.now() - window.SystemState.startTime
        };
    },
    
    // Método para obtener logs
    getLogs() {
        return SystemLogger.logs;
    },
    
    // Método para limpiar errores
    clearErrors() {
        window.SystemState.errors = [];
        SystemLogger.log('INFO', '🧹 Errores limpiados');
    }
};

// Exponer globalmente para debugging
window.SystemLogger = SystemLogger;

console.log('📦 Initialization Coordinator cargado y listo');