'use client';

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MonitorUp } from 'lucide-react';
import { createScreen } from '@/lib/actions';
import { SCREEN_STORAGE_KEY } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8 text-center">
      <Logo size="lg" />
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Set up this screen</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Open this page on the TV that should show prayer times, then press start.
          You&apos;ll finish the setup from your phone — no account needed.
        </p>
      </div>
      <Button size="lg" className="px-9 h-13 text-base" onClick={start} disabled={creating} autoFocus>
        <MonitorUp className="w-5 h-5 mr-2" />
        {creating ? 'Preparing…' : 'Start'}
      </Button>
      {failed && <p className="text-sm text-destructive">Something went wrong — try again.</p>}
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
