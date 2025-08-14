// api-proxy-service.js - SERVICIO PROXY PARA APIS DE METALES PRECIOSOS v1.0
// Manejo de CORS, seguridad de API keys y proxy inteligente
// =================================================================

console.log('🔒 Iniciando Servicio Proxy de APIs v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SERVICIO PROXY
// =================================================================

const PROXY_CONFIG = {
    // Configuración de servicios serverless disponibles
    proxyServices: {
        // Opción 1: Vercel Serverless Functions (recomendado)
        vercel: {
            endpoint: 'https://your-app.vercel.app/api/metals',
            enabled: false,
            deployment: 'vercel'
        },
        
        // Opción 2: Netlify Functions
        netlify: {
            endpoint: 'https://your-app.netlify.app/.netlify/functions/metals',
            enabled: false,
            deployment: 'netlify'
        },
        
        // Opción 3: Proxy CORS público (menos seguro pero funcional)
        corsProxy: {
            endpoint: 'https://api.allorigins.win/raw?url=',
            enabled: true,
            deployment: 'public'
        },
        
        // Opción 4: Servicio proxy personalizado
        custom: {
            endpoint: 'https://your-custom-proxy.com/api/metals',
            enabled: false,
            deployment: 'custom'
        }
    },

    // Configuración de seguridad
    security: {
        // API keys encriptadas (base64 simple para demo)
        encryptedKeys: {
            'metals-api': '', // Usuario debe configurar
            'metalprice-api': '' // Usuario debe configurar
        },
        
        // Headers de seguridad
        securityHeaders: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Proxy-Source': 'ciaociao-jewelry-calculator',
            'Referer': 'https://recibos.ciaociao.mx'
        },
        
        // Dominios permitidos
        allowedOrigins: [
            'https://recibos.ciaociao.mx',
            'https://sittjoe.github.io',
            'http://localhost:3000',
            'http://127.0.0.1:5500' // Para desarrollo local
        ]
    },

    // Configuración de cache del proxy
    proxyCache: {
        enabled: true,
        ttl: 300000, // 5 minutos
        maxSize: 100, // 100 entradas máximo
        prefix: 'proxy_cache_'
    },

    // Configuración de timeouts y reintentos
    request: {
        timeout: 15000, // 15 segundos
        maxRetries: 3,
        retryDelay: 1000, // 1 segundo
        backoffMultiplier: 2
    }
};

// =================================================================
// CLASE PRINCIPAL DE PROXY SERVICE
// =================================================================

class APIProxyService {
    constructor() {
        this.cache = new Map();
        this.activeProxy = null;
        this.initialized = false;
        this.requestQueue = [];
        this.processing = false;
        
        // Inicializar automáticamente
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando servicio proxy...');
        
        try {
            // Detectar mejor proxy disponible
            this.activeProxy = await this.detectBestProxy();
            
            // Cargar configuración de seguridad
            this.loadSecurityConfig();
            
            // Configurar limpieza de cache
            this.setupCacheCleanup();
            
            this.initialized = true;
            console.log(`✅ Proxy inicializado con: ${this.activeProxy}`);
            
        } catch (error) {
            console.error('❌ Error inicializando proxy:', error);
            // Usar fallback público como último recurso
            this.activeProxy = 'corsProxy';
            this.initialized = true;
        }
    }

    async detectBestProxy() {
        console.log('🔍 Detectando mejor proxy disponible...');
        
        // Probar proxies en orden de preferencia
        const proxyOrder = ['vercel', 'netlify', 'custom', 'corsProxy'];
        
        for (const proxyKey of proxyOrder) {
            const proxyConfig = PROXY_CONFIG.proxyServices[proxyKey];
            
            if (!proxyConfig.enabled && proxyKey !== 'corsProxy') {
                continue;
            }
            
            try {
                const isAvailable = await this.testProxy(proxyKey);
                if (isAvailable) {
                    console.log(`✅ Proxy ${proxyKey} disponible`);
                    return proxyKey;
                }
            } catch (error) {
                console.warn(`⚠️ Proxy ${proxyKey} no disponible:`, error.message);
            }
        }
        
        // Si ninguno funciona, usar corsProxy como fallback
        return 'corsProxy';
    }

    async testProxy(proxyKey) {
        const proxyConfig = PROXY_CONFIG.proxyServices[proxyKey];
        
        // Para el proxy CORS público, hacer una prueba simple
        if (proxyKey === 'corsProxy') {
            try {
                const testUrl = `${proxyConfig.endpoint}https://httpbin.org/json`;
                const response = await fetch(testUrl, { 
                    method: 'GET',
                    timeout: 5000 
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        }
        
        // Para otros proxies, hacer prueba de health check
        try {
            const response = await fetch(`${proxyConfig.endpoint}/health`, {
                method: 'GET',
                timeout: 5000,
                headers: PROXY_CONFIG.security.securityHeaders
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // =================================================================
    // MÉTODOS PRINCIPALES DE PROXY
    // =================================================================

    async proxyRequest(apiKey, endpoint, params = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Verificar cache primero
        const cacheKey = this.generateCacheKey(apiKey, endpoint, params);
        const cachedResponse = this.getFromCache(cacheKey);
        
        if (cachedResponse) {
            console.log('📦 Respuesta desde cache del proxy');
            return cachedResponse;
        }

        // Agregar a cola de procesamiento
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                apiKey,
                endpoint,
                params,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            
            try {
                const response = await this.executeProxyRequest(
                    request.apiKey,
                    request.endpoint,
                    request.params
                );
                request.resolve(response);
            } catch (error) {
                request.reject(error);
            }

            // Pequeña pausa entre requests para evitar rate limiting
            await this.sleep(100);
        }

        this.processing = false;
    }

    async executeProxyRequest(apiKey, endpoint, params) {
        const proxyConfig = PROXY_CONFIG.proxyServices[this.activeProxy];
        
        if (!proxyConfig) {
            throw new Error(`Proxy ${this.activeProxy} no configurado`);
        }

        // Construir URL de destino
        const targetURL = this.buildTargetURL(apiKey, endpoint, params);
        
        // Ejecutar request según tipo de proxy
        let response;
        
        switch (this.activeProxy) {
            case 'corsProxy':
                response = await this.executeCORSProxyRequest(targetURL, proxyConfig);
                break;
                
            case 'vercel':
            case 'netlify':
            case 'custom':
                response = await this.executeServerlessProxyRequest(targetURL, proxyConfig, apiKey);
                break;
                
            default:
                throw new Error(`Tipo de proxy ${this.activeProxy} no soportado`);
        }

        // Validar y procesar respuesta
        const processedResponse = await this.processProxyResponse(response, apiKey);
        
        // Guardar en cache si es exitosa
        if (processedResponse.success) {
            const cacheKey = this.generateCacheKey(apiKey, endpoint, params);
            this.saveToCache(cacheKey, processedResponse);
        }

        return processedResponse;
    }

    async executeCORSProxyRequest(targetURL, proxyConfig) {
        const fullURL = `${proxyConfig.endpoint}${encodeURIComponent(targetURL)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, PROXY_CONFIG.request.timeout);

        try {
            const response = await fetch(fullURL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...PROXY_CONFIG.security.securityHeaders
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async executeServerlessProxyRequest(targetURL, proxyConfig, apiKey) {
        const requestPayload = {
            url: targetURL,
            apiKey: apiKey,
            timestamp: Date.now(),
            source: 'ciaociao-jewelry-calculator'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, PROXY_CONFIG.request.timeout);

        try {
            const response = await fetch(proxyConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...PROXY_CONFIG.security.securityHeaders
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // =================================================================
    // PROCESAMIENTO DE RESPUESTAS
    // =================================================================

    async processProxyResponse(response, apiKey) {
        if (!response.ok) {
            throw new Error(`Proxy error: HTTP ${response.status}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('Error parsing JSON response from proxy');
        }

        // Validar estructura de respuesta según API
        return this.validateAndNormalizeResponse(data, apiKey);
    }

    validateAndNormalizeResponse(data, apiKey) {
        // Normalizar respuesta según la API de origen
        if (apiKey === 'metals-api') {
            return {
                success: data.success || false,
                rates: data.rates || {},
                timestamp: data.timestamp || Date.now(),
                base: data.base || 'USD',
                source: 'Metals-API (via proxy)',
                proxyUsed: this.activeProxy
            };
        }
        
        if (apiKey === 'metalprice-api') {
            return {
                success: data.success || false,
                rates: data.rates || {},
                timestamp: data.timestamp || Date.now(),
                base: data.base || 'USD',
                source: 'MetalpriceAPI (via proxy)',
                proxyUsed: this.activeProxy
            };
        }

        // Respuesta genérica
        return {
            ...data,
            source: `${apiKey} (via proxy)`,
            proxyUsed: this.activeProxy
        };
    }

    // =================================================================
    // CONSTRUCCIÓN DE URLs Y PARÁMETROS
    // =================================================================

    buildTargetURL(apiKey, endpoint, params) {
        const apiConfig = FALLBACK_CONFIG.apis[apiKey];
        
        if (!apiConfig) {
            throw new Error(`API ${apiKey} no configurada`);
        }

        const baseURL = `${apiConfig.baseURL}${endpoint}`;
        const urlParams = new URLSearchParams({
            access_key: this.getDecryptedAPIKey(apiKey),
            ...params
        });

        return `${baseURL}?${urlParams.toString()}`;
    }

    getDecryptedAPIKey(apiKey) {
        const encryptedKey = PROXY_CONFIG.security.encryptedKeys[apiKey];
        
        if (!encryptedKey) {
            throw new Error(`API key para ${apiKey} no configurada`);
        }

        // Desencriptar (en este caso, simple base64 decode)
        try {
            return atob(encryptedKey);
        } catch (error) {
            throw new Error(`Error desencriptando API key para ${apiKey}`);
        }
    }

    // =================================================================
    // GESTIÓN DE CACHE
    // =================================================================

    generateCacheKey(apiKey, endpoint, params) {
        const paramString = JSON.stringify(params);
        const keyData = `${apiKey}_${endpoint}_${paramString}`;
        
        // Generar hash simple para usar como clave
        let hash = 0;
        for (let i = 0; i < keyData.length; i++) {
            const char = keyData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32-bit integer
        }
        
        return `${PROXY_CONFIG.proxyCache.prefix}${Math.abs(hash)}`;
    }

    getFromCache(cacheKey) {
        if (!PROXY_CONFIG.proxyCache.enabled) {
            return null;
        }

        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < PROXY_CONFIG.proxyCache.ttl) {
            return cached.data;
        }

        // Limpiar cache expirado
        if (cached) {
            this.cache.delete(cacheKey);
        }

        return null;
    }

    saveToCache(cacheKey, data) {
        if (!PROXY_CONFIG.proxyCache.enabled) {
            return;
        }

        // Limpiar cache si está lleno
        if (this.cache.size >= PROXY_CONFIG.proxyCache.maxSize) {
            this.cleanOldestCacheEntries();
        }

        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    }

    cleanOldestCacheEntries() {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Eliminar la mitad más antigua
        const entriesToDelete = Math.floor(entries.length / 2);
        for (let i = 0; i < entriesToDelete; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    setupCacheCleanup() {
        // Limpiar cache expirado cada 10 minutos
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > PROXY_CONFIG.proxyCache.ttl) {
                    this.cache.delete(key);
                }
            }
        }, 600000);
    }

    // =================================================================
    // CONFIGURACIÓN DE SEGURIDAD
    // =================================================================

    loadSecurityConfig() {
        try {
            // Intentar cargar configuración desde localStorage
            const storedConfig = localStorage.getItem('proxy_security_config');
            if (storedConfig) {
                const config = JSON.parse(storedConfig);
                
                // Actualizar API keys encriptadas si están disponibles
                if (config.encryptedKeys) {
                    Object.assign(PROXY_CONFIG.security.encryptedKeys, config.encryptedKeys);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración de seguridad:', error);
        }
    }

    setAPIKey(apiKey, keyValue) {
        // Encriptar y guardar API key
        const encryptedKey = btoa(keyValue);
        PROXY_CONFIG.security.encryptedKeys[apiKey] = encryptedKey;
        
        // Guardar configuración
        this.saveSecurityConfig();
        
        console.log(`🔑 API key configurada para ${apiKey}`);
    }

    saveSecurityConfig() {
        try {
            const configToSave = {
                encryptedKeys: PROXY_CONFIG.security.encryptedKeys,
                timestamp: Date.now()
            };
            
            localStorage.setItem('proxy_security_config', JSON.stringify(configToSave));
        } catch (error) {
            console.warn('⚠️ Error guardando configuración de seguridad:', error);
        }
    }

    // =================================================================
    // MÉTODOS PÚBLICOS
    // =================================================================

    async getMetalPrices(symbols = ['XAU', 'XAG', 'XPT', 'XPD']) {
        try {
            // Intentar con API principal
            return await this.proxyRequest('metals-api', '/latest', {
                base: 'USD',
                symbols: symbols.join(',')
            });
        } catch (error) {
            console.warn('⚠️ Falla en API principal, intentando backup...');
            
            // Intentar con API backup
            return await this.proxyRequest('metalprice-api', '/latest', {
                base: 'USD',
                currencies: symbols.join(',')
            });
        }
    }

    async getHistoricalPrices(date, symbols = ['XAU', 'XAG']) {
        return await this.proxyRequest('metals-api', '/historical', {
            date: date,
            base: 'USD',
            symbols: symbols.join(',')
        });
    }

    getProxyStatus() {
        return {
            initialized: this.initialized,
            activeProxy: this.activeProxy,
            cacheSize: this.cache.size,
            queueSize: this.requestQueue.length,
            processing: this.processing,
            availableProxies: Object.keys(PROXY_CONFIG.proxyServices).filter(key => 
                PROXY_CONFIG.proxyServices[key].enabled
            )
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache del proxy limpiado');
    }

    async switchProxy(proxyKey) {
        if (!PROXY_CONFIG.proxyServices[proxyKey]) {
            throw new Error(`Proxy ${proxyKey} no existe`);
        }

        const isAvailable = await this.testProxy(proxyKey);
        if (!isAvailable) {
            throw new Error(`Proxy ${proxyKey} no está disponible`);
        }

        this.activeProxy = proxyKey;
        console.log(`🔄 Cambiado a proxy: ${proxyKey}`);
    }

    // =================================================================
    // UTILIDADES
    // =================================================================

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    enableProxy(proxyKey) {
        if (PROXY_CONFIG.proxyServices[proxyKey]) {
            PROXY_CONFIG.proxyServices[proxyKey].enabled = true;
            console.log(`✅ Proxy ${proxyKey} habilitado`);
        }
    }

    disableProxy(proxyKey) {
        if (PROXY_CONFIG.proxyServices[proxyKey]) {
            PROXY_CONFIG.proxyServices[proxyKey].enabled = false;
            console.log(`❌ Proxy ${proxyKey} deshabilitado`);
        }
    }
}

// =================================================================
// FUNCIONES SERVERLESS DE EJEMPLO
// =================================================================

const SERVERLESS_EXAMPLES = {
    // Ejemplo para Vercel (api/metals.js)
    vercel: `
    export default async function handler(req, res) {
        // Configurar CORS
        res.setHeader('Access-Control-Allow-Origin', 'https://recibos.ciaociao.mx');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        if (req.method === 'GET' && req.query.path === 'health') {
            return res.json({ status: 'ok', service: 'vercel-proxy' });
        }
        
        try {
            const { url } = req.body;
            const response = await fetch(url);
            const data = await response.json();
            
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    `,
    
    // Ejemplo para Netlify (.netlify/functions/metals.js)
    netlify: `
    exports.handler = async (event, context) => {
        // Configurar CORS
        const headers = {
            'Access-Control-Allow-Origin': 'https://recibos.ciaociao.mx',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };
        
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }
        
        if (event.path === '/.netlify/functions/metals/health') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'ok', service: 'netlify-proxy' })
            };
        }
        
        try {
            const { url } = JSON.parse(event.body);
            const response = await fetch(url);
            const data = await response.json();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
    `
};

// =================================================================
// EXPORTACIÓN E INSTANCIA GLOBAL
// =================================================================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.apiProxyService = new APIProxyService();
    window.SERVERLESS_EXAMPLES = SERVERLESS_EXAMPLES;
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APIProxyService,
        PROXY_CONFIG,
        SERVERLESS_EXAMPLES
    };
}

console.log('✅ Servicio Proxy de APIs v1.0 cargado correctamente');