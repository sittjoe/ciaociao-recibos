const fs = require('fs');
const path = require('path');

/**
 * REPORTER ESPECÍFICO PARA DIAGNÓSTICO DE FIRMAS DIGITALES
 * 
 * Objetivo: Compilar todos los datos de diagnóstico en un reporte
 * detallado que identifique la causa exacta del error genérico
 */

class SignatureDiagnosisReporter {
  constructor() {
    this.reports = {
      errorInterception: [],
      canvasAnalysis: [],
      timingDiagnosis: [],
      scenarios: [],
      summary: {}
    };
    
    this.criticalFindings = [];
    this.outputDir = 'test-results/signature-diagnosis';
  }

  onBegin(config, suite) {
    console.log('🔍 Iniciando Diagnóstico de Firmas Digitales...');
    
    // Crear directorio de output
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    this.startTime = Date.now();
  }

  async onTestEnd(test, result) {
    // Extraer datos específicos de cada test desde la página
    if (result.status === 'passed' || result.status === 'failed') {
      try {
        // Intentar extraer datos de diagnóstico de cada página de test
        const attachments = result.attachments || [];
        
        for (const attachment of attachments) {
          if (attachment.name && attachment.name.includes('trace')) {
            // Procesar traces si están disponibles
          }
        }

        // Categorizar reporte según el test
        if (test.title.includes('Interceptar error específico')) {
          this.reports.errorInterception.push({
            test: test.title,
            status: result.status,
            duration: result.duration,
            error: result.error ? {
              message: result.error.message,
              stack: result.error.stack
            } : null,
            timestamp: new Date().toISOString()
          });
        }

        if (test.title.includes('Canvas Analysis') || test.title.includes('casos específicos')) {
          this.reports.canvasAnalysis.push({
            test: test.title,
            status: result.status,
            duration: result.duration,
            timestamp: new Date().toISOString()
          });
        }

        if (test.title.includes('Timing') || test.title.includes('timing')) {
          this.reports.timingDiagnosis.push({
            test: test.title,
            status: result.status,
            duration: result.duration,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.warn('⚠️ Error extrayendo datos de diagnóstico:', error.message);
      }
    }
  }

  async onEnd(result) {
    this.endTime = Date.now();
    const totalDuration = this.endTime - this.startTime;

    console.log('🔍 Compilando Diagnóstico Final...');

    // Compilar reporte final
    const finalReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalDuration: totalDuration,
        totalTests: result.allTests?.length || 0,
        passedTests: result.allTests?.filter(t => t.outcome() === 'expected').length || 0,
        failedTests: result.allTests?.filter(t => t.outcome() === 'unexpected').length || 0
      },
      reports: this.reports,
      criticalFindings: this.criticalFindings,
      analysis: this.analyzeFindings(),
      recommendations: this.generateRecommendations()
    };

    // Guardar reporte principal
    const reportPath = path.join(this.outputDir, 'signature-diagnosis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

    // Generar reporte HTML legible
    const htmlReport = this.generateHTMLReport(finalReport);
    const htmlPath = path.join(this.outputDir, 'signature-diagnosis-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // Generar resumen para consola
    this.printSummary(finalReport);

    console.log(`📊 Reporte completo guardado en: ${reportPath}`);
    console.log(`📊 Reporte HTML disponible en: ${htmlPath}`);
  }

  analyzeFindings() {
    const analysis = {
      patterns: [],
      commonErrors: [],
      timingIssues: [],
      canvasProblems: [],
      signaturePadIssues: []
    };

    // Analizar patrones en los reportes
    const allReports = [
      ...this.reports.errorInterception,
      ...this.reports.canvasAnalysis,
      ...this.reports.timingDiagnosis
    ];

    // Buscar patrones de errores
    const errorMessages = allReports
      .filter(r => r.error)
      .map(r => r.error.message);

    if (errorMessages.length > 0) {
      const errorCounts = errorMessages.reduce((acc, msg) => {
        acc[msg] = (acc[msg] || 0) + 1;
        return acc;
      }, {});

      analysis.commonErrors = Object.entries(errorCounts)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count);
    }

    // Analizar duración de tests para identificar timing issues
    const slowTests = allReports
      .filter(r => r.duration && r.duration > 30000)
      .map(r => ({ test: r.test, duration: r.duration }));

    if (slowTests.length > 0) {
      analysis.timingIssues = slowTests;
    }

    return analysis;
  }

  generateRecommendations() {
    const recommendations = [];

    // Recomendaciones basadas en errores interceptados
    if (this.reports.errorInterception.some(r => r.status === 'failed')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ERROR_HANDLING',
        title: 'Error Específico Identificado',
        description: 'Se detectaron errores específicos en el proceso de firmas que están siendo enmascarados por el catch-all genérico.',
        action: 'Revisar los logs detallados de interceptación para identificar el error exacto y crear un manejo específico.'
      });
    }

    // Recomendaciones basadas en análisis de canvas
    if (this.reports.canvasAnalysis.some(r => r.status === 'failed')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CANVAS_ISSUES',
        title: 'Problemas con Canvas Elements',
        description: 'Se detectaron problemas con los elementos canvas o su estado durante el proceso.',
        action: 'Verificar la inicialización y visibilidad de canvas elements, así como la sincronización con SignaturePad.'
      });
    }

    // Recomendaciones basadas en timing
    if (this.reports.timingDiagnosis.some(r => r.status === 'failed')) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'TIMING_ISSUES',
        title: 'Problemas de Timing Detectados',
        description: 'Se identificaron problemas de timing entre la inicialización de componentes y su uso.',
        action: 'Implementar mejores checks de disponibilidad y sincronización entre SignaturePad library y canvas elements.'
      });
    }

    // Recomendación general
    recommendations.push({
      priority: 'HIGH',
      category: 'ERROR_HANDLING_IMPROVEMENT',
      title: 'Mejorar Manejo de Errores Específicos',
      description: 'El catch-all en línea 3018 es muy amplio y enmascara errores específicos.',
      action: 'Implementar manejo de errores específico antes del catch-all genérico para identificar y manejar casos particulares.'
    });

    return recommendations;
  }

  generateHTMLReport(finalReport) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico de Firmas Digitales - Reporte</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .critical {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
        }
        .success {
            background-color: #e8f5e8;
            border-left: 4px solid #4caf50;
        }
        .warning {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
        }
        .code {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .recommendation {
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
        }
        .high-priority {
            background-color: #ffcdd2;
            border-left: 4px solid #f44336;
        }
        .medium-priority {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
        }
        .low-priority {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .json-viewer {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Diagnóstico de Firmas Digitales</h1>
            <p>Análisis Específico del Error "Error procesando firmas digitales. Intente limpiar y re-firmar"</p>
            <p><strong>Generado:</strong> ${finalReport.metadata.timestamp}</p>
        </div>

        <div class="section">
            <h2>📊 Resumen Ejecutivo</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${finalReport.metadata.totalTests}</div>
                    <div>Tests Ejecutados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${finalReport.metadata.passedTests}</div>
                    <div>Tests Exitosos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${finalReport.metadata.failedTests}</div>
                    <div>Tests Fallidos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.round(finalReport.metadata.totalDuration / 1000)}s</div>
                    <div>Duración Total</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Hallazgos Críticos</h2>
            ${finalReport.criticalFindings.length > 0 ? 
                finalReport.criticalFindings.map(finding => `
                    <div class="critical recommendation">
                        <strong>${finding.title}</strong><br>
                        ${finding.description}
                    </div>
                `).join('') :
                '<div class="success">No se encontraron hallazgos críticos específicos en esta ejecución.</div>'
            }
        </div>

        <div class="section">
            <h2>📋 Recomendaciones de Corrección</h2>
            ${finalReport.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}-priority">
                    <strong>${rec.title}</strong> <span style="background: #${rec.priority === 'HIGH' ? 'f44336' : rec.priority === 'MEDIUM' ? 'ff9800' : '2196f3'}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.8em;">${rec.priority}</span><br>
                    <em>${rec.category}</em><br>
                    ${rec.description}<br>
                    <strong>Acción:</strong> ${rec.action}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🔬 Análisis Detallado</h2>
            <h3>Errores Comunes Detectados</h3>
            ${finalReport.analysis.commonErrors.length > 0 ?
                finalReport.analysis.commonErrors.map(error => `
                    <div class="code">
                        <strong>Error:</strong> ${error.message}<br>
                        <strong>Frecuencia:</strong> ${error.count} vez(es)
                    </div>
                `).join('') :
                '<p>No se detectaron errores comunes en esta ejecución.</p>'
            }

            <h3>Problemas de Timing</h3>
            ${finalReport.analysis.timingIssues.length > 0 ?
                finalReport.analysis.timingIssues.map(timing => `
                    <div class="warning recommendation">
                        <strong>Test Lento:</strong> ${timing.test}<br>
                        <strong>Duración:</strong> ${timing.duration}ms
                    </div>
                `).join('') :
                '<p>No se detectaron problemas de timing significativos.</p>'
            }
        </div>

        <div class="section">
            <h2>📊 Datos de Diagnóstico Completos</h2>
            <h3>Interceptación de Errores</h3>
            <div class="json-viewer">
                <pre>${JSON.stringify(finalReport.reports.errorInterception, null, 2)}</pre>
            </div>

            <h3>Análisis de Canvas</h3>
            <div class="json-viewer">
                <pre>${JSON.stringify(finalReport.reports.canvasAnalysis, null, 2)}</pre>
            </div>

            <h3>Diagnóstico de Timing</h3>
            <div class="json-viewer">
                <pre>${JSON.stringify(finalReport.reports.timingDiagnosis, null, 2)}</pre>
            </div>
        </div>

        <div class="section">
            <h2>📝 Instrucciones de Seguimiento</h2>
            <div class="warning recommendation">
                <strong>Próximos Pasos:</strong><br>
                1. Revisar los errores específicos interceptados en los logs detallados<br>
                2. Implementar manejo de errores específico antes de la línea 3018 en script.js<br>
                3. Verificar timing de inicialización entre SignaturePad library y canvas elements<br>
                4. Probar las correcciones con este mismo suite de diagnóstico<br>
                5. Una vez corregido, ejecutar tests de regresión completos
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  printSummary(finalReport) {
    console.log('\n🔍 ============ DIAGNÓSTICO DE FIRMAS DIGITALES - RESUMEN ============');
    console.log(`📅 Timestamp: ${finalReport.metadata.timestamp}`);
    console.log(`⏱️  Duración Total: ${Math.round(finalReport.metadata.totalDuration / 1000)}s`);
    console.log(`🧪 Tests Ejecutados: ${finalReport.metadata.totalTests}`);
    console.log(`✅ Tests Exitosos: ${finalReport.metadata.passedTests}`);
    console.log(`❌ Tests Fallidos: ${finalReport.metadata.failedTests}`);
    
    console.log('\n📋 HALLAZGOS CRÍTICOS:');
    if (finalReport.criticalFindings.length > 0) {
      finalReport.criticalFindings.forEach(finding => {
        console.log(`🎯 ${finding.title}: ${finding.description}`);
      });
    } else {
      console.log('✅ No se encontraron hallazgos críticos específicos');
    }

    console.log('\n📊 ERRORES COMUNES:');
    if (finalReport.analysis.commonErrors.length > 0) {
      finalReport.analysis.commonErrors.forEach(error => {
        console.log(`❌ "${error.message}" (${error.count} veces)`);
      });
    } else {
      console.log('✅ No se detectaron errores comunes');
    }

    console.log('\n🎯 RECOMENDACIONES PRINCIPALES:');
    const highPriorityRecs = finalReport.recommendations.filter(r => r.priority === 'HIGH');
    if (highPriorityRecs.length > 0) {
      highPriorityRecs.forEach(rec => {
        console.log(`🔥 ${rec.title}: ${rec.action}`);
      });
    }

    console.log('\n📁 ARCHIVOS GENERADOS:');
    console.log(`📊 Reporte JSON: ${this.outputDir}/signature-diagnosis-report.json`);
    console.log(`📊 Reporte HTML: ${this.outputDir}/signature-diagnosis-report.html`);
    
    console.log('\n🔍 ================================================================\n');
  }
}

module.exports = SignatureDiagnosisReporter;