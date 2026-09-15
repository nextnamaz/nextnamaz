'use client';

import dynamic from 'next/dynamic';

/* Client-only: the display themes read a running clock. The placeholder
   mirrors the geometry (a 16:9 panel beside a narrow phone) so nothing shifts
   when the live preview swaps in. */
const ShowcaseDemo = dynamic(() => import('./showcase-demo').then((m) => m.ShowcaseDemo), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-end gap-5 sm:flex-row sm:items-start sm:gap-5">
      <div className="w-full min-w-0 sm:flex-1">
        <div className="rounded-[10px] bg-[#0B0B0D] p-[4px] pb-[10px]">
          <div className="aspect-video w-full rounded-[6px] bg-muted" />
        </div>
        <div className="mx-auto h-3.5 w-16 bg-[#0B0B0D]" />
        <div className="mx-auto h-[5px] w-44 rounded-b-md bg-[#141418]" />
      </div>
      <div className="-mt-3 mr-[4%] aspect-[390/844] w-[52%] max-w-[220px] shrink-0 -rotate-3 rounded-[16px] bg-[#0B0B0D] sm:mt-0 sm:mr-0 sm:w-[29%]" />
    </div>
  ),
});

export function ShowcaseWrapper() {
  return <ShowcaseDemo />;
}
