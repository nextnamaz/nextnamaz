import { describe, expect, it } from 'vitest';
import { parseSourceConfig, screenSettingsSchema } from '@/lib/screen-settings';
import type { ScreenSettingsInput } from '@/lib/screen-settings';
import { LANGUAGES } from '@/lib/locale/presets';
import type { AdhanSourceConfig } from '@/types/prayer-config';

/** Field patches are deliberately untyped so hostile values can reach the schema. */
type Patch = Record<string, unknown>;

type Slide = ScreenSettingsInput['display_config']['announcements']['items'][number];

const SLIDE: Slide = {
  path: 'screens/abc/poster.png',
  url: 'https://cdn.example.com/poster.png',
  kind: 'image',
};

const VALID: ScreenSettingsInput = {
  prayer_times: {
    fajr: '03:26',
    sunrise: '04:55',
    dhuhr: '13:24',
    asr: '17:43',
    maghrib: '21:42',
    isha: '23:50',
  },
  locale: 'sv',
  display_text: { fajr: 'Fajr', jumuah: 'Fredagsbön' },
  prayer_source: 'islamiska_forbundet',
  prayer_source_config: { city: 'Göteborg' },
  theme: 'default',
  theme_config: { accent: '#0f766e', patternScale: 1.4, showQr: true },
  display_config: {
    rotation: 0,
    zoom: 1,
    blackout: { enabled: true, minutes: 15 },
    controlQr: { enabled: true },
    announcements: {
      enabled: true,
      layout: 'split',
      intervalMin: 10,
      showSeconds: 8,
      items: [SLIDE],
    },
  },
};

const ok = (patch: Patch = {}) => screenSettingsSchema.safeParse({ ...VALID, ...patch }).success;
const withTimes = (patch: Patch) => ok({ prayer_times: { ...VALID.prayer_times, ...patch } });
const withDisplay = (patch: Patch) => ok({ display_config: { ...VALID.display_config, ...patch } });
const withAnnouncements = (patch: Patch) =>
  withDisplay({ announcements: { ...VALID.display_config.announcements, ...patch } });
const withItems = (items: unknown[]) => withAnnouncements({ items });

/** Parses the payload with one key deleted, to prove the key is required. */
const without = (key: string) => {
  const rest: Patch = { ...VALID };
  delete rest[key];
  return screenSettingsSchema.safeParse(rest).success;
};
const displayWithout = (key: string) => {
  const rest: Patch = { ...VALID.display_config };
  delete rest[key];
  return ok({ display_config: rest });
};

const ADHAN: AdhanSourceConfig = {
  latitude: 57.7089,
  longitude: 11.9746,
  method: 'MuslimWorldLeague',
  madhab: 'hanafi',
  timezone: 'Europe/Stockholm',
  locationName: 'Göteborg',
};
const adhanWith = (patch: Patch) => parseSourceConfig('adhan', { ...ADHAN, ...patch });

describe('screenSettingsSchema', () => {
  it('accepts a complete settings payload', () => {
    const parsed = screenSettingsSchema.safeParse(VALID);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual(VALID);
  });

  it('drops top-level keys it does not know about', () => {
    const parsed = screenSettingsSchema.safeParse({ ...VALID, id: 'abc', is_admin: true });
    expect(parsed.success).toBe(true);
    expect(parsed.success && Object.keys(parsed.data).sort()).toEqual(Object.keys(VALID).sort());
  });

  it('requires every top-level key, so a partial form submission cannot save', () => {
    const keys = Object.keys(VALID);
    expect(keys).toHaveLength(8);
    for (const key of keys) {
      expect(without(key), `payload without ${key} was accepted`).toBe(false);
    }
  });

  it('requires every display_config section', () => {
    const keys = Object.keys(VALID.display_config);
    expect(keys).toHaveLength(5);
    for (const key of keys) {
      expect(displayWithout(key), `display_config without ${key} was accepted`).toBe(false);
    }
    expect(withAnnouncements({ enabled: undefined })).toBe(false);
    expect(ok({ display_config: {} })).toBe(false);
    expect(ok({ display_config: null })).toBe(false);
  });

  it('accepts all five prayer sources and nothing else', () => {
    const sources = ['manual', 'adhan', 'vaktija_ba', 'vaktija_eu', 'islamiska_forbundet'];
    for (const prayer_source of sources) {
      expect(ok({ prayer_source }), `${prayer_source} was rejected`).toBe(true);
    }
    expect(ok({ prayer_source: 'aladhan' })).toBe(false);
    expect(ok({ prayer_source: 'Manual' })).toBe(false);
    expect(ok({ prayer_source: '' })).toBe(false);
    expect(ok({ prayer_source: null })).toBe(false);
  });

  it('does not cross-check prayer_source_config against prayer_source', () => {
    // The schema only demands an object here; matching the shape to the source is
    // parseSourceConfig's job, which is why saveScreen has to call both.
    expect(ok({ prayer_source: 'adhan', prayer_source_config: {} })).toBe(true);
    expect(ok({ prayer_source: 'adhan', prayer_source_config: { city: 'Göteborg' } })).toBe(true);
    expect(parseSourceConfig('adhan', { city: 'Göteborg' })).toBeNull();
    // Non-objects still fail here.
    expect(ok({ prayer_source_config: 'Göteborg' })).toBe(false);
    expect(ok({ prayer_source_config: null })).toBe(false);
  });

  it('requires all six prayer times as zero-padded HH:MM', () => {
    expect(withTimes({ fajr: '00:00', isha: '23:59' })).toBe(true);
    // Each key carries its own regex in the source, so check every one is wired up
    // rather than trusting fajr to speak for the other five.
    for (const key of Object.keys(VALID.prayer_times)) {
      expect(withTimes({ [key]: '9:05' }), `${key} accepted '9:05'`).toBe(false);
      expect(withTimes({ [key]: '03:26:00' }), `${key} accepted seconds`).toBe(false);
      expect(withTimes({ [key]: '' }), `${key} accepted an empty string`).toBe(false);
      expect(withTimes({ [key]: 326 }), `${key} accepted a number`).toBe(false);
    }
  });

  it('rejects a prayer_times object with a missing key', () => {
    const withoutIsha: Record<string, string> = { ...VALID.prayer_times };
    delete withoutIsha.isha;
    expect(ok({ prayer_times: withoutIsha })).toBe(false);
    expect(ok({ prayer_times: {} })).toBe(false);
    expect(ok({ prayer_times: null })).toBe(false);
  });

  it('rejects clock times that are outside the 24-hour range', () => {
    // Shaped like HH:MM but not real times. minutesOf() in display-schedule returns
    // null for both, so a screen saved with them silently loses that prayer.
    expect(withTimes({ fajr: '25:00' })).toBe(false);
    expect(withTimes({ dhuhr: '12:60' })).toBe(false);
  });

  it('accepts every locale code in LANGUAGES and no other', () => {
    expect(LANGUAGES.length).toBeGreaterThan(1);
    expect(LANGUAGES.filter((l) => !ok({ locale: l.code })).map((l) => l.code)).toEqual([]);
    expect(ok({ locale: 'zz' })).toBe(false);
    expect(ok({ locale: 'EN' })).toBe(false);
    expect(ok({ locale: '' })).toBe(false);
    expect(ok({ locale: 5 })).toBe(false);
  });

  it('accepts the registered themes, plus retired ids that screens may still hold', () => {
    expect(ok({ theme: 'default' })).toBe(true);
    expect(ok({ theme: 'night' })).toBe(true);
    // Retired: still stored on screens saved before Night replaced it.
    expect(ok({ theme: 'mihrab' })).toBe(true);
    expect(ok({ theme: 'minimal' })).toBe(false);
    expect(ok({ theme: 'Night' })).toBe(false);
    expect(ok({ theme: null })).toBe(false);
  });

  it('caps display_text values at 100 characters but allows any label key', () => {
    expect(ok({ display_text: {} })).toBe(true);
    expect(ok({ display_text: { fajr: 'x'.repeat(100) } })).toBe(true);
    expect(ok({ display_text: { fajr: 'x'.repeat(101) } })).toBe(false);
    expect(ok({ display_text: { fajr: { sv: 'Fajr' } } })).toBe(false);
    expect(ok({ display_text: { fajr: 42 } })).toBe(false);
    // Keys are open on purpose: the settings tab writes prayer and label ids alike.
    expect(ok({ display_text: { some_new_label: 'Ok' } })).toBe(true);
    expect(ok({ display_text: null })).toBe(false);
  });

  it('keeps theme_config flat: strings under 500 chars, numbers or booleans', () => {
    expect(ok({ theme_config: {} })).toBe(true);
    expect(ok({ theme_config: { accent: 'x'.repeat(500) } })).toBe(true);
    expect(ok({ theme_config: { accent: 'x'.repeat(501) } })).toBe(false);
    expect(ok({ theme_config: { pattern: { kind: 'lattice' } } })).toBe(false);
    expect(ok({ theme_config: { palette: ['#fff'] } })).toBe(false);
    expect(ok({ theme_config: { accent: null } })).toBe(false);
  });

  it('allows only quarter-turn rotations', () => {
    expect([0, 90, 180, 270].map((rotation) => withDisplay({ rotation }))).not.toContain(false);
    expect(withDisplay({ rotation: 45 })).toBe(false);
    expect(withDisplay({ rotation: 360 })).toBe(false);
    expect(withDisplay({ rotation: '90' })).toBe(false);
  });

  it('bounds zoom to 0.8 - 1', () => {
    expect(withDisplay({ zoom: 0.8 })).toBe(true);
    expect(withDisplay({ zoom: 1 })).toBe(true);
    expect(withDisplay({ zoom: 0.7 })).toBe(false);
    expect(withDisplay({ zoom: 1.2 })).toBe(false);
    expect(withDisplay({ zoom: Number.NaN })).toBe(false);
  });

  it('bounds the blackout window to 1 - 60 minutes', () => {
    expect(withDisplay({ blackout: { enabled: true, minutes: 1 } })).toBe(true);
    expect(withDisplay({ blackout: { enabled: true, minutes: 60 } })).toBe(true);
    expect(withDisplay({ blackout: { enabled: true, minutes: 0 } })).toBe(false);
    expect(withDisplay({ blackout: { enabled: true, minutes: 61 } })).toBe(false);
    expect(withDisplay({ blackout: { minutes: 15 } })).toBe(false);
  });

  it('allows only the full and split announcement layouts', () => {
    expect(withAnnouncements({ layout: 'full' })).toBe(true);
    expect(withAnnouncements({ layout: 'split' })).toBe(true);
    expect(withAnnouncements({ layout: 'half' })).toBe(false);
  });

  it('bounds the announcement interval to 1 - 120 minutes and slide length to 3 - 60 seconds', () => {
    expect(withAnnouncements({ intervalMin: 1 })).toBe(true);
    expect(withAnnouncements({ intervalMin: 120 })).toBe(true);
    expect(withAnnouncements({ intervalMin: 0 })).toBe(false);
    expect(withAnnouncements({ intervalMin: 121 })).toBe(false);
    expect(withAnnouncements({ showSeconds: 3 })).toBe(true);
    expect(withAnnouncements({ showSeconds: 60 })).toBe(true);
    expect(withAnnouncements({ showSeconds: 2 })).toBe(false);
    expect(withAnnouncements({ showSeconds: 61 })).toBe(false);
  });

  it('accepts at most twelve announcement slides', () => {
    expect(withItems([])).toBe(true);
    expect(withItems(Array.from({ length: 12 }, () => SLIDE))).toBe(true);
    expect(withItems(Array.from({ length: 13 }, () => SLIDE))).toBe(false);
  });

  it('requires each slide to carry an absolute url and a known kind', () => {
    expect(withItems([{ ...SLIDE, kind: 'video' }])).toBe(true);
    expect(withItems([{ ...SLIDE, url: 'not a url' }])).toBe(false);
    // A storage path is not a url; the relative location belongs in `path`.
    expect(withItems([{ ...SLIDE, url: '/uploads/poster.png' }])).toBe(false);
    expect(withItems([{ ...SLIDE, url: `https://cdn.example.com/${'x'.repeat(600)}.png` }])).toBe(false);
    expect(withItems([{ path: SLIDE.path, url: SLIDE.url }])).toBe(false);
    expect(withItems([{ ...SLIDE, kind: 'audio' }])).toBe(false);
    expect(withItems([SLIDE, { ...SLIDE, kind: 'audio' }])).toBe(false);
    expect(withItems(['https://cdn.example.com/poster.png'])).toBe(false);
  });

  it('caps the slide storage path at 300 characters but does not police its shape', () => {
    expect(withItems([{ ...SLIDE, path: 'x'.repeat(300) }])).toBe(true);
    expect(withItems([{ ...SLIDE, path: 'x'.repeat(301) }])).toBe(false);
    expect(withItems([{ ...SLIDE, path: 42 }])).toBe(false);
    expect(withItems([{ url: SLIDE.url, kind: 'image' }])).toBe(false);
    // A traversal path passes the schema; saveScreen is the only thing that rejects
    // media outside the screen's own folder, so that check must not be removed.
    expect(withItems([{ ...SLIDE, path: '../other-screen/poster.png' }])).toBe(true);
  });

  it('accepts any url scheme, not just http(s)', () => {
    // z.string().url() in zod 4 only requires new URL() to parse, so these all pass.
    // Harmless today because tv-display only feeds the value to <Image>/<video> src,
    // which never executes a scheme; tightening to https would still be cheap.
    expect(withItems([{ ...SLIDE, url: 'javascript:alert(1)' }])).toBe(true);
    expect(withItems([{ ...SLIDE, url: 'data:text/html,<script>1</script>' }])).toBe(true);
    expect(withItems([{ ...SLIDE, url: 'file:///etc/passwd' }])).toBe(true);
    expect(withItems([{ ...SLIDE, url: 'http://cdn.example.com/poster.png' }])).toBe(true);
    expect(withItems([{ ...SLIDE, url: 'https://' }])).toBe(false);
  });
});

describe('parseSourceConfig', () => {
  it('returns an empty object for the manual source, whatever is passed with it', () => {
    expect(parseSourceConfig('manual', {})).toEqual({});
    expect(parseSourceConfig('manual', { latitude: 57.7, junk: 'x' })).toEqual({});
  });

  it('returns null instead of throwing on input that is not an object', () => {
    expect(parseSourceConfig('manual', null)).toBeNull();
    expect(parseSourceConfig('manual', undefined)).toBeNull();
    expect(parseSourceConfig('adhan', 'Göteborg')).toBeNull();
    expect(parseSourceConfig('adhan', [ADHAN])).toBeNull();
    expect(() => parseSourceConfig('vaktija_eu', Number.NaN)).not.toThrow();
    expect(parseSourceConfig('vaktija_eu', Number.NaN)).toBeNull();
  });

  it('keeps a valid adhan config and strips unknown keys from it', () => {
    expect(parseSourceConfig('adhan', ADHAN)).toEqual(ADHAN);
    expect(parseSourceConfig('adhan', { ...ADHAN, prayer_source: 'manual' })).toEqual(ADHAN);
  });

  it('bounds adhan coordinates to the real globe', () => {
    expect(adhanWith({ latitude: 90, longitude: 180 })).not.toBeNull();
    expect(adhanWith({ latitude: -90, longitude: -180 })).not.toBeNull();
    expect(adhanWith({ latitude: 90.1 })).toBeNull();
    expect(adhanWith({ latitude: -91 })).toBeNull();
    expect(adhanWith({ longitude: 180.1 })).toBeNull();
    expect(adhanWith({ longitude: -181 })).toBeNull();
  });

  it('rejects coordinates that are not finite numbers', () => {
    expect(adhanWith({ latitude: '57.7' })).toBeNull();
    expect(adhanWith({ latitude: Number.NaN })).toBeNull();
    expect(adhanWith({ latitude: Number.POSITIVE_INFINITY })).toBeNull();
    expect(adhanWith({ longitude: null })).toBeNull();
  });

  it('accepts only known calculation methods and madhabs', () => {
    expect(adhanWith({ method: 'Turkey', madhab: 'shafi' })).not.toBeNull();
    expect(adhanWith({ method: 'Diyanet' })).toBeNull();
    expect(adhanWith({ method: 'muslimworldleague' })).toBeNull();
    expect(adhanWith({ madhab: 'maliki' })).toBeNull();
    expect(adhanWith({ madhab: 'Hanafi' })).toBeNull();
  });

  it('caps the adhan timezone and location strings', () => {
    expect(adhanWith({ timezone: 'x'.repeat(64) })).not.toBeNull();
    expect(adhanWith({ timezone: 'x'.repeat(65) })).toBeNull();
    expect(adhanWith({ locationName: 'x'.repeat(101) })).toBeNull();
  });

  it('bounds the vaktija_ba location id to whole numbers 0 - 1000', () => {
    expect(parseSourceConfig('vaktija_ba', { locationId: 0, locationName: 'Sarajevo' })).toEqual({
      locationId: 0,
      locationName: 'Sarajevo',
    });
    expect(parseSourceConfig('vaktija_ba', { locationId: 1000, locationName: 'S' })).not.toBeNull();
    expect(parseSourceConfig('vaktija_ba', { locationId: 1001, locationName: 'S' })).toBeNull();
    expect(parseSourceConfig('vaktija_ba', { locationId: -1, locationName: 'S' })).toBeNull();
    expect(parseSourceConfig('vaktija_ba', { locationId: 1.5, locationName: 'S' })).toBeNull();
    expect(parseSourceConfig('vaktija_ba', { locationId: '77', locationName: 'S' })).toBeNull();
    expect(parseSourceConfig('vaktija_ba', { locationName: 'S' })).toBeNull();
  });

  it('accepts a vaktija_eu slug only in lowercase-hyphen form', () => {
    const eu = { countryCode: 'se', locationSlug: 'goteborg', locationName: 'Göteborg' };
    expect(parseSourceConfig('vaktija_eu', eu)).toEqual(eu);
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 'stockholm-city-2' })).not.toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 'Bad Slug!' })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 'Göteborg' })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: '../../etc/passwd' })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: '' })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 'göteborg' })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 'x'.repeat(101) })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, locationSlug: 42 })).toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, countryCode: 'swe' })).toBeNull();
    // countryCode is only length-capped, so these get through to the fetch URL.
    expect(parseSourceConfig('vaktija_eu', { ...eu, countryCode: '' })).not.toBeNull();
    expect(parseSourceConfig('vaktija_eu', { ...eu, countryCode: 'SE' })).not.toBeNull();
  });

  it('limits an islamiska_forbundet city to accented letters, space, dot, hyphen and apostrophe', () => {
    const city = (value: unknown) => parseSourceConfig('islamiska_forbundet', { city: value });
    expect(city('Göteborg')).toEqual({ city: 'Göteborg' });
    expect(city('Malmö')).toEqual({ city: 'Malmö' });
    expect(city("Vaxholm-Ekerö 'St")).not.toBeNull();
    expect(city('a'.repeat(60))).not.toBeNull();
    expect(city('Robert); DROP TABLE')).toBeNull();
    expect(city('<script>x</script>')).toBeNull();
    expect(city('Malmo2')).toBeNull();
    expect(city('')).toBeNull();
    expect(city('a'.repeat(61))).toBeNull();
    expect(city(null)).toBeNull();
    expect(city(undefined)).toBeNull();
    // The apostrophe and hyphen are allowed for real place names, so this is not a
    // quoting defence. The value goes into a POST form field, never into SQL.
    expect(city("Robert'--")).not.toBeNull();
  });
});
