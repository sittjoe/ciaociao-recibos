const { test, expect } = require('@playwright/test');

/**
 * ANÁLISIS PROFUNDO DEL ESTADO DE CANVAS Y SIGNATUREPADS
 * 
 * Objetivo: Verificar el estado exacto de los canvas elements y SignaturePads
 * durante diferentes fases del proceso de generación de PDF
 */

test.describe('Análisis de Canvas y SignaturePads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/receipt-mode.html');
    
    // Login
    const passwordInput = page.locator('#authPassword');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('27181730');
    await page.click('#authSubmit');
    
    await page.waitForSelector('#clientName', { state: 'visible' });
  });

  test('Análisis detallado del estado de Canvas elements', async ({ page }) => {
    console.log('🧪 Test: Análisis detallado de Canvas elements');

    // Llenar formulario básico
    await page.fill('#clientName', 'Test Canvas Analysis');
    await page.fill('#clientPhone', '1234567890');
    await page.selectOption('#transactionType', 'Compra');
    await page.selectOption('#pieceType', 'Anillo');
    await page.selectOption('#material', 'Oro');
    await page.fill('#price', '1000');

    // 1. Análisis inicial de canvas elements
    const initialCanvasAnalysis = await page.evaluate(() => {
      const clientCanvas = document.getElementById('signatureCanvas');
      const companyCanvas = document.getElementById('companySignatureCanvas');
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'initial',
        clientCanvas: {
          exists: !!clientCanvas,
          visible: clientCanvas ? window.getComputedStyle(clientCanvas).display !== 'none' : false,
          dimensions: clientCanvas ? { width: clientCanvas.width, height: clientCanvas.height } : null,
          offsetDimensions: clientCanvas ? { width: clientCanvas.offsetWidth, height: clientCanvas.offsetHeight } : null,
          style: clientCanvas ? {
            display: window.getComputedStyle(clientCanvas).display,
            visibility: window.getComputedStyle(clientCanvas).visibility,
            opacity: window.getComputedStyle(clientCanvas).opacity
          } : null,
          parentExists: clientCanvas ? !!clientCanvas.parentElement : false,
          inDOM: clientCanvas ? document.body.contains(clientCanvas) : false
        },
        companyCanvas: {
          exists: !!companyCanvas,
          visible: companyCanvas ? window.getComputedStyle(companyCanvas).display !== 'none' : false,
          dimensions: companyCanvas ? { width: companyCanvas.width, height: companyCanvas.height } : null,
          offsetDimensions: companyCanvas ? { width: companyCanvas.offsetWidth, height: companyCanvas.offsetHeight } : null,
          style: companyCanvas ? {
            display: window.getComputedStyle(companyCanvas).display,
            visibility: window.getComputedStyle(companyCanvas).visibility,
            opacity: window.getComputedStyle(companyCanvas).opacity
          } : null,
          parentExists: companyCanvas ? !!companyCanvas.parentElement : false,
          inDOM: companyCanvas ? document.body.contains(companyCanvas) : false
        }
      };
    });

    console.log('📊 Análisis inicial de canvas:', JSON.stringify(initialCanvasAnalysis, null, 2));

    // 2. Esperar inicialización de SignaturePads
    await page.waitForFunction(() => {
      return window.signaturePad && window.companySignaturePad;
    }, { timeout: 10000 });

    // 3. Análisis después de inicialización de SignaturePads
    const postInitAnalysis = await page.evaluate(() => {
      const clientCanvas = document.getElementById('signatureCanvas');
      const companyCanvas = document.getElementById('companySignatureCanvas');
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'post_signaturepad_init',
        signaturePads: {
          client: {
            exists: !!window.signaturePad,
            hasCanvas: !!(window.signaturePad && window.signaturePad.canvas),
            isEmpty: window.signaturePad ? (typeof window.signaturePad.isEmpty === 'function' ? window.signaturePad.isEmpty() : 'NO_METHOD') : null,
            canvasMatches: window.signaturePad && window.signaturePad.canvas === clientCanvas,
            options: window.signaturePad ? window.signaturePad.options || {} : null
          },
          company: {
            exists: !!window.companySignaturePad,
            hasCanvas: !!(window.companySignaturePad && window.companySignaturePad.canvas),
            isEmpty: window.companySignaturePad ? (typeof window.companySignaturePad.isEmpty === 'function' ? window.companySignaturePad.isEmpty() : 'NO_METHOD') : null,
            canvasMatches: window.companySignaturePad && window.companySignaturePad.canvas === companyCanvas,
            options: window.companySignaturePad ? window.companySignaturePad.options || {} : null
          }
        },
        canvas: {
          client: {
            exists: !!clientCanvas,
            visible: clientCanvas ? window.getComputedStyle(clientCanvas).display !== 'none' : false,
            dimensions: clientCanvas ? { width: clientCanvas.width, height: clientCanvas.height } : null,
            hasContext: clientCanvas ? !!clientCanvas.getContext('2d') : false
          },
          company: {
            exists: !!companyCanvas,
            visible: companyCanvas ? window.getComputedStyle(companyCanvas).display !== 'none' : false,
            dimensions: companyCanvas ? { width: companyCanvas.width, height: companyCanvas.height } : null,
            hasContext: companyCanvas ? !!companyCanvas.getContext('2d') : false
          }
        }
      };
    });

    console.log('📊 Análisis post-inicialización:', JSON.stringify(postInitAnalysis, null, 2));

    // 4. Simular firma en canvas cliente con análisis detallado
    const clientCanvas = page.locator('#signatureCanvas');
    await expect(clientCanvas).toBeVisible();
    
    const canvasBounds = await clientCanvas.boundingBox();
    
    // Análisis antes de firmar
    const preSignatureAnalysis = await page.evaluate(() => {
      const canvas = document.getElementById('signatureCanvas');
      const context = canvas ? canvas.getContext('2d') : null;
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'pre_signature',
        canvas: {
          imageData: context ? context.getImageData(0, 0, canvas.width, canvas.height).data.length : 0,
          isEmpty: window.signaturePad ? window.signaturePad.isEmpty() : null
        }
      };
    });

    // Realizar firma
    await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 30);
    await page.mouse.move(canvasBounds.x + 150, canvasBounds.y + 60);
    await page.mouse.move(canvasBounds.x + 50, canvasBounds.y + 60);
    await page.mouse.up();

    // Análisis después de firmar
    const postClientSignatureAnalysis = await page.evaluate(() => {
      const canvas = document.getElementById('signatureCanvas');
      const context = canvas ? canvas.getContext('2d') : null;
      
      let toDataURLResult = null;
      let toDataURLError = null;
      
      try {
        toDataURLResult = window.signaturePad ? window.signaturePad.toDataURL() : null;
      } catch (error) {
        toDataURLError = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'post_client_signature',
        canvas: {
          imageData: context ? context.getImageData(0, 0, canvas.width, canvas.height).data.length : 0,
          isEmpty: window.signaturePad ? window.signaturePad.isEmpty() : null,
          toDataURLResult: toDataURLResult ? {
            length: toDataURLResult.length,
            startsWithDataImage: toDataURLResult.startsWith('data:image/'),
            type: toDataURLResult.substring(0, 50) + '...'
          } : null,
          toDataURLError: toDataURLError
        }
      };
    });

    console.log('📊 Análisis post-firma cliente:', JSON.stringify(postClientSignatureAnalysis, null, 2));

    // 5. Simular firma en canvas empresa
    const companyCanvas = page.locator('#companySignatureCanvas');
    await expect(companyCanvas).toBeVisible();
    
    const companyCanvasBounds = await companyCanvas.boundingBox();
    
    await page.mouse.move(companyCanvasBounds.x + 50, companyCanvasBounds.y + 30);
    await page.mouse.down();
    await page.mouse.move(companyCanvasBounds.x + 150, companyCanvasBounds.y + 30);
    await page.mouse.move(companyCanvasBounds.x + 150, companyCanvasBounds.y + 60);
    await page.mouse.move(companyCanvasBounds.x + 50, companyCanvasBounds.y + 60);
    await page.mouse.up();

    // 6. Análisis después de ambas firmas
    const postBothSignaturesAnalysis = await page.evaluate(() => {
      let clientSignatureData = null;
      let companySignatureData = null;
      let clientError = null;
      let companyError = null;
      
      try {
        clientSignatureData = window.getValidSignatureData ? window.getValidSignatureData(window.signaturePad) : null;
      } catch (error) {
        clientError = { message: error.message, name: error.name };
      }
      
      try {
        companySignatureData = window.getValidSignatureData ? window.getValidSignatureData(window.companySignaturePad) : null;
      } catch (error) {
        companyError = { message: error.message, name: error.name };
      }
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'post_both_signatures',
        clientSignature: {
          data: clientSignatureData ? {
            length: clientSignatureData.length,
            isValid: clientSignatureData.startsWith('data:image/')
          } : null,
          error: clientError
        },
        companySignature: {
          data: companySignatureData ? {
            length: companySignatureData.length,
            isValid: companySignatureData.startsWith('data:image/')
          } : null,
          error: companyError
        }
      };
    });

    console.log('📊 Análisis post-ambas firmas:', JSON.stringify(postBothSignaturesAnalysis, null, 2));

    // 7. Test de collectFormData específico para firmas
    const collectFormDataTest = await page.evaluate(() => {
      let formDataResult = null;
      let formDataError = null;
      
      try {
        formDataResult = window.collectFormData ? window.collectFormData() : null;
      } catch (error) {
        formDataError = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        phase: 'collectFormData_test',
        success: !!formDataResult,
        error: formDataError,
        signatures: formDataResult ? {
          clientSignature: formDataResult.signature ? {
            exists: !!formDataResult.signature,
            length: formDataResult.signature.length,
            isValid: formDataResult.signature.startsWith('data:image/')
          } : null,
          companySignature: formDataResult.companySignature ? {
            exists: !!formDataResult.companySignature,
            length: formDataResult.companySignature.length,
            isValid: formDataResult.companySignature.startsWith('data:image/')
          } : null
        } : null
      };
    });

    console.log('📊 Test collectFormData:', JSON.stringify(collectFormDataTest, null, 2));

    // 8. Compilar reporte completo de canvas analysis
    const canvasAnalysisReport = {
      timestamp: new Date().toISOString(),
      testName: 'Canvas Analysis Test',
      phases: {
        initial: initialCanvasAnalysis,
        postInit: postInitAnalysis,
        preSignature: preSignatureAnalysis,
        postClientSignature: postClientSignatureAnalysis,
        postBothSignatures: postBothSignaturesAnalysis,
        collectFormDataTest: collectFormDataTest
      }
    };

    // Guardar para el reporter
    await page.evaluate((report) => {
      window.canvasAnalysisReport = report;
    }, canvasAnalysisReport);

    // 9. Verificaciones críticas
    expect(initialCanvasAnalysis.clientCanvas.exists).toBe(true);
    expect(initialCanvasAnalysis.companyCanvas.exists).toBe(true);
    expect(postInitAnalysis.signaturePads.client.exists).toBe(true);
    expect(postInitAnalysis.signaturePads.company.exists).toBe(true);
    
    if (postBothSignaturesAnalysis.clientSignature.error) {
      console.log('❌ Error en firma cliente:', postBothSignaturesAnalysis.clientSignature.error);
    }
    
    if (postBothSignaturesAnalysis.companySignature.error) {
      console.log('❌ Error en firma empresa:', postBothSignaturesAnalysis.companySignature.error);
    }
    
    if (collectFormDataTest.error) {
      console.log('❌ Error en collectFormData:', collectFormDataTest.error);
    }
  });

  test('Test de casos específicos de firmas', async ({ page }) => {
    console.log('🧪 Test: Casos específicos de firmas');

    const scenarios = [
      { name: 'Sin firmas', clientSign: false, companySign: false },
      { name: 'Solo cliente', clientSign: true, companySign: false },
      { name: 'Solo empresa', clientSign: false, companySign: true },
      { name: 'Ambas firmas', clientSign: true, companySign: true }
    ];

    const scenarioResults = [];

    for (const scenario of scenarios) {
      console.log(`🎯 Ejecutando escenario: ${scenario.name}`);

      // Reset page
      await page.reload();
      await page.waitForSelector('#clientName', { state: 'visible' });

      // Llenar formulario
      await page.fill('#clientName', `Test ${scenario.name}`);
      await page.fill('#clientPhone', '1234567890');
      await page.selectOption('#transactionType', 'Compra');
      await page.selectOption('#pieceType', 'Anillo');
      await page.selectOption('#material', 'Oro');
      await page.fill('#price', '1000');

      // Esperar SignaturePads
      await page.waitForFunction(() => {
        return window.signaturePad && window.companySignaturePad;
      }, { timeout: 10000 });

      // Ejecutar firmas según escenario
      if (scenario.clientSign) {
        const clientCanvas = page.locator('#signatureCanvas');
        const bounds = await clientCanvas.boundingBox();
        await page.mouse.move(bounds.x + 50, bounds.y + 30);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 150, bounds.y + 60);
        await page.mouse.up();
      }

      if (scenario.companySign) {
        const companyCanvas = page.locator('#companySignatureCanvas');
        const bounds = await companyCanvas.boundingBox();
        await page.mouse.move(bounds.x + 50, bounds.y + 30);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 150, bounds.y + 60);
        await page.mouse.up();
      }

      // Capturar estado para este escenario
      const scenarioResult = await page.evaluate((scenarioName) => {
        let collectFormDataResult = null;
        let collectFormDataError = null;
        
        try {
          collectFormDataResult = window.collectFormData ? window.collectFormData() : null;
        } catch (error) {
          collectFormDataError = {
            message: error.message,
            stack: error.stack
          };
        }

        return {
          scenario: scenarioName,
          timestamp: new Date().toISOString(),
          signaturePadStates: {
            client: {
              isEmpty: window.signaturePad ? window.signaturePad.isEmpty() : null,
              hasData: window.signaturePad ? !window.signaturePad.isEmpty() : null
            },
            company: {
              isEmpty: window.companySignaturePad ? window.companySignaturePad.isEmpty() : null,
              hasData: window.companySignaturePad ? !window.companySignaturePad.isEmpty() : null
            }
          },
          collectFormData: {
            success: !!collectFormDataResult,
            error: collectFormDataError,
            signatures: collectFormDataResult ? {
              client: {
                hasSignature: !!collectFormDataResult.signature,
                isValid: collectFormDataResult.signature ? collectFormDataResult.signature.startsWith('data:image/') : false
              },
              company: {
                hasSignature: !!collectFormDataResult.companySignature,
                isValid: collectFormDataResult.companySignature ? collectFormDataResult.companySignature.startsWith('data:image/') : false
              }
            } : null
          }
        };
      }, scenario.name);

      scenarioResults.push(scenarioResult);
      console.log(`📊 Resultado ${scenario.name}:`, JSON.stringify(scenarioResult, null, 2));
    }

    // Guardar resultados de escenarios
    await page.evaluate((results) => {
      window.signaturescenariosReport = {
        timestamp: new Date().toISOString(),
        testName: 'Signature Scenarios Test',
        scenarios: results
      };
    }, scenarioResults);

    // Verificaciones
    expect(scenarioResults).toHaveLength(4);
    
    // Verificar que todos los escenarios ejecutaron collectFormData sin errores críticos
    scenarioResults.forEach(result => {
      if (result.collectFormData.error) {
        console.log(`⚠️ Error en escenario ${result.scenario}:`, result.collectFormData.error.message);
      }
    });
  });
});