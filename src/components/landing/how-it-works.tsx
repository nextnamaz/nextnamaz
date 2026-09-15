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
    <div className="relative h-full aspect-[10/19] rounded-[1.7rem] bg-[#0B0B0D] p-[3px] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
      {/* Side buttons, so the silhouette reads as a handset and not a card. */}
      <span
        aria-hidden
        className="absolute -left-[1.5px] top-[22%] h-[7%] w-[2px] rounded-l bg-[#1C1C21]"
      />
      <span
        aria-hidden
        className="absolute -left-[1.5px] top-[33%] h-[11%] w-[2px] rounded-l bg-[#1C1C21]"
      />
      <span
        aria-hidden
        className="absolute -right-[1.5px] top-[27%] h-[13%] w-[2px] rounded-r bg-[#1C1C21]"
      />

      <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-background">
        {/* Dynamic island */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[3px] z-10 h-[7px] w-[26%] -translate-x-1/2 rounded-full bg-[#0B0B0D]"
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-2 pb-1.5 pt-[13px]">
          <span className="text-[6.5px] font-bold tracking-tight">Screen settings</span>
          <span className="rounded-full bg-primary px-1.5 py-[1px] text-[5.5px] font-semibold text-primary-foreground">
            Save
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-2 py-1.5">
          {['Times', 'Language', 'Theme'].map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? 'rounded-full bg-primary px-1.5 py-[1px] text-[5.5px] font-semibold text-primary-foreground'
                  : 'rounded-full bg-muted px-1.5 py-[1px] text-[5.5px] font-medium text-muted-foreground'
              }
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Time rows */}
        <div className="space-y-[3px] px-2">
          {PREVIEW_PRAYERS.filter((p) => p.name !== 'sunrise').map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-sm border border-border px-1.5 py-[2.5px]"
            >
              <span className="text-[6px] text-muted-foreground">{p.displayName}</span>
              <span className="text-[6px] font-semibold tabular-nums">{p.time}</span>
            </div>
          ))}
        </div>

        {/* Home indicator */}
        <div
          aria-hidden
          className="absolute bottom-[4px] left-1/2 h-[2px] w-[28%] -translate-x-1/2 rounded-full bg-foreground/25"
        />
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
      {t.steps.map((step, i) => (
        <div key={step.title} className="flex flex-col">
          {/* Stage: one height for all three, so the row reads as a sequence. */}
          <div className="mb-7 flex h-[230px] items-center justify-center rounded-2xl border border-border bg-secondary/40 px-6 py-7">
            {VISUALS[i]}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-heading text-xl text-primary tabular-nums">{i + 1}</span>
            <h3 className="font-semibold">{step.title}</h3>
            {i === t.steps.length - 1 && (
              <Check className="ml-auto size-4 text-primary" strokeWidth={2.5} aria-hidden />
            )}
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
