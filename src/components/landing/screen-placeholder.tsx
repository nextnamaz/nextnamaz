/**
 * The demo display's blocks in its own colours, for the moment before the
 * live screen mounts, so the swap is quiet. Fills a TvFrame's picture.
 */
/** The themes a landing-page set can run. */
export type DemoTheme = 'default' | 'sky' | 'paper' | 'ivory' | 'globe';

/** Each other theme's ground, edge to edge: Sky's midday blue, Paper, Ivory's wall, the night sky. */
const GROUND: Record<Exclude<DemoTheme, 'default'>, string> = {
  sky: '#8FBFE8',
  paper: '#F6F5F1',
  ivory: '#FAF6EE',
  globe: '#05070D',
};

export function ScreenPlaceholder({ theme = 'default' }: { theme?: DemoTheme }) {
  if (theme !== 'default') return <div aria-hidden className="absolute inset-0" style={{ background: GROUND[theme] }} />;
  return (
    <div aria-hidden className="absolute inset-0 grid grid-cols-2 grid-rows-[31.4%_1fr_5.7%] bg-slate-50">
      <div className="col-span-2 bg-linear-to-b from-slate-300 to-slate-100" />
      <div />
      <div className="bg-[#465161]" />
      <div className="col-span-2 bg-white" />
    </div>
  );
}
