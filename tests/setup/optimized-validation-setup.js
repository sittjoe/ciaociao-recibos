// optimized-validation-setup.js
// Global setup for optimized PDF validation tests

import fs from 'fs';
import path from 'path';

async function globalSetup() {
    console.log('🔧 OPTIMIZED PDF VALIDATION - Global Setup Starting...');
    
    const setupStart = Date.now();
    
    try {
        // Create necessary directories
        const testResultsDir = path.join(process.cwd(), 'test-results');
        const optimizedValidationDir = path.join(testResultsDir, 'optimized-pdf-validation');
        const screenshotsDir = path.join(optimizedValidationDir, 'screenshots');
        const pdfsDir = path.join(optimizedValidationDir, 'generated-pdfs');
        
        [testResultsDir, optimizedValidationDir, screenshotsDir, pdfsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
        
        // Create initial validation report structure
        const validationReport = {
            testSuite: 'Optimized PDF Validation',
            startTime: new Date().toISOString(),
            optimizationsToValidate: [
                'Horizontal layout (landscape 297mm x 210mm)',
                'Amount formatting ($XX,XXX.XX)',
                '3-column layout structure', 
                'Financial section expansion',
                'Text cutoff prevention (white-space: nowrap)',
                'Large amount handling ($25,000+)',
                'Complex decimal calculations'
            ],
            expectedOutcomes: {
                pdfOrientation: 'landscape',
                amountFormat: '$XX,XXX.XX',
                noTextCutoffs: true,
                performanceThreshold: '45 seconds',
                crossBrowserCompatibility: true
            },
            testEnvironment: {
                nodeVersion: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            }
        };
        
        const reportPath = path.join(optimizedValidationDir, 'validation-setup-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2));
        
        // Check system requirements
        const systemCheck = {
            directories: {
                testResults: fs.existsSync(testResultsDir),
                optimizedValidation: fs.existsSync(optimizedValidationDir),
                screenshots: fs.existsSync(screenshotsDir),
                pdfs: fs.existsSync(pdfsDir)
            },
            timestamp: new Date().toISOString(),
            setupDuration: Date.now() - setupStart
        };
        
        const systemCheckPath = path.join(optimizedValidationDir, 'system-check.json');
        fs.writeFileSync(systemCheckPath, JSON.stringify(systemCheck, null, 2));
        
        const setupDuration = Date.now() - setupStart;
        console.log(`✅ Optimized PDF validation setup completed in ${setupDuration}ms`);
        console.log('📊 Setup Summary:');
        console.log('   ✅ Test directories created');
        console.log('   ✅ Validation report initialized');
        console.log('   ✅ System requirements verified');
        console.log('   🎯 Ready to validate PDF optimizations');
        
        return {
            success: true,
            duration: setupDuration,
            directories: systemCheck.directories
        };
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        
        // Create error report
        const errorReport = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            setupDuration: Date.now() - setupStart
        };
        
        const errorPath = path.join(process.cwd(), 'test-results', 'setup-error.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
        
        throw error;
    }
}

export default globalSetup;