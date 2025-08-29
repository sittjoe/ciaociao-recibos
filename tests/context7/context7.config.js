// tests/context7/context7.config.js
// Context7 Configuration for PDF Testing Framework

export const Context7Config = {
  // Test Environment Configuration
  environment: {
    baseURL: 'http://localhost:8080',
    productionURL: 'https://recibos.ciaociao.mx',
    password: '27181730',
    timeout: 30000,
    retries: 2
  },

  // PDF Testing Specific Configuration
  pdf: {
    downloadPath: './test-results/context7-downloads',
    screenshotPath: './test-results/context7-screenshots',
    reportsPath: './test-results/context7-reports',
    maxFileSize: 50000000, // 50MB
    minFileSize: 5000,     // 5KB
    expectedPageCount: 1,  // Single page requirement
    quality: {
      dpi: 150,
      compression: 0.8,
      format: 'PNG'
    }
  },

  // Test Data Configuration
  testData: {
    clients: {
      veronica: {
        name: 'Veronica Mancilla gonzalez',
        phone: '55 2690 5104',
        email: 'vermango13@yahoo.com.mx'
      },
      testShort: {
        name: 'Test Cliente Corto',
        phone: '5512345678',
        email: 'test@short.com'
      },
      testLong: {
        name: 'Test Cliente Con Nombre Extremadamente Largo Para Verificar Comportamiento',
        phone: '55 1234 5678 90',
        email: 'test.cliente.con.email.muy.largo@dominio.extremadamente.largo.com'
      }
    },
    
    products: {
      simple: {
        type: 'anillo',
        material: 'oro-14k',
        weight: '5',
        stones: '',
        description: 'Anillo sencillo'
      },
      complex: {
        type: 'collar',
        material: 'oro-18k',
        weight: '25.5',
        stones: 'Diamantes 2.5ct, Esmeraldas 1.8ct, Rubíes 0.9ct',
        description: 'Collar de diseño exclusivo con piedras preciosas múltiples, trabajo de filigrana artesanal, acabado en oro blanco con detalles en oro amarillo, incluye certificado de autenticidad y garantía extendida'
      },
      medium: {
        type: 'pulsera',
        material: 'oro-14k',
        weight: '12',
        stones: 'ZAFIRO 5.15 cts',
        description: 'Pulsera de oro blanco con zafiro central'
      }
    },

    financial: {
      scenarios: [
        {
          name: 'fully_paid',
          price: 10000,
          contribution: 0,
          deposit: 10000,
          deliveryStatus: 'entregado'
        },
        {
          name: 'partial_payment',
          price: 50000,
          contribution: 5000,
          deposit: 20000,
          deliveryStatus: 'proceso'
        },
        {
          name: 'no_payment',
          price: 25000,
          contribution: 0,
          deposit: 0,
          deliveryStatus: 'pendiente'
        },
        {
          name: 'veronica_case',
          price: 39150,
          contribution: 39150,
          deposit: 0,
          deliveryStatus: 'entregado'
        }
      ]
    }
  },

  // Browser Configuration
  browsers: {
    chromium: {
      headless: false,
      viewport: { width: 1280, height: 1024 },
      deviceScaleFactor: 1,
      acceptDownloads: true
    },
    webkit: {
      headless: false,
      viewport: { width: 1280, height: 1024 },
      deviceScaleFactor: 1,
      acceptDownloads: true
    },
    firefox: {
      headless: false,
      viewport: { width: 1280, height: 1024 },
      deviceScaleFactor: 1,
      acceptDownloads: true
    }
  },

  // Validation Rules
  validation: {
    requiredSections: [
      'CIAOCIAO.MX',
      'RECIBO',
      'ciaociao.mx - Fine Jewelry',
      'Tel: +52 1 55 9211 2643',
      'Información General',
      'Datos del Cliente',
      'Detalles de la Pieza',
      'TÉRMINOS Y CONDICIONES',
      'Gracias por su preferencia - ciaociao.mx'
    ],
    
    financial: {
      tolerance: 0.01, // $0.01 tolerance for calculations
      currencyFormat: /\$[\d,]+\.\d{2}/,
      requiredFields: ['Precio Base', 'Subtotal', 'Saldo Pendiente']
    },

    structure: {
      maxContentHeight: 2000, // pixels
      minContentHeight: 500,   // pixels
      maxSections: 20,
      minSections: 5
    }
  },

  // Debugging Configuration
  debug: {
    verbose: true,
    screenshots: true,
    consoleLog: true,
    networkLog: false,
    timings: true,
    canvasAnalysis: true,
    scalingMetrics: true
  },

  // Performance Thresholds
  performance: {
    maxPDFGenerationTime: 30000, // 30 seconds
    maxPageLoadTime: 10000,      // 10 seconds
    maxFormFillTime: 5000,       // 5 seconds
    maxDownloadTime: 15000       // 15 seconds
  },

  // Test Scenarios
  scenarios: {
    quickTest: ['veronica_case'],
    fullTest: ['fully_paid', 'partial_payment', 'no_payment', 'veronica_case'],
    stressTest: ['complex_content', 'long_descriptions', 'multiple_images'],
    browserCompatibility: ['chromium', 'webkit', 'firefox']
  }
};

// Context7 Utilities
export class Context7Utils {
  
  static getTestData(clientType, productType, financialScenario) {
    const client = Context7Config.testData.clients[clientType];
    const product = Context7Config.testData.products[productType];
    const financial = Context7Config.testData.financial.scenarios.find(s => s.name === financialScenario);
    
    if (!client || !product || !financial) {
      throw new Error(`Invalid test data combination: ${clientType}, ${productType}, ${financialScenario}`);
    }

    return {
      ...client,
      ...product,
      ...financial,
      receiptDate: new Date().toISOString().split('T')[0],
      orderNumber: Math.floor(Math.random() * 99999).toString().padStart(5, '0')
    };
  }

  static generateTestId() {
    return `ctx7-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static createDownloadPath(testId) {
    const basePath = Context7Config.pdf.downloadPath;
    const testPath = `${basePath}/${testId}`;
    return testPath;
  }

  static validatePDFSize(filePath) {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    if (size < Context7Config.pdf.minFileSize) {
      throw new Error(`PDF too small: ${size} bytes (min: ${Context7Config.pdf.minFileSize})`);
    }
    
    if (size > Context7Config.pdf.maxFileSize) {
      throw new Error(`PDF too large: ${size} bytes (max: ${Context7Config.pdf.maxFileSize})`);
    }
    
    return { size, valid: true };
  }

  static async measurePageLoadTime(page, url) {
    const startTime = Date.now();
    await page.goto(url);
    const loadTime = Date.now() - startTime;
    
    if (loadTime > Context7Config.performance.maxPageLoadTime) {
      console.warn(`Page load time exceeded threshold: ${loadTime}ms`);
    }
    
    return loadTime;
  }

  static async takeDebugScreenshot(page, testId, step) {
    if (!Context7Config.debug.screenshots) return;
    
    const screenshotPath = `${Context7Config.pdf.screenshotPath}/${testId}`;
    const fs = require('fs');
    if (!fs.existsSync(screenshotPath)) {
      fs.mkdirSync(screenshotPath, { recursive: true });
    }
    
    const filename = `${screenshotPath}/${step}-${Date.now()}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  static log(message, data = null) {
    if (!Context7Config.debug.verbose) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[Context7] ${timestamp}: ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }
}

export default Context7Config;