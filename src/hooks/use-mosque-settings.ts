'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { MosqueSettings, Json } from '@/types/database';
import type { Database } from '@/types/database';
import { toMosqueSettings } from '@/types/database';

type MosqueSettingsUpdate = Database['public']['Tables']['mosque_settings']['Update'];

export function useMosqueSettings(mosqueId: string) {
  const [settings, setSettings] = useState<MosqueSettings | null>(null);
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
      setSettings(toMosqueSettings(data));
    }
    setLoading(false);
  }, [mosqueId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (updates: Omit<MosqueSettingsUpdate, 'mosque_id' | 'updated_at'>) => {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, Json | string> = {
      updated_at: new Date().toISOString(),
    };
    for (const [key, value] of Object.entries(updates)) {
      payload[key] = value as Json | string;
    }

    const { error } = await supabase
      .from('mosque_settings')
      .update(payload)
      .eq('mosque_id', mosqueId);

    if (error) {
      toast.error('Failed to save settings');
      setSaving(false);
      return false;
    }

    toast.success('Settings saved');
    await loadSettings();
    setSaving(false);
    return true;
  };

  return { settings, loading, saving, saveSettings };
}
