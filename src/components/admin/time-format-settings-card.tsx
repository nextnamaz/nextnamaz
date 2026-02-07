'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { COMMON_TIMEZONES } from '@/lib/locale/presets';

interface TimeFormatSettingsCardProps {
  use24Hour: boolean;
  showSeconds: boolean;
  timezone: string;
  onUse24HourChange: (value: boolean) => void;
  onShowSecondsChange: (value: boolean) => void;
  onTimezoneChange: (value: string) => void;
}

export function TimeFormatSettingsCard({
  use24Hour,
  showSeconds,
  timezone,
  onUse24HourChange,
  onShowSecondsChange,
  onTimezoneChange,
}: TimeFormatSettingsCardProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour,
      };
      if (showSeconds) {
        options.second = '2-digit';
      }
      if (timezone !== 'auto') {
        options.timeZone = timezone;
      }
      setTime(new Date().toLocaleTimeString(use24Hour ? 'en-GB' : 'en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [use24Hour, showSeconds, timezone]);

  const resolvedTz = timezone === 'auto'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timezone;

  const tzLabel = COMMON_TIMEZONES.find((t) => t.value === timezone)?.label
    ?? (timezone === 'auto' ? 'Auto-detect' : timezone);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Format</CardTitle>
        <CardDescription>Choose how times are displayed on the prayer screen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live preview */}
        <div className="rounded-lg border bg-muted/50 p-6 text-center">
          <div className="text-3xl font-mono font-semibold tracking-wider">{time}</div>
          <div className="text-xs text-muted-foreground mt-1">{resolvedTz}</div>
        </div>

        {/* Toggles */}
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="use24h" className="text-sm">Use 24-hour format</Label>
            <Switch
              id="use24h"
              checked={use24Hour}
              onCheckedChange={onUse24HourChange}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="showSeconds" className="text-sm">Show seconds</Label>
            <Switch
              id="showSeconds"
              checked={showSeconds}
              onCheckedChange={onShowSecondsChange}
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Timezone</Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="w-full">
              <SelectValue>{tzLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select &quot;Auto-detect&quot; to use the device&apos;s timezone
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
