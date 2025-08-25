/**
 * CDN CACHE MANAGER - Intelligent CDN Resource Caching System
 * Advanced caching with ServiceWorker integration, compression, and offline-first strategy
 * Part of the CDN Circuit Breaker ecosystem
 */

class CDNCacheManager {
    constructor(circuitBreaker) {
        this.version = '1.0.0';
        this.circuitBreaker = circuitBreaker;
        
        // Cache configuration
        this.config = {
            // Storage limits
            maxCacheSize: 100 * 1024 * 1024,     // 100MB
            maxItemSize: 10 * 1024 * 1024,       // 10MB per item
            maxEntries: 500,                     // Maximum number of cached items
            
            // Expiration settings
            defaultTTL: 24 * 60 * 60 * 1000,     // 24 hours
            libraryTTL: {
                domPurify: 7 * 24 * 60 * 60 * 1000,     // 7 days
                jsPDF: 7 * 24 * 60 * 60 * 1000,        // 7 days
                html2canvas: 7 * 24 * 60 * 60 * 1000,  // 7 days
                signaturePad: 7 * 24 * 60 * 60 * 1000, // 7 days
                googleFonts: 30 * 24 * 60 * 60 * 1000  // 30 days
            },
            
            // Compression settings
            enableCompression: true,
            compressionThreshold: 1024,          // Compress items > 1KB
            compressionLevel: 6,                 // 1-9, 6 is balanced
            
            // ServiceWorker settings
            enableServiceWorker: true,
            swCacheName: 'ciaociao-cdn-cache-v1',
            
            // Prefetching
            enablePrefetch: true,
            prefetchPriority: {
                domPurify: 1,
                jsPDF: 2,
                html2canvas: 3,
                signaturePad: 4,
                googleFonts: 5
            },
            
            // Cleanup settings
            autoCleanup: true,
            cleanupInterval: 60 * 60 * 1000,     // 1 hour
            cleanupStrategy: 'LRU',              // LRU, LFU, FIFO
            
            // Performance monitoring
            enableMetrics: true,
            metricsRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        // Storage systems
        this.memoryCache = new Map();
        this.indexedDBCache = null;
        this.serviceWorkerCache = null;
        
        // Metadata tracking
        this.cacheMetadata = new Map();
        this.accessHistory = new Map();
        this.compressionIndex = new Map();
        
        // Performance metrics
        this.metrics = {
            hitRate: 0,
            missRate: 0,
            totalRequests: 0,
            totalHits: 0,
            totalMisses: 0,
            averageRetrievalTime: 0,
            compressionRatio: 0,
            storageUtilization: 0,
            evictions: 0,
            errors: 0,
            performanceHistory: []
        };
        
        // Compression worker (if available)
        this.compressionWorker = null;
        
        this.initializeCacheManager();
    }
    
    async initializeCacheManager() {
        try {
            console.log('💾 Initializing CDN Cache Manager...');
            
            // Initialize storage systems
            await this.initializeMemoryCache();
            await this.initializeIndexedDB();
            await this.initializeServiceWorker();
            
            // Initialize compression
            await this.initializeCompression();
            
            // Start background tasks
            this.startCleanupScheduler();
            this.startMetricsCollection();
            
            // Prefetch critical resources
            if (this.config.enablePrefetch) {
                await this.prefetchCriticalResources();
            }
            
            console.log('✅ CDN Cache Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ CDN Cache Manager initialization failed:', error);
        }
    }
    
    async initializeMemoryCache() {
        // Memory cache is already initialized as Map
        console.log('🧠 Memory cache initialized');
    }
    
    async initializeIndexedDB() {
        if (!window.indexedDB) {
            console.warn('⚠️ IndexedDB not available, using memory cache only');
            return;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('CiaoCiaoCDNCache', 1);
            
            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB');
                reject(request.error);
            };
            
            request.onsuccess = (event) => {
                this.indexedDBCache = event.target.result;
                console.log('🗄 IndexedDB cache initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('resources')) {
                    const resourceStore = db.createObjectStore('resources', { keyPath: 'key' });
                    resourceStore.createIndex('url', 'url', { unique: false });
                    resourceStore.createIndex('library', 'library', { unique: false });
                    resourceStore.createIndex('timestamp', 'timestamp', { unique: false });
                    resourceStore.createIndex('accessCount', 'accessCount', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }
    
    async initializeServiceWorker() {
        if (!this.config.enableServiceWorker || !('serviceWorker' in navigator)) {
            console.warn('⚠️ ServiceWorker not available');
            return;
        }
        
        try {
            // Register service worker if not already registered
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                console.log('🔧 ServiceWorker not found, will create inline worker');
                await this.createInlineServiceWorker();
            } else {
                console.log('🔁 Using existing ServiceWorker');
            }
            
            // Access cache API
            this.serviceWorkerCache = await caches.open(this.config.swCacheName);
            console.log('⚙️ ServiceWorker cache initialized');
            
        } catch (error) {
            console.error('❌ ServiceWorker initialization failed:', error);
        }
    }
    
    async createInlineServiceWorker() {
        const swCode = `
            const CACHE_NAME = '${this.config.swCacheName}';
            
            self.addEventListener('fetch', (event) => {
                // Only handle CDN requests
                if (event.request.url.includes('cdn.jsdelivr.net') ||
                    event.request.url.includes('unpkg.com') ||
                    event.request.url.includes('cdnjs.cloudflare.com') ||
                    event.request.url.includes('fonts.googleapis.com')) {
                    
                    event.respondWith(
                        caches.match(event.request)
                        .then((response) => {
                            // Return cached version if available
                            if (response) {
                                return response;
                            }
                            
                            // Fetch and cache
                            return fetch(event.request).then((response) => {
                                if (!response || response.status !== 200 || response.type !== 'basic') {
                                    return response;
                                }
                                
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                                
                                return response;
                            }).catch(() => {
                                // Return a fallback response or empty response
                                return new Response('CDN resource unavailable', {
                                    status: 503,
                                    statusText: 'Service Unavailable'
                                });
                            });
                        })
                    );
                }
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        try {
            await navigator.serviceWorker.register(swUrl);
            console.log('✅ Inline ServiceWorker registered');
        } catch (error) {
            console.error('❌ Failed to register inline ServiceWorker:', error);
        }
    }
    
    async initializeCompression() {
        if (!this.config.enableCompression) return;
        
        // Check for compression support
        if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
            console.log('✅ Native compression streams available');
            this.compressionSupport = 'native';
        } else if (typeof window.pako !== 'undefined') {
            console.log('✅ Pako compression library available');
            this.compressionSupport = 'pako';
        } else {
            console.warn('⚠️ No compression support available');
            this.config.enableCompression = false;
            return;
        }
        
        // Try to create a Web Worker for compression (non-blocking)
        try {
            const workerCode = `
                self.onmessage = function(e) {
                    const { action, data, id } = e.data;
                    
                    try {
                        if (action === 'compress') {
                            // Simple compression simulation (real implementation would use actual compression)
                            const compressed = new TextEncoder().encode(JSON.stringify(data));
                            self.postMessage({ id, result: compressed, success: true });
                        } else if (action === 'decompress') {
                            // Simple decompression simulation
                            const decompressed = JSON.parse(new TextDecoder().decode(data));
                            self.postMessage({ id, result: decompressed, success: true });
                        }
                    } catch (error) {
                        self.postMessage({ id, error: error.message, success: false });
                    }
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            this.compressionWorker = new Worker(workerUrl);
            console.log('🛠️ Compression worker initialized');
            
        } catch (error) {
            console.warn('⚠️ Compression worker creation failed:', error);
        }
    }
    
    /**
     * Main cache operations
     */
    
    async store(key, data, metadata = {}) {
        const startTime = performance.now();
        
        try {
            // Validate input
            if (!key || !data) {
                throw new Error('Invalid cache key or data');
            }
            
            // Check size limits
            const dataSize = this.estimateSize(data);
            if (dataSize > this.config.maxItemSize) {
                console.warn(`⚠️ Item too large to cache: ${key} (${this.formatBytes(dataSize)})`);
                return false;
            }
            
            // Prepare cache entry
            const cacheEntry = {
                key,
                data,
                metadata: {
                    url: metadata.url,
                    library: metadata.library,
                    contentType: metadata.contentType,
                    size: dataSize,
                    timestamp: Date.now(),
                    ttl: metadata.ttl || this.getTTL(metadata.library),
                    accessCount: 0,
                    lastAccess: Date.now(),
                    compressed: false,
                    ...metadata
                }
            };
            
            // Compress if enabled and beneficial
            if (this.config.enableCompression && dataSize > this.config.compressionThreshold) {
                const compressed = await this.compressData(data);
                if (compressed && compressed.length < dataSize * 0.9) { // Only if 10%+ savings
                    cacheEntry.data = compressed;
                    cacheEntry.metadata.compressed = true;
                    cacheEntry.metadata.originalSize = dataSize;
                    cacheEntry.metadata.size = compressed.length;
                    
                    this.compressionIndex.set(key, {
                        originalSize: dataSize,
                        compressedSize: compressed.length,
                        ratio: compressed.length / dataSize
                    });
                }
            }
            
            // Ensure cache size limits
            await this.ensureCapacity(cacheEntry.metadata.size);
            
            // Store in multiple layers
            await Promise.all([
                this.storeInMemory(key, cacheEntry),
                this.storeInIndexedDB(key, cacheEntry),
                this.storeInServiceWorker(key, cacheEntry)
            ]);
            
            // Update metadata
            this.cacheMetadata.set(key, cacheEntry.metadata);
            
            // Record metrics
            const duration = performance.now() - startTime;
            this.recordStorageMetrics(duration, cacheEntry.metadata.size, true);
            
            console.log(`💾 Cached: ${key} (${this.formatBytes(cacheEntry.metadata.size)})`);
            return true;
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordStorageMetrics(duration, 0, false);
            console.error(`❌ Failed to cache ${key}:`, error);
            return false;
        }
    }
    
    async retrieve(key) {
        const startTime = performance.now();
        this.metrics.totalRequests++;
        
        try {
            // Try memory cache first (fastest)
            let cacheEntry = this.memoryCache.get(key);
            let source = 'memory';
            
            // Try IndexedDB if not in memory
            if (!cacheEntry) {
                cacheEntry = await this.retrieveFromIndexedDB(key);
                source = 'indexeddb';
            }
            
            // Try ServiceWorker cache if not found
            if (!cacheEntry) {
                cacheEntry = await this.retrieveFromServiceWorker(key);
                source = 'serviceworker';
            }
            
            if (!cacheEntry) {
                // Cache miss
                const duration = performance.now() - startTime;
                this.recordRetrievalMetrics(duration, false, 'miss');
                this.metrics.totalMisses++;
                return null;
            }
            
            // Check expiration
            if (this.isExpired(cacheEntry.metadata)) {
                await this.remove(key);
                const duration = performance.now() - startTime;
                this.recordRetrievalMetrics(duration, false, 'expired');
                this.metrics.totalMisses++;
                return null;
            }
            
            // Update access statistics
            cacheEntry.metadata.accessCount++;
            cacheEntry.metadata.lastAccess = Date.now();
            this.cacheMetadata.set(key, cacheEntry.metadata);
            
            // Store in memory cache for future access (promote to faster layer)
            if (source !== 'memory') {
                this.memoryCache.set(key, cacheEntry);
            }
            
            // Decompress if needed
            let data = cacheEntry.data;
            if (cacheEntry.metadata.compressed) {
                data = await this.decompressData(data);
            }
            
            // Record successful retrieval
            const duration = performance.now() - startTime;
            this.recordRetrievalMetrics(duration, true, source);
            this.metrics.totalHits++;
            
            console.log(`💾 Retrieved from ${source}: ${key}`);
            
            return {
                data,
                metadata: cacheEntry.metadata
            };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordRetrievalMetrics(duration, false, 'error');
            this.metrics.totalMisses++;
            this.metrics.errors++;
            console.error(`❌ Failed to retrieve ${key}:`, error);
            return null;
        }
    }
    
    async remove(key) {
        try {
            // Remove from all storage layers
            this.memoryCache.delete(key);
            
            if (this.indexedDBCache) {
                const transaction = this.indexedDBCache.transaction(['resources'], 'readwrite');
                const store = transaction.objectStore('resources');
                await store.delete(key);
            }
            
            if (this.serviceWorkerCache) {
                const requests = await this.serviceWorkerCache.keys();
                for (const request of requests) {
                    if (this.extractKeyFromRequest(request) === key) {
                        await this.serviceWorkerCache.delete(request);
                        break;
                    }
                }
            }
            
            // Clean up metadata
            this.cacheMetadata.delete(key);
            this.compressionIndex.delete(key);
            
            console.log(`🗑️ Removed from cache: ${key}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to remove ${key}:`, error);
            return false;
        }
    }
    
    async clear() {
        try {
            // Clear memory cache
            this.memoryCache.clear();
            
            // Clear IndexedDB
            if (this.indexedDBCache) {
                const transaction = this.indexedDBCache.transaction(['resources'], 'readwrite');
                const store = transaction.objectStore('resources');
                await store.clear();
            }
            
            // Clear ServiceWorker cache
            if (this.serviceWorkerCache) {
                const keys = await this.serviceWorkerCache.keys();
                await Promise.all(keys.map(key => this.serviceWorkerCache.delete(key)));
            }
            
            // Clear metadata
            this.cacheMetadata.clear();
            this.compressionIndex.clear();
            this.accessHistory.clear();
            
            console.log('🗑️ Cache cleared');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to clear cache:', error);
            return false;
        }
    }
    
    /**
     * Storage layer implementations
     */
    
    async storeInMemory(key, cacheEntry) {
        this.memoryCache.set(key, cacheEntry);
    }
    
    async storeInIndexedDB(key, cacheEntry) {
        if (!this.indexedDBCache) return;
        
        const transaction = this.indexedDBCache.transaction(['resources'], 'readwrite');
        const store = transaction.objectStore('resources');
        
        // Store serializable data
        const dbEntry = {
            key,
            data: cacheEntry.data,
            url: cacheEntry.metadata.url,
            library: cacheEntry.metadata.library,
            timestamp: cacheEntry.metadata.timestamp,
            accessCount: cacheEntry.metadata.accessCount,
            metadata: cacheEntry.metadata
        };
        
        await store.put(dbEntry);
    }
    
    async storeInServiceWorker(key, cacheEntry) {
        if (!this.serviceWorkerCache || !cacheEntry.metadata.url) return;
        
        try {
            // Create a response to cache
            const response = new Response(cacheEntry.data, {
                headers: {
                    'Content-Type': cacheEntry.metadata.contentType || 'application/javascript',
                    'Cache-Control': `max-age=${Math.floor(cacheEntry.metadata.ttl / 1000)}`,
                    'X-Cached-By': 'CDN-Cache-Manager',
                    'X-Cached-At': new Date().toISOString()
                }
            });
            
            await this.serviceWorkerCache.put(cacheEntry.metadata.url, response);
        } catch (error) {
            console.warn(`⚠️ ServiceWorker cache storage failed for ${key}:`, error);
        }
    }
    
    async retrieveFromIndexedDB(key) {
        if (!this.indexedDBCache) return null;
        
        return new Promise((resolve) => {
            const transaction = this.indexedDBCache.transaction(['resources'], 'readonly');
            const store = transaction.objectStore('resources');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve({
                        data: result.data,
                        metadata: result.metadata
                    });
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('IndexedDB retrieval error:', request.error);
                resolve(null);
            };
        });
    }
    
    async retrieveFromServiceWorker(key) {
        if (!this.serviceWorkerCache) return null;
        
        try {
            // Find the request that matches our key
            const requests = await this.serviceWorkerCache.keys();
            for (const request of requests) {
                if (this.extractKeyFromRequest(request) === key) {
                    const response = await this.serviceWorkerCache.match(request);
                    if (response) {
                        const data = await response.text();
                        return {
                            data,
                            metadata: {
                                url: request.url,
                                contentType: response.headers.get('Content-Type'),
                                cachedAt: response.headers.get('X-Cached-At'),
                                timestamp: new Date(response.headers.get('X-Cached-At')).getTime(),
                                accessCount: 0,
                                lastAccess: Date.now()
                            }
                        };
                    }
                    break;
                }
            }
        } catch (error) {
            console.warn(`⚠️ ServiceWorker cache retrieval failed for ${key}:`, error);
        }
        
        return null;
    }
    
    /**
     * Compression operations
     */
    
    async compressData(data) {
        if (!this.config.enableCompression) return data;
        
        try {
            if (this.compressionWorker) {
                return await this.compressWithWorker(data);
            } else if (this.compressionSupport === 'native') {
                return await this.compressWithStreams(data);
            } else if (this.compressionSupport === 'pako') {
                return this.compressWithPako(data);
            }
        } catch (error) {
            console.warn('⚠️ Compression failed:', error);
        }
        
        return data;
    }
    
    async decompressData(data) {
        if (!this.config.enableCompression) return data;
        
        try {
            if (this.compressionWorker) {
                return await this.decompressWithWorker(data);
            } else if (this.compressionSupport === 'native') {
                return await this.decompressWithStreams(data);
            } else if (this.compressionSupport === 'pako') {
                return this.decompressWithPako(data);
            }
        } catch (error) {
            console.warn('⚠️ Decompression failed:', error);
        }
        
        return data;
    }
    
    async compressWithWorker(data) {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9);
            
            const handleMessage = (e) => {
                if (e.data.id === id) {
                    this.compressionWorker.removeEventListener('message', handleMessage);
                    if (e.data.success) {
                        resolve(e.data.result);
                    } else {
                        reject(new Error(e.data.error));
                    }
                }
            };
            
            this.compressionWorker.addEventListener('message', handleMessage);
            this.compressionWorker.postMessage({ action: 'compress', data, id });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                this.compressionWorker.removeEventListener('message', handleMessage);
                reject(new Error('Compression timeout'));
            }, 5000);
        });
    }
    
    async decompressWithWorker(data) {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9);
            
            const handleMessage = (e) => {
                if (e.data.id === id) {
                    this.compressionWorker.removeEventListener('message', handleMessage);
                    if (e.data.success) {
                        resolve(e.data.result);
                    } else {
                        reject(new Error(e.data.error));
                    }
                }
            };
            
            this.compressionWorker.addEventListener('message', handleMessage);
            this.compressionWorker.postMessage({ action: 'decompress', data, id });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                this.compressionWorker.removeEventListener('message', handleMessage);
                reject(new Error('Decompression timeout'));
            }, 5000);
        });
    }
    
    async compressWithStreams(data) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(JSON.stringify(data)));
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                chunks.push(value);
            }
        }
        
        return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
    }
    
    async decompressWithStreams(data) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(data);
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                chunks.push(value);
            }
        }
        
        const decompressedBytes = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
        const decompressedString = new TextDecoder().decode(decompressedBytes);
        return JSON.parse(decompressedString);
    }
    
    compressWithPako(data) {
        const jsonString = JSON.stringify(data);
        return window.pako.gzip(jsonString);
    }
    
    decompressWithPako(data) {
        const decompressed = window.pako.ungzip(data, { to: 'string' });
        return JSON.parse(decompressed);
    }
    
    /**
     * Cache management operations
     */
    
    async ensureCapacity(requiredSize) {
        const currentSize = this.getCurrentCacheSize();
        const availableSpace = this.config.maxCacheSize - currentSize;
        
        if (requiredSize > availableSpace) {
            const spaceToFree = requiredSize - availableSpace;
            await this.freeSpace(spaceToFree);
        }
    }
    
    getCurrentCacheSize() {
        let totalSize = 0;
        for (const [key, metadata] of this.cacheMetadata) {
            totalSize += metadata.size || 0;
        }
        return totalSize;
    }
    
    async freeSpace(targetSize) {
        let freedSize = 0;
        const entries = Array.from(this.cacheMetadata.entries());
        
        // Apply cleanup strategy
        switch (this.config.cleanupStrategy) {
            case 'LRU': // Least Recently Used
                entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
                break;
            case 'LFU': // Least Frequently Used
                entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
                break;
            case 'FIFO': // First In, First Out
                entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
                break;
        }
        
        // Remove entries until we have enough space
        for (const [key, metadata] of entries) {
            if (freedSize >= targetSize) break;
            
            await this.remove(key);
            freedSize += metadata.size || 0;
            this.metrics.evictions++;
        }
        
        console.log(`🗑️ Freed ${this.formatBytes(freedSize)} from cache`);
    }
    
    async prefetchCriticalResources() {
        if (!this.circuitBreaker || !this.circuitBreaker.cdnEndpoints) return;
        
        console.log('🚀 Prefetching critical CDN resources...');
        
        // Sort libraries by prefetch priority
        const librariesByPriority = Object.keys(this.circuitBreaker.cdnEndpoints)
            .sort((a, b) => {
                const priorityA = this.config.prefetchPriority[a] || 999;
                const priorityB = this.config.prefetchPriority[b] || 999;
                return priorityA - priorityB;
            });
        
        // Prefetch in order
        for (const libraryName of librariesByPriority) {
            try {
                await this.prefetchLibrary(libraryName);
            } catch (error) {
                console.warn(`⚠️ Failed to prefetch ${libraryName}:`, error);
            }
        }
    }
    
    async prefetchLibrary(libraryName) {
        const endpoints = this.circuitBreaker.cdnEndpoints[libraryName];
        if (!endpoints) return;
        
        // Try to prefetch from the highest priority endpoint
        const sortedEndpoints = endpoints.sort((a, b) => a.priority - b.priority);
        const endpoint = sortedEndpoints[0];
        
        try {
            const response = await fetch(endpoint.url, {
                mode: 'cors',
                cache: 'force-cache' // Use browser cache if available
            });
            
            if (response.ok) {
                const content = await response.text();
                const cacheKey = this.generateCacheKey(endpoint.url);
                
                await this.store(cacheKey, content, {
                    url: endpoint.url,
                    library: libraryName,
                    contentType: response.headers.get('Content-Type') || 'application/javascript',
                    sri: endpoint.sri,
                    prefetched: true
                });
                
                console.log(`✅ Prefetched ${libraryName} from ${endpoint.name}`);
            }
        } catch (error) {
            console.warn(`⚠️ Prefetch failed for ${libraryName}:`, error);
        }
    }
    
    startCleanupScheduler() {
        if (!this.config.autoCleanup) return;
        
        setInterval(() => {
            this.performMaintenance();
        }, this.config.cleanupInterval);
        
        console.log('🧹 Cache cleanup scheduler started');
    }
    
    async performMaintenance() {
        console.log('🧹 Performing cache maintenance...');
        
        // Remove expired entries
        const expiredKeys = [];
        for (const [key, metadata] of this.cacheMetadata) {
            if (this.isExpired(metadata)) {
                expiredKeys.push(key);
            }
        }
        
        for (const key of expiredKeys) {
            await this.remove(key);
        }
        
        if (expiredKeys.length > 0) {
            console.log(`🗑️ Removed ${expiredKeys.length} expired entries`);
        }
        
        // Check cache size and cleanup if needed
        const currentSize = this.getCurrentCacheSize();
        if (currentSize > this.config.maxCacheSize * 0.9) { // 90% threshold
            await this.freeSpace(currentSize - this.config.maxCacheSize * 0.8); // Free to 80%
        }
        
        // Update metrics
        this.updateCacheMetrics();
    }
    
    startMetricsCollection() {
        if (!this.config.enableMetrics) return;
        
        setInterval(() => {
            this.updateCacheMetrics();
        }, 60000); // Every minute
        
        console.log('📊 Cache metrics collection started');
    }
    
    updateCacheMetrics() {
        // Update hit/miss rates
        this.metrics.hitRate = this.metrics.totalRequests > 0 ?
            this.metrics.totalHits / this.metrics.totalRequests : 0;
        this.metrics.missRate = 1 - this.metrics.hitRate;
        
        // Update storage utilization
        this.metrics.storageUtilization = this.getCurrentCacheSize() / this.config.maxCacheSize;
        
        // Update compression ratio
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        for (const [key, compressionInfo] of this.compressionIndex) {
            totalOriginalSize += compressionInfo.originalSize;
            totalCompressedSize += compressionInfo.compressedSize;
        }
        
        this.metrics.compressionRatio = totalOriginalSize > 0 ?
            totalCompressedSize / totalOriginalSize : 1;
        
        // Store performance history
        this.metrics.performanceHistory.push({
            timestamp: Date.now(),
            hitRate: this.metrics.hitRate,
            storageUtilization: this.metrics.storageUtilization,
            compressionRatio: this.metrics.compressionRatio,
            totalEntries: this.cacheMetadata.size
        });
        
        // Keep only recent history
        const cutoff = Date.now() - this.config.metricsRetention;
        this.metrics.performanceHistory = this.metrics.performanceHistory
            .filter(entry => entry.timestamp > cutoff);
    }
    
    /**
     * Utility methods
     */
    
    generateCacheKey(url) {
        // Create a hash of the URL for cache key
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `cache_${Math.abs(hash)}`;
    }
    
    getTTL(libraryName) {
        return this.config.libraryTTL[libraryName] || this.config.defaultTTL;
    }
    
    isExpired(metadata) {
        return Date.now() > (metadata.timestamp + metadata.ttl);
    }
    
    estimateSize(data) {
        if (typeof data === 'string') {
            return new Blob([data]).size;
        } else if (data instanceof ArrayBuffer) {
            return data.byteLength;
        } else if (data instanceof Uint8Array) {
            return data.length;
        } else {
            return new Blob([JSON.stringify(data)]).size;
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    extractKeyFromRequest(request) {
        // Extract cache key from request URL
        return this.generateCacheKey(request.url);
    }
    
    recordStorageMetrics(duration, size, success) {
        // Record storage operation metrics
        this.metrics.performanceHistory.push({
            timestamp: Date.now(),
            operation: 'store',
            duration,
            size,
            success
        });
    }
    
    recordRetrievalMetrics(duration, success, source) {
        // Update average retrieval time
        if (this.metrics.averageRetrievalTime === 0) {
            this.metrics.averageRetrievalTime = duration;
        } else {
            this.metrics.averageRetrievalTime = (this.metrics.averageRetrievalTime + duration) / 2;
        }
        
        // Record in performance history
        this.metrics.performanceHistory.push({
            timestamp: Date.now(),
            operation: 'retrieve',
            duration,
            success,
            source
        });
    }
    
    /**
     * Public API methods
     */
    
    // Get cache statistics
    getStats() {
        return {
            size: this.getCurrentCacheSize(),
            entries: this.cacheMetadata.size,
            utilization: this.metrics.storageUtilization,
            hitRate: this.metrics.hitRate,
            compressionRatio: this.metrics.compressionRatio,
            averageRetrievalTime: this.metrics.averageRetrievalTime,
            evictions: this.metrics.evictions,
            errors: this.metrics.errors,
            config: this.config
        };
    }
    
    // Get detailed metrics
    getMetrics() {
        return { ...this.metrics };
    }
    
    // List cached items
    listCachedItems() {
        const items = [];
        for (const [key, metadata] of this.cacheMetadata) {
            items.push({
                key,
                url: metadata.url,
                library: metadata.library,
                size: this.formatBytes(metadata.size),
                compressed: metadata.compressed,
                accessCount: metadata.accessCount,
                lastAccess: new Date(metadata.lastAccess).toISOString(),
                expires: new Date(metadata.timestamp + metadata.ttl).toISOString(),
                expired: this.isExpired(metadata)
            });
        }
        return items.sort((a, b) => b.accessCount - a.accessCount);
    }
    
    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ CDN Cache Manager configuration updated');
    }
    
    // Force cleanup
    async forceCleanup() {
        await this.performMaintenance();
        console.log('✅ Cache cleanup completed');
    }
    
    // Export cache data
    async exportCache() {
        const data = {
            version: this.version,
            timestamp: Date.now(),
            metadata: Object.fromEntries(this.cacheMetadata),
            compressionIndex: Object.fromEntries(this.compressionIndex),
            metrics: this.metrics,
            config: this.config
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    // Import cache data
    async importCache(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.metadata) {
                this.cacheMetadata = new Map(Object.entries(data.metadata));
            }
            
            if (data.compressionIndex) {
                this.compressionIndex = new Map(Object.entries(data.compressionIndex));
            }
            
            if (data.metrics) {
                this.metrics = { ...this.metrics, ...data.metrics };
            }
            
            if (data.config) {
                this.config = { ...this.config, ...data.config };
            }
            
            console.log('✅ Cache data imported successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to import cache data:', error);
            return false;
        }
    }
}

// Export for integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDNCacheManager;
}

console.log('💾 CDN Cache Manager loaded - Intelligent caching with compression and offline support');
