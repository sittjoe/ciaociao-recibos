#!/usr/bin/env node

// run-final-pdf-validation.js
// COMPREHENSIVE PDF VALIDATION RUNNER - CONTEXT 7 FINAL VERIFICATION
// This script runs the complete PDF validation suite and generates a detailed report

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 CIAOCIAO PDF GENERATION - FINAL VALIDATION SUITE');
console.log('='.repeat(70));
console.log('Context 7 - Comprehensive End-to-End Testing');
console.log('Testing all corrections and ensuring 100% functionality');
console.log('='.repeat(70));

const VALIDATION_CONFIG = {
  startTime: Date.now(),
  maxRetries: 2,
  timeoutMinutes: 10,
  requiredDirectories: [
    'test-results',
    'tests'
  ],
  requiredFiles: [
    'tests/final-pdf-validation-suite.spec.js',
    'tests/final-validation.config.js',
    'tests/setup/final-validation-setup.js',
    'tests/setup/final-validation-teardown.js',
    'receipt-mode.html',
    'package.json'
  ]
};

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function logWithColor(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  logWithColor('green', `✅ ${message}`);
}

function logWarning(message) {
  logWithColor('yellow', `⚠️  ${message}`);
}

function logError(message) {
  logWithColor('red', `❌ ${message}`);
}

function logInfo(message) {
  logWithColor('blue', `ℹ️  ${message}`);
}

async function validatePrerequisites() {
  logStep('STEP 1', 'Validating Prerequisites');
  
  let allValid = true;
  
  // Check required directories
  console.log('\n📁 Checking required directories...');
  VALIDATION_CONFIG.requiredDirectories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      logSuccess(`Directory exists: ${dir}`);
    } else {
      logError(`Missing directory: ${dir}`);
      // Create the directory
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        logInfo(`Created directory: ${dir}`);
      } catch (error) {
        logError(`Failed to create directory ${dir}: ${error.message}`);
        allValid = false;
      }
    }
  });
  
  // Check required files
  console.log('\n📄 Checking required files...');
  VALIDATION_CONFIG.requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      logSuccess(`File exists: ${file}`);
    } else {
      logError(`Missing file: ${file}`);
      allValid = false;
    }
  });
  
  // Check Node.js and npm
  console.log('\n🔧 Checking system requirements...');
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js version: ${nodeVersion}`);
  } catch (error) {
    logError('Node.js not found');
    allValid = false;
  }
  
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm version: ${npmVersion}`);
  } catch (error) {
    logError('npm not found');
    allValid = false;
  }
  
  // Check Playwright installation
  try {
    const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' }).trim();
    logSuccess(`Playwright: ${playwrightVersion}`);
  } catch (error) {
    logWarning('Playwright not found - will attempt installation');
  }
  
  // Check Python for local server fallback
  try {
    const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
    logSuccess(`Python fallback server: ${pythonVersion}`);
  } catch (error) {
    logWarning('Python3 not available - local server fallback disabled');
  }
  
  if (!allValid) {
    logError('Prerequisites validation failed - cannot continue');
    process.exit(1);
  }
  
  logSuccess('All prerequisites validated successfully');
  return true;
}

async function installDependencies() {
  logStep('STEP 2', 'Installing/Verifying Dependencies');
  
  try {
    // Install npm dependencies
    console.log('\n📦 Installing npm dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('npm dependencies installed');
    
    // Install Playwright browsers
    console.log('\n🌐 Installing Playwright browsers...');
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      logSuccess('Playwright Chromium browser installed');
    } catch (error) {
      logWarning('Playwright browser installation failed - tests may fail');
    }
    
  } catch (error) {
    logError(`Dependency installation failed: ${error.message}`);
    throw error;
  }
}

async function runValidationSuite() {
  logStep('STEP 3', 'Running Final PDF Validation Suite');
  
  return new Promise((resolve, reject) => {
    const playwrightCmd = 'npx';
    const playwrightArgs = [
      'playwright', 
      'test',
      '--config=tests/final-validation.config.js',
      '--reporter=list,html,json'
    ];
    
    console.log(`\n🧪 Executing command: ${playwrightCmd} ${playwrightArgs.join(' ')}`);
    console.log('─'.repeat(50));
    
    const testProcess = spawn(playwrightCmd, playwrightArgs, {
      stdio: 'inherit',
      shell: true
    });
    
    let testCompleted = false;
    const testTimeout = setTimeout(() => {
      if (!testCompleted) {
        logError(`Test suite timed out after ${VALIDATION_CONFIG.timeoutMinutes} minutes`);
        testProcess.kill('SIGTERM');
        reject(new Error('Test timeout'));
      }
    }, VALIDATION_CONFIG.timeoutMinutes * 60 * 1000);
    
    testProcess.on('close', (code) => {
      testCompleted = true;
      clearTimeout(testTimeout);
      
      console.log('─'.repeat(50));
      
      if (code === 0) {
        logSuccess('Final PDF validation suite completed successfully');
        resolve({ success: true, exitCode: code });
      } else {
        logWarning(`Test suite completed with exit code: ${code}`);
        // Don't reject on non-zero exit code as we want to analyze results
        resolve({ success: false, exitCode: code });
      }
    });
    
    testProcess.on('error', (error) => {
      testCompleted = true;
      clearTimeout(testTimeout);
      logError(`Test process error: ${error.message}`);
      reject(error);
    });
  });
}

async function analyzeResults() {
  logStep('STEP 4', 'Analyzing Test Results');
  
  const resultsAnalysis = {
    screenshots: 0,
    pdfDownloads: 0,
    totalFileSize: 0,
    testsPassed: 0,
    testsFailed: 0,
    hasJsonResults: false,
    hasHtmlReport: false,
    criticalIssues: []
  };
  
  // Check for screenshots and PDFs
  const screenshotDir = path.join(process.cwd(), 'test-results/final-pdf-validation');
  if (fs.existsSync(screenshotDir)) {
    const files = fs.readdirSync(screenshotDir);
    files.forEach(file => {
      const filePath = path.join(screenshotDir, file);
      const stats = fs.statSync(filePath);
      resultsAnalysis.totalFileSize += stats.size;
      
      if (file.endsWith('.png')) {
        resultsAnalysis.screenshots++;
      } else if (file.endsWith('.pdf')) {
        resultsAnalysis.pdfDownloads++;
      }
    });
    
    logInfo(`Found ${resultsAnalysis.screenshots} screenshots and ${resultsAnalysis.pdfDownloads} PDF downloads`);
  }
  
  // Check for JSON results
  const jsonResultsPath = path.join(process.cwd(), 'test-results/final-validation-results.json');
  if (fs.existsSync(jsonResultsPath)) {
    try {
      const jsonResults = JSON.parse(fs.readFileSync(jsonResultsPath, 'utf8'));
      resultsAnalysis.hasJsonResults = true;
      resultsAnalysis.testsPassed = jsonResults.stats?.passed || 0;
      resultsAnalysis.testsFailed = jsonResults.stats?.failed || 0;
      logInfo(`Test results: ${resultsAnalysis.testsPassed} passed, ${resultsAnalysis.testsFailed} failed`);
    } catch (error) {
      logWarning('Could not parse JSON results file');
    }
  }
  
  // Check for HTML report
  const htmlReportDir = path.join(process.cwd(), 'test-results/final-validation-report');
  if (fs.existsSync(htmlReportDir)) {
    resultsAnalysis.hasHtmlReport = true;
    logInfo('HTML test report generated');
  }
  
  // Analyze critical issues
  if (resultsAnalysis.pdfDownloads === 0) {
    resultsAnalysis.criticalIssues.push('No PDF files were generated - PDF functionality may be broken');
  }
  
  if (resultsAnalysis.testsFailed > 0) {
    resultsAnalysis.criticalIssues.push(`${resultsAnalysis.testsFailed} tests failed - review individual test results`);
  }
  
  if (resultsAnalysis.screenshots === 0) {
    resultsAnalysis.criticalIssues.push('No screenshots captured - tests may not have run properly');
  }
  
  return resultsAnalysis;
}

async function generateFinalReport(testResult, analysisResult) {
  logStep('STEP 5', 'Generating Final Report');
  
  const executionTime = Date.now() - VALIDATION_CONFIG.startTime;
  const executionMinutes = (executionTime / (1000 * 60)).toFixed(2);
  
  const report = {
    testExecution: {
      startTime: new Date(VALIDATION_CONFIG.startTime).toISOString(),
      endTime: new Date().toISOString(),
      executionTimeMs: executionTime,
      executionTimeMinutes: parseFloat(executionMinutes),
      success: testResult.success,
      exitCode: testResult.exitCode
    },
    results: analysisResult,
    validation: {
      pdfGenerationFunctional: analysisResult.pdfDownloads > 0,
      testsExecuted: (analysisResult.testsPassed + analysisResult.testsFailed) > 0,
      noFailures: analysisResult.testsFailed === 0,
      hasArtifacts: analysisResult.screenshots > 0 || analysisResult.pdfDownloads > 0
    },
    conclusion: '',
    recommendations: []
  };
  
  // Generate conclusion
  if (report.validation.pdfGenerationFunctional && report.validation.noFailures) {
    report.conclusion = 'SUCCESS: PDF generation system is fully functional and ready for production use!';
    report.recommendations.push('System passed all validations - deploy with confidence');
    report.recommendations.push('Continue monitoring PDF generation in production environment');
  } else if (report.validation.pdfGenerationFunctional && !report.validation.noFailures) {
    report.conclusion = 'PARTIAL SUCCESS: PDF generation works but some tests failed - review required';
    report.recommendations.push('Investigate failing tests before production deployment');
    report.recommendations.push('PDF generation core functionality is working');
  } else {
    report.conclusion = 'CRITICAL FAILURE: PDF generation is not working - immediate attention required';
    report.recommendations.push('Do not deploy to production - fix critical issues first');
    report.recommendations.push('Review test logs and console output for debugging information');
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'FINAL-PDF-VALIDATION-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Create summary report
  const summaryReport = `
# FINAL PDF VALIDATION REPORT - CONTEXT 7

## Executive Summary
**Status:** ${report.conclusion}
**Execution Time:** ${report.testExecution.executionTimeMinutes} minutes
**Tests Passed:** ${report.results.testsPassed}
**Tests Failed:** ${report.results.testsFailed}

## Key Metrics
- **PDF Downloads Generated:** ${report.results.pdfDownloads} ✅
- **Screenshots Captured:** ${report.results.screenshots}
- **Total Artifacts Size:** ${(report.results.totalFileSize / 1024).toFixed(2)} KB
- **Test Execution Success:** ${report.testExecution.success ? 'YES' : 'NO'}

## Validation Results
- **PDF Generation Functional:** ${report.validation.pdfGenerationFunctional ? '✅ YES' : '❌ NO'}
- **Tests Executed:** ${report.validation.testsExecuted ? '✅ YES' : '❌ NO'}
- **No Test Failures:** ${report.validation.noFailures ? '✅ YES' : '❌ NO'}
- **Has Test Artifacts:** ${report.validation.hasArtifacts ? '✅ YES' : '❌ NO'}

## Critical Issues
${analysisResult.criticalIssues.length > 0 ? 
  analysisResult.criticalIssues.map(issue => `- ❌ ${issue}`).join('\n') : 
  '- No critical issues detected ✅'}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Technical Details
- **Execution Start:** ${report.testExecution.startTime}
- **Execution End:** ${report.testExecution.endTime}
- **Exit Code:** ${report.testExecution.exitCode}
- **JSON Results Available:** ${report.results.hasJsonResults ? 'Yes' : 'No'}
- **HTML Report Available:** ${report.results.hasHtmlReport ? 'Yes' : 'No'}

---
*Generated by Final PDF Validation Suite*
*Context 7 - Comprehensive Testing Framework*
`;
  
  const summaryPath = path.join(process.cwd(), 'FINAL-VALIDATION-SUMMARY.md');
  fs.writeFileSync(summaryPath, summaryReport);
  
  return { report, reportPath, summaryPath };
}

async function displayFinalResults(report, reportPath, summaryPath) {
  logStep('FINAL RESULTS', 'PDF Generation Validation Complete');
  
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bright}${colors.cyan}CIAOCIAO PDF GENERATION - FINAL VALIDATION RESULTS${colors.reset}`);
  console.log('='.repeat(70));
  
  // Display key metrics with colors
  if (report.validation.pdfGenerationFunctional) {
    logSuccess(`PDF GENERATION: WORKING ✅`);
  } else {
    logError(`PDF GENERATION: FAILED ❌`);
  }
  
  console.log(`${colors.blue}Tests Passed:${colors.reset} ${report.results.testsPassed}`);
  console.log(`${colors.red}Tests Failed:${colors.reset} ${report.results.testsFailed}`);
  console.log(`${colors.green}PDFs Generated:${colors.reset} ${report.results.pdfDownloads}`);
  console.log(`${colors.yellow}Screenshots:${colors.reset} ${report.results.screenshots}`);
  console.log(`${colors.magenta}Execution Time:${colors.reset} ${report.testExecution.executionTimeMinutes} minutes`);
  
  console.log('\n' + '─'.repeat(70));
  
  // Display conclusion with appropriate color
  if (report.validation.pdfGenerationFunctional && report.validation.noFailures) {
    logWithColor('green', `🎉 ${report.conclusion}`);
  } else if (report.validation.pdfGenerationFunctional) {
    logWithColor('yellow', `⚠️  ${report.conclusion}`);
  } else {
    logWithColor('red', `❌ ${report.conclusion}`);
  }
  
  console.log('\n📁 Reports Generated:');
  logInfo(`Detailed Report: ${reportPath}`);
  logInfo(`Summary Report: ${summaryPath}`);
  
  if (report.results.hasHtmlReport) {
    logInfo(`HTML Report: test-results/final-validation-report/index.html`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Return appropriate exit code
  return report.validation.pdfGenerationFunctional && report.validation.noFailures ? 0 : 1;
}

// MAIN EXECUTION
async function main() {
  let finalExitCode = 0;
  
  try {
    // Run validation steps
    await validatePrerequisites();
    await installDependencies();
    
    const testResult = await runValidationSuite();
    const analysisResult = await analyzeResults();
    const { report, reportPath, summaryPath } = await generateFinalReport(testResult, analysisResult);
    
    finalExitCode = await displayFinalResults(report, reportPath, summaryPath);
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    logError('VALIDATION SUITE EXECUTION FAILED');
    logError(error.message);
    console.log('='.repeat(70));
    finalExitCode = 1;
  }
  
  process.exit(finalExitCode);
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Validation suite interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Validation suite terminated');
  process.exit(143);
});

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});