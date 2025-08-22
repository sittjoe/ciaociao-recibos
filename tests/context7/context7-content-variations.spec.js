// tests/context7/context7-content-variations.spec.js
// Context7 Tests for Different Content Lengths and Receipt Types
// Tests various content scenarios to validate single-page PDF generation

import { test, expect } from '@playwright/test';
import { Context7Config, Context7Utils } from './context7.config.js';
import { PDFPageCounter } from '../utilities/pdf-page-counter.js';
import path from 'path';
import fs from 'fs';

// Test scenarios with varying content lengths
const TEST_SCENARIOS = [
  {
    name: 'minimal_content',
    description: 'Minimal content to test lower bounds',
    client: {
      name: 'Ana',
      phone: '5551234567',
      email: 'ana@test.com'
    },
    product: {
      type: 'anillo',
      material: 'oro-14k',
      weight: '2',
      stones: '',
      description: 'Anillo simple'
    },
    financial: {
      price: 5000,
      contribution: 5000,
      deposit: 0,
      deliveryStatus: 'entregado'
    }
  },
  {
    name: 'medium_content',
    description: 'Medium content length',
    client: {
      name: 'Carlos Rodriguez Martinez',
      phone: '55 1234 5678',
      email: 'carlos.rodriguez@email.com'
    },
    product: {
      type: 'collar',
      material: 'oro-18k',
      weight: '15',
      stones: 'Diamantes 1.2ct, Rubíes 0.8ct',
      description: 'Collar elegante con diamantes y rubíes, diseño clásico con acabado brillante'
    },
    financial: {
      price: 25000,
      contribution: 10000,
      deposit: 15000,
      deliveryStatus: 'proceso'
    }
  },
  {
    name: 'maximum_content',
    description: 'Maximum content to test upper bounds',
    client: {
      name: 'María Guadalupe Fernández de la Cruz y Villalobos',
      phone: '55 9876 5432 ext 1234',
      email: 'maria.guadalupe.fernandez.delacruz@dominio.muy.largo.empresa.com'
    },
    product: {
      type: 'collar',
      material: 'oro-18k',
      weight: '45.75',
      stones: 'Diamantes certificados GIA 5.25ct (color D, claridad VVS1), Esmeraldas colombianas 3.8ct, Rubíes birmanos 2.4ct, Zafiros de Cachemira 1.9ct, Tanzanitas 1.2ct',
      description: 'Collar de diseño exclusivo y único, elaborado completamente a mano por maestros joyeros con más de 30 años de experiencia. Incluye filigrana artesanal en oro blanco de 18 quilates con detalles en oro amarillo y rosa. Las piedras preciosas han sido seleccionadas individualmente y cuentan con certificados de autenticidad internacionales. El collar incluye un sistema de cierre de seguridad patentado, cadena de seguridad adicional, estuche de lujo con certificado de garantía extendida por 5 años, seguro contra robo y pérdida, y servicio de mantenimiento anual gratuito. Diseño registrado exclusivamente para CIAOCIAO.MX.'
    },
    financial: {
      price: 125000,
      contribution: 50000,
      deposit: 75000,
      deliveryStatus: 'pendiente'
    }
  },
  {
    name: 'complex_financial',
    description: 'Complex financial scenario with multiple payments',
    client: {
      name: 'Isabella Montes de Oca',
      phone: '55 2468 1357',
      email: 'isabella.montes@gmail.com'
    },
    product: {
      type: 'pulsera',
      material: 'oro-14k',
      weight: '18',
      stones: 'Perlas cultivadas 12mm, Diamantes 0.5ct',
      description: 'Pulsera con perlas cultivadas de agua salada y diamantes'
    },
    financial: {
      price: 35000,
      contribution: 15000,
      deposit: 20000,
      deliveryStatus: 'entregado'
    }
  },
  {
    name: 'special_characters',
    description: 'Content with special characters and accents',
    client: {
      name: 'François José María Ñuñez-Güemes',
      phone: '+52 (55) 1234-5678',
      email: 'françois.josé@cañón-ñuñez.mx'
    },
    product: {
      type: 'anillo',
      material: 'oro-18k',
      weight: '8',
      stones: 'Ágata, Ónice, Ámbar',
      description: 'Anillo único con diseño especial: símbolos ♦♠♣♥, caracteres ñ, ü, á, é, í, ó, ú'
    },
    financial: {
      price: 18000,
      contribution: 18000,
      deposit: 0,
      deliveryStatus: 'entregado'
    }
  }
];

test.describe('Context7 Content Variations Tests', () => {
  let pdfPageCounter;
  let testResults = [];

  test.beforeAll(async () => {
    pdfPageCounter = new PDFPageCounter();
  });

  TEST_SCENARIOS.forEach((scenario, index) => {
    test(`${scenario.name} - ${scenario.description}`, async ({ page }) => {
      const testId = `ctx7-var-${scenario.name}-${Context7Utils.generateTestId()}`;
      const downloadPath = Context7Utils.createDownloadPath(testId);
      let consoleLogs = [];

      // Create download directory
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }

      // Set up logging and download handling
      page.on('console', msg => {
        const logEntry = {
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        };
        consoleLogs.push(logEntry);
      });

      page.on('download', async download => {
        const filename = download.suggestedFilename() || `${scenario.name}-${testId}.pdf`;
        const downloadFilePath = path.join(downloadPath, filename);
        await download.saveAs(downloadFilePath);
        Context7Utils.log(`PDF downloaded for ${scenario.name}: ${downloadFilePath}`);
      });

      Context7Utils.log(`Starting content variation test: ${scenario.name}`, scenario);

      try {
        // Step 1: Navigate and authenticate
        await page.goto(Context7Config.environment.productionURL, { 
          waitUntil: 'networkidle',
          timeout: Context7Config.performance.maxPageLoadTime 
        });

        // Handle authentication
        const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[placeholder*="contraseña"]');
        await expect(passwordInput).toBeVisible({ timeout: 10000 });
        await passwordInput.fill(Context7Config.environment.password);
        await passwordInput.press('Enter');
        await page.waitForLoadState('networkidle');

        // Step 2: Wait for form and fill data
        await page.waitForSelector('input[placeholder*="Cliente"], input[placeholder*="Nombre"]', { 
          timeout: 15000 
        });

        const formFillStart = Date.now();

        // Fill client information
        await page.fill('input[placeholder*="Cliente"], input[placeholder*="Nombre"]', scenario.client.name);
        await page.fill('input[placeholder*="Teléfono"], input[placeholder*="Tel"]', scenario.client.phone);
        await page.fill('input[placeholder*="Email"], input[placeholder*="Correo"]', scenario.client.email);

        // Fill product information
        await page.selectOption('select:has-text("Tipo"), select[name*="tipo"]', scenario.product.type);
        await page.selectOption('select:has-text("Material"), select[name*="material"]', scenario.product.material);
        await page.fill('input[placeholder*="Peso"], input[name*="peso"]', scenario.product.weight);
        
        if (scenario.product.stones) {
          await page.fill('input[placeholder*="Piedras"], textarea[placeholder*="Piedras"]', scenario.product.stones);
        }
        
        await page.fill('textarea[placeholder*="Descripción"], textarea[name*="descripcion"]', scenario.product.description);

        // Fill financial information
        await page.fill('input[placeholder*="Precio"], input[name*="precio"]', scenario.financial.price.toString());
        await page.fill('input[placeholder*="Aporte"], input[name*="aporte"]', scenario.financial.contribution.toString());
        await page.fill('input[placeholder*="Anticipo"], input[name*="anticipo"]', scenario.financial.deposit.toString());
        await page.selectOption('select:has-text("Estado"), select[name*="estado"]', scenario.financial.deliveryStatus);

        const formFillTime = Date.now() - formFillStart;

        // Step 3: Take screenshot before PDF generation
        await Context7Utils.takeDebugScreenshot(page, testId, `${scenario.name}-before-pdf`);

        // Step 4: Capture content dimensions for analysis
        const contentMetrics = await page.evaluate(() => {
          const receiptContainer = document.querySelector('.receipt-container, .pdf-content, .receipt-preview');
          if (receiptContainer) {
            return {
              scrollHeight: receiptContainer.scrollHeight,
              clientHeight: receiptContainer.clientHeight,
              offsetHeight: receiptContainer.offsetHeight,
              contentOverflow: receiptContainer.scrollHeight > receiptContainer.clientHeight
            };
          }
          return null;
        });

        // Step 5: Generate PDF
        const pdfGenerationStart = Date.now();
        
        const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Generar"), button[onclick*="pdf"], button[class*="pdf"]');
        await expect(pdfButton).toBeVisible({ timeout: 5000 });
        
        const downloadPromise = page.waitForEvent('download', { 
          timeout: Context7Config.performance.maxPDFGenerationTime 
        });
        
        await pdfButton.click();
        const download = await downloadPromise;
        const pdfGenerationTime = Date.now() - pdfGenerationStart;

        // Step 6: Save and analyze PDF
        const pdfFilename = download.suggestedFilename() || `${scenario.name}-${testId}.pdf`;
        const pdfPath = path.join(downloadPath, pdfFilename);
        await download.saveAs(pdfPath);

        // Validate file exists and size
        expect(fs.existsSync(pdfPath)).toBeTruthy();
        const pdfStats = fs.statSync(pdfPath);
        expect(pdfStats.size).toBeGreaterThan(Context7Config.pdf.minFileSize);

        // Analyze PDF structure
        const pdfAnalysis = await pdfPageCounter.analyzePDFStructure(pdfPath);

        // Step 7: Assert single page requirement
        expect(pdfAnalysis.pageCount).toBe(1);

        // Step 8: Record test results
        const testResult = {
          scenario: scenario.name,
          testId,
          status: 'PASSED',
          timestamp: new Date().toISOString(),
          contentComplexity: {
            clientNameLength: scenario.client.name.length,
            descriptionLength: scenario.product.description.length,
            totalContentLength: JSON.stringify(scenario).length,
            hasSpecialChars: /[ñáéíóúüÑÁÉÍÓÚÜ♦♠♣♥]/.test(JSON.stringify(scenario))
          },
          contentMetrics,
          pdfAnalysis: {
            pageCount: pdfAnalysis.pageCount,
            fileSize: pdfAnalysis.fileSize,
            structure: pdfAnalysis.structure
          },
          performance: {
            formFill: formFillTime,
            pdfGeneration: pdfGenerationTime
          },
          issues: pdfAnalysis.issues,
          filePath: pdfPath
        };

        testResults.push(testResult);

        Context7Utils.log(`${scenario.name} completed successfully`, {
          pageCount: pdfAnalysis.pageCount,
          fileSize: pdfAnalysis.fileSize,
          contentLength: testResult.contentComplexity.totalContentLength
        });

        // Save individual test report
        const reportPath = path.join(downloadPath, `${scenario.name}-report.json`);
        fs.writeFileSync(reportPath, JSON.stringify(testResult, null, 2));

      } catch (error) {
        const errorResult = {
          scenario: scenario.name,
          testId,
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          consoleLogs
        };

        testResults.push(errorResult);
        
        // Save error report
        const errorPath = path.join(downloadPath, `${scenario.name}-error.json`);
        fs.writeFileSync(errorPath, JSON.stringify(errorResult, null, 2));
        
        throw error;
      }
    });
  });

  test.afterAll(async () => {
    // Generate comprehensive content variation report
    const report = {
      summary: {
        totalScenarios: TEST_SCENARIOS.length,
        passed: testResults.filter(r => r.status === 'PASSED').length,
        failed: testResults.filter(r => r.status === 'FAILED').length,
        averageContentLength: testResults
          .filter(r => r.contentComplexity)
          .reduce((sum, r) => sum + r.contentComplexity.totalContentLength, 0) / 
          testResults.filter(r => r.contentComplexity).length
      },
      contentAnalysis: {
        contentLengthDistribution: testResults
          .filter(r => r.contentComplexity)
          .map(r => ({
            scenario: r.scenario,
            totalLength: r.contentComplexity.totalContentLength,
            descriptionLength: r.contentComplexity.descriptionLength,
            clientNameLength: r.contentComplexity.clientNameLength,
            pageCount: r.pdfAnalysis?.pageCount
          })),
        specialCharacterTests: testResults
          .filter(r => r.contentComplexity?.hasSpecialChars)
          .map(r => ({
            scenario: r.scenario,
            pageCount: r.pdfAnalysis?.pageCount,
            issues: r.issues?.length || 0
          }))
      },
      performanceMetrics: {
        averageFormFillTime: testResults
          .filter(r => r.performance?.formFill)
          .reduce((sum, r) => sum + r.performance.formFill, 0) / 
          testResults.filter(r => r.performance?.formFill).length,
        averagePDFGenerationTime: testResults
          .filter(r => r.performance?.pdfGeneration)
          .reduce((sum, r) => sum + r.performance.pdfGeneration, 0) / 
          testResults.filter(r => r.performance?.pdfGeneration).length
      },
      pdfAnalytics: {
        allSinglePage: testResults
          .filter(r => r.pdfAnalysis)
          .every(r => r.pdfAnalysis.pageCount === 1),
        averageFileSize: testResults
          .filter(r => r.pdfAnalysis)
          .reduce((sum, r) => sum + r.pdfAnalysis.fileSize, 0) / 
          testResults.filter(r => r.pdfAnalysis).length,
        fileSizeRange: {
          min: Math.min(...testResults
            .filter(r => r.pdfAnalysis)
            .map(r => r.pdfAnalysis.fileSize)),
          max: Math.max(...testResults
            .filter(r => r.pdfAnalysis)
            .map(r => r.pdfAnalysis.fileSize))
        }
      },
      recommendations: [],
      detailedResults: testResults
    };

    // Generate recommendations based on results
    if (report.summary.failed > 0) {
      report.recommendations.push({
        priority: 'HIGH',
        title: 'Fix Failed Content Variations',
        description: `${report.summary.failed} content variations failed`,
        action: 'Review failed scenarios and adjust content handling'
      });
    }

    if (!report.pdfAnalytics.allSinglePage) {
      const multiPageScenarios = testResults
        .filter(r => r.pdfAnalysis && r.pdfAnalysis.pageCount > 1)
        .map(r => r.scenario);
      
      report.recommendations.push({
        priority: 'CRITICAL',
        title: 'Multi-Page PDFs Detected',
        description: `Scenarios generating multiple pages: ${multiPageScenarios.join(', ')}`,
        action: 'Implement better content scaling for these specific scenarios'
      });
    }

    if (report.performanceMetrics.averagePDFGenerationTime > 20000) {
      report.recommendations.push({
        priority: 'MEDIUM',
        title: 'PDF Generation Performance',
        description: `Average generation time: ${report.performanceMetrics.averagePDFGenerationTime}ms`,
        action: 'Optimize PDF generation performance'
      });
    }

    // Save comprehensive report
    const finalReportPath = path.join(
      Context7Config.pdf.reportsPath, 
      `content-variations-report-${new Date().toISOString().split('T')[0]}.json`
    );
    
    if (!fs.existsSync(Context7Config.pdf.reportsPath)) {
      fs.mkdirSync(Context7Config.pdf.reportsPath, { recursive: true });
    }
    
    fs.writeFileSync(finalReportPath, JSON.stringify(report, null, 2));
    
    Context7Utils.log('Content variations testing completed', {
      totalScenarios: report.summary.totalScenarios,
      passed: report.summary.passed,
      failed: report.summary.failed,
      allSinglePage: report.pdfAnalytics.allSinglePage,
      reportPath: finalReportPath
    });
  });
});