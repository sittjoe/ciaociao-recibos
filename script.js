// script.js - Archivo principal integrado con todos los módulos
// VERSIÓN MEJORADA - Sin DOMContentLoaded, coordinado por initialization-coordinator.js

// Variables globales
let signaturePad;
let companySignaturePad; // Firma de la empresa
let receiptCounter = parseInt(localStorage.getItem('receiptCounter') || '1');
let receiptDB;
let cameraManager;
let paymentManager;

// Las funciones se exportan globalmente inmediatamente para que estén disponibles
// cuando auth.js las necesite

// Función principal de inicialización - Llamada por initialization-coordinator.js
window.initializeApp = function() {
    try {
        // Usar el logger del sistema si está disponible
        const log = window.SystemLogger ? window.SystemLogger.log.bind(window.SystemLogger) : console.log;
        log('INFO', '🚀 Iniciando aplicación de recibos ciaociao.mx...');
        
        // CROSS-BROWSER COMPATIBILITY: Verificar compatibilidad y aplicar fixes
        try {
            const compatibilityReport = CrossBrowserSupport.displayCompatibilityReport();
            
            // Aplicar fixes específicos del navegador
            CrossBrowserSupport.applyBrowserSpecificFixes();
            
            // Verificar compatibilidad mínima
            if (!compatibilityReport.browser.supported || compatibilityReport.compatibilityScore < 70) {
                const message = `⚠️ ADVERTENCIA DE COMPATIBILIDAD:\n\n` +
                    `Navegador: ${compatibilityReport.browser.name} ${compatibilityReport.browser.version}\n` +
                    `Puntuación de compatibilidad: ${compatibilityReport.compatibilityScore}%\n\n` +
                    `Recomendaciones:\n${compatibilityReport.recommendations.join('\n')}\n\n` +
                    `¿Desea continuar de todos modos?`;
                
                if (!confirm(message)) {
                    throw new Error('Usuario canceló debido a problemas de compatibilidad');
                }
            }
            
            // Mostrar notificación de compatibilidad si es necesario
            if (compatibilityReport.compatibilityScore < 90) {
                utils?.showNotification?.(`Compatibilidad parcial detectada (${compatibilityReport.compatibilityScore}%)`, 'warning');
            }
            
            log('INFO', `✅ Verificación de compatibilidad completada: ${compatibilityReport.compatibilityScore}%`);
            
        } catch (compatibilityError) {
            console.error('❌ Error en verificación de compatibilidad:', compatibilityError);
            // Continuar sin verificación si hay error
        }
        
        // CRITICAL: Verificar dependencias externas
        console.log('📦 Estado de dependencias:');
        console.log('  - jsPDF:', (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) ? '✅ Cargado' : '❌ NO DISPONIBLE');
        console.log('  - html2canvas:', typeof window.html2canvas !== 'undefined' ? '✅ Cargado' : '❌ NO DISPONIBLE');
        console.log('  - SignaturePad:', typeof window.SignaturePad !== 'undefined' ? '✅ Cargado' : '❌ NO DISPONIBLE');
        
        // Verificar que no se haya inicializado ya
        if (window.appInitialized) {
            log('WARNING', '⚠️ La aplicación ya fue inicializada, evitando doble inicialización');
            return;
        }
        
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
        
        // Marcar como inicializado
        window.appInitialized = true;
        log('SUCCESS', '✅ Aplicación de recibos inicializada correctamente');
        
    } catch (error) {
        if (window.SystemLogger) {
            window.SystemLogger.log('ERROR', '❌ Error inicializando aplicación', error);
        } else {
            console.error('❌ Error inicializando aplicación:', error);
        }
        
        // No mostrar alert molesto, usar notificación si está disponible
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification('Error iniciando la aplicación. Recargando...', 'error');
            setTimeout(() => location.reload(), 3000);
        }
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
    console.log('🔢 generateReceiptNumber() LLAMADA - Generando número de recibo...');
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Obtener contador del día actual para evitar duplicados
    const dayKey = `${year}${month}${day}`;
    const dailyCounter = parseInt(localStorage.getItem(`receiptCounter_${dayKey}`) || '1');
    
    const number = String(dailyCounter).padStart(3, '0');
    const receiptNumber = `CIAO-${year}${month}${day}-${number}`;
    
    const receiptNumberElement = document.getElementById('receiptNumber');
    if (receiptNumberElement) {
        receiptNumberElement.value = receiptNumber;
        console.log('✅ Número de recibo establecido:', receiptNumber);
    } else {
        console.error('❌ Elemento receiptNumber no encontrado en el DOM');
    }
    
    // Guardar contador actualizado para este día
    localStorage.setItem(`receiptCounter_${dayKey}`, (dailyCounter + 1).toString());
}

function initializeSignaturePad() {
    try {
        console.log('🔄 Iniciando inicialización de firmas digitales...');
        
        // CRITICAL: Verificar disponibilidad de SignaturePad library
        if (typeof SignaturePad === 'undefined') {
            console.error('❌ CRITICAL: SignaturePad library not loaded');
            console.log('🔄 Esperando carga de SignaturePad...');
            
            // Retry mechanism for SignaturePad availability
            let retryCount = 0;
            const maxRetries = 10;
            
            const checkSignaturePadAvailability = () => {
                if (typeof SignaturePad !== 'undefined') {
                    console.log(`✅ SignaturePad available after ${retryCount} retries`);
                    initializeSignaturePad(); // Recursive call once library is available
                    return;
                }
                
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`⏳ Retry ${retryCount}/${maxRetries} waiting for SignaturePad...`);
                    setTimeout(checkSignaturePadAvailability, 500);
                } else {
                    console.error('❌ SignaturePad library failed to load after max retries');
                    console.warn('⚠️ Signature functionality will not be available');
                    if (window.utils && utils.showNotification) {
                        utils.showNotification('Error: Funcionalidad de firma no disponible', 'error');
                    }
                }
            };
            
            checkSignaturePadAvailability();
            return; // Exit early to prevent errors
        }
        
        console.log('✅ SignaturePad library confirmed available');
        
        // Configuración común para ambas firmas
        const signatureConfig = {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            velocityFilterWeight: 0.7,
            minWidth: 0.5,
            maxWidth: 2.5
        };
        
        // Enhanced canvas visibility check - MEJORADO según reporte Playwright
        function isCanvasReady(canvas) {
            if (!canvas) {
                console.log('❌ Canvas element is null/undefined');
                return false;
            }
            
            // Verificar que esté en el DOM
            if (!document.contains(canvas)) {
                console.log('❌ Canvas not attached to DOM');
                return false;
            }
            
            // Verificar visibilidad básica
            if (canvas.offsetParent === null) {
                console.log('❌ Canvas offsetParent is null (element not visible)');
                return false;
            }
            
            // Verificar dimensiones
            if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
                console.log(`❌ Canvas has zero dimensions: ${canvas.offsetWidth}x${canvas.offsetHeight}`);
                return false;
            }
            
            // Verificar estilos computados
            const computedStyle = getComputedStyle(canvas);
            if (computedStyle.display === 'none') {
                console.log('❌ Canvas display is none');
                return false;
            }
            
            if (computedStyle.visibility === 'hidden') {
                console.log('❌ Canvas visibility is hidden');
                return false;
            }
            
            // Verificar que tenga contexto 2D disponible
            try {
                const context = canvas.getContext('2d');
                if (!context) {
                    console.log('❌ Canvas 2D context is not available');
                    return false;
                }
            } catch (error) {
                console.log('❌ Error getting canvas 2D context:', error);
                return false;
            }
            
            console.log(`✅ Canvas ready: ${canvas.offsetWidth}x${canvas.offsetHeight}, visible, with 2D context`);
            return true;
        }
        
        // Firma del cliente con verificación robusta mejorada
        const clientCanvas = document.getElementById('signatureCanvas');
        if (clientCanvas) {
            if (isCanvasReady(clientCanvas)) {
                try {
                    signaturePad = new SignaturePad(clientCanvas, signatureConfig);
                    console.log('✅ Firma del cliente inicializada correctamente');
                } catch (error) {
                    console.error('❌ Error creating client SignaturePad:', error);
                }
            } else {
                console.log('🔄 Canvas de cliente no listo, configurando retry mejorado...');
                
                // Enhanced retry with multiple checks
                let clientRetries = 0;
                const maxClientRetries = 5;
                
                const retryClientSignature = () => {
                    if (isCanvasReady(clientCanvas)) {
                        try {
                            signaturePad = new SignaturePad(clientCanvas, signatureConfig);
                            console.log(`✅ Firma del cliente inicializada (retry ${clientRetries + 1})`);
                        } catch (error) {
                            console.error('❌ Error in client signature retry:', error);
                        }
                    } else if (clientRetries < maxClientRetries) {
                        clientRetries++;
                        console.log(`⏳ Client signature retry ${clientRetries}/${maxClientRetries}`);
                        setTimeout(retryClientSignature, 750);
                    } else {
                        console.warn('⚠️ Client signature initialization failed after max retries');
                    }
                };
                
                setTimeout(retryClientSignature, 500);
            }
        } else {
            console.warn('⚠️ Client signature canvas not found in DOM');
        }
        
        // Firma de la empresa - inicialización mejorada
        const companyCanvas = document.getElementById('companySignatureCanvas');
        if (companyCanvas) {
            if (isCanvasReady(companyCanvas)) {
                initializeCompanySignature(companyCanvas, signatureConfig);
            } else {
                console.log('🔄 Canvas de empresa no listo, configurando retry...');
                
                let companyRetries = 0;
                const maxCompanyRetries = 5;
                
                const retryCompanySignature = () => {
                    if (isCanvasReady(companyCanvas)) {
                        initializeCompanySignature(companyCanvas, signatureConfig);
                        console.log(`✅ Firma de empresa inicializada (retry ${companyRetries + 1})`);
                    } else if (companyRetries < maxCompanyRetries) {
                        companyRetries++;
                        console.log(`⏳ Company signature retry ${companyRetries}/${maxCompanyRetries}`);
                        setTimeout(retryCompanySignature, 750);
                    } else {
                        console.warn('⚠️ Company signature initialization failed after max retries');
                    }
                };
                
                setTimeout(retryCompanySignature, 500);
            }
        } else {
            console.warn('⚠️ Company signature canvas not found in DOM');
        }
        
        // ENHANCED CONTEXT LOSS HANDLING FOR MOBILE DEVICES
        // =================================================
        setupCanvasContextLossHandling();
        
        // Configurar resize con debounce mejorado
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                try {
                    resizeCanvas();
                    console.log('🔄 Canvas resize completed');
                } catch (error) {
                    console.error('❌ Error in canvas resize:', error);
                }
            }, 250);
        };
        
        window.addEventListener('resize', debouncedResize);
        
        // Inicializar dimensiones con retry
        setTimeout(() => {
            try {
                resizeCanvas();
                console.log('✅ Initial canvas resize completed');
            } catch (error) {
                console.error('❌ Error in initial canvas resize:', error);
            }
        }, 100);
        
        // VALIDACIÓN POST-INICIALIZACIÓN - según recomendaciones Playwright
        setTimeout(() => {
            validateSignatureInitialization();
        }, 1000);
        
        console.log('✅ Sistema de firmas digitales configurado completamente');
    } catch (error) {
        console.error('❌ Error crítico inicializando firma digital:', error);
        // Create basic fallback functionality
        window.signaturePad = null;
        window.companySignaturePad = null;
        console.warn('⚠️ Signature pads set to null - functionality disabled');
    }
}

// VALIDACIÓN POST-INICIALIZACIÓN - implementada según reporte Playwright
function validateSignatureInitialization() {
    console.log('🔍 Iniciando validación post-inicialización de firmas...');
    
    const validationResults = {
        client: { initialized: false, functional: false, issues: [] },
        company: { initialized: false, functional: false, issues: [] },
        overall: { success: false, criticalIssues: [] }
    };
    
    try {
        // Validar SignaturePad del cliente
        if (typeof signaturePad !== 'undefined' && signaturePad) {
            validationResults.client.initialized = true;
            
            // Test funcionalidad básica
            try {
                const isEmpty = signaturePad.isEmpty();
                const canvas = signaturePad.canvas;
                
                if (canvas && canvas.offsetParent !== null) {
                    // Test toDataURL
                    const testDataUrl = signaturePad.toDataURL();
                    if (testDataUrl && testDataUrl.startsWith('data:image/')) {
                        validationResults.client.functional = true;
                        console.log('✅ SignaturePad cliente: completamente funcional');
                    } else {
                        validationResults.client.issues.push('toDataURL no funciona correctamente');
                    }
                } else {
                    validationResults.client.issues.push('Canvas no es visible');
                }
            } catch (testError) {
                validationResults.client.issues.push(`Error en test funcional: ${testError.message}`);
            }
        } else {
            validationResults.client.issues.push('SignaturePad no está inicializado');
        }
        
        // Validar SignaturePad de empresa (opcional)
        if (typeof companySignaturePad !== 'undefined' && companySignaturePad) {
            validationResults.company.initialized = true;
            
            try {
                const isEmpty = companySignaturePad.isEmpty();
                const canvas = companySignaturePad.canvas;
                
                if (canvas && canvas.offsetParent !== null) {
                    const testDataUrl = companySignaturePad.toDataURL();
                    if (testDataUrl && testDataUrl.startsWith('data:image/')) {
                        validationResults.company.functional = true;
                        console.log('✅ SignaturePad empresa: completamente funcional');
                    } else {
                        validationResults.company.issues.push('toDataURL no funciona correctamente');
                    }
                } else {
                    validationResults.company.issues.push('Canvas no es visible');
                }
            } catch (testError) {
                validationResults.company.issues.push(`Error en test funcional: ${testError.message}`);
            }
        } else {
            console.log('ℹ️ SignaturePad empresa no presente (esto es normal)');
        }
        
        // Evaluación general
        if (validationResults.client.initialized && validationResults.client.functional) {
            validationResults.overall.success = true;
            console.log('✅ Validación post-inicialización: EXITOSA');
        } else {
            validationResults.overall.criticalIssues.push('SignaturePad cliente no está completamente funcional');
            console.warn('⚠️ Validación post-inicialización: PROBLEMAS DETECTADOS');
        }
        
        // Log de resultados detallados
        if (validationResults.client.issues.length > 0) {
            console.warn('⚠️ Problemas en firma cliente:', validationResults.client.issues);
        }
        
        if (validationResults.company.issues.length > 0) {
            console.warn('⚠️ Problemas en firma empresa:', validationResults.company.issues);
        }
        
        // Almacenar resultados para depuración
        window.signatureValidation = validationResults;
        
    } catch (error) {
        console.error('❌ Error durante validación post-inicialización:', error);
        validationResults.overall.criticalIssues.push(`Error en validación: ${error.message}`);
    }
    
    return validationResults;
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

// ENHANCED CANVAS CONTEXT LOSS HANDLING SYSTEM
// ============================================
// Critical for mobile devices where browsers reclaim canvas memory
function setupCanvasContextLossHandling() {
    console.log('🛡️ Configurando manejo avanzado de pérdida de contexto canvas para móviles...');
    
    // Variables globales para backup de firmas
    window.signatureBackup = {
        client: null,
        company: null,
        lastBackupTime: null,
        autoBackupInterval: null,
        contextLossCount: 0
    };
    
    // Configuración de canvas context loss handling
    const canvasIds = [
        { id: 'signatureCanvas', pad: () => signaturePad, name: 'client' },
        { id: 'companySignatureCanvas', pad: () => companySignaturePad, name: 'company' }
    ];
    
    canvasIds.forEach(canvasInfo => {
        const canvas = document.getElementById(canvasInfo.id);
        if (canvas) {
            setupContextLossForCanvas(canvas, canvasInfo);
        }
    });
    
    // Auto-backup cada 30 segundos mientras hay firmas activas
    window.signatureBackup.autoBackupInterval = setInterval(() => {
        backupSignatures('auto');
    }, 30000);
    
    // Backup al cambiar de pestaña (Page Visibility API)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            backupSignatures('visibility');
            console.log('💾 Backup por cambio de visibilidad');
        } else {
            // Verificar integridad de canvas al regresar
            setTimeout(() => {
                verifyCanvasIntegrity();
            }, 500);
        }
    });
    
    // Backup antes de que se descargue la página
    window.addEventListener('beforeunload', () => {
        backupSignatures('beforeunload');
    });
    
    // Detectar memory pressure en mobile devices
    if ('memory' in performance) {
        const checkMemoryPressure = () => {
            const memInfo = performance.memory;
            const memoryUsageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
            
            if (memoryUsageRatio > 0.85) {
                console.warn('⚠️ Alta presión de memoria detectada. Realizando backup preventivo...');
                backupSignatures('memory_pressure');
            }
        };
        
        // Check memory pressure every 2 minutes
        setInterval(checkMemoryPressure, 120000);
    }
    
    console.log('✅ Sistema de manejo de pérdida de contexto configurado');
}

function setupContextLossForCanvas(canvas, canvasInfo) {
    console.log(`🔧 Configurando context loss handling para canvas: ${canvasInfo.id}`);
    
    // Context Lost Event - Critical for mobile browsers
    canvas.addEventListener('webglcontextlost', (event) => {
        console.warn(`🚨 WebGL context lost detectado en ${canvasInfo.name} canvas`);
        event.preventDefault();
        handleContextLoss(canvasInfo);
    });
    
    // Context Restored Event
    canvas.addEventListener('webglcontextrestored', (event) => {
        console.log(`🔄 WebGL context restored en ${canvasInfo.name} canvas`);
        handleContextRestore(canvasInfo);
    });
    
    // Canvas context lost (2D context)
    canvas.addEventListener('contextlost', (event) => {
        console.warn(`🚨 2D Context lost detectado en ${canvasInfo.name} canvas`);
        event.preventDefault();
        handleContextLoss(canvasInfo);
    });
    
    // Canvas context restored (2D context)
    canvas.addEventListener('contextrestored', (event) => {
        console.log(`🔄 2D Context restored en ${canvasInfo.name} canvas`);
        handleContextRestore(canvasInfo);
    });
    
    // Additional mobile-specific detection
    // Monitor for sudden canvas dimension changes (indicates context loss)
    let lastCanvasState = {
        width: canvas.width,
        height: canvas.height,
        hasContent: false
    };
    
    const contextMonitor = setInterval(() => {
        if (canvas.width !== lastCanvasState.width || 
            canvas.height !== lastCanvasState.height) {
            
            // Dimensions changed - possible context loss
            const pad = canvasInfo.pad();
            if (pad && lastCanvasState.hasContent && pad.isEmpty()) {
                console.warn(`🚨 Posible pérdida de contexto detectada en ${canvasInfo.name} - dimensiones cambiaron y firma se perdió`);
                handleContextLoss(canvasInfo, 'dimension_change');
            }
        }
        
        const pad = canvasInfo.pad();
        lastCanvasState = {
            width: canvas.width,
            height: canvas.height,
            hasContent: pad ? !pad.isEmpty() : false
        };
    }, 5000);
    
    // Store monitor reference for cleanup
    canvas._contextMonitor = contextMonitor;
}

function handleContextLoss(canvasInfo, reason = 'unknown') {
    console.error(`❌ Context loss manejado para ${canvasInfo.name} canvas - Razón: ${reason}`);
    
    window.signatureBackup.contextLossCount++;
    
    // Backup immediate antes de que se pierda completamente
    const pad = canvasInfo.pad();
    if (pad && !pad.isEmpty()) {
        try {
            const signatureData = pad.toDataURL();
            window.signatureBackup[canvasInfo.name] = {
                data: signatureData,
                timestamp: Date.now(),
                reason: reason
            };
            
            // Persistent backup en localStorage
            localStorage.setItem(`signature_emergency_backup_${canvasInfo.name}`, JSON.stringify({
                data: signatureData,
                timestamp: Date.now(),
                reason: reason,
                receiptNumber: document.getElementById('receiptNumber')?.value || 'unknown'
            }));
            
            console.log(`💾 Emergency backup realizado para ${canvasInfo.name} signature`);
        } catch (error) {
            console.error(`❌ Error en emergency backup de ${canvasInfo.name}:`, error);
        }
    }
    
    // Notificar al usuario
    if (window.utils && utils.showNotification) {
        utils.showNotification(
            `⚠️ Problema detectado con firma ${canvasInfo.name === 'client' ? 'del cliente' : 'de empresa'}. Se ha guardado un respaldo.`, 
            'warning'
        );
    }
}

function handleContextRestore(canvasInfo) {
    console.log(`🔄 Restaurando contexto para ${canvasInfo.name} canvas`);
    
    try {
        // Intentar restaurar desde backup inmediato
        const backup = window.signatureBackup[canvasInfo.name];
        if (backup && backup.data) {
            restoreSignatureFromBackup(canvasInfo, backup.data);
            console.log(`✅ Firma ${canvasInfo.name} restaurada desde backup inmediato`);
            return;
        }
        
        // Intentar restaurar desde localStorage
        const emergencyBackup = localStorage.getItem(`signature_emergency_backup_${canvasInfo.name}`);
        if (emergencyBackup) {
            try {
                const backupData = JSON.parse(emergencyBackup);
                if (backupData.data) {
                    restoreSignatureFromBackup(canvasInfo, backupData.data);
                    console.log(`✅ Firma ${canvasInfo.name} restaurada desde emergency backup`);
                    return;
                }
            } catch (parseError) {
                console.error('Error parsing emergency backup:', parseError);
            }
        }
        
        console.warn(`⚠️ No se encontró backup para restaurar ${canvasInfo.name} signature`);
        
    } catch (error) {
        console.error(`❌ Error restaurando contexto de ${canvasInfo.name}:`, error);
    }
}

function restoreSignatureFromBackup(canvasInfo, signatureData) {
    try {
        const canvas = document.getElementById(canvasInfo.id);
        if (!canvas) {
            console.error(`Canvas ${canvasInfo.id} no encontrado`);
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            try {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
                
                // Notificar restauración exitosa
                if (window.utils && utils.showNotification) {
                    utils.showNotification(
                        `✅ Firma ${canvasInfo.name === 'client' ? 'del cliente' : 'de empresa'} restaurada exitosamente`, 
                        'success'
                    );
                }
                
                console.log(`✅ Firma ${canvasInfo.name} restaurada visualmente`);
            } catch (drawError) {
                console.error(`Error dibujando firma restaurada de ${canvasInfo.name}:`, drawError);
            }
        };
        
        img.onerror = () => {
            console.error(`Error cargando imagen de backup para ${canvasInfo.name}`);
        };
        
        img.src = signatureData;
        
    } catch (error) {
        console.error(`Error en restoreSignatureFromBackup para ${canvasInfo.name}:`, error);
    }
}

function backupSignatures(trigger = 'manual') {
    try {
        let backupCount = 0;
        
        // Backup firma del cliente
        if (signaturePad && !signaturePad.isEmpty()) {
            try {
                const clientData = signaturePad.toDataURL();
                window.signatureBackup.client = {
                    data: clientData,
                    timestamp: Date.now(),
                    trigger: trigger
                };
                backupCount++;
                
                // Backup persistente cada 5 minutos
                const lastPersistentBackup = localStorage.getItem('last_signature_backup_client_time');
                if (!lastPersistentBackup || (Date.now() - parseInt(lastPersistentBackup)) > 300000) {
                    localStorage.setItem('signature_persistent_backup_client', clientData);
                    localStorage.setItem('last_signature_backup_client_time', Date.now().toString());
                }
                
            } catch (error) {
                console.error('Error backing up client signature:', error);
            }
        }
        
        // Backup firma de empresa
        if (companySignaturePad && !companySignaturePad.isEmpty()) {
            try {
                const companyData = companySignaturePad.toDataURL();
                window.signatureBackup.company = {
                    data: companyData,
                    timestamp: Date.now(),
                    trigger: trigger
                };
                backupCount++;
                
                // Backup persistente cada 5 minutos
                const lastPersistentBackup = localStorage.getItem('last_signature_backup_company_time');
                if (!lastPersistentBackup || (Date.now() - parseInt(lastPersistentBackup)) > 300000) {
                    localStorage.setItem('signature_persistent_backup_company', companyData);
                    localStorage.setItem('last_signature_backup_company_time', Date.now().toString());
                }
                
            } catch (error) {
                console.error('Error backing up company signature:', error);
            }
        }
        
        if (backupCount > 0) {
            window.signatureBackup.lastBackupTime = Date.now();
            console.log(`💾 Backup completado: ${backupCount} firmas guardadas (trigger: ${trigger})`);
        }
        
    } catch (error) {
        console.error('Error en backupSignatures:', error);
    }
}

function verifyCanvasIntegrity() {
    console.log('🔍 Verificando integridad de canvas después de regreso de visibilidad...');
    
    try {
        const canvasInfos = [
            { canvas: document.getElementById('signatureCanvas'), pad: signaturePad, name: 'client' },
            { canvas: document.getElementById('companySignatureCanvas'), pad: companySignaturePad, name: 'company' }
        ];
        
        canvasInfos.forEach(info => {
            if (info.canvas && info.pad) {
                // Verificar si el canvas perdió contenido
                const backup = window.signatureBackup[info.name];
                if (backup && backup.data && info.pad.isEmpty()) {
                    console.warn(`⚠️ Canvas ${info.name} perdió contenido. Restaurando desde backup...`);
                    restoreSignatureFromBackup({
                        id: info.canvas.id,
                        name: info.name
                    }, backup.data);
                }
                
                // Verificar dimensiones del canvas
                if (info.canvas.width === 0 || info.canvas.height === 0) {
                    console.warn(`⚠️ Canvas ${info.name} tiene dimensiones inválidas. Redimensionando...`);
                    setTimeout(() => {
                        resizeCanvas();
                    }, 100);
                }
            }
        });
        
    } catch (error) {
        console.error('Error en verifyCanvasIntegrity:', error);
    }
}

function restoreSignaturesFromPersistentBackup() {
    console.log('🔄 Intentando restaurar firmas desde backup persistente...');
    
    try {
        let restoredCount = 0;
        
        // Restaurar firma del cliente desde localStorage
        const clientBackup = localStorage.getItem('signature_persistent_backup_client');
        if (clientBackup && signaturePad) {
            try {
                restoreSignatureFromBackup({
                    id: 'signatureCanvas',
                    name: 'client'
                }, clientBackup);
                restoredCount++;
                console.log('✅ Firma del cliente restaurada desde backup persistente');
            } catch (error) {
                console.error('Error restaurando firma del cliente:', error);
            }
        }
        
        // Restaurar firma de empresa desde localStorage
        const companyBackup = localStorage.getItem('signature_persistent_backup_company');
        if (companyBackup && companySignaturePad) {
            try {
                restoreSignatureFromBackup({
                    id: 'companySignatureCanvas',
                    name: 'company'
                }, companyBackup);
                restoredCount++;
                console.log('✅ Firma de empresa restaurada desde backup persistente');
            } catch (error) {
                console.error('Error restaurando firma de empresa:', error);
            }
        }
        
        if (restoredCount > 0) {
            console.log(`✅ ${restoredCount} firmas restauradas desde backup persistente`);
            if (window.utils && utils.showNotification) {
                utils.showNotification(`${restoredCount} firma(s) restaurada(s) exitosamente`, 'success');
            }
        } else {
            console.warn('⚠️ No se encontraron backups persistentes para restaurar');
            if (window.utils && utils.showNotification) {
                utils.showNotification('No se encontraron backups para restaurar', 'warning');
            }
        }
        
    } catch (error) {
        console.error('Error en restoreSignaturesFromPersistentBackup:', error);
    }
}

// Utility function to get signature backup status
function getSignatureBackupStatus() {
    const status = {
        contextLossHandlingActive: !!window.signatureBackup,
        contextLossCount: window.signatureBackup?.contextLossCount || 0,
        lastBackupTime: window.signatureBackup?.lastBackupTime || null,
        hasClientBackup: !!(window.signatureBackup?.client?.data),
        hasCompanyBackup: !!(window.signatureBackup?.company?.data),
        hasPersistentClientBackup: !!localStorage.getItem('signature_persistent_backup_client'),
        hasPersistentCompanyBackup: !!localStorage.getItem('signature_persistent_backup_company'),
        emergencyBackups: {
            client: !!localStorage.getItem('signature_emergency_backup_client'),
            company: !!localStorage.getItem('signature_emergency_backup_company')
        }
    };
    
    console.log('📊 Signature backup status:', status);
    return status;
}

// Global function to cleanup signature backups (for development)
function cleanupSignatureBackups() {
    console.log('🧹 Limpiando backups de firmas...');
    
    try {
        // Clear memory backups
        if (window.signatureBackup) {
            window.signatureBackup.client = null;
            window.signatureBackup.company = null;
        }
        
        // Clear localStorage backups
        const backupKeys = [
            'signature_persistent_backup_client',
            'signature_persistent_backup_company', 
            'last_signature_backup_client_time',
            'last_signature_backup_company_time',
            'signature_emergency_backup_client',
            'signature_emergency_backup_company'
        ];
        
        backupKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed backup: ${key}`);
            }
        });
        
        console.log('✅ Limpieza de backups completada');
        if (window.utils && utils.showNotification) {
            utils.showNotification('Backups de firmas limpiados', 'info');
        }
        
    } catch (error) {
        console.error('Error en cleanupSignatureBackups:', error);
    }
}

// Expose utility functions globally for debugging
window.getSignatureBackupStatus = getSignatureBackupStatus;
window.restoreSignaturesFromPersistentBackup = restoreSignaturesFromPersistentBackup;  
window.cleanupSignatureBackups = cleanupSignatureBackups;
window.backupSignatures = backupSignatures;
window.verifyCanvasIntegrity = verifyCanvasIntegrity;

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
        const log = window.SystemLogger ? window.SystemLogger.log.bind(window.SystemLogger) : console.log;
        log('INFO', '🔧 Configurando event listeners...');
        
        // Usar wrapper seguro si está disponible, si no usar método tradicional
        const addListener = window.safeAddEventListener || function(id, event, handler) {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Elemento ${id} no encontrado`);
            }
        };
        
        // Cambio de tipo de transacción
        addListener('transactionType', 'change', handleTransactionTypeChange);
        
        // Cálculo automático del saldo
        addListener('price', 'input', calculateBalance);
        addListener('contribution', 'input', calculateBalance);
        addListener('deposit', 'input', calculateBalance);
        
        // Autocompletado de clientes
        addListener('clientName', 'input', handleClientInput);
        addListener('clientPhone', 'input', handleClientInput);
        
        // Botón limpiar firma
        addListener('clearSignature', 'click', function() {
            if (signaturePad) {
                signaturePad.clear();
                if (window.utils) utils.showNotification('Firma limpiada', 'info');
            }
        });
        
        // Botón limpiar firma de empresa
        addListener('clearCompanySignature', 'click', function() {
            if (companySignaturePad) {
                companySignaturePad.clear();
                if (window.utils) utils.showNotification('Firma de empresa limpiada', 'info');
            } else {
                log('WARNING', '⚠️ companySignaturePad no inicializado');
            }
        });
        
        // SIGNATURE CONTEXT LOSS RECOVERY LISTENERS
        // =========================================
        
        // Manual backup button (developer utility)
        if (document.getElementById('manualBackupBtn')) {
            addListener('manualBackupBtn', 'click', function() {
                backupSignatures('manual');
                if (window.utils) utils.showNotification('Backup manual de firmas realizado', 'success');
            });
        }
        
        // Manual restore button (developer utility)
        if (document.getElementById('manualRestoreBtn')) {
            addListener('manualRestoreBtn', 'click', function() {
                restoreSignaturesFromPersistentBackup();
                if (window.utils) utils.showNotification('Intentando restaurar firmas desde backup', 'info');
            });
        }
        
        // Canvas integrity check button (developer utility)  
        if (document.getElementById('checkIntegrityBtn')) {
            addListener('checkIntegrityBtn', 'click', function() {
                verifyCanvasIntegrity();
                if (window.utils) utils.showNotification('Verificación de integridad completada', 'info');
            });
        }
        
        // Add context loss recovery to existing signature events
        ['signatureCanvas', 'companySignatureCanvas'].forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                // Backup on signature end (after user stops drawing)
                canvas.addEventListener('pointerup', () => {
                    setTimeout(() => backupSignatures('signature_end'), 500);
                });
                canvas.addEventListener('mouseup', () => {
                    setTimeout(() => backupSignatures('signature_end'), 500);  
                });
                canvas.addEventListener('touchend', () => {
                    setTimeout(() => backupSignatures('signature_end'), 500);
                });
            }
        });
        
        // BOTONES PRINCIPALES CON FALLBACKS
        addListener('previewBtn', 'click', showPreview, {
            fallback: () => {
                alert('Error mostrando vista previa. Por favor intente de nuevo.');
            }
        });
        
        addListener('generatePdfBtn', 'click', generatePDF, {
            fallback: () => {
                log('WARNING', '🔄 Usando fallback de impresión');
                window.print();
            }
        });
        
        addListener('shareWhatsappBtn', 'click', shareWhatsApp, {
            fallback: () => {
                log('WARNING', '🔄 Copiando mensaje al portapapeles');
                const message = 'Recibo generado - ciaociao.mx';
                navigator.clipboard.writeText(message);
                alert('Mensaje copiado al portapapeles');
            }
        });
        
        addListener('historyBtn', 'click', showHistory, {
            fallback: () => {
                alert('Error cargando historial. Recargando página...');
                location.reload();
            }
        });
        
        addListener('resetBtn', 'click', resetForm);
        
        addListener('logoutBtn', 'click', function() {
            if (window.authManager) {
                window.authManager.logout();
            }
        });
        
        // Botón configurar plan de pagos
        addListener('configurePaymentPlan', 'click', showPaymentPlanModal);
        
        // Botones de fotografía
        addListener('takePhotoBtn', 'click', takePhoto);
        addListener('uploadPhoto', 'change', uploadPhotos);
        
        // Modal event listeners
        setupModalEventListeners();
        
        log('SUCCESS', '✅ Event listeners configurados correctamente');
        
        // Exponer funciones globalmente para debugging
        window.showPreview = showPreview;
        // window.generatePDF = generatePDF; // Commented out to allow enhanced-pdf-generator.js to control PDF generation
        window.shareWhatsApp = shareWhatsApp;
        window.showHistory = showHistory;
        
    } catch (error) {
        if (window.SystemLogger) {
            window.SystemLogger.log('ERROR', '❌ Error configurando event listeners', error);
        } else {
            console.error('❌ Error configurando event listeners:', error);
        }
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

// ENHANCED: Función helper para obtener datos válidos de firma con diagnóstico detallado
function getValidSignatureData(signaturePad, signatureType = 'unknown') {
    try {
        console.log(`🔍 getValidSignatureData() llamada para: ${signatureType}`);
        
        // Verificación de signaturePad
        if (!signaturePad) {
            console.warn(`⚠️ signaturePad es null/undefined para ${signatureType}`);
            return null;
        }
        
        // MEJORA: Verificar canvas existe y es visible - según reporte Playwright
        if (!signaturePad.canvas) {
            console.error(`❌ Canvas no existe para ${signatureType}`);
            throw new Error(`SignaturePad ${signatureType}: canvas no disponible`);
        }
        
        // Verificar que canvas esté visible
        if (signaturePad.canvas.offsetParent === null) {
            console.error(`❌ Canvas no es visible para ${signatureType}`);
            throw new Error(`SignaturePad ${signatureType}: canvas no es visible`);
        }
        
        // Verificar dimensiones del canvas
        if (signaturePad.canvas.width === 0 || signaturePad.canvas.height === 0) {
            console.error(`❌ Canvas tiene dimensiones inválidas para ${signatureType}: ${signaturePad.canvas.width}x${signaturePad.canvas.height}`);
            throw new Error(`SignaturePad ${signatureType}: dimensiones de canvas inválidas`);
        }
        
        // Verificar que tenga métodos necesarios
        if (typeof signaturePad.isEmpty !== 'function') {
            console.error(`❌ signaturePad.isEmpty no es función para ${signatureType}`);
            throw new Error(`SignaturePad ${signatureType}: método isEmpty no disponible`);
        }
        
        if (typeof signaturePad.toDataURL !== 'function') {
            console.error(`❌ signaturePad.toDataURL no es función para ${signatureType}`);
            throw new Error(`SignaturePad ${signatureType}: método toDataURL no disponible`);
        }
        
        console.log(`✅ Canvas para ${signatureType}: ${signaturePad.canvas.width}x${signaturePad.canvas.height}, visible: ${signaturePad.canvas.offsetParent !== null}`);
        
        // Verificar si está vacía
        const isEmpty = signaturePad.isEmpty();
        console.log(`📝 Firma ${signatureType} isEmpty: ${isEmpty}`);
        
        if (isEmpty) {
            console.log(`✅ Firma ${signatureType} está vacía - retornando null (normal)`);
            return null;
        }
        
        // Obtener datos de la firma
        console.log(`🎨 Obteniendo toDataURL para firma ${signatureType}...`);
        const signatureData = signaturePad.toDataURL();
        
        // Verificar que los datos de la firma no estén corruptos
        if (!signatureData) {
            console.error(`❌ toDataURL retornó datos vacíos para ${signatureType}`);
            throw new Error(`SignaturePad ${signatureType}: toDataURL retornó datos vacíos`);
        }
        
        if (!signatureData.startsWith('data:image/')) {
            console.error(`❌ Datos de firma inválidos para ${signatureType}:`, signatureData.substring(0, 100) + '...');
            throw new Error(`SignaturePad ${signatureType}: datos de imagen inválidos`);
        }
        
        console.log(`✅ Firma ${signatureType} obtenida exitosamente, tamaño: ${signatureData.length} caracteres`);
        return signatureData;
        
    } catch (error) {
        console.error(`❌ Error obteniendo datos de firma ${signatureType}:`, error);
        // Re-throw with more specific information
        throw new Error(`Error en firma ${signatureType}: ${error.message}`);
    }
}

function validateForm(silent = false) {
    try {
        const log = window.SystemLogger ? window.SystemLogger.log.bind(window.SystemLogger) : console.log;
        
        const requiredFields = [
            { id: 'receiptDate', label: 'Fecha' },
            { id: 'transactionType', label: 'Tipo de Transacción' },
            { id: 'clientName', label: 'Nombre del Cliente' },
            { id: 'clientPhone', label: 'Teléfono', type: 'phone' },
            { id: 'pieceType', label: 'Tipo de Pieza' },
            { id: 'material', label: 'Material' },
            { id: 'price', label: 'Precio Total', type: 'number' }
        ];
        
        // Verificar que utils esté disponible
        if (!window.utils || typeof window.utils.validateRequiredFields !== 'function') {
            log('WARNING', '⚠️ Utils no disponible, validación básica');
            return validateFormBasic(requiredFields, silent);
        }
        
        const validation = utils.validateRequiredFields(requiredFields);
        
        if (!validation.isValid) {
            if (!silent) {
                const errorMessage = validation.errors.join('\n');
                
                // Usar notificación en lugar de alert molesto
                if (window.utils && window.utils.showNotification) {
                    window.utils.showNotification('Algunos campos son requeridos', 'warning');
                    log('WARNING', 'Formulario incompleto', validation.errors);
                } else {
                    alert('Por favor corrija los siguientes errores:\n\n' + errorMessage);
                }
            }
            return false;
        }
        
        return true;
        
    } catch (error) {
        const log = window.SystemLogger ? window.SystemLogger.log.bind(window.SystemLogger) : console.log;
        log('ERROR', '❌ Error validando formulario', error);
        
        // NO bloquear por errores de validación - permitir que la función continúe
        if (!silent) {
            if (window.utils && window.utils.showNotification) {
                window.utils.showNotification('Error en validación, continuando...', 'warning');
            }
        }
        
        return true; // Retornar true para no bloquear la funcionalidad
    }
}

// Función de validación básica como fallback
function validateFormBasic(fields, silent = false) {
    let isValid = true;
    const errors = [];
    
    for (const field of fields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            isValid = false;
            errors.push(`${field.label} es requerido`);
        }
    }
    
    if (!isValid && !silent) {
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification('Algunos campos son requeridos', 'warning');
        } else {
            console.warn('Campos requeridos faltantes:', errors);
        }
    }
    
    return isValid;
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
            subtotal: (parseFloat(document.getElementById('price').value) || 0) + (parseFloat(document.getElementById('contribution').value) || 0),
            deposit: parseFloat(document.getElementById('deposit').value) || 0,
            balance: Math.max(0, ((parseFloat(document.getElementById('price').value) || 0) + (parseFloat(document.getElementById('contribution').value) || 0)) - (parseFloat(document.getElementById('deposit').value) || 0)),
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryStatus: document.getElementById('deliveryStatus').value,
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
    console.log('🔍 showPreview() LLAMADA - Vista previa iniciando...');
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

function getTermsAndConditions(formData) {
    const isDelivered = formData.deliveryStatus === 'entregado';
    const hasBalance = parseFloat(formData.balance) > 0;
    
    if (isDelivered && !hasBalance) {
        // Términos para pieza entregada y pagada completamente
        return `
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• El cliente ha recibido la pieza y declara estar conforme con:</p>
            <p style="font-size: 12px; margin-bottom: 5px; margin-left: 15px; color: #000000; font-family: Arial, sans-serif;">- Calidad del trabajo realizado</p>
            <p style="font-size: 12px; margin-bottom: 5px; margin-left: 15px; color: #000000; font-family: Arial, sans-serif;">- Materiales utilizados según especificaciones</p>
            <p style="font-size: 12px; margin-bottom: 5px; margin-left: 15px; color: #000000; font-family: Arial, sans-serif;">- Acabado y presentación final</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Cualquier observación debe reportarse dentro de 48 horas</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Garantía de por vida en mano de obra</p>
        `;
    } else {
        // Términos para pagos sin entrega o entrega pendiente
        return `
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• El cliente acepta las especificaciones acordadas para la pieza</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Los materiales y diseño están sujetos a las características descritas</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• La entrega se realizará según fecha acordada previa liquidación total</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• El cliente puede revisar el avance cuando lo solicite</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Los artículos no reclamados después de 30 días están sujetos a cargo por almacenamiento</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• No nos hacemos responsables por artículos no reclamados después de 90 días</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Este recibo debe presentarse para recoger el artículo</p>
            <p style="font-size: 12px; margin-bottom: 5px; color: #000000; font-family: Arial, sans-serif;">• Garantía de por vida en mano de obra</p>
        `;
    }
}

// Función para calcular estilos de compactación automática
function calculateCompactStyles(formData, images) {
    // Calcular score de contenido
    let contentScore = 0;
    
    // Factores que agregan contenido
    if (formData.description?.length > 100) contentScore += 2;
    if (formData.stones?.length > 50) contentScore += 2;
    if (formData.observations?.length > 50) contentScore += 1;
    if (images.length > 2) contentScore += 2;
    if (formData.contribution > 0) contentScore += 1; // Aportación agrega línea extra
    if (formData.deposit > 0) contentScore += 1; // Anticipo agrega líneas
    if (formData.clientEmail) contentScore += 1;
    if (formData.deliveryDate) contentScore += 1;
    if (formData.orderNumber) contentScore += 1;
    if (formData.sku) contentScore += 1;
    if (formData.weight) contentScore += 1;
    if (formData.size) contentScore += 1;
    if (formData.pieceCondition) contentScore += 1;
    
    console.log(`📊 Score de contenido: ${contentScore} (0=mínimo, 15+=máximo)`);
    
    // Calcular estilos según score - OPTIMIZADO PARA HORIZONTAL
    let styles = {
        containerPadding: '18px',
        headerMargin: '20px',
        headerPadding: '18px',
        sectionMargin: '16px',
        sectionPadding: '15px',
        fontSize: {
            title: '32px',
            header: '20px',
            text: '16px',
            small: '14px'
        }
    };
    
    // Compactación progresiva según contenido
    if (contentScore >= 8) {
        // Contenido alto - máxima compactación HORIZONTAL
        styles = {
            containerPadding: '12px',
            headerMargin: '15px', 
            headerPadding: '12px',
            sectionMargin: '12px',
            sectionPadding: '10px',
            fontSize: {
                title: '28px',
                header: '18px',
                text: '15px',
                small: '13px'
            }
        };
        console.log('🗜️ Aplicando compactación ALTA');
    } else if (contentScore >= 5) {
        // Contenido medio - compactación moderada HORIZONTAL
        styles = {
            containerPadding: '15px',
            headerMargin: '18px',
            headerPadding: '15px', 
            sectionMargin: '14px',
            sectionPadding: '12px',
            fontSize: {
                title: '30px',
                header: '19px',
                text: '15px',
                small: '13px'
            }
        };
        console.log('📦 Aplicando compactación MEDIA');
    } else {
        console.log('📄 Usando espaciado ESTÁNDAR');
    }
    
    return styles;
}

function generateReceiptHTML() {
    try {
        console.log('🏗️ Generando HTML del recibo profesional...');
        const formData = collectFormData();
        const images = cameraManager.getImagesForPDF();
        
        // Calcular estilos de compactación automática
        const compactStyles = calculateCompactStyles(formData, images);
        
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
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #D4AF37;">
                    <h3 style="font-size: 18px; margin-bottom: 10px; color: #1a1a1a; font-weight: bold; font-family: Arial, sans-serif;">Fotografías</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                        ${images.map((img, index) => `
                            <img src="${img.data}" 
                                 alt="Imagen ${index + 1}" 
                                 style="max-width: 120px; max-height: 120px; margin: 3px; border-radius: 4px; border: 1px solid #ddd; object-fit: cover;">
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // PROFESSIONAL DESIGN FOR FINE JEWELRY RECEIPTS - ENHANCED VERSION
        const html = `
            <div style="
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
                color: #2C2C2C;
                background: #F8F8F8;
                box-sizing: border-box;
                line-height: 1.6;
            ">`
                <!-- Elegant Header -->
                <div style="
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, #1B365D 0%, #0F2A4A 100%);
                    border-radius: 12px;
                    color: white;
                ">
                    
                    <!-- Logo with Elegant Frame -->
                    <div style="position: relative; display: inline-block; padding: 20px; background: linear-gradient(45deg, #FEFEFE, #E5E4E2); border-radius: 20px; box-shadow: 0 4px 20px rgba(139, 69, 19, 0.3); margin-bottom: 25px;">
                        <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" 
                             alt="ciaociao.mx" 
                             crossorigin="anonymous"
                             style="max-width: 300px; height: auto; display: block; filter: drop-shadow(2px 2px 8px rgba(139, 69, 19, 0.3));">
                    </div>
                    
                    <!-- Elegant Title with Typography Hierarchy -->
                    <div style="position: relative; z-index: 2;">
                        <h1 style="font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; margin: 20px 0; color: #1a1a1a; text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.2); letter-spacing: 3px;">RECIBO DE VENTA</h1>
                        
                        <!-- Business Information with Luxury Styling -->
                        <div style="margin: 20px 0; padding: 20px; background: rgba(254, 254, 254, 0.9); border-radius: 12px; border: 1px solid #8B6914;">
                            <h2 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 600; margin: 0 0 10px 0; color: #8B4513; letter-spacing: 1px;">CIAOCIAO.MX</h2>
                            <p style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 500; margin: 8px 0; color: #1a1a1a; letter-spacing: 0.5px;">✦ Fine Jewelry ✦</p>
                            <p style="font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 400; margin: 8px 0; color: #1565C0;">📞 +52 1 55 9211 2643</p>
                        </div>
                        
                        <!-- Receipt Number with Premium Badge Design -->
                        <div style="display: inline-block; position: relative; margin-top: 25px;">
                            <div style="background: linear-gradient(135deg, #8B6914 0%, #8B4513 100%); color: #FEFEFE; padding: 15px 35px; border-radius: 25px; font-family: 'SF Mono', 'Monaco', monospace; font-size: 32px; font-weight: 700; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3); box-shadow: 0 6px 20px rgba(139, 105, 20, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2);">
                                No. ${formData.receiptNumber}
                            </div>
                            <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #8B6914;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Sophisticated Three-Column Layout with Luxury Cards -->
                <div style="display: flex; gap: 20px; align-items: flex-start; margin: 30px 0; position: relative; z-index: 1;">
                
                    <!-- LEFT COLUMN (30%) - General Information & Client -->
                    <div style="flex: 0 0 30%; padding-right: 10px;">
                        
                        <!-- General Information Card -->
                        <div style="margin-bottom: 25px; padding: 25px; background: linear-gradient(135deg, #FEFEFE 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #8B6914; box-shadow: 0 8px 24px rgba(139, 105, 20, 0.15); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #8B6914 0%, #8B4513 50%, #8B6914 100%);"></div>
                            
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #8B4513; text-align: center; letter-spacing: 0.5px; position: relative;">
                                <span style="background: linear-gradient(135deg, #F4E4BC, #E5E4E2); padding: 8px 16px; border-radius: 20px; border: 1px solid #8B6914;">📋 Información General</span>
                            </h3>
                            
                            <div style="margin: 0; line-height: 1.6; font-size: 16px; font-family: 'Inter', sans-serif;">
                                <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(244, 228, 188, 0.3); border-radius: 8px; border-left: 4px solid #8B6914;">
                                    <span style="display: inline-block; width: 100px; font-weight: 600; color: #8B4513; font-family: 'Inter', sans-serif;">📅 Fecha:</span>
                                    <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${utils.formatDate(formData.receiptDate)}</span>
                                </div>
                                <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(244, 228, 188, 0.3); border-radius: 8px; border-left: 4px solid #8B6914;">
                                    <span style="display: inline-block; width: 100px; font-weight: 600; color: #8B4513; font-family: 'Inter', sans-serif;">🔖 Tipo:</span>
                                    <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${utils.capitalize(formData.transactionType)}</span>
                                </div>
                                ${formData.deliveryDate ? `
                                    <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(244, 228, 188, 0.3); border-radius: 8px; border-left: 4px solid #8B6914;">
                                        <span style="display: inline-block; width: 100px; font-weight: 600; color: #8B4513; font-family: 'Inter', sans-serif;">🚚 Entrega:</span>
                                        <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${utils.formatDate(formData.deliveryDate)}</span>
                                    </div>
                                ` : ''}
                                ${formData.orderNumber ? `
                                    <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(244, 228, 188, 0.3); border-radius: 8px; border-left: 4px solid #8B6914;">
                                        <span style="display: inline-block; width: 100px; font-weight: 600; color: #8B4513; font-family: 'Inter', sans-serif;">📦 Pedido:</span>
                                        <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${formData.orderNumber}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                
                        <!-- Client Information Card -->
                        <div style="margin-bottom: 25px; padding: 25px; background: linear-gradient(135deg, #FEFEFE 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #8B6914; box-shadow: 0 8px 24px rgba(139, 105, 20, 0.15); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #1565C0 0%, #6B4E3D 50%, #1565C0 100%);"></div>
                            
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #8B4513; text-align: center; letter-spacing: 0.5px; position: relative;">
                                <span style="background: linear-gradient(135deg, #F4E4BC, #E5E4E2); padding: 8px 16px; border-radius: 20px; border: 1px solid #1565C0;">👤 Datos del Cliente</span>
                            </h3>
                            
                            <div style="margin: 0; line-height: 1.6; font-size: 16px; font-family: 'Inter', sans-serif;">
                                <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(21, 101, 192, 0.1); border-radius: 8px; border-left: 4px solid #1565C0;">
                                    <span style="display: inline-block; width: 100px; font-weight: 600; color: #1565C0; font-family: 'Inter', sans-serif;">👤 Nombre:</span>
                                    <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${formData.clientName}</span>
                                </div>
                                <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(21, 101, 192, 0.1); border-radius: 8px; border-left: 4px solid #1565C0;">
                                    <span style="display: inline-block; width: 100px; font-weight: 600; color: #1565C0; font-family: 'Inter', sans-serif;">📱 Teléfono:</span>
                                    <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500;">${utils.formatPhone(formData.clientPhone)}</span>
                                </div>
                                ${formData.clientEmail ? `
                                    <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(21, 101, 192, 0.1); border-radius: 8px; border-left: 4px solid #1565C0;">
                                        <span style="display: inline-block; width: 100px; font-weight: 600; color: #1565C0; font-family: 'Inter', sans-serif;">📧 Email:</span>
                                        <span style="color: #1a1a1a; font-family: 'Inter', sans-serif; font-weight: 500; word-break: break-all;">${formData.clientEmail}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                
                    </div>
                    
                    <!-- CENTER COLUMN (35%) - Jewelry Piece Details -->
                    <div style="flex: 0 0 35%; padding: 0 10px;">
                        
                        <!-- Jewelry Piece Details Card -->
                        <div style="margin-bottom: 25px; padding: 25px; background: linear-gradient(135deg, #FEFEFE 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #6B4E3D; box-shadow: 0 8px 24px rgba(107, 78, 61, 0.15); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #6B4E3D 0%, #8B4513 50%, #6B4E3D 100%);"></div>
                            
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #8B4513; text-align: center; letter-spacing: 0.5px;">
                                <span style="background: linear-gradient(135deg, #F4E4BC, #E5E4E2); padding: 8px 16px; border-radius: 20px; border: 1px solid #6B4E3D;">💎 Detalles de la Pieza</span>
                            </h3>
                            
                            <!-- Elegant Property List -->
                            <div style="font-family: 'Inter', sans-serif;">
                                <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D; display: flex; align-items: center; justify-content: space-between;">
                                    <span style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🔶 Tipo</span>
                                    <span style="color: #1a1a1a; font-weight: 500; font-size: 16px; text-align: right;">${utils.capitalize(formData.pieceType)}</span>
                                </div>
                                
                                <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D; display: flex; align-items: center; justify-content: space-between;">
                                    <span style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">✨ Material</span>
                                    <span style="color: #1a1a1a; font-weight: 600; font-size: 16px; text-align: right;">${formData.material.replace('-', ' ').toUpperCase()}</span>
                                </div>
                                
                                ${formData.weight ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">⚖️ Peso</span>
                                        <span style="color: #1a1a1a; font-weight: 500; font-size: 16px; text-align: right;">${formData.weight} gramos</span>
                                    </div>
                                ` : ''}
                                
                                ${formData.size ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📏 Talla</span>
                                        <span style="color: #1a1a1a; font-weight: 500; font-size: 16px; text-align: right;">${formData.size}</span>
                                    </div>
                                ` : ''}
                                
                                ${formData.sku ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🏷️ SKU</span>
                                        <span style="color: #1a1a1a; font-weight: 500; font-size: 16px; text-align: right; font-family: 'SF Mono', monospace;">${formData.sku}</span>
                                    </div>
                                ` : ''}
                                
                                ${formData.stones ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D;">
                                        <div style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">💎 Piedras</div>
                                        <div style="color: #1a1a1a; font-weight: 500; font-size: 16px; line-height: 1.4;">${formData.stones}</div>
                                    </div>
                                ` : ''}
                                
                                ${formData.description ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(107, 78, 61, 0.1); border-radius: 10px; border-left: 4px solid #6B4E3D;">
                                        <div style="font-weight: 600; color: #6B4E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">📝 Descripción</div>
                                        <div style="color: #1a1a1a; font-weight: 500; font-size: 16px; line-height: 1.4;">${formData.description}</div>
                                    </div>
                                ` : ''}
                                
                                ${formData.pieceCondition ? `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 10px; border-left: 4px solid #FFC107;">
                                        <div style="font-weight: 600; color: #FFC107; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">🔧 Estado de Reparación</div>
                                        <div style="color: #1a1a1a; font-weight: 500; font-size: 16px; line-height: 1.4;">${formData.pieceCondition}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Elegant Images Section -->
                        ${images.length > 0 ? `
                            <div style="margin-bottom: 25px; padding: 25px; background: linear-gradient(135deg, #FEFEFE 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #8B4513; box-shadow: 0 8px 24px rgba(139, 69, 19, 0.15); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #8B4513 0%, #8B6914 50%, #8B4513 100%);"></div>
                                
                                <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #8B4513; text-align: center; letter-spacing: 0.5px;">
                                    <span style="background: linear-gradient(135deg, #F4E4BC, #E5E4E2); padding: 8px 16px; border-radius: 20px; border: 1px solid #8B4513;">📸 Fotografías</span>
                                </h3>
                                
                                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
                                    ${images.map((img, index) => `
                                        <div style="position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);">
                                            <img src="${img.data}" 
                                                 alt="Imagen ${index + 1}" 
                                                 style="width: 140px; height: 140px; object-fit: cover; border: 2px solid #8B4513;">
                                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(139, 69, 19, 0.8)); color: #FEFEFE; padding: 4px 8px; font-size: 12px; font-weight: 600; text-align: center;">
                                                Foto ${index + 1}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- RIGHT COLUMN (35%) - Luxury Financial Information & Signatures -->
                    <div style="flex: 0 0 35%; padding-left: 10px;">
                        
                        <!-- Sophisticated Financial Information Card -->
                        <div style="margin-bottom: 25px; padding: 30px; background: linear-gradient(135deg, #FEFEFE 0%, #F4E4BC 100%); border-radius: 15px; border: 3px solid #8B6914; box-shadow: 0 12px 32px rgba(139, 105, 20, 0.25); position: relative; overflow: hidden;">
                            
                            <!-- Premium Financial Header -->
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #8B6914 0%, #8B4513 25%, #8B6914 50%, #8B4513 75%, #8B6914 100%);"></div>
                            
                            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #8B6914, #8B4513); border-radius: 12px; box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.2);">
                                <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin: 0; color: #FEFEFE; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); letter-spacing: 1px;">💰 INFORMACIÓN FINANCIERA</h3>
                            </div>
                            
                            <!-- Elegant Currency Display System -->
                            <div style="font-family: 'Inter', sans-serif; min-width: 450px;">
                                
                                <!-- Base Price - PROFESSIONAL DESIGN -->
                                <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #F8F8F8, #F5F2E8); border-radius: 8px; border: 1px solid #C9A96E; position: relative; box-shadow: 0 2px 8px rgba(27, 54, 93, 0.08);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 600; color: #1B365D; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">PRECIO BASE:</span>
                                        <div class="currency-value" data-value="${formData.price}" data-currency="true" style="
                                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                                            font-size: 20px; 
                                            font-weight: 700; 
                                            color: #2C2C2C; 
                                            text-align: right; 
                                            white-space: nowrap; 
                                            min-width: 160px; 
                                            overflow: visible;
                                            padding: 10px 16px;
                                            background: #FFFFFF;
                                            border-radius: 4px;
                                            border: 1px solid #E5E5E5;
                                            box-shadow: 0 1px 3px rgba(44, 44, 44, 0.1);
                                        ">${utils.formatCurrency(formData.price)}</div>
                                    </div>
                                </div>
                                
                                ${formData.contribution > 0 ? `
                                    <!-- Contribution - PROFESSIONAL DESIGN -->
                                    <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #F0EDE6, #F5F2E8); border-radius: 8px; border: 1px solid #1B5B3C; position: relative; box-shadow: 0 2px 8px rgba(27, 91, 60, 0.08);">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 600; color: #1B365D; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">APORTACIÓN:</span>
                                            <div class="currency-value" data-value="${formData.contribution}" data-currency="true" style="
                                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                                                font-size: 20px; 
                                                font-weight: 700; 
                                                color: #1B5B3C; 
                                                text-align: right; 
                                                white-space: nowrap; 
                                                min-width: 160px; 
                                                overflow: visible;
                                                padding: 10px 16px;
                                                background: #FFFFFF;
                                                border-radius: 4px;
                                                border: 1px solid #E5E5E5;
                                                box-shadow: 0 1px 3px rgba(27, 91, 60, 0.1);
                                            ">${utils.formatCurrency(formData.contribution)}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Subtotal - PROFESSIONAL DESIGN -->
                                    <div style="margin-bottom: 25px; padding: 22px; background: linear-gradient(135deg, #F8F8F8, #FFFFFF); border-radius: 8px; border: 2px solid #1B365D; position: relative; box-shadow: 0 4px 12px rgba(27, 54, 93, 0.15);">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 700; color: #1B365D; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px;">SUBTOTAL:</span>
                                            <div class="currency-value" data-value="${formData.subtotal}" data-currency="true" style="
                                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                                                font-size: 24px; 
                                                font-weight: 800; 
                                                color: #2C2C2C; 
                                                text-align: right; 
                                                white-space: nowrap; 
                                                min-width: 180px; 
                                                overflow: visible;
                                                padding: 12px 20px;
                                                background: #FFFFFF;
                                                border-radius: 6px;
                                                border: 2px solid #C9A96E;
                                                box-shadow: 0 2px 8px rgba(201, 169, 110, 0.2);
                                            ">${utils.formatCurrency(formData.subtotal)}</div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${formData.deposit > 0 ? `
                                    <!-- Deposit -->
                                    <div style="margin-bottom: 20px; padding: 18px; background: rgba(21, 101, 192, 0.1); border-radius: 12px; border: 2px solid #1565C0; position: relative;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 600; color: #1565C0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.8px;">💳 Anticipo:</span>
                                            <div style="
                                                font-family: 'SF Mono', 'Monaco', monospace; 
                                                font-size: 20px; 
                                                font-weight: 600; 
                                                color: #1565C0; 
                                                text-align: right; 
                                                white-space: nowrap; 
                                                min-width: 200px; 
                                                overflow: visible;
                                                padding: 8px 15px;
                                                background: linear-gradient(135deg, #FEFEFE, #E5E4E2);
                                                border-radius: 8px;
                                                border: 1px solid #1565C0;
                                                box-shadow: inset 0 2px 4px rgba(21, 101, 192, 0.1);
                                            ">${utils.formatCurrency(formData.deposit)}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Outstanding Balance -->
                                    <div style="margin-top: 25px; padding: 25px; background: linear-gradient(135deg, #FFF3E0, #FFEB3B); border-radius: 15px; border: 3px solid #FF9800; box-shadow: 0 8px 24px rgba(255, 152, 0, 0.3); position: relative;">
                                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #FF9800 0%, #F57C00 50%, #FF9800 100%);"></div>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 800; color: #F57C00; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">🔴 SALDO PENDIENTE:</span>
                                            <div style="
                                                font-family: 'SF Mono', 'Monaco', monospace; 
                                                font-size: 28px; 
                                                font-weight: 800; 
                                                color: #D32F2F; 
                                                text-align: right; 
                                                white-space: nowrap; 
                                                min-width: 220px; 
                                                overflow: visible;
                                                padding: 12px 25px;
                                                background: linear-gradient(135deg, #FEFEFE, #FFCDD2);
                                                border-radius: 12px;
                                                border: 2px solid #D32F2F;
                                                box-shadow: 0 6px 20px rgba(211, 47, 47, 0.3);
                                                text-shadow: 1px 1px 2px rgba(211, 47, 47, 0.2);
                                            ">${utils.formatCurrency(formData.balance)}</div>
                                        </div>
                                    </div>
                                ` : `
                                    <!-- Total Amount - PROFESSIONAL CARTIER-STYLE DESIGN -->
                                    <div style="margin-top: 30px; padding: 30px; background: linear-gradient(135deg, #F8F8F8, #FFFFFF); border-radius: 10px; border: 3px solid #1B365D; box-shadow: 0 8px 24px rgba(27, 54, 93, 0.2); position: relative;">
                                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #1B365D 0%, #C9A96E 50%, #1B365D 100%); border-radius: 10px 10px 0 0;"></div>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 800; color: #1B365D; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PAGADO:</span>
                                            <div class="currency-value total-amount" data-value="${formData.subtotal || formData.price}" data-currency="true" style="
                                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                                                font-size: 28px; 
                                                font-weight: 900; 
                                                color: #2C2C2C; 
                                                text-align: right; 
                                                white-space: nowrap; 
                                                min-width: 200px; 
                                                overflow: visible;
                                                padding: 16px 24px;
                                                background: #FFFFFF;
                                                border-radius: 8px;
                                                border: 2px solid #1B365D;
                                                box-shadow: 0 4px 16px rgba(27, 54, 93, 0.25);
                                            ">${utils.formatCurrency(formData.subtotal || formData.price)}</div>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <!-- Elegant Observations Section -->
                        ${formData.observations ? `
                            <div style="margin-bottom: 25px; padding: 25px; background: linear-gradient(135deg, #FEFEFE 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #8B4513; box-shadow: 0 8px 24px rgba(139, 69, 19, 0.15); position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #8B4513 0%, #8B6914 50%, #8B4513 100%);"></div>
                                
                                <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; margin-bottom: 18px; color: #8B4513; text-align: center; letter-spacing: 0.5px;">
                                    <span style="background: linear-gradient(135deg, #F4E4BC, #E5E4E2); padding: 8px 16px; border-radius: 20px; border: 1px solid #8B4513;">📝 Observaciones</span>
                                </h3>
                                
                                <div style="padding: 18px; background: rgba(139, 69, 19, 0.1); border-radius: 12px; border-left: 4px solid #8B4513;">
                                    <p style="font-family: 'Inter', sans-serif; font-size: 16px; margin: 0; color: #1a1a1a; line-height: 1.6; font-weight: 400;">${formData.observations}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Sophisticated Signature Section -->
                        <div style="margin-top: 30px; padding: 30px; background: linear-gradient(135deg, #F4E4BC 0%, #E5E4E2 100%); border-radius: 20px; border: 3px solid #8B6914; box-shadow: 0 12px 36px rgba(139, 105, 20, 0.2); position: relative;">
                            
                            <!-- Decorative Elements -->
                            <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 80px; height: 10px; background: linear-gradient(90deg, #8B6914, #8B4513, #8B6914); border-radius: 5px;"></div>
                            
                            <!-- Signature Title -->
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin-bottom: 30px; color: #8B4513; text-align: center; letter-spacing: 1px; text-shadow: 1px 1px 3px rgba(139, 69, 19, 0.2);">
                                ✍️ FIRMAS DIGITALES ✍️
                            </h3>
                            
                            <!-- Elegant Signature Cards -->
                            <div style="display: flex; gap: 25px; justify-content: center; font-family: 'Inter', sans-serif;">
                                
                                <!-- Client Signature Card -->
                                <div style="flex: 1; max-width: 300px; text-align: center; padding: 25px; background: linear-gradient(135deg, #FEFEFE, #F4E4BC); border-radius: 15px; border: 2px solid #1565C0; box-shadow: 0 8px 20px rgba(21, 101, 192, 0.2);">
                                    <div style="margin-bottom: 20px; padding: 20px; background: #FEFEFE; border-radius: 12px; border: 2px solid #E5E4E2; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                                        ${formData.signature ? 
                                            `<img src="${formData.signature}" style="max-width: 200px; max-height: 90px; border-radius: 8px; box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);">` : 
                                            '<div style="width: 200px; height: 90px; background: linear-gradient(135deg, #E5E4E2, #FEFEFE); border: 2px dashed #1565C0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1565C0; font-size: 14px; font-weight: 600;">Sin firma</div>'
                                        }
                                    </div>
                                    <div style="border-top: 3px solid #1565C0; padding-top: 15px;">
                                        <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #1565C0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Firma del Cliente</div>
                                        <div style="font-size: 14px; color: #8B4513; font-weight: 500;">${formData.clientName || 'Cliente'}</div>
                                    </div>
                                </div>
                                
                                <!-- Company Signature Card -->
                                <div style="flex: 1; max-width: 300px; text-align: center; padding: 25px; background: linear-gradient(135deg, #FEFEFE, #F4E4BC); border-radius: 15px; border: 2px solid #8B6914; box-shadow: 0 8px 20px rgba(139, 105, 20, 0.2);">
                                    <div style="margin-bottom: 20px; padding: 20px; background: #FEFEFE; border-radius: 12px; border: 2px solid #E5E4E2; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                                        ${formData.companySignature ? 
                                            `<img src="${formData.companySignature}" style="max-width: 200px; max-height: 90px; border-radius: 8px; box-shadow: 0 4px 12px rgba(139, 105, 20, 0.3);">` : 
                                            '<div style="width: 200px; height: 90px; background: linear-gradient(135deg, #E5E4E2, #FEFEFE); border: 2px dashed #8B6914; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #8B6914; font-size: 14px; font-weight: 600;">Sin firma</div>'
                                        }
                                    </div>
                                    <div style="border-top: 3px solid #8B6914; padding-top: 15px;">
                                        <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #8B6914; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">CIAOCIAO.MX</div>
                                        <div style="font-size: 14px; color: #8B4513; font-weight: 500;">Fine Jewelry</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sophisticated Terms and Conditions Section -->
                <div style="margin: 40px 30px 30px; padding: 35px; background: linear-gradient(135deg, #FEFEFE 0%, #F4E4BC 100%); border-radius: 20px; border: 3px solid #8B4513; box-shadow: 0 12px 36px rgba(139, 69, 19, 0.25); position: relative; font-family: 'Inter', sans-serif;">
                    
                    <!-- Decorative Header -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #8B4513 0%, #8B6914 25%, #8B4513 50%, #8B6914 75%, #8B4513 100%);"></div>
                    
                    <!-- Terms Header -->
                    <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #8B4513, #8B6914); border-radius: 15px; box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.2);">
                        <h3 style="font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; margin: 0; color: #FEFEFE; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); letter-spacing: 1.5px;">📋 TÉRMINOS Y CONDICIONES</h3>
                    </div>
                    
                    <!-- Terms Content with Professional Typography -->
                    <div style="background: rgba(254, 254, 254, 0.9); border-radius: 15px; padding: 30px; border: 2px solid #E5E4E2; box-shadow: inset 0 2px 8px rgba(139, 69, 19, 0.1);">
                        <div style="font-size: 14px; color: #1a1a1a; line-height: 1.7; font-family: 'Inter', sans-serif; columns: 2; column-gap: 35px; column-rule: 2px solid #E5E4E2; text-align: justify;">
                            ${getTermsAndConditions(formData)}
                        </div>
                    </div>
                    
                    <!-- Elegant Footer -->
                    <div style="margin-top: 30px; text-align: center; padding: 25px; background: linear-gradient(135deg, #F4E4BC 0%, #E5E4E2 100%); border-radius: 15px; border: 2px solid #8B6914;">
                        <p style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; margin: 0; color: #8B4513; letter-spacing: 1px; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.2);">
                            ✨ Gracias por confiar en CIAOCIAO.MX ✨
                        </p>
                        <p style="font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500; margin: 10px 0 0; color: #1a1a1a; letter-spacing: 0.5px;">
                            Su joyería de confianza desde siempre
                        </p>
                    </div>
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

// COMPREHENSIVE PDF GENERATION ERROR RECOVERY SYSTEM
// ==================================================
// Critical for preventing browser crashes from large canvas operations

async function generateCanvasWithErrorRecovery(element, options, recoveryConfig) {
    console.log('🛡️ Iniciando generación de canvas con error recovery...');
    
    const {
        maxRetries = 3,
        maxCanvasSize = 25 * 1024 * 1024, // 25MB
        fallbackScales = [1, 0.7, 0.4], // FIXED: Reducido de 5 a 3 escalas
        chunkingThreshold = 15 * 1024 * 1024, // 15MB
        memoryMonitoring = true
    } = recoveryConfig;
    
    let lastError = null;
    let memoryBefore = null;
    
    // Monitor memory before operation
    if (memoryMonitoring && 'memory' in performance) {
        memoryBefore = performance.memory.usedJSHeapSize;
        console.log(`💾 Memoria inicial: ${(memoryBefore / 1024 / 1024).toFixed(2)}MB`);
        
        // Check available memory
        const memoryLimit = performance.memory.jsHeapSizeLimit;
        const memoryUsage = memoryBefore / memoryLimit;
        
        if (memoryUsage > 0.8) {
            console.warn('⚠️ Alta presión de memoria detectada antes de PDF generation');
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
                console.log('🧹 Garbage collection ejecutado');
            }
            
            // Suggest to user to close other tabs
            if (window.utils && utils.showNotification) {
                utils.showNotification('Memoria limitada detectada. Cierra otras pestañas para mejor rendimiento.', 'warning');
            }
        }
    }
    
    // Try each scale factor with progressive fallback
    for (let scaleIndex = 0; scaleIndex < fallbackScales.length; scaleIndex++) {
        const scale = fallbackScales[scaleIndex];
        const currentOptions = { ...options, scale };
        
        try {
            console.log(`📊 Intento ${scaleIndex + 1}/${fallbackScales.length} - Escala: ${scale}`);
            
            // Estimate canvas size before generation
            const estimatedWidth = (currentOptions.width || element.offsetWidth) * scale;
            const estimatedHeight = (currentOptions.height || element.offsetHeight) * scale;
            const estimatedSize = estimatedWidth * estimatedHeight * 4; // 4 bytes per pixel (RGBA)
            
            console.log(`📐 Canvas estimado: ${estimatedWidth}x${estimatedHeight} = ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
            
            // Check if estimated size exceeds limits
            if (estimatedSize > maxCanvasSize) {
                console.warn(`⚠️ Canvas estimado (${(estimatedSize / 1024 / 1024).toFixed(2)}MB) excede límite (${(maxCanvasSize / 1024 / 1024).toFixed(2)}MB)`);
                
                if (scaleIndex === fallbackScales.length - 1) {
                    // Last attempt - try chunking
                    return await generateCanvasWithChunking(element, currentOptions, {
                        chunkHeight: 1000,
                        maxChunks: 10
                    });
                }
                continue; // Try next scale
            }
            
            // ENHANCED: Canvas generation with fallback system and currency validation
            const canvas = await generateCanvasWithFallback(element, currentOptions);
            
            // Validate canvas
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('Canvas generado está vacío');
            }
            
            // FIXED: Verificación simplificada de canvas - eliminar pixel-by-pixel problemática
            const testDataURL = canvas.toDataURL('image/png', 0.1); // Test rápido
            if (!testDataURL || testDataURL === 'data:,' || testDataURL.length < 100) {
                console.warn('⚠️ Canvas genera datos vacíos');
                if (scaleIndex === fallbackScales.length - 1) {
                    console.error('❌ Todas las escalas resultaron en canvas vacío');
                    throw new Error('No se pudo generar contenido válido en el canvas');
                }
                continue; // Try next scale
            }
            
            const actualSize = canvas.width * canvas.height * 4;
            console.log(`✅ Canvas exitoso - Dimensiones reales: ${canvas.width}x${canvas.height} (${(actualSize / 1024 / 1024).toFixed(2)}MB)`);
            
            // Monitor memory after successful generation
            if (memoryMonitoring && 'memory' in performance) {
                const memoryAfter = performance.memory.usedJSHeapSize;
                const memoryDelta = memoryAfter - memoryBefore;
                console.log(`💾 Memoria después: ${(memoryAfter / 1024 / 1024).toFixed(2)}MB (Δ+${(memoryDelta / 1024 / 1024).toFixed(2)}MB)`);
            }
            
            return canvas;
            
        } catch (error) {
            console.error(`❌ Error en intento ${scaleIndex + 1}:`, error.message);
            lastError = error;
            
            // Clean up any partial canvas/memory
            if (window.gc) {
                window.gc();
            }
            
            // If it's a memory error, definitely try smaller scale
            if (error.message.includes('out of memory') || 
                error.message.includes('Maximum call stack') ||
                error.message.includes('allocation failed')) {
                console.warn('🧠 Error de memoria detectado, reduciendo escala...');
                continue;
            }
            
            // If it's the last attempt, try emergency fallback
            if (scaleIndex === fallbackScales.length - 1) {
                console.error('❌ Todos los intentos fallaron, ejecutando fallback de emergencia...');
                return await emergencyPDFGeneration(element);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // If we get here, all attempts failed
    throw new Error(`PDF generation failed after ${fallbackScales.length} attempts. Last error: ${lastError?.message || 'Unknown'}`);
}

async function generateCanvasWithChunking(element, options, chunkConfig) {
    console.log('🧩 Iniciando generación por chunks debido a tamaño excesivo...');
    
    const { chunkHeight = 1000, maxChunks = 10 } = chunkConfig;
    
    try {
        // Create a temporary canvas for combining chunks
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const elementHeight = element.offsetHeight;
        const elementWidth = element.offsetWidth;
        
        tempCanvas.width = elementWidth * (options.scale || 1);
        tempCanvas.height = elementHeight * (options.scale || 1);
        
        console.log(`📊 Chunk generation: ${Math.ceil(elementHeight / chunkHeight)} chunks de ${chunkHeight}px cada uno`);
        
        let currentY = 0;
        let chunkIndex = 0;
        
        while (currentY < elementHeight && chunkIndex < maxChunks) {
            const remainingHeight = elementHeight - currentY;
            const currentChunkHeight = Math.min(chunkHeight, remainingHeight);
            
            console.log(`🧩 Procesando chunk ${chunkIndex + 1}: y=${currentY}, height=${currentChunkHeight}`);
            
            // Create chunk-specific options
            const chunkOptions = {
                ...options,
                height: currentChunkHeight,
                y: currentY,
                scrollY: currentY
            };
            
            try {
                const chunkCanvas = await html2canvas(element, chunkOptions);
                
                // Draw chunk onto main canvas
                tempCtx.drawImage(
                    chunkCanvas, 
                    0, currentY * (options.scale || 1),
                    chunkCanvas.width, chunkCanvas.height
                );
                
                console.log(`✅ Chunk ${chunkIndex + 1} completado`);
                
                // Clean up chunk canvas
                chunkCanvas.width = 0;
                chunkCanvas.height = 0;
                
            } catch (chunkError) {
                console.error(`❌ Error en chunk ${chunkIndex + 1}:`, chunkError);
                // Continue with next chunk rather than failing completely
            }
            
            currentY += chunkHeight;
            chunkIndex++;
            
            // Brief pause between chunks
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Chunking completado: ${chunkIndex} chunks procesados`);
        return tempCanvas;
        
    } catch (error) {
        console.error('❌ Error en chunking process:', error);
        throw error;
    }
}

async function emergencyPDFGeneration(element) {
    console.error('🚨 FUNCIÓN DE EMERGENCIA DESACTIVADA - Usuario requiere funcionamiento correcto');
    console.error('❌ No se ejecutará generación de emergencia');
    throw new Error('Sistema de emergencia desactivado - corregir sistema principal');
        
        if (emergencyCanvas && emergencyCanvas.width > 0 && emergencyCanvas.height > 0) {
            console.log('✅ Canvas de emergencia generado exitosamente');
            return emergencyCanvas;
        }
        
        // Last resort: Create a text-only PDF canvas
        console.error('🆘 Último recurso: Creando canvas con texto básico...');
        return createTextOnlyCanvas(element);
        
    } catch (error) {
        console.error('❌ Error en generación de emergencia:', error);
        throw new Error('PDF generation completamente fallido - no se pudo crear ningún canvas');
    }
}

function createTextOnlyCanvas(element) {
    console.log('📝 Creando canvas solo con texto como último recurso...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Extract basic text content
    const textContent = element.innerText || element.textContent || 'Contenido no disponible';
    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
    
    // Draw text
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial, sans-serif';
    
    let y = 50;
    lines.forEach((line, index) => {
        if (y < canvas.height - 20 && index < 30) { // Limit lines
            ctx.fillText(line.substring(0, 80), 20, y); // Limit line length
            y += 20;
        }
    });
    
    // Add error note
    ctx.fillStyle = '#ff0000';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('⚠️ PDF generado en modo de emergencia', 20, canvas.height - 40);
    ctx.fillText('Algunas características visuales pueden estar limitadas', 20, canvas.height - 20);
    
    console.log('✅ Canvas solo-texto creado como fallback');
    return canvas;
}

// Memory monitoring utilities
function checkMemoryPressure() {
    if (!('memory' in performance)) {
        return { status: 'unavailable', pressure: 0 };
    }
    
    const memInfo = performance.memory;
    const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    
    let status = 'normal';
    if (usageRatio > 0.9) status = 'critical';
    else if (usageRatio > 0.8) status = 'high';
    else if (usageRatio > 0.6) status = 'moderate';
    
    return {
        status,
        pressure: usageRatio,
        used: memInfo.usedJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        available: memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize
    };
}

// Cleanup function for memory management
function cleanupPDFResources() {
    console.log('🧹 Limpiando recursos de PDF generation...');
    
    try {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
            console.log('✅ Garbage collection ejecutado');
        }
        
        // Clear any large objects from memory
        if (window.lastGeneratedCanvas) {
            window.lastGeneratedCanvas.width = 0;
            window.lastGeneratedCanvas.height = 0;
            window.lastGeneratedCanvas = null;
        }
        
        // Remove temporary DOM elements
        const tempElements = document.querySelectorAll('[id*="pdf-temp"], [class*="pdf-temp"]');
        tempElements.forEach(el => {
            el.remove();
            console.log('🗑️ Removed temp element:', el.id || el.className);
        });
        
    } catch (error) {
        console.error('Error en cleanup:', error);
    }
}

// Global error handler for PDF operations
window.addEventListener('error', (event) => {
    if (event.message.includes('pdf') || 
        event.message.includes('canvas') || 
        event.message.includes('html2canvas')) {
        console.error('🚨 PDF-related error detected:', event.error);
        
        // Attempt cleanup
        cleanupPDFResources();
        
        // Show user-friendly message
        if (window.utils && utils.showNotification) {
            utils.showNotification(
                'Error generando PDF. Intentando con configuración reducida...', 
                'warning'
            );
        }
    }
});

async function createPDFWithErrorRecovery(pdf, imgData, config) {
    console.log('🛡️ Creando PDF con error recovery...');
    
    const {
        x, y, finalWidth, finalHeight,
        canvas,
        formData,
        maxRetries = 3,
        fallbackStrategies = ['compress', 'reduce_quality', 'split_content']
    } = config;
    
    let lastError = null;
    
    // Strategy 1: Normal PDF creation
    try {
        console.log('📄 Intento 1: Creación normal de PDF');
        
        // Check memory before PDF operations
        const memoryStatus = checkMemoryPressure();
        if (memoryStatus.status === 'critical') {
            throw new Error('Memoria crítica - aplicando estrategias de recuperación');
        }
        
        // Add image to PDF with timeout
        await Promise.race([
            new Promise((resolve) => {
                pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
                resolve();
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PDF creation timeout')), 15000)
            )
        ]);
        
        // Save PDF with error handling
        const fileName = createSafeFileName(formData);
        
        await Promise.race([
            new Promise((resolve) => {
                pdf.save(fileName);
                resolve();
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PDF save timeout')), 10000)
            )
        ]);
        
        console.log(`✅ PDF creado exitosamente: ${fileName}`);
        
        // Calculate utilization
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const utilization = ((finalWidth * finalHeight) / (pageWidth * pageHeight) * 100).toFixed(1);
        console.log(`📦 Utilización de página: ${utilization}%`);
        
        return { success: true, fileName, utilization };
        
    } catch (error) {
        console.error('❌ Error en creación normal de PDF:', error.message);
        lastError = error;
    }
    
    // Strategy 2: Compressed image
    if (fallbackStrategies.includes('compress')) {
        try {
            console.log('📄 Intento 2: PDF con imagen comprimida');
            
            const compressedCanvas = compressCanvas(canvas, 0.7);
            const compressedImgData = compressedCanvas.toDataURL('image/jpeg', 0.7);
            
            // FIXED: Corrección detección jsPDF para imagen comprimida
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else {
                throw new Error('jsPDF library not available for compressed PDF');
            }
            
            // Create new PDF with compressed image
            const compressedPdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            compressedPdf.addImage(compressedImgData, 'JPEG', x, y, finalWidth, finalHeight);
            
            const fileName = createSafeFileName(formData, '_compressed');
            compressedPdf.save(fileName);
            
            console.log(`✅ PDF comprimido creado exitosamente: ${fileName}`);
            return { success: true, fileName, compressed: true };
            
        } catch (error) {
            console.error('❌ Error en PDF comprimido:', error.message);
            lastError = error;
        }
    }
    
    // Strategy 3: Reduced quality
    if (fallbackStrategies.includes('reduce_quality')) {
        try {
            console.log('📄 Intento 3: PDF con calidad reducida');
            
            const lowQualityCanvas = compressCanvas(canvas, 0.4);
            const lowQualityImgData = lowQualityCanvas.toDataURL('image/jpeg', 0.4);
            
            // FIXED: Corrección detección jsPDF para calidad reducida
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else {
                throw new Error('jsPDF library not available for low quality PDF');
            }
            
            const lowQualityPdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Use smaller dimensions to reduce file size
            const reducedWidth = finalWidth * 0.8;
            const reducedHeight = finalHeight * 0.8;
            const centeredX = x + (finalWidth - reducedWidth) / 2;
            const centeredY = y + (finalHeight - reducedHeight) / 2;
            
            lowQualityPdf.addImage(lowQualityImgData, 'JPEG', centeredX, centeredY, reducedWidth, reducedHeight);
            
            const fileName = createSafeFileName(formData, '_lowquality');
            lowQualityPdf.save(fileName);
            
            console.log(`✅ PDF de baja calidad creado exitosamente: ${fileName}`);
            return { success: true, fileName, lowQuality: true };
            
        } catch (error) {
            console.error('❌ Error en PDF de baja calidad:', error.message);
            lastError = error;
        }
    }
    
    // Strategy 4: Text-only emergency PDF
    if (fallbackStrategies.includes('split_content')) {
        try {
            console.log('📄 Intento 4: PDF de emergencia solo texto');
            
            const emergencyPdf = createEmergencyTextPDF(formData);
            const fileName = createSafeFileName(formData, '_emergency');
            emergencyPdf.save(fileName);
            
            console.log(`✅ PDF de emergencia creado exitosamente: ${fileName}`);
            return { success: true, fileName, emergency: true };
            
        } catch (error) {
            console.error('❌ Error en PDF de emergencia:', error.message);
            lastError = error;
        }
    }
    
    // If all strategies fail, throw the last error
    throw new Error(`Todas las estrategias de PDF fallaron. Último error: ${lastError?.message || 'Unknown'}`);
}

function compressCanvas(canvas, quality = 0.7) {
    console.log(`🗜️ Comprimiendo canvas con calidad ${quality}...`);
    
    const compressedCanvas = document.createElement('canvas');
    const compressedCtx = compressedCanvas.getContext('2d');
    
    // Reduce dimensions for compression
    const scale = Math.sqrt(quality);
    compressedCanvas.width = canvas.width * scale;
    compressedCanvas.height = canvas.height * scale;
    
    // Draw scaled down version
    compressedCtx.drawImage(canvas, 0, 0, compressedCanvas.width, compressedCanvas.height);
    
    console.log(`✅ Canvas comprimido: ${canvas.width}x${canvas.height} → ${compressedCanvas.width}x${compressedCanvas.height}`);
    return compressedCanvas;
}

function createSafeFileName(formData, suffix = '') {
    try {
        const clientName = (formData.clientName || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const receiptNumber = (formData.receiptNumber || 'RECIBO').replace(/[^a-zA-Z0-9\-]/g, '');
        return `Recibo_${receiptNumber}_${clientName}${suffix}.pdf`;
    } catch (error) {
        console.error('Error creando nombre de archivo:', error);
        return `Recibo_${Date.now()}${suffix}.pdf`;
    }
}

function createEmergencyTextPDF(formData) {
    console.log('🆘 Creando PDF de emergencia solo con texto...');
    
    // FIXED: Corrección detección jsPDF para PDF de emergencia
    let jsPDF;
    if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        throw new Error('jsPDF library not available for emergency PDF');
    }
    
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CIAOCIAO.MX - RECIBO', 20, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    let y = 50;
    const lineHeight = 7;
    
    // Add form data as text
    const fields = [
        ['Número de Recibo:', formData.receiptNumber || 'N/A'],
        ['Fecha:', formData.receiptDate || 'N/A'],
        ['Cliente:', formData.clientName || 'N/A'],
        ['Teléfono:', formData.clientPhone || 'N/A'],
        ['Email:', formData.clientEmail || 'N/A'],
        ['Tipo de Transacción:', formData.transactionType || 'N/A'],
        ['Tipo de Joya:', formData.jewelryType || 'N/A'],
        ['Material:', formData.material || 'N/A'],
        ['Peso:', formData.weight || 'N/A'],
        ['Descripción:', formData.description || 'N/A'],
        ['Precio:', formData.price ? `$${formData.price}` : 'N/A'],
        ['Anticipo:', formData.deposit ? `$${formData.deposit}` : 'N/A'],
        ['Saldo:', formData.balance ? `$${formData.balance}` : 'N/A']
    ];
    
    fields.forEach(([label, value]) => {
        if (y > 280) { // Add new page if needed
            pdf.addPage();
            y = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value).substring(0, 50), 70, y);
        y += lineHeight;
    });
    
    // Add emergency notice
    y += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(255, 0, 0);
    pdf.text('⚠️ Este PDF fue generado en modo de emergencia debido a problemas técnicos.', 20, y);
    pdf.text('Algunas características visuales pueden estar limitadas.', 20, y + lineHeight);
    
    return pdf;
}

// ==================== DIAGNÓSTICO DE FIRMAS ESPECÍFICO ====================

// Función de diagnóstico específico del estado de las firmas
function diagnoseSignatureState() {
    console.log('🔍 Iniciando diagnóstico específico de estado de firmas...');
    
    const diagnosis = {
        hasIssues: false,
        issue: null,
        clientSignature: null,
        companySignature: null,
        canvasStates: []
    };
    
    try {
        // Verificar SignaturePad del cliente
        if (typeof signaturePad !== 'undefined' && signaturePad) {
            diagnosis.clientSignature = {
                exists: true,
                isEmpty: signaturePad.isEmpty ? signaturePad.isEmpty() : 'unknown',
                canvasExists: !!signaturePad.canvas,
                canvasVisible: signaturePad.canvas ? signaturePad.canvas.offsetParent !== null : false
            };
            
            // Verificar problemas específicos
            if (!signaturePad.canvas) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Canvas de firma de cliente no existe';
                return diagnosis;
            }
            
            if (signaturePad.canvas.offsetParent === null) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Canvas de firma de cliente no es visible';
                return diagnosis;
            }
            
            // Test de toDataURL
            try {
                const testDataUrl = signaturePad.toDataURL();
                if (!testDataUrl || testDataUrl === 'data:,') {
                    diagnosis.hasIssues = true;
                    diagnosis.issue = 'Canvas de cliente no puede generar imagen válida';
                    return diagnosis;
                }
            } catch (dataUrlError) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Error ejecutando toDataURL en firma de cliente: ' + dataUrlError.message;
                return diagnosis;
            }
            
            console.log('✅ SignaturePad cliente: OK');
        } else {
            diagnosis.hasIssues = true;
            diagnosis.issue = 'SignaturePad de cliente no está inicializado';
            return diagnosis;
        }
        
        // Verificar SignaturePad de la empresa (si existe)
        if (typeof companySignaturePad !== 'undefined' && companySignaturePad) {
            diagnosis.companySignature = {
                exists: true,
                isEmpty: companySignaturePad.isEmpty ? companySignaturePad.isEmpty() : 'unknown',
                canvasExists: !!companySignaturePad.canvas,
                canvasVisible: companySignaturePad.canvas ? companySignaturePad.canvas.offsetParent !== null : false
            };
            
            if (!companySignaturePad.canvas) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Canvas de firma de empresa no existe';
                return diagnosis;
            }
            
            if (companySignaturePad.canvas.offsetParent === null) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Canvas de firma de empresa no es visible';
                return diagnosis;
            }
            
            // Test de toDataURL para empresa
            try {
                const testDataUrl = companySignaturePad.toDataURL();
                if (!testDataUrl || testDataUrl === 'data:,') {
                    diagnosis.hasIssues = true;
                    diagnosis.issue = 'Canvas de empresa no puede generar imagen válida';
                    return diagnosis;
                }
            } catch (dataUrlError) {
                diagnosis.hasIssues = true;
                diagnosis.issue = 'Error ejecutando toDataURL en firma de empresa: ' + dataUrlError.message;
                return diagnosis;
            }
            
            console.log('✅ SignaturePad empresa: OK');
        } else {
            console.log('ℹ️ SignaturePad de empresa no está presente (esto es normal si no se usa)');
        }
        
        console.log('✅ Diagnóstico de firmas completado sin problemas');
        
    } catch (error) {
        diagnosis.hasIssues = true;
        diagnosis.issue = 'Error durante diagnóstico: ' + error.message;
        console.error('❌ Error en diagnóstico de firmas:', error);
    }
    
    return diagnosis;
}

// Enhanced error handling for the final catch block
function handlePDFGenerationError(error) {
    console.error('🚨 Error crítico en generación de PDF:', error);
    console.error('🔧 Stack trace completo:', error.stack);
    console.error('🔧 Tipo de error:', typeof error, error.constructor.name);
    
    // ENHANCED SIGNATURE-SPECIFIC DIAGNOSIS
    // Diagnóstico específico de firmas antes de clasificar como genérico
    const diagnoseSignatureError = () => {
        try {
            console.log('🔍 Iniciando diagnóstico específico de firmas...');
            
            // Verificar estado de SignaturePads
            const clientSigState = window.signaturePad ? {
                exists: true,
                isEmpty: window.signaturePad.isEmpty ? window.signaturePad.isEmpty() : 'método no disponible',
                canvasExists: !!document.getElementById('signatureCanvas'),
                canvasVisible: document.getElementById('signatureCanvas')?.offsetParent !== null
            } : { exists: false };
            
            const companySigState = window.companySignaturePad ? {
                exists: true,
                isEmpty: window.companySignaturePad.isEmpty ? window.companySignaturePad.isEmpty() : 'método no disponible',
                canvasExists: !!document.getElementById('companySignatureCanvas'),
                canvasVisible: document.getElementById('companySignatureCanvas')?.offsetParent !== null
            } : { exists: false };
            
            console.log('🖊️ Estado SignaturePad Cliente:', clientSigState);
            console.log('🏢 Estado SignaturePad Empresa:', companySigState);
            
            // Probar toDataURL específicamente si existe
            if (window.signaturePad) {
                try {
                    const testData = window.signaturePad.toDataURL();
                    console.log('✅ signaturePad.toDataURL() funcional, longitud:', testData.length);
                } catch (toDataError) {
                    console.error('❌ ERROR EN signaturePad.toDataURL():', toDataError);
                    throw new Error(`SignaturePad cliente error: ${toDataError.message}`);
                }
            }
            
            if (window.companySignaturePad) {
                try {
                    const testCompanyData = window.companySignaturePad.toDataURL();
                    console.log('✅ companySignaturePad.toDataURL() funcional, longitud:', testCompanyData.length);
                } catch (toDataError) {
                    console.error('❌ ERROR EN companySignaturePad.toDataURL():', toDataError);
                    throw new Error(`SignaturePad empresa error: ${toDataError.message}`);
                }
            }
            
        } catch (diagError) {
            console.error('🔍 Error en diagnóstico de firmas:', diagError);
            throw diagError; // Re-throw para manejo específico
        }
    };
    
    // Cleanup resources
    cleanupPDFResources();
    
    // Determine error type and provide specific guidance
    let errorMessage = 'Error al generar PDF';
    let suggestion = 'Intente nuevamente';
    
    // ENHANCED ERROR CLASSIFICATION WITH SIGNATURE DIAGNOSIS
    if (error.message.includes('SignaturePad') || error.message.includes('toDataURL') || error.message.includes('firma')) {
        errorMessage = 'Error específico en firmas digitales';
        suggestion = 'Verifique que las firmas estén correctamente dibujadas y los canvas sean visibles';
        
        try {
            diagnoseSignatureError();
        } catch (sigError) {
            errorMessage = `Error de firma específico: ${sigError.message}`;
            suggestion = 'Problema identificado en sistema de firmas. Limpie firmas y reintente.';
        }
    } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        errorMessage = 'Memoria insuficiente para generar PDF';
        suggestion = 'Cierre otras pestañas y vuelva a intentar';
    } else if (error.message.includes('timeout')) {
        errorMessage = 'La generación de PDF tomó demasiado tiempo';
        suggestion = 'El contenido es muy complejo. Intente con menos imágenes';
    } else if (error.message.includes('canvas')) {
        errorMessage = 'Error procesando el contenido visual';
        suggestion = 'Verifique las imágenes y firmas, luego intente nuevamente';
    } else if (error.message.includes('jsPDF') || error.message.includes('addImage')) {
        errorMessage = 'Error en la creación del archivo PDF';
        suggestion = 'Algunos datos pueden estar corruptos. Revise el formulario';
    }
    
    // Show error with fallback options
    if (window.utils && utils.showNotification) {
        utils.showNotification(`${errorMessage}. ${suggestion}`, 'error');
    } else {
        alert(`${errorMessage}. ${suggestion}`);
    }
    
    // FIXED: Offer immediate fallback options including window.print()
    setTimeout(() => {
        const printChoice = confirm('❌ Fallo generación PDF. ¿Desea IMPRIMIR el recibo directamente desde el navegador?');
        if (printChoice) {
            console.log('🖨️ Fallback a window.print()');
            try {
                // Generate receipt HTML and print directly
                const printWindow = window.open('', '_blank');
                const receiptHTML = generateReceiptHTML();
                
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Recibo - Ciaociao.mx</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                @media print { body { margin: 0; } }
                            </style>
                        </head>
                        <body>
                            ${receiptHTML}
                            <script>
                                window.onload = function() { 
                                    window.print(); 
                                    setTimeout(function(){ window.close(); }, 1000);
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                
                if (window.utils && utils.showNotification) {
                    utils.showNotification('Recibo enviado a imprimir', 'success');
                }
            } catch (printError) {
                console.error('Error en fallback print:', printError);
                
                // Last fallback: Emergency text PDF
                const emergencyChoice = confirm('❌ Error en impresión. ¿Desea generar PDF de emergencia (solo texto)?');
                if (emergencyChoice) {
                    try {
                        const formData = collectFormData();
                        const emergencyPdf = createEmergencyTextPDF(formData);
                        const fileName = createSafeFileName(formData, '_emergency_manual');
                        emergencyPdf.save(fileName);
                        
                        if (window.utils && utils.showNotification) {
                            utils.showNotification('PDF de emergencia generado exitosamente', 'success');
                        }
                    } catch (emergencyError) {
                        console.error('Error en PDF de emergencia manual:', emergencyError);
                        if (window.utils && utils.showNotification) {
                            utils.showNotification('❌ No fue posible generar ningún PDF ni imprimir', 'error');
                        }
                        alert('❌ CRÍTICO: No se pudo generar PDF ni imprimir. Por favor, copie manualmente los datos del recibo.');
                    }
                }
            }
        } else {
            // User declined print, offer PDF emergency
            const pdfChoice = confirm('¿Desea intentar generar un PDF simplificado de emergencia (solo texto)?');
            if (pdfChoice) {
                try {
                    const formData = collectFormData();
                    const emergencyPdf = createEmergencyTextPDF(formData);
                    const fileName = createSafeFileName(formData, '_emergency_manual');
                    emergencyPdf.save(fileName);
                    
                    if (window.utils && utils.showNotification) {
                        utils.showNotification('PDF de emergencia generado exitosamente', 'success');
                    }
                } catch (emergencyError) {
                    console.error('Error en PDF de emergencia manual:', emergencyError);
                    if (window.utils && utils.showNotification) {
                        utils.showNotification('No fue posible generar ningún PDF', 'error');
                    }
                }
            }
        }
    }, 1500); // Reduced delay for faster fallback
}

// Expose utilities globally for debugging
window.checkMemoryPressure = checkMemoryPressure;
window.cleanupPDFResources = cleanupPDFResources;
window.generateCanvasWithErrorRecovery = generateCanvasWithErrorRecovery;
window.createPDFWithErrorRecovery = createPDFWithErrorRecovery;
window.handlePDFGenerationError = handlePDFGenerationError;

// ==================== ROBUST FALLBACK SYSTEM V2.0 ====================

const PDFFallbackSystem = {
    maxRetries: 3,
    retryDelay: 2000,
    
    strategies: [
        { name: 'high_quality', scale: 2, quality: 0.9, timeout: 30000 },
        { name: 'medium_quality', scale: 1.5, quality: 0.7, timeout: 20000 },
        { name: 'low_quality', scale: 1, quality: 0.5, timeout: 15000 }
    ],
    
    checkDependencies() {
        return {
            jsPDF: this.checkJsPDF(),
            html2canvas: typeof html2canvas !== 'undefined',
            canvas2d: this.checkCanvas2D()
        };
    },
    
    checkJsPDF() {
        if (window.jsPDF) return { available: true, source: 'window.jsPDF' };
        if (window.jspdf?.jsPDF) return { available: true, source: 'window.jspdf.jsPDF' };
        return { available: false, source: null };
    },
    
    checkCanvas2D() {
        try {
            const canvas = document.createElement('canvas');
            return canvas.getContext('2d') !== null;
        } catch (e) {
            return false;
        }
    },
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    clearMemory() {
        try {
            // Limpiar elementos pesados del DOM
            const heavyElements = document.querySelectorAll('canvas, img[src^="data:"]');
            heavyElements.forEach(el => {
                if (el.tagName === 'CANVAS') {
                    const ctx = el.getContext('2d');
                    ctx?.clearRect(0, 0, el.width, el.height);
                }
            });
            
            // Forzar garbage collection si está disponible
            if (window.gc) window.gc();
            console.log('🧹 FALLBACK: Memoria limpiada');
        } catch (e) {
            console.warn('⚠️ FALLBACK: Error limpiando memoria:', e.message);
        }
    },
    
    async createEmergencyPDF(formData) {
        console.log('🆘 FALLBACK: Creando PDF de emergencia...');
        
        try {
            const jsPDFCheck = this.checkJsPDF();
            if (!jsPDFCheck.available) {
                throw new Error('jsPDF no disponible para PDF de emergencia');
            }
            
            const jsPDF = jsPDFCheck.source === 'window.jsPDF' ? window.jsPDF : window.jspdf.jsPDF;
            const pdf = new jsPDF('l', 'mm', 'a4');
            
            // Configurar PDF de emergencia
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.text('CIAOCIAO.MX - RECIBO DE EMERGENCIA', 20, 30);
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            
            let y = 50;
            const line = 8;
            
            // Información básica
            pdf.text(`No. Recibo: ${formData.receiptNumber}`, 20, y); y += line;
            pdf.text(`Fecha: ${formData.receiptDate}`, 20, y); y += line;
            pdf.text(`Cliente: ${formData.clientName}`, 20, y); y += line;
            pdf.text(`Teléfono: ${formData.clientPhone}`, 20, y); y += line * 1.5;
            
            // Producto
            pdf.text(`Producto: ${formData.pieceType} - ${formData.material}`, 20, y); y += line;
            if (formData.description) {
                pdf.text(`Descripción: ${formData.description.substring(0, 60)}...`, 20, y); y += line * 1.5;
            }
            
            // Financiero
            pdf.setFont('helvetica', 'bold');
            pdf.text(`PRECIO: ${utils.formatCurrency(formData.price)}`, 20, y); y += line;
            if (formData.contribution > 0) {
                pdf.text(`APORTACIÓN: ${utils.formatCurrency(formData.contribution)}`, 20, y); y += line;
            }
            if (formData.deposit > 0) {
                pdf.text(`ANTICIPO: ${utils.formatCurrency(formData.deposit)}`, 20, y); y += line;
                pdf.text(`SALDO: ${utils.formatCurrency(formData.balance)}`, 20, y); y += line;
            }
            
            // Nota de emergencia
            y += line * 2;
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 0, 0);
            pdf.text('⚠️ RECIBO DE EMERGENCIA: Generado sin imágenes por problemas técnicos.', 20, y);
            y += line;
            pdf.text('Para recibo completo con fotos y firmas, intente nuevamente más tarde.', 20, y);
            
            const fileName = `Recibo_Emergencia_${formData.receiptNumber}_${formData.clientName?.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
            
            console.log('✅ FALLBACK: PDF de emergencia creado exitosamente');
            utils.showNotification('PDF de emergencia generado (sin imágenes)', 'warning');
            return true;
            
        } catch (error) {
            console.error('❌ FALLBACK: Error en PDF de emergencia:', error);
            return false;
        }
    }
};

// Exponer sistema de fallback para debugging
window.PDFFallbackSystem = PDFFallbackSystem;

// ==================== CROSS-BROWSER COMPATIBILITY SYSTEM ====================

const CrossBrowserSupport = {
    // Detección de navegador y versión
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const browsers = {
            chrome: /Chrome\/(\d+)/.exec(userAgent),
            firefox: /Firefox\/(\d+)/.exec(userAgent),
            safari: /Version\/(\d+).*Safari/.exec(userAgent),
            edge: /Edg\/(\d+)/.exec(userAgent),
            ie: /MSIE (\d+)|Trident.*rv:(\d+)/.exec(userAgent)
        };
        
        for (const [name, match] of Object.entries(browsers)) {
            if (match) {
                return {
                    name,
                    version: parseInt(match[1] || match[2]),
                    userAgent,
                    supported: this.isBrowserSupported(name, parseInt(match[1] || match[2]))
                };
            }
        }
        
        return {
            name: 'unknown',
            version: 0,
            userAgent,
            supported: false
        };
    },
    
    // Definir niveles de soporte por navegador
    isBrowserSupported(browser, version) {
        const minimumVersions = {
            chrome: 80,   // Soporte completo para html2canvas y jsPDF
            firefox: 78,  // ESR con compatibilidad completa
            safari: 13,   // Soporte para canvas y PDF moderno
            edge: 80,     // Chromium-based Edge
            ie: 0         // No soportado
        };
        
        return version >= (minimumVersions[browser] || 0);
    },
    
    // Verificar características específicas del navegador
    checkFeatureSupport() {
        const features = {
            canvas2d: this.checkCanvas2D(),
            webWorkers: typeof Worker !== 'undefined',
            localStorage: this.checkLocalStorage(),
            fileAPI: typeof FileReader !== 'undefined',
            blob: typeof Blob !== 'undefined',
            arrayBuffer: typeof ArrayBuffer !== 'undefined',
            promises: typeof Promise !== 'undefined',
            asyncAwait: this.checkAsyncAwait(),
            cssVariables: this.checkCSSVariables(),
            flexbox: this.checkFlexbox(),
            es6: this.checkES6Support()
        };
        
        return features;
    },
    
    checkCanvas2D() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            return ctx !== null && typeof ctx.drawImage === 'function';
        } catch (e) {
            return false;
        }
    },
    
    checkLocalStorage() {
        try {
            const test = 'browser_test';
            localStorage.setItem(test, '1');
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    checkAsyncAwait() {
        try {
            return Object.getPrototypeOf(async function(){}).constructor.name === 'AsyncFunction';
        } catch (e) {
            return false;
        }
    },
    
    checkCSSVariables() {
        try {
            return window.CSS && CSS.supports('color', 'var(--fake-var)');
        } catch (e) {
            return false;
        }
    },
    
    checkFlexbox() {
        try {
            return window.CSS && CSS.supports('display', 'flex');
        } catch (e) {
            const testEl = document.createElement('div');
            testEl.style.display = 'flex';
            return testEl.style.display === 'flex';
        }
    },
    
    checkES6Support() {
        try {
            eval('const test = () => {}; class Test {}');
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Análisis completo de compatibilidad
    getCompatibilityReport() {
        const browser = this.detectBrowser();
        const features = this.checkFeatureSupport();
        const pdfLibs = this.checkPDFLibraries();
        
        // Calcular puntuación de compatibilidad
        const featureCount = Object.keys(features).length;
        const supportedFeatures = Object.values(features).filter(Boolean).length;
        const compatibilityScore = Math.round((supportedFeatures / featureCount) * 100);
        
        const report = {
            browser,
            features,
            pdfLibraries: pdfLibs,
            compatibilityScore,
            recommendations: this.generateRecommendations(browser, features, pdfLibs),
            tested: new Date().toISOString()
        };
        
        return report;
    },
    
    checkPDFLibraries() {
        return {
            jsPDF: {
                available: !!(window.jsPDF || (window.jspdf && window.jspdf.jsPDF)),
                source: window.jsPDF ? 'window.jsPDF' : 
                       (window.jspdf && window.jspdf.jsPDF) ? 'window.jspdf.jsPDF' : null,
                canInstantiate: this.testJsPDFInstantiation()
            },
            html2canvas: {
                available: typeof html2canvas !== 'undefined',
                canExecute: this.testHtml2CanvasExecution()
            },
            signaturePad: {
                available: typeof SignaturePad !== 'undefined',
                canInstantiate: this.testSignaturePadInstantiation()
            }
        };
    },
    
    testJsPDFInstantiation() {
        try {
            let jsPDF;
            if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else {
                return false;
            }
            
            const test = new jsPDF();
            return typeof test.save === 'function';
        } catch (e) {
            return false;
        }
    },
    
    testHtml2CanvasExecution() {
        if (typeof html2canvas === 'undefined') return false;
        
        try {
            // Test básico con elemento simple
            const testDiv = document.createElement('div');
            testDiv.style.width = '10px';
            testDiv.style.height = '10px';
            testDiv.style.background = 'red';
            testDiv.style.position = 'absolute';
            testDiv.style.left = '-9999px';
            document.body.appendChild(testDiv);
            
            // No ejecutar realmente html2canvas, solo verificar que la función existe
            const result = typeof html2canvas === 'function';
            
            document.body.removeChild(testDiv);
            return result;
        } catch (e) {
            return false;
        }
    },
    
    testSignaturePadInstantiation() {
        if (typeof SignaturePad === 'undefined') return false;
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const pad = new SignaturePad(canvas);
            return typeof pad.clear === 'function';
        } catch (e) {
            return false;
        }
    },
    
    // Generar recomendaciones específicas
    generateRecommendations(browser, features, pdfLibs) {
        const recommendations = [];
        
        // Recomendaciones por navegador
        if (!browser.supported) {
            if (browser.name === 'ie') {
                recommendations.push('❌ Internet Explorer no es compatible. Use Chrome, Firefox o Edge moderno.');
            } else if (browser.name === 'safari' && browser.version < 13) {
                recommendations.push('⚠️ Safari muy antiguo. Actualice a Safari 13+ para mejor compatibilidad.');
            } else if (browser.name === 'chrome' && browser.version < 80) {
                recommendations.push('⚠️ Chrome desactualizado. Actualice a Chrome 80+ para funcionalidad completa.');
            } else if (browser.name === 'firefox' && browser.version < 78) {
                recommendations.push('⚠️ Firefox desactualizado. Actualice a Firefox 78+ para mejor estabilidad.');
            } else {
                recommendations.push('⚠️ Navegador no reconocido o versión muy antigua. Use navegador moderno.');
            }
        }
        
        // Recomendaciones por características
        if (!features.canvas2d) {
            recommendations.push('❌ Canvas 2D no disponible. PDFs no se pueden generar.');
        }
        if (!features.localStorage) {
            recommendations.push('⚠️ LocalStorage no disponible. Historial no se guardará.');
        }
        if (!features.fileAPI) {
            recommendations.push('⚠️ File API no disponible. Carga de imágenes limitada.');
        }
        if (!features.promises || !features.asyncAwait) {
            recommendations.push('❌ JavaScript moderno no soportado. Sistema no funcionará correctamente.');
        }
        if (!features.cssVariables) {
            recommendations.push('⚠️ CSS Variables no soportadas. Estilos pueden verse mal.');
        }
        if (!features.flexbox) {
            recommendations.push('⚠️ Flexbox no soportado. Layout puede verse mal.');
        }
        
        // Recomendaciones por librerías PDF
        if (!pdfLibs.jsPDF.available) {
            recommendations.push('❌ jsPDF no cargado. Recargue la página.');
        } else if (!pdfLibs.jsPDF.canInstantiate) {
            recommendations.push('❌ jsPDF no funciona correctamente. Revise conexión a internet.');
        }
        if (!pdfLibs.html2canvas.available) {
            recommendations.push('❌ html2canvas no cargado. Recargue la página.');
        }
        if (!pdfLibs.signaturePad.available) {
            recommendations.push('❌ SignaturePad no cargado. Firmas no disponibles.');
        }
        
        // Recomendaciones generales
        if (recommendations.length === 0) {
            recommendations.push('✅ Navegador totalmente compatible. Sistema funcionará correctamente.');
        } else if (recommendations.filter(r => r.startsWith('❌')).length === 0) {
            recommendations.push('⚠️ Compatibilidad parcial. Sistema funcionará con limitaciones menores.');
        }
        
        return recommendations;
    },
    
    // Mostrar reporte de compatibilidad
    displayCompatibilityReport() {
        const report = this.getCompatibilityReport();
        
        console.log('🌐 REPORTE DE COMPATIBILIDAD CROSS-BROWSER:');
        console.log('==========================================');
        console.log(`Navegador: ${report.browser.name} ${report.browser.version}`);
        console.log(`Soporte: ${report.browser.supported ? '✅ Sí' : '❌ No'}`);
        console.log(`Puntuación: ${report.compatibilityScore}%`);
        console.log('');
        
        console.log('Características:');
        Object.entries(report.features).forEach(([feature, supported]) => {
            console.log(`  ${supported ? '✅' : '❌'} ${feature}`);
        });
        console.log('');
        
        console.log('Librerías PDF:');
        Object.entries(report.pdfLibraries).forEach(([lib, info]) => {
            console.log(`  ${info.available ? '✅' : '❌'} ${lib}`);
            if (lib === 'jsPDF' && info.available) {
                console.log(`    Fuente: ${info.source}`);
                console.log(`    Funcional: ${info.canInstantiate ? '✅' : '❌'}`);
            }
        });
        console.log('');
        
        console.log('Recomendaciones:');
        report.recommendations.forEach(rec => {
            console.log(`  ${rec}`);
        });
        
        return report;
    },
    
    // Aplicar parches específicos por navegador
    applyBrowserSpecificFixes() {
        const browser = this.detectBrowser();
        
        // Fix para Safari
        if (browser.name === 'safari') {
            // Safari tiene problemas con algunos métodos de canvas
            this.applySafariFixes();
        }
        
        // Fix para Firefox
        if (browser.name === 'firefox') {
            // Firefox puede tener problemas con ciertas animaciones CSS
            this.applyFirefoxFixes();
        }
        
        // Fix para Edge legacy
        if (browser.name === 'edge' && browser.version < 80) {
            this.applyEdgeLegacyFixes();
        }
        
        console.log(`🔧 Fixes específicos aplicados para ${browser.name} ${browser.version}`);
    },
    
    applySafariFixes() {
        // Mejorar compatibilidad con Canvas en Safari
        if (window.CanvasRenderingContext2D) {
            const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage = function(...args) {
                try {
                    return originalDrawImage.apply(this, args);
                } catch (e) {
                    console.warn('Safari canvas drawImage fix applied:', e.message);
                    // Retry con parámetros simplificados
                    if (args.length > 5) {
                        return originalDrawImage.call(this, args[0], args[1], args[2]);
                    }
                    throw e;
                }
            };
        }
    },
    
    applyFirefoxFixes() {
        // Fix para problemas de renderizado en Firefox
        const style = document.createElement('style');
        style.textContent = `
            @-moz-document url-prefix() {
                .pdf-content * {
                    -moz-osx-font-smoothing: grayscale;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    applyEdgeLegacyFixes() {
        // Polyfills para Edge legacy
        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                return this.indexOf(search, start || 0) !== -1;
            };
        }
        
        if (!Array.prototype.find) {
            Array.prototype.find = function(predicate) {
                for (let i = 0; i < this.length; i++) {
                    if (predicate(this[i], i, this)) return this[i];
                }
                return undefined;
            };
        }
    }
};

// Exponer sistema para debugging
window.CrossBrowserSupport = CrossBrowserSupport;

async function generatePDF() {
    console.log('📄 generatePDF() LLAMADA - Generando PDF...');
    try {
        console.log('🔄 Iniciando generación de PDF...');
        
        // CRITICAL: Verify PDF generation dependencies
        const missingDependencies = [];
        
        // Robust jsPDF detection matching generatePDF logic
        let jsPDFAvailable = false;
        if (window.jsPDF) {
            jsPDFAvailable = true;
            console.log('✅ Initial check: jsPDF detected in standard format (window.jsPDF)');
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFAvailable = true;
            console.log('✅ Initial check: jsPDF detected in alternate format (window.jspdf.jsPDF)');
        }
        
        if (!jsPDFAvailable) {
            missingDependencies.push('jsPDF');
            console.log('❌ Initial check: jsPDF not available in any format');
        }
        
        if (typeof html2canvas === 'undefined') {
            missingDependencies.push('html2canvas');
        }
        
        if (missingDependencies.length > 0) {
            const errorMsg = `❌ CRITICAL: Missing PDF dependencies: ${missingDependencies.join(', ')}`;
            console.error(errorMsg);
            
            if (window.utils && utils.showNotification) {
                utils.showNotification('Error: Librerías de PDF no disponibles. Recarga la página.', 'error');
            } else {
                alert('Error: No se pueden generar PDFs. Librerías no cargadas. Recarga la página.');
            }
            
            // Try to wait and retry once
            console.log('🔄 Esperando bibliotecas y reintentando en 3 segundos...');
            setTimeout(() => {
                if ((window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) && typeof html2canvas !== 'undefined') {
                    console.log('✅ Bibliotecas disponibles, reintentando PDF...');
                    generatePDF(); // Recursive retry
                } else {
                    console.error('❌ Bibliotecas PDF no disponibles después de retry');
                }
            }, 3000);
            
            return;
        }
        
        console.log('✅ PDF dependencies confirmed available');
        console.log('🔧 DETAILED LOGGING: jsPDF source detection:', {
            'window.jsPDF exists': !!window.jsPDF,
            'window.jspdf exists': !!window.jspdf,
            'window.jspdf.jsPDF exists': !!(window.jspdf && window.jspdf.jsPDF)
        });
        
        // SISTEMA MULTI-FORMATO PDF: Soporte A4 y US Letter para evitar truncamiento de moneda
        const PDF_PRINT_DPI = 300;
        
        // Función para obtener dimensiones según formato de papel
        function getPDFDimensions(paperFormat = 'US_LETTER') {
            const formats = {
                'A4': {
                    width_mm: 297,    // landscape width
                    height_mm: 210,   // landscape height
                    name: 'A4 (297×210mm)'
                },
                'US_LETTER': {
                    width_mm: 300.0,  // INCREASED: 11.8 inches = 300mm landscape (más espacio para moneda)
                    height_mm: 225.0, // INCREASED: 8.9 inches = 225mm landscape (más espacio vertical)
                    name: 'US Letter Extended (11.8×8.9")'
                }
            };
            
            const format = formats[paperFormat] || formats['US_LETTER'];
            const margin_mm = 10;
            const MM_TO_PX = PDF_PRINT_DPI / 25.4; // 11.811 px/mm at 300 DPI
            
            return {
                format: format,
                width_px: Math.round(format.width_mm * MM_TO_PX),
                height_px: Math.round(format.height_mm * MM_TO_PX),
                margin_px: Math.round(margin_mm * MM_TO_PX),
                content_width: Math.round((format.width_mm - (margin_mm * 2)) * MM_TO_PX),
                content_height: Math.round((format.height_mm - (margin_mm * 2)) * MM_TO_PX)
            };
        }
        
        // Detectar formato preferido (US Letter por defecto para joyería US/MX)
        const preferredFormat = localStorage.getItem('ciaociao_pdfFormat') || 'US_LETTER';
        const pdfDimensions = getPDFDimensions(preferredFormat);
        
        // Variables optimizadas para evitar truncamiento de moneda
        const A4_WIDTH_MM = pdfDimensions.format.width_mm;
        const A4_HEIGHT_MM = pdfDimensions.format.height_mm; 
        const MARGIN_MM = 10;
        const MM_TO_PX = PDF_PRINT_DPI / 25.4;
        const A4_WIDTH_PX = pdfDimensions.width_px;
        const A4_HEIGHT_PX = pdfDimensions.height_px;
        const MARGIN_PX = pdfDimensions.margin_px;
        const CONTENT_WIDTH = pdfDimensions.content_width;  // US Letter: 2922px vs A4: 3271px
        const CONTENT_HEIGHT = pdfDimensions.content_height;
        
        console.log(`📐 PDF Dimensions: ${pdfDimensions.format.name} ${A4_WIDTH_PX}x${A4_HEIGHT_PX}px, Content: ${CONTENT_WIDTH}x${CONTENT_HEIGHT}px (optimizado para evitar truncamiento)`);
        
        if (!validateForm()) {
            console.log('❌ Validación de formulario falló');
            if (window.utils && utils.showNotification) {
                utils.showNotification('Por favor completa todos los campos requeridos', 'warning');
            }
            return;
        }
        
        // Show loading with proper fallback
        try {
            if (window.utils && utils.showLoading) {
                utils.showLoading('Generando PDF...');
            } else {
                console.log('⚠️ Loading indicator not available, continuing with PDF generation');
            }
        } catch (error) {
            console.warn('⚠️ Error showing loading indicator:', error);
        }
        
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
        console.log('🔧 DETAILED LOGGING: Form data collected:', {
            receiptNumber: formData.receiptNumber,
            clientName: formData.clientName?.substring(0, 20) + '...',
            hasDeposit: formData.deposit > 0,
            transactionType: formData.transactionType
        });
        
        // CURRENCY DEBUG: Log all currency values being processed
        console.log('💰 CURRENCY DEBUG: Financial values to be rendered:', {
            price: formData.price,
            contribution: formData.contribution,
            subtotal: formData.subtotal,
            deposit: formData.deposit,
            balance: formData.balance,
            formattedPrice: utils.formatCurrency(formData.price),
            formattedContribution: utils.formatCurrency(formData.contribution),
            formattedSubtotal: utils.formatCurrency(formData.subtotal),
            formattedDeposit: utils.formatCurrency(formData.deposit),
            formattedBalance: utils.formatCurrency(formData.balance)
        });
        
        // Crear contenedor temporal para el recibo con configuración optimizada para PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateReceiptHTML();
        
        // PDF-FIRST DESIGN: Configuración en tamaño real de impresión A4
        // ENHANCED: Formato-específico width y overflow handling para prevenir truncamiento
        const extraWidthForCurrency = preferredFormat === 'US_LETTER' ? 400 : 350; // EXTRA INCREASED: More padding for currency anti-truncation
        const containerWidth = CONTENT_WIDTH + extraWidthForCurrency;
        
        tempDiv.style.cssText = `
            position: absolute !important;
            left: -9999px !important;
            top: 0 !important;
            width: ${containerWidth}px !important;
            min-height: ${CONTENT_HEIGHT}px !important;
            background: #ffffff !important;
            padding: 0 !important;
            font-size: 36px !important;
            line-height: 1.4 !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
            color: #000000 !important;
            box-sizing: border-box !important;
            z-index: -1000 !important;
            overflow: visible !important;
            white-space: normal !important;
        `;
        
        tempDiv.className = 'pdf-content';
        document.body.appendChild(tempDiv);
        
        console.log('📐 Contenedor temporal creado y agregado al DOM');
        console.log('🔧 DETAILED LOGGING: Temp div configuration:', {
            innerHTML_length: tempDiv.innerHTML.length,
            width: tempDiv.style.width,
            height: tempDiv.style.minHeight,
            position: tempDiv.style.position,
            elementCount: tempDiv.querySelectorAll('*').length
        });
        
        // CURRENCY DEBUG: Check financial table dimensions
        const financialTables = tempDiv.querySelectorAll('table');
        console.log('💰 CURRENCY DEBUG: Financial tables analysis:');
        financialTables.forEach((table, i) => {
            const currencyTds = table.querySelectorAll('td[style*="text-align: right"]');
            console.log(`  Table ${i}:`, {
                tableWidth: table.offsetWidth,
                currencyCells: currencyTds.length,
                cellWidths: Array.from(currencyTds).map(td => ({
                    content: td.textContent.trim(),
                    width: td.offsetWidth,
                    computedStyle: window.getComputedStyle(td).width
                }))
            });
        });
        
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
        console.log('🔧 DETAILED LOGGING: Image processing complete:', {
            totalImages: images.length,
            loadedImages: images.length - Array.from(images).filter(img => !img.complete).length,
            imagesWithErrors: Array.from(images).filter(img => img.naturalWidth === 0).length
        });
        
        // Tiempo adicional para asegurar renderizado completo
        console.log('⏳ Esperando renderizado completo...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar que el elemento aún está en el DOM
        if (!document.body.contains(tempDiv)) {
            throw new Error('El contenedor temporal fue removido del DOM');
        }
        
        console.log('🎨 Iniciando captura con html2canvas...');
        
        // ENHANCED: Pre-PDF validation for currency formatting
        const currencyValidation = validateCurrencyBeforePDF();
        if (!currencyValidation.valid) {
            console.warn('⚠️ Currency validation issues detected:', currencyValidation.issues);
            // Attempt automatic correction
            fixCurrencyFormatting();
        }
        
        // Calcular dimensiones optimizadas según formato de papel para evitar truncamiento
        const contentWidth = Math.max(
            tempDiv.scrollWidth,
            tempDiv.offsetWidth,
            tempDiv.clientWidth,
            containerWidth // Usar el ancho calculado para el formato específico
        );
        
        const contentHeight = Math.max(
            tempDiv.scrollHeight,
            tempDiv.offsetHeight,
            tempDiv.clientHeight
        );
        
        console.log('📐 Análisis de estructura del contenido:', {
            scrollWidth: tempDiv.scrollWidth,
            scrollHeight: tempDiv.scrollHeight,
            offsetWidth: tempDiv.offsetWidth,
            offsetHeight: tempDiv.offsetHeight,
            clientWidth: tempDiv.clientWidth,
            clientHeight: tempDiv.clientHeight,
            calculatedWidth: contentWidth,
            calculatedHeight: contentHeight,
            hasHorizontalOverflow: tempDiv.scrollWidth > tempDiv.clientWidth,
            hasVerticalOverflow: tempDiv.scrollHeight > tempDiv.clientHeight
        });
        
        // Verificar cada sección para debug de estructura
        const sections = tempDiv.querySelectorAll('.pdf-section, [class*="section"]');
        console.log('📋 Análisis de secciones:');
        sections.forEach((section, i) => {
            const rect = section.getBoundingClientRect();
            const tempRect = tempDiv.getBoundingClientRect();
            console.log(`  Sección ${i} (${section.className}):`, {
                top: section.offsetTop,
                height: section.offsetHeight,
                bottom: section.offsetTop + section.offsetHeight,
                isVisible: rect.bottom > tempRect.top && rect.top < tempRect.bottom
            });
        });
        
        // CONFIGURACIÓN ULTRA-SIMPLE - Solo opciones básicas necesarias
        const canvasOptions = {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        };
        
        console.log(`📸 Configuración html2canvas optimizada para ${pdfDimensions.format.name}:`, canvasOptions);
        console.log(`💰 ANTI-TRUNCACIÓN: Usando ${preferredFormat} (${CONTENT_WIDTH}px base + ${extraWidthForCurrency}px padding = ${containerWidth}px total)`);
        
        // Sin opciones de fallback complejas - sistema debe funcionar directamente
        
        // CURRENCY DEBUG: Final container dimensions before canvas generation
        const containerRect = tempDiv.getBoundingClientRect();
        console.log('💰 CURRENCY DEBUG: Final container dimensions:', {
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            contentWidth: CONTENT_WIDTH,
            enhancedWidth: CONTENT_WIDTH + extraWidthForCurrency,
            canvasWidth: canvasOptions.width,
            canvasHeight: canvasOptions.height
        });
        
        // GENERACIÓN DIRECTA DE CANVAS - Sin sistema de recuperación complejo
        console.log('🎨 Generando canvas con html2canvas...');
        const canvas = await html2canvas(tempDiv, canvasOptions);
        
        console.log(`✅ Canvas generado - Dimensiones: ${canvas.width}x${canvas.height}`);
        
        // Verificación básica
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('El canvas generado está vacío');
        }
        
        console.log('📄 Creando PDF con jsPDF...');
        
        // FIXED: Corrección crítica detección jsPDF - soporta window.jsPDF y window.jspdf.jsPDF
        let jsPDF, jsPDFSource;
        if (window.jsPDF) {
            jsPDF = window.jsPDF;
            jsPDFSource = 'window.jsPDF';
            console.log('✅ jsPDF detectado como window.jsPDF');
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
            jsPDFSource = 'window.jspdf.jsPDF';
            console.log('✅ jsPDF detectado como window.jspdf.jsPDF');
        } else {
            console.error('❌ jsPDF no encontrado en window.jsPDF ni window.jspdf.jsPDF');
            throw new Error('jsPDF library not available');
        }
        
        // Test instantiation before proceeding with PDF generation
        try {
            const testPdf = new jsPDF();
            console.log('✅ jsPDF instantiation test successful using:', jsPDFSource);
        } catch (instantiationError) {
            console.error('❌ jsPDF instantiation test failed:', instantiationError);
            throw new Error(`jsPDF instantiation failed: ${instantiationError.message}`);
        }
        
        // Crear PDF en orientación horizontal (landscape)
        const pdf = new jsPDF('l', 'mm', 'a4');
        console.log('🔧 DETAILED LOGGING: jsPDF instance created successfully using:', jsPDFSource);
        
        // Convertir canvas a imagen con máxima calidad
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Verificar que imgData no está vacío
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
            throw new Error('Los datos de imagen están vacíos o corruptos');
        }
        
        // SISTEMA DE SCALING INTELIGENTE OPTIMIZADO - LANDSCAPE
        const pageWidth = 297;  // A4 LANDSCAPE width in mm
        const pageHeight = 210; // A4 LANDSCAPE height in mm
        
        // Obtener metadatos del contenido para scaling inteligente
        const contentMetadata = {
            textLength: tempDiv.textContent?.length || 0,
            imageCount: tempDiv.querySelectorAll('img').length,
            clientNameLength: (formData.clientName || '').length,
            descriptionLength: (formData.description || '').length,
            stonesLength: (formData.stones || '').length,
            complexity: (formData.stones?.length > 100 || formData.description?.length > 200) ? 'high' : 'medium'
        };
        
        console.log('🧠 Metadatos del contenido:', contentMetadata);
        
        // Calcular dimensiones iniciales en mm
        const PX_TO_MM_300DPI = 25.4 / PDF_PRINT_DPI;
        const canvasWidthMM = canvas.width * PX_TO_MM_300DPI;
        const canvasHeightMM = canvas.height * PX_TO_MM_300DPI;
        
        console.log(`📐 Canvas original: ${canvas.width}x${canvas.height}px → ${canvasWidthMM.toFixed(1)}x${canvasHeightMM.toFixed(1)}mm`);
        console.log(`🔧 DIMENSIONES CORREGIDAS: A4 landscape ${pageWidth}x${pageHeight}mm con contenido optimizado`);
        
        // Aplicar scaling inteligente si existe la función
        let finalWidth = canvasWidthMM;
        let finalHeight = canvasHeightMM;
        let x, y;
        
        if (typeof window.calculateAdvancedPDFScaling === 'function') {
            try {
                const scalingResult = window.calculateAdvancedPDFScaling(
                    canvas.width, 
                    canvas.height, 
                    contentMetadata
                );
                
                finalWidth = scalingResult.finalWidth;
                finalHeight = scalingResult.finalHeight;
                x = scalingResult.x;
                y = scalingResult.y;
                
                console.log('🎯 Scaling inteligente aplicado:', {
                    algorithm: scalingResult.algorithm,
                    scaleFactor: scalingResult.scaleFactor?.toFixed(3),
                    utilization: scalingResult.utilizationScore?.toFixed(1) + '%'
                });
            } catch (scalingError) {
                console.warn('⚠️ Error en scaling inteligente, usando fallback:', scalingError);
                // Fallback a centering manual
                x = (pageWidth - finalWidth) / 2;
                y = (pageHeight - finalHeight) / 2;
            }
        } else {
            console.log('🔄 Usando scaling básico optimizado con dimensiones corregidas');
            // Scaling básico optimizado - márgenes reducidos para landscape
            const maxWidth = pageWidth - 12; // Margen reducido de 6mm por lado
            const maxHeight = pageHeight - 12;
            
            console.log(`🔧 Espacios disponibles: ${maxWidth}x${maxHeight}mm vs contenido: ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}mm`);
            
            if (finalWidth > maxWidth || finalHeight > maxHeight) {
                const scaleW = maxWidth / finalWidth;
                const scaleH = maxHeight / finalHeight;
                const scale = Math.min(scaleW, scaleH);
                
                console.log(`📏 Factores de escala: ancho=${scaleW.toFixed(3)}, alto=${scaleH.toFixed(3)}, usando=${scale.toFixed(3)}`);
                
                finalWidth *= scale;
                finalHeight *= scale;
                
                console.log(`🔄 Contenido reescalado por factor ${scale.toFixed(3)} → ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}mm`);
            } else {
                console.log('✅ Contenido cabe sin reescalado en dimensiones landscape corregidas');
            }
            
            // Centrar en página con cálculo explícito
            x = (pageWidth - finalWidth) / 2;
            y = (pageHeight - finalHeight) / 2;
            
            console.log(`🎯 Posición centrada: x=${x.toFixed(1)}mm, y=${y.toFixed(1)}mm`);
        }
        
        console.log(`📄 Dimensiones finales optimizadas: ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}mm`);
        console.log(`📄 Posición: x=${x.toFixed(1)}mm, y=${y.toFixed(1)}mm`);

        // ENHANCED PDF CREATION WITH ERROR RECOVERY
        // =========================================
        await createPDFWithErrorRecovery(pdf, imgData, {
            x, y, finalWidth, finalHeight,
            canvas,
            formData,
            maxRetries: 3,
            fallbackStrategies: ['compress', 'reduce_quality', 'split_content']
        });
        
        console.log(`💾 PDF generado y guardado exitosamente con error recovery`);
        
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
        console.error('❌ Error crítico generando PDF:', error);
        console.error('Stack trace:', error.stack);
        utils.hideLoading();
        
        // Limpiar elemento temporal si existe
        const tempDiv = document.querySelector('div[style*="position: absolute"][style*="left: -9999px"]');
        if (tempDiv && tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
            console.log('🧹 Elemento temporal limpiado');
        }
        
        // SISTEMA DE EMERGENCIA DESACTIVADO - Usuario requiere que funcione correctamente
        console.error('❌ ERROR EN GENERACIÓN PDF: Sistema principal falló');
        console.error('⚠️ NO se generará PDF de emergencia - debe funcionar correctamente');
        console.error('🎯 Revise el error y corrija el sistema principal');
        
        // Use enhanced error handling system if fallback failed
        handlePDFGenerationError(error);
        
        // Additional cleanup for memory management
        if (window.gc) {
            window.gc();
            console.log('🧹 Garbage collection forzado después del error');
        }
        
        // Remove any remaining canvas elements that might be consuming memory
        const canvasElements = document.querySelectorAll('canvas[style*="position: absolute"]');
        canvasElements.forEach(canvas => {
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });
        
        // DIAGNÓSTICO ESPECÍFICO DE FIRMAS - Implementado según reporte Playwright
        console.log('🔍 Iniciando diagnóstico específico de error...');
        
        // Primero ejecutar diagnóstico completo de firmas ANTES de clasificación genérica
        let signatureErrorFound = false;
        let specificErrorMessage = null;
        
        try {
            // Diagnóstico de estado de SignaturePads
            const signatureDiagnosis = diagnoseSignatureState();
            console.log('📊 Diagnóstico de firmas:', signatureDiagnosis);
            
            if (signatureDiagnosis.hasIssues) {
                signatureErrorFound = true;
                specificErrorMessage = `Error específico de firmas: ${signatureDiagnosis.issue}`;
                console.log('🎯 Error específico de firmas identificado:', signatureDiagnosis.issue);
            }
        } catch (diagError) {
            console.warn('⚠️ Error en diagnóstico de firmas:', diagError);
            // Continuar con análisis manual
        }
        
        // Análisis específico por tipo de error si el diagnóstico no encontró nada
        if (!signatureErrorFound) {
            if (error.message.includes('toDataURL') || error.message.includes('canvas') || error.stack?.includes('canvas')) {
                signatureErrorFound = true;
                specificErrorMessage = 'Error en canvas de firma: Problema convirtiendo firma a imagen. Verifique que las firmas estén visibles.';
                console.log('🎯 Error de canvas identificado');
            } else if (error.message.includes('SignaturePad') || error.stack?.includes('SignaturePad')) {
                signatureErrorFound = true;
                specificErrorMessage = 'Error en SignaturePad: Problema con la inicialización del sistema de firmas.';
                console.log('🎯 Error de SignaturePad identificado');
            } else if (error.message.includes('isEmpty') || error.stack?.includes('isEmpty')) {
                signatureErrorFound = true;
                specificErrorMessage = 'Error validando firmas: No se puede determinar si las firmas están vacías.';
                console.log('🎯 Error de validación de firmas identificado');
            } else if (error.message.includes('firma') || error.message.includes('signature')) {
                signatureErrorFound = true;
                specificErrorMessage = 'Error general en sistema de firmas. Limpie las firmas y reintente.';
                console.log('🎯 Error general de firmas identificado');
            }
        }
        
        // Establecer mensaje según hallazgos
        if (signatureErrorFound) {
            errorMessage = specificErrorMessage;
            suggestion = 'Use el botón "Limpiar Firma" en ambas firmas, vuelva a firmar y reintente generar el PDF.';
            console.log('✅ Error específico de firmas detectado y clasificado');
        } else if (error.message.includes('vacío') || error.message.includes('empty')) {
            errorMessage = 'Error: el contenido del recibo está vacío. Verifique los datos.';
            suggestion = 'Complete todos los campos obligatorios antes de generar el PDF.';
        } else if (error.message.includes('PDF') && !signatureErrorFound) {
            errorMessage = 'Error en generación de PDF: ' + error.message;
            suggestion = 'Verifique los datos del recibo e intente nuevamente.';
        } else {
            // Solo usar mensaje genérico si NO hay indicios de problemas de firmas
            errorMessage = 'Error desconocido en generación de PDF. Consulte la consola para detalles.';
            suggestion = 'Revise los logs de la consola, refresque la página e intente nuevamente.';
            console.log('⚠️ Error verdaderamente genérico - sin relación con firmas');
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
        
        // Mensaje específico según estado de entrega
        const isDelivered = formData.deliveryStatus === 'entregado';
        const hasBalance = parseFloat(formData.balance) > 0;
        
        if (isDelivered && !hasBalance) {
            message += `\n*ESTADO:* ✅ Pieza entregada y conforme\n`;
            message += `El cliente ha recibido la pieza satisfactoriamente.\n`;
        } else if (formData.deliveryStatus === 'proceso') {
            message += `\n*ESTADO:* 🔧 En proceso de fabricación\n`;
            message += `La pieza está siendo elaborada según especificaciones.\n`;
        } else {
            message += `\n*ESTADO:* 📦 Pago registrado - Pendiente de entrega\n`;
            if (hasBalance > 0) {
                message += `Saldo pendiente de ${utils.formatCurrency(balance)} para completar.\n`;
            }
        }
        
        if (!isDelivered || hasBalance > 0) {
            message += `\n*Métodos de pago disponibles:*\n`;
            message += `💰 Efectivo en tienda\n`;
            message += `💳 Tarjeta/PayPal\n`;
            message += `📲 Transferencia\n`;
        }
        
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

// ==================== TESTING & DEBUGGING FUNCTIONS ====================

/**
 * FIXED: Función de testing para depuración de PDF generation
 * Verifica dependencias, estado del sistema y genera PDF de prueba
 */
async function testPDFGeneration(skipValidation = false) {
    console.log('🧪 === INICIANDO TEST PDF GENERATION ===');
    
    const testResults = {
        dependencies: {},
        memoryStatus: {},
        testResult: null,
        errors: []
    };
    
    try {
        // 1. Test jsPDF detection
        console.log('🔍 1. Testing jsPDF detection...');
        let jsPDFAvailable = false;
        let jsPDFSource = null;
        
        if (window.jsPDF) {
            jsPDFAvailable = true;
            jsPDFSource = 'window.jsPDF';
            testResults.dependencies.jsPDF = { available: true, source: 'window.jsPDF' };
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFAvailable = true;
            jsPDFSource = 'window.jspdf.jsPDF';
            testResults.dependencies.jsPDF = { available: true, source: 'window.jspdf.jsPDF' };
        } else {
            testResults.dependencies.jsPDF = { available: false, source: null };
            testResults.errors.push('jsPDF not available');
        }
        
        console.log(`✅ jsPDF: ${jsPDFAvailable ? 'AVAILABLE' : 'NOT FOUND'} ${jsPDFSource ? `(${jsPDFSource})` : ''}`);
        
        // 2. Test html2canvas
        console.log('🔍 2. Testing html2canvas...');
        const html2canvasAvailable = typeof html2canvas !== 'undefined';
        testResults.dependencies.html2canvas = { available: html2canvasAvailable };
        console.log(`✅ html2canvas: ${html2canvasAvailable ? 'AVAILABLE' : 'NOT FOUND'}`);
        
        if (!html2canvasAvailable) {
            testResults.errors.push('html2canvas not available');
        }
        
        // 3. Memory status check
        console.log('🔍 3. Checking memory status...');
        if ('memory' in performance) {
            const memoryInfo = performance.memory;
            const memoryUsage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
            testResults.memoryStatus = {
                used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
                usage: Math.round(memoryUsage * 100)
            };
            console.log(`✅ Memory: ${testResults.memoryStatus.used}MB used, ${testResults.memoryStatus.usage}% of limit`);
        } else {
            testResults.memoryStatus = { available: false };
            console.log('⚠️ Memory info not available');
        }
        
        // 4. Test form data collection
        console.log('🔍 4. Testing form data collection...');
        let formDataTest = null;
        try {
            formDataTest = collectFormData();
            console.log('✅ Form data collection: SUCCESS');
        } catch (formError) {
            console.error('❌ Form data collection: FAILED', formError.message);
            testResults.errors.push(`Form data error: ${formError.message}`);
        }
        
        // 5. Test receipt HTML generation
        console.log('🔍 5. Testing receipt HTML generation...');
        try {
            const testHTML = generateReceiptHTML();
            console.log(`✅ Receipt HTML generation: SUCCESS (${testHTML.length} chars)`);
        } catch (htmlError) {
            console.error('❌ Receipt HTML generation: FAILED', htmlError.message);
            testResults.errors.push(`HTML generation error: ${htmlError.message}`);
        }
        
        // 6. Test PDF creation if dependencies are available
        if (jsPDFAvailable && html2canvasAvailable && (skipValidation || validateForm())) {
            console.log('🔍 6. Testing actual PDF creation...');
            
            try {
                // Create minimal test PDF
                let jsPDF;
                if (window.jsPDF) {
                    jsPDF = window.jsPDF;
                } else {
                    jsPDF = window.jspdf.jsPDF;
                }
                
                const testPdf = new jsPDF('l', 'mm', 'a4');
                testPdf.setFontSize(16);
                testPdf.text('TEST PDF GENERATION', 20, 30);
                testPdf.text('This is a test PDF created by testPDFGeneration()', 20, 50);
                testPdf.text(`Timestamp: ${new Date().toISOString()}`, 20, 70);
                
                // Test if we can save it
                testPdf.save('test_pdf_generation.pdf');
                
                console.log('✅ PDF creation test: SUCCESS');
                testResults.testResult = 'SUCCESS';
                
            } catch (pdfError) {
                console.error('❌ PDF creation test: FAILED', pdfError.message);
                testResults.errors.push(`PDF creation error: ${pdfError.message}`);
                testResults.testResult = 'FAILED';
            }
        } else {
            console.log('⚠️ 6. Skipping PDF creation test - dependencies not available or form not valid');
            testResults.testResult = 'SKIPPED';
        }
        
        // 7. Summary
        console.log('🧪 === TEST SUMMARY ===');
        console.log('Dependencies:', testResults.dependencies);
        console.log('Memory Status:', testResults.memoryStatus);
        console.log('Test Result:', testResults.testResult);
        if (testResults.errors.length > 0) {
            console.log('Errors Found:', testResults.errors);
        }
        
        // Show notification to user
        const errorCount = testResults.errors.length;
        if (errorCount === 0 && testResults.testResult === 'SUCCESS') {
            if (window.utils && utils.showNotification) {
                utils.showNotification('✅ PDF System Test: ALL PASSED', 'success');
            }
        } else {
            const message = `⚠️ PDF System Test: ${errorCount} errors found. Check console for details.`;
            if (window.utils && utils.showNotification) {
                utils.showNotification(message, 'warning');
            }
        }
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Critical error in testPDFGeneration:', error);
        testResults.errors.push(`Critical test error: ${error.message}`);
        testResults.testResult = 'CRITICAL_ERROR';
        return testResults;
    }
}

// ENHANCED: Currency validation and correction functions
function validateCurrencyBeforePDF() {
    console.log('🔍 Validating currency formatting before PDF generation...');
    const issues = [];
    let validCount = 0;
    
    // Find all currency elements in the document
    const currencyElements = document.querySelectorAll('.currency-value, [data-currency="true"]');
    
    currencyElements.forEach((element, index) => {
        const text = element.textContent || '';
        const dataValue = element.dataset.value;
        
        console.log(`💰 Checking currency element ${index}: "${text}" (data-value: ${dataValue})`);
        
        // Check for common formatting issues
        if (text.match(/\$\d+,\d{2}$/)) {  // Pattern like $20,00 (missing thousands)
            issues.push({
                element: element,
                issue: 'truncated_thousands',
                text: text,
                dataValue: dataValue,
                suggestion: `Missing thousands separator in: ${text}`
            });
        }
        
        if (!text.match(/\.\d{2}$/)) {  // Missing 2 decimal places
            issues.push({
                element: element,
                issue: 'missing_decimals',
                text: text,
                dataValue: dataValue,
                suggestion: `Missing decimal places in: ${text}`
            });
        }
        
        if (text.match(/\$\d+\.\d{1}$/)) {  // Only 1 decimal place
            issues.push({
                element: element,
                issue: 'single_decimal',
                text: text,
                dataValue: dataValue,
                suggestion: `Only one decimal place in: ${text}`
            });
        }
        
        // Validate against data-value if available
        if (dataValue) {
            const expectedFormat = utils.formatCurrency(dataValue);
            if (text !== expectedFormat) {
                issues.push({
                    element: element,
                    issue: 'format_mismatch',
                    text: text,
                    dataValue: dataValue,
                    expected: expectedFormat,
                    suggestion: `Format mismatch: "${text}" should be "${expectedFormat}"`
                });
            } else {
                validCount++;
            }
        }
    });
    
    const result = {
        valid: issues.length === 0,
        totalElements: currencyElements.length,
        validCount: validCount,
        issues: issues
    };
    
    console.log('✅ Currency validation result:', result);
    return result;
}

function fixCurrencyFormatting() {
    console.log('🔧 Attempting automatic currency formatting correction...');
    let fixedCount = 0;
    
    const currencyElements = document.querySelectorAll('.currency-value, [data-currency="true"]');
    
    currencyElements.forEach((element, index) => {
        try {
            const dataValue = element.dataset.value;
            if (dataValue) {
                const numericValue = parseFloat(dataValue);
                if (!isNaN(numericValue)) {
                    const correctedFormat = utils.formatCurrency(numericValue);
                    const oldText = element.textContent;
                    element.textContent = correctedFormat;
                    console.log(`💰 Fixed currency ${index}: "${oldText}" → "${correctedFormat}"`);
                    fixedCount++;
                }
            }
        } catch (error) {
            console.error('❌ Error fixing currency element:', element, error);
        }
    });
    
    console.log(`✅ Fixed ${fixedCount} currency elements`);
    return fixedCount;
}

function emergencyCurrencyFix(element) {
    console.log('🚨 Emergency currency fix for element:', element);
    
    try {
        // Pattern to detect truncated currencies like $20,00 → $20,000.00
        const truncatedRegex = /\$(\d+),(\d{2})(?!\d)/g;
        const innerHTML = element.innerHTML;
        
        const fixedHTML = innerHTML.replace(truncatedRegex, (match, mainPart, lastTwo) => {
            // Assume truncation: $20,00 should be $20,000.00
            const assumedValue = parseFloat(`${mainPart}${lastTwo}0`);
            const correctedFormat = utils.formatCurrency(assumedValue);
            console.log(`🔧 Emergency fix: ${match} → ${correctedFormat} (assumed ${assumedValue})`);
            return correctedFormat;
        });
        
        if (fixedHTML !== innerHTML) {
            element.innerHTML = fixedHTML;
            return true;
        }
    } catch (error) {
        console.error('❌ Emergency currency fix failed:', error);
    }
    
    return false;
}

// ENHANCED: Canvas generation with fallback system
async function generateCanvasWithFallback(element, options) {
    console.log('🔄 Starting canvas generation with fallback system...');
    
    const fallbackOptions = options.fallbackOptions || [
        { scale: options.scale, description: 'Original configuration' },
        { scale: Math.max(1, options.scale - 0.5), description: 'Reduced scale fallback' },
        { scale: 1, description: 'Standard quality fallback' },
        { scale: 0.8, description: 'Low quality fallback' }
    ];
    
    let lastError = null;
    
    for (let i = 0; i < fallbackOptions.length; i++) {
        const fallback = fallbackOptions[i];
        console.log(`🎯 Attempt ${i + 1}/${fallbackOptions.length}: ${fallback.description} (scale: ${fallback.scale})`);
        
        try {
            const fallbackCanvasOptions = {
                ...options,
                scale: fallback.scale
            };
            
            // Remove fallbackOptions from the html2canvas call to avoid confusion
            delete fallbackCanvasOptions.fallbackOptions;
            
            const canvas = await Promise.race([
                html2canvas(element, fallbackCanvasOptions),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Canvas generation timeout')), 15000)
                )
            ]);
            
            // Validate canvas
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('Generated canvas is empty or invalid');
            }
            
            // ENHANCED: Validate currency content in canvas
            const currencyValidation = await validateCurrencyInCanvas(canvas, element);
            if (!currencyValidation.valid) {
                console.warn(`⚠️ Currency validation failed for attempt ${i + 1}:`, currencyValidation.issues);
                
                // If this isn't the last attempt, try next fallback
                if (i < fallbackOptions.length - 1) {
                    console.log(`🔄 Trying next fallback due to currency validation issues...`);
                    continue;
                }
                // If it's the last attempt, log warning but proceed
                console.warn('⚠️ Using canvas despite currency validation issues (last fallback)');
            }
            
            console.log(`✅ Canvas generation successful with ${fallback.description}`);
            console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);
            
            return canvas;
            
        } catch (error) {
            lastError = error;
            console.warn(`❌ Attempt ${i + 1} failed: ${error.message}`);
            
            // If this is the last attempt, apply emergency currency fix
            if (i === fallbackOptions.length - 1) {
                console.log('🚨 All fallback attempts failed, trying emergency currency fix...');
                const emergencyFixed = emergencyCurrencyFix(element);
                if (emergencyFixed) {
                    console.log('🔧 Emergency currency fix applied, retrying...');
                    try {
                        return await html2canvas(element, fallbackCanvasOptions);
                    } catch (emergencyError) {
                        console.error('❌ Emergency retry also failed:', emergencyError);
                    }
                }
            }
        }
    }
    
    // If all attempts failed, throw the last error
    console.error('❌ All canvas generation attempts failed');
    throw lastError || new Error('Canvas generation failed with unknown error');
}

async function validateCurrencyInCanvas(canvas, originalElement) {
    console.log('💰 Validating currency content in generated canvas...');
    
    try {
        // Get canvas as image data to analyze
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if canvas has content (not just white pixels)
        let hasContent = false;
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            return {
                valid: false,
                issues: ['Canvas appears to be empty or all white']
            };
        }
        
        // Check original element for currency values that should be in canvas
        const currencyElements = originalElement.querySelectorAll('.currency-value, [data-currency="true"]');
        const issues = [];
        let validCount = 0;
        
        currencyElements.forEach((element, index) => {
            const text = element.textContent || '';
            const dataValue = element.dataset.value;
            
            // Check for common formatting problems
            if (text.match(/\$\d+,\d{2}$/)) {  // Truncated thousands like $20,00
                issues.push(`Element ${index}: Truncated thousands in "${text}"`);
            }
            
            if (text.match(/\$[\d,]+\.\d{1}$/)) {  // Single decimal like $30,000.0
                issues.push(`Element ${index}: Single decimal in "${text}"`);
            }
            
            if (dataValue) {
                const expected = utils.formatCurrency(dataValue);
                if (text === expected) {
                    validCount++;
                } else {
                    issues.push(`Element ${index}: Format mismatch - "${text}" should be "${expected}"`);
                }
            }
        });
        
        const result = {
            valid: issues.length === 0,
            totalElements: currencyElements.length,
            validCount: validCount,
            issues: issues
        };
        
        console.log('💰 Currency validation in canvas result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Error validating currency in canvas:', error);
        return {
            valid: false,
            issues: [`Validation error: ${error.message}`]
        };
    }
}

// CRITICAL: Exponer funciones globalmente INMEDIATAMENTE al cargar el script
// Esto asegura que estén disponibles cuando auth.js las necesite
window.showPreview = showPreview;
// window.generatePDF = generatePDF; // Commented out to allow enhanced-pdf-generator.js to control PDF generation
window.shareWhatsApp = shareWhatsApp;
window.showHistory = showHistory;
window.generateReceiptNumber = generateReceiptNumber;
window.testPDFGeneration = testPDFGeneration; // FIXED: Export test function

console.log('✅ Script principal cargado completamente');
console.log('📦 Funciones críticas exportadas:', {
    showPreview: typeof window.showPreview,
    generatePDF: typeof window.generatePDF,
    shareWhatsApp: typeof window.shareWhatsApp,
    showHistory: typeof window.showHistory,
    generateReceiptNumber: typeof window.generateReceiptNumber,
    initializeApp: typeof window.initializeApp
});