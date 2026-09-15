'use client';

import dynamic from 'next/dynamic';

/* Step 3 renders the live display theme, which reads a running clock, so the
   whole row is client-only. The placeholder holds the stage height to stop the
   page jumping when it swaps in. */
const HowItWorks = dynamic(() => import('./how-it-works').then((m) => m.HowItWorks), {
  ssr: false,
  loading: () => (
    <div className="grid gap-x-16 gap-y-20 sm:grid-cols-3 lg:gap-x-20">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Step {i + 1} of 3
            </span>
          </div>
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
