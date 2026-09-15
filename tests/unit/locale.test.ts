import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flattenDisplayText, parseDisplayText } from '@/lib/locale/helpers';
import { DATE_FORMAT_OPTIONS, DEFAULT_TRANSLATIONS, LANGUAGES } from '@/lib/locale/presets';
import {
  formatClockTime,
  formatDisplayDate,
  formatPrayerTime,
  formatTodayDate,
  isRtlLocale,
  resolveDisplayLocale,
  resolveTimezone,
  type DisplayLocale,
} from '@/lib/display-locale';
import type { DateFormatOption, UILabelTranslations } from '@/types/locale';
import { PRAYER_NAMES } from '@/types/prayer';

/** Spelled out rather than derived from a preset, so a new label key must be listed here too. */
const LABEL_KEYS = Object.keys({
  prayer: true, iqamah: true, begins: true, next: true, now: true,
  until: true, remaining: true, elapsed: true, today: true, jumuah: true, adhan: true,
} satisfies Record<keyof UILabelTranslations, true>) as (keyof UILabelTranslations)[];

/**
 * Every DateFormatOption and how it must render FIXED. Typed as a total Record, so adding a
 * format option to the union fails the build until it gets an expected rendering here.
 */
const DATE_RENDERINGS: Record<DateFormatOption, string> = {
  'DD/MM/YYYY': '25/07/2026',
  'MM/DD/YYYY': '07/25/2026',
  'YYYY-MM-DD': '2026-07-25',
  'DD MMM YYYY': '25 Jul 2026',
  'MMMM DD, YYYY': 'July 25, 2026',
  'EEEE · MMMM DD, YYYY': 'Saturday · July 25, 2026',
};

/** Saturday 25 July 2026, 14:05:09 — built from local parts so the machine timezone cannot shift it. */
const FIXED = new Date(2026, 6, 25, 14, 5, 9);

const EN = resolveDisplayLocale('en');
const AR = resolveDisplayLocale('ar');
const twelveHour = (base: DisplayLocale): DisplayLocale => ({ ...base, use24Hour: false });

describe('parseDisplayText', () => {
  it('fills every key from the locale preset when nothing is stored', () => {
    expect(parseDisplayText({}, 'tr')).toEqual(DEFAULT_TRANSLATIONS.tr);
  });

  it('merges per-key overrides over the preset and leaves the rest alone', () => {
    const parsed = parseDisplayText({ fajr: 'Sabah', iqamah: 'Cemaat' }, 'tr');
    expect(parsed.prayers.fajr).toBe('Sabah');
    expect(parsed.labels.iqamah).toBe('Cemaat');
    expect(parsed.prayers.dhuhr).toBe(DEFAULT_TRANSLATIONS.tr.prayers.dhuhr);
    expect(parsed.labels.prayer).toBe(DEFAULT_TRANSLATIONS.tr.labels.prayer);
  });

  it('drops keys it does not know about and keeps every key it does', () => {
    const parsed = parseDisplayText({ fajr: 'Dawn', tahajjud: 'Tahajjud', theme: 'mihrab' }, 'en');
    // The exact key set matters both ways: junk must not survive, known keys must not be lost.
    expect(Object.keys(flattenDisplayText(parsed)).sort()).toEqual(
      [...PRAYER_NAMES, ...LABEL_KEYS].sort(),
    );
    expect(parsed.prayers.fajr).toBe('Dawn');
  });

  it('keeps an explicitly blank override instead of re-filling it from the preset', () => {
    // `??` only falls back on null/undefined, so a field the imam cleared stays cleared.
    expect(parseDisplayText({ fajr: '' }, 'en').prayers.fajr).toBe('');
  });

  it('falls back to English for an unknown locale code', () => {
    expect(parseDisplayText({}, 'klingon')).toEqual(DEFAULT_TRANSLATIONS.en);
    expect(parseDisplayText({}, '')).toEqual(DEFAULT_TRANSLATIONS.en);
    expect(parseDisplayText({}, 'EN')).toEqual(DEFAULT_TRANSLATIONS.en);
  });

  it('falls back to English for a locale code that only exists on Object.prototype', () => {
    // `locale in DEFAULT_TRANSLATIONS` walks the prototype chain, so these pass the guard.
    expect(parseDisplayText({}, 'constructor')).toEqual(DEFAULT_TRANSLATIONS.en);
    expect(parseDisplayText({}, '__proto__')).toEqual(DEFAULT_TRANSLATIONS.en);
  });

  it('is not polluted by a hostile __proto__ key in the stored JSON', () => {
    const hostile = JSON.parse('{"__proto__": {"fajr": "hacked"}}') as Record<string, string>;
    expect(parseDisplayText(hostile, 'en').prayers.fajr).toBe('Fajr');
  });
});

describe('flattenDisplayText', () => {
  it('emits one flat key per prayer and per label, with no collisions', () => {
    const flat = flattenDisplayText(DEFAULT_TRANSLATIONS.en);
    // A prayer name colliding with a label name would silently shrink this set.
    expect(Object.keys(flat).sort()).toEqual([...PRAYER_NAMES, ...LABEL_KEYS].sort());
    expect(flat.fajr).toBe('Fajr');
    expect(flat.iqamah).toBe('Iqamah');
  });

  it('round-trips through parseDisplayText for every supported locale', () => {
    for (const { code } of LANGUAGES) {
      const preset = DEFAULT_TRANSLATIONS[code];
      expect(parseDisplayText(flattenDisplayText(preset), code), code).toEqual(preset);
    }
  });

  it('round-trips a config in which every single key is customised', () => {
    const raw = Object.fromEntries(
      [...PRAYER_NAMES, ...LABEL_KEYS].map((k, i) => [k, `custom-${i}`]),
    );
    const custom = parseDisplayText(raw, 'en');
    expect(flattenDisplayText(custom)).toEqual(raw);
    expect(parseDisplayText(flattenDisplayText(custom), 'en')).toEqual(custom);
  });
});

describe('LANGUAGES and DEFAULT_TRANSLATIONS', () => {
  it('lists exactly the locales that have translations', () => {
    const codes = LANGUAGES.map((l) => l.code).sort();
    expect(codes).toEqual(Object.keys(DEFAULT_TRANSLATIONS).sort());
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('gives every language all six prayer names and every label', () => {
    for (const { code } of LANGUAGES) {
      const preset = DEFAULT_TRANSLATIONS[code];
      for (const prayer of PRAYER_NAMES) {
        expect(preset.prayers[prayer].trim(), `${code}.prayers.${prayer}`).not.toBe('');
      }
      for (const label of LABEL_KEYS) {
        expect(preset.labels[label].trim(), `${code}.labels.${label}`).not.toBe('');
      }
    }
  });

  it('describes every language with a name, a native name and a flag', () => {
    for (const lang of LANGUAGES) {
      expect(lang.name.trim(), lang.code).not.toBe('');
      expect(lang.nativeName.trim(), lang.code).not.toBe('');
      expect(lang.flag.trim(), lang.code).not.toBe('');
    }
  });

  it('offers exactly one date-fns pattern per DateFormatOption', () => {
    const values = DATE_FORMAT_OPTIONS.map((o) => o.value);
    // A format in the union but missing from the list makes formatDisplayDate silently
    // degrade to the en-GB numeric fallback, so the sets must match exactly.
    expect([...values].sort()).toEqual(Object.keys(DATE_RENDERINGS).sort());
    expect(new Set(values).size).toBe(values.length);
    for (const option of DATE_FORMAT_OPTIONS) {
      expect(option.dateFnsFormat.trim(), option.value).not.toBe('');
      expect(option.label.trim(), option.value).not.toBe('');
    }
  });
});

describe('resolveDisplayLocale', () => {
  it('resolves a supported locale to its preset vocabulary', () => {
    expect(AR.locale).toBe('ar');
    expect(AR.prayerNames.fajr).toBe('الفجر');
    expect(AR.labels.jumuah).toBe('الجمعة');
  });

  it('applies per-screen overrides on top of the preset', () => {
    const resolved = resolveDisplayLocale('bs', { fajr: 'Sabah namaz', until: 'do' });
    expect(resolved.prayerNames.fajr).toBe('Sabah namaz');
    expect(resolved.labels.until).toBe('do');
    expect(resolved.labels.iqamah).toBe(DEFAULT_TRANSLATIONS.bs.labels.iqamah);
  });

  it('falls back to English for an unknown locale code', () => {
    const resolved = resolveDisplayLocale('sv-SE');
    expect(resolved.locale).toBe('en');
    expect(resolved.prayerNames).toEqual(DEFAULT_TRANSLATIONS.en.prayers);
  });

  it('falls back to English for a locale code that only exists on Object.prototype', () => {
    expect(resolveDisplayLocale('constructor').locale).toBe('en');
    expect(resolveDisplayLocale('__proto__').prayerNames.fajr).toBe('Fajr');
  });

  it('hard-codes the clock and date defaults, identically for every locale', () => {
    // No clock/date/timezone settings are plumbed into the resolver yet, so these are the same
    // for every screen. Locking that down means wiring them up has to update this test.
    for (const { code } of LANGUAGES) {
      const resolved = resolveDisplayLocale(code);
      expect(resolved.use24Hour, code).toBe(true);
      expect(resolved.showSeconds, code).toBe(true);
      expect(resolved.dateFormat, code).toBe('DD/MM/YYYY');
      expect(resolved.timezone, code).toBe('auto');
    }
  });
});

describe('isRtlLocale', () => {
  it('is true for Arabic and Urdu only', () => {
    expect(isRtlLocale(AR)).toBe(true);
    expect(isRtlLocale(resolveDisplayLocale('ur'))).toBe(true);
    expect(isRtlLocale(EN)).toBe(false);
    expect(isRtlLocale(resolveDisplayLocale('sv'))).toBe(false);
    expect(isRtlLocale(resolveDisplayLocale('tr'))).toBe(false);
  });

  it('agrees with the rtl flag on every language option', () => {
    for (const lang of LANGUAGES) {
      expect(isRtlLocale(resolveDisplayLocale(lang.code)), lang.code).toBe(lang.rtl);
    }
  });

  it('treats an unresolvable locale as LTR', () => {
    expect(isRtlLocale(resolveDisplayLocale('klingon'))).toBe(false);
  });
});

describe('formatPrayerTime', () => {
  it('passes 24-hour times straight through', () => {
    expect(formatPrayerTime('03:26', EN)).toBe('03:26');
    expect(formatPrayerTime('23:50', EN)).toBe('23:50');
    // No parsing happens in 24h mode, so even nonsense survives untouched.
    expect(formatPrayerTime('not a time', EN)).toBe('not a time');
    expect(formatPrayerTime('', EN)).toBe('');
  });

  it('converts to 12-hour form around midnight and noon', () => {
    const l = twelveHour(EN);
    expect(formatPrayerTime('00:15', l)).toBe('12:15 AM');
    expect(formatPrayerTime('11:59', l)).toBe('11:59 AM');
    expect(formatPrayerTime('12:00', l)).toBe('12:00 PM');
    expect(formatPrayerTime('13:24', l)).toBe('1:24 PM');
    expect(formatPrayerTime('23:59', l)).toBe('11:59 PM');
  });

  it('tolerates trailing seconds in 12-hour form', () => {
    expect(formatPrayerTime('09:05:30', twelveHour(EN))).toBe('9:05 AM');
  });

  it('does not crash the display on a malformed time in 12-hour form', () => {
    expect(() => formatPrayerTime('', twelveHour(EN))).not.toThrow();
    expect(() => formatPrayerTime('19', twelveHour(EN))).not.toThrow();
  });
});

describe('formatClockTime', () => {
  it('renders 24-hour time with seconds by default', () => {
    expect(formatClockTime(FIXED, EN)).toBe('14:05:09');
    expect(formatClockTime(new Date(2026, 6, 25, 0, 0, 0), EN)).toBe('00:00:00');
  });

  it('drops the seconds when the screen asks for it', () => {
    expect(formatClockTime(FIXED, { ...EN, showSeconds: false })).toBe('14:05');
  });

  it('renders 12-hour time with a meridiem', () => {
    // ICU separates the meridiem with a narrow no-break space on newer Node builds.
    expect(formatClockTime(FIXED, twelveHour(EN))).toMatch(/^02:05:09\sPM$/);
    expect(formatClockTime(new Date(2026, 6, 25, 0, 0, 0), twelveHour(EN))).toMatch(/^12:00:00\sAM$/);
  });

  it('keeps Latin digits for an RTL locale, so the clock stays legible', () => {
    expect(formatClockTime(FIXED, AR)).toBe('14:05:09');
  });

  it('honours an explicit timezone instead of the device one', () => {
    const instant = new Date(Date.UTC(2026, 6, 25, 14, 5, 9));
    expect(formatClockTime(instant, { ...EN, timezone: 'UTC' })).toBe('14:05:09');
    expect(formatClockTime(instant, { ...EN, timezone: 'Asia/Karachi' })).toBe('19:05:09');
  });
});

describe('formatDisplayDate', () => {
  const cases = Object.entries(DATE_RENDERINGS) as [DateFormatOption, string][];

  it.each(cases)('renders %s as %s', (dateFormat, expected) => {
    expect(formatDisplayDate(FIXED, { ...EN, dateFormat })).toBe(expected);
  });

  it('localises month and weekday names to the screen locale', () => {
    const sv = { ...resolveDisplayLocale('sv'), dateFormat: 'DD MMM YYYY' as DateFormatOption };
    expect(formatDisplayDate(FIXED, sv)).toBe('25 juli 2026');
    expect(formatDisplayDate(FIXED, { ...AR, dateFormat: 'DD MMM YYYY' })).toBe('25 يوليو 2026');
  });

  it('has a date-fns locale wired up for every language, so months are never left in English', () => {
    for (const { code } of LANGUAGES) {
      const resolved = { ...resolveDisplayLocale(code), dateFormat: 'MMMM DD, YYYY' as const };
      const out = formatDisplayDate(FIXED, resolved);
      expect(out, code).toContain('2026');
      // 'ur' has no date-fns locale and deliberately borrows English month names.
      if (code === 'en' || code === 'ur') expect(out, code).toBe('July 25, 2026');
      else expect(out, code).not.toBe('July 25, 2026');
    }
  });

  it('falls back to en-GB for a date format that is not on the list', () => {
    const broken = { ...EN, dateFormat: 'YYYY年MM月' as DateFormatOption };
    expect(formatDisplayDate(FIXED, broken)).toBe('25/07/2026');
  });

  it('degrades to a plain "Invalid Date" string rather than throwing on an invalid Date', () => {
    // date-fns format() throws RangeError here; the try/catch must swallow it.
    expect(formatDisplayDate(new Date(NaN), EN)).toBe('Invalid Date');
  });
});

describe('formatTodayDate', () => {
  // This helper exists because toLocaleDateString emitted artefacts like "M07 25, Sat".
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('spells out the weekday and month in English', () => {
    expect(formatTodayDate('en')).toBe('Saturday, 25 July');
  });

  it('spells out the month with the day number and no "M07" artefact for every language', () => {
    for (const { code } of LANGUAGES) {
      const out = formatTodayDate(code);
      expect(out, code).toContain('25');
      expect(out, code).not.toMatch(/M\d/);
      expect(out, code).not.toContain('Invalid');
      // Words, not '25/07/2026': the catch-branch numeric fallback has no letters in it, so
      // this catches a language whose date-fns locale is missing or broken.
      expect(out, code).toMatch(/\p{L}{3,}/u);
      expect(out, code).not.toMatch(/\d{4}/);
    }
  });

  it('translates the weekday, not just the month', () => {
    expect(formatTodayDate('sv')).toBe('lördag, 25 juli');
    expect(formatTodayDate('tr')).toBe('Cumartesi, 25 Temmuz');
    expect(formatTodayDate('ar')).toContain('السبت');
  });

  it('uses English names for Urdu, which has no date-fns locale', () => {
    expect(formatTodayDate('ur')).toBe('Saturday, 25 July');
  });

  it('falls back to English for an unknown locale code', () => {
    expect(formatTodayDate('klingon')).toBe('Saturday, 25 July');
  });

  it('drops to a numeric date for a locale code inherited from Object.prototype', () => {
    // `DATE_FNS_LOCALES[locale] ?? enGB` also walks the prototype chain, so these resolve to a
    // non-nullish non-locale (Object / Object.prototype); format() then throws and the catch
    // branch answers with an unlocalised '25/07/2026' instead of the English long form.
    expect(formatTodayDate('constructor')).toBe('25/07/2026');
    expect(formatTodayDate('__proto__')).toBe('25/07/2026');
  });
});

describe('resolveTimezone', () => {
  it('resolves "auto" to a concrete, usable device timezone', () => {
    const resolved = resolveTimezone(EN);
    expect(resolved).not.toBe('auto');
    // Callers feed this straight to Intl, so it has to be a zone Intl accepts.
    expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: resolved })).not.toThrow();
    expect(resolved).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('returns an explicit timezone untouched', () => {
    expect(resolveTimezone({ ...EN, timezone: 'Europe/Sarajevo' })).toBe('Europe/Sarajevo');
  });
});
