import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface AnatomyBadgeProps extends ComponentPropsWithoutRef<'span'> {
  n: number;
  /** The part this number names is the one being pointed at. */
  active?: boolean;
  /** Another part is being pointed at. */
  dimmed?: boolean;
}

/**
 * The gold numeral shared by the markers on the screen and the legend under
 * it, so a reader matches the two at a glance. Callers set the transition:
 * a marker also glides when a phone zooms the screen.
 */
export function AnatomyBadge({ n, active = false, dimmed = false, className, ...rest }: AnatomyBadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-sans font-semibold tabular-nums leading-none text-primary-foreground',
        'shadow-[0_0_0_2px_#fff,0_1px_2px_rgba(38,24,10,0.3),0_4px_12px_-2px_rgba(38,24,10,0.4)]',
        active && 'scale-120',
        dimmed && 'opacity-40',
        className
      )}
    >
      {active && (
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/60 motion-safe:animate-ping" />
      )}
      <span className="relative">{n}</span>
    </span>
  );
}
