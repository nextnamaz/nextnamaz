import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bestMatch,
  defaultMadhab,
  locateMe,
  normalize,
  rankSources,
  searchCity,
  sourceLabel,
} from '@/lib/prayer-sources/match';
import type { GeoPlace, WizardSource } from '@/lib/prayer-sources/match';
import { VAKTIJA_LOCATIONS } from '@/lib/prayer-sources/vaktija-ba';
import { VAKTIJA_EU_COUNTRIES } from '@/lib/prayer-sources/vaktija-eu';
import type { VaktijaEuLocation } from '@/lib/prayer-sources/vaktija-eu';
import { ISLAMISKA_CITIES } from '@/lib/prayer-sources/islamiska-forbundet';

interface Stop {
  code: string;
  label: string;
}

/** The prefix entry deliberately sits *before* the exact one, so order can't fake a pass. */
const STOPS: Stop[] = [
  { code: 'ilidza', label: 'Sarajevo Ilidža' },
  { code: 'sarajevo', label: 'Sarajevo' },
  { code: 'goteborg', label: 'Göteborg' },
  { code: 'wien', label: 'Wien' },
  { code: 'den-haag', label: 'Den Haag' },
];

const byLabel = (s: Stop) => s.label;
const byName = (l: { name: string }) => l.name;
const itself = (c: string) => c;

function euLocations(code: string): VaktijaEuLocation[] {
  const country = VAKTIJA_EU_COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`fixture drift: no vaktija.eu country ${code}`);
  return country.locations;
}

function place(countryCode: string): GeoPlace {
  return { name: 'Testville', region: '', countryCode, latitude: 0, longitude: 0 };
}

interface OpenMeteoResult {
  name: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  feature_code?: string;
}

function stubFetch(body: string, status = 200) {
  const mock = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function stubJsonFetch<T>(body: T, status = 200) {
  return stubFetch(JSON.stringify(body), status);
}

interface FakeGeolocation {
  getCurrentPosition(
    success: (pos: { coords: { latitude: number; longitude: number } }) => void,
    error: () => void
  ): void;
}

/** GPS that always succeeds at the given coordinates. */
function stubGeolocationAt(latitude: number, longitude: number): void {
  const geo: FakeGeolocation = {
    getCurrentPosition: (success) => success({ coords: { latitude, longitude } }),
  };
  Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
}

function stubGeolocationDenied(): void {
  const geo: FakeGeolocation = {
    getCurrentPosition: (_success, error) => error(),
  };
  Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'geolocation');
});

describe('normalize', () => {
  it('strips diacritics and lowercases', () => {
    expect(normalize('Göteborg')).toBe('goteborg');
    expect(normalize('MALMÖ')).toBe('malmo');
    expect(normalize('Bihać')).toBe('bihac');
    expect(normalize('Žepče')).toBe('zepce');
    expect(normalize('Åmål')).toBe('amal');
  });

  it('trims the ends but leaves inner spacing alone', () => {
    expect(normalize('Sarajevo ')).toBe('sarajevo');
    expect(normalize('  Den Haag\n')).toBe('den haag');
    expect(normalize('Novi  Travnik')).toBe('novi  travnik');
  });

  it('keeps letters that NFD does not decompose', () => {
    // ø and đ are single code points with no combining-mark form, so they survive.
    // Harmless for matching: both sides of a comparison keep them.
    expect(normalize('Gjøvik')).toBe('gjøvik');
    expect(normalize('Đakovo')).toBe('đakovo');
  });

  it('reduces blank input to the empty string', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   \t ')).toBe('');
  });
});

describe('bestMatch', () => {
  it('prefers an exact match over a partial one found earlier in the list', () => {
    expect(bestMatch(STOPS, byLabel, 'Sarajevo')?.code).toBe('sarajevo');
  });

  it('falls back to the first partial match when nothing matches exactly', () => {
    expect(bestMatch(STOPS, byLabel, 'Sara')?.code).toBe('ilidza');
  });

  it('matches when the list name is a prefix of the query', () => {
    // The reverse of the 'Sara' case: here 'Wien' is a prefix of the query.
    expect(bestMatch(STOPS, byLabel, 'Wiener Neustadt')?.code).toBe('wien');
  });

  it('resolves English exonyms to the local name', () => {
    expect(bestMatch(STOPS, byLabel, 'Gothenburg')?.code).toBe('goteborg');
    expect(bestMatch(STOPS, byLabel, 'Vienna')?.code).toBe('wien');
    expect(bestMatch(STOPS, byLabel, 'The Hague')?.code).toBe('den-haag');
  });

  it('returns null for a blank query', () => {
    expect(bestMatch(STOPS, byLabel, '')).toBeNull();
    expect(bestMatch(STOPS, byLabel, '   ')).toBeNull();
  });

  it('returns null for an unrelated query and for an empty list', () => {
    expect(bestMatch(STOPS, byLabel, 'Tokyo')).toBeNull();
    expect(bestMatch([], byLabel, 'Sarajevo')).toBeNull();
  });

  it('returns null for a query that names an Object.prototype member', () => {
    for (const hostile of ['constructor', '__proto__', 'toString', 'valueOf']) {
      expect(bestMatch(STOPS, byLabel, hostile), hostile).toBeNull();
    }
  });

  it('works against the real Vaktija.ba locations, keyed by id', () => {
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'Sarajevo')?.id).toBe(77);
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'bihac')?.id).toBe(10);
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'Zavidovići')?.id).toBe(100);
    // Partial: the list stores the full 'Prozor-Rama'.
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'Prozor')?.id).toBe(74);
    // Partial the other way: geocoders name the municipality, the list the city.
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'Sarajevo Centar')?.id).toBe(77);
    expect(bestMatch(VAKTIJA_LOCATIONS, byName, 'Ljubljana')).toBeNull();
  });

  it('works against the real Vaktija.eu locations, keyed by slug', () => {
    expect(bestMatch(euLocations('AT'), byName, 'Vienna')?.slug).toBe('wien');
    expect(bestMatch(euLocations('NL'), byName, 'The Hague')?.slug).toBe('den-haag');
    expect(bestMatch(euLocations('DE'), byName, 'Munich')?.slug).toBe('muenchen');
    expect(bestMatch(euLocations('DE'), byName, 'Cologne')?.slug).toBe('koeln');
    expect(bestMatch(euLocations('SE'), byName, 'Göteborg')?.slug).toBe('goeteborg');
    expect(bestMatch(euLocations('RS'), byName, 'Belgrade')?.slug).toBe('beograd');
  });

  it('finds the Danish capital from its English exonym', () => {
    expect(bestMatch(euLocations('DK'), byName, 'Copenhagen')?.slug).toBe('kopenhagen');
  });

  it('works against the real Swedish city list, which is plain strings', () => {
    expect(bestMatch(ISLAMISKA_CITIES, itself, 'Gothenburg')).toBe('Göteborg');
    expect(bestMatch(ISLAMISKA_CITIES, itself, 'jonkoping')).toBe('Jönköping');
    expect(bestMatch(ISLAMISKA_CITIES, itself, 'Boras')).toBe('Borås');
    expect(bestMatch(ISLAMISKA_CITIES, itself, 'Reykjavik')).toBeNull();
  });
});

describe('rankSources', () => {
  it('offers only Vaktija.ba in Bosnia, even though vaktija.eu also covers BA', () => {
    expect(VAKTIJA_EU_COUNTRIES.some((c) => c.code === 'BA')).toBe(true);
    expect(rankSources(place('BA'))).toEqual(['vaktija_ba', 'adhan', 'aladhan']);
  });

  it('puts Islamiska Förbundet first in Sweden, with Vaktija.eu behind it', () => {
    expect(rankSources(place('SE'))).toEqual(['islamiska_forbundet', 'vaktija_eu', 'adhan', 'aladhan']);
  });

  it('offers Vaktija.eu for its other listed countries', () => {
    expect(rankSources(place('AT'))).toEqual(['vaktija_eu', 'adhan', 'aladhan']);
    expect(rankSources(place('DE'))).toEqual(['vaktija_eu', 'adhan', 'aladhan']);
    expect(rankSources(place('NL'))).toEqual(['vaktija_eu', 'adhan', 'aladhan']);
  });

  it('recommends local calculation for an unlisted country, with AlAdhan behind it', () => {
    // The e2e suite depends on the US order: its stub city must not need the network.
    expect(rankSources(place('US'))).toEqual(['adhan', 'aladhan']);
    expect(rankSources(place('JP'))).toEqual(['adhan', 'aladhan']);
    expect(rankSources(place(''))).toEqual(['adhan', 'aladhan']);
  });

  it('recommends AlAdhan where only it knows the national convention', () => {
    expect(rankSources(place('FR'))).toEqual(['vaktija_eu', 'aladhan', 'adhan']);
    expect(rankSources(place('MY'))).toEqual(['aladhan', 'adhan']);
    expect(rankSources(place('ID'))).toEqual(['aladhan', 'adhan']);
    expect(rankSources(place('MA'))).toEqual(['aladhan', 'adhan']);
    // Turkey's convention the local library also has, so it stays local-first.
    expect(rankSources(place('TR'))).toEqual(['adhan', 'aladhan']);
  });

  it('ignores a lowercase country code — the comparison is case-sensitive', () => {
    // Safe only because searchCity/locateMe both uppercase before handing a place over.
    expect(rankSources(place('ba'))).toEqual(['adhan', 'aladhan']);
    expect(rankSources(place('se'))).toEqual(['adhan', 'aladhan']);
  });

  it('always offers both calculated sources, each once', () => {
    const codes = [...VAKTIJA_EU_COUNTRIES.map((c) => c.code), 'US', 'MY', 'XX', ''];
    for (const code of codes) {
      const ranked: WizardSource[] = rankSources(place(code));
      expect(ranked).toContain('adhan');
      expect(ranked).toContain('aladhan');
      expect(new Set(ranked).size).toBe(ranked.length);
    }
  });
});

describe('defaultMadhab', () => {
  it('is hanafi in South Asia and shafi everywhere else', () => {
    expect(defaultMadhab('PK')).toBe('hanafi');
    expect(defaultMadhab('IN')).toBe('hanafi');
    expect(defaultMadhab('BD')).toBe('hanafi');
    expect(defaultMadhab('SE')).toBe('shafi');
    expect(defaultMadhab('TR')).toBe('shafi');
    expect(defaultMadhab('')).toBe('shafi');
  });
});

describe('sourceLabel', () => {
  it('names the source and the saved location, separated by a middle dot', () => {
    expect(sourceLabel('vaktija_ba', { locationName: 'Sarajevo' })).toBe('Vaktija.ba · Sarajevo');
    expect(sourceLabel('vaktija_eu', { locationName: 'Wien' })).toBe('Vaktija.eu · Wien');
    expect(sourceLabel('adhan', { locationName: 'Stockholm' })).toBe('Automatic calculation · Stockholm');
    expect(sourceLabel('aladhan', { locationName: 'Paris' })).toBe('AlAdhan · Paris');
  });

  it('reads the Swedish source from config.city, not config.locationName', () => {
    expect(sourceLabel('islamiska_forbundet', { city: 'Göteborg' })).toBe('Islamiska Förbundet · Göteborg');
    expect(sourceLabel('islamiska_forbundet', { locationName: 'Göteborg' })).toBe('Islamiska Förbundet · ');
  });

  it('leaves the location blank when the config field is missing or not a string', () => {
    expect(sourceLabel('vaktija_ba', {})).toBe('Vaktija.ba · ');
    expect(sourceLabel('adhan', { locationName: 42 })).toBe('Automatic calculation · ');
    expect(sourceLabel('adhan', { locationName: null })).toBe('Automatic calculation · ');
  });

  it('calls anything it does not recognise Manual times', () => {
    expect(sourceLabel('manual', { locationName: 'Sarajevo' })).toBe('Manual times');
    expect(sourceLabel('', {})).toBe('Manual times');
    expect(sourceLabel('Vaktija.ba', {})).toBe('Manual times');
    expect(sourceLabel('VAKTIJA_BA', {})).toBe('Manual times');
  });
});

describe('searchCity', () => {
  it('maps an Open-Meteo payload to GeoPlaces and encodes the query', async () => {
    const fetchMock = stubJsonFetch<{ results: OpenMeteoResult[] }>({
      results: [
        {
          name: 'Sankt Pölten',
          admin1: 'Lower Austria',
          country: 'Austria',
          country_code: 'at',
          latitude: 48.2,
          longitude: 15.63,
        },
      ],
    });

    await expect(searchCity('Sankt Pölten')).resolves.toEqual([
      {
        name: 'Sankt Pölten',
        region: 'Lower Austria, Austria',
        countryCode: 'AT',
        latitude: 48.2,
        longitude: 15.63,
      },
    ]);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('https://geocoding-api.open-meteo.com/v1/search?');
    expect(url).toContain('name=Sankt%20P%C3%B6lten');
    expect(url).toContain('count=15');
    expect(url).toContain('language=en');
  });

  it('keeps towns and cities, and drops peaks, gardens and the like', async () => {
    stubJsonFetch<{ results: OpenMeteoResult[] }>({
      results: [
        { name: 'Gothenburg', latitude: 57.7, longitude: 11.97, feature_code: 'PPLA' },
        { name: 'Göteborgnuten', latitude: 77.9, longitude: 16.7, feature_code: 'MT' },
        { name: 'Göteborgs Botaniska Trädgård', latitude: 57.68, longitude: 11.95, feature_code: 'GDN' },
        { name: 'Torslanda', latitude: 57.72, longitude: 11.77, feature_code: 'PPL' },
      ],
    });
    const found = await searchCity('Göteborg');
    expect(found.map((p) => p.name)).toEqual(['Gothenburg', 'Torslanda']);
  });

  it('carries the geocoder timezone through, and leaves the key off when there is none', async () => {
    stubJsonFetch<{ results: OpenMeteoResult[] }>({
      results: [
        { name: 'Auckland', latitude: -36.85, longitude: 174.76, timezone: 'Pacific/Auckland' },
        { name: 'Nowhere', latitude: 0, longitude: 0 },
      ],
    });

    const [auckland, nowhere] = await searchCity('au');
    expect(auckland?.timezone).toBe('Pacific/Auckland');
    expect(nowhere).not.toHaveProperty('timezone');
  });

  it('drops missing region parts and tolerates a missing country code', async () => {
    stubJsonFetch<{ results: OpenMeteoResult[] }>({
      results: [
        { name: 'Sarajevo', country: 'Bosnia', latitude: 43.85, longitude: 18.38 },
        { name: 'Mostar', admin1: 'Herzegovina', latitude: 43.34, longitude: 17.81 },
        { name: 'Nowhere', latitude: 0, longitude: 0 },
      ],
    });

    const places = await searchCity('sa');
    expect(places.map((p) => p.region)).toEqual(['Bosnia', 'Herzegovina', '']);
    expect(places.map((p) => p.countryCode)).toEqual(['', '', '']);
  });

  it('returns an empty list when the payload carries no results key', async () => {
    stubJsonFetch<Record<string, never>>({});
    await expect(searchCity('zzzz')).resolves.toEqual([]);
  });

  it('throws before parsing the body when the response is not ok', async () => {
    stubFetch('<html>rate limited</html>', 503);
    await expect(searchCity('Sarajevo')).rejects.toThrow('Geocoding failed');
  });
});

describe('locateMe', () => {
  it('resolves the GPS fix through the reverse geocoder', async () => {
    stubGeolocationAt(57.7089, 11.9746);
    const fetchMock = stubJsonFetch({
      city: 'Göteborg',
      locality: 'Centrum',
      countryName: 'Sweden',
      countryCode: 'se',
    });

    await expect(locateMe()).resolves.toEqual({
      name: 'Göteborg',
      region: 'Sweden',
      countryCode: 'SE',
      latitude: 57.7089,
      longitude: 11.9746,
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('https://api.bigdatacloud.net/data/reverse-geocode-client?');
    expect(url).toContain('latitude=57.7089');
    expect(url).toContain('longitude=11.9746');
  });

  it('falls back to the locality, then to a generic name', async () => {
    stubGeolocationAt(59.33, 18.06);
    stubJsonFetch({ city: '', locality: 'Uppsala', countryCode: 'SE' });
    await expect(locateMe()).resolves.toMatchObject({ name: 'Uppsala', region: '' });

    vi.unstubAllGlobals();
    stubJsonFetch({ countryName: 'Sweden' });
    await expect(locateMe()).resolves.toMatchObject({
      name: 'Your location',
      region: 'Sweden',
      countryCode: '',
    });
  });

  it('rejects with denied when the user blocks the prompt', async () => {
    stubGeolocationDenied();
    const fetchMock = stubJsonFetch({ city: 'Göteborg' });
    await expect(locateMe()).rejects.toThrow('denied');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects when the reverse geocoder is unreachable', async () => {
    stubGeolocationAt(43.85, 18.38);
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));
    await expect(locateMe()).rejects.toThrow('offline');
  });

  it('wraps a non-Error failure in a reverse geocoding failed Error', async () => {
    stubGeolocationAt(43.85, 18.38);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(() => Promise.reject('socket hang up'))
    );
    await expect(locateMe()).rejects.toThrow('reverse geocoding failed');
  });

  it('rejects rather than resolving a placeholder when the body is not JSON', async () => {
    // locateMe never checks res.ok, so a 503 only surfaces via the JSON parse.
    stubGeolocationAt(43.85, 18.38);
    stubFetch('<html>rate limited</html>', 503);
    await expect(locateMe()).rejects.toThrow(SyntaxError);
  });

  it('rejects as unsupported when the browser has no geolocation', async () => {
    Reflect.deleteProperty(navigator, 'geolocation');
    await expect(locateMe()).rejects.toThrow('unsupported');
  });
});
