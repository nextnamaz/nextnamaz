'use client';

import dynamic from 'next/dynamic';

/* The placeholder mirrors the TV frame's geometry so nothing shifts
   when the live preview swaps in. */
const ShowcaseDemo = dynamic(
  () => import('./showcase-demo').then(m => m.ShowcaseDemo),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#17150F] rounded-xl p-2.5 pb-4">
          <div className="w-full aspect-video rounded-[3px] bg-muted" />
        </div>
        <div className="mt-4 h-4" />
      </div>
    ),
  },
);

export function ShowcaseWrapper() {
  return <ShowcaseDemo />;
}
