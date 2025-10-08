import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Verify page loaded
      await expect(page).toHaveTitle(/register/i);
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

      // Fill registration form
      const timestamp = Date.now();
      const email = `test-${timestamp}@example.com`;

      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/^email/i).fill(email);
      await page.getByLabel(/^password/i).fill('Password123!');
      await page.getByLabel(/confirm password/i).fill('Password123!');

      // Accept terms
      await page.getByLabel(/accept terms/i).check();

      // Submit form
      await page.getByRole('button', { name: /create account/i }).click();

      // Wait for redirect to dashboard or login
      await page.waitForURL(/\/(dashboard|login)/);

      // Verify success
      if (page.url().includes('dashboard')) {
        await expect(page.getByText(/welcome/i)).toBeVisible();
      } else {
        await expect(page.getByText(/account created/i)).toBeVisible();
      }
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');

      // Submit empty form
      await page.getByRole('button', { name: /create account/i }).click();

      // Verify validation errors
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/^email/i).fill('invalid-email');
      await page.getByLabel(/^email/i).blur();

      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/^password/i).fill('123');
      await page.getByLabel(/^password/i).blur();

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/^password/i).fill('Password123!');
      await page.getByLabel(/confirm password/i).fill('DifferentPassword123!');
      await page.getByLabel(/confirm password/i).blur();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      // Try to register with existing email
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/^email/i).fill('existing@example.com');
      await page.getByLabel(/^password/i).fill('Password123!');
      await page.getByLabel(/confirm password/i).fill('Password123!');
      await page.getByLabel(/accept terms/i).check();

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/email already exists/i)).toBeVisible();
    });

    test('should navigate to login page from register page', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('link', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

      // Fill login form
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');

      // Submit form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard');

      // Verify successful login
      await expect(page.getByText(/dashboard/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword123!');

      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show "Remember me" checkbox', async ({ page }) => {
      await page.goto('/login');

      const rememberCheckbox = page.getByLabel(/remember me/i);
      await expect(rememberCheckbox).toBeVisible();

      await rememberCheckbox.check();
      await expect(rememberCheckbox).toBeChecked();
    });

    test('should navigate to password reset from login page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /forgot password/i }).click();

      await expect(page).toHaveURL(/\/password-reset/);
    });

    test('should navigate to register from login page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /create account/i }).click();

      await expect(page).toHaveURL(/\/register/);
    });

    test('should persist session after page refresh', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('/dashboard');

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('/dashboard');
    });

    test('should logout successfully', async ({ page }) => {
      // Click logout
      await page.getByRole('button', { name: /logout/i }).click();

      // Should redirect to login
      await page.waitForURL('/login');

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect back to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear session after logout', async ({ page, context }) => {
      // Logout
      await page.getByRole('button', { name: /logout/i }).click();
      await page.waitForURL('/login');

      // Check that tokens are cleared
      const cookies = await context.cookies();
      const authCookie = cookies.find(c => c.name.includes('token'));
      expect(authCookie).toBeUndefined();
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await page.goto('/password-reset');

      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      await expect(page.getByText(/reset link sent/i)).toBeVisible();
    });

    test('should show success message even for non-existent email', async ({ page }) => {
      // For security, don't reveal if email exists
      await page.goto('/password-reset');

      await page.getByLabel(/email/i).fill('nonexistent@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show same success message
      await expect(page.getByText(/reset link sent/i)).toBeVisible();
    });

    test('should reset password with valid token', async ({ page }) => {
      // This would typically use a valid reset token from email
      const resetToken = 'valid-reset-token';

      await page.goto(`/password-reset/confirm?token=${resetToken}`);

      await page.getByLabel(/new password/i).fill('NewPassword123!');
      await page.getByLabel(/confirm password/i).fill('NewPassword123!');
      await page.getByRole('button', { name: /reset password/i }).click();

      await expect(page.getByText(/password reset successful/i)).toBeVisible();

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should preserve intended destination after login', async ({ page }) => {
      // Try to access protected page
      await page.goto('/dashboard/projects');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Login
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect back to originally requested page
      await expect(page).toHaveURL('/dashboard/projects');
    });

    test('should not allow access to auth pages when already logged in', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('/dashboard');

      // Try to access login page
      await page.goto('/login');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should allow keyboard navigation on login form', async ({ page }) => {
      await page.goto('/login');

      // Tab through form
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/email/i)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/password/i)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/remember me/i)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();

      // Submit with Enter
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.keyboard.press('Enter');

      await page.waitForURL('/dashboard');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('should display login form correctly on mobile', async ({ page }) => {
      await page.goto('/login');

      // Verify form is visible and accessible
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Verify no horizontal scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
});
