'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useMosqueSettings } from '@/hooks/use-mosque-settings';
import type { PrayerTimesMap, Json } from '@/types/database';
import type { PrayerName } from '@/types/prayer';
import { PRAYER_NAMES, PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import { prayerTimesSchema } from '@/lib/validations';
import type { PrayerSourceType, VaktijaBaSourceConfig, PrayerConfigMap, IqamahConfig } from '@/types/prayer-config';
import { PrayerSourceSelector } from '@/components/admin/prayer-source-selector';
import { IqamahConfigRow } from '@/components/admin/iqamah-config-row';

const IQAMAH_PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerTimesPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const { settings, loading, saving, saveSettings } = useMosqueSettings(mosqueId);

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap>({
    fajr: '05:00', sunrise: '06:30', dhuhr: '13:00',
    asr: '16:30', maghrib: '19:00', isha: '20:30',
  });
  const [prayerSource, setPrayerSource] = useState<PrayerSourceType>('manual');
  const [sourceConfig, setSourceConfig] = useState<VaktijaBaSourceConfig | Record<string, never>>({});
  const [prayerConfig, setPrayerConfig] = useState<PrayerConfigMap>({});

  useEffect(() => {
    if (!settings) return;
    setPrayerTimes(settings.prayer_times);
    setPrayerSource(settings.prayer_source);
    setSourceConfig(settings.prayer_source_config as VaktijaBaSourceConfig | Record<string, never>);
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
    if (prayerSource === 'manual') {
      const validation = prayerTimesSchema.safeParse(prayerTimes);
      if (!validation.success) {
        toast.error(validation.error.issues[0].message);
        return;
      }
    }
    await saveSettings({
      prayer_times: prayerTimes as unknown as Json,
      prayer_source: prayerSource,
      prayer_source_config: sourceConfig as unknown as Json,
      prayer_config: prayerConfig as unknown as Json,
    });
  };

  const isExternal = prayerSource !== 'manual';

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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Prayer Times</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage adhan times and iqamah settings</p>
      </div>

      <Tabs defaultValue="adhan">
        <TabsList>
          <TabsTrigger value="adhan">Adhan</TabsTrigger>
          <TabsTrigger value="iqamah">Iqamah</TabsTrigger>
        </TabsList>

        <TabsContent value="adhan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
              <CardDescription>Choose how prayer times are set</CardDescription>
            </CardHeader>
            <CardContent>
              <PrayerSourceSelector
                source={prayerSource}
                sourceConfig={sourceConfig}
                onSourceChange={setPrayerSource}
                onSourceConfigChange={setSourceConfig}
                onTimesFetched={(times) => {
                  setPrayerTimes(times);
                  toast.success('Times fetched — save to apply');
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adhan Times</CardTitle>
              <CardDescription>
                {isExternal ? 'Times from external source (fetch to update)' : 'Set the prayer times for your mosque'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {PRAYER_NAMES.map((prayer) => (
                  <div key={prayer} className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3">
                    <Label className="w-24 text-sm font-medium">{PRAYER_DISPLAY_NAMES[prayer]}</Label>
                    <Input
                      type="time"
                      value={prayerTimes[prayer]}
                      onChange={(e) =>
                        setPrayerTimes({ ...prayerTimes, [prayer]: e.target.value })
                      }
                      className="w-40"
                      disabled={isExternal}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iqamah" className="space-y-6">
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
        </TabsContent>
      </Tabs>

      {/* Sticky save */}
      <div className="sticky bottom-4">
        <div className="flex justify-end rounded-lg bg-background/80 backdrop-blur-sm border border-border p-3 shadow-lg">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
