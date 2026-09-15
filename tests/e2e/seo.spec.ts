import { expect, test } from '@playwright/test';
import { configuredScreen } from './helpers';

/**
 * A screen's id is the only thing protecting it, so these URLs must never end
 * up in a search index or in a Referer header sent to another site. Three
 * independent layers say so — robots.txt, a meta tag, and an HTTP header — and
 * each is cheap to break by accident, so each is asserted here.
 */
test.describe('search engines and secret URLs', () => {
  test('the public pages are indexable and name their own canonical', async ({ page }) => {
    for (const [path, canonical] of [
      ['/', '/'],
      ['/s', '/s'],
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} did not load`).toBe(200);

      await expect(
        page.locator('meta[name="robots"]'),
        `${path} should be indexable`
      ).toHaveAttribute('content', /^index, follow/);

      const href = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(href, `${path} canonical`).toMatch(
        canonical === '/' ? /nextnamaz\.com\/?$/ : new RegExp(`${canonical}$`)
      );

      // Every page carries the favicon, not just the landing page.
      expect(await page.locator('link[rel~="icon"]').count(), `${path} favicon`).toBeGreaterThan(0);
    }
  });

  test('screen URLs are noindex in the document, in the headers, and in robots.txt', async ({
    page,
    request,
  }) => {
    const id = await configuredScreen(page);

    for (const path of [`/s/${id}`, `/tv/${id}`]) {
      await page.goto(path);

      await expect(
        page.locator('meta[name="robots"]'),
        `${path} must be noindex`
      ).toHaveAttribute('content', /noindex/);

      // A canonical inherited from a parent segment would nominate another
      // page and defeat the point; there must be none at all.
      expect(await page.locator('link[rel="canonical"]').count(), `${path} canonical`).toBe(0);

      expect(await page.locator('link[rel~="icon"]').count(), `${path} favicon`).toBeGreaterThan(0);

      const res = await request.get(path);
      expect(res.headers()['x-robots-tag'], `${path} X-Robots-Tag`).toMatch(/noindex/);
      // The id must not ride along to any other origin.
      expect(res.headers()['referrer-policy'], `${path} Referrer-Policy`).toBe('no-referrer');
    }

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /s/');
    expect(robots).toContain('Disallow: /tv/');

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap, 'a screen id reached the sitemap').not.toContain(id);
  });
});
