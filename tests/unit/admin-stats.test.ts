import { describe, expect, it } from 'vitest';
import { screenStats } from '@/lib/admin-stats';
import type { ScreenStatRow } from '@/lib/admin-stats';

const NOW = Date.parse('2026-09-23T12:00:00Z');
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

function row(over: Partial<ScreenStatRow>): ScreenStatRow {
  return { configured: true, created_at: ago(60), last_seen_at: null, prayer_source: 'adhan', theme: 'default', locale: 'en', ...over };
}

describe('screenStats', () => {
  it('counts screens set up, on air and new', () => {
    const s = screenStats(
      [
        row({ last_seen_at: ago(0.1), created_at: ago(2) }),
        row({ last_seen_at: ago(3), prayer_source: 'vaktija' }),
        row({ configured: false, created_at: ago(20) }),
        row({ last_seen_at: undefined }),
      ],
      NOW
    );
    expect(s).toMatchObject({ total: 4, configured: 3, onAirDay: 1, onAirWeek: 2, newWeek: 1, newMonth: 2 });
    expect(s.bySource).toEqual([
      { key: 'adhan', count: 2 },
      { key: 'vaktija', count: 1 },
    ]);
  });
});
