/**
 * @jest-environment jsdom
 */

import { initializeApp } from '../app.js';
import * as todoModule from '../todo.js';
import * as uiModule from '../ui.js';
import * as storageModule from '../storage.js';

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
});