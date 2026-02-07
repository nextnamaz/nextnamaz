'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value as PrayerSourceType)}
          className="border rounded-md px-3 py-2 text-sm w-full"
        >
          <option value="manual">Manual Entry</option>
          <option value="vaktija_ba">Vaktija.ba</option>
        </select>
      </div>

      {source === 'vaktija_ba' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Location</Label>
            <select
              value={locationId}
              onChange={(e) => {
                const loc = VAKTIJA_LOCATIONS.find((l) => l.id === Number(e.target.value));
                if (loc) {
                  onSourceConfigChange({ locationId: loc.id, locationName: loc.name });
                }
              }}
              className="border rounded-md px-3 py-2 text-sm w-full"
            >
              {VAKTIJA_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
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
