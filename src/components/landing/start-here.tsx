'use client';

import { useSyncExternalStore } from 'react';
import { Tv, Smartphone } from 'lucide-react';
import { LANDING_COPY } from '@/lib/landing-copy';
import { SITE_URL } from '@/lib/site';

/**
 * Always the canonical public address, never window.location.host: this is
 * what someone types into a television, so "localhost:3000" is useless and a
 * server/client split on www would be a hydration mismatch.
 */
const PUBLIC_HOST = new URL(SITE_URL).host;

const PHONE_QUERY = '(max-width: 640px), (pointer: coarse)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Whether this visitor is most likely holding a phone. Read through
 * useSyncExternalStore so the server renders the desktop case and the client
 * corrects it without a setState-in-effect, which the React Compiler rules
 * disallow.
 */
function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
}

/**
 * The address to open, said plainly.
 *
 * Nearly everyone's first instinct is to start on the phone they are already
 * holding, and that is the one thing that cannot work: the screen has to claim
 * itself. Saying so next to the button costs a line and saves a support
 * message.
 */
export function StartHere() {
  const isPhone = useIsPhone();
  const t = LANDING_COPY.hero;
  return (
    <div className="max-w-xl rounded-xl border border-border bg-secondary/40 px-4 py-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Tv className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="text-muted-foreground">{t.startOnTv}</span>
        <span className="font-mono font-semibold text-foreground">
          {PUBLIC_HOST}
          {t.startOnTvPath}
        </span>
      </p>
      {isPhone && (
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{t.phoneHint}</span>
        </p>
      )}
    </div>
  );
}
