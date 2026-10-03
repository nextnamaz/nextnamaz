import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveScreenPlace } from '@/lib/screen-place';

describe('resolveScreenPlace', () => {
  afterEach(() => vi.unstubAllGlobals());

  const respond = (results: object[]) =>
    vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ results }), { status: 200 }));

  it('reads coordinates straight from a calculating source', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const place = await resolveScreenPlace({
      prayer_source: 'adhan',
      prayer_source_config: { latitude: 57.7, longitude: 11.97, locationName: 'Göteborg' },
    });
    expect(place).toEqual({ latitude: 57.7, longitude: 11.97, name: 'Göteborg' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('looks a city up in its own country and language, towns only', async () => {
    const fetch = respond([
      { name: 'Wiener Neustadt', latitude: 47.8, longitude: 16.2, feature_code: 'PPLA3' },
      { name: 'Wien', latitude: 48.21, longitude: 16.37, feature_code: 'PPLC' },
    ]);
    vi.stubGlobal('fetch', fetch);
    const place = await resolveScreenPlace({
      prayer_source: 'vaktija_eu',
      prayer_source_config: { countryCode: 'at', locationSlug: 'wien', locationName: 'Wien' },
    });
    expect(place).toEqual({ latitude: 48.21, longitude: 16.37, name: 'Wien' });
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get('countryCode')).toBe('AT');
    expect(url.searchParams.get('language')).toBe('de');
  });

  it('asks once per city, not on every refresh', async () => {
    const fetch = respond([{ name: 'Tuzla', latitude: 44.54, longitude: 18.67, feature_code: 'PPLA2' }]);
    vi.stubGlobal('fetch', fetch);
    const screen = { prayer_source: 'vaktija_ba', prayer_source_config: { locationId: 107, locationName: 'Tuzla' } };
    await resolveScreenPlace(screen);
    await resolveScreenPlace(screen);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('gives up quietly: no source place, a failed lookup or no town is null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await resolveScreenPlace({ prayer_source: 'manual', prayer_source_config: {} })).toBeNull();
    expect(
      await resolveScreenPlace({ prayer_source: 'islamiska_forbundet', prayer_source_config: { city: 'Nowhere' } })
    ).toBeNull();
  });
});
