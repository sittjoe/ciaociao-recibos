// currency-truncation-fix-validation.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Currency Truncation Fix Validation', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/test-currency-truncation-fix.html');
    });

    test('Currency formatting functions work correctly', async ({ page }) => {
        console.log('🧪 Testing currency formatting functions...');
        
        // Test various currency amounts
        const testCases = [
            { amount: 19900, expected: '$19,900.00' },
            { amount: 119900, expected: '$119,900.00' },
            { amount: 1199900, expected: '$1,199,900.00' },
            { amount: 9999999.99, expected: '$9,999,999.99' }
        ];
        
        for (const testCase of testCases) {
            const result = await page.evaluate((amount) => {
                return window.utils.formatCurrency(amount);
            }, testCase.amount);
            
            console.log(`Testing ${testCase.amount}: expected ${testCase.expected}, got ${result}`);
            expect(result).toBe(testCase.expected);
        }
    });

    test('Form currency previews update correctly', async ({ page }) => {
        console.log('🧪 Testing form currency previews...');
        
        // Test price field
        await page.fill('#price', '119900');
        const pricePreview = await page.textContent('#pricePreview');
        expect(pricePreview).toBe('$119,900.00');
        
        // Test contribution field  
        await page.fill('#contribution', '19900');
        const contributionPreview = await page.textContent('#contributionPreview');
        expect(contributionPreview).toBe('$19,900.00');
        
        // Test deposit field
        await page.fill('#deposit', '1199900');
        const depositPreview = await page.textContent('#depositPreview');
        expect(depositPreview).toBe('$1,199,900.00');
    });

    test('PDF generation test with edge case amounts', async ({ page }) => {
        console.log('🧪 Testing PDF generation with edge case currency amounts...');
        
        // Fill form with edge case amounts
        await page.fill('#receiptNumber', 'TEST-CURRENCY-001');
        await page.fill('#clientName', 'Cliente Prueba Moneda');
        await page.fill('#price', '119900');
        await page.fill('#contribution', '19900'); 
        await page.fill('#deposit', '1199900');
        await page.selectOption('#transactionType', 'venta');
        
        // Listen for console logs to capture currency debug information
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('CURRENCY DEBUG')) {
                consoleLogs.push(msg.text());
            }
        });
        
        // Click PDF generation button
        await page.click('#generatePdfBtn');
        
        // Wait for potential processing
        await page.waitForTimeout(2000);
        
        // Verify currency debug logs were captured
        expect(consoleLogs.length).toBeGreaterThan(0);
        
        // Log captured debug information
        console.log('🧪 Captured currency debug logs:');
        consoleLogs.forEach(log => console.log(log));
    });

    test('Container width enhancements are applied', async ({ page }) => {
        console.log('🧪 Testing container width enhancements...');
        
        // Fill form with large amounts
        await page.fill('#price', '9999999.99');
        await page.fill('#contribution', '1199900');
        await page.fill('#deposit', '119900');
        
        // Check that preview containers can display full amounts
        const pricePreview = await page.textContent('#pricePreview');
        const contributionPreview = await page.textContent('#contributionPreview');
        const depositPreview = await page.textContent('#depositPreview');
        
        // Verify full currency strings are displayed
        expect(pricePreview).toBe('$9,999,999.99');
        expect(contributionPreview).toBe('$1,199,900.00');
        expect(depositPreview).toBe('$119,900.00');
        
        // Check that preview elements have sufficient width
        const priceElement = await page.locator('#pricePreview');
        const priceBox = await priceElement.boundingBox();
        
        // Currency preview should be wide enough for the content
        expect(priceBox.width).toBeGreaterThan(150);
    });

    test('Financial table styling prevents truncation', async ({ page }) => {
        console.log('🧪 Testing financial table styling...');
        
        // Navigate to main application to check actual receipt formatting
        await page.goto('/index.html');
        
        // Fill form with edge case amounts
        await page.fill('#receiptNumber', 'TEST-001');
        await page.fill('#clientName', 'Test Client');
        await page.fill('#price', '1199900');
        await page.fill('#contribution', '119900');
        await page.selectOption('#transactionType', 'venta');
        
        // Generate preview to check table styling
        await page.click('#previewBtn');
        
        // Wait for modal to appear
        await page.waitForSelector('#previewModal', { state: 'visible' });
        
        // Check that currency values are fully displayed in tables
        const currencyElements = await page.locator('td[style*="text-align: right"]').all();
        
        for (const element of currencyElements) {
            const text = await element.textContent();
            if (text && text.includes('$')) {
                console.log(`Found currency: ${text}`);
                // Verify currency format is complete (should not end abruptly)
                expect(text).toMatch(/\$[\d,]+\.\d{2}/);
            }
        }
    });

    test('Debug logging captures currency processing', async ({ page }) => {
        console.log('🧪 Testing debug logging for currency processing...');
        
        await page.goto('/index.html');
        
        const debugLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('CURRENCY DEBUG')) {
                debugLogs.push(msg.text());
            }
        });
        
        // Fill form and generate PDF to trigger debug logging
        await page.fill('#receiptNumber', 'DEBUG-001');
        await page.fill('#clientName', 'Debug Test');
        await page.fill('#price', '119900');
        await page.fill('#contribution', '19900');
        await page.selectOption('#transactionType', 'venta');
        
        // Trigger PDF generation
        await page.click('#generatePdfBtn');
        
        // Wait for processing
        await page.waitForTimeout(3000);
        
        // Verify debug logs were captured
        expect(debugLogs.length).toBeGreaterThan(0);
        
        // Check for specific debug log patterns
        const hasFinancialValuesLog = debugLogs.some(log => 
            log.includes('Financial values to be rendered')
        );
        const hasTableAnalysisLog = debugLogs.some(log => 
            log.includes('Financial tables analysis')
        );
        const hasContainerDimensionsLog = debugLogs.some(log => 
            log.includes('Final container dimensions')
        );
        
        expect(hasFinancialValuesLog).toBeTruthy();
        expect(hasTableAnalysisLog).toBeTruthy(); 
        expect(hasContainerDimensionsLog).toBeTruthy();
        
        console.log(`🧪 Captured ${debugLogs.length} currency debug logs`);
    });
});