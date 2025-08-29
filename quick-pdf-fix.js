// QUICK PDF GENERATION FIX
// This file provides a simplified, direct approach to fix PDF generation

console.log('🔧 Loading Quick PDF Fix...');

// Enhanced jsPDF Detection and Loading
window.ensureJsPDFAvailable = async function() {
    console.log('🔍 Checking jsPDF availability...');
    
    // Check if already loaded
    if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
        console.log('✅ jsPDF already available');
        return true;
    }
    
    console.log('📥 jsPDF not found, loading directly...');
    
    // Load jsPDF directly with multiple CDN fallbacks
    const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    ];
    
    for (let i = 0; i < cdnUrls.length; i++) {
        try {
            console.log(`🔄 Attempting to load jsPDF from CDN ${i + 1}...`);
            await loadScriptFromCDN(cdnUrls[i]);
            
            // Wait for library to be available
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
                console.log('✅ jsPDF loaded successfully!');
                return true;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to load from CDN ${i + 1}:`, error.message);
        }
    }
    
    throw new Error('❌ Failed to load jsPDF from all CDN sources');
};

// Helper function to load script from CDN
function loadScriptFromCDN(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
            console.log(`✅ Script loaded from: ${url}`);
            resolve();
        };
        
        script.onerror = () => {
            console.error(`❌ Failed to load script from: ${url}`);
            reject(new Error(`Script load failed: ${url}`));
        };
        
        document.head.appendChild(script);
    });
}

// Simplified PDF Generation Function
window.generatePDFFixed = async function() {
    console.log('🚀 Starting Fixed PDF Generation...');
    
    try {
        // Step 1: Ensure jsPDF is available
        await ensureJsPDFAvailable();
        
        // Step 2: Collect form data
        const formData = collectFormData();
        console.log('📋 Form data collected:', Object.keys(formData));
        
        // Step 3: Generate HTML content
        const htmlContent = generateReceiptHTML(formData);
        console.log('🏗️ HTML content generated');
        
        // Step 4: Create temporary container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 800px;
            padding: 30px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            background: #fff;
        `;
        document.body.appendChild(tempDiv);
        
        // Step 5: Generate canvas with html2canvas
        console.log('🎨 Generating canvas...');
        const canvas = await html2canvas(tempDiv, {
            width: 800,
            height: 600,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff'
        });
        
        // Clean up temporary element
        document.body.removeChild(tempDiv);
        
        // Step 6: Create PDF
        console.log('📄 Creating PDF...');
        
        // Get jsPDF reference
        let jsPDFLib;
        if (window.jsPDF) {
            jsPDFLib = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFLib = window.jspdf.jsPDF;
        } else {
            throw new Error('jsPDF not available after loading');
        }
        
        // Create PDF document
        const pdf = new jsPDFLib('l', 'mm', 'a4');
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        
        // Add image to PDF
        const pdfWidth = 297; // A4 landscape width
        const pdfHeight = 210; // A4 landscape height
        
        // Calculate scaling
        const canvasAspectRatio = canvas.width / canvas.height;
        const pdfAspectRatio = pdfWidth / pdfHeight;
        
        let imgWidth, imgHeight, x, y;
        
        if (canvasAspectRatio > pdfAspectRatio) {
            // Canvas is wider than PDF
            imgWidth = pdfWidth - 20; // 10mm margin on each side
            imgHeight = imgWidth / canvasAspectRatio;
            x = 10;
            y = (pdfHeight - imgHeight) / 2;
        } else {
            // Canvas is taller than PDF
            imgHeight = pdfHeight - 20; // 10mm margin on top/bottom
            imgWidth = imgHeight * canvasAspectRatio;
            x = (pdfWidth - imgWidth) / 2;
            y = 10;
        }
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        // Step 7: Save PDF
        const filename = `Recibo_CIAO-${new Date().toISOString().split('T')[0]}-${formData.clientName || 'Cliente'}.pdf`;
        pdf.save(filename);
        
        console.log('✅ PDF generated successfully!');
        return { success: true, filename };
        
    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        
        // Show user-friendly error
        if (window.utils && utils.showNotification) {
            utils.showNotification('Error generando PDF: ' + error.message, 'error');
        } else {
            alert('Error generando PDF: ' + error.message);
        }
        
        return { success: false, error: error.message };
    }
};

// Add button to test the fix
window.testPDFGeneration = function() {
    console.log('🧪 Testing PDF Generation...');
    
    // Override the original generatePDF function temporarily
    const originalGeneratePDF = window.generatePDF;
    window.generatePDF = window.generatePDFFixed;
    
    // Call the fixed function
    generatePDFFixed().then(result => {
        if (result.success) {
            console.log('✅ Test successful!');
            alert('✅ PDF generation test successful! File: ' + result.filename);
        } else {
            console.error('❌ Test failed:', result.error);
            alert('❌ PDF generation test failed: ' + result.error);
        }
    });
};

console.log('✅ Quick PDF Fix loaded successfully!');
console.log('🎯 To test, run: testPDFGeneration()');
console.log('🔧 To use permanently, replace the generatePDF function call');