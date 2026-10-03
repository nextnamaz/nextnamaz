import { expect, test } from '@playwright/test';
import { serviceClient } from './db';
import { configuredScreen, saveSettings } from './helpers';

test.describe('themes', () => {
  test('each theme can be picked, saved and shown on the TV', async ({ page }) => {
    const id = await configuredScreen(page);

    for (const [name, theme] of [
      ['Sky', 'sky'],
      ['Paper', 'paper'],
      ['Ivory', 'ivory'],
      ['Default', 'default'],
    ] as const) {
      await page.goto(`/s/${id}`);
      await page.getByRole('button', { name: 'Theme' }).click();
      const pick = page.getByRole('button', { name: new RegExp(`^${name}`) });
      // Picking the theme already saved leaves nothing to save.
      if ((await pick.getAttribute('aria-pressed')) !== 'true') {
        await pick.click();
        await saveSettings(page);
      }

      await page.goto(`/tv/${id}`);
      await expect(page.locator(`[data-theme="${theme}"]`)).toBeVisible();
      await expect(page.locator('body')).not.toContainText('undefined');
    }
  });

  test('a screen saved on a retired theme keeps its TV and its settings', async ({ page }) => {
    const id = await configuredScreen(page);
    const client = serviceClient();
    test.skip(!client, 'needs Supabase env to put the screen on a retired theme');
    if (!client) return;

    // As the ten production screens still saved on Mihrab hold it today.
    const { error } = await client
      .from('screens')
      .update({ theme: 'mihrab', theme_config: { ayahTop: 'x', palette: 'mint', showSeconds: true } })
      .eq('id', id);
    expect(error).toBeNull();

    // The TV stays on its own page and shows the successor, not the setup screen.
    await page.goto(`/tv/${id}`);
    await expect(page).toHaveURL(new RegExp(`/tv/${id}$`));
    await expect(page.locator('[data-theme="sky"]')).toBeVisible();

    // Its settings open on what the TV shows, and still save.
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Theme' }).click();
    await expect(page.getByRole('button', { name: /^Sky/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /^Ivory/ }).click();
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    await expect(page.locator('[data-theme="ivory"]')).toBeVisible();
  });
});
