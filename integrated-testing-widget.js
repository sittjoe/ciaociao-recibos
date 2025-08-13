// integrated-testing-widget.js - Widget de testing integrado para la página real
// Se ejecuta dentro de quotation-mode.html para testing en vivo

class IntegratedTestingWidget {
    constructor() {
        this.isVisible = false;
        this.results = { passed: 0, failed: 0 };
        this.tests = [];
        
        this.setupTests();
        this.createWidget();
        this.setupKeyboardShortcut();
        
        console.log('🧪 [TESTING] Widget de testing integrado listo (Ctrl+Shift+T para abrir)');
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleWidget();
            }
        });
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'testing-widget';
        widget.innerHTML = `
            <div class="testing-widget-content">
                <div class="testing-header">
                    <h3>🧪 Testing Widget</h3>
                    <button id="closeTestingWidget" class="close-btn">×</button>
                </div>
                <div class="testing-controls">
                    <button id="runQuickTests" class="test-btn">⚡ Tests Rápidos</button>
                    <button id="runAllTests" class="test-btn">🚀 Todos los Tests</button>
                    <button id="clearResults" class="test-btn">🧹 Limpiar</button>
                </div>
                <div class="testing-results">
                    <div class="results-summary">
                        <span id="passedCount">0</span> ✅ | <span id="failedCount">0</span> ❌
                    </div>
                    <div id="testOutput" class="test-output"></div>
                </div>
            </div>
        `;

        // Estilos para el widget
        const style = document.createElement('style');
        style.textContent = `
            #testing-widget {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 350px;
                background: white;
                border: 2px solid #007bff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 12px;
                display: none;
            }
            .testing-widget-content {
                padding: 15px;
            }
            .testing-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .testing-header h3 {
                margin: 0;
                color: #007bff;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
            }
            .testing-controls {
                margin-bottom: 10px;
            }
            .test-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 5px;
                font-size: 11px;
            }
            .test-btn:hover {
                background: #0056b3;
            }
            .results-summary {
                background: #f8f9fa;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
                margin-bottom: 10px;
                font-weight: bold;
            }
            .test-output {
                max-height: 200px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 10px;
                background: #2c3e50;
                color: #00ff00;
                padding: 8px;
                border-radius: 4px;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);

        // Event listeners
        document.getElementById('closeTestingWidget').onclick = () => this.hideWidget();
        document.getElementById('runQuickTests').onclick = () => this.runQuickTests();
        document.getElementById('runAllTests').onclick = () => this.runAllTests();
        document.getElementById('clearResults').onclick = () => this.clearResults();
    }

    setupTests() {
        this.tests = [
            {
                name: 'SystemManager disponible',
                critical: true,
                test: () => typeof window.systemManager === 'object' && window.systemManager !== null
            },
            {
                name: 'initializeQuotationSystem existe',
                critical: true,
                test: () => typeof window.initializeQuotationSystem === 'function'
            },
            {
                name: 'QuotationDatabase disponible',
                critical: true,
                test: () => typeof window.QuotationDatabase === 'function'
            },
            {
                name: 'Campo quotationNumber visible',
                critical: true,
                test: () => {
                    const el = document.getElementById('quotationNumber');
                    return el && el.offsetParent !== null;
                }
            },
            {
                name: 'Botón addProductBtn funcional',
                critical: true,
                test: () => {
                    const el = document.getElementById('addProductBtn');
                    return el && el.offsetParent !== null && (el.onclick || el.addEventListener);
                }
            },
            {
                name: 'Formulario quotationForm accesible',
                critical: true,
                test: () => {
                    const el = document.getElementById('quotationForm');
                    return el && el.offsetParent !== null;
                }
            },
            {
                name: 'Número de cotización generado',
                critical: true,
                test: () => {
                    const el = document.getElementById('quotationNumber');
                    return el && el.value && el.value.includes('COTIZ-');
                }
            },
            {
                name: 'Sistema de monitoreo activo',
                critical: false,
                test: () => typeof window.realTimeMonitor === 'object' && window.realTimeMonitor !== null
            },
            {
                name: 'Sistema de recuperación listo',
                critical: false,
                test: () => typeof window.rollbackRecovery === 'object' && window.rollbackRecovery !== null
            },
            {
                name: 'Modal productos disponible',
                critical: false,
                test: () => {
                    const el = document.getElementById('addProductModal');
                    return el !== null;
                }
            }
        ];
    }

    toggleWidget() {
        if (this.isVisible) {
            this.hideWidget();
        } else {
            this.showWidget();
        }
    }

    showWidget() {
        document.getElementById('testing-widget').style.display = 'block';
        this.isVisible = true;
        this.log('🧪 Widget de testing abierto (Ctrl+Shift+T para cerrar)');
    }

    hideWidget() {
        document.getElementById('testing-widget').style.display = 'none';
        this.isVisible = false;
    }

    async runQuickTests() {
        this.log('⚡ Ejecutando tests críticos...');
        const criticalTests = this.tests.filter(test => test.critical);
        await this.executeTests(criticalTests);
    }

    async runAllTests() {
        this.log('🚀 Ejecutando todos los tests...');
        await this.executeTests(this.tests);
    }

    async executeTests(testsToRun) {
        this.results = { passed: 0, failed: 0 };
        
        for (const test of testsToRun) {
            this.log(`🔍 Testing: ${test.name}...`);
            
            try {
                const result = await test.test();
                if (result) {
                    this.results.passed++;
                    this.log(`✅ ${test.name}: APROBADO`);
                } else {
                    this.results.failed++;
                    this.log(`❌ ${test.name}: FALLIDO`);
                }
            } catch (error) {
                this.results.failed++;
                this.log(`❌ ${test.name}: ERROR - ${error.message}`);
            }
            
            // Pequeña pausa para visualización
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.updateSummary();
        this.log(`🏁 Completo: ${this.results.passed} ✅ | ${this.results.failed} ❌`);
        
        if (this.results.failed === 0) {
            this.log('🎉 ¡TODOS LOS TESTS APROBADOS! Sistema funcionando correctamente.');
        } else {
            this.log(`⚠️ ${this.results.failed} tests fallaron. Revisar implementación.`);
        }
    }

    updateSummary() {
        document.getElementById('passedCount').textContent = this.results.passed;
        document.getElementById('failedCount').textContent = this.results.failed;
    }

    clearResults() {
        document.getElementById('testOutput').innerHTML = '';
        this.results = { passed: 0, failed: 0 };
        this.updateSummary();
        this.log('🧹 Resultados limpiados');
    }

    log(message) {
        const output = document.getElementById('testOutput');
        const timestamp = new Date().toLocaleTimeString();
        output.innerHTML += `[${timestamp}] ${message}<br>`;
        output.scrollTop = output.scrollHeight;
        console.log(`[TESTING] ${message}`);
    }
}

// Inicializar widget automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que otros sistemas estén listos
    setTimeout(() => {
        if (!window.testingWidget) {
            window.testingWidget = new IntegratedTestingWidget();
        }
    }, 2000);
});

// Exponer funciones útiles globalmente
window.runQuickTests = () => {
    if (window.testingWidget) {
        window.testingWidget.showWidget();
        window.testingWidget.runQuickTests();
    }
};

window.runAllTests = () => {
    if (window.testingWidget) {
        window.testingWidget.showWidget();
        window.testingWidget.runAllTests();
    }
};

console.log('🧪 integrated-testing-widget.js cargado');