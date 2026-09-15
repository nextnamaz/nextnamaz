import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Screens created by the suite; the global teardown deletes these. */
export const CREATED_SCREENS_FILE = 'test-results/created-screens.txt';

function recordScreen(id: string): void {
  mkdirSync(dirname(CREATED_SCREENS_FILE), { recursive: true });
  appendFileSync(CREATED_SCREENS_FILE, `${id}\n`);
}

/**
 * A city in a country with no regional timetable, so the wizard offers only
 * the local astronomical calculation. That keeps the suite hermetic: the one
 * network call the browser makes (geocoding) is stubbed, and the prayer times
 * are computed on the server with no outbound request at all.
 */
export const STUB_CITY = {
  name: 'Testville',
  admin1: 'Test State',
  country: 'United States',
  country_code: 'us',
  latitude: 40.71,
  longitude: -74.01,
};

/** Intercept the browser-side geocoder so city search is deterministic. */
export async function stubGeocoder(page: Page): Promise<void> {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [STUB_CITY] }),
    })
  );
}

/** Press Start on /s and return the id of the screen that gets created. */
export async function createScreen(page: Page): Promise<string> {
  await page.goto('/s');
  await page.getByRole('button', { name: /start/i }).click();
  await page.waitForURL(/\/tv\/[0-9a-f-]{36}/);
  const id = new URL(page.url()).pathname.split('/').pop() as string;
  recordScreen(id);
  return id;
}

/**
 * Walk a fresh screen through the first-run wizard, leaving it
 * configured with calculated times.
 */
export async function completeSetupWizard(page: Page, screenId: string): Promise<void> {
  await stubGeocoder(page);
  await page.goto(`/s/${screenId}`);

  await expect(page.getByRole('heading', { name: /where should the times come from/i })).toBeVisible();
  await page.getByPlaceholder(/type your city/i).fill('Testville');
  await page.getByPlaceholder(/type your city/i).press('Enter');
  await page.getByRole('button', { name: new RegExp(STUB_CITY.name) }).first().click();

  // Only the astronomical calculation is offered for this country.
  await page.getByRole('button', { name: /use this source/i }).click();

  await expect(page.getByRole('heading', { name: /check the times/i })).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByRole('heading', { name: /what language/i })).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByRole('heading', { name: /pick a look/i })).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  // The PIN is optional; the default flow skips it.
  await expect(page.getByRole('heading', { name: /lock it with a pin/i })).toBeVisible();
  await page.getByRole('button', { name: /turn on the display/i }).click();

  await expect(page.getByRole('heading', { name: /your screen is live/i })).toBeVisible();
}

/** A configured screen, ready for settings/display assertions. */
export async function configuredScreen(page: Page): Promise<string> {
  const id = await createScreen(page);
  await completeSetupWizard(page, id);
  return id;
}

/**
 * Press Save and wait for the change to be committed. The save bar only
 * disappears once the server confirms, so this never races a reload.
 */
export async function saveSettings(page: Page): Promise<void> {
  // The button relabels itself to "Saving…" mid-flight, so its absence alone
  // does not mean the write landed. Wait for the server action's response.
  const committed = page.waitForResponse(
    (res) => res.request().method() === 'POST' && res.url().includes('/s/')
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await committed;
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
}
