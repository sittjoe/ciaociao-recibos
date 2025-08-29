// Sistema Premium de Recibos - CiaoCiao MX
// ==========================================

// Utilidades
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Variables globales
let currentSignatureType = null;
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let signatures = {
  client: null,
  company: null
};
let currentReceiptId = null;
let autoSaveInterval = null;

// ==========================================
// FORMATEO Y UTILIDADES
// ==========================================

function parseMoney(v) {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
}

function formato(n) {
  return new Intl.NumberFormat('es-MX', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(n);
}

function formatoConSigno(n) {
  return '$' + formato(n);
}

// ==========================================
// GENERACIÓN DE NÚMERO DE RECIBO
// ==========================================

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Obtener contador del día desde localStorage
  const dateKey = `CCI-${year}${month}${day}`;
  let dailyCounter = localStorage.getItem(dateKey) || '0';
  dailyCounter = parseInt(dailyCounter) + 1;
  
  // Guardar nuevo contador
  localStorage.setItem(dateKey, dailyCounter.toString());
  
  // Limpiar contadores antiguos (más de 30 días)
  cleanOldCounters();
  
  const receiptNumber = `CCI-${year}-${month}${day}-${String(dailyCounter).padStart(3, '0')}`;
  $('#receiptNumber').textContent = receiptNumber;
  
  // Generar ID único para el recibo
  currentReceiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return receiptNumber;
}

function cleanOldCounters() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('CCI-')) {
      const parts = key.split('-');
      if (parts.length >= 2) {
        const dateStr = parts[1];
        if (dateStr.length === 8) {
          const keyDate = new Date(
            dateStr.substr(0, 4),
            parseInt(dateStr.substr(4, 2)) - 1,
            dateStr.substr(6, 2)
          );
          
          if (keyDate < thirtyDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  });
}

// ==========================================
// MANEJO DE FECHAS
// ==========================================

function formatDate(date) {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function initializeDates() {
  const today = new Date();
  const validDate = new Date(today);
  validDate.setDate(validDate.getDate() + 30);
  
  $('#issueDate').textContent = formatDate(today);
  $('#deliveryDate').textContent = formatDate(today);
  $('#validUntil').textContent = formatDate(validDate);
}

// ==========================================
// CÁLCULOS FINANCIEROS
// ==========================================

function recalc() {
  let subtotal = 0;
  
  // Calcular subtotal de todos los productos
  $$('#tabla-items tbody tr').forEach(tr => {
    const qty = parseMoney($('.qty', tr)?.textContent);
    const unit = parseMoney($('.price', tr)?.textContent);
    const imp = (qty * unit) || 0;
    $('.subtotal', tr).textContent = formato(imp);
    subtotal += imp;
  });
  
  $('#subtotal').textContent = formato(subtotal);
  
  // Obtener valores de descuento y aportación
  const descuento = parseMoney($('#descuento')?.textContent);
  const aportacion = parseMoney($('#aportacion')?.textContent);
  
  // Calcular base después de descuento
  const baseConDescuento = Math.max(subtotal - descuento, 0);
  
  // Agregar aportación
  const baseTotal = baseConDescuento + aportacion;
  
  // Calcular IVA
  const iva = baseTotal * 0.16;
  $('#iva').textContent = formato(iva);
  
  // Total con IVA
  const total = baseTotal + iva;
  $('#total').textContent = formatoConSigno(total);
  
  // Calcular saldo pendiente
  const anticipo = parseMoney($('#anticipo')?.textContent);
  const saldo = Math.max(total - anticipo, 0);
  $('#saldo').textContent = formatoConSigno(saldo);
  
  // Cambiar color del saldo según el monto
  const saldoEl = $('#saldo');
  if (saldo === 0) {
    saldoEl.style.color = 'var(--success)';
    saldoEl.parentElement.style.background = '#f0fdf4';
  } else if (saldo > 0) {
    saldoEl.style.color = 'var(--error)';
    saldoEl.parentElement.style.background = '#fef2f2';
  }
}

// ==========================================
// GESTIÓN DE PRODUCTOS/FILAS
// ==========================================

function addRow() {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="editable" contenteditable>Artículo de joyería</td>
    <td class="center editable qty" contenteditable>1</td>
    <td class="right editable price" contenteditable>0.00</td>
    <td class="right subtotal">0.00</td>
    <td class="center editable" contenteditable>—</td>
    <td class="center">
      <select class="transaction-type-select item-type" style="font-size: 11px; padding: 4px;">
        <option value="producto">Producto</option>
        <option value="servicio">Servicio</option>
        <option value="reparacion">Reparación</option>
      </select>
    </td>
    <td style="position:relative;">
      <span class="delete-row" onclick="deleteRow(this)">×</span>
    </td>
  `;
  $('#itemsBody').appendChild(tr);
  
  // Focus en el primer campo
  tr.querySelector('.editable').focus();
  
  showNotification('Producto agregado', 'success');
}

function deleteRow(btn) {
  const tr = btn.closest('tr');
  const tbody = tr.parentElement;
  
  // No eliminar si es la última fila
  if (tbody.children.length > 1) {
    tr.remove();
    recalc();
    showNotification('Producto eliminado', 'success');
  } else {
    showNotification('Debe mantener al menos un producto', 'error');
  }
}

// ==========================================
// SISTEMA DE FIRMAS DIGITALES
// ==========================================

function initSignatureCanvas() {
  signatureCanvas = $('#signatureCanvas');
  if (!signatureCanvas) return;
  
  signatureCtx = signatureCanvas.getContext('2d');
  
  signatureCtx.strokeStyle = '#1f2937';
  signatureCtx.lineWidth = 2;
  signatureCtx.lineCap = 'round';
  signatureCtx.lineJoin = 'round';
  
  // Mouse events
  signatureCanvas.addEventListener('mousedown', startDrawing);
  signatureCanvas.addEventListener('mousemove', draw);
  signatureCanvas.addEventListener('mouseup', stopDrawing);
  signatureCanvas.addEventListener('mouseout', stopDrawing);
  
  // Touch events para dispositivos móviles
  signatureCanvas.addEventListener('touchstart', handleTouch);
  signatureCanvas.addEventListener('touchmove', handleTouch);
  signatureCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
  isDrawing = true;
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.beginPath();
  signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawing) return;
  
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  signatureCtx.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

function handleTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                   e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  signatureCanvas.dispatchEvent(mouseEvent);
}

function openSignatureModal(type) {
  currentSignatureType = type;
  $('#signatureModal').classList.add('active');
  $('#signatureTitle').textContent = type === 'client' ? 'Firma del Cliente' : 'Firma del Responsable';
  
  // Limpiar canvas
  clearModalSignature();
  
  // Si ya hay firma, cargarla
  if (signatures[type]) {
    const img = new Image();
    img.onload = function() {
      signatureCtx.drawImage(img, 0, 0);
    };
    img.src = signatures[type];
  }
}

function closeSignatureModal() {
  $('#signatureModal').classList.remove('active');
  currentSignatureType = null;
}

function clearModalSignature() {
  if (signatureCtx) {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  }
}

function saveSignature() {
  if (signatureCanvas && currentSignatureType) {
    // Verificar si hay algo dibujado
    const imageData = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
    const pixels = imageData.data;
    let hasContent = false;
    
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 0) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent) {
      showNotification('Por favor dibuje una firma', 'error');
      return;
    }
    
    // Guardar firma
    signatures[currentSignatureType] = signatureCanvas.toDataURL();
    
    // Mostrar en el recibo
    const targetCanvas = currentSignatureType === 'client' ? $('#clientSigCanvas') : $('#companySigCanvas');
    const targetCtx = targetCanvas.getContext('2d');
    targetCanvas.style.display = 'block';
    
    // Copiar firma al canvas pequeño
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(signatureCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
    
    // Marcar como firmado
    const sigDiv = currentSignatureType === 'client' ? $('#clientSignature') : $('#companySignature');
    sigDiv.classList.add('signed');
    
    closeSignatureModal();
    showNotification('Firma guardada correctamente', 'success');
  }
}

function clearSignature(event, type) {
  event.stopPropagation();
  
  signatures[type] = null;
  
  const canvas = type === 'client' ? $('#clientSigCanvas') : $('#companySigCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = 'none';
  
  const sigDiv = type === 'client' ? $('#clientSignature') : $('#companySignature');
  sigDiv.classList.remove('signed');
  
  showNotification('Firma eliminada', 'success');
}

// ==========================================
// NOTIFICACIONES
// ==========================================

function showNotification(message, type = 'success') {
  const notification = $('#notification');
  const messageEl = $('#notification-message');
  
  notification.className = `notification ${type} show`;
  messageEl.textContent = message;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// ==========================================
// GUARDAR Y CARGAR RECIBOS
// ==========================================

function collectReceiptData() {
  const receiptData = {
    id: currentReceiptId,
    number: $('#receiptNumber').textContent,
    date: new Date().toISOString(),
    transactionType: $('#transactionType').value,
    paymentMethod: $('#paymentMethod').value,
    orderNumber: $('#orderNumber').textContent,
    client: {
      name: $('#clientName').textContent,
      phone: $('#clientPhone').textContent,
      email: $('#clientEmail').textContent,
      address: $('#clientAddress').textContent
    },
    dates: {
      issue: $('#issueDate').textContent,
      delivery: $('#deliveryDate').textContent,
      validUntil: $('#validUntil').textContent
    },
    items: [],
    totals: {
      subtotal: $('#subtotal').textContent,
      discount: $('#descuento').textContent,
      contribution: $('#aportacion').textContent,
      iva: $('#iva').textContent,
      advance: $('#anticipo').textContent,
      total: $('#total').textContent,
      balance: $('#saldo').textContent
    },
    signatures: signatures,
    observations: $('#observations').textContent,
    policy: $('#policy').textContent
  };
  
  // Guardar items
  $$('#tabla-items tbody tr').forEach(tr => {
    const cells = $$('td', tr);
    receiptData.items.push({
      description: cells[0].textContent,
      qty: cells[1].textContent,
      price: cells[2].textContent,
      subtotal: cells[3].textContent,
      sku: cells[4].textContent,
      type: $('.item-type', tr).value
    });
  });
  
  return receiptData;
}

function saveReceipt() {
  const receiptData = collectReceiptData();
  
  // Guardar en localStorage
  const receipts = JSON.parse(localStorage.getItem('premium_receipts_ciaociao') || '[]');
  
  // Verificar si ya existe
  const existingIndex = receipts.findIndex(r => r.id === currentReceiptId);
  if (existingIndex >= 0) {
    receipts[existingIndex] = receiptData;
    showNotification('Recibo actualizado', 'success');
  } else {
    receipts.push(receiptData);
    showNotification('Recibo guardado', 'success');
  }
  
  // Mantener máximo 1000 recibos
  if (receipts.length > 1000) {
    receipts.shift();
  }
  
  localStorage.setItem('premium_receipts_ciaociao', JSON.stringify(receipts));
}

function loadReceipt(receiptId) {
  const receipts = JSON.parse(localStorage.getItem('premium_receipts_ciaociao') || '[]');
  const receipt = receipts.find(r => r.id === receiptId);
  
  if (!receipt) {
    showNotification('Recibo no encontrado', 'error');
    return;
  }
  
  // Cargar datos básicos
  currentReceiptId = receipt.id;
  $('#receiptNumber').textContent = receipt.number;
  $('#transactionType').value = receipt.transactionType || 'venta';
  $('#paymentMethod').value = receipt.paymentMethod || 'efectivo';
  $('#orderNumber').textContent = receipt.orderNumber || '001';
  
  // Cargar cliente
  $('#clientName').textContent = receipt.client.name;
  $('#clientPhone').textContent = receipt.client.phone;
  $('#clientEmail').textContent = receipt.client.email;
  $('#clientAddress').textContent = receipt.client.address;
  
  // Cargar fechas
  $('#issueDate').textContent = receipt.dates.issue;
  $('#deliveryDate').textContent = receipt.dates.delivery;
  $('#validUntil').textContent = receipt.dates.validUntil;
  
  // Cargar items
  $('#itemsBody').innerHTML = '';
  receipt.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="editable" contenteditable>${item.description}</td>
      <td class="center editable qty" contenteditable>${item.qty}</td>
      <td class="right editable price" contenteditable>${item.price}</td>
      <td class="right subtotal">${item.subtotal}</td>
      <td class="center editable" contenteditable>${item.sku}</td>
      <td class="center">
        <select class="transaction-type-select item-type" style="font-size: 11px; padding: 4px;">
          <option value="producto" ${item.type === 'producto' ? 'selected' : ''}>Producto</option>
          <option value="servicio" ${item.type === 'servicio' ? 'selected' : ''}>Servicio</option>
          <option value="reparacion" ${item.type === 'reparacion' ? 'selected' : ''}>Reparación</option>
        </select>
      </td>
      <td style="position:relative;">
        <span class="delete-row" onclick="deleteRow(this)">×</span>
      </td>
    `;
    $('#itemsBody').appendChild(tr);
  });
  
  // Cargar totales
  $('#descuento').textContent = receipt.totals.discount;
  $('#aportacion').textContent = receipt.totals.contribution;
  $('#anticipo').textContent = receipt.totals.advance;
  
  // Cargar observaciones
  $('#observations').textContent = receipt.observations;
  $('#policy').textContent = receipt.policy;
  
  // Cargar firmas
  signatures = receipt.signatures || { client: null, company: null };
  
  // Mostrar firmas si existen
  if (signatures.client) {
    const clientCanvas = $('#clientSigCanvas');
    const clientCtx = clientCanvas.getContext('2d');
    clientCanvas.style.display = 'block';
    const img = new Image();
    img.onload = function() {
      clientCtx.drawImage(img, 0, 0, clientCanvas.width, clientCanvas.height);
    };
    img.src = signatures.client;
    $('#clientSignature').classList.add('signed');
  }
  
  if (signatures.company) {
    const companyCanvas = $('#companySigCanvas');
    const companyCtx = companyCanvas.getContext('2d');
    companyCanvas.style.display = 'block';
    const img = new Image();
    img.onload = function() {
      companyCtx.drawImage(img, 0, 0, companyCanvas.width, companyCanvas.height);
    };
    img.src = signatures.company;
    $('#companySignature').classList.add('signed');
  }
  
  recalc();
  showNotification('Recibo cargado', 'success');
}

// ==========================================
// NUEVO RECIBO
// ==========================================

function newReceipt() {
  if (!confirm('¿Crear un nuevo recibo? Los cambios no guardados se perderán.')) {
    return;
  }
  
  // Limpiar formulario
  $('#clientName').textContent = 'Nombre del Cliente';
  $('#clientPhone').textContent = '+52 1 55 0000 0000';
  $('#clientEmail').textContent = 'cliente@email.com';
  $('#clientAddress').textContent = 'Dirección completa';
  $('#orderNumber').textContent = '001';
  
  // Reset selects
  $('#transactionType').value = 'venta';
  $('#paymentMethod').value = 'efectivo';
  
  // Limpiar tabla
  $('#itemsBody').innerHTML = `
    <tr>
      <td class="editable" contenteditable>Artículo de joyería</td>
      <td class="center editable qty" contenteditable>1</td>
      <td class="right editable price" contenteditable>0.00</td>
      <td class="right subtotal">0.00</td>
      <td class="center editable" contenteditable>—</td>
      <td class="center">
        <select class="transaction-type-select item-type" style="font-size: 11px; padding: 4px;">
          <option value="producto">Producto</option>
          <option value="servicio">Servicio</option>
          <option value="reparacion">Reparación</option>
        </select>
      </td>
      <td style="position:relative;">
        <span class="delete-row" onclick="deleteRow(this)">×</span>
      </td>
    </tr>
  `;
  
  // Limpiar totales
  $('#descuento').textContent = '0.00';
  $('#aportacion').textContent = '0.00';
  $('#anticipo').textContent = '0.00';
  
  // Limpiar observaciones
  $('#observations').textContent = 'Joyas inspeccionadas y entregadas en perfecto estado. Se recomienda evitar contacto con químicos. Servicio de ajuste/limpieza disponible.';
  $('#policy').textContent = 'Política: Garantía de por vida en mano de obra. Cambios sólo por defecto de fabricación dentro de 7 días.';
  
  // Limpiar firmas
  signatures = { client: null, company: null };
  clearSignature(new Event('click'), 'client');
  clearSignature(new Event('click'), 'company');
  
  // Generar nuevo número
  generateReceiptNumber();
  initializeDates();
  recalc();
  
  showNotification('Nuevo recibo creado', 'success');
}

// ==========================================
// HISTORIAL DE RECIBOS
// ==========================================

function showHistory() {
  const receipts = JSON.parse(localStorage.getItem('premium_receipts_ciaociao') || '[]');
  const tbody = $('#historyTableBody');
  
  // Limpiar tabla
  tbody.innerHTML = '';
  
  // Ordenar por fecha descendente
  receipts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Llenar tabla
  receipts.forEach(receipt => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${receipt.number}</td>
      <td>${new Date(receipt.date).toLocaleDateString('es-MX')}</td>
      <td>${receipt.client.name}</td>
      <td>${receipt.totals.total}</td>
      <td>${receipt.transactionType || 'venta'}</td>
      <td class="history-actions">
        <button class="btn btn-small secondary" onclick="loadReceiptFromHistory('${receipt.id}')">Cargar</button>
        <button class="btn btn-small danger" onclick="deleteReceiptFromHistory('${receipt.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  $('#historyModal').classList.add('active');
}

function closeHistoryModal() {
  $('#historyModal').classList.remove('active');
}

function loadReceiptFromHistory(receiptId) {
  closeHistoryModal();
  loadReceipt(receiptId);
}

function deleteReceiptFromHistory(receiptId) {
  if (!confirm('¿Eliminar este recibo del historial?')) {
    return;
  }
  
  let receipts = JSON.parse(localStorage.getItem('premium_receipts_ciaociao') || '[]');
  receipts = receipts.filter(r => r.id !== receiptId);
  localStorage.setItem('premium_receipts_ciaociao', JSON.stringify(receipts));
  
  showNotification('Recibo eliminado', 'success');
  showHistory(); // Refrescar historial
}

function searchHistory() {
  const searchTerm = $('#searchHistory').value.toLowerCase();
  const rows = $$('#historyTableBody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// ==========================================
// GENERAR PDF
// ==========================================

async function generatePDF() {
  try {
    showNotification('Generando PDF...', 'info');
    
    // Guardar primero
    saveReceipt();
    
    // Ocultar elementos no deseados
    $$('.delete-row, .clear-sig, .actions, .watermark, .btn-back').forEach(el => {
      if (el) el.style.display = 'none';
    });
    
    // Capturar el contenido
    const element = $('.gilded-frame');
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 900,
      windowHeight: element.scrollHeight
    });
    
    // Restaurar elementos
    $$('.delete-row, .clear-sig, .actions, .btn-back').forEach(el => {
      if (el) el.style.display = '';
    });
    const watermark = $('.watermark');
    if (watermark) watermark.style.display = 'flex';
    
    // Crear PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 279;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Agregar imagen al PDF, manejando múltiples páginas si es necesario
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Descargar
    const fileName = `Recibo_${$('#receiptNumber').textContent}_${$('#clientName').textContent.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    
    showNotification('PDF generado correctamente', 'success');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showNotification('Error al generar PDF', 'error');
  }
}

// ==========================================
// COMPARTIR POR WHATSAPP
// ==========================================

function shareWhatsApp() {
  const receiptData = collectReceiptData();
  
  let message = `*RECIBO - CIAO CIAO MX*\n`;
  message += `_Joyería Fina_\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `*INFORMACIÓN DEL RECIBO*\n`;
  message += `Número: ${receiptData.number}\n`;
  message += `Tipo: ${receiptData.transactionType}\n`;
  message += `Fecha: ${receiptData.dates.issue}\n`;
  message += `Entrega: ${receiptData.dates.delivery}\n\n`;
  
  message += `*CLIENTE*\n`;
  message += `${receiptData.client.name}\n`;
  message += `Tel: ${receiptData.client.phone}\n\n`;
  
  message += `*PRODUCTOS/SERVICIOS*\n`;
  receiptData.items.forEach(item => {
    message += `• ${item.description}\n`;
    message += `  Cant: ${item.qty} | Precio: $${item.price} | Total: $${item.subtotal}\n`;
  });
  
  message += `\n*RESUMEN FINANCIERO*\n`;
  message += `Subtotal: $${receiptData.totals.subtotal}\n`;
  
  if (parseMoney(receiptData.totals.discount) > 0) {
    message += `Descuento: -$${receiptData.totals.discount}\n`;
  }
  if (parseMoney(receiptData.totals.contribution) > 0) {
    message += `Aportación: +$${receiptData.totals.contribution}\n`;
  }
  
  message += `IVA: $${receiptData.totals.iva}\n`;
  message += `*TOTAL: ${receiptData.totals.total}*\n`;
  
  if (parseMoney(receiptData.totals.advance) > 0) {
    message += `\nAnticipo: $${receiptData.totals.advance}\n`;
    message += `*SALDO PENDIENTE: ${receiptData.totals.balance}*\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*CIAO CIAO MX*\n`;
  message += `www.ciaociao.mx\n`;
  message += `Tel: +52 1 55 9211 2643\n`;
  message += `_Garantía de por vida en mano de obra_`;
  
  // Codificar mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Obtener número de teléfono del cliente (quitar caracteres no numéricos)
  const phoneNumber = receiptData.client.phone.replace(/\D/g, '');
  
  // Abrir WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
  
  showNotification('Abriendo WhatsApp...', 'success');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar
  generateReceiptNumber();
  initializeDates();
  initSignatureCanvas();
  recalc();
  
  // Año actual
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  // Botones principales
  const addRowBtn = $('#add-row');
  if (addRowBtn) addRowBtn.addEventListener('click', addRow);
  
  const saveBtn = $('#save-receipt');
  if (saveBtn) saveBtn.addEventListener('click', saveReceipt);
  
  const newBtn = $('#new-receipt');
  if (newBtn) newBtn.addEventListener('click', newReceipt);
  
  const historyBtn = $('#show-history');
  if (historyBtn) historyBtn.addEventListener('click', showHistory);
  
  // Búsqueda en historial
  const searchInput = $('#searchHistory');
  if (searchInput) searchInput.addEventListener('input', searchHistory);
  
  // Recalcular en cambios
  document.addEventListener('input', (e) => {
    if (e.target.matches('[contenteditable]') || e.target.matches('select')) {
      recalc();
    }
  });
  
  // Prevenir saltos de línea en campos editables
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[contenteditable]')) {
      e.preventDefault();
      
      // Mover al siguiente campo editable
      const editables = $$('[contenteditable]');
      const currentIndex = editables.indexOf(e.target);
      if (currentIndex < editables.length - 1) {
        editables[currentIndex + 1].focus();
      }
    }
  });
  
  // Auto-guardar cada 30 segundos
  autoSaveInterval = setInterval(() => {
    if ($('#receiptNumber').textContent !== '---') {
      saveReceipt();
    }
  }, 30000);
  
  // Atajos de teclado
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveReceipt();
    }
    
    // Ctrl/Cmd + N para nuevo
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      newReceipt();
    }
    
    // Ctrl/Cmd + P para PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      generatePDF();
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      if ($('#signatureModal').classList.contains('active')) {
        closeSignatureModal();
      }
      if ($('#historyModal').classList.contains('active')) {
        closeHistoryModal();
      }
    }
  });
  
  // Limpiar al salir
  window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }
  });
  
  console.log('Sistema Premium de Recibos - CiaoCiao MX inicializado');
});

// Exponer funciones globales necesarias
window.deleteRow = deleteRow;
window.openSignatureModal = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
window.clearModalSignature = clearModalSignature;
window.saveSignature = saveSignature;
window.clearSignature = clearSignature;
window.generatePDF = generatePDF;
window.shareWhatsApp = shareWhatsApp;
window.closeHistoryModal = closeHistoryModal;
window.loadReceiptFromHistory = loadReceiptFromHistory;
window.deleteReceiptFromHistory = deleteReceiptFromHistory;