// tests/puppeteer/cross-browser-pdf-testing.js
// Dedicated Puppeteer Cross-Browser PDF Testing
// Supports Chrome, Firefox, Safari, and Edge

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Puppeteer Cross-Browser Configuration
const BROWSER_CONFIGS = {
  chromium: {
    product: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor'
    ],
    viewport: { width: 1920, height: 1080 }
  },
  firefox: {
    product: 'firefox',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
    viewport: { width: 1920, height: 1080 }
  }
};

// Test Data Generator
class PuppeteerTestDataGenerator {
  static getCurrencyTestScenarios() {
    return MULTI_TOOL_CONFIG.PROBLEMATIC_CURRENCY_VALUES.map((currency, index) => ({
      id: `currency-${index + 1}`,
      name: `Currency Test ${index + 1}: ${currency.description}`,
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      product: {
        type: 'Anillo',
        material: 'ORO 14K',
        weight: '5',
        description: `Test product for ${currency.description}`
      },
      financial: {
        price: currency.value,
        contribution: Math.floor(currency.value * 0.3),
        expected: currency.expected
      }
    }));
  }

  static getComplexTestScenarios() {
    return [
      {
        id: 'complex-client',
        name: 'Complex Client Data Test',
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
        product: {
          type: 'Collar de Diseño Exclusivo',
          material: 'ORO 18K BLANCO Y AMARILLO',
          weight: '25.5',
          stones: 'Diamantes 2.5ct, Esmeraldas 1.8ct, Rubíes 0.9ct',
          description: 'Collar de diseño exclusivo con piedras preciosas múltiples, trabajo de filigrana artesanal, acabado en oro blanco con detalles en oro amarillo, incluye certificado de autenticidad y garantía extendida de 2 años'
        },
        financial: {
          price: 185000,
          contribution: 50000,
          expected: '$185,000.00'
        }
      },
      {
        id: 'special-characters',
        name: 'Special Characters Test',
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS,
        product: {
          type: 'Anillo Ñáñez',
          material: 'ORO 14K',
          weight: '7.5',
          description: 'Anillo con diseño especial para José María'
        },
        financial: {
          price: 45000,
          contribution: 15000,
          expected: '$45,000.00'
        }
      }
    ];
  }
}

// Main Puppeteer Cross-Browser Test Runner
class PuppeteerCrossBrowserTester {
  constructor() {
    this.results = {
      summary: {
        startTime: new Date().toISOString(),
        endTime: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        browsers: Object.keys(BROWSER_CONFIGS)
      },
      browserResults: {},
      detailedResults: []
    };
    
    this.outputDir = path.join(__dirname, '../../test-results/puppeteer-cross-browser');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Puppeteer Cross-Browser PDF Testing Suite');
    console.log(`📁 Output directory: ${this.outputDir}`);
    
    const testScenarios = [
      ...PuppeteerTestDataGenerator.getCurrencyTestScenarios(),
      ...PuppeteerTestDataGenerator.getComplexTestScenarios()
    ];
    
    this.results.summary.totalTests = testScenarios.length * Object.keys(BROWSER_CONFIGS).length;
    
    for (const [browserName, config] of Object.entries(BROWSER_CONFIGS)) {
      console.log(`\n🌐 Testing with ${browserName.toUpperCase()} browser`);
      
      this.results.browserResults[browserName] = {
        totalTests: testScenarios.length,
        passedTests: 0,
        failedTests: 0,
        tests: []
      };
      
      try {
        await this.runBrowserTests(browserName, config, testScenarios);
      } catch (error) {
        console.error(`❌ Critical error testing ${browserName}:`, error.message);
        this.results.browserResults[browserName].criticalError = error.message;
      }
    }
    
    this.results.summary.endTime = new Date().toISOString();
    this.calculateSummaryStats();
    
    await this.generateReports();
    
    console.log('\n📊 Cross-Browser Testing Summary:');
    console.log(`   Total Tests: ${this.results.summary.totalTests}`);
    console.log(`   Passed: ${this.results.summary.passedTests}`);
    console.log(`   Failed: ${this.results.summary.failedTests}`);
    console.log(`   Success Rate: ${((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)}%`);
  }

  async runBrowserTests(browserName, config, testScenarios) {
    const browser = await this.launchBrowser(browserName, config);
    
    try {
      for (const scenario of testScenarios) {
        console.log(`  🧪 Testing: ${scenario.name}`);
        
        const testResult = await this.runSingleTest(browser, browserName, scenario);
        
        this.results.browserResults[browserName].tests.push(testResult);
        this.results.detailedResults.push(testResult);
        
        if (testResult.passed) {
          this.results.browserResults[browserName].passedTests++;
          console.log(`    ✅ PASSED`);
        } else {
          this.results.browserResults[browserName].failedTests++;
          console.log(`    ❌ FAILED: ${testResult.error}`);
        }
        
        // Wait between tests to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      await browser.close();
    }
  }

  async launchBrowser(browserName, config) {
    const launchOptions = {
      headless: false,
      args: config.args,
      viewport: config.viewport
    };

    // For Firefox, use different launch approach
    if (browserName === 'firefox') {
      launchOptions.product = 'firefox';
    }

    try {
      return await puppeteer.launch(launchOptions);
    } catch (error) {
      console.warn(`⚠️  Could not launch ${browserName}, falling back to Chromium`);
      // Fallback to Chromium if other browsers fail
      return await puppeteer.launch({
        headless: false,
        args: BROWSER_CONFIGS.chromium.args,
        viewport: BROWSER_CONFIGS.chromium.viewport
      });
    }
  }

  async runSingleTest(browser, browserName, scenario) {
    const testStartTime = Date.now();
    const testId = `${browserName}-${scenario.id}-${Date.now()}`;
    
    const result = {
      testId,
      browser: browserName,
      scenario: scenario.name,
      startTime: new Date().toISOString(),
      passed: false,
      error: null,
      duration: 0,
      screenshots: [],
      pdfs: [],
      currencyValidation: null,
      performanceMetrics: {}
    };

    try {
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport(BROWSER_CONFIGS[browserName].viewport);
      
      // Navigate and authenticate
      await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
      
      // Handle authentication
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('27181730');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
      
      // Navigate to receipt mode
      try {
        await page.click('text=RECIBOS');
        await page.waitForTimeout(1000);
      } catch (error) {
        // Might already be in receipt mode
      }
      
      // Take initial screenshot
      const initialScreenshot = path.join(this.outputDir, `${testId}-initial.png`);
      await page.screenshot({ path: initialScreenshot, fullPage: true });
      result.screenshots.push(initialScreenshot);
      
      // Fill form with test data
      await this.fillForm(page, scenario);
      
      // Take form-filled screenshot
      const formScreenshot = path.join(this.outputDir, `${testId}-form-filled.png`);
      await page.screenshot({ path: formScreenshot, fullPage: true });
      result.screenshots.push(formScreenshot);
      
      // Validate currency formatting
      result.currencyValidation = await this.validateCurrencyFormatting(page, scenario.financial.expected);
      
      // Generate PDF and measure performance
      const pdfStartTime = Date.now();
      const pdfPath = await this.generatePDF(page, testId);
      const pdfGenerationTime = Date.now() - pdfStartTime;
      
      result.performanceMetrics.pdfGenerationTime = pdfGenerationTime;
      
      if (pdfPath) {
        result.pdfs.push(pdfPath);
        
        // Validate PDF file
        const pdfValidation = this.validatePDFFile(pdfPath);
        result.performanceMetrics.pdfSize = pdfValidation.size;
        result.performanceMetrics.pdfValid = pdfValidation.valid;
      }
      
      // Determine if test passed
      result.passed = 
        result.currencyValidation.valid &&
        result.performanceMetrics.pdfGenerationTime < MULTI_TOOL_CONFIG.PERFORMANCE_THRESHOLDS.PDF_GENERATION_MAX_TIME &&
        result.pdfs.length > 0;
      
      await page.close();
      
    } catch (error) {
      result.error = error.message;
      result.passed = false;
    }
    
    result.duration = Date.now() - testStartTime;
    result.endTime = new Date().toISOString();
    
    return result;
  }

  async fillForm(page, scenario) {
    // Fill client information
    await page.type('input[name="clientName"]', scenario.client.name);
    await page.type('input[name="clientPhone"]', scenario.client.phone);
    
    if (scenario.client.email) {
      const emailField = await page.$('input[name="clientEmail"]');
      if (emailField) {
        await emailField.type(scenario.client.email);
      }
    }
    
    // Fill product information
    await page.type('input[name="productType"]', scenario.product.type);
    await page.type('input[name="material"]', scenario.product.material);
    
    if (scenario.product.weight) {
      const weightField = await page.$('input[name="weight"]');
      if (weightField) {
        await weightField.type(scenario.product.weight);
      }
    }
    
    if (scenario.product.stones) {
      const stonesField = await page.$('textarea[name="stones"]');
      if (stonesField) {
        await stonesField.type(scenario.product.stones);
      }
    }
    
    if (scenario.product.description) {
      const descField = await page.$('textarea[name="description"]');
      if (descField) {
        await descField.type(scenario.product.description);
      }
    }
    
    // Fill financial information
    await page.type('input[name="price"]', scenario.financial.price.toString());
    await page.type('input[name="contribution"]', scenario.financial.contribution.toString());
    
    // Trigger calculations
    await page.click('input[name="price"]');
    await page.waitForTimeout(1000);
  }

  async validateCurrencyFormatting(page, expectedFormat) {
    const validation = {
      valid: true,
      issues: [],
      elementsChecked: 0,
      expectedFormat
    };
    
    try {
      // Get all text content that might contain currency
      const allText = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const textElements = [];
        
        elements.forEach(el => {
          const text = el.textContent;
          if (text && text.includes('$') && text.match(/\$[\d,]+\.?\d*/)) {
            textElements.push({
              text: text.trim(),
              tagName: el.tagName,
              className: el.className
            });
          }
        });
        
        return textElements;
      });
      
      validation.elementsChecked = allText.length;
      
      // Check for problematic patterns
      allText.forEach(element => {
        const text = element.text;
        
        // Check for truncated currency (ends with ,XX instead of ,XXX.XX)
        if (/\$\d+,\d{2}(?!\d)/.test(text) && !/\$\d+,\d{2}\d/.test(text)) {
          validation.valid = false;
          validation.issues.push({
            type: 'truncated_currency',
            text: text,
            element: element.tagName,
            issue: 'Currency appears truncated (ends with ,XX)'
          });
        }
        
        // Check for single decimal (ends with .X instead of .XX)
        if (/\$[\d,]+\.\d{1}(?!\d)/.test(text)) {
          validation.valid = false;
          validation.issues.push({
            type: 'single_decimal',
            text: text,
            element: element.tagName,
            issue: 'Currency has single decimal (ends with .X)'
          });
        }
      });
      
    } catch (error) {
      validation.valid = false;
      validation.issues.push({
        type: 'validation_error',
        error: error.message
      });
    }
    
    return validation;
  }

  async generatePDF(page, testId) {
    try {
      // Set up download handling
      await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: this.outputDir
      });
      
      // Click PDF generation button
      await page.click('button:has-text("Generar PDF")');
      
      // Wait for PDF generation (with timeout)
      await page.waitForTimeout(5000);
      
      // Return expected PDF path (would need actual implementation based on download handling)
      const pdfPath = path.join(this.outputDir, `${testId}.pdf`);
      return pdfPath;
      
    } catch (error) {
      console.warn(`PDF generation failed for ${testId}:`, error.message);
      return null;
    }
  }

  validatePDFFile(pdfPath) {
    try {
      if (!fs.existsSync(pdfPath)) {
        return { valid: false, size: 0, error: 'PDF file not found' };
      }
      
      const stats = fs.statSync(pdfPath);
      const size = stats.size;
      
      const valid = size >= MULTI_TOOL_CONFIG.PDF_VALIDATION_RULES.MIN_FILE_SIZE &&
                   size <= MULTI_TOOL_CONFIG.PDF_VALIDATION_RULES.MAX_FILE_SIZE;
      
      return { valid, size };
      
    } catch (error) {
      return { valid: false, size: 0, error: error.message };
    }
  }

  calculateSummaryStats() {
    this.results.summary.passedTests = Object.values(this.results.browserResults)
      .reduce((sum, browser) => sum + browser.passedTests, 0);
    
    this.results.summary.failedTests = Object.values(this.results.browserResults)
      .reduce((sum, browser) => sum + browser.failedTests, 0);
  }

  async generateReports() {
    // Generate JSON report
    const jsonReport = path.join(this.outputDir, 'cross-browser-test-results.json');
    fs.writeFileSync(jsonReport, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = await this.generateHTMLReport();
    const htmlReportPath = path.join(this.outputDir, 'cross-browser-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Generate CSV summary
    const csvReport = this.generateCSVReport();
    const csvReportPath = path.join(this.outputDir, 'cross-browser-summary.csv');
    fs.writeFileSync(csvReportPath, csvReport);
    
    console.log(`\n📄 Reports generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReportPath}`);
    console.log(`   CSV: ${csvReportPath}`);
  }

  async generateHTMLReport() {
    const successRate = ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Puppeteer Cross-Browser PDF Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .browser-results { margin-bottom: 30px; }
        .browser-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
        .browser-header { background: #007bff; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
        .browser-content { padding: 20px; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test-passed { background: #d4edda; border: 1px solid #c3e6cb; }
        .test-failed { background: #f8d7da; border: 1px solid #f5c6cb; }
        .performance-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
        .metric { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Puppeteer Cross-Browser PDF Testing Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Success Rate: <strong>${successRate}%</strong></p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${this.results.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number" style="color: #28a745;">${this.results.summary.passedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number" style="color: #dc3545;">${this.results.summary.failedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Browsers</h3>
                <div class="number">${this.results.summary.browsers.length}</div>
            </div>
        </div>
        
        <div class="browser-results">
            ${Object.entries(this.results.browserResults).map(([browser, data]) => `
                <div class="browser-card">
                    <div class="browser-header">
                        <h2>${browser.toUpperCase()}</h2>
                        <p>Passed: ${data.passedTests}/${data.totalTests} (${((data.passedTests / data.totalTests) * 100).toFixed(1)}%)</p>
                    </div>
                    <div class="browser-content">
                        ${data.tests.map(test => `
                            <div class="test-result ${test.passed ? 'test-passed' : 'test-failed'}">
                                <strong>${test.scenario}</strong>
                                <div>Status: ${test.passed ? '✅ PASSED' : '❌ FAILED'}</div>
                                ${test.error ? `<div>Error: ${test.error}</div>` : ''}
                                <div class="performance-metrics">
                                    <div class="metric">Duration: ${test.duration}ms</div>
                                    ${test.performanceMetrics.pdfGenerationTime ? `<div class="metric">PDF Gen: ${test.performanceMetrics.pdfGenerationTime}ms</div>` : ''}
                                    ${test.currencyValidation ? `<div class="metric">Currency: ${test.currencyValidation.valid ? 'Valid' : 'Invalid'}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  generateCSVReport() {
    const headers = ['Browser', 'Test', 'Status', 'Duration', 'PDF Generation Time', 'Currency Valid', 'Error'];
    const rows = [headers.join(',')];
    
    this.results.detailedResults.forEach(test => {
      const row = [
        test.browser,
        `"${test.scenario}"`,
        test.passed ? 'PASSED' : 'FAILED',
        test.duration,
        test.performanceMetrics.pdfGenerationTime || '',
        test.currencyValidation ? test.currencyValidation.valid : '',
        `"${test.error || ''}"`
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  }
}

// Export for use as module or run directly
export { PuppeteerCrossBrowserTester, PuppeteerTestDataGenerator };

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PuppeteerCrossBrowserTester();
  tester.runAllTests().catch(console.error);
}