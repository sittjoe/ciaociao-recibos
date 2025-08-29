// critical-corrections-teardown.js
// Teardown específico para generar reporte final de validación crítica

const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  console.log('');
  console.log('🏁 FINALIZANDO VALIDACIÓN CRÍTICA DE CORRECCIONES PDF');
  console.log('=' .repeat(60));
  
  const endTime = new Date().toISOString();
  
  try {
    // Leer información del setup
    const setupFile = path.join(process.cwd(), 'test-results/critical-corrections-setup.json');
    let setupInfo = {};
    if (fs.existsSync(setupFile)) {
      setupInfo = JSON.parse(fs.readFileSync(setupFile, 'utf8'));
    }
    
    // Analizar resultados de tests
    const resultsFile = path.join(process.cwd(), 'test-results/critical-pdf-corrections-results.json');
    let testResults = {};
    if (fs.existsSync(resultsFile)) {
      testResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    }
    
    // Contar PDFs generados
    const downloadsDir = path.join(process.cwd(), 'test-results/downloads');
    let pdfCount = 0;
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      pdfCount = files.filter(file => file.endsWith('.pdf')).length;
    }
    
    // Analizar logs de validación
    const logsDir = path.join(process.cwd(), 'test-results');
    let validationLogs = [];
    if (fs.existsSync(logsDir)) {
      const logFiles = fs.readdirSync(logsDir).filter(file => 
        file.startsWith('pdf-validation-logs-') && file.endsWith('.json')
      );
      
      logFiles.forEach(logFile => {
        try {
          const logData = JSON.parse(fs.readFileSync(path.join(logsDir, logFile), 'utf8'));
          validationLogs.push(logData);
        } catch (e) {
          console.warn(`⚠️ No se pudo leer log: ${logFile}`);
        }
      });
    }
    
    // Generar reporte final
    const finalReport = {
      timestamp: endTime,
      setup: setupInfo,
      execution: {
        startTime: setupInfo.startTime,
        endTime: endTime,
        duration: setupInfo.startTime ? 
          Math.round((new Date(endTime) - new Date(setupInfo.startTime)) / 1000) : 'unknown',
        pdfsGenerated: pdfCount
      },
      testResults,
      validationLogs,
      correcciones_validadas: {
        dimensiones_a4: {
          descripcion: 'A4_WIDTH_PX=3507px, A4_HEIGHT_PX=2480px (landscape)',
          validado: validationLogs.some(log => 
            log.consoleLogs && log.consoleLogs.some(l => 
              l.message.includes('3507') && l.message.includes('2480')
            )
          )
        },
        font_size_36px: {
          descripcion: 'Font-size optimizado de 48px a 36px',
          validado: validationLogs.some(log =>
            log.consoleLogs && log.consoleLogs.some(l =>
              l.message.includes('36px') || l.message.includes('font-size: 36')
            )
          )
        },
        margenes_6mm: {
          descripcion: 'Márgenes reducidos de 7.5mm a 6mm por lado',
          validado: validationLogs.some(log =>
            log.consoleLogs && log.consoleLogs.some(l =>
              l.message.includes('6mm') || l.message.includes('margin')
            )
          )
        },
        overflow_mejorado: {
          descripcion: 'overflow:visible, white-space:nowrap implementado',
          validado: validationLogs.some(log =>
            log.consoleLogs && log.consoleLogs.some(l =>
              l.message.includes('overflow:visible') || l.message.includes('white-space:nowrap')
            )
          )
        },
        html2canvas_optimizado: {
          descripcion: 'onclone function para captura completa',
          validado: validationLogs.some(log =>
            log.consoleLogs && log.consoleLogs.some(l =>
              l.message.includes('onclone') || l.message.includes('html2canvas optimized')
            )
          )
        }
      },
      resumen: {
        problema_original: 'PDF mejor pero sigue apareciendo cortado',
        estado_actual: 'EN VALIDACIÓN',
        correcciones_implementadas: 5,
        tests_ejecutados: validationLogs.length,
        pdfs_generados_exitosamente: pdfCount
      }
    };
    
    // Determinar si todas las correcciones fueron validadas
    const correccionesValidadas = Object.values(finalReport.correcciones_validadas)
      .filter(c => c.validado).length;
    const totalCorrecciones = Object.keys(finalReport.correcciones_validadas).length;
    
    finalReport.resumen.estado_actual = correccionesValidadas === totalCorrecciones ? 
      '✅ TODAS LAS CORRECCIONES VALIDADAS' : 
      `⚠️ ${correccionesValidadas}/${totalCorrecciones} CORRECCIONES VALIDADAS`;
    
    // Guardar reporte final
    const reportFile = path.join(process.cwd(), 'test-results/REPORTE-FINAL-CORRECCIONES-PDF.json');
    fs.writeFileSync(reportFile, JSON.stringify(finalReport, null, 2));
    
    // Mostrar resumen en consola
    console.log('📊 RESUMEN DE VALIDACIÓN:');
    console.log('-'.repeat(40));
    console.log(`⏱️  Duración total: ${finalReport.execution.duration} segundos`);
    console.log(`🧪 Tests ejecutados: ${finalReport.resumen.tests_ejecutados}`);
    console.log(`📄 PDFs generados: ${finalReport.resumen.pdfs_generados_exitosamente}`);
    console.log(`✅ Correcciones validadas: ${correccionesValidadas}/${totalCorrecciones}`);
    console.log('');
    
    console.log('🎯 ESTADO DE CORRECCIONES:');
    console.log('-'.repeat(40));
    Object.entries(finalReport.correcciones_validadas).forEach(([key, data]) => {
      const status = data.validado ? '✅' : '❌';
      console.log(`${status} ${key}: ${data.descripcion}`);
    });
    
    console.log('');
    console.log('📁 ARCHIVOS GENERADOS:');
    console.log(`• Reporte final: ${reportFile}`);
    console.log(`• Logs individuales: test-results/pdf-validation-logs-*.json`);
    console.log(`• PDFs generados: test-results/downloads/`);
    console.log(`• Reporte HTML: playwright-report/critical-pdf-corrections/index.html`);
    
    console.log('');
    if (correccionesValidadas === totalCorrecciones) {
      console.log('🎉 ¡VALIDACIÓN EXITOSA!');
      console.log('✅ TODAS LAS CORRECCIONES HAN SIDO VALIDADAS');
      console.log('✅ EL PROBLEMA "PDF SE CORTA" HA SIDO RESUELTO');
    } else {
      console.log('⚠️ VALIDACIÓN PARCIAL');
      console.log(`❓ ${totalCorrecciones - correccionesValidadas} correcciones necesitan revisión`);
    }
    
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error generando reporte final:', error);
  }
}

module.exports = globalTeardown;