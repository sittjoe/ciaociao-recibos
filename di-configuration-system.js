/**
 * DI CONFIGURATION SYSTEM - Enterprise Configuration Management
 * Sistema centralizado de configuración para todos los servicios
 * 
 * CARACTERÍSTICAS:
 * - Configuration providers múltiples (localStorage, environment, remote)
 * - Hot-reload de configuraciones
 * - Validación y transformación de configuraciones
 * - Configuración jerárquica con herencia
 * - Encriptación de configuraciones sensibles
 * - Configuración por ambiente (dev, staging, production)
 * - Watchers para cambios en configuración
 * - Backup y recovery de configuraciones
 */

/**
 * CONFIGURATION PROVIDER BASE CLASS
 */
class ConfigurationProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.priority = config.priority || 100;
        this.enabled = config.enabled !== false;
        this.readonly = config.readonly === true;
        this.encrypted = config.encrypted === true;
        this.watchers = [];
        this.lastUpdate = Date.now();
    }
    
    async load() {
        throw new Error('load() method must be implemented by subclass');
    }
    
    async save(configuration) {
        if (this.readonly) {
            throw new Error(`Configuration provider ${this.name} is readonly`);
        }
        throw new Error('save() method must be implemented by subclass');
    }
    
    async watch(callback) {
        this.watchers.push(callback);
        return () => {
            const index = this.watchers.indexOf(callback);
            if (index > -1) {
                this.watchers.splice(index, 1);
            }
        };
    }
    
    notifyWatchers(configuration, previousConfiguration) {
        this.watchers.forEach(watcher => {
            try {
                watcher(configuration, previousConfiguration, this.name);
            } catch (error) {
                console.error(`Configuration watcher error in ${this.name}:`, error);
            }
        });
    }
    
    isEnabled() {
        return this.enabled;
    }
    
    getPriority() {
        return this.priority;
    }
}

/**
 * LOCAL STORAGE CONFIGURATION PROVIDER
 */
class LocalStorageConfigurationProvider extends ConfigurationProvider {
    constructor(config = {}) {
        super('localStorage', config);
        this.keyPrefix = config.keyPrefix || 'ciaociao_config_';
        this.namespace = config.namespace || 'default';
    }
    
    async load() {
        try {
            const key = `${this.keyPrefix}${this.namespace}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) {
                return {};
            }
            
            let configuration = JSON.parse(stored);
            
            // Decrypt if needed
            if (this.encrypted && window.securityManager) {
                try {
                    configuration = await window.securityManager.decryptData(configuration);
                    configuration = JSON.parse(configuration);
                } catch (error) {
                    console.error('Failed to decrypt configuration:', error);
                    return {};
                }
            }
            
            return configuration;
            
        } catch (error) {
            console.error(`Failed to load configuration from localStorage:`, error);
            return {};
        }
    }
    
    async save(configuration) {
        if (this.readonly) {
            throw new Error('LocalStorage provider is readonly');
        }
        
        try {
            const key = `${this.keyPrefix}${this.namespace}`;
            let dataToStore = configuration;
            
            // Encrypt if needed
            if (this.encrypted && window.securityManager) {
                try {
                    dataToStore = await window.securityManager.encryptData(JSON.stringify(configuration));
                } catch (error) {
                    console.error('Failed to encrypt configuration:', error);
                    throw error;
                }
            }
            
            localStorage.setItem(key, JSON.stringify(dataToStore));
            this.lastUpdate = Date.now();
            
            return true;
            
        } catch (error) {
            console.error(`Failed to save configuration to localStorage:`, error);
            throw error;
        }
    }
    
    async clear() {
        const key = `${this.keyPrefix}${this.namespace}`;
        localStorage.removeItem(key);
    }
}

/**
 * ENVIRONMENT CONFIGURATION PROVIDER
 */
class EnvironmentConfigurationProvider extends ConfigurationProvider {
    constructor(config = {}) {
        super('environment', { readonly: true, ...config });
        this.environment = this.detectEnvironment();
    }
    
    detectEnvironment() {
        if (typeof window !== 'undefined' && window.location) {
            const hostname = window.location.hostname;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
                return 'development';
            } else if (hostname.includes('test') || hostname.includes('staging') || hostname.includes('dev')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        return 'production';
    }
    
    async load() {
        // Base environment configuration
        const baseConfig = {
            environment: this.environment,
            timestamp: new Date().toISOString(),
            
            // Security settings by environment
            security: {
                strictMode: this.environment === 'production',
                debugMode: this.environment === 'development',
                logging: {
                    level: this.environment === 'development' ? 'debug' : 'info',
                    console: this.environment !== 'production'
                }
            },
            
            // Performance settings
            performance: {
                monitoring: this.environment === 'production',
                caching: {
                    enabled: true,
                    ttl: this.environment === 'development' ? 60000 : 300000
                }
            },
            
            // Feature flags by environment
            features: {
                advancedLogging: this.environment === 'development',
                performanceMetrics: this.environment !== 'development',
                errorReporting: this.environment === 'production',
                debugTools: this.environment === 'development'
            }
        };
        
        // Environment-specific overrides
        if (this.environment === 'development') {
            baseConfig.development = {
                hotReload: true,
                mockServices: false,
                verboseLogging: true,
                skipValidation: false
            };
        } else if (this.environment === 'staging') {
            baseConfig.staging = {
                loadTesting: true,
                performanceMonitoring: true,
                errorSimulation: false
            };
        } else if (this.environment === 'production') {
            baseConfig.production = {
                optimization: true,
                minifiedLogging: true,
                errorReporting: true,
                analytics: true
            };
        }
        
        return baseConfig;
    }
}

/**
 * DEFAULT CONFIGURATION PROVIDER
 */
class DefaultConfigurationProvider extends ConfigurationProvider {
    constructor(config = {}) {
        super('default', { readonly: true, priority: 1000, ...config });
    }
    
    async load() {
        return {
            // Core system configuration
            system: {
                name: 'ciaociao-recibos',
                version: '1.0.0',
                initialized: Date.now()
            },
            
            // DI Container settings
            di: {
                autoDiscovery: true,
                performanceMonitoring: true,
                healthChecking: true,
                interceptors: {
                    logging: { enabled: true, level: 'info' },
                    performance: { enabled: true, threshold: 100 },
                    security: { enabled: true, strict: false },
                    retry: { enabled: true, maxRetries: 3 }
                }
            },
            
            // Service configurations
            services: {
                SecurityManager: {
                    enabled: true,
                    priority: 1,
                    config: {
                        saltRounds: 12,
                        sessionDuration: 8 * 60 * 60 * 1000,
                        encryptionEnabled: true
                    }
                },
                
                XSSProtection: {
                    enabled: true,
                    priority: 2,
                    config: {
                        strictMode: true,
                        logging: true,
                        performanceThreshold: 5
                    }
                },
                
                BackupManager: {
                    enabled: true,
                    priority: 10,
                    config: {
                        maxBackups: 50,
                        fullBackupInterval: 24 * 60 * 60 * 1000,
                        compressionLevel: 6
                    }
                },
                
                CDNCircuitBreaker: {
                    enabled: true,
                    priority: 5,
                    config: {
                        failureThreshold: 5,
                        recoveryTimeout: 30000,
                        enableMetrics: true
                    }
                }
            },
            
            // Database settings
            database: {
                transactionTimeout: 30000,
                retryAttempts: 3,
                batchSize: 100
            },
            
            // Cache settings
            cache: {
                defaultTTL: 300000, // 5 minutes
                maxSize: 100 * 1024 * 1024, // 100MB
                compression: true
            },
            
            // API settings
            api: {
                timeout: 15000,
                retries: 3,
                rateLimiting: {
                    enabled: true,
                    maxRequests: 100,
                    windowMs: 60000
                }
            },
            
            // UI settings
            ui: {
                theme: 'modern',
                animations: true,
                notifications: {
                    enabled: true,
                    position: 'top-right',
                    duration: 5000
                }
            }
        };
    }
}

/**
 * REMOTE CONFIGURATION PROVIDER
 */
class RemoteConfigurationProvider extends ConfigurationProvider {
    constructor(config = {}) {
        super('remote', config);
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.refreshInterval = config.refreshInterval || 5 * 60 * 1000; // 5 minutes
        this.lastFetch = 0;
        this.cached = null;
        
        if (config.autoRefresh !== false) {
            this.startAutoRefresh();
        }
    }
    
    async load() {
        if (!this.endpoint) {
            return {};
        }
        
        const now = Date.now();
        
        // Use cached version if fresh enough
        if (this.cached && (now - this.lastFetch) < this.refreshInterval) {
            return this.cached;
        }
        
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            
            const response = await fetch(this.endpoint, {
                method: 'GET',
                headers,
                timeout: 10000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const configuration = await response.json();
            
            this.cached = configuration;
            this.lastFetch = now;
            
            console.log('✅ Remote configuration loaded successfully');
            
            return configuration;
            
        } catch (error) {
            console.error('Failed to load remote configuration:', error);
            
            // Return cached version if available
            if (this.cached) {
                console.log('⚠️ Using cached remote configuration');
                return this.cached;
            }
            
            return {};
        }
    }
    
    startAutoRefresh() {
        setInterval(async () => {
            const previousConfig = this.cached;
            const newConfig = await this.load();
            
            if (JSON.stringify(previousConfig) !== JSON.stringify(newConfig)) {
                this.notifyWatchers(newConfig, previousConfig);
            }
        }, this.refreshInterval);
    }
}

/**
 * MAIN CONFIGURATION MANAGER
 */
class ConfigurationSystem {
    constructor() {
        this.providers = new Map();
        this.configurations = new Map();
        this.watchers = new Map();
        this.validators = new Map();
        this.transformers = new Map();
        this.cache = new Map();
        this.initialized = false;
        
        // Default providers
        this.setupDefaultProviders();
        
        // Initialize
        this.initialize();
    }
    
    setupDefaultProviders() {
        // Default configuration (highest priority for defaults)
        this.addProvider(new DefaultConfigurationProvider());
        
        // Environment-based configuration
        this.addProvider(new EnvironmentConfigurationProvider({ priority: 50 }));
        
        // Local storage configuration (lowest priority for overrides)
        this.addProvider(new LocalStorageConfigurationProvider({ priority: 10 }));
    }
    
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        console.log('⚙️ Initializing Configuration System...');
        
        try {
            // Load configurations from all providers
            await this.loadAllConfigurations();
            
            // Start configuration monitoring
            this.startMonitoring();
            
            this.initialized = true;
            
            console.log('✅ Configuration System initialized successfully');
            
        } catch (error) {
            console.error('❌ Configuration System initialization failed:', error);
            throw error;
        }
    }
    
    async loadAllConfigurations() {
        // Sort providers by priority (higher priority = higher number = loaded last = overrides others)
        const sortedProviders = Array.from(this.providers.values())
            .filter(provider => provider.isEnabled())
            .sort((a, b) => a.getPriority() - b.getPriority());
        
        // Merged configuration
        let mergedConfig = {};
        
        // Load from each provider and merge
        for (const provider of sortedProviders) {
            try {
                const config = await provider.load();
                mergedConfig = this.deepMerge(mergedConfig, config);
                
                console.log(`✅ Loaded configuration from: ${provider.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to load configuration from ${provider.name}:`, error);
            }
        }
        
        // Validate and transform
        mergedConfig = this.validateAndTransform(mergedConfig);
        
        // Cache the merged configuration
        this.cache.set('merged', mergedConfig);
        
        // Notify watchers if configuration changed
        const previous = this.configurations.get('merged');
        if (JSON.stringify(previous) !== JSON.stringify(mergedConfig)) {
            this.configurations.set('merged', mergedConfig);
            this.notifyWatchers('merged', mergedConfig, previous);
        }
    }
    
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    validateAndTransform(configuration) {
        let result = { ...configuration };
        
        // Apply validators
        for (const [path, validator] of this.validators) {
            try {
                const value = this.getNestedValue(result, path);
                if (value !== undefined) {
                    const isValid = validator(value);
                    if (!isValid) {
                        console.warn(`⚠️ Configuration validation failed for ${path}`);
                        // Remove invalid value
                        this.setNestedValue(result, path, undefined);
                    }
                }
            } catch (error) {
                console.error(`Validation error for ${path}:`, error);
            }
        }
        
        // Apply transformers
        for (const [path, transformer] of this.transformers) {
            try {
                const value = this.getNestedValue(result, path);
                if (value !== undefined) {
                    const transformed = transformer(value);
                    this.setNestedValue(result, path, transformed);
                }
            } catch (error) {
                console.error(`Transformation error for ${path}:`, error);
            }
        }
        
        return result;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : undefined, obj
        );
    }
    
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        if (value === undefined) {
            delete target[lastKey];
        } else {
            target[lastKey] = value;
        }
    }
    
    startMonitoring() {
        // Monitor configuration changes every minute
        setInterval(async () => {
            await this.loadAllConfigurations();
        }, 60 * 1000);
    }
    
    /**
     * PUBLIC API METHODS
     */
    
    /**
     * Add configuration provider
     */
    addProvider(provider) {
        if (!(provider instanceof ConfigurationProvider)) {
            throw new Error('Provider must extend ConfigurationProvider');
        }
        
        this.providers.set(provider.name, provider);
        
        // Reload configurations if already initialized
        if (this.initialized) {
            this.loadAllConfigurations();
        }
        
        return this;
    }
    
    /**
     * Remove configuration provider
     */
    removeProvider(name) {
        const removed = this.providers.delete(name);
        
        if (removed && this.initialized) {
            this.loadAllConfigurations();
        }
        
        return removed;
    }
    
    /**
     * Get configuration value
     */
    get(path, defaultValue = null) {
        const mergedConfig = this.cache.get('merged') || {};
        const value = this.getNestedValue(mergedConfig, path);
        return value !== undefined ? value : defaultValue;
    }
    
    /**
     * Set configuration value
     */
    async set(path, value, providerName = 'localStorage') {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Configuration provider ${providerName} not found`);
        }
        
        if (provider.readonly) {
            throw new Error(`Configuration provider ${providerName} is readonly`);
        }
        
        // Load current configuration from provider
        let currentConfig = await provider.load();
        
        // Set the new value
        this.setNestedValue(currentConfig, path, value);
        
        // Save back to provider
        await provider.save(currentConfig);
        
        // Reload all configurations
        await this.loadAllConfigurations();
        
        return this;
    }
    
    /**
     * Watch for configuration changes
     */
    watch(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }
        
        this.watchers.get(path).push(callback);
        
        // Return unwatch function
        return () => {
            const callbacks = this.watchers.get(path) || [];
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Add validator for configuration path
     */
    addValidator(path, validator) {
        this.validators.set(path, validator);
        return this;
    }
    
    /**
     * Add transformer for configuration path
     */
    addTransformer(path, transformer) {
        this.transformers.set(path, transformer);
        return this;
    }
    
    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.cache.get('merged') };
    }
    
    /**
     * Get configuration for specific service
     */
    getServiceConfig(serviceName) {
        const serviceConfig = this.get(`services.${serviceName}`, {});
        const globalConfig = this.get('global', {});
        
        return this.deepMerge(globalConfig, serviceConfig);
    }
    
    /**
     * Export configuration
     */
    export() {
        return {
            timestamp: new Date().toISOString(),
            providers: Array.from(this.providers.keys()),
            configuration: this.getAll()
        };
    }
    
    /**
     * Import configuration
     */
    async import(data, providerName = 'localStorage') {
        if (!data.configuration) {
            throw new Error('Invalid configuration data');
        }
        
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Configuration provider ${providerName} not found`);
        }
        
        await provider.save(data.configuration);
        await this.loadAllConfigurations();
        
        return this;
    }
    
    /**
     * Backup current configuration
     */
    async backup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `ciaociao_config_backup_${timestamp}`;
        
        const backup = {
            timestamp: new Date().toISOString(),
            configuration: this.getAll(),
            providers: Array.from(this.providers.keys())
        };
        
        try {
            localStorage.setItem(backupKey, JSON.stringify(backup));
            console.log(`💾 Configuration backed up to: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error('Failed to backup configuration:', error);
            throw error;
        }
    }
    
    /**
     * Restore configuration from backup
     */
    async restore(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error(`Backup ${backupKey} not found`);
            }
            
            const backup = JSON.parse(backupData);
            await this.import(backup);
            
            console.log(`🔄 Configuration restored from: ${backupKey}`);
            
        } catch (error) {
            console.error('Failed to restore configuration:', error);
            throw error;
        }
    }
    
    /**
     * List available backups
     */
    listBackups() {
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ciaociao_config_backup_')) {
                try {
                    const backup = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        timestamp: backup.timestamp,
                        providers: backup.providers
                    });
                } catch (error) {
                    // Invalid backup, skip
                }
            }
        }
        
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            providers: {
                total: this.providers.size,
                enabled: Array.from(this.providers.values()).filter(p => p.isEnabled()).length,
                list: Array.from(this.providers.keys())
            },
            watchers: this.watchers.size,
            validators: this.validators.size,
            transformers: this.transformers.size,
            lastUpdate: this.cache.get('merged_timestamp') || 'never'
        };
    }
    
    /**
     * Notify watchers of configuration changes
     */
    notifyWatchers(path, newValue, oldValue) {
        // Notify specific path watchers
        const pathWatchers = this.watchers.get(path) || [];
        pathWatchers.forEach(callback => {
            try {
                callback(newValue, oldValue, path);
            } catch (error) {
                console.error(`Configuration watcher error for ${path}:`, error);
            }
        });
        
        // Notify wildcard watchers
        const wildcardWatchers = this.watchers.get('*') || [];
        wildcardWatchers.forEach(callback => {
            try {
                callback(newValue, oldValue, path);
            } catch (error) {
                console.error('Configuration wildcard watcher error:', error);
            }
        });
    }
}

// Global configuration system instance
let configurationSystem;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        configurationSystem = new ConfigurationSystem();
        window.configurationSystem = configurationSystem;
        window.Config = configurationSystem; // Short alias
        
        // Register with DI container if available
        if (window.diContainer) {
            window.diContainer.register('ConfigurationSystem', configurationSystem, {
                lifecycle: window.diContainer.LIFECYCLE_TYPES.SINGLETON,
                priority: 1
            });
        }
        
        console.log('⚙️ Configuration System ready');
    });
} else {
    // Document already loaded
    configurationSystem = new ConfigurationSystem();
    window.configurationSystem = configurationSystem;
    window.Config = configurationSystem; // Short alias
    
    // Register with DI container if available
    setTimeout(() => {
        if (window.diContainer) {
            window.diContainer.register('ConfigurationSystem', configurationSystem, {
                lifecycle: window.diContainer.LIFECYCLE_TYPES.SINGLETON,
                priority: 1
            });
        }
    }, 100);
    
    console.log('⚙️ Configuration System ready');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ConfigurationSystem,
        ConfigurationProvider,
        LocalStorageConfigurationProvider,
        EnvironmentConfigurationProvider,
        DefaultConfigurationProvider,
        RemoteConfigurationProvider
    };
}

console.log('⚙️ DI Configuration System loaded - Centralized configuration management ready');
