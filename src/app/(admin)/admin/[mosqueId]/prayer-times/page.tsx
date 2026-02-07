'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useMosqueSettings } from '@/hooks/use-mosque-settings';
import type { PrayerTimesMap, Json } from '@/types/database';
import type { PrayerName } from '@/types/prayer';
import { PRAYER_DISPLAY_NAMES, computeIqamahTime } from '@/types/prayer';
import { prayerTimesSchema } from '@/lib/validations';
import type { PrayerSourceType, PrayerSourceConfig, PrayerConfigMap, IqamahConfig, IqamahType } from '@/types/prayer-config';
import { PrayerSourceSelector } from '@/components/admin/prayer-source-selector';

const CONFIG_PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerTimesPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const { settings, loading, saving, saveSettings } = useMosqueSettings(mosqueId);

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap>({
    fajr: '05:00', sunrise: '06:30', dhuhr: '13:00',
    asr: '16:30', maghrib: '19:00', isha: '20:30',
  });
  const [prayerSource, setPrayerSource] = useState<PrayerSourceType>('manual');
  const [sourceConfig, setSourceConfig] = useState<PrayerSourceConfig>({});
  const [prayerConfig, setPrayerConfig] = useState<PrayerConfigMap>({});
  const savedSnapshot = useRef('');

  useEffect(() => {
    if (!settings) return;
    const times = settings.prayer_times;
    const source = settings.prayer_source;
    const srcConfig = settings.prayer_source_config as PrayerSourceConfig;
    const config = settings.prayer_config;

    setPrayerTimes(times);
    setPrayerSource(source);
    setSourceConfig(srcConfig);
    setPrayerConfig(config);

    // Build snapshot from the same values that go into React state
    savedSnapshot.current = JSON.stringify({
      prayer_times: times,
      prayer_source: source,
      prayer_source_config: srcConfig,
      prayer_config: config,
    });
  }, [settings]);

  const changeCount = (() => {
    if (!savedSnapshot.current) return 0;
    const s = JSON.parse(savedSnapshot.current) as Record<string, unknown>;
    const savedTimes = s.prayer_times as Record<string, string>;
    const savedConfig = s.prayer_config as Record<string, unknown>;
    let count = 0;
    // Count each changed prayer time individually
    for (const key of Object.keys(prayerTimes)) {
      if (prayerTimes[key as keyof PrayerTimesMap] !== savedTimes[key]) count++;
    }
    if (prayerSource !== s.prayer_source) count++;
    if (JSON.stringify(sourceConfig) !== JSON.stringify(s.prayer_source_config)) count++;
    // Count each changed prayer config individually
    for (const key of CONFIG_PRAYERS) {
      if (JSON.stringify(prayerConfig[key]) !== JSON.stringify(savedConfig?.[key])) count++;
    }
    return count;
  })();
  const dirty = changeCount > 0;

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prayer Times</h1>
        <p className="text-muted-foreground mt-1">Configure sources and per-prayer settings</p>
      </div>

      <Tabs defaultValue="source">
        <TabsList className="mb-6">
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="mt-0">
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
        </TabsContent>

        <TabsContent value="config" className="mt-0">
          <Tabs defaultValue="fajr">
            <TabsList className="w-full">
              {CONFIG_PRAYERS.map((p) => (
                <TabsTrigger key={p} value={p} className="flex-1">
                  {PRAYER_DISPLAY_NAMES[p]}
                </TabsTrigger>
              ))}
            </TabsList>

            {CONFIG_PRAYERS.map((prayer) => {
              const iqamah = prayerConfig[prayer]?.iqamah;
              const mode: 'none' | IqamahType = iqamah?.type ?? 'none';
              const computed = iqamah ? computeIqamahTime(prayerTimes[prayer], iqamah) : null;

              return (
                <TabsContent key={prayer} value={prayer}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{PRAYER_DISPLAY_NAMES[prayer]} Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Adhan time */}
                      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Adhan</p>
                          <p className="text-2xl font-semibold font-mono mt-0.5">{prayerTimes[prayer]}</p>
                        </div>
                        {computed && (
                          <div className="text-right">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Iqamah</p>
                            <p className="text-2xl font-semibold font-mono mt-0.5">{computed}</p>
                          </div>
                        )}
                      </div>

                      {/* Manual time override */}
                      {!isExternal && (
                        <div className="space-y-2">
                          <Label className="text-sm">Adhan Time</Label>
                          <Input
                            type="time"
                            value={prayerTimes[prayer]}
                            onChange={(e) =>
                              setPrayerTimes({ ...prayerTimes, [prayer]: e.target.value })
                            }
                            className="w-40"
                          />
                        </div>
                      )}

                      <Separator />

                      {/* Iqamah config */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Iqamah Configuration</Label>
                        <Select
                          value={mode}
                          onValueChange={(v) => {
                            if (v === 'none') {
                              handleIqamahChange(prayer, undefined);
                            } else if (v === 'fixed') {
                              handleIqamahChange(prayer, { type: 'fixed', value: prayerTimes[prayer] });
                            } else {
                              handleIqamahChange(prayer, { type: 'offset', value: 15 });
                            }
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Iqamah</SelectItem>
                            <SelectItem value="fixed">Fixed Time</SelectItem>
                            <SelectItem value="offset">Minutes After Adhan</SelectItem>
                          </SelectContent>
                        </Select>

                        {mode === 'fixed' && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Fixed iqamah time</Label>
                            <Input
                              type="time"
                              value={iqamah?.value as string}
                              onChange={(e) => handleIqamahChange(prayer, { type: 'fixed', value: e.target.value })}
                              className="w-40"
                            />
                          </div>
                        )}

                        {mode === 'offset' && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Delay after adhan</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={120}
                                value={iqamah?.value as number}
                                onChange={(e) => handleIqamahChange(prayer, { type: 'offset', value: Number(e.target.value) || 15 })}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">minutes after adhan</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>
      </Tabs>

      {dirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-full bg-background/80 backdrop-blur-xl border shadow-2xl pl-4 pr-1.5 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {changeCount} {changeCount === 1 ? 'change' : 'changes'}
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full h-7 px-4 text-xs">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
