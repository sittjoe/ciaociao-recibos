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
                // Página de cotizaciones - Sistema mejorado sin race conditions
                console.log('💰 Inicializando sistema de cotizaciones...');
                
                // Sistema coordinado de inicialización que evita race conditions
                async function initializeQuotationsCoordinated(attempt = 1) {
                    const maxAttempts = 15; // Más tiempo para conexiones lentas
                    const baseDelay = 400; // Delay más conservador
                    
                    console.log(`🔍 Verificación coordinada de sistema (intento ${attempt}/${maxAttempts})...`);
                    
                    try {
                        // PASO 1: Verificar que la función esté disponible
                        if (typeof initializeQuotationSystem !== 'function') {
                            throw new Error('initializeQuotationSystem no está disponible');
                        }
                        
                        // PASO 2: Verificar elementos DOM críticos con visibilidad
                        const criticalElements = {
                            quotationNumber: document.getElementById('quotationNumber'),
                            quotationForm: document.getElementById('quotationForm'),
                            addProductBtn: document.getElementById('addProductBtn'),
                            companyCanvas: document.getElementById('companySignatureCanvas'),
                            productsList: document.getElementById('productsList')
                        };
                        
                        // Verificar existencia
                        const missingElements = Object.entries(criticalElements)
                            .filter(([name, element]) => !element)
                            .map(([name]) => name);
                        
                        if (missingElements.length > 0) {
                            throw new Error(`Elementos faltantes: ${missingElements.join(', ')}`);
                        }
                        
                        // Verificar visibilidad de elementos críticos
                        const invisibleElements = Object.entries(criticalElements)
                            .filter(([name, element]) => element.offsetParent === null)
                            .map(([name]) => name);
                        
                        if (invisibleElements.length > 0) {
                            throw new Error(`Elementos no visibles: ${invisibleElements.join(', ')}`);
                        }
                        
                        // PASO 3: Verificar que scripts CDN estén cargados
                        const cdnDependencies = [
                            { name: 'jsPDF', check: () => typeof window.jspdf !== 'undefined' },
                            { name: 'SignaturePad', check: () => typeof SignaturePad !== 'undefined' },
                            { name: 'html2canvas', check: () => typeof html2canvas !== 'undefined' }
                        ];
                        
                        const missingCDN = cdnDependencies
                            .filter(dep => !dep.check())
                            .map(dep => dep.name);
                        
                        if (missingCDN.length > 0) {
                            throw new Error(`CDN no cargado: ${missingCDN.join(', ')}`);
                        }
                        
                        console.log('✅ Todos los prerequisitos están listos');
                        
                        // PASO 4: Inicializar el sistema (ahora con verificaciones internas)
                        console.log('🚀 Ejecutando initializeQuotationSystem...');
                        await initializeQuotationSystem();
                        
                        // Marcar como inicializado
                        window.quotationInitialized = true;
                        console.log('✅ Sistema de cotizaciones inicializado exitosamente');
                        
                    } catch (error) {
                        console.warn(`⚠️ Intento ${attempt} fallido: ${error.message}`);
                        
                        if (attempt < maxAttempts) {
                            // Delay progresivo: 400ms, 600ms, 800ms, etc.
                            const delay = baseDelay + (attempt * 200);
                            setTimeout(() => initializeQuotationsCoordinated(attempt + 1), delay);
                        } else {
                            console.error('❌ No se pudo inicializar después de todos los intentos');
                            
                            // Error específico para el usuario
                            const userMessage = error.message.includes('CDN') 
                                ? 'Error: No se pudieron cargar las bibliotecas necesarias. Verifica tu conexión a internet y recarga la página.'
                                : error.message.includes('Elementos') 
                                ? 'Error: La página no cargó correctamente. Recarga la página.'
                                : 'Error al inicializar el sistema de cotizaciones. Recarga la página.';
                                
                            alert(userMessage);
                        }
                    }
                }
                
                // Iniciar el proceso coordinado con delay inicial más conservador
                setTimeout(() => initializeQuotationsCoordinated(), 800);
                
            } else if (calculatorMode && typeof initializeCalculatorSystem === 'function' && !window.calculatorInitialized) {
                // Página de calculadora
                console.log('🔧 Inicializando sistema de calculadora...');
                setTimeout(() => {
                    initializeCalculatorSystem();
                    window.calculatorInitialized = true;
                }, 200);
                
            } else if (mainContainer && typeof initializeApp === 'function' && !window.appInitialized) {
                // Página de recibos
                console.log('📄 Inicializando sistema de recibos...');
                initializeApp();
                window.appInitialized = true;
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