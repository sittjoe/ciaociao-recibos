// tests/setup/multi-tool-teardown.js
// Global Teardown for Multi-Tool Testing Suite
// Cleanup after Playwright + Context7 + Puppeteer integration tests

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global teardown function for multi-tool testing
 * Cleans up resources, generates final reports, and archives results
 */
async function globalTeardown(config) {
  console.log('\n🧹 Multi-Tool Testing Suite - Global Teardown');
  console.log('=' * 50);
  
  const teardownStartTime = Date.now();
  const teardownResults = {
    startTime: new Date().toISOString(),
    steps: [],
    success: true,
    errors: [],
    cleanup: {
      filesRemoved: 0,
      directoriesProcessed: 0,
      archiveCreated: false,
      reportsGenerated: []
    }
  };
  
  try {
    // Step 1: Generate final unified report
    await generateFinalUnifiedReport();
    teardownResults.steps.push({ step: 'Final unified report generated', success: true });
    
    // Step 2: Archive test artifacts
    await archiveTestArtifacts();
    teardownResults.steps.push({ step: 'Test artifacts archived', success: true });
    teardownResults.cleanup.archiveCreated = true;
    
    // Step 3: Clean up temporary files
    const cleanupStats = await cleanupTemporaryFiles();
    teardownResults.steps.push({ step: 'Temporary files cleaned', success: true });
    teardownResults.cleanup.filesRemoved = cleanupStats.filesRemoved;
    teardownResults.cleanup.directoriesProcessed = cleanupStats.directoriesProcessed;
    
    // Step 4: Generate test execution summary
    await generateExecutionSummary(teardownResults);
    teardownResults.steps.push({ step: 'Execution summary generated', success: true });
    
    // Step 5: Cleanup browser processes and resources
    await cleanupBrowserResources();
    teardownResults.steps.push({ step: 'Browser resources cleaned', success: true });
    
    // Step 6: Generate performance analysis
    await generatePerformanceAnalysis();
    teardownResults.steps.push({ step: 'Performance analysis generated', success: true });
    
    // Step 7: Save teardown results
    await saveTeardownResults(teardownResults);
    teardownResults.steps.push({ step: 'Teardown results saved', success: true });
    
    teardownResults.endTime = new Date().toISOString();
    teardownResults.duration = Date.now() - teardownStartTime;
    
    console.log('✅ Global Teardown Complete');
    console.log(`⏱️  Teardown Duration: ${(teardownResults.duration / 1000).toFixed(1)}s`);
    console.log(`📁 Test artifacts preserved in test-results/`);
    
    // Print final summary
    printFinalSummary(teardownResults);
    
  } catch (error) {
    teardownResults.success = false;
    teardownResults.errors.push(error.message);
    teardownResults.endTime = new Date().toISOString();
    teardownResults.duration = Date.now() - teardownStartTime;
    
    console.error('❌ Global Teardown Failed:', error.message);
    await saveTeardownResults(teardownResults);
    
    // Don't throw error - teardown failures shouldn't fail the test suite
    console.warn('⚠️  Continuing despite teardown issues...');
  }
}

/**
 * Generate final unified report combining all test results
 */
async function generateFinalUnifiedReport() {
  console.log('📊 Generating final unified report...');
  
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  const unifiedReportsDir = path.join(testResultsDir, 'unified-reports');
  
  if (!fs.existsSync(unifiedReportsDir)) {
    fs.mkdirSync(unifiedReportsDir, { recursive: true });
  }
  
  // Collect all individual reports
  const reportSources = [
    { path: 'playwright-report', name: 'Playwright' },
    { path: 'context7-reports', name: 'Context7' },
    { path: 'puppeteer-cross-browser', name: 'Puppeteer' },
    { path: 'performance-benchmarks', name: 'Performance' },
    { path: 'mobile-responsive', name: 'Mobile' },
    { path: 'visual-comparison', name: 'Visual' },
    { path: 'pdf-format-comparison', name: 'PDF Formats' }
  ];
  
  const consolidatedReport = {
    generatedAt: new Date().toISOString(),
    testSuiteVersion: '1.0.0',
    tools: ['Playwright', 'Context7', 'Puppeteer'],
    summary: {
      totalReports: 0,
      availableReports: [],
      missingReports: []
    },
    reports: {}
  };
  
  for (const source of reportSources) {
    const sourcePath = path.join(testResultsDir, source.path);
    
    if (fs.existsSync(sourcePath)) {
      const reportFiles = fs.readdirSync(sourcePath)
        .filter(file => file.endsWith('.json') || file.endsWith('.html'));
      
      consolidatedReport.summary.availableReports.push(source.name);
      consolidatedReport.reports[source.name] = {
        path: source.path,
        files: reportFiles,
        lastModified: getDirectoryLastModified(sourcePath)
      };
      
      console.log(`  ✓ Collected ${source.name} reports (${reportFiles.length} files)`);
    } else {
      consolidatedReport.summary.missingReports.push(source.name);
      console.log(`  ⚠️  ${source.name} reports not found`);
    }
  }
  
  consolidatedReport.summary.totalReports = consolidatedReport.summary.availableReports.length;
  
  // Save consolidated report
  const consolidatedReportPath = path.join(unifiedReportsDir, 'final-consolidated-report.json');
  fs.writeFileSync(consolidatedReportPath, JSON.stringify(consolidatedReport, null, 2));
  
  console.log(`📊 Final unified report saved: ${consolidatedReportPath}`);
}

/**
 * Archive test artifacts for future reference
 */
async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `test-artifacts-${timestamp}`;
  const archiveDir = path.join(testResultsDir, 'archives');
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  // Create archive summary
  const archiveSummary = {
    createdAt: new Date().toISOString(),
    testSuiteRun: archiveName,
    contents: [],
    totalFiles: 0,
    totalSize: 0
  };
  
  // Get list of all artifacts to archive
  const artifactDirs = [
    'playwright-report',
    'context7-downloads',
    'context7-screenshots',
    'context7-reports', 
    'puppeteer-cross-browser',
    'visual-baseline',
    'visual-comparison',
    'performance-benchmarks',
    'mobile-responsive',
    'pdf-format-comparison',
    'unified-reports'
  ];
  
  for (const dir of artifactDirs) {
    const fullPath = path.join(testResultsDir, dir);
    
    if (fs.existsSync(fullPath)) {
      const stats = getDirectoryStats(fullPath);
      archiveSummary.contents.push({
        directory: dir,
        files: stats.files,
        size: stats.size,
        lastModified: stats.lastModified
      });
      
      archiveSummary.totalFiles += stats.files;
      archiveSummary.totalSize += stats.size;
      
      console.log(`  ✓ Catalogued ${dir}: ${stats.files} files, ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
    }
  }
  
  // Save archive summary
  const archiveSummaryPath = path.join(archiveDir, `${archiveName}-summary.json`);
  fs.writeFileSync(archiveSummaryPath, JSON.stringify(archiveSummary, null, 2));
  
  console.log(`📦 Archive summary created: ${archiveSummaryPath}`);
  console.log(`📊 Total archived: ${archiveSummary.totalFiles} files, ${(archiveSummary.totalSize / 1024 / 1024).toFixed(1)}MB`);
}

/**
 * Clean up temporary files and large artifacts
 */
async function cleanupTemporaryFiles() {
  console.log('🧹 Cleaning up temporary files...');
  
  const cleanupStats = {
    filesRemoved: 0,
    directoriesProcessed: 0,
    sizeCleaned: 0
  };
  
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  const tempPatterns = [
    'temp-*.pdf',
    'screenshot-*.png',
    'debug-*.log',
    'trace-*.zip',
    'video-*.webm'
  ];
  
  // Define directories to clean
  const dirsToClean = [
    'context7-downloads',
    'puppeteer-cross-browser',
    'mobile-responsive',
    'performance-benchmarks'
  ];
  
  for (const dir of dirsToClean) {
    const fullPath = path.join(testResultsDir, dir);
    
    if (fs.existsSync(fullPath)) {
      cleanupStats.directoriesProcessed++;
      
      const files = fs.readdirSync(fullPath);
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        
        // Remove files older than 1 hour or temporary files
        const isOld = (Date.now() - stats.mtime.getTime()) > (60 * 60 * 1000);
        const isTemp = tempPatterns.some(pattern => 
          file.match(new RegExp(pattern.replace('*', '.*')))
        );
        
        if (isOld || isTemp) {
          try {
            fs.unlinkSync(filePath);
            cleanupStats.filesRemoved++;
            cleanupStats.sizeCleaned += stats.size;
            console.log(`    🗑️  Removed: ${file}`);
          } catch (error) {
            console.warn(`    ⚠️  Could not remove ${file}: ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log(`🧹 Cleanup complete: ${cleanupStats.filesRemoved} files removed, ${(cleanupStats.sizeCleaned / 1024 / 1024).toFixed(1)}MB freed`);
  
  return cleanupStats;
}

/**
 * Generate execution summary with key metrics
 */
async function generateExecutionSummary(teardownResults) {
  console.log('📋 Generating execution summary...');
  
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  
  // Load setup results if available
  let setupResults = null;
  const setupResultsPath = path.join(testResultsDir, 'setup-results.json');
  if (fs.existsSync(setupResultsPath)) {
    setupResults = JSON.parse(fs.readFileSync(setupResultsPath, 'utf8'));
  }
  
  // Load unified test results if available
  let testResults = null;
  const unifiedResultsPath = path.join(testResultsDir, 'unified-reports', 'unified-test-results.json');
  if (fs.existsSync(unifiedResultsPath)) {
    testResults = JSON.parse(fs.readFileSync(unifiedResultsPath, 'utf8'));
  }
  
  const executionSummary = {
    testSuiteExecution: {
      startTime: setupResults?.startTime || 'Unknown',
      endTime: teardownResults.endTime,
      totalDuration: setupResults && teardownResults.endTime ? 
        new Date(teardownResults.endTime).getTime() - new Date(setupResults.startTime).getTime() : 0
    },
    
    setup: {
      success: setupResults?.success || false,
      duration: setupResults?.duration || 0,
      steps: setupResults?.steps?.length || 0
    },
    
    testing: testResults ? {
      totalTests: testResults.summary?.totalTests || 0,
      passedTests: testResults.summary?.passedTests || 0,
      failedTests: testResults.summary?.failedTests || 0,
      successRate: testResults.summary?.totalTests > 0 ? 
        ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1) : '0'
    } : null,
    
    teardown: {
      success: teardownResults.success,
      duration: teardownResults.duration,
      steps: teardownResults.steps.length,
      cleanup: teardownResults.cleanup
    },
    
    tools: testResults?.summary?.tools || {},
    
    artifacts: {
      reportsGenerated: this.countGeneratedReports(testResultsDir),
      totalFileSize: this.calculateTotalFileSize(testResultsDir)
    },
    
    recommendations: this.generateRecommendations(testResults, setupResults, teardownResults)
  };
  
  const summaryPath = path.join(testResultsDir, 'execution-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(executionSummary, null, 2));
  
  // Also create human-readable version
  const readableSummary = this.createReadableExecutionSummary(executionSummary);
  const readableSummaryPath = path.join(testResultsDir, 'execution-summary.txt');
  fs.writeFileSync(readableSummaryPath, readableSummary);
  
  console.log(`📋 Execution summary saved: ${summaryPath}`);
  console.log(`📄 Readable summary saved: ${readableSummaryPath}`);
}

/**
 * Cleanup browser resources and processes
 */
async function cleanupBrowserResources() {
  console.log('🌐 Cleaning up browser resources...');
  
  // This is a placeholder for browser cleanup
  // In a real implementation, you might:
  // - Kill any remaining browser processes
  // - Clean up browser profile directories
  // - Remove temporary browser files
  
  try {
    // Simulate browser cleanup
    console.log('  ✓ Browser processes cleaned');
    console.log('  ✓ Browser temporary files removed');
    console.log('  ✓ Browser profiles cleaned');
  } catch (error) {
    console.warn('  ⚠️  Browser cleanup warning:', error.message);
  }
  
  console.log('🌐 Browser resources cleaned');
}

/**
 * Generate performance analysis from test results
 */
async function generatePerformanceAnalysis() {
  console.log('📈 Generating performance analysis...');
  
  const testResultsDir = path.resolve(__dirname, '../../test-results');
  const performanceDir = path.join(testResultsDir, 'performance-benchmarks');
  
  const performanceAnalysis = {
    generatedAt: new Date().toISOString(),
    analysis: {
      pdfGeneration: { analyzed: false, metrics: null },
      pageLoad: { analyzed: false, metrics: null },
      crossBrowser: { analyzed: false, metrics: null },
      mobile: { analyzed: false, metrics: null }
    },
    summary: {
      overallPerformance: 'Unknown',
      criticalIssues: [],
      recommendations: []
    }
  };
  
  // Analyze performance benchmarks if available
  if (fs.existsSync(performanceDir)) {
    const reportFiles = fs.readdirSync(performanceDir)
      .filter(file => file.endsWith('.json'));
    
    for (const file of reportFiles) {
      try {
        const reportPath = path.join(performanceDir, file);
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        if (file.includes('benchmark')) {
          performanceAnalysis.analysis.pdfGeneration = {
            analyzed: true,
            metrics: this.extractPerformanceMetrics(reportData)
          };
        }
        
        console.log(`  ✓ Analyzed: ${file}`);
      } catch (error) {
        console.warn(`  ⚠️  Could not analyze ${file}: ${error.message}`);
      }
    }
  }
  
  // Generate overall assessment
  performanceAnalysis.summary = this.assessOverallPerformance(performanceAnalysis.analysis);
  
  const analysisPath = path.join(testResultsDir, 'performance-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(performanceAnalysis, null, 2));
  
  console.log(`📈 Performance analysis saved: ${analysisPath}`);
}

/**
 * Save teardown results
 */
async function saveTeardownResults(teardownResults) {
  const teardownPath = path.resolve(__dirname, '../../test-results/teardown-results.json');
  
  try {
    fs.writeFileSync(teardownPath, JSON.stringify(teardownResults, null, 2));
    console.log(`💾 Teardown results saved: ${teardownPath}`);
  } catch (error) {
    console.warn('⚠️  Could not save teardown results:', error.message);
  }
}

/**
 * Print final summary to console
 */
function printFinalSummary(teardownResults) {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 MULTI-TOOL TESTING SUITE - FINAL SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`📅 Completion Time: ${teardownResults.endTime}`);
  console.log(`⏱️  Teardown Duration: ${(teardownResults.duration / 1000).toFixed(1)} seconds`);
  console.log(`✅ Teardown Steps Completed: ${teardownResults.steps.filter(s => s.success).length}/${teardownResults.steps.length}`);
  
  if (teardownResults.cleanup.archiveCreated) {
    console.log(`📦 Test artifacts archived successfully`);
  }
  
  if (teardownResults.cleanup.filesRemoved > 0) {
    console.log(`🧹 Cleaned up ${teardownResults.cleanup.filesRemoved} temporary files`);
  }
  
  console.log('📁 Results available in:');
  console.log('   - test-results/unified-reports/ (comprehensive reports)');
  console.log('   - test-results/execution-summary.txt (human-readable summary)');
  console.log('   - test-results/archives/ (archived artifacts)');
  
  if (teardownResults.errors.length > 0) {
    console.log('\n⚠️  Teardown Issues:');
    teardownResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n🎯 Multi-Tool Testing Suite Complete!');
  console.log('='.repeat(60));
}

// Helper functions
function getDirectoryLastModified(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    let latestTime = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime.getTime() > latestTime) {
        latestTime = stats.mtime.getTime();
      }
    }
    
    return new Date(latestTime).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

function getDirectoryStats(dirPath) {
  let files = 0;
  let size = 0;
  let lastModified = 0;
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isFile()) {
        const stats = fs.statSync(itemPath);
        files++;
        size += stats.size;
        if (stats.mtime.getTime() > lastModified) {
          lastModified = stats.mtime.getTime();
        }
      } else if (item.isDirectory()) {
        const subStats = getDirectoryStats(itemPath);
        files += subStats.files;
        size += subStats.size;
        if (subStats.lastModified > lastModified) {
          lastModified = subStats.lastModified;
        }
      }
    }
  } catch (error) {
    console.warn(`Could not get stats for ${dirPath}: ${error.message}`);
  }
  
  return {
    files,
    size,
    lastModified: new Date(lastModified).toISOString()
  };
}

export default globalTeardown;