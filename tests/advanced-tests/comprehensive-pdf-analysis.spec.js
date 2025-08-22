// tests/advanced-tests/comprehensive-pdf-analysis.spec.js
// Comprehensive PDF Analysis and Root Cause Investigation

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Context7Config, Context7Utils } from '../context7/context7.config.js';
import { CanvasAnalyzer } from '../pdf-debugging/canvas-analyzer.js';
import { ScalingValidator } from '../pdf-debugging/scaling-validator.js';
import { PDFPageCounter } from '../utilities/pdf-page-counter.js';
import { ScalingCalculator } from '../utilities/scaling-calculator.js';

test.describe('Comprehensive PDF Multi-Page Analysis Suite', () => {
  let canvasAnalyzer;
  let scalingValidator;
  let pdfPageCounter;
  let scalingCalculator;
  let sessionData;

  test.beforeAll(async () => {
    // Initialize all analysis tools
    canvasAnalyzer = new CanvasAnalyzer();
    scalingValidator = new ScalingValidator();
    pdfPageCounter = new PDFPageCounter();
    scalingCalculator = new ScalingCalculator();

    sessionData = {
      sessionId: Context7Utils.generateTestId(),
      startTime: Date.now(),
      testResults: [],
      issues: [],
      scalingAnalysis: [],
      recommendations: []
    };

    // Ensure directories exist
    const testDirs = [
      './test-results/comprehensive-analysis',
      './test-results/scaling-tests', 
      './test-results/root-cause-reports'
    ];

    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log(`🔬 Starting Comprehensive PDF Analysis - Session: ${sessionData.sessionId}`);
  });

  test('COMP-001: Root Cause Analysis - Veronica Mancilla Case Deep Dive', async ({ page }) => {
    const testId = `COMP-001-${Date.now()}`;
    const analysisResults = {
      testId,
      phase: 'root_cause_analysis',
      findings: {},
      issues: [],
      recommendations: []
    };

    await test.step('Setup comprehensive monitoring', async () => {
      // Inject advanced debugging instrumentation
      await page.addInitScript(() => {
        window.comprehensiveDebugger = {
          htmlToCanvas: [],
          scalingOperations: [],
          pdfGeneration: [],
          domMutations: [],
          performanceMarks: []
        };

        // Override html2canvas to capture detailed data
        const originalHtml2Canvas = window.html2canvas;
        window.html2canvas = async function(element, options) {
          const startTime = performance.now();
          
          window.comprehensiveDebugger.htmlToCanvas.push({
            timestamp: Date.now(),
            elementInfo: {
              tagName: element.tagName,
              className: element.className,
              dimensions: {
                scrollWidth: element.scrollWidth,
                scrollHeight: element.scrollHeight,
                offsetWidth: element.offsetWidth,
                offsetHeight: element.offsetHeight
              }
            },
            options: options,
            phase: 'start'
          });

          try {
            const result = await originalHtml2Canvas(element, options);
            const endTime = performance.now();
            
            window.comprehensiveDebugger.htmlToCanvas.push({
              timestamp: Date.now(),
              canvasResult: {
                width: result.width,
                height: result.height,
                hasContent: result.getContext('2d').getImageData(0, 0, result.width, result.height).data.some(pixel => pixel !== 255)
              },
              processingTime: endTime - startTime,
              phase: 'complete'
            });
            
            return result;
          } catch (error) {
            window.comprehensiveDebugger.htmlToCanvas.push({
              timestamp: Date.now(),
              error: error.message,
              phase: 'error'
            });
            throw error;
          }
        };

        // Monitor DOM mutations that might affect PDF generation
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.target.classList?.contains('pdf-content') || 
                mutation.target.id === 'receiptPreview') {
              window.comprehensiveDebugger.domMutations.push({
                timestamp: Date.now(),
                type: mutation.type,
                target: mutation.target.tagName,
                addedNodes: mutation.addedNodes.length,
                removedNodes: mutation.removedNodes.length
              });
            }
          });
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      });

      await page.goto(`${Context7Config.environment.baseURL}/receipt-mode.html`);
      await page.fill('#passwordInput', Context7Config.environment.password);
      await page.click('#loginBtn');
      await page.waitForSelector('#receiptForm');
    });

    await test.step('Fill Veronica Mancilla data with measurement', async () => {
      // Fill exact Veronica Mancilla case data
      await page.fill('#receiptDate', '2025-08-21');
      await page.selectOption('#transactionType', 'venta');
      
      await page.fill('#clientName', 'Veronica Mancilla gonzalez');
      await page.fill('#clientPhone', '55 2690 5104');
      await page.fill('#clientEmail', 'vermango13@yahoo.com.mx');
      
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

      // Trigger calculations and measure
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(1000);

      const calculations = await page.evaluate(() => ({
        subtotal: parseFloat(document.getElementById('subtotal').value) || 0,
        balance: parseFloat(document.getElementById('balance').value) || 0,
        deposit: parseFloat(document.getElementById('deposit').value) || 0,
        price: parseFloat(document.getElementById('price').value) || 0,
        contribution: parseFloat(document.getElementById('contribution').value) || 0
      }));

      analysisResults.findings.calculations = calculations;
      
      // Validate Veronica's specific calculations
      expect(calculations.subtotal).toBe(78300);
      expect(calculations.balance).toBe(78300);
    });

    await test.step('Analyze content structure before PDF generation', async () => {
      // Generate preview for analysis
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');

      // Comprehensive content analysis
      const contentAnalysis = await page.evaluate(() => {
        const preview = document.getElementById('receiptPreview');
        if (!preview) return null;

        const sections = preview.querySelectorAll('div, section, h1, h2, h3, h4');
        const images = preview.querySelectorAll('img');
        const textElements = preview.querySelectorAll('p, span, div');

        return {
          dimensions: {
            scrollWidth: preview.scrollWidth,
            scrollHeight: preview.scrollHeight,
            offsetWidth: preview.offsetWidth,
            offsetHeight: preview.offsetHeight,
            clientWidth: preview.clientWidth,
            clientHeight: preview.clientHeight
          },
          content: {
            sectionCount: sections.length,
            imageCount: images.length,
            textElementCount: textElements.length,
            totalTextLength: Array.from(textElements).reduce((sum, el) => sum + (el.textContent?.length || 0), 0),
            hasOverflow: {
              horizontal: preview.scrollWidth > preview.clientWidth,
              vertical: preview.scrollHeight > preview.clientHeight
            }
          },
          structure: Array.from(sections).map((section, index) => ({
            index,
            tagName: section.tagName,
            className: section.className,
            textLength: section.textContent?.length || 0,
            dimensions: {
              width: section.offsetWidth,
              height: section.offsetHeight,
              top: section.offsetTop
            }
          }))
        };
      });

      analysisResults.findings.contentAnalysis = contentAnalysis;

      console.log('📐 Content Analysis:', {
        height: contentAnalysis?.dimensions.scrollHeight,
        overflow: contentAnalysis?.content.hasOverflow,
        sections: contentAnalysis?.content.sectionCount
      });

      await page.click('#closePreview');
    });

    await test.step('Test all scaling algorithms', async () => {
      const contentDims = analysisResults.findings.contentAnalysis?.dimensions;
      if (contentDims) {
        const algorithmComparison = scalingCalculator.compareAllAlgorithms(
          contentDims.scrollWidth, 
          contentDims.scrollHeight,
          { contentMetadata: analysisResults.findings.contentAnalysis.content }
        );

        analysisResults.findings.scalingAlgorithms = algorithmComparison;

        console.log('🔧 Scaling Algorithm Analysis:', {
          recommended: algorithmComparison.recommendation?.algorithm,
          fittingAlgorithms: algorithmComparison.comparison.fittingAlgorithms,
          averageUtilization: algorithmComparison.comparison.averageUtilization.toFixed(1)
        });

        // Test if current algorithm is the best
        if (algorithmComparison.recommendation?.algorithm !== 'current') {
          analysisResults.issues.push({
            type: 'OPTIMIZATION',
            category: 'SCALING_ALGORITHM',
            message: `Current algorithm is not optimal. Recommended: ${algorithmComparison.recommendation?.algorithm}`,
            currentScore: algorithmComparison.algorithms.find(a => a.name === 'current')?.result?.utilizationScore || 0,
            recommendedScore: algorithmComparison.recommendation?.score || 0
          });
        }
      }
    });

    await test.step('Generate PDF with comprehensive monitoring', async () => {
      const downloadPath = `./test-results/comprehensive-analysis/${testId}`;
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }

      const downloadPromise = page.waitForEvent('download');
      const startTime = Date.now();

      await page.click('#generatePdfBtn');

      const download = await downloadPromise;
      const generationTime = Date.now() - startTime;
      
      const pdfPath = path.join(downloadPath, 'veronica-analysis.pdf');
      await download.saveAs(pdfPath);

      // Comprehensive PDF analysis
      const pdfAnalysis = await pdfPageCounter.analyzePDFStructure(pdfPath);
      analysisResults.findings.pdfAnalysis = pdfAnalysis;

      console.log('📄 PDF Analysis:', {
        pages: pdfAnalysis.pageCount,
        size: `${(pdfAnalysis.fileSize / 1024).toFixed(1)}KB`,
        generationTime: `${generationTime}ms`
      });

      // Critical issue if multi-page
      if (pdfAnalysis.pageCount > 1) {
        analysisResults.issues.push({
          type: 'CRITICAL',
          category: 'MULTI_PAGE_PDF',
          message: `PDF generated ${pdfAnalysis.pageCount} pages instead of 1`,
          details: {
            pageCount: pdfAnalysis.pageCount,
            fileSize: pdfAnalysis.fileSize,
            generationTime
          }
        });
      }

      analysisResults.findings.performance = {
        generationTime,
        expectedTime: Context7Config.performance.maxPDFGenerationTime
      };
    });

    await test.step('Collect comprehensive debug data', async () => {
      const debugData = await page.evaluate(() => window.comprehensiveDebugger || {});
      analysisResults.findings.debugData = debugData;

      // Analyze html2canvas operations
      const canvasOps = debugData.htmlToCanvas || [];
      const completedOps = canvasOps.filter(op => op.phase === 'complete');
      const errorOps = canvasOps.filter(op => op.phase === 'error');

      if (errorOps.length > 0) {
        analysisResults.issues.push({
          type: 'ERROR',
          category: 'CANVAS_GENERATION',
          message: `${errorOps.length} html2canvas operations failed`,
          errors: errorOps.map(op => op.error)
        });
      }

      if (completedOps.length > 0) {
        const avgProcessingTime = completedOps.reduce((sum, op) => sum + op.processingTime, 0) / completedOps.length;
        analysisResults.findings.canvasPerformance = {
          operationCount: completedOps.length,
          averageProcessingTime: avgProcessingTime,
          totalProcessingTime: completedOps.reduce((sum, op) => sum + op.processingTime, 0)
        };

        if (avgProcessingTime > 5000) { // 5 seconds
          analysisResults.issues.push({
            type: 'WARNING',
            category: 'PERFORMANCE',
            message: `Canvas generation is slow (${avgProcessingTime.toFixed(0)}ms average)`,
            suggestion: 'Consider optimizing content size or html2canvas settings'
          });
        }
      }
    });

    await test.step('Generate root cause analysis report', async () => {
      // Determine root causes
      const rootCauses = [];

      if (analysisResults.findings.pdfAnalysis?.pageCount > 1) {
        // Multi-page root cause analysis
        const contentHeight = analysisResults.findings.contentAnalysis?.dimensions.scrollHeight || 0;
        const scalingResult = analysisResults.findings.scalingAlgorithms?.algorithms.find(a => a.name === 'current')?.result;

        if (contentHeight > 1500) {
          rootCauses.push({
            cause: 'EXCESSIVE_CONTENT_HEIGHT',
            details: `Content height (${contentHeight}px) exceeds optimal size for single page`,
            severity: 'HIGH',
            solution: 'Implement content compression or better scaling algorithm'
          });
        }

        if (scalingResult && !scalingResult.fitsInPage) {
          rootCauses.push({
            cause: 'SCALING_ALGORITHM_FAILURE',
            details: `Current scaling algorithm fails to fit content on single page`,
            severity: 'CRITICAL',
            solution: `Implement ${analysisResults.findings.scalingAlgorithms?.recommendation?.algorithm} algorithm`
          });
        }

        if (analysisResults.findings.contentAnalysis?.content.hasOverflow.vertical) {
          rootCauses.push({
            cause: 'CONTENT_OVERFLOW',
            details: 'Content has vertical overflow before scaling',
            severity: 'MEDIUM',
            solution: 'Review CSS layout and container constraints'
          });
        }
      }

      analysisResults.findings.rootCauses = rootCauses;

      // Generate recommendations
      if (rootCauses.length > 0) {
        const recommendedAlgorithm = analysisResults.findings.scalingAlgorithms?.recommendation?.algorithm;
        if (recommendedAlgorithm && recommendedAlgorithm !== 'current') {
          const implementation = scalingCalculator.generateImplementationCode(
            recommendedAlgorithm,
            analysisResults.findings.contentAnalysis?.dimensions.scrollWidth || 900,
            analysisResults.findings.contentAnalysis?.dimensions.scrollHeight || 1200
          );

          analysisResults.recommendations.push({
            priority: 'HIGH',
            title: `Implement ${recommendedAlgorithm} Scaling Algorithm`,
            description: `Replace current scaling with ${recommendedAlgorithm} for better results`,
            implementation: implementation.jsCode,
            testCode: implementation.testCode,
            expectedImprovement: `${(implementation.result.utilizationScore - (scalingResult?.utilizationScore || 0)).toFixed(1)}% better utilization`
          });
        }
      }

      // Save comprehensive report
      const reportPath = `./test-results/root-cause-reports/${testId}-analysis.json`;
      fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));

      console.log(`📋 Root Cause Analysis Complete:`, {
        issues: analysisResults.issues.length,
        rootCauses: rootCauses.length,
        recommendations: analysisResults.recommendations.length,
        report: reportPath
      });
    });

    sessionData.testResults.push(analysisResults);
  });

  test('COMP-002: Scaling Algorithm Stress Test', async ({ page }) => {
    const testId = `COMP-002-${Date.now()}`;
    const stressResults = {
      testId,
      phase: 'scaling_stress_test',
      scenarios: [],
      performance: {},
      failures: []
    };

    await page.goto(`${Context7Config.environment.baseURL}/receipt-mode.html`);
    await page.fill('#passwordInput', Context7Config.environment.password);
    await page.click('#loginBtn');
    await page.waitForSelector('#receiptForm');

    // Define stress test scenarios
    const stressScenarios = [
      {
        name: 'minimal_content',
        dimensions: { width: 400, height: 300 },
        description: 'Very small content'
      },
      {
        name: 'normal_content', 
        dimensions: { width: 800, height: 1000 },
        description: 'Normal receipt size'
      },
      {
        name: 'large_content',
        dimensions: { width: 1200, height: 1800 },
        description: 'Large receipt with lots of content'
      },
      {
        name: 'very_large_content',
        dimensions: { width: 1500, height: 2400 },
        description: 'Extreme content size'
      },
      {
        name: 'wide_content',
        dimensions: { width: 1400, height: 800 },
        description: 'Very wide content'
      },
      {
        name: 'tall_content',
        dimensions: { width: 600, height: 2000 },
        description: 'Very tall content'
      }
    ];

    for (const scenario of stressScenarios) {
      await test.step(`Test scenario: ${scenario.name}`, async () => {
        const scenarioResult = {
          scenario: scenario.name,
          input: scenario.dimensions,
          algorithms: {},
          performance: {},
          recommendation: null
        };

        // Test all scaling algorithms for this scenario
        const algorithmComparison = scalingCalculator.compareAllAlgorithms(
          scenario.dimensions.width,
          scenario.dimensions.height,
          { 
            contentMetadata: { 
              textLength: scenario.dimensions.width * scenario.dimensions.height / 1000,
              complexity: 'medium'
            }
          }
        );

        scenarioResult.algorithms = algorithmComparison;
        scenarioResult.recommendation = algorithmComparison.recommendation;

        // Check for failures
        const fittingAlgorithms = algorithmComparison.algorithms.filter(a => a.result.fitsInPage);
        if (fittingAlgorithms.length === 0) {
          stressResults.failures.push({
            scenario: scenario.name,
            issue: 'NO_FITTING_ALGORITHMS',
            details: 'No scaling algorithm can fit this content on single page'
          });
        }

        // Performance analysis
        const currentAlgorithm = algorithmComparison.algorithms.find(a => a.name === 'current');
        const recommendedAlgorithm = algorithmComparison.recommendation;

        if (currentAlgorithm && recommendedAlgorithm && 
            currentAlgorithm.result.utilizationScore < recommendedAlgorithm.score * 0.8) {
          stressResults.failures.push({
            scenario: scenario.name,
            issue: 'POOR_CURRENT_PERFORMANCE',
            details: `Current algorithm performs poorly (${currentAlgorithm.result.utilizationScore.toFixed(1)}% vs ${recommendedAlgorithm.score.toFixed(1)}%)`
          });
        }

        stressResults.scenarios.push(scenarioResult);

        console.log(`📊 Scenario ${scenario.name}:`, {
          fittingAlgorithms: fittingAlgorithms.length,
          recommended: recommendedAlgorithm?.algorithm,
          score: recommendedAlgorithm?.score?.toFixed(1)
        });
      });
    }

    await test.step('Analyze stress test results', async () => {
      // Overall performance analysis
      const totalScenarios = stressResults.scenarios.length;
      const successfulScenarios = stressResults.scenarios.filter(s => 
        s.algorithms.algorithms.some(a => a.result.fitsInPage)).length;

      stressResults.performance = {
        totalScenarios,
        successfulScenarios,
        successRate: (successfulScenarios / totalScenarios) * 100,
        averageUtilization: stressResults.scenarios.reduce((sum, s) => 
          sum + (s.recommendation?.score || 0), 0) / totalScenarios,
        criticalFailures: stressResults.failures.filter(f => f.issue === 'NO_FITTING_ALGORITHMS').length
      };

      // Save stress test report
      const reportPath = `./test-results/scaling-tests/${testId}-stress-test.json`;
      fs.writeFileSync(reportPath, JSON.stringify(stressResults, null, 2));

      console.log(`🔥 Stress Test Complete:`, {
        successRate: `${stressResults.performance.successRate.toFixed(1)}%`,
        criticalFailures: stressResults.performance.criticalFailures,
        report: reportPath
      });
    });

    sessionData.testResults.push(stressResults);
  });

  test('COMP-003: Real-World Content Simulation', async ({ page }) => {
    const testId = `COMP-003-${Date.now()}`;
    
    await page.goto(`${Context7Config.environment.baseURL}/receipt-mode.html`);
    await page.fill('#passwordInput', Context7Config.environment.password);
    await page.click('#loginBtn');
    await page.waitForSelector('#receiptForm');

    // Real-world test cases based on actual problematic scenarios
    const realWorldCases = [
      {
        name: 'veronica_exact',
        clientName: 'Veronica Mancilla gonzalez',
        phone: '55 2690 5104',
        email: 'vermango13@yahoo.com.mx',
        pieceType: 'pulsera',
        material: 'oro-14k',
        weight: '9',
        stones: 'ZAFIRO 5.15 cts',
        description: 'Oro Blanco',
        price: 39150,
        contribution: 39150,
        deliveryStatus: 'entregado'
      },
      {
        name: 'complex_order',
        clientName: 'María Elena Rodríguez González de la Torre',
        phone: '+52 55 1234 5678 ext 901',
        email: 'maria.elena.rodriguez.gonzalez@email.muy.largo.com',
        pieceType: 'collar',
        material: 'oro-18k',
        weight: '25.75',
        stones: 'Diamantes 2.5ct (corte brillante), Esmeraldas 1.8ct (corte esmeralda), Rubíes 0.9ct (corte óvalo)',
        description: 'Collar de diseño exclusivo con trabajo de filigrana artesanal, acabado espejo, incluye cadena de seguridad, estuche de terciopelo, certificado de autenticidad y garantía extendida de por vida. Pieza única creada especialmente para el cliente con técnicas tradicionales mexicanas.',
        price: 45000,
        contribution: 5000,
        deliveryStatus: 'proceso'
      },
      {
        name: 'simple_order',
        clientName: 'Ana López',
        phone: '5512345678',
        email: 'ana@test.com',
        pieceType: 'anillo',
        material: 'oro-14k',
        weight: '3.5',
        stones: '',
        description: 'Anillo sencillo',
        price: 8000,
        contribution: 0,
        deliveryStatus: 'entregado'
      }
    ];

    const realWorldResults = [];

    for (const testCase of realWorldCases) {
      await test.step(`Real-world test: ${testCase.name}`, async () => {
        // Fill form with test case data
        await page.fill('#clientName', testCase.clientName);
        await page.fill('#clientPhone', testCase.phone);
        await page.fill('#clientEmail', testCase.email);
        await page.selectOption('#pieceType', testCase.pieceType);
        await page.selectOption('#material', testCase.material);
        await page.fill('#weight', testCase.weight);
        await page.fill('#stones', testCase.stones);
        await page.fill('#description', testCase.description);
        await page.fill('#price', testCase.price.toString());
        await page.fill('#contribution', testCase.contribution.toString());
        await page.selectOption('#deliveryStatus', testCase.deliveryStatus);

        // Trigger calculations
        await page.click('#price');
        await page.press('#price', 'Tab');
        await page.waitForTimeout(500);

        // Generate PDF and analyze
        const downloadPromise = page.waitForEvent('download');
        await page.click('#generatePdfBtn');
        
        const download = await downloadPromise;
        const pdfPath = `./test-results/comprehensive-analysis/${testId}-${testCase.name}.pdf`;
        await download.saveAs(pdfPath);

        // Analyze the generated PDF
        const pdfAnalysis = await pdfPageCounter.analyzePDFStructure(pdfPath);
        
        realWorldResults.push({
          testCase: testCase.name,
          contentComplexity: {
            nameLength: testCase.clientName.length,
            descriptionLength: testCase.description.length,
            stonesLength: testCase.stones.length,
            totalTextLength: testCase.clientName.length + testCase.description.length + testCase.stones.length
          },
          result: {
            pageCount: pdfAnalysis.pageCount,
            fileSize: pdfAnalysis.fileSize,
            issues: pdfAnalysis.issues.length,
            success: pdfAnalysis.pageCount === 1
          }
        });

        console.log(`🌍 Real-world test ${testCase.name}:`, {
          pages: pdfAnalysis.pageCount,
          success: pdfAnalysis.pageCount === 1 ? '✅' : '❌',
          textComplexity: testCase.clientName.length + testCase.description.length + testCase.stones.length
        });

        // Reset form for next test
        if (testCase !== realWorldCases[realWorldCases.length - 1]) {
          await page.reload();
          await page.fill('#passwordInput', Context7Config.environment.password);
          await page.click('#loginBtn');
          await page.waitForSelector('#receiptForm');
        }
      });
    }

    // Analyze correlation between content complexity and success
    const complexityAnalysis = {
      tests: realWorldResults,
      correlation: {
        successByComplexity: {},
        averageComplexity: realWorldResults.reduce((sum, r) => sum + r.contentComplexity.totalTextLength, 0) / realWorldResults.length,
        successRate: realWorldResults.filter(r => r.result.success).length / realWorldResults.length
      }
    };

    // Save real-world analysis
    const reportPath = `./test-results/comprehensive-analysis/${testId}-real-world.json`;
    fs.writeFileSync(reportPath, JSON.stringify(complexityAnalysis, null, 2));

    sessionData.testResults.push(complexityAnalysis);
  });

  test.afterAll(async () => {
    // Generate comprehensive session report
    sessionData.endTime = Date.now();
    sessionData.duration = sessionData.endTime - sessionData.startTime;

    const sessionReport = {
      session: sessionData,
      summary: {
        totalTests: sessionData.testResults.length,
        duration: sessionData.duration,
        totalIssues: sessionData.testResults.reduce((sum, result) => 
          sum + (result.issues?.length || 0), 0),
        criticalIssues: sessionData.testResults.reduce((sum, result) => 
          sum + (result.issues?.filter(i => i.type === 'CRITICAL').length || 0), 0)
      },
      analysis: {
        rootCauses: sessionData.testResults
          .filter(r => r.findings?.rootCauses)
          .flatMap(r => r.findings.rootCauses),
        recommendations: sessionData.testResults
          .filter(r => r.recommendations)
          .flatMap(r => r.recommendations),
        performanceMetrics: {
          canvasAnalysis: canvasAnalyzer.generateReport(),
          scalingValidation: scalingValidator.generateScalingReport(),
          pdfPageAnalysis: pdfPageCounter.generateAnalysisReport()
        }
      },
      conclusions: []
    };

    // Generate final conclusions
    const multiPageIssues = sessionData.testResults.filter(r => 
      r.findings?.pdfAnalysis?.pageCount > 1 || 
      r.result?.pageCount > 1 ||
      (r.scenarios && r.scenarios.some(s => s.algorithms.algorithms.some(a => !a.result.fitsInPage)))
    );

    if (multiPageIssues.length > 0) {
      sessionReport.conclusions.push({
        type: 'CRITICAL_FINDING',
        title: 'Multi-Page PDF Generation Confirmed',
        description: `${multiPageIssues.length} tests confirmed multi-page PDF generation issue`,
        priority: 'IMMEDIATE_ACTION_REQUIRED',
        nextSteps: [
          'Implement recommended scaling algorithm',
          'Add content size validation',
          'Create automated prevention system',
          'Deploy fix and re-test all scenarios'
        ]
      });
    }

    // Save final session report
    const finalReportPath = `./test-results/comprehensive-analysis/session-${sessionData.sessionId}-FINAL.json`;
    fs.writeFileSync(finalReportPath, JSON.stringify(sessionReport, null, 2));

    console.log('\n========================================');
    console.log('🔬 COMPREHENSIVE PDF ANALYSIS COMPLETE');
    console.log('========================================');
    console.log(`Session ID: ${sessionData.sessionId}`);
    console.log(`Duration: ${(sessionData.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Tests Executed: ${sessionReport.summary.totalTests}`);
    console.log(`Critical Issues: ${sessionReport.summary.criticalIssues}`);
    console.log(`Total Issues: ${sessionReport.summary.totalIssues}`);
    console.log(`Final Report: ${finalReportPath}`);
    console.log('========================================\n');

    // Update todo list with results
    sessionData.finalReport = finalReportPath;
  });
});

// Export session data for other tests to use
export { sessionData };