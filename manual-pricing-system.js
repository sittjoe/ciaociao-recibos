// manual-pricing-system.js - SISTEMA DE PRECIOS MANUALES Y OVERRIDES v1.0
// Gestión completa de precios manuales por gramo con ajustes de porcentaje y cantidades fijas
// =================================================================

console.log('⚙️ Iniciando Sistema de Precios Manuales v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE PRECIOS MANUALES
// =================================================================

const MANUAL_PRICING_CONFIG = {
    // Estructura de precios por metal
    metals: {
        gold: {
            name: 'Oro',
            symbol: 'XAU',
            unit: 'gramos',
            karats: ['10k', '14k', '18k', '22k', '24k'],
            defaultPriceSource: 'market',
            allowManualOverride: true,
            minPrice: 500,    // MXN por gramo mínimo
            maxPrice: 5000,   // MXN por gramo máximo
            warningThreshold: 0.2, // Alerta si override difiere >20% del precio de mercado
        },
        silver: {
            name: 'Plata',
            symbol: 'XAG', 
            unit: 'gramos',
            purity: '925',
            defaultPriceSource: 'market',
            allowManualOverride: true,
            minPrice: 5,
            maxPrice: 100,
            warningThreshold: 0.25
        },
        platinum: {
            name: 'Platino',
            symbol: 'XPT',
            unit: 'gramos',
            purity: '950',
            defaultPriceSource: 'market',
            allowManualOverride: true,
            minPrice: 800,
            maxPrice: 2500,
            warningThreshold: 0.2
        },
        palladium: {
            name: 'Paladio',
            symbol: 'XPD',
            unit: 'gramos',
            purity: '950',
            defaultPriceSource: 'market',
            allowManualOverride: true,
            minPrice: 600,
            maxPrice: 3000,
            warningThreshold: 0.3
        }
    },

    // Tipos de ajustes permitidos
    adjustmentTypes: {
        percentage: {
            name: 'Porcentaje',
            description: 'Ajuste como porcentaje del precio base',
            min: -50,  // -50% máximo descuento
            max: 200,  // +200% máximo markup
            step: 0.1,
            unit: '%'
        },
        fixed_amount: {
            name: 'Cantidad Fija',
            description: 'Agregar/quitar cantidad fija en MXN por gramo',
            min: -1000,
            max: 2000,
            step: 0.01,
            unit: 'MXN/g'
        },
        fixed_price: {
            name: 'Precio Fijo',
            description: 'Establecer precio fijo en MXN por gramo',
            min: 1,
            max: 10000,
            step: 0.01,
            unit: 'MXN/g'
        }
    },

    // Razones predefinidas para overrides
    overrideReasons: [
        'Promoción especial',
        'Cliente mayorista', 
        'Precio de competencia',
        'Costos adicionales de fabricación',
        'Calidad premium del material',
        'Urgencia del pedido',
        'Cliente frecuente',
        'Liquidación de inventario',
        'Precio de proveedor específico',
        'Ajuste por volatilidad del mercado',
        'Otro (especificar)'
    ],

    // Configuración de almacenamiento
    storage: {
        overridesKey: 'manual_pricing_overrides',
        historyKey: 'pricing_override_history',
        templatesKey: 'pricing_templates',
        maxHistoryEntries: 1000,
        backupInterval: 24 * 60 * 60 * 1000, // 24 horas
    },

    // Configuración de validación
    validation: {
        requireReason: true,
        requireApproval: false, // Para futuro: approval workflow
        maxDailyChanges: 50,    // Máximo 50 cambios por día
        alertOnLargeDeviation: true
    }
};

// =================================================================
// CLASE PRINCIPAL DE GESTIÓN DE PRECIOS MANUALES
// =================================================================

class ManualPricingSystem {
    constructor() {
        this.overrides = new Map();
        this.history = [];
        this.templates = new Map();
        this.validators = new Map();
        this.marketPrices = new Map();
        
        // Contadores para límites diarios
        this.dailyChanges = 0;
        this.lastResetDate = new Date().toDateString();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de precios manuales...');
        
        try {
            // Cargar datos existentes
            this.loadStoredData();
            
            // Configurar validadores
            this.setupValidators();
            
            // Cargar precios de mercado actuales
            await this.refreshMarketPrices();
            
            // Configurar backup automático
            this.setupAutoBackup();
            
            console.log('✅ Sistema de precios manuales inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de precios manuales:', error);
            // Sistema puede funcionar con datos por defecto
        }
    }

    loadStoredData() {
        try {
            // Cargar overrides
            const storedOverrides = localStorage.getItem(MANUAL_PRICING_CONFIG.storage.overridesKey);
            if (storedOverrides) {
                const overridesData = JSON.parse(storedOverrides);
                Object.entries(overridesData).forEach(([key, value]) => {
                    this.overrides.set(key, value);
                });
                console.log(`📊 Cargados ${this.overrides.size} overrides de precios`);
            }

            // Cargar historial
            const storedHistory = localStorage.getItem(MANUAL_PRICING_CONFIG.storage.historyKey);
            if (storedHistory) {
                this.history = JSON.parse(storedHistory);
                console.log(`📚 Cargado historial con ${this.history.length} entradas`);
            }

            // Cargar plantillas
            const storedTemplates = localStorage.getItem(MANUAL_PRICING_CONFIG.storage.templatesKey);
            if (storedTemplates) {
                const templatesData = JSON.parse(storedTemplates);
                Object.entries(templatesData).forEach(([key, value]) => {
                    this.templates.set(key, value);
                });
                console.log(`📋 Cargadas ${this.templates.size} plantillas`);
            }

            // Verificar reset diario
            const today = new Date().toDateString();
            if (this.lastResetDate !== today) {
                this.dailyChanges = 0;
                this.lastResetDate = today;
            }

        } catch (error) {
            console.warn('⚠️ Error cargando datos almacenados:', error);
            this.initializeDefaults();
        }
    }

    initializeDefaults() {
        // Configurar datos por defecto si no se pueden cargar
        this.overrides.clear();
        this.history = [];
        this.templates.clear();
        
        // Crear plantilla por defecto
        this.createDefaultTemplates();
    }

    setupValidators() {
        // Validator para precios mínimos y máximos
        this.validators.set('price_range', (metal, price) => {
            const config = MANUAL_PRICING_CONFIG.metals[metal];
            if (!config) return { valid: false, message: `Metal ${metal} no configurado` };
            
            if (price < config.minPrice) {
                return { 
                    valid: false, 
                    message: `Precio ${price} está por debajo del mínimo (${config.minPrice} MXN/g)` 
                };
            }
            
            if (price > config.maxPrice) {
                return { 
                    valid: false, 
                    message: `Precio ${price} está por encima del máximo (${config.maxPrice} MXN/g)` 
                };
            }
            
            return { valid: true };
        });

        // Validator para desviación del precio de mercado
        this.validators.set('market_deviation', (metal, price) => {
            const marketPrice = this.getMarketPrice(metal);
            if (!marketPrice) return { valid: true }; // Si no hay precio de mercado, no validar
            
            const config = MANUAL_PRICING_CONFIG.metals[metal];
            const deviation = Math.abs(price - marketPrice) / marketPrice;
            
            if (deviation > config.warningThreshold) {
                return {
                    valid: true,
                    warning: true,
                    message: `Precio difiere ${(deviation * 100).toFixed(1)}% del precio de mercado (${marketPrice.toFixed(2)} MXN/g)`
                };
            }
            
            return { valid: true };
        });

        // Validator para límites diarios
        this.validators.set('daily_limit', () => {
            if (this.dailyChanges >= MANUAL_PRICING_CONFIG.validation.maxDailyChanges) {
                return {
                    valid: false,
                    message: `Se alcanzó el límite diario de cambios (${MANUAL_PRICING_CONFIG.validation.maxDailyChanges})`
                };
            }
            return { valid: true };
        });
    }

    async refreshMarketPrices() {
        try {
            // Obtener precios actuales del sistema de pricing global
            if (typeof window !== 'undefined' && window.kitcoPricing) {
                const currentPrices = await window.kitcoPricing.getAllCurrentPrices();
                
                if (currentPrices && currentPrices.mxnPrices) {
                    this.marketPrices.set('gold', currentPrices.mxnPrices.gold);
                    this.marketPrices.set('silver', currentPrices.mxnPrices.silver);
                    this.marketPrices.set('platinum', currentPrices.mxnPrices.platinum);
                    this.marketPrices.set('palladium', currentPrices.mxnPrices.palladium);
                    
                    console.log('📊 Precios de mercado actualizados');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error actualizando precios de mercado:', error);
        }
    }

    setupAutoBackup() {
        // Backup automático cada 24 horas
        setInterval(() => {
            this.createBackup();
        }, MANUAL_PRICING_CONFIG.storage.backupInterval);
    }

    // =================================================================
    // MÉTODOS PRINCIPALES DE OVERRIDE
    // =================================================================

    async setManualPrice(metal, karats, adjustmentType, adjustmentValue, reason, options = {}) {
        try {
            // Validación básica
            if (!metal || !adjustmentType || adjustmentValue === undefined) {
                throw new Error('Parámetros requeridos: metal, adjustmentType, adjustmentValue');
            }

            // Validar metal
            if (!MANUAL_PRICING_CONFIG.metals[metal]) {
                throw new Error(`Metal ${metal} no soportado`);
            }

            // Validar tipo de ajuste
            if (!MANUAL_PRICING_CONFIG.adjustmentTypes[adjustmentType]) {
                throw new Error(`Tipo de ajuste ${adjustmentType} no soportado`);
            }

            // Validar límites del ajuste
            const adjustmentConfig = MANUAL_PRICING_CONFIG.adjustmentTypes[adjustmentType];
            if (adjustmentValue < adjustmentConfig.min || adjustmentValue > adjustmentConfig.max) {
                throw new Error(`Valor de ajuste debe estar entre ${adjustmentConfig.min} y ${adjustmentConfig.max}`);
            }

            // Crear key único
            const overrideKey = this.generateOverrideKey(metal, karats);

            // Calcular precio final
            const finalPrice = await this.calculateFinalPrice(metal, karats, adjustmentType, adjustmentValue);

            // Ejecutar validaciones
            const validationResults = await this.validatePrice(metal, finalPrice);
            
            // Si hay errores de validación, rechazar
            const errors = validationResults.filter(result => !result.valid);
            if (errors.length > 0) {
                throw new Error(`Validación fallida: ${errors.map(e => e.message).join('; ')}`);
            }

            // Crear override
            const override = {
                metal,
                karats,
                adjustmentType,
                adjustmentValue,
                finalPrice,
                reason: reason || 'No especificada',
                basePrice: this.getMarketPrice(metal, karats),
                createdAt: Date.now(),
                createdBy: options.userId || 'system',
                active: true,
                validUntil: options.validUntil || null,
                metadata: options.metadata || {}
            };

            // Verificar warnings
            const warnings = validationResults.filter(result => result.warning);
            if (warnings.length > 0 && !options.confirmWarnings) {
                return {
                    success: false,
                    requiresConfirmation: true,
                    warnings: warnings.map(w => w.message),
                    override: override
                };
            }

            // Guardar override
            this.overrides.set(overrideKey, override);

            // Agregar al historial
            this.addToHistory('CREATE', override);

            // Incrementar contador diario
            this.dailyChanges++;

            // Guardar cambios
            this.saveData();

            console.log(`✅ Override creado: ${metal} ${karats || ''} - ${finalPrice.toFixed(2)} MXN/g`);

            return {
                success: true,
                override: override,
                key: overrideKey,
                warnings: warnings.length > 0 ? warnings.map(w => w.message) : null
            };

        } catch (error) {
            console.error('❌ Error creando override:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateManualPrice(overrideKey, updates, reason) {
        try {
            const existingOverride = this.overrides.get(overrideKey);
            if (!existingOverride) {
                throw new Error('Override no encontrado');
            }

            // Crear override actualizado
            const updatedOverride = {
                ...existingOverride,
                ...updates,
                updatedAt: Date.now(),
                updateReason: reason
            };

            // Si se cambió el valor de ajuste, recalcular precio final
            if (updates.adjustmentType || updates.adjustmentValue !== undefined) {
                updatedOverride.finalPrice = await this.calculateFinalPrice(
                    updatedOverride.metal,
                    updatedOverride.karats,
                    updatedOverride.adjustmentType,
                    updatedOverride.adjustmentValue
                );
            }

            // Validar nuevo precio
            const validationResults = await this.validatePrice(updatedOverride.metal, updatedOverride.finalPrice);
            const errors = validationResults.filter(result => !result.valid);
            
            if (errors.length > 0) {
                throw new Error(`Validación fallida: ${errors.map(e => e.message).join('; ')}`);
            }

            // Actualizar override
            this.overrides.set(overrideKey, updatedOverride);

            // Agregar al historial
            this.addToHistory('UPDATE', updatedOverride, existingOverride);

            // Incrementar contador
            this.dailyChanges++;

            // Guardar cambios
            this.saveData();

            return { success: true, override: updatedOverride };

        } catch (error) {
            console.error('❌ Error actualizando override:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteManualPrice(overrideKey, reason) {
        try {
            const override = this.overrides.get(overrideKey);
            if (!override) {
                throw new Error('Override no encontrado');
            }

            // Marcar como inactivo en lugar de eliminar (para auditoría)
            const deactivatedOverride = {
                ...override,
                active: false,
                deactivatedAt: Date.now(),
                deactivationReason: reason
            };

            this.overrides.set(overrideKey, deactivatedOverride);

            // Agregar al historial
            this.addToHistory('DELETE', deactivatedOverride);

            // Incrementar contador
            this.dailyChanges++;

            // Guardar cambios
            this.saveData();

            console.log(`🗑️ Override desactivado: ${overrideKey}`);

            return { success: true };

        } catch (error) {
            console.error('❌ Error eliminando override:', error);
            return { success: false, error: error.message };
        }
    }

    // =================================================================
    // CÁLCULOS Y VALIDACIONES
    // =================================================================

    async calculateFinalPrice(metal, karats, adjustmentType, adjustmentValue) {
        const basePrice = this.getMarketPrice(metal, karats) || 0;
        
        switch (adjustmentType) {
            case 'percentage':
                return basePrice * (1 + adjustmentValue / 100);
                
            case 'fixed_amount':
                return basePrice + adjustmentValue;
                
            case 'fixed_price':
                return adjustmentValue;
                
            default:
                throw new Error(`Tipo de ajuste no soportado: ${adjustmentType}`);
        }
    }

    async validatePrice(metal, finalPrice) {
        const results = [];
        
        // Ejecutar todos los validadores
        for (const [name, validator] of this.validators.entries()) {
            try {
                const result = await validator(metal, finalPrice);
                if (result) {
                    results.push({ name, ...result });
                }
            } catch (error) {
                results.push({
                    name,
                    valid: false,
                    message: `Error en validador ${name}: ${error.message}`
                });
            }
        }
        
        return results;
    }

    getMarketPrice(metal, karats = null) {
        let basePrice = this.marketPrices.get(metal);
        
        if (!basePrice) {
            // Precios fallback actualizados enero 2025 (MXN por gramo)
            const fallbackPrices = {
                gold: 1710,      // $2,700/oz ÷ 31.1035 * 19.8 = $1,710 MXN/g
                silver: 24,      // $38/oz ÷ 31.1035 * 19.8 = $24 MXN/g
                platinum: 620,   // $975/oz ÷ 31.1035 * 19.8 = $620 MXN/g
                palladium: 890   // $1,400/oz ÷ 31.1035 * 19.8 = $890 MXN/g
            };
            basePrice = fallbackPrices[metal] || 0;
        }

        // Ajustar por quilates si es oro
        if (metal === 'gold' && karats) {
            const purity = {
                '10k': 0.4167,
                '14k': 0.5833,
                '18k': 0.750,
                '22k': 0.9167,
                '24k': 1.000
            };
            basePrice *= (purity[karats] || 1);
        }

        return basePrice;
    }

    generateOverrideKey(metal, karats) {
        return karats ? `${metal}_${karats}` : metal;
    }

    // =================================================================
    // GESTIÓN DE HISTORIAL Y AUDITORÍA
    // =================================================================

    addToHistory(action, newData, oldData = null) {
        const historyEntry = {
            id: Date.now(),
            action,
            timestamp: Date.now(),
            metal: newData.metal,
            karats: newData.karats,
            newValue: newData.finalPrice,
            oldValue: oldData ? oldData.finalPrice : null,
            reason: newData.reason || newData.updateReason || newData.deactivationReason,
            user: newData.createdBy || 'system',
            metadata: {
                adjustmentType: newData.adjustmentType,
                adjustmentValue: newData.adjustmentValue,
                basePrice: newData.basePrice
            }
        };

        this.history.unshift(historyEntry);

        // Mantener límite de historial
        if (this.history.length > MANUAL_PRICING_CONFIG.storage.maxHistoryEntries) {
            this.history = this.history.slice(0, MANUAL_PRICING_CONFIG.storage.maxHistoryEntries);
        }
    }

    getHistory(filters = {}) {
        let filteredHistory = [...this.history];

        if (filters.metal) {
            filteredHistory = filteredHistory.filter(entry => entry.metal === filters.metal);
        }

        if (filters.action) {
            filteredHistory = filteredHistory.filter(entry => entry.action === filters.action);
        }

        if (filters.dateFrom) {
            filteredHistory = filteredHistory.filter(entry => entry.timestamp >= filters.dateFrom);
        }

        if (filters.dateTo) {
            filteredHistory = filteredHistory.filter(entry => entry.timestamp <= filters.dateTo);
        }

        if (filters.user) {
            filteredHistory = filteredHistory.filter(entry => entry.user === filters.user);
        }

        return filteredHistory;
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA OBTENER PRECIOS
    // =================================================================

    async getPrice(metal, karats = null, weight = 1) {
        const overrideKey = this.generateOverrideKey(metal, karats);
        const override = this.overrides.get(overrideKey);
        
        // Si hay override activo, usarlo
        if (override && override.active) {
            // Verificar si está expirado
            if (override.validUntil && Date.now() > override.validUntil) {
                // Marcar como expirado
                override.active = false;
                override.expiredAt = Date.now();
                this.saveData();
            } else {
                const totalPrice = override.finalPrice * weight;
                return {
                    pricePerGram: override.finalPrice,
                    totalPrice,
                    source: 'manual_override',
                    override: {
                        reason: override.reason,
                        createdAt: override.createdAt,
                        adjustmentType: override.adjustmentType,
                        adjustmentValue: override.adjustmentValue,
                        basePrice: override.basePrice
                    },
                    metal,
                    karats,
                    weight
                };
            }
        }

        // Si no hay override, usar precio de mercado
        const marketPrice = this.getMarketPrice(metal, karats);
        const totalPrice = marketPrice * weight;
        
        return {
            pricePerGram: marketPrice,
            totalPrice,
            source: 'market',
            metal,
            karats,
            weight
        };
    }

    getAllActiveOverrides() {
        const activeOverrides = new Map();
        
        for (const [key, override] of this.overrides.entries()) {
            if (override.active && (!override.validUntil || Date.now() < override.validUntil)) {
                activeOverrides.set(key, override);
            }
        }
        
        return activeOverrides;
    }

    getOverrideStats() {
        const stats = {
            total: this.overrides.size,
            active: 0,
            expired: 0,
            byMetal: {},
            averageDeviation: 0,
            dailyChanges: this.dailyChanges,
            totalSavings: 0
        };

        let deviationSum = 0;
        let deviationCount = 0;
        let totalSavings = 0;

        for (const override of this.overrides.values()) {
            // Contar por estado
            if (override.active) {
                stats.active++;
            } else {
                stats.expired++;
            }

            // Contar por metal
            if (!stats.byMetal[override.metal]) {
                stats.byMetal[override.metal] = { active: 0, total: 0 };
            }
            stats.byMetal[override.metal].total++;
            if (override.active) {
                stats.byMetal[override.metal].active++;
            }

            // Calcular desviación promedio del mercado
            if (override.basePrice && override.finalPrice) {
                const deviation = Math.abs(override.finalPrice - override.basePrice) / override.basePrice;
                deviationSum += deviation;
                deviationCount++;

                // Calcular ahorro/costo adicional
                const saving = override.basePrice - override.finalPrice;
                totalSavings += saving;
            }
        }

        if (deviationCount > 0) {
            stats.averageDeviation = (deviationSum / deviationCount) * 100;
        }

        stats.totalSavings = totalSavings;

        return stats;
    }

    // =================================================================
    // PLANTILLAS Y PRESETS
    // =================================================================

    createTemplate(name, config) {
        const template = {
            name,
            config,
            createdAt: Date.now(),
            usageCount: 0
        };

        this.templates.set(name, template);
        this.saveData();

        return template;
    }

    createDefaultTemplates() {
        // Plantilla para descuento de mayorista
        this.createTemplate('Descuento Mayorista', {
            adjustmentType: 'percentage',
            adjustmentValue: -15,
            reason: 'Cliente mayorista',
            description: 'Descuento del 15% para clientes mayoristas'
        });

        // Plantilla para markup premium
        this.createTemplate('Calidad Premium', {
            adjustmentType: 'percentage', 
            adjustmentValue: 25,
            reason: 'Calidad premium del material',
            description: 'Incremento del 25% por calidad premium'
        });

        // Plantilla para precio de competencia
        this.createTemplate('Precio Competitivo', {
            adjustmentType: 'percentage',
            adjustmentValue: -8,
            reason: 'Precio de competencia',
            description: 'Descuento del 8% para igualar competencia'
        });
    }

    applyTemplate(templateName, metal, karats, options = {}) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Plantilla ${templateName} no encontrada`);
        }

        // Incrementar contador de uso
        template.usageCount++;

        // Aplicar override usando la plantilla
        return this.setManualPrice(
            metal,
            karats,
            template.config.adjustmentType,
            template.config.adjustmentValue,
            template.config.reason,
            options
        );
    }

    // =================================================================
    // PERSISTENCIA Y BACKUP
    // =================================================================

    saveData() {
        try {
            // Guardar overrides
            const overridesObj = Object.fromEntries(this.overrides);
            localStorage.setItem(MANUAL_PRICING_CONFIG.storage.overridesKey, JSON.stringify(overridesObj));

            // Guardar historial
            localStorage.setItem(MANUAL_PRICING_CONFIG.storage.historyKey, JSON.stringify(this.history));

            // Guardar plantillas
            const templatesObj = Object.fromEntries(this.templates);
            localStorage.setItem(MANUAL_PRICING_CONFIG.storage.templatesKey, JSON.stringify(templatesObj));

            // Guardar estado del sistema
            const systemState = {
                dailyChanges: this.dailyChanges,
                lastResetDate: this.lastResetDate,
                lastSave: Date.now()
            };
            localStorage.setItem('manual_pricing_system_state', JSON.stringify(systemState));

        } catch (error) {
            console.error('❌ Error guardando datos:', error);
        }
    }

    createBackup() {
        const backup = {
            version: '1.0',
            timestamp: Date.now(),
            overrides: Object.fromEntries(this.overrides),
            history: this.history,
            templates: Object.fromEntries(this.templates),
            stats: this.getOverrideStats()
        };

        const backupKey = `manual_pricing_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));

        // Mantener solo los últimos 7 backups
        this.cleanupOldBackups();

        console.log('💾 Backup creado:', backupKey);
        return backupKey;
    }

    cleanupOldBackups() {
        const backupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('manual_pricing_backup_')) {
                backupKeys.push({ key, timestamp: parseInt(key.split('_')[3]) });
            }
        }

        // Ordenar por timestamp y mantener solo los 7 más recientes
        backupKeys.sort((a, b) => b.timestamp - a.timestamp);
        backupKeys.slice(7).forEach(backup => {
            localStorage.removeItem(backup.key);
        });
    }

    exportData(format = 'json') {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            overrides: Object.fromEntries(this.overrides),
            history: this.history,
            templates: Object.fromEntries(this.templates),
            stats: this.getOverrideStats()
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }

        if (format === 'csv') {
            // Convertir overrides a CSV
            const headers = ['Metal', 'Karats', 'Tipo Ajuste', 'Valor Ajuste', 'Precio Final', 'Precio Base', 'Razón', 'Activo', 'Creado'];
            const rows = Array.from(this.overrides.values()).map(override => [
                override.metal,
                override.karats || '',
                override.adjustmentType,
                override.adjustmentValue,
                override.finalPrice,
                override.basePrice,
                override.reason,
                override.active ? 'Sí' : 'No',
                new Date(override.createdAt).toLocaleDateString('es-MX')
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        return data;
    }
}

// =================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.manualPricingSystem = new ManualPricingSystem();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ManualPricingSystem,
        MANUAL_PRICING_CONFIG
    };
}

console.log('✅ Sistema de Precios Manuales v1.0 cargado correctamente');