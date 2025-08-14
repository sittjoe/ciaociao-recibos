// supplier-pricing-tables.js - TABLAS DE PRECIOS ESPECÍFICAS POR PROVEEDOR v1.0
// Sistema de gestión de precios por proveedor con niveles de descuento y seguimiento de disponibilidad
// =================================================================

console.log('🏪 Iniciando Sistema de Tablas de Precios por Proveedor v1.0...');

// =================================================================
// CONFIGURACIÓN DEL SISTEMA DE PROVEEDORES
// =================================================================

const SUPPLIER_CONFIG = {
    // Tipos de proveedores
    supplierTypes: {
        metals: {
            name: 'Metales Preciosos',
            description: 'Proveedores de oro, plata, platino y paladio',
            icon: '⚡',
            color: '#FFD700',
            priceTypes: ['spot', 'premium', 'fabricated'],
            units: ['troy_ounce', 'gram', 'kilogram']
        },
        diamonds: {
            name: 'Diamantes',
            description: 'Proveedores de diamantes certificados',
            icon: '💎',
            color: '#B9F2FF',
            priceTypes: ['wholesale', 'certified', 'loose'],
            units: ['carat', 'point']
        },
        gemstones: {
            name: 'Piedras Preciosas',
            description: 'Proveedores de rubíes, esmeraldas, zafiros',
            icon: '🔮',
            color: '#98FB98',
            priceTypes: ['natural', 'treated', 'synthetic'],
            units: ['carat', 'piece']
        },
        findings: {
            name: 'Herrajes y Componentes',
            description: 'Broches, cadenas, monturas, herramientas',
            icon: '🔧',
            color: '#DDA0DD',
            priceTypes: ['bulk', 'retail', 'specialty'],
            units: ['piece', 'dozen', 'gross']
        },
        tools: {
            name: 'Herramientas',
            description: 'Equipos de joyería, máquinas, consumibles',
            icon: '🛠️',
            color: '#F0E68C',
            priceTypes: ['professional', 'hobby', 'industrial'],
            units: ['piece', 'set', 'kit']
        }
    },

    // Niveles de descuento estándar
    discountTiers: {
        bronze: {
            name: 'Bronce',
            minimumOrder: 5000,
            discount: 5,
            color: '#CD7F32',
            description: 'Descuento básico para compras regulares'
        },
        silver: {
            name: 'Plata',
            minimumOrder: 15000,
            discount: 10,
            color: '#C0C0C0',
            description: 'Descuento intermedio para compras frecuentes'
        },
        gold: {
            name: 'Oro',
            minimumOrder: 35000,
            discount: 15,
            color: '#FFD700',
            description: 'Descuento alto para compras en volumen'
        },
        platinum: {
            name: 'Platino',
            minimumOrder: 75000,
            discount: 20,
            color: '#E5E4E2',
            description: 'Descuento premium para socios estratégicos'
        },
        diamond: {
            name: 'Diamante',
            minimumOrder: 150000,
            discount: 25,
            color: '#B9F2FF',
            description: 'Descuento máximo para distribuidores exclusivos'
        }
    },

    // Estados de disponibilidad
    availabilityStatus: {
        in_stock: {
            name: 'En Stock',
            color: '#28a745',
            icon: '✅',
            description: 'Disponible para entrega inmediata'
        },
        low_stock: {
            name: 'Stock Bajo',
            color: '#ffc107',
            icon: '⚠️',
            description: 'Pocas unidades disponibles'
        },
        back_order: {
            name: 'Bajo Pedido',
            color: '#17a2b8',
            icon: '📦',
            description: 'Disponible bajo pedido especial'
        },
        out_of_stock: {
            name: 'Agotado',
            color: '#dc3545',
            icon: '❌',
            description: 'Temporalmente no disponible'
        },
        discontinued: {
            name: 'Descontinuado',
            color: '#6c757d',
            icon: '🚫',
            description: 'Producto ya no disponible'
        },
        pre_order: {
            name: 'Pre-orden',
            color: '#007bff',
            icon: '🔄',
            description: 'Disponible para pre-orden'
        }
    },

    // Configuración de términos de pago
    paymentTerms: {
        cash_advance: {
            name: 'Pago Anticipado',
            discount: 3,
            description: 'Descuento adicional por pago anticipado'
        },
        net_15: {
            name: 'Neto 15 días',
            discount: 0,
            description: 'Pago dentro de 15 días'
        },
        net_30: {
            name: 'Neto 30 días',
            discount: 0,
            description: 'Pago dentro de 30 días'
        },
        net_60: {
            name: 'Neto 60 días',
            discount: -2,
            description: 'Recargo por pago a 60 días'
        }
    },

    // Configuración de persistencia
    storage: {
        prefix: 'ciaociao_suppliers_',
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 días
        backupInterval: 3 * 60 * 1000, // 3 minutos
        maxSuppliers: 50,
        maxProductsPerSupplier: 1000
    }
};

// =================================================================
// CLASE PRINCIPAL DE GESTIÓN DE PROVEEDORES
// =================================================================

class SupplierPricingTables {
    constructor() {
        this.suppliers = new Map();
        this.productCatalog = new Map();
        this.priceHistory = new Map();
        this.currentSupplier = null;
        this.isInitialized = false;
        this.observers = [];
        this.updateTimer = null;
        
        // Cargar datos por defecto
        this.loadDefaultSuppliers();
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Inicializando sistema de tablas de precios por proveedor...');
        
        try {
            // Cargar datos persistidos
            this.loadPersistedData();
            
            // Configurar interfaz
            this.setupUI();
            
            // Configurar auto-guardado
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('✅ Sistema de proveedores inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de proveedores:', error);
            throw error;
        }
    }

    loadDefaultSuppliers() {
        // Crear algunos proveedores de ejemplo
        const defaultSuppliers = [
            {
                id: 'oro_mx_1',
                name: 'Oro Mexicano SA',
                type: 'metals',
                contact: {
                    phone: '+52 55 1234 5678',
                    email: 'ventas@oromexicano.com',
                    address: 'Ciudad de México, México'
                },
                paymentTerms: 'net_30',
                currentTier: 'silver',
                minimumOrder: 5000,
                shippingCost: 150,
                notes: 'Proveedor confiable de metales preciosos'
            },
            {
                id: 'diamantes_int',
                name: 'Diamantes Internacionales',
                type: 'diamonds',
                contact: {
                    phone: '+1 212 555 0123',
                    email: 'info@diamondint.com',
                    address: 'New York, NY, USA'
                },
                paymentTerms: 'cash_advance',
                currentTier: 'gold',
                minimumOrder: 25000,
                shippingCost: 300,
                notes: 'Especialistas en diamantes certificados GIA'
            },
            {
                id: 'gemas_colombia',
                name: 'Gemas de Colombia',
                type: 'gemstones',
                contact: {
                    phone: '+57 1 234 5678',
                    email: 'exportaciones@gemascolombia.co',
                    address: 'Bogotá, Colombia'
                },
                paymentTerms: 'net_15',
                currentTier: 'bronze',
                minimumOrder: 3000,
                shippingCost: 200,
                notes: 'Esmeraldas y piedras preciosas naturales'
            }
        ];

        defaultSuppliers.forEach(supplier => {
            this.suppliers.set(supplier.id, {
                ...supplier,
                created: Date.now(),
                modified: Date.now(),
                products: new Map(),
                lastOrder: null,
                totalOrdered: 0
            });
        });

        // Agregar algunos productos de ejemplo
        this.addSampleProducts();
    }

    addSampleProducts() {
        // Productos para Oro Mexicano SA
        const goldProducts = [
            {
                id: 'gold_24k_bar',
                name: 'Barra de Oro 24k - 1 Oz',
                category: 'gold',
                subcategory: '24k',
                basePrice: 2400,
                unit: 'troy_ounce',
                availability: 'in_stock',
                stock: 50,
                description: 'Barra de oro puro 24k certificada',
                specifications: {
                    purity: '99.9%',
                    weight: '31.1 gramos',
                    certification: 'LBMA'
                }
            },
            {
                id: 'gold_18k_sheet',
                name: 'Lámina Oro 18k - 1 metro',
                category: 'gold',
                subcategory: '18k',
                basePrice: 85,
                unit: 'gram',
                availability: 'in_stock',
                stock: 200,
                description: 'Lámina de oro 18k para fabricación',
                specifications: {
                    purity: '75%',
                    thickness: '0.5mm',
                    width: '10cm'
                }
            }
        ];

        goldProducts.forEach(product => {
            this.addProductToSupplier('oro_mx_1', product);
        });

        // Productos para Diamantes Internacionales
        const diamondProducts = [
            {
                id: 'diamond_1ct_vvs1',
                name: 'Diamante 1ct VVS1 G',
                category: 'diamond',
                subcategory: 'round',
                basePrice: 6500,
                unit: 'carat',
                availability: 'in_stock',
                stock: 12,
                description: 'Diamante redondo 1 quilate VVS1 color G',
                specifications: {
                    cut: 'Excellent',
                    color: 'G',
                    clarity: 'VVS1',
                    certification: 'GIA'
                }
            },
            {
                id: 'diamond_0_5ct_vs2',
                name: 'Diamante 0.5ct VS2 H',
                category: 'diamond',
                subcategory: 'round',
                basePrice: 1800,
                unit: 'carat',
                availability: 'low_stock',
                stock: 3,
                description: 'Diamante redondo 0.5 quilates VS2 color H',
                specifications: {
                    cut: 'Very Good',
                    color: 'H',
                    clarity: 'VS2',
                    certification: 'GIA'
                }
            }
        ];

        diamondProducts.forEach(product => {
            this.addProductToSupplier('diamantes_int', product);
        });

        // Productos para Gemas de Colombia
        const gemstoneProducts = [
            {
                id: 'emerald_2ct_natural',
                name: 'Esmeralda Natural 2ct',
                category: 'emerald',
                subcategory: 'natural',
                basePrice: 3200,
                unit: 'carat',
                availability: 'in_stock',
                stock: 8,
                description: 'Esmeralda natural colombiana 2 quilates',
                specifications: {
                    origin: 'Muzo, Colombia',
                    treatment: 'None',
                    color: 'Vivid Green',
                    clarity: 'VS'
                }
            }
        ];

        gemstoneProducts.forEach(product => {
            this.addProductToSupplier('gemas_colombia', product);
        });
    }

    // =================================================================
    // CONFIGURACIÓN DE INTERFAZ DE USUARIO
    // =================================================================

    setupUI() {
        this.createMainInterface();
        this.setupEventListeners();
        this.renderSupplierList();
        this.renderSupplierDetails();
    }

    createMainInterface() {
        let container = document.getElementById('supplierPricingContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'supplierPricingContainer';
            container.className = 'supplier-pricing-container';
            
            const targetElement = document.querySelector('.markup-settings-container') || 
                                 document.querySelector('.manual-pricing-container') || 
                                 document.querySelector('.calculator-container') || 
                                 document.querySelector('.container') || 
                                 document.body;
            targetElement.appendChild(container);
        }

        container.innerHTML = `
            <div class="supplier-header">
                <h2>🏪 Tablas de Precios por Proveedor</h2>
                <p>Gestione precios específicos, descuentos por volumen y disponibilidad por proveedor</p>
                
                <div class="supplier-controls">
                    <button id="addSupplier" class="btn-add">➕ Nuevo Proveedor</button>
                    <button id="importSuppliers" class="btn-import">📥 Importar Lista</button>
                    <button id="exportSuppliers" class="btn-export">📤 Exportar Todo</button>
                    <button id="bulkUpdatePrices" class="btn-update">🔄 Actualizar Precios Masivo</button>
                    
                    <div class="search-controls">
                        <input type="text" id="supplierSearch" placeholder="Buscar proveedor..." maxlength="50">
                        <select id="supplierTypeFilter">
                            <option value="">Todos los tipos</option>
                            ${Object.keys(SUPPLIER_CONFIG.supplierTypes).map(type => 
                                `<option value="${type}">${SUPPLIER_CONFIG.supplierTypes[type].name}</option>`
                            ).join('')}
                        </select>
                        <select id="tierFilter">
                            <option value="">Todos los niveles</option>
                            ${Object.keys(SUPPLIER_CONFIG.discountTiers).map(tier => 
                                `<option value="${tier}">${SUPPLIER_CONFIG.discountTiers[tier].name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="supplier-layout">
                <div class="supplier-sidebar">
                    <h3>📋 Lista de Proveedores</h3>
                    <div class="supplier-list" id="supplierList">
                        <!-- Se llenará dinámicamente -->
                    </div>
                    
                    <div class="supplier-stats">
                        <h4>📊 Estadísticas</h4>
                        <div class="stats-grid" id="supplierStats">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                </div>
                
                <div class="supplier-main">
                    <div class="supplier-details" id="supplierDetails">
                        <div class="no-supplier-selected">
                            <h3>👈 Seleccione un proveedor</h3>
                            <p>Elija un proveedor de la lista para ver detalles, productos y precios</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modales -->
            <div id="supplierModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="supplierModalTitle">Nuevo Proveedor</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
                    </div>
                    <div class="modal-body" id="supplierModalBody">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            </div>
            
            <div id="productModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="productModalTitle">Nuevo Producto</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
                    </div>
                    <div class="modal-body" id="productModalBody">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    renderSupplierList() {
        const supplierList = document.getElementById('supplierList');
        if (!supplierList) return;

        const searchTerm = document.getElementById('supplierSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('supplierTypeFilter')?.value || '';
        const tierFilter = document.getElementById('tierFilter')?.value || '';

        let filteredSuppliers = Array.from(this.suppliers.entries());

        // Aplicar filtros
        if (searchTerm) {
            filteredSuppliers = filteredSuppliers.filter(([id, supplier]) => 
                supplier.name.toLowerCase().includes(searchTerm) ||
                supplier.contact.email.toLowerCase().includes(searchTerm)
            );
        }

        if (typeFilter) {
            filteredSuppliers = filteredSuppliers.filter(([id, supplier]) => 
                supplier.type === typeFilter
            );
        }

        if (tierFilter) {
            filteredSuppliers = filteredSuppliers.filter(([id, supplier]) => 
                supplier.currentTier === tierFilter
            );
        }

        supplierList.innerHTML = '';

        if (filteredSuppliers.length === 0) {
            supplierList.innerHTML = '<div class="no-results">No se encontraron proveedores</div>';
            return;
        }

        filteredSuppliers.forEach(([supplierId, supplier]) => {
            const supplierType = SUPPLIER_CONFIG.supplierTypes[supplier.type];
            const tierInfo = SUPPLIER_CONFIG.discountTiers[supplier.currentTier];
            const productCount = supplier.products?.size || 0;

            const supplierCard = document.createElement('div');
            supplierCard.className = `supplier-card ${this.currentSupplier === supplierId ? 'selected' : ''}`;
            supplierCard.setAttribute('data-supplier-id', supplierId);

            supplierCard.innerHTML = `
                <div class="supplier-card-header">
                    <div class="supplier-icon" style="background: ${supplierType.color}">
                        ${supplierType.icon}
                    </div>
                    <div class="supplier-info">
                        <h4 class="supplier-name">${supplier.name}</h4>
                        <span class="supplier-type">${supplierType.name}</span>
                    </div>
                </div>
                
                <div class="supplier-card-body">
                    <div class="supplier-tier" style="background: ${tierInfo.color}20; color: ${tierInfo.color}">
                        <span class="tier-badge">${tierInfo.name}</span>
                        <span class="tier-discount">${tierInfo.discount}% desc.</span>
                    </div>
                    
                    <div class="supplier-stats-mini">
                        <span>📦 ${productCount} productos</span>
                        <span>💰 $${supplier.totalOrdered?.toLocaleString('es-MX') || '0'}</span>
                    </div>
                    
                    <div class="supplier-contact">
                        <span>📞 ${supplier.contact.phone}</span>
                        <span>📧 ${supplier.contact.email}</span>
                    </div>
                </div>
                
                <div class="supplier-actions">
                    <button class="btn-view" onclick="window.supplierPricing.selectSupplier('${supplierId}')">
                        👁️ Ver
                    </button>
                    <button class="btn-edit" onclick="window.supplierPricing.editSupplier('${supplierId}')">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="window.supplierPricing.deleteSupplier('${supplierId}')">
                        🗑️
                    </button>
                </div>
            `;

            supplierList.appendChild(supplierCard);
        });

        this.updateSupplierStats();
    }

    renderSupplierDetails() {
        const detailsContainer = document.getElementById('supplierDetails');
        if (!detailsContainer || !this.currentSupplier) {
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="no-supplier-selected">
                        <h3>👈 Seleccione un proveedor</h3>
                        <p>Elija un proveedor de la lista para ver detalles, productos y precios</p>
                    </div>
                `;
            }
            return;
        }

        const supplier = this.suppliers.get(this.currentSupplier);
        if (!supplier) return;

        const supplierType = SUPPLIER_CONFIG.supplierTypes[supplier.type];
        const tierInfo = SUPPLIER_CONFIG.discountTiers[supplier.currentTier];
        const paymentTerms = SUPPLIER_CONFIG.paymentTerms[supplier.paymentTerms];

        detailsContainer.innerHTML = `
            <div class="supplier-detail-header">
                <div class="supplier-title">
                    <div class="supplier-icon-large" style="background: ${supplierType.color}">
                        ${supplierType.icon}
                    </div>
                    <div>
                        <h3>${supplier.name}</h3>
                        <span class="supplier-type-badge">${supplierType.name}</span>
                    </div>
                </div>
                
                <div class="supplier-actions-header">
                    <button id="addProduct" class="btn-add">➕ Nuevo Producto</button>
                    <button id="editSupplierDetails" class="btn-edit">✏️ Editar Proveedor</button>
                    <button id="exportSupplierData" class="btn-export">📤 Exportar</button>
                </div>
            </div>
            
            <div class="supplier-detail-tabs">
                <button class="tab-btn active" data-tab="info">📋 Información</button>
                <button class="tab-btn" data-tab="products">📦 Productos</button>
                <button class="tab-btn" data-tab="pricing">💰 Precios</button>
                <button class="tab-btn" data-tab="history">📊 Historial</button>
            </div>
            
            <div class="tab-content">
                <div id="tab-info" class="tab-pane active">
                    ${this.renderSupplierInfo(supplier, tierInfo, paymentTerms)}
                </div>
                
                <div id="tab-products" class="tab-pane">
                    ${this.renderSupplierProducts(supplier)}
                </div>
                
                <div id="tab-pricing" class="tab-pane">
                    ${this.renderPricingTable(supplier)}
                </div>
                
                <div id="tab-history" class="tab-pane">
                    ${this.renderPriceHistory(supplier)}
                </div>
            </div>
        `;

        this.setupDetailEventListeners();
    }

    renderSupplierInfo(supplier, tierInfo, paymentTerms) {
        return `
            <div class="supplier-info-grid">
                <div class="info-section">
                    <h4>📞 Información de Contacto</h4>
                    <div class="contact-details">
                        <div class="contact-row">
                            <span class="label">Teléfono:</span>
                            <span class="value">${supplier.contact.phone}</span>
                        </div>
                        <div class="contact-row">
                            <span class="label">Email:</span>
                            <span class="value">${supplier.contact.email}</span>
                        </div>
                        <div class="contact-row">
                            <span class="label">Dirección:</span>
                            <span class="value">${supplier.contact.address}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>💼 Términos Comerciales</h4>
                    <div class="commercial-details">
                        <div class="commercial-row">
                            <span class="label">Nivel actual:</span>
                            <span class="tier-badge" style="background: ${tierInfo.color}; color: white;">
                                ${tierInfo.name} (${tierInfo.discount}% desc.)
                            </span>
                        </div>
                        <div class="commercial-row">
                            <span class="label">Términos de pago:</span>
                            <span class="value">${paymentTerms.name}</span>
                        </div>
                        <div class="commercial-row">
                            <span class="label">Pedido mínimo:</span>
                            <span class="value">$${supplier.minimumOrder.toLocaleString('es-MX')}</span>
                        </div>
                        <div class="commercial-row">
                            <span class="label">Costo de envío:</span>
                            <span class="value">$${supplier.shippingCost.toLocaleString('es-MX')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h4>📊 Estadísticas</h4>
                    <div class="stats-details">
                        <div class="stat-item">
                            <span class="stat-number">${supplier.products?.size || 0}</span>
                            <span class="stat-label">Productos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">$${(supplier.totalOrdered || 0).toLocaleString('es-MX')}</span>
                            <span class="stat-label">Total Pedidos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${supplier.lastOrder ? this.formatDate(supplier.lastOrder) : 'Nunca'}</span>
                            <span class="stat-label">Último Pedido</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section full-width">
                    <h4>📝 Notas</h4>
                    <div class="notes-content">
                        <p>${supplier.notes || 'No hay notas registradas'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSupplierProducts(supplier) {
        const products = Array.from(supplier.products?.values() || []);
        
        if (products.length === 0) {
            return `
                <div class="no-products">
                    <h4>📦 No hay productos registrados</h4>
                    <p>Agregue productos para este proveedor usando el botón "➕ Nuevo Producto"</p>
                </div>
            `;
        }

        return `
            <div class="products-controls">
                <div class="search-products">
                    <input type="text" id="productSearch" placeholder="Buscar productos..." maxlength="50">
                    <select id="categoryFilter">
                        <option value="">Todas las categorías</option>
                    </select>
                    <select id="availabilityFilter">
                        <option value="">Todas las disponibilidades</option>
                        ${Object.keys(SUPPLIER_CONFIG.availabilityStatus).map(status => 
                            `<option value="${status}">${SUPPLIER_CONFIG.availabilityStatus[status].name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="products-table-container">
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio Base</th>
                            <th>Precio con Descuento</th>
                            <th>Disponibilidad</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => this.renderProductRow(product, supplier)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderProductRow(product, supplier) {
        const availabilityInfo = SUPPLIER_CONFIG.availabilityStatus[product.availability];
        const tierInfo = SUPPLIER_CONFIG.discountTiers[supplier.currentTier];
        const discountedPrice = product.basePrice * (1 - tierInfo.discount / 100);

        return `
            <tr class="product-row" data-product-id="${product.id}">
                <td class="product-name">
                    <div class="product-info">
                        <strong>${product.name}</strong>
                        <small>${product.description}</small>
                    </div>
                </td>
                <td class="product-category">
                    <span class="category-badge">${product.category}</span>
                    ${product.subcategory ? `<small>${product.subcategory}</small>` : ''}
                </td>
                <td class="product-base-price">
                    $${product.basePrice.toLocaleString('es-MX')}
                    <small>/${product.unit}</small>
                </td>
                <td class="product-discounted-price">
                    <strong>$${discountedPrice.toLocaleString('es-MX')}</strong>
                    <small class="discount-info">${tierInfo.discount}% desc.</small>
                </td>
                <td class="product-availability">
                    <span class="availability-badge" style="background: ${availabilityInfo.color}; color: white;">
                        ${availabilityInfo.icon} ${availabilityInfo.name}
                    </span>
                </td>
                <td class="product-stock">
                    <span class="stock-number">${product.stock || 0}</span>
                    <small>unidades</small>
                </td>
                <td class="product-actions">
                    <button class="btn-small btn-edit" onclick="window.supplierPricing.editProduct('${supplier.id}', '${product.id}')">
                        ✏️
                    </button>
                    <button class="btn-small btn-delete" onclick="window.supplierPricing.deleteProduct('${supplier.id}', '${product.id}')">
                        🗑️
                    </button>
                    <button class="btn-small btn-order" onclick="window.supplierPricing.orderProduct('${supplier.id}', '${product.id}')">
                        🛒
                    </button>
                </td>
            </tr>
        `;
    }

    renderPricingTable(supplier) {
        const tierInfo = SUPPLIER_CONFIG.discountTiers[supplier.currentTier];
        const products = Array.from(supplier.products?.values() || []);

        return `
            <div class="pricing-summary">
                <h4>💰 Resumen de Precios - Nivel ${tierInfo.name}</h4>
                <div class="pricing-info">
                    <div class="pricing-stat">
                        <span class="label">Descuento actual:</span>
                        <span class="value">${tierInfo.discount}%</span>
                    </div>
                    <div class="pricing-stat">
                        <span class="label">Pedido mínimo:</span>
                        <span class="value">$${tierInfo.minimumOrder.toLocaleString('es-MX')}</span>
                    </div>
                    <div class="pricing-stat">
                        <span class="label">Próximo nivel:</span>
                        <span class="value">${this.getNextTier(supplier.currentTier)}</span>
                    </div>
                </div>
            </div>
            
            <div class="tier-progression">
                <h4>📈 Progresión de Niveles</h4>
                <div class="tiers-timeline">
                    ${Object.keys(SUPPLIER_CONFIG.discountTiers).map(tierKey => {
                        const tier = SUPPLIER_CONFIG.discountTiers[tierKey];
                        const isActive = tierKey === supplier.currentTier;
                        const isAchieved = supplier.totalOrdered >= tier.minimumOrder;
                        
                        return `
                            <div class="tier-step ${isActive ? 'active' : ''} ${isAchieved ? 'achieved' : ''}">
                                <div class="tier-circle" style="background: ${tier.color}">
                                    ${isAchieved ? '✓' : tierKey.charAt(0).toUpperCase()}
                                </div>
                                <div class="tier-info">
                                    <strong>${tier.name}</strong>
                                    <span>${tier.discount}% descuento</span>
                                    <small>Min: $${tier.minimumOrder.toLocaleString('es-MX')}</small>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="pricing-calculator">
                <h4>🧮 Calculadora de Precios</h4>
                <div class="calculator-form">
                    <div class="input-group">
                        <label>Seleccionar producto:</label>
                        <select id="priceCalcProduct">
                            <option value="">-- Seleccionar producto --</option>
                            ${products.map(product => 
                                `<option value="${product.id}">${product.name} - $${product.basePrice}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Cantidad:</label>
                        <input type="number" id="priceCalcQuantity" value="1" min="1" step="1">
                    </div>
                    <div class="input-group">
                        <label>Nivel de descuento:</label>
                        <select id="priceCalcTier">
                            ${Object.keys(SUPPLIER_CONFIG.discountTiers).map(tierKey => {
                                const tier = SUPPLIER_CONFIG.discountTiers[tierKey];
                                return `<option value="${tierKey}" ${tierKey === supplier.currentTier ? 'selected' : ''}>${tier.name} (${tier.discount}%)</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <button id="calculatePrice" class="btn-calculate">🧮 Calcular</button>
                </div>
                
                <div id="priceCalcResult" class="calc-result" style="display: none;">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
        `;
    }

    renderPriceHistory(supplier) {
        // Esto sería para mostrar historial de cambios de precios
        // Por ahora mostrar mensaje de placeholder
        return `
            <div class="price-history-placeholder">
                <h4>📊 Historial de Precios</h4>
                <p>El historial de cambios de precios se implementará en una versión futura.</p>
                <p>Aquí se mostrará:</p>
                <ul>
                    <li>📈 Gráficos de evolución de precios por producto</li>
                    <li>📅 Fechas de cambios de precios</li>
                    <li>🔄 Comparación de precios históricos</li>
                    <li>📊 Estadísticas de volatilidad</li>
                </ul>
            </div>
        `;
    }

    // =================================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // =================================================================

    setupEventListeners() {
        // Event delegation para búsqueda y filtros
        document.addEventListener('input', (e) => {
            if (e.target.matches('#supplierSearch')) {
                clearTimeout(this.updateTimer);
                this.updateTimer = setTimeout(() => {
                    this.renderSupplierList();
                }, 300);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#supplierTypeFilter, #tierFilter')) {
                this.renderSupplierList();
            }
        });

        // Botones principales
        document.addEventListener('click', (e) => {
            if (e.target.matches('#addSupplier')) {
                this.showSupplierModal();
            } else if (e.target.matches('#importSuppliers')) {
                this.importSuppliers();
            } else if (e.target.matches('#exportSuppliers')) {
                this.exportSuppliers();
            } else if (e.target.matches('#bulkUpdatePrices')) {
                this.showBulkUpdateModal();
            }
        });
    }

    setupDetailEventListeners() {
        // Tabs
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            }
        });

        // Botones de detalle
        document.addEventListener('click', (e) => {
            if (e.target.matches('#addProduct')) {
                this.showProductModal();
            } else if (e.target.matches('#editSupplierDetails')) {
                this.editSupplier(this.currentSupplier);
            } else if (e.target.matches('#exportSupplierData')) {
                this.exportSupplierData(this.currentSupplier);
            } else if (e.target.matches('#calculatePrice')) {
                this.calculateProductPrice();
            }
        });
    }

    // =================================================================
    // GESTIÓN DE PROVEEDORES
    // =================================================================

    selectSupplier(supplierId) {
        this.currentSupplier = supplierId;
        
        // Actualizar UI
        document.querySelectorAll('.supplier-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-supplier-id="${supplierId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.renderSupplierDetails();
        this.notifyObservers('supplier_selected', { supplierId });
    }

    showSupplierModal(supplierId = null) {
        const modal = document.getElementById('supplierModal');
        const title = document.getElementById('supplierModalTitle');
        const body = document.getElementById('supplierModalBody');
        
        const isEdit = !!supplierId;
        const supplier = isEdit ? this.suppliers.get(supplierId) : null;
        
        title.textContent = isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor';
        
        body.innerHTML = `
            <form id="supplierForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="supplierName">Nombre del proveedor:</label>
                        <input type="text" id="supplierName" value="${supplier?.name || ''}" required maxlength="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierType">Tipo:</label>
                        <select id="supplierType" required>
                            ${Object.keys(SUPPLIER_CONFIG.supplierTypes).map(type => 
                                `<option value="${type}" ${supplier?.type === type ? 'selected' : ''}>
                                    ${SUPPLIER_CONFIG.supplierTypes[type].name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierPhone">Teléfono:</label>
                        <input type="tel" id="supplierPhone" value="${supplier?.contact?.phone || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierEmail">Email:</label>
                        <input type="email" id="supplierEmail" value="${supplier?.contact?.email || ''}" required>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="supplierAddress">Dirección:</label>
                        <textarea id="supplierAddress" rows="2" maxlength="200">${supplier?.contact?.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierTier">Nivel actual:</label>
                        <select id="supplierTier" required>
                            ${Object.keys(SUPPLIER_CONFIG.discountTiers).map(tier => 
                                `<option value="${tier}" ${supplier?.currentTier === tier ? 'selected' : ''}>
                                    ${SUPPLIER_CONFIG.discountTiers[tier].name} (${SUPPLIER_CONFIG.discountTiers[tier].discount}%)
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierPaymentTerms">Términos de pago:</label>
                        <select id="supplierPaymentTerms" required>
                            ${Object.keys(SUPPLIER_CONFIG.paymentTerms).map(terms => 
                                `<option value="${terms}" ${supplier?.paymentTerms === terms ? 'selected' : ''}>
                                    ${SUPPLIER_CONFIG.paymentTerms[terms].name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierMinOrder">Pedido mínimo (MXN):</label>
                        <input type="number" id="supplierMinOrder" value="${supplier?.minimumOrder || 1000}" min="0" step="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="supplierShipping">Costo de envío (MXN):</label>
                        <input type="number" id="supplierShipping" value="${supplier?.shippingCost || 100}" min="0" step="10">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="supplierNotes">Notas:</label>
                        <textarea id="supplierNotes" rows="3" maxlength="500">${supplier?.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="document.getElementById('supplierModal').style.display='none'" class="btn-cancel">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-save">
                        ${isEdit ? 'Actualizar' : 'Crear'} Proveedor
                    </button>
                </div>
            </form>
        `;
        
        modal.style.display = 'block';
        
        // Setup form submission
        const form = document.getElementById('supplierForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveSupplier(supplierId);
        };
    }

    saveSupplier(supplierId = null) {
        const isEdit = !!supplierId;
        const form = document.getElementById('supplierForm');
        const formData = new FormData(form);
        
        const supplierData = {
            id: supplierId || this.generateSupplierId(),
            name: document.getElementById('supplierName').value,
            type: document.getElementById('supplierType').value,
            contact: {
                phone: document.getElementById('supplierPhone').value,
                email: document.getElementById('supplierEmail').value,
                address: document.getElementById('supplierAddress').value
            },
            currentTier: document.getElementById('supplierTier').value,
            paymentTerms: document.getElementById('supplierPaymentTerms').value,
            minimumOrder: parseFloat(document.getElementById('supplierMinOrder').value) || 1000,
            shippingCost: parseFloat(document.getElementById('supplierShipping').value) || 100,
            notes: document.getElementById('supplierNotes').value,
            modified: Date.now()
        };
        
        if (!isEdit) {
            supplierData.created = Date.now();
            supplierData.products = new Map();
            supplierData.totalOrdered = 0;
            supplierData.lastOrder = null;
        } else {
            const existingSupplier = this.suppliers.get(supplierId);
            Object.assign(supplierData, {
                created: existingSupplier.created,
                products: existingSupplier.products,
                totalOrdered: existingSupplier.totalOrdered,
                lastOrder: existingSupplier.lastOrder
            });
        }
        
        this.suppliers.set(supplierData.id, supplierData);
        
        if (!isEdit) {
            this.currentSupplier = supplierData.id;
        }
        
        this.renderSupplierList();
        this.renderSupplierDetails();
        this.persistData();
        
        document.getElementById('supplierModal').style.display = 'none';
        
        this.notifyObservers(isEdit ? 'supplier_updated' : 'supplier_created', { supplier: supplierData });
        console.log(`${isEdit ? '✏️ Proveedor actualizado' : '➕ Nuevo proveedor creado'}: ${supplierData.name}`);
    }

    editSupplier(supplierId) {
        this.showSupplierModal(supplierId);
    }

    deleteSupplier(supplierId) {
        const supplier = this.suppliers.get(supplierId);
        if (!supplier) return;
        
        const productCount = supplier.products?.size || 0;
        const message = productCount > 0 
            ? `¿Está seguro de eliminar "${supplier.name}"? Esto también eliminará ${productCount} productos.`
            : `¿Está seguro de eliminar "${supplier.name}"?`;
            
        if (confirm(message)) {
            this.suppliers.delete(supplierId);
            
            if (this.currentSupplier === supplierId) {
                this.currentSupplier = null;
            }
            
            this.renderSupplierList();
            this.renderSupplierDetails();
            this.persistData();
            
            this.notifyObservers('supplier_deleted', { supplierId, supplier });
            console.log(`🗑️ Proveedor eliminado: ${supplier.name}`);
        }
    }

    // =================================================================
    // GESTIÓN DE PRODUCTOS
    // =================================================================

    addProductToSupplier(supplierId, productData) {
        const supplier = this.suppliers.get(supplierId);
        if (!supplier) return;

        if (!supplier.products) {
            supplier.products = new Map();
        }

        const product = {
            ...productData,
            created: Date.now(),
            modified: Date.now()
        };

        supplier.products.set(product.id, product);
        this.suppliers.set(supplierId, supplier);
    }

    showProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const body = document.getElementById('productModalBody');
        
        if (!this.currentSupplier) {
            alert('Seleccione un proveedor primero');
            return;
        }
        
        const supplier = this.suppliers.get(this.currentSupplier);
        const isEdit = !!productId;
        const product = isEdit ? supplier.products?.get(productId) : null;
        
        title.textContent = isEdit ? 'Editar Producto' : 'Nuevo Producto';
        
        body.innerHTML = `
            <form id="productForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="productName">Nombre del producto:</label>
                        <input type="text" id="productName" value="${product?.name || ''}" required maxlength="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="productCategory">Categoría:</label>
                        <input type="text" id="productCategory" value="${product?.category || ''}" required maxlength="50">
                    </div>
                    
                    <div class="form-group">
                        <label for="productSubcategory">Subcategoría:</label>
                        <input type="text" id="productSubcategory" value="${product?.subcategory || ''}" maxlength="50">
                    </div>
                    
                    <div class="form-group">
                        <label for="productPrice">Precio base:</label>
                        <input type="number" id="productPrice" value="${product?.basePrice || ''}" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="productUnit">Unidad:</label>
                        <select id="productUnit" required>
                            <option value="piece" ${product?.unit === 'piece' ? 'selected' : ''}>Pieza</option>
                            <option value="gram" ${product?.unit === 'gram' ? 'selected' : ''}>Gramo</option>
                            <option value="troy_ounce" ${product?.unit === 'troy_ounce' ? 'selected' : ''}>Onza Troy</option>
                            <option value="carat" ${product?.unit === 'carat' ? 'selected' : ''}>Quilate</option>
                            <option value="dozen" ${product?.unit === 'dozen' ? 'selected' : ''}>Docena</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="productAvailability">Disponibilidad:</label>
                        <select id="productAvailability" required>
                            ${Object.keys(SUPPLIER_CONFIG.availabilityStatus).map(status => 
                                `<option value="${status}" ${product?.availability === status ? 'selected' : ''}>
                                    ${SUPPLIER_CONFIG.availabilityStatus[status].name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="productStock">Stock disponible:</label>
                        <input type="number" id="productStock" value="${product?.stock || 0}" min="0" step="1">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="productDescription">Descripción:</label>
                        <textarea id="productDescription" rows="2" maxlength="200">${product?.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Especificaciones técnicas:</label>
                        <div class="specifications-inputs" id="specificationsInputs">
                            ${this.renderSpecificationInputs(product?.specifications || {})}
                        </div>
                        <button type="button" id="addSpecification" class="btn-small">+ Agregar Especificación</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="document.getElementById('productModal').style.display='none'" class="btn-cancel">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-save">
                        ${isEdit ? 'Actualizar' : 'Crear'} Producto
                    </button>
                </div>
            </form>
        `;
        
        modal.style.display = 'block';
        
        // Setup form submission
        const form = document.getElementById('productForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveProduct(productId);
        };
        
        // Setup add specification button
        document.getElementById('addSpecification').onclick = () => {
            this.addSpecificationInput();
        };
    }

    renderSpecificationInputs(specifications) {
        return Object.entries(specifications).map(([key, value]) => `
            <div class="specification-input">
                <input type="text" class="spec-key" value="${key}" placeholder="Clave">
                <input type="text" class="spec-value" value="${value}" placeholder="Valor">
                <button type="button" class="btn-remove-spec" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('') + (Object.keys(specifications).length === 0 ? 
            `<div class="specification-input">
                <input type="text" class="spec-key" placeholder="Clave">
                <input type="text" class="spec-value" placeholder="Valor">
                <button type="button" class="btn-remove-spec" onclick="this.parentElement.remove()">×</button>
            </div>` : ''
        );
    }

    addSpecificationInput() {
        const container = document.getElementById('specificationsInputs');
        const newInput = document.createElement('div');
        newInput.className = 'specification-input';
        newInput.innerHTML = `
            <input type="text" class="spec-key" placeholder="Clave">
            <input type="text" class="spec-value" placeholder="Valor">
            <button type="button" class="btn-remove-spec" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(newInput);
    }

    saveProduct(productId = null) {
        if (!this.currentSupplier) return;
        
        const supplier = this.suppliers.get(this.currentSupplier);
        const isEdit = !!productId;
        
        // Collect specifications
        const specifications = {};
        document.querySelectorAll('.specification-input').forEach(specDiv => {
            const key = specDiv.querySelector('.spec-key').value.trim();
            const value = specDiv.querySelector('.spec-value').value.trim();
            if (key && value) {
                specifications[key] = value;
            }
        });
        
        const productData = {
            id: productId || this.generateProductId(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            subcategory: document.getElementById('productSubcategory').value,
            basePrice: parseFloat(document.getElementById('productPrice').value),
            unit: document.getElementById('productUnit').value,
            availability: document.getElementById('productAvailability').value,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            description: document.getElementById('productDescription').value,
            specifications: specifications,
            modified: Date.now()
        };
        
        if (!isEdit) {
            productData.created = Date.now();
        } else {
            const existingProduct = supplier.products.get(productId);
            productData.created = existingProduct.created;
        }
        
        if (!supplier.products) {
            supplier.products = new Map();
        }
        
        supplier.products.set(productData.id, productData);
        this.suppliers.set(this.currentSupplier, supplier);
        
        this.renderSupplierDetails();
        this.persistData();
        
        document.getElementById('productModal').style.display = 'none';
        
        this.notifyObservers(isEdit ? 'product_updated' : 'product_created', { 
            supplierId: this.currentSupplier, 
            product: productData 
        });
        
        console.log(`${isEdit ? '✏️ Producto actualizado' : '➕ Nuevo producto creado'}: ${productData.name}`);
    }

    editProduct(supplierId, productId) {
        this.currentSupplier = supplierId;
        this.showProductModal(productId);
    }

    deleteProduct(supplierId, productId) {
        const supplier = this.suppliers.get(supplierId);
        if (!supplier || !supplier.products) return;
        
        const product = supplier.products.get(productId);
        if (!product) return;
        
        if (confirm(`¿Está seguro de eliminar "${product.name}"?`)) {
            supplier.products.delete(productId);
            this.suppliers.set(supplierId, supplier);
            
            this.renderSupplierDetails();
            this.persistData();
            
            this.notifyObservers('product_deleted', { supplierId, productId, product });
            console.log(`🗑️ Producto eliminado: ${product.name}`);
        }
    }

    // =================================================================
    // FUNCIONES DE UTILIDAD
    // =================================================================

    generateSupplierId() {
        return 'supplier_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateProductId() {
        return 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('es-MX');
    }

    getNextTier(currentTier) {
        const tiers = Object.keys(SUPPLIER_CONFIG.discountTiers);
        const currentIndex = tiers.indexOf(currentTier);
        return currentIndex < tiers.length - 1 ? 
            SUPPLIER_CONFIG.discountTiers[tiers[currentIndex + 1]].name : 
            'Nivel máximo';
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    updateSupplierStats() {
        const statsContainer = document.getElementById('supplierStats');
        if (!statsContainer) return;

        const totalSuppliers = this.suppliers.size;
        const totalProducts = Array.from(this.suppliers.values()).reduce((total, supplier) => 
            total + (supplier.products?.size || 0), 0
        );
        const totalValue = Array.from(this.suppliers.values()).reduce((total, supplier) => 
            total + (supplier.totalOrdered || 0), 0
        );

        // Count by type
        const typeStats = {};
        this.suppliers.forEach(supplier => {
            typeStats[supplier.type] = (typeStats[supplier.type] || 0) + 1;
        });

        // Count by tier
        const tierStats = {};
        this.suppliers.forEach(supplier => {
            tierStats[supplier.currentTier] = (tierStats[supplier.currentTier] || 0) + 1;
        });

        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${totalSuppliers}</span>
                <span class="stat-label">Proveedores</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${totalProducts}</span>
                <span class="stat-label">Productos</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">$${totalValue.toLocaleString('es-MX')}</span>
                <span class="stat-label">Valor Total</span>
            </div>
        `;
    }

    calculateProductPrice() {
        const productSelect = document.getElementById('priceCalcProduct');
        const quantityInput = document.getElementById('priceCalcQuantity');
        const tierSelect = document.getElementById('priceCalcTier');
        const resultDiv = document.getElementById('priceCalcResult');
        
        const productId = productSelect.value;
        const quantity = parseFloat(quantityInput.value) || 1;
        const tierKey = tierSelect.value;
        
        if (!productId || !this.currentSupplier) {
            alert('Seleccione un producto');
            return;
        }
        
        const supplier = this.suppliers.get(this.currentSupplier);
        const product = supplier.products?.get(productId);
        const tier = SUPPLIER_CONFIG.discountTiers[tierKey];
        
        if (!product || !tier) return;
        
        const basePrice = product.basePrice;
        const discountedPrice = basePrice * (1 - tier.discount / 100);
        const subtotal = discountedPrice * quantity;
        const shipping = quantity * discountedPrice >= supplier.minimumOrder ? 0 : supplier.shippingCost;
        const total = subtotal + shipping;
        
        resultDiv.innerHTML = `
            <h5>💰 Resultado del Cálculo</h5>
            <div class="calc-breakdown">
                <div class="calc-row">
                    <span>Precio base:</span>
                    <span>$${basePrice.toLocaleString('es-MX')} × ${quantity}</span>
                    <span>$${(basePrice * quantity).toLocaleString('es-MX')}</span>
                </div>
                <div class="calc-row discount">
                    <span>Descuento ${tier.name}:</span>
                    <span>${tier.discount}%</span>
                    <span>-$${((basePrice * quantity) - subtotal).toLocaleString('es-MX')}</span>
                </div>
                <div class="calc-row">
                    <span>Subtotal:</span>
                    <span></span>
                    <span>$${subtotal.toLocaleString('es-MX')}</span>
                </div>
                <div class="calc-row ${shipping > 0 ? '' : 'free-shipping'}">
                    <span>Envío:</span>
                    <span>${shipping > 0 ? '' : 'GRATIS (pedido mínimo alcanzado)'}</span>
                    <span>$${shipping.toLocaleString('es-MX')}</span>
                </div>
                <div class="calc-row total">
                    <span><strong>Total:</strong></span>
                    <span></span>
                    <span><strong>$${total.toLocaleString('es-MX')}</strong></span>
                </div>
            </div>
        `;
        
        resultDiv.style.display = 'block';
    }

    // =================================================================
    // EXPORTACIÓN E IMPORTACIÓN
    // =================================================================

    exportSuppliers() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            suppliers: Object.fromEntries(
                Array.from(this.suppliers.entries()).map(([id, supplier]) => [
                    id, 
                    {
                        ...supplier,
                        products: Object.fromEntries(supplier.products || new Map())
                    }
                ])
            )
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supplier_pricing_tables_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Tablas de proveedores exportadas');
    }

    exportSupplierData(supplierId) {
        const supplier = this.suppliers.get(supplierId);
        if (!supplier) return;

        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            supplier: {
                ...supplier,
                products: Object.fromEntries(supplier.products || new Map())
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${supplier.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log(`📤 Datos de proveedor exportados: ${supplier.name}`);
    }

    // =================================================================
    // PERSISTENCIA Y OBSERVERS
    // =================================================================

    persistData() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                suppliers: Object.fromEntries(
                    Array.from(this.suppliers.entries()).map(([id, supplier]) => [
                        id, 
                        {
                            ...supplier,
                            products: Object.fromEntries(supplier.products || new Map())
                        }
                    ])
                ),
                currentSupplier: this.currentSupplier
            };

            localStorage.setItem(
                SUPPLIER_CONFIG.storage.prefix + 'data',
                JSON.stringify(data)
            );

        } catch (error) {
            console.error('Error persistiendo datos de proveedores:', error);
        }
    }

    loadPersistedData() {
        try {
            const stored = localStorage.getItem(SUPPLIER_CONFIG.storage.prefix + 'data');
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Verificar TTL
            const age = Date.now() - data.timestamp;
            if (age > SUPPLIER_CONFIG.storage.ttl) {
                console.log('🗂️ Datos de proveedores expirados, usando defaults');
                return;
            }

            // Restaurar datos
            if (data.suppliers) {
                this.suppliers = new Map(
                    Object.entries(data.suppliers).map(([id, supplier]) => [
                        id,
                        {
                            ...supplier,
                            products: new Map(Object.entries(supplier.products || {}))
                        }
                    ])
                );
            }
            
            if (data.currentSupplier) {
                this.currentSupplier = data.currentSupplier;
            }

            console.log('📂 Datos de proveedores restaurados');

        } catch (error) {
            console.error('Error cargando datos de proveedores:', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.persistData();
        }, SUPPLIER_CONFIG.storage.backupInterval);
    }

    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error en observer de supplier pricing:', error);
            }
        });
    }

    // =================================================================
    // MÉTODOS PÚBLICOS PARA INTEGRACIÓN
    // =================================================================

    getSupplierPrice(supplierId, productId, quantity = 1) {
        const supplier = this.suppliers.get(supplierId);
        if (!supplier) return null;

        const product = supplier.products?.get(productId);
        if (!product) return null;

        const tierInfo = SUPPLIER_CONFIG.discountTiers[supplier.currentTier];
        const discountedPrice = product.basePrice * (1 - tierInfo.discount / 100);
        const subtotal = discountedPrice * quantity;
        const shipping = subtotal >= supplier.minimumOrder ? 0 : supplier.shippingCost;

        return {
            basePrice: product.basePrice,
            discountedPrice: discountedPrice,
            quantity: quantity,
            subtotal: subtotal,
            shipping: shipping,
            total: subtotal + shipping,
            tier: tierInfo.name,
            discount: tierInfo.discount
        };
    }

    getBestPriceForProduct(productName, category = null) {
        const results = [];
        
        this.suppliers.forEach((supplier, supplierId) => {
            if (!supplier.products) return;
            
            supplier.products.forEach((product, productId) => {
                const isMatch = product.name.toLowerCase().includes(productName.toLowerCase()) ||
                               (category && product.category.toLowerCase() === category.toLowerCase());
                               
                if (isMatch) {
                    const priceInfo = this.getSupplierPrice(supplierId, productId, 1);
                    if (priceInfo) {
                        results.push({
                            supplier: supplier,
                            product: product,
                            pricing: priceInfo
                        });
                    }
                }
            });
        });
        
        // Ordenar por precio total ascendente
        results.sort((a, b) => a.pricing.total - b.pricing.total);
        
        return results;
    }

    getCurrentSupplierData() {
        return {
            suppliers: Object.fromEntries(
                Array.from(this.suppliers.entries()).map(([id, supplier]) => [
                    id, 
                    {
                        ...supplier,
                        products: Object.fromEntries(supplier.products || new Map())
                    }
                ])
            ),
            currentSupplier: this.currentSupplier,
            isInitialized: this.isInitialized
        };
    }

    destroy() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        this.observers = [];
        console.log('🔄 Sistema de tablas de proveedores destruido');
    }
}

// =================================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// =================================================================

// Crear instancia global
window.supplierPricing = new SupplierPricingTables();

// Integrar con otros sistemas
if (window.globalMarkupSettings) {
    window.globalMarkupSettings.addObserver((event, data) => {
        if (event === 'tier_changed' || event === 'pricing_updated') {
            // Actualizar cálculos cuando cambien los márgenes
            window.supplierPricing.notifyObservers('external_pricing_changed', data);
        }
    });
}

if (window.manualPricingOverride) {
    window.manualPricingOverride.addObserver((event, data) => {
        if (event === 'override_value_changed') {
            // Actualizar precios cuando cambien los overrides
            window.supplierPricing.notifyObservers('external_override_changed', data);
        }
    });
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupplierPricingTables;
}

console.log('✅ Sistema de Tablas de Precios por Proveedor v1.0 cargado correctamente');
console.log('🏪 Gestionar proveedores: window.supplierPricing.setupUI()');
console.log('💰 Obtener precio: window.supplierPricing.getSupplierPrice(supplierId, productId, quantity)');
console.log('🔍 Comparar precios: window.supplierPricing.getBestPriceForProduct(productName)');