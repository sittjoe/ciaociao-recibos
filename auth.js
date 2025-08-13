// auth.js - Sistema de autenticación para ciaociao.mx
class AuthManager {
    constructor() {
        this.correctPassword = '27181730';
        this.sessionKey = 'ciaociao_auth_session';
        this.sessionDuration = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
        this.initializeAuth();
    }

    initializeAuth() {
        try {
            // Verificar si ya hay una sesión válida
            if (this.isValidSession()) {
                this.showMainApplication();
            } else {
                this.showLoginScreen();
            }
        } catch (error) {
            console.error('❌ Error inicializando autenticación:', error);
            this.showLoginScreen();
        }
    }

    isValidSession() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            if (!session) return false;

            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Verificar si la sesión no ha expirado
            return sessionData.timestamp && (now - sessionData.timestamp) < this.sessionDuration;
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            return false;
        }
    }

    showLoginScreen() {
        try {
            // Ocultar aplicación principal (puede ser container o mode-selector-container)
            const mainContainer = document.querySelector('.container');
            const selectorContainer = document.querySelector('.mode-selector-container');
            
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            
            if (selectorContainer) {
                selectorContainer.style.display = 'none';
            }

            // Crear pantalla de login si no existe
            if (!document.getElementById('loginScreen')) {
                this.createLoginScreen();
            }

            // Mostrar pantalla de login
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) {
                loginScreen.style.display = 'flex';
            }

        } catch (error) {
            console.error('❌ Error mostrando pantalla de login:', error);
        }
    }

    createLoginScreen() {
        const loginHTML = `
            <div id="loginScreen" class="login-screen">
                <div class="login-container">
                    <div class="login-header">
                        <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" alt="ciaociao.mx" class="login-logo">
                        <h1>Acceso Restringido</h1>
                        <p>Sistema de Gestión - ciaociao.mx</p>
                    </div>
                    
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label for="passwordInput">Contraseña de Acceso</label>
                            <input type="password" id="passwordInput" placeholder="Ingrese la contraseña" required>
                        </div>
                        
                        <button type="submit" id="loginBtn" class="login-btn">
                            🔓 Acceder al Sistema
                        </button>
                        
                        <div id="errorMessage" class="error-message" style="display: none;">
                            ❌ Contraseña incorrecta. Intente nuevamente.
                        </div>
                    </form>
                    
                    <div class="login-footer">
                        <p><strong>Sistema Seguro</strong></p>
                        <p>Solo personal autorizado de ciaociao.mx</p>
                    </div>
                </div>
            </div>
        `;

        // Agregar al body
        document.body.insertAdjacentHTML('beforeend', loginHTML);
        
        // Configurar event listeners
        this.setupLoginEventListeners();
    }

    setupLoginEventListeners() {
        try {
            const loginForm = document.getElementById('loginForm');
            const passwordInput = document.getElementById('passwordInput');
            const loginBtn = document.getElementById('loginBtn');

            // Submit del formulario
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validatePassword();
            });

            // Enter en el campo de contraseña
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.validatePassword();
                }
            });

            // Limpiar mensaje de error al escribir
            passwordInput.addEventListener('input', () => {
                this.hideErrorMessage();
            });

            // Focus automático en el campo de contraseña
            setTimeout(() => {
                passwordInput.focus();
            }, 100);

        } catch (error) {
            console.error('❌ Error configurando eventos de login:', error);
        }
    }

    validatePassword() {
        try {
            const passwordInput = document.getElementById('passwordInput');
            const loginBtn = document.getElementById('loginBtn');
            const enteredPassword = passwordInput.value.trim();

            // Deshabilitar botón mientras valida
            loginBtn.disabled = true;
            loginBtn.textContent = '⏳ Validando...';

            // Simular un pequeño delay para mejor UX
            setTimeout(() => {
                if (enteredPassword === this.correctPassword) {
                    this.onSuccessfulLogin();
                } else {
                    this.onFailedLogin();
                }

                // Rehabilitar botón
                loginBtn.disabled = false;
                loginBtn.textContent = '🔓 Acceder al Sistema';
            }, 500);

        } catch (error) {
            console.error('❌ Error validando contraseña:', error);
            this.onFailedLogin();
        }
    }

    onSuccessfulLogin() {
        try {
            // Guardar sesión
            const sessionData = {
                timestamp: new Date().getTime(),
                user: 'ciaociao_user'
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            // Mostrar mensaje de éxito
            this.showSuccessMessage();

            // Mostrar aplicación principal después de un momento
            setTimeout(() => {
                this.showMainApplication();
            }, 1000);

        } catch (error) {
            console.error('❌ Error en login exitoso:', error);
            this.showMainApplication(); // Mostrar app aunque haya error guardando sesión
        }
    }

    onFailedLogin() {
        try {
            // Mostrar mensaje de error
            this.showErrorMessage();
            
            // Limpiar campo de contraseña
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }

            // Efecto de shake
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.classList.add('shake');
                setTimeout(() => {
                    loginContainer.classList.remove('shake');
                }, 500);
            }

        } catch (error) {
            console.error('❌ Error en login fallido:', error);
        }
    }

    showSuccessMessage() {
        try {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.textContent = '✅ Acceso Concedido';
                loginBtn.style.background = 'linear-gradient(135deg, #27AE60 0%, #229954 100%)';
            }

            this.hideErrorMessage();
        } catch (error) {
            console.error('❌ Error mostrando mensaje de éxito:', error);
        }
    }

    showErrorMessage() {
        try {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.style.display = 'block';
                
                // Auto-ocultar después de 3 segundos
                setTimeout(() => {
                    this.hideErrorMessage();
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Error mostrando mensaje de error:', error);
        }
    }

    hideErrorMessage() {
        try {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Error ocultando mensaje de error:', error);
        }
    }

    showMainApplication() {
        try {
            // Ocultar pantalla de login
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }

            // Mostrar aplicación principal (puede ser selector de modo o página específica)
            const mainContainer = document.querySelector('.container');
            const selectorContainer = document.querySelector('.mode-selector-container');
            
            if (mainContainer) {
                mainContainer.style.display = 'block';
            }
            
            if (selectorContainer) {
                selectorContainer.style.display = 'flex';
            }

            // Inicializar aplicación según el tipo de página
            if (selectorContainer && typeof initializeModeSelector === 'function' && !window.selectorInitialized) {
                // Página del selector de modo
                console.log('🏠 Inicializando selector de modo...');
                initializeModeSelector();
                window.selectorInitialized = true;
            } else if (mainContainer && typeof initializeApp === 'function' && !window.appInitialized) {
                // Página de recibos
                console.log('📄 Inicializando sistema de recibos...');
                initializeApp();
                window.appInitialized = true;
            }
            
            // NUEVO SISTEMA BULLETPROOF: Usar SystemInitializationManager
            if (window.systemManager) {
                console.log('🎯 [AUTH] Delegando inicialización al SystemManager...');
                
                // Registrar sistemas disponibles según la página
                this.registerAvailableSystems();
                
                // Inicializar página específica de forma robusta
                window.systemManager.initializePage()
                    .then(() => {
                        console.log('✅ [AUTH] Inicialización de página completada exitosamente');
                        window.authSystemInitialized = true;
                    })
                    .catch((error) => {
                        console.error('❌ [AUTH] Error en inicialización de página:', error);
                        this.handleInitializationFailure(error);
                    });
            } else {
                console.error('❌ [AUTH] SystemManager no disponible - fallback requerido');
                this.fallbackInitialization();
            }

            console.log('✅ Aplicación principal mostrada y inicializada');

        } catch (error) {
            console.error('❌ Error mostrando aplicación principal:', error);
        }
    }

    // ==========================================
    // MÉTODOS AUXILIARES PARA BULLETPROOF SYSTEM
    // ==========================================

    registerAvailableSystems() {
        console.log('📋 [AUTH] Registrando sistemas disponibles...');
        
        try {
            // Registrar sistema de cotizaciones si está disponible
            if (typeof window.initializeQuotationSystem === 'function') {
                window.systemManager.register(
                    'quotationSystem',
                    window.initializeQuotationSystem,
                    ['database'], // Dependencias
                    {
                        timeout: 15000,
                        retryOnFailure: true,
                        critical: true
                    }
                );
                console.log('✅ [AUTH] Sistema de cotizaciones registrado');
            }

            // Registrar sistema de recibos si está disponible  
            if (typeof window.initializeApp === 'function') {
                window.systemManager.register(
                    'receiptSystem',
                    window.initializeApp,
                    ['database'],
                    {
                        timeout: 10000,
                        retryOnFailure: true,
                        critical: true
                    }
                );
                console.log('✅ [AUTH] Sistema de recibos registrado');
            }

            // Registrar selector de modo si está disponible
            if (typeof window.initializeModeSelector === 'function') {
                window.systemManager.register(
                    'modeSelector',
                    window.initializeModeSelector,
                    [],
                    {
                        timeout: 5000,
                        retryOnFailure: false,
                        critical: false
                    }
                );
                console.log('✅ [AUTH] Selector de modo registrado');
            }

            // Registrar base de datos como dependencia común
            window.systemManager.register(
                'database',
                () => {
                    console.log('🗄️ [AUTH] Inicializando dependencias de base de datos...');
                    return Promise.resolve(true);
                },
                [],
                {
                    timeout: 3000,
                    retryOnFailure: true,
                    critical: true
                }
            );

        } catch (error) {
            console.error('❌ [AUTH] Error registrando sistemas:', error);
        }
    }

    handleInitializationFailure(error) {
        console.error('🚨 [AUTH] Manejando falla de inicialización:', error);
        
        // Mostrar mensaje de error al usuario
        this.showUserErrorMessage(error);
        
        // Intentar recuperación después de 3 segundos
        setTimeout(() => {
            console.log('🔄 [AUTH] Intentando recuperación automática...');
            this.attemptRecovery();
        }, 3000);
    }

    showUserErrorMessage(error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'auth-error-message';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Error de Inicialización</h3>
                <p>El sistema está experimentando dificultades técnicas.</p>
                <button onclick="window.location.reload()" class="retry-btn">🔄 Reintentar</button>
                <details style="margin-top: 10px;">
                    <summary>Detalles técnicos</summary>
                    <small>${error.message}</small>
                </details>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .auth-error-message {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffe6e6;
                border: 2px solid #ffcccc;
                border-radius: 8px;
                padding: 15px;
                max-width: 300px;
                z-index: 10000;
                font-family: Arial, sans-serif;
            }
            .retry-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            }
            .retry-btn:hover { background: #0056b3; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(errorContainer);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
    }

    attemptRecovery() {
        console.log('🔧 [AUTH] Ejecutando procedimiento de recuperación...');
        
        try {
            // Re-verificar disponibilidad del SystemManager
            if (window.systemManager) {
                console.log('✅ [AUTH] SystemManager disponible para recuperación');
                
                // Intentar re-registro y inicialización
                this.registerAvailableSystems();
                
                window.systemManager.initializePage()
                    .then(() => {
                        console.log('✅ [AUTH] Recuperación exitosa');
                        // Limpiar mensajes de error
                        const errorMsg = document.querySelector('.auth-error-message');
                        if (errorMsg) errorMsg.remove();
                    })
                    .catch((recoveryError) => {
                        console.error('❌ [AUTH] Recuperación fallida:', recoveryError);
                    });
            } else {
                console.warn('⚠️ [AUTH] SystemManager no disponible para recuperación');
                this.fallbackInitialization();
            }
        } catch (error) {
            console.error('❌ [AUTH] Error en procedimiento de recuperación:', error);
        }
    }

    fallbackInitialization() {
        console.log('🆘 [AUTH] Ejecutando inicialización de respaldo...');
        
        // Inicialización básica sin SystemManager
        const pageType = this.detectPageType();
        
        switch (pageType) {
            case 'quotation':
                if (typeof window.initializeQuotationSystem === 'function') {
                    console.log('🔄 [AUTH] Fallback: Inicializando cotizaciones directamente...');
                    setTimeout(() => {
                        try {
                            window.initializeQuotationSystem();
                        } catch (e) {
                            console.error('❌ [AUTH] Fallback falló:', e);
                        }
                    }, 1000);
                }
                break;
            case 'receipt':
                if (typeof window.initializeApp === 'function') {
                    console.log('🔄 [AUTH] Fallback: Inicializando recibos directamente...');
                    window.initializeApp();
                }
                break;
            default:
                console.log('ℹ️ [AUTH] Fallback: Sin inicialización específica requerida');
        }
    }

    detectPageType() {
        const path = window.location.pathname;
        const title = document.title;
        const body = document.body.className;

        if (path.includes('quotation') || title.includes('Cotizaciones') || body.includes('quotation-mode')) {
            return 'quotation';
        }
        if (path.includes('receipt') || title.includes('Recibos') || body.includes('receipt-mode')) {
            return 'receipt';
        }
        return 'selector';
    }

    logout() {
        try {
            // Confirmar logout
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                // Limpiar sesión
                localStorage.removeItem(this.sessionKey);
                
                // Mostrar pantalla de login
                this.showLoginScreen();
                
                // Limpiar formularios por seguridad
                this.clearFormData();
                
                console.log('✅ Sesión cerrada exitosamente');
            }
        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);
        }
    }

    clearFormData() {
        try {
            // Limpiar formulario principal
            const receiptForm = document.getElementById('receiptForm');
            if (receiptForm) {
                receiptForm.reset();
            }

            // Limpiar firma
            if (window.signaturePad) {
                window.signaturePad.clear();
            }

            // Limpiar imágenes
            if (window.cameraManager) {
                window.cameraManager.clearImages();
            }

        } catch (error) {
            console.error('❌ Error limpiando datos del formulario:', error);
        }
    }

    // Método para extender sesión (útil para actividad del usuario)
    extendSession() {
        try {
            if (this.isValidSession()) {
                const sessionData = {
                    timestamp: new Date().getTime(),
                    user: 'ciaociao_user'
                };
                localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error('❌ Error extendiendo sesión:', error);
        }
    }

    // Verificar sesión periódicamente
    startSessionChecker() {
        try {
            setInterval(() => {
                if (!this.isValidSession()) {
                    console.log('⏰ Sesión expirada, redirigiendo al login');
                    this.showLoginScreen();
                }
            }, 60000); // Verificar cada minuto
        } catch (error) {
            console.error('❌ Error iniciando verificador de sesión:', error);
        }
    }
}

// Exportar para uso global
window.AuthManager = AuthManager;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (!window.authManager) {
        window.authManager = new AuthManager();
        window.authManager.startSessionChecker();
    }
});