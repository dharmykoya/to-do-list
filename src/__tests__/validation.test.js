const { jest } = require('@jest/globals');
const validation = require('../validation');

describe('Input Validation', () => {
  describe('validateTodoInput', () => {
    test('should return valid for non-empty string', () => {
      const result = validation.validateTodoInput('Buy groceries');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid for empty string', () => {
      const result = validation.validateTodoInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Todo text cannot be empty');
    });

    test('should return invalid for whitespace only', () => {
      const result = validation.validateTodoInput('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Todo text cannot be empty');
    });

    test('should return invalid for null', () => {
      const result = validation.validateTodoInput(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Todo text cannot be empty');
    });

    test('should return invalid for undefined', () => {
      const result = validation.validateTodoInput(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Todo text cannot be empty');
    });

    test('should return invalid for text exceeding max length', () => {
      const longText = 'a'.repeat(501);
      const result = validation.validateTodoInput(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Todo text cannot exceed 500 characters');
    });

    test('should return valid for text at max length', () => {
      const maxText = 'a'.repeat(500);
      const result = validation.validateTodoInput(maxText);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should trim whitespace before validation', () => {
      const result = validation.validateTodoInput('  Buy groceries  ');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle special characters', () => {
      const result = validation.validateTodoInput('Buy @groceries #today!');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle unicode characters', () => {
      const result = validation.validateTodoInput('买菜 🛒');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateTodoId', () => {
    test('should return valid for positive number', () => {
      const result = validation.validateTodoId(1);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid for zero', () => {
      const result = validation.validateTodoId(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for negative number', () => {
      const result = validation.validateTodoId(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for null', () => {
      const result = validation.validateTodoId(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for undefined', () => {
      const result = validation.validateTodoId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for string', () => {
      const result = validation.validateTodoId('1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for NaN', () => {
      const result = validation.validateTodoId(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for Infinity', () => {
      const result = validation.validateTodoId(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });

    test('should return invalid for float', () => {
      const result = validation.validateTodoId(1.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo ID');
    });
  });

  describe('validateTodoData', () => {
    test('should return valid for valid todo object', () => {
      const todo = {
        id: 1,
        text: 'Buy groceries',
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid for null', () => {
      const result = validation.validateTodoData(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for undefined', () => {
      const result = validation.validateTodoData(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for non-object', () => {
      const result = validation.validateTodoData('not an object');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for missing id', () => {
      const todo = {
        text: 'Buy groceries',
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for missing text', () => {
      const todo = {
        id: 1,
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for missing completed', () => {
      const todo = {
        id: 1,
        text: 'Buy groceries',
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for missing createdAt', () => {
      const todo = {
        id: 1,
        text: 'Buy groceries',
        completed: false,
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for invalid id type', () => {
      const todo = {
        id: '1',
        text: 'Buy groceries',
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for invalid text type', () => {
      const todo = {
        id: 1,
        text: 123,
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for invalid completed type', () => {
      const todo = {
        id: 1,
        text: 'Buy groceries',
        completed: 'false',
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for invalid createdAt type', () => {
      const todo = {
        id: 1,
        text: 'Buy groceries',
        completed: false,
        createdAt: '2024-01-01',
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for empty text', () => {
      const todo = {
        id: 1,
        text: '',
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });

    test('should return invalid for text exceeding max length', () => {
      const todo = {
        id: 1,
        text: 'a'.repeat(501),
        completed: false,
        createdAt: Date.now(),
      };
      const result = validation.validateTodoData(todo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid todo data');
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace', () => {
      const result = validation.sanitizeInput('  Buy groceries  ');
      expect(result).toBe('Buy groceries');
    });

    test('should remove HTML tags', () => {
      const result = validation.sanitizeInput('<script>alert("xss")</script>Buy groceries');
      expect(result).toBe('Buy groceries');
    });

    test('should handle multiple HTML tags', () => {
      const result = validation.sanitizeInput('<div><span>Buy</span> groceries</div>');
      expect(result).toBe('Buy groceries');
    });

    test('should handle self-closing tags', () => {
      const result = validation.sanitizeInput('Buy <br/> groceries');
      expect(result).toBe('Buy  groceries');
    });

    test('should handle empty string', () => {
      const result = validation.sanitizeInput('');
      expect(result).toBe('');
    });

    test('should handle null', () => {
      const result = validation.sanitizeInput(null);
      expect(result).toBe('');
    });

    test('should handle undefined', () => {
      const result = validation.sanitizeInput(undefined);
      expect(result).toBe('');
    });

    test('should preserve special characters', () => {
      const result = validation.sanitizeInput('Buy @groceries #today!');
      expect(result).toBe('Buy @groceries #today!');
    });

    test('should preserve unicode characters', () => {
      const result = validation.sanitizeInput('买菜 🛒');
      expect(result).toBe('买菜 🛒');
    });

    test('should handle mixed content', () => {
      const result = validation.sanitizeInput('  <b>Buy</b> groceries  ');
      expect(result).toBe('Buy groceries');
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      const _originalValidate = validation.validateTodoInput;
      
      // Test that validation returns proper error structure
      const result = validation.validateTodoInput('');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('error');
      expect(result.isValid).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    test('should handle sanitization errors gracefully', () => {
      // Test with various edge cases
      expect(() => validation.sanitizeInput(null)).not.toThrow();
      expect(() => validation.sanitizeInput(undefined)).not.toThrow();
      expect(() => validation.sanitizeInput(123)).not.toThrow();
      expect(() => validation.sanitizeInput({})).not.toThrow();
    });

    test('should handle validation with non-string input', () => {
      const result = validation.validateTodoInput(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle validation with object input', () => {
      const result = validation.validateTodoInput({});
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle validation with array input', () => {
      const result = validation.validateTodoInput([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});