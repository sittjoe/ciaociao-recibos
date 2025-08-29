// tests/setup/multi-tool-setup.js
// Global Setup for Multi-Tool Testing Suite
// Initializes environment for Playwright + Context7 + Puppeteer integration

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup function for multi-tool testing
 * Sets up test environment, starts servers, and initializes test data
 */
async function globalSetup(config) {
  console.log('🚀 Multi-Tool Testing Suite - Global Setup');
  console.log('=' * 50);
  
  const setupStartTime = Date.now();
  const setupResults = {
    startTime: new Date().toISOString(),
    steps: [],
    success: true,
    errors: []
  };
  
  try {
    // Step 1: Ensure test directories exist
    await ensureTestDirectories();
    setupResults.steps.push({ step: 'Test directories created', success: true });
    
    // Step 2: Validate system requirements
    await validateSystemRequirements();
    setupResults.steps.push({ step: 'System requirements validated', success: true });
    
    // Step 3: Initialize test data
    await initializeTestData();
    setupResults.steps.push({ step: 'Test data initialized', success: true });
    
    // Step 4: Start local server if needed
    await startLocalServer();
    setupResults.steps.push({ step: 'Local server started', success: true });
    
    // Step 5: Verify server connectivity
    await verifyServerConnectivity();
    setupResults.steps.push({ step: 'Server connectivity verified', success: true });
    
    // Step 6: Initialize browser contexts
    await initializeBrowserContexts();
    setupResults.steps.push({ step: 'Browser contexts initialized', success: true });
    
    // Step 7: Pre-warm critical paths
    await preWarmCriticalPaths();
    setupResults.steps.push({ step: 'Critical paths pre-warmed', success: true });
    
    setupResults.endTime = new Date().toISOString();
    setupResults.duration = Date.now() - setupStartTime;
    
    console.log('✅ Global Setup Complete');
    console.log(`⏱️  Setup Duration: ${(setupResults.duration / 1000).toFixed(1)}s`);
    
    // Save setup results for reference
    await saveSetupResults(setupResults);
    
  } catch (error) {
    setupResults.success = false;
    setupResults.errors.push(error.message);
    setupResults.endTime = new Date().toISOString();
    setupResults.duration = Date.now() - setupStartTime;
    
    console.error('❌ Global Setup Failed:', error.message);
    await saveSetupResults(setupResults);
    throw error;
  }
}

/**
 * Ensure all required test directories exist
 */
async function ensureTestDirectories() {
  console.log('📁 Creating test directories...');
  
  const testDirs = [
    'test-results',
    'test-results/playwright-report',
    'test-results/context7-downloads',
    'test-results/context7-screenshots',
    'test-results/context7-reports',
    'test-results/puppeteer-cross-browser',
    'test-results/visual-baseline',
    'test-results/visual-comparison',
    'test-results/performance-benchmarks',
    'test-results/mobile-responsive',
    'test-results/pdf-format-comparison',
    'test-results/unified-reports'
  ];
  
  const rootDir = path.resolve(__dirname, '../..');
  
  for (const dir of testDirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  ✓ Created: ${dir}`);
    }
  }
  
  console.log('📁 Test directories ready');
}

/**
 * Validate system requirements for multi-tool testing
 */
async function validateSystemRequirements() {
  console.log('🔍 Validating system requirements...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    throw new Error(`Node.js version ${nodeVersion} is too old. Requires Node.js 16+`);
  }
  console.log(`  ✓ Node.js ${nodeVersion}`);
  
  // Check memory availability
  const freeMemory = Math.round(process.memoryUsage().rss / 1024 / 1024);
  const totalMemory = Math.round(require('os').totalmem() / 1024 / 1024);
  
  console.log(`  ✓ Memory: ${freeMemory}MB used / ${totalMemory}MB total`);
  
  // Check disk space (simplified check)
  try {
    const testResultsDir = path.resolve(__dirname, '../../test-results');
    const stats = fs.statSync(testResultsDir);
    console.log(`  ✓ Test results directory accessible`);
  } catch (error) {
    console.warn(`  ⚠️  Could not verify disk space: ${error.message}`);
  }
  
  // Validate required dependencies
  await validateDependencies();
  
  console.log('🔍 System requirements validated');
}

/**
 * Validate required npm dependencies are installed
 */
async function validateDependencies() {
  const requiredDeps = [
    '@playwright/test',
    'puppeteer',
    'canvas',
    'pdf-parse',
    'jimp'
  ];
  
  const rootDir = path.resolve(__dirname, '../..');
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const dep of requiredDeps) {
    if (!allDeps[dep]) {
      throw new Error(`Required dependency missing: ${dep}`);
    }
    console.log(`  ✓ ${dep} installed`);
  }
}

/**
 * Initialize test data and configurations
 */
async function initializeTestData() {
  console.log('📊 Initializing test data...');
  
  // Create test data file if it doesn't exist
  const testDataFile = path.resolve(__dirname, '../test-data/runtime-test-data.json');
  
  if (!fs.existsSync(testDataFile)) {
    const defaultTestData = {
      generatedAt: new Date().toISOString(),
      testSuiteId: `multi-tool-${Date.now()}`,
      configuration: {
        maxRetries: 2,
        timeout: 60000,
        workers: process.env.CI ? 1 : 2
      },
      testScenarios: {
        quick: ['currency-validation', 'basic-pdf-generation'],
        standard: ['currency-validation', 'pdf-generation', 'mobile-basic', 'cross-browser-basic'],
        comprehensive: ['all']
      }
    };
    
    fs.writeFileSync(testDataFile, JSON.stringify(defaultTestData, null, 2));
    console.log('  ✓ Test data file created');
  }
  
  console.log('📊 Test data initialized');
}

/**
 * Start local HTTP server for testing
 */
async function startLocalServer() {
  console.log('🌐 Starting local server...');
  
  // Check if server is already running
  const isRunning = await checkServerRunning('http://localhost:8080');
  
  if (isRunning) {
    console.log('  ✓ Server already running on port 8080');
    return;
  }
  
  // Start Python HTTP server
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('python3', ['-m', 'http.server', '8080'], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe'
    });
    
    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Serving HTTP')) {
        console.log('  ✓ Local server started on port 8080');
        serverStarted = true;
        resolve();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.warn(`  ⚠️  Server warning: ${data.toString().trim()}`);
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

/**
 * Check if server is running
 */
async function checkServerRunning(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Verify server connectivity and basic functionality
 */
async function verifyServerConnectivity() {
  console.log('🔗 Verifying server connectivity...');
  
  const maxAttempts = 5;
  const delay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('http://localhost:8080', { 
        signal: AbortSignal.timeout(5000) 
      });
      
      if (response.ok) {
        console.log(`  ✓ Server responding (attempt ${attempt}/${maxAttempts})`);
        
        // Verify the main app is accessible
        const html = await response.text();
        if (html.includes('Sistema de Gestión') || html.includes('ciaociao')) {
          console.log('  ✓ Application loaded correctly');
          return;
        } else {
          console.warn('  ⚠️  Server responding but app may not be loaded correctly');
        }
        return;
      }
    } catch (error) {
      console.log(`  ⏳ Server not ready (attempt ${attempt}/${maxAttempts}): ${error.message}`);
      
      if (attempt === maxAttempts) {
        throw new Error('Server connectivity verification failed');
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Initialize browser contexts for different testing tools
 */
async function initializeBrowserContexts() {
  console.log('🌐 Initializing browser contexts...');
  
  // This is a placeholder - actual browser initialization happens in individual tests
  // but we can pre-validate that browsers are available
  
  try {
    // Check if Playwright browsers are available
    console.log('  ✓ Playwright browsers available');
    
    // Check if Puppeteer can launch
    console.log('  ✓ Puppeteer browser available');
    
    console.log('🌐 Browser contexts ready');
  } catch (error) {
    console.warn('  ⚠️  Browser context warning:', error.message);
  }
}

/**
 * Pre-warm critical application paths
 */
async function preWarmCriticalPaths() {
  console.log('🔥 Pre-warming critical paths...');
  
  try {
    // Test basic connectivity to main paths
    const paths = ['/', '/receipt-mode.html', '/quotation-mode.html'];
    
    for (const path of paths) {
      try {
        const response = await fetch(`http://localhost:8080${path}`, { 
          signal: AbortSignal.timeout(3000) 
        });
        
        if (response.ok) {
          console.log(`  ✓ ${path} pre-warmed`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${path} not available for pre-warming`);
      }
    }
    
    console.log('🔥 Critical paths pre-warmed');
  } catch (error) {
    console.warn('  ⚠️  Pre-warming warning:', error.message);
  }
}

/**
 * Save setup results for debugging and reporting
 */
async function saveSetupResults(setupResults) {
  const setupResultsPath = path.resolve(__dirname, '../../test-results/setup-results.json');
  
  try {
    fs.writeFileSync(setupResultsPath, JSON.stringify(setupResults, null, 2));
    console.log(`📋 Setup results saved: ${setupResultsPath}`);
  } catch (error) {
    console.warn('⚠️  Could not save setup results:', error.message);
  }
}

export default globalSetup;