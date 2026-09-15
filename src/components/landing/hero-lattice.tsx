/**
 * Eight-point star tessellation behind the hero.
 *
 * The khatam: two squares overlaid make the star, and the space between four
 * stars closes into a cross. It has decorated prayer halls for a thousand
 * years, which is the point of using it rather than a generic mesh or grid.
 *
 * It is a texture, not a picture: hairline gold at low opacity, and masked so
 * it is fullest behind the television and fades to nothing under the copy.
 * Static, and hidden from assistive tech.
 */

/** Polygon path for an n-pointed star (default: the eight-point khatam). */
function starPath(cx: number, cy: number, outer: number, points = 8): string {
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

const TILE = 128;
const H = TILE / 2;
const R = H * 0.5412;
const D = R / Math.SQRT2;
// One arm of the cross in the corner; rotated into the other three corners.
const CROSS = `M${H},0 L${H - D},${-D} L${D},${-D} L0,${-H}`;

const MASK =
  'radial-gradient(ellipse 62% 78% at 74% 42%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 72%)';

export function HeroLattice() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-primary opacity-60 sm:opacity-100"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <defs>
        <pattern id="hero-khatam" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.22">
            <path d={starPath(H, H, H)} />
            <g transform={`translate(0,${TILE})`}>
              <path d={CROSS} />
            </g>
            <g transform={`translate(${TILE},${TILE}) rotate(90)`}>
              <path d={CROSS} />
            </g>
            <g transform={`translate(${TILE},0) rotate(180)`}>
              <path d={CROSS} />
            </g>
            <g transform="rotate(270)">
              <path d={CROSS} />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-khatam)" />
    </svg>
  );
}
