// final-validation-setup.js
// GLOBAL SETUP FOR FINAL PDF VALIDATION SUITE

const fs = require('fs');
const path = require('path');

async function globalSetup() {
  console.log('\n🚀 FINAL PDF VALIDATION SUITE - GLOBAL SETUP');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  // Create necessary directories
  const directories = [
    'test-results/final-pdf-validation',
    'test-results/final-validation-report',
    'test-results/final-validation-artifacts'
  ];
  
  console.log('📁 Creating test directories...');
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✅ Created: ${dir}`);
    } else {
      console.log(`   ℹ️  Already exists: ${dir}`);
    }
  });
  
  // Clean previous test results
  console.log('🧹 Cleaning previous test results...');
  const cleanupDirs = [
    'test-results/final-pdf-validation',
    'test-results/final-validation-artifacts'
  ];
  
  cleanupDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log(`   🗑️  Cleaned: ${dir} (${files.length} files removed)`);
    }
  });
  
  // Create test metadata
  const metadata = {
    testSuite: 'Final PDF Validation Suite',
    version: 'Context 7 - Final Verification',
    startTime: new Date().toISOString(),
    startTimestamp: startTime,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd()
    },
    configuration: {
      baseURL: 'https://recibos.ciaociao.mx',
      fallbackURL: 'http://localhost:8080',
      password: '27181730',
      timeout: 120000,
      downloadTimeout: 30000
    },
    testScenarios: [
      'Minimal data PDF generation',
      'Comprehensive data PDF generation', 
      'Repair transaction PDF generation',
      'Technical library validation',
      'Performance and timing validation',
      'Error recovery and fallback testing'
    ],
    expectedOutcomes: {
      pdfGeneration: 'Should generate valid PDF files > 1KB',
      downloadVerification: 'Should successfully download PDF files',
      technicalValidation: 'CDN libraries should be loaded and functional',
      performanceValidation: 'PDF generation should complete within 30 seconds',
      errorRecovery: 'System should handle missing dependencies gracefully'
    }
  };
  
  const metadataPath = path.join(process.cwd(), 'test-results/final-validation-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('📊 Test metadata created:', metadataPath);
  
  // Verify system requirements
  console.log('🔍 Verifying system requirements...');
  
  // Check if local server is available (fallback)
  try {
    const { execSync } = require('child_process');
    const pythonVersion = execSync('python3 --version', { encoding: 'utf8' });
    console.log(`   ✅ Python available: ${pythonVersion.trim()}`);
  } catch (error) {
    console.log('   ⚠️  Python3 not available - local server fallback may not work');
  }
  
  // Log configuration summary
  console.log('\n📋 FINAL VALIDATION CONFIGURATION SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Primary URL: https://recibos.ciaociao.mx/receipt-mode.html`);
  console.log(`Fallback URL: http://localhost:8080/receipt-mode.html`);
  console.log(`Password: ${metadata.configuration.password}`);
  console.log(`Test Timeout: ${metadata.configuration.timeout}ms`);
  console.log(`Download Timeout: ${metadata.configuration.downloadTimeout}ms`);
  console.log(`Total Test Scenarios: ${metadata.testScenarios.length}`);
  console.log('─'.repeat(60));
  
  // Pre-flight system check
  console.log('\n🔧 PRE-FLIGHT SYSTEM CHECK');
  console.log('─'.repeat(60));
  
  const systemCheck = {
    nodeJs: !!process.version,
    fileSystem: fs.existsSync(process.cwd()),
    testDirectory: fs.existsSync(path.join(process.cwd(), 'tests')),
    receiptModeFile: fs.existsSync(path.join(process.cwd(), 'receipt-mode.html')),
    packageJson: fs.existsSync(path.join(process.cwd(), 'package.json')),
    playwrightConfig: fs.existsSync(path.join(process.cwd(), 'playwright.config.js')),
  };
  
  let allChecksPassed = true;
  
  Object.entries(systemCheck).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${check}: ${passed ? 'OK' : 'FAILED'}`);
    if (!passed) allChecksPassed = false;
  });
  
  if (!allChecksPassed) {
    console.error('\n❌ PRE-FLIGHT CHECK FAILED - Some system requirements are missing');
    console.error('Please ensure all required files are present before running tests');
  } else {
    console.log('\n✅ PRE-FLIGHT CHECK PASSED - All system requirements met');
  }
  
  const setupTime = Date.now() - startTime;
  console.log(`\n⏱️  Setup completed in ${setupTime}ms`);
  console.log('🚀 Ready to begin Final PDF Validation Suite...');
  console.log('='.repeat(60));
  
  return metadata;
}

module.exports = globalSetup;