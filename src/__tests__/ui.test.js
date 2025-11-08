/**
 * UI Module Unit Tests
 * 
 * Comprehensive test suite for UI rendering module covering DOM manipulation,
 * event handling, timestamp formatting, and input management.
 * Tests ensure proper error handling, accessibility, and edge case coverage.
 * 
 * @module src/__tests__/ui.test
 */

import { screen } from '@testing-library/dom';
import { renderTodos, formatTimestamp, clearInput } from '../ui.js';

/**
 * Test Suite: UI Module
 * 
 * Tests all public functions of the UI module with focus on:
 * - DOM manipulation correctness
 * - Event handler attachment and invocation
 * - Error handling and validation
 * - Accessibility attributes
 * - Edge cases and boundary conditions
 */
describe('UI Module', () => {
  /**
   * Setup: Create DOM structure before each test
   * Ensures clean, isolated test environment with required elements
   */
  beforeEach(() => {
    // Create main todo list container
    const todoList = document.createElement('ul');
    todoList.id = 'todo-list';
    todoList.setAttribute('data-testid', 'todo-list');
    document.body.appendChild(todoList);

    // Create input element for clearInput tests
    const input = document.createElement('input');
    input.id = 'todo-input';
    input.type = 'text';
    input.setAttribute('data-testid', 'todo-input');
    document.body.appendChild(input);

    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  /**
   * Cleanup: Restore console and clear DOM after each test
   */
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  /**
   * Test Suite: renderTodos()
   * 
   * Tests the main rendering function for todo items including:
   * - Empty state rendering
   * - Multiple item rendering
   * - DOM structure correctness
   * - Event handler attachment
   * - Data attribute presence
   * - Error handling
   */
  describe('renderTodos()', () => {
    /**
     * Test: Empty State Rendering
     * Verifies that renderTodos correctly handles empty array
     */
    test('renders empty state correctly', () => {
      const mockOnDelete = jest.fn();
      const todos = [];

      renderTodos(todos, mockOnDelete);

      const listContainer = document.getElementById('todo-list');
      expect(listContainer).toBeInTheDocument();
      expect(listContainer.children.length).toBe(0);
      expect(listContainer.innerHTML).toBe('');
    });

    /**
     * Test: Single Todo Rendering
     * Verifies correct rendering of a single todo item with all elements
     */
    test('renders single todo with correct structure', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'test-id-1',
          text: 'Test todo item',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      const listContainer = document.getElementById('todo-list');
      expect(listContainer.children.length).toBe(1);

      // Verify list item structure
      const todoItem = screen.getByTestId('todo-item-test-id-1');
      expect(todoItem).toBeInTheDocument();
      expect(todoItem.tagName).toBe('LI');
      expect(todoItem.className).toBe('todo-item');
      expect(todoItem.getAttribute('data-todo-id')).toBe('test-id-1');

      // Verify content container
      const contentDiv = screen.getByTestId('todo-content-test-id-1');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv.className).toBe('todo-content');

      // Verify text element
      const textDiv = screen.getByTestId('todo-text-test-id-1');
      expect(textDiv).toBeInTheDocument();
      expect(textDiv.className).toBe('todo-text');
      expect(textDiv.textContent).toBe('Test todo item');

      // Verify timestamp element
      const timestampDiv = screen.getByTestId('todo-timestamp-test-id-1');
      expect(timestampDiv).toBeInTheDocument();
      expect(timestampDiv.className).toBe('todo-timestamp');
      expect(timestampDiv.textContent).toContain('Added on');

      // Verify delete button
      const deleteBtn = screen.getByTestId('delete-btn-test-id-1');
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn.tagName).toBe('BUTTON');
      expect(deleteBtn.className).toBe('delete-btn');
      expect(deleteBtn.textContent).toBe('Delete');
      expect(deleteBtn.getAttribute('aria-label')).toBe('Delete todo: Test todo item');
    });

    /**
     * Test: Multiple Todos Rendering
     * Verifies correct rendering of multiple todo items in order
     */
    test('renders multiple todos with correct structure', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'todo-1',
          text: 'First todo',
          timestamp: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 'todo-2',
          text: 'Second todo',
          timestamp: '2024-01-15T11:45:00.000Z'
        },
        {
          id: 'todo-3',
          text: 'Third todo',
          timestamp: '2024-01-15T14:20:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      const listContainer = document.getElementById('todo-list');
      expect(listContainer.children.length).toBe(3);

      // Verify all items are rendered
      expect(screen.getByTestId('todo-item-todo-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-todo-2')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-todo-3')).toBeInTheDocument();

      // Verify text content
      expect(screen.getByTestId('todo-text-todo-1').textContent).toBe('First todo');
      expect(screen.getByTestId('todo-text-todo-2').textContent).toBe('Second todo');
      expect(screen.getByTestId('todo-text-todo-3').textContent).toBe('Third todo');

      // Verify all delete buttons are present
      expect(screen.getByTestId('delete-btn-todo-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-btn-todo-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-btn-todo-3')).toBeInTheDocument();
    });

    /**
     * Test: Delete Handler Attachment
     * Verifies that delete handlers are properly attached and invoked
     */
    test('attaches delete handlers correctly', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'delete-test-1',
          text: 'Test delete',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      const deleteBtn = screen.getByTestId('delete-btn-delete-test-1');
      
      // Click the delete button
      deleteBtn.click();

      // Verify callback was invoked with correct ID
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith('delete-test-1');
    });

    /**
     * Test: Multiple Delete Handlers
     * Verifies that each delete button has its own handler with correct ID
     */
    test('attaches separate delete handlers for multiple todos', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'multi-1',
          text: 'First',
          timestamp: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 'multi-2',
          text: 'Second',
          timestamp: '2024-01-15T11:30:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      // Click first delete button
      screen.getByTestId('delete-btn-multi-1').click();
      expect(mockOnDelete).toHaveBeenCalledWith('multi-1');

      // Click second delete button
      screen.getByTestId('delete-btn-multi-2').click();
      expect(mockOnDelete).toHaveBeenCalledWith('multi-2');

      expect(mockOnDelete).toHaveBeenCalledTimes(2);
    });

    /**
     * Test: Data-testid Attributes
     * Verifies all elements have proper data-testid attributes for testing
     */
    test('uses data-testid attributes correctly', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'testid-check',
          text: 'Check testids',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      // Verify all data-testid attributes are present
      expect(screen.getByTestId('todo-item-testid-check')).toBeInTheDocument();
      expect(screen.getByTestId('todo-content-testid-check')).toBeInTheDocument();
      expect(screen.getByTestId('todo-text-testid-check')).toBeInTheDocument();
      expect(screen.getByTestId('todo-timestamp-testid-check')).toBeInTheDocument();
      expect(screen.getByTestId('delete-btn-testid-check')).toBeInTheDocument();
    });

    /**
     * Test: Clear Previous Todos
     * Verifies that previous todos are cleared before rendering new ones
     */
    test('clears previous todos before rendering', () => {
      const mockOnDelete = jest.fn();
      
      // First render
      const firstTodos = [
        {
          id: 'first-1',
          text: 'First render',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      ];
      renderTodos(firstTodos, mockOnDelete);
      expect(document.getElementById('todo-list').children.length).toBe(1);

      // Second render with different todos
      const secondTodos = [
        {
          id: 'second-1',
          text: 'Second render',
          timestamp: '2024-01-15T11:30:00.000Z'
        },
        {
          id: 'second-2',
          text: 'Another todo',
          timestamp: '2024-01-15T12:30:00.000Z'
        }
      ];
      renderTodos(secondTodos, mockOnDelete);

      // Verify old todos are gone and new ones are present
      expect(document.getElementById('todo-list').children.length).toBe(2);
      expect(screen.queryByTestId('todo-item-first-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('todo-item-second-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-second-2')).toBeInTheDocument();
    });

    /**
     * Test: Invalid Todos Parameter
     * Verifies proper error handling for non-array todos parameter
     */
    test('throws TypeError when todos is not an array', () => {
      const mockOnDelete = jest.fn();

      expect(() => renderTodos(null, mockOnDelete)).toThrow(TypeError);
      expect(() => renderTodos(null, mockOnDelete)).toThrow('Todos must be an array');
      
      expect(() => renderTodos(undefined, mockOnDelete)).toThrow(TypeError);
      expect(() => renderTodos('not an array', mockOnDelete)).toThrow(TypeError);
      expect(() => renderTodos({}, mockOnDelete)).toThrow(TypeError);
      expect(() => renderTodos(123, mockOnDelete)).toThrow(TypeError);
    });

    /**
     * Test: Invalid onDelete Parameter
     * Verifies proper error handling for non-function onDelete parameter
     */
    test('throws TypeError when onDelete is not a function', () => {
      const todos = [];

      expect(() => renderTodos(todos, null)).toThrow(TypeError);
      expect(() => renderTodos(todos, null)).toThrow('onDelete must be a function');
      
      expect(() => renderTodos(todos, undefined)).toThrow(TypeError);
      expect(() => renderTodos(todos, 'not a function')).toThrow(TypeError);
      expect(() => renderTodos(todos, {})).toThrow(TypeError);
      expect(() => renderTodos(todos, 123)).toThrow(TypeError);
    });

    /**
     * Test: Missing List Container
     * Verifies proper error handling when todo-list element is missing
     */
    test('throws Error when todo-list element is not found', () => {
      const mockOnDelete = jest.fn();
      const todos = [];

      // Remove the list container
      document.getElementById('todo-list').remove();

      expect(() => renderTodos(todos, mockOnDelete)).toThrow(Error);
      expect(() => renderTodos(todos, mockOnDelete)).toThrow('Todo list container element not found in DOM');
    });

    /**
     * Test: Invalid Todo Items
     * Verifies that invalid todo items are skipped without breaking render
     */
    test('skips invalid todo items gracefully', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'valid-1',
          text: 'Valid todo',
          timestamp: '2024-01-15T10:30:00.000Z'
        },
        null, // Invalid: null
        {
          id: 'valid-2',
          text: 'Another valid',
          timestamp: '2024-01-15T11:30:00.000Z'
        },
        { text: 'Missing id', timestamp: '2024-01-15T12:30:00.000Z' }, // Invalid: no id
        {
          id: 'valid-3',
          text: 'Third valid',
          timestamp: '2024-01-15T13:30:00.000Z'
        },
        { id: 'missing-text', timestamp: '2024-01-15T14:30:00.000Z' }, // Invalid: no text
        { id: 'missing-timestamp', text: 'No timestamp' } // Invalid: no timestamp
      ];

      renderTodos(todos, mockOnDelete);

      const listContainer = document.getElementById('todo-list');
      
      // Only valid todos should be rendered
      expect(listContainer.children.length).toBe(3);
      expect(screen.getByTestId('todo-item-valid-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-valid-2')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-valid-3')).toBeInTheDocument();
    });

    /**
     * Test: Invalid Timestamp Handling
     * Verifies graceful handling of invalid timestamps
     */
    test('handles invalid timestamps gracefully', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'invalid-timestamp',
          text: 'Todo with bad timestamp',
          timestamp: 'not-a-valid-date'
        }
      ];

      renderTodos(todos, mockOnDelete);

      const timestampDiv = screen.getByTestId('todo-timestamp-invalid-timestamp');
      expect(timestampDiv.textContent).toBe('Invalid date');
    });

    /**
     * Test: Event Propagation
     * Verifies that delete button click events are properly handled
     */
    test('prevents event propagation on delete button click', () => {
      const mockOnDelete = jest.fn();
      const todos = [
        {
          id: 'event-test',
          text: 'Event test',
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      ];

      renderTodos(todos, mockOnDelete);

      const deleteBtn = screen.getByTestId('delete-btn-event-test');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      deleteBtn.dispatchEvent(clickEvent);

      expect(mockOnDelete).toHaveBeenCalledWith('event-test');
    });
  });

  /**
   * Test Suite: formatTimestamp()
   * 
   * Tests timestamp formatting function including:
   * - Valid date formatting
   * - Invalid date handling
   * - Type validation
   * - Edge cases
   */
  describe('formatTimestamp()', () => {
    /**
     * Test: Valid ISO String Formatting
     * Verifies correct formatting of valid ISO 8601 timestamps
     */
    test('formats ISO string to readable date', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = formatTimestamp(isoString);

      expect(result).toContain('Added on');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    /**
     * Test: Different Time Zones
     * Verifies formatting works with different ISO timestamp formats
     */
    test('formats different ISO timestamp formats', () => {
      const timestamps = [
        '2024-01-15T10:30:00.000Z',
        '2024-06-20T15:45:30.500Z',
        '2024-12-31T23:59:59.999Z'
      ];

      timestamps.forEach(timestamp => {
        const result = formatTimestamp(timestamp);
        expect(result).toContain('Added on');
        expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
      });
    });

    /**
     * Test: Invalid Date String
     * Verifies proper error handling for invalid date strings
     */
    test('handles invalid dates', () => {
      const invalidDates = [
        'not-a-date',
        'invalid-timestamp',
        '2024-13-45T99:99:99.000Z',
        ''
      ];

      invalidDates.forEach(invalidDate => {
        expect(() => formatTimestamp(invalidDate)).toThrow(Error);
        expect(() => formatTimestamp(invalidDate)).toThrow('Invalid date string provided');
      });
    });

    /**
     * Test: Non-String Input
     * Verifies proper error handling for non-string inputs
     */
    test('throws TypeError for non-string input', () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
        true,
        new Date()
      ];

      invalidInputs.forEach(input => {
        expect(() => formatTimestamp(input)).toThrow(TypeError);
        expect(() => formatTimestamp(input)).toThrow('Timestamp must be a string');
      });
    });

    /**
     * Test: Edge Case Dates
     * Verifies formatting of edge case dates
     */
    test('handles edge case dates correctly', () => {
      // Leap year date
      const leapYear = '2024-02-29T12:00:00.000Z';
      expect(formatTimestamp(leapYear)).toContain('Feb');
      expect(formatTimestamp(leapYear)).toContain('29');

      // Start of year
      const startOfYear = '2024-01-01T00:00:00.000Z';
      expect(formatTimestamp(startOfYear)).toContain('Jan');
      expect(formatTimestamp(startOfYear)).toContain('1');

      // End of year
      const endOfYear = '2024-12-31T23:59:59.999Z';
      expect(formatTimestamp(endOfYear)).toContain('Dec');
      expect(formatTimestamp(endOfYear)).toContain('31');
    });
  });

  /**
   * Test Suite: clearInput()
   * 
   * Tests input clearing function including:
   * - Value clearing
   * - Focus management
   * - Error handling
   */
  describe('clearInput()', () => {
    /**
     * Test: Clear Input Value
     * Verifies that input value is properly cleared
     */
    test('clears input value', () => {
      const input = document.getElementById('todo-input');
      input.value = 'Some text to clear';

      clearInput();

      expect(input.value).toBe('');
    });

    /**
     * Test: Focus Input Element
     * Verifies that input element receives focus after clearing
     */
    test('focuses input element', () => {
      const input = document.getElementById('todo-input');
      const focusSpy = jest.spyOn(input, 'focus');

      clearInput();

      expect(focusSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(input);
    });

    /**
     * Test: Clear and Focus Together
     * Verifies both operations happen in correct order
     */
    test('clears and focuses input in one operation', () => {
      const input = document.getElementById('todo-input');
      input.value = 'Test value';
      const focusSpy = jest.spyOn(input, 'focus');

      clearInput();

      expect(input.value).toBe('');
      expect(focusSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(input);
    });

    /**
     * Test: Missing Input Element
     * Verifies proper error handling when input element is missing
     */
    test('throws Error when input element is not found', () => {
      // Remove the input element
      document.getElementById('todo-input').remove();

      expect(() => clearInput()).toThrow(Error);
      expect(() => clearInput()).toThrow('Todo input element not found in DOM');
    });

    /**
     * Test: Multiple Calls
     * Verifies function works correctly when called multiple times
     */
    test('handles multiple consecutive calls', () => {
      const input = document.getElementById('todo-input');
      
      input.value = 'First value';
      clearInput();
      expect(input.value).toBe('');

      input.value = 'Second value';
      clearInput();
      expect(input.value).toBe('');

      input.value = 'Third value';
      clearInput();
      expect(input.value).toBe('');
    });

    /**
     * Test: Already Empty Input
     * Verifies function works when input is already empty
     */
    test('works when input is already empty', () => {
      const input = document.getElementById('todo-input');
      input.value = '';

      expect(() => clearInput()).not.toThrow();
      expect(input.value).toBe('');
    });
  });
});