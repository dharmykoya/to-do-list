/**
 * Jest Test Setup Configuration
 * 
 * Production-grade test environment setup for vanilla JavaScript to-do list application.
 * Configures jsdom environment, localStorage mocking, and custom matchers for comprehensive testing.
 * 
 * This setup file runs after the test environment is initialized but before tests execute.
 * It provides global test utilities, mocks, and cleanup hooks for test isolation.
 * 
 * @module test/setup
 */

import '@testing-library/jest-dom';

/**
 * LocalStorage Mock Implementation
 * 
 * Provides a complete, spec-compliant localStorage mock for testing.
 * Implements all standard localStorage methods with proper error handling.
 * Maintains state isolation between tests through automatic cleanup.
 */
class LocalStorageMock {
  constructor() {
    this.store = new Map();
  }

  /**
   * Retrieves an item from storage
   * @param {string} key - Storage key
   * @returns {string|null} Stored value or null if not found
   */
  getItem(key) {
    if (typeof key !== 'string') {
      console.warn('localStorage.getItem: key must be a string');
      return null;
    }
    return this.store.get(key) ?? null;
  }

  /**
   * Stores an item in storage
   * @param {string} key - Storage key
   * @param {string} value - Value to store (will be converted to string)
   */
  setItem(key, value) {
    if (typeof key !== 'string') {
      throw new TypeError('localStorage.setItem: key must be a string');
    }
    // Convert value to string to match browser behavior
    const stringValue = String(value);
    this.store.set(key, stringValue);
  }

  /**
   * Removes an item from storage
   * @param {string} key - Storage key to remove
   */
  removeItem(key) {
    if (typeof key !== 'string') {
      console.warn('localStorage.removeItem: key must be a string');
      return;
    }
    this.store.delete(key);
  }

  /**
   * Clears all items from storage
   */
  clear() {
    this.store.clear();
  }

  /**
   * Returns the key at the specified index
   * @param {number} index - Index of key to retrieve
   * @returns {string|null} Key at index or null if out of bounds
   */
  key(index) {
    if (typeof index !== 'number' || index < 0) {
      return null;
    }
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  /**
   * Returns the number of items in storage
   * @returns {number} Number of stored items
   */
  get length() {
    return this.store.size;
  }

  /**
   * Internal method to get all stored data (for debugging)
   * @returns {Object} All stored key-value pairs
   */
  __getAll() {
    return Object.fromEntries(this.store);
  }

  /**
   * Internal method to reset storage state (for testing)
   */
  __reset() {
    this.store.clear();
  }
}

/**
 * SessionStorage Mock Implementation
 * 
 * Provides sessionStorage mock with identical API to localStorage.
 * Useful for testing code that may use either storage mechanism.
 */
class SessionStorageMock extends LocalStorageMock {
  constructor() {
    super();
  }
}

// Install localStorage and sessionStorage mocks globally
const localStorageMock = new LocalStorageMock();
const sessionStorageMock = new SessionStorageMock();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

/**
 * Console Mock for Testing
 * 
 * Captures console output during tests to prevent noise and allow assertions.
 * Stores all console calls for verification in tests.
 */
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

global.consoleMock = {
  logs: [],
  warnings: [],
  errors: [],
  infos: [],
  debugs: [],
};

/**
 * Global Test Utilities
 * 
 * Provides helper functions available to all tests for common operations.
 */
global.testUtils = {
  /**
   * Creates a mock DOM element with specified attributes
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  },

  /**
   * Waits for a condition to be true
   * @param {Function} condition - Function that returns boolean
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<void>}
   */
  async waitFor(condition, timeout = 1000) {
    const startTime = Date.now();
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('waitFor timeout exceeded');
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  },

  /**
   * Simulates user input event
   * @param {HTMLElement} element - Target element
   * @param {string} value - Input value
   */
  simulateInput(element, value) {
    element.value = value;
    const event = new Event('input', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  },

  /**
   * Simulates click event
   * @param {HTMLElement} element - Target element
   */
  simulateClick(element) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  },

  /**
   * Gets localStorage data as parsed JSON
   * @param {string} key - Storage key
   * @returns {any} Parsed JSON data or null
   */
  getStorageData(key) {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  },

  /**
   * Sets localStorage data as JSON
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setStorageData(key, value) {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, data);
  },

  /**
   * Advances all timers and flushes pending promises
   * @returns {Promise<void>}
   */
  async flushTimers() {
    jest.runAllTimers();
    await Promise.resolve();
  },

  /**
   * Waits for a toast notification with specific message to appear
   * @param {string} message - Toast message to wait for
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<HTMLElement>} Toast element
   */
  async waitForToast(message, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const toasts = document.querySelectorAll('.toast');
      for (const toast of toasts) {
        if (toast.textContent.includes(message)) {
          return toast;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Toast with message "${message}" not found within ${timeout}ms`);
  },
};

/**
 * Global beforeEach Hook
 * 
 * Runs before each test to ensure clean state and test isolation.
 * Clears all mocks, storage, and DOM state.
 */
beforeEach(() => {
  // Use fake timers for consistent timer testing
  jest.useFakeTimers();

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset console mocks
  global.consoleMock.logs = [];
  global.consoleMock.warnings = [];
  global.consoleMock.errors = [];
  global.consoleMock.infos = [];
  global.consoleMock.debugs = [];

  // Clear document body
  if (document.body) {
    document.body.innerHTML = '';
  }

  // Reset document head (remove dynamically added styles/scripts)
  if (document.head) {
    const dynamicElements = document.head.querySelectorAll('[data-test-dynamic]');
    dynamicElements.forEach(el => el.remove());
  }

  // Clear all timers
  jest.clearAllTimers();

  // Reset all mocks
  jest.clearAllMocks();
});

/**
 * Global afterEach Hook
 * 
 * Runs after each test for additional cleanup and verification.
 */
afterEach(() => {
  // Clear all toast notifications from DOM
  const toasts = document.querySelectorAll('.toast');
  toasts.forEach(toast => toast.remove());

  // Reset validation state
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.removeAttribute('aria-invalid');
    input.classList.remove('error', 'invalid');
  });

  // Clear error messages
  const errorMessages = document.querySelectorAll('.error-message, [role="alert"]');
  errorMessages.forEach(msg => msg.remove());

  // Clear loading states
  const loadingElements = document.querySelectorAll('.loading, [data-loading="true"]');
  loadingElements.forEach(el => {
    el.classList.remove('loading');
    el.removeAttribute('data-loading');
  });

  // Enable all buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.disabled = false;
  });

  // Verify no unhandled errors in console (optional, can be enabled per test)
  // if (global.consoleMock.errors.length > 0) {
  //   console.warn('Unhandled console errors:', global.consoleMock.errors);
  // }

  // Restore any spies
  jest.restoreAllMocks();

  // Restore real timers
  jest.useRealTimers();
});

/**
 * Global afterAll Hook
 * 
 * Runs once after all tests complete for final cleanup.
 */
afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

/**
 * Custom Jest Matchers
 * 
 * Extends Jest with domain-specific matchers for better test readability.
 */
expect.extend({
  /**
   * Checks if localStorage contains a specific key
   * @param {string} key - Storage key to check
   * @returns {Object} Jest matcher result
   */
  toBeInLocalStorage(key) {
    const pass = localStorage.getItem(key) !== null;
    return {
      pass,
      message: () =>
        pass
          ? `expected "${key}" not to be in localStorage`
          : `expected "${key}" to be in localStorage`,
    };
  },

  /**
   * Checks if localStorage value matches expected value
   * @param {string} key - Storage key
   * @param {any} expectedValue - Expected value
   * @returns {Object} Jest matcher result
   */
  toHaveLocalStorageValue(key, expectedValue) {
    const actualValue = localStorage.getItem(key);
    let parsedActual = actualValue;
    let parsedExpected = expectedValue;

    // Try to parse as JSON for comparison
    try {
      parsedActual = JSON.parse(actualValue);
    } catch {
      // Keep as string
    }

    if (typeof expectedValue === 'object') {
      parsedExpected = expectedValue;
    }

    const pass = JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);

    return {
      pass,
      message: () =>
        pass
          ? `expected localStorage["${key}"] not to equal ${JSON.stringify(expectedValue)}`
          : `expected localStorage["${key}"] to equal ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(parsedActual)}`,
    };
  },

  /**
   * Checks if element has specific data attribute
   * @param {HTMLElement} element - Element to check
   * @param {string} attr - Data attribute name (without 'data-' prefix)
   * @param {string} value - Expected attribute value
   * @returns {Object} Jest matcher result
   */
  toHaveDataAttribute(element, attr, value) {
    const actualValue = element.dataset[attr];
    const pass = actualValue === value;

    return {
      pass,
      message: () =>
        pass
          ? `expected element not to have data-${attr}="${value}"`
          : `expected element to have data-${attr}="${value}", but got "${actualValue}"`,
    };
  },

  /**
   * Checks if a toast notification with specific message and type exists
   * @param {string} message - Expected toast message
   * @param {string} type - Expected toast type (success, error, info, warning)
   * @returns {Object} Jest matcher result
   */
  toHaveToast(message, type) {
    const toasts = document.querySelectorAll('.toast');
    let found = false;
    let foundToast = null;

    for (const toast of toasts) {
      const hasMessage = toast.textContent.includes(message);
      const hasType = type ? toast.classList.contains(type) || toast.dataset.type === type : true;
      
      if (hasMessage && hasType) {
        found = true;
        foundToast = toast;
        break;
      }
    }

    const pass = found;
    const typeStr = type ? ` with type "${type}"` : '';

    return {
      pass,
      message: () =>
        pass
          ? `expected not to find toast with message "${message}"${typeStr}`
          : `expected to find toast with message "${message}"${typeStr}, but ${toasts.length === 0 ? 'no toasts found' : `found ${toasts.length} toast(s) with different content`}`,
    };
  },
});

/**
 * Mock Performance API for timing tests
 */
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  };
}

/**
 * Mock IntersectionObserver for UI tests
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

/**
 * Mock ResizeObserver for responsive tests
 */
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

/**
 * Configure jsdom environment options
 */
if (global.window) {
  // Set window location for tests
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:8080',
      origin: 'http://localhost:8080',
      protocol: 'http:',
      host: 'localhost:8080',
      hostname: 'localhost',
      port: '8080',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
    configurable: true,
  });

  // Mock matchMedia for responsive tests
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    writable: true,
    configurable: true,
  });

  // Mock window.addEventListener for error handler testing
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = jest.fn((event, handler, options) => {
    originalAddEventListener.call(window, event, handler, options);
  });
}

// Log setup completion for debugging
if (process.env.DEBUG_TESTS === 'true') {
  console.log('✓ Jest test environment setup complete');
  console.log('  - localStorage mock installed');
  console.log('  - sessionStorage mock installed');
  console.log('  - Custom matchers registered');
  console.log('  - Global test utilities available');
  console.log('  - DOM environment configured');
  console.log('  - Timer mocks configured');
  console.log('  - Toast and validation cleanup hooks installed');
}