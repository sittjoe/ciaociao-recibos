// camera.js - Sistema de captura y gestión de fotografías
class CameraManager {
    constructor() {
        this.maxImages = 4;
        this.maxSizeKB = 500;
        this.maxDimension = 800;
        this.images = [];
        this.currentImageIndex = 0;
        this.initializeCamera();
    }

    initializeCamera() {
        try {
            // Verificar soporte de cámara
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('⚠️ Cámara no disponible en este dispositivo');
                this.cameraAvailable = false;
            } else {
                this.cameraAvailable = true;
            }
            
            // Verificar soporte de File API
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                console.warn('⚠️ File API no soportada completamente');
                this.fileApiAvailable = false;
            } else {
                this.fileApiAvailable = true;
            }
            
            console.log('✅ Sistema de cámara inicializado');
        } catch (error) {
            console.error('❌ Error inicializando cámara:', error);
            this.cameraAvailable = false;
        }
    }

    // Capturar imagen desde cámara
    async captureFromCamera() {
        if (!this.cameraAvailable) {
            alert('La cámara no está disponible en este dispositivo');
            return null;
        }

        try {
            // Crear elementos temporales para captura
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Configurar stream de video
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Cámara trasera por defecto
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            video.srcObject = stream;
            video.play();
            
            // Crear modal para preview de cámara
            const modal = this.createCameraModal(video, canvas, ctx);
            document.body.appendChild(modal);
            
            return new Promise((resolve) => {
                // Botón de captura
                const captureBtn = modal.querySelector('#capturePhotoBtn');
                const retakeBtn = modal.querySelector('#retakePhotoBtn');
                const confirmBtn = modal.querySelector('#confirmPhotoBtn');
                const cancelBtn = modal.querySelector('#cancelCameraBtn');
                
                let capturedImage = null;
                
                captureBtn.addEventListener('click', () => {
                    // Configurar canvas con dimensiones del video
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // Capturar frame
                    ctx.drawImage(video, 0, 0);
                    
                    // Convertir a base64 y comprimir
                    canvas.toBlob(async (blob) => {
                        capturedImage = await this.compressImage(blob);
                        
                        // Mostrar preview
                        const preview = modal.querySelector('#photoPreview');
                        preview.src = capturedImage;
                        preview.style.display = 'block';
                        video.style.display = 'none';
                        
                        // Cambiar botones
                        captureBtn.style.display = 'none';
                        retakeBtn.style.display = 'inline-block';
                        confirmBtn.style.display = 'inline-block';
                    }, 'image/jpeg', 0.9);
                });
                
                retakeBtn.addEventListener('click', () => {
                    const preview = modal.querySelector('#photoPreview');
                    preview.style.display = 'none';
                    video.style.display = 'block';
                    
                    captureBtn.style.display = 'inline-block';
                    retakeBtn.style.display = 'none';
                    confirmBtn.style.display = 'none';
                    
                    capturedImage = null;
                });
                
                confirmBtn.addEventListener('click', () => {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                    resolve(capturedImage);
                });
                
                cancelBtn.addEventListener('click', () => {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                    resolve(null);
                });
            });
            
        } catch (error) {
            console.error('❌ Error capturando desde cámara:', error);
            alert('Error al acceder a la cámara: ' + error.message);
            return null;
        }
    }

    // Cargar imagen desde archivo
    async loadFromFile(file) {
        if (!this.fileApiAvailable) {
            alert('Tu navegador no soporta carga de archivos');
            return null;
        }

        try {
            // Validar tipo de archivo
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
                throw new Error('Formato de imagen no soportado. Use JPG, PNG o GIF.');
            }
            
            // Validar tamaño (máximo 10MB para el archivo original)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('El archivo es demasiado grande (máximo 10MB)');
            }
            
            // Comprimir imagen
            const compressedImage = await this.compressImage(file);
            
            return compressedImage;
            
        } catch (error) {
            console.error('❌ Error cargando imagen:', error);
            alert('Error al cargar la imagen: ' + error.message);
            return null;
        }
    }

    // Comprimir imagen
    async compressImage(input) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        // Crear canvas para redimensionar
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calcular nuevas dimensiones manteniendo aspecto
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > this.maxDimension) {
                                height = (height * this.maxDimension) / width;
                                width = this.maxDimension;
                            }
                        } else {
                            if (height > this.maxDimension) {
                                width = (width * this.maxDimension) / height;
                                height = this.maxDimension;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Dibujar imagen redimensionada
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Comprimir iterativamente hasta alcanzar tamaño objetivo
                        let quality = 0.9;
                        const compress = () => {
                            canvas.toBlob((blob) => {
                                if (blob.size > this.maxSizeKB * 1024 && quality > 0.1) {
                                    quality -= 0.1;
                                    compress();
                                } else {
                                    // Convertir a base64
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        console.log(`✅ Imagen comprimida: ${(blob.size / 1024).toFixed(2)}KB`);
                                        resolve(reader.result);
                                    };
                                    reader.readAsDataURL(blob);
                                }
                            }, 'image/jpeg', quality);
                        };
                        
                        compress();
                    };
                    
                    img.onerror = () => {
                        reject(new Error('Error al procesar la imagen'));
                    };
                    
                    img.src = e.target.result;
                };
                
                reader.onerror = () => {
                    reject(new Error('Error al leer el archivo'));
                };
                
                // Leer archivo o blob
                if (input instanceof Blob) {
                    reader.readAsDataURL(input);
                } else {
                    reader.readAsDataURL(input);
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // Agregar imagen a la colección
    addImage(imageData) {
        try {
            if (this.images.length >= this.maxImages) {
                alert(`Máximo ${this.maxImages} imágenes permitidas`);
                return false;
            }
            
            this.images.push({
                id: this.generateImageId(),
                data: imageData,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Imagen agregada (${this.images.length}/${this.maxImages})`);
            return true;
            
        } catch (error) {
            console.error('❌ Error agregando imagen:', error);
            return false;
        }
    }

    // Eliminar imagen
    removeImage(id) {
        try {
            const index = this.images.findIndex(img => img.id === id);
            if (index !== -1) {
                this.images.splice(index, 1);
                console.log('✅ Imagen eliminada');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            return false;
        }
    }

    // Obtener todas las imágenes
    getImages() {
        return this.images;
    }

    // Limpiar todas las imágenes
    clearImages() {
        this.images = [];
        this.currentImageIndex = 0;
        console.log('✅ Todas las imágenes eliminadas');
    }

    // Crear modal de cámara
    createCameraModal(video, canvas, ctx) {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-modal-content">
                <div class="camera-header">
                    <h3>Capturar Fotografía</h3>
                    <button id="cancelCameraBtn" class="close-camera">&times;</button>
                </div>
                <div class="camera-viewport">
                    ${video.outerHTML}
                    <img id="photoPreview" style="display:none; width:100%; height:auto;">
                </div>
                <div class="camera-controls">
                    <button id="capturePhotoBtn" class="btn-capture">
                        <span class="camera-icon">📸</span> Capturar
                    </button>
                    <button id="retakePhotoBtn" class="btn-secondary" style="display:none;">
                        🔄 Volver a tomar
                    </button>
                    <button id="confirmPhotoBtn" class="btn-success" style="display:none;">
                        ✓ Confirmar
                    </button>
                </div>
            </div>
        `;
        
        // Agregar estilos inline para el modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        return modal;
    }

    // Crear galería de imágenes
    createImageGallery(container) {
        try {
            container.innerHTML = '';
            
            if (this.images.length === 0) {
                container.innerHTML = `
                    <div class="no-images">
                        <p>No hay imágenes agregadas</p>
                    </div>
                `;
                return;
            }
            
            const gallery = document.createElement('div');
            gallery.className = 'image-gallery';
            
            this.images.forEach((image, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'gallery-item';
                imageItem.innerHTML = `
                    <img src="${image.data}" alt="Imagen ${index + 1}">
                    <button class="remove-image" data-id="${image.id}">×</button>
                    <span class="image-number">${index + 1}</span>
                `;
                
                // Event listener para eliminar
                imageItem.querySelector('.remove-image').addEventListener('click', (e) => {
                    this.removeImage(image.id);
                    this.createImageGallery(container); // Recrear galería
                });
                
                // Event listener para zoom
                imageItem.querySelector('img').addEventListener('click', () => {
                    this.showImageZoom(image.data);
                });
                
                gallery.appendChild(imageItem);
            });
            
            container.appendChild(gallery);
            
        } catch (error) {
            console.error('❌ Error creando galería:', error);
        }
    }

    // Mostrar imagen con zoom
    showImageZoom(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <span class="close-zoom">&times;</span>
            <img src="${imageSrc}" alt="Zoom">
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
        `;
        
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.body.appendChild(modal);
    }

    // Generar QR con enlace a imágenes
    async generateImageQR(receiptId) {
        try {
            // Para una implementación real, aquí subirías las imágenes a un servidor
            // y generarías un QR con el enlace. Por ahora, simulamos:
            
            const qrData = {
                receiptId: receiptId,
                images: this.images.length,
                timestamp: new Date().toISOString()
            };
            
            // Usar servicio gratuito de QR (considera usar una librería local en producción)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
            
            return qrUrl;
            
        } catch (error) {
            console.error('❌ Error generando QR:', error);
            return null;
        }
    }

    // Validar soporte de funcionalidades
    checkBrowserSupport() {
        const support = {
            camera: this.cameraAvailable,
            fileUpload: this.fileApiAvailable,
            canvas: !!document.createElement('canvas').getContext,
            blob: !!window.Blob,
            fileReader: !!window.FileReader
        };
        
        const unsupported = Object.entries(support)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        if (unsupported.length > 0) {
            console.warn('⚠️ Funcionalidades no soportadas:', unsupported);
        }
        
        return support;
    }

    // Generar ID único para imagen
    generateImageId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Obtener imágenes para incluir en PDF
    getImagesForPDF() {
        try {
            // Retornar máximo 2 imágenes para el PDF (para no hacerlo muy pesado)
            return this.images.slice(0, 2).map(img => ({
                data: img.data,
                width: 150, // Ancho en el PDF
                height: 100 // Alto en el PDF
            }));
        } catch (error) {
            console.error('❌ Error preparando imágenes para PDF:', error);
            return [];
        }
    }

    // Limpiar recursos (llamar al cerrar la aplicación)
    cleanup() {
        try {
            this.clearImages();
            
            // Detener cualquier stream de cámara activo
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        stream.getTracks().forEach(track => track.stop());
                    })
                    .catch(() => {}); // Ignorar errores si no hay stream
            }
            
            console.log('✅ Recursos de cámara liberados');
        } catch (error) {
            console.error('❌ Error limpiando recursos:', error);
        }
    }
}

// Exportar para uso global
window.CameraManager = CameraManager;