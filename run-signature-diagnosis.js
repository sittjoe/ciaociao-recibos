#!/usr/bin/env node

/**
 * EJECUTOR DE DIAGNÓSTICO ESPECÍFICO DE FIRMAS DIGITALES
 * 
 * Este script ejecuta el suite completo de diagnóstico para identificar
 * la causa exacta del error genérico "Error procesando firmas digitales"
 * que aparece en línea 3018 del script.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 ========================================================');
console.log('🔍     DIAGNÓSTICO ESPECÍFICO DE FIRMAS DIGITALES');
console.log('🔍 ========================================================');
console.log('');
console.log('📋 OBJETIVO: Identificar causa exacta del error genérico');
console.log('📋 UBICACIÓN: script.js línea 3018');
console.log('📋 ERROR: "Error procesando firmas digitales. Intente limpiar y re-firmar"');
console.log('');

// Verificar que el directorio de tests existe
const testsDir = path.join(__dirname, 'tests', 'signature-diagnosis');
if (!fs.existsSync(testsDir)) {
  console.error('❌ Error: Directorio de tests no encontrado:', testsDir);
  process.exit(1);
}

// Crear directorio de resultados
const resultsDir = path.join(__dirname, 'test-results', 'signature-diagnosis');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('🧪 TESTS A EJECUTAR:');
console.log('  1. Interceptación de errores específicos antes del catch-all');
console.log('  2. Análisis detallado de canvas y SignaturePads');
console.log('  3. Diagnóstico de timing y visibilidad');
console.log('  4. Casos específicos de firmas (sin/solo cliente/solo empresa/ambas)');
console.log('');

console.log('🔄 Iniciando ejecución...');
console.log('');

try {
  // Ejecutar tests con configuración específica
  const command = 'npx playwright test --config=playwright-signature-diagnosis.config.js';
  
  console.log(`📋 Ejecutando: ${command}`);
  console.log('');
  
  const output = execSync(command, { 
    stdio: 'inherit',
    cwd: __dirname,
    env: { 
      ...process.env,
      NODE_ENV: 'test',
      SIGNATURE_DIAGNOSIS: 'true'
    }
  });
  
  console.log('');
  console.log('✅ Ejecución de tests completada');
  
} catch (error) {
  console.log('');
  console.log('⚠️ Tests completados con algunos fallos (esto es esperado para diagnóstico)');
  console.log('📋 Los fallos ayudan a identificar el problema específico');
}

console.log('');
console.log('📊 PROCESANDO RESULTADOS...');

// Verificar archivos generados
const reportFiles = [
  path.join(resultsDir, 'signature-diagnosis-report.json'),
  path.join(resultsDir, 'signature-diagnosis-report.html'),
  path.join(__dirname, 'test-results', 'signature-diagnosis-results.json')
];

let reportesEncontrados = 0;
reportFiles.forEach(file => {
  if (fs.existsSync(file)) {
    reportesEncontrados++;
    console.log(`✅ Reporte generado: ${file}`);
  }
});

if (reportesEncontrados === 0) {
  console.log('⚠️ No se encontraron reportes específicos, verificando directorio de Playwright...');
  
  // Verificar en playwright-report
  const playwrightReportDir = path.join(__dirname, 'playwright-report', 'signature-diagnosis');
  if (fs.existsSync(playwrightReportDir)) {
    console.log(`📊 Reporte Playwright disponible en: ${playwrightReportDir}`);
  }
}

console.log('');
console.log('🔍 ====== INSTRUCCIONES DE ANÁLISIS DE RESULTADOS ======');
console.log('');
console.log('📋 REPORTES GENERADOS:');
console.log('  • signature-diagnosis-report.json - Datos completos en JSON');
console.log('  • signature-diagnosis-report.html - Reporte visual detallado');
console.log('  • Playwright HTML report - Traces y screenshots');
console.log('');
console.log('🎯 QUÉ BUSCAR EN LOS RESULTADOS:');
console.log('  1. ERROR ORIGINAL INTERCEPTADO:');
console.log('     - Buscar "capturedOriginalError" en logs');
console.log('     - Verificar mensaje exacto antes del catch-all');
console.log('');
console.log('  2. ESTADO DE SIGNATUREPADS:');
console.log('     - Verificar que signaturePad y companySignaturePad existen');
console.log('     - Confirmar que isEmpty() y toDataURL() funcionan');
console.log('');
console.log('  3. PROBLEMAS DE TIMING:');
console.log('     - Buscar delays entre inicialización y uso');
console.log('     - Verificar si canvas está visible cuando se usa');
console.log('');
console.log('  4. CASOS ESPECÍFICOS:');
console.log('     - Identificar qué combinaciones de firmas fallan');
console.log('     - Verificar si falla sin firmas, con una, o con ambas');
console.log('');
console.log('🔧 PRÓXIMOS PASOS BASADOS EN RESULTADOS:');
console.log('');
console.log('  SI SE INTERCEPTA ERROR ESPECÍFICO:');
console.log('  → Implementar manejo específico antes de línea 3018');
console.log('  → Crear catch específico para ese tipo de error');
console.log('');
console.log('  SI HAY PROBLEMAS DE TIMING:');
console.log('  → Agregar checks de disponibilidad en getValidSignatureData()');
console.log('  → Implementar retry logic para inicialización');
console.log('');
console.log('  SI HAY PROBLEMAS DE CANVAS:');
console.log('  → Verificar visibility y dimensiones antes de usar');
console.log('  → Validar que canvas context esté disponible');
console.log('');
console.log('📁 UBICACIÓN DE ARCHIVOS:');
console.log(`  • Reportes: ${resultsDir}`);
console.log(`  • Playwright Report: playwright-report/signature-diagnosis/index.html`);
console.log('');
console.log('🔍 ========================================================');
console.log('🔍     DIAGNÓSTICO COMPLETADO - REVISAR RESULTADOS');
console.log('🔍 ========================================================');

// Intentar abrir el reporte HTML automáticamente
const htmlReport = path.join(resultsDir, 'signature-diagnosis-report.html');
if (fs.existsSync(htmlReport)) {
  console.log('');
  console.log('🌐 Intentando abrir reporte HTML...');
  
  try {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    if (platform === 'darwin') {
      command = `open "${htmlReport}"`;
    } else if (platform === 'win32') {
      command = `start "${htmlReport}"`;
    } else {
      command = `xdg-open "${htmlReport}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log(`📋 Abrir manualmente: ${htmlReport}`);
      } else {
        console.log('✅ Reporte HTML abierto en navegador');
      }
    });
    
  } catch (error) {
    console.log(`📋 Abrir manualmente: ${htmlReport}`);
  }
}

process.exit(0);