// complexity-pricing-engine.js - MOTOR DE PRECIOS POR COMPLEJIDAD DE DISEÑO v1.0
// Sistema avanzado de cálculo de precios basado en complejidad, dificultad de engaste y artesanía
// ===============================================================================================

console.log('🎨 Iniciando Motor de Precios por Complejidad de Diseño v1.0...');

// ===============================================================================================
// CONFIGURACIÓN DEL SISTEMA DE COMPLEJIDAD DE DISEÑO
// ===============================================================================================

const COMPLEXITY_PRICING_CONFIG = {
    // Niveles de complejidad de diseño
    designComplexity: {
        minimal: {
            name: 'Diseño Minimalista',
            description: 'Líneas simples, formas básicas, sin detalles complejos',
            multiplier: 1.0,             // Base de referencia
            timeMultiplier: 1.0,         // Tiempo de trabajo base
            difficultyScore: 1,          // Puntuación de dificultad (1-10)
            examples: ['Anillo liso', 'Cadena básica', 'Aretes simples', 'Dije geométrico'],
            color: '#4CAF50',            // Verde
            icon: '○',
            skillRequirement: 'básico',
            tolerances: 'estándar',      // ±0.2mm
            surfaceFinish: 'pulido_simple'
        },
        simple: {
            name: 'Diseño Simple',
            description: 'Formas tradicionales con algunos detalles decorativos básicos',
            multiplier: 1.25,            // +25% sobre minimal
            timeMultiplier: 1.3,         // +30% tiempo
            difficultyScore: 2,
            examples: ['Anillo con textura', 'Pulsera con charms', 'Pendientes con patrón', 'Collar con colgante'],
            color: '#8BC34A',            // Verde claro
            icon: '◐',
            skillRequirement: 'básico',
            tolerances: 'estándar',
            surfaceFinish: 'pulido_standard'
        },
        moderate: {
            name: 'Diseño Moderado',
            description: 'Múltiples elementos, combinación de técnicas, detalles definidos',
            multiplier: 1.6,             // +60% sobre minimal
            timeMultiplier: 1.8,         // +80% tiempo
            difficultyScore: 4,
            examples: ['Anillo con engaste', 'Brazalete articulado', 'Broches con detalle', 'Collar multi-nivel'],
            color: '#FF9800',            // Naranja
            icon: '◑',
            skillRequirement: 'intermedio',
            tolerances: 'precisas',      // ±0.1mm
            surfaceFinish: 'pulido_fino'
        },
        complex: {
            name: 'Diseño Complejo',
            description: 'Múltiples técnicas especializadas, alta precisión, elementos intrincados',
            multiplier: 2.2,             // +120% sobre minimal
            timeMultiplier: 2.5,         // +150% tiempo
            difficultyScore: 6,
            examples: ['Joyería pavé', 'Piezas articuladas', 'Engastes invisibles', 'Texturas complejas'],
            color: '#FF5722',            // Rojo-naranja
            icon: '◒',
            skillRequirement: 'avanzado',
            tolerances: 'muy_precisas',  // ±0.05mm
            surfaceFinish: 'pulido_espejo'
        },
        intricate: {
            name: 'Diseño Intrincado',
            description: 'Técnicas maestras, múltiples componentes interdependientes, alta artesanía',
            multiplier: 3.2,             // +220% sobre minimal
            timeMultiplier: 3.8,         // +280% tiempo
            difficultyScore: 8,
            examples: ['Filigranas', 'Engastes múltiples', 'Mecanismos móviles', 'Grabado detallado'],
            color: '#9C27B0',            // Morado
            icon: '◓',
            skillRequirement: 'experto',
            tolerances: 'extremas',      // ±0.02mm
            surfaceFinish: 'acabado_premium'
        },
        masterpiece: {
            name: 'Obra Maestra',
            description: 'Técnicas únicas, innovación, máxima complejidad artística y técnica',
            multiplier: 4.5,             // +350% sobre minimal
            timeMultiplier: 5.0,         // +400% tiempo
            difficultyScore: 10,
            examples: ['Alta joyería', 'Piezas únicas', 'Técnicas experimentales', 'Arte portátil'],
            color: '#E91E63',            // Rosa intenso
            icon: '●',
            skillRequirement: 'maestro',
            tolerances: 'perfectas',     // ±0.01mm
            surfaceFinish: 'acabado_maestro'
        }
    },

    // Dificultad de engaste por tipo y cantidad
    stoneSettingDifficulty: {
        // Tipos de engaste
        settingTypes: {
            bezel: {
                name: 'Engaste Cerrado (Bezel)',
                difficultyBase: 1.0,     // Base de referencia
                timePerStone: 1.5,       // Horas base por piedra
                skillRequired: 'intermedio',
                sizeMultipliers: {
                    small: 1.2,          // < 4mm +20% dificultad
                    medium: 1.0,         // 4-8mm base
                    large: 1.1,          // 8-12mm +10%
                    oversized: 1.3       // > 12mm +30%
                }
            },
            prong: {
                name: 'Engaste de Garras (Prong)',
                difficultyBase: 1.2,     // +20% vs bezel
                timePerStone: 1.8,
                skillRequired: 'intermedio',
                sizeMultipliers: {
                    small: 1.4,          // Garras pequeñas más difíciles
                    medium: 1.0,
                    large: 1.15,
                    oversized: 1.4
                }
            },
            channel: {
                name: 'Engaste de Canal (Channel)',
                difficultyBase: 1.5,     // +50% vs bezel
                timePerStone: 2.2,
                skillRequired: 'avanzado',
                sizeMultipliers: {
                    small: 1.3,
                    medium: 1.0,
                    large: 1.2,
                    oversized: 1.5
                }
            },
            pave: {
                name: 'Engaste Pavé',
                difficultyBase: 2.5,     // +150% vs bezel (muy técnico)
                timePerStone: 3.0,
                skillRequired: 'experto',
                sizeMultipliers: {
                    small: 1.0,          // Pavé típicamente usa piedras pequeñas
                    medium: 1.3,
                    large: 1.8,          // Pavé con piedras grandes muy difícil
                    oversized: 2.5
                }
            },
            invisible: {
                name: 'Engaste Invisible',
                difficultyBase: 3.5,     // +250% vs bezel (técnica maestra)
                timePerStone: 4.5,
                skillRequired: 'maestro',
                sizeMultipliers: {
                    small: 1.2,
                    medium: 1.0,
                    large: 1.4,
                    oversized: 2.0
                }
            },
            tension: {
                name: 'Engaste de Tensión',
                difficultyBase: 2.8,     // +180% vs bezel
                timePerStone: 3.8,
                skillRequired: 'experto',
                sizeMultipliers: {
                    small: 1.8,          // Tensión en piedras pequeñas muy difícil
                    medium: 1.0,
                    large: 1.3,
                    oversized: 1.7
                }
            }
        },

        // Multiplicadores por cantidad de piedras
        quantityComplexity: {
            1: 1.0,                      // 1 piedra base
            2: 1.8,                      // 2 piedras +80% (coordinación)
            3: 2.4,                      // 3 piedras +140%
            4: 2.8,                      // 4 piedras +180%
            5: 3.2,                      // 5 piedras +220%
            10: 4.2,                     // 10 piedras +320%
            20: 5.8,                     // 20 piedras +480%
            50: 8.5,                     // 50 piedras +750% (pavé complejo)
            100: 12.0                    // 100+ piedras +1100% (obra maestra)
        },

        // Dificultad por tipo de piedra
        stoneTypeDifficulty: {
            diamond: {
                name: 'Diamante',
                difficultyMultiplier: 1.0, // Base de referencia
                handling: 'estándar',
                toolsRequired: ['básicas'],
                riskFactor: 'bajo'
            },
            ruby: {
                name: 'Rubí',
                difficultyMultiplier: 1.2, // +20% (dureza similar, color puede ocultar defectos)
                handling: 'cuidadoso',
                toolsRequired: ['básicas', 'lupas_especializadas'],
                riskFactor: 'medio'
            },
            sapphire: {
                name: 'Zafiro',
                difficultyMultiplier: 1.2, // +20%
                handling: 'cuidadoso',
                toolsRequired: ['básicas', 'lupas_especializadas'],
                riskFactor: 'medio'
            },
            emerald: {
                name: 'Esmeralda',
                difficultyMultiplier: 1.8, // +80% (muy frágil, inclusiones)
                handling: 'extremo_cuidado',
                toolsRequired: ['herramientas_suaves', 'microscopio'],
                riskFactor: 'alto'
            },
            opal: {
                name: 'Ópalo',
                difficultyMultiplier: 2.2, // +120% (extremadamente frágil)
                handling: 'extremo_cuidado',
                toolsRequired: ['herramientas_suaves', 'temperatura_controlada'],
                riskFactor: 'muy_alto'
            },
            pearl: {
                name: 'Perla',
                difficultyMultiplier: 1.6, // +60% (orgánica, técnicas especiales)
                handling: 'delicado',
                toolsRequired: ['taladros_especializados', 'adhesivos_especiales'],
                riskFactor: 'medio'
            },
            tanzanite: {
                name: 'Tanzanita',
                difficultyMultiplier: 1.7, // +70% (frágil, sensible al calor)
                handling: 'cuidadoso',
                toolsRequired: ['básicas', 'control_temperatura'],
                riskFactor: 'alto'
            }
        }
    },

    // Nivel de artesanía y técnicas especializadas
    craftsmanshipLevel: {
        standard: {
            name: 'Artesanía Estándar',
            description: 'Técnicas tradicionales, acabados comerciales',
            multiplier: 1.0,             // Base
            timeMultiplier: 1.0,
            qualityLevel: 'comercial',
            techniques: ['soldadura_básica', 'pulido_estándar', 'engaste_básico'],
            toolsRequired: ['herramientas_básicas'],
            skillRequirement: 'básico'
        },
        enhanced: {
            name: 'Artesanía Mejorada',
            description: 'Técnicas refinadas, mejor acabado, atención a detalles',
            multiplier: 1.4,             // +40%
            timeMultiplier: 1.6,         // +60% tiempo
            qualityLevel: 'premium',
            techniques: ['soldadura_precisa', 'pulido_fino', 'detalles_manuales'],
            toolsRequired: ['herramientas_básicas', 'herramientas_precisión'],
            skillRequirement: 'intermedio'
        },
        premium: {
            name: 'Artesanía Premium',
            description: 'Técnicas avanzadas, acabados superiores, precisión alta',
            multiplier: 1.9,             // +90%
            timeMultiplier: 2.3,         // +130% tiempo
            qualityLevel: 'alta',
            techniques: ['soldadura_invisible', 'pulido_espejo', 'grabado_manual', 'texturas_avanzadas'],
            toolsRequired: ['herramientas_precisión', 'microscopio', 'herramientas_especializadas'],
            skillRequirement: 'avanzado'
        },
        luxury: {
            name: 'Artesanía de Lujo',
            description: 'Técnicas maestras, acabados perfectos, innovación técnica',
            multiplier: 2.8,             // +180%
            timeMultiplier: 3.5,         // +250% tiempo
            qualityLevel: 'lujo',
            techniques: ['técnicas_maestras', 'acabado_perfecto', 'innovación_técnica', 'personalización_extrema'],
            toolsRequired: ['herramientas_especializadas', 'equipo_avanzado', 'laboratorio_completo'],
            skillRequirement: 'experto'
        },
        haute_couture: {
            name: 'Alta Artesanía (Haute Couture)',
            description: 'Técnicas únicas, perfección absoluta, arte aplicado',
            multiplier: 4.2,             // +320%
            timeMultiplier: 5.5,         // +450% tiempo
            qualityLevel: 'arte',
            techniques: ['técnicas_únicas', 'perfección_absoluta', 'innovación_artística', 'firma_artística'],
            toolsRequired: ['herramientas_únicas', 'laboratorio_especializado', 'equipos_experimentales'],
            skillRequirement: 'maestro'
        }
    },

    // Factores adicionales de complejidad
    additionalComplexityFactors: {
        size_extremes: {
            name: 'Tamaños Extremos',
            description: 'Piezas muy pequeñas (<5mm) o muy grandes (>50mm)',
            multiplier: 1.3,             // +30%
            applicableToSizes: ['very_small', 'oversized']
        },
        mixed_metals: {
            name: 'Metales Mixtos',
            description: 'Combinación de diferentes metales en una pieza',
            multiplier: 1.4,             // +40%
            considerations: ['compatibilidad_térmica', 'diferencias_dureza', 'soldaduras_especiales']
        },
        moving_parts: {
            name: 'Partes Móviles',
            description: 'Mecanismos, articulaciones, elementos que se mueven',
            multiplier: 2.1,             // +110%
            examples: ['bisagras', 'resortes', 'mecanismos_giratorios', 'cierres_complejos']
        },
        surface_textures: {
            name: 'Texturas Superficiales',
            description: 'Acabados texturizados, patrones grabados, efectos superficiales',
            multiplier: 1.5,             // +50%
            types: ['martillado', 'satinado', 'granulado', 'grabado_láser']
        },
        hidden_elements: {
            name: 'Elementos Ocultos',
            description: 'Compartimentos secretos, mensajes ocultos, funcionalidades escondidas',
            multiplier: 2.3,             // +130%
            examples: ['compartimentos', 'mensajes_grabados_internos', 'funciones_ocultas']
        },
        custom_tooling: {
            name: 'Herramientas Personalizadas',
            description: 'Requiere fabricación de herramientas específicas para la pieza',
            multiplier: 1.8,             // +80%
            includes: ['moldes_únicos', 'plantillas_especiales', 'herramientas_específicas']
        }
    },

    // Sistema de puntuación de complejidad
    complexityScoring: {
        weights: {
            design: 0.30,                // 30% peso del diseño
            setting: 0.25,               // 25% peso del engaste
            craftsmanship: 0.25,         // 25% peso de la artesanía
            additional: 0.20             // 20% factores adicionales
        },
        scoreRanges: {
            simple: { min: 0, max: 2.5 },
            moderate: { min: 2.5, max: 4.5 },
            complex: { min: 4.5, max: 7.0 },
            expert: { min: 7.0, max: 9.0 },
            master: { min: 9.0, max: 10.0 }
        }
    },

    // Configuración del sistema
    systemSettings: {
        baseHourlyRate: 350,             // MXN por hora base
        riskInsuranceFactor: 0.15,       // 15% adicional por riesgo de trabajo complejo
        qualityAssuranceTime: 0.20,     // 20% tiempo adicional para QA
        revisionAllowance: 0.10,         // 10% tiempo para revisiones
        toolWearFactor: 0.05,            // 5% adicional por desgaste de herramientas
        masterCraftsmanBonus: 1.5        // +50% si requiere maestro artesano
    },

    // Almacenamiento y cache
    storage: {
        complexityCalculationsKey: 'complexity_calculations',
        designLibraryKey: 'design_complexity_library',
        craftsmanProfilesKey: 'craftsman_skill_profiles',
        maxHistoryEntries: 500
    }
};

// ===============================================================================================
// CLASE PRINCIPAL DEL MOTOR DE PRECIOS POR COMPLEJIDAD
// ===============================================================================================

class ComplexityPricingEngine {
    constructor() {
        this.config = COMPLEXITY_PRICING_CONFIG;
        this.calculationHistory = [];
        this.designLibrary = new Map();
        this.craftsmanProfiles = new Map();
        this.observers = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando Motor de Precios por Complejidad...');
        
        try {
            // Cargar datos históricos
            this.loadCalculationHistory();
            
            // Cargar biblioteca de diseños
            this.loadDesignLibrary();
            
            // Cargar perfiles de artesanos
            this.loadCraftsmanProfiles();
            
            // Configurar integración con otros sistemas
            this.setupSystemIntegration();
            
            console.log('✅ Motor de complejidad inicializado');
            console.log(`🎨 ${this.designLibrary.size} diseños en biblioteca`);
            console.log(`👨‍🎨 ${this.craftsmanProfiles.size} perfiles de artesanos`);
            
        } catch (error) {
            console.error('❌ Error inicializando motor de complejidad:', error);
        }
    }

    loadCalculationHistory() {
        try {
            const historyData = localStorage.getItem(this.config.storage.complexityCalculationsKey);
            if (historyData) {
                this.calculationHistory = JSON.parse(historyData);
                console.log('📊 Historial de cálculos de complejidad cargado');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando historial:', error);
        }
    }

    loadDesignLibrary() {
        try {
            const libraryData = localStorage.getItem(this.config.storage.designLibraryKey);
            if (libraryData) {
                this.designLibrary = new Map(JSON.parse(libraryData));
                console.log('📚 Biblioteca de diseños cargada');
            } else {
                // Cargar diseños de ejemplo por defecto
                this.loadDefaultDesigns();
            }
        } catch (error) {
            console.warn('⚠️ Error cargando biblioteca de diseños:', error);
            this.loadDefaultDesigns();
        }
    }

    loadDefaultDesigns() {
        const defaultDesigns = [
            {
                id: 'ring_solitaire',
                name: 'Anillo Solitario Clásico',
                category: 'rings',
                complexity: 'simple',
                settingType: 'prong',
                stoneCount: 1,
                craftsmanship: 'standard'
            },
            {
                id: 'necklace_chain',
                name: 'Collar de Cadena Simple',
                category: 'necklaces',
                complexity: 'minimal',
                settingType: null,
                stoneCount: 0,
                craftsmanship: 'standard'
            },
            {
                id: 'bracelet_tennis',
                name: 'Pulsera Tennis',
                category: 'bracelets',
                complexity: 'complex',
                settingType: 'channel',
                stoneCount: 50,
                craftsmanship: 'premium'
            }
        ];

        defaultDesigns.forEach(design => {
            this.designLibrary.set(design.id, design);
        });
    }

    loadCraftsmanProfiles() {
        try {
            const profilesData = localStorage.getItem(this.config.storage.craftsmanProfilesKey);
            if (profilesData) {
                this.craftsmanProfiles = new Map(JSON.parse(profilesData));
                console.log('👨‍🎨 Perfiles de artesanos cargados');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando perfiles de artesanos:', error);
        }
    }

    setupSystemIntegration() {
        // Integración con otros sistemas cuando estén disponibles
        if (typeof window !== 'undefined') {
            window.complexityPricingEngine = this;
        }
    }

    // ===============================================================================================
    // MÉTODOS PRINCIPALES DE CÁLCULO DE COMPLEJIDAD
    // ===============================================================================================

    calculateComplexityPrice(params) {
        const {
            designComplexity = 'simple',
            stoneSettings = [],
            craftsmanshipLevel = 'standard',
            additionalFactors = [],
            customerId = null,
            materialCost = 0,
            baseTimeHours = 0,
            region = 'cdmx'
        } = params;

        try {
            // 1. Calcular puntuación de complejidad total
            const complexityScore = this.calculateComplexityScore({
                designComplexity,
                stoneSettings,
                craftsmanshipLevel,
                additionalFactors
            });

            // 2. Calcular multiplicadores de precio y tiempo
            const priceMultipliers = this.calculatePriceMultipliers({
                designComplexity,
                stoneSettings,
                craftsmanshipLevel,
                additionalFactors,
                complexityScore
            });

            // 3. Calcular tiempo total requerido
            const timeCalculation = this.calculateTimeRequirement({
                baseTimeHours,
                designComplexity,
                stoneSettings,
                craftsmanshipLevel,
                additionalFactors
            });

            // 4. Calcular costo de mano de obra
            const laborCost = this.calculateLaborCost(timeCalculation, craftsmanshipLevel, region);

            // 5. Aplicar factores de riesgo y calidad
            const adjustedCost = this.applyRiskAndQualityFactors(laborCost, complexityScore, craftsmanshipLevel);

            // 6. Crear resultado detallado
            const result = {
                complexityAnalysis: {
                    overallScore: complexityScore.overall,
                    category: this.getComplexityCategory(complexityScore.overall),
                    breakdown: complexityScore.breakdown
                },
                pricing: {
                    materialCost: materialCost,
                    baseLaborCost: laborCost.base,
                    complexityAdjustment: laborCost.complexityAdjustment,
                    riskInsurance: laborCost.riskInsurance,
                    qualityAssurance: laborCost.qualityAssurance,
                    totalLaborCost: adjustedCost,
                    totalProjectCost: materialCost + adjustedCost
                },
                timeEstimate: {
                    baseHours: timeCalculation.baseHours,
                    complexityHours: timeCalculation.complexityHours,
                    settingHours: timeCalculation.settingHours,
                    qualityAssuranceHours: timeCalculation.qualityAssuranceHours,
                    totalHours: timeCalculation.totalHours,
                    estimatedDays: Math.ceil(timeCalculation.totalHours / 8) // 8 horas laborales por día
                },
                multipliers: priceMultipliers,
                skillRequirement: this.determineSkillRequirement(complexityScore.overall, craftsmanshipLevel),
                riskAssessment: this.assessProjectRisk(stoneSettings, additionalFactors),
                recommendations: this.generateRecommendations(complexityScore, craftsmanshipLevel, stoneSettings),
                calculation: {
                    customerId: customerId,
                    timestamp: Date.now(),
                    parameters: params
                }
            };

            // Guardar cálculo en historial
            this.addToHistory(result);

            // Notificar observadores
            this.notifyObservers('complexity_calculated', result);

            console.log(`🎨 Cálculo de complejidad completado: Score ${complexityScore.overall.toFixed(2)}, Costo total $${result.pricing.totalProjectCost.toFixed(2)}`);

            return result;

        } catch (error) {
            console.error('❌ Error calculando complejidad de precio:', error);
            throw error;
        }
    }

    calculateComplexityScore(params) {
        const { designComplexity, stoneSettings, craftsmanshipLevel, additionalFactors } = params;
        const weights = this.config.complexityScoring.weights;

        // 1. Puntuación de diseño
        const designConfig = this.config.designComplexity[designComplexity];
        const designScore = designConfig ? designConfig.difficultyScore : 1;

        // 2. Puntuación de engaste
        let settingScore = 0;
        if (stoneSettings && stoneSettings.length > 0) {
            settingScore = this.calculateSettingComplexityScore(stoneSettings);
        }

        // 3. Puntuación de artesanía
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        const craftsmanshipScore = craftsmanshipConfig ? (craftsmanshipConfig.multiplier * 2.5) : 2.5; // Convertir multiplicador a puntuación

        // 4. Puntuación de factores adicionales
        let additionalScore = 0;
        if (additionalFactors && additionalFactors.length > 0) {
            additionalScore = additionalFactors.reduce((sum, factor) => {
                const factorConfig = this.config.additionalComplexityFactors[factor];
                return sum + (factorConfig ? (factorConfig.multiplier - 1) * 5 : 0); // Convertir multiplicador a puntuación
            }, 0);
        }

        // Calcular puntuación total ponderada
        const overallScore = Math.min(10, 
            (designScore * weights.design) +
            (settingScore * weights.setting) +
            (craftsmanshipScore * weights.craftsmanship) +
            (additionalScore * weights.additional)
        );

        return {
            overall: overallScore,
            breakdown: {
                design: designScore,
                setting: settingScore,
                craftsmanship: craftsmanshipScore,
                additional: additionalScore
            }
        };
    }

    calculateSettingComplexityScore(stoneSettings) {
        if (!stoneSettings || stoneSettings.length === 0) {
            return 0;
        }

        let totalScore = 0;
        let totalStones = 0;

        stoneSettings.forEach(setting => {
            const {
                settingType = 'bezel',
                stoneType = 'diamond',
                stoneSize = 'medium',
                quantity = 1
            } = setting;

            // Puntuación base del tipo de engaste
            const settingConfig = this.config.stoneSettingDifficulty.settingTypes[settingType];
            const settingBaseScore = settingConfig ? settingConfig.difficultyBase * 2 : 2; // Convertir a puntuación

            // Multiplicador por tamaño
            const sizeMultiplier = settingConfig?.sizeMultipliers[stoneSize] || 1.0;

            // Multiplicador por tipo de piedra
            const stoneConfig = this.config.stoneSettingDifficulty.stoneTypeDifficulty[stoneType];
            const stoneMultiplier = stoneConfig ? stoneConfig.difficultyMultiplier : 1.0;

            // Calcular puntuación para esta configuración
            const settingScore = settingBaseScore * sizeMultiplier * stoneMultiplier;

            totalScore += settingScore;
            totalStones += quantity;
        });

        // Aplicar multiplicador por cantidad total
        const quantityMultiplier = this.getQuantityComplexityMultiplier(totalStones);
        
        return Math.min(10, (totalScore / stoneSettings.length) * quantityMultiplier * 0.4); // Normalizar a escala de 10
    }

    getQuantityComplexityMultiplier(totalStones) {
        const quantityRanges = this.config.stoneSettingDifficulty.quantityComplexity;
        
        // Encontrar el rango aplicable
        let multiplier = 1.0;
        Object.keys(quantityRanges).forEach(threshold => {
            const thresholdNum = parseInt(threshold);
            if (totalStones >= thresholdNum) {
                multiplier = Math.max(multiplier, quantityRanges[threshold]);
            }
        });

        return multiplier;
    }

    calculatePriceMultipliers(params) {
        const { designComplexity, stoneSettings, craftsmanshipLevel, additionalFactors, complexityScore } = params;

        // 1. Multiplicador de diseño
        const designConfig = this.config.designComplexity[designComplexity];
        const designMultiplier = designConfig ? designConfig.multiplier : 1.0;

        // 2. Multiplicador de artesanía
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        const craftsmanshipMultiplier = craftsmanshipConfig ? craftsmanshipConfig.multiplier : 1.0;

        // 3. Multiplicador de engaste (promedio ponderado)
        let settingMultiplier = 1.0;
        if (stoneSettings && stoneSettings.length > 0) {
            settingMultiplier = this.calculateAverageSettingMultiplier(stoneSettings);
        }

        // 4. Multiplicador de factores adicionales (acumulativo)
        let additionalMultiplier = 1.0;
        if (additionalFactors && additionalFactors.length > 0) {
            additionalMultiplier = additionalFactors.reduce((multiplier, factor) => {
                const factorConfig = this.config.additionalComplexityFactors[factor];
                return multiplier * (factorConfig ? factorConfig.multiplier : 1.0);
            }, 1.0);
        }

        // 5. Multiplicador total combinado (no simplemente multiplicativo para evitar valores extremos)
        const combinedMultiplier = Math.sqrt(
            designMultiplier * 
            craftsmanshipMultiplier * 
            settingMultiplier * 
            additionalMultiplier
        ) * Math.sqrt(complexityScore.overall / 5); // Suavizar el resultado

        return {
            design: designMultiplier,
            craftsmanship: craftsmanshipMultiplier,
            setting: settingMultiplier,
            additional: additionalMultiplier,
            combined: combinedMultiplier
        };
    }

    calculateAverageSettingMultiplier(stoneSettings) {
        if (!stoneSettings || stoneSettings.length === 0) {
            return 1.0;
        }

        let weightedSum = 0;
        let totalWeight = 0;

        stoneSettings.forEach(setting => {
            const { settingType = 'bezel', stoneSize = 'medium', quantity = 1 } = setting;
            
            const settingConfig = this.config.stoneSettingDifficulty.settingTypes[settingType];
            const baseMultiplier = settingConfig ? settingConfig.difficultyBase : 1.0;
            const sizeMultiplier = settingConfig?.sizeMultipliers[stoneSize] || 1.0;
            
            const settingMultiplier = baseMultiplier * sizeMultiplier;
            
            weightedSum += settingMultiplier * quantity;
            totalWeight += quantity;
        });

        return totalWeight > 0 ? weightedSum / totalWeight : 1.0;
    }

    calculateTimeRequirement(params) {
        const { baseTimeHours, designComplexity, stoneSettings, craftsmanshipLevel, additionalFactors } = params;

        // 1. Tiempo base del diseño
        const designConfig = this.config.designComplexity[designComplexity];
        const designTimeMultiplier = designConfig ? designConfig.timeMultiplier : 1.0;
        const designTime = baseTimeHours * designTimeMultiplier;

        // 2. Tiempo de engaste
        let settingTime = 0;
        if (stoneSettings && stoneSettings.length > 0) {
            settingTime = this.calculateSettingTime(stoneSettings);
        }

        // 3. Tiempo adicional por artesanía
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        const craftsmanshipTimeMultiplier = craftsmanshipConfig ? craftsmanshipConfig.timeMultiplier : 1.0;
        const craftsmanshipTime = (designTime + settingTime) * (craftsmanshipTimeMultiplier - 1);

        // 4. Tiempo por factores adicionales
        let additionalTime = 0;
        if (additionalFactors && additionalFactors.length > 0) {
            const additionalMultiplier = additionalFactors.reduce((multiplier, factor) => {
                const factorConfig = this.config.additionalComplexityFactors[factor];
                return multiplier * (factorConfig ? factorConfig.multiplier : 1.0);
            }, 1.0);
            additionalTime = (designTime + settingTime) * (additionalMultiplier - 1);
        }

        const subtotalTime = designTime + settingTime + craftsmanshipTime + additionalTime;

        // 5. Tiempo de control de calidad
        const qaTime = subtotalTime * this.config.systemSettings.qualityAssuranceTime;

        // 6. Tiempo total
        const totalTime = subtotalTime + qaTime;

        return {
            baseHours: baseTimeHours,
            designHours: designTime,
            settingHours: settingTime,
            complexityHours: craftsmanshipTime + additionalTime,
            qualityAssuranceHours: qaTime,
            totalHours: totalTime
        };
    }

    calculateSettingTime(stoneSettings) {
        if (!stoneSettings || stoneSettings.length === 0) {
            return 0;
        }

        let totalTime = 0;

        stoneSettings.forEach(setting => {
            const { 
                settingType = 'bezel', 
                stoneSize = 'medium', 
                quantity = 1,
                stoneType = 'diamond'
            } = setting;
            
            const settingConfig = this.config.stoneSettingDifficulty.settingTypes[settingType];
            const baseTimePerStone = settingConfig ? settingConfig.timePerStone : 1.5;
            
            const sizeMultiplier = settingConfig?.sizeMultipliers[stoneSize] || 1.0;
            
            const stoneConfig = this.config.stoneSettingDifficulty.stoneTypeDifficulty[stoneType];
            const stoneMultiplier = stoneConfig ? stoneConfig.difficultyMultiplier : 1.0;
            
            const timePerStone = baseTimePerStone * sizeMultiplier * stoneMultiplier;
            
            // Aplicar eficiencia para múltiples piedras del mismo tipo
            const efficiency = quantity > 1 ? Math.pow(quantity, 0.9) / quantity : 1.0;
            
            totalTime += timePerStone * quantity * efficiency;
        });

        return totalTime;
    }

    calculateLaborCost(timeCalculation, craftsmanshipLevel, region = 'cdmx') {
        const systemSettings = this.config.systemSettings;
        
        // Tarifa base por hora
        let hourlyRate = systemSettings.baseHourlyRate;
        
        // Ajuste regional (integración con sistema de markup dinámico si existe)
        if (typeof window !== 'undefined' && window.dynamicMarkupEngine) {
            const regionalMultiplier = window.dynamicMarkupEngine.config.regionalMultipliers[region] || 1.0;
            hourlyRate *= regionalMultiplier;
        }

        // Ajuste por nivel de artesanía
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        if (craftsmanshipConfig && (craftsmanshipConfig.skillRequirement === 'experto' || craftsmanshipConfig.skillRequirement === 'maestro')) {
            hourlyRate *= systemSettings.masterCraftsmanBonus;
        }

        // Costo base de mano de obra
        const baseLaborCost = timeCalculation.totalHours * hourlyRate;
        
        // Ajuste por complejidad (ya incluido en tiempo, pero agregamos factor de riesgo)
        const riskInsurance = baseLaborCost * systemSettings.riskInsuranceFactor;
        
        // Desgaste de herramientas
        const toolWearCost = baseLaborCost * systemSettings.toolWearFactor;

        return {
            base: baseLaborCost,
            complexityAdjustment: 0, // Ya incluido en el tiempo
            riskInsurance: riskInsurance,
            toolWear: toolWearCost,
            total: baseLaborCost + riskInsurance + toolWearCost
        };
    }

    applyRiskAndQualityFactors(laborCost, complexityScore, craftsmanshipLevel) {
        let adjustedCost = laborCost.total;
        
        // Factor de calidad adicional para trabajos de muy alta complejidad
        if (complexityScore.overall > 8) {
            const qualityFactor = 1 + ((complexityScore.overall - 8) * 0.1); // +10% por cada punto sobre 8
            adjustedCost *= qualityFactor;
        }
        
        // Bonificación por artesanía de lujo o alta costura
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        if (craftsmanshipConfig && ['luxury', 'haute_couture'].includes(craftsmanshipLevel)) {
            adjustedCost *= 1.2; // +20% adicional por exclusividad
        }

        return adjustedCost;
    }

    // ===============================================================================================
    // MÉTODOS DE ANÁLISIS Y RECOMENDACIONES
    // ===============================================================================================

    getComplexityCategory(score) {
        const ranges = this.config.complexityScoring.scoreRanges;
        
        for (const [category, range] of Object.entries(ranges)) {
            if (score >= range.min && score < range.max) {
                return category;
            }
        }
        
        return score >= 9 ? 'master' : 'simple';
    }

    determineSkillRequirement(complexityScore, craftsmanshipLevel) {
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        const designSkillFromScore = complexityScore > 8 ? 'maestro' : 
                                   complexityScore > 6 ? 'experto' :
                                   complexityScore > 4 ? 'avanzado' :
                                   complexityScore > 2 ? 'intermedio' : 'básico';
        
        const craftsmanshipSkill = craftsmanshipConfig ? craftsmanshipConfig.skillRequirement : 'básico';
        
        // Retornar el mayor de los dos requisitos
        const skillLevels = ['básico', 'intermedio', 'avanzado', 'experto', 'maestro'];
        const designIndex = skillLevels.indexOf(designSkillFromScore);
        const craftIndex = skillLevels.indexOf(craftsmanshipSkill);
        
        return skillLevels[Math.max(designIndex, craftIndex)];
    }

    assessProjectRisk(stoneSettings, additionalFactors) {
        let riskLevel = 'bajo';
        let riskFactors = [];

        // Evaluar riesgo por tipo de piedras
        if (stoneSettings && stoneSettings.length > 0) {
            stoneSettings.forEach(setting => {
                const stoneConfig = this.config.stoneSettingDifficulty.stoneTypeDifficulty[setting.stoneType];
                if (stoneConfig && ['alto', 'muy_alto'].includes(stoneConfig.riskFactor)) {
                    riskFactors.push(`Piedra frágil: ${stoneConfig.name}`);
                    riskLevel = 'alto';
                }
            });
        }

        // Evaluar riesgo por factores adicionales
        if (additionalFactors && additionalFactors.length > 0) {
            additionalFactors.forEach(factor => {
                if (['moving_parts', 'hidden_elements', 'size_extremes'].includes(factor)) {
                    riskFactors.push(`Factor de riesgo: ${this.config.additionalComplexityFactors[factor].name}`);
                    riskLevel = riskLevel === 'bajo' ? 'medio' : riskLevel;
                }
            });
        }

        return {
            level: riskLevel,
            factors: riskFactors,
            mitigation: this.generateRiskMitigationPlan(riskFactors)
        };
    }

    generateRiskMitigationPlan(riskFactors) {
        const mitigations = [];

        riskFactors.forEach(factor => {
            if (factor.includes('frágil')) {
                mitigations.push('Usar herramientas suaves y temperatura controlada');
                mitigations.push('Realizar pruebas en material de muestra');
            }
            if (factor.includes('moving_parts')) {
                mitigations.push('Crear prototipo para probar mecanismo');
                mitigations.push('Documentar proceso de ensamblado');
            }
            if (factor.includes('size_extremes')) {
                mitigations.push('Usar herramientas especializadas para tamaño');
                mitigations.push('Considerar técnicas de manufactura alternativas');
            }
        });

        return [...new Set(mitigations)]; // Remover duplicados
    }

    generateRecommendations(complexityScore, craftsmanshipLevel, stoneSettings) {
        const recommendations = [];

        // Recomendaciones basadas en puntuación de complejidad
        if (complexityScore.overall > 8) {
            recommendations.push('Considerar dividir el proyecto en fases para reducir riesgo');
            recommendations.push('Asignar al artesano más experimentado disponible');
            recommendations.push('Incluir tiempo adicional para pruebas y refinamientos');
        }

        if (complexityScore.breakdown.setting > 6) {
            recommendations.push('Realizar pruebas de engaste en muestras antes del trabajo final');
            recommendations.push('Considerar técnicas de engaste alternativas si es apropiado');
        }

        // Recomendaciones por artesanía
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];
        if (craftsmanshipConfig && craftsmanshipConfig.skillRequirement === 'maestro') {
            recommendations.push('Documentar el proceso para futuras referencias');
            recommendations.push('Considerar crear un portafolio fotográfico del proceso');
        }

        // Recomendaciones por piedras
        if (stoneSettings && stoneSettings.some(s => s.stoneType === 'emerald' || s.stoneType === 'opal')) {
            recommendations.push('Tener piedras de repuesto disponibles');
            recommendations.push('Usar técnicas de engaste de bajo estrés');
        }

        return recommendations;
    }

    // ===============================================================================================
    // BIBLIOTECA DE DISEÑOS Y TEMPLATES
    // ===============================================================================================

    addDesignToLibrary(designData) {
        const {
            id,
            name,
            category,
            complexity,
            settingType = null,
            stoneCount = 0,
            craftsmanship = 'standard',
            description = '',
            tags = []
        } = designData;

        if (!id || !name) {
            throw new Error('ID y nombre del diseño son requeridos');
        }

        const design = {
            id: id,
            name: name,
            category: category,
            complexity: complexity,
            settingType: settingType,
            stoneCount: stoneCount,
            craftsmanship: craftsmanship,
            description: description,
            tags: tags,
            createdAt: Date.now(),
            usageCount: 0
        };

        this.designLibrary.set(id, design);
        this.saveDesignLibrary();

        console.log(`📚 Diseño "${name}" agregado a la biblioteca`);

        return design;
    }

    getDesignFromLibrary(designId) {
        const design = this.designLibrary.get(designId);
        if (design) {
            design.usageCount = (design.usageCount || 0) + 1;
            this.saveDesignLibrary();
        }
        return design;
    }

    searchDesigns(criteria) {
        const { category, complexity, maxStoneCount, craftsmanship, tags } = criteria;
        
        const results = Array.from(this.designLibrary.values()).filter(design => {
            if (category && design.category !== category) return false;
            if (complexity && design.complexity !== complexity) return false;
            if (maxStoneCount && design.stoneCount > maxStoneCount) return false;
            if (craftsmanship && design.craftsmanship !== craftsmanship) return false;
            if (tags && tags.length > 0) {
                const designTags = design.tags || [];
                if (!tags.some(tag => designTags.includes(tag))) return false;
            }
            return true;
        });

        return results.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }

    // ===============================================================================================
    // GESTIÓN DE HISTORIAL Y PERSISTENCIA
    // ===============================================================================================

    addToHistory(calculationResult) {
        this.calculationHistory.unshift({
            ...calculationResult,
            id: `complexity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Mantener límite del historial
        if (this.calculationHistory.length > this.config.storage.maxHistoryEntries) {
            this.calculationHistory = this.calculationHistory.slice(0, this.config.storage.maxHistoryEntries);
        }

        this.saveCalculationHistory();
    }

    getCalculationHistory(filters = {}) {
        let history = [...this.calculationHistory];

        if (filters.category) {
            history = history.filter(calc => 
                calc.complexityAnalysis.category === filters.category
            );
        }

        if (filters.minScore) {
            history = history.filter(calc => 
                calc.complexityAnalysis.overallScore >= filters.minScore
            );
        }

        if (filters.customerId) {
            history = history.filter(calc => 
                calc.calculation.customerId === filters.customerId
            );
        }

        if (filters.dateFrom) {
            history = history.filter(calc => 
                calc.calculation.timestamp >= filters.dateFrom
            );
        }

        if (filters.limit) {
            history = history.slice(0, filters.limit);
        }

        return history;
    }

    saveCalculationHistory() {
        try {
            localStorage.setItem(this.config.storage.complexityCalculationsKey, JSON.stringify(this.calculationHistory));
        } catch (error) {
            console.error('❌ Error guardando historial de cálculos:', error);
        }
    }

    saveDesignLibrary() {
        try {
            const libraryArray = Array.from(this.designLibrary.entries());
            localStorage.setItem(this.config.storage.designLibraryKey, JSON.stringify(libraryArray));
        } catch (error) {
            console.error('❌ Error guardando biblioteca de diseños:', error);
        }
    }

    exportData() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            calculationHistory: this.calculationHistory.slice(0, 100), // Últimas 100 entradas
            designLibrary: Array.from(this.designLibrary.entries()),
            craftsmanProfiles: Array.from(this.craftsmanProfiles.entries()),
            config: this.config
        };
    }

    importData(data) {
        try {
            if (data.calculationHistory) {
                this.calculationHistory = data.calculationHistory;
            }
            if (data.designLibrary) {
                this.designLibrary = new Map(data.designLibrary);
            }
            if (data.craftsmanProfiles) {
                this.craftsmanProfiles = new Map(data.craftsmanProfiles);
            }

            console.log('📥 Datos de complejidad importados exitosamente');
            return { success: true };
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            return { success: false, error: error.message };
        }
    }

    // ===============================================================================================
    // SISTEMA DE OBSERVADORES
    // ===============================================================================================

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
                console.error('Error in complexity pricing engine observer:', error);
            }
        });
    }

    // ===============================================================================================
    // MÉTODOS PÚBLICOS DE UTILIDAD
    // ===============================================================================================

    getSystemStats() {
        const history = this.calculationHistory;
        const categoryStats = {};
        
        // Estadísticas por categoría de complejidad
        Object.keys(this.config.complexityScoring.scoreRanges).forEach(category => {
            categoryStats[category] = history.filter(calc => 
                calc.complexityAnalysis.category === category
            ).length;
        });

        return {
            totalCalculations: history.length,
            designLibrarySize: this.designLibrary.size,
            craftsmanProfiles: this.craftsmanProfiles.size,
            categoryDistribution: categoryStats,
            averageComplexityScore: history.length > 0 ? 
                history.reduce((sum, calc) => sum + calc.complexityAnalysis.overallScore, 0) / history.length : 0,
            averageProjectCost: history.length > 0 ?
                history.reduce((sum, calc) => sum + calc.pricing.totalProjectCost, 0) / history.length : 0,
            averageTimeEstimate: history.length > 0 ?
                history.reduce((sum, calc) => sum + calc.timeEstimate.totalHours, 0) / history.length : 0
        };
    }

    getQuickComplexityEstimate(designType, stoneCount = 0, craftsmanshipLevel = 'standard') {
        // Estimación rápida sin cálculo completo
        const designComplexity = stoneCount === 0 ? 'simple' : 
                                 stoneCount <= 5 ? 'moderate' : 
                                 stoneCount <= 20 ? 'complex' : 'intricate';

        const designConfig = this.config.designComplexity[designComplexity];
        const craftsmanshipConfig = this.config.craftsmanshipLevel[craftsmanshipLevel];

        const estimatedMultiplier = (designConfig?.multiplier || 1.0) * (craftsmanshipConfig?.multiplier || 1.0);
        const estimatedTime = 8 * (designConfig?.timeMultiplier || 1.0) * (craftsmanshipConfig?.timeMultiplier || 1.0);
        const estimatedCost = estimatedTime * this.config.systemSettings.baseHourlyRate * estimatedMultiplier;

        return {
            complexity: designComplexity,
            estimatedTimeHours: estimatedTime,
            estimatedCost: estimatedCost,
            priceMultiplier: estimatedMultiplier,
            skillRequirement: craftsmanshipConfig?.skillRequirement || 'básico'
        };
    }
}

// ===============================================================================================
// FUNCIONES AUXILIARES Y UTILIDADES
// ===============================================================================================

function formatComplexityScore(score) {
    return `${score.toFixed(2)}/10.0`;
}

function formatTimeEstimate(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)} minutos`;
    } else if (hours < 24) {
        return `${hours.toFixed(1)} horas`;
    } else {
        const days = Math.floor(hours / 8); // 8 horas laborales por día
        const remainingHours = hours % 8;
        return `${days} día${days > 1 ? 's' : ''} ${remainingHours.toFixed(1)} horas`;
    }
}

function getComplexityColor(category) {
    const colorMap = {
        simple: '#4CAF50',
        moderate: '#FF9800', 
        complex: '#FF5722',
        expert: '#9C27B0',
        master: '#E91E63'
    };
    return colorMap[category] || '#666666';
}

// ===============================================================================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// ===============================================================================================

// Función para integrar con sistema de mano de obra
function integrateWithLaborSystem() {
    if (typeof window !== 'undefined' && window.laborRateCalculator) {
        window.laborRateCalculator.complexityEngine = window.complexityPricingEngine;
        
        // Función para calcular costo con complejidad integrada
        window.laborRateCalculator.calculateWithComplexity = function(laborParams, complexityParams) {
            const complexityResult = window.complexityPricingEngine.calculateComplexityPrice({
                ...complexityParams,
                baseTimeHours: laborParams.estimatedHours || 4
            });
            
            const laborResult = this.calculateLaborCost({
                ...laborParams,
                estimatedHours: complexityResult.timeEstimate.totalHours,
                complexity: complexityResult.complexityAnalysis.category
            });

            return {
                complexityAnalysis: complexityResult,
                laborCalculation: laborResult,
                combinedCost: complexityResult.pricing.totalProjectCost,
                timeBreakdown: complexityResult.timeEstimate,
                skillRequirement: complexityResult.skillRequirement
            };
        };
        
        console.log('🔗 Motor de complejidad integrado con sistema de mano de obra');
    }
}

// Función para integrar con sistema de cotizaciones
function integrateWithQuotationSystem() {
    if (typeof window !== 'undefined' && window.quotationSystem) {
        window.quotationSystem.addComplexityPricing = function(productData, complexityParams) {
            return window.complexityPricingEngine.calculateComplexityPrice({
                ...complexityParams,
                customerId: productData.customerId
            });
        };
        
        console.log('🔗 Motor de complejidad integrado con cotizaciones');
    }
}

// ===============================================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// ===============================================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.complexityPricingEngine = new ComplexityPricingEngine();
    
    // Integrar con otros sistemas cuando estén disponibles
    setTimeout(() => {
        integrateWithLaborSystem();
        integrateWithQuotationSystem();
    }, 1000);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ComplexityPricingEngine,
        COMPLEXITY_PRICING_CONFIG,
        formatComplexityScore,
        formatTimeEstimate,
        getComplexityColor
    };
}

console.log('✅ Motor de Precios por Complejidad de Diseño v1.0 cargado correctamente');
console.log('🎨 Calcular complejidad: window.complexityPricingEngine.calculateComplexityPrice(params)');
console.log('📊 Estadísticas: window.complexityPricingEngine.getSystemStats()');
console.log('⚡ Estimación rápida: window.complexityPricingEngine.getQuickComplexityEstimate("rings", 5, "premium")');
console.log('📚 Buscar diseños: window.complexityPricingEngine.searchDesigns({category: "rings"})');