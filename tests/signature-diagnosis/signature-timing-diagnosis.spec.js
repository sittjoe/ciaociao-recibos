const { test, expect } = require('@playwright/test');

/**
 * DIAGNÓSTICO DE TIMING ISSUES Y CANVAS VISIBILITY
 * 
 * Objetivo: Identificar problemas de timing entre inicialización de canvas,
 * carga de SignaturePad library, y uso de las firmas durante PDF generation
 */

test.describe('Diagnóstico de Timing y Visibilidad', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/receipt-mode.html');
    
    // Login
    const passwordInput = page.locator('#authPassword');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('27181730');
    await page.click('#authSubmit');
    
    await page.waitForSelector('#clientName', { state: 'visible' });
  });

  test('Diagnóstico completo de timing y visibilidad', async ({ page }) => {
    console.log('🧪 Test: Diagnóstico completo de timing y visibilidad');

    let timingLog = [];

    // Instrumentar el sistema para capturar todos los eventos de timing
    await page.evaluateOnNewDocument(() => {
      const timing = [];
      
      const logEvent = (event, data = {}) => {
        timing.push({
          timestamp: new Date().toISOString(),
          performanceNow: performance.now(),
          event: event,
          data: data
        });
        window.signatureTimingLog = timing;
      };

      // 1. Interceptar carga de SignaturePad library
      const originalSignaturePad = window.SignaturePad;
      Object.defineProperty(window, 'SignaturePad', {
        get: function() {
          logEvent('SignaturePad_library_accessed', { available: !!originalSignaturePad });
          return originalSignaturePad;
        },
        set: function(value) {
          logEvent('SignaturePad_library_set', { exists: !!value });
          window._SignaturePad = value;
        }
      });

      // 2. Interceptar inicialización de SignaturePads
      const originalInitialize = window.initializeSignaturePad;
      window.initializeSignaturePad = function() {
        logEvent('initializeSignaturePad_start', {
          SignaturePadAvailable: typeof window.SignaturePad !== 'undefined',
          clientCanvasExists: !!document.getElementById('signatureCanvas'),
          companyCanvasExists: !!document.getElementById('companySignatureCanvas')
        });
        
        try {
          const result = originalInitialize ? originalInitialize.call(this) : null;
          
          logEvent('initializeSignaturePad_end', {
            success: true,
            signaturePadExists: !!window.signaturePad,
            companySignaturePadExists: !!window.companySignaturePad
          });
          
          return result;
        } catch (error) {
          logEvent('initializeSignaturePad_error', {
            error: error.message,
            stack: error.stack
          });
          throw error;
        }
      };

      // 3. Interceptar getValidSignatureData
      const originalGetValidSignatureData = window.getValidSignatureData;
      window.getValidSignatureData = function(signaturePad) {
        const startTime = performance.now();
        
        logEvent('getValidSignatureData_start', {
          signaturePadExists: !!signaturePad,
          hasIsEmpty: signaturePad ? typeof signaturePad.isEmpty === 'function' : false,
          hasToDataURL: signaturePad ? typeof signaturePad.toDataURL === 'function' : false
        });
        
        try {
          const result = originalGetValidSignatureData ? originalGetValidSignatureData.call(this, signaturePad) : null;
          const endTime = performance.now();
          
          logEvent('getValidSignatureData_end', {
            success: true,
            hasResult: !!result,
            resultValid: result ? result.startsWith('data:image/') : false,
            duration: endTime - startTime
          });
          
          return result;
        } catch (error) {
          const endTime = performance.now();
          
          logEvent('getValidSignatureData_error', {
            error: error.message,
            stack: error.stack,
            duration: endTime - startTime
          });
          
          throw error;
        }
      };

      // 4. Interceptar collectFormData
      const originalCollectFormData = window.collectFormData;
      window.collectFormData = function() {
        const startTime = performance.now();
        
        logEvent('collectFormData_start', {
          signaturePadExists: !!window.signaturePad,
          companySignaturePadExists: !!window.companySignaturePad
        });
        
        try {
          const result = originalCollectFormData ? originalCollectFormData.call(this) : null;
          const endTime = performance.now();
          
          logEvent('collectFormData_end', {
            success: true,
            hasSignature: !!(result && result.signature),
            hasCompanySignature: !!(result && result.companySignature),
            duration: endTime - startTime
          });
          
          return result;
        } catch (error) {
          const endTime = performance.now();
          
          logEvent('collectFormData_error', {
            error: error.message,
            stack: error.stack,
            duration: endTime - startTime
          });
          
          throw error;
        }
      };

      // 5. Interceptar generateReceiptHTML
      const originalGenerateReceiptHTML = window.generateReceiptHTML;
      window.generateReceiptHTML = function() {
        const startTime = performance.now();
        
        logEvent('generateReceiptHTML_start');
        
        try {
          const result = originalGenerateReceiptHTML ? originalGenerateReceiptHTML.call(this) : null;
          const endTime = performance.now();
          
          logEvent('generateReceiptHTML_end', {
            success: true,
            duration: endTime - startTime
          });
          
          return result;
        } catch (error) {
          const endTime = performance.now();
          
          logEvent('generateReceiptHTML_error', {
            error: error.message,
            stack: error.stack,
            duration: endTime - startTime
          });
          
          throw error;
        }
      };

      // 6. Monitor canvas visibility changes
      const observeCanvas = (canvasId) => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && (
                mutation.attributeName === 'style' || 
                mutation.attributeName === 'class'
              )) {
                logEvent(`canvas_${canvasId}_visibility_change`, {
                  display: window.getComputedStyle(canvas).display,
                  visibility: window.getComputedStyle(canvas).visibility,
                  opacity: window.getComputedStyle(canvas).opacity
                });
              }
            });
          });
          
          observer.observe(canvas, { attributes: true });
          observer.observe(canvas.parentElement, { attributes: true, subtree: true });
        }
      };

      // Start observing when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          observeCanvas('signatureCanvas');
          observeCanvas('companySignatureCanvas');
        });
      } else {
        observeCanvas('signatureCanvas');
        observeCanvas('companySignatureCanvas');
      }

      logEvent('timing_instrumentation_complete');
    });

    // Llenar formulario básico
    await page.fill('#clientName', 'Test Timing Diagnosis');
    await page.fill('#clientPhone', '1234567890');
    await page.selectOption('#transactionType', 'Compra');
    await page.selectOption('#pieceType', 'Anillo');
    await page.selectOption('#material', 'Oro');
    await page.fill('#price', '1000');

    // Capturar timing log después del llenado del formulario
    let currentTimingLog = await page.evaluate(() => window.signatureTimingLog || []);
    console.log('📊 Timing log después del llenado:', JSON.stringify(currentTimingLog, null, 2));

    // Esperar a que SignaturePads estén listos
    await page.waitForFunction(() => {
      return window.signaturePad && window.companySignaturePad;
    }, { timeout: 15000 });

    // Capturar timing después de inicialización
    currentTimingLog = await page.evaluate(() => window.signatureTimingLog || []);
    console.log('📊 Timing log después de inicialización SignaturePads');

    // Test de visibilidad de canvas durante diferentes fases
    const visibilityTest = await page.evaluate(() => {
      const clientCanvas = document.getElementById('signatureCanvas');
      const companyCanvas = document.getElementById('companySignatureCanvas');
      
      const getElementInfo = (element) => ({
        exists: !!element,
        visible: element ? window.getComputedStyle(element).display !== 'none' : false,
        opacity: element ? window.getComputedStyle(element).opacity : null,
        visibility: element ? window.getComputedStyle(element).visibility : null,
        offsetDimensions: element ? { width: element.offsetWidth, height: element.offsetHeight } : null,
        canvasDimensions: element ? { width: element.width, height: element.height } : null,
        inViewport: element ? (element.getBoundingClientRect().top >= 0 && element.getBoundingClientRect().bottom <= window.innerHeight) : false
      });
      
      return {
        timestamp: new Date().toISOString(),
        clientCanvas: getElementInfo(clientCanvas),
        companyCanvas: getElementInfo(companyCanvas)
      };
    });

    console.log('📊 Test de visibilidad:', JSON.stringify(visibilityTest, null, 2));

    // Simular firma rápida en cliente
    const clientCanvas = page.locator('#signatureCanvas');
    await expect(clientCanvas).toBeVisible();
    
    const canvasBounds = await clientCanvas.boundingBox();
    await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 60);
    await page.mouse.up();

    // Simular firma rápida en empresa
    const companyCanvas = page.locator('#companySignatureCanvas');
    const companyCanvasBounds = await companyCanvas.boundingBox();
    await page.mouse.move(companyCanvasBounds.x + 50, companyCanvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(companyCanvasBounds.x + 150, companyCanvasBounds.y + 60);
    await page.mouse.up();

    // Esperar un momento para capturar eventos post-firma
    await page.waitForTimeout(1000);

    // Intentar ejecutar collectFormData directamente
    const directCollectFormDataTest = await page.evaluate(() => {
      try {
        const startTime = performance.now();
        const result = window.collectFormData ? window.collectFormData() : null;
        const endTime = performance.now();
        
        return {
          success: true,
          duration: endTime - startTime,
          hasSignature: !!(result && result.signature),
          hasCompanySignature: !!(result && result.companySignature),
          signatureValid: result && result.signature ? result.signature.startsWith('data:image/') : false,
          companySignatureValid: result && result.companySignature ? result.companySignature.startsWith('data:image/') : false
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            stack: error.stack
          }
        };
      }
    });

    console.log('📊 Test directo collectFormData:', JSON.stringify(directCollectFormDataTest, null, 2));

    // Intentar ejecutar generateReceiptHTML
    const directGenerateReceiptHTMLTest = await page.evaluate(() => {
      try {
        const startTime = performance.now();
        const result = window.generateReceiptHTML ? window.generateReceiptHTML() : null;
        const endTime = performance.now();
        
        return {
          success: true,
          duration: endTime - startTime,
          hasResult: !!result,
          resultLength: result ? result.length : 0
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            stack: error.stack
          }
        };
      }
    });

    console.log('📊 Test directo generateReceiptHTML:', JSON.stringify(directGenerateReceiptHTMLTest, null, 2));

    // Test de timing crítico: rapid-fire calls
    const rapidFireTest = await page.evaluate(() => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        let result = null;
        let error = null;
        
        try {
          result = window.getValidSignatureData ? window.getValidSignatureData(window.signaturePad) : null;
        } catch (e) {
          error = e.message;
        }
        
        const endTime = performance.now();
        
        results.push({
          iteration: i,
          duration: endTime - startTime,
          success: !error,
          error: error,
          hasResult: !!result
        });
      }
      
      return results;
    });

    console.log('📊 Test rapid-fire:', JSON.stringify(rapidFireTest, null, 2));

    // Capturar timing log final completo
    const finalTimingLog = await page.evaluate(() => window.signatureTimingLog || []);

    // Analizar patrones de timing
    const timingAnalysis = await page.evaluate((timingLog) => {
      if (!timingLog || timingLog.length === 0) return null;
      
      const firstEvent = timingLog[0];
      const lastEvent = timingLog[timingLog.length - 1];
      const totalDuration = lastEvent.performanceNow - firstEvent.performanceNow;
      
      const eventCounts = {};
      const errorEvents = [];
      const successEvents = [];
      
      timingLog.forEach(event => {
        eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
        
        if (event.event.includes('_error')) {
          errorEvents.push(event);
        } else if (event.event.includes('_end') && event.data && event.data.success) {
          successEvents.push(event);
        }
      });
      
      return {
        totalEvents: timingLog.length,
        totalDuration: totalDuration,
        eventCounts: eventCounts,
        errorEvents: errorEvents.length,
        successEvents: successEvents.length,
        criticalErrors: errorEvents.filter(e => 
          e.event === 'getValidSignatureData_error' || 
          e.event === 'collectFormData_error' ||
          e.event === 'generateReceiptHTML_error'
        )
      };
    }, finalTimingLog);

    console.log('📊 Análisis de timing:', JSON.stringify(timingAnalysis, null, 2));

    // Compilar reporte final
    const timingDiagnosisReport = {
      timestamp: new Date().toISOString(),
      testName: 'Timing Diagnosis Test',
      visibilityTest: visibilityTest,
      directCollectFormDataTest: directCollectFormDataTest,
      directGenerateReceiptHTMLTest: directGenerateReceiptHTMLTest,
      rapidFireTest: rapidFireTest,
      timingAnalysis: timingAnalysis,
      fullTimingLog: finalTimingLog
    };

    // Guardar para el reporter
    await page.evaluate((report) => {
      window.timingDiagnosisReport = report;
    }, timingDiagnosisReport);

    console.log('🔍 DIAGNÓSTICO DE TIMING COMPLETO');
    console.log('📊 Total de eventos capturados:', finalTimingLog.length);
    console.log('📊 Errores detectados:', timingAnalysis?.errorEvents || 0);
    console.log('📊 Eventos exitosos:', timingAnalysis?.successEvents || 0);

    // Verificaciones críticas
    expect(timingAnalysis).toBeDefined();
    expect(directCollectFormDataTest).toBeDefined();
    expect(directGenerateReceiptHTMLTest).toBeDefined();

    // Reportar hallazgos críticos
    if (directCollectFormDataTest.success === false) {
      console.log('❌ CRÍTICO: collectFormData falló directamente');
      console.log('📋 Error:', directCollectFormDataTest.error.message);
    }

    if (directGenerateReceiptHTMLTest.success === false) {
      console.log('❌ CRÍTICO: generateReceiptHTML falló directamente');
      console.log('📋 Error:', directGenerateReceiptHTMLTest.error.message);
    }

    if (timingAnalysis && timingAnalysis.criticalErrors.length > 0) {
      console.log('❌ CRÍTICO: Errores críticos detectados en timing');
      timingAnalysis.criticalErrors.forEach(error => {
        console.log(`📋 ${error.event}: ${error.data.error}`);
      });
    }
  });

  test('Test específico de timing bajo diferentes condiciones de carga', async ({ page }) => {
    console.log('🧪 Test: Timing bajo diferentes condiciones');

    // Test 1: Llamadas inmediatas después de login
    const immediateTest = await page.evaluate(() => {
      try {
        const result = window.collectFormData ? window.collectFormData() : null;
        return { success: true, result: !!result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Test 2: Después de llenar formulario parcial
    await page.fill('#clientName', 'Test Timing Conditions');
    
    const partialFormTest = await page.evaluate(() => {
      try {
        const result = window.collectFormData ? window.collectFormData() : null;
        return { success: true, result: !!result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Test 3: Después de llenar formulario completo
    await page.fill('#clientPhone', '1234567890');
    await page.selectOption('#transactionType', 'Compra');
    await page.selectOption('#pieceType', 'Anillo');
    await page.selectOption('#material', 'Oro');
    await page.fill('#price', '1000');

    const fullFormTest = await page.evaluate(() => {
      try {
        const result = window.collectFormData ? window.collectFormData() : null;
        return { success: true, result: !!result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    const conditionsReport = {
      timestamp: new Date().toISOString(),
      testName: 'Timing Conditions Test',
      conditions: {
        immediate: immediateTest,
        partialForm: partialFormTest,
        fullForm: fullFormTest
      }
    };

    await page.evaluate((report) => {
      window.timingConditionsReport = report;
    }, conditionsReport);

    console.log('📊 Test de condiciones:', JSON.stringify(conditionsReport, null, 2));
    
    expect(conditionsReport.conditions.immediate).toBeDefined();
    expect(conditionsReport.conditions.partialForm).toBeDefined();
    expect(conditionsReport.conditions.fullForm).toBeDefined();
  });
});