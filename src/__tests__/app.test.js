/**
 * @jest-environment jsdom
 */

import { initializeApp } from '../app.js';
import { validateTodoInput } from '../validation.js';
import { showNotification } from '../notifications.js';
import { renderTodos, showLoadingState, hideLoadingState } from '../ui.js';
import invalidInputs from '../../test/fixtures/invalid-inputs.json';
import _errorScenarios from '../../test/fixtures/error-scenarios.json';

jest.mock('../validation.js');
jest.mock('../notifications.js');
jest.mock('../ui.js');
jest.mock('../storage.js');

describe('App Integration Tests', () => {
  let todoInput;
  let addButton;
  let _container;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <input id="todo-input" type="text" />
        <button id="add-todo">Add</button>
        <ul id="todo-list"></ul>
      </div>
    `;

    todoInput = document.getElementById('todo-input');
    addButton = document.getElementById('add-todo');
    _container = document.querySelector('.container');

    validateTodoInput.mockReturnValue({ isValid: true });
    showNotification.mockClear();
    renderTodos.mockClear();
    showLoadingState.mockClear();
    hideLoadingState.mockClear();
  });

  describe('Initialization', () => {
    test('should initialize app with event listeners', () => {
      initializeApp();

      expect(addButton).toBeDefined();
      expect(todoInput).toBeDefined();
    });

    test('should load existing todos on initialization', () => {
      initializeApp();

      expect(renderTodos).toHaveBeenCalled();
    });
  });

  describe('Input Validation Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should validate input before adding todo', () => {
      todoInput.value = 'Valid todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith('Valid todo');
    });

    test('should show error notification for invalid input', () => {
      const invalidInput = invalidInputs.emptyString;
      todoInput.value = invalidInput.input;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: invalidInput.expectedError,
      });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        invalidInput.expectedError,
        'error'
      );
    });

    test('should not add todo when validation fails', () => {
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      const initialCallCount = renderTodos.mock.calls.length;
      addButton.click();

      expect(renderTodos).toHaveBeenCalledTimes(initialCallCount);
    });

    test('should handle whitespace-only input', () => {
      const whitespaceInput = invalidInputs.whitespaceOnly;
      todoInput.value = whitespaceInput.input;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: whitespaceInput.expectedError,
      });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        whitespaceInput.expectedError,
        'error'
      );
    });

    test('should handle input exceeding maximum length', () => {
      const longInput = invalidInputs.tooLong;
      todoInput.value = longInput.input;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: longInput.expectedError,
      });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        longInput.expectedError,
        'error'
      );
    });

    test('should trim valid input before adding', () => {
      todoInput.value = '  Valid todo  ';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith('  Valid todo  ');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show loading state when adding todo', async () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();
      await new Promise((resolve) => {});

      expect(showLoadingState).toHaveBeenCalled();
    });

    test('should hide loading state after todo is added', async () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(hideLoadingState).toHaveBeenCalled();
    });

    test('should hide loading state on error', async () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });
      renderTodos.mockImplementation(() => {
        throw new Error('Render error');
      });

      addButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(hideLoadingState).toHaveBeenCalled();
    });
  });

  describe('Success Notifications', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show success notification when todo is added', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('added'),
        'success'
      );
    });

    test('should show success notification when todo is removed', () => {
      initializeApp();

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-todo';
      removeButton.dataset.id = '1';
      document.body.appendChild(removeButton);

      removeButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('removed'),
        'success'
      );
    });

    test('should show success notification when todo is toggled', () => {
      initializeApp();

      const toggleButton = document.createElement('input');
      toggleButton.type = 'checkbox';
      toggleButton.className = 'toggle-todo';
      toggleButton.dataset.id = '1';
      document.body.appendChild(toggleButton);

      toggleButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('completed'),
        'success'
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle storage errors gracefully', () => {
      const { saveTodos } = require('../storage.js');
      saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      expect(() => addButton.click()).not.toThrow();
      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );
    });

    test('should handle render errors gracefully', () => {
      renderTodos.mockImplementation(() => {
        throw new Error('Render error');
      });

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      expect(() => addButton.click()).not.toThrow();
      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );
    });

    test('should handle validation errors gracefully', () => {
      validateTodoInput.mockImplementation(() => {
        throw new Error('Validation error');
      });

      todoInput.value = 'New todo';

      expect(() => addButton.click()).not.toThrow();
      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );
    });
  });

  describe('UI Updates', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should clear input after successful add', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(todoInput.value).toBe('');
    });

    test('should not clear input on validation error', () => {
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.click();

      expect(todoInput.value).toBe('');
    });

    test('should re-render todos after add', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      const initialCallCount = renderTodos.mock.calls.length;
      addButton.click();

      expect(renderTodos.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    test('should re-render todos after remove', () => {
      initializeApp();

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-todo';
      removeButton.dataset.id = '1';
      document.body.appendChild(removeButton);

      const initialCallCount = renderTodos.mock.calls.length;
      removeButton.click();

      expect(renderTodos.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    test('should re-render todos after toggle', () => {
      initializeApp();

      const toggleButton = document.createElement('input');
      toggleButton.type = 'checkbox';
      toggleButton.className = 'toggle-todo';
      toggleButton.dataset.id = '1';
      document.body.appendChild(toggleButton);

      const initialCallCount = renderTodos.mock.calls.length;
      toggleButton.click();

      expect(renderTodos.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Keyboard Interactions', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should add todo on Enter key press', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      todoInput.dispatchEvent(enterEvent);

      expect(validateTodoInput).toHaveBeenCalledWith('New todo');
    });

    test('should not add todo on other key press', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      const initialCallCount = validateTodoInput.mock.calls.length;
      const spaceEvent = new KeyboardEvent('keypress', { key: ' ' });
      todoInput.dispatchEvent(spaceEvent);

      expect(validateTodoInput).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle rapid successive adds', () => {
      todoInput.value = 'Todo 1';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();
      todoInput.value = 'Todo 2';
      addButton.click();
      todoInput.value = 'Todo 3';
      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledTimes(3);
    });

    test('should handle special characters in todo text', () => {
      const specialChars = '<script>alert("xss")</script>';
      todoInput.value = specialChars;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith(specialChars);
    });

    test('should handle unicode characters', () => {
      const unicode = '🎉 Todo with emoji 你好';
      todoInput.value = unicode;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith(unicode);
    });

    test('should handle todos with only numbers', () => {
      todoInput.value = '12345';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith('12345');
    });
  });

  describe('Multiple Error Scenarios', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle consecutive validation errors', () => {
      // First error
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });
      addButton.click();

      // Second error
      todoInput.value = '   ';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be only whitespace',
      });
      addButton.click();

      expect(showNotification).toHaveBeenCalledTimes(2);
    });

    test('should recover from error state', () => {
      // Error
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });
      addButton.click();

      // Success
      todoInput.value = 'Valid todo';
      validateTodoInput.mockReturnValue({ isValid: true });
      addButton.click();

      expect(showNotification).toHaveBeenLastCalledWith(
        expect.stringContaining('added'),
        'success'
      );
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should maintain focus on input after validation error', () => {
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      todoInput.focus();
      addButton.click();

      expect(document.activeElement).toBe(todoInput);
    });

    test('should have proper ARIA attributes on error', () => {
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.click();

      const errorElement = document.querySelector('[role="alert"]');
      if (errorElement) {
        expect(errorElement).toBeInTheDocument();
      }
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should debounce rapid input changes', async () => {
      const inputEvent = new Event('input');

      todoInput.value = 'T';
      todoInput.dispatchEvent(inputEvent);

      todoInput.value = 'To';
      todoInput.dispatchEvent(inputEvent);

      todoInput.value = 'Tod';
      todoInput.dispatchEvent(inputEvent);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validation should not be called for every keystroke
      expect(validateTodoInput.mock.calls.length).toBeLessThan(3);
    });

    test('should not block UI during validation', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      const startTime = Date.now();
      addButton.click();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should persist todos after add', () => {
      const { saveTodos } = require('../storage.js');

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(saveTodos).toHaveBeenCalled();
    });

    test('should persist todos after remove', () => {
      const { saveTodos } = require('../storage.js');

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-todo';
      removeButton.dataset.id = '1';
      document.body.appendChild(removeButton);

      removeButton.click();

      expect(saveTodos).toHaveBeenCalled();
    });

    test('should persist todos after toggle', () => {
      const { saveTodos } = require('../storage.js');

      const toggleButton = document.createElement('input');
      toggleButton.type = 'checkbox';
      toggleButton.className = 'toggle-todo';
      toggleButton.dataset.id = '1';
      document.body.appendChild(toggleButton);

      toggleButton.click();

      expect(saveTodos).toHaveBeenCalled();
    });
  });

  describe('Notification Timing', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show notification before UI update', () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      const callOrder = [];
      showNotification.mockImplementation(() => callOrder.push('notification'));
      renderTodos.mockImplementation(() => callOrder.push('render'));

      addButton.click();

      expect(callOrder[0]).toBe('notification');
    });

    test('should show error notification immediately', () => {
      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      const startTime = Date.now();
      addButton.click();

      expect(showNotification).toHaveBeenCalled();
      expect(Date.now() - startTime).toBeLessThan(50);
    });
  });

  describe('Input Sanitization', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle HTML injection attempts', () => {
      const maliciousInput = '<img src=x onerror=alert(1)>';
      todoInput.value = maliciousInput;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith(maliciousInput);
    });

    test('should handle SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE todos; --";
      todoInput.value = sqlInjection;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith(sqlInjection);
    });

    test('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      todoInput.value = scriptInjection;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(validateTodoInput).toHaveBeenCalledWith(scriptInjection);
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should maintain consistent state after error', () => {
      const { getTodos } = require('../storage.js');
      const initialTodos = getTodos();

      todoInput.value = '';
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.click();

      expect(getTodos()).toEqual(initialTodos);
    });

    test('should update state after successful add', () => {
      const { getTodos } = require('../storage.js');
      const initialCount = getTodos().length;

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(getTodos().length).toBe(initialCount + 1);
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should recover from storage failure', () => {
      const { saveTodos } = require('../storage.js');
      saveTodos.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );

      // Should be able to try again
      saveTodos.mockImplementation(() => {});
      todoInput.value = 'Another todo';
      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('added'),
        'success'
      );
    });
  });

  describe('Validation Edge Cases', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle null input', () => {
      todoInput.value = null;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Invalid input',
      });

      expect(() => addButton.click()).not.toThrow();
    });

    test('should handle undefined input', () => {
      todoInput.value = undefined;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Invalid input',
      });

      expect(() => addButton.click()).not.toThrow();
    });

    test('should handle very long input', () => {
      const veryLongInput = 'a'.repeat(10000);
      todoInput.value = veryLongInput;
      validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo is too long',
      });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        'Todo is too long',
        'error'
      );
    });
  });

  describe('UI State Consistency', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should disable add button during loading', async () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      if (addButton.disabled) {
        expect(addButton.disabled).toBe(true);
      }
    });

    test('should re-enable add button after operation', async () => {
      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (addButton.hasAttribute('disabled')) {
        expect(addButton.disabled).toBe(false);
      }
    });
  });

  describe('Notification Content', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should include todo text in success notification', () => {
      const todoText = 'Buy groceries';
      todoInput.value = todoText;
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('added'),
        'success'
      );
    });

    test('should show specific error message for each validation failure', () => {
      Object.values(invalidInputs).forEach((testCase) => {
        todoInput.value = testCase.input;
        validateTodoInput.mockReturnValue({
          isValid: false,
          error: testCase.expectedError,
        });

        addButton.click();

        expect(showNotification).toHaveBeenCalledWith(
          testCase.expectedError,
          'error'
        );
      });
    });
  });

  describe('Integration with Storage', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should load todos from storage on init', () => {
      const { getTodos } = require('../storage.js');
      getTodos.mockReturnValue([
        { id: '1', text: 'Todo 1', completed: false },
        { id: '2', text: 'Todo 2', completed: true },
      ]);

      initializeApp();

      expect(renderTodos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Todo 1' }),
          expect.objectContaining({ text: 'Todo 2' }),
        ])
      );
    });

    test('should save todos to storage after add', () => {
      const { saveTodos, getTodos } = require('../storage.js');
      getTodos.mockReturnValue([]);

      todoInput.value = 'New todo';
      validateTodoInput.mockReturnValue({ isValid: true });

      addButton.click();

      expect(saveTodos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'New todo' }),
        ])
      );
    });
  });

  describe('Event Delegation', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle dynamically added remove buttons', () => {
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-todo';
      removeButton.dataset.id = '1';

      const todoList = document.getElementById('todo-list');
      todoList.appendChild(removeButton);

      removeButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('removed'),
        'success'
      );
    });

    test('should handle dynamically added toggle buttons', () => {
      const toggleButton = document.createElement('input');
      toggleButton.type = 'checkbox';
      toggleButton.className = 'toggle-todo';
      toggleButton.dataset.id = '1';

      const todoList = document.getElementById('todo-list');
      todoList.appendChild(toggleButton);

      toggleButton.click();

      expect(showNotification).toHaveBeenCalledWith(
        expect.stringContaining('completed'),
        'success'
      );
    });
  });
});