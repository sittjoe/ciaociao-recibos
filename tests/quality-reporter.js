// tests/quality-reporter.js
import fs from 'fs';
import path from 'path';
import { PDFStructureValidator } from './pdf-structure-validator.js';

export class QualityReporter {
  constructor() {
    this.validator = new PDFStructureValidator();
    this.reportsDir = './test-results/quality-reports';
    this.ensureReportsDirectory();
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Genera un reporte completo de calidad de PDF
   * @param {Object} testData - Datos del test ejecutado
   * @returns {Object} Reporte de calidad generado
   */
  async generateQualityReport(testData) {
    const timestamp = new Date().toISOString();
    const reportId = `pdf-quality-${timestamp.replace(/[:.]/g, '-')}`;
    
    const report = {
      id: reportId,
      timestamp,
      testInfo: testData.testInfo,
      validation: testData.validation,
      performance: testData.performance,
      screenshots: testData.screenshots,
      recommendations: this.generateRecommendations(testData.validation),
      summary: this.generateSummary(testData.validation)
    };

    // Guardar reporte en JSON
    const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generar reporte HTML
    const htmlPath = path.join(this.reportsDir, `${reportId}.html`);
    const htmlContent = this.generateHTMLReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    // Generar reporte de texto plano
    const textPath = path.join(this.reportsDir, `${reportId}.txt`);
    const textContent = this.validator.generateQualityReport(testData.validation);
    fs.writeFileSync(textPath, textContent);

    console.log(`📊 Reporte de calidad generado:`);
    console.log(`📁 JSON: ${jsonPath}`);
    console.log(`🌐 HTML: ${htmlPath}`);
    console.log(`📝 TXT: ${textPath}`);

    return report;
  }

  /**
   * Genera recomendaciones basadas en los resultados de validación
   * @param {Object} validationResults - Resultados de validación
   * @returns {Array} Lista de recomendaciones
   */
  generateRecommendations(validationResults) {
    const recommendations = [];

    if (!validationResults.isValid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CRITICAL',
        title: 'PDF Validation Failed',
        description: 'El PDF generado no cumple con los estándares de calidad',
        action: 'Revisar errores específicos y corregir antes de enviar al cliente'
      });
    }

    // Recomendaciones financieras
    if (validationResults.validations.financial && !validationResults.validations.financial.isValid) {
      recommendations.push({
        priority: 'HIGH',
        category: 'FINANCIAL',
        title: 'Errores en Cálculos Financieros',
        description: 'Los cálculos de subtotal o balance son incorrectos',
        action: 'Verificar función calculateBalance() y collectFormData()'
      });
    }

    // Recomendaciones de términos
    if (validationResults.validations.terms && !validationResults.validations.terms.isValid) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'TERMS',
        title: 'Términos y Condiciones Incorrectos',
        description: 'Los términos no coinciden con el estado de entrega',
        action: 'Verificar función getTermsAndConditions() y estado de entrega'
      });
    }

    // Recomendaciones de estructura
    if (validationResults.validations.structure && !validationResults.validations.structure.isValid) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'STRUCTURE',
        title: 'Estructura de PDF Incompleta',
        description: 'Faltan secciones requeridas en el PDF',
        action: 'Verificar función generateReceiptHTML() y plantilla de PDF'
      });
    }

    // Recomendaciones de formato
    if (validationResults.validations.format && validationResults.validations.format.warnings?.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'FORMAT',
        title: 'Optimización de Formato',
        description: 'El PDF podría optimizarse en tamaño o formato',
        action: 'Considerar compresión de imágenes o optimización de CSS'
      });
    }

    // Recomendaciones generales
    if (validationResults.totalWarnings > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'GENERAL',
        title: 'Advertencias de Calidad',
        description: `Se encontraron ${validationResults.totalWarnings} advertencias menores`,
        action: 'Revisar advertencias para mejorar calidad general'
      });
    }

    return recommendations;
  }

  /**
   * Genera un resumen ejecutivo de la validación
   * @param {Object} validationResults - Resultados de validación
   * @returns {Object} Resumen ejecutivo
   */
  generateSummary(validationResults) {
    const summary = {
      overallGrade: this.calculateGrade(validationResults),
      status: validationResults.isValid ? 'PASSED' : 'FAILED',
      clientName: validationResults.formData?.clientName || 'N/A',
      totalErrors: validationResults.totalErrors || 0,
      totalWarnings: validationResults.totalWarnings || 0,
      validationsCount: Object.keys(validationResults.validations || {}).length,
      passedValidations: Object.values(validationResults.validations || {})
        .filter(v => v.isValid).length,
      criticalIssues: [],
      keyMetrics: {}
    };

    // Identificar problemas críticos
    Object.entries(validationResults.validations || {}).forEach(([type, validation]) => {
      if (!validation.isValid && ['financial', 'structure'].includes(type)) {
        summary.criticalIssues.push({
          type: type.toUpperCase(),
          errors: validation.errors || []
        });
      }
    });

    // Métricas clave
    if (validationResults.formData) {
      summary.keyMetrics = {
        subtotal: validationResults.formData.subtotal || 0,
        balance: validationResults.formData.balance || 0,
        deliveryStatus: validationResults.formData.deliveryStatus || 'unknown'
      };
    }

    return summary;
  }

  /**
   * Calcula una calificación general del PDF
   * @param {Object} validationResults - Resultados de validación
   * @returns {string} Calificación (A-F)
   */
  calculateGrade(validationResults) {
    if (!validationResults.validations) return 'F';

    const totalValidations = Object.keys(validationResults.validations).length;
    const passedValidations = Object.values(validationResults.validations)
      .filter(v => v.isValid).length;
    
    const passRate = passedValidations / totalValidations;
    const errorPenalty = Math.min(validationResults.totalErrors * 0.1, 0.3);
    const warningPenalty = Math.min(validationResults.totalWarnings * 0.05, 0.1);
    
    const finalScore = Math.max(0, passRate - errorPenalty - warningPenalty);

    if (finalScore >= 0.95) return 'A+';
    if (finalScore >= 0.90) return 'A';
    if (finalScore >= 0.85) return 'A-';
    if (finalScore >= 0.80) return 'B+';
    if (finalScore >= 0.75) return 'B';
    if (finalScore >= 0.70) return 'B-';
    if (finalScore >= 0.65) return 'C+';
    if (finalScore >= 0.60) return 'C';
    if (finalScore >= 0.55) return 'C-';
    if (finalScore >= 0.50) return 'D';
    return 'F';
  }

  /**
   * Genera reporte HTML visual
   * @param {Object} report - Datos del reporte
   * @returns {string} HTML del reporte
   */
  generateHTMLReport(report) {
    const gradeColor = this.getGradeColor(report.summary.overallGrade);
    const statusColor = report.validation.isValid ? '#27AE60' : '#E74C3C';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Calidad PDF - ${report.testInfo?.clientName || 'N/A'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .grade {
            font-size: 4rem;
            font-weight: bold;
            color: ${gradeColor};
            margin: 10px 0;
        }
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            color: white;
            background: ${statusColor};
            font-weight: bold;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #D4AF37;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #D4AF37;
            margin-bottom: 20px;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 10px;
        }
        .validation-item {
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid;
            border-radius: 5px;
        }
        .validation-passed {
            background: #d4edda;
            border-color: #27AE60;
        }
        .validation-failed {
            background: #f8d7da;
            border-color: #E74C3C;
        }
        .error-list, .warning-list {
            list-style: none;
            margin-top: 10px;
        }
        .error-list li {
            color: #E74C3C;
            margin-bottom: 5px;
        }
        .error-list li::before {
            content: "❌ ";
        }
        .warning-list li {
            color: #f39c12;
            margin-bottom: 5px;
        }
        .warning-list li::before {
            content: "⚠️ ";
        }
        .recommendation {
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .rec-high { 
            background: #fee2e2; 
            border-color: #dc2626; 
        }
        .rec-medium { 
            background: #fef3c7; 
            border-color: #d97706; 
        }
        .rec-low { 
            background: #ecfdf5; 
            border-color: #059669; 
        }
        .timestamp {
            color: #666;
            font-size: 0.9rem;
            text-align: center;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Reporte de Calidad PDF</h1>
            <h2>ciaociao.mx - Sistema de Recibos</h2>
            <div class="grade">${report.summary.overallGrade}</div>
            <div class="status">${report.summary.status}</div>
            <p>Cliente: ${report.testInfo?.clientName || 'N/A'}</p>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalErrors}</div>
                <div>Errores</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalWarnings}</div>
                <div>Advertencias</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.passedValidations}/${report.summary.validationsCount}</div>
                <div>Validaciones Pasadas</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${report.summary.keyMetrics.subtotal?.toLocaleString('es-MX') || 0}</div>
                <div>Subtotal</div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Resultados de Validación</h2>
            ${Object.entries(report.validation.validations || {}).map(([type, validation]) => `
                <div class="validation-item ${validation.isValid ? 'validation-passed' : 'validation-failed'}">
                    <h3>${type.toUpperCase()}: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}</h3>
                    ${validation.errors && validation.errors.length > 0 ? `
                        <ul class="error-list">
                            ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${validation.warnings && validation.warnings.length > 0 ? `
                        <ul class="warning-list">
                            ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>💡 Recomendaciones</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation rec-${rec.priority.toLowerCase()}">
                    <h3>${rec.title} (${rec.priority})</h3>
                    <p><strong>Categoría:</strong> ${rec.category}</p>
                    <p><strong>Descripción:</strong> ${rec.description}</p>
                    <p><strong>Acción:</strong> ${rec.action}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📊 Información del Test</h2>
            <p><strong>ID del Test:</strong> ${report.id}</p>
            <p><strong>Timestamp:</strong> ${report.timestamp}</p>
            <p><strong>Cliente:</strong> ${report.testInfo?.clientName || 'N/A'}</p>
            <p><strong>Estado de Entrega:</strong> ${report.summary.keyMetrics.deliveryStatus}</p>
        </div>

        <div class="timestamp">
            Generado el ${new Date(report.timestamp).toLocaleString('es-MX')} por Sistema de Testing Automatizado ciaociao.mx
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Obtiene color para la calificación
   * @param {string} grade - Calificación
   * @returns {string} Color hex
   */
  getGradeColor(grade) {
    const colors = {
      'A+': '#27AE60', 'A': '#27AE60', 'A-': '#2ECC71',
      'B+': '#F39C12', 'B': '#F39C12', 'B-': '#E67E22',
      'C+': '#FF9800', 'C': '#FF9800', 'C-': '#FF5722',
      'D': '#E74C3C',
      'F': '#C0392B'
    };
    return colors[grade] || '#95A5A6';
  }

  /**
   * Genera dashboard de métricas históricas
   * @returns {Object} Dashboard con métricas
   */
  generateHistoricalDashboard() {
    const reportFiles = fs.readdirSync(this.reportsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const content = JSON.parse(fs.readFileSync(path.join(this.reportsDir, file), 'utf8'));
        return content;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const dashboard = {
      totalReports: reportFiles.length,
      recentReports: reportFiles.slice(0, 10),
      successRate: reportFiles.length > 0 ? 
        reportFiles.filter(r => r.validation.isValid).length / reportFiles.length : 0,
      averageGrade: this.calculateAverageGrade(reportFiles),
      commonIssues: this.analyzeCommonIssues(reportFiles),
      trends: this.analyzeTrends(reportFiles)
    };

    return dashboard;
  }

  /**
   * Calcula calificación promedio
   * @param {Array} reports - Lista de reportes
   * @returns {string} Calificación promedio
   */
  calculateAverageGrade(reports) {
    if (reports.length === 0) return 'N/A';
    
    const gradeValues = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D': 1.0, 'F': 0.0
    };
    
    const average = reports.reduce((sum, report) => 
      sum + (gradeValues[report.summary.overallGrade] || 0), 0) / reports.length;
    
    // Convertir de vuelta a letra
    if (average >= 3.85) return 'A+';
    if (average >= 3.50) return 'A';
    if (average >= 3.15) return 'A-';
    if (average >= 2.85) return 'B+';
    if (average >= 2.50) return 'B';
    if (average >= 2.15) return 'B-';
    if (average >= 1.85) return 'C+';
    if (average >= 1.50) return 'C';
    if (average >= 1.15) return 'C-';
    if (average >= 0.50) return 'D';
    return 'F';
  }

  /**
   * Analiza problemas comunes
   * @param {Array} reports - Lista de reportes
   * @returns {Array} Problemas más frecuentes
   */
  analyzeCommonIssues(reports) {
    const issues = {};
    
    reports.forEach(report => {
      Object.values(report.validation.validations || {}).forEach(validation => {
        (validation.errors || []).forEach(error => {
          issues[error] = (issues[error] || 0) + 1;
        });
      });
    });

    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count, percentage: (count / reports.length * 100).toFixed(1) }));
  }

  /**
   * Analiza tendencias temporales
   * @param {Array} reports - Lista de reportes
   * @returns {Object} Análisis de tendencias
   */
  analyzeTrends(reports) {
    const last7Days = reports.filter(r => {
      const reportDate = new Date(r.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate > weekAgo;
    });

    return {
      reportsLast7Days: last7Days.length,
      successRateLast7Days: last7Days.length > 0 ? 
        last7Days.filter(r => r.validation.isValid).length / last7Days.length : 0,
      trend: last7Days.length > reports.length * 0.1 ? 'increasing' : 'stable'
    };
  }
}