'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { Countdown } from '../countdown';
import { cn } from '@/lib/utils';

type PrayerState = 'past' | 'current' | 'next' | 'upcoming';

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

export const defaultDefinition: ThemeDefinition = {
  id: 'default',
  name: 'Default',
  description: 'Clean table layout with next prayer panel',
  preview: 'bg-[#374151]',
  component: DefaultTheme,
  fields: [
    {
      key: 'displayText',
      label: 'Footer Text',
      type: 'text',
      defaultValue: 'بسم الله الرحمن الرحيم',
      description: 'Text shown at the bottom of the display',
    },
  ],
  defaultConfig: {
    displayText: 'بسم الله الرحمن الرحيم',
  },
};

export function DefaultTheme({ prayers, nextPrayer, config }: ThemeProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });
  const dateStr = time.toLocaleDateString('en-GB');
  const prayerStates = usePrayerStates(prayers, nextPrayer);

  const displayText =
    typeof config?.displayText === 'string'
      ? config.displayText
      : 'بسم الله الرحمن الرحيم';

  return (
    <div className="min-h-screen h-screen bg-[#374151] text-white flex flex-col overflow-hidden">
      {/* Clock */}
      <header className="text-center shrink-0 py-2 portrait:py-4">
        <div className="font-bold font-mono tracking-wider text-5xl portrait:text-8xl">
          {timeStr}
        </div>
        <div className="text-amber-400 text-sm portrait:text-xl mt-0.5">
          {dateStr}
        </div>
      </header>

      {/* Main: Table + Next Prayer */}
      <main className="flex-1 flex flex-col landscape:flex-row min-h-0 px-3 portrait:px-5 gap-1">
        {/* Prayer Times Table */}
        <div className="landscape:flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-500">
                <th className="text-left py-1.5 px-2 text-[10px] portrait:text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Prayer
                </th>
                <th
                  className="text-center py-1.5 px-2 text-[10px] portrait:text-xs font-semibold text-gray-400 uppercase tracking-widest"
                  colSpan={2}
                >
                  Begins
                </th>
              </tr>
            </thead>
            <tbody>
              {prayers.map((prayer, idx) => {
                const state = prayerStates[idx];
                const isSunrise = prayer.name === 'sunrise';

                return (
                  <tr
                    key={prayer.name}
                    className={cn(
                      'border-b border-gray-600/30',
                      state === 'current' && 'bg-amber-700/30'
                    )}
                  >
                    <td className="py-1.5 portrait:py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        {(state === 'past' || state === 'current') && (
                          <span className="w-2 h-2 portrait:w-2.5 portrait:h-2.5 rounded-full bg-green-500 shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-sm portrait:text-xl',
                            (state === 'current' || state === 'next') && 'font-bold',
                            state === 'past' && 'text-gray-300'
                          )}
                        >
                          {prayer.displayName}
                        </span>
                        {isSunrise && (
                          <span className="text-xs portrait:text-sm">☀️</span>
                        )}
                        {state === 'next' && (
                          <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white text-[9px] portrait:text-xs font-bold rounded">
                            Next
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={cn(
                        'py-1.5 portrait:py-3 px-1 text-center font-mono text-sm portrait:text-xl',
                        (state === 'current' || state === 'next') && 'font-bold',
                        state === 'past' && 'text-gray-400'
                      )}
                    >
                      {prayer.time}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 portrait:py-3 px-1 text-center font-mono text-sm portrait:text-xl',
                        (state === 'current' || state === 'next') && 'font-bold',
                        state === 'past' && 'text-gray-400'
                      )}
                    >
                      {prayer.iqamahTime ?? ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Next Prayer Panel */}
        {nextPrayer && (
          <div className="landscape:w-[40%] flex items-center justify-center portrait:flex-1">
            <div className="text-center">
              <div className="text-base portrait:text-xl text-gray-300">
                Next...
              </div>
              <div className="text-3xl portrait:text-4xl font-bold uppercase mt-1">
                {nextPrayer.displayName}
              </div>
              <div className="text-6xl portrait:text-8xl font-bold text-green-400 font-mono mt-2 leading-none">
                {nextPrayer.time}
              </div>
              <Countdown
                prayerTime={nextPrayer.time}
                prayerName=""
                className="text-gray-300 mt-2"
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-2 text-center">
        <div className="text-amber-400 text-sm portrait:text-base" dir="rtl">
          {displayText}
        </div>
      </footer>
    </div>
  );
}
