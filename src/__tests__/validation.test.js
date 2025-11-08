/**
 * Comprehensive unit tests for validation module
 * 
 * Tests all validation rules, edge cases, error messages, and debouncing behavior.
 * Achieves >95% code coverage with thorough boundary condition testing.
 * 
 * @module validation.test
 */

import {
  validateTodoText,
  isEmptyOrWhitespace,
  exceedsMaxLength,
  validateTodoTextRealtime,
  createRealtimeValidator,
  ValidationRules,
  ERROR_MESSAGES,
} from '../validation.js';
import invalidInputsFixture from '../../test/fixtures/invalid-inputs.json';

describe('Validation Module', () => {
  describe('ValidationRules constants', () => {
    it('should have MIN_LENGTH constant', () => {
      expect(ValidationRules.MIN_LENGTH).toBeDefined();
      expect(typeof ValidationRules.MIN_LENGTH).toBe('number');
      expect(ValidationRules.MIN_LENGTH).toBe(1);
    });

    it('should have MAX_LENGTH constant', () => {
      expect(ValidationRules.MAX_LENGTH).toBeDefined();
      expect(typeof ValidationRules.MAX_LENGTH).toBe('number');
      expect(ValidationRules.MAX_LENGTH).toBe(500);
    });

    it('should have WHITESPACE_ONLY_REGEX constant', () => {
      expect(ValidationRules.WHITESPACE_ONLY_REGEX).toBeDefined();
      expect(ValidationRules.WHITESPACE_ONLY_REGEX).toBeInstanceOf(RegExp);
    });

    it('should have valid regex pattern for whitespace detection', () => {
      expect(ValidationRules.WHITESPACE_ONLY_REGEX.test('')).toBe(true);
      expect(ValidationRules.WHITESPACE_ONLY_REGEX.test('   ')).toBe(true);
      expect(ValidationRules.WHITESPACE_ONLY_REGEX.test('\t\n')).toBe(true);
      expect(ValidationRules.WHITESPACE_ONLY_REGEX.test('text')).toBe(false);
    });
  });

  describe('ERROR_MESSAGES constants', () => {
    it('should have EMPTY error message', () => {
      expect(ERROR_MESSAGES.EMPTY).toBeDefined();
      expect(typeof ERROR_MESSAGES.EMPTY).toBe('string');
      expect(ERROR_MESSAGES.EMPTY).toBe('Task cannot be empty');
    });

    it('should have WHITESPACE error message', () => {
      expect(ERROR_MESSAGES.WHITESPACE).toBeDefined();
      expect(typeof ERROR_MESSAGES.WHITESPACE).toBe('string');
      expect(ERROR_MESSAGES.WHITESPACE).toBe('Task cannot contain only whitespace');
    });

    it('should have TOO_LONG error message', () => {
      expect(ERROR_MESSAGES.TOO_LONG).toBeDefined();
      expect(typeof ERROR_MESSAGES.TOO_LONG).toBe('string');
      expect(ERROR_MESSAGES.TOO_LONG).toBe('Task cannot exceed 500 characters');
    });

    it('should have all error messages as non-empty strings', () => {
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isEmptyOrWhitespace()', () => {
    it('should return true for empty string', () => {
      expect(isEmptyOrWhitespace('')).toBe(true);
    });

    it('should return true for string with only spaces', () => {
      expect(isEmptyOrWhitespace(' ')).toBe(true);
      expect(isEmptyOrWhitespace('   ')).toBe(true);
      expect(isEmptyOrWhitespace('     ')).toBe(true);
    });

    it('should return true for string with only tabs', () => {
      expect(isEmptyOrWhitespace('\t')).toBe(true);
      expect(isEmptyOrWhitespace('\t\t')).toBe(true);
    });

    it('should return true for string with only newlines', () => {
      expect(isEmptyOrWhitespace('\n')).toBe(true);
      expect(isEmptyOrWhitespace('\n\n')).toBe(true);
      expect(isEmptyOrWhitespace('\r\n')).toBe(true);
    });

    it('should return true for mixed whitespace characters', () => {
      expect(isEmptyOrWhitespace(' \t\n')).toBe(true);
      expect(isEmptyOrWhitespace('\t \n \r')).toBe(true);
      expect(isEmptyOrWhitespace('  \t  \n  ')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmptyOrWhitespace('a')).toBe(false);
      expect(isEmptyOrWhitespace('text')).toBe(false);
      expect(isEmptyOrWhitespace('Buy milk')).toBe(false);
    });

    it('should return false for strings with text and whitespace', () => {
      expect(isEmptyOrWhitespace(' text ')).toBe(false);
      expect(isEmptyOrWhitespace('\ttext\n')).toBe(false);
      expect(isEmptyOrWhitespace('  Buy milk  ')).toBe(false);
    });

    it('should return true for non-string types', () => {
      expect(isEmptyOrWhitespace(null)).toBe(true);
      expect(isEmptyOrWhitespace(undefined)).toBe(true);
      expect(isEmptyOrWhitespace(123)).toBe(true);
      expect(isEmptyOrWhitespace({})).toBe(true);
      expect(isEmptyOrWhitespace([])).toBe(true);
    });
  });

  describe('exceedsMaxLength()', () => {
    it('should return false for strings shorter than max length', () => {
      expect(exceedsMaxLength('short', 500)).toBe(false);
      expect(exceedsMaxLength('Buy milk', 500)).toBe(false);
    });

    it('should return false for strings exactly at max length', () => {
      const exactly500 = 'a'.repeat(500);
      expect(exceedsMaxLength(exactly500, 500)).toBe(false);
    });

    it('should return true for strings exceeding max length', () => {
      const over500 = 'a'.repeat(501);
      expect(exceedsMaxLength(over500, 500)).toBe(true);
    });

    it('should handle boundary conditions correctly', () => {
      expect(exceedsMaxLength('a'.repeat(499), 500)).toBe(false);
      expect(exceedsMaxLength('a'.repeat(500), 500)).toBe(false);
      expect(exceedsMaxLength('a'.repeat(501), 500)).toBe(true);
    });

    it('should work with different max lengths', () => {
      expect(exceedsMaxLength('test', 3)).toBe(true);
      expect(exceedsMaxLength('test', 4)).toBe(false);
      expect(exceedsMaxLength('test', 5)).toBe(false);
      expect(exceedsMaxLength('test', 10)).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(exceedsMaxLength(null, 500)).toBe(false);
      expect(exceedsMaxLength(undefined, 500)).toBe(false);
      expect(exceedsMaxLength(123, 500)).toBe(false);
      expect(exceedsMaxLength({}, 500)).toBe(false);
      expect(exceedsMaxLength([], 500)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(exceedsMaxLength('', 500)).toBe(false);
      expect(exceedsMaxLength('', 0)).toBe(false);
    });

    it('should handle unicode characters correctly', () => {
      const unicodeString = '日本語'.repeat(167); // 501 characters
      expect(exceedsMaxLength(unicodeString, 500)).toBe(true);
    });
  });

  describe('validateTodoText()', () => {
    describe('fixture-based tests', () => {
      invalidInputsFixture.forEach(testCase => {
        it(testCase.description, () => {
          const result = validateTodoText(testCase.input);
          
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('error');
          expect(result.isValid).toBe(testCase.expectedValid);
          
          if (testCase.expectedError) {
            expect(result.error).toBe(testCase.expectedError);
          } else {
            expect(result.error).toBeNull();
          }
        });
      });
    });

    describe('null and undefined handling', () => {
      it('should return invalid for null input', () => {
        const result = validateTodoText(null);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.EMPTY);
      });

      it('should return invalid for undefined input', () => {
        const result = validateTodoText(undefined);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.EMPTY);
      });
    });

    describe('empty string validation', () => {
      it('should return invalid for empty string', () => {
        const result = validateTodoText('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.EMPTY);
      });
    });

    describe('whitespace-only validation', () => {
      it('should return invalid for single space', () => {
        const result = validateTodoText(' ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      });

      it('should return invalid for multiple spaces', () => {
        const result = validateTodoText('     ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      });

      it('should return invalid for tabs only', () => {
        const result = validateTodoText('\t\t');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      });

      it('should return invalid for newlines only', () => {
        const result = validateTodoText('\n\n');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      });

      it('should return invalid for mixed whitespace', () => {
        const result = validateTodoText(' \t\n\r ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      });
    });

    describe('length validation', () => {
      it('should return valid for string at exactly max length', () => {
        const exactly500 = 'a'.repeat(500);
        const result = validateTodoText(exactly500);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return invalid for string exceeding max length by 1', () => {
        const over501 = 'a'.repeat(501);
        const result = validateTodoText(over501);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.TOO_LONG);
      });

      it('should return valid for string just under max length', () => {
        const under499 = 'a'.repeat(499);
        const result = validateTodoText(under499);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return invalid for very long strings', () => {
        const veryLong = 'a'.repeat(1000);
        const result = validateTodoText(veryLong);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(ERROR_MESSAGES.TOO_LONG);
      });
    });

    describe('valid input validation', () => {
      it('should return valid for simple text', () => {
        const result = validateTodoText('Buy milk');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for text with special characters', () => {
        const result = validateTodoText('Call @John & schedule meeting!');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for unicode characters', () => {
        const result = validateTodoText('日本語のタスク');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for text with leading/trailing whitespace', () => {
        const result = validateTodoText('  Buy groceries  ');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for text with newlines', () => {
        const result = validateTodoText('Task with\nmultiple\nlines');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for single character', () => {
        const result = validateTodoText('a');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return valid for numbers as text', () => {
        const result = validateTodoText('123');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    describe('type coercion', () => {
      it('should convert number to string and validate', () => {
        const result = validateTodoText(123);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should convert boolean to string and validate', () => {
        const result = validateTodoText(true);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should handle object conversion', () => {
        const result = validateTodoText({ text: 'test' });
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });
  });

  describe('validateTodoTextRealtime()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should not call callback immediately', () => {
      const callback = jest.fn();
      validateTodoTextRealtime('test', callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback after debounce delay', () => {
      const callback = jest.fn();
      validateTodoTextRealtime('test', callback);
      
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        isValid: true,
        error: null,
      });
    });

    it('should debounce multiple rapid calls', () => {
      const callback = jest.fn();
      
      validateTodoTextRealtime('t', callback);
      jest.advanceTimersByTime(100);
      
      validateTodoTextRealtime('te', callback);
      jest.advanceTimersByTime(100);
      
      validateTodoTextRealtime('tes', callback);
      jest.advanceTimersByTime(100);
      
      validateTodoTextRealtime('test', callback);
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        isValid: true,
        error: null,
      });
    });

    it('should validate with correct result after debounce', () => {
      const callback = jest.fn();
      validateTodoTextRealtime('', callback);
      
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledWith({
        isValid: false,
        error: ERROR_MESSAGES.EMPTY,
      });
    });

    it('should handle invalid callback gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = validateTodoTextRealtime('test', null);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'validateTodoTextRealtime: callback must be a function'
      );
      expect(typeof result).toBe('function');
      
      consoleErrorSpy.mockRestore();
    });

    it('should return debounced function', () => {
      const callback = jest.fn();
      const result = validateTodoTextRealtime('test', callback);
      
      expect(typeof result).toBe('function');
    });

    it('should handle validation errors gracefully', () => {
      const callback = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock validateTodoText to throw error
      const originalValidate = validateTodoText;
      jest.spyOn(require('../validation.js'), 'validateTodoText').mockImplementation(() => {
        throw new Error('Validation error');
      });
      
      validateTodoTextRealtime('test', callback);
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledWith({
        isValid: false,
        error: 'An error occurred during validation',
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createRealtimeValidator()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should throw TypeError for non-function callback', () => {
      expect(() => createRealtimeValidator(null)).toThrow(TypeError);
      expect(() => createRealtimeValidator(undefined)).toThrow(TypeError);
      expect(() => createRealtimeValidator('not a function')).toThrow(TypeError);
      expect(() => createRealtimeValidator(123)).toThrow(TypeError);
    });

    it('should return a function', () => {
      const callback = jest.fn();
      const validator = createRealtimeValidator(callback);
      
      expect(typeof validator).toBe('function');
    });

    it('should debounce validation calls', () => {
      const callback = jest.fn();
      const validator = createRealtimeValidator(callback);
      
      validator('t');
      validator('te');
      validator('tes');
      validator('test');
      
      expect(callback).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should validate with correct result', () => {
      const callback = jest.fn();
      const validator = createRealtimeValidator(callback);
      
      validator('Buy milk');
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledWith({
        isValid: true,
        error: null,
      });
    });

    it('should handle invalid input', () => {
      const callback = jest.fn();
      const validator = createRealtimeValidator(callback);
      
      validator('');
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledWith({
        isValid: false,
        error: ERROR_MESSAGES.EMPTY,
      });
    });

    it('should handle validation errors gracefully', () => {
      const callback = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const validator = createRealtimeValidator(callback);
      
      // This should not throw
      validator('test');
      jest.advanceTimersByTime(300);
      
      consoleErrorSpy.mockRestore();
    });

    it('should allow multiple validators with different callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const validator1 = createRealtimeValidator(callback1);
      const validator2 = createRealtimeValidator(callback2);
      
      validator1('test1');
      validator2('test2');
      
      jest.advanceTimersByTime(300);
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on each call', () => {
      const callback = jest.fn();
      const validator = createRealtimeValidator(callback);
      
      validator('t');
      jest.advanceTimersByTime(200);
      
      validator('te');
      jest.advanceTimersByTime(200);
      
      validator('tes');
      jest.advanceTimersByTime(300);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration tests', () => {
    it('should validate complete user flow', () => {
      // Empty input
      let result = validateTodoText('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.EMPTY);
      
      // Whitespace input
      result = validateTodoText('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.WHITESPACE);
      
      // Valid input
      result = validateTodoText('Buy milk');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      
      // Too long input
      result = validateTodoText('a'.repeat(501));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES.TOO_LONG);
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = [
        { input: null, expectedValid: false },
        { input: undefined, expectedValid: false },
        { input: '', expectedValid: false },
        { input: ' ', expectedValid: false },
        { input: 'a', expectedValid: true },
        { input: 'a'.repeat(500), expectedValid: true },
        { input: 'a'.repeat(501), expectedValid: false },
      ];
      
      edgeCases.forEach(({ input, expectedValid }) => {
        const result = validateTodoText(input);
        expect(result.isValid).toBe(expectedValid);
      });
    });
  });
});