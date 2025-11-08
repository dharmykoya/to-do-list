/**
 * @jest-environment jsdom
 */

import { initializeApp } from '../app.js';
import * as storage from '../storage.js';
import * as ui from '../ui.js';
import * as todoModule from '../todo.js';
import * as validation from '../validation.js';
import * as notifications from '../notifications.js';

// Mock all dependencies
jest.mock('../storage.js');
jest.mock('../ui.js');
jest.mock('../todo.js');
jest.mock('../validation.js');
jest.mock('../notifications.js');

describe('App Integration Tests', () => {
  let mockTodoInput;
  let mockAddButton;
  let mockTodoList;
  let mockFilterButtons;
  let mockClearButton;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = `
      <div class="container">
        <div class="input-section">
          <input type="text" id="todo-input" placeholder="Add a new task..." />
          <button id="add-btn">Add</button>
        </div>
        <div class="filter-section">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
        </div>
        <ul id="todo-list"></ul>
        <div class="footer">
          <button id="clear-completed">Clear Completed</button>
        </div>
        <div id="notification-container"></div>
      </div>
    `;

    mockTodoInput = document.getElementById('todo-input');
    mockAddButton = document.getElementById('add-btn');
    mockTodoList = document.getElementById('todo-list');
    mockFilterButtons = document.querySelectorAll('.filter-btn');
    mockClearButton = document.getElementById('clear-completed');

    // Setup default mock implementations
    storage.loadTodos.mockReturnValue([]);
    storage.saveTodos.mockImplementation(() => {});
    ui.renderTodos.mockImplementation(() => {});
    ui.updateStats.mockImplementation(() => {});
    ui.showError.mockImplementation(() => {});
    ui.clearError.mockImplementation(() => {});
    ui.setLoading.mockImplementation(() => {});
    validation.validateTodoText.mockReturnValue({ isValid: true });
    validation.sanitizeInput.mockImplementation((text) => text);
    notifications.showNotification.mockImplementation(() => {});
  });

  describe('Initialization', () => {
    test('should initialize app and load todos', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);

      initializeApp();

      expect(storage.loadTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalledWith(mockTodos, 'all');
      expect(ui.updateStats).toHaveBeenCalledWith(mockTodos);
    });

    test('should handle empty todo list on initialization', () => {
      storage.loadTodos.mockReturnValue([]);

      initializeApp();

      expect(storage.loadTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalledWith([], 'all');
      expect(ui.updateStats).toHaveBeenCalledWith([]);
    });

    test('should setup event listeners on initialization', () => {
      initializeApp();

      // Verify event listeners are attached by triggering events
      const clickEvent = new Event('click');
      mockAddButton.dispatchEvent(clickEvent);

      // Should attempt to add todo (even if validation fails)
      expect(validation.validateTodoText).toHaveBeenCalled();
    });
  });

  describe('Adding Todos', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should add valid todo', () => {
      const todoText = 'New test todo';
      mockTodoInput.value = todoText;

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue(todoText);
      todoModule.createTodo.mockReturnValue({
        id: 1,
        text: todoText,
        completed: false,
        createdAt: Date.now(),
      });

      mockAddButton.click();

      expect(validation.validateTodoText).toHaveBeenCalledWith(todoText);
      expect(validation.sanitizeInput).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(todoText);
      expect(storage.saveTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalled();
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task added successfully!',
        'success'
      );
      expect(mockTodoInput.value).toBe('');
    });

    test('should not add invalid todo', () => {
      const todoText = '';
      mockTodoInput.value = todoText;

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task cannot be empty',
      });

      mockAddButton.click();

      expect(validation.validateTodoText).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).not.toHaveBeenCalled();
      expect(storage.saveTodos).not.toHaveBeenCalled();
      expect(ui.showError).toHaveBeenCalledWith('Task cannot be empty');
    });

    test('should handle async validation with loading state', async () => {
      const todoText = 'Test todo';
      mockTodoInput.value = todoText;

      validation.validateTodoText.mockReturnValue(
        new Promise((_resolve) => {})
      );

      mockAddButton.click();

      expect(ui.setLoading).toHaveBeenCalledWith(true);
    });

    test('should sanitize input before adding', () => {
      const dirtyText = '<script>alert("xss")</script>Clean text';
      const cleanText = 'Clean text';
      mockTodoInput.value = dirtyText;

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue(cleanText);
      todoModule.createTodo.mockReturnValue({
        id: 1,
        text: cleanText,
        completed: false,
        createdAt: Date.now(),
      });

      mockAddButton.click();

      expect(validation.sanitizeInput).toHaveBeenCalledWith(dirtyText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(cleanText);
    });

    test('should add todo on Enter key press', () => {
      const todoText = 'New test todo';
      mockTodoInput.value = todoText;

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue(todoText);

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      mockTodoInput.dispatchEvent(enterEvent);

      expect(validation.validateTodoText).toHaveBeenCalledWith(todoText);
    });

    test('should trim whitespace from input', () => {
      const todoText = '  Test todo  ';
      const trimmedText = 'Test todo';
      mockTodoInput.value = todoText;

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue(trimmedText);
      todoModule.createTodo.mockReturnValue({
        id: 1,
        text: trimmedText,
        completed: false,
        createdAt: Date.now(),
      });

      mockAddButton.click();

      expect(validation.sanitizeInput).toHaveBeenCalledWith(todoText);
      expect(todoModule.createTodo).toHaveBeenCalledWith(trimmedText);
    });
  });

  describe('Validation Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show error for empty input', () => {
      mockTodoInput.value = '';

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task cannot be empty',
      });

      mockAddButton.click();

      expect(ui.showError).toHaveBeenCalledWith('Task cannot be empty');
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task cannot be empty',
        'error'
      );
    });

    test('should show error for too long input', () => {
      const longText = 'a'.repeat(201);
      mockTodoInput.value = longText;

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task is too long (max 200 characters)',
      });

      mockAddButton.click();

      expect(ui.showError).toHaveBeenCalledWith(
        'Task is too long (max 200 characters)'
      );
    });

    test('should show error for whitespace-only input', () => {
      mockTodoInput.value = '   ';

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task cannot be empty',
      });

      mockAddButton.click();

      expect(ui.showError).toHaveBeenCalledWith('Task cannot be empty');
    });

    test('should clear error on valid input', () => {
      mockTodoInput.value = 'Valid todo';

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue('Valid todo');

      mockAddButton.click();

      expect(ui.clearError).toHaveBeenCalled();
    });

    test('should validate on input change', () => {
      mockTodoInput.value = 'Test';

      const inputEvent = new Event('input');
      mockTodoInput.dispatchEvent(inputEvent);

      expect(validation.validateTodoText).toHaveBeenCalledWith('Test');
    });
  });

  describe('Toggling Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should toggle todo completion', () => {
      const todoId = 1;
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);

      todoModule.toggleTodo.mockImplementation((todos, id) => {
        const todo = todos.find((t) => t.id === id);
        if (todo) todo.completed = !todo.completed;
        return todos;
      });

      // Simulate toggle event
      const toggleEvent = new CustomEvent('toggleTodo', { detail: { id: todoId } });
      document.dispatchEvent(toggleEvent);

      expect(todoModule.toggleTodo).toHaveBeenCalledWith(
        expect.any(Array),
        todoId
      );
    });

    test('should update UI after toggling', () => {
      const todoId = 1;
      const updatedTodos = [
        { id: 1, text: 'Test todo', completed: true, createdAt: Date.now() },
      ];

      todoModule.toggleTodo.mockReturnValue(updatedTodos);

      const toggleEvent = new CustomEvent('toggleTodo', { detail: { id: todoId } });
      document.dispatchEvent(toggleEvent);

      expect(storage.saveTodos).toHaveBeenCalledWith(updatedTodos);
      expect(ui.renderTodos).toHaveBeenCalled();
      expect(ui.updateStats).toHaveBeenCalled();
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should delete todo', () => {
      const todoId = 1;
      const updatedTodos = [];

      todoModule.deleteTodo.mockReturnValue(updatedTodos);

      const deleteEvent = new CustomEvent('deleteTodo', { detail: { id: todoId } });
      document.dispatchEvent(deleteEvent);

      expect(todoModule.deleteTodo).toHaveBeenCalledWith(
        expect.any(Array),
        todoId
      );
      expect(storage.saveTodos).toHaveBeenCalledWith(updatedTodos);
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task deleted successfully!',
        'success'
      );
    });

    test('should update UI after deleting', () => {
      const todoId = 1;
      const updatedTodos = [];

      todoModule.deleteTodo.mockReturnValue(updatedTodos);

      const deleteEvent = new CustomEvent('deleteTodo', { detail: { id: todoId } });
      document.dispatchEvent(deleteEvent);

      expect(ui.renderTodos).toHaveBeenCalled();
      expect(ui.updateStats).toHaveBeenCalled();
    });
  });

  describe('Editing Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should edit todo with valid text', () => {
      const todoId = 1;
      const newText = 'Updated todo';

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue(newText);
      todoModule.editTodo.mockReturnValue([
        { id: 1, text: newText, completed: false, createdAt: Date.now() },
      ]);

      const editEvent = new CustomEvent('editTodo', {
        detail: { id: todoId, text: newText },
      });
      document.dispatchEvent(editEvent);

      expect(validation.validateTodoText).toHaveBeenCalledWith(newText);
      expect(validation.sanitizeInput).toHaveBeenCalledWith(newText);
      expect(todoModule.editTodo).toHaveBeenCalledWith(
        expect.any(Array),
        todoId,
        newText
      );
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task updated successfully!',
        'success'
      );
    });

    test('should not edit todo with invalid text', () => {
      const todoId = 1;
      const newText = '';

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task cannot be empty',
      });

      const editEvent = new CustomEvent('editTodo', {
        detail: { id: todoId, text: newText },
      });
      document.dispatchEvent(editEvent);

      expect(todoModule.editTodo).not.toHaveBeenCalled();
      expect(ui.showError).toHaveBeenCalledWith('Task cannot be empty');
    });
  });

  describe('Filtering Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Active todo', completed: false, createdAt: Date.now() },
        { id: 2, text: 'Completed todo', completed: true, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should filter to show all todos', () => {
      const allButton = mockFilterButtons[0];
      allButton.click();

      expect(ui.renderTodos).toHaveBeenCalledWith(expect.any(Array), 'all');
    });

    test('should filter to show active todos', () => {
      const activeButton = mockFilterButtons[1];
      activeButton.click();

      expect(ui.renderTodos).toHaveBeenCalledWith(expect.any(Array), 'active');
    });

    test('should filter to show completed todos', () => {
      const completedButton = mockFilterButtons[2];
      completedButton.click();

      expect(ui.renderTodos).toHaveBeenCalledWith(
        expect.any(Array),
        'completed'
      );
    });

    test('should update active filter button', () => {
      const activeButton = mockFilterButtons[1];
      activeButton.click();

      expect(activeButton.classList.contains('active')).toBe(true);
      expect(mockFilterButtons[0].classList.contains('active')).toBe(false);
    });
  });

  describe('Clearing Completed Todos', () => {
    beforeEach(() => {
      const mockTodos = [
        { id: 1, text: 'Active todo', completed: false, createdAt: Date.now() },
        { id: 2, text: 'Completed todo', completed: true, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();
    });

    test('should clear completed todos', () => {
      const activeTodos = [
        { id: 1, text: 'Active todo', completed: false, createdAt: Date.now() },
      ];

      todoModule.clearCompleted.mockReturnValue(activeTodos);

      mockClearButton.click();

      expect(todoModule.clearCompleted).toHaveBeenCalledWith(expect.any(Array));
      expect(storage.saveTodos).toHaveBeenCalledWith(activeTodos);
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Completed tasks cleared!',
        'success'
      );
    });

    test('should update UI after clearing completed', () => {
      const activeTodos = [
        { id: 1, text: 'Active todo', completed: false, createdAt: Date.now() },
      ];

      todoModule.clearCompleted.mockReturnValue(activeTodos);

      mockClearButton.click();

      expect(ui.renderTodos).toHaveBeenCalled();
      expect(ui.updateStats).toHaveBeenCalled();
    });

    test('should handle no completed todos', () => {
      const allActiveTodos = [
        { id: 1, text: 'Active todo', completed: false, createdAt: Date.now() },
      ];

      storage.loadTodos.mockReturnValue(allActiveTodos);
      todoModule.clearCompleted.mockReturnValue(allActiveTodos);

      mockClearButton.click();

      expect(storage.saveTodos).toHaveBeenCalledWith(allActiveTodos);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should handle storage errors gracefully', () => {
      storage.loadTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Re-initialize to trigger error
      expect(() => initializeApp()).not.toThrow();
    });

    test('should show notification on storage save error', () => {
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Save error');
      });

      mockTodoInput.value = 'Test todo';
      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue('Test todo');

      mockAddButton.click();

      expect(notifications.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('error'),
        'error'
      );
    });

    test('should handle validation errors', () => {
      mockTodoInput.value = 'Test';

      validation.validateTodoText.mockImplementation(() => {
        throw new Error('Validation error');
      });

      expect(() => mockAddButton.click()).not.toThrow();
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show loading state during async operations', async () => {
      mockTodoInput.value = 'Test todo';

      validation.validateTodoText.mockReturnValue(
        new Promise((resolve) => setTimeout(() => resolve({ isValid: true }), 100))
      );

      mockAddButton.click();

      expect(ui.setLoading).toHaveBeenCalledWith(true);
    });

    test('should hide loading state after operation completes', async () => {
      mockTodoInput.value = 'Test todo';

      validation.validateTodoText.mockResolvedValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue('Test todo');

      await mockAddButton.click();

      expect(ui.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Notification Integration', () => {
    beforeEach(() => {
      initializeApp();
    });

    test('should show success notification on add', () => {
      mockTodoInput.value = 'Test todo';

      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue('Test todo');
      todoModule.createTodo.mockReturnValue({
        id: 1,
        text: 'Test todo',
        completed: false,
        createdAt: Date.now(),
      });

      mockAddButton.click();

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task added successfully!',
        'success'
      );
    });

    test('should show error notification on validation failure', () => {
      mockTodoInput.value = '';

      validation.validateTodoText.mockReturnValue({
        isValid: false,
        error: 'Task cannot be empty',
      });

      mockAddButton.click();

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task cannot be empty',
        'error'
      );
    });

    test('should show success notification on delete', () => {
      const todoId = 1;
      todoModule.deleteTodo.mockReturnValue([]);

      const deleteEvent = new CustomEvent('deleteTodo', { detail: { id: todoId } });
      document.dispatchEvent(deleteEvent);

      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Task deleted successfully!',
        'success'
      );
    });
  });

  describe('Stats Updates', () => {
    test('should update stats after adding todo', () => {
      initializeApp();

      mockTodoInput.value = 'Test todo';
      validation.validateTodoText.mockReturnValue({ isValid: true });
      validation.sanitizeInput.mockReturnValue('Test todo');
      todoModule.createTodo.mockReturnValue({
        id: 1,
        text: 'Test todo',
        completed: false,
        createdAt: Date.now(),
      });

      mockAddButton.click();

      expect(ui.updateStats).toHaveBeenCalled();
    });

    test('should update stats after toggling todo', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();

      const todoId = 1;
      todoModule.toggleTodo.mockReturnValue([
        { id: 1, text: 'Test todo', completed: true, createdAt: Date.now() },
      ]);

      const toggleEvent = new CustomEvent('toggleTodo', { detail: { id: todoId } });
      document.dispatchEvent(toggleEvent);

      expect(ui.updateStats).toHaveBeenCalled();
    });

    test('should update stats after deleting todo', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];
      storage.loadTodos.mockReturnValue(mockTodos);
      initializeApp();

      const todoId = 1;
      todoModule.deleteTodo.mockReturnValue([]);

      const deleteEvent = new CustomEvent('deleteTodo', { detail: { id: todoId } });
      document.dispatchEvent(deleteEvent);

      expect(ui.updateStats).toHaveBeenCalled();
    });
  });
});