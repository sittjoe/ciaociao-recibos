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

  test('PDF Complete Structure - No Content Cutting', async ({ page }) => {
    console.log('📏 Iniciando test de estructura completa sin cortes...');

    const downloadPath = './test-results/downloads';
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    await test.step('Llenar formulario completo para test de estructura', async () => {
      // Datos completos para generar PDF con todo el contenido
      await page.fill('#receiptDate', '2025-08-22');
      await page.selectOption('#transactionType', 'venta');
      
      await page.fill('#clientName', 'Cliente Estructura Completa Test');
      await page.fill('#clientPhone', '5512345678');
      await page.fill('#clientEmail', 'test@estructura.com');
      
      await page.selectOption('#pieceType', 'collar');
      await page.selectOption('#material', 'oro-18k');
      await page.fill('#weight', '12.5');
      await page.fill('#stones', 'Esmeraldas colombianas 2.3ct');
      await page.fill('#description', 'Collar de oro blanco 18k con esmeraldas talla esmeralda y diamantes en pavé');
      await page.fill('#orderNumber', 'ORD-2025-001');
      
      await page.fill('#price', '45000');
      await page.fill('#contribution', '5000');
      await page.fill('#deposit', '15000');
      await page.selectOption('#deliveryStatus', 'proceso');
      await page.selectOption('#paymentMethod', 'mixto');
      
      await page.fill('#observations', 'Pieza elaborada según especificaciones del cliente. Requiere ajuste de talla. Se entregará en estuche de terciopelo con certificado de autenticidad.');
      
      await page.fill('#deliveryDate', '2025-09-15');
    });

    await test.step('Verificar cálculos antes de PDF', async () => {
      // Disparar recálculo
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(500);
      
      const subtotal = await page.inputValue('#subtotal');
      const balance = await page.inputValue('#balance');
      
      expect(parseFloat(subtotal)).toBe(50000); // 45000 + 5000
      expect(parseFloat(balance)).toBe(35000);  // 50000 - 15000
    });

    const downloadPromise = page.waitForEvent('download');
    
    await test.step('Generar PDF y analizar estructura', async () => {
      console.log('📄 Generando PDF con estructura completa...');
      await page.click('#generatePdfBtn');
      
      const download = await downloadPromise;
      const downloadedPath = path.join(downloadPath, 'test-estructura-completa.pdf');
      await download.saveAs(downloadedPath);
      
      console.log('✅ PDF de estructura generado:', downloadedPath);
      
      // Verificar que archivo existe
      expect(fs.existsSync(downloadedPath)).toBeTruthy();
      const fileSize = fs.statSync(downloadedPath).size;
      console.log('📏 Tamaño del PDF:', fileSize, 'bytes');
      
      // No importa el tamaño, debe existir y tener contenido
      expect(fileSize).toBeGreaterThan(50000); // Al menos 50KB
      
      // Test adicional: verificar que no es excesivamente pequeño (indicaría problema)
      if (fileSize < 100000) { // 100KB
        console.warn('⚠️ PDF más pequeño de lo esperado, posible problema de estructura');
      }
      
      // Test adicional: verificar que no es excesivamente grande (indicaría problema de memoria)
      if (fileSize > 50000000) { // 50MB
        console.warn('⚠️ PDF muy grande, posible problema de escalado');
      }
    });

    await test.step('Verificar estructura en vista previa', async () => {
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');
      
      const previewHTML = await page.innerHTML('#receiptPreview');
      
      // Verificar estructura completa
      expect(previewHTML).toContain('CIAOCIAO.MX');
      expect(previewHTML).toContain('Cliente Estructura Completa Test');
      expect(previewHTML).toContain('Collar');
      expect(previewHTML).toContain('ORO 18K');
      expect(previewHTML).toContain('Esmeraldas colombianas');
      expect(previewHTML).toContain('$50,000.00'); // Subtotal
      expect(previewHTML).toContain('$35,000.00'); // Balance
      expect(previewHTML).toContain('En proceso de fabricación');
      expect(previewHTML).toContain('Pieza elaborada según especificaciones');
      expect(previewHTML).toContain('TÉRMINOS Y CONDICIONES');
      expect(previewHTML).toContain('Gracias por su preferencia - ciaociao.mx');
      
      // Verificar que no hay indicadores de contenido cortado
      expect(previewHTML).not.toContain('...');
      expect(previewHTML).not.toContain('[cortado]');
      
      await page.click('#closePreview');
    });
  });

  test('Veronica Mancilla Case - Specific Structure Test', async ({ page }) => {
    console.log('👤 Test específico del caso de Veronica Mancilla...');

    const downloadPath = './test-results/downloads';
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    await test.step('Recrear caso exacto de Veronica Mancilla', async () => {
      await page.fill('#receiptDate', '2025-08-21');
      await page.selectOption('#transactionType', 'venta');
      
      await page.fill('#clientName', 'Veronica Mancilla gonzalez');
      await page.fill('#clientPhone', '55 2690 5104');
      await page.fill('#clientEmail', 'vermango13@yahoo.com.mx');
      
      await page.selectOption('#pieceType', 'pulsera');
      await page.selectOption('#material', 'oro-14k');
      await page.fill('#weight', '9');
      await page.fill('#stones', 'ZAFIRO 5.15 cts');
      await page.fill('#description', 'Oro Blanco');
      await page.fill('#orderNumber', '10580');
      
      await page.fill('#price', '39150');
      await page.fill('#contribution', '39150');
      await page.fill('#deliveryDate', '2025-08-21');
      await page.selectOption('#deliveryStatus', 'entregado');
      await page.selectOption('#paymentMethod', 'tarjeta');
    });

    await test.step('Verificar cálculos específicos de Veronica', async () => {
      await page.click('#price');
      await page.press('#price', 'Tab');
      await page.waitForTimeout(500);
      
      const subtotal = await page.inputValue('#subtotal');
      const balance = await page.inputValue('#balance');
      
      console.log('💰 Cálculos de Veronica - Subtotal:', subtotal, 'Balance:', balance);
      
      // Este era el problema original - subtotal debe ser 78300, no 0
      expect(parseFloat(subtotal)).toBe(78300); // 39150 + 39150
      expect(parseFloat(balance)).toBe(78300);  // Sin anticipo
    });

    const downloadPromise = page.waitForEvent('download');
    
    await test.step('Generar PDF de Veronica Mancilla', async () => {
      console.log('📄 Generando PDF específico de Veronica Mancilla...');
      await page.click('#generatePdfBtn');
      
      const download = await downloadPromise;
      const downloadedPath = path.join(downloadPath, 'test-veronica-mancilla-fixed.pdf');
      await download.saveAs(downloadedPath);
      
      console.log('✅ PDF de Veronica Mancilla generado:', downloadedPath);
      
      expect(fs.existsSync(downloadedPath)).toBeTruthy();
      const fileSize = fs.statSync(downloadedPath).size;
      console.log('📏 Tamaño del PDF corregido:', fileSize, 'bytes');
      
      // Debe tener contenido substancial
      expect(fileSize).toBeGreaterThan(20000); // Al menos 20KB
    });

    await test.step('Verificar contenido específico de Veronica en preview', async () => {
      await page.click('#previewBtn');
      await page.waitForSelector('#receiptPreview');
      
      const previewContent = await page.textContent('#receiptPreview');
      
      // Verificar datos específicos de Veronica
      expect(previewContent).toContain('Veronica Mancilla gonzalez');
      expect(previewContent).toContain('55 2690 5104');
      expect(previewContent).toContain('vermango13@yahoo.com.mx');
      expect(previewContent).toContain('Pulsera');
      expect(previewContent).toContain('ORO 14K');
      expect(previewContent).toContain('9 gramos');
      expect(previewContent).toContain('ZAFIRO 5.15 cts');
      expect(previewContent).toContain('Oro Blanco');
      expect(previewContent).toContain('10580');
      
      // Verificar cálculos corregidos
      expect(previewContent).toContain('$78,300.00'); // Subtotal correcto
      expect(previewContent).toContain('Tarjeta'); // Método de pago
      
      // Verificar términos para pieza entregada
      expect(previewContent).toContain('El cliente ha recibido la pieza y declara estar conforme');
      
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