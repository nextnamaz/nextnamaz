'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { cn } from '@/lib/utils';
import { formatPrayerTime, formatDisplayDate } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';

// --- Hooks ---

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

type PrayerState = 'past' | 'current' | 'next' | 'upcoming';

function useCountdown(targetTime: string | undefined): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetTime) return;
    const update = () => {
      const now = new Date();
      const [h, m] = targetTime.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
      setCountdown({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return countdown;
}

function useHijriDate(): string {
  const [date, setDate] = useState('');
  useEffect(() => {
    try {
      setDate(
        new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
        }).format(new Date())
      );
    } catch {
      setDate('');
    }
  }, []);
  return date;
}

function usePrayerStates(
  prayers: ThemeProps['prayers'],
  nextPrayer: ThemeProps['nextPrayer']
): PrayerState[] {
  return useMemo(() => {
    const nextIdx = nextPrayer
      ? prayers.findIndex((p) => p.name === nextPrayer.name)
      : -1;
    return prayers.map((_, idx) => {
      if (nextIdx === -1)
        return idx === prayers.length - 1 ? 'current' : 'past';
      if (idx === nextIdx) return 'next';
      if (nextIdx === 0)
        return idx === prayers.length - 1 ? 'current' : 'upcoming';
      if (idx === nextIdx - 1) return 'current';
      if (idx < nextIdx) return 'past';
      return 'upcoming';
    });
  }, [prayers, nextPrayer]);
}

// --- Components ---

function FlipUnit({ value, portrait }: { value: string; portrait: boolean }) {
  return (
    <div className="relative bg-[#1e2636] rounded-xl overflow-hidden shadow-lg shadow-black/40 border border-white/5">
      <div className={cn(
        'py-1 text-[clamp(3rem,9cqmin,6.5rem)] font-bold leading-none tabular-nums tracking-tight',
        portrait ? 'px-4' : 'px-5'
      )}>
        {value}
      </div>
      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/40" />
    </div>
  );
}

const pad = (n: number) => n.toString().padStart(2, '0');

// --- Theme definition ---

export const andalusDefinition: ThemeDefinition = {
  id: 'andalus',
  name: 'Andalus',
  description: 'Elegant Al-Andalus inspired',
  preview: 'bg-linear-to-br from-[#1a2030] to-[#141820]',
  component: AndalusTheme,
  fields: [
    {
      key: 'verse1',
      label: 'Verse (top)',
      type: 'textarea',
      defaultValue: 'لَا يُكَلِّفُ اللّهُ نَفْسًا إِلَّا وُسْعَهَا',
      description: 'Quranic verse displayed above the prayer table',
    },
    {
      key: 'verse2',
      label: 'Verse (bottom)',
      type: 'textarea',
      defaultValue:
        'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
      description: 'Quranic verse displayed below the prayer table',
    },
  ],
  defaultConfig: {
    verse1: 'لَا يُكَلِّفُ اللّهُ نَفْسًا إِلَّا وُسْعَهَا',
    verse2:
      'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
  },
};

// --- Theme component ---

export function AndalusTheme({
  mosqueName,
  prayers,
  nextPrayer,
  config,
  isPortrait,
  locale,
}: ThemeProps) {
  const { timeStr, date } = useDisplayClock(locale);
  const countdown = useCountdown(nextPrayer?.time);
  const hijriDate = useHijriDate();
  const gregorianDate = formatDisplayDate(date, locale);
  const prayerStates = usePrayerStates(prayers, nextPrayer);
  const hasIqamah = prayers.some((p) => p.iqamahTime);

  // Extract HH:MM:SS from clock string for flip display
  const timeParts = timeStr.replace(/\s*(AM|PM)\s*/i, '').split(':');
  const hours = timeParts[0] ?? '--';
  const minutes = timeParts[1] ?? '--';
  const seconds = timeParts[2] ?? '';

  const verse1 =
    (config?.verse1 as string) ||
    'لَا يُكَلِّفُ اللّهُ نَفْسًا إِلَّا وُسْعَهَا';
  const verse2 =
    (config?.verse2 as string) ||
    'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا';

  const headerPrayer = locale.labels.prayer;
  const headerBegins = locale.labels.begins;
  const headerIqamah = locale.labels.iqamah;

  const L = !isPortrait;
  const P = isPortrait;

  return (
    <div className={cn('h-full bg-[#0f1419] text-white flex overflow-hidden relative', L ? 'flex-row' : 'flex-col')}>
      {/* Decorative dome glow */}
      <div
        className="absolute top-0 left-1/2 w-[160%] aspect-square rounded-[50%] pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(212,168,83,0.07) 0%, transparent 50%)',
          transform: 'translateX(-50%) translateY(-75%)',
        }}
      />

      {/* ── LEFT PANEL (landscape) / HEADER (portrait) ── */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center shrink-0',
          'bg-linear-to-b from-[#161c26]/80 to-transparent',
          L && 'w-[36%] h-full justify-between py-8 px-8 border-r border-amber-800/15',
          P && 'py-5 px-6 border-b border-amber-800/15'
        )}
      >
        {/* Dates */}
        <div className={cn('flex items-center gap-3', P ? 'text-xs' : 'text-sm')}>
          {hijriDate && (
            <span dir="rtl" className="text-amber-500/70">
              {hijriDate}
            </span>
          )}
          <span className="text-gray-700">&bull;</span>
          <span className="text-gray-500">{gregorianDate}</span>
        </div>

        {/* Flip clock */}
        <div className={cn('flex items-end gap-2', P ? 'my-4' : 'my-auto')}>
          <FlipUnit value={hours} portrait={P} />
          <span className="text-[clamp(2rem,7cqmin,4.5rem)] font-bold text-amber-500/40 pb-1 leading-none">
            :
          </span>
          <FlipUnit value={minutes} portrait={P} />
          {seconds && (
            <span className="text-[clamp(1rem,3cqmin,1.8rem)] font-bold text-gray-600 pb-2 ml-1 tabular-nums">
              {seconds}
            </span>
          )}
        </div>

        {/* Next prayer countdown */}
        {nextPrayer && (
          <div className={cn('text-center', P && 'mb-1')}>
            <div className="text-[0.6rem] uppercase tracking-[0.3em] text-gray-500 mb-1">
              {nextPrayer.displayName} in
            </div>
            <div className={cn('font-mono font-bold text-emerald-400 tabular-nums tracking-wide', L ? 'text-4xl' : 'text-3xl')}>
              {pad(countdown.hours)}:{pad(countdown.minutes)}
              <span className={cn('text-emerald-400/50', L ? 'text-2xl' : 'text-xl')}>
                :{pad(countdown.seconds)}
              </span>
            </div>
          </div>
        )}

        {/* Mosque name — landscape only, pinned to bottom */}
        {L && (
          <div className="text-gray-600 text-xs tracking-widest uppercase mt-4">
            {mosqueName}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (landscape) / MAIN (portrait) ── */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 min-w-0">
        {/* Verse 1 */}
        <div className={cn('shrink-0 text-center px-6', L ? 'py-4' : 'py-3')}>
          <p
            className={cn('text-amber-500/35 leading-relaxed truncate', L ? 'text-base' : 'text-sm')}
            dir="rtl"
          >
            {verse1}
          </p>
        </div>

        {/* Prayer table */}
        <div className={cn('flex-1 flex flex-col min-h-0', L ? 'px-8' : 'px-4')}>
          {/* Table header */}
          <div
            className={cn(
              'grid shrink-0 border-b border-amber-800/20 pb-2 mb-1',
              hasIqamah
                ? 'grid-cols-[1.2fr_1fr_1fr]'
                : 'grid-cols-[1.2fr_1fr]'
            )}
          >
            <div className="text-[0.6rem] uppercase tracking-[0.25em] text-gray-600 font-medium px-3">
              {headerPrayer}
            </div>
            <div className="text-[0.6rem] uppercase tracking-[0.25em] text-gray-600 font-medium text-center px-3">
              {headerBegins}
            </div>
            {hasIqamah && (
              <div className="text-[0.6rem] uppercase tracking-[0.25em] text-gray-600 font-medium text-center px-3">
                {headerIqamah}
              </div>
            )}
          </div>

          {/* Prayer rows — evenly distributed */}
          <div className="flex-1 flex flex-col justify-evenly">
            {prayers.map((prayer, idx) => {
              const state = prayerStates[idx];
              const isNext = state === 'next';
              const isCurrent = state === 'current';
              const isPast = state === 'past';
              const isSunrise = prayer.name === 'sunrise';
              const formattedTime = formatPrayerTime(prayer.time, locale);
              const formattedIqamah = prayer.iqamahTime
                ? formatPrayerTime(prayer.iqamahTime, locale)
                : undefined;

              return (
                <div
                  key={prayer.name}
                  className={cn(
                    'grid items-center rounded-lg px-3 py-2.5 transition-colors',
                    hasIqamah
                      ? 'grid-cols-[1.2fr_1fr_1fr]'
                      : 'grid-cols-[1.2fr_1fr]',
                    isNext && 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
                    isCurrent && 'bg-white/[0.02]'
                  )}
                >
                  {/* Name */}
                  <div className="flex items-center gap-2.5 px-1">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isNext &&
                          'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
                        isCurrent && 'bg-amber-400',
                        isPast && 'bg-gray-700',
                        state === 'upcoming' && 'bg-gray-700'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold tracking-wide',
                        L ? 'text-2xl' : 'text-lg',
                        isNext && 'text-emerald-400',
                        isCurrent && 'text-white',
                        isPast && 'text-gray-600',
                        state === 'upcoming' && 'text-gray-400',
                        isSunrise && 'italic text-amber-400/60'
                      )}
                    >
                      {prayer.displayName}
                    </span>
                  </div>

                  {/* Begins */}
                  <div
                    className={cn(
                      'text-center font-mono tabular-nums',
                      L ? 'text-2xl' : 'text-xl',
                      isNext && 'text-emerald-400 font-bold',
                      isCurrent && 'text-white font-semibold',
                      isPast && 'text-gray-600',
                      state === 'upcoming' && 'text-gray-400'
                    )}
                  >
                    {formattedTime}
                  </div>

                  {/* Iqamah */}
                  {hasIqamah && (
                    <div
                      className={cn(
                        'text-center font-mono tabular-nums',
                        L ? 'text-2xl' : 'text-xl',
                        isNext && 'text-emerald-400 font-bold',
                        isCurrent && 'text-white font-semibold',
                        isPast && 'text-gray-600',
                        state === 'upcoming' && 'text-gray-400'
                      )}
                    >
                      {formattedIqamah && !isSunrise
                        ? formattedIqamah
                        : '—'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Verse 2 + mosque name (portrait) */}
        <div className={cn('shrink-0 text-center px-6', L ? 'py-4' : 'py-3')}>
          <p className="text-sm text-amber-500/35 truncate" dir="rtl">
            {verse2}
          </p>
          {P && (
            <div className="text-gray-600 text-xs tracking-widest uppercase mt-2">
              {mosqueName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
