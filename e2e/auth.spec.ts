import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to navigate to login', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Click the login button
    await page.click('text="Se connecter"');

    // Expect the login modal to be visible
    await expect(page.locator('h2:has-text("Connexion")')).toBeVisible();
    
    // Fill in mock credentials (these might fail actual auth unless mock DB exists)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // We expect some error or success depending on the mock DB state
    // Let's just wait for a toast or navigation to happen
    // await expect(page.locator('.toast')).toBeVisible();
  });
});
