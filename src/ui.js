/**
 * UI Rendering Module
 * 
 * Responsible for DOM manipulation and displaying todo items with proper event handling.
 * Provides functions for rendering todos, formatting timestamps, and managing form input.
 * All DOM operations include proper error handling and logging.
 * 
 * @module ui
 */

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
    console.debug('[UI] clearInput: Input cleared and focused');
  } catch (error) {
    console.error('[UI] clearInput: Error clearing input', { 
      error: error.message 
    });
    throw new Error(`Failed to clear input: ${error.message}`);
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
    throw new Error(`Failed to render todos: ${error.message}`);
  }
}