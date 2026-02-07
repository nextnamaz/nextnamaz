'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, RefreshCw, Monitor, Sun, SunDim, SunMedium, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types/database';
import { asRecord } from '@/types/database';
import type { ScreenRotation, BrightnessPreset } from '@/types/prayer-config';
import { ScreenPresence } from './screen-presence';
import { THEME_REGISTRY } from '@/components/display/themes';
import { ThemeSettingsForm } from './theme-settings-form';

const themeList = Object.values(THEME_REGISTRY);

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

type ThemeConfigMap = Record<string, string | number | boolean>;

interface FormState {
  theme: string;
  themeConfig: ThemeConfigMap;
  rotation: ScreenRotation;
  zoom: number;
  brightness: number;
}

function configFromScreen(screen: Screen, themeId: string): ThemeConfigMap {
  const raw = asRecord(screen.theme_config);
  const def = THEME_REGISTRY[themeId];
  if (!def) return {};
  // Merge defaults with saved values
  const result: ThemeConfigMap = { ...def.defaultConfig };
  for (const field of def.fields) {
    const saved = raw[field.key];
    if (saved !== undefined && saved !== null) {
      result[field.key] = saved as string | number | boolean;
    }
  }
  return result;
}

function formFromScreen(screen: Screen): FormState {
  return {
    theme: screen.theme,
    themeConfig: configFromScreen(screen, screen.theme),
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
  const configRef = useRef(form.themeConfig);

  const dirty =
    form.theme !== saved.theme ||
    form.rotation !== saved.rotation ||
    form.zoom !== saved.zoom ||
    form.brightness !== saved.brightness ||
    JSON.stringify(form.themeConfig) !== JSON.stringify(saved.themeConfig);

  const patch = (updates: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleThemeChange = (themeId: string) => {
    const def = THEME_REGISTRY[themeId];
    const newConfig = def ? { ...def.defaultConfig } : {};
    patch({ theme: themeId, themeConfig: newConfig });
    configRef.current = newConfig;
  };

  const handleConfigChange = useCallback((config: ThemeConfigMap) => {
    configRef.current = config;
    setForm((prev) => ({ ...prev, themeConfig: config }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await createClient()
      .from('screens')
      .update({
        theme: form.theme,
        theme_config: configRef.current,
        rotation: form.rotation,
        zoom: form.zoom,
        brightness: form.brightness,
      })
      .eq('id', screen.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Saved');
      setSaved({ ...form, themeConfig: configRef.current });
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

  const currentThemeDef = THEME_REGISTRY[form.theme];

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.push(`/admin/${mosqueId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{screen.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure display and theme</p>
          </div>
          <div className="flex items-center gap-2">
            <ScreenPresence screenId={screen.id} />
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open
              </a>
            </Button>
            {dirty && (
              <Button onClick={handleSave} disabled={saving} className="ml-2">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="max-w-[1600px] mx-auto space-y-8">
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="screen">Screen</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-6 mt-0">
                {/* Theme picker */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Choose Theme</h3>
                    <p className="text-sm text-muted-foreground">Select a visual style for your display</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {themeList.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={cn(
                          'group relative flex flex-col rounded-xl border-2 text-left transition-all overflow-hidden',
                          form.theme === t.id
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <div className={cn('w-full aspect-video bg-muted', t.preview)} />
                        <div className="p-3">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme-specific settings */}
                {currentThemeDef && currentThemeDef.fields.length > 0 && (
                  <div className="space-y-4 pt-6 mt-6 border-t">
                    <div>
                      <h3 className="text-lg font-medium">{currentThemeDef.name} Settings</h3>
                      <p className="text-sm text-muted-foreground">Customize this theme&apos;s appearance</p>
                    </div>
                    <div className="max-w-2xl">
                      <ThemeSettingsForm
                        theme={currentThemeDef}
                        savedConfig={asRecord(screen.theme_config)}
                        onChange={handleConfigChange}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="screen" className="space-y-8 mt-0">
                <div className="max-w-4xl space-y-8">
                  {/* Orientation */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Orientation</h3>
                      <p className="text-sm text-muted-foreground">Set the display rotation</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {ROTATIONS.map((opt) => {
                        const active = form.rotation === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => patch({ rotation: opt.value })}
                            className={cn(
                              'flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                              active ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                            )}
                          >
                            <Monitor
                              className={cn('w-8 h-8 transition-transform', active ? 'text-primary' : 'text-muted-foreground')}
                              style={{ transform: `rotate(${opt.value}deg)` }}
                            />
                            <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scale */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Scale</h3>
                      <p className="text-sm text-muted-foreground">Adjust interface size</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {ZOOMS.map((opt) => {
                        const active = form.zoom === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => patch({ zoom: opt.value })}
                            className={cn(
                              'flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                              active ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                            )}
                          >
                            <Maximize
                              className={cn('w-6 h-6', active ? 'text-primary' : 'text-muted-foreground')}
                              strokeWidth={opt.stroke}
                            />
                            <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brightness */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Brightness</h3>
                      <p className="text-sm text-muted-foreground">Screen brightness (supported devices only)</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {BRIGHTNESS.map((opt) => {
                        const active = form.brightness === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => patch({ brightness: opt.value })}
                            className={cn(
                              'flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                              active ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30 hover:bg-muted/50'
                            )}
                          >
                            <BrightnessIcon
                              value={opt.value}
                              className={cn('w-6 h-6', active ? 'text-primary' : 'text-muted-foreground')}
                            />
                            <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Floating Preview - Fixed Bottom Right */}
        <div className="fixed bottom-6 right-6 w-[400px] z-50">
          <div className="bg-background rounded-xl border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
              </div>
            </div>
            <div className="relative w-full aspect-video bg-gray-900">
               <iframe
                src={`/display/${screen.slug}?theme=${form.theme}&preview=1`}
                className="absolute top-0 left-0 border-0 pointer-events-none w-[1920px] h-[1080px] origin-top-left"
                style={{ transform: `scale(${400 / 1920})` }}
                title="Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
