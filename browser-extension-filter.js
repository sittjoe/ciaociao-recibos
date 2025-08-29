/**
 * BROWSER EXTENSION FILTER - Filtro de errores de extensiones de navegador
 * Suprime errores de extensiones maliciosas que generan ruido en la consola
 * Específicamente diseñado para eliminar errores de chrome-extension://invalid/
 */

class BrowserExtensionFilter {
    constructor() {
        this.originalConsoleError = console.error;
        this.originalConsoleWarn = console.warn;
        this.originalConsoleLog = console.log;
        
        // Patrones de extensiones problemáticas
        this.extensionPatterns = [
            /chrome-extension:\/\/invalid\//gi,
            /chrome-extension:\/\/.*\/inject\.bundle\.js/gi,
            /GET chrome-extension:\/\/.*net::ERR_FAILED/gi,
            /Failed to load resource.*chrome-extension/gi,
            /moz-extension:\/\/.*\/inject/gi,
            /ms-browser-extension:\/\//gi,
            /webkit-extension:\/\//gi,
            /extension:\/\/.*\/inject/gi,
            /web-extension:\/\//gi
        ];
        
        // Patrones adicionales de ruido común
        this.noisePatterns = [
            /Non-Error promise rejection captured/gi,
            /Script error\./gi,
            /ResizeObserver loop limit exceeded/gi,
            /Canvas: trying to use a canvas that has been transferred/gi
        ];
        
        // Estadísticas de filtrado
        this.stats = {
            extensionErrorsBlocked: 0,
            noiseErrorsBlocked: 0,
            totalErrorsProcessed: 0,
            startTime: Date.now()
        };
        
        this.initializeFilter();
    }
    
    /**
     * Inicializa el filtro de consola
     */
    initializeFilter() {
        try {
            // Interceptar console.error
            console.error = (...args) => {
                if (!this.shouldBlockError(args)) {
                    this.originalConsoleError.apply(console, args);
                }
                this.stats.totalErrorsProcessed++;
            };
            
            // Interceptar console.warn
            console.warn = (...args) => {
                if (!this.shouldBlockWarning(args)) {
                    this.originalConsoleWarn.apply(console, args);
                }
                this.stats.totalErrorsProcessed++;
            };
            
            // Interceptar errores globales de ventana
            window.addEventListener('error', (event) => {
                if (this.isExtensionError(event)) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.stats.extensionErrorsBlocked++;
                    return false;
                }
            }, true); // Usar capture para interceptar antes
            
            // Interceptar promesas rechazadas
            window.addEventListener('unhandledrejection', (event) => {
                if (this.isExtensionRejection(event)) {
                    event.preventDefault();
                    this.stats.extensionErrorsBlocked++;
                }
            });
            
            console.log('🛡️ Browser Extension Filter activado - Errores de extensiones serán suprimidos');
            
        } catch (error) {
            this.originalConsoleError('❌ Error inicializando Browser Extension Filter:', error);
        }
    }
    
    /**
     * Determina si un error debe ser bloqueado
     */
    shouldBlockError(args) {
        const message = args.join(' ');
        
        // Verificar patrones de extensiones
        for (const pattern of this.extensionPatterns) {
            if (pattern.test(message)) {
                this.stats.extensionErrorsBlocked++;
                this.logBlockedError('EXTENSION', message);
                return true;
            }
        }
        
        // Verificar patrones de ruido
        for (const pattern of this.noisePatterns) {
            if (pattern.test(message)) {
                this.stats.noiseErrorsBlocked++;
                this.logBlockedError('NOISE', message);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determina si un warning debe ser bloqueado
     */
    shouldBlockWarning(args) {
        const message = args.join(' ');
        
        // Usar los mismos patrones que para errores
        return this.shouldBlockError([message]);
    }
    
    /**
     * Verifica si un error de ventana es de extensión
     */
    isExtensionError(event) {
        const source = event.filename || event.source || '';
        const message = event.message || '';
        
        // Verificar si viene de una extensión
        for (const pattern of this.extensionPatterns) {
            if (pattern.test(source) || pattern.test(message)) {
                return true;
            }
        }
        
        // Verificar URLs específicas de extensiones
        if (source.includes('chrome-extension://') || 
            source.includes('moz-extension://') ||
            source.includes('ms-browser-extension://') ||
            source.includes('webkit-extension://')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Verifica si una promesa rechazada es de extensión
     */
    isExtensionRejection(event) {
        const reason = event.reason?.toString() || '';
        
        for (const pattern of this.extensionPatterns) {
            if (pattern.test(reason)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Log de errores bloqueados (solo para debug)
     */
    logBlockedError(type, message) {
        // Solo log en desarrollo
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            localStorage.getItem('debug_extension_filter') === 'true') {
            
            this.originalConsoleLog(
                `%c🛡️ BLOCKED ${type} ERROR`, 
                'color: #ff6b35; font-weight: bold;', 
                message.substring(0, 100) + (message.length > 100 ? '...' : '')
            );
        }
    }
    
    /**
     * Obtiene estadísticas del filtro
     */
    getStats() {
        const runtime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            runtime: Math.round(runtime / 1000), // segundos
            effectivenessRate: this.stats.totalErrorsProcessed > 0 ? 
                Math.round(((this.stats.extensionErrorsBlocked + this.stats.noiseErrorsBlocked) / this.stats.totalErrorsProcessed) * 100) : 0
        };
    }
    
    /**
     * Reactiva console original (para debugging)
     */
    disableFilter() {
        console.error = this.originalConsoleError;
        console.warn = this.originalConsoleWarn;
        console.log = this.originalConsoleLog;
        
        console.log('⚠️ Browser Extension Filter desactivado');
    }
    
    /**
     * Muestra estadísticas en consola
     */
    showStats() {
        const stats = this.getStats();
        
        console.group('📊 Browser Extension Filter - Estadísticas');
        console.log(`🛡️ Errores de extensiones bloqueados: ${stats.extensionErrorsBlocked}`);
        console.log(`🔇 Errores de ruido bloqueados: ${stats.noiseErrorsBlocked}`);
        console.log(`📝 Total errores procesados: ${stats.totalErrorsProcessed}`);
        console.log(`⏱️ Tiempo activo: ${stats.runtime} segundos`);
        console.log(`📈 Efectividad: ${stats.effectivenessRate}%`);
        console.groupEnd();
    }
    
    /**
     * Añade patrón personalizado de filtrado
     */
    addExtensionPattern(pattern) {
        if (pattern instanceof RegExp) {
            this.extensionPatterns.push(pattern);
            console.log('✅ Patrón de extensión añadido:', pattern);
        } else {
            console.warn('⚠️ El patrón debe ser una expresión regular');
        }
    }
    
    /**
     * Añade patrón de ruido personalizado
     */
    addNoisePattern(pattern) {
        if (pattern instanceof RegExp) {
            this.noisePatterns.push(pattern);
            console.log('✅ Patrón de ruido añadido:', pattern);
        } else {
            console.warn('⚠️ El patrón debe ser una expresión regular');
        }
    }
}

// Inicializar filtro inmediatamente
let browserExtensionFilter;

// Función de inicialización que se puede llamar múltiples veces sin problemas
function initializeBrowserExtensionFilter() {
    if (!browserExtensionFilter) {
        browserExtensionFilter = new BrowserExtensionFilter();
        
        // Exponer globalmente para debugging
        window.browserExtensionFilter = browserExtensionFilter;
        
        // Añadir funciones de utilidad
        window.showFilterStats = () => browserExtensionFilter.showStats();
        window.disableExtensionFilter = () => browserExtensionFilter.disableFilter();
        
        // Mostrar estadísticas cada 5 minutos (solo en desarrollo)
        if (localStorage.getItem('debug_extension_filter') === 'true') {
            setInterval(() => {
                browserExtensionFilter.showStats();
            }, 5 * 60 * 1000);
        }
        
        return browserExtensionFilter;
    }
    return browserExtensionFilter;
}

// Inicializar inmediatamente si el DOM está listo
if (document.readyState !== 'loading') {
    initializeBrowserExtensionFilter();
} else {
    // Si no está listo, esperar al DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initializeBrowserExtensionFilter);
}

// También inicializar en cuanto se cargue el script (para interceptar errores tempranos)
initializeBrowserExtensionFilter();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserExtensionFilter;
}

console.log('🛡️ Browser Extension Filter script cargado');