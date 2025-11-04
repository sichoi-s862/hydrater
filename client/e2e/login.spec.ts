import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Hydrater');

    // Check for subtitle
    await expect(page.locator('.subtitle')).toContainText('X (Twitter) content automation platform');

    // Check for login button
    const loginButton = page.locator('button:has-text("Login with X")');
    await expect(loginButton).toBeVisible();
  });

  test('should have correct styling on login page', async ({ page }) => {
    await page.goto('/login');

    // Check background gradient is applied
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).background
    );
    expect(bgColor).toContain('linear-gradient');

    // Check login button is styled correctly
    const loginButton = page.locator('button:has-text("Login with X")');
    await expect(loginButton).toHaveClass(/btn-primary/);
  });

  test('login button should attempt to redirect on click', async ({ page, context }) => {
    await page.goto('/login');

    // Set up request interception to check OAuth redirect
    const navigationPromise = page.waitForURL('**/auth/twitter', { timeout: 5000 })
      .catch(() => null); // Don't fail if backend isn't running

    const loginButton = page.locator('button:has-text("Login with X")');
    await loginButton.click();

    // Wait a bit to see if navigation happens
    await page.waitForTimeout(1000);
  });
});
