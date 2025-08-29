// Global Teardown para 20 Agentes Context7
// Consolidación final de resultados reales

import fs from 'fs';
import path from 'path';
import { Context720AgentsConfig } from '../context7/context7-20-agents.config.js';

async function globalTeardown() {
  console.log('🏁 [20-AGENTS] Iniciando teardown global...');
  
  const teardownStartTime = Date.now();

  try {
    // 1. Consolidar resultados de todos los agentes
    const consolidatedResults = await consolidateAgentResults();
    
    // 2. Generar reporte final
    const finalReport = await generateFinalReport(consolidatedResults);
    
    // 3. Análisis de fallos críticos
    const criticalAnalysis = analyzeCriticalFailures(consolidatedResults);
    
    // 4. Generar dashboard HTML
    await generateHTMLDashboard(finalReport, criticalAnalysis);
    
    // 5. Crear resumen ejecutivo
    const executiveSummary = createExecutiveSummary(finalReport, criticalAnalysis);
    
    // 6. Limpiar archivos temporales
    cleanupTemporaryFiles();

    const teardownTime = Date.now() - teardownStartTime;
    console.log(`✅ [20-AGENTS] Teardown completado en ${teardownTime}ms`);
    
    // Log resumen final
    logExecutionSummary(executiveSummary);
    
    return {
      success: true,
      teardownTime,
      finalReport,
      criticalAnalysis,
      executiveSummary
    };

  } catch (error) {
    console.error('❌ [20-AGENTS] Error en teardown global:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function consolidateAgentResults() {
  console.log('📊 [20-AGENTS] Consolidando resultados de agentes...');
  
  const baseDir = Context720AgentsConfig.master.outputDir;
  const consolidatedResults = {
    metadata: {
      consolidatedAt: new Date().toISOString(),
      totalAgents: 20,
      executionEnvironment: 'production'
    },
    agentResults: {},
    overallMetrics: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0,
      totalDuration: 0,
      avgDuration: 0
    },
    criticalFindings: [],
    pdfValidation: {
      successfulGenerations: 0,
      failedGenerations: 0,
      downloadedFiles: []
    },
    currencyFormatting: {
      correctFormatting: 0,
      truncationIssues: 0,
      problemAmounts: []
    }
  };
  
  // Consolidar resultados por agente
  for (let i = 1; i <= 20; i++) {
    const agentDir = path.join(baseDir, `agent-${i}`);
    const resultFile = path.join(agentDir, 'results.json');
    
    if (fs.existsSync(resultFile)) {
      try {
        const agentResults = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        consolidatedResults.agentResults[`agent-${i}`] = agentResults;
        
        // Agregar a métricas globales
        consolidatedResults.overallMetrics.totalTests += agentResults.totalTests || 0;
        consolidatedResults.overallMetrics.passedTests += agentResults.passedTests || 0;
        consolidatedResults.overallMetrics.failedTests += agentResults.failedTests || 0;
        consolidatedResults.overallMetrics.totalDuration += agentResults.duration || 0;
        
        // Identificar fallos críticos
        if (agentResults.criticalFailures && agentResults.criticalFailures.length > 0) {
          consolidatedResults.criticalFindings.push({
            agent: i,
            failures: agentResults.criticalFailures
          });
        }
        
      } catch (error) {
        console.warn(`⚠️ Error leyendo resultados de agent-${i}: ${error.message}`);
      }
    } else {
      console.warn(`⚠️ No se encontraron resultados para agent-${i}`);
    }
  }
  
  // Calcular métricas finales
  if (consolidatedResults.overallMetrics.totalTests > 0) {
    consolidatedResults.overallMetrics.successRate = 
      consolidatedResults.overallMetrics.passedTests / consolidatedResults.overallMetrics.totalTests;
    consolidatedResults.overallMetrics.avgDuration = 
      consolidatedResults.overallMetrics.totalDuration / 20; // 20 agentes
  }
  
  // Guardar resultados consolidados
  const consolidatedPath = path.join(baseDir, 'consolidated', 'all-agents-results.json');
  fs.writeFileSync(consolidatedPath, JSON.stringify(consolidatedResults, null, 2));
  
  console.log(`  ✅ Resultados consolidados: ${Object.keys(consolidatedResults.agentResults).length} agentes`);
  return consolidatedResults;
}

async function generateFinalReport(consolidatedResults) {
  console.log('📋 [20-AGENTS] Generando reporte final...');
  
  const finalReport = {
    metadata: {
      reportGenerated: new Date().toISOString(),
      validationType: 'Real Production Validation (No Simulation)',
      environment: Context720AgentsConfig.environment.productionURL
    },
    
    executionSummary: {
      totalAgents: 20,
      completedAgents: Object.keys(consolidatedResults.agentResults).length,
      overallSuccessRate: consolidatedResults.overallMetrics.successRate,
      totalExecutionTime: consolidatedResults.overallMetrics.totalDuration,
      averageAgentTime: consolidatedResults.overallMetrics.avgDuration
    },
    
    groupResults: analyzeGroupPerformance(consolidatedResults),
    
    criticalSystemFindings: {
      pdfGenerationStatus: analyzePDFGeneration(consolidatedResults),
      currencyFormattingStatus: analyzeCurrencyFormatting(consolidatedResults),
      userExperienceStatus: analyzeUserExperience(consolidatedResults),
      systemReliabilityStatus: analyzeSystemReliability(consolidatedResults)
    },
    
    businessImpact: calculateBusinessImpact(consolidatedResults),
    
    prioritizedRecommendations: generateRecommendations(consolidatedResults),
    
    evidenceFiles: collectEvidenceFiles()
  };
  
  const reportPath = path.join(Context720AgentsConfig.master.outputDir, 'consolidated', 'final-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  
  console.log(`  ✅ Reporte final generado: ${reportPath}`);
  return finalReport;
}

function analyzeGroupPerformance(consolidatedResults) {
  const groupPerformance = {
    'group1-pdf-core': { agents: [1,2,3,4,5], successRate: 0, criticalIssues: [] },
    'group2-currency': { agents: [6,7,8,9,10], successRate: 0, criticalIssues: [] },
    'group3-reliability': { agents: [11,12,13,14,15], successRate: 0, criticalIssues: [] },
    'group4-ux-business': { agents: [16,17,18,19,20], successRate: 0, criticalIssues: [] }
  };
  
  Object.entries(groupPerformance).forEach(([groupName, groupData]) => {
    let groupPassed = 0, groupTotal = 0;
    
    groupData.agents.forEach(agentId => {
      const agentResults = consolidatedResults.agentResults[`agent-${agentId}`];
      if (agentResults) {
        groupPassed += agentResults.passedTests || 0;
        groupTotal += agentResults.totalTests || 0;
      }
    });
    
    groupData.successRate = groupTotal > 0 ? groupPassed / groupTotal : 0;
  });
  
  return groupPerformance;
}

function analyzePDFGeneration(consolidatedResults) {
  // Analizar agentes 1-5 (Core PDF)
  const pdfAgents = [1, 2, 3, 4, 5];
  let pdfIssues = [];
  
  pdfAgents.forEach(agentId => {
    const agentResults = consolidatedResults.agentResults[`agent-${agentId}`];
    if (agentResults && agentResults.criticalFailures) {
      pdfIssues.push(...agentResults.criticalFailures);
    }
  });
  
  return {
    status: pdfIssues.length === 0 ? 'WORKING' : 'CRITICAL_ISSUES',
    issues: pdfIssues,
    recommendation: pdfIssues.length > 0 ? 'IMMEDIATE_FIX_REQUIRED' : 'MONITORING'
  };
}

function analyzeCurrencyFormatting(consolidatedResults) {
  // Analizar agentes 6-10 (Currency)
  const currencyAgents = [6, 7, 8, 9, 10];
  let currencyIssues = [];
  
  currencyAgents.forEach(agentId => {
    const agentResults = consolidatedResults.agentResults[`agent-${agentId}`];
    if (agentResults && agentResults.currencyErrors) {
      currencyIssues.push(...agentResults.currencyErrors);
    }
  });
  
  return {
    status: currencyIssues.length === 0 ? 'WORKING' : 'ISSUES_DETECTED',
    issues: currencyIssues,
    recommendation: currencyIssues.length > 0 ? 'FIX_REQUIRED' : 'MONITORING'
  };
}

function analyzeUserExperience(consolidatedResults) {
  // Analizar agentes 16-20 (UX & Business)
  const uxAgents = [16, 17, 18, 19, 20];
  let uxIssues = [];
  
  uxAgents.forEach(agentId => {
    const agentResults = consolidatedResults.agentResults[`agent-${agentId}`];
    if (agentResults && agentResults.uxProblems) {
      uxIssues.push(...agentResults.uxProblems);
    }
  });
  
  return {
    status: uxIssues.length === 0 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
    issues: uxIssues,
    recommendation: uxIssues.length > 0 ? 'UX_IMPROVEMENTS' : 'CONTINUE_MONITORING'
  };
}

function analyzeSystemReliability(consolidatedResults) {
  // Analizar agentes 11-15 (Reliability)
  const reliabilityAgents = [11, 12, 13, 14, 15];
  let reliabilityIssues = [];
  
  reliabilityAgents.forEach(agentId => {
    const agentResults = consolidatedResults.agentResults[`agent-${agentId}`];
    if (agentResults && agentResults.systemErrors) {
      reliabilityIssues.push(...agentResults.systemErrors);
    }
  });
  
  return {
    status: reliabilityIssues.length === 0 ? 'STABLE' : 'UNSTABLE',
    issues: reliabilityIssues,
    recommendation: reliabilityIssues.length > 0 ? 'STABILITY_IMPROVEMENTS' : 'CONTINUE_MONITORING'
  };
}

function calculateBusinessImpact(consolidatedResults) {
  const criticalFailures = consolidatedResults.criticalFindings.length;
  const overallSuccessRate = consolidatedResults.overallMetrics.successRate;
  
  let businessImpact = 'LOW';
  let recommendations = [];
  
  if (criticalFailures > 5 || overallSuccessRate < 0.5) {
    businessImpact = 'CRITICAL';
    recommendations.push('IMMEDIATE_SYSTEM_SHUTDOWN_REQUIRED');
  } else if (criticalFailures > 2 || overallSuccessRate < 0.7) {
    businessImpact = 'HIGH';
    recommendations.push('URGENT_FIXES_REQUIRED');
  } else if (criticalFailures > 0 || overallSuccessRate < 0.9) {
    businessImpact = 'MEDIUM';
    recommendations.push('SCHEDULED_FIXES_RECOMMENDED');
  }
  
  return {
    impact: businessImpact,
    criticalFailureCount: criticalFailures,
    successRate: overallSuccessRate,
    recommendations
  };
}

function generateRecommendations(consolidatedResults) {
  const recommendations = [];
  
  // Basado en análisis de resultados
  const criticalCount = consolidatedResults.criticalFindings.length;
  const successRate = consolidatedResults.overallMetrics.successRate;
  
  if (successRate < 0.5) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'DISABLE_PDF_GENERATION',
      reason: 'Sistema con menos del 50% de éxito'
    });
  }
  
  if (criticalCount > 3) {
    recommendations.push({
      priority: 'HIGH',
      action: 'EMERGENCY_SYSTEM_REVIEW',
      reason: `${criticalCount} fallos críticos detectados`
    });
  }
  
  return recommendations;
}

function collectEvidenceFiles() {
  const baseDir = Context720AgentsConfig.master.outputDir;
  const evidenceFiles = [];
  
  // Recopilar PDFs generados
  for (let i = 1; i <= 20; i++) {
    const agentDir = path.join(baseDir, `agent-${i}`, 'downloads');
    if (fs.existsSync(agentDir)) {
      const files = fs.readdirSync(agentDir);
      files.forEach(file => {
        if (file.endsWith('.pdf')) {
          evidenceFiles.push({
            type: 'PDF',
            agent: i,
            file: path.join(agentDir, file)
          });
        }
      });
    }
  }
  
  return evidenceFiles;
}

function analyzeCriticalFailures(consolidatedResults) {
  const criticalAnalysis = {
    totalCriticalFailures: consolidatedResults.criticalFindings.length,
    failuresByCategory: {},
    mostProblematicAgent: null,
    systemStatus: 'UNKNOWN'
  };
  
  // Determinar estado general del sistema
  if (criticalAnalysis.totalCriticalFailures === 0) {
    criticalAnalysis.systemStatus = 'HEALTHY';
  } else if (criticalAnalysis.totalCriticalFailures <= 2) {
    criticalAnalysis.systemStatus = 'MINOR_ISSUES';
  } else if (criticalAnalysis.totalCriticalFailures <= 5) {
    criticalAnalysis.systemStatus = 'SIGNIFICANT_ISSUES';
  } else {
    criticalAnalysis.systemStatus = 'CRITICAL_SYSTEM_FAILURE';
  }
  
  return criticalAnalysis;
}

async function generateHTMLDashboard(finalReport, criticalAnalysis) {
  console.log('🎨 [20-AGENTS] Generando dashboard HTML...');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIAOCIAO - Reporte 20 Agentes</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #D4AF37; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { border-left: 5px solid #27ae60; }
        .warning { border-left: 5px solid #f39c12; }
        .error { border-left: 5px solid #e74c3c; }
        .metric { font-size: 2em; font-weight: bold; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 CIAOCIAO Sistema - Validación Real 20 Agentes</h1>
        <p>Reporte generado: ${finalReport.metadata.reportGenerated}</p>
        <p>Ambiente: ${finalReport.metadata.environment}</p>
    </div>

    <div class="summary">
        <div class="card ${finalReport.executionSummary.overallSuccessRate > 0.8 ? 'success' : 'error'}">
            <h3>📊 Éxito General</h3>
            <div class="metric">${Math.round(finalReport.executionSummary.overallSuccessRate * 100)}%</div>
            <p>${finalReport.executionSummary.completedAgents}/20 agentes</p>
        </div>
        
        <div class="card ${criticalAnalysis.systemStatus === 'HEALTHY' ? 'success' : 'error'}">
            <h3>🚨 Estado Sistema</h3>
            <div class="metric">${criticalAnalysis.systemStatus}</div>
            <p>${criticalAnalysis.totalCriticalFailures} fallos críticos</p>
        </div>
        
        <div class="card">
            <h3>⏱️ Tiempo Ejecución</h3>
            <div class="metric">${Math.round(finalReport.executionSummary.totalExecutionTime / 1000)}s</div>
            <p>Promedio: ${Math.round(finalReport.executionSummary.averageAgentTime / 1000)}s por agente</p>
        </div>
        
        <div class="card ${finalReport.businessImpact.impact === 'LOW' ? 'success' : 'error'}">
            <h3>💼 Impacto Negocio</h3>
            <div class="metric">${finalReport.businessImpact.impact}</div>
            <p>${finalReport.businessImpact.recommendations.length} recomendaciones</p>
        </div>
    </div>

    <div class="card">
        <h3>📋 Resultados por Grupo</h3>
        ${Object.entries(finalReport.groupResults).map(([group, data]) => `
            <p><strong>${group}:</strong> ${Math.round(data.successRate * 100)}% éxito (Agentes ${data.agents.join(', ')})</p>
        `).join('')}
    </div>

    <div class="card">
        <h3>🔍 Hallazgos Críticos del Sistema</h3>
        <p><strong>PDF Generation:</strong> ${finalReport.criticalSystemFindings.pdfGenerationStatus.status}</p>
        <p><strong>Currency Formatting:</strong> ${finalReport.criticalSystemFindings.currencyFormattingStatus.status}</p>
        <p><strong>User Experience:</strong> ${finalReport.criticalSystemFindings.userExperienceStatus.status}</p>
        <p><strong>System Reliability:</strong> ${finalReport.criticalSystemFindings.systemReliabilityStatus.status}</p>
    </div>

    <div class="card">
        <h3>📁 Archivos de Evidencia</h3>
        <p>${finalReport.evidenceFiles.length} archivos PDF generados durante las pruebas</p>
        <p>Screenshots, videos y logs disponibles en directorio de resultados</p>
    </div>

    <div class="timestamp">
        Generado por Sistema 20 Agentes Context7 - ${new Date().toISOString()}
    </div>
</body>
</html>
  `;
  
  const dashboardPath = path.join(Context720AgentsConfig.master.outputDir, 'consolidated', 'dashboard.html');
  fs.writeFileSync(dashboardPath, htmlContent);
  
  console.log(`  ✅ Dashboard HTML generado: ${dashboardPath}`);
}

function createExecutiveSummary(finalReport, criticalAnalysis) {
  return {
    headline: `Sistema CIAOCIAO - ${criticalAnalysis.systemStatus}`,
    successRate: Math.round(finalReport.executionSummary.overallSuccessRate * 100),
    criticalIssues: criticalAnalysis.totalCriticalFailures,
    businessImpact: finalReport.businessImpact.impact,
    primaryRecommendation: finalReport.prioritizedRecommendations[0]?.action || 'CONTINUE_MONITORING',
    evidenceCount: finalReport.evidenceFiles.length,
    validationType: 'Real Production Validation (No Simulation)'
  };
}

function cleanupTemporaryFiles() {
  console.log('🧹 [20-AGENTS] Limpiando archivos temporales...');
  // Limpiar solo archivos realmente temporales, conservar evidencia
}

function logExecutionSummary(summary) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN EJECUTIVO - VALIDACIÓN 20 AGENTES');
  console.log('='.repeat(80));
  console.log(`🎯 Estado del Sistema: ${summary.headline}`);
  console.log(`📈 Tasa de Éxito: ${summary.successRate}%`);
  console.log(`🚨 Issues Críticos: ${summary.criticalIssues}`);
  console.log(`💼 Impacto Negocio: ${summary.businessImpact}`);
  console.log(`🔧 Recomendación Principal: ${summary.primaryRecommendation}`);
  console.log(`📁 Archivos Evidencia: ${summary.evidenceCount} PDFs generados`);
  console.log(`✅ Tipo Validación: ${summary.validationType}`);
  console.log('='.repeat(80) + '\n');
}

export default globalTeardown;