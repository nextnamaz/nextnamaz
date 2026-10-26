import { hasAlAdhanOnlyConvention } from '@/lib/prayer-sources/aladhan';
import { VAKTIJA_EU_COUNTRIES } from '@/lib/prayer-sources/vaktija-eu';

export type WizardSource = 'vaktija_ba' | 'vaktija_eu' | 'islamiska_forbundet' | 'aladhan' | 'adhan';

export interface GeoPlace {
  name: string;
  /** Its other names ("Malmö" for Bosnian "Malme"), for finding it in the sources' lists. */
  otherNames?: string[];
  region: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  /** IANA zone from the geocoder; absent for a GPS fix, where the browser's zone is right. */
  timezone?: string;
}

/** Human label for a saved source, shown on the Prayer times tab. */
export function sourceLabel(source: string, config: Record<string, unknown>): string {
  const name = typeof config.locationName === 'string' ? config.locationName : '';
  switch (source) {
    case 'vaktija_ba': return `Vaktija.ba · ${name}`;
    case 'vaktija_eu': return `Vaktija.eu · ${name}`;
    case 'islamiska_forbundet': return `Islamiska Förbundet · ${typeof config.city === 'string' ? config.city : ''}`;
    case 'aladhan': return `AlAdhan · ${name}`;
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

/** An exact match on any of the city's names wins over a partial one on another. */
export function bestMatch<T>(items: T[], getName: (item: T) => string, ...names: string[]): T | null {
  const targets = names.flatMap((name) => {
    const raw = normalize(name);
    if (!raw) return [];
    const local = EXONYMS.get(raw);
    return local ? [local, raw] : [raw];
  });
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

const GEOCODER = 'https://geocoding-api.open-meteo.com/v1';

interface OpenMeteoResult {
  id?: number;
  name: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
  /** GeoNames feature code: PPL* for towns and cities, others for gardens, peaks, farms… */
  feature_code?: string;
}

async function searchIn(query: string, language: string): Promise<OpenMeteoResult[]> {
  const res = await fetch(
    `${GEOCODER}/search?name=${encodeURIComponent(query)}&count=15&language=${language}&format=json`
  );
  if (!res.ok) throw new Error('Geocoding failed');
  const data: { results?: OpenMeteoResult[] } = await res.json();
  // Only places people live: a screen is in a town, not on a mountain.
  return (data.results ?? []).filter((r) => !r.feature_code || r.feature_code.startsWith('PPL'));
}

/** A place's German name; null if the geocoder will not say. */
async function germanName(id: number): Promise<string | null> {
  try {
    const res = await fetch(`${GEOCODER}/get?id=${id}&language=de`);
    const place: Partial<OpenMeteoResult> = res.ok ? await res.json() : {};
    return place.name ?? null;
  } catch {
    return null;
  }
}

interface Found {
  result: OpenMeteoResult;
  /** The language `result` is worded in. */
  language: string;
  /** Its best position in any language's list. */
  rank: number;
  names: Set<string>;
  inGerman: boolean;
}

/**
 * Towns named like the query, best first. The geocoder matches names only in
 * the language it is asked in, and English misses local ones: there "Göteborg"
 * finds just a mountain on Svalbard, and "Wien" a hamlet. So it is asked in the
 * person's own language, in English, and in German, which knows those names and
 * calls cities what the sources' lists call them (Wien, Göteborg, Genf).
 */
export async function searchCity(query: string, language = 'en'): Promise<GeoPlace[]> {
  const lists = await Promise.all(
    [...new Set([language, 'en', 'de'])].map(async (l) => ({ language: l, results: await searchIn(query, l) }))
  );
  // One entry per place, worded in the first language that found it.
  const found = new Map<string, Found>();
  for (const { language: l, results } of lists) {
    results.forEach((r, rank) => {
      const key = `${r.latitude},${r.longitude}`;
      const seen = found.get(key) ?? { result: r, language: l, rank, names: new Set<string>(), inGerman: false };
      seen.rank = Math.min(seen.rank, rank);
      seen.names.add(r.name);
      if (l === 'de') seen.inGerman = true;
      found.set(key, seen);
    });
  }
  const best = [...found.values()]
    // A city before the namesake hamlet another language ranks as high.
    .sort((a, b) => a.rank - b.rank || (b.result.population ?? 0) - (a.result.population ?? 0))
    .slice(0, 6);
  // A place the German search missed ("Beč" in Bosnian) is looked up in German: the lists know it as "Wien".
  await Promise.all(best.map(async (f) => {
    if (f.inGerman || f.result.id === undefined) return;
    const name = await germanName(f.result.id);
    if (name) f.names.add(name);
  }));
  const countries = new Intl.DisplayNames([language], { type: 'region' });
  return best.map(({ result: r, language: wordedIn, names }) => {
    const countryCode = (r.country_code ?? '').toUpperCase();
    const otherNames = [...names].filter((n) => n !== r.name);
    // Found only in English or German, its country is still named in the setup's language.
    const country = wordedIn === language || !countryCode ? r.country : countries.of(countryCode) ?? r.country;
    return {
      name: r.name,
      ...(otherNames.length ? { otherNames } : {}),
      region: [r.admin1, country].filter(Boolean).join(', '),
      countryCode,
      latitude: r.latitude,
      longitude: r.longitude,
      ...(r.timezone ? { timezone: r.timezone } : {}),
    };
  });
}


export function rankSources(place: GeoPlace): WizardSource[] {
  const inVaktijaEu = VAKTIJA_EU_COUNTRIES.some((c) => c.code === place.countryCode);
  // Local calculation needs no network; AlAdhan wins only where it knows a
  // national convention the local library cannot compute.
  const calculated: WizardSource[] = hasAlAdhanOnlyConvention(place.countryCode)
    ? ['aladhan', 'adhan']
    : ['adhan', 'aladhan'];
  if (place.countryCode === 'BA') return ['vaktija_ba', ...calculated];
  if (place.countryCode === 'SE') {
    return inVaktijaEu
      ? ['islamiska_forbundet', 'vaktija_eu', ...calculated]
      : ['islamiska_forbundet', ...calculated];
  }
  if (inVaktijaEu) return ['vaktija_eu', ...calculated];
  return calculated;
}

// Hanafi asr is the published norm in South Asia; elsewhere the earlier asr is.
const HANAFI_COUNTRIES = new Set(['PK', 'IN', 'BD', 'AF']);

export function defaultMadhab(countryCode: string): 'shafi' | 'hanafi' {
  return HANAFI_COUNTRIES.has(countryCode) ? 'hanafi' : 'shafi';
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
