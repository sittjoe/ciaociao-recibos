// calculator-system.js - CALCULADORA LIMPIA CON PRICING MASTER v5.0
// Sistema integrado con pricing-master.js únicamente
// =================================================================

console.log('🧮 Iniciando Calculadora Limpia v5.0...');

// =================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =================================================================

const CALCULATOR_CONFIG = {
    storageKey: 'calculator_projects_ciaociao',
    maxProjects: 100,
    priceCache: 'calculator_price_cache',
    cacheExpiry: 5 * 60 * 1000, // 5 minutos en ms
    debounceDelay: 500,
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
// CLASE SIMPLE DE CALCULADORA CON PRICING MASTER
// =================================================================

class PriceCalculator {
    constructor() {
        this.cache = this.loadCache();
        this.exchangeRate = CALCULATOR_CONFIG.exchangeRate;
        console.log('💎 Calculadora inicializada con PricingMaster');
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
        console.log(`💰 Obteniendo precio de ${metalType} ${karats || ''} desde PricingMaster...`);
        
        try {
            // 🚀 INTEGRACIÓN SIMPLE CON PRICING MASTER
            
            // Normalizar el tipo de metal
            const metalName = metalType.toLowerCase() === 'oro' ? 'gold' : 
                            metalType.toLowerCase() === 'plata' ? 'silver' : 
                            metalType.toLowerCase() === 'platino' ? 'platinum' : 
                            metalType.toLowerCase() === 'paladio' ? 'palladium' : metalType.toLowerCase();
            
            // Intentar obtener precio del PricingMaster (prioridad por gramo)
            if (window.pricingMaster && window.pricingMaster.isInitialized) {
                const priceData = await window.pricingMaster.getPriceForCalculator(metalName, karats, 1);
                
                if (priceData && priceData.price_per_gram_mxn) {
                    console.log(`✅ Precio obtenido de PricingMaster: $${priceData.price_per_gram_mxn.toFixed(2)} MXN/g`);
                    console.log(`   Fuente: ${priceData.source}`);
                    
                    // Actualizar tipo de cambio local
                    if (priceData.exchange_rate) {
                        this.exchangeRate = priceData.exchange_rate;
                    }
                    
                    return priceData.price_per_gram_mxn;
                }
            }
            
            // FALLBACK: Usar API simple si está disponible
            if (window.getPrice) {
                console.log(`🔄 Usando API simple como fallback...`);
                
                const priceData = await window.getPrice(metalName, karats, 1);
                
                if (priceData && priceData.price_per_gram_mxn) {
                    console.log(`✅ Precio obtenido via API simple: $${priceData.price_per_gram_mxn.toFixed(2)} MXN/g`);
                    return priceData.price_per_gram_mxn;
                }
            }
            
            // ÚLTIMO RECURSO: Precios de emergencia hardcodeados
            console.warn(`⚠️ Usando precios de emergencia para ${metalType} ${karats}`);
            
            const emergencyPrices = {
                'gold': { 
                    '24k': 1600, '22k': 1467, '18k': 1200, '14k': 933, '10k': 667 
                },
                'silver': { 
                    '999': 23, '925': 21, '900': 21, '800': 18 
                },
                'platinum': { 
                    '999': 610, '950': 580, '900': 550, '850': 520 
                },
                'palladium': { 
                    '999': 520, '950': 494, '900': 468 
                }
            };
            
            if (emergencyPrices[metalName] && emergencyPrices[metalName][karats]) {
                const pricePerGram = emergencyPrices[metalName][karats];
                console.log(`🚨 Precio de emergencia: $${pricePerGram} MXN/g`);
                return pricePerGram;
            }
            
            throw new Error(`No se pudo determinar el precio para ${metalType} ${karats}`);

        } catch (error) {
            console.error(`❌ Error obteniendo precio de ${metalType}:`, error);
            throw error;
        }
    }

    // Métodos simplificados para diamantes y gemas
    calculateDiamondPrice(carats, clarity, color, cut, quantity) {
        const diamondPricing = {
            FL: { base: 8000, multiplier: 1.5 },
            IF: { base: 7500, multiplier: 1.4 },
            VVS1: { base: 6500, multiplier: 1.3 },
            VVS2: { base: 6000, multiplier: 1.25 },
            VS1: { base: 5000, multiplier: 1.2 },
            VS2: { base: 4500, multiplier: 1.15 },
            SI1: { base: 3500, multiplier: 1.1 },
            SI2: { base: 2800, multiplier: 1.05 },
            I1: { base: 2000, multiplier: 1.0 }
        };

        const colorFactors = {
            D: 1.3, E: 1.25, F: 1.2, G: 1.15, H: 1.1, I: 1.0, J: 0.95, K: 0.9, L: 0.85, M: 0.8
        };

        const cutFactors = {
            excellent: 1.2, 'very-good': 1.1, good: 1.0, fair: 0.9, poor: 0.8
        };

        const basePrice = diamondPricing[clarity]?.base || 2000;
        const multiplier = diamondPricing[clarity]?.multiplier || 1.0;
        const colorFactor = colorFactors[color] || 1.0;
        const cutFactor = cutFactors[cut] || 1.0;

        const pricePerCarat = basePrice * multiplier * colorFactor * cutFactor;
        const totalPrice = pricePerCarat * carats * quantity * this.exchangeRate;

        return {
            pricePerCarat: pricePerCarat,
            totalPrice: totalPrice,
            factors: { clarity: multiplier, color: colorFactor, cut: cutFactor }
        };
    }

    calculateGemstonePrice(gemType, carats, quality, quantity) {
        const gemstoneRanges = {
            ruby: { low: 200, medium: 800, high: 2000, premium: 5000 },
            emerald: { low: 300, medium: 1200, high: 3000, premium: 8000 },
            sapphire: { low: 150, medium: 600, high: 1500, premium: 4000 }
        };

        const qualityPrices = gemstoneRanges[gemType?.toLowerCase()] || { low: 100, medium: 500, high: 1000, premium: 2000 };
        const pricePerCarat = qualityPrices[quality] || qualityPrices.medium;
        const totalPrice = pricePerCarat * carats * quantity * this.exchangeRate;

        return {
            pricePerCarat: pricePerCarat,
            totalPrice: totalPrice,
            quality: quality
        };
    }
}

// =================================================================
// FUNCIONES DE CÁLCULO PRINCIPALES
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

        // Obtener precio del metal desde el panel de precios o API
        const karats = metalType === 'oro' ? goldKarats : null;
        let pricePerGram;
        
        // Verificar si hay precio manual en el dashboard
        if (window.priceDashboard) {
            pricePerGram = window.priceDashboard.getCurrentPrice(metalType, karats);
        } else {
            pricePerGram = await priceCalculator.getMetalPrice(metalType, karats);
        }
        
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
        console.error('Error calculando precio de diamante:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular precio del diamante', 'error');
        }
    } finally {
        isCalculating = false;
    }
}

async function calculateGemstonePrice() {
    if (isCalculating) return;
    isCalculating = true;

    try {
        const gemType = document.getElementById('gemstoneType')?.value;
        const carats = parseFloat(document.getElementById('gemstoneCarats')?.value || 0);
        const quality = document.getElementById('gemstoneQuality')?.value;
        const quantity = parseInt(document.getElementById('gemstoneQuantity')?.value || 0);

        if (!gemType || carats <= 0 || !quality || quantity <= 0) {
            updateResultField('resultGemstoneCost', 0);
            document.getElementById('gemstoneTotalCost').value = '';
            calculateTotals();
            return;
        }

        const result = priceCalculator.calculateGemstonePrice(gemType, carats, quality, quantity);
        
        // Actualizar campo de total
        const totalField = document.getElementById('gemstoneTotalCost');
        if (totalField) {
            totalField.value = window.utils?.formatCurrency(result.totalPrice) || 
                              `$${result.totalPrice.toLocaleString('es-MX')}`;
        }

        updateResultField('resultGemstoneCost', result.totalPrice);

        // Guardar en proyecto
        calculatorProject.gemstones = {
            type: gemType,
            carats: carats,
            quality: quality,
            quantity: quantity,
            pricePerCarat: result.pricePerCarat,
            totalCost: result.totalPrice
        };

        calculateTotals();

    } catch (error) {
        console.error('Error calculando precio de gema:', error);
        if (window.utils) {
            window.utils.showNotification('Error al calcular precio de la gema', 'error');
        }
    } finally {
        isCalculating = false;
    }
}

// =================================================================
// FUNCIONES DE UTILIDAD
// =================================================================

function updateMetalPriceFields(pricePerGram, totalCost) {
    const priceField = document.getElementById('metalPricePerGram');
    const costField = document.getElementById('metalTotalCost');
    
    if (priceField) {
        priceField.value = window.utils?.formatCurrency(pricePerGram) || 
                          `$${pricePerGram.toLocaleString('es-MX')}`;
    }
    
    if (costField) {
        costField.value = window.utils?.formatCurrency(totalCost) || 
                         `$${totalCost.toLocaleString('es-MX')}`;
    }
}

function updateResultField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.textContent = window.utils?.formatCurrency(value) || 
                           `$${value.toLocaleString('es-MX')}`;
    }
}

function calculateTotals() {
    const metalCost = calculatorProject.metal?.totalCost || 0;
    const diamondCost = calculatorProject.diamonds?.totalCost || 0;
    const gemstoneCost = calculatorProject.gemstones?.totalCost || 0;
    const laborCost = calculatorProject.labor?.totalCost || 0;
    
    const subtotal = metalCost + diamondCost + gemstoneCost + laborCost;
    
    // Actualizar campos de totales
    updateResultField('resultSubtotal', subtotal);
    
    calculatorProject.totals = {
        metalCost: metalCost,
        diamondCost: diamondCost,
        gemstoneCost: gemstoneCost,
        laborCost: laborCost,
        subtotal: subtotal
    };
}

// Función debounce para optimizar rendimiento
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
// INICIALIZACIÓN Y EVENT LISTENERS
// =================================================================

function setupCalculatorEventListeners() {
    console.log('🔧 Configurando event listeners de calculadora...');

    // === METALES ===
    const metalType = document.getElementById('metalType');
    const goldKarats = document.getElementById('goldKarats');
    const metalWeight = document.getElementById('metalWeight');

    if (metalType) {
        metalType.addEventListener('change', () => {
            const karatsContainer = document.getElementById('goldKaratsContainer');
            if (karatsContainer) {
                karatsContainer.style.display = metalType.value === 'oro' ? 'block' : 'none';
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
    const diamondInputs = ['diamondCarats', 'diamondClarity', 'diamondColor', 'diamondCut', 'diamondQuantity'];
    diamondInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', calculateDiamondPrice);
        }
    });

    // === GEMAS ===
    const gemstoneInputs = ['gemstoneType', 'gemstoneCarats', 'gemstoneQuality', 'gemstoneQuantity'];
    gemstoneInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', calculateGemstonePrice);
        }
    });

    console.log('✅ Event listeners configurados');
}

function initializeCalculatorSystem() {
    console.log('🚀 Inicializando sistema de calculadora...');
    
    // Crear instancia de calculadora
    priceCalculator = new PriceCalculator();
    
    // Configurar event listeners
    setupCalculatorEventListeners();
    
    // Configurar control manual de oro
    setupGoldManualControl();
    
    // Establecer fecha actual
    const dateField = document.getElementById('calculatorDate');
    if (dateField && !dateField.value) {
        dateField.value = new Date().toISOString().split('T')[0];
    }
    
    console.log('✅ Sistema de calculadora inicializado');
}

// =================================================================
// SISTEMA DE CÁLCULO MANUAL DE ORO 24K
// =================================================================

/**
 * Calcular todos los quilates basado en precio de oro 24k
 * @param {number} price24k - Precio del oro 24k en MXN/gramo
 * @returns {object} - Objeto con precios calculados para todos los quilates
 */
function calculateAllKaratsFromGold24k(price24k) {
    console.log(`🧮 Calculando quilates desde oro 24k: $${price24k} MXN/gramo`);
    
    // Fórmulas de pureza del oro (estándar de la industria)
    const karatPurities = {
        '24k': 1.000,   // 100.0% oro puro
        '22k': 0.917,   // 91.7% oro (oro de moneda)
        '18k': 0.750,   // 75.0% oro (joyería fina)
        '14k': 0.583,   // 58.3% oro (estándar americano)
        '10k': 0.417    // 41.7% oro (mínimo legal USA/México)
    };
    
    const calculatedPrices = {};
    
    Object.entries(karatPurities).forEach(([karat, purity]) => {
        const calculatedPrice = price24k * purity;
        calculatedPrices[karat] = {
            price: Math.round(calculatedPrice * 100) / 100, // Redondear a 2 decimales
            purity: purity,
            percentage: (purity * 100).toFixed(1) + '%'
        };
        
        console.log(`  ${karat}: $${calculatedPrices[karat].price} MXN/g (${calculatedPrices[karat].percentage})`);
    });
    
    return calculatedPrices;
}

/**
 * Aplicar precios calculados a los campos de la calculadora
 * @param {object} calculatedPrices - Precios calculados por quilate
 */
function applyCalculatedPricesToInputs(calculatedPrices) {
    console.log('📊 Aplicando precios calculados a los campos...');
    
    // Mapeo de quilates a IDs de campos
    const karatFieldMapping = {
        '24k': 'priceGold24k',
        '22k': 'priceGold22k', 
        '18k': 'priceGold18k',
        '14k': 'priceGold14k',
        '10k': 'priceGold10k'
    };
    
    let appliedCount = 0;
    
    Object.entries(karatFieldMapping).forEach(([karat, fieldId]) => {
        const field = document.getElementById(fieldId);
        if (field && calculatedPrices[karat]) {
            field.value = calculatedPrices[karat].price;
            
            // Añadir efecto visual de actualización
            field.style.background = '#d4edda'; // Verde claro
            setTimeout(() => {
                field.style.background = '';
            }, 1000);
            
            appliedCount++;
            console.log(`  ✅ ${karat}: $${calculatedPrices[karat].price} → ${fieldId}`);
        }
    });
    
    console.log(`✅ ${appliedCount} precios aplicados a la calculadora`);
    
    // Mostrar notificación de éxito
    if (window.utils && window.utils.showNotification) {
        window.utils.showNotification(
            `Precios de oro actualizados: ${appliedCount} quilates`, 
            'success', 
            3000
        );
    }
}

/**
 * Configurar event listeners para el control manual de oro
 */
function setupGoldManualControl() {
    console.log('🎯 Configurando control manual de oro...');
    
    const manual24kInput = document.getElementById('manual24kPrice');
    const calculateBtn = document.getElementById('calculateAllKarats');
    const applyBtn = document.getElementById('applyCalculatedPrices');
    
    let currentCalculatedPrices = null;
    
    if (manual24kInput && calculateBtn) {
        // Event listener para cálculo automático
        calculateBtn.addEventListener('click', () => {
            const price24k = parseFloat(manual24kInput.value);
            
            if (!price24k || price24k <= 0) {
                alert('Por favor ingrese un precio válido para oro 24k');
                manual24kInput.focus();
                return;
            }
            
            // Calcular todos los quilates
            currentCalculatedPrices = calculateAllKaratsFromGold24k(price24k);
            
            // Mostrar resultados en la interfaz
            displayCalculatedResults(currentCalculatedPrices);
            
            // Mostrar botón de aplicar
            if (applyBtn) {
                applyBtn.style.display = 'block';
            }
        });
        
        // Event listener para aplicar precios
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (currentCalculatedPrices) {
                    applyCalculatedPricesToInputs(currentCalculatedPrices);
                    applyBtn.style.display = 'none';
                } else {
                    alert('Primero calcule los precios usando el botón "🧮 Calcular Todos"');
                }
            });
        }
        
        // Cálculo automático mientras escribe (debounced)
        let debounceTimer;
        manual24kInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const price24k = parseFloat(manual24kInput.value);
                if (price24k && price24k > 0) {
                    currentCalculatedPrices = calculateAllKaratsFromGold24k(price24k);
                    displayCalculatedResults(currentCalculatedPrices);
                    if (applyBtn) {
                        applyBtn.style.display = 'block';
                    }
                }
            }, 500); // 500ms delay
        });
        
        console.log('✅ Control manual de oro configurado');
    } else {
        console.warn('⚠️ Elementos del control manual no encontrados');
    }
}

/**
 * Mostrar resultados calculados en la interfaz
 * @param {object} calculatedPrices - Precios calculados
 */
function displayCalculatedResults(calculatedPrices) {
    const resultElements = {
        'calc24k': '24k',
        'calc22k': '22k', 
        'calc18k': '18k',
        'calc14k': '14k',
        'calc10k': '10k'
    };
    
    Object.entries(resultElements).forEach(([elementId, karat]) => {
        const element = document.getElementById(elementId);
        if (element && calculatedPrices[karat]) {
            const price = calculatedPrices[karat].price;
            const percentage = calculatedPrices[karat].percentage;
            element.textContent = `$${price.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            element.title = `${percentage} de pureza`;
            
            // Añadir animación de actualización
            element.style.color = '#28a745';
            element.style.fontWeight = 'bold';
            setTimeout(() => {
                element.style.color = '';
                element.style.fontWeight = '';
            }, 1500);
        }
    });
}

// =================================================================
// INICIALIZACIÓN AUTOMÁTICA
// =================================================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM cargado, esperando inicialización...');
    
    // Esperar un poco para que pricing-master.js se inicialice
    setTimeout(() => {
        initializeCalculatorSystem();
    }, 1000);
});

// API pública para compatibilidad
window.calculateMetalPrice = calculateMetalPrice;
window.calculateDiamondPrice = calculateDiamondPrice;
window.calculateGemstonePrice = calculateGemstonePrice;
window.calculateTotals = calculateTotals;

console.log('✅ Calculator System Clean v5.0 cargado');
console.log('💎 Integración: PricingMaster únicamente');
console.log('🔧 API: window.calculateMetalPrice(), etc.');