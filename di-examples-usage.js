/**
 * DI CONTAINER USAGE EXAMPLES
 * Ejemplos prácticos de uso del sistema de Dependency Injection
 * 
 * EJEMPLOS INCLUIDOS:
 * 1. Registro de servicios básico
 * 2. Uso de factories y lifecycles
 * 3. Inyección de dependencias
 * 4. Interceptors y AOP
 * 5. Configuración centralizada
 * 6. Health checks y monitoring
 * 7. Hot swapping de servicios
 * 8. Testing con mocking
 * 9. Integration con sistemas existentes
 * 10. Casos de uso avanzados
 */

/**
 * EJEMPLO 1: REGISTRO BÁSICO DE SERVICIOS
 */
function example1_BasicServiceRegistration() {
    console.log('\n📘 Ejemplo 1: Registro Básico de Servicios');
    
    // Crear un servicio simple
    class EmailService {
        constructor() {
            this.sentEmails = [];
            this.initialized = false;
        }
        
        async initialize() {
            console.log('EmailService initialized');
            this.initialized = true;
        }
        
        sendEmail(to, subject, body) {
            const email = {
                to,
                subject,
                body,
                sentAt: new Date().toISOString(),
                id: Math.random().toString(36).substr(2, 9)
            };
            
            this.sentEmails.push(email);
            console.log(`📧 Email sent to ${to}: ${subject}`);
            
            return email;
        }
        
        getSentEmails() {
            return [...this.sentEmails];
        }
    }
    
    // Registrar el servicio
    diContainer.register('EmailService', new EmailService(), {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
        healthCheck: (instance) => instance.initialized,
        tags: ['communication', 'utility']
    });
    
    console.log('✅ EmailService registrado exitosamente');
    
    return EmailService;
}

/**
 * EJEMPLO 2: FACTORIES Y LIFECYCLES
 */
function example2_FactoriesAndLifecycles() {
    console.log('\n🏭 Ejemplo 2: Factories y Lifecycles');
    
    // Factory para crear instancias de Logger
    diContainer.registerFactory('Logger', (dependencies, config) => {
        const level = config.level || 'info';
        const prefix = config.prefix || '[LOG]';
        
        return {
            debug: (message) => {
                if (['debug'].includes(level)) {
                    console.log(`${prefix} DEBUG: ${message}`);
                }
            },
            info: (message) => {
                if (['debug', 'info'].includes(level)) {
                    console.log(`${prefix} INFO: ${message}`);
                }
            },
            warn: (message) => {
                if (['debug', 'info', 'warn'].includes(level)) {
                    console.warn(`${prefix} WARN: ${message}`);
                }
            },
            error: (message) => {
                console.error(`${prefix} ERROR: ${message}`);
            }
        };
    }, {
        lifecycle: diContainer.LIFECYCLE_TYPES.TRANSIENT, // Nueva instancia cada vez
        configuration: {
            level: 'info',
            prefix: '[APP]'
        }
    });
    
    // Factory para Database Connection (singleton)
    diContainer.registerFactory('DatabaseConnection', (deps, config) => {
        const connection = {
            host: config.host || 'localhost',
            port: config.port || 5432,
            database: config.database || 'ciaociao',
            connected: false,
            
            async connect() {
                console.log(`💾 Connecting to database: ${this.host}:${this.port}/${this.database}`);
                // Simular conexión
                await new Promise(resolve => setTimeout(resolve, 100));
                this.connected = true;
                console.log('✅ Database connected');
            },
            
            async disconnect() {
                this.connected = false;
                console.log('🔌 Database disconnected');
            },
            
            query(sql) {
                if (!this.connected) {
                    throw new Error('Database not connected');
                }
                console.log(`🔍 Executing query: ${sql}`);
                return { rows: [], affectedRows: 0 };
            }
        };
        
        return connection;
    }, {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
        configuration: {
            host: 'localhost',
            port: 5432,
            database: 'ciaociao_recibos'
        },
        healthCheck: (instance) => instance.connected
    });
    
    console.log('✅ Factories registradas exitosamente');
}

/**
 * EJEMPLO 3: INYECCIÓN DE DEPENDENCIAS
 */
function example3_DependencyInjection() {
    console.log('\n🔗 Ejemplo 3: Inyección de Dependencias');
    
    // Servicio que depende de otros servicios
    class UserService {
        constructor() {
            this.users = new Map();
        }
        
        // DI container inyectará las dependencias
        setDependencies(dependencies) {
            this.emailService = dependencies.EmailService;
            this.logger = dependencies.Logger;
            this.database = dependencies.DatabaseConnection;
        }
        
        async initialize() {
            if (this.database && !this.database.connected) {
                await this.database.connect();
            }
            this.logger?.info('UserService initialized');
        }
        
        async createUser(userData) {
            this.logger?.info(`Creating user: ${userData.email}`);
            
            // Validar usuario
            if (!userData.email || !userData.name) {
                throw new Error('Email and name are required');
            }
            
            // Crear usuario
            const user = {
                id: Math.random().toString(36).substr(2, 9),
                ...userData,
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            
            // Guardar en "base de datos"
            this.users.set(user.id, user);
            
            try {
                this.database?.query(`INSERT INTO users (id, email, name) VALUES ('${user.id}', '${user.email}', '${user.name}')`);
            } catch (error) {
                this.logger?.error(`Database error: ${error.message}`);
            }
            
            // Enviar email de bienvenida
            try {
                this.emailService?.sendEmail(
                    user.email,
                    'Bienvenido a CiaoCiao Recibos',
                    `Hola ${user.name}, bienvenido a nuestro sistema.`
                );
            } catch (error) {
                this.logger?.error(`Email error: ${error.message}`);
            }
            
            this.logger?.info(`User created successfully: ${user.id}`);
            return user;
        }
        
        getUser(id) {
            return this.users.get(id);
        }
        
        getAllUsers() {
            return Array.from(this.users.values());
        }
    }
    
    // Registrar con dependencias
    diContainer.register('UserService', new UserService(), {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
        dependencies: ['EmailService', 'Logger', 'DatabaseConnection'],
        healthCheck: (instance) => instance.users !== undefined,
        tags: ['business', 'user-management']
    });
    
    console.log('✅ UserService registrado con dependencias');
    
    return UserService;
}

/**
 * EJEMPLO 4: INTERCEPTORS Y AOP
 */
function example4_InterceptorsAndAOP() {
    console.log('\n🎯 Ejemplo 4: Interceptors y AOP');
    
    // Crear un interceptor personalizado para auditoría
    class AuditInterceptor {
        constructor() {
            this.auditLog = [];
        }
        
        async intercept(target, serviceName, context) {
            return new Proxy(target, {
                get: (target, prop, receiver) => {
                    const value = Reflect.get(target, prop, receiver);
                    
                    if (typeof value === 'function' && !prop.startsWith('_') && prop !== 'constructor') {
                        return async (...args) => {
                            const startTime = Date.now();
                            const auditEntry = {
                                service: serviceName,
                                method: prop,
                                args: this.sanitizeArgs(args),
                                timestamp: new Date().toISOString(),
                                user: 'system' // En un sistema real, obtener del contexto
                            };
                            
                            try {
                                const result = await value.apply(target, args);
                                
                                auditEntry.success = true;
                                auditEntry.duration = Date.now() - startTime;
                                auditEntry.result = this.sanitizeResult(result);
                                
                                this.auditLog.push(auditEntry);
                                
                                console.log(`📈 AUDIT: ${serviceName}.${prop} executed successfully`);
                                
                                return result;
                                
                            } catch (error) {
                                auditEntry.success = false;
                                auditEntry.error = error.message;
                                auditEntry.duration = Date.now() - startTime;
                                
                                this.auditLog.push(auditEntry);
                                
                                console.error(`🚨 AUDIT: ${serviceName}.${prop} failed:`, error.message);
                                
                                throw error;
                            }
                        };
                    }
                    
                    return value;
                }
            });
        }
        
        sanitizeArgs(args) {
            // Remover datos sensibles de los argumentos
            return args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    const sanitized = { ...arg };
                    ['password', 'token', 'secret'].forEach(key => {
                        if (sanitized[key]) {
                            sanitized[key] = '[REDACTED]';
                        }
                    });
                    return sanitized;
                }
                return arg;
            });
        }
        
        sanitizeResult(result) {
            if (typeof result === 'object' && result !== null) {
                return { type: typeof result, hasData: true };
            }
            return result;
        }
        
        getAuditLog() {
            return [...this.auditLog];
        }
        
        clearAuditLog() {
            this.auditLog = [];
        }
    }
    
    // Registrar el interceptor
    const auditInterceptor = new AuditInterceptor();
    diContainer.registerInterceptor('audit', auditInterceptor);
    
    // Aplicar interceptors al UserService
    const userServiceDefinition = diContainer.getServiceInfo('UserService');
    if (userServiceDefinition) {
        // Agregar interceptors (si no los tiene ya)
        const existingService = diContainer.services.get('UserService');
        if (existingService && !existingService.interceptors.includes('audit')) {
            existingService.interceptors.push('defaultLogging', 'defaultPerformance', 'audit');
        }
    }
    
    console.log('✅ Interceptors configurados');
    
    return auditInterceptor;
}

/**
 * EJEMPLO 5: CONFIGURACIÓN CENTRALIZADA
 */
function example5_CentralizedConfiguration() {
    console.log('\n⚙️ Ejemplo 5: Configuración Centralizada');
    
    // Configurar servicios mediante el sistema de configuración
    if (window.configurationSystem) {
        // Configuración específica para UserService
        configurationSystem.set('services.UserService.config', {
            maxUsers: 1000,
            emailNotifications: true,
            auditEnabled: true,
            cacheTimeout: 300000
        });
        
        // Configuración para EmailService
        configurationSystem.set('services.EmailService.config', {
            provider: 'smtp',
            templatesEnabled: true,
            retryAttempts: 3
        });
        
        // Configurar watchers para cambios en configuración
        configurationSystem.watch('services.UserService.config', (newConfig, oldConfig) => {
            console.log('🔄 UserService configuration changed:', newConfig);
            // Aquí se podría notificar al servicio para recargar configuración
        });
        
        console.log('✅ Configuraciones establecidas');
        
        // Mostrar configuración actual
        console.log('Current UserService config:', configurationSystem.get('services.UserService.config'));
    }
}

/**
 * EJEMPLO 6: HEALTH CHECKS Y MONITORING
 */
function example6_HealthChecksAndMonitoring() {
    console.log('\n🏥 Ejemplo 6: Health Checks y Monitoring');
    
    // Registrar servicio con health check personalizado
    class APIService {
        constructor() {
            this.endpoint = 'https://api.example.com';
            this.lastPing = null;
            this.healthy = false;
        }
        
        async initialize() {
            await this.ping();
        }
        
        async ping() {
            try {
                // Simular ping a API externa
                this.lastPing = Date.now();
                this.healthy = Math.random() > 0.1; // 90% probabilidad de éxito
                
                if (this.healthy) {
                    console.log('✅ API ping successful');
                } else {
                    console.warn('⚠️ API ping failed');
                }
                
                return this.healthy;
            } catch (error) {
                console.error('❌ API ping error:', error);
                this.healthy = false;
                return false;
            }
        }
        
        async getData() {
            if (!this.healthy) {
                throw new Error('API service is unhealthy');
            }
            return { data: 'sample data', timestamp: Date.now() };
        }
    }
    
    diContainer.register('APIService', new APIService(), {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
        healthCheck: async (instance) => {
            return await instance.ping();
        },
        tags: ['external', 'api']
    });
    
    // Escuchar eventos de health check
    diContainer.on('service:unhealthy', (event) => {
        console.log(`🚨 Service unhealthy: ${event.name}`);
        // Aquí se podría enviar alertas, reiniciar servicios, etc.
    });
    
    diContainer.on('service:restarted', (event) => {
        console.log(`🔄 Service restarted: ${event.name}`);
    });
    
    console.log('✅ APIService registrado con health checks');
}

/**
 * EJEMPLO 7: HOT SWAPPING DE SERVICIOS
 */
function example7_HotSwapping() {
    console.log('\n🔄 Ejemplo 7: Hot Swapping de Servicios');
    
    // Implementación original del cache
    class BasicCache {
        constructor() {
            this.cache = new Map();
            this.version = '1.0';
        }
        
        get(key) {
            return this.cache.get(key);
        }
        
        set(key, value, ttl = 300000) {
            this.cache.set(key, {
                value,
                expires: Date.now() + ttl
            });
        }
        
        getStats() {
            return {
                version: this.version,
                size: this.cache.size,
                type: 'basic'
            };
        }
    }
    
    // Registrar cache básico
    diContainer.register('CacheService', new BasicCache(), {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON
    });
    
    console.log('✅ BasicCache registrado');
    
    // Simular hot swap después de 2 segundos
    setTimeout(async () => {
        console.log('\n🔄 Performing hot swap...');
        
        // Nueva implementación mejorada
        class AdvancedCache {
            constructor() {
                this.cache = new Map();
                this.hits = 0;
                this.misses = 0;
                this.version = '2.0';
            }
            
            get(key) {
                const item = this.cache.get(key);
                
                if (!item) {
                    this.misses++;
                    return undefined;
                }
                
                if (item.expires && Date.now() > item.expires) {
                    this.cache.delete(key);
                    this.misses++;
                    return undefined;
                }
                
                this.hits++;
                return item.value;
            }
            
            set(key, value, ttl = 300000) {
                this.cache.set(key, {
                    value,
                    expires: ttl > 0 ? Date.now() + ttl : null,
                    created: Date.now()
                });
            }
            
            getStats() {
                return {
                    version: this.version,
                    size: this.cache.size,
                    hits: this.hits,
                    misses: this.misses,
                    hitRate: this.hits / (this.hits + this.misses) || 0,
                    type: 'advanced'
                };
            }
            
            clear() {
                this.cache.clear();
            }
        }
        
        try {
            // Realizar hot swap
            await diContainer.hotSwap('CacheService', new AdvancedCache());
            console.log('✅ Hot swap completed successfully');
            
            // Verificar que el nuevo servicio funciona
            const newCache = await diContainer.resolve('CacheService');
            console.log('New cache stats:', newCache.getStats());
            
        } catch (error) {
            console.error('❌ Hot swap failed:', error);
        }
    }, 2000);
}

/**
 * EJEMPLO 8: TESTING CON MOCKING
 */
function example8_TestingWithMocking() {
    console.log('\n🧪 Ejemplo 8: Testing con Mocking');
    
    // Mock del EmailService para testing
    class MockEmailService {
        constructor() {
            this.sentEmails = [];
            this.shouldFail = false;
            this.initialized = true;
        }
        
        setShouldFail(fail) {
            this.shouldFail = fail;
        }
        
        sendEmail(to, subject, body) {
            if (this.shouldFail) {
                throw new Error('Email service is down (mock)');
            }
            
            const email = {
                to,
                subject,
                body,
                sentAt: new Date().toISOString(),
                id: 'mock-' + Math.random().toString(36).substr(2, 9),
                isMock: true
            };
            
            this.sentEmails.push(email);
            console.log(`🧪 MOCK: Email "sent" to ${to}`);
            
            return email;
        }
        
        getSentEmails() {
            return [...this.sentEmails];
        }
        
        reset() {
            this.sentEmails = [];
            this.shouldFail = false;
        }
    }
    
    // Crear scope de testing
    const testScope = diContainer.createScope('testing');
    
    // Función para setup de test
    const setupTestEnvironment = async () => {
        console.log('Setting up test environment...');
        
        // Reemplazar EmailService con mock en el contenedor principal
        const mockEmailService = new MockEmailService();
        await diContainer.hotSwap('EmailService', mockEmailService);
        
        return {
            mockEmailService,
            async teardown() {
                console.log('Tearing down test environment...');
                mockEmailService.reset();
                // En un entorno real, restauraríamos el servicio original
            }
        };
    };
    
    // Ejemplo de test
    const runTest = async () => {
        const testEnv = await setupTestEnvironment();
        
        try {
            console.log('\n🧪 Running test: User creation with email notification');
            
            // Resolver UserService que usará el EmailService mock
            const userService = await diContainer.resolve('UserService');
            
            // Crear usuario
            const user = await userService.createUser({
                name: 'Test User',
                email: 'test@example.com'
            });
            
            console.log('✅ User created:', user.id);
            
            // Verificar que se envió el email mock
            const sentEmails = testEnv.mockEmailService.getSentEmails();
            console.log(`✅ Mock emails sent: ${sentEmails.length}`);
            console.log('First email:', sentEmails[0]);
            
            // Test de fallo
            console.log('\n🧪 Testing email failure scenario...');
            testEnv.mockEmailService.setShouldFail(true);
            
            try {
                await userService.createUser({
                    name: 'Test User 2',
                    email: 'test2@example.com'
                });
                console.log('✅ User created despite email failure (graceful degradation)');
            } catch (error) {
                console.log('⚠️ User creation failed:', error.message);
            }
            
        } finally {
            await testEnv.teardown();
        }
    };
    
    // Ejecutar test en 3 segundos
    setTimeout(runTest, 3000);
    
    console.log('✅ Test environment setup scheduled');
}

/**
 * EJEMPLO 9: INTEGRACIÓN CON SISTEMAS EXISTENTES
 */
function example9_IntegrationWithExistingSystems() {
    console.log('\n🔗 Ejemplo 9: Integración con Sistemas Existentes');
    
    // Verificar integraciones existentes
    console.log('Sistemas integrados:');
    const status = diContainer.getStatus();
    status.integrations.forEach(integration => {
        console.log(`✅ ${integration}`);
    });
    
    // Crear un wrapper para aprovechar SecurityManager
    class SecureUserService {
        constructor() {
            this.users = new Map();
        }
        
        setDependencies(dependencies) {
            this.securityManager = dependencies.SecurityManager;
            this.userService = dependencies.UserService;
        }
        
        async createSecureUser(userData, sessionToken) {
            // Validar sesión usando SecurityManager
            if (this.securityManager) {
                try {
                    const session = await this.securityManager.validateSession();
                    if (!session) {
                        throw new Error('Invalid session');
                    }
                    console.log('✅ Session validated successfully');
                } catch (error) {
                    console.error('❌ Session validation failed:', error);
                    throw new Error('Authentication required');
                }
                
                // Sanitizar datos usando XSS Protection (a través de SecurityManager)
                if (userData.name && this.securityManager.sanitizeInput) {
                    userData.name = this.securityManager.sanitizeInput(userData.name, 'text');
                }
                if (userData.email && this.securityManager.sanitizeInput) {
                    userData.email = this.securityManager.sanitizeInput(userData.email, 'email');
                }
            }
            
            // Usar UserService original
            if (this.userService) {
                return await this.userService.createUser(userData);
            } else {
                throw new Error('UserService not available');
            }
        }
    }
    
    // Registrar servicio seguro
    diContainer.register('SecureUserService', new SecureUserService(), {
        lifecycle: diContainer.LIFECYCLE_TYPES.SINGLETON,
        dependencies: ['SecurityManager', 'UserService'],
        tags: ['security', 'business']
    });
    
    console.log('✅ SecureUserService registrado con integración de seguridad');
}

/**
 * EJEMPLO 10: CASOS DE USO AVANZADOS
 */
function example10_AdvancedUseCases() {
    console.log('\n🎆 Ejemplo 10: Casos de Uso Avanzados');
    
    // 1. Service Factory con configuración dinámica
    diContainer.registerFactory('DynamicReportGenerator', (deps, config) => {
        const reportType = config.type || 'basic';
        
        switch (reportType) {
            case 'pdf':
                return {
                    type: 'PDF',
                    generate: (data) => ({ format: 'pdf', data, timestamp: Date.now() }),
                    export: (report) => console.log('Exporting PDF report')
                };
                
            case 'excel':
                return {
                    type: 'Excel',
                    generate: (data) => ({ format: 'xlsx', data, timestamp: Date.now() }),
                    export: (report) => console.log('Exporting Excel report')
                };
                
            default:
                return {
                    type: 'Basic',
                    generate: (data) => ({ format: 'json', data, timestamp: Date.now() }),
                    export: (report) => console.log('Exporting JSON report')
                };
        }
    }, {
        lifecycle: diContainer.LIFECYCLE_TYPES.TRANSIENT,
        configuration: { type: 'basic' }
    });
    
    // 2. Service Decorator Pattern
    class ServiceDecoratorFactory {
        static createLoggingDecorator(originalService) {
            return new Proxy(originalService, {
                get(target, prop) {
                    const value = target[prop];
                    
                    if (typeof value === 'function') {
                        return function(...args) {
                            console.log(`📈 [DECORATED] Calling ${prop}`);
                            const result = value.apply(target, args);
                            console.log(`📈 [DECORATED] ${prop} completed`);
                            return result;
                        };
                    }
                    
                    return value;
                }
            });
        }
        
        static createCachingDecorator(originalService, cacheTTL = 60000) {
            const cache = new Map();
            
            return new Proxy(originalService, {
                get(target, prop) {
                    const value = target[prop];
                    
                    if (typeof value === 'function') {
                        return function(...args) {
                            const cacheKey = `${prop}_${JSON.stringify(args)}`;
                            const cached = cache.get(cacheKey);
                            
                            if (cached && Date.now() - cached.timestamp < cacheTTL) {
                                console.log(`💾 [CACHE HIT] ${prop}`);
                                return cached.result;
                            }
                            
                            const result = value.apply(target, args);
                            cache.set(cacheKey, {
                                result,
                                timestamp: Date.now()
                            });
                            
                            console.log(`💾 [CACHE MISS] ${prop}`);
                            return result;
                        };
                    }
                    
                    return value;
                }
            });
        }
    }
    
    // 3. Multi-tenant service resolver
    class MultiTenantResolver {
        constructor() {
            this.tenantServices = new Map();
        }
        
        registerTenantService(tenantId, serviceName, serviceInstance) {
            if (!this.tenantServices.has(tenantId)) {
                this.tenantServices.set(tenantId, new Map());
            }
            this.tenantServices.get(tenantId).set(serviceName, serviceInstance);
        }
        
        resolveTenantService(tenantId, serviceName) {
            const tenantServices = this.tenantServices.get(tenantId);
            if (!tenantServices) {
                throw new Error(`Tenant ${tenantId} not found`);
            }
            
            const service = tenantServices.get(serviceName);
            if (!service) {
                // Fallback to global service
                return diContainer.resolve(serviceName);
            }
            
            return service;
        }
    }
    
    const multiTenantResolver = new MultiTenantResolver();
    diContainer.register('MultiTenantResolver', multiTenantResolver);
    
    console.log('✅ Advanced use cases configured');
}

/**
 * FUNCIÓN PRINCIPAL PARA EJECUTAR TODOS LOS EJEMPLOS
 */
export async function runAllExamples() {
    console.log('🚀 Ejecutando ejemplos del DI Container...\n');
    
    try {
        // Esperar a que el DI container esté listo
        if (!window.diContainer) {
            console.log('Esperando a que el DI Container esté listo...');
            await new Promise(resolve => {
                const checkReady = () => {
                    if (window.diContainer) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });
        }
        
        // Ejecutar ejemplos en secuencia
        example1_BasicServiceRegistration();
        example2_FactoriesAndLifecycles();
        example3_DependencyInjection();
        example4_InterceptorsAndAOP();
        example5_CentralizedConfiguration();
        example6_HealthChecksAndMonitoring();
        example7_HotSwapping();
        example8_TestingWithMocking();
        example9_IntegrationWithExistingSystems();
        example10_AdvancedUseCases();
        
        // Probar algunos servicios después de un momento
        setTimeout(async () => {
            console.log('\n🧪 Probando servicios registrados...');
            
            try {
                // Probar UserService
                const userService = await diContainer.resolve('UserService');
                const user = await userService.createUser({
                    name: 'Juan Pérez',
                    email: 'juan.perez@example.com'
                });
                console.log('✅ Usuario creado:', user);
                
                // Probar Logger
                const logger = await diContainer.resolve('Logger');
                logger.info('Logger funcionando correctamente');
                
                // Probar CacheService
                const cache = await diContainer.resolve('CacheService');
                cache.set('test', 'valor de prueba');
                const cachedValue = cache.get('test');
                console.log('✅ Cache funcionando:', cachedValue);
                
                // Mostrar estadísticas del sistema
                console.log('\n📊 Estadísticas del DI Container:');
                const status = diContainer.getStatus();
                console.log(status);
                
                // Mostrar reporte de performance
                const performanceReport = diContainer.generatePerformanceReport();
                console.log('\n📈 Reporte de Performance:');
                console.log(performanceReport);
                
                // Mostrar interceptors report
                if (window.interceptorRegistry) {
                    console.log('\n🎯 Reporte de Interceptors:');
                    const interceptorsReport = interceptorRegistry.getReport();
                    console.log(interceptorsReport);
                }
                
            } catch (error) {
                console.error('❌ Error probando servicios:', error);
            }
        }, 5000);
        
        console.log('\n✅ Todos los ejemplos ejecutados exitosamente!');
        console.log('\nPuedes usar los siguientes comandos en la consola:');
        console.log('- diContainer.getStatus() // Estado del contenedor');
        console.log('- diContainer.listServices() // Lista de servicios');
        console.log('- diContainer.resolve("UserService") // Resolver servicio');
        console.log('- configurationSystem.getAll() // Ver toda la configuración');
        console.log('- interceptorRegistry.getReport() // Reporte de interceptors');
        
    } catch (error) {
        console.error('❌ Error ejecutando ejemplos:', error);
    }
}

/**
 * FUNCIONES DE UTILIDAD PARA TESTING
 */
export const DITestUtils = {
    async createTestContainer() {
        const testContainer = new DependencyInjectionContainer();
        // Setup básico para testing
        return testContainer;
    },
    
    async mockService(serviceName, mockImplementation) {
        if (window.diContainer) {
            await diContainer.hotSwap(serviceName, mockImplementation);
            return () => {
                // Restaurar servicio original (implementación simplificada)
                console.log(`Restoring original ${serviceName}`);
            };
        }
    },
    
    async runTestSuite(tests) {
        console.log('🧪 Running DI Test Suite...');
        
        for (const [testName, testFn] of Object.entries(tests)) {
            try {
                console.log(`\n🧪 Running test: ${testName}`);
                await testFn();
                console.log(`✅ Test passed: ${testName}`);
            } catch (error) {
                console.error(`❌ Test failed: ${testName}`, error);
            }
        }
        
        console.log('\n🧪 Test suite completed');
    }
};

// Auto-ejecutar ejemplos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllExamples, 2000); // Dar tiempo a que se inicialice todo
    });
} else {
    setTimeout(runAllExamples, 2000);
}

// Hacer disponibles globalmente
if (typeof window !== 'undefined') {
    window.DIExamples = {
        runAllExamples,
        DITestUtils
    };
}

console.log('📘 DI Container Examples loaded - Run DIExamples.runAllExamples() to see demonstrations');
