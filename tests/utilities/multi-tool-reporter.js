// tests/utilities/multi-tool-reporter.js
// Unified Multi-Tool Reporter
// Combines results from Playwright, Context7, and Puppeteer into comprehensive reports

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Multi-Tool Reporter Class
 * Aggregates test results from multiple testing frameworks and generates unified reports
 */
class MultiToolReporter {
  constructor(options = {}) {
    this.config = {
      outputDir: options.outputDir || path.join(__dirname, '../../test-results/unified-reports'),
      includeScreenshots: options.includeScreenshots ?? true,
      includeMetrics: options.includeMetrics ?? true,
      generateHTML: options.generateHTML ?? true,
      generateJSON: options.generateJSON ?? true,
      generateCSV: options.generateCSV ?? true,
      ...options
    };
    
    this.results = {
      summary: {
        startTime: new Date().toISOString(),
        endTime: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        tools: {},
        categories: {}
      },
      playwright: [],
      context7: [],
      puppeteer: [],
      crossBrowser: [],
      performance: [],
      visual: [],
      mobile: [],
      formatComparison: [],
      currency: []
    };
    
    this.ensureOutputDirectory();
  }
  
  ensureOutputDirectory() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }
  
  // Called by Playwright test runner
  onBegin(config, suite) {
    console.log('🚀 Multi-Tool Testing Suite Starting');
    console.log(`📊 Running ${suite.allTests().length} tests across multiple tools`);
    
    this.results.summary.startTime = new Date().toISOString();
    this.results.summary.totalTests = suite.allTests().length;
  }
  
  onTestBegin(test, result) {
    // Track test start
    result._startTime = Date.now();
  }
  
  onTestEnd(test, result) {
    // Calculate duration
    result._duration = Date.now() - (result._startTime || Date.now());
    
    // Categorize test by file path
    const category = this.categorizeTest(test);
    
    // Create test result object
    const testResult = {
      id: test.id,
      title: test.title,
      file: test.location.file,
      category: category,
      status: result.status,
      duration: result._duration,
      startTime: new Date(result._startTime).toISOString(),
      endTime: new Date().toISOString(),
      errors: result.errors,
      attachments: result.attachments,
      steps: result.steps,
      retry: result.retry
    };
    
    // Add to appropriate category
    if (this.results[category]) {
      this.results[category].push(testResult);
    } else {
      this.results.playwright.push(testResult); // Default fallback
    }
    
    // Update summary
    this.updateSummary(testResult);
    
    // Log progress
    const emoji = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
    console.log(`${emoji} ${test.title} (${result._duration}ms) [${category}]`);
  }
  
  onEnd(result) {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = Date.now() - new Date(this.results.summary.startTime).getTime();
    
    console.log('\n📊 Multi-Tool Testing Complete');
    console.log(`⏱️  Total Duration: ${(this.results.summary.duration / 1000).toFixed(1)}s`);
    console.log(`✅ Passed: ${this.results.summary.passedTests}`);
    console.log(`❌ Failed: ${this.results.summary.failedTests}`);
    console.log(`⏭️  Skipped: ${this.results.summary.skippedTests}`);
    
    // Generate all reports
    this.generateUnifiedReports();
  }
  
  categorizeTest(test) {
    const filePath = test.location.file.toLowerCase();
    
    if (filePath.includes('context7')) return 'context7';
    if (filePath.includes('puppeteer')) return 'puppeteer';
    if (filePath.includes('cross-browser')) return 'crossBrowser';
    if (filePath.includes('performance')) return 'performance';
    if (filePath.includes('visual')) return 'visual';
    if (filePath.includes('mobile')) return 'mobile';
    if (filePath.includes('format')) return 'formatComparison';
    if (filePath.includes('currency')) return 'currency';
    
    return 'playwright'; // Default
  }
  
  updateSummary(testResult) {
    const category = testResult.category;
    const tool = this.getToolFromCategory(category);
    
    // Update tool stats
    if (!this.results.summary.tools[tool]) {
      this.results.summary.tools[tool] = { total: 0, passed: 0, failed: 0, skipped: 0 };
    }
    this.results.summary.tools[tool].total++;
    
    // Update category stats
    if (!this.results.summary.categories[category]) {
      this.results.summary.categories[category] = { total: 0, passed: 0, failed: 0, skipped: 0 };
    }
    this.results.summary.categories[category].total++;
    
    // Update counts
    switch (testResult.status) {
      case 'passed':
        this.results.summary.passedTests++;
        this.results.summary.tools[tool].passed++;
        this.results.summary.categories[category].passed++;
        break;
      case 'failed':
        this.results.summary.failedTests++;
        this.results.summary.tools[tool].failed++;
        this.results.summary.categories[category].failed++;
        break;
      case 'skipped':
        this.results.summary.skippedTests++;
        this.results.summary.tools[tool].skipped++;
        this.results.summary.categories[category].skipped++;
        break;
    }
  }
  
  getToolFromCategory(category) {
    const toolMapping = {
      context7: 'Context7',
      puppeteer: 'Puppeteer', 
      crossBrowser: 'Puppeteer',
      performance: 'Playwright',
      visual: 'Playwright',
      mobile: 'Playwright',
      formatComparison: 'Playwright',
      currency: 'Multi-Tool',
      playwright: 'Playwright'
    };
    
    return toolMapping[category] || 'Playwright';
  }
  
  generateUnifiedReports() {
    console.log('\n📄 Generating unified reports...');
    
    try {
      // Generate JSON report
      if (this.config.generateJSON) {
        this.generateJSONReport();
      }
      
      // Generate HTML report  
      if (this.config.generateHTML) {
        this.generateHTMLReport();
      }
      
      // Generate CSV report
      if (this.config.generateCSV) {
        this.generateCSVReport();
      }
      
      // Generate executive summary
      this.generateExecutiveSummary();
      
      // Generate tool-specific reports
      this.generateToolSpecificReports();
      
      // Generate comparison analysis
      this.generateComparisonAnalysis();
      
      console.log(`📁 All reports generated in: ${this.config.outputDir}`);
      
    } catch (error) {
      console.error('❌ Error generating reports:', error);
    }
  }
  
  generateJSONReport() {
    const jsonReport = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'Multi-Tool Reporter v1.0',
        config: this.config
      },
      ...this.results
    };
    
    const jsonPath = path.join(this.config.outputDir, 'unified-test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`  📄 JSON Report: ${jsonPath}`);
  }
  
  generateHTMLReport() {
    const htmlContent = this.createHTMLReport();
    const htmlPath = path.join(this.config.outputDir, 'unified-test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`  🌐 HTML Report: ${htmlPath}`);
  }
  
  generateCSVReport() {
    const csvContent = this.createCSVReport();
    const csvPath = path.join(this.config.outputDir, 'unified-test-results.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`  📊 CSV Report: ${csvPath}`);
  }
  
  generateExecutiveSummary() {
    const summary = this.createExecutiveSummary();
    const summaryPath = path.join(this.config.outputDir, 'executive-summary.txt');
    fs.writeFileSync(summaryPath, summary);
    console.log(`  📋 Executive Summary: ${summaryPath}`);
  }
  
  generateToolSpecificReports() {
    const tools = Object.keys(this.results.summary.tools);
    
    tools.forEach(tool => {
      const report = this.createToolSpecificReport(tool);
      const reportPath = path.join(this.config.outputDir, `${tool.toLowerCase()}-specific-report.txt`);
      fs.writeFileSync(reportPath, report);
      console.log(`  🔧 ${tool} Report: ${reportPath}`);
    });
  }
  
  generateComparisonAnalysis() {
    const analysis = this.createComparisonAnalysis();
    const analysisPath = path.join(this.config.outputDir, 'tool-comparison-analysis.txt');
    fs.writeFileSync(analysisPath, analysis);
    console.log(`  📈 Comparison Analysis: ${analysisPath}`);
  }
  
  createHTMLReport() {
    const successRate = ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIAOCIAO Multi-Tool Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; min-height: 100vh; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; padding: 2rem; background: #f8f9fa; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-card h3 { color: #666; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.5rem; }
        .stat-card .number { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .stat-card .passed .number { color: #28a745; }
        .stat-card .failed .number { color: #dc3545; }
        .stat-card .total .number { color: #007bff; }
        .stat-card .rate .number { color: #6f42c1; }
        .content { padding: 2rem; }
        .section { margin-bottom: 3rem; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .tool-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .tool-card { background: #f8f9fa; border-radius: 8px; padding: 1.5rem; border-left: 4px solid #3498db; }
        .tool-card h3 { color: #2c3e50; margin-bottom: 1rem; }
        .tool-stats { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .tool-stats span { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .category-section { margin-top: 2rem; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .category-item { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 1rem; }
        .category-item h4 { color: #495057; margin-bottom: 0.5rem; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
        .progress-fill { background: #28a745; height: 100%; transition: width 0.3s ease; }
        .test-list { margin-top: 2rem; }
        .test-item { background: white; border: 1px solid #dee2e6; border-radius: 6px; margin-bottom: 0.5rem; padding: 1rem; }
        .test-item.failed { border-left: 4px solid #dc3545; }
        .test-item.passed { border-left: 4px solid #28a745; }
        .test-title { font-weight: bold; margin-bottom: 0.5rem; }
        .test-meta { font-size: 0.9rem; color: #666; }
        .test-error { background: #f8f9fa; border-radius: 4px; padding: 0.5rem; margin-top: 0.5rem; font-family: monospace; font-size: 0.8rem; }
        .footer { background: #2c3e50; color: white; text-align: center; padding: 2rem; margin-top: 2rem; }
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
        .badge.success { background: #28a745; color: white; }
        .badge.warning { background: #ffc107; color: #212529; }
        .badge.danger { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 CIAOCIAO Multi-Tool Test Report</h1>
            <p>Comprehensive Testing Results: Playwright + Context7 + Puppeteer</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card total">
                <h3>Total Tests</h3>
                <div class="number">${this.results.summary.totalTests}</div>
            </div>
            <div class="stat-card passed">
                <h3>Passed</h3>
                <div class="number">${this.results.summary.passedTests}</div>
            </div>
            <div class="stat-card failed">
                <h3>Failed</h3>
                <div class="number">${this.results.summary.failedTests}</div>
            </div>
            <div class="stat-card rate">
                <h3>Success Rate</h3>
                <div class="number">${successRate}%</div>
                <div class="badge ${successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}">
                    ${successRate >= 90 ? 'Excellent' : successRate >= 70 ? 'Good' : 'Needs Work'}
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>🔧 Testing Tools Overview</h2>
                <div class="tool-grid">
                    ${Object.entries(this.results.summary.tools).map(([tool, stats]) => `
                        <div class="tool-card">
                            <h3>${tool}</h3>
                            <div class="tool-stats">
                                <span class="passed">✅ ${stats.passed} passed</span>
                                <span class="failed">❌ ${stats.failed} failed</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((stats.passed / stats.total) * 100).toFixed(1)}%"></div>
                            </div>
                            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Test Categories</h2>
                <div class="category-grid">
                    ${Object.entries(this.results.summary.categories).map(([category, stats]) => `
                        <div class="category-item">
                            <h4>${this.getCategoryDisplayName(category)}</h4>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem;">
                                <span>✅ ${stats.passed}</span>
                                <span>❌ ${stats.failed}</span>
                                <span>📊 ${stats.total}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${((stats.passed / stats.total) * 100).toFixed(1)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${this.results.summary.failedTests > 0 ? `
            <div class="section">
                <h2>❌ Failed Tests</h2>
                <div class="test-list">
                    ${this.getAllFailedTests().map(test => `
                        <div class="test-item failed">
                            <div class="test-title">${test.title}</div>
                            <div class="test-meta">
                                Category: ${this.getCategoryDisplayName(test.category)} | 
                                Duration: ${test.duration}ms | 
                                Tool: ${this.getToolFromCategory(test.category)}
                            </div>
                            ${test.errors && test.errors.length > 0 ? `
                                <div class="test-error">
                                    ${test.errors.map(error => error.message || error).join('<br>')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="section">
                <h2>📈 Performance Insights</h2>
                <div class="tool-grid">
                    ${this.generatePerformanceInsights().map(insight => `
                        <div class="tool-card">
                            <h3>${insight.title}</h3>
                            <p>${insight.description}</p>
                            <div style="margin-top: 1rem;">
                                <strong>${insight.value}</strong>
                                <div class="badge ${insight.status}">${insight.statusText}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🧪 Multi-Tool Testing Suite | CIAOCIAO Recibos System</p>
            <p>Playwright + Context7 + Puppeteer Integration</p>
        </div>
    </div>
</body>
</html>`;
  }
  
  createCSVReport() {
    const headers = ['Test ID', 'Title', 'Category', 'Tool', 'Status', 'Duration (ms)', 'File', 'Start Time', 'End Time', 'Errors'];
    const rows = [headers.join(',')];
    
    // Add all test results
    Object.values(this.results).forEach(categoryResults => {
      if (Array.isArray(categoryResults)) {
        categoryResults.forEach(test => {
          const row = [
            test.id || '',
            `"${test.title || ''}"`,
            test.category || '',
            this.getToolFromCategory(test.category),
            test.status || '',
            test.duration || '',
            `"${test.file || ''}"`,
            test.startTime || '',
            test.endTime || '',
            `"${test.errors ? test.errors.map(e => e.message || e).join('; ') : ''}"`
          ];
          rows.push(row.join(','));
        });
      }
    });
    
    return rows.join('\n');
  }
  
  createExecutiveSummary() {
    const successRate = ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1);
    const duration = (this.results.summary.duration / 1000).toFixed(1);
    
    return `CIAOCIAO RECIBOS - MULTI-TOOL TESTING EXECUTIVE SUMMARY
=======================================================

EXECUTION OVERVIEW:
- Test Suite: Multi-Tool Integration (Playwright + Context7 + Puppeteer)
- Execution Date: ${this.results.summary.startTime}
- Total Duration: ${duration} seconds
- Environment: PDF Generation & Currency Validation System

RESULTS SUMMARY:
- Total Tests Executed: ${this.results.summary.totalTests}
- Passed: ${this.results.summary.passedTests} (${successRate}%)
- Failed: ${this.results.summary.failedTests}
- Skipped: ${this.results.summary.skippedTests}

TOOL PERFORMANCE:
${Object.entries(this.results.summary.tools).map(([tool, stats]) => `
${tool}:
  - Tests: ${stats.total}
  - Passed: ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)
  - Failed: ${stats.failed}
  - Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%
`).join('')}

TEST CATEGORY BREAKDOWN:
${Object.entries(this.results.summary.categories).map(([category, stats]) => `
${this.getCategoryDisplayName(category)}:
  - Tests: ${stats.total}
  - Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%
  - Issues: ${stats.failed > 0 ? `${stats.failed} failed tests` : 'None'}
`).join('')}

QUALITY ASSESSMENT:
${this.generateQualityAssessment()}

CRITICAL ISSUES:
${this.getCriticalIssues()}

RECOMMENDATIONS:
${this.generateRecommendations()}

NEXT STEPS:
${this.generateNextSteps()}
`;
  }
  
  createToolSpecificReport(tool) {
    const toolTests = this.getTestsByTool(tool);
    const toolStats = this.results.summary.tools[tool];
    
    return `${tool.toUpperCase()} SPECIFIC TEST REPORT
${'='.repeat(tool.length + 25)}

TOOL OVERVIEW:
- Total Tests: ${toolStats.total}
- Passed: ${toolStats.passed}
- Failed: ${toolStats.failed}
- Success Rate: ${((toolStats.passed / toolStats.total) * 100).toFixed(1)}%

DETAILED RESULTS:
${toolTests.map(test => `
Test: ${test.title}
- Status: ${test.status.toUpperCase()}
- Duration: ${test.duration}ms
- Category: ${test.category}
${test.status === 'failed' ? `- Errors: ${test.errors?.map(e => e.message || e).join('; ') || 'Unknown error'}` : ''}
`).join('')}

${tool.toUpperCase()} SPECIFIC INSIGHTS:
${this.generateToolInsights(tool, toolTests)}
`;
  }
  
  createComparisonAnalysis() {
    return `MULTI-TOOL COMPARISON ANALYSIS
==============================

TOOL EFFECTIVENESS:
${this.compareToolEffectiveness()}

COVERAGE ANALYSIS:
${this.analyzeCoverage()}

PERFORMANCE COMPARISON:
${this.comparePerformance()}

COMPLEMENTARY STRENGTHS:
${this.analyzeComplementaryStrengths()}

INTEGRATION EFFECTIVENESS:
${this.analyzeIntegrationEffectiveness()}

RECOMMENDATIONS FOR TOOL USAGE:
${this.generateToolUsageRecommendations()}
`;
  }
  
  // Helper methods for report generation
  getCategoryDisplayName(category) {
    const displayNames = {
      context7: 'Context7 PDF Validation',
      puppeteer: 'Puppeteer Cross-Browser',
      crossBrowser: 'Cross-Browser Testing',
      performance: 'Performance Benchmarks',
      visual: 'Visual Regression',
      mobile: 'Mobile Responsive',
      formatComparison: 'PDF Format Comparison',
      currency: 'Currency Validation',
      playwright: 'Playwright Core'
    };
    
    return displayNames[category] || category;
  }
  
  getAllFailedTests() {
    const failedTests = [];
    Object.values(this.results).forEach(categoryResults => {
      if (Array.isArray(categoryResults)) {
        failedTests.push(...categoryResults.filter(test => test.status === 'failed'));
      }
    });
    return failedTests;
  }
  
  getTestsByTool(tool) {
    const tests = [];
    Object.entries(this.results).forEach(([category, categoryResults]) => {
      if (Array.isArray(categoryResults)) {
        const toolTests = categoryResults.filter(test => this.getToolFromCategory(test.category) === tool);
        tests.push(...toolTests);
      }
    });
    return tests;
  }
  
  generatePerformanceInsights() {
    const insights = [];
    
    // Average test duration
    const allTests = this.getAllFailedTests().concat(this.getAllPassedTests());
    const avgDuration = allTests.length > 0 ? allTests.reduce((sum, test) => sum + (test.duration || 0), 0) / allTests.length : 0;
    
    insights.push({
      title: 'Average Test Duration',
      description: 'Mean execution time across all tests',
      value: `${Math.round(avgDuration)}ms`,
      status: avgDuration < 5000 ? 'success' : avgDuration < 10000 ? 'warning' : 'danger',
      statusText: avgDuration < 5000 ? 'Fast' : avgDuration < 10000 ? 'Moderate' : 'Slow'
    });
    
    // Tool distribution
    const toolCount = Object.keys(this.results.summary.tools).length;
    insights.push({
      title: 'Testing Tool Coverage',
      description: 'Number of different testing tools utilized',
      value: `${toolCount} Tools`,
      status: toolCount >= 3 ? 'success' : toolCount >= 2 ? 'warning' : 'danger',
      statusText: toolCount >= 3 ? 'Comprehensive' : toolCount >= 2 ? 'Good' : 'Limited'
    });
    
    return insights;
  }
  
  getAllPassedTests() {
    const passedTests = [];
    Object.values(this.results).forEach(categoryResults => {
      if (Array.isArray(categoryResults)) {
        passedTests.push(...categoryResults.filter(test => test.status === 'passed'));
      }
    });
    return passedTests;
  }
  
  generateQualityAssessment() {
    const successRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;
    
    if (successRate >= 95) {
      return '🏆 EXCELLENT - System demonstrates exceptional quality and reliability across all testing tools.';
    } else if (successRate >= 85) {
      return '✅ GOOD - System shows strong performance with minor issues that should be addressed.';
    } else if (successRate >= 70) {
      return '⚠️  ACCEPTABLE - System functions adequately but requires improvement in several areas.';
    } else {
      return '❌ NEEDS IMPROVEMENT - System has significant issues that must be resolved before production.';
    }
  }
  
  getCriticalIssues() {
    const failedTests = this.getAllFailedTests();
    const criticalIssues = [];
    
    // Look for currency-related failures
    const currencyFailures = failedTests.filter(test => 
      test.category === 'currency' || test.title.toLowerCase().includes('currency')
    );
    
    if (currencyFailures.length > 0) {
      criticalIssues.push(`Currency Formatting: ${currencyFailures.length} tests failed - This affects core business functionality`);
    }
    
    // Look for PDF generation failures
    const pdfFailures = failedTests.filter(test => 
      test.title.toLowerCase().includes('pdf') || test.category === 'context7'
    );
    
    if (pdfFailures.length > 0) {
      criticalIssues.push(`PDF Generation: ${pdfFailures.length} tests failed - This affects document delivery`);
    }
    
    // Look for mobile failures
    const mobileFailures = failedTests.filter(test => test.category === 'mobile');
    
    if (mobileFailures.length > 0) {
      criticalIssues.push(`Mobile Compatibility: ${mobileFailures.length} tests failed - This affects user accessibility`);
    }
    
    return criticalIssues.length > 0 ? criticalIssues.join('\n- ') : 'No critical issues identified.';
  }
  
  generateRecommendations() {
    const recommendations = [];
    const successRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;
    
    if (successRate < 90) {
      recommendations.push('Focus on resolving failed tests before production deployment');
    }
    
    const failedTests = this.getAllFailedTests();
    const currencyFailures = failedTests.filter(test => test.category === 'currency');
    
    if (currencyFailures.length > 0) {
      recommendations.push('Priority: Fix currency formatting issues as they affect core business logic');
    }
    
    const mobileFailures = failedTests.filter(test => test.category === 'mobile');
    if (mobileFailures.length > 0) {
      recommendations.push('Improve mobile responsive design for better user experience');
    }
    
    recommendations.push('Continue multi-tool testing approach for comprehensive coverage');
    recommendations.push('Consider automated regression testing for critical user workflows');
    
    return recommendations.join('\n- ');
  }
  
  generateNextSteps() {
    return `1. Address all failed tests, prioritizing currency and PDF generation issues
2. Implement automated testing in CI/CD pipeline  
3. Schedule regular cross-browser compatibility testing
4. Monitor mobile user experience metrics
5. Establish performance benchmarks and alerting
6. Plan for visual regression testing in future releases`;
  }
  
  compareToolEffectiveness() {
    return Object.entries(this.results.summary.tools)
      .map(([tool, stats]) => {
        const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
        const effectiveness = successRate >= 90 ? 'Highly Effective' : successRate >= 75 ? 'Effective' : 'Needs Improvement';
        return `${tool}: ${successRate}% success rate - ${effectiveness}`;
      })
      .join('\n');
  }
  
  analyzeCoverage() {
    const categories = Object.keys(this.results.summary.categories);
    return `Testing covers ${categories.length} major areas: ${categories.map(c => this.getCategoryDisplayName(c)).join(', ')}`;
  }
  
  comparePerformance() {
    const allTests = this.getAllFailedTests().concat(this.getAllPassedTests());
    const avgDuration = allTests.length > 0 ? allTests.reduce((sum, test) => sum + (test.duration || 0), 0) / allTests.length : 0;
    
    return `Average test execution time: ${Math.round(avgDuration)}ms
Performance classification: ${avgDuration < 5000 ? 'Fast' : avgDuration < 10000 ? 'Moderate' : 'Slow'}`;
  }
  
  analyzeComplementaryStrengths() {
    return `- Playwright: Excellent for modern web automation and cross-browser testing
- Context7: Specialized for PDF validation and content verification  
- Puppeteer: Strong for Chrome-specific testing and mobile simulation
- Combined: Comprehensive coverage of all user scenarios`;
  }
  
  analyzeIntegrationEffectiveness() {
    const totalTools = Object.keys(this.results.summary.tools).length;
    const overallSuccessRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;
    
    return `Multi-tool integration shows ${overallSuccessRate.toFixed(1)}% overall success rate across ${totalTools} tools.
Integration benefits: Broader test coverage, tool-specific strengths utilized, comprehensive validation.`;
  }
  
  generateToolUsageRecommendations() {
    return `- Use Playwright for primary web automation and performance testing
- Leverage Context7 for specialized PDF validation scenarios
- Deploy Puppeteer for Chrome-specific features and mobile testing
- Maintain multi-tool approach for critical business workflows
- Consider tool-specific CI/CD pipelines for optimized execution`;
  }
  
  generateToolInsights(tool, tests) {
    const avgDuration = tests.reduce((sum, test) => sum + (test.duration || 0), 0) / tests.length;
    const categories = [...new Set(tests.map(test => test.category))];
    
    return `Average execution time: ${Math.round(avgDuration)}ms
Test categories covered: ${categories.join(', ')}
Recommended for: ${this.getToolRecommendations(tool)}`;
  }
  
  getToolRecommendations(tool) {
    const recommendations = {
      'Playwright': 'Cross-browser testing, visual regression, performance benchmarks',
      'Context7': 'PDF validation, document generation, content verification', 
      'Puppeteer': 'Chrome-specific testing, mobile simulation, advanced automation',
      'Multi-Tool': 'Comprehensive validation, critical workflow testing'
    };
    
    return recommendations[tool] || 'General purpose testing';
  }
}

export default MultiToolReporter;