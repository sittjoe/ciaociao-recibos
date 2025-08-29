// Global Setup para 20 Agentes Context7
// Preparación de entorno para validación real sin simulación

import fs from 'fs';
import path from 'path';
import { Context720AgentsConfig } from '../context7/context7-20-agents.config.js';

async function globalSetup() {
  console.log('🚀 [20-AGENTS] Iniciando configuración global para 20 agentes especializados...');
  
  const setupStartTime = Date.now();

  try {
    // 1. Crear directorios de output
    createOutputDirectories();
    
    // 2. Validar configuración de agentes
    validateAgentConfiguration();
    
    // 3. Preparar test data
    prepareTestData();
    
    // 4. Verificar acceso a producción
    await verifyProductionAccess();
    
    // 5. Configurar sistema de monitoreo
    setupMonitoringSystem();
    
    // 6. Crear manifest de ejecución
    createExecutionManifest();

    const setupTime = Date.now() - setupStartTime;
    console.log(`✅ [20-AGENTS] Setup global completado en ${setupTime}ms`);
    
    return {
      success: true,
      setupTime,
      agentCount: Context720AgentsConfig.master.totalAgents,
      outputDir: Context720AgentsConfig.master.outputDir
    };

  } catch (error) {
    console.error('❌ [20-AGENTS] Error en setup global:', error);
    throw error;
  }
}

function createOutputDirectories() {
  console.log('📁 [20-AGENTS] Creando directorios de output...');
  
  const baseDir = Context720AgentsConfig.master.outputDir;
  const directories = [
    baseDir,
    `${baseDir}/screenshots`,
    `${baseDir}/videos`, 
    `${baseDir}/traces`,
    `${baseDir}/pdfs`,
    `${baseDir}/logs`,
    `${baseDir}/reports`,
    `${baseDir}/consolidated`
  ];

  // Crear directorios para cada agente
  for (let i = 1; i <= 20; i++) {
    directories.push(`${baseDir}/agent-${i}`);
    directories.push(`${baseDir}/agent-${i}/downloads`);
    directories.push(`${baseDir}/agent-${i}/screenshots`);
    directories.push(`${baseDir}/agent-${i}/logs`);
  }

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Creado: ${dir}`);
    }
  });
}

function validateAgentConfiguration() {
  console.log('🔍 [20-AGENTS] Validando configuración de agentes...');
  
  const allAgents = [];
  Object.values(Context720AgentsConfig.agentGroups).forEach(group => {
    allAgents.push(...group.agents);
  });

  // Validar que tenemos exactamente 20 agentes
  if (allAgents.length !== 20) {
    throw new Error(`Esperados 20 agentes, encontrados ${allAgents.length}`);
  }

  // Validar IDs únicos
  const ids = allAgents.map(agent => agent.id);
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== 20) {
    throw new Error('IDs de agentes no son únicos');
  }

  // Validar que los IDs son 1-20
  const expectedIds = Array.from({length: 20}, (_, i) => i + 1);
  const sortedIds = ids.sort((a, b) => a - b);
  if (JSON.stringify(sortedIds) !== JSON.stringify(expectedIds)) {
    throw new Error('IDs de agentes no son secuenciales 1-20');
  }

  // Validar agentes críticos
  const criticalAgents = allAgents.filter(agent => agent.priority === 'CRITICAL');
  console.log(`  ✅ ${allAgents.length} agentes configurados`);
  console.log(`  ⚡ ${criticalAgents.length} agentes críticos`);
  
  // Log resumen por grupo
  Object.entries(Context720AgentsConfig.agentGroups).forEach(([groupKey, group]) => {
    console.log(`  📋 ${group.name}: ${group.agents.length} agentes`);
  });
}

function prepareTestData() {
  console.log('📊 [20-AGENTS] Preparando test data...');
  
  const testDataPath = path.join(Context720AgentsConfig.master.outputDir, 'test-data.json');
  
  // Preparar datos de test consolidados
  const consolidatedTestData = {
    timestamp: new Date().toISOString(),
    clients: Context720AgentsConfig.testData.realClients,
    amounts: Context720AgentsConfig.testData.problematicAmounts,
    products: Context720AgentsConfig.testData.products,
    
    // Test scenarios específicos por agente
    scenarios: {
      // Casos críticos para validación
      veronica_real_case: {
        client: Context720AgentsConfig.testData.realClients.veronica,
        product: Context720AgentsConfig.testData.products.veronica_real,
        amount: 39150,
        expectedPDF: true,
        priority: 'CRITICAL'
      },
      
      large_amount_test: {
        client: Context720AgentsConfig.testData.realClients.highAmount,
        product: Context720AgentsConfig.testData.products.simple,
        amount: 50000,
        expectedPDF: true,
        priority: 'HIGH'
      },
      
      currency_truncation_test: {
        client: Context720AgentsConfig.testData.realClients.veronica,
        product: Context720AgentsConfig.testData.products.simple,
        amount: 20000, // Problema conocido: $20,000.00 → $20,00
        expectedPDF: true,
        priority: 'CRITICAL'
      },
      
      complex_content_test: {
        client: Context720AgentsConfig.testData.realClients.complexName,
        product: Context720AgentsConfig.testData.products.complex,
        amount: 100000,
        expectedPDF: true,
        priority: 'MEDIUM'
      }
    }
  };
  
  fs.writeFileSync(testDataPath, JSON.stringify(consolidatedTestData, null, 2));
  console.log(`  ✅ Test data guardado en: ${testDataPath}`);
}

async function verifyProductionAccess() {
  console.log('🌐 [20-AGENTS] Verificando acceso a producción...');
  
  const productionURL = Context720AgentsConfig.environment.productionURL;
  
  try {
    // Usar fetch nativo de Node.js
    const response = await fetch(productionURL, {
      method: 'GET',
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log(`  ✅ Acceso verificado a: ${productionURL}`);
    console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    
  } catch (error) {
    console.error(`  ❌ Error accediendo a producción: ${error.message}`);
    console.warn(`  ⚠️ Continuando setup - la verificación se hará en cada agente`);
  }
}

function setupMonitoringSystem() {
  console.log('📡 [20-AGENTS] Configurando sistema de monitoreo...');
  
  const monitoringConfig = {
    enabled: true,
    realTimeUpdates: true,
    consolidatedReporting: true,
    
    metrics: {
      agentStatus: {},
      executionTimes: {},
      successRates: {},
      criticalFailures: []
    },
    
    thresholds: Context720AgentsConfig.validation,
    
    alerts: {
      criticalFailureThreshold: 3, // 3 fallos críticos = alerta
      timeoutThreshold: 120000,    // 2 minutos = timeout
      successRateThreshold: 0.7    // 70% éxito mínimo
    }
  };
  
  const monitoringPath = path.join(Context720AgentsConfig.master.outputDir, 'monitoring.json');
  fs.writeFileSync(monitoringPath, JSON.stringify(monitoringConfig, null, 2));
  
  console.log(`  ✅ Monitoreo configurado en: ${monitoringPath}`);
}

function createExecutionManifest() {
  console.log('📋 [20-AGENTS] Creando manifest de ejecución...');
  
  const manifest = {
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0',
      purpose: 'Validación real Sistema CIAOCIAO con 20 agentes especializados'
    },
    
    configuration: {
      totalAgents: Context720AgentsConfig.master.totalAgents,
      parallelExecution: Context720AgentsConfig.master.parallelExecution,
      maxConcurrent: Context720AgentsConfig.master.maxConcurrent,
      productionURL: Context720AgentsConfig.environment.productionURL
    },
    
    agents: Object.values(Context720AgentsConfig.agentGroups).flatMap(group => 
      group.agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        priority: agent.priority,
        group: group.name,
        testCases: agent.testCases,
        expectedDuration: agent.timeout
      }))
    ),
    
    execution: {
      status: 'INITIALIZED',
      startTime: null,
      endTime: null,
      results: {}
    }
  };
  
  const manifestPath = path.join(Context720AgentsConfig.master.outputDir, 'execution-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`  ✅ Manifest creado en: ${manifestPath}`);
  console.log(`  📊 ${manifest.agents.length} agentes registrados`);
}

export default globalSetup;