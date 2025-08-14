// advanced-cache-system.js - SISTEMA DE CACHE AVANZADO EN 3 NIVELES v1.0
// Cache inteligente: Memoria (1min) → localStorage (1hr) → IndexedDB (24hr)
// =================================================================

console.log('🗄️ Iniciando Sistema de Cache Avanzado v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE CACHE
// =================================================================

const CACHE_CONFIG = {
    // Configuración de niveles de cache
    levels: {
        memory: {
            name: 'Memory Cache',
            ttl: 60000,          // 1 minuto
            maxSize: 100,        // 100 entradas máximo
            priority: 1          // Mayor prioridad
        },
        localStorage: {
            name: 'LocalStorage Cache',
            ttl: 3600000,        // 1 hora
            maxSize: 500,        // 500 entradas máximo
            priority: 2
        },
        indexedDB: {
            name: 'IndexedDB Cache',
            ttl: 86400000,       // 24 horas
            maxSize: 5000,       // 5000 entradas máximo
            priority: 3
        }
    },

    // Configuración específica por tipo de dato
    dataTypes: {
        metalPrices: {
            memory: 30000,       // 30 segundos
            localStorage: 300000, // 5 minutos
            indexedDB: 1800000   // 30 minutos
        },
        exchangeRates: {
            memory: 60000,       // 1 minuto
            localStorage: 600000, // 10 minutos
            indexedDB: 3600000   // 1 hora
        },
        historicalData: {
            memory: 300000,      // 5 minutos
            localStorage: 3600000, // 1 hora
            indexedDB: 86400000  // 24 horas
        },
        userPreferences: {
            memory: 600000,      // 10 minutos
            localStorage: 86400000, // 24 horas
            indexedDB: 604800000   // 7 días
        },
        calculations: {
            memory: 120000,      // 2 minutos
            localStorage: 1800000, // 30 minutos
            indexedDB: 7200000   // 2 horas
        }
    },

    // Configuración de IndexedDB
    indexedDB: {
        name: 'CiaoCiaoCache',
        version: 1,
        stores: {
            metalPrices: 'metal_prices',
            exchangeRates: 'exchange_rates',
            historicalData: 'historical_data',
            userPreferences: 'user_preferences',
            calculations: 'calculations',
            metadata: 'cache_metadata'
        }
    },

    // Configuración de limpieza automática
    cleanup: {
        memoryInterval: 60000,    // 1 minuto
        localStorageInterval: 300000, // 5 minutos
        indexedDBInterval: 3600000,   // 1 hora
        maxCleanupTime: 5000     // 5 segundos máximo por limpieza
    }
};

// =================================================================
// CLASE PARA CACHE EN MEMORIA
// =================================================================

class MemoryCache {
    constructor(maxSize = CACHE_CONFIG.levels.memory.maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
        this.lastCleanup = Date.now();
    }

    set(key, value, ttl = CACHE_CONFIG.levels.memory.ttl) {
        // Si está lleno, eliminar entradas más antiguas
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const entry = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl,
            accessCount: 0,
            lastAccess: Date.now()
        };

        this.cache.set(key, entry);
        console.log(`💾 Memory cache set: ${key}`);
    }

    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.misses++;
            return null;
        }

        // Verificar TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        // Actualizar estadísticas de acceso
        entry.accessCount++;
        entry.lastAccess = Date.now();
        this.hits++;

        console.log(`✅ Memory cache hit: ${key}`);
        return entry.value;
    }

    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        // Verificar TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        console.log('🧹 Memory cache cleared');
    }

    evictOldest() {
        // Encontrar entrada más antigua con menos accesos
        let oldestEntry = null;
        let oldestKey = null;
        let minScore = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            // Score basado en antigüedad y frecuencia de acceso
            const ageScore = Date.now() - entry.timestamp;
            const accessScore = entry.accessCount > 0 ? 1 / entry.accessCount : 1;
            const score = ageScore * accessScore;

            if (score < minScore) {
                minScore = score;
                oldestKey = key;
                oldestEntry = entry;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`🗑️ Memory cache evicted: ${oldestKey}`);
        }
    }

    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        this.lastCleanup = now;
        
        if (cleanedCount > 0) {
            console.log(`🧹 Memory cache cleanup: ${cleanedCount} entries removed`);
        }
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            lastCleanup: this.lastCleanup
        };
    }
}

// =================================================================
// CLASE PARA CACHE EN LOCALSTORAGE
// =================================================================

class LocalStorageCache {
    constructor() {
        this.prefix = 'ciaociao_cache_';
        this.metadataKey = this.prefix + 'metadata';
        this.maxSize = CACHE_CONFIG.levels.localStorage.maxSize;
        this.hits = 0;
        this.misses = 0;
        
        this.initializeMetadata();
    }

    initializeMetadata() {
        try {
            const metadata = localStorage.getItem(this.metadataKey);
            if (!metadata) {
                this.saveMetadata({
                    entries: {},
                    totalSize: 0,
                    lastCleanup: Date.now()
                });
            }
        } catch (error) {
            console.warn('Error inicializando metadata de localStorage:', error);
        }
    }

    getMetadata() {
        try {
            const metadata = localStorage.getItem(this.metadataKey);
            return metadata ? JSON.parse(metadata) : { entries: {}, totalSize: 0, lastCleanup: Date.now() };
        } catch (error) {
            console.warn('Error leyendo metadata:', error);
            return { entries: {}, totalSize: 0, lastCleanup: Date.now() };
        }
    }

    saveMetadata(metadata) {
        try {
            localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
        } catch (error) {
            console.warn('Error guardando metadata:', error);
        }
    }

    set(key, value, ttl = CACHE_CONFIG.levels.localStorage.ttl) {
        try {
            const fullKey = this.prefix + key;
            const entry = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl,
                size: JSON.stringify(value).length
            };

            // Verificar si hay espacio suficiente
            const metadata = this.getMetadata();
            const estimatedSize = JSON.stringify(entry).length;

            if (metadata.totalSize + estimatedSize > this.getMaxStorageSize()) {
                this.evictOldEntries();
            }

            localStorage.setItem(fullKey, JSON.stringify(entry));

            // Actualizar metadata
            metadata.entries[key] = {
                timestamp: entry.timestamp,
                ttl: entry.ttl,
                size: entry.size
            };
            metadata.totalSize += entry.size;
            this.saveMetadata(metadata);

            console.log(`💾 LocalStorage cache set: ${key}`);

        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
            
            // Si falla por falta de espacio, limpiar y reintentar
            if (error.name === 'QuotaExceededError') {
                this.cleanup();
                this.set(key, value, ttl); // Reintentar
            }
        }
    }

    get(key) {
        try {
            const fullKey = this.prefix + key;
            const stored = localStorage.getItem(fullKey);
            
            if (!stored) {
                this.misses++;
                return null;
            }

            const entry = JSON.parse(stored);
            
            // Verificar TTL
            if (Date.now() - entry.timestamp > entry.ttl) {
                this.delete(key);
                this.misses++;
                return null;
            }

            this.hits++;
            console.log(`✅ LocalStorage cache hit: ${key}`);
            return entry.value;

        } catch (error) {
            console.warn('Error leyendo de localStorage:', error);
            this.misses++;
            return null;
        }
    }

    has(key) {
        try {
            const fullKey = this.prefix + key;
            const stored = localStorage.getItem(fullKey);
            
            if (!stored) return false;

            const entry = JSON.parse(stored);
            
            // Verificar TTL
            if (Date.now() - entry.timestamp > entry.ttl) {
                this.delete(key);
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    delete(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);

            // Actualizar metadata
            const metadata = this.getMetadata();
            if (metadata.entries[key]) {
                metadata.totalSize -= metadata.entries[key].size;
                delete metadata.entries[key];
                this.saveMetadata(metadata);
            }

            console.log(`🗑️ LocalStorage cache deleted: ${key}`);
            return true;
        } catch (error) {
            console.warn('Error eliminando de localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            this.saveMetadata({
                entries: {},
                totalSize: 0,
                lastCleanup: Date.now()
            });

            this.hits = 0;
            this.misses = 0;

            console.log('🧹 LocalStorage cache cleared');
        } catch (error) {
            console.warn('Error limpiando localStorage:', error);
        }
    }

    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        const metadata = this.getMetadata();

        // Limpiar entradas expiradas
        Object.keys(metadata.entries).forEach(key => {
            const entry = metadata.entries[key];
            if (now - entry.timestamp > entry.ttl) {
                this.delete(key);
                cleanedCount++;
            }
        });

        metadata.lastCleanup = now;
        this.saveMetadata(metadata);

        if (cleanedCount > 0) {
            console.log(`🧹 LocalStorage cache cleanup: ${cleanedCount} entries removed`);
        }
    }

    evictOldEntries() {
        const metadata = this.getMetadata();
        const entries = Object.entries(metadata.entries);
        
        // Ordenar por antigüedad
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Eliminar las entradas más antiguas hasta liberar espacio
        const targetSize = this.getMaxStorageSize() * 0.7; // Liberar 30%
        let currentSize = metadata.totalSize;
        
        for (const [key] of entries) {
            if (currentSize <= targetSize) break;
            
            const entrySize = metadata.entries[key].size;
            this.delete(key);
            currentSize -= entrySize;
        }
    }

    getMaxStorageSize() {
        // Estimar tamaño máximo disponible (conservador)
        return 2 * 1024 * 1024; // 2MB
    }

    getStats() {
        const metadata = this.getMetadata();
        
        return {
            size: Object.keys(metadata.entries).length,
            maxSize: this.maxSize,
            totalSize: metadata.totalSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            lastCleanup: metadata.lastCleanup
        };
    }
}

// =================================================================
// CLASE PARA CACHE EN INDEXEDDB
// =================================================================

class IndexedDBCache {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.hits = 0;
        this.misses = 0;
        this.initPromise = this.initialize();
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                CACHE_CONFIG.indexedDB.name,
                CACHE_CONFIG.indexedDB.version
            );

            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('✅ IndexedDB cache inicializado');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object stores
                Object.values(CACHE_CONFIG.indexedDB.stores).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'key' });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('ttl', 'ttl', { unique: false });
                    }
                });

                console.log('🏗️ IndexedDB object stores creados');
            };
        });
    }

    async waitForReady() {
        if (this.isReady) return;
        await this.initPromise;
    }

    async set(key, value, ttl = CACHE_CONFIG.levels.indexedDB.ttl, storeName = 'metal_prices') {
        try {
            await this.waitForReady();

            const entry = {
                key: key,
                value: value,
                timestamp: Date.now(),
                ttl: ttl,
                expiresAt: Date.now() + ttl
            };

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.put(entry);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            console.log(`💾 IndexedDB cache set: ${key} in ${storeName}`);

        } catch (error) {
            console.error('Error guardando en IndexedDB:', error);
        }
    }

    async get(key, storeName = 'metal_prices') {
        try {
            await this.waitForReady();

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const entry = await new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (!entry) {
                this.misses++;
                return null;
            }

            // Verificar TTL
            if (Date.now() > entry.expiresAt) {
                await this.delete(key, storeName);
                this.misses++;
                return null;
            }

            this.hits++;
            console.log(`✅ IndexedDB cache hit: ${key} from ${storeName}`);
            return entry.value;

        } catch (error) {
            console.error('Error leyendo de IndexedDB:', error);
            this.misses++;
            return null;
        }
    }

    async has(key, storeName = 'metal_prices') {
        try {
            await this.waitForReady();

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const entry = await new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (!entry) return false;

            // Verificar TTL
            if (Date.now() > entry.expiresAt) {
                await this.delete(key, storeName);
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    async delete(key, storeName = 'metal_prices') {
        try {
            await this.waitForReady();

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            console.log(`🗑️ IndexedDB cache deleted: ${key} from ${storeName}`);
            return true;

        } catch (error) {
            console.error('Error eliminando de IndexedDB:', error);
            return false;
        }
    }

    async clear(storeName = null) {
        try {
            await this.waitForReady();

            const storeNames = storeName ? 
                [storeName] : 
                Object.values(CACHE_CONFIG.indexedDB.stores);

            for (const store of storeNames) {
                const transaction = this.db.transaction([store], 'readwrite');
                const objectStore = transaction.objectStore(store);
                
                await new Promise((resolve, reject) => {
                    const request = objectStore.clear();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            this.hits = 0;
            this.misses = 0;

            console.log(`🧹 IndexedDB cache cleared: ${storeNames.join(', ')}`);

        } catch (error) {
            console.error('Error limpiando IndexedDB:', error);
        }
    }

    async cleanup() {
        try {
            await this.waitForReady();

            const now = Date.now();
            let totalCleaned = 0;

            for (const storeName of Object.values(CACHE_CONFIG.indexedDB.stores)) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const index = store.index('timestamp');
                
                // Usar cursor para encontrar entradas expiradas
                const cleanedCount = await new Promise((resolve, reject) => {
                    let count = 0;
                    const request = index.openCursor();
                    
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            const entry = cursor.value;
                            if (now > entry.expiresAt) {
                                cursor.delete();
                                count++;
                            }
                            cursor.continue();
                        } else {
                            resolve(count);
                        }
                    };
                    
                    request.onerror = () => reject(request.error);
                });

                totalCleaned += cleanedCount;
            }

            if (totalCleaned > 0) {
                console.log(`🧹 IndexedDB cache cleanup: ${totalCleaned} entries removed`);
            }

        } catch (error) {
            console.error('Error en cleanup de IndexedDB:', error);
        }
    }

    async getStats() {
        try {
            await this.waitForReady();

            let totalEntries = 0;
            const storeStats = {};

            for (const storeName of Object.values(CACHE_CONFIG.indexedDB.stores)) {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                const count = await new Promise((resolve, reject) => {
                    const request = store.count();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                storeStats[storeName] = count;
                totalEntries += count;
            }

            return {
                totalEntries: totalEntries,
                storeStats: storeStats,
                hits: this.hits,
                misses: this.misses,
                hitRate: this.hits / (this.hits + this.misses) || 0,
                isReady: this.isReady
            };

        } catch (error) {
            console.error('Error obteniendo stats de IndexedDB:', error);
            return {
                totalEntries: 0,
                storeStats: {},
                hits: this.hits,
                misses: this.misses,
                hitRate: 0,
                isReady: this.isReady
            };
        }
    }
}

// =================================================================
// GESTOR PRINCIPAL DE CACHE MULTINIVEL
// =================================================================

class AdvancedCacheManager {
    constructor() {
        this.memoryCache = new MemoryCache();
        this.localStorageCache = new LocalStorageCache();
        this.indexedDBCache = new IndexedDBCache();
        
        this.isInitialized = false;
        this.cleanupIntervals = {};
        
        this.initializeCleanupScheduler();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de cache avanzado...');
        
        try {
            // Esperar a que IndexedDB esté listo
            await this.indexedDBCache.waitForReady();
            
            this.isInitialized = true;
            console.log('✅ Sistema de cache avanzado inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando cache avanzado:', error);
            throw error;
        }
    }

    async set(key, value, dataType = 'metalPrices') {
        const ttlConfig = CACHE_CONFIG.dataTypes[dataType];
        
        if (!ttlConfig) {
            console.warn(`Tipo de dato ${dataType} no configurado, usando metalPrices`);
            dataType = 'metalPrices';
        }

        // Guardar en todos los niveles con TTL específico
        this.memoryCache.set(key, value, ttlConfig.memory);
        this.localStorageCache.set(key, value, ttlConfig.localStorage);
        
        // Para IndexedDB, determinar el store apropiado
        const storeName = this.getStoreNameForDataType(dataType);
        await this.indexedDBCache.set(key, value, ttlConfig.indexedDB, storeName);
        
        console.log(`💾 Cache set en todos los niveles: ${key} (${dataType})`);
    }

    async get(key, dataType = 'metalPrices') {
        // Intentar en orden de velocidad: Memory → localStorage → IndexedDB
        
        // Nivel 1: Memory Cache
        let value = this.memoryCache.get(key);
        if (value !== null) {
            return value;
        }

        // Nivel 2: localStorage
        value = this.localStorageCache.get(key);
        if (value !== null) {
            // Promocionar a memory cache
            const ttlConfig = CACHE_CONFIG.dataTypes[dataType];
            this.memoryCache.set(key, value, ttlConfig.memory);
            return value;
        }

        // Nivel 3: IndexedDB
        const storeName = this.getStoreNameForDataType(dataType);
        value = await this.indexedDBCache.get(key, storeName);
        if (value !== null) {
            // Promocionar a niveles superiores
            const ttlConfig = CACHE_CONFIG.dataTypes[dataType];
            this.memoryCache.set(key, value, ttlConfig.memory);
            this.localStorageCache.set(key, value, ttlConfig.localStorage);
            return value;
        }

        return null;
    }

    async has(key, dataType = 'metalPrices') {
        // Verificar en todos los niveles
        if (this.memoryCache.has(key)) {
            return true;
        }
        
        if (this.localStorageCache.has(key)) {
            return true;
        }
        
        const storeName = this.getStoreNameForDataType(dataType);
        return await this.indexedDBCache.has(key, storeName);
    }

    async delete(key, dataType = 'metalPrices') {
        // Eliminar de todos los niveles
        this.memoryCache.delete(key);
        this.localStorageCache.delete(key);
        
        const storeName = this.getStoreNameForDataType(dataType);
        await this.indexedDBCache.delete(key, storeName);
        
        console.log(`🗑️ Cache deleted en todos los niveles: ${key}`);
    }

    async clear(dataType = null) {
        // Limpiar todos los niveles
        this.memoryCache.clear();
        this.localStorageCache.clear();
        
        if (dataType) {
            const storeName = this.getStoreNameForDataType(dataType);
            await this.indexedDBCache.clear(storeName);
        } else {
            await this.indexedDBCache.clear();
        }
        
        console.log('🧹 Cache cleared en todos los niveles');
    }

    getStoreNameForDataType(dataType) {
        const storeMapping = {
            metalPrices: CACHE_CONFIG.indexedDB.stores.metalPrices,
            exchangeRates: CACHE_CONFIG.indexedDB.stores.exchangeRates,
            historicalData: CACHE_CONFIG.indexedDB.stores.historicalData,
            userPreferences: CACHE_CONFIG.indexedDB.stores.userPreferences,
            calculations: CACHE_CONFIG.indexedDB.stores.calculations
        };
        
        return storeMapping[dataType] || CACHE_CONFIG.indexedDB.stores.metalPrices;
    }

    initializeCleanupScheduler() {
        // Programar limpieza automática para cada nivel
        this.cleanupIntervals.memory = setInterval(
            () => this.memoryCache.cleanup(),
            CACHE_CONFIG.cleanup.memoryInterval
        );

        this.cleanupIntervals.localStorage = setInterval(
            () => this.localStorageCache.cleanup(),
            CACHE_CONFIG.cleanup.localStorageInterval
        );

        this.cleanupIntervals.indexedDB = setInterval(
            () => this.indexedDBCache.cleanup(),
            CACHE_CONFIG.cleanup.indexedDBInterval
        );

        console.log('⏰ Limpieza automática de cache programada');
    }

    async getStats() {
        const memoryStats = this.memoryCache.getStats();
        const localStorageStats = this.localStorageCache.getStats();
        const indexedDBStats = await this.indexedDBCache.getStats();

        return {
            memory: memoryStats,
            localStorage: localStorageStats,
            indexedDB: indexedDBStats,
            totalHitRate: (
                (memoryStats.hits + localStorageStats.hits + indexedDBStats.hits) /
                (memoryStats.hits + memoryStats.misses + 
                 localStorageStats.hits + localStorageStats.misses + 
                 indexedDBStats.hits + indexedDBStats.misses)
            ) || 0,
            isInitialized: this.isInitialized
        };
    }

    destroy() {
        // Limpiar intervalos
        Object.values(this.cleanupIntervals).forEach(interval => {
            clearInterval(interval);
        });
        
        console.log('🔄 Sistema de cache avanzado destruido');
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.advancedCache = new AdvancedCacheManager();

// Integrar con sistema principal de precios
if (window.kitcoPricing) {
    // Sobrescribir métodos de cache del sistema principal
    window.kitcoPricing.setCacheDataAdvanced = async function(key, data, dataType = 'metalPrices') {
        await window.advancedCache.set(key, data, dataType);
    };
    
    window.kitcoPricing.getCacheDataAdvanced = async function(key, dataType = 'metalPrices') {
        return await window.advancedCache.get(key, dataType);
    };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedCacheManager,
        MemoryCache,
        LocalStorageCache,
        IndexedDBCache
    };
}

console.log('✅ Sistema de Cache Avanzado v1.0 cargado correctamente');
console.log('🔧 Inicializar con: await window.advancedCache.initialize()');
console.log('📊 Ver estadísticas: await window.advancedCache.getStats()');