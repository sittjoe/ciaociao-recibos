// manual-pricing-override.js - SISTEMA DE SOBREPRECIOS MANUALES v1.0
// Interfaz completa para override de precios por gramo con ajustes porcentuales y fijos
// =================================================================

console.log('🎛️ Iniciando Sistema de Sobreprecios Manuales v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE OVERRIDE
// =================================================================

const MANUAL_PRICING_CONFIG = {
    // Metales soportados con pureza
    metals: {
        gold: {
            name: 'Oro',
            symbol: 'XAU',
            purities: {
                '10k': { name: '10 Kilates', purity: 0.417, multiplier: 0.417 },
                '14k': { name: '14 Kilates', purity: 0.585, multiplier: 0.585 },
                '18k': { name: '18 Kilates', purity: 0.750, multiplier: 0.750 },
                '22k': { name: '22 Kilates', purity: 0.917, multiplier: 0.917 },
                '24k': { name: '24 Kilates', purity: 1.000, multiplier: 1.000 }
            },
            unit: 'gramo',
            color: '#D4AF37',
            defaultPrice: 2400 // USD por onza
        },
        silver: {
            name: 'Plata',
            symbol: 'XAG',
            purities: {
                '925': { name: 'Plata 925 (Sterling)', purity: 0.925, multiplier: 0.925 },
                '950': { name: 'Plata 950', purity: 0.950, multiplier: 0.950 },
                '999': { name: 'Plata 999 (Fina)', purity: 0.999, multiplier: 0.999 }
            },
            unit: 'gramo',
            color: '#C0C0C0',
            defaultPrice: 24 // USD por onza
        },
        platinum: {
            name: 'Platino',
            symbol: 'XPT',
            purities: {
                '900': { name: 'Platino 900', purity: 0.900, multiplier: 0.900 },
                '950': { name: 'Platino 950', purity: 0.950, multiplier: 0.950 },
                '999': { name: 'Platino 999', purity: 0.999, multiplier: 0.999 }
            },
            unit: 'gramo',
            color: '#E5E4E2',
            defaultPrice: 950 // USD por onza
        },
        palladium: {
            name: 'Paladio',
            symbol: 'XPD',
            purities: {
                '950': { name: 'Paladio 950', purity: 0.950, multiplier: 0.950 },
                '999': { name: 'Paladio 999', purity: 0.999, multiplier: 0.999 }
            },
            unit: 'gramo',
            color: '#CED0DD',
            defaultPrice: 1300 // USD por onza
        }
    },

    // Tipos de ajuste disponibles
    adjustmentTypes: {
        percentage: {
            name: 'Porcentaje',
            symbol: '%',
            min: -90,
            max: 500,
            step: 0.1,
            default: 0
        },
        fixed: {
            name: 'Cantidad Fija',
            symbol: 'MXN',
            min: -50000,
            max: 50000,
            step: 1,
            default: 0
        },
        absolute: {
            name: 'Precio Absoluto',
            symbol: 'MXN/g',
            min: 0,
            max: 50000,
            step: 0.01,
            default: null
        }
    },

    // Configuración de UI
    ui: {
        updateDelay: 500, // ms para debounce
        animationDuration: 300,
        currencyFormat: 'es-MX',
        decimalPlaces: 2
    },

    // Configuración de persistencia
    storage: {
        prefix: 'ciaociao_manual_pricing_',
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 días
        backupInterval: 5 * 60 * 1000, // 5 minutos
        maxProfiles: 20
    }
};

// =================================================================
// CLASE PRINCIPAL DE SISTEMA DE OVERRIDE
// =================================================================

class ManualPricingOverride {
    constructor() {
        this.currentOverrides = new Map();
        this.savedProfiles = new Map();
        this.currentProfile = null;
        this.isInitialized = false;
        this.updateTimer = null;
        this.observers = [];
        
        // Variables para cálculos
        this.basePrices = new Map();
        this.exchangeRate = 18.50; // MXN/USD por defecto
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de override manual...');
        
        try {
            // Cargar datos persistidos
            this.loadPersistedData();
            
            // Cargar precios base actuales
            await this.loadBasePrices();
            
            // Configurar interfaz
            this.setupUI();
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('✅ Sistema de override manual inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando override manual:', error);
            throw error;
        }
    }

    // =================================================================
    // CARGA Y GESTIÓN DE PRECIOS BASE
    // =================================================================

    async loadBasePrices() {
        try {
            // Intentar cargar precios desde APIs existentes
            if (window.kitcoPricing) {
                const prices = await window.kitcoPricing.fetchLatestPrices();
                if (prices && prices.rates) {
                    Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
                        const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
                        if (prices.rates[metal.symbol]) {
                            // Convertir de USD/oz a USD/g
                            const pricePerGram = prices.rates[metal.symbol] / 31.1035;
                            this.basePrices.set(metalKey, pricePerGram);
                        }
                    });
                }
            }
            
            // Cargar tipo de cambio
            if (window.exchangeRateManager) {
                this.exchangeRate = await window.exchangeRateManager.getRate('USD', 'MXN');
            }
            
            // Si no hay precios de APIs, usar precios por defecto
            this.ensureDefaultPrices();
            
            console.log('💰 Precios base cargados:', Object.fromEntries(this.basePrices));
            
        } catch (error) {
            console.warn('⚠️ Error cargando precios base, usando defaults:', error);
            this.ensureDefaultPrices();
        }
    }

    ensureDefaultPrices() {
        Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
            if (!this.basePrices.has(metalKey)) {
                const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
                // Convertir precio por defecto de USD/oz a USD/g
                const pricePerGram = metal.defaultPrice / 31.1035;
                this.basePrices.set(metalKey, pricePerGram);
            }
        });
    }

    // =================================================================
    // CONFIGURACIÓN DE INTERFAZ DE USUARIO
    // =================================================================

    setupUI() {
        this.createMainInterface();
        this.setupEventListeners();
        this.renderMetalSections();
        this.renderProfileControls();
    }

    createMainInterface() {
        // Verificar si ya existe container
        let container = document.getElementById('manualPricingContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'manualPricingContainer';
            container.className = 'manual-pricing-container';
            
            // Buscar lugar apropiado para insertar
            const targetElement = document.querySelector('.calculator-container') || 
                                 document.querySelector('.container') || 
                                 document.body;
            targetElement.appendChild(container);
        }

        container.innerHTML = `
            <div class="pricing-override-header">
                <h2>🎛️ Sistema de Sobreprecios Manuales</h2>
                <p>Configure precios personalizados por gramo para todos los metales</p>
                
                <div class="pricing-controls">
                    <div class="base-info">
                        <span>💱 Tipo de cambio: <strong>$${this.exchangeRate.toFixed(2)} MXN/USD</strong></span>
                        <button id="refreshBasePrices" class="btn-refresh">🔄 Actualizar Precios</button>
                    </div>
                    
                    <div class="profile-controls">
                        <select id="profileSelector">
                            <option value="">-- Nuevo Perfil --</option>
                        </select>
                        <input type="text" id="profileName" placeholder="Nombre del perfil" maxlength="50">
                        <button id="saveProfile" class="btn-save">💾 Guardar</button>
                        <button id="deleteProfile" class="btn-delete">🗑️ Eliminar</button>
                    </div>
                    
                    <div class="global-controls">
                        <button id="resetAllOverrides" class="btn-reset">🔄 Resetear Todo</button>
                        <button id="applyToAll" class="btn-apply">📋 Aplicar a Todos</button>
                        <button id="exportOverrides" class="btn-export">📤 Exportar</button>
                        <input type="file" id="importOverrides" accept=".json" style="display: none;">
                        <button id="importButton" class="btn-import">📥 Importar</button>
                    </div>
                </div>
            </div>
            
            <div class="metals-grid" id="metalsGrid">
                <!-- Se llenarán dinámicamente -->
            </div>
            
            <div class="pricing-summary">
                <h3>📊 Resumen de Precios Actuales</h3>
                <div class="summary-grid" id="summaryGrid">
                    <!-- Se llenará dinámicamente -->
                </div>
                
                <div class="quick-actions">
                    <h4>⚡ Acciones Rápidas</h4>
                    <button id="bulkIncrease" class="btn-quick">📈 +10% Todos</button>
                    <button id="bulkDecrease" class="btn-quick">📉 -10% Todos</button>
                    <button id="roundPrices" class="btn-quick">🔢 Redondear</button>
                    <button id="competitiveAdjust" class="btn-quick">🎯 Ajuste Competitivo</button>
                </div>
            </div>
        `;
    }

    renderMetalSections() {
        const metalsGrid = document.getElementById('metalsGrid');
        if (!metalsGrid) return;

        metalsGrid.innerHTML = '';

        Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
            const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
            const basePrice = this.basePrices.get(metalKey) || 0;
            const basePriceMXN = basePrice * this.exchangeRate;

            const metalSection = document.createElement('div');
            metalSection.className = 'metal-override-section';
            metalSection.setAttribute('data-metal', metalKey);

            metalSection.innerHTML = `
                <div class="metal-header" style="border-left: 4px solid ${metal.color}">
                    <h3>${metal.name} (${metal.symbol})</h3>
                    <div class="base-price-info">
                        <span class="base-price">Base: $${basePriceMXN.toFixed(2)} MXN/g</span>
                        <span class="status-indicator" id="status_${metalKey}">🟢 API</span>
                    </div>
                </div>

                <div class="purities-container">
                    ${Object.keys(metal.purities).map(purity => this.renderPurityControl(metalKey, purity, metal.purities[purity])).join('')}
                </div>

                <div class="metal-summary">
                    <h4>Precios Finales:</h4>
                    <div class="final-prices" id="finalPrices_${metalKey}">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            `;

            metalsGrid.appendChild(metalSection);
        });

        // Renderizar precios iniciales
        this.updateAllPrices();
    }

    renderPurityControl(metalKey, purity, purityData) {
        const overrideKey = `${metalKey}_${purity}`;
        const currentOverride = this.currentOverrides.get(overrideKey) || {
            type: 'percentage',
            value: 0,
            enabled: false
        };

        return `
            <div class="purity-control" data-override-key="${overrideKey}">
                <div class="purity-header">
                    <label class="purity-label">
                        <input type="checkbox" class="override-enabled" ${currentOverride.enabled ? 'checked' : ''}>
                        <span class="purity-name">${purityData.name}</span>
                        <span class="purity-info">(${(purityData.purity * 100).toFixed(1)}%)</span>
                    </label>
                </div>

                <div class="adjustment-controls ${currentOverride.enabled ? 'enabled' : 'disabled'}">
                    <div class="adjustment-type">
                        <select class="adjustment-type-select">
                            <option value="percentage" ${currentOverride.type === 'percentage' ? 'selected' : ''}>
                                % Porcentaje
                            </option>
                            <option value="fixed" ${currentOverride.type === 'fixed' ? 'selected' : ''}>
                                MXN Cantidad Fija
                            </option>
                            <option value="absolute" ${currentOverride.type === 'absolute' ? 'selected' : ''}>
                                MXN/g Precio Absoluto
                            </option>
                        </select>
                    </div>

                    <div class="adjustment-input">
                        <input type="number" 
                               class="adjustment-value" 
                               value="${currentOverride.value}"
                               step="0.01"
                               min="${this.getMinValue(currentOverride.type)}"
                               max="${this.getMaxValue(currentOverride.type)}"
                               placeholder="0.00">
                        <span class="adjustment-unit">${this.getUnitSymbol(currentOverride.type)}</span>
                    </div>

                    <div class="price-preview">
                        <span class="preview-label">Precio final:</span>
                        <span class="preview-price" id="preview_${overrideKey}">$0.00 MXN/g</span>
                        <span class="preview-change" id="change_${overrideKey}">±0%</span>
                    </div>
                </div>

                <div class="quick-adjustments">
                    <button class="btn-quick-adj" data-adjustment="-50">-50%</button>
                    <button class="btn-quick-adj" data-adjustment="-25">-25%</button>
                    <button class="btn-quick-adj" data-adjustment="-10">-10%</button>
                    <button class="btn-quick-adj" data-adjustment="0">Reset</button>
                    <button class="btn-quick-adj" data-adjustment="10">+10%</button>
                    <button class="btn-quick-adj" data-adjustment="25">+25%</button>
                    <button class="btn-quick-adj" data-adjustment="50">+50%</button>
                </div>
            </div>
        `;
    }

    // =================================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // =================================================================

    setupEventListeners() {
        // Event delegation para controles dinámicos
        document.addEventListener('change', (e) => {
            if (e.target.matches('.override-enabled')) {
                this.handleOverrideToggle(e.target);
            } else if (e.target.matches('.adjustment-type-select')) {
                this.handleAdjustmentTypeChange(e.target);
            } else if (e.target.matches('.adjustment-value')) {
                this.handleAdjustmentValueChange(e.target);
            } else if (e.target.matches('#profileSelector')) {
                this.handleProfileSelection(e.target.value);
            }
        });

        // Event delegation para botones
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-quick-adj')) {
                this.handleQuickAdjustment(e.target);
            } else if (e.target.matches('#refreshBasePrices')) {
                this.refreshBasePrices();
            } else if (e.target.matches('#saveProfile')) {
                this.saveCurrentProfile();
            } else if (e.target.matches('#deleteProfile')) {
                this.deleteCurrentProfile();
            } else if (e.target.matches('#resetAllOverrides')) {
                this.resetAllOverrides();
            } else if (e.target.matches('#applyToAll')) {
                this.showApplyToAllModal();
            } else if (e.target.matches('#exportOverrides')) {
                this.exportOverrides();
            } else if (e.target.matches('#importButton')) {
                document.getElementById('importOverrides').click();
            } else if (e.target.matches('#bulkIncrease')) {
                this.bulkAdjustment(10);
            } else if (e.target.matches('#bulkDecrease')) {
                this.bulkAdjustment(-10);
            } else if (e.target.matches('#roundPrices')) {
                this.roundAllPrices();
            } else if (e.target.matches('#competitiveAdjust')) {
                this.showCompetitiveAdjustModal();
            }
        });

        // Import file handler
        document.addEventListener('change', (e) => {
            if (e.target.matches('#importOverrides')) {
                this.importOverrides(e.target);
            }
        });

        // Input debouncing
        document.addEventListener('input', (e) => {
            if (e.target.matches('.adjustment-value')) {
                clearTimeout(this.updateTimer);
                this.updateTimer = setTimeout(() => {
                    this.handleAdjustmentValueChange(e.target);
                }, MANUAL_PRICING_CONFIG.ui.updateDelay);
            }
        });
    }

    // =================================================================
    // HANDLERS DE EVENTOS
    // =================================================================

    handleOverrideToggle(checkbox) {
        const purityControl = checkbox.closest('.purity-control');
        const overrideKey = purityControl.getAttribute('data-override-key');
        const adjustmentControls = purityControl.querySelector('.adjustment-controls');
        
        const override = this.currentOverrides.get(overrideKey) || {
            type: 'percentage',
            value: 0,
            enabled: false
        };
        
        override.enabled = checkbox.checked;
        this.currentOverrides.set(overrideKey, override);
        
        // Toggle UI state
        adjustmentControls.classList.toggle('enabled', checkbox.checked);
        adjustmentControls.classList.toggle('disabled', !checkbox.checked);
        
        this.updatePricePreview(overrideKey);
        this.updateSummary();
        this.notifyObservers('override_toggled', { overrideKey, enabled: checkbox.checked });
    }

    handleAdjustmentTypeChange(select) {
        const purityControl = select.closest('.purity-control');
        const overrideKey = purityControl.getAttribute('data-override-key');
        
        const override = this.currentOverrides.get(overrideKey) || {
            type: 'percentage',
            value: 0,
            enabled: true
        };
        
        override.type = select.value;
        override.value = 0; // Reset value when changing type
        this.currentOverrides.set(overrideKey, override);
        
        // Update input constraints
        const valueInput = purityControl.querySelector('.adjustment-value');
        const unitSpan = purityControl.querySelector('.adjustment-unit');
        
        valueInput.value = 0;
        valueInput.min = this.getMinValue(override.type);
        valueInput.max = this.getMaxValue(override.type);
        valueInput.step = this.getStepValue(override.type);
        unitSpan.textContent = this.getUnitSymbol(override.type);
        
        this.updatePricePreview(overrideKey);
        this.updateSummary();
    }

    handleAdjustmentValueChange(input) {
        const purityControl = input.closest('.purity-control');
        const overrideKey = purityControl.getAttribute('data-override-key');
        
        const override = this.currentOverrides.get(overrideKey) || {
            type: 'percentage',
            value: 0,
            enabled: true
        };
        
        override.value = parseFloat(input.value) || 0;
        this.currentOverrides.set(overrideKey, override);
        
        this.updatePricePreview(overrideKey);
        this.updateSummary();
        this.notifyObservers('override_value_changed', { overrideKey, value: override.value });
    }

    handleQuickAdjustment(button) {
        const adjustment = parseFloat(button.getAttribute('data-adjustment'));
        const purityControl = button.closest('.purity-control');
        const overrideKey = purityControl.getAttribute('data-override-key');
        
        const override = this.currentOverrides.get(overrideKey) || {
            type: 'percentage',
            value: 0,
            enabled: false
        };
        
        if (adjustment === 0) {
            // Reset
            override.value = 0;
            override.enabled = false;
            purityControl.querySelector('.override-enabled').checked = false;
            purityControl.querySelector('.adjustment-controls').classList.remove('enabled');
            purityControl.querySelector('.adjustment-controls').classList.add('disabled');
        } else {
            // Apply percentage adjustment
            override.type = 'percentage';
            override.value = adjustment;
            override.enabled = true;
            purityControl.querySelector('.override-enabled').checked = true;
            purityControl.querySelector('.adjustment-controls').classList.add('enabled');
            purityControl.querySelector('.adjustment-controls').classList.remove('disabled');
            purityControl.querySelector('.adjustment-type-select').value = 'percentage';
        }
        
        // Update UI
        purityControl.querySelector('.adjustment-value').value = override.value;
        this.currentOverrides.set(overrideKey, override);
        
        this.updatePricePreview(overrideKey);
        this.updateSummary();
    }

    // =================================================================
    // CÁLCULOS DE PRECIOS
    // =================================================================

    calculateFinalPrice(metalKey, purity) {
        const overrideKey = `${metalKey}_${purity}`;
        const override = this.currentOverrides.get(overrideKey);
        
        if (!override || !override.enabled) {
            // Sin override, usar precio base
            return this.getBasePriceForPurity(metalKey, purity);
        }
        
        const basePrice = this.getBasePriceForPurity(metalKey, purity);
        
        switch (override.type) {
            case 'percentage':
                return basePrice * (1 + override.value / 100);
                
            case 'fixed':
                return basePrice + override.value;
                
            case 'absolute':
                return override.value;
                
            default:
                return basePrice;
        }
    }

    getBasePriceForPurity(metalKey, purity) {
        const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
        const purityData = metal.purities[purity];
        const basePrice = this.basePrices.get(metalKey) || 0;
        
        // Convertir a MXN y aplicar multiplicador de pureza
        return basePrice * this.exchangeRate * purityData.multiplier;
    }

    updatePricePreview(overrideKey) {
        const [metalKey, purity] = overrideKey.split('_');
        const finalPrice = this.calculateFinalPrice(metalKey, purity);
        const basePrice = this.getBasePriceForPurity(metalKey, purity);
        
        const previewElement = document.getElementById(`preview_${overrideKey}`);
        const changeElement = document.getElementById(`change_${overrideKey}`);
        
        if (previewElement) {
            previewElement.textContent = `$${finalPrice.toFixed(2)} MXN/g`;
        }
        
        if (changeElement) {
            const changePercent = ((finalPrice - basePrice) / basePrice) * 100;
            const sign = changePercent >= 0 ? '+' : '';
            changeElement.textContent = `${sign}${changePercent.toFixed(1)}%`;
            changeElement.className = `preview-change ${changePercent >= 0 ? 'positive' : 'negative'}`;
        }
    }

    updateAllPrices() {
        this.currentOverrides.forEach((override, overrideKey) => {
            this.updatePricePreview(overrideKey);
        });
        
        // También actualizar previews de metales sin overrides
        Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
            const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
            Object.keys(metal.purities).forEach(purity => {
                const overrideKey = `${metalKey}_${purity}`;
                if (!this.currentOverrides.has(overrideKey)) {
                    this.updatePricePreview(overrideKey);
                }
            });
        });
        
        this.updateSummary();
    }

    updateSummary() {
        const summaryGrid = document.getElementById('summaryGrid');
        if (!summaryGrid) return;

        summaryGrid.innerHTML = '';

        Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
            const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
            
            const metalSummary = document.createElement('div');
            metalSummary.className = 'metal-summary-card';
            metalSummary.innerHTML = `
                <h4 style="color: ${metal.color}">${metal.name}</h4>
                <div class="summary-prices">
                    ${Object.keys(metal.purities).map(purity => {
                        const finalPrice = this.calculateFinalPrice(metalKey, purity);
                        const overrideKey = `${metalKey}_${purity}`;
                        const hasOverride = this.currentOverrides.has(overrideKey) && 
                                          this.currentOverrides.get(overrideKey).enabled;
                        
                        return `
                            <div class="summary-price-row ${hasOverride ? 'overridden' : ''}">
                                <span>${purity.toUpperCase()}</span>
                                <span>$${finalPrice.toFixed(2)}</span>
                                ${hasOverride ? '<span class="override-indicator">🎛️</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            summaryGrid.appendChild(metalSummary);
        });
    }

    // =================================================================
    // GESTIÓN DE PERFILES
    // =================================================================

    renderProfileControls() {
        const profileSelector = document.getElementById('profileSelector');
        if (!profileSelector) return;

        // Limpiar opciones existentes excepto la primera
        profileSelector.innerHTML = '<option value="">-- Nuevo Perfil --</option>';

        // Agregar perfiles guardados
        this.savedProfiles.forEach((profile, profileName) => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            profileSelector.appendChild(option);
        });
    }

    handleProfileSelection(profileName) {
        if (!profileName) {
            this.currentProfile = null;
            document.getElementById('profileName').value = '';
            return;
        }

        const profile = this.savedProfiles.get(profileName);
        if (profile) {
            this.loadProfile(profile);
            this.currentProfile = profileName;
            document.getElementById('profileName').value = profileName;
        }
    }

    saveCurrentProfile() {
        const profileNameInput = document.getElementById('profileName');
        const profileName = profileNameInput.value.trim();

        if (!profileName) {
            alert('Por favor ingrese un nombre para el perfil');
            return;
        }

        const profile = {
            name: profileName,
            overrides: Object.fromEntries(this.currentOverrides),
            created: Date.now(),
            modified: Date.now()
        };

        this.savedProfiles.set(profileName, profile);
        this.currentProfile = profileName;
        
        this.renderProfileControls();
        document.getElementById('profileSelector').value = profileName;
        
        this.persistData();
        this.notifyObservers('profile_saved', { profileName, profile });
        
        console.log(`💾 Perfil guardado: ${profileName}`);
    }

    deleteCurrentProfile() {
        const profileName = this.currentProfile;
        if (!profileName) {
            alert('No hay perfil seleccionado para eliminar');
            return;
        }

        if (confirm(`¿Está seguro de eliminar el perfil "${profileName}"?`)) {
            this.savedProfiles.delete(profileName);
            this.currentProfile = null;
            
            document.getElementById('profileSelector').value = '';
            document.getElementById('profileName').value = '';
            
            this.renderProfileControls();
            this.persistData();
            this.notifyObservers('profile_deleted', { profileName });
            
            console.log(`🗑️ Perfil eliminado: ${profileName}`);
        }
    }

    loadProfile(profile) {
        // Limpiar overrides actuales
        this.currentOverrides.clear();
        
        // Cargar overrides del perfil
        Object.entries(profile.overrides).forEach(([key, value]) => {
            this.currentOverrides.set(key, value);
        });
        
        // Actualizar UI
        this.setupUI();
        console.log(`📂 Perfil cargado: ${profile.name}`);
    }

    // =================================================================
    // FUNCIONES DE UTILIDAD
    // =================================================================

    getMinValue(type) {
        return MANUAL_PRICING_CONFIG.adjustmentTypes[type]?.min || 0;
    }

    getMaxValue(type) {
        return MANUAL_PRICING_CONFIG.adjustmentTypes[type]?.max || 1000;
    }

    getStepValue(type) {
        return MANUAL_PRICING_CONFIG.adjustmentTypes[type]?.step || 0.01;
    }

    getUnitSymbol(type) {
        return MANUAL_PRICING_CONFIG.adjustmentTypes[type]?.symbol || '';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat(MANUAL_PRICING_CONFIG.ui.currencyFormat, {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: MANUAL_PRICING_CONFIG.ui.decimalPlaces
        }).format(amount);
    }

    // =================================================================
    // ACCIONES MASIVAS
    // =================================================================

    resetAllOverrides() {
        if (confirm('¿Está seguro de resetear todos los overrides?')) {
            this.currentOverrides.clear();
            this.setupUI();
            this.notifyObservers('all_overrides_reset', {});
            console.log('🔄 Todos los overrides reseteados');
        }
    }

    bulkAdjustment(percentageChange) {
        let count = 0;
        
        this.currentOverrides.forEach((override, key) => {
            if (override.enabled && override.type === 'percentage') {
                override.value += percentageChange;
                count++;
            }
        });
        
        if (count === 0) {
            // Aplicar a todos los metales
            Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
                const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
                Object.keys(metal.purities).forEach(purity => {
                    const overrideKey = `${metalKey}_${purity}`;
                    this.currentOverrides.set(overrideKey, {
                        type: 'percentage',
                        value: percentageChange,
                        enabled: true
                    });
                });
            });
        }
        
        this.setupUI();
        this.notifyObservers('bulk_adjustment_applied', { percentageChange, count });
        console.log(`📊 Ajuste masivo aplicado: ${percentageChange}% a ${count} elementos`);
    }

    roundAllPrices() {
        this.currentOverrides.forEach((override, key) => {
            if (override.enabled) {
                const [metalKey, purity] = key.split('_');
                const currentPrice = this.calculateFinalPrice(metalKey, purity);
                const roundedPrice = Math.round(currentPrice / 10) * 10; // Redondear a decenas
                
                override.type = 'absolute';
                override.value = roundedPrice;
            }
        });
        
        this.setupUI();
        this.notifyObservers('prices_rounded', {});
        console.log('🔢 Precios redondeados');
    }

    async refreshBasePrices() {
        const button = document.getElementById('refreshBasePrices');
        const originalText = button.textContent;
        
        button.textContent = '🔄 Actualizando...';
        button.disabled = true;
        
        try {
            await this.loadBasePrices();
            this.updateAllPrices();
            this.notifyObservers('base_prices_refreshed', { exchangeRate: this.exchangeRate });
            console.log('💰 Precios base actualizados');
        } catch (error) {
            console.error('❌ Error actualizando precios:', error);
            alert('Error actualizando precios. Se mantendrán los precios actuales.');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // =================================================================
    // EXPORTACIÓN E IMPORTACIÓN
    // =================================================================

    exportOverrides() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            exchangeRate: this.exchangeRate,
            basePrices: Object.fromEntries(this.basePrices),
            currentOverrides: Object.fromEntries(this.currentOverrides),
            savedProfiles: Object.fromEntries(this.savedProfiles)
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manual_pricing_overrides_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Overrides exportados');
    }

    importOverrides(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.version !== '1.0') {
                    throw new Error('Versión de archivo no compatible');
                }
                
                // Confirmar importación
                if (confirm('¿Importar configuración? Esto reemplazará los overrides actuales.')) {
                    // Cargar datos
                    if (importData.currentOverrides) {
                        this.currentOverrides = new Map(Object.entries(importData.currentOverrides));
                    }
                    
                    if (importData.savedProfiles) {
                        this.savedProfiles = new Map(Object.entries(importData.savedProfiles));
                    }
                    
                    if (importData.exchangeRate) {
                        this.exchangeRate = importData.exchangeRate;
                    }
                    
                    // Actualizar UI
                    this.setupUI();
                    this.persistData();
                    
                    console.log('📥 Overrides importados exitosamente');
                    alert('Configuración importada exitosamente');
                }
                
            } catch (error) {
                console.error('❌ Error importando overrides:', error);
                alert('Error al importar archivo: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        input.value = ''; // Reset input
    }

    // =================================================================
    // PERSISTENCIA DE DATOS
    // =================================================================

    persistData() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                exchangeRate: this.exchangeRate,
                basePrices: Object.fromEntries(this.basePrices),
                currentOverrides: Object.fromEntries(this.currentOverrides),
                savedProfiles: Object.fromEntries(this.savedProfiles),
                currentProfile: this.currentProfile
            };

            localStorage.setItem(
                MANUAL_PRICING_CONFIG.storage.prefix + 'data',
                JSON.stringify(data)
            );

        } catch (error) {
            console.error('Error persistiendo datos de override:', error);
        }
    }

    loadPersistedData() {
        try {
            const stored = localStorage.getItem(MANUAL_PRICING_CONFIG.storage.prefix + 'data');
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Verificar TTL
            const age = Date.now() - data.timestamp;
            if (age > MANUAL_PRICING_CONFIG.storage.ttl) {
                console.log('🗂️ Datos de override expirados, iniciando fresh');
                return;
            }

            // Restaurar datos
            if (data.exchangeRate) {
                this.exchangeRate = data.exchangeRate;
            }
            
            if (data.basePrices) {
                this.basePrices = new Map(Object.entries(data.basePrices));
            }
            
            if (data.currentOverrides) {
                this.currentOverrides = new Map(Object.entries(data.currentOverrides));
            }
            
            if (data.savedProfiles) {
                this.savedProfiles = new Map(Object.entries(data.savedProfiles));
            }
            
            if (data.currentProfile) {
                this.currentProfile = data.currentProfile;
            }

            console.log('📂 Datos de override restaurados desde persistencia');

        } catch (error) {
            console.error('Error cargando datos persistidos:', error);
        }
    }

    setupAutoSave() {
        // Auto-guardado cada intervalo configurado
        setInterval(() => {
            this.persistData();
        }, MANUAL_PRICING_CONFIG.storage.backupInterval);
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
                console.error('Error en observer de manual pricing:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA INTEGRACIÓN
    // =================================================================

    getOverriddenPrice(metalKey, purity, weight = 1) {
        const pricePerGram = this.calculateFinalPrice(metalKey, purity);
        return pricePerGram * weight;
    }

    getAllCurrentPrices() {
        const prices = {};
        
        Object.keys(MANUAL_PRICING_CONFIG.metals).forEach(metalKey => {
            const metal = MANUAL_PRICING_CONFIG.metals[metalKey];
            prices[metalKey] = {};
            
            Object.keys(metal.purities).forEach(purity => {
                prices[metalKey][purity] = {
                    pricePerGram: this.calculateFinalPrice(metalKey, purity),
                    hasOverride: this.currentOverrides.has(`${metalKey}_${purity}`) && 
                                this.currentOverrides.get(`${metalKey}_${purity}`).enabled,
                    metal: metal.name,
                    purity: metal.purities[purity].name
                };
            });
        });
        
        return prices;
    }

    getOverrideStatus() {
        return {
            isInitialized: this.isInitialized,
            totalOverrides: this.currentOverrides.size,
            activeOverrides: Array.from(this.currentOverrides.values()).filter(o => o.enabled).length,
            currentProfile: this.currentProfile,
            savedProfiles: this.savedProfiles.size,
            exchangeRate: this.exchangeRate,
            lastUpdate: Date.now()
        };
    }

    destroy() {
        // Limpiar timers y observers
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        this.observers = [];
        console.log('🔄 Sistema de override manual destruido');
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.manualPricingOverride = new ManualPricingOverride();

// Integrar con sistema principal de calculadora
if (window.kitcoPricing) {
    // Sobrescribir método de obtención de precios
    window.kitcoPricing.getOverriddenMetalPrice = function(metal, karats, weight = 1) {
        return window.manualPricingOverride.getOverriddenPrice(metal, karats, weight);
    };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ManualPricingOverride;
}

console.log('✅ Sistema de Sobreprecios Manuales v1.0 cargado correctamente');
console.log('🎛️ Configurar precios: window.manualPricingOverride.setupUI()');
console.log('📊 Ver estado: window.manualPricingOverride.getOverrideStatus()');
console.log('💰 Obtener precios: window.manualPricingOverride.getAllCurrentPrices()');