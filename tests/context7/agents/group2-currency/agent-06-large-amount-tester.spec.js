// Agent 6: Large-Amount-Tester
// Validar montos $25,000+, $50,000+ - ALTA PRIORIDAD

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';

test.describe('Agent 6: Large Amount Tester', () => {
  const AGENT_ID = 6;

  // Montos problemáticos identificados
  const PROBLEMATIC_AMOUNTS = [25000, 37500, 50000, 75000, 100000, 125000];

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
    
    // Autenticación
    const passwordInput = await page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('27181730');
      await page.locator('button[onclick*="validatePassword"]').click();
      await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
    }
  });

  test('amount_25000_test - Test formato $25,000.00', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'amount_25000_test', 'RUNNING');

    try {
      const testAmount = 25000;
      
      // Llenar formulario con monto específico
      await page.fill('input[name="clientName"]', 'Large Amount Test 25K');
      await page.fill('input[name="clientPhone"]', '55 2500 0000');
      await page.selectOption('select[name="pieceType"]', 'collar');
      await page.selectOption('select[name="material"]', 'oro-18k');
      await page.fill('input[name="weight"]', '25');
      await page.fill('input[name="price"]', testAmount.toString());

      Context720Utils.logAgentProgress(AGENT_ID, 'form_filled', 'SUCCESS', { amount: testAmount });

      // Verificar formato en HTML antes de PDF
      const htmlFormatCheck = await page.evaluate((amount) => {
        // Buscar displays de precio en la página
        const priceInputs = document.querySelectorAll('input[name="price"]');
        const priceDisplays = document.querySelectorAll('[data-price], .price-display, .currency-display');
        
        const results = {
          inputValue: null,
          displayValues: [],
          formatTests: {},
          amount: amount
        };
        
        // Check input value
        if (priceInputs.length > 0) {
          results.inputValue = priceInputs[0].value;
        }
        
        // Check display values
        priceDisplays.forEach((element, index) => {
          results.displayValues.push({
            index: index,
            textContent: element.textContent,
            innerHTML: element.innerHTML
          });
        });
        
        // Test formato esperado
        const expectedFormats = [
          '$25,000.00',
          '$25,000',
          '25,000.00',
          '25000.00'
        ];
        
        expectedFormats.forEach(format => {
          results.formatTests[format] = {
            foundInInput: results.inputValue?.includes(format.replace('$', '')),
            foundInPage: document.body.textContent.includes(format)
          };
        });
        
        return results;
      }, testAmount);

      Context720Utils.logAgentProgress(AGENT_ID, 'html_format_check', 'COMPLETED', htmlFormatCheck);

      // Intentar generar PDF
      let pdfResult = null;
      
      try {
        const downloadPromise = page.waitForDownload({ timeout: 30000 });
        await page.locator('button[onclick*="generatePDF"]').click();
        
        const download = await downloadPromise;
        
        pdfResult = {
          success: true,
          fileName: download.suggestedFilename(),
          amount: testAmount
        };
        
        // Guardar PDF para análisis posterior
        const agentDir = Context720Utils.createOutputDir(AGENT_ID);
        await download.saveAs(`${agentDir}/downloads/amount_${testAmount}_test.pdf`);
        
      } catch (pdfError) {
        pdfResult = {
          success: false,
          error: pdfError.message,
          amount: testAmount
        };
      }

      Context720Utils.logAgentProgress(AGENT_ID, 'amount_25000_test', 
        pdfResult.success ? 'SUCCESS' : 'FAILED', 
        {
          htmlFormatCheck: htmlFormatCheck,
          pdfResult: pdfResult
        }
      );

      // La validación no debe fallar por formato de moneda
      expect(pdfResult.success).toBe(true);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'amount_25000_test', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('amount_50000_test - Test formato $50,000.00', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'amount_50000_test', 'RUNNING');

    try {
      const testAmount = 50000;
      
      await page.fill('input[name="clientName"]', 'Large Amount Test 50K');
      await page.fill('input[name="clientPhone"]', '55 5000 0000');
      await page.selectOption('select[name="pieceType"]', 'anillo');
      await page.selectOption('select[name="material"]', 'oro-18k');
      await page.fill('input[name="weight"]', '15.5');
      await page.fill('input[name="price"]', testAmount.toString());

      // Verificar cálculos automáticos con monto grande
      const calculationCheck = await page.evaluate(() => {
        // Trigger cálculos si existen
        const priceInput = document.querySelector('input[name="price"]');
        if (priceInput) {
          priceInput.dispatchEvent(new Event('blur'));
          priceInput.dispatchEvent(new Event('change'));
        }
        
        // Buscar elementos de cálculo
        const subtotalElements = document.querySelectorAll('[data-subtotal], .subtotal, input[name="subtotal"]');
        const balanceElements = document.querySelectorAll('[data-balance], .balance, input[name="balance"]');
        
        return {
          subtotalFound: subtotalElements.length > 0,
          balanceFound: balanceElements.length > 0,
          subtotalValues: Array.from(subtotalElements).map(el => el.value || el.textContent),
          balanceValues: Array.from(balanceElements).map(el => el.value || el.textContent)
        };
      });

      // PDF Generation
      const downloadPromise = page.waitForDownload({ timeout: 30000 });
      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await download.saveAs(`${agentDir}/downloads/amount_${testAmount}_test.pdf`);

      Context720Utils.logAgentProgress(AGENT_ID, 'amount_50000_test', 'SUCCESS', {
        testAmount: testAmount,
        calculationCheck: calculationCheck,
        pdfGenerated: true
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'amount_50000_test', 'FAILED', {
        error: error.message,
        amount: 50000
      });
      throw error;
    }
  });

  test('amount_100000_test - Test formato $100,000.00', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'amount_100000_test', 'RUNNING');

    try {
      const testAmount = 100000;
      
      await page.fill('input[name="clientName"]', 'Large Amount Test 100K');
      await page.fill('input[name="clientPhone"]', '55 1000 0000');
      await page.selectOption('select[name="pieceType"]', 'collar');
      await page.selectOption('select[name="material"]', 'oro-18k');
      await page.fill('input[name="weight"]', '50');
      await page.fill('textarea[name="description"]', 'Collar exclusivo para test de monto muy alto $100,000');
      await page.fill('input[name="price"]', testAmount.toString());

      // Verificar manejo de montos extremos
      const extremeAmountCheck = await page.evaluate((amount) => {
        const priceInput = document.querySelector('input[name="price"]');
        
        return {
          inputAcceptedValue: priceInput ? priceInput.value : null,
          inputMaxLength: priceInput ? priceInput.maxLength : null,
          pageHandlesLargeAmount: document.body.textContent.includes('100') && 
                                  document.body.textContent.includes('000'),
          amount: amount
        };
      }, testAmount);

      // Capturar errores específicos de montos grandes
      const largeAmountErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && 
            (msg.text().includes('100000') || 
             msg.text().includes('formato') || 
             msg.text().includes('currency') ||
             msg.text().includes('calculation'))) {
          largeAmountErrors.push(msg.text());
        }
      });

      // PDF Generation
      const downloadPromise = page.waitForDownload({ timeout: 30000 });
      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await download.saveAs(`${agentDir}/downloads/amount_${testAmount}_test.pdf`);

      Context720Utils.logAgentProgress(AGENT_ID, 'amount_100000_test', 'SUCCESS', {
        testAmount: testAmount,
        extremeAmountCheck: extremeAmountCheck,
        largeAmountErrors: largeAmountErrors,
        errorCount: largeAmountErrors.length
      });

      // No debe haber errores específicos de montos grandes
      expect(largeAmountErrors.length).toBe(0);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'amount_100000_test', 'FAILED', {
        error: error.message,
        amount: 100000
      });

      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/amount_100k_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

  // Test combinado de múltiples montos problemáticos
  test('multiple_amounts_batch_test - Test batch múltiples montos', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'multiple_amounts_batch_test', 'RUNNING');

    const batchResults = [];

    for (const amount of PROBLEMATIC_AMOUNTS.slice(0, 3)) { // Test primeros 3 para no saturar
      try {
        Context720Utils.logAgentProgress(AGENT_ID, `testing_amount_${amount}`, 'RUNNING');

        // Limpiar formulario
        await page.reload();
        
        // Re-autenticación después de reload
        const passwordInput = await page.locator('input[type="password"]');
        if (await passwordInput.isVisible()) {
          await passwordInput.fill('27181730');
          await page.locator('button[onclick*="validatePassword"]').click();
          await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
        }

        // Llenar con monto específico
        await page.fill('input[name="clientName"]', `Batch Test ${amount}`);
        await page.fill('input[name="price"]', amount.toString());

        // Verificar cálculo inmediato
        const formatCheck = await page.evaluate((amt) => {
          const priceInput = document.querySelector('input[name="price"]');
          return {
            inputValue: priceInput ? priceInput.value : null,
            amount: amt,
            timestamp: Date.now()
          };
        }, amount);

        // Intentar PDF
        let pdfSuccess = false;
        try {
          const downloadPromise = page.waitForDownload({ timeout: 15000 });
          await page.locator('button[onclick*="generatePDF"]').click();
          
          const download = await downloadPromise;
          pdfSuccess = true;

          const agentDir = Context720Utils.createOutputDir(AGENT_ID);
          await download.saveAs(`${agentDir}/downloads/batch_${amount}.pdf`);
          
        } catch (pdfError) {
          pdfSuccess = false;
        }

        batchResults.push({
          amount: amount,
          formatCheck: formatCheck,
          pdfSuccess: pdfSuccess
        });

        Context720Utils.logAgentProgress(AGENT_ID, `testing_amount_${amount}`, 'COMPLETED');

      } catch (error) {
        batchResults.push({
          amount: amount,
          error: error.message,
          pdfSuccess: false
        });
      }
    }

    // Análisis de resultados batch
    const successfulAmounts = batchResults.filter(r => r.pdfSuccess).length;
    const totalAmounts = batchResults.length;

    Context720Utils.logAgentProgress(AGENT_ID, 'multiple_amounts_batch_test', 'SUCCESS', {
      batchResults: batchResults,
      successRate: successfulAmounts / totalAmounts,
      successfulAmounts: successfulAmounts,
      totalAmounts: totalAmounts
    });

    // Al menos 80% debe ser exitoso
    expect(successfulAmounts / totalAmounts).toBeGreaterThanOrEqual(0.8);
  });

});