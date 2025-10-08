import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /TaskFlow/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should show validation errors on invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;

    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/^email/i).fill(email);
    await page.getByLabel(/^password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to login or dashboard
    await page.waitForURL(/\/(login|dashboard)/);
  });

  test('should login existing user', async ({ page }) => {
    // This test assumes you have a test user in your database
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');

    // Logout
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();

    // Should redirect to login
    await page.waitForURL('/login');
  });
});
