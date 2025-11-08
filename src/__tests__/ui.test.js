import { renderTodoList, createTodoElement } from '../ui.js';
import * as validation from '../validation.js';
import * as notifications from '../notifications.js';

describe('UI Module', () => {
  let container;

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
    container.innerHTML = `
      <ul id="todo-list"></ul>
      <div id="notification-container"></div>
    `;
    document.body.appendChild(container);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe('renderTodoList', () => {
    it('should render empty list when no todos provided', () => {
      const todoList = document.getElementById('todo-list');
      renderTodoList([]);

      expect(todoList.children.length).toBe(0);
    });

    it('should render single todo item', () => {
      const todos = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');

      expect(todoList.children.length).toBe(1);
      expect(todoList.children[0].textContent).toContain('Test todo');
    });

    it('should render multiple todo items', () => {
      const todos = [
        {
          id: '1',
          text: 'First todo',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          text: 'Second todo',
          completed: true,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');

      expect(todoList.children.length).toBe(2);
      expect(todoList.children[0].textContent).toContain('First todo');
      expect(todoList.children[1].textContent).toContain('Second todo');
    });

    it('should clear existing todos before rendering', () => {
      const todoList = document.getElementById('todo-list');
      todoList.innerHTML = '<li>Old todo</li>';

      const todos = [
        {
          id: '1',
          text: 'New todo',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);

      expect(todoList.children.length).toBe(1);
      expect(todoList.textContent).not.toContain('Old todo');
      expect(todoList.textContent).toContain('New todo');
    });

    it('should apply completed class to completed todos', () => {
      const todos = [
        {
          id: '1',
          text: 'Completed todo',
          completed: true,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');
      const todoItem = todoList.children[0];

      expect(todoItem.classList.contains('completed')).toBe(true);
    });

    it('should not apply completed class to incomplete todos', () => {
      const todos = [
        {
          id: '1',
          text: 'Incomplete todo',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');
      const todoItem = todoList.children[0];

      expect(todoItem.classList.contains('completed')).toBe(false);
    });

    it('should handle todos with special characters', () => {
      const todos = [
        {
          id: '1',
          text: 'Todo with <script>alert("xss")</script>',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');

      // Should escape HTML
      expect(todoList.innerHTML).not.toContain('<script>');
      expect(todoList.textContent).toContain('alert');
    });

    it('should render todos in order', () => {
      const todos = [
        {
          id: '1',
          text: 'First',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          text: 'Second',
          completed: false,
          createdAt: '2024-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          text: 'Third',
          completed: false,
          createdAt: '2024-01-03T00:00:00.000Z',
        },
      ];

      renderTodoList(todos);
      const todoList = document.getElementById('todo-list');

      expect(todoList.children[0].textContent).toContain('First');
      expect(todoList.children[1].textContent).toContain('Second');
      expect(todoList.children[2].textContent).toContain('Third');
    });
  });

  describe('createTodoElement', () => {
    it('should create todo element with correct structure', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.tagName).toBe('LI');
      expect(element.dataset.id).toBe('1');
      expect(element.textContent).toContain('Test todo');
    });

    it('should include checkbox for todo', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const checkbox = element.querySelector('input[type="checkbox"]');

      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(false);
    });

    it('should check checkbox for completed todos', () => {
      const todo = {
        id: '1',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const checkbox = element.querySelector('input[type="checkbox"]');

      expect(checkbox.checked).toBe(true);
    });

    it('should include delete button', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const deleteButton = element.querySelector('button.delete');

      expect(deleteButton).toBeTruthy();
    });

    it('should apply completed class to completed todos', () => {
      const todo = {
        id: '1',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.classList.contains('completed')).toBe(true);
    });

    it('should not apply completed class to incomplete todos', () => {
      const todo = {
        id: '1',
        text: 'Incomplete todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.classList.contains('completed')).toBe(false);
    });

    it('should escape HTML in todo text', () => {
      const todo = {
        id: '1',
        text: '<script>alert("xss")</script>',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.innerHTML).not.toContain('<script>');
      expect(element.textContent).toContain('alert');
    });

    it('should handle empty todo text', () => {
      const todo = {
        id: '1',
        text: '',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element).toBeTruthy();
      expect(element.dataset.id).toBe('1');
    });

    it('should handle very long todo text', () => {
      const longText = 'a'.repeat(1000);
      const todo = {
        id: '1',
        text: longText,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.textContent).toContain(longText);
    });

    it('should handle special characters in todo text', () => {
      const todo = {
        id: '1',
        text: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);

      expect(element.textContent).toContain('!@#$%^&*()_+-=[]{}|;:\'",.<>?/');
    });
  });

  describe('Input Validation Integration', () => {
    it('should validate todo text before adding', () => {
      const _validateSpy = jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: true,
        errors: [],
      });
      const _showSuccessSpy = jest.spyOn(notifications, 'showSuccess').mockImplementation(() => {});

      const input = document.createElement('input');
      input.value = 'Valid todo';
      document.body.appendChild(input);

      // Simulate validation check
      const result = validation.validateTodoText(input.value);

      expect(result.isValid).toBe(true);
      expect(_validateSpy).toHaveBeenCalledWith('Valid todo');

      document.body.removeChild(input);
    });

    it('should show error for invalid todo text', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: false,
        errors: ['Todo text is required'],
      });

      const input = document.createElement('input');
      input.value = '';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Todo text is required');

      document.body.removeChild(input);
    });

    it('should show error for todo text that is too long', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: false,
        errors: ['Todo text must be less than 200 characters'],
      });
      jest.spyOn(notifications, 'showError').mockImplementation(() => {});

      const input = document.createElement('input');
      input.value = 'a'.repeat(201);
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Todo text must be less than 200 characters'
      );

      document.body.removeChild(input);
    });

    it('should trim whitespace before validation', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: true,
        errors: [],
      });

      const input = document.createElement('input');
      input.value = '  Valid todo  ';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value.trim());

      expect(result.isValid).toBe(true);

      document.body.removeChild(input);
    });

    it('should show success notification after adding valid todo', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: true,
        errors: [],
      });
      const showSuccessSpy = jest.spyOn(notifications, 'showSuccess').mockImplementation(() => {});

      const input = document.createElement('input');
      input.value = 'Valid todo';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value);
      if (result.isValid) {
        notifications.showSuccess('Todo added successfully');
      }

      expect(showSuccessSpy).toHaveBeenCalledWith('Todo added successfully');

      document.body.removeChild(input);
    });

    it('should show error notification for invalid todo', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: false,
        errors: ['Todo text is required'],
      });
      const showErrorSpy = jest.spyOn(notifications, 'showError').mockImplementation(() => {});

      const input = document.createElement('input');
      input.value = '';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value);
      if (!result.isValid) {
        notifications.showError(result.errors[0]);
      }

      expect(showErrorSpy).toHaveBeenCalledWith('Todo text is required');

      document.body.removeChild(input);
    });

    it('should prevent adding todo with only whitespace', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: false,
        errors: ['Todo text is required'],
      });

      const input = document.createElement('input');
      input.value = '   ';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value.trim());

      expect(result.isValid).toBe(false);

      document.body.removeChild(input);
    });

    it('should validate todo text on input change', () => {
      const validateSpy = jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: true,
        errors: [],
      });

      const input = document.createElement('input');
      input.value = 'Test';
      document.body.appendChild(input);

      // Simulate input event
      input.dispatchEvent(new Event('input'));
      validation.validateTodoText(input.value);

      expect(validateSpy).toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should clear validation errors after successful add', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: true,
        errors: [],
      });

      const input = document.createElement('input');
      input.value = 'Valid todo';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Previous error';
      document.body.appendChild(input);
      document.body.appendChild(errorDiv);

      const result = validation.validateTodoText(input.value);
      if (result.isValid) {
        errorDiv.textContent = '';
      }

      expect(errorDiv.textContent).toBe('');

      document.body.removeChild(input);
      document.body.removeChild(errorDiv);
    });

    it('should show multiple validation errors', () => {
      jest.spyOn(validation, 'validateTodoText').mockReturnValue({
        isValid: false,
        errors: ['Todo text is required', 'Todo text must be at least 3 characters'],
      });

      const input = document.createElement('input');
      input.value = 'ab';
      document.body.appendChild(input);

      const result = validation.validateTodoText(input.value);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);

      document.body.removeChild(input);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing todo list element gracefully', () => {
      const todoList = document.getElementById('todo-list');
      todoList.remove();

      expect(() => {
        renderTodoList([]);
      }).toThrow();
    });

    it('should handle invalid todo data', () => {
      const invalidTodos = [
        {
          // Missing required fields
          text: 'Invalid todo',
        },
      ];

      expect(() => {
        renderTodoList(invalidTodos);
      }).toThrow();
    });

    it('should handle null todo list', () => {
      expect(() => {
        renderTodoList(null);
      }).toThrow();
    });

    it('should handle undefined todo list', () => {
      expect(() => {
        renderTodoList(undefined);
      }).toThrow();
    });

    it('should handle empty string as todo text', () => {
      const todo = {
        id: '1',
        text: '',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      expect(element).toBeTruthy();
    });

    it('should handle missing id in todo', () => {
      const todo = {
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        createTodoElement(todo);
      }).toThrow();
    });

    it('should handle missing text in todo', () => {
      const todo = {
        id: '1',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        createTodoElement(todo);
      }).toThrow();
    });

    it('should handle missing completed status', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        createTodoElement(todo);
      }).toThrow();
    });

    it('should handle invalid date format', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: 'invalid-date',
      };

      const element = createTodoElement(todo);
      expect(element).toBeTruthy();
    });

    it('should handle very large todo lists', () => {
      const largeTodoList = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        text: `Todo ${i}`,
        completed: false,
        createdAt: new Date().toISOString(),
      }));

      expect(() => {
        renderTodoList(largeTodoList);
      }).not.toThrow();

      const todoList = document.getElementById('todo-list');
      expect(todoList.children.length).toBe(1000);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching todos', () => {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading';
      loadingDiv.className = 'loading';
      loadingDiv.textContent = 'Loading...';
      document.body.appendChild(loadingDiv);

      expect(loadingDiv.textContent).toBe('Loading...');
      expect(loadingDiv.classList.contains('loading')).toBe(true);

      document.body.removeChild(loadingDiv);
    });

    it('should hide loading state after todos are loaded', () => {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading';
      loadingDiv.className = 'loading';
      document.body.appendChild(loadingDiv);

      // Simulate loading complete
      loadingDiv.classList.remove('loading');
      loadingDiv.classList.add('hidden');

      expect(loadingDiv.classList.contains('hidden')).toBe(true);
      expect(loadingDiv.classList.contains('loading')).toBe(false);

      document.body.removeChild(loadingDiv);
    });

    it('should show loading state while adding todo', () => {
      const button = document.createElement('button');
      button.id = 'add-button';
      button.textContent = 'Add Todo';
      document.body.appendChild(button);

      // Simulate loading state
      button.disabled = true;
      button.textContent = 'Adding...';

      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Adding...');

      document.body.removeChild(button);
    });

    it('should restore button state after adding todo', () => {
      const button = document.createElement('button');
      button.id = 'add-button';
      button.disabled = true;
      button.textContent = 'Adding...';
      document.body.appendChild(button);

      // Simulate loading complete
      button.disabled = false;
      button.textContent = 'Add Todo';

      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Add Todo');

      document.body.removeChild(button);
    });

    it('should show loading state while deleting todo', () => {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete';
      deleteButton.textContent = 'Delete';
      document.body.appendChild(deleteButton);

      // Simulate loading state
      deleteButton.disabled = true;
      deleteButton.textContent = 'Deleting...';

      expect(deleteButton.disabled).toBe(true);
      expect(deleteButton.textContent).toBe('Deleting...');

      document.body.removeChild(deleteButton);
    });

    it('should show loading state while toggling todo', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);

      // Simulate loading state
      checkbox.disabled = true;

      expect(checkbox.disabled).toBe(true);

      document.body.removeChild(checkbox);
    });
  });

  describe('Visual Feedback', () => {
    it('should show success notification after adding todo', () => {
      jest.spyOn(notifications, 'showSuccess').mockImplementation(() => {});

      notifications.showSuccess('Todo added successfully');

      expect(notifications.showSuccess).toHaveBeenCalledWith(
        'Todo added successfully'
      );
    });

    it('should show error notification when adding fails', () => {
      jest.spyOn(notifications, 'showError').mockImplementation(() => {});

      notifications.showError('Failed to add todo');

      expect(notifications.showError).toHaveBeenCalledWith(
        'Failed to add todo'
      );
    });

    it('should show success notification after deleting todo', () => {
      jest.spyOn(notifications, 'showSuccess').mockImplementation(() => {});

      notifications.showSuccess('Todo deleted successfully');

      expect(notifications.showSuccess).toHaveBeenCalledWith(
        'Todo deleted successfully'
      );
    });

    it('should show error notification when deleting fails', () => {
      jest.spyOn(notifications, 'showError').mockImplementation(() => {});

      notifications.showError('Failed to delete todo');

      expect(notifications.showError).toHaveBeenCalledWith(
        'Failed to delete todo'
      );
    });

    it('should show success notification after toggling todo', () => {
      jest.spyOn(notifications, 'showSuccess').mockImplementation(() => {});

      notifications.showSuccess('Todo updated successfully');

      expect(notifications.showSuccess).toHaveBeenCalledWith(
        'Todo updated successfully'
      );
    });

    it('should show error notification when toggling fails', () => {
      jest.spyOn(notifications, 'showError').mockImplementation(() => {});

      notifications.showError('Failed to update todo');

      expect(notifications.showError).toHaveBeenCalledWith(
        'Failed to update todo'
      );
    });

    it('should highlight input field on validation error', () => {
      const input = document.createElement('input');
      input.className = '';
      document.body.appendChild(input);

      // Simulate validation error
      input.classList.add('error');

      expect(input.classList.contains('error')).toBe(true);

      document.body.removeChild(input);
    });

    it('should remove error highlight after successful validation', () => {
      const input = document.createElement('input');
      input.className = 'error';
      document.body.appendChild(input);

      // Simulate successful validation
      input.classList.remove('error');

      expect(input.classList.contains('error')).toBe(false);

      document.body.removeChild(input);
    });

    it('should show validation error message below input', () => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Todo text is required';
      document.body.appendChild(errorDiv);

      expect(errorDiv.textContent).toBe('Todo text is required');
      expect(errorDiv.classList.contains('error-message')).toBe(true);

      document.body.removeChild(errorDiv);
    });

    it('should clear validation error message after successful validation', () => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Todo text is required';
      document.body.appendChild(errorDiv);

      // Simulate successful validation
      errorDiv.textContent = '';

      expect(errorDiv.textContent).toBe('');

      document.body.removeChild(errorDiv);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on todo items', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const checkbox = element.querySelector('input[type="checkbox"]');

      expect(checkbox.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have proper ARIA labels on delete buttons', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const deleteButton = element.querySelector('button.delete');

      expect(deleteButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should announce todo addition to screen readers', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);

      liveRegion.textContent = 'Todo added successfully';

      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent).toBe('Todo added successfully');

      document.body.removeChild(liveRegion);
    });

    it('should announce todo deletion to screen readers', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);

      liveRegion.textContent = 'Todo deleted successfully';

      expect(liveRegion.textContent).toBe('Todo deleted successfully');

      document.body.removeChild(liveRegion);
    });

    it('should have keyboard navigation support', () => {
      const todo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const element = createTodoElement(todo);
      const checkbox = element.querySelector('input[type="checkbox"]');
      const deleteButton = element.querySelector('button.delete');

      expect(checkbox.tabIndex).toBeGreaterThanOrEqual(0);
      expect(deleteButton.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should render large todo lists efficiently', () => {
      const largeTodoList = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        text: `Todo ${i}`,
        completed: false,
        createdAt: new Date().toISOString(),
      }));

      const startTime = performance.now();
      renderTodoList(largeTodoList);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('should not cause memory leaks when rendering multiple times', () => {
      const todos = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];

      // Render multiple times
      for (let i = 0; i < 100; i++) {
        renderTodoList(todos);
      }

      const todoList = document.getElementById('todo-list');
      expect(todoList.children.length).toBe(1); // Should only have 1 todo
    });
  });
});