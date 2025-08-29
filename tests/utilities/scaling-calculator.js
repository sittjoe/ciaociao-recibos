// tests/utilities/scaling-calculator.js
// Advanced Scaling Algorithms for Single-Page PDF Generation

export class ScalingCalculator {
  constructor() {
    this.algorithms = {
      current: this.currentAlgorithm,
      aggressive: this.aggressiveScaling,
      adaptive: this.adaptiveScaling,
      contentAware: this.contentAwareScaling,
      multiStage: this.multiStageScaling,
      intelligent: this.intelligentScaling
    };
    
    this.A4_DIMENSIONS = {
      width: 210,  // mm
      height: 297, // mm
      margin: 10   // mm
    };
  }

  /**
   * Current algorithm implementation (for comparison)
   */
  currentAlgorithm(contentWidth, contentHeight, options = {}) {
    const { width: pageWidth, height: pageHeight, margin } = this.A4_DIMENSIONS;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    let finalWidth = maxWidth;
    let finalHeight = maxWidth / (contentWidth / contentHeight);

    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = maxHeight * (contentWidth / contentHeight);
    }

    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    return {
      algorithm: 'current',
      input: { contentWidth, contentHeight },
      output: { finalWidth, finalHeight, x, y },
      scaleFactor: Math.min(finalWidth / contentWidth, finalHeight / contentHeight),
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      metadata: {
        aspectRatioMaintained: Math.abs((finalWidth / finalHeight) - (contentWidth / contentHeight)) < 0.01,
        marginUsed: margin
      }
    };
  }

  /**
   * Aggressive scaling - always fits, may be very small
   */
  aggressiveScaling(contentWidth, contentHeight, options = {}) {
    const { width: pageWidth, height: pageHeight, margin } = this.A4_DIMENSIONS;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    const scaleFactorWidth = maxWidth / contentWidth;
    const scaleFactorHeight = maxHeight / contentHeight;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    return {
      algorithm: 'aggressive',
      input: { contentWidth, contentHeight },
      output: { finalWidth, finalHeight, x, y },
      scaleFactor,
      fitsInPage: true, // Always fits by design
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      metadata: {
        aspectRatioMaintained: true,
        marginUsed: margin,
        readabilityScore: scaleFactor >= 0.7 ? 'good' : scaleFactor >= 0.5 ? 'fair' : 'poor'
      }
    };
  }

  /**
   * Adaptive scaling with dynamic margins
   */
  adaptiveScaling(contentWidth, contentHeight, options = {}) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    let margin = this.A4_DIMENSIONS.margin;
    
    // Start with normal margins and reduce if needed
    let bestResult = null;
    const minMargin = options.minMargin || 2;
    const targetUtilization = options.targetUtilization || 70;

    for (let currentMargin = margin; currentMargin >= minMargin; currentMargin -= 1) {
      const maxWidth = pageWidth - (currentMargin * 2);
      const maxHeight = pageHeight - (currentMargin * 2);

      const scaleFactorWidth = maxWidth / contentWidth;
      const scaleFactorHeight = maxHeight / contentHeight;
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

      const finalWidth = contentWidth * scaleFactor;
      const finalHeight = contentHeight * scaleFactor;
      const utilizationScore = ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100;

      const result = {
        algorithm: 'adaptive',
        input: { contentWidth, contentHeight },
        output: { 
          finalWidth, 
          finalHeight, 
          x: (pageWidth - finalWidth) / 2, 
          y: (pageHeight - finalHeight) / 2 
        },
        scaleFactor,
        fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
        utilizationScore,
        metadata: {
          aspectRatioMaintained: true,
          marginUsed: currentMargin,
          targetUtilization: targetUtilization,
          readabilityScore: scaleFactor >= 0.7 ? 'excellent' : scaleFactor >= 0.5 ? 'good' : 'fair'
        }
      };

      if (result.fitsInPage) {
        if (!bestResult || result.utilizationScore > bestResult.utilizationScore) {
          bestResult = result;
        }
        
        // If we achieve target utilization, we can stop
        if (result.utilizationScore >= targetUtilization) {
          break;
        }
      }
    }

    return bestResult || this.aggressiveScaling(contentWidth, contentHeight, options);
  }

  /**
   * Content-aware scaling based on content characteristics
   */
  contentAwareScaling(contentWidth, contentHeight, options = {}) {
    const aspectRatio = contentWidth / contentHeight;
    const contentType = this.analyzeContentType(contentWidth, contentHeight, options);
    
    let strategy = this.getContentStrategy(contentType, aspectRatio);
    let result;

    switch (strategy.type) {
      case 'wide_content':
        result = this.handleWideContent(contentWidth, contentHeight, strategy);
        break;
      case 'tall_content':
        result = this.handleTallContent(contentWidth, contentHeight, strategy);
        break;
      case 'square_content':
        result = this.handleSquareContent(contentWidth, contentHeight, strategy);
        break;
      case 'text_heavy':
        result = this.handleTextHeavyContent(contentWidth, contentHeight, strategy);
        break;
      default:
        result = this.adaptiveScaling(contentWidth, contentHeight, options);
    }

    result.algorithm = 'content_aware';
    result.metadata = {
      ...result.metadata,
      contentType: contentType,
      strategy: strategy.type,
      aspectRatio: aspectRatio
    };

    return result;
  }

  /**
   * Multi-stage scaling with fallback strategies
   */
  multiStageScaling(contentWidth, contentHeight, options = {}) {
    const stages = [
      { name: 'optimal', minScale: 0.8, targetUtilization: 80 },
      { name: 'acceptable', minScale: 0.6, targetUtilization: 60 },
      { name: 'minimal', minScale: 0.4, targetUtilization: 40 },
      { name: 'emergency', minScale: 0.2, targetUtilization: 20 }
    ];

    for (const stage of stages) {
      const result = this.adaptiveScaling(contentWidth, contentHeight, {
        minMargin: 2,
        targetUtilization: stage.targetUtilization
      });

      if (result.scaleFactor >= stage.minScale && result.fitsInPage) {
        result.algorithm = 'multi_stage';
        result.metadata = {
          ...result.metadata,
          stage: stage.name,
          stageMinScale: stage.minScale,
          stageTargetUtilization: stage.targetUtilization
        };
        return result;
      }
    }

    // If all stages fail, use emergency aggressive scaling
    const emergency = this.aggressiveScaling(contentWidth, contentHeight, options);
    emergency.algorithm = 'multi_stage';
    emergency.metadata = {
      ...emergency.metadata,
      stage: 'emergency_fallback',
      warning: 'Content may be too small to read'
    };

    return emergency;
  }

  /**
   * Intelligent scaling with machine learning-inspired optimization
   */
  intelligentScaling(contentWidth, contentHeight, options = {}) {
    const features = this.extractContentFeatures(contentWidth, contentHeight, options);
    const weights = this.calculateOptimalWeights(features);
    
    // Try multiple approaches and weight the results
    const candidates = [
      { result: this.adaptiveScaling(contentWidth, contentHeight, options), weight: weights.adaptive },
      { result: this.contentAwareScaling(contentWidth, contentHeight, options), weight: weights.contentAware },
      { result: this.multiStageScaling(contentWidth, contentHeight, options), weight: weights.multiStage }
    ];

    // Score each candidate
    candidates.forEach(candidate => {
      candidate.score = this.scoreScalingResult(candidate.result, features) * candidate.weight;
    });

    // Select the best candidate
    const best = candidates.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );

    best.result.algorithm = 'intelligent';
    best.result.metadata = {
      ...best.result.metadata,
      features: features,
      weights: weights,
      candidateScores: candidates.map(c => ({ algorithm: c.result.algorithm, score: c.score })),
      selectedScore: best.score
    };

    return best.result;
  }

  /**
   * Analyzes content type based on dimensions and metadata
   */
  analyzeContentType(contentWidth, contentHeight, options = {}) {
    const aspectRatio = contentWidth / contentHeight;
    const area = contentWidth * contentHeight;
    const metadata = options.contentMetadata || {};

    const type = {
      dimensions: { width: contentWidth, height: contentHeight, aspectRatio, area },
      characteristics: []
    };

    // Analyze dimensions
    if (aspectRatio > 2) type.characteristics.push('very_wide');
    else if (aspectRatio > 1.5) type.characteristics.push('wide');
    else if (aspectRatio < 0.5) type.characteristics.push('very_tall');
    else if (aspectRatio < 0.8) type.characteristics.push('tall');
    else type.characteristics.push('balanced');

    // Analyze size
    if (area > 2000000) type.characteristics.push('very_large');
    else if (area > 1000000) type.characteristics.push('large');
    else if (area < 300000) type.characteristics.push('small');
    else type.characteristics.push('medium');

    // Analyze content metadata if available
    if (metadata.textLength > 2000) type.characteristics.push('text_heavy');
    if (metadata.imageCount > 3) type.characteristics.push('image_heavy');
    if (metadata.complexLayout) type.characteristics.push('complex_layout');

    return type;
  }

  /**
   * Gets appropriate strategy for content type
   */
  getContentStrategy(contentType, aspectRatio) {
    const characteristics = contentType.characteristics;

    if (characteristics.includes('very_wide') || characteristics.includes('wide')) {
      return {
        type: 'wide_content',
        priority: 'width',
        maxScale: 0.9,
        preferredMargin: 5
      };
    }

    if (characteristics.includes('very_tall') || characteristics.includes('tall')) {
      return {
        type: 'tall_content',
        priority: 'height',
        maxScale: 0.8,
        preferredMargin: 8
      };
    }

    if (characteristics.includes('text_heavy')) {
      return {
        type: 'text_heavy',
        priority: 'readability',
        minScale: 0.6,
        preferredMargin: 10
      };
    }

    if (Math.abs(aspectRatio - 1) < 0.2) {
      return {
        type: 'square_content',
        priority: 'balanced',
        maxScale: 0.85,
        preferredMargin: 8
      };
    }

    return {
      type: 'balanced',
      priority: 'optimal',
      maxScale: 0.9,
      preferredMargin: 10
    };
  }

  /**
   * Handles wide content specifically
   */
  handleWideContent(contentWidth, contentHeight, strategy) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    const margin = strategy.preferredMargin;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    // Prioritize width fitting for wide content
    let scaleFactor = Math.min(maxWidth / contentWidth, strategy.maxScale);
    let finalWidth = contentWidth * scaleFactor;
    let finalHeight = contentHeight * scaleFactor;

    // Check if height still fits
    if (finalHeight > maxHeight) {
      scaleFactor = maxHeight / contentHeight;
      finalWidth = contentWidth * scaleFactor;
      finalHeight = contentHeight * scaleFactor;
    }

    return {
      input: { contentWidth, contentHeight },
      output: { 
        finalWidth, 
        finalHeight, 
        x: (pageWidth - finalWidth) / 2, 
        y: (pageHeight - finalHeight) / 2 
      },
      scaleFactor,
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      metadata: {
        aspectRatioMaintained: true,
        marginUsed: margin,
        strategy: 'wide_content_optimized'
      }
    };
  }

  /**
   * Handles tall content specifically
   */
  handleTallContent(contentWidth, contentHeight, strategy) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    const margin = strategy.preferredMargin;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    // Prioritize height fitting for tall content
    let scaleFactor = Math.min(maxHeight / contentHeight, strategy.maxScale);
    let finalWidth = contentWidth * scaleFactor;
    let finalHeight = contentHeight * scaleFactor;

    // Check if width still fits
    if (finalWidth > maxWidth) {
      scaleFactor = maxWidth / contentWidth;
      finalWidth = contentWidth * scaleFactor;
      finalHeight = contentHeight * scaleFactor;
    }

    return {
      input: { contentWidth, contentHeight },
      output: { 
        finalWidth, 
        finalHeight, 
        x: (pageWidth - finalWidth) / 2, 
        y: (pageHeight - finalHeight) / 2 
      },
      scaleFactor,
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      metadata: {
        aspectRatioMaintained: true,
        marginUsed: margin,
        strategy: 'tall_content_optimized'
      }
    };
  }

  /**
   * Handles square/balanced content
   */
  handleSquareContent(contentWidth, contentHeight, strategy) {
    return this.adaptiveScaling(contentWidth, contentHeight, {
      targetUtilization: 75,
      minMargin: strategy.preferredMargin
    });
  }

  /**
   * Handles text-heavy content with readability priority
   */
  handleTextHeavyContent(contentWidth, contentHeight, strategy) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    const margin = strategy.preferredMargin;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    // Ensure minimum scale for readability
    const scaleFactorWidth = maxWidth / contentWidth;
    const scaleFactorHeight = maxHeight / contentHeight;
    let scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

    // Don't scale below minimum for text readability
    scaleFactor = Math.max(scaleFactor, strategy.minScale);

    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;

    return {
      input: { contentWidth, contentHeight },
      output: { 
        finalWidth, 
        finalHeight, 
        x: (pageWidth - finalWidth) / 2, 
        y: (pageHeight - finalHeight) / 2 
      },
      scaleFactor,
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      metadata: {
        aspectRatioMaintained: true,
        marginUsed: margin,
        strategy: 'text_readability_optimized',
        readabilityPriority: true
      }
    };
  }

  /**
   * Extracts features for intelligent scaling
   */
  extractContentFeatures(contentWidth, contentHeight, options = {}) {
    const aspectRatio = contentWidth / contentHeight;
    const area = contentWidth * contentHeight;
    const metadata = options.contentMetadata || {};

    return {
      aspectRatio,
      area,
      width: contentWidth,
      height: contentHeight,
      textDensity: (metadata.textLength || 0) / area,
      imageDensity: (metadata.imageCount || 0) / area,
      complexity: metadata.complexity || 'medium',
      hasLongText: (metadata.textLength || 0) > 1500,
      hasImages: (metadata.imageCount || 0) > 0,
      isWide: aspectRatio > 1.5,
      isTall: aspectRatio < 0.7,
      isLarge: area > 1500000
    };
  }

  /**
   * Calculates optimal weights for intelligent scaling
   */
  calculateOptimalWeights(features) {
    const weights = {
      adaptive: 0.4,
      contentAware: 0.4,
      multiStage: 0.2
    };

    // Adjust weights based on content features
    if (features.hasLongText) {
      weights.contentAware += 0.2;
      weights.adaptive -= 0.1;
      weights.multiStage -= 0.1;
    }

    if (features.isWide || features.isTall) {
      weights.contentAware += 0.2;
      weights.adaptive -= 0.1;
      weights.multiStage -= 0.1;
    }

    if (features.isLarge) {
      weights.multiStage += 0.2;
      weights.adaptive -= 0.1;
      weights.contentAware -= 0.1;
    }

    // Normalize weights
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      weights[key] = weights[key] / total;
    });

    return weights;
  }

  /**
   * Scores a scaling result based on multiple criteria
   */
  scoreScalingResult(result, features) {
    let score = 0;

    // Base score for fitting in page
    if (result.fitsInPage) score += 40;

    // Utilization score (0-30 points)
    score += Math.min(30, result.utilizationScore * 0.3);

    // Readability score (0-20 points)
    if (result.scaleFactor >= 0.8) score += 20;
    else if (result.scaleFactor >= 0.6) score += 15;
    else if (result.scaleFactor >= 0.4) score += 10;
    else score += 5;

    // Feature-specific bonuses (0-10 points)
    if (features.hasLongText && result.scaleFactor >= 0.6) score += 5;
    if (features.isWide && result.metadata?.strategy === 'wide_content_optimized') score += 5;
    if (features.isTall && result.metadata?.strategy === 'tall_content_optimized') score += 5;

    return score;
  }

  /**
   * Compares all algorithms and returns analysis
   */
  compareAllAlgorithms(contentWidth, contentHeight, options = {}) {
    const results = {};
    const analysis = {
      input: { contentWidth, contentHeight },
      algorithms: [],
      recommendation: null,
      comparison: {}
    };

    // Run all algorithms
    Object.keys(this.algorithms).forEach(algorithmName => {
      try {
        results[algorithmName] = this.algorithms[algorithmName].call(this, contentWidth, contentHeight, options);
        analysis.algorithms.push({
          name: algorithmName,
          result: results[algorithmName]
        });
      } catch (error) {
        console.warn(`Algorithm ${algorithmName} failed:`, error.message);
      }
    });

    // Find best algorithm
    let bestScore = -1;
    let bestAlgorithm = null;

    Object.entries(results).forEach(([name, result]) => {
      if (result.fitsInPage) {
        const features = this.extractContentFeatures(contentWidth, contentHeight, options);
        const score = this.scoreScalingResult(result, features);
        
        if (score > bestScore) {
          bestScore = score;
          bestAlgorithm = name;
        }
      }
    });

    analysis.recommendation = {
      algorithm: bestAlgorithm,
      score: bestScore,
      result: results[bestAlgorithm] || null
    };

    // Generate comparison metrics
    analysis.comparison = {
      fittingAlgorithms: Object.values(results).filter(r => r.fitsInPage).length,
      averageUtilization: Object.values(results).reduce((sum, r) => sum + r.utilizationScore, 0) / Object.values(results).length,
      averageScaleFactor: Object.values(results).reduce((sum, r) => sum + r.scaleFactor, 0) / Object.values(results).length,
      readableAlgorithms: Object.values(results).filter(r => r.scaleFactor >= 0.6).length
    };

    return analysis;
  }

  /**
   * Generates implementation code for the best algorithm
   */
  generateImplementationCode(algorithmName, contentWidth, contentHeight, options = {}) {
    const result = this.algorithms[algorithmName].call(this, contentWidth, contentHeight, options);
    
    return {
      algorithm: algorithmName,
      jsCode: this.generateJavaScriptCode(result),
      result: result,
      testCode: this.generateTestCode(algorithmName, contentWidth, contentHeight, result)
    };
  }

  /**
   * Generates JavaScript implementation code
   */
  generateJavaScriptCode(result) {
    return `
// Improved PDF Scaling Implementation
function calculateOptimalScaling(contentWidth, contentHeight) {
    const pageWidth = 210;  // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = ${result.metadata?.marginUsed || 10};
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    ${this.generateAlgorithmSpecificCode(result)}
    
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    return {
        finalWidth,
        finalHeight,
        x,
        y,
        scaleFactor: Math.min(finalWidth / contentWidth, finalHeight / contentHeight),
        fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight
    };
}`;
  }

  /**
   * Generates algorithm-specific implementation code
   */
  generateAlgorithmSpecificCode(result) {
    switch (result.algorithm) {
      case 'aggressive':
        return `
    const scaleFactorWidth = maxWidth / contentWidth;
    const scaleFactorHeight = maxHeight / contentHeight;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
    
    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;`;

      case 'adaptive':
        return `
    let bestResult = null;
    const minMargin = 2;
    
    for (let currentMargin = margin; currentMargin >= minMargin; currentMargin -= 1) {
        const testMaxWidth = pageWidth - (currentMargin * 2);
        const testMaxHeight = pageHeight - (currentMargin * 2);
        const scaleFactor = Math.min(testMaxWidth / contentWidth, testMaxHeight / contentHeight);
        
        const testWidth = contentWidth * scaleFactor;
        const testHeight = contentHeight * scaleFactor;
        
        if (testWidth <= testMaxWidth && testHeight <= testMaxHeight) {
            const utilization = ((testWidth * testHeight) / (testMaxWidth * testMaxHeight)) * 100;
            if (!bestResult || utilization > bestResult.utilization) {
                bestResult = { width: testWidth, height: testHeight, utilization };
            }
        }
    }
    
    const finalWidth = bestResult ? bestResult.width : contentWidth * Math.min(maxWidth / contentWidth, maxHeight / contentHeight);
    const finalHeight = bestResult ? bestResult.height : contentHeight * Math.min(maxWidth / contentWidth, maxHeight / contentHeight);`;

      default:
        return `
    let finalWidth = maxWidth;
    let finalHeight = maxWidth / (contentWidth / contentHeight);
    
    if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * (contentWidth / contentHeight);
    }`;
    }
  }

  /**
   * Generates test code for validation
   */
  generateTestCode(algorithmName, contentWidth, contentHeight, result) {
    return `
// Test case for ${algorithmName} algorithm
test('${algorithmName} scaling algorithm validation', () => {
    const result = calculateOptimalScaling(${contentWidth}, ${contentHeight});
    
    expect(result.fitsInPage).toBe(true);
    expect(result.finalWidth).toBeCloseTo(${result.output.finalWidth.toFixed(2)}, 1);
    expect(result.finalHeight).toBeCloseTo(${result.output.finalHeight.toFixed(2)}, 1);
    expect(result.scaleFactor).toBeGreaterThan(0);
    expect(result.scaleFactor).toBeLessThanOrEqual(1);
});`;
  }
}

export default ScalingCalculator;