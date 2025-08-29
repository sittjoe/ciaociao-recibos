# 🛡️ CONFIGURACIÓN DE PROXY SERVERLESS PARA APIS

## Guía de Implementación del Proxy Service

Este documento explica cómo configurar el servicio proxy serverless para manejar las APIs de metales preciosos de forma segura, evitando problemas de CORS y protegiendo las API keys.

## 🚀 OPCIÓN 1: VERCEL FUNCTIONS

### Paso 1: Crear Proyecto en Vercel

```bash
# Crear nuevo proyecto
mkdir ciaociao-api-proxy
cd ciaociao-api-proxy
npm init -y

# Instalar dependencias
npm install vercel

# Crear estructura de carpetas
mkdir api
```

### Paso 2: Crear Function para Metales Preciosos

**Archivo: `api/metals.js`**

```javascript
export default async function handler(req, res) {
    // Configurar CORS para dominios permitidos
    const allowedOrigins = [
        'https://recibos.ciaociao.mx',
        'https://sittjoe.github.io',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Solo permitir POST
    if (req.method !== 'POST') {
        res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
        return;
    }

    try {
        const { params, timestamp, origin: requestOrigin } = req.body;
        
        // Validar parámetros
        if (!params || !params.symbols) {
            throw new Error('Símbolos requeridos');
        }

        const { symbols } = params;

        // Validar símbolos permitidos
        const allowedSymbols = ['XAU', 'XAG', 'XPT', 'XPD'];
        const validSymbols = symbols.filter(s => allowedSymbols.includes(s));
        
        if (validSymbols.length === 0) {
            throw new Error('Símbolos no válidos');
        }

        // Usar API key desde variables de entorno (más seguro)
        const metalsApiKey = process.env.METALS_API_KEY;
        if (!metalsApiKey) {
            throw new Error('API key no configurada');
        }

        // Construir URL de la API
        const apiUrl = new URL('https://metals-api.com/api/latest');
        apiUrl.searchParams.append('access_key', metalsApiKey);
        apiUrl.searchParams.append('base', 'USD');
        apiUrl.searchParams.append('symbols', validSymbols.join(','));

        // Realizar petición a la API
        const response = await fetch(apiUrl.toString(), {
            timeout: 10000 // 10 segundos timeout
        });

        if (!response.ok) {
            throw new Error(`API HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.info || 'Error en API de metales');
        }

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            data: {
                success: data.success,
                timestamp: data.timestamp,
                base: data.base,
                rates: data.rates
            },
            proxyInfo: {
                timestamp: Date.now(),
                symbols: validSymbols,
                source: 'vercel_proxy'
            }
        });

    } catch (error) {
        console.error('Proxy error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}
```

### Paso 3: Crear Function para Tipos de Cambio

**Archivo: `api/exchange.js`**

```javascript
export default async function handler(req, res) {
    // Configurar CORS
    const allowedOrigins = [
        'https://recibos.ciaociao.mx',
        'https://sittjoe.github.io',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }

    try {
        const { params } = req.body;
        const { from = 'USD', to = 'MXN' } = params;

        // Validar monedas
        const allowedCurrencies = ['USD', 'MXN', 'EUR', 'GBP', 'CAD'];
        if (!allowedCurrencies.includes(from) || !allowedCurrencies.includes(to)) {
            throw new Error('Moneda no soportada');
        }

        // Usar servicio gratuito de tipos de cambio
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
            timeout: 8000
        });

        if (!response.ok) {
            throw new Error(`Exchange API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.rates || !data.rates[to]) {
            throw new Error(`Tipo de cambio ${from}/${to} no disponible`);
        }

        res.status(200).json({
            success: true,
            data: {
                success: true,
                base: from,
                rates: { [to]: data.rates[to] },
                timestamp: Date.now()
            },
            proxyInfo: {
                timestamp: Date.now(),
                pair: `${from}/${to}`,
                source: 'vercel_proxy'
            }
        });

    } catch (error) {
        console.error('Exchange proxy error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}
```

### Paso 4: Crear Function de Salud/Testing

**Archivo: `api/health.js`**

```javascript
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const healthCheck = {
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        apis: {
            metals: !!process.env.METALS_API_KEY,
            metalprice: !!process.env.METALPRICE_API_KEY
        }
    };

    res.status(200).json(healthCheck);
}
```

### Paso 5: Configuración de Vercel

**Archivo: `vercel.json`**

```json
{
  "version": 2,
  "name": "ciaociao-api-proxy",
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.js": {
      "memory": 128,
      "maxDuration": 10
    }
  }
}
```

### Paso 6: Variables de Entorno

En el dashboard de Vercel, configurar:

```
METALS_API_KEY=tu_metals_api_key_aqui
METALPRICE_API_KEY=tu_metalprice_api_key_aqui
NODE_ENV=production
```

### Paso 7: Despliegue

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel --prod
```

## 🚀 OPCIÓN 2: NETLIFY FUNCTIONS

### Paso 1: Estructura de Proyecto

```bash
mkdir ciaociao-netlify-proxy
cd ciaociao-netlify-proxy
npm init -y

# Crear estructura
mkdir netlify/functions
```

### Paso 2: Function para Metales

**Archivo: `netlify/functions/metals.js`**

```javascript
exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Manejar preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { params } = JSON.parse(event.body);
        const { symbols } = params;

        const metalsApiKey = process.env.METALS_API_KEY;
        if (!metalsApiKey) {
            throw new Error('API key no configurada');
        }

        const apiUrl = `https://metals-api.com/api/latest?access_key=${metalsApiKey}&symbols=${symbols.join(',')}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: data,
                timestamp: Date.now()
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
```

### Paso 3: Configuración de Netlify

**Archivo: `netlify.toml`**

```toml
[build]
  functions = "netlify/functions"

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

## 🔧 CONFIGURACIÓN EN EL CLIENTE

### Actualizar URLs en el Sistema

```javascript
// En api-proxy-service.js, actualizar PROXY_CONFIG
const PROXY_CONFIG = {
    proxyServices: {
        serverless: {
            name: 'Serverless Functions',
            type: 'serverless',
            endpoints: {
                metals: 'https://tu-proyecto.vercel.app/api/metals',
                exchange: 'https://tu-proyecto.vercel.app/api/exchange'
            },
            fallback: true
        }
    }
};
```

### Configurar API Keys en el Cliente

```javascript
// En la consola del navegador o en código de inicialización
window.apiProxy.configureAPIKeys({
    'metals-api': 'tu_metals_api_key',
    'metalprice-api': 'tu_metalprice_api_key'
});
```

## 🧪 TESTING

### Test Local

```javascript
// Test del proxy
async function testProxy() {
    try {
        const metals = await window.apiProxy.fetchMetalPrices(['XAU', 'XAG']);
        console.log('✅ Metales:', metals);
        
        const exchange = await window.apiProxy.fetchExchangeRate('USD', 'MXN');
        console.log('✅ Cambio:', exchange);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testProxy();
```

### Verificar Salud

```javascript
fetch('https://tu-proyecto.vercel.app/api/health')
    .then(r => r.json())
    .then(console.log);
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] ✅ Crear proyecto en Vercel/Netlify
- [ ] ✅ Implementar functions para metales y cambio
- [ ] ✅ Configurar variables de entorno con API keys
- [ ] ✅ Configurar CORS para dominios permitidos
- [ ] ✅ Desplegar y obtener URLs
- [ ] ✅ Actualizar configuración en cliente
- [ ] ✅ Probar endpoints con test suite
- [ ] ✅ Monitorear logs y rendimiento
- [ ] ✅ Configurar rate limiting si es necesario
- [ ] ✅ Documentar URLs para el equipo

## 🔒 CONSIDERACIONES DE SEGURIDAD

1. **API Keys**: Nunca exponer en el frontend
2. **CORS**: Configurar solo dominios necesarios
3. **Rate Limiting**: Implementar en serverless functions
4. **Validation**: Validar todos los parámetros de entrada
5. **Logging**: No loggear información sensible
6. **Timeouts**: Configurar timeouts apropiados
7. **Error Handling**: No exponer detalles internos

## 💰 COSTOS ESTIMADOS

### Vercel
- **Hobby Plan**: Gratis (100GB bandwidth)
- **Pro Plan**: $20/mes (1TB bandwidth)

### Netlify
- **Starter Plan**: Gratis (100GB bandwidth)
- **Pro Plan**: $19/mes (1TB bandwidth)

### APIs Externas
- **Metals-API**: Gratis hasta 100 req/mes
- **Exchange-API**: Gratis hasta 1000 req/mes

**Total estimado mensual: $0-20 USD**