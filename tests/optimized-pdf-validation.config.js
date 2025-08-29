// optimized-pdf-validation.config.js
// Specific configuration for validating PDF optimizations

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  // Run optimized tests in sequence to avoid conflicts
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Sequential execution for PDF generation
  
  // Enhanced reporting for optimization validation
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report/optimized-pdf-validation',
      open: 'never'
    }],
    ['list'],
    ['json', { outputFile: 'test-results/optimized-pdf-validation-results.json' }]
  ],
  
  // Global test settings
  use: {
    baseURL: 'https://recibos.ciaociao.mx',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // PDF-specific settings
    acceptDownloads: true,
    permissions: ['camera', 'microphone'],
    
    // Extended timeouts for PDF generation
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium-pdf-optimizations',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: 'optimized-pdf-validation-final.spec.js'
    },
    
    // Add Firefox for cross-browser validation if needed
    {
      name: 'firefox-pdf-optimizations',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: 'optimized-pdf-validation-final.spec.js'
    },
  ],

  // Enhanced web server configuration
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./setup/optimized-validation-setup.js'),
  globalTeardown: require.resolve('./setup/optimized-validation-teardown.js'),
  
  // Test timeout settings
  timeout: 180000, // 3 minutes per test for comprehensive validation
  expect: {
    timeout: 30000, // Extended expect timeout
  },
});