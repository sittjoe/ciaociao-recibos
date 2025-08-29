// tests/test-data/currency-test-scenarios.js
// Comprehensive Test Data Sets for Currency Truncation Testing
// Covers edge cases, problematic values, and real-world scenarios

import { MULTI_TOOL_CONFIG } from '../../playwright-multi-tool.config.js';

// Comprehensive Currency Test Scenarios
export const CURRENCY_TEST_SCENARIOS = {
  // Original problematic values that caused truncation
  TRUNCATION_ISSUES: [
    {
      id: 'truncation-20k',
      name: 'Original $20,000 Truncation Issue',
      description: '$20,000 was displaying as $20,00 (missing last zero)',
      value: 20000,
      expected: '$20,000.00',
      problemType: 'thousands_truncation',
      severity: 'critical',
      realWorldContext: 'Common gold jewelry price point'
    },
    {
      id: 'truncation-10k',
      name: 'Original $10,000 Truncation Issue',
      description: '$10,000 was displaying as $10,00 (missing last zero)',
      value: 10000,
      expected: '$10,000.00',
      problemType: 'thousands_truncation',
      severity: 'critical',
      realWorldContext: 'Common contribution amount'
    },
    {
      id: 'truncation-30k-single-decimal',
      name: 'Original $30,000 Single Decimal Issue',
      description: '$30,000 was displaying as $30,000.0 (single decimal)',
      value: 30000,
      expected: '$30,000.00',
      problemType: 'single_decimal',
      severity: 'high',
      realWorldContext: 'Total receipt amount'
    },
    {
      id: 'truncation-119k',
      name: 'Edge Case $119,900 Truncation',
      description: '$119,900 was displaying as $119,90 (missing last zero)',
      value: 119900,
      expected: '$119,900.00',
      problemType: 'hundreds_truncation',
      severity: 'critical',
      realWorldContext: 'High-end jewelry piece'
    }
  ],

  // Systematic testing of round numbers
  ROUND_NUMBERS: [
    { id: 'round-1k', value: 1000, expected: '$1,000.00', description: 'Basic thousand' },
    { id: 'round-5k', value: 5000, expected: '$5,000.00', description: 'Five thousand' },
    { id: 'round-10k', value: 10000, expected: '$10,000.00', description: 'Ten thousand' },
    { id: 'round-15k', value: 15000, expected: '$15,000.00', description: 'Fifteen thousand' },
    { id: 'round-20k', value: 20000, expected: '$20,000.00', description: 'Twenty thousand' },
    { id: 'round-25k', value: 25000, expected: '$25,000.00', description: 'Twenty-five thousand' },
    { id: 'round-50k', value: 50000, expected: '$50,000.00', description: 'Fifty thousand' },
    { id: 'round-100k', value: 100000, expected: '$100,000.00', description: 'One hundred thousand' },
    { id: 'round-250k', value: 250000, expected: '$250,000.00', description: 'Quarter million' },
    { id: 'round-500k', value: 500000, expected: '$500,000.00', description: 'Half million' },
    { id: 'round-1m', value: 1000000, expected: '$1,000,000.00', description: 'One million' }
  ],

  // Numbers ending in specific digits that might cause issues
  EDGE_ENDINGS: [
    { id: 'ending-00', value: 12300, expected: '$12,300.00', description: 'Ending in 00' },
    { id: 'ending-10', value: 12310, expected: '$12,310.00', description: 'Ending in 10' },
    { id: 'ending-90', value: 12390, expected: '$12,390.00', description: 'Ending in 90' },
    { id: 'ending-99', value: 12399, expected: '$12,399.00', description: 'Ending in 99' },
    { id: 'ending-900', value: 12900, expected: '$12,900.00', description: 'Ending in 900' },
    { id: 'ending-999', value: 12999, expected: '$12,999.00', description: 'Ending in 999' },
    { id: 'ending-000', value: 123000, expected: '$123,000.00', description: 'Ending in 000' }
  ],

  // Decimal values that might cause formatting issues
  DECIMAL_VALUES: [
    { id: 'decimal-basic', value: 1234.56, expected: '$1,234.56', description: 'Basic decimal' },
    { id: 'decimal-single', value: 1234.5, expected: '$1,234.50', description: 'Single decimal place' },
    { id: 'decimal-zero', value: 1234.0, expected: '$1,234.00', description: 'Zero decimal' },
    { id: 'decimal-01', value: 1234.01, expected: '$1,234.01', description: 'Decimal ending in 01' },
    { id: 'decimal-10', value: 1234.10, expected: '$1,234.10', description: 'Decimal ending in 10' },
    { id: 'decimal-90', value: 1234.90, expected: '$1,234.90', description: 'Decimal ending in 90' },
    { id: 'decimal-99', value: 1234.99, expected: '$1,234.99', description: 'Decimal ending in 99' },
    { id: 'cents-only', value: 0.99, expected: '$0.99', description: 'Cents only' },
    { id: 'cents-01', value: 0.01, expected: '$0.01', description: 'Single cent' },
    { id: 'cents-50', value: 0.50, expected: '$0.50', description: 'Fifty cents' }
  ],

  // Large numbers that might stress the formatting system
  LARGE_NUMBERS: [
    { id: 'large-1m', value: 1000000, expected: '$1,000,000.00', description: 'One million' },
    { id: 'large-1.5m', value: 1500000, expected: '$1,500,000.00', description: 'One and a half million' },
    { id: 'large-2m', value: 2000000, expected: '$2,000,000.00', description: 'Two million' },
    { id: 'large-5m', value: 5000000, expected: '$5,000,000.00', description: 'Five million' },
    { id: 'large-9.999m', value: 9999999, expected: '$9,999,999.00', description: 'Maximum system test' },
    { id: 'large-weird', value: 1234567.89, expected: '$1,234,567.89', description: 'Complex large number' }
  ],

  // Small numbers and edge cases
  SMALL_NUMBERS: [
    { id: 'zero', value: 0, expected: '$0.00', description: 'Zero value' },
    { id: 'small-1', value: 1, expected: '$1.00', description: 'One dollar' },
    { id: 'small-10', value: 10, expected: '$10.00', description: 'Ten dollars' },
    { id: 'small-100', value: 100, expected: '$100.00', description: 'One hundred dollars' },
    { id: 'small-999', value: 999, expected: '$999.00', description: 'Just under thousand' }
  ],

  // Real-world jewelry pricing scenarios
  JEWELRY_SCENARIOS: [
    {
      id: 'simple-ring',
      name: 'Simple Gold Ring',
      price: 15000,
      contribution: 5000,
      expectedPrice: '$15,000.00',
      expectedContribution: '$5,000.00',
      expectedBalance: '$10,000.00',
      description: 'Basic gold ring pricing'
    },
    {
      id: 'diamond-ring',
      name: 'Diamond Engagement Ring',
      price: 45000,
      contribution: 15000,
      expectedPrice: '$45,000.00',
      expectedContribution: '$15,000.00',
      expectedBalance: '$30,000.00',
      description: 'Diamond engagement ring'
    },
    {
      id: 'luxury-necklace',
      name: 'Luxury Diamond Necklace',
      price: 185000,
      contribution: 50000,
      expectedPrice: '$185,000.00',
      expectedContribution: '$50,000.00',
      expectedBalance: '$135,000.00',
      description: 'High-end diamond necklace'
    },
    {
      id: 'wedding-set',
      name: 'Complete Wedding Set',
      price: 89500,
      contribution: 25000,
      expectedPrice: '$89,500.00',
      expectedContribution: '$25,000.00',
      expectedBalance: '$64,500.00',
      description: 'Complete wedding jewelry set'
    },
    {
      id: 'watch-luxury',
      name: 'Luxury Gold Watch',
      price: 125000,
      contribution: 62500,
      expectedPrice: '$125,000.00',
      expectedContribution: '$62,500.00',
      expectedBalance: '$62,500.00',
      description: 'High-end gold watch'
    }
  ],

  // String inputs that should be converted properly
  STRING_INPUTS: [
    { id: 'string-basic', input: '25000', expected: '$25,000.00', description: 'Basic string number' },
    { id: 'string-decimal', input: '25000.50', expected: '$25,000.50', description: 'String with decimal' },
    { id: 'string-commas', input: '25,000', expected: '$25,000.00', description: 'String with commas' },
    { id: 'string-commas-decimal', input: '25,000.99', expected: '$25,000.99', description: 'String with commas and decimal' },
    { id: 'string-leading-zeros', input: '025000', expected: '$25,000.00', description: 'String with leading zeros' },
    { id: 'string-whitespace', input: ' 25000 ', expected: '$25,000.00', description: 'String with whitespace' }
  ],

  // Edge cases and error conditions
  EDGE_CASES: [
    { id: 'null-value', input: null, expected: '$0.00', description: 'Null input' },
    { id: 'undefined-value', input: undefined, expected: '$0.00', description: 'Undefined input' },
    { id: 'empty-string', input: '', expected: '$0.00', description: 'Empty string' },
    { id: 'text-input', input: 'abc', expected: '$0.00', description: 'Text input' },
    { id: 'mixed-input', input: '25000abc', expected: '$25,000.00', description: 'Mixed number/text' },
    { id: 'negative-value', input: -25000, expected: '$0.00', description: 'Negative value (should be handled)' },
    { id: 'very-small-decimal', input: 0.001, expected: '$0.00', description: 'Fractional cent (should round)' }
  ]
};

// Test scenario generators
export class CurrencyTestDataGenerator {
  
  // Get all problematic values that previously caused truncation
  static getProblematicValues() {
    return CURRENCY_TEST_SCENARIOS.TRUNCATION_ISSUES;
  }
  
  // Get systematic round number tests
  static getRoundNumberTests() {
    return CURRENCY_TEST_SCENARIOS.ROUND_NUMBERS;
  }
  
  // Get comprehensive test suite (all scenarios)
  static getComprehensiveTestSuite() {
    return {
      truncation: CURRENCY_TEST_SCENARIOS.TRUNCATION_ISSUES,
      roundNumbers: CURRENCY_TEST_SCENARIOS.ROUND_NUMBERS,
      edgeEndings: CURRENCY_TEST_SCENARIOS.EDGE_ENDINGS,
      decimals: CURRENCY_TEST_SCENARIOS.DECIMAL_VALUES,
      largeNumbers: CURRENCY_TEST_SCENARIOS.LARGE_NUMBERS,
      smallNumbers: CURRENCY_TEST_SCENARIOS.SMALL_NUMBERS,
      strings: CURRENCY_TEST_SCENARIOS.STRING_INPUTS,
      edgeCases: CURRENCY_TEST_SCENARIOS.EDGE_CASES
    };
  }
  
  // Get real-world jewelry scenarios
  static getJewelryScenarios() {
    return CURRENCY_TEST_SCENARIOS.JEWELRY_SCENARIOS;
  }
  
  // Generate test data for performance testing
  static getPerformanceTestData() {
    return {
      simple: {
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
        scenarios: CURRENCY_TEST_SCENARIOS.ROUND_NUMBERS.slice(0, 5)
      },
      complex: {
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
        scenarios: CURRENCY_TEST_SCENARIOS.JEWELRY_SCENARIOS
      },
      stress: {
        client: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS,
        scenarios: [
          ...CURRENCY_TEST_SCENARIOS.LARGE_NUMBERS,
          ...CURRENCY_TEST_SCENARIOS.DECIMAL_VALUES,
          ...CURRENCY_TEST_SCENARIOS.EDGE_ENDINGS
        ]
      }
    };
  }
  
  // Generate test combinations for cross-browser testing
  static getCrossBrowserTestData() {
    return {
      critical: CURRENCY_TEST_SCENARIOS.TRUNCATION_ISSUES,
      standard: [
        ...CURRENCY_TEST_SCENARIOS.ROUND_NUMBERS.slice(0, 8),
        ...CURRENCY_TEST_SCENARIOS.DECIMAL_VALUES.slice(0, 5),
        ...CURRENCY_TEST_SCENARIOS.JEWELRY_SCENARIOS.slice(0, 3)
      ],
      comprehensive: Object.values(CURRENCY_TEST_SCENARIOS).flat()
    };
  }
  
  // Generate test data based on severity
  static getTestDataBySeverity(severity = 'all') {
    const allData = this.getComprehensiveTestSuite();
    
    if (severity === 'critical') {
      return {
        truncation: allData.truncation.filter(t => t.severity === 'critical'),
        jewelry: CURRENCY_TEST_SCENARIOS.JEWELRY_SCENARIOS.slice(0, 3)
      };
    }
    
    if (severity === 'high') {
      return {
        truncation: allData.truncation,
        roundNumbers: allData.roundNumbers.slice(0, 8),
        decimals: allData.decimals.slice(0, 6),
        jewelry: CURRENCY_TEST_SCENARIOS.JEWELRY_SCENARIOS
      };
    }
    
    return allData; // Return all for 'all' severity
  }
  
  // Generate random test values for stress testing
  static generateRandomTestValues(count = 50) {
    const randomValues = [];
    
    for (let i = 0; i < count; i++) {
      const baseValue = Math.floor(Math.random() * 1000000); // Up to 1M
      const hasDecimals = Math.random() > 0.5;
      const decimals = hasDecimals ? Math.floor(Math.random() * 100) / 100 : 0;
      const value = baseValue + decimals;
      
      randomValues.push({
        id: `random-${i + 1}`,
        value: value,
        expected: this.formatCurrencyExpected(value),
        description: `Random test value ${i + 1}`,
        generated: true
      });
    }
    
    return randomValues;
  }
  
  // Helper to format expected currency values
  static formatCurrencyExpected(value) {
    if (value === null || value === undefined || isNaN(value) || value < 0) {
      return '$0.00';
    }
    
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }
  
  // Create test receipt data with currency scenarios
  static createReceiptTestData(currencyScenario, clientType = 'simple') {
    const clients = {
      simple: MULTI_TOOL_CONFIG.TEST_CLIENTS.SIMPLE,
      complex: MULTI_TOOL_CONFIG.TEST_CLIENTS.COMPLEX,
      special: MULTI_TOOL_CONFIG.TEST_CLIENTS.SPECIAL_CHARS
    };
    
    const client = clients[clientType] || clients.simple;
    
    return {
      client,
      product: {
        type: 'Test Product',
        material: 'ORO 14K',
        weight: '10',
        description: `Test product for ${currencyScenario.description}`
      },
      financial: {
        price: currencyScenario.value || currencyScenario.price,
        contribution: Math.floor((currencyScenario.value || currencyScenario.price) * 0.3),
        expected: currencyScenario.expected || currencyScenario.expectedPrice
      },
      testInfo: {
        scenarioId: currencyScenario.id,
        scenarioName: currencyScenario.name || currencyScenario.description,
        severity: currencyScenario.severity || 'standard',
        problemType: currencyScenario.problemType || 'general'
      }
    };
  }
  
  // Validate currency formatting result
  static validateCurrencyFormat(actual, expected, testId) {
    const validation = {
      testId,
      actual,
      expected,
      passed: false,
      issues: []
    };
    
    // Basic equality check
    if (actual === expected) {
      validation.passed = true;
      return validation;
    }
    
    // Check for common formatting issues
    if (actual && expected) {
      // Check for truncation issues
      if (actual.includes(',') && !actual.match(/,\d{3}/)) {
        validation.issues.push({
          type: 'truncation',
          description: 'Currency appears truncated after comma'
        });
      }
      
      // Check for decimal issues
      if (actual.includes('.') && !actual.match(/\.\d{2}$/)) {
        validation.issues.push({
          type: 'decimal',
          description: 'Currency does not have exactly 2 decimal places'
        });
      }
      
      // Check for missing dollar sign
      if (!actual.startsWith('$')) {
        validation.issues.push({
          type: 'currency_symbol',
          description: 'Missing dollar sign'
        });
      }
      
      // Check for thousand separator issues
      const numericPart = actual.replace(/[$,]/g, '');
      const expectedNumeric = expected.replace(/[$,]/g, '');
      
      if (numericPart === expectedNumeric) {
        validation.issues.push({
          type: 'formatting_only',
          description: 'Numeric value correct, formatting issue only'
        });
      }
    }
    
    return validation;
  }
}

// Export currency test scenarios for direct import
export default CURRENCY_TEST_SCENARIOS;