#!/usr/bin/env node

// validate-pdf-fix.js
// Script para validar que el fix del problema PDF funciona correctamente

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 VALIDANDO FIX DEL PROBLEMA PDF');
console.log('================================');
console.log('Ejecutando test rápido para confirmar que el problema está resuelto\n');

const validationConfig = {
  testFile: './tests/simplified-pdf-diagnosis.spec.js',
  project: 'chromium-pdf-tests',
  timeout: 60000,
  retries: 1
};

console.log('🧪 Configuración de validación:');
console.log(`- Test: ${validationConfig.testFile}`);
console.log(`- Browser: ${validationConfig.project}`);
console.log(`- Timeout: ${validationConfig.timeout}ms`);
console.log(`- Retries: ${validationConfig.retries}\n`);

try {
  console.log('🚀 Ejecutando validación...\n');
  
  const command = `npx playwright test ${validationConfig.testFile} ` +
    `--project=${validationConfig.project} ` +
    `--timeout=${validationConfig.timeout} ` +
    `--retries=${validationConfig.retries} ` +
    `--reporter=list`;

  const output = execSync(command, { 
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ VALIDACIÓN COMPLETADA');
  
} catch (error) {
  console.log('\n⚠️  VALIDACIÓN COMPLETADA CON ERRORES');
  console.log('(Revisar los resultados del test para determinar si el fix funcionó)');
}

// Buscar el reporte más reciente
console.log('\n📊 BUSCANDO RESULTADOS...\n');

const findLatestReport = (baseDir) => {
  if (!fs.existsSync(baseDir)) return null;
  
  const sessions = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(dir => dir.isDirectory() && dir.name.startsWith('PDF-SIMPLE-DIAG-'))
    .map(dir => ({
      name: dir.name,
      path: path.join(baseDir, dir.name),
      timestamp: fs.statSync(path.join(baseDir, dir.name)).birthtime
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return sessions.length > 0 ? sessions[0] : null;
};

const latestSession = findLatestReport('./test-results/pdf-diagnosis-simple');

if (latestSession) {
  console.log(`📁 Sesión más reciente: ${latestSession.name}`);
  
  const reportPath = path.join(latestSession.path, 'FINAL-DIAGNOSIS.json');
  const readablePath = path.join(latestSession.path, 'DIAGNOSIS-READABLE.txt');
  
  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      console.log('\n🔍 RESULTADO DE LA VALIDACIÓN:');
      console.log('==============================');
      
      if (report.diagnosis.problemConfirmed === false) {
        console.log('🎉 ¡PROBLEMA RESUELTO!');
        console.log('✅ Vista previa: FUNCIONA');
        console.log('✅ Generación PDF: FUNCIONA');
        console.log('✅ Fix implementado correctamente');
        
      } else if (report.diagnosis.evidence.pdfWorked === true) {
        console.log('🎉 ¡PROBLEMA RESUELTO!');
        console.log('✅ Vista previa: FUNCIONA');
        console.log('✅ Generación PDF: FUNCIONA');
        console.log('✅ Fix validado exitosamente');
        
      } else {
        console.log('❌ PROBLEMA AÚN EXISTE');
        console.log(`❌ Causa: ${report.diagnosis.rootCause}`);
        console.log('❌ El fix necesita revisión adicional');
        
        if (report.diagnosis.recommendations.length > 0) {
          console.log('\n💡 RECOMENDACIONES ADICIONALES:');
          report.diagnosis.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
          });
        }
      }
      
      console.log('\n📊 DETALLES:');
      console.log(`   - Errores de consola: ${report.diagnosis.evidence.consoleErrors}`);
      console.log(`   - jsPDF cargado: ${report.diagnosis.evidence.dependenciesLoaded.jsPDF ? 'SÍ' : 'NO'}`);
      console.log(`   - html2canvas cargado: ${report.diagnosis.evidence.dependenciesLoaded.html2canvas ? 'SÍ' : 'NO'}`);
      
    } catch (parseError) {
      console.log('⚠️  Error parseando reporte:', parseError.message);
    }
  }
  
  if (fs.existsSync(readablePath)) {
    console.log(`\n📄 Reporte completo disponible en:`);
    console.log(`   ${readablePath}`);
  }
  
} else {
  console.log('❌ No se encontraron resultados de validación');
  console.log('   Asegúrate de que el test se ejecutó correctamente');
}

console.log('\n================================');
console.log('🔍 VALIDACIÓN DEL FIX COMPLETADA');
console.log('================================\n');

// Instrucciones finales
console.log('📋 PRÓXIMOS PASOS:');
console.log('==================');
console.log('1. Si el problema está RESUELTO:');
console.log('   - Documentar la solución implementada');
console.log('   - Crear tests de regresión');
console.log('   - Monitorear en producción');
console.log('');
console.log('2. Si el problema AÚN EXISTE:');
console.log('   - Revisar las recomendaciones adicionales');
console.log('   - Implementar fixes adicionales');
console.log('   - Ejecutar esta validación nuevamente');
console.log('');