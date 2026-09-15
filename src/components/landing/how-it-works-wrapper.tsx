'use client';

import dynamic from 'next/dynamic';

/* Step 3 renders the live display theme, which reads a running clock, so the
   whole row is client-only. The placeholder holds the stage height to stop the
   page jumping when it swaps in. */
const HowItWorks = dynamic(() => import('./how-it-works').then((m) => m.HowItWorks), {
  ssr: false,
  loading: () => (
    <div className="grid gap-x-16 gap-y-16 sm:grid-cols-3 lg:gap-x-20">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex flex-col">
          <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-[15px] font-bold tabular-nums text-primary-foreground">
            {n}
          </span>
          <div className="mb-5 h-[240px] rounded-2xl border border-border bg-secondary/40" />
          <div className="h-5" />
        </div>
      ))}
    </div>
  ),
});

export function HowItWorksWrapper() {
  return <HowItWorks />;
}
