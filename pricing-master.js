// pricing-master.js - Master pricing system for jewelry calculator
// Simplified pricing system for ciaociao.mx jewelry calculator
// ============================================================

console.log('💎 Inicializando Pricing Master v1.0...');

// ============================================================
// PRICING MASTER CLASS
// ============================================================

class PricingMaster {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.exchangeRate = 20.0; // Default USD to MXN
        this.initialized = false;
        
        // Default prices (fallback)
        this.defaultPrices = {
            // Metals (USD per gram)
            gold24k: 65.0,
            gold22k: 59.5,
            gold18k: 48.8,
            gold14k: 37.9,
            gold10k: 27.1,
            silver925: 0.85,
            platinum: 31.5,
            palladium: 28.2,
            
            // Diamonds (USD per carat) - base prices
            diamond: 3500,
            
            // Gemstones (USD per carat)
            ruby: 1200,
            emerald: 1000,
            sapphire: 800,
            amethyst: 50,
            citrine: 40,
            garnet: 60,
            peridot: 80,
            aquamarine: 150,
            topaz: 100,
            tanzanite: 600
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔄 Inicializando sistema de precios...');
        
        try {
            // Try to get current exchange rate
            await this.updateExchangeRate();
            
            // Try to update metal prices
            await this.updateMetalPrices();
            
            this.initialized = true;
            console.log('✅ Sistema de precios inicializado correctamente');
            
        } catch (error) {
            console.warn('⚠️ Error inicializando precios, usando valores predeterminados:', error);
            this.initialized = true; // Continue with default prices
        }
    }
    
    async updateExchangeRate() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            if (data.rates && data.rates.MXN) {
                this.exchangeRate = data.rates.MXN;
                console.log(`💱 Tipo de cambio actualizado: $${this.exchangeRate} MXN por USD`);
            }
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar el tipo de cambio:', error);
        }
    }
    
    async updateMetalPrices() {
        try {
            // For now, use default prices
            // In the future, can integrate with metal pricing APIs
            console.log('📊 Usando precios predeterminados de metales');
        } catch (error) {
            console.warn('⚠️ No se pudieron actualizar precios de metales:', error);
        }
    }
    
    // Get metal price in USD per gram
    getMetalPrice(metalType, karat = null) {
        let basePrice = 0;
        
        switch (metalType.toLowerCase()) {
            case 'gold':
                if (karat) {
                    const karatKey = `gold${karat}k`;
                    basePrice = this.defaultPrices[karatKey] || this.defaultPrices.gold18k;
                } else {
                    basePrice = this.defaultPrices.gold18k;
                }
                break;
            case 'silver':
                basePrice = this.defaultPrices.silver925;
                break;
            case 'platinum':
                basePrice = this.defaultPrices.platinum;
                break;
            case 'palladium':
                basePrice = this.defaultPrices.palladium;
                break;
            default:
                console.warn(`Tipo de metal desconocido: ${metalType}`);
                basePrice = 0;
        }
        
        return basePrice;
    }
    
    // Get diamond price in USD per carat
    getDiamondPrice(carats, clarity = 'SI1', color = 'H', cut = 'Good') {
        let basePrice = this.defaultPrices.diamond;
        
        // Apply clarity factor
        const clarityFactors = {
            'FL': 1.8, 'IF': 1.7, 'VVS1': 1.5, 'VVS2': 1.4,
            'VS1': 1.2, 'VS2': 1.1, 'SI1': 1.0, 'SI2': 0.9,
            'I1': 0.7, 'I2': 0.5, 'I3': 0.3
        };
        
        // Apply color factor
        const colorFactors = {
            'D': 1.5, 'E': 1.4, 'F': 1.3, 'G': 1.2, 'H': 1.0,
            'I': 0.9, 'J': 0.8, 'K': 0.7, 'L': 0.6, 'M': 0.5
        };
        
        // Apply cut factor
        const cutFactors = {
            'Excellent': 1.2, 'Very Good': 1.1, 'Good': 1.0,
            'Fair': 0.9, 'Poor': 0.7
        };
        
        const clarityFactor = clarityFactors[clarity] || 1.0;
        const colorFactor = colorFactors[color] || 1.0;
        const cutFactor = cutFactors[cut] || 1.0;
        
        return basePrice * carats * clarityFactor * colorFactor * cutFactor;
    }
    
    // Get gemstone price in USD per carat
    getGemstonePrice(gemType, carats, quality = 'good') {
        const basePrice = this.defaultPrices[gemType.toLowerCase()] || 100;
        
        // Apply quality factor
        const qualityFactors = {
            'excellent': 1.5,
            'very-good': 1.3,
            'good': 1.0,
            'fair': 0.7,
            'poor': 0.5
        };
        
        const qualityFactor = qualityFactors[quality] || 1.0;
        
        return basePrice * carats * qualityFactor;
    }
    
    // Calculate labor cost
    getLaborCost(complexity, hours) {
        const laborRates = {
            'simple': 25,      // USD per hour
            'medium': 35,      // USD per hour
            'complex': 50,     // USD per hour
            'expert': 75       // USD per hour
        };
        
        const rate = laborRates[complexity] || laborRates.medium;
        return rate * hours;
    }
    
    // Convert USD to MXN
    convertToMXN(usdAmount) {
        return usdAmount * this.exchangeRate;
    }
    
    // Format currency
    formatCurrency(amount, currency = 'MXN') {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // Check if system is ready
    isReady() {
        return this.initialized;
    }
}

// ============================================================
// GLOBAL INSTANCE
// ============================================================

// Create global instance
window.pricingMaster = new PricingMaster();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PricingMaster;
}

console.log('✅ Pricing Master inicializado y disponible globalmente');