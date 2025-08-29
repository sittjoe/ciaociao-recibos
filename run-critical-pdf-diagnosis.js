#!/usr/bin/env node

// run-critical-pdf-diagnosis.js
// Script para ejecutar el diagnóstico crítico del problema PDF de ciaociao-recibos
// Problema específico: Vista previa funciona, generación PDF falla completamente

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚨 EJECUTANDO DIAGNÓSTICO CRÍTICO PDF ciaociao-recibos');
console.log('=====================================================');
console.log('Problema: Vista previa funciona, PDF NO genera');
console.log('Objetivo: Identificar causa raíz exacta del problema');
console.log('=====================================================\n');

// Crear directorio para resultados si no existe
const resultsDir = './test-results/critical-pdf-diagnosis';
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Configuración específica para el diagnóstico
const diagnosticConfig = {
  testFile: './tests/critical-pdf-diagnosis.spec.js',
  project: 'chromium-pdf-tests',
  timeout: 120000, // 2 minutos por test
  retries: 0, // No retries para capturar errores exactos
  workers: 1 // Un solo worker para evitar interferencias
};

console.log('🔧 Configuración del diagnóstico:');
console.log(`- Test file: ${diagnosticConfig.testFile}`);
console.log(`- Browser: ${diagnosticConfig.project}`);
console.log(`- Timeout: ${diagnosticConfig.timeout}ms`);
console.log(`- Retries: ${diagnosticConfig.retries}`);
console.log(`- Workers: ${diagnosticConfig.workers}\n`);

try {
  console.log('🚀 Iniciando diagnóstico crítico...');
  console.log('⏱️  Esto tomará aproximadamente 3-5 minutos\n');
  
  // Comando completo de Playwright con configuración específica
  const command = `npx playwright test ${diagnosticConfig.testFile} ` +
    `--config=playwright-critical-diagnosis.config.js ` +
    `--project=critical-pdf-diagnosis-chromium ` +
    `--timeout=${diagnosticConfig.timeout} ` +
    `--retries=${diagnosticConfig.retries} ` +
    `--workers=${diagnosticConfig.workers}`;

  console.log('📋 Ejecutando comando:');
  console.log(command);
  console.log('\n' + '='.repeat(60));

  // Ejecutar el test
  const output = execSync(command, { 
    stdio: 'inherit',
    encoding: 'utf8',
    cwd: process.cwd()
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
  
} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  DIAGNÓSTICO TERMINADO (puede tener errores capturados)');
  console.log('Esto es esperado si el problema PDF se confirmó');
  
  // Los errores de PDF generation son esperados, no son errores del diagnóstico
  if (error.status !== 0) {
    console.log(`Exit code: ${error.status}`);
  }
}

console.log('\n📊 ANALIZANDO RESULTADOS...\n');

// Buscar y mostrar archivos de resultados
const findResultFiles = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findResultFiles(fullPath, files);
    } else if (entry.name.endsWith('.json') || entry.name.endsWith('.txt')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const resultFiles = findResultFiles(resultsDir);

console.log('📁 Archivos de resultados generados:');
resultFiles.forEach(file => {
  const stat = fs.statSync(file);
  const sizeKB = (stat.size / 1024).toFixed(1);
  console.log(`   ${file} (${sizeKB}KB)`);
});

// Buscar el reporte final más reciente
const finalReports = resultFiles.filter(f => f.includes('FINAL-DIAGNOSIS.json'));
const readableReports = resultFiles.filter(f => f.includes('DIAGNOSIS-READABLE.txt'));

if (finalReports.length > 0) {
  const latestReport = finalReports[finalReports.length - 1];
  console.log('\n📋 REPORTE FINAL PRINCIPAL:');
  console.log(`   ${latestReport}`);
  
  try {
    const reportData = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
    
    console.log('\n🔍 RESUMEN DEL DIAGNÓSTICO:');
    console.log('============================');
    console.log(`Problema Confirmado: ${reportData.diagnosis?.problemConfirmed ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Causa Raíz: ${reportData.diagnosis?.rootCause || 'NO DETERMINADA'}`);
    console.log(`Severidad: ${reportData.diagnosis?.severity || 'DESCONOCIDA'}`);
    console.log(`Complejidad Fix: ${reportData.diagnosis?.fixComplexity || 'DESCONOCIDA'}`);
    
    if (reportData.diagnosis?.contributingFactors?.length > 0) {
      console.log('\n🔧 Factores Contribuyentes:');
      reportData.diagnosis.contributingFactors.forEach(factor => {
        console.log(`   • ${factor}`);
      });
    }
    
    if (reportData.diagnosis?.recommendations?.length > 0) {
      console.log('\n💡 Recomendaciones:');
      reportData.diagnosis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
  } catch (parseError) {
    console.log('⚠️  Error parseando reporte JSON:', parseError.message);
  }
}

if (readableReports.length > 0) {
  const latestReadable = readableReports[readableReports.length - 1];
  console.log('\n📄 REPORTE LEGIBLE:');
  console.log(`   ${latestReadable}`);
  console.log('\n   Para ver el reporte completo:');
  console.log(`   cat "${latestReadable}"`);
}

console.log('\n' + '='.repeat(60));
console.log('🎯 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('='.repeat(60));
console.log('1. Revisar el reporte JSON detallado');
console.log('2. Leer el reporte legible para análisis completo');
console.log('3. Implementar las recomendaciones en orden de prioridad');
console.log('4. Validar cada fix con tests específicos');
console.log('5. Documentar la solución final');
console.log('='.repeat(60));

console.log('\n✅ Script de diagnóstico crítico completado');
console.log(`📊 Total de archivos generados: ${resultFiles.length}`);
console.log('🔍 Revisa los reportes para el análisis detallado\n');