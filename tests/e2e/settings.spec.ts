import { expect, test } from '@playwright/test';
import { configuredScreen, saveSettings } from './helpers';

/** "HH:MM" one minute later. */
function minuteAfter(time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const total = (hours * 60 + minutes + 1) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

test.describe('settings dashboard', () => {
  test('changes to the theme persist across a reload', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    await page.getByRole('button', { name: 'Theme' }).click();
    await page.getByRole('button', { name: /^Sky/ }).click();
    await saveSettings(page);

    await page.reload();
    await page.getByRole('button', { name: 'Theme' }).click();
    await expect(page.getByRole('button', { name: /^Sky/ })).toHaveAttribute('aria-pressed', 'true');
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
    await page.getByRole('radio', { name: /svenska/i }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /discard/i }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  });

  test('a language change reaches the TV display', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('radio', { name: /svenska/i }).click();
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    // Swedish preset renders Gryning for sunrise.
    await expect(page.getByText(/gryning|soluppg/i).first()).toBeVisible();
  });

  test('a fixed prayer time reaches the TV, persists, and comes off again', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    // Fixed, a time starts at today's own; a minute later is still hours
    // before Asr, so it stays in use whatever the date.
    const dhuhr = page.getByRole('button', { name: /^Dhuhr/ });
    await dhuhr.click();
    await page.getByRole('radio', { name: 'Fixed' }).click();
    const hour = page.getByRole('combobox', { name: 'Fixed time for Dhuhr, hour' });
    const minutes = page.getByRole('combobox', { name: 'Fixed time for Dhuhr, minutes' });
    const source = `${await hour.inputValue()}:${await minutes.inputValue()}`;
    const fixed = minuteAfter(source);
    const [fixedHour = '', fixedMinutes = ''] = fixed.split(':');
    await hour.selectOption(fixedHour);
    await minutes.selectOption(fixedMinutes);
    await expect(page.getByText(`Every day, instead of ${source} today.`)).toBeVisible();
    await expect(dhuhr).toContainText('Fixed');
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    await expect(page.getByText(fixed).first()).toBeVisible();

    await page.goto(`/s/${id}`);
    await dhuhr.click();
    await expect(hour).toHaveValue(fixedHour);
    await expect(minutes).toHaveValue(fixedMinutes);
    await page.getByRole('radio', { name: 'Automatic' }).click();
    await saveSettings(page);

    await page.reload();
    await expect(dhuhr).not.toContainText('Fixed');
    await expect(dhuhr).toContainText(source);
  });

  test('an iqamah reaches the TV and comes off again', async ({ page }) => {
    const id = await configuredScreen(page);
    await page.goto(`/s/${id}`);

    const dhuhr = page.getByRole('button', { name: /^Dhuhr/ });
    await dhuhr.click();
    await page.getByRole('radio', { name: 'After adhan' }).click();
    await expect(dhuhr).toContainText(/Iqamah \d{2}:\d{2}/);
    const iqamah = /Iqamah (\d{2}:\d{2})/.exec((await dhuhr.textContent()) ?? '')?.[1] ?? '';
    await saveSettings(page);

    await page.goto(`/tv/${id}`);
    await expect(page.getByText(/iqamah/i).first()).toBeVisible();
    await expect(page.getByText(iqamah).first()).toBeVisible();

    await page.goto(`/s/${id}`);
    await dhuhr.click();
    await page.getByRole('radio', { name: 'Off' }).click();
    await saveSettings(page);

    await page.reload();
    await expect(dhuhr).not.toContainText('Iqamah');
  });

  test('an unknown screen id is a 404, not a crash', async ({ page }) => {
    const response = await page.goto('/s/11111111-2222-4333-8444-555555555555');
    expect(response?.status()).toBe(404);
  });
});
