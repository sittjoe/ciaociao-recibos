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
            
            // CORRECCIÓN CRÍTICA: Detectar página de cotizaciones específicamente
            const isQuotationPage = window.location.pathname.includes('quotation-mode.html') || 
                                   document.title.includes('Cotizaciones') ||
                                   document.querySelector('.quotation-mode');
                                   
            if (isQuotationPage && typeof initializeQuotationSystem === 'function' && !window.quotationInitialized) {
                console.log('💰 Inicializando sistema de cotizaciones...');
                // Usar setTimeout para asegurar que DOM esté completamente visible
                setTimeout(() => {
                    initializeQuotationSystem();
                    window.quotationInitialized = true;
                    console.log('✅ Sistema de cotizaciones inicializado exitosamente');
                }, 200);
            }

            console.log('✅ Aplicación principal mostrada y inicializada');

        } catch (error) {
            console.error('❌ Error mostrando aplicación principal:', error);
        }
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