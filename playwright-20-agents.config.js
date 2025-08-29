// Playwright Configuration for 20 Specialized Agents
// Validación Real Sistema CIAOCIAO - Output Final Sin Simulación

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/context7/agents',
  
  // Configuración optimizada para 20 agentes paralelos
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 2,
  workers: process.env.CI ? 4 : 8, // 8 workers para ejecutar 20 agentes
  
  // Timeout global para agentes
  timeout: 120000, // 2 minutos por test
  expect: {
    timeout: 30000 // 30 segundos para assertions
  },

  // Reporter comprehensivo para 20 agentes
  reporter: [
    ['html', { 
      outputFolder: 'test-results/20-agents-html-report',
      open: 'never'
    }],
    ['json', { 
      outputFile: 'test-results/20-agents-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/20-agents-junit.xml' 
    }],
    ['list'],
    // Custom reporter para consolidar resultados de agentes
    ['./tests/setup/20-agents-consolidator.js']
  ],

  use: {
    // Configuración para validación real (NO simulada)
    baseURL: 'https://recibos.ciaociao.mx',
    
    // Capturar evidencia real
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure', 
    video: 'retain-on-failure',
    
    // Configuración específica para PDFs reales
    acceptDownloads: true,
    permissions: ['downloads', 'camera'],
    
    // Timeouts realistas para sistema real
    actionTimeout: 30000,
    navigationTimeout: 30000
  },

  projects: [
    // Grupo 1: Core PDF Validation - Agentes 1-5
    {
      name: 'group1-pdf-core-chromium',
      testDir: './tests/context7/agents/group1-pdf-core',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera']
        }
      }
    },
    {
      name: 'group1-pdf-core-firefox', 
      testDir: './tests/context7/agents/group1-pdf-core',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera']
        }
      }
    },

    // Grupo 2: Currency & Formatting - Agentes 6-10
    {
      name: 'group2-currency-chromium',
      testDir: './tests/context7/agents/group2-currency',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          acceptDownloads: true
        }
      }
    },
    {
      name: 'group2-currency-firefox',
      testDir: './tests/context7/agents/group2-currency', 
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          acceptDownloads: true
        }
      }
    },
    {
      name: 'group2-currency-safari',
      testDir: './tests/context7/agents/group2-currency',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true
        }
      }
    },

    // Grupo 3: System Reliability - Agentes 11-15
    {
      name: 'group3-reliability-chromium',
      testDir: './tests/context7/agents/group3-reliability',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera', 'microphone']
        }
      }
    },
    {
      name: 'group3-reliability-mobile-chrome',
      testDir: './tests/context7/agents/group3-reliability',
      use: { 
        ...devices['Pixel 5'],
        contextOptions: {
          acceptDownloads: true
        }
      }
    },
    {
      name: 'group3-reliability-mobile-safari',
      testDir: './tests/context7/agents/group3-reliability', 
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          acceptDownloads: true
        }
      }
    },

    // Grupo 4: UX & Business Logic - Agentes 16-20
    {
      name: 'group4-ux-business-chromium',
      testDir: './tests/context7/agents/group4-ux-business',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera']
        }
      }
    },
    {
      name: 'group4-ux-business-firefox',
      testDir: './tests/context7/agents/group4-ux-business',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera']
        }
      }
    },
    {
      name: 'group4-ux-business-safari',
      testDir: './tests/context7/agents/group4-ux-business',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          acceptDownloads: true,
          permissions: ['downloads', 'camera']
        }
      }
    }
  ],

  // Configuración de servidor web NO necesaria (usamos producción real)
  // webServer: {
  //   // Comentado porque validamos contra https://recibos.ciaociao.mx
  // }

  // Configuración global adicional
  globalSetup: './tests/setup/20-agents-global-setup.js',
  globalTeardown: './tests/setup/20-agents-global-teardown.js'
});