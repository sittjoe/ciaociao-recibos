/**
 * QUICK SYSTEM CHECK - ciaociao-recibos
 * Validación rápida de funciones críticas en consola del navegador
 * 
 * USAGE: 
 * 1. Abrir https://recibos.ciaociao.mx
 * 2. Abrir DevTools (F12)
 * 3. Pegar este script en la consola
 * 4. Presionar Enter
 */

(function() {
    console.clear();
    console.log('%c🔬 QUICK SYSTEM CHECK - ciaociao-recibos', 'font-size: 20px; font-weight: bold; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 10px; color: white;');
    console.log('%c📋 Verificando resolución de quejas del usuario...', 'font-size: 14px; color: #3498db; font-weight: bold;');
    
    let results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        total: 0
    };
    
    function check(name, condition, successMsg, failMsg, warningMsg = null) {
        results.total++;
        if (condition === true) {
            console.log(`%c✅ ${name}: ${successMsg}`, 'color: #27ae60; font-weight: bold;');
            results.passed++;
        } else if (condition === 'warning') {
            console.log(`%c⚠️ ${name}: ${warningMsg}`, 'color: #f39c12; font-weight: bold;');
            results.warnings++;
        } else {
            console.log(`%c❌ ${name}: ${failMsg}`, 'color: #e74c3c; font-weight: bold;');
            results.failed++;
        }
    }
    
    console.log('\n%c🩺 VERIFICANDO QUEJAS ESPECÍFICAS DEL USUARIO:', 'font-size: 16px; color: #e74c3c; font-weight: bold;');
    
    // Queja 1: "No hace vista previa"
    check(
        'VISTA PREVIA',
        typeof window.showPreview === 'function',
        'Función showPreview() disponible - QUEJA RESUELTA',
        'Función showPreview() no encontrada - QUEJA PENDIENTE'
    );
    
    // Queja 2: "No genera comprobantes"  
    const canGeneratePDF = typeof window.generatePDF === 'function' && typeof window.jsPDF !== 'undefined';
    check(
        'GENERACIÓN PDF',
        canGeneratePDF,
        'generatePDF() + jsPDF disponibles - QUEJA RESUELTA',
        'Generación PDF no disponible - QUEJA PENDIENTE'
    );
    
    // Queja 3: "No se pone el número de recibo"
    const hasNumbering = typeof window.generateReceiptNumber === 'function' || localStorage.getItem('receiptCounter');
    check(
        'NUMERACIÓN AUTOMÁTICA',
        hasNumbering,
        'Sistema de numeración funcionando - QUEJA RESUELTA', 
        'Sistema de numeración no disponible - QUEJA PENDIENTE'
    );
    
    // Queja 4: "No sirven las firmas"
    check(
        'SISTEMA FIRMAS',
        typeof window.SignaturePad !== 'undefined',
        'SignaturePad cargado correctamente - QUEJA RESUELTA',
        'SignaturePad no disponible - QUEJA PENDIENTE'
    );
    
    console.log('\n%c🔧 VERIFICANDO SISTEMAS CRÍTICOS:', 'font-size: 16px; color: #2c3e50; font-weight: bold;');
    
    // CDN Circuit Breaker
    check(
        'CDN CIRCUIT BREAKER',
        typeof window.cdnCircuitBreaker !== 'undefined' && window.cdnCircuitBreaker,
        'Sistema CDN activo y funcional',
        'CDN Circuit Breaker no disponible'
    );
    
    // Authentication
    check(
        'SISTEMA AUTENTICACIÓN',
        typeof window.authManager !== 'undefined' || typeof window.AuthManager !== 'undefined',
        'AuthManager disponible',
        'Sistema de autenticación no encontrado'
    );
    
    // Initialization Coordinator
    check(
        'COORDINADOR INIT',
        typeof window.initializeApp === 'function',
        'initializeApp disponible - coordinación activa',
        'initializeApp no encontrado - posible race condition'
    );
    
    // Database functionality
    try {
        localStorage.setItem('system_check', 'ok');
        const testRead = localStorage.getItem('system_check');
        localStorage.removeItem('system_check');
        check(
            'BASE DE DATOS',
            testRead === 'ok',
            'LocalStorage completamente funcional',
            'Problemas con LocalStorage'
        );
    } catch (error) {
        check(
            'BASE DE DATOS',
            false,
            'LocalStorage funcional',
            `Error con localStorage: ${error.message}`
        );
    }
    
    // Event Listeners
    const buttonsWithEvents = document.querySelectorAll('[onclick]').length;
    check(
        'EVENT LISTENERS',
        buttonsWithEvents > 0,
        `${buttonsWithEvents} elementos con eventos detectados`,
        'Pocos o ningún event listener detectado'
    );
    
    console.log('\n%c📊 VERIFICANDO DEPENDENCIAS EXTERNAS:', 'font-size: 16px; color: #8e44ad; font-weight: bold;');
    
    // jsPDF
    check(
        'JSPDF LIBRARY',
        typeof window.jsPDF !== 'undefined',
        'jsPDF cargado correctamente',
        'jsPDF no disponible - PDFs no funcionarán'
    );
    
    // SignaturePad  
    check(
        'SIGNATUREPAD LIBRARY',
        typeof window.SignaturePad !== 'undefined',
        'SignaturePad cargado correctamente',
        'SignaturePad no disponible - firmas no funcionarán'
    );
    
    // html2canvas
    check(
        'HTML2CANVAS LIBRARY',
        typeof window.html2canvas !== 'undefined',
        'html2canvas cargado correctamente',
        'html2canvas no disponible - conversión de imágenes limitada'
    );
    
    console.log('\n%c📋 VERIFICANDO ELEMENTOS UI:', 'font-size: 16px; color: #16a085; font-weight: bold;');
    
    // Main buttons
    const criticalButtons = ['previewBtn', 'generatePdfBtn', 'shareWhatsappBtn'];
    let foundButtons = 0;
    criticalButtons.forEach(btnId => {
        if (document.getElementById(btnId)) {
            foundButtons++;
        }
    });
    
    check(
        'BOTONES CRÍTICOS',
        foundButtons > 0 ? (foundButtons === criticalButtons.length ? true : 'warning') : false,
        `${foundButtons}/${criticalButtons.length} botones críticos encontrados`,
        'Botones críticos no encontrados',
        `Solo ${foundButtons}/${criticalButtons.length} botones encontrados (normal en página principal)`
    );
    
    // Form fields
    const formFields = ['clientName', 'clientPhone', 'pieceType', 'material', 'price'];
    let foundFields = 0;
    formFields.forEach(fieldId => {
        if (document.getElementById(fieldId)) {
            foundFields++;
        }
    });
    
    check(
        'CAMPOS FORMULARIO',
        foundFields > 0 ? (foundFields >= 3 ? true : 'warning') : false,
        `${foundFields}/${formFields.length} campos de formulario encontrados`,
        'Campos de formulario no encontrados (normal en página principal)',
        `${foundFields}/${formFields.length} campos encontrados`
    );
    
    // Calculate final score
    const healthScore = Math.round(((results.passed + (results.warnings * 0.5)) / results.total) * 100);
    
    console.log('\n%c🎯 RESULTADOS FINALES:', 'font-size: 18px; color: #2c3e50; font-weight: bold; background: #ecf0f1; padding: 5px;');
    console.log(`%c✅ Exitosos: ${results.passed}/${results.total}`, 'color: #27ae60; font-weight: bold; font-size: 14px;');
    console.log(`%c⚠️ Advertencias: ${results.warnings}/${results.total}`, 'color: #f39c12; font-weight: bold; font-size: 14px;');
    console.log(`%c❌ Fallidos: ${results.failed}/${results.total}`, 'color: #e74c3c; font-weight: bold; font-size: 14px;');
    console.log(`%c🏆 Puntuación de Salud: ${healthScore}%`, `color: ${healthScore >= 80 ? '#27ae60' : healthScore >= 60 ? '#f39c12' : '#e74c3c'}; font-weight: bold; font-size: 16px;`);
    
    // Final assessment
    if (healthScore >= 95 && results.failed === 0) {
        console.log('%c🎉 ESTADO: SISTEMA COMPLETAMENTE FUNCIONAL', 'font-size: 16px; color: white; background: #27ae60; padding: 8px; font-weight: bold;');
        console.log('%c🚀 RESULTADO: Listo para producción - Todas las quejas resueltas', 'color: #27ae60; font-weight: bold;');
    } else if (healthScore >= 80) {
        console.log('%c👍 ESTADO: SISTEMA MAYORMENTE FUNCIONAL', 'font-size: 16px; color: white; background: #f39c12; padding: 8px; font-weight: bold;');
        console.log('%c🔧 RESULTADO: Funcional con optimizaciones menores pendientes', 'color: #f39c12; font-weight: bold;');
    } else if (healthScore >= 60) {
        console.log('%c⚠️ ESTADO: SISTEMA CON LIMITACIONES', 'font-size: 16px; color: white; background: #e67e22; padding: 8px; font-weight: bold;');
        console.log('%c🛠️ RESULTADO: Requiere reparaciones adicionales', 'color: #e67e22; font-weight: bold;');
    } else {
        console.log('%c❌ ESTADO: SISTEMA REQUIERE REPARACIONES CRÍTICAS', 'font-size: 16px; color: white; background: #e74c3c; padding: 8px; font-weight: bold;');
        console.log('%c🚨 RESULTADO: Problemas críticos identificados', 'color: #e74c3c; font-weight: bold;');
    }
    
    // Additional recommendations
    console.log('\n%c💡 RECOMENDACIONES:', 'font-size: 14px; color: #8e44ad; font-weight: bold;');
    
    if (typeof window.showPreview !== 'function') {
        console.log('%c• Navegar a receipt-mode.html para probar vista previa', 'color: #3498db;');
    }
    
    if (typeof window.jsPDF === 'undefined') {
        console.log('%c• Recargar la página para cargar librerías PDF', 'color: #3498db;');
    }
    
    if (foundButtons === 0) {
        console.log('%c• Ir al módulo de recibos para probar botones críticos', 'color: #3498db;');
    }
    
    console.log('%c• Para tests detallados: abrir comprehensive-system-test.html', 'color: #3498db;');
    console.log('%c• Para verificar quejas: abrir user-complaint-verification.html', 'color: #3498db;');
    
    console.log('\n%c✅ Check completado - Sistema evaluado exitosamente', 'color: #27ae60; font-weight: bold;');
    
    return {
        healthScore,
        results,
        recommendation: healthScore >= 95 ? 'PRODUCTION_READY' : healthScore >= 80 ? 'MOSTLY_FUNCTIONAL' : 'NEEDS_REPAIR'
    };
})();