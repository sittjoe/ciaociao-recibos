// labor-rate-calculator.js - CALCULADORA DE TARIFAS DE MANO DE OBRA v1.0
// Sistema completo de cálculo de costos de mano de obra con multiplicadores de complejidad
// ===================================================================================

console.log('👷 Iniciando Calculadora de Tarifas de Mano de Obra v1.0...');

// ===================================================================================
// CONFIGURACIÓN DEL SISTEMA DE TARIFAS DE MANO DE OBRA
// ===================================================================================

const LABOR_RATE_CONFIG = {
    // Tarifas base por hora según nivel de especialización
    baseLaborRates: {
        apprentice: {
            name: 'Aprendiz',
            description: 'Trabajador en formación, tareas básicas y auxiliares',
            hourlyRate: 120,     // $120/hora MXN
            minRate: 80,         // Mínimo $80/hora
            maxRate: 180,        // Máximo $180/hora
            skillLevel: 1,
            color: '#90CAF9',    // Azul claro
            capabilities: ['polishing', 'basic_assembly', 'cleaning', 'support_tasks']
        },
        craftsman: {
            name: 'Artesano',
            description: 'Trabajador calificado con experiencia media',
            hourlyRate: 200,     // $200/hora MXN
            minRate: 150,        // Mínimo $150/hora
            maxRate: 280,        // Máximo $280/hora
            skillLevel: 2,
            color: '#81C784',    // Verde claro
            capabilities: ['basic_setting', 'chain_repair', 'resizing', 'engraving', 'soldering']
        },
        specialist: {
            name: 'Especialista',
            description: 'Experto en técnicas avanzadas y diseños complejos',
            hourlyRate: 350,     // $350/hora MXN
            minRate: 280,        // Mínimo $280/hora
            maxRate: 450,        // Máximo $450/hora
            skillLevel: 3,
            color: '#FFB74D',    // Naranja
            capabilities: ['advanced_setting', 'custom_design', 'intricate_work', 'restoration', 'casting']
        },
        master: {
            name: 'Maestro Joyero',
            description: 'Maestro artesano con décadas de experiencia',
            hourlyRate: 500,     // $500/hora MXN
            minRate: 400,        // Mínimo $400/hora
            maxRate: 700,        // Máximo $700/hora
            skillLevel: 4,
            color: '#E57373',    // Rojo claro
            capabilities: ['masterpiece_creation', 'unique_designs', 'expert_restoration', 'training', 'consultation']
        },
        designer: {
            name: 'Diseñador',
            description: 'Especialista en diseño y creación conceptual',
            hourlyRate: 300,     // $300/hora MXN
            minRate: 200,        // Mínimo $200/hora
            maxRate: 500,        // Máximo $500/hora
            skillLevel: 3,
            color: '#BA68C8',    // Morado
            capabilities: ['design_consultation', 'cad_modeling', 'sketching', 'concept_development']
        }
    },

    // Multiplicadores de complejidad detallados
    complexityMultipliers: {
        simple: {
            name: 'Trabajo Sencillo',
            description: 'Tareas básicas, pocas operaciones, diseños estándar',
            multiplier: 1.0,     // Base (sin multiplicador)
            timeRange: '0.5-2 horas',
            examples: ['limpieza básica', 'pulido simple', 'reparación menor', 'ensamblado básico'],
            color: '#4CAF50',    // Verde
            icon: '🔧',
            estimatedHours: { min: 0.5, max: 2, average: 1 },
            requiredSkills: ['apprentice', 'craftsman']
        },
        medium: {
            name: 'Trabajo Medio',
            description: 'Complejidad moderada, requiere experiencia',
            multiplier: 1.5,     // 50% adicional
            timeRange: '2-8 horas',
            examples: ['engaste básico', 'soldadura', 'ajuste de talla', 'reparación cadena'],
            color: '#FF9800',    // Naranja
            icon: '⚒️',
            estimatedHours: { min: 2, max: 8, average: 4 },
            requiredSkills: ['craftsman', 'specialist']
        },
        complex: {
            name: 'Trabajo Complejo',
            description: 'Alta complejidad, técnicas avanzadas',
            multiplier: 2.5,     // 150% adicional
            timeRange: '8-24 horas',
            examples: ['engaste pavé', 'diseño personalizado', 'restauración antigua', 'trabajo micromontaje'],
            color: '#9C27B0',    // Morado
            icon: '🛠️',
            estimatedHours: { min: 8, max: 24, average: 12 },
            requiredSkills: ['specialist', 'master']
        },
        masterpiece: {
            name: 'Obra Maestra',
            description: 'Máxima complejidad, arte único',
            multiplier: 4.0,     // 300% adicional
            timeRange: '24+ horas',
            examples: ['joyería de alta costura', 'piezas únicas', 'técnicas experimentales', 'obras de museo'],
            color: '#F44336',    // Rojo
            icon: '💎',
            estimatedHours: { min: 24, max: 120, average: 50 },
            requiredSkills: ['master']
        },
        restoration: {
            name: 'Restauración',
            description: 'Trabajo especializado de restauración',
            multiplier: 3.0,     // 200% adicional
            timeRange: '4-40 horas',
            examples: ['joyería antigua', 'piezas dañadas', 'reconstrucción', 'conservación'],
            color: '#795548',    // Marrón
            icon: '🔄',
            estimatedHours: { min: 4, max: 40, average: 15 },
            requiredSkills: ['specialist', 'master']
        }
    },

    // Factores adicionales que afectan el costo
    additionalFactors: {
        rush_order: {
            name: 'Trabajo Urgente',
            description: 'Entrega en menos tiempo del normal',
            multiplier: 1.5,     // 50% adicional
            conditions: ['menos de 7 días', 'prioridad alta'],
            color: '#FF5722'
        },
        weekend_work: {
            name: 'Trabajo Fin de Semana',
            description: 'Trabajo en días no laborales',
            multiplier: 1.3,     // 30% adicional
            conditions: ['sábados y domingos'],
            color: '#607D8B'
        },
        night_shift: {
            name: 'Turno Nocturno',
            description: 'Trabajo fuera de horario normal',
            multiplier: 1.2,     // 20% adicional
            conditions: ['después de 8 PM'],
            color: '#424242'
        },
        specialty_tools: {
            name: 'Herramientas Especiales',
            description: 'Requiere equipo especializado',
            multiplier: 1.1,     // 10% adicional
            conditions: ['láser', 'microscopio', 'equipo CAD'],
            color: '#37474F'
        },
        material_difficulty: {
            name: 'Material Difícil',
            description: 'Materiales que requieren técnicas especiales',
            multiplier: 1.4,     // 40% adicional
            conditions: ['titanio', 'acero inoxidable', 'aleaciones especiales'],
            color: '#546E7A'
        }
    },

    // Configuración de tipos de trabajo específicos
    workTypes: {
        setting: {
            name: 'Engaste de Piedras',
            baseComplexity: 'medium',
            stoneTypeMultipliers: {
                diamond: 1.0,        // Base
                emerald: 1.3,        // Frágil
                opal: 1.5,          // Muy frágil
                pearl: 1.2,         // Delicado
                other: 1.1          // Otras piedras
            },
            settingTypeMultipliers: {
                prong: 1.0,         // Base - engaste de garra
                bezel: 1.1,         // Engaste cerrado
                pave: 2.0,          // Engaste pavé
                channel: 1.5,       // Engaste de canal
                tension: 1.8,       // Engaste de tensión
                invisible: 2.5      // Engaste invisible
            },
            sizeMultipliers: {
                small: 1.2,         // < 3mm
                medium: 1.0,        // 3-8mm
                large: 1.3,         // 8-15mm
                oversized: 1.6      // > 15mm
            }
        },
        repair: {
            name: 'Reparaciones',
            baseComplexity: 'medium',
            repairTypes: {
                sizing: {
                    name: 'Ajuste de Talla',
                    complexity: 'simple',
                    timeEstimate: 1.5,
                    multiplier: 1.0
                },
                clasp_replacement: {
                    name: 'Cambio de Broche',
                    complexity: 'simple',
                    timeEstimate: 1.0,
                    multiplier: 1.0
                },
                chain_repair: {
                    name: 'Reparación de Cadena',
                    complexity: 'medium',
                    timeEstimate: 2.5,
                    multiplier: 1.2
                },
                prong_repair: {
                    name: 'Reparación de Garras',
                    complexity: 'medium',
                    timeEstimate: 2.0,
                    multiplier: 1.3
                },
                stone_replacement: {
                    name: 'Reemplazo de Piedra',
                    complexity: 'complex',
                    timeEstimate: 4.0,
                    multiplier: 1.5
                }
            }
        },
        manufacturing: {
            name: 'Manufactura',
            baseComplexity: 'complex',
            manufacturingTypes: {
                casting: {
                    name: 'Fundición',
                    complexity: 'medium',
                    setupTime: 2.0,
                    multiplier: 1.0
                },
                fabrication: {
                    name: 'Fabricación Manual',
                    complexity: 'complex',
                    setupTime: 1.0,
                    multiplier: 1.5
                },
                assembly: {
                    name: 'Ensamblado',
                    complexity: 'medium',
                    setupTime: 0.5,
                    multiplier: 1.1
                },
                finishing: {
                    name: 'Acabado',
                    complexity: 'simple',
                    setupTime: 0.5,
                    multiplier: 0.8
                }
            }
        }
    },

    // Configuración de almacenamiento
    storage: {
        ratesKey: 'labor_rates_config',
        calculationsKey: 'labor_calculations_history',
        presetsKey: 'labor_rate_presets',
        maxHistoryEntries: 200
    },

    // Configuración regional y temporal
    regional: {
        timezone: 'America/Mexico_City',
        currency: 'MXN',
        businessHours: {
            start: 9,    // 9 AM
            end: 18,     // 6 PM
            days: [1, 2, 3, 4, 5] // Lunes a Viernes
        },
        holidays: [] // Se puede expandir
    }
};

// ===================================================================================
// CLASE PRINCIPAL DE CALCULADORA DE TARIFAS DE MANO DE OBRA
// ===================================================================================

class LaborRateCalculator {
    constructor() {
        this.config = LABOR_RATE_CONFIG;
        this.customRates = {};
        this.calculationHistory = [];
        this.observers = [];
        this.currentSettings = {
            defaultWorkerType: 'craftsman',
            defaultComplexity: 'medium',
            includeOverhead: true,
            overheadPercentage: 15
        };
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando calculadora de tarifas de mano de obra...');
        
        try {
            // Cargar configuración guardada
            this.loadStoredSettings();
            
            // Cargar tarifas personalizadas
            this.loadCustomRates();
            
            // Cargar historial
            this.loadCalculationHistory();
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            console.log('✅ Calculadora de tarifas inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando calculadora de tarifas:', error);
        }
    }

    loadStoredSettings() {
        try {
            const stored = localStorage.getItem(this.config.storage.ratesKey);
            if (stored) {
                const settings = JSON.parse(stored);
                this.currentSettings = { ...this.currentSettings, ...settings };
                console.log('📊 Configuración de tarifas cargada');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración de tarifas:', error);
        }
    }

    loadCustomRates() {
        try {
            const stored = localStorage.getItem(this.config.storage.presetsKey);
            if (stored) {
                this.customRates = JSON.parse(stored);
                console.log('📋 Tarifas personalizadas cargadas');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando tarifas personalizadas:', error);
        }
    }

    loadCalculationHistory() {
        try {
            const stored = localStorage.getItem(this.config.storage.calculationsKey);
            if (stored) {
                this.calculationHistory = JSON.parse(stored);
                console.log(`📚 Historial cargado con ${this.calculationHistory.length} cálculos`);
            }
        } catch (error) {
            console.warn('⚠️ Error cargando historial:', error);
        }
    }

    setupAutoSave() {
        // Auto-guardar cada 60 segundos si hay cambios
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveAllData();
                this.hasUnsavedChanges = false;
            }
        }, 60000);
    }

    // ===================================================================================
    // MÉTODOS PRINCIPALES DE CÁLCULO
    // ===================================================================================

    calculateLaborCost(options = {}) {
        const {
            workerType = this.currentSettings.defaultWorkerType,
            complexity = this.currentSettings.defaultComplexity,
            estimatedHours = null,
            workType = null,
            additionalFactors = [],
            materialCost = 0,
            customHourlyRate = null,
            description = '',
            stoneDetails = null,
            repairDetails = null
        } = options;

        // Validar parámetros
        if (!this.config.baseLaborRates[workerType]) {
            throw new Error(`Tipo de trabajador "${workerType}" no válido`);
        }

        if (!this.config.complexityMultipliers[complexity]) {
            throw new Error(`Complejidad "${complexity}" no válida`);
        }

        // Obtener tarifa base
        const baseRate = this.getEffectiveHourlyRate(workerType, customHourlyRate);
        
        // Obtener multiplicador de complejidad
        const complexityMultiplier = this.config.complexityMultipliers[complexity].multiplier;
        
        // Calcular horas estimadas si no se proporcionan
        let hours = estimatedHours;
        if (!hours) {
            hours = this.estimateHours(complexity, workType, options);
        }

        // Aplicar multiplicadores de tipo de trabajo
        let workTypeMultiplier = 1.0;
        if (workType && this.config.workTypes[workType]) {
            workTypeMultiplier = this.calculateWorkTypeMultiplier(workType, options);
        }

        // Aplicar factores adicionales
        let additionalMultiplier = 1.0;
        additionalFactors.forEach(factor => {
            if (this.config.additionalFactors[factor]) {
                additionalMultiplier *= this.config.additionalFactors[factor].multiplier;
            }
        });

        // Cálculos principales
        const baseLaborCost = baseRate * hours;
        const complexityAdjustedCost = baseLaborCost * complexityMultiplier;
        const workTypeAdjustedCost = complexityAdjustedCost * workTypeMultiplier;
        const finalLaborCost = workTypeAdjustedCost * additionalMultiplier;

        // Calcular overhead si está habilitado
        let overheadCost = 0;
        if (this.currentSettings.includeOverhead) {
            overheadCost = finalLaborCost * (this.currentSettings.overheadPercentage / 100);
        }

        const totalCost = finalLaborCost + overheadCost;

        // Crear objeto de resultado detallado
        const result = {
            calculation: {
                baseHourlyRate: baseRate,
                estimatedHours: hours,
                baseLaborCost: baseLaborCost,
                complexityMultiplier: complexityMultiplier,
                workTypeMultiplier: workTypeMultiplier,
                additionalMultiplier: additionalMultiplier,
                finalLaborCost: finalLaborCost,
                overheadCost: overheadCost,
                totalCost: totalCost
            },
            parameters: {
                workerType: workerType,
                complexity: complexity,
                workType: workType,
                additionalFactors: additionalFactors,
                description: description
            },
            breakdown: {
                costPerHour: baseRate,
                hoursBreakdown: this.getHoursBreakdown(complexity, workType, options),
                multiplierDetails: {
                    complexity: {
                        name: this.config.complexityMultipliers[complexity].name,
                        value: complexityMultiplier,
                        impact: (complexityMultiplier - 1) * 100
                    },
                    workType: {
                        name: workType ? this.config.workTypes[workType]?.name : null,
                        value: workTypeMultiplier,
                        impact: (workTypeMultiplier - 1) * 100
                    },
                    additional: additionalFactors.map(factor => ({
                        name: this.config.additionalFactors[factor]?.name,
                        value: this.config.additionalFactors[factor]?.multiplier,
                        impact: (this.config.additionalFactors[factor]?.multiplier - 1) * 100
                    }))
                }
            },
            summary: {
                totalHours: hours,
                totalCost: totalCost,
                costPerHour: totalCost / hours,
                laborPercentageOfMaterial: materialCost > 0 ? (totalCost / materialCost) * 100 : 0
            },
            timestamp: Date.now(),
            calculationId: this.generateCalculationId()
        };

        // Guardar en historial
        this.addToHistory(result);

        // Notificar observadores
        this.notifyObservers('labor_cost_calculated', result);

        console.log(`💰 Costo de mano de obra calculado: $${totalCost.toFixed(2)} MXN`);

        return result;
    }

    getEffectiveHourlyRate(workerType, customRate = null) {
        if (customRate && customRate > 0) {
            return customRate;
        }

        // Usar tarifa personalizada si existe
        if (this.customRates[workerType] && this.customRates[workerType].hourlyRate) {
            return this.customRates[workerType].hourlyRate;
        }

        // Usar tarifa base del sistema
        return this.config.baseLaborRates[workerType].hourlyRate;
    }

    estimateHours(complexity, workType = null, options = {}) {
        // Obtener estimación base de complejidad
        let baseHours = this.config.complexityMultipliers[complexity].estimatedHours.average;

        // Ajustar según tipo de trabajo
        if (workType && this.config.workTypes[workType]) {
            const workTypeConfig = this.config.workTypes[workType];
            
            if (workType === 'setting' && options.stoneDetails) {
                baseHours = this.estimateSettingHours(options.stoneDetails, baseHours);
            } else if (workType === 'repair' && options.repairDetails) {
                baseHours = this.estimateRepairHours(options.repairDetails, baseHours);
            } else if (workType === 'manufacturing' && options.manufacturingDetails) {
                baseHours = this.estimateManufacturingHours(options.manufacturingDetails, baseHours);
            }
        }

        // Aplicar variación aleatoria pequeña para realismo
        const variation = 0.9 + (Math.random() * 0.2); // ±10%
        return Math.max(0.5, baseHours * variation);
    }

    estimateSettingHours(stoneDetails, baseHours) {
        let hours = baseHours;
        
        if (stoneDetails.count) {
            // Más piedras = más tiempo, pero con eficiencia
            const efficiency = Math.pow(stoneDetails.count, 0.8) / stoneDetails.count;
            hours *= stoneDetails.count * efficiency;
        }

        if (stoneDetails.size) {
            const sizeMultiplier = this.config.workTypes.setting.sizeMultipliers[stoneDetails.size] || 1.0;
            hours *= sizeMultiplier;
        }

        if (stoneDetails.settingType) {
            const settingMultiplier = this.config.workTypes.setting.settingTypeMultipliers[stoneDetails.settingType] || 1.0;
            hours *= settingMultiplier;
        }

        return hours;
    }

    estimateRepairHours(repairDetails, baseHours) {
        if (repairDetails.repairType && this.config.workTypes.repair.repairTypes[repairDetails.repairType]) {
            return this.config.workTypes.repair.repairTypes[repairDetails.repairType].timeEstimate;
        }
        return baseHours;
    }

    estimateManufacturingHours(manufacturingDetails, baseHours) {
        let hours = baseHours;
        
        if (manufacturingDetails.manufacturingType) {
            const mfgConfig = this.config.workTypes.manufacturing.manufacturingTypes[manufacturingDetails.manufacturingType];
            if (mfgConfig) {
                hours = baseHours * mfgConfig.multiplier;
                hours += mfgConfig.setupTime || 0;
            }
        }

        return hours;
    }

    calculateWorkTypeMultiplier(workType, options) {
        let multiplier = 1.0;

        if (workType === 'setting' && options.stoneDetails) {
            // Multiplicadores por tipo de piedra
            if (options.stoneDetails.stoneType) {
                const stoneMultiplier = this.config.workTypes.setting.stoneTypeMultipliers[options.stoneDetails.stoneType] || 1.0;
                multiplier *= stoneMultiplier;
            }
        }

        if (workType === 'repair' && options.repairDetails) {
            // Multiplicadores por tipo de reparación
            if (options.repairDetails.repairType) {
                const repairMultiplier = this.config.workTypes.repair.repairTypes[options.repairDetails.repairType]?.multiplier || 1.0;
                multiplier *= repairMultiplier;
            }
        }

        return multiplier;
    }

    // ===================================================================================
    // GESTIÓN DE TARIFAS PERSONALIZADAS
    // ===================================================================================

    setCustomRate(workerType, hourlyRate, options = {}) {
        if (hourlyRate <= 0) {
            throw new Error('La tarifa por hora debe ser mayor a 0');
        }

        const baseConfig = this.config.baseLaborRates[workerType];
        if (!baseConfig) {
            throw new Error(`Tipo de trabajador "${workerType}" no válido`);
        }

        // Validar rango si se especifica
        if (options.enforceRange) {
            if (hourlyRate < baseConfig.minRate || hourlyRate > baseConfig.maxRate) {
                throw new Error(`Tarifa fuera del rango permitido ($${baseConfig.minRate} - $${baseConfig.maxRate})`);
            }
        }

        this.customRates[workerType] = {
            hourlyRate: hourlyRate,
            setAt: Date.now(),
            reason: options.reason || null,
            validUntil: options.validUntil || null
        };

        this.hasUnsavedChanges = true;

        console.log(`💼 Tarifa personalizada establecida para ${baseConfig.name}: $${hourlyRate}/hora`);

        return { success: true, previousRate: baseConfig.hourlyRate, newRate: hourlyRate };
    }

    removeCustomRate(workerType) {
        if (this.customRates[workerType]) {
            delete this.customRates[workerType];
            this.hasUnsavedChanges = true;
            console.log(`🗑️ Tarifa personalizada removida para ${workerType}`);
            return { success: true };
        }
        return { success: false, message: 'No hay tarifa personalizada para este trabajador' };
    }

    getAllRates() {
        const rates = {};
        
        Object.keys(this.config.baseLaborRates).forEach(workerType => {
            const baseConfig = this.config.baseLaborRates[workerType];
            const customRate = this.customRates[workerType];
            
            rates[workerType] = {
                name: baseConfig.name,
                description: baseConfig.description,
                baseRate: baseConfig.hourlyRate,
                currentRate: customRate ? customRate.hourlyRate : baseConfig.hourlyRate,
                isCustom: !!customRate,
                minRate: baseConfig.minRate,
                maxRate: baseConfig.maxRate,
                skillLevel: baseConfig.skillLevel,
                capabilities: baseConfig.capabilities
            };
        });

        return rates;
    }

    // ===================================================================================
    // ANÁLISIS Y REPORTES
    // ===================================================================================

    getComplexityAnalysis(materialCost = 0) {
        const analysis = {};
        
        Object.keys(this.config.complexityMultipliers).forEach(complexity => {
            const config = this.config.complexityMultipliers[complexity];
            const calculation = this.calculateLaborCost({
                complexity: complexity,
                estimatedHours: config.estimatedHours.average
            });
            
            analysis[complexity] = {
                name: config.name,
                description: config.description,
                multiplier: config.multiplier,
                estimatedCost: calculation.summary.totalCost,
                timeRange: config.timeRange,
                examples: config.examples,
                laborToMaterialRatio: materialCost > 0 ? (calculation.summary.totalCost / materialCost) : 0
            };
        });

        return analysis;
    }

    getWorkerTypeComparison(options = {}) {
        const {
            complexity = 'medium',
            estimatedHours = 4,
            workType = null
        } = options;

        const comparison = {};

        Object.keys(this.config.baseLaborRates).forEach(workerType => {
            const calculation = this.calculateLaborCost({
                workerType: workerType,
                complexity: complexity,
                estimatedHours: estimatedHours,
                workType: workType
            });

            const workerConfig = this.config.baseLaborRates[workerType];

            comparison[workerType] = {
                name: workerConfig.name,
                skillLevel: workerConfig.skillLevel,
                hourlyRate: calculation.calculation.baseHourlyRate,
                totalCost: calculation.summary.totalCost,
                costPerHour: calculation.summary.costPerHour,
                capabilities: workerConfig.capabilities,
                suitable: this.isWorkerSuitableForComplexity(workerType, complexity)
            };
        });

        return comparison;
    }

    isWorkerSuitableForComplexity(workerType, complexity) {
        const workerSkill = this.config.baseLaborRates[workerType]?.skillLevel || 1;
        const complexityConfig = this.config.complexityMultipliers[complexity];
        
        if (!complexityConfig || !complexityConfig.requiredSkills) {
            return true; // Si no hay restricciones, es adecuado
        }

        return complexityConfig.requiredSkills.includes(workerType);
    }

    getCostBreakdownSummary(calculationResults) {
        const breakdown = calculationResults.calculation;
        const total = breakdown.totalCost;

        return {
            baseLaborCost: {
                amount: breakdown.baseLaborCost,
                percentage: (breakdown.baseLaborCost / total) * 100
            },
            complexityAdjustment: {
                amount: breakdown.baseLaborCost * (breakdown.complexityMultiplier - 1),
                percentage: ((breakdown.baseLaborCost * (breakdown.complexityMultiplier - 1)) / total) * 100
            },
            workTypeAdjustment: {
                amount: breakdown.complexityAdjustedCost * (breakdown.workTypeMultiplier - 1),
                percentage: ((breakdown.complexityAdjustedCost * (breakdown.workTypeMultiplier - 1)) / total) * 100
            },
            additionalFactors: {
                amount: breakdown.workTypeAdjustedCost * (breakdown.additionalMultiplier - 1),
                percentage: ((breakdown.workTypeAdjustedCost * (breakdown.additionalMultiplier - 1)) / total) * 100
            },
            overhead: {
                amount: breakdown.overheadCost,
                percentage: (breakdown.overheadCost / total) * 100
            }
        };
    }

    // ===================================================================================
    // PRESETS Y CONFIGURACIONES RÁPIDAS
    // ===================================================================================

    createWorkPreset(name, config) {
        if (!this.workPresets) {
            this.workPresets = {};
        }

        this.workPresets[name] = {
            name: name,
            config: config,
            createdAt: Date.now(),
            usageCount: 0
        };

        this.hasUnsavedChanges = true;

        console.log(`📋 Preset de trabajo "${name}" creado`);
        return { success: true };
    }

    applyWorkPreset(presetName, overrides = {}) {
        if (!this.workPresets || !this.workPresets[presetName]) {
            throw new Error(`Preset "${presetName}" no existe`);
        }

        const preset = this.workPresets[presetName];
        const config = { ...preset.config, ...overrides };

        // Incrementar contador de uso
        preset.usageCount++;
        this.hasUnsavedChanges = true;

        return this.calculateLaborCost(config);
    }

    getWorkPresets() {
        return this.workPresets || {};
    }

    // ===================================================================================
    // GESTIÓN DE HISTORIAL
    // ===================================================================================

    addToHistory(calculationResult) {
        this.calculationHistory.unshift({
            ...calculationResult,
            id: calculationResult.calculationId,
            timestamp: Date.now()
        });

        // Mantener límite de historial
        if (this.calculationHistory.length > this.config.storage.maxHistoryEntries) {
            this.calculationHistory = this.calculationHistory.slice(0, this.config.storage.maxHistoryEntries);
        }

        this.hasUnsavedChanges = true;
    }

    getHistory(filters = {}) {
        let history = [...this.calculationHistory];

        if (filters.workerType) {
            history = history.filter(calc => calc.parameters.workerType === filters.workerType);
        }

        if (filters.complexity) {
            history = history.filter(calc => calc.parameters.complexity === filters.complexity);
        }

        if (filters.workType) {
            history = history.filter(calc => calc.parameters.workType === filters.workType);
        }

        if (filters.dateFrom) {
            history = history.filter(calc => calc.timestamp >= filters.dateFrom);
        }

        if (filters.costRange) {
            history = history.filter(calc => 
                calc.summary.totalCost >= filters.costRange.min && 
                calc.summary.totalCost <= filters.costRange.max
            );
        }

        if (filters.limit) {
            history = history.slice(0, filters.limit);
        }

        return history;
    }

    getHistoryStats() {
        if (this.calculationHistory.length === 0) {
            return { totalCalculations: 0 };
        }

        const costs = this.calculationHistory.map(calc => calc.summary.totalCost);
        const hours = this.calculationHistory.map(calc => calc.summary.totalHours);

        return {
            totalCalculations: this.calculationHistory.length,
            averageCost: costs.reduce((a, b) => a + b) / costs.length,
            minCost: Math.min(...costs),
            maxCost: Math.max(...costs),
            averageHours: hours.reduce((a, b) => a + b) / hours.length,
            totalHours: hours.reduce((a, b) => a + b),
            mostUsedWorkerType: this.getMostFrequent(this.calculationHistory.map(calc => calc.parameters.workerType)),
            mostUsedComplexity: this.getMostFrequent(this.calculationHistory.map(calc => calc.parameters.complexity)),
            mostUsedWorkType: this.getMostFrequent(this.calculationHistory.map(calc => calc.parameters.workType))
        };
    }

    getMostFrequent(array) {
        const frequency = {};
        let maxCount = 0;
        let mostFrequent = null;

        array.forEach(item => {
            if (item) {
                frequency[item] = (frequency[item] || 0) + 1;
                if (frequency[item] > maxCount) {
                    maxCount = frequency[item];
                    mostFrequent = item;
                }
            }
        });

        return mostFrequent;
    }

    // ===================================================================================
    // UTILIDADES Y HELPERS
    // ===================================================================================

    generateCalculationId() {
        return `labor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getHoursBreakdown(complexity, workType, options) {
        const baseHours = this.config.complexityMultipliers[complexity].estimatedHours;
        
        return {
            base: {
                min: baseHours.min,
                max: baseHours.max,
                average: baseHours.average
            },
            factors: {
                complexity: complexity,
                workType: workType,
                estimatedTotal: this.estimateHours(complexity, workType, options)
            }
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    }

    exportCalculationData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            customRates: this.customRates,
            settings: this.currentSettings,
            history: this.calculationHistory.slice(0, 100), // Últimos 100
            workPresets: this.workPresets || {},
            stats: this.getHistoryStats()
        };
    }

    importCalculationData(data) {
        try {
            if (data.customRates) {
                this.customRates = data.customRates;
            }
            if (data.settings) {
                this.currentSettings = { ...this.currentSettings, ...data.settings };
            }
            if (data.workPresets) {
                this.workPresets = data.workPresets;
            }
            
            this.hasUnsavedChanges = true;
            console.log('📥 Datos de calculadora importados exitosamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            return { success: false, error: error.message };
        }
    }

    // ===================================================================================
    // PERSISTENCIA
    // ===================================================================================

    saveAllData() {
        try {
            localStorage.setItem(this.config.storage.ratesKey, JSON.stringify(this.currentSettings));
            localStorage.setItem(this.config.storage.presetsKey, JSON.stringify(this.customRates));
            localStorage.setItem(this.config.storage.calculationsKey, JSON.stringify(this.calculationHistory));
            
            console.log('💾 Datos de calculadora guardados');
        } catch (error) {
            console.error('❌ Error guardando datos:', error);
        }
    }

    // ===================================================================================
    // SISTEMA DE OBSERVADORES
    // ===================================================================================

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
                console.error('Error in labor calculator observer:', error);
            }
        });
    }

    // ===================================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // ===================================================================================

    getQuickEstimate(workerType, hours, complexity = 'medium') {
        try {
            const result = this.calculateLaborCost({
                workerType: workerType,
                estimatedHours: hours,
                complexity: complexity
            });
            return {
                cost: result.summary.totalCost,
                costPerHour: result.summary.costPerHour,
                breakdown: this.getCostBreakdownSummary(result)
            };
        } catch (error) {
            console.error('Error calculating quick estimate:', error);
            return null;
        }
    }

    getRecommendedWorker(complexity, budget = null) {
        const workerTypes = Object.keys(this.config.baseLaborRates);
        const suitable = workerTypes.filter(type => 
            this.isWorkerSuitableForComplexity(type, complexity)
        );

        if (budget && budget > 0) {
            // Filtrar por presupuesto
            const affordable = suitable.filter(type => {
                const estimate = this.getQuickEstimate(type, 4, complexity);
                return estimate && estimate.cost <= budget;
            });
            
            if (affordable.length > 0) {
                return affordable[0]; // Retornar el primero que cumpla
            }
        }

        return suitable.length > 0 ? suitable[0] : workerTypes[0];
    }
}

// ===================================================================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// ===================================================================================

function integrateWithPricingSystem() {
    if (typeof window !== 'undefined' && window.globalMarkupSystem) {
        // Agregar calculadora de mano de obra al sistema de markup
        window.globalMarkupSystem.laborCalculator = window.laborRateCalculator;
        
        // Función para calcular costo total incluyendo mano de obra
        window.globalMarkupSystem.calculateWithLabor = function(materialCost, laborOptions = {}, markupOptions = {}) {
            const laborResult = window.laborRateCalculator.calculateLaborCost(laborOptions);
            const laborCost = laborResult.summary.totalCost;
            
            // Calcular precio final con markups aplicados
            const totalCost = materialCost + laborCost;
            const pricingResult = this.calculatePrice(totalCost, markupOptions);
            
            return {
                materialCost: materialCost,
                laborCost: laborCost,
                totalBaseCost: totalCost,
                finalPrice: pricingResult.breakdown.finalPrice,
                laborDetails: laborResult,
                pricingDetails: pricingResult,
                laborToMaterialRatio: (laborCost / materialCost) * 100
            };
        };
        
        console.log('🔗 Calculadora de mano de obra integrada con sistema de precios');
    }
}

// ===================================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// ===================================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.laborRateCalculator = new LaborRateCalculator();
    
    // Integrar con otros sistemas cuando estén disponibles
    setTimeout(() => {
        integrateWithPricingSystem();
    }, 1000);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LaborRateCalculator,
        LABOR_RATE_CONFIG
    };
}

console.log('✅ Calculadora de Tarifas de Mano de Obra v1.0 cargada correctamente');
console.log('💼 Calcular costo: window.laborRateCalculator.calculateLaborCost(options)');
console.log('📊 Ver tarifas: window.laborRateCalculator.getAllRates()');
console.log('📈 Análisis de complejidad: window.laborRateCalculator.getComplexityAnalysis()');
console.log('📋 Comparar trabajadores: window.laborRateCalculator.getWorkerTypeComparison()');