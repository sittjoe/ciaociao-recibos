// tests/pdf-debugging/canvas-analyzer.js
// Advanced Canvas Analysis and Scaling Debug Utilities

export class CanvasAnalyzer {
  constructor() {
    this.analysisHistory = [];
    this.debugMode = true;
    this.thresholds = {
      minCanvasSize: 100,
      maxCanvasSize: 10000,
      aspectRatioTolerance: 0.1,
      scalingFactorWarning: 0.3,
      renderTimeWarning: 5000
    };
  }

  /**
   * Comprehensive canvas analysis for PDF debugging
   */
  async analyzeCanvasBeforePDF(page, testId) {
    const analysis = {
      testId,
      timestamp: new Date().toISOString(),
      canvases: [],
      dimensions: {},
      scaling: {},
      rendering: {},
      issues: [],
      recommendations: []
    };

    try {
      // Execute comprehensive canvas analysis in browser context
      const canvasData = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll('canvas'));
        const viewportInfo = {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight
        };

        const canvasAnalysis = canvases.map((canvas, index) => {
          const rect = canvas.getBoundingClientRect();
          const context = canvas.getContext('2d');
          
          return {
            index,
            id: canvas.id || `canvas-${index}`,
            class: canvas.className,
            // Physical canvas dimensions
            width: canvas.width,
            height: canvas.height,
            // CSS dimensions
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
            offsetWidth: canvas.offsetWidth,
            offsetHeight: canvas.offsetHeight,
            // Position and visibility
            boundingRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              right: rect.right,
              bottom: rect.bottom
            },
            // Style information
            computedStyle: {
              width: getComputedStyle(canvas).width,
              height: getComputedStyle(canvas).height,
              display: getComputedStyle(canvas).display,
              visibility: getComputedStyle(canvas).visibility,
              transform: getComputedStyle(canvas).transform,
              position: getComputedStyle(canvas).position
            },
            // Canvas context info
            contextType: context ? '2d' : 'unknown',
            isVisible: rect.width > 0 && rect.height > 0 && 
                      getComputedStyle(canvas).visibility !== 'hidden' &&
                      getComputedStyle(canvas).display !== 'none',
            // Parent container info
            parentContainer: canvas.parentElement ? {
              tag: canvas.parentElement.tagName,
              id: canvas.parentElement.id,
              className: canvas.parentElement.className,
              clientWidth: canvas.parentElement.clientWidth,
              clientHeight: canvas.parentElement.clientHeight
            } : null
          };
        });

        // Look for any scaling-related variables or functions
        const scalingInfo = {
          windowScaling: window.scalingDebug || null,
          jsPDFInstance: window.jsPDF ? 'available' : 'not found',
          html2canvasInstance: window.html2canvas ? 'available' : 'not found',
          scalingFunctions: []
        };

        // Try to find scaling-related functions
        const globalProps = Object.getOwnPropertyNames(window);
        scalingFunctions = globalProps.filter(prop => 
          prop.toLowerCase().includes('scale') || 
          prop.toLowerCase().includes('pdf') ||
          prop.toLowerCase().includes('canvas')
        );

        return {
          viewport: viewportInfo,
          canvases: canvasAnalysis,
          scaling: scalingInfo,
          timestamp: Date.now()
        };
      });

      analysis.canvases = canvasData.canvases;
      analysis.dimensions = canvasData.viewport;
      analysis.scaling = canvasData.scaling;

      // Analyze each canvas
      canvasData.canvases.forEach((canvas, index) => {
        this.analyzeIndividualCanvas(canvas, analysis, index);
      });

      // Global analysis
      this.performGlobalCanvasAnalysis(canvasData, analysis);

      // Store analysis for historical comparison
      this.analysisHistory.push(analysis);

      // Log detailed analysis if debug mode
      if (this.debugMode) {
        this.logDetailedAnalysis(analysis);
      }

      return analysis;

    } catch (error) {
      analysis.issues.push({
        type: 'ERROR',
        category: 'ANALYSIS_FAILED',
        message: `Canvas analysis failed: ${error.message}`,
        stack: error.stack
      });
      return analysis;
    }
  }

  /**
   * Analyze individual canvas for issues
   */
  analyzeIndividualCanvas(canvas, analysis, index) {
    const canvasId = `Canvas ${index} (${canvas.id || 'no-id'})`;

    // Check canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      analysis.issues.push({
        type: 'ERROR',
        category: 'ZERO_DIMENSIONS',
        canvas: canvasId,
        message: `Canvas has zero dimensions: ${canvas.width}x${canvas.height}`
      });
    }

    if (canvas.width < this.thresholds.minCanvasSize || canvas.height < this.thresholds.minCanvasSize) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'SMALL_CANVAS',
        canvas: canvasId,
        message: `Canvas is very small: ${canvas.width}x${canvas.height}`,
        suggestion: 'May result in low-quality PDF output'
      });
    }

    if (canvas.width > this.thresholds.maxCanvasSize || canvas.height > this.thresholds.maxCanvasSize) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'LARGE_CANVAS',
        canvas: canvasId,
        message: `Canvas is very large: ${canvas.width}x${canvas.height}`,
        suggestion: 'May cause performance issues or memory problems'
      });
    }

    // Check for dimension mismatches
    const widthMismatch = Math.abs(canvas.width - canvas.clientWidth) > 10;
    const heightMismatch = Math.abs(canvas.height - canvas.clientHeight) > 10;

    if (widthMismatch || heightMismatch) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'DIMENSION_MISMATCH',
        canvas: canvasId,
        message: `Canvas dimension mismatch - Physical: ${canvas.width}x${canvas.height}, Display: ${canvas.clientWidth}x${canvas.clientHeight}`,
        details: {
          physicalDimensions: { width: canvas.width, height: canvas.height },
          displayDimensions: { width: canvas.clientWidth, height: canvas.clientHeight },
          widthDifference: canvas.width - canvas.clientWidth,
          heightDifference: canvas.height - canvas.clientHeight
        }
      });
    }

    // Check visibility
    if (!canvas.isVisible) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'INVISIBLE_CANVAS',
        canvas: canvasId,
        message: 'Canvas is not visible',
        computedStyle: canvas.computedStyle
      });
    }

    // Aspect ratio analysis
    const physicalAspectRatio = canvas.width / canvas.height;
    const displayAspectRatio = canvas.clientWidth / canvas.clientHeight;
    const aspectRatioDifference = Math.abs(physicalAspectRatio - displayAspectRatio);

    if (aspectRatioDifference > this.thresholds.aspectRatioTolerance) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'ASPECT_RATIO_DISTORTION',
        canvas: canvasId,
        message: `Aspect ratio mismatch may cause distortion`,
        details: {
          physicalAspectRatio: physicalAspectRatio.toFixed(3),
          displayAspectRatio: displayAspectRatio.toFixed(3),
          difference: aspectRatioDifference.toFixed(3)
        }
      });
    }

    // Calculate potential scaling factors
    const horizontalScale = canvas.clientWidth / canvas.width;
    const verticalScale = canvas.clientHeight / canvas.height;

    canvas.calculatedScaling = {
      horizontal: horizontalScale,
      vertical: verticalScale,
      uniform: Math.abs(horizontalScale - verticalScale) < 0.01,
      factor: Math.min(horizontalScale, verticalScale)
    };

    if (canvas.calculatedScaling.factor < this.thresholds.scalingFactorWarning) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'LOW_SCALING_FACTOR',
        canvas: canvasId,
        message: `Low scaling factor detected: ${canvas.calculatedScaling.factor.toFixed(3)}`,
        suggestion: 'Content may appear very small in final PDF'
      });
    }
  }

  /**
   * Perform global analysis across all canvases
   */
  performGlobalCanvasAnalysis(canvasData, analysis) {
    const canvases = canvasData.canvases;
    
    if (canvases.length === 0) {
      analysis.issues.push({
        type: 'ERROR',
        category: 'NO_CANVAS',
        message: 'No canvas elements found on page'
      });
      return;
    }

    if (canvases.length > 1) {
      analysis.issues.push({
        type: 'INFO',
        category: 'MULTIPLE_CANVAS',
        message: `Found ${canvases.length} canvas elements`,
        suggestion: 'Ensure the correct canvas is being used for PDF generation'
      });
    }

    // Check for overlapping canvases
    for (let i = 0; i < canvases.length; i++) {
      for (let j = i + 1; j < canvases.length; j++) {
        if (this.canvasesOverlap(canvases[i], canvases[j])) {
          analysis.issues.push({
            type: 'WARNING',
            category: 'OVERLAPPING_CANVAS',
            message: `Canvas ${i} and ${j} overlap`,
            suggestion: 'Overlapping canvases may cause rendering issues'
          });
        }
      }
    }

    // Analyze total canvas area vs viewport
    const totalCanvasArea = canvases.reduce((sum, canvas) => 
      sum + (canvas.width * canvas.height), 0);
    const viewportArea = canvasData.viewport.width * canvasData.viewport.height;
    
    analysis.rendering.totalCanvasArea = totalCanvasArea;
    analysis.rendering.viewportArea = viewportArea;
    analysis.rendering.canvasToViewportRatio = totalCanvasArea / viewportArea;

    if (analysis.rendering.canvasToViewportRatio > 5) {
      analysis.issues.push({
        type: 'WARNING',
        category: 'HIGH_CANVAS_AREA',
        message: `Canvas area is ${analysis.rendering.canvasToViewportRatio.toFixed(1)}x viewport size`,
        suggestion: 'Large canvas area may impact performance'
      });
    }

    // Generate global recommendations
    this.generateGlobalRecommendations(analysis);
  }

  /**
   * Check if two canvases overlap
   */
  canvasesOverlap(canvas1, canvas2) {
    const rect1 = canvas1.boundingRect;
    const rect2 = canvas2.boundingRect;
    
    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  }

  /**
   * Generate global recommendations
   */
  generateGlobalRecommendations(analysis) {
    const issues = analysis.issues;
    const errorCount = issues.filter(i => i.type === 'ERROR').length;
    const warningCount = issues.filter(i => i.type === 'WARNING').length;

    if (errorCount > 0) {
      analysis.recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix Canvas Errors',
        description: `${errorCount} critical canvas issues detected`,
        actions: [
          'Check canvas initialization code',
          'Verify canvas dimensions are set correctly',
          'Ensure canvas elements exist before PDF generation'
        ]
      });
    }

    if (warningCount > 3) {
      analysis.recommendations.push({
        priority: 'HIGH',
        title: 'Address Canvas Warnings',
        description: `${warningCount} canvas warnings may affect PDF quality`,
        actions: [
          'Review canvas sizing calculations',
          'Verify aspect ratios are maintained',
          'Check for dimension mismatches'
        ]
      });
    }

    // Specific recommendations based on issue patterns
    const dimensionIssues = issues.filter(i => 
      i.category === 'DIMENSION_MISMATCH' || 
      i.category === 'ASPECT_RATIO_DISTORTION'
    );

    if (dimensionIssues.length > 0) {
      analysis.recommendations.push({
        priority: 'HIGH',
        title: 'Fix Canvas Dimension Issues',
        description: 'Canvas dimension inconsistencies detected',
        actions: [
          'Ensure canvas.width and canvas.height match display size',
          'Account for device pixel ratio in calculations',
          'Use consistent units throughout scaling calculations'
        ]
      });
    }

    const scalingIssues = issues.filter(i => 
      i.category === 'LOW_SCALING_FACTOR'
    );

    if (scalingIssues.length > 0) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        title: 'Improve Content Scaling',
        description: 'Content may appear too small in PDF',
        actions: [
          'Increase canvas dimensions if possible',
          'Implement content-aware scaling algorithms',
          'Consider reducing content amount or complexity'
        ]
      });
    }
  }

  /**
   * Log detailed analysis for debugging
   */
  logDetailedAnalysis(analysis) {
    console.group(`🔍 Canvas Analysis - ${analysis.testId}`);
    
    console.log('📊 Summary:', {
      canvasCount: analysis.canvases.length,
      issueCount: analysis.issues.length,
      errorCount: analysis.issues.filter(i => i.type === 'ERROR').length,
      warningCount: analysis.issues.filter(i => i.type === 'WARNING').length
    });

    if (analysis.canvases.length > 0) {
      console.group('🎨 Canvas Details:');
      analysis.canvases.forEach((canvas, index) => {
        console.log(`Canvas ${index}:`, {
          id: canvas.id,
          dimensions: `${canvas.width}x${canvas.height}`,
          display: `${canvas.clientWidth}x${canvas.clientHeight}`,
          visible: canvas.isVisible,
          scaling: canvas.calculatedScaling
        });
      });
      console.groupEnd();
    }

    if (analysis.issues.length > 0) {
      console.group('⚠️ Issues:');
      analysis.issues.forEach(issue => {
        const logMethod = issue.type === 'ERROR' ? console.error : 
                         issue.type === 'WARNING' ? console.warn : console.info;
        logMethod(`[${issue.category}] ${issue.message}`);
      });
      console.groupEnd();
    }

    if (analysis.recommendations.length > 0) {
      console.group('💡 Recommendations:');
      analysis.recommendations.forEach(rec => {
        console.log(`[${rec.priority}] ${rec.title}: ${rec.description}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Capture canvas scaling metrics during PDF generation
   */
  async captureScalingMetrics(page, testId) {
    const scalingMetrics = await page.evaluate(() => {
      const metrics = {
        timestamp: Date.now(),
        beforeScaling: {},
        afterScaling: {},
        scalingSteps: [],
        performanceMetrics: {}
      };

      // Capture current state
      const canvases = Array.from(document.querySelectorAll('canvas'));
      metrics.beforeScaling = {
        canvasCount: canvases.length,
        totalArea: canvases.reduce((sum, c) => sum + (c.width * c.height), 0),
        dimensions: canvases.map(c => ({ width: c.width, height: c.height }))
      };

      // Set up performance monitoring
      const perfStart = performance.now();
      
      // Inject scaling monitoring
      if (window.console && window.console.log) {
        const originalLog = window.console.log;
        let scalingLogs = [];
        
        window.console.log = function(...args) {
          const message = args.join(' ');
          if (message.includes('scaling') || 
              message.includes('canvas') || 
              message.includes('PDF') ||
              message.includes('dimension')) {
            scalingLogs.push({
              timestamp: Date.now(),
              message: message,
              args: args
            });
          }
          return originalLog.apply(console, args);
        };

        // Restore original after a delay
        setTimeout(() => {
          window.console.log = originalLog;
          metrics.scalingSteps = scalingLogs;
        }, 10000);
      }

      return metrics;
    });

    return scalingMetrics;
  }

  /**
   * Generate comprehensive scaling report
   */
  generateScalingReport(beforeAnalysis, afterAnalysis, scalingMetrics) {
    const report = {
      timestamp: new Date().toISOString(),
      testId: beforeAnalysis.testId,
      summary: {
        canvasCountBefore: beforeAnalysis.canvases.length,
        canvasCountAfter: afterAnalysis ? afterAnalysis.canvases.length : 'unknown',
        totalIssues: beforeAnalysis.issues.length,
        criticalIssues: beforeAnalysis.issues.filter(i => i.type === 'ERROR').length
      },
      dimensionAnalysis: this.compareDimensions(beforeAnalysis, afterAnalysis),
      scalingAnalysis: this.analyzeScalingQuality(beforeAnalysis, scalingMetrics),
      performanceImpact: this.analyzePerformanceImpact(scalingMetrics),
      recommendations: this.generateScalingRecommendations(beforeAnalysis, afterAnalysis, scalingMetrics),
      rawData: {
        beforeAnalysis,
        afterAnalysis,
        scalingMetrics
      }
    };

    return report;
  }

  /**
   * Compare dimensions before and after
   */
  compareDimensions(before, after) {
    if (!after) return { status: 'no_after_data' };

    const comparison = {
      dimensionChanges: [],
      significantChanges: false
    };

    before.canvases.forEach((beforeCanvas, index) => {
      const afterCanvas = after.canvases[index];
      if (afterCanvas) {
        const widthChange = afterCanvas.width - beforeCanvas.width;
        const heightChange = afterCanvas.height - beforeCanvas.height;
        
        if (Math.abs(widthChange) > 10 || Math.abs(heightChange) > 10) {
          comparison.significantChanges = true;
          comparison.dimensionChanges.push({
            canvasIndex: index,
            before: { width: beforeCanvas.width, height: beforeCanvas.height },
            after: { width: afterCanvas.width, height: afterCanvas.height },
            change: { width: widthChange, height: heightChange }
          });
        }
      }
    });

    return comparison;
  }

  /**
   * Analyze scaling quality
   */
  analyzeScalingQuality(analysis, scalingMetrics) {
    const quality = {
      overallScore: 0,
      factors: {},
      issues: []
    };

    // Analyze canvas dimensions quality
    const avgScalingFactor = analysis.canvases.reduce((sum, canvas) => 
      sum + (canvas.calculatedScaling?.factor || 0), 0) / analysis.canvases.length;

    quality.factors.scalingFactor = {
      average: avgScalingFactor,
      score: avgScalingFactor >= 0.8 ? 100 : avgScalingFactor >= 0.6 ? 75 : avgScalingFactor >= 0.4 ? 50 : 25
    };

    // Analyze dimension consistency
    const dimensionIssues = analysis.issues.filter(i => 
      i.category === 'DIMENSION_MISMATCH' || 
      i.category === 'ASPECT_RATIO_DISTORTION'
    ).length;

    quality.factors.dimensionConsistency = {
      issueCount: dimensionIssues,
      score: dimensionIssues === 0 ? 100 : Math.max(0, 100 - (dimensionIssues * 25))
    };

    // Calculate overall score
    const scores = Object.values(quality.factors).map(f => f.score);
    quality.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return quality;
  }

  /**
   * Analyze performance impact
   */
  analyzePerformanceImpact(scalingMetrics) {
    if (!scalingMetrics || !scalingMetrics.performanceMetrics) {
      return { status: 'no_performance_data' };
    }

    const impact = {
      renderingTime: scalingMetrics.performanceMetrics.renderingTime || 0,
      memoryUsage: scalingMetrics.performanceMetrics.memoryUsage || 'unknown',
      scalingSteps: scalingMetrics.scalingSteps?.length || 0
    };

    impact.performanceRating = impact.renderingTime < 1000 ? 'excellent' :
                              impact.renderingTime < 3000 ? 'good' :
                              impact.renderingTime < 5000 ? 'fair' : 'poor';

    return impact;
  }

  /**
   * Generate scaling-specific recommendations
   */
  generateScalingRecommendations(before, after, scalingMetrics) {
    const recommendations = [];

    // Base recommendations from analysis
    recommendations.push(...before.recommendations);

    // Additional scaling-specific recommendations
    const avgScalingFactor = before.canvases.reduce((sum, canvas) => 
      sum + (canvas.calculatedScaling?.factor || 0), 0) / before.canvases.length;

    if (avgScalingFactor < 0.5) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Improve Content Scaling Factor',
        description: `Average scaling factor is low (${avgScalingFactor.toFixed(2)})`,
        actions: [
          'Increase canvas resolution',
          'Reduce content complexity',
          'Implement adaptive content scaling',
          'Consider content pagination for large amounts of data'
        ]
      });
    }

    const errorIssues = before.issues.filter(i => i.type === 'ERROR').length;
    if (errorIssues > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix Canvas Initialization Issues',
        description: `${errorIssues} critical canvas errors detected`,
        actions: [
          'Verify canvas elements are properly created',
          'Check timing of canvas operations',
          'Ensure DOM is ready before canvas manipulation',
          'Add error handling for canvas operations'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Export analysis results for external tools
   */
  exportAnalysisResults(format = 'json') {
    const exportData = {
      metadata: {
        exportTimestamp: new Date().toISOString(),
        totalAnalyses: this.analysisHistory.length,
        format: format
      },
      analyses: this.analysisHistory,
      summary: this.generateHistoricalSummary()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        return this.convertToCSV(exportData);
      default:
        return exportData;
    }
  }

  /**
   * Generate historical summary of analyses
   */
  generateHistoricalSummary() {
    if (this.analysisHistory.length === 0) return null;

    const analyses = this.analysisHistory;
    
    return {
      totalTests: analyses.length,
      averageCanvasCount: analyses.reduce((sum, a) => sum + a.canvases.length, 0) / analyses.length,
      averageIssueCount: analyses.reduce((sum, a) => sum + a.issues.length, 0) / analyses.length,
      mostCommonIssues: this.findMostCommonIssues(),
      improvementTrend: this.calculateImprovementTrend(),
      performanceMetrics: this.calculateAveragePerformance()
    };
  }

  /**
   * Find most common issues across all analyses
   */
  findMostCommonIssues() {
    const issueCount = {};
    
    this.analysisHistory.forEach(analysis => {
      analysis.issues.forEach(issue => {
        const key = `${issue.type}_${issue.category}`;
        issueCount[key] = (issueCount[key] || 0) + 1;
      });
    });

    return Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Calculate improvement trend over time
   */
  calculateImprovementTrend() {
    if (this.analysisHistory.length < 2) return 'insufficient_data';

    const recent = this.analysisHistory.slice(-3);
    const older = this.analysisHistory.slice(0, -3);

    if (older.length === 0) return 'insufficient_data';

    const recentAvgIssues = recent.reduce((sum, a) => sum + a.issues.length, 0) / recent.length;
    const olderAvgIssues = older.reduce((sum, a) => sum + a.issues.length, 0) / older.length;

    if (recentAvgIssues < olderAvgIssues * 0.8) return 'improving';
    if (recentAvgIssues > olderAvgIssues * 1.2) return 'declining';
    return 'stable';
  }

  /**
   * Calculate average performance metrics
   */
  calculateAveragePerformance() {
    const validAnalyses = this.analysisHistory.filter(a => a.rendering.totalCanvasArea);
    
    if (validAnalyses.length === 0) return null;

    return {
      averageCanvasArea: validAnalyses.reduce((sum, a) => sum + a.rendering.totalCanvasArea, 0) / validAnalyses.length,
      averageCanvasToViewportRatio: validAnalyses.reduce((sum, a) => sum + a.rendering.canvasToViewportRatio, 0) / validAnalyses.length
    };
  }

  /**
   * Convert analysis data to CSV format
   */
  convertToCSV(exportData) {
    const headers = ['TestId', 'Timestamp', 'CanvasCount', 'IssueCount', 'ErrorCount', 'WarningCount', 'TotalCanvasArea'];
    const rows = exportData.analyses.map(analysis => [
      analysis.testId,
      analysis.timestamp,
      analysis.canvases.length,
      analysis.issues.length,
      analysis.issues.filter(i => i.type === 'ERROR').length,
      analysis.issues.filter(i => i.type === 'WARNING').length,
      analysis.rendering.totalCanvasArea || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export default CanvasAnalyzer;