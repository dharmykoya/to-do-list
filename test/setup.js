/**
 * Test Setup and Utilities
 * Provides common test utilities, mocks, and setup for Jest tests
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
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

global.localStorage = localStorageMock;

// Mock DOM APIs
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tagName) => ({
      tagName: tagName.toUpperCase(),
      children: [],
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      remove: jest.fn(),
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
    }),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      children: [],
    },
  };
}

// Mock window APIs
if (typeof window === 'undefined') {
  global.window = {
    localStorage: localStorageMock,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    location: {
      href: 'http://localhost',
      reload: jest.fn(),
    },
  };
}

// Test data fixtures
const testFixtures = {
  validTodo: {
    id: 1,
    text: 'Test todo',
    completed: false,
    createdAt: Date.now(),
  },
  completedTodo: {
    id: 2,
    text: 'Completed todo',
    completed: true,
    createdAt: Date.now() - 86400000, // 1 day ago
  },
  todoList: [
    {
      id: 1,
      text: 'First todo',
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: 2,
      text: 'Second todo',
      completed: true,
      createdAt: Date.now() - 3600000, // 1 hour ago
    },
    {
      id: 3,
      text: 'Third todo',
      completed: false,
      createdAt: Date.now() - 7200000, // 2 hours ago
    },
  ],
  invalidInputs: [
    '',
    '   ',
    null,
    undefined,
    'a'.repeat(501), // Too long
  ],
  validInputs: [
    'Buy groceries',
    'Call mom',
    'Finish project',
    'a'.repeat(500), // Max length
  ],
};

// Helper functions for tests
const testHelpers = {
  /**
   * Create a mock DOM element with common properties
   */
  createMockElement: (tagName = 'div', properties = {}) => {
    const element = {
      tagName: tagName.toUpperCase(),
      children: [],
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false),
        toggle: jest.fn(),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(function (child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
      }),
      removeChild: jest.fn(function (child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
        }
        return child;
      }),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      remove: jest.fn(),
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
      parentNode: null,
      ...properties,
    };
    return element;
  },

  /**
   * Create a mock event object
   */
  createMockEvent: (type = 'click', properties = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: testHelpers.createMockElement(),
    currentTarget: testHelpers.createMockElement(),
    ...properties,
  }),

  /**
   * Wait for async operations
   */
  waitFor: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Flush all pending promises
   */
  flushPromises: () => new Promise((resolve) => setImmediate(resolve)),

  /**
   * Reset all mocks
   */
  resetAllMocks: () => {
    jest.clearAllMocks();
    localStorage.clear();
  },

  /**
   * Setup localStorage with test data
   */
  setupLocalStorage: (data) => {
    localStorage.clear();
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  },

  /**
   * Get all items from localStorage
   */
  getLocalStorageData: () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = JSON.parse(localStorage.getItem(key));
    }
    return data;
  },

  /**
   * Create a mock todo list element
   */
  createMockTodoList: () => {
    const list = testHelpers.createMockElement('ul', {
      id: 'todo-list',
      className: 'todo-list',
    });
    return list;
  },

  /**
   * Create a mock todo item element
   */
  createMockTodoItem: (todo) => {
    const item = testHelpers.createMockElement('li', {
      className: 'todo-item',
      dataset: { id: todo.id.toString() },
    });

    const checkbox = testHelpers.createMockElement('input', {
      type: 'checkbox',
      checked: todo.completed,
      className: 'todo-checkbox',
    });

    const text = testHelpers.createMockElement('span', {
      textContent: todo.text,
      className: 'todo-text',
    });

    const deleteBtn = testHelpers.createMockElement('button', {
      textContent: 'Delete',
      className: 'delete-btn',
    });

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(deleteBtn);

    return { item, checkbox, text, deleteBtn };
  },

  /**
   * Remove element from parent
   */
  removeElement: (element) => {
    if (!element.parentNode) {
      return;
    }
    element.parentNode.removeChild(element);
  },
};

// Console spy helpers
const consoleSpy = {
  error: null,
  warn: null,
  log: null,

  setup: () => {
    consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleSpy.warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleSpy.log = jest.spyOn(console, 'log').mockImplementation(() => {});
  },

  restore: () => {
    if (consoleSpy.error) consoleSpy.error.mockRestore();
    if (consoleSpy.warn) consoleSpy.warn.mockRestore();
    if (consoleSpy.log) consoleSpy.log.mockRestore();
  },
};

// Setup and teardown
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// Export test utilities
module.exports = {
  testFixtures,
  testHelpers,
  consoleSpy,
  localStorageMock,
};

// Notification system mock
class MockNotification {
  constructor(message, type = 'info', duration = 3000) {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.element = testHelpers.createMockElement('div', {
      className: `notification notification-${type}`,
      textContent: message,
    });
    this.timeoutId = null;
  }

  show() {
    document.body.appendChild(this.element);
    if (this.duration > 0) {
      this.timeoutId = setTimeout(() => this.hide(), this.duration);
    }
    return this;
  }

  hide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    testHelpers.removeElement(this.element);
    return this;
  }
}

// Mock notification helpers
const notificationMock = {
  success: jest.fn((message, duration) => {
    const notification = new MockNotification(message, 'success', duration);
    notification.show();
    return notification;
  }),

  error: jest.fn((message, duration) => {
    const notification = new MockNotification(message, 'error', duration);
    notification.show();
    return notification;
  }),

  warning: jest.fn((message, duration) => {
    const notification = new MockNotification(message, 'warning', duration);
    notification.show();
    return notification;
  }),

  info: jest.fn((message, duration) => {
    const notification = new MockNotification(message, 'info', duration);
    notification.show();
    return notification;
  }),

  clear: jest.fn(() => {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach((notification) => {
      testHelpers.removeElement(notification);
    });
  }),

  reset: () => {
    notificationMock.success.mockClear();
    notificationMock.error.mockClear();
    notificationMock.warning.mockClear();
    notificationMock.info.mockClear();
    notificationMock.clear.mockClear();
  },
};

module.exports.notificationMock = notificationMock;
module.exports.MockNotification = MockNotification;

// Loading state mock
const loadingMock = {
  show: jest.fn(() => {
    const loader = testHelpers.createMockElement('div', {
      className: 'loading-spinner',
      id: 'loading-spinner',
    });
    document.body.appendChild(loader);
    return loader;
  }),

  hide: jest.fn(() => {
    const loader = document.getElementById('loading-spinner');
    if (loader) {
      testHelpers.removeElement(loader);
    }
  }),

  reset: () => {
    loadingMock.show.mockClear();
    loadingMock.hide.mockClear();
  },
};

module.exports.loadingMock = loadingMock;

// Error boundary mock
const errorBoundaryMock = {
  handleError: jest.fn((error, errorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
    return {
      error,
      errorInfo,
      recovered: false,
    };
  }),

  reset: () => {
    errorBoundaryMock.handleError.mockClear();
  },
};

module.exports.errorBoundaryMock = errorBoundaryMock;

// Toast notification helpers
const toastHelpers = {
  findToast: (message) => {
    const toasts = document.querySelectorAll('.toast, .notification');
    return Array.from(toasts).find((toast) => toast.textContent.includes(message));
  },

  findToastByType: (type) => {
    const toasts = document.querySelectorAll('.toast, .notification');
    return Array.from(toasts).find((toast) => toast.classList.contains(`toast-${type}`) || toast.classList.contains(`notification-${type}`));
  },

  getAllToasts: () => {
    return Array.from(document.querySelectorAll('.toast, .notification'));
  },

  clearAllToasts: () => {
    const toasts = document.querySelectorAll('.toast, .notification');
    toasts.forEach((toast) => {
      testHelpers.removeElement(toast);
    });
  },

  waitForToast: async (message, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const toast = toastHelpers.findToast(message);
      if (toast) return toast;
      await testHelpers.waitFor(50);
    }
    return null;
  },

  waitForToastByType: async (type, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const toast = toastHelpers.findToastByType(type);
      if (toast) return toast;
      await testHelpers.waitFor(50);
    }
    return null;
  },
};

module.exports.toastHelpers = toastHelpers;

// Validation helpers
const validationHelpers = {
  createValidationResult: (isValid, error = null) => ({
    isValid,
    error,
  }),

  expectValidationSuccess: (result) => {
    expect(result).toHaveProperty('isValid', true);
    expect(result).toHaveProperty('error', null);
  },

  expectValidationFailure: (result, expectedError) => {
    expect(result).toHaveProperty('isValid', false);
    expect(result).toHaveProperty('error');
    if (expectedError) {
      expect(result.error).toBe(expectedError);
    }
  },
};

module.exports.validationHelpers = validationHelpers;