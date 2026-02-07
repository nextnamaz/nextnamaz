'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { PrayerSourceType, VaktijaBaSourceConfig } from '@/types/prayer-config';
import type { PrayerTimesMap } from '@/types/database';
import { VAKTIJA_LOCATIONS } from '@/lib/prayer-sources/vaktija-ba';

interface PrayerSourceSelectorProps {
  source: PrayerSourceType;
  sourceConfig: VaktijaBaSourceConfig | Record<string, never>;
  onSourceChange: (source: PrayerSourceType) => void;
  onSourceConfigChange: (config: VaktijaBaSourceConfig) => void;
  onTimesFetched: (times: PrayerTimesMap) => void;
}

export function PrayerSourceSelector({
  source,
  sourceConfig,
  onSourceChange,
  onSourceConfigChange,
  onTimesFetched,
}: PrayerSourceSelectorProps) {
  const [fetching, setFetching] = useState(false);

  const locationId = 'locationId' in sourceConfig ? sourceConfig.locationId : 77;

  const handleFetch = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/prayer-times/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, config: sourceConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTimesFetched(data.times);
    } catch {
      // Error handled by parent via toast
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Prayer Time Source</Label>
        <Select value={source} onValueChange={(v) => onSourceChange(v as PrayerSourceType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual Entry</SelectItem>
            <SelectItem value="vaktija_ba">Vaktija.ba</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {source === 'vaktija_ba' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={String(locationId)}
              onValueChange={(v) => {
                const loc = VAKTIJA_LOCATIONS.find((l) => l.id === Number(v));
                if (loc) {
                  onSourceConfigChange({ locationId: loc.id, locationName: loc.name });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAKTIJA_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleFetch} disabled={fetching} variant="outline" size="sm">
            {fetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {fetching ? 'Fetching...' : 'Fetch Times'}
          </Button>
        </div>
      )}
    </div>
  );
}
