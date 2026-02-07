'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { MosqueSettings, PrayerTimesMap } from '@/types/database';
import { toMosqueSettings } from '@/types/database';
import { PRAYER_NAMES, PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import { prayerTimesSchema } from '@/lib/validations';

export default function MosqueSettingsPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const [settings, setSettings] = useState<MosqueSettings | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap>({
    fajr: '05:00',
    sunrise: '06:30',
    dhuhr: '13:00',
    asr: '16:30',
    maghrib: '19:00',
    isha: '20:30',
  });
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
      setLocale(s.locale);
    }
    setLoading(false);
  }, [mosqueId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    const validation = prayerTimesSchema.safeParse(prayerTimes);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('mosque_settings')
      .update({
        prayer_times: prayerTimes,
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

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!settings) {
    return <div className="text-gray-500">Settings not found</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Prayer times and display settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prayer Times</CardTitle>
          <CardDescription>Set the prayer times for your mosque</CardDescription>
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
              />
            </div>
          ))}
        </CardContent>
      </Card>

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
