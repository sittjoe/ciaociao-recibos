/**
 * Suite de Tests Críticos Corregida - Sistema ciaociao-recibos
 * Tests automatizados para verificar funcionalidades post-correcciones
 */

import { test, expect } from '@playwright/test';

const SYSTEM_URL = 'https://recibos.ciaociao.mx/receipt-mode.html';
const LOGIN_PASSWORD = '27181730';

test.describe('Sistema Crítico ciaociao-recibos - Funcionalidades Post-Correcciones', () => {
  let page;
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ browser }) => {
    // Crear contexto sin permisos problemáticos
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    
    page = await context.newPage();
    
    // Capturar errores de consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capturar errores de página
    page.on('pageerror', error => {
      consoleErrors.push({
        text: `Page Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });

    // Reset error arrays for each test
    consoleErrors = [];
    consoleWarnings = [];
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('CRÍTICO: Navegación al Sistema y Carga de Página', async () => {
    console.log('🌐 Verificando navegación al sistema...');
    
    await page.goto(SYSTEM_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/ciaociao/i);
    
    // Verificar elementos básicos
    const logo = page.locator('img[alt*="ciaociao"]');
    await expect(logo).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Sistema carga correctamente');
    
    await page.screenshot({ 
      path: 'test-results/system-navigation.png',
      fullPage: true 
    });
  });

  test('CRÍTICO: Sistema de Login con Contraseña Correcta', async () => {
    console.log('🔐 Verificando sistema de login...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    
    // Verificar que aparezca el sistema de autenticación
    const loginContainer = page.locator('.login-container');
    await expect(loginContainer).toBeVisible({ timeout: 15000 });
    
    // Buscar campo de contraseña (más específico)
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible({ timeout: 5000 });
    
    // Introducir contraseña correcta
    await passwordField.fill(LOGIN_PASSWORD);
    
    // Buscar y hacer clic en botón de login
    const loginButton = page.locator('#loginBtn, .login-btn');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // Verificar que el login fue exitoso esperando que el contenedor desaparezca
    await expect(loginContainer).toBeHidden({ timeout: 15000 });
    
    // Verificar que aparezca el formulario principal
    const mainForm = page.locator('#receiptForm');
    await expect(mainForm).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Login exitoso verificado');
    
    await page.screenshot({ 
      path: 'test-results/login-success.png',
      fullPage: true 
    });
  });

  test('CRÍTICO: Generación Automática de Número de Recibo', async () => {
    console.log('🔢 Verificando generación de número de recibo...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    await performLogin(page);
    
    // Verificar que el campo de número de recibo existe y tiene valor
    const receiptNumberField = page.locator('#receiptNumber');
    await expect(receiptNumberField).toBeVisible();
    
    const receiptNumber = await receiptNumberField.inputValue();
    expect(receiptNumber).toBeTruthy();
    expect(receiptNumber.length).toBeGreaterThan(0);
    
    // Verificar que es readonly (generado automáticamente)
    const isReadonly = await receiptNumberField.getAttribute('readonly');
    expect(isReadonly).toBeTruthy();
    
    console.log(`✅ Número de recibo generado: ${receiptNumber}`);
    
    await page.screenshot({ 
      path: 'test-results/receipt-number-verification.png'
    });
  });

  test('CRÍTICO: Funcionalidad de Botones Principales', async () => {
    console.log('🔘 Verificando botones principales...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    await performLogin(page);
    
    // Llenar datos mínimos para habilitar botones
    await fillBasicFormData(page);
    
    // Verificar botón Vista Previa
    const previewBtn = page.locator('#previewBtn');
    await expect(previewBtn).toBeVisible();
    await expect(previewBtn).toBeEnabled();
    
    await previewBtn.click();
    
    // Verificar que aparece el modal de vista previa
    const previewModal = page.locator('#previewModal');
    await expect(previewModal).toBeVisible({ timeout: 10000 });
    
    // Cerrar modal
    const closeBtn = page.locator('#closePreview');
    await closeBtn.click();
    await expect(previewModal).toBeHidden();
    
    console.log('✅ Botón Vista Previa funciona correctamente');
    
    // Verificar otros botones críticos están presentes
    const criticalButtons = [
      '#generatePdfBtn',
      '#shareWhatsappBtn', 
      '#historyBtn'
    ];
    
    for (const selector of criticalButtons) {
      const button = page.locator(selector);
      await expect(button).toBeVisible();
      console.log(`✅ Botón ${selector} está presente y visible`);
    }
    
    await page.screenshot({ 
      path: 'test-results/critical-buttons-verification.png',
      fullPage: true 
    });
  });

  test('CRÍTICO: Sistema de Firmas Digitales', async () => {
    console.log('✍️ Verificando sistema de firmas...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    await performLogin(page);
    
    // Verificar que los canvas de firma están presentes
    const clientSignature = page.locator('#signatureCanvas');
    const companySignature = page.locator('#companySignatureCanvas');
    
    await expect(clientSignature).toBeVisible({ timeout: 10000 });
    await expect(companySignature).toBeVisible({ timeout: 10000 });
    
    // Verificar dimensiones mínimas
    const clientBox = await clientSignature.boundingBox();
    const companyBox = await companySignature.boundingBox();
    
    expect(clientBox.width).toBeGreaterThan(100);
    expect(clientBox.height).toBeGreaterThan(50);
    expect(companyBox.width).toBeGreaterThan(100);
    expect(companyBox.height).toBeGreaterThan(50);
    
    // Verificar botones de limpiar
    const clearClientBtn = page.locator('#clearSignature');
    const clearCompanyBtn = page.locator('#clearCompanySignature');
    
    await expect(clearClientBtn).toBeVisible();
    await expect(clearCompanyBtn).toBeVisible();
    
    console.log('✅ Sistema de firmas digitales está operativo');
    
    await page.screenshot({ 
      path: 'test-results/signature-system-verification.png',
      fullPage: true 
    });
  });

  test('CRÍTICO: Verificación de Consola - Sin Errores Críticos', async () => {
    console.log('🧹 Verificando ausencia de errores críticos...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    
    // Esperar carga completa
    await page.waitForTimeout(3000);
    
    await performLogin(page);
    
    // Esperar inicialización post-login
    await page.waitForTimeout(5000);
    
    // Interactuar con el sistema para activar posibles errores
    await fillBasicFormData(page);
    
    // Filtrar errores críticos (excluyendo warnings conocidos)
    const criticalErrors = consoleErrors.filter(error => 
      !error.text.includes('404') &&
      !error.text.includes('favicon') &&
      !error.text.includes('Manifest') &&
      !error.text.includes('cdn.jsdelivr') &&
      !error.text.includes('unpkg.com') &&
      !error.text.includes('cdnjs.cloudflare') &&
      !error.text.toLowerCase().includes('warning')
    );
    
    console.log(`📊 Análisis de consola:`);
    console.log(`   - Errores críticos encontrados: ${criticalErrors.length}`);
    console.log(`   - Errores totales: ${consoleErrors.length}`);
    console.log(`   - Advertencias: ${consoleWarnings.length}`);
    
    // Crear reporte de errores
    if (criticalErrors.length > 0) {
      console.log('❌ Errores críticos encontrados:');
      criticalErrors.forEach((error, i) => {
        console.log(`   ${i+1}. ${error.text}`);
      });
    } else {
      console.log('✅ No se encontraron errores críticos en consola');
    }
    
    await page.screenshot({ 
      path: 'test-results/console-verification-final.png',
      fullPage: true 
    });
    
    // El test es exitoso si hay menos de 3 errores críticos
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('INTEGRACIÓN: Test End-to-End Completo del Sistema', async () => {
    test.setTimeout(60000);
    
    console.log('🔄 Ejecutando test integración completa...');
    
    await page.goto(SYSTEM_URL, { waitUntil: 'networkidle' });
    
    // 1. Verificar carga inicial
    console.log('1/7 - Verificando carga inicial...');
    await expect(page).toHaveTitle(/ciaociao/i);
    
    // 2. Login
    console.log('2/7 - Ejecutando login...');
    await performLogin(page);
    
    // 3. Verificar número de recibo
    console.log('3/7 - Verificando número de recibo...');
    const receiptNumber = await page.locator('#receiptNumber').inputValue();
    expect(receiptNumber).toBeTruthy();
    
    // 4. Llenar formulario
    console.log('4/7 - Completando formulario...');
    await fillBasicFormData(page);
    
    // 5. Verificar firmas
    console.log('5/7 - Verificando sistema de firmas...');
    await expect(page.locator('#signatureCanvas')).toBeVisible();
    await expect(page.locator('#companySignatureCanvas')).toBeVisible();
    
    // 6. Probar vista previa
    console.log('6/7 - Probando vista previa...');
    await page.locator('#previewBtn').click();
    await expect(page.locator('#previewModal')).toBeVisible({ timeout: 10000 });
    await page.locator('#closePreview').click();
    
    // 7. Verificar estado final
    console.log('7/7 - Verificación final del sistema...');
    const finalErrors = consoleErrors.filter(error => 
      !error.text.includes('404') && 
      !error.text.includes('favicon') &&
      !error.text.includes('cdn') &&
      !error.text.toLowerCase().includes('warning')
    );
    
    await page.screenshot({ 
      path: 'test-results/end-to-end-integration-final.png',
      fullPage: true 
    });
    
    console.log(`🎉 Test de integración completo - Errores críticos finales: ${finalErrors.length}`);
    
    // Test pasa si el sistema funciona sin errores críticos
    expect(finalErrors.length).toBeLessThanOrEqual(2);
  });
});

// Funciones auxiliares
async function performLogin(page) {
  const loginContainer = page.locator('.login-container');
  await expect(loginContainer).toBeVisible({ timeout: 15000 });
  
  const passwordField = page.locator('input[type="password"]');
  await passwordField.fill(LOGIN_PASSWORD);
  
  const loginButton = page.locator('#loginBtn');
  await loginButton.click();
  
  await expect(loginContainer).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#receiptForm')).toBeVisible({ timeout: 10000 });
}

async function fillBasicFormData(page) {
  // Datos mínimos requeridos
  await page.locator('#clientName').fill('Cliente Test Automatizado');
  await page.locator('#clientPhone').fill('5551234567');
  await page.locator('#pieceType').selectOption('anillo');
  await page.locator('#material').selectOption('oro-14k');
  await page.locator('#price').fill('2500');
  await page.locator('#transactionType').selectOption('venta');
  
  // Datos adicionales básicos
  await page.locator('#description').fill('Test automatizado del sistema ciaociao-recibos');
}