/**
 * @jest-environment jsdom
 */

import { initializeApp } from '../app.js';
import * as storage from '../storage.js';
import * as ui from '../ui.js';

jest.mock('../storage.js');
jest.mock('../ui.js');

describe('App Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="todo-input" />
      <button id="add-btn">Add</button>
      <ul id="todo-list"></ul>
    `;
    jest.clearAllMocks();
  });

  test('should initialize app and load todos', () => {
    const _todoList = initializeApp();
    expect(storage.loadTodos).toHaveBeenCalled();
  });

  test('should render initial todos', () => {
    const mockTodos = [
      { id: '1', text: 'Test todo', completed: false },
    ];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    expect(ui.renderTodos).toHaveBeenCalledWith(mockTodos);
  });

  test('should setup event listeners', () => {
    initializeApp();

    const addBtn = document.getElementById('add-btn');
    const input = document.getElementById('todo-input');

    expect(addBtn).toBeTruthy();
    expect(input).toBeTruthy();

    // Simulate click
    addBtn.click();
    expect(ui.showError).toHaveBeenCalledWith(expect.any(String));
  });

  test('should handle add todo with valid input', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);
    storage.saveTodos.mockImplementation(() => {});

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'New todo';
    addBtn.click();

    expect(storage.saveTodos).toHaveBeenCalled();
    expect(ui.renderTodos).toHaveBeenCalled();
  });

  test('should handle add todo with empty input', () => {
    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = '';
    addBtn.click();

    expect(ui.showError).toHaveBeenCalledWith('Please enter a todo item');
  });

  test('should handle add todo with whitespace only', () => {
    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = '   ';
    addBtn.click();

    expect(ui.showError).toHaveBeenCalledWith('Please enter a todo item');
  });

  test('should handle Enter key press', () => {
    initializeApp();

    const input = document.getElementById('todo-input');
    input.value = 'New todo';

    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    input.dispatchEvent(event);

    expect(storage.saveTodos).toHaveBeenCalled();
  });

  test('should handle todo removal', () => {
    const mockTodos = [
      { id: '1', text: 'Test todo', completed: false },
    ];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    // Simulate remove button click
    const removeBtn = document.createElement('button');
    removeBtn.dataset.id = '1';
    removeBtn.className = 'remove-btn';
    document.body.appendChild(removeBtn);

    removeBtn.click();

    expect(storage.saveTodos).toHaveBeenCalled();
  });

  test('should handle todo toggle', () => {
    const mockTodos = [
      { id: '1', text: 'Test todo', completed: false },
    ];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    // Simulate checkbox click
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.id = '1';
    checkbox.className = 'todo-checkbox';
    document.body.appendChild(checkbox);

    checkbox.click();

    expect(storage.saveTodos).toHaveBeenCalled();
  });

  test('should handle storage errors gracefully', () => {
    storage.loadTodos.mockImplementation(() => {
      throw new Error('Storage error');
    });

    expect(() => initializeApp()).not.toThrow();
    expect(ui.showError).toHaveBeenCalledWith(
      expect.stringContaining('error')
    );
  });

  test('should validate todo length', () => {
    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    // Test max length
    input.value = 'a'.repeat(201);
    addBtn.click();

    expect(ui.showError).toHaveBeenCalledWith(
      expect.stringContaining('200')
    );
  });

  test('should trim todo text', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = '  Test todo  ';
    addBtn.click();

    expect(storage.saveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Test todo',
        }),
      ])
    );
  });

  test('should prevent duplicate todos', () => {
    const mockTodos = [
      { id: '1', text: 'Test todo', completed: false },
    ];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'Test todo';
    addBtn.click();

    expect(ui.showError).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );
  });

  test('should handle rapid clicks', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'Test todo';

    // Simulate rapid clicks
    addBtn.click();
    addBtn.click();
    addBtn.click();

    // Should only add once
    expect(storage.saveTodos).toHaveBeenCalledTimes(1);
  });

  test('should clear input after successful add', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'Test todo';
    addBtn.click();

    expect(input.value).toBe('');
  });

  test('should focus input after add', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'Test todo';
    addBtn.click();

    expect(document.activeElement).toBe(input);
  });

  test('should show success message after add', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = 'Test todo';
    addBtn.click();

    expect(ui.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('added')
    );
  });

  test('should handle special characters in todo text', () => {
    const mockTodos = [];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');

    input.value = '<script>alert("xss")</script>';
    addBtn.click();

    expect(storage.saveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.not.stringContaining('<script>'),
        }),
      ])
    );
  });

  test('should maintain todo order', () => {
    const mockTodos = [
      { id: '1', text: 'First', completed: false },
      { id: '2', text: 'Second', completed: false },
    ];
    storage.loadTodos.mockReturnValue(mockTodos);

    initializeApp();

    expect(ui.renderTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ text: 'First' }),
        expect.objectContaining({ text: 'Second' }),
      ])
    );
  });

  test('should handle empty todo list', () => {
    storage.loadTodos.mockReturnValue([]);

    initializeApp();

    expect(ui.renderTodos).toHaveBeenCalledWith([]);
  });

  test('should handle malformed todo data', () => {
    storage.loadTodos.mockReturnValue([
      { id: '1' }, // Missing text and completed
      { text: 'Test' }, // Missing id and completed
    ]);

    expect(() => initializeApp()).not.toThrow();
  });
});