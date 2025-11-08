/**
 * UI Rendering Module
 * 
 * Responsible for DOM manipulation and displaying todo items with proper event handling.
 * Provides functions for rendering todos, formatting timestamps, and managing form input.
 * All DOM operations include proper error handling and logging.
 * 
 * @module ui
 */

import { validateTodoText, createRealtimeValidator } from './validation.js';
import { showToast, NotificationType } from './notifications.js';

/**
 * Formats an ISO 8601 timestamp string into a human-readable format.
 * 
 * @param {string} isoString - ISO 8601 timestamp string
 * @returns {string} Formatted date string like "Added on Jan 1, 2024 at 10:30 AM"
 * @throws {TypeError} If isoString is not a string
 * @throws {Error} If isoString is not a valid date
 * 
 * @example
 * formatTimestamp('2025-01-08T12:30:00.000Z')
 * // Returns: "Added on Jan 8, 2025 at 12:30 PM"
 */
export function formatTimestamp(isoString) {
  if (typeof isoString !== 'string') {
    console.error('[UI] formatTimestamp: Invalid input type', { type: typeof isoString });
    throw new TypeError('Timestamp must be a string');
  }

  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    console.error('[UI] formatTimestamp: Invalid date string', { isoString });
    throw new Error('Invalid date string provided');
  }

  try {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    const formatted = date.toLocaleString('en-US', options);
    return `Added on ${formatted}`;
  } catch (error) {
    console.error('[UI] formatTimestamp: Error formatting date', { 
      isoString, 
      error: error.message 
    });
    throw new Error(`Failed to format timestamp: ${error.message}`);
  }
}

/**
 * Clears the todo input field and sets focus to it.
 * Handles cases where the input element might not exist.
 * Also clears any error states.
 * 
 * @throws {Error} If the input element is not found in the DOM
 * 
 * @example
 * clearInput();
 * // Input field is cleared and focused
 */
export function clearInput() {
  const input = document.getElementById('todo-input');
  
  if (!input) {
    console.error('[UI] clearInput: Input element not found', { 
      elementId: 'todo-input' 
    });
    throw new Error('Todo input element not found in DOM');
  }

  try {
    input.value = '';
    input.focus();
    clearInputError();
    console.debug('[UI] clearInput: Input cleared and focused');
  } catch (error) {
    console.error('[UI] clearInput: Error clearing input', { 
      error: error.message 
    });
    throw new Error(`Failed to clear input: ${error.message}`);
  }
}

/**
 * Displays an error message for the input field with proper accessibility attributes.
 * 
 * @param {string} errorMessage - The error message to display
 * @throws {TypeError} If errorMessage is not a string
 * @throws {Error} If the input element is not found in the DOM
 * 
 * @example
 * showInputError('Task cannot be empty');
 */
export function showInputError(errorMessage) {
  if (typeof errorMessage !== 'string') {
    console.error('[UI] showInputError: Invalid error message type', { 
      type: typeof errorMessage 
    });
    throw new TypeError('Error message must be a string');
  }

  const input = document.getElementById('todo-input');
  
  if (!input) {
    console.error('[UI] showInputError: Input element not found', { 
      elementId: 'todo-input' 
    });
    throw new Error('Todo input element not found in DOM');
  }

  try {
    // Add error class to input
    input.classList.add('input--error');
    input.setAttribute('aria-invalid', 'true');

    // Remove existing error message if present
    const existingError = document.querySelector('.input__error');
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorSpan = document.createElement('span');
    errorSpan.className = 'input__error';
    errorSpan.setAttribute('role', 'alert');
    errorSpan.setAttribute('data-testid', 'input-error');
    errorSpan.textContent = errorMessage;

    // Insert error message after input
    input.parentNode.insertBefore(errorSpan, input.nextSibling);

    console.debug('[UI] showInputError: Error message displayed', { errorMessage });
  } catch (error) {
    console.error('[UI] showInputError: Error displaying error message', { 
      error: error.message 
    });
    throw new Error(`Failed to show input error: ${error.message}`);
  }
}

/**
 * Clears the error state from the input field.
 * 
 * @example
 * clearInputError();
 */
export function clearInputError() {
  const input = document.getElementById('todo-input');
  
  if (!input) {
    console.warn('[UI] clearInputError: Input element not found', { 
      elementId: 'todo-input' 
    });
    return;
  }

  try {
    // Remove error class from input
    input.classList.remove('input--error');
    input.setAttribute('aria-invalid', 'false');

    // Remove error message if present
    const errorSpan = document.querySelector('.input__error');
    if (errorSpan) {
      errorSpan.remove();
    }

    console.debug('[UI] clearInputError: Error state cleared');
  } catch (error) {
    console.error('[UI] clearInputError: Error clearing error state', { 
      error: error.message 
    });
  }
}

/**
 * Sets the loading state for the form, disabling/enabling the submit button.
 * 
 * @param {boolean} isLoading - Whether the form is in loading state
 * @throws {TypeError} If isLoading is not a boolean
 * @throws {Error} If the submit button is not found in the DOM
 * 
 * @example
 * setLoadingState(true);  // Disable button and show loading
 * setLoadingState(false); // Enable button and hide loading
 */
export function setLoadingState(isLoading) {
  if (typeof isLoading !== 'boolean') {
    console.error('[UI] setLoadingState: Invalid isLoading type', { 
      type: typeof isLoading 
    });
    throw new TypeError('isLoading must be a boolean');
  }

  const submitButton = document.querySelector('button[type="submit"]');
  
  if (!submitButton) {
    console.error('[UI] setLoadingState: Submit button not found');
    throw new Error('Submit button not found in DOM');
  }

  try {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.classList.add('button--loading');
      console.debug('[UI] setLoadingState: Loading state enabled');
    } else {
      submitButton.disabled = false;
      submitButton.classList.remove('button--loading');
      console.debug('[UI] setLoadingState: Loading state disabled');
    }
  } catch (error) {
    console.error('[UI] setLoadingState: Error setting loading state', { 
      error: error.message 
    });
    throw new Error(`Failed to set loading state: ${error.message}`);
  }
}

/**
 * Attaches real-time validation to an input element.
 * 
 * @param {HTMLInputElement} inputElement - The input element to validate
 * @throws {TypeError} If inputElement is not an HTMLInputElement
 * 
 * @example
 * const input = document.getElementById('todo-input');
 * validateInputRealtime(input);
 */
export function validateInputRealtime(inputElement) {
  if (!(inputElement instanceof HTMLInputElement)) {
    console.error('[UI] validateInputRealtime: Invalid input element', { 
      type: typeof inputElement 
    });
    throw new TypeError('inputElement must be an HTMLInputElement');
  }

  try {
    const validator = createRealtimeValidator((result) => {
      if (result.isValid) {
        clearInputError();
        enableSubmitButton();
      } else {
        showInputError(result.error);
        disableSubmitButton();
      }
    });

    inputElement.addEventListener('input', (event) => {
      const value = event.target.value;
      validator(value);
    });

    console.debug('[UI] validateInputRealtime: Real-time validation attached');
  } catch (error) {
    console.error('[UI] validateInputRealtime: Error attaching validation', { 
      error: error.message 
    });
    throw new Error(`Failed to attach real-time validation: ${error.message}`);
  }
}

/**
 * Disables the submit button.
 * 
 * @example
 * disableSubmitButton();
 */
export function disableSubmitButton() {
  const submitButton = document.querySelector('button[type="submit"]');
  
  if (!submitButton) {
    console.warn('[UI] disableSubmitButton: Submit button not found');
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.classList.add('button--disabled');
    console.debug('[UI] disableSubmitButton: Submit button disabled');
  } catch (error) {
    console.error('[UI] disableSubmitButton: Error disabling button', { 
      error: error.message 
    });
  }
}

/**
 * Enables the submit button.
 * 
 * @example
 * enableSubmitButton();
 */
export function enableSubmitButton() {
  const submitButton = document.querySelector('button[type="submit"]');
  
  if (!submitButton) {
    console.warn('[UI] enableSubmitButton: Submit button not found');
    return;
  }

  try {
    submitButton.disabled = false;
    submitButton.classList.remove('button--disabled');
    console.debug('[UI] enableSubmitButton: Submit button enabled');
  } catch (error) {
    console.error('[UI] enableSubmitButton: Error enabling button', { 
      error: error.message 
    });
  }
}

/**
 * Renders the list of todo items to the DOM.
 * Clears existing items and creates new DOM elements for each todo.
 * Attaches delete event handlers with proper cleanup.
 * 
 * @param {Array<Object>} todos - Array of todo items to render
 * @param {string} todos[].id - Unique identifier for the todo
 * @param {string} todos[].text - The todo item text (should be pre-sanitized)
 * @param {string} todos[].timestamp - ISO 8601 timestamp of creation
 * @param {Function} onDelete - Callback function called when delete button is clicked
 * @throws {TypeError} If todos is not an array
 * @throws {TypeError} If onDelete is not a function
 * @throws {Error} If the todo-list element is not found in the DOM
 * 
 * @example
 * const todos = [
 *   { id: '1', text: 'Buy groceries', timestamp: '2025-01-08T12:00:00.000Z' }
 * ];
 * renderTodos(todos, (id) => console.log('Delete:', id));
 */
export function renderTodos(todos, onDelete) {
  // Input validation
  if (!Array.isArray(todos)) {
    console.error('[UI] renderTodos: Invalid todos parameter', { 
      type: typeof todos 
    });
    throw new TypeError('Todos must be an array');
  }

  if (typeof onDelete !== 'function') {
    console.error('[UI] renderTodos: Invalid onDelete parameter', { 
      type: typeof onDelete 
    });
    throw new TypeError('onDelete must be a function');
  }

  // Get the list container
  const listContainer = document.getElementById('todo-list');
  
  if (!listContainer) {
    console.error('[UI] renderTodos: List container not found', { 
      elementId: 'todo-list' 
    });
    throw new Error('Todo list container element not found in DOM');
  }

  console.info('[UI] renderTodos: Starting render', { 
    todoCount: todos.length 
  });

  try {
    // Clear existing items and their event listeners
    listContainer.innerHTML = '';

    // Handle empty state
    if (todos.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-state';
      emptyMessage.setAttribute('data-testid', 'empty-state');
      emptyMessage.textContent = 'No tasks yet. Add one above to get started!';
      listContainer.appendChild(emptyMessage);
      console.info('[UI] renderTodos: Empty state displayed');
      return;
    }

    // Render each todo item
    todos.forEach((todo, index) => {
      try {
        // Validate todo structure
        if (!todo || typeof todo !== 'object') {
          console.warn('[UI] renderTodos: Invalid todo item', { 
            index, 
            todo 
          });
          return;
        }

        if (!todo.id || typeof todo.id !== 'string') {
          console.warn('[UI] renderTodos: Todo missing valid id', { 
            index, 
            todo 
          });
          return;
        }

        if (!todo.text || typeof todo.text !== 'string') {
          console.warn('[UI] renderTodos: Todo missing valid text', { 
            index, 
            todoId: todo.id 
          });
          return;
        }

        if (!todo.timestamp || typeof todo.timestamp !== 'string') {
          console.warn('[UI] renderTodos: Todo missing valid timestamp', { 
            index, 
            todoId: todo.id 
          });
          return;
        }

        // Create list item
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.setAttribute('data-testid', `todo-item-${todo.id}`);
        li.setAttribute('data-todo-id', todo.id);

        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';
        contentDiv.setAttribute('data-testid', `todo-content-${todo.id}`);

        // Create text element (text is already sanitized from storage)
        const textDiv = document.createElement('div');
        textDiv.className = 'todo-text';
        textDiv.setAttribute('data-testid', `todo-text-${todo.id}`);
        textDiv.textContent = todo.text;

        // Create timestamp element
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'todo-timestamp';
        timestampDiv.setAttribute('data-testid', `todo-timestamp-${todo.id}`);
        
        try {
          timestampDiv.textContent = formatTimestamp(todo.timestamp);
        } catch (error) {
          console.warn('[UI] renderTodos: Error formatting timestamp', { 
            todoId: todo.id, 
            timestamp: todo.timestamp,
            error: error.message 
          });
          timestampDiv.textContent = 'Invalid date';
        }

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('data-testid', `delete-btn-${todo.id}`);
        deleteBtn.setAttribute('aria-label', `Delete todo: ${todo.text}`);
        deleteBtn.textContent = 'Delete';

        // Attach delete event handler with error handling
        const handleDelete = (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          console.debug('[UI] renderTodos: Delete button clicked', { 
            todoId: todo.id 
          });

          try {
            onDelete(todo.id);
          } catch (error) {
            console.error('[UI] renderTodos: Error in onDelete callback', { 
              todoId: todo.id, 
              error: error.message,
              stack: error.stack
            });
            // Show error toast to user
            showToast('Failed to delete task. Please try again.', NotificationType.ERROR);
            // Re-throw to allow caller to handle
            throw error;
          }
        };

        deleteBtn.addEventListener('click', handleDelete);

        // Store handler reference for cleanup if needed
        deleteBtn._deleteHandler = handleDelete;

        // Assemble the DOM structure
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timestampDiv);
        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        listContainer.appendChild(li);

        console.debug('[UI] renderTodos: Todo item rendered', { 
          todoId: todo.id, 
          index 
        });

      } catch (error) {
        console.error('[UI] renderTodos: Error rendering individual todo', { 
          index, 
          todoId: todo?.id, 
          error: error.message,
          stack: error.stack
        });
        // Continue rendering other items
      }
    });

    console.info('[UI] renderTodos: Render complete', { 
      renderedCount: listContainer.children.length,
      requestedCount: todos.length
    });

  } catch (error) {
    console.error('[UI] renderTodos: Fatal error during render', { 
      error: error.message,
      stack: error.stack
    });
    // Show error toast to user
    showToast('Failed to display tasks. Please refresh the page.', NotificationType.ERROR);
    throw new Error(`Failed to render todos: ${error.message}`);
  }
}