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
    <div className="relative h-full aspect-9/16 rounded-[1.4rem] bg-[#1a1a1a] p-1 shadow-lg">
      <div className="h-full w-full overflow-hidden rounded-[1.1rem] bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-2.5 py-2">
          <span className="text-[7px] font-bold tracking-tight">Screen settings</span>
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[6px] font-semibold text-primary-foreground">
            Save
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-2.5 py-2">
          {['Times', 'Language', 'Theme'].map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? 'rounded-full bg-primary px-1.5 py-0.5 text-[6px] font-semibold text-primary-foreground'
                  : 'rounded-full bg-muted px-1.5 py-0.5 text-[6px] font-medium text-muted-foreground'
              }
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Time rows */}
        <div className="space-y-1 px-2.5">
          {PREVIEW_PRAYERS.filter((p) => p.name !== 'sunrise').map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded border border-border px-1.5 py-1"
            >
              <span className="text-[6.5px] text-muted-foreground">{p.displayName}</span>
              <span className="text-[6.5px] font-semibold tabular-nums">{p.time}</span>
            </div>
          ))}
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
    <div className="grid gap-x-10 gap-y-12 sm:grid-cols-3">
      {t.steps.map((step, i) => (
        <div key={step.title} className="flex flex-col">
          {/* Stage: one height for all three, so the row reads as a sequence. */}
          <div className="mb-6 flex h-[190px] items-center justify-center rounded-xl border border-border bg-secondary/40 p-4 sm:h-[170px]">
            {VISUALS[i]}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-heading text-xl text-primary tabular-nums">{i + 1}</span>
            <h3 className="font-semibold">{step.title}</h3>
            {i === t.steps.length - 1 && (
              <Check className="ml-auto size-4 text-primary" strokeWidth={2.5} aria-hidden />
            )}
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
