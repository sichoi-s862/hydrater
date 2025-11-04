import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test('should render responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Check that page is still functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Login with X")')).toBeVisible();
  });

  test('should render responsive design on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Login with X")')).toBeVisible();
  });

  test('should render responsive design on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Login with X")')).toBeVisible();
  });

  test('buttons should have proper accessibility', async ({ page }) => {
    await page.goto('/login');

    const loginButton = page.locator('button:has-text("Login with X")');

    // Check button is visible and enabled
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();

    // Check button can receive focus
    await loginButton.focus();
    await expect(loginButton).toBeFocused();
  });
});
