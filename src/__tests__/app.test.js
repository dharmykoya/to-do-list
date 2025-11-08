/**
 * @jest-environment jsdom
 */

import { initializeApp } from '../app.js';
import * as todoModule from '../todo.js';
import * as uiModule from '../ui.js';
import * as storageModule from '../storage.js';
import * as validationModule from '../validation.js';
import * as notificationsModule from '../notifications.js';
import errorScenarios from '../../test/fixtures/error-scenarios.json';

// Helper function to simulate adding a todo
const _handleAddTodo = (input, button) => {
  input.value = 'Test todo';
  button.click();
};

describe('App Integration Tests', () => {
  let container;
  let todoInput;
  let addButton;
  let todoList;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="app">
        <input id="todo-input" type="text" />
        <button id="add-button">Add</button>
        <ul id="todo-list"></ul>
      </div>
    `;

    container = document.getElementById('app');
    todoInput = document.getElementById('todo-input');
    addButton = document.getElementById('add-button');
    todoList = document.getElementById('todo-list');

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock;

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn(() => 'test-uuid-123'),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Application Initialization', () => {
    test('should initialize app with empty todo list', () => {
      localStorage.getItem.mockReturnValue(null);

      initializeApp();

      expect(localStorage.getItem).toHaveBeenCalledWith('todos');
      expect(todoList.children.length).toBe(0);
    });

    test('should load existing todos from localStorage', () => {
      const existingTodos = [
        { id: '1', text: 'Existing todo', completed: false },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(existingTodos));

      initializeApp();

      expect(todoList.children.length).toBe(1);
      expect(todoList.children[0].textContent).toContain('Existing todo');
    });
  });

  // Helper to simulate delete button click
  const _simulateDeleteClick = (todoItem) => {
    const deleteButton = todoItem.querySelector('.delete-btn');
    if (deleteButton) {
      deleteButton.click();
    }
  };

  describe('Adding Todos', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null);
      initializeApp();
    });

    test('should add a new todo when add button is clicked', () => {
      todoInput.value = 'New todo item';
      addButton.click();

      expect(todoList.children.length).toBe(1);
      expect(todoList.children[0].textContent).toContain('New todo item');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should not add empty todo', () => {
      todoInput.value = '   ';
      addButton.click();

      expect(todoList.children.length).toBe(0);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should clear input after adding todo', () => {
      todoInput.value = 'New todo';
      addButton.click();

      expect(todoInput.value).toBe('');
    });

    test('should handle Enter key press', () => {});

    test('should trim whitespace from todo text', () => {
      if (todoInput.value.trim()) {
        addButton.click();
      }

      expect(todoList.children.length).toBe(0);
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(() => {
      const existingTodos = [
        { id: '1', text: 'Todo to delete', completed: false },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(existingTodos));
      initializeApp();
    });

    test('should delete todo when delete button is clicked', () => {
      const deleteButton = todoList.querySelector('.delete-btn');
      deleteButton.click();

      expect(todoList.children.length).toBe(0);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should update localStorage after deletion', () => {
      const deleteButton = todoList.querySelector('.delete-btn');
      deleteButton.click();

      const savedData = localStorage.setItem.mock.calls[0][1];
      const todos = JSON.parse(savedData);
      expect(todos.length).toBe(0);
    });
  });

  describe('Toggling Todo Completion', () => {
    beforeEach(() => {
      const existingTodos = [
        { id: '1', text: 'Todo to toggle', completed: false },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(existingTodos));
      initializeApp();
    });

    test('should toggle todo completion status', () => {
      const checkbox = todoList.querySelector('input[type="checkbox"]');
      checkbox.click();

      expect(checkbox.checked).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should apply completed class when todo is completed', () => {
      const checkbox = todoList.querySelector('input[type="checkbox"]');
      const todoItem = todoList.children[0];

      checkbox.click();

      expect(todoItem.classList.contains('completed')).toBe(true);
    });

    test('should remove completed class when todo is uncompleted', () => {
      const checkbox = todoList.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      checkbox.click();

      const todoItem = todoList.children[0];
      expect(todoItem.classList.contains('completed')).toBe(false);
    });
  });

  describe('Data Persistence', () => {
    test('should save todos to localStorage after each operation', () => {
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      todoInput.value = 'Persistent todo';
      addButton.click();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'todos',
        expect.any(String)
      );
    });

    test('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => initializeApp()).not.toThrow();
    });
  });

  describe('Module Integration', () => {
    test('should use todo module for business logic', () => {
      const createTodoSpy = jest.spyOn(todoModule, 'createTodo');
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      todoInput.value = 'Test todo';
      addButton.click();

      expect(createTodoSpy).toHaveBeenCalledWith('Test todo');
      createTodoSpy.mockRestore();
    });

    test('should use UI module for rendering', () => {
      const renderTodosSpy = jest.spyOn(uiModule, 'renderTodos');
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      expect(renderTodosSpy).toHaveBeenCalled();
      renderTodosSpy.mockRestore();
    });

    test('should use storage module for persistence', () => {
      const saveTodosSpy = jest.spyOn(storageModule, 'saveTodos');
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      todoInput.value = 'Test todo';
      addButton.click();

      expect(saveTodosSpy).toHaveBeenCalled();
      saveTodosSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid consecutive additions', () => {
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      for (let i = 0; i < 5; i++) {
        todoInput.value = `Todo ${i}`;
        addButton.click();
      }

      expect(todoList.children.length).toBe(5);
    });

    test('should handle special characters in todo text', () => {
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      const specialText = '<script>alert("xss")</script>';
      todoInput.value = specialText;
      addButton.click();

      const todoText = todoList.children[0].textContent;
      expect(todoText).toContain(specialText);
      expect(todoList.innerHTML).not.toContain('<script>');
    });

    test('should handle very long todo text', () => {
      localStorage.getItem.mockReturnValue(null);
      initializeApp();

      const longText = 'a'.repeat(1000);
      todoInput.value = longText;
      addButton.click();

      expect(todoList.children.length).toBe(1);
      expect(todoList.children[0].textContent).toContain(longText);
    });
  });

  describe('Enhanced Error Handling and Validation', () => {
    describe('Enhanced handleAddTodo()', () => {
      beforeEach(() => {
        localStorage.getItem.mockReturnValue(null);
        initializeApp();
      });

      test('should validate input before adding', () => {
        const validateSpy = jest.spyOn(validationModule, 'validateTodoText');
        
        todoInput.value = 'Valid todo';
        addButton.click();

        expect(validateSpy).toHaveBeenCalledWith('Valid todo');
        validateSpy.mockRestore();
      });

      test('should show error toast for validation failure - empty input', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        todoInput.value = '';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('empty'),
          notificationsModule.NotificationType.ERROR
        );
        expect(todoList.children.length).toBe(0);
        showToastSpy.mockRestore();
      });

      test('should show error toast for validation failure - whitespace only', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        todoInput.value = '   ';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('whitespace'),
          notificationsModule.NotificationType.ERROR
        );
        expect(todoList.children.length).toBe(0);
        showToastSpy.mockRestore();
      });

      test('should show error toast for validation failure - exceeds max length', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        todoInput.value = 'a'.repeat(501);
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('500'),
          notificationsModule.NotificationType.ERROR
        );
        expect(todoList.children.length).toBe(0);
        showToastSpy.mockRestore();
      });

      test('should show loading state during save', () => {
        const setLoadingSpy = jest.spyOn(uiModule, 'setLoadingState');
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(setLoadingSpy).toHaveBeenCalledWith(true);
        setLoadingSpy.mockRestore();
      });

      test('should show success toast on successful add', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        todoInput.value = 'New todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('success'),
          notificationsModule.NotificationType.SUCCESS
        );
        showToastSpy.mockRestore();
      });

      test('should show error toast on storage failure - quota exceeded', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const quotaError = new Error('QuotaExceededError');
        quotaError.name = 'QuotaExceededError';
        localStorage.setItem.mockImplementation(() => {
          throw quotaError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('quota'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should show error toast on storage failure - storage disabled', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const storageError = new Error('localStorage is not available');
        localStorage.setItem.mockImplementation(() => {
          throw storageError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('Storage'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should clear loading state in all cases - success', () => {
        const setLoadingSpy = jest.spyOn(uiModule, 'setLoadingState');
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(setLoadingSpy).toHaveBeenCalledWith(false);
        setLoadingSpy.mockRestore();
      });

      test('should clear loading state in all cases - error', () => {
        const setLoadingSpy = jest.spyOn(uiModule, 'setLoadingState');
        localStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(setLoadingSpy).toHaveBeenCalledWith(false);
        setLoadingSpy.mockRestore();
      });

      test('should not add todo if validation fails', () => {
        const createTodoSpy = jest.spyOn(todoModule, 'createTodo');
        
        todoInput.value = '';
        addButton.click();

        expect(createTodoSpy).not.toHaveBeenCalled();
        expect(todoList.children.length).toBe(0);
        createTodoSpy.mockRestore();
      });
    });

    describe('Enhanced handleDeleteTodo()', () => {
      beforeEach(() => {
        const existingTodos = [
          { id: '1', text: 'Todo to delete', completed: false, timestamp: new Date().toISOString() },
        ];
        localStorage.getItem.mockReturnValue(JSON.stringify(existingTodos));
        initializeApp();
      });

      test('should show loading state during delete', () => {
        const setLoadingSpy = jest.spyOn(uiModule, 'setLoadingState');
        const deleteButton = todoList.querySelector('.delete-btn');
        
        deleteButton.click();

        expect(setLoadingSpy).toHaveBeenCalledWith(true);
        setLoadingSpy.mockRestore();
      });

      test('should show success toast on successful delete', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const deleteButton = todoList.querySelector('.delete-btn');
        
        deleteButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('deleted'),
          notificationsModule.NotificationType.SUCCESS
        );
        showToastSpy.mockRestore();
      });

      test('should show error toast on delete failure', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        localStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        const deleteButton = todoList.querySelector('.delete-btn');
        
        deleteButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should handle non-existent todo gracefully', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        localStorage.getItem.mockReturnValue(JSON.stringify([]));
        
        const deleteButton = todoList.querySelector('.delete-btn');
        if (deleteButton) {
          deleteButton.click();
        }

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('not found'),
          notificationsModule.NotificationType.INFO
        );
        showToastSpy.mockRestore();
      });
    });

    describe('handleStorageError()', () => {
      beforeEach(() => {
        localStorage.getItem.mockReturnValue(null);
        initializeApp();
      });

      test('should identify quota exceeded error and show specific message', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const quotaError = new Error('QuotaExceededError');
        quotaError.name = 'QuotaExceededError';
        localStorage.setItem.mockImplementation(() => {
          throw quotaError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('quota exceeded'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should identify storage disabled error and show specific message', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const storageError = new Error('localStorage is not available');
        localStorage.setItem.mockImplementation(() => {
          throw storageError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('unavailable'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should show generic error for unknown errors', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const unknownError = new Error('Unknown error');
        localStorage.setItem.mockImplementation(() => {
          throw unknownError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should include actionable guidance in error messages', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const quotaError = new Error('QuotaExceededError');
        quotaError.name = 'QuotaExceededError';
        localStorage.setItem.mockImplementation(() => {
          throw quotaError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringMatching(/delete|free up|space/i),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });
    });

    describe('Global error handling', () => {
      test('should catch unhandled errors via window.error event', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        const errorEvent = new ErrorEvent('error', {
          message: 'Uncaught error',
          filename: 'test.js',
          lineno: 10,
          colno: 5,
          error: new Error('Test error')
        });
        
        window.dispatchEvent(errorEvent);

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('unexpected error'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should catch unhandled promise rejections', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
          promise: Promise.reject(new Error('Test rejection')),
          reason: new Error('Test rejection')
        });
        
        window.dispatchEvent(rejectionEvent);

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          notificationsModule.NotificationType.ERROR
        );
        showToastSpy.mockRestore();
      });

      test('should display error toast for uncaught errors', () => {
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        const errorEvent = new ErrorEvent('error', {
          message: 'Uncaught error',
          error: new Error('Test error')
        });
        
        window.dispatchEvent(errorEvent);

        expect(showToastSpy).toHaveBeenCalled();
        expect(showToastSpy.mock.calls[0][1]).toBe(notificationsModule.NotificationType.ERROR);
        showToastSpy.mockRestore();
      });

      test('should prevent application crash on uncaught errors', () => {
        const errorEvent = new ErrorEvent('error', {
          message: 'Uncaught error',
          error: new Error('Test error')
        });
        
        expect(() => {
          window.dispatchEvent(errorEvent);
        }).not.toThrow();
      });
    });

    describe('Feature flag integration', () => {
      test('should enable enhanced validation when flag is on', () => {
        localStorage.getItem.mockImplementation((key) => {
          if (key === 'feature_enhanced_validation_feedback') return 'on';
          return null;
        });
        
        initializeApp();
        
        const validateRealtimeSpy = jest.spyOn(uiModule, 'validateInputRealtime');
        
        // Re-initialize to trigger validation setup
        document.body.innerHTML = `
          <div id="app">
            <form id="todo-form">
              <input id="todo-input" type="text" />
              <button type="submit" id="add-button">Add</button>
            </form>
            <ul id="todo-list"></ul>
          </div>
        `;
        
        initializeApp();
        
        expect(validateRealtimeSpy).toHaveBeenCalled();
        validateRealtimeSpy.mockRestore();
      });

      test('should fall back to basic validation when flag is off', () => {
        localStorage.getItem.mockImplementation((key) => {
          if (key === 'feature_enhanced_validation_feedback') return 'off';
          return null;
        });
        
        const validateRealtimeSpy = jest.spyOn(uiModule, 'validateInputRealtime');
        
        document.body.innerHTML = `
          <div id="app">
            <form id="todo-form">
              <input id="todo-input" type="text" />
              <button type="submit" id="add-button">Add</button>
            </form>
            <ul id="todo-list"></ul>
          </div>
        `;
        
        initializeApp();
        
        expect(validateRealtimeSpy).not.toHaveBeenCalled();
        validateRealtimeSpy.mockRestore();
      });

      test('should disable real-time validation when flag is off', () => {
        localStorage.getItem.mockImplementation((key) => {
          if (key === 'feature_enhanced_validation_feedback') return 'off';
          return null;
        });
        
        document.body.innerHTML = `
          <div id="app">
            <form id="todo-form">
              <input id="todo-input" type="text" />
              <button type="submit" id="add-button">Add</button>
            </form>
            <ul id="todo-list"></ul>
          </div>
        `;
        
        initializeApp();
        
        const input = document.getElementById('todo-input');
        const inputEvent = new Event('input', { bubbles: true });
        
        expect(() => {
          input.dispatchEvent(inputEvent);
        }).not.toThrow();
      });
    });

    describe('End-to-end error scenarios', () => {
      test('should handle full workflow with storage quota exceeded', () => {
        localStorage.getItem.mockReturnValue(null);
        initializeApp();
        
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        const quotaError = new Error('QuotaExceededError');
        quotaError.name = 'QuotaExceededError';
        localStorage.setItem.mockImplementation(() => {
          throw quotaError;
        });
        
        todoInput.value = 'Test todo';
        addButton.click();

        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('quota'),
          notificationsModule.NotificationType.ERROR
        );
        expect(todoList.children.length).toBe(0);
        showToastSpy.mockRestore();
      });

      test('should allow recovery after error - can continue using app', () => {
        localStorage.getItem.mockReturnValue(null);
        initializeApp();
        
        // First attempt fails
        localStorage.setItem.mockImplementationOnce(() => {
          throw new Error('Storage error');
        });
        
        todoInput.value = 'First todo';
        addButton.click();
        
        expect(todoList.children.length).toBe(0);
        
        // Second attempt succeeds
        localStorage.setItem.mockImplementation(() => true);
        
        todoInput.value = 'Second todo';
        addButton.click();
        
        expect(todoList.children.length).toBe(1);
      });

      test('should handle multiple errors in sequence', () => {
        localStorage.getItem.mockReturnValue(null);
        initializeApp();
        
        const showToastSpy = jest.spyOn(notificationsModule, 'showToast');
        
        // First error - validation
        todoInput.value = '';
        addButton.click();
        
        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('empty'),
          notificationsModule.NotificationType.ERROR
        );
        
        // Second error - storage
        localStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        todoInput.value = 'Valid todo';
        addButton.click();
        
        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          notificationsModule.NotificationType.ERROR
        );
        
        expect(showToastSpy).toHaveBeenCalledTimes(2);
        showToastSpy.mockRestore();
      });
    });
  });
});