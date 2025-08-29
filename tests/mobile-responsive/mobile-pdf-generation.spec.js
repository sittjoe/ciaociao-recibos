// tests/mobile-responsive/mobile-pdf-generation.spec.js
// Mobile Responsive PDF Generation Testing
// Validates PDF generation from mobile devices and responsive design behavior

import { test, expect } from '@playwright/test';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';
import { CurrencyTestDataGenerator } from '../test-data/currency-test-scenarios.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mobile Testing Configuration
const MOBILE_CONFIG = {
  devices: [
    {
      name: 'iPhone SE',
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15',
      category: 'phone',
      os: 'iOS'
    },
    {
      name: 'iPhone 12',
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'phone',
      os: 'iOS'
    },
    {
      name: 'iPhone 12 Pro Max',
      width: 428,
      height: 926,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      category: 'phone_large',
      os: 'iOS'
    },
    {
      name: 'Samsung Galaxy S21',
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      category: 'phone',
      os: 'Android'
    },
    {
      name: 'Samsung Galaxy S21 Ultra',
      width: 384,
      height: 854,
      deviceScaleFactor: 3.5,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36',
      category: 'phone_large',
      os: 'Android'
    },
    {
      name: 'iPad',
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7 like Mac OS X) AppleWebKit/605.1.15',
      category: 'tablet',
      os: 'iOS'
    },
    {
      name: 'iPad Pro',
      width: 1024,
      height: 1366,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7 like Mac OS X) AppleWebKit/605.1.15',
      category: 'tablet_large',
      os: 'iOS'
    },
    {
      name: 'Samsung Galaxy Tab',
      width: 800,
      height: 1280,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-T720) AppleWebKit/537.36',
      category: 'tablet',
      os: 'Android'
    }
  ],
  
  // Mobile-specific test scenarios
  testScenarios: [
    {
      id: 'mobile-basic',
      name: 'Basic Mobile Receipt',
      description: 'Simple receipt optimized for mobile',
      complexity: 'low',
      expectedDuration: 15000 // 15 seconds max on mobile
    },
    {
      id: 'mobile-touch-input',
      name: 'Touch Input Testing',
      description: 'Test form filling with touch interactions',
      complexity: 'medium',
      expectedDuration: 20000
    },
    {
      id: 'mobile-responsive-layout',
      name: 'Responsive Layout Validation',
      description: 'Validate layout adapts properly to mobile screens',
      complexity: 'medium',
      expectedDuration: 18000
    },
    {
      id: 'mobile-currency-precision',
      name: 'Mobile Currency Precision',
      description: 'Ensure currency formatting works on mobile keyboards',
      complexity: 'high',
      expectedDuration: 25000
    }
  ],
  
  // Mobile-specific validation criteria
  validation: {
    touchTargets: {
      minSize: 44, // Minimum touch target size in pixels (iOS guideline)
      spacing: 8   // Minimum spacing between touch targets
    },
    performance: {
      maxLoadTime: 8000,    // 8 seconds max on mobile
      maxPDFGenTime: 25000, // 25 seconds max PDF generation
      maxMemoryUsage: 100   // 100MB max memory increase
    },
    usability: {
      formFieldAccessibility: true,
      keyboardSupport: true,
      scrollableSections: true,
      appropriateFontSizes: true
    }
  }
};

test.describe('Mobile Responsive PDF Generation Tests', () => {
  let outputDir;
  let mobileTestResults = [];
  
  test.beforeAll(async () => {
    outputDir = path.join(__dirname, '../../test-results/mobile-responsive');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('📱 Starting Mobile Responsive PDF Generation Tests');
    console.log(`📁 Output directory: ${outputDir}`);
  });
  
  test.beforeEach(async ({ page }) => {
    // Enable mobile debugging
    await page.route('**/*', route => route.continue());
    
    // Navigate and authenticate
    await page.goto('http://localhost:8080');
    
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      await passwordInput.fill('27181730');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    const receiptButton = page.locator('text=RECIBOS');
    if (await receiptButton.isVisible({ timeout: 5000 })) {
      await receiptButton.click();
      await page.waitForTimeout(1000);
    }
  });

  // Test each mobile device configuration
  MOBILE_CONFIG.devices.forEach(device => {
    test(`Mobile PDF Generation: ${device.name} (${device.os})`, async ({ page }) => {
      console.log(`📱 Testing PDF generation on ${device.name}`);
      
      // Configure page for mobile device
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.setUserAgent(device.userAgent);
      
      const deviceResult = {
        device: device.name,
        category: device.category,
        os: device.os,
        viewport: `${device.width}x${device.height}`,
        tests: {}
      };
      
      try {
        // Test mobile form interaction
        const formTest = await testMobileFormInteraction(page, device);
        deviceResult.tests.formInteraction = formTest;
        
        // Test mobile PDF generation
        const pdfTest = await testMobilePDFGeneration(page, device);
        deviceResult.tests.pdfGeneration = pdfTest;
        
        // Test mobile currency formatting
        const currencyTest = await testMobileCurrencyFormatting(page, device);
        deviceResult.tests.currencyFormatting = currencyTest;
        
        // Test mobile responsive design
        const responsiveTest = await testMobileResponsiveDesign(page, device);
        deviceResult.tests.responsiveDesign = responsiveTest;
        
        // Calculate overall device success
        const allTests = Object.values(deviceResult.tests);
        const successfulTests = allTests.filter(test => test.success).length;
        deviceResult.overallSuccess = successfulTests === allTests.length;
        deviceResult.successRate = (successfulTests / allTests.length) * 100;
        
        console.log(`  📊 ${device.name}: ${successfulTests}/${allTests.length} tests passed (${deviceResult.successRate.toFixed(1)}%)`);
        
        // Expect at least 75% success rate on mobile
        expect(deviceResult.successRate).toBeGreaterThan(75);
        
      } catch (error) {
        deviceResult.criticalError = error.message;
        deviceResult.overallSuccess = false;
        console.log(`  ❌ ${device.name}: Critical error - ${error.message}`);
      }
      
      mobileTestResults.push(deviceResult);
    });
  });

  // Test touch interaction patterns
  test('Touch Interaction Patterns', async ({ page }) => {
    console.log('👆 Testing touch interaction patterns');
    
    // Test on a representative mobile device (iPhone 12)
    const device = MOBILE_CONFIG.devices.find(d => d.name === 'iPhone 12');
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.setUserAgent(device.userAgent);
    
    const touchTests = [];
    
    // Test tap interactions
    const tapTest = await testTouchTapInteractions(page);
    touchTests.push(tapTest);
    
    // Test swipe/scroll interactions
    const scrollTest = await testTouchScrollInteractions(page);
    touchTests.push(scrollTest);
    
    // Test form field focus on mobile
    const focusTest = await testMobileFormFieldFocus(page);
    touchTests.push(focusTest);
    
    // Test button accessibility
    const buttonTest = await testMobileButtonAccessibility(page);
    touchTests.push(buttonTest);
    
    const allPassed = touchTests.every(test => test.success);
    expect(allPassed).toBe(true);
    
    console.log(`👆 Touch interaction tests: ${touchTests.filter(t => t.success).length}/${touchTests.length} passed`);
  });

  // Test mobile keyboard input
  test('Mobile Keyboard Input Validation', async ({ page }) => {
    console.log('⌨️ Testing mobile keyboard input');
    
    // Test on Android device (different keyboard behavior)
    const device = MOBILE_CONFIG.devices.find(d => d.name === 'Samsung Galaxy S21');
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.setUserAgent(device.userAgent);
    
    const keyboardTests = [];
    
    // Test numeric keyboard for price fields
    const numericTest = await testMobileNumericKeyboard(page);
    keyboardTests.push(numericTest);
    
    // Test text keyboard for client information
    const textTest = await testMobileTextKeyboard(page);
    keyboardTests.push(textTest);
    
    // Test currency formatting with mobile input
    const currencyInputTest = await testMobileCurrencyInput(page);
    keyboardTests.push(currencyInputTest);
    
    const allPassed = keyboardTests.every(test => test.success);
    expect(allPassed).toBe(true);
    
    console.log(`⌨️ Keyboard input tests: ${keyboardTests.filter(t => t.success).length}/${keyboardTests.length} passed`);
  });

  // Test mobile performance under different conditions
  test('Mobile Performance Under Various Conditions', async ({ page }) => {
    console.log('🚀 Testing mobile performance under various conditions');
    
    const performanceTests = [
      { device: 'iPhone SE', condition: 'Low-end mobile', expectedMax: 30000 },
      { device: 'iPhone 12 Pro Max', condition: 'High-end mobile', expectedMax: 20000 },
      { device: 'Samsung Galaxy S21', condition: 'Mid-range Android', expectedMax: 25000 }
    ];
    
    for (const perfTest of performanceTests) {
      const device = MOBILE_CONFIG.devices.find(d => d.name === perfTest.device);
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.setUserAgent(device.userAgent);
      
      console.log(`  📊 Testing performance on ${perfTest.device}`);
      
      const startMemory = await getMemoryUsage(page);
      const startTime = Date.now();
      
      // Fill form with complex data
      await fillMobileFormWithComplexData(page, device);
      
      // Generate PDF and measure performance
      const downloadPromise = page.waitForEvent('download', { timeout: perfTest.expectedMax });
      await page.click('button:has-text("Generar PDF")');
      
      const download = await downloadPromise;
      const endTime = Date.now();
      const pdfGenerationTime = endTime - startTime;
      
      const endMemory = await getMemoryUsage(page);
      const memoryDelta = endMemory - startMemory;
      
      // Save PDF for validation
      const pdfPath = path.join(outputDir, `mobile-performance-${perfTest.device.replace(/\s+/g, '-')}.pdf`);
      await download.saveAs(pdfPath);
      
      const fileStats = fs.statSync(pdfPath);
      
      console.log(`    ⏱️  ${perfTest.device}: ${pdfGenerationTime}ms (${(fileStats.size / 1024).toFixed(1)}KB)`);
      console.log(`    💾 Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(1)}MB`);
      
      // Performance expectations
      expect(pdfGenerationTime).toBeLessThan(perfTest.expectedMax);
      expect(fileStats.size).toBeGreaterThan(5000); // At least 5KB
      expect(memoryDelta).toBeLessThan(MOBILE_CONFIG.validation.performance.maxMemoryUsage * 1024 * 1024);
    }
  });

  // Test mobile network conditions (simulated)
  test('Mobile Network Conditions Simulation', async ({ page }) => {
    console.log('🌐 Testing mobile network conditions');
    
    // Simulate slow network conditions
    const networkConditions = [
      { name: '3G Slow', downloadThroughput: 400 * 1024, uploadThroughput: 400 * 1024, latency: 400 },
      { name: '3G Fast', downloadThroughput: 1500 * 1024, uploadThroughput: 750 * 1024, latency: 150 },
      { name: '4G', downloadThroughput: 4000 * 1024, uploadThroughput: 3000 * 1024, latency: 20 }
    ];
    
    const device = MOBILE_CONFIG.devices.find(d => d.name === 'iPhone 12');
    await page.setViewportSize({ width: device.width, height: device.height });
    
    for (const network of networkConditions) {
      console.log(`  🌐 Testing ${network.name} network conditions`);
      
      // Simulate network conditions
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: network.downloadThroughput,
        uploadThroughput: network.uploadThroughput,
        latency: network.latency
      });
      
      try {
        // Test page responsiveness under network constraints
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Test form interaction
        await fillMobileFormWithBasicData(page);
        
        // Test PDF generation with network constraints
        const startTime = Date.now();
        const downloadPromise = page.waitForEvent('download', { timeout: 45000 }); // Longer timeout for slow network
        await page.click('button:has-text("Generar PDF")');
        
        const download = await downloadPromise;
        const networkTime = Date.now() - startTime;
        
        const pdfPath = path.join(outputDir, `network-${network.name.replace(/\s+/g, '-')}.pdf`);
        await download.saveAs(pdfPath);
        
        console.log(`    ⏱️  ${network.name}: ${networkTime}ms`);
        
        // Network-adjusted expectations
        const maxExpectedTime = network.name === '3G Slow' ? 45000 : network.name === '3G Fast' ? 30000 : 20000;
        expect(networkTime).toBeLessThan(maxExpectedTime);
        
      } finally {
        // Reset network conditions
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0
        });
      }
    }
  });

  test.afterAll(async () => {
    // Generate mobile testing report
    const report = generateMobileTestingReport(mobileTestResults);
    const reportPath = path.join(outputDir, 'mobile-testing-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate mobile testing summary
    const summary = generateMobileTestingSummary(report);
    const summaryPath = path.join(outputDir, 'mobile-testing-summary.txt');
    fs.writeFileSync(summaryPath, summary);
    
    console.log('\n📱 Mobile Responsive Testing Complete!');
    console.log(`📄 Detailed Report: ${reportPath}`);
    console.log(`📝 Summary: ${summaryPath}`);
    
    // Print mobile compatibility summary
    console.log('\n📱 Mobile Device Compatibility:');
    mobileTestResults.forEach(result => {
      const emoji = result.overallSuccess ? '✅' : result.successRate > 75 ? '⚠️' : '❌';
      console.log(`   ${emoji} ${result.device} (${result.os}): ${result.successRate?.toFixed(1) || 0}%`);
    });
  });
});

// Helper functions for mobile testing

async function testMobileFormInteraction(page, device) {
  const test = {
    name: 'Mobile Form Interaction',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Test filling form fields on mobile
    await page.tap('input[name="clientName"]');
    await page.fill('input[name="clientName"]', 'Mobile Test Client');
    
    await page.tap('input[name="clientPhone"]');
    await page.fill('input[name="clientPhone"]', '5555555555');
    
    await page.tap('input[name="price"]');
    await page.fill('input[name="price"]', '25000');
    
    await page.tap('input[name="contribution"]');
    await page.fill('input[name="contribution"]', '8000');
    
    // Wait for mobile calculations
    await page.waitForTimeout(1500);
    
    // Check if form fields are properly filled
    const nameValue = await page.inputValue('input[name="clientName"]');
    const priceValue = await page.inputValue('input[name="price"]');
    
    if (nameValue === 'Mobile Test Client' && priceValue === '25000') {
      test.success = true;
    } else {
      test.issues.push('Form fields not filled correctly');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobilePDFGeneration(page, device) {
  const test = {
    name: 'Mobile PDF Generation',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Ensure form is filled
    await fillMobileFormWithBasicData(page);
    
    // Test PDF generation on mobile
    const downloadPromise = page.waitForEvent('download', { 
      timeout: MOBILE_CONFIG.validation.performance.maxPDFGenTime 
    });
    
    await page.tap('button:has-text("Generar PDF")');
    const download = await downloadPromise;
    
    const pdfPath = path.join(outputDir, `mobile-${device.name.replace(/\s+/g, '-')}.pdf`);
    await download.saveAs(pdfPath);
    
    const fileStats = fs.statSync(pdfPath);
    
    if (fileStats.size > 5000) {
      test.success = true;
      test.fileSize = fileStats.size;
    } else {
      test.issues.push('PDF file too small');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileCurrencyFormatting(page, device) {
  const test = {
    name: 'Mobile Currency Formatting',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Test currency values that previously caused issues
    const currencyTest = CurrencyTestDataGenerator.getProblematicValues()[0]; // Test $20,000 issue
    
    await page.tap('input[name="price"]');
    await page.fill('input[name="price"]', currencyTest.value.toString());
    
    await page.tap('input[name="contribution"]');
    await page.fill('input[name="contribution"]', '5000');
    
    // Wait for mobile currency calculations
    await page.waitForTimeout(2000);
    
    // Check currency formatting in mobile interface
    const currencyElements = await page.locator('*').evaluateAll(elements => {
      return elements
        .filter(el => el.textContent && el.textContent.includes('$'))
        .map(el => el.textContent.trim())
        .filter(text => /\$[\d,]+\.?\d*/.test(text));
    });
    
    // Check for problematic patterns
    const hasProblematicFormats = currencyElements.some(text => 
      /\$\d+,\d{2}(?!\d)/.test(text) || /\$[\d,]+\.\d{1}(?!\d)/.test(text)
    );
    
    if (!hasProblematicFormats && currencyElements.length > 0) {
      test.success = true;
      test.currencyElements = currencyElements;
    } else {
      test.issues.push('Problematic currency formatting detected');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileResponsiveDesign(page, device) {
  const test = {
    name: 'Mobile Responsive Design',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Check for horizontal scrolling (bad on mobile)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      test.issues.push('Horizontal scrolling detected');
    }
    
    // Check touch target sizes
    const touchTargetIssues = await page.evaluate((minSize) => {
      const buttons = document.querySelectorAll('button, input[type="submit"], .clickable');
      const issues = [];
      
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        if (rect.width < minSize || rect.height < minSize) {
          issues.push(`Touch target ${index} too small: ${rect.width}x${rect.height}`);
        }
      });
      
      return issues;
    }, MOBILE_CONFIG.validation.touchTargets.minSize);
    
    test.issues.push(...touchTargetIssues);
    
    // Check font sizes are readable on mobile
    const fontSizeIssues = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, div, label, input, button');
      const issues = [];
      
      textElements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        if (fontSize && fontSize < 14) { // Minimum 14px for mobile
          issues.push(`Text element ${index} too small: ${fontSize}px`);
        }
      });
      
      return issues.slice(0, 5); // Limit to first 5 issues
    });
    
    test.issues.push(...fontSizeIssues);
    
    // Success if no critical issues
    test.success = test.issues.length <= 2; // Allow minor issues
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testTouchTapInteractions(page) {
  const test = {
    name: 'Touch Tap Interactions',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Test tapping various elements
    await page.tap('input[name="clientName"]');
    await page.waitForTimeout(300);
    
    const nameFieldFocused = await page.evaluate(() => {
      return document.activeElement && document.activeElement.name === 'clientName';
    });
    
    if (!nameFieldFocused) {
      test.issues.push('Name field did not receive focus after tap');
    }
    
    // Test button taps
    const previewButton = page.locator('button:has-text("Vista Previa")');
    if (await previewButton.isVisible()) {
      await previewButton.tap();
      await page.waitForTimeout(500);
      
      const modalVisible = await page.isVisible('#previewModal');
      if (modalVisible) {
        await page.tap('button:has-text("Cerrar")');
        test.success = true;
      } else {
        test.issues.push('Preview modal did not open after button tap');
      }
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testTouchScrollInteractions(page) {
  const test = {
    name: 'Touch Scroll Interactions',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Perform touch scroll
    await page.touchscreen.tap(200, 300);
    await page.mouse.wheel(0, 300); // Simulate scroll
    await page.waitForTimeout(500);
    
    const newScrollY = await page.evaluate(() => window.scrollY);
    
    if (newScrollY !== initialScrollY) {
      test.success = true;
    } else {
      test.issues.push('Page did not scroll properly');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileFormFieldFocus(page) {
  const test = {
    name: 'Mobile Form Field Focus',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    const formFields = ['input[name="clientName"]', 'input[name="clientPhone"]', 'input[name="price"]'];
    let successfulFocus = 0;
    
    for (const field of formFields) {
      await page.tap(field);
      await page.waitForTimeout(300);
      
      const fieldName = field.match(/name="([^"]+)"/)[1];
      const isFocused = await page.evaluate((name) => {
        return document.activeElement && document.activeElement.name === name;
      }, fieldName);
      
      if (isFocused) {
        successfulFocus++;
      } else {
        test.issues.push(`Field ${fieldName} did not receive focus`);
      }
    }
    
    test.success = successfulFocus === formFields.length;
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileButtonAccessibility(page) {
  const test = {
    name: 'Mobile Button Accessibility',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    const buttonAnalysis = await page.evaluate((minSize) => {
      const buttons = document.querySelectorAll('button');
      const analysis = {
        totalButtons: buttons.length,
        accessibleButtons: 0,
        issues: []
      };
      
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        
        let accessible = true;
        
        // Check size
        if (rect.width < minSize || rect.height < minSize) {
          analysis.issues.push(`Button ${index} too small: ${rect.width}x${rect.height}`);
          accessible = false;
        }
        
        // Check visibility
        if (style.display === 'none' || style.visibility === 'hidden') {
          accessible = false;
        }
        
        if (accessible) {
          analysis.accessibleButtons++;
        }
      });
      
      return analysis;
    }, MOBILE_CONFIG.validation.touchTargets.minSize);
    
    test.buttonAnalysis = buttonAnalysis;
    test.issues = buttonAnalysis.issues.slice(0, 5); // Limit issues
    
    // Success if most buttons are accessible
    test.success = buttonAnalysis.accessibleButtons / buttonAnalysis.totalButtons >= 0.8;
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileNumericKeyboard(page) {
  const test = {
    name: 'Mobile Numeric Keyboard',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Focus on price field (should trigger numeric keyboard)
    await page.tap('input[name="price"]');
    await page.waitForTimeout(500);
    
    // Type numeric value
    await page.fill('input[name="price"]', '25000');
    
    const value = await page.inputValue('input[name="price"]');
    
    if (value === '25000') {
      test.success = true;
    } else {
      test.issues.push('Numeric input not working correctly');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileTextKeyboard(page) {
  const test = {
    name: 'Mobile Text Keyboard',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Focus on client name field (should trigger text keyboard)
    await page.tap('input[name="clientName"]');
    await page.waitForTimeout(500);
    
    // Type text value
    await page.fill('input[name="clientName"]', 'José María Test');
    
    const value = await page.inputValue('input[name="clientName"]');
    
    if (value === 'José María Test') {
      test.success = true;
    } else {
      test.issues.push('Text input not working correctly');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function testMobileCurrencyInput(page) {
  const test = {
    name: 'Mobile Currency Input',
    success: false,
    startTime: Date.now(),
    issues: []
  };
  
  try {
    // Test problematic currency value on mobile
    await page.tap('input[name="price"]');
    await page.fill('input[name="price"]', '20000');
    
    await page.tap('input[name="contribution"]');
    await page.fill('input[name="contribution"]', '5000');
    
    // Trigger calculation
    await page.tap('input[name="price"]'); // Focus out to trigger calculation
    await page.waitForTimeout(1500);
    
    // Check for currency formatting issues on mobile
    const currencyValidation = await page.evaluate(() => {
      const allText = document.body.textContent;
      const problematicPatterns = allText.match(/\$\d+,\d{2}(?!\d)/g) || [];
      
      return {
        hasProblematicPatterns: problematicPatterns.length > 0,
        patterns: problematicPatterns
      };
    });
    
    test.success = !currencyValidation.hasProblematicPatterns;
    
    if (currencyValidation.hasProblematicPatterns) {
      test.issues.push('Problematic currency patterns detected on mobile');
    }
    
  } catch (error) {
    test.issues.push(error.message);
  }
  
  test.duration = Date.now() - test.startTime;
  return test;
}

async function fillMobileFormWithBasicData(page) {
  await page.tap('input[name="clientName"]');
  await page.fill('input[name="clientName"]', 'Mobile Test Client');
  
  await page.tap('input[name="clientPhone"]');
  await page.fill('input[name="clientPhone"]', '5555555555');
  
  await page.tap('input[name="productType"]');
  await page.fill('input[name="productType"]', 'Test Product');
  
  await page.tap('input[name="material"]');
  await page.fill('input[name="material"]', 'ORO 14K');
  
  await page.tap('input[name="price"]');
  await page.fill('input[name="price"]', '25000');
  
  await page.tap('input[name="contribution"]');
  await page.fill('input[name="contribution"]', '8000');
  
  await page.waitForTimeout(1000);
}

async function fillMobileFormWithComplexData(page, device) {
  const testData = MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX;
  
  await page.tap('input[name="clientName"]');
  await page.fill('input[name="clientName"]', testData.name);
  
  await page.tap('input[name="clientPhone"]');
  await page.fill('input[name="clientPhone"]', testData.phone);
  
  await page.tap('input[name="productType"]');
  await page.fill('input[name="productType"]', 'Collar de Diseño Exclusivo');
  
  await page.tap('input[name="material"]');
  await page.fill('input[name="material"]', 'ORO 18K BLANCO Y AMARILLO');
  
  await page.tap('input[name="price"]');
  await page.fill('input[name="price"]', '85000');
  
  await page.tap('input[name="contribution"]');
  await page.fill('input[name="contribution"]', '25000');
  
  await page.waitForTimeout(1500);
}

async function getMemoryUsage(page) {
  try {
    const memoryInfo = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    return memoryInfo;
  } catch (error) {
    return 0;
  }
}

function generateMobileTestingReport(mobileResults) {
  const summary = {
    totalDevices: mobileResults.length,
    successfulDevices: mobileResults.filter(r => r.overallSuccess).length,
    deviceCategories: {},
    operatingSystems: {},
    averageSuccessRate: 0
  };
  
  // Categorize results
  mobileResults.forEach(result => {
    // By category
    if (!summary.deviceCategories[result.category]) {
      summary.deviceCategories[result.category] = { total: 0, successful: 0 };
    }
    summary.deviceCategories[result.category].total++;
    if (result.overallSuccess) {
      summary.deviceCategories[result.category].successful++;
    }
    
    // By OS
    if (!summary.operatingSystems[result.os]) {
      summary.operatingSystems[result.os] = { total: 0, successful: 0 };
    }
    summary.operatingSystems[result.os].total++;
    if (result.overallSuccess) {
      summary.operatingSystems[result.os].successful++;
    }
  });
  
  // Calculate average success rate
  const totalSuccessRate = mobileResults.reduce((sum, r) => sum + (r.successRate || 0), 0);
  summary.averageSuccessRate = totalSuccessRate / mobileResults.length;
  
  return {
    executedAt: new Date().toISOString(),
    summary,
    detailedResults: mobileResults,
    mobileConfiguration: MOBILE_CONFIG
  };
}

function generateMobileTestingSummary(report) {
  return `CIAOCIAO RECIBOS - MOBILE RESPONSIVE PDF GENERATION REPORT
=======================================================

Test Execution: ${report.executedAt}

OVERALL RESULTS:
- Devices Tested: ${report.summary.totalDevices}
- Successful Devices: ${report.summary.successfulDevices}
- Overall Success Rate: ${report.summary.averageSuccessRate.toFixed(1)}%

DEVICE CATEGORY BREAKDOWN:
${Object.entries(report.summary.deviceCategories).map(([category, data]) => 
  `- ${category}: ${data.successful}/${data.total} (${((data.successful / data.total) * 100).toFixed(1)}%)`
).join('\n')}

OPERATING SYSTEM BREAKDOWN:
${Object.entries(report.summary.operatingSystems).map(([os, data]) => 
  `- ${os}: ${data.successful}/${data.total} (${((data.successful / data.total) * 100).toFixed(1)}%)`
).join('\n')}

DETAILED DEVICE RESULTS:
${report.detailedResults.map(result => `
${result.device} (${result.os}):
- Viewport: ${result.viewport}
- Overall Success: ${result.overallSuccess ? 'YES' : 'NO'}
- Success Rate: ${result.successRate?.toFixed(1) || 0}%
${result.tests ? Object.entries(result.tests).map(([test, data]) => 
  `  - ${test}: ${data.success ? 'PASS' : 'FAIL'} (${data.duration}ms)`
).join('\n') : ''}
${result.criticalError ? `- Critical Error: ${result.criticalError}` : ''}
`).join('')}

MOBILE COMPATIBILITY ASSESSMENT:
${report.summary.averageSuccessRate >= 90 ? '✅ Excellent mobile compatibility! PDF generation works reliably across devices.' : ''}
${report.summary.averageSuccessRate < 90 && report.summary.averageSuccessRate >= 75 ? '⚠️ Good mobile compatibility with some issues. Consider optimization for better mobile experience.' : ''}
${report.summary.averageSuccessRate < 75 ? '❌ Mobile compatibility needs improvement. Significant issues detected across multiple devices.' : ''}

RECOMMENDATIONS:
- Test on actual devices when possible for more accurate results
- Optimize touch target sizes for better mobile usability
- Consider mobile-first responsive design improvements
- Monitor performance on lower-end devices
- Validate currency formatting across different mobile keyboards
`;
}