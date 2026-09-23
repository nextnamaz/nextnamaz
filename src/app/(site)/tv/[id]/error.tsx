'use client';

import { useEffect } from 'react';

/** How long to wait before trying the display again, in ms. */
const RETRY_MS = 15_000;

/**
 * The display could not be loaded: the network or the database failed for a
 * moment. The TV keeps its screen id and tries again on its own; nobody is
 * standing at it to press a button, and it must never fall back to setup.
 */
export default function TvError({ retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    const id = setTimeout(retry, RETRY_MS);
    return () => clearTimeout(id);
  }, [retry]);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-black text-white/60">
      <p className="text-lg">Reconnecting…</p>
    </div>
  );
}
