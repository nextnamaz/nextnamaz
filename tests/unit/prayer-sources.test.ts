import { CalculationMethod } from 'adhan';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateAdhanTimes, CALCULATION_METHODS } from '@/lib/prayer-sources/adhan';
import { fetchAlAdhan, ALADHAN_METHODS } from '@/lib/prayer-sources/aladhan';
import type { AdhanCalculationParams } from '@/lib/prayer-sources/adhan';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import { fetchIslamiskaForbundet } from '@/lib/prayer-sources/islamiska-forbundet';
import { fetchVaktijaBa } from '@/lib/prayer-sources/vaktija-ba';
import { fetchVaktijaEu } from '@/lib/prayer-sources/vaktija-eu';
import { parseSourceConfig } from '@/lib/screen-settings';
import type { PrayerTimesMap } from '@/types/database';
import type {
  AdhanCalculationMethod,
  AdhanSourceConfig,
  AlAdhanSourceConfig,
  IslamiskaForbundetSourceConfig,
  PrayerSourceType,
  VaktijaBaSourceConfig,
  VaktijaEuSourceConfig,
} from '@/types/prayer-config';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ORDER: (keyof PrayerTimesMap)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const minutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

/** Asserts the six-key contract: every prayer present, every value a real HH:MM clock time. */
function expectCompleteMap(times: PrayerTimesMap): void {
  expect(Object.keys(times).sort()).toEqual([...ORDER].sort());
  for (const key of ORDER) {
    expect([key, times[key]]).toEqual([key, expect.stringMatching(HHMM)]);
  }
}

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

/** The arguments of the request under test; a parser that never fetched fails loudly. */
function firstFetchCall(): Parameters<typeof fetchMock> {
  const [call] = fetchMock.mock.calls;
  if (!call) throw new Error('expected fetch to have been called');
  return call;
}

/** The vaktija.eu and Islamiska Förbundet parsers both read the wall clock for "today". */
const FIXED_NOW = new Date(Date.UTC(2026, 6, 30, 12, 0, 0)); // 30 July 2026

// Those two parsers call getMonth()/getDate(), so the *host* timezone is an input
// as much as the frozen instant is: on a host at UTC+12 or further east, noon UTC
// is already 31 July and ten of these tests fail. Pin it instead of inheriting it.
let hostTz: string | undefined;

beforeEach(() => {
  hostTz = process.env.TZ;
  process.env.TZ = 'UTC';
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  // Fake Date only — the real microtask queue still has to drain Response.json().
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  if (hostTz === undefined) delete process.env.TZ;
  else process.env.TZ = hostTz;
});

// --- adhan: pure local astronomy, no network ---

const STOCKHOLM: AdhanCalculationParams = {
  latitude: 59.3293,
  longitude: 18.0686,
  method: 'MuslimWorldLeague',
  madhab: 'shafi',
  timezone: 'Europe/Stockholm',
};

const MARCH_15 = new Date(Date.UTC(2026, 2, 15, 12, 0, 0));
const MIDSUMMER = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));

describe('calculateAdhanTimes', () => {
  it('returns all six prayers as HH:MM for a fixed date and place', () => {
    expectCompleteMap(calculateAdhanTimes(STOCKHOLM, MARCH_15));
  });

  it('orders the day fajr < sunrise < dhuhr < asr < maghrib < isha', () => {
    const times = calculateAdhanTimes(STOCKHOLM, MARCH_15);
    // Fold over adjacent pairs: the accumulator is the prayer before the one being checked.
    ORDER.reduce((earlier, later) => {
      expect([earlier, later, minutes(times[earlier]) < minutes(times[later])]).toEqual([
        earlier,
        later,
        true,
      ]);
      return later;
    });
  });

  it('puts asr later under the hanafi madhab and leaves the rest untouched', () => {
    const shafi = calculateAdhanTimes({ ...STOCKHOLM, madhab: 'shafi' }, MARCH_15);
    const hanafi = calculateAdhanTimes({ ...STOCKHOLM, madhab: 'hanafi' }, MARCH_15);

    expect(minutes(hanafi.asr)).toBeGreaterThan(minutes(shafi.asr));
    expect({ ...hanafi, asr: shafi.asr }).toEqual(shafi);
  });

  it('renders the same instants in the requested timezone', () => {
    const local = calculateAdhanTimes(STOCKHOLM, MARCH_15);
    const utc = calculateAdhanTimes({ ...STOCKHOLM, timezone: 'UTC' }, MARCH_15);
    // Mid-March is still CET, so every prayer reads exactly one hour ahead of UTC
    // (no prayer crosses midnight on this date, so none of the shifts wrap).
    for (const key of ORDER) {
      expect([key, minutes(local[key]) - minutes(utc[key])]).toEqual([key, 60]);
    }
  });

  it('falls back to today when no date is passed', () => {
    expect(calculateAdhanTimes(STOCKHOLM)).toEqual(calculateAdhanTimes(STOCKHOLM, FIXED_NOW));
  });

  it('still produces clock times at midsummer, when the Isha angle is never reached', () => {
    const times = calculateAdhanTimes(STOCKHOLM, MIDSUMMER);
    expectCompleteMap(times);
    // Stockholm's high-latitude Isha lands after midnight, so it sorts before maghrib.
    expect(minutes(times.isha)).toBeLessThan(minutes(times.maghrib));
  });

  it('throws on a method it has no calculation for instead of guessing one', () => {
    const bogus: string = 'FooBarLeague';
    expect(() =>
      calculateAdhanTimes({ ...STOCKHOLM, method: bogus as AdhanCalculationMethod }, MARCH_15)
    ).toThrow();
  });

  it('throws on an unknown timezone rather than falling back to the host clock', () => {
    expect(() => calculateAdhanTimes({ ...STOCKHOLM, timezone: 'Not/AZone' }, MARCH_15)).toThrow(
      /time zone/i
    );
  });

  it("throws above the polar circle instead of emitting 'Invalid Date'", () => {
    // Svalbard at midsummer has no sunrise at all; the formatter cannot render it.
    // Latitudes this high pass settings validation, so the caller has to catch this.
    expect(() => calculateAdhanTimes({ ...STOCKHOLM, latitude: 78.2 }, MIDSUMMER)).toThrow(
      RangeError
    );
  });
});

describe('CALCULATION_METHODS', () => {
  it('lists every method exactly once, each with a name and a description', () => {
    const ids = CALCULATION_METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const option of CALCULATION_METHODS) {
      expect([option.id, option.name.length > 0, option.description.length > 0]).toEqual([
        option.id,
        true,
        true,
      ]);
    }
  });

  it('can compute a full day with every method it offers', () => {
    for (const option of CALCULATION_METHODS) {
      const times = calculateAdhanTimes({ ...STOCKHOLM, method: option.id }, MARCH_15);
      expect([option.id, Object.values(times).every((t) => HHMM.test(t))]).toEqual([
        option.id,
        true,
      ]);
    }
  });

  it('matches the method enum the settings validator accepts', () => {
    const listed: string[] = CALCULATION_METHODS.map((m) => m.id);
    // Probe every method adhan itself ships: the validator must accept it iff we
    // offer it, or settings can be saved that the calculator cannot run.
    for (const name of Object.keys(CalculationMethod)) {
      const accepted =
        parseSourceConfig('adhan', {
          latitude: 59.3293,
          longitude: 18.0686,
          method: name,
          madhab: 'shafi',
          timezone: 'Europe/Stockholm',
          locationName: 'Stockholm',
        }) !== null;
      expect([name, accepted]).toEqual([name, listed.includes(name)]);
    }
  });
});

// --- vaktija.ba: JSON with a positional vakat[] array ---

interface VaktijaBaPayload {
  id: number;
  lokacija: string;
  datum: string[];
  vakat?: string[];
}

const SARAJEVO: VaktijaBaPayload = {
  id: 77,
  lokacija: 'Sarajevo',
  datum: ['30. 7. 2026', '15. muharrem 1448'],
  vakat: ['03:20', '05:05', '13:07', '17:06', '20:24', '22:15'],
};

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), { status });

describe('fetchVaktijaBa', () => {
  it('maps vakat[0..5] onto the six prayers', async () => {
    fetchMock.mockResolvedValue(jsonResponse(SARAJEVO));

    const times = await fetchVaktijaBa(77);

    expectCompleteMap(times);
    expect(times).toEqual({
      fajr: '03:20',
      sunrise: '05:05',
      dhuhr: '13:07',
      asr: '17:06',
      maghrib: '20:24',
      isha: '22:15',
    });
  });

  it('requests the given location id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(SARAJEVO));

    await fetchVaktijaBa(107);

    const [url] = firstFetchCall();
    expect(String(url)).toBe('https://api.vaktija.ba/vaktija/v1/107');
  });

  it('pads single-digit hours and minutes to two digits', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ...SARAJEVO, vakat: ['3:5', '5:05', '13:7', '17:06', '20:24', '22:15'] })
    );

    const times = await fetchVaktijaBa(77);

    expectCompleteMap(times);
    expect([times.fajr, times.sunrise, times.dhuhr]).toEqual(['03:05', '05:05', '13:07']);
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, 502));

    await expect(fetchVaktijaBa(77)).rejects.toThrow('Vaktija.ba API error: 502');
  });

  it('rejects a short vakat array rather than padding undefined into a time', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...SARAJEVO, vakat: ['03:20', '05:05'] }));

    await expect(fetchVaktijaBa(77)).rejects.toThrow();
  });

  it('rejects a payload with no vakat array at all', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 77, lokacija: 'Sarajevo', datum: [] }));

    await expect(fetchVaktijaBa(77)).rejects.toThrow();
  });

  it('rejects an HTML error page served with a 200', async () => {
    fetchMock.mockResolvedValue(new Response('<html>gateway timeout</html>', { status: 200 }));

    await expect(fetchVaktijaBa(77)).rejects.toThrow(SyntaxError);
  });

  it('rejects a vakat entry with no colon to split on', async () => {
    // Narrow on purpose: the parser only pads the two halves, it never range-checks
    // them, so '99:99' *is* returned verbatim. Only the no-colon shape (which would
    // otherwise pad `undefined` into the string) is rejected today.
    fetchMock.mockResolvedValue(
      jsonResponse({ ...SARAJEVO, vakat: ['0320', '05:05', '13:07', '17:06', '20:24', '22:15'] })
    );

    await expect(fetchVaktijaBa(77)).rejects.toThrow();
  });
});

// --- vaktija.eu: whole-year JSON keyed by month then day ---

interface VaktijaEuDay {
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
}

interface VaktijaEuPayload {
  data: { months: Record<string, { days?: Record<string, VaktijaEuDay> }> };
}

const JULY_30: VaktijaEuDay = {
  fajr: '02:34:00',
  sunrise: '05:22:00',
  dhuhr: '13:16:00',
  asr: '17:32:00',
  maghrib: '21:02:00',
  isha: '23:15:00',
};

const euPayload = (days: Record<string, VaktijaEuDay>, month = '7'): VaktijaEuPayload => ({
  data: { months: { [month]: { days } } },
});

describe('fetchVaktijaEu', () => {
  it("picks today's day out of the year and trims the seconds", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(euPayload({ '29': { ...JULY_30, fajr: '02:31:00' }, '30': JULY_30 }))
    );

    const times = await fetchVaktijaEu('wien');

    expectCompleteMap(times);
    expect(times).toEqual({
      fajr: '02:34',
      sunrise: '05:22',
      dhuhr: '13:16',
      asr: '17:32',
      maghrib: '21:02',
      isha: '23:15',
    });
  });

  it('requests the given location slug', async () => {
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '30': JULY_30 })));

    await fetchVaktijaEu('st-poelten');

    const [url] = firstFetchCall();
    expect(String(url)).toBe('https://api.vaktija.eu/v3/locations/slug/st-poelten');
  });

  it('looks up month and day unpadded', async () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 5, 12, 0, 0)));
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '5': JULY_30 }, '1')));

    await expect(fetchVaktijaEu('wien')).resolves.toMatchObject({ fajr: '02:34' });
  });

  it('pads a single-digit hour and passes a seconds-less value through', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(euPayload({ '30': { ...JULY_30, fajr: '2:34:00', dhuhr: '13:16' } }))
    );

    const times = await fetchVaktijaEu('wien');

    expectCompleteMap(times);
    expect([times.fajr, times.dhuhr]).toEqual(['02:34', '13:16']);
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'not found' }, 404));

    await expect(fetchVaktijaEu('nowhere')).rejects.toThrow('Vaktija.eu API error: 404');
  });

  it("reports a missing day rather than returning a half-built map", async () => {
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '29': JULY_30 })));

    await expect(fetchVaktijaEu('wien')).rejects.toThrow('No prayer times found for today');
  });

  it('reports a month that the payload does not carry', async () => {
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '30': JULY_30 }, '12')));

    await expect(fetchVaktijaEu('wien')).rejects.toThrow('No prayer times found for today');
  });

  it('errors rather than half-building a map when a month carries no days', async () => {
    // `months[month]?.days[day]` guards the month but not `days`, so what reaches the
    // caller here is a raw TypeError, not the module's 'No prayer times found for
    // today'. Asserted loosely because either rejection satisfies the contract.
    fetchMock.mockResolvedValue(jsonResponse({ data: { months: { '7': {} } } }));

    await expect(fetchVaktijaEu('wien')).rejects.toThrow();
  });

  it('rejects a day that is missing one of the prayers', async () => {
    const withoutIsha: VaktijaEuDay = { ...JULY_30, isha: undefined };
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '30': withoutIsha })));

    await expect(fetchVaktijaEu('wien')).rejects.toThrow();
  });

  it('rejects a 200 that carries an error body instead of the data envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }));

    await expect(fetchVaktijaEu('wien')).rejects.toThrow();
  });
});

// --- AlAdhan: JSON envelope, capitalised prayer names, "today" chosen by us ---

interface AlAdhanPayload {
  code?: number;
  data?: {
    timings?: Record<string, string | undefined>;
    meta?: { method?: { id?: number } };
  };
}

const PARIS_TIMINGS: Record<string, string> = {
  Fajr: '04:36',
  Sunrise: '06:26',
  Dhuhr: '13:57',
  Asr: '17:56',
  Sunset: '21:28',
  Maghrib: '21:28',
  Isha: '23:18',
  Imsak: '04:26',
  Midnight: '01:57',
};

const alPayload = (
  timings: Record<string, string | undefined> = PARIS_TIMINGS,
  methodId = 12
): AlAdhanPayload => ({ code: 200, data: { timings, meta: { method: { id: methodId } } } });

const PARIS: AlAdhanSourceConfig = {
  latitude: 48.8566,
  longitude: 2.3522,
  method: 12,
  madhab: 'shafi',
  timezone: 'Europe/Paris',
  locationName: 'Paris',
};

describe('fetchAlAdhan', () => {
  it('maps the capitalised timings onto the six prayers and ignores the extras', async () => {
    fetchMock.mockResolvedValue(jsonResponse(alPayload()));

    const times = await fetchAlAdhan(PARIS);

    expectCompleteMap(times);
    expect(times).toEqual({
      fajr: '04:36',
      sunrise: '06:26',
      dhuhr: '13:57',
      asr: '17:56',
      maghrib: '21:28',
      isha: '23:18',
    });
  });

  it("requests today's date, the coordinates, the method, the school and the zone", async () => {
    fetchMock.mockResolvedValue(jsonResponse(alPayload()));

    await fetchAlAdhan(PARIS);

    const [url] = firstFetchCall();
    const parsed = new URL(String(url));
    expect(parsed.origin + parsed.pathname).toBe('https://api.aladhan.com/v1/timings/30-07-2026');
    expect(parsed.searchParams.get('latitude')).toBe('48.8566');
    expect(parsed.searchParams.get('longitude')).toBe('2.3522');
    expect(parsed.searchParams.get('method')).toBe('12');
    expect(parsed.searchParams.get('school')).toBe('0');
    expect(parsed.searchParams.get('timezonestring')).toBe('Europe/Paris');
  });

  it("uses the screen's calendar day, not the host's", async () => {
    // Noon UTC on 30 July is already 31 July in Auckland and still 30 July in Honolulu.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(alPayload())));
    await fetchAlAdhan({ ...PARIS, timezone: 'Pacific/Auckland' });
    expect(String(firstFetchCall()[0])).toContain('/timings/31-07-2026?');

    fetchMock.mockClear();
    await fetchAlAdhan({ ...PARIS, timezone: 'Pacific/Honolulu' });
    expect(String(firstFetchCall()[0])).toContain('/timings/30-07-2026?');
  });

  it('sends school=1 for the hanafi madhab', async () => {
    fetchMock.mockResolvedValue(jsonResponse(alPayload()));

    await fetchAlAdhan({ ...PARIS, madhab: 'hanafi' });

    expect(new URL(String(firstFetchCall()[0])).searchParams.get('school')).toBe('1');
  });

  it('drops a zone suffix and pads a single-digit hour', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(alPayload({ ...PARIS_TIMINGS, Fajr: '4:36 (CEST)', Isha: '23:18 (CEST)' }))
    );

    const times = await fetchAlAdhan(PARIS);

    expectCompleteMap(times);
    expect([times.fajr, times.isha]).toEqual(['04:36', '23:18']);
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: 500, status: 'error' }, 500));

    await expect(fetchAlAdhan(PARIS)).rejects.toThrow('AlAdhan API error: 500');
  });

  it('rejects an answer computed with a method other than the one asked for', async () => {
    // The service swaps an unknown id for ISNA and still answers 200.
    fetchMock.mockResolvedValue(jsonResponse(alPayload(PARIS_TIMINGS, 2)));

    await expect(fetchAlAdhan(PARIS)).rejects.toThrow('different calculation method');
  });

  it('rejects an envelope without timings, and one missing a prayer', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: 200, data: {} }));
    await expect(fetchAlAdhan(PARIS)).rejects.toThrow('No prayer times in AlAdhan response');

    fetchMock.mockResolvedValue(jsonResponse(alPayload({ ...PARIS_TIMINGS, Asr: undefined })));
    await expect(fetchAlAdhan(PARIS)).rejects.toThrow('Unparseable time from AlAdhan');
  });

  it('rejects a 200 that carries an error body instead of the data envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: 400, status: 'Invalid date' }));

    await expect(fetchAlAdhan(PARIS)).rejects.toThrow();
  });

  it('throws on an unknown timezone rather than guessing a date', async () => {
    fetchMock.mockResolvedValue(jsonResponse(alPayload()));

    await expect(fetchAlAdhan({ ...PARIS, timezone: 'Mars/Olympus' })).rejects.toThrow(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('ALADHAN_METHODS', () => {
  it('lists every method exactly once, each with a name and a description', () => {
    const ids = ALADHAN_METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of ALADHAN_METHODS) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it('matches the ids the settings validator accepts', () => {
    const listed = ALADHAN_METHODS.map((m) => m.id);
    for (let id = -1; id <= 100; id++) {
      const accepted = parseSourceConfig('aladhan', { ...PARIS, method: id }) !== null;
      expect([id, accepted]).toEqual([id, listed.includes(id)]);
    }
  });
});

// --- Islamiska Förbundet: scraped HTML table, seven cells per row ---

function bonetiderHtml(rows: string[][]): string {
  const head =
    '<thead><tr><th>Datum</th><th>Fajr</th><th>Shuruk</th><th>Dhuhr</th><th>Asr</th><th>Maghrib</th><th>Isha</th></tr></thead>';
  const body = rows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');
  return `<table class="ifis_bonetider">${head}<tbody>${body}</tbody></table>`;
}

const ROW_29: string[] = ['29', '02:41', '04:34', '13:14', '17:53', '21:44', '23:31'];
const ROW_30: string[] = ['30', '02:45', '04:36', '13:14', '17:52', '21:42', '23:28'];
const ROW_31: string[] = ['31', '02:49', '04:38', '13:14', '17:51', '21:40', '23:25'];
const JULY_ROWS: string[][] = [ROW_29, ROW_30, ROW_31];

const htmlResponse = (html: string, status = 200): Response => new Response(html, { status });

describe('fetchIslamiskaForbundet', () => {
  it("reads the row for today's date, not the first row in the table", async () => {
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml(JULY_ROWS)));

    const times = await fetchIslamiskaForbundet('Stockholm');

    expectCompleteMap(times);
    expect(times).toEqual({
      fajr: '02:45',
      sunrise: '04:36',
      dhuhr: '13:14',
      asr: '17:52',
      maghrib: '21:42',
      isha: '23:28',
    });
  });

  it("uses Sweden's calendar day, not the host clock's", async () => {
    // 23:30 UTC on 30 July is 01:30 on the 31st in Stockholm — inside the pre-fajr
    // window this screen exists to show. This provider serves Swedish cities only
    // (every entry in ISLAMISKA_CITIES, and the hardcoded ', SE' suffix), so "today"
    // can only mean today in Europe/Stockholm; no caller-supplied timezone required.
    // Fails today: the parser reads new Date().getDate(), so on a UTC host (Vercel)
    // it silently serves the 30th's times all through the early morning of the 31st.
    vi.setSystemTime(new Date(Date.UTC(2026, 6, 30, 23, 30, 0)));
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml(JULY_ROWS)));

    const times = await fetchIslamiskaForbundet('Stockholm');

    expect(times).toEqual({
      fajr: '02:49',
      sunrise: '04:38',
      dhuhr: '13:14',
      asr: '17:51',
      maghrib: '21:40',
      isha: '23:25',
    });
  });

  it('posts the city and the current month to the widget endpoint', async () => {
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml(JULY_ROWS)));

    await fetchIslamiskaForbundet('Göteborg');

    const [url, init] = firstFetchCall();
    expect(String(url)).toBe(
      'https://www.islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php'
    );
    expect(init?.method).toBe('POST');
    const body = new URLSearchParams(String(init?.body));
    expect(body.get('ifis_bonetider_page_city')).toBe('Göteborg, SE');
    expect(body.get('ifis_bonetider_page_month')).toBe('7');
  });

  it('strips markup and whitespace from inside a cell', async () => {
    fetchMock.mockResolvedValue(
      htmlResponse(
        '<table><tr><td>\n 30 </td><td><span>02:45</span></td><td> 04:36\n</td>' +
          '<td>13:14</td><td>17:52</td><td>21:42</td><td><b>23:28</b></td></tr></table>'
      )
    );

    await expect(fetchIslamiskaForbundet('Stockholm')).resolves.toEqual({
      fajr: '02:45',
      sunrise: '04:36',
      dhuhr: '13:14',
      asr: '17:52',
      maghrib: '21:42',
      isha: '23:28',
    });
  });

  it('pads single-digit clock parts', async () => {
    fetchMock.mockResolvedValue(
      htmlResponse(bonetiderHtml([['30', '2:45', '4:36', '13:14', '17:52', '21:42', '23:28']]))
    );

    const times = await fetchIslamiskaForbundet('Stockholm');

    expectCompleteMap(times);
    expect([times.fajr, times.sunrise]).toEqual(['02:45', '04:36']);
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(htmlResponse('<h1>503</h1>', 503));

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow(
      'Islamiska Förbundet API error: 503'
    );
  });

  it('rejects a response with no table cells', async () => {
    fetchMock.mockResolvedValue(htmlResponse('<p>Ingen stad valdes.</p>'));

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow(
      'No prayer times found in response'
    );
  });

  it('rejects a table too short to hold one row', async () => {
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml([['30', '02:45', '04:36']])));

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow(
      'No prayer times found in response'
    );
  });

  it("names the day it could not find when the month's table skips it", async () => {
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml([ROW_29, ROW_31])));

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow(
      'No prayer times found for day 30'
    );
  });

  it("rejects a truncated row for today instead of returning 'undefined' times", async () => {
    fetchMock.mockResolvedValue(
      htmlResponse(bonetiderHtml([ROW_29, ['30', '02:45', '04:36', '13:14']]))
    );

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow();
  });

  it('does not mistake a day number that merely starts the same', async () => {
    fetchMock.mockResolvedValue(
      htmlResponse(bonetiderHtml([['3', '02:41', '04:34', '13:14', '17:53', '21:44', '23:31']]))
    );

    await expect(fetchIslamiskaForbundet('Stockholm')).rejects.toThrow(
      'No prayer times found for day 30'
    );
  });
});

// --- dispatch ---

describe('fetchPrayerTimes', () => {
  const adhanConfig: AdhanSourceConfig = { ...STOCKHOLM, locationName: 'Stockholm' };
  const baConfig: VaktijaBaSourceConfig = { locationId: 77, locationName: 'Sarajevo' };
  const euConfig: VaktijaEuSourceConfig = {
    countryCode: 'AT',
    locationSlug: 'wien',
    locationName: 'Wien',
  };
  const seConfig: IslamiskaForbundetSourceConfig = { city: 'Stockholm' };

  it('calculates adhan times locally without touching the network', async () => {
    expectCompleteMap(await fetchPrayerTimes('adhan', adhanConfig));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends aladhan to api.aladhan.com with the configured method', async () => {
    fetchMock.mockResolvedValue(jsonResponse(alPayload()));

    const times = await fetchPrayerTimes('aladhan', PARIS);

    const [url] = firstFetchCall();
    expect(String(url)).toContain('api.aladhan.com/v1/timings/');
    expect(String(url)).toContain('method=12');
    expect(times.fajr).toBe('04:36');
  });

  it('sends vaktija_ba to the vaktija.ba API with the configured location id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(SARAJEVO));

    const times = await fetchPrayerTimes('vaktija_ba', baConfig);

    const [url] = firstFetchCall();
    expect(String(url)).toContain('api.vaktija.ba/vaktija/v1/77');
    expect(times.fajr).toBe('03:20');
  });

  it('sends vaktija_eu to the vaktija.eu API with the configured slug', async () => {
    fetchMock.mockResolvedValue(jsonResponse(euPayload({ '30': JULY_30 })));

    const times = await fetchPrayerTimes('vaktija_eu', euConfig);

    const [url] = firstFetchCall();
    expect(String(url)).toContain('api.vaktija.eu/v3/locations/slug/wien');
    expect(times.fajr).toBe('02:34');
  });

  it('sends islamiska_forbundet to the Bonetider widget with the configured city', async () => {
    fetchMock.mockResolvedValue(htmlResponse(bonetiderHtml(JULY_ROWS)));

    const times = await fetchPrayerTimes('islamiska_forbundet', seConfig);

    const [url, init] = firstFetchCall();
    expect(String(url)).toContain('Bonetider_Widget.php');
    expect(String(init?.body)).toContain('Stockholm');
    expect(times.fajr).toBe('02:45');
  });

  it('surfaces a network-level failure instead of a default map', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(fetchPrayerTimes('vaktija_eu', euConfig)).rejects.toThrow('fetch failed');
  });

  it('errors on an adhan config with no coordinates or method', async () => {
    // The dispatcher casts the config instead of validating it, so an empty
    // object has to fail loudly rather than yield a map of bad times.
    await expect(fetchPrayerTimes('adhan', {})).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to fetch for a manual source', async () => {
    await expect(fetchPrayerTimes('manual', {})).rejects.toThrow(
      'Cannot fetch times for manual source'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('names an unknown source in the error instead of returning nothing', async () => {
    const unknown: string = 'nonsense';

    await expect(fetchPrayerTimes(unknown as PrayerSourceType, {})).rejects.toThrow(
      'Unknown prayer source: nonsense'
    );
  });
});
