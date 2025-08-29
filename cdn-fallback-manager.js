/**
 * CDN FALLBACK MANAGER v1.0
 * Sistema de respaldo robusto para dependencias CDN fallidas
 * Proporciona funcionalidad básica cuando las librerías CDN no están disponibles
 */

class CDNFallbackManager {
    constructor() {
        this.version = '1.0.0';
        this.systemName = 'CDN Fallback Manager';
        this.initialized = false;
        this.fallbacks = new Map();
        this.logs = [];
        
        this.log('INFO', 'CDN Fallback Manager initialized');
        this.initializeFallbacks();
    }
    
    // Enhanced logging
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            system: 'FALLBACK'
        };
        
        this.logs.push(logEntry);
        
        const colors = {
            'INFO': 'color: #03A9F4; font-weight: bold;',
            'SUCCESS': 'color: #4CAF50; font-weight: bold;',
            'WARNING': 'color: #FF9800; font-weight: bold;',
            'ERROR': 'color: #F44336; font-weight: bold;'
        };
        
        const prefix = `[FALLBACK-${level}]`;
        console.log(`%c${prefix} ${message}`, colors[level] || '', data || '');
    }
    
    // Initialize all fallback systems
    initializeFallbacks() {
        this.log('INFO', 'Setting up fallback systems...');
        
        // jsPDF Fallback
        this.setupJSPDFFallback();
        
        // html2canvas Fallback
        this.setupHTML2CanvasFallback();
        
        // SignaturePad Fallback
        this.setupSignaturePadFallback();
        
        this.initialized = true;
        this.log('SUCCESS', 'All fallback systems initialized');
    }
    
    // jsPDF Fallback: Basic PDF generation using browser APIs
    setupJSPDFFallback() {
        this.fallbacks.set('jsPDF', {
            name: 'jsPDF Fallback',
            available: () => typeof window.jsPDF !== 'undefined' && typeof window.jspdf !== 'undefined',
            fallback: this.createJSPDFFallback.bind(this)
        });
    }
    
    createJSPDFFallback() {
        this.log('WARNING', 'Creating jsPDF fallback system');
        
        // Basic PDF fallback using browser print API and HTML structure
        window.jsPDFFallback = {
            create: (data) => {
                this.log('INFO', 'Using PDF fallback - generating HTML structure');
                
                return {
                    generatePDF: () => {
                        this.log('WARNING', 'PDF generation not available - using print fallback');
                        
                        // Create print-friendly HTML structure
                        const printContent = this.createPrintableContent(data);
                        const printWindow = window.open('', '_blank');
                        
                        printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Recibo - CIAOCIAO.MX</title>
                                    <style>
                                        @media print {
                                            body { margin: 0; font-family: Arial, sans-serif; }
                                            .receipt { max-width: 210mm; margin: auto; padding: 20mm; }
                                            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                                            .section { margin: 15px 0; }
                                            .field { margin: 5px 0; display: flex; justify-content: space-between; }
                                            .signature-area { height: 60px; border: 1px solid #000; margin: 10px 0; background: #f9f9f9; }
                                            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
                                        }
                                        @media screen {
                                            body { background: #f0f0f0; padding: 20px; }
                                            .receipt { background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                                            .no-pdf-warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="no-pdf-warning">
                                        <h4>⚠️ Modo de Compatibilidad</h4>
                                        <p>PDF no disponible. Use Ctrl+P para imprimir o guardar como PDF desde su navegador.</p>
                                    </div>
                                    ${printContent}
                                    <script>
                                        window.onload = function() {
                                            window.print();
                                        }
                                    </script>
                                </body>
                            </html>
                        `);
                        
                        printWindow.document.close();
                        return { success: true, method: 'print_fallback' };
                    },
                    
                    downloadAsHTML: () => {
                        this.log('INFO', 'Creating downloadable HTML version');
                        
                        const htmlContent = this.createPrintableContent(data);
                        const blob = new Blob([`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Recibo - CIAOCIAO.MX</title>
                                    <meta charset="UTF-8">
                                    <style>
                                        body { font-family: Arial, sans-serif; max-width: 800px; margin: auto; padding: 20px; }
                                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                                        .section { margin: 20px 0; }
                                        .field { margin: 8px 0; display: flex; justify-content: space-between; align-items: center; }
                                        .signature-area { height: 80px; border: 2px dashed #ccc; margin: 15px 0; background: #f9f9f9; display: flex; align-items: center; justify-content: center; color: #666; }
                                        .total { font-weight: bold; font-size: 1.3em; border-top: 2px solid #333; padding-top: 15px; margin-top: 20px; }
                                    </style>
                                </head>
                                <body>
                                    ${htmlContent}
                                </body>
                            </html>
                        `], { type: 'text/html' });
                        
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `recibo-${data.receiptNumber || 'sin-numero'}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        return { success: true, method: 'html_download' };
                    }
                };
                
                return window.jsPDFFallback;
            }
        };
    }
    
    createPrintableContent(data) {
        return `
            <div class="receipt">
                <div class="header">
                    <h2>CIAOCIAO.MX - Joyería Fina</h2>
                    <p>Recibo: ${data.receiptNumber || 'N/A'}</p>
                    <p>Fecha: ${data.date || new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="section">
                    <h3>Información del Cliente</h3>
                    <div class="field"><span>Nombre:</span><span>${data.clientName || 'N/A'}</span></div>
                    <div class="field"><span>Teléfono:</span><span>${data.clientPhone || 'N/A'}</span></div>
                    <div class="field"><span>Email:</span><span>${data.clientEmail || 'N/A'}</span></div>
                </div>
                
                <div class="section">
                    <h3>Detalles del Producto</h3>
                    <div class="field"><span>Tipo:</span><span>${data.pieceType || 'N/A'}</span></div>
                    <div class="field"><span>Material:</span><span>${data.material || 'N/A'}</span></div>
                    <div class="field"><span>Peso:</span><span>${data.weight || 'N/A'} gramos</span></div>
                    <div class="field"><span>Descripción:</span><span>${data.description || 'N/A'}</span></div>
                </div>
                
                <div class="section">
                    <h3>Información Financiera</h3>
                    <div class="field"><span>Precio Total:</span><span>$${data.price || '0.00'}</span></div>
                    <div class="field"><span>Anticipo:</span><span>$${data.deposit || '0.00'}</span></div>
                    <div class="field"><span>Saldo:</span><span>$${data.balance || '0.00'}</span></div>
                </div>
                
                <div class="section">
                    <h3>Firmas</h3>
                    <div>
                        <p>Firma del Cliente:</p>
                        <div class="signature-area">${data.clientSignature ? '[Firma Digital]' : '[Área de Firma]'}</div>
                    </div>
                    <div>
                        <p>Firma de CIAOCIAO.MX:</p>
                        <div class="signature-area">${data.companySignature ? '[Firma Digital]' : '[Área de Firma]'}</div>
                    </div>
                </div>
                
                <div class="section total">
                    <div class="field"><span>TOTAL A PAGAR:</span><span>$${data.balance || data.price || '0.00'}</span></div>
                </div>
                
                <div class="section">
                    <p><small>Observaciones: ${data.observations || 'Ninguna'}</small></p>
                </div>
            </div>
        `;
    }
    
    // html2canvas Fallback: DOM-to-Image conversion using native APIs
    setupHTML2CanvasFallback() {
        this.fallbacks.set('html2canvas', {
            name: 'html2canvas Fallback',
            available: () => typeof window.html2canvas !== 'undefined',
            fallback: this.createHTML2CanvasFallback.bind(this)
        });
    }
    
    createHTML2CanvasFallback() {
        this.log('WARNING', 'Creating html2canvas fallback system');
        
        // Basic screenshot fallback using DOM manipulation
        window.html2canvasFallback = (element, options = {}) => {
            this.log('INFO', 'Using html2canvas fallback - DOM manipulation');
            
            return new Promise((resolve, reject) => {
                try {
                    // Create a simplified version for fallback
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas dimensions
                    const rect = element.getBoundingClientRect();
                    canvas.width = rect.width || 800;
                    canvas.height = rect.height || 600;
                    
                    // Fill with white background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Add text indicating fallback mode
                    ctx.fillStyle = '#333333';
                    ctx.font = '16px Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Screenshot no disponible', canvas.width / 2, canvas.height / 2 - 20);
                    ctx.fillText('Use PDF o impresión directa', canvas.width / 2, canvas.height / 2 + 20);
                    
                    // Add border
                    ctx.strokeStyle = '#cccccc';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                    
                    this.log('SUCCESS', 'html2canvas fallback completed');
                    resolve(canvas);
                    
                } catch (error) {
                    this.log('ERROR', 'html2canvas fallback failed', error);
                    reject(error);
                }
            });
        };
        
        // Replace window.html2canvas if it doesn't exist
        if (typeof window.html2canvas === 'undefined') {
            window.html2canvas = window.html2canvasFallback;
        }
    }
    
    // SignaturePad Fallback: Text-based signature system
    setupSignaturePadFallback() {
        this.fallbacks.set('SignaturePad', {
            name: 'SignaturePad Fallback',
            available: () => typeof window.SignaturePad !== 'undefined',
            fallback: this.createSignaturePadFallback.bind(this)
        });
    }
    
    createSignaturePadFallback() {
        this.log('WARNING', 'Creating SignaturePad fallback system');
        
        // Text-based signature fallback
        window.SignaturePadFallback = class SignaturePadFallback {
            constructor(canvas, options = {}) {
                this.canvas = canvas;
                this.options = options;
                this.isDrawing = false;
                this.isEmpty = true;
                this.signatureText = '';
                
                this.setupFallbackInterface();
                this.log = window.CDNFallbackManager ? window.CDNFallbackManager.log.bind(window.CDNFallbackManager) : console.log;
                this.log('INFO', 'SignaturePad fallback initialized');
            }
            
            setupFallbackInterface() {
                // Replace canvas with text input for signature
                const container = this.canvas.parentElement;
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'signature-fallback';
                fallbackDiv.style.cssText = `
                    border: 2px dashed #ccc;
                    padding: 20px;
                    text-align: center;
                    background: #f9f9f9;
                    margin: 10px 0;
                `;
                
                fallbackDiv.innerHTML = `
                    <div style="margin-bottom: 15px; color: #666;">
                        <strong>⚠️ Firma Digital No Disponible</strong><br>
                        <small>Ingrese su nombre como firma digital</small>
                    </div>
                    <input type="text" placeholder="Escriba su nombre completo aquí" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; text-align: center;">
                    <div style="margin-top: 10px;">
                        <button type="button" onclick="this.parentElement.parentElement.querySelector('input').value=''" 
                                style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Limpiar
                        </button>
                    </div>
                `;
                
                const textInput = fallbackDiv.querySelector('input');
                textInput.addEventListener('input', (e) => {
                    this.signatureText = e.target.value;
                    this.isEmpty = !e.target.value.trim();
                });
                
                // Hide original canvas and show fallback
                this.canvas.style.display = 'none';
                container.insertBefore(fallbackDiv, this.canvas);
                
                this.fallbackDiv = fallbackDiv;
                this.textInput = textInput;
            }
            
            clear() {
                this.signatureText = '';
                this.isEmpty = true;
                if (this.textInput) {
                    this.textInput.value = '';
                }
            }
            
            isEmpty() {
                return this.isEmpty;
            }
            
            toDataURL(type = 'image/png') {
                // Generate a simple signature image with text
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                if (this.signatureText) {
                    // Draw signature text
                    ctx.fillStyle = '#000000';
                    ctx.font = '24px cursive, Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.signatureText, canvas.width / 2, canvas.height / 2);
                    
                    // Add underline
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(50, canvas.height - 20);
                    ctx.lineTo(canvas.width - 50, canvas.height - 20);
                    ctx.stroke();
                } else {
                    // Empty signature placeholder
                    ctx.fillStyle = '#cccccc';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('[Sin firma]', canvas.width / 2, canvas.height / 2);
                }
                
                return canvas.toDataURL(type);
            }
            
            fromDataURL(dataUrl) {
                // Not supported in fallback mode
                this.log('WARNING', 'fromDataURL not supported in fallback mode');
            }
        };
        
        // Replace SignaturePad if it doesn't exist
        if (typeof window.SignaturePad === 'undefined') {
            window.SignaturePad = window.SignaturePadFallback;
        }
    }
    
    // Activate fallback for a specific library
    activateFallback(libraryName) {
        const fallback = this.fallbacks.get(libraryName);
        
        if (!fallback) {
            this.log('ERROR', `No fallback available for ${libraryName}`);
            return false;
        }
        
        if (fallback.available()) {
            this.log('INFO', `${libraryName} is already available, no fallback needed`);
            return true;
        }
        
        this.log('WARNING', `Activating fallback for ${libraryName}`);
        return fallback.fallback();
    }
    
    // Activate all fallbacks for missing libraries
    activateAllFallbacks() {
        this.log('INFO', 'Checking and activating all necessary fallbacks...');
        
        let activatedCount = 0;
        let totalCount = 0;
        
        for (const [libraryName, fallback] of this.fallbacks) {
            totalCount++;
            
            if (!fallback.available()) {
                this.log('WARNING', `${libraryName} not available, activating fallback...`);
                if (this.activateFallback(libraryName)) {
                    activatedCount++;
                }
            } else {
                this.log('SUCCESS', `${libraryName} is available, no fallback needed`);
            }
        }
        
        this.log('INFO', `Fallback activation complete: ${activatedCount}/${totalCount} fallbacks activated`);
        
        return {
            activated: activatedCount,
            total: totalCount,
            success: true
        };
    }
    
    // Get system status
    getStatus() {
        const status = {
            initialized: this.initialized,
            availableLibraries: [],
            activeFallbacks: [],
            timestamp: Date.now()
        };
        
        for (const [libraryName, fallback] of this.fallbacks) {
            if (fallback.available()) {
                status.availableLibraries.push(libraryName);
            } else {
                status.activeFallbacks.push(libraryName);
            }
        }
        
        return status;
    }
    
    // Get logs
    getLogs() {
        return this.logs;
    }
}

// Global initialization
let cdnFallbackManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cdnFallbackManager = new CDNFallbackManager();
        window.cdnFallbackManager = cdnFallbackManager;
    });
} else {
    cdnFallbackManager = new CDNFallbackManager();
    window.cdnFallbackManager = cdnFallbackManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDNFallbackManager;
}

console.log('🔄 CDN Fallback Manager loaded and ready');