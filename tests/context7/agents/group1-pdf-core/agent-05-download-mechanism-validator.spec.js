// Agent 5: Download-Mechanism-Validator
// Confirmar descarga real de PDFs - CRÍTICO

import { test, expect } from '@playwright/test';
import { Context720Utils } from '../../context7-20-agents.config.js';
import fs from 'fs';

test.describe('Agent 5: Download Mechanism Validator', () => {
  const AGENT_ID = 5;

  test.beforeEach(async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'setup', 'STARTING');
    await page.goto('https://recibos.ciaociao.mx/receipt-mode.html');
  });

  test('pdf_file_download - Validar descarga real de archivo PDF', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'pdf_file_download', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Llenar formulario completo para test realista
      await page.fill('input[name="clientName"]', 'Download Test Client');
      await page.fill('input[name="clientPhone"]', '55 7777 8888');
      await page.fill('input[name="clientEmail"]', 'download@test.com');
      await page.selectOption('select[name="pieceType"]', 'anillo');
      await page.selectOption('select[name="material"]', 'oro-14k');
      await page.fill('input[name="weight"]', '7');
      await page.fill('textarea[name="description"]', 'Anillo para test de descarga PDF');
      await page.fill('input[name="price"]', '12000');

      Context720Utils.logAgentProgress(AGENT_ID, 'form_completed', 'SUCCESS');

      // Configurar captura de descarga con timeout extendido
      const downloadPromise = page.waitForDownload({ timeout: 45000 });

      // Medir tiempo de generación PDF
      const pdfGenerationStart = Date.now();
      
      await page.locator('button[onclick*="generatePDF"]').click();
      Context720Utils.logAgentProgress(AGENT_ID, 'pdf_generation_clicked', 'SUCCESS');

      // Esperar descarga
      const download = await downloadPromise;
      const pdfGenerationTime = Date.now() - pdfGenerationStart;

      // Información de descarga
      const downloadInfo = {
        suggestedFilename: download.suggestedFilename(),
        url: download.url(),
        generationTime: pdfGenerationTime
      };

      expect(download).toBeDefined();
      expect(downloadInfo.suggestedFilename).toContain('.pdf');
      expect(pdfGenerationTime).toBeLessThan(30000); // Máximo 30 segundos

      Context720Utils.logAgentProgress(AGENT_ID, 'download_received', 'SUCCESS', downloadInfo);

      // Guardar archivo y obtener ruta real
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      const downloadPath = `${agentDir}/downloads/${downloadInfo.suggestedFilename}`;
      
      await download.saveAs(downloadPath);

      // Verificar que archivo se guardó correctamente
      const fileExists = fs.existsSync(downloadPath);
      expect(fileExists).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'pdf_file_download', 'SUCCESS', {
        downloadInfo: downloadInfo,
        downloadPath: downloadPath,
        fileExists: fileExists,
        generationTime: pdfGenerationTime
      });

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'pdf_file_download', 'FAILED', {
        error: error.message,
        stack: error.stack
      });

      // Screenshot del estado cuando falló
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/download_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

  test('file_size_validation - Validar tamaño y validez archivo PDF', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'file_size_validation', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Formulario con contenido que genere PDF de tamaño considerable
      await page.fill('input[name="clientName"]', 'File Size Validation Client - Nombre Largo para Testing');
      await page.fill('input[name="clientPhone"]', '+52 55 9999 0000');
      await page.fill('input[name="clientEmail"]', 'file.size.test@validacion.com');
      await page.selectOption('select[name="pieceType"]', 'collar');
      await page.selectOption('select[name="material"]', 'oro-18k');
      await page.fill('input[name="weight"]', '45.75');
      await page.fill('textarea[name="description"]', 'Collar de diseño exclusivo con múltiples piedras preciosas, trabajo artesanal detallado, incluye certificación de autenticidad, garantía extendida, y estuche de presentación personalizado. Descripción larga para generar PDF de tamaño significativo.');
      await page.fill('input[name="price"]', '85000');

      // Generar PDF y descargar
      const downloadPromise = page.waitForDownload({ timeout: 45000 });
      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      
      // Guardar y analizar archivo
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      const fileName = download.suggestedFilename();
      const filePath = `${agentDir}/downloads/${fileName}`;
      
      await download.saveAs(filePath);

      // Análisis del archivo
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      // Verificar contenido del archivo (primeros bytes para confirmar que es PDF)
      const fileBuffer = fs.readFileSync(filePath);
      const isPDFHeader = fileBuffer.toString('ascii', 0, 4) === '%PDF';

      const fileAnalysis = {
        fileName: fileName,
        filePath: filePath,
        fileSize: fileSize,
        fileSizeKB: Math.round(fileSize / 1024),
        isPDFHeader: isPDFHeader,
        isValidSize: fileSize > 5000 && fileSize < 10000000, // 5KB - 10MB
        createdAt: fileStats.birthtime.toISOString()
      };

      // Validaciones
      expect(fileSize).toBeGreaterThan(5000); // Mínimo 5KB
      expect(fileSize).toBeLessThan(10000000); // Máximo 10MB
      expect(isPDFHeader).toBe(true);

      Context720Utils.logAgentProgress(AGENT_ID, 'file_size_validation', 'SUCCESS', fileAnalysis);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'file_size_validation', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  });

  test('content_verification - Verificar contenido PDF generado', async ({ page }) => {
    Context720Utils.logAgentProgress(AGENT_ID, 'content_verification', 'RUNNING');

    try {
      // Autenticación
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('27181730');
        await page.locator('button[onclick*="validatePassword"]').click();
        await page.waitForSelector('.container', { state: 'visible', timeout: 10000 });
      }

      // Datos específicos para verificar en PDF
      const testData = {
        clientName: 'Content Verification Test',
        phone: '55 4444 5555',
        email: 'content@verification.test',
        pieceType: 'pulsera',
        material: 'oro-14k',
        weight: '18.5',
        description: 'Pulsera para verificación de contenido PDF',
        price: '22500'
      };

      // Llenar formulario con datos específicos
      await page.fill('input[name="clientName"]', testData.clientName);
      await page.fill('input[name="clientPhone"]', testData.phone);
      await page.fill('input[name="clientEmail"]', testData.email);
      await page.selectOption('select[name="pieceType"]', testData.pieceType);
      await page.selectOption('select[name="material"]', testData.material);
      await page.fill('input[name="weight"]', testData.weight);
      await page.fill('textarea[name="description"]', testData.description);
      await page.fill('input[name="price"]', testData.price);

      // Generar y descargar PDF
      const downloadPromise = page.waitForDownload({ timeout: 45000 });
      await page.locator('button[onclick*="generatePDF"]').click();
      
      const download = await downloadPromise;
      
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      const fileName = download.suggestedFilename();
      const filePath = `${agentDir}/downloads/${fileName}`;
      
      await download.saveAs(filePath);

      // Verificación básica de contenido PDF (análisis de texto si es posible)
      const fileBuffer = fs.readFileSync(filePath);
      const fileContent = fileBuffer.toString('binary');

      // Buscar elementos críticos en el contenido del PDF
      const contentVerification = {
        hasClientName: fileContent.includes(testData.clientName),
        hasPhone: fileContent.includes(testData.phone.replace(/\s/g, '')), 
        hasCIAOCIAO: fileContent.includes('CIAOCIAO') || fileContent.includes('ciaociao'),
        hasRECIBO: fileContent.includes('RECIBO') || fileContent.includes('recibo'),
        hasPrice: fileContent.includes(testData.price) || fileContent.includes('22,500'),
        hasMaterial: fileContent.includes('oro') || fileContent.includes('ORO'),
        
        // Verificaciones de estructura
        fileSize: fileBuffer.length,
        hasPDFStructure: fileContent.includes('xref') && fileContent.includes('trailer'),
        
        testData: testData,
        fileName: fileName
      };

      // Al menos algunos elementos críticos deben estar presentes
      const criticalElementsPresent = [
        contentVerification.hasCIAOCIAO,
        contentVerification.hasRECIBO,
        contentVerification.hasPDFStructure
      ].filter(Boolean).length;

      expect(criticalElementsPresent).toBeGreaterThanOrEqual(2); // Al menos 2 de 3 elementos críticos

      Context720Utils.logAgentProgress(AGENT_ID, 'content_verification', 'SUCCESS', contentVerification);

    } catch (error) {
      Context720Utils.logAgentProgress(AGENT_ID, 'content_verification', 'FAILED', {
        error: error.message
      });
      
      const agentDir = Context720Utils.createOutputDir(AGENT_ID);
      await page.screenshot({ 
        path: `${agentDir}/screenshots/content_verification_failure.png`,
        fullPage: true 
      });

      throw error;
    }
  });

});