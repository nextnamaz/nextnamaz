import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveScreenPlace } from '@/lib/screen-place';
import { moments, zoomLevel } from '@/components/display/themes/globe';
import type { PrayerTimeEntry } from '@/types/prayer';

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

describe('the Globe theme on the clock', () => {
  const prayers: PrayerTimeEntry[] = [
    { name: 'fajr', displayName: 'Zora', time: '05:21' },
    { name: 'sunrise', displayName: 'Izlazak sunca', time: '07:24' },
    { name: 'dhuhr', displayName: 'Podne', time: '13:04' },
    { name: 'asr', displayName: 'Ikindija', time: '15:52' },
    { name: 'maghrib', displayName: 'Akšam', time: '18:41' },
    { name: 'isha', displayName: 'Jacija', time: '20:29' },
  ];
  const at = (h: number, m: number, s = 0) => new Date(2026, 9, 3, h, m, s);

  it.each([
    [at(18, 39), 'maghrib', 'asr'],
    [at(18, 41), 'isha', 'maghrib'],
    [at(7, 0), 'sunrise', 'fajr'],
    [at(23, 50), 'fajr', 'isha'],
    [at(0, 10), 'fajr', 'isha'],
  ])('at %s the next line is %s and the last %s', (now, next, last) => {
    const found = moments(prayers, now);
    expect(found.next?.prayer.name).toBe(next);
    expect(found.last?.prayer.name).toBe(last);
  });

  it('puts the next Fajr on the morning after, not the one gone', () => {
    const found = moments(prayers, at(23, 50));
    expect(found.next?.at).toBe(new Date(2026, 9, 4, 5, 21).getTime());
  });

  it.each([
    [45, 120, 0],
    [30, 120, 1],
    [10.5, 120, 1],
    [10, 120, 2],
    [3.5, 120, 2],
    [3, 120, 3],
    [0.2, 120, 3],
    [100, 0, 3],
    [100, 5, 3],
    [100, 5.5, 0],
  ])('%s minutes to the next prayer and %s since the last: zoom %s', (to, since, level) => {
    expect(zoomLevel(to, since)).toBe(level);
  });
});
