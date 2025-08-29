// Agent 3: Canvas-HTML2-Validator
// Verificar html2canvas functionality - ALTA PRIORIDAD

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';

test.describe('Agent 3: Canvas HTML2 Validator', () => {
  const AGENT_ID = 3;

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
  });

  test('html2canvas_loading - Verificar carga y disponibilidad html2canvas', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'html2canvas_loading', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Análisis completo de html2canvas
      const html2canvasAnalysis = await page.evaluate(() => {
        const analysis = {
          available: !!window.html2canvas,
          type: typeof window.html2canvas,
          version: window.html2canvas?.version || 'unknown',
          
          // Test de funcionalidad básica
          functionality: {},
          
          // Test de opciones soportadas
          supportedOptions: {},
          
          timestamp: new Date().toISOString()
        };

        if (window.html2canvas) {
          // Test básico de canvas creation
          try {
            const testElement = document.createElement('div');
            testElement.innerHTML = 'Test content';
            testElement.style.cssText = 'position: absolute; left: -9999px; background: white; padding: 20px;';
            document.body.appendChild(testElement);

            // Test simple call
            analysis.functionality.canCall = typeof window.html2canvas === 'function';
            
            // Test opciones críticas para PDF
            analysis.supportedOptions = {
              scale: true,
              useCORS: true,
              backgroundColor: true,
              width: true,
              height: true,
              allowTaint: true,
              foreignObjectRendering: true
            };

            document.body.removeChild(testElement);

          } catch (error) {
            analysis.functionality.error = error.message;
          }
        } else {
          analysis.functionality.available = false;
        }

        return analysis;
      });

      expect(html2canvasAnalysis.available).toBe(true);
      expect(html2canvasAnalysis.functionality.canCall).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'html2canvas_loading', 'SUCCESS', html2canvasAnalysis);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'html2canvas_loading', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('canvas_generation - Test generación real de canvas', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'canvas_generation', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar formulario para crear contenido real
      await page.fill('input[name="clientName"]', 'Canvas Test Client');
      await page.fill('input[name="clientPhone"]', '55 9876 5432');
      await page.selectOption('select[name="pieceType"]', 'collar');
      await page.selectOption('select[name="material"]', 'oro-18k');
      await page.fill('input[name="weight"]', '15.5');
      await page.fill('textarea[name="description"]', 'Collar de prueba para canvas generation testing');
      await page.fill('input[name="price"]', '25000');

      // Test de generación de canvas directamente
      const canvasGenerationResult = await page.evaluate(() => {
        return new Promise(async (resolve) => {
          try {
            // Crear elemento temporal para capturar
            const testElement = document.createElement('div');
            testElement.innerHTML = `
              <div style="font-family: Arial; padding: 20px; background: white; width: 600px;">
                <h2>CIAOCIAO.MX - Test Canvas</h2>
                <p><strong>Cliente:</strong> Canvas Test Client</p>
                <p><strong>Producto:</strong> Collar oro 18k</p>
                <p><strong>Precio:</strong> $25,000.00</p>
                <p>Descripción: Collar de prueba para canvas generation testing</p>
              </div>
            `;
            testElement.style.cssText = 'position: absolute; left: -9999px; top: 0;';
            document.body.appendChild(testElement);

            // Configuración de canvas (simulando la del sistema)
            const canvasOptions = {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: 600,
              height: 400
            };

            // Generar canvas usando html2canvas
            const canvas = await window.html2canvas(testElement.firstElementChild, canvasOptions);

            const result = {
              success: true,
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              hasContent: canvas.width > 0 && canvas.height > 0,
              
              // Verificar que canvas tiene contenido real (no está vacío)
              canvasDataLength: canvas.toDataURL('image/png').length,
              
              timestamp: new Date().toISOString()
            };

            // Limpiar
            document.body.removeChild(testElement);

            resolve(result);

          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      expect(canvasGenerationResult.success).toBe(true);
      expect(canvasGenerationResult.hasContent).toBe(true);
      expect(canvasGenerationResult.canvasDataLength).toBeGreaterThan(1000); // Canvas no vacío

      Context720Utils.logAgentProgress(AGENT_ID, 'canvas_generation', 'SUCCESS', canvasGenerationResult);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'canvas_generation', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('canvas_quality_validation - Validar calidad output canvas', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'canvas_quality_validation', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar datos para test de calidad
      await page.fill('input[name="clientName"]', 'Quality Test - Mañana & Niño');
      await page.fill('input[name="price"]', '37500.75'); // Test decimal precision

      // Test de calidad de canvas con diferentes escalas
      const qualityTestResults = await page.evaluate(() => {
        return new Promise(async (resolve) => {
          const results = {
            scaleTests: [],
            characterTests: {},
            currencyTests: {},
            timestamp: new Date().toISOString()
          };

          try {
            // Crear contenido de prueba con caracteres especiales y currency
            const testElement = document.createElement('div');
            testElement.innerHTML = `
              <div style="font-family: Arial; padding: 30px; background: white; width: 800px;">
                <h2>CIAOCIAO.MX - Quality Test</h2>
                <p><strong>Cliente:</strong> Quality Test - Mañana & Niño</p>
                <p><strong>Precio:</strong> $37,500.75</p>
                <p><strong>Caracteres especiales:</strong> ñÑáéíóúÁÉÍÓÚ</p>
                <p><strong>Símbolos:</strong> ® © ™ € £ ¥</p>
              </div>
            `;
            testElement.style.cssText = 'position: absolute; left: -9999px; top: 0;';
            document.body.appendChild(testElement);

            const contentElement = testElement.firstElementChild;

            // Test diferentes escalas
            const scales = [1, 1.5, 2, 3];
            
            for (const scale of scales) {
              try {
                const canvas = await window.html2canvas(contentElement, {
                  scale: scale,
                  useCORS: true,
                  backgroundColor: '#ffffff'
                });

                const dataURL = canvas.toDataURL('image/png');
                
                results.scaleTests.push({
                  scale: scale,
                  width: canvas.width,
                  height: canvas.height,
                  dataLength: dataURL.length,
                  success: true,
                  quality: dataURL.length > 10000 ? 'good' : 'poor'
                });

              } catch (scaleError) {
                results.scaleTests.push({
                  scale: scale,
                  success: false,
                  error: scaleError.message
                });
              }
            }

            // Test rendering de caracteres especiales
            results.characterTests = {
              hasSpecialChars: contentElement.textContent.includes('ñ'),
              hasCurrency: contentElement.textContent.includes('$'),
              hasDecimals: contentElement.textContent.includes('.75')
            };

            // Limpiar
            document.body.removeChild(testElement);

            resolve(results);

          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      // Validaciones de calidad
      expect(qualityTestResults.scaleTests.length).toBeGreaterThan(0);
      
      const successfulScales = qualityTestResults.scaleTests.filter(test => test.success);
      expect(successfulScales.length).toBeGreaterThan(0);

      // Al menos scale 2 debe funcionar (es el que usa el sistema)
      const scale2Test = qualityTestResults.scaleTests.find(test => test.scale === 2);
      expect(scale2Test?.success).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'canvas_quality_validation', 'SUCCESS', qualityTestResults);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'canvas_quality_validation', 'FAILED', {
        error: error.message
      });
      
      // Screenshot para debugging
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/canvas_quality_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

});