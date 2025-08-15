// cache-performance-optimizer.js - OPTIMIZADOR DE CACHE Y PERFORMANCE v1.0
// TTL inteligente, optimización de requests y limpieza automática para SUBAGENTE 8
// ===============================================================================

console.log('⚡ Iniciando Optimizador de Cache y Performance v1.0...');

// ===============================================================================
// CONFIGURACIÓN DEL SISTEMA DE CACHE Y PERFORMANCE
// ===============================================================================

const PERFORMANCE_CONFIG = {
    // Configuración de TTL por tipo de dato
    ttl: {
        metal_prices: 5 * 60 * 1000,        // 5 minutos para metales
        diamond_prices: 60 * 60 * 1000,     // 1 hora para diamantes
        gemstone_prices: 4 * 60 * 60 * 1000, // 4 horas para gemas
        exchange_rates: 15 * 60 * 1000,     // 15 minutos para tipos de cambio
        validation_results: 30 * 60 * 1000, // 30 minutos para validaciones
        override_data: 2 * 60 * 1000,       // 2 minutos para overrides
        fallback_interpolated: 10 * 60 * 1000, // 10 minutos para interpolaciones
        emergency_static: 24 * 60 * 60 * 1000  // 24 horas para precios estáticos
    },

    // Configuración de almacenamiento
    storage: {
        localStorage: {
            maxSize: 8 * 1024 * 1024,       // 8MB máximo
            compressionThreshold: 1024,      // Comprimir > 1KB
            maxEntries: 2000                 // Máximo 2000 entradas
        },
        indexedDB: {
            dbName: 'PricingCacheDB',
            version: 1,
            stores: {
                prices: 'prices',
                metrics: 'metrics',
                historical: 'historical'
            },
            maxSize: 50 * 1024 * 1024       // 50MB máximo
        },
        memory: {
            maxEntries: 500,                 // Cache en memoria
            maxAge: 10 * 60 * 1000          // 10 minutos en memoria
        }
    },

    // Configuración de compresión
    compression: {
        enabled: true,
        algorithm: 'lz-string',              // Algoritmo de compresión
        threshold: 1024,                     // Comprimir > 1KB
        level: 'fast'                        // fast/normal/best
    },

    // Configuración de limpieza automática
    cleanup: {
        intervalMinutes: 60,                 // Limpieza cada hora
        forceCleanupThreshold: 0.9,         // Limpiar si > 90% lleno
        expiredCheckInterval: 5 * 60 * 1000, // Verificar expirados cada 5min
        batchSize: 100                       // Procesar 100 entradas por lote
    },

    // Configuración de performance
    performance: {
        requestConcurrency: 10,              // Máximo 10 requests paralelos
        requestTimeout: 8000,                // 8s timeout por request
        batchSize: 5,                        // Agrupar 5 requests similares
        debounceMs: 100,                     // Debounce de 100ms
        circuitBreakerThreshold: 5,          // 5 fallos → circuit breaker
        circuitBreakerTimeout: 60000         // 1 minuto timeout
    },

    // Configuración de métricas
    metrics: {
        collectInterval: 60 * 1000,          // Cada minuto
        historyRetention: 24 * 60 * 60 * 1000, // 24 horas
        performanceThresholds: {
            responseTime: 3000,              // 3s máximo
            cacheHitRate: 0.8,              // 80% mínimo
            errorRate: 0.05                 // 5% máximo
        }
    }
};

// ===============================================================================
// CLASE PRINCIPAL DEL OPTIMIZADOR
// ===============================================================================

class CachePerformanceOptimizer {
    constructor() {
        this.memoryCache = new Map();
        this.localStorageCache = new Map();
        this.indexedDBCache = null;
        this.metrics = this.initializeMetrics();
        this.requestQueue = [];
        this.activeRequests = new Map();
        this.circuitBreakers = new Map();
        this.compressionEngine = null;
        this.cleanupIntervals = [];
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando optimizador de cache y performance...');
        
        try {
            // Inicializar IndexedDB
            await this.initializeIndexedDB();
            
            // Inicializar motor de compresión
            this.initializeCompression();
            
            // Cargar cache existente
            this.loadExistingCache();
            
            // Configurar limpieza automática
            this.setupAutomaticCleanup();
            
            // Configurar recolección de métricas
            this.setupMetricsCollection();
            
            // Configurar optimizaciones automáticas
            this.setupAutoOptimizations();
            
            console.log('✅ Optimizador inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando optimizador:', error);
            this.handleInitializationError(error);
        }
    }

    // ===============================================================================
    // SISTEMA DE CACHE MULTI-NIVEL
    // ===============================================================================

    async get(key, options = {}) {
        const startTime = performance.now();
        let result = null;
        let source = null;
        
        try {
            // Nivel 1: Memory Cache (más rápido)
            result = this.getFromMemory(key);
            if (result && !this.isExpired(result)) {
                source = 'memory';
                this.recordCacheHit('memory');
                return this.deserializeValue(result);
            }
            
            // Nivel 2: LocalStorage Cache
            result = await this.getFromLocalStorage(key);
            if (result && !this.isExpired(result)) {
                source = 'localStorage';
                this.recordCacheHit('localStorage');
                
                // Promover a memory cache si es accedido frecuentemente
                this.promoteToMemory(key, result);
                
                return this.deserializeValue(result);
            }
            
            // Nivel 3: IndexedDB Cache (para datos grandes)
            if (this.indexedDBCache) {
                result = await this.getFromIndexedDB(key);
                if (result && !this.isExpired(result)) {
                    source = 'indexedDB';
                    this.recordCacheHit('indexedDB');
                    
                    // Promover a niveles superiores
                    this.promoteToUpperLevels(key, result);
                    
                    return this.deserializeValue(result);
                }
            }
            
            // Cache miss
            this.recordCacheMiss();
            return null;
            
        } finally {
            const responseTime = performance.now() - startTime;
            this.recordCacheAccess(key, source, responseTime, result !== null);
        }
    }

    async set(key, value, options = {}) {
        const startTime = performance.now();
        
        try {
            const serialized = this.serializeValue(value, options);
            const ttl = options.ttl || this.getTTLForKey(key);
            const cacheEntry = this.createCacheEntry(serialized, ttl, options);
            
            // Decidir en qué niveles almacenar basado en tamaño y frecuencia
            const size = this.calculateSize(serialized);
            const storage = this.determineOptimalStorage(key, size, options);
            
            // Almacenar en niveles apropiados
            if (storage.memory) {
                this.setInMemory(key, cacheEntry);
            }
            
            if (storage.localStorage) {
                await this.setInLocalStorage(key, cacheEntry);
            }
            
            if (storage.indexedDB && this.indexedDBCache) {
                await this.setInIndexedDB(key, cacheEntry);
            }
            
            this.recordCacheSet(key, size, storage);
            
        } catch (error) {
            console.error(`❌ Error setting cache key ${key}:`, error);
            this.recordCacheError('set', key, error);
        } finally {
            const responseTime = performance.now() - startTime;
            this.metrics.cacheOperations.setTime += responseTime;
            this.metrics.cacheOperations.setCount++;
        }
    }

    async delete(key) {
        try {
            // Eliminar de todos los niveles
            this.memoryCache.delete(key);
            this.localStorageCache.delete(key);
            
            if (this.indexedDBCache) {
                await this.deleteFromIndexedDB(key);
            }
            
            // Limpiar también de localStorage real
            const fullKey = this.buildStorageKey(key);
            localStorage.removeItem(fullKey);
            
            this.recordCacheDelete(key);
            
        } catch (error) {
            console.error(`❌ Error deleting cache key ${key}:`, error);
        }
    }

    async clear() {
        try {
            this.memoryCache.clear();
            this.localStorageCache.clear();
            
            // Limpiar localStorage
            this.clearLocalStorageCache();
            
            // Limpiar IndexedDB
            if (this.indexedDBCache) {
                await this.clearIndexedDB();
            }
            
            console.log('🗑️ Cache completamente limpiado');
            this.recordCacheClear();
            
        } catch (error) {
            console.error('❌ Error limpiando cache:', error);
        }
    }

    // ===============================================================================
    // OPTIMIZACIÓN DE REQUESTS
    // ===============================================================================

    async optimizeRequest(requestFn, key, options = {}) {
        // Verificar cache primero
        const cached = await this.get(key);
        if (cached) {
            this.recordCacheHit('optimized_request');
            return cached;
        }
        
        // Verificar si ya hay un request en progreso para la misma key
        if (this.activeRequests.has(key)) {
            console.log(`⏳ Request ya en progreso para ${key}, esperando...`);
            return await this.activeRequests.get(key);
        }
        
        // Ejecutar request con optimizaciones
        const requestPromise = this.executeOptimizedRequest(requestFn, key, options);
        this.activeRequests.set(key, requestPromise);
        
        try {
            const result = await requestPromise;
            
            // Almacenar en cache
            if (result && !options.noCache) {
                await this.set(key, result, options);
            }
            
            return result;
            
        } finally {
            this.activeRequests.delete(key);
        }
    }

    async executeOptimizedRequest(requestFn, key, options) {
        const startTime = performance.now();
        
        try {
            // Aplicar timeout
            const timeout = options.timeout || PERFORMANCE_CONFIG.performance.requestTimeout;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Request timeout: ${timeout}ms`)), timeout);
            });
            
            // Ejecutar con timeout
            const result = await Promise.race([requestFn(), timeoutPromise]);
            
            const responseTime = performance.now() - startTime;
            this.recordRequestSuccess(key, responseTime);
            
            return result;
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequestFailure(key, error, responseTime);
            
            // Circuit breaker
            this.updateCircuitBreaker(key, false);
            
            throw error;
        }
    }

    async batchOptimizeRequests(requests) {
        console.log(`⚡ Optimizando lote de ${requests.length} requests...`);
        
        const batchSize = PERFORMANCE_CONFIG.performance.batchSize;
        const results = [];
        
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            
            const batchPromises = batch.map(req => 
                this.optimizeRequest(req.fn, req.key, req.options).catch(error => ({
                    error,
                    key: req.key
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Pequeña pausa entre lotes para no sobrecargar
            if (i + batchSize < requests.length) {
                await this.sleep(10);
            }
        }
        
        return results;
    }

    // ===============================================================================
    // SISTEMA DE COMPRESIÓN
    // ===============================================================================

    initializeCompression() {
        if (!PERFORMANCE_CONFIG.compression.enabled) {
            console.log('📦 Compresión deshabilitada');
            return;
        }
        
        try {
            // Implementación simple de compresión (en producción usar LZ-String)
            this.compressionEngine = {
                compress: (data) => {
                    if (typeof data === 'string' && data.length > PERFORMANCE_CONFIG.compression.threshold) {
                        // Compresión básica - en producción usar LZ-String
                        return this.simpleCompress(data);
                    }
                    return data;
                },
                decompress: (data) => {
                    if (this.isCompressed(data)) {
                        return this.simpleDecompress(data);
                    }
                    return data;
                }
            };
            
            console.log('📦 Motor de compresión inicializado');
            
        } catch (error) {
            console.warn('⚠️ Error inicializando compresión:', error);
            this.compressionEngine = null;
        }
    }

    simpleCompress(str) {
        // Compresión muy básica - reemplazar patrones comunes
        const patterns = {
            'pricePerGram': '§pg§',
            'totalPrice': '§tp§',
            'timestamp': '§ts§',
            'confidence': '§cf§',
            'metal': '§mt§',
            'purity': '§pr§'
        };
        
        let compressed = str;
        for (const [pattern, replacement] of Object.entries(patterns)) {
            compressed = compressed.replace(new RegExp(pattern, 'g'), replacement);
        }
        
        return { _compressed: true, data: compressed, originalLength: str.length };
    }

    simpleDecompress(obj) {
        if (!obj._compressed) return obj;
        
        const patterns = {
            '§pg§': 'pricePerGram',
            '§tp§': 'totalPrice',
            '§ts§': 'timestamp',
            '§cf§': 'confidence',
            '§mt§': 'metal',
            '§pr§': 'purity'
        };
        
        let decompressed = obj.data;
        for (const [pattern, replacement] of Object.entries(patterns)) {
            decompressed = decompressed.replace(new RegExp(pattern, 'g'), replacement);
        }
        
        return decompressed;
    }

    isCompressed(data) {
        return data && typeof data === 'object' && data._compressed === true;
    }

    // ===============================================================================
    // LIMPIEZA AUTOMÁTICA
    // ===============================================================================

    setupAutomaticCleanup() {
        // Limpieza general cada hora
        const generalCleanup = setInterval(() => {
            this.performGeneralCleanup();
        }, PERFORMANCE_CONFIG.cleanup.intervalMinutes * 60 * 1000);
        
        // Verificación de expirados cada 5 minutos
        const expiredCleanup = setInterval(() => {
            this.cleanupExpiredEntries();
        }, PERFORMANCE_CONFIG.cleanup.expiredCheckInterval);
        
        // Limpieza forzada si se alcanza threshold de almacenamiento
        const forceCleanup = setInterval(() => {
            this.checkForceCleanup();
        }, 10 * 60 * 1000); // Cada 10 minutos
        
        this.cleanupIntervals = [generalCleanup, expiredCleanup, forceCleanup];
        
        console.log('🧹 Sistema de limpieza automática configurado');
    }

    async performGeneralCleanup() {
        console.log('🧹 Iniciando limpieza general...');
        
        const cleanupStats = {
            memoryBefore: this.memoryCache.size,
            localStorageBefore: this.localStorageCache.size,
            memoryAfter: 0,
            localStorageAfter: 0,
            deletedEntries: 0,
            reclaimedSpace: 0
        };
        
        try {
            // Limpiar memory cache
            cleanupStats.deletedEntries += this.cleanupMemoryCache();
            cleanupStats.memoryAfter = this.memoryCache.size;
            
            // Limpiar localStorage cache
            const lsDeleted = await this.cleanupLocalStorageCache();
            cleanupStats.deletedEntries += lsDeleted.count;
            cleanupStats.reclaimedSpace += lsDeleted.space;
            cleanupStats.localStorageAfter = this.localStorageCache.size;
            
            // Limpiar IndexedDB si está disponible
            if (this.indexedDBCache) {
                const idbDeleted = await this.cleanupIndexedDB();
                cleanupStats.deletedEntries += idbDeleted;
            }
            
            // Registrar estadísticas
            this.recordCleanupStats(cleanupStats);
            
            console.log(`✅ Limpieza completada: ${cleanupStats.deletedEntries} entradas eliminadas`);
            
        } catch (error) {
            console.error('❌ Error en limpieza general:', error);
        }
    }

    cleanupMemoryCache() {
        const now = Date.now();
        let deleted = 0;
        
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry, now)) {
                this.memoryCache.delete(key);
                deleted++;
            }
        }
        
        // Si aún está muy lleno, eliminar entradas más antiguas
        const maxEntries = PERFORMANCE_CONFIG.storage.memory.maxEntries;
        if (this.memoryCache.size > maxEntries) {
            const entries = Array.from(this.memoryCache.entries());
            entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
            
            const toDelete = entries.slice(0, this.memoryCache.size - maxEntries);
            for (const [key] of toDelete) {
                this.memoryCache.delete(key);
                deleted++;
            }
        }
        
        return deleted;
    }

    async cleanupLocalStorageCache() {
        const now = Date.now();
        let deletedCount = 0;
        let reclaimedSpace = 0;
        
        const entries = Array.from(this.localStorageCache.entries());
        
        for (const [key, entry] of entries) {
            if (this.isExpired(entry, now)) {
                const size = this.calculateSize(entry);
                this.localStorageCache.delete(key);
                
                const fullKey = this.buildStorageKey(key);
                localStorage.removeItem(fullKey);
                
                deletedCount++;
                reclaimedSpace += size;
            }
        }
        
        return { count: deletedCount, space: reclaimedSpace };
    }

    cleanupExpiredEntries() {
        const now = Date.now();
        let totalDeleted = 0;
        
        // Memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
            if (this.isExpired(entry, now)) {
                this.memoryCache.delete(key);
                totalDeleted++;
            }
        }
        
        // localStorage cache
        for (const [key, entry] of this.localStorageCache.entries()) {
            if (this.isExpired(entry, now)) {
                this.localStorageCache.delete(key);
                const fullKey = this.buildStorageKey(key);
                localStorage.removeItem(fullKey);
                totalDeleted++;
            }
        }
        
        if (totalDeleted > 0) {
            console.log(`🧹 ${totalDeleted} entradas expiradas eliminadas`);
        }
    }

    checkForceCleanup() {
        const usage = this.calculateStorageUsage();
        const threshold = PERFORMANCE_CONFIG.cleanup.forceCleanupThreshold;
        
        if (usage.percentage > threshold) {
            console.warn(`⚠️ Almacenamiento al ${(usage.percentage * 100).toFixed(1)}% - limpieza forzada`);
            this.performAggressiveCleanup();
        }
    }

    async performAggressiveCleanup() {
        console.log('🧹 Iniciando limpieza agresiva...');
        
        // Eliminar entradas menos frecuentemente accedidas
        const memoryEntries = Array.from(this.memoryCache.entries());
        memoryEntries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        
        const toDeleteFromMemory = memoryEntries.slice(0, Math.floor(memoryEntries.length * 0.3));
        for (const [key] of toDeleteFromMemory) {
            this.memoryCache.delete(key);
        }
        
        // Similar para localStorage
        const lsEntries = Array.from(this.localStorageCache.entries());
        lsEntries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        
        const toDeleteFromLS = lsEntries.slice(0, Math.floor(lsEntries.length * 0.3));
        for (const [key] of toDeleteFromLS) {
            this.localStorageCache.delete(key);
            const fullKey = this.buildStorageKey(key);
            localStorage.removeItem(fullKey);
        }
        
        console.log(`✅ Limpieza agresiva completada: ${toDeleteFromMemory.length + toDeleteFromLS.length} entradas eliminadas`);
    }

    // ===============================================================================
    // INDEXEDDB OPERATIONS
    // ===============================================================================

    async initializeIndexedDB() {
        if (!window.indexedDB) {
            console.warn('⚠️ IndexedDB no disponible');
            return;
        }
        
        try {
            const dbConfig = PERFORMANCE_CONFIG.storage.indexedDB;
            
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(dbConfig.dbName, dbConfig.version);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Crear object stores
                    if (!db.objectStoreNames.contains(dbConfig.stores.prices)) {
                        const pricesStore = db.createObjectStore(dbConfig.stores.prices, { keyPath: 'id' });
                        pricesStore.createIndex('timestamp', 'timestamp');
                        pricesStore.createIndex('expiresAt', 'expiresAt');
                    }
                    
                    if (!db.objectStoreNames.contains(dbConfig.stores.metrics)) {
                        db.createObjectStore(dbConfig.stores.metrics, { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains(dbConfig.stores.historical)) {
                        const histStore = db.createObjectStore(dbConfig.stores.historical, { keyPath: 'id' });
                        histStore.createIndex('timestamp', 'timestamp');
                    }
                };
            });
            
            this.indexedDBCache = db;
            console.log('💾 IndexedDB inicializado correctamente');
            
        } catch (error) {
            console.warn('⚠️ Error inicializando IndexedDB:', error);
            this.indexedDBCache = null;
        }
    }

    async getFromIndexedDB(key) {
        if (!this.indexedDBCache) return null;
        
        try {
            const transaction = this.indexedDBCache.transaction(['prices'], 'readonly');
            const store = transaction.objectStore('prices');
            const request = store.get(key);
            
            const result = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            return result || null;
            
        } catch (error) {
            console.error(`❌ Error obteniendo de IndexedDB key ${key}:`, error);
            return null;
        }
    }

    async setInIndexedDB(key, entry) {
        if (!this.indexedDBCache) return;
        
        try {
            const transaction = this.indexedDBCache.transaction(['prices'], 'readwrite');
            const store = transaction.objectStore('prices');
            
            const idbEntry = {
                id: key,
                ...entry,
                timestamp: Date.now()
            };
            
            const request = store.put(idbEntry);
            
            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error(`❌ Error guardando en IndexedDB key ${key}:`, error);
        }
    }

    async deleteFromIndexedDB(key) {
        if (!this.indexedDBCache) return;
        
        try {
            const transaction = this.indexedDBCache.transaction(['prices'], 'readwrite');
            const store = transaction.objectStore('prices');
            const request = store.delete(key);
            
            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error(`❌ Error eliminando de IndexedDB key ${key}:`, error);
        }
    }

    async cleanupIndexedDB() {
        if (!this.indexedDBCache) return 0;
        
        try {
            const now = Date.now();
            const transaction = this.indexedDBCache.transaction(['prices'], 'readwrite');
            const store = transaction.objectStore('prices');
            const index = store.index('expiresAt');
            
            const range = IDBKeyRange.upperBound(now);
            const request = index.openCursor(range);
            
            let deletedCount = 0;
            
            await new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedCount++;
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
            
            return deletedCount;
            
        } catch (error) {
            console.error('❌ Error limpiando IndexedDB:', error);
            return 0;
        }
    }

    async clearIndexedDB() {
        if (!this.indexedDBCache) return;
        
        try {
            const transaction = this.indexedDBCache.transaction(['prices', 'metrics', 'historical'], 'readwrite');
            
            await Promise.all([
                new Promise((resolve, reject) => {
                    const req = transaction.objectStore('prices').clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                }),
                new Promise((resolve, reject) => {
                    const req = transaction.objectStore('metrics').clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                }),
                new Promise((resolve, reject) => {
                    const req = transaction.objectStore('historical').clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                })
            ]);
            
        } catch (error) {
            console.error('❌ Error limpiando IndexedDB completamente:', error);
        }
    }

    // ===============================================================================
    // MÉTRICAS Y MONITOREO
    // ===============================================================================

    initializeMetrics() {
        return {
            cache: {
                hits: { memory: 0, localStorage: 0, indexedDB: 0 },
                misses: 0,
                sets: 0,
                deletes: 0,
                hitRate: 0
            },
            performance: {
                averageGetTime: 0,
                averageSetTime: 0,
                slowQueries: 0,
                timeouts: 0
            },
            storage: {
                memoryUsage: 0,
                localStorageUsage: 0,
                indexedDBUsage: 0,
                compressionRatio: 0
            },
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
                concurrentPeak: 0
            },
            cleanup: {
                lastCleanup: Date.now(),
                totalCleaned: 0,
                spacesReclaimed: 0
            },
            errors: {
                cacheErrors: 0,
                requestErrors: 0,
                storageErrors: 0
            }
        };
    }

    setupMetricsCollection() {
        if (!PERFORMANCE_CONFIG.metrics.collectInterval) return;
        
        setInterval(() => {
            this.updateMetrics();
        }, PERFORMANCE_CONFIG.metrics.collectInterval);
        
        console.log('📊 Recolección de métricas configurada');
    }

    updateMetrics() {
        // Actualizar hit rate
        const totalHits = this.metrics.cache.hits.memory + 
                          this.metrics.cache.hits.localStorage + 
                          this.metrics.cache.hits.indexedDB;
        const totalRequests = totalHits + this.metrics.cache.misses;
        
        this.metrics.cache.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
        
        // Actualizar uso de almacenamiento
        this.metrics.storage = this.calculateStorageUsage();
        
        // Verificar thresholds de performance
        this.checkPerformanceThresholds();
    }

    calculateStorageUsage() {
        const memorySize = this.calculateMemoryCacheSize();
        const localStorageSize = this.calculateLocalStorageSize();
        
        return {
            memoryUsage: memorySize,
            memoryEntries: this.memoryCache.size,
            localStorageUsage: localStorageSize,
            localStorageEntries: this.localStorageCache.size,
            totalUsage: memorySize + localStorageSize,
            percentage: this.calculateUsagePercentage(memorySize + localStorageSize)
        };
    }

    calculateMemoryCacheSize() {
        let size = 0;
        for (const entry of this.memoryCache.values()) {
            size += this.calculateSize(entry);
        }
        return size;
    }

    calculateLocalStorageSize() {
        let size = 0;
        for (const entry of this.localStorageCache.values()) {
            size += this.calculateSize(entry);
        }
        return size;
    }

    calculateSize(data) {
        if (!data) return 0;
        
        try {
            const str = typeof data === 'string' ? data : JSON.stringify(data);
            return new Blob([str]).size;
        } catch {
            return 0;
        }
    }

    calculateUsagePercentage(currentSize) {
        const maxSize = PERFORMANCE_CONFIG.storage.localStorage.maxSize;
        return currentSize / maxSize;
    }

    checkPerformanceThresholds() {
        const thresholds = PERFORMANCE_CONFIG.metrics.performanceThresholds;
        
        if (this.metrics.performance.averageGetTime > thresholds.responseTime) {
            console.warn(`⚠️ Tiempo de respuesta alto: ${this.metrics.performance.averageGetTime}ms`);
        }
        
        if (this.metrics.cache.hitRate < thresholds.cacheHitRate) {
            console.warn(`⚠️ Hit rate bajo: ${(this.metrics.cache.hitRate * 100).toFixed(1)}%`);
        }
        
        const errorRate = this.metrics.errors.cacheErrors / Math.max(this.metrics.cache.sets, 1);
        if (errorRate > thresholds.errorRate) {
            console.warn(`⚠️ Tasa de error alta: ${(errorRate * 100).toFixed(1)}%`);
        }
    }

    // ===============================================================================
    // UTILIDADES Y HELPERS
    // ===============================================================================

    getTTLForKey(key) {
        // Determinar TTL basado en el tipo de clave
        if (key.includes('metal_price')) return PERFORMANCE_CONFIG.ttl.metal_prices;
        if (key.includes('diamond_price')) return PERFORMANCE_CONFIG.ttl.diamond_prices;
        if (key.includes('gemstone_price')) return PERFORMANCE_CONFIG.ttl.gemstone_prices;
        if (key.includes('exchange_rate')) return PERFORMANCE_CONFIG.ttl.exchange_rates;
        if (key.includes('validation')) return PERFORMANCE_CONFIG.ttl.validation_results;
        if (key.includes('override')) return PERFORMANCE_CONFIG.ttl.override_data;
        if (key.includes('fallback')) return PERFORMANCE_CONFIG.ttl.fallback_interpolated;
        if (key.includes('emergency')) return PERFORMANCE_CONFIG.ttl.emergency_static;
        
        // TTL por defecto
        return PERFORMANCE_CONFIG.ttl.metal_prices;
    }

    createCacheEntry(value, ttl, options = {}) {
        const now = Date.now();
        
        return {
            value: this.compressionEngine ? this.compressionEngine.compress(value) : value,
            createdAt: now,
            expiresAt: now + ttl,
            lastAccess: now,
            accessCount: 1,
            size: this.calculateSize(value),
            metadata: {
                compressed: this.compressionEngine && this.calculateSize(value) > PERFORMANCE_CONFIG.compression.threshold,
                priority: options.priority || 'normal',
                tags: options.tags || []
            }
        };
    }

    determineOptimalStorage(key, size, options) {
        const storage = { memory: false, localStorage: false, indexedDB: false };
        
        // Reglas de almacenamiento
        if (size < 1024) { // < 1KB siempre en memoria
            storage.memory = true;
        }
        
        if (size < 50 * 1024) { // < 50KB en localStorage
            storage.localStorage = true;
        }
        
        if (size >= 50 * 1024 || options.persistent) { // >= 50KB o persistente en IndexedDB
            storage.indexedDB = true;
        }
        
        // Prioridad alta siempre en memoria
        if (options.priority === 'high') {
            storage.memory = true;
        }
        
        return storage;
    }

    serializeValue(value, options) {
        try {
            if (typeof value === 'string') return value;
            return JSON.stringify(value);
        } catch (error) {
            console.error('❌ Error serializando valor:', error);
            return null;
        }
    }

    deserializeValue(entry) {
        try {
            let value = entry.value;
            
            // Descomprimir si es necesario
            if (this.compressionEngine && entry.metadata.compressed) {
                value = this.compressionEngine.decompress(value);
            }
            
            // Actualizar estadísticas de acceso
            entry.lastAccess = Date.now();
            entry.accessCount++;
            
            // Intentar parsear como JSON
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                return JSON.parse(value);
            }
            
            return value;
            
        } catch (error) {
            console.error('❌ Error deserializando valor:', error);
            return null;
        }
    }

    isExpired(entry, now = Date.now()) {
        return entry && entry.expiresAt && now > entry.expiresAt;
    }

    buildStorageKey(key) {
        return `pricing_cache_${key}`;
    }

    promoteToMemory(key, entry) {
        if (entry.accessCount > 3 && this.memoryCache.size < PERFORMANCE_CONFIG.storage.memory.maxEntries) {
            this.memoryCache.set(key, entry);
        }
    }

    promoteToUpperLevels(key, entry) {
        if (entry.accessCount > 2) {
            this.setInMemory(key, entry);
            this.setInLocalStorage(key, entry);
        }
    }

    getFromMemory(key) {
        return this.memoryCache.get(key);
    }

    async getFromLocalStorage(key) {
        // Primero verificar en cache en memoria del localStorage
        let entry = this.localStorageCache.get(key);
        if (entry) return entry;
        
        // Si no está, cargar desde localStorage real
        try {
            const fullKey = this.buildStorageKey(key);
            const stored = localStorage.getItem(fullKey);
            
            if (stored) {
                entry = JSON.parse(stored);
                this.localStorageCache.set(key, entry);
                return entry;
            }
        } catch (error) {
            console.error(`❌ Error cargando de localStorage key ${key}:`, error);
        }
        
        return null;
    }

    setInMemory(key, entry) {
        // Verificar límites
        if (this.memoryCache.size >= PERFORMANCE_CONFIG.storage.memory.maxEntries) {
            // Eliminar entrada más antigua
            const oldestKey = Array.from(this.memoryCache.entries())
                .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0][0];
            this.memoryCache.delete(oldestKey);
        }
        
        this.memoryCache.set(key, entry);
    }

    async setInLocalStorage(key, entry) {
        try {
            const fullKey = this.buildStorageKey(key);
            const serialized = JSON.stringify(entry);
            
            localStorage.setItem(fullKey, serialized);
            this.localStorageCache.set(key, entry);
            
        } catch (error) {
            console.error(`❌ Error guardando en localStorage key ${key}:`, error);
            
            // Si localStorage está lleno, intentar limpieza
            if (error.name === 'QuotaExceededError') {
                this.performAggressiveCleanup();
                // Intentar de nuevo
                try {
                    const fullKey = this.buildStorageKey(key);
                    const serialized = JSON.stringify(entry);
                    localStorage.setItem(fullKey, serialized);
                    this.localStorageCache.set(key, entry);
                } catch (retryError) {
                    console.error('❌ Error en segundo intento de localStorage:', retryError);
                }
            }
        }
    }

    clearLocalStorageCache() {
        const keysToDelete = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pricing_cache_')) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            localStorage.removeItem(key);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===============================================================================
    // REGISTRO DE EVENTOS
    // ===============================================================================

    recordCacheHit(source) {
        this.metrics.cache.hits[source]++;
    }

    recordCacheMiss() {
        this.metrics.cache.misses++;
    }

    recordCacheSet(key, size, storage) {
        this.metrics.cache.sets++;
    }

    recordCacheDelete(key) {
        this.metrics.cache.deletes++;
    }

    recordCacheClear() {
        this.metrics.cache.hits = { memory: 0, localStorage: 0, indexedDB: 0 };
        this.metrics.cache.misses = 0;
    }

    recordCacheAccess(key, source, responseTime, hit) {
        if (hit) {
            this.recordCacheHit(source);
        } else {
            this.recordCacheMiss();
        }
    }

    recordCacheError(operation, key, error) {
        this.metrics.errors.cacheErrors++;
        console.error(`❌ Cache error [${operation}] ${key}:`, error);
    }

    recordRequestSuccess(key, responseTime) {
        this.metrics.requests.total++;
        this.metrics.requests.successful++;
        
        // Actualizar tiempo promedio
        const total = this.metrics.requests.total;
        const current = this.metrics.requests.averageResponseTime;
        this.metrics.requests.averageResponseTime = ((current * (total - 1)) + responseTime) / total;
    }

    recordRequestFailure(key, error, responseTime) {
        this.metrics.requests.total++;
        this.metrics.requests.failed++;
        this.metrics.errors.requestErrors++;
    }

    recordCleanupStats(stats) {
        this.metrics.cleanup.lastCleanup = Date.now();
        this.metrics.cleanup.totalCleaned += stats.deletedEntries;
        this.metrics.cleanup.spacesReclaimed += stats.reclaimedSpace;
    }

    updateCircuitBreaker(key, success) {
        if (!this.circuitBreakers.has(key)) {
            this.circuitBreakers.set(key, { failures: 0, lastFailure: null, isOpen: false });
        }
        
        const breaker = this.circuitBreakers.get(key);
        
        if (success) {
            breaker.failures = 0;
            breaker.isOpen = false;
        } else {
            breaker.failures++;
            breaker.lastFailure = Date.now();
            
            if (breaker.failures >= PERFORMANCE_CONFIG.performance.circuitBreakerThreshold) {
                breaker.isOpen = true;
                console.warn(`⚡ Circuit breaker abierto para ${key}`);
                
                // Auto-reset después del timeout
                setTimeout(() => {
                    breaker.isOpen = false;
                    breaker.failures = 0;
                }, PERFORMANCE_CONFIG.performance.circuitBreakerTimeout);
            }
        }
    }

    handleInitializationError(error) {
        console.error('🚨 Error crítico en inicialización del optimizador:', error);
        
        // Modo de emergencia - funcionalidad básica sin optimizaciones
        this.memoryCache = new Map();
        this.localStorageCache = new Map();
        this.indexedDBCache = null;
        this.compressionEngine = null;
        
        console.warn('⚠️ Ejecutando en modo de emergencia sin optimizaciones');
    }

    // ===============================================================================
    // API PÚBLICA
    // ===============================================================================

    // Interfaz principal de cache
    async cacheGet(key, options = {}) {
        return await this.get(key, options);
    }

    async cacheSet(key, value, options = {}) {
        return await this.set(key, value, options);
    }

    async cacheDelete(key) {
        return await this.delete(key);
    }

    async cacheClear() {
        return await this.clear();
    }

    // Optimización de requests
    async optimizedRequest(requestFn, key, options = {}) {
        return await this.optimizeRequest(requestFn, key, options);
    }

    async batchRequests(requests) {
        return await this.batchOptimizeRequests(requests);
    }

    // Métricas y estado
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now(),
            storageUsage: this.calculateStorageUsage()
        };
    }

    getPerformanceReport() {
        const metrics = this.getMetrics();
        const usage = this.calculateStorageUsage();
        
        return {
            performance: {
                cacheHitRate: (metrics.cache.hitRate * 100).toFixed(1) + '%',
                averageResponseTime: metrics.requests.averageResponseTime.toFixed(2) + 'ms',
                successRate: ((metrics.requests.successful / Math.max(metrics.requests.total, 1)) * 100).toFixed(1) + '%'
            },
            storage: {
                usage: (usage.percentage * 100).toFixed(1) + '%',
                memoryEntries: usage.memoryEntries,
                localStorageEntries: usage.localStorageEntries,
                totalSize: (usage.totalUsage / 1024).toFixed(2) + ' KB'
            },
            health: {
                status: usage.percentage < 0.8 ? 'healthy' : usage.percentage < 0.95 ? 'warning' : 'critical',
                lastCleanup: new Date(metrics.cleanup.lastCleanup).toISOString(),
                errors: metrics.errors.cacheErrors + metrics.errors.requestErrors
            }
        };
    }

    // Limpieza manual
    async performCleanup() {
        return await this.performGeneralCleanup();
    }

    // Diagnóstico
    async runDiagnostics() {
        console.log('🔧 Ejecutando diagnósticos del optimizador...');
        
        const diagnostics = {
            cacheHealth: this.diagnoseCacheHealth(),
            storageHealth: this.diagnoseStorageHealth(),
            performanceHealth: this.diagnosePerformanceHealth(),
            recommendations: []
        };
        
        // Generar recomendaciones
        diagnostics.recommendations = this.generateRecommendations(diagnostics);
        
        return diagnostics;
    }

    diagnoseCacheHealth() {
        const metrics = this.metrics;
        return {
            hitRate: metrics.cache.hitRate,
            hitRateHealthy: metrics.cache.hitRate >= 0.7,
            missRate: metrics.cache.misses / Math.max(metrics.cache.hits.memory + metrics.cache.hits.localStorage + metrics.cache.hits.indexedDB + metrics.cache.misses, 1),
            errorRate: metrics.errors.cacheErrors / Math.max(metrics.cache.sets, 1)
        };
    }

    diagnoseStorageHealth() {
        const usage = this.calculateStorageUsage();
        return {
            usagePercentage: usage.percentage,
            usageHealthy: usage.percentage < 0.8,
            memoryUsage: usage.memoryUsage,
            localStorageUsage: usage.localStorageUsage,
            fragmentationRisk: usage.percentage > 0.9
        };
    }

    diagnosePerformanceHealth() {
        const metrics = this.metrics;
        return {
            averageResponseTime: metrics.requests.averageResponseTime,
            responseTimeHealthy: metrics.requests.averageResponseTime < 1000,
            successRate: metrics.requests.successful / Math.max(metrics.requests.total, 1),
            successRateHealthy: (metrics.requests.successful / Math.max(metrics.requests.total, 1)) >= 0.95
        };
    }

    generateRecommendations(diagnostics) {
        const recommendations = [];
        
        if (!diagnostics.cacheHealth.hitRateHealthy) {
            recommendations.push('Mejorar hit rate del cache - considerar TTL más largos para datos estables');
        }
        
        if (!diagnostics.storageHealth.usageHealthy) {
            recommendations.push('Alto uso de almacenamiento - ejecutar limpieza o reducir TTL');
        }
        
        if (!diagnostics.performanceHealth.responseTimeHealthy) {
            recommendations.push('Tiempo de respuesta alto - optimizar queries o reducir concurrencia');
        }
        
        if (!diagnostics.performanceHealth.successRateHealthy) {
            recommendations.push('Baja tasa de éxito - verificar conectividad y configuración de APIs');
        }
        
        return recommendations;
    }
}

// ===============================================================================
// INSTANCIA GLOBAL Y INICIALIZACIÓN
// ===============================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.cachePerformanceOptimizer = new CachePerformanceOptimizer();
    
    // API de conveniencia
    window.optimizedCache = {
        get: (key, options) => window.cachePerformanceOptimizer.cacheGet(key, options),
        set: (key, value, options) => window.cachePerformanceOptimizer.cacheSet(key, value, options),
        delete: (key) => window.cachePerformanceOptimizer.cacheDelete(key),
        clear: () => window.cachePerformanceOptimizer.cacheClear()
    };
    
    window.optimizedRequest = (requestFn, key, options) => 
        window.cachePerformanceOptimizer.optimizedRequest(requestFn, key, options);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CachePerformanceOptimizer,
        PERFORMANCE_CONFIG
    };
}

console.log('✅ Optimizador de Cache y Performance v1.0 cargado correctamente');
console.log('⚡ Acceso: window.cachePerformanceOptimizer');
console.log('💾 Cache rápido: window.optimizedCache.get/set/delete/clear');
console.log('🚀 Requests optimizados: window.optimizedRequest(fn, key, options)');
console.log('📊 Métricas: window.cachePerformanceOptimizer.getPerformanceReport()');