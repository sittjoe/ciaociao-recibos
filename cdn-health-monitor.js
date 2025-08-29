/**
 * CDN HEALTH MONITOR - Advanced CDN Health Monitoring and Analytics
 * Companion system to CDN Circuit Breaker for comprehensive monitoring
 * Provides real-time health metrics, predictive failure detection, and optimization
 */

class CDNHealthMonitor {
    constructor(circuitBreaker) {
        this.version = '1.0.0';
        this.circuitBreaker = circuitBreaker;
        
        // Health monitoring configuration
        this.config = {
            healthCheckInterval: 60000,     // 1 minute
            detailedCheckInterval: 300000,  // 5 minutes
            performanceWindow: 300000,      // 5 minutes for analysis
            alertThresholds: {
                errorRate: 0.05,            // 5% error rate
                latency: 5000,              // 5s latency
                availability: 0.95,         // 95% availability
                degradationRate: 0.20       // 20% performance degradation
            },
            predictiveAnalysis: {
                enabled: true,
                lookbackPeriod: 3600000,    // 1 hour
                predictionWindow: 1800000   // 30 minutes ahead
            }
        };
        
        // Health metrics storage
        this.healthMetrics = new Map();
        this.performanceHistory = new Map();
        this.anomalyDetector = null;
        this.trendAnalyzer = null;
        
        // Alert system
        this.alertManager = {
            activeAlerts: new Set(),
            suppressedAlerts: new Set(),
            alertHistory: [],
            
            createAlert: (type, severity, message, data = {}) => {
                const alert = {
                    id: this.generateAlertId(),
                    type,
                    severity, // LOW, MEDIUM, HIGH, CRITICAL
                    message,
                    data,
                    timestamp: Date.now(),
                    resolved: false
                };
                
                this.alertManager.activeAlerts.add(alert);
                this.alertManager.alertHistory.push(alert);
                
                this.logAlert(alert);
                this.notifyAlert(alert);
                
                return alert.id;
            },
            
            resolveAlert: (alertId) => {
                for (const alert of this.alertManager.activeAlerts) {
                    if (alert.id === alertId) {
                        alert.resolved = true;
                        alert.resolvedAt = Date.now();
                        this.alertManager.activeAlerts.delete(alert);
                        break;
                    }
                }
            }
        };
        
        this.initializeHealthMonitor();
    }
    
    async initializeHealthMonitor() {
        try {
            console.log('🏥 Initializing CDN Health Monitor...');
            
            // Initialize components
            await this.initializeMetricsStorage();
            await this.initializeAnomalyDetector();
            await this.initializeTrendAnalyzer();
            
            // Start monitoring
            this.startHealthChecks();
            this.startPerformanceAnalysis();
            
            console.log('✅ CDN Health Monitor initialized successfully');
            
        } catch (error) {
            console.error('❌ CDN Health Monitor initialization failed:', error);
        }
    }
    
    async initializeMetricsStorage() {
        // Initialize health metrics for each endpoint
        if (this.circuitBreaker && this.circuitBreaker.circuitBreakers) {
            for (const [breakerId, breaker] of this.circuitBreaker.circuitBreakers) {
                this.healthMetrics.set(breakerId, {
                    availability: {
                        uptime: 0,
                        downtime: 0,
                        totalChecks: 0,
                        successfulChecks: 0,
                        currentStreak: 0,
                        longestUptime: 0,
                        longestDowntime: 0
                    },
                    performance: {
                        responseTime: [],
                        throughput: [],
                        errorRate: [],
                        cpuUsage: [], // if available
                        memoryUsage: [] // if available
                    },
                    health: {
                        score: 100,
                        status: 'HEALTHY', // HEALTHY, DEGRADED, UNHEALTHY, CRITICAL
                        lastCheck: null,
                        issues: [],
                        recommendations: []
                    },
                    trends: {
                        improving: false,
                        degrading: false,
                        stable: true,
                        confidence: 0
                    }
                });
                
                this.performanceHistory.set(breakerId, {
                    hourly: [],
                    daily: [],
                    weekly: []
                });
            }
        }
    }
    
    async initializeAnomalyDetector() {
        this.anomalyDetector = {
            // Statistical anomaly detection using Z-score
            detectAnomalies: (values, threshold = 2.5) => {
                if (values.length < 3) return [];
                
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                
                const anomalies = [];
                values.forEach((value, index) => {
                    const zScore = Math.abs((value - mean) / stdDev);
                    if (zScore > threshold) {
                        anomalies.push({ index, value, zScore, severity: this.getAnomalySeverity(zScore) });
                    }
                });
                
                return anomalies;
            },
            
            // Pattern-based anomaly detection
            detectPatternAnomalies: (timeSeries) => {
                // Detect sudden spikes, drops, or unusual patterns
                const anomalies = [];
                
                for (let i = 1; i < timeSeries.length; i++) {
                    const current = timeSeries[i];
                    const previous = timeSeries[i - 1];
                    const change = Math.abs(current - previous) / previous;
                    
                    // Detect sudden changes > 50%
                    if (change > 0.5) {
                        anomalies.push({
                            index: i,
                            type: current > previous ? 'SPIKE' : 'DROP',
                            magnitude: change,
                            severity: change > 1.0 ? 'HIGH' : 'MEDIUM'
                        });
                    }
                }
                
                return anomalies;
            }
        };
    }
    
    getAnomalySeverity(zScore) {
        if (zScore > 4) return 'CRITICAL';
        if (zScore > 3.5) return 'HIGH';
        if (zScore > 2.5) return 'MEDIUM';
        return 'LOW';
    }
    
    async initializeTrendAnalyzer() {
        this.trendAnalyzer = {
            // Simple linear regression for trend detection
            analyzeTrend: (dataPoints) => {
                if (dataPoints.length < 5) return { trend: 'INSUFFICIENT_DATA', slope: 0, confidence: 0 };
                
                const n = dataPoints.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                
                dataPoints.forEach((point, index) => {
                    const x = index;
                    const y = point.value || point;
                    sumX += x;
                    sumY += y;
                    sumXY += x * y;
                    sumXX += x * x;
                });
                
                const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;
                
                // Calculate R-squared for confidence
                const meanY = sumY / n;
                let ssTotal = 0, ssRes = 0;
                
                dataPoints.forEach((point, index) => {
                    const y = point.value || point;
                    const predicted = slope * index + intercept;
                    ssTotal += Math.pow(y - meanY, 2);
                    ssRes += Math.pow(y - predicted, 2);
                });
                
                const rSquared = 1 - (ssRes / ssTotal);
                const confidence = Math.max(0, rSquared);
                
                let trend;
                if (Math.abs(slope) < 0.001) {
                    trend = 'STABLE';
                } else if (slope > 0.01) {
                    trend = 'IMPROVING';
                } else if (slope < -0.01) {
                    trend = 'DEGRADING';
                } else {
                    trend = 'STABLE';
                }
                
                return { trend, slope, confidence, intercept, rSquared };
            },
            
            // Predict future values
            predictFuture: (dataPoints, periodsAhead = 6) => {
                const analysis = this.trendAnalyzer.analyzeTrend(dataPoints);
                if (analysis.trend === 'INSUFFICIENT_DATA') return null;
                
                const predictions = [];
                const lastIndex = dataPoints.length - 1;
                
                for (let i = 1; i <= periodsAhead; i++) {
                    const predictedValue = analysis.slope * (lastIndex + i) + analysis.intercept;
                    predictions.push({
                        period: i,
                        value: Math.max(0, predictedValue),
                        confidence: analysis.confidence * Math.exp(-i * 0.1) // Decrease confidence over time
                    });
                }
                
                return predictions;
            }
        };
    }
    
    startHealthChecks() {
        // Basic health checks
        setInterval(() => {
            this.performBasicHealthCheck();
        }, this.config.healthCheckInterval);
        
        // Detailed health checks
        setInterval(() => {
            this.performDetailedHealthCheck();
        }, this.config.detailedCheckInterval);
        
        console.log('🏥 CDN health checks started');
    }
    
    startPerformanceAnalysis() {
        // Performance analysis every 2 minutes
        setInterval(() => {
            this.analyzePerformance();
        }, 120000);
        
        // Trend analysis every 5 minutes
        setInterval(() => {
            this.analyzeTrends();
        }, 300000);
        
        // Anomaly detection every 3 minutes
        setInterval(() => {
            this.detectAnomalies();
        }, 180000);
        
        console.log('📊 Performance analysis started');
    }
    
    async performBasicHealthCheck() {
        if (!this.circuitBreaker || !this.circuitBreaker.circuitBreakers) return;
        
        for (const [breakerId, breaker] of this.circuitBreaker.circuitBreakers) {
            try {
                await this.checkEndpointHealth(breakerId, breaker);
            } catch (error) {
                console.warn(`⚠️ Basic health check failed for ${breakerId}:`, error.message);
            }
        }
    }
    
    async performDetailedHealthCheck() {
        if (!this.circuitBreaker || !this.circuitBreaker.circuitBreakers) return;
        
        console.log('🔍 Performing detailed health analysis...');
        
        for (const [breakerId, breaker] of this.circuitBreaker.circuitBreakers) {
            try {
                await this.performComprehensiveHealthAnalysis(breakerId, breaker);
            } catch (error) {
                console.warn(`⚠️ Detailed health check failed for ${breakerId}:`, error.message);
            }
        }
    }
    
    async checkEndpointHealth(breakerId, breaker) {
        const startTime = performance.now();
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        try {
            // Perform lightweight health check
            const response = await this.performHealthRequest(breaker.endpoint.url);
            const duration = performance.now() - startTime;
            
            // Update availability metrics
            metrics.availability.totalChecks++;
            metrics.availability.successfulChecks++;
            metrics.availability.currentStreak++;
            metrics.availability.uptime += this.config.healthCheckInterval;
            
            // Update performance metrics
            this.updatePerformanceMetrics(breakerId, {
                responseTime: duration,
                success: true,
                timestamp: Date.now()
            });
            
            // Update health status
            this.updateHealthStatus(breakerId, duration, true);
            
        } catch (error) {
            // Record failure
            metrics.availability.totalChecks++;
            metrics.availability.currentStreak = 0;
            metrics.availability.downtime += this.config.healthCheckInterval;
            
            // Update performance metrics
            this.updatePerformanceMetrics(breakerId, {
                responseTime: performance.now() - startTime,
                success: false,
                error: error.message,
                timestamp: Date.now()
            });
            
            // Update health status
            this.updateHealthStatus(breakerId, performance.now() - startTime, false, error);
            
            throw error;
        }
    }
    
    async performHealthRequest(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Health check timeout');
            }
            throw error;
        }
    }
    
    updatePerformanceMetrics(breakerId, data) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const now = Date.now();
        const windowStart = now - this.config.performanceWindow;
        
        // Add new data point
        metrics.performance.responseTime.push({
            value: data.responseTime,
            timestamp: data.timestamp,
            success: data.success
        });
        
        if (data.error) {
            metrics.performance.errorRate.push({
                value: 1,
                timestamp: data.timestamp,
                error: data.error
            });
        } else {
            metrics.performance.errorRate.push({
                value: 0,
                timestamp: data.timestamp
            });
        }
        
        // Cleanup old data points
        metrics.performance.responseTime = metrics.performance.responseTime
            .filter(point => point.timestamp > windowStart);
        metrics.performance.errorRate = metrics.performance.errorRate
            .filter(point => point.timestamp > windowStart);
    }
    
    updateHealthStatus(breakerId, responseTime, success, error = null) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const health = metrics.health;
        health.lastCheck = Date.now();
        
        // Calculate availability percentage
        const availability = metrics.availability.successfulChecks / metrics.availability.totalChecks;
        
        // Calculate average response time
        const recentResponseTimes = metrics.performance.responseTime
            .filter(point => point.success)
            .slice(-10) // Last 10 successful responses
            .map(point => point.value);
        
        const avgResponseTime = recentResponseTimes.length > 0 ?
            recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length : 0;
        
        // Calculate error rate
        const recentErrors = metrics.performance.errorRate.slice(-20); // Last 20 checks
        const errorRate = recentErrors.length > 0 ?
            recentErrors.reduce((sum, point) => sum + point.value, 0) / recentErrors.length : 0;
        
        // Calculate health score (0-100)
        let score = 100;
        
        // Penalize for low availability
        if (availability < this.config.alertThresholds.availability) {
            score -= (this.config.alertThresholds.availability - availability) * 500; // 50% penalty for 10% availability loss
        }
        
        // Penalize for high latency
        if (avgResponseTime > this.config.alertThresholds.latency) {
            score -= Math.min(30, (avgResponseTime - this.config.alertThresholds.latency) / 1000 * 10);
        }
        
        // Penalize for high error rate
        if (errorRate > this.config.alertThresholds.errorRate) {
            score -= (errorRate - this.config.alertThresholds.errorRate) * 200; // High penalty for errors
        }
        
        health.score = Math.max(0, Math.round(score));
        
        // Determine status
        if (health.score >= 90) {
            health.status = 'HEALTHY';
        } else if (health.score >= 70) {
            health.status = 'DEGRADED';
        } else if (health.score >= 50) {
            health.status = 'UNHEALTHY';
        } else {
            health.status = 'CRITICAL';
        }
        
        // Update issues and recommendations
        this.updateHealthIssues(breakerId, availability, avgResponseTime, errorRate, error);
        
        // Trigger alerts if necessary
        this.checkHealthAlerts(breakerId, metrics);
    }
    
    updateHealthIssues(breakerId, availability, avgResponseTime, errorRate, error) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const issues = [];
        const recommendations = [];
        
        // Check availability issues
        if (availability < this.config.alertThresholds.availability) {
            issues.push({
                type: 'LOW_AVAILABILITY',
                severity: availability < 0.8 ? 'HIGH' : 'MEDIUM',
                message: `Availability is ${(availability * 100).toFixed(1)}%, below threshold of ${(this.config.alertThresholds.availability * 100).toFixed(1)}%`,
                value: availability
            });
            recommendations.push('Consider switching to a backup CDN endpoint');
        }
        
        // Check latency issues
        if (avgResponseTime > this.config.alertThresholds.latency) {
            issues.push({
                type: 'HIGH_LATENCY',
                severity: avgResponseTime > this.config.alertThresholds.latency * 2 ? 'HIGH' : 'MEDIUM',
                message: `Average response time is ${avgResponseTime.toFixed(0)}ms, above threshold of ${this.config.alertThresholds.latency}ms`,
                value: avgResponseTime
            });
            recommendations.push('Consider using a geographically closer CDN endpoint');
        }
        
        // Check error rate issues
        if (errorRate > this.config.alertThresholds.errorRate) {
            issues.push({
                type: 'HIGH_ERROR_RATE',
                severity: errorRate > this.config.alertThresholds.errorRate * 2 ? 'HIGH' : 'MEDIUM',
                message: `Error rate is ${(errorRate * 100).toFixed(1)}%, above threshold of ${(this.config.alertThresholds.errorRate * 100).toFixed(1)}%`,
                value: errorRate
            });
            recommendations.push('Investigate CDN endpoint stability and consider fallback options');
        }
        
        // Add specific error information
        if (error) {
            issues.push({
                type: 'CONNECTION_ERROR',
                severity: 'MEDIUM',
                message: `Connection error: ${error.message}`,
                error: error.message
            });
        }
        
        metrics.health.issues = issues;
        metrics.health.recommendations = recommendations;
    }
    
    checkHealthAlerts(breakerId, metrics) {
        const health = metrics.health;
        const alertKey = `health_${breakerId}`;
        
        // Check if we should create an alert
        if (health.status === 'CRITICAL' || health.status === 'UNHEALTHY') {
            if (!this.isAlertActive(alertKey)) {
                this.alertManager.createAlert(
                    'ENDPOINT_UNHEALTHY',
                    health.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
                    `CDN endpoint ${breakerId} is ${health.status.toLowerCase()} (score: ${health.score})`,
                    {
                        breakerId,
                        healthScore: health.score,
                        status: health.status,
                        issues: health.issues
                    }
                );
            }
        } else if (health.status === 'HEALTHY') {
            // Resolve any existing alerts
            this.resolveAlertByKey(alertKey);
        }
    }
    
    async performComprehensiveHealthAnalysis(breakerId, breaker) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        // Analyze performance trends
        const responseTimeAnalysis = this.analyzeTrends();
        
        // Store historical data
        this.storeHistoricalData(breakerId, metrics);
        
        // Generate health report
        const report = this.generateHealthReport(breakerId);
        
        console.log(`📊 Health report for ${breakerId}:`, {
            score: metrics.health.score,
            status: metrics.health.status,
            issues: metrics.health.issues.length,
            recommendations: metrics.health.recommendations.length
        });
    }
    
    analyzePerformance() {
        if (!this.circuitBreaker || !this.circuitBreaker.circuitBreakers) return;
        
        for (const [breakerId] of this.circuitBreaker.circuitBreakers) {
            const metrics = this.healthMetrics.get(breakerId);
            if (!metrics) continue;
            
            // Analyze response time patterns
            this.analyzeResponseTimePatterns(breakerId);
            
            // Analyze error patterns
            this.analyzeErrorPatterns(breakerId);
            
            // Check for performance degradation
            this.checkPerformanceDegradation(breakerId);
        }
    }
    
    analyzeTrends() {
        if (!this.circuitBreaker || !this.circuitBreaker.circuitBreakers) return;
        
        for (const [breakerId] of this.circuitBreaker.circuitBreakers) {
            const metrics = this.healthMetrics.get(breakerId);
            if (!metrics) continue;
            
            // Analyze response time trends
            const responseTimeData = metrics.performance.responseTime
                .filter(point => point.success)
                .slice(-20) // Last 20 data points
                .map(point => point.value);
            
            if (responseTimeData.length >= 5) {
                const trendAnalysis = this.trendAnalyzer.analyzeTrend(responseTimeData);
                
                metrics.trends.improving = trendAnalysis.trend === 'IMPROVING';
                metrics.trends.degrading = trendAnalysis.trend === 'DEGRADING';
                metrics.trends.stable = trendAnalysis.trend === 'STABLE';
                metrics.trends.confidence = trendAnalysis.confidence;
                
                // Create alerts for significant degradation
                if (trendAnalysis.trend === 'DEGRADING' && trendAnalysis.confidence > 0.7) {
                    this.alertManager.createAlert(
                        'PERFORMANCE_DEGRADING',
                        'MEDIUM',
                        `Performance degrading for ${breakerId} (confidence: ${(trendAnalysis.confidence * 100).toFixed(1)}%)`,
                        {
                            breakerId,
                            trend: trendAnalysis,
                            confidence: trendAnalysis.confidence
                        }
                    );
                }
            }
        }
    }
    
    detectAnomalies() {
        if (!this.circuitBreaker || !this.circuitBreaker.circuitBreakers) return;
        
        for (const [breakerId] of this.circuitBreaker.circuitBreakers) {
            const metrics = this.healthMetrics.get(breakerId);
            if (!metrics) continue;
            
            // Detect response time anomalies
            const responseTimeValues = metrics.performance.responseTime
                .filter(point => point.success)
                .slice(-30) // Last 30 data points
                .map(point => point.value);
            
            const anomalies = this.anomalyDetector.detectAnomalies(responseTimeValues);
            const patternAnomalies = this.anomalyDetector.detectPatternAnomalies(responseTimeValues);
            
            // Process statistical anomalies
            for (const anomaly of anomalies) {
                if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
                    this.alertManager.createAlert(
                        'PERFORMANCE_ANOMALY',
                        anomaly.severity,
                        `Performance anomaly detected for ${breakerId} (Z-score: ${anomaly.zScore.toFixed(2)})`,
                        {
                            breakerId,
                            anomaly,
                            value: anomaly.value
                        }
                    );
                }
            }
            
            // Process pattern anomalies
            for (const anomaly of patternAnomalies) {
                if (anomaly.severity === 'HIGH') {
                    this.alertManager.createAlert(
                        'PERFORMANCE_SPIKE',
                        'MEDIUM',
                        `Performance ${anomaly.type.toLowerCase()} detected for ${breakerId} (${(anomaly.magnitude * 100).toFixed(1)}% change)`,
                        {
                            breakerId,
                            anomaly
                        }
                    );
                }
            }
        }
    }
    
    analyzeResponseTimePatterns(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const responseTimeData = metrics.performance.responseTime
            .filter(point => point.success)
            .slice(-50); // Last 50 successful responses
        
        if (responseTimeData.length < 10) return;
        
        // Calculate percentiles
        const values = responseTimeData.map(point => point.value).sort((a, b) => a - b);
        const p95 = values[Math.floor(values.length * 0.95)];
        const p50 = values[Math.floor(values.length * 0.5)];
        
        // Update circuit breaker metrics
        const breaker = this.circuitBreaker.circuitBreakers.get(breakerId);
        if (breaker) {
            breaker.metrics.p95Latency = p95;
            breaker.metrics.medianLatency = p50;
        }
        
        // Check for latency spikes
        if (p95 > this.config.alertThresholds.latency * 2) {
            this.alertManager.createAlert(
                'HIGH_LATENCY_P95',
                'MEDIUM',
                `High P95 latency for ${breakerId}: ${p95.toFixed(0)}ms`,
                {
                    breakerId,
                    p95Latency: p95,
                    threshold: this.config.alertThresholds.latency * 2
                }
            );
        }
    }
    
    analyzeErrorPatterns(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const errorData = metrics.performance.errorRate.slice(-20); // Last 20 checks
        if (errorData.length < 5) return;
        
        // Look for error bursts (multiple consecutive errors)
        let consecutiveErrors = 0;
        let maxConsecutiveErrors = 0;
        
        for (const point of errorData.reverse()) {
            if (point.value === 1) {
                consecutiveErrors++;
                maxConsecutiveErrors = Math.max(maxConsecutiveErrors, consecutiveErrors);
            } else {
                consecutiveErrors = 0;
            }
        }
        
        // Alert for error bursts
        if (maxConsecutiveErrors >= 3) {
            this.alertManager.createAlert(
                'ERROR_BURST',
                'HIGH',
                `Error burst detected for ${breakerId}: ${maxConsecutiveErrors} consecutive errors`,
                {
                    breakerId,
                    consecutiveErrors: maxConsecutiveErrors
                }
            );
        }
    }
    
    checkPerformanceDegradation(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return;
        
        const recentData = metrics.performance.responseTime
            .filter(point => point.success)
            .slice(-20); // Last 20 successful responses
        
        const historicalData = metrics.performance.responseTime
            .filter(point => point.success)
            .slice(-60, -20); // Previous 40 responses
        
        if (recentData.length < 10 || historicalData.length < 10) return;
        
        // Calculate average response times
        const recentAvg = recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;
        const historicalAvg = historicalData.reduce((sum, point) => sum + point.value, 0) / historicalData.length;
        
        // Check for significant degradation
        const degradation = (recentAvg - historicalAvg) / historicalAvg;
        
        if (degradation > this.config.alertThresholds.degradationRate) {
            this.alertManager.createAlert(
                'PERFORMANCE_DEGRADATION',
                'MEDIUM',
                `Performance degraded by ${(degradation * 100).toFixed(1)}% for ${breakerId}`,
                {
                    breakerId,
                    degradationPercent: degradation * 100,
                    recentAvg,
                    historicalAvg
                }
            );
        }
    }
    
    storeHistoricalData(breakerId, metrics) {
        const history = this.performanceHistory.get(breakerId);
        if (!history) return;
        
        const now = Date.now();
        const hour = Math.floor(now / 3600000) * 3600000; // Round to hour
        const day = Math.floor(now / 86400000) * 86400000; // Round to day
        
        // Store hourly aggregates
        const hourlyEntry = {
            timestamp: hour,
            averageResponseTime: this.calculateAverageResponseTime(breakerId),
            availability: metrics.availability.successfulChecks / metrics.availability.totalChecks,
            errorRate: this.calculateErrorRate(breakerId),
            healthScore: metrics.health.score
        };
        
        // Remove duplicate hours and add new entry
        history.hourly = history.hourly.filter(entry => entry.timestamp !== hour);
        history.hourly.push(hourlyEntry);
        
        // Keep only last 24 hours
        const cutoffHour = now - (24 * 3600000);
        history.hourly = history.hourly.filter(entry => entry.timestamp > cutoffHour);
        
        // Store daily aggregates (simplified)
        if (history.hourly.length >= 24) {
            const dailyEntry = {
                timestamp: day,
                averageResponseTime: history.hourly.reduce((sum, entry) => sum + entry.averageResponseTime, 0) / history.hourly.length,
                availability: history.hourly.reduce((sum, entry) => sum + entry.availability, 0) / history.hourly.length,
                errorRate: history.hourly.reduce((sum, entry) => sum + entry.errorRate, 0) / history.hourly.length,
                healthScore: history.hourly.reduce((sum, entry) => sum + entry.healthScore, 0) / history.hourly.length
            };
            
            history.daily = history.daily.filter(entry => entry.timestamp !== day);
            history.daily.push(dailyEntry);
            
            // Keep only last 30 days
            const cutoffDay = now - (30 * 86400000);
            history.daily = history.daily.filter(entry => entry.timestamp > cutoffDay);
        }
    }
    
    calculateAverageResponseTime(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return 0;
        
        const successfulResponses = metrics.performance.responseTime
            .filter(point => point.success)
            .slice(-20); // Last 20
        
        if (successfulResponses.length === 0) return 0;
        
        return successfulResponses.reduce((sum, point) => sum + point.value, 0) / successfulResponses.length;
    }
    
    calculateErrorRate(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        if (!metrics) return 0;
        
        const recentErrors = metrics.performance.errorRate.slice(-20); // Last 20
        if (recentErrors.length === 0) return 0;
        
        return recentErrors.reduce((sum, point) => sum + point.value, 0) / recentErrors.length;
    }
    
    generateHealthReport(breakerId) {
        const metrics = this.healthMetrics.get(breakerId);
        const history = this.performanceHistory.get(breakerId);
        if (!metrics || !history) return null;
        
        const breaker = this.circuitBreaker.circuitBreakers.get(breakerId);
        
        return {
            endpoint: {
                id: breakerId,
                url: breaker?.endpoint.url,
                name: breaker?.endpoint.name,
                priority: breaker?.endpoint.priority
            },
            health: {
                score: metrics.health.score,
                status: metrics.health.status,
                lastCheck: metrics.health.lastCheck,
                issues: metrics.health.issues,
                recommendations: metrics.health.recommendations
            },
            availability: {
                percentage: (metrics.availability.successfulChecks / metrics.availability.totalChecks * 100).toFixed(2),
                uptime: metrics.availability.uptime,
                downtime: metrics.availability.downtime,
                currentStreak: metrics.availability.currentStreak
            },
            performance: {
                averageResponseTime: this.calculateAverageResponseTime(breakerId),
                p95Latency: breaker?.metrics.p95Latency || 0,
                errorRate: (this.calculateErrorRate(breakerId) * 100).toFixed(2) + '%',
                throughput: breaker?.metrics.throughput || 0
            },
            trends: metrics.trends,
            predictions: this.config.predictiveAnalysis.enabled ? 
                this.trendAnalyzer.predictFuture(
                    metrics.performance.responseTime.filter(p => p.success).slice(-20).map(p => p.value)
                ) : null,
            history: {
                hourly: history.hourly.slice(-24), // Last 24 hours
                daily: history.daily.slice(-7)     // Last 7 days
            }
        };
    }
    
    // Alert management methods
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    isAlertActive(key) {
        for (const alert of this.alertManager.activeAlerts) {
            if (alert.data && alert.data.key === key) {
                return true;
            }
        }
        return false;
    }
    
    resolveAlertByKey(key) {
        for (const alert of this.alertManager.activeAlerts) {
            if (alert.data && alert.data.key === key) {
                this.alertManager.resolveAlert(alert.id);
                break;
            }
        }
    }
    
    logAlert(alert) {
        console.warn(`🚨 CDN Alert [${alert.severity}]: ${alert.message}`, alert.data);
    }
    
    notifyAlert(alert) {
        // Integration with external notification systems
        if (window.notificationManager) {
            window.notificationManager.send(alert);
        }
        
        // Integration with SecurityManager
        if (this.circuitBreaker.securityManager && this.circuitBreaker.securityManager.reportSecurityEvent) {
            this.circuitBreaker.securityManager.reportSecurityEvent({
                type: 'CDN_HEALTH_ALERT',
                subtype: alert.type,
                severity: alert.severity,
                message: alert.message,
                data: alert.data
            });
        }
    }
    
    // Public API methods
    getHealthStatus(breakerId = null) {
        if (breakerId) {
            return this.generateHealthReport(breakerId);
        }
        
        const status = {};
        for (const [id] of this.circuitBreaker.circuitBreakers || []) {
            status[id] = this.generateHealthReport(id);
        }
        return status;
    }
    
    getActiveAlerts() {
        return Array.from(this.alertManager.activeAlerts);
    }
    
    getAlertHistory() {
        return this.alertManager.alertHistory.slice(-100); // Last 100 alerts
    }
    
    clearAlerts() {
        this.alertManager.activeAlerts.clear();
        this.alertManager.alertHistory = [];
        console.log('🗑️ CDN health alerts cleared');
    }
    
    updateAlertThresholds(newThresholds) {
        this.config.alertThresholds = { ...this.config.alertThresholds, ...newThresholds };
        console.log('⚙️ CDN health alert thresholds updated');
    }
    
    exportHealthData() {
        const data = {
            timestamp: Date.now(),
            version: this.version,
            healthMetrics: Object.fromEntries(this.healthMetrics),
            performanceHistory: Object.fromEntries(this.performanceHistory),
            config: this.config,
            activeAlerts: Array.from(this.alertManager.activeAlerts),
            alertHistory: this.alertManager.alertHistory
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    importHealthData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.healthMetrics) {
                this.healthMetrics = new Map(Object.entries(data.healthMetrics));
            }
            
            if (data.performanceHistory) {
                this.performanceHistory = new Map(Object.entries(data.performanceHistory));
            }
            
            if (data.config) {
                this.config = { ...this.config, ...data.config };
            }
            
            console.log('✅ CDN health data imported successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to import CDN health data:', error);
            return false;
        }
    }
}

// Export for integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDNHealthMonitor;
}

console.log('🏥 CDN Health Monitor loaded - Advanced health monitoring and analytics');
