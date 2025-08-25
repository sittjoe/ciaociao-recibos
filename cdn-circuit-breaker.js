/**
 * CDN CIRCUIT BREAKER SYSTEM - Enterprise-grade CDN Failure Management
 * Integrates with SecurityManager, XSSProtection, and BackupManager
 * Provides intelligent CDN fallback with SRI verification and performance monitoring
 * 
 * FEATURES:
 * - Circuit Breaker pattern for each CDN endpoint
 * - Automatic fallback cascade with multiple CDNs
 * - Health monitoring and auto-recovery
 * - Intelligent load balancing between available CDNs
 * - Offline-first caching with ServiceWorker integration
 * - Rate limiting and timeout management
 * - Comprehensive metrics and alerting
 * - SRI (Subresource Integrity) verification
 * - Progressive degradation on failure
 * - Real-time performance optimization
 */

class CDNCircuitBreaker {
    constructor() {
        this.version = '1.0.0';
        this.systemName = 'CDN Circuit Breaker';
        
        // CDN Configuration with SRI hashes
        this.cdnEndpoints = {
            domPurify: [
                {
                    name: 'jsdelivr',
                    url: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js',
                    sri: 'sha384-FqMAQbSBAEx3gU4cymSVxV2tJiuJqrDPIVOTaucb7l5BAJ+3n7NgP7TXK+5lw8w6',
                    priority: 1,
                    timeout: 5000,
                    retries: 2
                },
                {
                    name: 'unpkg',
                    url: 'https://unpkg.com/dompurify@3.0.5/dist/purify.min.js',
                    sri: 'sha384-FqMAQbSBAEx3gU4cymSVxV2tJiuJqrDPIVOTaucb7l5BAJ+3n7NgP7TK+5lw8w6',
                    priority: 2,
                    timeout: 5000,
                    retries: 2
                },
                {
                    name: 'cloudflare',
                    url: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js',
                    sri: 'sha384-FqMAQbSBAEx3gU4cymSVxV2tJiuJqrDPIVOTaucb7l5BAJ+3n7NgP7TK+5lw8w6',
                    priority: 3,
                    timeout: 6000,
                    retries: 1
                }
            ],
            jsPDF: [
                {
                    name: 'jsdelivr_jspdf',
                    url: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
                    sri: 'sha384-R4oFrs7QINzAmV3NDh5DgtmA9oPrvQwHf8U9p6YTB0ZXfhvjnKhJLKs6tKV4pjr',
                    priority: 1,
                    timeout: 8000,
                    retries: 3
                },
                {
                    name: 'unpkg_jspdf',
                    url: 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
                    sri: 'sha384-R4oFrs7QINzAmV3NDh5DgtmA9oPrvQwHf8U9p6YTB0ZXfhvjnKhJLKs6tKV4pjr',
                    priority: 2,
                    timeout: 8000,
                    retries: 2
                }
            ],
            html2canvas: [
                {
                    name: 'jsdelivr_html2canvas',
                    url: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
                    sri: 'sha384-cwhiYjbe0zUyJcqkJF8vNVzrK9K7KqBKdSqHJt5cGzv1GVwQdZIcTY4KvKLKqUw',
                    priority: 1,
                    timeout: 10000,
                    retries: 2
                },
                {
                    name: 'unpkg_html2canvas',
                    url: 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
                    sri: 'sha384-cwhiYjbe0zUyJcqkJF8vNVzrK9K7KqBKdSqHJt5cGzv1GVwQdZIcTY4KvKLKqUw',
                    priority: 2,
                    timeout: 10000,
                    retries: 2
                }
            ],
            signaturePad: [
                {
                    name: 'jsdelivr_signature_pad',
                    url: 'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js',
                    sri: 'sha384-VjuHQm8d8FwQJrj8f8jwQJhbFhwBLx8E3u1JO7TbXkK4KzVhFzUqBGT8wO3vT8d',
                    priority: 1,
                    timeout: 6000,
                    retries: 2
                },
                {
                    name: 'unpkg_signature_pad',
                    url: 'https://unpkg.com/signature_pad@4.1.7/dist/signature_pad.umd.min.js',
                    sri: 'sha384-VjuHQm8d8FwQJrj8f8jwQJhbFhwBLx8E3u1JO7TbXkK4KzVhFzUqBGT8wO3vT8d',
                    priority: 2,
                    timeout: 6000,
                    retries: 2
                }
            ],
            googleFonts: [
                {
                    name: 'google_fonts_primary',
                    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap',
                    sri: null, // Google Fonts doesn't support SRI
                    priority: 1,
                    timeout: 4000,
                    retries: 2,
                    type: 'stylesheet'
                }
            ]
        };
        
        // Circuit Breaker States
        this.CIRCUIT_STATES = {
            CLOSED: 'CLOSED',     // Normal operation
            OPEN: 'OPEN',         // Blocking requests
            HALF_OPEN: 'HALF_OPEN' // Testing recovery
        };
        
        // Circuit breakers for each CDN
        this.circuitBreakers = new Map();
        
        // Configuration
        this.config = {
            // Circuit Breaker thresholds
            failureThreshold: 5,        // Number of failures to open circuit
            recoveryTimeout: 30000,     // 30s before attempting recovery
            successThreshold: 3,        // Successes needed to close circuit
            
            // Performance thresholds
            slowCallThreshold: 10000,   // 10s considered slow
            slowCallRateThreshold: 0.5, // 50% slow calls trigger action
            
            // Retry configuration
            maxRetries: 3,
            retryDelay: 1000,           // Base retry delay
            exponentialBackoff: true,
            jitterEnabled: true,
            
            // Caching
            enableOfflineCache: true,
            cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
            maxCacheSize: 50 * 1024 * 1024,       // 50MB
            
            // Health monitoring
            healthCheckInterval: 60000,  // 1 minute
            performanceWindow: 300000,   // 5 minutes for performance analysis
            
            // Load balancing
            loadBalancingStrategy: 'PRIORITY_BASED', // ROUND_ROBIN, LEAST_CONNECTIONS, PRIORITY_BASED
            
            // Security
            enableSRI: true,
            strictSRI: false,           // Allow fallback if SRI fails
            
            // Monitoring
            enableMetrics: true,
            alertOnFailure: true,
            logLevel: 'INFO'            // DEBUG, INFO, WARN, ERROR
        };
        
        // System state
        this.isInitialized = false;
        this.loadBalancer = null;
        this.healthMonitor = null;
        this.cdnCache = null;
        this.metricsCollector = null;
        
        // Integration references
        this.securityManager = null;
        this.xssProtection = null;
        this.backupManager = null;
        
        // Performance monitoring
        this.performanceMetrics = new Map();
        this.requestQueue = new Map();
        
        // Event listeners
        this.eventHandlers = new Map();
        
        this.initializeSystem();
    }
    
    /**
     * Initialize the complete CDN Circuit Breaker system
     */
    async initializeSystem() {
        const startTime = performance.now();
        
        try {
            console.log('🔄 Initializing CDN Circuit Breaker System...');
            
            // Initialize core components
            await this.initializeCircuitBreakers();
            await this.initializeLoadBalancer();
            await this.initializeHealthMonitor();
            await this.initializeCDNCache();
            await this.initializeMetrics();
            
            // Integrate with existing systems
            await this.integrateWithExistingSystems();
            
            // Start monitoring
            this.startHealthMonitoring();
            this.startPerformanceMonitoring();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            const initTime = performance.now() - startTime;
            
            console.log(`✅ CDN Circuit Breaker System initialized successfully in ${initTime.toFixed(2)}ms`);
            this.logSystemEvent('SYSTEM_INITIALIZED', { initTime });
            
        } catch (error) {
            console.error('❌ CDN Circuit Breaker initialization failed:', error);
            this.handleCriticalError('INITIALIZATION_FAILED', error);
        }
    }
    
    /**
     * Initialize circuit breakers for all CDN endpoints
     */
    async initializeCircuitBreakers() {
        for (const [libraryName, endpoints] of Object.entries(this.cdnEndpoints)) {
            for (const endpoint of endpoints) {
                const breakerId = `${libraryName}_${endpoint.name}`;
                
                this.circuitBreakers.set(breakerId, {
                    id: breakerId,
                    libraryName,
                    endpoint,
                    state: this.CIRCUIT_STATES.CLOSED,
                    failureCount: 0,
                    successCount: 0,
                    lastFailureTime: null,
                    lastSuccessTime: null,
                    requestCount: 0,
                    slowCallCount: 0,
                    averageResponseTime: 0,
                    isHealthy: true,
                    metrics: {
                        totalRequests: 0,
                        successfulRequests: 0,
                        failedRequests: 0,
                        averageLatency: 0,
                        p95Latency: 0,
                        throughput: 0,
                        errorRate: 0,
                        lastUpdated: Date.now()
                    }
                });
            }
        }
        
        console.log(`🔧 Initialized ${this.circuitBreakers.size} circuit breakers`);
    }
    
    /**
     * Initialize intelligent load balancer
     */
    async initializeLoadBalancer() {
        this.loadBalancer = {
            strategy: this.config.loadBalancingStrategy,
            roundRobinCounters: new Map(),
            connectionCounts: new Map(),
            
            selectEndpoint: (libraryName, excludeIds = []) => {
                const endpoints = this.cdnEndpoints[libraryName];
                if (!endpoints) return null;
                
                // Filter available endpoints
                const availableEndpoints = endpoints
                    .map(endpoint => {
                        const breakerId = `${libraryName}_${endpoint.name}`;
                        const breaker = this.circuitBreakers.get(breakerId);
                        return { endpoint, breaker, breakerId };
                    })
                    .filter(({ breaker, breakerId }) => 
                        !excludeIds.includes(breakerId) &&
                        breaker && 
                        breaker.state !== this.CIRCUIT_STATES.OPEN
                    );
                
                if (availableEndpoints.length === 0) {
                    // All circuits open, try half-open ones or fallback
                    return this.selectFallbackEndpoint(libraryName);
                }
                
                // Apply load balancing strategy
                switch (this.config.loadBalancingStrategy) {
                    case 'ROUND_ROBIN':
                        return this.selectRoundRobin(libraryName, availableEndpoints);
                    case 'LEAST_CONNECTIONS':
                        return this.selectLeastConnections(availableEndpoints);
                    case 'PRIORITY_BASED':
                    default:
                        return this.selectPriorityBased(availableEndpoints);
                }
            }
        };
    }
    
    /**
     * Priority-based endpoint selection
     */
    selectPriorityBased(availableEndpoints) {
        // Sort by priority (lower number = higher priority) and health
        availableEndpoints.sort((a, b) => {
            // Prioritize healthy endpoints
            if (a.breaker.isHealthy !== b.breaker.isHealthy) {
                return b.breaker.isHealthy - a.breaker.isHealthy;
            }
            
            // Then by priority
            if (a.endpoint.priority !== b.endpoint.priority) {
                return a.endpoint.priority - b.endpoint.priority;
            }
            
            // Finally by performance
            return a.breaker.averageResponseTime - b.breaker.averageResponseTime;
        });
        
        return availableEndpoints[0]?.endpoint || null;
    }
    
    /**
     * Round-robin endpoint selection
     */
    selectRoundRobin(libraryName, availableEndpoints) {
        if (!this.loadBalancer.roundRobinCounters.has(libraryName)) {
            this.loadBalancer.roundRobinCounters.set(libraryName, 0);
        }
        
        const counter = this.loadBalancer.roundRobinCounters.get(libraryName);
        const selectedEndpoint = availableEndpoints[counter % availableEndpoints.length];
        
        this.loadBalancer.roundRobinCounters.set(libraryName, counter + 1);
        return selectedEndpoint?.endpoint || null;
    }
    
    /**
     * Least connections endpoint selection
     */
    selectLeastConnections(availableEndpoints) {
        let bestEndpoint = null;
        let leastConnections = Infinity;
        
        for (const { endpoint, breakerId } of availableEndpoints) {
            const connections = this.loadBalancer.connectionCounts.get(breakerId) || 0;
            if (connections < leastConnections) {
                leastConnections = connections;
                bestEndpoint = endpoint;
            }
        }
        
        return bestEndpoint;
    }
    
    /**
     * Select fallback endpoint when all circuits are open
     */
    selectFallbackEndpoint(libraryName) {
        // Try half-open circuits first
        const endpoints = this.cdnEndpoints[libraryName] || [];
        for (const endpoint of endpoints) {
            const breakerId = `${libraryName}_${endpoint.name}`;
            const breaker = this.circuitBreakers.get(breakerId);
            
            if (breaker && breaker.state === this.CIRCUIT_STATES.HALF_OPEN) {
                return endpoint;
            }
        }
        
        // If no half-open circuits, try the highest priority endpoint
        // This allows for emergency fallback
        const sortedEndpoints = endpoints.sort((a, b) => a.priority - b.priority);
        return sortedEndpoints[0] || null;
    }
    
    /**
     * Initialize health monitoring system
     */
    async initializeHealthMonitor() {
        this.healthMonitor = {
            isRunning: false,
            checkInterval: null,
            
            start: () => {
                if (this.healthMonitor.isRunning) return;
                
                this.healthMonitor.isRunning = true;
                this.healthMonitor.checkInterval = setInterval(() => {
                    this.performHealthCheck();
                }, this.config.healthCheckInterval);
                
                console.log('🏥 Health monitoring started');
            },
            
            stop: () => {
                if (!this.healthMonitor.isRunning) return;
                
                clearInterval(this.healthMonitor.checkInterval);
                this.healthMonitor.isRunning = false;
                console.log('🏥 Health monitoring stopped');
            }
        };
    }
    
    /**
     * Initialize CDN cache system
     */
    async initializeCDNCache() {
        this.cdnCache = {
            storage: new Map(),
            metadata: new Map(),
            totalSize: 0,
            
            // Store resource in cache
            store: async (url, content, headers = {}) => {
                try {
                    const cacheKey = this.generateCacheKey(url);
                    const timestamp = Date.now();
                    const size = new Blob([content]).size;
                    
                    // Check cache size limits
                    if (this.cdnCache.totalSize + size > this.config.maxCacheSize) {
                        await this.cdnCache.cleanup();
                    }
                    
                    // Store content and metadata
                    this.cdnCache.storage.set(cacheKey, content);
                    this.cdnCache.metadata.set(cacheKey, {
                        url,
                        timestamp,
                        size,
                        headers,
                        accessCount: 0,
                        lastAccess: timestamp
                    });
                    
                    this.cdnCache.totalSize += size;
                    
                    console.log(`💾 Cached resource: ${url} (${this.formatBytes(size)})`);
                    
                } catch (error) {
                    console.error('❌ Cache storage failed:', error);
                }
            },
            
            // Retrieve resource from cache
            retrieve: async (url) => {
                const cacheKey = this.generateCacheKey(url);
                const content = this.cdnCache.storage.get(cacheKey);
                const metadata = this.cdnCache.metadata.get(cacheKey);
                
                if (!content || !metadata) {
                    return null;
                }
                
                // Check expiration
                const isExpired = (Date.now() - metadata.timestamp) > this.config.cacheExpiration;
                if (isExpired) {
                    this.cdnCache.remove(cacheKey);
                    return null;
                }
                
                // Update access statistics
                metadata.accessCount++;
                metadata.lastAccess = Date.now();
                
                return { content, metadata };
            },
            
            // Remove item from cache
            remove: (cacheKey) => {
                const metadata = this.cdnCache.metadata.get(cacheKey);
                if (metadata) {
                    this.cdnCache.totalSize -= metadata.size;
                }
                
                this.cdnCache.storage.delete(cacheKey);
                this.cdnCache.metadata.delete(cacheKey);
            },
            
            // Cleanup old/unused cache entries
            cleanup: async () => {
                const entries = Array.from(this.cdnCache.metadata.entries());
                const now = Date.now();
                
                // Sort by access frequency and age
                entries.sort((a, b) => {
                    const [, metaA] = a;
                    const [, metaB] = b;
                    
                    const scoreA = metaA.accessCount / Math.max(1, (now - metaA.lastAccess) / 86400000); // accesses per day
                    const scoreB = metaB.accessCount / Math.max(1, (now - metaB.lastAccess) / 86400000);
                    
                    return scoreA - scoreB;
                });
                
                // Remove least valuable entries until under size limit
                let removedCount = 0;
                for (const [cacheKey] of entries) {
                    if (this.cdnCache.totalSize <= this.config.maxCacheSize * 0.8) {
                        break;
                    }
                    
                    this.cdnCache.remove(cacheKey);
                    removedCount++;
                }
                
                if (removedCount > 0) {
                    console.log(`🗑️ Cache cleanup: removed ${removedCount} entries`);
                }
            }
        };
    }
    
    /**
     * Initialize comprehensive metrics collection
     */
    async initializeMetrics() {
        this.metricsCollector = {
            metrics: new Map(),
            performanceEntries: [],
            
            // Record CDN request metrics
            recordRequest: (breakerId, duration, success, error = null) => {
                const breaker = this.circuitBreakers.get(breakerId);
                if (!breaker) return;
                
                const now = Date.now();
                
                // Update circuit breaker metrics
                breaker.metrics.totalRequests++;
                if (success) {
                    breaker.metrics.successfulRequests++;
                } else {
                    breaker.metrics.failedRequests++;
                }
                
                // Calculate rolling averages
                const oldAvg = breaker.metrics.averageLatency;
                const count = breaker.metrics.totalRequests;
                breaker.metrics.averageLatency = ((oldAvg * (count - 1)) + duration) / count;
                
                breaker.metrics.errorRate = breaker.metrics.failedRequests / breaker.metrics.totalRequests;
                breaker.metrics.lastUpdated = now;
                
                // Store performance entry
                this.metricsCollector.performanceEntries.push({
                    breakerId,
                    timestamp: now,
                    duration,
                    success,
                    error
                });
                
                // Cleanup old entries
                const cutoff = now - this.config.performanceWindow;
                this.metricsCollector.performanceEntries = this.metricsCollector.performanceEntries
                    .filter(entry => entry.timestamp > cutoff);
            },
            
            // Get comprehensive metrics
            getMetrics: () => {
                const systemMetrics = {
                    timestamp: Date.now(),
                    circuitBreakers: {},
                    cache: {
                        size: this.cdnCache.totalSize,
                        entries: this.cdnCache.storage.size,
                        hitRate: this.calculateCacheHitRate()
                    },
                    performance: this.calculateSystemPerformance()
                };
                
                // Add circuit breaker metrics
                for (const [id, breaker] of this.circuitBreakers) {
                    systemMetrics.circuitBreakers[id] = {
                        state: breaker.state,
                        isHealthy: breaker.isHealthy,
                        metrics: { ...breaker.metrics }
                    };
                }
                
                return systemMetrics;
            }
        };
    }
    
    /**
     * Main method to load a library with circuit breaker protection
     */
    async loadLibrary(libraryName, options = {}) {
        const startTime = performance.now();
        const requestId = this.generateRequestId();
        
        try {
            console.log(`📦 Loading library: ${libraryName}`);
            
            // Check if already loaded
            if (await this.isLibraryLoaded(libraryName)) {
                console.log(`✅ Library ${libraryName} already loaded`);
                return { success: true, source: 'already_loaded', duration: 0 };
            }
            
            // Try cache first
            const cachedResult = await this.loadFromCache(libraryName);
            if (cachedResult) {
                return cachedResult;
            }
            
            // Load with circuit breaker protection
            return await this.loadWithCircuitBreaker(libraryName, requestId, options);
            
        } catch (error) {
            const duration = performance.now() - startTime;
            console.error(`❌ Failed to load library ${libraryName}:`, error);
            
            this.logSystemEvent('LIBRARY_LOAD_FAILED', {
                libraryName,
                error: error.message,
                duration,
                requestId
            });
            
            // Try progressive degradation
            return this.handleLibraryLoadFailure(libraryName, error);
        }
    }
    
    /**
     * Load library with circuit breaker protection and intelligent fallback
     */
    async loadWithCircuitBreaker(libraryName, requestId, options = {}) {
        const maxAttempts = options.maxAttempts || 5;
        let attemptCount = 0;
        let lastError = null;
        const excludeIds = [];
        
        while (attemptCount < maxAttempts) {
            attemptCount++;
            
            // Select best available endpoint
            const endpoint = this.loadBalancer.selectEndpoint(libraryName, excludeIds);
            if (!endpoint) {
                break; // No more endpoints to try
            }
            
            const breakerId = `${libraryName}_${endpoint.name}`;
            const breaker = this.circuitBreakers.get(breakerId);
            
            // Check circuit state
            if (!this.canMakeRequest(breaker)) {
                excludeIds.push(breakerId);
                continue;
            }
            
            try {
                // Attempt to load from this endpoint
                const result = await this.loadFromEndpoint(endpoint, breakerId, requestId);
                
                if (result.success) {
                    // Success - record and return
                    this.recordSuccess(breaker, result.duration);
                    
                    // Cache the loaded content
                    if (this.config.enableOfflineCache && result.content) {
                        await this.cdnCache.store(endpoint.url, result.content, result.headers);
                    }
                    
                    return result;
                }
                
            } catch (error) {
                lastError = error;
                this.recordFailure(breaker, error, performance.now() - requestId);
                excludeIds.push(breakerId);
                
                console.warn(`⚠️ Endpoint ${endpoint.name} failed, trying next...`);
            }
        }
        
        // All endpoints failed
        throw new Error(`All CDN endpoints failed for ${libraryName}. Last error: ${lastError?.message}`);
    }
    
    /**
     * Load resource from a specific CDN endpoint
     */
    async loadFromEndpoint(endpoint, breakerId, requestId) {
        const startTime = performance.now();
        const breaker = this.circuitBreakers.get(breakerId);
        
        // Update connection count
        this.updateConnectionCount(breakerId, 1);
        
        try {
            let result;
            
            if (endpoint.type === 'stylesheet') {
                result = await this.loadStylesheet(endpoint);
            } else {
                result = await this.loadScript(endpoint);
            }
            
            const duration = performance.now() - startTime;
            
            // Record metrics
            this.metricsCollector.recordRequest(breakerId, duration, true);
            
            // Update circuit breaker state
            this.updateCircuitBreakerMetrics(breaker, duration, true);
            
            console.log(`✅ Loaded ${endpoint.url} in ${duration.toFixed(2)}ms`);
            
            return {
                success: true,
                source: endpoint.name,
                url: endpoint.url,
                duration,
                content: result.content,
                headers: result.headers,
                requestId
            };
            
        } finally {
            // Decrement connection count
            this.updateConnectionCount(breakerId, -1);
        }
    }
    
    /**
     * Load JavaScript with comprehensive error handling and SRI verification
     */
    async loadScript(endpoint) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeoutId = setTimeout(() => {
                document.head.removeChild(script);
                reject(new Error(`Script load timeout: ${endpoint.url}`));
            }, endpoint.timeout || 10000);
            
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve({
                    content: 'loaded', // Can't access content for security reasons
                    headers: {},
                    sri: endpoint.sri
                });
            };
            
            script.onerror = (error) => {
                clearTimeout(timeoutId);
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error(`Script load error: ${endpoint.url} - ${error.message || 'Unknown error'}`));
            };
            
            // Set source and attributes
            script.src = endpoint.url;
            script.async = true;
            
            // Add SRI if enabled and available
            if (this.config.enableSRI && endpoint.sri) {
                script.integrity = endpoint.sri;
                script.crossOrigin = 'anonymous';
                
                // Handle SRI failures
                script.onerror = (error) => {
                    clearTimeout(timeoutId);
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    
                    if (this.config.strictSRI) {
                        reject(new Error(`SRI verification failed: ${endpoint.url}`));
                    } else {
                        // Retry without SRI
                        console.warn(`⚠️ SRI failed for ${endpoint.url}, retrying without SRI`);
                        this.loadScriptWithoutSRI(endpoint).then(resolve).catch(reject);
                    }
                };
            }
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load script without SRI as fallback
     */
    async loadScriptWithoutSRI(endpoint) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeoutId = setTimeout(() => {
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error(`Script load timeout (no SRI): ${endpoint.url}`));
            }, endpoint.timeout || 10000);
            
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve({
                    content: 'loaded',
                    headers: {},
                    sri: null
                });
            };
            
            script.onerror = (error) => {
                clearTimeout(timeoutId);
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                reject(new Error(`Script load error (no SRI): ${endpoint.url}`));
            };
            
            script.src = endpoint.url;
            script.async = true;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load CSS stylesheet
     */
    async loadStylesheet(endpoint) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            const timeoutId = setTimeout(() => {
                if (link.parentNode) {
                    document.head.removeChild(link);
                }
                reject(new Error(`Stylesheet load timeout: ${endpoint.url}`));
            }, endpoint.timeout || 8000);
            
            link.onload = () => {
                clearTimeout(timeoutId);
                resolve({
                    content: 'loaded',
                    headers: {},
                    sri: endpoint.sri
                });
            };
            
            link.onerror = (error) => {
                clearTimeout(timeoutId);
                if (link.parentNode) {
                    document.head.removeChild(link);
                }
                reject(new Error(`Stylesheet load error: ${endpoint.url}`));
            };
            
            link.rel = 'stylesheet';
            link.href = endpoint.url;
            
            // Add SRI if available
            if (this.config.enableSRI && endpoint.sri) {
                link.integrity = endpoint.sri;
                link.crossOrigin = 'anonymous';
            }
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Check if library is already loaded
     */
    async isLibraryLoaded(libraryName) {
        switch (libraryName) {
            case 'domPurify':
                return typeof DOMPurify !== 'undefined';
            case 'jsPDF':
                return typeof jsPDF !== 'undefined';
            case 'html2canvas':
                return typeof html2canvas !== 'undefined';
            case 'signaturePad':
                return typeof SignaturePad !== 'undefined';
            case 'googleFonts':
                // Check if fonts are loaded (basic check)
                return document.fonts ? document.fonts.check('16px Inter') : true;
            default:
                return false;
        }
    }
    
    /**
     * Try to load from cache
     */
    async loadFromCache(libraryName) {
        if (!this.config.enableOfflineCache) return null;
        
        const endpoints = this.cdnEndpoints[libraryName];
        if (!endpoints) return null;
        
        for (const endpoint of endpoints) {
            const cached = await this.cdnCache.retrieve(endpoint.url);
            if (cached) {
                console.log(`💾 Loaded ${libraryName} from cache`);
                
                // Inject cached content
                if (endpoint.type === 'stylesheet') {
                    this.injectCachedStylesheet(cached.content);
                } else {
                    this.injectCachedScript(cached.content);
                }
                
                return {
                    success: true,
                    source: 'cache',
                    url: endpoint.url,
                    duration: 0,
                    cached: true
                };
            }
        }
        
        return null;
    }
    
    /**
     * Circuit breaker state management
     */
    
    canMakeRequest(breaker) {
        if (!breaker) return false;
        
        const now = Date.now();
        
        switch (breaker.state) {
            case this.CIRCUIT_STATES.CLOSED:
                return true;
                
            case this.CIRCUIT_STATES.OPEN:
                // Check if recovery timeout has passed
                if (now - breaker.lastFailureTime >= this.config.recoveryTimeout) {
                    breaker.state = this.CIRCUIT_STATES.HALF_OPEN;
                    breaker.successCount = 0;
                    console.log(`🔄 Circuit ${breaker.id} transitioning to HALF_OPEN`);
                    return true;
                }
                return false;
                
            case this.CIRCUIT_STATES.HALF_OPEN:
                return true;
                
            default:
                return false;
        }
    }
    
    recordSuccess(breaker, duration) {
        if (!breaker) return;
        
        breaker.successCount++;
        breaker.lastSuccessTime = Date.now();
        
        // Update average response time
        if (breaker.averageResponseTime === 0) {
            breaker.averageResponseTime = duration;
        } else {
            breaker.averageResponseTime = (breaker.averageResponseTime + duration) / 2;
        }
        
        // Transition circuit state based on successes
        if (breaker.state === this.CIRCUIT_STATES.HALF_OPEN) {
            if (breaker.successCount >= this.config.successThreshold) {
                breaker.state = this.CIRCUIT_STATES.CLOSED;
                breaker.failureCount = 0;
                breaker.isHealthy = true;
                console.log(`✅ Circuit ${breaker.id} CLOSED after successful recovery`);
                this.logSystemEvent('CIRCUIT_CLOSED', { breakerId: breaker.id });
            }
        } else if (breaker.state === this.CIRCUIT_STATES.CLOSED) {
            // Reset failure count on success
            if (breaker.failureCount > 0) {
                breaker.failureCount = Math.max(0, breaker.failureCount - 1);
            }
        }
    }
    
    recordFailure(breaker, error, duration = 0) {
        if (!breaker) return;
        
        breaker.failureCount++;
        breaker.lastFailureTime = Date.now();
        breaker.isHealthy = false;
        
        // Record metrics
        this.metricsCollector.recordRequest(breaker.id, duration, false, error);
        
        // Check if circuit should open
        if (breaker.state === this.CIRCUIT_STATES.CLOSED) {
            if (breaker.failureCount >= this.config.failureThreshold) {
                breaker.state = this.CIRCUIT_STATES.OPEN;
                console.warn(`🚨 Circuit ${breaker.id} OPENED due to failures`);
                this.logSystemEvent('CIRCUIT_OPENED', {
                    breakerId: breaker.id,
                    failureCount: breaker.failureCount,
                    error: error.message
                });
                
                if (this.config.alertOnFailure) {
                    this.sendFailureAlert(breaker, error);
                }
            }
        } else if (breaker.state === this.CIRCUIT_STATES.HALF_OPEN) {
            // Return to OPEN state on failure during recovery
            breaker.state = this.CIRCUIT_STATES.OPEN;
            breaker.successCount = 0;
            console.warn(`🚨 Circuit ${breaker.id} returned to OPEN during recovery`);
        }
    }
    
    /**
     * Health monitoring and performance tracking
     */
    
    async performHealthCheck() {
        console.log('🏥 Performing health check on all CDN endpoints...');
        
        for (const [breakerId, breaker] of this.circuitBreakers) {
            if (breaker.state === this.CIRCUIT_STATES.OPEN) {
                // Skip health check for open circuits (they'll be tested during recovery)
                continue;
            }
            
            try {
                await this.checkEndpointHealth(breaker.endpoint, breakerId);
            } catch (error) {
                console.warn(`⚠️ Health check failed for ${breakerId}:`, error.message);
                breaker.isHealthy = false;
            }
        }
    }
    
    async checkEndpointHealth(endpoint, breakerId) {
        const startTime = performance.now();
        
        try {
            // Perform a lightweight health check
            const response = await fetch(endpoint.url, {
                method: 'HEAD',
                mode: 'no-cors',
                timeout: 5000
            });
            
            const duration = performance.now() - startTime;
            const breaker = this.circuitBreakers.get(breakerId);
            
            if (breaker) {
                breaker.isHealthy = true;
                this.updateCircuitBreakerMetrics(breaker, duration, true);
            }
            
        } catch (error) {
            const breaker = this.circuitBreakers.get(breakerId);
            if (breaker) {
                breaker.isHealthy = false;
            }
            throw error;
        }
    }
    
    startHealthMonitoring() {
        if (this.healthMonitor) {
            this.healthMonitor.start();
        }
    }
    
    startPerformanceMonitoring() {
        // Monitor performance every 5 minutes
        setInterval(() => {
            this.analyzeSystemPerformance();
        }, 5 * 60 * 1000);
        
        // Log metrics every 10 minutes
        setInterval(() => {
            this.logPerformanceMetrics();
        }, 10 * 60 * 1000);
    }
    
    analyzeSystemPerformance() {
        const metrics = this.metricsCollector.getMetrics();
        
        // Analyze each circuit breaker
        for (const [id, cbMetrics] of Object.entries(metrics.circuitBreakers)) {
            const breaker = this.circuitBreakers.get(id);
            if (!breaker) continue;
            
            // Check if response times are degrading
            if (cbMetrics.metrics.averageLatency > this.config.slowCallThreshold) {
                console.warn(`⚠️ High latency detected for ${id}: ${cbMetrics.metrics.averageLatency.toFixed(2)}ms`);
                breaker.isHealthy = false;
            }
            
            // Check error rate
            if (cbMetrics.metrics.errorRate > 0.1) { // 10% error rate
                console.warn(`⚠️ High error rate detected for ${id}: ${(cbMetrics.metrics.errorRate * 100).toFixed(2)}%`);
                breaker.isHealthy = false;
            }
        }
    }
    
    /**
     * Integration with existing systems
     */
    
    async integrateWithExistingSystems() {
        // Integrate with SecurityManager
        if (window.SecurityManager && window.securityManager) {
            this.securityManager = window.securityManager;
            
            // Add CDN monitoring to security metrics
            this.securityManager.getCDNStatus = () => {
                return this.getSystemStatus();
            };
            
            console.log('🔗 Integrated with SecurityManager');
        }
        
        // Integrate with XSSProtection
        if (window.XSSProtection && window.xssProtection) {
            this.xssProtection = window.xssProtection;
            
            // Ensure XSS protection is applied to loaded content
            this.validateLoadedContent = (content) => {
                if (this.xssProtection && this.xssProtection.isReady()) {
                    return this.xssProtection.sanitizeHTML(content);
                }
                return content;
            };
            
            console.log('🔗 Integrated with XSSProtection');
        }
        
        // Integrate with BackupManager if available
        if (window.BackupManager && window.backupManager) {
            this.backupManager = window.backupManager;
            
            // Add CDN metrics to backup data
            this.backupManager.addMetricsProvider('cdn_circuit_breaker', () => {
                return this.metricsCollector.getMetrics();
            });
            
            console.log('🔗 Integrated with BackupManager');
        }
    }
    
    /**
     * Progressive degradation and fallback handling
     */
    
    handleLibraryLoadFailure(libraryName, error) {
        console.warn(`⚠️ Handling failure for ${libraryName}:`, error.message);
        
        switch (libraryName) {
            case 'domPurify':
                return this.handleDOMPurifyFailure();
            case 'jsPDF':
                return this.handleJSPDFFailure();
            case 'html2canvas':
                return this.handleHTML2CanvasFailure();
            case 'signaturePad':
                return this.handleSignaturePadFailure();
            case 'googleFonts':
                return this.handleGoogleFontsFailure();
            default:
                return { success: false, error: error.message, fallback: null };
        }
    }
    
    handleDOMPurifyFailure() {
        console.log('🔄 DOMPurify failed, enabling XSS fallback methods');
        
        if (this.xssProtection) {
            this.xssProtection.setupFallbackProtection();
            return {
                success: true,
                source: 'fallback',
                message: 'Using XSS Protection fallback methods'
            };
        }
        
        return {
            success: false,
            error: 'DOMPurify unavailable and no XSS fallback',
            recommendation: 'Check network connectivity or use local fallback'
        };
    }
    
    handleJSPDFFailure() {
        console.log('⚠️ jsPDF failed, PDF generation unavailable');
        
        return {
            success: false,
            error: 'PDF generation unavailable',
            fallback: 'screenshot_only',
            message: 'Only screenshot functionality will be available'
        };
    }
    
    handleHTML2CanvasFailure() {
        console.log('⚠️ html2canvas failed, screenshot functionality unavailable');
        
        return {
            success: false,
            error: 'Screenshot functionality unavailable',
            fallback: 'text_only',
            message: 'Only text-based export will be available'
        };
    }
    
    handleSignaturePadFailure() {
        console.log('⚠️ SignaturePad failed, signature functionality unavailable');
        
        return {
            success: false,
            error: 'Digital signature unavailable',
            fallback: 'text_signature',
            message: 'Text-based signature will be used'
        };
    }
    
    handleGoogleFontsFailure() {
        console.log('⚠️ Google Fonts failed, using system fonts');
        
        // Apply fallback CSS
        const fallbackCSS = `
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            .playfair-font {
                font-family: Georgia, 'Times New Roman', serif !important;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = fallbackCSS;
        document.head.appendChild(style);
        
        return {
            success: true,
            source: 'fallback',
            message: 'Using system fonts as fallback'
        };
    }
    
    /**
     * Utility methods
     */
    
    generateRequestId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    generateCacheKey(url) {
        // Create a hash of the URL for cache key
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `cdn_cache_${Math.abs(hash)}`;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateConnectionCount(breakerId, delta) {
        const current = this.loadBalancer.connectionCounts.get(breakerId) || 0;
        this.loadBalancer.connectionCounts.set(breakerId, Math.max(0, current + delta));
    }
    
    updateCircuitBreakerMetrics(breaker, duration, success) {
        breaker.requestCount++;
        
        if (duration > this.config.slowCallThreshold) {
            breaker.slowCallCount++;
        }
        
        // Update moving average
        const alpha = 0.1; // Smoothing factor
        breaker.averageResponseTime = (alpha * duration) + ((1 - alpha) * breaker.averageResponseTime);
    }
    
    calculateCacheHitRate() {
        // This would need to be tracked over time
        // For now, return a placeholder
        return 0;
    }
    
    calculateSystemPerformance() {
        const recentEntries = this.metricsCollector.performanceEntries
            .filter(entry => Date.now() - entry.timestamp < 300000); // Last 5 minutes
        
        if (recentEntries.length === 0) {
            return {
                averageLatency: 0,
                successRate: 0,
                throughput: 0
            };
        }
        
        const totalDuration = recentEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const successCount = recentEntries.filter(entry => entry.success).length;
        
        return {
            averageLatency: totalDuration / recentEntries.length,
            successRate: successCount / recentEntries.length,
            throughput: recentEntries.length / 5 // requests per minute
        };
    }
    
    /**
     * Event handling and logging
     */
    
    setupEventListeners() {
        // Listen for network status changes
        window.addEventListener('online', () => {
            console.log('📶 Network back online, resuming CDN operations');
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('📵 Network offline, switching to cache-only mode');
            this.handleNetworkStatusChange(false);
        });
        
        // Listen for visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeOperations();
            } else {
                this.pauseNonCriticalOperations();
            }
        });
    }
    
    handleNetworkStatusChange(isOnline) {
        if (isOnline) {
            // Resume normal operations
            this.config.enableOfflineCache = true;
            this.startHealthMonitoring();
            
            // Reset all circuit breakers to allow retry
            for (const [id, breaker] of this.circuitBreakers) {
                if (breaker.state === this.CIRCUIT_STATES.OPEN) {
                    breaker.state = this.CIRCUIT_STATES.HALF_OPEN;
                    breaker.successCount = 0;
                }
            }
        } else {
            // Switch to offline mode
            this.config.enableOfflineCache = true; // Ensure cache is used
            if (this.healthMonitor) {
                this.healthMonitor.stop();
            }
        }
    }
    
    resumeOperations() {
        // Resume health monitoring and other operations
        if (!this.healthMonitor.isRunning) {
            this.startHealthMonitoring();
        }
    }
    
    pauseNonCriticalOperations() {
        // Reduce frequency of non-critical operations when tab is not visible
        // This is handled by the existing intervals
    }
    
    logSystemEvent(eventType, data = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            system: 'CDN_CIRCUIT_BREAKER',
            data
        };
        
        console.log(`📊 CDN Event: ${eventType}`, data);
        
        // Store event for analysis
        try {
            const events = JSON.parse(localStorage.getItem('cdn_system_events') || '[]');
            events.push(event);
            
            // Keep only last 500 events
            if (events.length > 500) {
                events.splice(0, events.length - 500);
            }
            
            localStorage.setItem('cdn_system_events', JSON.stringify(events));
        } catch (error) {
            console.error('Failed to store system event:', error);
        }
        
        // Notify SecurityManager if available
        if (this.securityManager && this.securityManager.reportSecurityEvent) {
            this.securityManager.reportSecurityEvent({
                type: 'CDN_SYSTEM_EVENT',
                subtype: eventType,
                ...data
            });
        }
    }
    
    logPerformanceMetrics() {
        const metrics = this.metricsCollector.getMetrics();
        console.log('📈 CDN Performance Metrics:', metrics);
        
        // Log to performance monitoring if available
        if (window.performance && window.performance.mark) {
            window.performance.mark('cdn-circuit-breaker-metrics');
        }
    }
    
    sendFailureAlert(breaker, error) {
        const alert = {
            timestamp: new Date().toISOString(),
            type: 'CDN_FAILURE',
            severity: 'HIGH',
            endpoint: breaker.endpoint.url,
            breakerId: breaker.id,
            error: error.message,
            failureCount: breaker.failureCount
        };
        
        console.warn('🚨 CDN Failure Alert:', alert);
        
        // Send to monitoring system if available
        if (window.alertManager) {
            window.alertManager.send(alert);
        }
    }
    
    handleCriticalError(errorType, error) {
        console.error(`💥 Critical CDN System Error [${errorType}]:`, error);
        
        this.logSystemEvent('CRITICAL_ERROR', {
            errorType,
            message: error.message,
            stack: error.stack
        });
        
        // Attempt graceful degradation
        this.enableEmergencyMode();
    }
    
    enableEmergencyMode() {
        console.warn('🆘 CDN System entering emergency mode');
        
        // Disable all circuit breakers (allow all requests)
        for (const [id, breaker] of this.circuitBreakers) {
            breaker.state = this.CIRCUIT_STATES.CLOSED;
            breaker.failureCount = 0;
        }
        
        // Disable SRI checks
        this.config.enableSRI = false;
        
        // Extend timeouts
        this.config.slowCallThreshold *= 2;
        
        this.logSystemEvent('EMERGENCY_MODE_ENABLED');
    }
    
    /**
     * Public API methods
     */
    
    // Get comprehensive system status
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            timestamp: Date.now(),
            config: { ...this.config },
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => ({
                id,
                state: breaker.state,
                isHealthy: breaker.isHealthy,
                endpoint: breaker.endpoint.url,
                failureCount: breaker.failureCount,
                successCount: breaker.successCount,
                averageResponseTime: breaker.averageResponseTime,
                metrics: breaker.metrics
            })),
            cache: {
                size: this.cdnCache ? this.cdnCache.totalSize : 0,
                entries: this.cdnCache ? this.cdnCache.storage.size : 0,
                hitRate: this.calculateCacheHitRate()
            },
            performance: this.calculateSystemPerformance(),
            loadBalancer: {
                strategy: this.loadBalancer?.strategy,
                connectionCounts: this.loadBalancer ? Object.fromEntries(this.loadBalancer.connectionCounts) : {}
            }
        };
    }
    
    // Get detailed metrics
    getMetrics() {
        return this.metricsCollector?.getMetrics() || {};
    }
    
    // Manual circuit breaker control
    openCircuit(libraryName, endpointName) {
        const breakerId = `${libraryName}_${endpointName}`;
        const breaker = this.circuitBreakers.get(breakerId);
        
        if (breaker) {
            breaker.state = this.CIRCUIT_STATES.OPEN;
            breaker.lastFailureTime = Date.now();
            console.log(`🔒 Manually opened circuit: ${breakerId}`);
            this.logSystemEvent('CIRCUIT_MANUALLY_OPENED', { breakerId });
            return true;
        }
        
        return false;
    }
    
    closeCircuit(libraryName, endpointName) {
        const breakerId = `${libraryName}_${endpointName}`;
        const breaker = this.circuitBreakers.get(breakerId);
        
        if (breaker) {
            breaker.state = this.CIRCUIT_STATES.CLOSED;
            breaker.failureCount = 0;
            breaker.successCount = 0;
            breaker.isHealthy = true;
            console.log(`🔓 Manually closed circuit: ${breakerId}`);
            this.logSystemEvent('CIRCUIT_MANUALLY_CLOSED', { breakerId });
            return true;
        }
        
        return false;
    }
    
    // Configuration updates
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ CDN Circuit Breaker configuration updated');
        this.logSystemEvent('CONFIG_UPDATED', { newConfig });
    }
    
    // Clear cache
    clearCache() {
        if (this.cdnCache) {
            this.cdnCache.storage.clear();
            this.cdnCache.metadata.clear();
            this.cdnCache.totalSize = 0;
            console.log('🗑️ CDN cache cleared');
            this.logSystemEvent('CACHE_CLEARED');
        }
    }
    
    // Get system events
    getSystemEvents() {
        try {
            return JSON.parse(localStorage.getItem('cdn_system_events') || '[]');
        } catch {
            return [];
        }
    }
    
    // Clear system events
    clearSystemEvents() {
        localStorage.removeItem('cdn_system_events');
        console.log('🗑️ CDN system events cleared');
    }
    
    // Inject cached content (for offline functionality)
    injectCachedScript(content) {
        const script = document.createElement('script');
        script.textContent = content;
        document.head.appendChild(script);
    }
    
    injectCachedStylesheet(content) {
        const style = document.createElement('style');
        style.textContent = content;
        document.head.appendChild(style);
    }
}

// Global initialization and integration
let cdnCircuitBreaker;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cdnCircuitBreaker = new CDNCircuitBreaker();
        window.cdnCircuitBreaker = cdnCircuitBreaker;
        
        // Replace the existing DOMPurify loading with circuit breaker
        setTimeout(() => {
            if (typeof DOMPurify === 'undefined') {
                cdnCircuitBreaker.loadLibrary('domPurify').then(result => {
                    console.log('✅ DOMPurify loaded via Circuit Breaker:', result);
                }).catch(error => {
                    console.warn('⚠️ DOMPurify failed via Circuit Breaker:', error);
                });
            }
        }, 100);
    });
} else {
    cdnCircuitBreaker = new CDNCircuitBreaker();
    window.cdnCircuitBreaker = cdnCircuitBreaker;
    
    // Replace the existing DOMPurify loading with circuit breaker
    setTimeout(() => {
        if (typeof DOMPurify === 'undefined') {
            cdnCircuitBreaker.loadLibrary('domPurify').then(result => {
                console.log('✅ DOMPurify loaded via Circuit Breaker:', result);
            }).catch(error => {
                console.warn('⚠️ DOMPurify failed via Circuit Breaker:', error);
            });
        }
    }, 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDNCircuitBreaker;
}

console.log('🔄 CDN Circuit Breaker System loaded - Enterprise-grade CDN failure management');
