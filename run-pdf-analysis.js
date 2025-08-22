#!/usr/bin/env node

// run-pdf-analysis.js
// Comprehensive PDF Analysis Runner
// Context7 Framework Integration Script

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PDFAnalysisRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      testSuites: [],
      summary: {},
      recommendations: []
    };
  }

  async runComprehensiveAnalysis() {
    console.log('🔬 Starting Comprehensive PDF Analysis with Context7 Framework');
    console.log('=============================================================\n');

    // Ensure test directories exist
    this.ensureDirectories();

    // Run test suites in sequence
    const testSuites = [
      {
        name: 'Context7 PDF Diagnosis',
        command: 'npx playwright test tests/context7/pdf-multipage-diagnosis.spec.js',
        description: 'Context7 framework comprehensive PDF analysis'
      },
      {
        name: 'Advanced PDF Analysis', 
        command: 'npx playwright test tests/advanced-tests/comprehensive-pdf-analysis.spec.js',
        description: 'Root cause investigation and scaling validation'
      },
      {
        name: 'Existing PDF Validation',
        command: 'npx playwright test tests/pdf-validation.spec.js', 
        description: 'Standard PDF validation tests'
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running: ${suite.name}`);
      console.log(`📝 Description: ${suite.description}`);
      console.log(`⚙️  Command: ${suite.command}\n`);

      const result = await this.runTestSuite(suite);
      this.results.testSuites.push(result);

      if (result.success) {
        console.log(`✅ ${suite.name} completed successfully`);
      } else {
        console.log(`❌ ${suite.name} failed`);
        console.log(`Error: ${result.error}`);
      }
    }

    // Generate final analysis
    await this.generateFinalAnalysis();
  }

  ensureDirectories() {
    const directories = [
      './test-results',
      './test-results/context7-downloads',
      './test-results/context7-screenshots', 
      './test-results/context7-reports',
      './test-results/comprehensive-analysis',
      './test-results/scaling-tests',
      './test-results/root-cause-reports'
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  runTestSuite(suite) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('npx', ['playwright', 'test', suite.command.split(' ').slice(2).join(' ')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Real-time error output
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        resolve({
          suite: suite.name,
          command: suite.command,
          success: code === 0,
          exitCode: code,
          duration,
          stdout,
          stderr,
          error: code !== 0 ? stderr : null
        });
      });
    });
  }

  async generateFinalAnalysis() {
    const duration = Date.now() - this.startTime;
    
    this.results.summary = {
      totalDuration: duration,
      successfulSuites: this.results.testSuites.filter(s => s.success).length,
      failedSuites: this.results.testSuites.filter(s => !s.success).length,
      totalSuites: this.results.testSuites.length
    };

    // Analyze results for recommendations
    this.generateRecommendations();

    // Save comprehensive report
    const reportPath = `./test-results/comprehensive-analysis-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = `./test-results/comprehensive-analysis-${Date.now()}.html`;
    fs.writeFileSync(htmlPath, htmlReport);

    console.log('\n=============================================================');
    console.log('🎯 COMPREHENSIVE PDF ANALYSIS COMPLETE');
    console.log('=============================================================');
    console.log(`⏱️  Total Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`✅ Successful Test Suites: ${this.results.summary.successfulSuites}/${this.results.summary.totalSuites}`);
    console.log(`❌ Failed Test Suites: ${this.results.summary.failedSuites}/${this.results.summary.totalSuites}`);
    console.log(`📊 JSON Report: ${reportPath}`);
    console.log(`🌐 HTML Report: ${htmlPath}`);
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      this.results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority}] ${rec.title}`);
        console.log(`   ${rec.description}`);
      });
    }

    console.log('\n=============================================================\n');

    return {
      reportPath,
      htmlPath,
      summary: this.results.summary
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for test failures
    const failedSuites = this.results.testSuites.filter(s => !s.success);
    if (failedSuites.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Resolve Test Suite Failures',
        description: `${failedSuites.length} test suite(s) failed. Review errors and fix issues.`,
        details: failedSuites.map(s => ({ suite: s.suite, error: s.error }))
      });
    }

    // Check for long-running tests
    const slowSuites = this.results.testSuites.filter(s => s.duration > 300000); // 5 minutes
    if (slowSuites.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Optimize Test Performance',
        description: `${slowSuites.length} test suite(s) took longer than 5 minutes to complete.`,
        details: slowSuites.map(s => ({ suite: s.suite, duration: `${(s.duration / 1000).toFixed(1)}s` }))
      });
    }

    // Check for PDF analysis specific recommendations
    const hasContext7Results = this.results.testSuites.some(s => s.suite.includes('Context7'));
    if (hasContext7Results) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Review Context7 PDF Analysis Results',
        description: 'Context7 framework has completed comprehensive PDF analysis. Review detailed reports for scaling recommendations.',
        action: 'Check ./test-results/context7-reports/ for detailed analysis'
      });
    }

    // General recommendations
    if (this.results.summary.successfulSuites === this.results.summary.totalSuites) {
      recommendations.push({
        priority: 'INFO',
        title: 'All Tests Passed Successfully',
        description: 'Comprehensive PDF analysis completed without critical issues. Review detailed reports for optimization opportunities.',
        action: 'Implement recommended scaling improvements from Context7 analysis'
      });
    }

    this.results.recommendations = recommendations;
  }

  generateHTMLReport() {
    const { summary, testSuites, recommendations } = this.results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive PDF Analysis Report - Context7 Framework</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 { color: #667eea; margin-bottom: 10px; }
        .summary-card .value { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .summary-card .label { color: #666; font-size: 0.9rem; }
        .success .value { color: #27ae60; }
        .warning .value { color: #f39c12; }
        .error .value { color: #e74c3c; }
        .section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-suite {
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid;
            border-radius: 5px;
        }
        .test-suite.success {
            background: #d4edda;
            border-color: #27ae60;
        }
        .test-suite.failure {
            background: #f8d7da;
            border-color: #e74c3c;
        }
        .test-suite h3 { margin-bottom: 10px; }
        .test-suite .meta {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 10px;
        }
        .test-suite .error {
            background: #fff;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.8rem;
            color: #e74c3c;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        .recommendation {
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid;
            border-radius: 5px;
        }
        .recommendation.high {
            background: #fee2e2;
            border-color: #dc2626;
        }
        .recommendation.medium {
            background: #fef3c7;
            border-color: #d97706;
        }
        .recommendation.info {
            background: #ecfdf5;
            border-color: #059669;
        }
        .recommendation h3 { margin-bottom: 10px; }
        .timestamp {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 Comprehensive PDF Analysis</h1>
            <p>Context7 Framework - Multi-Page Issue Investigation</p>
        </div>

        <div class="summary">
            <div class="summary-card ${summary.successfulSuites === summary.totalSuites ? 'success' : 'warning'}">
                <div class="value">${summary.successfulSuites}/${summary.totalSuites}</div>
                <div class="label">Test Suites Passed</div>
            </div>
            <div class="summary-card">
                <div class="value">${(summary.totalDuration / 1000 / 60).toFixed(1)}m</div>
                <div class="label">Total Duration</div>
            </div>
            <div class="summary-card ${summary.failedSuites === 0 ? 'success' : 'error'}">
                <div class="value">${summary.failedSuites}</div>
                <div class="label">Failed Suites</div>
            </div>
            <div class="summary-card">
                <div class="value">${recommendations.length}</div>
                <div class="label">Recommendations</div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Test Suite Results</h2>
            ${testSuites.map(suite => `
                <div class="test-suite ${suite.success ? 'success' : 'failure'}">
                    <h3>${suite.success ? '✅' : '❌'} ${suite.suite}</h3>
                    <div class="meta">
                        Duration: ${(suite.duration / 1000).toFixed(1)}s | 
                        Exit Code: ${suite.exitCode} |
                        Command: ${suite.command}
                    </div>
                    ${suite.error ? `<div class="error">${suite.error}</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <h3>[${rec.priority}] ${rec.title}</h3>
                    <p>${rec.description}</p>
                    ${rec.action ? `<p><strong>Action:</strong> ${rec.action}</p>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="timestamp">
            Report generated on ${new Date().toLocaleString()} by Context7 PDF Analysis Framework
        </div>
    </div>
</body>
</html>`;
  }
}

// Main execution
async function main() {
  const runner = new PDFAnalysisRunner();
  
  try {
    await runner.runComprehensiveAnalysis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PDFAnalysisRunner };