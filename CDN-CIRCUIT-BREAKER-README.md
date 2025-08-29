# CDN Circuit Breaker System - Enterprise-grade CDN Failure Management

> **Sistema de Circuit Breaker pattern para CDNs integrado con SecurityManager, XSSProtection y BackupManager existentes para ciaociao.mx**

## 🏗️ Arquitectura del Sistema

El sistema CDN Circuit Breaker implementa un patrón de diseño robusto que maneja fallos graciosamente y proporciona alta disponibilidad para recursos CDN críticos.

### Componentes Principales

1. **CDNCircuitBreaker** (`cdn-circuit-breaker.js`)
   - Gestión central de circuit breakers para cada endpoint CDN
   - Load balancing inteligente entre CDNs disponibles
   - Automatic fallback cascade con múltiples CDNs
   - SRI (Subresource Integrity) verification
   - Progressive degradation cuando CDNs fallan

2. **CDNHealthMonitor** (`cdn-health-monitor.js`)
   - Monitoreo continuo de salud de CDNs
   - Detección de anomalías y análisis predictivo
   - Sistema de alertas en tiempo real
   - Métricas comprehensivas de performance

3. **CDNCacheManager** (`cdn-cache-manager.js`)
   - Caching inteligente con múltiples capas
   - Compresión automática de recursos
   - ServiceWorker integration para offline functionality
   - Gestión automática de expiración y limpieza

## 🚀 Características Principales

### ✅ Circuit Breaker Pattern Implementado
- **Estados**: CLOSED, OPEN, HALF_OPEN
- **Configuración**: Failure threshold, recovery timeout, success threshold
- **Auto-recovery**: Transiciones automáticas de estado basadas en métricas

### ✅ Load Balancing Inteligente
- **Estrategias**: Priority-based, Round-robin, Least connections
- **Health-aware**: Considera el estado de salud en la selección
- **Performance-based**: Prioriza endpoints con menor latencia

### ✅ Caching Multinivel
- **Memory Cache**: Acceso ultra-rápido para recursos frecuentes
- **IndexedDB**: Persistencia local para recursos críticos
- **ServiceWorker**: Interceptación y cache de red automático

### ✅ Monitoreo y Alertas
- **Health Checks**: Verificación automática de endpoints
- **Anomaly Detection**: Detección estadística de comportamientos anómalos
- **Trend Analysis**: Análisis predictivo de degradación
- **Real-time Alerts**: Sistema de alertas configurables

### ✅ Integración Seamless
- **SecurityManager**: Reporte de eventos de seguridad
- **XSSProtection**: Fallback methods cuando DOMPurify falla
- **BackupManager**: Inclusion en métricas de backup

## 🔧 Configuración CDN

### Endpoints Configurados

```javascript
const cdnEndpoints = {
    domPurify: [
        {
            name: 'jsdelivr',
            url: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js',
            sri: 'sha384-FqMAQbSBAEx3gU4cymSVxV2tJiuJqrDPIVOTaucb7l5BAJ+3n7NgP7TK+5lw8w6',
            priority: 1,
            timeout: 5000,
            retries: 2
        },
        // ... más endpoints con fallback automático
    ],
    // jsPDF, html2canvas, signaturePad, googleFonts...
};
```

### Configuración de Circuit Breaker

```javascript
config: {
    // Circuit Breaker thresholds
    failureThreshold: 5,        // Fallos para abrir circuito
    recoveryTimeout: 30000,     // 30s antes de intentar recovery
    successThreshold: 3,        // Éxitos necesarios para cerrar circuito
    
    // Performance thresholds
    slowCallThreshold: 10000,   // 10s considerado lento
    slowCallRateThreshold: 0.5, // 50% de llamadas lentas activa acción
    
    // Caching
    enableOfflineCache: true,
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 horas
    maxCacheSize: 50 * 1024 * 1024,       // 50MB
    
    // Health monitoring
    healthCheckInterval: 60000,  // 1 minuto
    performanceWindow: 300000,   // 5 minutos para análisis
}
```

## 📊 Métricas y Monitoreo

### Circuit Breaker Metrics
- **Estado**: CLOSED/OPEN/HALF_OPEN por endpoint
- **Failure Count**: Número de fallos consecutivos
- **Success Rate**: Tasa de éxito por endpoint
- **Average Response Time**: Latencia promedio
- **Error Rate**: Porcentaje de errores

### Health Monitor Metrics
- **Availability**: Porcentaje de disponibilidad
- **Performance Trends**: Análisis de tendencias
- **Anomaly Detection**: Detección automática de anomalías
- **Predictive Analysis**: Predicción de fallos

### Cache Metrics
- **Hit Rate**: Tasa de aciertos de cache
- **Storage Utilization**: Uso de almacenamiento
- **Compression Ratio**: Eficiencia de compresión
- **Evictions**: Expulsiones de cache

## 🎯 API Pública

### CDN Circuit Breaker

```javascript
// Cargar biblioteca con circuit breaker protection
const result = await cdnCircuitBreaker.loadLibrary('domPurify');
if (result.success) {
    console.log(`Loaded from ${result.source} in ${result.duration}ms`);
}

// Obtener estado del sistema
const status = cdnCircuitBreaker.getSystemStatus();
console.log('Circuit Breakers:', status.circuitBreakers.length);
console.log('Cache Size:', status.cache.size);

// Control manual de circuit breakers
cdnCircuitBreaker.openCircuit('domPurify', 'jsdelivr');
cdnCircuitBreaker.closeCircuit('domPurify', 'jsdelivr');

// Configuración dinámica
cdnCircuitBreaker.updateConfig({
    failureThreshold: 3,
    recoveryTimeout: 15000
});
```

### Health Monitor

```javascript
// Obtener reporte de salud
const healthReport = cdnHealthMonitor.getHealthStatus('domPurify_jsdelivr');
console.log('Health Score:', healthReport.health.score);
console.log('Availability:', healthReport.availability.percentage);

// Alertas activas
const alerts = cdnHealthMonitor.getActiveAlerts();
if (alerts.length > 0) {
    console.warn('Active Alerts:', alerts);
}

// Configurar umbrales de alerta
cdnHealthMonitor.updateAlertThresholds({
    errorRate: 0.03,      // 3% error rate
    latency: 3000,        // 3s latency
    availability: 0.98    // 98% availability
});
```

### Cache Manager

```javascript
// Estadísticas de cache
const cacheStats = cdnCacheManager.getStats();
console.log('Hit Rate:', cacheStats.hitRate);
console.log('Storage Used:', cacheStats.size);

// Listar elementos en cache
const cachedItems = cdnCacheManager.listCachedItems();
cachedItems.forEach(item => {
    console.log(`${item.key}: ${item.size} (${item.accessCount} accesses)`);
});

// Limpieza manual
await cdnCacheManager.forceCleanup();

// Exportar/importar cache
const cacheData = await cdnCacheManager.exportCache();
await cdnCacheManager.importCache(cacheData);
```

## 🔄 Integración con Sistemas Existentes

### SecurityManager Integration

```javascript
// Auto-integration con SecurityManager
if (window.securityManager) {
    // CDN events son reportados automáticamente
    securityManager.getCDNStatus = () => cdnCircuitBreaker.getSystemStatus();
    
    // Events de seguridad CDN
    securityManager.reportSecurityEvent({
        type: 'CDN_SYSTEM_EVENT',
        subtype: 'CIRCUIT_OPENED',
        data: { breakerId: 'domPurify_jsdelivr' }
    });
}
```

### XSSProtection Integration

```javascript
// Fallback automático cuando DOMPurify falla
if (domPurifyLoadFailed && window.xssProtection) {
    xssProtection.setupFallbackProtection();
    console.log('XSS Protection fallback activated');
}
```

### BackupManager Integration

```javascript
// Métricas CDN incluidas en backup
if (window.backupManager) {
    backupManager.addMetricsProvider('cdn_circuit_breaker', () => {
        return cdnCircuitBreaker.getMetrics();
    });
}
```

## 🎮 Demo y Testing

### Demo Interactivo
Abre `cdn-circuit-breaker-demo.html` para ver el sistema en acción:

- **Dashboard en tiempo real** con métricas de sistema
- **Circuit breakers status** con estados visuales
- **Health alerts** y notificaciones
- **Controles de testing** para simular fallos
- **System log** en tiempo real

### Test Controls
```javascript
// Cargar bibliotecas específicas
loadLibrary('domPurify');
loadLibrary('jsPDF');

// Simular fallo de CDN
simulateFailure();

// Limpiar cache
clearCache();

// Actualizar estado
refreshStatus();
```

### Development Helper
**Atajo de teclado**: `Ctrl+Shift+C` para ver estado completo del sistema en consola.

## 🛡️ Security Features

### SRI (Subresource Integrity)
- **Verification**: Verificación automática de integridad de recursos
- **Fallback**: Retry sin SRI si verification falla (configurable)
- **Strict Mode**: Modo estricto que rechaza recursos sin SRI válido

### XSS Protection
- **Content Sanitization**: Sanitización automática de contenido cargado
- **Fallback Methods**: Métodos de fallback cuando DOMPurify no está disponible
- **Security Events**: Reporte automático de eventos de seguridad

### Network Security
- **HTTPS Enforcement**: Preferencia por conexiones seguras
- **CORS Handling**: Manejo adecuado de Cross-Origin requests
- **Timeout Protection**: Timeouts configurables para prevenir hanging requests

## 📈 Performance Optimization

### Intelligent Caching
- **Multi-layer**: Memory → IndexedDB → ServiceWorker → Network
- **Compression**: Compresión automática con múltiples algoritmos
- **Prefetching**: Precarga inteligente de recursos críticos
- **LRU Eviction**: Expulsión basada en Least Recently Used

### Load Balancing
- **Health-aware**: Selección basada en health status
- **Performance-based**: Priorización por latencia y throughput
- **Geographic**: Consideración de proximidad geográfica (futuro)

### Monitoring Optimization
- **Adaptive Intervals**: Intervalos de monitoreo adaptativos
- **Batch Processing**: Procesamiento en lotes para eficiencia
- **Memory Management**: Gestión automática de memoria para métricas

## 🔧 Configuración Avanzada

### Custom Endpoints
```javascript
// Agregar endpoints personalizados
cdnCircuitBreaker.addEndpoint('customLibrary', {
    name: 'custom_cdn',
    url: 'https://custom-cdn.com/library.js',
    sri: 'sha384-...',
    priority: 1,
    timeout: 5000,
    retries: 3
});
```

### Custom Health Checks
```javascript
// Health check personalizado
cdnHealthMonitor.addCustomHealthCheck('customLibrary', async (endpoint) => {
    // Custom health verification logic
    const response = await fetch(endpoint.url + '/health');
    return response.ok;
});
```

### Custom Cache Strategies
```javascript
// Estrategia de cache personalizada
cdnCacheManager.updateConfig({
    cleanupStrategy: 'CUSTOM',
    customCleanup: (entries) => {
        // Custom cleanup logic
        return entries.filter(entry => entry.priority > 5);
    }
});
```

## 📊 Monitoring Dashboard

El sistema incluye un dashboard comprehensivo que muestra:

### System Overview
- **System Status**: Estado general del sistema
- **Circuit Count**: Número de circuit breakers activos
- **Cache Utilization**: Uso de cache y hit rate
- **Performance Metrics**: Latencia, throughput, success rate

### Circuit Breaker Details
- **Individual Status**: Estado de cada circuit breaker
- **Health Indicators**: Indicadores visuales de salud
- **Performance History**: Historial de performance por endpoint
- **Failure Patterns**: Patrones de fallo y recovery

### Health Monitoring
- **Active Alerts**: Alertas activas por severidad
- **Trend Analysis**: Análisis de tendencias y predicciones
- **Anomaly Detection**: Detección de anomalías en tiempo real
- **Performance Degradation**: Alertas de degradación

### Cache Analytics
- **Hit/Miss Ratios**: Ratios de acierto y fallo de cache
- **Storage Utilization**: Uso de diferentes capas de storage
- **Compression Efficiency**: Eficiencia de compresión
- **Eviction Patterns**: Patrones de expulsión de cache

## 🚨 Troubleshooting

### Common Issues

#### Circuit Breaker Not Opening
```javascript
// Check failure threshold
const config = cdnCircuitBreaker.config;
console.log('Failure Threshold:', config.failureThreshold);

// Check current failure count
const breaker = cdnCircuitBreaker.circuitBreakers.get('domPurify_jsdelivr');
console.log('Current Failures:', breaker.failureCount);
```

#### High Cache Miss Rate
```javascript
// Check cache configuration
const cacheStats = cdnCacheManager.getStats();
console.log('Cache Hit Rate:', cacheStats.hitRate);
console.log('Cache Size:', cacheStats.size);

// Check TTL settings
console.log('Cache TTL:', cdnCacheManager.config.defaultTTL);
```

#### Health Monitoring Not Working
```javascript
// Check health monitor status
const healthStatus = cdnHealthMonitor.getHealthStatus();
console.log('Health Monitor Active:', healthStatus !== null);

// Check alert thresholds
console.log('Alert Thresholds:', cdnHealthMonitor.config.alertThresholds);
```

### Debug Mode
```javascript
// Enable debug logging
cdnCircuitBreaker.updateConfig({ logLevel: 'DEBUG' });
cdnHealthMonitor.updateConfig({ logging: true });
cdnCacheManager.updateConfig({ enableMetrics: true });
```

### Performance Profiling
```javascript
// Get performance metrics
const metrics = cdnCircuitBreaker.getMetrics();
console.log('Performance History:', metrics.performanceHistory);

// Get detailed health report
const healthReport = cdnHealthMonitor.generateHealthReport('domPurify_jsdelivr');
console.log('Health Report:', healthReport);
```

## 🔄 Migration Guide

### From Legacy CDN Loading

**Before:**
```javascript
// Old hardcoded CDN loading
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js';
document.head.appendChild(script);
```

**After:**
```javascript
// New circuit breaker loading
const result = await cdnCircuitBreaker.loadLibrary('domPurify');
if (result.success) {
    console.log('DOMPurify loaded with circuit breaker protection');
}
```

### Integration Steps

1. **Include Scripts**: Add CDN Circuit Breaker scripts
2. **Update Loading**: Replace direct CDN calls
3. **Configure Endpoints**: Set up your CDN endpoints
4. **Enable Monitoring**: Activate health monitoring
5. **Test Fallbacks**: Verify fallback behavior

## 📚 Best Practices

### Performance
- **Prefetch Critical Resources**: Use prefetching for critical libraries
- **Configure Appropriate TTLs**: Set cache TTLs based on update frequency
- **Monitor Health Regularly**: Keep health checks active
- **Use Compression**: Enable compression for large resources

### Reliability
- **Multiple CDN Providers**: Configure multiple CDN sources
- **Appropriate Thresholds**: Set realistic failure thresholds
- **Quick Recovery**: Configure reasonable recovery timeouts
- **Graceful Degradation**: Implement fallback functionality

### Security
- **Enable SRI**: Always use Subresource Integrity when possible
- **HTTPS Only**: Prefer HTTPS endpoints
- **Content Validation**: Validate loaded content
- **Regular Updates**: Keep CDN URLs and SRI hashes updated

### Monitoring
- **Active Alerts**: Configure meaningful alerts
- **Regular Reviews**: Review metrics regularly
- **Trend Analysis**: Monitor performance trends
- **Capacity Planning**: Plan for growth and scaling

## 🔮 Future Enhancements

### Planned Features
- **Geographic Load Balancing**: CDN selection based on user location
- **ML-based Prediction**: Machine learning for failure prediction
- **Advanced Compression**: Better compression algorithms
- **Real-time Dashboard**: Web-based monitoring dashboard
- **API Gateway Integration**: Integration with API gateways
- **Kubernetes Integration**: Native Kubernetes support

### Extensibility
- **Plugin System**: Support for custom plugins
- **Webhook Support**: Webhook notifications for events
- **Custom Metrics**: Support for custom metric collection
- **Third-party Integration**: Integration with monitoring services

---

## 📞 Support

Para soporte técnico o consultas sobre el sistema CDN Circuit Breaker:

- **Logs**: Use `Ctrl+Shift+C` para diagnóstico completo
- **Demo**: Prueba `cdn-circuit-breaker-demo.html` para testing
- **Debug**: Enable debug mode para logging detallado
- **Metrics**: Revisa métricas en tiempo real para troubleshooting

**Sistema desarrollado para ciaociao.mx - Enterprise-grade CDN failure management**

---

*© 2025 ciaociao.mx - Sistema CDN Circuit Breaker v1.0.0*
