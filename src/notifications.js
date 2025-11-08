/**
 * Toast Notification System Module
 * Provides accessible toast notifications with auto-dismiss, queue management, and keyboard support
 * @module notifications
 */

/**
 * Notification types enum
 * @readonly
 * @enum {string}
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

// Configuration constants
const DEFAULT_DURATION = 3000;
const MAX_VISIBLE_TOASTS = 3;
const FADE_OUT_DURATION = 300;
const TOAST_CONTAINER_ID = 'toast-container';

// Active toasts queue
let activeToasts = [];
let toastIdCounter = 0;

/**
 * Initialize toast container if it doesn't exist
 * @private
 * @returns {HTMLElement} The toast container element
 */
function getOrCreateToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    container.setAttribute('data-testid', 'toast-container');
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Creates a toast element with proper structure and accessibility attributes
 * @param {string} message - The message to display in the toast
 * @param {NotificationType} type - The type of notification (success, error, info)
 * @returns {HTMLElement} The created toast element
 */
export function createToastElement(message, type) {
  if (!message || typeof message !== 'string') {
    console.error('[Notifications] Invalid message provided to createToastElement');
    throw new Error('Message must be a non-empty string');
  }

  if (!Object.values(NotificationType).includes(type)) {
    console.warn(`[Notifications] Invalid notification type: ${type}, defaulting to INFO`);
    type = NotificationType.INFO;
  }

  const toastId = `toast-${++toastIdCounter}`;
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.setAttribute('data-testid', `toast-${type}`);
  toast.setAttribute('data-toast-id', toastId);

  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast__message';
  messageDiv.textContent = message;
  messageDiv.setAttribute('data-testid', 'toast-message');

  const closeButton = document.createElement('button');
  closeButton.className = 'toast__close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close notification');
  closeButton.setAttribute('data-testid', 'toast-close-button');
  closeButton.innerHTML = '&times;';
  
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideToast(toast);
  });

  toast.appendChild(messageDiv);
  toast.appendChild(closeButton);

  return toast;
}

/**
 * Manages toast queue to prevent overflow
 * @private
 */
function manageToastQueue() {
  while (activeToasts.length > MAX_VISIBLE_TOASTS) {
    const oldestToast = activeToasts.shift();
    if (oldestToast && oldestToast.element && oldestToast.element.parentNode) {
      hideToast(oldestToast.element, true);
    }
  }
}

/**
 * Hides and removes a toast notification with fade-out animation
 * @param {HTMLElement} toastElement - The toast element to hide
 * @param {boolean} [immediate=false] - If true, skip animation and remove immediately
 * @returns {Promise<void>} Resolves when toast is removed
 */
export function hideToast(toastElement, immediate = false) {
  return new Promise((resolve) => {
    if (!toastElement || !(toastElement instanceof HTMLElement)) {
      console.warn('[Notifications] Invalid toast element provided to hideToast');
      resolve();
      return;
    }

    // Remove from active toasts array
    const toastId = toastElement.getAttribute('data-toast-id');
    activeToasts = activeToasts.filter(t => t.id !== toastId);

    // Clear any pending timeout
    const toastData = activeToasts.find(t => t.element === toastElement);
    if (toastData && toastData.timeoutId) {
      clearTimeout(toastData.timeoutId);
    }

    if (immediate) {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      resolve();
      return;
    }

    // Add fade-out class for animation
    toastElement.classList.add('toast--hiding');

    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      resolve();
    }, FADE_OUT_DURATION);
  });
}

/**
 * Shows a toast notification with auto-dismiss functionality
 * @param {string} message - The message to display
 * @param {NotificationType} type - The type of notification
 * @param {number} [duration=3000] - Duration in milliseconds before auto-dismiss (0 for no auto-dismiss)
 * @returns {HTMLElement} The created toast element
 */
export function showToast(message, type, duration = DEFAULT_DURATION) {
  if (!message || typeof message !== 'string') {
    console.error('[Notifications] Invalid message provided to showToast');
    throw new Error('Message must be a non-empty string');
  }

  try {
    const container = getOrCreateToastContainer();
    const toastElement = createToastElement(message, type);
    const toastId = toastElement.getAttribute('data-toast-id');

    // Add to container
    container.appendChild(toastElement);

    // Trigger reflow for animation
    toastElement.offsetHeight;
    toastElement.classList.add('toast--visible');

    // Setup auto-dismiss
    let timeoutId = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        hideToast(toastElement);
      }, duration);
    }

    // Add to active toasts
    activeToasts.push({
      id: toastId,
      element: toastElement,
      timeoutId,
      timestamp: Date.now(),
    });

    // Manage queue
    manageToastQueue();

    // Log for observability
    console.log(`[Notifications] Toast displayed: ${type} - "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.count(`toast-${type}`);

    return toastElement;
  } catch (error) {
    console.error('[Notifications] Error showing toast:', error);
    throw error;
  }
}

/**
 * Clears all active toast notifications
 * @returns {Promise<void>} Resolves when all toasts are cleared
 */
export function clearAllToasts() {
  console.log(`[Notifications] Clearing ${activeToasts.length} active toasts`);
  
  const hidePromises = activeToasts.map(toast => {
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
    return hideToast(toast.element, true);
  });

  activeToasts = [];

  return Promise.all(hidePromises).then(() => {
    console.log('[Notifications] All toasts cleared');
  });
}

/**
 * Handles keyboard events for toast notifications
 * @private
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboardEvent(event) {
  if (event.key === 'Escape' && activeToasts.length > 0) {
    // Close the most recent toast
    const mostRecentToast = activeToasts[activeToasts.length - 1];
    if (mostRecentToast && mostRecentToast.element) {
      hideToast(mostRecentToast.element);
      event.preventDefault();
    }
  }
}

/**
 * Initialize keyboard event listeners
 * @private
 */
function initializeKeyboardSupport() {
  // Remove existing listener if any
  document.removeEventListener('keydown', handleKeyboardEvent);
  // Add new listener
  document.addEventListener('keydown', handleKeyboardEvent);
}

// Initialize keyboard support when module loads
if (typeof document !== 'undefined') {
  initializeKeyboardSupport();
}

/**
 * Get count of active toasts (for testing)
 * @returns {number} Number of active toasts
 */
export function getActiveToastCount() {
  return activeToasts.length;
}

/**
 * Cleanup function for testing
 * @private
 */
export function __cleanup() {
  return clearAllToasts().then(() => {
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    activeToasts = [];
    toastIdCounter = 0;
  });
}