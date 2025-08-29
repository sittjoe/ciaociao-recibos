// critical-corrections-setup.js
// Setup específico para validación crítica de correcciones de PDF

const fs = require('fs');
const path = require('path');

async function globalSetup(config) {
  console.log('🚀 INICIANDO VALIDACIÓN CRÍTICA DE CORRECCIONES PDF');
  console.log('=' .repeat(60));
  
  const timestamp = new Date().toISOString();
  const setupInfo = {
    startTime: timestamp,
    config: {
      testDir: config.testDir,
      workers: config.workers,
      timeout: config.timeout
    },
    correcciones_validadas: {
      'CORRECCIÓN 1': 'Dimensiones A4 landscape - 3507x2480px',
      'CORRECCIÓN 2': 'Font-size optimizado - 36px',
      'CORRECCIÓN 3': 'Márgenes ajustados - 6mm por lado',
      'CORRECCIÓN 4': 'Overflow handling - visible + nowrap',
      'CORRECCIÓN 5': 'html2canvas optimizado - onclone function'
    },
    problema_original: 'PDF mejor pero sigue apareciendo cortado',
    objetivo: 'Confirmar 100% que problema está RESUELTO'
  };
  
  // Crear directorios necesarios
  const requiredDirs = [
    'test-results',
    'test-results/downloads', 
    'test-results/screenshots',
    'test-results/validation-logs',
    'playwright-report/critical-pdf-corrections'
  ];
  
  for (const dir of requiredDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }
  }
  
  // Limpiar archivos de pruebas anteriores
  const downloadsDir = path.join(process.cwd(), 'test-results/downloads');
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir);
    files.forEach(file => {
      if (file.endsWith('.pdf')) {
        fs.unlinkSync(path.join(downloadsDir, file));
        console.log(`🗑️  PDF anterior eliminado: ${file}`);
      }
    });
  }
  
  // Guardar información de setup
  const setupFile = path.join(process.cwd(), 'test-results/critical-corrections-setup.json');
  fs.writeFileSync(setupFile, JSON.stringify(setupInfo, null, 2));
  
  console.log('✅ Setup de validación crítica completado');
  console.log(`📝 Información guardada en: ${setupFile}`);
  console.log('');
  
  // Mostrar resumen de correcciones a validar
  console.log('🎯 CORRECCIONES A VALIDAR:');
  console.log('-'.repeat(40));
  Object.entries(setupInfo.correcciones_validadas).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.log('');
  console.log('🔍 PROBLEMA ORIGINAL:', setupInfo.problema_original);
  console.log('🎯 OBJETIVO:', setupInfo.objetivo);
  console.log('=' .repeat(60));
  console.log('');
  
  return setupInfo;
}

module.exports = globalSetup;