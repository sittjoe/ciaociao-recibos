#!/usr/bin/env node

// run-multi-tool-tests.js
// Comprehensive Test Runner for Multi-Tool Testing Suite
// Executes Playwright + Context7 + Puppeteer tests in coordinated fashion

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test suite configuration
const TEST_SUITE_CONFIG = {
  // Test execution modes
  modes: {
    quick: {
      description: 'Quick validation tests (critical functionality only)',
      duration: '~5 minutes',
      tests: [
        'tests/currency-format-validation.spec.js',
        'tests/context7/context7-production-test.spec.js',
        'tests/performance/pdf-generation-benchmarks.spec.js --grep "optimal-conditions"'
      ]
    },
    
    standard: {
      description: 'Standard test suite (comprehensive validation)',
      duration: '~15 minutes', 
      tests: [
        'tests/currency-format-validation.spec.js',
        'tests/context7/comprehensive-currency-pdf-validation.spec.js',
        'tests/puppeteer/cross-browser-pdf-testing.js',
        'tests/performance/pdf-generation-benchmarks.spec.js',
        'tests/visual-regression/beautiful-design-validation.spec.js --grep "Receipt Form Design"',
        'tests/mobile-responsive/mobile-pdf-generation.spec.js --grep "iPhone 12"'
      ]
    },
    
    comprehensive: {
      description: 'Full multi-tool test suite (all tests)',
      duration: '~45 minutes',
      tests: [
        'tests/currency-format-validation.spec.js',
        'tests/context7/comprehensive-currency-pdf-validation.spec.js',
        'tests/puppeteer/cross-browser-pdf-testing.js',
        'tests/performance/pdf-generation-benchmarks.spec.js',
        'tests/visual-regression/beautiful-design-validation.spec.js',
        'tests/mobile-responsive/mobile-pdf-generation.spec.js',
        'tests/pdf-formats/a4-vs-letter-comparison.spec.js'
      ]
    },
    
    ci: {
      description: 'CI/CD optimized test suite (parallel execution)',
      duration: '~10 minutes',
      tests: [
        'tests/currency-format-validation.spec.js',
        'tests/context7/context7-production-test.spec.js',
        'tests/performance/pdf-generation-benchmarks.spec.js --grep "standard-conditions"'
      ]
    }
  },
  
  // Tool-specific test configurations
  tools: {
    playwright: {
      config: 'playwright-multi-tool.config.js',
      command: 'npx playwright test',
      parallel: true
    },
    
    puppeteer: {
      config: null,
      command: 'node',
      parallel: false
    }
  }
};

/**
 * Main Test Runner Class
 */
class MultiToolTestRunner {
  constructor(options = {}) {
    this.options = {
      mode: options.mode || 'standard',
      verbose: options.verbose || false,
      headless: options.headless !== false, // Default to headless
      workers: options.workers || (process.env.CI ? 1 : 2),
      retries: options.retries || (process.env.CI ? 2 : 1),
      timeout: options.timeout || 60000,
      outputDir: options.outputDir || 'test-results',
      ...options
    };
    
    this.results = {
      startTime: new Date().toISOString(),
      mode: this.options.mode,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
    
    this.validateOptions();
  }
  
  validateOptions() {
    if (!TEST_SUITE_CONFIG.modes[this.options.mode]) {
      throw new Error(`Invalid test mode: ${this.options.mode}. Available modes: ${Object.keys(TEST_SUITE_CONFIG.modes).join(', ')}`);
    }
  }
  
  async run() {
    console.log('🧪 CIAOCIAO Multi-Tool Test Suite Runner');
    console.log('=' * 50);
    console.log(`📋 Mode: ${this.options.mode.toUpperCase()}`);
    console.log(`📝 Description: ${TEST_SUITE_CONFIG.modes[this.options.mode].description}`);
    console.log(`⏱️  Estimated Duration: ${TEST_SUITE_CONFIG.modes[this.options.mode].duration}`);
    console.log(`🔧 Configuration: ${this.options.headless ? 'Headless' : 'Headed'}, ${this.options.workers} workers`);
    console.log('');
    
    const startTime = Date.now();
    
    try {
      // Step 1: Environment validation
      await this.validateEnvironment();
      
      // Step 2: Start local server if needed
      await this.startLocalServer();
      
      // Step 3: Execute test suite
      await this.executeTestSuite();
      
      // Step 4: Generate unified reports
      await this.generateReports();
      
      this.results.summary.duration = Date.now() - startTime;
      this.results.endTime = new Date().toISOString();
      
      // Step 5: Print final results
      this.printFinalResults();
      
      // Exit with appropriate code
      const exitCode = this.results.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
  
  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js version ${nodeVersion} is too old. Requires Node.js 16+`);
    }
    console.log(`  ✓ Node.js ${nodeVersion}`);
    
    // Check required dependencies
    const requiredDeps = ['@playwright/test', 'puppeteer'];
    const packageJsonPath = path.resolve(__dirname, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        throw new Error(`Required dependency missing: ${dep}. Run 'npm install' first.`);
      }
      console.log(`  ✓ ${dep} installed`);
    }
    
    // Check test files exist
    const testFiles = TEST_SUITE_CONFIG.modes[this.options.mode].tests;
    for (const testFile of testFiles) {
      const cleanTestFile = testFile.split(' --grep')[0]; // Remove grep arguments
      const testPath = path.resolve(__dirname, cleanTestFile);
      
      if (!fs.existsSync(testPath)) {
        throw new Error(`Test file not found: ${testPath}`);
      }
    }
    console.log(`  ✓ All ${testFiles.length} test files found`);
    
    console.log('🔍 Environment validation complete');
  }
  
  async startLocalServer() {
    console.log('🌐 Starting local server...');
    
    // Check if server is already running
    try {
      const response = await fetch('http://localhost:8080', { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        console.log('  ✓ Server already running on port 8080');
        return;
      }
    } catch (error) {
      // Server not running, need to start it
    }
    
    // Start server
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('python3', ['-m', 'http.server', '8080'], {
        cwd: __dirname,
        stdio: 'pipe',
        detached: true
      });
      
      let serverStarted = false;
      
      serverProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Serving HTTP') && !serverStarted) {
          console.log('  ✓ Local server started on port 8080');
          serverStarted = true;
          
          // Store server process for cleanup
          this.serverProcess = serverProcess;
          resolve();
        }
      });
      
      serverProcess.on('error', (error) => {
        if (!serverStarted) {
          reject(new Error(`Failed to start server: ${error.message}`));
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!serverStarted) {
          serverProcess.kill();
          reject(new Error('Server start timeout'));
        }
      }, 10000);
    });
  }
  
  async executeTestSuite() {
    console.log('🧪 Executing test suite...');
    
    const testFiles = TEST_SUITE_CONFIG.modes[this.options.mode].tests;
    this.results.summary.total = testFiles.length;
    
    for (let i = 0; i < testFiles.length; i++) {
      const testFile = testFiles[i];
      console.log(`\n📋 Running test ${i + 1}/${testFiles.length}: ${testFile}`);
      
      const testResult = await this.runSingleTest(testFile);
      this.results.tests.push(testResult);
      
      // Update summary
      if (testResult.success) {
        this.results.summary.passed++;
        console.log(`  ✅ PASSED (${testResult.duration}ms)`);
      } else {
        this.results.summary.failed++;
        console.log(`  ❌ FAILED (${testResult.duration}ms)`);
        if (testResult.error) {
          console.log(`     Error: ${testResult.error}`);
        }
      }
    }
    
    console.log('\n🧪 Test suite execution complete');
  }
  
  async runSingleTest(testFile) {
    const testStartTime = Date.now();
    const testResult = {
      file: testFile,
      startTime: new Date().toISOString(),
      success: false,
      duration: 0,
      output: '',
      error: null
    };
    
    try {
      // Determine if this is a Playwright test or Puppeteer script
      const isPlaywrightTest = testFile.endsWith('.spec.js') && !testFile.includes('puppeteer');
      const isPuppeteerTest = testFile.includes('puppeteer') || testFile.endsWith('cross-browser-pdf-testing.js');
      
      let command, args;
      
      if (isPuppeteerTest) {
        // Run Puppeteer script directly with Node
        command = 'node';
        args = [testFile];
      } else {
        // Run with Playwright
        command = 'npx';
        args = [
          'playwright',
          'test',
          testFile,
          '--config=playwright-multi-tool.config.js',
          `--workers=${this.options.workers}`,
          `--retries=${this.options.retries}`,
          `--timeout=${this.options.timeout}`
        ];
        
        if (this.options.headless) {
          args.push('--headed=false');
        }
        
        // Add grep filter if specified
        const grepMatch = testFile.match(/--grep "([^"]+)"/);
        if (grepMatch) {
          args.push('--grep', grepMatch[1]);
        }
      }
      
      // Execute the test
      const result = await this.executeCommand(command, args, {
        cwd: __dirname,
        timeout: this.options.timeout * 2 // Give extra time for test execution
      });
      
      testResult.success = result.exitCode === 0;
      testResult.output = result.stdout;
      if (!testResult.success) {
        testResult.error = result.stderr;
      }
      
    } catch (error) {
      testResult.success = false;
      testResult.error = error.message;
    }
    
    testResult.duration = Date.now() - testStartTime;
    testResult.endTime = new Date().toISOString();
    
    return testResult;
  }
  
  async executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (exitCode) => {
        resolve({
          exitCode,
          stdout,
          stderr
        });
      });
      
      process.on('error', (error) => {
        reject(error);
      });
      
      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          process.kill();
          reject(new Error('Command timeout'));
        }, options.timeout);
      }
    });
  }
  
  async generateReports() {
    console.log('📊 Generating unified reports...');
    
    // Create results summary
    const resultsPath = path.resolve(__dirname, this.options.outputDir, 'multi-tool-execution-results.json');
    
    // Ensure output directory exists
    const outputDir = path.dirname(resultsPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save detailed results
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    // Generate human-readable summary
    const summaryPath = path.resolve(__dirname, this.options.outputDir, 'test-execution-summary.txt');
    const summaryContent = this.generateSummaryReport();
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`📊 Reports generated:`);
    console.log(`     📄 Detailed: ${resultsPath}`);
    console.log(`     📋 Summary: ${summaryPath}`);
  }
  
  generateSummaryReport() {
    const duration = (this.results.summary.duration / 1000).toFixed(1);
    const successRate = this.results.summary.total > 0 ? 
      ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) : '0';
    
    return `CIAOCIAO MULTI-TOOL TEST EXECUTION SUMMARY
=========================================

EXECUTION OVERVIEW:
- Mode: ${this.options.mode.toUpperCase()}
- Start Time: ${this.results.startTime}
- End Time: ${this.results.endTime}
- Duration: ${duration} seconds

RESULTS:
- Total Tests: ${this.results.summary.total}
- Passed: ${this.results.summary.passed}
- Failed: ${this.results.summary.failed}
- Success Rate: ${successRate}%

CONFIGURATION:
- Workers: ${this.options.workers}
- Retries: ${this.options.retries}
- Headless: ${this.options.headless}
- Timeout: ${this.options.timeout}ms

TEST DETAILS:
${this.results.tests.map((test, index) => `
${index + 1}. ${test.file}
   Status: ${test.success ? 'PASSED' : 'FAILED'}
   Duration: ${test.duration}ms
   ${test.error ? `Error: ${test.error}` : ''}
`).join('')}

ASSESSMENT:
${successRate >= 95 ? '🏆 EXCELLENT - All tests passed successfully!' : ''}
${successRate >= 80 && successRate < 95 ? '✅ GOOD - Most tests passed with minor issues.' : ''}
${successRate >= 60 && successRate < 80 ? '⚠️  ACCEPTABLE - Some tests failed, review needed.' : ''}
${successRate < 60 ? '❌ NEEDS WORK - Significant test failures detected.' : ''}

RECOMMENDATIONS:
${this.generateRecommendations()}
`;
  }
  
  generateRecommendations() {
    const recommendations = [];
    const successRate = (this.results.summary.passed / this.results.summary.total) * 100;
    
    if (successRate < 100) {
      recommendations.push('- Review and fix failed tests before deployment');
    }
    
    if (this.options.mode === 'quick') {
      recommendations.push('- Consider running standard or comprehensive mode for full validation');
    }
    
    recommendations.push('- Monitor test performance and optimize slow tests');
    recommendations.push('- Set up automated testing in CI/CD pipeline');
    
    const failedTests = this.results.tests.filter(test => !test.success);
    if (failedTests.some(test => test.file.includes('currency'))) {
      recommendations.push('- PRIORITY: Fix currency formatting issues (affects business logic)');
    }
    
    if (failedTests.some(test => test.file.includes('mobile'))) {
      recommendations.push('- Improve mobile compatibility for better user experience');
    }
    
    return recommendations.join('\n');
  }
  
  printFinalResults() {
    const duration = (this.results.summary.duration / 1000).toFixed(1);
    const successRate = this.results.summary.total > 0 ? 
      ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) : '0';
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 MULTI-TOOL TEST SUITE - EXECUTION COMPLETE');
    console.log('='.repeat(60));
    
    console.log(`📋 Mode: ${this.options.mode.toUpperCase()}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} passed (${successRate}%)`);
    
    if (successRate >= 95) {
      console.log('🏆 Status: EXCELLENT - All systems functioning correctly!');
    } else if (successRate >= 80) {
      console.log('✅ Status: GOOD - Minor issues detected, review recommended');
    } else if (successRate >= 60) {
      console.log('⚠️  Status: ACCEPTABLE - Several issues need attention');
    } else {
      console.log('❌ Status: NEEDS WORK - Significant problems detected');
    }
    
    console.log('\n📁 Reports available in:');
    console.log(`   - ${this.options.outputDir}/multi-tool-execution-results.json`);
    console.log(`   - ${this.options.outputDir}/test-execution-summary.txt`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      const failedTests = this.results.tests.filter(test => !test.success);
      failedTests.forEach(test => {
        console.log(`   - ${test.file}`);
        if (test.error) {
          console.log(`     Error: ${test.error.split('\n')[0]}`);
        }
      });
    }
    
    console.log('\n🧪 Multi-Tool Testing Complete!');
    console.log('='.repeat(60));
  }
  
  cleanup() {
    // Kill server process if we started it
    if (this.serverProcess) {
      try {
        process.kill(-this.serverProcess.pid); // Kill process group
        console.log('🌐 Local server stopped');
      } catch (error) {
        console.warn('⚠️  Could not stop server:', error.message);
      }
    }
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'standard',
    verbose: false,
    headless: true,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--workers':
      case '-w':
        options.workers = parseInt(args[++i]);
        break;
      case '--retries':
      case '-r':
        options.retries = parseInt(args[++i]);
        break;
      case '--timeout':
      case '-t':
        options.timeout = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }
  
  return options;
}

function printUsage() {
  console.log(`
🧪 CIAOCIAO Multi-Tool Test Suite Runner

USAGE:
  node run-multi-tool-tests.js [OPTIONS]

MODES:
  quick         - Quick validation (critical tests only, ~5 min)
  standard      - Standard test suite (comprehensive, ~15 min) [DEFAULT]
  comprehensive - Full test suite (all tests, ~45 min)
  ci            - CI/CD optimized (parallel, ~10 min)

OPTIONS:
  -m, --mode <mode>     Test execution mode (default: standard)
  -v, --verbose         Verbose output
  --headed              Run tests in headed mode (show browser)
  --headless            Run tests in headless mode [DEFAULT]
  -w, --workers <n>     Number of parallel workers (default: 2)
  -r, --retries <n>     Number of retries for failed tests (default: 1)
  -t, --timeout <ms>    Test timeout in milliseconds (default: 60000)
  -h, --help            Show this help message

EXAMPLES:
  node run-multi-tool-tests.js                           # Run standard tests
  node run-multi-tool-tests.js --mode quick              # Quick validation
  node run-multi-tool-tests.js --mode comprehensive      # Full test suite
  node run-multi-tool-tests.js --headed --verbose        # Debug mode
  node run-multi-tool-tests.js --mode ci --workers 1     # CI mode
`);
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    printUsage();
    process.exit(0);
  }
  
  const runner = new MultiToolTestRunner(options);
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Test execution interrupted');
    runner.cleanup();
    process.exit(1);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Test execution terminated');
    runner.cleanup();
    process.exit(1);
  });
  
  try {
    await runner.run();
  } finally {
    runner.cleanup();
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { MultiToolTestRunner, TEST_SUITE_CONFIG };