// tests/setup/critical-diagnosis-teardown.js
// Teardown global para diagnóstico crítico PDF

const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('\n📊 FINALIZANDO DIAGNÓSTICO CRÍTICO PDF');
  console.log('=====================================');
  
  const sessionId = process.env.CRITICAL_DIAGNOSIS_SESSION_ID;
  const sessionDir = process.env.CRITICAL_DIAGNOSIS_DIR;
  
  if (!sessionId || !sessionDir) {
    console.log('⚠️  No session information found for teardown');
    return;
  }
  
  console.log(`🔍 Processing session: ${sessionId}`);
  
  try {
    // Leer metadata de la sesión
    const metadataPath = path.join(sessionDir, 'session-metadata.json');
    let sessionMetadata = {};
    
    if (fs.existsSync(metadataPath)) {
      sessionMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    
    // Actualizar metadata con información de finalización
    sessionMetadata.endTime = Date.now();
    sessionMetadata.endTimeISO = new Date().toISOString();
    sessionMetadata.totalDuration = sessionMetadata.endTime - sessionMetadata.startTime;
    sessionMetadata.durationMinutes = (sessionMetadata.totalDuration / 1000 / 60).toFixed(1);
    
    // Recopilar información de archivos generados
    const generatedFiles = {
      screenshots: [],
      traces: [],
      videos: [],
      reports: [],
      other: []
    };
    
    const collectFiles = (dir, category = 'other') => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          collectFiles(fullPath, category);
        } else {
          const stat = fs.statSync(fullPath);
          const fileInfo = {
            path: fullPath.replace(process.cwd() + '/', './'),
            name: file.name,
            size: stat.size,
            sizeKB: (stat.size / 1024).toFixed(1),
            created: stat.birthtime.toISOString()
          };
          
          if (file.name.endsWith('.png')) {
            generatedFiles.screenshots.push(fileInfo);
          } else if (file.name.includes('trace')) {
            generatedFiles.traces.push(fileInfo);
          } else if (file.name.endsWith('.webm') || file.name.endsWith('.mp4')) {
            generatedFiles.videos.push(fileInfo);
          } else if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
            generatedFiles.reports.push(fileInfo);
          } else {
            generatedFiles.other.push(fileInfo);
          }
        }
      });
    };
    
    collectFiles(sessionDir);
    
    sessionMetadata.generatedFiles = generatedFiles;
    sessionMetadata.totalFiles = Object.values(generatedFiles).reduce((sum, arr) => sum + arr.length, 0);
    
    // Analizar resultados de tests si están disponibles
    const playwrightResultsPath = path.join('./test-results/critical-pdf-diagnosis/playwright-report.json');
    if (fs.existsSync(playwrightResultsPath)) {
      try {
        const testResults = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'));
        sessionMetadata.testResults = {
          config: testResults.config,
          stats: testResults.stats,
          suites: testResults.suites?.length || 0,
          tests: testResults.tests?.length || 0
        };
      } catch (parseError) {
        console.log('⚠️  Could not parse playwright results:', parseError.message);
      }
    }
    
    // Guardar metadata final
    fs.writeFileSync(metadataPath, JSON.stringify(sessionMetadata, null, 2));
    
    // Crear resumen ejecutivo
    const executiveSummary = generateExecutiveSummary(sessionMetadata);
    const summaryPath = path.join(sessionDir, 'EXECUTIVE-SUMMARY.txt');
    fs.writeFileSync(summaryPath, executiveSummary);
    
    // Mostrar resumen en consola
    console.log('📈 RESUMEN DE LA SESIÓN:');
    console.log('========================');
    console.log(`Duración: ${sessionMetadata.durationMinutes} minutos`);
    console.log(`Archivos generados: ${sessionMetadata.totalFiles}`);
    console.log(`Screenshots: ${generatedFiles.screenshots.length}`);
    console.log(`Reports: ${generatedFiles.reports.length}`);
    console.log(`Videos: ${generatedFiles.videos.length}`);
    console.log(`Traces: ${generatedFiles.traces.length}`);
    
    console.log('\n📁 ARCHIVOS PRINCIPALES:');
    console.log('========================');
    
    // Mostrar archivos de reporte más importantes
    const importantFiles = [
      ...generatedFiles.reports.filter(f => f.name.includes('FINAL')),
      ...generatedFiles.reports.filter(f => f.name.includes('DIAGNOSIS')),
      summaryPath
    ];
    
    importantFiles.forEach(file => {
      const filePath = typeof file === 'string' ? file : file.path;
      console.log(`📄 ${filePath}`);
    });
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Revisar el Executive Summary');
    console.log('2. Analizar los reportes de diagnóstico detallados');
    console.log('3. Implementar las recomendaciones encontradas');
    console.log('4. Validar la solución con tests adicionales');
    
    console.log('\n=====================================');
    console.log('✅ DIAGNÓSTICO CRÍTICO COMPLETADO');
    console.log(`📂 Todos los resultados en: ${sessionDir}`);
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('❌ Error en teardown:', error);
    console.log(`📂 Revisar manualmente: ${sessionDir}`);
  }
}

function generateExecutiveSummary(metadata) {
  const timestamp = new Date().toISOString();
  
  return `
EXECUTIVE SUMMARY - DIAGNÓSTICO CRÍTICO PDF
===========================================
Fecha: ${timestamp}
Session ID: ${metadata.sessionId}
Duración: ${metadata.durationMinutes} minutos

PROBLEMA INVESTIGADO:
====================
${metadata.problem}

OBJETIVO:
=========
${metadata.objective}

AMBIENTE DE PRUEBA:
===================
URL: ${metadata.environment?.url}
Browser: ${metadata.environment?.browser}
Framework: ${metadata.environment?.testFramework}

PLAN DE PRUEBAS EJECUTADO:
==========================
${metadata.testPlan?.map((item, index) => `${index + 1}. ${item}`).join('\n') || 'No disponible'}

RESULTADOS ESPERADOS:
=====================
${metadata.expectedOutcomes?.map((item, index) => `${index + 1}. ${item}`).join('\n') || 'No disponible'}

ARCHIVOS GENERADOS:
===================
Total: ${metadata.totalFiles} archivos
- Screenshots: ${metadata.generatedFiles?.screenshots?.length || 0}
- Reports: ${metadata.generatedFiles?.reports?.length || 0} 
- Videos: ${metadata.generatedFiles?.videos?.length || 0}
- Traces: ${metadata.generatedFiles?.traces?.length || 0}
- Otros: ${metadata.generatedFiles?.other?.length || 0}

ESTADÍSTICAS DE TESTS:
=====================
${metadata.testResults ? `
Suites ejecutadas: ${metadata.testResults.suites}
Tests ejecutados: ${metadata.testResults.tests}
` : 'Estadísticas no disponibles'}

PRÓXIMOS PASOS RECOMENDADOS:
============================
1. Revisar archivos FINAL-DIAGNOSIS.json y DIAGNOSIS-READABLE.txt
2. Analizar screenshots del proceso completo
3. Revisar traces de Playwright para debugging detallado
4. Implementar recomendaciones en orden de prioridad
5. Crear tests de regresión para prevenir el problema

ARCHIVOS CLAVE PARA REVISAR:
============================
${metadata.generatedFiles?.reports?.map(f => `- ${f.path} (${f.sizeKB}KB)`).join('\n') || 'No reports encontrados'}

NOTA: Este diagnóstico fue diseñado específicamente para identificar
por qué la vista previa funciona perfectamente pero la generación 
PDF falla completamente en ciaociao-recibos.

===============================
Generado automáticamente por el
Sistema de Diagnóstico Crítico
===============================
`;
}

module.exports = globalTeardown;