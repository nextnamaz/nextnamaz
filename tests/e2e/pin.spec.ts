import { expect, test } from '@playwright/test';
import { configuredScreen } from './helpers';

/**
 * The PIN guards the settings page and the actions behind it, and only those:
 * the TV keeps showing the times to everyone. A browser that entered the PIN
 * is remembered; a fresh one is asked.
 */
test.describe('PIN lock', () => {
  test('set, remembered, asked afresh, refused, accepted, never on the TV, removed', async ({
    page,
    context,
  }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Lock' }).click();
    await page.getByLabel('PIN', { exact: true }).fill('2468');
    await page.getByRole('button', { name: 'Set PIN' }).click();
    await expect(page.getByText('PIN saved.')).toBeVisible();

    // The browser that set it is not asked again.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();

    // The TV is public and never asks.
    await page.goto(`/tv/${id}`);
    await expect(page.getByRole('heading', { name: 'This screen is locked' })).toHaveCount(0);
    await expect(page.getByText(/fajr/i).first()).toBeVisible();

    // A new browser is asked, and a wrong PIN is refused.
    await context.clearCookies();
    await page.goto(`/s/${id}`);
    await expect(page.getByRole('heading', { name: 'This screen is locked' })).toBeVisible();
    await page.getByLabel('PIN').fill('1111');
    await page.getByRole('button', { name: 'Unlock' }).click();
    // Scoped to the form: Next's dev overlay also announces as an alert.
    await expect(page.locator('form').getByRole('alert')).toHaveText('Wrong PIN');

    // The right one opens the settings.
    await page.getByLabel('PIN').fill('2468');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();

    // Removing it opens the door to everyone again.
    await page.getByRole('button', { name: 'Lock' }).click();
    await page.getByRole('button', { name: 'Remove PIN' }).click();
    await expect(page.getByText('PIN removed.')).toBeVisible();
    await context.clearCookies();
    await page.goto(`/s/${id}`);
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();
  });
});
