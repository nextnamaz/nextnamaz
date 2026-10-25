import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FixedTimesCard } from '@/components/settings/fixed-times-card';
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

function renderCard(fixed: FixedTimes, times: PrayerTimesMap = WINTER) {
  const onChange = vi.fn<(fixed: FixedTimes) => void>();
  render(<FixedTimesCard times={times} fixed={fixed} labels={PRAYER_DISPLAY_NAMES} onChange={onChange} />);
  return onChange;
}

describe('FixedTimesCard', () => {
  afterEach(cleanup);

  it('offers a switch for each of the five prayers, all automatic to begin with', () => {
    renderCard({});
    const switches = screen.getAllByRole('switch');
    expect(switches.map((s) => s.getAttribute('id'))).toEqual([
      'fixed-fajr',
      'fixed-dhuhr',
      'fixed-asr',
      'fixed-maghrib',
      'fixed-isha',
    ]);
    expect(switches.every((s) => s.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(screen.getAllByText('Automatic')).toHaveLength(5);
    expect(screen.queryByRole('switch', { name: 'Sunrise' })).toBeNull();
  });

  it("switches a prayer on at today's time and asks for the mosque's own", () => {
    const onChange = renderCard({ dhuhr: '13:00' });
    fireEvent.click(screen.getByRole('switch', { name: 'Isha' }));
    expect(onChange).toHaveBeenCalledWith({ dhuhr: '13:00', isha: '18:31' });
  });

  it('prompts for a time while the fixed one still matches the source', () => {
    renderCard({ isha: '18:31' });
    expect(screen.getByLabelText('Fixed time for Isha')).toHaveAccessibleDescription(
      "Choose your time. Today's automatic time is 18:31."
    );
  });

  it('shows the fixed time in an editable field, with the time it replaces', () => {
    const onChange = renderCard({ isha: '19:00' });
    const field = screen.getByLabelText('Fixed time for Isha');
    expect(field).toHaveValue('19:00');
    expect(field).toHaveAccessibleDescription('Instead of 18:31 today.');
    expect(screen.getByRole('switch', { name: 'Isha' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.change(field, { target: { value: '19:15' } });
    expect(onChange).toHaveBeenCalledWith({ isha: '19:15' });
  });

  it('never stores a blank fixed time', () => {
    const onChange = renderCard({ isha: '19:00' });
    fireEvent.change(screen.getByLabelText('Fixed time for Isha'), { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('switching off hands the prayer back to the source', () => {
    const onChange = renderCard({ dhuhr: '13:00', isha: '19:00' });
    fireEvent.click(screen.getByRole('switch', { name: 'Isha' }));
    expect(onChange).toHaveBeenCalledWith({ dhuhr: '13:00' });
  });

  it('says why a fixed time sits out today, and what the TV shows instead', () => {
    renderCard({ isha: '19:00' }, SUMMER);
    expect(screen.getByLabelText('Fixed time for Isha')).toHaveAccessibleDescription(
      'Not used today. It would come before Maghrib (22:13), so the TV shows 23:50.'
    );
  });

  it('names the later neighbour when a fixed time comes too late', () => {
    renderCard({ asr: '17:00' });
    expect(screen.getByLabelText('Fixed time for Asr')).toHaveAccessibleDescription(
      'Not used today. It would come after Maghrib (16:42), so the TV shows 14:07.'
    );
  });
});
