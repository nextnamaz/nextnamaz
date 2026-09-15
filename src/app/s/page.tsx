'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Cast, Cpu, MonitorUp, Tv } from 'lucide-react';
import { createScreen } from '@/lib/actions';
import { SCREEN_STORAGE_KEY } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';

const noSubscription = () => () => {};

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

  return (
    <div className="min-h-screen bg-background flex items-center px-6 py-12">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <Logo size="md" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Step 1 of 2 · On this TV
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.015em] mb-4">
              Set up this screen
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Press start on the TV that should show prayer times. You&apos;ll
              finish from your phone. No account needed.
            </p>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-border bg-secondary/40 p-5 text-left">
            <p className="text-sm font-medium mb-3">Works on any screen with a browser:</p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Tv className="size-4 text-primary shrink-0" /> A smart TV
              </li>
              <li className="flex items-center gap-2.5">
                <Cast className="size-4 text-primary shrink-0" /> A Fire Stick or Chromecast
              </li>
              <li className="flex items-center gap-2.5">
                <Cpu className="size-4 text-primary shrink-0" /> A Raspberry Pi or old laptop plugged into the TV
              </li>
            </ul>
            {host && (
              <p className="text-sm text-muted-foreground mt-3">
                Open its browser and go to{' '}
                <span className="font-mono text-foreground">{host}</span>.
              </p>
            )}
          </div>
          <Button size="lg" className="px-10 h-14 text-lg" onClick={start} disabled={creating} autoFocus>
            <MonitorUp className="w-5 h-5 mr-2" />
            {creating ? 'Preparing…' : 'Start'}
          </Button>
          {failed ? (
            <p className="text-sm text-destructive">Something went wrong. Try again.</p>
          ) : stale ? (
            <p className="text-sm text-muted-foreground">
              That screen was removed, so this TV needs setting up again.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Takes about two minutes.</p>
          )}
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
