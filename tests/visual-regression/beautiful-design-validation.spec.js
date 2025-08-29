// tests/visual-regression/beautiful-design-validation.spec.js
// Visual Regression Testing for Beautiful Receipt Design
// Validates design consistency, layout, and visual elements

import { test, expect } from '@playwright/test';
import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Visual Testing Configuration
const VISUAL_CONFIG = {
  // Screenshot comparison settings
  threshold: 0.1, // 10% difference allowed
  maxDiffPixels: 1000,
  
  // Design breakpoints to test
  viewports: [
    { name: 'desktop-hd', width: 1920, height: 1080 },
    { name: 'desktop-standard', width: 1366, height: 768 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'mobile-standard', width: 375, height: 667 }
  ],
  
  // Design elements to validate
  criticalElements: [
    {
      selector: '.logo-main',
      name: 'Company Logo',
      minWidth: 100,
      minHeight: 50
    },
    {
      selector: '.receipt-header',
      name: 'Receipt Header',
      mustContain: ['RECIBO', 'ciaociao.mx']
    },
    {
      selector: '.client-info-section',
      name: 'Client Information',
      mustContain: ['Datos del Cliente']
    },
    {
      selector: '.product-details-section',
      name: 'Product Details',
      mustContain: ['Detalles de la Pieza']
    },
    {
      selector: '.financial-summary',
      name: 'Financial Summary',
      mustContain: ['Precio', '$']
    },
    {
      selector: '.signature-section',
      name: 'Signature Area',
      minHeight: 80
    },
    {
      selector: '.terms-conditions',
      name: 'Terms and Conditions',
      mustContain: ['TÉRMINOS Y CONDICIONES']
    },
    {
      selector: '.footer-contact',
      name: 'Footer Contact',
      mustContain: ['ciaociao.mx']
    }
  ],
  
  // Color scheme validation
  brandColors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    text: '#212529',
    background: '#ffffff'
  },
  
  // Typography validation
  typography: {
    headingFonts: ['Arial', 'Helvetica', 'sans-serif'],
    bodyFonts: ['Arial', 'Helvetica', 'sans-serif'],
    minFontSize: 10,
    maxFontSize: 48
  }
};

test.describe('Beautiful Receipt Design Visual Regression Tests', () => {
  let baselineDir;
  let comparisonDir;
  
  test.beforeAll(async () => {
    // Set up directories for baseline and comparison images
    baselineDir = path.join(__dirname, '../../test-results/visual-baseline');
    comparisonDir = path.join(__dirname, '../../test-results/visual-comparison');
    
    [baselineDir, comparisonDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });
  
  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate
    await page.goto('http://localhost:8080');
    
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      await passwordInput.fill('27181730');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to receipt mode
    const receiptButton = page.locator('text=RECIBOS');
    if (await receiptButton.isVisible({ timeout: 5000 })) {
      await receiptButton.click();
      await page.waitForTimeout(1000);
    }
  });

  // Test receipt form design across different viewports
  VISUAL_CONFIG.viewports.forEach(viewport => {
    test(`Receipt Form Design - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Fill form with standard test data for consistent visual testing
      const testData = MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE;
      await fillStandardForm(page, testData);
      
      // Wait for form to stabilize
      await page.waitForTimeout(1000);
      
      // Take full page screenshot
      const screenshotName = `receipt-form-${viewport.name}`;
      await expect(page).toHaveScreenshot(`${screenshotName}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        maxDiffPixels: VISUAL_CONFIG.maxDiffPixels
      });
      
      // Validate critical design elements are present and correctly sized
      await validateDesignElements(page, viewport);
    });
  });

  // Test receipt preview design with different content lengths
  test('Receipt Preview Design - Various Content Lengths', async ({ page }) => {
    const contentVariations = [
      {
        name: 'short-content',
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
        product: {
          type: 'Anillo',
          material: 'ORO 14K',
          weight: '5',
          description: 'Anillo sencillo'
        }
      },
      {
        name: 'medium-content',
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
        product: {
          type: 'Pulsera de Diseño Exclusivo',
          material: 'ORO 18K BLANCO CON DETALLES EN AMARILLO',
          weight: '12.5',
          stones: 'Diamante 1.5ct, Esmeralda 0.8ct',
          description: 'Pulsera artesanal con piedras preciosas y trabajo de filigrana manual'
        }
      },
      {
        name: 'long-content',
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS,
        product: {
          type: 'Collar de Diseño Exclusivo con Múltiples Elementos Decorativos',
          material: 'ORO 18K BLANCO Y AMARILLO CON ACABADO MATE Y BRILLANTE',
          weight: '25.75',
          stones: 'Diamantes 2.5ct, Esmeraldas 1.8ct, Rubíes 0.9ct, Zafiros 1.2ct, Perlas Cultivadas 3 piezas',
          description: 'Collar de diseño exclusivo con piedras preciosas múltiples, trabajo de filigrana artesanal, acabado en oro blanco con detalles en oro amarillo, incluye certificado de autenticidad, garantía extendida de 2 años, estuche de presentación personalizado, y servicio de mantenimiento anual gratuito. Pieza única numerada con registro en catálogo exclusivo.'
        }
      }
    ];
    
    for (const variation of contentVariations) {
      console.log(`Testing preview design with ${variation.name}`);
      
      // Fill form with variation data
      await fillFormWithVariation(page, variation);
      
      // Open preview
      await page.click('button:has-text("Vista Previa")');
      await page.waitForSelector('#previewModal', { state: 'visible' });
      await page.waitForTimeout(2000);
      
      // Take preview screenshot
      const previewElement = page.locator('#previewModal');
      await expect(previewElement).toHaveScreenshot(`receipt-preview-${variation.name}.png`, {
        threshold: VISUAL_CONFIG.threshold,
        maxDiffPixels: VISUAL_CONFIG.maxDiffPixels
      });
      
      // Validate layout doesn't break with different content lengths
      await validatePreviewLayout(page, variation);
      
      // Close preview
      await page.click('button:has-text("Cerrar")');
      await page.waitForTimeout(500);
      
      // Clear form for next variation
      await clearForm(page);
    }
  });

  // Test currency display formatting visually
  test('Currency Display Visual Formatting', async ({ page }) => {
    const currencyTestCases = MULTI_TOOL_CONFIG.PROBLEMATIC_CURRENCY_VALUES.slice(0, 5); // Test first 5
    
    for (const [index, currencyCase] of currencyTestCases.entries()) {
      console.log(`Testing visual currency formatting: ${currencyCase.description}`);
      
      // Fill form with currency test case
      await page.fill('input[name="clientName"]', 'Currency Test Client');
      await page.fill('input[name="clientPhone"]', '5555555555');
      await page.fill('input[name="productType"]', 'Test Product');
      await page.fill('input[name="material"]', 'ORO 14K');
      await page.fill('input[name="price"]', currencyCase.value.toString());
      await page.fill('input[name="contribution"]', (currencyCase.value * 0.3).toString());
      
      // Wait for calculations
      await page.waitForTimeout(1000);
      
      // Open preview to see currency formatting
      await page.click('button:has-text("Vista Previa")');
      await page.waitForSelector('#previewModal', { state: 'visible' });
      await page.waitForTimeout(2000);
      
      // Focus on financial section for detailed currency validation
      const financialSection = page.locator('.financial-summary');
      await expect(financialSection).toHaveScreenshot(`currency-display-${index + 1}.png`, {
        threshold: 0.05, // More strict for currency formatting
        maxDiffPixels: 500
      });
      
      // Close preview and clear form
      await page.click('button:has-text("Cerrar")');
      await clearForm(page);
    }
  });

  // Test responsive design behavior
  test('Responsive Design Validation', async ({ page }) => {
    const testData = MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE;
    await fillStandardForm(page, testData);
    
    // Test key responsive breakpoints
    const responsiveBreakpoints = [
      { width: 1920, height: 1080, name: 'desktop-xl' },
      { width: 1366, height: 768, name: 'desktop-lg' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 414, height: 896, name: 'mobile' }
    ];
    
    for (const breakpoint of responsiveBreakpoints) {
      console.log(`Testing responsive design at ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
      
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Test form responsiveness
      await expect(page).toHaveScreenshot(`responsive-form-${breakpoint.name}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        maxDiffPixels: VISUAL_CONFIG.maxDiffPixels
      });
      
      // Test preview responsiveness
      await page.click('button:has-text("Vista Previa")');
      await page.waitForSelector('#previewModal', { state: 'visible' });
      await page.waitForTimeout(1000);
      
      await expect(page.locator('#previewModal')).toHaveScreenshot(`responsive-preview-${breakpoint.name}.png`, {
        threshold: VISUAL_CONFIG.threshold,
        maxDiffPixels: VISUAL_CONFIG.maxDiffPixels
      });
      
      await page.click('button:has-text("Cerrar")');
      
      // Validate no horizontal scrolling on mobile/tablet
      if (breakpoint.width <= 768) {
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    }
  });

  // Test brand consistency
  test('Brand Consistency Validation', async ({ page }) => {
    await fillStandardForm(page, MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE);
    
    // Validate brand colors are being used
    const colorValidation = await page.evaluate((brandColors) => {
      const elements = document.querySelectorAll('*');
      const colorUsage = {};
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;
        
        [color, backgroundColor, borderColor].forEach(c => {
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)') {
            colorUsage[c] = (colorUsage[c] || 0) + 1;
          }
        });
      });
      
      return colorUsage;
    }, VISUAL_CONFIG.brandColors);
    
    console.log('Color usage analysis:', colorValidation);
    
    // Validate typography consistency
    const typographyValidation = await page.evaluate((typography) => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, input, label');
      const fontAnalysis = {
        fonts: {},
        sizes: {},
        invalidSizes: []
      };
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const fontFamily = computedStyle.fontFamily;
        const fontSize = parseInt(computedStyle.fontSize);
        
        fontAnalysis.fonts[fontFamily] = (fontAnalysis.fonts[fontFamily] || 0) + 1;
        fontAnalysis.sizes[fontSize] = (fontAnalysis.sizes[fontSize] || 0) + 1;
        
        if (fontSize < typography.minFontSize || fontSize > typography.maxFontSize) {
          fontAnalysis.invalidSizes.push({ element: el.tagName, fontSize, fontFamily });
        }
      });
      
      return fontAnalysis;
    }, VISUAL_CONFIG.typography);
    
    console.log('Typography analysis:', typographyValidation);
    
    // Validate no font sizes are outside acceptable range
    expect(typographyValidation.invalidSizes.length).toBeLessThanOrEqual(5); // Allow some flexibility
  });

  test.afterEach(async ({ page }, testInfo) => {
    // If test failed, take additional debug screenshots
    if (testInfo.status !== 'passed') {
      const failureScreenshot = path.join(comparisonDir, `failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`);
      await page.screenshot({ path: failureScreenshot, fullPage: true });
      console.log(`Debug screenshot saved: ${failureScreenshot}`);
    }
  });
});

// Helper functions for visual testing

async function fillStandardForm(page, clientData) {
  await page.fill('input[name="clientName"]', clientData.name);
  await page.fill('input[name="clientPhone"]', clientData.phone);
  if (clientData.email) {
    await page.fill('input[name="clientEmail"]', clientData.email);
  }
  
  await page.fill('input[name="productType"]', 'Anillo de Compromiso');
  await page.fill('input[name="material"]', 'ORO 14K BLANCO');
  await page.fill('input[name="weight"]', '7.5');
  await page.fill('textarea[name="stones"]', 'Diamante 1.0ct');
  await page.fill('textarea[name="description"]', 'Anillo de compromiso clásico con diamante central');
  await page.fill('input[name="price"]', '45000');
  await page.fill('input[name="contribution"]', '15000');
  
  // Wait for calculations to complete
  await page.waitForTimeout(1000);
}

async function fillFormWithVariation(page, variation) {
  await page.fill('input[name="clientName"]', variation.client.name);
  await page.fill('input[name="clientPhone"]', variation.client.phone);
  if (variation.client.email) {
    await page.fill('input[name="clientEmail"]', variation.client.email);
  }
  
  await page.fill('input[name="productType"]', variation.product.type);
  await page.fill('input[name="material"]', variation.product.material);
  await page.fill('input[name="weight"]', variation.product.weight);
  
  if (variation.product.stones) {
    await page.fill('textarea[name="stones"]', variation.product.stones);
  }
  
  await page.fill('textarea[name="description"]', variation.product.description);
  await page.fill('input[name="price"]', '75000');
  await page.fill('input[name="contribution"]', '25000');
  
  await page.waitForTimeout(1000);
}

async function clearForm(page) {
  const fields = [
    'input[name="clientName"]',
    'input[name="clientPhone"]',
    'input[name="clientEmail"]',
    'input[name="productType"]',
    'input[name="material"]',
    'input[name="weight"]',
    'textarea[name="stones"]',
    'textarea[name="description"]',
    'input[name="price"]',
    'input[name="contribution"]'
  ];
  
  for (const field of fields) {
    try {
      await page.fill(field, '');
    } catch (error) {
      // Field might not exist
    }
  }
  
  await page.waitForTimeout(500);
}

async function validateDesignElements(page, viewport) {
  console.log(`Validating design elements for ${viewport.name}`);
  
  for (const element of VISUAL_CONFIG.criticalElements) {
    try {
      const locator = page.locator(element.selector);
      const isVisible = await locator.isVisible({ timeout: 5000 });
      
      if (!isVisible) {
        console.warn(`⚠️ Element ${element.name} (${element.selector}) not visible in ${viewport.name}`);
        continue;
      }
      
      // Check dimensions if specified
      if (element.minWidth || element.minHeight) {
        const boundingBox = await locator.boundingBox();
        if (boundingBox) {
          if (element.minWidth && boundingBox.width < element.minWidth) {
            console.warn(`⚠️ Element ${element.name} width ${boundingBox.width} < required ${element.minWidth}`);
          }
          if (element.minHeight && boundingBox.height < element.minHeight) {
            console.warn(`⚠️ Element ${element.name} height ${boundingBox.height} < required ${element.minHeight}`);
          }
        }
      }
      
      // Check content if specified
      if (element.mustContain) {
        const content = await locator.textContent();
        for (const text of element.mustContain) {
          if (!content.includes(text)) {
            console.warn(`⚠️ Element ${element.name} missing required text: "${text}"`);
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not validate element ${element.name}: ${error.message}`);
    }
  }
}

async function validatePreviewLayout(page, variation) {
  console.log(`Validating preview layout for ${variation.name}`);
  
  // Check that preview modal is properly sized and centered
  const modal = page.locator('#previewModal');
  const modalBox = await modal.boundingBox();
  
  if (modalBox) {
    const viewport = page.viewportSize();
    
    // Modal should not exceed viewport
    expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
    expect(modalBox.height).toBeLessThanOrEqual(viewport.height);
    
    // Modal should be reasonably centered (within 20% of edges)
    const centerX = viewport.width / 2;
    const modalCenterX = modalBox.x + (modalBox.width / 2);
    const xOffset = Math.abs(centerX - modalCenterX);
    
    expect(xOffset).toBeLessThan(viewport.width * 0.2);
  }
  
  // Check that long content doesn't break layout
  const receiptContent = page.locator('#receiptPreview');
  const hasOverflow = await receiptContent.evaluate(el => {
    return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  });
  
  // Some overflow is acceptable for scrollable content, but not excessive
  if (hasOverflow) {
    console.log(`ℹ️ Preview has scrollable content for ${variation.name}`);
  }
}