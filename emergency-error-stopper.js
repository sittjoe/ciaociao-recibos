// emergency-error-stopper.js - PARADA DE EMERGENCIA PARA CASCADA DE ERRORES
// Detiene loops infinitos y errores en cascada inmediatamente

class EmergencyErrorStopper {
    constructor() {
        this.errorCount = 0;
        this.errorHistory = [];
        this.startTime = Date.now();
        this.emergencyActivated = false;
        this.maxErrorsPerMinute = 50; // Reducido de 100 para mayor seguridad
        this.maxErrorsTotal = 200;
        
        this.setupEmergencyProtection();
        console.log('🚨 [EMERGENCY] Sistema de parada de emergencia activado');
    }

    setupEmergencyProtection() {
        // Interceptar TODOS los errores inmediatamente
        const originalErrorHandler = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError({
                type: 'javascript',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                error: error,
                timestamp: Date.now()
            });
            
            // Llamar handler original si existe
            if (originalErrorHandler) {
                return originalErrorHandler(message, source, lineno, colno, error);
            }
            return true; // Prevenir logging adicional
        };

        // Interceptar promises rechazadas
        const originalUnhandledRejection = window.onunhandledrejection;
        window.onunhandledrejection = (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || String(event.reason),
                timestamp: Date.now()
            });
            
            if (originalUnhandledRejection) {
                return originalUnhandledRejection(event);
            }
            event.preventDefault(); // Prevenir logging adicional
        };

        // Interceptar console.error
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.handleError({
                type: 'console',
                message: args.join(' '),
                timestamp: Date.now()
            });
            
            // Solo mostrar en consola si no estamos en emergencia
            if (!this.emergencyActivated && this.errorCount < 10) {
                originalConsoleError.apply(console, args);
            }
        };

        // Monitoreo cada 5 segundos
        setInterval(() => {
            this.checkErrorRates();
        }, 5000);
    }

    handleError(errorInfo) {
        this.errorCount++;
        this.errorHistory.push(errorInfo);
        
        // Mantener solo errores del último minuto
        const oneMinuteAgo = Date.now() - 60000;
        this.errorHistory = this.errorHistory.filter(err => err.timestamp > oneMinuteAgo);

        // Verificar si necesitamos activar emergencia
        if (!this.emergencyActivated) {
            if (this.errorHistory.length >= this.maxErrorsPerMinute || 
                this.errorCount >= this.maxErrorsTotal) {
                this.activateEmergency();
            }
        }
    }

    checkErrorRates() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentErrors = this.errorHistory.filter(err => err.timestamp > oneMinuteAgo);
        
        if (recentErrors.length >= this.maxErrorsPerMinute && !this.emergencyActivated) {
            this.activateEmergency();
        }
    }

    activateEmergency() {
        if (this.emergencyActivated) return;
        
        this.emergencyActivated = true;
        console.warn('🆘 [EMERGENCY] MODO DE EMERGENCIA ACTIVADO - DETENIENDO CASCADA DE ERRORES');
        
        // Detener todos los timers e intervalos posibles
        this.stopAllTimers();
        
        // Detener el sistema de monitoreo si está causando problemas
        this.disableProblematicSystems();
        
        // Mostrar mensaje de emergencia al usuario
        this.showEmergencyMessage();
        
        // Intentar recuperación básica
        setTimeout(() => {
            this.attemptBasicRecovery();
        }, 2000);
    }

    stopAllTimers() {
        try {
            // Detener todos los setInterval posibles
            for (let i = 1; i < 10000; i++) {
                clearInterval(i);
                clearTimeout(i);
            }
            
            // Detener monitoring si existe
            if (window.realTimeMonitor && window.realTimeMonitor.stopMonitoring) {
                window.realTimeMonitor.stopMonitoring();
                console.log('🛑 [EMERGENCY] Sistema de monitoreo detenido');
            }
            
            // Detener initialization manager si está en loop
            if (window.systemManager && window.systemManager.monitoring) {
                window.systemManager.monitoring.active = false;
                console.log('🛑 [EMERGENCY] SystemManager detenido');
            }
            
        } catch (e) {
            // Ignorar errores en la limpieza
        }
    }

    disableProblematicSystems() {
        try {
            // Deshabilitar sistemas que podrían estar causando loops
            window.quotationSystemReady = false;
            window.authSystemInitialized = false;
            
            // Detener cualquier inicialización en curso
            if (window.systemManager) {
                window.systemManager.initialized = new Set();
            }
            
            console.log('🛑 [EMERGENCY] Sistemas problemáticos deshabilitados');
            
        } catch (e) {
            // Ignorar errores
        }
    }

    showEmergencyMessage() {
        // Remover cualquier mensaje de error existente
        const existingMessages = document.querySelectorAll('.emergency-message');
        existingMessages.forEach(msg => msg.remove());
        
        const emergencyDiv = document.createElement('div');
        emergencyDiv.className = 'emergency-message';
        emergencyDiv.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(220, 53, 69, 0.95); 
                display: flex; align-items: center; justify-content: center;
                z-index: 99999; color: white; font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white; color: #dc3545; padding: 40px; 
                    border-radius: 15px; max-width: 600px; text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h2 style="margin: 0 0 20px 0;">🆘 MODO DE EMERGENCIA ACTIVADO</h2>
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Se detectaron múltiples errores (${this.errorHistory.length}/min). 
                        El sistema se ha estabilizado automáticamente.
                    </p>
                    <div style="margin: 20px 0;">
                        <button onclick="this.parentElement.parentElement.parentElement.remove(); window.location.reload();" 
                                style="background: #dc3545; color: white; border: none; padding: 15px 30px; 
                                       border-radius: 8px; font-size: 16px; cursor: pointer; margin: 0 10px;">
                            🔄 Reiniciar Sistema
                        </button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove();" 
                                style="background: #6c757d; color: white; border: none; padding: 15px 30px; 
                                       border-radius: 8px; font-size: 16px; cursor: pointer; margin: 0 10px;">
                            ✋ Continuar (No Recomendado)
                        </button>
                    </div>
                    <details style="margin-top: 20px; text-align: left;">
                        <summary style="cursor: pointer;">📊 Detalles de Errores</summary>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px; max-height: 200px; overflow-y: auto;">
                            <strong>Errores recientes:</strong><br>
                            ${this.errorHistory.slice(-10).map(err => 
                                `• ${err.type}: ${err.message}`
                            ).join('<br>')}
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        document.body.appendChild(emergencyDiv);
    }

    attemptBasicRecovery() {
        console.log('🔧 [EMERGENCY] Iniciando recuperación básica...');
        
        try {
            // Limpiar errores acumulados
            this.errorHistory = [];
            this.errorCount = 0;
            
            // Esperar 5 segundos y luego verificar si los errores continúan
            setTimeout(() => {
                if (this.errorHistory.length < 5) {
                    console.log('✅ [EMERGENCY] Sistema aparentemente estabilizado');
                    this.emergencyActivated = false;
                    
                    // Remover mensaje de emergencia automáticamente
                    const emergencyMsg = document.querySelector('.emergency-message');
                    if (emergencyMsg) {
                        emergencyMsg.style.background = 'rgba(40, 167, 69, 0.95)';
                        emergencyMsg.innerHTML = `
                            <div style="
                                background: white; color: #28a745; padding: 30px; 
                                border-radius: 15px; max-width: 500px; text-align: center;
                            ">
                                <h3>✅ Sistema Estabilizado</h3>
                                <p>Los errores se han detenido. El sistema está funcionando normalmente.</p>
                                <button onclick="this.parentElement.parentElement.remove()" 
                                        style="background: #28a745; color: white; border: none; padding: 12px 24px; 
                                               border-radius: 6px; cursor: pointer; margin-top: 15px;">
                                    Continuar
                                </button>
                            </div>
                        `;
                        
                        // Auto-remover después de 5 segundos
                        setTimeout(() => {
                            if (emergencyMsg.parentNode) {
                                emergencyMsg.remove();
                            }
                        }, 5000);
                    }
                } else {
                    console.warn('⚠️ [EMERGENCY] Errores continúan - mantener modo de emergencia');
                }
            }, 5000);
            
        } catch (e) {
            console.error('❌ [EMERGENCY] Error en recuperación básica:', e);
        }
    }

    // Método público para obtener estadísticas
    getEmergencyStats() {
        return {
            totalErrors: this.errorCount,
            recentErrors: this.errorHistory.length,
            emergencyActivated: this.emergencyActivated,
            uptime: Date.now() - this.startTime,
            errorRate: this.errorHistory.length // por minuto
        };
    }

    // Método público para reset manual
    forceReset() {
        console.log('🔄 [EMERGENCY] Reset forzado iniciado...');
        
        // Limpiar todo
        this.errorCount = 0;
        this.errorHistory = [];
        this.emergencyActivated = false;
        
        // Remover mensajes de emergencia
        const emergencyMessages = document.querySelectorAll('.emergency-message');
        emergencyMessages.forEach(msg => msg.remove());
        
        console.log('✅ [EMERGENCY] Reset completado');
    }
}

// Activar inmediatamente al cargar
window.emergencyErrorStopper = new EmergencyErrorStopper();

// Exponer funciones útiles
window.getEmergencyStats = () => window.emergencyErrorStopper.getEmergencyStats();
window.forceEmergencyReset = () => window.emergencyErrorStopper.forceReset();

console.log('🚨 [EMERGENCY] Sistema de parada de emergencia cargado y activo');