import { describe, expect, it } from 'vitest';
import { prayerLine } from '@/lib/prayer-lines';

const gothenburg = { latitude: 57.71, longitude: 11.97 };
const local = (h: number, m: number) => new Date(Date.UTC(2026, 9, 2, h - 2, m)); // CEST

describe('prayerLine', () => {
  // Fajr and Isha by a twilight angle, Asr after noon, Maghrib at sunset: the
  // line of each must sit on the mosque at the moment the screen says.
  it.each([
    ['Fajr', local(5, 21)],
    ['Asr', local(15, 52)],
    ['Maghrib', local(18, 41)],
    ['Isha', local(20, 29)],
  ])('crosses the mosque at %s itself', (_, at) => {
    const line = prayerLine(gothenburg, at, at, false);
    expect(line.crossing?.longitude).toBeCloseTo(gothenburg.longitude, 0);
  });

  it('comes in from the east, about fifteen degrees an hour', () => {
    const at = local(18, 41);
    const hourBefore = prayerLine(gothenburg, at, new Date(at.getTime() - 3_600_000), false);
    const east = (hourBefore.crossing?.longitude ?? 0) - gothenburg.longitude;
    expect(east).toBeGreaterThan(13);
    expect(east).toBeLessThan(17);
  });

  it('rides its label on the line six degrees north of the mosque, clear of the city', () => {
    const at = local(18, 41);
    const line = prayerLine(gothenburg, at, new Date(at.getTime() - 1_800_000), false);
    expect(line.label?.latitude).toBeCloseTo(gothenburg.latitude + 6, 6);
    expect(Math.abs((line.label?.longitude ?? 0) - (line.crossing?.longitude ?? 0))).toBeLessThan(10);
    const noon = local(13, 4);
    const meridian = prayerLine(gothenburg, noon, noon, true);
    expect(meridian.label?.longitude).toBeCloseTo(meridian.crossing?.longitude ?? 0, 6);
  });

  it('draws Dhuhr as the meridian that reaches the mosque at its time', () => {
    const at = local(13, 4);
    expect(prayerLine(gothenburg, at, at, true).crossing?.longitude).toBeCloseTo(gothenburg.longitude, 1);
    const pieces = prayerLine(gothenburg, at, at, true).pieces;
    expect(pieces).toHaveLength(1);
    expect(new Set(pieces[0]?.map((p) => p.longitude.toFixed(6))).size).toBe(1);
  });
});
