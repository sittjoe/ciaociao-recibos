// calculator-system.js - CALCULADORA INTEGRADA CON SISTEMA DE PRECIOS REALES v2.0
// Usa los 10 subagentes del sistema de precios para obtener datos en tiempo real
// =================================================================

console.log('🧮 Iniciando Calculadora Integrada con Sistema de Precios Reales v2.0...');

// Verificar que el sistema de precios esté disponible
if (typeof window.getPrice === 'function') {
    console.log('✅ Sistema de precios integrado detectado');
} else {
    console.warn('⚠️ Sistema de precios no disponible - usando fallbacks');
}

// =================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =================================================================

const CALCULATOR_CONFIG = {
    storageKey: 'calculator_projects_ciaociao',
    maxProjects: 100,
    priceCache: 'calculator_price_cache',
    cacheExpiry: 5 * 60 * 1000, // 5 minutos en ms
    apiRetryDelay: 1000,
    debounceDelay: 500,
    metalAPIs: {
        gold: 'https://api.metals.live/v1/spot/gold',
        silver: 'https://api.metals.live/v1/spot/silver', 
        platinum: 'https://api.metals.live/v1/spot/platinum'
    },
    metalPurities: {
        '10k': 0.417,
        '14k': 0.583,
        '18k': 0.750,
        '22k': 0.917,
        '24k': 1.000
    },
    diamondPricing: {
        // Precios base por quilate según claridad (USD)
        FL: { base: 8000, multiplier: 1.5 },
        IF: { base: 7500, multiplier: 1.4 },
        VVS1: { base: 6500, multiplier: 1.3 },
        VVS2: { base: 6000, multiplier: 1.25 },
        VS1: { base: 5000, multiplier: 1.2 },
        VS2: { base: 4500, multiplier: 1.15 },
        SI1: { base: 3500, multiplier: 1.1 },
        SI2: { base: 2800, multiplier: 1.05 },
        I1: { base: 2000, multiplier: 1.0 }
    },
    gemstoneRanges: {
        ruby: { low: 200, medium: 800, high: 2000, premium: 5000 },
        emerald: { low: 300, medium: 1200, high: 3000, premium: 8000 },
        sapphire: { low: 150, medium: 600, high: 1500, premium: 4000 }
    },
    exchangeRate: 20.0 // USD a MXN, se actualizará con API
};

// Variables globales del sistema
let priceCalculator = null;
let calculatorProject = {
    id: null,
    name: '',
    date: new Date().toISOString().split('T')[0],
    clientReference: '',
    metal: {},
    diamonds: {},
    gemstones: {},
    labor: {},
    costs: {},
    totals: {},
    observations: ''
};
let calculatorHistory = [];
let priceCache = {};
let isCalculating = false;

// =================================================================
// CLASE PRINCIPAL DE CALCULADORA
// =================================================================

class PriceCalculator {
    constructor() {
        this.cache = this.loadCache();
        this.exchangeRate = CALCULATOR_CONFIG.exchangeRate;
        this.initializeExchangeRate();
    }

    async initializeExchangeRate() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            if (data.rates && data.rates.MXN) {
                this.exchangeRate = data.rates.MXN;
                console.log(`💱 Tipo de cambio actualizado: $${this.exchangeRate} MXN/USD`);
            }
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar el tipo de cambio, usando valor por defecto');
        }
    }

    loadCache() {
        try {
            const cached = localStorage.getItem(CALCULATOR_CONFIG.priceCache);
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.error('Error cargando cache:', error);
            return {};
        }
    }

    saveCache() {
        try {
            localStorage.setItem(CALCULATOR_CONFIG.priceCache, JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error guardando cache:', error);
        }
    }

    isCacheValid(cacheKey) {
        const cached = this.cache[cacheKey];
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < CALCULATOR_CONFIG.cacheExpiry;
    }

    async getMetalPrice(metalType, karats = null) {
        const cacheKey = `metal_${metalType}_${karats}`;
        
        if (this.isCacheValid(cacheKey)) {
            console.log(`📦 Usando precio en cache para ${metalType}`);
            return this.cache[cacheKey].price;
        }

        try {
            // ✅ USAR SISTEMA DE PRECIOS REAL SI ESTÁ DISPONIBLE
            if (typeof window.getPrice === 'function') {
                console.log(`🔗 Obteniendo precio real de ${metalType} ${karats || ''} del sistema integrado...`);
                
                // Convertir nombres para el sistema de precios
                let metalName = metalType;
                if (metalType === 'oro') metalName = 'gold';
                if (metalType === 'plata') metalName = 'silver';
                if (metalType === 'platino') metalName = 'platinum';
                
                // Usar API unificada del sistema de precios
                const result = await window.getPrice(metalName, karats || '24k', 1, {
                    source: 'calculator',
                    requestId: `calc_${Date.now()}`
                });
                
                if (result && result.pricePerGram) {
                    const pricePerGramMXN = result.pricePerGram;
                    
                    // Guardar en cache
                    this.cache[cacheKey] = {
                        price: pricePerGramMXN,
                        timestamp: Date.now(),
                        source: result.source,
                        confidence: result.confidence
                    };
                    this.saveCache();
                    
                    console.log(`✅ Precio real ${metalType} obtenido: $${pricePerGramMXN.toFixed(2)} MXN/g (${result.source})`);
                    return pricePerGramMXN;
                } else {
                    console.warn('⚠️ Sistema de precios devolvió resultado inválido, usando fallback');
                }
            }
            
            // 🔄 FALLBACK: Precio simulado si el sistema de precios no está disponible
            console.log(`⚠️ Usando precios de fallback para ${metalType} ${karats || ''}`);
            let pricePerOz = 0;
            
            switch(metalType) {
                case 'oro':
                    // Precio simulado del oro (en USD por onza troy)
                    pricePerOz = 2000 + (Math.random() * 100 - 50); // Precio base ~$2000 ±$50
                    break;
                case 'plata':
                    pricePerOz = 25 + (Math.random() * 5 - 2.5); // Precio base ~$25 ±$2.5
                    break;
                case 'platino':
                    pricePerOz = 1000 + (Math.random() * 100 - 50); // Precio base ~$1000 ±$50
                    break;
                default:
                    throw new Error(`Tipo de metal no soportado: ${metalType}`);
            }

            // Convertir de USD/onza troy a MXN/gramo
            const pricePerGramUSD = pricePerOz / 31.1035;
            let pricePerGramMXN = pricePerGramUSD * this.exchangeRate;

            // Aplicar pureza si es oro
            if (metalType === 'oro' && karats) {
                const purity = CALCULATOR_CONFIG.metalPurities[karats] || 1;
                pricePerGramMXN *= purity;
            }

            // Guardar en cache
            this.cache[cacheKey] = {
                price: pricePerGramMXN,
                timestamp: Date.now(),
                source: 'fallback_simulator',
                confidence: 'low'
            };
            this.saveCache();

            console.log(`💰 Precio fallback ${metalType}: $${pricePerGramMXN.toFixed(2)} MXN/g`);
            return pricePerGramMXN;

        } catch (error) {
            console.error(`Error obteniendo precio de ${metalType}:`, error);
            
            // Precios fallback en MXN por gramo
            const fallbackPrices = {
                oro: 1200,
                plata: 15,
                platino: 800
            };
            
            let fallbackPrice = fallbackPrices[metalType] || 0;
            if (metalType === 'oro' && karats) {
                const purity = CALCULATOR_CONFIG.metalPurities[karats] || 1;
                fallbackPrice *= purity;
            }

            return fallbackPrice;
        }
    }

    calculateDiamondPrice(carats, clarity, color, cut, quantity) {
        if (!carats || carats <= 0 || !quantity || quantity <= 0) {
            return { pricePerCarat: 0, totalPrice: 0 };
        }

        try {
            const clarityData = CALCULATOR_CONFIG.diamondPricing[clarity];
            if (!clarityData) {
                throw new Error(`Claridad no válida: ${clarity}`);
            }

            let pricePerCarat = clarityData.base;

            // Ajustar por color (D es el mejor)
            const colorAdjustments = {
                'D': 1.3, 'E': 1.2, 'F': 1.15, 'G': 1.1, 
                'H': 1.05, 'I': 1.0, 'J': 0.95
            };
            pricePerCarat *= (colorAdjustments[color] || 1.0);

            // Ajustar por corte
            const cutAdjustments = {
                'Excellent': 1.2, 'Very Good': 1.1, 'Good': 1.0, 
                'Fair': 0.9, 'Poor': 0.8
            };
            pricePerCarat *= (cutAdjustments[cut] || 1.0);

            // Aplicar multiplicador por tamaño (diamantes más grandes son exponencialmente más caros)
            if (carats > 1) {
                pricePerCarat *= Math.pow(carats, 1.5);
            } else {
                pricePerCarat *= clarityData.multiplier;
            }

            // Convertir a MXN
            pricePerCarat *= this.exchangeRate;
            const totalPrice = pricePerCarat * carats * quantity;

            return {
                pricePerCarat: Math.round(pricePerCarat),
                totalPrice: Math.round(totalPrice)
            };

        } catch (error) {
            console.error('Error calculando precio de diamante:', error);
            return { pricePerCarat: 0, totalPrice: 0 };
        }
    }

    calculateGemstonePriceRange(type, carats, quality) {
        if (!type || !carats || carats <= 0 || !quality) {
            return { pricePerCarat: 0, totalPrice: 0, range: null };
        }

        try {
            const ranges = CALCULATOR_CONFIG.gemstoneRanges[type];
            if (!ranges) {
                throw new Error(`Tipo de piedra no válida: ${type}`);
            }

            const pricePerCaratUSD = ranges[quality] || 0;
            const pricePerCaratMXN = pricePerCaratUSD * this.exchangeRate;
            const totalPrice = pricePerCaratMXN * carats;

            return {
                pricePerCarat: Math.round(pricePerCaratMXN),
                totalPrice: Math.round(totalPrice),
                range: `$${Math.round(pricePerCaratMXN * 0.8)} - $${Math.round(pricePerCaratMXN * 1.2)}`
            };

        } catch (error) {
            console.error('Error calculando precio de piedra preciosa:', error);
            return { pricePerCarat: 0, totalPrice: 0, range: null };
        }
    }
}

// =================================================================
// INICIALIZACIÓN DE LA CALCULADORA
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Cargado - Inicializando calculadora...');
    
    try {
        initializeCalculator();
    } catch (error) {
        console.error('❌ Error inicializando calculadora:', error);
        if (window.utils) {
            window.utils.showNotification('Error al inicializar la calculadora', 'error');
        }
    }
});

function initializeCalculator() {
    console.log('🔧 Configurando calculadora...');
    
    // Inicializar calculadora de precios
    priceCalculator = new PriceCalculator();
    
    // Cargar historial de proyectos
    loadCalculatorHistory();
    
    // Configurar fecha actual
    setCalculatorDate();
    
    // Configurar todos los event listeners
    setupCalculatorEventListeners();
    
    // Configurar elementos colapsibles
    setupCollapsibleSections();
    
    // Configurar modales
    setupCalculatorModals();
    
    // Restaurar proyecto auto-guardado si existe
    restoreAutoSavedProject();
    
    console.log('✅ Calculadora inicializada correctamente');
    
    if (window.utils) {
        window.utils.showNotification('Calculadora lista para usar', 'success');
    }
}

function setCalculatorDate() {
    const dateInput = document.getElementById('calculatorDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        calculatorProject.date = dateInput.value;
    }
}

function loadCalculatorHistory() {
    try {
        const stored = localStorage.getItem(CALCULATOR_CONFIG.storageKey);
        calculatorHistory = stored ? JSON.parse(stored) : [];
        console.log(`📚 Cargados ${calculatorHistory.length} proyectos del historial`);
    } catch (error) {
        console.error('Error cargando historial:', error);
        calculatorHistory = [];
    }
}

function saveCalculatorHistory() {
    try {
        // Mantener solo los últimos N proyectos
        if (calculatorHistory.length > CALCULATOR_CONFIG.maxProjects) {
            calculatorHistory = calculatorHistory.slice(-CALCULATOR_CONFIG.maxProjects);
        }
        
        localStorage.setItem(CALCULATOR_CONFIG.storageKey, JSON.stringify(calculatorHistory));
        console.log('💾 Historial guardado correctamente');
    } catch (error) {
        console.error('Error guardando historial:', error);
    }
}

// =================================================================
// EVENT LISTENERS
// =================================================================

function setupCalculatorEventListeners() {
    console.log('🎯 Configurando event listeners...');

    // === INFORMACIÓN DEL PROYECTO ===
    const projectName = document.getElementById('projectName');
    const calculatorDate = document.getElementById('calculatorDate');
    const clientReference = document.getElementById('clientReference');

    if (projectName) {
        projectName.addEventListener('input', debounce(() => {
            calculatorProject.name = projectName.value;
            autoSaveProject();
        }, CALCULATOR_CONFIG.debounceDelay));
    }

    if (calculatorDate) {
        calculatorDate.addEventListener('change', () => {
            calculatorProject.date = calculatorDate.value;
            autoSaveProject();
        });
    }

    if (clientReference) {
        clientReference.addEventListener('input', debounce(() => {
            calculatorProject.clientReference = clientReference.value;
            autoSaveProject();
        }, CALCULATOR_CONFIG.debounceDelay));
    }

    // === METALES PRECIOSOS ===
    const metalType = document.getElementById('metalType');
    const goldKarats = document.getElementById('goldKarats');
    const metalWeight = document.getElementById('metalWeight');

    if (metalType) {
        metalType.addEventListener('change', () => {
            const goldKaratsGroup = document.getElementById('goldKaratsGroup');
            if (goldKaratsGroup) {
                goldKaratsGroup.style.display = metalType.value === 'oro' ? 'block' : 'none';
            }
            calculateMetalPrice();
        });
    }

    if (goldKarats) {
        goldKarats.addEventListener('change', calculateMetalPrice);
    }

    if (metalWeight) {
        metalWeight.addEventListener('input', debounce(calculateMetalPrice, CALCULATOR_CONFIG.debounceDelay));
    }

    // === DIAMANTES ===
    const diamondInputs = [
        'diamondCarats', 'diamondClarity', 'diamondColor', 'diamondCut', 'diamondQuantity'
    ];
    
    diamondInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            const eventType = element.tagName === 'SELECT' ? 'change' : 'input';
            const handler = element.tagName === 'SELECT' ? calculateDiamondPrice : 
                          debounce(calculateDiamondPrice, CALCULATOR_CONFIG.debounceDelay);
            element.addEventListener(eventType, handler);
        }
    });

    // === PIEDRAS PRECIOSAS ===
    const gemstoneInputs = [
        'gemstoneType', 'gemstoneCarats', 'gemstoneQuality'
    ];
    
    gemstoneInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            const eventType = element.tagName === 'SELECT' ? 'change' : 'input';
            const handler = element.tagName === 'SELECT' ? calculateGemstonePrice : 
                          debounce(calculateGemstonePrice, CALCULATOR_CONFIG.debounceDelay);
            element.addEventListener(eventType, handler);
        }
    });

    // === COSTOS DE FABRICACIÓN ===
    const laborHours = document.getElementById('laborHours');
    const laborRate = document.getElementById('laborRate');
    const profitMargin = document.getElementById('profitMargin');
    const additionalCosts = document.getElementById('additionalCosts');

    if (laborHours) {
        laborHours.addEventListener('input', debounce(calculateTotals, CALCULATOR_CONFIG.debounceDelay));
    }

    if (laborRate) {
        laborRate.addEventListener('input', debounce(calculateTotals, CALCULATOR_CONFIG.debounceDelay));
    }

    if (profitMargin) {
        profitMargin.addEventListener('input', debounce(calculateTotals, CALCULATOR_CONFIG.debounceDelay));
    }

    if (additionalCosts) {
        additionalCosts.addEventListener('input', debounce(calculateTotals, CALCULATOR_CONFIG.debounceDelay));
    }

    // === OBSERVACIONES ===
    const observations = document.getElementById('calculatorObservations');
    if (observations) {
        observations.addEventListener('input', debounce(() => {
            calculatorProject.observations = observations.value;
            autoSaveProject();
        }, CALCULATOR_CONFIG.debounceDelay));
    }

    // === BOTONES DE ACCIÓN ===
    const createQuotationBtn = document.getElementById('createQuotationBtn');
    const createReceiptBtn = document.getElementById('createReceiptBtn');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const printCalculationBtn = document.getElementById('printCalculationBtn');
    const resetCalculatorBtn = document.getElementById('resetCalculatorBtn');

    if (createQuotationBtn) {
        createQuotationBtn.addEventListener('click', showCreateDocumentModal.bind(null, 'quotation'));
    }

    if (createReceiptBtn) {
        createReceiptBtn.addEventListener('click', showCreateDocumentModal.bind(null, 'receipt'));
    }

    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', showSaveProjectModal);
    }

    if (printCalculationBtn) {
        printCalculationBtn.addEventListener('click', printCalculation);
    }

    if (resetCalculatorBtn) {
        resetCalculatorBtn.addEventListener('click', resetCalculator);
    }

    console.log('✅ Event listeners configurados');
}

// =================================================================
// FUNCIONES DE CÁLCULO
// =================================================================

async function calculateMetalPrice() {
    if (isCalculating) return;
    isCalculating = true;

    try {
        const metalType = document.getElementById('metalType')?.value;
        const goldKarats = document.getElementById('goldKarats')?.value;
        const metalWeight = parseFloat(document.getElementById('metalWeight')?.value || 0);

        if (!metalType || metalWeight <= 0) {
            updateMetalPriceFields(0, 0);
            updateResultField('resultMetalCost', 0);
            calculateTotals();
            return;
        }

        // Mostrar loading
        const priceField = document.getElementById('metalPricePerGram');
        if (priceField) {
            priceField.value = 'Calculando...';
        }

        // Obtener precio del metal
        const karats = metalType === 'oro' ? goldKarats : null;
        const pricePerGram = await priceCalculator.getMetalPrice(metalType, karats);
        const totalCost = pricePerGram * metalWeight;

        // Actualizar campos
        updateMetalPriceFields(pricePerGram, totalCost);
        updateResultField('resultMetalCost', totalCost);

        // Guardar en proyecto
        calculatorProject.metal = {
            type: metalType,
            karats: karats,
            weight: metalWeight,
            pricePerGram: pricePerGram,
            totalCost: totalCost
        };

        calculateTotals();

    } catch (error) {
        console.error('Error calculando precio de metal:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular precio del metal', 'error');
        }
    } finally {
        isCalculating = false;
    }
}

async function calculateDiamondPrice() {
    if (isCalculating) return;
    isCalculating = true;

    try {
        const carats = parseFloat(document.getElementById('diamondCarats')?.value || 0);
        const clarity = document.getElementById('diamondClarity')?.value;
        const color = document.getElementById('diamondColor')?.value;
        const cut = document.getElementById('diamondCut')?.value;
        const quantity = parseInt(document.getElementById('diamondQuantity')?.value || 0);

        if (carats <= 0 || !clarity || !color || !cut || quantity <= 0) {
            updateResultField('resultDiamondCost', 0);
            document.getElementById('diamondTotalCost').value = '';
            calculateTotals();
            return;
        }

        const result = priceCalculator.calculateDiamondPrice(carats, clarity, color, cut, quantity);
        
        // Actualizar campo de total
        const totalField = document.getElementById('diamondTotalCost');
        if (totalField) {
            totalField.value = window.utils?.formatCurrency(result.totalPrice) || 
                              `$${result.totalPrice.toLocaleString('es-MX')}`;
        }

        updateResultField('resultDiamondCost', result.totalPrice);

        // Guardar en proyecto
        calculatorProject.diamonds = {
            carats: carats,
            clarity: clarity,
            color: color,
            cut: cut,
            quantity: quantity,
            pricePerCarat: result.pricePerCarat,
            totalCost: result.totalPrice
        };

        calculateTotals();

    } catch (error) {
        console.error('Error calculando precio de diamantes:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular precio de diamantes', 'error');
        }
    } finally {
        isCalculating = false;
    }
}

async function calculateGemstonePrice() {
    if (isCalculating) return;
    isCalculating = true;

    try {
        const type = document.getElementById('gemstoneType')?.value;
        const carats = parseFloat(document.getElementById('gemstoneCarats')?.value || 0);
        const quality = document.getElementById('gemstoneQuality')?.value;

        if (!type || carats <= 0 || !quality) {
            updateGemstoneFields(0, 0);
            updateResultField('resultGemstoneCost', 0);
            calculateTotals();
            return;
        }

        const result = priceCalculator.calculateGemstonePriceRange(type, carats, quality);
        
        updateGemstoneFields(result.pricePerCarat, result.totalPrice);
        updateResultField('resultGemstoneCost', result.totalPrice);

        // Guardar en proyecto
        calculatorProject.gemstones = {
            type: type,
            carats: carats,
            quality: quality,
            pricePerCarat: result.pricePerCarat,
            totalCost: result.totalPrice,
            range: result.range
        };

        calculateTotals();

    } catch (error) {
        console.error('Error calculando precio de piedras preciosas:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular precio de piedras preciosas', 'error');
        }
    } finally {
        isCalculating = false;
    }
}

function calculateTotals() {
    try {
        // Obtener valores actuales
        const metalCost = parseFloat(document.getElementById('metalTotalCost')?.value || 0);
        const diamondCost = parseFloat(document.getElementById('diamondTotalCost')?.value?.replace(/[^0-9.-]+/g, '') || 0);
        const gemstoneCost = parseFloat(document.getElementById('gemstoneTotalCost')?.value?.replace(/[^0-9.-]+/g, '') || 0);
        
        const laborHours = parseFloat(document.getElementById('laborHours')?.value || 0);
        const laborRate = parseFloat(document.getElementById('laborRate')?.value || 0);
        const profitMargin = parseFloat(document.getElementById('profitMargin')?.value || 0);
        const additionalCosts = parseFloat(document.getElementById('additionalCosts')?.value || 0);

        // Calcular costo de mano de obra
        const laborCost = laborHours * laborRate;
        
        // Actualizar campo de mano de obra
        const laborCostField = document.getElementById('laborCost');
        if (laborCostField) {
            laborCostField.value = laborCost.toFixed(2);
        }

        // Calcular subtotal
        const subtotal = metalCost + diamondCost + gemstoneCost + laborCost + additionalCosts;

        // Calcular margen de ganancia
        const profitAmount = (subtotal * profitMargin) / 100;

        // Calcular precio final
        const finalPrice = subtotal + profitAmount;

        // Actualizar campos de resultados
        updateResultField('resultMetalCost', metalCost);
        updateResultField('resultDiamondCost', diamondCost);
        updateResultField('resultGemstoneCost', gemstoneCost);
        updateResultField('resultLaborCost', laborCost);
        updateResultField('resultAdditionalCosts', additionalCosts);
        updateResultField('resultSubtotal', subtotal);
        updateResultField('resultProfitAmount', profitAmount);
        updateResultField('resultFinalPrice', finalPrice);

        // Actualizar porcentaje de ganancia mostrado
        const profitPercentageSpan = document.getElementById('resultProfitPercentage');
        if (profitPercentageSpan) {
            profitPercentageSpan.textContent = profitMargin;
        }

        // Guardar en proyecto
        calculatorProject.labor = {
            hours: laborHours,
            rate: laborRate,
            cost: laborCost
        };

        calculatorProject.costs = {
            additional: additionalCosts,
            profitMargin: profitMargin,
            profitAmount: profitAmount
        };

        calculatorProject.totals = {
            metalCost: metalCost,
            diamondCost: diamondCost,
            gemstoneCost: gemstoneCost,
            laborCost: laborCost,
            additionalCosts: additionalCosts,
            subtotal: subtotal,
            profitAmount: profitAmount,
            finalPrice: finalPrice
        };

        // Auto-guardar proyecto
        autoSaveProject();

    } catch (error) {
        console.error('Error calculando totales:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular totales', 'error');
        }
    }
}

// =================================================================
// FUNCIONES DE UI
// =================================================================

function updateMetalPriceFields(pricePerGram, totalCost) {
    const priceField = document.getElementById('metalPricePerGram');
    const totalField = document.getElementById('metalTotalCost');

    if (priceField) {
        priceField.value = pricePerGram > 0 ? pricePerGram.toFixed(2) : '';
    }

    if (totalField) {
        totalField.value = totalCost > 0 ? totalCost.toFixed(2) : '';
    }
}

function updateGemstoneFields(pricePerCarat, totalCost) {
    const priceField = document.getElementById('gemstonePricePerCarat');
    const totalField = document.getElementById('gemstoneTotalCost');

    if (priceField) {
        priceField.value = pricePerCarat > 0 ? pricePerCarat.toFixed(2) : '';
    }

    if (totalField) {
        totalField.value = totalCost > 0 ? 
            (window.utils?.formatCurrency(totalCost) || `$${totalCost.toLocaleString('es-MX')}`) : '';
    }
}

function updateResultField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formattedValue = value > 0 ? 
            (window.utils?.formatCurrency(value) || `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`) : 
            '$0.00';
        field.textContent = formattedValue;
    }
}

function setupCollapsibleSections() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        const collapseBtn = header.querySelector('.collapse-btn');
        const content = header.parentNode.querySelector('.collapsible-content');
        
        if (collapseBtn && content) {
            collapseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                collapseBtn.textContent = isCollapsed ? '−' : '+';
            });
        }
    });
}

// =================================================================
// GESTIÓN DE PROYECTOS
// =================================================================

function autoSaveProject() {
    try {
        const autoSaveData = {
            project: calculatorProject,
            timestamp: new Date().toISOString(),
            formData: getFormData()
        };
        
        localStorage.setItem('calculator_autosave', JSON.stringify(autoSaveData));
        console.log('💾 Auto-guardado completado');
    } catch (error) {
        console.error('Error en auto-guardado:', error);
    }
}

function restoreAutoSavedProject() {
    try {
        const autoSaved = localStorage.getItem('calculator_autosave');
        if (!autoSaved) return false;

        const { project, timestamp, formData } = JSON.parse(autoSaved);
        
        // Verificar que no sea muy antiguo (máximo 24 horas)
        const age = Date.now() - new Date(timestamp).getTime();
        if (age > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('calculator_autosave');
            return false;
        }

        const timeAgo = window.utils?.getTimeAgo(timestamp) || 'hace un tiempo';
        
        if (confirm(`Se encontró un proyecto guardado de ${timeAgo}. ¿Desea restaurarlo?`)) {
            calculatorProject = project;
            fillFormWithProject(formData);
            localStorage.removeItem('calculator_autosave');
            
            // Recalcular después de restaurar
            setTimeout(() => {
                calculateMetalPrice();
                calculateDiamondPrice();
                calculateGemstonePrice();
            }, 100);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error restaurando auto-guardado:', error);
        return false;
    }
}

function getFormData() {
    const formData = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.id && input.value) {
            formData[input.id] = input.value;
        }
    });
    
    return formData;
}

function fillFormWithProject(formData) {
    Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = formData[key];
            
            // Trigger events para elementos especiales
            if (key === 'metalType') {
                element.dispatchEvent(new Event('change'));
            }
        }
    });
}

function showSaveProjectModal() {
    const modal = document.getElementById('saveProjectModal');
    const nameInput = document.getElementById('saveProjectName');
    
    if (modal && nameInput) {
        nameInput.value = calculatorProject.name || 
                         `Proyecto ${new Date().toLocaleDateString('es-MX')}`;
        modal.style.display = 'block';
        nameInput.focus();
    }
}

function saveProject() {
    try {
        const name = document.getElementById('saveProjectName')?.value;
        const notes = document.getElementById('saveProjectNotes')?.value;
        
        if (!name) {
            if (window.utils) {
                window.utils.showNotification('El nombre del proyecto es requerido', 'warning');
            }
            return;
        }

        // Crear proyecto completo
        const projectToSave = {
            ...calculatorProject,
            id: calculatorProject.id || window.utils?.generateUUID() || Date.now().toString(),
            name: name,
            notes: notes,
            savedAt: new Date().toISOString(),
            formData: getFormData()
        };

        // Buscar si ya existe
        const existingIndex = calculatorHistory.findIndex(p => p.id === projectToSave.id);
        
        if (existingIndex >= 0) {
            calculatorHistory[existingIndex] = projectToSave;
        } else {
            calculatorHistory.unshift(projectToSave);
        }

        // Guardar historial
        saveCalculatorHistory();

        // Cerrar modal
        const modal = document.getElementById('saveProjectModal');
        if (modal) {
            modal.style.display = 'none';
        }

        if (window.utils) {
            window.utils.showNotification('Proyecto guardado exitosamente', 'success');
        }

        // Actualizar proyecto actual
        calculatorProject.id = projectToSave.id;

    } catch (error) {
        console.error('Error guardando proyecto:', error);
        if (window.utils) {
            window.utils.showNotification('Error al guardar el proyecto', 'error');
        }
    }
}

function loadProject(projectId) {
    try {
        const project = calculatorHistory.find(p => p.id === projectId);
        if (!project) {
            if (window.utils) {
                window.utils.showNotification('Proyecto no encontrado', 'error');
            }
            return;
        }

        // Cargar proyecto
        calculatorProject = { ...project };
        
        // Llenar formulario
        if (project.formData) {
            fillFormWithProject(project.formData);
        }

        // Recalcular precios
        setTimeout(() => {
            calculateMetalPrice();
            calculateDiamondPrice();
            calculateGemstonePrice();
        }, 100);

        if (window.utils) {
            window.utils.showNotification(`Proyecto "${project.name}" cargado exitosamente`, 'success');
        }

    } catch (error) {
        console.error('Error cargando proyecto:', error);
        if (window.utils) {
            window.utils.showNotification('Error al cargar el proyecto', 'error');
        }
    }
}

// =================================================================
// EXPORTACIÓN A OTROS MÓDULOS
// =================================================================

function showCreateDocumentModal(documentType) {
    if (!validateCalculatorData()) {
        if (window.utils) {
            window.utils.showNotification('Complete al menos un elemento para crear el documento', 'warning');
        }
        return;
    }

    const modal = document.getElementById('createDocumentModal');
    const title = document.getElementById('createDocumentTitle');
    const typeSpan = document.getElementById('documentType');
    
    if (modal && title && typeSpan) {
        const docTypeText = documentType === 'quotation' ? 'cotización' : 'recibo';
        title.textContent = `Crear ${docTypeText.charAt(0).toUpperCase() + docTypeText.slice(1)}`;
        typeSpan.textContent = docTypeText;
        
        // Pre-llenar con datos del cliente si existen
        const clientNameInput = document.getElementById('documentClientName');
        const clientPhoneInput = document.getElementById('documentClientPhone');
        
        if (clientNameInput) {
            clientNameInput.value = calculatorProject.clientReference || '';
        }
        
        modal.setAttribute('data-document-type', documentType);
        modal.style.display = 'block';
    }
}

function createDocumentFromCalculator() {
    try {
        const modal = document.getElementById('createDocumentModal');
        const documentType = modal?.getAttribute('data-document-type');
        const clientName = document.getElementById('documentClientName')?.value;
        const clientPhone = document.getElementById('documentClientPhone')?.value;

        if (!clientName) {
            if (window.utils) {
                window.utils.showNotification('El nombre del cliente es requerido', 'warning');
            }
            return;
        }

        // Preparar datos para transferencia
        const transferData = {
            source: 'calculator',
            timestamp: new Date().toISOString(),
            project: calculatorProject,
            client: {
                name: clientName,
                phone: clientPhone
            },
            items: buildItemsFromCalculation(),
            totals: calculatorProject.totals
        };

        // Guardar datos para transferencia
        localStorage.setItem('document_transfer_data', JSON.stringify(transferData));

        // Navegar al módulo correspondiente
        const targetPage = documentType === 'quotation' ? 'quotation-mode.html' : 'receipt-mode.html';
        
        if (window.utils) {
            window.utils.showNotification(`Redirigiendo a crear ${documentType === 'quotation' ? 'cotización' : 'recibo'}...`, 'info');
        }

        // Cerrar modal
        modal.style.display = 'none';

        // Navegar
        setTimeout(() => {
            window.location.href = targetPage;
        }, 1000);

    } catch (error) {
        console.error('Error creando documento:', error);
        if (window.utils) {
            window.utils.showNotification('Error al crear el documento', 'error');
        }
    }
}

function buildItemsFromCalculation() {
    const items = [];
    
    // Agregar metales si hay
    if (calculatorProject.metal?.totalCost > 0) {
        items.push({
            description: `Metal: ${calculatorProject.metal.type}${calculatorProject.metal.karats ? ' ' + calculatorProject.metal.karats : ''} (${calculatorProject.metal.weight}g)`,
            quantity: 1,
            unitPrice: calculatorProject.metal.totalCost,
            total: calculatorProject.metal.totalCost
        });
    }

    // Agregar diamantes si hay
    if (calculatorProject.diamonds?.totalCost > 0) {
        items.push({
            description: `Diamantes: ${calculatorProject.diamonds.carats}ct ${calculatorProject.diamonds.clarity} ${calculatorProject.diamonds.color} ${calculatorProject.diamonds.cut}`,
            quantity: calculatorProject.diamonds.quantity,
            unitPrice: calculatorProject.diamonds.totalCost / calculatorProject.diamonds.quantity,
            total: calculatorProject.diamonds.totalCost
        });
    }

    // Agregar piedras preciosas si hay
    if (calculatorProject.gemstones?.totalCost > 0) {
        items.push({
            description: `${calculatorProject.gemstones.type}: ${calculatorProject.gemstones.carats}ct ${calculatorProject.gemstones.quality}`,
            quantity: 1,
            unitPrice: calculatorProject.gemstones.totalCost,
            total: calculatorProject.gemstones.totalCost
        });
    }

    // Agregar mano de obra si hay
    if (calculatorProject.labor?.cost > 0) {
        items.push({
            description: `Mano de obra: ${calculatorProject.labor.hours}h @ $${calculatorProject.labor.rate}/h`,
            quantity: 1,
            unitPrice: calculatorProject.labor.cost,
            total: calculatorProject.labor.cost
        });
    }

    // Agregar costos adicionales si hay
    if (calculatorProject.costs?.additional > 0) {
        items.push({
            description: 'Costos adicionales',
            quantity: 1,
            unitPrice: calculatorProject.costs.additional,
            total: calculatorProject.costs.additional
        });
    }

    return items;
}

function validateCalculatorData() {
    const totals = calculatorProject.totals;
    return totals && (
        totals.metalCost > 0 || 
        totals.diamondCost > 0 || 
        totals.gemstoneCost > 0 || 
        totals.laborCost > 0
    );
}

// =================================================================
// OTRAS FUNCIONES
// =================================================================

function printCalculation() {
    try {
        if (!validateCalculatorData()) {
            if (window.utils) {
                window.utils.showNotification('No hay datos para imprimir', 'warning');
            }
            return;
        }

        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
    } catch (error) {
        console.error('Error imprimiendo cálculo:', error);
        if (window.utils) {
            window.utils.showNotification('Error al imprimir', 'error');
        }
    }
}

function generatePrintContent() {
    const project = calculatorProject;
    const totals = project.totals || {};
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cálculo de Precio - ${project.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { max-width: 200px; }
                .project-info { margin-bottom: 20px; }
                .calculations { margin-bottom: 20px; }
                .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
                .section { margin-bottom: 15px; padding: 10px; border-left: 3px solid #ccc; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .currency { text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${CALCULATOR_CONFIG.companyInfo?.logo || ''}" alt="ciaociao.mx" class="logo">
                <h1>CÁLCULO DE PRECIO</h1>
            </div>
            
            <div class="project-info">
                <h3>Información del Proyecto</h3>
                <p><strong>Nombre:</strong> ${project.name || 'Sin nombre'}</p>
                <p><strong>Fecha:</strong> ${new Date(project.date).toLocaleDateString('es-MX')}</p>
                <p><strong>Cliente/Referencia:</strong> ${project.clientReference || 'N/A'}</p>
            </div>
            
            <div class="calculations">
                <h3>Desglose de Costos</h3>
                <table>
                    <tr>
                        <td>Costo de Metales:</td>
                        <td class="currency">$${(totals.metalCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td>Costo de Diamantes:</td>
                        <td class="currency">$${(totals.diamondCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td>Costo de Piedras:</td>
                        <td class="currency">$${(totals.gemstoneCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td>Mano de Obra:</td>
                        <td class="currency">$${(totals.laborCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td>Costos Adicionales:</td>
                        <td class="currency">$${(totals.additionalCosts || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td>Subtotal:</td>
                        <td class="currency">$${(totals.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td>Margen de Ganancia (${project.costs?.profitMargin || 0}%):</td>
                        <td class="currency">$${(totals.profitAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="total">
                        <td>PRECIO FINAL:</td>
                        <td class="currency">$${(totals.finalPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>
            
            ${project.observations ? `
            <div class="observations">
                <h3>Observaciones</h3>
                <p>${project.observations}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 40px; text-align: center; font-size: 0.9em; color: #666;">
                <p>Generado el ${new Date().toLocaleString('es-MX')} por ciaociao.mx</p>
            </div>
        </body>
        </html>
    `;
}

function resetCalculator() {
    if (confirm('¿Está seguro de limpiar toda la calculadora? Los cambios no guardados se perderán.')) {
        try {
            // Limpiar proyecto actual
            calculatorProject = {
                id: null,
                name: '',
                date: new Date().toISOString().split('T')[0],
                clientReference: '',
                metal: {},
                diamonds: {},
                gemstones: {},
                labor: {},
                costs: {},
                totals: {},
                observations: ''
            };

            // Limpiar formulario
            const form = document.getElementById('calculatorForm');
            if (form) {
                form.reset();
            }

            // Restaurar fecha actual
            setCalculatorDate();

            // Ocultar quilates de oro
            const goldKaratsGroup = document.getElementById('goldKaratsGroup');
            if (goldKaratsGroup) {
                goldKaratsGroup.style.display = 'none';
            }

            // Limpiar campos calculados
            const calculatedFields = [
                'metalPricePerGram', 'metalTotalCost', 'diamondTotalCost', 
                'gemstonePricePerCarat', 'gemstoneTotalCost', 'laborCost'
            ];
            
            calculatedFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                }
            });

            // Limpiar resultados
            const resultFields = [
                'resultMetalCost', 'resultDiamondCost', 'resultGemstoneCost',
                'resultLaborCost', 'resultAdditionalCosts', 'resultSubtotal',
                'resultProfitAmount', 'resultFinalPrice'
            ];

            resultFields.forEach(fieldId => {
                updateResultField(fieldId, 0);
            });

            // Limpiar auto-guardado
            localStorage.removeItem('calculator_autosave');

            if (window.utils) {
                window.utils.showNotification('Calculadora limpiada exitosamente', 'success');
            }

        } catch (error) {
            console.error('Error limpiando calculadora:', error);
            if (window.utils) {
                window.utils.showNotification('Error al limpiar la calculadora', 'error');
            }
        }
    }
}

// =================================================================
// MODALES
// =================================================================

function setupCalculatorModals() {
    // Modal de guardar proyecto
    const saveProjectModal = document.getElementById('saveProjectModal');
    const confirmSaveBtn = document.getElementById('confirmSaveProject');
    const cancelSaveBtn = document.getElementById('cancelSaveProject');

    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', saveProject);
    }

    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', () => {
            if (saveProjectModal) saveProjectModal.style.display = 'none';
        });
    }

    // Modal de crear documento
    const createDocumentModal = document.getElementById('createDocumentModal');
    const confirmCreateBtn = document.getElementById('confirmCreateDocument');
    const cancelCreateBtn = document.getElementById('cancelCreateDocument');

    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', createDocumentFromCalculator);
    }

    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            if (createDocumentModal) createDocumentModal.style.display = 'none';
        });
    }

    // Cerrar modales con X
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// =================================================================
// UTILIDADES
// =================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =================================================================
// EXPORTAR FUNCIONES GLOBALES
// =================================================================

// Hacer funciones disponibles globalmente para otros módulos
window.calculatorSystem = {
    calculateMetalPrice,
    calculateDiamondPrice,
    calculateGemstonePrice,
    calculateTotals,
    saveProject,
    loadProject,
    resetCalculator,
    printCalculation,
    getProjectData: () => calculatorProject,
    getProjectHistory: () => calculatorHistory
};

console.log('✅ Sistema de Calculadora de Precios v1.0 inicializado correctamente');