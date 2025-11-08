/**
 * Toast Notification System Unit Tests
 * 
 * Comprehensive test suite for the toast notification module covering:
 * - Toast creation and display
 * - Auto-dismiss functionality
 * - Accessibility attributes (ARIA)
 * - Queue management (max 3 toasts)
 * - Keyboard support (Escape key)
 * - HTML escaping for security
 * - Error handling and edge cases
 * 
 * @module notifications.test
 */

import { fireEvent } from '@testing-library/dom';
import {
  showToast,
  hideToast,
  createToastElement,
  clearAllToasts,
  getActiveToastCount,
  NotificationType,
  __cleanup,
} from '../notifications.js';

describe('Toast Notification System', () => {
  beforeEach(async () => {
    // Clear document body and all toasts
    document.body.innerHTML = '';
    await __cleanup();
    
    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Cleanup after each test
    await __cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('showToast()', () => {
    test('creates toast element with correct structure', () => {
      const message = 'Test notification';
      const toast = showToast(message, NotificationType.SUCCESS);

      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('toast', 'toast--success');
      expect(toast).toHaveAttribute('role', 'alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
      expect(toast).toHaveAttribute('data-testid', 'toast-success');
    });

    test('appends toast to document.body via container', () => {
      const message = 'Test message';
      showToast(message, NotificationType.INFO);

      const container = document.getElementById('toast-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('data-testid', 'toast-container');
      
      const toast = container.querySelector('.toast');
      expect(toast).toBeInTheDocument();
    });

    test('returns toast element', () => {
      const toast = showToast('Test', NotificationType.SUCCESS);
      
      expect(toast).toBeInstanceOf(HTMLElement);
      expect(toast.tagName).toBe('DIV');
      expect(toast.classList.contains('toast')).toBe(true);
    });

    test('auto-dismisses after specified duration', async () => {
      const duration = 3000;
      const toast = showToast('Auto dismiss test', NotificationType.INFO, duration);

      expect(toast).toBeInTheDocument();
      expect(getActiveToastCount()).toBe(1);

      // Fast-forward time
      jest.advanceTimersByTime(duration);

      // Wait for hideToast animation
      jest.advanceTimersByTime(300);

      expect(toast).not.toBeInTheDocument();
      expect(getActiveToastCount()).toBe(0);
    });

    test('does not auto-dismiss when duration is 0', () => {
      const toast = showToast('No auto dismiss', NotificationType.SUCCESS, 0);

      expect(toast).toBeInTheDocument();
      expect(getActiveToastCount()).toBe(1);

      // Fast-forward time significantly
      jest.advanceTimersByTime(10000);

      // Toast should still be present
      expect(toast).toBeInTheDocument();
      expect(getActiveToastCount()).toBe(1);
    });

    test('sets correct ARIA attributes', () => {
      const toast = showToast('ARIA test', NotificationType.ERROR);

      expect(toast).toHaveAttribute('role', 'alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
      
      const closeButton = toast.querySelector('.toast__close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    test('applies correct class for success type', () => {
      const toast = showToast('Success', NotificationType.SUCCESS);
      
      expect(toast).toHaveClass('toast--success');
      expect(toast).toHaveAttribute('data-testid', 'toast-success');
    });

    test('applies correct class for error type', () => {
      const toast = showToast('Error', NotificationType.ERROR);
      
      expect(toast).toHaveClass('toast--error');
      expect(toast).toHaveAttribute('data-testid', 'toast-error');
    });

    test('applies correct class for info type', () => {
      const toast = showToast('Info', NotificationType.INFO);
      
      expect(toast).toHaveClass('toast--info');
      expect(toast).toHaveAttribute('data-testid', 'toast-info');
    });

    test('throws error for invalid message', () => {
      expect(() => showToast('', NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
      expect(() => showToast(null, NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
      expect(() => showToast(undefined, NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
      expect(() => showToast(123, NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
    });

    test('adds toast--visible class for animation', () => {
      const toast = showToast('Animation test', NotificationType.SUCCESS);
      
      expect(toast).toHaveClass('toast--visible');
    });
  });

  describe('hideToast()', () => {
    test('removes toast from DOM', async () => {
      const toast = showToast('Test', NotificationType.SUCCESS, 0);
      
      expect(toast).toBeInTheDocument();
      expect(getActiveToastCount()).toBe(1);

      await hideToast(toast);
      jest.advanceTimersByTime(300);

      expect(toast).not.toBeInTheDocument();
      expect(getActiveToastCount()).toBe(0);
    });

    test('applies fade-out animation class before removal', async () => {
      const toast = showToast('Fade test', NotificationType.INFO, 0);
      
      const hidePromise = hideToast(toast);
      
      // Check that hiding class is applied immediately
      expect(toast).toHaveClass('toast--hiding');
      
      // Complete the animation
      jest.advanceTimersByTime(300);
      await hidePromise;
      
      expect(toast).not.toBeInTheDocument();
    });

    test('removes toast immediately when immediate flag is true', async () => {
      const toast = showToast('Immediate removal', NotificationType.SUCCESS, 0);
      
      await hideToast(toast, true);
      
      // Should be removed without waiting for animation
      expect(toast).not.toBeInTheDocument();
      expect(getActiveToastCount()).toBe(0);
    });

    test('handles invalid toast element gracefully', async () => {
      await expect(hideToast(null)).resolves.toBeUndefined();
      await expect(hideToast(undefined)).resolves.toBeUndefined();
      await expect(hideToast('not an element')).resolves.toBeUndefined();
    });

    test('clears timeout when toast is manually hidden', async () => {
      const toast = showToast('Manual hide', NotificationType.SUCCESS, 5000);
      
      // Manually hide before auto-dismiss
      await hideToast(toast);
      jest.advanceTimersByTime(300);
      
      expect(toast).not.toBeInTheDocument();
      expect(getActiveToastCount()).toBe(0);
      
      // Advance past original auto-dismiss time
      jest.advanceTimersByTime(5000);
      
      // Should not cause any issues
      expect(getActiveToastCount()).toBe(0);
    });
  });

  describe('createToastElement()', () => {
    test('creates correct HTML structure', () => {
      const message = 'Test message';
      const toast = createToastElement(message, NotificationType.SUCCESS);

      expect(toast.tagName).toBe('DIV');
      expect(toast).toHaveClass('toast', 'toast--success');
      
      const messageDiv = toast.querySelector('.toast__message');
      expect(messageDiv).toBeInTheDocument();
      expect(messageDiv).toHaveTextContent(message);
      expect(messageDiv).toHaveAttribute('data-testid', 'toast-message');
      
      const closeButton = toast.querySelector('.toast__close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('type', 'button');
      expect(closeButton).toHaveAttribute('data-testid', 'toast-close-button');
    });

    test('includes data-testid attributes', () => {
      const toast = createToastElement('Test', NotificationType.ERROR);
      
      expect(toast).toHaveAttribute('data-testid', 'toast-error');
      
      const message = toast.querySelector('[data-testid="toast-message"]');
      expect(message).toBeInTheDocument();
      
      const closeButton = toast.querySelector('[data-testid="toast-close-button"]');
      expect(closeButton).toBeInTheDocument();
    });

    test('close button has correct event listener', () => {
      const toast = createToastElement('Test', NotificationType.INFO);
      document.body.appendChild(toast);
      
      const closeButton = toast.querySelector('.toast__close');
      
      fireEvent.click(closeButton);
      
      jest.advanceTimersByTime(300);
      
      expect(toast).not.toBeInTheDocument();
    });

    test('properly escapes HTML in message', () => {
      const maliciousMessage = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      const toast = createToastElement(maliciousMessage, NotificationType.ERROR);
      
      const messageDiv = toast.querySelector('.toast__message');
      
      // textContent should contain the raw string, not execute HTML
      expect(messageDiv.textContent).toBe(maliciousMessage);
      expect(messageDiv.innerHTML).not.toContain('<script>');
      expect(messageDiv.querySelector('script')).toBeNull();
      expect(messageDiv.querySelector('img')).toBeNull();
    });

    test('throws error for invalid message', () => {
      expect(() => createToastElement('', NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
      expect(() => createToastElement(null, NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
      expect(() => createToastElement(undefined, NotificationType.SUCCESS)).toThrow('Message must be a non-empty string');
    });

    test('defaults to INFO type for invalid type', () => {
      const toast = createToastElement('Test', 'invalid-type');
      
      expect(toast).toHaveClass('toast--info');
    });

    test('assigns unique toast IDs', () => {
      const toast1 = createToastElement('First', NotificationType.SUCCESS);
      const toast2 = createToastElement('Second', NotificationType.SUCCESS);
      
      const id1 = toast1.getAttribute('data-toast-id');
      const id2 = toast2.getAttribute('data-toast-id');
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^toast-\d+$/);
      expect(id2).toMatch(/^toast-\d+$/);
    });
  });

  describe('clearAllToasts()', () => {
    test('removes all active toasts from DOM', async () => {
      showToast('Toast 1', NotificationType.SUCCESS, 0);
      showToast('Toast 2', NotificationType.ERROR, 0);
      showToast('Toast 3', NotificationType.INFO, 0);
      
      expect(getActiveToastCount()).toBe(3);
      
      await clearAllToasts();
      
      expect(getActiveToastCount()).toBe(0);
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(0);
    });

    test('works when no toasts are present', async () => {
      expect(getActiveToastCount()).toBe(0);
      
      await expect(clearAllToasts()).resolves.toBeUndefined();
      
      expect(getActiveToastCount()).toBe(0);
    });

    test('clears all pending timeouts', async () => {
      showToast('Toast 1', NotificationType.SUCCESS, 5000);
      showToast('Toast 2', NotificationType.ERROR, 5000);
      
      expect(getActiveToastCount()).toBe(2);
      
      await clearAllToasts();
      
      expect(getActiveToastCount()).toBe(0);
      
      // Advance past auto-dismiss time
      jest.advanceTimersByTime(10000);
      
      // Should not cause any issues
      expect(getActiveToastCount()).toBe(0);
    });
  });

  describe('Queue Management', () => {
    test('maintains maximum of 3 visible toasts', () => {
      showToast('Toast 1', NotificationType.SUCCESS, 0);
      showToast('Toast 2', NotificationType.SUCCESS, 0);
      showToast('Toast 3', NotificationType.SUCCESS, 0);
      
      expect(getActiveToastCount()).toBe(3);
      
      showToast('Toast 4', NotificationType.SUCCESS, 0);
      
      // Should still be 3, oldest removed
      expect(getActiveToastCount()).toBe(3);
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });

    test('oldest toast is dismissed when 4th is added', () => {
      const toast1 = showToast('First', NotificationType.SUCCESS, 0);
      showToast('Second', NotificationType.SUCCESS, 0);
      showToast('Third', NotificationType.SUCCESS, 0);
      
      const firstMessage = toast1.querySelector('.toast__message').textContent;
      expect(firstMessage).toBe('First');
      
      showToast('Fourth', NotificationType.SUCCESS, 0);
      
      jest.advanceTimersByTime(300);
      
      // First toast should be removed
      expect(toast1).not.toBeInTheDocument();
      
      const remainingToasts = document.querySelectorAll('.toast');
      expect(remainingToasts.length).toBe(3);
      
      const messages = Array.from(remainingToasts).map(t => 
        t.querySelector('.toast__message').textContent
      );
      expect(messages).toEqual(['Second', 'Third', 'Fourth']);
    });

    test('queue maintains correct order', () => {
      showToast('First', NotificationType.SUCCESS, 0);
      showToast('Second', NotificationType.ERROR, 0);
      showToast('Third', NotificationType.INFO, 0);
      
      const toasts = document.querySelectorAll('.toast');
      const messages = Array.from(toasts).map(t => 
        t.querySelector('.toast__message').textContent
      );
      
      expect(messages).toEqual(['First', 'Second', 'Third']);
    });
  });

  describe('Keyboard Support', () => {
    test('Escape key closes most recent toast', async () => {
      showToast('First', NotificationType.SUCCESS, 0);
      const secondToast = showToast('Second', NotificationType.SUCCESS, 0);
      
      expect(getActiveToastCount()).toBe(2);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      jest.advanceTimersByTime(300);
      
      expect(getActiveToastCount()).toBe(1);
      expect(secondToast).not.toBeInTheDocument();
    });

    test('Escape key does nothing when no toasts present', () => {
      expect(getActiveToastCount()).toBe(0);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(getActiveToastCount()).toBe(0);
    });

    test('close button is keyboard accessible with Enter', () => {
      const toast = showToast('Test', NotificationType.SUCCESS, 0);
      const closeButton = toast.querySelector('.toast__close');
      
      closeButton.focus();
      fireEvent.keyDown(closeButton, { key: 'Enter' });
      fireEvent.click(closeButton);
      
      jest.advanceTimersByTime(300);
      
      expect(toast).not.toBeInTheDocument();
    });

    test('close button is keyboard accessible with Space', () => {
      const toast = showToast('Test', NotificationType.SUCCESS, 0);
      const closeButton = toast.querySelector('.toast__close');
      
      closeButton.focus();
      fireEvent.keyDown(closeButton, { key: ' ' });
      fireEvent.click(closeButton);
      
      jest.advanceTimersByTime(300);
      
      expect(toast).not.toBeInTheDocument();
    });

    test('other keys do not close toasts', () => {
      showToast('Test', NotificationType.SUCCESS, 0);
      
      expect(getActiveToastCount()).toBe(1);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(getActiveToastCount()).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const toast = showToast(longMessage, NotificationType.INFO, 0);
      
      const messageDiv = toast.querySelector('.toast__message');
      expect(messageDiv.textContent).toBe(longMessage);
      expect(messageDiv.textContent.length).toBe(1000);
    });

    test('handles special characters in message', () => {
      const specialMessage = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const toast = showToast(specialMessage, NotificationType.SUCCESS, 0);
      
      const messageDiv = toast.querySelector('.toast__message');
      expect(messageDiv.textContent).toBe(specialMessage);
    });

    test('handles unicode and emoji in message', () => {
      const unicodeMessage = '✓ Task completed! 🎉 Great job! 中文测试';
      const toast = showToast(unicodeMessage, NotificationType.SUCCESS, 0);
      
      const messageDiv = toast.querySelector('.toast__message');
      expect(messageDiv.textContent).toBe(unicodeMessage);
    });

    test('handles rapid successive toast creation', () => {
      for (let i = 0; i < 10; i++) {
        showToast(`Toast ${i}`, NotificationType.INFO, 0);
      }
      
      // Should maintain max of 3
      expect(getActiveToastCount()).toBe(3);
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });

    test('handles toast removal during animation', async () => {
      const toast = showToast('Test', NotificationType.SUCCESS, 0);
      
      const hidePromise1 = hideToast(toast);
      const hidePromise2 = hideToast(toast);
      
      await Promise.all([hidePromise1, hidePromise2]);
      jest.advanceTimersByTime(300);
      
      expect(toast).not.toBeInTheDocument();
      expect(getActiveToastCount()).toBe(0);
    });

    test('container is created only once', () => {
      showToast('First', NotificationType.SUCCESS, 0);
      showToast('Second', NotificationType.SUCCESS, 0);
      
      const containers = document.querySelectorAll('#toast-container');
      expect(containers.length).toBe(1);
    });

    test('getActiveToastCount returns correct count', () => {
      expect(getActiveToastCount()).toBe(0);
      
      showToast('First', NotificationType.SUCCESS, 0);
      expect(getActiveToastCount()).toBe(1);
      
      showToast('Second', NotificationType.SUCCESS, 0);
      expect(getActiveToastCount()).toBe(2);
      
      showToast('Third', NotificationType.SUCCESS, 0);
      expect(getActiveToastCount()).toBe(3);
    });
  });

  describe('Accessibility', () => {
    test('toast container has correct ARIA attributes', () => {
      showToast('Test', NotificationType.SUCCESS, 0);
      
      const container = document.getElementById('toast-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-atomic', 'false');
    });

    test('each toast has role alert', () => {
      const toast = showToast('Test', NotificationType.ERROR, 0);
      
      expect(toast).toHaveAttribute('role', 'alert');
    });

    test('close button has descriptive aria-label', () => {
      const toast = showToast('Test', NotificationType.INFO, 0);
      const closeButton = toast.querySelector('.toast__close');
      
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    test('toast is announced to screen readers', () => {
      const toast = showToast('Important message', NotificationType.ERROR, 0);
      
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });
});