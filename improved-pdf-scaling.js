// improved-pdf-scaling.js
// Advanced Single-Page PDF Scaling Implementation
// Based on Context7 testing framework analysis

/**
 * Advanced PDF Scaling Algorithm - Multiple Strategies Implementation
 * This replaces the current scaling logic in script.js generatePDF() function
 */

class AdvancedPDFScaling {
  constructor() {
    this.A4_DIMENSIONS = {
      width: 210,  // mm
      height: 297, // mm
      margin: 10   // mm
    };
    
    this.scalingStrategies = [
      'intelligent',
      'adaptive',
      'contentAware',
      'multiStage',
      'aggressive'
    ];
  }

  /**
   * Main function to calculate optimal scaling
   * @param {number} contentWidth - Original content width in pixels
   * @param {number} contentHeight - Original content height in pixels
   * @param {Object} options - Additional options and content metadata
   * @returns {Object} Optimal scaling result
   */
  calculateOptimalScaling(contentWidth, contentHeight, options = {}) {
    const contentMetadata = this.extractContentMetadata(options);
    const strategies = this.evaluateAllStrategies(contentWidth, contentHeight, contentMetadata);
    const bestStrategy = this.selectBestStrategy(strategies, contentMetadata);
    
    // Add comprehensive logging for debugging
    this.logScalingDecision(bestStrategy, strategies, contentMetadata);
    
    return bestStrategy;
  }

  /**
   * Extracts content metadata for intelligent scaling decisions
   */
  extractContentMetadata(options) {
    const metadata = {
      textLength: options.textLength || 0,
      imageCount: options.imageCount || 0,
      complexity: options.complexity || 'medium',
      hasLongText: (options.textLength || 0) > 1500,
      hasImages: (options.imageCount || 0) > 0,
      contentType: options.contentType || 'receipt',
      clientNameLength: options.clientNameLength || 0,
      descriptionLength: options.descriptionLength || 0,
      stonesLength: options.stonesLength || 0
    };

    // Calculate content complexity score
    metadata.complexityScore = this.calculateComplexityScore(metadata);
    
    return metadata;
  }

  /**
   * Calculates content complexity score for scaling decisions
   */
  calculateComplexityScore(metadata) {
    let score = 0;
    
    // Text complexity
    if (metadata.textLength > 2000) score += 3;
    else if (metadata.textLength > 1000) score += 2;
    else if (metadata.textLength > 500) score += 1;
    
    // Image complexity
    if (metadata.imageCount > 3) score += 2;
    else if (metadata.imageCount > 1) score += 1;
    
    // Long names/descriptions add complexity
    if (metadata.clientNameLength > 40) score += 1;
    if (metadata.descriptionLength > 200) score += 2;
    if (metadata.stonesLength > 100) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Evaluates all scaling strategies and returns results
   */
  evaluateAllStrategies(contentWidth, contentHeight, metadata) {
    const strategies = {};
    
    // Strategy 1: Intelligent Scaling (Primary recommendation)
    strategies.intelligent = this.intelligentScaling(contentWidth, contentHeight, metadata);
    
    // Strategy 2: Adaptive Margins
    strategies.adaptive = this.adaptiveScaling(contentWidth, contentHeight, metadata);
    
    // Strategy 3: Content-Aware Scaling
    strategies.contentAware = this.contentAwareScaling(contentWidth, contentHeight, metadata);
    
    // Strategy 4: Multi-Stage Scaling
    strategies.multiStage = this.multiStageScaling(contentWidth, contentHeight, metadata);
    
    // Strategy 5: Aggressive Scaling (Fallback)
    strategies.aggressive = this.aggressiveScaling(contentWidth, contentHeight, metadata);
    
    return strategies;
  }

  /**
   * Intelligent Scaling - Machine Learning Inspired Optimization
   */
  intelligentScaling(contentWidth, contentHeight, metadata) {
    const { width: pageWidth, height: pageHeight, margin } = this.A4_DIMENSIONS;
    
    // Dynamic margin calculation based on content complexity
    let intelligentMargin = margin;
    if (metadata.complexityScore <= 3) intelligentMargin = Math.max(6, margin - 2);
    else if (metadata.complexityScore >= 7) intelligentMargin = Math.min(15, margin + 3);
    
    const maxWidth = pageWidth - (intelligentMargin * 2);
    const maxHeight = pageHeight - (intelligentMargin * 2);
    
    // Content-based scaling factor calculation
    const aspectRatio = contentWidth / contentHeight;
    let targetUtilization = 75; // Base target
    
    // Adjust target based on content characteristics
    if (metadata.hasLongText) targetUtilization = 70; // More conservative for readability
    if (metadata.hasImages) targetUtilization = 80; // Can be more aggressive with images
    if (metadata.complexityScore >= 8) targetUtilization = 65; // Very conservative for complex content
    
    // Calculate scale factors
    const scaleFactorWidth = maxWidth / contentWidth;
    const scaleFactorHeight = maxHeight / contentHeight;
    let scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
    
    // Apply intelligent constraints
    const minReadableScale = metadata.hasLongText ? 0.6 : 0.4;
    const maxScale = 0.95; // Never scale up significantly
    
    scaleFactor = Math.max(minReadableScale, Math.min(maxScale, scaleFactor));
    
    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;
    
    return {
      algorithm: 'intelligent',
      finalWidth,
      finalHeight,
      x: (pageWidth - finalWidth) / 2,
      y: (pageHeight - finalHeight) / 2,
      scaleFactor,
      marginUsed: intelligentMargin,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      readabilityScore: this.calculateReadabilityScore(scaleFactor, metadata),
      confidence: this.calculateConfidence(scaleFactor, metadata)
    };
  }

  /**
   * Adaptive Scaling with Dynamic Margins
   */
  adaptiveScaling(contentWidth, contentHeight, metadata) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    let bestResult = null;
    
    // Try different margin configurations
    const marginOptions = [10, 8, 6, 4, 2];
    
    for (const margin of marginOptions) {
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      const scaleFactorWidth = maxWidth / contentWidth;
      const scaleFactorHeight = maxHeight / contentHeight;
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
      
      const finalWidth = contentWidth * scaleFactor;
      const finalHeight = contentHeight * scaleFactor;
      const utilizationScore = ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100;
      
      const result = {
        algorithm: 'adaptive',
        finalWidth,
        finalHeight,
        x: (pageWidth - finalWidth) / 2,
        y: (pageHeight - finalHeight) / 2,
        scaleFactor,
        marginUsed: margin,
        utilizationScore,
        fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
        readabilityScore: this.calculateReadabilityScore(scaleFactor, metadata)
      };
      
      // Select best result based on utilization and readability
      if (result.fitsInPage && (!bestResult || this.isBetterResult(result, bestResult, metadata))) {
        bestResult = result;
      }
    }
    
    return bestResult || this.aggressiveScaling(contentWidth, contentHeight, metadata);
  }

  /**
   * Content-Aware Scaling based on content characteristics
   */
  contentAwareScaling(contentWidth, contentHeight, metadata) {
    const aspectRatio = contentWidth / contentHeight;
    const strategy = this.determineContentStrategy(aspectRatio, metadata);
    
    return this.applyContentStrategy(contentWidth, contentHeight, strategy, metadata);
  }

  /**
   * Determines the appropriate strategy based on content characteristics
   */
  determineContentStrategy(aspectRatio, metadata) {
    if (aspectRatio > 2) {
      return { type: 'wide', priorityAxis: 'width', maxScale: 0.9, preferredMargin: 5 };
    } else if (aspectRatio < 0.5) {
      return { type: 'tall', priorityAxis: 'height', maxScale: 0.8, preferredMargin: 8 };
    } else if (metadata.hasLongText) {
      return { type: 'textHeavy', priorityAxis: 'readability', minScale: 0.6, preferredMargin: 10 };
    } else if (metadata.hasImages) {
      return { type: 'imageHeavy', priorityAxis: 'quality', maxScale: 0.85, preferredMargin: 8 };
    } else {
      return { type: 'balanced', priorityAxis: 'optimal', maxScale: 0.9, preferredMargin: 10 };
    }
  }

  /**
   * Applies content-specific strategy
   */
  applyContentStrategy(contentWidth, contentHeight, strategy, metadata) {
    const { width: pageWidth, height: pageHeight } = this.A4_DIMENSIONS;
    const margin = strategy.preferredMargin;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    let scaleFactor;
    
    switch (strategy.type) {
      case 'wide':
        // Prioritize width fitting for wide content
        scaleFactor = Math.min(maxWidth / contentWidth, strategy.maxScale);
        if (contentHeight * scaleFactor > maxHeight) {
          scaleFactor = maxHeight / contentHeight;
        }
        break;
        
      case 'tall':
        // Prioritize height fitting for tall content
        scaleFactor = Math.min(maxHeight / contentHeight, strategy.maxScale);
        if (contentWidth * scaleFactor > maxWidth) {
          scaleFactor = maxWidth / contentWidth;
        }
        break;
        
      case 'textHeavy':
        // Ensure minimum scale for readability
        scaleFactor = Math.min(maxWidth / contentWidth, maxHeight / contentHeight);
        scaleFactor = Math.max(scaleFactor, strategy.minScale);
        break;
        
      default:
        // Balanced approach
        scaleFactor = Math.min(maxWidth / contentWidth, maxHeight / contentHeight, strategy.maxScale || 0.9);
    }
    
    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;
    
    return {
      algorithm: 'contentAware',
      finalWidth,
      finalHeight,
      x: (pageWidth - finalWidth) / 2,
      y: (pageHeight - finalHeight) / 2,
      scaleFactor,
      marginUsed: margin,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      fitsInPage: finalWidth <= maxWidth && finalHeight <= maxHeight,
      strategy: strategy.type,
      readabilityScore: this.calculateReadabilityScore(scaleFactor, metadata)
    };
  }

  /**
   * Multi-Stage Scaling with fallback options
   */
  multiStageScaling(contentWidth, contentHeight, metadata) {
    const stages = [
      { name: 'optimal', minScale: 0.8, targetUtilization: 80 },
      { name: 'acceptable', minScale: 0.6, targetUtilization: 60 },
      { name: 'minimal', minScale: 0.4, targetUtilization: 40 },
      { name: 'emergency', minScale: 0.2, targetUtilization: 20 }
    ];
    
    for (const stage of stages) {
      const result = this.adaptiveScaling(contentWidth, contentHeight, metadata);
      
      if (result && result.scaleFactor >= stage.minScale && result.fitsInPage) {
        result.algorithm = 'multiStage';
        result.stage = stage.name;
        return result;
      }
    }
    
    // Emergency fallback
    const emergency = this.aggressiveScaling(contentWidth, contentHeight, metadata);
    emergency.algorithm = 'multiStage';
    emergency.stage = 'emergency';
    emergency.warning = 'Content may be too small to read clearly';
    
    return emergency;
  }

  /**
   * Aggressive Scaling - Always fits, may be very small
   */
  aggressiveScaling(contentWidth, contentHeight, metadata) {
    const { width: pageWidth, height: pageHeight, margin } = this.A4_DIMENSIONS;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    const scaleFactorWidth = maxWidth / contentWidth;
    const scaleFactorHeight = maxHeight / contentHeight;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
    
    const finalWidth = contentWidth * scaleFactor;
    const finalHeight = contentHeight * scaleFactor;
    
    return {
      algorithm: 'aggressive',
      finalWidth,
      finalHeight,
      x: (pageWidth - finalWidth) / 2,
      y: (pageHeight - finalHeight) / 2,
      scaleFactor,
      marginUsed: margin,
      utilizationScore: ((finalWidth * finalHeight) / (maxWidth * maxHeight)) * 100,
      fitsInPage: true, // Always fits by design
      readabilityScore: this.calculateReadabilityScore(scaleFactor, metadata),
      guaranteedFit: true
    };
  }

  /**
   * Selects the best strategy based on comprehensive scoring
   */
  selectBestStrategy(strategies, metadata) {
    let bestStrategy = null;
    let bestScore = -1;
    
    Object.values(strategies).forEach(strategy => {
      if (strategy && strategy.fitsInPage) {
        const score = this.scoreStrategy(strategy, metadata);
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }
    });
    
    // Fallback to aggressive if nothing else works
    if (!bestStrategy) {
      bestStrategy = strategies.aggressive;
    }
    
    bestStrategy.finalScore = bestScore;
    return bestStrategy;
  }

  /**
   * Scores a strategy based on multiple criteria
   */
  scoreStrategy(strategy, metadata) {
    let score = 0;
    
    // Base score for fitting (40 points)
    if (strategy.fitsInPage) score += 40;
    
    // Utilization score (30 points max)
    score += Math.min(30, strategy.utilizationScore * 0.3);
    
    // Readability score (20 points max)
    score += strategy.readabilityScore || 0;
    
    // Algorithm-specific bonuses (10 points max)
    switch (strategy.algorithm) {
      case 'intelligent':
        score += 8; // Highest bonus for intelligent algorithm
        break;
      case 'contentAware':
        score += 6;
        break;
      case 'adaptive':
        score += 5;
        break;
      case 'multiStage':
        score += 4;
        break;
      case 'aggressive':
        score += 2; // Lowest bonus for fallback
        break;
    }
    
    // Confidence bonus if available
    if (strategy.confidence) {
      score += strategy.confidence * 5; // Up to 5 additional points
    }
    
    return score;
  }

  /**
   * Calculates readability score based on scale factor and content
   */
  calculateReadabilityScore(scaleFactor, metadata) {
    let score = 0;
    
    if (scaleFactor >= 0.8) score = 20;
    else if (scaleFactor >= 0.7) score = 18;
    else if (scaleFactor >= 0.6) score = 15;
    else if (scaleFactor >= 0.5) score = 12;
    else if (scaleFactor >= 0.4) score = 8;
    else score = 4;
    
    // Penalty for text-heavy content with small scale
    if (metadata.hasLongText && scaleFactor < 0.6) {
      score -= 5;
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculates confidence level for intelligent scaling
   */
  calculateConfidence(scaleFactor, metadata) {
    let confidence = 0.8; // Base confidence
    
    // Higher confidence for moderate scaling
    if (scaleFactor >= 0.7 && scaleFactor <= 0.9) confidence += 0.1;
    
    // Lower confidence for extreme scaling
    if (scaleFactor < 0.4) confidence -= 0.3;
    
    // Adjust based on content complexity
    if (metadata.complexityScore <= 3) confidence += 0.1;
    else if (metadata.complexityScore >= 8) confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determines if one result is better than another
   */
  isBetterResult(result1, result2, metadata) {
    const score1 = this.scoreStrategy(result1, metadata);
    const score2 = this.scoreStrategy(result2, metadata);
    return score1 > score2;
  }

  /**
   * Logs scaling decision for debugging
   */
  logScalingDecision(selectedStrategy, allStrategies, metadata) {
    console.log('📏 Advanced PDF Scaling Decision:', {
      selectedAlgorithm: selectedStrategy.algorithm,
      selectedScore: selectedStrategy.finalScore?.toFixed(1),
      scaleFactor: selectedStrategy.scaleFactor.toFixed(3),
      finalDimensions: `${selectedStrategy.finalWidth.toFixed(1)}x${selectedStrategy.finalHeight.toFixed(1)}mm`,
      utilizationScore: `${selectedStrategy.utilizationScore.toFixed(1)}%`,
      marginUsed: `${selectedStrategy.marginUsed}mm`,
      contentComplexity: metadata.complexityScore,
      allStrategiesEvaluated: Object.keys(allStrategies).length,
      fitsInPage: selectedStrategy.fitsInPage ? '✅' : '❌'
    });
    
    // Warning if using emergency scaling
    if (selectedStrategy.warning) {
      console.warn('⚠️ PDF Scaling Warning:', selectedStrategy.warning);
    }
  }
}

/**
 * Drop-in replacement function for the current generatePDF implementation
 * This function should replace the scaling logic in script.js
 */
function calculateAdvancedPDFScaling(contentWidth, contentHeight, options = {}) {
  const scaler = new AdvancedPDFScaling();
  return scaler.calculateOptimalScaling(contentWidth, contentHeight, options);
}

// Export for use in the main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvancedPDFScaling, calculateAdvancedPDFScaling };
}

// Global assignment for browser use
if (typeof window !== 'undefined') {
  window.AdvancedPDFScaling = AdvancedPDFScaling;
  window.calculateAdvancedPDFScaling = calculateAdvancedPDFScaling;
}

/**
 * IMPLEMENTATION INSTRUCTIONS:
 * 
 * 1. Replace the scaling logic in script.js generatePDF() function (around lines 1159-1189)
 * 
 * 2. Change this code:
 *    ```javascript
 *    // SINGLE PAGE SCALING: Force all content to fit on one page
 *    const pageWidth = 210;  // A4 width in mm
 *    const pageHeight = 297; // A4 height in mm
 *    const margin = 10;      // Safe margins
 *    const maxWidth = pageWidth - (margin * 2);
 *    const maxHeight = pageHeight - (margin * 2);
 *    
 *    // Calculate original dimensions
 *    const originalWidth = canvas.width;
 *    const originalHeight = canvas.height;
 *    const aspectRatio = originalWidth / originalHeight;
 *    
 *    // Calculate scaled dimensions to fit in one page
 *    let finalWidth = maxWidth;
 *    let finalHeight = maxWidth / aspectRatio;
 *    
 *    // If height is still too large, scale by height instead
 *    if (finalHeight > maxHeight) {
 *        finalHeight = maxHeight;
 *        finalWidth = maxHeight * aspectRatio;
 *    }
 *    
 *    // Center the content on page
 *    const x = (pageWidth - finalWidth) / 2;
 *    const y = (pageHeight - finalHeight) / 2;
 *    ```
 * 
 * 3. To this code:
 *    ```javascript
 *    // ADVANCED SINGLE PAGE SCALING: Intelligent multi-strategy approach
 *    const contentMetadata = {
 *        textLength: tempDiv.textContent?.length || 0,
 *        imageCount: tempDiv.querySelectorAll('img').length,
 *        clientNameLength: (formData.clientName || '').length,
 *        descriptionLength: (formData.description || '').length,
 *        stonesLength: (formData.stones || '').length,
 *        complexity: formData.stones?.length > 100 ? 'high' : 'medium'
 *    };
 *    
 *    const scalingResult = calculateAdvancedPDFScaling(
 *        canvas.width, 
 *        canvas.height, 
 *        contentMetadata
 *    );
 *    
 *    const { finalWidth, finalHeight, x, y } = scalingResult;
 *    ```
 * 
 * 4. Include this file in your HTML before script.js:
 *    ```html
 *    <script src="improved-pdf-scaling.js"></script>
 *    ```
 * 
 * 5. Test with various content sizes to verify single-page output
 */