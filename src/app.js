/**
 * Main Application Module
 * 
 * Orchestrates the todo list application by coordinating storage, business logic, and UI modules.
 * Implements feature flag checking, comprehensive error handling, and user feedback.
 * Follows ES6 module pattern with proper separation of concerns.
 * 
 * @module app
 */

import { getTodos, saveTodos } from './storage.js';
import { createTodo, deleteTodo } from './todo.js';
import { renderTodos, clearInput } from './ui.js';

/**
 * Feature flag key for localStorage
 * @constant {string}
 */
const FEATURE_FLAG_KEY = 'feature_todo_list_ui';

/**
 * Checks if the todo list UI feature is enabled via feature flag
 * @returns {boolean} True if feature is enabled, false otherwise
 */
function isFeatureEnabled() {
  try {
    const flagValue = localStorage.getItem(FEATURE_FLAG_KEY);
    
    if (flagValue === null) {
      console.info('[App] Feature flag not set, defaulting to enabled');
      return true;
    }
    
    const isEnabled = flagValue !== 'off';
    console.info('[App] Feature flag check', { 
      flagValue, 
      isEnabled 
    });
    
    return isEnabled;
  } catch (error) {
    console.error('[App] Error checking feature flag, defaulting to enabled', { 
      error: error.message 
    });
    return true;
  }
}

/**
 * Displays user feedback message in the UI
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'success', 'error', or 'info'
 */
function showUserFeedback(message, type = 'info') {
  console.info('[App] showUserFeedback', { message, type });
  
  try {
    // Remove any existing feedback messages
    const existingFeedback = document.querySelector('.user-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `user-feedback user-feedback--${type}`;
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'polite');
    feedback.textContent = message;
    
    // Insert at the top of the form
    const form = document.getElementById('todo-form');
    if (form) {
      form.insertAdjacentElement('beforebegin', feedback);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.remove();
        }
      }, 3000);
    } else {
      console.warn('[App] showUserFeedback: Form element not found');
    }
  } catch (error) {
    console.error('[App] showUserFeedback: Error displaying feedback', { 
      error: error.message 
    });
  }
}

/**
 * Handles adding a new todo item
 * Validates input, creates todo, saves to storage, and updates UI
 * 
 * @param {Event} event - Form submit event
 */
function handleAddTodo(event) {
  event.preventDefault();
  
  console.info('[App] handleAddTodo: Form submitted');
  
  try {
    // Get input element
    const input = document.getElementById('todo-input');
    
    if (!input) {
      const errorMsg = 'Todo input element not found';
      console.error('[App] handleAddTodo:', errorMsg);
      showUserFeedback('Application error: Input field not found', 'error');
      throw new Error(errorMsg);
    }
    
    // Get and validate input value
    const inputValue = input.value;
    
    if (typeof inputValue !== 'string') {
      const errorMsg = 'Invalid input value type';
      console.error('[App] handleAddTodo:', errorMsg, { 
        type: typeof inputValue 
      });
      showUserFeedback('Invalid input', 'error');
      throw new TypeError(errorMsg);
    }
    
    const trimmedValue = inputValue.trim();
    
    if (trimmedValue.length === 0) {
      console.warn('[App] handleAddTodo: Empty input value');
      showUserFeedback('Please enter a todo item', 'info');
      input.focus();
      return;
    }
    
    console.debug('[App] handleAddTodo: Creating todo', { 
      textLength: trimmedValue.length 
    });
    
    // Create new todo item
    let newTodo;
    try {
      newTodo = createTodo(trimmedValue);
      console.info('[App] handleAddTodo: Todo created', { 
        todoId: newTodo.id 
      });
    } catch (error) {
      console.error('[App] handleAddTodo: Error creating todo', { 
        error: error.message,
        stack: error.stack
      });
      showUserFeedback(`Failed to create todo: ${error.message}`, 'error');
      throw error;
    }
    
    // Get current todos from storage
    let currentTodos;
    try {
      currentTodos = getTodos();
      console.debug('[App] handleAddTodo: Retrieved current todos', { 
        count: currentTodos.length 
      });
    } catch (error) {
      console.error('[App] handleAddTodo: Error retrieving todos', { 
        error: error.message 
      });
      showUserFeedback('Failed to retrieve existing todos', 'error');
      throw error;
    }
    
    // Add new todo to the list
    const updatedTodos = [...currentTodos, newTodo];
    
    // Save to storage
    let saveSuccess;
    try {
      saveSuccess = saveTodos(updatedTodos);
      
      if (!saveSuccess) {
        console.error('[App] handleAddTodo: Save operation returned false');
        showUserFeedback('Failed to save todo. Storage may be full.', 'error');
        return;
      }
      
      console.info('[App] handleAddTodo: Todos saved successfully', { 
        totalCount: updatedTodos.length 
      });
    } catch (error) {
      console.error('[App] handleAddTodo: Error saving todos', { 
        error: error.message,
        stack: error.stack
      });
      showUserFeedback(`Failed to save todo: ${error.message}`, 'error');
      throw error;
    }
    
    // Re-render the UI
    try {
      renderTodos(updatedTodos, handleDeleteTodo);
      console.debug('[App] handleAddTodo: UI re-rendered');
    } catch (error) {
      console.error('[App] handleAddTodo: Error rendering todos', { 
        error: error.message 
      });
      showUserFeedback('Failed to update display', 'error');
      throw error;
    }
    
    // Clear input and show success feedback
    try {
      clearInput();
      showUserFeedback('Todo added successfully', 'success');
      console.info('[App] handleAddTodo: Todo added successfully', { 
        todoId: newTodo.id 
      });
    } catch (error) {
      console.error('[App] handleAddTodo: Error clearing input', { 
        error: error.message 
      });
      // Non-critical error, don't throw
    }
    
  } catch (error) {
    console.error('[App] handleAddTodo: Fatal error', { 
      error: error.message,
      stack: error.stack
    });
    // Error feedback already shown in specific catch blocks
  }
}

/**
 * Handles deleting a todo item by ID
 * Removes from storage and updates UI
 * 
 * @param {string} id - The ID of the todo item to delete
 * @throws {TypeError} If id is not a string
 */
function handleDeleteTodo(id) {
  if (typeof id !== 'string') {
    const errorMsg = 'Todo ID must be a string';
    console.error('[App] handleDeleteTodo:', errorMsg, { 
      type: typeof id 
    });
    showUserFeedback('Invalid todo ID', 'error');
    throw new TypeError(errorMsg);
  }
  
  console.info('[App] handleDeleteTodo: Deleting todo', { todoId: id });
  
  try {
    // Get current todos from storage
    let currentTodos;
    try {
      currentTodos = getTodos();
      console.debug('[App] handleDeleteTodo: Retrieved current todos', { 
        count: currentTodos.length 
      });
    } catch (error) {
      console.error('[App] handleDeleteTodo: Error retrieving todos', { 
        error: error.message 
      });
      showUserFeedback('Failed to retrieve todos', 'error');
      throw error;
    }
    
    // Check if todo exists
    const todoExists = currentTodos.some(todo => todo.id === id);
    if (!todoExists) {
      console.warn('[App] handleDeleteTodo: Todo not found', { todoId: id });
      showUserFeedback('Todo not found', 'info');
      return;
    }
    
    // Delete the todo
    let updatedTodos;
    try {
      updatedTodos = deleteTodo(currentTodos, id);
      console.debug('[App] handleDeleteTodo: Todo deleted from array', { 
        todoId: id,
        remainingCount: updatedTodos.length
      });
    } catch (error) {
      console.error('[App] handleDeleteTodo: Error deleting todo', { 
        todoId: id,
        error: error.message 
      });
      showUserFeedback(`Failed to delete todo: ${error.message}`, 'error');
      throw error;
    }
    
    // Save updated list to storage
    let saveSuccess;
    try {
      saveSuccess = saveTodos(updatedTodos);
      
      if (!saveSuccess) {
        console.error('[App] handleDeleteTodo: Save operation returned false');
        showUserFeedback('Failed to save changes', 'error');
        return;
      }
      
      console.info('[App] handleDeleteTodo: Updated todos saved', { 
        totalCount: updatedTodos.length 
      });
    } catch (error) {
      console.error('[App] handleDeleteTodo: Error saving todos', { 
        error: error.message 
      });
      showUserFeedback(`Failed to save changes: ${error.message}`, 'error');
      throw error;
    }
    
    // Re-render the UI
    try {
      renderTodos(updatedTodos, handleDeleteTodo);
      showUserFeedback('Todo deleted successfully', 'success');
      console.info('[App] handleDeleteTodo: Todo deleted successfully', { 
        todoId: id 
      });
    } catch (error) {
      console.error('[App] handleDeleteTodo: Error rendering todos', { 
        error: error.message 
      });
      showUserFeedback('Failed to update display', 'error');
      throw error;
    }
    
  } catch (error) {
    console.error('[App] handleDeleteTodo: Fatal error', { 
      todoId: id,
      error: error.message,
      stack: error.stack
    });
    // Error feedback already shown in specific catch blocks
  }
}

/**
 * Initializes the application
 * Loads todos from storage, renders initial state, and sets up event listeners
 * 
 * @throws {Error} If critical DOM elements are not found
 */
function init() {
  console.info('[App] init: Initializing application');
  
  try {
    // Check feature flag
    if (!isFeatureEnabled()) {
      console.warn('[App] init: Feature is disabled via feature flag');
      
      // Display disabled message
      const container = document.querySelector('.container');
      if (container) {
        container.innerHTML = `
          <div class="feature-disabled" role="alert">
            <h2>Feature Disabled</h2>
            <p>The todo list feature is currently disabled.</p>
            <p>To enable it, open the browser console and run:</p>
            <code>localStorage.removeItem('feature_todo_list_ui')</code>
            <p>Then reload the page.</p>
          </div>
        `;
      }
      return;
    }
    
    // Get form element
    const form = document.getElementById('todo-form');
    
    if (!form) {
      const errorMsg = 'Todo form element not found';
      console.error('[App] init:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Load todos from storage
    let todos;
    try {
      todos = getTodos();
      console.info('[App] init: Loaded todos from storage', { 
        count: todos.length 
      });
    } catch (error) {
      console.error('[App] init: Error loading todos', { 
        error: error.message 
      });
      showUserFeedback('Failed to load todos from storage', 'error');
      todos = []; // Continue with empty array
    }
    
    // Render initial state
    try {
      renderTodos(todos, handleDeleteTodo);
      console.debug('[App] init: Initial render complete');
    } catch (error) {
      console.error('[App] init: Error rendering initial state', { 
        error: error.message 
      });
      showUserFeedback('Failed to display todos', 'error');
      throw error;
    }
    
    // Set up form submit event listener
    try {
      form.addEventListener('submit', handleAddTodo);
      console.debug('[App] init: Form submit listener attached');
    } catch (error) {
      console.error('[App] init: Error attaching form listener', { 
        error: error.message 
      });
      throw error;
    }
    
    // Focus input field for better UX
    try {
      const input = document.getElementById('todo-input');
      if (input) {
        input.focus();
      }
    } catch (error) {
      console.warn('[App] init: Could not focus input', { 
        error: error.message 
      });
      // Non-critical error, don't throw
    }
    
    console.info('[App] init: Application initialized successfully');
    
  } catch (error) {
    console.error('[App] init: Fatal initialization error', { 
      error: error.message,
      stack: error.stack
    });
    showUserFeedback('Application failed to initialize', 'error');
    throw error;
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.info('[App] DOMContentLoaded event fired');
    init();
  });
} else {
  // DOM already loaded
  console.info('[App] DOM already loaded, initializing immediately');
  init();
}

// Export functions for testing
export { init, handleAddTodo, handleDeleteTodo, isFeatureEnabled };