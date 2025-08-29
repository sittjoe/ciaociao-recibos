const { test, expect } = require('@playwright/test');

/**
 * TEST ESPECÍFICO PARA INTERCEPTAR ERRORES DE FIRMAS DIGITALES
 * 
 * Objetivo: Capturar el error EXACTO que ocurre antes de que sea
 * procesado por handlePDFGenerationError() en línea 3018
 */

test.describe('Interceptación de Errores Específicos de Firmas', () => {
  let errorLogs = [];
  let consoleLogs = [];
  let signaturePadStates = [];
  let originalError = null;

  test.beforeEach(async ({ page }) => {
    // Reset arrays para cada test
    errorLogs = [];
    consoleLogs = [];
    signaturePadStates = [];
    originalError = null;

    // Interceptar TODOS los logs de consola ANTES del processing
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      
      consoleLogs.push(logEntry);
      
      if (msg.type() === 'error') {
        errorLogs.push(logEntry);
      }
    });

    // Interceptar errores de página no capturados
    page.on('pageerror', error => {
      originalError = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 ORIGINAL ERROR INTERCEPTED:', originalError);
    });

    // Navegar y hacer login
    await page.goto('/receipt-mode.html');
    
    // Login
    const passwordInput = page.locator('#authPassword');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('27181730');
    await page.click('#authSubmit');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForSelector('#clientName', { state: 'visible' });
  });

  test('Interceptar error específico durante generación de PDF con firmas', async ({ page }) => {
    console.log('🧪 Test: Interceptando error específico en proceso de firmas');

    // 1. Llenar formulario básico
    await page.fill('#clientName', 'Cliente Test Firma');
    await page.fill('#clientPhone', '1234567890');
    await page.selectOption('#transactionType', 'Compra');
    await page.selectOption('#pieceType', 'Anillo');
    await page.selectOption('#material', 'Oro');
    await page.fill('#price', '1000');

    // 2. Interceptar llamadas a getValidSignatureData ANTES de que ocurra el error
    await page.evaluateOnNewDocument(() => {
      const originalGetValidSignatureData = window.getValidSignatureData;
      const signaturePadStates = [];
      
      window.getValidSignatureData = function(signaturePad) {
        const state = {
          timestamp: new Date().toISOString(),
          exists: !!signaturePad,
          isEmpty: null,
          hasToDataURL: null,
          canvasExists: null,
          canvasVisible: null,
          error: null
        };
        
        try {
          if (signaturePad) {
            state.isEmpty = typeof signaturePad.isEmpty === 'function' ? signaturePad.isEmpty() : 'NO_METHOD';
            state.hasToDataURL = typeof signaturePad.toDataURL === 'function';
            
            // Verificar canvas asociado
            if (signaturePad.canvas || signaturePad._canvas) {
              const canvas = signaturePad.canvas || signaturePad._canvas;
              state.canvasExists = !!canvas;
              state.canvasVisible = canvas ? window.getComputedStyle(canvas).display !== 'none' : false;
              state.canvasWidth = canvas ? canvas.width : null;
              state.canvasHeight = canvas ? canvas.height : null;
            }
          }
          
          const result = originalGetValidSignatureData ? originalGetValidSignatureData.call(this, signaturePad) : null;
          state.result = result;
          
          signaturePadStates.push(state);
          window.capturedSignaturePadStates = signaturePadStates;
          
          return result;
          
        } catch (error) {
          state.error = {
            message: error.message,
            stack: error.stack,
            name: error.name
          };
          
          signaturePadStates.push(state);
          window.capturedSignaturePadStates = signaturePadStates;
          
          throw error;
        }
      };
    });

    // 3. Interceptar handlePDFGenerationError para capturar el error original
    await page.evaluateOnNewDocument(() => {
      const originalHandlePDFGenerationError = window.handlePDFGenerationError;
      
      window.handlePDFGenerationError = function(error) {
        // Capturar el error EXACTO antes de que sea procesado
        window.capturedOriginalError = {
          message: error.message,
          stack: error.stack,
          name: error.name,
          type: typeof error,
          timestamp: new Date().toISOString(),
          includesPDF: error.message.includes('PDF'),
          includesCanvas: error.message.includes('canvas'),
          isGenericSignatureError: !error.message.includes('PDF') && !error.message.includes('canvas')
        };
        
        console.error('🔍 ERROR CAPTURADO ANTES DE PROCESSING:', window.capturedOriginalError);
        
        // Llamar función original
        if (originalHandlePDFGenerationError) {
          return originalHandlePDFGenerationError.call(this, error);
        }
      };
    });

    // 4. Esperar a que SignaturePad esté inicializado
    await page.waitForFunction(() => {
      return window.signaturePad && window.companySignaturePad;
    }, { timeout: 10000 });

    // 5. Verificar estado inicial de SignaturePads
    const initialSignaturePadState = await page.evaluate(() => {
      return {
        signaturePad: {
          exists: !!window.signaturePad,
          isEmpty: window.signaturePad ? (typeof window.signaturePad.isEmpty === 'function' ? window.signaturePad.isEmpty() : 'NO_METHOD') : null,
          hasCanvas: !!(window.signaturePad && window.signaturePad.canvas)
        },
        companySignaturePad: {
          exists: !!window.companySignaturePad,
          isEmpty: window.companySignaturePad ? (typeof window.companySignaturePad.isEmpty === 'function' ? window.companySignaturePad.isEmpty() : 'NO_METHOD') : null,
          hasCanvas: !!(window.companySignaturePad && window.companySignaturePad.canvas)
        }
      };
    });

    console.log('📊 Estado inicial SignaturePads:', JSON.stringify(initialSignaturePadState, null, 2));

    // 6. Simular firma en canvas de cliente
    const clientCanvas = page.locator('#signatureCanvas');
    await expect(clientCanvas).toBeVisible();
    
    // Simular trazo de firma
    const canvasBounds = await clientCanvas.boundingBox();
    await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 30);
    await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 60);
    await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 60);
    await page.mouse.up();

    // 7. Simular firma en canvas de empresa
    const companyCanvas = page.locator('#companySignatureCanvas');
    await expect(companyCanvas).toBeVisible();
    
    const companyCanvasBounds = await companyCanvas.boundingBox();
    await page.mouse.move(companyCanvasBounds.x + 50, companyCanvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(companyCanvasBounds.x + 150, companyCanvasBounds.y + 30);
    await page.mouse.move(companyCanvasBounds.x + 150, companyCanvasBounds.y + 60);
    await page.mouse.move(companyCanvasBounds.x + 50, companyCanvasBounds.y + 60);
    await page.mouse.up();

    // 8. Verificar estado después de firmar
    const afterSignatureState = await page.evaluate(() => {
      return {
        signaturePad: {
          exists: !!window.signaturePad,
          isEmpty: window.signaturePad ? (typeof window.signaturePad.isEmpty === 'function' ? window.signaturePad.isEmpty() : 'NO_METHOD') : null,
        },
        companySignaturePad: {
          exists: !!window.companySignaturePad,
          isEmpty: window.companySignaturePad ? (typeof window.companySignaturePad.isEmpty === 'function' ? window.companySignaturePad.isEmpty() : 'NO_METHOD') : null,
        }
      };
    });

    console.log('📊 Estado después de firmar:', JSON.stringify(afterSignatureState, null, 2));

    // 9. Intentar generar PDF y capturar el error EXACTO
    let pdfGenerationError = null;
    
    try {
      await page.click('#generatePdfBtn');
      
      // Esperar un momento para que el error ocurra
      await page.waitForTimeout(3000);
      
    } catch (error) {
      pdfGenerationError = error;
    }

    // 10. Capturar todos los datos después del intento
    const finalDiagnosticData = await page.evaluate(() => {
      return {
        capturedOriginalError: window.capturedOriginalError || null,
        capturedSignaturePadStates: window.capturedSignaturePadStates || [],
        finalSignaturePadState: {
          signaturePad: {
            exists: !!window.signaturePad,
            isEmpty: window.signaturePad ? (typeof window.signaturePad.isEmpty === 'function' ? window.signaturePad.isEmpty() : 'NO_METHOD') : null,
          },
          companySignaturePad: {
            exists: !!window.companySignaturePad,
            isEmpty: window.companySignaturePad ? (typeof window.companySignaturePad.isEmpty === 'function' ? window.companySignaturePad.isEmpty() : 'NO_METHOD') : null,
          }
        }
      };
    });

    // 11. Compilar diagnóstico completo
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      testName: 'Error Interception Test',
      initialState: initialSignaturePadState,
      afterSignatureState: afterSignatureState,
      finalState: finalDiagnosticData.finalSignaturePadState,
      originalError: originalError,
      capturedOriginalError: finalDiagnosticData.capturedOriginalError,
      signaturePadStates: finalDiagnosticData.capturedSignaturePadStates,
      pdfGenerationError: pdfGenerationError ? {
        message: pdfGenerationError.message,
        stack: pdfGenerationError.stack
      } : null,
      consoleLogs: consoleLogs,
      errorLogs: errorLogs
    };

    console.log('🔍 DIAGNÓSTICO COMPLETO:');
    console.log(JSON.stringify(diagnosticReport, null, 2));

    // 12. Guardar diagnóstico en variable global para el reporter
    await page.evaluate((report) => {
      window.signatureDiagnosticReport = report;
    }, diagnosticReport);

    // 13. Verificaciones críticas
    if (finalDiagnosticData.capturedOriginalError) {
      console.log('✅ ERROR ORIGINAL CAPTURADO:', finalDiagnosticData.capturedOriginalError.message);
      
      // Verificar si es realmente un error genérico de firmas
      expect(finalDiagnosticData.capturedOriginalError.isGenericSignatureError).toBeDefined();
      
      if (finalDiagnosticData.capturedOriginalError.isGenericSignatureError) {
        console.log('🎯 CONFIRMADO: Error genérico de firmas detectado');
        console.log('📋 Mensaje original:', finalDiagnosticData.capturedOriginalError.message);
      }
    } else {
      console.log('⚠️ No se capturó error original - puede que el proceso haya funcionado correctamente');
    }

    // Verificar que los SignaturePads estén funcionando correctamente
    expect(initialSignaturePadState.signaturePad.exists).toBe(true);
    expect(initialSignaturePadState.companySignaturePad.exists).toBe(true);
  });

  test('Verificar timing de inicialización de SignaturePads', async ({ page }) => {
    console.log('🧪 Test: Verificando timing de inicialización');

    let initializationSteps = [];

    // Interceptar proceso de inicialización
    await page.evaluateOnNewDocument(() => {
      const steps = [];
      
      // Interceptar initializeSignaturePad
      const originalInitialize = window.initializeSignaturePad;
      window.initializeSignaturePad = function() {
        steps.push({
          step: 'initializeSignaturePad_called',
          timestamp: new Date().toISOString(),
          signaturePadExists: !!window.signaturePad,
          companySignaturePadExists: !!window.companySignaturePad
        });
        
        const result = originalInitialize ? originalInitialize.call(this) : null;
        
        steps.push({
          step: 'initializeSignaturePad_completed',
          timestamp: new Date().toISOString(),
          signaturePadExists: !!window.signaturePad,
          companySignaturePadExists: !!window.companySignaturePad
        });
        
        window.initializationSteps = steps;
        return result;
      };
      
      // Interceptar cuando SignaturePad library se carga
      const checkSignaturePadLibrary = () => {
        steps.push({
          step: 'SignaturePad_library_check',
          timestamp: new Date().toISOString(),
          SignaturePadAvailable: typeof window.SignaturePad !== 'undefined',
          signaturePadExists: !!window.signaturePad,
          companySignaturePadExists: !!window.companySignaturePad
        });
        
        window.initializationSteps = steps;
      };
      
      // Verificar cada 100ms si SignaturePad está disponible
      const intervalId = setInterval(checkSignaturePadLibrary, 100);
      
      // Detener después de 10 segundos
      setTimeout(() => {
        clearInterval(intervalId);
      }, 10000);
    });

    // Llenar formulario básico rápidamente
    await page.fill('#clientName', 'Test Timing');
    await page.fill('#clientPhone', '1234567890');
    
    // Esperar y capturar los pasos de inicialización
    await page.waitForTimeout(5000);
    
    const initSteps = await page.evaluate(() => {
      return window.initializationSteps || [];
    });

    console.log('📊 Pasos de inicialización capturados:', JSON.stringify(initSteps, null, 2));

    // Análisis de timing
    if (initSteps.length > 0) {
      const firstStep = new Date(initSteps[0].timestamp);
      const lastStep = new Date(initSteps[initSteps.length - 1].timestamp);
      const totalInitTime = lastStep - firstStep;
      
      console.log(`⏱️ Tiempo total de inicialización: ${totalInitTime}ms`);
      
      // Buscar problemas de timing
      const signaturePadReadyStep = initSteps.find(step => 
        step.signaturePadExists && step.companySignaturePadExists
      );
      
      if (signaturePadReadyStep) {
        const readyTime = new Date(signaturePadReadyStep.timestamp) - firstStep;
        console.log(`✅ SignaturePads listos después de: ${readyTime}ms`);
      } else {
        console.log('⚠️ SignaturePads nunca estuvieron completamente listos');
      }
    }

    // Guardar para el reporter
    await page.evaluate((steps) => {
      window.signatureTimingReport = {
        timestamp: new Date().toISOString(),
        testName: 'SignaturePad Timing Test',
        initializationSteps: steps
      };
    }, initSteps);

    expect(initSteps.length).toBeGreaterThan(0);
  });
});