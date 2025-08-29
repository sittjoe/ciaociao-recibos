#!/usr/bin/env node

// run-critical-pdf-corrections-validation.js
// Script para ejecutar la validación crítica de correcciones de PDF

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SISTEMA DE VALIDACIÓN CRÍTICA - CORRECCIONES PDF');
console.log('=' .repeat(70));
console.log('');
console.log('PROBLEMA ORIGINAL: "PDF mejor pero sigue apareciendo cortado"');
console.log('');
console.log('CORRECCIONES IMPLEMENTADAS A VALIDAR:');
console.log('✅ 1. Dimensiones A4 corregidas: A4_WIDTH_PX=3507px, A4_HEIGHT_PX=2480px');
console.log('✅ 2. Font-size optimizado: 36px en lugar de 48px');
console.log('✅ 3. Márgenes ajustados: 6mm por lado en lugar de 7.5mm');
console.log('✅ 4. Overflow handling mejorado: overflow:visible, white-space:nowrap');
console.log('✅ 5. html2canvas optimizado: onclone function para captura completa');
console.log('');
console.log('OBJETIVO: Confirmar 100% que el problema está RESUELTO');
console.log('=' .repeat(70));
console.log('');

// Verificar que Playwright está instalado
try {
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('✅ Playwright verificado');
} catch (error) {
  console.error('❌ Playwright no está instalado. Ejecute: npm install playwright');
  process.exit(1);
}

// Verificar archivos de configuración
const configFile = path.join(__dirname, 'tests/critical-pdf-corrections.config.js');
const testFile = path.join(__dirname, 'tests/critical-pdf-corrections-validation.spec.js');

if (!fs.existsSync(configFile)) {
  console.error(`❌ Archivo de configuración no encontrado: ${configFile}`);
  process.exit(1);
}

if (!fs.existsSync(testFile)) {
  console.error(`❌ Archivo de test no encontrado: ${testFile}`);
  process.exit(1);
}

console.log('✅ Archivos de test verificados');
console.log('');

// Crear directorio de resultados
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('🎬 INICIANDO EJECUCIÓN DE TESTS CRÍTICOS...');
console.log('-'.repeat(50));

try {
  // Ejecutar tests con configuración específica
  const command = `npx playwright test --config=tests/critical-pdf-corrections.config.js`;
  
  console.log(`📋 Comando: ${command}`);
  console.log('');
  
  // Ejecutar con output en tiempo real
  execSync(command, { 
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      CI: 'false', // Desactivar modo CI para más reintentos
      PLAYWRIGHT_HTML_REPORT: './playwright-report/critical-pdf-corrections'
    }
  });
  
  console.log('');
  console.log('🎉 EJECUCIÓN DE TESTS COMPLETADA');
  
} catch (error) {
  console.log('');
  console.log('⚠️ EJECUCIÓN COMPLETADA CON ERRORES');
  console.log('📋 Código de salida:', error.status || 'desconocido');
}

// Mostrar resultados finales
console.log('');
console.log('📊 PROCESANDO RESULTADOS...');

try {
  // Leer reporte final si existe
  const finalReportPath = path.join(__dirname, 'test-results/REPORTE-FINAL-CORRECCIONES-PDF.json');
  
  if (fs.existsSync(finalReportPath)) {
    const finalReport = JSON.parse(fs.readFileSync(finalReportPath, 'utf8'));
    
    console.log('');
    console.log('📄 REPORTE FINAL GENERADO:');
    console.log(`📁 ${finalReportPath}`);
    console.log('');
    console.log('🎯 ESTADO DE CORRECCIONES:');
    
    Object.entries(finalReport.correcciones_validadas).forEach(([key, data]) => {
      const status = data.validado ? '✅' : '❌';
      console.log(`${status} ${key}: ${data.descripcion}`);
    });
    
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`• Tests ejecutados: ${finalReport.resumen.tests_ejecutados || 'N/A'}`);
    console.log(`• PDFs generados: ${finalReport.resumen.pdfs_generados_exitosamente || 'N/A'}`);
    console.log(`• Estado: ${finalReport.resumen.estado_actual || 'N/A'}`);
    
  } else {
    console.log('⚠️ Reporte final no encontrado. Revisando archivos disponibles...');
  }
  
  // Mostrar archivos generados
  console.log('');
  console.log('📁 ARCHIVOS DISPONIBLES:');
  
  const directories = [
    'test-results',
    'playwright-report/critical-pdf-corrections'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      if (files.length > 0) {
        console.log(`📂 ${dir}:`);
        files.forEach(file => {
          console.log(`   • ${file}`);
        });
      }
    }
  });
  
} catch (error) {
  console.error('❌ Error procesando resultados:', error.message);
}

console.log('');
console.log('🔍 ACCESO A REPORTES:');
console.log('• Reporte HTML: playwright-report/critical-pdf-corrections/index.html');
console.log('• Reporte JSON: test-results/REPORTE-FINAL-CORRECCIONES-PDF.json');
console.log('• PDFs generados: test-results/downloads/');
console.log('');

console.log('✅ VALIDACIÓN CRÍTICA DE CORRECCIONES PDF COMPLETADA');
console.log('=' .repeat(70));