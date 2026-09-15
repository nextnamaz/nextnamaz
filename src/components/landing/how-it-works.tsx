'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { DefaultTheme } from '@/components/display/themes/default';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';
import { LANDING_COPY } from '@/lib/landing-copy';
import { TvFrame } from './tv-frame';
import { PhoneFrame } from './phone-frame';
import { Reveal } from './reveal';

/**
 * The three steps, each drawn with the thing it actually describes: the real
 * pairing screen, a photograph of the real settings page, the real display
 * theme. A diagram of a product is a drawing of a promise; this is the
 * product.
 *
 * The QR is a sample address. It pairs nothing; it just has to look like the
 * code a TV puts up.
 */
const SAMPLE_SETTINGS_URL = 'https://www.nextnamaz.com/s/your-screen';

/** What a TV shows before it has been set up (see tv-display's unconfigured state). */
function PairingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqh] bg-background px-[6cqw]">
      <p className="text-[3.4cqh] font-medium uppercase tracking-wider text-muted-foreground">
        Step 2 of 2 · On your phone
      </p>
      <p className="text-center text-[6cqh] leading-tight">Scan to set up this screen</p>
      <div className="rounded border border-border bg-white p-[1.6cqh]">
        <QRCodeSVG value={SAMPLE_SETTINGS_URL} size={200} level="M" className="h-[34cqh] w-auto" />
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
  <PhoneFrame key="phone" className="h-full">
    <Image
      src="/landing/phone-wizard.png"
      alt="The setup on a phone, checking the day's prayer times before continuing"
      fill
      sizes="160px"
      className="object-cover object-top"
    />
  </PhoneFrame>,
  <div key="live" className="w-full">
    <TvFrame compact>
      <LiveDisplay />
    </TvFrame>
  </div>,
];

export function HowItWorks() {
  const t = LANDING_COPY.howItWorks;

  return (
    <div className="grid gap-x-16 gap-y-16 sm:grid-cols-3 lg:gap-x-20">
      {t.steps.map((step, i) => (
        <Reveal key={step.title} delay={i * 90} className="flex flex-col">
          {/* The number is the label. A filled badge reads as a step at a
              glance; a "Step 1 of 3" caption next to it would only repeat it. */}
          <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-[15px] font-bold tabular-nums text-primary-foreground">
            <span className="sr-only">Step </span>
            {i + 1}
          </span>

          <div className="mb-5 flex h-[320px] items-center justify-center rounded-2xl border border-border bg-secondary/40 px-5 py-6">
            {VISUALS[i]}
          </div>

          <h3 className="text-[17px] font-semibold">{step.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </Reveal>
      ))}
    </div>
  );
}
