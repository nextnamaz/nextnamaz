import { describe, expect, it } from 'vitest';
import {
  asDisplayConfig,
  asPrayerTimes,
  asRecord,
  asStringRecord,
  type DisplayConfig,
  type Json,
  type PrayerTimesMap,
  type SlideItem,
} from '@/types/database';

const DEFAULT_TIMES: PrayerTimesMap = {
  fajr: '05:00',
  sunrise: '06:30',
  dhuhr: '13:00',
  asr: '16:30',
  maghrib: '19:00',
  isha: '20:30',
};

const DEFAULT_CONFIG: DisplayConfig = {
  rotation: 0,
  zoom: 1,
  blackout: { enabled: false, minutes: 15 },
  announcements: { enabled: false, layout: 'full', intervalMin: 10, showSeconds: 12, items: [] },
};

/** Everything a jsonb column can hold that is not a plain object. */
const NOT_AN_OBJECT: Json[] = [null, 'display_config', 42, 0, true, false, [], ['05:00']];

/** The shape the phone actually saves once a mosque has set a screen up. */
const SAVED: Json = {
  rotation: 90,
  zoom: 0.92,
  blackout: { enabled: true, minutes: 20 },
  announcements: {
    enabled: true,
    layout: 'split',
    intervalMin: 30,
    showSeconds: 8,
    items: [
      { path: 'screen/eid.png', url: 'https://cdn.example/eid.png', kind: 'image' },
      { path: 'screen/khutbah.mp4', url: 'https://cdn.example/khutbah.mp4', kind: 'video' },
    ],
  },
};

const announcementsOf = (patch: Record<string, Json>): DisplayConfig['announcements'] =>
  asDisplayConfig({ announcements: patch }).announcements;

const slidesOf = (items: Json): SlideItem[] => announcementsOf({ items }).items;

describe('asPrayerTimes', () => {
  it('keeps every stored time and drops keys that are not one of the six prayers', () => {
    const stored: Json = {
      fajr: '03:26',
      sunrise: '04:55',
      dhuhr: '13:24',
      asr: '17:43',
      maghrib: '21:42',
      isha: '23:50',
      jumuah: '13:30',
    };
    expect(asPrayerTimes(stored)).toEqual({
      fajr: '03:26',
      sunrise: '04:55',
      dhuhr: '13:24',
      asr: '17:43',
      maghrib: '21:42',
      isha: '23:50',
    });
  });

  it('fills in a default for each missing prayer', () => {
    expect(asPrayerTimes({ dhuhr: '13:24' })).toEqual({ ...DEFAULT_TIMES, dhuhr: '13:24' });
    expect(asPrayerTimes({})).toEqual(DEFAULT_TIMES);
  });

  it('falls back to the defaults for a scalar or array json value', () => {
    expect(asPrayerTimes('05:00')).toEqual(DEFAULT_TIMES);
    expect(asPrayerTimes(42)).toEqual(DEFAULT_TIMES);
    expect(asPrayerTimes(true)).toEqual(DEFAULT_TIMES);
    expect(asPrayerTimes(['05:00'])).toEqual(DEFAULT_TIMES);
  });

  it('falls back to the defaults for the json value null', () => {
    // `prayer_times jsonb not null` still accepts `'null'::jsonb`, and both
    // callers hand the raw column straight in (prayer-times.ts:15 on the TV
    // path, settings-shared.tsx:33 on the phone), so this must not throw.
    expect(asPrayerTimes(null)).toEqual(DEFAULT_TIMES);
  });

  it('never hands the display a time that is not a string', () => {
    // minutesOf() calls time.trim(), so a number here crashes the TV render.
    expect(
      asPrayerTimes({
        fajr: 5,
        sunrise: true,
        dhuhr: null,
        asr: { at: '16:30' },
        maghrib: ['19:00'],
        isha: '20:31',
      })
    ).toEqual({ ...DEFAULT_TIMES, isha: '20:31' });
  });
});

describe('asStringRecord', () => {
  it('keeps the string entries and drops every other value', () => {
    const stored: Json = {
      fajr: 'Sabah',
      dhuhr: '',
      count: 3,
      enabled: true,
      missing: null,
      nested: { label: 'x' },
      list: ['a'],
    };
    expect(asStringRecord(stored)).toEqual({ fajr: 'Sabah', dhuhr: '' });
  });

  it('returns an empty record for json that is not an object', () => {
    for (const value of NOT_AN_OBJECT) {
      expect(asStringRecord(value)).toEqual({});
    }
  });
});

describe('asRecord', () => {
  it('passes an object through with its values untouched', () => {
    const stored: Json = { method: 3, tune: null, city: 'Sarajevo', flags: ['a'] };
    expect(asRecord(stored)).toEqual(stored);
  });

  it('returns an empty record for json that is not an object', () => {
    for (const value of NOT_AN_OBJECT) {
      expect(asRecord(value)).toEqual({});
    }
  });
});

describe('asDisplayConfig', () => {
  it('returns the full default shape for an empty config', () => {
    expect(asDisplayConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it('returns the same defaults for json that is not an object', () => {
    for (const value of NOT_AN_OBJECT) {
      expect(asDisplayConfig(value)).toEqual(DEFAULT_CONFIG);
    }
  });

  it('reads back a realistic saved config unchanged', () => {
    expect(asDisplayConfig(SAVED)).toEqual({
      rotation: 90,
      zoom: 0.92,
      blackout: { enabled: true, minutes: 20 },
      announcements: {
        enabled: true,
        layout: 'split',
        intervalMin: 30,
        showSeconds: 8,
        items: [
          { path: 'screen/eid.png', url: 'https://cdn.example/eid.png', kind: 'image' },
          { path: 'screen/khutbah.mp4', url: 'https://cdn.example/khutbah.mp4', kind: 'video' },
        ],
      },
    });
  });

  it('rebuilds the shape so stray stored keys never reach the TV', () => {
    const legacy: Json = { ...(SAVED as Record<string, Json>), fit: 'cover', overscan: 4 };
    expect(Object.keys(asDisplayConfig(legacy))).toEqual([
      'rotation',
      'zoom',
      'blackout',
      'announcements',
    ]);
  });

  it('keeps the four quarter-turn rotations', () => {
    expect(asDisplayConfig({ rotation: 0 }).rotation).toBe(0);
    expect(asDisplayConfig({ rotation: 90 }).rotation).toBe(90);
    expect(asDisplayConfig({ rotation: 180 }).rotation).toBe(180);
    expect(asDisplayConfig({ rotation: 270 }).rotation).toBe(270);
  });

  it('falls back to 0 for any other rotation', () => {
    expect(asDisplayConfig({ rotation: 45 }).rotation).toBe(0);
    expect(asDisplayConfig({ rotation: 360 }).rotation).toBe(0);
    expect(asDisplayConfig({ rotation: -90 }).rotation).toBe(0);
    expect(asDisplayConfig({ rotation: '90' }).rotation).toBe(0);
    expect(asDisplayConfig({ rotation: null }).rotation).toBe(0);
  });

  it('keeps a zoom inside the 0.8..1 overscan range, bounds included', () => {
    expect(asDisplayConfig({ zoom: 0.8 }).zoom).toBe(0.8);
    expect(asDisplayConfig({ zoom: 0.93 }).zoom).toBe(0.93);
    expect(asDisplayConfig({ zoom: 1 }).zoom).toBe(1);
  });

  it('falls back to a zoom of 1 for anything outside the range or not a number', () => {
    expect(asDisplayConfig({ zoom: 0.79 }).zoom).toBe(1);
    expect(asDisplayConfig({ zoom: 0.5 }).zoom).toBe(1);
    expect(asDisplayConfig({ zoom: 1.5 }).zoom).toBe(1);
    expect(asDisplayConfig({ zoom: Number.NaN }).zoom).toBe(1);
    expect(asDisplayConfig({ zoom: '0.9' }).zoom).toBe(1);
    expect(asDisplayConfig({ zoom: null }).zoom).toBe(1);
  });

  it('enables blackout only for a literal true', () => {
    expect(asDisplayConfig({ blackout: { enabled: true } }).blackout.enabled).toBe(true);
    expect(asDisplayConfig({ blackout: { enabled: 'true' } }).blackout.enabled).toBe(false);
    expect(asDisplayConfig({ blackout: { enabled: 1 } }).blackout.enabled).toBe(false);
    expect(asDisplayConfig({ blackout: { enabled: null } }).blackout.enabled).toBe(false);
    expect(asDisplayConfig({ blackout: {} }).blackout.enabled).toBe(false);
  });

  it('keeps a blackout window of 1..60 minutes and otherwise uses 15', () => {
    expect(asDisplayConfig({ blackout: { minutes: 1 } }).blackout.minutes).toBe(1);
    expect(asDisplayConfig({ blackout: { minutes: 60 } }).blackout.minutes).toBe(60);
    expect(asDisplayConfig({ blackout: { minutes: 0 } }).blackout.minutes).toBe(15);
    // Out of range falls back to the default rather than being pinned to 60.
    expect(asDisplayConfig({ blackout: { minutes: 90 } }).blackout.minutes).toBe(15);
    expect(asDisplayConfig({ blackout: { minutes: -5 } }).blackout.minutes).toBe(15);
    expect(asDisplayConfig({ blackout: { minutes: '20' } }).blackout.minutes).toBe(15);
  });

  it('defaults the blackout branch when it is missing or not an object', () => {
    expect(asDisplayConfig({}).blackout).toEqual({ enabled: false, minutes: 15 });
    for (const blackout of [null, 'on', true, false, [15]] as Json[]) {
      expect(asDisplayConfig({ blackout }).blackout).toEqual({ enabled: false, minutes: 15 });
    }
  });

  it('enables announcements only for a literal true', () => {
    expect(announcementsOf({ enabled: true }).enabled).toBe(true);
    expect(announcementsOf({ enabled: 'true' }).enabled).toBe(false);
    expect(announcementsOf({ enabled: 1 }).enabled).toBe(false);
    expect(announcementsOf({ enabled: null }).enabled).toBe(false);
    expect(announcementsOf({}).enabled).toBe(false);
  });

  it('accepts only split as an alternative announcement layout', () => {
    expect(announcementsOf({ layout: 'split' }).layout).toBe('split');
    expect(announcementsOf({ layout: 'full' }).layout).toBe('full');
    expect(announcementsOf({ layout: 'Split' }).layout).toBe('full');
    expect(announcementsOf({ layout: 'grid' }).layout).toBe('full');
    expect(announcementsOf({ layout: null }).layout).toBe('full');
  });

  it('keeps a slideshow interval of 1..120 minutes and otherwise uses 10', () => {
    expect(announcementsOf({ intervalMin: 1 }).intervalMin).toBe(1);
    expect(announcementsOf({ intervalMin: 120 }).intervalMin).toBe(120);
    expect(announcementsOf({ intervalMin: 0 }).intervalMin).toBe(10);
    expect(announcementsOf({ intervalMin: 121 }).intervalMin).toBe(10);
    expect(announcementsOf({ intervalMin: '30' }).intervalMin).toBe(10);
  });

  it('keeps a per-slide duration of 3..60 seconds and otherwise uses 12', () => {
    expect(announcementsOf({ showSeconds: 3 }).showSeconds).toBe(3);
    expect(announcementsOf({ showSeconds: 60 }).showSeconds).toBe(60);
    expect(announcementsOf({ showSeconds: 2 }).showSeconds).toBe(12);
    expect(announcementsOf({ showSeconds: 61 }).showSeconds).toBe(12);
    expect(announcementsOf({ showSeconds: Number.NaN }).showSeconds).toBe(12);
  });

  it('defaults the whole announcements branch when it is missing or not an object', () => {
    for (const announcements of [null, 'full', false, [], [{ layout: 'split' }]] as Json[]) {
      expect(asDisplayConfig({ announcements }).announcements).toEqual(
        DEFAULT_CONFIG.announcements
      );
    }
    expect(asDisplayConfig({}).announcements).toEqual(DEFAULT_CONFIG.announcements);
  });

  it('ignores announcement fields stored at the top level instead of nested', () => {
    const flat: Json = {
      items: [{ path: 'a.png', url: 'https://cdn.example/a.png' }],
      layout: 'split',
      enabled: true,
      intervalMin: 30,
    };
    expect(asDisplayConfig(flat).announcements).toEqual(DEFAULT_CONFIG.announcements);
  });

  it('treats a non-array items value as no slides at all', () => {
    expect(slidesOf(null)).toEqual([]);
    expect(slidesOf('a.png')).toEqual([]);
    expect(slidesOf(3)).toEqual([]);
    expect(slidesOf({ 0: { path: 'a.png', url: 'https://cdn.example/a.png' } })).toEqual([]);
    expect(announcementsOf({}).items).toEqual([]);
  });

  it('drops any slide whose path or url is not a string', () => {
    const hostile: Json = [
      null,
      'a.png',
      7,
      [],
      { path: 'a.png' },
      { url: 'https://cdn.example/a.png' },
      { path: 5, url: 'https://cdn.example/b.png' },
      { path: 'c.png', url: null },
      { path: 'keep.png', url: 'https://cdn.example/keep.png' },
    ];
    expect(slidesOf(hostile)).toEqual([
      { path: 'keep.png', url: 'https://cdn.example/keep.png', kind: 'image' },
    ]);
  });

  it('treats every kind except the exact string video as an image', () => {
    const kinds: Json = [
      { path: '1', url: 'u1', kind: 'video' },
      { path: '2', url: 'u2', kind: 'image' },
      { path: '3', url: 'u3', kind: 'VIDEO' },
      { path: '4', url: 'u4', kind: 'mp4' },
      { path: '5', url: 'u5', kind: null },
      { path: '6', url: 'u6' },
    ];
    expect(slidesOf(kinds).map((item) => item.kind)).toEqual([
      'video',
      'image',
      'image',
      'image',
      'image',
      'image',
    ]);
  });

  it('caps the slideshow at 12 usable slides, counted after the junk is dropped', () => {
    // Leading junk must not eat cap slots: capping before filtering would
    // leave 9 slides here instead of 12.
    const many: Json = [
      null,
      'screen/oops.png',
      { path: 'screen/no-url.png' },
      ...Array.from({ length: 14 }, (_, index) => ({
        path: `screen/${index}.png`,
        url: `https://cdn.example/${index}.png`,
      })),
    ];
    expect(slidesOf(many).map((item) => item.path)).toEqual(
      Array.from({ length: 12 }, (_, index) => `screen/${index}.png`)
    );
  });

  it('rebuilds each slide so stray stored fields never reach the TV', () => {
    const stored: Json = [
      {
        path: 'screen/eid.png',
        url: 'https://cdn.example/eid.png',
        kind: 'image',
        caption: 'Eid Mubarak',
        bytes: 20480,
      },
    ];
    expect(slidesOf(stored).map((item) => Object.keys(item))).toEqual([['path', 'url', 'kind']]);
  });
});
