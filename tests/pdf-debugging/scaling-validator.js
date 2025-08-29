// tests/pdf-debugging/scaling-validator.js
// Scaling Algorithm Validation and Testing

export class ScalingValidator {
  constructor() {
    this.testCases = [];
    this.validations = [];
    this.scalingStrategies = [];
  }

  /**
   * Validates current scaling implementation
   * @param {Page} page - Playwright page instance
   * @param {Object} contentData - Content dimensions and data
   */
  async validateCurrentScaling(page, contentData) {
    const validation = {
      testId: `scaling-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: contentData,
      results: {},
      issues: [],
      alternatives: []
    };

    try {
      // Inject scaling validation script
      await page.addInitScript(() => {
        window.scalingValidator = {
          originalScaling: null,
          testScaling: [],
          measurements: []
        };

        // Override the original scaling function to capture data
        window.captureOriginalScaling = function(originalWidth, originalHeight, finalWidth, finalHeight, x, y) {
          window.scalingValidator.originalScaling = {
            input: { originalWidth, originalHeight },
            output: { finalWidth, finalHeight, x, y },
            timestamp: Date.now()
          };
        };

        // Test alternative scaling strategies
        window.testAlternativeScaling = function(contentWidth, contentHeight) {
          const pageWidth = 210;  // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const margin = 10;
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2);

          const strategies = [];

          // Strategy 1: Current implementation (for comparison)
          const current = {
            name: 'current',
            aspectRatio: contentWidth / contentHeight,
            finalWidth: maxWidth,
            finalHeight: maxWidth / (contentWidth / contentHeight)
          };
          
          if (current.finalHeight > maxHeight) {
            current.finalHeight = maxHeight;
            current.finalWidth = maxHeight * (contentWidth / contentHeight);
          }
          
          current.x = (pageWidth - current.finalWidth) / 2;
          current.y = (pageHeight - current.finalHeight) / 2;
          current.fitsInPage = current.finalWidth <= maxWidth && current.finalHeight <= maxHeight;
          current.utilizationScore = ((current.finalWidth * current.finalHeight) / (maxWidth * maxHeight)) * 100;
          
          strategies.push(current);

          // Strategy 2: Aggressive scaling (always fit, may be very small)
          const aggressive = {
            name: 'aggressive',
            aspectRatio: contentWidth / contentHeight
          };
          
          const scaleFactorWidth = maxWidth / contentWidth;
          const scaleFactorHeight = maxHeight / contentHeight;
          const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
          
          aggressive.finalWidth = contentWidth * scaleFactor;
          aggressive.finalHeight = contentHeight * scaleFactor;
          aggressive.x = (pageWidth - aggressive.finalWidth) / 2;
          aggressive.y = (pageHeight - aggressive.finalHeight) / 2;
          aggressive.fitsInPage = true;
          aggressive.utilizationScore = ((aggressive.finalWidth * aggressive.finalHeight) / (maxWidth * maxHeight)) * 100;
          aggressive.scaleFactor = scaleFactor;
          
          strategies.push(aggressive);

          // Strategy 3: Minimum readable size (ensure minimum font size)
          const minReadable = {
            name: 'min_readable',
            aspectRatio: contentWidth / contentHeight,
            minScale: 0.7 // Don't scale below 70% for readability
          };
          
          const readableScaleFactor = Math.max(0.7, Math.min(scaleFactorWidth, scaleFactorHeight));
          minReadable.finalWidth = contentWidth * readableScaleFactor;
          minReadable.finalHeight = contentHeight * readableScaleFactor;
          minReadable.x = (pageWidth - minReadable.finalWidth) / 2;
          minReadable.y = (pageHeight - minReadable.finalHeight) / 2;
          minReadable.fitsInPage = minReadable.finalWidth <= maxWidth && minReadable.finalHeight <= maxHeight;
          minReadable.utilizationScore = ((minReadable.finalWidth * minReadable.finalHeight) / (maxWidth * maxHeight)) * 100;
          minReadable.scaleFactor = readableScaleFactor;
          
          strategies.push(minReadable);

          // Strategy 4: Adaptive margins (reduce margins if needed)
          const adaptiveMargins = {
            name: 'adaptive_margins',
            aspectRatio: contentWidth / contentHeight
          };
          
          let adaptiveMargin = margin;
          let adaptiveMaxWidth = pageWidth - (adaptiveMargin * 2);
          let adaptiveMaxHeight = pageHeight - (adaptiveMargin * 2);
          
          // Try reducing margins if content doesn't fit
          while (adaptiveMargin > 2 && (contentWidth > adaptiveMaxWidth || contentHeight > adaptiveMaxHeight)) {
            adaptiveMargin -= 1;
            adaptiveMaxWidth = pageWidth - (adaptiveMargin * 2);
            adaptiveMaxHeight = pageHeight - (adaptiveMargin * 2);
          }
          
          const adaptiveScaleFactorWidth = adaptiveMaxWidth / contentWidth;
          const adaptiveScaleFactorHeight = adaptiveMaxHeight / contentHeight;
          const adaptiveScaleFactor = Math.min(adaptiveScaleFactorWidth, adaptiveScaleFactorHeight);
          
          adaptiveMargins.finalWidth = contentWidth * adaptiveScaleFactor;
          adaptiveMargins.finalHeight = contentHeight * adaptiveScaleFactor;
          adaptiveMargins.x = (pageWidth - adaptiveMargins.finalWidth) / 2;
          adaptiveMargins.y = (pageHeight - adaptiveMargins.finalHeight) / 2;
          adaptiveMargins.fitsInPage = adaptiveMargins.finalWidth <= adaptiveMaxWidth && adaptiveMargins.finalHeight <= adaptiveMaxHeight;
          adaptiveMargins.utilizationScore = ((adaptiveMargins.finalWidth * adaptiveMargins.finalHeight) / (adaptiveMaxWidth * adaptiveMaxHeight)) * 100;
          adaptiveMargins.actualMargin = adaptiveMargin;
          adaptiveMargins.scaleFactor = adaptiveScaleFactor;
          
          strategies.push(adaptiveMargins);

          // Strategy 5: Content-aware scaling (different strategies for different content types)
          const contentAware = {
            name: 'content_aware',
            aspectRatio: contentWidth / contentHeight
          };
          
          // Analyze content type based on aspect ratio
          let strategy = 'balanced';
          if (contentWidth / contentHeight > 2) {
            strategy = 'wide_content'; // Very wide content
          } else if (contentHeight / contentWidth > 3) {
            strategy = 'tall_content'; // Very tall content
          }
          
          let contentAwareScaleFactor;
          switch (strategy) {
            case 'wide_content':
              // For wide content, prioritize width fitting
              contentAwareScaleFactor = Math.min(maxWidth / contentWidth, 0.9);
              break;
            case 'tall_content':
              // For tall content, prioritize height fitting
              contentAwareScaleFactor = Math.min(maxHeight / contentHeight, 0.8);
              break;
            default:
              // Balanced approach
              contentAwareScaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight, 0.85);
          }
          
          contentAware.finalWidth = contentWidth * contentAwareScaleFactor;
          contentAware.finalHeight = contentHeight * contentAwareScaleFactor;
          contentAware.x = (pageWidth - contentAware.finalWidth) / 2;
          contentAware.y = (pageHeight - contentAware.finalHeight) / 2;
          contentAware.fitsInPage = contentAware.finalWidth <= maxWidth && contentAware.finalHeight <= maxHeight;
          contentAware.utilizationScore = ((contentAware.finalWidth * contentAware.finalHeight) / (maxWidth * maxHeight)) * 100;
          contentAware.strategy = strategy;
          contentAware.scaleFactor = contentAwareScaleFactor;
          
          strategies.push(contentAware);

          window.scalingValidator.testScaling = strategies;
          return strategies;
        };
      });

      // Get content dimensions
      const contentDimensions = await page.evaluate(() => {
        const content = document.querySelector('.pdf-content') || 
                       document.querySelector('#receiptPreview') ||
                       document.querySelector('#receiptForm');
        
        if (!content) return null;
        
        return {
          scrollWidth: content.scrollWidth,
          scrollHeight: content.scrollHeight,
          offsetWidth: content.offsetWidth,
          offsetHeight: content.offsetHeight,
          clientWidth: content.clientWidth,
          clientHeight: content.clientHeight
        };
      });

      if (!contentDimensions) {
        throw new Error('Could not measure content dimensions');
      }

      // Test alternative scaling strategies
      const strategies = await page.evaluate((dims) => {
        return window.testAlternativeScaling(dims.scrollWidth, dims.scrollHeight);
      }, contentDimensions);

      validation.results = {
        contentDimensions,
        strategies,
        recommendation: this.recommendBestStrategy(strategies),
        currentStrategy: strategies.find(s => s.name === 'current')
      };

      // Validate each strategy
      validation.results.strategies.forEach(strategy => {
        if (!strategy.fitsInPage) {
          validation.issues.push({
            type: 'ERROR',
            strategy: strategy.name,
            message: `Strategy '${strategy.name}' does not fit content in single page`,
            dimensions: `${strategy.finalWidth.toFixed(1)}x${strategy.finalHeight.toFixed(1)}mm`
          });
        }

        if (strategy.utilizationScore < 30) {
          validation.issues.push({
            type: 'WARNING',
            strategy: strategy.name,
            message: `Strategy '${strategy.name}' has low page utilization (${strategy.utilizationScore.toFixed(1)}%)`,
            suggestion: 'Content may appear too small'
          });
        }

        if (strategy.scaleFactor && strategy.scaleFactor < 0.5) {
          validation.issues.push({
            type: 'WARNING',
            strategy: strategy.name,
            message: `Strategy '${strategy.name}' scales content to ${(strategy.scaleFactor * 100).toFixed(1)}% which may be too small`,
            suggestion: 'Consider content optimization or different layout'
          });
        }
      });

      this.validations.push(validation);
      return validation;

    } catch (error) {
      validation.error = error.message;
      validation.issues.push({
        type: 'CRITICAL',
        message: `Scaling validation failed: ${error.message}`
      });
      return validation;
    }
  }

  /**
   * Recommends the best scaling strategy based on analysis
   */
  recommendBestStrategy(strategies) {
    let bestStrategy = null;
    let bestScore = 0;

    strategies.forEach(strategy => {
      if (!strategy.fitsInPage) return; // Skip strategies that don't fit

      let score = 0;
      
      // Utilization score (0-40 points)
      score += Math.min(40, strategy.utilizationScore * 0.4);
      
      // Readability score (0-30 points)
      if (strategy.scaleFactor) {
        if (strategy.scaleFactor >= 0.8) score += 30;
        else if (strategy.scaleFactor >= 0.6) score += 20;
        else if (strategy.scaleFactor >= 0.4) score += 10;
      } else {
        score += 20; // Default for strategies without explicit scale factor
      }
      
      // Fit quality score (0-20 points)
      if (strategy.finalWidth <= 190 && strategy.finalHeight <= 277) score += 20; // Fits well within margins
      else if (strategy.finalWidth <= 200 && strategy.finalHeight <= 287) score += 15; // Fits with minimal margins
      else score += 10; // Just fits
      
      // Strategy-specific bonuses (0-10 points)
      switch (strategy.name) {
        case 'adaptive_margins':
          score += 8; // Bonus for intelligent margin adjustment
          break;
        case 'content_aware':
          score += 6; // Bonus for content-aware approach
          break;
        case 'min_readable':
          score += 4; // Bonus for readability consideration
          break;
        case 'aggressive':
          score += 2; // Small bonus for guaranteed fit
          break;
      }

      strategy.score = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    });

    return {
      recommended: bestStrategy,
      alternatives: strategies
        .filter(s => s !== bestStrategy && s.fitsInPage)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 2)
    };
  }

  /**
   * Tests scaling with different content sizes
   */
  async testScalingWithVariousContent(page, testCases) {
    const results = [];

    for (const testCase of testCases) {
      try {
        // Set up test content
        await page.evaluate((content) => {
          const testDiv = document.createElement('div');
          testDiv.className = 'pdf-content test-content';
          testDiv.style.cssText = `
            width: ${content.width}px;
            height: ${content.height}px;
            padding: 20px;
            background: white;
            font-family: Arial, sans-serif;
            font-size: ${content.fontSize || 14}px;
            line-height: 1.6;
          `;
          testDiv.innerHTML = content.html;
          
          // Remove existing test content
          const existing = document.querySelector('.test-content');
          if (existing) existing.remove();
          
          document.body.appendChild(testDiv);
        }, testCase);

        // Wait for rendering
        await page.waitForTimeout(500);

        // Validate scaling
        const validation = await this.validateCurrentScaling(page, testCase);
        results.push({
          testCase: testCase.name,
          validation
        });

      } catch (error) {
        results.push({
          testCase: testCase.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generates test cases for different content scenarios
   */
  generateTestCases() {
    return [
      {
        name: 'short_content',
        width: 800,
        height: 600,
        fontSize: 14,
        html: `
          <h1>Short Receipt</h1>
          <p>Cliente: Test Cliente</p>
          <p>Producto: Anillo simple</p>
          <p>Total: $1,000.00</p>
        `
      },
      {
        name: 'medium_content',
        width: 900,
        height: 1200,
        fontSize: 14,
        html: `
          <h1>Medium Receipt</h1>
          <div>
            <h2>Cliente Information</h2>
            <p>Nombre: Cliente Test Medium</p>
            <p>Teléfono: 55 1234 5678</p>
            <p>Email: test@medium.com</p>
          </div>
          <div>
            <h2>Product Details</h2>
            <p>Tipo: Collar</p>
            <p>Material: Oro 18k</p>
            <p>Peso: 15.5 gramos</p>
            <p>Descripción: Collar elegante con detalles artesanales</p>
          </div>
          <div>
            <h2>Financial Information</h2>
            <p>Precio Base: $15,000.00</p>
            <p>Subtotal: $15,000.00</p>
            <p>Balance: $10,000.00</p>
          </div>
        `
      },
      {
        name: 'long_content',
        width: 900,
        height: 1800,
        fontSize: 14,
        html: `
          <h1>Long Receipt with Extensive Details</h1>
          <div>
            <h2>Client Information</h2>
            <p>Nombre Completo: Cliente Test Con Nombre Muy Largo Para Probar Límites</p>
            <p>Teléfono: +52 55 1234 5678 ext. 901</p>
            <p>Email: cliente.test.con.email.muy.largo@dominio.extremadamente.largo.com</p>
            <p>Dirección: Calle Muy Larga Número 123, Colonia Con Nombre Extenso, Ciudad de México, CDMX, CP 12345</p>
          </div>
          <div>
            <h2>Product Details</h2>
            <p>Tipo: Collar de diseño exclusivo</p>
            <p>Material: Oro blanco 18k con detalles en oro amarillo</p>
            <p>Peso: 25.75 gramos</p>
            <p>Piedras: Diamantes 2.5ct (corte brillante), Esmeraldas 1.8ct (corte esmeralda), Rubíes 0.9ct (corte óvalo)</p>
            <p>Descripción: Collar de diseño exclusivo con trabajo de filigrana artesanal, acabado espejo, incluye cadena de seguridad, estuche de terciopelo, certificado de autenticidad y garantía extendida de por vida. Pieza única creada especialmente para el cliente con técnicas tradicionales mexicanas.</p>
          </div>
          <div>
            <h2>Financial Information</h2>
            <p>Precio Base: $45,000.00</p>
            <p>Aportación Cliente: $5,000.00</p>
            <p>Subtotal: $50,000.00</p>
            <p>Anticipo: $15,000.00</p>
            <p>Balance Pendiente: $35,000.00</p>
            <p>Plan de Pagos: 3 abonos mensuales de $11,666.67</p>
          </div>
          <div>
            <h2>Terms and Conditions</h2>
            <p>El cliente acepta las especificaciones acordadas y entiende que cualquier modificación puede afectar el precio y tiempo de entrega.</p>
            <p>La entrega se realizará según la fecha acordada una vez completado el pago total del balance pendiente.</p>
            <p>Los artículos no reclamados después de 30 días serán considerados abandonados y podrán ser vendidos para recuperar costos.</p>
            <p>Garantía de por vida en mano de obra, no incluye daños por mal uso o desgaste natural de las piedras.</p>
          </div>
        `
      },
      {
        name: 'very_long_content',
        width: 900,
        height: 2400,
        fontSize: 12,
        html: `
          <h1>Very Long Receipt - Stress Test</h1>
          ${Array(10).fill().map((_, i) => `
            <div>
              <h3>Section ${i + 1}</h3>
              <p>This is section number ${i + 1} with extensive content to test the limits of the PDF generation system. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <ul>
                <li>Item ${i * 3 + 1}: Detailed description of item</li>
                <li>Item ${i * 3 + 2}: Another detailed description</li>
                <li>Item ${i * 3 + 3}: Even more detailed description</li>
              </ul>
            </div>
          `).join('')}
        `
      }
    ];
  }

  /**
   * Generates comprehensive scaling report
   */
  generateScalingReport() {
    const report = {
      summary: {
        totalValidations: this.validations.length,
        strategiesAnalyzed: this.validations.reduce((acc, v) => 
          acc + (v.results?.strategies?.length || 0), 0),
        commonIssues: this.analyzeCommonScalingIssues(),
        recommendations: this.generateScalingRecommendations()
      },
      validationResults: this.validations,
      bestStrategies: this.findBestStrategiesOverall()
    };

    return report;
  }

  /**
   * Analyzes common scaling issues across validations
   */
  analyzeCommonScalingIssues() {
    const issues = {};
    
    this.validations.forEach(validation => {
      validation.issues.forEach(issue => {
        const key = `${issue.type}_${issue.strategy || 'unknown'}`;
        issues[key] = (issues[key] || 0) + 1;
      });
    });

    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ issue: key, count }));
  }

  /**
   * Generates scaling-specific recommendations
   */
  generateScalingRecommendations() {
    const recommendations = [];
    const commonIssues = this.analyzeCommonScalingIssues();

    // Check for consistent scaling failures
    const errorRate = this.validations.filter(v => 
      v.issues.some(i => i.type === 'ERROR')).length / this.validations.length;

    if (errorRate > 0.3) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'High Scaling Failure Rate',
        description: `${(errorRate * 100).toFixed(1)}% of scaling validations failed`,
        action: 'Implement more robust scaling algorithm with fallback strategies'
      });
    }

    // Check for low utilization
    const avgUtilization = this.validations.reduce((sum, v) => {
      const currentStrategy = v.results?.strategies?.find(s => s.name === 'current');
      return sum + (currentStrategy?.utilizationScore || 0);
    }, 0) / this.validations.length;

    if (avgUtilization < 50) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Low Page Utilization',
        description: `Average page utilization is ${avgUtilization.toFixed(1)}%`,
        action: 'Consider implementing adaptive margins or content optimization'
      });
    }

    return recommendations;
  }

  /**
   * Finds best performing strategies across all validations
   */
  findBestStrategiesOverall() {
    const strategyPerformance = {};

    this.validations.forEach(validation => {
      if (validation.results?.strategies) {
        validation.results.strategies.forEach(strategy => {
          if (!strategyPerformance[strategy.name]) {
            strategyPerformance[strategy.name] = {
              name: strategy.name,
              tests: 0,
              successRate: 0,
              avgUtilization: 0,
              avgScore: 0
            };
          }

          const perf = strategyPerformance[strategy.name];
          perf.tests++;
          if (strategy.fitsInPage) perf.successRate++;
          perf.avgUtilization += strategy.utilizationScore || 0;
          perf.avgScore += strategy.score || 0;
        });
      }
    });

    // Calculate averages and success rates
    Object.values(strategyPerformance).forEach(perf => {
      perf.successRate = (perf.successRate / perf.tests) * 100;
      perf.avgUtilization = perf.avgUtilization / perf.tests;
      perf.avgScore = perf.avgScore / perf.tests;
    });

    return Object.values(strategyPerformance)
      .sort((a, b) => b.avgScore - a.avgScore);
  }
}

export default ScalingValidator;