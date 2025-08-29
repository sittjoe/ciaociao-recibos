// tests/critical-pdf-diagnosis.spec.js
// Diagnóstico CRÍTICO completo del problema de generación PDF 
// Problema específico: Vista previa funciona, PDF generation falla completamente

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('DIAGNÓSTICO CRÍTICO: Problema Generación PDF ciaociao-recibos', () => {
  let diagnosticData;
  let sessionId;
  let errorCapture;

  test.beforeAll(async () => {
    sessionId = `PDF-DIAGNOSIS-${Date.now()}`;
    console.log(`🚨 INICIANDO DIAGNÓSTICO CRÍTICO - Session: ${sessionId}`);
    console.log('📋 Problema reportado: Vista previa funciona, PDF NO genera');
    
    diagnosticData = {
      sessionId,
      startTime: Date.now(),
      problem: 'PDF generation fails completely while preview works',
      testResults: [],
      consoleErrors: [],
      networkErrors: [],
      dependencyErrors: [],
      functionAnalysis: [],
      screenshots: [],
      finalDiagnosis: null
    };

    // Crear directorios para evidencia
    const evidenceDir = `./test-results/critical-pdf-diagnosis/${sessionId}`;
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
  });

  test('DIAG-001: Navegación Completa y Captura de Estados', async ({ page }) => {
    console.log('🔍 FASE 1: Navegación completa del proceso y captura de errores');
    
    const testResult = {
      testId: 'DIAG-001',
      phase: 'navigation_and_state_capture',
      steps: [],
      errors: [],
      states: {},
      timing: {}
    };

    // Configurar captura exhaustiva de errores
    errorCapture = {
      consoleErrors: [],
      unhandledExceptions: [],
      pageErrors: [],
      networkFailures: [],
      consoleWarnings: [],
      consoleLogs: []
    };

    // Interceptar TODOS los mensajes de consola
    page.on('console', msg => {
      const msgData = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      };
      
      if (msg.type() === 'error') {
        errorCapture.consoleErrors.push(msgData);
        console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        errorCapture.consoleWarnings.push(msgData);
        console.log(`⚠️  CONSOLE WARNING: ${msg.text()}`);
      } else if (msg.text().includes('PDF') || msg.text().includes('pdf') || 
                 msg.text().includes('jsPDF') || msg.text().includes('html2canvas') ||
                 msg.text().includes('generate')) {
        errorCapture.consoleLogs.push(msgData);
        console.log(`🔍 PDF-RELATED LOG: ${msg.text()}`);
      }
    });

    // Interceptar errores de página no manejados
    page.on('pageerror', error => {
      const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
      errorCapture.unhandledExceptions.push(errorData);
      console.log(`💥 UNHANDLED EXCEPTION: ${error.message}`);
    });

    // Interceptar fallos de requests
    page.on('requestfailed', request => {
      const failureData = {
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        timestamp: Date.now()
      };
      errorCapture.networkFailures.push(failureData);
      console.log(`🌐 NETWORK FAILURE: ${request.url()} - ${request.failure()?.errorText}`);
    });

    await test.step('Navegación a receipt-mode.html', async () => {
      const startTime = Date.now();
      console.log('📍 Navegando a https://recibos.ciaociao.mx/receipt-mode.html');
      
      await page.goto('https://recibos.ciaociao.mx/receipt-mode.html', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      testResult.timing.navigation = Date.now() - startTime;
      testResult.steps.push('Navigation successful');
      
      // Screenshot del estado inicial
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/01-initial-state.png` });
    });

    await test.step('Login con contraseña 27181730', async () => {
      const startTime = Date.now();
      console.log('🔐 Introduciendo contraseña de login');
      
      // Esperar que aparezca el modal de login
      await page.waitForSelector('#passwordInput', { timeout: 10000 });
      await page.fill('#passwordInput', '27181730');
      
      // Screenshot antes de login
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/02-before-login.png` });
      
      const loginPromise = page.waitForSelector('#receiptForm', { timeout: 15000 });
      await page.click('#loginBtn');
      await loginPromise;
      
      testResult.timing.login = Date.now() - startTime;
      testResult.steps.push('Login successful');
      
      // Screenshot después de login exitoso
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/03-after-login.png` });
    });

    await test.step('Verificación de dependencias críticas', async () => {
      console.log('🔬 Verificando estado de dependencias críticas para PDF');
      
      const dependencyState = await page.evaluate(() => {
        return {
          jsPDF: {
            available: typeof window.jsPDF !== 'undefined',
            lowercase: typeof window.jspdf !== 'undefined',
            version: window.jsPDF?.version || window.jspdf?.version || null,
            constructor: typeof (window.jsPDF || window.jspdf) === 'function'
          },
          html2canvas: {
            available: typeof window.html2canvas !== 'undefined',
            version: window.html2canvas?.version || null,
            isFunction: typeof window.html2canvas === 'function'
          },
          SignaturePad: {
            available: typeof window.SignaturePad !== 'undefined',
            constructor: typeof window.SignaturePad === 'function'
          },
          cdnStatus: window.cdnStatus || null,
          cdnLibrariesReady: window.cdnLibrariesReady || false,
          initializeApp: typeof window.initializeApp === 'function',
          generatePDF: typeof window.generatePDF === 'function'
        };
      });

      testResult.states.dependencies = dependencyState;
      
      console.log('📦 Estado de dependencias:', JSON.stringify(dependencyState, null, 2));
      
      // Detectar problemas críticos
      if (!dependencyState.jsPDF.available && !dependencyState.jsPDF.lowercase) {
        testResult.errors.push({
          type: 'CRITICAL_DEPENDENCY_MISSING',
          component: 'jsPDF',
          message: 'jsPDF not available in any form'
        });
      }
      
      if (!dependencyState.html2canvas.available) {
        testResult.errors.push({
          type: 'CRITICAL_DEPENDENCY_MISSING',
          component: 'html2canvas',
          message: 'html2canvas not available'
        });
      }
      
      if (typeof dependencyState.generatePDF !== 'function') {
        testResult.errors.push({
          type: 'CRITICAL_FUNCTION_MISSING',
          component: 'generatePDF',
          message: 'generatePDF function not available'
        });
      }
    });

    await test.step('Llenar formulario con datos mínimos requeridos', async () => {
      console.log('📝 Llenando formulario con datos mínimos para test');
      
      const formData = {
        receiptDate: '2025-08-27',
        transactionType: 'venta',
        clientName: 'Cliente Test Diagnóstico',
        clientPhone: '5512345678',
        pieceType: 'anillo',
        material: 'oro-14k',
        price: '1000'
      };

      // Llenar campos obligatorios
      await page.fill('#receiptDate', formData.receiptDate);
      await page.selectOption('#transactionType', formData.transactionType);
      await page.fill('#clientName', formData.clientName);
      await page.fill('#clientPhone', formData.clientPhone);
      await page.selectOption('#pieceType', formData.pieceType);
      await page.selectOption('#material', formData.material);
      await page.fill('#price', formData.price);
      
      // Trigger calculations
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(1000);
      
      testResult.states.formData = formData;
      testResult.steps.push('Form filled with minimum required data');
      
      // Screenshot del formulario lleno
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/04-form-filled.png` });
    });

    await test.step('Test Vista Previa (debe funcionar)', async () => {
      console.log('👀 Testing Vista Previa - debe funcionar correctamente');
      const startTime = Date.now();
      
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview', { timeout: 10000 });
      
      // Capturar estado de la vista previa
      const previewState = await page.evaluate(() => {
        const preview = document.getElementById('receiptPreview');
        return {
          visible: preview && preview.offsetParent !== null,
          dimensions: preview ? {
            scrollWidth: preview.scrollWidth,
            scrollHeight: preview.scrollHeight,
            offsetWidth: preview.offsetWidth,
            offsetHeight: preview.offsetHeight
          } : null,
          hasContent: preview ? preview.textContent.length > 0 : false,
          innerHTML: preview ? preview.innerHTML.substring(0, 500) + '...' : null
        };
      });
      
      testResult.states.preview = previewState;
      testResult.timing.previewGeneration = Date.now() - startTime;
      
      console.log('✅ Vista previa generada exitosamente:', {
        time: testResult.timing.previewGeneration + 'ms',
        hasContent: previewState.hasContent,
        dimensions: previewState.dimensions
      });
      
      // Screenshot de la vista previa
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/05-preview-generated.png` });
      
      // Cerrar vista previa para el siguiente test
      await page.click('#closePreview');
      
      testResult.steps.push('Preview generated successfully');
    });

    await test.step('Test Generación PDF (punto de fallo)', async () => {
      console.log('🎯 PUNTO CRÍTICO: Intentando generar PDF - aquí debe fallar');
      const startTime = Date.now();
      
      // Limpiar capturas de errores para el PDF generation
      errorCapture.consoleErrors = [];
      errorCapture.unhandledExceptions = [];
      
      // Instrumentar la función generatePDF si existe
      const pdfFunctionAnalysis = await page.evaluate(() => {
        if (typeof window.generatePDF === 'function') {
          // Backup de la función original
          const originalGeneratePDF = window.generatePDF;
          
          // Override con instrumentación
          window.generatePDF = async function(...args) {
            console.log('🔍 generatePDF called with args:', args);
            
            try {
              // Verificar estado antes de execution
              console.log('📦 Dependencies check:', {
                jsPDF: typeof window.jsPDF,
                jspdf: typeof window.jspdf,
                html2canvas: typeof window.html2canvas
              });
              
              const result = await originalGeneratePDF.apply(this, args);
              console.log('✅ generatePDF completed successfully');
              return result;
              
            } catch (error) {
              console.error('❌ generatePDF ERROR:', error);
              throw error;
            }
          };
          
          return {
            functionExists: true,
            functionLength: originalGeneratePDF.length,
            functionString: originalGeneratePDF.toString().substring(0, 200) + '...'
          };
        } else {
          return {
            functionExists: false,
            availableFunctions: Object.keys(window).filter(key => 
              typeof window[key] === 'function' && key.toLowerCase().includes('pdf'))
          };
        }
      });
      
      testResult.states.pdfFunctionAnalysis = pdfFunctionAnalysis;
      console.log('🔧 PDF Function Analysis:', pdfFunctionAnalysis);
      
      // Intentar generar PDF y capturar el fallo exacto
      let pdfGenerationFailed = false;
      let downloadReceived = false;
      let pdfError = null;
      
      try {
        // Setup download listener con timeout
        const downloadPromise = Promise.race([
          page.waitForEvent('download', { timeout: 30000 }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF download timeout after 30s')), 30000)
          )
        ]);
        
        // Hacer click en generar PDF
        console.log('🖱️  Haciendo click en "Generar PDF"...');
        await page.click('#generatePdfBtn');
        
        // Esperar por download o timeout
        try {
          const download = await downloadPromise;
          downloadReceived = true;
          console.log('📥 Download recibido!');
          
          const downloadPath = `./test-results/critical-pdf-diagnosis/${sessionId}/generated.pdf`;
          await download.saveAs(downloadPath);
          
          // Verificar si el archivo fue realmente creado
          const fileExists = fs.existsSync(downloadPath);
          const fileSize = fileExists ? fs.statSync(downloadPath).size : 0;
          
          testResult.states.pdfResult = {
            downloadReceived: true,
            fileCreated: fileExists,
            fileSize,
            success: fileExists && fileSize > 0
          };
          
        } catch (downloadError) {
          pdfGenerationFailed = true;
          pdfError = downloadError.message;
          console.log('❌ PDF Generation FAILED:', pdfError);
          
          testResult.states.pdfResult = {
            downloadReceived: false,
            error: pdfError,
            success: false
          };
        }
        
      } catch (clickError) {
        pdfGenerationFailed = true;
        pdfError = clickError.message;
        console.log('❌ Error clicking PDF button:', pdfError);
      }
      
      testResult.timing.pdfGeneration = Date.now() - startTime;
      
      // Screenshot del estado después del intento de PDF
      await page.screenshot({ path: `./test-results/critical-pdf-diagnosis/${sessionId}/06-after-pdf-attempt.png` });
      
      // Capturar todos los errores que ocurrieron durante PDF generation
      const pdfErrors = {
        consoleErrors: errorCapture.consoleErrors.slice(),
        unhandledExceptions: errorCapture.unhandledExceptions.slice(),
        networkFailures: errorCapture.networkFailures.slice()
      };
      
      testResult.states.pdfGenerationErrors = pdfErrors;
      
      if (pdfGenerationFailed || pdfErrors.consoleErrors.length > 0) {
        console.log('🚨 PDF GENERATION PROBLEM CONFIRMED');
        console.log('Console Errors:', pdfErrors.consoleErrors);
        console.log('Unhandled Exceptions:', pdfErrors.unhandledExceptions);
        console.log('Network Failures:', pdfErrors.networkFailures);
      }
      
      testResult.steps.push(pdfGenerationFailed ? 'PDF generation failed' : 'PDF generation succeeded');
    });

    diagnosticData.testResults.push(testResult);
    diagnosticData.consoleErrors = errorCapture.consoleErrors;
    diagnosticData.networkErrors = errorCapture.networkFailures;
  });

  test('DIAG-002: Análisis Profundo de Dependencias y Timing', async ({ page }) => {
    console.log('🔬 FASE 2: Análisis profundo de dependencias y timing de carga');
    
    const depAnalysis = {
      testId: 'DIAG-002',
      phase: 'dependency_timing_analysis',
      loadingSequence: [],
      timingAnalysis: {},
      dependencyErrors: [],
      libraryStates: []
    };

    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');

    await test.step('Análisis de secuencia de carga de librerías', async () => {
      // Instrumentar la carga de scripts para capturar timing
      await page.addInitScript(() => {
        window.dependencyLoadingLog = [];
        
        // Override de createElement para monitorear carga de scripts
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          
          if (tagName.toLowerCase() === 'script') {
            const originalOnload = element.onload;
            const originalOnerror = element.onerror;
            
            element.onload = function() {
              window.dependencyLoadingLog.push({
                type: 'script_loaded',
                src: this.src,
                timestamp: Date.now()
              });
              if (originalOnload) originalOnload.call(this);
            };
            
            element.onerror = function() {
              window.dependencyLoadingLog.push({
                type: 'script_error',
                src: this.src,
                timestamp: Date.now()
              });
              if (originalOnerror) originalOnerror.call(this);
            };
          }
          
          return element;
        };

        // Monitorear cuando las librerías están disponibles
        const checkInterval = setInterval(() => {
          const state = {
            timestamp: Date.now(),
            jsPDF: typeof window.jsPDF !== 'undefined',
            jspdf: typeof window.jspdf !== 'undefined',
            html2canvas: typeof window.html2canvas !== 'undefined',
            SignaturePad: typeof window.SignaturePad !== 'undefined'
          };
          
          window.dependencyLoadingLog.push({
            type: 'dependency_check',
            ...state
          });
          
          // Stop checking after all are loaded or timeout
          if ((state.jsPDF || state.jspdf) && state.html2canvas && state.SignaturePad) {
            clearInterval(checkInterval);
            window.dependencyLoadingLog.push({
              type: 'all_dependencies_ready',
              timestamp: Date.now()
            });
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 15000);
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const loadingLog = await page.evaluate(() => window.dependencyLoadingLog || []);
      depAnalysis.loadingSequence = loadingLog;

      console.log('📚 Dependency loading sequence captured:', loadingLog.length + ' events');
    });

    await test.step('Análisis detallado del estado de window.jspdf vs window.jsPDF', async () => {
      const jsPDFAnalysis = await page.evaluate(() => {
        const analysis = {
          windowjsPDF: {
            exists: 'jsPDF' in window,
            type: typeof window.jsPDF,
            constructor: window.jsPDF?.toString?.().substring(0, 100),
            version: window.jsPDF?.version
          },
          windowjspdf: {
            exists: 'jspdf' in window,
            type: typeof window.jspdf,
            constructor: window.jspdf?.toString?.().substring(0, 100),
            version: window.jspdf?.version
          },
          globalThis: {
            jsPDF: 'jsPDF' in globalThis,
            jspdf: 'jspdf' in globalThis
          }
        };

        // Test instantiation
        try {
          if (window.jsPDF) {
            const testDoc = new window.jsPDF();
            analysis.windowjsPDF.canInstantiate = true;
            analysis.windowjsPDF.methods = Object.getOwnPropertyNames(testDoc);
          }
        } catch (e) {
          analysis.windowjsPDF.canInstantiate = false;
          analysis.windowjsPDF.error = e.message;
        }

        try {
          if (window.jspdf) {
            const testDoc = new window.jspdf.jsPDF();
            analysis.windowjspdf.canInstantiate = true;
            analysis.windowjspdf.methods = Object.getOwnPropertyNames(testDoc);
          }
        } catch (e) {
          analysis.windowjspdf.canInstantiate = false;
          analysis.windowjspdf.error = e.message;
        }

        return analysis;
      });

      depAnalysis.jsPDFAnalysis = jsPDFAnalysis;
      console.log('🔍 jsPDF Analysis:', JSON.stringify(jsPDFAnalysis, null, 2));
    });

    await test.step('Test de html2canvas independiente', async () => {
      await page.fill('#passwordInput', '27181730');
      await page.click('#loginBtn');
      await page.waitForSelector('#receiptForm');

      // Crear contenido simple para test
      await page.fill('#clientName', 'Test Cliente');
      await page.fill('#clientPhone', '1234567890');
      await page.selectOption('#pieceType', 'anillo');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#price', '1000');

      const html2canvasTest = await page.evaluate(async () => {
        if (typeof window.html2canvas !== 'function') {
          return { error: 'html2canvas not available', available: false };
        }

        try {
          // Test simple element
          const testDiv = document.createElement('div');
          testDiv.innerHTML = '<p>Test content for html2canvas</p>';
          testDiv.style.width = '200px';
          testDiv.style.height = '100px';
          testDiv.style.background = 'white';
          document.body.appendChild(testDiv);

          const canvas = await window.html2canvas(testDiv);
          document.body.removeChild(testDiv);

          return {
            available: true,
            canvasCreated: canvas instanceof HTMLCanvasElement,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            hasImageData: canvas.toDataURL().length > 100
          };
        } catch (error) {
          return {
            available: true,
            error: error.message,
            canvasCreated: false
          };
        }
      });

      depAnalysis.html2canvasTest = html2canvasTest;
      console.log('🖼️  html2canvas Test:', html2canvasTest);
    });

    diagnosticData.testResults.push(depAnalysis);
  });

  test('DIAG-003: Intercepción y Análisis de generatePDF()', async ({ page }) => {
    console.log('🎯 FASE 3: Intercepción completa de la función generatePDF');
    
    const pdfFunctionAnalysis = {
      testId: 'DIAG-003',
      phase: 'generatePDF_interception',
      functionTrace: [],
      executionPath: [],
      errorPoints: [],
      timingBreakdown: {}
    };

    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
    
    await test.step('Instrumentación completa de generatePDF', async () => {
      await page.addInitScript(() => {
        window.pdfGenerationTrace = [];
        
        // Wait for scripts to load then instrument
        const instrumentPDF = () => {
          if (typeof window.generatePDF === 'function') {
            const originalGeneratePDF = window.generatePDF;
            
            window.generatePDF = async function(...args) {
              const executionId = 'PDF_' + Date.now();
              
              window.pdfGenerationTrace.push({
                id: executionId,
                step: 'FUNCTION_CALLED',
                timestamp: Date.now(),
                args: args
              });

              try {
                // Check dependencies at execution time
                const depCheck = {
                  jsPDF: typeof window.jsPDF,
                  jspdf: typeof window.jspdf,
                  html2canvas: typeof window.html2canvas,
                  receiptPreview: !!document.getElementById('receiptPreview')
                };
                
                window.pdfGenerationTrace.push({
                  id: executionId,
                  step: 'DEPENDENCY_CHECK',
                  timestamp: Date.now(),
                  dependencies: depCheck
                });

                // Try to determine which jsPDF to use
                let PDFConstructor = null;
                if (window.jsPDF) {
                  PDFConstructor = window.jsPDF;
                  window.pdfGenerationTrace.push({
                    id: executionId,
                    step: 'USING_WINDOW_JSPDF',
                    timestamp: Date.now()
                  });
                } else if (window.jspdf && window.jspdf.jsPDF) {
                  PDFConstructor = window.jspdf.jsPDF;
                  window.pdfGenerationTrace.push({
                    id: executionId,
                    step: 'USING_WINDOW_JSPDF_LOWERCASE',
                    timestamp: Date.now()
                  });
                }

                if (!PDFConstructor) {
                  throw new Error('No jsPDF constructor available');
                }

                // Test PDF instantiation
                try {
                  const testDoc = new PDFConstructor();
                  window.pdfGenerationTrace.push({
                    id: executionId,
                    step: 'PDF_INSTANTIATION_SUCCESS',
                    timestamp: Date.now()
                  });
                } catch (e) {
                  window.pdfGenerationTrace.push({
                    id: executionId,
                    step: 'PDF_INSTANTIATION_FAILED',
                    timestamp: Date.now(),
                    error: e.message
                  });
                  throw e;
                }

                // Execute original function with tracing
                const result = await originalGeneratePDF.apply(this, args);
                
                window.pdfGenerationTrace.push({
                  id: executionId,
                  step: 'FUNCTION_COMPLETED',
                  timestamp: Date.now(),
                  success: true
                });

                return result;

              } catch (error) {
                window.pdfGenerationTrace.push({
                  id: executionId,
                  step: 'FUNCTION_FAILED',
                  timestamp: Date.now(),
                  error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                  }
                });
                throw error;
              }
            };
            
            console.log('✅ generatePDF instrumented successfully');
          } else {
            console.log('❌ generatePDF function not found for instrumentation');
          }
        };

        // Try to instrument immediately and also after delay
        setTimeout(instrumentPDF, 1000);
        setTimeout(instrumentPDF, 3000);
        setTimeout(instrumentPDF, 5000);
      });
    });

    await page.fill('#passwordInput', '27181730');
    await page.click('#loginBtn');
    await page.waitForSelector('#receiptForm');

    // Fill minimal form
    await page.fill('#clientName', 'Test PDF Generation');
    await page.fill('#clientPhone', '1234567890');
    await page.selectOption('#pieceType', 'anillo');
    await page.selectOption('#material', 'oro-14k');
    await page.fill('#price', '1000');

    await test.step('Ejecución rastreada de generatePDF', async () => {
      console.log('🚀 Ejecutando generatePDF con rastreo completo...');
      
      let pdfExecuted = false;
      let executionError = null;
      
      try {
        // Intentar generar PDF
        const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
        await page.click('#generatePdfBtn');
        
        // Dar tiempo a que la función se ejecute
        await page.waitForTimeout(2000);
        
        try {
          const download = await downloadPromise;
          pdfExecuted = true;
          console.log('✅ PDF download initiated');
        } catch (downloadError) {
          executionError = downloadError.message;
          console.log('❌ PDF download failed:', executionError);
        }
        
      } catch (clickError) {
        executionError = clickError.message;
        console.log('❌ Error clicking PDF button:', executionError);
      }

      // Capturar el trace completo
      const trace = await page.evaluate(() => window.pdfGenerationTrace || []);
      pdfFunctionAnalysis.functionTrace = trace;
      pdfFunctionAnalysis.executionSuccess = pdfExecuted;
      pdfFunctionAnalysis.executionError = executionError;

      console.log('📊 Function execution trace:', JSON.stringify(trace, null, 2));
      
      if (trace.length === 0) {
        pdfFunctionAnalysis.errorPoints.push({
          type: 'NO_TRACE_GENERATED',
          message: 'generatePDF function was not called or instrumentation failed',
          possibleCauses: [
            'Function not found',
            'Button click handler not working',
            'Instrumentation failed',
            'Function name different than expected'
          ]
        });
      }

      // Analyze trace for error patterns
      const errorSteps = trace.filter(step => step.step.includes('FAILED') || step.error);
      if (errorSteps.length > 0) {
        pdfFunctionAnalysis.errorPoints = errorSteps.map(step => ({
          type: 'EXECUTION_ERROR',
          step: step.step,
          error: step.error,
          timestamp: step.timestamp
        }));
      }
    });

    diagnosticData.testResults.push(pdfFunctionAnalysis);
  });

  test('DIAG-004: Verificación de Event Listeners y Handlers', async ({ page }) => {
    console.log('🔗 FASE 4: Verificación de event listeners y handlers de botones');
    
    const eventAnalysis = {
      testId: 'DIAG-004',
      phase: 'event_listener_analysis',
      buttonAnalysis: {},
      eventListeners: [],
      handlerExecution: []
    };

    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
    await page.fill('#passwordInput', '27181730');
    await page.click('#loginBtn');
    await page.waitForSelector('#receiptForm');

    await test.step('Análisis del botón Generar PDF', async () => {
      const buttonAnalysis = await page.evaluate(() => {
        const pdfBtn = document.getElementById('generatePdfBtn');
        
        if (!pdfBtn) {
          return { error: 'generatePdfBtn element not found' };
        }

        const analysis = {
          exists: true,
          visible: pdfBtn.offsetParent !== null,
          disabled: pdfBtn.disabled,
          tagName: pdfBtn.tagName,
          className: pdfBtn.className,
          textContent: pdfBtn.textContent,
          hasClickListener: false,
          eventListeners: []
        };

        // Try to detect event listeners (limited by browser security)
        const events = ['click', 'mousedown', 'mouseup'];
        events.forEach(eventType => {
          try {
            // This is a hack to detect if there are listeners
            const hasListener = pdfBtn['on' + eventType] !== null;
            analysis.eventListeners.push({
              type: eventType,
              hasHandler: hasListener
            });
          } catch (e) {
            analysis.eventListeners.push({
              type: eventType,
              error: e.message
            });
          }
        });

        return analysis;
      });

      eventAnalysis.buttonAnalysis = buttonAnalysis;
      console.log('🔘 PDF Button Analysis:', buttonAnalysis);
    });

    await test.step('Test manual de event handler', async () => {
      // Fill form first
      await page.fill('#clientName', 'Event Test');
      await page.fill('#clientPhone', '1234567890');
      await page.selectOption('#pieceType', 'anillo');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#price', '1000');

      const handlerTest = await page.evaluate(() => {
        const pdfBtn = document.getElementById('generatePdfBtn');
        
        if (!pdfBtn) {
          return { error: 'Button not found' };
        }

        // Create a custom event handler to test execution
        let handlerCalled = false;
        const testHandler = function(event) {
          handlerCalled = true;
          console.log('🔥 Custom test handler executed');
          event.preventDefault();
          return false;
        };

        // Add our test handler
        pdfBtn.addEventListener('click', testHandler);
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        pdfBtn.dispatchEvent(clickEvent);
        
        // Clean up
        pdfBtn.removeEventListener('click', testHandler);
        
        return {
          handlerExecuted: handlerCalled,
          buttonClickable: true
        };
      });

      eventAnalysis.handlerExecution = handlerTest;
      console.log('🎪 Handler execution test:', handlerTest);
    });

    diagnosticData.testResults.push(eventAnalysis);
  });

  test.afterAll(async () => {
    console.log('\n🔍 GENERANDO DIAGNÓSTICO FINAL...');
    
    diagnosticData.endTime = Date.now();
    diagnosticData.totalDuration = diagnosticData.endTime - diagnosticData.startTime;

    // Analizar todos los resultados para generar diagnóstico
    const diagnosis = {
      problemConfirmed: false,
      rootCause: null,
      contributingFactors: [],
      recommendations: [],
      severity: 'UNKNOWN',
      fixComplexity: 'UNKNOWN'
    };

    // Revisar resultados por problema específico
    const navTest = diagnosticData.testResults.find(t => t.testId === 'DIAG-001');
    const depTest = diagnosticData.testResults.find(t => t.testId === 'DIAG-002');
    const pdfTest = diagnosticData.testResults.find(t => t.testId === 'DIAG-003');
    const eventTest = diagnosticData.testResults.find(t => t.testId === 'DIAG-004');

    // Confirmación del problema
    if (navTest?.states?.preview?.hasContent && !navTest?.states?.pdfResult?.success) {
      diagnosis.problemConfirmed = true;
      diagnosis.severity = 'CRITICAL';
      console.log('✅ PROBLEMA CONFIRMADO: Vista previa funciona, PDF no genera');
    }

    // Análisis de causa raíz
    if (pdfTest?.functionTrace?.length === 0) {
      diagnosis.rootCause = 'GENERATE_PDF_FUNCTION_NOT_EXECUTED';
      diagnosis.contributingFactors.push('Event handler not attached or not working');
      diagnosis.fixComplexity = 'MEDIUM';
    } else if (pdfTest?.errorPoints?.length > 0) {
      const errorTypes = pdfTest.errorPoints.map(e => e.type);
      if (errorTypes.includes('PDF_INSTANTIATION_FAILED')) {
        diagnosis.rootCause = 'JSPDF_INSTANTIATION_FAILURE';
        diagnosis.contributingFactors.push('jsPDF library not properly loaded or wrong version');
        diagnosis.fixComplexity = 'HIGH';
      }
    }

    // Revisar dependencias
    if (depTest?.jsPDFAnalysis) {
      const jsPDF = depTest.jsPDFAnalysis;
      if (!jsPDF.windowjsPDF.exists && !jsPDF.windowjspdf.exists) {
        diagnosis.contributingFactors.push('jsPDF library completely missing');
      } else if (!jsPDF.windowjsPDF.canInstantiate && !jsPDF.windowjspdf.canInstantiate) {
        diagnosis.contributingFactors.push('jsPDF library loaded but cannot instantiate');
      }
    }

    // Generar recomendaciones
    if (diagnosis.rootCause === 'GENERATE_PDF_FUNCTION_NOT_EXECUTED') {
      diagnosis.recommendations = [
        'Verificar que el event listener esté correctamente attachado al botón',
        'Revisar la inicialización de la aplicación y timing de carga de scripts',
        'Implementar debugging en el click handler del botón PDF',
        'Verificar que no haya errores de JavaScript que bloqueen la ejecución'
      ];
    } else if (diagnosis.rootCause === 'JSPDF_INSTANTIATION_FAILURE') {
      diagnosis.recommendations = [
        'Verificar la versión de jsPDF cargada',
        'Implementar detección de window.jspdf vs window.jsPDF',
        'Agregar fallbacks para diferentes formas de acceder a jsPDF',
        'Implementar validación de dependencias antes de PDF generation'
      ];
    } else {
      diagnosis.recommendations = [
        'Implementar logging más detallado en la función generatePDF',
        'Agregar try-catch más específicos para identificar puntos de fallo',
        'Verificar timing de carga de dependencias CDN',
        'Implementar sistema de fallback para generación PDF'
      ];
    }

    diagnosticData.finalDiagnosis = diagnosis;

    // Generar reporte final completo
    const finalReport = {
      sessionId: diagnosticData.sessionId,
      problem: 'PDF generation fails while preview works',
      duration: diagnosticData.totalDuration,
      testsExecuted: diagnosticData.testResults.length,
      diagnosis,
      detailedResults: diagnosticData.testResults,
      errorSummary: {
        consoleErrors: diagnosticData.consoleErrors.length,
        networkErrors: diagnosticData.networkErrors.length,
        totalErrors: diagnosticData.consoleErrors.length + diagnosticData.networkErrors.length
      },
      timestamp: new Date().toISOString()
    };

    const reportPath = `./test-results/critical-pdf-diagnosis/${sessionId}/FINAL-DIAGNOSIS.json`;
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

    // Generar reporte legible
    const readableReport = `
DIAGNÓSTICO CRÍTICO PDF ciaociao-recibos
=====================================
Session: ${sessionId}
Duración: ${(diagnosticData.totalDuration / 1000 / 60).toFixed(1)} minutos
Problema: Vista previa funciona, PDF NO genera

DIAGNÓSTICO FINAL:
================
Problema Confirmado: ${diagnosis.problemConfirmed ? 'SÍ' : 'NO'}
Causa Raíz: ${diagnosis.rootCause || 'NO DETERMINADA'}
Severidad: ${diagnosis.severity}
Complejidad de Fix: ${diagnosis.fixComplexity}

FACTORES CONTRIBUYENTES:
========================
${diagnosis.contributingFactors.map(f => '• ' + f).join('\n')}

RECOMENDACIONES:
================
${diagnosis.recommendations.map(r => '• ' + r).join('\n')}

ERRORES CAPTURADOS:
===================
Console Errors: ${diagnosticData.consoleErrors.length}
Network Errors: ${diagnosticData.networkErrors.length}

PRÓXIMOS PASOS:
===============
1. Implementar las recomendaciones en orden de prioridad
2. Ejecutar tests de validación después de cada fix
3. Documentar la solución implementada
4. Crear tests de regresión para prevenir el problema
`;

    const readableReportPath = `./test-results/critical-pdf-diagnosis/${sessionId}/DIAGNOSIS-READABLE.txt`;
    fs.writeFileSync(readableReportPath, readableReport);

    console.log('\n========================================');
    console.log('🚨 DIAGNÓSTICO CRÍTICO PDF COMPLETADO');
    console.log('========================================');
    console.log(`Session: ${sessionId}`);
    console.log(`Duración: ${(diagnosticData.totalDuration / 1000 / 60).toFixed(1)} minutos`);
    console.log(`Problema Confirmado: ${diagnosis.problemConfirmed ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Causa Raíz: ${diagnosis.rootCause || 'NO DETERMINADA'}`);
    console.log(`Severidad: ${diagnosis.severity}`);
    console.log(`Reporte JSON: ${reportPath}`);
    console.log(`Reporte Legible: ${readableReportPath}`);
    console.log('========================================\n');
  });
});