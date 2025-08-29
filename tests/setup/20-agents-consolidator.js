// Custom Reporter: 20 Agents Consolidator
// Consolidación en tiempo real de resultados de 20 agentes

import fs from 'fs';
import path from 'path';
import { Context720AgentsConfig } from '../context7/context7-20-agents.config.js';

class TwentyAgentsConsolidator {
  constructor(options = {}) {
    this.outputDir = Context720AgentsConfig.master.outputDir;
    this.consolidatedDir = path.join(this.outputDir, 'consolidated');
    this.realTimeResults = {
      startTime: null,
      agentStatus: {},
      completedAgents: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalFailures: []
    };
    
    this.ensureDirectories();
    console.log('🔄 [20-AGENTS-REPORTER] Consolidador inicializado');
  }

  ensureDirectories() {
    if (!fs.existsSync(this.consolidatedDir)) {
      fs.mkdirSync(this.consolidatedDir, { recursive: true });
    }
  }

  onBegin(config, suite) {
    this.realTimeResults.startTime = new Date().toISOString();
    this.realTimeResults.totalProjects = config.projects.length;
    
    console.log('🚀 [20-AGENTS-REPORTER] Iniciando validación con 20 agentes...');
    console.log(`📊 Proyectos configurados: ${config.projects.length}`);
    console.log(`🎯 URL objetivo: ${config.use?.baseURL || 'https://recibos.ciaociao.mx'}`);
    
    this.updateRealTimeStatus();
  }

  onTestBegin(test, result) {
    const agentInfo = this.extractAgentInfo(test);
    if (agentInfo) {
      this.realTimeResults.agentStatus[agentInfo.agentId] = {
        name: agentInfo.name,
        status: 'RUNNING',
        startTime: new Date().toISOString(),
        testCase: agentInfo.testCase
      };
      
      console.log(`⚡ [AGENT-${agentInfo.agentId}] Iniciando: ${agentInfo.name} - ${agentInfo.testCase}`);
      this.updateRealTimeStatus();
    }
  }

  onTestEnd(test, result) {
    const agentInfo = this.extractAgentInfo(test);
    if (agentInfo) {
      const duration = result.duration;
      const status = result.status === 'passed' ? 'COMPLETED' : 'FAILED';
      
      this.realTimeResults.agentStatus[agentInfo.agentId] = {
        ...this.realTimeResults.agentStatus[agentInfo.agentId],
        status: status,
        endTime: new Date().toISOString(),
        duration: duration,
        error: result.error?.message
      };
      
      // Actualizar contadores globales
      this.realTimeResults.totalTests++;
      if (result.status === 'passed') {
        this.realTimeResults.passedTests++;
      } else {
        this.realTimeResults.failedTests++;
        
        // Identificar fallos críticos
        if (this.isCriticalFailure(test, result)) {
          this.realTimeResults.criticalFailures.push({
            agent: agentInfo.agentId,
            testCase: agentInfo.testCase,
            error: result.error?.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      const statusIcon = status === 'COMPLETED' ? '✅' : '❌';
      console.log(`${statusIcon} [AGENT-${agentInfo.agentId}] ${status} en ${duration}ms - ${agentInfo.name}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error.message}`);
      }
      
      this.updateRealTimeStatus();
      this.saveAgentResults(agentInfo.agentId, test, result);
    }
  }

  onEnd(result) {
    this.realTimeResults.endTime = new Date().toISOString();
    this.realTimeResults.totalDuration = result.duration;
    
    const successRate = this.realTimeResults.totalTests > 0 ? 
      this.realTimeResults.passedTests / this.realTimeResults.totalTests : 0;
    
    console.log('\n' + '🏁'.repeat(40));
    console.log('📊 VALIDACIÓN 20 AGENTES - RESULTADOS FINALES');
    console.log('🏁'.repeat(40));
    console.log(`⏱️  Duración Total: ${Math.round(result.duration / 1000)}s`);
    console.log(`📈 Tests Ejecutados: ${this.realTimeResults.totalTests}`);
    console.log(`✅ Tests Exitosos: ${this.realTimeResults.passedTests}`);
    console.log(`❌ Tests Fallidos: ${this.realTimeResults.failedTests}`);
    console.log(`📊 Tasa de Éxito: ${Math.round(successRate * 100)}%`);
    console.log(`🚨 Fallos Críticos: ${this.realTimeResults.criticalFailures.length}`);
    console.log('🏁'.repeat(40));
    
    // Generar reporte final consolidado
    this.generateFinalConsolidatedReport();
    
    // Mostrar estado de agentes críticos
    this.reportCriticalAgentStatus();
    
    // Log evidencia generada
    this.logEvidenceGenerated();
  }

  extractAgentInfo(test) {
    const testTitle = test.title;
    const testFile = test.location.file;
    
    // Extraer información del agente desde el título o archivo
    const agentMatch = testTitle.match(/agent[_-]?(\d+)/i) || testFile.match(/agent[_-]?(\d+)/i);
    if (agentMatch) {
      const agentId = parseInt(agentMatch[1]);
      return {
        agentId: agentId,
        name: this.getAgentName(agentId),
        testCase: testTitle
      };
    }
    
    return null;
  }

  getAgentName(agentId) {
    // Buscar en configuración de agentes
    const allGroups = Object.values(Context720AgentsConfig.agentGroups);
    for (const group of allGroups) {
      const agent = group.agents.find(a => a.id === agentId);
      if (agent) {
        return agent.name;
      }
    }
    return `Agent-${agentId}`;
  }

  isCriticalFailure(test, result) {
    const criticalKeywords = [
      'pdf generation',
      'jspdf',
      'html2canvas', 
      'download',
      'script.js:2507',
      'currency',
      'truncation',
      'authentication'
    ];
    
    const error = result.error?.message?.toLowerCase() || '';
    const testTitle = test.title.toLowerCase();
    
    return criticalKeywords.some(keyword => 
      error.includes(keyword) || testTitle.includes(keyword)
    );
  }

  updateRealTimeStatus() {
    const statusFile = path.join(this.consolidatedDir, 'real-time-status.json');
    const currentStatus = {
      ...this.realTimeResults,
      lastUpdated: new Date().toISOString(),
      completedAgents: Object.values(this.realTimeResults.agentStatus)
        .filter(agent => agent.status === 'COMPLETED' || agent.status === 'FAILED').length,
      runningAgents: Object.values(this.realTimeResults.agentStatus)
        .filter(agent => agent.status === 'RUNNING').length
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(currentStatus, null, 2));
  }

  saveAgentResults(agentId, test, result) {
    const agentDir = path.join(this.outputDir, `agent-${agentId}`);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    const agentResults = {
      agent: agentId,
      name: this.getAgentName(agentId),
      testCase: test.title,
      status: result.status,
      duration: result.duration,
      startTime: result.startTime,
      error: result.error?.message,
      screenshots: this.collectScreenshots(agentDir),
      downloads: this.collectDownloads(agentDir),
      timestamp: new Date().toISOString(),
      
      // Métricas específicas por tipo de agente
      ...(this.extractAgentSpecificMetrics(agentId, result))
    };
    
    const resultsFile = path.join(agentDir, 'results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(agentResults, null, 2));
  }

  extractAgentSpecificMetrics(agentId, result) {
    const metrics = {};
    
    // PDF Generation metrics (agents 1-5)
    if (agentId >= 1 && agentId <= 5) {
      metrics.pdfGeneration = {
        successful: result.status === 'passed',
        errorType: result.error ? 'PDF_GENERATION_ERROR' : null
      };
    }
    
    // Currency formatting metrics (agents 6-10)
    if (agentId >= 6 && agentId <= 10) {
      metrics.currencyFormatting = {
        successful: result.status === 'passed',
        formatIssues: result.error ? ['FORMATTING_ERROR'] : []
      };
    }
    
    // System reliability metrics (agents 11-15)
    if (agentId >= 11 && agentId <= 15) {
      metrics.systemReliability = {
        stable: result.status === 'passed',
        reliabilityIssues: result.error ? ['SYSTEM_ERROR'] : []
      };
    }
    
    // UX & Business logic metrics (agents 16-20)
    if (agentId >= 16 && agentId <= 20) {
      metrics.userExperience = {
        satisfactory: result.status === 'passed',
        uxProblems: result.error ? ['UX_ERROR'] : []
      };
    }
    
    return metrics;
  }

  collectScreenshots(agentDir) {
    const screenshotDir = path.join(agentDir, 'screenshots');
    if (fs.existsSync(screenshotDir)) {
      return fs.readdirSync(screenshotDir).filter(file => file.endsWith('.png'));
    }
    return [];
  }

  collectDownloads(agentDir) {
    const downloadDir = path.join(agentDir, 'downloads');
    if (fs.existsSync(downloadDir)) {
      return fs.readdirSync(downloadDir).filter(file => file.endsWith('.pdf'));
    }
    return [];
  }

  generateFinalConsolidatedReport() {
    const finalReport = {
      summary: {
        executionTime: this.realTimeResults.endTime,
        totalDuration: this.realTimeResults.totalDuration,
        totalTests: this.realTimeResults.totalTests,
        passedTests: this.realTimeResults.passedTests,
        failedTests: this.realTimeResults.failedTests,
        successRate: this.realTimeResults.totalTests > 0 ? 
          this.realTimeResults.passedTests / this.realTimeResults.totalTests : 0,
        criticalFailures: this.realTimeResults.criticalFailures.length
      },
      agentResults: this.realTimeResults.agentStatus,
      criticalFindings: this.realTimeResults.criticalFailures,
      systemStatus: this.determineSystemStatus(),
      evidenceFiles: this.collectAllEvidence(),
      recommendations: this.generateRecommendations()
    };
    
    const reportFile = path.join(this.consolidatedDir, 'final-consolidated-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(finalReport, null, 2));
    
    console.log(`📄 Reporte consolidado generado: ${reportFile}`);
  }

  determineSystemStatus() {
    const successRate = this.realTimeResults.totalTests > 0 ? 
      this.realTimeResults.passedTests / this.realTimeResults.totalTests : 0;
    const criticalCount = this.realTimeResults.criticalFailures.length;
    
    if (criticalCount > 5 || successRate < 0.5) {
      return 'CRITICAL_SYSTEM_FAILURE';
    } else if (criticalCount > 2 || successRate < 0.7) {
      return 'SIGNIFICANT_ISSUES';
    } else if (criticalCount > 0 || successRate < 0.9) {
      return 'MINOR_ISSUES';
    } else {
      return 'SYSTEM_HEALTHY';
    }
  }

  collectAllEvidence() {
    const evidenceFiles = [];
    
    for (let i = 1; i <= 20; i++) {
      const agentDir = path.join(this.outputDir, `agent-${i}`);
      if (fs.existsSync(agentDir)) {
        // PDFs
        const downloadDir = path.join(agentDir, 'downloads');
        if (fs.existsSync(downloadDir)) {
          const pdfs = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
          pdfs.forEach(pdf => evidenceFiles.push({
            type: 'PDF',
            agent: i,
            file: path.join(downloadDir, pdf)
          }));
        }
        
        // Screenshots
        const screenshotDir = path.join(agentDir, 'screenshots');
        if (fs.existsSync(screenshotDir)) {
          const screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
          screenshots.forEach(screenshot => evidenceFiles.push({
            type: 'SCREENSHOT',
            agent: i,
            file: path.join(screenshotDir, screenshot)
          }));
        }
      }
    }
    
    return evidenceFiles;
  }

  generateRecommendations() {
    const recommendations = [];
    const systemStatus = this.determineSystemStatus();
    
    if (systemStatus === 'CRITICAL_SYSTEM_FAILURE') {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'DISABLE_SYSTEM',
        reason: 'Critical system failures detected'
      });
    }
    
    if (this.realTimeResults.criticalFailures.some(f => f.error?.includes('jsPDF'))) {
      recommendations.push({
        priority: 'HIGH',
        action: 'FIX_JSPDF_LIBRARY',
        reason: 'jsPDF library loading issues detected'
      });
    }
    
    if (this.realTimeResults.criticalFailures.some(f => f.error?.includes('currency'))) {
      recommendations.push({
        priority: 'HIGH',
        action: 'FIX_CURRENCY_FORMATTING',
        reason: 'Currency formatting issues detected'
      });
    }
    
    return recommendations;
  }

  reportCriticalAgentStatus() {
    console.log('\n🚨 ESTADO DE AGENTES CRÍTICOS:');
    
    const criticalAgentIds = [1, 2, 4, 5, 8, 16, 19, 20]; // Agentes más importantes
    
    criticalAgentIds.forEach(agentId => {
      const agentStatus = this.realTimeResults.agentStatus[agentId];
      if (agentStatus) {
        const statusIcon = agentStatus.status === 'COMPLETED' ? '✅' : '❌';
        console.log(`${statusIcon} Agent ${agentId} (${agentStatus.name}): ${agentStatus.status}`);
        if (agentStatus.error) {
          console.log(`   Error: ${agentStatus.error}`);
        }
      }
    });
  }

  logEvidenceGenerated() {
    const evidenceFiles = this.collectAllEvidence();
    const pdfCount = evidenceFiles.filter(f => f.type === 'PDF').length;
    const screenshotCount = evidenceFiles.filter(f => f.type === 'SCREENSHOT').length;
    
    console.log('\n📁 EVIDENCIA GENERADA:');
    console.log(`📄 PDFs reales descargados: ${pdfCount}`);
    console.log(`📸 Screenshots capturadas: ${screenshotCount}`);
    console.log(`📂 Directorio de evidencia: ${this.outputDir}`);
  }
}

export default TwentyAgentsConsolidator;