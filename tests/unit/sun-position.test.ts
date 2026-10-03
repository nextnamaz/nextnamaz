import { describe, expect, it } from 'vitest';
import { subsolarPoint, sunAltitude } from '@/lib/sun-position';

const utc = (iso: string) => new Date(`${iso}Z`);

describe('subsolarPoint', () => {
  it('stands over the tropics at the solstices and the equator at the equinoxes', () => {
    expect(subsolarPoint(utc('2026-06-21T08:24')).latitude).toBeCloseTo(23.44, 1);
    expect(subsolarPoint(utc('2026-12-21T20:50')).latitude).toBeCloseTo(-23.44, 1);
    expect(Math.abs(subsolarPoint(utc('2026-03-20T14:46')).latitude)).toBeLessThan(0.05);
    expect(Math.abs(subsolarPoint(utc('2026-09-23T00:05')).latitude)).toBeLessThan(0.05);
  });

  it('crosses Greenwich at noon UTC, give or take the equation of time', () => {
    // Early November the sun runs about 16 minutes fast: by noon UTC it is 4 degrees west.
    expect(subsolarPoint(utc('2026-11-03T12:00')).longitude).toBeCloseTo(-4.1, 1);
    // Mid February it runs about 14 minutes slow: still 3.5 degrees east.
    expect(subsolarPoint(utc('2026-02-11T12:00')).longitude).toBeCloseTo(3.5, 1);
    // Midnight UTC puts it on the date line.
    expect(Math.abs(subsolarPoint(utc('2026-06-15T00:00')).longitude)).toBeGreaterThan(179);
  });
});

describe('sunAltitude', () => {
  // Published: London, 21 June 2026, sunrise 04:43 and sunset 21:21 BST.
  const london = { latitude: 51.5074, longitude: -0.1278 };

  it('puts the sun on the horizon at a published sunrise and sunset', () => {
    // -0.83 degrees: the sun's upper edge, lifted by refraction.
    expect(sunAltitude(utc('2026-06-21T03:43'), london)).toBeCloseTo(-0.9, 0);
    expect(sunAltitude(utc('2026-06-21T20:21'), london)).toBeCloseTo(-0.8, 0);
  });

  it('reaches 90 minus latitude plus declination at noon', () => {
    expect(sunAltitude(utc('2026-06-21T12:02'), london)).toBeCloseTo(61.94, 1);
  });
});
