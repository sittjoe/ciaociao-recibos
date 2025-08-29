// tests/currency-format-validation.spec.js
// Playwright tests for currency formatting validation

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Currency Format Validation', () => {
    const testCases = [
        { value: 20000, description: 'Original problem: $20,000 → shows as $20,00', expected: '$20,000.00' },
        { value: 10000, description: 'Contribution: $10,000 → shows as $10,00', expected: '$10,000.00' },
        { value: 30000, description: 'Total: $30,000 → shows as $30,000.0', expected: '$30,000.00' },
        { value: 119900, description: 'Edge case: $119,900', expected: '$119,900.00' },
        { value: 1199900, description: 'Large case: $1,199,900', expected: '$1,199,900.00' },
        { value: 9999999, description: 'Maximum case: $9,999,999', expected: '$9,999,999.00' },
        { value: 0.99, description: 'Minimum case: $0.99', expected: '$0.99' },
        { value: 12345.67, description: 'With decimals: $12,345.67', expected: '$12,345.67' }
    ];

    test.beforeEach(async ({ page }) => {
        // Navigate to the receipt system
        await page.goto('http://localhost:8080');
        
        // Login if needed
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('27181730');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }
        
        // Navigate to receipt mode if in selector
        const receiptButton = page.locator('text=RECIBOS');
        if (await receiptButton.isVisible()) {
            await receiptButton.click();
            await page.waitForTimeout(1000);
        }
    });

    test('Currency formatting in HTML elements', async ({ page }) => {
        console.log('🧪 Testing currency formatting in HTML elements...');
        
        // Fill form with test data
        await page.fill('input[name="clientName"]', 'Test Cliente');
        await page.fill('input[name="clientPhone"]', '5555555555');
        await page.fill('input[name="price"]', '20000');
        await page.fill('input[name="contribution"]', '10000');
        
        // Trigger balance calculation
        await page.click('input[name="price"]'); // Focus and blur to trigger calculations
        await page.click('input[name="contribution"]');
        
        // Wait for calculations
        await page.waitForTimeout(1000);
        
        // Check if currency values are formatted correctly in the form
        const priceDisplay = page.locator('input[name="price"]');
        const priceValue = await priceDisplay.inputValue();
        console.log(`💰 Price field value: "${priceValue}"`);
        
        // The input might not show formatted value, but balance should
        const balanceElements = page.locator('.currency-value, [data-currency="true"]');
        const count = await balanceElements.count();
        console.log(`Found ${count} currency elements`);
        
        for (let i = 0; i < count; i++) {
            const element = balanceElements.nth(i);
            const text = await element.textContent();
            const dataValue = await element.getAttribute('data-value');
            
            console.log(`Currency element ${i}: "${text}" (data-value: ${dataValue})`);
            
            if (dataValue) {
                const numericValue = parseFloat(dataValue);
                // Check format has proper thousands separators and decimals
                if (numericValue >= 1000) {
                    expect(text).toContain(','); // Should have thousands separator
                }
                expect(text).toMatch(/\.\d{2}$/); // Should end with exactly 2 decimals
                expect(text).not.toMatch(/,\d{2}$/); // Should not end with ,XX (truncated thousands)
            }
        }
    });

    test('Currency formatting in PDF preview', async ({ page }) => {
        console.log('🧪 Testing currency formatting in PDF preview...');
        
        // Fill required form fields
        await page.fill('input[name="clientName"]', 'Test Cliente PDF');
        await page.fill('input[name="clientPhone"]', '5555555555');
        await page.fill('input[name="productType"]', 'Anillo');
        await page.fill('input[name="material"]', 'ORO 14K');
        await page.fill('input[name="price"]', '20000');
        await page.fill('input[name="contribution"]', '10000');
        
        // Open preview
        await page.click('button:has-text("Vista Previa")');
        await page.waitForSelector('#previewModal', { state: 'visible' });
        
        // Wait for preview to load
        await page.waitForTimeout(2000);
        
        // Check currency formatting in preview
        const previewContent = page.locator('#receiptPreview');
        const previewHTML = await previewContent.innerHTML();
        
        console.log('📄 Checking preview HTML for currency patterns...');
        
        // Check for problematic patterns
        const truncatedPattern = /\$\d+,\d{2}(?!\d)/g; // Pattern like $20,00
        const singleDecimalPattern = /\$[\d,]+\.\d{1}(?!\d)/g; // Pattern like $30,000.0
        
        const truncatedMatches = previewHTML.match(truncatedPattern) || [];
        const singleDecimalMatches = previewHTML.match(singleDecimalPattern) || [];
        
        console.log(`Found ${truncatedMatches.length} truncated currency patterns:`, truncatedMatches);
        console.log(`Found ${singleDecimalMatches.length} single decimal patterns:`, singleDecimalMatches);
        
        // These should be zero - no problematic patterns
        expect(truncatedMatches.length).toBe(0);
        expect(singleDecimalMatches.length).toBe(0);
        
        // Check for correct patterns
        const correctPattern = /\$[\d,]+\.\d{2}/g;
        const correctMatches = previewHTML.match(correctPattern) || [];
        console.log(`Found ${correctMatches.length} correct currency patterns:`, correctMatches);
        
        // Should have at least some correct currency formats
        expect(correctMatches.length).toBeGreaterThan(0);
        
        // Close preview
        await page.click('button:has-text("Cerrar")');
    });

    test('PDF generation with currency validation', async ({ page }) => {
        console.log('🧪 Testing PDF generation with currency validation...');
        
        // Fill form with problematic values
        await page.fill('input[name="clientName"]', 'Test PDF Currency');
        await page.fill('input[name="clientPhone"]', '5555555555');
        await page.fill('input[name="productType"]', 'Collar');
        await page.fill('input[name="material"]', 'ORO 18K');
        await page.fill('input[name="price"]', '119900'); // This was causing $119,90
        await page.fill('input[name="contribution"]', '25000');
        
        // Set up download listening
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        
        // Generate PDF
        console.log('📄 Generating PDF...');
        await page.click('button:has-text("Generar PDF")');
        
        // Wait for PDF generation
        try {
            const download = await downloadPromise;
            console.log('✅ PDF download initiated');
            
            // Save the file temporarily for validation
            const downloadPath = path.join(__dirname, 'temp', `test-${Date.now()}.pdf`);
            await download.saveAs(downloadPath);
            
            // Validate file exists and has reasonable size
            expect(fs.existsSync(downloadPath)).toBeTruthy();
            
            const stats = fs.statSync(downloadPath);
            console.log(`📊 PDF file size: ${stats.size} bytes`);
            expect(stats.size).toBeGreaterThan(5000); // Should be at least 5KB
            expect(stats.size).toBeLessThan(5000000); // Should be less than 5MB
            
            // Clean up
            fs.unlinkSync(downloadPath);
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            
            // Capture screenshot for debugging
            await page.screenshot({ 
                path: path.join(__dirname, 'test-results', `pdf-generation-failure-${Date.now()}.png`),
                fullPage: true 
            });
            
            throw error;
        }
    });

    test('Currency validation functions', async ({ page }) => {
        console.log('🧪 Testing currency validation functions...');
        
        // Fill form to create currency elements
        await page.fill('input[name="clientName"]', 'Test Validation');
        await page.fill('input[name="clientPhone"]', '5555555555');
        await page.fill('input[name="price"]', '50000');
        await page.fill('input[name="contribution"]', '15000');
        
        // Test if validation functions exist
        const validationExists = await page.evaluate(() => {
            return typeof validateCurrencyBeforePDF === 'function';
        });
        
        if (validationExists) {
            console.log('✅ Currency validation functions available');
            
            // Run validation
            const validationResult = await page.evaluate(() => {
                return validateCurrencyBeforePDF();
            });
            
            console.log('📊 Validation result:', validationResult);
            
            expect(validationResult).toHaveProperty('valid');
            expect(validationResult).toHaveProperty('totalElements');
            expect(validationResult).toHaveProperty('issues');
            
            // If there are issues, test the fix function
            if (validationResult.issues && validationResult.issues.length > 0) {
                console.log(`⚠️ Found ${validationResult.issues.length} currency issues`);
                
                const fixExists = await page.evaluate(() => {
                    return typeof fixCurrencyFormatting === 'function';
                });
                
                if (fixExists) {
                    const fixResult = await page.evaluate(() => {
                        return fixCurrencyFormatting();
                    });
                    
                    console.log(`🔧 Fixed ${fixResult} currency elements`);
                    expect(fixResult).toBeGreaterThanOrEqual(0);
                }
            }
        } else {
            console.warn('⚠️ Currency validation functions not available');
        }
    });

    test('Edge cases and stress testing', async ({ page }) => {
        console.log('🧪 Testing edge cases and stress scenarios...');
        
        const edgeCases = [
            { price: '0', contribution: '0', description: 'Zero values' },
            { price: '0.01', contribution: '0', description: 'Minimum price' },
            { price: '9999999', contribution: '1000000', description: 'Maximum values' },
            { price: '12345.67', contribution: '2345.89', description: 'Decimal values' }
        ];
        
        for (const testCase of edgeCases) {
            console.log(`🔍 Testing ${testCase.description}...`);
            
            // Clear and fill form
            await page.fill('input[name="clientName"]', `Test ${testCase.description}`);
            await page.fill('input[name="clientPhone"]', '5555555555');
            await page.fill('input[name="price"]', testCase.price);
            await page.fill('input[name="contribution"]', testCase.contribution);
            
            // Trigger calculations
            await page.click('input[name="price"]');
            await page.waitForTimeout(500);
            
            // Check for JavaScript errors
            const errors = [];
            page.on('pageerror', error => errors.push(error));
            
            // Try to open preview
            try {
                await page.click('button:has-text("Vista Previa")');
                await page.waitForTimeout(1000);
                
                // Check if preview opened successfully
                const previewVisible = await page.isVisible('#previewModal');
                expect(previewVisible).toBeTruthy();
                
                // Close preview
                await page.click('button:has-text("Cerrar")');
                
                console.log(`✅ ${testCase.description} handled correctly`);
                
            } catch (error) {
                console.error(`❌ ${testCase.description} failed:`, error);
                throw error;
            }
            
            // Check for JavaScript errors during this test
            expect(errors.length).toBe(0);
        }
    });

    test.afterEach(async ({ page }) => {
        // Capture console logs
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('CURRENCY') || msg.text().includes('💰')) {
                logs.push(`[${msg.type()}] ${msg.text()}`);
            }
        });
        
        // If test failed, capture screenshot
        if (test.info().status !== 'passed') {
            await page.screenshot({ 
                path: path.join(__dirname, 'test-results', `failure-${test.info().title.replace(/\s+/g, '-')}-${Date.now()}.png`),
                fullPage: true 
            });
        }
        
        // Log console messages
        if (logs.length > 0) {
            console.log('📋 Console logs captured:');
            logs.forEach(log => console.log(log));
        }
    });
});

// Helper functions for test utilities
test.describe('Currency Utility Functions', () => {
    test('formatCurrency function validation', async ({ page }) => {
        await page.goto('http://localhost:8080');
        
        // Test formatCurrency function directly
        const testResults = await page.evaluate(() => {
            const testCases = [
                { input: 20000, expected: '$20,000.00' },
                { input: 10000, expected: '$10,000.00' },
                { input: 30000, expected: '$30,000.00' },
                { input: 119900, expected: '$119,900.00' },
                { input: 0.99, expected: '$0.99' },
                { input: '25000', expected: '$25,000.00' },
                { input: null, expected: '$0.00' },
                { input: undefined, expected: '$0.00' },
                { input: '', expected: '$0.00' }
            ];
            
            const results = [];
            
            testCases.forEach((testCase, index) => {
                try {
                    const result = utils.formatCurrency(testCase.input);
                    const passed = result === testCase.expected;
                    
                    results.push({
                        index: index + 1,
                        input: testCase.input,
                        expected: testCase.expected,
                        actual: result,
                        passed: passed
                    });
                    
                } catch (error) {
                    results.push({
                        index: index + 1,
                        input: testCase.input,
                        expected: testCase.expected,
                        actual: `ERROR: ${error.message}`,
                        passed: false
                    });
                }
            });
            
            return results;
        });
        
        console.log('🧪 formatCurrency test results:');
        
        let passedCount = 0;
        testResults.forEach(result => {
            if (result.passed) {
                passedCount++;
                console.log(`✅ Test ${result.index}: ${result.input} → ${result.actual}`);
            } else {
                console.log(`❌ Test ${result.index}: ${result.input} → Expected "${result.expected}", got "${result.actual}"`);
            }
        });
        
        console.log(`📊 Results: ${passedCount}/${testResults.length} tests passed`);
        
        // Expect all tests to pass
        expect(passedCount).toBe(testResults.length);
    });
});