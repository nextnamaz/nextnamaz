'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, RefreshCw, Monitor, Sun, SunDim, SunMedium, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types/database';
import type { ScreenRotation, BrightnessPreset } from '@/types/prayer-config';
import { ScreenPresence } from './screen-presence';

const THEMES = [
  { id: 'classic', name: 'Classic', description: 'Traditional green & gold', preview: 'bg-linear-to-br from-emerald-800 to-emerald-950' },
  { id: 'andalus', name: 'Andalus', description: 'Elegant Al-Andalus inspired', preview: 'bg-linear-to-br from-[#1a2030] to-[#141820]' },
] as const;

const ROTATIONS: { value: ScreenRotation; label: string }[] = [
  { value: 0, label: 'Landscape' },
  { value: 90, label: 'Portrait' },
  { value: 180, label: 'Flipped' },
  { value: 270, label: 'Portrait Left' },
];

const ZOOMS = [
  { value: 75, label: 'Compact', stroke: 1.5 },
  { value: 100, label: 'Default', stroke: 1.5 },
  { value: 125, label: 'Large', stroke: 2.5 },
  { value: 150, label: 'Extra Large', stroke: 2.5 },
] as const;

const BRIGHTNESS: { value: BrightnessPreset; label: string }[] = [
  { value: 25, label: 'Dim' },
  { value: 50, label: 'Low' },
  { value: 75, label: 'Normal' },
  { value: 100, label: 'Full' },
];

interface FormState {
  theme: string;
  rotation: ScreenRotation;
  zoom: number;
  brightness: number;
}

function formFromScreen(screen: Screen): FormState {
  return {
    theme: screen.theme,
    rotation: (screen.rotation as ScreenRotation) || 0,
    zoom: screen.zoom ?? 100,
    brightness: screen.brightness ?? 100,
  };
}

function BrightnessIcon({ value, className }: { value: BrightnessPreset; className?: string }) {
  if (value <= 50) return <SunDim className={cn(className, value === 25 && 'opacity-40')} />;
  if (value === 75) return <SunMedium className={className} />;
  return <Sun className={className} />;
}

interface ScreenEditorProps {
  screen: Screen;
  mosqueId: string;
}

export function ScreenEditor({ screen, mosqueId }: ScreenEditorProps) {
  const router = useRouter();
  const initial = formFromScreen(screen);
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  const dirty =
    form.theme !== saved.theme ||
    form.rotation !== saved.rotation ||
    form.zoom !== saved.zoom ||
    form.brightness !== saved.brightness;

  const patch = (updates: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await createClient()
      .from('screens')
      .update({
        theme: form.theme,
        rotation: form.rotation,
        zoom: form.zoom,
        brightness: form.brightness,
      })
      .eq('id', screen.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Saved');
      setSaved(form);
    }
    setSaving(false);
  };

  const handleRefresh = async () => {
    const supabase = createClient();
    const channel = supabase.channel(`screen:${screen.id}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'command',
      payload: { type: 'refresh', timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
    toast.success('Refresh sent');
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/${mosqueId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{screen.name}</h1>
          <p className="text-sm text-muted-foreground">Configure display and theme</p>
        </div>
        <ScreenPresence screenId={screen.id} />
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => patch({ theme: t.id })}
                className={cn(
                  'rounded-lg p-4 text-left transition-all border-2',
                  form.theme === t.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-border'
                )}
              >
                <div className={cn('w-full h-20 rounded-md mb-3', t.preview)} />
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Display Controls</CardTitle>
          <CardDescription>Orientation, scale & brightness for connected devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Orientation */}
          <div className="space-y-2">
            <Label>Orientation</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ROTATIONS.map((opt) => {
                const active = form.rotation === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => patch({ rotation: opt.value })}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <Monitor
                      className={cn('w-6 h-6 transition-transform', active ? 'text-primary' : 'text-muted-foreground')}
                      style={{ transform: `rotate(${opt.value}deg)` }}
                    />
                    <span className={cn('text-xs font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <Label>Scale</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ZOOMS.map((opt) => {
                const active = form.zoom === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => patch({ zoom: opt.value })}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <Maximize
                      className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')}
                      strokeWidth={opt.stroke}
                    />
                    <span className={cn('text-xs font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <Label>Brightness</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BRIGHTNESS.map((opt) => {
                const active = form.brightness === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => patch({ brightness: opt.value })}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all',
                      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    )}
                  >
                    <BrightnessIcon
                      value={opt.value}
                      className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <span className={cn('text-xs font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full aspect-video bg-gray-900 overflow-hidden rounded-b-lg">
            <iframe
              src={`/display/${screen.slug}?theme=${form.theme}&preview=1`}
              className="absolute top-0 left-0 border-0 pointer-events-none w-[1920px] h-[1080px] origin-top-left"
              style={{ transform: 'scale(0.465)' }}
              title="Preview"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky save — only when dirty */}
      {dirty && (
        <div className="sticky bottom-4">
          <div className="flex justify-end rounded-lg bg-background/80 backdrop-blur border p-3 shadow-lg">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
