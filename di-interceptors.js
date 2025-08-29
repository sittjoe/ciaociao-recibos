/**
 * DI INTERCEPTORS - Advanced Aspect-Oriented Programming (AOP) System
 * Enterprise interceptors for cross-cutting concerns
 * 
 * INTERCEPTORS DISPONIBLES:
 * - LoggingInterceptor: Logging automático de métodos
 * - PerformanceInterceptor: Monitoreo de rendimiento
 * - SecurityInterceptor: Validación de seguridad
 * - CachingInterceptor: Cache automático de resultados
 * - RetryInterceptor: Reintentos automáticos
 * - ValidationInterceptor: Validación de parámetros
 * - MetricsInterceptor: Recolección de métricas
 * - ErrorHandlingInterceptor: Manejo centralizado de errores
 */

/**
 * BASE INTERCEPTOR CLASS
 * Clase base para todos los interceptors
 */
class BaseInterceptor {
    constructor(config = {}) {
        this.config = {
            enabled: true,
            priority: 100,
            ...config
        };
        this.metrics = {
            invocations: 0,
            successCount: 0,
            errorCount: 0,
            totalTime: 0
        };
    }
    
    async intercept(target, serviceName, context) {
        if (!this.config.enabled) {
            return target;
        }
        
        return new Proxy(target, {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);
                
                if (typeof value === 'function' && this.shouldIntercept(prop, serviceName)) {
                    return this.createInterceptedMethod(value, prop, serviceName, target);
                }
                
                return value;
            }
        });
    }
    
    shouldIntercept(methodName, serviceName) {
        // Skip private methods and common framework methods
        if (methodName.startsWith('_') || 
            ['constructor', 'toString', 'valueOf'].includes(methodName)) {
            return false;
        }
        
        // Check method whitelist/blacklist
        if (this.config.methods) {
            if (this.config.methods.include) {
                return this.config.methods.include.includes(methodName);
            }
            if (this.config.methods.exclude) {
                return !this.config.methods.exclude.includes(methodName);
            }
        }
        
        // Check service whitelist/blacklist
        if (this.config.services) {
            if (this.config.services.include) {
                return this.config.services.include.includes(serviceName);
            }
            if (this.config.services.exclude) {
                return !this.config.services.exclude.includes(serviceName);
            }
        }
        
        return true;
    }
    
    createInterceptedMethod(originalMethod, methodName, serviceName, target) {
        return async (...args) => {
            const startTime = performance.now();
            this.metrics.invocations++;
            
            const context = {
                serviceName,
                methodName,
                args,
                startTime,
                interceptor: this.constructor.name
            };
            
            try {
                await this.before?.(context);
                
                const result = await originalMethod.apply(target, args);
                
                context.result = result;
                context.duration = performance.now() - startTime;
                this.metrics.totalTime += context.duration;
                this.metrics.successCount++;
                
                await this.after?.(context);
                
                return result;
                
            } catch (error) {
                context.error = error;
                context.duration = performance.now() - startTime;
                this.metrics.totalTime += context.duration;
                this.metrics.errorCount++;
                
                await this.onError?.(context);
                
                throw error;
            }
        };
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            averageTime: this.metrics.invocations > 0 ? 
                this.metrics.totalTime / this.metrics.invocations : 0,
            successRate: this.metrics.invocations > 0 ? 
                this.metrics.successCount / this.metrics.invocations : 0
        };
    }
}

/**
 * LOGGING INTERCEPTOR
 * Proporciona logging automático para métodos de servicios
 */
class LoggingInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            logLevel: 'info',
            logArgs: false,
            logResults: false,
            logErrors: true,
            logPerformance: true,
            ...config
        });
        this.logger = console; // Could be replaced with proper logger
    }
    
    async before(context) {
        if (this.config.logLevel === 'debug' || this.config.logArgs) {
            this.logger.log(`🔍 [${context.serviceName}] Calling ${context.methodName}`, 
                this.config.logArgs ? context.args : '(args hidden)');
        }
    }
    
    async after(context) {
        const level = this.config.logLevel;
        
        if (level === 'debug' || level === 'info') {
            let message = `✅ [${context.serviceName}] ${context.methodName} completed`;
            
            if (this.config.logPerformance) {
                message += ` (${context.duration.toFixed(2)}ms)`;
            }
            
            this.logger.log(message, 
                this.config.logResults ? context.result : '(result hidden)');
        }
    }
    
    async onError(context) {
        if (this.config.logErrors) {
            this.logger.error(`❌ [${context.serviceName}] ${context.methodName} failed:`, 
                context.error.message);
        }
    }
}

/**
 * PERFORMANCE INTERCEPTOR
 * Monitorea rendimiento y detecta métodos lentos
 */
class PerformanceInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            slowThreshold: 100, // ms
            verySlowThreshold: 1000, // ms
            trackHistory: true,
            historySize: 50,
            alertOnSlow: true,
            ...config
        });
        
        this.performanceHistory = new Map();
        this.slowMethods = new Set();
    }
    
    async after(context) {
        const { serviceName, methodName, duration } = context;
        const key = `${serviceName}.${methodName}`;
        
        // Track performance history
        if (this.config.trackHistory) {
            if (!this.performanceHistory.has(key)) {
                this.performanceHistory.set(key, []);
            }
            
            const history = this.performanceHistory.get(key);
            history.push(duration);
            
            if (history.length > this.config.historySize) {
                history.shift();
            }
        }
        
        // Check for slow methods
        if (duration > this.config.verySlowThreshold) {
            this.slowMethods.add(key);
            
            if (this.config.alertOnSlow) {
                console.warn(`🐌 VERY SLOW METHOD: ${key} took ${duration.toFixed(2)}ms`);
            }
        } else if (duration > this.config.slowThreshold) {
            if (this.config.alertOnSlow) {
                console.warn(`⏳ Slow method: ${key} took ${duration.toFixed(2)}ms`);
            }
        }
    }
    
    getPerformanceReport() {
        const report = {
            slowMethods: Array.from(this.slowMethods),
            methodStats: {}
        };
        
        for (const [method, history] of this.performanceHistory) {
            const avg = history.reduce((sum, time) => sum + time, 0) / history.length;
            const min = Math.min(...history);
            const max = Math.max(...history);
            
            // Calculate percentiles
            const sorted = [...history].sort((a, b) => a - b);
            const p95Index = Math.floor(sorted.length * 0.95);
            const p99Index = Math.floor(sorted.length * 0.99);
            
            report.methodStats[method] = {
                average: avg,
                min,
                max,
                p95: sorted[p95Index] || max,
                p99: sorted[p99Index] || max,
                samples: history.length
            };
        }
        
        return report;
    }
}

/**
 * SECURITY INTERCEPTOR
 * Validación de seguridad y autorización
 */
class SecurityInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            checkAuthentication: true,
            checkAuthorization: true,
            logSecurityEvents: true,
            blockOnFailure: true,
            ...config
        });
        
        this.securityEvents = [];
        this.blockedAttempts = 0;
    }
    
    async before(context) {
        const { serviceName, methodName, args } = context;
        
        // Check authentication
        if (this.config.checkAuthentication && !this.isAuthenticated(context)) {
            const event = {
                type: 'AUTHENTICATION_FAILED',
                service: serviceName,
                method: methodName,
                timestamp: new Date().toISOString()
            };
            
            this.logSecurityEvent(event);
            
            if (this.config.blockOnFailure) {
                this.blockedAttempts++;
                throw new Error('Authentication required');
            }
        }
        
        // Check authorization
        if (this.config.checkAuthorization && !this.isAuthorized(context)) {
            const event = {
                type: 'AUTHORIZATION_FAILED',
                service: serviceName,
                method: methodName,
                timestamp: new Date().toISOString()
            };
            
            this.logSecurityEvent(event);
            
            if (this.config.blockOnFailure) {
                this.blockedAttempts++;
                throw new Error('Insufficient permissions');
            }
        }
        
        // Validate arguments for security
        this.validateArguments(args, context);
    }
    
    isAuthenticated(context) {
        // Check if user is authenticated
        // Integration with SecurityManager
        if (window.securityManager) {
            try {
                const session = localStorage.getItem('ciaociao_secure_session');
                return !!session;
            } catch (error) {
                return false;
            }
        }
        return true; // Default to authenticated if no security manager
    }
    
    isAuthorized(context) {
        // Check if user is authorized for this operation
        // Could integrate with role-based access control
        return true; // Default implementation
    }
    
    validateArguments(args, context) {
        // Validate arguments for XSS, SQL injection, etc.
        if (window.xssProtection && window.xssProtection.isReady()) {
            for (const arg of args) {
                if (typeof arg === 'string') {
                    const sanitized = window.xssProtection.sanitizeText(arg);
                    if (sanitized !== arg) {
                        this.logSecurityEvent({
                            type: 'XSS_ATTEMPT_BLOCKED',
                            service: context.serviceName,
                            method: context.methodName,
                            originalValue: arg,
                            sanitizedValue: sanitized,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }
    }
    
    logSecurityEvent(event) {
        this.securityEvents.push(event);
        
        // Keep only last 1000 events
        if (this.securityEvents.length > 1000) {
            this.securityEvents.shift();
        }
        
        if (this.config.logSecurityEvents) {
            console.warn('🔒 Security Event:', event);
        }
        
        // Report to SecurityManager if available
        if (window.securityManager && window.securityManager.reportSecurityEvent) {
            window.securityManager.reportSecurityEvent(event);
        }
    }
    
    getSecurityReport() {
        return {
            totalEvents: this.securityEvents.length,
            blockedAttempts: this.blockedAttempts,
            recentEvents: this.securityEvents.slice(-10),
            eventTypes: this.getEventTypeCounts()
        };
    }
    
    getEventTypeCounts() {
        const counts = {};
        for (const event of this.securityEvents) {
            counts[event.type] = (counts[event.type] || 0) + 1;
        }
        return counts;
    }
}

/**
 * CACHING INTERCEPTOR
 * Cache automático de resultados de métodos
 */
class CachingInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            ttl: 5 * 60 * 1000, // 5 minutes default
            maxSize: 1000,
            keyGenerator: null, // Custom key generator function
            excludeMethods: ['dispose', 'initialize'],
            ...config
        });
        
        this.cache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
    
    async before(context) {
        const { serviceName, methodName, args } = context;
        
        if (this.config.excludeMethods.includes(methodName)) {
            return;
        }
        
        const cacheKey = this.generateCacheKey(serviceName, methodName, args);
        const cached = this.cache.get(cacheKey);
        
        if (cached && !this.isExpired(cached)) {
            this.cacheHits++;
            context.cacheHit = true;
            context.cachedResult = cached.value;
            
            // Skip method execution
            throw new CacheHitException(cached.value);
        } else {
            this.cacheMisses++;
            context.cacheKey = cacheKey;
        }
    }
    
    async after(context) {
        if (context.cacheKey && !context.cacheHit) {
            // Ensure cache size limit
            if (this.cache.size >= this.config.maxSize) {
                this.evictOldest();
            }
            
            // Cache the result
            this.cache.set(context.cacheKey, {
                value: context.result,
                timestamp: Date.now(),
                accessCount: 0
            });
        }
    }
    
    createInterceptedMethod(originalMethod, methodName, serviceName, target) {
        return async (...args) => {
            const context = {
                serviceName,
                methodName,
                args
            };
            
            try {
                await this.before(context);
                
                const result = await originalMethod.apply(target, args);
                
                context.result = result;
                await this.after(context);
                
                return result;
                
            } catch (error) {
                if (error instanceof CacheHitException) {
                    return error.value;
                }
                throw error;
            }
        };
    }
    
    generateCacheKey(serviceName, methodName, args) {
        if (this.config.keyGenerator) {
            return this.config.keyGenerator(serviceName, methodName, args);
        }
        
        // Default key generation
        const argsStr = JSON.stringify(args);
        return `${serviceName}.${methodName}:${this.hashCode(argsStr)}`;
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    isExpired(cached) {
        return Date.now() - cached.timestamp > this.config.ttl;
    }
    
    evictOldest() {
        let oldest = null;
        let oldestTime = Date.now();
        
        for (const [key, cached] of this.cache) {
            if (cached.timestamp < oldestTime) {
                oldest = key;
                oldestTime = cached.timestamp;
            }
        }
        
        if (oldest) {
            this.cache.delete(oldest);
        }
    }
    
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: this.cacheHits + this.cacheMisses > 0 ? 
                this.cacheHits / (this.cacheHits + this.cacheMisses) : 0
        };
    }
    
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Method cache cleared');
    }
}

/**
 * RETRY INTERCEPTOR
 * Reintentos automáticos con backoff exponencial
 */
class RetryInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            maxRetries: 3,
            baseDelay: 1000, // ms
            maxDelay: 10000, // ms
            exponentialBase: 2,
            jitter: true,
            retryCondition: (error) => true, // Retry all errors by default
            ...config
        });
        
        this.retryAttempts = new Map();
    }
    
    createInterceptedMethod(originalMethod, methodName, serviceName, target) {
        return async (...args) => {
            const key = `${serviceName}.${methodName}`;
            let lastError;
            
            for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const result = await originalMethod.apply(target, args);
                    
                    // Success - reset retry count
                    this.retryAttempts.delete(key);
                    
                    if (attempt > 0) {
                        console.log(`✅ ${key} succeeded after ${attempt} retries`);
                    }
                    
                    return result;
                    
                } catch (error) {
                    lastError = error;
                    
                    // Check if we should retry this error
                    if (!this.config.retryCondition(error) || attempt >= this.config.maxRetries) {
                        break;
                    }
                    
                    // Calculate delay with exponential backoff
                    const delay = this.calculateDelay(attempt);
                    
                    console.warn(`🔄 ${key} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), retrying in ${delay}ms:`, error.message);
                    
                    // Track retry attempts
                    const currentAttempts = this.retryAttempts.get(key) || 0;
                    this.retryAttempts.set(key, currentAttempts + 1);
                    
                    await this.sleep(delay);
                }
            }
            
            console.error(`❌ ${key} failed after ${this.config.maxRetries + 1} attempts`);
            throw lastError;
        };
    }
    
    calculateDelay(attempt) {
        let delay = this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt);
        
        // Apply maximum delay limit
        delay = Math.min(delay, this.config.maxDelay);
        
        // Add jitter to prevent thundering herd
        if (this.config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        return Math.floor(delay);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getRetryStats() {
        return {
            totalRetries: Array.from(this.retryAttempts.values())
                .reduce((sum, attempts) => sum + attempts, 0),
            methodsWithRetries: this.retryAttempts.size,
            retrysByMethod: Object.fromEntries(this.retryAttempts)
        };
    }
}

/**
 * VALIDATION INTERCEPTOR
 * Validación automática de parámetros
 */
class ValidationInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            schemas: new Map(), // Method validation schemas
            throwOnValidationError: true,
            logValidationErrors: true,
            ...config
        });
        
        this.validationErrors = [];
    }
    
    async before(context) {
        const { serviceName, methodName, args } = context;
        const schemaKey = `${serviceName}.${methodName}`;
        const schema = this.config.schemas.get(schemaKey);
        
        if (schema) {
            const validation = this.validateArguments(args, schema);
            
            if (!validation.valid) {
                const error = {
                    service: serviceName,
                    method: methodName,
                    errors: validation.errors,
                    timestamp: new Date().toISOString()
                };
                
                this.validationErrors.push(error);
                
                if (this.config.logValidationErrors) {
                    console.error('📋 Validation Error:', error);
                }
                
                if (this.config.throwOnValidationError) {
                    throw new ValidationError(`Validation failed for ${schemaKey}`, validation.errors);
                }
            }
        }
    }
    
    validateArguments(args, schema) {
        const errors = [];
        
        if (schema.length !== undefined) {
            // Array-based schema (by position)
            for (let i = 0; i < schema.length; i++) {
                const argSchema = schema[i];
                const arg = args[i];
                
                const result = this.validateSingle(arg, argSchema, `arg[${i}]`);
                if (!result.valid) {
                    errors.push(...result.errors);
                }
            }
        } else {
            // Object-based schema (by name)
            for (const [name, argSchema] of Object.entries(schema)) {
                const argIndex = parseInt(name, 10);
                const arg = isNaN(argIndex) ? args.find(a => a && a[name] !== undefined)?.[name] : args[argIndex];
                
                const result = this.validateSingle(arg, argSchema, name);
                if (!result.valid) {
                    errors.push(...result.errors);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    validateSingle(value, schema, path) {
        const errors = [];
        
        // Required check
        if (schema.required && (value === undefined || value === null)) {
            errors.push(`${path} is required`);
            return { valid: false, errors };
        }
        
        if (value === undefined || value === null) {
            return { valid: true, errors };
        }
        
        // Type check
        if (schema.type && typeof value !== schema.type) {
            errors.push(`${path} must be of type ${schema.type}`);
        }
        
        // String validations
        if (schema.type === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`${path} must be at least ${schema.minLength} characters`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`${path} must be at most ${schema.maxLength} characters`);
            }
            if (schema.pattern && !schema.pattern.test(value)) {
                errors.push(`${path} does not match required pattern`);
            }
        }
        
        // Number validations
        if (schema.type === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${path} must be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${path} must be at most ${schema.max}`);
            }
        }
        
        // Array validations
        if (schema.type === 'object' && Array.isArray(value) && schema.items) {
            value.forEach((item, index) => {
                const result = this.validateSingle(item, schema.items, `${path}[${index}]`);
                if (!result.valid) {
                    errors.push(...result.errors);
                }
            });
        }
        
        // Custom validator
        if (schema.validator && typeof schema.validator === 'function') {
            try {
                const isValid = schema.validator(value);
                if (!isValid) {
                    errors.push(`${path} failed custom validation`);
                }
            } catch (error) {
                errors.push(`${path} validator threw error: ${error.message}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // Helper method to register validation schema
    addValidationSchema(serviceName, methodName, schema) {
        const key = `${serviceName}.${methodName}`;
        this.config.schemas.set(key, schema);
    }
    
    getValidationStats() {
        return {
            totalErrors: this.validationErrors.length,
            recentErrors: this.validationErrors.slice(-10),
            schemaCount: this.config.schemas.size
        };
    }
}

/**
 * METRICS INTERCEPTOR
 * Recolección detallada de métricas
 */
class MetricsInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            trackResponseTimes: true,
            trackErrorRates: true,
            trackThroughput: true,
            aggregationWindow: 60000, // 1 minute
            ...config
        });
        
        this.methodMetrics = new Map();
        this.timeWindows = new Map();
    }
    
    async after(context) {
        const { serviceName, methodName, duration } = context;
        const key = `${serviceName}.${methodName}`;
        
        // Initialize metrics for method if not exists
        if (!this.methodMetrics.has(key)) {
            this.methodMetrics.set(key, {
                totalCalls: 0,
                totalTime: 0,
                errors: 0,
                responseTimes: [],
                throughput: []
            });
        }
        
        const metrics = this.methodMetrics.get(key);
        
        // Update basic metrics
        metrics.totalCalls++;
        metrics.totalTime += duration;
        
        // Track response times
        if (this.config.trackResponseTimes) {
            metrics.responseTimes.push({
                time: duration,
                timestamp: Date.now()
            });
            
            // Keep only last 100 measurements
            if (metrics.responseTimes.length > 100) {
                metrics.responseTimes.shift();
            }
        }
        
        // Track throughput
        if (this.config.trackThroughput) {
            this.trackThroughput(key);
        }
    }
    
    async onError(context) {
        const { serviceName, methodName } = context;
        const key = `${serviceName}.${methodName}`;
        
        const metrics = this.methodMetrics.get(key);
        if (metrics) {
            metrics.errors++;
        }
    }
    
    trackThroughput(methodKey) {
        const now = Date.now();
        const windowStart = Math.floor(now / this.config.aggregationWindow) * this.config.aggregationWindow;
        
        if (!this.timeWindows.has(windowStart)) {
            this.timeWindows.set(windowStart, new Map());
        }
        
        const window = this.timeWindows.get(windowStart);
        const currentCount = window.get(methodKey) || 0;
        window.set(methodKey, currentCount + 1);
        
        // Cleanup old windows
        const cutoff = now - (this.config.aggregationWindow * 10); // Keep 10 windows
        for (const [windowTime] of this.timeWindows) {
            if (windowTime < cutoff) {
                this.timeWindows.delete(windowTime);
            }
        }
    }
    
    getDetailedMetrics() {
        const report = {
            timestamp: new Date().toISOString(),
            methods: {}
        };
        
        for (const [method, metrics] of this.methodMetrics) {
            const responseTimes = metrics.responseTimes.map(rt => rt.time);
            
            report.methods[method] = {
                totalCalls: metrics.totalCalls,
                averageResponseTime: metrics.totalCalls > 0 ? metrics.totalTime / metrics.totalCalls : 0,
                errorRate: metrics.totalCalls > 0 ? metrics.errors / metrics.totalCalls : 0,
                minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
                maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
                recentThroughput: this.getRecentThroughput(method)
            };
        }
        
        return report;
    }
    
    getRecentThroughput(methodKey) {
        const now = Date.now();
        const recentWindow = Math.floor(now / this.config.aggregationWindow) * this.config.aggregationWindow;
        
        const window = this.timeWindows.get(recentWindow);
        return window ? (window.get(methodKey) || 0) : 0;
    }
}

/**
 * ERROR HANDLING INTERCEPTOR
 * Manejo centralizado de errores con recuperación automática
 */
class ErrorHandlingInterceptor extends BaseInterceptor {
    constructor(config = {}) {
        super({
            logErrors: true,
            notifyOnError: true,
            fallbackStrategies: new Map(),
            circuitBreakerEnabled: false,
            circuitBreakerThreshold: 5,
            circuitBreakerWindow: 60000, // 1 minute
            ...config
        });
        
        this.errorCounts = new Map();
        this.circuitStates = new Map(); // 'CLOSED', 'OPEN', 'HALF_OPEN'
        this.lastErrors = [];
    }
    
    async onError(context) {
        const { serviceName, methodName, error } = context;
        const key = `${serviceName}.${methodName}`;
        
        // Track error
        this.trackError(key, error);
        
        // Log error
        if (this.config.logErrors) {
            console.error(`🚨 Method Error [${key}]:`, error);
        }
        
        // Check circuit breaker
        if (this.config.circuitBreakerEnabled) {
            this.updateCircuitBreaker(key);
        }
        
        // Try fallback strategy
        const fallback = this.config.fallbackStrategies.get(key);
        if (fallback) {
            try {
                console.log(`🔄 Attempting fallback for ${key}`);
                const fallbackResult = await fallback(context);
                context.fallbackUsed = true;
                context.result = fallbackResult;
                return fallbackResult;
            } catch (fallbackError) {
                console.error(`❌ Fallback failed for ${key}:`, fallbackError);
            }
        }
        
        // Notify error handlers
        if (this.config.notifyOnError && window.diContainer) {
            window.diContainer.emit('method:error', {
                serviceName,
                methodName,
                error,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    trackError(methodKey, error) {
        // Track error count
        const currentCount = this.errorCounts.get(methodKey) || 0;
        this.errorCounts.set(methodKey, currentCount + 1);
        
        // Track recent errors
        this.lastErrors.push({
            method: methodKey,
            error: error.message,
            timestamp: Date.now()
        });
        
        // Keep only last 100 errors
        if (this.lastErrors.length > 100) {
            this.lastErrors.shift();
        }
    }
    
    updateCircuitBreaker(methodKey) {
        const errorCount = this.errorCounts.get(methodKey) || 0;
        const state = this.circuitStates.get(methodKey) || 'CLOSED';
        
        if (state === 'CLOSED' && errorCount >= this.config.circuitBreakerThreshold) {
            console.warn(`🔴 Circuit breaker OPENED for ${methodKey}`);
            this.circuitStates.set(methodKey, 'OPEN');
            
            // Schedule automatic recovery attempt
            setTimeout(() => {
                console.log(`🟡 Circuit breaker HALF_OPEN for ${methodKey}`);
                this.circuitStates.set(methodKey, 'HALF_OPEN');
            }, this.config.circuitBreakerWindow);
        }
    }
    
    // Add fallback strategy for specific method
    addFallback(serviceName, methodName, fallbackFn) {
        const key = `${serviceName}.${methodName}`;
        this.config.fallbackStrategies.set(key, fallbackFn);
    }
    
    getErrorReport() {
        return {
            totalErrors: this.lastErrors.length,
            errorsByMethod: Object.fromEntries(this.errorCounts),
            circuitBreakerStates: Object.fromEntries(this.circuitStates),
            recentErrors: this.lastErrors.slice(-10)
        };
    }
}

/**
 * EXCEPTION CLASSES
 */
class CacheHitException extends Error {
    constructor(value) {
        super('Cache hit');
        this.value = value;
        this.name = 'CacheHitException';
    }
}

class ValidationError extends Error {
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}

/**
 * INTERCEPTOR REGISTRY
 * Central registry for all interceptors
 */
class InterceptorRegistry {
    constructor() {
        this.interceptors = new Map();
        this.prebuiltInterceptors = {
            'logging': LoggingInterceptor,
            'performance': PerformanceInterceptor,
            'security': SecurityInterceptor,
            'caching': CachingInterceptor,
            'retry': RetryInterceptor,
            'validation': ValidationInterceptor,
            'metrics': MetricsInterceptor,
            'errorHandling': ErrorHandlingInterceptor
        };
    }
    
    /**
     * Create and register interceptor
     */
    create(type, name, config = {}) {
        const InterceptorClass = this.prebuiltInterceptors[type];
        if (!InterceptorClass) {
            throw new Error(`Unknown interceptor type: ${type}`);
        }
        
        const interceptor = new InterceptorClass(config);
        this.interceptors.set(name, interceptor);
        
        return interceptor;
    }
    
    /**
     * Get interceptor by name
     */
    get(name) {
        return this.interceptors.get(name);
    }
    
    /**
     * List all registered interceptors
     */
    list() {
        return Array.from(this.interceptors.keys());
    }
    
    /**
     * Get comprehensive report of all interceptors
     */
    getReport() {
        const report = {
            timestamp: new Date().toISOString(),
            interceptors: {}
        };
        
        for (const [name, interceptor] of this.interceptors) {
            report.interceptors[name] = {
                type: interceptor.constructor.name,
                metrics: interceptor.getMetrics(),
                config: interceptor.config
            };
            
            // Add specific reports if available
            if (typeof interceptor.getPerformanceReport === 'function') {
                report.interceptors[name].performanceReport = interceptor.getPerformanceReport();
            }
            if (typeof interceptor.getSecurityReport === 'function') {
                report.interceptors[name].securityReport = interceptor.getSecurityReport();
            }
            if (typeof interceptor.getCacheStats === 'function') {
                report.interceptors[name].cacheStats = interceptor.getCacheStats();
            }
            if (typeof interceptor.getRetryStats === 'function') {
                report.interceptors[name].retryStats = interceptor.getRetryStats();
            }
            if (typeof interceptor.getValidationStats === 'function') {
                report.interceptors[name].validationStats = interceptor.getValidationStats();
            }
            if (typeof interceptor.getDetailedMetrics === 'function') {
                report.interceptors[name].detailedMetrics = interceptor.getDetailedMetrics();
            }
            if (typeof interceptor.getErrorReport === 'function') {
                report.interceptors[name].errorReport = interceptor.getErrorReport();
            }
        }
        
        return report;
    }
}

// Global interceptor registry
const interceptorRegistry = new InterceptorRegistry();

// Auto-register with DI container when available
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.diContainer) {
            // Register interceptor registry
            window.diContainer.register('InterceptorRegistry', interceptorRegistry, {
                lifecycle: window.diContainer.LIFECYCLE_TYPES.SINGLETON
            });
            
            // Create default interceptors
            const defaultInterceptors = [
                { type: 'logging', name: 'defaultLogging', config: { logLevel: 'info' } },
                { type: 'performance', name: 'defaultPerformance', config: { slowThreshold: 200 } },
                { type: 'security', name: 'defaultSecurity', config: {} },
                { type: 'errorHandling', name: 'defaultErrorHandling', config: { logErrors: true } }
            ];
            
            for (const { type, name, config } of defaultInterceptors) {
                try {
                    const interceptor = interceptorRegistry.create(type, name, config);
                    window.diContainer.registerInterceptor(name, interceptor);
                    console.log(`✅ Registered ${type} interceptor: ${name}`);
                } catch (error) {
                    console.error(`❌ Failed to register interceptor ${name}:`, error);
                }
            }
            
            console.log('🎯 DI Interceptors integrated successfully');
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BaseInterceptor,
        LoggingInterceptor,
        PerformanceInterceptor,
        SecurityInterceptor,
        CachingInterceptor,
        RetryInterceptor,
        ValidationInterceptor,
        MetricsInterceptor,
        ErrorHandlingInterceptor,
        InterceptorRegistry,
        interceptorRegistry
    };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.interceptorRegistry = interceptorRegistry;
    window.DIInterceptors = {
        BaseInterceptor,
        LoggingInterceptor,
        PerformanceInterceptor,
        SecurityInterceptor,
        CachingInterceptor,
        RetryInterceptor,
        ValidationInterceptor,
        MetricsInterceptor,
        ErrorHandlingInterceptor
    };
}

console.log('🎯 DI Interceptors loaded - Advanced AOP capabilities ready');
