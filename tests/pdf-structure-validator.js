// tests/pdf-structure-validator.js
import fs from 'fs';
import path from 'path';

export class PDFStructureValidator {
  constructor() {
    this.requiredSections = [
      'CIAOCIAO.MX',
      'RECIBO',
      'ciaociao.mx - Fine Jewelry',
      'Tel: +52 1 55 9211 2643',
      'Información General',
      'Datos del Cliente',
      'Detalles de la Pieza',
      'TÉRMINOS Y CONDICIONES',
      'Gracias por su preferencia - ciaociao.mx'
    ];
    
    this.financialFields = [
      'Precio Base',
      'Subtotal',
      'Saldo Pendiente'
    ];
    
    this.clientFields = [
      'Nombre',
      'Teléfono'
    ];
    
    this.pieceFields = [
      'Tipo',
      'Material'
    ];
  }

  /**
   * Valida la estructura básica de un PDF de recibo
   * @param {string} pdfContent - Contenido HTML del PDF
   * @returns {Object} Resultado de validación
   */
  validateBasicStructure(pdfContent) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      missingRequiredSections: [],
      presentSections: []
    };

    // Verificar secciones requeridas
    this.requiredSections.forEach(section => {
      if (pdfContent.includes(section)) {
        results.presentSections.push(section);
      } else {
        results.missingRequiredSections.push(section);
        results.errors.push(`Sección requerida faltante: ${section}`);
        results.isValid = false;
      }
    });

    return results;
  }

  /**
   * Valida los cálculos financieros en el PDF
   * @param {Object} formData - Datos del formulario
   * @param {string} pdfContent - Contenido HTML del PDF
   * @returns {Object} Resultado de validación financiera
   */
  validateFinancialCalculations(formData, pdfContent) {
    const results = {
      isValid: true,
      errors: [],
      calculations: {}
    };

    // Calcular valores esperados
    const expectedSubtotal = formData.price + formData.contribution;
    const expectedBalance = Math.max(0, expectedSubtotal - formData.deposit);

    results.calculations = {
      expectedSubtotal,
      expectedBalance,
      formDataSubtotal: formData.subtotal,
      formDataBalance: formData.balance
    };

    // Validar subtotal
    if (Math.abs(formData.subtotal - expectedSubtotal) > 0.01) {
      results.errors.push(`Subtotal incorrecto. Esperado: ${expectedSubtotal}, Obtenido: ${formData.subtotal}`);
      results.isValid = false;
    }

    // Validar balance
    if (Math.abs(formData.balance - expectedBalance) > 0.01) {
      results.errors.push(`Balance incorrecto. Esperado: ${expectedBalance}, Obtenido: ${formData.balance}`);
      results.isValid = false;
    }

    // Verificar que los números aparezcan formateados en el PDF
    const subtotalFormatted = this.formatCurrency(expectedSubtotal);
    const balanceFormatted = this.formatCurrency(expectedBalance);

    if (!pdfContent.includes(subtotalFormatted) && !pdfContent.includes(`$${expectedSubtotal.toFixed(2)}`)) {
      results.errors.push(`Subtotal formateado no encontrado en PDF: ${subtotalFormatted}`);
      results.isValid = false;
    }

    return results;
  }

  /**
   * Valida los términos y condiciones según el estado de entrega
   * @param {Object} formData - Datos del formulario
   * @param {string} pdfContent - Contenido HTML del PDF
   * @returns {Object} Resultado de validación de términos
   */
  validateTermsAndConditions(formData, pdfContent) {
    const results = {
      isValid: true,
      errors: [],
      expectedTermsType: null,
      foundTerms: []
    };

    const isDelivered = formData.deliveryStatus === 'entregado';
    const hasBalance = parseFloat(formData.balance) > 0;

    if (isDelivered && !hasBalance) {
      // Términos para pieza entregada
      results.expectedTermsType = 'delivered';
      const deliveredTerms = [
        'El cliente ha recibido la pieza y declara estar conforme',
        'Cualquier observación debe reportarse dentro de 48 horas',
        'Garantía de por vida en mano de obra'
      ];

      deliveredTerms.forEach(term => {
        if (pdfContent.includes(term)) {
          results.foundTerms.push(term);
        } else {
          results.errors.push(`Término faltante para pieza entregada: ${term}`);
          results.isValid = false;
        }
      });

      // No deberían aparecer términos de entrega pendiente
      const pendingTerms = [
        'Los artículos no reclamados después de 30 días',
        'La entrega se realizará según fecha acordada'
      ];

      pendingTerms.forEach(term => {
        if (pdfContent.includes(term)) {
          results.errors.push(`Término inadecuado para pieza entregada: ${term}`);
          results.isValid = false;
        }
      });

    } else {
      // Términos para entrega pendiente
      results.expectedTermsType = 'pending';
      const pendingTerms = [
        'El cliente acepta las especificaciones acordadas',
        'La entrega se realizará según fecha acordada',
        'Los artículos no reclamados después de 30 días',
        'Garantía de por vida en mano de obra'
      ];

      pendingTerms.forEach(term => {
        if (pdfContent.includes(term)) {
          results.foundTerms.push(term);
        } else {
          results.errors.push(`Término faltante para entrega pendiente: ${term}`);
          results.isValid = false;
        }
      });
    }

    return results;
  }

  /**
   * Valida que el contenido no esté cortado entre páginas
   * @param {string} pdfContent - Contenido HTML del PDF
   * @returns {Object} Resultado de validación de continuidad
   */
  validateContentContinuity(pdfContent) {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Buscar indicadores de contenido cortado
    const cutIndicators = [
      /\w+\s*$/, // Texto que termina abruptamente
      /<\/div>\s*<div[^>]*>\s*<\/div>/, // Divs vacíos que podrían indicar cortes
      /style="[^"]*page-break-[^"]*"/ // Page breaks explícitos que podrían causar cortes
    ];

    // Verificar que las secciones principales estén completas
    const sections = pdfContent.split(/<h[1-6][^>]*>/);
    sections.forEach((section, index) => {
      if (section.length < 50 && index > 0) { // Secciones muy cortas podrían estar cortadas
        results.warnings.push(`Sección posiblemente cortada en índice ${index}`);
      }
    });

    // Verificar que la información financiera esté completa
    if (pdfContent.includes('Precio Base') && !pdfContent.includes('$')) {
      results.errors.push('Información financiera parece estar incompleta');
      results.isValid = false;
    }

    return results;
  }

  /**
   * Valida dimensiones y formato del PDF
   * @param {string} pdfPath - Ruta al archivo PDF
   * @returns {Object} Resultado de validación de formato
   */
  validatePDFFormat(pdfPath) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      fileInfo: {}
    };

    if (!fs.existsSync(pdfPath)) {
      results.errors.push(`Archivo PDF no encontrado: ${pdfPath}`);
      results.isValid = false;
      return results;
    }

    const stats = fs.statSync(pdfPath);
    results.fileInfo = {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };

    // Validar tamaño mínimo (PDFs muy pequeños podrían estar corruptos)
    if (stats.size < 5000) { // 5KB mínimo
      results.errors.push(`PDF demasiado pequeño (${stats.size} bytes). Posible corrupción.`);
      results.isValid = false;
    }

    // Validar tamaño máximo (PDFs muy grandes podrían tener problemas)
    if (stats.size > 10000000) { // 10MB máximo
      results.warnings.push(`PDF muy grande (${stats.size} bytes). Considerar optimización.`);
    }

    return results;
  }

  /**
   * Ejecuta validación completa de un PDF
   * @param {Object} formData - Datos del formulario
   * @param {string} pdfContent - Contenido HTML del PDF
   * @param {string} pdfPath - Ruta al archivo PDF (opcional)
   * @returns {Object} Resultado completo de validación
   */
  validateComplete(formData, pdfContent, pdfPath = null) {
    const results = {
      isValid: true,
      timestamp: new Date().toISOString(),
      formData: {
        clientName: formData.clientName,
        price: formData.price,
        contribution: formData.contribution,
        subtotal: formData.subtotal,
        balance: formData.balance,
        deliveryStatus: formData.deliveryStatus
      },
      validations: {}
    };

    // Ejecutar todas las validaciones
    results.validations.structure = this.validateBasicStructure(pdfContent);
    results.validations.financial = this.validateFinancialCalculations(formData, pdfContent);
    results.validations.terms = this.validateTermsAndConditions(formData, pdfContent);
    results.validations.continuity = this.validateContentContinuity(pdfContent);
    
    if (pdfPath) {
      results.validations.format = this.validatePDFFormat(pdfPath);
    }

    // Determinar validez general
    Object.values(results.validations).forEach(validation => {
      if (!validation.isValid) {
        results.isValid = false;
      }
    });

    // Contar errores totales
    results.totalErrors = Object.values(results.validations)
      .reduce((total, validation) => total + (validation.errors?.length || 0), 0);

    results.totalWarnings = Object.values(results.validations)
      .reduce((total, validation) => total + (validation.warnings?.length || 0), 0);

    return results;
  }

  /**
   * Formatea moneda para validación
   * @param {number} amount - Cantidad a formatear
   * @returns {string} Cantidad formateada
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Genera reporte de calidad en formato legible
   * @param {Object} validationResults - Resultados de validación completa
   * @returns {string} Reporte formateado
   */
  generateQualityReport(validationResults) {
    let report = `
PDF QUALITY REPORT - CIAOCIAO.MX
================================
Timestamp: ${validationResults.timestamp}
Cliente: ${validationResults.formData.clientName}
Overall Status: ${validationResults.isValid ? '✅ PASSED' : '❌ FAILED'}
Total Errors: ${validationResults.totalErrors}
Total Warnings: ${validationResults.totalWarnings}

`;

    Object.entries(validationResults.validations).forEach(([validationType, validation]) => {
      report += `${validationType.toUpperCase()} VALIDATION:\n`;
      report += `Status: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}\n`;
      
      if (validation.errors && validation.errors.length > 0) {
        report += `Errors:\n`;
        validation.errors.forEach(error => report += `  - ${error}\n`);
      }
      
      if (validation.warnings && validation.warnings.length > 0) {
        report += `Warnings:\n`;
        validation.warnings.forEach(warning => report += `  - ${warning}\n`);
      }
      
      report += '\n';
    });

    return report;
  }
}