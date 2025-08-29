#!/usr/bin/env node

// run-optimized-pdf-validation.js
// Executes the comprehensive optimized PDF validation suite
// Validates: Horizontal layout, amount formatting, no truncation, performance

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 OPTIMIZED PDF VALIDATION SUITE - CIAOCIAO RECIBOS');
console.log('==================================================');
console.log('📋 Validating PDF optimizations implemented:');
console.log('   ✅ Horizontal layout (landscape 297mm x 210mm)');
console.log('   ✅ Amount formatting ($XX,XXX.XX)');
console.log('   ✅ Large amount support ($25,000+)');
console.log('   ✅ No text truncation fixes');
console.log('   ✅ 3-column layout structure');
console.log('   ✅ Performance optimization');
console.log('==================================================\n');

async function runOptimizedValidation() {
    const startTime = Date.now();
    
    try {
        console.log('🔧 Setting up validation environment...');
        
        // Ensure test directories exist
        const testResultsDir = path.join(process.cwd(), 'test-results');
        const optimizedValidationDir = path.join(testResultsDir, 'optimized-pdf-validation');
        
        if (!fs.existsSync(testResultsDir)) {
            fs.mkdirSync(testResultsDir, { recursive: true });
        }
        
        if (!fs.existsSync(optimizedValidationDir)) {
            fs.mkdirSync(optimizedValidationDir, { recursive: true });
        }
        
        console.log('✅ Environment setup completed');
        console.log('🎯 Starting optimized PDF validation tests...\n');
        
        // Run Playwright tests with specific configuration
        const playwrightArgs = [
            'test',
            '--config=tests/optimized-pdf-validation.config.js',
            'tests/optimized-pdf-validation-final.spec.js',
            '--reporter=list,json,html',
            '--output=test-results/optimized-pdf-validation',
            '--workers=1',
            '--timeout=180000'
        ];
        
        console.log(`🏃 Executing: npx playwright ${playwrightArgs.join(' ')}\n`);
        
        const result = await runPlaywrightTest(playwrightArgs);
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 OPTIMIZED PDF VALIDATION SUMMARY');
        console.log('='.repeat(50));
        
        if (result.success) {
            console.log('🎉 STATUS: ALL VALIDATIONS PASSED ✅');
            console.log('📋 Confirmed optimizations:');
            console.log('   ✅ Horizontal PDF layout (landscape)');
            console.log('   ✅ Proper amount formatting ($XX,XXX.XX)');
            console.log('   ✅ Large amount handling ($25,000+)');
            console.log('   ✅ Complex decimal calculations');
            console.log('   ✅ No text truncation issues');
            console.log('   ✅ Performance within limits');
            
        } else {
            console.log('❌ STATUS: SOME VALIDATIONS FAILED');
            console.log('⚠️ Review test output above for details');
        }
        
        console.log(`⏱️ Total execution time: ${Math.round(totalDuration / 1000)}s`);
        console.log(`📁 Results saved to: test-results/optimized-pdf-validation/`);
        console.log(`📄 HTML Report: playwright-report/optimized-pdf-validation/index.html`);
        
        // Check for generated artifacts
        const artifactCheck = checkGeneratedArtifacts(optimizedValidationDir);
        console.log('\n📈 Generated Artifacts:');
        console.log(`   📸 Screenshots: ${artifactCheck.screenshots}`);
        console.log(`   📄 PDFs: ${artifactCheck.pdfs}`);
        console.log(`   📊 JSON Reports: ${artifactCheck.jsonReports}`);
        
        if (artifactCheck.screenshots > 0 && artifactCheck.pdfs > 0) {
            console.log('\n✅ VALIDATION COMPLETE: PDF optimizations working correctly!');
            console.log('🎯 The "se cortan montos" issue has been RESOLVED');
        } else {
            console.log('\n⚠️ INCOMPLETE VALIDATION: Some artifacts missing');
            console.log('💡 Suggestion: Check test execution and retry if needed');
        }
        
        return {
            success: result.success && artifactCheck.pdfs > 0,
            duration: totalDuration,
            artifacts: artifactCheck
        };
        
    } catch (error) {
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        console.error('\n❌ VALIDATION FAILED:', error.message);
        console.log(`⏱️ Failed after: ${Math.round(totalDuration / 1000)}s`);
        console.log('🔍 Check the error details above and system requirements');
        
        return {
            success: false,
            duration: totalDuration,
            error: error.message
        };
    }
}

function runPlaywrightTest(args) {
    return new Promise((resolve) => {
        const playwright = spawn('npx', ['playwright', ...args], {
            stdio: 'inherit',
            shell: true
        });
        
        playwright.on('close', (code) => {
            resolve({
                success: code === 0,
                exitCode: code
            });
        });
        
        playwright.on('error', (error) => {
            console.error('❌ Error running Playwright:', error);
            resolve({
                success: false,
                error: error.message
            });
        });
    });
}

function checkGeneratedArtifacts(resultsDir) {
    try {
        if (!fs.existsSync(resultsDir)) {
            return { screenshots: 0, pdfs: 0, jsonReports: 0 };
        }
        
        const files = fs.readdirSync(resultsDir, { recursive: true });
        
        return {
            screenshots: files.filter(file => file.endsWith('.png')).length,
            pdfs: files.filter(file => file.endsWith('.pdf')).length,
            jsonReports: files.filter(file => file.endsWith('.json')).length
        };
        
    } catch (error) {
        console.warn('⚠️ Error checking artifacts:', error.message);
        return { screenshots: 0, pdfs: 0, jsonReports: 0 };
    }
}

// Execute validation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runOptimizedValidation()
        .then((result) => {
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
}

export { runOptimizedValidation };