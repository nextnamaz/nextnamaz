/**
 * The demo display's blocks in its own colours, for the moment before the
 * live screen mounts, so the swap is quiet. Fills a TvFrame's picture.
 */
export function ScreenPlaceholder() {
  return (
    <div aria-hidden className="absolute inset-0 grid grid-cols-2 grid-rows-[31.4%_1fr_5.7%] bg-slate-50">
      <div className="col-span-2 bg-linear-to-b from-slate-300 to-slate-100" />
      <div />
      <div className="bg-[#465161]" />
      <div className="col-span-2 bg-white" />
    </div>
  );
}
