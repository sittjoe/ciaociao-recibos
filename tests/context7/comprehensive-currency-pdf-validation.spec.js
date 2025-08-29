// tests/context7/comprehensive-currency-pdf-validation.spec.js
// Context7 Advanced PDF Validation with Currency Truncation Detection
// Integrates with Playwright and Puppeteer for comprehensive testing

import { test, expect } from '@playwright/test';
import { Context7Config, Context7Utils } from './context7.config.js';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';
import fs from 'fs';
import path from 'path';

// Import Puppeteer for additional browser testing
import puppeteer from 'puppeteer';

test.describe('Context7 Comprehensive Currency & PDF Validation', () => {
  let testId;
  let downloadPath;
  
  test.beforeEach(async ({ page }) => {
    // Generate unique test ID for this run
    testId = Context7Utils.generateTestId();
    downloadPath = Context7Utils.createDownloadPath(testId);
    
    // Ensure download directory exists
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
    
    Context7Utils.log('Starting Context7 test', { testId, downloadPath });
    
    // Navigate to system and authenticate
    const loadTime = await Context7Utils.measurePageLoadTime(page, Context7Config.environment.baseURL);
    Context7Utils.log('Page loaded', { loadTime });
    
    // Handle authentication
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      await passwordInput.fill(Context7Config.environment.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to receipt mode
    const receiptButton = page.locator('text=RECIBOS');
    if (await receiptButton.isVisible({ timeout: 5000 })) {
      await receiptButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Take initial screenshot
    await Context7Utils.takeDebugScreenshot(page, testId, 'initial-setup');
  });

  // Test each problematic currency value that was causing truncation
  MULTI_TOOL_CONFIG.PROBLEMATIC_CURRENCY_VALUES.forEach((currencyTest, index) => {
    test(`Currency Validation: ${currencyTest.description}`, async ({ page }) => {
      Context7Utils.log('Testing currency value', currencyTest);
      
      // Get test data
      const testData = Context7Utils.getTestData('veronica', 'medium', 'fully_paid');
      testData.price = currencyTest.value;
      testData.contribution = Math.floor(currencyTest.value * 0.3); // 30% contribution
      
      // Fill form with test data
      await fillFormWithTestData(page, testData);
      
      // Wait for currency calculations to complete
      await page.waitForTimeout(1000);
      
      // Validate currency formatting in HTML elements BEFORE PDF generation
      const htmlValidation = await validateCurrencyInHTML(page, currencyTest);
      expect(htmlValidation.valid).toBe(true);
      
      // Take screenshot of form state
      await Context7Utils.takeDebugScreenshot(page, testId, `form-filled-${index}`);
      
      // Generate and validate PDF
      const pdfValidation = await generateAndValidatePDF(page, testData, currencyTest);
      expect(pdfValidation.valid).toBe(true);
      
      Context7Utils.log('Currency test completed successfully', { 
        testData, 
        htmlValidation, 
        pdfValidation 
      });
    });
  });

  test('Context7 Multi-Browser Currency Validation with Puppeteer', async ({ page }) => {
    Context7Utils.log('Starting multi-browser validation with Puppeteer integration');
    
    const testData = Context7Utils.getTestData('veronica', 'complex', 'partial_payment');
    testData.price = 119900; // Previously problematic value
    testData.contribution = 25000;
    
    // Test in current Playwright browser first
    await fillFormWithTestData(page, testData);
    const playwrightValidation = await validateCurrencyInHTML(page, {
      value: testData.price,
      expected: '$119,900.00'
    });
    
    // Launch Puppeteer for additional browser testing
    const puppeteerResults = await runPuppeteerCurrencyTests(testData);
    
    // Compare results across browsers
    const validationSummary = {
      playwright: playwrightValidation,
      puppeteer: puppeteerResults,
      consistent: playwrightValidation.valid && puppeteerResults.every(r => r.valid)
    };
    
    Context7Utils.log('Multi-browser validation completed', validationSummary);
    expect(validationSummary.consistent).toBe(true);
  });

  test('Context7 Performance Benchmark: PDF Generation Speed', async ({ page }) => {
    Context7Utils.log('Starting PDF generation performance benchmark');
    
    const testData = Context7Utils.getTestData('testShort', 'simple', 'fully_paid');
    testData.price = 50000;
    testData.contribution = 25000;
    
    await fillFormWithTestData(page, testData);
    
    // Measure PDF generation time
    const startTime = Date.now();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { 
      timeout: MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME 
    });
    
    // Generate PDF
    await page.click('button:has-text("Generar PDF")');
    
    const download = await downloadPromise;
    const generationTime = Date.now() - startTime;
    
    // Save PDF for validation
    const pdfPath = path.join(downloadPath, 'performance-test.pdf');
    await download.saveAs(pdfPath);
    
    // Validate generation time
    expect(generationTime).toBeLessThan(MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME);
    
    // Validate file properties
    const fileValidation = Context7Utils.validatePDFSize(pdfPath);
    expect(fileValidation.valid).toBe(true);
    
    Context7Utils.log('Performance benchmark completed', {
      generationTime,
      threshold: MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME,
      fileSize: fileValidation.size,
      passed: generationTime < MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME
    });
  });

  test('Context7 Visual Design Validation', async ({ page }) => {
    Context7Utils.log('Starting visual design validation');
    
    const testData = Context7Utils.getTestData('complex', 'complex', 'veronica_case');
    await fillFormWithTestData(page, testData);
    
    // Open preview for visual validation
    await page.click('button:has-text("Vista Previa")');
    await page.waitForSelector('#previewModal', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    // Validate all design elements are present
    const designValidation = {
      elementsFound: 0,
      elementsMissing: [],
      elementsPresent: []
    };
    
    for (const element of MULTI_TOOL_CONFIG.DESIGN_ELEMENTS) {
      try {
        const isVisible = await page.isVisible(element, { timeout: 2000 });
        if (isVisible) {
          designValidation.elementsFound++;
          designValidation.elementsPresent.push(element);
        } else {
          designValidation.elementsMissing.push(element);
        }
      } catch (error) {
        designValidation.elementsMissing.push(element);
      }
    }
    
    // Take screenshot of current design
    await Context7Utils.takeDebugScreenshot(page, testId, 'visual-design-preview');
    
    // Validate sufficient design elements are present
    const designSuccessRate = designValidation.elementsFound / MULTI_TOOL_CONFIG.DESIGN_ELEMENTS.length;
    expect(designSuccessRate).toBeGreaterThan(0.7); // At least 70% of elements should be present
    
    // Close preview
    await page.click('button:has-text("Cerrar")');
    
    Context7Utils.log('Visual design validation completed', {
      ...designValidation,
      successRate: designSuccessRate
    });
  });

  test('Context7 Stress Test: Multiple Rapid PDF Generations', async ({ page }) => {
    Context7Utils.log('Starting stress test with multiple rapid PDF generations');
    
    const stressTestResults = [];
    const rapidTestCount = 3;
    
    for (let i = 0; i < rapidTestCount; i++) {
      Context7Utils.log(`Stress test iteration ${i + 1}/${rapidTestCount}`);
      
      const testData = Context7Utils.getTestData('testShort', 'medium', 'fully_paid');
      testData.price = 25000 + (i * 5000); // Vary prices
      testData.contribution = 10000 + (i * 2000);
      
      const iterationStart = Date.now();
      
      // Clear form and fill with new data
      await clearFormFields(page);
      await fillFormWithTestData(page, testData);
      
      // Generate PDF
      const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
      await page.click('button:has-text("Generar PDF")');
      
      try {
        const download = await downloadPromise;
        const iterationTime = Date.now() - iterationStart;
        
        const pdfPath = path.join(downloadPath, `stress-test-${i + 1}.pdf`);
        await download.saveAs(pdfPath);
        
        const fileValidation = Context7Utils.validatePDFSize(pdfPath);
        
        stressTestResults.push({
          iteration: i + 1,
          success: true,
          time: iterationTime,
          fileSize: fileValidation.size,
          price: testData.price
        });
        
        Context7Utils.log(`Stress test iteration ${i + 1} completed`, {
          time: iterationTime,
          fileSize: fileValidation.size
        });
        
      } catch (error) {
        stressTestResults.push({
          iteration: i + 1,
          success: false,
          error: error.message,
          price: testData.price
        });
        
        Context7Utils.log(`Stress test iteration ${i + 1} failed`, { error: error.message });
      }
      
      // Wait between iterations to prevent overwhelming the system
      await page.waitForTimeout(1000);
    }
    
    // Analyze stress test results
    const successfulTests = stressTestResults.filter(r => r.success).length;
    const averageTime = stressTestResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.time, 0) / successfulTests;
    
    const stressSummary = {
      totalTests: rapidTestCount,
      successful: successfulTests,
      failed: rapidTestCount - successfulTests,
      successRate: successfulTests / rapidTestCount,
      averageTime,
      results: stressTestResults
    };
    
    Context7Utils.log('Stress test completed', stressSummary);
    
    // Expect at least 80% success rate
    expect(stressSummary.successRate).toBeGreaterThanOrEqual(0.8);
    
    // Expect average time to be reasonable
    if (successfulTests > 0) {
      expect(averageTime).toBeLessThan(MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME * 1.5);
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Capture final screenshot if test failed
    if (testInfo.status !== 'passed') {
      await Context7Utils.takeDebugScreenshot(page, testId, 'test-failure');
    }
    
    // Generate test report
    const reportPath = path.join(downloadPath, 'test-report.json');
    const report = {
      testId,
      testName: testInfo.title,
      status: testInfo.status,
      duration: testInfo.duration,
      timestamp: new Date().toISOString(),
      downloadPath,
      errors: testInfo.errors
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    Context7Utils.log('Test completed', report);
  });
});

// Helper functions for Context7 testing

async function fillFormWithTestData(page, testData) {
  Context7Utils.log('Filling form with test data', testData);
  
  // Fill client information
  await page.fill('input[name="clientName"]', testData.name);
  await page.fill('input[name="clientPhone"]', testData.phone);
  if (testData.email) {
    await page.fill('input[name="clientEmail"]', testData.email);
  }
  
  // Fill product information
  await page.fill('input[name="productType"]', testData.type || 'Anillo');
  await page.fill('input[name="material"]', testData.material || 'ORO 14K');
  if (testData.weight) {
    await page.fill('input[name="weight"]', testData.weight.toString());
  }
  if (testData.stones) {
    await page.fill('textarea[name="stones"]', testData.stones);
  }
  if (testData.description) {
    await page.fill('textarea[name="description"]', testData.description);
  }
  
  // Fill financial information
  await page.fill('input[name="price"]', testData.price.toString());
  await page.fill('input[name="contribution"]', testData.contribution.toString());
  
  // Trigger calculations by focusing and blurring fields
  await page.click('input[name="price"]');
  await page.click('input[name="contribution"]');
  
  Context7Utils.log('Form filled successfully');
}

async function clearFormFields(page) {
  const fields = [
    'input[name="clientName"]',
    'input[name="clientPhone"]', 
    'input[name="clientEmail"]',
    'input[name="productType"]',
    'input[name="material"]',
    'input[name="weight"]',
    'textarea[name="stones"]',
    'textarea[name="description"]',
    'input[name="price"]',
    'input[name="contribution"]'
  ];
  
  for (const field of fields) {
    try {
      await page.fill(field, '');
    } catch (error) {
      // Field might not exist, continue
    }
  }
}

async function validateCurrencyInHTML(page, currencyTest) {
  Context7Utils.log('Validating currency in HTML elements', currencyTest);
  
  const validation = {
    valid: true,
    issues: [],
    elementsChecked: 0
  };
  
  // Check all currency elements on the page
  const currencyElements = page.locator('.currency-value, [data-currency="true"], .price, .balance, .subtotal');
  const count = await currencyElements.count();
  
  for (let i = 0; i < count; i++) {
    try {
      const element = currencyElements.nth(i);
      const text = await element.textContent();
      const dataValue = await element.getAttribute('data-value');
      
      validation.elementsChecked++;
      
      if (text && text.includes('$')) {
        // Check for truncation patterns
        const truncatedPattern = /\$\d+,\d{2}(?!\d)/;
        const singleDecimalPattern = /\$[\d,]+\.\d{1}(?!\d)/;
        
        if (truncatedPattern.test(text)) {
          validation.valid = false;
          validation.issues.push({
            element: i,
            text,
            issue: 'Truncated currency (ends with ,XX)',
            dataValue
          });
        }
        
        if (singleDecimalPattern.test(text)) {
          validation.valid = false; 
          validation.issues.push({
            element: i,
            text,
            issue: 'Single decimal currency (ends with .X)',
            dataValue
          });
        }
      }
    } catch (error) {
      // Element might not be accessible, continue
    }
  }
  
  Context7Utils.log('Currency validation completed', validation);
  return validation;
}

async function generateAndValidatePDF(page, testData, currencyTest) {
  Context7Utils.log('Generating and validating PDF');
  
  const downloadPromise = page.waitForEvent('download', { 
    timeout: MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME 
  });
  
  const generateStart = Date.now();
  await page.click('button:has-text("Generar PDF")');
  
  const download = await downloadPromise;
  const generationTime = Date.now() - generateStart;
  
  const pdfPath = path.join(downloadPath, `currency-test-${currencyTest.value}.pdf`);
  await download.saveAs(pdfPath);
  
  // Validate PDF properties
  const fileValidation = Context7Utils.validatePDFSize(pdfPath);
  
  const validation = {
    valid: fileValidation.valid && generationTime < MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME,
    generationTime,
    fileSize: fileValidation.size,
    filePath: pdfPath,
    issues: []
  };
  
  if (generationTime >= MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME) {
    validation.issues.push('PDF generation too slow');
  }
  
  if (!fileValidation.valid) {
    validation.issues.push('PDF file size validation failed');
  }
  
  Context7Utils.log('PDF validation completed', validation);
  return validation;
}

async function runPuppeteerCurrencyTests(testData) {
  Context7Utils.log('Running Puppeteer currency tests');
  
  const results = [];
  const browsers = ['chromium']; // Add more browsers as needed
  
  for (const browserName of browsers) {
    try {
      const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.goto('http://localhost:8080');
      
      // Handle authentication
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('27181730');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
      
      // Navigate to receipt mode
      const receiptButton = await page.$('text=RECIBOS');
      if (receiptButton) {
        await receiptButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Fill form
      await page.type('input[name="clientName"]', testData.name);
      await page.type('input[name="price"]', testData.price.toString());
      await page.type('input[name="contribution"]', testData.contribution.toString());
      
      // Wait for calculations
      await page.waitForTimeout(1000);
      
      // Validate currency formatting
      const currencyElements = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && el.textContent.includes('$'))
          .map(el => el.textContent.trim())
          .filter(text => /\$[\d,]+\.?\d*/.test(text));
      });
      
      const hasProblematicFormats = currencyElements.some(text => 
        /\$\d+,\d{2}(?!\d)/.test(text) || /\$[\d,]+\.\d{1}(?!\d)/.test(text)
      );
      
      results.push({
        browser: browserName,
        valid: !hasProblematicFormats,
        currencyElements,
        issues: hasProblematicFormats ? ['Problematic currency formats detected'] : []
      });
      
      await browser.close();
      
    } catch (error) {
      results.push({
        browser: browserName,
        valid: false,
        error: error.message
      });
    }
  }
  
  Context7Utils.log('Puppeteer currency tests completed', results);
  return results;
}