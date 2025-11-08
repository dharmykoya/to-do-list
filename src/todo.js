/**
 * Todo Item Business Logic Module
 * 
 * Handles creation, deletion, and data structure management for todo items.
 * Provides input sanitization to prevent XSS attacks.
 * All operations are immutable and return new data structures.
 * 
 * @module todo
 */

/**
 * Sanitizes user input by trimming whitespace and escaping HTML entities
 * to prevent XSS attacks.
 * 
 * @param {string} text - The raw input text to sanitize
 * @returns {string} The sanitized text safe for storage and display
 * @throws {TypeError} If text is not a string
 * 
 * @example
 * sanitizeInput('  <script>alert("xss")</script>  ')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be a string');
  }

  const trimmed = text.trim();
  
  // Escape HTML entities to prevent XSS
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return trimmed.replace(/[&<>"'/]/g, (char) => entityMap[char]);
}

/**
 * Creates a new todo item with a unique ID, sanitized text, and timestamp.
 * 
 * @param {string} text - The todo item text (will be sanitized)
 * @returns {Object} A new todo item object
 * @returns {string} returns.id - Unique identifier (UUID v4)
 * @returns {string} returns.text - Sanitized todo text
 * @returns {string} returns.timestamp - ISO 8601 timestamp of creation
 * @throws {Error} If text is empty or only whitespace after sanitization
 * @throws {TypeError} If text is not a string
 * 
 * @example
 * const todo = createTodo('Buy groceries');
 * // Returns: {
 * //   id: '550e8400-e29b-41d4-a716-446655440000',
 * //   text: 'Buy groceries',
 * //   timestamp: '2025-01-08T12:00:00.000Z'
 * // }
 */
export function createTodo(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Todo text must be a string');
  }

  const sanitizedText = sanitizeInput(text);
  
  if (sanitizedText.length === 0) {
    throw new Error('Todo text cannot be empty or only whitespace');
  }

  // Validate crypto.randomUUID is available
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID is not available in this environment');
  }

  return {
    id: crypto.randomUUID(),
    text: sanitizedText,
    timestamp: new Date().toISOString()
  };
}

/**
 * Deletes a todo item from the list by ID.
 * Returns a new array without the specified item (immutable operation).
 * 
 * @param {Array<Object>} todos - Array of todo items
 * @param {string} id - The ID of the todo item to delete
 * @returns {Array<Object>} A new array with the item removed
 * @throws {TypeError} If todos is not an array
 * @throws {TypeError} If id is not a string
 * 
 * @example
 * const todos = [
 *   { id: '1', text: 'Task 1', timestamp: '2025-01-08T12:00:00.000Z' },
 *   { id: '2', text: 'Task 2', timestamp: '2025-01-08T12:01:00.000Z' }
 * ];
 * const updated = deleteTodo(todos, '1');
 * // Returns: [{ id: '2', text: 'Task 2', timestamp: '2025-01-08T12:01:00.000Z' }]
 */
export function deleteTodo(todos, id) {
  if (!Array.isArray(todos)) {
    throw new TypeError('Todos must be an array');
  }

  if (typeof id !== 'string') {
    throw new TypeError('ID must be a string');
  }

  // Immutable operation - returns new array
  return todos.filter(todo => todo.id !== id);
}