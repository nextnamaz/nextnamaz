import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TodayTimes } from '@/components/settings/today-times';
import { PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
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

const BOSNIAN: Record<PrayerName, string> = {
  fajr: 'Zora',
  sunrise: 'Izlazak sunca',
  dhuhr: 'Podne',
  asr: 'Ikindija',
  maghrib: 'Akšam',
  isha: 'Jacija',
};

function renderList(fixed: FixedTimes, times: PrayerTimesMap = WINTER, labels = PRAYER_DISPLAY_NAMES) {
  const onFixedChange = vi.fn<(fixed: FixedTimes) => void>();
  render(<TodayTimes times={times} fixed={fixed} labels={labels} locale="en" onFixedChange={onFixedChange} />);
  return onFixedChange;
}

/** The text of the row that starts with a prayer's name. */
const row = (name: string) => screen.getByText(name).closest('div')?.textContent;

describe('TodayTimes', () => {
  afterEach(cleanup);

  it("lists the source's times, each prayer with its own fixed-time switch, all off", () => {
    renderList({});
    expect(row('Isha')).toBe('Isha18:31');
    const switches = screen.getAllByRole('switch');
    expect(switches.map((s) => s.getAttribute('aria-label'))).toEqual([
      'Fixed time for Fajr',
      'Fixed time for Dhuhr',
      'Fixed time for Asr',
      'Fixed time for Maghrib',
      'Fixed time for Isha',
    ]);
    expect(switches.every((s) => s.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it("explains fixed times in the screen's own prayer names", () => {
    renderList({}, WINTER, BOSNIAN);
    expect(
      screen.getByText(/To keep a prayer at the same time, like Jacija at 19:00, switch on its fixed time\./)
    ).toBeInTheDocument();
  });

  it("switches a prayer on at today's time and asks for the mosque's own", () => {
    const onFixedChange = renderList({ dhuhr: '13:00' });
    fireEvent.click(screen.getByRole('switch', { name: 'Fixed time for Isha' }));
    expect(onFixedChange).toHaveBeenCalledWith({ dhuhr: '13:00', isha: '18:31' });
  });

  it('prompts for a time while the fixed one still matches the source', () => {
    renderList({ isha: '18:31' });
    expect(screen.getByRole('group', { name: 'Isha time' })).toHaveAccessibleDescription(
      "Choose your time. Today's automatic time is 18:31."
    );
  });

  it('picks a fixed time on a 24-hour clock, hour and minutes apart', () => {
    const onFixedChange = renderList({ isha: '19:00' });
    const hour = screen.getByRole('combobox', { name: 'Isha hour' });
    const minutes = screen.getByRole('combobox', { name: 'Isha minutes' });
    expect(hour).toHaveValue('19');
    expect(minutes).toHaveValue('00');
    expect(hour.querySelectorAll('option')).toHaveLength(24);
    expect(minutes.querySelectorAll('option')).toHaveLength(60);
    expect(screen.getByRole('group', { name: 'Isha time' })).toHaveAccessibleDescription(
      'Fixed every day, instead of 18:31 today.'
    );
    fireEvent.change(hour, { target: { value: '20' } });
    expect(onFixedChange).toHaveBeenLastCalledWith({ isha: '20:00' });
    fireEvent.change(minutes, { target: { value: '15' } });
    expect(onFixedChange).toHaveBeenLastCalledWith({ isha: '19:15' });
  });

  it('switching off hands the prayer back to the source', () => {
    const onFixedChange = renderList({ dhuhr: '13:00', isha: '19:00' });
    fireEvent.click(screen.getByRole('switch', { name: 'Fixed time for Isha' }));
    expect(onFixedChange).toHaveBeenCalledWith({ dhuhr: '13:00' });
  });

  it('says why a fixed time sits out today, and what the TV shows instead', () => {
    renderList({ isha: '19:00' }, SUMMER);
    expect(screen.getByRole('group', { name: 'Isha time' })).toHaveAccessibleDescription(
      'Not used today. It would come before Maghrib (22:13), so the TV shows 23:50.'
    );
  });

  it('names the later neighbour when a fixed time comes too late', () => {
    renderList({ asr: '17:00' });
    expect(screen.getByRole('group', { name: 'Asr time' })).toHaveAccessibleDescription(
      'Not used today. It would come after Maghrib (16:42), so the TV shows 14:07.'
    );
  });

  it('never offers sunrise a fixed time', () => {
    renderList({});
    expect(screen.queryByRole('switch', { name: 'Fixed time for Sunrise' })).toBeNull();
    expect(row('Sunrise')).toBe('Sunrise07:40');
  });

  it('says the list follows the source apart from fixed times once one is set', () => {
    renderList({ isha: '19:00' });
    expect(screen.getByText('Updates automatically every day, apart from fixed times.')).toBeInTheDocument();
  });
});
