'use client';

import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check } from 'lucide-react';
import { DefaultTheme } from '@/components/display/themes/default';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';
import { LANDING_COPY } from '@/lib/landing-copy';
import { TvFrame } from './tv-frame';

/**
 * The three steps, each drawn with the thing it actually describes: the real
 * pairing screen, the real settings controls, the real display theme. A
 * diagram of a product is a drawing of a promise; this is the product.
 *
 * The QR is a sample address — it pairs nothing, it just has to look like the
 * code a TV puts up.
 */
const SAMPLE_SETTINGS_URL = 'https://www.nextnamaz.com/s/your-screen';

/** What a TV shows before it has been set up (see tv-display's unconfigured state). */
function PairingScreen() {
  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-[4cqh] px-[6cqw]">
      <p className="text-[3.4cqh] font-medium uppercase tracking-wider text-muted-foreground">
        Step 2 of 2 · On your phone
      </p>
      <p className="text-[6cqh] leading-tight text-center">Scan to set up this screen</p>
      <div className="bg-white p-[1.6cqh] rounded border border-border">
        <QRCodeSVG value={SAMPLE_SETTINGS_URL} size={200} level="M" className="h-[34cqh] w-auto" />
      </div>
    </div>
  );
}

/**
 * A phone running the settings page: the tabs and controls, at a glance.
 * Sized by height so it fits the shared stage instead of bursting out of it —
 * the TV frames next to it are width-driven at 16:9.
 */
function PhoneSettings() {
  return (
    <div className="relative h-full aspect-[9/19] rounded-[14px] bg-[#0B0B0D] p-[2px] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.5)]">
      {/* Side buttons, so the silhouette reads as a handset and not a card. */}
      <span aria-hidden className="absolute -left-[1px] top-[24%] h-[6%] w-[1.5px] rounded-l bg-[#26262C]" />
      <span aria-hidden className="absolute -left-[1px] top-[34%] h-[10%] w-[1.5px] rounded-l bg-[#26262C]" />
      <span aria-hidden className="absolute -right-[1px] top-[28%] h-[12%] w-[1.5px] rounded-r bg-[#26262C]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[12px] bg-background">
        {/* Status bar with the pill cut out of it */}
        <div className="relative flex h-[13px] shrink-0 items-center justify-center">
          <span aria-hidden className="h-[5px] w-[30%] rounded-full bg-[#0B0B0D]" />
        </div>

        {/* Title + save. Few elements, set large enough to actually read. */}
        <div className="flex items-center justify-between border-b border-border px-2 pb-1.5">
          <span className="text-[7.5px] font-bold tracking-tight">Times</span>
          <span className="rounded-full bg-primary px-[5px] py-[1px] text-[6.5px] font-semibold text-primary-foreground">
            Save
          </span>
        </div>

        {/* Four rows is enough to read as a list; six turns to mush at this size. */}
        <div className="flex-1 space-y-[5px] px-2 pt-2">
          {PREVIEW_PRAYERS.filter((p) => p.name !== 'sunrise')
            .slice(0, 4)
            .map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded border border-border px-[5px] py-[3px]"
              >
                <span className="text-[7px] text-muted-foreground">{p.displayName}</span>
                <span className="text-[7px] font-semibold tabular-nums">{p.time}</span>
              </div>
            ))}
        </div>

        {/* Home indicator */}
        <div className="flex h-[9px] shrink-0 items-center justify-center">
          <span aria-hidden className="h-[2px] w-[30%] rounded-full bg-foreground/25" />
        </div>
      </div>
    </div>
  );
}

/** The display, live, exactly as the TV renders it. */
function LiveDisplay() {
  const nextPrayer = useMemo(() => getNextPrayer(PREVIEW_PRAYERS), []);
  return (
    <DefaultTheme
      prayers={PREVIEW_PRAYERS}
      nextPrayer={nextPrayer}
      config={{ mode: 'light', colorScheme: 'classic', displayText: 'بسم الله الرحمن الرحيم' }}
      isPortrait={false}
      locale={PREVIEW_LOCALE}
    />
  );
}

/**
 * Each visual brings its own sizing: the televisions fill the width at 16:9,
 * the phone fills the height. The stage only centres them.
 */
const VISUALS = [
  <div key="pair" className="w-full">
    <TvFrame compact>
      <PairingScreen />
    </TvFrame>
  </div>,
  <PhoneSettings key="phone" />,
  <div key="live" className="w-full">
    <TvFrame compact>
      <LiveDisplay />
    </TvFrame>
  </div>,
];

export function HowItWorks() {
  const t = LANDING_COPY.howItWorks;

  return (
    <div className="grid gap-x-16 gap-y-20 sm:grid-cols-3 lg:gap-x-20">
      {t.steps.map((step, i) => {
        const last = i === t.steps.length - 1;
        return (
          <div key={step.title} className="flex flex-col">
            {/* Step marker: a filled badge reads as a step at a glance, where a
                bare numeral just reads as decoration. */}
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Step {i + 1} of {t.steps.length}
              </span>
              {last && <Check className="ml-auto size-4 text-primary" strokeWidth={2.5} aria-hidden />}
            </div>

            {/* Stage: one height for all three, so the row reads as a sequence. */}
            <div className="mb-5 flex h-[240px] items-center justify-center rounded-2xl border border-border bg-secondary/40 px-6 py-5">
              {VISUALS[i]}
            </div>

            <h3 className="text-[17px] font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
