// tests/setup/critical-diagnosis-setup.js
// Setup global para diagnóstico crítico PDF

const fs = require('fs');
const path = require('path');

async function globalSetup() {
  console.log('\n🔧 CONFIGURANDO DIAGNÓSTICO CRÍTICO PDF');
  console.log('=======================================');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionId = `CRITICAL-PDF-DIAG-${timestamp}`;
  
  // Crear estructura de directorios
  const baseDir = './test-results/critical-pdf-diagnosis';
  const sessionDir = path.join(baseDir, sessionId);
  const screenshotsDir = path.join(sessionDir, 'screenshots');
  const tracesDir = path.join(sessionDir, 'traces');
  const videosDir = path.join(sessionDir, 'videos');
  const reportsDir = path.join(sessionDir, 'reports');
  
  const dirsToCreate = [
    baseDir,
    sessionDir,
    screenshotsDir,
    tracesDir,
    videosDir,
    reportsDir
  ];
  
  dirsToCreate.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
  
  // Crear archivo de metadata de la sesión
  const sessionMetadata = {
    sessionId,
    startTime: Date.now(),
    startTimeISO: new Date().toISOString(),
    problem: 'PDF generation fails while preview works perfectly',
    objective: 'Identify exact root cause with comprehensive monitoring',
    testPlan: [
      'Complete navigation flow with error capture',
      'Deep dependency analysis and timing',
      'generatePDF function interception and tracing',
      'Event listener and handler verification'
    ],
    expectedOutcomes: [
      'Confirmation of problem existence',
      'Identification of root cause',
      'Specific recommendations for fix',
      'Detailed error evidence'
    ],
    environment: {
      url: 'https://recibos.ciaociao.mx/receipt-mode.html',
      password: '27181730',
      browser: 'Chromium',
      testFramework: 'Playwright'
    }
  };
  
  const metadataPath = path.join(sessionDir, 'session-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(sessionMetadata, null, 2));
  
  // Store session info for tests to use
  process.env.CRITICAL_DIAGNOSIS_SESSION_ID = sessionId;
  process.env.CRITICAL_DIAGNOSIS_DIR = sessionDir;
  
  console.log(`📋 Session ID: ${sessionId}`);
  console.log(`📂 Results directory: ${sessionDir}`);
  console.log(`📄 Metadata saved: ${metadataPath}`);
  console.log('=======================================\n');
  
  return { sessionId, sessionDir };
}

module.exports = globalSetup;