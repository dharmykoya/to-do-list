/**
 * Todo Business Logic Unit Tests
 * 
 * Comprehensive test suite for todo item creation, deletion, and input sanitization.
 * Tests cover all edge cases, error conditions, and security requirements.
 * Uses deterministic mocking for crypto.randomUUID and Date for reproducible tests.
 * 
 * @module src/__tests__/todo.test
 */

import { createTodo, deleteTodo, sanitizeInput } from '../todo.js';

/**
 * Test Suite: sanitizeInput()
 * 
 * Validates input sanitization functionality including:
 * - Whitespace trimming
 * - HTML entity escaping
 * - Special character handling
 * - XSS prevention
 */
describe('sanitizeInput', () => {
  describe('whitespace handling', () => {
    test('trims leading whitespace', () => {
      const result = sanitizeInput('   hello');
      expect(result).toBe('hello');
    });

    test('trims trailing whitespace', () => {
      const result = sanitizeInput('hello   ');
      expect(result).toBe('hello');
    });

    test('trims both leading and trailing whitespace', () => {
      const result = sanitizeInput('   hello world   ');
      expect(result).toBe('hello world');
    });

    test('preserves internal whitespace', () => {
      const result = sanitizeInput('hello   world');
      expect(result).toBe('hello   world');
    });

    test('handles tabs and newlines', () => {
      const result = sanitizeInput('\t\nhello\n\t');
      expect(result).toBe('hello');
    });

    test('returns empty string for whitespace-only input', () => {
      const result = sanitizeInput('   \t\n   ');
      expect(result).toBe('');
    });
  });

  describe('HTML entity escaping', () => {
    test('escapes ampersand', () => {
      const result = sanitizeInput('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    test('escapes less than symbol', () => {
      const result = sanitizeInput('5 < 10');
      expect(result).toBe('5 &lt; 10');
    });

    test('escapes greater than symbol', () => {
      const result = sanitizeInput('10 > 5');
      expect(result).toBe('10 &gt; 5');
    });

    test('escapes double quotes', () => {
      const result = sanitizeInput('Say "hello"');
      expect(result).toBe('Say &quot;hello&quot;');
    });

    test('escapes single quotes', () => {
      const result = sanitizeInput("It's working");
      expect(result).toBe('It&#39;s working');
    });

    test('escapes forward slash', () => {
      const result = sanitizeInput('path/to/file');
      expect(result).toBe('path&#x2F;to&#x2F;file');
    });

    test('escapes multiple special characters', () => {
      const result = sanitizeInput('<div class="test">Hello & "goodbye"</div>');
      expect(result).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;goodbye&quot;&lt;&#x2F;div&gt;');
    });
  });

  describe('XSS prevention', () => {
    test('prevents script tag injection', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result).not.toContain('<script>');
    });

    test('prevents img tag with onerror injection', () => {
      const result = sanitizeInput('<img src=x onerror="alert(1)">');
      expect(result).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
      expect(result).not.toContain('<img');
    });

    test('prevents iframe injection', () => {
      const result = sanitizeInput('<iframe src="evil.com"></iframe>');
      expect(result).toBe('&lt;iframe src=&quot;evil.com&quot;&gt;&lt;&#x2F;iframe&gt;');
      expect(result).not.toContain('<iframe');
    });

    test('prevents javascript: protocol injection', () => {
      const result = sanitizeInput('<a href="javascript:alert(1)">click</a>');
      expect(result).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;&#x2F;a&gt;');
      expect(result).not.toContain('javascript:');
    });

    test('prevents event handler injection', () => {
      const result = sanitizeInput('<div onclick="alert(1)">click me</div>');
      expect(result).toBe('&lt;div onclick=&quot;alert(1)&quot;&gt;click me&lt;&#x2F;div&gt;');
      expect(result).not.toContain('onclick=');
    });

    test('handles complex XSS attempt with multiple vectors', () => {
      const result = sanitizeInput('"><script>alert(String.fromCharCode(88,83,83))</script>');
      expect(result).toBe('&quot;&gt;&lt;script&gt;alert(String.fromCharCode(88,83,83))&lt;&#x2F;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('special character handling', () => {
    test('handles unicode characters', () => {
      const result = sanitizeInput('Hello 世界 🌍');
      expect(result).toBe('Hello 世界 🌍');
    });

    test('handles emoji', () => {
      const result = sanitizeInput('Task 📝 Complete ✅');
      expect(result).toBe('Task 📝 Complete ✅');
    });

    test('handles mathematical symbols', () => {
      const result = sanitizeInput('Calculate: 2 + 2 = 4');
      expect(result).toBe('Calculate: 2 + 2 = 4');
    });

    test('handles currency symbols', () => {
      const result = sanitizeInput('Price: $100 €50 ¥1000');
      expect(result).toBe('Price: $100 €50 ¥1000');
    });

    test('handles mixed content', () => {
      const result = sanitizeInput('  Buy <groceries> & pay $50  ');
      expect(result).toBe('Buy &lt;groceries&gt; &amp; pay $50');
    });
  });

  describe('error handling', () => {
    test('throws TypeError for non-string input - number', () => {
      expect(() => sanitizeInput(123)).toThrow(TypeError);
      expect(() => sanitizeInput(123)).toThrow('Input must be a string');
    });

    test('throws TypeError for non-string input - null', () => {
      expect(() => sanitizeInput(null)).toThrow(TypeError);
      expect(() => sanitizeInput(null)).toThrow('Input must be a string');
    });

    test('throws TypeError for non-string input - undefined', () => {
      expect(() => sanitizeInput(undefined)).toThrow(TypeError);
      expect(() => sanitizeInput(undefined)).toThrow('Input must be a string');
    });

    test('throws TypeError for non-string input - object', () => {
      expect(() => sanitizeInput({})).toThrow(TypeError);
      expect(() => sanitizeInput({})).toThrow('Input must be a string');
    });

    test('throws TypeError for non-string input - array', () => {
      expect(() => sanitizeInput([])).toThrow(TypeError);
      expect(() => sanitizeInput([])).toThrow('Input must be a string');
    });

    test('throws TypeError for non-string input - boolean', () => {
      expect(() => sanitizeInput(true)).toThrow(TypeError);
      expect(() => sanitizeInput(true)).toThrow('Input must be a string');
    });
  });

  describe('edge cases', () => {
    test('handles empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    test('handles very long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = sanitizeInput(longString);
      expect(result).toBe(longString);
      expect(result.length).toBe(10000);
    });

    test('handles string with only special characters', () => {
      const result = sanitizeInput('<>&"\'/');
      expect(result).toBe('&lt;&gt;&amp;&quot;&#39;&#x2F;');
    });

    test('handles repeated escaping attempts', () => {
      const result = sanitizeInput('&lt;script&gt;');
      expect(result).toBe('&amp;lt;script&amp;gt;');
    });
  });
});

/**
 * Test Suite: createTodo()
 * 
 * Validates todo creation functionality including:
 * - Valid todo structure generation
 * - UUID generation
 * - Timestamp creation
 * - Input sanitization integration
 * - Error handling
 */
describe('createTodo', () => {
  // Mock crypto.randomUUID for deterministic tests
  const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
  const originalRandomUUID = crypto.randomUUID;
  
  // Mock Date for deterministic timestamps
  const mockTimestamp = '2025-01-08T12:00:00.000Z';
  const originalDate = global.Date;

  beforeEach(() => {
    // Mock crypto.randomUUID
    crypto.randomUUID = jest.fn(() => mockUUID);
    
    // Mock Date
    const mockDate = new Date(mockTimestamp);
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      }
      
      static now() {
        return mockDate.getTime();
      }
      
      toISOString() {
        return mockTimestamp;
      }
    };
  });

  afterEach(() => {
    // Restore original implementations
    crypto.randomUUID = originalRandomUUID;
    global.Date = originalDate;
  });

  describe('valid todo creation', () => {
    test('creates todo with valid structure', () => {
      const todo = createTodo('Buy groceries');
      
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('text');
      expect(todo).toHaveProperty('timestamp');
      expect(Object.keys(todo)).toHaveLength(3);
    });

    test('generates unique UUID for id', () => {
      const todo = createTodo('Test task');
      
      expect(todo.id).toBe(mockUUID);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
      expect(typeof todo.id).toBe('string');
      expect(todo.id.length).toBe(36);
    });

    test('adds current timestamp in ISO 8601 format', () => {
      const todo = createTodo('Test task');
      
      expect(todo.timestamp).toBe(mockTimestamp);
      expect(typeof todo.timestamp).toBe('string');
      expect(todo.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('sanitizes input text', () => {
      const todo = createTodo('  <script>alert("xss")</script>  ');
      
      expect(todo.text).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(todo.text).not.toContain('<script>');
    });

    test('creates todo with simple text', () => {
      const todo = createTodo('Buy milk');
      
      expect(todo.text).toBe('Buy milk');
      expect(todo.id).toBe(mockUUID);
      expect(todo.timestamp).toBe(mockTimestamp);
    });

    test('creates todo with special characters', () => {
      const todo = createTodo('Buy milk & bread');
      
      expect(todo.text).toBe('Buy milk &amp; bread');
    });

    test('creates todo with unicode characters', () => {
      const todo = createTodo('学习 JavaScript 📚');
      
      expect(todo.text).toBe('学习 JavaScript 📚');
    });

    test('trims whitespace from input', () => {
      const todo = createTodo('   Task with spaces   ');
      
      expect(todo.text).toBe('Task with spaces');
    });
  });

  describe('error handling', () => {
    test('throws Error for empty string', () => {
      expect(() => createTodo('')).toThrow(Error);
      expect(() => createTodo('')).toThrow('Todo text cannot be empty or only whitespace');
    });

    test('throws Error for whitespace-only string', () => {
      expect(() => createTodo('   ')).toThrow(Error);
      expect(() => createTodo('   ')).toThrow('Todo text cannot be empty or only whitespace');
    });

    test('throws Error for tabs and newlines only', () => {
      expect(() => createTodo('\t\n\r')).toThrow(Error);
      expect(() => createTodo('\t\n\r')).toThrow('Todo text cannot be empty or only whitespace');
    });

    test('throws TypeError for non-string input - number', () => {
      expect(() => createTodo(123)).toThrow(TypeError);
      expect(() => createTodo(123)).toThrow('Todo text must be a string');
    });

    test('throws TypeError for non-string input - null', () => {
      expect(() => createTodo(null)).toThrow(TypeError);
      expect(() => createTodo(null)).toThrow('Todo text must be a string');
    });

    test('throws TypeError for non-string input - undefined', () => {
      expect(() => createTodo(undefined)).toThrow(TypeError);
      expect(() => createTodo(undefined)).toThrow('Todo text must be a string');
    });

    test('throws TypeError for non-string input - object', () => {
      expect(() => createTodo({})).toThrow(TypeError);
      expect(() => createTodo({})).toThrow('Todo text must be a string');
    });

    test('throws TypeError for non-string input - array', () => {
      expect(() => createTodo([])).toThrow(TypeError);
      expect(() => createTodo([])).toThrow('Todo text must be a string');
    });

    test('throws TypeError for non-string input - boolean', () => {
      expect(() => createTodo(true)).toThrow(TypeError);
      expect(() => createTodo(true)).toThrow('Todo text must be a string');
    });

    test('throws Error when crypto.randomUUID is not available', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;
      
      expect(() => createTodo('Test')).toThrow(Error);
      expect(() => createTodo('Test')).toThrow('crypto.randomUUID is not available in this environment');
      
      global.crypto = originalCrypto;
    });

    test('throws Error when crypto.randomUUID is not a function', () => {
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = undefined;
      
      expect(() => createTodo('Test')).toThrow(Error);
      expect(() => createTodo('Test')).toThrow('crypto.randomUUID is not available in this environment');
      
      crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('edge cases', () => {
    test('handles very long text', () => {
      const longText = 'a'.repeat(10000);
      const todo = createTodo(longText);
      
      expect(todo.text).toBe(longText);
      expect(todo.text.length).toBe(10000);
    });

    test('handles text with only special characters after sanitization', () => {
      const todo = createTodo('<>&');
      
      expect(todo.text).toBe('&lt;&gt;&amp;');
    });

    test('handles single character input', () => {
      const todo = createTodo('a');
      
      expect(todo.text).toBe('a');
    });

    test('creates multiple todos with different UUIDs', () => {
      crypto.randomUUID = originalRandomUUID; // Use real UUID for this test
      
      const todo1 = createTodo('Task 1');
      const todo2 = createTodo('Task 2');
      
      expect(todo1.id).not.toBe(todo2.id);
    });
  });
});

/**
 * Test Suite: deleteTodo()
 * 
 * Validates todo deletion functionality including:
 * - Successful deletion by ID
 * - Immutability (no mutation of original array)
 * - Handling of non-existent IDs
 * - Error handling for invalid inputs
 */
describe('deleteTodo', () => {
  const mockTodos = [
    {
      id: '1',
      text: 'Task 1',
      timestamp: '2025-01-08T12:00:00.000Z'
    },
    {
      id: '2',
      text: 'Task 2',
      timestamp: '2025-01-08T12:01:00.000Z'
    },
    {
      id: '3',
      text: 'Task 3',
      timestamp: '2025-01-08T12:02:00.000Z'
    }
  ];

  describe('successful deletion', () => {
    test('removes todo by id', () => {
      const result = deleteTodo(mockTodos, '2');
      
      expect(result).toHaveLength(2);
      expect(result.find(todo => todo.id === '2')).toBeUndefined();
      expect(result.find(todo => todo.id === '1')).toBeDefined();
      expect(result.find(todo => todo.id === '3')).toBeDefined();
    });

    test('removes first todo', () => {
      const result = deleteTodo(mockTodos, '1');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    test('removes last todo', () => {
      const result = deleteTodo(mockTodos, '3');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    test('removes middle todo', () => {
      const result = deleteTodo(mockTodos, '2');
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    test('returns empty array when deleting only todo', () => {
      const singleTodo = [mockTodos[0]];
      const result = deleteTodo(singleTodo, '1');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('immutability', () => {
    test('returns new array without mutating original', () => {
      const originalLength = mockTodos.length;
      const originalTodos = [...mockTodos];
      
      const result = deleteTodo(mockTodos, '2');
      
      expect(mockTodos.length).toBe(originalLength);
      expect(mockTodos).toEqual(originalTodos);
      expect(result).not.toBe(mockTodos);
    });

    test('preserves original todo objects', () => {
      const result = deleteTodo(mockTodos, '2');
      
      const originalTodo1 = mockTodos.find(t => t.id === '1');
      const resultTodo1 = result.find(t => t.id === '1');
      
      expect(resultTodo1).toBe(originalTodo1);
    });

    test('does not modify original array when deleting non-existent id', () => {
      const originalTodos = [...mockTodos];
      
      deleteTodo(mockTodos, 'non-existent');
      
      expect(mockTodos).toEqual(originalTodos);
    });
  });

  describe('non-existent id handling', () => {
    test('handles non-existent id gracefully', () => {
      const result = deleteTodo(mockTodos, 'non-existent-id');
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockTodos);
    });

    test('returns array with same length for non-existent id', () => {
      const result = deleteTodo(mockTodos, '999');
      
      expect(result.length).toBe(mockTodos.length);
    });

    test('handles empty string id', () => {
      const result = deleteTodo(mockTodos, '');
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockTodos);
    });

    test('handles UUID-like non-existent id', () => {
      const result = deleteTodo(mockTodos, '550e8400-e29b-41d4-a716-446655440000');
      
      expect(result).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    test('throws TypeError for non-array todos - null', () => {
      expect(() => deleteTodo(null, '1')).toThrow(TypeError);
      expect(() => deleteTodo(null, '1')).toThrow('Todos must be an array');
    });

    test('throws TypeError for non-array todos - undefined', () => {
      expect(() => deleteTodo(undefined, '1')).toThrow(TypeError);
      expect(() => deleteTodo(undefined, '1')).toThrow('Todos must be an array');
    });

    test('throws TypeError for non-array todos - object', () => {
      expect(() => deleteTodo({}, '1')).toThrow(TypeError);
      expect(() => deleteTodo({}, '1')).toThrow('Todos must be an array');
    });

    test('throws TypeError for non-array todos - string', () => {
      expect(() => deleteTodo('not an array', '1')).toThrow(TypeError);
      expect(() => deleteTodo('not an array', '1')).toThrow('Todos must be an array');
    });

    test('throws TypeError for non-array todos - number', () => {
      expect(() => deleteTodo(123, '1')).toThrow(TypeError);
      expect(() => deleteTodo(123, '1')).toThrow('Todos must be an array');
    });

    test('throws TypeError for non-string id - number', () => {
      expect(() => deleteTodo(mockTodos, 123)).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, 123)).toThrow('ID must be a string');
    });

    test('throws TypeError for non-string id - null', () => {
      expect(() => deleteTodo(mockTodos, null)).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, null)).toThrow('ID must be a string');
    });

    test('throws TypeError for non-string id - undefined', () => {
      expect(() => deleteTodo(mockTodos, undefined)).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, undefined)).toThrow('ID must be a string');
    });

    test('throws TypeError for non-string id - object', () => {
      expect(() => deleteTodo(mockTodos, {})).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, {})).toThrow('ID must be a string');
    });

    test('throws TypeError for non-string id - array', () => {
      expect(() => deleteTodo(mockTodos, [])).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, [])).toThrow('ID must be a string');
    });

    test('throws TypeError for non-string id - boolean', () => {
      expect(() => deleteTodo(mockTodos, true)).toThrow(TypeError);
      expect(() => deleteTodo(mockTodos, true)).toThrow('ID must be a string');
    });
  });

  describe('edge cases', () => {
    test('handles empty array', () => {
      const result = deleteTodo([], '1');
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    test('handles array with single item - delete existing', () => {
      const singleTodo = [mockTodos[0]];
      const result = deleteTodo(singleTodo, '1');
      
      expect(result).toHaveLength(0);
    });

    test('handles array with single item - delete non-existing', () => {
      const singleTodo = [mockTodos[0]];
      const result = deleteTodo(singleTodo, '999');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTodos[0]);
    });

    test('handles large array', () => {
      const largeTodos = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        text: `Task ${i}`,
        timestamp: '2025-01-08T12:00:00.000Z'
      }));
      
      const result = deleteTodo(largeTodos, '500');
      
      expect(result).toHaveLength(999);
      expect(result.find(t => t.id === '500')).toBeUndefined();
    });

    test('handles todos with duplicate ids - removes all matches', () => {
      const todosWithDuplicates = [
        { id: '1', text: 'Task 1', timestamp: '2025-01-08T12:00:00.000Z' },
        { id: '2', text: 'Task 2', timestamp: '2025-01-08T12:01:00.000Z' },
        { id: '1', text: 'Task 1 duplicate', timestamp: '2025-01-08T12:02:00.000Z' }
      ];
      
      const result = deleteTodo(todosWithDuplicates, '1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    test('preserves todo order after deletion', () => {
      const result = deleteTodo(mockTodos, '2');
      
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
      expect(result[0].text).toBe('Task 1');
      expect(result[1].text).toBe('Task 3');
    });

    test('handles todos with complex objects', () => {
      const complexTodos = [
        {
          id: '1',
          text: 'Task 1',
          timestamp: '2025-01-08T12:00:00.000Z',
          metadata: { priority: 'high', tags: ['work'] }
        },
        {
          id: '2',
          text: 'Task 2',
          timestamp: '2025-01-08T12:01:00.000Z',
          metadata: { priority: 'low', tags: ['personal'] }
        }
      ];
      
      const result = deleteTodo(complexTodos, '1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(result[0].metadata).toEqual({ priority: 'low', tags: ['personal'] });
    });
  });
});