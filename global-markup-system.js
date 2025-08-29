// global-markup-system.js - SISTEMA DE MARKUP GLOBAL v1.0
// Gestión completa de márgenes de ganancia con controles separados
// =================================================================

console.log('📊 Iniciando Sistema de Markup Global v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE MARKUP GLOBAL
// =================================================================

const GLOBAL_MARKUP_CONFIG = {
    // Configuración de márgenes por categoría
    markupCategories: {
        material_costs: {
            name: 'Costos de Material',
            description: 'Margen aplicado sobre el costo de materiales (metales, piedras)',
            defaultValue: 25,    // 25% sobre costo de material
            minValue: 0,         // 0% mínimo
            maxValue: 100,       // 100% máximo
            step: 0.5,           // Incrementos de 0.5%
            unit: '%',
            color: '#D4AF37',    // Oro
            calculation: 'multiplicativo', // cost * (1 + markup/100)
            applyTo: ['metals', 'diamonds', 'gemstones', 'pearls']
        },
        labor_costs: {
            name: 'Mano de Obra',
            description: 'Costo de fabricación, diseño y ensamblado',
            defaultValue: 40,    // 40% del costo de materiales como base
            minValue: 15,        // 15% mínimo
            maxValue: 150,       // 150% máximo
            step: 1,             // Incrementos de 1%
            unit: '%',
            color: '#B8941F',    // Oro Oscuro
            calculation: 'percentage_of_material', // material_cost * (labor/100)
            baseCalculation: 'material_after_markup', // Sobre material ya con markup
            factors: {
                simple: 1.0,      // Trabajos simples 100%
                medium: 1.5,      // Trabajos medios 150%
                complex: 2.5,     // Trabajos complejos 250%
                masterpiece: 4.0  // Obras maestras 400%
            }
        },
        overhead: {
            name: 'Gastos Generales',
            description: 'Renta, servicios, herramientas, seguros, etc.',
            defaultValue: 15,    // 15% sobre subtotal (material + labor)
            minValue: 8,         // 8% mínimo
            maxValue: 35,        // 35% máximo
            step: 0.5,           // Incrementos de 0.5%
            unit: '%',
            color: '#1a1a1a',    // Negro
            calculation: 'percentage_of_subtotal', // (material+labor) * (overhead/100)
            applyTo: ['rent', 'utilities', 'insurance', 'tools', 'supplies']
        },
        profit_margin: {
            name: 'Margen de Ganancia',
            description: 'Ganancia neta después de todos los costos',
            defaultValue: 30,    // 30% sobre costo total
            minValue: 10,        // 10% mínimo
            maxValue: 80,        // 80% máximo
            step: 1,             // Incrementos de 1%
            unit: '%',
            color: '#2E7D32',    // Verde
            calculation: 'percentage_of_total_cost', // total_cost * (profit/100)
            tiers: {
                wholesale: 0.8,   // 80% del margen normal
                retail: 1.0,      // 100% margen normal
                premium: 1.3,     // 130% margen premium
                exclusive: 1.6    // 160% margen exclusivo
            }
        }
    },

    // Presets de configuración por tipo de producto
    productTypePresets: {
        rings: {
            name: 'Anillos',
            material_costs: 20,
            labor_costs: 35,
            overhead: 12,
            profit_margin: 28,
            complexity_default: 'medium'
        },
        necklaces: {
            name: 'Collares',
            material_costs: 22,
            labor_costs: 45,
            overhead: 15,
            profit_margin: 32,
            complexity_default: 'complex'
        },
        earrings: {
            name: 'Aretes',
            material_costs: 18,
            labor_costs: 30,
            overhead: 10,
            profit_margin: 25,
            complexity_default: 'simple'
        },
        bracelets: {
            name: 'Pulseras',
            material_costs: 25,
            labor_costs: 40,
            overhead: 14,
            profit_margin: 30,
            complexity_default: 'medium'
        },
        custom: {
            name: 'Personalizado',
            material_costs: 30,
            labor_costs: 60,
            overhead: 20,
            profit_margin: 40,
            complexity_default: 'masterpiece'
        }
    },

    // Configuración de cliente por tier
    customerTiers: {
        wholesale: {
            name: 'Mayorista',
            discount: 0.25,      // 25% descuento del margen
            minOrder: 50000,     // Pedido mínimo $50,000
            color: '#666666'
        },
        retail: {
            name: 'Menudeo',
            discount: 0,         // Sin descuento
            minOrder: 0,
            color: '#D4AF37'
        },
        premium: {
            name: 'Premium',
            discount: -0.15,     // 15% incremento del margen
            minOrder: 0,
            color: '#B8941F'
        },
        vip: {
            name: 'VIP',
            discount: -0.10,     // 10% incremento del margen
            minOrder: 0,
            color: '#1a1a1a'
        }
    },

    // Configuración de almacenamiento
    storage: {
        configKey: 'global_markup_config',
        presetsKey: 'markup_presets',
        historyKey: 'markup_history',
        maxHistoryEntries: 100
    },

    // Configuración de validación
    validation: {
        maxTotalMarkup: 300,     // 300% markup total máximo
        minTotalMarkup: 50,      // 50% markup total mínimo
        warningThreshold: 200,   // Advertencia si markup > 200%
        alertOnHighMargin: true
    }
};

// =================================================================
// CLASE PRINCIPAL DE GESTIÓN DE MARKUP GLOBAL
// =================================================================

class GlobalMarkupSystem {
    constructor() {
        this.config = { ...GLOBAL_MARKUP_CONFIG.markupCategories };
        this.currentPreset = null;
        this.currentTier = 'retail';
        this.history = [];
        this.observers = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de markup global...');
        
        try {
            // Cargar configuración guardada
            this.loadStoredConfig();
            
            // Configurar valores por defecto si es primera vez
            this.ensureDefaults();
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            console.log('✅ Sistema de markup global inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de markup:', error);
            this.loadDefaults();
        }
    }

    loadStoredConfig() {
        try {
            const storedConfig = localStorage.getItem(GLOBAL_MARKUP_CONFIG.storage.configKey);
            if (storedConfig) {
                const config = JSON.parse(storedConfig);
                
                // Actualizar solo los valores, mantener estructura
                Object.keys(this.config).forEach(category => {
                    if (config[category] && typeof config[category].defaultValue === 'number') {
                        this.config[category].defaultValue = config[category].defaultValue;
                    }
                });
                
                console.log('📊 Configuración de markup cargada desde localStorage');
            }

            // Cargar historial
            const storedHistory = localStorage.getItem(GLOBAL_MARKUP_CONFIG.storage.historyKey);
            if (storedHistory) {
                this.history = JSON.parse(storedHistory);
                console.log(`📚 Historial cargado con ${this.history.length} entradas`);
            }

        } catch (error) {
            console.warn('⚠️ Error cargando configuración guardada:', error);
            this.loadDefaults();
        }
    }

    ensureDefaults() {
        let needsSave = false;
        
        Object.keys(this.config).forEach(category => {
            if (this.config[category].defaultValue === undefined) {
                this.config[category].defaultValue = GLOBAL_MARKUP_CONFIG.markupCategories[category].defaultValue;
                needsSave = true;
            }
        });

        if (needsSave) {
            this.saveConfig();
        }
    }

    loadDefaults() {
        this.config = { ...GLOBAL_MARKUP_CONFIG.markupCategories };
        console.log('🔄 Configuración por defecto cargada');
    }

    setupAutoSave() {
        // Auto-guardar cada 30 segundos si hay cambios
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveConfig();
                this.hasUnsavedChanges = false;
            }
        }, 30000);
    }

    // =================================================================
    // MÉTODOS PRINCIPALES DE CONFIGURACIÓN
    // =================================================================

    setMarkup(category, value, reason = null) {
        if (!this.config[category]) {
            throw new Error(`Categoría de markup ${category} no existe`);
        }

        const categoryConfig = this.config[category];
        
        // Validar rango
        if (value < categoryConfig.minValue || value > categoryConfig.maxValue) {
            throw new Error(`Valor ${value}% fuera del rango permitido (${categoryConfig.minValue}% - ${categoryConfig.maxValue}%)`);
        }

        // Guardar valor anterior para historial
        const previousValue = categoryConfig.defaultValue;
        
        // Actualizar valor
        categoryConfig.defaultValue = value;
        this.hasUnsavedChanges = true;

        // Agregar al historial
        this.addToHistory('UPDATE', {
            category: category,
            categoryName: categoryConfig.name,
            previousValue: previousValue,
            newValue: value,
            reason: reason
        });

        // Validar markup total
        this.validateTotalMarkup();

        // Notificar observadores
        this.notifyObservers('markup_changed', {
            category: category,
            value: value,
            previousValue: previousValue
        });

        console.log(`📊 Markup ${categoryConfig.name} actualizado: ${previousValue}% → ${value}%`);

        return { success: true, previousValue: previousValue, newValue: value };
    }

    getMarkup(category) {
        if (!this.config[category]) {
            throw new Error(`Categoría de markup ${category} no existe`);
        }

        return this.config[category].defaultValue;
    }

    getAllMarkups() {
        const markups = {};
        Object.keys(this.config).forEach(category => {
            markups[category] = {
                value: this.config[category].defaultValue,
                name: this.config[category].name,
                unit: this.config[category].unit
            };
        });
        return markups;
    }

    // =================================================================
    // SISTEMA DE CÁLCULOS AVANZADOS
    // =================================================================

    calculatePrice(materialCost, options = {}) {
        const {
            complexity = 'medium',
            customerTier = 'retail',
            customMarkups = {},
            productType = null
        } = options;

        // Usar preset si se especifica tipo de producto
        if (productType && GLOBAL_MARKUP_CONFIG.productTypePresets[productType]) {
            const preset = GLOBAL_MARKUP_CONFIG.productTypePresets[productType];
            Object.keys(preset).forEach(key => {
                if (key !== 'name' && key !== 'complexity_default' && !customMarkups[key]) {
                    customMarkups[key] = preset[key];
                }
            });
        }

        // Obtener markups (usar custom si se proporciona, sino usar configuración actual)
        const markups = {
            material: customMarkups.material_costs || this.getMarkup('material_costs'),
            labor: customMarkups.labor_costs || this.getMarkup('labor_costs'),
            overhead: customMarkups.overhead || this.getMarkup('overhead'),
            profit: customMarkups.profit_margin || this.getMarkup('profit_margin')
        };

        // Paso 1: Aplicar markup a materiales
        const materialWithMarkup = materialCost * (1 + markups.material / 100);

        // Paso 2: Calcular costo de mano de obra
        const complexityFactor = GLOBAL_MARKUP_CONFIG.markupCategories.labor_costs.factors[complexity] || 1.0;
        const laborCost = materialWithMarkup * (markups.labor / 100) * complexityFactor;

        // Paso 3: Subtotal (material con markup + labor)
        const subtotal = materialWithMarkup + laborCost;

        // Paso 4: Aplicar gastos generales
        const overheadCost = subtotal * (markups.overhead / 100);

        // Paso 5: Costo total
        const totalCost = subtotal + overheadCost;

        // Paso 6: Aplicar margen de ganancia
        const tierConfig = GLOBAL_MARKUP_CONFIG.customerTiers[customerTier];
        const tierMultiplier = tierConfig ? (1 + tierConfig.discount) : 1;
        const adjustedProfit = markups.profit * tierMultiplier;
        
        const profitAmount = totalCost * (adjustedProfit / 100);
        const finalPrice = totalCost + profitAmount;

        // Cálculo de markup total efectivo
        const totalMarkupPercent = ((finalPrice - materialCost) / materialCost) * 100;

        return {
            breakdown: {
                materialCost: materialCost,
                materialWithMarkup: materialWithMarkup,
                laborCost: laborCost,
                subtotal: subtotal,
                overheadCost: overheadCost,
                totalCost: totalCost,
                profitAmount: profitAmount,
                finalPrice: finalPrice
            },
            markupsApplied: markups,
            factors: {
                complexity: complexity,
                complexityFactor: complexityFactor,
                customerTier: customerTier,
                tierMultiplier: tierMultiplier
            },
            totalMarkupPercent: totalMarkupPercent,
            marginAnalysis: {
                materialMargin: ((materialWithMarkup - materialCost) / materialCost) * 100,
                laborMargin: (laborCost / materialCost) * 100,
                overheadMargin: (overheadCost / materialCost) * 100,
                profitMargin: (profitAmount / materialCost) * 100
            }
        };
    }

    // =================================================================
    // SISTEMA DE PRESETS
    // =================================================================

    applyPreset(presetName) {
        if (!GLOBAL_MARKUP_CONFIG.productTypePresets[presetName]) {
            throw new Error(`Preset ${presetName} no existe`);
        }

        const preset = GLOBAL_MARKUP_CONFIG.productTypePresets[presetName];
        const changes = [];

        // Aplicar cada valor del preset
        Object.keys(preset).forEach(key => {
            if (key !== 'name' && key !== 'complexity_default' && this.config[key]) {
                const previousValue = this.config[key].defaultValue;
                this.config[key].defaultValue = preset[key];
                changes.push({
                    category: key,
                    previousValue: previousValue,
                    newValue: preset[key]
                });
            }
        });

        this.currentPreset = presetName;
        this.hasUnsavedChanges = true;

        // Agregar al historial
        this.addToHistory('APPLY_PRESET', {
            presetName: presetName,
            presetDisplayName: preset.name,
            changes: changes
        });

        // Notificar observadores
        this.notifyObservers('preset_applied', {
            presetName: presetName,
            changes: changes
        });

        console.log(`📋 Preset "${preset.name}" aplicado con ${changes.length} cambios`);

        return { success: true, changes: changes };
    }

    createCustomPreset(name, config) {
        const customPreset = {
            name: name,
            ...config,
            isCustom: true,
            createdAt: Date.now()
        };

        // Guardar preset personalizado
        let customPresets = this.getCustomPresets();
        customPresets[name] = customPreset;
        
        localStorage.setItem(GLOBAL_MARKUP_CONFIG.storage.presetsKey, JSON.stringify(customPresets));

        console.log(`📋 Preset personalizado "${name}" creado`);

        return { success: true, preset: customPreset };
    }

    getCustomPresets() {
        try {
            const stored = localStorage.getItem(GLOBAL_MARKUP_CONFIG.storage.presetsKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Error cargando presets personalizados:', error);
            return {};
        }
    }

    getAllPresets() {
        return {
            ...GLOBAL_MARKUP_CONFIG.productTypePresets,
            ...this.getCustomPresets()
        };
    }

    // =================================================================
    // VALIDACIONES Y ANÁLISIS
    // =================================================================

    validateTotalMarkup() {
        const totalMarkup = this.calculateTotalMarkup();
        const config = GLOBAL_MARKUP_CONFIG.validation;

        if (totalMarkup > config.maxTotalMarkup) {
            console.warn(`⚠️ Markup total ${totalMarkup.toFixed(1)}% excede el máximo recomendado (${config.maxTotalMarkup}%)`);
            return { valid: false, warning: `Markup total muy alto: ${totalMarkup.toFixed(1)}%` };
        }

        if (totalMarkup < config.minTotalMarkup) {
            console.warn(`⚠️ Markup total ${totalMarkup.toFixed(1)}% por debajo del mínimo recomendado (${config.minTotalMarkup}%)`);
            return { valid: false, warning: `Markup total muy bajo: ${totalMarkup.toFixed(1)}%` };
        }

        if (totalMarkup > config.warningThreshold && config.alertOnHighMargin) {
            return { valid: true, warning: `Markup total alto: ${totalMarkup.toFixed(1)}%` };
        }

        return { valid: true };
    }

    calculateTotalMarkup() {
        const markups = this.getAllMarkups();
        return Object.values(markups).reduce((sum, markup) => sum + markup.value, 0);
    }

    getMarkupAnalysis() {
        const markups = this.getAllMarkups();
        const total = this.calculateTotalMarkup();
        
        const analysis = {
            total: total,
            breakdown: markups,
            validation: this.validateTotalMarkup(),
            recommendations: []
        };

        // Generar recomendaciones
        if (total > 200) {
            analysis.recommendations.push('Considere reducir algunos márgenes para mantener competitividad');
        }
        if (markups.profit_margin.value < 20) {
            analysis.recommendations.push('El margen de ganancia es bajo, considere incrementarlo');
        }
        if (markups.material_costs.value > 40) {
            analysis.recommendations.push('Markup de materiales alto, verifique precios de proveedores');
        }

        return analysis;
    }

    // =================================================================
    // GESTIÓN DE HISTORIAL
    // =================================================================

    addToHistory(action, data) {
        const historyEntry = {
            id: Date.now(),
            action: action,
            timestamp: Date.now(),
            data: data,
            user: 'system' // Puede expandirse para multi-usuario
        };

        this.history.unshift(historyEntry);

        // Mantener límite de historial
        if (this.history.length > GLOBAL_MARKUP_CONFIG.storage.maxHistoryEntries) {
            this.history = this.history.slice(0, GLOBAL_MARKUP_CONFIG.storage.maxHistoryEntries);
        }

        // Guardar historial
        localStorage.setItem(GLOBAL_MARKUP_CONFIG.storage.historyKey, JSON.stringify(this.history));
    }

    getHistory(filters = {}) {
        let filteredHistory = [...this.history];

        if (filters.action) {
            filteredHistory = filteredHistory.filter(entry => entry.action === filters.action);
        }

        if (filters.category) {
            filteredHistory = filteredHistory.filter(entry => 
                entry.data.category === filters.category
            );
        }

        if (filters.dateFrom) {
            filteredHistory = filteredHistory.filter(entry => 
                entry.timestamp >= filters.dateFrom
            );
        }

        if (filters.limit) {
            filteredHistory = filteredHistory.slice(0, filters.limit);
        }

        return filteredHistory;
    }

    // =================================================================
    // PERSISTENCIA Y CONFIGURACIÓN
    // =================================================================

    saveConfig() {
        try {
            const configToSave = {};
            Object.keys(this.config).forEach(category => {
                configToSave[category] = {
                    defaultValue: this.config[category].defaultValue
                };
            });

            localStorage.setItem(GLOBAL_MARKUP_CONFIG.storage.configKey, JSON.stringify(configToSave));
            console.log('💾 Configuración de markup guardada');

        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
        }
    }

    exportConfig() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            config: this.getAllMarkups(),
            presets: this.getCustomPresets(),
            history: this.history.slice(0, 50) // Últimas 50 entradas
        };

        return JSON.stringify(exportData, null, 2);
    }

    importConfig(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            if (data.config) {
                Object.keys(data.config).forEach(category => {
                    if (this.config[category] && typeof data.config[category].value === 'number') {
                        this.config[category].defaultValue = data.config[category].value;
                    }
                });
            }

            this.hasUnsavedChanges = true;
            console.log('📥 Configuración importada exitosamente');

            return { success: true };

        } catch (error) {
            console.error('❌ Error importando configuración:', error);
            return { success: false, error: error.message };
        }
    }

    resetToDefaults() {
        this.config = { ...GLOBAL_MARKUP_CONFIG.markupCategories };
        this.currentPreset = null;
        this.hasUnsavedChanges = true;

        this.addToHistory('RESET', {
            description: 'Configuración restaurada a valores por defecto'
        });

        this.notifyObservers('config_reset', {});

        console.log('🔄 Configuración de markup restaurada a valores por defecto');

        return { success: true };
    }

    // =================================================================
    // SISTEMA DE OBSERVADORES
    // =================================================================

    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in markup system observer:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // =================================================================

    getStats() {
        return {
            currentMarkups: this.getAllMarkups(),
            totalMarkup: this.calculateTotalMarkup(),
            currentPreset: this.currentPreset,
            currentTier: this.currentTier,
            historyEntries: this.history.length,
            lastModified: this.history.length > 0 ? this.history[0].timestamp : null,
            validation: this.validateTotalMarkup(),
            analysis: this.getMarkupAnalysis()
        };
    }

    simulatePrice(materialCost, scenarios = {}) {
        const results = {};

        // Escenario actual
        results.current = this.calculatePrice(materialCost, { customerTier: this.currentTier });

        // Escenarios por tier de cliente
        Object.keys(GLOBAL_MARKUP_CONFIG.customerTiers).forEach(tier => {
            results[`tier_${tier}`] = this.calculatePrice(materialCost, { customerTier: tier });
        });

        // Escenarios por complejidad
        Object.keys(GLOBAL_MARKUP_CONFIG.markupCategories.labor_costs.factors).forEach(complexity => {
            results[`complexity_${complexity}`] = this.calculatePrice(materialCost, { 
                customerTier: this.currentTier,
                complexity: complexity 
            });
        });

        // Escenarios personalizados
        if (scenarios.custom) {
            Object.keys(scenarios.custom).forEach(scenarioName => {
                results[`custom_${scenarioName}`] = this.calculatePrice(
                    materialCost, 
                    scenarios.custom[scenarioName]
                );
            });
        }

        return results;
    }
}

// =================================================================
// FUNCIONES AUXILIARES Y UTILIDADES
// =================================================================

function formatCurrency(amount, currency = 'MXN') {
    // Validate input and handle edge cases
    if (amount === null || amount === undefined || amount === '') {
        return '$0.00';
    }
    
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    // Handle NaN and invalid numbers
    if (isNaN(numericAmount)) {
        return '$0.00';
    }
    
    // Ensure consistent formatting: $XX,XXX.XX
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
}

function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

function calculateMarkupFromPrices(costPrice, sellPrice) {
    if (costPrice <= 0) return 0;
    return ((sellPrice - costPrice) / costPrice) * 100;
}

function calculateMarginFromPrices(costPrice, sellPrice) {
    if (sellPrice <= 0) return 0;
    return ((sellPrice - costPrice) / sellPrice) * 100;
}

// =================================================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// =================================================================

// Función para integrar con sistema de cotizaciones
function integrateWithQuotationSystem() {
    if (typeof window !== 'undefined' && window.quotationSystem) {
        window.quotationSystem.addPricingCalculator = function(materialCost, options = {}) {
            return window.globalMarkupSystem.calculatePrice(materialCost, options);
        };
        
        console.log('🔗 Sistema de markup integrado con cotizaciones');
    }
}

// Función para integrar con calculadora de precios
function integrateWithCalculatorSystem() {
    if (typeof window !== 'undefined' && window.priceCalculator) {
        window.priceCalculator.applyMarkups = function(baseCost, options = {}) {
            return window.globalMarkupSystem.calculatePrice(baseCost, options);
        };
        
        console.log('🔗 Sistema de markup integrado con calculadora');
    }
}

// =================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.globalMarkupSystem = new GlobalMarkupSystem();
    
    // Integrar con otros sistemas cuando estén disponibles
    setTimeout(() => {
        integrateWithQuotationSystem();
        integrateWithCalculatorSystem();
    }, 1000);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GlobalMarkupSystem,
        GLOBAL_MARKUP_CONFIG,
        formatCurrency,
        formatPercentage,
        calculateMarkupFromPrices,
        calculateMarginFromPrices
    };
}

console.log('✅ Sistema de Markup Global v1.0 cargado correctamente');
console.log('📊 Ver estadísticas: window.globalMarkupSystem.getStats()');
console.log('🔧 Calcular precio: window.globalMarkupSystem.calculatePrice(materialCost, options)');
console.log('📋 Aplicar preset: window.globalMarkupSystem.applyPreset("rings")');