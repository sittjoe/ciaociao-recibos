// tests/context7/context7-production-test.spec.js
// Comprehensive Context7 + Playwright Test for PDF Generation
// Tests the production site with real authentication and Veronica Mancilla Gonzalez receipt

import { test, expect } from '@playwright/test';
import { Context7Config, Context7Utils } from './context7.config.js';
import { PDFPageCounter } from '../utilities/pdf-page-counter.js';
import { ScalingCalculator } from '../utilities/scaling-calculator.js';
import path from 'path';
import fs from 'fs';

// Test data for Veronica case
const VERONICA_DATA = {
  name: 'Veronica Mancilla gonzalez',
  phone: '55 2690 5104',
  email: 'vermango13@yahoo.com.mx',
  type: 'pulsera',
  material: 'oro-14k',
  weight: '12',
  stones: 'ZAFIRO 5.15 cts',
  description: 'Pulsera de oro blanco con zafiro central',
  price: 39150,
  contribution: 39150,
  deposit: 0,
  deliveryStatus: 'entregado'
};

test.describe('Context7 Production PDF Generation Tests', () => {
  let testId;
  let downloadPath;
  let pdfPageCounter;
  let scalingCalculator;
  let consoleLogs = [];

  test.beforeEach(async ({ page }) => {
    // Initialize test utilities
    testId = Context7Utils.generateTestId();
    downloadPath = Context7Utils.createDownloadPath(testId);
    pdfPageCounter = new PDFPageCounter();
    scalingCalculator = new ScalingCalculator();
    consoleLogs = [];

    // Create download directory
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // Set up download handling
    page.on('download', async download => {
      const filename = download.suggestedFilename();
      const downloadFilePath = path.join(downloadPath, filename);
      await download.saveAs(downloadFilePath);
      Context7Utils.log(`PDF downloaded: ${downloadFilePath}`);
    });

    // Capture console logs for debugging scaling calculations
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()
      };
      consoleLogs.push(logEntry);
      
      // Log scaling-related messages
      if (msg.text().includes('scaling') || 
          msg.text().includes('canvas') || 
          msg.text().includes('PDF') ||
          msg.text().includes('dimension')) {
        Context7Utils.log(`SCALING LOG [${msg.type()}]: ${msg.text()}`);
      }
    });

    // Set up performance monitoring
    await page.route('**/*', route => {
      const request = route.request();
      if (request.url().includes('.js') || request.url().includes('.css')) {
        const startTime = Date.now();
        route.continue().then(() => {
          const loadTime = Date.now() - startTime;
          if (loadTime > 2000) {
            Context7Utils.log(`Slow resource load: ${request.url()} (${loadTime}ms)`);
          }
        });
      } else {
        route.continue();
      }
    });
  });

  test('Veronica Mancilla Gonzalez Receipt - Single Page PDF Generation', async ({ page }) => {
    Context7Utils.log('Starting Veronica receipt test', { testId, downloadPath });

    // Step 1: Navigate to production site
    await Context7Utils.takeDebugScreenshot(page, testId, '01-before-navigation');
    
    const navigationStart = Date.now();
    await page.goto(Context7Config.environment.productionURL, { 
      waitUntil: 'networkidle',
      timeout: Context7Config.performance.maxPageLoadTime 
    });
    const navigationTime = Date.now() - navigationStart;
    
    Context7Utils.log(`Navigation completed in ${navigationTime}ms`);
    await Context7Utils.takeDebugScreenshot(page, testId, '02-after-navigation');

    // Step 2: Handle authentication
    await Context7Utils.takeDebugScreenshot(page, testId, '03-before-auth');
    
    // Look for password input
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[placeholder*="contraseña"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    
    await passwordInput.fill(Context7Config.environment.password);
    await passwordInput.press('Enter');
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle');
    await Context7Utils.takeDebugScreenshot(page, testId, '04-after-auth');
    
    Context7Utils.log('Authentication completed');

    // Step 3: Wait for receipt form to be available
    await page.waitForSelector('input[placeholder*="Cliente"], input[placeholder*="Nombre"]', { 
      timeout: 15000 
    });
    await Context7Utils.takeDebugScreenshot(page, testId, '05-form-ready');

    // Step 4: Fill out Veronica's receipt data
    Context7Utils.log('Filling out Veronica receipt data');
    
    const formFillStart = Date.now();

    // Fill client information
    await page.fill('input[placeholder*="Cliente"], input[placeholder*="Nombre"]', VERONICA_DATA.name);
    await page.fill('input[placeholder*="Teléfono"], input[placeholder*="Tel"]', VERONICA_DATA.phone);
    await page.fill('input[placeholder*="Email"], input[placeholder*="Correo"]', VERONICA_DATA.email);

    // Fill product information
    await page.selectOption('select:has-text("Tipo"), select[name*="tipo"]', VERONICA_DATA.type);
    await page.selectOption('select:has-text("Material"), select[name*="material"]', VERONICA_DATA.material);
    await page.fill('input[placeholder*="Peso"], input[name*="peso"]', VERONICA_DATA.weight);
    await page.fill('input[placeholder*="Piedras"], textarea[placeholder*="Piedras"]', VERONICA_DATA.stones);
    await page.fill('textarea[placeholder*="Descripción"], textarea[name*="descripcion"]', VERONICA_DATA.description);

    // Fill financial information
    await page.fill('input[placeholder*="Precio"], input[name*="precio"]', VERONICA_DATA.price.toString());
    await page.fill('input[placeholder*="Aporte"], input[name*="aporte"]', VERONICA_DATA.contribution.toString());
    await page.fill('input[placeholder*="Anticipo"], input[name*="anticipo"]', VERONICA_DATA.deposit.toString());
    
    // Set delivery status
    await page.selectOption('select:has-text("Estado"), select[name*="estado"]', VERONICA_DATA.deliveryStatus);

    const formFillTime = Date.now() - formFillStart;
    Context7Utils.log(`Form filled in ${formFillTime}ms`);
    
    await Context7Utils.takeDebugScreenshot(page, testId, '06-form-filled');

    // Step 5: Capture canvas dimensions and scaling calculations before PDF generation
    await page.evaluate(() => {
      console.log('=== CANVAS SCALING DEBUG START ===');
      
      // Find all canvas elements
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((canvas, index) => {
        console.log(`Canvas ${index}:`, {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
          offsetWidth: canvas.offsetWidth,
          offsetHeight: canvas.offsetHeight,
          style: canvas.style.cssText
        });
      });

      // Check for any scaling-related variables in window
      if (window.scalingDebug) {
        console.log('Scaling Debug Info:', window.scalingDebug);
      }

      console.log('=== CANVAS SCALING DEBUG END ===');
    });

    // Step 6: Generate PDF with detailed monitoring
    Context7Utils.log('Generating PDF...');
    
    const pdfGenerationStart = Date.now();
    await Context7Utils.takeDebugScreenshot(page, testId, '07-before-pdf-generation');

    // Click PDF generation button
    const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Generar"), button[onclick*="pdf"], button[class*="pdf"]');
    await expect(pdfButton).toBeVisible({ timeout: 5000 });
    
    await pdfButton.click();
    
    // Wait for PDF to be generated and downloaded
    const downloadPromise = page.waitForEvent('download', { 
      timeout: Context7Config.performance.maxPDFGenerationTime 
    });
    
    const download = await downloadPromise;
    const pdfGenerationTime = Date.now() - pdfGenerationStart;
    
    Context7Utils.log(`PDF generation completed in ${pdfGenerationTime}ms`);
    await Context7Utils.takeDebugScreenshot(page, testId, '08-after-pdf-generation');

    // Step 7: Save and analyze the PDF
    const pdfFilename = download.suggestedFilename() || `veronica-receipt-${testId}.pdf`;
    const pdfPath = path.join(downloadPath, pdfFilename);
    await download.saveAs(pdfPath);
    
    Context7Utils.log(`PDF saved: ${pdfPath}`);

    // Step 8: Validate PDF file exists and has content
    expect(fs.existsSync(pdfPath)).toBeTruthy();
    const pdfStats = fs.statSync(pdfPath);
    expect(pdfStats.size).toBeGreaterThan(Context7Config.pdf.minFileSize);
    expect(pdfStats.size).toBeLessThan(Context7Config.pdf.maxFileSize);
    
    Context7Utils.log(`PDF file size: ${pdfStats.size} bytes`);

    // Step 9: Analyze PDF structure and count pages
    const pdfAnalysis = await pdfPageCounter.analyzePDFStructure(pdfPath);
    
    Context7Utils.log('PDF Analysis Results:', {
      pageCount: pdfAnalysis.pageCount,
      fileSize: pdfAnalysis.fileSize,
      structure: pdfAnalysis.structure,
      issues: pdfAnalysis.issues.length
    });

    // Step 10: Assert single page requirement
    expect(pdfAnalysis.pageCount).toBe(1);
    
    if (pdfAnalysis.pageCount !== 1) {
      // Generate detailed error report
      const errorReport = {
        testId,
        timestamp: new Date().toISOString(),
        expectedPages: 1,
        actualPages: pdfAnalysis.pageCount,
        fileSize: pdfAnalysis.fileSize,
        structure: pdfAnalysis.structure,
        issues: pdfAnalysis.issues,
        consoleLogs: consoleLogs.filter(log => 
          log.text.includes('scaling') || 
          log.text.includes('canvas') || 
          log.text.includes('PDF')
        ),
        formData: VERONICA_DATA,
        timings: {
          navigation: navigationTime,
          formFill: formFillTime,
          pdfGeneration: pdfGenerationTime
        }
      };

      // Save error report
      const errorReportPath = path.join(downloadPath, `error-report-${testId}.json`);
      fs.writeFileSync(errorReportPath, JSON.stringify(errorReport, null, 2));
      
      throw new Error(`PDF contains ${pdfAnalysis.pageCount} pages instead of 1. Error report saved: ${errorReportPath}`);
    }

    // Step 11: Performance validation
    expect(navigationTime).toBeLessThan(Context7Config.performance.maxPageLoadTime);
    expect(formFillTime).toBeLessThan(Context7Config.performance.maxFormFillTime);
    expect(pdfGenerationTime).toBeLessThan(Context7Config.performance.maxPDFGenerationTime);

    // Step 12: Content validation (basic)
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfContent = pdfBuffer.toString('latin1');
    
    // Check for required content in PDF
    expect(pdfContent).toContain('CIAOCIAO.MX');
    expect(pdfContent).toContain('Veronica Mancilla');
    expect(pdfContent).toContain('ZAFIRO 5.15 cts');
    expect(pdfContent).toContain('39150');

    Context7Utils.log('Test completed successfully - Single page PDF validated');

    // Step 13: Generate test report
    const testReport = {
      testId,
      status: 'PASSED',
      timestamp: new Date().toISOString(),
      pdfAnalysis,
      performance: {
        navigation: navigationTime,
        formFill: formFillTime,
        pdfGeneration: pdfGenerationTime
      },
      validation: {
        pageCount: pdfAnalysis.pageCount === 1,
        fileSize: pdfStats.size,
        contentValid: true
      },
      scalingLogs: consoleLogs.filter(log => 
        log.text.includes('scaling') || 
        log.text.includes('canvas') || 
        log.text.includes('PDF')
      )
    };

    const reportPath = path.join(downloadPath, `test-report-${testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    
    Context7Utils.log(`Test report saved: ${reportPath}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Save final screenshot
    await Context7Utils.takeDebugScreenshot(page, testId, '99-final-state');
    
    // Save console logs
    const logsPath = path.join(downloadPath, `console-logs-${testId}.json`);
    fs.writeFileSync(logsPath, JSON.stringify(consoleLogs, null, 2));
    
    // Clean up if test passed and cleanup is enabled
    if (testInfo.status === 'passed' && !Context7Config.debug.verbose) {
      // Optional: Clean up screenshots and logs for passed tests
      Context7Utils.log('Test passed - keeping artifacts for analysis');
    }
    
    Context7Utils.log(`Test completed: ${testInfo.status}`, { 
      testId, 
      duration: testInfo.duration,
      downloadPath 
    });
  });
});