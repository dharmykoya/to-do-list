/**
 * @jest-environment jsdom
 */

import { loadTodos, saveTodos, clearStorage } from '../storage.js';

describe('Storage Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadTodos', () => {
    test('should return empty array when no todos exist', () => {
      const todos = loadTodos();
      expect(todos).toEqual([]);
      expect(Array.isArray(todos)).toBe(true);
    });

    test('should load todos from localStorage', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo 1', completed: false, createdAt: Date.now() },
        { id: 2, text: 'Test todo 2', completed: true, createdAt: Date.now() },
      ];

      localStorage.setItem('todos', JSON.stringify(mockTodos));

      const todos = loadTodos();
      expect(todos).toEqual(mockTodos);
      expect(todos).toHaveLength(2);
    });

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('todos', 'invalid json');

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('should handle null localStorage data', () => {
      localStorage.setItem('todos', null);

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('should handle undefined localStorage data', () => {
      localStorage.setItem('todos', undefined);

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('should return empty array if localStorage throws error', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('should parse valid JSON array', () => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false, createdAt: 1234567890 },
      ];
      localStorage.setItem('todos', JSON.stringify(mockTodos));

      const todos = loadTodos();
      expect(todos).toEqual(mockTodos);
    });

    test('should handle empty string in localStorage', () => {
      localStorage.setItem('todos', '');

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });
  });

  describe('saveTodos', () => {
    test('should save todos to localStorage', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);

      const stored = localStorage.getItem('todos');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored)).toEqual(mockTodos);
    });

    test('should save empty array', () => {
      saveTodos([]);

      const stored = localStorage.getItem('todos');
      expect(stored).toBe('[]');
    });

    test('should overwrite existing todos', () => {
      const oldTodos = [
        { id: 1, text: 'Old todo', completed: false, createdAt: Date.now() },
      ];
      const newTodos = [
        { id: 2, text: 'New todo', completed: false, createdAt: Date.now() },
      ];

      saveTodos(oldTodos);
      saveTodos(newTodos);

      const stored = localStorage.getItem('todos');
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual(newTodos);
      expect(parsed).not.toEqual(oldTodos);
    });

    test('should handle saving multiple todos', () => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false, createdAt: Date.now() },
        { id: 2, text: 'Todo 2', completed: true, createdAt: Date.now() },
        { id: 3, text: 'Todo 3', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);

      const stored = localStorage.getItem('todos');
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(3);
      expect(parsed).toEqual(mockTodos);
    });

    test('should throw error if localStorage is full', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveTodos([{ id: 1, text: 'Test' }])).toThrow();
    });

    test('should save todos with special characters', () => {
      const mockTodos = [
        {
          id: 1,
          text: 'Todo with special chars: !@#$%^&*()',
          completed: false,
          createdAt: Date.now(),
        },
      ];

      saveTodos(mockTodos);

      const stored = localStorage.getItem('todos');
      const parsed = JSON.parse(stored);
      expect(parsed[0].text).toBe('Todo with special chars: !@#$%^&*()');
    });

    test('should save todos with unicode characters', () => {
      const mockTodos = [
        {
          id: 1,
          text: 'Todo with unicode: 你好 🎉',
          completed: false,
          createdAt: Date.now(),
        },
      ];

      saveTodos(mockTodos);

      const stored = localStorage.getItem('todos');
      const parsed = JSON.parse(stored);
      expect(parsed[0].text).toBe('Todo with unicode: 你好 🎉');
    });
  });

  describe('clearStorage', () => {
    test('should clear all todos from localStorage', () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);
      expect(localStorage.getItem('todos')).toBeTruthy();

      clearStorage();
      expect(localStorage.getItem('todos')).toBeNull();
    });

    test('should not throw error if storage is already empty', () => {
      expect(() => clearStorage()).not.toThrow();
    });

    test('should only clear todos key', () => {
      localStorage.setItem('todos', JSON.stringify([]));
      localStorage.setItem('other-key', 'other-value');

      clearStorage();

      expect(localStorage.getItem('todos')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('other-value');
    });
  });

  describe('Integration Tests', () => {
    test('should maintain data integrity through save and load cycle', () => {
      const mockTodos = [
        { id: 1, text: 'Todo 1', completed: false, createdAt: 1234567890 },
        { id: 2, text: 'Todo 2', completed: true, createdAt: 1234567891 },
      ];

      saveTodos(mockTodos);
      const loadedTodos = loadTodos();

      expect(loadedTodos).toEqual(mockTodos);
      expect(loadedTodos[0].id).toBe(mockTodos[0].id);
      expect(loadedTodos[0].text).toBe(mockTodos[0].text);
      expect(loadedTodos[0].completed).toBe(mockTodos[0].completed);
      expect(loadedTodos[0].createdAt).toBe(mockTodos[0].createdAt);
    });

    test('should handle multiple save and load operations', () => {
      const todos1 = [{ id: 1, text: 'First', completed: false, createdAt: Date.now() }];
      const todos2 = [{ id: 2, text: 'Second', completed: false, createdAt: Date.now() }];
      const todos3 = [{ id: 3, text: 'Third', completed: false, createdAt: Date.now() }];

      saveTodos(todos1);
      expect(loadTodos()).toEqual(todos1);

      saveTodos(todos2);
      expect(loadTodos()).toEqual(todos2);

      saveTodos(todos3);
      expect(loadTodos()).toEqual(todos3);
    });

    test('should handle clear and reload', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);
      expect(loadTodos()).toEqual(mockTodos);

      clearStorage();
      expect(loadTodos()).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large todo list', () => {
      const largeTodoList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        text: `Todo ${i + 1}`,
        completed: i % 2 === 0,
        createdAt: Date.now() + i,
      }));

      saveTodos(largeTodoList);
      const loaded = loadTodos();

      expect(loaded).toHaveLength(1000);
      expect(loaded[0]).toEqual(largeTodoList[0]);
      expect(loaded[999]).toEqual(largeTodoList[999]);
    });

    test('should handle todos with very long text', () => {
      const longText = 'a'.repeat(10000);
      const mockTodos = [
        { id: 1, text: longText, completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(loaded[0].text).toBe(longText);
      expect(loaded[0].text.length).toBe(10000);
    });

    test('should handle todos with nested objects', () => {
      const mockTodos = [
        {
          id: 1,
          text: 'Test',
          completed: false,
          createdAt: Date.now(),
          metadata: { priority: 'high', tags: ['work', 'urgent'] },
        },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(loaded[0].metadata).toEqual(mockTodos[0].metadata);
    });

    test('should handle todos with null values', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: null },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(loaded[0].createdAt).toBeNull();
    });

    test('should handle todos with undefined values', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: undefined },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      // undefined gets converted to null in JSON
      expect(loaded[0].createdAt).toBeUndefined();
    });
  });

  describe('Error Recovery', () => {
    test('should recover from corrupted data on next save', () => {
      localStorage.setItem('todos', 'corrupted data');

      const newTodos = [
        { id: 1, text: 'New todo', completed: false, createdAt: Date.now() },
      ];

      saveTodos(newTodos);
      const loaded = loadTodos();

      expect(loaded).toEqual(newTodos);
    });

    test('should handle localStorage being disabled', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('should handle localStorage quota exceeded', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        saveTodos([{ id: 1, text: 'Test', completed: false, createdAt: Date.now() }]);
      }).toThrow();
    });
  });

  describe('Data Validation', () => {
    test('should load todos with all required fields', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(loaded[0]).toHaveProperty('id');
      expect(loaded[0]).toHaveProperty('text');
      expect(loaded[0]).toHaveProperty('completed');
      expect(loaded[0]).toHaveProperty('createdAt');
    });

    test('should preserve data types', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: 1234567890 },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(typeof loaded[0].id).toBe('number');
      expect(typeof loaded[0].text).toBe('string');
      expect(typeof loaded[0].completed).toBe('boolean');
      expect(typeof loaded[0].createdAt).toBe('number');
    });

    test('should handle boolean values correctly', () => {
      const mockTodos = [
        { id: 1, text: 'Test 1', completed: true, createdAt: Date.now() },
        { id: 2, text: 'Test 2', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);
      const loaded = loadTodos();

      expect(loaded[0].completed).toBe(true);
      expect(loaded[1].completed).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should handle rapid successive saves', () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const todos = [{ id: i, text: `Todo ${i}`, completed: false, createdAt: Date.now() }];
        saveTodos(todos);
      }

      const loaded = loadTodos();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(iterations - 1);
    });

    test('should handle rapid successive loads', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: Date.now() },
      ];
      saveTodos(mockTodos);

      for (let i = 0; i < 100; i++) {
        const loaded = loadTodos();
        expect(loaded).toEqual(mockTodos);
      }
    });
  });

  describe('Concurrency', () => {
    test('should handle simultaneous save operations', () => {
      const todos1 = [{ id: 1, text: 'First', completed: false, createdAt: Date.now() }];
      const todos2 = [{ id: 2, text: 'Second', completed: false, createdAt: Date.now() }];

      saveTodos(todos1);
      saveTodos(todos2);

      const loaded = loadTodos();
      // Last save should win
      expect(loaded).toEqual(todos2);
    });
  });

  describe('Browser Compatibility', () => {
    test('should work with localStorage API', () => {
      expect(typeof localStorage.getItem).toBe('function');
      expect(typeof localStorage.setItem).toBe('function');
      expect(typeof localStorage.removeItem).toBe('function');
    });

    test('should handle JSON.stringify and JSON.parse', () => {
      const mockTodos = [
        { id: 1, text: 'Test', completed: false, createdAt: Date.now() },
      ];

      const stringified = JSON.stringify(mockTodos);
      expect(typeof stringified).toBe('string');

      const parsed = JSON.parse(stringified);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toEqual(mockTodos);
    });
  });

  describe('Security', () => {
    test('should handle XSS attempts in todo text', () => {
      const xssTodos = [
        {
          id: 1,
          text: '<script>alert("XSS")</script>',
          completed: false,
          createdAt: Date.now(),
        },
      ];

      saveTodos(xssTodos);
      const loaded = loadTodos();

      expect(loaded[0].text).toBe('<script>alert("XSS")</script>');
    });

    test('should handle SQL injection attempts', () => {
      const sqlTodos = [
        {
          id: 1,
          text: "'; DROP TABLE todos; --",
          completed: false,
          createdAt: Date.now(),
        },
      ];

      saveTodos(sqlTodos);
      const loaded = loadTodos();

      expect(loaded[0].text).toBe("'; DROP TABLE todos; --");
    });
  });

  describe('Data Persistence', () => {
    test('should persist data across function calls', () => {
      const mockTodos = [
        { id: 1, text: 'Persistent todo', completed: false, createdAt: Date.now() },
      ];

      saveTodos(mockTodos);

      // Simulate page reload by creating new function scope
      const reloadedTodos = loadTodos();

      expect(reloadedTodos).toEqual(mockTodos);
    });

    test('should maintain data after clear and save', () => {
      const todos1 = [{ id: 1, text: 'First', completed: false, createdAt: Date.now() }];
      const todos2 = [{ id: 2, text: 'Second', completed: false, createdAt: Date.now() }];

      saveTodos(todos1);
      clearStorage();
      saveTodos(todos2);

      const loaded = loadTodos();
      expect(loaded).toEqual(todos2);
      expect(loaded).not.toEqual(todos1);
    });
  });
});