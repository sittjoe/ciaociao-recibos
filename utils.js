// utils.js - Funciones de utilidad y validación
class Utils {
    constructor() {
        this.initializeUtils();
    }

    initializeUtils() {
        console.log('✅ Utilidades inicializadas');
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
    }

    // ==================== VALIDACIONES ====================
    
    // Validar email
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Validar teléfono mexicano
    validatePhone(phone) {
        // Eliminar espacios y caracteres especiales
        const cleaned = phone.replace(/\D/g, '');
        
        // Verificar longitud (10 dígitos para México sin código de país)
        if (cleaned.length === 10) {
            return true;
        }
        
        // Con código de país (52 + 10 dígitos)
        if (cleaned.length === 12 && cleaned.startsWith('52')) {
            return true;
        }
        
        // Con código de país y 1 (521 + 10 dígitos)
        if (cleaned.length === 13 && cleaned.startsWith('521')) {
            return true;
        }
        
        return false;
    }

    // Validar RFC mexicano
    validateRFC(rfc) {
        const regex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
        return regex.test(rfc.toUpperCase());
    }

    // Validar campos requeridos
    validateRequiredFields(fields) {
        const errors = [];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element) {
                errors.push(`Campo no encontrado: ${field.id}`);
                return;
            }
            
            const value = element.value.trim();
            
            if (!value) {
                errors.push(`${field.label} es requerido`);
                this.highlightError(element);
            } else {
                this.removeHighlight(element);
            }
            
            // Validaciones específicas
            if (field.type === 'email' && value && !this.validateEmail(value)) {
                errors.push(`${field.label} no es válido`);
                this.highlightError(element);
            }
            
            if (field.type === 'phone' && value && !this.validatePhone(value)) {
                errors.push(`${field.label} no es válido`);
                this.highlightError(element);
            }
            
            if (field.type === 'number' && value) {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0) {
                    errors.push(`${field.label} debe ser un número positivo`);
                    this.highlightError(element);
                }
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Sanitize all form inputs on a page
     */
    sanitizeAllInputs() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea');
        
        inputs.forEach(input => {
            // Sanitización básica sin dependencias externas
            if (input.value && typeof input.value === 'string') {
                input.value = input.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
        });
        
        console.log(`🧹 Sanitized ${inputs.length} input fields`);
    }
    
    /**
     * Setup real-time sanitization for new inputs
     */
    setupRealTimeSanitization() {
        // Monitor for new input fields
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const inputs = node.querySelectorAll ? 
                                node.querySelectorAll('input, textarea') : 
                                (node.tagName && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') ? [node] : []);
                            
                            inputs.forEach(input => {
                                this.setupInputSanitization(input);
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        // Setup existing inputs
        document.querySelectorAll('input, textarea').forEach(input => {
            this.setupInputSanitization(input);
        });
    }
    
    /**
     * Setup sanitization for a specific input
     */
    setupInputSanitization(input) {
        // Remove existing listeners to avoid duplicates
        input.removeEventListener('input', input._sanitizeHandler);
        input.removeEventListener('paste', input._pasteHandler);
        
        // Input event handler
        input._sanitizeHandler = (e) => {
            setTimeout(() => {
                if (e.target.value && typeof e.target.value === 'string') {
                    e.target.value = e.target.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                }
            }, 10);
        };
        
        // Paste event handler
        input._pasteHandler = (e) => {
            setTimeout(() => {
                if (e.target.value && typeof e.target.value === 'string') {
                    e.target.value = e.target.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                }
            }, 50);
        };
        
        input.addEventListener('input', input._sanitizeHandler);
        input.addEventListener('paste', input._pasteHandler);
    }
    
    /**
     * Get sanitization metrics
     */
    getSanitizationMetrics() {
        if (this.xssProtection) {
            return this.xssProtection.getMetrics();
        }
        
        return {
            status: 'XSS Protection not available',
            fallbackMode: true
        };
    }
    
    /**
     * Enhanced notification with security context
     */
    showSecurityNotification(message, type = 'warning', duration = 5000) {
        this.showNotification('🛡️ ' + message, type, duration);
        
        // Log security-related notifications
        if (window.securityManager) {
            window.securityManager.reportSecurityEvent?.({ 
                type: 'user_notification', 
                message: message, 
                level: type 
            });
        }
    }
    
    /**
     * Initialize real-time sanitization when Utils is ready
     */
    initializeSecurityFeatures() {
        this.setupRealTimeSanitization();
        this.sanitizeAllInputs();
        
        console.log('🛡️ Utils security features initialized');
    }

    // Resaltar campo con error
    highlightError(element) {
        element.style.borderColor = '#E74C3C';
        element.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
    }

    // Quitar resaltado de error
    removeHighlight(element) {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }

    // ==================== FORMATEO ====================
    
    // Formatear teléfono
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        
        if (cleaned.length === 12 && cleaned.startsWith('52')) {
            return cleaned.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3 $4');
        }
        
        return phone;
    }

    // Formatear fecha
    formatDate(date, format = 'long') {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (format === 'long') {
            return d.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (format === 'short') {
            return d.toLocaleDateString('es-MX');
        } else if (format === 'time') {
            return d.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (format === 'full') {
            return d.toLocaleString('es-MX');
        }
        
        return d.toLocaleDateString('es-MX');
    }

    // Formatear moneda
    formatCurrency(amount) {
        // Validate input and handle edge cases
        if (amount === null || amount === undefined || amount === '') {
            return '$0.00';
        }
        
        // Convert to number if it's a string - handle comma-separated values
        let numericAmount;
        if (typeof amount === 'string') {
            // Remove any existing formatting (commas, $, spaces)
            const cleanAmount = amount.replace(/[$,\s]/g, '');
            numericAmount = parseFloat(cleanAmount);
        } else {
            numericAmount = Number(amount);
        }
        
        // Handle NaN and invalid numbers
        if (isNaN(numericAmount)) {
            console.warn('⚠️ formatCurrency: Invalid amount:', amount);
            return '$0.00';
        }
        
        // Debug logging for large numbers
        if (numericAmount >= 1000) {
            console.log(`💰 formatCurrency: ${amount} → ${numericAmount}`);
        }
        
        // CRITICAL FIX: Ensure consistent formatting with proper thousands separators and EXACTLY 2 decimals
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true  // Explicitly ensure thousands separators
        }).format(numericAmount);
        
        // DOUBLE CHECK: Ensure exactly 2 decimal places (fix .0 to .00)
        const decimalFixed = formatted.replace(/\.(\d)$/, '.$10'); // $10,000.0 → $10,000.00
        
        console.log(`💰 FORMAT CHECK: ${numericAmount} → ${formatted} → ${decimalFixed}`);
        
        // Validation: ensure format is correct (contains comma for thousands and .00 decimals)
        if (numericAmount >= 1000 && !decimalFixed.includes(',')) {
            console.error('❌ formatCurrency: Missing thousands separator!', { amount, decimalFixed });
        }
        if (!decimalFixed.includes('.') || !decimalFixed.match(/\.\d{2}$/)) {
            console.error('❌ formatCurrency: Missing or incorrect decimal format!', { amount, decimalFixed });
        }
        
        return decimalFixed;
    }

    // Formatear número con separadores
    formatNumber(number) {
        return new Intl.NumberFormat('es-MX').format(number);
    }

    // Capitalizar texto
    capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    // Título caso (cada palabra capitalizada)
    titleCase(text) {
        if (!text) return '';
        return text.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // ==================== AUTO-GUARDADO ====================
    
    setupAutoSave() {
        try {
            // Auto-guardar cada 30 segundos
            setInterval(() => {
                this.autoSaveForm();
            }, 30000);
            
            // Guardar al cambiar de pestaña/ventana
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.autoSaveForm();
                }
            });
            
            // Guardar antes de cerrar
            window.addEventListener('beforeunload', (e) => {
                this.autoSaveForm();
                
                // Si hay cambios sin guardar, advertir
                if (this.hasUnsavedChanges()) {
                    e.preventDefault();
                    e.returnValue = 'Hay cambios sin guardar. ¿Está seguro de salir?';
                }
            });
            
            console.log('✅ Auto-guardado configurado');
        } catch (error) {
            console.error('❌ Error configurando auto-guardado:', error);
        }
    }

    autoSaveForm() {
        try {
            const formData = this.getFormData();
            
            if (Object.keys(formData).length > 0) {
                localStorage.setItem('ciaociao_autosave', JSON.stringify({
                    data: formData,
                    timestamp: new Date().toISOString()
                }));
                console.log('💾 Auto-guardado completado');
            }
        } catch (error) {
            console.error('❌ Error en auto-guardado:', error);
        }
    }

    restoreAutoSave() {
        try {
            const saved = localStorage.getItem('ciaociao_autosave');
            if (!saved) return false;
            
            const { data, timestamp } = JSON.parse(saved);
            
            // Verificar que no sea muy antiguo (máximo 24 horas)
            const age = Date.now() - new Date(timestamp).getTime();
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('ciaociao_autosave');
                return false;
            }
            
            // Preguntar si restaurar
            const timeAgo = this.getTimeAgo(timestamp);
            if (confirm(`Se encontró un formulario guardado de ${timeAgo}. ¿Desea restaurarlo?`)) {
                this.fillFormData(data);
                localStorage.removeItem('ciaociao_autosave');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error restaurando auto-guardado:', error);
            return false;
        }
    }

    getFormData() {
        const formData = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.id && input.value) {
                if (input.type === 'checkbox') {
                    formData[input.id] = input.checked;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        formData[input.name] = input.value;
                    }
                } else {
                    formData[input.id] = input.value;
                }
            }
        });
        
        return formData;
    }

    fillFormData(data) {
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = data[key];
                } else {
                    element.value = data[key];
                }
            }
        });
    }

    hasUnsavedChanges() {
        // Implementar lógica para detectar cambios no guardados
        const currentData = JSON.stringify(this.getFormData());
        const savedData = localStorage.getItem('ciaociao_last_saved');
        return currentData !== savedData;
    }

    // ==================== ATAJOS DE TECLADO ====================
    
    setupKeyboardShortcuts() {
        try {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + S = Guardar
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.autoSaveForm();
                    this.showNotification('Formulario guardado', 'success');
                }
                
                // Ctrl/Cmd + P = Vista previa
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    document.getElementById('previewBtn')?.click();
                }
                
                // Ctrl/Cmd + Enter = Generar PDF
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('generatePdfBtn')?.click();
                }
                
                // Esc = Cerrar modales
                if (e.key === 'Escape') {
                    this.closeAllModals();
                }
                
                // Tab = Navegación mejorada
                if (e.key === 'Tab') {
                    this.improvedTabNavigation(e);
                }
            });
            
            console.log('✅ Atajos de teclado configurados');
        } catch (error) {
            console.error('❌ Error configurando atajos:', error);
        }
    }

    improvedTabNavigation(e) {
        // Mejorar navegación con Tab saltando campos readonly
        const focusable = Array.from(document.querySelectorAll(
            'input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        ));
        
        const currentIndex = focusable.indexOf(document.activeElement);
        
        if (currentIndex !== -1) {
            if (e.shiftKey) {
                // Tab hacia atrás
                if (currentIndex > 0) {
                    e.preventDefault();
                    focusable[currentIndex - 1].focus();
                }
            } else {
                // Tab hacia adelante
                if (currentIndex < focusable.length - 1) {
                    e.preventDefault();
                    focusable[currentIndex + 1].focus();
                }
            }
        }
    }

    // ==================== NOTIFICACIONES ====================
    
    showNotification(message, type = 'info', duration = 3000) {
        try {
            // Usar SecurityManager para notificaciones de error de seguridad si está disponible
            if (type === 'error' && window.SecurityManager && window.authManager?.securityManager) {
                window.authManager.securityManager.showSecurityError(message);
                return;
            }
            
            // Remover notificación anterior si existe
            const existing = document.querySelector('.notification-toast');
            if (existing) {
                existing.remove();
            }
            
            // Crear nueva notificación
            const notification = document.createElement('div');
            notification.className = `notification-toast notification-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            notification.innerHTML = `
                <span class="notification-icon">${icons[type]}</span>
                <span class="notification-message">${message}</span>
            `;
            
            // Estilos inline
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : type === 'warning' ? '#F39C12' : '#3498DB'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                max-width: 300px;
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remover después de la duración
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, duration);
            
        } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
        }
    }

    // ==================== UTILIDADES UI ====================
    
    showLoading(message = 'Procesando...') {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        `;
        
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // ==================== HELPERS ====================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };
        
        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);
            if (interval >= 1) {
                return `hace ${interval} ${name}${interval !== 1 ? 's' : ''}`;
            }
        }
        
        return 'hace unos segundos';
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ==================== EXPORTACIÓN ====================
    
    exportToJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    exportToCSV(data, filename) {
        if (!Array.isArray(data) || data.length === 0) {
            console.error('Datos inválidos para exportar a CSV');
            return;
        }
        
        // Obtener headers
        const headers = Object.keys(data[0]);
        
        // Crear CSV
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escapar comillas y envolver en comillas si contiene comas
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
        });
        
        // Descargar
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // ==================== DETECCIÓN DE DISPOSITIVO ====================
    
    getDeviceInfo() {
        return {
            isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
            isDesktop: !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
    }

    // ==================== MODO DEBUG ====================
    
    enableDebugMode() {
        window.DEBUG_MODE = true;
        console.log('🐛 Modo debug activado');
        
        // Agregar panel de debug
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 99999;
            max-width: 300px;
        `;
        
        document.body.appendChild(debugPanel);
        
        // Actualizar panel cada segundo
        setInterval(() => {
            if (window.DEBUG_MODE) {
                this.updateDebugPanel();
            }
        }, 1000);
    }

    updateDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (!panel) return;
        
        const storageInfo = window.receiptDB?.getStorageInfo() || {};
        const deviceInfo = this.getDeviceInfo();
        
        panel.innerHTML = `
            <div>📊 Debug Info</div>
            <div>Storage: ${storageInfo.total || 'N/A'}</div>
            <div>Device: ${deviceInfo.isMobile ? '📱' : deviceInfo.isTablet ? '📱' : '💻'}</div>
            <div>Screen: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}</div>
            <div>Time: ${new Date().toLocaleTimeString()}</div>
        `;
    }

    disableDebugMode() {
        window.DEBUG_MODE = false;
        const panel = document.getElementById('debugPanel');
        if (panel) panel.remove();
        console.log('🐛 Modo debug desactivado');
    }
}

// Exportar para uso global
window.Utils = Utils;

// Inicializar automáticamente
window.utils = new Utils();

// Auto-initialize Utils with security features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.utils.initializeSecurityFeatures();
        }, 200); // Wait for XSS protection to be ready
    });
} else {
    setTimeout(() => {
        window.utils.initializeSecurityFeatures();
    }, 200);
}