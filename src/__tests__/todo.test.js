import { Todo } from '../todo.js';
import invalidInputs from '../../test/fixtures/invalid-inputs.json';
import errorScenarios from '../../test/fixtures/error-scenarios.json';

describe('Todo', () => {
  describe('Constructor', () => {
    test('should create a todo with text', () => {
      const todo = new Todo('Buy groceries');
      expect(todo.text).toBe('Buy groceries');
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
    });

    test('should create a todo with text and completed status', () => {
      const todo = new Todo('Buy groceries', true);
      expect(todo.text).toBe('Buy groceries');
      expect(todo.completed).toBe(true);
    });

    test('should create a todo with text, completed status, and id', () => {
      const todo = new Todo('Buy groceries', true, 'custom-id');
      expect(todo.text).toBe('Buy groceries');
      expect(todo.completed).toBe(true);
      expect(todo.id).toBe('custom-id');
    });

    test('should generate a unique id if not provided', () => {
      const todo1 = new Todo('Task 1');
      const todo2 = new Todo('Task 2');
      expect(todo1.id).not.toBe(todo2.id);
    });

    test('should handle empty text', () => {
      const todo = new Todo('');
      expect(todo.text).toBe('');
    });

    test('should handle whitespace text', () => {
      const todo = new Todo('   ');
      expect(todo.text).toBe('   ');
    });

    test('should handle very long text', () => {
      const longText = 'a'.repeat(1000);
      const todo = new Todo(longText);
      expect(todo.text).toBe(longText);
    });

    test('should handle special characters in text', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/';
      const todo = new Todo(specialText);
      expect(todo.text).toBe(specialText);
    });

    test('should handle unicode characters', () => {
      const unicodeText = '日本語 العربية Русский 中文';
      const todo = new Todo(unicodeText);
      expect(todo.text).toBe(unicodeText);
    });

    test('should handle emojis', () => {
      const emojiText = '🎉 ✅ 🚀 💯';
      const todo = new Todo(emojiText);
      expect(todo.text).toBe(emojiText);
    });

    test('should handle null text', () => {
      const todo = new Todo(null);
      expect(todo.text).toBe(null);
    });

    test('should handle undefined text', () => {
      const todo = new Todo(undefined);
      expect(todo.text).toBe(undefined);
    });

    test('should handle number as text', () => {
      const todo = new Todo(123);
      expect(todo.text).toBe(123);
    });

    test('should handle boolean as text', () => {
      const todo = new Todo(true);
      expect(todo.text).toBe(true);
    });

    test('should handle object as text', () => {
      const obj = { key: 'value' };
      const todo = new Todo(obj);
      expect(todo.text).toBe(obj);
    });

    test('should handle array as text', () => {
      const arr = [1, 2, 3];
      const todo = new Todo(arr);
      expect(todo.text).toBe(arr);
    });

    test('should default completed to false', () => {
      const todo = new Todo('Task');
      expect(todo.completed).toBe(false);
    });

    test('should accept true for completed', () => {
      const todo = new Todo('Task', true);
      expect(todo.completed).toBe(true);
    });

    test('should accept false for completed', () => {
      const todo = new Todo('Task', false);
      expect(todo.completed).toBe(false);
    });

    test('should handle truthy values for completed', () => {
      const todo = new Todo('Task', 1);
      expect(todo.completed).toBe(1);
    });

    test('should handle falsy values for completed', () => {
      const todo = new Todo('Task', 0);
      expect(todo.completed).toBe(0);
    });

    test('should handle null for completed', () => {
      const todo = new Todo('Task', null);
      expect(todo.completed).toBe(null);
    });

    test('should handle undefined for completed', () => {
      const todo = new Todo('Task', undefined);
      expect(todo.completed).toBe(undefined);
    });

    test('should accept custom id', () => {
      const customId = 'my-custom-id';
      const todo = new Todo('Task', false, customId);
      expect(todo.id).toBe(customId);
    });

    test('should handle empty string as id', () => {
      const todo = new Todo('Task', false, '');
      expect(todo.id).toBe('');
    });

    test('should handle numeric id', () => {
      const todo = new Todo('Task', false, 123);
      expect(todo.id).toBe(123);
    });

    test('should handle null id', () => {
      const todo = new Todo('Task', false, null);
      expect(todo.id).toBe(null);
    });

    test('should handle undefined id by generating one', () => {
      const todo = new Todo('Task', false, undefined);
      expect(todo.id).toBeDefined();
      expect(typeof todo.id).toBe('string');
    });
  });

  describe('ID Generation', () => {
    test('should generate UUID format id', () => {
      const todo = new Todo('Task');
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(todo.id).toMatch(uuidRegex);
    });

    test('should generate different ids for different todos', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const todo = new Todo(`Task ${i}`);
        ids.add(todo.id);
      }
      expect(ids.size).toBe(100);
    });

    test('should use crypto.randomUUID if available', () => {
      const todo = new Todo('Task');
      expect(todo.id).toBeDefined();
      expect(typeof todo.id).toBe('string');
    });

    test('should fallback to Math.random if crypto.randomUUID not available', () => {
      const originalRandomUUID = global.crypto?.randomUUID;
      if (global.crypto) {
        delete global.crypto.randomUUID;
      }

      const todo = new Todo('Task');
      expect(todo.id).toBeDefined();
      expect(typeof todo.id).toBe('string');

      if (originalRandomUUID && global.crypto) {
        global.crypto.randomUUID = originalRandomUUID;
      }
    });
  });

  describe('Toggle', () => {
    test('should toggle completed from false to true', () => {
      const todo = new Todo('Task', false);
      todo.toggle();
      expect(todo.completed).toBe(true);
    });

    test('should toggle completed from true to false', () => {
      const todo = new Todo('Task', true);
      todo.toggle();
      expect(todo.completed).toBe(false);
    });

    test('should toggle multiple times', () => {
      const todo = new Todo('Task');
      expect(todo.completed).toBe(false);
      todo.toggle();
      expect(todo.completed).toBe(true);
      todo.toggle();
      expect(todo.completed).toBe(false);
      todo.toggle();
      expect(todo.completed).toBe(true);
    });

    test('should return the todo instance for chaining', () => {
      const todo = new Todo('Task');
      const result = todo.toggle();
      expect(result).toBe(todo);
    });

    test('should allow chaining multiple toggles', () => {
      const todo = new Todo('Task');
      todo.toggle().toggle().toggle();
      expect(todo.completed).toBe(true);
    });
  });

  describe('Update Text', () => {
    test('should update text', () => {
      const todo = new Todo('Old text');
      todo.updateText('New text');
      expect(todo.text).toBe('New text');
    });

    test('should update text multiple times', () => {
      const todo = new Todo('Text 1');
      todo.updateText('Text 2');
      expect(todo.text).toBe('Text 2');
      todo.updateText('Text 3');
      expect(todo.text).toBe('Text 3');
    });

    test('should return the todo instance for chaining', () => {
      const todo = new Todo('Task');
      const result = todo.updateText('New text');
      expect(result).toBe(todo);
    });

    test('should allow chaining with toggle', () => {
      const todo = new Todo('Task');
      todo.updateText('New text').toggle();
      expect(todo.text).toBe('New text');
      expect(todo.completed).toBe(true);
    });

    test('should handle empty string', () => {
      const todo = new Todo('Task');
      todo.updateText('');
      expect(todo.text).toBe('');
    });

    test('should handle whitespace', () => {
      const todo = new Todo('Task');
      todo.updateText('   ');
      expect(todo.text).toBe('   ');
    });

    test('should handle special characters', () => {
      const todo = new Todo('Task');
      const specialText = '!@#$%^&*()';
      todo.updateText(specialText);
      expect(todo.text).toBe(specialText);
    });

    test('should handle unicode', () => {
      const todo = new Todo('Task');
      const unicodeText = '日本語';
      todo.updateText(unicodeText);
      expect(todo.text).toBe(unicodeText);
    });

    test('should handle null', () => {
      const todo = new Todo('Task');
      todo.updateText(null);
      expect(todo.text).toBe(null);
    });

    test('should handle undefined', () => {
      const todo = new Todo('Task');
      todo.updateText(undefined);
      expect(todo.text).toBe(undefined);
    });
  });

  describe('Serialization', () => {
    test('should serialize to JSON', () => {
      const todo = new Todo('Task', false, 'id-123');
      const json = JSON.stringify(todo);
      const parsed = JSON.parse(json);
      expect(parsed.text).toBe('Task');
      expect(parsed.completed).toBe(false);
      expect(parsed.id).toBe('id-123');
    });

    test('should deserialize from JSON', () => {
      const json = JSON.stringify({
        text: 'Task',
        completed: true,
        id: 'id-123',
      });
      const parsed = JSON.parse(json);
      const todo = new Todo(parsed.text, parsed.completed, parsed.id);
      expect(todo.text).toBe('Task');
      expect(todo.completed).toBe(true);
      expect(todo.id).toBe('id-123');
    });

    test('should handle round-trip serialization', () => {
      const original = new Todo('Task', true, 'id-123');
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);
      const restored = new Todo(parsed.text, parsed.completed, parsed.id);
      expect(restored.text).toBe(original.text);
      expect(restored.completed).toBe(original.completed);
      expect(restored.id).toBe(original.id);
    });
  });

  describe('Immutability', () => {
    test('should not affect other todos when updating one', () => {
      const todo1 = new Todo('Task 1');
      const todo2 = new Todo('Task 2');
      todo1.updateText('Updated Task 1');
      expect(todo1.text).toBe('Updated Task 1');
      expect(todo2.text).toBe('Task 2');
    });

    test('should not affect other todos when toggling one', () => {
      const todo1 = new Todo('Task 1', false);
      const todo2 = new Todo('Task 2', false);
      todo1.toggle();
      expect(todo1.completed).toBe(true);
      expect(todo2.completed).toBe(false);
    });
  });

  describe('Edge Cases with Fixtures', () => {
    test('should handle invalid inputs from fixtures', () => {
      invalidInputs.forEach((scenario) => {
        if (scenario.operation === 'create') {
          const todo = new Todo(scenario.input);
          expect(todo).toBeDefined();
          expect(todo.text).toBe(scenario.input);
        }
      });
    });

    test('should handle error scenarios from fixtures', () => {
      errorScenarios.forEach((scenario) => {
        if (scenario.type === 'invalid_todo_text') {
          const todo = new Todo(scenario.input);
          expect(todo).toBeDefined();
        }
      });
    });
  });

  describe('Constructor Edge Cases', () => {
    test('should handle constructor with no arguments', () => {
      const todo = new Todo();
      expect(todo.text).toBeUndefined();
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
    });

    test('should handle constructor with only completed argument', () => {
      const todo = new Todo(undefined, true);
      expect(todo.text).toBeUndefined();
      expect(todo.completed).toBe(true);
    });

    test('should handle constructor with only id argument', () => {
      const todo = new Todo(undefined, undefined, 'custom-id');
      expect(todo.text).toBeUndefined();
      expect(todo.completed).toBe(false);
      expect(todo.id).toBe('custom-id');
    });
  });

  describe('Method Chaining', () => {
    test('should support complex method chaining', () => {
      const todo = new Todo('Task');
      todo.updateText('New Task').toggle().toggle().updateText('Final Task');
      expect(todo.text).toBe('Final Task');
      expect(todo.completed).toBe(false);
    });
  });

  describe('Property Access', () => {
    test('should allow direct property access', () => {
      const todo = new Todo('Task');
      expect(todo.text).toBe('Task');
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
    });

    test('should allow direct property modification', () => {
      const todo = new Todo('Task');
      todo.text = 'Modified';
      todo.completed = true;
      expect(todo.text).toBe('Modified');
      expect(todo.completed).toBe(true);
    });
  });

  describe('Type Coercion', () => {
    test('should handle type coercion in comparisons', () => {
      const todo = new Todo('Task', false);
      expect(todo.completed == false).toBe(true);
      expect(todo.completed === false).toBe(true);
    });

    test('should handle truthy/falsy checks', () => {
      const todo1 = new Todo('Task', true);
      const todo2 = new Todo('Task', false);
      expect(!!todo1.completed).toBe(true);
      expect(!!todo2.completed).toBe(false);
    });
  });

  describe('Object Methods', () => {
    test('should work with Object.keys', () => {
      const todo = new Todo('Task', false, 'id-123');
      const keys = Object.keys(todo);
      expect(keys).toContain('text');
      expect(keys).toContain('completed');
      expect(keys).toContain('id');
    });

    test('should work with Object.values', () => {
      const todo = new Todo('Task', false, 'id-123');
      const values = Object.values(todo);
      expect(values).toContain('Task');
      expect(values).toContain(false);
      expect(values).toContain('id-123');
    });

    test('should work with Object.entries', () => {
      const todo = new Todo('Task', false, 'id-123');
      const entries = Object.entries(todo);
      expect(entries).toContainEqual(['text', 'Task']);
      expect(entries).toContainEqual(['completed', false]);
      expect(entries).toContainEqual(['id', 'id-123']);
    });

    test('should work with Object.assign', () => {
      const todo = new Todo('Task');
      const updated = Object.assign({}, todo, { text: 'Updated' });
      expect(updated.text).toBe('Updated');
      expect(todo.text).toBe('Task');
    });

    test('should work with spread operator', () => {
      const todo = new Todo('Task', false, 'id-123');
      const copy = { ...todo };
      expect(copy.text).toBe('Task');
      expect(copy.completed).toBe(false);
      expect(copy.id).toBe('id-123');
    });
  });

  describe('Array Methods', () => {
    test('should work in array operations', () => {
      const todos = [
        new Todo('Task 1'),
        new Todo('Task 2'),
        new Todo('Task 3'),
      ];
      expect(todos.length).toBe(3);
      expect(todos[0].text).toBe('Task 1');
    });

    test('should work with array map', () => {
      const todos = [new Todo('Task 1'), new Todo('Task 2')];
      const texts = todos.map((t) => t.text);
      expect(texts).toEqual(['Task 1', 'Task 2']);
    });

    test('should work with array filter', () => {
      const todos = [
        new Todo('Task 1', true),
        new Todo('Task 2', false),
        new Todo('Task 3', true),
      ];
      const completed = todos.filter((t) => t.completed);
      expect(completed.length).toBe(2);
    });

    test('should work with array reduce', () => {
      const todos = [
        new Todo('Task 1', true),
        new Todo('Task 2', false),
        new Todo('Task 3', true),
      ];
      const completedCount = todos.reduce(
        (count, t) => (t.completed ? count + 1 : count),
        0
      );
      expect(completedCount).toBe(2);
    });

    test('should work with array find', () => {
      const todos = [
        new Todo('Task 1', false, 'id-1'),
        new Todo('Task 2', false, 'id-2'),
      ];
      const found = todos.find((t) => t.id === 'id-2');
      expect(found.text).toBe('Task 2');
    });

    test('should work with array some', () => {
      const todos = [
        new Todo('Task 1', false),
        new Todo('Task 2', true),
      ];
      expect(todos.some((t) => t.completed)).toBe(true);
    });

    test('should work with array every', () => {
      const todos = [
        new Todo('Task 1', true),
        new Todo('Task 2', true),
      ];
      expect(todos.every((t) => t.completed)).toBe(true);
    });
  });

  describe('Comparison', () => {
    test('should compare by reference', () => {
      const todo1 = new Todo('Task', false, 'id-1');
      const todo2 = new Todo('Task', false, 'id-1');
      expect(todo1 === todo2).toBe(false);
      expect(todo1 == todo2).toBe(false);
    });

    test('should compare by id', () => {
      const todo1 = new Todo('Task', false, 'id-1');
      const todo2 = new Todo('Task', false, 'id-1');
      expect(todo1.id === todo2.id).toBe(true);
    });

    test('should compare by properties', () => {
      const todo1 = new Todo('Task', false, 'id-1');
      const todo2 = new Todo('Task', false, 'id-1');
      expect(todo1.text === todo2.text).toBe(true);
      expect(todo1.completed === todo2.completed).toBe(true);
    });
  });

  describe('Cloning', () => {
    test('should create shallow copy with spread', () => {
      const original = new Todo('Task', false, 'id-1');
      const copy = { ...original };
      copy.text = 'Modified';
      expect(original.text).toBe('Task');
      expect(copy.text).toBe('Modified');
    });

    test('should create copy with Object.assign', () => {
      const original = new Todo('Task', false, 'id-1');
      const copy = Object.assign({}, original);
      copy.text = 'Modified';
      expect(original.text).toBe('Task');
      expect(copy.text).toBe('Modified');
    });

    test('should create copy with JSON parse/stringify', () => {
      const original = new Todo('Task', false, 'id-1');
      const copy = JSON.parse(JSON.stringify(original));
      expect(copy.text).toBe(original.text);
      expect(copy.completed).toBe(original.completed);
      expect(copy.id).toBe(original.id);
    });
  });

  describe('Validation', () => {
    test('should validate text length', () => {
      const shortText = 'a';
      const longText = 'a'.repeat(500);
      const todo1 = new Todo(shortText);
      const todo2 = new Todo(longText);
      expect(todo1.text.length).toBe(1);
      expect(todo2.text.length).toBe(500);
    });

    test('should validate completed type', () => {
      const todo = new Todo('Task', true);
      expect(typeof todo.completed).toBe('boolean');
    });

    test('should validate id type', () => {
      const todo = new Todo('Task');
      expect(typeof todo.id).toBe('string');
    });
  });

  describe('Performance', () => {
    test('should create many todos quickly', () => {
      const start = performance.now();
      const todos = [];
      for (let i = 0; i < 1000; i++) {
        todos.push(new Todo(`Task ${i}`));
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
      expect(todos.length).toBe(1000);
    });

    test('should toggle many todos quickly', () => {
      const todos = [];
      for (let i = 0; i < 1000; i++) {
        todos.push(new Todo(`Task ${i}`));
      }
      const start = performance.now();
      todos.forEach((t) => t.toggle());
      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });

    test('should update many todos quickly', () => {
      const todos = [];
      for (let i = 0; i < 1000; i++) {
        todos.push(new Todo(`Task ${i}`));
      }
      const start = performance.now();
      todos.forEach((t, i) => t.updateText(`Updated ${i}`));
      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Memory', () => {
    test('should not leak memory on repeated operations', () => {
      const todo = new Todo('Task');
      for (let i = 0; i < 10000; i++) {
        todo.toggle();
        todo.updateText(`Task ${i}`);
      }
      expect(todo.text).toBe('Task 9999');
    });
  });

  describe('Concurrency', () => {
    test('should handle rapid updates', () => {
      const todo = new Todo('Task');
      for (let i = 0; i < 100; i++) {
        todo.updateText(`Task ${i}`);
      }
      expect(todo.text).toBe('Task 99');
    });

    test('should handle rapid toggles', () => {
      const todo = new Todo('Task');
      for (let i = 0; i < 100; i++) {
        todo.toggle();
      }
      expect(todo.completed).toBe(false);
    });
  });

  describe('Integration with Storage', () => {
    test('should be compatible with localStorage serialization', () => {
      const todo = new Todo('Task', false, 'id-1');
      const serialized = JSON.stringify(todo);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.text).toBe(todo.text);
      expect(deserialized.completed).toBe(todo.completed);
      expect(deserialized.id).toBe(todo.id);
    });
  });

  describe('Crypto Fallback', () => {
    test('should handle missing crypto.randomUUID gracefully', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      const todo = new Todo('Task');
      expect(todo.id).toBeDefined();
      expect(typeof todo.id).toBe('string');
      expect(todo.id.length).toBeGreaterThan(0);

      global.crypto = originalCrypto;
    });

    test('should use fallback UUID generation', () => {
      const randomUUIDBackup = global.crypto?.randomUUID;
      if (global.crypto) {
        delete global.crypto.randomUUID;
      }

      const todo = new Todo('Task');
      expect(todo.id).toBeDefined();
      expect(typeof todo.id).toBe('string');

      if (randomUUIDBackup && global.crypto) {
        global.crypto.randomUUID = randomUUIDBackup;
      }
    });
  });
});