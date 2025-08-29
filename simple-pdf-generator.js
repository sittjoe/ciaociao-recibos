// SIMPLIFIED PDF GENERATOR
// This replaces the complex PDF system with a simple, working solution

console.log('🔧 Loading Simplified PDF Generator...');

// Function to ensure jsPDF is loaded
async function loadJsPDFDirect() {
    console.log('📥 Loading jsPDF directly...');
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ jsPDF loaded successfully');
            setTimeout(resolve, 100); // Give it time to initialize
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load jsPDF');
            reject(new Error('Failed to load jsPDF'));
        };
        
        document.head.appendChild(script);
    });
}

// Simplified PDF Generation Function
window.generateSimplePDF = async function() {
    console.log('🚀 STARTING SIMPLIFIED PDF GENERATION...');
    
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
            await loadJsPDFDirect();
            
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
        
        // Step 4: Generate HTML content
        let htmlContent;
        if (typeof generateReceiptHTML === 'function') {
            htmlContent = generateReceiptHTML(formData);
        } else {
            // Simple fallback HTML
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
                    <h1 style="color: #D4AF37; text-align: center;">CIAOCIAO.MX</h1>
                    <h2 style="text-align: center;">RECIBO DE JOYERÍA</h2>
                    
                    <div style="margin: 20px 0;">
                        <strong>Número:</strong> ${formData.receiptNumber}<br>
                        <strong>Fecha:</strong> ${formData.receiptDate}<br>
                        <strong>Cliente:</strong> ${formData.clientName}<br>
                        <strong>Teléfono:</strong> ${formData.clientPhone}<br>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong>Tipo de Pieza:</strong> ${formData.pieceType}<br>
                        <strong>Material:</strong> ${formData.material}<br>
                        <strong>Precio:</strong> $${formData.price}<br>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong>Descripción:</strong><br>
                        ${formData.description}
                    </div>
                    
                    <div style="margin-top: 40px; text-align: center;">
                        <p>Gracias por su preferencia</p>
                        <p>Tel: +52 1 55 9211 2643</p>
                    </div>
                </div>
            `;
        }
        
        // Step 5: Create temporary container for html2canvas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 800px;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
            color: black;
        `;
        document.body.appendChild(tempDiv);
        
        // Step 6: Generate canvas
        console.log('🎨 Generating canvas with html2canvas...');
        
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas not available');
        }
        
        const canvas = await html2canvas(tempDiv, {
            width: 800,
            height: 600,
            scale: 1.5,
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
        
        const pdf = new jsPDFLib('l', 'mm', 'a4'); // landscape, mm, A4
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions
        const pdfWidth = 297; // A4 landscape width in mm
        const pdfHeight = 210; // A4 landscape height in mm
        const margin = 10;
        
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
            utils.showNotification('PDF generado exitosamente', 'success');
        } else {
            alert('✅ PDF generado exitosamente: ' + filename);
        }
        
        return { success: true, filename };
        
    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        
        // Show user-friendly error
        const errorMsg = 'Error generando PDF: ' + error.message;
        if (window.utils && utils.showNotification) {
            utils.showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
        
        return { success: false, error: error.message };
    }
};

// Replace the original generatePDF function with the simple one
window.originalGeneratePDF = window.generatePDF;
window.generatePDF = window.generateSimplePDF;

console.log('✅ Simplified PDF Generator loaded and active');
console.log('📝 Original generatePDF saved as originalGeneratePDF');
console.log('🔄 New simplified generatePDF is now active');