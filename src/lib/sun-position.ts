export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const DEG = Math.PI / 180;

function wrap180(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

/**
 * Where on Earth the sun is straight overhead at a moment. The low-precision
 * solar formulas (Astronomical Almanac), good to about a hundredth of a degree
 * this century: far finer than a globe on a screen can show.
 */
export function subsolarPoint(date: Date): GeoPoint {
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
  const anomaly = (357.529 + 0.98560028 * days) * DEG;
  const meanLongitude = 280.459 + 0.98564736 * days;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * DEG;
  const obliquity = (23.439 - 0.00000036 * days) * DEG;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude)
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealHours = 18.697374558 + 24.06570982441908 * days;
  // Overhead where the local sidereal time equals the sun's right ascension.
  return {
    latitude: declination / DEG,
    longitude: wrap180(rightAscension / DEG - siderealHours * 15),
  };
}

/** The sun's height above the horizon at a place, in degrees; negative below it. */
export function sunAltitude(date: Date, place: GeoPoint): number {
  const sun = subsolarPoint(date);
  const a = place.latitude * DEG;
  const b = sun.latitude * DEG;
  const dLon = (place.longitude - sun.longitude) * DEG;
  return Math.asin(Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(dLon)) / DEG;
}
