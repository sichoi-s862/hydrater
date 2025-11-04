import { test, expect } from '@playwright/test';

test.describe('Build Verification', () => {
  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Filter out expected auth errors when backend is not running
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Auth check failed') &&
      !error.includes('Failed to load resource') &&
      !error.includes('auth/status')
    );

    // Check for critical console errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load all critical resources', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected failures (like backend API calls when server is not running)
    const criticalFailures = failedRequests.filter(url =>
      !url.includes('/auth/') &&
      !url.includes('/api/')
    );

    expect(criticalFailures).toHaveLength(0);
  });

  test('should have correct meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should load CSS correctly', async ({ page }) => {
    await page.goto('/login');

    // Check that styles are applied by verifying computed styles
    const h1 = page.locator('h1');
    const fontSize = await h1.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );

    // Should have a large font size (not default 16px)
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThan(30);
  });

  test('should have React root element', async ({ page }) => {
    await page.goto('/');

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
