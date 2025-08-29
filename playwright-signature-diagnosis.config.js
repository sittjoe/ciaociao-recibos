const { defineConfig, devices } = require('@playwright/test');

/**
 * CONFIGURACIÓN ESPECÍFICA PARA DIAGNÓSTICO DE ERRORES DE FIRMAS DIGITALES
 * 
 * Objetivo: Identificar la causa exacta del error genérico de firmas
 * que aparece en línea 3018 del script.js
 */
module.exports = defineConfig({
  testDir: './tests/signature-diagnosis',
  fullyParallel: false, // Ejecutar secuencialmente para mejor debugging
  forbidOnly: !!process.env.CI,
  retries: 0, // Sin retries para capturar errores inmediatamente
  workers: 1, // Un solo worker para evitar conflictos
  timeout: 120000, // 2 minutos por test para análisis detallado
  
  reporter: [
    ['html', { outputFolder: 'playwright-report/signature-diagnosis' }],
    ['json', { outputFile: 'test-results/signature-diagnosis-results.json' }],
    ['./tests/signature-diagnosis/signature-diagnosis-reporter.js']
  ],
  
  use: {
    baseURL: 'https://recibos.ciaociao.mx',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    // Configuración específica para interceptar errores
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  },

  projects: [
    {
      name: 'signature-diagnosis-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configurar para capturar todos los logs de consola
        launchOptions: {
          args: [
            '--enable-logging',
            '--log-level=0',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },
    }
  ],

  // Configuración del servidor web si es necesario
  webServer: {
    command: 'echo "Using external server at recibos.ciaociao.mx"',
    url: 'https://recibos.ciaociao.mx',
    reuseExistingServer: true,
  },
});