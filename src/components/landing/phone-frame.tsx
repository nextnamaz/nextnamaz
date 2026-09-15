import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: ReactNode;
  /** Give it a width or a height; the 390:844 aspect supplies the other. */
  className?: string;
}

/**
 * A handset around a real screenshot.
 *
 * Only the bezel is drawn. The screen is always a photograph of the actual
 * settings page, never a mock built from styled divs, so what the visitor
 * sees is what they will get. The side buttons, the pill and the home
 * indicator are the three cues that make a rounded rectangle read as a
 * phone at thumbnail size.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        'relative aspect-[390/844] rounded-[16px] bg-[#0B0B0D] p-[2px] shadow-[0_14px_30px_-12px_rgba(26,18,5,0.4)]',
        className
      )}
    >
      <span aria-hidden className="absolute -left-px top-[24%] h-[6%] w-[1.5px] rounded-l bg-[#26262C]" />
      <span aria-hidden className="absolute -left-px top-[34%] h-[10%] w-[1.5px] rounded-l bg-[#26262C]" />
      <span aria-hidden className="absolute -right-px top-[28%] h-[12%] w-[1.5px] rounded-r bg-[#26262C]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-background">
        {/* Status strip with the pill cut out of it, above the page itself. */}
        <div className="flex h-[5.5%] shrink-0 items-center justify-center">
          <span aria-hidden className="h-[42%] w-[30%] rounded-full bg-[#0B0B0D]" />
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[1.2%] left-1/2 h-[2px] w-[30%] -translate-x-1/2 rounded-full bg-foreground/30"
        />
      </div>
    </div>
  );
}
