import type { ThemeProps } from './index';
import { formatTime12h } from '@/types/prayer';
import { Clock } from '../clock';
import { Countdown } from '../countdown';
import { cn } from '@/lib/utils';

export function ModernTheme({ mosqueName, prayers, nextPrayer }: ThemeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 flex flex-col">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-light tracking-wide">{mosqueName}</h1>
          <div className="text-slate-400 mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <Clock className="text-6xl font-extralight font-mono tracking-wider" />
      </header>

      {nextPrayer && (
        <div className="mb-12 text-center">
          <div className="inline-block bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="text-slate-400 text-sm uppercase tracking-widest mb-2">Next Prayer</div>
            <div className="text-4xl font-light mb-2">{nextPrayer.displayName}</div>
            <Countdown prayerTime={nextPrayer.time} prayerName="" className="text-cyan-400" />
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-6 gap-6 w-full max-w-7xl">
          {prayers.map((prayer) => {
            const isNext = nextPrayer?.name === prayer.name;
            return (
              <div
                key={prayer.name}
                className={cn(
                  'rounded-2xl p-8 flex flex-col items-center justify-center transition-all',
                  'bg-slate-800/30 border border-slate-700/50',
                  isNext && 'bg-cyan-900/30 border-cyan-500/50'
                )}
              >
                <div className={cn('text-sm uppercase tracking-widest mb-4', isNext ? 'text-cyan-400' : 'text-slate-500')}>
                  {prayer.displayName}
                </div>
                <div className={cn('text-4xl font-light', isNext && 'text-cyan-300')}>
                  {formatTime12h(prayer.time)}
                </div>
                {prayer.iqamahTime && (
                  <div className="text-sm opacity-70 mt-2">Iqamah: {formatTime12h(prayer.iqamahTime)}</div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
