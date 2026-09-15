import { expect, test } from '@playwright/test';
import { configuredScreen, saveSettings } from './helpers';

/**
 * The slideshow's timing is covered by the hook unit tests; these specs cover
 * the wiring an admin actually touches — upload, persist, remove.
 */
test.describe('announcements', () => {
  const IMAGE = 'public/themes/textures/mihrab-carve.jpg';

  test('an uploaded image persists and is served from storage', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();

    await page.getByLabel('Show announcements').click();
    await page.setInputFiles('input[type="file"]', IMAGE);

    const thumb = page.locator(`img[src*="/slides/${id}/"]`).first();
    await expect(thumb).toBeVisible({ timeout: 30_000 });

    // The upload is real: the public URL must actually serve the bytes.
    const src = await thumb.getAttribute('src');
    expect(src).toBeTruthy();
    const served = await page.request.get(src as string);
    expect(served.status()).toBe(200);

    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Announcements' }).click();
    await expect(page.getByLabel('Show announcements')).toBeChecked();
    await expect(page.locator(`img[src*="/slides/${id}/"]`).first()).toBeVisible();
  });

  test('the layout choice persists', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();

    await page.getByLabel('How they appear').click();
    await page.getByRole('option', { name: /split screen/i }).click();
    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Announcements' }).click();
    await expect(page.getByLabel('How they appear')).toContainText(/split screen/i);
  });

  test('removing an image and saving takes it off the screen', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();
    await page.setInputFiles('input[type="file"]', IMAGE);
    await expect(page.locator(`img[src*="/slides/${id}/"]`).first()).toBeVisible({ timeout: 30_000 });
    await saveSettings(page);

    await page.getByRole('button', { name: /remove image/i }).first().click();
    await expect(page.locator(`img[src*="/slides/${id}/"]`)).toHaveCount(0);
    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Announcements' }).click();
    await expect(page.locator(`img[src*="/slides/${id}/"]`)).toHaveCount(0);
  });

  test('the file picker accepts images and video only', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();

    const accept = await page.locator('input[type="file"]').getAttribute('accept');
    expect(accept).toContain('image/jpeg');
    expect(accept).toContain('video/mp4');
    expect(accept).not.toContain('application/pdf');
    await expect(page.getByText(/up to 4 MB.*up to 40 MB/i)).toBeVisible();
  });
});
