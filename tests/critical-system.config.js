/**
 * Configuración específica para Tests Críticos del Sistema ciaociao-recibos
 * Optimizada para verificar funcionalidades post-correcciones
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // 60 segundos por test
  
  // Solo ejecutar tests críticos para esta configuración
  testMatch: '**/system-critical-functionality.spec.js',
  
  fullyParallel: false, // Evitar conflictos en tests críticos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Un worker para evitar conflictos
  
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-results/critical-system-results.json' }],
    ['junit', { outputFile: 'test-results/critical-system-results.xml' }]
  ],
  
  use: {
    // Base URL para sistema en producción
    baseURL: 'https://recibos.ciaociao.mx',
    
    // Configuración de trazas y capturas
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Configuración para funcionalidades específicas
    acceptDownloads: true,
    permissions: ['camera', 'microphone'],
    
    // Configuración de viewport optimizada
    viewport: { width: 1280, height: 720 },
    
    // Headers para evitar bloqueos
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Playwright-Test'
    },
    
    // Configuración de timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-critical-tests',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuración específica para funcionalidades críticas
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
    {
      name: 'webkit-critical-tests', 
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
  ],

  // Configuración de servidor local para fallback
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
    ignoreHTTPSErrors: true,
  },
});