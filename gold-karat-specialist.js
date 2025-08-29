// gold-karat-specialist.js - ESPECIALISTA EN QUILATES DE ORO v1.0
// Cálculos precisos por quilates con precios verificados para SUBAGENTE 6
// =====================================================================

console.log('👑 Iniciando Especialista en Quilates de Oro v1.0...');

// =====================================================================
// CONFIGURACIÓN DEL ESPECIALISTA EN QUILATES
// =====================================================================

const GOLD_KARAT_CONFIG = {
    // Precios base verificados del oro (Agosto 2025)
    goldBasePrices: {
        spotPriceUSD: 2700.00, // USD por onza troy (precio verificado)
        spotPriceMXN: 1710.00, // MXN por gramo (oro 24k)
        lastMarketUpdate: '2025-08-13T10:00:00.000Z',
        exchangeRate: 19.80, // USD/MXN
        
        // Precios verificados por quilate en MXN/gramo
        verified: {
            '24k': { price: 1172.00, purity: 1.000, description: 'Oro puro' },
            '22k': { price: 1075.00, purity: 0.917, description: 'Oro de moneda' },
            '21k': { price: 1026.00, purity: 0.875, description: 'Oro árabe' },
            '20k': { price: 977.00,  purity: 0.833, description: 'Oro de Portuguese' },
            '18k': { price: 879.00,  purity: 0.750, description: 'Oro de joyería fina' },
            '16k': { price: 781.00,  purity: 0.667, description: 'Oro europeo' },
            '14k': { price: 686.00,  purity: 0.585, description: 'Oro americano estándar' },
            '12k': { price: 586.00,  purity: 0.500, description: 'Oro de joyería' },
            '10k': { price: 488.00,  purity: 0.417, description: 'Oro mínimo legal (USA)' },
            '9k':  { price: 439.00,  purity: 0.375, description: 'Oro mínimo legal (UK)' },
            '8k':  { price: 391.00,  purity: 0.333, description: 'Oro de calidad inferior' }
        }
    },

    // Aleaciones comunes y su impacto en precio
    alloys: {
        copper: { 
            symbol: 'Cu', 
            effect: 'reddish', 
            cost: 0.008, // USD/g
            description: 'Da color rojizo, aumenta dureza'
        },
        silver: { 
            symbol: 'Ag', 
            effect: 'pale', 
            cost: 1.22, // USD/g
            description: 'Da color más pálido, mantiene maleabilidad' 
        },
        palladium: { 
            symbol: 'Pd', 
            effect: 'white', 
            cost: 45.0, // USD/g
            description: 'Oro blanco premium, hipoalergénico'
        },
        nickel: { 
            symbol: 'Ni', 
            effect: 'white_cheap', 
            cost: 0.015, // USD/g
            description: 'Oro blanco económico, puede causar alergias'
        },
        zinc: { 
            symbol: 'Zn', 
            effect: 'brightness', 
            cost: 0.0025, // USD/g
            description: 'Aumenta brillo, reduce maleabilidad'
        },
        platinum: { 
            symbol: 'Pt', 
            effect: 'premium_white', 
            cost: 31.35, // USD/g
            description: 'Oro blanco de lujo, muy duradero'
        }
    },

    // Colores de oro y aleaciones típicas
    goldColors: {
        yellow: {
            name: 'Oro Amarillo',
            alloys: ['copper', 'silver', 'zinc'],
            typical: { copper: 0.6, silver: 0.3, zinc: 0.1 },
            priceMultiplier: 1.0,
            description: 'Color clásico del oro, aleación tradicional'
        },
        white: {
            name: 'Oro Blanco',
            alloys: ['palladium', 'silver'],
            typical: { palladium: 0.7, silver: 0.3 },
            priceMultiplier: 1.15, // 15% más caro por paladio
            description: 'Oro blanqueado con metales preciosos'
        },
        white_nickel: {
            name: 'Oro Blanco (Níquel)',
            alloys: ['nickel', 'copper', 'zinc'],
            typical: { nickel: 0.6, copper: 0.3, zinc: 0.1 },
            priceMultiplier: 0.95, // 5% más barato pero problemático
            description: 'Oro blanco económico, puede causar alergias'
        },
        rose: {
            name: 'Oro Rosa',
            alloys: ['copper', 'silver'],
            typical: { copper: 0.75, silver: 0.25 },
            priceMultiplier: 1.05, // Ligeramente más caro por trabajo
            description: 'Oro con tinte rosado/rojizo por cobre'
        },
        green: {
            name: 'Oro Verde',
            alloys: ['silver'],
            typical: { silver: 1.0 },
            priceMultiplier: 1.10, // Más caro por plata
            description: 'Oro con tinte verdoso por alta plata'
        }
    },

    // Tolerancias y estándares internacionales
    standards: {
        usa: {
            minimumKarat: 10,
            tolerance: 0.5, // ±0.5 quilates
            hallmarks: ['10K', '14K', '18K'],
            description: 'Estándar estadounidense FTC'
        },
        europe: {
            minimumKarat: 8,
            tolerance: 0.3, // ±0.3 quilates  
            hallmarks: ['333', '585', '750', '916'], // Milésimas
            description: 'Estándar europeo EN'
        },
        uk: {
            minimumKarat: 9,
            tolerance: 0.3,
            hallmarks: ['375', '585', '750', '916'],
            description: 'Estándar británico Assay Office'
        },
        mexico: {
            minimumKarat: 10,
            tolerance: 0.5,
            hallmarks: ['10k', '14k', '18k', '22k'],
            description: 'Estándar mexicano (siguiendo USA)'
        }
    },

    // Configuración de cálculos avanzados
    calculations: {
        densityGoldPure: 19.32, // g/cm³ oro puro
        densityVariation: {
            '24k': 19.32, '22k': 19.16, '18k': 15.58,
            '14k': 13.07, '10k': 11.57
        },
        
        // Factores de trabajo y manufactura
        workmanshipFactors: {
            casting: 1.0,           // Fundición básica
            handForged: 1.25,       // Forjado a mano
            filigree: 1.50,         // Filigrana
            granulation: 1.40,      // Granulado
            chainMaking: 1.30,      // Cadenas
            setting: 1.20,          // Engaste de piedras
            engraving: 1.35         // Grabado
        },

        // Pérdidas típicas en manufactura
        materialLoss: {
            casting: 0.02,          // 2% pérdida en fundición
            filing: 0.05,           // 5% pérdida en limado
            polishing: 0.01,        // 1% pérdida en pulido
            total: 0.08             // 8% pérdida total típica
        }
    },

    // Configuración de mercado y precio
    market: {
        premiumFactors: {
            spot: 1.0,              // Precio spot base
            retail: 1.15,           // +15% retail markup
            jewelry: 1.25,          // +25% para joyería
            branded: 1.40,          // +40% para marcas reconocidas
            designer: 1.60,         // +60% para diseñadores
            luxury: 2.00            // +100% para lujo
        },

        // Descuentos por volumen (gramos)
        volumeDiscounts: {
            small: { threshold: 0, discount: 0 },      // 0-10g: Sin descuento
            medium: { threshold: 10, discount: 0.03 },  // 10-50g: 3%
            large: { threshold: 50, discount: 0.05 },   // 50-100g: 5%
            bulk: { threshold: 100, discount: 0.08 }    // 100g+: 8%
        },

        // Ajustes estacionales
        seasonalFactors: {
            january: 0.95,      // Post-navidad, demanda baja
            february: 1.05,     // San Valentín
            march: 1.0,         // Normal
            april: 1.0,         // Normal
            may: 1.10,          // Día de las madres
            june: 1.15,         // Bodas
            july: 1.0,          // Normal
            august: 1.0,        // Normal
            september: 1.0,     // Normal
            october: 1.05,      // Pre-navidad
            november: 1.10,     // Navidad temprana
            december: 1.20      // Navidad/Año nuevo
        }
    }
};

// =====================================================================
// CLASE PRINCIPAL DEL ESPECIALISTA EN QUILATES
// =====================================================================

class GoldKaratSpecialist {
    constructor() {
        this.cache = new Map();
        this.priceHistory = [];
        this.calculations = [];
        this.alerts = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando especialista en quilates de oro...');
        
        try {
            // Cargar datos almacenados
            this.loadStoredData();
            
            // Verificar precios actuales vs. baseline
            this.verifyBasePrices();
            
            // Configurar actualización de precios
            this.setupPriceUpdates();
            
            console.log('✅ Especialista en quilates inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando karat specialist:', error);
        }
    }

    // =====================================================================
    // CÁLCULOS PRINCIPALES DE QUILATES
    // =====================================================================

    calculateGoldPrice(karats, weight, options = {}) {
        const calculationId = this.generateCalculationId();
        console.log(`💰 [${calculationId}] Calculando oro ${karats} - ${weight}g`);
        
        try {
            // Validar entrada
            this.validateKaratInput(karats, weight);
            
            // Obtener precio base por quilate
            const basePrice = this.getBasePricePerGram(karats, options);
            
            // Aplicar factores adicionales
            const adjustedPrice = this.applyPriceFactors(basePrice, weight, options);
            
            // Calcular precio total
            const totalPrice = adjustedPrice * weight;
            
            // Generar resultado detallado
            const result = this.formatKaratResult(
                totalPrice, 
                adjustedPrice, 
                karats, 
                weight, 
                calculationId, 
                options
            );
            
            // Registrar cálculo
            this.recordCalculation(result);
            
            console.log(`✅ [${calculationId}] Precio calculado: $${totalPrice.toFixed(2)} MXN`);
            return result;
            
        } catch (error) {
            console.error(`❌ [${calculationId}] Error calculando precio:`, error);
            return this.getEmergencyGoldPrice(karats, weight, error);
        }
    }

    getBasePricePerGram(karats, options = {}) {
        const karatKey = this.normalizeKaratKey(karats);
        
        // Prioridad 1: Precio verificado directo
        if (GOLD_KARAT_CONFIG.goldBasePrices.verified[karatKey]) {
            const verifiedPrice = GOLD_KARAT_CONFIG.goldBasePrices.verified[karatKey].price;
            console.log(`📊 Usando precio verificado ${karats}: $${verifiedPrice}/g`);
            return verifiedPrice;
        }
        
        // Prioridad 2: Cálculo desde oro puro
        return this.calculateFromPureGold(karats, options);
    }

    calculateFromPureGold(karats, options = {}) {
        const purity = this.karatToPurity(karats);
        const pureGoldPriceMXN = GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN;
        
        // Precio base por pureza
        let karatPrice = pureGoldPriceMXN * purity;
        
        // Ajustar por tipo de aleación si se especifica
        if (options.goldColor && options.goldColor !== 'yellow') {
            const colorData = GOLD_KARAT_CONFIG.goldColors[options.goldColor];
            if (colorData) {
                karatPrice *= colorData.priceMultiplier;
                console.log(`🎨 Ajuste por color ${colorData.name}: ${colorData.priceMultiplier}x`);
            }
        }
        
        // Ajuste por calidad de aleación
        karatPrice = this.adjustForAlloyQuality(karatPrice, karats, options);
        
        console.log(`⚖️ Precio calculado ${karats} (${(purity*100).toFixed(1)}%): $${karatPrice.toFixed(2)}/g`);
        return karatPrice;
    }

    adjustForAlloyQuality(basePrice, karats, options) {
        let adjustedPrice = basePrice;
        
        // Factor de aleación premium si se especifica
        if (options.alloyGrade === 'premium') {
            adjustedPrice *= 1.05; // 5% premium por aleaciones de calidad
        } else if (options.alloyGrade === 'economy') {
            adjustedPrice *= 0.97; // 3% descuento por aleaciones económicas
        }
        
        // Ajuste por origen/certificación
        if (options.certified) {
            adjustedPrice *= 1.03; // 3% premium por certificación
        }
        
        return adjustedPrice;
    }

    applyPriceFactors(basePrice, weight, options) {
        let finalPrice = basePrice;
        const appliedFactors = [];
        
        // Factor de mercado (retail vs. spot)
        const marketType = options.marketType || 'retail';
        if (GOLD_KARAT_CONFIG.market.premiumFactors[marketType]) {
            const factor = GOLD_KARAT_CONFIG.market.premiumFactors[marketType];
            finalPrice *= factor;
            appliedFactors.push(`Market(${marketType}): ${factor}x`);
        }
        
        // Factor de trabajo/manufactura
        if (options.workmanship) {
            const workFactor = GOLD_KARAT_CONFIG.calculations.workmanshipFactors[options.workmanship];
            if (workFactor) {
                finalPrice *= workFactor;
                appliedFactors.push(`Work(${options.workmanship}): ${workFactor}x`);
            }
        }
        
        // Descuento por volumen
        const volumeDiscount = this.calculateVolumeDiscount(weight);
        if (volumeDiscount > 0) {
            finalPrice *= (1 - volumeDiscount);
            appliedFactors.push(`Volume: -${(volumeDiscount*100).toFixed(1)}%`);
        }
        
        // Factor estacional
        if (options.applySeasonal) {
            const seasonalFactor = this.getCurrentSeasonalFactor();
            finalPrice *= seasonalFactor;
            appliedFactors.push(`Seasonal: ${seasonalFactor}x`);
        }
        
        // Factor de urgencia
        if (options.urgency === 'rush') {
            finalPrice *= 1.15; // 15% por urgencia
            appliedFactors.push(`Rush: 1.15x`);
        }
        
        console.log(`🔧 Factores aplicados: ${appliedFactors.join(', ')}`);
        return finalPrice;
    }

    calculateVolumeDiscount(weight) {
        const discounts = GOLD_KARAT_CONFIG.market.volumeDiscounts;
        
        if (weight >= discounts.bulk.threshold) {
            return discounts.bulk.discount;
        } else if (weight >= discounts.large.threshold) {
            return discounts.large.discount;
        } else if (weight >= discounts.medium.threshold) {
            return discounts.medium.discount;
        }
        
        return 0;
    }

    getCurrentSeasonalFactor() {
        const currentMonth = new Date().toLocaleLowerCase().substring(0, 3);
        const monthNames = {
            'jan': 'january', 'feb': 'february', 'mar': 'march',
            'apr': 'april', 'may': 'may', 'jun': 'june',
            'jul': 'july', 'aug': 'august', 'sep': 'september',
            'oct': 'october', 'nov': 'november', 'dec': 'december'
        };
        
        const monthName = monthNames[currentMonth];
        return GOLD_KARAT_CONFIG.market.seasonalFactors[monthName] || 1.0;
    }

    // =====================================================================
    // CONVERSIONES Y UTILIDADES DE QUILATES
    // =====================================================================

    karatToPurity(karats) {
        // Convertir quilates a fracción decimal (24k = 1.0)
        const karatValue = typeof karats === 'string' ? 
                          parseFloat(karats.replace('k', '').replace('K', '')) : 
                          karats;
        
        return karatValue / 24;
    }

    purityToKarat(purity) {
        // Convertir fracción decimal a quilates
        const karats = purity * 24;
        return Math.round(karats * 10) / 10; // Redondear a 1 decimal
    }

    karatToMillesimal(karats) {
        // Convertir quilates a milésimas (sistema europeo)
        const purity = this.karatToPurity(karats);
        return Math.round(purity * 1000);
    }

    millesimalToKarat(millesimal) {
        // Convertir milésimas a quilates
        const purity = millesimal / 1000;
        return this.purityToKarat(purity);
    }

    normalizeKaratKey(karats) {
        // Normalizar entrada de quilates para usar como key
        if (typeof karats === 'number') {
            return `${Math.round(karats)}k`;
        }
        
        const normalized = karats.toString().toLowerCase();
        if (!normalized.includes('k')) {
            return `${normalized}k`;
        }
        
        return normalized;
    }

    getKaratInfo(karats) {
        const karatKey = this.normalizeKaratKey(karats);
        const verifiedData = GOLD_KARAT_CONFIG.goldBasePrices.verified[karatKey];
        
        if (verifiedData) {
            return {
                karat: karats,
                purity: verifiedData.purity,
                purityPercent: (verifiedData.purity * 100).toFixed(1) + '%',
                millesimal: Math.round(verifiedData.purity * 1000),
                pricePerGram: verifiedData.price,
                description: verifiedData.description,
                isVerified: true
            };
        }
        
        // Calcular para quilates no estándar
        const purity = this.karatToPurity(karats);
        return {
            karat: karats,
            purity: purity,
            purityPercent: (purity * 100).toFixed(1) + '%',
            millesimal: Math.round(purity * 1000),
            pricePerGram: this.calculateFromPureGold(karats),
            description: `Oro ${karats} quilates`,
            isVerified: false
        };
    }

    // =====================================================================
    // ANÁLISIS Y COMPARACIONES
    // =====================================================================

    compareKarats(karats1, karats2, weight = 1) {
        console.log(`🔍 Comparando ${karats1} vs ${karats2} para ${weight}g`);
        
        const price1 = this.calculateGoldPrice(karats1, weight);
        const price2 = this.calculateGoldPrice(karats2, weight);
        
        const difference = price1.totalPrice - price2.totalPrice;
        const percentageDiff = (difference / price2.totalPrice) * 100;
        
        return {
            karats1: {
                karat: karats1,
                price: price1,
                info: this.getKaratInfo(karats1)
            },
            karats2: {
                karat: karats2,
                price: price2,
                info: this.getKaratInfo(karats2)
            },
            comparison: {
                difference: Math.abs(difference),
                percentageDiff: Math.abs(percentageDiff),
                moreExpensive: difference > 0 ? karats1 : karats2,
                recommendation: this.getKaratRecommendation(karats1, karats2, percentageDiff)
            }
        };
    }

    getKaratRecommendation(karats1, karats2, percentageDiff) {
        const highKarat = Math.max(parseFloat(karats1.replace('k', '')), parseFloat(karats2.replace('k', '')));
        const lowKarat = Math.min(parseFloat(karats1.replace('k', '')), parseFloat(karats2.replace('k', '')));
        
        if (percentageDiff < 5) {
            return `Diferencia mínima (<5%), elegir por preferencia de color/durabilidad`;
        } else if (percentageDiff < 15) {
            return `${highKarat}k ofrece mejor valor de inversión por diferencia moderada`;
        } else if (percentageDiff < 30) {
            return `${lowKarat}k mejor relación precio-calidad para joyería de uso diario`;
        } else {
            return `${lowKarat}k recomendado por gran diferencia de precio`;
        }
    }

    analyzeAlloyComposition(karats, goldColor = 'yellow') {
        const purity = this.karatToPurity(karats);
        const alloyPercent = 1 - purity;
        const colorData = GOLD_KARAT_CONFIG.goldColors[goldColor];
        
        if (!colorData) {
            throw new Error(`Color de oro desconocido: ${goldColor}`);
        }
        
        const composition = { gold: purity };
        
        // Calcular composición de aleaciones
        for (const [alloyName, proportion] of Object.entries(colorData.typical)) {
            composition[alloyName] = alloyPercent * proportion;
        }
        
        // Calcular costos de aleaciones
        let alloyCost = 0;
        const alloyDetails = {};
        
        for (const [alloyName, proportion] of Object.entries(composition)) {
            if (alloyName !== 'gold') {
                const alloyData = GOLD_KARAT_CONFIG.alloys[alloyName];
                if (alloyData) {
                    const costUSD = proportion * alloyData.cost;
                    const costMXN = costUSD * GOLD_KARAT_CONFIG.goldBasePrices.exchangeRate;
                    alloyCost += costMXN;
                    
                    alloyDetails[alloyName] = {
                        proportion: proportion,
                        percentByWeight: (proportion * 100).toFixed(1) + '%',
                        costPerGram: costMXN.toFixed(4),
                        symbol: alloyData.symbol,
                        effect: alloyData.description
                    };
                }
            }
        }
        
        return {
            karats,
            goldColor: colorData.name,
            goldPurity: (purity * 100).toFixed(1) + '%',
            alloyPurity: (alloyPercent * 100).toFixed(1) + '%',
            composition,
            alloyDetails,
            estimatedAlloyCost: alloyCost,
            characteristics: colorData.description,
            priceMultiplier: colorData.priceMultiplier
        };
    }

    // =====================================================================
    // VALIDACIONES Y ESTÁNDARES
    // =====================================================================

    validateKaratStandard(karats, country = 'mexico') {
        const standard = GOLD_KARAT_CONFIG.standards[country.toLowerCase()];
        if (!standard) {
            throw new Error(`Estándar no reconocido para país: ${country}`);
        }
        
        const karatValue = parseFloat(karats.toString().replace('k', '').replace('K', ''));
        const isLegal = karatValue >= standard.minimumKarat;
        
        return {
            karats,
            country,
            standard: standard.description,
            minimumKarat: standard.minimumKarat,
            tolerance: standard.tolerance,
            isLegal,
            hallmarks: standard.hallmarks,
            recommendation: isLegal ? 
                           `Cumple con estándar ${country.toUpperCase()}` : 
                           `Debe ser mínimo ${standard.minimumKarat}k para ${country.toUpperCase()}`
        };
    }

    testPurityAccuracy(declaredKarats, actualPurity) {
        const declaredPurity = this.karatToPurity(declaredKarats);
        const purityDifference = Math.abs(declaredPurity - actualPurity);
        const tolerance = 0.02; // 2% tolerancia estándar
        
        const isAccurate = purityDifference <= tolerance;
        const actualKarats = this.purityToKarat(actualPurity);
        
        return {
            declared: {
                karats: declaredKarats,
                purity: declaredPurity,
                purityPercent: (declaredPurity * 100).toFixed(1) + '%'
            },
            actual: {
                karats: actualKarats,
                purity: actualPurity,
                purityPercent: (actualPurity * 100).toFixed(1) + '%'
            },
            test: {
                difference: purityDifference,
                differencePercent: (purityDifference * 100).toFixed(2) + '%',
                tolerance: tolerance,
                isAccurate,
                status: isAccurate ? 'PASSED' : 'FAILED',
                recommendation: isAccurate ? 
                               'Pureza dentro de tolerancia' : 
                               'Pureza fuera de especificación - verificar origen'
            }
        };
    }

    // =====================================================================
    // CÁLCULOS AVANZADOS
    // =====================================================================

    calculateMeltValue(karats, weight) {
        // Valor de fusión (solo el oro, sin trabajo)
        const purity = this.karatToPurity(karats);
        const pureGoldWeight = weight * purity;
        const goldSpotPrice = GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN;
        
        // Deducir pérdidas típicas de fusión (2-3%)
        const lossPercentage = 0.025; // 2.5%
        const recoverableGold = pureGoldWeight * (1 - lossPercentage);
        const meltValue = recoverableGold * goldSpotPrice;
        
        return {
            originalWeight: weight,
            originalKarats: karats,
            pureGoldContent: pureGoldWeight,
            recoverableGold: recoverableGold,
            lossPercentage: lossPercentage * 100,
            meltValue: meltValue,
            meltValuePerGram: meltValue / weight,
            spotPrice: goldSpotPrice
        };
    }

    calculateRequiredGold(targetWeight, karats) {
        // Calcular oro puro necesario para peso/quilate deseado
        const purity = this.karatToPurity(karats);
        const pureGoldNeeded = targetWeight * purity;
        const alloyNeeded = targetWeight - pureGoldNeeded;
        
        // Calcular con pérdidas de manufactura
        const totalLoss = GOLD_KARAT_CONFIG.calculations.materialLoss.total;
        const pureGoldWithLoss = pureGoldNeeded / (1 - totalLoss);
        const alloyWithLoss = alloyNeeded / (1 - totalLoss);
        const totalMaterialNeeded = pureGoldWithLoss + alloyWithLoss;
        
        const costGold = pureGoldWithLoss * GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN;
        
        return {
            targetWeight,
            targetKarats: karats,
            pureGoldNeeded,
            alloyNeeded,
            lossPercentage: totalLoss * 100,
            materialWithLoss: {
                pureGold: pureGoldWithLoss,
                alloy: alloyWithLoss,
                total: totalMaterialNeeded
            },
            costs: {
                goldCost: costGold,
                alloyCost: 5, // Costo estimado aleación por gramo
                totalMaterialCost: costGold + (alloyWithLoss * 5)
            }
        };
    }

    calculateDensityCheck(karats, volume, weight) {
        // Verificar autenticidad por densidad
        const expectedDensity = GOLD_KARAT_CONFIG.calculations.densityVariation[this.normalizeKaratKey(karats)];
        const actualDensity = weight / volume;
        
        if (!expectedDensity) {
            return { error: `Densidad de referencia no disponible para ${karats}` };
        }
        
        const densityDifference = Math.abs(actualDensity - expectedDensity);
        const tolerancePercent = 0.05; // 5% tolerancia
        const tolerance = expectedDensity * tolerancePercent;
        
        const isAuthentic = densityDifference <= tolerance;
        
        return {
            karats,
            volume,
            weight,
            expectedDensity,
            actualDensity,
            difference: densityDifference,
            tolerance,
            tolerancePercent: tolerancePercent * 100,
            isAuthentic,
            authenticity: isAuthentic ? 'PROBABLE AUTHENTIC' : 'SUSPICIOUS - VERIFY',
            recommendation: isAuthentic ? 
                          'Densidad consistente con quilates declarados' : 
                          'Densidad inconsistente - realizar prueba de fuego o XRF'
        };
    }

    // =====================================================================
    // SISTEMA DE PRECIOS Y ACTUALIZACIONES
    // =====================================================================

    verifyBasePrices() {
        console.log('🔍 Verificando precios base de oro...');
        
        const currentDate = new Date();
        const lastUpdate = new Date(GOLD_KARAT_CONFIG.goldBasePrices.lastMarketUpdate);
        const daysSinceUpdate = (currentDate - lastUpdate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 7) {
            console.warn(`⚠️ Precios base tienen ${Math.floor(daysSinceUpdate)} días de antigüedad`);
            this.alerts.push({
                type: 'price_age_warning',
                message: `Precios base desactualizados: ${Math.floor(daysSinceUpdate)} días`,
                timestamp: Date.now(),
                recommendation: 'Actualizar precios con fuentes de mercado'
            });
        }
        
        // Verificar consistencia interna de precios
        this.verifyPriceConsistency();
    }

    verifyPriceConsistency() {
        const verified = GOLD_KARAT_CONFIG.goldBasePrices.verified;
        const pureGoldPrice = verified['24k'].price;
        
        const inconsistencies = [];
        
        for (const [karatKey, data] of Object.entries(verified)) {
            if (karatKey === '24k') continue;
            
            const expectedPrice = pureGoldPrice * data.purity;
            const actualPrice = data.price;
            const deviation = Math.abs(expectedPrice - actualPrice) / actualPrice;
            
            if (deviation > 0.10) { // 10% tolerancia
                inconsistencies.push({
                    karat: karatKey,
                    expected: expectedPrice.toFixed(2),
                    actual: actualPrice.toFixed(2),
                    deviation: (deviation * 100).toFixed(1) + '%'
                });
            }
        }
        
        if (inconsistencies.length > 0) {
            console.warn('⚠️ Inconsistencias detectadas en precios:', inconsistencies);
            this.alerts.push({
                type: 'price_consistency_warning',
                message: 'Precios inconsistentes detectados',
                inconsistencies,
                timestamp: Date.now()
            });
        } else {
            console.log('✅ Precios base consistentes');
        }
    }

    setupPriceUpdates() {
        // Intentar obtener precios actuales si hay APIs disponibles
        if (window.realMetalsAPI) {
            this.updatePricesFromAPI();
        }
        
        // Configurar actualización periódica (cada 30 minutos)
        setInterval(() => {
            this.updatePricesFromAPI();
        }, 30 * 60 * 1000);
    }

    async updatePricesFromAPI() {
        try {
            if (!window.realMetalsAPI) return;
            
            console.log('📡 Actualizando precios de oro desde API...');
            
            // Obtener precio spot actual
            const goldSpotResult = await window.realMetalsAPI.getMetalPrice('gold', '24k');
            
            if (goldSpotResult && goldSpotResult.pricePerGram) {
                const newSpotPrice = goldSpotResult.pricePerGram;
                const currentSpotPrice = GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN;
                const priceChange = ((newSpotPrice - currentSpotPrice) / currentSpotPrice) * 100;
                
                if (Math.abs(priceChange) > 2) { // Solo actualizar si cambio > 2%
                    console.log(`📈 Precio de oro cambió ${priceChange.toFixed(1)}%: $${currentSpotPrice} → $${newSpotPrice}`);
                    
                    // Actualizar precio base y recalcular todos los quilates
                    GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN = newSpotPrice;
                    this.recalculateAllKaratPrices();
                    
                    // Registrar cambio
                    this.priceHistory.push({
                        timestamp: Date.now(),
                        oldPrice: currentSpotPrice,
                        newPrice: newSpotPrice,
                        changePercent: priceChange,
                        source: 'api_update'
                    });
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Error actualizando precios desde API:', error.message);
        }
    }

    recalculateAllKaratPrices() {
        console.log('🔄 Recalculando precios de todos los quilates...');
        
        const newSpotPrice = GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN;
        
        for (const [karatKey, data] of Object.entries(GOLD_KARAT_CONFIG.goldBasePrices.verified)) {
            if (karatKey === '24k') {
                data.price = newSpotPrice;
            } else {
                data.price = newSpotPrice * data.purity;
            }
        }
        
        // Limpiar cache para forzar recálculo
        this.cache.clear();
        
        console.log('✅ Precios recalculados');
    }

    // =====================================================================
    // UTILIDADES Y HELPERS
    // =====================================================================

    validateKaratInput(karats, weight) {
        if (!karats || karats <= 0) {
            throw new Error('Quilates debe ser mayor que 0');
        }
        
        if (!weight || weight <= 0) {
            throw new Error('Peso debe ser mayor que 0');
        }
        
        const karatValue = typeof karats === 'string' ? 
                          parseFloat(karats.replace('k', '').replace('K', '')) : 
                          karats;
        
        if (karatValue > 24) {
            throw new Error('Quilates no puede ser mayor que 24');
        }
        
        if (karatValue < 8) {
            console.warn(`⚠️ Advertencia: ${karatValue}k está por debajo de estándares comerciales`);
        }
    }

    formatKaratResult(totalPrice, pricePerGram, karats, weight, calculationId, options) {
        const karatInfo = this.getKaratInfo(karats);
        
        return {
            calculationId,
            timestamp: Date.now(),
            metal: 'gold',
            karats: karats,
            weight: weight,
            totalPrice: parseFloat(totalPrice.toFixed(2)),
            pricePerGram: parseFloat(pricePerGram.toFixed(2)),
            currency: 'MXN',
            karatInfo,
            options: options || {},
            source: 'karat_specialist',
            confidence: 'high'
        };
    }

    getEmergencyGoldPrice(karats, weight, error) {
        console.error('🚨 Usando precio de emergencia para oro:', error.message);
        
        // Precios de emergencia básicos
        const emergencyPrices = {
            '24k': 1172, '22k': 1075, '18k': 879, '14k': 686, '10k': 488
        };
        
        const karatKey = this.normalizeKaratKey(karats);
        const emergencyPrice = emergencyPrices[karatKey] || 500; // Fallback absoluto
        const totalPrice = emergencyPrice * weight;
        
        return {
            totalPrice: totalPrice,
            pricePerGram: emergencyPrice,
            karats,
            weight,
            currency: 'MXN',
            source: 'emergency_gold_fallback',
            confidence: 'emergency',
            error: error.message,
            warning: 'PRECIO DE EMERGENCIA - VERIFICAR MANUALMENTE'
        };
    }

    generateCalculationId() {
        return `gold_calc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    recordCalculation(result) {
        this.calculations.push(result);
        
        // Mantener solo últimos 100 cálculos
        if (this.calculations.length > 100) {
            this.calculations = this.calculations.slice(-100);
        }
        
        // Persistir si es importante
        if (result.weight > 10 || result.totalPrice > 10000) {
            this.persistCalculation(result);
        }
    }

    persistCalculation(calculation) {
        try {
            const stored = JSON.parse(localStorage.getItem('gold_karat_calculations') || '[]');
            stored.push(calculation);
            
            // Mantener solo últimos 50 cálculos importantes
            if (stored.length > 50) {
                stored.splice(0, stored.length - 50);
            }
            
            localStorage.setItem('gold_karat_calculations', JSON.stringify(stored));
            
        } catch (error) {
            console.warn('⚠️ Error persistiendo cálculo:', error.message);
        }
    }

    loadStoredData() {
        try {
            const storedCalculations = localStorage.getItem('gold_karat_calculations');
            if (storedCalculations) {
                const parsed = JSON.parse(storedCalculations);
                this.calculations = parsed;
                console.log(`💾 ${parsed.length} cálculos cargados desde storage`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error cargando datos almacenados:', error.message);
        }
    }

    // =====================================================================
    // API PÚBLICA
    // =====================================================================

    // Método principal para calcular precio de oro
    async getGoldPrice(karats, weight = 1, options = {}) {
        return this.calculateGoldPrice(karats, weight, options);
    }

    // Obtener información detallada de quilates
    getKaratDetails(karats) {
        return this.getKaratInfo(karats);
    }

    // Comparar precios entre quilates
    compareGoldKarats(karats1, karats2, weight = 1) {
        return this.compareKarats(karats1, karats2, weight);
    }

    // Análizar composición de aleación
    analyzeGoldAlloy(karats, color = 'yellow') {
        return this.analyzeAlloyComposition(karats, color);
    }

    // Validar estándar de quilates
    validateGoldStandard(karats, country = 'mexico') {
        return this.validateKaratStandard(karats, country);
    }

    // Calcular valor de fusión
    getGoldMeltValue(karats, weight) {
        return this.calculateMeltValue(karats, weight);
    }

    // Verificar autenticidad por densidad
    checkGoldDensity(karats, volume, weight) {
        return this.calculateDensityCheck(karats, volume, weight);
    }

    // Obtener estado del sistema
    getSystemStatus() {
        return {
            basePricesAge: Date.now() - new Date(GOLD_KARAT_CONFIG.goldBasePrices.lastMarketUpdate).getTime(),
            totalCalculations: this.calculations.length,
            alerts: this.alerts.length,
            priceHistoryEntries: this.priceHistory.length,
            availableKarats: Object.keys(GOLD_KARAT_CONFIG.goldBasePrices.verified),
            lastSpotPrice: GOLD_KARAT_CONFIG.goldBasePrices.spotPriceMXN
        };
    }

    // Exportar datos de cálculos
    exportCalculations(format = 'json') {
        const exportData = {
            calculations: this.calculations,
            priceHistory: this.priceHistory,
            alerts: this.alerts,
            exportTimestamp: Date.now()
        };

        if (format === 'csv') {
            const headers = ['timestamp', 'karats', 'weight', 'totalPrice', 'pricePerGram'];
            const rows = this.calculations.map(calc => [
                new Date(calc.timestamp).toISOString(),
                calc.karats,
                calc.weight,
                calc.totalPrice,
                calc.pricePerGram
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        return JSON.stringify(exportData, null, 2);
    }

    // Limpiar datos
    clearAllData() {
        this.calculations = [];
        this.priceHistory = [];
        this.alerts = [];
        this.cache.clear();
        
        localStorage.removeItem('gold_karat_calculations');
        console.log('🗑️ Todos los datos de quilates limpiados');
    }
}

// =====================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// =====================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.goldKaratSpecialist = new GoldKaratSpecialist();
    
    // Funciones de conveniencia globales
    window.getGoldPrice = async (karats, weight = 1, options = {}) => {
        return await window.goldKaratSpecialist.getGoldPrice(karats, weight, options);
    };
    
    window.getKaratInfo = (karats) => {
        return window.goldKaratSpecialist.getKaratDetails(karats);
    };
    
    window.compareGoldKarats = (karats1, karats2, weight = 1) => {
        return window.goldKaratSpecialist.compareGoldKarats(karats1, karats2, weight);
    };
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GoldKaratSpecialist,
        GOLD_KARAT_CONFIG
    };
}

console.log('✅ Especialista en Quilates de Oro v1.0 cargado correctamente');
console.log('👑 Acceso: window.goldKaratSpecialist');
console.log('⚡ Función rápida: window.getGoldPrice(karats, weight)');
console.log('🔍 Info quilates: window.getKaratInfo(karats)');
console.log('⚖️ Comparar: window.compareGoldKarats("14k", "18k", 5.2)');