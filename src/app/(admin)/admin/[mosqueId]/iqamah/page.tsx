'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMosqueSettings } from '@/hooks/use-mosque-settings';
import type { Json } from '@/types/database';
import type { PrayerName } from '@/types/prayer';
import type { PrayerConfigMap, IqamahConfig } from '@/types/prayer-config';
import { IqamahConfigRow } from '@/components/admin/iqamah-config-row';

const IQAMAH_PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function IqamahPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const { settings, loading, saving, saveSettings } = useMosqueSettings(mosqueId);

  const [prayerConfig, setPrayerConfig] = useState<PrayerConfigMap>({});

  useEffect(() => {
    if (!settings) return;
    setPrayerConfig(settings.prayer_config);
  }, [settings]);

  const handleIqamahChange = (prayer: PrayerName, config: IqamahConfig | undefined) => {
    setPrayerConfig((prev) => {
      const next = { ...prev };
      if (config) {
        next[prayer] = { ...next[prayer], iqamah: config };
      } else {
        if (next[prayer]) {
          const { iqamah: _, ...rest } = next[prayer]!;
          if (Object.keys(rest).length === 0) {
            delete next[prayer];
          } else {
            next[prayer] = rest;
          }
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    await saveSettings({
      prayer_config: prayerConfig as unknown as Json,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) return <div className="text-muted-foreground">Settings not found</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Iqamah</h1>
        <p className="text-muted-foreground mt-1">Configure iqamah delay or fixed time for each prayer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Iqamah Times</CardTitle>
          <CardDescription>Set a fixed iqamah time or minutes after adhan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {IQAMAH_PRAYERS.map((prayer) => (
            <div key={prayer} className="rounded-lg bg-muted/40 px-4 py-3">
              <IqamahConfigRow
                prayer={prayer}
                adhanTime={settings.prayer_times[prayer]}
                config={prayerConfig[prayer]?.iqamah}
                onChange={(cfg) => handleIqamahChange(prayer, cfg)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sticky save */}
      <div className="sticky bottom-4">
        <div className="flex justify-end rounded-lg bg-background/80 backdrop-blur-sm border border-border p-3 shadow-lg">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Iqamah Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
