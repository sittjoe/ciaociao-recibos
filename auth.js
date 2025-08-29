// auth.js - Sistema de autenticación simplificado para ciaociao.mx
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

            // Crear o mostrar pantalla de login si no existe
            this.createLoginScreen();

            // Configurar event listeners
            this.setupLoginEventListeners();

            console.log('🔒 Pantalla de login mostrada');

        } catch (error) {
            console.error('❌ Error mostrando pantalla de login:', error);
            // Mostrar error al usuario
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                    <div style="text-align: center; color: #721c24; background: #f8d7da; padding: 20px; border-radius: 8px;">
                        <h2>❌ Error de Inicialización</h2>
                        <p>Error iniciando la aplicación. Por favor recarga la página.</p>
                        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Recargar Página
                        </button>
                    </div>
                </div>
            `;
        }
    }

    createLoginScreen() {
        // Verificar si ya existe
        let loginScreen = document.getElementById('loginScreen');
        
        if (!loginScreen) {
            // Crear nueva pantalla de login
            loginScreen = document.createElement('div');
            loginScreen.id = 'loginScreen';
            loginScreen.innerHTML = `
                <div class="login-container">
                    <div class="login-header">
                        <img src="https://i.postimg.cc/FRC6PkXn/FINE-JEWELRY-85-x-54-mm-2000-x-1200-px.png" alt="ciaociao.mx" class="login-logo">
                        <h1>Sistema de Gestión</h1>
                        <p>Ingrese la contraseña para acceder</p>
                    </div>
                    <div class="login-form">
                        <div class="form-group">
                            <label for="passwordInput">Contraseña</label>
                            <input type="password" id="passwordInput" placeholder="Ingrese su contraseña" autocomplete="current-password">
                        </div>
                        <div id="errorMessage" class="error-message" style="display: none;">
                            ❌ Contraseña incorrecta. Inténtelo de nuevo.
                        </div>
                        <button type="button" id="loginBtn" class="login-btn">
                            🔓 Acceder al Sistema
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar estilos si no existen
            this.addLoginStyles();
            
            document.body.appendChild(loginScreen);
        }
        
        loginScreen.style.display = 'flex';
    }

    addLoginStyles() {
        // Verificar si ya existen los estilos
        if (document.getElementById('authStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'authStyles';
        style.textContent = `
            #loginScreen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .login-container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
                width: 90%;
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .login-container.shake {
                animation: shake 0.5s ease-in-out;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            .login-logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 20px;
            }
            
            .login-header h1 {
                color: #1a1a1a;
                margin: 10px 0;
                font-family: 'Playfair Display', serif;
            }
            
            .login-header p {
                color: #666;
                margin-bottom: 30px;
            }
            
            .form-group {
                margin-bottom: 20px;
                text-align: left;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
            }
            
            #passwordInput {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.3s ease;
            }
            
            #passwordInput:focus {
                outline: none;
                border-color: #D4AF37;
                box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
            }
            
            .login-btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
            }
            
            .error-message {
                background: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 15px;
                border: 1px solid #f5c6cb;
            }
        `;
        
        document.head.appendChild(style);
    }

    setupLoginEventListeners() {
        try {
            const passwordInput = document.getElementById('passwordInput');
            const loginBtn = document.getElementById('loginBtn');

            if (passwordInput) {
                // Focus automático
                setTimeout(() => passwordInput.focus(), 100);
                
                // Enter para login
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.attemptLogin();
                    }
                });
            }

            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.attemptLogin());
            }

        } catch (error) {
            console.error('❌ Error configurando event listeners:', error);
        }
    }

    attemptLogin() {
        try {
            const passwordInput = document.getElementById('passwordInput');
            const enteredPassword = passwordInput ? passwordInput.value : '';

            if (enteredPassword === this.correctPassword) {
                this.handleSuccessfulLogin();
            } else {
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('❌ Error en intento de login:', error);
        }
    }

    handleSuccessfulLogin() {
        try {
            // Mostrar mensaje de éxito
            this.showSuccessMessage();

            // Crear nueva sesión
            const sessionData = {
                authenticated: true,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            // Mostrar aplicación principal después de una breve pausa
            setTimeout(() => {
                this.showMainApplication();
            }, 1000);

        } catch (error) {
            console.error('❌ Error en login exitoso:', error);
        }
    }

    handleFailedLogin() {
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

            // Mostrar aplicación principal
            const mainContainer = document.querySelector('.container');
            const selectorContainer = document.querySelector('.mode-selector-container');
            
            if (mainContainer) {
                mainContainer.style.display = 'block';
            }
            
            if (selectorContainer) {
                selectorContainer.style.display = 'flex';
            }

            // Inicializar aplicación según el tipo de página
            this.initializeApplicationSystems();

            console.log('✅ Aplicación principal mostrada e inicializada');

        } catch (error) {
            console.error('❌ Error mostrando aplicación principal:', error);
        }
    }

    initializeApplicationSystems() {
        try {
            // Detectar y inicializar el sistema apropiado
            const selectorContainer = document.querySelector('.mode-selector-container');
            const mainContainer = document.querySelector('.container');
            const quotationMode = document.querySelector('.quotation-mode');
            const calculatorMode = document.querySelector('.calculator-mode');

            if (selectorContainer && typeof initializeModeSelector === 'function' && !window.selectorInitialized) {
                // Página del selector de modo
                console.log('🏠 Inicializando selector de modo...');
                initializeModeSelector();
                window.selectorInitialized = true;
                
            } else if (quotationMode && typeof initializeQuotationSystem === 'function' && !window.quotationInitialized) {
                // Página de cotizaciones
                console.log('💰 Inicializando sistema de cotizaciones...');
                setTimeout(() => {
                    initializeQuotationSystem();
                    window.quotationInitialized = true;
                }, 200);
                
            } else if (calculatorMode && typeof initializeCalculatorSystem === 'function' && !window.calculatorInitialized) {
                // Página de calculadora
                console.log('🔧 Inicializando sistema de calculadora...');
                setTimeout(() => {
                    initializeCalculatorSystem();
                    window.calculatorInitialized = true;
                }, 200);
                
            } else if (mainContainer && !window.appInitialized) {
                // Página de recibos - llamada directa a initializeApp
                console.log('📄 Inicializando sistema de recibos directamente...');
                
                // Esperar un momento para asegurar que script.js está cargado
                setTimeout(() => {
                    if (typeof window.initializeApp === 'function') {
                        console.log('✅ initializeApp encontrado, ejecutando...');
                        window.initializeApp();
                        window.appInitialized = true;
                    } else {
                        console.error('❌ initializeApp NO ENCONTRADO - script.js no cargó correctamente');
                    }
                }, 500);
                
                // CRITICAL: Re-initialize signature pads after authentication transition
                console.log('🔄 Re-inicializando firmas post-autenticación...');
                setTimeout(() => {
                    try {
                        // Call the re-initialization function from receipt-mode.html
                        if (typeof window.reinitializeSignaturePads === 'function') {
                            window.reinitializeSignaturePads();
                            console.log('✅ Signature pads re-initialization completed');
                        } else if (typeof window.initializeSignaturePad === 'function') {
                            // Fallback to direct initialization
                            window.initializeSignaturePad();
                            console.log('✅ Direct signature pad initialization completed');
                        } else {
                            console.warn('⚠️ No signature pad initialization functions available');
                        }
                    } catch (error) {
                        console.error('❌ Error in post-auth signature pad initialization:', error);
                    }
                }, 1500); // Extra delay to ensure DOM is fully visible after auth transition
                
                // CRITICAL: Re-attach event listeners after authentication transition
                console.log('🔄 Re-configurando event listeners post-autenticación...');
                setTimeout(() => {
                    try {
                        // Re-attach critical event listeners after DOM is fully visible
                        if (typeof window.setupEventListeners === 'function') {
                            window.setupEventListeners();
                            console.log('✅ Event listeners re-configuration completed');
                        } else {
                            console.warn('⚠️ setupEventListeners function not available');
                        }
                        
                        // Double-check critical buttons specifically
                        const criticalButtons = [
                            { id: 'previewBtn', handler: 'showPreview', label: 'vista previa' },
                            { id: 'generatePdfBtn', handler: 'generatePDF', label: 'generar PDF' },
                            { id: 'shareWhatsappBtn', handler: 'shareWhatsApp', label: 'compartir WhatsApp' },
                            { id: 'historyBtn', handler: 'showHistory', label: 'historial' }
                        ];
                        
                        let buttonsFixed = 0;
                        criticalButtons.forEach(btn => {
                            const element = document.getElementById(btn.id);
                            const handler = window[btn.handler];
                            
                            if (element && typeof handler === 'function') {
                                // Remove any existing listeners and add fresh ones
                                element.onclick = handler;
                                buttonsFixed++;
                                console.log(`✅ Botón ${btn.label} re-configurado correctamente`);
                            } else {
                                console.warn(`⚠️ ${btn.label} (${btn.id}) no se pudo re-configurar`);
                            }
                        });
                        
                        console.log(`✅ ${buttonsFixed}/4 botones críticos re-configurados`);
                        
                    } catch (error) {
                        console.error('❌ Error in post-auth event listener re-configuration:', error);
                    }
                }, 2000); // Even longer delay to ensure DOM and all systems are ready
            }
            
        } catch (error) {
            console.error('❌ Error inicializando sistemas:', error);
        }
    }

    logout() {
        try {
            // Remover sesión
            localStorage.removeItem(this.sessionKey);
            
            // Limpiar flags de inicialización
            window.selectorInitialized = false;
            window.appInitialized = false;
            window.quotationInitialized = false;
            window.calculatorInitialized = false;
            
            // Mostrar pantalla de login
            this.showLoginScreen();
            
            console.log('🔒 Usuario deslogueado exitosamente');
        } catch (error) {
            console.error('❌ Error en logout:', error);
        }
    }
}

// ============================================================
// INICIALIZACIÓN GLOBAL
// ============================================================

// Crear instancia global
window.authManager = new AuthManager();

// Funciones globales para compatibilidad
window.logout = () => window.authManager.logout();

console.log('✅ Sistema de autenticación inicializado correctamente');