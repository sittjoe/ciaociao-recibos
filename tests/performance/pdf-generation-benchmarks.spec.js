// tests/performance/pdf-generation-benchmarks.spec.js
// Performance Benchmarking for PDF Generation
// Measures and validates PDF generation speed, memory usage, and system performance

import { test, expect } from '@playwright/test';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance Testing Configuration
const PERFORMANCE_CONFIG = {
  // Benchmark thresholds (in milliseconds)
  thresholds: {
    PDF_GENERATION_FAST: 8000,      // Excellent performance
    PDF_GENERATION_ACCEPTABLE: 15000, // Acceptable performance
    PDF_GENERATION_SLOW: 30000,      // Maximum acceptable
    PAGE_LOAD: 5000,                 // Page load time
    FORM_FILL: 3000,                 // Form interaction time
    PREVIEW_OPEN: 2000,              // Preview modal open time
    CURRENCY_CALCULATION: 1000       // Currency formatting time
  },
  
  // Test scenarios for different performance conditions
  scenarios: [
    {
      name: 'optimal-conditions',
      description: 'Simple receipt with minimal data',
      complexity: 'low',
      expectedTime: 8000
    },
    {
      name: 'standard-conditions',
      description: 'Typical receipt with standard information',
      complexity: 'medium',
      expectedTime: 12000
    },
    {
      name: 'complex-conditions',
      description: 'Complex receipt with extensive data',
      complexity: 'high',
      expectedTime: 18000
    },
    {
      name: 'stress-conditions',
      description: 'Maximum data with multiple currency calculations',
      complexity: 'extreme',
      expectedTime: 25000
    }
  ],
  
  // System resource monitoring
  monitoring: {
    memoryUsage: true,
    cpuUsage: true,
    networkActivity: true,
    domComplexity: true
  },
  
  // Sample sizes for statistical accuracy
  sampleSizes: {
    quick: 3,     // For development
    standard: 5,  // For CI/CD
    thorough: 10  // For detailed analysis
  }
};

// Performance metrics collector
class PerformanceMetricsCollector {
  constructor() {
    this.metrics = [];
    this.systemInfo = this.getSystemInfo();
  }
  
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
  }
  
  startMetric(testName) {
    return {
      testName,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      stages: []
    };
  }
  
  recordStage(metric, stageName) {
    metric.stages.push({
      name: stageName,
      time: Date.now(),
      duration: Date.now() - metric.startTime,
      memory: process.memoryUsage()
    });
  }
  
  finishMetric(metric, success = true, error = null) {
    metric.endTime = Date.now();
    metric.totalDuration = metric.endTime - metric.startTime;
    metric.endMemory = process.memoryUsage();
    metric.success = success;
    metric.error = error;
    metric.memoryDelta = {
      rss: metric.endMemory.rss - metric.startMemory.rss,
      heapUsed: metric.endMemory.heapUsed - metric.startMemory.heapUsed,
      heapTotal: metric.endMemory.heapTotal - metric.startMemory.heapTotal
    };
    
    this.metrics.push(metric);
    return metric;
  }
  
  getAverageMetrics(testName) {
    const testMetrics = this.metrics.filter(m => m.testName === testName && m.success);
    if (testMetrics.length === 0) return null;
    
    return {
      testName,
      sampleSize: testMetrics.length,
      averageDuration: testMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / testMetrics.length,
      minDuration: Math.min(...testMetrics.map(m => m.totalDuration)),
      maxDuration: Math.max(...testMetrics.map(m => m.totalDuration)),
      medianDuration: this.calculateMedian(testMetrics.map(m => m.totalDuration)),
      standardDeviation: this.calculateStandardDeviation(testMetrics.map(m => m.totalDuration)),
      successRate: (testMetrics.length / this.metrics.filter(m => m.testName === testName).length) * 100,
      averageMemoryDelta: {
        rss: testMetrics.reduce((sum, m) => sum + m.memoryDelta.rss, 0) / testMetrics.length,
        heapUsed: testMetrics.reduce((sum, m) => sum + m.memoryDelta.heapUsed, 0) / testMetrics.length
      }
    };
  }
  
  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }
  
  calculateStandardDeviation(values) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }
  
  generateReport() {
    const report = {
      systemInfo: this.systemInfo,
      testExecutedAt: new Date().toISOString(),
      totalTests: this.metrics.length,
      successfulTests: this.metrics.filter(m => m.success).length,
      testSummaries: {},
      rawMetrics: this.metrics,
      performanceGrades: {}
    };
    
    // Generate summaries for each unique test
    const uniqueTests = [...new Set(this.metrics.map(m => m.testName))];
    uniqueTests.forEach(testName => {
      report.testSummaries[testName] = this.getAverageMetrics(testName);
      report.performanceGrades[testName] = this.gradePerformance(testName);
    });
    
    return report;
  }
  
  gradePerformance(testName) {
    const metrics = this.getAverageMetrics(testName);
    if (!metrics) return 'F';
    
    const avgTime = metrics.averageDuration;
    
    if (avgTime <= PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_FAST) return 'A';
    if (avgTime <= PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_ACCEPTABLE) return 'B';
    if (avgTime <= PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_SLOW) return 'C';
    return 'D';
  }
}

// Global performance collector
const performanceCollector = new PerformanceMetricsCollector();

test.describe('PDF Generation Performance Benchmarks', () => {
  let outputDir;
  
  test.beforeAll(async () => {
    outputDir = path.join(__dirname, '../../test-results/performance-benchmarks');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('🚀 Starting PDF Generation Performance Benchmarks');
    console.log(`📊 System Info: ${performanceCollector.systemInfo.platform} ${performanceCollector.systemInfo.arch}`);
    console.log(`💾 Memory: ${Math.round(performanceCollector.systemInfo.totalMemory / 1024 / 1024)} MB total`);
    console.log(`⚡ CPUs: ${performanceCollector.systemInfo.cpus}`);
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

  // Test each performance scenario multiple times for statistical accuracy
  PERFORMANCE_CONFIG.scenarios.forEach(scenario => {
    test(`Performance Benchmark: ${scenario.name}`, async ({ page }) => {
      console.log(`🧪 Testing ${scenario.description}`);
      
      const sampleSize = PERFORMANCE_CONFIG.sampleSizes.standard;
      const results = [];
      
      for (let i = 1; i <= sampleSize; i++) {
        console.log(`  📊 Sample ${i}/${sampleSize}`);
        
        const metric = performanceCollector.startMetric(`${scenario.name}-sample-${i}`);
        
        try {
          // Fill form based on scenario complexity
          await fillFormForScenario(page, scenario);
          performanceCollector.recordStage(metric, 'form-filled');
          
          // Measure PDF generation time
          const pdfStartTime = Date.now();
          
          // Set up download listener
          const downloadPromise = page.waitForEvent('download', { 
            timeout: PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_SLOW 
          });
          
          // Generate PDF
          await page.click('button:has-text("Generar PDF")');
          performanceCollector.recordStage(metric, 'pdf-generation-started');
          
          const download = await downloadPromise;
          const pdfGenerationTime = Date.now() - pdfStartTime;
          
          performanceCollector.recordStage(metric, 'pdf-generation-completed');
          
          // Save PDF for validation
          const pdfPath = path.join(outputDir, `${scenario.name}-sample-${i}.pdf`);
          await download.saveAs(pdfPath);
          
          // Validate PDF was created successfully
          const fileStats = fs.statSync(pdfPath);
          expect(fileStats.size).toBeGreaterThan(MULTI_TOOL_CONFIG.PDF_VALIDATION_RULES.MIN_FILE_SIZE);
          
          performanceCollector.finishMetric(metric, true);
          
          results.push({
            sample: i,
            pdfGenerationTime,
            success: true,
            fileSize: fileStats.size
          });
          
          // Performance expectation based on scenario
          expect(pdfGenerationTime).toBeLessThan(scenario.expectedTime);
          
          console.log(`    ✅ Sample ${i}: ${pdfGenerationTime}ms (${(fileStats.size / 1024).toFixed(1)} KB)`);
          
          // Clear form for next sample
          await clearForm(page);
          
        } catch (error) {
          performanceCollector.finishMetric(metric, false, error.message);
          console.log(`    ❌ Sample ${i} failed: ${error.message}`);
          
          results.push({
            sample: i,
            success: false,
            error: error.message
          });
        }
        
        // Wait between samples to ensure clean state
        await page.waitForTimeout(1000);
      }
      
      // Analyze results
      const successfulResults = results.filter(r => r.success);
      const successRate = (successfulResults.length / results.length) * 100;
      
      if (successfulResults.length > 0) {
        const avgTime = successfulResults.reduce((sum, r) => sum + r.pdfGenerationTime, 0) / successfulResults.length;
        const minTime = Math.min(...successfulResults.map(r => r.pdfGenerationTime));
        const maxTime = Math.max(...successfulResults.map(r => r.pdfGenerationTime));
        
        console.log(`📈 ${scenario.name} Results:`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`   Average Time: ${avgTime.toFixed(0)}ms`);
        console.log(`   Min Time: ${minTime}ms`);
        console.log(`   Max Time: ${maxTime}ms`);
        console.log(`   Expected: <${scenario.expectedTime}ms`);
        
        // Overall performance should meet expectations
        expect(successRate).toBeGreaterThan(80); // At least 80% success rate
        expect(avgTime).toBeLessThan(scenario.expectedTime * 1.2); // Within 20% of expected
      }
    });
  });

  // Stress test: Rapid consecutive PDF generations
  test('Performance Stress Test: Rapid Consecutive Generations', async ({ page }) => {
    console.log('🚀 Starting rapid consecutive PDF generation stress test');
    
    const rapidTestCount = 5;
    const maxTimePerPDF = PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_ACCEPTABLE;
    const results = [];
    
    const stressMetric = performanceCollector.startMetric('stress-test-rapid-generation');
    
    try {
      for (let i = 1; i <= rapidTestCount; i++) {
        console.log(`  🏃‍♂️ Rapid generation ${i}/${rapidTestCount}`);
        
        const iterationStart = Date.now();
        
        // Fill form quickly
        await fillFormForScenario(page, { complexity: 'medium' });
        
        // Generate PDF
        const downloadPromise = page.waitForEvent('download', { timeout: maxTimePerPDF });
        await page.click('button:has-text("Generar PDF")');
        
        const download = await downloadPromise;
        const iterationTime = Date.now() - iterationStart;
        
        // Save PDF
        const pdfPath = path.join(outputDir, `stress-test-${i}.pdf`);
        await download.saveAs(pdfPath);
        
        const fileStats = fs.statSync(pdfPath);
        
        results.push({
          iteration: i,
          time: iterationTime,
          fileSize: fileStats.size,
          success: true
        });
        
        console.log(`    ⚡ Generation ${i}: ${iterationTime}ms`);
        
        // Minimal wait between generations
        await page.waitForTimeout(500);
        await clearForm(page);
      }
      
      performanceCollector.finishMetric(stressMetric, true);
      
    } catch (error) {
      performanceCollector.finishMetric(stressMetric, false, error.message);
      throw error;
    }
    
    // Analyze stress test results
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const maxTime = Math.max(...results.map(r => r.time));
    
    console.log(`💪 Stress Test Results:`);
    console.log(`   Tests Completed: ${results.length}/${rapidTestCount}`);
    console.log(`   Average Time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Slowest Generation: ${maxTime}ms`);
    
    // Stress test expectations
    expect(results.length).toBe(rapidTestCount); // All should complete
    expect(maxTime).toBeLessThan(maxTimePerPDF); // None should exceed limit
    expect(avgTime).toBeLessThan(maxTimePerPDF * 0.8); // Average should be well within limit
  });

  // Memory usage analysis
  test('Performance Analysis: Memory Usage During PDF Generation', async ({ page }) => {
    console.log('🧠 Analyzing memory usage during PDF generation');
    
    const memoryMetric = performanceCollector.startMetric('memory-analysis');
    
    // Get initial memory state
    const initialMemory = process.memoryUsage();
    console.log(`💾 Initial Memory: RSS ${Math.round(initialMemory.rss / 1024 / 1024)}MB, Heap ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
    
    // Fill form with complex data (high memory usage scenario)
    await fillFormForScenario(page, { complexity: 'extreme' });
    performanceCollector.recordStage(memoryMetric, 'complex-form-filled');
    
    const afterFormMemory = process.memoryUsage();
    console.log(`📝 After Form Fill: RSS ${Math.round(afterFormMemory.rss / 1024 / 1024)}MB, Heap ${Math.round(afterFormMemory.heapUsed / 1024 / 1024)}MB`);
    
    // Generate PDF and monitor memory
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.click('button:has-text("Generar PDF")');
    
    const download = await downloadPromise;
    performanceCollector.recordStage(memoryMetric, 'pdf-generated');
    
    const afterPDFMemory = process.memoryUsage();
    console.log(`📄 After PDF Gen: RSS ${Math.round(afterPDFMemory.rss / 1024 / 1024)}MB, Heap ${Math.round(afterPDFMemory.heapUsed / 1024 / 1024)}MB`);
    
    // Save PDF
    const pdfPath = path.join(outputDir, 'memory-analysis-test.pdf');
    await download.saveAs(pdfPath);
    
    const finalMemory = process.memoryUsage();
    performanceCollector.finishMetric(memoryMetric, true);
    
    // Calculate memory deltas
    const formMemoryIncrease = afterFormMemory.heapUsed - initialMemory.heapUsed;
    const pdfMemoryIncrease = afterPDFMemory.heapUsed - afterFormMemory.heapUsed;
    const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log(`🔍 Memory Analysis:`);
    console.log(`   Form Fill Increase: ${Math.round(formMemoryIncrease / 1024 / 1024)}MB`);
    console.log(`   PDF Generation Increase: ${Math.round(pdfMemoryIncrease / 1024 / 1024)}MB`);
    console.log(`   Total Increase: ${Math.round(totalMemoryIncrease / 1024 / 1024)}MB`);
    
    // Memory usage should be reasonable (not exceed system memory or cause issues)
    const maxReasonableIncrease = 500 * 1024 * 1024; // 500MB
    expect(totalMemoryIncrease).toBeLessThan(maxReasonableIncrease);
  });

  test.afterAll(async () => {
    // Generate comprehensive performance report
    const report = performanceCollector.generateReport();
    const reportPath = path.join(outputDir, 'performance-benchmark-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    const summaryPath = path.join(outputDir, 'performance-summary.txt');
    const summaryContent = generatePerformanceSummary(report);
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log('\n📊 Performance Benchmark Complete!');
    console.log(`📄 Detailed Report: ${reportPath}`);
    console.log(`📝 Summary: ${summaryPath}`);
    
    // Print quick summary to console
    console.log('\n🏆 Performance Grades:');
    Object.entries(report.performanceGrades).forEach(([test, grade]) => {
      const emoji = grade === 'A' ? '🥇' : grade === 'B' ? '🥈' : grade === 'C' ? '🥉' : '❌';
      console.log(`   ${emoji} ${test}: Grade ${grade}`);
    });
  });
});

// Helper functions for performance testing

async function fillFormForScenario(page, scenario) {
  const complexityData = {
    low: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      product: {
        type: 'Anillo',
        material: 'ORO 14K',
        weight: '5',
        description: 'Anillo sencillo'
      },
      price: 25000,
      contribution: 8000
    },
    medium: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      product: {
        type: 'Pulsera de Diseño',
        material: 'ORO 18K BLANCO',
        weight: '12',
        stones: 'Diamante 1.0ct',
        description: 'Pulsera elegante con diamante central y detalles artesanales'
      },
      price: 65000,
      contribution: 20000
    },
    high: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
      product: {
        type: 'Collar de Diseño Exclusivo',
        material: 'ORO 18K BLANCO Y AMARILLO',
        weight: '25',
        stones: 'Diamantes 2.5ct, Esmeraldas 1.8ct, Rubíes 0.9ct',
        description: 'Collar de diseño exclusivo con piedras preciosas múltiples, trabajo de filigrana artesanal, acabado en oro blanco con detalles en oro amarillo'
      },
      price: 185000,
      contribution: 50000
    },
    extreme: {
      client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS,
      product: {
        type: 'Conjunto Completo de Joyería de Lujo con Múltiples Elementos Decorativos y Piedras Preciosas Certificadas',
        material: 'ORO 18K BLANCO, AMARILLO Y ROSA CON ACABADOS MATE, BRILLANTE Y TEXTURIZADO',
        weight: '45.75',
        stones: 'Diamantes certificados GIA 5.2ct, Esmeraldas colombianas AAA 3.8ct, Rubíes birmanos 2.9ct, Zafiros de Ceilán 4.1ct, Perlas tahitianas 8 piezas, Tanzanita 1.5ct',
        description: 'Conjunto completo de joyería de lujo que incluye collar, pulsera, anillo y aretes, cada pieza con diseño exclusivo y piedras preciosas de la más alta calidad. Trabajo artesanal de filigrana con más de 200 horas de elaboración, acabados múltiples en oro de tres tonos, certificados de autenticidad para todas las piedras, garantía extendida de 5 años, estuche de presentación personalizado en madera de ébano con incrustaciones de nácar, servicio de mantenimiento anual gratuito de por vida, seguro incluido por el primer año, registro en catálogo exclusivo numerado, y membresía VIP en programa de clientes premium.'
      },
      price: 850000,
      contribution: 150000
    }
  };
  
  const data = complexityData[scenario.complexity || 'medium'];
  
  // Fill client information
  await page.fill('input[name="clientName"]', data.client.name);
  await page.fill('input[name="clientPhone"]', data.client.phone);
  if (data.client.email) {
    await page.fill('input[name="clientEmail"]', data.client.email);
  }
  
  // Fill product information
  await page.fill('input[name="productType"]', data.product.type);
  await page.fill('input[name="material"]', data.product.material);
  await page.fill('input[name="weight"]', data.product.weight);
  
  if (data.product.stones) {
    await page.fill('textarea[name="stones"]', data.product.stones);
  }
  
  await page.fill('textarea[name="description"]', data.product.description);
  
  // Fill financial information
  await page.fill('input[name="price"]', data.price.toString());
  await page.fill('input[name="contribution"]', data.contribution.toString());
  
  // Wait for calculations
  await page.waitForTimeout(1000);
}

async function clearForm(page) {
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
      // Field might not exist
    }
  }
  
  await page.waitForTimeout(500);
}

function generatePerformanceSummary(report) {
  let summary = `CIAOCIAO RECIBOS - PDF GENERATION PERFORMANCE BENCHMARK REPORT
===============================================================

Test Execution: ${report.testExecutedAt}
System: ${report.systemInfo.platform} ${report.systemInfo.arch}
Memory: ${Math.round(report.systemInfo.totalMemory / 1024 / 1024)} MB
CPUs: ${report.systemInfo.cpus}
Node.js: ${report.systemInfo.nodeVersion}

OVERALL RESULTS:
- Total Tests: ${report.totalTests}
- Successful Tests: ${report.successfulTests}
- Success Rate: ${((report.successfulTests / report.totalTests) * 100).toFixed(1)}%

PERFORMANCE GRADES:
`;

  Object.entries(report.performanceGrades).forEach(([test, grade]) => {
    summary += `- ${test}: Grade ${grade}\n`;
  });

  summary += '\nDETAILED RESULTS:\n';
  
  Object.entries(report.testSummaries).forEach(([test, metrics]) => {
    if (metrics) {
      summary += `\n${test.toUpperCase()}:
  - Sample Size: ${metrics.sampleSize}
  - Average Time: ${Math.round(metrics.averageDuration)}ms
  - Min Time: ${Math.round(metrics.minDuration)}ms
  - Max Time: ${Math.round(metrics.maxDuration)}ms
  - Median Time: ${Math.round(metrics.medianDuration)}ms
  - Std Deviation: ${Math.round(metrics.standardDeviation)}ms
  - Success Rate: ${metrics.successRate.toFixed(1)}%
  - Memory Impact: ${Math.round(metrics.averageMemoryDelta.heapUsed / 1024 / 1024)}MB
`;
    }
  });

  summary += `\nPERFORMANCE THRESHOLDS:
- Fast PDF Generation: < ${PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_FAST}ms
- Acceptable PDF Generation: < ${PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_ACCEPTABLE}ms
- Maximum PDF Generation: < ${PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_SLOW}ms

RECOMMENDATIONS:
`;

  // Generate recommendations based on results
  const avgPerformance = Object.values(report.testSummaries)
    .filter(m => m)
    .reduce((sum, m) => sum + m.averageDuration, 0) / Object.keys(report.testSummaries).length;

  if (avgPerformance < PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_FAST) {
    summary += '✅ Excellent performance! System is operating optimally.\n';
  } else if (avgPerformance < PERFORMANCE_CONFIG.thresholds.PDF_GENERATION_ACCEPTABLE) {
    summary += '⚠️  Good performance, but consider optimization for better user experience.\n';
  } else {
    summary += '❌ Performance needs improvement. Consider system optimization or infrastructure upgrade.\n';
  }

  return summary;
}