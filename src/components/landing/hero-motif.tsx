/**
 * One eight-point star behind the hero, large and faint.
 *
 * An earlier version tiled the khatam as hairlines across the whole hero. At
 * phone scale that read as scratches behind the headline. A single motif,
 * filled rather than drawn, sits behind the devices like a mark pressed into
 * the paper and stays out of the way of the type. Static, decorative, and
 * hidden from assistive technology.
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

const OUTER = starPath(500, 500, 480);
const MIDDLE = starPath(500, 500, 310);
const CENTRE = starPath(500, 500, 150);

const MASK = 'radial-gradient(circle at 50% 50%, #000 36%, transparent 70%)';

export function HeroMotif() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      className="pointer-events-none absolute text-primary right-[-40%] top-[44%] w-[120%] sm:right-[-10%] sm:top-[4%] sm:w-[60%] lg:right-[-5%] lg:top-[0%] lg:w-[56%] lg:max-w-[840px]"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <path d={OUTER} fill="currentColor" opacity="0.07" />
      <g transform="rotate(22.5 500 500)">
        <path d={MIDDLE} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.18" />
      </g>
      <path d={CENTRE} fill="currentColor" opacity="0.09" />
    </svg>
  );
}
