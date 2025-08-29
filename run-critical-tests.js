#!/usr/bin/env node

/**
 * Script de Ejecución de Tests Críticos - ciaociao-recibos
 * Ejecuta suite completa de verificación post-correcciones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO TESTS CRÍTICOS DEL SISTEMA CIAOCIAO-RECIBOS');
console.log('=' .repeat(60));
console.log('Verificando funcionalidades post-correcciones...');
console.log('URL del sistema: https://recibos.ciaociao.mx/receipt-mode.html');
console.log('Contraseña de test: 27181730');
console.log('=' .repeat(60));

// Crear directorio de resultados
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Función para ejecutar comando y capturar salida
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`Comando: ${command}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 300000 // 5 minutos timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${description} completado en ${Math.round(duration/1000)}s`);
    
    return { success: true, output, duration };
  } catch (error) {
    console.log(`❌ Error en ${description}:`);
    console.log(error.stdout || error.message);
    
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Función principal
async function runCriticalTests() {
  const testResults = {
    timestamp: new Date().toISOString(),
    system: 'ciaociao-recibos',
    url: 'https://recibos.ciaociao.mx/receipt-mode.html',
    testPassword: '27181730',
    results: []
  };

  console.log('\n📋 PLAN DE TESTS:');
  console.log('1. Verificación de dependencias');
  console.log('2. Tests de funcionalidades críticas');
  console.log('3. Generación de reportes');
  console.log('4. Análisis de resultados');

  // 1. Verificar dependencias
  console.log('\n🔍 FASE 1: VERIFICACIÓN DE DEPENDENCIAS');
  
  const depCheck = runCommand('npm list @playwright/test', 'Verificando Playwright');
  testResults.results.push({
    phase: 'dependencies',
    test: 'playwright-check',
    ...depCheck
  });

  // 2. Ejecutar tests críticos
  console.log('\n🧪 FASE 2: EJECUCIÓN DE TESTS CRÍTICOS');
  
  const testCommands = [
    {
      name: 'critical-system-tests',
      command: 'npx playwright test tests/system-critical-functionality.spec.js --config=tests/critical-system.config.js --reporter=list,json:test-results/critical-results.json',
      description: 'Tests críticos del sistema'
    }
  ];

  for (const testCmd of testCommands) {
    const result = runCommand(testCmd.command, testCmd.description);
    testResults.results.push({
      phase: 'testing',
      test: testCmd.name,
      ...result
    });
  }

  // 3. Generar reporte HTML si está disponible
  console.log('\n📊 FASE 3: GENERACIÓN DE REPORTES');
  
  const reportGen = runCommand('npx playwright show-report --reporter=html', 'Generando reporte HTML');
  testResults.results.push({
    phase: 'reporting',
    test: 'html-report',
    ...reportGen
  });

  // 4. Análisis de resultados
  console.log('\n📈 FASE 4: ANÁLISIS DE RESULTADOS');
  
  try {
    // Leer resultados JSON si existe
    const jsonResultsPath = path.join(resultsDir, 'critical-results.json');
    if (fs.existsSync(jsonResultsPath)) {
      const jsonResults = JSON.parse(fs.readFileSync(jsonResultsPath, 'utf8'));
      testResults.playwrightResults = jsonResults;
      
      console.log('📋 RESUMEN DE TESTS:');
      console.log(`   - Tests ejecutados: ${jsonResults.suites?.[0]?.specs?.length || 'N/A'}`);
      console.log(`   - Tests pasados: ${jsonResults.stats?.expected || 'N/A'}`);
      console.log(`   - Tests fallidos: ${jsonResults.stats?.unexpected || 'N/A'}`);
      console.log(`   - Duración total: ${Math.round((jsonResults.stats?.duration || 0) / 1000)}s`);
    }
  } catch (error) {
    console.log('⚠️ No se pudieron leer los resultados detallados');
  }

  // 5. Verificar archivos de resultados generados
  console.log('\n📁 ARCHIVOS GENERADOS:');
  try {
    const files = fs.readdirSync(resultsDir);
    files.forEach(file => {
      const filePath = path.join(resultsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        console.log(`   📄 ${file} (${Math.round(stats.size/1024)}KB)`);
      } else if (stats.isDirectory()) {
        const subFiles = fs.readdirSync(filePath);
        console.log(`   📁 ${file}/ (${subFiles.length} archivos)`);
      }
    });
  } catch (error) {
    console.log('   ⚠️ No se pudieron listar los archivos de resultados');
  }

  // Guardar resumen completo
  const summaryPath = path.join(resultsDir, 'test-execution-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(testResults, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('🏁 TESTS CRÍTICOS COMPLETADOS');
  console.log('='.repeat(60));
  
  const successfulTests = testResults.results.filter(r => r.success).length;
  const totalTests = testResults.results.length;
  
  console.log(`📊 Resumen de ejecución:`);
  console.log(`   - Fases completadas exitosamente: ${successfulTests}/${totalTests}`);
  console.log(`   - Resultados guardados en: ${resultsDir}`);
  console.log(`   - Resumen completo: test-execution-summary.json`);
  
  if (successfulTests === totalTests) {
    console.log('✅ TODOS LOS TESTS EJECUTADOS EXITOSAMENTE');
    process.exit(0);
  } else {
    console.log('⚠️ ALGUNOS TESTS PRESENTARON PROBLEMAS - Revisar resultados detallados');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runCriticalTests().catch(error => {
    console.error('❌ Error fatal ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = { runCriticalTests };