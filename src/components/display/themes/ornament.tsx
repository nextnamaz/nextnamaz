'use client';

import { useId } from 'react';
import type { CSSProperties } from 'react';

/**
 * Shared ornament primitives for the traditional themes: geometric star
 * tessellation, horseshoe arches, rosettes and aged paper. Everything is
 * drawn as SVG in its own user space and scaled to the container, so a
 * pattern shows the same number of repeats on a 4K TV and in a 160px
 * settings thumbnail.
 */

/** SVG ids must be unique per instance — several themes render at once on
 *  the settings page, and duplicate ids would cross-wire the patterns. */
function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

const FILL_LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

/** Polygon path for an n-pointed star (default: the eight-point khatam). */
export function starPath(cx: number, cy: number, outer: number, points = 8): string {
  const inner = outer * 0.5412; // two overlapping squares
  const step = Math.PI / points;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    coords.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${coords.join('L')}Z`;
}

interface StarFieldProps {
  color: string;
  opacity?: number;
  /** Repeats across the short edge. Lower = larger stars. */
  density?: number;
  strokeWidth?: number;
}

/** Interlocking star-and-diamond lattice, tiled across the whole surface. */
export function StarField({ color, opacity = 0.16, density = 7, strokeWidth = 1.6 }: StarFieldProps) {
  const id = useSvgId('starfield');
  const tile = 1000 / density;
  const star = tile * 0.42;

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <path d={starPath(tile / 2, tile / 2, star)} fill="none" stroke={color} strokeWidth={strokeWidth} />
          {/* Quarter stars on the corners interlock the tiles */}
          <path d={starPath(0, 0, star * 0.62)} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <path d={starPath(tile, 0, star * 0.62)} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <path d={starPath(0, tile, star * 0.62)} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <path d={starPath(tile, tile, star * 0.62)} fill="none" stroke={color} strokeWidth={strokeWidth} />
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

interface ArchProps {
  stroke: string;
  fill?: string;
  strokeWidth?: number;
  /** Extra inner keyline, as on carved stucco arches. */
  inner?: boolean;
  /** Light the arch from within, as if a lamp hung in it. Clipped to the
   *  arch silhouette, so there is no glowing rectangle. */
  glow?: string;
}

/**
 * Moorish horseshoe arch — the Córdoba silhouette: the arc continues past the
 * springing line before the jambs drop straight down.
 */
export function HorseshoeArch({ stroke, fill = 'none', strokeWidth = 3, inner = true, glow }: ArchProps) {
  const glowId = useSvgId('archglow');
  // User space 200 x 240 — the 5:6 proportion the arch cells are locked to,
  // so the horseshoe keeps its shape instead of stretching into a keyhole.
  // Circle centre (100,104), radius 84, springing 22° below the diameter.
  const cx = 100;
  const cy = 104;
  const r = 84;
  const base = 240;
  const a = (22 * Math.PI) / 180;
  const arc = (radius: number) => {
    const lx = cx - radius * Math.cos(a);
    const rx = cx + radius * Math.cos(a);
    const sy = cy + radius * Math.sin(a);
    return `M${lx.toFixed(1)},${base} L${lx.toFixed(1)},${sy.toFixed(1)} A${radius},${radius} 0 1 1 ${rx.toFixed(1)},${sy.toFixed(1)} L${rx.toFixed(1)},${base}`;
  };

  return (
    <svg aria-hidden viewBox="0 0 200 240" preserveAspectRatio="none" style={FILL_LAYER}>
      {glow && (
        <defs>
          <radialGradient id={glowId} cx="50%" cy="44%" r="62%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.34" />
            <stop offset="60%" stopColor={glow} stopOpacity="0.10" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      {glow && <path d={arc(r)} fill={`url(#${glowId})`} />}
      <path d={arc(r)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {inner && (
        <path d={arc(r - 11)} fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.45} opacity={0.6} />
      )}
    </svg>
  );
}

interface TileFieldProps {
  base: string;
  star: string;
  accent: string;
  density?: number;
}

/** Zellij tilework: solid cut-tile stars with the interstitial crosses. */
export function TileField({ base, star, accent, density = 6 }: TileFieldProps) {
  const id = useSvgId('zellij');
  const tile = 1000 / density;
  const half = tile / 2;

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={FILL_LAYER}
    >
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <rect width={tile} height={tile} fill={base} />
          {/* Full star at the tile centre, quarter stars at the corners, so
              the cut tiles interlock the way real zellij does. */}
          <path d={starPath(half, half, half * 0.86)} fill={star} />
          <path d={starPath(0, 0, half * 0.86)} fill={star} />
          <path d={starPath(tile, 0, half * 0.86)} fill={star} />
          <path d={starPath(0, tile, half * 0.86)} fill={star} />
          <path d={starPath(tile, tile, half * 0.86)} fill={star} />
          {/* Small diamonds bridging the stars */}
          <path d={starPath(half, 0, half * 0.2, 4)} fill={accent} />
          <path d={starPath(0, half, half * 0.2, 4)} fill={accent} />
          <path d={starPath(tile, half, half * 0.2, 4)} fill={accent} />
          <path d={starPath(half, tile, half * 0.2, 4)} fill={accent} />
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

interface ShamsaProps {
  color: string;
  size: string;
  opacity?: number;
}

/** Shamsa — the sunburst rosette used as a section marker in manuscripts. */
export function Shamsa({ color, size, opacity = 1 }: ShamsaProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      style={{ width: size, height: size, flex: '0 0 auto', opacity, display: 'block' }}
    >
      <path d={starPath(50, 50, 46, 12)} fill={color} opacity={0.32} />
      <path d={starPath(50, 50, 34, 8)} fill={color} opacity={0.75} />
      <circle cx="50" cy="50" r="13" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="50" cy="50" r="4.5" fill={color} />
    </svg>
  );
}

interface ParchmentProps {
  /** Blotch colour for the aged tint. */
  tint: string;
  seed?: number;
}

/** Aged-paper grain and staining, generated rather than bitmapped. */
export function Parchment({ tint, seed = 7 }: ParchmentProps) {
  const id = useSvgId('parchment');
  return (
    <svg aria-hidden viewBox="0 0 600 400" preserveAspectRatio="none" style={FILL_LAYER}>
      <defs>
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed={seed} result="grain" />
          <feColorMatrix type="saturate" values="0" in="grain" result="mono" />
        </filter>
        <radialGradient id={`${id}-vig`} cx="50%" cy="45%" r="72%">
          <stop offset="55%" stopColor={tint} stopOpacity="0" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.42" />
        </radialGradient>
      </defs>
      <rect width="600" height="400" filter={`url(#${id})`} opacity="0.14" />
      <rect width="600" height="400" fill={`url(#${id}-vig)`} />
    </svg>
  );
}

interface BandProps {
  /** Saturated ground of the border band — traditionally lapis. */
  band: string;
  gold: string;
  width?: string;
  /** Rosettes along the long edges / short edges. */
  countLong?: number;
  countShort?: number;
}

/**
 * The illuminated border of a manuscript page: a wide band of saturated colour
 * carrying a rhythm of gold rosettes, with keylines on both edges. Built from
 * four laid-out strips rather than a stretched SVG so the motifs stay circular
 * on every edge and at every screen size.
 */
export function IlluminatedBand({
  band,
  gold,
  width = '6cqmin',
  countLong = 11,
  countShort = 7,
}: BandProps) {
  const rosette = (key: number, size: string) => (
    <Shamsa key={key} color={gold} size={size} opacity={0.85} />
  );

  const strip = (
    orientation: 'row' | 'column',
    count: number,
    style: CSSProperties
  ): CSSProperties & { children?: never } => ({
    position: 'absolute',
    background: band,
    display: 'flex',
    flexDirection: orientation,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    ...style,
  });

  const size = `calc(${width} * 0.52)`;

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={strip('row', countLong, { top: 0, left: 0, right: 0, height: width })}>
        {Array.from({ length: countLong }, (_, i) => rosette(i, size))}
      </div>
      <div style={strip('row', countLong, { bottom: 0, left: 0, right: 0, height: width })}>
        {Array.from({ length: countLong }, (_, i) => rosette(i, size))}
      </div>
      <div style={strip('column', countShort, { top: width, bottom: width, left: 0, width })}>
        {Array.from({ length: countShort }, (_, i) => rosette(i, size))}
      </div>
      <div style={strip('column', countShort, { top: width, bottom: width, right: 0, width })}>
        {Array.from({ length: countShort }, (_, i) => rosette(i, size))}
      </div>
      {/* Gold keylines bounding the band, inside and out */}
      <div
        style={{
          position: 'absolute',
          inset: `calc(${width} - 0.3cqmin)`,
          border: `0.3cqmin solid ${gold}`,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, border: `0.3cqmin solid ${gold}` }} />
    </div>
  );
}
