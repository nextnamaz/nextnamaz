import { expect, test } from '@playwright/test';
import { configuredScreen, saveSettings } from './helpers';

test.describe('TV display', () => {
  test('shows every prayer with a time', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/tv/${id}`);

    for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      await expect(page.getByText(new RegExp(prayer, 'i')).first()).toBeVisible();
    }
    // Times render as HH:MM, never as an empty slot or "undefined".
    await expect(page.locator('body')).not.toContainText('undefined');
    await expect(page.locator('body')).toContainText(/\d{2}:\d{2}/);
  });

  test('the settings overlay opens on activity, links to settings, and auto-hides', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/tv/${id}`);

    await page.mouse.move(400, 400);
    const overlay = page.getByRole('heading', { name: 'Screen settings' });
    await expect(overlay).toBeVisible();

    // The shortened address is a real link a TV remote can activate.
    const link = page.getByRole('link', { name: new RegExp(`/s/${id.slice(0, 8)}`) });
    await expect(link).toHaveAttribute('href', new RegExp(`/s/${id}$`));

    // It clears itself so the prayer times are not covered indefinitely.
    await expect(overlay).toBeHidden({ timeout: 20_000 });
  });

  test('the overlay link opens the settings for this screen', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/tv/${id}`);
    await page.mouse.move(400, 400);

    await page.getByRole('link', { name: new RegExp(`/s/${id.slice(0, 8)}`) }).click();
    await page.waitForURL(`**/s/${id}`);
    await expect(page.getByRole('heading', { name: 'Screen settings' })).toBeVisible();
  });

  test('rotation turns the display without collapsing it', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Theme' }).click();
    await page.getByLabel('Rotation').click();
    await page.getByRole('option', { name: /rotated right/i }).click();
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    // The rotated stage swaps its axes: it is as tall as the viewport is wide.
    const stage = page.locator('div[style*="rotate(90deg)"]').first();
    await expect(stage).toBeVisible();
    const box = await stage.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      // Content still fills the screen rather than rendering blank or clipped.
      expect(box.width).toBeGreaterThan(viewport.width * 0.9);
      expect(box.height).toBeGreaterThan(viewport.height * 0.9);
    }
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible();
  });
});
