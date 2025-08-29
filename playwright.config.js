// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Para evitar conflictos con descargas
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'file://' + process.cwd(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Configuración específica para testing de PDFs
    acceptDownloads: true,
    permissions: ['camera', 'microphone'],
  },

  projects: [
    {
      name: 'chromium-pdf-tests',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuración específica para PDFs
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
    {
      name: 'webkit-pdf-tests', 
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['camera', 'microphone'],
        }
      },
    },
  ],

  // Configuración específica para nuestro servidor local
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});