import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: ReactNode;
  /** Give it a width or a height; the capture's aspect supplies the other. */
  className?: string;
}

/**
 * A phone screen shown as what it is: the real capture, with the device's
 * own status bar, rounded like the glass, with a hairline edge and a soft
 * shadow. No drawn bezel, buttons or notch; a CSS handset looks like a CSS
 * handset, and a screenshot looks like a phone.
 *
 * The aspect matches public/landing/phone-wizard.png exactly (1080 by 2274),
 * so the image fills the frame with nothing to crop.
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        'relative aspect-[1080/2274] overflow-hidden rounded-[12%/5.7%] bg-[#0B0B0D] shadow-[0_28px_56px_-22px_rgba(26,18,5,0.5)] ring-1 ring-black/10',
        className
      )}
    >
      {children}
    </div>
  );
}
