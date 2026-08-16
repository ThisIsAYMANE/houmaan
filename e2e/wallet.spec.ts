import { test, expect } from '@playwright/test';

test.describe('Wallet Deposit & Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open Crypto Payment Modal from Header', async ({ page }) => {
    // Click the Deposit button in the header using its unique ID
    await page.click('#header-deposit-btn');

    // Wait for modal to appear — identified by the close button
    const closeBtn = page.locator('button[aria-label="Close"]');
    await expect(closeBtn).toBeVisible({ timeout: 10000 });

    // Verify modal tab buttons (use exact emoji text to avoid strict mode violation)
    await expect(page.getByRole('button', { name: '📥 Deposit', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '📤 Withdraw', exact: true })).toBeVisible();

    // Verify token selector buttons using their unique IDs
    await expect(page.locator('#modal-token-btc')).toBeVisible();
    await expect(page.locator('#modal-token-eth')).toBeVisible();
    await expect(page.locator('#modal-token-usdt')).toBeVisible();

    // Verify deposit method tabs
    await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'QR Code', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Wallet', exact: true })).toBeVisible();
  });

  test('should switch to withdrawal tab', async ({ page }) => {
    // Open modal
    await page.click('#header-deposit-btn');

    // Wait for modal to be visible
    await expect(page.locator('button[aria-label="Close"]')).toBeVisible({ timeout: 10000 });

    // Click the Withdraw tab using exact emoji text
    await page.click('button:has-text("📤 Withdraw")');

    // Verify withdrawal form elements using their IDs
    // Note: #withdraw-max-btn only shows when user is logged in (balance available)
    await expect(page.locator('#withdraw-address-input')).toBeVisible();
    await expect(page.locator('#withdraw-amount-input')).toBeVisible();
  });
});
