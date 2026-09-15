import { expect, test } from '@playwright/test';
import { configuredScreen, saveSettings } from './helpers';

test.describe('settings dashboard', () => {
  test('changes to the theme persist across a reload', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    await page.getByRole('button', { name: 'Theme' }).click();
    await page.getByRole('button', { name: /^Night/ }).click();
    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Theme' }).click();
    await expect(page.getByRole('button', { name: /^Night/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('screen fit and during-prayer settings live on the theme tab and persist', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Theme' }).click();

    await page.getByLabel('Dark screen while praying').click();
    await expect(page.getByLabel('Stay dark for')).toBeVisible();

    await page.getByLabel('Rotation').click();
    await page.getByRole('option', { name: /rotated right/i }).click();

    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Theme' }).click();
    await expect(page.getByLabel('Dark screen while praying')).toBeChecked();
    await expect(page.getByLabel('Rotation')).toContainText(/rotated right/i);
  });

  test('the save bar only appears once something is edited, and discard reverts', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('button', { name: /svenska/i }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /discard/i }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  });

  test('a language change reaches the TV display', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('button', { name: /svenska/i }).click();
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    // Swedish preset renders Gryning for sunrise.
    await expect(page.getByText(/gryning|soluppg/i).first()).toBeVisible();
  });

  test('an unknown screen id is a 404, not a crash', async ({ page }) => {
    const response = await page.goto('/s/11111111-2222-4333-8444-555555555555');
    expect(response?.status()).toBe(404);
  });
});
