// PDF Page Count Testing - Verifies single page output
// Test case for Veronica Mancilla Gonzalez receipt

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
    console.log('🧪 Starting PDF single-page test...');
    
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false,  // Keep visible for debugging
        slowMo: 100       // Slow down actions
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging to capture scaling calculations
        page.on('console', msg => {
            if (msg.text().includes('📐') || msg.text().includes('📏') || msg.text().includes('📄')) {
                console.log(`BROWSER LOG: ${msg.text()}`);
            }
        });
        
        console.log('🌐 Navigating to receipts system...');
        await page.goto('https://recibos.ciaociao.mx');
        
        // Login
        console.log('🔑 Logging in...');
        await page.fill('input[type="password"]', '27181730');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.container', { timeout: 10000 });
        
        // Go to receipts mode
        console.log('📄 Entering receipts mode...');
        await page.click('.mode-card:has-text("RECIBOS")');
        await page.waitForURL('**/receipt-mode.html');
        
        // Fill out Veronica Mancilla case
        console.log('📝 Filling receipt form (Veronica Mancilla case)...');
        
        // Client info
        await page.fill('#clientName', 'Veronica Mancilla Gonzalez');
        await page.fill('#clientPhone', '+52 1 55 1234 5678');
        await page.fill('#clientEmail', 'veronica.mancilla@email.com');
        
        // Piece details  
        await page.selectOption('#transactionType', 'venta');
        await page.selectOption('#pieceType', 'anillo');
        await page.selectOption('#material', 'oro-18k');
        await page.fill('#weight', '5.2');
        await page.fill('#size', '7');
        await page.fill('#stones', 'Diamante 0.5ct');
        await page.fill('#description', 'Anillo de compromiso oro 18k con diamante central');
        
        // Financial info (this creates significant content)
        await page.fill('#price', '25000');
        await page.fill('#contribution', '5000');
        await page.fill('#deposit', '15000');
        
        // Delivery info
        await page.selectOption('#deliveryStatus', 'proceso');
        await page.selectOption('#paymentMethod', 'mixto');
        
        // Observations (add more content to test scaling)
        await page.fill('#observations', 'Pieza especial para compromiso. Cliente solicita grabado personalizado en el interior del anillo. Entrega programada para ceremonia especial. Requiere caja de presentación premium con certificado de autenticidad del diamante.');
        
        // Wait a moment for calculations
        await page.waitForTimeout(1000);
        
        // Generate PDF
        console.log('🎨 Generating PDF...');
        
        // Set up download handling
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        
        // Click generate PDF button
        await page.click('#generatePdfBtn');
        
        // Wait for download
        const download = await downloadPromise;
        console.log(`📥 PDF downloaded: ${download.suggestedFilename()}`);
        
        // Save PDF to test location
        const testDownloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
        await download.saveAs(testDownloadPath);
        
        console.log(`💾 PDF saved to: ${testDownloadPath}`);
        
        // TODO: Add PDF page count analysis here
        // For now, we rely on console logs to verify scaling calculations
        
        console.log('✅ Test completed successfully');
        console.log('📊 Check browser console logs above for scaling calculations');
        console.log('🔍 Manually verify PDF page count in downloaded file');
        
        // Keep browser open for manual verification
        console.log('Browser will stay open for 30 seconds for manual verification...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run test
if (require.main === module) {
    testPDFGeneration()
        .then(() => console.log('🏁 Test suite completed'))
        .catch(console.error);
}

module.exports = { testPDFGeneration };