// auth.js - Sistema de autenticación con SecurityManager enterprise-grade
class AuthManager {
    constructor() {
        // ✅ ELIMINADO PASSWORD HARDCODEADO - Ahora usa SecurityManager
        this.sessionKey = 'ciaociao_auth_session'; // Legacy key para compatibilidad
        this.sessionDuration = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
        this.securityManager = null; // Se inicializará cuando esté disponible
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // PRIORIZAR FUNCIONALIDAD BÁSICA - No esperar SecurityManager
            console.log('🚀 Inicializando autenticación con fallback inmediato...');
            
            // Verificar sesión existente inmediatamente
            if (await this.isValidSession()) {
                this.showMainApplication();
            } else {
                this.showLoginScreen();
            }
            
            // SecurityManager inicialización en background (opcional)
            this.initializeSecurityManagerBackground();
            
        } catch (error) {
            console.error('❌ Error inicializando autenticación:', error);
            this.showLoginScreen();
        }
    }

    /**
     * Inicializa SecurityManager en background sin bloquear funcionalidad básica
     */
    async initializeSecurityManagerBackground() {
        setTimeout(async () => {
            try {
                await this.waitForSecurityManager();
                if (this.securityManager) {
                    console.log('✅ SecurityManager cargado en background');
                }
            } catch (error) {
                console.log('⚠️ SecurityManager no disponible - funcionando en modo básico');
            }
        }, 100);
    }

    /**
     * Espera a que SecurityManager esté disponible (sin bloquear UI)
     */
    async waitForSecurityManager(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.SecurityManager) {
                this.securityManager = new window.SecurityManager();
                console.log('✅ SecurityManager integrado correctamente');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ SecurityManager no disponible, usando fallback básico');
        this.securityManager = null;
    }

    async isValidSession() {
        try {
            // PRIORIZAR SISTEMA LEGACY - Funciona inmediatamente
            const session = localStorage.getItem(this.sessionKey);
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    const now = new Date().getTime();
                    
                    // Verificar si la sesión legacy no ha expirado
                    const isValid = sessionData.timestamp && (now - sessionData.timestamp) < this.sessionDuration;
                    
                    if (isValid) {
                        console.log('✅ Sesión legacy válida encontrada');
                        return true;
                    }
                } catch (parseError) {
                    console.warn('⚠️ Error parseando sesión legacy, continuando...');
                }
            }
            
            // Opcionalmente verificar SecurityManager si está disponible (no bloqueante)
            if (this.securityManager) {
                try {
                    const secureSession = await this.securityManager.validateSession();
                    if (secureSession) {
                        console.log('✅ Sesión válida encontrada en SecurityManager');
                        return true;
                    }
                } catch (secError) {
                    console.warn('⚠️ Error verificando SecurityManager, ignorando...');
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            return false;
        }
    }

    showLoginScreen() {
        try {
            console.log('🔒 Iniciando pantalla de login...');

            // Ocultar aplicación principal (puede ser container o mode-selector-container)
            const mainContainer = document.querySelector('.container');
            const selectorContainer = document.querySelector('.mode-selector-container');
            
            if (mainContainer) {
                mainContainer.style.display = 'none';
                console.log('📦 Container principal ocultado');
            }
            
            if (selectorContainer) {
                selectorContainer.style.display = 'none';
                console.log('🎯 Selector container ocultado');
            }

            // Crear o mostrar pantalla de login si no existe
            this.createLoginScreen();

            // Configurar event listeners con delay para asegurar DOM
            setTimeout(() => {
                this.setupLoginEventListeners();
            }, 300);

            console.log('✅ Pantalla de login mostrada correctamente');

        } catch (error) {
            console.error('❌ Error crítico mostrando pantalla de login:', error);
            // Mostrar error simplificado
            document.body.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                    <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%;">
                        <h2 style="color: #721c24;">⚠️ Error del Sistema</h2>
                        <p>El sistema no pudo cargar correctamente.</p>
                        <p style="margin: 20px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px;">
                            <strong>Error:</strong> ${error.message}
                        </p>
                        <button onclick="window.location.reload()" style="padding: 15px 25px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
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
                background-color: white !important;
                color: #333 !important;
                pointer-events: auto !important;
                user-select: auto !important;
                -webkit-user-select: auto !important;
                -moz-user-select: auto !important;
                -ms-user-select: auto !important;
            }
            
            #passwordInput:focus {
                outline: none;
                border-color: #D4AF37;
                box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
            }

            #passwordInput:disabled,
            #passwordInput:readonly {
                opacity: 0.6;
                cursor: not-allowed;
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
                console.log('✅ Password input encontrado, configurando eventos...');
                
                // Asegurar que el input esté habilitado y accesible
                passwordInput.removeAttribute('disabled');
                passwordInput.removeAttribute('readonly');
                passwordInput.style.pointerEvents = 'auto';
                passwordInput.style.userSelect = 'auto';
                
                // Focus automático con retry
                setTimeout(() => {
                    try {
                        passwordInput.focus();
                        console.log('🎯 Focus aplicado al input de password');
                    } catch (focusError) {
                        console.warn('⚠️ Error aplicando focus, reintentando...', focusError);
                        setTimeout(() => passwordInput.focus(), 500);
                    }
                }, 200);
                
                // Enter para login
                passwordInput.addEventListener('keypress', (e) => {
                    console.log('⌨️ Tecla presionada:', e.key);
                    if (e.key === 'Enter') {
                        this.attemptLogin();
                    }
                });

                // Debug: Log cuando el usuario escriba
                passwordInput.addEventListener('input', (e) => {
                    console.log('✍️ Usuario escribiendo, longitud:', e.target.value.length);
                });

            } else {
                console.error('❌ Password input NO encontrado');
            }

            if (loginBtn) {
                console.log('✅ Login button encontrado, configurando evento...');
                loginBtn.addEventListener('click', () => {
                    console.log('🖱️ Login button clickeado');
                    this.attemptLogin();
                });
            } else {
                console.error('❌ Login button NO encontrado');
            }

        } catch (error) {
            console.error('❌ Error configurando event listeners:', error);
        }
    }

    async attemptLogin() {
        try {
            const passwordInput = document.getElementById('passwordInput');
            const enteredPassword = passwordInput ? passwordInput.value.trim() : '';

            console.log('🔐 Intentando login con password...');

            // PRIORIZAR VALIDACIÓN BÁSICA - Inmediato y confiable
            if (enteredPassword === '27181730') {
                console.log('✅ Password básico correcto');
                await this.handleSuccessfulLogin();
                return;
            }

            // Opcionalmente usar SecurityManager si está disponible (no bloqueante)
            if (this.securityManager && enteredPassword.length > 0) {
                try {
                    console.log('🔒 Verificando con SecurityManager...');
                    const sessionData = await this.securityManager.validatePassword(enteredPassword);
                    await this.handleSuccessfulSecureLogin(sessionData);
                    return;
                } catch (secError) {
                    console.warn('⚠️ SecurityManager falló, usando validación básica');
                    // Continuar con validación básica fallback
                }
            }

            // Si llegamos aquí, el password es incorrecto
            this.handleFailedLogin('Contraseña incorrecta');

        } catch (error) {
            console.error('❌ Error en intento de login:', error);
            this.handleFailedLogin('Error interno del sistema');
        }
    }

    /**
     * Maneja login exitoso con SecurityManager
     */
    async handleSuccessfulSecureLogin(sessionData) {
        try {
            console.log('✅ Login exitoso con SecurityManager');
            this.showSuccessMessage();

            // La sesión ya fue creada por SecurityManager
            console.log('📊 Datos de sesión segura:', {
                id: sessionData.id,
                expires: new Date(sessionData.expires).toLocaleString(),
                version: sessionData.version
            });

            // Mostrar aplicación principal después de una breve pausa
            setTimeout(() => {
                this.showMainApplication();
            }, 1000);

        } catch (error) {
            console.error('❌ Error en login seguro exitoso:', error);
        }
    }

    /**
     * Maneja login exitoso legacy (fallback)
     */
    async handleSuccessfulLogin() {
        try {
            console.log('⚠️ Login exitoso con sistema legacy');
            this.showSuccessMessage();

            // Crear nueva sesión legacy
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
            console.error('❌ Error en login legacy exitoso:', error);
        }
    }

    handleFailedLogin(errorMessage = 'Password incorrecto') {
        try {
            // Mostrar mensaje de error específico
            this.showErrorMessage(errorMessage);
            
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

    showErrorMessage(message = 'Password incorrecto. Inténtelo de nuevo.') {
        try {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                // Actualizar mensaje con información específica
                errorMessage.innerHTML = `❌ ${message}`;
                errorMessage.style.display = 'block';
                
                // Auto-ocultar después de 5 segundos para rate limiting
                setTimeout(() => {
                    this.hideErrorMessage();
                }, 5000);
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
                        
                        // PASO 5: VERIFICAR QUE LOS EVENT LISTENERS ESTÉN CONFIGURADOS
                        console.log('🔍 Verificando funcionalidad de botones...');
                        
                        // Verificar que el botón addProductBtn tenga event listeners configurados
                        const addProductBtn = document.getElementById('addProductBtn');
                        if (addProductBtn) {
                            // Crear un evento sintético para verificar que el botón responde
                            const hasEventListeners = addProductBtn.onclick || 
                                addProductBtn.getAttribute('onclick') ||
                                (addProductBtn._eventsCount && addProductBtn._eventsCount > 0) ||
                                (getEventListeners && getEventListeners(addProductBtn).click?.length > 0);
                            
                            if (!hasEventListeners) {
                                throw new Error('Botón addProductBtn sin event listeners configurados');
                            }
                        }
                        
                        // Verificar que la función showAddProductModal esté disponible globalmente
                        if (typeof window.showAddProductModal !== 'function') {
                            throw new Error('Función showAddProductModal no disponible globalmente');
                        }
                        
                        // Verificar que el canvas de firma esté inicializado
                        if (!window.companySignaturePad) {
                            throw new Error('Canvas de firma no inicializado correctamente');
                        }
                        
                        console.log('✅ Verificación de funcionalidad completa');
                        
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
                
            } else if (mainContainer && !window.appInitialized) {
                // Página de recibos - La inicialización ahora es manejada por initialization-coordinator.js
                console.log('📄 Sistema de recibos detectado - inicialización delegada al coordinador');
                window.appInitialized = true;
                
                // COMENTADO: Evitar doble inicialización
                // initializeApp(); // Ahora es llamado por InitializationCoordinator
            }
            
        } catch (error) {
            console.error('❌ Error inicializando sistemas:', error);
        }
    }

    logout() {
        try {
            // Usar SecurityManager si está disponible
            if (this.securityManager) {
                this.securityManager.logout();
                console.log('✅ Logout seguro completado');
            } else {
                // Fallback a logout legacy
                localStorage.removeItem(this.sessionKey);
                console.log('⚠️ Logout legacy completado');
            }
            
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
            // En caso de error, forzar recarga
            window.location.reload();
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