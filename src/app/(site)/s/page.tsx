'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MonitorUp, Tv } from 'lucide-react';
import { createScreen } from '@/lib/actions';
import { SCREEN_STORAGE_KEY } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';

const noSubscription = () => () => {};

/**
 * A phone, as opposed to the screen being set up.
 *
 * This page claims whatever device it is opened on, so arriving here from a
 * phone is almost always a wrong turn: people tap "Set up a screen" on the
 * device in their hand rather than on the television. A tablet propped in a
 * hallway is a legitimate display though, and tablets match a coarse pointer
 * too, so this only changes what is offered first — it never blocks the way
 * through.
 */
const PHONE_QUERY = '(max-width: 640px) and (pointer: coarse)';

function subscribePhone(onChange: () => void): () => void {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function SetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stale = searchParams.get('stale') === '1';
  const stored = useSyncExternalStore(
    noSubscription,
    () => localStorage.getItem(SCREEN_STORAGE_KEY),
    () => null
  );
  const storedId = stale ? null : stored;
  const host = useSyncExternalStore(
    noSubscription,
    () => `${window.location.host}/s`,
    () => ''
  );
  const [creating, setCreating] = useState(false);
  const [failed, setFailed] = useState(false);
  const isPhone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
  /** Set when someone on a phone says they really do mean this device. */
  const [useThisDevice, setUseThisDevice] = useState(false);

  // A stale id means the screen no longer exists — forget it.
  useEffect(() => {
    if (stale) localStorage.removeItem(SCREEN_STORAGE_KEY);
  }, [stale]);

  // A TV that was already set up goes straight back to its display.
  useEffect(() => {
    if (storedId) router.replace(`/tv/${storedId}`);
  }, [storedId, router]);

  const start = async () => {
    setCreating(true);
    setFailed(false);
    try {
      const id = await createScreen();
      localStorage.setItem(SCREEN_STORAGE_KEY, id);
      router.replace(`/tv/${id}`);
    } catch {
      setFailed(true);
      setCreating(false);
    }
  };

  if (storedId) return null;

  // Arrived on a phone: say where to go instead of claiming this device.
  if (isPhone && !useThisDevice) {
    return (
      <div className="min-h-screen bg-background flex items-center px-6 py-12">
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center gap-7">
          <Logo size="md" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">You&apos;re on your phone.</p>
            <h1 className="font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.035em] mb-3">
              Open this on the TV
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              This page sets up whichever screen it&apos;s opened on. Go to the
              TV, open its browser, and type:
            </p>
          </div>

          {host && (
            <div className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-5">
              <p className="font-mono text-lg font-semibold break-all">{host}</p>
            </div>
          )}

          <div className="w-full rounded-xl border border-border p-5 text-left">
            <p className="text-sm font-medium mb-3">Then, back on your phone:</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>The TV shows a QR code.</li>
              <li>Scan it with your camera.</li>
              <li>Pick your times, language and theme, and save.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => setUseThisDevice(true)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Use this device as the display instead
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'Press Start', text: 'on this TV. It shows a code.' },
    { title: 'Scan the code', text: 'with your phone’s camera.' },
    { title: 'Pick your city', text: 'and the times appear here.' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <Logo size="md" />
          <h1 className="mt-8 font-heading text-4xl sm:text-6xl font-semibold leading-[1.02] tracking-[-0.04em] text-balance">
            Set up this screen
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-md leading-relaxed text-pretty">
            Prayer times on this TV in about two minutes. You finish from your phone. No account, no app.
          </p>

          {/* The whole setup, in three: this TV, the phone, done. */}
          <ol className="mt-8 grid w-full max-w-xl gap-4 sm:grid-cols-3 sm:gap-5 text-left">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3 sm:block">
                <span
                  aria-hidden
                  className={`block text-[34px] leading-none font-semibold tabular-nums tracking-[-0.05em] ${i === 0 ? 'text-primary' : 'text-foreground/20'}`}
                >
                  {i + 1}
                </span>
                <span className="sm:mt-2 block">
                  <span className="block font-semibold">{step.title}</span>
                  <span className="block text-sm text-muted-foreground leading-snug">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* Selected from the start, so the remote's OK presses it; the ring shows it is. */}
          <Button
            size="lg"
            className="mt-10 h-16 min-w-60 px-12 text-xl gap-3 has-[>svg]:px-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus:ring-4 focus:ring-primary/40 focus:ring-offset-4 focus:ring-offset-background"
            onClick={start}
            disabled={creating}
            autoFocus
          >
            {creating ? <Loader2 className="size-6 animate-spin" /> : <MonitorUp className="size-6" />}
            {creating ? 'Preparing…' : 'Start'}
          </Button>
          {failed ? (
            <p className="mt-4 text-sm text-destructive">Something went wrong. Try again.</p>
          ) : stale ? (
            <p className="mt-4 text-sm text-muted-foreground">That screen was removed, so this TV needs setting up again.</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Press OK on the remote, or click.</p>
          )}

          <p className="mt-10 flex max-w-md items-start gap-2 text-left text-sm text-muted-foreground">
            <Tv className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Works on a smart TV, streaming stick, Raspberry Pi or laptop with a browser
              {host ? (
                <>
                  , at <span className="font-mono text-foreground">{host}</span>
                </>
              ) : null}
              .
            </span>
          </p>
        </div>

        {/* What the TV will look like once set up */}
        <div className="hidden sm:block">
          <ShowcaseWrapper />
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupInner />
    </Suspense>
  );
}
