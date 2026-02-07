'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, RefreshCw, Monitor, Sun, SunDim, SunMedium, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types/database';
import type { ScreenRotation, BrightnessPreset, RotationOption, ZoomOption, BrightnessOption } from '@/types/prayer-config';
import { ScreenPresence } from '@/components/admin/screen-presence';

const THEMES = [
  { id: 'default', name: 'Default', description: 'Responsive table layout', preview: 'bg-[#374151]' },
  { id: 'classic', name: 'Classic', description: 'Traditional green and gold', preview: 'bg-gradient-to-br from-emerald-800 to-emerald-950' },
  { id: 'modern', name: 'Modern', description: 'Clean, minimal dark theme', preview: 'bg-gradient-to-br from-slate-800 to-slate-950' },
  { id: 'light', name: 'Light', description: 'Bright, high-contrast', preview: 'bg-gradient-to-br from-white to-gray-100 border-2' },
  { id: 'ramadan', name: 'Ramadan', description: 'Special Ramadan theme', preview: 'bg-gradient-to-br from-purple-800 to-indigo-950' },
  { id: 'andalus', name: 'Andalus', description: 'Elegant Al-Andalus inspired', preview: 'bg-gradient-to-br from-[#1a2030] to-[#141820]' },
];

const ROTATION_OPTIONS: RotationOption[] = [
  { value: 0, label: 'Landscape' },
  { value: 90, label: 'Portrait' },
  { value: 180, label: 'Flipped' },
  { value: 270, label: 'Portrait Left' },
];

const ZOOM_OPTIONS: ZoomOption[] = [
  { value: 75, label: 'Compact', description: 'Dense layout' },
  { value: 100, label: 'Default', description: 'Standard fit' },
  { value: 125, label: 'Large', description: 'Easy to read' },
  { value: 150, label: 'Extra Large', description: 'Maximum visibility' },
];

const BRIGHTNESS_OPTIONS: BrightnessOption[] = [
  { value: 25, label: 'Dim' },
  { value: 50, label: 'Low' },
  { value: 75, label: 'Normal' },
  { value: 100, label: 'Full' },
];

function RotationIcon({ rotation, className }: { rotation: ScreenRotation; className?: string }) {
  return (
    <Monitor
      className={cn('transition-transform', className)}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
}

function BrightnessIcon({ level, className }: { level: BrightnessPreset; className?: string }) {
  switch (level) {
    case 25:
      return <SunDim className={cn('opacity-40', className)} />;
    case 50:
      return <SunDim className={className} />;
    case 75:
      return <SunMedium className={className} />;
    case 100:
      return <Sun className={className} />;
  }
}

export default function ScreenEditorPage() {
  const { mosqueId, screenId } = useParams<{ mosqueId: string; screenId: string }>();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [rotation, setRotation] = useState<ScreenRotation>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
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
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!screen) {
    return <div className="text-muted-foreground">Screen not found</div>;
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
          <p className="text-muted-foreground">Configure theme, display controls, and monitor devices</p>
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
                    : 'border-transparent hover:border-border'
                )}
              >
                <div className={cn('w-full h-16 rounded-md mb-2', theme.preview)} />
                <div className="font-medium text-sm">{theme.name}</div>
                <div className="text-xs text-muted-foreground">{theme.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Display Controls</CardTitle>
          <CardDescription>Configure how the screen renders on connected devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Rotation */}
          <div className="space-y-3">
            <Label>Orientation</Label>
            <div className="grid grid-cols-4 gap-3">
              {ROTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRotation(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    rotation === opt.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-accent'
                  )}
                >
                  <RotationIcon
                    rotation={opt.value}
                    className={cn(
                      'w-8 h-8',
                      rotation === opt.value ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className={cn(
                    'text-xs font-medium',
                    rotation === opt.value ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div className="space-y-3">
            <Label>Scale</Label>
            <div className="grid grid-cols-4 gap-3">
              {ZOOM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setZoom(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-4 transition-all',
                    zoom === opt.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-accent'
                  )}
                >
                  <Maximize
                    className={cn(
                      'w-6 h-6',
                      zoom === opt.value ? 'text-primary' : 'text-muted-foreground'
                    )}
                    strokeWidth={opt.value >= 125 ? 2.5 : 1.5}
                  />
                  <span className={cn(
                    'text-xs font-medium',
                    zoom === opt.value ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-3">
            <Label>Brightness</Label>
            <div className="grid grid-cols-4 gap-3">
              {BRIGHTNESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBrightness(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    brightness === opt.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-accent'
                  )}
                >
                  <BrightnessIcon
                    level={opt.value}
                    className={cn(
                      'w-7 h-7',
                      brightness === opt.value ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className={cn(
                    'text-xs font-medium',
                    brightness === opt.value ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
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
              src={`/display/${screen.slug}?theme=${selectedTheme}&preview=1`}
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
