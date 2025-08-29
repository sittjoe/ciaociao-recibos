# 🚀 Guía de Despliegue en GitHub

## Estado Actual
✅ Sistema funcionando localmente en http://localhost:3001
✅ Código preparado y committed en Git
✅ .gitignore configurado correctamente

## Pasos para Subir a GitHub

### Opción 1: Usar GitHub Web (Recomendado)

1. **Crear Repositorio en GitHub:**
   - Ve a https://github.com/new
   - Nombre: `ciaociao-receipt-generator`
   - Descripción: "Sistema profesional de generación de recibos como imágenes para CIAO CIAO MX Joyería Fina"
   - Configurar como Público o Privado
   - NO inicializar con README (ya tenemos uno)

2. **Conectar y Subir:**
   ```bash
   # Reemplaza [tu-usuario] con tu nombre de usuario de GitHub
   git remote add origin https://github.com/[tu-usuario]/ciaociao-receipt-generator.git
   git branch -M main
   git push -u origin main
   ```

### Opción 2: Usar GitHub CLI

1. **Autenticarse primero:**
   ```bash
   gh auth login
   ```
   - Selecciona GitHub.com
   - Usa browser o token
   - Sigue las instrucciones

2. **Crear y subir:**
   ```bash
   gh repo create ciaociao-receipt-generator --public --source=. --remote=origin --push
   ```

## Para Despliegue en Producción

### Opción A: Servidor Local/VPS
```bash
# Clonar repositorio
git clone https://github.com/[tu-usuario]/ciaociao-receipt-generator.git
cd ciaociao-receipt-generator

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

### Opción B: Vercel (Recomendado para Producción)
1. Instalar Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Desplegar:
   ```bash
   vercel
   ```

3. Seguir las instrucciones para configurar el proyecto

### Opción C: Heroku
1. Crear archivo `Procfile`:
   ```
   web: node server/receipt-server.js
   ```

2. Configurar puerto dinámico en `server/receipt-server.js`:
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```

3. Desplegar:
   ```bash
   heroku create ciaociao-receipts
   git push heroku main
   ```

### Opción D: Railway
1. Conectar con GitHub
2. Importar repositorio
3. Railway detectará automáticamente Node.js
4. Deploy automático

## Variables de Entorno (si necesarias)

Crear archivo `.env`:
```env
PORT=3001
NODE_ENV=production
```

## Configuración CORS para Producción

En `server/receipt-server.js`, actualizar CORS si es necesario:
```javascript
app.use(cors({
    origin: ['https://tu-dominio.com', 'http://localhost:3000']
}));
```

## Verificación Post-Despliegue

1. **Health Check:**
   ```bash
   curl https://tu-dominio.com/api/health
   ```

2. **Test de Generación:**
   - Abrir la aplicación
   - Llenar formulario de prueba
   - Generar recibo
   - Verificar descarga

## Solución de Problemas Comunes

### Error: Canvas no se instala
```bash
# En Linux/Ubuntu
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# En macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Reinstalar
npm rebuild canvas
```

### Error: Puerto en uso
```bash
# Encontrar proceso
lsof -i :3001

# Terminar proceso
kill -9 [PID]
```

### Error: Node version
Asegurarse de usar Node.js v14 o superior:
```bash
node --version
```

## Mantenimiento

### Actualizar dependencias:
```bash
npm update
npm audit fix
```

### Ver logs del servidor:
```bash
npm start 2>&1 | tee server.log
```

## Contacto y Soporte

- WhatsApp: +52 1 55 9211 2643
- Email: hola@ciaociao.mx
- Web: www.ciaociao.mx