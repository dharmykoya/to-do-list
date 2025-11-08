// Test setup and utilities
const { JSDOM } = require('jsdom');

// Create a mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock localStorage
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

// Mock sessionStorage
global.sessionStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

// Setup before each test
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  sessionStorage.clear();

  // Clear document body
  document.body.innerHTML = '';

  // Reset any mocks
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Clear any timers
  jest.clearAllTimers();

  // Clear document body
  document.body.innerHTML = '';
});

// Helper function to create a mock todo element
function createMockTodoElement(id, text, completed = false) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = completed;

  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = text;
  if (completed) {
    span.classList.add('completed');
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

// Helper function to create a mock app structure
function createMockAppStructure() {
  const container = document.createElement('div');
  container.className = 'container';

  const header = document.createElement('header');
  const h1 = document.createElement('h1');
  h1.textContent = 'To-Do List';
  header.appendChild(h1);

  const inputSection = document.createElement('div');
  inputSection.className = 'input-section';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'todo-input';
  input.placeholder = 'Add a new task...';

  const addBtn = document.createElement('button');
  addBtn.id = 'add-btn';
  addBtn.textContent = 'Add';

  inputSection.appendChild(input);
  inputSection.appendChild(addBtn);

  const todoList = document.createElement('ul');
  todoList.id = 'todo-list';

  container.appendChild(header);
  container.appendChild(inputSection);
  container.appendChild(todoList);

  document.body.appendChild(container);

  return {
    container,
    input,
    addBtn,
    todoList,
  };
}

// Helper function to wait for async operations
function waitFor(callback, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 50);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 50);
        }
      }
    };

    check();
  });
}

// Helper function to simulate user input
function simulateInput(element, value) {
  element.value = value;
  const event = new window.Event('input', { bubbles: true });
  element.dispatchEvent(event);
}

// Helper function to simulate button click
function simulateClick(element) {
  const event = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  element.dispatchEvent(event);
}

// Helper function to simulate key press
function simulateKeyPress(element, key, keyCode) {
  const event = new window.KeyboardEvent('keypress', {
    key,
    keyCode,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

// Helper function to get todos from localStorage
function getTodosFromStorage() {
  const data = localStorage.getItem('todos');
  return data ? JSON.parse(data) : [];
}

// Helper function to set todos in localStorage
function setTodosInStorage(todos) {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// Helper function to create mock todos
function createMockTodos(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    text: `Todo ${i + 1}`,
    completed: i % 2 === 0,
    createdAt: new Date().toISOString(),
  }));
}

// Helper function to clear all todos
function clearAllTodos() {
  localStorage.removeItem('todos');
  const todoList = document.getElementById('todo-list');
  if (todoList) {
    todoList.innerHTML = '';
  }
}

// Mock notification system
const mockNotifications = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  clear: jest.fn(),
};

// Mock notification container
function createMockNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
}

// Helper to create a notification element
function createNotificationElement(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  return notification;
}

// Helper to show notification
function showNotification(type, message, duration = 3000) {
  const container =
    document.getElementById('notification-container') ||
    createMockNotificationContainer();
  const notification = createNotificationElement(type, message);
  container.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, duration);

  return notification;
}

// Mock validation functions
const mockValidation = {
  validateTodoInput: jest.fn((text) => {
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Todo text is required'],
        sanitizedValue: '',
      };
    }
    if (text.length > 200) {
      return {
        isValid: false,
        errors: ['Todo text is too long (max 200 characters)'],
        sanitizedValue: text.substring(0, 200),
      };
    }
    return {
      isValid: true,
      errors: [],
      sanitizedValue: text.trim(),
    };
  }),
  validateTodoId: jest.fn((id) => {
    if (typeof id !== 'number' || id <= 0 || !Number.isInteger(id)) {
      return {
        isValid: false,
        errors: ['Invalid todo ID'],
      };
    }
    return {
      isValid: true,
      errors: [],
    };
  }),
  sanitizeInput: jest.fn((text) => {
    if (!text) { return ''; }
    return text.replace(/<[^>]*>/g, '').trim();
  }),
};

// Helper to reset all mocks
function resetAllMocks() {
  Object.values(mockNotifications).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  Object.values(mockValidation).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
}

// Export helpers
module.exports = {
  createMockTodoElement,
  createMockAppStructure,
  waitFor,
  simulateInput,
  simulateClick,
  simulateKeyPress,
  getTodosFromStorage,
  setTodosInStorage,
  createMockTodos,
  clearAllTodos,
  mockNotifications,
  createMockNotificationContainer,
  createNotificationElement,
  showNotification,
  mockValidation,
  resetAllMocks,
};

// Global test utilities
global.testUtils = {
  createMockTodoElement,
  createMockAppStructure,
  waitFor,
  simulateInput,
  simulateClick,
  simulateKeyPress,
  getTodosFromStorage,
  setTodosInStorage,
  createMockTodos,
  clearAllTodos,
  mockNotifications,
  mockValidation,
  resetAllMocks,
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Setup global error handler
global.addEventListener = jest.fn((event, handler) => {
  if (event === 'error') {
    global.errorHandler = handler;
  }
});

// Helper to trigger global error
function triggerGlobalError(error) {
  if (global.errorHandler) {
    global.errorHandler({ error });
  }
}

// Helper to create error event
function createErrorEvent(message, filename, lineno, colno, error) {
  return {
    message,
    filename,
    lineno,
    colno,
    error,
    preventDefault: jest.fn(),
  };
}

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  })
);

// Helper to mock fetch response
function mockFetchResponse(data, ok = true, status = 200) {
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      status,
      statusText: ok ? 'OK' : 'Error',
    })
  );
}

// Helper to mock fetch error
function mockFetchError(error) {
  global.fetch.mockImplementationOnce(() => Promise.reject(error));
}

// Animation frame mock
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Helper to wait for animations
function waitForAnimation() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

// Helper to create loading state
function createLoadingState() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
  return overlay;
}

// Helper to remove loading state
function removeLoadingState() {
  const overlay = document.querySelector('.loading-overlay');
  if (!element) { return; }
  element.remove();
}

// Helper to check if element is visible
function isElementVisible(element) {
  if (!element) { return false; }
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

// Helper to wait for element to be visible
function waitForElementToBeVisible(selector, timeout = 1000) {
  return waitFor(() => {
    const element = document.querySelector(selector);
    return element && isElementVisible(element) ? element : null;
  }, timeout);
}

// Helper to wait for element to be hidden
function waitForElementToBeHidden(selector, timeout = 1000) {
  return waitFor(() => {
    const element = document.querySelector(selector);
    return !element || !isElementVisible(element);
  }, timeout);
}

// Export additional helpers
module.exports = {
  ...module.exports,
  triggerGlobalError,
  createErrorEvent,
  mockFetchResponse,
  mockFetchError,
  waitForAnimation,
  createLoadingState,
  removeLoadingState,
  isElementVisible,
  waitForElementToBeVisible,
  waitForElementToBeHidden,
};

// Add to global test utilities
global.testUtils = {
  ...global.testUtils,
  triggerGlobalError,
  createErrorEvent,
  mockFetchResponse,
  mockFetchError,
  waitForAnimation,
  createLoadingState,
  removeLoadingState,
  isElementVisible,
  waitForElementToBeVisible,
  waitForElementToBeHidden,
};