/**
 * Integration Tests for Main Application Module
 * 
 * Comprehensive test suite for app.js covering initialization, user workflows,
 * event handling, feature flags, and error scenarios. Tests the complete integration
 * of storage, business logic, and UI modules.
 * 
 * @module src/__tests__/app.test
 */

import { init, handleAddTodo, handleDeleteTodo, isFeatureEnabled } from '../app.js';
import * as storage from '../storage.js';
import * as todo from '../todo.js';
import * as ui from '../ui.js';

/**
 * Mock modules for isolated testing
 */
jest.mock('../storage.js');
jest.mock('../todo.js');
jest.mock('../ui.js');

/**
 * Test fixture data
 */
const mockTodos = [
  {
    id: 'test-id-1',
    text: 'Test todo 1',
    timestamp: '2025-01-08T12:00:00.000Z'
  },
  {
    id: 'test-id-2',
    text: 'Test todo 2',
    timestamp: '2025-01-08T12:01:00.000Z'
  }
];

/**
 * Setup DOM structure before each test
 */
function setupDOM() {
  document.body.innerHTML = `
    <div class="container">
      <form id="todo-form">
        <input type="text" id="todo-input" placeholder="Enter a todo..." />
        <button type="submit">Add Todo</button>
      </form>
      <ul id="todo-list"></ul>
    </div>
  `;
}

/**
 * Simulate form submission event
 */
function simulateFormSubmit(inputValue = '') {
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  
  if (input && inputValue !== null) {
    input.value = inputValue;
  }
  
  const event = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
  
  return event;
}

/**
 * Simulate delete button click
 */
function simulateDeleteClick(todoId) {
  const deleteBtn = document.querySelector(`[data-testid="delete-btn-${todoId}"]`);
  if (!deleteBtn) {
    throw new Error(`Delete button not found for todo: ${todoId}`);
  }
  
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  deleteBtn.dispatchEvent(event);
  
  return event;
}

describe('App Module - Integration Tests', () => {
  
  beforeEach(() => {
    // Setup clean DOM
    setupDOM();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Setup default mock implementations
    storage.getTodos.mockReturnValue([]);
    storage.saveTodos.mockReturnValue(true);
    ui.renderTodos.mockImplementation(() => {});
    ui.clearInput.mockImplementation(() => {
      const input = document.getElementById('todo-input');
      if (input) input.value = '';
    });
    todo.createTodo.mockImplementation((text) => ({
      id: `mock-id-${Date.now()}`,
      text: text,
      timestamp: new Date().toISOString()
    }));
    todo.deleteTodo.mockImplementation((todos, id) => 
      todos.filter(t => t.id !== id)
    );
  });

  afterEach(() => {
    // Remove event listeners by replacing DOM
    document.body.innerHTML = '';
  });

  /**
   * Test Suite: init() function
   */
  describe('init()', () => {
    
    test('should load existing todos from storage on initialization', () => {
      // Arrange
      storage.getTodos.mockReturnValue(mockTodos);
      
      // Act
      init();
      
      // Assert
      expect(storage.getTodos).toHaveBeenCalledTimes(1);
      expect(ui.renderTodos).toHaveBeenCalledWith(mockTodos, expect.any(Function));
    });

    test('should render initial state with empty array when no todos exist', () => {
      // Arrange
      storage.getTodos.mockReturnValue([]);
      
      // Act
      init();
      
      // Assert
      expect(storage.getTodos).toHaveBeenCalledTimes(1);
      expect(ui.renderTodos).toHaveBeenCalledWith([], expect.any(Function));
    });

    test('should set up event listeners on form submit', () => {
      // Arrange
      const form = document.getElementById('todo-form');
      const addEventListenerSpy = jest.spyOn(form, 'addEventListener');
      
      // Act
      init();
      
      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function));
    });

    test('should handle storage errors gracefully and continue with empty array', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      storage.getTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      init();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalledWith([], expect.any(Function));
      
      consoleErrorSpy.mockRestore();
    });

    test('should throw error when form element is not found', () => {
      // Arrange
      document.body.innerHTML = '<div></div>'; // No form
      
      // Act & Assert
      expect(() => init()).toThrow('Todo form element not found');
    });

    test('should respect feature flag when disabled', () => {
      // Arrange
      localStorage.setItem('feature_todo_list_ui', 'off');
      
      // Act
      init();
      
      // Assert
      expect(storage.getTodos).not.toHaveBeenCalled();
      expect(ui.renderTodos).not.toHaveBeenCalled();
      
      const container = document.querySelector('.container');
      expect(container.innerHTML).toContain('Feature Disabled');
    });

    test('should enable feature by default when flag is not set', () => {
      // Arrange
      localStorage.removeItem('feature_todo_list_ui');
      
      // Act
      init();
      
      // Assert
      expect(storage.getTodos).toHaveBeenCalled();
      expect(ui.renderTodos).toHaveBeenCalled();
    });

    test('should focus input field after initialization', () => {
      // Arrange
      const input = document.getElementById('todo-input');
      const focusSpy = jest.spyOn(input, 'focus');
      
      // Act
      init();
      
      // Assert
      expect(focusSpy).toHaveBeenCalled();
    });

    test('should handle render errors and throw', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      ui.renderTodos.mockImplementation(() => {
        throw new Error('Render error');
      });
      
      // Act & Assert
      expect(() => init()).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * Test Suite: handleAddTodo() function
   */
  describe('handleAddTodo()', () => {
    
    beforeEach(() => {
      init(); // Initialize app with event listeners
    });

    test('should add new todo on form submit', () => {
      // Arrange
      const newTodo = {
        id: 'new-todo-id',
        text: 'New todo item',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      storage.getTodos.mockReturnValue([]);
      
      // Act
      simulateFormSubmit('New todo item');
      
      // Assert
      expect(todo.createTodo).toHaveBeenCalledWith('New todo item');
      expect(storage.saveTodos).toHaveBeenCalledWith([newTodo]);
    });

    test('should save todo to storage after creation', () => {
      // Arrange
      const newTodo = {
        id: 'new-todo-id',
        text: 'Test todo',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      storage.getTodos.mockReturnValue(mockTodos);
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(storage.saveTodos).toHaveBeenCalledWith([...mockTodos, newTodo]);
    });

    test('should update UI after adding todo', () => {
      // Arrange
      const newTodo = {
        id: 'new-todo-id',
        text: 'Test todo',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      storage.getTodos.mockReturnValue([]);
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(ui.renderTodos).toHaveBeenCalledWith([newTodo], expect.any(Function));
    });

    test('should clear input field after successful add', () => {
      // Arrange
      const newTodo = {
        id: 'new-todo-id',
        text: 'Test todo',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(ui.clearInput).toHaveBeenCalled();
    });

    test('should validate and reject empty input', () => {
      // Arrange
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Act
      simulateFormSubmit('   '); // Whitespace only
      
      // Assert
      expect(todo.createTodo).not.toHaveBeenCalled();
      expect(storage.saveTodos).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    test('should prevent default form submission behavior', () => {
      // Arrange
      const form = document.getElementById('todo-form');
      let defaultPrevented = false;
      
      form.addEventListener('submit', (e) => {
        defaultPrevented = e.defaultPrevented;
      });
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(defaultPrevented).toBe(true);
    });

    test('should handle createTodo errors gracefully', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      todo.createTodo.mockImplementation(() => {
        throw new Error('Create error');
      });
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(storage.saveTodos).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle storage save errors gracefully', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const newTodo = {
        id: 'new-todo-id',
        text: 'Test todo',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle save failure (returns false)', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const newTodo = {
        id: 'new-todo-id',
        text: 'Test todo',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      storage.saveTodos.mockReturnValue(false);
      
      // Act
      simulateFormSubmit('Test todo');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should throw error when input element is not found', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      document.getElementById('todo-input').remove();
      
      // Act
      const form = document.getElementById('todo-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle invalid input value type', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const input = document.getElementById('todo-input');
      Object.defineProperty(input, 'value', {
        get: () => 123, // Return number instead of string
        configurable: true
      });
      
      // Act
      simulateFormSubmit(null);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * Test Suite: handleDeleteTodo() function
   */
  describe('handleDeleteTodo()', () => {
    
    beforeEach(() => {
      storage.getTodos.mockReturnValue(mockTodos);
      init();
    });

    test('should remove todo from list', () => {
      // Arrange
      const todoIdToDelete = 'test-id-1';
      const expectedTodos = mockTodos.filter(t => t.id !== todoIdToDelete);
      
      // Act
      handleDeleteTodo(todoIdToDelete);
      
      // Assert
      expect(todo.deleteTodo).toHaveBeenCalledWith(mockTodos, todoIdToDelete);
      expect(storage.saveTodos).toHaveBeenCalledWith(expectedTodos);
    });

    test('should update storage after deletion', () => {
      // Arrange
      const todoIdToDelete = 'test-id-2';
      const expectedTodos = [mockTodos[0]];
      
      // Act
      handleDeleteTodo(todoIdToDelete);
      
      // Assert
      expect(storage.saveTodos).toHaveBeenCalledWith(expectedTodos);
    });

    test('should re-render UI after deletion', () => {
      // Arrange
      const todoIdToDelete = 'test-id-1';
      const expectedTodos = mockTodos.filter(t => t.id !== todoIdToDelete);
      
      // Act
      handleDeleteTodo(todoIdToDelete);
      
      // Assert
      expect(ui.renderTodos).toHaveBeenCalledWith(expectedTodos, expect.any(Function));
    });

    test('should handle deletion of non-existent todo gracefully', () => {
      // Arrange
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const nonExistentId = 'non-existent-id';
      
      // Act
      handleDeleteTodo(nonExistentId);
      
      // Assert
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(storage.saveTodos).not.toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    test('should throw TypeError for invalid id type', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act & Assert
      expect(() => handleDeleteTodo(123)).toThrow(TypeError);
      expect(() => handleDeleteTodo(null)).toThrow(TypeError);
      expect(() => handleDeleteTodo(undefined)).toThrow(TypeError);
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle storage retrieval errors', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      storage.getTodos.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      handleDeleteTodo('test-id-1');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle deleteTodo errors', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      todo.deleteTodo.mockImplementation(() => {
        throw new Error('Delete error');
      });
      
      // Act
      handleDeleteTodo('test-id-1');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle save errors after deletion', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      storage.saveTodos.mockImplementation(() => {
        throw new Error('Save error');
      });
      
      // Act
      handleDeleteTodo('test-id-1');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle save failure (returns false)', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      storage.saveTodos.mockReturnValue(false);
      
      // Act
      handleDeleteTodo('test-id-1');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * Test Suite: isFeatureEnabled() function
   */
  describe('isFeatureEnabled()', () => {
    
    test('should return true when feature flag is not set', () => {
      // Arrange
      localStorage.removeItem('feature_todo_list_ui');
      
      // Act
      const result = isFeatureEnabled();
      
      // Assert
      expect(result).toBe(true);
    });

    test('should return true when feature flag is set to any value except "off"', () => {
      // Arrange
      localStorage.setItem('feature_todo_list_ui', 'on');
      
      // Act
      const result = isFeatureEnabled();
      
      // Assert
      expect(result).toBe(true);
    });

    test('should return false when feature flag is set to "off"', () => {
      // Arrange
      localStorage.setItem('feature_todo_list_ui', 'off');
      
      // Act
      const result = isFeatureEnabled();
      
      // Assert
      expect(result).toBe(false);
    });

    test('should handle localStorage errors and default to enabled', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = isFeatureEnabled();
      
      // Assert
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  /**
   * Test Suite: End-to-End Workflow
   */
  describe('End-to-End Workflow', () => {
    
    test('should add multiple todos and maintain order', () => {
      // Arrange
      init();
      const todos = [];
      
      // Mock progressive state
      storage.getTodos.mockImplementation(() => [...todos]);
      todo.createTodo.mockImplementation((text) => {
        const newTodo = {
          id: `todo-${todos.length + 1}`,
          text: text,
          timestamp: new Date().toISOString()
        };
        todos.push(newTodo);
        return newTodo;
      });
      
      // Act
      simulateFormSubmit('First todo');
      simulateFormSubmit('Second todo');
      simulateFormSubmit('Third todo');
      
      // Assert
      expect(todos).toHaveLength(3);
      expect(todos[0].text).toBe('First todo');
      expect(todos[1].text).toBe('Second todo');
      expect(todos[2].text).toBe('Third todo');
    });

    test('should delete specific todo and maintain remaining todos', () => {
      // Arrange
      let currentTodos = [...mockTodos];
      storage.getTodos.mockImplementation(() => currentTodos);
      todo.deleteTodo.mockImplementation((todos, id) => {
        currentTodos = todos.filter(t => t.id !== id);
        return currentTodos;
      });
      
      init();
      
      // Act
      handleDeleteTodo('test-id-1');
      
      // Assert
      expect(currentTodos).toHaveLength(1);
      expect(currentTodos[0].id).toBe('test-id-2');
    });

    test('should verify persistence after add and delete operations', () => {
      // Arrange
      let storedTodos = [];
      storage.getTodos.mockImplementation(() => [...storedTodos]);
      storage.saveTodos.mockImplementation((todos) => {
        storedTodos = [...todos];
        return true;
      });
      
      const newTodo = {
        id: 'new-todo',
        text: 'New item',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      
      init();
      
      // Act - Add todo
      simulateFormSubmit('New item');
      
      // Assert - Verify stored
      expect(storedTodos).toHaveLength(1);
      expect(storedTodos[0].id).toBe('new-todo');
      
      // Act - Delete todo
      handleDeleteTodo('new-todo');
      
      // Assert - Verify removed from storage
      expect(storedTodos).toHaveLength(0);
    });

    test('should handle complete workflow with errors and recovery', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      let callCount = 0;
      
      storage.saveTodos.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First save fails');
        }
        return true;
      });
      
      const newTodo = {
        id: 'new-todo',
        text: 'Test item',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      
      init();
      
      // Act - First attempt fails
      simulateFormSubmit('Test item');
      
      // Assert - Error logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Act - Second attempt succeeds
      simulateFormSubmit('Test item');
      
      // Assert - Success
      expect(storage.saveTodos).toHaveBeenCalledTimes(2);
      
      consoleErrorSpy.mockRestore();
    });

    test('should maintain data integrity across multiple operations', () => {
      // Arrange
      let currentTodos = [];
      storage.getTodos.mockImplementation(() => [...currentTodos]);
      storage.saveTodos.mockImplementation((todos) => {
        currentTodos = [...todos];
        return true;
      });
      
      todo.createTodo.mockImplementation((text) => ({
        id: `id-${Date.now()}-${Math.random()}`,
        text: text,
        timestamp: new Date().toISOString()
      }));
      
      init();
      
      // Act - Add multiple todos
      simulateFormSubmit('Todo 1');
      simulateFormSubmit('Todo 2');
      simulateFormSubmit('Todo 3');
      
      const firstTodoId = currentTodos[0].id;
      
      // Act - Delete middle todo
      handleDeleteTodo(currentTodos[1].id);
      
      // Assert - Verify integrity
      expect(currentTodos).toHaveLength(2);
      expect(currentTodos[0].id).toBe(firstTodoId);
      expect(currentTodos[0].text).toBe('Todo 1');
      expect(currentTodos[1].text).toBe('Todo 3');
    });
  });

  /**
   * Test Suite: Coverage Edge Cases
   */
  describe('Edge Cases and Error Scenarios', () => {
    
    test('should handle rapid successive add operations', () => {
      // Arrange
      init();
      const todos = [];
      storage.getTodos.mockImplementation(() => [...todos]);
      todo.createTodo.mockImplementation((text) => {
        const newTodo = {
          id: `todo-${Date.now()}-${Math.random()}`,
          text: text,
          timestamp: new Date().toISOString()
        };
        todos.push(newTodo);
        return newTodo;
      });
      
      // Act
      for (let i = 0; i < 10; i++) {
        simulateFormSubmit(`Todo ${i}`);
      }
      
      // Assert
      expect(todos).toHaveLength(10);
      expect(storage.saveTodos).toHaveBeenCalledTimes(10);
    });

    test('should handle special characters in todo text', () => {
      // Arrange
      init();
      const specialText = '<script>alert("xss")</script>';
      const sanitizedTodo = {
        id: 'special-id',
        text: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(sanitizedTodo);
      
      // Act
      simulateFormSubmit(specialText);
      
      // Assert
      expect(todo.createTodo).toHaveBeenCalledWith(specialText);
      expect(storage.saveTodos).toHaveBeenCalled();
    });

    test('should handle very long todo text', () => {
      // Arrange
      init();
      const longText = 'A'.repeat(1000);
      const longTodo = {
        id: 'long-id',
        text: longText,
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(longTodo);
      
      // Act
      simulateFormSubmit(longText);
      
      // Assert
      expect(todo.createTodo).toHaveBeenCalledWith(longText);
      expect(storage.saveTodos).toHaveBeenCalled();
    });

    test('should handle render errors gracefully', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      ui.renderTodos.mockImplementation(() => {
        throw new Error('Render failed');
      });
      
      const newTodo = {
        id: 'new-id',
        text: 'Test',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      
      init();
      
      // Act
      simulateFormSubmit('Test');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle clearInput errors gracefully', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      ui.clearInput.mockImplementation(() => {
        throw new Error('Clear failed');
      });
      
      const newTodo = {
        id: 'new-id',
        text: 'Test',
        timestamp: '2025-01-08T12:30:00.000Z'
      };
      todo.createTodo.mockReturnValue(newTodo);
      
      init();
      
      // Act
      simulateFormSubmit('Test');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});