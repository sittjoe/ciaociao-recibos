/**
 * ENTERPRISE DEPENDENCY INJECTION CONTAINER
 * Sistema completo de inyección de dependencias para arquitectura ciaociao.mx
 * 
 * CARACTERÍSTICAS ENTERPRISE:
 * - Service Container con lifecycle management
 * - Automatic dependency resolution y circular detection
 * - Configuration management centralizada
 * - Service proxies para AOP capabilities
 * - Health checking para todas las dependencias
 * - Runtime dependency replacement (hot swapping)
 * - Integration testing support con mocking
 * - Service discovery automático
 * - Event-driven architecture support
 * - Performance monitoring y metrics
 * 
 * INTEGRACIÓN CON ARQUITECTURA EXISTENTE:
 * - SecurityManager con AES-256 encryption
 * - XSSProtection con 92/100 security rating
 * - BackupManager enterprise-grade
 * - CDN Circuit Breaker system
 * - Error Boundary & Recovery System
 * - Transaction Management ACID compliant
 * - API Proxy Service
 * - CDN Cache Manager
 * 
 * PATRONES IMPLEMENTADOS:
 * - Dependency Injection Container
 * - Service Locator Pattern
 * - Factory Pattern para service creation
 * - Proxy Pattern para interceptación
 * - Observer Pattern para events
 * - Strategy Pattern para configuration
 * - Chain of Responsibility para resolution
 * 
 * VERSION: 1.0.0
 * ARCHITECTURE: Enterprise Microservices Ready
 */

class DependencyInjectionContainer {
    constructor() {
        this.version = '1.0.0';
        this.systemName = 'Enterprise DI Container';
        
        // Core container state
        this.services = new Map();
        this.singletons = new Map();
        this.factories = new Map();
        this.configurations = new Map();
        this.interceptors = new Map();
        this.healthCheckers = new Map();
        this.dependencyGraph = new Map();
        this.circularDependencies = new Set();
        
        // Lifecycle management
        this.lifecycleManagers = new Map();
        this.serviceStates = new Map();
        this.initializationQueue = [];
        this.shutdownQueue = [];
        
        // Service discovery and registration
        this.autoDiscoveryEnabled = true;
        this.registrationCallbacks = new Map();
        this.discoveredServices = new Set();
        
        // Configuration management
        this.configurationSources = new Map();
        this.configurationCache = new Map();
        this.configurationWatchers = new Map();
        
        // Performance and monitoring
        this.performanceMetrics = {
            resolutionTime: new Map(),
            creationTime: new Map(),
            healthCheckTime: new Map(),
            interceptorTime: new Map(),
            totalResolutions: 0,
            cachedResolutions: 0,
            failedResolutions: 0,
            averageResolutionTime: 0,
            serviceUptime: new Map(),
            lastHealthCheck: new Map()
        };
        
        // Event system
        this.eventListeners = new Map();
        this.eventQueue = [];
        this.eventProcessing = false;
        
        // Service states enum
        this.SERVICE_STATES = {
            REGISTERED: 'REGISTERED',
            INITIALIZING: 'INITIALIZING',
            READY: 'READY',
            ERROR: 'ERROR',
            DISPOSING: 'DISPOSING',
            DISPOSED: 'DISPOSED'
        };
        
        // Lifecycle types enum
        this.LIFECYCLE_TYPES = {
            SINGLETON: 'SINGLETON',
            TRANSIENT: 'TRANSIENT',
            SCOPED: 'SCOPED',
            LAZY: 'LAZY'
        };
        
        // Error handling
        this.errorHandlers = new Map();
        this.lastErrors = [];
        this.maxErrorHistory = 100;
        
        // Integration references
        this.externalSystems = new Map();
        this.systemIntegrations = new Set();
        
        // Initialize container
        this.initializeContainer();
    }
    
    /**
     * Initialize the complete DI container system
     */
    async initializeContainer() {
        const startTime = performance.now();
        
        try {
            console.log('🚀 Initializing Enterprise Dependency Injection Container...');
            
            // Step 1: Setup core systems
            await this.setupCoreServices();
            await this.setupLifecycleManagement();
            await this.setupConfigurationManagement();
            await this.setupServiceDiscovery();
            
            // Step 2: Integrate with existing systems
            await this.integrateWithExistingSystems();
            
            // Step 3: Start monitoring and health checking
            await this.startHealthMonitoring();
            await this.startPerformanceMonitoring();
            
            // Step 4: Auto-discover and register services
            if (this.autoDiscoveryEnabled) {
                await this.performServiceDiscovery();
            }
            
            // Step 5: Initialize event system
            this.startEventProcessing();
            
            const initTime = performance.now() - startTime;
            console.log(`✅ DI Container initialized successfully in ${initTime.toFixed(2)}ms`);
            
            this.emit('container:initialized', {
                initTime,
                services: this.services.size,
                configurations: this.configurations.size
            });
            
        } catch (error) {
            console.error('❌ DI Container initialization failed:', error);
            this.handleCriticalError('INITIALIZATION_FAILED', error);
            throw error;
        }
    }
    
    /**
     * Setup core container services
     */
    async setupCoreServices() {
        // Register core lifecycle manager
        this.registerFactory('lifecycleManager', () => new ServiceLifecycleManager(this), {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            priority: 1
        });
        
        // Register dependency resolver
        this.registerFactory('dependencyResolver', () => new DependencyResolver(this), {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            priority: 2
        });
        
        // Register service proxy factory
        this.registerFactory('serviceProxyFactory', () => new ServiceProxyFactory(this), {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            priority: 3
        });
        
        // Register configuration manager
        this.registerFactory('configurationManager', () => new ConfigurationManager(this), {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            priority: 4
        });
        
        // Register health checker
        this.registerFactory('healthChecker', () => new HealthChecker(this), {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            priority: 5
        });
        
        console.log('🔧 Core services registered');
    }
    
    /**
     * SERVICE REGISTRATION METHODS
     */
    
    /**
     * Register a service instance
     */
    register(name, instance, options = {}) {
        if (!name || !instance) {
            throw new Error('Service name and instance are required');
        }
        
        const serviceDefinition = {
            name,
            instance,
            lifecycle: options.lifecycle || this.LIFECYCLE_TYPES.SINGLETON,
            dependencies: options.dependencies || [],
            tags: options.tags || [],
            metadata: options.metadata || {},
            healthCheck: options.healthCheck,
            interceptors: options.interceptors || [],
            priority: options.priority || 100,
            autoStart: options.autoStart !== false,
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            configuration: options.configuration || {}
        };
        
        this.services.set(name, serviceDefinition);
        this.serviceStates.set(name, this.SERVICE_STATES.REGISTERED);
        
        // Add to dependency graph
        this.updateDependencyGraph(name, serviceDefinition.dependencies);
        
        // Setup health checker if provided
        if (serviceDefinition.healthCheck) {
            this.healthCheckers.set(name, serviceDefinition.healthCheck);
        }
        
        console.log(`📋 Registered service: ${name} (${serviceDefinition.lifecycle})`);
        
        this.emit('service:registered', { name, definition: serviceDefinition });
        
        return this;
    }
    
    /**
     * Register a factory function
     */
    registerFactory(name, factory, options = {}) {
        if (!name || typeof factory !== 'function') {
            throw new Error('Service name and factory function are required');
        }
        
        const factoryDefinition = {
            name,
            factory,
            lifecycle: options.lifecycle || this.LIFECYCLE_TYPES.TRANSIENT,
            dependencies: options.dependencies || [],
            tags: options.tags || [],
            metadata: options.metadata || {},
            healthCheck: options.healthCheck,
            interceptors: options.interceptors || [],
            priority: options.priority || 100,
            autoStart: options.autoStart !== false,
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            configuration: options.configuration || {},
            lazy: options.lazy === true
        };
        
        this.factories.set(name, factoryDefinition);
        this.serviceStates.set(name, this.SERVICE_STATES.REGISTERED);
        
        // Add to dependency graph
        this.updateDependencyGraph(name, factoryDefinition.dependencies);
        
        // Setup health checker if provided
        if (factoryDefinition.healthCheck) {
            this.healthCheckers.set(name, factoryDefinition.healthCheck);
        }
        
        console.log(`🏭 Registered factory: ${name} (${factoryDefinition.lifecycle})`);
        
        this.emit('factory:registered', { name, definition: factoryDefinition });
        
        return this;
    }
    
    /**
     * Register configuration
     */
    registerConfiguration(name, configuration, options = {}) {
        const configDefinition = {
            name,
            configuration,
            source: options.source || 'manual',
            priority: options.priority || 100,
            volatile: options.volatile === true,
            encrypted: options.encrypted === true,
            watchers: options.watchers || [],
            validation: options.validation,
            transformation: options.transformation
        };
        
        this.configurations.set(name, configDefinition);
        this.configurationCache.set(name, configuration);
        
        // Setup watchers
        if (configDefinition.watchers.length > 0) {
            this.configurationWatchers.set(name, configDefinition.watchers);
        }
        
        console.log(`⚙️ Registered configuration: ${name}`);
        
        this.emit('configuration:registered', { name, definition: configDefinition });
        
        return this;
    }
    
    /**
     * SERVICE RESOLUTION METHODS
     */
    
    /**
     * Resolve a service with full dependency injection
     */
    async resolve(name, context = {}) {
        const startTime = performance.now();
        
        try {
            this.performanceMetrics.totalResolutions++;
            
            // Check for circular dependencies
            if (context.resolutionStack && context.resolutionStack.includes(name)) {
                const cycle = [...context.resolutionStack, name].join(' -> ');
                throw new Error(`Circular dependency detected: ${cycle}`);
            }
            
            const resolutionStack = [...(context.resolutionStack || []), name];
            const newContext = { ...context, resolutionStack };
            
            // Try singleton cache first
            if (this.singletons.has(name)) {
                this.performanceMetrics.cachedResolutions++;
                return this.singletons.get(name);
            }
            
            // Resolve from service registry or factory
            let instance;
            
            if (this.services.has(name)) {
                instance = await this.resolveFromRegistry(name, newContext);
            } else if (this.factories.has(name)) {
                instance = await this.resolveFromFactory(name, newContext);
            } else {
                // Try auto-discovery
                const discovered = await this.tryAutoDiscovery(name);
                if (discovered) {
                    instance = await this.resolve(name, newContext);
                } else {
                    throw new Error(`Service '${name}' not found and auto-discovery failed`);
                }
            }
            
            // Apply interceptors
            if (instance) {
                instance = await this.applyInterceptors(name, instance, newContext);
            }
            
            // Cache singleton if needed
            const definition = this.services.get(name) || this.factories.get(name);
            if (definition && definition.lifecycle === this.LIFECYCLE_TYPES.SINGLETON) {
                this.singletons.set(name, instance);
            }
            
            // Update service state
            this.serviceStates.set(name, this.SERVICE_STATES.READY);
            
            // Record metrics
            const resolutionTime = performance.now() - startTime;
            this.recordResolutionMetrics(name, resolutionTime, true);
            
            console.log(`✅ Resolved service: ${name} in ${resolutionTime.toFixed(2)}ms`);
            
            this.emit('service:resolved', { name, instance, resolutionTime });
            
            return instance;
            
        } catch (error) {
            const resolutionTime = performance.now() - startTime;
            this.recordResolutionMetrics(name, resolutionTime, false);
            this.performanceMetrics.failedResolutions++;
            
            console.error(`❌ Failed to resolve service '${name}':`, error);
            
            this.emit('service:resolution_failed', { name, error, resolutionTime });
            
            throw error;
        }
    }
    
    /**
     * Resolve service from registry
     */
    async resolveFromRegistry(name, context) {
        const definition = this.services.get(name);
        if (!definition) {
            throw new Error(`Service '${name}' not found in registry`);
        }
        
        // Update service state
        this.serviceStates.set(name, this.SERVICE_STATES.INITIALIZING);
        
        // Resolve dependencies
        const dependencies = await this.resolveDependencies(definition.dependencies, context);
        
        // Inject dependencies if service supports it
        let instance = definition.instance;
        if (instance && typeof instance.setDependencies === 'function') {
            instance.setDependencies(dependencies);
        }
        
        // Initialize if needed
        if (instance && typeof instance.initialize === 'function') {
            await instance.initialize();
        }
        
        return instance;
    }
    
    /**
     * Resolve service from factory
     */
    async resolveFromFactory(name, context) {
        const definition = this.factories.get(name);
        if (!definition) {
            throw new Error(`Factory '${name}' not found`);
        }
        
        // Update service state
        this.serviceStates.set(name, this.SERVICE_STATES.INITIALIZING);
        
        // Resolve dependencies
        const dependencies = await this.resolveDependencies(definition.dependencies, context);
        
        // Get configuration
        const configuration = this.getConfiguration(name);
        
        // Create instance using factory
        const instance = await definition.factory(dependencies, configuration, this);
        
        if (!instance) {
            throw new Error(`Factory '${name}' returned null or undefined`);
        }
        
        // Initialize if needed
        if (typeof instance.initialize === 'function') {
            await instance.initialize();
        }
        
        return instance;
    }
    
    /**
     * Resolve multiple dependencies
     */
    async resolveDependencies(dependencies, context) {
        if (!dependencies || dependencies.length === 0) {
            return {};
        }
        
        const resolved = {};
        
        for (const dependency of dependencies) {
            if (typeof dependency === 'string') {
                resolved[dependency] = await this.resolve(dependency, context);
            } else if (typeof dependency === 'object' && dependency.name) {
                const key = dependency.alias || dependency.name;
                resolved[key] = await this.resolve(dependency.name, context);
            }
        }
        
        return resolved;
    }
    
    /**
     * CONFIGURATION MANAGEMENT
     */
    
    /**
     * Get configuration for service
     */
    getConfiguration(serviceName, key = null) {
        // Try service-specific configuration first
        let config = this.configurationCache.get(serviceName) || {};
        
        // Try global configuration
        const globalConfig = this.configurationCache.get('global') || {};
        config = { ...globalConfig, ...config };
        
        // Apply environment-specific overrides
        const envConfig = this.configurationCache.get(`env.${this.getEnvironment()}`) || {};
        config = { ...config, ...envConfig };
        
        return key ? config[key] : config;
    }
    
    /**
     * Update configuration
     */
    updateConfiguration(name, configuration, notify = true) {
        const existing = this.configurationCache.get(name) || {};
        const updated = { ...existing, ...configuration };
        
        this.configurationCache.set(name, updated);
        
        if (notify) {
            // Notify watchers
            const watchers = this.configurationWatchers.get(name) || [];
            watchers.forEach(watcher => {
                try {
                    watcher(updated, existing);
                } catch (error) {
                    console.error(`Configuration watcher error for ${name}:`, error);
                }
            });
            
            this.emit('configuration:updated', { name, configuration: updated });
        }
        
        return this;
    }
    
    /**
     * SERVICE LIFECYCLE MANAGEMENT
     */
    
    /**
     * Setup lifecycle management
     */
    async setupLifecycleManagement() {
        // Register lifecycle callbacks
        this.on('service:registered', this.handleServiceRegistered.bind(this));
        this.on('service:resolved', this.handleServiceResolved.bind(this));
        this.on('service:disposed', this.handleServiceDisposed.bind(this));
        
        // Setup automatic cleanup on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.shutdown();
            });
        }
        
        console.log('♻️ Lifecycle management setup complete');
    }
    
    /**
     * Handle service registered event
     */
    handleServiceRegistered(event) {
        const { name, definition } = event;
        
        // Add to initialization queue if auto-start
        if (definition.autoStart) {
            this.initializationQueue.push({
                name,
                priority: definition.priority || 100,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Handle service resolved event
     */
    handleServiceResolved(event) {
        const { name, instance } = event;
        
        // Track service uptime
        this.performanceMetrics.serviceUptime.set(name, Date.now());
        
        // Schedule health check
        if (this.healthCheckers.has(name)) {
            this.scheduleHealthCheck(name);
        }
    }
    
    /**
     * Handle service disposed event
     */
    handleServiceDisposed(event) {
        const { name } = event;
        
        // Clean up references
        this.singletons.delete(name);
        this.serviceStates.delete(name);
        this.performanceMetrics.serviceUptime.delete(name);
        this.performanceMetrics.lastHealthCheck.delete(name);
    }
    
    /**
     * SERVICE PROXY AND INTERCEPTORS
     */
    
    /**
     * Apply interceptors to service instance
     */
    async applyInterceptors(name, instance, context) {
        const definition = this.services.get(name) || this.factories.get(name);
        if (!definition || !definition.interceptors || definition.interceptors.length === 0) {
            return instance;
        }
        
        let proxiedInstance = instance;
        
        for (const interceptorName of definition.interceptors) {
            const interceptor = this.interceptors.get(interceptorName);
            if (interceptor) {
                proxiedInstance = await interceptor.intercept(proxiedInstance, name, context);
            }
        }
        
        return proxiedInstance;
    }
    
    /**
     * Register interceptor
     */
    registerInterceptor(name, interceptor) {
        if (!name || !interceptor || typeof interceptor.intercept !== 'function') {
            throw new Error('Valid interceptor name and implementation required');
        }
        
        this.interceptors.set(name, interceptor);
        
        console.log(`🔍 Registered interceptor: ${name}`);
        
        this.emit('interceptor:registered', { name, interceptor });
        
        return this;
    }
    
    /**
     * SERVICE HEALTH MONITORING
     */
    
    /**
     * Start health monitoring system
     */
    async startHealthMonitoring() {
        // Health check interval (every 5 minutes)
        setInterval(() => {
            this.performHealthChecks();
        }, 5 * 60 * 1000);
        
        console.log('🏥 Health monitoring started');
    }
    
    /**
     * Perform health checks on all services
     */
    async performHealthChecks() {
        const healthPromises = [];
        
        for (const [name, healthChecker] of this.healthCheckers) {
            const promise = this.performServiceHealthCheck(name, healthChecker)
                .catch(error => {
                    console.error(`Health check failed for ${name}:`, error);
                    return { name, healthy: false, error };
                });
            
            healthPromises.push(promise);
        }
        
        const results = await Promise.allSettled(healthPromises);
        
        // Process health check results
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { name, healthy, error } = result.value;
                this.performanceMetrics.lastHealthCheck.set(name, Date.now());
                
                if (!healthy) {
                    this.emit('service:unhealthy', { name, error });
                    this.handleUnhealthyService(name, error);
                }
            }
        });
    }
    
    /**
     * Perform health check for specific service
     */
    async performServiceHealthCheck(name, healthChecker) {
        const startTime = performance.now();
        
        try {
            const instance = await this.resolve(name);
            const healthy = await healthChecker(instance);
            
            const checkTime = performance.now() - startTime;
            const currentMetric = this.performanceMetrics.healthCheckTime.get(name) || [];
            currentMetric.push(checkTime);
            
            // Keep only last 10 measurements
            if (currentMetric.length > 10) {
                currentMetric.shift();
            }
            
            this.performanceMetrics.healthCheckTime.set(name, currentMetric);
            
            return { name, healthy, checkTime };
            
        } catch (error) {
            const checkTime = performance.now() - startTime;
            return { name, healthy: false, error, checkTime };
        }
    }
    
    /**
     * Handle unhealthy service
     */
    handleUnhealthyService(name, error) {
        console.warn(`⚠️ Service ${name} is unhealthy:`, error);
        
        // Try to restart the service
        this.restartService(name);
    }
    
    /**
     * Restart a service
     */
    async restartService(name) {
        try {
            console.log(`🔄 Restarting service: ${name}`);
            
            // Dispose current instance
            await this.dispose(name);
            
            // Clear from singleton cache
            this.singletons.delete(name);
            
            // Re-resolve
            await this.resolve(name);
            
            this.emit('service:restarted', { name });
            
        } catch (error) {
            console.error(`❌ Failed to restart service ${name}:`, error);
            this.emit('service:restart_failed', { name, error });
        }
    }
    
    /**
     * SERVICE DISCOVERY
     */
    
    /**
     * Setup automatic service discovery
     */
    async setupServiceDiscovery() {
        // Register discovery callbacks for existing systems
        this.registerDiscoveryCallback('SecurityManager', () => window.securityManager);
        this.registerDiscoveryCallback('XSSProtection', () => window.xssProtection);
        this.registerDiscoveryCallback('BackupManager', () => window.backupManager);
        this.registerDiscoveryCallback('CDNCircuitBreaker', () => window.cdnCircuitBreaker);
        this.registerDiscoveryCallback('APIProxyService', () => window.apiProxyService);
        this.registerDiscoveryCallback('TransactionManager', () => window.txAPI);
        
        console.log('🔍 Service discovery setup complete');
    }
    
    /**
     * Register discovery callback
     */
    registerDiscoveryCallback(name, callback) {
        this.registrationCallbacks.set(name, callback);
        return this;
    }
    
    /**
     * Perform automatic service discovery
     */
    async performServiceDiscovery() {
        console.log('🔎 Performing automatic service discovery...');
        
        for (const [name, callback] of this.registrationCallbacks) {
            try {
                const instance = callback();
                if (instance && !this.services.has(name)) {
                    this.register(name, instance, {
                        lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
                        discovered: true,
                        tags: ['discovered', 'existing-system']
                    });
                    
                    this.discoveredServices.add(name);
                    console.log(`✅ Discovered and registered: ${name}`);
                }
            } catch (error) {
                console.warn(`⚠️ Discovery failed for ${name}:`, error);
            }
        }
    }
    
    /**
     * Try auto-discovery for unknown service
     */
    async tryAutoDiscovery(name) {
        if (this.registrationCallbacks.has(name)) {
            const callback = this.registrationCallbacks.get(name);
            try {
                const instance = callback();
                if (instance) {
                    this.register(name, instance, {
                        lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
                        discovered: true,
                        tags: ['auto-discovered']
                    });
                    return true;
                }
            } catch (error) {
                console.warn(`Auto-discovery failed for ${name}:`, error);
            }
        }
        return false;
    }
    
    /**
     * INTEGRATION WITH EXISTING SYSTEMS
     */
    
    /**
     * Integrate with all existing ciaociao.mx systems
     */
    async integrateWithExistingSystems() {
        console.log('🔗 Integrating with existing systems...');
        
        // Wait for systems to be available
        await this.waitForSystem('SecurityManager', () => window.securityManager, 5000);
        await this.waitForSystem('XSSProtection', () => window.xssProtection, 5000);
        await this.waitForSystem('BackupManager', () => window.backupManager, 3000);
        await this.waitForSystem('CDNCircuitBreaker', () => window.cdnCircuitBreaker, 3000);
        
        // Register existing systems
        this.registerExistingSystem('SecurityManager', window.securityManager, {
            healthCheck: (instance) => instance && instance.getSecurityStats,
            dependencies: ['XSSProtection'],
            priority: 1
        });
        
        this.registerExistingSystem('XSSProtection', window.xssProtection, {
            healthCheck: (instance) => instance && instance.isReady && instance.isReady(),
            priority: 2
        });
        
        if (window.backupManager) {
            this.registerExistingSystem('BackupManager', window.backupManager, {
                dependencies: ['SecurityManager'],
                priority: 10
            });
        }
        
        if (window.cdnCircuitBreaker) {
            this.registerExistingSystem('CDNCircuitBreaker', window.cdnCircuitBreaker, {
                dependencies: ['SecurityManager'],
                priority: 5
            });
        }
        
        if (window.apiProxyService) {
            this.registerExistingSystem('APIProxyService', window.apiProxyService, {
                priority: 8
            });
        }
        
        if (window.txAPI) {
            this.registerExistingSystem('TransactionManager', window.txAPI, {
                dependencies: ['SecurityManager'],
                priority: 3
            });
        }
        
        // Setup cross-system communication
        this.setupCrossSystemCommunication();
        
        console.log('✅ Integration with existing systems complete');
    }
    
    /**
     * Wait for system to become available
     */
    async waitForSystem(name, getter, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const system = getter();
                if (system) {
                    console.log(`✅ System available: ${name}`);
                    return system;
                }
            } catch (error) {
                // System not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn(`⚠️ Timeout waiting for system: ${name}`);
        return null;
    }
    
    /**
     * Register existing system with DI container
     */
    registerExistingSystem(name, instance, options = {}) {
        if (!instance) {
            console.warn(`⚠️ Cannot register null instance for ${name}`);
            return;
        }
        
        this.register(name, instance, {
            lifecycle: this.LIFECYCLE_TYPES.SINGLETON,
            tags: ['existing-system', 'legacy'],
            ...options
        });
        
        this.systemIntegrations.add(name);
        this.externalSystems.set(name, instance);
        
        console.log(`🔗 Integrated existing system: ${name}`);
    }
    
    /**
     * Setup cross-system communication
     */
    setupCrossSystemCommunication() {
        // Enable systems to communicate through DI container
        this.on('service:resolved', (event) => {
            const { name, instance } = event;
            
            // Inject DI container reference if system supports it
            if (instance && typeof instance.setDIContainer === 'function') {
                instance.setDIContainer(this);
            }
            
            // Setup event forwarding
            if (instance && typeof instance.on === 'function') {
                instance.on('*', (eventName, eventData) => {
                    this.emit(`${name}:${eventName}`, eventData);
                });
            }
        });
    }
    
    /**
     * PERFORMANCE MONITORING
     */
    
    /**
     * Start performance monitoring
     */
    async startPerformanceMonitoring() {
        // Performance metrics collection every minute
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 60 * 1000);
        
        // Performance report every 10 minutes
        setInterval(() => {
            this.generatePerformanceReport();
        }, 10 * 60 * 1000);
        
        console.log('📈 Performance monitoring started');
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        // Calculate average resolution time
        const resolutionTimes = [];
        for (const times of this.performanceMetrics.resolutionTime.values()) {
            resolutionTimes.push(...times);
        }
        
        if (resolutionTimes.length > 0) {
            this.performanceMetrics.averageResolutionTime = 
                resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
        }
        
        // Emit performance metrics
        this.emit('performance:metrics', this.performanceMetrics);
    }
    
    /**
     * Generate performance report
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            services: {
                total: this.services.size,
                singletons: this.singletons.size,
                factories: this.factories.size,
                discovered: this.discoveredServices.size
            },
            performance: {
                totalResolutions: this.performanceMetrics.totalResolutions,
                cachedResolutions: this.performanceMetrics.cachedResolutions,
                failedResolutions: this.performanceMetrics.failedResolutions,
                averageResolutionTime: this.performanceMetrics.averageResolutionTime,
                cacheHitRate: this.performanceMetrics.totalResolutions > 0 ?
                    (this.performanceMetrics.cachedResolutions / this.performanceMetrics.totalResolutions) * 100 : 0
            },
            health: {
                totalServices: this.healthCheckers.size,
                lastHealthChecks: this.performanceMetrics.lastHealthCheck.size
            }
        };
        
        console.log('📊 DI Container Performance Report:', report);
        this.emit('performance:report', report);
        
        return report;
    }
    
    /**
     * Record resolution metrics
     */
    recordResolutionMetrics(name, time, success) {
        // Record resolution time
        const times = this.performanceMetrics.resolutionTime.get(name) || [];
        times.push(time);
        
        // Keep only last 50 measurements
        if (times.length > 50) {
            times.shift();
        }
        
        this.performanceMetrics.resolutionTime.set(name, times);
        
        // Record creation time for factories
        if (this.factories.has(name)) {
            const creationTimes = this.performanceMetrics.creationTime.get(name) || [];
            creationTimes.push(time);
            
            if (creationTimes.length > 50) {
                creationTimes.shift();
            }
            
            this.performanceMetrics.creationTime.set(name, creationTimes);
        }
    }
    
    /**
     * UTILITY AND MANAGEMENT METHODS
     */
    
    /**
     * Check if service exists
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }
    
    /**
     * Get service information
     */
    getServiceInfo(name) {
        const service = this.services.get(name);
        const factory = this.factories.get(name);
        const definition = service || factory;
        
        if (!definition) {
            return null;
        }
        
        return {
            name,
            type: service ? 'service' : 'factory',
            lifecycle: definition.lifecycle,
            state: this.serviceStates.get(name),
            dependencies: definition.dependencies,
            tags: definition.tags,
            metadata: definition.metadata,
            priority: definition.priority,
            isSingleton: this.singletons.has(name),
            hasHealthCheck: this.healthCheckers.has(name),
            interceptors: definition.interceptors
        };
    }
    
    /**
     * List all services
     */
    listServices() {
        const services = [];
        
        for (const name of this.services.keys()) {
            services.push(this.getServiceInfo(name));
        }
        
        for (const name of this.factories.keys()) {
            if (!this.services.has(name)) {
                services.push(this.getServiceInfo(name));
            }
        }
        
        return services.sort((a, b) => a.priority - b.priority);
    }
    
    /**
     * Dispose of service
     */
    async dispose(name) {
        try {
            this.serviceStates.set(name, this.SERVICE_STATES.DISPOSING);
            
            const instance = this.singletons.get(name);
            if (instance && typeof instance.dispose === 'function') {
                await instance.dispose();
            }
            
            // Clean up references
            this.singletons.delete(name);
            this.serviceStates.set(name, this.SERVICE_STATES.DISPOSED);
            
            this.emit('service:disposed', { name });
            
        } catch (error) {
            console.error(`Failed to dispose service ${name}:`, error);
            this.serviceStates.set(name, this.SERVICE_STATES.ERROR);
        }
    }
    
    /**
     * Shutdown container
     */
    async shutdown() {
        console.log('🔄 Shutting down DI Container...');
        
        // Dispose all singletons
        const disposalPromises = [];
        for (const name of this.singletons.keys()) {
            disposalPromises.push(this.dispose(name));
        }
        
        await Promise.allSettled(disposalPromises);
        
        // Clear all collections
        this.services.clear();
        this.factories.clear();
        this.singletons.clear();
        this.configurations.clear();
        this.healthCheckers.clear();
        this.interceptors.clear();
        
        console.log('✅ DI Container shutdown complete');
        this.emit('container:shutdown');
    }
    
    /**
     * Hot swap service implementation
     */
    async hotSwap(name, newImplementation) {
        try {
            console.log(`🔄 Hot swapping service: ${name}`);
            
            // Dispose current implementation
            await this.dispose(name);
            
            // Update registration
            if (typeof newImplementation === 'function') {
                const existing = this.factories.get(name);
                if (existing) {
                    existing.factory = newImplementation;
                }
            } else {
                const existing = this.services.get(name);
                if (existing) {
                    existing.instance = newImplementation;
                }
            }
            
            // Re-resolve to create new instance
            await this.resolve(name);
            
            this.emit('service:hot_swapped', { name, newImplementation });
            
            console.log(`✅ Hot swap completed for: ${name}`);
            
        } catch (error) {
            console.error(`❌ Hot swap failed for ${name}:`, error);
            throw error;
        }
    }
    
    /**
     * Create service scope
     */
    createScope(name) {
        return new ServiceScope(name, this);
    }
    
    /**
     * Update dependency graph
     */
    updateDependencyGraph(serviceName, dependencies) {
        this.dependencyGraph.set(serviceName, dependencies || []);
        
        // Check for circular dependencies
        this.detectCircularDependencies();
    }
    
    /**
     * Detect circular dependencies
     */
    detectCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        
        for (const serviceName of this.dependencyGraph.keys()) {
            if (this.hasCircularDependency(serviceName, visited, recursionStack)) {
                this.circularDependencies.add(serviceName);
                console.warn(`⚠️ Circular dependency detected involving: ${serviceName}`);
            }
        }
    }
    
    /**
     * Check for circular dependency in service tree
     */
    hasCircularDependency(serviceName, visited, recursionStack) {
        if (recursionStack.has(serviceName)) {
            return true;
        }
        
        if (visited.has(serviceName)) {
            return false;
        }
        
        visited.add(serviceName);
        recursionStack.add(serviceName);
        
        const dependencies = this.dependencyGraph.get(serviceName) || [];
        
        for (const dep of dependencies) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            if (this.hasCircularDependency(depName, visited, recursionStack)) {
                return true;
            }
        }
        
        recursionStack.delete(serviceName);
        return false;
    }
    
    /**
     * Get environment
     */
    getEnvironment() {
        if (typeof window !== 'undefined' && window.location) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'development';
            } else if (window.location.hostname.includes('test') || window.location.hostname.includes('staging')) {
                return 'staging';
            }
        }
        return 'production';
    }
    
    /**
     * Handle critical error
     */
    handleCriticalError(type, error) {
        const errorInfo = {
            type,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        this.lastErrors.push(errorInfo);
        
        // Keep only last 100 errors
        if (this.lastErrors.length > this.maxErrorHistory) {
            this.lastErrors.shift();
        }
        
        // Notify error handlers
        const handler = this.errorHandlers.get(type);
        if (handler) {
            handler(errorInfo);
        }
        
        this.emit('container:error', errorInfo);
    }
    
    /**
     * EVENT SYSTEM IMPLEMENTATION
     */
    
    /**
     * Start event processing
     */
    startEventProcessing() {
        if (this.eventProcessing) return;
        
        this.eventProcessing = true;
        
        // Process event queue
        setInterval(() => {
            this.processEventQueue();
        }, 10); // Process every 10ms
    }
    
    /**
     * Process event queue
     */
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
        }
    }
    
    /**
     * Process single event
     */
    processEvent(event) {
        const { name, data } = event;
        const listeners = this.eventListeners.get(name) || [];
        
        for (const listener of listeners) {
            try {
                listener(data);
            } catch (error) {
                console.error(`Event listener error for ${name}:`, error);
            }
        }
    }
    
    /**
     * Add event listener
     */
    on(eventName, listener) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        this.eventListeners.get(eventName).push(listener);
        
        return () => this.off(eventName, listener);
    }
    
    /**
     * Remove event listener
     */
    off(eventName, listener) {
        const listeners = this.eventListeners.get(eventName) || [];
        const index = listeners.indexOf(listener);
        
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }
    
    /**
     * Emit event
     */
    emit(eventName, data) {
        this.eventQueue.push({ name: eventName, data });
    }
    
    /**
     * Schedule health check for service
     */
    scheduleHealthCheck(serviceName, delay = 60000) {
        setTimeout(() => {
            const healthChecker = this.healthCheckers.get(serviceName);
            if (healthChecker) {
                this.performServiceHealthCheck(serviceName, healthChecker);
            }
        }, delay);
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            version: this.version,
            initialized: this.services.size > 0,
            services: {
                total: this.services.size + this.factories.size,
                instances: this.services.size,
                factories: this.factories.size,
                singletons: this.singletons.size,
                discovered: this.discoveredServices.size
            },
            health: {
                totalCheckers: this.healthCheckers.size,
                lastChecks: this.performanceMetrics.lastHealthCheck.size
            },
            performance: {
                totalResolutions: this.performanceMetrics.totalResolutions,
                averageResolutionTime: this.performanceMetrics.averageResolutionTime,
                cacheHitRate: this.performanceMetrics.totalResolutions > 0 ?
                    (this.performanceMetrics.cachedResolutions / this.performanceMetrics.totalResolutions) * 100 : 0
            },
            integrations: Array.from(this.systemIntegrations),
            errors: this.lastErrors.length
        };
    }
}

/**
 * SERVICE LIFECYCLE MANAGER
 * Manages service lifecycles and state transitions
 */
class ServiceLifecycleManager {
    constructor(container) {
        this.container = container;
        this.lifecycles = new Map();
        this.stateTransitions = new Map();
        this.cleanupHandlers = new Map();
    }
    
    /**
     * Manage service lifecycle
     */
    manageLifecycle(serviceName, lifecycle) {
        this.lifecycles.set(serviceName, lifecycle);
        
        // Setup state transition handlers
        switch (lifecycle) {
            case this.container.LIFECYCLE_TYPES.SINGLETON:
                this.setupSingletonLifecycle(serviceName);
                break;
            case this.container.LIFECYCLE_TYPES.SCOPED:
                this.setupScopedLifecycle(serviceName);
                break;
            case this.container.LIFECYCLE_TYPES.TRANSIENT:
                this.setupTransientLifecycle(serviceName);
                break;
        }
    }
    
    /**
     * Setup singleton lifecycle
     */
    setupSingletonLifecycle(serviceName) {
        // Singletons are created once and cached
        this.cleanupHandlers.set(serviceName, () => {
            this.container.singletons.delete(serviceName);
        });
    }
    
    /**
     * Setup scoped lifecycle
     */
    setupScopedLifecycle(serviceName) {
        // Scoped services are managed by scope
        this.cleanupHandlers.set(serviceName, (scope) => {
            if (scope) {
                scope.dispose(serviceName);
            }
        });
    }
    
    /**
     * Setup transient lifecycle
     */
    setupTransientLifecycle(serviceName) {
        // Transient services are created new each time
        // No special cleanup needed
    }
}

/**
 * DEPENDENCY RESOLVER
 * Advanced dependency resolution with circular detection
 */
class DependencyResolver {
    constructor(container) {
        this.container = container;
        this.resolutionCache = new Map();
        this.resolutionPaths = new Map();
    }
    
    /**
     * Resolve dependency chain
     */
    async resolveDependencyChain(serviceName, visited = new Set()) {
        if (visited.has(serviceName)) {
            throw new Error(`Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${serviceName}`);
        }
        
        visited.add(serviceName);
        
        const definition = this.container.services.get(serviceName) || this.container.factories.get(serviceName);
        if (!definition) {
            throw new Error(`Service '${serviceName}' not found`);
        }
        
        const dependencies = {};
        
        for (const dep of definition.dependencies || []) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            const depAlias = typeof dep === 'object' ? dep.alias || depName : depName;
            
            dependencies[depAlias] = await this.resolveDependencyChain(depName, new Set(visited));
        }
        
        visited.delete(serviceName);
        
        return dependencies;
    }
}

/**
 * SERVICE PROXY FACTORY
 * Creates proxies for AOP and interceptor functionality
 */
class ServiceProxyFactory {
    constructor(container) {
        this.container = container;
        this.proxies = new Map();
    }
    
    /**
     * Create proxy for service
     */
    createProxy(serviceName, target, interceptors = []) {
        const proxy = new Proxy(target, {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);
                
                // Intercept method calls
                if (typeof value === 'function') {
                    return new Proxy(value, {
                        apply: async (target, thisArg, argumentsList) => {
                            // Apply pre-interceptors
                            for (const interceptor of interceptors) {
                                if (interceptor.before) {
                                    await interceptor.before(serviceName, prop, argumentsList);
                                }
                            }
                            
                            try {
                                const result = await Reflect.apply(target, thisArg, argumentsList);
                                
                                // Apply post-interceptors
                                for (const interceptor of interceptors) {
                                    if (interceptor.after) {
                                        await interceptor.after(serviceName, prop, argumentsList, result);
                                    }
                                }
                                
                                return result;
                            } catch (error) {
                                // Apply error interceptors
                                for (const interceptor of interceptors) {
                                    if (interceptor.error) {
                                        await interceptor.error(serviceName, prop, argumentsList, error);
                                    }
                                }
                                throw error;
                            }
                        }
                    });
                }
                
                return value;
            }
        });
        
        this.proxies.set(serviceName, proxy);
        return proxy;
    }
}

/**
 * CONFIGURATION MANAGER
 * Centralized configuration management with watchers and validation
 */
class ConfigurationManager {
    constructor(container) {
        this.container = container;
        this.sources = new Map();
        this.mergedConfig = new Map();
        this.validators = new Map();
        this.transformers = new Map();
    }
    
    /**
     * Add configuration source
     */
    addSource(name, source, priority = 100) {
        this.sources.set(name, { source, priority });
        this.rebuildConfiguration();
    }
    
    /**
     * Rebuild merged configuration
     */
    rebuildConfiguration() {
        // Sort sources by priority
        const sortedSources = Array.from(this.sources.entries())
            .sort((a, b) => a[1].priority - b[1].priority);
        
        // Merge configurations
        this.mergedConfig.clear();
        
        for (const [name, { source }] of sortedSources) {
            for (const [key, value] of Object.entries(source)) {
                this.mergedConfig.set(key, value);
            }
        }
    }
    
    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        return this.mergedConfig.get(key) || defaultValue;
    }
    
    /**
     * Validate configuration
     */
    validate(key, value) {
        const validator = this.validators.get(key);
        if (validator) {
            return validator(value);
        }
        return true;
    }
}

/**
 * HEALTH CHECKER
 * Comprehensive health monitoring for all services
 */
class HealthChecker {
    constructor(container) {
        this.container = container;
        this.healthStatus = new Map();
        this.checkInterval = 60000; // 1 minute
        this.checkTimeout = 5000; // 5 seconds
    }
    
    /**
     * Start health monitoring
     */
    startMonitoring() {
        setInterval(() => {
            this.checkAllServices();
        }, this.checkInterval);
    }
    
    /**
     * Check health of all services
     */
    async checkAllServices() {
        const promises = [];
        
        for (const [serviceName] of this.container.healthCheckers) {
            promises.push(this.checkServiceHealth(serviceName));
        }
        
        await Promise.allSettled(promises);
    }
    
    /**
     * Check health of specific service
     */
    async checkServiceHealth(serviceName) {
        const healthChecker = this.container.healthCheckers.get(serviceName);
        if (!healthChecker) {
            return;
        }
        
        try {
            const instance = await this.container.resolve(serviceName);
            const isHealthy = await Promise.race([
                healthChecker(instance),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Health check timeout')), this.checkTimeout)
                )
            ]);
            
            this.healthStatus.set(serviceName, {
                healthy: isHealthy,
                lastCheck: Date.now(),
                error: null
            });
            
        } catch (error) {
            this.healthStatus.set(serviceName, {
                healthy: false,
                lastCheck: Date.now(),
                error: error.message
            });
            
            this.container.emit('service:unhealthy', { serviceName, error });
        }
    }
    
    /**
     * Get health status
     */
    getHealthStatus(serviceName) {
        return this.healthStatus.get(serviceName) || {
            healthy: false,
            lastCheck: null,
            error: 'No health check performed'
        };
    }
}

/**
 * SERVICE SCOPE
 * Manages scoped service instances
 */
class ServiceScope {
    constructor(name, container) {
        this.name = name;
        this.container = container;
        this.scopedInstances = new Map();
        this.disposed = false;
    }
    
    /**
     * Get service within scope
     */
    async get(serviceName) {
        if (this.disposed) {
            throw new Error(`Scope '${this.name}' has been disposed`);
        }
        
        if (this.scopedInstances.has(serviceName)) {
            return this.scopedInstances.get(serviceName);
        }
        
        const instance = await this.container.resolve(serviceName);
        this.scopedInstances.set(serviceName, instance);
        
        return instance;
    }
    
    /**
     * Dispose scope and all scoped instances
     */
    async dispose() {
        if (this.disposed) {
            return;
        }
        
        const disposePromises = [];
        
        for (const [serviceName, instance] of this.scopedInstances) {
            if (instance && typeof instance.dispose === 'function') {
                disposePromises.push(instance.dispose());
            }
        }
        
        await Promise.allSettled(disposePromises);
        
        this.scopedInstances.clear();
        this.disposed = true;
        
        this.container.emit('scope:disposed', { scopeName: this.name });
    }
}

// Global DI Container instance
let diContainer;

// Initialize DI Container when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        diContainer = new DependencyInjectionContainer();
        window.diContainer = diContainer;
        window.DI = diContainer; // Short alias
        
        console.log('🚀 Enterprise DI Container ready for use');
        
        // Example usage demonstration
        setTimeout(() => {
            demonstrateUsage();
        }, 1000);
    });
} else {
    // Document already loaded
    diContainer = new DependencyInjectionContainer();
    window.diContainer = diContainer;
    window.DI = diContainer; // Short alias
    
    console.log('🚀 Enterprise DI Container ready for use');
    
    // Example usage demonstration
    setTimeout(() => {
        demonstrateUsage();
    }, 1000);
}

/**
 * USAGE DEMONSTRATION
 * Show how to use the DI container with existing systems
 */
async function demonstrateUsage() {
    console.log('\n📘 DI Container Usage Examples:');
    
    try {
        // Example 1: Resolve existing services
        console.log('\n1. Resolving existing services:');
        
        const securityManager = await diContainer.resolve('SecurityManager');
        console.log('✅ SecurityManager resolved:', !!securityManager);
        
        const xssProtection = await diContainer.resolve('XSSProtection');
        console.log('✅ XSSProtection resolved:', !!xssProtection);
        
        // Example 2: Register custom service
        console.log('\n2. Registering custom service:');
        
        class MyCustomService {
            constructor() {
                this.initialized = false;
            }
            
            async initialize() {
                this.initialized = true;
                console.log('MyCustomService initialized');
            }
            
            doSomething() {
                return 'Custom service result';
            }
        }
        
        diContainer.register('MyCustomService', new MyCustomService(), {
            lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
            dependencies: ['SecurityManager'],
            healthCheck: (instance) => instance.initialized
        });
        
        const customService = await diContainer.resolve('MyCustomService');
        console.log('✅ Custom service resolved:', customService.doSomething());
        
        // Example 3: Register factory
        console.log('\n3. Registering factory:');
        
        diContainer.registerFactory('DataProcessor', (deps, config) => {
            return {
                process: (data) => {
                    console.log('Processing data with config:', config);
                    return `Processed: ${data}`;
                }
            };
        }, {
            lifecycle: diContainer.LIFECYCLE_TYPES.TRANSIENT,
            configuration: {
                processingMode: 'advanced',
                timeout: 5000
            }
        });
        
        const dataProcessor = await diContainer.resolve('DataProcessor');
        console.log('✅ Factory-created service result:', dataProcessor.process('test data'));
        
        // Example 4: Configuration management
        console.log('\n4. Configuration management:');
        
        diContainer.registerConfiguration('app', {
            version: '1.0.0',
            environment: diContainer.getEnvironment(),
            features: {
                advancedLogging: true,
                performanceMonitoring: true
            }
        });
        
        const config = diContainer.getConfiguration('app');
        console.log('✅ Configuration loaded:', config);
        
        // Example 5: Show system status
        console.log('\n5. System status:');
        const status = diContainer.getStatus();
        console.log('✅ DI Container Status:', status);
        
        console.log('\n📘 DI Container demonstration complete!');
        
    } catch (error) {
        console.error('❌ Demo error:', error);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DependencyInjectionContainer,
        ServiceLifecycleManager,
        DependencyResolver,
        ServiceProxyFactory,
        ConfigurationManager,
        HealthChecker,
        ServiceScope
    };
}

console.log('🏗️ Enterprise Dependency Injection Container loaded - Ready for microservices architecture');
