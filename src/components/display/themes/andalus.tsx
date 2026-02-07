'use client';

import { useState, useEffect } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { cn } from '@/lib/utils';

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
}

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
}

function useCurrentTime(): TimeState {
  const [time, setTime] = useState<TimeState>({ hours: '--', minutes: '--', seconds: '--' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        hours: now.getHours().toString().padStart(2, '0'),
        minutes: now.getMinutes().toString().padStart(2, '0'),
        seconds: now.getSeconds().toString().padStart(2, '0'),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

function useCountdown(targetTime: string | undefined): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>({ hours: 0, minutes: 0, seconds: 0 });

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

function useGregorianDate(): string {
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    );
  }, []);
  return date;
}

function FlipUnit({ value }: { value: string }) {
  return (
    <div className="relative bg-[#252d3a] rounded-xl overflow-hidden shadow-lg">
      <div className="px-5 py-1 text-[clamp(4rem,12vw,8rem)] font-bold leading-none tabular-nums tracking-tight">
        {value}
      </div>
      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/30" />
    </div>
  );
}

function getIqamahOffset(prayerTime: string, iqamahTime: string): number {
  const [ph, pm] = prayerTime.split(':').map(Number);
  const [ih, im] = iqamahTime.split(':').map(Number);
  return ih * 60 + im - (ph * 60 + pm);
}

const pad = (n: number) => n.toString().padStart(2, '0');

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
      defaultValue: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
      description: 'Quranic verse displayed below the prayer table',
    },
  ],
  defaultConfig: {
    verse1: 'لَا يُكَلِّفُ اللّهُ نَفْسًا إِلَّا وُسْعَهَا',
    verse2: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا',
  },
};

export function AndalusTheme({ mosqueName, prayers, nextPrayer, config }: ThemeProps) {
  const time = useCurrentTime();
  const countdown = useCountdown(nextPrayer?.time);
  const hijriDate = useHijriDate();
  const gregorianDate = useGregorianDate();

  const verse1 =
    (config?.verse1 as string) || 'لَا يُكَلِّفُ اللّهُ نَفْسًا إِلَّا وُسْعَهَا';
  const verse2 =
    (config?.verse2 as string) ||
    'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا';

  return (
    <div className="min-h-screen bg-[#141820] text-white flex flex-col items-center relative overflow-hidden">
      {/* Decorative dome arch */}
      <div
        className="absolute top-0 left-1/2 w-[140%] aspect-square rounded-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(40,50,65,0.5) 0%, transparent 60%)',
          transform: 'translateX(-50%) translateY(-70%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center flex-1 px-6 py-8">
        {/* Date row */}
        <div className="flex items-center gap-6 text-gray-400 text-lg mb-6">
          {hijriDate && <span dir="rtl">{hijriDate}</span>}
          <span>{gregorianDate}</span>
        </div>

        {/* Flip clock */}
        <div className="flex items-end gap-2 mb-6">
          <FlipUnit value={time.hours} />
          <span className="text-[clamp(3rem,9vw,6rem)] font-bold leading-none pb-1 text-gray-300">
            :
          </span>
          <FlipUnit value={time.minutes} />
          <span className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-gray-400 pb-3 ml-1 tabular-nums">
            {time.seconds}
          </span>
        </div>

        {/* Quranic verse 1 */}
        <p className="text-center text-xl text-gray-300 leading-relaxed mb-8 px-4" dir="rtl">
          {verse1}
        </p>

        {/* Prayer times table */}
        <div className="w-full mb-8">
          {prayers.map((prayer) => {
            const isNext = nextPrayer?.name === prayer.name;
            const isSunrise = prayer.name === 'sunrise';
            const offset = prayer.iqamahTime
              ? getIqamahOffset(prayer.time, prayer.iqamahTime)
              : null;

            return (
              <div key={prayer.name}>
                <div
                  className={cn(
                    'grid grid-cols-3 items-center py-4 px-2',
                    isNext ? 'text-emerald-400' : 'text-white'
                  )}
                >
                  <div className="text-2xl font-semibold tracking-wide">
                    {isSunrise ? '🌅' : prayer.displayName.toUpperCase()}
                  </div>
                  <div className="text-2xl font-semibold text-center tabular-nums">
                    {prayer.time}
                  </div>
                  <div className="text-2xl font-semibold text-right tabular-nums">
                    {offset !== null && !isSunrise ? `+${pad(offset)}` : ''}
                  </div>
                </div>
                <div className="border-b border-gray-700/50" />
              </div>
            );
          })}
        </div>

        {/* Quranic verse 2 */}
        <p className="text-center text-xl text-gray-300 leading-relaxed mb-6 px-4" dir="rtl">
          {verse2}
        </p>

        {/* Countdown */}
        {nextPrayer && (
          <div className="text-center mb-4">
            <div className="font-mono text-[clamp(3rem,10vw,6rem)] font-bold text-emerald-400 tabular-nums tracking-wider">
              {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
            </div>
            <div className="text-gray-400 font-bold tracking-widest text-lg mt-2">
              {nextPrayer.displayName.toUpperCase()} NEXT
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center gap-2 text-gray-500 text-sm pb-4">
          <span>📍</span>
          <span>{mosqueName}</span>
        </div>
      </div>
    </div>
  );
}
