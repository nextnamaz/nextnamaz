import type { ThemeProps, ThemeDefinition } from './index';
import { formatTime12h } from '@/types/prayer';
import { Clock } from '../clock';
import { Countdown } from '../countdown';
import { cn } from '@/lib/utils';

export const classicDefinition: ThemeDefinition = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional green & gold',
  preview: 'bg-linear-to-br from-emerald-800 to-emerald-950',
  component: ClassicTheme,
  fields: [],
  defaultConfig: {},
};

export function ClassicTheme({ mosqueName, prayers, nextPrayer }: ThemeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white p-8 flex flex-col">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-4xl font-bold text-amber-400">{mosqueName}</h1>
          <div className="text-emerald-200 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="text-right">
          <Clock className="text-5xl font-bold font-mono" />
          {nextPrayer && (
            <Countdown
              prayerTime={nextPrayer.time}
              prayerName={nextPrayer.displayName}
              className="mt-2 text-amber-300"
            />
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-6 gap-4 relative z-10">
        {prayers.map((prayer) => {
          const isNext = nextPrayer?.name === prayer.name;
          return (
            <div
              key={prayer.name}
              className={cn(
                'rounded-xl p-6 flex flex-col items-center justify-center transition-all',
                'bg-emerald-950/50 backdrop-blur border border-emerald-700/30',
                isNext && 'ring-2 ring-amber-400 bg-emerald-800/50'
              )}
            >
              <div className="text-lg text-emerald-300 mb-2">{prayer.displayName}</div>
              <div className="text-3xl font-bold mb-2">{formatTime12h(prayer.time)}</div>
              {prayer.iqamahTime && (
                <div className="text-sm opacity-70">Iqamah: {formatTime12h(prayer.iqamahTime)}</div>
              )}
              {isNext && (
                <div className="mt-2 px-3 py-1 bg-amber-400 text-emerald-900 rounded-full text-xs font-bold">
                  NEXT
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
