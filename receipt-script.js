// CIAO CIAO MX Receipt Generator - Client Script

const API_URL = 'http://localhost:3001/api';
let currentReceipt = null;
let productCounter = 1;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    loadReceiptHistory();
    setupEventListeners();
});

// Initialize form with default values
function initializeForm() {
    const today = new Date();
    document.getElementById('issueDate').value = today.toISOString().split('T')[0];
    
    // Set delivery date to today
    document.getElementById('deliveryDate').value = today.toISOString().split('T')[0];
    
    // Set valid until to 30 days from today
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);
    document.getElementById('validUntil').value = validUntil.toISOString().split('T')[0];
    
    // Generate receipt number
    generateReceiptNumber();
    
    // Calculate totals
    calculateTotals();
}

// Generate receipt number
function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const receiptNumber = `CCI-${year}-${month}${day}-${random}`;
    document.getElementById('receiptNumber').value = receiptNumber;
}

// Setup event listeners
function setupEventListeners() {
    // Calculate totals on input change
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('product-quantity') ||
            e.target.classList.contains('product-price') ||
            e.target.id === 'totalPrice' ||
            e.target.id === 'contributions' ||
            e.target.id === 'deposit' ||
            e.target.id === 'discount' ||
            e.target.id === 'taxRate') {
            calculateTotals();
        }
    });
    
    // Handle transaction type change
    document.getElementById('transactionType').addEventListener('change', (e) => {
        const repairSection = document.getElementById('repairSection');
        if (e.target.value === 'reparacion') {
            repairSection.style.display = 'block';
        } else {
            repairSection.style.display = 'none';
        }
    });
}

// Add new product row
function addProduct() {
    const container = document.getElementById('productsContainer');
    const productIndex = productCounter++;
    
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.dataset.productIndex = productIndex;
    
    productItem.innerHTML = `
        <div class="product-grid">
            <div class="form-group">
                <label>Descripción *</label>
                <input type="text" class="product-description" placeholder="Ej: Anillo de diamante" required>
            </div>
            <div class="form-group small">
                <label>Cantidad *</label>
                <input type="number" class="product-quantity" value="1" min="1" required>
            </div>
            <div class="form-group">
                <label>Precio Unitario *</label>
                <input type="number" class="product-price" step="0.01" min="0" placeholder="0.00" required>
            </div>
            <div class="form-group">
                <label>SKU / Código</label>
                <input type="text" class="product-sku" placeholder="Opcional">
            </div>
            <button type="button" class="btn-remove-product" onclick="removeProduct(${productIndex})">×</button>
        </div>
    `;
    
    container.appendChild(productItem);
    calculateTotals();
}

// Remove product row
function removeProduct(index) {
    const productItem = document.querySelector(`[data-product-index="${index}"]`);
    if (productItem) {
        productItem.remove();
        calculateTotals();
    }
}

// Calculate totals
function calculateTotals() {
    // Get base price (either from products or totalPrice field)
    let basePrice = 0;
    
    // Check if we're using products or direct price
    const totalPriceInput = parseFloat(document.getElementById('totalPrice').value) || 0;
    
    if (totalPriceInput > 0) {
        // Using direct price input
        basePrice = totalPriceInput;
    } else {
        // Calculate from products
        document.querySelectorAll('.product-item').forEach(item => {
            const quantity = parseFloat(item.querySelector('.product-quantity').value) || 0;
            const price = parseFloat(item.querySelector('.product-price').value) || 0;
            basePrice += quantity * price;
        });
    }
    
    // Get financial values
    const contributions = parseFloat(document.getElementById('contributions').value) || 0;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    
    // Calculate totals
    const subtotal = basePrice - contributions;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    const totalFinal = afterDiscount + tax;
    const balance = totalFinal - deposit;
    
    // Update display
    document.getElementById('priceDisplay').textContent = formatCurrency(basePrice);
    document.getElementById('contributionsDisplay').textContent = formatCurrency(contributions);
    document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
    document.getElementById('depositDisplay').textContent = formatCurrency(deposit);
    document.getElementById('discountDisplay').textContent = formatCurrency(discount);
    document.getElementById('taxDisplay').textContent = formatCurrency(tax);
    document.getElementById('totalDisplay').textContent = formatCurrency(totalFinal);
    document.getElementById('balanceDisplay').textContent = formatCurrency(Math.max(0, balance));
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Clear form
function clearForm() {
    if (confirm('¿Estás seguro de que deseas limpiar el formulario?')) {
        document.getElementById('receiptForm').reset();
        
        // Remove all products except the first one
        const products = document.querySelectorAll('.product-item');
        products.forEach((product, index) => {
            if (index > 0) {
                product.remove();
            }
        });
        
        // Reset the first product
        const firstProduct = document.querySelector('.product-item');
        if (firstProduct) {
            firstProduct.querySelector('.product-description').value = '';
            firstProduct.querySelector('.product-quantity').value = '1';
            firstProduct.querySelector('.product-price').value = '';
            firstProduct.querySelector('.product-sku').value = '';
        }
        
        initializeForm();
        showNotification('Formulario limpiado', 'success');
    }
}

// Generate receipt
async function generateReceipt() {
    try {
        // Validate form
        if (!validateForm()) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        // Show loading
        showLoading(true);
        
        // Collect form data
        const formData = collectFormData();
        
        // Send to API
        const response = await fetch(`${API_URL}/generate-receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentReceipt = result;
            showPreview(result);
            showNotification('Recibo generado exitosamente', 'success');
            loadReceiptHistory();
        } else {
            throw new Error(result.error || 'Error al generar el recibo');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al generar el recibo', 'error');
    } finally {
        showLoading(false);
    }
}

// Validate form
function validateForm() {
    const clientName = document.getElementById('clientName').value.trim();
    const issueDate = document.getElementById('issueDate').value;
    
    if (!clientName || !issueDate) {
        return false;
    }
    
    // Validate products
    const products = document.querySelectorAll('.product-item');
    for (let product of products) {
        const description = product.querySelector('.product-description').value.trim();
        const quantity = product.querySelector('.product-quantity').value;
        const price = product.querySelector('.product-price').value;
        
        if (!description || !quantity || !price) {
            return false;
        }
    }
    
    return true;
}

// Collect form data
function collectFormData() {
    const products = [];
    
    document.querySelectorAll('.product-item').forEach(item => {
        const description = item.querySelector('.product-description').value.trim();
        const quantity = parseFloat(item.querySelector('.product-quantity').value) || 1;
        const price = parseFloat(item.querySelector('.product-price').value) || 0;
        const sku = item.querySelector('.product-sku').value.trim() || '—';
        
        if (description && price > 0) {
            products.push({
                description,
                quantity,
                unitPrice: price,
                amount: quantity * price,
                sku
            });
        }
    });
    
    // Get base price
    const totalPriceInput = parseFloat(document.getElementById('totalPrice').value) || 0;
    let basePrice = totalPriceInput > 0 ? totalPriceInput : products.reduce((sum, p) => sum + p.amount, 0);
    
    // Get financial values
    const contributions = parseFloat(document.getElementById('contributions').value) || 0;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    
    // Calculate totals
    const subtotal = basePrice - contributions;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + tax;
    const balance = total - deposit;
    
    return {
        // Receipt info
        receiptNumber: document.getElementById('receiptNumber').value,
        transactionType: document.getElementById('transactionType').value,
        orderNumber: document.getElementById('orderNumber').value,
        currency: document.getElementById('currency').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        
        // Client info
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientAddress: document.getElementById('clientAddress').value,
        
        // Jewelry details
        pieceType: document.getElementById('pieceType').value,
        material: document.getElementById('material').value,
        weight: document.getElementById('weight').value,
        size: document.getElementById('size').value,
        stones: document.getElementById('stones').value,
        pieceDescription: document.getElementById('pieceDescription').value,
        pieceCondition: document.getElementById('pieceCondition').value,
        
        // Dates
        issueDate: document.getElementById('issueDate').value,
        deliveryDate: document.getElementById('deliveryDate').value,
        deliveryStatus: document.getElementById('deliveryStatus').value,
        validUntil: document.getElementById('validUntil').value,
        
        // Products
        products,
        
        // Financial
        totalPrice: basePrice,
        contributions,
        subtotal,
        deposit,
        discount,
        tax,
        total,
        balance: Math.max(0, balance),
        
        // Observations
        observations: document.getElementById('observations').value
    };
}

// Show preview
function showPreview(receipt) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('receiptPreview');
    
    previewImage.src = receipt.base64;
    previewContainer.style.display = 'block';
    
    // Scroll to preview
    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Download receipt
function downloadReceipt(format) {
    if (!currentReceipt) {
        showNotification('No hay recibo para descargar', 'error');
        return;
    }
    
    const link = document.createElement('a');
    if (format === 'jpeg') {
        link.href = currentReceipt.jpegUrl;
        link.download = `recibo_${currentReceipt.receiptNumber}.jpg`;
    } else {
        link.href = currentReceipt.imageUrl;
        link.download = `recibo_${currentReceipt.receiptNumber}.png`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Recibo descargado como ${format.toUpperCase()}`, 'success');
}

// Share via WhatsApp
function shareWhatsApp() {
    if (!currentReceipt) {
        showNotification('No hay recibo para compartir', 'error');
        return;
    }
    
    const formData = collectFormData();
    const message = encodeURIComponent(
        `*RECIBO CIAO CIAO MX*\n` +
        `Folio: ${formData.receiptNumber}\n` +
        `Cliente: ${formData.clientName}\n` +
        `Total: ${formatCurrency(formData.total)}\n\n` +
        `Gracias por su compra!`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

// New receipt
function newReceipt() {
    clearForm();
    document.getElementById('previewContainer').style.display = 'none';
    currentReceipt = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load receipt history
async function loadReceiptHistory() {
    try {
        const response = await fetch(`${API_URL}/receipts`);
        const result = await response.json();
        
        if (result.success) {
            displayHistory(result.receipts);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Display history
function displayHistory(receipts) {
    const historyList = document.getElementById('historyList');
    
    if (receipts.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666;">No hay recibos en el historial</p>';
        return;
    }
    
    historyList.innerHTML = receipts.slice(0, 6).map(receipt => `
        <div class="history-item" onclick="viewReceipt('${receipt.url}')">
            <img src="${receipt.url}" alt="Recibo ${receipt.receiptNumber}">
            <div class="history-item-info">
                <small>${receipt.receiptNumber}</small>
            </div>
        </div>
    `).join('');
}

// View receipt from history
function viewReceipt(url) {
    window.open(url, '_blank');
}

// Show loading indicator
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = show ? 'flex' : 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateReceiptNumber,
        formatCurrency,
        calculateTotals,
        validateForm
    };
}