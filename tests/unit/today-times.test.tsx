import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TodayTimes } from '@/components/settings/today-times';
import { PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import type { FixedTimes } from '@/lib/fixed-times';
import type { PrayerTimesMap } from '@/types/database';

const WINTER: PrayerTimesMap = {
  fajr: '05:51',
  sunrise: '07:40',
  dhuhr: '12:16',
  asr: '14:07',
  maghrib: '16:42',
  isha: '18:31',
};

const SUMMER: PrayerTimesMap = { ...WINTER, maghrib: '22:13', isha: '23:50' };

function renderList(fixed: FixedTimes, times: PrayerTimesMap = WINTER) {
  render(<TodayTimes times={times} fixed={fixed} labels={PRAYER_DISPLAY_NAMES} locale="en" />);
}

/** The text of the row that starts with a prayer's name. */
const row = (name: string) => screen.getByText(name).closest('div')?.textContent;

describe('TodayTimes', () => {
  afterEach(cleanup);

  it("lists the source's times when nothing is fixed", () => {
    renderList({});
    expect(row('Isha')).toBe('Isha18:31');
    expect(screen.queryByText('Fixed')).toBeNull();
    expect(screen.getByText('Updates automatically every day.')).toBeInTheDocument();
  });

  it('shows a fixed time as the TV does, tagged as fixed', () => {
    renderList({ isha: '19:00' });
    expect(row('Isha')).toBe('IshaFixed19:00');
    expect(screen.getByText('Updates automatically every day, apart from fixed times.')).toBeInTheDocument();
  });

  it("shows the source's time, untagged, on a day the fixed time sits out", () => {
    renderList({ isha: '19:00' }, SUMMER);
    expect(row('Isha')).toBe('Isha23:50');
  });
});
