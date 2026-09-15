import { expect, test } from '@playwright/test';
import { completeSetupWizard, createScreen, stubGeocoder } from './helpers';

test.describe('first-run onboarding', () => {
  test('the setup page offers to claim this TV', async ({ page }) => {
    await page.goto('/s');
    await expect(page.getByRole('heading', { name: 'Set up this screen' })).toBeVisible();
    await expect(page.getByText(/step 1 of 2/i)).toBeVisible();
    // The device hints tell a mosque what hardware works.
    await expect(page.getByText(/a smart tv/i)).toBeVisible();
    await expect(page.getByText(/raspberry pi/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start/i })).toBeEnabled();
  });

  test('pressing start pairs the TV and shows a scannable code', async ({ page }) => {
    const id = await createScreen(page);

    await expect(page.getByRole('heading', { name: /scan to set up this screen/i })).toBeVisible();
    await expect(page.getByText(/step 2 of 2/i)).toBeVisible();
    // The QR encodes the settings URL, which is also printed for typing in.
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.getByText(new RegExp(`/s/${id}`))).toBeVisible();
  });

  test('the wizard configures times, language and theme, then the TV goes live', async ({ page }) => {
    const id = await createScreen(page);
    await completeSetupWizard(page, id);

    // Leaving the wizard lands on the dashboard, not back at step one.
    await page.getByRole('button', { name: /open the settings/i }).click();
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();

    await page.goto(`/tv/${id}`);
    await expect(page.getByText(/scan to set up/i)).toHaveCount(0);
    await expect(page.getByText(/fajr/i).first()).toBeVisible();
  });

  test('a returning visit to a configured screen skips the wizard', async ({ page }) => {
    const id = await createScreen(page);
    await completeSetupWizard(page, id);

    await page.goto(`/s/${id}`);
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /where should the times come from/i })).toHaveCount(0);
  });

  test('a deleted screen sends the TV back to setup with an explanation', async ({ page }) => {
    await stubGeocoder(page);
    await page.goto('/tv/00000000-0000-4000-8000-000000000000');
    await page.waitForURL(/\/s\?stale=1/);
    await expect(page.getByText(/that screen was removed/i)).toBeVisible();
  });
});
