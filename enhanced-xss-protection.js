// enhanced-xss-protection.js - XSS Protection with Password Field Exclusions
// Protects against XSS attacks while allowing normal password functionality

class EnhancedXSSProtection {
    constructor() {
        this.isInitialized = false;
        this.domPurify = null;
        
        // Metrics for monitoring
        this.metrics = {
            blockedAttempts: 0,
            sanitizedInputs: 0,
            excludedInputs: 0,
            lastAttempt: null
        };
        
        // Configuration with exclusions
        this.config = {
            // Input types to EXCLUDE from XSS sanitization
            excludedInputTypes: [
                'password',
                'hidden',
                'file',
                'range',
                'color',
                'date',
                'datetime-local',
                'month',
                'time',
                'week'
            ],
            
            // Field IDs to EXCLUDE (for sensitive fields)
            excludedFieldIds: [
                'password',
                'secure-password',
                'loginPassword',
                'userPassword',
                'authPassword',
                'accessCode',
                'securityCode'
            ],
            
            // Field classes to EXCLUDE
            excludedFieldClasses: [
                'password-field',
                'secure-input',
                'auth-input',
                'no-xss-protection'
            ],
            
            // XSS patterns for detection
            xssPatterns: [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe[^>]*>/gi,
                /<object[^>]*>/gi,
                /<embed[^>]*>/gi,
                /expression\s*\(/gi,
                /vbscript:/gi,
                /data:text\/html/gi,
                /<meta[^>]*http-equiv/gi
            ],
            
            logging: true,
            strictMode: false // Less strict to avoid breaking functionality
        };
        
        console.log('🛡️ Enhanced XSS Protection inicializado');
        this.initializeProtection();
    }
    
    // Inicializar protección XSS
    async initializeProtection() {
        try {
            // Esperar a que DOMPurify esté disponible
            await this.waitForDOMPurify();
            
            // Configurar interceptores de input con exclusions
            this.setupInputInterceptors();
            
            // Configurar protección de DOM
            this.setupDOMProtection();
            
            // Configurar monitoreo de scripts dinámicos
            this.setupDynamicScriptProtection();
            
            this.isInitialized = true;
            console.log('✅ Enhanced XSS Protection activo con exclusiones para passwords');
            
        } catch (error) {
            console.error('❌ Error inicializando XSS Protection:', error);
            this.setupFallbackProtection();
        }
    }
    
    // Esperar a que DOMPurify esté disponible
    async waitForDOMPurify(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            if (typeof DOMPurify !== 'undefined') {
                this.domPurify = DOMPurify;
                console.log('✅ DOMPurify encontrado y configurado');
                return true;
            }
            
            console.log(`⏳ Esperando DOMPurify... intento ${i + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.warn('⚠️ DOMPurify no disponible, usando protección básica');
        return false;
    }
    
    // Verificar si un campo debe ser excluido de la sanitización
    shouldExcludeField(field) {
        try {
            // Verificar tipo de input
            if (field.type && this.config.excludedInputTypes.includes(field.type.toLowerCase())) {
                this.metrics.excludedInputs++;
                return true;
            }
            
            // Verificar ID del campo
            if (field.id && this.config.excludedFieldIds.some(id => 
                field.id.toLowerCase().includes(id.toLowerCase()))) {
                this.metrics.excludedInputs++;
                return true;
            }
            
            // Verificar clases del campo
            if (field.className) {
                const fieldClasses = field.className.toLowerCase().split(' ');
                if (fieldClasses.some(cls => 
                    this.config.excludedFieldClasses.some(excluded => 
                        cls.includes(excluded.toLowerCase())))) {
                    this.metrics.excludedInputs++;
                    return true;
                }
            }
            
            // Verificar atributos especiales
            if (field.hasAttribute('data-no-xss') || 
                field.hasAttribute('data-secure-field') ||
                field.hasAttribute('data-password-field')) {
                this.metrics.excludedInputs++;
                return true;
            }
            
            // Verificar si el campo tiene autocomplete="current-password" o similar
            const autocomplete = field.getAttribute('autocomplete');
            if (autocomplete && autocomplete.includes('password')) {
                this.metrics.excludedInputs++;
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error verificando exclusión de campo:', error);
            return false; // En caso de error, no excluir (sanitizar por seguridad)
        }
    }
    
    // Configurar interceptores de input con exclusiones
    setupInputInterceptors() {
        // Interceptar eventos de input
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Verificar si debe ser excluido
                if (this.shouldExcludeField(e.target)) {
                    if (this.config.logging) {
                        console.log('🔓 Campo excluido de XSS protection:', e.target.id || e.target.className || 'anonymous');
                    }
                    return; // No sanitizar campos excluidos
                }
                
                // Sanitizar solo campos no excluidos
                this.sanitizeInputField(e.target);
            }
        });
        
        // Interceptar eventos de paste
        document.addEventListener('paste', (e) => {
            setTimeout(() => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    // Verificar exclusión antes de sanitizar
                    if (this.shouldExcludeField(e.target)) {
                        if (this.config.logging) {
                            console.log('🔓 Paste excluido de XSS protection:', e.target.id || 'anonymous');
                        }
                        return;
                    }
                    
                    this.sanitizeInputField(e.target);
                }
            }, 10);
        });
        
        console.log('✅ Input interceptors configurados con exclusiones');
    }
    
    // Sanitizar campo de entrada
    sanitizeInputField(field) {
        try {
            if (!field || !field.value) return;
            
            const originalValue = field.value;
            let sanitizedValue = originalValue;
            
            // Detectar patrones XSS
            let hasXSS = false;
            for (const pattern of this.config.xssPatterns) {
                if (pattern.test(originalValue)) {
                    hasXSS = true;
                    break;
                }
            }
            
            if (hasXSS) {
                console.warn('🚨 Patrón XSS detectado en campo:', field.id || field.className || 'anonymous');
                this.metrics.blockedAttempts++;
                this.metrics.lastAttempt = new Date().toISOString();
                
                // Usar DOMPurify si está disponible
                if (this.domPurify) {
                    sanitizedValue = this.domPurify.sanitize(originalValue, {
                        ALLOWED_TAGS: [],
                        ALLOWED_ATTR: []
                    });
                } else {
                    // Fallback: limpiar patrones conocidos
                    sanitizedValue = this.basicSanitization(originalValue);
                }
                
                // Aplicar valor sanitizado solo si es diferente
                if (sanitizedValue !== originalValue) {
                    field.value = sanitizedValue;
                    
                    // Notificar al usuario
                    this.notifyXSSBlocked(field);
                    
                    this.metrics.sanitizedInputs++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error sanitizando campo:', error);
            this.metrics.errors++;
        }
    }
    
    // Sanitización básica (fallback cuando DOMPurify no está disponible)
    basicSanitization(input) {
        let sanitized = input;
        
        // Remover patrones XSS conocidos
        for (const pattern of this.config.xssPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }
        
        // Escape de caracteres HTML básicos
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        return sanitized;
    }
    
    // Notificar bloqueo de XSS al usuario
    notifyXSSBlocked(field) {
        try {
            // Usar sistema de notificaciones si está disponible
            if (window.utils && utils.showNotification) {
                utils.showNotification(
                    'Contenido potencialmente peligroso removido por seguridad', 
                    'warning'
                );
            } else {
                // Fallback: mostrar tooltip temporal
                this.showTemporaryTooltip(field, 'Contenido peligroso removido');
            }
            
            if (this.config.logging) {
                console.warn('⚠️ XSS bloqueado en campo:', field.id || field.name || 'anonymous');
            }
            
        } catch (error) {
            console.error('❌ Error notificando bloqueo XSS:', error);
        }
    }
    
    // Mostrar tooltip temporal
    showTemporaryTooltip(field, message) {
        try {
            const tooltip = document.createElement('div');
            tooltip.textContent = message;
            tooltip.style.cssText = `
                position: absolute;
                background: #ff9800;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            
            // Posicionar cerca del campo
            const rect = field.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            
            document.body.appendChild(tooltip);
            
            // Remover después de 3 segundos
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error mostrando tooltip:', error);
        }
    }
    
    // Configurar protección de DOM
    setupDOMProtection() {
        // Observar modificaciones al DOM
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.scanElementForXSS(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('✅ DOM mutation observer configurado');
        }
    }
    
    // Escanear elemento por contenido XSS
    scanElementForXSS(element) {
        try {
            // Verificar scripts dinámicos
            if (element.tagName === 'SCRIPT') {
                console.warn('🚨 Script dinámico detectado y bloqueado');
                element.remove();
                this.metrics.blockedAttempts++;
                return;
            }
            
            // Verificar atributos peligrosos
            if (element.attributes) {
                for (let attr of element.attributes) {
                    if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
                        console.warn('🚨 Atributo peligroso detectado:', attr.name);
                        element.removeAttribute(attr.name);
                        this.metrics.blockedAttempts++;
                    }
                }
            }
            
            // Escanear elementos hijos
            element.querySelectorAll('*').forEach(child => {
                this.scanElementForXSS(child);
            });
            
        } catch (error) {
            console.error('❌ Error escaneando elemento:', error);
        }
    }
    
    // Configurar protección contra scripts dinámicos
    setupDynamicScriptProtection() {
        // Interceptar createElement para scripts
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = function(tagName, options) {
            const element = originalCreateElement(tagName, options);
            
            if (tagName.toLowerCase() === 'script') {
                console.warn('🚨 Creación de script dinámico detectada');
                // Permitir solo scripts de fuentes confiables
                const allowedSources = [
                    'cdnjs.cloudflare.com',
                    'cdn.jsdelivr.net',
                    'unpkg.com'
                ];
                
                const originalSetSrc = element.__lookupSetter__('src') || function(value) {
                    this.setAttribute('src', value);
                };
                
                element.__defineSetter__('src', function(value) {
                    const isAllowed = allowedSources.some(source => value.includes(source));
                    if (isAllowed || value.startsWith('./') || value.startsWith('/')) {
                        originalSetSrc.call(this, value);
                    } else {
                        console.warn('🚨 Script de fuente no confiable bloqueado:', value);
                    }
                });
            }
            
            return element;
        };
    }
    
    // Configurar protección de fallback (cuando DOMPurify no está disponible)
    setupFallbackProtection() {
        console.log('⚠️ Configurando protección XSS básica (fallback)');
        
        // Solo configurar interceptores básicos
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (!this.shouldExcludeField(e.target)) {
                    this.basicInputProtection(e.target);
                }
            }
        });
    }
    
    // Protección básica de input
    basicInputProtection(field) {
        try {
            const value = field.value;
            if (!value) return;
            
            // Verificar solo los patrones más críticos
            const criticalPatterns = [
                /<script/gi,
                /javascript:/gi,
                /<iframe/gi
            ];
            
            for (const pattern of criticalPatterns) {
                if (pattern.test(value)) {
                    console.warn('🚨 Contenido peligroso detectado');
                    field.value = value.replace(pattern, '[BLOCKED]');
                    this.metrics.blockedAttempts++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error en protección básica:', error);
        }
    }
    
    // Obtener métricas de XSS
    getMetrics() {
        return {
            ...this.metrics,
            isInitialized: this.isInitialized,
            domPurifyAvailable: !!this.domPurify,
            protectionLevel: this.domPurify ? 'full' : 'basic'
        };
    }
    
    // Agregar campo a exclusiones dinámicamente
    addExcludedField(selector) {
        try {
            if (selector.startsWith('#')) {
                this.config.excludedFieldIds.push(selector.substring(1));
            } else if (selector.startsWith('.')) {
                this.config.excludedFieldClasses.push(selector.substring(1));
            }
            
            console.log('✅ Campo agregado a exclusiones:', selector);
            
        } catch (error) {
            console.error('❌ Error agregando exclusión:', error);
        }
    }
    
    // Remover campo de exclusiones
    removeExcludedField(selector) {
        try {
            if (selector.startsWith('#')) {
                const id = selector.substring(1);
                this.config.excludedFieldIds = this.config.excludedFieldIds.filter(
                    excluded => excluded !== id
                );
            } else if (selector.startsWith('.')) {
                const className = selector.substring(1);
                this.config.excludedFieldClasses = this.config.excludedFieldClasses.filter(
                    excluded => excluded !== className
                );
            }
            
            console.log('✅ Campo removido de exclusiones:', selector);
            
        } catch (error) {
            console.error('❌ Error removiendo exclusión:', error);
        }
    }
    
    // Desactivar protección temporalmente
    temporaryDisable(duration = 10000) {
        console.warn('⚠️ XSS Protection desactivada temporalmente');
        
        this.isInitialized = false;
        
        setTimeout(() => {
            this.isInitialized = true;
            console.log('✅ XSS Protection reactivada');
        }, duration);
    }
}

// Inicializar protección XSS mejorada
window.enhancedXSSProtection = new EnhancedXSSProtection();

// Funciones utilitarias para manejo de exclusiones
window.excludeFieldFromXSS = (selector) => window.enhancedXSSProtection.addExcludedField(selector);
window.includeFieldInXSS = (selector) => window.enhancedXSSProtection.removeExcludedField(selector);
window.getXSSMetrics = () => window.enhancedXSSProtection.getMetrics();
window.temporaryDisableXSS = (duration) => window.enhancedXSSProtection.temporaryDisable(duration);

console.log('🛡️ Enhanced XSS Protection cargado con exclusiones para passwords');
console.log('💡 Comandos: excludeFieldFromXSS(selector), includeFieldInXSS(selector), getXSSMetrics()');