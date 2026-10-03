'use client';

import { useEffect, useId, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { siderealDegrees, subsolarPoint } from '@/lib/sun-position';
import type { GeoPoint } from '@/lib/sun-position';
import { prayerLine } from '@/lib/prayer-lines';

/**
 * The Earth from orbit, as it is this minute: NASA's satellite picture where
 * the sun is up, city lights where it is down, drifting clouds that cast their
 * shadows, a glint on the sea, and the line where the sun is rising or
 * setting. The camera never leaves the mosque; the sun, the night and the
 * prayer lines travel round it in real time.
 *
 * Plain WebGL 1, so it runs on any TV browser: one quad, and a fragment shader
 * that casts a ray into a sphere for each pixel. Fifteen frames a second at
 * most, on a canvas no bigger than it needs to be.
 */

const DEG = Math.PI / 180;
/** Camera distance in Earth radii: enough perspective to read as a ball. */
const DISTANCE = 3.6;
const FRAME_MS = 1000 / 15;
/** The drawing buffer's longest side. Past this a TV's GPU pays for detail nobody sees. */
const MAX_BUFFER = 2560;
/** Seconds to glide from one view to the next. */
const ZOOM_SECONDS = 4;
/** The mosque's beam of light: its height in Earth radii, the ring round its foot in pixels, a ripple's seconds. */
const BEAM_HEIGHT = 0.1;
const RING_PIXELS = 14;
const RIPPLE_SECONDS = 2.6;
/** How far above the mosque, in pixels, a prayer line's label rides, at any zoom. */
const LABEL_PIXELS = 80;
/** Where the Earth sits until the theme says otherwise. */
const HOME_FRAME: EarthFrame = { cx: 0.5, cy: 0.5, r: 0.45, pinX: 0.5, pinY: 0.5 };
/** How fast the clouds drift east, in degrees a second: slow enough to be weather, quick enough to see. */
const CLOUD_DRIFT = 0.15;
/**
 * The shader's clock loops so it never loses precision on a screen left on
 * for months. Every rate in the shader is a multiple of 0.1 a second, so each
 * wave is back where it started when the loop closes.
 */
const LOOP_SECONDS = 20 * Math.PI;

type Vec = [number, number, number];

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** x to 0°E on the equator, y to 90°E, z to the north pole. */
const toVec = ({ latitude, longitude }: GeoPoint): Vec => [
  Math.cos(latitude * DEG) * Math.cos(longitude * DEG),
  Math.cos(latitude * DEG) * Math.sin(longitude * DEG),
  Math.sin(latitude * DEG),
];

/** The point `distance` degrees from `from`, setting off on `bearing` (degrees from north). */
function destination(from: GeoPoint, bearing: number, distance: number): GeoPoint {
  const lat = from.latitude * DEG;
  const b = bearing * DEG;
  const d = distance * DEG;
  const lat2 = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(b));
  const lon2 =
    from.longitude * DEG +
    Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(lat2));
  return { latitude: lat2 / DEG, longitude: lon2 / DEG };
}

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 centre;
uniform float focal;
uniform float distance;
uniform vec3 right;
uniform vec3 up;
uniform vec3 forward;
uniform vec3 sun;
uniform float time;
uniform float cloudShift;
uniform float cloudAmount;
uniform float skyTurn;
// Where the theme's text sits, in buffer pixels: the Earth gives way to the sky
// left of x and above y (GL coordinates), over a fade of z and w pixels.
uniform vec4 clearZone;
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D cloudMap;
uniform sampler2D reliefMap;
uniform sampler2D detailMap;
uniform sampler2D detailLights;
// The sharp tiles round the mosque: west edge and north edge (radians), span, and 1 once loaded.
uniform vec4 detail;
const float PI = 3.14159265;

// Random values that repeat every period cells, so a pattern can wrap round
// the globe and the two longitude unwraps below agree.
float hash(vec2 p, vec2 period) {
  vec3 q = fract(vec3(mod(p, period).xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p, vec2 period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i, period), hash(i + vec2(1.0, 0.0), period), f.x), mix(hash(i + vec2(0.0, 1.0), period), hash(i + vec2(1.0, 1.0), period), f.x), f.y);
}

// The night sky behind the Earth, d a direction in the Earth's frame and px
// the angle one pixel spans. The sky turns with the hour; the Milky Way lies
// where it really is, brightest toward the galaxy's centre.
vec3 sky(vec3 d, float px) {
  float c = cos(skyTurn);
  float s = sin(skyTurn);
  vec3 q = vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z);
  float band = dot(q, vec3(-0.8676, -0.1980, 0.4560));
  float core = max(dot(q, vec3(-0.0550, -0.8734, -0.4839)), 0.0);
  float wisps = 0.55 + 0.25 * sin(q.x * 9.0 + 1.3) * sin(q.y * 11.0 + 0.7) + 0.2 * sin(q.z * 13.0 + q.x * 5.0);
  float milky = exp(-band * band / 0.018) * wisps * (0.5 + 0.8 * core * core);
  vec3 color = vec3(0.36, 0.42, 0.62) * milky * 0.16;
  // Stars, evenly spread: each face of a cube round the sky is a grid with at
  // most one star a cell, more of them along the Milky Way.
  vec3 a = abs(q);
  vec3 f = a.x >= a.y && a.x >= a.z ? vec3(q.yz / a.x, q.x > 0.0 ? 0.0 : 1.0)
    : a.y >= a.z ? vec3(q.xz / a.y, q.y > 0.0 ? 2.0 : 3.0)
    : vec3(q.xy / a.z, q.z > 0.0 ? 4.0 : 5.0);
  for (int layer = 0; layer < 2; layer++) {
    float cells = layer == 0 ? 260.0 : 70.0;
    vec2 p = (f.xy * 0.5 + 0.5) * cells;
    vec2 cell = floor(p);
    vec2 seed = cell + f.z * 977.0 + float(layer) * 53.0;
    float h = hash(seed, vec2(8192.0));
    float chance = layer == 0 ? 0.24 + 0.3 * milky : 0.12;
    if (h < chance) {
      vec2 spot = vec2(hash(seed + 11.0, vec2(8192.0)), hash(seed + 23.0, vec2(8192.0))) * 0.7 + 0.15;
      // How far, in pixels: a cube face spans about two radians.
      float dist = length(p - cell - spot) * 2.0 / cells / px;
      float bright = layer == 0 ? 0.35 + 0.65 * h / chance : 0.8 + 0.6 * h / chance;
      float twinkle = 0.8 + 0.2 * sin(time * 1.7 + h * 60.0);
      vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.88, 0.72), hash(seed + 37.0, vec2(8192.0)));
      float size = layer == 0 ? 0.75 : 1.15;
      color += tint * bright * twinkle * exp(-dist * dist / (size * size));
    }
  }
  return color;
}

void main() {
  vec2 o = gl_FragCoord.xy - centre;
  vec3 dir = normalize(right * o.x + up * o.y - forward * focal);
  vec3 eye = forward * distance;
  float b = dot(eye, dir);
  // How near the ray passes the Earth's centre, and one pixel's width at the edge.
  float closest = sqrt(max(distance * distance - b * b, 0.0));
  float pixel = sqrt(distance * distance - 1.0) / focal;
  float cover = clamp((1.0 - closest) / pixel + 0.5, 0.0, 1.0);

  // The air: a bright thin rim and a wide soft glow, blue where the edge is in
  // daylight and flushed orange where it sees the sun set.
  vec3 limb = normalize(eye - dir * b);
  float limbSun = dot(limb, sun);
  float beyond = max(closest - 1.0, 0.0);
  float halo = (exp(-beyond * 55.0) + 0.35 * exp(-beyond * 12.0)) * (0.12 + 0.88 * smoothstep(-0.35, 0.45, limbSun));
  vec3 tint = mix(vec3(1.0, 0.5, 0.22), vec3(0.4, 0.66, 1.0), smoothstep(-0.12, 0.3, limbSun));
  vec3 air = tint * halo;
  // Under the clock and the table the Earth gives way to the night sky.
  float shown = smoothstep(clearZone.x - clearZone.z * 0.5, clearZone.x + clearZone.z * 0.5, gl_FragCoord.x)
    * (1.0 - smoothstep(clearZone.y - clearZone.w * 0.5, clearZone.y + clearZone.w * 0.5, gl_FragCoord.y));
  if (cover <= 0.0 || shown <= 0.0) {
    float glow = cover <= 0.0 ? min(halo, 1.0) * shown : 0.0;
    vec3 stars = sky(dir, 1.0 / focal) * (1.0 - glow);
    gl_FragColor = vec4((cover <= 0.0 ? air * shown : vec3(0.0)) + stars, max(glow, max(stars.r, max(stars.g, stars.b))));
    return;
  }

  float t = -b - sqrt(max(b * b - (distance * distance - 1.0), 0.0));
  vec3 n = normalize(eye + dir * t);
  vec3 view = -dir;
  float lat = asin(clamp(n.z, -1.0, 1.0));
  float lon = atan(n.y, n.x);
  // Two ways to unwrap longitude, seamed at opposite meridians; each 2x2 block
  // of pixels takes the one without a seam through it, so no line shows.
  float u1 = lon / (2.0 * PI) + 0.5;
  float u2 = fract(u1 + 0.5) - 0.5;
  float u = fwidth(u1) <= fwidth(u2) + 1e-6 ? u1 : u2;
  vec2 uv = vec2(u, 0.5 - lat / PI);
  vec3 land = texture2D(dayMap, uv).rgb;
  // Near the mosque, the sharp tiles take over, fading in from their edges.
  vec2 near = vec2(mod(lon - detail.x + 2.0 * PI, 2.0 * PI), detail.y - lat) / detail.z;
  vec3 sharp = texture2D(detailMap, clamp(near, 0.0, 1.0)).rgb;
  vec2 edge = smoothstep(0.0, 0.04, near) * smoothstep(0.0, 0.04, 1.0 - near);
  float sharpness = detail.w * edge.x * edge.y;
  land = mix(land, sharp, sharpness);
  // The map is painted: land by height and climate, the sea by its depth.
  // Water is where blue outweighs red, which no colour of the land does.
  float water = clamp((land.b - land.r) * 4.0 - 0.4, 0.0, 1.0);
  float grey = dot(land, vec3(0.299, 0.587, 0.114));
  // Each patch of the map keeps its own beat: cities twinkle, the sea shimmers.
  float phase = 6.2832 * noise(uv * vec2(720.0, 360.0), vec2(720.0, 360.0));
  float ripple = 0.78 + 0.22 * sin(time * 0.9 + phase);
  // City lights, the faint ones fainter so each town reads as a point, and a
  // warm haze round them where they crowd together.
  float glow = mix(texture2D(nightMap, uv).r, texture2D(detailLights, clamp(near, 0.0, 1.0)).r, sharpness);
  glow *= (0.55 + 0.45 * glow) * (0.85 + 0.15 * sin(time * 1.3 + phase));
  float haze = texture2D(nightMap, uv, 2.0).r;

  // s is the sine of the sun's height here: 0 on the sunrise and sunset line,
  // -0.31 at 18 degrees below, where twilight ends and the night of Isha begins.
  float s = dot(n, sun);
  float day = smoothstep(-0.012, 0.045, s);
  // The night keeps its shape under a cool light from the far side of the sky,
  // as if the moon were full: none at dusk, most at midnight.
  float moon = smoothstep(0.0, 0.35, -s);
  vec3 east = normalize(cross(vec3(0.0, 0.0, 1.0), n) + vec3(1e-5, 0.0, 0.0));
  vec3 north = cross(n, east);

  // Clouds float above the ground, higher than life so it shows: each pixel
  // sees the cloud a little toward the camera, and the ground is shaded by the
  // cloud toward the sun, so shadows lengthen as the sun sinks.
  vec2 perRadian = vec2(1.0 / (max(cos(lat), 0.2) * 2.0 * PI), -1.0 / PI);
  vec2 cuv = vec2(uv.x - cloudShift, uv.y);
  vec2 seen = cuv + vec2(dot(view, east), dot(view, north)) / max(dot(view, n), 0.25) * perRadian * 0.004;
  vec2 caster = cuv + vec2(dot(sun, east), dot(sun, north)) / max(s, 0.08) * perRadian * 0.004;
  float thick = texture2D(cloudMap, seen).r;
  float cloud = smoothstep(0.06, 0.85, thick);
  float shade = smoothstep(0.06, 0.85, texture2D(cloudMap, caster, 1.5).r);
  // Their tops are rounded: the side facing the light is bright, the other
  // dim. The slope is read across a blurred copy, either side of the pixel,
  // so only the big shapes show and no texel edges.
  vec2 reach = max(fwidth(seen) * 6.0, vec2(8.0 / 4096.0, 8.0 / 2048.0));
  float acrossEast = texture2D(cloudMap, seen + vec2(reach.x, 0.0), 2.0).r - texture2D(cloudMap, seen - vec2(reach.x, 0.0), 2.0).r;
  float acrossNorth = texture2D(cloudMap, seen - vec2(0.0, reach.y), 2.0).r - texture2D(cloudMap, seen + vec2(0.0, reach.y), 2.0).r;
  vec3 puff = normalize(n * 0.5 - east * acrossEast - north * acrossNorth);

  // Relief: mountains on land and ridges under the sea, steeper than life so
  // they show from orbit.
  vec3 rise = texture2D(reliefMap, uv).rgb * 2.0 - 1.0;
  vec3 bent = normalize((east * rise.x + north * rise.y) * 1.4 + n * rise.z);
  float facing = dot(bent, sun);

  // Day: a warm sun wrapping a little past the edge of each slope, and a cool
  // sky filling the shade, so every fold reads as a shape. The sea's surface
  // is flat; the ridges below it only shade its colour.
  float key = clamp((facing + 0.25) / 1.25, 0.0, 1.0);
  key = mix(key, clamp((s + 0.25) / 1.25, 0.0, 1.0) * (1.0 + 0.9 * (facing - s)), water);
  vec3 lit = land * (vec3(1.0, 0.94, 0.84) * key + vec3(0.14, 0.2, 0.32) * (0.55 + 0.45 * dot(bent, n)));
  lit *= 1.0 - min(shade * 0.45 * cloudAmount, 0.9) * day;
  // The sun on the water: a broad warm glint that ripples, and the sky
  // reflected toward the Earth's edge.
  float glint = pow(max(dot(n, normalize(sun + view)), 0.0), 70.0) * water * ripple * (1.0 - cloud);
  float fresnel = pow(1.0 - max(dot(n, view), 0.0), 5.0);
  lit += vec3(1.0, 0.86, 0.6) * glint * 0.7 + vec3(0.45, 0.72, 1.0) * fresnel * water * 0.3;

  // Night: the land in moonlit indigo with its mountains still showing, the
  // shallow seas faintly teal, and the cities burning gold.
  float moonGround = clamp(mix(dot(bent, -sun), -s, water), 0.0, 1.0);
  float sheen = pow(max(dot(n, normalize(view - sun)), 0.0), 60.0) * water * ripple * (1.0 - cloud);
  // Under the moon only the big shapes of the ground show, from a softer copy
  // of the map; the city lights are the detail.
  vec3 dim = texture2D(dayMap, uv, 1.5).rgb;
  vec3 moonLand = mix(mix(vec3(dot(dim, vec3(0.299, 0.587, 0.114))), dim, 0.35) * vec3(0.45, 0.6, 1.0), dim * vec3(0.3, 0.45, 0.9), water);
  vec3 night = moonLand * (0.12 + 0.5 * moon * pow(moonGround, 0.7));
  night += vec3(0.45, 0.58, 0.85) * sheen * moon * 0.25;
  night += (glow * vec3(1.0, 0.78, 0.45) * 1.6 + haze * vec3(1.0, 0.55, 0.2) * 0.9) * (1.0 - cloud * 0.75);
  float twilight = smoothstep(-0.31, 0.0, s) * (1.0 - day);
  vec3 dusk = land * mix(vec3(0.14, 0.14, 0.3), vec3(0.45, 0.28, 0.25), smoothstep(-0.1, 0.0, s)) + vec3(0.05, 0.03, 0.09);
  vec3 color = mix(night, dusk, twilight * twilight);
  color = mix(color, lit, day);
  // Golden hour: a warm band along the line where the sun is rising or setting.
  color += vec3(0.95, 0.58, 0.2) * exp(-pow((s - 0.015) / 0.05, 2.0)) * 0.16 * (1.0 - cloud);

  // Clouds: white in the sun with lavender shade, catching the orange of
  // sunset, silver under the moon, and lit amber from below by a city.
  // The sunset glow lingers a little after the sun has gone, not long.
  float sunset = exp(-pow(s / (s < 0.0 ? 0.035 : 0.12), 2.0));
  float puffLight = pow(clamp(dot(puff, sun) * 1.1, 0.0, 1.0), 0.6);
  vec3 cloudDay = mix(vec3(0.6, 0.66, 0.85), vec3(1.04, 1.02, 0.98), puffLight);
  vec3 cloudNight = vec3(0.24, 0.29, 0.42) * (0.3 + 0.95 * moon * clamp(dot(puff, -sun), 0.0, 1.0));
  cloudNight += haze * vec3(1.0, 0.55, 0.22) * 1.2;
  vec3 cloudColor = mix(cloudNight, cloudDay, day) + vec3(1.0, 0.48, 0.22) * sunset * 0.45;
  color = mix(color, cloudColor, clamp(cloud * 0.92 * cloudAmount, 0.0, 1.0));

  float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
  color = mix(color, tint, rim * (0.12 + 0.5 * day));
  float alpha = max(cover, min(halo, 1.0)) * shown;
  vec3 back = alpha < 1.0 ? sky(dir, 1.0 / focal) * (1.0 - alpha) : vec3(0.0);
  gl_FragColor = vec4(mix(air, color, cover) * shown + back, alpha + max(back.r, max(back.g, back.b)));
}
`;

export interface EarthFrame {
  /** The Earth's centre, as fractions of the box's width and height. */
  cx: number;
  cy: number;
  /** Its radius, as a fraction of the box's shorter side. */
  r: number;
  /** Where the mosque sits, as fractions of the box's width and height. */
  pinX: number;
  pinY: number;
}

export interface EarthLine {
  /** Matches the HTML label for it: data-pin={`line-${id}`}. */
  id: string;
  /** When the prayer begins at the mosque, in ms since the epoch. */
  at: number;
  /** Dhuhr: the meridian, since no line of equal sun height crosses noon. */
  meridian: boolean;
  strong: boolean;
}

export interface EarthViewProps {
  place: (GeoPoint & { name: string }) | null;
  /** The views, from the whole Earth to closest in on the mosque. */
  levels: EarthFrame[];
  /** Which of them to show; the Earth glides from one to the next. */
  level: number;
  lines: EarthLine[];
  /** Where the theme's text sits, as fractions of the box: pins there are hidden. */
  clear: { left: number; top: number };
  /**
   * HTML markers: an element with data-pin="place", "sun" or "line-<id>"
   * rides on that point, with --west set to the screen direction of west.
   * One with data-beam-label rides on the top of the beam.
   */
  children?: ReactNode;
}

interface View {
  cx: number;
  cy: number;
  focal: number;
  distance: number;
  forward: Vec;
  up: Vec;
  right: Vec;
}

/** Where the camera looks, so the mosque lands on its pin; in CSS pixels. */
function viewFor(place: GeoPoint | null, frame: EarthFrame, width: number, height: number, distance: number): View {
  const radius = frame.r * Math.min(width, height);
  const cx = frame.cx * width;
  const cy = frame.cy * height;
  const home = place ?? { latitude: 35, longitude: 15 };
  const focal = radius * Math.sqrt(distance * distance - 1);
  // From the mosque, step back the way the pin lies from the Earth's centre,
  // by the angle that perspective puts at that distance on the screen:
  // focal * sin(a) / (distance - cos(a)) = the pin's distance from the centre.
  const dx = frame.pinX * width - cx;
  const dy = frame.pinY * height - cy;
  const k = Math.hypot(dx, dy) / focal;
  const angle = Math.asin(Math.min(1, (k * distance) / Math.sqrt(1 + k * k))) - Math.atan(k);
  const away = Math.min(angle, Math.acos(1 / distance) - 0.08);
  const centre = place ? destination(home, Math.atan2(dx, -dy) / DEG + 180, away / DEG) : home;
  const forward = toVec(centre);
  const north: Vec = Math.abs(forward[2]) > 0.999 ? [1, 0, 0] : [0, 0, 1];
  const along = dot(north, forward);
  const up = unit([north[0] - along * forward[0], north[1] - along * forward[1], north[2] - along * forward[2]]);
  return { cx, cy, focal, distance, forward, up, right: cross(up, forward) };
}

/** A point in space, in Earth radii, onto the screen; z is how far it lies toward the camera. */
function projectVec(view: View, p: Vec): { x: number; y: number; z: number } {
  const z = dot(p, view.forward);
  const depth = view.distance - z;
  return {
    x: view.cx + (view.focal * dot(p, view.right)) / depth,
    y: view.cy - (view.focal * dot(p, view.up)) / depth,
    z,
  };
}

function project(view: View, point: GeoPoint): { x: number; y: number; visible: boolean } {
  const at = projectVec(view, toVec(point));
  // In front of the cone that grazes the Earth, and clear of the very edge.
  return { x: at.x, y: at.y, visible: at.z > 1 / view.distance + 0.06 };
}

const levelAt = (levels: EarthFrame[], index: number): EarthFrame =>
  levels[Math.max(0, Math.min(levels.length - 1, index))] ?? HOME_FRAME;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mixFrames = (a: EarthFrame, b: EarthFrame, t: number): EarthFrame => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  r: a.r + (b.r - a.r) * t,
  pinX: a.pinX + (b.pinX - a.pinX) * t,
  pinY: a.pinY + (b.pinY - a.pinY) * t,
});

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export function EarthView({ place, levels, level, lines, clear, children }: EarthViewProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const latest = useRef({ place, levels, level, lines, clear });
  const beamFade = `beam-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    latest.current = { place, levels, level, lines, clear };
  });

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!box || !canvas || !svg) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
    });
    // No WebGL, or no derivatives: the times still show, the Earth does not.
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);

    // Images that arrive after the view has gone touch nothing.
    let alive = true;
    const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
    const textures: WebGLTexture[] = [];
    let pending = 4;
    const load = (unitIndex: number, sampler: string, url: string, format: number) => {
      const texture = gl.createTexture();
      if (!texture) return;
      textures.push(texture);
      gl.uniform1i(uniform(sampler), unitIndex);
      const image = new Image();
      image.onload = () => {
        if (!alive) return;
        gl.activeTexture(gl.TEXTURE0 + unitIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (anisotropy) {
          const most = gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
          gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most));
        }
        pending -= 1;
      };
      image.src = url;
    };
    // As sharp as the GPU can hold and the screen can show; a small TV, or a
    // thumbnail in the settings, gets the light set.
    const most = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const shown = box.getBoundingClientRect();
    const span = Math.max(shown.width, shown.height) * Math.min(window.devicePixelRatio || 1, 2);
    const size = most >= 4096 && span > 1100 ? 4096 : 2048;
    load(0, 'dayMap', `/globe/earth-day-${size}.jpg`, gl.RGB);
    load(1, 'nightMap', `/globe/earth-night-${size}.jpg`, gl.LUMINANCE);
    // The clouds drift round the whole globe, so they cannot come in tiles:
    // a screen and GPU that can take it get them at twice the detail.
    const cloudSize = size === 4096 && most >= 8192 ? 8192 : size;
    load(2, 'cloudMap', `/globe/earth-clouds-${cloudSize}.jpg`, gl.LUMINANCE);
    load(3, 'reliefMap', `/globe/earth-relief-${size}.jpg`, gl.RGB);

    // The nine 30-degree tiles round the mosque, map and city lights, each
    // stitched into one texture: sharp where the camera goes close. Both go
    // to the GPU together once all eighteen have arrived.
    gl.uniform4f(uniform('detail'), 0, 0, 1, 0);
    gl.uniform1i(uniform('detailMap'), 4);
    gl.uniform1i(uniform('detailLights'), 5);
    const home = latest.current.place;
    if (home) {
      const col = Math.floor((home.longitude + 180) / 30);
      const row = Math.min(4, Math.max(1, Math.floor((90 - home.latitude) / 30)));
      const sheets = [
        { folder: 'tiles', unit: 4, format: gl.RGB },
        { folder: 'lights', unit: 5, format: gl.LUMINANCE },
      ].map((spec) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const texture = gl.createTexture();
        if (texture) textures.push(texture);
        return { ...spec, canvas, paint: canvas.getContext('2d'), texture };
      });
      let waiting = 18;
      const upload = () => {
        for (const sheet of sheets) {
          if (!sheet.texture) return;
          gl.activeTexture(gl.TEXTURE0 + sheet.unit);
          gl.bindTexture(gl.TEXTURE_2D, sheet.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, sheet.format, sheet.format, gl.UNSIGNED_BYTE, sheet.canvas);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          sheet.canvas.width = 0;
        }
        const west = ((col - 1) * 30 - 180) * DEG;
        const north = (90 - (row - 1) * 30) * DEG;
        gl.uniform4f(uniform('detail'), west, north, 90 * DEG, 1);
      };
      for (const sheet of sheets) {
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const image = new Image();
            const tileRow = row - 1 + dy;
            const tileCol = (((col - 1 + dx) % 12) + 12) % 12;
            image.onload = () => {
              if (!alive) return;
              sheet.paint?.drawImage(image, (dx * size) / 3, (dy * size) / 3, size / 3, size / 3);
              waiting -= 1;
              if (waiting === 0) upload();
            };
            image.src = `/globe/${sheet.folder}/${tileRow}-${tileCol}.jpg`;
          }
        }
      }
    }

    const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');
    const started = performance.now();
    // The level the view is heading for, where it set off from, and how far along.
    let heading = latest.current.level;
    let framed = levelAt(latest.current.levels, heading);
    let glideFrom: EarthFrame | null = null;
    let glide = 1;
    let last = -Infinity;
    let frameId = 0;

    const draw = (now: number) => {
      frameId = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      const step = Math.min(1, (now - last) / 1000);
      last = now;

      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      // Drawn at the size it shows: a thumbnail scaled down in the settings
      // needs a small canvas, not a TV-sized one.
      const scale = Math.min(1, box.getBoundingClientRect().width / width);
      const ratio = Math.min((window.devicePixelRatio || 1) * scale, MAX_BUFFER / Math.max(width, height));
      const bw = Math.round(width * ratio);
      const bh = Math.round(height * ratio);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      const { place: here, levels, level: levelWanted, lines: wanted, clear: keepOut } = latest.current;
      const still = stillness.matches;
      // A new level: glide there from wherever the view is now; a still screen just cuts.
      const target = Math.round(levelWanted);
      if (target !== heading) {
        glideFrom = framed;
        heading = target;
        glide = 0;
      }
      glide = still ? 1 : Math.min(1, glide + step / ZOOM_SECONDS);
      const goal = levelAt(levels, heading);
      framed = glideFrom && glide < 1 ? mixFrames(glideFrom, goal, ease(glide)) : goal;
      const view = viewFor(here, framed, width, height, DISTANCE);
      // How many pixels a degree of the Earth spans here, so marks keep their size at any zoom.
      const perDegree = framed.r * Math.min(width, height) * DEG;
      // Closest in, the clouds thin out so the city and its line show plainly.
      const deepest = levelAt(levels, levels.length - 1).r;
      const nextDeepest = levelAt(levels, levels.length - 2).r;
      const thin = deepest > nextDeepest ? Math.min(1, Math.max(0, (framed.r - nextDeepest) / (deepest - nextDeepest))) : 0;
      const date = new Date();
      const sunPoint = subsolarPoint(date);
      const seconds = still ? 0 : (now - started) / 1000;

      if (pending === 0) {
        gl.viewport(0, 0, bw, bh);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniform('centre'), view.cx * ratio, bh - view.cy * ratio);
        gl.uniform1f(uniform('focal'), view.focal * ratio);
        gl.uniform1f(uniform('distance'), view.distance);
        gl.uniform1f(uniform('cloudAmount'), 1 - 0.6 * thin);
        gl.uniform1f(uniform('skyTurn'), siderealDegrees(date) * DEG);
        gl.uniform4f(
          uniform('clearZone'),
          keepOut.left > 0 ? keepOut.left * bw : -1e4,
          keepOut.top > 0 ? bh - keepOut.top * bh : 1e5,
          0.08 * bw,
          0.08 * bh
        );
        gl.uniform3fv(uniform('right'), view.right);
        gl.uniform3fv(uniform('up'), view.up);
        gl.uniform3fv(uniform('forward'), view.forward);
        gl.uniform3fv(uniform('sun'), toVec(sunPoint));
        gl.uniform1f(uniform('time'), seconds % LOOP_SECONDS);
        gl.uniform1f(uniform('cloudShift'), ((seconds * CLOUD_DRIFT) / 360) % 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        canvas.style.opacity = '1';
      }

      // The prayer lines, drawn over the Earth where they face us.
      const points: Record<string, GeoPoint | null> = { place: here, sun: sunPoint };
      for (const path of svg.querySelectorAll<SVGPathElement>('path[data-line]')) {
        const spec = wanted.find((line) => line.id === path.dataset.line);
        if (!spec || !here || pending > 0) {
          path.setAttribute('d', '');
          continue;
        }
        const line = prayerLine(here, new Date(spec.at), date, spec.meridian, Math.min(6, Math.max(0.5, LABEL_PIXELS / perDegree)));
        let d = '';
        for (const piece of line.pieces) {
          let open = false;
          for (const point of piece) {
            const at = project(view, point);
            if (!at.visible) {
              open = false;
              continue;
            }
            d += `${open ? 'L' : 'M'}${at.x.toFixed(1)} ${at.y.toFixed(1)}`;
            open = true;
          }
        }
        path.setAttribute('d', d);
        points[`line-${spec.id}`] = line.label;
      }

      // The mosque's beam: a ring on the ground with a ripple, and a light rising from it.
      const beamGroup = svg.querySelector<SVGGElement>('[data-beam]');
      const beamLabel = box.querySelector<HTMLElement>('[data-beam-label]');
      let beamTop: { x: number; y: number } | null = null;
      let beamFoot: { x: number; y: number } | null = null;
      if (beamGroup) {
        const foot = here ? project(view, here) : null;
        const on = !!foot && foot.visible && pending === 0 && foot.x >= keepOut.left * width && foot.y >= keepOut.top * height;
        beamGroup.style.opacity = on ? '1' : '0';
        if (beamLabel) beamLabel.style.opacity = on ? '1' : '0';
        if (here && foot && on) {
          const v = toVec(here);
          const lift = 1 + BEAM_HEIGHT;
          const top = projectVec(view, [v[0] * lift, v[1] * lift, v[2] * lift]);
          for (const ray of beamGroup.querySelectorAll<SVGLineElement>('line')) {
            ray.setAttribute('x1', foot.x.toFixed(1));
            ray.setAttribute('y1', foot.y.toFixed(1));
            ray.setAttribute('x2', top.x.toFixed(1));
            ray.setAttribute('y2', top.y.toFixed(1));
          }
          const fade = beamGroup.querySelector('linearGradient');
          fade?.setAttribute('x1', foot.x.toFixed(1));
          fade?.setAttribute('y1', foot.y.toFixed(1));
          fade?.setAttribute('x2', top.x.toFixed(1));
          fade?.setAttribute('y2', top.y.toFixed(1));
          const ring = (radius: number) => {
            let d = '';
            for (let bearing = 0; bearing < 360; bearing += 15) {
              const at = project(view, destination(here, bearing, radius));
              d += `${d ? 'L' : 'M'}${at.x.toFixed(1)} ${at.y.toFixed(1)}`;
            }
            return `${d}Z`;
          };
          const ripple = (seconds % RIPPLE_SECONDS) / RIPPLE_SECONDS;
          const ringDegrees = RING_PIXELS / perDegree;
          beamGroup.querySelector('[data-beam-ring]')?.setAttribute('d', ring(ringDegrees));
          const pulse = beamGroup.querySelector<SVGPathElement>('[data-beam-pulse]');
          pulse?.setAttribute('d', still ? '' : ring(ringDegrees * (1 + 1.8 * ripple)));
          pulse?.setAttribute('opacity', (0.9 * (1 - ripple)).toFixed(2));
          const dot = beamGroup.querySelector('[data-beam-dot]');
          dot?.setAttribute('cx', foot.x.toFixed(1));
          dot?.setAttribute('cy', foot.y.toFixed(1));
          beamTop = top;
          beamFoot = foot;
        }
      }

      for (const element of box.querySelectorAll<HTMLElement>('[data-pin]')) {
        const point = points[element.dataset.pin ?? ''];
        if (!point || pending > 0) {
          element.style.opacity = '0';
          continue;
        }
        const at = project(view, point);
        // Which way is west on screen here: the way the lines are travelling.
        const ahead = project(view, { latitude: point.latitude, longitude: point.longitude - 2 });
        element.style.setProperty('--west', `${Math.atan2(ahead.y - at.y, ahead.x - at.x)}rad`);
        element.style.transform = `translate(${at.x}px, ${at.y}px)`;
        const behindText = at.x < keepOut.left * width || at.y < keepOut.top * height;
        element.style.opacity = at.visible && !behindText ? '1' : '0';
      }

      // The city's name never sits on a prayer line's label: it takes the first
      // free spot round its beam, left or right of the top, else below the ring.
      if (beamLabel && beamTop && beamFoot) {
        const frame = box.getBoundingClientRect();
        const zoomed = frame.width / width || 1;
        const taken = Array.from(box.querySelectorAll<HTMLElement>('[data-pin^="line-"]'))
          .filter((element) => element.style.opacity === '1')
          .map((element) => element.querySelector<HTMLElement>('[data-label-box]')?.getBoundingClientRect())
          .filter((rect): rect is DOMRect => rect !== undefined)
          .map((rect) => ({
            left: (rect.left - frame.left) / zoomed,
            top: (rect.top - frame.top) / zoomed,
            right: (rect.right - frame.left) / zoomed,
            bottom: (rect.bottom - frame.top) / zoomed,
          }));
        const tag = beamLabel.firstElementChild;
        const w = tag instanceof HTMLElement ? tag.offsetWidth : 0;
        const h = tag instanceof HTMLElement ? tag.offsetHeight : 0;
        const spots = [
          { x: beamTop.x - 10 - w, y: beamTop.y - h / 2 },
          { x: beamTop.x + 10, y: beamTop.y - h / 2 },
          { x: beamFoot.x - 16 - w, y: beamFoot.y + 12 },
          { x: beamFoot.x + 16, y: beamFoot.y + 12 },
        ];
        const clash = (spot: { x: number; y: number }) =>
          taken.reduce(
            (sum, rect) =>
              sum +
              Math.max(0, Math.min(spot.x + w + 8, rect.right) - Math.max(spot.x - 8, rect.left)) *
                Math.max(0, Math.min(spot.y + h + 8, rect.bottom) - Math.max(spot.y - 8, rect.top)),
            0
          );
        const free = spots.find((spot) => clash(spot) === 0);
        const best = free ?? spots.reduce((a, b) => (clash(b) < clash(a) ? b : a));
        beamLabel.style.transform = `translate(${best.x}px, ${best.y}px)`;
      }
    };
    frameId = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      for (const texture of textures) gl.deleteTexture(texture);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  // The lines fade out under the theme's text, as the Earth does.
  const fade =
    clear.left > 0
      ? `linear-gradient(90deg, transparent ${(clear.left - 0.04) * 100}%, #000 ${(clear.left + 0.04) * 100}%)`
      : clear.top > 0
        ? `linear-gradient(180deg, transparent ${(clear.top - 0.04) * 100}%, #000 ${(clear.top + 0.04) * 100}%)`
        : undefined;
  const underText: CSSProperties = fade ? { maskImage: fade, WebkitMaskImage: fade } : {};

  return (
    <div ref={boxRef} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', opacity: 0, transition: 'opacity 1.2s ease' }}
      />
      <style>{EARTH_MOTION}</style>
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', ...underText }}>
        {lines.map((line) => (
          <g key={line.id}>
            {line.strong && (
              <path
                data-line={line.id}
                className="earth-breathe"
                fill="none"
                stroke="rgb(232 168 23 / 0.35)"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <path
              data-line={line.id}
              fill="none"
              stroke={line.strong ? '#E8A817' : 'rgb(255 255 255 / 0.5)'}
              strokeWidth={line.strong ? 2.4 : 1.5}
              strokeDasharray={line.strong ? undefined : '8 8'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
        {place && (
          <g data-beam style={{ opacity: 0, transition: 'opacity 0.6s' }}>
            <defs>
              <linearGradient id={beamFade} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#E8A817" stopOpacity={1} />
                <stop offset="1" stopColor="#FFE9B0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path data-beam-ring fill="rgb(232 168 23 / 0.18)" stroke="#E8A817" strokeWidth={1.4} />
            <path data-beam-pulse fill="none" stroke="#E8A817" strokeWidth={1.2} />
            <line stroke={`url(#${beamFade})`} strokeWidth={9} strokeLinecap="round" opacity={0.35} />
            <line stroke={`url(#${beamFade})`} strokeWidth={2.6} strokeLinecap="round" />
            <circle data-beam-dot r={3.6} fill="#FFF3D1" stroke="#E8A817" strokeWidth={2} />
          </g>
        )}
      </svg>
      {children}
    </div>
  );
}

// The next prayer's line breathes, so the eye finds it. Opacity only.
const EARTH_MOTION = `
@keyframes earth-breathe { 50% { opacity: 0.25; } }
.earth-breathe { animation: earth-breathe 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .earth-breathe { animation: none; } }
`;
