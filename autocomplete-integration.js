// autocomplete-integration.js - Integración del Sistema de Auto-Complete
// Desarrollado con Claude Code AI - Fase 4 del Sistema Auto-Complete

/**
 * Sistema de Integración de Auto-Complete para ciaociao.mx
 * 
 * Este archivo maneja la integración específica del auto-complete con los formularios
 * de recibos, cotizaciones y calculadora, asegurando que cada campo tenga el tipo
 * correcto de sugerencias y contexto apropiado.
 */

class AutoCompleteIntegration {
    constructor() {
        this.isInitialized = false;
        this.activeDropdowns = new Map();
        this.contextData = {};
        
        // Configuración específica por tipo de página
        this.pageConfigurations = {
            'receipt': {
                formSelector: '#receiptForm',
                fields: {
                    'clientName': { 
                        fieldType: 'clientName', 
                        placeholder: 'Nombre del cliente...',
                        priority: 'high'
                    },
                    'clientPhone': { 
                        fieldType: 'clientPhone', 
                        placeholder: 'Teléfono del cliente...',
                        priority: 'high'
                    },
                    'clientEmail': { 
                        fieldType: 'clientEmail', 
                        placeholder: 'Email del cliente...',
                        priority: 'medium'
                    },
                    'pieceType': { 
                        fieldType: 'pieceType', 
                        placeholder: 'Tipo de joya (anillo, collar, etc.)...',
                        priority: 'high'
                    },
                    'material': { 
                        fieldType: 'material', 
                        placeholder: 'Material (oro, plata, platino)...',
                        priority: 'high'
                    },
                    'description': { 
                        fieldType: 'description', 
                        placeholder: 'Descripción detallada...',
                        priority: 'medium'
                    },
                    'stones': { 
                        fieldType: 'stones', 
                        placeholder: 'Piedras preciosas...',
                        priority: 'medium'
                    },
                    'size': { 
                        fieldType: 'size', 
                        placeholder: 'Talla o tamaño...',
                        priority: 'medium'
                    },
                    'location': { 
                        fieldType: 'location', 
                        placeholder: 'Ubicación...',
                        priority: 'low'
                    }
                }
            },
            'quotation': {
                formSelector: '#quotationForm',
                fields: {
                    'clientName': { 
                        fieldType: 'clientName', 
                        placeholder: 'Nombre del cliente...',
                        priority: 'high'
                    },
                    'clientPhone': { 
                        fieldType: 'clientPhone', 
                        placeholder: 'Teléfono...',
                        priority: 'high'
                    },
                    'clientEmail': { 
                        fieldType: 'clientEmail', 
                        placeholder: 'Email...',
                        priority: 'medium'
                    },
                    // Campos dinámicos del modal de productos
                    'productType': { 
                        fieldType: 'pieceType', 
                        placeholder: 'Tipo de producto...',
                        priority: 'high'
                    },
                    'productMaterial': { 
                        fieldType: 'material', 
                        placeholder: 'Material...',
                        priority: 'high'
                    },
                    'productDescription': { 
                        fieldType: 'description', 
                        placeholder: 'Descripción del producto...',
                        priority: 'medium'
                    }
                }
            },
            'calculator': {
                formSelector: '.calculator-container',
                fields: {
                    'projectName': { 
                        fieldType: 'description', 
                        placeholder: 'Nombre del proyecto...',
                        priority: 'medium'
                    },
                    'projectDescription': { 
                        fieldType: 'description', 
                        placeholder: 'Descripción del proyecto...',
                        priority: 'medium'
                    },
                    // Campos en modales de exportación
                    'documentClientName': { 
                        fieldType: 'clientName', 
                        placeholder: 'Cliente...',
                        priority: 'high'
                    },
                    'documentClientPhone': { 
                        fieldType: 'clientPhone', 
                        placeholder: 'Teléfono...',
                        priority: 'high'
                    }
                }
            }
        };
        
        console.log('✅ AutoCompleteIntegration inicializado');
    }

    /**
     * Inicializar integración automática
     */
    async initialize() {
        try {
            // Detectar tipo de página
            const pageType = this.detectPageType();
            console.log(`🔍 Página detectada: ${pageType}`);
            
            // Esperar a que el motor de auto-complete esté listo
            await this.ensureAutoCompleteEngine();
            
            // Configurar para el tipo de página específico
            await this.setupForPageType(pageType);
            
            // Configurar listeners de contexto
            this.setupContextListeners(pageType);
            
            this.isInitialized = true;
            console.log(`✅ Auto-complete integrado para página ${pageType}`);
            
        } catch (error) {
            console.error('❌ Error inicializando integración:', error);
        }
    }

    /**
     * Detectar tipo de página actual
     */
    detectPageType() {
        const url = window.location.pathname;
        const title = document.title;
        
        if (url.includes('receipt-mode') || title.includes('Recibos')) {
            return 'receipt';
        } else if (url.includes('quotation-mode') || title.includes('Cotizaciones')) {
            return 'quotation';
        } else if (url.includes('calculator-mode') || title.includes('Calculadora')) {
            return 'calculator';
        }
        
        // Detectar por elementos DOM si no se puede por URL
        if (document.getElementById('receiptForm')) {
            return 'receipt';
        } else if (document.getElementById('quotationForm')) {
            return 'quotation';
        } else if (document.querySelector('.calculator-container')) {
            return 'calculator';
        }
        
        return 'unknown';
    }

    /**
     * Asegurar que el motor de auto-complete esté disponible
     */
    async ensureAutoCompleteEngine() {
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!window.autoCompleteEngine && attempts < maxAttempts) {
            console.log(`⏳ Esperando motor de auto-complete... (${attempts + 1}/${maxAttempts})`);
            
            if (typeof initializeAutoComplete === 'function') {
                await initializeAutoComplete();
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            attempts++;
        }
        
        if (!window.autoCompleteEngine) {
            throw new Error('Motor de auto-complete no disponible después de esperar');
        }
        
        console.log('✅ Motor de auto-complete confirmado');
    }

    /**
     * Configurar auto-complete para tipo de página específico
     */
    async setupForPageType(pageType) {
        const config = this.pageConfigurations[pageType];
        if (!config) {
            console.warn(`⚠️ No hay configuración para página tipo: ${pageType}`);
            return;
        }
        
        const form = document.querySelector(config.formSelector);
        if (!form) {
            console.warn(`⚠️ Formulario no encontrado: ${config.formSelector}`);
            return;
        }
        
        // Configurar campos estáticos
        this.setupStaticFields(config, form);
        
        // Configurar campos dinámicos (modales)
        this.setupDynamicFields(config, pageType);
        
        // Setup específico por tipo de página
        switch (pageType) {
            case 'receipt':
                this.setupReceiptSpecific();
                break;
            case 'quotation':
                this.setupQuotationSpecific();
                break;
            case 'calculator':
                this.setupCalculatorSpecific();
                break;
        }
    }

    /**
     * Configurar campos estáticos del formulario
     */
    setupStaticFields(config, form) {
        Object.entries(config.fields).forEach(([fieldId, fieldConfig]) => {
            const input = form.querySelector(`#${fieldId}`);
            if (input && this.isValidInputType(input)) {
                this.createDropdownForInput(input, fieldConfig);
            }
        });
    }

    /**
     * Configurar campos dinámicos (en modales)
     */
    setupDynamicFields(config, pageType) {
        // Observer para campos que aparecen dinámicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.setupModalFields(node, config);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Guardar observer para cleanup posterior
        this.dynamicObserver = observer;
    }

    /**
     * Configurar campos en modales cuando aparecen
     */
    setupModalFields(element, config) {
        // Buscar campos de auto-complete en el elemento agregado
        Object.entries(config.fields).forEach(([fieldId, fieldConfig]) => {
            const input = element.querySelector ? element.querySelector(`#${fieldId}`) : null;
            if (input && this.isValidInputType(input) && !input.hasAttribute('data-smart-dropdown')) {
                this.createDropdownForInput(input, fieldConfig);
            }
        });
    }

    /**
     * Verificar si el input es válido para auto-complete
     */
    isValidInputType(input) {
        const validTypes = ['text', 'email', 'tel', 'search'];
        const inputType = input.type ? input.type.toLowerCase() : 'text';
        return validTypes.includes(inputType) || input.tagName.toLowerCase() === 'textarea';
    }

    /**
     * Crear dropdown para un input específico
     */
    createDropdownForInput(input, fieldConfig) {
        try {
            if (!window.smartDropdownFactory) {
                console.warn('⚠️ SmartDropdownFactory no disponible');
                return;
            }
            
            const dropdown = window.smartDropdownFactory.createDropdown(input, {
                fieldType: fieldConfig.fieldType,
                placeholder: fieldConfig.placeholder,
                context: this.getCurrentContext()
            });
            
            if (dropdown) {
                this.activeDropdowns.set(input.id, dropdown);
                console.log(`✅ Dropdown creado para ${input.id} (${fieldConfig.fieldType})`);
            }
            
        } catch (error) {
            console.error(`❌ Error creando dropdown para ${input.id}:`, error);
        }
    }

    /**
     * Configuración específica para recibos
     */
    setupReceiptSpecific() {
        // Listener para contexto de pieza que afecta sugerencias de material
        const pieceTypeInput = document.getElementById('pieceType');
        if (pieceTypeInput) {
            pieceTypeInput.addEventListener('change', (e) => {
                this.updateContext({ pieceType: e.target.value });
            });
        }
        
        // Listener para cliente que afecta sugerencias de contacto
        const clientNameInput = document.getElementById('clientName');
        if (clientNameInput) {
            clientNameInput.addEventListener('change', (e) => {
                this.updateContext({ clientName: e.target.value });
            });
        }
    }

    /**
     * Configuración específica para cotizaciones
     */
    setupQuotationSpecific() {
        // Setup específico para formulario de cotizaciones
        // Listener para contexto dinámico del modal de productos
        const productModal = document.getElementById('addProductModal');
        if (productModal) {
            const observer = new MutationObserver(() => {
                if (productModal.style.display !== 'none') {
                    // Modal abierto, configurar campos dinámicos
                    setTimeout(() => this.setupProductModalFields(), 100);
                }
            });
            
            observer.observe(productModal, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }

    /**
     * Configurar campos del modal de productos
     */
    setupProductModalFields() {
        const config = this.pageConfigurations['quotation'];
        this.setupModalFields(document.getElementById('addProductModal'), config);
    }

    /**
     * Configuración específica para calculadora
     */
    setupCalculatorSpecific() {
        // Setup específico para calculadora
        // Los campos aparecen dinámicamente en modales de exportación
        console.log('📊 Configuración específica de calculadora aplicada');
    }

    /**
     * Configurar listeners de contexto
     */
    setupContextListeners(pageType) {
        // Listener para cambios que afectan el contexto
        document.addEventListener('input', (e) => {
            this.handleContextChange(e.target, pageType);
        });
        
        document.addEventListener('change', (e) => {
            this.handleContextChange(e.target, pageType);
        });
    }

    /**
     * Manejar cambios de contexto
     */
    handleContextChange(element, pageType) {
        const contextFields = {
            'pieceType': 'pieceType',
            'material': 'material', 
            'clientName': 'clientName',
            'productType': 'pieceType',
            'productMaterial': 'material'
        };
        
        const contextKey = contextFields[element.id];
        if (contextKey && element.value) {
            this.updateContext({ [contextKey]: element.value });
        }
    }

    /**
     * Obtener contexto actual
     */
    getCurrentContext() {
        return { ...this.contextData };
    }

    /**
     * Actualizar contexto y propagar a dropdowns activos
     */
    updateContext(newContext) {
        this.contextData = { ...this.contextData, ...newContext };
        
        // Actualizar contexto en todos los dropdowns activos
        this.activeDropdowns.forEach((dropdown) => {
            if (dropdown.updateContext) {
                dropdown.updateContext(this.contextData);
            }
        });
        
        console.log('🔄 Contexto actualizado:', this.contextData);
    }

    /**
     * Obtener estadísticas de la integración
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            activeDropdowns: this.activeDropdowns.size,
            pageType: this.detectPageType(),
            context: this.contextData,
            dropdownStats: window.smartDropdownFactory ? 
                window.smartDropdownFactory.getStats() : null
        };
    }

    /**
     * Limpiar integración
     */
    cleanup() {
        try {
            // Destruir dropdowns activos
            this.activeDropdowns.forEach((dropdown) => {
                if (dropdown.destroy) {
                    dropdown.destroy();
                }
            });
            this.activeDropdowns.clear();
            
            // Limpiar observer dinámico
            if (this.dynamicObserver) {
                this.dynamicObserver.disconnect();
            }
            
            console.log('✅ Integración de auto-complete limpiada');
            
        } catch (error) {
            console.error('❌ Error limpiando integración:', error);
        }
    }
}

// Instancia global de integración
window.AutoCompleteIntegration = AutoCompleteIntegration;
window.autoCompleteIntegration = null;

/**
 * Función de inicialización automática
 */
async function initializeAutoCompleteIntegration() {
    try {
        if (!window.autoCompleteIntegration) {
            window.autoCompleteIntegration = new AutoCompleteIntegration();
            await window.autoCompleteIntegration.initialize();
        }
        return window.autoCompleteIntegration;
    } catch (error) {
        console.error('❌ Error inicializando integración de auto-complete:', error);
        return null;
    }
}

// Auto-inicializar cuando el DOM esté listo
function autoInitializeIntegration() {
    // NO AUTO-INICIALIZAR EN MODO COTIZACIONES - evitar race conditions
    const quotationMode = document.querySelector('.quotation-mode');
    if (quotationMode) {
        console.log('⚠️ Modo cotizaciones detectado - autocomplete-integration.js NO se auto-inicializa');
        console.log('📝 Para inicializar auto-complete en cotizaciones, usar initializeAutoCompleteIntegration() manualmente');
        return;
    }
    
    // Esperar un poco más para que otros sistemas se inicialicen (solo en otros modos)
    setTimeout(async () => {
        try {
            await initializeAutoCompleteIntegration();
            console.log('✅ Auto-inicialización de integración completada');
        } catch (error) {
            console.error('❌ Error en auto-inicialización:', error);
        }
    }, 2000); // 2 segundos de delay para asegurar que todo esté listo
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitializeIntegration);
} else {
    autoInitializeIntegration();
}

console.log('✅ Sistema de Integración de Auto-Complete cargado');