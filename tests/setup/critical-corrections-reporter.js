// critical-corrections-reporter.js
// Reporter customizado para validación crítica de correcciones PDF

class CriticalCorrectionsReporter {
  constructor(options = {}) {
    this.options = options;
    this.startTime = Date.now();
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      correcciones: {
        dimensiones_a4: false,
        font_size_36px: false,
        margenes_6mm: false,
        overflow_mejorado: false,
        html2canvas_optimizado: false
      }
    };
  }

  onBegin(config, suite) {
    console.log('');
    console.log('🎬 INICIANDO VALIDACIÓN CRÍTICA DE CORRECCIONES PDF');
    console.log('📊 Configuración:');
    console.log(`   • Workers: ${config.workers}`);
    console.log(`   • Timeout: ${config.timeout}ms`);
    console.log(`   • Tests: ${suite.allTests().length}`);
    console.log('');
  }

  onTestBegin(test, result) {
    const testName = test.title;
    console.log(`🧪 INICIANDO: ${testName}`);
    
    // Identificar qué corrección está siendo probada
    if (testName.includes('dimensiones A4') || testName.includes('3507') || testName.includes('2480')) {
      console.log('   📏 Validando: Dimensiones A4 landscape correctas');
    } else if (testName.includes('font-size') || testName.includes('36px')) {
      console.log('   🔤 Validando: Font-size optimizado');
    } else if (testName.includes('márgenes') || testName.includes('6mm')) {
      console.log('   📐 Validando: Márgenes ajustados');
    } else if (testName.includes('overflow')) {
      console.log('   📏 Validando: Overflow handling mejorado');
    } else if (testName.includes('html2canvas')) {
      console.log('   🖼️ Validando: html2canvas optimizado');
    }
  }

  onTestEnd(test, result) {
    const testName = test.title;
    const status = result.status;
    const duration = result.duration;
    
    const statusIcon = {
      'passed': '✅',
      'failed': '❌',
      'skipped': '⏭️',
      'timedOut': '⏰'
    }[status] || '❓';
    
    console.log(`${statusIcon} ${testName} (${duration}ms)`);
    
    // Registrar resultado
    this.results[status].push({
      title: testName,
      duration,
      errors: result.errors
    });
    
    // Marcar correcciones validadas según el test
    if (status === 'passed') {
      if (testName.includes('dimensiones A4') || testName.includes('CORRECCIÓN 1')) {
        this.results.correcciones.dimensiones_a4 = true;
        console.log('   ✅ CORRECCIÓN 1 VALIDADA: Dimensiones A4');
      }
      if (testName.includes('font-size') || testName.includes('CORRECCIÓN 2')) {
        this.results.correcciones.font_size_36px = true;
        console.log('   ✅ CORRECCIÓN 2 VALIDADA: Font-size 36px');
      }
      if (testName.includes('márgenes') || testName.includes('CORRECCIÓN 3')) {
        this.results.correcciones.margenes_6mm = true;
        console.log('   ✅ CORRECCIÓN 3 VALIDADA: Márgenes 6mm');
      }
      if (testName.includes('overflow') || testName.includes('CORRECCIÓN 4')) {
        this.results.correcciones.overflow_mejorado = true;
        console.log('   ✅ CORRECCIÓN 4 VALIDADA: Overflow mejorado');
      }
      if (testName.includes('html2canvas') || testName.includes('CORRECCIÓN 5')) {
        this.results.correcciones.html2canvas_optimizado = true;
        console.log('   ✅ CORRECCIÓN 5 VALIDADA: html2canvas optimizado');
      }
    } else if (status === 'failed') {
      console.log('   ❌ Error en validación:');
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`      ${error.message}`);
        });
      }
    }
    
    console.log('');
  }

  onEnd(result) {
    const duration = Date.now() - this.startTime;
    const totalTests = result.stats ? result.stats.total : (this.results.passed.length + this.results.failed.length + this.results.skipped.length);
    const passed = this.results.passed.length;
    const failed = this.results.failed.length;
    const skipped = this.results.skipped.length;
    
    console.log('');
    console.log('🏁 VALIDACIÓN CRÍTICA COMPLETADA');
    console.log('=' .repeat(60));
    console.log(`⏱️  Duración total: ${Math.round(duration / 1000)}s`);
    console.log(`🧪 Tests ejecutados: ${totalTests}`);
    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    console.log(`⏭️ Omitidos: ${skipped}`);
    console.log('');
    
    // Mostrar estado de correcciones
    console.log('🎯 ESTADO DE CORRECCIONES VALIDADAS:');
    console.log('-'.repeat(40));
    
    const correcciones = [
      { key: 'dimensiones_a4', name: 'Dimensiones A4 landscape (3507x2480px)' },
      { key: 'font_size_36px', name: 'Font-size optimizado (36px)' },
      { key: 'margenes_6mm', name: 'Márgenes ajustados (6mm)' },
      { key: 'overflow_mejorado', name: 'Overflow handling mejorado' },
      { key: 'html2canvas_optimizado', name: 'html2canvas con onclone' }
    ];
    
    let correccionesValidadas = 0;
    correcciones.forEach(correccion => {
      const validado = this.results.correcciones[correccion.key];
      const icon = validado ? '✅' : '❌';
      console.log(`${icon} ${correccion.name}`);
      if (validado) correccionesValidadas++;
    });
    
    console.log('');
    console.log('📊 RESUMEN FINAL:');
    console.log('-'.repeat(40));
    console.log(`🎯 Correcciones validadas: ${correccionesValidadas}/${correcciones.length}`);
    
    if (correccionesValidadas === correcciones.length && failed === 0) {
      console.log('');
      console.log('🎉 ¡ÉXITO TOTAL!');
      console.log('✅ TODAS LAS CORRECCIONES HAN SIDO VALIDADAS');
      console.log('✅ EL PROBLEMA "PDF SE CORTA" HA SIDO RESUELTO');
      console.log('🎯 OBJETIVO ALCANZADO: 100% de validación');
    } else if (correccionesValidadas > 0) {
      console.log('');
      console.log('⚠️ VALIDACIÓN PARCIAL');
      console.log(`✅ ${correccionesValidadas} correcciones validadas exitosamente`);
      console.log(`❌ ${correcciones.length - correccionesValidadas} correcciones necesitan revisión`);
      if (failed > 0) {
        console.log(`⚠️ ${failed} tests fallaron - revisar logs para detalles`);
      }
    } else {
      console.log('');
      console.log('❌ VALIDACIÓN FALLIDA');
      console.log('❌ NO SE PUDO VALIDAR NINGUNA CORRECCIÓN');
      console.log('🔍 Revisar configuración del sistema y conexión');
    }
    
    console.log('');
    console.log('📁 ARCHIVOS GENERADOS:');
    console.log('• Reporte HTML: playwright-report/critical-pdf-corrections/index.html');
    console.log('• Resultados JSON: test-results/critical-pdf-corrections-results.json');
    console.log('• PDFs de prueba: test-results/downloads/');
    console.log('• Logs detallados: test-results/pdf-validation-logs-*.json');
    
    console.log('');
    console.log('🔍 PROBLEMA ORIGINAL: "PDF mejor pero sigue apareciendo cortado"');
    
    if (correccionesValidadas === correcciones.length && failed === 0) {
      console.log('✅ ESTADO ACTUAL: ¡PROBLEMA RESUELTO COMPLETAMENTE!');
    } else {
      console.log('⚠️ ESTADO ACTUAL: Correcciones implementadas, validación en progreso');
    }
    
    console.log('=' .repeat(60));
    console.log('');
  }

  onError(error) {
    console.log('');
    console.log('❌ ERROR CRÍTICO EN VALIDACIÓN:');
    console.log(error.message);
    console.log('');
  }
}

module.exports = CriticalCorrectionsReporter;