'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types/database';
import type { ScreenRotation } from '@/types/prayer-config';
import { ScreenPresence } from '@/components/admin/screen-presence';

const THEMES = [
  { id: 'classic', name: 'Classic', description: 'Traditional green and gold', preview: 'bg-gradient-to-br from-emerald-800 to-emerald-950' },
  { id: 'modern', name: 'Modern', description: 'Clean, minimal dark theme', preview: 'bg-gradient-to-br from-slate-800 to-slate-950' },
  { id: 'light', name: 'Light', description: 'Bright, high-contrast', preview: 'bg-gradient-to-br from-white to-gray-100 border-2' },
  { id: 'ramadan', name: 'Ramadan', description: 'Special Ramadan theme', preview: 'bg-gradient-to-br from-purple-800 to-indigo-950' },
];

const ROTATIONS: ScreenRotation[] = [0, 90, 180, 270];

export default function ScreenEditorPage() {
  const { mosqueId, screenId } = useParams<{ mosqueId: string; screenId: string }>();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [rotation, setRotation] = useState<ScreenRotation>(0);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadScreen = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('screens')
      .select('*')
      .eq('id', screenId)
      .single();

    if (error) {
      toast.error('Failed to load screen');
      setLoading(false);
      return;
    }

    if (data) {
      setScreen(data);
      setSelectedTheme(data.theme);
      setRotation((data.rotation as ScreenRotation) || 0);
      setZoom(data.zoom ?? 100);
      setBrightness(data.brightness ?? 100);
    }
    setLoading(false);
  }, [screenId]);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  const handleSave = async () => {
    if (!screen) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('screens')
      .update({ theme: selectedTheme, rotation, zoom, brightness })
      .eq('id', screenId);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Screen settings saved');
      setScreen({ ...screen, theme: selectedTheme, rotation, zoom, brightness });
    }
    setSaving(false);
  };

  const handleForceRefresh = async () => {
    const supabase = createClient();
    const channel = supabase.channel(`screen:${screenId}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'command',
      payload: { type: 'refresh', timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
    toast.success('Refresh command sent');
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!screen) {
    return <div className="text-gray-500">Screen not found</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/${mosqueId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{screen.name}</h1>
          <p className="text-gray-600">Configure theme, display controls, and monitor devices</p>
        </div>
        <ScreenPresence screenId={screenId} />
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose how this screen looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={cn(
                  'rounded-lg p-3 text-left transition-all border-2',
                  selectedTheme === theme.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-gray-200'
                )}
              >
                <div className={cn('w-full h-16 rounded-md mb-2', theme.preview)} />
                <div className="font-medium text-sm">{theme.name}</div>
                <div className="text-xs text-gray-500">{theme.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Display Controls</CardTitle>
          <CardDescription>Rotation, zoom, and brightness for connected devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Rotation</Label>
            <div className="flex gap-2">
              {ROTATIONS.map((r) => (
                <Button
                  key={r}
                  variant={rotation === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRotation(r)}
                >
                  {r}&deg;
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Zoom: {zoom}%</Label>
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={25}
              max={200}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Brightness: {brightness}%</Label>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={10}
              max={100}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleForceRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Force Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open Full Screen
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full bg-gray-900 overflow-hidden rounded-b-lg" style={{ height: '400px' }}>
            <iframe
              src={`/display/${screen.slug}?theme=${selectedTheme}`}
              className="absolute top-0 left-0 border-0 pointer-events-none"
              style={{
                width: '1920px',
                height: '1080px',
                transform: 'scale(0.42)',
                transformOrigin: 'top left',
              }}
              title="Screen preview"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
