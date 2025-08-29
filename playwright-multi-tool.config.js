// playwright-multi-tool.config.js
// Comprehensive Multi-Tool Testing Configuration
// Integrates Playwright + Context7 + Puppeteer for PDF Generation Testing

import { defineConfig, devices } from '@playwright/test';
import { Context7Config } from './tests/context7/context7.config.js';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential execution for stability with PDF generation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 1 : 2,
  timeout: 60000, // Extended timeout for PDF operations
  
  // Global test setup and teardown
  globalSetup: './tests/setup/multi-tool-setup.js',
  globalTeardown: './tests/setup/multi-tool-teardown.js',
  
  // Multi-format reporting for comprehensive analysis
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/multi-tool-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['./tests/utilities/multi-tool-reporter.js'],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:8080',
    
    // Enhanced tracing and debugging
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // PDF-specific configurations
    acceptDownloads: true,
    permissions: ['camera', 'microphone'],
    
    // Performance and reliability settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // User agent for testing
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 CIAOCIAOTestBot/1.0'
  },

  // Multi-browser and device projects for comprehensive testing
  projects: [
    // Desktop Testing Projects
    {
      name: 'chromium-desktop-currency',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/currency-*.spec.js',
        '**/context7/**/*.spec.js',
        '**/multi-tool/**/*.spec.js'
      ]
    },
    
    {
      name: 'webkit-desktop-safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/currency-*.spec.js',
        '**/cross-browser/**/*.spec.js'
      ]
    },
    
    {
      name: 'firefox-desktop-mozilla',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/currency-*.spec.js',
        '**/cross-browser/**/*.spec.js'
      ]
    },

    // Mobile Testing Projects
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/mobile-responsive/**/*.spec.js',
        '**/currency-mobile-*.spec.js'
      ]
    },
    
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/mobile-responsive/**/*.spec.js',
        '**/currency-mobile-*.spec.js'
      ]
    },

    // PDF Format Specific Projects
    {
      name: 'pdf-a4-format',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        },
        // Custom context for A4 testing
        extraHTTPHeaders: {
          'X-PDF-Format': 'A4'
        }
      },
      testMatch: [
        '**/pdf-formats/**/*.spec.js'
      ]
    },
    
    {
      name: 'pdf-letter-format', 
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        },
        // Custom context for US Letter testing
        extraHTTPHeaders: {
          'X-PDF-Format': 'Letter'
        }
      },
      testMatch: [
        '**/pdf-formats/**/*.spec.js'
      ]
    },

    // Performance Testing Project
    {
      name: 'performance-benchmarks',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/performance/**/*.spec.js'
      ]
    },

    // Visual Regression Project
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
      testMatch: [
        '**/visual-regression/**/*.spec.js'
      ]
    }
  ],

  // Web server configuration with extended timeout for stability
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Test output directories
  outputDir: 'test-results/artifacts',
  
  // Expect configuration for visual comparisons
  expect: {
    // Visual comparison threshold
    threshold: 0.2,
    // Screenshot comparison settings
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'strict'
    },
    // Timeout for assertions
    timeout: 10000
  }
});

// Export configuration constants for other test files
export const MULTI_TOOL_CONFIG = {
  // Currency test values that previously caused truncation issues
  PROBLEMATIC_CURRENCY_VALUES: [
    { value: 20000, description: '$20,000 → was showing $20,00', expected: '$20,000.00' },
    { value: 10000, description: '$10,000 → was showing $10,00', expected: '$10,000.00' },
    { value: 30000, description: '$30,000 → was showing $30,000.0', expected: '$30,000.00' },
    { value: 119900, description: '$119,900 → was showing $119,90', expected: '$119,900.00' },
    { value: 1199900, description: '$1,199,900 → large amount test', expected: '$1,199,900.00' },
    { value: 9999999, description: '$9,999,999 → maximum test', expected: '$9,999,999.00' },
    { value: 0.99, description: '$0.99 → minimum test', expected: '$0.99' },
    { value: 12345.67, description: '$12,345.67 → decimal test', expected: '$12,345.67' }
  ],
  
  // Performance benchmarks
  PERFORMANCE_THRESHOLDS: {
    PDF_GENERATION_MAX_TIME: 15000, // 15 seconds max
    PAGE_LOAD_MAX_TIME: 5000,       // 5 seconds max
    FORM_FILL_MAX_TIME: 3000,       // 3 seconds max
    CURRENCY_FORMAT_MAX_TIME: 1000  // 1 second max
  },
  
  // PDF validation rules
  PDF_VALIDATION_RULES: {
    MIN_FILE_SIZE: 5000,     // 5KB minimum
    MAX_FILE_SIZE: 5000000,  // 5MB maximum
    EXPECTED_PAGE_COUNT: 1,   // Single page
    REQUIRED_SECTIONS: [
      'CIAOCIAO.MX',
      'RECIBO', 
      'ciaociao.mx - Fine Jewelry',
      'Tel: +52 1 55 9211 2643',
      'Información General',
      'Datos del Cliente', 
      'Detalles de la Pieza',
      'TÉRMINOS Y CONDICIONES',
      'Gracias por su preferencia - ciaociao.mx'
    ]
  },
  
  // Test data configurations
  TEST_CLIENTS: {
    SIMPLE: {
      name: 'Test Cliente Sencillo',
      phone: '5555555555',
      email: 'test@simple.com'
    },
    COMPLEX: {
      name: 'Verónica Mancilla González de la Torre Extremadamente Largo',
      phone: '55 2690 5104 ext. 123',  
      email: 'veronica.mancilla.gonzalez.torre@email.extremadamente.largo.com'
    },
    SPECIAL_CHARS: {
      name: 'José María Ñáñez-O\'Brien',
      phone: '+52 1 55 9876 5432',
      email: 'josé.maría@ñáñez-obrien.mx'
    }
  },
  
  // Visual elements to validate in beautiful design
  DESIGN_ELEMENTS: [
    '.logo-main',
    '.receipt-header',
    '.client-info-section', 
    '.product-details-section',
    '.financial-summary',
    '.signature-section',
    '.terms-conditions',
    '.footer-contact'
  ]
};