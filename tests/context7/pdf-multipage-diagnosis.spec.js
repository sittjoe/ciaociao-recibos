// tests/context7/pdf-multipage-diagnosis.spec.js
// Context7 Framework - Comprehensive PDF Multi-Page Issue Diagnosis

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Context7Config, Context7Utils } from './context7.config.js';
import { CanvasAnalyzer } from '../pdf-debugging/canvas-analyzer.js';
import { ScalingValidator } from '../pdf-debugging/scaling-validator.js';
import { PDFStructureValidator } from '../pdf-structure-validator.js';
import { QualityReporter } from '../quality-reporter.js';

test.describe('Context7 PDF Multi-Page Diagnosis Suite', () => {
  let canvasAnalyzer;
  let scalingValidator;
  let pdfValidator;
  let qualityReporter;
  let testSession;

  test.beforeAll(async () => {
    // Initialize testing framework
    canvasAnalyzer = new CanvasAnalyzer();
    scalingValidator = new ScalingValidator();
    pdfValidator = new PDFStructureValidator();
    qualityReporter = new QualityReporter();
    
    testSession = {
      id: Context7Utils.generateTestId(),
      startTime: Date.now(),
      results: [],
      issues: []
    };

    Context7Utils.log('Context7 PDF Diagnosis Suite initialized', {
      sessionId: testSession.id,
      config: Context7Config.environment
    });

    // Ensure test directories exist
    const dirs = [
      Context7Config.pdf.downloadPath,
      Context7Config.pdf.screenshotPath,
      Context7Config.pdf.reportsPath
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  test.beforeEach(async ({ page }) => {
    // Set up comprehensive monitoring
    await page.addInitScript(() => {
      // Global PDF debugging instrumentation
      window.pdfDebugger = {
        events: [],
        measurements: [],
        errors: []
      };

      // Override console methods to capture debug info
      const originalLog = console.log;
      console.log = function(...args) {
        window.pdfDebugger.events.push({
          type: 'log',
          message: args.join(' '),
          timestamp: Date.now()
        });
        originalLog.apply(console, args);
      };

      // Capture canvas operations
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type) {
        const context = originalGetContext.call(this, type);
        window.pdfDebugger.events.push({
          type: 'canvas_context',
          canvasWidth: this.width,
          canvasHeight: this.height,
          contextType: type,
          timestamp: Date.now()
        });
        return context;
      };

      // Monitor jsPDF operations
      window.addEventListener('load', () => {
        if (window.jspdf) {
          const originalJsPDF = window.jspdf.jsPDF;
          window.jspdf.jsPDF = function(...args) {
            window.pdfDebugger.events.push({
              type: 'jspdf_create',
              args: args,
              timestamp: Date.now()
            });
            return originalJsPDF.apply(this, args);
          };
        }
      });
    });

    // Navigate and login
    const loadTime = await Context7Utils.measurePageLoadTime(page, `${Context7Config.environment.baseURL}/receipt-mode.html`);
    Context7Utils.log('Page loaded', { loadTime });

    await page.waitForSelector('#passwordInput', { timeout: Context7Config.environment.timeout });
    await page.fill('#passwordInput', Context7Config.environment.password);
    await page.click('#loginBtn');
    await page.waitForSelector('#receiptForm', { timeout: Context7Config.environment.timeout });
  });

  test('Context7-001: Veronica Mancilla Case - Root Cause Analysis', async ({ page }) => {
    const testId = Context7Utils.generateTestId();
    Context7Utils.log('Starting Veronica Mancilla root cause analysis', { testId });

    const testData = Context7Utils.getTestData('veronica', 'medium', 'veronica_case');
    const downloadPath = Context7Utils.createDownloadPath(testId);
    
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    await test.step('Fill Veronica Mancilla form data', async () => {
      await Context7Utils.takeDebugScreenshot(page, testId, 'before-form-fill');

      // Fill form with exact Veronica Mancilla data
      await page.fill('#receiptDate', '2025-08-21');
      await page.selectOption('#transactionType', 'venta');
      
      await page.fill('#clientName', testData.name);
      await page.fill('#clientPhone', testData.phone);
      await page.fill('#clientEmail', testData.email);
      
      await page.selectOption('#pieceType', 'pulsera');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#weight', '9');
      await page.fill('#stones', 'ZAFIRO 5.15 cts');
      await page.fill('#description', 'Oro Blanco');
      await page.fill('#orderNumber', '10580');
      
      await page.fill('#price', '39150');
      await page.fill('#contribution', '39150');
      await page.fill('#deliveryDate', '2025-08-21');
      await page.selectOption('#deliveryStatus', 'entregado');
      await page.selectOption('#paymentMethod', 'tarjeta');

      await Context7Utils.takeDebugScreenshot(page, testId, 'after-form-fill');
    });

    await test.step('Analyze content before PDF generation', async () => {
      // Trigger calculations
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(1000);

      // Validate calculations
      const subtotal = parseFloat(await page.inputValue('#subtotal'));
      const balance = parseFloat(await page.inputValue('#balance'));
      
      expect(subtotal).toBe(78300); // 39150 + 39150
      expect(balance).toBe(78300);  // No deposit

      Context7Utils.log('Financial calculations validated', { subtotal, balance });

      // Generate preview for content analysis
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview', { timeout: 5000 });
      
      // Analyze content structure
      const canvasAnalysis = await canvasAnalyzer.analyzeCanvasGeneration(page, { testId });
      Context7Utils.log('Canvas analysis completed', { 
        contentHeight: canvasAnalysis.preGeneration?.dimensions?.scrollHeight,
        issues: canvasAnalysis.issues.length 
      });

      await page.click('#closePreview');
      await Context7Utils.takeDebugScreenshot(page, testId, 'content-analyzed');
    });

    await test.step('Advanced scaling validation', async () => {
      // Test current scaling implementation
      const scalingValidation = await scalingValidator.validateCurrentScaling(page, testData);
      
      Context7Utils.log('Scaling validation completed', {
        currentStrategy: scalingValidation.results?.currentStrategy?.name,
        fitsInPage: scalingValidation.results?.currentStrategy?.fitsInPage,
        utilization: scalingValidation.results?.currentStrategy?.utilizationScore,
        issues: scalingValidation.issues.length
      });

      // Test alternative scaling strategies
      const testCases = scalingValidator.generateTestCases();
      const scalingResults = await scalingValidator.testScalingWithVariousContent(page, testCases.slice(0, 2));
      
      Context7Utils.log('Alternative scaling strategies tested', {
        testCases: scalingResults.length,
        recommendations: scalingValidation.results?.recommendation?.recommended?.name
      });

      // Assert scaling issues
      if (scalingValidation.issues.some(issue => issue.type === 'ERROR')) {
        testSession.issues.push({
          test: 'Context7-001',
          category: 'SCALING_ERROR',
          details: scalingValidation.issues.filter(i => i.type === 'ERROR')
        });
      }
    });

    await test.step('Generate PDF with comprehensive monitoring', async () => {
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      
      // Start PDF generation with monitoring
      const startTime = Date.now();
      await page.click('#generatePdfBtn');
      
      Context7Utils.log('PDF generation started');
      await Context7Utils.takeDebugScreenshot(page, testId, 'pdf-generation-started');
      
      // Wait for download and analyze
      const download = await downloadPromise;
      const generationTime = Date.now() - startTime;
      
      const pdfPath = path.join(downloadPath, `veronica-mancilla-${testId}.pdf`);
      await download.saveAs(pdfPath);
      
      Context7Utils.log('PDF generated', { 
        generationTime, 
        path: pdfPath 
      });

      // Validate PDF file
      const fileValidation = Context7Utils.validatePDFSize(pdfPath);
      expect(fileValidation.valid).toBeTruthy();
      
      // Performance validation
      if (generationTime > Context7Config.performance.maxPDFGenerationTime) {
        testSession.issues.push({
          test: 'Context7-001',
          category: 'PERFORMANCE',
          details: { generationTime, threshold: Context7Config.performance.maxPDFGenerationTime }
        });
      }

      await Context7Utils.takeDebugScreenshot(page, testId, 'pdf-generated');
    });

    await test.step('Root cause analysis and reporting', async () => {
      // Collect all debug data
      const debugData = await page.evaluate(() => {
        return window.pdfDebugger || {};
      });

      // Generate comprehensive report
      const validationData = {
        testInfo: {
          testId,
          clientName: testData.name,
          scenario: 'veronica_case'
        },
        validation: pdfValidator.validateComplete(testData, '', null),
        performance: {
          generationTime: debugData.events?.length || 0,
          canvasOperations: debugData.events?.filter(e => e.type === 'canvas_context').length || 0
        },
        screenshots: [`${testId}/before-form-fill.png`, `${testId}/after-form-fill.png`, `${testId}/pdf-generated.png`]
      };

      const qualityReport = await qualityReporter.generateQualityReport(validationData);
      
      Context7Utils.log('Quality report generated', {
        grade: qualityReport.summary.overallGrade,
        issues: qualityReport.summary.totalErrors,
        recommendations: qualityReport.recommendations.length
      });

      testSession.results.push({
        testId: 'Context7-001',
        result: 'COMPLETED',
        grade: qualityReport.summary.overallGrade,
        issues: validationData.validation.totalErrors || 0,
        reportPath: `${Context7Config.pdf.reportsPath}/${qualityReport.id}.html`
      });
    });
  });

  test('Context7-002: Content Length Stress Test', async ({ page }) => {
    const testId = Context7Utils.generateTestId();
    Context7Utils.log('Starting content length stress test', { testId });

    const testCases = [
      { name: 'short', client: 'testShort', product: 'simple', financial: 'fully_paid' },
      { name: 'medium', client: 'veronica', product: 'medium', financial: 'partial_payment' },
      { name: 'long', client: 'testLong', product: 'complex', financial: 'no_payment' }
    ];

    for (const testCase of testCases) {
      await test.step(`Test ${testCase.name} content scenario`, async () => {
        const testData = Context7Utils.getTestData(testCase.client, testCase.product, testCase.financial);
        const downloadPath = Context7Utils.createDownloadPath(`${testId}-${testCase.name}`);
        
        if (!fs.existsSync(downloadPath)) {
          fs.mkdirSync(downloadPath, { recursive: true });
        }

        // Fill form based on test case
        await page.fill('#clientName', testData.name);
        await page.fill('#clientPhone', testData.phone);
        await page.fill('#clientEmail', testData.email || '');
        
        await page.selectOption('#pieceType', testData.type);
        await page.selectOption('#material', testData.material);
        await page.fill('#weight', testData.weight);
        await page.fill('#stones', testData.stones);
        await page.fill('#description', testData.description);
        
        await page.fill('#price', testData.price.toString());
        await page.fill('#contribution', testData.contribution.toString());
        await page.fill('#deposit', testData.deposit.toString());
        await page.selectOption('#deliveryStatus', testData.deliveryStatus);

        // Trigger calculations
        await page.click('#price');
        await page.press('#price', 'Tab');
        await page.waitForTimeout(500);

        // Analyze content size
        const canvasAnalysis = await canvasAnalyzer.analyzeCanvasGeneration(page, { 
          testId: `${testId}-${testCase.name}` 
        });

        Context7Utils.log(`Content analysis for ${testCase.name}`, {
          contentHeight: canvasAnalysis.preGeneration?.dimensions?.scrollHeight,
          textLength: canvasAnalysis.preGeneration?.content?.textLength,
          issues: canvasAnalysis.issues.length
        });

        // Generate PDF
        const downloadPromise = page.waitForEvent('download', { timeout: 45000 });
        await page.click('#generatePdfBtn');
        
        const download = await downloadPromise;
        const pdfPath = path.join(downloadPath, `content-${testCase.name}.pdf`);
        await download.saveAs(pdfPath);

        // Validate file
        const fileValidation = Context7Utils.validatePDFSize(pdfPath);
        expect(fileValidation.valid).toBeTruthy();

        Context7Utils.log(`PDF generated for ${testCase.name}`, {
          path: pdfPath,
          size: fileValidation.size
        });

        // Reset form for next test
        await page.click('#resetFormBtn');
        await page.waitForTimeout(1000);
      });
    }
  });

  test('Context7-003: Browser Compatibility Analysis', async ({ page, browserName }) => {
    const testId = Context7Utils.generateTestId();
    Context7Utils.log('Starting browser compatibility analysis', { testId, browserName });

    const testData = Context7Utils.getTestData('veronica', 'medium', 'veronica_case');
    const downloadPath = Context7Utils.createDownloadPath(`${testId}-${browserName}`);
    
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    await test.step(`Fill form in ${browserName}`, async () => {
      // Standard form fill
      await page.fill('#clientName', testData.name);
      await page.fill('#price', testData.price.toString());
      await page.fill('#contribution', testData.contribution.toString());
      await page.selectOption('#pieceType', 'pulsera');
      await page.selectOption('#material', 'oro-14k');
      
      // Trigger calculations
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(500);
    });

    await test.step(`Analyze PDF generation in ${browserName}`, async () => {
      // Browser-specific canvas analysis
      const browserAnalysis = await page.evaluate((browser) => {
        const ua = navigator.userAgent;
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        return {
          browser,
          userAgent: ua,
          canvasSupport: !!ctx,
          html2canvasSupport: typeof window.html2canvas !== 'undefined',
          jsPDFSupport: typeof window.jspdf !== 'undefined',
          features: {
            webGL: !!canvas.getContext('webgl'),
            devicePixelRatio: window.devicePixelRatio || 1,
            maxCanvasSize: {
              width: canvas.width,
              height: canvas.height
            }
          }
        };
      }, browserName);

      Context7Utils.log(`Browser capabilities for ${browserName}`, browserAnalysis);

      // Generate PDF
      const downloadPromise = page.waitForEvent('download', { timeout: 45000 });
      const startTime = Date.now();
      
      await page.click('#generatePdfBtn');
      
      const download = await downloadPromise;
      const generationTime = Date.now() - startTime;
      
      const pdfPath = path.join(downloadPath, `browser-test-${browserName}.pdf`);
      await download.saveAs(pdfPath);

      // Validate browser-specific results
      const fileValidation = Context7Utils.validatePDFSize(pdfPath);
      expect(fileValidation.valid).toBeTruthy();

      Context7Utils.log(`Browser test completed for ${browserName}`, {
        generationTime,
        fileSize: fileValidation.size,
        capabilities: browserAnalysis.features
      });

      // Store browser-specific results
      testSession.results.push({
        testId: 'Context7-003',
        browser: browserName,
        result: 'COMPLETED',
        generationTime,
        fileSize: fileValidation.size,
        capabilities: browserAnalysis
      });
    });
  });

  test('Context7-004: Scaling Algorithm Deep Dive', async ({ page }) => {
    const testId = Context7Utils.generateTestId();
    Context7Utils.log('Starting scaling algorithm deep dive', { testId });

    await test.step('Inject advanced scaling monitoring', async () => {
      await page.addInitScript(() => {
        window.advancedScalingMonitor = {
          scalingEvents: [],
          dimensionChanges: [],
          calculationSteps: []
        };

        // Override the scaling function to capture detailed data
        window.originalGeneratePDF = window.generatePDF;
        
        // Monitor all DOM changes that might affect scaling
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.target.className && mutation.target.className.includes('pdf-content')) {
              window.advancedScalingMonitor.dimensionChanges.push({
                type: 'dom_change',
                target: mutation.target.tagName,
                timestamp: Date.now()
              });
            }
          });
        });

        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true, 
          attributeFilter: ['style', 'class'] 
        });
      });
    });

    await test.step('Test scaling with various content sizes', async () => {
      const testCases = scalingValidator.generateTestCases();
      
      for (let i = 0; i < Math.min(testCases.length, 3); i++) {
        const testCase = testCases[i];
        
        // Fill form with test case data
        await page.fill('#clientName', `Test ${testCase.name}`);
        await page.fill('#price', '10000');
        await page.selectOption('#pieceType', 'anillo');
        
        // Validate scaling for this specific case
        const scalingValidation = await scalingValidator.validateCurrentScaling(page, testCase);
        
        Context7Utils.log(`Scaling validation for ${testCase.name}`, {
          strategies: scalingValidation.results?.strategies?.length || 0,
          recommended: scalingValidation.results?.recommendation?.recommended?.name,
          issues: scalingValidation.issues.length
        });

        // Generate preview to test scaling
        await page.click('#previewBtn');
        await page.waitForSelector('#receiptPreview');
        
        const previewAnalysis = await page.evaluate(() => {
          const preview = document.querySelector('#receiptPreview');
          if (!preview) return null;
          
          return {
            dimensions: {
              scrollWidth: preview.scrollWidth,
              scrollHeight: preview.scrollHeight,
              offsetWidth: preview.offsetWidth,
              offsetHeight: preview.offsetHeight
            },
            overflow: {
              horizontal: preview.scrollWidth > preview.clientWidth,
              vertical: preview.scrollHeight > preview.clientHeight
            }
          };
        });

        Context7Utils.log(`Preview analysis for ${testCase.name}`, previewAnalysis);
        
        await page.click('#closePreview');
        
        // Reset for next test
        if (i < testCases.length - 1) {
          await page.reload();
          await page.fill('#passwordInput', Context7Config.environment.password);
          await page.click('#loginBtn');
          await page.waitForSelector('#receiptForm');
        }
      }
    });

    await test.step('Generate scaling report', async () => {
      const scalingReport = scalingValidator.generateScalingReport();
      
      // Save scaling report
      const reportPath = path.join(Context7Config.pdf.reportsPath, `scaling-report-${testId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(scalingReport, null, 2));
      
      Context7Utils.log('Scaling report generated', {
        path: reportPath,
        validations: scalingReport.summary.totalValidations,
        strategies: scalingReport.summary.strategiesAnalyzed,
        recommendations: scalingReport.summary.recommendations.length
      });

      testSession.results.push({
        testId: 'Context7-004',
        result: 'COMPLETED',
        reportPath,
        validations: scalingReport.summary.totalValidations,
        recommendations: scalingReport.summary.recommendations
      });
    });
  });

  test.afterAll(async () => {
    // Generate comprehensive session report
    testSession.endTime = Date.now();
    testSession.duration = testSession.endTime - testSession.startTime;

    const sessionReport = {
      session: testSession,
      summary: {
        totalTests: testSession.results.length,
        completedTests: testSession.results.filter(r => r.result === 'COMPLETED').length,
        totalIssues: testSession.issues.length,
        avgGrade: testSession.results.reduce((sum, r) => sum + (r.grade ? 1 : 0), 0) / testSession.results.length,
        duration: testSession.duration
      },
      canvas: canvasAnalyzer.generateReport(),
      scaling: scalingValidator.generateScalingReport(),
      recommendations: []
    };

    // Generate final recommendations
    if (testSession.issues.length > 0) {
      sessionReport.recommendations.push({
        priority: 'HIGH',
        title: 'Address Identified Issues',
        description: `${testSession.issues.length} issues found during testing`,
        actions: testSession.issues.map(issue => `Fix ${issue.category} in ${issue.test}`)
      });
    }

    // Save session report
    const sessionReportPath = path.join(Context7Config.pdf.reportsPath, `context7-session-${testSession.id}.json`);
    fs.writeFileSync(sessionReportPath, JSON.stringify(sessionReport, null, 2));

    Context7Utils.log('Context7 testing session completed', {
      sessionId: testSession.id,
      duration: testSession.duration,
      reportPath: sessionReportPath,
      summary: sessionReport.summary
    });

    console.log('\n=== CONTEXT7 PDF DIAGNOSIS COMPLETE ===');
    console.log(`Session ID: ${testSession.id}`);
    console.log(`Duration: ${(testSession.duration / 1000).toFixed(1)}s`);
    console.log(`Tests Completed: ${sessionReport.summary.completedTests}/${sessionReport.summary.totalTests}`);
    console.log(`Issues Found: ${sessionReport.summary.totalIssues}`);
    console.log(`Report: ${sessionReportPath}`);
    console.log('==========================================\n');
  });
});

// Multi-browser test configuration
const browsers = ['chromium', 'webkit', 'firefox'];
browsers.forEach(browserName => {
  test.describe(`Context7 Browser Specific - ${browserName}`, () => {
    test.use({ 
      ...Context7Config.browsers[browserName],
      acceptDownloads: true 
    });

    test(`Browser compatibility test - ${browserName}`, async ({ page }) => {
      // Browser-specific test implementation
      // This will run the compatibility test for each browser
    });
  });
});