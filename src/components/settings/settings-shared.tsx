'use client';

import { asDisplayConfig, asPrayerTimes, asRecord, asStringRecord } from '@/types/database';
import type { DisplayConfig, Rotation, Screen, PrayerTimesMap } from '@/types/database';

export type { DisplayConfig, Rotation };
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import { parseDisplayText } from '@/lib/locale/helpers';
import type { SupportedLocale, DisplayTextConfig } from '@/types/locale';
import type { PrayerSourceInput } from '@/lib/actions';
import { THEME_REGISTRY } from '@/components/display/themes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ThemeConfigMap = Record<string, string | number | boolean>;

export interface FormState {
  times: PrayerTimesMap;
  prayerSource: PrayerSourceInput;
  sourceConfig: Record<string, unknown>;
  locale: SupportedLocale;
  displayText: DisplayTextConfig;
  theme: string;
  themeConfig: ThemeConfigMap;
  displayConfig: DisplayConfig;
}

const SOURCE_VALUES: PrayerSourceInput[] = ['manual', 'adhan', 'aladhan', 'vaktija_ba', 'vaktija_eu', 'islamiska_forbundet'];

export function formFromScreen(screen: Screen): FormState {
  return {
    times: asPrayerTimes(screen.prayer_times),
    prayerSource: SOURCE_VALUES.includes(screen.prayer_source as PrayerSourceInput)
      ? (screen.prayer_source as PrayerSourceInput)
      : 'manual',
    sourceConfig: asRecord(screen.prayer_source_config),
    locale: (screen.locale || 'en') as SupportedLocale,
    displayText: parseDisplayText(asStringRecord(screen.display_text), screen.locale),
    theme: screen.theme in THEME_REGISTRY ? screen.theme : 'default',
    themeConfig: asRecord(screen.theme_config) as ThemeConfigMap,
    displayConfig: asDisplayConfig(screen.display_config),
  };
}

/** One-line answer to "what does this source mean for me?" */
export function sourceExplanation(source: PrayerSourceInput): string {
  return source === 'manual'
    ? 'You enter the times yourself and can change them here whenever you need.'
    : 'Fresh times arrive automatically every day. Nothing to maintain.';
}

interface ManualTimesFieldsProps {
  times: PrayerTimesMap;
  labels: Record<PrayerName, string>;
  onChange: (prayer: PrayerName, value: string) => void;
}

export function ManualTimesFields({ times, labels, onChange }: ManualTimesFieldsProps) {
  return (
    <div className="space-y-3">
      {PRAYER_NAMES.map((prayer) => (
        <div key={prayer} className="flex items-center justify-between gap-4">
          <Label htmlFor={`time-${prayer}`} className="text-base">
            {labels[prayer]}
          </Label>
          <Input
            id={`time-${prayer}`}
            type="time"
            className="w-40 text-base"
            value={times[prayer]}
            onChange={(e) => onChange(prayer, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
