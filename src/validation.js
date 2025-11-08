/**
 * Validation module providing comprehensive input validation functions
 * with real-time feedback capabilities and detailed error messages.
 * @module validation
 */

/**
 * Validation rules constants
 * @constant {Object}
 */
export const ValidationRules = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 500,
  WHITESPACE_ONLY_REGEX: /^\s*$/,
};

/**
 * Error messages for validation failures
 * @constant {Object}
 */
export const ERROR_MESSAGES = {
  EMPTY: 'Task cannot be empty',
  WHITESPACE: 'Task cannot contain only whitespace',
  TOO_LONG: 'Task cannot exceed 500 characters',
};

/**
 * Debounce utility function to limit function execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
  let timeoutId = null;

  return function debounced(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Checks if text is empty or contains only whitespace
 * @param {string} text - Text to validate
 * @returns {boolean} True if empty or whitespace-only
 */
export function isEmptyOrWhitespace(text) {
  if (typeof text !== 'string') {
    return true;
  }

  return text.length === 0 || ValidationRules.WHITESPACE_ONLY_REGEX.test(text);
}

/**
 * Checks if text exceeds maximum allowed length
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if text exceeds max length
 */
export function exceedsMaxLength(text, maxLength) {
  if (typeof text !== 'string') {
    return false;
  }

  return text.length > maxLength;
}

/**
 * Validates todo text input with comprehensive checks
 * @param {string} text - Text to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result with error message
 */
export function validateTodoText(text) {
  // Check for null or undefined
  if (text === null || text === undefined) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMPTY,
    };
  }

  // Convert to string if not already
  const textStr = String(text);

  // Check for empty input
  if (textStr.length === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMPTY,
    };
  }

  // Check for whitespace-only input
  if (isEmptyOrWhitespace(textStr)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.WHITESPACE,
    };
  }

  // Check for exceeding maximum length
  if (exceedsMaxLength(textStr, ValidationRules.MAX_LENGTH)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.TOO_LONG,
    };
  }

  // All validations passed
  return {
    isValid: true,
    error: null,
  };
}

/**
 * Debounced version of validateTodoText for real-time validation
 * Delays validation by 300ms to prevent excessive checks during typing
 * @param {string} text - Text to validate
 * @param {Function} callback - Callback function to receive validation result
 * @returns {Function} Debounced validation function
 */
export function validateTodoTextRealtime(text, callback) {
  if (typeof callback !== 'function') {
    console.error('validateTodoTextRealtime: callback must be a function');
    return () => {};
  }

  const debouncedValidation = debounce((inputText) => {
    try {
      const result = validateTodoText(inputText);
      callback(result);
    } catch (error) {
      console.error('Validation error in real-time validation:', error);
      callback({
        isValid: false,
        error: 'An error occurred during validation',
      });
    }
  }, 300);

  debouncedValidation(text);
  return debouncedValidation;
}

/**
 * Creates a real-time validator instance with debouncing
 * @param {Function} callback - Callback function to receive validation results
 * @returns {Function} Validator function that can be called with text input
 */
export function createRealtimeValidator(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }

  const debouncedValidation = debounce((text) => {
    try {
      const result = validateTodoText(text);
      callback(result);
    } catch (error) {
      console.error('Real-time validation error:', error);
      callback({
        isValid: false,
        error: 'An error occurred during validation',
      });
    }
  }, 300);

  return debouncedValidation;
}