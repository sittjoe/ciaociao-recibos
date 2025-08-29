// tests/simplified-pdf-diagnosis.spec.js
// Diagnóstico simplificado y funcional del problema PDF de ciaociao-recibos

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('DIAGNÓSTICO PDF ciaociao-recibos - Versión Simplificada', () => {
  let sessionId;
  let diagnosticData;

  test.beforeAll(async () => {
    sessionId = `PDF-SIMPLE-DIAG-${Date.now()}`;
    console.log(`🚨 INICIANDO DIAGNÓSTICO PDF SIMPLIFICADO - Session: ${sessionId}`);
    
    diagnosticData = {
      sessionId,
      startTime: Date.now(),
      problem: 'Vista previa funciona, PDF NO genera',
      results: [],
      consoleErrors: [],
      screenshots: [],
      finalDiagnosis: null
    };

    // Crear directorio para resultados
    const resultsDir = `./test-results/pdf-diagnosis-simple/${sessionId}`;
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    diagnosticData.resultsDir = resultsDir;
  });

  test('PDF-001: Test Completo del Problema', async ({ page }) => {
    console.log('🔍 EJECUTANDO DIAGNÓSTICO COMPLETO EN UN SOLO TEST');
    
    const testResult = {
      testId: 'PDF-001',
      steps: [],
      errors: [],
      states: {},
      screenshots: []
    };

    // Capturar errores de consola
    const consoleErrors = [];
    const consoleWarnings = [];
    const consoleLogs = [];
    
    page.on('console', msg => {
      const msgData = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      };
      
      if (msg.type() === 'error') {
        consoleErrors.push(msgData);
        console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msgData);
      } else if (msg.text().includes('PDF') || msg.text().includes('jsPDF') || 
                 msg.text().includes('html2canvas')) {
        consoleLogs.push(msgData);
        console.log(`🔍 PDF-RELATED: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now()
      });
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });

    await test.step('Navegar y hacer login', async () => {
      console.log('📍 Navegando a https://recibos.ciaociao.mx/receipt-mode.html');
      await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
      
      await page.screenshot({ path: `${diagnosticData.resultsDir}/01-initial-load.png` });
      
      await page.waitForSelector('#passwordInput', { timeout: 10000 });
      await page.fill('#passwordInput', '27181730');
      await page.click('#loginBtn');
      await page.waitForSelector('#receiptForm', { timeout: 15000 });
      
      await page.screenshot({ path: `${diagnosticData.resultsDir}/02-after-login.png` });
      testResult.steps.push('Navigation and login successful');
    });

    await test.step('Verificar dependencias críticas', async () => {
      console.log('🔬 Verificando dependencias para PDF');
      
      const dependencies = await page.evaluate(() => {
        return {
          jsPDF: {
            available: typeof window.jsPDF !== 'undefined',
            lowercase: typeof window.jspdf !== 'undefined',
            version: (window.jsPDF && window.jsPDF.version) || (window.jspdf && window.jspdf.version) || 'unknown',
            canInstantiate: false
          },
          html2canvas: {
            available: typeof window.html2canvas !== 'undefined',
            isFunction: typeof window.html2canvas === 'function'
          },
          SignaturePad: {
            available: typeof window.SignaturePad !== 'undefined'
          },
          generatePDF: {
            available: typeof window.generatePDF === 'function',
            functionString: typeof window.generatePDF === 'function' ? 
              window.generatePDF.toString().substring(0, 200) + '...' : null
          }
        };
      });

      // Test jsPDF instantiation
      const jsPDFTest = await page.evaluate(() => {
        try {
          let PDFConstructor = null;
          if (window.jsPDF) {
            PDFConstructor = window.jsPDF;
          } else if (window.jspdf && window.jspdf.jsPDF) {
            PDFConstructor = window.jspdf.jsPDF;
          }
          
          if (PDFConstructor) {
            const testDoc = new PDFConstructor();
            return { success: true, constructor: 'found' };
          } else {
            return { success: false, error: 'No PDF constructor found' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      dependencies.jsPDF.canInstantiate = jsPDFTest.success;
      dependencies.jsPDF.instantiationError = jsPDFTest.error;

      testResult.states.dependencies = dependencies;
      
      console.log('📦 Dependencies State:', JSON.stringify(dependencies, null, 2));
      testResult.steps.push('Dependency verification completed');
    });

    await test.step('Llenar formulario básico', async () => {
      console.log('📝 Llenando formulario con datos mínimos');
      
      await page.fill('#receiptDate', '2025-08-27');
      await page.selectOption('#transactionType', 'venta');
      await page.fill('#clientName', 'Test Diagnóstico PDF');
      await page.fill('#clientPhone', '5512345678');
      await page.selectOption('#pieceType', 'anillo');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#price', '1000');
      
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: `${diagnosticData.resultsDir}/03-form-filled.png` });
      testResult.steps.push('Form filled with test data');
    });

    await test.step('Probar Vista Previa (debe funcionar)', async () => {
      console.log('👀 Probando Vista Previa');
      
      const previewStartTime = Date.now();
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview', { timeout: 10000 });
      
      const previewState = await page.evaluate(() => {
        const preview = document.getElementById('receiptPreview');
        return {
          exists: !!preview,
          visible: preview && preview.offsetParent !== null,
          hasContent: preview ? preview.textContent.length > 0 : false,
          dimensions: preview ? {
            width: preview.offsetWidth,
            height: preview.offsetHeight,
            scrollHeight: preview.scrollHeight
          } : null
        };
      });
      
      testResult.states.preview = {
        ...previewState,
        generationTime: Date.now() - previewStartTime
      };
      
      console.log('✅ Vista Previa:', previewState.hasContent ? 'FUNCIONA' : 'FALLA');
      await page.screenshot({ path: `${diagnosticData.resultsDir}/04-preview-generated.png` });
      
      await page.click('#closePreview');
      testResult.steps.push(`Preview test: ${previewState.hasContent ? 'SUCCESS' : 'FAILED'}`);
    });

    await test.step('Instrumentar generatePDF para captura', async () => {
      console.log('🎯 Instrumentando función generatePDF');
      
      await page.evaluate(() => {
        window.pdfDiagnosticTrace = [];
        
        if (typeof window.generatePDF === 'function') {
          const original = window.generatePDF;
          
          window.generatePDF = async function(...args) {
            window.pdfDiagnosticTrace.push({
              step: 'FUNCTION_CALLED',
              timestamp: Date.now(),
              args: args.length
            });
            
            try {
              // Check dependencies at execution time
              const deps = {
                jsPDF: typeof window.jsPDF,
                jspdf: typeof window.jspdf,
                html2canvas: typeof window.html2canvas
              };
              
              window.pdfDiagnosticTrace.push({
                step: 'DEPENDENCIES_CHECK',
                timestamp: Date.now(),
                dependencies: deps
              });
              
              // Try to determine PDF constructor
              let PDFConstructor = null;
              if (window.jsPDF) {
                PDFConstructor = window.jsPDF;
              } else if (window.jspdf && window.jspdf.jsPDF) {
                PDFConstructor = window.jspdf.jsPDF;
              }
              
              window.pdfDiagnosticTrace.push({
                step: 'PDF_CONSTRUCTOR_FOUND',
                timestamp: Date.now(),
                constructor: !!PDFConstructor
              });
              
              if (!PDFConstructor) {
                throw new Error('No PDF constructor available');
              }
              
              // Execute original function
              const result = await original.apply(this, args);
              
              window.pdfDiagnosticTrace.push({
                step: 'FUNCTION_COMPLETED',
                timestamp: Date.now(),
                success: true
              });
              
              return result;
              
            } catch (error) {
              window.pdfDiagnosticTrace.push({
                step: 'FUNCTION_ERROR',
                timestamp: Date.now(),
                error: {
                  name: error.name,
                  message: error.message,
                  stack: error.stack?.substring(0, 200)
                }
              });
              throw error;
            }
          };
          
          console.log('✅ generatePDF instrumented');
        } else {
          console.log('❌ generatePDF function not found');
          window.pdfDiagnosticTrace.push({
            step: 'FUNCTION_NOT_FOUND',
            timestamp: Date.now()
          });
        }
      });
      
      testResult.steps.push('generatePDF instrumentation completed');
    });

    await test.step('Intentar generar PDF (punto crítico)', async () => {
      console.log('🎯 PUNTO CRÍTICO: Intentando generar PDF');
      
      let downloadReceived = false;
      let pdfError = null;
      const pdfStartTime = Date.now();
      
      try {
        // Setup download promise with timeout
        const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
        
        // Click PDF button
        console.log('🖱️  Haciendo click en "Generar PDF"');
        await page.click('#generatePdfBtn');
        
        try {
          const download = await downloadPromise;
          downloadReceived = true;
          
          const downloadPath = `${diagnosticData.resultsDir}/generated-test.pdf`;
          await download.saveAs(downloadPath);
          
          const fileExists = fs.existsSync(downloadPath);
          const fileSize = fileExists ? fs.statSync(downloadPath).size : 0;
          
          testResult.states.pdfGeneration = {
            success: true,
            downloadReceived: true,
            fileCreated: fileExists,
            fileSize,
            generationTime: Date.now() - pdfStartTime
          };
          
          console.log('✅ PDF generado exitosamente!');
          
        } catch (downloadError) {
          pdfError = downloadError.message;
          console.log('❌ PDF Generation TIMEOUT/FAILED:', pdfError);
          
          testResult.states.pdfGeneration = {
            success: false,
            downloadReceived: false,
            error: pdfError,
            generationTime: Date.now() - pdfStartTime
          };
        }
        
      } catch (clickError) {
        pdfError = clickError.message;
        console.log('❌ Error clicking PDF button:', pdfError);
        
        testResult.states.pdfGeneration = {
          success: false,
          error: pdfError,
          clickError: true
        };
      }
      
      // Capturar trace de la función
      const pdfTrace = await page.evaluate(() => window.pdfDiagnosticTrace || []);
      testResult.states.pdfTrace = pdfTrace;
      
      console.log('📊 PDF Function Trace:', JSON.stringify(pdfTrace, null, 2));
      
      await page.screenshot({ path: `${diagnosticData.resultsDir}/05-after-pdf-attempt.png` });
      
      testResult.steps.push(`PDF generation: ${downloadReceived ? 'SUCCESS' : 'FAILED'}`);
    });

    // Capturar todos los errores de consola acumulados
    testResult.consoleErrors = consoleErrors;
    testResult.consoleWarnings = consoleWarnings;
    testResult.consoleLogs = consoleLogs;
    
    diagnosticData.results.push(testResult);
    diagnosticData.consoleErrors = consoleErrors;
  });

  test.afterAll(async () => {
    console.log('\n🔍 GENERANDO DIAGNÓSTICO FINAL...');
    
    diagnosticData.endTime = Date.now();
    diagnosticData.duration = diagnosticData.endTime - diagnosticData.startTime;
    
    const testResult = diagnosticData.results[0];
    
    // Generar diagnóstico
    const diagnosis = {
      problemConfirmed: false,
      rootCause: null,
      contributingFactors: [],
      recommendations: [],
      severity: 'UNKNOWN',
      evidence: {}
    };
    
    // Analizar resultados
    if (testResult?.states?.preview?.hasContent && !testResult?.states?.pdfGeneration?.success) {
      diagnosis.problemConfirmed = true;
      diagnosis.severity = 'CRITICAL';
      
      console.log('✅ PROBLEMA CONFIRMADO: Vista previa funciona, PDF NO genera');
      
      // Analizar causa raíz
      const pdfTrace = testResult.states.pdfTrace || [];
      const dependencies = testResult.states.dependencies || {};
      
      if (pdfTrace.length === 0) {
        diagnosis.rootCause = 'GENERATE_PDF_NOT_CALLED';
        diagnosis.contributingFactors.push('Event handler no funciona o función no existe');
      } else {
        const errorStep = pdfTrace.find(step => step.step === 'FUNCTION_ERROR');
        if (errorStep) {
          diagnosis.rootCause = 'PDF_FUNCTION_EXECUTION_ERROR';
          diagnosis.contributingFactors.push(`Error: ${errorStep.error?.message}`);
        } else if (!dependencies.jsPDF?.canInstantiate) {
          diagnosis.rootCause = 'JSPDF_INSTANTIATION_FAILURE';
          diagnosis.contributingFactors.push('jsPDF no se puede instanciar correctamente');
        }
      }
      
      // Generar recomendaciones
      if (diagnosis.rootCause === 'GENERATE_PDF_NOT_CALLED') {
        diagnosis.recommendations = [
          'Verificar que el event listener esté attachado al botón',
          'Revisar la inicialización de scripts',
          'Verificar orden de carga de archivos JS'
        ];
      } else if (diagnosis.rootCause === 'JSPDF_INSTANTIATION_FAILURE') {
        diagnosis.recommendations = [
          'Verificar versión de jsPDF cargada',
          'Implementar detección de window.jspdf vs window.jsPDF',
          'Agregar fallbacks para diferentes versiones'
        ];
      } else if (diagnosis.rootCause === 'PDF_FUNCTION_EXECUTION_ERROR') {
        diagnosis.recommendations = [
          'Revisar error específico en la función',
          'Implementar try-catch más detallados',
          'Verificar compatibilidad de html2canvas'
        ];
      }
      
    } else if (testResult?.states?.pdfGeneration?.success) {
      console.log('❓ PROBLEMA NO REPRODUCIDO: PDF se generó correctamente');
      diagnosis.severity = 'RESOLVED';
      diagnosis.recommendations = ['El problema puede estar resuelto o ser intermitente'];
    } else {
      console.log('⚠️  NO SE PUDO DETERMINAR EL ESTADO');
    }
    
    diagnosis.evidence = {
      previewWorked: testResult?.states?.preview?.hasContent || false,
      pdfWorked: testResult?.states?.pdfGeneration?.success || false,
      dependenciesLoaded: {
        jsPDF: testResult?.states?.dependencies?.jsPDF?.available || false,
        html2canvas: testResult?.states?.dependencies?.html2canvas?.available || false
      },
      consoleErrors: diagnosticData.consoleErrors.length,
      pdfTraceSteps: testResult?.states?.pdfTrace?.length || 0
    };
    
    diagnosticData.finalDiagnosis = diagnosis;
    
    // Generar reporte final
    const finalReport = {
      sessionId: diagnosticData.sessionId,
      problem: 'Vista previa funciona, PDF NO genera',
      duration: diagnosticData.duration,
      diagnosis,
      detailedResults: diagnosticData.results,
      evidence: diagnosis.evidence,
      timestamp: new Date().toISOString()
    };
    
    const reportPath = `${diagnosticData.resultsDir}/FINAL-DIAGNOSIS.json`;
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    
    // Generar reporte legible
    const readableReport = `
DIAGNÓSTICO SIMPLIFICADO PDF ciaociao-recibos
============================================
Session: ${diagnosticData.sessionId}
Duración: ${(diagnosticData.duration / 1000 / 60).toFixed(1)} minutos
Problema: Vista previa funciona, PDF NO genera

DIAGNÓSTICO FINAL:
=================
Problema Confirmado: ${diagnosis.problemConfirmed ? 'SÍ' : 'NO'}
Causa Raíz: ${diagnosis.rootCause || 'NO DETERMINADA'}
Severidad: ${diagnosis.severity}

EVIDENCIA:
==========
Vista Previa Funciona: ${diagnosis.evidence.previewWorked ? 'SÍ' : 'NO'}
PDF Funciona: ${diagnosis.evidence.pdfWorked ? 'SÍ' : 'NO'}
jsPDF Cargado: ${diagnosis.evidence.dependenciesLoaded.jsPDF ? 'SÍ' : 'NO'}
html2canvas Cargado: ${diagnosis.evidence.dependenciesLoaded.html2canvas ? 'SÍ' : 'NO'}
Errores de Consola: ${diagnosis.evidence.consoleErrors}
Pasos de Trace PDF: ${diagnosis.evidence.pdfTraceSteps}

FACTORES CONTRIBUYENTES:
=======================
${diagnosis.contributingFactors.map(f => '• ' + f).join('\n') || 'Ninguno identificado'}

RECOMENDACIONES:
================
${diagnosis.recommendations.map(r => '• ' + r).join('\n') || 'Ninguna específica'}

ARCHIVOS GENERADOS:
==================
• Screenshots del proceso completo
• Trace de la función generatePDF
• Estados de dependencias detallados
• Errores de consola capturados
`;
    
    const readableReportPath = `${diagnosticData.resultsDir}/DIAGNOSIS-READABLE.txt`;
    fs.writeFileSync(readableReportPath, readableReport);
    
    console.log('\n========================================');
    console.log('🚨 DIAGNÓSTICO SIMPLIFICADO COMPLETADO');
    console.log('========================================');
    console.log(`Session: ${diagnosticData.sessionId}`);
    console.log(`Duración: ${(diagnosticData.duration / 1000 / 60).toFixed(1)} minutos`);
    console.log(`Problema Confirmado: ${diagnosis.problemConfirmed ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Causa Raíz: ${diagnosis.rootCause || 'NO DETERMINADA'}`);
    console.log(`Reporte JSON: ${reportPath}`);
    console.log(`Reporte Legible: ${readableReportPath}`);
    console.log('========================================\n');
  });
});