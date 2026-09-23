import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhoneMockProps {
  /** The screen's contents. Size text in cqw so it scales with the handset. */
  children: ReactNode;
  /** Give it a width; the handset's aspect supplies the height. */
  className?: string;
  /** Light status bar text, for dark screens such as the camera. */
  darkScreen?: boolean;
}

/**
 * A current handset for the illustrations: a near-black hairline bezel, the
 * glass's own rounding and a small island. The screen is an inline-size
 * container, so anything drawn in cqw keeps its proportions at any width.
 */
export function PhoneMock({ children, className, darkScreen = false }: PhoneMockProps) {
  return (
    <div
      className={cn(
        'relative aspect-[9/19.5] rounded-[14%/6.5%] bg-[#111113] p-[2.8%] shadow-[0_30px_60px_-24px_rgba(38,24,10,0.55),0_8px_18px_-8px_rgba(38,24,10,0.35)] ring-1 ring-black/25',
        className
      )}
    >
      {/* Side keys: a sliver, just enough to read as hardware. */}
      <span aria-hidden className="absolute top-[24%] -right-[1.1%] h-[10%] w-[1.1%] rounded-r-sm bg-[#1d1d20]" />
      <span aria-hidden className="absolute top-[20%] -left-[1.1%] h-[6%] w-[1.1%] rounded-l-sm bg-[#1d1d20]" />

      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-[11.5%/5.3%]',
          darkScreen ? 'bg-[#0B0B0D] text-white' : 'bg-background text-foreground'
        )}
        style={{ containerType: 'inline-size' }}
      >
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-0 z-20 flex h-[5.5%] items-center justify-between px-[8%] pt-[1.5%] text-[3.6cqw] font-semibold tabular-nums',
            darkScreen ? 'bg-[#0B0B0D] text-white' : 'text-foreground'
          )}
        >
          <span>9:41</span>
          <span className="flex items-center gap-[1.4cqw]">
            <span className="flex items-end gap-[0.5cqw]">
              <span className="h-[1.2cqw] w-[0.8cqw] rounded-[0.2cqw] bg-current" />
              <span className="h-[1.8cqw] w-[0.8cqw] rounded-[0.2cqw] bg-current" />
              <span className="h-[2.4cqw] w-[0.8cqw] rounded-[0.2cqw] bg-current" />
            </span>
            <span className="relative h-[2.6cqw] w-[5.4cqw] rounded-[0.8cqw] border-[0.35cqw] border-current opacity-90">
              <span className="absolute inset-[0.3cqw] rounded-[0.3cqw] bg-current" />
            </span>
          </span>
        </div>
        <span aria-hidden className="absolute top-[1.6%] left-1/2 z-30 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}
