// ENHANCED PDF GENERATOR - CIAOCIAO.MX JOYERÍA FINA
// Professional, elegant PDF receipts for fine jewelry

console.log('💎 Loading Enhanced PDF Generator for Fine Jewelry...');

// Professional color palette for fine jewelry
const LUXURY_COLORS = {
    primaryNavy: '#1B365D',      // Elegant navy blue
    accentGold: '#C9A96E',       // Subtle gold accent
    charcoal: '#2C2C2C',         // Sophisticated charcoal
    pearlWhite: '#F8F8F8',       // Clean pearl white
    silver: '#E5E5E5',           // Silver for borders
    emerald: '#1B5B3C',          // Emerald green for success
    burgundy: '#722F37',         // Burgundy for errors
    champagne: '#F4E4BC',        // Champagne background
    platinum: '#E5E4E2'          // Platinum accents
};

// Function to ensure jsPDF is loaded
async function loadJsPDF() {
    console.log('📥 Loading jsPDF for enhanced generation...');
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ jsPDF loaded successfully for enhanced generation');
            setTimeout(resolve, 100);
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load jsPDF');
            reject(new Error('Failed to load jsPDF'));
        };
        
        document.head.appendChild(script);
    });
}

// Enhanced PDF Generation Function with professional design
window.generateEnhancedPDF = async function() {
    console.log('💎 STARTING ENHANCED PDF GENERATION FOR FINE JEWELRY...');
    
    try {
        // Step 1: Ensure jsPDF is available
        let jsPDFLib = null;
        if (window.jsPDF) {
            jsPDFLib = window.jsPDF;
            console.log('✅ jsPDF already available');
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFLib = window.jspdf.jsPDF;
            console.log('✅ jsPDF available as jspdf.jsPDF');
        } else {
            console.log('📥 Loading jsPDF...');
            await loadJsPDF();
            
            if (window.jsPDF) {
                jsPDFLib = window.jsPDF;
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFLib = window.jspdf.jsPDF;
            } else {
                throw new Error('jsPDF failed to load');
            }
        }
        
        // Step 2: Verify form validation
        if (typeof validateForm === 'function' && !validateForm()) {
            console.error('❌ Form validation failed');
            return;
        }
        
        // Step 3: Collect form data
        let formData;
        if (typeof collectFormData === 'function') {
            formData = collectFormData();
        } else {
            // Fallback data collection
            formData = {
                receiptNumber: document.getElementById('receiptNumber')?.value || 'CIAO-' + Date.now(),
                receiptDate: document.getElementById('receiptDate')?.value || new Date().toISOString().split('T')[0],
                clientName: document.getElementById('clientName')?.value || 'Cliente',
                clientPhone: document.getElementById('clientPhone')?.value || '',
                clientEmail: document.getElementById('clientEmail')?.value || '',
                pieceType: document.getElementById('pieceType')?.value || '',
                material: document.getElementById('material')?.value || '',
                price: document.getElementById('price')?.value || '0',
                description: document.getElementById('description')?.value || ''
            };
        }
        
        console.log('✅ Form data collected');
        
        // Step 4: Generate professional HTML content
        let htmlContent;
        if (typeof generateProfessionalReceiptHTML === 'function') {
            htmlContent = generateProfessionalReceiptHTML(formData);
        } else {
            // Professional fallback HTML
            htmlContent = generateEnhancedReceiptHTML(formData);
        }
        
        // Step 5: Create temporary container for html2canvas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 800px;
            padding: 40px;
            font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
            background: ${LUXURY_COLORS.pearlWhite};
            color: ${LUXURY_COLORS.charcoal};
            box-sizing: border-box;
        `;
        document.body.appendChild(tempDiv);
        
        // Step 6: Generate canvas
        console.log('🎨 Generating canvas with html2canvas...');
        
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas not available');
        }
        
        const canvas = await html2canvas(tempDiv, {
            width: 800,
            height: 1123, // A4 aspect ratio
            scale: 2, // High resolution for print
            logging: false,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff'
        });
        
        // Clean up
        document.body.removeChild(tempDiv);
        console.log('✅ Canvas generated successfully');
        
        // Step 7: Create PDF
        console.log('📄 Creating PDF document...');
        
        const pdf = new jsPDFLib('p', 'mm', 'a4'); // portrait, mm, A4
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm
        const margin = 15;
        
        const canvasRatio = canvas.width / canvas.height;
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / canvasRatio;
        
        if (imgHeight > availableHeight) {
            imgHeight = availableHeight;
            imgWidth = imgHeight * canvasRatio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        // Step 8: Save the PDF
        const filename = `Recibo_CIAO-${formData.receiptNumber}-${formData.clientName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(filename);
        
        console.log('✅ PDF saved successfully:', filename);
        
        // Show success message
        if (window.utils && utils.showNotification) {
            utils.showNotification('PDF profesional generado exitosamente', 'success');
        } else {
            alert('✅ PDF profesional generado exitosamente: ' + filename);
        }
        
        return { success: true, filename };
        
    } catch (error) {
        console.error('❌ Enhanced PDF Generation Error:', error);
        
        // Show user-friendly error
        const errorMsg = 'Error generando PDF profesional: ' + error.message;
        if (window.utils && utils.showNotification) {
            utils.showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
        
        return { success: false, error: error.message };
    }
};

// Enhanced receipt HTML generation for fine jewelry
function generateEnhancedReceiptHTML(formData) {
    const utils = window.utils || {
        formatCurrency: (amount) => `$${parseFloat(amount || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        formatDate: (date) => new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
        capitalize: (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
    };
    
    return `
        <div style="
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
            color: ${LUXURY_COLORS.charcoal};
            background: ${LUXURY_COLORS.pearlWhite};
            box-sizing: border-box;
            line-height: 1.6;
        ">
            <!-- Elegant Header -->
            <div style="
                text-align: center;
                margin-bottom: 40px;
                padding: 30px;
                background: linear-gradient(135deg, ${LUXURY_COLORS.primaryNavy} 0%, #0F2A4A 100%);
                border-radius: 12px;
                color: white;
            ">
                <h1 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 36px;
                    font-weight: 700;
                    margin: 0 0 20px 0;
                    letter-spacing: 2px;
                ">CIAOCIAO.MX</h1>
                <h2 style="
                    font-size: 24px;
                    font-weight: 400;
                    margin: 0;
                    opacity: 0.9;
                ">Joyería Fina</h2>
                <div style="margin-top: 20px; font-size: 16px;">
                    +52 1 55 9211 2643
                </div>
            </div>
            
            <!-- Receipt Information -->
            <div style="
                margin-bottom: 30px;
                padding: 25px;
                background: white;
                border-radius: 8px;
                border: 1px solid ${LUXURY_COLORS.silver};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <h3 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 20px;
                    color: ${LUXURY_COLORS.primaryNavy};
                    margin: 0 0 20px 0;
                    border-bottom: 2px solid ${LUXURY_COLORS.accentGold};
                    padding-bottom: 10px;
                ">RECIBO DE VENTA</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Número:</strong><br>
                        ${formData.receiptNumber}
                    </div>
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Fecha:</strong><br>
                        ${utils.formatDate(formData.receiptDate)}
                    </div>
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Tipo:</strong><br>
                        ${utils.capitalize(formData.transactionType)}
                    </div>
                </div>
            </div>
            
            <!-- Client Information -->
            <div style="
                margin-bottom: 30px;
                padding: 25px;
                background: white;
                border-radius: 8px;
                border: 1px solid ${LUXURY_COLORS.silver};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <h3 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 20px;
                    color: ${LUXURY_COLORS.primaryNavy};
                    margin: 0 0 20px 0;
                    border-bottom: 2px solid ${LUXURY_COLORS.accentGold};
                    padding-bottom: 10px;
                ">DATOS DEL CLIENTE</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Nombre:</strong><br>
                        ${formData.clientName}
                    </div>
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Teléfono:</strong><br>
                        ${formData.clientPhone}
                    </div>
                    ${formData.clientEmail ? `
                        <div style="grid-column: span 2;">
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Email:</strong><br>
                            ${formData.clientEmail}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Piece Details -->
            <div style="
                margin-bottom: 30px;
                padding: 25px;
                background: white;
                border-radius: 8px;
                border: 1px solid ${LUXURY_COLORS.silver};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <h3 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 20px;
                    color: ${LUXURY_COLORS.primaryNavy};
                    margin: 0 0 20px 0;
                    border-bottom: 2px solid ${LUXURY_COLORS.accentGold};
                    padding-bottom: 10px;
                ">DETALLES DE LA PIEZA</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Tipo:</strong><br>
                        ${utils.capitalize(formData.pieceType)}
                    </div>
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Material:</strong><br>
                        ${formData.material.replace('-', ' ').toUpperCase()}
                    </div>
                    ${formData.weight ? `
                        <div>
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Peso:</strong><br>
                            ${formData.weight} gramos
                        </div>
                    ` : ''}
                    ${formData.size ? `
                        <div>
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Talla:</strong><br>
                            ${formData.size}
                        </div>
                    ` : ''}
                    ${formData.sku ? `
                        <div>
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">SKU:</strong><br>
                            ${formData.sku}
                        </div>
                    ` : ''}
                </div>
                
                ${formData.description ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${LUXURY_COLORS.silver};">
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Descripción:</strong><br>
                        ${formData.description}
                    </div>
                ` : ''}
            </div>
            
            <!-- Financial Information -->
            <div style="
                margin-bottom: 30px;
                padding: 25px;
                background: white;
                border-radius: 8px;
                border: 1px solid ${LUXURY_COLORS.silver};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <h3 style="
                    font-family: 'Playfair Display', serif;
                    font-size: 20px;
                    color: ${LUXURY_COLORS.primaryNavy};
                    margin: 0 0 20px 0;
                    border-bottom: 2px solid ${LUXURY_COLORS.accentGold};
                    padding-bottom: 10px;
                ">INFORMACIÓN FINANCIERA</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong style="color: ${LUXURY_COLORS.primaryNavy};">Precio:</strong><br>
                        ${utils.formatCurrency(formData.price)}
                    </div>
                    ${formData.contribution > 0 ? `
                        <div>
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Aportación:</strong><br>
                            ${utils.formatCurrency(formData.contribution)}
                        </div>
                        <div style="grid-column: span 2; background: ${LUXURY_COLORS.champagne}; padding: 15px; border-radius: 6px; border-left: 4px solid ${LUXURY_COLORS.accentGold};">
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Subtotal:</strong><br>
                            ${utils.formatCurrency(formData.subtotal)}
                        </div>
                    ` : ''}
                    ${formData.deposit > 0 ? `
                        <div>
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Anticipo:</strong><br>
                            ${utils.formatCurrency(formData.deposit)}
                        </div>
                        <div style="grid-column: span 2; background: #FFF3E0; padding: 15px; border-radius: 6px; border-left: 4px solid #FF9800;">
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Saldo Pendiente:</strong><br>
                            ${utils.formatCurrency(formData.balance)}
                        </div>
                    ` : `
                        <div style="grid-column: span 2; background: ${LUXURY_COLORS.champagne}; padding: 15px; border-radius: 6px; border-left: 4px solid ${LUXURY_COLORS.emerald};">
                            <strong style="color: ${LUXURY_COLORS.primaryNavy};">Total Pagado:</strong><br>
                            ${utils.formatCurrency(formData.subtotal || formData.price)}
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="
                text-align: center;
                padding: 30px;
                background: ${LUXURY_COLORS.primaryNavy};
                color: white;
                border-radius: 8px;
                margin-top: 40px;
            ">
                <p style="margin: 0 0 10px 0; font-size: 16px;">
                    Gracias por su preferencia
                </p>
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                    ciaociao.mx · +52 1 55 9211 2643
                </p>
            </div>
        </div>
    `;
}

// Replace the original generatePDF function with the enhanced one
window.originalGeneratePDF = window.generatePDF;
window.generatePDF = window.generateEnhancedPDF;

console.log('✅ Enhanced PDF Generator loaded and active');
console.log('📝 Original generatePDF saved as originalGeneratePDF');
console.log('💎 New enhanced generatePDF is now active');