import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { configuredScreen, saveSettings } from './helpers';
import { serviceClient } from './db';

// A real deck published to the web, and the 2026 calendar a mosque's old
// screen ran on. The deck test reaches Google, so it needs the network.
const DECK_LINK =
  'https://docs.google.com/presentation/d/e/2PACX-1vRCVjAWGnmJNdw7vc0BYClr6SdOufhrPsDa_oy332tY0j8hQ5m3w0YPD1vV1-0aYhuBcF6Dzq7DvrVB/pub?start=false';
const CALENDAR = 'tests/fixtures/calendar-goteborg-2026.csv';

function todayInStockholm(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm' }).format(new Date());
}

test.describe('Google Slides', () => {
  test('a published deck is added, saved, and its slides take turns on the TV', async ({ page }) => {
    test.slow();
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();
    await page.getByLabel('Show announcements').click();

    await page.getByLabel('Google Slides', { exact: true }).fill(DECK_LINK);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Remove Google Slides' })).toBeAttached({ timeout: 30_000 });
    // One deck per screen: the field steps aside once one is added.
    await expect(page.getByLabel('Google Slides', { exact: true })).toHaveCount(0);
    await saveSettings(page);
    await page.screenshot({ path: 'test-results/slides-settings.png', fullPage: true });

    await page.reload();
    await page.getByRole('button', { name: 'Announcements' }).click();
    await expect(page.getByRole('button', { name: 'Remove Google Slides' })).toBeAttached();

    // Shorten the wait to the minimum so the TV reaches the slideshow quickly.
    const db = serviceClient();
    if (!db) {
      test.skip(true, 'needs Supabase env');
      return;
    }
    const { data } = await db.from('screens').select('display_config').eq('id', id).single();
    const config = data?.display_config as { announcements: Record<string, unknown> };
    await db
      .from('screens')
      .update({ display_config: { ...config, announcements: { ...config.announcements, intervalMin: 1, showSeconds: 5 } } })
      .eq('id', id);

    await page.goto(`/tv/${id}`);
    const frame = page.locator('iframe[src*="/pubembed?"]');
    await expect(frame).toBeAttached({ timeout: 90_000 });
    const first = await frame.getAttribute('src');
    expect(first).toContain('slide=id.');
    await page.waitForTimeout(4_000);
    await page.screenshot({ path: 'test-results/slides-tv.png' });
    // The next slide replaces it after showSeconds.
    await expect(frame).not.toHaveAttribute('src', first ?? '', { timeout: 15_000 });
  });

  test('a link that is not a published deck is refused', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: 'Announcements' }).click();
    await page.getByLabel('Google Slides', { exact: true }).fill('https://docs.google.com/presentation/d/1abc/edit');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(/Publish to web/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Google Slides' })).toHaveCount(0);
  });
});

test.describe('calendar file', () => {
  test("an uploaded calendar becomes the source and shows today's row", async ({ page }) => {
    const today = todayInStockholm();
    const row = readFileSync(CALENDAR, 'utf8')
      .split('\n')
      .find((l) => l.startsWith(today));
    test.skip(!row, 'the fixture calendar only covers 2026');

    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);
    await page.getByRole('button', { name: /own calendar file/i }).click({ trial: true });
    await page.setInputFiles('input[type="file"][accept*=".csv"]', CALENDAR);
    await expect(page.getByText('Your calendar file')).toBeVisible();
    await saveSettings(page);

    await page.reload();
    await expect(page.getByText('Your calendar file')).toBeVisible();
    await expect(page.getByText(/Calendar until 31 December 2026|ends on 31 December 2026/)).toBeVisible();
    const fajr = row?.split(',')[1] ?? '';
    await expect(page.getByText(fajr).first()).toBeVisible();
    await page.screenshot({ path: 'test-results/calendar-settings.png', fullPage: true });

    await page.goto(`/tv/${id}`);
    await expect(page.getByText(fajr).first()).toBeVisible({ timeout: 30_000 });
  });
});
