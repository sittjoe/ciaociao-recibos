// mode-selector.js - Controlador del selector de modo principal

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeModeSelector();
});

function initializeModeSelector() {
    try {
        console.log('🚀 Iniciando selector de modo...');
        
        // Cargar estadísticas
        loadStatistics();
        
        // Configurar event listeners
        setupSelectorEventListeners();
        
        // Verificar si viene de un modo específico
        checkReturnMode();
        
        console.log('✅ Selector de modo inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando selector:', error);
    }
}

function loadStatistics() {
    try {
        // Cargar estadísticas de recibos
        const receipts = JSON.parse(localStorage.getItem('receipts_ciaociao') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayReceipts = receipts.filter(r => r.receiptDate === today).length;
        
        const receiptStats = document.getElementById('receiptStats');
        if (receiptStats) {
            receiptStats.innerHTML = `
                <span class="stat-item">Total: <strong>${receipts.length}</strong></span>
                <span class="stat-item">Hoy: <strong>${todayReceipts}</strong></span>
            `;
        }
        
        // Cargar estadísticas de cotizaciones
        const quotations = JSON.parse(localStorage.getItem('quotations_ciaociao') || '[]');
        const pendingQuotes = quotations.filter(q => q.status === 'pending').length;
        
        const quotationStats = document.getElementById('quotationStats');
        if (quotationStats) {
            quotationStats.innerHTML = `
                <span class="stat-item">Total: <strong>${quotations.length}</strong></span>
                <span class="stat-item">Pendientes: <strong>${pendingQuotes}</strong></span>
            `;
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

function setupSelectorEventListeners() {
    try {
        // Botón de cerrar sesión
        const logoutBtn = document.getElementById('logoutBtnSelector');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (window.authManager) {
                    window.authManager.logout();
                } else {
                    // Fallback si authManager no está disponible
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('sessionExpiry');
                    window.location.reload();
                }
            });
        }
        
        // Animación al cargar
        animateCards();
        
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

function selectMode(mode) {
    try {
        console.log(`🔄 Navegando al modo: ${mode}`);
        
        // Guardar modo seleccionado para análisis
        localStorage.setItem('lastSelectedMode', mode);
        localStorage.setItem('modeSelectedAt', new Date().toISOString());
        
        // Navegar según el modo
        if (mode === 'receipt') {
            window.location.href = 'receipt-mode.html';
        } else if (mode === 'quotation') {
            window.location.href = 'quotation-mode.html';
        }
        
    } catch (error) {
        console.error('❌ Error seleccionando modo:', error);
        alert('Error al cambiar de modo. Por favor intenta de nuevo.');
    }
}

function animateCards() {
    try {
        // Agregar animación de entrada a las tarjetas
        const cards = document.querySelectorAll('.mode-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            }, index * 150);
        });
        
    } catch (error) {
        console.error('❌ Error animando tarjetas:', error);
    }
}

function checkReturnMode() {
    try {
        // Verificar si el usuario viene de completar una acción
        const returnFrom = localStorage.getItem('returnFrom');
        if (returnFrom) {
            showWelcomeBack(returnFrom);
            localStorage.removeItem('returnFrom');
        }
        
    } catch (error) {
        console.error('❌ Error verificando modo de retorno:', error);
    }
}

function showWelcomeBack(mode) {
    try {
        // Mostrar mensaje de bienvenida personalizado
        const message = mode === 'receipt' ? 
            '✅ Recibo guardado exitosamente' : 
            '✅ Cotización guardada exitosamente';
        
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('❌ Error mostrando mensaje de bienvenida:', error);
    }
}

function showNotification(message, type = 'info') {
    try {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
    }
}

// Función para análisis de uso (opcional)
function trackModeUsage() {
    try {
        const usage = JSON.parse(localStorage.getItem('modeUsage') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        if (!usage[today]) {
            usage[today] = { receipt: 0, quotation: 0 };
        }
        
        return usage;
        
    } catch (error) {
        console.error('❌ Error rastreando uso:', error);
        return {};
    }
}

// Exportar función global para uso en onclick
window.selectMode = selectMode;

// Estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);