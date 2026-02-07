'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

      <Select
        value={mode}
        onValueChange={(v) => {
          if (v === 'none') {
            onChange(undefined);
          } else if (v === 'fixed') {
            onChange({ type: 'fixed', value: adhanTime });
          } else {
            onChange({ type: 'offset', value: 15 });
          }
        }}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="fixed">Fixed Time</SelectItem>
          <SelectItem value="offset">Minutes After</SelectItem>
        </SelectContent>
      </Select>

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
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      )}

      {computed && (
        <span className="text-sm text-muted-foreground ml-auto font-mono">
          {computed}
        </span>
      )}
    </div>
  );
}
