// playwright-critical-diagnosis.config.js
// Configuración específica para el diagnóstico crítico PDF ciaociao-recibos

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory específico para diagnóstico
  testDir: './tests',
  testMatch: 'critical-pdf-diagnosis.spec.js',
  
  // Configuración optimizada para captura de errores
  fullyParallel: false, // Secuencial para mejor captura de estados
  forbidOnly: false, // Permitir .only en development
  retries: 0, // Sin retries para capturar errores exactos
  workers: 1, // Un solo worker para evitar interferencias
  
  // Timeouts extendidos para diagnóstico profundo
  timeout: 120000, // 2 minutos por test
  expect: { timeout: 30000 }, // 30 segundos para assertions
  
  // Reporters optimizados para diagnóstico
  reporter: [
    ['list', { printSteps: true }], // Output detallado en consola
    ['json', { outputFile: 'test-results/critical-pdf-diagnosis/playwright-report.json' }],
    ['html', { outputFolder: 'test-results/critical-pdf-diagnosis/html-report' }]
  ],
  
  // Configuración global optimizada para debugging
  use: {
    // Base URL para el diagnóstico
    baseURL: 'https://recibos.ciaociao.mx',
    
    // Configuración de captura máxima
    trace: 'on', // Always capture trace para debugging
    screenshot: 'on', // Capturar todas las screenshots
    video: 'on', // Capturar todo el video
    
    // Configuración específica para PDFs y downloads
    acceptDownloads: true,
    
    // Permisos extendidos
    permissions: ['camera', 'microphone', 'downloads'],
    
    // Configuración de viewport consistente
    viewport: { width: 1280, height: 720 },
    
    // Configuración de navegación para stability
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Headers para debugging
    extraHTTPHeaders: {
      'X-Debug-Source': 'Playwright-Critical-PDF-Diagnosis'
    }
  },

  // Proyecto específico para diagnóstico crítico
  projects: [
    {
      name: 'critical-pdf-diagnosis-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuración específica para PDF debugging en Chrome
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-web-security', // Para debugging de scripts cross-origin
            '--allow-running-insecure-content',
            '--enable-logging=stderr',
            '--log-level=0', // Verbose logging
            '--no-sandbox' // Para debugging en algunos environments
          ]
        },
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone', 'downloads'],
          // Configuración de JS específica para debugging
          javaScriptEnabled: true,
          
          // Configuración específica para interceptar console logs
          recordHar: {
            path: `test-results/critical-pdf-diagnosis/network-${Date.now()}.har`,
            recordVideo: false
          }
        }
      },
    },
    
    // Proyecto adicional para Safari si se necesita comparación
    {
      name: 'critical-pdf-diagnosis-webkit',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone', 'downloads']
        }
      },
    }
  ],

  // No web server para este diagnóstico (usa URL directa)
  // webServer: undefined

  // Global setup para crear directorios de resultados
  globalSetup: require.resolve('./tests/setup/critical-diagnosis-setup.js'),
  
  // Global teardown para cleanup y reporte final
  globalTeardown: require.resolve('./tests/setup/critical-diagnosis-teardown.js')
});