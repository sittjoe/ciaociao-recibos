/**
 * ENTERPRISE EVENT BUS - Usage Examples and Integration Demonstrations
 * 
 * This file demonstrates comprehensive usage of the Enterprise Event Bus
 * including integration with existing ciaociao.mx systems and advanced features.
 * 
 * EXAMPLES COVERED:
 * - Basic pub/sub patterns
 * - Advanced event routing and filtering
 * - Cross-window/cross-tab communication
 * - Event persistence and replay
 * - Request-response patterns
 * - Event sourcing and aggregation
 * - Circuit breaker patterns
 * - Dead letter queue handling
 * - Performance optimizations
 * - Security integrations
 * - Testing and mocking
 * - Microservice communication patterns
 * - Event-driven business workflows
 * - Real-time event streams
 * - Transaction management integration
 * 
 * VERSION: 1.0.0
 * INTEGRATION: Enterprise ciaociao.mx Architecture
 */

class EventBusExamples {
    constructor() {
        this.eventBus = null;
        this.exampleData = {
            users: new Map(),
            receipts: new Map(),
            transactions: new Map(),
            notifications: new Map()
        };
        
        this.setupExamples();
    }
    
    /**
     * Initialize and run all examples
     */
    async setupExamples() {
        // Wait for event bus to be ready
        await this.waitForEventBus();
        
        console.log('🎯 Starting Enterprise Event Bus Examples...\n');
        
        // Run examples in sequence
        await this.basicPubSubExamples();
        await this.advancedRoutingExamples();
        await this.crossWindowCommunicationExamples();
        await this.eventPersistenceExamples();
        await this.requestResponseExamples();
        await this.eventSourcingExamples();
        await this.circuitBreakerExamples();
        await this.performanceOptimizationExamples();
        await this.securityIntegrationExamples();
        await this.microserviceCommunicationExamples();
        await this.businessWorkflowExamples();
        await this.realTimeStreamExamples();
        await this.testingAndMockingExamples();
        
        console.log('\n✅ All Enterprise Event Bus examples completed successfully!');
    }
    
    /**
     * Wait for event bus to be initialized
     */
    async waitForEventBus() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.enterpriseEventBus?.isInitialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.enterpriseEventBus?.isInitialized) {
            throw new Error('Event Bus not available or not initialized');
        }
        
        this.eventBus = window.enterpriseEventBus;
        console.log('✅ Event Bus ready for examples');
    }
    
    /**
     * EXAMPLE 1: Basic Pub/Sub Patterns
     */
    async basicPubSubExamples() {
        console.log('📘 Example 1: Basic Pub/Sub Patterns\n');
        
        // Simple event subscription
        const unsubscribe1 = this.eventBus.subscribe('user.created', (event) => {
            console.log('👤 User created:', event.data.name);
            this.exampleData.users.set(event.data.id, event.data);
        });
        
        // Event with options
        const unsubscribe2 = this.eventBus.subscribe('user.updated', (event) => {
            console.log('👤 User updated:', event.data.name);
            this.exampleData.users.set(event.data.id, event.data);
        }, {
            priority: 1, // High priority
            filter: (event) => event.data.active === true, // Only active users
            once: false // Can be called multiple times
        });
        
        // Wildcard subscription
        const unsubscribe3 = this.eventBus.subscribe('user.*', (event) => {
            console.log('👥 Any user event:', event.type);
        });
        
        // Emit events
        await this.eventBus.emit('user.created', {
            id: 'user_1',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            active: true
        });
        
        await this.eventBus.emit('user.updated', {
            id: 'user_1',
            name: 'Juan Pérez García',
            email: 'juan@example.com',
            active: true
        });
        
        await this.eventBus.emit('user.deleted', {
            id: 'user_1'
        });
        
        // Cleanup subscriptions
        setTimeout(() => {
            unsubscribe1();
            unsubscribe2();
            unsubscribe3();
        }, 1000);
        
        console.log('✅ Basic pub/sub examples completed\n');
    }
    
    /**
     * EXAMPLE 2: Advanced Event Routing and Filtering
     */
    async advancedRoutingExamples() {
        console.log('📘 Example 2: Advanced Event Routing and Filtering\n');
        
        // Complex filtering
        const premiumUserHandler = this.eventBus.subscribe('transaction.completed', (event) => {
            console.log('💎 Premium user transaction:', event.data.amount);
        }, {
            filter: (event) => {
                const user = this.exampleData.users.get(event.data.userId);
                return user && user.tier === 'premium' && event.data.amount > 1000;
            }
        });
        
        // Event transformation
        const transformedHandler = this.eventBus.subscribe('receipt.created', (event) => {
            console.log('🧾 Transformed receipt:', event.transformedData);
        }, {
            transform: (event) => {
                return {
                    ...event,
                    transformedData: {
                        ...event.data,
                        total: event.data.amount * 1.16, // Add IVA
                        currency: 'MXN'
                    }
                };
            }
        });
        
        // Priority-based processing
        const highPriorityHandler = this.eventBus.subscribe('alert.*', (event) => {
            console.log('🚨 High priority alert:', event.type);
        }, { priority: 1 });
        
        const normalPriorityHandler = this.eventBus.subscribe('alert.*', (event) => {
            console.log('📢 Normal priority alert:', event.type);
        }, { priority: 100 });
        
        // Emit test events
        this.exampleData.users.set('premium_user', { id: 'premium_user', tier: 'premium' });
        
        await this.eventBus.emit('transaction.completed', {
            userId: 'premium_user',
            amount: 1500,
            timestamp: Date.now()
        });
        
        await this.eventBus.emit('receipt.created', {
            id: 'receipt_1',
            amount: 1000,
            items: ['Item 1', 'Item 2']
        });
        
        await this.eventBus.emit('alert.security', {
            message: 'Security incident detected',
            severity: 'high'
        });
        
        console.log('✅ Advanced routing examples completed\n');
    }
    
    /**
     * EXAMPLE 3: Cross-Window Communication
     */
    async crossWindowCommunicationExamples() {
        console.log('📘 Example 3: Cross-Window Communication\n');
        
        // Listen for cross-window events
        const crossWindowHandler = this.eventBus.subscribe('cross.window.test', (event) => {
            console.log('📡 Cross-window event received:', event.data);
        });
        
        // Emit event that will be broadcast to other windows
        await this.eventBus.emit('cross.window.test', {
            message: 'Hello from another window!',
            timestamp: Date.now(),
            windowId: Math.random().toString(36).substr(2, 9)
        }, {
            crossWindow: true // Explicitly enable cross-window broadcast
        });
        
        // Simulate receiving event from another window
        setTimeout(() => {
            if (this.eventBus.crossWindowChannel) {
                const mockEvent = {
                    type: 'event',
                    data: JSON.stringify({
                        id: 'mock_cross_window_event',
                        type: 'cross.window.test',
                        timestamp: Date.now(),
                        data: {
                            message: 'Simulated event from another window',
                            source: 'mock'
                        },
                        metadata: {
                            source: 'cross-window'
                        }
                    })
                };
                
                this.eventBus.handleCrossWindowEvent(mockEvent);
            }
        }, 500);
        
        console.log('✅ Cross-window communication examples completed\n');
    }
    
    /**
     * EXAMPLE 4: Event Persistence and Replay
     */
    async eventPersistenceExamples() {
        console.log('📘 Example 4: Event Persistence and Replay\n');
        
        // Events are automatically persisted, let's emit some events
        await this.eventBus.emit('order.created', {
            orderId: 'order_1',
            customerId: 'customer_1',
            items: [
                { id: 'item_1', quantity: 2, price: 100 },
                { id: 'item_2', quantity: 1, price: 200 }
            ],
            total: 400
        });
        
        await this.eventBus.emit('order.confirmed', {
            orderId: 'order_1',
            confirmationTime: Date.now()
        });
        
        await this.eventBus.emit('order.shipped', {
            orderId: 'order_1',
            trackingNumber: 'TRACK123',
            shippingTime: Date.now()
        });
        
        // Wait a moment for events to be stored
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Query stored events
        if (this.eventBus.eventStore) {
            const orderEvents = await this.eventBus.eventStore.query({
                type: 'order.created'
            });
            
            console.log('📦 Stored order events:', orderEvents.length);
            
            // Replay events (this would re-process them)
            if (orderEvents.length > 0) {
                console.log('🔄 Replaying events...');
                const replayedEvents = await this.eventBus.replayEvents({
                    type: 'order'
                }, { skipProcessing: true }); // Skip processing for demo
                
                console.log('✅ Replayed events:', replayedEvents.length);
            }
        }
        
        console.log('✅ Event persistence examples completed\n');
    }
    
    /**
     * EXAMPLE 5: Request-Response Patterns
     */
    async requestResponseExamples() {
        console.log('📘 Example 5: Request-Response Patterns\n');
        
        // Setup response handler
        const responseHandler = this.eventBus.subscribe('user.lookup.response', (event) => {
            // This would normally be handled by the request() method
            console.log('👤 User lookup response received');
        });
        
        // Simulate a service that responds to lookup requests
        const lookupServiceHandler = this.eventBus.subscribe('user.lookup', async (event) => {
            console.log('🔍 Processing user lookup request:', event.data.userId);
            
            // Simulate database lookup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const userData = this.exampleData.users.get(event.data.userId) || {
                id: event.data.userId,
                name: 'Unknown User',
                found: false
            };
            
            // Send response
            await this.eventBus.emit('user.lookup.response', {
                ...userData,
                found: this.exampleData.users.has(event.data.userId)
            }, {
                correlationId: event.metadata.correlationId
            });
        });
        
        // Make request-response calls
        try {
            this.exampleData.users.set('test_user', {
                id: 'test_user',
                name: 'Test User',
                email: 'test@example.com'
            });
            
            // This demonstrates the pattern, but actual implementation
            // would need the full request() method to work properly
            await this.eventBus.emit('user.lookup', { userId: 'test_user' });
            await this.eventBus.emit('user.lookup', { userId: 'nonexistent_user' });
            
            console.log('✅ Request-response pattern demonstrated');
            
        } catch (error) {
            console.log('⚠️ Request-response pattern demo (actual timeout expected)');
        }
        
        console.log('✅ Request-response examples completed\n');
    }
    
    /**
     * EXAMPLE 6: Event Sourcing and Aggregation
     */
    async eventSourcingExamples() {
        console.log('📘 Example 6: Event Sourcing and Aggregation\n');
        
        // Emit a series of events for event sourcing
        const accountEvents = [
            { type: 'account.created', data: { accountId: 'acc_1', balance: 0 } },
            { type: 'account.deposited', data: { accountId: 'acc_1', amount: 1000 } },
            { type: 'account.withdrew', data: { accountId: 'acc_1', amount: 200 } },
            { type: 'account.deposited', data: { accountId: 'acc_1', amount: 500 } },
            { type: 'account.withdrew', data: { accountId: 'acc_1', amount: 100 } }
        ];
        
        for (const event of accountEvents) {
            await this.eventBus.emit(event.type, event.data);
        }
        
        // Demonstrate event aggregation (if available)
        if (this.eventBus.eventStore && this.eventBus.aggregateEvents) {
            const events = await this.eventBus.eventStore.query({});
            
            // Count aggregation
            const eventCount = await this.eventBus.aggregateEvents('count', events);
            console.log('📊 Total events:', eventCount);
            
            // Group aggregation by type
            const eventsByType = await this.eventBus.aggregateEvents('group', events, {
                field: 'type'
            });
            console.log('📊 Events by type:', Object.keys(eventsByType).map(type => 
                `${type}: ${eventsByType[type].length}`
            ).join(', '));
        }
        
        // Calculate account balance from events
        let balance = 0;
        for (const event of accountEvents) {
            switch (event.type) {
                case 'account.created':
                    balance = event.data.balance;
                    break;
                case 'account.deposited':
                    balance += event.data.amount;
                    break;
                case 'account.withdrew':
                    balance -= event.data.amount;
                    break;
            }
        }
        
        console.log('💰 Final account balance from event sourcing:', balance);
        console.log('✅ Event sourcing examples completed\n');
    }
    
    /**
     * EXAMPLE 7: Circuit Breaker Patterns
     */
    async circuitBreakerExamples() {
        console.log('📘 Example 7: Circuit Breaker Patterns\n');
        
        let failureCount = 0;
        
        // Setup a handler that fails multiple times
        const unreliableHandler = this.eventBus.subscribe('service.call', async (event) => {
            failureCount++;
            
            if (failureCount <= 3) {
                console.log(`⚡ Service call failed (attempt ${failureCount})`);
                throw new Error('Service temporarily unavailable');
            } else {
                console.log('✅ Service call succeeded');
                return { success: true };
            }
        }, {
            circuitBreaker: true, // Enable circuit breaker
            retryPolicy: {
                maxRetries: 2,
                baseDelay: 100,
                backoffMultiplier: 2
            }
        });
        
        // Make several calls to trigger circuit breaker
        for (let i = 1; i <= 6; i++) {
            try {
                console.log(`📞 Making service call ${i}`);
                await this.eventBus.emit('service.call', { callId: i });
                await new Promise(resolve => setTimeout(resolve, 200)); // Wait between calls
            } catch (error) {
                console.log(`❌ Service call ${i} failed:`, error.message);
            }
        }
        
        console.log('✅ Circuit breaker examples completed\n');
    }
    
    /**
     * EXAMPLE 8: Performance Optimization Features
     */
    async performanceOptimizationExamples() {
        console.log('📘 Example 8: Performance Optimization Features\n');
        
        // Throttled event handler
        let throttleCount = 0;
        const throttledHandler = this.eventBus.subscribe('high.frequency.event', (event) => {
            throttleCount++;
            console.log(`⏱️ Throttled event processed (${throttleCount}): ${event.data.value}`);
        }, {
            throttle: 200 // Only process once every 200ms
        });
        
        // Debounced event handler
        let debounceCount = 0;
        const debouncedHandler = this.eventBus.subscribe('user.input', (event) => {
            debounceCount++;
            console.log(`⏳ Debounced event processed (${debounceCount}): ${event.data.input}`);
        }, {
            debounce: 300 // Wait 300ms after last event
        });
        
        // Emit high-frequency events
        console.log('📈 Emitting high-frequency events...');
        for (let i = 1; i <= 10; i++) {
            await this.eventBus.emit('high.frequency.event', { value: i });
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms intervals
        }
        
        // Emit rapid input events
        console.log('⌨️ Emitting rapid input events...');
        const inputs = ['a', 'ab', 'abc', 'abcd', 'abcde'];
        for (const input of inputs) {
            await this.eventBus.emit('user.input', { input });
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms intervals
        }
        
        // Wait for debounced events to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Batch processing demonstration
        console.log('📦 Demonstrating batch processing...');
        for (let i = 1; i <= 150; i++) { // Exceed batch size
            await this.eventBus.emit('batch.test.event', { id: i });
        }
        
        console.log('✅ Performance optimization examples completed\n');
    }
    
    /**
     * EXAMPLE 9: Security Integration Examples
     */
    async securityIntegrationExamples() {
        console.log('📘 Example 9: Security Integration Examples\n');
        
        // Setup security-sensitive event handlers
        const securityHandler = this.eventBus.subscribe('auth.*', (event) => {
            console.log('🔐 Security event processed:', event.type);
        });
        
        const auditHandler = this.eventBus.subscribe('audit.*', (event) => {
            console.log('📋 Audit event processed:', event.type);
        });
        
        // Emit security events (these will be encrypted and audited)
        await this.eventBus.emit('auth.login', {
            userId: 'user_123',
            sessionId: 'sess_456',
            timestamp: Date.now(),
            ipAddress: '192.168.1.100'
        }, {
            tags: ['security', 'authentication'],
            userId: 'user_123'
        });
        
        await this.eventBus.emit('auth.logout', {
            userId: 'user_123',
            sessionId: 'sess_456',
            timestamp: Date.now()
        });
        
        await this.eventBus.emit('audit.data.access', {
            userId: 'user_123',
            resource: '/api/receipts',
            action: 'read',
            timestamp: Date.now()
        });
        
        // Demonstrate XSS protection integration
        await this.eventBus.emit('user.comment', {
            userId: 'user_123',
            comment: '<script>alert("xss")</script>This is a comment', // Will be sanitized
            timestamp: Date.now()
        });
        
        console.log('✅ Security integration examples completed\n');
    }
    
    /**
     * EXAMPLE 10: Microservice Communication Patterns
     */
    async microserviceCommunicationExamples() {
        console.log('📘 Example 10: Microservice Communication Patterns\n');
        
        // Service discovery pattern
        const serviceRegistry = new Map();
        
        // Register services
        this.eventBus.subscribe('service.register', (event) => {
            serviceRegistry.set(event.data.serviceName, event.data);
            console.log('🏗️ Service registered:', event.data.serviceName);
        });
        
        // Service communication
        this.eventBus.subscribe('order.service.process', async (event) => {
            console.log('📦 Order service processing:', event.data.orderId);
            
            // Communicate with payment service
            await this.eventBus.emit('payment.service.charge', {
                orderId: event.data.orderId,
                amount: event.data.amount,
                paymentMethod: event.data.paymentMethod
            });
        });
        
        this.eventBus.subscribe('payment.service.charge', async (event) => {
            console.log('💳 Payment service processing:', event.data.orderId);
            
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Notify inventory service
            await this.eventBus.emit('inventory.service.reserve', {
                orderId: event.data.orderId,
                items: ['item1', 'item2']
            });
            
            // Send confirmation
            await this.eventBus.emit('payment.completed', {
                orderId: event.data.orderId,
                status: 'success',
                transactionId: 'tx_' + Date.now()
            });
        });
        
        this.eventBus.subscribe('inventory.service.reserve', (event) => {
            console.log('📦 Inventory service reserving:', event.data.items);
            
            // Confirm reservation
            this.eventBus.emit('inventory.reserved', {
                orderId: event.data.orderId,
                items: event.data.items,
                status: 'reserved'
            });
        });
        
        // Register services
        await this.eventBus.emit('service.register', {
            serviceName: 'order-service',
            version: '1.0.0',
            endpoints: ['order.service.process']
        });
        
        await this.eventBus.emit('service.register', {
            serviceName: 'payment-service',
            version: '1.0.0',
            endpoints: ['payment.service.charge']
        });
        
        await this.eventBus.emit('service.register', {
            serviceName: 'inventory-service',
            version: '1.0.0',
            endpoints: ['inventory.service.reserve']
        });
        
        // Simulate order processing
        await this.eventBus.emit('order.service.process', {
            orderId: 'order_123',
            amount: 299.99,
            paymentMethod: 'credit_card',
            items: ['item1', 'item2']
        });
        
        console.log('✅ Microservice communication examples completed\n');
    }
    
    /**
     * EXAMPLE 11: Business Workflow Examples
     */
    async businessWorkflowExamples() {
        console.log('📘 Example 11: Business Workflow Examples\n');
        
        // Receipt processing workflow
        const receiptWorkflow = {
            states: new Map(),
            
            setState: function(receiptId, state) {
                this.states.set(receiptId, state);
                console.log(`📄 Receipt ${receiptId} state: ${state}`);
            },
            
            getState: function(receiptId) {
                return this.states.get(receiptId) || 'unknown';
            }
        };
        
        // Workflow step handlers
        this.eventBus.subscribe('receipt.uploaded', async (event) => {
            const receiptId = event.data.receiptId;
            receiptWorkflow.setState(receiptId, 'processing');
            
            // Trigger OCR processing
            await this.eventBus.emit('receipt.ocr.start', {
                receiptId,
                imageData: event.data.imageData
            });
        });
        
        this.eventBus.subscribe('receipt.ocr.start', async (event) => {
            const receiptId = event.data.receiptId;
            receiptWorkflow.setState(receiptId, 'ocr_processing');
            
            // Simulate OCR processing
            await new Promise(resolve => setTimeout(resolve, 200));
            
            await this.eventBus.emit('receipt.ocr.completed', {
                receiptId,
                extractedData: {
                    merchant: 'OXXO',
                    total: 125.50,
                    date: '2024-01-15',
                    items: [
                        { name: 'Coca Cola', price: 25.00 },
                        { name: 'Sabritas', price: 35.00 },
                        { name: 'Agua', price: 15.00 }
                    ]
                }
            });
        });
        
        this.eventBus.subscribe('receipt.ocr.completed', async (event) => {
            const receiptId = event.data.receiptId;
            receiptWorkflow.setState(receiptId, 'validating');
            
            // Validate extracted data
            await this.eventBus.emit('receipt.validation.start', {
                receiptId,
                data: event.data.extractedData
            });
        });
        
        this.eventBus.subscribe('receipt.validation.start', async (event) => {
            const receiptId = event.data.receiptId;
            
            // Simulate validation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const isValid = Math.random() > 0.2; // 80% success rate
            
            if (isValid) {
                await this.eventBus.emit('receipt.validation.passed', {
                    receiptId,
                    data: event.data.data
                });
            } else {
                await this.eventBus.emit('receipt.validation.failed', {
                    receiptId,
                    errors: ['Invalid total amount', 'Missing merchant info']
                });
            }
        });
        
        this.eventBus.subscribe('receipt.validation.passed', async (event) => {
            const receiptId = event.data.receiptId;
            receiptWorkflow.setState(receiptId, 'completed');
            
            // Store receipt data
            this.exampleData.receipts.set(receiptId, {
                id: receiptId,
                status: 'completed',
                data: event.data.data,
                processedAt: Date.now()
            });
            
            await this.eventBus.emit('receipt.processed', {
                receiptId,
                status: 'success'
            });
        });
        
        this.eventBus.subscribe('receipt.validation.failed', async (event) => {
            const receiptId = event.data.receiptId;
            receiptWorkflow.setState(receiptId, 'failed');
            
            await this.eventBus.emit('receipt.processed', {
                receiptId,
                status: 'failed',
                errors: event.data.errors
            });
        });
        
        // Start workflow
        await this.eventBus.emit('receipt.uploaded', {
            receiptId: 'receipt_001',
            imageData: 'base64_image_data_here',
            userId: 'user_123'
        });
        
        await this.eventBus.emit('receipt.uploaded', {
            receiptId: 'receipt_002',
            imageData: 'base64_image_data_here',
            userId: 'user_123'
        });
        
        // Wait for workflows to complete
        await new Promise(resolve => setTimeout(resolve, 600));
        
        console.log('📊 Workflow Results:');
        console.log('- Processed receipts:', this.exampleData.receipts.size);
        for (const [id, receipt] of this.exampleData.receipts) {
            console.log(`  - ${id}: ${receipt.status}`);
        }
        
        console.log('✅ Business workflow examples completed\n');
    }
    
    /**
     * EXAMPLE 12: Real-Time Event Streams
     */
    async realTimeStreamExamples() {
        console.log('📘 Example 12: Real-Time Event Streams\n');
        
        // Create event stream for real-time notifications
        if (this.eventBus.createEventStream) {
            const notificationStream = this.eventBus.createEventStream('notification.*');
            
            const unsubscribeStream = notificationStream.onData((event) => {
                console.log('📢 Stream notification:', event.data.message);
            });
            
            // Emit stream events
            for (let i = 1; i <= 5; i++) {
                await this.eventBus.emit('notification.user.message', {
                    message: `Real-time message ${i}`,
                    userId: 'user_123',
                    timestamp: Date.now()
                });
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Close stream
            setTimeout(() => {
                notificationStream.close();
                console.log('📡 Event stream closed');
            }, 1000);
        }
        
        // Real-time dashboard updates
        const dashboardData = {
            totalOrders: 0,
            totalRevenue: 0,
            activeUsers: new Set()
        };
        
        this.eventBus.subscribe('dashboard.update', (event) => {
            console.log('📊 Dashboard update:', event.data);
        });
        
        this.eventBus.subscribe('order.*', (event) => {
            if (event.type === 'order.created') {
                dashboardData.totalOrders++;
                dashboardData.totalRevenue += event.data.total || 0;
            }
            
            if (event.data.userId) {
                dashboardData.activeUsers.add(event.data.userId);
            }
            
            // Push real-time update
            this.eventBus.emit('dashboard.update', {
                totalOrders: dashboardData.totalOrders,
                totalRevenue: dashboardData.totalRevenue,
                activeUsers: dashboardData.activeUsers.size
            });
        });
        
        // Simulate order activity
        for (let i = 1; i <= 3; i++) {
            await this.eventBus.emit('order.created', {
                orderId: `order_${i}`,
                userId: `user_${i}`,
                total: 100 + (i * 50),
                timestamp: Date.now()
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ Real-time stream examples completed\n');
    }
    
    /**
     * EXAMPLE 13: Testing and Mocking Support
     */
    async testingAndMockingExamples() {
        console.log('📘 Example 13: Testing and Mocking Support\n');
        
        // Enable test mode
        this.eventBus.enableTestMode();
        
        // Mock external service
        this.eventBus.mockHandler('external.api.call', async (event) => {
            console.log('🎭 Mock external API called:', event.data.endpoint);
            return {
                success: true,
                data: { mockResponse: 'This is a mocked response' }
            };
        });
        
        // Test event handler
        let testEventCount = 0;
        this.eventBus.subscribe('test.event', (event) => {
            testEventCount++;
            console.log(`🧪 Test event ${testEventCount}:`, event.data.message);
        });
        
        // Emit test events
        await this.eventBus.emit('test.event', { message: 'Test message 1' });
        await this.eventBus.emit('test.event', { message: 'Test message 2' });
        await this.eventBus.emit('external.api.call', { endpoint: '/api/users' });
        
        // Get captured events
        const capturedEvents = this.eventBus.getCapturedEvents({
            type: 'test.event'
        });
        
        console.log('📋 Captured test events:', capturedEvents.length);
        
        // Assertions (in a real test framework)
        console.log('✅ Test assertions:');
        console.log(`  - Expected 2 test events, got: ${testEventCount}`);
        console.log(`  - Captured events match: ${capturedEvents.length === 2}`);
        
        // Clear mocks and disable test mode
        this.eventBus.clearMocks();
        this.eventBus.disableTestMode();
        
        console.log('✅ Testing and mocking examples completed\n');
    }
    
    /**
     * Utility method to demonstrate event bus status
     */
    showEventBusStatus() {
        const status = this.eventBus.getStatus();
        console.log('\n📊 Event Bus Status:');
        console.log(`  - Version: ${status.version}`);
        console.log(`  - Initialized: ${status.initialized}`);
        console.log(`  - Total Events: ${status.metrics.totalEvents}`);
        console.log(`  - Processed Events: ${status.metrics.processedEvents}`);
        console.log(`  - Failed Events: ${status.metrics.failedEvents}`);
        console.log(`  - Subscribers: ${status.subscribers}`);
        console.log(`  - Middlewares: ${status.middlewares}`);
        console.log(`  - Circuit Breakers: ${status.circuitBreakers}`);
        console.log(`  - Integrations:`, Object.entries(status.integrations)
            .filter(([_, enabled]) => enabled)
            .map(([name]) => name)
            .join(', ') || 'None');
        console.log('');
    }
}

/**
 * INTEGRATION TESTING SUITE
 * Comprehensive test suite for validating Event Bus functionality
 */
class EventBusIntegrationTests {
    constructor() {
        this.eventBus = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    async runAllTests() {
        console.log('🧪 Starting Event Bus Integration Tests...\n');
        
        await this.waitForEventBus();
        
        // Run test suites
        await this.testBasicPubSub();
        await this.testEventPersistence();
        await this.testEventFiltering();
        await this.testCircuitBreaker();
        await this.testPerformanceOptimizations();
        await this.testSecurityIntegration();
        await this.testCrossWindowCommunication();
        await this.testEventVersioning();
        
        // Display results
        this.displayTestResults();
    }
    
    async waitForEventBus() {
        let attempts = 0;
        while (!window.enterpriseEventBus?.isInitialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        this.eventBus = window.enterpriseEventBus;
    }
    
    async testBasicPubSub() {
        const testName = 'Basic Pub/Sub Functionality';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            let eventReceived = false;
            let receivedData = null;
            
            const unsubscribe = this.eventBus.subscribe('test.basic', (event) => {
                eventReceived = true;
                receivedData = event.data;
            });
            
            await this.eventBus.emit('test.basic', { message: 'Hello Test!' });
            
            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.assert(eventReceived, 'Event should be received');
            this.assert(receivedData?.message === 'Hello Test!', 'Event data should match');
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testEventPersistence() {
        const testName = 'Event Persistence';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            if (!this.eventBus.eventStore) {
                throw new Error('Event store not available');
            }
            
            const testEventId = 'test_persistence_' + Date.now();
            await this.eventBus.emit('test.persistence', { 
                id: testEventId,
                message: 'Persistence test' 
            });
            
            // Wait for storage
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const storedEvents = await this.eventBus.eventStore.query({
                type: 'test.persistence'
            });
            
            const foundEvent = storedEvents.find(e => e.data.id === testEventId);
            this.assert(foundEvent !== undefined, 'Event should be persisted');
            
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testEventFiltering() {
        const testName = 'Event Filtering';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            let filteredEventCount = 0;
            
            const unsubscribe = this.eventBus.subscribe('test.filter', (event) => {
                filteredEventCount++;
            }, {
                filter: (event) => event.data.priority === 'high'
            });
            
            // Emit events with different priorities
            await this.eventBus.emit('test.filter', { priority: 'low' });
            await this.eventBus.emit('test.filter', { priority: 'high' });
            await this.eventBus.emit('test.filter', { priority: 'medium' });
            await this.eventBus.emit('test.filter', { priority: 'high' });
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.assert(filteredEventCount === 2, `Expected 2 filtered events, got ${filteredEventCount}`);
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testCircuitBreaker() {
        const testName = 'Circuit Breaker Pattern';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            let attemptCount = 0;
            let successCount = 0;
            
            const unsubscribe = this.eventBus.subscribe('test.circuit', async (event) => {
                attemptCount++;
                
                if (attemptCount <= 3) {
                    throw new Error('Simulated failure');
                } else {
                    successCount++;
                }
            }, {
                circuitBreaker: true
            });
            
            // Make multiple calls to trigger circuit breaker
            for (let i = 0; i < 6; i++) {
                try {
                    await this.eventBus.emit('test.circuit', { attempt: i + 1 });
                } catch (error) {
                    // Expected for first few attempts
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Circuit breaker should prevent some attempts
            this.assert(attemptCount < 6, 'Circuit breaker should prevent some attempts');
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testPerformanceOptimizations() {
        const testName = 'Performance Optimizations';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            let throttleCount = 0;
            
            const unsubscribe = this.eventBus.subscribe('test.throttle', (event) => {
                throttleCount++;
            }, {
                throttle: 100 // 100ms throttle
            });
            
            // Emit rapid events
            for (let i = 0; i < 10; i++) {
                await this.eventBus.emit('test.throttle', { value: i });
                await new Promise(resolve => setTimeout(resolve, 20)); // 20ms intervals
            }
            
            // Wait for throttling to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Should be throttled to much fewer events
            this.assert(throttleCount < 10, `Expected throttled events, got ${throttleCount}`);
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testSecurityIntegration() {
        const testName = 'Security Integration';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            let auditEventReceived = false;
            
            const unsubscribe = this.eventBus.subscribe('test.security', (event) => {
                auditEventReceived = true;
                
                // Check that XSS protection was applied (if available)
                if (this.eventBus.integrations.xssProtection) {
                    this.assert(!event.data.message.includes('<script>'), 'XSS content should be sanitized');
                }
            });
            
            // Emit potentially dangerous content
            await this.eventBus.emit('test.security', {
                message: '<script>alert("xss")</script>Safe content',
                userId: 'test_user'
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.assert(auditEventReceived, 'Security event should be received');
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testCrossWindowCommunication() {
        const testName = 'Cross-Window Communication';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            if (!this.eventBus.config.enableCrossWindowCommunication) {
                throw new Error('Cross-window communication not enabled');
            }
            
            let crossWindowEventReceived = false;
            
            const unsubscribe = this.eventBus.subscribe('test.cross.window', (event) => {
                crossWindowEventReceived = true;
            });
            
            // Simulate cross-window event
            const mockEvent = {
                type: 'event',
                data: JSON.stringify({
                    id: 'test_cross_window',
                    type: 'test.cross.window',
                    timestamp: Date.now(),
                    data: { message: 'Cross-window test' },
                    metadata: { source: 'test' }
                })
            };
            
            if (this.eventBus.handleCrossWindowEvent) {
                this.eventBus.handleCrossWindowEvent(mockEvent);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.assert(crossWindowEventReceived || !this.eventBus.crossWindowChannel, 
                'Cross-window event handling should work if channel is available');
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    async testEventVersioning() {
        const testName = 'Event Versioning';
        console.log(`🧪 Testing: ${testName}`);
        
        try {
            // Register a test event schema
            this.eventBus.registerEventSchema('test.versioned', '1.0.0', {
                id: 'string',
                message: 'string'
            });
            
            // Register migration handler
            this.eventBus.registerMigrationHandler('1.0.0', '1.1.0', (event) => {
                return {
                    ...event,
                    data: {
                        ...event.data,
                        version: '1.1.0',
                        migrated: true
                    }
                };
            });
            
            let versionedEventReceived = false;
            const unsubscribe = this.eventBus.subscribe('test.versioned', (event) => {
                versionedEventReceived = true;
            });
            
            await this.eventBus.emit('test.versioned', {
                id: 'test_1',
                message: 'Version test'
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.assert(versionedEventReceived, 'Versioned event should be received');
            
            unsubscribe();
            this.recordTest(testName, true);
            
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    recordTest(testName, passed, error = null) {
        this.testResults.tests.push({
            name: testName,
            passed,
            error
        });
        
        if (passed) {
            this.testResults.passed++;
            console.log(`✅ ${testName}: PASSED`);
        } else {
            this.testResults.failed++;
            console.log(`❌ ${testName}: FAILED - ${error}`);
        }
        console.log('');
    }
    
    displayTestResults() {
        console.log('\n🧪 Test Results Summary:');
        console.log(`  - Total Tests: ${this.testResults.tests.length}`);
        console.log(`  - Passed: ${this.testResults.passed}`);
        console.log(`  - Failed: ${this.testResults.failed}`);
        console.log(`  - Success Rate: ${((this.testResults.passed / this.testResults.tests.length) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n✅ Integration testing completed!');
    }
}

// Initialize examples when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize examples after a short delay to ensure Event Bus is ready
        setTimeout(() => {
            window.eventBusExamples = new EventBusExamples();
        }, 2000);
        
        // Initialize tests after examples
        setTimeout(() => {
            window.eventBusTests = new EventBusIntegrationTests();
            // Uncomment to run tests automatically
            // window.eventBusTests.runAllTests();
        }, 5000);
    });
} else {
    setTimeout(() => {
        window.eventBusExamples = new EventBusExamples();
        
        setTimeout(() => {
            window.eventBusTests = new EventBusIntegrationTests();
        }, 3000);
    }, 2000);
}

console.log('📚 Event Bus Examples and Integration Tests loaded - Ready for comprehensive demonstrations');