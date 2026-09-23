import type { ReactNode } from 'react';

/** Bezel width, as a share of the whole set's width. A current flat panel is almost all picture. */
const BEZEL = '0.85cqw';

/**
 * Wall-mounted, a few centimetres off the plaster: a tight shadow at the edge
 * and a soft one falling below. Tinted to the page's warm ink, never black,
 * which reads grey on a warm wall.
 */
const WALL_SHADOW = [
  '0 0.5cqw 1cqw -0.2cqw rgba(38,24,10,0.34)',
  '0 2.2cqw 4.4cqw -1.1cqw rgba(38,24,10,0.3)',
  '0 5cqw 9cqw -3cqw rgba(38,24,10,0.18)',
].join(', ');

/**
 * The television the landing page draws a screen inside: a current flat
 * panel on a wall mount. A thin black bezel of even width, a faint metal edge
 * where the light catches it, no stand, no chin, no logo.
 *
 * Everything is measured in the wrapper's own container width, so the set
 * keeps its proportions from a 280px step illustration to the hero.
 */
export function TvFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full" style={{ containerType: 'inline-size' }}>
      <div
        className="relative bg-[#0C0C0E]"
        style={{ padding: BEZEL, borderRadius: '0.55cqw', boxShadow: WALL_SHADOW }}
      >
        {/* The aluminium edge: a hairline, brightest along the top. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 'inherit',
            boxShadow: 'inset 0 0 0 0.1cqw rgba(255,255,255,0.08), inset 0 0.12cqw 0 rgba(255,255,255,0.14)',
          }}
        />
        {/* Themes measure themselves in container-query units. */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '16/9', containerType: 'size', borderRadius: '0.15cqw' }}
        >
          {children}
          {/* The glass: a faint sheen from the upper left, and a crisp edge to the picture. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(118deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.025) 26%, transparent 42%)',
              boxShadow: 'inset 0 0 0 0.08cqw rgba(0,0,0,0.55)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
