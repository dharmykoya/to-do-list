const validation = require('../validation');
const { VALIDATION_RULES, ERROR_MESSAGES } = require('../validation');

describe('Input Validation', () => {
  describe('validateTodoInput', () => {
    test('should accept valid todo text', () => {
      const result = validation.validateTodoInput('Buy groceries');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty input', () => {
      const result = validation.validateTodoInput('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
    });

    test('should reject whitespace-only input', () => {
      const result = validation.validateTodoInput('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
    });

    test('should reject input exceeding max length', () => {
      const longText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH + 1);
      const result = validation.validateTodoInput(longText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG);
    });

    test('should accept input at max length', () => {
      const maxText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH);
      const result = validation.validateTodoInput(maxText);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject input below min length', () => {
      const shortText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH - 1);
      const result = validation.validateTodoInput(shortText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_SHORT);
    });

    test('should accept input at min length', () => {
      const minText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH);
      const result = validation.validateTodoInput(minText);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should trim input before validation', () => {
      const result = validation.validateTodoInput('  Valid todo  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('Valid todo');
    });

    test('should reject input with only special characters', () => {
      const result = validation.validateTodoInput('!@#$%');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_CHARACTERS);
    });

    test('should accept input with mixed alphanumeric and special characters', () => {
      const result = validation.validateTodoInput('Buy 2 apples @ store!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle null input', () => {
      const result = validation.validateTodoInput(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
    });

    test('should handle undefined input', () => {
      const result = validation.validateTodoInput(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
    });

    test('should return multiple errors for multiple violations', () => {
      const result = validation.validateTodoInput('a'); // Too short
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize HTML tags', () => {
      const result = validation.validateTodoInput('<script>alert("xss")</script>Buy milk');
      expect(result.sanitizedValue).not.toContain('<script>');
      expect(result.sanitizedValue).not.toContain('</script>');
    });

    test('should preserve safe HTML entities', () => {
      const result = validation.validateTodoInput('Buy &amp; sell');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTodoId', () => {
    test('should accept valid positive integer', () => {
      const result = validation.validateTodoId(1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject negative numbers', () => {
      const result = validation.validateTodoId(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject zero', () => {
      const result = validation.validateTodoId(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject non-integer numbers', () => {
      const result = validation.validateTodoId(1.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject string input', () => {
      const result = validation.validateTodoId('1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject null', () => {
      const result = validation.validateTodoId(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject undefined', () => {
      const result = validation.validateTodoId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject NaN', () => {
      const result = validation.validateTodoId(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });

    test('should reject Infinity', () => {
      const result = validation.validateTodoId(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.INVALID_ID);
    });
  });

  describe('sanitizeInput', () => {
    test('should remove script tags', () => {
      const result = validation.sanitizeInput('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    test('should remove event handlers', () => {
      const result = validation.sanitizeInput('<div onclick="alert()">Click</div>');
      expect(result).not.toContain('onclick');
    });

    test('should preserve safe text', () => {
      const input = 'Buy groceries & cook dinner';
      const result = validation.sanitizeInput(input);
      expect(result).toBe(input);
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

    test('should remove multiple script tags', () => {
      const result = validation.sanitizeInput('<script>1</script>Text<script>2</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Text');
    });

    test('should handle nested tags', () => {
      const result = validation.sanitizeInput('<div><script>alert()</script></div>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('isValidTodoText', () => {
    test('should return true for valid text', () => {
      expect(validation.isValidTodoText('Buy groceries')).toBe(true);
    });

    test('should return false for empty text', () => {
      expect(validation.isValidTodoText('')).toBe(false);
    });

    test('should return false for whitespace-only text', () => {
      expect(validation.isValidTodoText('   ')).toBe(false);
    });

    test('should return false for text exceeding max length', () => {
      const longText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH + 1);
      expect(validation.isValidTodoText(longText)).toBe(false);
    });

    test('should return false for text below min length', () => {
      const shortText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH - 1);
      expect(validation.isValidTodoText(shortText)).toBe(false);
    });

    test('should return true for text at boundaries', () => {
      const minText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH);
      const maxText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH);
      expect(validation.isValidTodoText(minText)).toBe(true);
      expect(validation.isValidTodoText(maxText)).toBe(true);
    });
  });

  describe('getValidationErrors', () => {
    test('should return empty array for valid input', () => {
      const errors = validation.getValidationErrors('Buy groceries');
      expect(errors).toHaveLength(0);
    });

    test('should return required error for empty input', () => {
      const errors = validation.getValidationErrors('');
      expect(errors).toContain(ERROR_MESSAGES.REQUIRED);
    });

    test('should return too long error', () => {
      const longText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH + 1);
      const errors = validation.getValidationErrors(longText);
      expect(errors).toContain(ERROR_MESSAGES.TOO_LONG);
    });

    test('should return too short error', () => {
      const shortText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH - 1);
      const errors = validation.getValidationErrors(shortText);
      expect(errors).toContain(ERROR_MESSAGES.TOO_SHORT);
    });

    test('should return multiple errors', () => {
      const errors = validation.getValidationErrors('');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long input gracefully', () => {
      const veryLongText = 'a'.repeat(10000);
      const result = validation.validateTodoInput(veryLongText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.TOO_LONG);
    });

    test('should handle unicode characters', () => {
      const result = validation.validateTodoInput('Buy 🍎 and 🍌');
      expect(result.isValid).toBe(true);
    });

    test('should handle newlines', () => {
      const result = validation.validateTodoInput('Line 1\nLine 2');
      expect(result.isValid).toBe(true);
    });

    test('should handle tabs', () => {
      const result = validation.validateTodoInput('Item\t1');
      expect(result.isValid).toBe(true);
    });

    test('should handle mixed whitespace', () => {
      const result = validation.validateTodoInput('  \t\n  ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(ERROR_MESSAGES.REQUIRED);
    });
  });

  describe('Security', () => {
    test('should prevent XSS attacks', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      xssAttempts.forEach((attempt) => {
        const result = validation.validateTodoInput(attempt);
        expect(result.sanitizedValue).not.toContain('<script>');
        expect(result.sanitizedValue).not.toContain('onerror');
        expect(result.sanitizedValue).not.toContain('onload');
        expect(result.sanitizedValue).not.toContain('javascript:');
      });
    });

    test('should handle SQL injection attempts', () => {
      const sqlAttempts = [
        "'; DROP TABLE todos; --",
        "1' OR '1'='1",
        "admin'--",
      ];

      sqlAttempts.forEach((attempt) => {
        const result = validation.validateTodoInput(attempt);
        // Should still validate as text, but be sanitized
        expect(result.sanitizedValue).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    test('should validate quickly for normal input', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        validation.validateTodoInput('Buy groceries');
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle batch validation', () => {
      const inputs = Array(100).fill('Buy groceries');
      const start = Date.now();
      inputs.forEach((input) => validation.validateTodoInput(input));
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Integration with VALIDATION_RULES', () => {
    test('should respect MIN_LENGTH rule', () => {
      const text = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH);
      const result = validation.validateTodoInput(text);
      expect(result.isValid).toBe(true);
    });

    test('should respect MAX_LENGTH rule', () => {
      const text = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH);
      const result = validation.validateTodoInput(text);
      expect(result.isValid).toBe(true);
    });

    test('should use correct error messages', () => {
      const emptyResult = validation.validateTodoInput('');
      expect(emptyResult.errors).toContain(ERROR_MESSAGES.REQUIRED);

      const longText = 'a'.repeat(VALIDATION_RULES.MAX_LENGTH + 1);
      const longResult = validation.validateTodoInput(longText);
      expect(longResult.errors).toContain(ERROR_MESSAGES.TOO_LONG);

      const shortText = 'a'.repeat(VALIDATION_RULES.MIN_LENGTH - 1);
      const shortResult = validation.validateTodoInput(shortText);
      expect(shortResult.errors).toContain(ERROR_MESSAGES.TOO_SHORT);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      const _originalValidate = validation.validateTodoInput;
      
      // Test continues without using originalValidate
      const result = validation.validateTodoInput('Valid input');
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    test('should return consistent error structure', () => {
      const result = validation.validateTodoInput('');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('sanitizedValue');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should handle concurrent validations', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(validation.validateTodoInput('Test input')));

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});