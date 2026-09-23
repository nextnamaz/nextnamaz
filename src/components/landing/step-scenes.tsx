'use client';

import dynamic from 'next/dynamic';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ArrowRight, Check, Link2, Lock, MonitorUp, RotateCw } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SITE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';
import { TvFrame } from './tv-frame';
import { PhoneMock } from './phone-mock';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';

/**
 * The drawings for "How it works": one wall, one TV, and whatever is
 * in the visitor's hand for that step. The TV screens are simplified drawings
 * of the real ones (/s, the pairing screen, the live display); the phone
 * shows the setup's real last step. Their words are the app's own, cut to
 * what fits, so they live beside their drawings and not in landing-copy.ts.
 *
 * The stage is a container: everything on it is placed in its cqw. Two
 * compositions, one below `sm` and one from `sm` up (the desktop stepper's).
 * The phone is held up into the picture, so the stage's bottom edge crops it.
 *
 * Text drawn inside a mock stays at 9px or more from a 360px phone up: the TV
 * screens switch to a compact layout when narrower than 24rem, and phone text
 * is never under 6.6cqw of a screen never narrower than about 138px.
 */

/** What the drawn codes hold. Scanned off the landing page, /s tells a phone to open it on the TV. */
const SCAN_URL = `${SITE_URL}/s`;

/* ── The wall ─────────────────────────────────────────────────────────── */

/** Limewash: a faint mottle, so the plaster reads as a surface and not a fill. */
const PLASTER = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.006 0.009' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.35 0 0 0 0 0.33 0 0 0 0.35 -0.12'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;

interface StepStageProps {
  children: ReactNode;
  /** Below `sm`, a scene with a phone needs a squarer wall than one without. */
  withPhone: boolean;
  /** Names the drawing for assistive tech. Its parts are always hidden from it. */
  label?: string;
  className?: string;
}

/** A stretch of pale plaster wall, set in slightly like a recess: the same stage as the playground's and the features'. */
export function StepStage({ children, withPhone, label, className }: StepStageProps) {
  return (
    <div
      {...(label ? { role: 'img', 'aria-label': label } : {})}
      className={cn(
        'relative isolate w-full overflow-hidden rounded-3xl sm:aspect-16/11',
        withPhone ? 'aspect-square' : 'aspect-4/3',
        className
      )}
      style={{
        containerType: 'inline-size',
        backgroundColor: '#EDEAE4',
        backgroundImage: [
          'radial-gradient(ellipse 70% 55% at 22% 8%, rgba(255,255,255,0.7), transparent 70%)',
          PLASTER,
          'linear-gradient(165deg, #F6F4F0 0%, #EDEAE4 100%)',
        ].join(', '),
        backgroundSize: 'auto, cover, auto',
        boxShadow: [
          'inset 0 1px 2px rgba(38,24,10,0.06)',
          'inset 0 14px 28px -20px rgba(38,24,10,0.16)',
          'inset 0 0 0 1px rgba(38,24,10,0.05)',
        ].join(', '),
      }}
    >
      {/* The app's own screens, laid out as they are: never mirrored on a right-to-left page. */}
      <div aria-hidden dir="ltr" className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

/* ── Placement ────────────────────────────────────────────────────────── */

/** The set, hung in the same place in every scene so only its picture changes. */
export function SceneTv({ children }: { children: ReactNode }) {
  return (
    <div className="absolute isolate top-[5cqw] left-[6%] w-[88%] sm:top-[6.5cqw] sm:left-[4.5%] sm:w-[74%]">
      <TvFrame>{children}</TvFrame>
    </div>
  );
}

/**
 * The phone, held up in front of the TV's lower right and cropped by the
 * stage's bottom edge. Below `sm` the camera is held square in front of the
 * code; the settings phone keeps to the countdown's side so the times show,
 * which is the left on a right-to-left display.
 */
const PHONE_BOX = 'absolute w-[47%] sm:top-[26cqw] sm:left-[72%] sm:w-[26%]';

interface SceneLayerProps {
  on: boolean;
  /** The outgoing layer stays put until the incoming one is fully in, so an opaque screen never dips mid-fade. */
  hold?: boolean;
  onFadedOut?: () => void;
  children?: ReactNode;
}

/** One scene's layer in the stepper's stack: the incoming layer fades in on top. */
export function SceneLayer({ on, hold = false, onFadedOut, children }: SceneLayerProps) {
  return (
    <div
      onTransitionEnd={(e) => {
        if (!on && e.target === e.currentTarget && e.propertyName === 'opacity') onFadedOut?.();
      }}
      className={cn(
        'pointer-events-none absolute inset-0 transition-opacity duration-450 ease-out motion-reduce:transition-none',
        on ? 'z-10 opacity-100' : cn('opacity-0', hold ? 'delay-450 duration-0' : 'delay-150')
      )}
    >
      {children}
    </div>
  );
}

/* ── Step 1: the TV's browser on /s ───────────────────────────────────── */

/** Screens narrower than 24rem drop the small print and set the rest larger. */
function ScreenBrowser() {
  return (
    <div className="absolute inset-0 flex flex-col bg-background text-foreground">
      <div className="flex h-[12cqh] shrink-0 items-center gap-[2.6cqh] border-b border-[#D5D2CB] bg-[#ECEAE5] px-[3.4cqh] @max-[24rem]:h-[16cqh] @max-[24rem]:px-[4cqh]">
        <ArrowLeft className="size-[4.6cqh] text-[#4D4A42] @max-[24rem]:hidden" strokeWidth={2.2} />
        <ArrowRight className="size-[4.6cqh] text-[#B3AFA5] @max-[24rem]:hidden" strokeWidth={2.2} />
        <RotateCw className="size-[4cqh] text-[#4D4A42] @max-[24rem]:hidden" strokeWidth={2.2} />
        <div className="ml-[0.6cqh] flex h-[8cqh] min-w-0 flex-1 items-center gap-[1.5cqh] rounded-full bg-white px-[3cqh] shadow-[inset_0_0_0_1px_rgba(26,26,26,0.10)] @max-[24rem]:ml-0 @max-[24rem]:h-[11cqh] @max-[24rem]:gap-[2cqh] @max-[24rem]:px-[4cqh]">
          <Lock className="size-[3.6cqh] shrink-0 text-[#4D4A42] @max-[24rem]:size-[5cqh]" strokeWidth={2.4} />
          <span className="truncate text-[4.6cqh] leading-none font-medium @max-[24rem]:text-[6.6cqh]">
            nextnamaz.com/s
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-[8cqh] pb-[2cqh] text-center">
        <Logo className="h-[7cqh] w-auto @max-[24rem]:h-[8cqh]" />
        <p className="mt-[5cqh] text-[10cqh] leading-none font-bold tracking-[-0.02em] @max-[24rem]:mt-[6cqh] @max-[24rem]:text-[11.5cqh]">
          Set up this screen
        </p>
        <p className="mt-[3.2cqh] max-w-[72cqw] text-[4.5cqh] leading-[1.35] text-balance text-muted-foreground @max-[24rem]:hidden">
          Press start on the TV that should show prayer times.
        </p>
        {/* Selected with the remote: the TV's own focus ring, and a touch larger. */}
        <span
          className="mt-[7cqh] flex h-[12.5cqh] scale-[1.04] items-center gap-[1.8cqh] rounded-full bg-primary px-[8.5cqh] text-[5.6cqh] font-semibold text-primary-foreground @max-[24rem]:mt-[9cqh] @max-[24rem]:h-[15cqh] @max-[24rem]:px-[9cqh] @max-[24rem]:text-[7cqh]"
          style={{ boxShadow: '0 0 0 1cqh #FAFAF8, 0 0 0 1.9cqh #1A1A1A, 0 2.4cqh 5cqh -1cqh rgba(184,122,8,0.55)' }}
        >
          <MonitorUp className="size-[5.8cqh] @max-[24rem]:size-[7cqh]" strokeWidth={2.2} />
          Start
        </span>
      </div>
    </div>
  );
}

/**
 * A flat remote held in front of the set, its OK key lit: the press that
 * turns the TV into a screen of its own.
 */
function Remote() {
  // Unique per drawing: the same remote is drawn in both layouts, one of them hidden.
  const id = useId().replace(/[^\w-]/g, '');
  const body = `remote-${id}-body`;
  return (
    <div className="absolute top-[41cqw] left-[80%] w-[6.4%] rotate-[-16deg] sm:top-[40cqw] sm:left-[74.5%] sm:w-[5%] sm:rotate-[-28deg]">
      <svg
        viewBox="0 0 56 216"
        className="block h-auto w-full"
        style={{
          filter:
            'drop-shadow(0.8cqw 2.6cqw 2.4cqw rgba(38,24,10,0.32)) drop-shadow(0 0.4cqw 0.6cqw rgba(38,24,10,0.24))',
        }}
      >
        <defs>
          <linearGradient id={body} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#3A3833" />
            <stop offset="0.2" stopColor="#262521" />
            <stop offset="1" stopColor="#1B1A18" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="54" height="214" rx="27" fill={`url(#${body})`} />
        <rect x="1.5" y="1.5" width="53" height="213" rx="26.5" fill="none" stroke="rgba(255,255,255,0.08)" />
        {/* Power */}
        <circle cx="28" cy="21" r="3.6" fill="#45423C" />
        {/* D-pad ring and its arrows, OK lit */}
        <circle cx="28" cy="66" r="20" fill="#302F2B" stroke="#3E3C37" />
        <path
          d="M28 50 l-3 3.6 h6z M28 82 l-3 -3.6 h6z M12 66 l3.6 -3 v6z M44 66 l-3.6 -3 v6z"
          fill="#8E8A80"
        />
        <circle cx="28" cy="66" r="13" fill="#E8A817" opacity="0.22" />
        <circle cx="28" cy="66" r="9.2" fill="#E8A817" />
        <circle cx="28" cy="64.8" r="6.4" fill="#F2BC43" opacity="0.6" />
        {/* Back, home, play */}
        <circle cx="13.5" cy="106" r="5" fill="#302F2B" />
        <circle cx="28" cy="106" r="5" fill="#302F2B" />
        <circle cx="42.5" cy="106" r="5" fill="#302F2B" />
        {/* Volume rocker */}
        <rect x="19" y="128" width="18" height="50" rx="9" fill="#302F2B" />
        <path d="M24.5 140 h7 M28 136.5 v7 M24.5 166 h7" stroke="#7A766D" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Step 2: the pairing screen, and the phone's camera on it ─────────── */

/**
 * The TV's pairing screen. Laid out on fixed positions rather than in flow,
 * so the camera view below can find the code at a known point: the code's
 * white box is 38cqh square, centred 59cqh down.
 */
function ScreenPairing() {
  return (
    <div className="absolute inset-0 bg-background text-center text-foreground">
      <Logo className="absolute top-[8cqh] left-1/2 h-[6.4cqh] w-auto -translate-x-1/2" />
      <p className="absolute inset-x-0 top-[18.5cqh] text-[7.6cqh] leading-none tracking-[-0.015em] @max-[24rem]:text-[8.2cqh]">
        Scan to set up this screen
      </p>
      <p className="absolute inset-x-0 top-[29cqh] text-[4.2cqh] leading-none text-muted-foreground @max-[24rem]:hidden">
        Open your phone camera and scan the code.
      </p>
      <div className="absolute top-[59cqh] left-1/2 size-[38cqh] -translate-1/2 rounded-[0.8cqh] bg-white p-[2.5cqh] shadow-[0_0_0_1px_#DED9CF]">
        <QRCodeSVG value={SCAN_URL} size={200} level="L" className="block size-full" />
      </div>
      <p className="absolute inset-x-0 top-[82cqh] font-mono text-[4.2cqh] leading-none text-muted-foreground @max-[24rem]:hidden">
        www.nextnamaz.com/s/7f3a9c2e…
      </p>
    </div>
  );
}

/** Where the code sits in the camera view, in the phone screen's cqw from the viewfinder's top. */
const CAM_QR_Y = '70cqw';

/**
 * The same set close up and out of focus, as the camera sees it: TvFrame
 * itself, so the two can't drift apart. 247.6cqw wide leaves 243.4cqw of
 * picture inside its 0.85% bezel, so the code's box (38cqh) is 52cqw, and its
 * centre, bezel + 59cqh (2.1 + 80.8cqw) below the set's top, lands on CAM_QR_Y.
 */
function CameraTv() {
  return (
    <div className="absolute left-1/2 w-[247.6cqw] -translate-x-1/2 blur-[1.1cqw]" style={{ top: '-12.9cqw' }}>
      <TvFrame>
        <ScreenPairing />
      </TvFrame>
    </div>
  );
}

/** The phone's home indicator. */
function HomeBar({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn(
        'absolute bottom-[1.4%] left-1/2 z-10 h-[1.3cqw] w-[36cqw] -translate-x-1/2 rounded-full',
        light ? 'bg-white/90' : 'bg-black/85'
      )}
    />
  );
}

/**
 * The phone's camera, pointed at the TV: the set close up, a little off
 * square and out of focus, the code sharp inside the camera's brackets and
 * the link it read offered just below.
 */
function PhoneCamera() {
  return (
    <div className={cn(PHONE_BOX, 'top-[25cqw] left-[26.5%]')}>
      <PhoneMock darkScreen className="w-full">
        <div className="absolute inset-x-0 top-[10%] bottom-[19%] overflow-hidden bg-[#C9C8C4]">
          <div className="absolute inset-0 scale-[1.06] rotate-[-2.5deg]">
            <CameraTv />
            {/* The code in focus, and the brackets the camera draws on it. */}
            <div
              className="absolute left-1/2 size-[52cqw] -translate-1/2 rounded-[1.2cqw] bg-white p-[3cqw] shadow-[0_0_2.4cqw_rgba(255,255,255,0.55)]"
              style={{ top: CAM_QR_Y }}
            >
              <QRCodeSVG value={SCAN_URL} size={200} level="L" className="block size-full" />
            </div>
            <svg
              viewBox="0 0 100 100"
              className="absolute left-1/2 size-[66cqw] -translate-1/2"
              style={{ top: CAM_QR_Y }}
              fill="none"
              stroke="#E8A817"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 16 V7 a5 5 0 0 1 5 -5 H16 M84 2 H93 a5 5 0 0 1 5 5 V16 M98 84 V93 a5 5 0 0 1 -5 5 H84 M16 98 H7 a5 5 0 0 1 -5 -5 V84" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_45%,transparent_55%,rgba(24,14,4,0.35)_100%)]" />

          {/* The camera's offer to open what it read. */}
          <div className="absolute inset-x-0 flex justify-center" style={{ top: '110cqw' }}>
            <span className="flex items-center gap-[1.8cqw] rounded-full bg-primary px-[4.6cqw] py-[2.8cqw] text-[7cqw] leading-none font-semibold text-primary-foreground shadow-[0_1cqw_3cqw_rgba(0,0,0,0.3)]">
              <Link2 className="size-[7cqw]" strokeWidth={2.4} />
              nextnamaz.com
            </span>
          </div>
        </div>

        {/* Shutter row. */}
        <div className="absolute inset-x-0 bottom-0 flex h-[19%] items-center justify-between bg-[#0B0B0D] px-[11cqw] pb-[3%]">
          <span className="size-[11cqw] rounded-[2.6cqw] bg-[linear-gradient(135deg,#6B5A45,#3A3129)]" />
          <span className="flex size-[19cqw] items-center justify-center rounded-full border-[1.1cqw] border-white">
            <span className="size-[14.5cqw] rounded-full bg-white" />
          </span>
          <span className="size-[11cqw] rounded-full bg-[#2A2A2D]" />
        </div>
        <HomeBar light />
      </PhoneMock>
    </div>
  );
}

/* ── Step 3: the live display, and the last step of setup ─────────────── */

const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenBlank />,
});

/** Same colour as the display's own ground, so the swap to the live screen is quiet. */
function ScreenBlank() {
  return <div className="absolute inset-0 bg-[#F1F3F6]" />;
}

/**
 * The real display, on the visitor's clock. The stepper (lg and up) and the
 * phone layout both draw this scene; only the one on screen mounts a display.
 */
function ScreenLive({ display }: { display: SupportedLocale }) {
  return <DemoDisplay locale={resolveDisplayLocale(display)} />;
}

/**
 * The setup's real last step, "Step 4 of 4 · PIN", its PIN left empty and
 * "Turn on the display" under the thumb.
 */
function PhoneSettings({ rtl }: { rtl: boolean }) {
  return (
    <div className={cn(PHONE_BOX, 'top-[23cqw]', rtl ? 'left-[3.5%] sm:left-[2%]' : 'left-[49.5%]')}>
      <PhoneMock className="w-full">
        <div className="absolute inset-0 bg-[#F6F5F1]">
          <div className="flex items-center justify-between gap-[2cqw] border-b border-border bg-background px-[5cqw] pt-[14.5cqw] pb-[3.4cqw]">
            <Logo className="h-[4.8cqw] w-auto shrink-0" />
            <span className="text-[6.6cqw] leading-none whitespace-nowrap text-muted-foreground">Step 4 of 4 · PIN</span>
          </div>

          <div className="px-[5cqw] pt-[6cqw]">
            <p className="text-[8cqw] leading-[1.15] font-bold tracking-[-0.015em]">Lock it with a PIN?</p>
            <p className="mt-[2.4cqw] text-[7cqw] leading-[1.35] text-muted-foreground">
              Optional. Leave it empty to skip.
            </p>

            <div className="mt-[5cqw] rounded-[4cqw] border border-border bg-card p-[3.6cqw]">
              <p className="text-[7cqw] leading-none font-medium">PIN (4 to 8 digits)</p>
              <div className="mt-[3cqw] flex h-[14cqw] items-center rounded-[3cqw] border border-[#D6D1C6] px-[2.6cqw] text-[6.6cqw] whitespace-nowrap text-[#787364]">
                Leave empty for no PIN
              </div>
              <p className="mt-[3cqw] text-[7cqw] leading-[1.35] text-muted-foreground">
                You can add, change or remove it later.
              </p>
            </div>

            {/* Mid-press: pushed in a touch, and ringed a shade darker. */}
            <div className="mt-[6cqw] flex h-[15cqw] scale-[0.96] items-center justify-center rounded-full bg-primary text-[7.4cqw] font-semibold text-primary-foreground shadow-[0_0_0_0.8cqw_#B87A08]">
              Turn on the display
            </div>
          </div>
        </div>
        <HomeBar />
      </PhoneMock>
    </div>
  );
}

/** The press lands: the wizard's own done line, as a note on the wall by the TV, on the side the phone is not. */
function SavedNote({ rtl }: { rtl: boolean }) {
  return (
    <div
      className={cn(
        'absolute top-[62cqw] flex max-w-[41%] items-start gap-[1.8cqw] rounded-[3cqw] bg-card px-[3.2cqw] py-[2.6cqw] shadow-[0_1.2cqw_3cqw_-1cqw_rgba(38,24,10,0.3),0_0_0_1px_rgba(38,24,10,0.06)] sm:top-[55.5cqw] sm:max-w-none sm:items-center sm:gap-[1cqw] sm:rounded-[1.6cqw] sm:px-[1.8cqw] sm:py-[1.3cqw]',
        rtl ? 'right-[5%] sm:right-[21.5%]' : 'left-[5%] sm:left-[4.5%]'
      )}
    >
      <Check className="mt-[0.4cqw] size-[4cqw] shrink-0 text-[#2F7A4B] sm:mt-0 sm:size-[2.3cqw]" strokeWidth={3} />
      <p className="text-[3.3cqw] leading-snug font-semibold text-balance text-foreground sm:text-[1.95cqw]">
        Your screen is live
      </p>
    </div>
  );
}

/* ── Composition ──────────────────────────────────────────────────────── */

/** What the TV shows at a step; the live display speaks the page's language. */
export function StepScreen({ index, display }: { index: number; display: SupportedLocale }) {
  if (index === 0) return <ScreenBrowser />;
  if (index === 1) return <ScreenPairing />;
  return <ScreenLive display={display} />;
}

/** What sits in front of the TV at a step. `rtl`: the live display in the last step is mirrored. */
export function StepForeground({ index, rtl }: { index: number; rtl: boolean }) {
  if (index === 0) return <Remote />;
  if (index === 1) return <PhoneCamera />;
  return (
    <>
      <SavedNote rtl={rtl} />
      <PhoneSettings rtl={rtl} />
    </>
  );
}
