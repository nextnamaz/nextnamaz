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

interface FieldProps {
  color: string;
  opacity?: number;
  density?: number;
  strokeWidth?: number;
}

/**
 * Khatam — the eight-point star and cross tessellation.
 *
 * A true tiling rather than stars scattered on a grid: each star's outer
 * radius is exactly half the cell, so its four axial points meet the points of
 * its neighbours at the cell-edge midpoints, and the space left around every
 * cell corner closes into the cross. That interlock is what separates a real
 * Islamic pattern from a field of star shapes.
 */
export function KhatamField({ color, opacity = 0.16, density = 6, strokeWidth = 1.4 }: FieldProps) {
  const id = useSvgId('khatam');
  const tile = 1000 / density;
  const h = tile / 2;
  const r = h * 0.5412; // inner radius of a star cut from two squares

  // The cross filling the corner: the four surrounding stars each contribute
  // one concave vertex and two flanks, meeting at the cell-edge midpoints.
  const d = r / Math.SQRT2;
  const cross = [
    `M${h},0`,
    `L${h - d},${-d}`,
    `L${d},${-d}`, // mirrored into the neighbouring cell
    `L0,${-h}`,
  ].join(' ');

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
            <path d={starPath(h, h, h)} />
            {/* The cross is the negative space; tracing its arms at each corner
                closes the tiling instead of leaving the stars floating. */}
            <g transform={`translate(0,${tile})`}>
              <path d={cross} />
            </g>
            <g transform={`translate(${tile},${tile}) rotate(90)`}>
              <path d={cross} />
            </g>
            <g transform={`translate(${tile},0) rotate(180)`}>
              <path d={cross} />
            </g>
            <g transform={`translate(0,0) rotate(270)`}>
              <path d={cross} />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Six-fold star tessellation on a triangular lattice — the other great family,
 * and visibly different from the eight-fold work above.
 */
export function HexStarField({ color, opacity = 0.16, density = 6, strokeWidth = 1.4 }: FieldProps) {
  const id = useSvgId('hexstar');
  const w = 1000 / density;
  const h = w * Math.sqrt(3); // a hexagonal lattice repeats over √3 vertically
  const r = w / 2;

  const hexagon = (cx: number, cy: number, radius: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`;
    });
    return `M${pts.join('L')}Z`;
  };

  const cell = (cx: number, cy: number) => (
    <>
      <path d={starPath(cx, cy, r * 0.86, 6)} />
      <path d={hexagon(cx, cy, r * 0.46)} />
    </>
  );

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
            {cell(0, 0)}
            {cell(w, 0)}
            {cell(0, h)}
            {cell(w, h)}
            {cell(w / 2, h / 2)}
          </g>
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Girih strapwork: octagons locked together by the diagonal straps that run
 * between them — the trellis under most Persian and Anatolian tilework.
 */
export function GirihField({ color, opacity = 0.16, density = 6, strokeWidth = 1.4 }: FieldProps) {
  const id = useSvgId('girih');
  const tile = 1000 / density;
  const h = tile / 2;
  const r = tile * 0.30;
  // Regular octagon around the tile centre.
  const oct = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return `${(h + r * Math.cos(a)).toFixed(2)},${(h + r * Math.sin(a)).toFixed(2)}`;
  });

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth={strokeWidth}>
            <path d={`M${oct.join('L')}Z`} />
            {/* Straps carrying the octagon out to its neighbours */}
            <path d={`M0,0 L${oct[5]}`} />
            <path d={`M${tile},0 L${oct[6]}`} />
            <path d={`M${tile},${tile} L${oct[1]}`} />
            <path d={`M0,${tile} L${oct[2]}`} />
            {/* Small squares where four straps meet */}
            <path d={starPath(0, 0, tile * 0.1, 4)} />
            <path d={starPath(tile, 0, tile * 0.1, 4)} />
            <path d={starPath(0, tile, tile * 0.1, 4)} />
            <path d={starPath(tile, tile, tile * 0.1, 4)} />
          </g>
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

/** Quatrefoil lattice — interlocking four-lobed medallions. */
export function QuatrefoilField({ color, opacity = 0.16, density = 7, strokeWidth = 1.4 }: FieldProps) {
  const id = useSvgId('quatrefoil');
  const tile = 1000 / density;
  const h = tile / 2;
  const lobe = tile * 0.26;

  const flower = (cx: number, cy: number) =>
    [
      `M${cx},${cy - lobe * 2}`,
      `A${lobe},${lobe} 0 0 1 ${cx + lobe * 2},${cy}`,
      `A${lobe},${lobe} 0 0 1 ${cx},${cy + lobe * 2}`,
      `A${lobe},${lobe} 0 0 1 ${cx - lobe * 2},${cy}`,
      `A${lobe},${lobe} 0 0 1 ${cx},${cy - lobe * 2}`,
      'Z',
    ].join(' ');

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth={strokeWidth}>
            <path d={flower(h, h)} />
            <path d={flower(0, 0)} />
            <path d={flower(tile, 0)} />
            <path d={flower(0, tile)} />
            <path d={flower(tile, tile)} />
          </g>
        </pattern>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Muqarnas: the stalactite vaulting over a mihrab, as tiers of nested cells
 * stepping outward, anchored to the top of the screen.
 */
export function MuqarnasVault({ color, opacity = 0.16, strokeWidth = 1.4 }: FieldProps) {
  const tiers = [
    { y: 0, count: 5, h: 46 },
    { y: 46, count: 6, h: 44 },
    { y: 90, count: 8, h: 42 },
    { y: 132, count: 10, h: 40 },
  ];

  return (
    <svg
      aria-hidden
      viewBox="0 0 400 172"
      preserveAspectRatio="none"
      style={{ ...FILL_LAYER, opacity }}
    >
      <g fill="none" stroke={color} strokeWidth={strokeWidth}>
        {tiers.map((tier) =>
          Array.from({ length: tier.count }, (_, i) => {
            const w = 400 / tier.count;
            const cx = w * (i + 0.5);
            const half = w * 0.46;
            return (
              <path
                key={`${tier.y}-${i}`}
                d={`M${cx - half},${tier.y + tier.h} L${cx - half},${tier.y + tier.h * 0.42}` +
                  ` Q${cx - half},${tier.y} ${cx},${tier.y}` +
                  ` Q${cx + half},${tier.y} ${cx + half},${tier.y + tier.h * 0.42}` +
                  ` L${cx + half},${tier.y + tier.h}`}
              />
            );
          })
        )}
      </g>
    </svg>
  );
}

/** A single large shamsa medallion, centred behind the board. */
export function RosetteMedallion({ color, opacity = 0.14, strokeWidth = 1.2 }: FieldProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      style={{ ...FILL_LAYER, opacity }}
    >
      <g fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d={starPath(200, 200, 190, 16)} />
        <path d={starPath(200, 200, 155, 16)} />
        <path d={starPath(200, 200, 120, 8)} />
        <path d={starPath(200, 200, 86, 8)} />
        <circle cx="200" cy="200" r="52" />
        <circle cx="200" cy="200" r="26" />
      </g>
    </svg>
  );
}

interface NicheProps {
  /** Slightly lifted from the page ground — this reads tone-on-tone. */
  fill: string;
  edge: string;
}

/**
 * Mihrab niche: the prayer-hall arch, sunk into the background rather than
 * outlined. Two nested contours, each barely lighter than the ground.
 */
export function MihrabNiche({ fill, edge }: NicheProps) {
  const id = useSvgId('niche');
  // Drawn wide: the head of the board is far wider than tall, and a tall
  // viewBox stretched to fit collapses the arch into a rounded rectangle.
  // The paths are left open at the bottom and both fill and stroke fade out
  // downwards, so the niche dissolves into the ground with no hard edge.
  const shape = 'M6,140 L6,84 Q6,24 100,8 Q194,24 194,84 L194,140';
  const innerShape = 'M24,140 L24,92 Q24,42 100,28 Q176,42 176,92 L176,140';
  return (
    <svg aria-hidden viewBox="0 0 200 140" preserveAspectRatio="none" style={FILL_LAYER}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={edge} stopOpacity="1" />
          <stop offset="85%" stopColor={edge} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${shape} Z`} fill={`url(#${id}-f)`} />
      <path d={shape} fill="none" stroke={`url(#${id}-s)`} strokeWidth="0.9" />
      <path d={innerShape} fill="none" stroke={`url(#${id}-s)`} strokeWidth="0.7" opacity="0.7" />
    </svg>
  );
}

interface SilhouetteProps {
  color: string;
  opacity?: number;
}

/**
 * Mosque skyline: onion dome flanked by half-domes and two minarets, sitting
 * on an arcaded wall. Drawn rather than photographed, so it costs nothing to
 * load and stays crisp at any size.
 */
export function MosqueSilhouette({ color, opacity = 0.16 }: SilhouetteProps) {
  const id = useSvgId('mosque');

  /** Onion dome centred on cx, springing at y, half-width w, height h. */
  const dome = (cx: number, y: number, w: number, h: number) =>
    `M${cx - w},${y} C${cx - w},${y - h * 0.55} ${cx - w * 0.72},${y - h * 0.82} ${cx},${y - h}` +
    ` C${cx + w * 0.72},${y - h * 0.82} ${cx + w},${y - h * 0.55} ${cx + w},${y} Z`;

  /** Minaret: shaft, balcony, cap and finial. */
  const minaret = (cx: number, top: number, w: number) =>
    `M${cx - w},200 L${cx - w},${top + 10} L${cx - w * 1.5},${top + 10} L${cx - w * 1.5},${top + 4}` +
    ` L${cx - w * 0.55},${top + 4} C${cx - w * 0.55},${top - 8} ${cx + w * 0.55},${top - 8} ${cx + w * 0.55},${top + 4}` +
    ` L${cx + w * 1.5},${top + 4} L${cx + w * 1.5},${top + 10} L${cx + w},${top + 10} L${cx + w},200 Z`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMax meet"
      style={{ ...FILL_LAYER, opacity }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        {/* Wall */}
        <rect x="46" y="150" width="308" height="50" />
        {/* Half domes */}
        <path d={dome(110, 152, 30, 34)} />
        <path d={dome(290, 152, 30, 34)} />
        {/* Main dome and drum */}
        <rect x="168" y="128" width="64" height="26" />
        <path d={dome(200, 130, 42, 56)} />
        {/* Finial */}
        <rect x="198.4" y="60" width="3.2" height="16" />
        <circle cx="200" cy="57" r="5" />
        {/* Minarets */}
        <path d={minaret(66, 84, 7)} />
        <path d={minaret(334, 84, 7)} />
        <path d={dome(66, 84, 9, 14)} />
        <path d={dome(334, 84, 9, 14)} />
      </g>
      {/* Arcade cut into the wall */}
      <g fill="#000" opacity="0.55">
        {[96, 148, 200, 252, 304].map((x) => (
          <path
            key={x}
            d={`M${x - 11},200 L${x - 11},178 C${x - 11},166 ${x + 11},166 ${x + 11},178 L${x + 11},200 Z`}
          />
        ))}
      </g>
    </svg>
  );
}

