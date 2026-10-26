import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TodayTimes } from '@/components/settings/today-times';
import { PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import type { FixedTimes } from '@/lib/fixed-times';
import type { IqamahRules } from '@/lib/iqamah';
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

interface Setup {
  fixed?: FixedTimes;
  iqamah?: IqamahRules;
  times?: PrayerTimesMap;
}

function renderList({ fixed = {}, iqamah = {}, times = WINTER }: Setup = {}) {
  const onFixedChange = vi.fn<(fixed: FixedTimes) => void>();
  const onIqamahChange = vi.fn<(iqamah: IqamahRules) => void>();
  render(
    <TodayTimes
      times={times}
      fixed={fixed}
      iqamah={iqamah}
      labels={PRAYER_DISPLAY_NAMES}
      iqamahLabel="Ikamet"
      locale="en"
      onFixedChange={onFixedChange}
      onIqamahChange={onIqamahChange}
    />
  );
  return { onFixedChange, onIqamahChange };
}

const prayerRow = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });
const open = (name: string) => fireEvent.click(prayerRow(name));

describe('TodayTimes', () => {
  afterEach(cleanup);

  it('is a plain timetable until a prayer is opened', () => {
    renderList();
    expect(prayerRow('Isha')).toHaveTextContent('Isha18:31');
    expect(prayerRow('Isha')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByText(/Tap a prayer to give it a fixed time or Ikamet\./)).toBeInTheDocument();
  });

  it('opens a prayer onto its time and its iqamah, both at their defaults', () => {
    renderList();
    open('Isha');
    expect(prayerRow('Isha')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('radio', { name: 'Automatic' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Off' })).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps one prayer open at a time, and closes it on a second tap', () => {
    renderList();
    open('Isha');
    open('Dhuhr');
    expect(prayerRow('Isha')).toHaveAttribute('aria-expanded', 'false');
    expect(prayerRow('Dhuhr')).toHaveAttribute('aria-expanded', 'true');
    open('Dhuhr');
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('never opens sunrise, which has nothing to set', () => {
    renderList();
    expect(screen.queryByRole('button', { name: /^Sunrise/ })).toBeNull();
    expect(screen.getByText('Sunrise').parentElement).toHaveTextContent('Sunrise07:40');
  });

  it("fixes a prayer at today's time, to be changed from there", () => {
    const { onFixedChange } = renderList({ fixed: { dhuhr: '13:00' } });
    open('Isha');
    fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));
    expect(onFixedChange).toHaveBeenCalledWith({ dhuhr: '13:00', isha: '18:31' });
  });

  it('shows a fixed prayer tagged in the list, and its time on a 24-hour picker', () => {
    const { onFixedChange } = renderList({ fixed: { isha: '19:00' } });
    expect(prayerRow('Isha')).toHaveTextContent('IshaFixed19:00');
    open('Isha');
    const hour = screen.getByRole('combobox', { name: 'Fixed time for Isha, hour' });
    expect(hour).toHaveValue('19');
    expect(hour.querySelectorAll('option')).toHaveLength(24);
    expect(screen.getByRole('group', { name: 'Fixed time for Isha' })).toHaveAccessibleDescription(
      'Every day, instead of 18:31 today.'
    );
    fireEvent.change(hour, { target: { value: '20' } });
    expect(onFixedChange).toHaveBeenLastCalledWith({ isha: '20:00' });
  });

  it('hands a prayer back to its source with Automatic', () => {
    const { onFixedChange } = renderList({ fixed: { dhuhr: '13:00', isha: '19:00' } });
    open('Isha');
    fireEvent.click(screen.getByRole('radio', { name: 'Automatic' }));
    expect(onFixedChange).toHaveBeenCalledWith({ dhuhr: '13:00' });
  });

  it('says why a fixed time sits out today, and what the TV shows instead', () => {
    renderList({ fixed: { isha: '19:00' }, times: SUMMER });
    expect(prayerRow('Isha')).toHaveTextContent('Isha23:50');
    open('Isha');
    expect(screen.getByRole('group', { name: 'Fixed time for Isha' })).toHaveAccessibleDescription(
      'Not used today. It would come before Maghrib (22:13), so the TV shows 23:50.'
    );
  });

  it('gives a prayer an iqamah ten minutes after the adhan, then any wait up to an hour', () => {
    const { onIqamahChange } = renderList();
    open('Maghrib');
    fireEvent.click(screen.getByRole('radio', { name: 'After adhan' }));
    expect(onIqamahChange).toHaveBeenCalledWith({ maghrib: { after: 10 } });
  });

  it('changes the wait, and shows the iqamah it gives in the list', () => {
    const { onIqamahChange } = renderList({ iqamah: { maghrib: { after: 10 } } });
    expect(prayerRow('Maghrib')).toHaveTextContent('MaghribIkamet 16:5216:42');
    open('Maghrib');
    const wait = screen.getByRole('combobox', { name: 'Minutes from the adhan to Ikamet' });
    expect(wait.querySelectorAll('option')).toHaveLength(60);
    fireEvent.change(wait, { target: { value: '5' } });
    expect(onIqamahChange).toHaveBeenLastCalledWith({ maghrib: { after: 5 } });
  });

  it("sets an iqamah at a time of its own, starting where today's wait would put it", () => {
    const { onIqamahChange } = renderList();
    open('Isha');
    fireEvent.click(screen.getByRole('radio', { name: 'Set time' }));
    expect(onIqamahChange).toHaveBeenCalledWith({ isha: { at: '18:41' } });
  });

  it('switches an iqamah off again', () => {
    const { onIqamahChange } = renderList({ iqamah: { maghrib: { after: 5 }, isha: { at: '19:30' } } });
    open('Isha');
    fireEvent.click(screen.getByRole('radio', { name: 'Off' }));
    expect(onIqamahChange).toHaveBeenCalledWith({ maghrib: { after: 5 } });
  });

  it('says why an iqamah sits out today', () => {
    renderList({ iqamah: { isha: { at: '18:00' } } });
    expect(prayerRow('Isha')).toHaveTextContent('Isha18:31');
    open('Isha');
    expect(screen.getByRole('group', { name: 'Ikamet time for Isha' })).toHaveAccessibleDescription(
      'Not used today. Ikamet has to fall between 18:31 and midnight.'
    );
  });
});
