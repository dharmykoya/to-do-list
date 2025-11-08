import { jest } from '@jest/globals';
import {
  createTodo,
  addTodo,
  removeTodo,
  toggleTodo,
  updateTodo,
  getTodoById,
  clearCompleted,
  getCompletedCount,
  getPendingCount,
  getAllTodos,
} from '../todo.js';

describe('Todo Module', () => {
  describe('createTodo', () => {
    test('should create a new todo with required properties', () => {
      const text = 'Test todo';
      const todo = createTodo(text);

      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('text', text);
      expect(todo).toHaveProperty('completed', false);
      expect(todo).toHaveProperty('createdAt');
      expect(typeof todo.id).toBe('number');
      expect(typeof todo.createdAt).toBe('string');
    });

    test('should create todos with unique IDs', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');

      expect(todo1.id).not.toBe(todo2.id);
    });

    test('should create todo with valid ISO date string', () => {
      const todo = createTodo('Test');
      const date = new Date(todo.createdAt);

      expect(date).toBeInstanceOf(Date);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    test('should handle empty string text', () => {
      const todo = createTodo('');

      expect(todo.text).toBe('');
      expect(todo).toHaveProperty('id');
    });

    test('should handle text with special characters', () => {
      const text = 'Test @#$% todo & more';
      const todo = createTodo(text);

      expect(todo.text).toBe(text);
    });

    test('should handle very long text', () => {
      const longText = 'a'.repeat(1000);
      const todo = createTodo(longText);

      expect(todo.text).toBe(longText);
      expect(todo.text.length).toBe(1000);
    });

    test('should create todo with completed set to false by default', () => {
      const todo = createTodo('Test');

      expect(todo.completed).toBe(false);
    });

    test('should create todo with timestamp close to current time', () => {
      const before = new Date().toISOString();
      const todo = createTodo('Test');
      const after = new Date().toISOString();

      expect(todo.createdAt >= before).toBe(true);
      expect(todo.createdAt <= after).toBe(true);
    });
  });

  describe('addTodo', () => {
    test('should add a new todo to empty list', () => {
      const todos = [];
      const newTodo = createTodo('New todo');
      const result = addTodo(todos, newTodo);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newTodo);
    });

    test('should add a new todo to existing list', () => {
      const existingTodo = createTodo('Existing todo');
      const todos = [existingTodo];
      const newTodo = createTodo('New todo');
      const result = addTodo(todos, newTodo);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(existingTodo);
      expect(result[1]).toEqual(newTodo);
    });

    test('should not mutate original todos array', () => {
      const todos = [createTodo('Todo 1')];
      const originalLength = todos.length;
      const newTodo = createTodo('Todo 2');

      addTodo(todos, newTodo);

      expect(todos).toHaveLength(originalLength);
    });

    test('should return new array reference', () => {
      const todos = [];
      const newTodo = createTodo('New todo');
      const result = addTodo(todos, newTodo);

      expect(result).not.toBe(todos);
    });

    test('should handle adding multiple todos sequentially', () => {
      let todos = [];
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todo3 = createTodo('Todo 3');

      todos = addTodo(todos, todo1);
      todos = addTodo(todos, todo2);
      todos = addTodo(todos, todo3);

      expect(todos).toHaveLength(3);
      expect(todos[0]).toEqual(todo1);
      expect(todos[1]).toEqual(todo2);
      expect(todos[2]).toEqual(todo3);
    });

    test('should preserve todo properties when adding', () => {
      const todos = [];
      const newTodo = {
        id: 123,
        text: 'Test',
        completed: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const result = addTodo(todos, newTodo);

      expect(result[0]).toEqual(newTodo);
      expect(result[0].id).toBe(123);
      expect(result[0].text).toBe('Test');
      expect(result[0].completed).toBe(false);
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('removeTodo', () => {
    test('should remove todo by id', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = removeTodo(todos, todo1.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(todo2);
    });

    test('should return empty array when removing last todo', () => {
      const todo = createTodo('Only todo');
      const todos = [todo];
      const result = removeTodo(todos, todo.id);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    test('should not mutate original todos array', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const originalLength = todos.length;

      removeTodo(todos, todo1.id);

      expect(todos).toHaveLength(originalLength);
    });

    test('should return new array reference', () => {
      const todo = createTodo('Todo');
      const todos = [todo];
      const result = removeTodo(todos, todo.id);

      expect(result).not.toBe(todos);
    });

    test('should handle removing non-existent id', () => {
      const todo = createTodo('Todo');
      const todos = [todo];
      const result = removeTodo(todos, 999999);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(todo);
    });

    test('should handle empty todos array', () => {
      const todos = [];
      const result = removeTodo(todos, 1);

      expect(result).toEqual([]);
    });

    test('should remove correct todo from multiple todos', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todo3 = createTodo('Todo 3');
      const todos = [todo1, todo2, todo3];
      const result = removeTodo(todos, todo2.id);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(todo1);
      expect(result[1]).toEqual(todo3);
    });

    test('should handle removing multiple todos sequentially', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todo3 = createTodo('Todo 3');
      let todos = [todo1, todo2, todo3];

      todos = removeTodo(todos, todo1.id);
      expect(todos).toHaveLength(2);

      todos = removeTodo(todos, todo3.id);
      expect(todos).toHaveLength(1);
      expect(todos[0]).toEqual(todo2);
    });
  });

  describe('toggleTodo', () => {
    test('should toggle todo completion status from false to true', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = toggleTodo(todos, todo.id);

      expect(result[0].completed).toBe(true);
    });

    test('should toggle todo completion status from true to false', () => {
      const todo = { ...createTodo('Test todo'), completed: true };
      const todos = [todo];
      const result = toggleTodo(todos, todo.id);

      expect(result[0].completed).toBe(false);
    });

    test('should not mutate original todos array', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const originalCompleted = todo.completed;

      toggleTodo(todos, todo.id);

      expect(todo.completed).toBe(originalCompleted);
    });

    test('should return new array reference', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = toggleTodo(todos, todo.id);

      expect(result).not.toBe(todos);
    });

    test('should only toggle specified todo', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = toggleTodo(todos, todo1.id);

      expect(result[0].completed).toBe(true);
      expect(result[1].completed).toBe(false);
    });

    test('should handle toggling non-existent id', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = toggleTodo(todos, 999999);

      expect(result[0].completed).toBe(false);
    });

    test('should preserve other todo properties', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = toggleTodo(todos, todo.id);

      expect(result[0].id).toBe(todo.id);
      expect(result[0].text).toBe(todo.text);
      expect(result[0].createdAt).toBe(todo.createdAt);
    });

    test('should handle multiple toggles', () => {
      const todo = createTodo('Test todo');
      let todos = [todo];

      todos = toggleTodo(todos, todo.id);
      expect(todos[0].completed).toBe(true);

      todos = toggleTodo(todos, todo.id);
      expect(todos[0].completed).toBe(false);

      todos = toggleTodo(todos, todo.id);
      expect(todos[0].completed).toBe(true);
    });
  });

  describe('updateTodo', () => {
    test('should update todo text', () => {
      const todo = createTodo('Original text');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, { text: 'Updated text' });

      expect(result[0].text).toBe('Updated text');
    });

    test('should update todo completed status', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, { completed: true });

      expect(result[0].completed).toBe(true);
    });

    test('should update multiple properties at once', () => {
      const todo = createTodo('Original text');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, {
        text: 'Updated text',
        completed: true,
      });

      expect(result[0].text).toBe('Updated text');
      expect(result[0].completed).toBe(true);
    });

    test('should not mutate original todos array', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const originalText = todo.text;

      updateTodo(todos, todo.id, { text: 'Updated' });

      expect(todo.text).toBe(originalText);
    });

    test('should return new array reference', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, { text: 'Updated' });

      expect(result).not.toBe(todos);
    });

    test('should only update specified todo', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = updateTodo(todos, todo1.id, { text: 'Updated' });

      expect(result[0].text).toBe('Updated');
      expect(result[1].text).toBe('Todo 2');
    });

    test('should handle updating non-existent id', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = updateTodo(todos, 999999, { text: 'Updated' });

      expect(result[0].text).toBe('Test todo');
    });

    test('should preserve properties not being updated', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, { text: 'Updated' });

      expect(result[0].id).toBe(todo.id);
      expect(result[0].completed).toBe(todo.completed);
      expect(result[0].createdAt).toBe(todo.createdAt);
    });

    test('should handle empty updates object', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = updateTodo(todos, todo.id, {});

      expect(result[0]).toEqual(todo);
    });
  });

  describe('getTodoById', () => {
    test('should return todo with matching id', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = getTodoById(todos, todo1.id);

      expect(result).toEqual(todo1);
    });

    test('should return undefined for non-existent id', () => {
      const todo = createTodo('Test todo');
      const todos = [todo];
      const result = getTodoById(todos, 999999);

      expect(result).toBeUndefined();
    });

    test('should handle empty todos array', () => {
      const todos = [];
      const result = getTodoById(todos, 1);

      expect(result).toBeUndefined();
    });

    test('should return first matching todo if duplicates exist', () => {
      const todo1 = { id: 1, text: 'First', completed: false, createdAt: '' };
      const todo2 = { id: 1, text: 'Second', completed: false, createdAt: '' };
      const todos = [todo1, todo2];
      const result = getTodoById(todos, 1);

      expect(result === 1).toBe(true);
    });

    test('should find todo in large list', () => {
      const todos = Array.from({ length: 1000 }, (_, i) =>
        createTodo(`Todo ${i}`)
      );
      const targetTodo = todos[500];
      const result = getTodoById(todos, targetTodo.id);

      expect(result).toEqual(targetTodo);
    });
  });

  describe('clearCompleted', () => {
    test('should remove all completed todos', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = createTodo('Todo 2');
      const todo3 = { ...createTodo('Todo 3'), completed: true };
      const todos = [todo1, todo2, todo3];
      const result = clearCompleted(todos);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(todo2);
    });

    test('should return empty array when all todos are completed', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = { ...createTodo('Todo 2'), completed: true };
      const todos = [todo1, todo2];
      const result = clearCompleted(todos);

      expect(result).toEqual([]);
    });

    test('should return all todos when none are completed', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = clearCompleted(todos);

      expect(result).toHaveLength(2);
      expect(result).toEqual(todos);
    });

    test('should not mutate original todos array', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const originalLength = todos.length;

      clearCompleted(todos);

      expect(todos).toHaveLength(originalLength);
    });

    test('should return new array reference', () => {
      const todos = [createTodo('Todo')];
      const result = clearCompleted(todos);

      expect(result).not.toBe(todos);
    });

    test('should handle empty todos array', () => {
      const todos = [];
      const result = clearCompleted(todos);

      expect(result).toEqual([]);
    });
  });

  describe('getCompletedCount', () => {
    test('should return count of completed todos', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = createTodo('Todo 2');
      const todo3 = { ...createTodo('Todo 3'), completed: true };
      const todos = [todo1, todo2, todo3];
      const count = getCompletedCount(todos);

      expect(count).toBe(2);
    });

    test('should return 0 when no todos are completed', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const count = getCompletedCount(todos);

      expect(count).toBe(0);
    });

    test('should return total count when all todos are completed', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = { ...createTodo('Todo 2'), completed: true };
      const todos = [todo1, todo2];
      const count = getCompletedCount(todos);

      expect(count).toBe(2);
    });

    test('should return 0 for empty todos array', () => {
      const todos = [];
      const count = getCompletedCount(todos);

      expect(count).toBe(0);
    });

    test('should handle large number of todos', () => {
      const todos = Array.from({ length: 1000 }, (_, i) => ({
        ...createTodo(`Todo ${i}`),
        completed: i % 2 === 0,
      }));
      const count = getCompletedCount(todos);

      expect(count).toBe(500);
    });
  });

  describe('getPendingCount', () => {
    test('should return count of pending todos', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = createTodo('Todo 2');
      const todo3 = createTodo('Todo 3');
      const todos = [todo1, todo2, todo3];
      const count = getPendingCount(todos);

      expect(count).toBe(2);
    });

    test('should return total count when no todos are completed', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const count = getPendingCount(todos);

      expect(count).toBe(2);
    });

    test('should return 0 when all todos are completed', () => {
      const todo1 = { ...createTodo('Todo 1'), completed: true };
      const todo2 = { ...createTodo('Todo 2'), completed: true };
      const todos = [todo1, todo2];
      const count = getPendingCount(todos);

      expect(count).toBe(0);
    });

    test('should return 0 for empty todos array', () => {
      const todos = [];
      const count = getPendingCount(todos);

      expect(count).toBe(0);
    });

    test('should handle large number of todos', () => {
      const todos = Array.from({ length: 1000 }, (_, i) => ({
        ...createTodo(`Todo ${i}`),
        completed: i % 2 === 0,
      }));
      const count = getPendingCount(todos);

      expect(count).toBe(500);
    });
  });

  describe('getAllTodos', () => {
    test('should return all todos', () => {
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');
      const todos = [todo1, todo2];
      const result = getAllTodos(todos);

      expect(result).toEqual(todos);
    });

    test('should return empty array for empty input', () => {
      const todos = [];
      const result = getAllTodos(todos);

      expect(result).toEqual([]);
    });

    test('should return new array reference', () => {
      const todos = [createTodo('Todo')];
      const result = getAllTodos(todos);

      expect(result).not.toBe(todos);
    });

    test('should not mutate original array', () => {
      const todo = createTodo('Test');
      const todos = [todo];
      const result = getAllTodos(todos);

      result.push(createTodo('New'));

      expect(todos).toHaveLength(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null todo in getTodoById', () => {
      const todo = createTodo('Test');
      const todos = [todo, null];
      const result = getTodoById(todos, todo.id);

      expect(result).toEqual(todo);
    });

    test('should handle undefined in todos array', () => {
      const todo = createTodo('Test');
      const todos = [todo, undefined];
      const result = getTodoById(todos, todo.id);

      expect(result).toEqual(todo);
    });

    test('should handle very large todo lists', () => {
      const todos = Array.from({ length: 10000 }, (_, i) =>
        createTodo(`Todo ${i}`)
      );

      expect(todos).toHaveLength(10000);
      expect(getCompletedCount(todos)).toBe(0);
      expect(getPendingCount(todos)).toBe(10000);
    });

    test('should handle todos with same text but different ids', () => {
      const todo1 = createTodo('Same text');
      const todo2 = createTodo('Same text');
      const todos = [todo1, todo2];

      expect(todo1.id).not.toBe(todo2.id);
      expect(getTodoById(todos, todo1.id)).toEqual(todo1);
      expect(getTodoById(todos, todo2.id)).toEqual(todo2);
    });

    test('should handle rapid sequential operations', () => {
      let todos = [];

      // Add multiple todos
      for (let i = 0; i < 100; i++) {
        todos = addTodo(todos, createTodo(`Todo ${i}`));
      }

      expect(todos).toHaveLength(100);

      // Toggle some todos
      for (let i = 0; i < 50; i++) {
        todos = toggleTodo(todos, todos[i].id);
      }

      expect(getCompletedCount(todos)).toBe(50);

      // Remove some todos
      for (let i = 0; i < 25; i++) {
        todos = removeTodo(todos, todos[0].id);
      }

      expect(todos).toHaveLength(75);
    });

    test('should maintain data integrity through complex operations', () => {
      let todos = [];
      const todo1 = createTodo('Todo 1');
      const todo2 = createTodo('Todo 2');

      todos = addTodo(todos, todo1);
      todos = addTodo(todos, todo2);
      todos = toggleTodo(todos, todo1.id);
      todos = updateTodo(todos, todo2.id, { text: 'Updated Todo 2' });

      expect(todos).toHaveLength(2);
      expect(todos[0].completed).toBe(true);
      expect(todos[1].text).toBe('Updated Todo 2');
      expect(todos[0].id).toBe(todo1.id);
      expect(todos[1].id).toBe(todo2.id);
    });

    test('should handle null for non-existent id in getTodoById', () => {
      const todo = createTodo('Test');
      const todos = [todo];
      const result = getTodoById(todos, 999999);

      expect(result === null).toBe(true);
    });
  });
});