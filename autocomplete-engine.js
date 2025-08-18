// autocomplete-engine.js - Motor de Sugerencias Inteligente para ciaociao.mx
// Desarrollado con Claude Code AI - Fase 2 del Sistema Auto-Complete

/**
 * Sistema de Auto-Complete Inteligente para Joyería ciaociao.mx
 * 
 * Características principales:
 * - Análisis de datos históricos en localStorage
 * - Algoritmo de ranking con frecuencia, recencia y contexto
 * - Búsqueda fuzzy con tolerancia a errores de tipeo
 * - Indexación optimizada para búsqueda rápida
 * - Sugerencias contextuales basadas en el tipo de campo
 * 
 * Campos objetivo:
 * - clientName, clientPhone, clientEmail
 * - pieceType, material, description
 * - stones, size, location
 */

class AutoCompleteEngine {
    constructor() {
        this.config = {
            maxSuggestions: 8,
            minQueryLength: 2,
            cacheExpiry: 30 * 60 * 1000, // 30 minutos
            weights: {
                frequency: 0.4,    // 40% peso por frecuencia de uso
                recency: 0.3,      // 30% peso por recencia
                similarity: 0.2,   // 20% peso por similitud
                context: 0.1       // 10% peso por contexto
            }
        };

        this.indexManager = new IndexManager();
        this.searchEngine = new SearchEngine();
        this.rankingEngine = new RankingEngine(this.config.weights);
        
        this.isInitialized = false;
        this.lastIndexUpdate = 0;
        
        console.log('✅ AutoCompleteEngine inicializado');
    }

    /**
     * Inicialización del motor de auto-complete
     */
    async initialize() {
        try {
            console.log('🔄 Inicializando motor de auto-complete...');
            
            // Cargar y analizar datos históricos
            await this.indexManager.buildIndexes();
            
            // Verificar calidad de datos
            const stats = this.indexManager.getIndexStats();
            console.log('📊 Estadísticas de datos:', stats);
            
            this.isInitialized = true;
            this.lastIndexUpdate = Date.now();
            
            console.log('✅ Motor de auto-complete listo');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando auto-complete:', error);
            return false;
        }
    }

    /**
     * Obtener sugerencias para un campo específico
     * @param {string} fieldType - Tipo de campo (clientName, pieceType, etc.)
     * @param {string} query - Texto ingresado por el usuario
     * @param {Object} context - Contexto adicional del formulario
     * @returns {Array} Lista de sugerencias ordenadas
     */
    async getSuggestions(fieldType, query, context = {}) {
        try {
            // Validar inicialización
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Validar entrada
            if (!query || query.length < this.config.minQueryLength) {
                return [];
            }

            // Actualizar índices si es necesario
            if (this.shouldUpdateIndexes()) {
                await this.indexManager.updateIndexes();
                this.lastIndexUpdate = Date.now();
            }

            // Buscar candidatos
            const candidates = this.searchEngine.findCandidates(fieldType, query);
            
            if (candidates.length === 0) {
                return [];
            }

            // Calcular puntuaciones
            const scoredResults = this.rankingEngine.rankResults(
                candidates, 
                query, 
                fieldType, 
                context
            );

            // Devolver top sugerencias
            return scoredResults
                .slice(0, this.config.maxSuggestions)
                .map(result => ({
                    value: result.value,
                    score: Math.round(result.score * 100),
                    frequency: result.frequency,
                    lastUsed: result.lastUsed,
                    type: result.type || fieldType
                }));

        } catch (error) {
            console.error(`❌ Error obteniendo sugerencias para ${fieldType}:`, error);
            return [];
        }
    }

    /**
     * Aprender de nueva entrada del usuario
     * @param {string} fieldType - Tipo de campo
     * @param {string} value - Valor ingresado
     * @param {Object} context - Contexto del formulario
     */
    learnFromInput(fieldType, value, context = {}) {
        try {
            if (!value || value.trim().length < 2) {
                return;
            }

            const cleanValue = value.trim();
            
            // Registrar en el índice
            this.indexManager.addEntry(fieldType, cleanValue, context);
            
            console.log(`📚 Aprendido: ${fieldType} = "${cleanValue}"`);
            
        } catch (error) {
            console.error('❌ Error aprendiendo de entrada:', error);
        }
    }

    /**
     * Verificar si se deben actualizar los índices
     */
    shouldUpdateIndexes() {
        const timeSinceUpdate = Date.now() - this.lastIndexUpdate;
        return timeSinceUpdate > this.config.cacheExpiry;
    }

    /**
     * Obtener estadísticas del motor
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            lastUpdate: new Date(this.lastIndexUpdate).toISOString(),
            indexStats: this.indexManager.getIndexStats(),
            config: this.config
        };
    }
}

/**
 * Gestor de Índices - Organiza y mantiene los datos para búsqueda rápida
 */
class IndexManager {
    constructor() {
        this.indexes = {
            clientName: new Map(),
            clientPhone: new Map(),
            clientEmail: new Map(),
            pieceType: new Map(),
            material: new Map(),
            description: new Map(),
            stones: new Map(),
            size: new Map(),
            location: new Map()
        };

        this.metadata = {
            lastBuild: 0,
            totalEntries: 0,
            dataVersion: 1
        };
    }

    /**
     * Construir índices desde datos históricos
     */
    async buildIndexes() {
        try {
            console.log('🔄 Construyendo índices desde datos históricos...');
            
            // Limpiar índices existentes
            this.clearIndexes();
            
            // Cargar datos de recibos
            const receipts = this.loadReceiptsData();
            console.log(`📄 Analizando ${receipts.length} recibos...`);
            
            // Cargar datos de cotizaciones
            const quotations = this.loadQuotationsData();
            console.log(`💰 Analizando ${quotations.length} cotizaciones...`);
            
            // Procesar recibos
            receipts.forEach(receipt => this.processReceiptForIndexing(receipt));
            
            // Procesar cotizaciones
            quotations.forEach(quotation => this.processQuotationForIndexing(quotation));
            
            // Actualizar metadata
            this.metadata.lastBuild = Date.now();
            this.metadata.totalEntries = this.calculateTotalEntries();
            
            console.log(`✅ Índices construidos: ${this.metadata.totalEntries} entradas`);
            
        } catch (error) {
            console.error('❌ Error construyendo índices:', error);
            throw error;
        }
    }

    /**
     * Cargar datos de recibos desde localStorage
     */
    loadReceiptsData() {
        try {
            const data = localStorage.getItem('ciaociao_receipts');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Error cargando recibos:', error);
            return [];
        }
    }

    /**
     * Cargar datos de cotizaciones desde localStorage
     */
    loadQuotationsData() {
        try {
            const data = localStorage.getItem('quotations_ciaociao');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Error cargando cotizaciones:', error);
            return [];
        }
    }

    /**
     * Procesar recibo para indexación
     */
    processReceiptForIndexing(receipt) {
        try {
            const timestamp = new Date(receipt.receiptDate || receipt.timestamp || Date.now()).getTime();
            
            // Campos de cliente
            if (receipt.clientName) {
                this.addToIndex('clientName', receipt.clientName, timestamp);
            }
            if (receipt.clientPhone) {
                this.addToIndex('clientPhone', receipt.clientPhone, timestamp);
            }
            if (receipt.clientEmail) {
                this.addToIndex('clientEmail', receipt.clientEmail, timestamp);
            }
            
            // Campos de pieza
            if (receipt.pieceType) {
                this.addToIndex('pieceType', receipt.pieceType, timestamp);
            }
            if (receipt.material) {
                this.addToIndex('material', receipt.material, timestamp);
            }
            if (receipt.description) {
                this.addToIndex('description', receipt.description, timestamp);
            }
            if (receipt.stones) {
                this.addToIndex('stones', receipt.stones, timestamp);
            }
            if (receipt.size) {
                this.addToIndex('size', receipt.size, timestamp);
            }
            if (receipt.location) {
                this.addToIndex('location', receipt.location, timestamp);
            }
            
        } catch (error) {
            console.error('❌ Error procesando recibo:', error);
        }
    }

    /**
     * Procesar cotización para indexación
     */
    processQuotationForIndexing(quotation) {
        try {
            const timestamp = new Date(quotation.quotationDate || quotation.timestamp || Date.now()).getTime();
            
            // Campos de cliente
            if (quotation.clientName) {
                this.addToIndex('clientName', quotation.clientName, timestamp);
            }
            if (quotation.clientPhone) {
                this.addToIndex('clientPhone', quotation.clientPhone, timestamp);
            }
            if (quotation.clientEmail) {
                this.addToIndex('clientEmail', quotation.clientEmail, timestamp);
            }
            
            // Procesar productos de la cotización
            if (quotation.products && Array.isArray(quotation.products)) {
                quotation.products.forEach(product => {
                    if (product.type) {
                        this.addToIndex('pieceType', product.type, timestamp);
                    }
                    if (product.material) {
                        this.addToIndex('material', product.material, timestamp);
                    }
                    if (product.description) {
                        this.addToIndex('description', product.description, timestamp);
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error procesando cotización:', error);
        }
    }

    /**
     * Agregar entrada al índice específico
     */
    addToIndex(fieldType, value, timestamp = Date.now()) {
        if (!value || typeof value !== 'string') {
            return;
        }

        const cleanValue = value.trim();
        if (cleanValue.length === 0) {
            return;
        }

        const index = this.indexes[fieldType];
        if (!index) {
            console.warn(`⚠️ Tipo de campo desconocido: ${fieldType}`);
            return;
        }

        // Obtener o crear entrada
        let entry = index.get(cleanValue);
        if (!entry) {
            entry = {
                value: cleanValue,
                frequency: 0,
                firstUsed: timestamp,
                lastUsed: timestamp,
                searchTokens: this.generateSearchTokens(cleanValue)
            };
        }

        // Actualizar estadísticas
        entry.frequency += 1;
        entry.lastUsed = Math.max(entry.lastUsed, timestamp);
        
        // Guardar en índice
        index.set(cleanValue, entry);
    }

    /**
     * Generar tokens de búsqueda para búsqueda fuzzy
     */
    generateSearchTokens(value) {
        const tokens = new Set();
        
        // Token completo
        tokens.add(value.toLowerCase());
        
        // Palabras individuales
        value.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length >= 2) {
                tokens.add(word);
                // Substrings para matching parcial
                for (let i = 0; i <= word.length - 2; i++) {
                    for (let j = i + 2; j <= word.length; j++) {
                        tokens.add(word.substring(i, j));
                    }
                }
            }
        });
        
        return Array.from(tokens);
    }

    /**
     * Agregar nueva entrada (método público)
     */
    addEntry(fieldType, value, context = {}) {
        this.addToIndex(fieldType, value);
    }

    /**
     * Actualizar índices incrementalmente
     */
    async updateIndexes() {
        // Para esta implementación, reconstruir completamente
        // En futuras versiones se puede optimizar para updates incrementales
        await this.buildIndexes();
    }

    /**
     * Limpiar todos los índices
     */
    clearIndexes() {
        Object.keys(this.indexes).forEach(key => {
            this.indexes[key].clear();
        });
    }

    /**
     * Calcular total de entradas en todos los índices
     */
    calculateTotalEntries() {
        return Object.values(this.indexes).reduce((total, index) => total + index.size, 0);
    }

    /**
     * Obtener estadísticas de los índices
     */
    getIndexStats() {
        const stats = {};
        Object.keys(this.indexes).forEach(key => {
            stats[key] = this.indexes[key].size;
        });
        
        return {
            ...stats,
            total: this.metadata.totalEntries,
            lastBuild: new Date(this.metadata.lastBuild).toISOString(),
            version: this.metadata.dataVersion
        };
    }

    /**
     * Obtener todas las entradas de un índice específico
     */
    getIndexEntries(fieldType) {
        const index = this.indexes[fieldType];
        return index ? Array.from(index.values()) : [];
    }
}

/**
 * Motor de Búsqueda - Encuentra candidatos usando búsqueda fuzzy
 */
class SearchEngine {
    constructor() {
        this.indexManager = null;
    }

    /**
     * Encontrar candidatos para una consulta
     */
    findCandidates(fieldType, query) {
        try {
            // Obtener referencia al IndexManager desde el contexto global
            this.indexManager = window.autoCompleteEngine?.indexManager;
            
            if (!this.indexManager) {
                console.warn('⚠️ IndexManager no disponible');
                return [];
            }

            const entries = this.indexManager.getIndexEntries(fieldType);
            if (entries.length === 0) {
                return [];
            }

            const queryLower = query.toLowerCase().trim();
            const candidates = [];

            entries.forEach(entry => {
                const similarity = this.calculateSimilarity(queryLower, entry);
                if (similarity > 0.1) { // Umbral mínimo de similitud
                    candidates.push({
                        ...entry,
                        similarity: similarity
                    });
                }
            });

            return candidates;

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            return [];
        }
    }

    /**
     * Calcular similitud entre query y entrada
     */
    calculateSimilarity(query, entry) {
        const value = entry.value.toLowerCase();
        
        // Coincidencia exacta al inicio (máxima prioridad)
        if (value.startsWith(query)) {
            return 1.0;
        }
        
        // Coincidencia en cualquier parte del texto
        if (value.includes(query)) {
            return 0.8;
        }
        
        // Búsqueda en tokens para coincidencias parciales
        const maxTokenSimilarity = Math.max(
            ...entry.searchTokens.map(token => {
                if (token.startsWith(query)) return 0.7;
                if (token.includes(query)) return 0.5;
                return this.levenshteinSimilarity(query, token);
            })
        );
        
        return maxTokenSimilarity;
    }

    /**
     * Calcular similitud usando distancia Levenshtein
     */
    levenshteinSimilarity(s1, s2) {
        if (s1.length === 0) return s2.length === 0 ? 1 : 0;
        if (s2.length === 0) return 0;
        
        const maxLength = Math.max(s1.length, s2.length);
        const distance = this.levenshteinDistance(s1, s2);
        
        return Math.max(0, (maxLength - distance) / maxLength);
    }

    /**
     * Calcular distancia Levenshtein entre dos strings
     */
    levenshteinDistance(s1, s2) {
        const matrix = [];
        
        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[s2.length][s1.length];
    }
}

/**
 * Motor de Ranking - Calcula puntuaciones finales basadas en múltiples factores
 */
class RankingEngine {
    constructor(weights) {
        this.weights = weights;
    }

    /**
     * Rankear resultados por relevancia
     */
    rankResults(candidates, query, fieldType, context) {
        const now = Date.now();
        
        return candidates.map(candidate => {
            const frequencyScore = this.calculateFrequencyScore(candidate.frequency);
            const recencyScore = this.calculateRecencyScore(candidate.lastUsed, now);
            const similarityScore = candidate.similarity;
            const contextScore = this.calculateContextScore(candidate, context, fieldType);
            
            const finalScore = 
                (frequencyScore * this.weights.frequency) +
                (recencyScore * this.weights.recency) +
                (similarityScore * this.weights.similarity) +
                (contextScore * this.weights.context);
            
            return {
                ...candidate,
                score: finalScore,
                breakdown: {
                    frequency: frequencyScore,
                    recency: recencyScore,
                    similarity: similarityScore,
                    context: contextScore
                }
            };
        }).sort((a, b) => b.score - a.score);
    }

    /**
     * Calcular puntuación por frecuencia de uso
     */
    calculateFrequencyScore(frequency) {
        // Normalización logarítmica para evitar que valores muy altos dominen
        return Math.min(1.0, Math.log(frequency + 1) / Math.log(10));
    }

    /**
     * Calcular puntuación por recencia
     */
    calculateRecencyScore(lastUsed, now) {
        const ageInDays = (now - lastUsed) / (1000 * 60 * 60 * 24);
        
        // Decay exponencial: más reciente = mayor puntuación
        if (ageInDays <= 7) return 1.0;        // Última semana
        if (ageInDays <= 30) return 0.8;       // Último mes
        if (ageInDays <= 90) return 0.6;       // Últimos 3 meses
        if (ageInDays <= 365) return 0.4;      // Último año
        return 0.2; // Más de un año
    }

    /**
     * Calcular puntuación por contexto
     */
    calculateContextScore(candidate, context, fieldType) {
        // Por ahora, contexto básico
        // En futuras versiones se puede implementar contexto más sofisticado
        
        // Bonus por tipo de campo específico
        if (fieldType === 'material' && context.pieceType) {
            // Materiales más comunes para tipos específicos de joyería
            const materialMappings = {
                'anillo': ['oro', 'plata', 'platino'],
                'collar': ['oro', 'plata', 'acero'],
                'pulsera': ['oro', 'plata', 'cuero'],
                'aretes': ['oro', 'plata', 'acero']
            };
            
            const suitableMaterials = materialMappings[context.pieceType.toLowerCase()] || [];
            if (suitableMaterials.some(material => 
                candidate.value.toLowerCase().includes(material))) {
                return 1.0;
            }
        }
        
        return 0.5; // Puntuación neutral por defecto
    }
}

// Inicialización global del motor
window.AutoCompleteEngine = AutoCompleteEngine;

// Instancia global para uso en toda la aplicación
window.autoCompleteEngine = null;

/**
 * Función de inicialización global
 */
async function initializeAutoComplete() {
    try {
        if (!window.autoCompleteEngine) {
            window.autoCompleteEngine = new AutoCompleteEngine();
            await window.autoCompleteEngine.initialize();
        }
        return window.autoCompleteEngine;
    } catch (error) {
        console.error('❌ Error inicializando auto-complete global:', error);
        return null;
    }
}

console.log('✅ AutoComplete Engine cargado - Listo para inicialización');