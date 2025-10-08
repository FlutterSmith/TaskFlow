import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Real-time Messaging Flows', () => {
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Login both users
    await login(page1, 'user1@example.com', 'Password123!');
    await login(page2, 'user2@example.com', 'Password123!');
  });

  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test.describe('Send and Receive Messages', () => {
    test('should send and receive messages in real-time', async () => {
      // User 1: Navigate to messages
      await page1.goto('/messages');

      // User 1: Start new conversation with User 2
      await page1.getByRole('button', { name: /new message/i }).click();
      await page1.getByRole('textbox', { name: /search users/i }).fill('User Two');
      await page1.getByRole('option', { name: /user two/i }).click();

      // User 2: Navigate to messages
      await page2.goto('/messages');

      // User 1: Type and send message
      const message1 = `Hello from User 1 at ${Date.now()}`;
      await page1.getByRole('textbox', { name: /type a message/i }).fill(message1);
      await page1.getByRole('button', { name: /send/i }).click();

      // User 1: Verify message sent
      await expect(page1.getByText(message1)).toBeVisible();

      // User 2: Should receive message in real-time
      await expect(page2.getByText(message1)).toBeVisible({ timeout: 5000 });

      // User 2: Reply
      const message2 = `Hello from User 2 at ${Date.now()}`;
      await page2.getByRole('textbox', { name: /type a message/i }).fill(message2);
      await page2.getByRole('button', { name: /send/i }).click();

      // User 1: Should receive reply in real-time
      await expect(page1.getByText(message2)).toBeVisible({ timeout: 5000 });
    });

    test('should show typing indicator', async () => {
      // Start conversation
      await page1.goto('/messages/user2');
      await page2.goto('/messages/user1');

      // User 1 starts typing
      const textbox1 = page1.getByRole('textbox', { name: /type a message/i });
      await textbox1.click();
      await textbox1.type('Hello');

      // User 2 should see typing indicator
      await expect(page2.getByText(/user one is typing/i)).toBeVisible({ timeout: 3000 });

      // User 1 stops typing
      await textbox1.clear();

      // Typing indicator should disappear
      await expect(page2.getByText(/user one is typing/i)).not.toBeVisible({ timeout: 3000 });
    });

    test('should send multiple messages', async () => {
      await page1.goto('/messages/user2');

      const messages = [
        'First message',
        'Second message',
        'Third message'
      ];

      for (const message of messages) {
        await page1.getByRole('textbox', { name: /type a message/i }).fill(message);
        await page1.getByRole('button', { name: /send/i }).click();
        await expect(page1.getByText(message)).toBeVisible();
        await page1.waitForTimeout(500);
      }

      // Verify all messages are displayed
      for (const message of messages) {
        await expect(page1.getByText(message)).toBeVisible();
      }
    });

    test('should clear input after sending', async () => {
      await page1.goto('/messages/user2');

      const textbox = page1.getByRole('textbox', { name: /type a message/i });
      await textbox.fill('Test message');
      await page1.getByRole('button', { name: /send/i }).click();

      // Input should be cleared
      await expect(textbox).toHaveValue('');
    });
  });

  test.describe('Message Delivery Status', () => {
    test('should show message delivery status', async () => {
      await page1.goto('/messages/user2');

      const message = 'Test delivery status';
      await page1.getByRole('textbox', { name: /type a message/i }).fill(message);
      await page1.getByRole('button', { name: /send/i }).click();

      // Wait for "sending" status
      await expect(page1.getByText(/sending/i)).toBeVisible();

      // Should change to "delivered"
      await expect(page1.getByText(/delivered/i)).toBeVisible({ timeout: 3000 });
    });

    test('should mark message as read when viewed', async () => {
      // Send message from User 1
      await page1.goto('/messages/user2');
      const message = `Read receipt test ${Date.now()}`;
      await page1.getByRole('textbox', { name: /type a message/i }).fill(message);
      await page1.getByRole('button', { name: /send/i }).click();

      // User 2 opens conversation
      await page2.goto('/messages/user1');

      // Wait a moment for read receipt
      await page2.waitForTimeout(1000);

      // User 1 should see "read" status
      await expect(page1.getByText(/read/i)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Message List', () => {
    test('should display conversation list', async () => {
      await page1.goto('/messages');

      // Verify conversations list
      await expect(page1.getByRole('heading', { name: /messages/i })).toBeVisible();
      await expect(page1.locator('[data-testid="conversation-list"]')).toBeVisible();
    });

    test('should show unread message count', async () => {
      // User 2 sends message to User 1
      await page2.goto('/messages/user1');
      await page2.getByRole('textbox', { name: /type a message/i }).fill('Unread test');
      await page2.getByRole('button', { name: /send/i }).click();

      // User 1 navigates to messages
      await page1.goto('/messages');

      // Should show unread count
      const conversation = page1.locator('[data-testid="conversation-item"]').filter({
        hasText: 'User Two'
      });

      await expect(conversation.locator('[data-testid="unread-count"]')).toBeVisible();
    });

    test('should sort conversations by latest message', async () => {
      await page1.goto('/messages');

      const conversations = page1.locator('[data-testid="conversation-item"]');

      // Get timestamps of all conversations
      const timestamps: number[] = [];
      const count = await conversations.count();

      for (let i = 0; i < count; i++) {
        const timeText = await conversations.nth(i).locator('[data-testid="message-time"]').textContent();
        timestamps.push(Date.parse(timeText || '0'));
      }

      // Verify descending order
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });
  });

  test.describe('Message Features', () => {
    test('should send emoji', async () => {
      await page1.goto('/messages/user2');

      // Open emoji picker
      await page1.getByRole('button', { name: /emoji/i }).click();

      // Select emoji
      await page1.getByRole('button', { name: '😀' }).click();

      // Send
      await page1.getByRole('button', { name: /send/i }).click();

      // Verify emoji sent
      await expect(page1.getByText('😀')).toBeVisible();
    });

    test('should attach image', async () => {
      await page1.goto('/messages/user2');

      // Click attach button
      await page1.getByRole('button', { name: /attach/i }).click();

      // Upload image
      const fileInput = page1.locator('input[type="file"]');
      await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg');

      // Wait for preview
      await expect(page1.getByRole('img', { name: /preview/i })).toBeVisible();

      // Send
      await page1.getByRole('button', { name: /send/i }).click();

      // Verify image sent
      await expect(page1.getByRole('img', { name: /message attachment/i })).toBeVisible();
    });

    test('should delete message', async () => {
      await page1.goto('/messages/user2');

      // Send message
      const message = `Delete test ${Date.now()}`;
      await page1.getByRole('textbox', { name: /type a message/i }).fill(message);
      await page1.getByRole('button', { name: /send/i }).click();

      // Wait for message to appear
      await expect(page1.getByText(message)).toBeVisible();

      // Right click message (or click menu button)
      await page1.getByText(message).click({ button: 'right' });

      // Click delete
      await page1.getByRole('menuitem', { name: /delete/i }).click();

      // Confirm
      await page1.getByRole('button', { name: /confirm/i }).click();

      // Verify message removed
      await expect(page1.getByText(message)).not.toBeVisible();
    });
  });

  test.describe('Connection Handling', () => {
    test('should reconnect after network interruption', async () => {
      await page1.goto('/messages/user2');

      // Go offline
      await page1.context().setOffline(true);

      // Try to send message while offline
      await page1.getByRole('textbox', { name: /type a message/i }).fill('Offline message');
      await page1.getByRole('button', { name: /send/i }).click();

      // Should show error or pending state
      await expect(page1.getByText(/connection lost|offline/i)).toBeVisible();

      // Go back online
      await page1.context().setOffline(false);

      // Should automatically reconnect
      await expect(page1.getByText(/connected|online/i)).toBeVisible({ timeout: 10000 });

      // Message should be sent
      await expect(page1.getByText('Offline message')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search Messages', () => {
    test('should search within conversation', async () => {
      await page1.goto('/messages/user2');

      // Open search
      await page1.getByRole('button', { name: /search/i }).click();

      // Type search query
      await page1.getByRole('textbox', { name: /search messages/i }).fill('hello');

      // Results should be highlighted
      await expect(page1.locator('.search-highlight')).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should send message with Enter key', async () => {
      await page1.goto('/messages/user2');

      const textbox = page1.getByRole('textbox', { name: /type a message/i });
      await textbox.fill('Keyboard shortcut test');
      await textbox.press('Enter');

      await expect(page1.getByText('Keyboard shortcut test')).toBeVisible();
    });

    test('should add newline with Shift+Enter', async () => {
      await page1.goto('/messages/user2');

      const textbox = page1.getByRole('textbox', { name: /type a message/i });
      await textbox.fill('Line 1');
      await textbox.press('Shift+Enter');
      await textbox.type('Line 2');

      // Verify textarea contains newline
      const value = await textbox.inputValue();
      expect(value).toContain('\n');
    });
  });

  test.describe('Accessibility', () => {
    test('should announce new messages to screen readers', async () => {
      await page1.goto('/messages/user2');

      // Send message from User 2
      await page2.goto('/messages/user1');
      await page2.getByRole('textbox', { name: /type a message/i }).fill('Accessibility test');
      await page2.getByRole('button', { name: /send/i }).click();

      // Check for ARIA live region update
      await expect(page1.locator('[role="status"]')).toContainText('New message');
    });

    test('should be keyboard navigable', async () => {
      await page1.goto('/messages');

      // Tab through conversations
      await page1.keyboard.press('Tab');
      await expect(page1.locator('[data-testid="conversation-item"]:first-child')).toBeFocused();

      // Arrow down to next conversation
      await page1.keyboard.press('ArrowDown');
      await expect(page1.locator('[data-testid="conversation-item"]:nth-child(2)')).toBeFocused();

      // Enter to open conversation
      await page1.keyboard.press('Enter');
      await expect(page1.getByRole('textbox', { name: /type a message/i })).toBeFocused();
    });
  });
});
