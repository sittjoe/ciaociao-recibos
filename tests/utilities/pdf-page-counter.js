// tests/utilities/pdf-page-counter.js
// Advanced PDF Page Count Analysis and Validation

import fs from 'fs';
import path from 'path';

export class PDFPageCounter {
  constructor() {
    this.analysisResults = [];
  }

  /**
   * Analyzes PDF file structure and counts pages
   * @param {string} pdfPath - Path to PDF file
   * @returns {Object} Analysis results
   */
  async analyzePDFStructure(pdfPath) {
    const analysis = {
      filePath: pdfPath,
      timestamp: new Date().toISOString(),
      fileExists: false,
      fileSize: 0,
      pageCount: 0,
      structure: {},
      issues: [],
      recommendations: []
    };

    try {
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        analysis.issues.push({
          type: 'ERROR',
          message: `PDF file not found: ${pdfPath}`
        });
        return analysis;
      }

      analysis.fileExists = true;
      const stats = fs.statSync(pdfPath);
      analysis.fileSize = stats.size;

      // Read PDF content as buffer
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Basic PDF structure analysis
      analysis.structure = this.analyzePDFBuffer(pdfBuffer);
      analysis.pageCount = this.countPagesInBuffer(pdfBuffer);

      // Validate page count
      if (analysis.pageCount > 1) {
        analysis.issues.push({
          type: 'ERROR',
          category: 'PAGE_COUNT',
          message: `PDF contains ${analysis.pageCount} pages instead of 1`,
          requirement: 'Single page PDF required'
        });

        analysis.recommendations.push({
          priority: 'HIGH',
          action: 'Implement better content scaling',
          description: 'Content should be scaled to fit on single page'
        });
      }

      // File size analysis
      if (analysis.fileSize > 10000000) { // 10MB
        analysis.issues.push({
          type: 'WARNING',
          category: 'FILE_SIZE',
          message: `PDF file is large: ${(analysis.fileSize / 1024 / 1024).toFixed(2)}MB`,
          suggestion: 'Consider image compression or content optimization'
        });
      }

      if (analysis.fileSize < 5000) { // 5KB
        analysis.issues.push({
          type: 'WARNING',
          category: 'FILE_SIZE',
          message: `PDF file is very small: ${analysis.fileSize} bytes`,
          suggestion: 'May indicate content generation issues'
        });
      }

      this.analysisResults.push(analysis);
      return analysis;

    } catch (error) {
      analysis.issues.push({
        type: 'ERROR',
        category: 'ANALYSIS_ERROR',
        message: `Failed to analyze PDF: ${error.message}`
      });
      return analysis;
    }
  }

  /**
   * Analyzes PDF buffer structure
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Object} Structure analysis
   */
  analyzePDFBuffer(buffer) {
    const structure = {
      version: null,
      hasXref: false,
      hasTrailer: false,
      objectCount: 0,
      streamCount: 0,
      imageCount: 0,
      fontCount: 0
    };

    try {
      const content = buffer.toString('latin1');

      // Extract PDF version
      const versionMatch = content.match(/%PDF-(\d\.\d)/);
      if (versionMatch) {
        structure.version = versionMatch[1];
      }

      // Check for xref table
      structure.hasXref = content.includes('xref');

      // Check for trailer
      structure.hasTrailer = content.includes('trailer');

      // Count objects
      const objectMatches = content.match(/\d+ \d+ obj/g);
      structure.objectCount = objectMatches ? objectMatches.length : 0;

      // Count streams
      const streamMatches = content.match(/stream\s/g);
      structure.streamCount = streamMatches ? streamMatches.length : 0;

      // Count images (approximate)
      const imageMatches = content.match(/\/Image|\/DCTDecode|\/JPXDecode|\/CCITTFaxDecode/g);
      structure.imageCount = imageMatches ? imageMatches.length : 0;

      // Count fonts (approximate)
      const fontMatches = content.match(/\/Font|\/Type1|\/TrueType|\/Type0/g);
      structure.fontCount = fontMatches ? fontMatches.length : 0;

    } catch (error) {
      console.warn('Error analyzing PDF structure:', error.message);
    }

    return structure;
  }

  /**
   * Counts pages in PDF buffer
   * @param {Buffer} buffer - PDF file buffer
   * @returns {number} Page count
   */
  countPagesInBuffer(buffer) {
    try {
      const content = buffer.toString('latin1');

      // Method 1: Count /Type /Page objects
      const pageTypeMatches = content.match(/\/Type\s*\/Page[^s]/g);
      if (pageTypeMatches && pageTypeMatches.length > 0) {
        return pageTypeMatches.length;
      }

      // Method 2: Look for /Count in /Pages object
      const pagesCountMatch = content.match(/\/Pages.*?\/Count\s+(\d+)/s);
      if (pagesCountMatch) {
        return parseInt(pagesCountMatch[1], 10);
      }

      // Method 3: Count page break markers
      const pageBreakMatches = content.match(/\/Page\s/g);
      if (pageBreakMatches) {
        return Math.max(1, pageBreakMatches.length);
      }

      // Method 4: Look for showpage or similar commands
      const showPageMatches = content.match(/showpage|Q\s+Q/g);
      if (showPageMatches && showPageMatches.length > 0) {
        return showPageMatches.length;
      }

      // Default: assume 1 page if no clear indicators
      return 1;

    } catch (error) {
      console.warn('Error counting pages:', error.message);
      return -1; // Indicate counting failed
    }
  }

  /**
   * Validates multiple PDFs and generates comparison report
   * @param {Array} pdfPaths - Array of PDF file paths
   * @returns {Object} Comparison report
   */
  async validateMultiplePDFs(pdfPaths) {
    const results = [];
    
    for (const pdfPath of pdfPaths) {
      const analysis = await this.analyzePDFStructure(pdfPath);
      results.push(analysis);
    }

    const report = {
      totalPDFs: results.length,
      singlePagePDFs: results.filter(r => r.pageCount === 1).length,
      multiPagePDFs: results.filter(r => r.pageCount > 1).length,
      failedAnalysis: results.filter(r => r.pageCount === -1).length,
      averageFileSize: results.reduce((sum, r) => sum + r.fileSize, 0) / results.length,
      issues: [],
      recommendations: [],
      details: results
    };

    // Analyze common issues
    const multiPagePDFs = results.filter(r => r.pageCount > 1);
    if (multiPagePDFs.length > 0) {
      report.issues.push({
        type: 'CRITICAL',
        category: 'MULTI_PAGE',
        count: multiPagePDFs.length,
        message: `${multiPagePDFs.length} PDFs contain multiple pages`,
        details: multiPagePDFs.map(pdf => ({
          file: path.basename(pdf.filePath),
          pages: pdf.pageCount
        }))
      });

      report.recommendations.push({
        priority: 'HIGH',
        title: 'Fix Multi-Page Generation',
        description: 'Multiple PDFs are generating with more than one page',
        actions: [
          'Review scaling algorithm implementation',
          'Test with different content sizes',
          'Implement more aggressive content compression',
          'Add page size constraints validation'
        ]
      });
    }

    // File size analysis
    const largePDFs = results.filter(r => r.fileSize > 5000000); // 5MB
    if (largePDFs.length > 0) {
      report.issues.push({
        type: 'WARNING',
        category: 'FILE_SIZE',
        count: largePDFs.length,
        message: `${largePDFs.length} PDFs are larger than 5MB`,
        details: largePDFs.map(pdf => ({
          file: path.basename(pdf.filePath),
          size: `${(pdf.fileSize / 1024 / 1024).toFixed(2)}MB`
        }))
      });

      report.recommendations.push({
        priority: 'MEDIUM',
        title: 'Optimize File Sizes',
        description: 'Some PDFs are larger than optimal',
        actions: [
          'Implement image compression',
          'Reduce PDF quality settings if appropriate',
          'Optimize font embedding'
        ]
      });
    }

    return report;
  }

  /**
   * Monitors PDF generation in real-time
   * @param {string} watchDirectory - Directory to monitor
   * @param {Function} callback - Callback for new PDF files
   */
  startPDFMonitoring(watchDirectory, callback) {
    if (!fs.existsSync(watchDirectory)) {
      throw new Error(`Watch directory does not exist: ${watchDirectory}`);
    }

    const chokidar = require('chokidar');
    const watcher = chokidar.watch(path.join(watchDirectory, '*.pdf'), {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher
      .on('add', async (filePath) => {
        console.log(`New PDF detected: ${filePath}`);
        
        // Wait a moment for file to be fully written
        setTimeout(async () => {
          try {
            const analysis = await this.analyzePDFStructure(filePath);
            if (callback) {
              callback(analysis);
            }
          } catch (error) {
            console.error(`Error analyzing new PDF ${filePath}:`, error);
          }
        }, 1000);
      })
      .on('error', error => {
        console.error('PDF monitoring error:', error);
      });

    return watcher;
  }

  /**
   * Generates detailed analysis report
   * @returns {Object} Comprehensive analysis report
   */
  generateAnalysisReport() {
    const report = {
      summary: {
        totalAnalyses: this.analysisResults.length,
        singlePageCount: this.analysisResults.filter(r => r.pageCount === 1).length,
        multiPageCount: this.analysisResults.filter(r => r.pageCount > 1).length,
        averageFileSize: this.analysisResults.reduce((sum, r) => sum + r.fileSize, 0) / this.analysisResults.length,
        successRate: this.analysisResults.filter(r => r.pageCount === 1).length / this.analysisResults.length
      },
      trends: this.analyzeTrends(),
      commonIssues: this.analyzeCommonIssues(),
      recommendations: this.generateRecommendations(),
      details: this.analysisResults
    };

    return report;
  }

  /**
   * Analyzes trends in PDF generation
   */
  analyzeTrends() {
    if (this.analysisResults.length < 2) {
      return { insufficient_data: true };
    }

    const sortedResults = this.analysisResults
      .slice()
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const trends = {
      pageCountTrend: this.calculateTrend(sortedResults.map(r => r.pageCount)),
      fileSizeTrend: this.calculateTrend(sortedResults.map(r => r.fileSize)),
      errorRate: sortedResults.filter(r => r.issues.some(i => i.type === 'ERROR')).length / sortedResults.length,
      improvement: false
    };

    // Check if recent results are better
    const recent = sortedResults.slice(-3);
    const older = sortedResults.slice(0, -3);
    
    if (recent.length > 0 && older.length > 0) {
      const recentSinglePageRate = recent.filter(r => r.pageCount === 1).length / recent.length;
      const olderSinglePageRate = older.filter(r => r.pageCount === 1).length / older.length;
      trends.improvement = recentSinglePageRate > olderSinglePageRate;
    }

    return trends;
  }

  /**
   * Calculates trend for numeric data
   */
  calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const first = data.slice(0, Math.floor(data.length / 2));
    const second = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
    const secondAvg = second.reduce((sum, val) => sum + val, 0) / second.length;
    
    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyzes common issues across all analyses
   */
  analyzeCommonIssues() {
    const issueFrequency = {};
    
    this.analysisResults.forEach(result => {
      result.issues.forEach(issue => {
        const key = `${issue.type}_${issue.category || 'GENERAL'}`;
        issueFrequency[key] = (issueFrequency[key] || 0) + 1;
      });
    });

    return Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({
        issue: key,
        frequency: count,
        percentage: (count / this.analysisResults.length * 100).toFixed(1)
      }));
  }

  /**
   * Generates recommendations based on analysis
   */
  generateRecommendations() {
    const recommendations = [];
    const commonIssues = this.analyzeCommonIssues();

    commonIssues.forEach(issue => {
      if (issue.issue.includes('PAGE_COUNT') && issue.frequency > this.analysisResults.length * 0.3) {
        recommendations.push({
          priority: 'CRITICAL',
          title: 'Fix Multi-Page PDF Generation',
          description: `${issue.percentage}% of PDFs are generating multiple pages`,
          actions: [
            'Review and improve scaling algorithm',
            'Add content size validation',
            'Implement automatic content compression',
            'Test with various content lengths'
          ]
        });
      }

      if (issue.issue.includes('FILE_SIZE') && issue.frequency > this.analysisResults.length * 0.2) {
        recommendations.push({
          priority: 'MEDIUM',
          title: 'Optimize PDF File Sizes',
          description: `${issue.percentage}% of PDFs have size-related issues`,
          actions: [
            'Implement image compression',
            'Optimize PDF generation settings',
            'Review content inclusion policies'
          ]
        });
      }
    });

    // Success rate recommendations
    const successRate = this.analysisResults.filter(r => r.pageCount === 1).length / this.analysisResults.length;
    if (successRate < 0.8) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Improve Single-Page Success Rate',
        description: `Only ${(successRate * 100).toFixed(1)}% of PDFs are single-page`,
        actions: [
          'Implement comprehensive scaling testing',
          'Add preview validation before PDF generation',
          'Create content size guidelines'
        ]
      });
    }

    return recommendations;
  }
}

export default PDFPageCounter;