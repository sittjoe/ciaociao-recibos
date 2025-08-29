// customer-tier-pricing.js - SISTEMA DE PRECIOS POR TIER DE CLIENTE v1.0
// Gestión completa de niveles de cliente con descuentos por volumen y beneficios escalonados
// =======================================================================================

console.log('👥 Iniciando Sistema de Precios por Tier de Cliente v1.0...');

// =======================================================================================
// CONFIGURACIÓN DEL SISTEMA DE TIERS DE CLIENTE
// =======================================================================================

const CUSTOMER_TIER_CONFIG = {
    // Definición de tiers con criterios y beneficios
    tiers: {
        retail: {
            name: 'Cliente Menudeo',
            description: 'Cliente individual, compras ocasionales',
            code: 'RET',
            color: '#808080',
            icon: '👤',
            criteria: {
                minAnnualPurchase: 0,        // Sin mínimo
                minOrderValue: 0,            // Sin mínimo por pedido
                maxOrdersPerMonth: 2,        // Máximo 2 pedidos/mes para mantenerse en retail
                accountAge: 0                // Sin requisito de antigüedad
            },
            pricing: {
                baseMultiplier: 1.0,         // Precio base (sin descuento)
                volumeDiscounts: {
                    5000: 0.02,              // 2% desc. en pedidos >$5,000
                    10000: 0.05,             // 5% desc. en pedidos >$10,000
                    20000: 0.08              // 8% desc. en pedidos >$20,000
                },
                seasonalBonusMultiplier: 1.0, // Sin bonificación estacional
                loyaltyDiscountCap: 0.05     // Máximo 5% descuento por lealtad
            },
            benefits: {
                freeShipping: false,
                prioritySupport: false,
                extendedWarranty: false,
                exclusiveProducts: false,
                customDesign: false,
                paymentTerms: 'inmediato'    // Pago inmediato
            }
        },
        wholesale: {
            name: 'Cliente Mayorista',
            description: 'Revendedores y distribuidores con volumen constante',
            code: 'WHO',
            color: '#4CAF50',
            icon: '🏢',
            criteria: {
                minAnnualPurchase: 100000,   // $100,000 anuales mínimo
                minOrderValue: 10000,        // $10,000 mínimo por pedido
                maxOrdersPerMonth: 999,      // Sin límite
                accountAge: 90,              // 3 meses mínimo como cliente
                businessLicense: true        // Requiere licencia comercial
            },
            pricing: {
                baseMultiplier: 0.60,        // 40% descuento base como especificado
                volumeDiscounts: {
                    25000: 0.05,             // +5% desc. en pedidos >$25,000
                    50000: 0.08,             // +8% desc. en pedidos >$50,000
                    100000: 0.12,            // +12% desc. en pedidos >$100,000
                    250000: 0.15             // +15% desc. en pedidos >$250,000
                },
                seasonalBonusMultiplier: 1.02, // +2% bonificación estacional
                loyaltyDiscountCap: 0.10     // Máximo 10% descuento por lealtad
            },
            benefits: {
                freeShipping: true,
                prioritySupport: true,
                extendedWarranty: true,      // 2 años en lugar de 1
                exclusiveProducts: false,
                customDesign: true,
                paymentTerms: '30_dias',     // Crédito a 30 días
                bulkOrderSupport: true,
                dedicatedAccount: false
            }
        },
        premium: {
            name: 'Cliente Premium',
            description: 'Clientes VIP con alto valor de compra y lealtad',
            code: 'PRM',
            color: '#FF9800',
            icon: '⭐',
            criteria: {
                minAnnualPurchase: 250000,   // $250,000 anuales mínimo
                minOrderValue: 15000,        // $15,000 mínimo por pedido
                maxOrdersPerMonth: 999,      // Sin límite
                accountAge: 365,             // 1 año mínimo como cliente
                averageOrderValue: 25000     // Promedio >$25,000 por pedido
            },
            pricing: {
                baseMultiplier: 0.40,        // 60% descuento base como especificado
                volumeDiscounts: {
                    50000: 0.03,             // +3% desc. en pedidos >$50,000
                    100000: 0.06,            // +6% desc. en pedidos >$100,000
                    200000: 0.10,            // +10% desc. en pedidos >$200,000
                    500000: 0.15             // +15% desc. en pedidos >$500,000
                },
                seasonalBonusMultiplier: 1.05, // +5% bonificación estacional
                loyaltyDiscountCap: 0.15     // Máximo 15% descuento por lealtad
            },
            benefits: {
                freeShipping: true,
                prioritySupport: true,
                extendedWarranty: true,      // 3 años
                exclusiveProducts: true,     // Acceso a productos exclusivos
                customDesign: true,
                paymentTerms: '45_dias',     // Crédito a 45 días
                bulkOrderSupport: true,
                dedicatedAccount: true,      // Gerente de cuenta dedicado
                firstAccessToNewProducts: true,
                inviteOnlyEvents: true
            }
        },
        vip: {
            name: 'Cliente VIP Elite',
            description: 'Nivel más alto, clientes institucionales y coleccionistas',
            code: 'VIP',
            color: '#9C27B0',
            icon: '💎',
            criteria: {
                minAnnualPurchase: 500000,   // $500,000 anuales mínimo
                minOrderValue: 25000,        // $25,000 mínimo por pedido
                maxOrdersPerMonth: 999,      // Sin límite
                accountAge: 730,             // 2 años mínimo como cliente
                averageOrderValue: 50000,    // Promedio >$50,000 por pedido
                referralHistory: true        // Debe haber referido otros clientes
            },
            pricing: {
                baseMultiplier: 0.35,        // 65% descuento base (mejor que premium)
                volumeDiscounts: {
                    100000: 0.02,            // +2% desc. en pedidos >$100,000
                    250000: 0.05,            // +5% desc. en pedidos >$250,000
                    500000: 0.08,            // +8% desc. en pedidos >$500,000
                    1000000: 0.12            // +12% desc. en pedidos >$1,000,000
                },
                seasonalBonusMultiplier: 1.08, // +8% bonificación estacional
                loyaltyDiscountCap: 0.20     // Máximo 20% descuento por lealtad
            },
            benefits: {
                freeShipping: true,
                prioritySupport: true,
                extendedWarranty: true,      // 5 años
                exclusiveProducts: true,
                customDesign: true,
                paymentTerms: '60_dias',     // Crédito a 60 días
                bulkOrderSupport: true,
                dedicatedAccount: true,
                firstAccessToNewProducts: true,
                inviteOnlyEvents: true,
                personalShopper: true,       // Servicio de comprador personal
                whiteGloveService: true,     // Servicio premium de entrega
                customPackaging: true,      // Empaque personalizado
                conciergeService: true      // Servicios de conserjería
            }
        }
    },

    // Configuración de descuentos por volumen anual
    annualVolumeDiscounts: {
        50000: 0.01,                     // 1% adicional por >$50k anuales
        100000: 0.02,                    // 2% adicional por >$100k anuales
        250000: 0.03,                    // 3% adicional por >$250k anuales
        500000: 0.05,                    // 5% adicional por >$500k anuales
        1000000: 0.08,                   // 8% adicional por >$1M anuales
        2500000: 0.10,                   // 10% adicional por >$2.5M anuales
        5000000: 0.12                    // 12% adicional por >$5M anuales
    },

    // Sistema de puntos de lealtad
    loyaltyProgram: {
        pointsPerPeso: 0.001,            // 1 punto por cada peso gastado
        pointRedemptionValue: 1.0,       // 1 punto = 1 peso
        bonusMultipliers: {
            retail: 1.0,                 // Sin bonificación
            wholesale: 1.2,              // +20% puntos
            premium: 1.5,                // +50% puntos  
            vip: 2.0                     // +100% puntos
        },
        redemptionLimits: {
            retail: 0.05,                // Máximo 5% del pedido en puntos
            wholesale: 0.08,             // Máximo 8% del pedido en puntos
            premium: 0.12,               // Máximo 12% del pedido en puntos
            vip: 0.20                    // Máximo 20% del pedido en puntos
        }
    },

    // Condiciones especiales por temporada
    seasonalConditions: {
        january: { multiplier: 0.95, description: 'Enero: Descuento post-navideño' },
        february: { multiplier: 1.05, description: 'Febrero: San Valentín premium' },
        march: { multiplier: 1.0, description: 'Marzo: Precios normales' },
        april: { multiplier: 1.02, description: 'Abril: Temporada de bodas' },
        may: { multiplier: 1.10, description: 'Mayo: Día de las Madres premium' },
        june: { multiplier: 1.03, description: 'Junio: Temporada de graduaciones' },
        july: { multiplier: 0.98, description: 'Julio: Temporada baja' },
        august: { multiplier: 0.96, description: 'Agosto: Regreso a clases' },
        september: { multiplier: 1.02, description: 'Septiembre: Fiestas Patrias' },
        october: { multiplier: 1.01, description: 'Octubre: Halloween/Día de Muertos' },
        november: { multiplier: 1.08, description: 'Noviembre: Pre-navidad' },
        december: { multiplier: 1.15, description: 'Diciembre: Temporada navideña premium' }
    },

    // Configuración del sistema
    systemSettings: {
        tierEvaluationPeriod: 90,        // Evaluar tier cada 90 días
        promotionEligibilityDays: 30,    // 30 días para ser elegible a promoción
        demotionGracePeriod: 180,        // 180 días de gracia antes de degradar
        maxAutomaticDiscount: 0.50,      // 50% descuento automático máximo
        requireApprovalThreshold: 0.40,  // >40% descuento requiere aprobación
        pointsExpirationMonths: 12       // Puntos expiran en 12 meses
    },

    // Configuración de almacenamiento
    storage: {
        customersKey: 'customer_tier_data',
        transactionsKey: 'customer_transactions',
        loyaltyKey: 'customer_loyalty_points',
        promotionsKey: 'tier_promotions_history',
        maxHistoryEntries: 1000
    }
};

// =======================================================================================
// CLASE PRINCIPAL DEL SISTEMA DE TIERS DE CLIENTE
// =======================================================================================

class CustomerTierPricingSystem {
    constructor() {
        this.config = CUSTOMER_TIER_CONFIG;
        this.customers = new Map();
        this.transactions = new Map();
        this.loyaltyPoints = new Map();
        this.promotionHistory = [];
        this.observers = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando Sistema de Tiers de Cliente...');
        
        try {
            // Cargar datos de clientes
            this.loadCustomerData();
            
            // Cargar historial de transacciones
            this.loadTransactionHistory();
            
            // Cargar puntos de lealtad
            this.loadLoyaltyPoints();
            
            // Cargar historial de promociones
            this.loadPromotionHistory();
            
            // Configurar evaluación automática de tiers
            this.setupTierEvaluation();
            
            console.log('✅ Sistema de tiers de cliente inicializado');
            console.log(`👥 ${this.customers.size} clientes cargados`);
            console.log(`💰 ${this.transactions.size} transacciones en historial`);
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de tiers:', error);
        }
    }

    loadCustomerData() {
        try {
            const customerData = localStorage.getItem(this.config.storage.customersKey);
            if (customerData) {
                const customers = JSON.parse(customerData);
                this.customers = new Map(Object.entries(customers));
                console.log('👥 Datos de clientes cargados');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando datos de clientes:', error);
        }
    }

    loadTransactionHistory() {
        try {
            const transactionData = localStorage.getItem(this.config.storage.transactionsKey);
            if (transactionData) {
                const transactions = JSON.parse(transactionData);
                this.transactions = new Map(Object.entries(transactions));
                console.log('💰 Historial de transacciones cargado');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando transacciones:', error);
        }
    }

    loadLoyaltyPoints() {
        try {
            const loyaltyData = localStorage.getItem(this.config.storage.loyaltyKey);
            if (loyaltyData) {
                const points = JSON.parse(loyaltyData);
                this.loyaltyPoints = new Map(Object.entries(points));
                console.log('⭐ Puntos de lealtad cargados');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando puntos de lealtad:', error);
        }
    }

    loadPromotionHistory() {
        try {
            const promotionData = localStorage.getItem(this.config.storage.promotionsKey);
            if (promotionData) {
                this.promotionHistory = JSON.parse(promotionData);
                console.log('📈 Historial de promociones cargado');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando historial de promociones:', error);
        }
    }

    setupTierEvaluation() {
        // Evaluar tiers cada día a las 2 AM
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        
        const millisecondsUntil2AM = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.evaluateAllCustomerTiers();
            
            // Luego evaluar cada 24 horas
            setInterval(() => {
                this.evaluateAllCustomerTiers();
            }, 24 * 60 * 60 * 1000);
            
        }, millisecondsUntil2AM);
        
        console.log('⏰ Evaluación automática de tiers programada');
    }

    // =======================================================================================
    // GESTIÓN DE CLIENTES
    // =======================================================================================

    registerCustomer(customerData) {
        const {
            customerId,
            name,
            email,
            phone,
            businessLicense = null,
            referredBy = null,
            initialTier = 'retail'
        } = customerData;

        if (!customerId || !name) {
            throw new Error('ID y nombre del cliente son requeridos');
        }

        const customer = {
            customerId: customerId,
            name: name,
            email: email,
            phone: phone,
            businessLicense: businessLicense,
            referredBy: referredBy,
            currentTier: initialTier,
            registrationDate: Date.now(),
            lastTierEvaluation: Date.now(),
            tierHistory: [{
                tier: initialTier,
                effectiveDate: Date.now(),
                reason: 'initial_registration'
            }],
            totalLifetimeValue: 0,
            totalAnnualValue: 0,
            averageOrderValue: 0,
            orderCount: 0,
            lastOrderDate: null,
            notes: [],
            isActive: true
        };

        this.customers.set(customerId, customer);
        this.saveCustomerData();

        console.log(`👥 Cliente registrado: ${name} (${customerId}) - Tier: ${initialTier}`);

        return customer;
    }

    updateCustomerTier(customerId, newTier, reason = 'manual_update') {
        const customer = this.customers.get(customerId);
        if (!customer) {
            throw new Error(`Cliente ${customerId} no encontrado`);
        }

        const previousTier = customer.currentTier;
        
        if (previousTier === newTier) {
            console.log(`ℹ️ Cliente ${customerId} ya está en tier ${newTier}`);
            return customer;
        }

        // Verificar si cumple criterios del nuevo tier
        if (!this.verifyTierCriteria(customerId, newTier)) {
            console.warn(`⚠️ Cliente ${customerId} no cumple criterios para tier ${newTier}`);
            if (reason === 'automatic_evaluation') {
                return customer; // No cambiar si es evaluación automática
            }
        }

        // Actualizar tier
        customer.currentTier = newTier;
        customer.lastTierEvaluation = Date.now();
        customer.tierHistory.push({
            tier: newTier,
            previousTier: previousTier,
            effectiveDate: Date.now(),
            reason: reason
        });

        // Registrar en historial de promociones
        this.promotionHistory.unshift({
            customerId: customerId,
            customerName: customer.name,
            fromTier: previousTier,
            toTier: newTier,
            date: Date.now(),
            reason: reason
        });

        this.saveCustomerData();
        this.savePromotionHistory();

        // Notificar cambio
        this.notifyObservers('tier_changed', {
            customerId: customerId,
            customerName: customer.name,
            fromTier: previousTier,
            toTier: newTier,
            reason: reason
        });

        console.log(`🔄 Cliente ${customer.name} promovido: ${previousTier} → ${newTier} (${reason})`);

        return customer;
    }

    verifyTierCriteria(customerId, targetTier) {
        const customer = this.customers.get(customerId);
        const tierConfig = this.config.tiers[targetTier];
        
        if (!customer || !tierConfig) {
            return false;
        }

        const criteria = tierConfig.criteria;
        const customerTransactions = this.getCustomerTransactions(customerId);
        
        // Calcular métricas del cliente
        const metrics = this.calculateCustomerMetrics(customerId);
        
        // Verificar criterios
        const checks = {
            annualPurchase: metrics.annualPurchase >= criteria.minAnnualPurchase,
            orderValue: metrics.averageOrderValue >= (criteria.minOrderValue || 0),
            accountAge: (Date.now() - customer.registrationDate) >= (criteria.accountAge * 24 * 60 * 60 * 1000),
            businessLicense: !criteria.businessLicense || customer.businessLicense,
            averageOrder: !criteria.averageOrderValue || metrics.averageOrderValue >= criteria.averageOrderValue,
            referralHistory: !criteria.referralHistory || this.hasReferralHistory(customerId)
        };

        const allMet = Object.values(checks).every(check => check);
        
        if (!allMet) {
            console.log(`❌ Criterios no cumplidos para ${targetTier}:`, checks);
        }
        
        return allMet;
    }

    hasReferralHistory(customerId) {
        // Verificar si el cliente ha referido otros clientes
        return Array.from(this.customers.values()).some(customer => 
            customer.referredBy === customerId
        );
    }

    calculateCustomerMetrics(customerId) {
        const transactions = this.getCustomerTransactions(customerId);
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        
        const annualTransactions = transactions.filter(t => t.date >= oneYearAgo);
        const annualPurchase = annualTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalPurchase = transactions.reduce((sum, t) => sum + t.amount, 0);
        const averageOrderValue = transactions.length > 0 ? totalPurchase / transactions.length : 0;
        
        return {
            annualPurchase,
            totalPurchase,
            averageOrderValue,
            orderCount: transactions.length,
            annualOrderCount: annualTransactions.length,
            lastOrderDate: transactions.length > 0 ? Math.max(...transactions.map(t => t.date)) : null
        };
    }

    // =======================================================================================
    // SISTEMA DE PRECIOS Y DESCUENTOS
    // =======================================================================================

    calculatePrice(customerId, basePrice, options = {}) {
        const {
            orderValue = basePrice,
            useSeasonalPricing = true,
            useLoyaltyPoints = 0,
            applyVolumeDiscounts = true,
            region = 'cdmx'
        } = options;

        const customer = this.customers.get(customerId);
        if (!customer) {
            throw new Error(`Cliente ${customerId} no encontrado`);
        }

        const tierConfig = this.config.tiers[customer.currentTier];
        const pricing = tierConfig.pricing;
        
        let finalPrice = basePrice;
        const discountBreakdown = {
            original: basePrice,
            tierDiscount: 0,
            volumeDiscount: 0,
            annualVolumeDiscount: 0,
            seasonalAdjustment: 0,
            loyaltyPointsUsed: 0,
            loyaltyDiscount: 0,
            finalPrice: 0
        };

        // 1. Aplicar descuento base del tier
        const tierDiscount = basePrice * (1 - pricing.baseMultiplier);
        finalPrice = basePrice * pricing.baseMultiplier;
        discountBreakdown.tierDiscount = tierDiscount;

        // 2. Aplicar descuentos por volumen del pedido
        if (applyVolumeDiscounts) {
            const volumeDiscountRate = this.getVolumeDiscountRate(orderValue, pricing.volumeDiscounts);
            const volumeDiscount = finalPrice * volumeDiscountRate;
            finalPrice -= volumeDiscount;
            discountBreakdown.volumeDiscount = volumeDiscount;
        }

        // 3. Aplicar descuentos por volumen anual
        const customerMetrics = this.calculateCustomerMetrics(customerId);
        const annualVolumeDiscountRate = this.getVolumeDiscountRate(
            customerMetrics.annualPurchase, 
            this.config.annualVolumeDiscounts
        );
        const annualVolumeDiscount = finalPrice * annualVolumeDiscountRate;
        finalPrice -= annualVolumeDiscount;
        discountBreakdown.annualVolumeDiscount = annualVolumeDiscount;

        // 4. Aplicar ajuste estacional
        if (useSeasonalPricing) {
            const month = new Date().getMonth();
            const monthName = Object.keys(this.config.seasonalConditions)[month];
            const seasonalMultiplier = this.config.seasonalConditions[monthName].multiplier;
            const tierSeasonalBonus = pricing.seasonalBonusMultiplier;
            
            const combinedSeasonalMultiplier = seasonalMultiplier * tierSeasonalBonus;
            const seasonalAdjustment = finalPrice * (combinedSeasonalMultiplier - 1);
            finalPrice *= combinedSeasonalMultiplier;
            discountBreakdown.seasonalAdjustment = seasonalAdjustment;
        }

        // 5. Aplicar puntos de lealtad
        if (useLoyaltyPoints > 0) {
            const availablePoints = this.getLoyaltyPoints(customerId);
            const maxRedeemablePoints = Math.floor(finalPrice * this.config.loyaltyProgram.redemptionLimits[customer.currentTier]);
            const pointsToUse = Math.min(useLoyaltyPoints, availablePoints, maxRedeemablePoints);
            
            const loyaltyDiscount = pointsToUse * this.config.loyaltyProgram.pointRedemptionValue;
            finalPrice -= loyaltyDiscount;
            discountBreakdown.loyaltyPointsUsed = pointsToUse;
            discountBreakdown.loyaltyDiscount = loyaltyDiscount;
        }

        discountBreakdown.finalPrice = finalPrice;

        // Verificar límites de descuento
        const totalDiscountPercent = (basePrice - finalPrice) / basePrice;
        if (totalDiscountPercent > this.config.systemSettings.maxAutomaticDiscount) {
            console.warn(`⚠️ Descuento total ${(totalDiscountPercent * 100).toFixed(1)}% excede límite automático`);
        }

        return {
            customerId: customerId,
            customerName: customer.name,
            currentTier: customer.currentTier,
            pricing: discountBreakdown,
            totalSavings: basePrice - finalPrice,
            savingsPercentage: totalDiscountPercent,
            requiresApproval: totalDiscountPercent > this.config.systemSettings.requireApprovalThreshold,
            calculation: {
                basePrice: basePrice,
                orderValue: orderValue,
                finalPrice: finalPrice,
                effectiveDiscountRate: totalDiscountPercent
            },
            timestamp: Date.now()
        };
    }

    getVolumeDiscountRate(amount, volumeDiscounts) {
        let discountRate = 0;
        
        // Encontrar el descuento aplicable más alto
        Object.keys(volumeDiscounts).forEach(threshold => {
            if (amount >= parseFloat(threshold)) {
                discountRate = Math.max(discountRate, volumeDiscounts[threshold]);
            }
        });
        
        return discountRate;
    }

    // =======================================================================================
    // SISTEMA DE PUNTOS DE LEALTAD
    // =======================================================================================

    addLoyaltyPoints(customerId, orderAmount) {
        const customer = this.customers.get(customerId);
        if (!customer) {
            throw new Error(`Cliente ${customerId} no encontrado`);
        }

        const tierConfig = this.config.tiers[customer.currentTier];
        const basePoints = orderAmount * this.config.loyaltyProgram.pointsPerPeso;
        const bonusMultiplier = this.config.loyaltyProgram.bonusMultipliers[customer.currentTier];
        const totalPoints = Math.floor(basePoints * bonusMultiplier);

        if (!this.loyaltyPoints.has(customerId)) {
            this.loyaltyPoints.set(customerId, {
                totalPoints: 0,
                availablePoints: 0,
                history: []
            });
        }

        const loyaltyData = this.loyaltyPoints.get(customerId);
        loyaltyData.totalPoints += totalPoints;
        loyaltyData.availablePoints += totalPoints;
        loyaltyData.history.unshift({
            type: 'earned',
            points: totalPoints,
            orderAmount: orderAmount,
            date: Date.now(),
            expirationDate: Date.now() + (this.config.systemSettings.pointsExpirationMonths * 30 * 24 * 60 * 60 * 1000)
        });

        this.saveLoyaltyPoints();

        console.log(`⭐ ${customer.name} ganó ${totalPoints} puntos de lealtad`);

        return totalPoints;
    }

    redeemLoyaltyPoints(customerId, pointsToRedeem) {
        const loyaltyData = this.loyaltyPoints.get(customerId);
        if (!loyaltyData) {
            throw new Error(`No hay datos de lealtad para cliente ${customerId}`);
        }

        if (pointsToRedeem > loyaltyData.availablePoints) {
            throw new Error(`Puntos insuficientes. Disponibles: ${loyaltyData.availablePoints}, solicitados: ${pointsToRedeem}`);
        }

        loyaltyData.availablePoints -= pointsToRedeem;
        loyaltyData.history.unshift({
            type: 'redeemed',
            points: -pointsToRedeem,
            value: pointsToRedeem * this.config.loyaltyProgram.pointRedemptionValue,
            date: Date.now()
        });

        this.saveLoyaltyPoints();

        return pointsToRedeem * this.config.loyaltyProgram.pointRedemptionValue;
    }

    getLoyaltyPoints(customerId) {
        const loyaltyData = this.loyaltyPoints.get(customerId);
        if (!loyaltyData) {
            return 0;
        }

        // Limpiar puntos expirados
        this.cleanupExpiredPoints(customerId);

        return loyaltyData.availablePoints;
    }

    cleanupExpiredPoints(customerId) {
        const loyaltyData = this.loyaltyPoints.get(customerId);
        if (!loyaltyData) return;

        const now = Date.now();
        const expiredEntries = loyaltyData.history.filter(entry => 
            entry.type === 'earned' && entry.expirationDate < now
        );

        const expiredPoints = expiredEntries.reduce((sum, entry) => sum + entry.points, 0);
        
        if (expiredPoints > 0) {
            loyaltyData.availablePoints -= expiredPoints;
            loyaltyData.history.unshift({
                type: 'expired',
                points: -expiredPoints,
                date: now
            });

            console.log(`⏰ ${expiredPoints} puntos expirados para cliente ${customerId}`);
        }
    }

    // =======================================================================================
    // TRANSACCIONES Y MÉTRICAS
    // =======================================================================================

    recordTransaction(customerId, transactionData) {
        const {
            orderId,
            amount,
            items = [],
            paymentMethod = 'unknown',
            notes = ''
        } = transactionData;

        const transaction = {
            orderId: orderId,
            customerId: customerId,
            amount: amount,
            items: items,
            paymentMethod: paymentMethod,
            notes: notes,
            date: Date.now()
        };

        // Agregar a historial de transacciones
        if (!this.transactions.has(customerId)) {
            this.transactions.set(customerId, []);
        }
        this.transactions.get(customerId).unshift(transaction);

        // Actualizar métricas del cliente
        const customer = this.customers.get(customerId);
        if (customer) {
            customer.totalLifetimeValue += amount;
            customer.orderCount += 1;
            customer.lastOrderDate = Date.now();
            
            // Recalcular promedio de pedidos
            customer.averageOrderValue = customer.totalLifetimeValue / customer.orderCount;
            
            // Recalcular valor anual
            const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
            const annualTransactions = this.transactions.get(customerId).filter(t => t.date >= oneYearAgo);
            customer.totalAnnualValue = annualTransactions.reduce((sum, t) => sum + t.amount, 0);
        }

        // Agregar puntos de lealtad
        this.addLoyaltyPoints(customerId, amount);

        this.saveCustomerData();
        this.saveTransactionHistory();

        console.log(`💰 Transacción registrada: ${customer?.name} - $${amount}`);

        return transaction;
    }

    getCustomerTransactions(customerId) {
        return this.transactions.get(customerId) || [];
    }

    // =======================================================================================
    // EVALUACIÓN AUTOMÁTICA DE TIERS
    // =======================================================================================

    evaluateAllCustomerTiers() {
        console.log('🔄 Iniciando evaluación automática de tiers...');
        
        let promotions = 0;
        let demotions = 0;
        
        this.customers.forEach((customer, customerId) => {
            const result = this.evaluateCustomerTier(customerId);
            if (result.changed) {
                if (result.promoted) {
                    promotions++;
                } else {
                    demotions++;
                }
            }
        });

        console.log(`✅ Evaluación completada: ${promotions} promociones, ${demotions} degradaciones`);
        
        this.notifyObservers('batch_tier_evaluation', {
            totalCustomers: this.customers.size,
            promotions: promotions,
            demotions: demotions,
            timestamp: Date.now()
        });
    }

    evaluateCustomerTier(customerId) {
        const customer = this.customers.get(customerId);
        if (!customer || !customer.isActive) {
            return { changed: false };
        }

        const currentTier = customer.currentTier;
        const tierKeys = Object.keys(this.config.tiers);
        const currentTierIndex = tierKeys.indexOf(currentTier);
        
        // Verificar promoción (tier superior)
        for (let i = tierKeys.length - 1; i > currentTierIndex; i--) {
            const higherTier = tierKeys[i];
            if (this.verifyTierCriteria(customerId, higherTier)) {
                this.updateCustomerTier(customerId, higherTier, 'automatic_promotion');
                return { changed: true, promoted: true, newTier: higherTier };
            }
        }

        // Verificar degradación (tier inferior) con período de gracia
        const lastPromotion = customer.tierHistory[customer.tierHistory.length - 1];
        const gracePeriod = this.config.systemSettings.demotionGracePeriod * 24 * 60 * 60 * 1000;
        
        if (Date.now() - lastPromotion.effectiveDate > gracePeriod) {
            for (let i = 0; i < currentTierIndex; i++) {
                const lowerTier = tierKeys[i];
                if (!this.verifyTierCriteria(customerId, currentTier)) {
                    // Solo degradar si no cumple criterios actuales Y sí cumple los del tier inferior
                    if (this.verifyTierCriteria(customerId, lowerTier)) {
                        this.updateCustomerTier(customerId, lowerTier, 'automatic_demotion');
                        return { changed: true, promoted: false, newTier: lowerTier };
                    }
                }
            }
        }

        return { changed: false };
    }

    // =======================================================================================
    // REPORTES Y ANÁLISIS
    // =======================================================================================

    getTierDistribution() {
        const distribution = {};
        
        Object.keys(this.config.tiers).forEach(tier => {
            distribution[tier] = {
                count: 0,
                totalValue: 0,
                averageValue: 0
            };
        });

        this.customers.forEach(customer => {
            const tier = customer.currentTier;
            if (distribution[tier]) {
                distribution[tier].count++;
                distribution[tier].totalValue += customer.totalLifetimeValue;
            }
        });

        // Calcular promedios
        Object.keys(distribution).forEach(tier => {
            if (distribution[tier].count > 0) {
                distribution[tier].averageValue = distribution[tier].totalValue / distribution[tier].count;
            }
        });

        return distribution;
    }

    getCustomerAnalysis(customerId) {
        const customer = this.customers.get(customerId);
        if (!customer) {
            throw new Error(`Cliente ${customerId} no encontrado`);
        }

        const metrics = this.calculateCustomerMetrics(customerId);
        const loyaltyPoints = this.getLoyaltyPoints(customerId);
        const nextTier = this.getNextTierRecommendation(customerId);

        return {
            customer: customer,
            metrics: metrics,
            loyaltyPoints: loyaltyPoints,
            nextTier: nextTier,
            tierBenefits: this.config.tiers[customer.currentTier].benefits,
            recentTransactions: this.getCustomerTransactions(customerId).slice(0, 10)
        };
    }

    getNextTierRecommendation(customerId) {
        const customer = this.customers.get(customerId);
        if (!customer) return null;

        const tierKeys = Object.keys(this.config.tiers);
        const currentIndex = tierKeys.indexOf(customer.currentTier);
        
        if (currentIndex >= tierKeys.length - 1) {
            return null; // Ya está en el tier más alto
        }

        const nextTierKey = tierKeys[currentIndex + 1];
        const nextTierConfig = this.config.tiers[nextTierKey];
        const metrics = this.calculateCustomerMetrics(customerId);
        
        const requirements = {
            annualPurchase: {
                current: metrics.annualPurchase,
                required: nextTierConfig.criteria.minAnnualPurchase,
                gap: Math.max(0, nextTierConfig.criteria.minAnnualPurchase - metrics.annualPurchase)
            },
            averageOrderValue: {
                current: metrics.averageOrderValue,
                required: nextTierConfig.criteria.averageOrderValue || 0,
                gap: Math.max(0, (nextTierConfig.criteria.averageOrderValue || 0) - metrics.averageOrderValue)
            },
            accountAge: {
                current: Date.now() - customer.registrationDate,
                required: nextTierConfig.criteria.accountAge * 24 * 60 * 60 * 1000,
                gap: Math.max(0, (nextTierConfig.criteria.accountAge * 24 * 60 * 60 * 1000) - (Date.now() - customer.registrationDate))
            }
        };

        return {
            nextTier: nextTierKey,
            tierName: nextTierConfig.name,
            requirements: requirements,
            eligible: this.verifyTierCriteria(customerId, nextTierKey)
        };
    }

    // =======================================================================================
    // PERSISTENCIA DE DATOS
    // =======================================================================================

    saveCustomerData() {
        try {
            const customers = Object.fromEntries(this.customers);
            localStorage.setItem(this.config.storage.customersKey, JSON.stringify(customers));
        } catch (error) {
            console.error('❌ Error guardando datos de clientes:', error);
        }
    }

    saveTransactionHistory() {
        try {
            const transactions = Object.fromEntries(this.transactions);
            localStorage.setItem(this.config.storage.transactionsKey, JSON.stringify(transactions));
        } catch (error) {
            console.error('❌ Error guardando transacciones:', error);
        }
    }

    saveLoyaltyPoints() {
        try {
            const loyalty = Object.fromEntries(this.loyaltyPoints);
            localStorage.setItem(this.config.storage.loyaltyKey, JSON.stringify(loyalty));
        } catch (error) {
            console.error('❌ Error guardando puntos de lealtad:', error);
        }
    }

    savePromotionHistory() {
        try {
            localStorage.setItem(this.config.storage.promotionsKey, JSON.stringify(this.promotionHistory));
        } catch (error) {
            console.error('❌ Error guardando historial de promociones:', error);
        }
    }

    exportData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            customers: Object.fromEntries(this.customers),
            transactions: Object.fromEntries(this.transactions),
            loyaltyPoints: Object.fromEntries(this.loyaltyPoints),
            promotionHistory: this.promotionHistory,
            tierDistribution: this.getTierDistribution()
        };
    }

    importData(data) {
        try {
            if (data.customers) {
                this.customers = new Map(Object.entries(data.customers));
            }
            if (data.transactions) {
                this.transactions = new Map(Object.entries(data.transactions));
            }
            if (data.loyaltyPoints) {
                this.loyaltyPoints = new Map(Object.entries(data.loyaltyPoints));
            }
            if (data.promotionHistory) {
                this.promotionHistory = data.promotionHistory;
            }

            console.log('📥 Datos de tiers de cliente importados exitosamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            return { success: false, error: error.message };
        }
    }

    // =======================================================================================
    // SISTEMA DE OBSERVADORES
    // =======================================================================================

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
                console.error('Error in customer tier system observer:', error);
            }
        });
    }

    // =======================================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // =======================================================================================

    getSystemStats() {
        return {
            totalCustomers: this.customers.size,
            activeCustomers: Array.from(this.customers.values()).filter(c => c.isActive).length,
            tierDistribution: this.getTierDistribution(),
            totalTransactions: Array.from(this.transactions.values()).reduce((sum, customerTxns) => sum + customerTxns.length, 0),
            totalLifetimeValue: Array.from(this.customers.values()).reduce((sum, customer) => sum + customer.totalLifetimeValue, 0),
            averageCustomerValue: this.customers.size > 0 ? 
                Array.from(this.customers.values()).reduce((sum, customer) => sum + customer.totalLifetimeValue, 0) / this.customers.size : 0,
            loyaltyPointsIssued: Array.from(this.loyaltyPoints.values()).reduce((sum, loyalty) => sum + loyalty.totalPoints, 0),
            recentPromotions: this.promotionHistory.filter(p => Date.now() - p.date < 30 * 24 * 60 * 60 * 1000).length
        };
    }
}

// =======================================================================================
// FUNCIONES AUXILIARES Y UTILIDADES
// =======================================================================================

function formatCurrency(amount, currency = 'MXN') {
    // Validate input and handle edge cases
    if (amount === null || amount === undefined || amount === '') {
        return '$0.00';
    }
    
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    // Handle NaN and invalid numbers
    if (isNaN(numericAmount)) {
        return '$0.00';
    }
    
    // Ensure consistent formatting: $XX,XXX.XX
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
}

function formatTierName(tierKey) {
    return CUSTOMER_TIER_CONFIG.tiers[tierKey]?.name || tierKey;
}

function calculateDaysBetween(date1, date2) {
    return Math.floor((date2 - date1) / (24 * 60 * 60 * 1000));
}

// =======================================================================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// =======================================================================================

// Función para integrar con sistema de cotizaciones
function integrateWithQuotationSystem() {
    if (typeof window !== 'undefined' && window.quotationSystem) {
        window.quotationSystem.applyCustomerTierPricing = function(customerId, basePrice, options = {}) {
            return window.customerTierSystem.calculatePrice(customerId, basePrice, options);
        };
        
        console.log('🔗 Sistema de tiers integrado con cotizaciones');
    }
}

// Función para integrar con sistema de markup global
function integrateWithMarkupSystem() {
    if (typeof window !== 'undefined' && window.globalMarkupSystem) {
        window.globalMarkupSystem.customerTierSystem = window.customerTierSystem;
        
        window.globalMarkupSystem.calculateWithCustomerTier = function(customerId, materialCost, laborCost, markupOptions = {}) {
            const baseCost = materialCost + laborCost;
            const finalPricing = this.calculatePrice(baseCost, markupOptions);
            const tierPricing = window.customerTierSystem.calculatePrice(customerId, finalPricing.breakdown.finalPrice);
            
            return {
                baseCost: baseCost,
                beforeTierDiscount: finalPricing.breakdown.finalPrice,
                afterTierDiscount: tierPricing.pricing.finalPrice,
                totalSavings: tierPricing.totalSavings,
                customerTier: tierPricing.currentTier,
                pricingBreakdown: finalPricing,
                tierDiscountBreakdown: tierPricing
            };
        };
        
        console.log('🔗 Sistema de tiers integrado con markup global');
    }
}

// =======================================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// =======================================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.customerTierSystem = new CustomerTierPricingSystem();
    
    // Integrar con otros sistemas cuando estén disponibles
    setTimeout(() => {
        integrateWithQuotationSystem();
        integrateWithMarkupSystem();
    }, 1000);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CustomerTierPricingSystem,
        CUSTOMER_TIER_CONFIG,
        formatCurrency,
        formatTierName,
        calculateDaysBetween
    };
}

console.log('✅ Sistema de Precios por Tier de Cliente v1.0 cargado correctamente');
console.log('👥 Estadísticas: window.customerTierSystem.getSystemStats()');
console.log('💰 Calcular precio: window.customerTierSystem.calculatePrice("customerId", basePrice, options)');
console.log('📊 Distribución de tiers: window.customerTierSystem.getTierDistribution()');
console.log('⭐ Análisis de cliente: window.customerTierSystem.getCustomerAnalysis("customerId")');