const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class ReceiptImageGenerator {
    constructor() {
        this.width = 2100; // A4 width at 250 DPI
        this.height = 2970; // A4 height at 250 DPI
        this.padding = 120;
        this.lineHeight = 50;
        
        // Colors matching CIAO CIAO MX style
        this.colors = {
            primary: '#8B7355',      // Brown/Gold
            secondary: '#D4AF37',    // Gold
            text: '#2C2C2C',         // Dark gray
            lightBg: '#FBF8F3',      // Light beige
            border: '#E5D4B8',       // Light gold border
            tableHeader: '#F5F2E8',  // Table header background
            white: '#FFFFFF'
        };
    }

    async generateReceipt(data) {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');
        
        // Set white background
        ctx.fillStyle = this.colors.white;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw border
        this.drawBorder(ctx);
        
        let yPosition = this.padding;
        
        // Draw header
        yPosition = await this.drawHeader(ctx, yPosition);
        
        // Draw receipt info
        yPosition = this.drawReceiptInfo(ctx, yPosition, data);
        
        // Draw client info and dates section
        yPosition = this.drawClientAndDates(ctx, yPosition, data);
        
        // Draw products table
        yPosition = this.drawProductsTable(ctx, yPosition, data.products || []);
        
        // Draw totals
        yPosition = this.drawTotals(ctx, yPosition, data);
        
        // Draw observations
        if (data.observations) {
            yPosition = this.drawObservations(ctx, yPosition, data.observations);
        }
        
        // Draw signatures
        yPosition = this.drawSignatures(ctx, yPosition);
        
        // Draw footer
        this.drawFooter(ctx, yPosition, data);
        
        return canvas;
    }

    drawBorder(ctx) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 8;
        const margin = 40;
        
        // Draw rounded rectangle border
        this.roundRect(ctx, margin, margin, this.width - 2 * margin, this.height - 2 * margin, 30);
        ctx.stroke();
    }

    async drawHeader(ctx, y) {
        // Company name
        ctx.fillStyle = this.colors.text;
        ctx.font = 'italic 48px "Playfair Display", serif';
        ctx.textAlign = 'left';
        ctx.fillText('CIAO CIAO MX', this.padding, y + 60);
        
        ctx.font = '36px Arial, sans-serif';
        ctx.fillText('Joyería Fina', this.padding, y + 110);
        
        // Title
        ctx.fillStyle = this.colors.secondary;
        ctx.font = 'bold 72px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RECIBO', this.width / 2, y + 80);
        
        ctx.fillStyle = this.colors.text;
        ctx.font = '42px Arial, sans-serif';
        ctx.fillText('DOCUMENTO DE ENTREGA', this.width / 2, y + 140);
        
        return y + 200;
    }

    drawReceiptInfo(ctx, y, data) {
        const rightX = this.width - this.padding;
        
        // Transaction type badge
        if (data.transactionType) {
            ctx.fillStyle = this.colors.secondary;
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.textAlign = 'center';
            const typeText = data.transactionType.toUpperCase();
            ctx.fillText(`[ ${typeText} ]`, this.width / 2, y - 40);
        }
        
        // Receipt info
        ctx.fillStyle = this.colors.text;
        ctx.font = '32px Arial, sans-serif';
        ctx.textAlign = 'right';
        
        const receiptData = [
            { label: 'Folio', value: data.receiptNumber || 'CCI-2025-0829-001' },
            { label: 'Orden', value: data.orderNumber || '' },
            { label: 'Moneda', value: data.currency || 'MXN' },
            { label: 'Método de pago', value: data.paymentMethod || 'Efectivo / Tarjeta' }
        ].filter(item => item.value);
        
        receiptData.forEach((item, index) => {
            ctx.fillText(item.label, rightX - 300, y + (index * 50));
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.fillText(item.value, rightX, y + (index * 50));
            ctx.font = '32px Arial, sans-serif';
        });
        
        return y + (receiptData.length * 50) + 30;
    }

    drawClientAndDates(ctx, y, data) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.padding, y);
        ctx.lineTo(this.width - this.padding, y);
        ctx.stroke();
        
        y += 40;
        
        // Two column layout
        const midX = this.width / 2;
        
        // Left column - Client Data
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Datos del Cliente', this.padding, y);
        
        ctx.font = '32px Arial, sans-serif';
        y += 60;
        
        const clientData = [
            { label: 'NOMBRE', value: data.clientName || '' },
            { label: 'TELÉFONO', value: data.clientPhone || '' },
            { label: 'CORREO', value: data.clientEmail || '' },
            { label: 'DIRECCIÓN', value: data.clientAddress || '' }
        ];
        
        let clientY = y;
        clientData.forEach(item => {
            if (item.value) {
                ctx.fillStyle = '#666';
                ctx.font = '28px Arial, sans-serif';
                ctx.fillText(item.label, this.padding, clientY);
                clientY += 40;
                
                ctx.fillStyle = this.colors.text;
                ctx.font = '32px Arial, sans-serif';
                ctx.fillText(item.value, this.padding, clientY);
                clientY += 60;
            }
        });
        
        // Right column - Dates and Jewelry Details
        let rightY = y - 60;
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.fillText('Detalles', midX + 60, rightY);
        
        rightY += 60;
        
        const details = [];
        
        // Add jewelry details if available
        if (data.pieceType) details.push({ label: 'TIPO DE PIEZA', value: data.pieceType });
        if (data.material) details.push({ label: 'MATERIAL', value: data.material.replace('-', ' ').toUpperCase() });
        if (data.weight) details.push({ label: 'PESO', value: `${data.weight} gramos` });
        if (data.size) details.push({ label: 'TALLA', value: data.size });
        if (data.stones) details.push({ label: 'PIEDRAS', value: data.stones });
        
        // Add dates
        if (data.issueDate) details.push({ label: 'EMISIÓN', value: data.issueDate });
        if (data.deliveryDate) details.push({ label: 'ENTREGA', value: data.deliveryDate });
        if (data.deliveryStatus) details.push({ label: 'ESTADO', value: data.deliveryStatus });
        if (data.validUntil) details.push({ label: 'VÁLIDO HASTA', value: data.validUntil });
        
        details.forEach(item => {
            ctx.fillStyle = '#666';
            ctx.font = '28px Arial, sans-serif';
            ctx.fillText(item.label, midX + 60, rightY);
            rightY += 40;
            
            ctx.fillStyle = this.colors.text;
            ctx.font = '30px Arial, sans-serif';
            ctx.fillText(item.value, midX + 60, rightY);
            rightY += 50;
        });
        
        return Math.max(clientY, rightY) + 40;
    }

    drawProductsTable(ctx, y, products) {
        // Table header background
        ctx.fillStyle = this.colors.tableHeader;
        ctx.fillRect(this.padding, y, this.width - 2 * this.padding, 70);
        
        // Table header text
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'left';
        
        const columns = [
            { label: 'DESCRIPCIÓN', x: this.padding + 20, width: 800 },
            { label: 'CANT.', x: this.padding + 850, width: 150, align: 'center' },
            { label: 'PRECIO UNIT.', x: this.padding + 1020, width: 300, align: 'right' },
            { label: 'IMPORTE', x: this.padding + 1340, width: 300, align: 'right' },
            { label: 'SKU / CÓDIGO', x: this.padding + 1660, width: 250, align: 'center' }
        ];
        
        // Draw header
        columns.forEach(col => {
            ctx.textAlign = col.align || 'left';
            ctx.fillText(col.label, col.x, y + 45);
        });
        
        y += 90;
        
        // Draw products
        ctx.font = '30px Arial, sans-serif';
        
        const defaultProducts = products.length > 0 ? products : [
            {
                description: 'Pulsera de esmeralda & diamante',
                quantity: 1,
                unitPrice: 52550.00,
                amount: 52550.00,
                sku: '—'
            },
            {
                description: 'Pulsera tennis de zafiro en oro blanco',
                quantity: 1,
                unitPrice: 29800.00,
                amount: 29800.00,
                sku: '—'
            }
        ];
        
        defaultProducts.forEach(product => {
            // Draw row
            ctx.textAlign = 'left';
            ctx.fillText('—' + product.description, columns[0].x, y);
            
            ctx.textAlign = 'center';
            ctx.fillText(product.quantity.toString(), columns[1].x + 75, y);
            
            ctx.textAlign = 'right';
            ctx.fillText(this.formatCurrency(product.unitPrice), columns[2].x + columns[2].width - 20, y);
            ctx.fillText(this.formatCurrency(product.amount), columns[3].x + columns[3].width - 20, y);
            
            ctx.textAlign = 'center';
            ctx.fillText(product.sku || '—', columns[4].x + 125, y);
            
            y += 60;
        });
        
        // Draw bottom line
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.padding, y);
        ctx.lineTo(this.width - this.padding, y);
        ctx.stroke();
        
        return y + 40;
    }

    drawTotals(ctx, y, data) {
        const rightX = this.width - this.padding - 200;
        const labelX = rightX - 300;
        
        ctx.font = '32px Arial, sans-serif';
        ctx.textAlign = 'right';
        
        const totals = [];
        
        // Add financial details based on what's available
        if (data.totalPrice && data.totalPrice > 0) {
            totals.push({ label: 'Precio Total', value: data.totalPrice });
        }
        if (data.contributions && data.contributions > 0) {
            totals.push({ label: 'Aportaciones', value: -data.contributions, negative: true });
        }
        if (data.subtotal || data.subtotal === 0) {
            totals.push({ label: 'Subtotal', value: data.subtotal });
        }
        if (data.deposit && data.deposit > 0) {
            totals.push({ label: 'Anticipo', value: -data.deposit, negative: true });
        }
        if (data.discount && data.discount > 0) {
            totals.push({ label: 'Descuento', value: -data.discount, negative: true });
        }
        if (data.tax && data.tax > 0) {
            totals.push({ label: `IVA (${data.taxRate || 16}%)`, value: data.tax });
        }
        
        totals.push({ label: 'Total Final', value: data.total || 0, bold: true });
        
        if (data.balance && data.balance > 0) {
            totals.push({ label: 'Saldo Pendiente', value: data.balance, pending: true });
        }
        
        totals.forEach(item => {
            if (item.bold) {
                ctx.font = 'bold 36px Arial, sans-serif';
                ctx.fillStyle = this.colors.primary;
            } else if (item.pending) {
                ctx.font = 'bold 34px Arial, sans-serif';
                ctx.fillStyle = '#F44336';
            } else if (item.negative) {
                ctx.font = '32px Arial, sans-serif';
                ctx.fillStyle = '#666';
            } else {
                ctx.font = '32px Arial, sans-serif';
                ctx.fillStyle = this.colors.text;
            }
            
            ctx.textAlign = 'left';
            ctx.fillText(item.label, labelX, y);
            
            ctx.textAlign = 'right';
            const displayValue = item.negative ? Math.abs(item.value) : item.value;
            const prefix = item.negative ? '-' : '';
            ctx.fillText(prefix + this.formatCurrency(displayValue), rightX + 200, y);
            
            y += 50;
        });
        
        return y + 40;
    }

    drawObservations(ctx, y, observations) {
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Observaciones', this.padding, y);
        
        y += 50;
        
        ctx.font = '28px Arial, sans-serif';
        const lines = this.wrapText(ctx, observations, this.width - 2 * this.padding);
        lines.forEach(line => {
            ctx.fillText(line, this.padding, y);
            y += 40;
        });
        
        ctx.font = 'italic 28px Arial, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('Política: No hay devoluciones. Cambios sólo por defecto de fabricación dentro de 7', this.padding, y + 20);
        ctx.fillText('días, presentando este recibo.', this.padding, y + 60);
        
        return y + 120;
    }

    drawSignatures(ctx, y) {
        const midX = this.width / 2;
        
        // Signature lines
        ctx.strokeStyle = this.colors.text;
        ctx.lineWidth = 2;
        
        // Client signature
        ctx.beginPath();
        ctx.moveTo(this.padding + 100, y);
        ctx.lineTo(midX - 100, y);
        ctx.stroke();
        
        // Company signature
        ctx.beginPath();
        ctx.moveTo(midX + 100, y);
        ctx.lineTo(this.width - this.padding - 100, y);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIRMA DEL CLIENTE', this.padding + (midX - this.padding) / 2, y + 40);
        ctx.fillText('FIRMA DEL RESPONSABLE', midX + (this.width - midX - this.padding) / 2, y + 40);
        
        return y + 100;
    }

    drawFooter(ctx, y, data) {
        // Draw separator
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.padding, y);
        ctx.lineTo(this.width - this.padding, y);
        ctx.stroke();
        
        y += 60;
        
        const midX = this.width / 2;
        
        // Left column - Company info
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Datos de la Joyería', this.padding, y);
        
        y += 50;
        ctx.font = '28px Arial, sans-serif';
        
        const companyInfo = [
            { label: 'NOMBRE', value: 'CIAO CIAO MX – Joyería Fina' },
            { label: 'WEB', value: 'www.ciaociao.mx' },
            { label: 'WHATSAPP', value: '+52 1 55 9211 2643' },
            { label: 'CORREO', value: 'hola@ciaociao.mx' }
        ];
        
        let footerY = y;
        companyInfo.forEach(item => {
            ctx.fillStyle = '#666';
            ctx.fillText(item.label, this.padding, footerY);
            
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillText(item.value, this.padding + 180, footerY);
            ctx.font = '28px Arial, sans-serif';
            
            footerY += 45;
        });
        
        // Right column - Conditions
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.fillText('Condiciones', midX + 60, y);
        
        let condY = y + 50;
        ctx.font = '28px Arial, sans-serif';
        
        const conditions = [
            { label: 'GARANTÍA', value: 'de por vida' },
            { label: 'ENTREGA', value: 'En mano / Envío asegurado' },
            { label: 'AUTENTICIDAD', value: 'Metales y gemas verificados por nuestros expertos' }
        ];
        
        conditions.forEach(item => {
            ctx.fillStyle = '#666';
            ctx.fillText(item.label, midX + 60, condY);
            
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillText(item.value, midX + 240, condY);
            ctx.font = '28px Arial, sans-serif';
            
            condY += 45;
        });
        
        return Math.max(footerY, condY);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    async saveAsImage(canvas, filepath, format = 'png') {
        const buffer = format === 'jpeg' 
            ? canvas.toBuffer('image/jpeg', { quality: 0.95 })
            : canvas.toBuffer('image/png');
            
        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, buffer, (err) => {
                if (err) reject(err);
                else resolve(filepath);
            });
        });
    }
}

module.exports = ReceiptImageGenerator;