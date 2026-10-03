import { subsolarPoint } from './sun-position';
import type { GeoPoint } from './sun-position';

const DEG = Math.PI / 180;

const wrap180 = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

export interface PrayerLine {
  /** The line, south to north, in pieces where it leaves the latitudes it reaches. */
  pieces: GeoPoint[][];
  /** Where it crosses the mosque's latitude, or null if it does not reach it. */
  crossing: GeoPoint | null;
}

/**
 * Where on Earth it is, this minute, the moment a prayer begins at the mosque.
 *
 * At the prayer's time the sun stands at some height over the mosque, before
 * or after noon. Everywhere the sun stands at that height now, on the same
 * side of noon, is a line; it travels west as the Earth turns and crosses the
 * mosque exactly at the prayer's time, whatever rule or table the time came
 * from. Dhuhr is the sun at its highest, which no line of equal height
 * crosses, so its line is the meridian where it is that moment past noon.
 */
export function prayerLine(place: GeoPoint, at: Date, now: Date, meridian: boolean): PrayerLine {
  const then = subsolarPoint(at);
  const sun = subsolarPoint(now);
  // The mosque's hour angle at the prayer: negative before noon, positive after.
  const hour = wrap180(place.longitude - then.longitude);

  if (meridian) {
    const longitude = wrap180(sun.longitude + hour);
    const piece: GeoPoint[] = [];
    for (let latitude = -88; latitude <= 88; latitude += 2) piece.push({ latitude, longitude });
    return { pieces: [piece], crossing: { latitude: place.latitude, longitude } };
  }

  const phi = place.latitude * DEG;
  const height =
    Math.sin(phi) * Math.sin(then.latitude * DEG) +
    Math.cos(phi) * Math.cos(then.latitude * DEG) * Math.cos(hour * DEG);
  const side = hour < 0 ? -1 : 1;
  const delta = sun.latitude * DEG;

  /** The longitude on this latitude where the sun now stands at that height, on that side. */
  const at_ = (latitude: number): number | null => {
    const lat = latitude * DEG;
    const c = (height - Math.sin(lat) * Math.sin(delta)) / (Math.cos(lat) * Math.cos(delta));
    if (c < -1 || c > 1) return null;
    return wrap180(sun.longitude + (side * Math.acos(c)) / DEG);
  };

  const pieces: GeoPoint[][] = [];
  let piece: GeoPoint[] = [];
  for (let latitude = -89; latitude <= 89; latitude += 1) {
    const longitude = at_(latitude);
    if (longitude === null) {
      if (piece.length) pieces.push(piece);
      piece = [];
      continue;
    }
    piece.push({ latitude, longitude });
  }
  if (piece.length) pieces.push(piece);

  const crossingLongitude = at_(place.latitude);
  return {
    pieces,
    crossing: crossingLongitude === null ? null : { latitude: place.latitude, longitude: crossingLongitude },
  };
}
