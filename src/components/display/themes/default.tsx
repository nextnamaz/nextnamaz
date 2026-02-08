'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { cn } from '@/lib/utils';
import { Check, Sunrise } from 'lucide-react';

type PrayerState = 'past' | 'current' | 'next' | 'upcoming';
type UrgencyLevel = 'normal' | 'approaching' | 'imminent';

// --- Color palettes (accents) ---

interface PaletteConfig {
  current: string;
  currentBg: string;
  next: string;
  nextBg: string;
  panel: string;
  pulseRgb: string;
}

const PALETTES: Record<string, PaletteConfig> = {
  classic: {
    current: '#4caf50',
    currentBg: 'rgba(76,175,80,0.15)',
    next: '#ff8c00',
    nextBg: 'rgba(255,165,0,0.15)',
    panel: '#64748b',
    pulseRgb: '76,175,80',
  },
  ocean: {
    current: '#0891b2',
    currentBg: 'rgba(8,145,178,0.15)',
    next: '#d97706',
    nextBg: 'rgba(217,119,6,0.12)',
    panel: '#0e7490',
    pulseRgb: '8,145,178',
  },
  emerald: {
    current: '#059669',
    currentBg: 'rgba(5,150,105,0.15)',
    next: '#d97706',
    nextBg: 'rgba(217,119,6,0.12)',
    panel: '#047857',
    pulseRgb: '5,150,105',
  },
  royal: {
    current: '#6366f1',
    currentBg: 'rgba(99,102,241,0.15)',
    next: '#d97706',
    nextBg: 'rgba(217,119,6,0.12)',
    panel: '#4338ca',
    pulseRgb: '99,102,241',
  },
  crimson: {
    current: '#e11d48',
    currentBg: 'rgba(225,29,72,0.12)',
    next: '#d97706',
    nextBg: 'rgba(217,119,6,0.12)',
    panel: '#be123c',
    pulseRgb: '225,29,72',
  },
  midnight: {
    current: '#3b82f6',
    currentBg: 'rgba(59,130,246,0.15)',
    next: '#f97316',
    nextBg: 'rgba(249,115,22,0.12)',
    panel: '#1e3a5f',
    pulseRgb: '59,130,246',
  },
};

// --- Mode (light / dark base) ---

interface ModeClasses {
  header: string;
  clockText: string;
  dateText: string;
  bodyBg: string;
  thBg: string;
  thText: string;
  border: string;
  rowOdd: string;
  rowEven: string;
  cellText: string;
  footer: string;
}

const MODES: Record<string, ModeClasses> = {
  light: {
    header: 'bg-linear-to-b from-slate-300 to-slate-100',
    clockText: 'text-slate-800',
    dateText: 'text-slate-800/80',
    bodyBg: 'bg-slate-50',
    thBg: 'bg-slate-200',
    thText: 'text-slate-800',
    border: 'border-slate-300',
    rowOdd: 'bg-linear-to-r from-slate-200/60 to-slate-50',
    rowEven: 'bg-slate-50',
    cellText: 'text-slate-800',
    footer: 'bg-white text-slate-700',
  },
  dark: {
    header: 'bg-linear-to-b from-gray-800 to-gray-900',
    clockText: 'text-gray-100',
    dateText: 'text-gray-400',
    bodyBg: 'bg-gray-900',
    thBg: 'bg-gray-800',
    thText: 'text-gray-300',
    border: 'border-gray-700',
    rowOdd: 'bg-linear-to-r from-gray-800/60 to-gray-900',
    rowEven: 'bg-gray-900',
    cellText: 'text-gray-100',
    footer: 'bg-gray-950 text-gray-400',
  },
};

// --- Hooks ---

function usePrayerStates(
  prayers: ThemeProps['prayers'],
  nextPrayer: ThemeProps['nextPrayer']
): PrayerState[] {
  return useMemo(() => {
    const nextIdx = nextPrayer
      ? prayers.findIndex((p) => p.name === nextPrayer.name)
      : -1;

    return prayers.map((_, idx) => {
      if (nextIdx === -1) {
        return idx === prayers.length - 1 ? 'current' : 'past';
      }
      if (idx === nextIdx) return 'next';
      if (nextIdx === 0) {
        return idx === prayers.length - 1 ? 'current' : 'upcoming';
      }
      if (idx === nextIdx - 1) return 'current';
      if (idx < nextIdx) return 'past';
      return 'upcoming';
    });
  }, [prayers, nextPrayer]);
}

function useCountdown(targetTime: string) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const [h, m] = targetTime.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      setDiff(Math.floor((target.getTime() - now.getTime()) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  const totalMinutes = hours * 60 + minutes;

  const urgency: UrgencyLevel =
    totalMinutes <= 5 ? 'imminent' : totalMinutes <= 15 ? 'approaching' : 'normal';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const text = `${hours}:${pad(minutes)}:${pad(seconds)}`;

  return { urgency, text };
}

// --- Theme definition ---

export const defaultDefinition: ThemeDefinition = {
  id: 'default',
  name: 'Default',
  description: 'Clean table layout with next prayer panel',
  preview: 'bg-[#374151]',
  component: DefaultTheme,
  fields: [
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      defaultValue: 'light',
      description: 'Light or dark base',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
    },
    {
      key: 'colorScheme',
      label: 'Color Scheme',
      type: 'select',
      defaultValue: 'classic',
      description: 'Accent color palette',
      options: [
        { value: 'classic', label: 'Classic' },
        { value: 'ocean', label: 'Ocean' },
        { value: 'emerald', label: 'Emerald' },
        { value: 'royal', label: 'Royal' },
        { value: 'crimson', label: 'Crimson' },
        { value: 'midnight', label: 'Midnight' },
      ],
    },
    {
      key: 'displayText',
      label: 'Footer Text',
      type: 'text',
      defaultValue: 'بسم الله الرحمن الرحيم',
      description: 'Text shown at the bottom of the display',
    },
  ],
  defaultConfig: {
    mode: 'light',
    colorScheme: 'classic',
    displayText: 'بسم الله الرحمن الرحيم',
  },
};

// --- Theme component ---

export function DefaultTheme({ prayers, nextPrayer, config, isPortrait }: ThemeProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });
  const dateStr = time.toLocaleDateString('en-GB');
  const prayerStates = usePrayerStates(prayers, nextPrayer);
  const hasIqamah = prayers.some((p) => p.iqamahTime);
  const countdown = useCountdown(nextPrayer?.time ?? '00:00');

  const palette =
    PALETTES[(config?.colorScheme as string) ?? 'classic'] ?? PALETTES.classic;
  const m =
    MODES[(config?.mode as string) ?? 'light'] ?? MODES.light;

  const displayText =
    typeof config?.displayText === 'string'
      ? config.displayText
      : 'بسم الله الرحمن الرحيم';

  const rootStyle = {
    '--dt-pulse-rgb': palette.pulseRgb,
  } as React.CSSProperties;

  return (
    <div className={cn('default-theme', isPortrait ? 'dt-portrait' : 'dt-landscape')} style={rootStyle}>
      {/* Header */}
      <header className={cn('default-header shadow-md flex flex-col items-center justify-center', m.header)}>
        <p className={cn('default-clock font-extrabold leading-[90%] m-0', m.clockText)}>
          {timeStr}
        </p>
        <p className={cn('default-date font-semibold m-0', m.dateText)}>
          {dateStr}
        </p>
      </header>

      {/* Prayer Table */}
      <div className={cn('default-body w-full h-full overflow-hidden', m.bodyBg)}>
        <div className="default-table">
          {/* Table Header */}
          <section className={cn('flex items-center border-b border-t uppercase', m.thBg, m.border)}>
            <h2 className={cn('default-th flex-1 flex items-center justify-start border-r-2 m-0 pl-[3%] font-extrabold', m.thText, m.border)}>
              Prayer
            </h2>
            <h2 className={cn('default-th flex-2 flex items-center justify-center m-0 font-extrabold', m.thText)}>
              Begins
            </h2>
          </section>

          {/* Prayer Rows */}
          {prayers.map((prayer, idx) => {
            const state = prayerStates[idx];
            const isCurrent = state === 'current';
            const isNext = state === 'next';
            const isPast = state === 'past';
            const isSunrise = prayer.name === 'sunrise';
            const isOdd = idx % 2 === 1;
            const plain = !isCurrent && !isNext && !isPast;

            return (
              <section
                key={prayer.name}
                style={{
                  backgroundColor: isCurrent
                    ? palette.currentBg
                    : isNext
                      ? palette.nextBg
                      : undefined,
                }}
                className={cn(
                  'default-row flex items-center relative transition-all duration-300',
                  isCurrent && 'z-10',
                  isPast && 'opacity-70',
                  plain && isOdd && m.rowOdd,
                  plain && !isOdd && m.rowEven
                )}
              >
                {/* Active left border bar */}
                {isCurrent && (
                  <div
                    className="absolute left-0 top-0 h-full z-2 default-indicator-bar default-pulse"
                    style={{ backgroundColor: palette.current }}
                  />
                )}
                {isNext && (
                  <div
                    className="absolute left-0 top-0 h-full z-2 default-indicator-bar"
                    style={{ backgroundColor: palette.next }}
                  />
                )}

                {/* Prayer Name */}
                <h2
                  className={cn(
                    'default-cell flex-1 flex items-center border-b border-r h-full pl-[3%] m-0 font-bold',
                    m.cellText,
                    m.border,
                    plain && isOdd && m.rowOdd,
                    plain && !isOdd && m.rowEven
                  )}
                >
                  {isPast && (
                    <span
                      className="default-checkmark inline-flex items-center justify-center rounded-full text-white opacity-80"
                      style={{ backgroundColor: palette.current }}
                    >
                      <Check className="default-check-icon" strokeWidth={4} />
                    </span>
                  )}
                  <span>{prayer.displayName}</span>
                  {isSunrise && (
                    <span className="inline-flex items-center ml-[0.3em]">
                      <Sunrise className="default-sunrise-icon text-amber-500" />
                    </span>
                  )}
                  {isNext && !isSunrise && (
                    <span
                      className="default-next-badge inline-flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: palette.next }}
                    >
                      Next
                    </span>
                  )}
                </h2>

                {/* Times */}
                {hasIqamah && prayer.iqamahTime ? (
                  <>
                    <h2
                      className={cn(
                        'default-cell flex-1 flex items-center justify-center border-b h-full m-0 font-bold',
                        m.cellText,
                        m.border,
                        isPast && 'line-through'
                      )}
                    >
                      {prayer.time}
                    </h2>
                    <h2
                      className={cn(
                        'default-cell flex-1 flex items-center justify-center border-b border-l h-full m-0 font-bold',
                        m.cellText,
                        m.border,
                        isPast && 'line-through'
                      )}
                    >
                      {prayer.iqamahTime}
                    </h2>
                  </>
                ) : (
                  <h2
                    className={cn(
                      'default-cell flex-2 flex items-center justify-center border-b h-full m-0 font-bold',
                      m.cellText,
                      m.border,
                      isPast && 'line-through'
                    )}
                  >
                    {prayer.time}
                  </h2>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Next Prayer Panel */}
      <div
        className="default-next relative overflow-hidden flex flex-col justify-center items-center text-center"
        style={{ backgroundColor: palette.panel }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30 z-1 pointer-events-none" />

        <div className="default-next-content relative z-2 w-full backdrop-blur-sm flex flex-col items-center">
          {/* "Next..." label */}
          <div className="default-next-secondary">
            <p className="text-white/90 m-0 leading-none font-medium opacity-85">
              Next...
            </p>
          </div>

          {/* Prayer name + time */}
          <div className="default-next-primary relative">
            <p className="text-white uppercase m-0 leading-none font-extrabold tracking-[0.07em]">
              {nextPrayer?.displayName ?? '--'}
            </p>
            <p className="text-white m-0 leading-none font-black tracking-tight">
              {nextPrayer?.time ?? '--:--'}
            </p>
          </div>

          {/* Countdown */}
          <div className="default-next-countdown">
            <p
              className={cn(
                'm-0 leading-none font-bold transition-colors duration-300',
                countdown.urgency === 'normal' && 'text-white/90',
                countdown.urgency === 'approaching' &&
                  'text-amber-200 font-semibold',
                countdown.urgency === 'imminent' &&
                  'text-red-200 animate-pulse'
              )}
            >
              {countdown.text}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={cn('default-footer flex items-center justify-center text-center font-bold overflow-hidden whitespace-nowrap text-ellipsis leading-tight', m.footer)}>
        {displayText}
      </footer>

      {/* Scoped styles for viewport-unit sizing & grid layout */}
      <style>{`
        .default-theme {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* ---- Portrait Grid ---- */
        .dt-portrait {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr) auto;
          grid-template-areas:
            "headers"
            "body"
            "next-prayer"
            "footer";
        }
        .dt-portrait .default-clock { font-size: 22.5cqmin; padding-top: 4%; }
        .dt-portrait .default-date { font-size: 7.5cqmin; padding-bottom: 1%; }
        .dt-portrait .default-th { font-size: 5cqmin; padding: 1.5% 0; }
        .dt-portrait .default-cell { font-size: 6cqmin; padding: 1.6% 0; }
        .dt-portrait .default-indicator-bar { width: 0.4cqmin; }
        .dt-portrait .default-checkmark { padding: 0.5cqmin; margin-right: 0.7cqmin; }
        .dt-portrait .default-check-icon { width: 2.5cqmin; height: 2.5cqmin; }
        .dt-portrait .default-sunrise-icon { height: 3cqmin; width: auto; }
        .dt-portrait .default-next-badge {
          margin-left: 1.4cqmin;
          padding: 0.1cqmin 0.5cqmin;
          font-size: 2.2cqmin;
          border-radius: 0.5cqmin;
        }
        .dt-portrait .default-next { font-size: 9cqmin; }
        .dt-portrait .default-next-content {
          padding: 0.5cqmin 0.3cqmin;
          padding-bottom: 3cqmin;
          gap: 0.5cqmin;
        }
        .dt-portrait .default-next-countdown p { font-size: 7cqmin; }
        .dt-portrait .default-footer { font-size: 3.5cqmin; padding: 1.9cqmin 0; }

        /* ---- Landscape Grid ---- */
        .dt-landscape {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "headers headers"
            "body next-prayer"
            "footer footer";
        }
        .dt-landscape .default-clock { font-size: 19cqmin; padding-top: 2%; }
        .dt-landscape .default-date { font-size: 6cqmin; padding-bottom: 1%; }
        .dt-landscape .default-th { font-size: 5cqmin; padding: 1.5% 0; }
        .dt-landscape .default-cell { font-size: 5cqmin; padding: 1.6% 0; }
        .dt-landscape .default-indicator-bar { width: 0.4cqmin; }
        .dt-landscape .default-checkmark { padding: 0.5cqmin; margin-right: 0.7cqmin; }
        .dt-landscape .default-check-icon { width: 2.8cqmin; height: 2.8cqmin; }
        .dt-landscape .default-sunrise-icon { height: 3cqmin; width: auto; }
        .dt-landscape .default-next-badge {
          margin-left: 1.4cqmin;
          padding: 0.1cqmin 0.5cqmin;
          font-size: 2.2cqmin;
          border-radius: 0.5cqmin;
        }
        .dt-landscape .default-next { font-size: 8cqmin; }
        .dt-landscape .default-next-content {
          padding: 0.5cqmin 0.3cqmin;
          padding-bottom: 5cqmin;
          gap: 0.5cqmin;
        }
        .dt-landscape .default-next-countdown p { font-size: 7cqmin; }
        .dt-landscape .default-footer { font-size: 2.5cqmin; padding: 1.3cqmin 0; }

        .default-header { grid-area: headers; }
        .default-body { grid-area: body; }
        .default-next { grid-area: next-prayer; }
        .default-footer { grid-area: footer; }

        .default-table {
          display: grid;
          width: 100%;
          height: 100%;
          grid-template-columns: 1fr;
          grid-template-rows: repeat(7, 1fr);
        }

        /* Next prayer section */
        .default-next {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .default-next-secondary {
          margin-bottom: 0.2cqmin;
          padding-top: 0.5cqmin;
        }
        .default-next-secondary p { font-size: 0.7em; }
        .default-next-primary {
          transform: scale(1.05);
          margin: 0.5cqmin 0;
        }
        .default-next-primary p:first-child { font-size: 0.85em; }
        .default-next-primary p:last-child { font-size: 2.5em; letter-spacing: -0.02em; }
        .default-next-countdown { margin-top: 0.3cqmin; }

        /* Active row pulse animation */
        @keyframes default-pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--dt-pulse-rgb), 0.7); }
          70% { box-shadow: 0 0 0 1cqmin rgba(var(--dt-pulse-rgb), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--dt-pulse-rgb), 0); }
        }
        .default-pulse {
          animation: default-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
