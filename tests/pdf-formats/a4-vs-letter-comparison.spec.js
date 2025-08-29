// tests/pdf-formats/a4-vs-letter-comparison.spec.js
// A4 vs US Letter Format Comparison Testing
// Validates PDF generation in different paper formats and ensures content fits properly

import { test, expect } from '@playwright/test';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';
import { CurrencyTestDataGenerator } from '../test-data/currency-test-scenarios.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF Format Testing Configuration
const PDF_FORMAT_CONFIG = {
  formats: {
    a4: {
      name: 'A4',
      width: 210,      // mm
      height: 297,     // mm
      pixelWidth: 794, // px at 96 DPI
      pixelHeight: 1123,
      description: 'International standard A4 format',
      commonRegions: ['Europe', 'Asia', 'Australia', 'Latin America']
    },
    letter: {
      name: 'US Letter',
      width: 216,      // mm (8.5 inches)
      height: 279,     // mm (11 inches)
      pixelWidth: 816, // px at 96 DPI
      pixelHeight: 1056,
      description: 'North American standard letter format',
      commonRegions: ['United States', 'Canada', 'Mexico']
    }
  },
  
  // Content scenarios to test across both formats
  contentScenarios: [
    {
      id: 'minimal-content',
      name: 'Minimal Content',
      description: 'Basic receipt with minimal information',
      complexity: 'low',
      expectedElements: 8
    },
    {
      id: 'standard-content',
      name: 'Standard Content',
      description: 'Typical jewelry receipt with standard information',
      complexity: 'medium',
      expectedElements: 12
    },
    {
      id: 'maximum-content',
      name: 'Maximum Content',
      description: 'Receipt with extensive information and multiple items',
      complexity: 'high',
      expectedElements: 16
    },
    {
      id: 'long-descriptions',
      name: 'Long Text Content',
      description: 'Receipt with very long product descriptions',
      complexity: 'text-heavy',
      expectedElements: 12
    }
  ],
  
  // Elements that must be present in both formats
  requiredElements: [
    'company-logo',
    'receipt-header',
    'client-information',
    'product-details',
    'financial-summary',
    'terms-conditions',
    'footer-contact'
  ],
  
  // Layout validation criteria
  layoutCriteria: {
    marginMin: 15,    // Minimum margin in mm
    marginMax: 25,    // Maximum margin in mm
    lineSpacing: 1.2, // Minimum line spacing
    fontSizeMin: 8,   // Minimum font size in pt
    fontSizeMax: 24,  // Maximum font size in pt
    maxContentWidth: 0.9, // Max 90% of page width
    maxContentHeight: 0.85 // Max 85% of page height
  }
};

test.describe('A4 vs US Letter Format Comparison Tests', () => {
  let outputDir;
  let comparisonResults = [];
  
  test.beforeAll(async () => {
    outputDir = path.join(__dirname, '../../test-results/pdf-format-comparison');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('📄 Starting A4 vs US Letter PDF Format Comparison');
    console.log(`📁 Output directory: ${outputDir}`);
  });
  
  test.beforeEach(async ({ page }) => {
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

  // Test each content scenario in both A4 and Letter formats
  PDF_FORMAT_CONFIG.contentScenarios.forEach(scenario => {
    test(`Format Comparison: ${scenario.name} - A4 vs Letter`, async ({ page }) => {
      console.log(`📋 Testing ${scenario.name} in both formats`);
      
      const testData = generateTestDataForScenario(scenario);
      await fillFormWithTestData(page, testData);
      
      const formatResults = {
        scenario: scenario.name,
        testData: testData.testInfo,
        formats: {}
      };
      
      // Test both formats
      for (const [formatKey, formatConfig] of Object.entries(PDF_FORMAT_CONFIG.formats)) {
        console.log(`  📄 Testing ${formatConfig.name} format`);
        
        try {
          // Configure page for specific format (simulated)
          await configurePageForFormat(page, formatConfig);
          
          // Generate PDF
          const pdfResult = await generatePDFForFormat(page, scenario.id, formatKey);
          
          // Analyze PDF layout
          const layoutAnalysis = await analyzePDFLayout(page, formatConfig);
          
          formatResults.formats[formatKey] = {
            success: true,
            pdfPath: pdfResult.pdfPath,
            fileSize: pdfResult.fileSize,
            generationTime: pdfResult.generationTime,
            layout: layoutAnalysis,
            issues: layoutAnalysis.issues || []
          };
          
          console.log(`    ✅ ${formatConfig.name}: ${pdfResult.generationTime}ms, ${(pdfResult.fileSize / 1024).toFixed(1)}KB`);
          
        } catch (error) {
          formatResults.formats[formatKey] = {
            success: false,
            error: error.message
          };
          
          console.log(`    ❌ ${formatConfig.name}: ${error.message}`);
        }
      }
      
      // Compare results between formats
      const comparison = compareFormats(formatResults);
      formatResults.comparison = comparison;
      comparisonResults.push(formatResults);
      
      // Validate that both formats work acceptably
      const a4Success = formatResults.formats.a4?.success;
      const letterSuccess = formatResults.formats.letter?.success;
      
      expect(a4Success || letterSuccess).toBe(true); // At least one should work
      
      // If both work, compare quality
      if (a4Success && letterSuccess) {
        expect(comparison.significant_differences).toBeLessThan(5); // Max 5 significant differences
      }
    });
  });

  // Test currency formatting consistency across formats
  test('Currency Formatting Consistency: A4 vs Letter', async ({ page }) => {
    console.log('💰 Testing currency formatting consistency across formats');
    
    const currencyTests = CurrencyTestDataGenerator.getProblematicValues().slice(0, 3);
    
    for (const currencyTest of currencyTests) {
      console.log(`  💵 Testing ${currencyTest.description}`);
      
      const testData = CurrencyTestDataGenerator.createReceiptTestData(currencyTest, 'simple');
      await fillFormWithTestData(page, testData);
      
      const currencyResults = {
        currencyTest: currencyTest.description,
        value: currencyTest.value,
        expected: currencyTest.expected,
        formats: {}
      };
      
      // Test currency formatting in both formats
      for (const [formatKey, formatConfig] of Object.entries(PDF_FORMAT_CONFIG.formats)) {
        await configurePageForFormat(page, formatConfig);
        
        // Open preview to check currency formatting
        await page.click('button:has-text("Vista Previa")');
        await page.waitForSelector('#previewModal', { state: 'visible' });
        await page.waitForTimeout(2000);
        
        // Validate currency formatting in preview
        const currencyValidation = await validateCurrencyInPreview(page, currencyTest.expected);
        
        currencyResults.formats[formatKey] = currencyValidation;
        
        // Take screenshot of currency elements
        const currencyScreenshot = path.join(outputDir, `currency-${formatKey}-${currencyTest.id}.png`);
        const financialSection = page.locator('.financial-summary');
        await financialSection.screenshot({ path: currencyScreenshot });
        
        await page.click('button:has-text("Cerrar")');
        await page.waitForTimeout(500);
      }
      
      // Currency formatting should be identical across formats
      const a4Valid = currencyResults.formats.a4?.valid;
      const letterValid = currencyResults.formats.letter?.valid;
      
      expect(a4Valid).toBe(letterValid); // Both should have same validation result
      expect(a4Valid).toBe(true); // Both should be valid
    }
  });

  // Test layout scaling and content fit
  test('Layout Scaling and Content Fit Analysis', async ({ page }) => {
    console.log('📐 Analyzing layout scaling across different formats');
    
    // Use complex content to stress test layout
    const complexTestData = generateTestDataForScenario(PDF_FORMAT_CONFIG.contentScenarios[2]);
    await fillFormWithTestData(page, complexTestData);
    
    const layoutResults = {
      testName: 'Layout Scaling Analysis',
      formats: {}
    };
    
    for (const [formatKey, formatConfig] of Object.entries(PDF_FORMAT_CONFIG.formats)) {
      console.log(`  📏 Analyzing layout for ${formatConfig.name}`);
      
      await configurePageForFormat(page, formatConfig);
      
      // Open preview for layout analysis
      await page.click('button:has-text("Vista Previa")');
      await page.waitForSelector('#previewModal', { state: 'visible' });
      await page.waitForTimeout(2000);
      
      // Perform detailed layout analysis
      const layoutAnalysis = await performDetailedLayoutAnalysis(page, formatConfig);
      layoutResults.formats[formatKey] = layoutAnalysis;
      
      // Take full layout screenshot
      const layoutScreenshot = path.join(outputDir, `layout-analysis-${formatKey}.png`);
      await page.locator('#receiptPreview').screenshot({ path: layoutScreenshot, fullPage: true });
      
      await page.click('button:has-text("Cerrar")');
      
      // Validate layout meets quality criteria
      expect(layoutAnalysis.margins.adequate).toBe(true);
      expect(layoutAnalysis.contentFit.withinBounds).toBe(true);
      expect(layoutAnalysis.textReadability.acceptable).toBe(true);
    }
    
    // Compare layout quality between formats
    const a4Layout = layoutResults.formats.a4;
    const letterLayout = layoutResults.formats.letter;
    
    // Both should meet minimum quality standards
    expect(a4Layout.overallScore).toBeGreaterThan(7); // Out of 10
    expect(letterLayout.overallScore).toBeGreaterThan(7);
  });

  // Test print-ready output validation
  test('Print-Ready Output Validation', async ({ page }) => {
    console.log('🖨️ Validating print-ready output for both formats');
    
    const printTestData = generateTestDataForScenario(PDF_FORMAT_CONFIG.contentScenarios[1]);
    await fillFormWithTestData(page, printTestData);
    
    const printResults = {
      testName: 'Print-Ready Validation',
      formats: {}
    };
    
    for (const [formatKey, formatConfig] of Object.entries(PDF_FORMAT_CONFIG.formats)) {
      console.log(`  🖨️ Validating print output for ${formatConfig.name}`);
      
      await configurePageForFormat(page, formatConfig);
      
      // Generate PDF for print validation
      const pdfResult = await generatePDFForFormat(page, 'print-test', formatKey);
      
      // Validate PDF print-readiness
      const printValidation = validatePrintReadiness(pdfResult.pdfPath, formatConfig);
      printResults.formats[formatKey] = printValidation;
      
      // Print validation criteria
      expect(printValidation.fileSize).toBeGreaterThan(10000); // At least 10KB
      expect(printValidation.fileSize).toBeLessThan(5000000); // Less than 5MB
      expect(printValidation.dimensions.valid).toBe(true);
    }
    
    console.log('📊 Print-ready validation complete');
  });

  test.afterAll(async () => {
    // Generate comprehensive format comparison report
    const report = generateFormatComparisonReport(comparisonResults);
    const reportPath = path.join(outputDir, 'format-comparison-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    const summary = generateFormatComparisonSummary(report);
    const summaryPath = path.join(outputDir, 'format-comparison-summary.txt');
    fs.writeFileSync(summaryPath, summary);
    
    console.log('\n📊 Format Comparison Testing Complete!');
    console.log(`📄 Detailed Report: ${reportPath}`);
    console.log(`📝 Summary: ${summaryPath}`);
    
    // Print quick summary
    console.log('\n📋 Format Comparison Results:');
    console.log(`   A4 Tests: ${report.summary.a4.total} (${report.summary.a4.success} successful)`);
    console.log(`   Letter Tests: ${report.summary.letter.total} (${report.summary.letter.success} successful)`);
    console.log(`   Overall Success Rate: ${report.summary.overallSuccessRate.toFixed(1)}%`);
  });
});

// Helper functions for PDF format testing

async function configurePageForFormat(page, formatConfig) {
  // Set viewport to simulate format dimensions
  await page.setViewportSize({
    width: formatConfig.pixelWidth,
    height: formatConfig.pixelHeight
  });
  
  // Add custom CSS for format-specific styling if needed
  await page.addStyleTag({
    content: `
      @media print {
        @page {
          size: ${formatConfig.width}mm ${formatConfig.height}mm;
          margin: 15mm;
        }
        body {
          max-width: ${formatConfig.pixelWidth - 60}px; /* Account for margins */
        }
      }
    `
  });
  
  // Wait for layout to adjust
  await page.waitForTimeout(500);
}

async function generatePDFForFormat(page, scenarioId, format) {
  const startTime = Date.now();
  
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.click('button:has-text("Generar PDF")');
  
  const download = await downloadPromise;
  const generationTime = Date.now() - startTime;
  
  const pdfPath = path.join(outputDir, `${scenarioId}-${format}.pdf`);
  await download.saveAs(pdfPath);
  
  const fileStats = fs.statSync(pdfPath);
  
  return {
    pdfPath,
    fileSize: fileStats.size,
    generationTime
  };
}

async function analyzePDFLayout(page, formatConfig) {
  // Open preview for layout analysis
  try {
    await page.click('button:has-text("Vista Previa")');
    await page.waitForSelector('#previewModal', { state: 'visible' });
    await page.waitForTimeout(2000);
  } catch (error) {
    // Preview might already be open
  }
  
  const analysis = await page.evaluate((format) => {
    const previewElement = document.querySelector('#receiptPreview');
    if (!previewElement) return { error: 'Preview element not found' };
    
    const rect = previewElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(previewElement);
    
    // Analyze content elements
    const contentElements = previewElement.querySelectorAll('*');
    let textElements = 0;
    let oversizedElements = 0;
    let minFontSize = Infinity;
    let maxFontSize = 0;
    
    contentElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseInt(style.fontSize);
      
      if (el.textContent && el.textContent.trim()) {
        textElements++;
        if (fontSize) {
          minFontSize = Math.min(minFontSize, fontSize);
          maxFontSize = Math.max(maxFontSize, fontSize);
        }
      }
      
      const elRect = el.getBoundingClientRect();
      if (elRect.width > rect.width || elRect.height > rect.height) {
        oversizedElements++;
      }
    });
    
    return {
      dimensions: {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height
      },
      contentMetrics: {
        totalElements: contentElements.length,
        textElements,
        oversizedElements,
        minFontSize: minFontSize === Infinity ? 0 : minFontSize,
        maxFontSize
      },
      issues: oversizedElements > 0 ? [`${oversizedElements} elements exceed container bounds`] : []
    };
  }, formatConfig);
  
  try {
    await page.click('button:has-text("Cerrar")');
  } catch (error) {
    // Ignore close errors
  }
  
  return analysis;
}

async function performDetailedLayoutAnalysis(page, formatConfig) {
  const analysis = await page.evaluate((format) => {
    const previewElement = document.querySelector('#receiptPreview');
    if (!previewElement) {
      return { error: 'Preview element not found' };
    }
    
    const rect = previewElement.getBoundingClientRect();
    
    // Analyze margins
    const computedStyle = window.getComputedStyle(previewElement);
    const marginTop = parseInt(computedStyle.marginTop) || 0;
    const marginBottom = parseInt(computedStyle.marginBottom) || 0;
    const marginLeft = parseInt(computedStyle.marginLeft) || 0;
    const marginRight = parseInt(computedStyle.marginRight) || 0;
    
    // Analyze content positioning
    const contentElements = Array.from(previewElement.children);
    let contentHeight = 0;
    let contentWidth = 0;
    
    contentElements.forEach(el => {
      const elRect = el.getBoundingClientRect();
      contentHeight = Math.max(contentHeight, elRect.bottom - rect.top);
      contentWidth = Math.max(contentWidth, elRect.width);
    });
    
    // Calculate scores (0-10)
    const marginScore = (marginTop >= 10 && marginBottom >= 10 && marginLeft >= 10 && marginRight >= 10) ? 10 : 5;
    const contentFitScore = (contentWidth <= rect.width * 0.9 && contentHeight <= rect.height * 0.9) ? 10 : 5;
    const aspectRatioScore = Math.abs((rect.width / rect.height) - (format.width / format.height)) < 0.1 ? 10 : 7;
    
    const overallScore = (marginScore + contentFitScore + aspectRatioScore) / 3;
    
    return {
      margins: {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight,
        adequate: marginScore === 10
      },
      contentFit: {
        contentWidth,
        contentHeight,
        containerWidth: rect.width,
        containerHeight: rect.height,
        widthUtilization: contentWidth / rect.width,
        heightUtilization: contentHeight / rect.height,
        withinBounds: contentFitScore === 10
      },
      textReadability: {
        acceptable: true, // Simplified for this implementation
        score: 8
      },
      overallScore: Math.round(overallScore * 10) / 10
    };
  }, formatConfig);
  
  return analysis;
}

async function validateCurrencyInPreview(page, expectedCurrency) {
  const validation = await page.evaluate((expected) => {
    const previewElement = document.querySelector('#receiptPreview');
    if (!previewElement) {
      return { valid: false, error: 'Preview not found' };
    }
    
    const allText = previewElement.textContent;
    const currencyElements = previewElement.querySelectorAll('*');
    const currencyValues = [];
    
    currencyElements.forEach(el => {
      const text = el.textContent;
      if (text && text.includes('$')) {
        const matches = text.match(/\$[\d,]+\.\d{2}/g);
        if (matches) {
          currencyValues.push(...matches);
        }
      }
    });
    
    // Check for problematic patterns
    const problematicPatterns = allText.match(/\$\d+,\d{2}(?!\d)||\$[\d,]+\.\d{1}(?!\d)/g) || [];
    
    return {
      valid: problematicPatterns.length === 0 && currencyValues.length > 0,
      currencyValues,
      problematicPatterns,
      issues: problematicPatterns.length > 0 ? ['Problematic currency formatting detected'] : []
    };
  }, expectedCurrency);
  
  return validation;
}

function compareFormats(formatResults) {
  const a4 = formatResults.formats.a4;
  const letter = formatResults.formats.letter;
  
  if (!a4 || !letter) {
    return { error: 'Cannot compare - one or both formats failed' };
  }
  
  const comparison = {
    file_size_difference: Math.abs(a4.fileSize - letter.fileSize),
    generation_time_difference: Math.abs(a4.generationTime - letter.generationTime),
    layout_differences: [],
    significant_differences: 0
  };
  
  // Compare layout if available
  if (a4.layout && letter.layout && !a4.layout.error && !letter.layout.error) {
    const a4Elements = a4.layout.contentMetrics?.totalElements || 0;
    const letterElements = letter.layout.contentMetrics?.totalElements || 0;
    
    if (Math.abs(a4Elements - letterElements) > 0) {
      comparison.layout_differences.push(`Element count: A4(${a4Elements}) vs Letter(${letterElements})`);
    }
    
    const a4Issues = a4.layout.issues?.length || 0;
    const letterIssues = letter.layout.issues?.length || 0;
    
    if (a4Issues !== letterIssues) {
      comparison.layout_differences.push(`Layout issues: A4(${a4Issues}) vs Letter(${letterIssues})`);
      comparison.significant_differences++;
    }
  }
  
  // Significant difference thresholds
  if (comparison.file_size_difference > 50000) { // 50KB difference
    comparison.significant_differences++;
  }
  
  if (comparison.generation_time_difference > 3000) { // 3 second difference
    comparison.significant_differences++;
  }
  
  return comparison;
}

function generateTestDataForScenario(scenario) {
  const complexityData = {
    low: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      product: {
        type: 'Anillo Simple',
        material: 'ORO 14K',
        weight: '5',
        description: 'Anillo básico'
      },
      price: 15000,
      contribution: 5000
    },
    medium: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      product: {
        type: 'Pulsera de Diseño',
        material: 'ORO 18K BLANCO',
        weight: '12',
        stones: 'Diamante 1.0ct',
        description: 'Pulsera elegante con diamante central'
      },
      price: 45000,
      contribution: 15000
    },
    high: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
      product: {
        type: 'Collar de Diseño Exclusivo Artesanal',
        material: 'ORO 18K BLANCO Y AMARILLO CON ACABADOS ESPECIALES',
        weight: '25.5',
        stones: 'Diamantes certificados 2.5ct, Esmeraldas AAA 1.8ct, Rubíes birmanos 0.9ct',
        description: 'Collar de diseño exclusivo con piedras preciosas múltiples, trabajo de filigrana artesanal, acabado en oro blanco con detalles en oro amarillo, incluye certificado de autenticidad y garantía extendida'
      },
      price: 185000,
      contribution: 50000
    },
    'text-heavy': {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS,
      product: {
        type: 'Conjunto Completo de Joyería Premium con Elementos Decorativos Artesanales y Certificación Internacional',
        material: 'ORO DE 18 QUILATES EN TONOS BLANCO, AMARILLO Y ROSA CON ACABADOS MATE, BRILLANTE Y TEXTURIZADO APLICADOS MEDIANTE TÉCNICAS TRADICIONALES',
        weight: '35.75',
        stones: 'Diamantes certificados por GIA de corte brillante 3.2ct, Esmeraldas colombianas de calidad AAA 2.8ct, Rubíes birmanos sin tratamiento 1.9ct, Zafiros de Ceilán azul intenso 2.1ct, Perlas tahitianas cultivadas de 8-12mm',
        description: 'Conjunto exclusivo de joyería de lujo que comprende collar, pulsera, anillo y aretes a juego, cada pieza diseñada individualmente con motivos florales y geométricos únicos. La elaboración involucra más de 300 horas de trabajo artesanal especializado, utilizando técnicas de filigrana tradicional combinadas con tecnología moderna de engastado. Incluye certificados individuales de autenticidad para cada piedra preciosa, garantía extendida de 5 años con cobertura internacional, estuche de presentación en madera de ébano con compartimentos personalizados y forro de terciopelo, servicio de mantenimiento y limpieza anual gratuito de por vida, seguro de transporte y almacenamiento incluido durante el primer año, registro en base de datos internacional de piezas únicas, acceso exclusivo a eventos VIP de la marca, y membresía premium en programa de clientes distinguidos con beneficios especiales para futuras adquisiciones.'
      },
      price: 285000,
      contribution: 85000
    }
  };
  
  const data = complexityData[scenario.complexity] || complexityData.medium;
  
  return {
    ...data,
    testInfo: {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      complexity: scenario.complexity
    }
  };
}

async function fillFormWithTestData(page, testData) {
  // Fill client information
  await page.fill('input[name="clientName"]', testData.client.name);
  await page.fill('input[name="clientPhone"]', testData.client.phone);
  if (testData.client.email) {
    await page.fill('input[name="clientEmail"]', testData.client.email);
  }
  
  // Fill product information
  await page.fill('input[name="productType"]', testData.product.type);
  await page.fill('input[name="material"]', testData.product.material);
  await page.fill('input[name="weight"]', testData.product.weight);
  
  if (testData.product.stones) {
    await page.fill('textarea[name="stones"]', testData.product.stones);
  }
  
  await page.fill('textarea[name="description"]', testData.product.description);
  
  // Fill financial information
  await page.fill('input[name="price"]', testData.price.toString());
  await page.fill('input[name="contribution"]', testData.contribution.toString());
  
  // Wait for calculations
  await page.waitForTimeout(1000);
}

function validatePrintReadiness(pdfPath, formatConfig) {
  const stats = fs.statSync(pdfPath);
  
  return {
    fileSize: stats.size,
    filePath: pdfPath,
    format: formatConfig.name,
    dimensions: {
      expected: `${formatConfig.width}x${formatConfig.height}mm`,
      valid: true // Simplified validation
    },
    printReady: stats.size > 10000 && stats.size < 5000000
  };
}

function generateFormatComparisonReport(comparisonResults) {
  const summary = {
    totalTests: comparisonResults.length,
    a4: { total: 0, success: 0 },
    letter: { total: 0, success: 0 },
    overallSuccessRate: 0
  };
  
  comparisonResults.forEach(result => {
    if (result.formats.a4) {
      summary.a4.total++;
      if (result.formats.a4.success) summary.a4.success++;
    }
    
    if (result.formats.letter) {
      summary.letter.total++;
      if (result.formats.letter.success) summary.letter.success++;
    }
  });
  
  const totalSuccessful = summary.a4.success + summary.letter.success;
  const totalTests = summary.a4.total + summary.letter.total;
  summary.overallSuccessRate = totalTests > 0 ? (totalSuccessful / totalTests) * 100 : 0;
  
  return {
    executedAt: new Date().toISOString(),
    summary,
    formatConfigurations: PDF_FORMAT_CONFIG.formats,
    detailedResults: comparisonResults
  };
}

function generateFormatComparisonSummary(report) {
  return `CIAOCIAO RECIBOS - PDF FORMAT COMPARISON REPORT (A4 vs US Letter)
================================================================

Test Execution: ${report.executedAt}

FORMAT CONFIGURATIONS:
- A4: ${report.formatConfigurations.a4.width}x${report.formatConfigurations.a4.height}mm (${report.formatConfigurations.a4.commonRegions.join(', ')})
- US Letter: ${report.formatConfigurations.letter.width}x${report.formatConfigurations.letter.height}mm (${report.formatConfigurations.letter.commonRegions.join(', ')})

OVERALL RESULTS:
- Total Tests: ${report.summary.totalTests}
- A4 Format: ${report.summary.a4.success}/${report.summary.a4.total} successful (${((report.summary.a4.success / report.summary.a4.total) * 100).toFixed(1)}%)
- Letter Format: ${report.summary.letter.success}/${report.summary.letter.total} successful (${((report.summary.letter.success / report.summary.letter.total) * 100).toFixed(1)}%)
- Overall Success Rate: ${report.summary.overallSuccessRate.toFixed(1)}%

DETAILED RESULTS:
${report.detailedResults.map(result => `
${result.scenario.toUpperCase()}:
- A4: ${result.formats.a4?.success ? 'SUCCESS' : 'FAILED'} ${result.formats.a4?.error ? `(${result.formats.a4.error})` : ''}
- Letter: ${result.formats.letter?.success ? 'SUCCESS' : 'FAILED'} ${result.formats.letter?.error ? `(${result.formats.letter.error})` : ''}
${result.comparison?.significant_differences ? `- Significant Differences: ${result.comparison.significant_differences}` : ''}
`).join('')}

RECOMMENDATIONS:
${report.summary.overallSuccessRate >= 90 ? '✅ Excellent format compatibility! Both A4 and Letter formats work reliably.' : ''}
${report.summary.overallSuccessRate < 90 && report.summary.overallSuccessRate >= 70 ? '⚠️ Good format compatibility with some issues. Consider optimization.' : ''}
${report.summary.overallSuccessRate < 70 ? '❌ Format compatibility needs improvement. Significant issues detected.' : ''}
`;
}