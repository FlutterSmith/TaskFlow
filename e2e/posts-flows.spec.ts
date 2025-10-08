import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Post Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, 'test@example.com', 'Password123!');
  });

  test.describe('Create Post', () => {
    test('should create a text post successfully', async ({ page }) => {
      await page.goto('/dashboard');

      // Open post creation form
      await page.getByRole('button', { name: /create post/i }).click();

      // Fill post content
      const postContent = `Test post created at ${Date.now()}`;
      await page.getByRole('textbox', { name: /what's on your mind/i }).fill(postContent);

      // Submit post
      await page.getByRole('button', { name: /^post$/i }).click();

      // Verify post appears in feed
      await expect(page.getByText(postContent)).toBeVisible();
    });

    test('should create post with mentions', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      const postContent = 'Hello @john, check this out!';
      await page.getByRole('textbox', { name: /what's on your mind/i }).fill(postContent);

      await page.getByRole('button', { name: /^post$/i }).click();

      // Verify post appears with clickable mention
      const mention = page.getByRole('link', { name: '@john' });
      await expect(mention).toBeVisible();
      await expect(mention).toHaveAttribute('href', /\/users\/john/);
    });

    test('should create post with hashtags', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      const postContent = 'Learning #javascript #typescript today!';
      await page.getByRole('textbox', { name: /what's on your mind/i }).fill(postContent);

      await page.getByRole('button', { name: /^post$/i }).click();

      // Verify hashtags are clickable
      const hashtag = page.getByRole('link', { name: '#javascript' });
      await expect(hashtag).toBeVisible();
    });

    test('should upload image with post', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      // Upload image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg');

      // Wait for image preview
      await expect(page.getByRole('img', { name: /preview/i })).toBeVisible();

      // Add content
      await page.getByRole('textbox', { name: /what's on your mind/i }).fill('Check out this image!');

      // Submit
      await page.getByRole('button', { name: /^post$/i }).click();

      // Verify post with image appears
      await expect(page.getByRole('img', { name: /post image/i })).toBeVisible();
    });

    test('should show character count', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      const textbox = page.getByRole('textbox', { name: /what's on your mind/i });
      await textbox.fill('Hello world');

      // Verify character count is displayed
      await expect(page.getByText(/11 \/ 5000/)).toBeVisible();
    });

    test('should show error for empty post', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      // Try to submit empty post
      await page.getByRole('button', { name: /^post$/i }).click();

      // Verify error message
      await expect(page.getByText(/post cannot be empty/i)).toBeVisible();
    });

    test('should show error for post exceeding max length', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      // Fill with text exceeding max length
      const longText = 'a'.repeat(5001);
      await page.getByRole('textbox', { name: /what's on your mind/i }).fill(longText);

      // Verify error or disabled submit button
      const submitButton = page.getByRole('button', { name: /^post$/i });
      await expect(submitButton).toBeDisabled();
    });

    test('should select post visibility', async ({ page }) => {
      await page.goto('/dashboard');

      await page.getByRole('button', { name: /create post/i }).click();

      // Click visibility selector
      await page.getByRole('button', { name: /public/i }).click();

      // Select different visibility
      await page.getByRole('option', { name: /friends only/i }).click();

      // Verify selection
      await expect(page.getByRole('button', { name: /friends only/i })).toBeVisible();
    });
  });

  test.describe('View Posts', () => {
    test('should display posts in feed', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for feed to load
      await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });

      // Verify posts are displayed
      const posts = page.locator('[data-testid="post-card"]');
      await expect(posts.first()).toBeVisible();
    });

    test('should display post author information', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();

      // Verify author name and avatar
      await expect(firstPost.getByRole('link', { name: /test user/i })).toBeVisible();
      await expect(firstPost.getByRole('img', { name: /test user/i })).toBeVisible();
    });

    test('should display post timestamp', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();

      // Verify relative time is displayed (e.g., "2 hours ago")
      await expect(firstPost.getByText(/ago$/)).toBeVisible();
    });

    test('should load more posts on scroll', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for initial posts
      await page.waitForSelector('[data-testid="post-card"]');

      // Get initial post count
      const initialCount = await page.locator('[data-testid="post-card"]').count();

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for more posts to load
      await page.waitForFunction(
        (count) => document.querySelectorAll('[data-testid="post-card"]').length > count,
        initialCount
      );

      // Verify more posts loaded
      const newCount = await page.locator('[data-testid="post-card"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Like Post', () => {
    test('should like a post', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();
      const likeButton = firstPost.getByRole('button', { name: /like/i });

      // Get initial like count
      const initialLikes = await firstPost.locator('[data-testid="like-count"]').textContent();

      // Click like
      await likeButton.click();

      // Verify like button state changed
      await expect(likeButton).toHaveClass(/liked/);

      // Verify like count increased
      await expect(firstPost.locator('[data-testid="like-count"]')).not.toHaveText(initialLikes || '');
    });

    test('should unlike a post', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();
      const likeButton = firstPost.getByRole('button', { name: /like/i });

      // Like the post
      await likeButton.click();
      await expect(likeButton).toHaveClass(/liked/);

      // Unlike the post
      await likeButton.click();

      // Verify like button state changed
      await expect(likeButton).not.toHaveClass(/liked/);
    });

    test('should show optimistic UI update', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();
      const likeButton = firstPost.getByRole('button', { name: /like/i });

      // Click like
      await likeButton.click();

      // Like should immediately show as liked (optimistic update)
      await expect(likeButton).toHaveClass(/liked/);
    });
  });

  test.describe('Comment on Post', () => {
    test('should open comments section', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();

      // Click comment button
      await firstPost.getByRole('button', { name: /comment/i }).click();

      // Verify comments section is visible
      await expect(firstPost.getByRole('textbox', { name: /write a comment/i })).toBeVisible();
    });

    test('should add a comment', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();

      // Open comments
      await firstPost.getByRole('button', { name: /comment/i }).click();

      // Type comment
      const commentText = `Test comment at ${Date.now()}`;
      await firstPost.getByRole('textbox', { name: /write a comment/i }).fill(commentText);

      // Submit comment
      await firstPost.getByRole('button', { name: /post comment/i }).click();

      // Verify comment appears
      await expect(firstPost.getByText(commentText)).toBeVisible();
    });

    test('should show comment count', async ({ page }) => {
      await page.goto('/dashboard');

      const firstPost = page.locator('[data-testid="post-card"]').first();

      // Verify comment count is displayed
      await expect(firstPost.locator('[data-testid="comment-count"]')).toBeVisible();
    });
  });

  test.describe('Edit Post', () => {
    test('should edit own post', async ({ page }) => {
      await page.goto('/dashboard');

      // Find own post (check if author matches current user)
      const ownPost = page.locator('[data-testid="post-card"]').filter({
        has: page.locator('[data-testid="post-menu"]')
      }).first();

      // Open post menu
      await ownPost.getByRole('button', { name: /more options/i }).click();

      // Click edit
      await page.getByRole('menuitem', { name: /edit/i }).click();

      // Edit content
      const textbox = page.getByRole('textbox', { name: /edit post/i });
      const updatedContent = `Updated post at ${Date.now()}`;
      await textbox.clear();
      await textbox.fill(updatedContent);

      // Save changes
      await page.getByRole('button', { name: /save/i }).click();

      // Verify updated content
      await expect(page.getByText(updatedContent)).toBeVisible();

      // Verify "edited" indicator
      await expect(page.getByText(/edited/i)).toBeVisible();
    });

    test('should cancel editing', async ({ page }) => {
      await page.goto('/dashboard');

      const ownPost = page.locator('[data-testid="post-card"]').filter({
        has: page.locator('[data-testid="post-menu"]')
      }).first();

      const originalContent = await ownPost.locator('[data-testid="post-content"]').textContent();

      // Start editing
      await ownPost.getByRole('button', { name: /more options/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      // Make changes
      await page.getByRole('textbox', { name: /edit post/i }).fill('Changed content');

      // Cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Verify original content unchanged
      await expect(ownPost.locator('[data-testid="post-content"]')).toHaveText(originalContent || '');
    });
  });

  test.describe('Delete Post', () => {
    test('should delete own post', async ({ page }) => {
      await page.goto('/dashboard');

      const ownPost = page.locator('[data-testid="post-card"]').filter({
        has: page.locator('[data-testid="post-menu"]')
      }).first();

      const postContent = await ownPost.locator('[data-testid="post-content"]').textContent();

      // Open menu
      await ownPost.getByRole('button', { name: /more options/i }).click();

      // Click delete
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // Confirm deletion
      await page.getByRole('button', { name: /confirm/i }).click();

      // Verify post is removed
      await expect(page.getByText(postContent || '')).not.toBeVisible();
    });

    test('should cancel deletion', async ({ page }) => {
      await page.goto('/dashboard');

      const ownPost = page.locator('[data-testid="post-card"]').filter({
        has: page.locator('[data-testid="post-menu"]')
      }).first();

      const postContent = await ownPost.locator('[data-testid="post-content"]').textContent();

      // Open menu and click delete
      await ownPost.getByRole('button', { name: /more options/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // Cancel deletion
      await page.getByRole('button', { name: /cancel/i }).click();

      // Verify post still exists
      await expect(page.getByText(postContent || '')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display posts correctly on mobile', async ({ page }) => {
      await page.goto('/dashboard');

      const post = page.locator('[data-testid="post-card"]').first();

      // Verify post is visible and properly formatted
      await expect(post).toBeVisible();

      // Verify no horizontal scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test('should handle swipe gestures', async ({ page }) => {
      await page.goto('/dashboard');

      // TODO: Implement swipe gesture tests if applicable
    });
  });
});
