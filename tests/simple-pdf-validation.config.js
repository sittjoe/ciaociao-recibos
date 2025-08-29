// simple-pdf-validation.config.js
// Configuración simplificada para validación básica de correcciones PDF

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 120000, // 2 minutos por test
  
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/simple-pdf-validation', open: 'never' }],
    ['json', { outputFile: 'test-results/simple-pdf-validation-results.json' }]
  ],
  
  use: {
    baseURL: 'https://recibos.ciaociao.mx',
    acceptDownloads: true,
    screenshot: 'on',
    trace: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
    viewport: { width: 1920, height: 1080 }
  },

  projects: [
    {
      name: 'chromium-simple-validation',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'simple-pdf-corrections-validation.spec.js'
    }
  ],
  
  expect: {
    timeout: 30000
  }
});