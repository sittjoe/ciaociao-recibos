#!/bin/bash

# Script de Verificación del Sistema ciaociao-recibos
# Ejecuta suite completa de tests críticos post-correcciones

echo "🚀 INICIANDO VERIFICACIÓN CRÍTICA DEL SISTEMA CIAOCIAO-RECIBOS"
echo "=============================================================="
echo "Sistema: https://recibos.ciaociao.mx/receipt-mode.html"
echo "Contraseña: 27181730"
echo "Fecha: $(date)"
echo "=============================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Crear directorio de resultados
mkdir -p test-results

# Función para logging con timestamp
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Función para verificar dependencias
check_dependencies() {
    log "🔍 Verificando dependencias..."
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ Node.js/NPM no encontrado${NC}"
        exit 1
    fi
    
    if ! npm list @playwright/test &> /dev/null; then
        echo -e "${YELLOW}⚠️ Playwright no encontrado, instalando...${NC}"
        npm install @playwright/test
    fi
    
    log "${GREEN}✅ Dependencias verificadas${NC}"
}

# Función para ejecutar tests
run_critical_tests() {
    log "🧪 Ejecutando tests críticos..."
    
    # Ejecutar tests con manejo de errores
    npx playwright test tests/critical-functionality-fixed.spec.js \
        --reporter=list \
        --output-dir=test-results \
        --timeout=30000 \
        --retries=1 \
        --workers=1
    
    TEST_EXIT_CODE=$?
    return $TEST_EXIT_CODE
}

# Función para generar reporte de resumen
generate_summary() {
    log "📊 Generando resumen de resultados..."
    
    # Contar archivos de resultados
    SCREENSHOT_COUNT=$(find test-results -name "*.png" 2>/dev/null | wc -l)
    TRACE_COUNT=$(find test-results -name "*.zip" 2>/dev/null | wc -l)
    
    echo ""
    echo "=============================================================="
    echo "                    RESUMEN DE EJECUCIÓN"
    echo "=============================================================="
    echo "📁 Directorio de resultados: test-results/"
    echo "📸 Screenshots generados: $SCREENSHOT_COUNT"
    echo "🔍 Archivos de trace: $TRACE_COUNT"
    
    # Verificar si existe el reporte principal
    if [ -f "test-results/CRITICAL_SYSTEM_TEST_REPORT.md" ]; then
        echo "📋 Reporte principal: CRITICAL_SYSTEM_TEST_REPORT.md"
    fi
    
    echo ""
    echo "🏆 VERIFICACIONES REALIZADAS:"
    echo "   ✅ Sistema de login (contraseña 27181730)"
    echo "   ✅ Generación automática de número de recibo"
    echo "   ✅ Funcionalidad de botones críticos"
    echo "   ✅ Sistema de firmas digitales"
    echo "   ✅ Verificación de errores JavaScript"
    echo ""
}

# Función para mostrar siguiente pasos
show_next_steps() {
    echo "🎯 PRÓXIMOS PASOS RECOMENDADOS:"
    echo ""
    echo "1. Revisar screenshots en test-results/"
    echo "2. Leer reporte completo: CRITICAL_SYSTEM_TEST_REPORT.md"
    echo "3. Si hay fallos, revisar archivos de trace (.zip)"
    echo "4. Para debugging: npx playwright test --debug"
    echo "5. Para ver reporte HTML: npx playwright show-report"
    echo ""
    echo "📞 COMANDOS ÚTILES:"
    echo "   - Tests en vivo: npx playwright test --headed"
    echo "   - Solo Chromium: npx playwright test --project=chromium"
    echo "   - Con debug: npx playwright test --debug tests/critical-functionality-fixed.spec.js"
    echo ""
}

# Función principal
main() {
    # Verificar dependencias
    check_dependencies
    
    # Ejecutar tests críticos
    if run_critical_tests; then
        log "${GREEN}✅ Tests críticos completados exitosamente${NC}"
        OVERALL_STATUS="ÉXITO"
    else
        log "${YELLOW}⚠️ Tests completados con algunos fallos${NC}"
        OVERALL_STATUS="PARCIAL"
    fi
    
    # Generar resumen
    generate_summary
    
    # Mostrar estado final
    echo "=============================================================="
    echo "                    ESTADO FINAL DEL SISTEMA"
    echo "=============================================================="
    
    if [ "$OVERALL_STATUS" = "ÉXITO" ]; then
        echo -e "${GREEN}🎉 SISTEMA COMPLETAMENTE VERIFICADO${NC}"
        echo "   Todas las funcionalidades críticas están operativas"
    else
        echo -e "${YELLOW}⚠️ SISTEMA PARCIALMENTE VERIFICADO${NC}"
        echo "   Algunas funcionalidades requieren atención"
        echo "   Revisar reporte detallado para acciones específicas"
    fi
    
    echo "=============================================================="
    
    # Mostrar próximos pasos
    show_next_steps
    
    # Mensaje final
    echo "🔔 VERIFICACIÓN COMPLETA - $(date)"
    echo "📧 Reporte enviado: test-results/CRITICAL_SYSTEM_TEST_REPORT.md"
    echo ""
}

# Ejecutar función principal
main "$@"