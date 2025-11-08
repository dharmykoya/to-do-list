/**
 * @jest-environment jsdom
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.sessionStorage = sessionStorageMock;

// Setup DOM environment
beforeEach(() => {
  // Clear storage before each test
  localStorage.clear();
  sessionStorage.clear();

  // Reset document body
  document.body.innerHTML = '';

  // Clear all mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => {
  return setTimeout(cb, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
);

// Helper to create DOM elements for testing
global.createTestElement = (tag, attributes = {}, children = []) => {
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

  children.forEach((child) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
};

// Helper to wait for async operations
global.waitFor = (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, interval);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };
    check();
  });
};

// Helper to simulate user events
global.simulateEvent = (element, eventType, eventData = {}) => {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...eventData,
  });

  Object.entries(eventData).forEach(([key, value]) => {
    event[key] = value;
  });

  element.dispatchEvent(event);
  return event;
};

// Helper to simulate keyboard events
global.simulateKeyboard = (element, key, options = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  element.dispatchEvent(event);
  return event;
};

// Helper to simulate mouse events
global.simulateMouse = (element, eventType, options = {}) => {
  const event = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    view: window,
    ...options,
  });

  element.dispatchEvent(event);
  return event;
};

// Helper to get computed styles
global.getComputedStyle = (element) => {
  return window.getComputedStyle(element);
};

// Mock Date for consistent testing
const RealDate = Date;

global.mockDate = (isoDate) => {
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return new RealDate(isoDate);
      }
      return new RealDate(...args);
    }

    static now() {
      return new RealDate(isoDate).getTime();
    }
  };
};

global.restoreDate = () => {
  global.Date = RealDate;
};

// Helper to create mock functions with specific behaviors
global.createMockFunction = (implementation) => {
  const mock = jest.fn(implementation);
  mock.mockClear = () => {
    mock.mockClear();
    return mock;
  };
  return mock;
};

// Helper to test async errors
global.expectAsyncError = async (promise, errorMessage) => {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
    return error;
  }
};

// Mock notification system
global.mockNotificationSystem = () => {
  const notifications = [];

  return {
    show: jest.fn((message, type) => {
      notifications.push({ message, type, timestamp: Date.now() });
    }),
    clear: jest.fn(() => {
      notifications.length = 0;
    }),
    getAll: () => notifications,
    getLast: () => notifications[notifications.length - 1],
  };
};

// Mock animation frame for testing animations
global.mockAnimationFrame = () => {
  let frameId = 0;
  const callbacks = new Map();

  global.requestAnimationFrame = jest.fn((callback) => {
    const id = ++frameId;
    callbacks.set(id, callback);
    return id;
  });

  global.cancelAnimationFrame = jest.fn((id) => {
    callbacks.delete(id);
  });

  return {
    triggerFrame: (timestamp = performance.now()) => {
      callbacks.forEach((callback) => callback(timestamp));
      callbacks.clear();
    },
    getCallbacks: () => Array.from(callbacks.values()),
  };
};

// Helper to test DOM mutations
global.observeDOMMutations = (target, callback) => {
  const observer = new MutationObserver(callback);
  observer.observe(target, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
  });
  return observer;
};

// Helper to create test fixtures
global.createFixture = (html) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

// Helper to clean up fixtures
global.cleanupFixture = (container) => {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  writable: true,
});

// Setup test environment indicator
process.env.NODE_ENV = 'test';