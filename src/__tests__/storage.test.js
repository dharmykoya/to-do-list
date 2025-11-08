/**
 * Storage Module Unit Tests
 * 
 * Comprehensive test suite for localStorage utility functions.
 * Tests all CRUD operations, error handling, edge cases, and data validation.
 * Achieves >90% code coverage with focus on production scenarios.
 * 
 * @module test/storage.test
 */

import { getTodos, saveTodos, clearTodos, STORAGE_KEY } from '../src/storage.js';
import sampleTodos from './fixtures/sample-todos.json';
import emptyState from './fixtures/empty-state.json';

describe('Storage Module', () => {
  /**
   * Setup: Clear localStorage before each test for isolation
   */
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Suppress console output during tests unless debugging
    if (process.env.DEBUG_TESTS !== 'true') {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'info').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTodos()', () => {
    describe('Empty State Handling', () => {
      it('should return empty array when no data exists in localStorage', () => {
        const result = getTodos();
        
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should log info message when no data found', () => {
        const infoSpy = jest.spyOn(console, 'info');
        
        getTodos();
        
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('No todos found in localStorage')
        );
      });

      it('should return empty array when localStorage returns null', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array when localStorage returns undefined', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(undefined);
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });
    });

    describe('Valid Data Retrieval', () => {
      it('should return parsed todos when valid data exists', () => {
        const testTodos = [
          {
            id: '1',
            text: 'Test todo',
            completed: false,
            timestamp: 1234567890
          }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testTodos));
        
        const result = getTodos();
        
        expect(result).toEqual(testTodos);
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
      });

      it('should return multiple todos correctly', () => {
        const testTodos = [
          { id: '1', text: 'First', completed: false, timestamp: 1000 },
          { id: '2', text: 'Second', completed: true, timestamp: 2000 },
          { id: '3', text: 'Third', completed: false, timestamp: 3000 }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testTodos));
        
        const result = getTodos();
        
        expect(result).toEqual(testTodos);
        expect(result.length).toBe(3);
      });

      it('should handle fixture data correctly', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTodos));
        
        const result = getTodos();
        
        expect(result.length).toBe(3);
        expect(result[0].text).toBe('Buy groceries');
        expect(result[2].completed).toBe(true);
      });

      it('should log success message with count', () => {
        const infoSpy = jest.spyOn(console, 'info');
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testTodos));
        
        getTodos();
        
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully retrieved 1 todos')
        );
      });
    });

    describe('Corrupted Data Handling', () => {
      it('should return empty array for malformed JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{invalid json}');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array for incomplete JSON', () => {
        localStorage.setItem(STORAGE_KEY, '[{"id": "1", "text": "Test"');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array for non-array JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{"todos": []}');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array when data is a string', () => {
        localStorage.setItem(STORAGE_KEY, '"not an array"');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array when data is a number', () => {
        localStorage.setItem(STORAGE_KEY, '12345');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should return empty array when data is boolean', () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should log error for JSON syntax errors', () => {
        const errorSpy = jest.spyOn(console, 'error');
        localStorage.setItem(STORAGE_KEY, '{bad json}');
        
        getTodos();
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse todos'),
          expect.any(String)
        );
      });

      it('should log error for invalid data structure', () => {
        const errorSpy = jest.spyOn(console, 'error');
        localStorage.setItem(STORAGE_KEY, '{"not": "array"}');
        
        getTodos();
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid data structure'),
          expect.stringContaining('expected array')
        );
      });
    });

    describe('Error Recovery', () => {
      it('should handle localStorage access errors gracefully', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Storage access denied');
        });
        
        const result = getTodos();
        
        expect(result).toEqual([]);
      });

      it('should log generic errors', () => {
        const errorSpy = jest.spyOn(console, 'error');
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Unknown error');
        });
        
        getTodos();
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error retrieving todos'),
          expect.any(String)
        );
      });
    });
  });

  describe('saveTodos()', () => {
    describe('Input Validation', () => {
      it('should throw TypeError for non-array input', () => {
        expect(() => saveTodos('not an array')).toThrow(TypeError);
        expect(() => saveTodos('not an array')).toThrow(
          expect.stringContaining('expected array')
        );
      });

      it('should throw TypeError for null input', () => {
        expect(() => saveTodos(null)).toThrow(TypeError);
      });

      it('should throw TypeError for undefined input', () => {
        expect(() => saveTodos(undefined)).toThrow(TypeError);
      });

      it('should throw TypeError for number input', () => {
        expect(() => saveTodos(123)).toThrow(TypeError);
      });

      it('should throw TypeError for object input', () => {
        expect(() => saveTodos({ todos: [] })).toThrow(TypeError);
      });

      it('should log error for invalid input type', () => {
        const errorSpy = jest.spyOn(console, 'error');
        
        try {
          saveTodos('invalid');
        } catch (e) {
          // Expected error
        }
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid input: expected array')
        );
      });
    });

    describe('Data Structure Validation', () => {
      it('should throw TypeError for todos missing id field', () => {
        const invalidTodos = [
          { text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
        expect(() => saveTodos(invalidTodos)).toThrow(
          expect.stringContaining('Invalid todo data structure')
        );
      });

      it('should throw TypeError for todos missing text field', () => {
        const invalidTodos = [
          { id: '1', completed: false, timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for todos missing completed field', () => {
        const invalidTodos = [
          { id: '1', text: 'Test', timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for todos missing timestamp field', () => {
        const invalidTodos = [
          { id: '1', text: 'Test', completed: false }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for wrong id type', () => {
        const invalidTodos = [
          { id: 123, text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for wrong text type', () => {
        const invalidTodos = [
          { id: '1', text: 123, completed: false, timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for wrong completed type', () => {
        const invalidTodos = [
          { id: '1', text: 'Test', completed: 'false', timestamp: 1000 }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for wrong timestamp type', () => {
        const invalidTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: '1000' }
        ];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for null todo item', () => {
        const invalidTodos = [null];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });

      it('should throw TypeError for undefined todo item', () => {
        const invalidTodos = [undefined];
        
        expect(() => saveTodos(invalidTodos)).toThrow(TypeError);
      });
    });

    describe('Successful Save Operations', () => {
      it('should save valid array to localStorage', () => {
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        const result = saveTodos(testTodos);
        
        expect(result).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(testTodos));
      });

      it('should save empty array successfully', () => {
        const result = saveTodos([]);
        
        expect(result).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
      });

      it('should save multiple todos correctly', () => {
        const testTodos = [
          { id: '1', text: 'First', completed: false, timestamp: 1000 },
          { id: '2', text: 'Second', completed: true, timestamp: 2000 }
        ];
        
        const result = saveTodos(testTodos);
        
        expect(result).toBe(true);
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored).toEqual(testTodos);
        expect(stored.length).toBe(2);
      });

      it('should overwrite existing data', () => {
        const firstTodos = [
          { id: '1', text: 'First', completed: false, timestamp: 1000 }
        ];
        const secondTodos = [
          { id: '2', text: 'Second', completed: true, timestamp: 2000 }
        ];
        
        saveTodos(firstTodos);
        saveTodos(secondTodos);
        
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored).toEqual(secondTodos);
        expect(stored.length).toBe(1);
      });

      it('should log success message with count', () => {
        const infoSpy = jest.spyOn(console, 'info');
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        saveTodos(testTodos);
        
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully saved 1 todos')
        );
      });
    });

    describe('Quota Exceeded Error Handling', () => {
      it('should handle QuotaExceededError with recovery', () => {
        const largeTodos = Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          text: `Todo ${i}`,
          completed: false,
          timestamp: 1000 + i
        }));
        
        let callCount = 0;
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
          callCount++;
          if (callCount === 1) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          // Second call (recovery) succeeds
          return undefined;
        });
        
        const result = saveTodos(largeTodos);
        
        expect(result).toBe(true);
        expect(callCount).toBe(2);
      });

      it('should log error when quota exceeded', () => {
        const errorSpy = jest.spyOn(console, 'error');
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        });
        
        saveTodos(testTodos);
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('localStorage quota exceeded'),
          expect.any(String)
        );
      });

      it('should log warning on successful recovery', () => {
        const warnSpy = jest.spyOn(console, 'warn');
        const largeTodos = Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          text: `Todo ${i}`,
          completed: false,
          timestamp: 1000 + i
        }));
        
        let callCount = 0;
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
        });
        
        saveTodos(largeTodos);
        
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Recovery successful')
        );
      });

      it('should return false when recovery fails', () => {
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        });
        
        const result = saveTodos(testTodos);
        
        expect(result).toBe(false);
      });

      it('should log error when recovery fails', () => {
        const errorSpy = jest.spyOn(console, 'error');
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        });
        
        saveTodos(testTodos);
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Recovery failed')
        );
      });
    });

    describe('Generic Error Handling', () => {
      it('should return false on generic storage error', () => {
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('Generic storage error');
        });
        
        const result = saveTodos(testTodos);
        
        expect(result).toBe(false);
      });

      it('should log generic errors', () => {
        const errorSpy = jest.spyOn(console, 'error');
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('Generic error');
        });
        
        saveTodos(testTodos);
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error saving todos'),
          expect.any(String)
        );
      });
    });
  });

  describe('clearTodos()', () => {
    describe('Successful Clear Operations', () => {
      it('should remove data from localStorage', () => {
        const testTodos = [
          { id: '1', text: 'Test', completed: false, timestamp: 1000 }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testTodos));
        
        const result = clearTodos();
        
        expect(result).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });

      it('should return true when clearing empty storage', () => {
        const result = clearTodos();
        
        expect(result).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });

      it('should log success message', () => {
        const infoSpy = jest.spyOn(console, 'info');
        
        clearTodos();
        
        expect(infoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully cleared todos')
        );
      });

      it('should not affect other localStorage keys', () => {
        localStorage.setItem('otherKey', 'otherValue');
        localStorage.setItem(STORAGE_KEY, '[]');
        
        clearTodos();
        
        expect(localStorage.getItem('otherKey')).toBe('otherValue');
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should return false on storage error', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        const result = clearTodos();
        
        expect(result).toBe(false);
      });

      it('should log error on failure', () => {
        const errorSpy = jest.spyOn(console, 'error');
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('Clear failed');
        });
        
        clearTodos();
        
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error clearing todos'),
          expect.any(String)
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete save-retrieve-clear cycle', () => {
      const testTodos = [
        { id: '1', text: 'Test', completed: false, timestamp: 1000 }
      ];
      
      // Save
      const saveResult = saveTodos(testTodos);
      expect(saveResult).toBe(true);
      
      // Retrieve
      const retrieved = getTodos();
      expect(retrieved).toEqual(testTodos);
      
      // Clear
      const clearResult = clearTodos();
      expect(clearResult).toBe(true);
      
      // Verify empty
      const afterClear = getTodos();
      expect(afterClear).toEqual([]);
    });

    it('should handle multiple save operations', () => {
      const todos1 = [
        { id: '1', text: 'First', completed: false, timestamp: 1000 }
      ];
      const todos2 = [
        { id: '1', text: 'First', completed: false, timestamp: 1000 },
        { id: '2', text: 'Second', completed: true, timestamp: 2000 }
      ];
      
      saveTodos(todos1);
      expect(getTodos().length).toBe(1);
      
      saveTodos(todos2);
      expect(getTodos().length).toBe(2);
    });

    it('should maintain data integrity across operations', () => {
      const originalTodos = [
        { id: '1', text: 'Test', completed: false, timestamp: 1234567890 }
      ];
      
      saveTodos(originalTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].id).toBe(originalTodos[0].id);
      expect(retrieved[0].text).toBe(originalTodos[0].text);
      expect(retrieved[0].completed).toBe(originalTodos[0].completed);
      expect(retrieved[0].timestamp).toBe(originalTodos[0].timestamp);
    });
  });

  describe('Edge Cases', () => {
    it('should handle todos with special characters in text', () => {
      const testTodos = [
        { id: '1', text: 'Test <script>alert("xss")</script>', completed: false, timestamp: 1000 }
      ];
      
      saveTodos(testTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].text).toBe('Test <script>alert("xss")</script>');
    });

    it('should handle todos with unicode characters', () => {
      const testTodos = [
        { id: '1', text: '测试 🎉 тест', completed: false, timestamp: 1000 }
      ];
      
      saveTodos(testTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].text).toBe('测试 🎉 тест');
    });

    it('should handle very long text strings', () => {
      const longText = 'a'.repeat(10000);
      const testTodos = [
        { id: '1', text: longText, completed: false, timestamp: 1000 }
      ];
      
      saveTodos(testTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].text).toBe(longText);
      expect(retrieved[0].text.length).toBe(10000);
    });

    it('should handle empty string text', () => {
      const testTodos = [
        { id: '1', text: '', completed: false, timestamp: 1000 }
      ];
      
      saveTodos(testTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].text).toBe('');
    });

    it('should handle timestamp edge values', () => {
      const testTodos = [
        { id: '1', text: 'Test', completed: false, timestamp: 0 },
        { id: '2', text: 'Test', completed: false, timestamp: Number.MAX_SAFE_INTEGER }
      ];
      
      saveTodos(testTodos);
      const retrieved = getTodos();
      
      expect(retrieved[0].timestamp).toBe(0);
      expect(retrieved[1].timestamp).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});