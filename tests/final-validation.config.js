// final-validation.config.js
// COMPREHENSIVE CONFIGURATION FOR FINAL PDF VALIDATION TESTING

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/final-pdf-validation-suite.spec.js', // Only run the final validation suite
  fullyParallel: false, // Sequential execution to avoid download conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to prevent resource conflicts
  
  // Enhanced reporting for final validation
  reporter: [
    ['html', { 
      outputFolder: 'test-results/final-validation-report',
      open: 'never'
    }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-results/final-validation-results.json' }],
    ['junit', { outputFile: 'test-results/final-validation-junit.xml' }]
  ],
  
  // Global test configuration
  use: {
    baseURL: 'https://recibos.ciaociao.mx',
    
    // Enhanced tracing and debugging for final validation
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // PDF-specific configurations
    acceptDownloads: true,
    permissions: ['camera', 'microphone'],
    
    // Longer timeouts for comprehensive testing
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // Enhanced viewport for better PDF capture
    viewport: { width: 1920, height: 1080 },
    
    // Additional browser context settings
    contextOptions: {
      acceptDownloads: true,
      permissions: ['camera', 'microphone'],
    }
  },

  // Multi-browser testing configuration
  projects: [
    {
      name: 'chromium-comprehensive',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific settings for PDF generation
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-features=VizDisplayCompositor'
          ]
        },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
    
    // Uncomment if Firefox/WebKit are available and needed
    /*
    {
      name: 'firefox-comprehensive',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
    
    {
      name: 'webkit-comprehensive',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    }
    */
  ],

  // Local development server configuration
  webServer: [
    {
      command: 'python3 -m http.server 8080',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./setup/final-validation-setup.js'),
  globalTeardown: require.resolve('./setup/final-validation-teardown.js'),

  // Test timeout settings
  timeout: 120000, // 2 minutes per test
  expect: {
    timeout: 15000 // 15 seconds for assertions
  },

  // Output directories
  outputDir: 'test-results/final-validation-artifacts',
  
  // Additional configuration for PDF testing
  metadata: {
    testSuite: 'Final PDF Validation Suite',
    version: 'Context 7 - Final Verification',
    environment: process.env.NODE_ENV || 'test',
    timestamp: new Date().toISOString(),
    description: 'Comprehensive end-to-end validation of PDF generation functionality after Context 7 corrections'
  }
});