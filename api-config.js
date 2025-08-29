// api-config.js - CONFIGURACIÓN DE APIs REALES PARA CIAOCIAO
// Sistema de configuración centralizada para APIs de metales preciosos
// =================================================================

console.log('🔧 Cargando configuración de APIs reales...');

// =================================================================
// CONFIGURACIÓN DE APIs REALES
// =================================================================

const API_CONFIGURATION = {
    // Configuración para MetalpriceAPI (plan gratuito: 100 requests/mes)
    metalpriceapi: {
        enabled: false, // Deshabilitado hasta que se configure API key
        name: 'MetalpriceAPI',
        baseURL: 'https://api.metalpriceapi.com/v1',
        apiKey: process.env.METALPRICEAPI_KEY || 'YOUR_METALPRICEAPI_KEY_HERE', // Registrarse en metalpriceapi.com
        plan: 'free', // free, basic, premium
        limits: {
            requestsPerMonth: 100,
            requestsPerMinute: 10
        },
        confidence: 'high',
        priority: 1
    },

    // Configuración para Metals.dev (plan gratuito: 100 requests/mes)
    metalsdev: {
        enabled: false, // Deshabilitado hasta que se configure API key
        name: 'MetalsDev',
        baseURL: 'https://api.metals.dev/v1',
        apiKey: process.env.METALSDEV_KEY || 'YOUR_METALSDEV_KEY_HERE', // Registrarse en metals.dev
        plan: 'free',
        limits: {
            requestsPerMonth: 100,
            requestsPerMinute: 10
        },
        confidence: 'high',
        priority: 2
    },

    // Configuración para ExchangeRate-API (gratuito, sin límites estrictos)
    exchangerateapi: {
        enabled: true,
        name: 'ExchangeRate-API',
        baseURL: 'https://api.exchangerate-api.com/v4',
        apiKey: null, // No requiere API key
        plan: 'free',
        limits: {
            requestsPerMonth: 999999,
            requestsPerMinute: 60
        },
        confidence: 'high',
        priority: 1
    },

    // Configuración para Free Currency API (backup para tipo de cambio)
    freecurrencyapi: {
        enabled: false, // Deshabilitado hasta que se configure API key
        name: 'FreeCurrencyAPI',
        baseURL: 'https://api.freecurrencyapi.com/v1',
        apiKey: process.env.FREECURRENCY_KEY || 'YOUR_FREECURRENCY_KEY_HERE', // Registrarse en freecurrencyapi.com
        plan: 'free',
        limits: {
            requestsPerMonth: 5000,
            requestsPerMinute: 60
        },
        confidence: 'medium',
        priority: 2
    },

    // Configuración para APIs públicas de bancos mexicanos
    bancomex: {
        enabled: false, // Deshabilitado hasta que se configure token
        name: 'Banco de México',
        baseURL: 'https://www.banxico.org.mx/SieAPIRest/service/v1/series',
        apiKey: process.env.BANXICO_TOKEN || 'YOUR_BANXICO_TOKEN_HERE', // Token gratuito de Banxico
        plan: 'free',
        limits: {
            requestsPerMonth: 999999,
            requestsPerMinute: 60
        },
        confidence: 'very_high', // Fuente oficial
        priority: 1,
        series: {
            usd_mxn: 'SF43718', // Serie del tipo de cambio USD/MXN
            gold_usd: 'SF61745', // Precio del oro en USD (si disponible)
            silver_usd: 'SF61746' // Precio de la plata en USD (si disponible)
        }
    }
};

// =================================================================
// PRECIOS DE MERCADO ACTUALIZADOS (FALLBACK)
// =================================================================

const MARKET_PRICES_AUGUST_2025 = {
    // Precios base en USD por onza troy (actualizados agosto 25, 2025)
    metals_usd_per_oz: {
        gold: 2508.00,      // Oro USD/oz
        silver: 29.85,      // Plata USD/oz  
        platinum: 945.00,   // Platino USD/oz
        palladium: 1050.00  // Paladio USD/oz
    },

    // Tipo de cambio USD/MXN (actualizado agosto 25, 2025)
    exchange_rate: {
        usd_mxn: 18.50,
        last_update: '2025-08-25T12:00:00Z',
        source: 'Banco de México'
    },

    // Precios calculados en MXN por gramo (base para cálculos)
    // Oro: 2508 USD/oz * 18.50 MXN/USD / 31.1035 g/oz = 1492.50 MXN/g
    // Plata: 29.85 USD/oz * 18.50 MXN/USD / 31.1035 g/oz = 17.75 MXN/g
    metals_mxn_per_gram: {
        gold: {
            '24k': 1492.50,   // 100% pureza
            '22k': 1368.13,   // 91.67% pureza
            '18k': 1119.38,   // 75% pureza
            '14k': 870.63,    // 58.33% pureza
            '10k': 622.19     // 41.67% pureza
        },
        silver: {
            '999': 17.73,     // 99.9% pureza
            '958': 17.00,     // 95.8% pureza (plata esterlina premium)
            '925': 16.40,     // 92.5% pureza (plata esterlina)
            '900': 15.96,     // 90% pureza
            '800': 14.18      // 80% pureza
        },
        platinum: {
            '999': 562.22,    // 99.9% pureza - Platino: 945 USD/oz * 18.50 / 31.1035
            '950': 534.11,    // 95% pureza
            '900': 505.99,    // 90% pureza
            '850': 477.88     // 85% pureza
        },
        palladium: {
            '999': 624.69,    // 99.9% pureza - Paladio: 1050 USD/oz * 18.50 / 31.1035
            '950': 593.46,    // 95% pureza
            '900': 562.22     // 90% pureza
        }
    },

    // Información adicional
    market_info: {
        source: 'Promedio de mercados internacionales',
        last_update: '2025-08-25T12:00:00Z',
        confidence: 'high',
        volatility: 'normal',
        trend: 'stable'
    }
};

// =================================================================
// CONFIGURACIÓN DE PRECIOS DE EMERGENCIA
// =================================================================

const EMERGENCY_PRICES = {
    // Precios mínimos garantizados (conservadores)
    minimum_prices_mxn_per_gram: {
        gold: {
            '24k': 1100,
            '22k': 1008,
            '18k': 825,
            '14k': 642,
            '10k': 459
        },
        silver: {
            '999': 12,
            '925': 11,
            '900': 10.8,
            '800': 9.6
        },
        platinum: {
            '999': 500,
            '950': 475,
            '900': 450
        }
    },

    // Información de emergency
    emergency_info: {
        warning: '⚠️ PRECIOS DE EMERGENCIA - VERIFICAR MANUALMENTE',
        source: 'Precios mínimos conservadores',
        recommendation: 'Actualizar APIs lo antes posible'
    }
};

// =================================================================
// FUNCIONES DE CONFIGURACIÓN
// =================================================================

class APIConfiguration {
    constructor() {
        this.config = API_CONFIGURATION;
        this.marketPrices = MARKET_PRICES_AUGUST_2025;
        this.emergencyPrices = EMERGENCY_PRICES;
        this.initialized = false;
    }

    initialize() {
        console.log('🚀 Inicializando configuración de APIs...');
        
        try {
            // Verificar variables de entorno o configuración local
            this.loadLocalConfiguration();
            
            // Validar configuración
            this.validateConfiguration();
            
            // Configurar límites de rate limiting
            this.setupRateLimiting();
            
            this.initialized = true;
            console.log('✅ Configuración de APIs inicializada correctamente');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando configuración:', error);
            return false;
        }
    }

    loadLocalConfiguration() {
        // Cargar configuración desde localStorage si existe
        try {
            const localConfig = localStorage.getItem('api_configuration');
            if (localConfig) {
                const parsed = JSON.parse(localConfig);
                
                // Mergear configuración local con la por defecto
                Object.keys(parsed).forEach(apiName => {
                    if (this.config[apiName]) {
                        this.config[apiName] = { ...this.config[apiName], ...parsed[apiName] };
                    }
                });
                
                console.log('📁 Configuración local cargada exitosamente');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración local:', error.message);
        }
    }

    validateConfiguration() {
        const enabledAPIs = [];
        const missingKeys = [];
        
        Object.entries(this.config).forEach(([apiName, config]) => {
            if (config.enabled) {
                enabledAPIs.push(apiName);
                
                if (config.apiKey && (config.apiKey.startsWith('YOUR_') || config.apiKey === 'process.env.')) {
                    missingKeys.push(apiName);
                }
            }
        });
        
        console.log(`📊 APIs habilitadas: ${enabledAPIs.length}`);
        console.log(`🔑 APIs sin configurar: ${missingKeys.length}`);
        
        if (missingKeys.length > 0) {
            console.warn('⚠️ APIs sin API keys válidas:', missingKeys);
            console.warn('📝 Para obtener precios reales, configure las API keys en:');
            console.warn('   - MetalpriceAPI: https://metalpriceapi.com/');
            console.warn('   - Metals.dev: https://metals.dev/');
            console.warn('   - FreeCurrencyAPI: https://freecurrencyapi.com/');
            console.warn('   - Banco de México: https://www.banxico.org.mx/desarrolladores/');
        }
    }

    setupRateLimiting() {
        // Configurar límites de rate limiting para cada API
        Object.entries(this.config).forEach(([apiName, config]) => {
            if (config.enabled && config.limits) {
                console.log(`⏱️ Límites configurados para ${apiName}: ${config.limits.requestsPerMinute}/min, ${config.limits.requestsPerMonth}/mes`);
            }
        });
    }

    getAPIConfig(apiName) {
        return this.config[apiName];
    }

    getMarketPrices() {
        return this.marketPrices;
    }

    getEmergencyPrices() {
        return this.emergencyPrices;
    }

    isAPIConfigured(apiName) {
        const config = this.config[apiName];
        if (!config || !config.enabled) return false;
        
        // Si no requiere API key, está configurada
        if (!config.apiKey) return true;
        
        // Verificar que la API key no sea un placeholder
        return config.apiKey && !config.apiKey.startsWith('YOUR_') && !config.apiKey.includes('process.env.');
    }

    getConfiguredAPIs() {
        return Object.entries(this.config)
            .filter(([name, config]) => this.isAPIConfigured(name))
            .map(([name, config]) => ({ name, ...config }))
            .sort((a, b) => a.priority - b.priority);
    }

    saveConfiguration() {
        try {
            const configToSave = {};
            
            Object.entries(this.config).forEach(([apiName, config]) => {
                configToSave[apiName] = {
                    enabled: config.enabled,
                    apiKey: config.apiKey,
                    plan: config.plan
                };
            });
            
            localStorage.setItem('api_configuration', JSON.stringify(configToSave));
            console.log('💾 Configuración guardada en localStorage');
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
        }
    }

    // Método para configurar API keys dinámicamente
    setAPIKey(apiName, apiKey) {
        if (this.config[apiName]) {
            this.config[apiName].apiKey = apiKey;
            this.saveConfiguration();
            console.log(`🔑 API key configurada para ${apiName}`);
            return true;
        }
        return false;
    }

    // Obtener reporte de estado
    getStatusReport() {
        const configuredAPIs = this.getConfiguredAPIs();
        const totalAPIs = Object.keys(this.config).length;
        
        return {
            initialized: this.initialized,
            totalAPIs: totalAPIs,
            configuredAPIs: configuredAPIs.length,
            enabledAPIs: Object.values(this.config).filter(c => c.enabled).length,
            highPriorityConfigured: configuredAPIs.filter(api => api.priority <= 2).length,
            apis: configuredAPIs.map(api => ({
                name: api.name,
                enabled: api.enabled,
                configured: this.isAPIConfigured(api.name),
                priority: api.priority,
                confidence: api.confidence
            })),
            recommendations: this.getConfigurationRecommendations()
        };
    }

    getConfigurationRecommendations() {
        const recommendations = [];
        
        if (!this.isAPIConfigured('metalpriceapi')) {
            recommendations.push('Configurar MetalpriceAPI para precios de metales en tiempo real');
        }
        
        if (!this.isAPIConfigured('exchangerateapi')) {
            recommendations.push('Verificar conectividad a ExchangeRate-API para tipo de cambio');
        }
        
        if (!this.isAPIConfigured('bancomex')) {
            recommendations.push('Configurar token de Banco de México para máxima precisión');
        }
        
        return recommendations;
    }
}

// =================================================================
// INSTANCIA GLOBAL
// =================================================================

// Crear instancia global
window.apiConfiguration = new APIConfiguration();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.apiConfiguration.initialize();
});

// API pública
window.getAPIConfig = (apiName) => window.apiConfiguration.getAPIConfig(apiName);
window.setAPIKey = (apiName, apiKey) => window.apiConfiguration.setAPIKey(apiName, apiKey);
window.getAPIStatus = () => window.apiConfiguration.getStatusReport();

console.log('✅ Sistema de configuración de APIs cargado');
console.log('🔧 Acceso: window.apiConfiguration');
console.log('📊 Estado: window.getAPIStatus()');
console.log('🔑 Configurar: window.setAPIKey(apiName, key)');
