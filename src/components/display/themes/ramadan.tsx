import type { ThemeProps } from './index';
import { formatTime12h } from '@/types/prayer';
import { Clock } from '../clock';
import { Countdown } from '../countdown';
import { cn } from '@/lib/utils';

export function RamadanTheme({ mosqueName, prayers, nextPrayer }: ThemeProps) {
  const fajr = prayers.find((p) => p.name === 'fajr');
  const maghrib = prayers.find((p) => p.name === 'maghrib');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white p-8 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${((i * 37) % 100)}%`,
              left: `${((i * 53) % 100)}%`,
              animationDelay: `${(i % 20) / 10}s`,
              opacity: 0.3 + (i % 7) / 10,
            }}
          />
        ))}
      </div>

      <div className="absolute top-8 right-8 text-8xl opacity-20">&#9789;</div>

      <header className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h1 className="text-4xl font-bold text-amber-300">{mosqueName}</h1>
          <div className="text-purple-200 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <Clock className="text-5xl font-bold font-mono" />
      </header>

      <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
        <div className="bg-indigo-800/40 backdrop-blur rounded-2xl p-6 border border-indigo-500/30 text-center">
          <div className="text-indigo-300 text-sm uppercase tracking-wider mb-2">Suhoor Ends (Fajr)</div>
          <div className="text-4xl font-bold">{fajr ? formatTime12h(fajr.time) : '--:--'}</div>
          {nextPrayer?.name === 'fajr' && (
            <Countdown prayerTime={fajr?.time || '00:00'} prayerName="" className="mt-2 text-amber-300" />
          )}
        </div>
        <div className="bg-amber-700/30 backdrop-blur rounded-2xl p-6 border border-amber-500/30 text-center">
          <div className="text-amber-300 text-sm uppercase tracking-wider mb-2">Iftar (Maghrib)</div>
          <div className="text-4xl font-bold">{maghrib ? formatTime12h(maghrib.time) : '--:--'}</div>
          {nextPrayer?.name === 'maghrib' && (
            <Countdown prayerTime={maghrib?.time || '00:00'} prayerName="" className="mt-2 text-amber-300" />
          )}
        </div>
      </div>

      <main className="flex-1 grid grid-cols-6 gap-4 relative z-10">
        {prayers.map((prayer) => {
          const isNext = nextPrayer?.name === prayer.name;
          return (
            <div
              key={prayer.name}
              className={cn(
                'rounded-xl p-5 flex flex-col items-center justify-center transition-all',
                'bg-purple-950/50 backdrop-blur border border-purple-700/30',
                isNext && 'ring-2 ring-amber-400 bg-purple-800/50'
              )}
            >
              <div className="text-sm text-purple-300 mb-2">{prayer.displayName}</div>
              <div className="text-2xl font-bold mb-1">{formatTime12h(prayer.time)}</div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
