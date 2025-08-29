# CIAO CIAO MX - Sistema de Generación de Recibos Profesionales

Sistema moderno para generar recibos profesionales como imágenes de alta calidad para CIAO CIAO MX Joyería Fina.

## 🎯 Características

- ✅ Generación de recibos como imágenes PNG/JPEG de alta calidad
- ✅ Diseño profesional sin problemas de superposición
- ✅ Interfaz web moderna y responsiva
- ✅ Cálculo automático de totales, descuentos e IVA
- ✅ Historial de recibos generados
- ✅ Descarga en múltiples formatos
- ✅ Compartir por WhatsApp
- ✅ Vista previa en tiempo real

## 📋 Requisitos

- Node.js v14 o superior
- npm o yarn

## 🚀 Instalación

1. Clona o descarga el proyecto:
```bash
cd /Users/joesittm/ciaociao-receipt-generator
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
npm start
```

4. Abre tu navegador y visita:
```
http://localhost:3001
```

O simplemente abre el archivo `index.html` directamente en tu navegador.

## 📖 Uso

### Generar un Recibo

1. **Información del Recibo**
   - El número de folio se genera automáticamente
   - Selecciona la moneda y método de pago

2. **Datos del Cliente**
   - Ingresa el nombre completo (requerido)
   - Añade teléfono, email y dirección (opcionales)

3. **Fechas**
   - Fecha de emisión (se establece automáticamente)
   - Fecha de entrega
   - Válido hasta (30 días por defecto)

4. **Productos/Servicios**
   - Añade descripción, cantidad, precio unitario
   - SKU/Código opcional
   - Puedes agregar múltiples productos
   - Los totales se calculan automáticamente

5. **Totales**
   - Aplica descuentos si es necesario
   - El IVA se calcula automáticamente (16% por defecto)

6. **Generar**
   - Haz clic en "Generar Recibo"
   - Visualiza la vista previa
   - Descarga en PNG o JPEG
   - Comparte por WhatsApp

### Historial de Recibos

- Los recibos generados se guardan automáticamente
- Aparecen en la sección de historial
- Haz clic en cualquier recibo para verlo

## 🎨 Personalización

### Colores y Estilos
Edita `receipt-styles.css` para cambiar:
- Colores principales
- Tipografías
- Espaciados
- Diseño responsivo

### Plantilla del Recibo
Modifica `server/receipt-image-generator.js` para:
- Cambiar el diseño del recibo
- Añadir o quitar campos
- Modificar el logo o encabezado
- Ajustar dimensiones

## 📁 Estructura del Proyecto

```
ciaociao-receipt-generator/
├── index.html              # Interfaz principal
├── receipt-styles.css      # Estilos de la interfaz
├── receipt-script.js       # Lógica del cliente
├── package.json           # Dependencias del proyecto
├── server/
│   ├── receipt-server.js          # Servidor Express
│   └── receipt-image-generator.js # Generador de imágenes
├── receipts/              # Recibos generados (creado automáticamente)
└── README.md             # Este archivo
```

## 🔧 Configuración Avanzada

### Cambiar el Puerto del Servidor
En `server/receipt-server.js`, modifica:
```javascript
const PORT = process.env.PORT || 3001; // Cambia 3001 por el puerto deseado
```

### Ajustar Calidad de Imagen
En `server/receipt-image-generator.js`:
```javascript
// Para JPEG, ajusta la calidad (0.0 - 1.0)
canvas.toBuffer('image/jpeg', { quality: 0.95 })
```

### Dimensiones del Recibo
En `server/receipt-image-generator.js`:
```javascript
this.width = 2100;  // Ancho en píxeles
this.height = 2970; // Alto en píxeles
```

## 🛠️ Solución de Problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Asegúrate de haber instalado las dependencias: `npm install`
- Verifica que el puerto 3001 no esté en uso

### Las imágenes no se generan
- Revisa la consola del navegador para errores
- Verifica que el servidor esté ejecutándose
- Asegúrate de que todos los campos requeridos estén completos

### Problemas con Canvas
Si tienes problemas con el módulo Canvas:
```bash
npm rebuild canvas
```

## 📝 Notas

- Los recibos se guardan en la carpeta `receipts/`
- El sistema genera automáticamente números de folio únicos
- Los recibos incluyen la política de devoluciones de CIAO CIAO MX
- Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge)

## 📞 Soporte

Para soporte o consultas:
- WhatsApp: +52 1 55 9211 2643
- Email: hola@ciaociao.mx
- Web: www.ciaociao.mx

## 📄 Licencia

© 2025 CIAO CIAO MX - Joyería Fina. Todos los derechos reservados.