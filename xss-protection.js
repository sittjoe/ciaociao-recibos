/**
 * XSS PROTECTION SYSTEM - Enterprise-grade XSS Prevention
 * Comprehensive protection against all XSS attack vectors
 * Integrates with existing SecurityManager for complete security coverage
 */

class XSSProtection {
    constructor() {
        this.domPurify = null;
        this.isInitialized = false;
        this.metrics = {
            blockedAttempts: 0,
            sanitizedInputs: 0,
            errors: 0,
            lastAttempt: null
        };
        
        // Performance monitoring
        this.performanceThreshold = 5; // 5ms threshold
        this.performanceMetrics = [];
        
        // Configuration
        this.config = {
            allowedTags: [],
            allowedAttributes: {},
            forbiddenTags: ['script', 'iframe', 'object', 'embed', 'form'],
            forbiddenAttributes: ['onload', 'onerror', 'onclick', 'onmouseover'],
            logging: true,
            strictMode: true
        };
        
        // XSS patterns for detection
        this.xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>/gi,
            /<object[^>]*>/gi,
            /<embed[^>]*>/gi,
            /expression\s*\(/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /<meta[^>]*http-equiv/gi,
            /<link[^>]*>/gi,
            /<style[^>]*>.*?<\/style>/gi
        ];
        
        this.initializeProtection();
    }
    
    /**
     * Initialize XSS protection with multiple CDN fallbacks
     */
    async initializeProtection() {
        try {
            await this.loadDOMPurify();
            this.setupEventListeners();
            this.integrateFallbackMethods();
            this.integrateWithSecurityManager();
            
            this.isInitialized = true;
            console.log('🛡️ XSS Protection System initialized successfully');
            
            // Start real-time monitoring
            this.startMonitoring();
            
            // Setup extension monitoring and initial scan
            this.extensionObserver = this.setupExtensionMonitoring();
            this.blockDetectedExtensions();
            
            console.log('🛡️ Extension protection activated - Malicious extensions will be blocked');
            
        } catch (error) {
            console.error('❌ XSS Protection initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Load DOMPurify with CDN fallbacks
     */
    async loadDOMPurify() {
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js',
            'https://unpkg.com/dompurify@3.0.5/dist/purify.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js'
        ];
        
        // Try to use already loaded DOMPurify
        if (typeof DOMPurify !== 'undefined') {
            this.domPurify = DOMPurify;
            return Promise.resolve();
        }
        
        for (const url of cdnUrls) {
            try {
                await this.loadScript(url);
                if (typeof DOMPurify !== 'undefined') {
                    this.domPurify = DOMPurify;
                    console.log(`✅ DOMPurify loaded from: ${url}`);
                    return;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load DOMPurify from ${url}:`, error);
                continue;
            }
        }
        
        // If all CDN fails, use fallback methods
        console.warn('⚠️ DOMPurify CDN failed, using fallback sanitization');
        this.domPurify = null;
    }
    
    /**
     * Load script dynamically with timeout
     */
    loadScript(src, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            const timeoutId = setTimeout(() => {
                reject(new Error(`Script load timeout: ${src}`));
            }, timeout);
            
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            
            script.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(`Script load error: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Setup real-time event listeners
     */
    setupEventListeners() {
        // Monitor all input fields
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.sanitizeInputField(e.target);
            }
        });
        
        // Monitor paste events
        document.addEventListener('paste', (e) => {
            setTimeout(() => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    this.sanitizeInputField(e.target);
                }
            }, 10); // Small delay to allow paste to complete
        });
        
        // Monitor drag & drop
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDragDrop(e);
        });
        
        // Monitor dynamic content changes
        if (window.MutationObserver) {
            this.setupMutationObserver();
        }
    }
    
    /**
     * Setup mutation observer for dynamic content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.sanitizeDynamicContent(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover']
        });
    }
    
    /**
     * Core sanitization methods
     */
    
    // 1. Text input sanitization
    sanitizeText(input, options = {}) {
        const startTime = performance.now();
        
        try {
            if (!input || typeof input !== 'string') {
                return this.handleInvalidInput(input, 'text');
            }
            
            let sanitized = input;
            
            // Use DOMPurify if available
            if (this.domPurify) {
                sanitized = this.domPurify.sanitize(input, {
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: [],
                    KEEP_CONTENT: true
                });
            } else {
                // Fallback sanitization
                sanitized = this.fallbackTextSanitize(input);
            }
            
            // Additional validation
            sanitized = this.validateAndClean(sanitized, 'text');
            
            this.recordPerformance('sanitizeText', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            if (input !== sanitized) {
                this.logSanitization('text', input, sanitized);
            }
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeText', error);
            return this.safeFallback(input, 'text');
        }
    }
    
    // 2. HTML content sanitization
    sanitizeHTML(html, options = {}) {
        const startTime = performance.now();
        
        try {
            if (!html || typeof html !== 'string') {
                return this.handleInvalidInput(html, 'html');
            }
            
            let sanitized = html;
            
            if (this.domPurify) {
                const config = {
                    ALLOWED_TAGS: options.allowedTags || this.config.allowedTags,
                    ALLOWED_ATTR: options.allowedAttributes || this.config.allowedAttributes,
                    FORBID_TAGS: this.config.forbiddenTags,
                    FORBID_ATTR: this.config.forbiddenAttributes,
                    SANITIZE_DOM: true,
                    KEEP_CONTENT: false
                };
                
                sanitized = this.domPurify.sanitize(html, config);
            } else {
                sanitized = this.fallbackHTMLSanitize(html);
            }
            
            sanitized = this.validateAndClean(sanitized, 'html');
            
            this.recordPerformance('sanitizeHTML', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            if (html !== sanitized) {
                this.logSanitization('html', html, sanitized);
            }
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeHTML', error);
            return this.safeFallback(html, 'html');
        }
    }
    
    // 3. URL sanitization
    sanitizeURL(url) {
        const startTime = performance.now();
        
        try {
            if (!url || typeof url !== 'string') {
                return this.handleInvalidInput(url, 'url');
            }
            
            // Remove dangerous protocols
            const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
            let sanitized = url.toLowerCase();
            
            for (const protocol of dangerousProtocols) {
                if (sanitized.includes(protocol)) {
                    this.logAttempt('url', `Blocked dangerous protocol: ${protocol}`);
                    return '#blocked-url';
                }
            }
            
            // Validate URL format
            try {
                const urlObj = new URL(url);
                sanitized = urlObj.toString();
            } catch {
                // If not a valid URL, return as text
                sanitized = this.sanitizeText(url);
            }
            
            this.recordPerformance('sanitizeURL', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeURL', error);
            return '#error-url';
        }
    }
    
    // 4. Email sanitization
    sanitizeEmail(email) {
        const startTime = performance.now();
        
        try {
            if (!email || typeof email !== 'string') {
                return this.handleInvalidInput(email, 'email');
            }
            
            // Basic email validation and sanitization
            let sanitized = email.toLowerCase().trim();
            
            // Remove dangerous characters
            sanitized = sanitized.replace(/[<>"'\\]/g, '');
            
            // Validate email format
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(sanitized)) {
                this.logAttempt('email', `Invalid email format: ${email}`);
                return '';
            }
            
            this.recordPerformance('sanitizeEmail', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeEmail', error);
            return '';
        }
    }
    
    // 5. Phone number sanitization
    sanitizePhone(phone) {
        const startTime = performance.now();
        
        try {
            if (!phone || typeof phone !== 'string') {
                return this.handleInvalidInput(phone, 'phone');
            }
            
            // Keep only numbers, spaces, dashes, parentheses, and plus
            let sanitized = phone.replace(/[^0-9\s\-\(\)\+]/g, '');
            
            this.recordPerformance('sanitizePhone', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizePhone', error);
            return '';
        }
    }
    
    // 6. JSON object sanitization
    sanitizeJSON(obj, depth = 0) {
        const startTime = performance.now();
        const maxDepth = 10; // Prevent infinite recursion
        
        try {
            if (depth > maxDepth) {
                this.logAttempt('json', 'Max recursion depth reached');
                return {};
            }
            
            if (obj === null || obj === undefined) {
                return obj;
            }
            
            if (typeof obj === 'string') {
                return this.sanitizeText(obj);
            }
            
            if (typeof obj === 'number' || typeof obj === 'boolean') {
                return obj;
            }
            
            if (Array.isArray(obj)) {
                return obj.map(item => this.sanitizeJSON(item, depth + 1));
            }
            
            if (typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    const cleanKey = this.sanitizeText(key);
                    sanitized[cleanKey] = this.sanitizeJSON(value, depth + 1);
                }
                return sanitized;
            }
            
            this.recordPerformance('sanitizeJSON', performance.now() - startTime);
            return obj;
            
        } catch (error) {
            this.handleError('sanitizeJSON', error);
            return {};
        }
    }
    
    // 7. PDF content sanitization
    sanitizeForPDF(content) {
        const startTime = performance.now();
        
        try {
            if (!content || typeof content !== 'string') {
                return this.handleInvalidInput(content, 'pdf');
            }
            
            // Remove HTML tags for PDF
            let sanitized = content;
            
            if (this.domPurify) {
                sanitized = this.domPurify.sanitize(content, {
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: [],
                    KEEP_CONTENT: true
                });
            } else {
                sanitized = this.stripHTMLTags(content);
            }
            
            // Remove PDF injection attempts
            sanitized = sanitized.replace(/%%/g, '');
            sanitized = sanitized.replace(/\\[a-zA-Z]+/g, '');
            
            this.recordPerformance('sanitizeForPDF', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeForPDF', error);
            return '';
        }
    }
    
    // 8. WhatsApp message sanitization
    sanitizeForWhatsApp(message) {
        const startTime = performance.now();
        
        try {
            if (!message || typeof message !== 'string') {
                return this.handleInvalidInput(message, 'whatsapp');
            }
            
            let sanitized = this.sanitizeText(message);
            
            // Remove URLs that might be harmful
            sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, (url) => {
                return this.sanitizeURL(url) === '#blocked-url' ? '[URL removida por seguridad]' : url;
            });
            
            // Limit message length
            const maxLength = 4000; // WhatsApp limit
            if (sanitized.length > maxLength) {
                sanitized = sanitized.substring(0, maxLength - 3) + '...';
            }
            
            this.recordPerformance('sanitizeForWhatsApp', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeForWhatsApp', error);
            return '';
        }
    }
    
    // 9. Form data sanitization
    sanitizeFormData(formData) {
        const startTime = performance.now();
        
        try {
            if (!formData || typeof formData !== 'object') {
                return this.handleInvalidInput(formData, 'form');
            }
            
            const sanitized = {};
            
            for (const [key, value] of Object.entries(formData)) {
                const cleanKey = this.sanitizeText(key);
                
                if (typeof value === 'string') {
                    // Determine field type and sanitize accordingly
                    if (key.toLowerCase().includes('email')) {
                        sanitized[cleanKey] = this.sanitizeEmail(value);
                    } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) {
                        sanitized[cleanKey] = this.sanitizePhone(value);
                    } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
                        sanitized[cleanKey] = this.sanitizeURL(value);
                    } else {
                        sanitized[cleanKey] = this.sanitizeText(value);
                    }
                } else {
                    sanitized[cleanKey] = this.sanitizeJSON(value);
                }
            }
            
            this.recordPerformance('sanitizeFormData', performance.now() - startTime);
            this.metrics.sanitizedInputs++;
            
            return sanitized;
            
        } catch (error) {
            this.handleError('sanitizeFormData', error);
            return {};
        }
    }
    
    // 10. Field validation and sanitization
    validateAndSanitize(field, type = 'text') {
        const startTime = performance.now();
        
        try {
            if (!field || (!field.value && field.value !== '')) {
                return false;
            }
            
            const originalValue = field.value;
            let sanitized;
            
            switch (type) {
                case 'email':
                    sanitized = this.sanitizeEmail(originalValue);
                    break;
                case 'phone':
                    sanitized = this.sanitizePhone(originalValue);
                    break;
                case 'url':
                    sanitized = this.sanitizeURL(originalValue);
                    break;
                case 'html':
                    sanitized = this.sanitizeHTML(originalValue);
                    break;
                default:
                    sanitized = this.sanitizeText(originalValue);
            }
            
            // Update field if sanitization changed the value
            if (originalValue !== sanitized) {
                field.value = sanitized;
                this.logSanitization(type, originalValue, sanitized, field.id || field.name);
                
                // Visual feedback
                this.showSanitizationFeedback(field);
            }
            
            this.recordPerformance('validateAndSanitize', performance.now() - startTime);
            
            return sanitized === originalValue;
            
        } catch (error) {
            this.handleError('validateAndSanitize', error);
            return false;
        }
    }
    
    /**
     * Fallback sanitization methods (when DOMPurify is not available)
     */
    fallbackTextSanitize(input) {
        let sanitized = input;
        
        // Remove script tags
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
        
        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        
        // Remove javascript: protocols
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Remove HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        sanitized = this.decodeHTMLEntities(sanitized);
        
        return sanitized;
    }
    
    fallbackHTMLSanitize(html) {
        let sanitized = html;
        
        // Remove dangerous tags
        for (const tag of this.config.forbiddenTags) {
            const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
            sanitized = sanitized.replace(regex, '');
            sanitized = sanitized.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
        }
        
        // Remove dangerous attributes
        for (const attr of this.config.forbiddenAttributes) {
            const regex = new RegExp(`${attr}\s*=\s*["'][^"']*["']`, 'gi');
            sanitized = sanitized.replace(regex, '');
        }
        
        return sanitized;
    }
    
    stripHTMLTags(html) {
        return html.replace(/<[^>]*>/g, '');
    }
    
    decodeHTMLEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x2F;': '/'
        };
        
        return text.replace(/&[a-zA-Z0-9#x]+;/g, (entity) => {
            return entities[entity] || entity;
        });
    }
    
    /**
     * Event handlers and real-time monitoring
     */
    sanitizeInputField(field) {
        if (!field || !field.value) return;
        
        const fieldType = this.determineFieldType(field);
        this.validateAndSanitize(field, fieldType);
    }
    
    determineFieldType(field) {
        const id = (field.id || '').toLowerCase();
        const name = (field.name || '').toLowerCase();
        const type = (field.type || '').toLowerCase();
        
        if (type === 'email' || id.includes('email') || name.includes('email')) {
            return 'email';
        }
        
        if (type === 'tel' || id.includes('phone') || name.includes('phone') || id.includes('tel') || name.includes('tel')) {
            return 'phone';
        }
        
        if (type === 'url' || id.includes('url') || name.includes('url')) {
            return 'url';
        }
        
        return 'text';
    }
    
    handleDragDrop(event) {
        const items = event.dataTransfer.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'string') {
                items[i].getAsString((data) => {
                    const sanitized = this.sanitizeText(data);
                    if (data !== sanitized) {
                        this.logAttempt('dragdrop', 'Blocked malicious drag & drop content');
                    }
                });
            }
        }
    }
    
    sanitizeDynamicContent(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for dangerous attributes
            const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover'];
            
            dangerousAttrs.forEach(attr => {
                if (node.hasAttribute(attr)) {
                    node.removeAttribute(attr);
                    this.logAttempt('dynamic', `Removed dangerous attribute: ${attr}`);
                }
            });
            
            // Sanitize text content
            if (node.textContent) {
                const sanitized = this.sanitizeText(node.textContent);
                if (node.textContent !== sanitized) {
                    node.textContent = sanitized;
                }
            }
        }
    }
    
    /**
     * Logging and monitoring
     */
    logAttempt(type, content, details = {}) {
        if (!this.config.logging) return;
        
        const attempt = {
            timestamp: new Date().toISOString(),
            type: type,
            content: content.substring(0, 200), // Limit log size
            details: details,
            userAgent: navigator.userAgent.substring(0, 100),
            url: window.location.href
        };
        
        this.metrics.blockedAttempts++;
        this.metrics.lastAttempt = attempt;
        
        // Log to console in development
        console.warn('🚨 XSS Attempt Blocked:', attempt);
        
        // Store in localStorage for analysis
        this.storeSecurityLog(attempt);
        
        // Notify SecurityManager if available
        if (window.SecurityManager && window.securityManager) {
            window.securityManager.reportSecurityEvent?.(attempt);
        }
    }
    
    logSanitization(type, original, sanitized, fieldId = null) {
        if (!this.config.logging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'sanitization',
            type: type,
            fieldId: fieldId,
            originalLength: original.length,
            sanitizedLength: sanitized.length,
            changed: original !== sanitized
        };
        
        console.log('🧹 Content Sanitized:', logEntry);
    }
    
    storeSecurityLog(attempt) {
        try {
            const logs = JSON.parse(localStorage.getItem('xss_security_logs') || '[]');
            logs.push(attempt);
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('xss_security_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to store security log:', error);
        }
    }
    
    /**
     * Performance monitoring
     */
    recordPerformance(method, duration) {
        this.performanceMetrics.push({
            method: method,
            duration: duration,
            timestamp: Date.now()
        });
        
        // Keep only recent metrics
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > oneHourAgo);
        
        // Alert if performance is degrading
        if (duration > this.performanceThreshold) {
            console.warn(`⚠️ XSS Protection performance warning: ${method} took ${duration.toFixed(2)}ms`);
        }
    }
    
    getMetrics() {
        const avgPerformance = this.performanceMetrics.length > 0 
            ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length
            : 0;
        
        return {
            isInitialized: this.isInitialized,
            domPurifyAvailable: !!this.domPurify,
            blockedAttempts: this.metrics.blockedAttempts,
            sanitizedInputs: this.metrics.sanitizedInputs,
            errors: this.metrics.errors,
            lastAttempt: this.metrics.lastAttempt,
            avgPerformance: avgPerformance.toFixed(2) + 'ms',
            performanceThreshold: this.performanceThreshold + 'ms'
        };
    }
    
    /**
     * Error handling
     */
    handleError(method, error) {
        this.metrics.errors++;
        console.error(`❌ XSS Protection error in ${method}:`, error);
        
        // Report to error tracking if available
        if (window.errorReporter) {
            window.errorReporter.reportError(error, { context: `XSSProtection.${method}` });
        }
    }
    
    handleInitializationError(error) {
        console.error('❌ XSS Protection failed to initialize:', error);
        
        // Set up basic fallback protection
        this.setupFallbackProtection();
    }
    
    setupFallbackProtection() {
        console.log('🛡️ Setting up fallback XSS protection...');
        
        // Basic event listeners without DOMPurify
        document.addEventListener('input', (e) => {
            if (e.target.value && typeof e.target.value === 'string') {
                const sanitized = this.fallbackTextSanitize(e.target.value);
                if (e.target.value !== sanitized) {
                    e.target.value = sanitized;
                    this.logAttempt('fallback', 'Basic sanitization applied');
                }
            }
        });
    }
    
    handleInvalidInput(input, type) {
        this.logAttempt('invalid_input', `Invalid ${type} input: ${typeof input}`);
        return typeof input === 'string' ? input : '';
    }
    
    safeFallback(input, type) {
        this.logAttempt('safe_fallback', `Using safe fallback for ${type}`);
        return '';
    }
    
    /**
     * Integration methods
     */
    integrateWithSecurityManager() {
        if (window.SecurityManager && window.securityManager) {
            // Add XSS protection to SecurityManager methods
            window.securityManager.sanitizeInput = (input, type) => {
                return this.sanitizeText(input);
            };
            
            window.securityManager.getXSSMetrics = () => {
                return this.getMetrics();
            };
            
            console.log('🔗 XSS Protection integrated with SecurityManager');
        }
    }
    
    integrateFallbackMethods() {
        // Provide fallback methods if DOMPurify fails
        if (!this.domPurify) {
            console.log('🔄 Setting up XSS fallback methods');
        }
    }
    
    /**
     * Visual feedback
     */
    showSanitizationFeedback(field) {
        if (!field) return;
        
        // Add visual indicator
        field.style.borderColor = '#ffa500';
        field.style.boxShadow = '0 0 5px rgba(255, 165, 0, 0.5)';
        
        // Remove after 2 seconds
        setTimeout(() => {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }, 2000);
        
        // Show tooltip if supported
        if (field.title === undefined || field.title === '') {
            field.title = 'Contenido sanitizado por seguridad';
            setTimeout(() => {
                field.title = '';
            }, 3000);
        }
    }
    
    /**
     * Real-time monitoring
     */
    startMonitoring() {
        // Monitor performance every 5 minutes
        setInterval(() => {
            this.performanceCheck();
        }, 5 * 60 * 1000);
        
        // Clean old logs every hour
        setInterval(() => {
            this.cleanOldLogs();
        }, 60 * 60 * 1000);
    }
    
    performanceCheck() {
        const metrics = this.getMetrics();
        if (parseFloat(metrics.avgPerformance) > this.performanceThreshold) {
            console.warn('⚠️ XSS Protection performance degraded:', metrics.avgPerformance);
        }
    }
    
    cleanOldLogs() {
        try {
            const logs = JSON.parse(localStorage.getItem('xss_security_logs') || '[]');
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            const recentLogs = logs.filter(log => {
                return new Date(log.timestamp).getTime() > oneDayAgo;
            });
            
            localStorage.setItem('xss_security_logs', JSON.stringify(recentLogs));
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
    
    /**
     * Browser Extension Protection Methods
     * Específicamente diseñadas para detectar y bloquear inyecciones de extensiones
     */
    
    // Detectar y bloquear extensiones maliciosas
    detectMaliciousExtensions() {
        const extensionPatterns = [
            /chrome-extension:\/\/invalid\//gi,
            /chrome-extension:\/\/.*\/inject/gi,
            /moz-extension:\/\/.*\/inject/gi,
            /ms-browser-extension:\/\//gi,
            /webkit-extension:\/\//gi
        ];
        
        const detectedExtensions = [];
        
        // Verificar scripts en el DOM
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const src = script.src || '';
            extensionPatterns.forEach(pattern => {
                if (pattern.test(src)) {
                    detectedExtensions.push({
                        type: 'script',
                        source: src,
                        element: script
                    });
                }
            });
        });
        
        // Verificar iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            extensionPatterns.forEach(pattern => {
                if (pattern.test(src)) {
                    detectedExtensions.push({
                        type: 'iframe',
                        source: src,
                        element: iframe
                    });
                }
            });
        });
        
        return detectedExtensions;
    }
    
    // Bloquear extensiones detectadas
    blockDetectedExtensions() {
        const detectedExtensions = this.detectMaliciousExtensions();
        let blocked = 0;
        
        detectedExtensions.forEach(extension => {
            try {
                // Remover el elemento del DOM
                if (extension.element && extension.element.parentNode) {
                    extension.element.parentNode.removeChild(extension.element);
                    blocked++;
                    
                    this.logAttempt('extension', `Blocked malicious extension: ${extension.source}`);
                    this.metrics.blockedAttempts++;
                }
            } catch (error) {
                console.warn('⚠️ Error removing extension element:', error);
            }
        });
        
        if (blocked > 0) {
            console.warn(`🛡️ XSS Protection: Blocked ${blocked} malicious extension injections`);
        }
        
        return blocked;
    }
    
    // Sanitizar URLs de extensiones
    sanitizeExtensionURL(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }
        
        const extensionProtocols = [
            'chrome-extension://',
            'moz-extension://',
            'ms-browser-extension://',
            'webkit-extension://',
            'extension://'
        ];
        
        const lowerUrl = url.toLowerCase();
        
        for (const protocol of extensionProtocols) {
            if (lowerUrl.startsWith(protocol)) {
                this.logAttempt('extension-url', `Blocked extension URL: ${url}`);
                this.metrics.blockedAttempts++;
                return '#blocked-extension-url';
            }
        }
        
        return url;
    }
    
    // Validar contenido para inyecciones de extensiones
    validateContentForExtensions(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        const extensionPatterns = [
            /chrome-extension:\/\/[^\/]*\/inject\.bundle\.js/gi,
            /chrome-extension:\/\/invalid\//gi,
            /\.bundle\.js\?.*extension/gi,
            /inject\.bundle\.js/gi
        ];
        
        let hasExtensionContent = false;
        
        extensionPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                hasExtensionContent = true;
            }
        });
        
        if (hasExtensionContent) {
            this.logAttempt('extension-content', 'Content contains extension injection patterns');
            this.metrics.blockedAttempts++;
            return ''; // Eliminar completamente el contenido sospechoso
        }
        
        return content;
    }
    
    // Monitor de mutaciones del DOM para extensiones
    setupExtensionMonitoring() {
        if (!window.MutationObserver) {
            console.warn('⚠️ MutationObserver not supported, extension monitoring limited');
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanElementForExtensions(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'href']
        });
        
        console.log('🕵️ Extension monitoring active - DOM mutations being watched');
        return observer;
    }
    
    // Escanear elemento específico para contenido de extensión
    scanElementForExtensions(element) {
        // Verificar scripts
        const scripts = element.querySelectorAll ? element.querySelectorAll('script') : 
                       (element.tagName === 'SCRIPT' ? [element] : []);
        
        scripts.forEach(script => {
            const src = script.src;
            if (src && this.sanitizeExtensionURL(src) !== src) {
                // URL fue sanitizada, remover elemento
                try {
                    script.parentNode?.removeChild(script);
                    console.warn('🛡️ Removed malicious extension script:', src);
                } catch (error) {
                    console.warn('Error removing extension script:', error);
                }
            }
        });
        
        // Verificar iframes
        const iframes = element.querySelectorAll ? element.querySelectorAll('iframe') : 
                        (element.tagName === 'IFRAME' ? [element] : []);
        
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && this.sanitizeExtensionURL(src) !== src) {
                try {
                    iframe.parentNode?.removeChild(iframe);
                    console.warn('🛡️ Removed malicious extension iframe:', src);
                } catch (error) {
                    console.warn('Error removing extension iframe:', error);
                }
            }
        });
    }
    
    // Obtener estadísticas de extensiones bloqueadas
    getExtensionStats() {
        return {
            blockedExtensions: this.metrics.blockedAttempts,
            lastExtensionAttempt: this.metrics.lastAttempt,
            isMonitoring: !!this.extensionObserver
        };
    }

    /**
     * Public API methods
     */
    isReady() {
        return this.isInitialized;
    }
    
    getSecurityLogs() {
        try {
            return JSON.parse(localStorage.getItem('xss_security_logs') || '[]');
        } catch {
            return [];
        }
    }
    
    clearLogs() {
        localStorage.removeItem('xss_security_logs');
        this.metrics = {
            blockedAttempts: 0,
            sanitizedInputs: 0,
            errors: 0,
            lastAttempt: null
        };
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 XSS Protection configuration updated:', this.config);
    }
}

// Global initialization
let xssProtection;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        xssProtection = new XSSProtection();
        window.xssProtection = xssProtection;
    });
} else {
    xssProtection = new XSSProtection();
    window.xssProtection = xssProtection;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XSSProtection;
}

console.log('🛡️ XSS Protection System loaded - Zero tolerance for XSS attacks');