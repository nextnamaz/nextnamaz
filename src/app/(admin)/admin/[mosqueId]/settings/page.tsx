'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { MosqueSettings, PrayerTimesMap, Json } from '@/types/database';
import { toMosqueSettings } from '@/types/database';
import { PRAYER_NAMES, PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import { prayerTimesSchema } from '@/lib/validations';
import type { PrayerSourceType, PrayerConfigMap, IqamahConfig, VaktijaBaSourceConfig } from '@/types/prayer-config';
import { PrayerSourceSelector } from '@/components/admin/prayer-source-selector';
import { IqamahConfigRow } from '@/components/admin/iqamah-config-row';

const IQAMAH_PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function MosqueSettingsPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const [settings, setSettings] = useState<MosqueSettings | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap>({
    fajr: '05:00', sunrise: '06:30', dhuhr: '13:00',
    asr: '16:30', maghrib: '19:00', isha: '20:30',
  });
  const [prayerSource, setPrayerSource] = useState<PrayerSourceType>('manual');
  const [sourceConfig, setSourceConfig] = useState<VaktijaBaSourceConfig | Record<string, never>>({});
  const [prayerConfig, setPrayerConfig] = useState<PrayerConfigMap>({});
  const [locale, setLocale] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('mosque_settings')
      .select('*')
      .eq('mosque_id', mosqueId)
      .single();

    if (error) {
      toast.error('Failed to load settings');
      setLoading(false);
      return;
    }

    if (data) {
      const s = toMosqueSettings(data);
      setSettings(s);
      setPrayerTimes(s.prayer_times);
      setPrayerSource(s.prayer_source);
      setSourceConfig(s.prayer_source_config as VaktijaBaSourceConfig | Record<string, never>);
      setPrayerConfig(s.prayer_config);
      setLocale(s.locale);
    }
    setLoading(false);
  }, [mosqueId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('mosque_settings')
      .update({
        prayer_times: prayerTimes,
        prayer_source: prayerSource,
        prayer_source_config: sourceConfig as unknown as Json,
        prayer_config: prayerConfig as unknown as Json,
        locale,
        updated_at: new Date().toISOString(),
      })
      .eq('mosque_id', mosqueId);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
    }
    setSaving(false);
  };

  const handleSync = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/prayer-times/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mosqueId, source: prayerSource, config: sourceConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrayerTimes(data.times);
      toast.success('Prayer times synced');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!settings) {
    return <div className="text-gray-500">Settings not found</div>;
  }

  const isExternal = prayerSource !== 'manual';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Prayer times, source, and iqamah configuration</p>
      </div>

      {/* Section 1: Prayer Source */}
      <Card>
        <CardHeader>
          <CardTitle>Prayer Time Source</CardTitle>
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

      {/* Section 2: Adhan Times */}
      <Card>
        <CardHeader>
          <CardTitle>Adhan Times</CardTitle>
          <CardDescription>
            {isExternal ? 'Times from external source (sync to update)' : 'Set the prayer times for your mosque'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PRAYER_NAMES.map((prayer) => (
            <div key={prayer} className="flex items-center gap-4">
              <Label className="w-24">{PRAYER_DISPLAY_NAMES[prayer]}</Label>
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
          {isExternal && (
            <Button onClick={handleSync} variant="outline" size="sm" disabled={saving}>
              Sync Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Iqamah Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Iqamah Times</CardTitle>
          <CardDescription>Configure iqamah delay or fixed time for each prayer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {IQAMAH_PRAYERS.map((prayer) => (
            <IqamahConfigRow
              key={prayer}
              prayer={prayer}
              adhanTime={prayerTimes[prayer]}
              config={prayerConfig[prayer]?.iqamah}
              onChange={(cfg) => handleIqamahChange(prayer, cfg)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Locale */}
      <Card>
        <CardHeader>
          <CardTitle>Locale</CardTitle>
          <CardDescription>Display language</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="tr">Turkish</option>
            <option value="ur">Urdu</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
