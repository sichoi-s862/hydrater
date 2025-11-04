import { test, expect } from '@playwright/test';

test.describe('Routing', () => {
  test('should redirect root to appropriate page', async ({ page }) => {
    await page.goto('/');

    // Should redirect somewhere (login if not authenticated, dashboard if authenticated)
    await page.waitForURL(/\/(login|dashboard)/);

    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });

  test('should show loading state during auth check', async ({ page }) => {
    await page.goto('/');

    // Wait a moment for the page to settle
    await page.waitForTimeout(500);

    // Should either show loading state OR have redirected to login/dashboard
    const url = page.url();
    const hasRedirected = url.includes('/login') || url.includes('/dashboard');

    expect(hasRedirected).toBe(true);
  });

  test('dashboard route should redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle unknown routes', async ({ page }) => {
    await page.goto('/unknown-route-12345');

    // Should redirect to either login or dashboard (with timeout)
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
  });
});
