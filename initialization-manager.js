// initialization-manager.js - BULLETPROOF SYSTEM INITIALIZATION
// Eliminates race conditions y asegura inicialización perfecta del sistema

class SystemInitializationManager {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.initialized = new Set();
        this.initPromises = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 15;
        this.startTime = performance.now();
        
        // Sistema de monitoring en tiempo real
        this.performance = {
            startTime: this.startTime,
            moduleTimings: {},
            criticalPath: [],
            errors: []
        };
        
        console.log('🚀 SystemInitializationManager iniciado - Tiempo:', new Date().toISOString());
        this.setupErrorBoundaries();
    }

    setupErrorBoundaries() {
        // Captura errores globales para debugging
        window.addEventListener('error', (event) => {
            console.error('❌ Error global capturado:', event.error);
            this.performance.errors.push({
                timestamp: performance.now() - this.startTime,
                error: event.error.message,
                stack: event.error.stack,
                filename: event.filename,
                lineno: event.lineno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promise rejection no manejada:', event.reason);
            this.performance.errors.push({
                timestamp: performance.now() - this.startTime,
                error: 'Unhandled Promise Rejection: ' + event.reason,
                type: 'promise'
            });
        });
    }

    // Registrar módulo con sus dependencias
    register(name, initFunction, dependencies = [], options = {}) {
        console.log(`📋 Registrando módulo: ${name}, dependencias: [${dependencies.join(', ')}]`);
        
        this.modules.set(name, {
            init: initFunction,
            options: {
                timeout: options.timeout || 10000,
                retryOnFailure: options.retryOnFailure !== false,
                critical: options.critical !== false,
                ...options
            }
        });
        
        this.dependencies.set(name, dependencies);
        this.retryAttempts.set(name, 0);
    }

    // Verificar si un módulo está listo para inicializar
    canInitialize(name) {
        const deps = this.dependencies.get(name) || [];
        const allDepsReady = deps.every(dep => this.initialized.has(dep));
        
        if (!allDepsReady) {
            const missingDeps = deps.filter(dep => !this.initialized.has(dep));
            console.log(`⏳ ${name} esperando dependencias: [${missingDeps.join(', ')}]`);
        }
        
        return allDepsReady;
    }

    // Inicializar módulo con manejo robusto de errores
    async initialize(name) {
        if (this.initialized.has(name)) {
            console.log(`✅ ${name} ya inicializado, retornando instancia existente`);
            return this.initPromises.get(name);
        }

        if (this.initPromises.has(name)) {
            console.log(`⏳ ${name} inicializando, esperando Promise existente`);
            return this.initPromises.get(name);
        }

        console.log(`🔄 Iniciando inicialización de ${name}...`);
        const moduleStartTime = performance.now();

        const initPromise = this.initializeModule(name, moduleStartTime);
        this.initPromises.set(name, initPromise);

        return initPromise;
    }

    async initializeModule(name, startTime) {
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`❌ Módulo ${name} no registrado`);
        }

        try {
            // Esperar dependencias
            await this.waitForDependencies(name);

            // Verificar disponibilidad de funciones críticas si es quotation system
            if (name === 'quotationSystem') {
                await this.verifyQuotationSystemReadiness();
            }

            // Ejecutar inicialización del módulo
            console.log(`🚀 Ejecutando inicialización de ${name}...`);
            const result = await this.executeWithTimeout(module.init, module.options.timeout, name);

            // Marcar como inicializado
            this.initialized.add(name);
            const duration = performance.now() - startTime;
            this.performance.moduleTimings[name] = duration;
            this.performance.criticalPath.push({
                module: name,
                duration,
                timestamp: performance.now() - this.startTime
            });

            console.log(`✅ ${name} inicializado exitosamente en ${duration.toFixed(2)}ms`);
            return result;

        } catch (error) {
            console.error(`❌ Error inicializando ${name}:`, error);
            
            const attempts = this.retryAttempts.get(name);
            if (module.options.retryOnFailure && attempts < this.maxRetries) {
                this.retryAttempts.set(name, attempts + 1);
                console.log(`🔄 Reintentando ${name} (intento ${attempts + 1}/${this.maxRetries})`);
                
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
                await this.delay(delay);
                
                return this.initializeModule(name, startTime);
            }

            // Si es crítico y falló, lanzar error
            if (module.options.critical) {
                throw new Error(`❌ Módulo crítico ${name} falló después de ${attempts} intentos: ${error.message}`);
            }

            console.warn(`⚠️ Módulo no crítico ${name} falló, continuando...`);
            return null;
        }
    }

    async waitForDependencies(name) {
        const deps = this.dependencies.get(name) || [];
        
        for (const dep of deps) {
            if (!this.initialized.has(dep)) {
                console.log(`⏳ ${name} esperando dependencia ${dep}...`);
                await this.initialize(dep);
            }
        }
    }

    async verifyQuotationSystemReadiness() {
        console.log('🔍 Verificando disponibilidad del sistema de cotizaciones...');
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 10 segundos máximo
            
            const verify = () => {
                attempts++;
                
                // Verificar función principal disponible
                if (typeof window.initializeQuotationSystem !== 'function') {
                    if (attempts >= maxAttempts) {
                        reject(new Error('initializeQuotationSystem no disponible después de 10 segundos'));
                        return;
                    }
                    console.log(`⏳ Esperando initializeQuotationSystem... (${attempts}/${maxAttempts})`);
                    setTimeout(verify, 200);
                    return;
                }

                // Verificar elementos DOM críticos
                const criticalElements = [
                    'quotationForm',
                    'quotationNumber', 
                    'addProductBtn',
                    'productsList'
                ];

                const missingElements = criticalElements.filter(id => {
                    const element = document.getElementById(id);
                    return !element || element.offsetParent === null;
                });

                if (missingElements.length > 0) {
                    if (attempts >= maxAttempts) {
                        reject(new Error(`Elementos DOM críticos no disponibles: ${missingElements.join(', ')}`));
                        return;
                    }
                    console.log(`⏳ Esperando elementos DOM: [${missingElements.join(', ')}] (${attempts}/${maxAttempts})`);
                    setTimeout(verify, 200);
                    return;
                }

                console.log('✅ Sistema de cotizaciones listo para inicialización');
                resolve();
            };

            verify();
        });
    }

    executeWithTimeout(fn, timeout, moduleName) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout de ${timeout}ms excedido para ${moduleName}`));
            }, timeout);

            try {
                const result = fn();
                
                if (result instanceof Promise) {
                    result.then(
                        (value) => {
                            clearTimeout(timer);
                            resolve(value);
                        },
                        (error) => {
                            clearTimeout(timer);
                            reject(error);
                        }
                    );
                } else {
                    clearTimeout(timer);
                    resolve(result);
                }
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Detectar tipo de página actual
    detectPageType() {
        const path = window.location.pathname;
        const title = document.title;
        const bodyClass = document.body.className;

        if (path.includes('quotation-mode.html') || 
            title.includes('Cotizaciones') || 
            bodyClass.includes('quotation-mode') ||
            document.querySelector('.quotation-mode')) {
            return 'quotation';
        }

        if (path.includes('receipt-mode.html') || 
            title.includes('Recibos') || 
            bodyClass.includes('receipt-mode')) {
            return 'receipt';
        }

        if (path.includes('index.html') || 
            document.querySelector('.mode-selector-container')) {
            return 'selector';
        }

        return 'unknown';
    }

    // Inicializar página específica
    async initializePage() {
        const pageType = this.detectPageType();
        console.log(`🎯 Página detectada: ${pageType}`);

        try {
            switch (pageType) {
                case 'quotation':
                    await this.initialize('quotationSystem');
                    break;
                case 'receipt':
                    await this.initialize('receiptSystem');
                    break;
                case 'selector':
                    await this.initialize('modeSelector');
                    break;
                default:
                    console.warn(`⚠️ Tipo de página desconocido: ${pageType}`);
            }

            this.reportPerformanceMetrics();
        } catch (error) {
            console.error('❌ Error inicializando página:', error);
            this.showUserFriendlyError(error);
            throw error;
        }
    }

    reportPerformanceMetrics() {
        const totalTime = performance.now() - this.startTime;
        
        console.log('\n📊 REPORTE DE RENDIMIENTO');
        console.log('=====================================');
        console.log(`⏱️ Tiempo total de inicialización: ${totalTime.toFixed(2)}ms`);
        console.log('📈 Tiempos por módulo:');
        
        for (const [module, time] of Object.entries(this.performance.moduleTimings)) {
            console.log(`   ${module}: ${time.toFixed(2)}ms`);
        }

        if (this.performance.errors.length > 0) {
            console.log('🚨 Errores detectados:');
            this.performance.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.error}`);
            });
        }

        console.log('=====================================\n');

        // Almacenar métricas para análisis posterior
        window.systemPerformance = this.performance;
    }

    showUserFriendlyError(error) {
        // Crear modal de error amigable para el usuario
        const errorModal = document.createElement('div');
        errorModal.className = 'system-error-modal';
        errorModal.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Error del Sistema</h3>
                <p>Hubo un problema inicializando el sistema. Por favor:</p>
                <ul>
                    <li>Refresca la página (F5)</li>
                    <li>Verifica tu conexión a internet</li>
                    <li>Si el problema persiste, contacta soporte</li>
                </ul>
                <button onclick="window.location.reload()" class="btn-reload">🔄 Refrescar Página</button>
                <details>
                    <summary>Detalles técnicos</summary>
                    <pre>${error.message}</pre>
                </details>
            </div>
        `;

        // Estilos para el modal de error
        const style = document.createElement('style');
        style.textContent = `
            .system-error-modal {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            }
            .error-content {
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                text-align: center;
            }
            .btn-reload {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
            }
            .btn-reload:hover { background: #0056b3; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(errorModal);
    }

    // Método para debugging - mostrar estado del sistema
    getSystemStatus() {
        return {
            initialized: Array.from(this.initialized),
            pending: Array.from(this.modules.keys()).filter(name => !this.initialized.has(name)),
            errors: this.performance.errors,
            timings: this.performance.moduleTimings,
            totalTime: performance.now() - this.startTime
        };
    }
}

// Crear instancia global del manager
window.systemManager = new SystemInitializationManager();

console.log('✅ initialization-manager.js cargado - Sistema de inicialización robusto listo');