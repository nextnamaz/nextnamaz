import type { CSSProperties, ReactNode } from 'react';

interface TvFrameProps {
  children: ReactNode;
  /** Small frames drop the stand dot and thin the bezel. */
  compact?: boolean;
  /** Themes measure themselves in container-query units. */
  sized?: boolean;
}

/**
 * The bezel the landing page draws a screen inside. Shared so the showcase and
 * the step-by-step visuals cannot drift into two different televisions.
 */
export function TvFrame({ children, compact = false, sized = true }: TvFrameProps) {
  return (
    <div
      className={
        compact
          ? 'relative bg-[#1a1a1a] rounded-xl p-1.5 pb-2.5 shadow-lg'
          : 'relative bg-[#1a1a1a] rounded-4xl p-3 pb-6 shadow-2xl'
      }
    >
      <div
        className={compact ? 'relative w-full rounded-sm overflow-hidden' : 'relative w-full rounded-lg overflow-hidden'}
        style={{
          aspectRatio: '16/9',
          ...(sized ? { containerType: 'size' as CSSProperties['containerType'] } : {}),
        }}
      >
        {children}
      </div>
      {!compact && (
        <div className="flex justify-center mt-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
      )}
    </div>
  );
}
