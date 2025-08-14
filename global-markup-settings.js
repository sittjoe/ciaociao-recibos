// global-markup-settings.js - SISTEMA DE CONFIGURACIÓN GLOBAL DE MÁRGENES v1.0
// Control separado de costos de materiales, mano de obra, gastos generales y márgenes de ganancia
// =================================================================

console.log('📊 Iniciando Sistema de Configuración Global de Márgenes v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE MÁRGENES
// =================================================================

const MARKUP_CONFIG = {
    // Categorías principales de costos
    costCategories: {
        materials: {
            name: 'Materiales',
            description: 'Costo de metales preciosos, diamantes y piedras',
            icon: '💎',
            color: '#D4AF37',
            baseMultiplier: 1.0,
            allowNegative: false
        },
        labor: {
            name: 'Mano de Obra',
            description: 'Costos de fabricación, diseño y acabados',
            icon: '🔨',
            color: '#8B4513',
            baseMultiplier: 1.0,
            allowNegative: false
        },
        overhead: {
            name: 'Gastos Generales',
            description: 'Renta, utilidades, seguros, herramientas',
            icon: '🏢',
            color: '#708090',
            baseMultiplier: 1.0,
            allowNegative: false
        },
        profit: {
            name: 'Margen de Ganancia',
            description: 'Utilidad neta del negocio',
            icon: '📈',
            color: '#228B22',
            baseMultiplier: 1.0,
            allowNegative: false
        }
    },

    // Tipos de márgen disponibles
    markupTypes: {
        percentage: {
            name: 'Porcentaje',
            symbol: '%',
            min: 0,
            max: 1000,
            step: 0.1,
            default: 0,
            description: 'Aplicar como porcentaje del costo base'
        },
        fixed: {
            name: 'Cantidad Fija',
            symbol: 'MXN',
            min: 0,
            max: 100000,
            step: 1,
            default: 0,
            description: 'Agregar cantidad fija en pesos mexicanos'
        },
        multiplier: {
            name: 'Multiplicador',
            symbol: 'x',
            min: 0.1,
            max: 10.0,
            step: 0.1,
            default: 1.0,
            description: 'Multiplicar costo base por factor'
        },
        perGram: {
            name: 'Por Gramo',
            symbol: 'MXN/g',
            min: 0,
            max: 1000,
            step: 0.01,
            default: 0,
            description: 'Costo adicional por gramo de material'
        },
        perHour: {
            name: 'Por Hora',
            symbol: 'MXN/hr',
            min: 0,
            max: 5000,
            step: 1,
            default: 0,
            description: 'Costo por hora de trabajo'
        }
    },

    // Plantillas predefinidas de márgenes
    templates: {
        wholesale: {
            name: 'Mayoreo',
            description: 'Precios para distribuidores y mayoristas',
            materials: { type: 'percentage', value: 15 },
            labor: { type: 'percentage', value: 20 },
            overhead: { type: 'percentage', value: 10 },
            profit: { type: 'percentage', value: 15 }
        },
        retail: {
            name: 'Menudeo',
            description: 'Precios para clientes finales',
            materials: { type: 'percentage', value: 30 },
            labor: { type: 'percentage', value: 40 },
            overhead: { type: 'percentage', value: 20 },
            profit: { type: 'percentage', value: 25 }
        },
        premium: {
            name: 'Premium',
            description: 'Productos de alta gama y exclusivos',
            materials: { type: 'percentage', value: 50 },
            labor: { type: 'percentage', value: 75 },
            overhead: { type: 'percentage', value: 30 },
            profit: { type: 'percentage', value: 40 }
        },
        custom: {
            name: 'Personalizado',
            description: 'Configuración personalizada por el usuario',
            materials: { type: 'percentage', value: 0 },
            labor: { type: 'percentage', value: 0 },
            overhead: { type: 'percentage', value: 0 },
            profit: { type: 'percentage', value: 0 }
        }
    },

    // Configuración por tipo de producto
    productTypes: {
        rings: {
            name: 'Anillos',
            icon: '💍',
            defaultTemplate: 'retail',
            laborMultiplier: 1.0,
            complexityFactors: {
                simple: 1.0,
                medium: 1.3,
                complex: 1.7,
                masterpiece: 2.5
            }
        },
        necklaces: {
            name: 'Collares',
            icon: '📿',
            defaultTemplate: 'retail',
            laborMultiplier: 1.2,
            complexityFactors: {
                simple: 1.0,
                medium: 1.4,
                complex: 1.9,
                masterpiece: 3.0
            }
        },
        bracelets: {
            name: 'Pulseras',
            icon: '⌚',
            defaultTemplate: 'retail',
            laborMultiplier: 1.1,
            complexityFactors: {
                simple: 1.0,
                medium: 1.2,
                complex: 1.6,
                masterpiece: 2.3
            }
        },
        earrings: {
            name: 'Aretes',
            icon: '👂',
            defaultTemplate: 'retail',
            laborMultiplier: 0.9,
            complexityFactors: {
                simple: 1.0,
                medium: 1.3,
                complex: 1.8,
                masterpiece: 2.7
            }
        },
        pendants: {
            name: 'Dijes',
            icon: '🔮',
            defaultTemplate: 'retail',
            laborMultiplier: 0.8,
            complexityFactors: {
                simple: 1.0,
                medium: 1.2,
                complex: 1.5,
                masterpiece: 2.2
            }
        }
    },

    // Configuración de cálculo
    calculation: {
        roundingMode: 'nearest', // nearest, up, down
        roundingIncrement: 1, // Redondear a peso más cercano
        minimumProfit: 0, // Margen mínimo en MXN
        maximumMarkup: 500, // Máximo % de markup total
        applyOrder: ['materials', 'labor', 'overhead', 'profit'] // Orden de aplicación
    },

    // Configuración de persistencia
    storage: {
        prefix: 'ciaociao_markup_',
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 días
        backupInterval: 2 * 60 * 1000, // 2 minutos
        maxConfigurations: 10
    }
};

// =================================================================
// CLASE PRINCIPAL DE CONFIGURACIÓN DE MÁRGENES
// =================================================================

class GlobalMarkupSettings {
    constructor() {
        this.currentSettings = new Map();
        this.savedConfigurations = new Map();
        this.currentConfiguration = null;
        this.isInitialized = false;
        this.observers = [];
        this.updateTimer = null;
        
        // Cargar configuración por defecto
        this.loadDefaultSettings();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de configuración de márgenes...');
        
        try {
            // Cargar datos persistidos
            this.loadPersistedData();
            
            // Configurar interfaz si no existe
            if (!document.getElementById('markupSettingsContainer')) {
                this.setupUI();
            }
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('✅ Sistema de configuración de márgenes inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando configuración de márgenes:', error);
            throw error;
        }
    }

    loadDefaultSettings() {
        // Cargar configuración retail como default
        const defaultTemplate = MARKUP_CONFIG.templates.retail;
        
        Object.keys(MARKUP_CONFIG.costCategories).forEach(category => {
            if (defaultTemplate[category]) {
                this.currentSettings.set(category, {
                    ...defaultTemplate[category],
                    enabled: true
                });
            } else {
                this.currentSettings.set(category, {
                    type: 'percentage',
                    value: 0,
                    enabled: false
                });
            }
        });
    }

    // =================================================================
    // CONFIGURACIÓN DE INTERFAZ DE USUARIO
    // =================================================================

    setupUI() {
        this.createMainInterface();
        this.setupEventListeners();
        this.renderTemplateSelector();
        this.renderCostCategories();
        this.renderProductTypeSettings();
        this.updateCalculationPreview();
    }

    createMainInterface() {
        let container = document.getElementById('markupSettingsContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'markupSettingsContainer';
            container.className = 'markup-settings-container';
            
            const targetElement = document.querySelector('.manual-pricing-container') || 
                                 document.querySelector('.calculator-container') || 
                                 document.querySelector('.container') || 
                                 document.body;
            targetElement.appendChild(container);
        }

        container.innerHTML = `
            <div class="markup-settings-header">
                <h2>📊 Configuración Global de Márgenes</h2>
                <p>Configure márgenes separados para materiales, mano de obra, gastos generales y ganancia</p>
                
                <div class="template-selector">
                    <label for="templateSelect">Plantilla de precios:</label>
                    <select id="templateSelect">
                        <option value="">-- Seleccionar Plantilla --</option>
                    </select>
                    <button id="loadTemplate" class="btn-load">📂 Cargar</button>
                    <button id="saveAsTemplate" class="btn-save">💾 Guardar Como...</button>
                </div>
                
                <div class="configuration-controls">
                    <input type="text" id="configurationName" placeholder="Nombre de configuración" maxlength="50">
                    <select id="configurationSelector">
                        <option value="">-- Nueva Configuración --</option>
                    </select>
                    <button id="saveConfiguration" class="btn-save">💾 Guardar</button>
                    <button id="deleteConfiguration" class="btn-delete">🗑️ Eliminar</button>
                    <button id="resetToDefault" class="btn-reset">🔄 Resetear</button>
                </div>
            </div>
            
            <div class="cost-categories-grid" id="costCategoriesGrid">
                <!-- Se llenarán dinámicamente -->
            </div>
            
            <div class="product-type-settings">
                <h3>🏷️ Configuración por Tipo de Producto</h3>
                <div class="product-types-grid" id="productTypesGrid">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
            
            <div class="calculation-preview">
                <h3>🧮 Vista Previa de Cálculo</h3>
                <div class="preview-controls">
                    <div class="input-group">
                        <label>Costo de materiales (MXN):</label>
                        <input type="number" id="previewMaterials" value="1000" min="0" step="1">
                    </div>
                    <div class="input-group">
                        <label>Horas de trabajo:</label>
                        <input type="number" id="previewHours" value="5" min="0" step="0.1">
                    </div>
                    <div class="input-group">
                        <label>Peso total (gramos):</label>
                        <input type="number" id="previewWeight" value="10" min="0" step="0.1">
                    </div>
                    <div class="input-group">
                        <label>Tipo de producto:</label>
                        <select id="previewProductType">
                            ${Object.keys(MARKUP_CONFIG.productTypes).map(type => 
                                `<option value="${type}">${MARKUP_CONFIG.productTypes[type].name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Complejidad:</label>
                        <select id="previewComplexity">
                            <option value="simple">Simple</option>
                            <option value="medium">Medio</option>
                            <option value="complex">Complejo</option>
                            <option value="masterpiece">Obra Maestra</option>
                        </select>
                    </div>
                </div>
                
                <div class="calculation-breakdown" id="calculationBreakdown">
                    <!-- Se llenará dinámicamente -->
                </div>
                
                <div class="export-controls">
                    <button id="exportSettings" class="btn-export">📤 Exportar Configuración</button>
                    <input type="file" id="importSettings" accept=".json" style="display: none;">
                    <button id="importButton" class="btn-import">📥 Importar</button>
                    <button id="copyToCalculator" class="btn-apply">🔄 Aplicar a Calculadora</button>
                </div>
            </div>
        `;
    }

    renderTemplateSelector() {
        const templateSelect = document.getElementById('templateSelect');
        if (!templateSelect) return;

        templateSelect.innerHTML = '<option value="">-- Seleccionar Plantilla --</option>';

        Object.keys(MARKUP_CONFIG.templates).forEach(templateKey => {
            const template = MARKUP_CONFIG.templates[templateKey];
            const option = document.createElement('option');
            option.value = templateKey;
            option.textContent = `${template.name} - ${template.description}`;
            templateSelect.appendChild(option);
        });
    }

    renderCostCategories() {
        const grid = document.getElementById('costCategoriesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.keys(MARKUP_CONFIG.costCategories).forEach(categoryKey => {
            const category = MARKUP_CONFIG.costCategories[categoryKey];
            const setting = this.currentSettings.get(categoryKey) || {
                type: 'percentage',
                value: 0,
                enabled: false
            };

            const categoryElement = document.createElement('div');
            categoryElement.className = 'cost-category-card';
            categoryElement.setAttribute('data-category', categoryKey);

            categoryElement.innerHTML = `
                <div class="category-header" style="border-left: 4px solid ${category.color}">
                    <div class="category-title">
                        <span class="category-icon">${category.icon}</span>
                        <h3>${category.name}</h3>
                        <label class="toggle-switch">
                            <input type="checkbox" class="category-enabled" ${setting.enabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <p class="category-description">${category.description}</p>
                </div>

                <div class="category-controls ${setting.enabled ? 'enabled' : 'disabled'}">
                    <div class="markup-type-selector">
                        <label>Tipo de márgen:</label>
                        <select class="markup-type-select">
                            ${Object.keys(MARKUP_CONFIG.markupTypes).map(type => 
                                `<option value="${type}" ${setting.type === type ? 'selected' : ''}>
                                    ${MARKUP_CONFIG.markupTypes[type].name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="markup-value-input">
                        <label>Valor:</label>
                        <div class="input-with-unit">
                            <input type="number" 
                                   class="markup-value" 
                                   value="${setting.value}"
                                   min="${this.getMinValue(setting.type)}"
                                   max="${this.getMaxValue(setting.type)}"
                                   step="${this.getStepValue(setting.type)}"
                                   placeholder="0">
                            <span class="markup-unit">${this.getUnitSymbol(setting.type)}</span>
                        </div>
                    </div>

                    <div class="markup-description">
                        <small>${MARKUP_CONFIG.markupTypes[setting.type]?.description || ''}</small>
                    </div>

                    <div class="quick-presets">
                        <span>Presets rápidos:</span>
                        ${this.getQuickPresets(categoryKey, setting.type).map(preset => 
                            `<button class="btn-preset" data-value="${preset.value}">${preset.label}</button>`
                        ).join('')}
                    </div>
                </div>
            `;

            grid.appendChild(categoryElement);
        });
    }

    renderProductTypeSettings() {
        const grid = document.getElementById('productTypesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.keys(MARKUP_CONFIG.productTypes).forEach(typeKey => {
            const productType = MARKUP_CONFIG.productTypes[typeKey];
            
            const typeElement = document.createElement('div');
            typeElement.className = 'product-type-card';
            typeElement.setAttribute('data-product-type', typeKey);

            typeElement.innerHTML = `
                <div class="product-type-header">
                    <span class="product-icon">${productType.icon}</span>
                    <h4>${productType.name}</h4>
                </div>
                
                <div class="product-type-settings">
                    <div class="setting-row">
                        <label>Multiplicador de mano de obra:</label>
                        <input type="number" 
                               class="labor-multiplier" 
                               value="${productType.laborMultiplier}"
                               min="0.1" 
                               max="5.0" 
                               step="0.1">
                        <span class="unit">x</span>
                    </div>
                    
                    <div class="complexity-factors">
                        <label>Factores de complejidad:</label>
                        ${Object.keys(productType.complexityFactors).map(complexity => `
                            <div class="complexity-row">
                                <span class="complexity-name">${this.getComplexityName(complexity)}:</span>
                                <input type="number" 
                                       class="complexity-factor" 
                                       data-complexity="${complexity}"
                                       value="${productType.complexityFactors[complexity]}"
                                       min="0.1" 
                                       max="10.0" 
                                       step="0.1">
                                <span class="unit">x</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            grid.appendChild(typeElement);
        });
    }

    // =================================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // =================================================================

    setupEventListeners() {
        // Event delegation para controles dinámicos
        document.addEventListener('change', (e) => {
            if (e.target.matches('.category-enabled')) {
                this.handleCategoryToggle(e.target);
            } else if (e.target.matches('.markup-type-select')) {
                this.handleMarkupTypeChange(e.target);
            } else if (e.target.matches('.markup-value')) {
                this.handleMarkupValueChange(e.target);
            } else if (e.target.matches('.labor-multiplier')) {
                this.handleLaborMultiplierChange(e.target);
            } else if (e.target.matches('.complexity-factor')) {
                this.handleComplexityFactorChange(e.target);
            } else if (e.target.matches('#templateSelect')) {
                // No auto-load template on change
            } else if (e.target.matches('#configurationSelector')) {
                this.handleConfigurationSelection(e.target.value);
            } else if (e.target.matches('#previewMaterials, #previewHours, #previewWeight, #previewProductType, #previewComplexity')) {
                this.updateCalculationPreview();
            }
        });

        // Event delegation para botones
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-preset')) {
                this.handlePresetClick(e.target);
            } else if (e.target.matches('#loadTemplate')) {
                this.loadTemplate();
            } else if (e.target.matches('#saveAsTemplate')) {
                this.saveAsTemplate();
            } else if (e.target.matches('#saveConfiguration')) {
                this.saveCurrentConfiguration();
            } else if (e.target.matches('#deleteConfiguration')) {
                this.deleteCurrentConfiguration();
            } else if (e.target.matches('#resetToDefault')) {
                this.resetToDefault();
            } else if (e.target.matches('#exportSettings')) {
                this.exportSettings();
            } else if (e.target.matches('#importButton')) {
                document.getElementById('importSettings').click();
            } else if (e.target.matches('#copyToCalculator')) {
                this.copyToCalculator();
            }
        });

        // Import file handler
        document.addEventListener('change', (e) => {
            if (e.target.matches('#importSettings')) {
                this.importSettings(e.target);
            }
        });

        // Input debouncing para preview
        document.addEventListener('input', (e) => {
            if (e.target.matches('.markup-value, #previewMaterials, #previewHours, #previewWeight')) {
                clearTimeout(this.updateTimer);
                this.updateTimer = setTimeout(() => {
                    if (e.target.matches('.markup-value')) {
                        this.handleMarkupValueChange(e.target);
                    } else {
                        this.updateCalculationPreview();
                    }
                }, 300);
            }
        });
    }

    // =================================================================
    // HANDLERS DE EVENTOS
    // =================================================================

    handleCategoryToggle(checkbox) {
        const categoryCard = checkbox.closest('.cost-category-card');
        const categoryKey = categoryCard.getAttribute('data-category');
        const controls = categoryCard.querySelector('.category-controls');
        
        const setting = this.currentSettings.get(categoryKey) || {
            type: 'percentage',
            value: 0,
            enabled: false
        };
        
        setting.enabled = checkbox.checked;
        this.currentSettings.set(categoryKey, setting);
        
        controls.classList.toggle('enabled', checkbox.checked);
        controls.classList.toggle('disabled', !checkbox.checked);
        
        this.updateCalculationPreview();
        this.notifyObservers('category_toggled', { categoryKey, enabled: checkbox.checked });
    }

    handleMarkupTypeChange(select) {
        const categoryCard = select.closest('.cost-category-card');
        const categoryKey = categoryCard.getAttribute('data-category');
        
        const setting = this.currentSettings.get(categoryKey) || {
            type: 'percentage',
            value: 0,
            enabled: true
        };
        
        setting.type = select.value;
        setting.value = 0; // Reset value when changing type
        this.currentSettings.set(categoryKey, setting);
        
        // Update input constraints and unit
        const valueInput = categoryCard.querySelector('.markup-value');
        const unitSpan = categoryCard.querySelector('.markup-unit');
        const descriptionDiv = categoryCard.querySelector('.markup-description small');
        
        valueInput.value = 0;
        valueInput.min = this.getMinValue(setting.type);
        valueInput.max = this.getMaxValue(setting.type);
        valueInput.step = this.getStepValue(setting.type);
        unitSpan.textContent = this.getUnitSymbol(setting.type);
        descriptionDiv.textContent = MARKUP_CONFIG.markupTypes[setting.type]?.description || '';
        
        // Update quick presets
        const presetsContainer = categoryCard.querySelector('.quick-presets');
        const presetsHTML = this.getQuickPresets(categoryKey, setting.type).map(preset => 
            `<button class="btn-preset" data-value="${preset.value}">${preset.label}</button>`
        ).join('');
        presetsContainer.innerHTML = '<span>Presets rápidos:</span>' + presetsHTML;
        
        this.updateCalculationPreview();
    }

    handleMarkupValueChange(input) {
        const categoryCard = input.closest('.cost-category-card');
        const categoryKey = categoryCard.getAttribute('data-category');
        
        const setting = this.currentSettings.get(categoryKey) || {
            type: 'percentage',
            value: 0,
            enabled: true
        };
        
        setting.value = parseFloat(input.value) || 0;
        this.currentSettings.set(categoryKey, setting);
        
        this.updateCalculationPreview();
        this.notifyObservers('markup_value_changed', { categoryKey, value: setting.value });
    }

    handlePresetClick(button) {
        const value = parseFloat(button.getAttribute('data-value'));
        const categoryCard = button.closest('.cost-category-card');
        const valueInput = categoryCard.querySelector('.markup-value');
        
        valueInput.value = value;
        this.handleMarkupValueChange(valueInput);
    }

    handleLaborMultiplierChange(input) {
        const typeCard = input.closest('.product-type-card');
        const typeKey = typeCard.getAttribute('data-product-type');
        const value = parseFloat(input.value) || 1.0;
        
        if (MARKUP_CONFIG.productTypes[typeKey]) {
            MARKUP_CONFIG.productTypes[typeKey].laborMultiplier = value;
            this.updateCalculationPreview();
            this.notifyObservers('labor_multiplier_changed', { typeKey, value });
        }
    }

    handleComplexityFactorChange(input) {
        const typeCard = input.closest('.product-type-card');
        const typeKey = typeCard.getAttribute('data-product-type');
        const complexity = input.getAttribute('data-complexity');
        const value = parseFloat(input.value) || 1.0;
        
        if (MARKUP_CONFIG.productTypes[typeKey] && MARKUP_CONFIG.productTypes[typeKey].complexityFactors[complexity]) {
            MARKUP_CONFIG.productTypes[typeKey].complexityFactors[complexity] = value;
            this.updateCalculationPreview();
            this.notifyObservers('complexity_factor_changed', { typeKey, complexity, value });
        }
    }

    // =================================================================
    // CÁLCULOS Y VISTA PREVIA
    // =================================================================

    calculateFinalPrice(baseMaterialCost, laborHours, weight, productType, complexity) {
        const result = {
            baseMaterialCost: baseMaterialCost,
            laborHours: laborHours,
            weight: weight,
            productType: productType,
            complexity: complexity,
            breakdown: {},
            subtotals: {},
            finalPrice: 0
        };

        let runningTotal = 0;

        // Aplicar márgenes en el orden configurado
        MARKUP_CONFIG.calculation.applyOrder.forEach(categoryKey => {
            const setting = this.currentSettings.get(categoryKey);
            if (!setting || !setting.enabled) {
                result.breakdown[categoryKey] = {
                    enabled: false,
                    type: 'percentage',
                    value: 0,
                    appliedAmount: 0,
                    runningTotal: runningTotal
                };
                return;
            }

            let appliedAmount = 0;
            const productTypeConfig = MARKUP_CONFIG.productTypes[productType] || MARKUP_CONFIG.productTypes.rings;

            switch (setting.type) {
                case 'percentage':
                    appliedAmount = runningTotal * (setting.value / 100);
                    break;
                    
                case 'fixed':
                    appliedAmount = setting.value;
                    break;
                    
                case 'multiplier':
                    appliedAmount = runningTotal * (setting.value - 1);
                    break;
                    
                case 'perGram':
                    appliedAmount = setting.value * weight;
                    break;
                    
                case 'perHour':
                    appliedAmount = setting.value * laborHours;
                    break;
            }

            // Aplicar multiplicadores específicos por categoría
            if (categoryKey === 'labor') {
                // Aplicar multiplicador del tipo de producto
                appliedAmount *= productTypeConfig.laborMultiplier;
                
                // Aplicar factor de complejidad
                const complexityFactor = productTypeConfig.complexityFactors[complexity] || 1.0;
                appliedAmount *= complexityFactor;
            }

            runningTotal += appliedAmount;

            result.breakdown[categoryKey] = {
                enabled: true,
                type: setting.type,
                value: setting.value,
                appliedAmount: appliedAmount,
                runningTotal: runningTotal
            };

            result.subtotals[categoryKey] = runningTotal;
        });

        // Redondear según configuración
        result.finalPrice = this.roundPrice(runningTotal);
        
        // Calcular márgenes totales
        result.totalMarkup = result.finalPrice - baseMaterialCost;
        result.markupPercentage = ((result.finalPrice - baseMaterialCost) / baseMaterialCost) * 100;

        return result;
    }

    roundPrice(price) {
        const mode = MARKUP_CONFIG.calculation.roundingMode;
        const increment = MARKUP_CONFIG.calculation.roundingIncrement;

        switch (mode) {
            case 'up':
                return Math.ceil(price / increment) * increment;
            case 'down':
                return Math.floor(price / increment) * increment;
            case 'nearest':
            default:
                return Math.round(price / increment) * increment;
        }
    }

    updateCalculationPreview() {
        const materialsInput = document.getElementById('previewMaterials');
        const hoursInput = document.getElementById('previewHours');
        const weightInput = document.getElementById('previewWeight');
        const productTypeSelect = document.getElementById('previewProductType');
        const complexitySelect = document.getElementById('previewComplexity');
        const breakdownDiv = document.getElementById('calculationBreakdown');

        if (!materialsInput || !breakdownDiv) return;

        const materials = parseFloat(materialsInput.value) || 0;
        const hours = parseFloat(hoursInput.value) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        const productType = productTypeSelect?.value || 'rings';
        const complexity = complexitySelect?.value || 'simple';

        const calculation = this.calculateFinalPrice(materials, hours, weight, productType, complexity);

        breakdownDiv.innerHTML = `
            <div class="calculation-summary">
                <div class="summary-row total">
                    <span class="label">💰 Precio Final:</span>
                    <span class="value">$${calculation.finalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="summary-row markup">
                    <span class="label">📈 Margen Total:</span>
                    <span class="value">$${calculation.totalMarkup.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${calculation.markupPercentage.toFixed(1)}%)</span>
                </div>
            </div>

            <div class="breakdown-details">
                <h4>📋 Desglose por Categoría:</h4>
                
                <div class="breakdown-row base">
                    <span class="category">💎 Costo Base de Materiales</span>
                    <span class="amount">$${materials.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    <span class="running-total">$${materials.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>

                ${Object.keys(MARKUP_CONFIG.costCategories).map(categoryKey => {
                    const category = MARKUP_CONFIG.costCategories[categoryKey];
                    const breakdown = calculation.breakdown[categoryKey];
                    
                    if (!breakdown.enabled) {
                        return `
                            <div class="breakdown-row disabled">
                                <span class="category">${category.icon} ${category.name}</span>
                                <span class="amount">Deshabilitado</span>
                                <span class="running-total">-</span>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="breakdown-row enabled">
                            <span class="category">${category.icon} ${category.name}</span>
                            <span class="amount">+$${breakdown.appliedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            <span class="running-total">$${breakdown.runningTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            <span class="method">(${breakdown.type}: ${breakdown.value}${this.getUnitSymbol(breakdown.type)})</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="calculation-info">
                <div class="info-row">
                    <span>🏷️ Tipo de producto: <strong>${MARKUP_CONFIG.productTypes[productType]?.name}</strong></span>
                </div>
                <div class="info-row">
                    <span>⚙️ Complejidad: <strong>${this.getComplexityName(complexity)}</strong></span>
                </div>
                <div class="info-row">
                    <span>🔨 Multiplicador de trabajo: <strong>${MARKUP_CONFIG.productTypes[productType]?.laborMultiplier}x</strong></span>
                </div>
                <div class="info-row">
                    <span>🎯 Factor de complejidad: <strong>${MARKUP_CONFIG.productTypes[productType]?.complexityFactors[complexity]}x</strong></span>
                </div>
            </div>
        `;
    }

    // =================================================================
    // GESTIÓN DE PLANTILLAS Y CONFIGURACIONES
    // =================================================================

    loadTemplate() {
        const templateSelect = document.getElementById('templateSelect');
        const templateKey = templateSelect.value;
        
        if (!templateKey) {
            alert('Por favor seleccione una plantilla');
            return;
        }

        const template = MARKUP_CONFIG.templates[templateKey];
        if (!template) {
            alert('Plantilla no encontrada');
            return;
        }

        // Cargar configuración de la plantilla
        Object.keys(MARKUP_CONFIG.costCategories).forEach(categoryKey => {
            if (template[categoryKey]) {
                this.currentSettings.set(categoryKey, {
                    ...template[categoryKey],
                    enabled: template[categoryKey].value > 0
                });
            }
        });

        // Actualizar UI
        this.renderCostCategories();
        this.updateCalculationPreview();
        
        this.notifyObservers('template_loaded', { templateKey, template });
        console.log(`📂 Plantilla cargada: ${template.name}`);
    }

    saveAsTemplate() {
        const templateName = prompt('Nombre para la nueva plantilla:');
        if (!templateName) return;

        const templateKey = templateName.toLowerCase().replace(/\s+/g, '_');
        
        const newTemplate = {
            name: templateName,
            description: `Plantilla personalizada - ${new Date().toLocaleDateString()}`,
            ...Object.fromEntries(
                Array.from(this.currentSettings.entries()).map(([key, setting]) => [
                    key, 
                    { type: setting.type, value: setting.value }
                ])
            )
        };

        MARKUP_CONFIG.templates[templateKey] = newTemplate;
        this.renderTemplateSelector();
        
        alert(`Plantilla "${templateName}" guardada exitosamente`);
        console.log(`💾 Nueva plantilla guardada: ${templateName}`);
    }

    saveCurrentConfiguration() {
        const nameInput = document.getElementById('configurationName');
        const configName = nameInput.value.trim();

        if (!configName) {
            alert('Por favor ingrese un nombre para la configuración');
            return;
        }

        const configuration = {
            name: configName,
            settings: Object.fromEntries(this.currentSettings),
            productTypes: JSON.parse(JSON.stringify(MARKUP_CONFIG.productTypes)),
            created: Date.now(),
            modified: Date.now()
        };

        this.savedConfigurations.set(configName, configuration);
        this.currentConfiguration = configName;
        
        this.renderConfigurationSelector();
        this.persistData();
        
        this.notifyObservers('configuration_saved', { configName, configuration });
        console.log(`💾 Configuración guardada: ${configName}`);
    }

    renderConfigurationSelector() {
        const selector = document.getElementById('configurationSelector');
        if (!selector) return;

        selector.innerHTML = '<option value="">-- Nueva Configuración --</option>';

        this.savedConfigurations.forEach((config, configName) => {
            const option = document.createElement('option');
            option.value = configName;
            option.textContent = configName;
            selector.appendChild(option);
        });
        
        if (this.currentConfiguration) {
            selector.value = this.currentConfiguration;
        }
    }

    handleConfigurationSelection(configName) {
        if (!configName) {
            this.currentConfiguration = null;
            document.getElementById('configurationName').value = '';
            return;
        }

        const config = this.savedConfigurations.get(configName);
        if (config) {
            this.loadConfiguration(config);
            this.currentConfiguration = configName;
            document.getElementById('configurationName').value = configName;
        }
    }

    loadConfiguration(config) {
        // Cargar settings
        this.currentSettings = new Map(Object.entries(config.settings));
        
        // Cargar product types si están disponibles
        if (config.productTypes) {
            Object.assign(MARKUP_CONFIG.productTypes, config.productTypes);
        }
        
        // Actualizar UI
        this.renderCostCategories();
        this.renderProductTypeSettings();
        this.updateCalculationPreview();
        
        console.log(`📂 Configuración cargada: ${config.name}`);
    }

    deleteCurrentConfiguration() {
        const configName = this.currentConfiguration;
        if (!configName) {
            alert('No hay configuración seleccionada para eliminar');
            return;
        }

        if (confirm(`¿Está seguro de eliminar la configuración "${configName}"?`)) {
            this.savedConfigurations.delete(configName);
            this.currentConfiguration = null;
            
            document.getElementById('configurationSelector').value = '';
            document.getElementById('configurationName').value = '';
            
            this.renderConfigurationSelector();
            this.persistData();
            
            console.log(`🗑️ Configuración eliminada: ${configName}`);
        }
    }

    resetToDefault() {
        if (confirm('¿Resetear a configuración por defecto? Se perderán los cambios actuales.')) {
            this.loadDefaultSettings();
            this.renderCostCategories();
            this.updateCalculationPreview();
            
            console.log('🔄 Configuración reseteada a valores por defecto');
        }
    }

    // =================================================================
    // FUNCIONES DE UTILIDAD
    // =================================================================

    getMinValue(type) {
        return MARKUP_CONFIG.markupTypes[type]?.min || 0;
    }

    getMaxValue(type) {
        return MARKUP_CONFIG.markupTypes[type]?.max || 1000;
    }

    getStepValue(type) {
        return MARKUP_CONFIG.markupTypes[type]?.step || 0.01;
    }

    getUnitSymbol(type) {
        return MARKUP_CONFIG.markupTypes[type]?.symbol || '';
    }

    getComplexityName(complexity) {
        const names = {
            simple: 'Simple',
            medium: 'Medio',
            complex: 'Complejo',
            masterpiece: 'Obra Maestra'
        };
        return names[complexity] || complexity;
    }

    getQuickPresets(categoryKey, markupType) {
        const presets = {
            materials: {
                percentage: [
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                    { value: 30, label: '30%' },
                    { value: 50, label: '50%' }
                ],
                fixed: [
                    { value: 100, label: '$100' },
                    { value: 500, label: '$500' },
                    { value: 1000, label: '$1000' }
                ]
            },
            labor: {
                percentage: [
                    { value: 25, label: '25%' },
                    { value: 40, label: '40%' },
                    { value: 60, label: '60%' },
                    { value: 100, label: '100%' }
                ],
                perHour: [
                    { value: 200, label: '$200/hr' },
                    { value: 350, label: '$350/hr' },
                    { value: 500, label: '$500/hr' }
                ]
            },
            overhead: {
                percentage: [
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                    { value: 15, label: '15%' },
                    { value: 20, label: '20%' }
                ]
            },
            profit: {
                percentage: [
                    { value: 15, label: '15%' },
                    { value: 25, label: '25%' },
                    { value: 40, label: '40%' },
                    { value: 60, label: '60%' }
                ]
            }
        };

        return presets[categoryKey]?.[markupType] || [
            { value: 0, label: '0%' },
            { value: 10, label: '10%' },
            { value: 25, label: '25%' }
        ];
    }

    // =================================================================
    // EXPORTACIÓN E IMPORTACIÓN
    // =================================================================

    exportSettings() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            currentSettings: Object.fromEntries(this.currentSettings),
            savedConfigurations: Object.fromEntries(this.savedConfigurations),
            productTypes: MARKUP_CONFIG.productTypes,
            templates: MARKUP_CONFIG.templates
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `markup_settings_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Configuración de márgenes exportada');
    }

    importSettings(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.version !== '1.0') {
                    throw new Error('Versión de archivo no compatible');
                }
                
                if (confirm('¿Importar configuración? Esto reemplazará la configuración actual.')) {
                    // Cargar datos
                    if (importData.currentSettings) {
                        this.currentSettings = new Map(Object.entries(importData.currentSettings));
                    }
                    
                    if (importData.savedConfigurations) {
                        this.savedConfigurations = new Map(Object.entries(importData.savedConfigurations));
                    }
                    
                    if (importData.productTypes) {
                        Object.assign(MARKUP_CONFIG.productTypes, importData.productTypes);
                    }
                    
                    if (importData.templates) {
                        Object.assign(MARKUP_CONFIG.templates, importData.templates);
                    }
                    
                    // Actualizar UI
                    this.setupUI();
                    this.persistData();
                    
                    alert('Configuración importada exitosamente');
                    console.log('📥 Configuración de márgenes importada');
                }
                
            } catch (error) {
                console.error('❌ Error importando configuración:', error);
                alert('Error al importar archivo: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        input.value = '';
    }

    copyToCalculator() {
        if (window.kitcoPricing || window.priceCalculator) {
            // Copiar configuración actual al calculadora
            const settings = Object.fromEntries(this.currentSettings);
            
            if (window.priceCalculator) {
                window.priceCalculator.markupSettings = settings;
                console.log('🔄 Configuración copiada al calculadora de precios');
            }
            
            this.notifyObservers('settings_copied_to_calculator', { settings });
            alert('Configuración aplicada al calculadora exitosamente');
            
        } else {
            alert('Calculadora de precios no disponible');
        }
    }

    // =================================================================
    // PERSISTENCIA Y OBSERVERS
    // =================================================================

    persistData() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                currentSettings: Object.fromEntries(this.currentSettings),
                savedConfigurations: Object.fromEntries(this.savedConfigurations),
                currentConfiguration: this.currentConfiguration,
                productTypes: MARKUP_CONFIG.productTypes
            };

            localStorage.setItem(
                MARKUP_CONFIG.storage.prefix + 'data',
                JSON.stringify(data)
            );

        } catch (error) {
            console.error('Error persistiendo configuración de márgenes:', error);
        }
    }

    loadPersistedData() {
        try {
            const stored = localStorage.getItem(MARKUP_CONFIG.storage.prefix + 'data');
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Verificar TTL
            const age = Date.now() - data.timestamp;
            if (age > MARKUP_CONFIG.storage.ttl) {
                console.log('🗂️ Datos de márgenes expirados, usando defaults');
                return;
            }

            // Restaurar datos
            if (data.currentSettings) {
                this.currentSettings = new Map(Object.entries(data.currentSettings));
            }
            
            if (data.savedConfigurations) {
                this.savedConfigurations = new Map(Object.entries(data.savedConfigurations));
            }
            
            if (data.currentConfiguration) {
                this.currentConfiguration = data.currentConfiguration;
            }
            
            if (data.productTypes) {
                Object.assign(MARKUP_CONFIG.productTypes, data.productTypes);
            }

            console.log('📂 Configuración de márgenes restaurada');

        } catch (error) {
            console.error('Error cargando configuración persistida:', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.persistData();
        }, MARKUP_CONFIG.storage.backupInterval);
    }

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
                console.error('Error en observer de markup settings:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA INTEGRACIÓN
    // =================================================================

    getMarkupForCategory(categoryKey) {
        return this.currentSettings.get(categoryKey) || null;
    }

    calculateMarkupForPrice(basePrice, categoryKey, additionalParams = {}) {
        const setting = this.currentSettings.get(categoryKey);
        if (!setting || !setting.enabled) {
            return 0;
        }

        const { weight = 1, hours = 1, productType = 'rings', complexity = 'simple' } = additionalParams;

        let markup = 0;
        
        switch (setting.type) {
            case 'percentage':
                markup = basePrice * (setting.value / 100);
                break;
            case 'fixed':
                markup = setting.value;
                break;
            case 'multiplier':
                markup = basePrice * (setting.value - 1);
                break;
            case 'perGram':
                markup = setting.value * weight;
                break;
            case 'perHour':
                markup = setting.value * hours;
                break;
        }

        // Aplicar multiplicadores específicos
        if (categoryKey === 'labor') {
            const productTypeConfig = MARKUP_CONFIG.productTypes[productType];
            if (productTypeConfig) {
                markup *= productTypeConfig.laborMultiplier;
                markup *= productTypeConfig.complexityFactors[complexity] || 1.0;
            }
        }

        return markup;
    }

    getTotalFinalPrice(basePrice, additionalParams = {}) {
        const calculation = this.calculateFinalPrice(
            basePrice,
            additionalParams.hours || 0,
            additionalParams.weight || 1,
            additionalParams.productType || 'rings',
            additionalParams.complexity || 'simple'
        );
        
        return calculation.finalPrice;
    }

    getCurrentSettings() {
        return {
            settings: Object.fromEntries(this.currentSettings),
            productTypes: MARKUP_CONFIG.productTypes,
            currentConfiguration: this.currentConfiguration,
            isInitialized: this.isInitialized
        };
    }

    destroy() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        this.observers = [];
        console.log('🔄 Sistema de configuración de márgenes destruido');
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.globalMarkupSettings = new GlobalMarkupSettings();

// Integrar con sistema de manual pricing override
if (window.manualPricingOverride) {
    window.manualPricingOverride.addObserver((event, data) => {
        if (event === 'override_value_changed') {
            // Actualizar preview cuando cambien los overrides manuales
            if (window.globalMarkupSettings.isInitialized) {
                window.globalMarkupSettings.updateCalculationPreview();
            }
        }
    });
}

// Integrar con calculadora principal
if (window.kitcoPricing) {
    window.kitcoPricing.getMarkupSettings = function() {
        return window.globalMarkupSettings.getCurrentSettings();
    };
    
    window.kitcoPricing.calculateWithMarkup = function(basePrice, additionalParams = {}) {
        return window.globalMarkupSettings.getTotalFinalPrice(basePrice, additionalParams);
    };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalMarkupSettings;
}

console.log('✅ Sistema de Configuración Global de Márgenes v1.0 cargado correctamente');
console.log('📊 Configurar: window.globalMarkupSettings.setupUI()');
console.log('🧮 Calcular precio: window.globalMarkupSettings.getTotalFinalPrice(basePrice, params)');
console.log('⚙️ Ver configuración: window.globalMarkupSettings.getCurrentSettings()');