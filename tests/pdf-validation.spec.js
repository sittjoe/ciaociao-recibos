// tests/pdf-validation.spec.js
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('PDF Validation Tests - ciaociao.mx Receipt System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar al sistema de recibos
    await page.goto('http://localhost:8080/receipt-mode.html');
    
    // Login con contraseña correcta
    await page.waitForSelector('#passwordInput', { timeout: 10000 });
    await page.fill('#passwordInput', '27181730');
    await page.click('#loginBtn');
    
    // Esperar a que el formulario principal aparezca
    await page.waitForSelector('#receiptForm', { timeout: 10000 });
  });

  test('PDF Generation - Veronica Mancilla Case - Complete Validation', async ({ page }) => {
    console.log('🧪 Iniciando test de validación completa de PDF...');

    // Configurar descarga de archivos
    const downloadPath = './test-results/downloads';
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // Llenar formulario con datos específicos de Veronica Mancilla
    await test.step('Llenar datos del recibo', async () => {
      await page.fill('#receiptDate', '2025-08-21');
      await page.selectOption('#transactionType', 'venta');
      
      // Datos del cliente
      await page.fill('#clientName', 'Veronica Mancilla gonzalez');
      await page.fill('#clientPhone', '55 2690 5104');
      await page.fill('#clientEmail', 'vermango13@yahoo.com.mx');
      
      // Detalles de la pieza
      await page.selectOption('#pieceType', 'pulsera');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#weight', '9');
      await page.fill('#stones', 'ZAFIRO 5.15 cts');
      await page.fill('#description', 'Oro Blanco');
      await page.fill('#orderNumber', '10580');
    });

    await test.step('Configurar información financiera', async () => {
      await page.fill('#price', '39150');
      await page.fill('#contribution', '39150'); 
      await page.fill('#deliveryDate', '2025-08-21');
      await page.selectOption('#deliveryStatus', 'entregado');
      await page.selectOption('#paymentMethod', 'tarjeta');
    });

    // Verificar cálculos automáticos ANTES de generar PDF
    await test.step('Validar cálculos financieros', async () => {
      // Disparar recalculo
      await page.click('#price');
      await page.press('#price', 'Tab');
      
      // Esperar un momento para cálculos
      await page.waitForTimeout(500);
      
      // Verificar subtotal
      const subtotal = await page.inputValue('#subtotal');
      console.log('📊 Subtotal calculado:', subtotal);
      expect(parseFloat(subtotal)).toBe(78300); // 39150 + 39150
      
      // Verificar balance
      const balance = await page.inputValue('#balance');
      console.log('💰 Balance calculado:', balance);
      expect(parseFloat(balance)).toBe(78300); // Sin anticipo
    });

    // Configurar listener para descarga
    const downloadPromise = page.waitForEvent('download');
    
    await test.step('Generar PDF y verificar descarga', async () => {
      console.log('📄 Generando PDF...');
      await page.click('#generatePdfBtn');
      
      // Esperar descarga
      const download = await downloadPromise;
      const downloadedPath = path.join(downloadPath, download.suggestedFilename());
      await download.saveAs(downloadedPath);
      
      console.log('✅ PDF descargado:', downloadedPath);
      
      // Verificar que archivo existe y no está vacío
      expect(fs.existsSync(downloadedPath)).toBeTruthy();
      const fileSize = fs.statSync(downloadedPath).size;
      expect(fileSize).toBeGreaterThan(10000); // Al menos 10KB
      console.log('📏 Tamaño del PDF:', fileSize, 'bytes');
    });
  });

  test('Financial Calculations Validation', async ({ page }) => {
    console.log('🧮 Iniciando test de cálculos financieros...');

    await test.step('Test casos de cálculo diversos', async () => {
      // Caso 1: Sin aportación
      await page.fill('#price', '50000');
      await page.fill('#contribution', '0');
      await page.fill('#deposit', '15000');
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(300);
      
      const subtotal1 = await page.inputValue('#subtotal');
      const balance1 = await page.inputValue('#balance');
      
      expect(parseFloat(subtotal1)).toBe(50000);
      expect(parseFloat(balance1)).toBe(35000); // 50000 - 15000
      
      // Caso 2: Con aportación  
      await page.fill('#price', '30000');
      await page.fill('#contribution', '10000');
      await page.fill('#deposit', '5000');
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(300);
      
      const subtotal2 = await page.inputValue('#subtotal');
      const balance2 = await page.inputValue('#balance');
      
      expect(parseFloat(subtotal2)).toBe(40000); // 30000 + 10000
      expect(parseFloat(balance2)).toBe(35000); // 40000 - 5000
    });
  });

  test('Terms and Conditions Validation', async ({ page }) => {
    console.log('📋 Iniciando test de términos y condiciones...');

    await test.step('Test términos para pieza entregada', async () => {
      // Configurar como entregada y pagada
      await page.fill('#clientName', 'Test Cliente Entregado');
      await page.fill('#price', '10000');
      await page.fill('#contribution', '0');
      await page.fill('#deposit', '10000'); // Totalmente pagado
      await page.selectOption('#deliveryStatus', 'entregado');
      
      // Generar vista previa para verificar términos
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');
      
      const previewContent = await page.textContent('#receiptPreview');
      expect(previewContent).toContain('El cliente ha recibido la pieza y declara estar conforme');
      expect(previewContent).toContain('Cualquier observación debe reportarse dentro de 48 horas');
      
      await page.click('#closePreview');
    });

    await test.step('Test términos para pago pendiente', async () => {
      // Configurar como pendiente de entrega
      await page.fill('#clientName', 'Test Cliente Pendiente');
      await page.fill('#price', '15000');
      await page.fill('#contribution', '0');
      await page.fill('#deposit', '5000'); // Pago parcial
      await page.selectOption('#deliveryStatus', 'pendiente');
      
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');
      
      const previewContent = await page.textContent('#receiptPreview');
      expect(previewContent).toContain('El cliente acepta las especificaciones acordadas');
      expect(previewContent).toContain('La entrega se realizará según fecha acordada');
      expect(previewContent).toContain('Los artículos no reclamados después de 30 días');
      
      await page.click('#closePreview');
    });
  });

  test('PDF Structure and Content Validation', async ({ page }) => {
    console.log('🏗️ Iniciando test de estructura del PDF...');

    // Llenar datos mínimos
    await page.fill('#clientName', 'Test Estructura PDF');
    await page.fill('#clientPhone', '5512345678');
    await page.fill('#price', '25000');
    await page.selectOption('#pieceType', 'anillo');
    await page.selectOption('#material', 'oro-18k');

    await test.step('Verificar vista previa contiene elementos clave', async () => {
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');
      
      const previewContent = await page.textContent('#receiptPreview');
      
      // Verificar elementos estructurales
      expect(previewContent).toContain('CIAOCIAO.MX');
      expect(previewContent).toContain('RECIBO');
      expect(previewContent).toContain('ciaociao.mx - Fine Jewelry');
      expect(previewContent).toContain('+52 1 55 9211 2643');
      expect(previewContent).toContain('Información General');
      expect(previewContent).toContain('Datos del Cliente');
      expect(previewContent).toContain('Detalles de la Pieza');
      expect(previewContent).toContain('TÉRMINOS Y CONDICIONES');
      expect(previewContent).toContain('Gracias por su preferencia - ciaociao.mx');
      
      // Verificar datos específicos
      expect(previewContent).toContain('Test Estructura PDF');
      expect(previewContent).toContain('5512345678');
      expect(previewContent).toContain('$25,000.00');
      
      await page.click('#closePreview');
    });
  });

  test('WhatsApp Message Validation', async ({ page }) => {
    console.log('📱 Iniciando test de mensajes WhatsApp...');

    await test.step('Test mensaje para pieza entregada', async () => {
      await page.fill('#clientName', 'Test WhatsApp Cliente');
      await page.fill('#clientPhone', '5512345678');
      await page.fill('#price', '20000');
      await page.fill('#deposit', '20000'); // Totalmente pagado
      await page.selectOption('#deliveryStatus', 'entregado');
      await page.selectOption('#pieceType', 'collar');
      await page.selectOption('#material', 'plata-925');
      
      // Interceptar apertura de WhatsApp
      let whatsappUrl = '';
      page.on('popup', async (popup) => {
        whatsappUrl = popup.url();
        await popup.close();
      });
      
      await page.click('#shareWhatsappBtn');
      await page.waitForTimeout(1000);
      
      // Decodificar mensaje de WhatsApp
      const urlParams = new URLSearchParams(whatsappUrl.split('?')[1]);
      const message = decodeURIComponent(urlParams.get('text') || '');
      
      expect(message).toContain('ESTADO: ✅ Pieza entregada y conforme');
      expect(message).toContain('El cliente ha recibido la pieza satisfactoriamente');
      expect(message).not.toContain('Métodos de pago disponibles'); // No debe aparecer si está entregada
    });

    await test.step('Test mensaje para pago pendiente', async () => {
      await page.fill('#deposit', '10000'); // Pago parcial
      await page.selectOption('#deliveryStatus', 'pendiente');
      
      let whatsappUrl = '';
      page.on('popup', async (popup) => {
        whatsappUrl = popup.url();
        await popup.close();
      });
      
      await page.click('#shareWhatsappBtn');
      await page.waitForTimeout(1000);
      
      const urlParams = new URLSearchParams(whatsappUrl.split('?')[1]);
      const message = decodeURIComponent(urlParams.get('text') || '');
      
      expect(message).toContain('ESTADO: 📦 Pago registrado - Pendiente de entrega');
      expect(message).toContain('Saldo pendiente de $10,000.00');
      expect(message).toContain('Métodos de pago disponibles'); // Debe aparecer si hay saldo
    });
  });
});