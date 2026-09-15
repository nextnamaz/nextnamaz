'use client';

import dynamic from 'next/dynamic';

/* Step 3 renders the live display theme, which reads a running clock, so the
   whole row is client-only. The placeholder holds the stage height to stop the
   page jumping when it swaps in. */
const HowItWorks = dynamic(() => import('./how-it-works').then((m) => m.HowItWorks), {
  ssr: false,
  loading: () => (
    <div className="grid gap-x-10 gap-y-12 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col">
          <div className="mb-6 h-[190px] rounded-xl border border-border bg-secondary/40 sm:h-[170px]" />
          <div className="h-5" />
        </div>
      ))}
    </div>
  ),
});

export function HowItWorksWrapper() {
  return <HowItWorks />;
}
