#!/usr/bin/env node

/**
 * EJECUTOR AUTOMÁTICO - VALIDACIÓN DE FIXES PDF CRÍTICOS
 * 
 * Script para ejecutar la validación completa de los fixes implementados:
 * 1. jsPDF Detection Fix (dual format support) 
 * 2. Currency Truncation Fix (información financiera completa)
 * 
 * Resuelve problemas originales:
 * - "$19,90" truncado → "$19,900.00" completo
 * - "❌ Fallo generación PDF..." → PDF generation exitoso
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ========================================================');
console.log('🚀     VALIDACIÓN DE FIXES PDF CRÍTICOS - CIAOCIAO.MX');
console.log('🚀 ========================================================');
console.log('');
console.log('🎯 OBJETIVO: Validar corrección de problemas críticos PDF');
console.log('');
console.log('📋 FIXES IMPLEMENTADOS A VALIDAR:');
console.log('  ✅ Fix 1: jsPDF Detection - Dual format support');
console.log('     Resuelve: "❌ Fallo generación PDF. ¿Desea IMPRIMIR..."');
console.log('');
console.log('  ✅ Fix 2: Currency Truncation - Enhanced PDF container');  
console.log('     Resuelve: "$19,90" → "$19,900.00" (información completa)');
console.log('');

// Configuración
const CONFIG = {
  testDir: path.join(__dirname, 'tests'),
  configFile: path.join(__dirname, 'playwright-pdf-validation.config.js'),
  resultsDir: path.join(__dirname, 'test-results', 'pdf-validation'),
  downloadDir: path.join(__dirname, 'test-results', 'pdf-validation', 'downloads'),
  reportDir: path.join(__dirname, 'playwright-report', 'pdf-validation')
};

// Crear directorios necesarios
function createDirectories() {
  console.log('📁 Creando directorios de testing...');
  
  Object.values(CONFIG).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Creado: ${dir}`);
    }
  });
}

// Verificar dependencias
function checkDependencies() {
  console.log('🔍 Verificando dependencias...');
  
  try {
    // Verificar Playwright
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('  ✅ Playwright disponible');
    
    // Verificar archivos críticos del sistema
    const criticalFiles = [
      'script.js',
      'index.html', 
      'receipt-mode.html'
    ];
    
    criticalFiles.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`  ✅ ${file} encontrado`);
      } else {
        console.warn(`  ⚠️ ${file} no encontrado`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando dependencias:', error.message);
    return false;
  }
  
  return true;
}

// Ejecutar tests de validación
function runValidationTests() {
  console.log('🧪 EJECUTANDO TESTS DE VALIDACIÓN...');
  console.log('');
  
  try {
    const startTime = Date.now();
    
    // Comando Playwright con configuración específica
    const command = `npx playwright test --config=${CONFIG.configFile} --reporter=list,json,html`;
    
    console.log(`📋 Comando: ${command}`);
    console.log('');
    
    // Ejecutar con output en tiempo real
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { 
        ...process.env,
        NODE_ENV: 'test',
        PDF_VALIDATION: 'true'
      }
    });
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    console.log('');
    console.log(`✅ Tests completados exitosamente en ${duration}s`);
    
    return true;
    
  } catch (error) {
    console.log('');
    console.log('⚠️ Tests completados con algunos fallos');
    console.log('📋 Revisando resultados...');
    return false;
  }
}

// Analizar resultados
function analyzeResults() {
  console.log('📊 ANALIZANDO RESULTADOS...');
  
  // Verificar archivo de resultados JSON
  const resultsFile = path.join(CONFIG.resultsDir, '../pdf-validation-results.json');
  
  if (fs.existsSync(resultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      
      console.log('');
      console.log('📋 RESUMEN DE RESULTADOS:');
      console.log(`  🧪 Tests ejecutados: ${results.stats?.total || 0}`);
      console.log(`  ✅ Tests exitosos: ${results.stats?.expected || 0}`);
      console.log(`  ❌ Tests fallidos: ${results.stats?.unexpected || 0}`);
      console.log(`  ⏱️ Duración: ${Math.floor((results.stats?.duration || 0) / 1000)}s`);
      
      return results.stats?.unexpected === 0;
      
    } catch (error) {
      console.warn('⚠️ Error leyendo resultados JSON:', error.message);
    }
  }
  
  // Verificar PDFs generados
  if (fs.existsSync(CONFIG.downloadDir)) {
    const pdfFiles = fs.readdirSync(CONFIG.downloadDir).filter(f => f.endsWith('.pdf'));
    console.log(`📄 PDFs generados: ${pdfFiles.length}`);
    
    if (pdfFiles.length > 0) {
      console.log('  📁 Archivos PDF:');
      pdfFiles.forEach(file => {
        const stats = fs.statSync(path.join(CONFIG.downloadDir, file));
        console.log(`    - ${file} (${Math.floor(stats.size / 1024)}KB)`);
      });
      return true;
    }
  }
  
  return false;
}

// Generar reporte final
function generateFinalReport(success) {
  console.log('');
  console.log('📋 ====== REPORTE FINAL DE VALIDACIÓN ======');
  console.log('');
  
  const report = {
    timestamp: new Date().toISOString(),
    validation: success ? 'SUCCESS' : 'PARTIAL',
    fixes: {
      jsPDFDetection: {
        description: 'Dual format detection para window.jsPDF y window.jspdf.jsPDF',
        implemented: true,
        validated: success
      },
      currencyTruncation: {
        description: 'Enhanced PDF container width y html2canvas options',
        implemented: true,
        validated: success
      }
    },
    originalProblems: {
      problem1: {
        description: 'Currency mostraba "$19,90" en lugar de "$19,900.00"',
        status: success ? 'RESOLVED' : 'NEEDS_VERIFICATION'
      },
      problem2: {
        description: '❌ Fallo generación PDF. ¿Desea IMPRIMIR... error',
        status: success ? 'RESOLVED' : 'NEEDS_VERIFICATION'
      }
    }
  };
  
  // Guardar reporte
  const reportFile = path.join(CONFIG.resultsDir, 'final-validation-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  if (success) {
    console.log('🎉 VALIDACIÓN EXITOSA - Todos los fixes funcionan correctamente');
    console.log('');
    console.log('✅ PROBLEMAS RESUELTOS:');
    console.log('  💰 Currency truncation: "$19,90" → "$19,900.00"');
    console.log('  📄 PDF generation: Sin errores de fallback');
    console.log('  🔧 jsPDF detection: Dual format support funcional');
    console.log('');
  } else {
    console.log('⚠️ VALIDACIÓN PARCIAL - Revisar logs para detalles');
    console.log('');
  }
  
  console.log('📁 ARCHIVOS GENERADOS:');
  console.log(`  📊 Reporte final: ${reportFile}`);
  console.log(`  📋 Resultados HTML: ${path.join(CONFIG.reportDir, 'index.html')}`);
  console.log(`  📄 PDFs de prueba: ${CONFIG.downloadDir}`);
  console.log('');
  
  return report;
}

// Función principal
async function main() {
  const startTime = Date.now();
  
  try {
    // Preparación
    createDirectories();
    
    if (!checkDependencies()) {
      console.error('❌ Dependencias faltantes - abortando');
      process.exit(1);
    }
    
    console.log('');
    console.log('🔄 Iniciando validación de fixes PDF...');
    console.log('');
    
    // Ejecutar tests
    const testSuccess = runValidationTests();
    
    // Analizar resultados
    const analysisSuccess = analyzeResults();
    
    // Generar reporte final
    const overallSuccess = testSuccess && analysisSuccess;
    const report = generateFinalReport(overallSuccess);
    
    const endTime = Date.now();
    const totalDuration = Math.floor((endTime - startTime) / 1000);
    
    console.log('⏱️ TIEMPO TOTAL DE VALIDACIÓN:', `${totalDuration}s`);
    console.log('');
    console.log('🚀 ========================================================');
    console.log('🚀     VALIDACIÓN PDF COMPLETADA - CIAOCIAO.MX');
    console.log('🚀 ========================================================');
    
    // Exit code
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error crítico durante validación:', error);
    process.exit(1);
  }
}

// Manejar interrupción
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️ Validación interrumpida por usuario');
  process.exit(1);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };