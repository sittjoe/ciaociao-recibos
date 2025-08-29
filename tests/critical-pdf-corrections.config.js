// critical-pdf-corrections.config.js
// Configuración específica para validar las correcciones críticas implementadas
// Enfocada en confirmar que el problema "PDF se corta" está RESUELTO

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  
  // Configuración para tests críticos
  fullyParallel: false, // Ejecutar en secuencia para evitar conflictos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2, // Más reintentos para tests críticos
  workers: 1, // Un solo worker para estabilidad
  
  // Timeout extendido para generación de PDF
  timeout: 300000, // 5 minutos por test
  
  // Configuración de reportes específica para validación crítica
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report/critical-pdf-corrections',
      open: 'never'
    }],
    ['list'],
    ['json', { 
      outputFile: 'test-results/critical-pdf-corrections-results.json' 
    }],
    // Reporter custom para resumen de correcciones
    ['./setup/critical-corrections-reporter.js']
  ],
  
  // Configuración global de navegador
  use: {
    // URL base del sistema
    baseURL: 'https://recibos.ciaociao.mx',
    
    // Configuraciones críticas para PDF
    acceptDownloads: true,
    
    // Configuración de screenshots y videos
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    
    // Timeouts extendidos para PDF
    navigationTimeout: 45000,
    actionTimeout: 20000,
    
    // Configuración de viewport para tests de layout
    viewport: { width: 1920, height: 1080 },
    
    // Headers específicos
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Playwright-Critical-PDF-Validator/1.0'
    }
  },

  projects: [
    {
      name: 'chromium-critical-corrections',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: 'critical-pdf-corrections-validation.spec.js'
    }
  ],

  // Setup y teardown específicos para validación crítica
  globalSetup: require.resolve('./setup/critical-corrections-setup.js'),
  globalTeardown: require.resolve('./setup/critical-corrections-teardown.js'),
  
  // No usar webServer local - usar URL directa
  // webServer: {
  //   command: 'python3 -m http.server 8080',
  //   url: 'http://localhost:8080', 
  //   reuseExistingServer: true,
  //   timeout: 120000,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  // },
  
  // Configuración de expect
  expect: {
    timeout: 45000, // Timeout extendido para validaciones
    toHaveScreenshot: {
      // Configuración para comparación de screenshots
      mode: 'css',
      animations: 'disabled'
    }
  },
  
  // Configuración de metadatos
  metadata: {
    purpose: 'Validación crítica de correcciones de PDF',
    correcciones: {
      'dimensiones_a4': 'A4_WIDTH_PX=3507px, A4_HEIGHT_PX=2480px',
      'font_size': '36px optimizado',
      'margenes': '6mm por lado',
      'overflow': 'visible + nowrap',
      'html2canvas': 'onclone function optimizada'
    },
    problema_original: 'PDF mejor pero sigue apareciendo cortado',
    objetivo: 'Confirmar 100% que PDFs NO se cortan'
  }
});