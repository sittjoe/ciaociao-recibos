// Agent 2: jsPDF-Library-Analyzer  
// Diagnosticar problema window.jsPDF vs window.jspdf - CRÍTICO

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';

test.describe('Agent 2: jsPDF Library Analyzer', () => {
  const AGENT_ID = 2;
  const AGENT_NAME = 'jsPDF-Library-Analyzer';

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
  });

  test('jspdf_detection - Análisis exhaustivo disponibilidad jsPDF', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'jspdf_detection', 'RUNNING');

    try {
      // 1. Análisis inicial de bibliotecas antes de autenticación
      const preAuthLibraries = await page.evaluate(() => {
        return {
          window_jsPDF: !!window.jsPDF,
          window_jspdf: !!window.jspdf,
          window_jspdf_jsPDF: !!(window.jspdf && window.jspdf.jsPDF),
          jsPDF_constructor: typeof window.jsPDF,
          jspdf_type: typeof window.jspdf,
          
          // Tests de instanciación
          canInstantiate_jsPDF: false,
          canInstantiate_alternate: false,
          
          // Análisis profundo de propiedades
          jsPDF_properties: window.jsPDF ? Object.keys(window.jsPDF) : [],
          jspdf_properties: window.jspdf ? Object.keys(window.jspdf) : [],
          
          timestamp: new Date().toISOString()
        };
      });

      Context720Utils.logAgentProgress(AGENT_ID, 'pre_auth_analysis', 'COMPLETED', preAuthLibraries);

      // 2. Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // 3. Análisis post-autenticación (crítico - pueden cargar más libraries)
      const postAuthLibraries = await page.evaluate(() => {
        const analysis = {
          window_jsPDF: !!window.jsPDF,
          window_jspdf: !!window.jspdf,
          window_jspdf_jsPDF: !!(window.jspdf && window.jspdf.jsPDF),
          
          // Intentos de instanciación reales
          instantiation_tests: {},
          error_details: {}
        };

        // Test 1: window.jsPDF
        try {
          if (window.jsPDF) {
            const testPdf1 = new window.jsPDF();
            analysis.instantiation_tests.window_jsPDF = {
              success: true,
              type: typeof testPdf1,
              hasAddPage: typeof testPdf1.addPage === 'function',
              hasSave: typeof testPdf1.save === 'function'
            };
          }
        } catch (error) {
          analysis.error_details.window_jsPDF = error.message;
          analysis.instantiation_tests.window_jsPDF = { success: false, error: error.message };
        }

        // Test 2: window.jspdf.jsPDF (formato alternativo)
        try {
          if (window.jspdf && window.jspdf.jsPDF) {
            const testPdf2 = new window.jspdf.jsPDF();
            analysis.instantiation_tests.alternate_jsPDF = {
              success: true,
              type: typeof testPdf2,
              hasAddPage: typeof testPdf2.addPage === 'function',
              hasSave: typeof testPdf2.save === 'function'
            };
          }
        } catch (error) {
          analysis.error_details.alternate_jsPDF = error.message;
          analysis.instantiation_tests.alternate_jsPDF = { success: false, error: error.message };
        }

        return analysis;
      });

      Context720Utils.logAgentProgress(AGENT_ID, 'post_auth_analysis', 'COMPLETED', postAuthLibraries);

      // 4. CRITICAL ASSERTION: Al menos una forma de jsPDF debe funcionar
      const jsPDFWorking = postAuthLibraries.instantiation_tests.window_jsPDF?.success || 
                          postAuthLibraries.instantiation_tests.alternate_jsPDF?.success;

      expect(jsPDFWorking).toBe(true);

      // 5. Análisis del error script.js:2507 específicamente
      const scriptErrorAnalysis = await page.evaluate(() => {
        // Buscar función específica que causa el error
        const scriptTags = Array.from(document.querySelectorAll('script'));
        const scriptContent = scriptTags.map(script => script.innerHTML).join('\n');
        
        return {
          hasGeneratePDFFunction: scriptContent.includes('generatePDF'),
          hasJsPDFReference: scriptContent.includes('jsPDF'),
          hasWindowJsPDFCheck: scriptContent.includes('window.jsPDF'),
          hasAlternateCheck: scriptContent.includes('window.jspdf'),
          
          // Buscar línea problemática específica
          errorLineContext: scriptContent.split('\n')
            .map((line, index) => ({ line: index + 1, content: line }))
            .filter(item => item.content.includes('procesando firmas') || 
                           item.content.includes('Error procesando') ||
                           item.content.includes('2507'))
            .slice(0, 5) // Primeras 5 ocurrencias
        };
      });

      Context720Utils.logAgentProgress(AGENT_ID, 'script_error_analysis', 'COMPLETED', scriptErrorAnalysis);

      // 6. Test de compatibilidad con sistema actual
      await page.fill('input[name="clientName"]', 'Test jsPDF Detection');
      await page.fill('input[name="price"]', '1000');

      // Capturar errores JavaScript específicamente durante generación PDF
      const jsErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push({
            type: 'error',
            text: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString()
          });
        }
      });

      // Intentar generar PDF y capturar errores
      try {
        const downloadPromise = page.waitForDownload({ timeout: 15000 });
        await page.locator('button[onclick*="generatePDF"]').click();
        
        const download = await downloadPromise;
        
        Context720Utils.logAgentProgress(AGENT_ID, 'jspdf_detection', 'SUCCESS', {
          preAuth: preAuthLibraries,
          postAuth: postAuthLibraries,
          scriptAnalysis: scriptErrorAnalysis,
          pdfGenerated: true,
          jsErrorCount: jsErrors.length,
          jsErrors: jsErrors.slice(0, 3) // Primeros 3 errores
        });

        // Guardar PDF como evidencia
        const agentDir = Context720Utils.createOutputDir(AGENT_ID);
        await download.saveAs(`${agentDir}/downloads/jspdf_detection_success.pdf`);

      } catch (downloadError) {
        // PDF falló - analizar por qué
        Context720Utils.logAgentProgress(AGENT_ID, 'jspdf_detection', 'CRITICAL_FAILURE', {
          preAuth: preAuthLibraries,
          postAuth: postAuthLibraries,
          scriptAnalysis: scriptErrorAnalysis,
          downloadError: downloadError.message,
          jsErrorCount: jsErrors.length,
          jsErrors: jsErrors
        });

        // Este es el comportamiento que estamos investigando
        expect.soft(downloadError).toBeUndefined(); // Soft assertion para continuar análisis
      }

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'jspdf_detection', 'FAILED', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  });

  test('library_loading_sequence - Secuencia de carga bibliotecas', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'library_loading_sequence', 'RUNNING');

    try {
      // Interceptar requests de CDN para analizar secuencia de carga
      const networkRequests = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('jspdf') || url.includes('html2canvas') || url.includes('signature')) {
          networkRequests.push({
            url: url,
            timestamp: Date.now(),
            method: request.method()
          });
        }
      });

      page.on('response', response => {
        const url = response.url();
        if (url.includes('jspdf') || url.includes('html2canvas') || url.includes('signature')) {
          const existing = networkRequests.find(req => req.url === url);
          if (existing) {
            existing.status = response.status();
            existing.responseTime = Date.now() - existing.timestamp;
            existing.ok = response.ok();
          }
        }
      });

      // Autenticación y análisis de carga
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Esperar tiempo adicional para todas las bibliotecas
      await page.waitForTimeout(3000);

      // Análisis final de bibliotecas después de carga completa
      const finalLibraryState = await page.evaluate(() => {
        const libs = {
          jsPDF: {
            available: !!window.jsPDF,
            type: typeof window.jsPDF,
            version: window.jsPDF?.version || 'unknown'
          },
          jspdf_alternate: {
            available: !!(window.jspdf && window.jspdf.jsPDF),
            type: typeof window.jspdf,
            jsPDF_type: window.jspdf ? typeof window.jspdf.jsPDF : 'undefined'
          },
          html2canvas: {
            available: !!window.html2canvas,
            type: typeof window.html2canvas,
            version: window.html2canvas?.version || 'unknown'
          },
          signaturePad: {
            available: !!window.SignaturePad,
            type: typeof window.SignaturePad
          }
        };

        // Test de funcionalidad
        libs.functionality_test = {};
        
        try {
          if (window.jsPDF) {
            new window.jsPDF();
            libs.functionality_test.jsPDF = 'WORKING';
          } else if (window.jspdf && window.jspdf.jsPDF) {
            new window.jspdf.jsPDF();
            libs.functionality_test.jsPDF = 'WORKING_ALTERNATE';
          } else {
            libs.functionality_test.jsPDF = 'NOT_AVAILABLE';
          }
        } catch (e) {
          libs.functionality_test.jsPDF = `ERROR: ${e.message}`;
        }

        return libs;
      });

      Context720Utils.logAgentProgress(AGENT_ID, 'library_loading_sequence', 'SUCCESS', {
        networkRequests: networkRequests,
        finalLibraryState: finalLibraryState,
        loadingSequenceComplete: true
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'library_loading_sequence', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('script_error_line_2507 - Investigación específica error línea 2507', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'script_error_line_2507', 'RUNNING');

    try {
      // Configurar captura detallada de errores JavaScript
      const detailedErrors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          detailedErrors.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString()
          });
        }
      });

      // Capturar errores de página no manejados
      page.on('pageerror', error => {
        detailedErrors.push({
          type: 'pageerror',
          text: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });

      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar datos mínimos para trigger error
      await page.fill('input[name="clientName"]', 'Error Test Client');
      await page.fill('input[name="price"]', '5000');

      // Intentar generar PDF específicamente para trigger línea 2507
      let pdfGenerationResult = null;
      
      try {
        const downloadPromise = page.waitForDownload({ timeout: 10000 });
        await page.locator('button[onclick*="generatePDF"]').click();
        
        pdfGenerationResult = {
          success: true,
          download: await downloadPromise
        };
        
      } catch (pdfError) {
        pdfGenerationResult = {
          success: false,
          error: pdfError.message
        };
      }

      // Analizar errores específicos
      const line2507Errors = detailedErrors.filter(error => 
        error.text.includes('2507') || 
        error.text.includes('procesando firmas') ||
        error.text.includes('script.js:2507') ||
        (error.location && error.location.lineNumber === 2507)
      );

      const jsPDFErrors = detailedErrors.filter(error =>
        error.text.toLowerCase().includes('jspdf') ||
        error.text.includes('window.jsPDF') ||
        error.text.includes('PDF library')
      );

      Context720Utils.logAgentProgress(AGENT_ID, 'script_error_line_2507', 'COMPLETED', {
        pdfGenerationSuccess: pdfGenerationResult.success,
        totalErrorCount: detailedErrors.length,
        line2507Errors: line2507Errors,
        jsPDFErrors: jsPDFErrors,
        allErrors: detailedErrors.slice(0, 10), // Primeros 10 errores
        
        // Información crítica para diagnosis
        errorSummary: {
          hasLine2507Error: line2507Errors.length > 0,
          hasJsPDFError: jsPDFErrors.length > 0,
          mostCommonError: detailedErrors.length > 0 ? detailedErrors[0].text : null
        }
      });

      // CRITICAL: Si encontramos el error específico, marcarlo como hallazgo crítico
      if (line2507Errors.length > 0) {
        expect.soft(line2507Errors.length).toBe(0); // Soft assertion para documentar
      }

      // Guardar screenshot del estado cuando ocurre el error
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/script_error_2507_state.png`,
        fullPage: true 
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'script_error_line_2507', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

});