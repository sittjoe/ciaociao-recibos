const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const ReceiptImageGenerator = require('./receipt-image-generator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/receipts', express.static(path.join(__dirname, '../receipts')));

// Create receipts directory if it doesn't exist
const receiptsDir = path.join(__dirname, '../receipts');
fs.mkdir(receiptsDir, { recursive: true }).catch(console.error);

// Initialize receipt generator
const receiptGenerator = new ReceiptImageGenerator();

// Receipt number generator
function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CCI-${year}-${month}${day}-${random}`;
}

// Format date to Spanish format
function formatDateSpanish(dateString) {
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
}

// API Routes

// Generate receipt
app.post('/api/generate-receipt', async (req, res) => {
    try {
        const data = req.body;
        
        // Add receipt number if not provided
        if (!data.receiptNumber) {
            data.receiptNumber = generateReceiptNumber();
        }
        
        // Format dates to Spanish
        if (data.issueDate) {
            data.issueDate = formatDateSpanish(data.issueDate);
        }
        if (data.deliveryDate) {
            data.deliveryDate = formatDateSpanish(data.deliveryDate);
        }
        if (data.validUntil) {
            data.validUntil = formatDateSpanish(data.validUntil);
        }
        
        // Generate receipt image
        const canvas = await receiptGenerator.generateReceipt(data);
        
        // Save as both PNG and JPEG
        const timestamp = Date.now();
        const filename = `receipt_${data.receiptNumber}_${timestamp}`;
        
        const pngPath = path.join(receiptsDir, `${filename}.png`);
        const jpegPath = path.join(receiptsDir, `${filename}.jpg`);
        
        // Save images
        await receiptGenerator.saveAsImage(canvas, pngPath, 'png');
        await receiptGenerator.saveAsImage(canvas, jpegPath, 'jpeg');
        
        // Convert to base64 for immediate display
        const pngBuffer = canvas.toBuffer('image/png');
        const base64Image = pngBuffer.toString('base64');
        
        res.json({
            success: true,
            receiptNumber: data.receiptNumber,
            imageUrl: `/receipts/${filename}.png`,
            jpegUrl: `/receipts/${filename}.jpg`,
            base64: `data:image/png;base64,${base64Image}`,
            filename: filename
        });
        
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get receipt history
app.get('/api/receipts', async (req, res) => {
    try {
        const files = await fs.readdir(receiptsDir);
        const receipts = files
            .filter(file => file.endsWith('.png'))
            .map(file => {
                const parts = file.replace('.png', '').split('_');
                return {
                    filename: file,
                    receiptNumber: parts[1] || 'Unknown',
                    timestamp: parseInt(parts[2]) || 0,
                    url: `/receipts/${file}`
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
        
        res.json({
            success: true,
            receipts: receipts
        });
        
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete receipt
app.delete('/api/receipts/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Delete both PNG and JPEG versions
        const pngPath = path.join(receiptsDir, filename);
        const jpegPath = path.join(receiptsDir, filename.replace('.png', '.jpg'));
        
        await fs.unlink(pngPath).catch(() => {});
        await fs.unlink(jpegPath).catch(() => {});
        
        res.json({
            success: true,
            message: 'Receipt deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CIAO CIAO Receipt Generator',
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║                                           ║
    ║   CIAO CIAO MX Receipt Generator Server  ║
    ║                                           ║
    ║   Running on: http://localhost:${PORT}      ║
    ║                                           ║
    ╚═══════════════════════════════════════════╝
    `);
});

module.exports = app;