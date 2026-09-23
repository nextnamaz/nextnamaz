import { Check, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrayerState } from '@/components/display/themes/config';
import { FeaturesToday } from './features-today';

/**
 * A still of the Default theme in its Classic colours, landscape, for the
 * small televisions in the features section. It copies the real theme's grid,
 * colours and container-unit sizes without its clock or countdown, so several
 * sets on one page cost nothing to keep running.
 *
 * Kept by hand in step with themes/default.tsx (its MODES, CLASSIC_PALETTE,
 * nameScale and the .dt-landscape sizes). Change one, change the other.
 *
 * Must sit inside a box with `containerType: 'size'`, like the theme itself.
 */

export interface BoardRow {
  name: string;
  time: string;
  state: PrayerState;
  sunrise?: boolean;
}

export interface BoardProps {
  clock: string;
  labels: { prayer: string; begins: string; next: string };
  rows: BoardRow[];
  next: { name: string; time: string; countdown: string };
  footer: string;
  mode?: 'light' | 'dark';
  /** The language the board is written in, so `uppercase` cases it right (Turkish İkindi → İKİNDİ, not İKINDI). */
  lang?: string;
}

interface ModeTokens {
  header: string;
  clock: string;
  date: string;
  body: string;
  th: string;
  border: string;
  rowOdd: string;
  rowEven: string;
  cell: string;
  footer: string;
}

const MODES: Record<'light' | 'dark', ModeTokens> = {
  light: {
    header: 'bg-linear-to-b from-slate-300 to-slate-100',
    clock: 'text-slate-800',
    date: 'text-slate-800/80',
    body: 'bg-slate-50',
    th: 'bg-slate-200 text-slate-800',
    border: 'border-slate-300',
    rowOdd: 'bg-linear-to-r from-slate-200/60 to-slate-50',
    rowEven: 'bg-slate-50',
    cell: 'text-slate-800',
    footer: 'bg-white text-slate-700',
  },
  dark: {
    header: 'bg-linear-to-b from-gray-800 to-gray-900',
    clock: 'text-gray-100',
    date: 'text-gray-400',
    body: 'bg-gray-900',
    th: 'bg-gray-800 text-gray-300',
    border: 'border-gray-700',
    rowOdd: 'bg-linear-to-r from-gray-800/60 to-gray-900',
    rowEven: 'bg-gray-900',
    cell: 'text-gray-100',
    footer: 'bg-gray-950 text-gray-400',
  },
};

/** The Classic accents. */
const CURRENT = '#4caf50';
const CURRENT_BG = 'rgba(76,175,80,0.15)';
const NEXT = '#ff8c00';
const NEXT_BG = 'rgba(255,165,0,0.15)';
const PANEL = '#64748b';

const THEME_FONT = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
const PANEL_FONT =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** The theme's rule: long names shrink rather than wrap. */
function nameScale(name: string): string | undefined {
  if (name.length >= 12) return '0.62em';
  if (name.length >= 10) return '0.78em';
  return undefined;
}

/** Vertical padding of the header and body cells. */
const PAD = '1.6% 0';

export function Board({ clock, labels, rows, next, footer, mode = 'light', lang }: BoardProps) {
  const m = MODES[mode];

  return (
    <div
      lang={lang}
      className="absolute inset-0 grid overflow-hidden select-none"
      style={{
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        gridTemplateAreas: '"headers headers" "body next" "footer footer"',
        fontFamily: THEME_FONT,
      }}
    >
      <header
        className={cn('flex flex-col items-center justify-center shadow-md', m.header)}
        style={{ gridArea: 'headers' }}
      >
        <p className={cn('m-0 font-extrabold leading-[90%]', m.clock)} style={{ fontSize: '19cqmin', paddingTop: '2%' }}>
          {clock}
        </p>
        <p className={cn('m-0 font-semibold', m.date)} style={{ fontSize: '6cqmin', paddingBottom: '1%' }}>
          <FeaturesToday />
        </p>
      </header>

      <div className={cn('h-full w-full overflow-hidden', m.body)} style={{ gridArea: 'body' }}>
        <div className="grid h-full w-full" style={{ gridTemplateRows: 'auto repeat(6, minmax(0, 1fr))' }}>
          <section className={cn('flex items-center border-t border-b uppercase', m.th, m.border)}>
            <div
              className={cn('flex flex-1 items-center border-r-2 font-extrabold', m.border)}
              style={{ fontSize: '5cqmin', padding: '1.5% 0', paddingInlineStart: '4cqmin' }}
            >
              {labels.prayer}
            </div>
            <div className="flex flex-2 items-center justify-center font-extrabold" style={{ fontSize: '5cqmin', padding: '1.5% 0' }}>
              {labels.begins}
            </div>
          </section>

          {rows.map((row, idx) => {
            const isCurrent = row.state === 'current';
            const isNext = row.state === 'next';
            const isPast = row.state === 'past';
            const plain = !isCurrent && !isNext && !isPast;
            const stripe = plain ? (idx % 2 === 1 ? m.rowOdd : m.rowEven) : undefined;
            return (
              <section
                key={row.name}
                className={cn('relative flex items-center', isPast && 'opacity-70', stripe)}
                style={{ backgroundColor: isCurrent ? CURRENT_BG : isNext ? NEXT_BG : undefined }}
              >
                {(isCurrent || isNext) && (
                  <span
                    className="absolute top-0 left-0 h-full"
                    style={{ width: '0.4cqmin', backgroundColor: isCurrent ? CURRENT : NEXT }}
                  />
                )}
                <div
                  className={cn(
                    'flex h-full min-w-0 flex-1 items-center overflow-hidden border-r border-b font-bold',
                    m.cell,
                    m.border,
                    stripe
                  )}
                  style={{ fontSize: '5cqmin', padding: PAD, paddingInlineStart: '4cqmin' }}
                >
                  {isPast && (
                    <span
                      className="inline-flex items-center justify-center rounded-full text-white opacity-80"
                      style={{ backgroundColor: CURRENT, padding: '0.5cqmin', marginRight: '0.7cqmin' }}
                    >
                      <Check style={{ width: '2.8cqmin', height: '2.8cqmin' }} strokeWidth={4} />
                    </span>
                  )}
                  <span
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ fontSize: nameScale(row.name) }}
                  >
                    {row.name}
                  </span>
                  {row.sunrise && (
                    <Sunrise className="ml-[0.3em] shrink-0 text-amber-500" style={{ height: '3cqmin', width: 'auto' }} />
                  )}
                  {isNext && !row.sunrise && (
                    <span
                      className="inline-flex items-center justify-center font-bold text-white"
                      style={{
                        backgroundColor: NEXT,
                        marginLeft: '1.4cqmin',
                        padding: '0.1cqmin 0.5cqmin',
                        fontSize: '2.2cqmin',
                        borderRadius: '0.5cqmin',
                      }}
                    >
                      {labels.next}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'flex h-full flex-2 items-center justify-center border-b font-bold',
                    m.cell,
                    m.border,
                    isPast && 'line-through'
                  )}
                  style={{ fontSize: '5cqmin', padding: PAD }}
                >
                  {row.time}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div
        className="relative flex flex-col items-center justify-center overflow-hidden text-center"
        style={{ gridArea: 'next', backgroundColor: PANEL, fontSize: '8cqmin', fontFamily: PANEL_FONT }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="relative flex w-full flex-col items-center"
          style={{ padding: '0.5cqmin 0.3cqmin', paddingBottom: '5cqmin', gap: '0.5cqmin' }}
        >
          <p className="m-0 leading-none font-medium text-white/90 opacity-85" style={{ fontSize: '0.7em', paddingTop: '0.5cqmin' }}>
            {labels.next}...
          </p>
          <div style={{ transform: 'scale(1.05)', margin: '0.5cqmin 0' }}>
            <p className="m-0 leading-none font-extrabold tracking-[0.07em] text-white uppercase" style={{ fontSize: '0.85em' }}>
              {next.name}
            </p>
            <p className="m-0 leading-none font-black text-white" style={{ fontSize: '2.5em', letterSpacing: '-0.02em' }}>
              {next.time}
            </p>
          </div>
          <p className="m-0 leading-none font-bold text-white/90" style={{ fontSize: '7cqmin', marginTop: '0.3cqmin' }}>
            {next.countdown}
          </p>
        </div>
      </div>

      <footer
        className={cn('flex items-center justify-center overflow-hidden text-center leading-tight font-bold whitespace-nowrap', m.footer)}
        style={{ gridArea: 'footer', fontSize: '2.5cqmin', padding: '1.3cqmin 0' }}
      >
        {footer}
      </footer>
    </div>
  );
}
