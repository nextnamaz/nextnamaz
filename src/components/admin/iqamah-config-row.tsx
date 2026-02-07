'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IqamahConfig, IqamahType } from '@/types/prayer-config';
import type { PrayerName } from '@/types/prayer';
import { PRAYER_DISPLAY_NAMES, computeIqamahTime } from '@/types/prayer';

interface IqamahConfigRowProps {
  prayer: PrayerName;
  adhanTime: string;
  config?: IqamahConfig;
  onChange: (config: IqamahConfig | undefined) => void;
}

export function IqamahConfigRow({ prayer, adhanTime, config, onChange }: IqamahConfigRowProps) {
  const mode: 'none' | IqamahType = config?.type ?? 'none';
  const computed = config ? computeIqamahTime(adhanTime, config) : null;

  return (
    <div className="flex items-center gap-4">
      <Label className="w-24 shrink-0">{PRAYER_DISPLAY_NAMES[prayer]}</Label>

      <select
        value={mode}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'none') {
            onChange(undefined);
          } else if (v === 'fixed') {
            onChange({ type: 'fixed', value: adhanTime });
          } else {
            onChange({ type: 'offset', value: 15 });
          }
        }}
        className="border rounded-md px-2 py-1.5 text-sm w-36"
      >
        <option value="none">None</option>
        <option value="fixed">Fixed Time</option>
        <option value="offset">Minutes After</option>
      </select>

      {mode === 'fixed' && (
        <Input
          type="time"
          value={config?.value as string}
          onChange={(e) => onChange({ type: 'fixed', value: e.target.value })}
          className="w-36"
        />
      )}

      {mode === 'offset' && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={120}
            value={config?.value as number}
            onChange={(e) => onChange({ type: 'offset', value: Number(e.target.value) || 15 })}
            className="w-20"
          />
          <span className="text-sm text-gray-500">min</span>
        </div>
      )}

      {computed && (
        <span className="text-sm text-gray-500 ml-auto">
          Iqamah: {computed}
        </span>
      )}
    </div>
  );
}
