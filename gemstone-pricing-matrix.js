// gemstone-pricing-matrix.js - MATRIZ DE PRECIOS MANUAL DE PIEDRAS PRECIOSAS v1.0
// Sistema completo de precios por grado de calidad, tamaño y origen geográfico
// =================================================================

console.log('💎 Iniciando Sistema de Matriz de Precios de Piedras Preciosas v1.0...');

// =================================================================
// CONFIGURACIÓN DE LA MATRIZ DE PIEDRAS PRECIOSAS
// =================================================================

const GEMSTONE_CONFIG = {
    // Principales piedras preciosas
    gemstones: {
        diamond: {
            name: 'Diamante',
            symbol: '💎',
            color: '#B9F2FF',
            classification: 'precious',
            hardness: 10,
            unit: 'carat',
            basePrice: 5000, // USD por quilate base
            priceFactors: {
                cut: { excellent: 1.2, very_good: 1.0, good: 0.85, fair: 0.7, poor: 0.5 },
                color: { d: 1.3, e: 1.25, f: 1.2, g: 1.15, h: 1.1, i: 1.0, j: 0.95, k: 0.9, l: 0.8, m: 0.7 },
                clarity: { fl: 1.4, if: 1.35, vvs1: 1.3, vvs2: 1.25, vs1: 1.2, vs2: 1.1, si1: 1.0, si2: 0.9, i1: 0.7, i2: 0.5, i3: 0.3 },
                certification: { gia: 1.0, ags: 0.95, ssef: 0.9, none: 0.7 }
            }
        },
        ruby: {
            name: 'Rubí',
            symbol: '❤️',
            color: '#DC143C',
            classification: 'precious',
            hardness: 9,
            unit: 'carat',
            basePrice: 1500,
            priceFactors: {
                color: { pigeon_blood: 2.0, vivid_red: 1.8, strong_red: 1.5, medium_red: 1.2, light_red: 0.8, pink_red: 0.6 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6, heavily_included: 0.4 },
                origin: { burma: 2.5, madagascar: 1.8, mozambique: 1.5, thailand: 1.2, sri_lanka: 1.0, synthetic: 0.1 },
                treatment: { none: 1.0, heated: 0.7, fracture_filled: 0.4, synthetic: 0.1 }
            }
        },
        emerald: {
            name: 'Esmeralda',
            symbol: '💚',
            color: '#50C878',
            classification: 'precious',
            hardness: 7.5,
            unit: 'carat',
            basePrice: 2000,
            priceFactors: {
                color: { vivid_green: 2.0, strong_green: 1.7, medium_green: 1.3, light_green: 0.9, pale_green: 0.5 },
                clarity: { eye_clean: 1.0, lightly_included: 0.9, moderately_included: 0.7, heavily_included: 0.5 },
                origin: { colombia: 2.2, zambia: 1.6, brazil: 1.3, afghanistan: 1.1, russia: 0.9, synthetic: 0.1 },
                treatment: { none: 1.0, minor_oil: 0.8, moderate_oil: 0.6, significant_oil: 0.4, fracture_filled: 0.3 }
            }
        },
        sapphire: {
            name: 'Zafiro',
            symbol: '💙',
            color: '#0F52BA',
            classification: 'precious',
            hardness: 9,
            unit: 'carat',
            basePrice: 1200,
            priceFactors: {
                color: { 
                    cornflower_blue: 2.0, royal_blue: 1.8, vivid_blue: 1.6, medium_blue: 1.2, light_blue: 0.8,
                    padparadscha: 2.5, pink: 1.5, yellow: 1.2, white: 0.6, green: 0.8, purple: 1.0
                },
                clarity: { eye_clean: 1.0, slightly_included: 0.9, moderately_included: 0.7, heavily_included: 0.5 },
                origin: { kashmir: 3.0, burma: 2.5, ceylon: 2.0, madagascar: 1.5, thailand: 1.2, australia: 0.9 },
                treatment: { none: 1.0, heated: 0.8, diffusion: 0.4, synthetic: 0.1 }
            }
        },
        tanzanite: {
            name: 'Tanzanita',
            symbol: '💜',
            color: '#4B0082',
            classification: 'semi_precious',
            hardness: 6.5,
            unit: 'carat',
            basePrice: 400,
            priceFactors: {
                color: { exceptional_blue: 1.8, vivid_blue: 1.5, strong_blue: 1.2, medium_blue: 1.0, light_blue: 0.7 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6, heavily_included: 0.4 },
                size: { under_1ct: 0.8, '1_3ct': 1.0, '3_5ct': 1.3, '5_10ct': 1.8, over_10ct: 2.5 },
                treatment: { heated: 1.0, unheated: 1.5 }
            }
        },
        amethyst: {
            name: 'Amatista',
            symbol: '🟣',
            color: '#9966CC',
            classification: 'semi_precious',
            hardness: 7,
            unit: 'carat',
            basePrice: 15,
            priceFactors: {
                color: { deep_purple: 1.5, medium_purple: 1.0, light_purple: 0.7, pale_purple: 0.4 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6 },
                origin: { uruguay: 1.5, brazil: 1.0, zambia: 1.2, russia: 0.8 },
                size: { under_5ct: 1.0, '5_20ct': 1.2, over_20ct: 1.5 }
            }
        },
        aquamarine: {
            name: 'Aguamarina',
            symbol: '🌊',
            color: '#7FFFD4',
            classification: 'semi_precious',
            hardness: 7.5,
            unit: 'carat',
            basePrice: 60,
            priceFactors: {
                color: { deep_blue: 1.8, medium_blue: 1.3, light_blue: 1.0, very_light: 0.6 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6 },
                origin: { brazil: 1.0, madagascar: 1.2, pakistan: 1.1, nigeria: 0.9 },
                size: { under_3ct: 0.9, '3_10ct': 1.0, '10_20ct': 1.3, over_20ct: 1.8 }
            }
        },
        tourmaline: {
            name: 'Turmalina',
            symbol: '🌈',
            color: '#40E0D0',
            classification: 'semi_precious',
            hardness: 7,
            unit: 'carat',
            basePrice: 80,
            priceFactors: {
                color: { 
                    paraiba: 15.0, chrome: 3.0, watermelon: 2.0, pink: 1.5, green: 1.2, 
                    blue: 1.3, yellow: 0.8, colorless: 0.5, black: 0.3
                },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6 },
                origin: { brazil: 1.5, afghanistan: 1.2, madagascar: 1.0, usa: 1.1, africa: 0.9 },
                treatment: { none: 1.0, heated: 0.8, irradiated: 0.6 }
            }
        },
        garnet: {
            name: 'Granate',
            symbol: '🍎',
            color: '#8B0000',
            classification: 'semi_precious',
            hardness: 6.5,
            unit: 'carat',
            basePrice: 25,
            priceFactors: {
                variety: { 
                    demantoid: 8.0, tsavorite: 5.0, spessartine: 2.0, rhodolite: 1.5, 
                    pyrope: 1.0, almandine: 0.8, grossular: 1.2
                },
                color: { vivid: 1.5, strong: 1.2, medium: 1.0, light: 0.7, pale: 0.4 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6 },
                origin: { russia: 1.5, tanzania: 1.3, madagascar: 1.0, sri_lanka: 1.1, india: 0.9 }
            }
        },
        peridot: {
            name: 'Peridoto',
            symbol: '🍃',
            color: '#9ACD32',
            classification: 'semi_precious',
            hardness: 6.5,
            unit: 'carat',
            basePrice: 30,
            priceFactors: {
                color: { vivid_green: 1.5, strong_green: 1.2, medium_green: 1.0, light_green: 0.7 },
                clarity: { eye_clean: 1.0, slightly_included: 0.8, moderately_included: 0.6 },
                origin: { burma: 1.5, pakistan: 1.3, arizona: 1.0, china: 0.8 },
                size: { under_3ct: 1.0, '3_8ct': 1.2, '8_15ct: 1.5, over_15ct: 2.0 }
            }
        }
    },

    // Categorías de tamaño estándar
    sizeCategories: {
        melee: {
            name: 'Melee',
            range: '0.005 - 0.18 ct',
            multiplier: 0.3,
            description: 'Diamantes muy pequeños para pavé'
        },
        small: {
            name: 'Pequeño',
            range: '0.18 - 0.5 ct',
            multiplier: 0.7,
            description: 'Piedras pequeñas para acentos'
        },
        medium: {
            name: 'Mediano',
            range: '0.5 - 2.0 ct',
            multiplier: 1.0,
            description: 'Tamaño estándar para joyería'
        },
        large: {
            name: 'Grande',
            range: '2.0 - 5.0 ct',
            multiplier: 1.5,
            description: 'Piedras grandes para centros'
        },
        extra_large: {
            name: 'Extra Grande',
            range: '5.0+ ct',
            multiplier: 2.5,
            description: 'Piedras excepcionales de colección'
        }
    },

    // Grados de calidad general
    qualityGrades: {
        aaa: {
            name: 'AAA - Excepcional',
            multiplier: 2.0,
            description: 'Calidad excepcional, sin defectos visibles',
            color: '#FFD700'
        },
        aa: {
            name: 'AA - Excelente',
            multiplier: 1.5,
            description: 'Excelente calidad, defectos mínimos',
            color: '#C0C0C0'
        },
        a: {
            name: 'A - Buena',
            multiplier: 1.0,
            description: 'Buena calidad comercial',
            color: '#CD7F32'
        },
        b: {
            name: 'B - Comercial',
            multiplier: 0.7,
            description: 'Calidad comercial estándar',
            color: '#A0A0A0'
        },
        c: {
            name: 'C - Básica',
            multiplier: 0.4,
            description: 'Calidad básica con defectos visibles',
            color: '#696969'
        }
    },

    // Tratamientos comunes
    treatments: {
        none: { name: 'Natural', multiplier: 1.0, description: 'Sin tratamiento' },
        heated: { name: 'Calentado', multiplier: 0.8, description: 'Tratamiento térmico' },
        oiled: { name: 'Aceitado', multiplier: 0.7, description: 'Impregnación con aceite' },
        fracture_filled: { name: 'Relleno de fracturas', multiplier: 0.5, description: 'Fracturas rellenadas' },
        irradiated: { name: 'Irradiado', multiplier: 0.6, description: 'Tratamiento por radiación' },
        diffusion: { name: 'Difusión', multiplier: 0.4, description: 'Difusión de color superficial' },
        synthetic: { name: 'Sintético', multiplier: 0.1, description: 'Piedra sintética' },
        simulant: { name: 'Simulante', multiplier: 0.05, description: 'Imitación' }
    },

    // Certificaciones disponibles
    certifications: {
        gia: { name: 'GIA', premium: 1.0, description: 'Gemological Institute of America' },
        ags: { name: 'AGS', premium: 0.95, description: 'American Gem Society' },
        ssef: { name: 'SSEF', premium: 0.9, description: 'Swiss Gemmological Institute' },
        grs: { name: 'GRS', premium: 0.85, description: 'Gem Research Swisslab' },
        lotus: { name: 'Lotus', premium: 0.8, description: 'Lotus Gemology' },
        local: { name: 'Local', premium: 0.6, description: 'Certificación local' },
        none: { name: 'Sin certificar', premium: 0.7, description: 'Sin certificación' }
    },

    // Configuración de persistencia
    storage: {
        prefix: 'ciaociao_gemstone_pricing_',
        ttl: 14 * 24 * 60 * 60 * 1000, // 14 días
        backupInterval: 2 * 60 * 1000, // 2 minutos
        maxCustomEntries: 100
    }
};

// =================================================================
// CLASE PRINCIPAL DE MATRIZ DE PRECIOS DE PIEDRAS PRECIOSAS
// =================================================================

class GemstonePricingMatrix {
    constructor() {
        this.customPrices = new Map();
        this.priceOverrides = new Map();
        this.priceHistory = new Map();
        this.currentGemstone = null;
        this.isInitialized = false;
        this.observers = [];
        this.calculationMode = 'standard'; // standard, advanced, custom
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando matriz de precios de piedras preciosas...');
        
        try {
            // Cargar datos persistidos
            this.loadPersistedData();
            
            // Configurar interfaz
            this.setupUI();
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('✅ Matriz de precios de piedras preciosas inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando matriz de piedras preciosas:', error);
            throw error;
        }
    }

    // =================================================================
    // CONFIGURACIÓN DE INTERFAZ DE USUARIO
    // =================================================================

    setupUI() {
        this.createMainInterface();
        this.setupEventListeners();
        this.renderGemstoneTabs();
        this.renderPricingCalculator();
    }

    createMainInterface() {
        let container = document.getElementById('gemstonePricingContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'gemstonePricingContainer';
            container.className = 'gemstone-pricing-container';
            
            const targetElement = document.querySelector('.supplier-pricing-container') || 
                                 document.querySelector('.markup-settings-container') || 
                                 document.querySelector('.manual-pricing-container') || 
                                 document.querySelector('.calculator-container') || 
                                 document.querySelector('.container') || 
                                 document.body;
            targetElement.appendChild(container);
        }

        container.innerHTML = `
            <div class="gemstone-header">
                <h2>💎 Matriz de Precios de Piedras Preciosas</h2>
                <p>Sistema completo de valoración por calidad, tamaño, origen y tratamientos</p>
                
                <div class="gemstone-controls">
                    <div class="calculation-mode">
                        <label>Modo de cálculo:</label>
                        <select id="calculationMode">
                            <option value="standard">Estándar</option>
                            <option value="advanced">Avanzado</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    
                    <div class="currency-settings">
                        <label>Moneda base:</label>
                        <select id="baseCurrency">
                            <option value="USD">USD - Dólar Americano</option>
                            <option value="MXN" selected>MXN - Peso Mexicano</option>
                        </select>
                        <input type="number" id="exchangeRate" value="18.50" step="0.01" min="1">
                        <span>MXN/USD</span>
                    </div>
                    
                    <div class="matrix-actions">
                        <button id="exportMatrix" class="btn-export">📤 Exportar Matriz</button>
                        <button id="importMatrix" class="btn-import">📥 Importar</button>
                        <button id="resetToDefaults" class="btn-reset">🔄 Resetear</button>
                        <button id="bulkUpdatePrices" class="btn-update">💰 Actualizar Precios</button>
                    </div>
                </div>
            </div>
            
            <div class="gemstone-layout">
                <div class="gemstone-sidebar">
                    <h3>💎 Tipos de Piedras</h3>
                    <div class="gemstone-nav" id="gemstoneNav">
                        <!-- Se llenará dinámicamente -->
                    </div>
                    
                    <div class="quick-calculator">
                        <h4>🧮 Calculadora Rápida</h4>
                        <div class="quick-calc-form">
                            <select id="quickGemstone">
                                <option value="">Seleccionar piedra...</option>
                            </select>
                            <input type="number" id="quickWeight" placeholder="Peso (ct)" step="0.01" min="0">
                            <select id="quickGrade">
                                <option value="">Grado...</option>
                                ${Object.keys(GEMSTONE_CONFIG.qualityGrades).map(grade => 
                                    `<option value="${grade}">${GEMSTONE_CONFIG.qualityGrades[grade].name}</option>`
                                ).join('')}
                            </select>
                            <button id="quickCalculate" class="btn-calculate">💰 Calcular</button>
                            <div id="quickResult" class="quick-result"></div>
                        </div>
                    </div>
                </div>
                
                <div class="gemstone-main">
                    <div class="gemstone-content" id="gemstoneContent">
                        <div class="no-gemstone-selected">
                            <h3>👈 Seleccione una piedra preciosa</h3>
                            <p>Elija un tipo de piedra para ver detalles de precios y configurar valores</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para edición de precios -->
            <div id="priceEditModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="priceEditTitle">Editar Precio</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
                    </div>
                    <div class="modal-body" id="priceEditBody">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    renderGemstoneTabs() {
        const nav = document.getElementById('gemstoneNav');
        const quickSelect = document.getElementById('quickGemstone');
        
        if (!nav || !quickSelect) return;

        nav.innerHTML = '';
        quickSelect.innerHTML = '<option value="">Seleccionar piedra...</option>';

        Object.keys(GEMSTONE_CONFIG.gemstones).forEach(gemstoneKey => {
            const gemstone = GEMSTONE_CONFIG.gemstones[gemstoneKey];
            
            // Navigation tab
            const navItem = document.createElement('div');
            navItem.className = `gemstone-nav-item ${this.currentGemstone === gemstoneKey ? 'active' : ''}`;
            navItem.setAttribute('data-gemstone', gemstoneKey);
            navItem.innerHTML = `
                <div class="gemstone-icon" style="background: ${gemstone.color}">
                    ${gemstone.symbol}
                </div>
                <div class="gemstone-info">
                    <h4>${gemstone.name}</h4>
                    <span class="classification">${gemstone.classification}</span>
                    <span class="hardness">Dureza: ${gemstone.hardness}</span>
                </div>
            `;
            
            navItem.addEventListener('click', () => {
                this.selectGemstone(gemstoneKey);
            });
            
            nav.appendChild(navItem);

            // Quick calculator option
            const option = document.createElement('option');
            option.value = gemstoneKey;
            option.textContent = `${gemstone.symbol} ${gemstone.name}`;
            quickSelect.appendChild(option);
        });
    }

    renderPricingCalculator() {
        if (!this.currentGemstone) {
            const content = document.getElementById('gemstoneContent');
            if (content) {
                content.innerHTML = `
                    <div class="no-gemstone-selected">
                        <h3>👈 Seleccione una piedra preciosa</h3>
                        <p>Elija un tipo de piedra para ver detalles de precios y configurar valores</p>
                    </div>
                `;
            }
            return;
        }

        const gemstone = GEMSTONE_CONFIG.gemstones[this.currentGemstone];
        const content = document.getElementById('gemstoneContent');
        
        if (!content) return;

        content.innerHTML = `
            <div class="gemstone-detail-header">
                <div class="gemstone-title">
                    <div class="gemstone-icon-large" style="background: ${gemstone.color}">
                        ${gemstone.symbol}
                    </div>
                    <div>
                        <h3>${gemstone.name}</h3>
                        <div class="gemstone-properties">
                            <span class="classification-badge">${gemstone.classification}</span>
                            <span class="hardness-badge">Dureza: ${gemstone.hardness}</span>
                            <span class="base-price">Base: $${gemstone.basePrice.toLocaleString()} USD/ct</span>
                        </div>
                    </div>
                </div>
                
                <div class="gemstone-actions">
                    <button id="editBasePrice" class="btn-edit">✏️ Editar Precio Base</button>
                    <button id="viewPriceChart" class="btn-view">📊 Ver Tabla de Precios</button>
                    <button id="exportGemstoneData" class="btn-export">📤 Exportar</button>
                </div>
            </div>
            
            <div class="pricing-calculator-advanced">
                <h4>🧮 Calculadora Avanzada - ${gemstone.name}</h4>
                
                <div class="calculator-form">
                    <div class="form-section">
                        <h5>💎 Características Básicas</h5>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Peso (quilates):</label>
                                <input type="number" id="calcWeight" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label>Forma/Corte:</label>
                                <select id="calcShape">
                                    <option value="round">Redondo</option>
                                    <option value="oval">Ovalado</option>
                                    <option value="emerald">Esmeralda</option>
                                    <option value="princess">Princesa</option>
                                    <option value="cushion">Cojín</option>
                                    <option value="pear">Pera</option>
                                    <option value="marquise">Marquesa</option>
                                    <option value="radiant">Radiante</option>
                                    <option value="asscher">Asscher</option>
                                    <option value="heart">Corazón</option>
                                    <option value="trillion">Trillón</option>
                                    <option value="cabochon">Cabujón</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h5>🎨 Factores de Calidad</h5>
                        <div class="quality-factors" id="qualityFactors">
                            ${this.renderQualityFactors(gemstone)}
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h5>📍 Origen y Tratamiento</h5>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>País de origen:</label>
                                <select id="calcOrigin">
                                    <option value="">Desconocido</option>
                                    ${this.renderOriginOptions(gemstone)}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Tratamiento:</label>
                                <select id="calcTreatment">
                                    ${Object.keys(GEMSTONE_CONFIG.treatments).map(treatment => 
                                        `<option value="${treatment}">${GEMSTONE_CONFIG.treatments[treatment].name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Certificación:</label>
                                <select id="calcCertification">
                                    ${Object.keys(GEMSTONE_CONFIG.certifications).map(cert => 
                                        `<option value="${cert}">${GEMSTONE_CONFIG.certifications[cert].name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h5>💰 Ajustes de Precio</h5>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Ajuste manual (%):</label>
                                <input type="number" id="calcManualAdjust" step="0.1" value="0" placeholder="0.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Margen del joyero (%):</label>
                                <input type="number" id="calcJewelerMarkup" step="0.1" value="50" placeholder="50.0">
                            </div>
                            
                            <div class="form-group">
                                <label>Condición:</label>
                                <select id="calcCondition">
                                    <option value="new">Nueva</option>
                                    <option value="excellent">Excelente</option>
                                    <option value="good">Buena</option>
                                    <option value="fair">Regular</option>
                                    <option value="poor">Pobre</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-actions">
                        <button id="calculatePrice" class="btn-calculate">🧮 Calcular Precio</button>
                        <button id="saveToQuote" class="btn-save">💾 Guardar en Cotización</button>
                        <button id="resetCalculator" class="btn-reset">🔄 Limpiar</button>
                    </div>
                </div>
                
                <div class="calculation-result" id="calculationResult" style="display: none;">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
            
            <div class="price-matrix-table">
                <h4>📊 Matriz de Precios - ${gemstone.name}</h4>
                <div class="matrix-controls">
                    <button id="showSimpleMatrix" class="btn-matrix active">Simple</button>
                    <button id="showAdvancedMatrix" class="btn-matrix">Avanzado</button>
                    <button id="showCustomMatrix" class="btn-matrix">Personalizado</button>
                </div>
                <div class="matrix-content" id="matrixContent">
                    ${this.renderPriceMatrix(gemstone)}
                </div>
            </div>
        `;

        this.setupCalculatorEventListeners();
    }

    renderQualityFactors(gemstone) {
        let html = '';
        
        Object.keys(gemstone.priceFactors).forEach(factorKey => {
            const factor = gemstone.priceFactors[factorKey];
            const factorName = this.getFactorDisplayName(factorKey);
            
            html += `
                <div class="quality-factor">
                    <label>${factorName}:</label>
                    <select id="calc${factorKey.charAt(0).toUpperCase() + factorKey.slice(1)}" class="quality-select">
                        <option value="">-- Seleccionar --</option>
                        ${Object.keys(factor).map(option => 
                            `<option value="${option}">${this.getOptionDisplayName(factorKey, option)} (${factor[option]}x)</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        });
        
        return html;
    }

    renderOriginOptions(gemstone) {
        if (!gemstone.priceFactors.origin) {
            return `
                <option value="unknown">Desconocido</option>
                <option value="brazil">Brasil</option>
                <option value="colombia">Colombia</option>
                <option value="madagascar">Madagascar</option>
                <option value="sri_lanka">Sri Lanka</option>
                <option value="thailand">Tailandia</option>
                <option value="burma">Myanmar (Birmania)</option>
                <option value="afghanistan">Afganistán</option>
                <option value="russia">Rusia</option>
                <option value="usa">Estados Unidos</option>
                <option value="australia">Australia</option>
                <option value="africa">África</option>
                <option value="other">Otro</option>
            `;
        }
        
        return Object.keys(gemstone.priceFactors.origin).map(origin => 
            `<option value="${origin}">${this.getOriginDisplayName(origin)}</option>`
        ).join('');
    }

    renderPriceMatrix(gemstone) {
        const weights = [0.25, 0.5, 1.0, 2.0, 3.0, 5.0];
        const grades = Object.keys(GEMSTONE_CONFIG.qualityGrades);
        
        return `
            <div class="matrix-table-container">
                <table class="price-matrix-table">
                    <thead>
                        <tr>
                            <th>Peso (ct)</th>
                            ${grades.map(grade => 
                                `<th style="background: ${GEMSTONE_CONFIG.qualityGrades[grade].color}20">
                                    ${GEMSTONE_CONFIG.qualityGrades[grade].name}
                                </th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${weights.map(weight => `
                            <tr>
                                <td class="weight-cell"><strong>${weight} ct</strong></td>
                                ${grades.map(grade => {
                                    const price = this.calculateBasePrice(gemstone, weight, grade);
                                    return `
                                        <td class="price-cell" 
                                            data-weight="${weight}" 
                                            data-grade="${grade}"
                                            onclick="window.gemstonePricing.editPrice('${this.currentGemstone}', ${weight}, '${grade}')">
                                            $${price.toLocaleString('es-MX')}
                                            <small>MXN</small>
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="matrix-legend">
                <h5>📖 Leyenda</h5>
                <div class="legend-items">
                    <div class="legend-item">
                        <span class="legend-color" style="background: #FFD700"></span>
                        <span>AAA - Excepcional (2.0x)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #C0C0C0"></span>
                        <span>AA - Excelente (1.5x)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #CD7F32"></span>
                        <span>A - Buena (1.0x)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #A0A0A0"></span>
                        <span>B - Comercial (0.7x)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #696969"></span>
                        <span>C - Básica (0.4x)</span>
                    </div>
                </div>
            </div>
        `;
    }

    // =================================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // =================================================================

    setupEventListeners() {
        // Modo de cálculo
        document.addEventListener('change', (e) => {
            if (e.target.matches('#calculationMode')) {
                this.calculationMode = e.target.value;
                this.renderPricingCalculator();
            } else if (e.target.matches('#baseCurrency, #exchangeRate')) {
                this.updateAllPrices();
            }
        });

        // Calculadora rápida
        document.addEventListener('click', (e) => {
            if (e.target.matches('#quickCalculate')) {
                this.performQuickCalculation();
            }
        });

        // Botones principales
        document.addEventListener('click', (e) => {
            if (e.target.matches('#exportMatrix')) {
                this.exportMatrix();
            } else if (e.target.matches('#importMatrix')) {
                this.importMatrix();
            } else if (e.target.matches('#resetToDefaults')) {
                this.resetToDefaults();
            } else if (e.target.matches('#bulkUpdatePrices')) {
                this.showBulkUpdateModal();
            }
        });
    }

    setupCalculatorEventListeners() {
        // Cálculo avanzado
        document.addEventListener('click', (e) => {
            if (e.target.matches('#calculatePrice')) {
                this.calculateAdvancedPrice();
            } else if (e.target.matches('#saveToQuote')) {
                this.saveToQuote();
            } else if (e.target.matches('#resetCalculator')) {
                this.resetCalculator();
            } else if (e.target.matches('#editBasePrice')) {
                this.editBasePrice();
            } else if (e.target.matches('#viewPriceChart')) {
                this.viewPriceChart();
            } else if (e.target.matches('#exportGemstoneData')) {
                this.exportGemstoneData();
            }
        });

        // Matriz de precios
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-matrix')) {
                document.querySelectorAll('.btn-matrix').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const matrixType = e.target.id.replace('show', '').replace('Matrix', '').toLowerCase();
                this.switchMatrixView(matrixType);
            }
        });

        // Auto-cálculo en cambios de inputs
        document.addEventListener('input', (e) => {
            if (e.target.matches('#calcWeight, #calcManualAdjust, #calcJewelerMarkup')) {
                // Auto-calculate if all basic fields are filled
                setTimeout(() => {
                    this.maybeAutoCalculate();
                }, 500);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('.quality-select, #calcOrigin, #calcTreatment, #calcCertification, #calcCondition')) {
                setTimeout(() => {
                    this.maybeAutoCalculate();
                }, 300);
            }
        });
    }

    // =================================================================
    // GESTIÓN DE PIEDRAS PRECIOSAS
    // =================================================================

    selectGemstone(gemstoneKey) {
        this.currentGemstone = gemstoneKey;
        
        // Actualizar navegación
        document.querySelectorAll('.gemstone-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-gemstone="${gemstoneKey}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Renderizar calculadora
        this.renderPricingCalculator();
        
        this.notifyObservers('gemstone_selected', { gemstoneKey });
    }

    // =================================================================
    // CÁLCULOS DE PRECIOS
    // =================================================================

    calculateBasePrice(gemstone, weight, grade) {
        const gradeInfo = GEMSTONE_CONFIG.qualityGrades[grade];
        const exchangeRate = parseFloat(document.getElementById('exchangeRate')?.value || 18.50);
        
        let basePrice = gemstone.basePrice;
        
        // Aplicar multiplicador de grado
        if (gradeInfo) {
            basePrice *= gradeInfo.multiplier;
        }
        
        // Aplicar peso
        let totalPrice = basePrice * weight;
        
        // Aplicar multiplicador de tamaño
        const sizeMultiplier = this.getSizeMultiplier(weight);
        totalPrice *= sizeMultiplier;
        
        // Convertir a MXN
        return totalPrice * exchangeRate;
    }

    calculateAdvancedPrice() {
        if (!this.currentGemstone) return;

        const gemstone = GEMSTONE_CONFIG.gemstones[this.currentGemstone];
        const weight = parseFloat(document.getElementById('calcWeight')?.value || 0);
        
        if (weight <= 0) {
            alert('Ingrese un peso válido');
            return;
        }

        // Recopilar todos los factores
        const factors = this.collectQualityFactors(gemstone);
        const origin = document.getElementById('calcOrigin')?.value;
        const treatment = document.getElementById('calcTreatment')?.value || 'none';
        const certification = document.getElementById('calcCertification')?.value || 'none';
        const condition = document.getElementById('calcCondition')?.value || 'new';
        const manualAdjust = parseFloat(document.getElementById('calcManualAdjust')?.value || 0);
        const jewelerMarkup = parseFloat(document.getElementById('calcJewelerMarkup')?.value || 50);
        const exchangeRate = parseFloat(document.getElementById('exchangeRate')?.value || 18.50);

        // Cálculo paso a paso
        let basePrice = gemstone.basePrice;
        let totalMultiplier = 1.0;
        const breakdown = {
            basePrice: basePrice,
            weight: weight,
            factors: {},
            finalMultiplier: 1.0,
            wholesalePrice: 0,
            retailPrice: 0
        };

        // Aplicar factores de calidad específicos
        Object.keys(factors).forEach(factorKey => {
            const factorValue = factors[factorKey];
            if (factorValue && gemstone.priceFactors[factorKey] && gemstone.priceFactors[factorKey][factorValue]) {
                const multiplier = gemstone.priceFactors[factorKey][factorValue];
                totalMultiplier *= multiplier;
                breakdown.factors[factorKey] = {
                    value: factorValue,
                    multiplier: multiplier,
                    name: this.getFactorDisplayName(factorKey)
                };
            }
        });

        // Aplicar origen si está disponible
        if (origin && gemstone.priceFactors.origin && gemstone.priceFactors.origin[origin]) {
            const originMultiplier = gemstone.priceFactors.origin[origin];
            totalMultiplier *= originMultiplier;
            breakdown.factors.origin = {
                value: origin,
                multiplier: originMultiplier,
                name: 'Origen'
            };
        }

        // Aplicar tratamiento
        if (treatment && GEMSTONE_CONFIG.treatments[treatment]) {
            const treatmentMultiplier = GEMSTONE_CONFIG.treatments[treatment].multiplier;
            totalMultiplier *= treatmentMultiplier;
            breakdown.factors.treatment = {
                value: treatment,
                multiplier: treatmentMultiplier,
                name: 'Tratamiento'
            };
        }

        // Aplicar certificación
        if (certification && GEMSTONE_CONFIG.certifications[certification]) {
            const certMultiplier = GEMSTONE_CONFIG.certifications[certification].premium;
            totalMultiplier *= certMultiplier;
            breakdown.factors.certification = {
                value: certification,
                multiplier: certMultiplier,
                name: 'Certificación'
            };
        }

        // Aplicar multiplicador de tamaño
        const sizeMultiplier = this.getSizeMultiplier(weight);
        totalMultiplier *= sizeMultiplier;
        breakdown.factors.size = {
            value: this.getSizeCategoryName(weight),
            multiplier: sizeMultiplier,
            name: 'Categoría de tamaño'
        };

        // Aplicar condición
        const conditionMultipliers = {
            new: 1.0,
            excellent: 0.95,
            good: 0.85,
            fair: 0.7,
            poor: 0.5
        };
        const conditionMultiplier = conditionMultipliers[condition] || 1.0;
        totalMultiplier *= conditionMultiplier;
        breakdown.factors.condition = {
            value: condition,
            multiplier: conditionMultiplier,
            name: 'Condición'
        };

        // Aplicar ajuste manual
        if (manualAdjust !== 0) {
            const manualMultiplier = 1 + (manualAdjust / 100);
            totalMultiplier *= manualMultiplier;
            breakdown.factors.manual = {
                value: manualAdjust,
                multiplier: manualMultiplier,
                name: 'Ajuste manual'
            };
        }

        breakdown.finalMultiplier = totalMultiplier;

        // Precio al por mayor (USD)
        const wholesalePriceUSD = basePrice * weight * totalMultiplier;
        breakdown.wholesalePrice = wholesalePriceUSD;

        // Precio de venta (con margen del joyero)
        const retailPriceUSD = wholesalePriceUSD * (1 + jewelerMarkup / 100);
        breakdown.retailPrice = retailPriceUSD;

        // Convertir a MXN
        breakdown.wholesalePriceMXN = wholesalePriceUSD * exchangeRate;
        breakdown.retailPriceMXN = retailPriceUSD * exchangeRate;

        // Mostrar resultado
        this.displayCalculationResult(breakdown);
    }

    displayCalculationResult(breakdown) {
        const resultDiv = document.getElementById('calculationResult');
        if (!resultDiv) return;

        const gemstone = GEMSTONE_CONFIG.gemstones[this.currentGemstone];

        resultDiv.innerHTML = `
            <div class="calculation-summary">
                <h5>💰 Resultado del Cálculo - ${gemstone.name}</h5>
                
                <div class="price-results">
                    <div class="price-result wholesale">
                        <span class="price-label">Precio Mayoreo:</span>
                        <span class="price-value">$${breakdown.wholesalePriceMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                        <small>($${breakdown.wholesalePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)</small>
                    </div>
                    <div class="price-result retail">
                        <span class="price-label">Precio Venta:</span>
                        <span class="price-value">$${breakdown.retailPriceMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                        <small>($${breakdown.retailPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)</small>
                    </div>
                </div>
            </div>
            
            <div class="calculation-breakdown">
                <h6>📋 Desglose del Cálculo</h6>
                
                <div class="breakdown-table">
                    <div class="breakdown-row">
                        <span class="factor-name">Precio base:</span>
                        <span class="factor-value">$${breakdown.basePrice.toLocaleString()} USD/ct</span>
                        <span class="factor-multiplier">1.0x</span>
                    </div>
                    
                    <div class="breakdown-row">
                        <span class="factor-name">Peso:</span>
                        <span class="factor-value">${breakdown.weight} quilates</span>
                        <span class="factor-multiplier">${breakdown.weight}x</span>
                    </div>
                    
                    ${Object.keys(breakdown.factors).map(factorKey => {
                        const factor = breakdown.factors[factorKey];
                        return `
                            <div class="breakdown-row">
                                <span class="factor-name">${factor.name}:</span>
                                <span class="factor-value">${this.getFactorValueDisplay(factorKey, factor.value)}</span>
                                <span class="factor-multiplier">${factor.multiplier.toFixed(2)}x</span>
                            </div>
                        `;
                    }).join('')}
                    
                    <div class="breakdown-row total">
                        <span class="factor-name"><strong>Multiplicador total:</strong></span>
                        <span class="factor-value"></span>
                        <span class="factor-multiplier"><strong>${breakdown.finalMultiplier.toFixed(2)}x</strong></span>
                    </div>
                </div>
            </div>
            
            <div class="calculation-actions">
                <button id="addToQuote" class="btn-add">📋 Agregar a Cotización</button>
                <button id="saveCalculation" class="btn-save">💾 Guardar Cálculo</button>
                <button id="shareCalculation" class="btn-share">📱 Compartir</button>
                <button id="printCalculation" class="btn-print">🖨️ Imprimir</button>
            </div>
        `;

        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    performQuickCalculation() {
        const gemstoneKey = document.getElementById('quickGemstone')?.value;
        const weight = parseFloat(document.getElementById('quickWeight')?.value || 0);
        const grade = document.getElementById('quickGrade')?.value;
        const resultDiv = document.getElementById('quickResult');

        if (!gemstoneKey || weight <= 0 || !grade) {
            resultDiv.innerHTML = '<span class="error">Complete todos los campos</span>';
            return;
        }

        const gemstone = GEMSTONE_CONFIG.gemstones[gemstoneKey];
        const price = this.calculateBasePrice(gemstone, weight, grade);

        resultDiv.innerHTML = `
            <div class="quick-price">
                <strong>$${price.toLocaleString('es-MX')} MXN</strong>
                <small>Precio estimado</small>
            </div>
        `;
    }

    // =================================================================
    // FUNCIONES DE UTILIDAD
    // =================================================================

    collectQualityFactors(gemstone) {
        const factors = {};
        
        Object.keys(gemstone.priceFactors).forEach(factorKey => {
            const selectId = `calc${factorKey.charAt(0).toUpperCase() + factorKey.slice(1)}`;
            const selectElement = document.getElementById(selectId);
            if (selectElement && selectElement.value) {
                factors[factorKey] = selectElement.value;
            }
        });

        return factors;
    }

    getSizeMultiplier(weight) {
        if (weight < 0.18) return GEMSTONE_CONFIG.sizeCategories.melee.multiplier;
        if (weight < 0.5) return GEMSTONE_CONFIG.sizeCategories.small.multiplier;
        if (weight < 2.0) return GEMSTONE_CONFIG.sizeCategories.medium.multiplier;
        if (weight < 5.0) return GEMSTONE_CONFIG.sizeCategories.large.multiplier;
        return GEMSTONE_CONFIG.sizeCategories.extra_large.multiplier;
    }

    getSizeCategoryName(weight) {
        if (weight < 0.18) return 'Melee';
        if (weight < 0.5) return 'Pequeño';
        if (weight < 2.0) return 'Mediano';
        if (weight < 5.0) return 'Grande';
        return 'Extra Grande';
    }

    getFactorDisplayName(factorKey) {
        const displayNames = {
            cut: 'Corte',
            color: 'Color',
            clarity: 'Pureza',
            certification: 'Certificación',
            origin: 'Origen',
            treatment: 'Tratamiento',
            size: 'Tamaño',
            variety: 'Variedad'
        };
        return displayNames[factorKey] || factorKey;
    }

    getOptionDisplayName(factorKey, option) {
        // Mapeos específicos para diferentes factores
        const mappings = {
            cut: {
                excellent: 'Excelente',
                very_good: 'Muy Bueno',
                good: 'Bueno',
                fair: 'Regular',
                poor: 'Pobre'
            },
            color: {
                d: 'D (Incoloro)',
                e: 'E (Incoloro)',
                f: 'F (Incoloro)',
                g: 'G (Casi Incoloro)',
                h: 'H (Casi Incoloro)',
                i: 'I (Casi Incoloro)',
                j: 'J (Ligeramente Amarillo)',
                k: 'K (Ligeramente Amarillo)',
                l: 'L (Ligeramente Amarillo)',
                m: 'M (Amarillo Claro)',
                pigeon_blood: 'Sangre de Paloma',
                vivid_red: 'Rojo Vívido',
                strong_red: 'Rojo Fuerte',
                medium_red: 'Rojo Medio',
                light_red: 'Rojo Claro',
                pink_red: 'Rojo Rosado',
                vivid_green: 'Verde Vívido',
                strong_green: 'Verde Fuerte',
                medium_green: 'Verde Medio',
                light_green: 'Verde Claro',
                pale_green: 'Verde Pálido',
                cornflower_blue: 'Azul Aciano',
                royal_blue: 'Azul Real',
                vivid_blue: 'Azul Vívido',
                medium_blue: 'Azul Medio',
                light_blue: 'Azul Claro',
                padparadscha: 'Padparadscha',
                pink: 'Rosa',
                yellow: 'Amarillo',
                white: 'Blanco',
                green: 'Verde',
                purple: 'Púrpura'
            },
            clarity: {
                fl: 'FL (Sin Defectos)',
                if: 'IF (Sin Inclusiones)',
                vvs1: 'VVS1',
                vvs2: 'VVS2',
                vs1: 'VS1',
                vs2: 'VS2',
                si1: 'SI1',
                si2: 'SI2',
                i1: 'I1',
                i2: 'I2',
                i3: 'I3',
                eye_clean: 'Limpio al Ojo',
                slightly_included: 'Ligeramente Incluido',
                moderately_included: 'Moderadamente Incluido',
                heavily_included: 'Muy Incluido'
            }
        };

        return mappings[factorKey]?.[option] || option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getOriginDisplayName(origin) {
        const origins = {
            burma: 'Myanmar (Birmania)',
            sri_lanka: 'Sri Lanka',
            madagascar: 'Madagascar',
            mozambique: 'Mozambique',
            thailand: 'Tailandia',
            brazil: 'Brasil',
            colombia: 'Colombia',
            zambia: 'Zambia',
            afghanistan: 'Afganistán',
            russia: 'Rusia',
            usa: 'Estados Unidos',
            australia: 'Australia',
            africa: 'África',
            kashmir: 'Cachemira',
            ceylon: 'Ceilán',
            uruguay: 'Uruguay',
            pakistan: 'Pakistán',
            nigeria: 'Nigeria',
            china: 'China',
            arizona: 'Arizona',
            india: 'India',
            tanzania: 'Tanzania',
            unknown: 'Desconocido',
            other: 'Otro',
            synthetic: 'Sintético'
        };
        return origins[origin] || origin.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getFactorValueDisplay(factorKey, value) {
        if (factorKey === 'manual') {
            return `${value > 0 ? '+' : ''}${value}%`;
        }
        return this.getOptionDisplayName(factorKey, value);
    }

    maybeAutoCalculate() {
        const weight = parseFloat(document.getElementById('calcWeight')?.value || 0);
        
        if (weight > 0) {
            // Auto-calculate if weight is set and at least one quality factor is selected
            const qualitySelects = document.querySelectorAll('.quality-select');
            const hasQualityFactor = Array.from(qualitySelects).some(select => select.value);
            
            if (hasQualityFactor) {
                this.calculateAdvancedPrice();
            }
        }
    }

    resetCalculator() {
        // Reset all inputs
        const inputs = document.querySelectorAll('#gemstoneContent input, #gemstoneContent select');
        inputs.forEach(input => {
            if (input.type === 'number') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            }
        });

        // Hide result
        const resultDiv = document.getElementById('calculationResult');
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
    }

    switchMatrixView(matrixType) {
        // Implementar diferentes vistas de matriz según el tipo
        const matrixContent = document.getElementById('matrixContent');
        if (!matrixContent || !this.currentGemstone) return;

        const gemstone = GEMSTONE_CONFIG.gemstones[this.currentGemstone];

        switch (matrixType) {
            case 'simple':
                matrixContent.innerHTML = this.renderPriceMatrix(gemstone);
                break;
            case 'advanced':
                matrixContent.innerHTML = this.renderAdvancedMatrix(gemstone);
                break;
            case 'custom':
                matrixContent.innerHTML = this.renderCustomMatrix(gemstone);
                break;
        }
    }

    renderAdvancedMatrix(gemstone) {
        // Matriz más detallada con factores específicos
        return `
            <div class="advanced-matrix">
                <p>Matriz avanzada con factores específicos de ${gemstone.name}</p>
                <p><em>Esta función se implementará en una versión futura</em></p>
            </div>
        `;
    }

    renderCustomMatrix(gemstone) {
        // Matriz personalizable por el usuario
        return `
            <div class="custom-matrix">
                <p>Matriz personalizable para ${gemstone.name}</p>
                <p><em>Esta función se implementará en una versión futura</em></p>
            </div>
        `;
    }

    // =================================================================
    // EXPORTACIÓN E IMPORTACIÓN
    // =================================================================

    exportMatrix() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            gemstones: GEMSTONE_CONFIG.gemstones,
            customPrices: Object.fromEntries(this.customPrices),
            priceOverrides: Object.fromEntries(this.priceOverrides),
            settings: {
                calculationMode: this.calculationMode,
                baseCurrency: document.getElementById('baseCurrency')?.value,
                exchangeRate: parseFloat(document.getElementById('exchangeRate')?.value || 18.50)
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemstone_pricing_matrix_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Matriz de piedras preciosas exportada');
    }

    // =================================================================
    // PERSISTENCIA Y OBSERVERS
    // =================================================================

    persistData() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                customPrices: Object.fromEntries(this.customPrices),
                priceOverrides: Object.fromEntries(this.priceOverrides),
                currentGemstone: this.currentGemstone,
                calculationMode: this.calculationMode
            };

            localStorage.setItem(
                GEMSTONE_CONFIG.storage.prefix + 'data',
                JSON.stringify(data)
            );

        } catch (error) {
            console.error('Error persistiendo datos de piedras preciosas:', error);
        }
    }

    loadPersistedData() {
        try {
            const stored = localStorage.getItem(GEMSTONE_CONFIG.storage.prefix + 'data');
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Verificar TTL
            const age = Date.now() - data.timestamp;
            if (age > GEMSTONE_CONFIG.storage.ttl) {
                console.log('🗂️ Datos de piedras preciosas expirados, usando defaults');
                return;
            }

            // Restaurar datos
            if (data.customPrices) {
                this.customPrices = new Map(Object.entries(data.customPrices));
            }
            
            if (data.priceOverrides) {
                this.priceOverrides = new Map(Object.entries(data.priceOverrides));
            }
            
            if (data.currentGemstone) {
                this.currentGemstone = data.currentGemstone;
            }
            
            if (data.calculationMode) {
                this.calculationMode = data.calculationMode;
            }

            console.log('📂 Datos de piedras preciosas restaurados');

        } catch (error) {
            console.error('Error cargando datos de piedras preciosas:', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.persistData();
        }, GEMSTONE_CONFIG.storage.backupInterval);
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
                console.error('Error en observer de gemstone pricing:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA INTEGRACIÓN
    // =================================================================

    getGemstonePrice(gemstoneKey, weight, qualityFactors = {}) {
        const gemstone = GEMSTONE_CONFIG.gemstones[gemstoneKey];
        if (!gemstone) return null;

        let basePrice = gemstone.basePrice;
        let totalMultiplier = 1.0;

        // Aplicar factores de calidad
        Object.keys(qualityFactors).forEach(factorKey => {
            const factorValue = qualityFactors[factorKey];
            if (gemstone.priceFactors[factorKey] && gemstone.priceFactors[factorKey][factorValue]) {
                totalMultiplier *= gemstone.priceFactors[factorKey][factorValue];
            }
        });

        // Aplicar multiplicador de tamaño
        totalMultiplier *= this.getSizeMultiplier(weight);

        // Precio final en USD
        const priceUSD = basePrice * weight * totalMultiplier;

        // Convertir a MXN
        const exchangeRate = parseFloat(document.getElementById('exchangeRate')?.value || 18.50);
        const priceMXN = priceUSD * exchangeRate;

        return {
            priceUSD: priceUSD,
            priceMXN: priceMXN,
            basePrice: basePrice,
            weight: weight,
            totalMultiplier: totalMultiplier,
            gemstone: gemstone.name
        };
    }

    getAllGemstoneTypes() {
        return Object.keys(GEMSTONE_CONFIG.gemstones).map(key => ({
            key: key,
            name: GEMSTONE_CONFIG.gemstones[key].name,
            symbol: GEMSTONE_CONFIG.gemstones[key].symbol,
            classification: GEMSTONE_CONFIG.gemstones[key].classification,
            basePrice: GEMSTONE_CONFIG.gemstones[key].basePrice
        }));
    }

    getMatrixStatus() {
        return {
            currentGemstone: this.currentGemstone,
            calculationMode: this.calculationMode,
            customPrices: this.customPrices.size,
            priceOverrides: this.priceOverrides.size,
            isInitialized: this.isInitialized
        };
    }

    destroy() {
        this.observers = [];
        console.log('🔄 Matriz de precios de piedras preciosas destruida');
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.gemstonePricing = new GemstonePricingMatrix();

// Integrar con otros sistemas
if (window.supplierPricing) {
    window.supplierPricing.addObserver((event, data) => {
        if (event === 'product_created' && data.product.category.includes('gem')) {
            // Sincronizar precios de piedras con proveedores
            window.gemstonePricing.notifyObservers('supplier_gemstone_added', data);
        }
    });
}

if (window.globalMarkupSettings) {
    window.globalMarkupSettings.addObserver((event, data) => {
        if (event === 'markup_value_changed') {
            // Actualizar cálculos cuando cambien los márgenes
            window.gemstonePricing.notifyObservers('external_markup_changed', data);
        }
    });
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GemstonePricingMatrix;
}

console.log('✅ Sistema de Matriz de Precios de Piedras Preciosas v1.0 cargado correctamente');
console.log('💎 Configurar matriz: window.gemstonePricing.setupUI()');
console.log('🧮 Calcular precio: window.gemstonePricing.getGemstonePrice(gemstoneKey, weight, factors)');
console.log('📊 Ver estado: window.gemstonePricing.getMatrixStatus()');