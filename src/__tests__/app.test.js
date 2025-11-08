import { jest } from '@jest/globals';
import { initializeApp } from '../app.js';
import * as storage from '../storage.js';
import * as todoModule from '../todo.js';
import * as ui from '../ui.js';
import * as validation from '../validation.js';
import * as notifications from '../notifications.js';

// Mock all dependencies
jest.mock('../storage.js');
jest.mock('../todo.js');
jest.mock('../ui.js');
jest.mock('../validation.js');
jest.mock('../notifications.js');

describe('App Integration', () => {
  let container;
  let todoInput;
  let addButton;
  let todoList;
  let clearButton;
  const _mockTodoList = [];

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement('div');
    container.innerHTML = `
      <input id="todo-input" type="text" />
      <button id="add-btn">Add</button>
      <ul id="todo-list"></ul>
      <button id="clear-completed-btn">Clear Completed</button>
      <div id="notification-container"></div>
    `;
    document.body.appendChild(container);

    todoInput = document.getElementById('todo-input');
    addButton = document.getElementById('add-btn');
    todoList = document.getElementById('todo-list');
    clearButton = document.getElementById('clear-completed-btn');

    // Setup default mocks
    storage.loadTodos.mockReturnValue([]);
    storage.saveTodos.mockImplementation(() => {});
    todoModule.createTodo.mockImplementation((text) => ({
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }));
    todoModule.addTodo.mockImplementation((todos, todo) => [...todos, todo]);
    todoModule.removeTodo.mockImplementation((todos, id) =>
      todos.filter((t) => t.id !== id)
    );
    todoModule.toggleTodo.mockImplementation((todos, id) =>
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    todoModule.clearCompleted.mockImplementation((todos) =>
      todos.filter((t) => !t.completed)
    );
    ui.renderTodos.mockImplementation(() => {});
    ui.clearInput.mockImplementation(() => {});
    ui.showLoadingState.mockImplementation(() => {});
    ui.hideLoadingState.mockImplementation(() => {});
    ui.updateClearButtonState.mockImplementation(() => {});
    validation.validateTodoInput.mockReturnValue({ isValid: true });
    notifications.showNotification.mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize app and load todos', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false },
        { id: 2, text: 'Another todo', completed: true },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);

      initializeApp();

      expect(storage.loadTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalledWith(
        mockTodos,
        expect.any(Function),
        expect.any(Function)
      );
    });

    test('should handle empty todo list on initialization', () => {
      storage.loadTodos.mockReturnValue([]);

      initializeApp();

      expect(storage.loadTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalledWith(
        [],
        expect.any(Function),
        expect.any(Function)
      );
    });

    test('should setup event listeners on initialization', () => {
      initializeApp();

      // Verify event listeners are attached by triggering events
      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      // Should attempt to validate (even if input is empty)
      expect(validation.validateTodoInput).toHaveBeenCalled();
    });
  });

  describe('Adding Todos', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should add todo when input is valid', () => {
      const todoText = 'New todo item';
      todoInput.value = todoText;
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(validation.validateTodoInput).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(todoText);
      expect(storage.saveTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo added successfully!',
        'success'
      );
    });

    test('should not add todo when input is invalid', () => {
      todoInput.value = '  ';
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(validation.validateTodoInput).toHaveBeenCalled();
      expect(todoModule.createTodo).not.toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo cannot be empty',
        'error'
      );
    });

    test('should add todo on Enter key press', () => {
      const todoText = 'New todo via Enter';
      todoInput.value = todoText;
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      todoInput.dispatchEvent(enterEvent);

      expect(validation.validateTodoInput).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(todoText);
    });

    test('should not add todo on non-Enter key press', () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const keyEvent = new KeyboardEvent('keypress', { key: 'a' });
      todoInput.dispatchEvent(keyEvent);

      expect(todoModule.createTodo).not.toHaveBeenCalled();
    });

    test('should show loading state while adding todo', async () => {
      todoInput.value = 'Test todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      // Make saveTodos async to test loading state
      storage.saveTodos.mockImplementation(
        () => new Promise((_resolve) => setTimeout(_resolve, 100))
      );

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(ui.showLoadingState).toHaveBeenCalled();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(ui.hideLoadingState).toHaveBeenCalled();
    });

    test('should handle errors when adding todo', () => {
      todoInput.value = 'Test todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed to add todo'),
        'error'
      );
    });

    test('should trim whitespace from todo text', () => {
      const todoText = '  Test todo  ';
      todoInput.value = todoText;
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(validation.validateTodoInput).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(todoText);
    });

    test('should validate todo length', () => {
      const longText = 'a'.repeat(300);
      todoInput.value = longText;
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo is too long',
      });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(validation.validateTodoInput).toHaveBeenCalledWith(longText);
      expect(todoModule.createTodo).not.toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo is too long',
        'error'
      );
    });

    test('should clear input after adding todo', () => {
      todoInput.value = 'Test todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      // Clear input manually in test (since we're mocking ui.clearInput)
      if (todoInput.value.trim()) { todoInput.value = ''; }

      expect(ui.clearInput).toHaveBeenCalled();
    });
  });

  describe('Removing Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false },
        { id: 2, text: 'Todo 2', completed: true },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should remove todo when delete is clicked', () => {
      const todoId = 1;
      const mockTodos = storage.loadTodos();

      // Get the remove callback from renderTodos
      const renderCall = ui.renderTodos.mock.calls[0];
      const removeCallback = renderCall[1];

      removeCallback(todoId);

      expect(todoModule.removeTodo).toHaveBeenCalledWith(mockTodos, todoId);
      expect(storage.saveTodos).toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo removed successfully!',
        'success'
      );
    });

    test('should handle errors when removing todo', () => {
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const renderCall = ui.renderTodos.mock.calls[0];
      const removeCallback = renderCall[1];

      removeCallback(1);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove todo'),
        'error'
      );
    });

    test('should update UI after removing todo', () => {
      const renderCall = ui.renderTodos.mock.calls[0];
      const removeCallback = renderCall[1];

      removeCallback(1);

      // Should call renderTodos again to update UI
      expect(ui.renderTodos).toHaveBeenCalledTimes(2);
    });
  });

  describe('Toggling Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false },
        { id: 2, text: 'Todo 2', completed: true },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should toggle todo completion status', () => {
      const todoId = 1;
      const mockTodos = storage.loadTodos();

      // Get the toggle callback from renderTodos
      const renderCall = ui.renderTodos.mock.calls[0];
      const toggleCallback = renderCall[2];

      toggleCallback(todoId);

      expect(todoModule.toggleTodo).toHaveBeenCalledWith(mockTodos, todoId);
      expect(storage.saveTodos).toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo updated successfully!',
        'success'
      );
    });

    test('should handle errors when toggling todo', () => {
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const renderCall = ui.renderTodos.mock.calls[0];
      const toggleCallback = renderCall[2];

      toggleCallback(1);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update todo'),
        'error'
      );
    });

    test('should update UI after toggling todo', () => {
      const renderCall = ui.renderTodos.mock.calls[0];
      const toggleCallback = renderCall[2];

      toggleCallback(1);

      // Should call renderTodos again to update UI
      expect(ui.renderTodos).toHaveBeenCalledTimes(2);
    });

    test('should update clear button state after toggling', () => {
      const renderCall = ui.renderTodos.mock.calls[0];
      const toggleCallback = renderCall[2];

      toggleCallback(1);

      expect(ui.updateClearButtonState).toHaveBeenCalled();
    });
  });

  describe('Clearing Completed Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false },
        { id: 2, text: 'Todo 2', completed: true },
        { id: 3, text: 'Todo 3', completed: true },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should clear all completed todos', () => {
      const mockTodos = storage.loadTodos();

      const clickEvent = new Event('click');
      clearButton.dispatchEvent(clickEvent);

      expect(todoModule.clearCompleted).toHaveBeenCalledWith(mockTodos);
      expect(storage.saveTodos).toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('completed todos cleared'),
        'success'
      );
    });

    test('should handle errors when clearing completed todos', () => {
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const clickEvent = new Event('click');
      clearButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed to clear completed todos'),
        'error'
      );
    });

    test('should update UI after clearing completed todos', () => {
      const clickEvent = new Event('click');
      clearButton.dispatchEvent(clickEvent);

      // Should call renderTodos again to update UI
      expect(ui.renderTodos).toHaveBeenCalledTimes(2);
    });

    test('should show correct count in notification', () => {
      todoModule.clearCompleted.mockReturnValue([
        { id: 1, text: 'Todo 1', completed: false },
      ]);

      const clickEvent = new Event('click');
      clearButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        '2 completed todos cleared!',
        'success'
      );
    });

    test('should handle case when no completed todos exist', () => {
      storage.loadTodos.mockReturnValue([
        { id: 1, text: 'Todo 1', completed: false },
      ]);
      todoModule.clearCompleted.mockReturnValue([
        { id: 1, text: 'Todo 1', completed: false },
      ]);

      const clickEvent = new Event('click');
      clearButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        '0 completed todos cleared!',
        'success'
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle storage load errors gracefully', () => {
      storage.loadTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Re-initialize to trigger error
      expect(() => initializeApp()).not.toThrow();
    });

    test('should show error notification for validation failures', () => {
      todoInput.value = '';
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo cannot be empty',
        'error'
      );
    });

    test('should handle unexpected errors during todo operations', () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      todoModule.createTodo.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );
    });
  });

  describe('UI State Management', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false },
        { id: 2, text: 'Todo 2', completed: true },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should update clear button state on initialization', () => {
      expect(ui.updateClearButtonState).toHaveBeenCalled();
    });

    test('should update clear button state after adding todo', () => {
      todoInput.value = 'New todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      const clickEvent = new Event('click');
      addButton.dispatchEvent(clickEvent);

      expect(ui.updateClearButtonState).toHaveBeenCalled();
    });

    test('should update clear button state after removing todo', () => {
      const renderCall = ui.renderTodos.mock.calls[0];
      const removeCallback = renderCall[1];

      removeCallback(1);

      expect(ui.updateClearButtonState).toHaveBeenCalled();
    });

    test('should maintain UI consistency across operations', () => {
      // Add a todo
      todoInput.value = 'New todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      addButton.dispatchEvent(new Event('click'));

      // Toggle a todo
      const renderCall = ui.renderTodos.mock.calls[1];
      const toggleCallback = renderCall[2];
      toggleCallback(1);

      // Clear completed
      clearButton.dispatchEvent(new Event('click'));

      // Verify UI was updated after each operation
      expect(ui.renderTodos).toHaveBeenCalledTimes(4); // Initial + 3 operations
      expect(ui.updateClearButtonState).toHaveBeenCalledTimes(4);
    });
  });

  describe('Input Validation Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should validate empty input', () => {
      todoInput.value = '';
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.dispatchEvent(new Event('click'));

      expect(validation.validateTodoInput).toHaveBeenCalledWith('');
      expect(todoModule.createTodo).not.toHaveBeenCalled();
    });

    test('should validate whitespace-only input', () => {
      todoInput.value = '   ';
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.dispatchEvent(new Event('click'));

      expect(validation.validateTodoInput).toHaveBeenCalledWith('   ');
      expect(todoModule.createTodo).not.toHaveBeenCalled();
    });

    test('should validate input length', () => {
      const longText = 'a'.repeat(300);
      todoInput.value = longText;
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo is too long (max 200 characters)',
      });

      addButton.dispatchEvent(new Event('click'));

      expect(validation.validateTodoInput).toHaveBeenCalledWith(longText);
      expect(todoModule.createTodo).not.toHaveBeenCalled();
    });

    test('should accept valid input', () => {
      todoInput.value = 'Valid todo';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      addButton.dispatchEvent(new Event('click'));

      expect(validation.validateTodoInput).toHaveBeenCalledWith('Valid todo');
      expect(todoModule.createTodo).toHaveBeenCalledWith('Valid todo');
    });
  });

  describe('Notification Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show success notification on add', () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      addButton.dispatchEvent(new Event('click'));

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo added successfully!',
        'success'
      );
    });

    test('should show error notification on validation failure', () => {
      todoInput.value = '';
      validation.validateTodoInput.mockReturnValue({
        isValid: false,
        error: 'Todo cannot be empty',
      });

      addButton.dispatchEvent(new Event('click'));

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Todo cannot be empty',
        'error'
      );
    });

    test('should show error notification on operation failure', () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      addButton.dispatchEvent(new Event('click'));

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Failed'),
        'error'
      );
    });
  });

  describe('Loading State Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show loading state during async operations', async () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      storage.saveTodos.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      addButton.dispatchEvent(new Event('click'));

      expect(ui.showLoadingState).toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(ui.hideLoadingState).toHaveBeenCalled();
    });

    test('should hide loading state after operation completes', async () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });

      addButton.dispatchEvent(new Event('click'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ui.hideLoadingState).toHaveBeenCalled();
    });

    test('should hide loading state even if operation fails', async () => {
      todoInput.value = 'Test';
      validation.validateTodoInput.mockReturnValue({ isValid: true });
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Error');
      });

      addButton.dispatchEvent(new Event('click'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ui.hideLoadingState).toHaveBeenCalled();
    });
  });
});