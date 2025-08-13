// rollback-recovery-system.js - SISTEMA DE ROLLBACK Y RECUPERACIÓN AUTOMÁTICA
// Permite revertir cambios y recuperar el sistema ante fallos críticos

class RollbackRecoverySystem {
    constructor() {
        this.snapshots = new Map();
        this.recoveryPoints = [];
        this.maxSnapshots = 10;
        this.maxRecoveryPoints = 5;
        this.isRecovering = false;
        
        this.systemStates = {
            pristine: 'pristine',        // Estado inicial limpio
            initializing: 'initializing', // En proceso de inicialización
            operational: 'operational',   // Funcionando normalmente
            degraded: 'degraded',        // Funcionando con problemas
            critical: 'critical',        // Estado crítico
            recovering: 'recovering'     // En proceso de recuperación
        };
        
        this.currentState = this.systemStates.pristine;
        this.lastKnownGoodState = null;
        
        this.setupRecoverySystem();
        this.createInitialSnapshot();
        
        console.log('🔄 [RECOVERY] Sistema de rollback y recuperación inicializado');
    }

    setupRecoverySystem() {
        // Crear punto de recuperación cada 5 minutos en modo operacional
        setInterval(() => {
            if (this.currentState === this.systemStates.operational) {
                this.createRecoveryPoint('automatic_checkpoint');
            }
        }, 5 * 60 * 1000);

        // Escuchar eventos críticos para crear snapshots
        this.setupCriticalEventListeners();
        
        // Verificar integridad del sistema periódicamente
        setInterval(() => {
            this.performIntegrityCheck();
        }, 30000); // Cada 30 segundos

        console.log('⚙️ [RECOVERY] Sistema de recuperación configurado');
    }

    setupCriticalEventListeners() {
        // Capturar eventos que requieren snapshots
        window.addEventListener('beforeunload', () => {
            this.createSnapshot('before_unload', 'Estado antes de salir de la página');
        });

        // Snapshot antes de cambios críticos
        if (window.systemManager) {
            const originalRegister = window.systemManager.register;
            window.systemManager.register = (...args) => {
                this.createSnapshot('before_module_register', `Antes de registrar módulo: ${args[0]}`);
                return originalRegister.apply(window.systemManager, args);
            };
        }

        console.log('🎯 [RECOVERY] Event listeners críticos configurados');
    }

    createInitialSnapshot() {
        const initialState = this.captureSystemState();
        this.snapshots.set('initial', {
            timestamp: Date.now(),
            description: 'Estado inicial del sistema',
            state: initialState,
            type: 'initial'
        });
        
        console.log('📸 [RECOVERY] Snapshot inicial creado');
    }

    createSnapshot(key, description = '') {
        try {
            const snapshot = {
                timestamp: Date.now(),
                description: description || `Snapshot ${key}`,
                state: this.captureSystemState(),
                type: 'manual',
                systemState: this.currentState
            };

            this.snapshots.set(key, snapshot);
            
            // Mantener solo los últimos N snapshots
            if (this.snapshots.size > this.maxSnapshots) {
                const oldestKey = Array.from(this.snapshots.keys())[0];
                if (oldestKey !== 'initial') { // Nunca eliminar el snapshot inicial
                    this.snapshots.delete(oldestKey);
                }
            }

            console.log(`📸 [RECOVERY] Snapshot creado: ${key} - ${description}`);
            return true;
            
        } catch (error) {
            console.error('❌ [RECOVERY] Error creando snapshot:', error);
            return false;
        }
    }

    createRecoveryPoint(reason = 'manual') {
        try {
            const recoveryPoint = {
                id: this.generateRecoveryId(),
                timestamp: Date.now(),
                reason: reason,
                systemState: this.currentState,
                snapshot: this.captureSystemState(),
                metrics: this.captureMetrics(),
                validationResults: this.performSystemValidation()
            };

            this.recoveryPoints.push(recoveryPoint);
            
            // Mantener solo los últimos N puntos de recuperación
            if (this.recoveryPoints.length > this.maxRecoveryPoints) {
                this.recoveryPoints.shift();
            }

            // Marcar como último estado bueno conocido si el sistema está bien
            if (this.currentState === this.systemStates.operational) {
                this.lastKnownGoodState = recoveryPoint;
            }

            console.log(`💾 [RECOVERY] Punto de recuperación creado: ${recoveryPoint.id} (${reason})`);
            return recoveryPoint.id;
            
        } catch (error) {
            console.error('❌ [RECOVERY] Error creando punto de recuperación:', error);
            return null;
        }
    }

    captureSystemState() {
        return {
            // Estado del DOM crítico
            dom: this.captureDOMState(),
            
            // Estado de JavaScript global
            globals: this.captureGlobalState(),
            
            // Estado del localStorage
            storage: this.captureStorageState(),
            
            // Configuración del sistema
            config: this.captureConfigState(),
            
            // Estado de los módulos
            modules: this.captureModuleState()
        };
    }

    captureDOMState() {
        const criticalElements = [
            'quotationNumber',
            'quotationDate', 
            'addProductBtn',
            'quotationForm',
            'productsList'
        ];

        const domState = {};
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                domState[id] = {
                    exists: true,
                    visible: element.offsetParent !== null,
                    value: element.value || element.textContent || '',
                    className: element.className,
                    disabled: element.disabled || false
                };
            } else {
                domState[id] = { exists: false };
            }
        });

        return domState;
    }

    captureGlobalState() {
        return {
            systemManager: typeof window.systemManager === 'object',
            quotationSystemReady: window.quotationSystemReady || false,
            authSystemInitialized: window.authSystemInitialized || false,
            quotationDB: typeof window.quotationDB === 'object',
            initializeQuotationSystem: typeof window.initializeQuotationSystem === 'function',
            realTimeMonitor: typeof window.realTimeMonitor === 'object'
        };
    }

    captureStorageState() {
        const storageState = {};
        
        // Capturar claves relacionadas con cotizaciones
        const relevantKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('ciaociao') || key.includes('cotiz'))) {
                relevantKeys.push(key);
            }
        }

        relevantKeys.forEach(key => {
            try {
                storageState[key] = localStorage.getItem(key);
            } catch (e) {
                storageState[key] = null;
            }
        });

        return storageState;
    }

    captureConfigState() {
        return {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            systemState: this.currentState
        };
    }

    captureModuleState() {
        const moduleState = {};
        
        if (window.systemManager) {
            moduleState.systemManager = {
                available: true,
                initialized: window.systemManager.initialized || new Set(),
                modules: window.systemManager.modules ? window.systemManager.modules.size : 0
            };
        }

        if (window.realTimeMonitor) {
            moduleState.monitoring = {
                active: window.realTimeMonitor.monitoring.active,
                errorCount: window.realTimeMonitor.monitoring.errorCount,
                healthScore: window.realTimeMonitor.metrics.systemHealth.healthScore
            };
        }

        return moduleState;
    }

    captureMetrics() {
        const metrics = {
            performance: {},
            errors: [],
            memory: null
        };

        // Métricas de rendimiento
        if (performance.timing) {
            metrics.performance.navigation = {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            };
        }

        // Métricas de memoria
        if (performance.memory) {
            metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }

        // Errores recientes del monitor
        if (window.realTimeMonitor) {
            metrics.errors = window.realTimeMonitor.getRecentErrors(5); // Últimos 5 minutos
        }

        return metrics;
    }

    performSystemValidation() {
        const validations = [];

        // Validar elementos DOM críticos
        const criticalElements = ['quotationNumber', 'addProductBtn', 'quotationForm'];
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            validations.push({
                check: `dom_element_${id}`,
                passed: element && element.offsetParent !== null,
                message: element ? 'Elemento encontrado' : 'Elemento no encontrado'
            });
        });

        // Validar funciones críticas
        const criticalFunctions = [
            'initializeQuotationSystem',
            'generateQuotationNumber',
            'showAddProductModal'
        ];
        
        criticalFunctions.forEach(funcName => {
            validations.push({
                check: `function_${funcName}`,
                passed: typeof window[funcName] === 'function',
                message: typeof window[funcName] === 'function' ? 'Función disponible' : 'Función no disponible'
            });
        });

        // Validar estado del sistema
        validations.push({
            check: 'system_state',
            passed: this.currentState === this.systemStates.operational,
            message: `Estado actual: ${this.currentState}`
        });

        const passedChecks = validations.filter(v => v.passed).length;
        const totalChecks = validations.length;
        const successRate = (passedChecks / totalChecks) * 100;

        return {
            validations,
            passedChecks,
            totalChecks,
            successRate,
            overall: successRate >= 80 ? 'healthy' : successRate >= 60 ? 'degraded' : 'critical'
        };
    }

    performIntegrityCheck() {
        if (this.isRecovering) return;

        const validation = this.performSystemValidation();
        const previousState = this.currentState;

        // Determinar nuevo estado basado en validaciones
        if (validation.successRate >= 90) {
            this.currentState = this.systemStates.operational;
        } else if (validation.successRate >= 60) {
            this.currentState = this.systemStates.degraded;
        } else {
            this.currentState = this.systemStates.critical;
        }

        // Si el estado empeoró significativamente, crear snapshot de emergencia
        if (previousState === this.systemStates.operational && 
            this.currentState === this.systemStates.critical) {
            this.createSnapshot('integrity_failure', 'Falla de integridad detectada');
            this.initiateEmergencyRecovery();
        }

        // Crear punto de recuperación si el sistema está estable
        if (this.currentState === this.systemStates.operational && 
            previousState !== this.systemStates.operational) {
            this.createRecoveryPoint('system_stabilized');
        }
    }

    async rollbackToSnapshot(snapshotKey) {
        console.log(`🔄 [RECOVERY] Iniciando rollback a snapshot: ${snapshotKey}`);
        this.isRecovering = true;
        this.currentState = this.systemStates.recovering;

        try {
            const snapshot = this.snapshots.get(snapshotKey);
            if (!snapshot) {
                throw new Error(`Snapshot ${snapshotKey} no encontrado`);
            }

            // Restaurar estado del localStorage
            await this.restoreStorageState(snapshot.state.storage);
            
            // Restaurar estado del DOM
            await this.restoreDOMState(snapshot.state.dom);
            
            // Reinicializar módulos si es necesario
            await this.restoreModuleState(snapshot.state.modules);

            // Validar recuperación
            const validation = this.performSystemValidation();
            if (validation.successRate >= 70) {
                this.currentState = this.systemStates.operational;
                console.log(`✅ [RECOVERY] Rollback exitoso a ${snapshotKey}`);
                return true;
            } else {
                throw new Error('Validación post-rollback falló');
            }

        } catch (error) {
            console.error('❌ [RECOVERY] Error en rollback:', error);
            this.currentState = this.systemStates.critical;
            return false;
        } finally {
            this.isRecovering = false;
        }
    }

    async rollbackToLastGoodState() {
        if (!this.lastKnownGoodState) {
            console.warn('⚠️ [RECOVERY] No hay último estado bueno conocido');
            return this.rollbackToSnapshot('initial');
        }

        console.log('🔄 [RECOVERY] Rollback al último estado bueno conocido');
        return this.rollbackToRecoveryPoint(this.lastKnownGoodState.id);
    }

    async rollbackToRecoveryPoint(recoveryId) {
        const recoveryPoint = this.recoveryPoints.find(rp => rp.id === recoveryId);
        if (!recoveryPoint) {
            console.error(`❌ [RECOVERY] Punto de recuperación ${recoveryId} no encontrado`);
            return false;
        }

        // Crear snapshot temporal antes del rollback
        this.createSnapshot('pre_rollback', `Estado antes de rollback a ${recoveryId}`);

        // Restaurar desde el punto de recuperación
        return this.restoreFromRecoveryPoint(recoveryPoint);
    }

    async restoreStorageState(storageState) {
        console.log('🗄️ [RECOVERY] Restaurando estado del localStorage...');
        
        // Limpiar storage relacionado con cotizaciones
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('ciaociao') || key.includes('cotiz'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Restaurar desde snapshot
        Object.entries(storageState).forEach(([key, value]) => {
            if (value !== null) {
                localStorage.setItem(key, value);
            }
        });
    }

    async restoreDOMState(domState) {
        console.log('🏗️ [RECOVERY] Restaurando estado del DOM...');
        
        Object.entries(domState).forEach(([elementId, state]) => {
            if (state.exists) {
                const element = document.getElementById(elementId);
                if (element) {
                    if (element.value !== undefined) {
                        element.value = state.value;
                    }
                    if (state.className) {
                        element.className = state.className;
                    }
                    if (state.disabled !== undefined) {
                        element.disabled = state.disabled;
                    }
                }
            }
        });
    }

    async restoreModuleState(moduleState) {
        console.log('📦 [RECOVERY] Restaurando estado de módulos...');
        
        // Reinicializar sistema de cotizaciones si es necesario
        if (moduleState.systemManager && window.systemManager) {
            try {
                await window.systemManager.initializePage();
            } catch (error) {
                console.error('❌ [RECOVERY] Error reinicializando módulos:', error);
            }
        }
    }

    async restoreFromRecoveryPoint(recoveryPoint) {
        console.log(`🔄 [RECOVERY] Restaurando desde punto de recuperación: ${recoveryPoint.id}`);
        this.isRecovering = true;
        this.currentState = this.systemStates.recovering;

        try {
            // Restaurar desde el snapshot del punto de recuperación
            await this.restoreStorageState(recoveryPoint.snapshot.storage);
            await this.restoreDOMState(recoveryPoint.snapshot.dom);
            await this.restoreModuleState(recoveryPoint.snapshot.modules);

            // Validar recuperación
            const validation = this.performSystemValidation();
            if (validation.successRate >= 70) {
                this.currentState = this.systemStates.operational;
                console.log(`✅ [RECOVERY] Recuperación exitosa desde ${recoveryPoint.id}`);
                return true;
            } else {
                throw new Error('Validación post-recuperación falló');
            }

        } catch (error) {
            console.error('❌ [RECOVERY] Error en recuperación:', error);
            this.currentState = this.systemStates.critical;
            return false;
        } finally {
            this.isRecovering = false;
        }
    }

    async initiateEmergencyRecovery() {
        console.error('🆘 [RECOVERY] RECUPERACIÓN DE EMERGENCIA ACTIVADA');
        
        // Intentar recuperación en orden de prioridad
        const recoveryStrategies = [
            () => this.rollbackToLastGoodState(),
            () => this.rollbackToSnapshot('initial'),
            () => this.performFactoryReset()
        ];

        for (const strategy of recoveryStrategies) {
            try {
                const success = await strategy();
                if (success) {
                    console.log('✅ [RECOVERY] Recuperación de emergencia exitosa');
                    return true;
                }
            } catch (error) {
                console.error('❌ [RECOVERY] Estrategia de recuperación falló:', error);
            }
        }

        console.error('❌ [RECOVERY] TODAS LAS ESTRATEGIAS DE RECUPERACIÓN FALLARON');
        this.showCriticalFailureMessage();
        return false;
    }

    async performFactoryReset() {
        console.log('🏭 [RECOVERY] Ejecutando reset de fábrica...');
        
        // Limpiar completamente localStorage de cotizaciones
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('ciaociao') || key.includes('cotiz'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Recargar página completamente
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);

        return true;
    }

    showCriticalFailureMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
                z-index: 99999; color: white; font-family: Arial, sans-serif; text-align: center;
            ">
                <div style="background: #e74c3c; padding: 40px; border-radius: 10px; max-width: 500px;">
                    <h2>🆘 Falla Crítica del Sistema</h2>
                    <p>El sistema no pudo recuperarse automáticamente. Se requiere intervención manual.</p>
                    <button onclick="window.location.reload()" style="
                        background: white; color: #e74c3c; border: none; padding: 15px 30px;
                        border-radius: 5px; font-weight: bold; cursor: pointer; margin: 10px;
                    ">Recargar Página</button>
                    <button onclick="localStorage.clear(); window.location.reload()" style="
                        background: #c0392b; color: white; border: none; padding: 15px 30px;
                        border-radius: 5px; font-weight: bold; cursor: pointer; margin: 10px;
                    ">Reset Completo</button>
                </div>
            </div>
        `;
        document.body.appendChild(messageDiv);
    }

    generateRecoveryId() {
        return 'recovery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Métodos públicos para debugging y control manual
    getSnapshots() {
        return Array.from(this.snapshots.entries()).map(([key, snapshot]) => ({
            key,
            timestamp: snapshot.timestamp,
            description: snapshot.description,
            type: snapshot.type
        }));
    }

    getRecoveryPoints() {
        return this.recoveryPoints.map(rp => ({
            id: rp.id,
            timestamp: rp.timestamp,
            reason: rp.reason,
            systemState: rp.systemState,
            successRate: rp.validationResults.successRate
        }));
    }

    getCurrentState() {
        return {
            state: this.currentState,
            isRecovering: this.isRecovering,
            hasLastGoodState: !!this.lastKnownGoodState,
            snapshotCount: this.snapshots.size,
            recoveryPointCount: this.recoveryPoints.length
        };
    }

    // Limpiar recursos
    cleanup() {
        this.snapshots.clear();
        this.recoveryPoints = [];
        this.currentState = this.systemStates.pristine;
        this.lastKnownGoodState = null;
        
        console.log('🧹 [RECOVERY] Sistema de recuperación limpiado');
    }
}

// Crear instancia global automáticamente
if (typeof window !== 'undefined' && !window.rollbackRecovery) {
    window.rollbackRecovery = new RollbackRecoverySystem();
    
    // Exponer funciones útiles para debugging
    window.createSystemSnapshot = (key, desc) => window.rollbackRecovery.createSnapshot(key, desc);
    window.rollbackToSnapshot = (key) => window.rollbackRecovery.rollbackToSnapshot(key);
    window.getSystemSnapshots = () => window.rollbackRecovery.getSnapshots();
    window.emergencyRecovery = () => window.rollbackRecovery.initiateEmergencyRecovery();
    
    console.log('🔄 [RECOVERY] Sistema de rollback y recuperación activado globalmente');
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RollbackRecoverySystem;
}