import { VAKTIJA_EU_COUNTRIES } from '@/lib/prayer-sources/vaktija-eu';

export type WizardSource = 'vaktija_ba' | 'vaktija_eu' | 'islamiska_forbundet' | 'adhan';

export interface GeoPlace {
  name: string;
  region: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

/** Human label for a saved source, shown on the Prayer times tab. */
export function sourceLabel(source: string, config: Record<string, unknown>): string {
  const name = typeof config.locationName === 'string' ? config.locationName : '';
  switch (source) {
    case 'vaktija_ba': return `Vaktija.ba · ${name}`;
    case 'vaktija_eu': return `Vaktija.eu · ${name}`;
    case 'islamiska_forbundet': return `Islamiska Förbundet · ${typeof config.city === 'string' ? config.city : ''}`;
    case 'adhan': return `Automatic calculation · ${name}`;
    default: return 'Manual times';
  }
}

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Geocoders return English exonyms while the source lists use local names.
// A Map, not an object literal: a city query may name an Object.prototype member.
const EXONYMS = new Map<string, string>([
  ['gothenburg', 'goteborg'],
  ['vienna', 'wien'],
  ['munich', 'munchen'],
  ['cologne', 'koln'],
  ['copenhagen', 'kopenhagen'],
  ['prague', 'praha'],
  ['warsaw', 'warszawa'],
  ['belgrade', 'beograd'],
  ['the hague', 'den haag'],
]);

export function bestMatch<T>(items: T[], getName: (item: T) => string, city: string): T | null {
  const raw = normalize(city);
  if (!raw) return null;
  const local = EXONYMS.get(raw);
  const targets = local ? [local, raw] : [raw];
  let partial: T | null = null;
  for (const item of items) {
    const n = normalize(getName(item));
    for (const target of targets) {
      if (n === target) return item;
      if (!partial && (n.startsWith(target) || target.startsWith(n))) partial = item;
    }
  }
  return partial;
}

export async function searchCity(query: string): Promise<GeoPlace[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  );
  if (!res.ok) throw new Error('Geocoding failed');
  interface OpenMeteoResult {
    name: string;
    country_code?: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }
  const data: { results?: OpenMeteoResult[] } = await res.json();
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    countryCode: (r.country_code ?? '').toUpperCase(),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}


export function rankSources(place: GeoPlace): WizardSource[] {
  const inVaktijaEu = VAKTIJA_EU_COUNTRIES.some((c) => c.code === place.countryCode);
  if (place.countryCode === 'BA') return ['vaktija_ba', 'adhan'];
  if (place.countryCode === 'SE') {
    return inVaktijaEu ? ['islamiska_forbundet', 'vaktija_eu', 'adhan'] : ['islamiska_forbundet', 'adhan'];
  }
  if (inVaktijaEu) return ['vaktija_eu', 'adhan'];
  return ['adhan'];
}


interface ReverseGeocode {
  city?: string;
  locality?: string;
  countryName?: string;
  countryCode?: string;
}

/** Resolve the browser's location to a place, via GPS + reverse geocoding. */
export function locateMe(): Promise<GeoPlace> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data: ReverseGeocode = await res.json();
          resolve({
            name: data.city || data.locality || 'Your location',
            region: data.countryName ?? '',
            countryCode: (data.countryCode ?? '').toUpperCase(),
            latitude,
            longitude,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('reverse geocoding failed'));
        }
      },
      () => reject(new Error('denied')),
      { timeout: 10_000 }
    );
  });
}
