// smart-dropdown.js - Interfaz de Dropdown Inteligente para Auto-Complete
// Desarrollado con Claude Code AI - Fase 3 del Sistema Auto-Complete

/**
 * SmartDropdown - Interfaz de usuario para mostrar sugerencias de auto-complete
 * 
 * Características principales:
 * - Dropdown que aparece debajo del campo de entrada
 * - Navegación completa con teclado (↑↓ Enter Esc)
 * - Highlight visual del ítem seleccionado
 * - Click para seleccionar con mouse
 * - Posicionamiento inteligente (arriba si no hay espacio abajo)
 * - Estilo consistente con el diseño de ciaociao.mx
 * - Performance optimizada con debounce
 * - Responsive para móviles y tablets
 */

class SmartDropdown {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.fieldType = options.fieldType || 'text';
        this.context = options.context || {};
        
        // Configuración
        this.config = {
            minQueryLength: 2,
            debounceDelay: 200,
            maxSuggestions: 8,
            animationDuration: 200,
            cssClass: options.cssClass || 'smart-dropdown',
            placeholder: options.placeholder || 'Escribe para ver sugerencias...'
        };
        
        // Estado interno
        this.isVisible = false;
        this.selectedIndex = -1;
        this.suggestions = [];
        this.currentQuery = '';
        
        // Elementos DOM
        this.dropdownElement = null;
        this.listElement = null;
        
        // Timers y handlers
        this.debounceTimer = null;
        this.blurTimer = null;
        
        // Bind methods
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        
        this.initialize();
    }

    /**
     * Inicializar el dropdown
     */
    initialize() {
        try {
            // Verificar que el motor de auto-complete esté disponible
            if (!window.autoCompleteEngine) {
                console.warn('⚠️ AutoCompleteEngine no disponible, inicializando...');
                initializeAutoComplete().then(() => {
                    console.log('✅ AutoCompleteEngine listo para SmartDropdown');
                });
            }
            
            // Crear estructura DOM
            this.createDropdownStructure();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Marcar el input como mejorado
            this.input.classList.add('smart-input');
            this.input.setAttribute('autocomplete', 'off');
            this.input.setAttribute('data-smart-dropdown', 'true');
            
            console.log(`✅ SmartDropdown inicializado para ${this.fieldType}`);
            
        } catch (error) {
            console.error('❌ Error inicializando SmartDropdown:', error);
        }
    }

    /**
     * Crear estructura DOM del dropdown
     */
    createDropdownStructure() {
        // Contenedor principal del dropdown
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.className = `${this.config.cssClass} smart-dropdown-hidden`;
        this.dropdownElement.innerHTML = `
            <div class="smart-dropdown-header">
                <span class="dropdown-title">Sugerencias</span>
                <span class="dropdown-hint">↑↓ navegar, Enter seleccionar, Esc cerrar</span>
            </div>
            <ul class="smart-dropdown-list" role="listbox"></ul>
            <div class="smart-dropdown-footer">
                <span class="powered-by">Auto-complete inteligente</span>
            </div>
        `;
        
        // Lista de sugerencias
        this.listElement = this.dropdownElement.querySelector('.smart-dropdown-list');
        
        // Insertar después del input
        this.input.parentNode.insertBefore(this.dropdownElement, this.input.nextSibling);
        
        // Posicionar relativamente al input
        this.positionDropdown();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Input events
        this.input.addEventListener('input', this.handleInput);
        this.input.addEventListener('keydown', this.handleKeyDown);
        this.input.addEventListener('focus', this.handleFocus);
        this.input.addEventListener('blur', this.handleBlur);
        
        // Document events para cerrar dropdown al hacer click fuera
        document.addEventListener('click', this.handleDocumentClick);
        
        // Resize event para reposicionar
        window.addEventListener('resize', () => this.positionDropdown());
    }

    /**
     * Manejar entrada de texto
     */
    handleInput(event) {
        const query = event.target.value.trim();
        this.currentQuery = query;
        
        // Cancelar timer anterior
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Debounce para evitar demasiadas consultas
        this.debounceTimer = setTimeout(async () => {
            if (query.length >= this.config.minQueryLength) {
                await this.fetchSuggestions(query);
            } else {
                this.hideSuggestions();
            }
        }, this.config.debounceDelay);
        
        // Aprender de la entrada del usuario cuando pare de escribir
        if (query.length > 2) {
            setTimeout(() => {
                if (window.autoCompleteEngine && this.currentQuery === query) {
                    window.autoCompleteEngine.learnFromInput(this.fieldType, query, this.context);
                }
            }, 2000); // Aprender después de 2 segundos sin cambios
        }
    }

    /**
     * Manejar navegación con teclado
     */
    handleKeyDown(event) {
        if (!this.isVisible || this.suggestions.length === 0) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectNext();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectPrevious();
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.selectedIndex);
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideSuggestions();
                break;
                
            case 'Tab':
                // Permitir Tab normal, pero ocultar dropdown
                this.hideSuggestions();
                break;
        }
    }

    /**
     * Manejar focus del input
     */
    handleFocus(event) {
        // Si hay query y sugerencias, mostrar dropdown
        if (this.currentQuery.length >= this.config.minQueryLength && this.suggestions.length > 0) {
            this.showSuggestions();
        }
    }

    /**
     * Manejar blur del input
     */
    handleBlur(event) {
        // Delay para permitir clicks en las sugerencias
        this.blurTimer = setTimeout(() => {
            this.hideSuggestions();
        }, 200);
    }

    /**
     * Manejar clicks en el documento
     */
    handleDocumentClick(event) {
        // Si el click no es en el input o dropdown, ocultar
        if (!this.input.contains(event.target) && !this.dropdownElement.contains(event.target)) {
            this.hideSuggestions();
        }
    }

    /**
     * Obtener sugerencias del motor de auto-complete
     */
    async fetchSuggestions(query) {
        try {
            if (!window.autoCompleteEngine) {
                console.warn('⚠️ AutoCompleteEngine no disponible');
                return;
            }
            
            const suggestions = await window.autoCompleteEngine.getSuggestions(
                this.fieldType, 
                query, 
                this.context
            );
            
            this.suggestions = suggestions;
            this.selectedIndex = -1;
            
            if (suggestions.length > 0) {
                this.renderSuggestions();
                this.showSuggestions();
            } else {
                this.hideSuggestions();
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo sugerencias:', error);
            this.hideSuggestions();
        }
    }

    /**
     * Renderizar sugerencias en el DOM
     */
    renderSuggestions() {
        // Limpiar lista actual
        this.listElement.innerHTML = '';
        
        // Crear elementos de sugerencias
        this.suggestions.forEach((suggestion, index) => {
            const li = document.createElement('li');
            li.className = 'smart-dropdown-item';
            li.setAttribute('role', 'option');
            li.setAttribute('data-index', index);
            
            // Resaltar texto que coincide con la query
            const highlightedText = this.highlightMatch(suggestion.value, this.currentQuery);
            
            li.innerHTML = `
                <div class="suggestion-content">
                    <span class="suggestion-text">${highlightedText}</span>
                    <div class="suggestion-meta">
                        <span class="frequency">Usado ${suggestion.frequency} veces</span>
                        <span class="score">${suggestion.score}% relevancia</span>
                    </div>
                </div>
            `;
            
            // Event listener para click
            li.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectSuggestion(index);
            });
            
            // Event listener para hover
            li.addEventListener('mouseenter', () => {
                this.setSelectedIndex(index);
            });
            
            this.listElement.appendChild(li);
        });
        
        // Mensaje si no hay sugerencias pero hay texto
        if (this.suggestions.length === 0 && this.currentQuery.length >= this.config.minQueryLength) {
            const li = document.createElement('li');
            li.className = 'smart-dropdown-item no-suggestions';
            li.innerHTML = `
                <div class="suggestion-content">
                    <span class="suggestion-text">No hay sugerencias para "${this.currentQuery}"</span>
                    <span class="suggestion-meta">Se agregará a las sugerencias futuras</span>
                </div>
            `;
            this.listElement.appendChild(li);
        }
    }

    /**
     * Resaltar coincidencias en el texto
     */
    highlightMatch(text, query) {
        if (!query) return text;
        
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        
        return `${before}<mark class="highlight">${match}</mark>${after}`;
    }

    /**
     * Mostrar dropdown de sugerencias
     */
    showSuggestions() {
        if (this.isVisible) return;
        
        // Cancelar timer de blur
        if (this.blurTimer) {
            clearTimeout(this.blurTimer);
            this.blurTimer = null;
        }
        
        // Posicionar correctamente
        this.positionDropdown();
        
        // Mostrar con animación
        this.dropdownElement.classList.remove('smart-dropdown-hidden');
        this.dropdownElement.classList.add('smart-dropdown-visible');
        
        this.isVisible = true;
        
        // Accesibilidad
        this.input.setAttribute('aria-expanded', 'true');
        this.dropdownElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Ocultar dropdown de sugerencias
     */
    hideSuggestions() {
        if (!this.isVisible) return;
        
        // Ocultar con animación
        this.dropdownElement.classList.remove('smart-dropdown-visible');
        this.dropdownElement.classList.add('smart-dropdown-hidden');
        
        this.isVisible = false;
        this.selectedIndex = -1;
        
        // Limpiar selección visual
        this.clearSelection();
        
        // Accesibilidad
        this.input.setAttribute('aria-expanded', 'false');
        this.dropdownElement.setAttribute('aria-hidden', 'true');
    }

    /**
     * Seleccionar siguiente sugerencia
     */
    selectNext() {
        const nextIndex = this.selectedIndex + 1;
        if (nextIndex < this.suggestions.length) {
            this.setSelectedIndex(nextIndex);
        }
    }

    /**
     * Seleccionar sugerencia anterior
     */
    selectPrevious() {
        const prevIndex = this.selectedIndex - 1;
        if (prevIndex >= -1) {
            this.setSelectedIndex(prevIndex);
        }
    }

    /**
     * Establecer índice seleccionado
     */
    setSelectedIndex(index) {
        // Limpiar selección anterior
        this.clearSelection();
        
        this.selectedIndex = index;
        
        // Resaltar nueva selección
        if (index >= 0 && index < this.suggestions.length) {
            const items = this.listElement.querySelectorAll('.smart-dropdown-item');
            if (items[index]) {
                items[index].classList.add('selected');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }
    }

    /**
     * Limpiar selección visual
     */
    clearSelection() {
        const selectedItems = this.listElement.querySelectorAll('.smart-dropdown-item.selected');
        selectedItems.forEach(item => item.classList.remove('selected'));
    }

    /**
     * Seleccionar una sugerencia
     */
    selectSuggestion(index) {
        if (index < 0 || index >= this.suggestions.length) {
            return;
        }
        
        const suggestion = this.suggestions[index];
        
        // Establecer valor en el input
        this.input.value = suggestion.value;
        
        // Trigger change event para que otros scripts lo detecten
        const changeEvent = new Event('change', { bubbles: true });
        this.input.dispatchEvent(changeEvent);
        
        // Trigger input event para consistencia
        const inputEvent = new Event('input', { bubbles: true });
        this.input.dispatchEvent(inputEvent);
        
        // Ocultar dropdown
        this.hideSuggestions();
        
        // Focus al siguiente campo si es posible
        this.focusNextField();
        
        console.log(`✅ Sugerencia seleccionada: ${suggestion.value}`);
    }

    /**
     * Enfocar el siguiente campo del formulario
     */
    focusNextField() {
        const form = this.input.closest('form');
        if (!form) return;
        
        const formElements = Array.from(form.querySelectorAll(
            'input, select, textarea'
        )).filter(el => !el.disabled && !el.readonly);
        
        const currentIndex = formElements.indexOf(this.input);
        if (currentIndex >= 0 && currentIndex < formElements.length - 1) {
            setTimeout(() => {
                formElements[currentIndex + 1].focus();
            }, 100);
        }
    }

    /**
     * Posicionar dropdown relativamente al input
     */
    positionDropdown() {
        if (!this.dropdownElement) return;
        
        const inputRect = this.input.getBoundingClientRect();
        const dropdownRect = this.dropdownElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Reset positioning
        this.dropdownElement.style.position = 'absolute';
        this.dropdownElement.style.left = '0';
        this.dropdownElement.style.width = `${inputRect.width}px`;
        this.dropdownElement.style.minWidth = '250px';
        this.dropdownElement.style.maxWidth = '400px';
        this.dropdownElement.style.zIndex = '1000';
        
        // Determinar si mostrar arriba o abajo
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        const dropdownHeight = 300; // Altura estimada
        
        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            // Mostrar debajo del input
            this.dropdownElement.style.top = `${inputRect.height + 2}px`;
            this.dropdownElement.classList.remove('dropdown-above');
        } else {
            // Mostrar arriba del input
            this.dropdownElement.style.top = `-${dropdownHeight + 2}px`;
            this.dropdownElement.classList.add('dropdown-above');
        }
    }

    /**
     * Actualizar contexto del dropdown
     */
    updateContext(newContext) {
        this.context = { ...this.context, ...newContext };
    }

    /**
     * Destruir el dropdown y limpiar event listeners
     */
    destroy() {
        try {
            // Limpiar event listeners
            this.input.removeEventListener('input', this.handleInput);
            this.input.removeEventListener('keydown', this.handleKeyDown);
            this.input.removeEventListener('focus', this.handleFocus);
            this.input.removeEventListener('blur', this.handleBlur);
            document.removeEventListener('click', this.handleDocumentClick);
            
            // Limpiar timers
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            if (this.blurTimer) {
                clearTimeout(this.blurTimer);
            }
            
            // Remover elementos DOM
            if (this.dropdownElement && this.dropdownElement.parentNode) {
                this.dropdownElement.parentNode.removeChild(this.dropdownElement);
            }
            
            // Limpiar clases del input
            this.input.classList.remove('smart-input');
            this.input.removeAttribute('data-smart-dropdown');
            
            console.log('✅ SmartDropdown destruido');
            
        } catch (error) {
            console.error('❌ Error destruyendo SmartDropdown:', error);
        }
    }

    /**
     * Obtener estadísticas del dropdown
     */
    getStats() {
        return {
            fieldType: this.fieldType,
            isVisible: this.isVisible,
            suggestionsCount: this.suggestions.length,
            selectedIndex: this.selectedIndex,
            currentQuery: this.currentQuery
        };
    }
}

/**
 * Factory para crear SmartDropdowns automáticamente
 */
class SmartDropdownFactory {
    constructor() {
        this.instances = new Map();
        this.defaultMappings = {
            // Cliente
            'clientName': { fieldType: 'clientName', placeholder: 'Nombre del cliente...' },
            'clientPhone': { fieldType: 'clientPhone', placeholder: 'Teléfono...' },
            'clientEmail': { fieldType: 'clientEmail', placeholder: 'Email...' },
            
            // Pieza
            'pieceType': { fieldType: 'pieceType', placeholder: 'Tipo de joya...' },
            'material': { fieldType: 'material', placeholder: 'Material...' },
            'description': { fieldType: 'description', placeholder: 'Descripción...' },
            'stones': { fieldType: 'stones', placeholder: 'Piedras preciosas...' },
            'size': { fieldType: 'size', placeholder: 'Talla/tamaño...' },
            'location': { fieldType: 'location', placeholder: 'Ubicación...' }
        };
    }

    /**
     * Inicializar dropdowns para todos los campos compatibles
     */
    initializeForForm(formElement) {
        const inputs = formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        
        inputs.forEach(input => {
            const fieldId = input.id;
            const mapping = this.defaultMappings[fieldId];
            
            if (mapping && !input.hasAttribute('data-smart-dropdown')) {
                this.createDropdown(input, mapping);
            }
        });
        
        console.log(`✅ SmartDropdowns inicializados para ${this.instances.size} campos`);
    }

    /**
     * Crear dropdown para un input específico
     */
    createDropdown(input, options = {}) {
        try {
            // Detectar tipo de campo por ID si no se especifica
            if (!options.fieldType && input.id) {
                const mapping = this.defaultMappings[input.id];
                if (mapping) {
                    options = { ...mapping, ...options };
                }
            }
            
            const dropdown = new SmartDropdown(input, options);
            this.instances.set(input, dropdown);
            
            return dropdown;
            
        } catch (error) {
            console.error('❌ Error creando SmartDropdown:', error);
            return null;
        }
    }

    /**
     * Obtener dropdown para un input
     */
    getDropdown(input) {
        return this.instances.get(input);
    }

    /**
     * Destruir dropdown específico
     */
    destroyDropdown(input) {
        const dropdown = this.instances.get(input);
        if (dropdown) {
            dropdown.destroy();
            this.instances.delete(input);
        }
    }

    /**
     * Destruir todos los dropdowns
     */
    destroyAll() {
        this.instances.forEach((dropdown, input) => {
            dropdown.destroy();
        });
        this.instances.clear();
    }

    /**
     * Actualizar contexto para todos los dropdowns
     */
    updateContext(context) {
        this.instances.forEach(dropdown => {
            dropdown.updateContext(context);
        });
    }

    /**
     * Obtener estadísticas de todos los dropdowns
     */
    getStats() {
        const stats = {
            totalDropdowns: this.instances.size,
            activeDropdowns: 0,
            visibleDropdowns: 0,
            fieldTypes: {}
        };
        
        this.instances.forEach(dropdown => {
            const dropdownStats = dropdown.getStats();
            stats.activeDropdowns++;
            
            if (dropdownStats.isVisible) {
                stats.visibleDropdowns++;
            }
            
            if (!stats.fieldTypes[dropdownStats.fieldType]) {
                stats.fieldTypes[dropdownStats.fieldType] = 0;
            }
            stats.fieldTypes[dropdownStats.fieldType]++;
        });
        
        return stats;
    }
}

// Instancia global del factory
window.SmartDropdown = SmartDropdown;
window.SmartDropdownFactory = SmartDropdownFactory;
window.smartDropdownFactory = new SmartDropdownFactory();

/**
 * Función de inicialización automática para formularios
 */
function initializeSmartDropdowns(formSelector = 'form') {
    try {
        const forms = document.querySelectorAll(formSelector);
        forms.forEach(form => {
            window.smartDropdownFactory.initializeForForm(form);
        });
        
        console.log(`✅ Auto-inicialización de SmartDropdowns completada para ${forms.length} formularios`);
        
    } catch (error) {
        console.error('❌ Error en auto-inicialización de SmartDropdowns:', error);
    }
}

// Auto-inicializar cuando el DOM esté listo (excepto en modo cotizaciones)
function autoInitializeSmartDropdowns() {
    // NO AUTO-INICIALIZAR EN MODO COTIZACIONES - evitar race conditions
    const quotationMode = document.querySelector('.quotation-mode');
    if (quotationMode) {
        console.log('⚠️ Modo cotizaciones detectado - smart-dropdown.js NO se auto-inicializa');
        console.log('📝 Para inicializar dropdowns en cotizaciones, usar initializeSmartDropdowns() manualmente');
        return;
    }
    
    // Delay para que otros scripts se inicialicen primero (solo en otros modos)
    setTimeout(initializeSmartDropdowns, 1000);
}

// ELIMINADO: Auto-inicialización con DOMContentLoaded
// La inicialización ahora es coordinada por initialization-coordinator.js
console.log('💡 Smart Dropdown cargado - inicialización coordinada');

console.log('✅ SmartDropdown cargado - Listo para auto-inicialización');