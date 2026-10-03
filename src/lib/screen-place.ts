import { asRecord } from '@/types/database';
import type { Screen } from '@/types/database';
import type { GeoPoint } from '@/lib/sun-position';

/** Where a screen is, for a theme that draws it on the Earth. */
export interface ScreenPlace extends GeoPoint {
  name: string;
}

const DAY_MS = 86_400_000;

interface Remembered {
  place: Promise<ScreenPlace | null>;
  until: number;
}

/**
 * Looked-up places, kept for the life of the server instance. The TV page is
 * dynamic, so a fetch there is never cached, and a TV refreshes every fifteen
 * minutes: without this every refresh would ask the geocoder again for a city
 * that does not move.
 */
const remembered = new Map<string, Remembered>();

interface GeocoderResult {
  name: string;
  latitude: number;
  longitude: number;
  /** GeoNames feature code: PPL* for towns and cities. */
  feature_code?: string;
}

/**
 * The sources name cities as locals do ("Wien", "Göteborg") or as Germans do
 * ("Kopenhagen"), and the geocoder only matches names in the language asked
 * for: in English "Wien" finds a hamlet called Wienau. So the country's own
 * languages go first, then English, then German.
 */
const LANGUAGES_OF = new Map<string, string[]>([
  ['AT', ['de']], ['BA', ['bs']], ['BE', ['nl', 'fr']], ['CH', ['de', 'fr']], ['DE', ['de']],
  ['DK', ['da']], ['FR', ['fr']], ['HR', ['hr']], ['IT', ['it']], ['LI', ['de']],
  ['LU', ['fr', 'de']], ['ME', ['sr']], ['NL', ['nl']], ['NO', ['nb']], ['RS', ['sr']],
  ['SE', ['sv']], ['SI', ['sl']],
]);

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function geocode(name: string, countryCode: string): Promise<ScreenPlace | null> {
  const languages = [...new Set([...(LANGUAGES_OF.get(countryCode) ?? []), 'en', 'de'])];
  for (const language of languages) {
    try {
      const query = new URLSearchParams({ name, count: '10', language, format: 'json' });
      if (/^[A-Z]{2}$/.test(countryCode)) query.set('countryCode', countryCode);
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`);
      if (!res.ok) return null;
      const data: { results?: GeocoderResult[] } = await res.json();
      // Towns only, and the one with exactly this name before any that merely starts with it.
      const towns = (data.results ?? []).filter((r) => !r.feature_code || r.feature_code.startsWith('PPL'));
      const hit = towns.find((r) => plain(r.name) === plain(name)) ?? towns[0];
      if (hit) return { latitude: hit.latitude, longitude: hit.longitude, name };
    } catch {
      return null;
    }
  }
  return null;
}

function geocodeOnce(name: string, countryCode: string): Promise<ScreenPlace | null> {
  if (!name) return Promise.resolve(null);
  const key = `${countryCode}:${name}`;
  const now = Date.now();
  const known = remembered.get(key);
  if (known && known.until > now) return known.place;
  const place = geocode(name, countryCode);
  // A miss may be the geocoder having a bad hour: ask again sooner.
  remembered.set(key, { place, until: now + 30 * DAY_MS });
  void place.then((found) => {
    if (!found) remembered.set(key, { place, until: Date.now() + DAY_MS / 24 });
  });
  return place;
}

/**
 * The screen's place, read from its prayer source. Sources that calculate
 * carry coordinates; the others name a city, which is looked up. Never
 * throws: a place that cannot be found is null, and the theme does without.
 */
export function resolveScreenPlace(screen: Pick<Screen, 'prayer_source' | 'prayer_source_config'>): Promise<ScreenPlace | null> {
  const config = asRecord(screen.prayer_source_config);
  const text = (key: string) => {
    const value = config[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  switch (screen.prayer_source) {
    case 'adhan':
    case 'aladhan': {
      const { latitude, longitude } = config;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return Promise.resolve(null);
      return Promise.resolve({ latitude, longitude, name: text('locationName') });
    }
    case 'vaktija_ba':
      return geocodeOnce(text('locationName'), 'BA');
    case 'vaktija_eu':
      return geocodeOnce(text('locationName'), text('countryCode').toUpperCase());
    case 'islamiska_forbundet':
      return geocodeOnce(text('city'), 'SE');
    default:
      return Promise.resolve(null);
  }
}
