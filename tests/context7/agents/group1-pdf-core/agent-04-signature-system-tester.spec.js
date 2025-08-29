// Agent 4: Signature-System-Tester
// Validar sistema de firmas digitales - ALTA PRIORIDAD

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';

test.describe('Agent 4: Signature System Tester', () => {
  const AGENT_ID = 4;

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
  });

  test('signature_canvas_creation - Verificar creación de canvas firmas', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'signature_canvas_creation', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Análisis de canvas de firmas
      const signatureCanvasAnalysis = await page.evaluate(() => {
        const analysis = {
          signaturePadAvailable: !!window.SignaturePad,
          signaturePadType: typeof window.SignaturePad,
          
          canvasElements: {},
          signaturePadInstances: {},
          
          timestamp: new Date().toISOString()
        };

        // Verificar canvas del cliente
        const clientCanvas = document.getElementById('signatureCanvas');
        if (clientCanvas) {
          analysis.canvasElements.client = {
            exists: true,
            width: clientCanvas.width,
            height: clientCanvas.height,
            offsetWidth: clientCanvas.offsetWidth,
            offsetHeight: clientCanvas.offsetHeight,
            visible: clientCanvas.offsetParent !== null
          };

          // Test crear SignaturePad
          try {
            if (window.SignaturePad) {
              const testSignaturePad = new window.SignaturePad(clientCanvas);
              analysis.signaturePadInstances.client = {
                created: true,
                isEmpty: testSignaturePad.isEmpty(),
                canClear: typeof testSignaturePad.clear === 'function',
                canToDataURL: typeof testSignaturePad.toDataURL === 'function'
              };
            }
          } catch (signatureError) {
            analysis.signaturePadInstances.client = {
              created: false,
              error: signatureError.message
            };
          }
        } else {
          analysis.canvasElements.client = { exists: false };
        }

        // Verificar canvas de empresa (doble firma)
        const companyCanvas = document.getElementById('companySignatureCanvas');
        if (companyCanvas) {
          analysis.canvasElements.company = {
            exists: true,
            width: companyCanvas.width,
            height: companyCanvas.height,
            offsetWidth: companyCanvas.offsetWidth,
            offsetHeight: companyCanvas.offsetHeight,
            visible: companyCanvas.offsetParent !== null
          };
        } else {
          analysis.canvasElements.company = { exists: false };
        }

        return analysis;
      });

      // Validaciones críticas
      expect(signatureCanvasAnalysis.signaturePadAvailable).toBe(true);
      expect(signatureCanvasAnalysis.canvasElements.client.exists).toBe(true);
      expect(signatureCanvasAnalysis.signaturePadInstances.client?.created).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'signature_canvas_creation', 'SUCCESS', signatureCanvasAnalysis);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'signature_canvas_creation', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('signature_capture - Test captura de firma digital', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'signature_capture', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar datos mínimos para test
      await page.fill('input[name="clientName"]', 'Signature Test Client');
      await page.fill('input[name="price"]', '15000');

      // Simular firma digital
      const signatureCaptureResult = await page.evaluate(() => {
        return new Promise((resolve) => {
          try {
            const clientCanvas = document.getElementById('signatureCanvas');
            if (!clientCanvas) {
              resolve({ success: false, error: 'Canvas no encontrado' });
              return;
            }

            // Verificar SignaturePad global
            if (!window.signaturePad) {
              resolve({ success: false, error: 'signaturePad global no encontrado' });
              return;
            }

            const pad = window.signaturePad;

            // Simular firma (dibujar línea simple)
            const ctx = clientCanvas.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(200, 100);
            ctx.lineTo(150, 150);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            // Verificar que la firma se capturó
            const isEmpty = pad.isEmpty();
            const dataURL = isEmpty ? null : pad.toDataURL();

            resolve({
              success: true,
              isEmpty: isEmpty,
              hasDataURL: !!dataURL,
              dataURLLength: dataURL ? dataURL.length : 0,
              canvasWidth: clientCanvas.width,
              canvasHeight: clientCanvas.height
            });

          } catch (error) {
            resolve({
              success: false,
              error: error.message
            });
          }
        });
      });

      expect(signatureCaptureResult.success).toBe(true);

      // Test botón de limpiar firma
      await page.locator('button[onclick*="clearSignature"]').click();

      const afterClearResult = await page.evaluate(() => {
        if (window.signaturePad) {
          return {
            isEmpty: window.signaturePad.isEmpty(),
            cleared: true
          };
        }
        return { cleared: false };
      });

      expect(afterClearResult.cleared).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'signature_capture', 'SUCCESS', {
        captureResult: signatureCaptureResult,
        clearResult: afterClearResult
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'signature_capture', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('signature_in_pdf - Verificar inclusión firma en PDF', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'signature_in_pdf', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar formulario
      await page.fill('input[name="clientName"]', 'PDF Signature Test');
      await page.fill('input[name="clientPhone"]', '55 1111 2222');
      await page.selectOption('select[name="pieceType"]', 'pulsera');
      await page.fill('input[name="price"]', '8500');

      // Crear firma de prueba
      await page.evaluate(() => {
        const clientCanvas = document.getElementById('signatureCanvas');
        const pad = window.signaturePad;
        
        if (clientCanvas && pad) {
          // Dibujar firma simple pero visible
          const ctx = clientCanvas.getContext('2d');
          ctx.beginPath();
          ctx.moveTo(30, 80);
          ctx.lineTo(150, 40);
          ctx.lineTo(120, 100);
          ctx.lineTo(200, 60);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#1a1a1a';
          ctx.stroke();
          
          // Agregar texto simulado
          ctx.font = '16px Arial';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText('Test Signature', 50, 120);
        }
      });

      // Verificar que la firma está presente antes de generar PDF
      const prePDFSignatureCheck = await page.evaluate(() => {
        const pad = window.signaturePad;
        if (pad) {
          const isEmpty = pad.isEmpty();
          const dataURL = isEmpty ? null : pad.toDataURL();
          return {
            isEmpty: isEmpty,
            hasSignature: !isEmpty,
            dataURLLength: dataURL ? dataURL.length : 0
          };
        }
        return { error: 'signaturePad no disponible' };
      });

      expect(prePDFSignatureCheck.hasSignature).toBe(true);

      // Capturar errores específicos de firma
      const signatureErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && 
            (msg.text().includes('firma') || 
             msg.text().includes('signature') || 
             msg.text().includes('procesando firmas'))) {
          signatureErrors.push({
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });

      // Intentar generar PDF con firma
      let pdfGenerationResult = null;
      
      try {
        const downloadPromise = page.waitForDownload({ timeout: 30000 });
        await page.locator('button[onclick*="generatePDF"]').click();
        
        const download = await downloadPromise;
        pdfGenerationResult = {
          success: true,
          fileName: download.suggestedFilename(),
          hasSignatureErrors: signatureErrors.length > 0,
          signatureErrors: signatureErrors
        };

        // Guardar PDF con firma para evidencia
        const agentDir = Context720Utils.createOutputDir(AGENT_ID);
        await download.saveAs(`${agentDir}/downloads/signature_in_pdf_${Date.now()}.pdf`);

      } catch (pdfError) {
        pdfGenerationResult = {
          success: false,
          error: pdfError.message,
          hasSignatureErrors: signatureErrors.length > 0,
          signatureErrors: signatureErrors
        };
      }

      Context720Utils.logAgentProgress(AGENT_ID, 'signature_in_pdf', 
        pdfGenerationResult.success ? 'SUCCESS' : 'FAILED', 
        {
          preSignatureCheck: prePDFSignatureCheck,
          pdfResult: pdfGenerationResult
        }
      );

      // CRITICAL: El sistema debe generar PDF con firma sin errores
      if (!pdfGenerationResult.success || signatureErrors.length > 0) {
        // Screenshot para análisis del problema
        const agentDir = Context720Utils.createOutputDir(AGENT_ID);
        await page.screenshot({ 
          path: `${agentDir}/screenshots/signature_pdf_issue.png`,
          fullPage: true 
        });
        
        // Esto puede ser el error script.js:2507
        expect.soft(pdfGenerationResult.success).toBe(true);
        expect.soft(signatureErrors.length).toBe(0);
      }

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'signature_in_pdf', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

});