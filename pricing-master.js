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
    
    // Get all current prices as object
    getAllPrices() {
        return {
            metals: {
                gold24k: this.defaultPrices.gold24k,
                gold22k: this.defaultPrices.gold22k,
                gold18k: this.defaultPrices.gold18k,
                gold14k: this.defaultPrices.gold14k,
                gold10k: this.defaultPrices.gold10k,
                silver925: this.defaultPrices.silver925,
                platinum: this.defaultPrices.platinum,
                palladium: this.defaultPrices.palladium
            },
            diamonds: {
                base: this.defaultPrices.diamond
            },
            gemstones: {
                ruby: this.defaultPrices.ruby,
                emerald: this.defaultPrices.emerald,
                sapphire: this.defaultPrices.sapphire,
                amethyst: this.defaultPrices.amethyst,
                citrine: this.defaultPrices.citrine,
                garnet: this.defaultPrices.garnet,
                peridot: this.defaultPrices.peridot,
                aquamarine: this.defaultPrices.aquamarine,
                topaz: this.defaultPrices.topaz,
                tanzanite: this.defaultPrices.tanzanite
            },
            exchangeRate: this.exchangeRate,
            lastUpdate: new Date().toISOString()
        };
    }
    
    // Update specific price manually
    updatePrice(category, item, newPrice) {
        try {
            if (category === 'metals') {
                const key = `${item.toLowerCase()}`;
                if (this.defaultPrices[key] !== undefined) {
                    this.defaultPrices[key] = parseFloat(newPrice);
                    console.log(`💰 Precio actualizado: ${key} = $${newPrice}`);
                    return true;
                }
            } else if (category === 'diamonds' && item === 'base') {
                this.defaultPrices.diamond = parseFloat(newPrice);
                console.log(`💎 Precio diamante actualizado: $${newPrice}`);
                return true;
            } else if (category === 'gemstones') {
                const key = item.toLowerCase();
                if (this.defaultPrices[key] !== undefined) {
                    this.defaultPrices[key] = parseFloat(newPrice);
                    console.log(`💍 Precio gema actualizada: ${key} = $${newPrice}`);
                    return true;
                }
            } else if (category === 'exchange' && item === 'rate') {
                this.exchangeRate = parseFloat(newPrice);
                console.log(`💱 Tipo de cambio actualizado: $${newPrice}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error actualizando precio:', error);
            return false;
        }
    }
    
    // Get last update timestamp
    getLastUpdate() {
        return new Date().toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ============================================================
// PRICE DASHBOARD MANAGER
// ============================================================

class PriceDashboard {
    constructor(pricingMaster) {
        this.pricingMaster = pricingMaster;
        this.isManualMode = false;
        this.manualPrices = {};
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDashboard());
        } else {
            this.setupDashboard();
        }
    }
    
    setupDashboard() {
        console.log('🎛️ Configurando panel de precios...');
        
        // Load initial prices
        this.updatePriceDisplay();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load manual overrides from localStorage
        this.loadManualPrices();
        
        console.log('✅ Panel de precios configurado');
    }
    
    setupEventListeners() {
        // Toggle price panel
        const toggleBtn = document.getElementById('togglePricePanel');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.togglePanel.bind(this));
        }
        
        // Refresh prices
        const refreshBtn = document.getElementById('refreshPrices');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshPrices.bind(this));
        }
        
        // Toggle mode
        const modeBtn = document.getElementById('togglePriceMode');
        if (modeBtn) {
            modeBtn.addEventListener('click', this.toggleMode.bind(this));
        }
        
        // Edit buttons
        document.querySelectorAll('.price-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleEdit(e.target.dataset.price));
        });
        
        // Price inputs
        document.querySelectorAll('.price-input').forEach(input => {
            input.addEventListener('change', (e) => this.onPriceChange(e.target));
        });
    }
    
    updatePriceDisplay() {
        const prices = this.pricingMaster.getAllPrices();
        
        // Update metals
        this.setInputValue('priceGold24k', prices.metals.gold24k);
        this.setInputValue('priceGold18k', prices.metals.gold18k);
        this.setInputValue('priceGold14k', prices.metals.gold14k);
        this.setInputValue('priceSilver925', prices.metals.silver925);
        this.setInputValue('pricePlatinum', prices.metals.platinum);
        
        // Update diamonds
        this.setInputValue('priceDiamondBase', prices.diamonds.base);
        
        // Update gemstones
        this.setInputValue('priceRuby', prices.gemstones.ruby);
        this.setInputValue('priceEmerald', prices.gemstones.emerald);
        this.setInputValue('priceSapphire', prices.gemstones.sapphire);
        
        // Update exchange rate
        this.setInputValue('priceExchangeRate', prices.exchangeRate);
        
        // Update timestamp
        const timestamp = document.getElementById('priceTimestamp');
        if (timestamp) {
            timestamp.textContent = `Última actualización: ${this.pricingMaster.getLastUpdate()}`;
        }
    }
    
    setInputValue(elementId, value) {
        const input = document.getElementById(elementId);
        if (input) {
            input.value = parseFloat(value).toFixed(2);
        }
    }
    
    togglePanel() {
        const content = document.getElementById('pricePanelContent');
        const btn = document.getElementById('togglePricePanel');
        if (content && btn) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            btn.textContent = isVisible ? '+' : '−';
        }
    }
    
    async refreshPrices() {
        const btn = document.getElementById('refreshPrices');
        if (btn) {
            btn.textContent = '🔄 Actualizando...';
            btn.disabled = true;
        }
        
        try {
            await this.pricingMaster.updateExchangeRate();
            await this.pricingMaster.updateMetalPrices();
            this.updatePriceDisplay();
            
            if (btn) {
                btn.textContent = '✅ Actualizado';
                setTimeout(() => {
                    btn.textContent = '🔄 Actualizar Precios';
                }, 2000);
            }
        } catch (error) {
            console.error('Error actualizando precios:', error);
            if (btn) {
                btn.textContent = '❌ Error';
                setTimeout(() => {
                    btn.textContent = '🔄 Actualizar Precios';
                }, 2000);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
            }
        }
    }
    
    toggleMode() {
        this.isManualMode = !this.isManualMode;
        const btn = document.getElementById('togglePriceMode');
        if (btn) {
            if (this.isManualMode) {
                btn.textContent = '🖊️ Modo: Manual';
                btn.classList.add('manual');
            } else {
                btn.textContent = '🔧 Modo: Automático';
                btn.classList.remove('manual');
            }
        }
        
        // Update input states
        document.querySelectorAll('.price-input').forEach(input => {
            if (this.isManualMode) {
                input.removeAttribute('readonly');
                input.classList.add('manual');
            } else {
                input.setAttribute('readonly', 'readonly');
                input.classList.remove('manual');
            }
        });
    }
    
    toggleEdit(priceKey) {
        const btn = document.querySelector(`[data-price="${priceKey}"]`);
        const input = document.getElementById(`price${priceKey.charAt(0).toUpperCase() + priceKey.slice(1)}`);
        
        if (btn && input) {
            const isActive = btn.classList.contains('active');
            
            if (isActive) {
                // Save and disable edit
                btn.classList.remove('active');
                input.setAttribute('readonly', 'readonly');
                input.classList.remove('manual');
            } else {
                // Enable edit
                btn.classList.add('active');
                input.removeAttribute('readonly');
                input.classList.add('manual');
                input.focus();
            }
        }
    }
    
    onPriceChange(input) {
        const newPrice = parseFloat(input.value);
        const priceKey = input.id.replace('price', '').toLowerCase();
        
        if (isNaN(newPrice) || newPrice <= 0) {
            alert('Por favor ingrese un precio válido mayor a 0');
            this.updatePriceDisplay();
            return;
        }
        
        // Save manual price
        this.manualPrices[priceKey] = newPrice;
        this.saveManualPrices();
        
        console.log(`💰 Precio manual actualizado: ${priceKey} = $${newPrice}`);
    }
    
    saveManualPrices() {
        localStorage.setItem('calculator_manual_prices', JSON.stringify(this.manualPrices));
    }
    
    loadManualPrices() {
        try {
            const saved = localStorage.getItem('calculator_manual_prices');
            if (saved) {
                this.manualPrices = JSON.parse(saved);
                console.log('📝 Precios manuales cargados:', this.manualPrices);
            }
        } catch (error) {
            console.warn('Error cargando precios manuales:', error);
        }
    }
    
    // Get current price (manual override or automatic)
    getCurrentPrice(category, item) {
        const key = `${category}${item}`.toLowerCase();
        return this.manualPrices[key] || this.pricingMaster.getMetalPrice(category, item);
    }
}

// ============================================================
// GLOBAL INSTANCE
// ============================================================

// Create global instance
window.pricingMaster = new PricingMaster();
window.priceDashboard = new PriceDashboard(window.pricingMaster);

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PricingMaster, PriceDashboard };
}

console.log('✅ Pricing Master y Dashboard inicializados globalmente');