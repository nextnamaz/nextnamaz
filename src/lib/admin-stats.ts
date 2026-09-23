/** The few screen fields the owner's counts are made from. */
export interface ScreenStatRow {
  configured: boolean;
  created_at: string;
  /** Undefined until the stats migration has run. */
  last_seen_at?: string | null;
  prayer_source: string;
  theme: string;
  locale: string;
}

export interface Tally {
  key: string;
  count: number;
}

export interface ScreenStats {
  total: number;
  /** Saved at least once: a mosque that finished setting up. */
  configured: number;
  onAirDay: number;
  onAirWeek: number;
  newWeek: number;
  newMonth: number;
  bySource: Tally[];
  byTheme: Tally[];
  byLanguage: Tally[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function tally(values: string[]): Tally[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function screenStats(rows: ScreenStatRow[], now = Date.now()): ScreenStats {
  const since = (iso: string | null | undefined, days: number) => !!iso && now - Date.parse(iso) <= days * DAY_MS;
  const configured = rows.filter((r) => r.configured);
  return {
    total: rows.length,
    configured: configured.length,
    onAirDay: rows.filter((r) => since(r.last_seen_at, 1)).length,
    onAirWeek: rows.filter((r) => since(r.last_seen_at, 7)).length,
    newWeek: rows.filter((r) => since(r.created_at, 7)).length,
    newMonth: rows.filter((r) => since(r.created_at, 30)).length,
    // Only screens someone set up: a blank one still has the defaults.
    bySource: tally(configured.map((r) => r.prayer_source)),
    byTheme: tally(configured.map((r) => r.theme)),
    byLanguage: tally(configured.map((r) => r.locale)),
  };
}
