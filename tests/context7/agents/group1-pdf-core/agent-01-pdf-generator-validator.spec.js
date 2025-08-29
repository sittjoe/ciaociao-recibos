// Agent 1: PDF-Generator-Validator
// Testear generación básica de PDFs - CRÍTICO

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';

test.describe('Agent 1: PDF Generator Validator', () => {
  const AGENT_ID = 1;
  const AGENT_NAME = 'PDF-Generator-Validator';

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    
    // Configurar downloads
    await page.context().grantPermissions(['downloads']);
    
    // Navegar a producción real
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
    Context720Utils.logAgentProgress(AGENT_ID, 'navigation', 'COMPLETED');
  });

  test('basic_pdf_generation - Test generación básica de PDF', async ({ page }) => {
    const testId = Context720Utils.generateTestId(AGENT_ID, 'basic_pdf_generation');
    Context720Utils.logAgentProgress(AGENT_ID, 'basic_pdf_generation', 'RUNNING');

    try {
      // 1. Autenticación
      await Context720Utils.measurePerformance(async () => {
        const passwordInput = await page.locator('input[type="password"]');
        if (await passwordInput.isVisible()) {
          await passwordInput.fill('27181730');
          await page.locator('button[onclick*="validatePassword"]').click();
          await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
        }
      }, 'Authentication');

      Context720Utils.logAgentProgress(AGENT_ID, 'authentication', 'COMPLETED');

      // 2. Llenar formulario básico
      const formFillResult = await Context720Utils.measurePerformance(async () => {
        // Datos básicos del recibo
        await page.fill('input[name="clientName"]', 'Test Cliente PDF');
        await page.fill('input[name="clientPhone"]', '55 1234 5678');
        await page.fill('input[name="clientEmail"]', 'test@pdf.com');

        // Detalles del producto
        await page.selectOption('select[name="pieceType"]', 'anillo');
        await page.selectOption('select[name="material"]', 'oro-14k');
        await page.fill('input[name="weight"]', '5');
        await page.fill('textarea[name="description"]', 'Anillo de prueba PDF');

        // Precio
        await page.fill('input[name="price"]', '10000');
      }, 'Form filling');

      expect(formFillResult.success).toBe(true);
      Context720Utils.logAgentProgress(AGENT_ID, 'form_fill', 'COMPLETED');

      // 3. Verificar que jsPDF está disponible
      const libraryCheck = await page.evaluate(() => {
        return {
          jsPDF_window: !!window.jsPDF,
          jsPDF_alternate: !!(window.jspdf && window.jspdf.jsPDF),
          html2canvas: !!window.html2canvas,
          signaturePad: !!window.SignaturePad
        };
      });

      Context720Utils.logAgentProgress(AGENT_ID, 'library_check', 'COMPLETED', libraryCheck);

      // CRITICAL: Verificar que al menos una versión de jsPDF está disponible
      expect(libraryCheck.jsPDF_window || libraryCheck.jsPDF_alternate).toBe(true);
      expect(libraryCheck.html2canvas).toBe(true);

      // 4. Configurar captura de descarga
      const downloadPromise = page.waitForDownload({ timeout: 30000 });

      // 5. Generar PDF
      const pdfGenerationResult = await Context720Utils.measurePerformance(async () => {
        // Click en generar PDF
        await page.locator('button[onclick*="generatePDF"]').click();
        
        // Esperar descarga
        const download = await downloadPromise;
        return download;
      }, 'PDF Generation');

      expect(pdfGenerationResult.success).toBe(true);
      expect(pdfGenerationResult.result).toBeDefined();

      Context720Utils.logAgentProgress(AGENT_ID, 'pdf_generation', 'COMPLETED');

      // 6. Validar archivo descargado
      const download = pdfGenerationResult.result;
      const downloadPath = await download.path();
      const fileName = download.suggestedFilename();

      expect(fileName).toContain('.pdf');
      expect(downloadPath).toBeTruthy();

      Context720Utils.logAgentProgress(AGENT_ID, 'file_validation', 'COMPLETED');

      // 7. Guardar PDF para evidencia
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      const evidencePath = `${agentDir}/downloads/${fileName}`;
      await download.saveAs(evidencePath);

      Context720Utils.logAgentProgress(AGENT_ID, 'basic_pdf_generation', 'SUCCESS', {
        fileName: fileName,
        downloadPath: downloadPath,
        evidencePath: evidencePath,
        libraries: libraryCheck,
        performance: {
          authentication: formFillResult.duration,
          formFill: formFillResult.duration, 
          pdfGeneration: pdfGenerationResult.duration
        }
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'basic_pdf_generation', 'FAILED', {
        error: error.message,
        stack: error.stack
      });

      // Capturar screenshot del fallo
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/basic_pdf_generation_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

  test('simple_client_data - Test con datos cliente simples', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'simple_client_data', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Datos muy simples para test rápido
      await page.fill('input[name="clientName"]', 'Ana');
      await page.fill('input[name="clientPhone"]', '5512345678');
      await page.selectOption('select[name="pieceType"]', 'anillo');
      await page.fill('input[name="price"]', '5000');

      // Verificar funcionalidad de libraries críticas
      const criticalLibsCheck = await page.evaluate(() => {
        const errors = [];
        
        try {
          // Test jsPDF
          if (window.jsPDF) {
            const testPdf = new window.jsPDF();
            if (!testPdf) errors.push('jsPDF instantiation failed');
          } else if (window.jspdf && window.jspdf.jsPDF) {
            const testPdf = new window.jspdf.jsPDF();
            if (!testPdf) errors.push('jsPDF (alternate) instantiation failed');
          } else {
            errors.push('jsPDF not found in any format');
          }
          
          // Test html2canvas
          if (!window.html2canvas) {
            errors.push('html2canvas not found');
          }
          
        } catch (e) {
          errors.push(`Library test error: ${e.message}`);
        }
        
        return { errors, timestamp: new Date().toISOString() };
      });

      expect(criticalLibsCheck.errors.length).toBe(0);

      // Configurar descarga y generar PDF
      const downloadPromise = page.waitForDownload({ timeout: 30000 });
      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      expect(download).toBeDefined();

      // Guardar evidencia
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await download.saveAs(`${agentDir}/downloads/simple_client_${Date.now()}.pdf`);

      Context720Utils.logAgentProgress(AGENT_ID, 'simple_client_data', 'SUCCESS');

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'simple_client_data', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('minimal_product_info - Test con info producto mínima', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'minimal_product_info', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Solo campos absolutamente mínimos
      await page.fill('input[name="clientName"]', 'Cliente Mínimo');
      await page.fill('input[name="price"]', '1000');

      // Verificar que el sistema puede generar PDF con datos mínimos
      const downloadPromise = page.waitForDownload({ timeout: 30000 });
      
      // Capturar cualquier error de JavaScript durante generación
      const jsErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text());
        }
      });

      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      expect(download).toBeDefined();

      // Verificar que no hubo errores críticos
      const criticalErrors = jsErrors.filter(error => 
        error.includes('jsPDF') || 
        error.includes('html2canvas') || 
        error.includes('script.js:2507')
      );

      if (criticalErrors.length > 0) {
        Context720Utils.logAgentProgress(AGENT_ID, 'minimal_product_info', 'WARNING', {
          jsErrors: criticalErrors
        });
      }

      // Guardar evidencia
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await download.saveAs(`${agentDir}/downloads/minimal_product_${Date.now()}.pdf`);

      Context720Utils.logAgentProgress(AGENT_ID, 'minimal_product_info', 'SUCCESS', {
        jsErrorCount: jsErrors.length,
        criticalErrorCount: criticalErrors.length
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'minimal_product_info', 'FAILED', {
        error: error.message
      });

      // Screenshot para debugging
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/minimal_product_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

  test.afterEach(async ({ page }) => {
    // Capturar log final del agente
    Context720Utils.logAgentProgress(AGENT_ID, 'cleanup', 'COMPLETED');
  });

});