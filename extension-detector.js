/**
 * EXTENSION DETECTOR - Sistema de detección de extensiones problemáticas
 * Detecta y analiza extensiones de navegador que pueden causar problemas
 * Se ejecuta al inicio de la aplicación para identificar y mitigar problemas
 */

class ExtensionDetector {
    constructor() {
        this.detectedExtensions = [];
        this.problematicExtensions = [];
        this.stats = {
            totalScanned: 0,
            problematicFound: 0,
            blocked: 0,
            startTime: Date.now()
        };
        
        // Base de datos de extensiones problemáticas conocidas
        this.knownProblematicExtensions = [
            {
                pattern: /chrome-extension:\/\/invalid\//gi,
                name: 'Invalid Extension Injection',
                severity: 'critical',
                description: 'Extensión que inyecta scripts maliciosos con URLs inválidas'
            },
            {
                pattern: /inject\.bundle\.js/gi,
                name: 'Bundle Injection',
                severity: 'high', 
                description: 'Script bundle inyectado por extensión desconocida'
            },
            {
                pattern: /chrome-extension:\/\/.*\/content[_-]?script/gi,
                name: 'Content Script Injection',
                severity: 'medium',
                description: 'Content script de extensión que puede interferir'
            },
            {
                pattern: /moz-extension:\/\/.*\/inject/gi,
                name: 'Firefox Extension Injection',
                severity: 'high',
                description: 'Inyección de extensión de Firefox'
            }
        ];
        
        this.init();
    }
    
    /**
     * Inicializar detector
     */
    async init() {
        try {
            console.log('🔍 Extension Detector iniciando...');
            
            // Detectar extensiones inmediatamente
            await this.scanForExtensions();
            
            // Configurar monitoreo continuo
            this.setupContinuousMonitoring();
            
            // Reportar resultados
            this.reportFindings();
            
            console.log('✅ Extension Detector activo');
            
        } catch (error) {
            console.error('❌ Error inicializando Extension Detector:', error);
        }
    }
    
    /**
     * Escanear en busca de extensiones problemáticas
     */
    async scanForExtensions() {
        console.log('🔍 Escaneando extensiones...');
        
        // Escanear scripts en el DOM
        await this.scanDOMScripts();
        
        // Escanear iframes
        await this.scanDOMIframes();
        
        // Escanear recursos cargados
        await this.scanLoadedResources();
        
        // Analizar errores en consola
        this.setupConsoleMonitoring();
        
        // Escanear elementos dinámicos
        this.setupDynamicScanning();
        
        this.stats.totalScanned = this.detectedExtensions.length;
    }
    
    /**
     * Escanear scripts en el DOM
     */
    async scanDOMScripts() {
        const scripts = document.querySelectorAll('script');
        
        scripts.forEach(script => {
            const src = script.src || '';
            const content = script.textContent || script.innerHTML || '';
            
            this.analyzeResource('script', src, content, script);
        });
    }
    
    /**
     * Escanear iframes en el DOM
     */
    async scanDOMIframes() {
        const iframes = document.querySelectorAll('iframe');
        
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            
            this.analyzeResource('iframe', src, '', iframe);
        });
    }
    
    /**
     * Escanear recursos cargados
     */
    async scanLoadedResources() {
        // Verificar performance entries para recursos cargados
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            
            resources.forEach(resource => {
                this.analyzeResource('resource', resource.name, '', null);
            });
        }
        
        // Verificar navigation entries
        if (window.performance && window.performance.getEntriesByType) {
            const navigation = window.performance.getEntriesByType('navigation');
            
            navigation.forEach(nav => {
                this.analyzeResource('navigation', nav.name, '', null);
            });
        }
    }
    
    /**
     * Analizar un recurso específico
     */
    analyzeResource(type, url, content, element) {
        if (!url && !content) return;
        
        const resource = {
            type,
            url,
            content: content.substring(0, 500), // Solo primeros 500 chars
            element,
            timestamp: Date.now(),
            isProblematic: false,
            matches: []
        };
        
        // Verificar contra patrones conocidos
        this.knownProblematicExtensions.forEach(extension => {
            if (extension.pattern.test(url) || extension.pattern.test(content)) {
                resource.isProblematic = true;
                resource.matches.push({
                    name: extension.name,
                    severity: extension.severity,
                    description: extension.description
                });
            }
        });
        
        this.detectedExtensions.push(resource);
        
        if (resource.isProblematic) {
            this.problematicExtensions.push(resource);
            this.stats.problematicFound++;
            
            console.warn(`⚠️ Extensión problemática detectada:`, {
                type: resource.type,
                url: resource.url,
                matches: resource.matches
            });
        }
    }
    
    /**
     * Configurar monitoreo de consola
     */
    setupConsoleMonitoring() {
        // Interceptar errores que podrían indicar extensiones problemáticas
        const originalError = console.error;
        
        console.error = (...args) => {
            const message = args.join(' ');
            
            // Buscar patrones en errores de consola
            this.knownProblematicExtensions.forEach(extension => {
                if (extension.pattern.test(message)) {
                    this.analyzeResource('console-error', message, message, null);
                }
            });
            
            // Llamar al error original
            originalError.apply(console, args);
        };
    }
    
    /**
     * Configurar escaneo dinámico
     */
    setupDynamicScanning() {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanNewElement(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'href']
        });
        
        this.dynamicObserver = observer;
    }
    
    /**
     * Escanear elemento nuevo añadido al DOM
     */
    scanNewElement(element) {
        // Escanear scripts
        const scripts = element.querySelectorAll ? element.querySelectorAll('script') : 
                       (element.tagName === 'SCRIPT' ? [element] : []);
        
        scripts.forEach(script => {
            const src = script.src || '';
            const content = script.textContent || script.innerHTML || '';
            this.analyzeResource('dynamic-script', src, content, script);
        });
        
        // Escanear iframes
        const iframes = element.querySelectorAll ? element.querySelectorAll('iframe') : 
                        (element.tagName === 'IFRAME' ? [element] : []);
        
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            this.analyzeResource('dynamic-iframe', src, '', iframe);
        });
    }
    
    /**
     * Configurar monitoreo continuo
     */
    setupContinuousMonitoring() {
        // Escanear cada 30 segundos
        setInterval(() => {
            this.scanForExtensions();
        }, 30000);
        
        // Escanear cuando se enfoque la ventana
        window.addEventListener('focus', () => {
            setTimeout(() => this.scanForExtensions(), 1000);
        });
        
        // Escanear cuando termine de cargar la página
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                setTimeout(() => this.scanForExtensions(), 2000);
            });
        }
    }
    
    /**
     * Reportar hallazgos
     */
    reportFindings() {
        const stats = this.getStats();
        
        if (stats.problematicFound > 0) {
            console.group('🚨 EXTENSION DETECTOR - Extensiones Problemáticas Encontradas');
            console.warn(`📊 Total recursos escaneados: ${stats.totalScanned}`);
            console.warn(`⚠️ Extensiones problemáticas: ${stats.problematicFound}`);
            console.warn(`🛡️ Bloqueadas: ${stats.blocked}`);
            
            this.problematicExtensions.forEach((ext, index) => {
                console.group(`${index + 1}. ${ext.type.toUpperCase()} - ${ext.matches[0]?.severity?.toUpperCase() || 'UNKNOWN'}`);
                console.warn('URL:', ext.url);
                console.warn('Matches:', ext.matches);
                if (ext.content) {
                    console.warn('Content (preview):', ext.content.substring(0, 100) + '...');
                }
                console.groupEnd();
            });
            
            console.groupEnd();
            
            // Enviar notificación si el usuario debería saber
            if (stats.problematicFound >= 3) {
                this.notifyUser();
            }
        } else {
            console.log('✅ Extension Detector: No se detectaron extensiones problemáticas');
        }
    }
    
    /**
     * Notificar al usuario sobre extensiones problemáticas
     */
    notifyUser() {
        // Solo mostrar en desarrollo o si está explícitamente habilitado
        if (window.location.hostname === 'localhost' || 
            localStorage.getItem('show_extension_warnings') === 'true') {
            
            const message = `Se detectaron ${this.stats.problematicFound} extensiones problemáticas que pueden afectar el funcionamiento del sistema.`;
            
            if (window.utils && window.utils.showNotification) {
                window.utils.showNotification(message, 'warning');
            } else {
                console.warn('🚨', message);
            }
        }
    }
    
    /**
     * Bloquear extensiones problemáticas
     */
    blockProblematicExtensions() {
        let blocked = 0;
        
        this.problematicExtensions.forEach(ext => {
            if (ext.element && ext.element.parentNode) {
                try {
                    ext.element.parentNode.removeChild(ext.element);
                    blocked++;
                    console.log(`🛡️ Bloqueado: ${ext.type} - ${ext.url}`);
                } catch (error) {
                    console.warn('Error bloqueando extensión:', error);
                }
            }
        });
        
        this.stats.blocked = blocked;
        return blocked;
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            runtime: Math.round((Date.now() - this.stats.startTime) / 1000),
            detectedExtensions: this.detectedExtensions.length,
            problematicExtensions: this.problematicExtensions.length
        };
    }
    
    /**
     * Obtener reporte completo
     */
    getFullReport() {
        return {
            stats: this.getStats(),
            detectedExtensions: this.detectedExtensions,
            problematicExtensions: this.problematicExtensions,
            knownPatterns: this.knownProblematicExtensions.length
        };
    }
    
    /**
     * Añadir patrón personalizado
     */
    addCustomPattern(pattern, name, severity = 'medium', description = '') {
        this.knownProblematicExtensions.push({
            pattern: new RegExp(pattern, 'gi'),
            name,
            severity,
            description
        });
        
        console.log(`✅ Patrón personalizado añadido: ${name}`);
    }
    
    /**
     * Limpiar detector
     */
    cleanup() {
        if (this.dynamicObserver) {
            this.dynamicObserver.disconnect();
        }
        
        // Restaurar console.error original si fue modificado
        // (En una implementación real, guardaríamos la referencia original)
        
        console.log('🧹 Extension Detector limpiado');
    }
}

// Inicializar detector inmediatamente
let extensionDetector;

function initializeExtensionDetector() {
    if (!extensionDetector) {
        extensionDetector = new ExtensionDetector();
        
        // Exponer globalmente para debugging
        window.extensionDetector = extensionDetector;
        
        // Funciones de utilidad
        window.showExtensionReport = () => {
            console.table(extensionDetector.getFullReport());
        };
        
        window.blockDetectedExtensions = () => {
            return extensionDetector.blockProblematicExtensions();
        };
        
        return extensionDetector;
    }
    
    return extensionDetector;
}

// Inicializar según el estado del DOM
if (document.readyState !== 'loading') {
    initializeExtensionDetector();
} else {
    document.addEventListener('DOMContentLoaded', initializeExtensionDetector);
}

// Inicializar inmediatamente también (para interceptar errores tempranos)
initializeExtensionDetector();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtensionDetector;
}

console.log('🔍 Extension Detector script cargado');