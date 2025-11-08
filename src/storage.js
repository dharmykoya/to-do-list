/**
 * LocalStorage utility module for to-do list data persistence
 * Provides abstraction layer with error handling and data validation
 * @module storage
 */

/**
 * Storage key for localStorage
 * @constant {string}
 */
export const STORAGE_KEY = 'todoList';

/**
 * Retrieves todos from localStorage
 * @returns {Array<Object>} Array of todo items, empty array if none exist or on error
 * @example
 * const todos = getTodos();
 * // Returns: [{id: '1', text: 'Buy milk', completed: false, timestamp: 1234567890}]
 */
export function getTodos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      console.info('[Storage] No todos found in localStorage, returning empty array');
      return [];
    }

    const parsed = JSON.parse(data);
    
    if (!Array.isArray(parsed)) {
      console.error('[Storage] Invalid data structure in localStorage, expected array, got:', typeof parsed);
      return [];
    }

    console.info(`[Storage] Successfully retrieved ${parsed.length} todos from localStorage`);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('[Storage] Failed to parse todos from localStorage - invalid JSON:', error.message);
    } else {
      console.error('[Storage] Error retrieving todos from localStorage:', error.message);
    }
    return [];
  }
}

/**
 * Saves todos to localStorage
 * @param {Array<Object>} todos - Array of todo items to save
 * @returns {boolean} True if save successful, false otherwise
 * @throws {TypeError} If todos parameter is not an array
 * @example
 * const success = saveTodos([{id: '1', text: 'Buy milk', completed: false, timestamp: 1234567890}]);
 */
export function saveTodos(todos) {
  if (!Array.isArray(todos)) {
    const errorMsg = `[Storage] Invalid input: expected array, got ${typeof todos}`;
    console.error(errorMsg);
    throw new TypeError(errorMsg);
  }

  // Validate data structure of each todo item
  const isValid = todos.every(todo => {
    return (
      todo &&
      typeof todo === 'object' &&
      typeof todo.id === 'string' &&
      typeof todo.text === 'string' &&
      typeof todo.completed === 'boolean' &&
      typeof todo.timestamp === 'number'
    );
  });

  if (!isValid) {
    const errorMsg = '[Storage] Invalid todo data structure - todos must have id (string), text (string), completed (boolean), and timestamp (number)';
    console.error(errorMsg);
    throw new TypeError(errorMsg);
  }

  try {
    const serialized = JSON.stringify(todos);
    localStorage.setItem(STORAGE_KEY, serialized);
    console.info(`[Storage] Successfully saved ${todos.length} todos to localStorage`);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('[Storage] localStorage quota exceeded - unable to save todos. Current size:', serialized?.length || 0, 'bytes');
      
      // Attempt recovery by keeping only most recent items
      try {
        const reducedTodos = todos.slice(-50); // Keep last 50 items
        const reducedSerialized = JSON.stringify(reducedTodos);
        localStorage.setItem(STORAGE_KEY, reducedSerialized);
        console.warn(`[Storage] Recovery successful - reduced to ${reducedTodos.length} most recent todos`);
        return true;
      } catch (recoveryError) {
        console.error('[Storage] Recovery failed - unable to save even reduced dataset:', recoveryError.message);
        return false;
      }
    } else {
      console.error('[Storage] Error saving todos to localStorage:', error.message);
      return false;
    }
  }
}

/**
 * Clears all todos from localStorage
 * @returns {boolean} True if clear successful, false otherwise
 * @example
 * const success = clearTodos();
 */
export function clearTodos() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('[Storage] Successfully cleared todos from localStorage');
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing todos from localStorage:', error.message);
    return false;
  }
}