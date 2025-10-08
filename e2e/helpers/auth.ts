import { Page } from '@playwright/test';

/**
 * Helper function to login a user
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper function to register a new user
 */
export async function register(
  page: Page,
  name: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/register');

  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByLabel(/accept terms/i).check();

  await page.getByRole('button', { name: /create account/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
  // Find and click logout button (might be in a dropdown menu)
  try {
    await page.getByRole('button', { name: /logout/i }).click({ timeout: 2000 });
  } catch {
    // If not immediately visible, try opening user menu first
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();
  }

  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 10000 });
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();

  // Simple check: authenticated users shouldn't be on login/register pages
  if (url.includes('/login') || url.includes('/register')) {
    return false;
  }

  // Check for presence of logout button or user menu
  try {
    await page.getByRole('button', { name: /logout|user menu/i }).waitFor({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
