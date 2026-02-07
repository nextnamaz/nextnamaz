import type { ThemeProps } from './index';
import { formatTime12h } from '@/types/prayer';
import { Clock } from '../clock';
import { Countdown } from '../countdown';
import { cn } from '@/lib/utils';

export function LightTheme({ mosqueName, prayers, nextPrayer }: ThemeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900 p-8 flex flex-col">
      <header className="flex items-center justify-between mb-8 pb-6 border-b-2 border-emerald-500">
        <div>
          <h1 className="text-4xl font-bold text-emerald-700">{mosqueName}</h1>
          <div className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="text-right">
          <Clock className="text-5xl font-bold font-mono text-gray-800" />
          {nextPrayer && (
            <Countdown
              prayerTime={nextPrayer.time}
              prayerName={nextPrayer.displayName}
              className="mt-2 text-emerald-600"
            />
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-6 gap-4">
        {prayers.map((prayer) => {
          const isNext = nextPrayer?.name === prayer.name;
          return (
            <div
              key={prayer.name}
              className={cn(
                'rounded-xl p-6 flex flex-col items-center justify-center transition-all',
                'bg-white border-2 shadow-sm',
                isNext ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-200'
              )}
            >
              <div className={cn('text-lg font-medium mb-2', isNext ? 'text-emerald-700' : 'text-gray-600')}>
                {prayer.displayName}
              </div>
              <div className={cn('text-4xl font-bold mb-2', isNext ? 'text-emerald-700' : 'text-gray-900')}>
                {formatTime12h(prayer.time)}
              </div>
              {isNext && (
                <div className="mt-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">NEXT</div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
