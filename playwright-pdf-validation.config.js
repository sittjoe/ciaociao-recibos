/**
 * CONFIGURACIÓN PLAYWRIGHT PARA VALIDACIÓN DE FIXES PDF CRÍTICOS
 * 
 * Tests específicos para validar:
 * 1. jsPDF Detection Fix (dual format support)
 * 2. Currency Truncation Fix (información financiera completa)
 * 
 * Problemas originales reportados:
 * - "$19,90" en lugar de "$19,900.00" (truncación)
 * - "❌ Fallo generación PDF. ¿Desea IMPRIMIR..." (jsPDF detection)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/pdf-critical-fixes.spec.js',
  
  // Configuración específica para testing PDF
  fullyParallel: false, // Ejecutar tests secuencialmente para PDF generation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker para consistencia
  
  // Reporter configurado para PDF validation
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report/pdf-validation',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/pdf-validation-results.json' 
    }],
    ['list']
  ],
  
  // Output directories
  outputDir: 'test-results/pdf-validation',
  
  use: {
    // Base URL para el sistema ciaociao
    baseURL: 'http://localhost:8080',
    
    // Configuración específica para PDF testing
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts extendidos para PDF generation
    actionTimeout: 30000, // 30s para acciones PDF
    navigationTimeout: 45000, // 45s para navegación
    
    // Headers específicos
    extraHTTPHeaders: {
      'User-Agent': 'Playwright-PDF-Validation-Bot'
    }
  },

  // Configuración de proyectos de testing
  projects: [
    {
      name: 'chromium-pdf-validation',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuración específica para PDF en Chrome
        viewport: { width: 1200, height: 800 },
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--allow-running-insecure-content',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
    },

    {
      name: 'firefox-pdf-validation',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1200, height: 800 }
      },
    },

    {
      name: 'mobile-pdf-validation',
      use: { 
        ...devices['iPhone 12'],
        // Mobile testing para responsive PDF generation
      },
    }
  ],

  // Web Server removido para usar servidor externo
  // webServer: process.env.CI ? undefined : {
  //   command: 'python3 -m http.server 8080',
  //   port: 8080,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000
  // },

  // Global setup removido para simplificar
  // globalSetup: './tests/pdf-validation-setup.js',
  // globalTeardown: './tests/pdf-validation-teardown.js',

  // Configuración adicional para PDF testing
  expect: {
    // Timeouts específicos para PDF operations
    timeout: 15000
  },

  // Configuración de directorio temporal para PDFs
  testConfig: {
    pdfDownloadPath: './test-results/pdf-validation/downloads',
    screenshotPath: './test-results/pdf-validation/screenshots',
    logPath: './test-results/pdf-validation/logs'
  }
});