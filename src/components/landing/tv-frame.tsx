import type { CSSProperties, ReactNode } from 'react';

interface TvFrameProps {
  children: ReactNode;
  /** Small frames thin the bezel further and drop the stand. */
  compact?: boolean;
  /** Themes measure themselves in container-query units. */
  sized?: boolean;
}

/**
 * The television the landing page draws a screen inside.
 *
 * Modelled on a current set rather than a 2010 one: the bezel is a hairline
 * on three sides with a slightly deeper chin, the corners are barely rounded,
 * and it stands on a thin blade instead of a moulded plinth. A thick rounded
 * frame with a power LED is the thing that dates a mockup.
 *
 * Shared so the showcase and the step-by-step visuals cannot drift into two
 * different televisions.
 */
export function TvFrame({ children, compact = false, sized = true }: TvFrameProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Panel: hairline bezel, faint top edge where the light catches it. */}
      <div
        className={
          compact
            ? 'relative w-full rounded-[5px] bg-[#0B0B0D] p-[2px] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)] ring-1 ring-white/8'
            : 'relative w-full rounded-[10px] bg-[#0B0B0D] p-[4px] pb-[10px] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-white/8'
        }
      >
        <div
          className={compact ? 'relative w-full overflow-hidden rounded-[3px]' : 'relative w-full overflow-hidden rounded-[6px]'}
          style={{
            aspectRatio: '16/9',
            ...(sized ? { containerType: 'size' as CSSProperties['containerType'] } : {}),
          }}
        >
          {children}
        </div>
      </div>

      {/* Blade stand: a thin neck onto a wide, flat foot. */}
      {!compact && (
        <>
          <div className="h-3.5 w-16 bg-gradient-to-b from-[#16161A] to-[#0B0B0D]" />
          <div className="h-[5px] w-44 rounded-b-md rounded-t-sm bg-[#141418] shadow-[0_6px_10px_-6px_rgba(0,0,0,0.5)]" />
        </>
      )}
    </div>
  );
}
