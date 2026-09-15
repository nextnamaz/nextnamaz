'use client';

import { useRef, useState } from 'react';
import {
  Clock,
  ExternalLink,
  ImagePlus,
  Languages,
  Loader2,
  Lock,
  Megaphone,
  Palette,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { saveScreen, uploadSlideImage } from '@/lib/actions';
import { Switch } from '@/components/ui/switch';
import type { ScreenSettingsInput, PrayerSourceInput } from '@/lib/actions';
import type { Screen, PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import { flattenDisplayText } from '@/lib/locale/helpers';
import { formatTodayDate } from '@/lib/display-locale';
import { CONTROL_QR_DELAY_MINUTES, CONTROL_QR_DURATION_MINUTES } from '@/lib/display-schedule';
import { THEME_REGISTRY } from '@/components/display/themes';
import { LanguageTab } from './language-tab';
import { SaveBar } from './save-bar';
import { SetupWizard } from './setup-wizard';
import { PinCard } from './pin-card';
import { SourceWizard, sourceLabel } from './source-wizard';
import { ThemePicker, ThemeSettingsForm } from './theme-settings-form';
import { ManualTimesFields, formFromScreen, sourceExplanation } from './settings-shared';
import type { FormState, Rotation, ThemeConfigMap } from './settings-shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ROTATION_LABELS: { value: Rotation; label: string }[] = [
  { value: 0, label: 'Normal' },
  { value: 90, label: 'Rotated right (90°)' },
  { value: 180, label: 'Upside down (180°)' },
  { value: 270, label: 'Rotated left (270°)' },
];

type TabId = 'prayers' | 'language' | 'theme' | 'announcements' | 'lock';

const TABS: { id: TabId; label: string; icon: typeof Clock }[] = [
  { id: 'prayers', label: 'Times', icon: Clock },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'lock', label: 'Lock', icon: Lock },
];

interface SettingsFormProps {
  screen: Screen;
  /** A PIN is set; the hash itself never reaches the client. */
  hasPin: boolean;
}

export function SettingsForm({ screen, hasPin }: SettingsFormProps) {
  const initial = formFromScreen(screen);
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>('prayers');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [inSetup, setInSetup] = useState(!screen.configured);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSlideUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadSlideImage(screen.id, fd);
    if (result.ok) {
      setForm((prev) => ({
        ...prev,
        displayConfig: {
          ...prev.displayConfig,
          announcements: {
            ...prev.displayConfig.announcements,
            items: [...prev.displayConfig.announcements.items, result.item],
          },
        },
      }));
    } else {
      toast.error(result.error);
    }
    setUploading(false);
  };

  const dirty = [
    ...PRAYER_NAMES.map((p) => form.times[p] !== saved.times[p]),
    form.prayerSource !== saved.prayerSource,
    JSON.stringify(form.sourceConfig) !== JSON.stringify(saved.sourceConfig),
    form.locale !== saved.locale,
    JSON.stringify(form.displayText) !== JSON.stringify(saved.displayText),
    form.theme !== saved.theme,
    JSON.stringify(form.themeConfig) !== JSON.stringify(saved.themeConfig),
    JSON.stringify(form.displayConfig) !== JSON.stringify(saved.displayConfig),
  ].some(Boolean);

  const handleThemeChange = (themeId: string) => {
    const def = THEME_REGISTRY[themeId];
    setForm((prev) => ({
      ...prev,
      theme: themeId,
      themeConfig: def ? { ...def.defaultConfig } : {},
    }));
  };

  const handleConfigChange = (config: ThemeConfigMap) => {
    setForm((prev) => ({ ...prev, themeConfig: config }));
  };

  const handleSourceApply = (
    source: PrayerSourceInput,
    config: Record<string, unknown>,
    times: PrayerTimesMap | null
  ) => {
    setForm((prev) => ({
      ...prev,
      prayerSource: source,
      sourceConfig: config,
      times: times ?? prev.times,
    }));
    setWizardOpen(false);
  };

  const handleSave = async (): Promise<boolean> => {
    setSaving(true);
    const input: ScreenSettingsInput = {
      prayer_times: form.times,
      prayer_source: form.prayerSource,
      prayer_source_config: form.sourceConfig,
      locale: form.locale,
      display_text: flattenDisplayText(form.displayText),
      theme: form.theme as ScreenSettingsInput['theme'],
      theme_config: form.themeConfig,
      display_config: form.displayConfig,
    };
    const result = await saveScreen(screen.id, input);
    if (result.ok) {
      setSaved(form);
      if (!inSetup) toast.success('Saved. The screen updates in a moment.');
    } else {
      toast.error(result.error);
    }
    setSaving(false);
    return result.ok;
  };

  const handleDiscard = () => setForm(saved);

  const currentThemeDef = THEME_REGISTRY[form.theme];
  const manual = form.prayerSource === 'manual';

  if (inSetup) {
    return (
      <SetupWizard
        screenId={screen.id}
        form={form}
        setForm={setForm}
        saving={saving}
        onFinish={handleSave}
        onExit={() => setInSetup(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Controller header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 h-14">
          <Logo size="xs" />
          <Button variant="outline" size="sm" asChild>
            <a href={`/tv/${screen.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5 mr-1.5" /> View screen
            </a>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold">Screen settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          This page is the remote control for your display. Changes appear on
          the TV the moment you save.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-10 flex gap-8">
        {/* Desktop sidebar nav */}
        <nav className="hidden sm:flex flex-col gap-1 w-44 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors text-left',
                tab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-4">
          {tab === 'prayers' && (
            wizardOpen ? (
              <SourceWizard
                translations={form.displayText}
                onApply={handleSourceApply}
                onCancel={() => setWizardOpen(false)}
              />
            ) : (
              <Card className="py-0 gap-0 overflow-hidden">
                {/* Active source panel */}
                <div className="flex items-center gap-4 p-4 sm:p-5 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Where the times come from</p>
                    <p className="text-lg font-semibold truncate">
                      {sourceLabel(form.prayerSource, form.sourceConfig)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sourceExplanation(form.prayerSource)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setWizardOpen(true)}>
                    Change
                  </Button>
                </div>

                <div className="p-4 sm:p-5">
                  {manual ? (
                    <ManualTimesFields
                      times={form.times}
                      labels={form.displayText.prayers}
                      onChange={(prayer, value) =>
                        setForm((prev) => ({
                          ...prev,
                          times: { ...prev.times, [prayer]: value },
                        }))
                      }
                    />
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-semibold">Today</h3>
                        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                          {formatTodayDate(form.locale)}
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {PRAYER_NAMES.map((prayer) => (
                          <div key={prayer} className="flex items-center justify-between py-2.5">
                            <span className="text-muted-foreground">
                              {form.displayText.prayers[prayer]}
                            </span>
                            <span className="text-xl font-semibold tabular-nums">
                              {form.times[prayer]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Updates automatically every day.
                      </p>
                    </>
                  )}
                </div>
              </Card>
            )
          )}

          {tab === 'language' && (
            <LanguageTab
              locale={form.locale}
              displayText={form.displayText}
              onLocaleChange={(locale) => setForm((prev) => ({ ...prev, locale }))}
              onDisplayTextChange={(displayText) => setForm((prev) => ({ ...prev, displayText }))}
            />
          )}

          {tab === 'theme' && (
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThemePicker
                  value={form.theme}
                  config={form.themeConfig}
                  onChange={handleThemeChange}
                />

                {currentThemeDef && currentThemeDef.fields.length > 0 && (
                  <div className="pt-4 border-t">
                    <ThemeSettingsForm
                      fields={currentThemeDef.fields}
                      config={form.themeConfig}
                      onChange={handleConfigChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'theme' && (
            <Card>
              <CardHeader>
                <CardTitle>During prayer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="blackout">Dark screen while praying</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      The display fades to black when a prayer&apos;s time
                      arrives, so nothing distracts the rows.
                    </p>
                  </div>
                  <Switch
                    id="blackout"
                    checked={form.displayConfig.blackout.enabled}
                    onCheckedChange={(enabled) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: {
                          ...prev.displayConfig,
                          blackout: { ...prev.displayConfig.blackout, enabled },
                        },
                      }))
                    }
                  />
                </div>
                {form.displayConfig.blackout.enabled && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between sm:w-64">
                      <Label htmlFor="blackout-minutes">Stay dark for</Label>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {form.displayConfig.blackout.minutes} min
                      </span>
                    </div>
                    <input
                      id="blackout-minutes"
                      type="range"
                      min={5}
                      max={45}
                      step={5}
                      value={form.displayConfig.blackout.minutes}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          displayConfig: {
                            ...prev.displayConfig,
                            blackout: {
                              ...prev.displayConfig.blackout,
                              minutes: Number(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full sm:w-64 accent-primary"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <Label htmlFor="control-qr">Show settings code after prayers</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      A small code appears in the corner for {CONTROL_QR_DURATION_MINUTES}{' '}
                      minutes, starting {CONTROL_QR_DELAY_MINUTES} minutes after each
                      prayer. On a TV with no remote it is the only way back into
                      these settings.
                    </p>
                  </div>
                  <Switch
                    id="control-qr"
                    checked={form.displayConfig.controlQr.enabled}
                    onCheckedChange={(enabled) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: {
                          ...prev.displayConfig,
                          controlQr: { ...prev.displayConfig.controlQr, enabled },
                        },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'announcements' && (
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground -mt-2">
                  Posters, event flyers, donation drives, or short videos.
                  Upload them here, choose how they appear, and press save.
                  The TV switches to them every so often, then returns to the
                  prayer times.
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="announcements">Show announcements</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Turn off to keep everything uploaded but paused.
                    </p>
                  </div>
                  <Switch
                    id="announcements"
                    checked={form.displayConfig.announcements.enabled}
                    onCheckedChange={(enabled) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: {
                          ...prev.displayConfig,
                          announcements: { ...prev.displayConfig.announcements, enabled },
                        },
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ann-layout">How they appear</Label>
                  <Select
                    value={form.displayConfig.announcements.layout}
                    onValueChange={(layout) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: {
                          ...prev.displayConfig,
                          announcements: {
                            ...prev.displayConfig.announcements,
                            layout: layout === 'split' ? 'split' : 'full',
                          },
                        },
                      }))
                    }
                  >
                    <SelectTrigger id="ann-layout" className="w-full sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Cover the whole screen</SelectItem>
                      <SelectItem value="split">Split screen, next to the prayer times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.displayConfig.announcements.items.map((item) => (
                    <div key={item.path} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-black">
                      {item.kind === 'video' ? (
                        <>
                          <video src={item.url} muted preload="metadata" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 rounded-full bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                            Video
                          </span>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- storage thumbnails, no optimizer
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            displayConfig: {
                              ...prev.displayConfig,
                              announcements: {
                                ...prev.displayConfig.announcements,
                                items: prev.displayConfig.announcements.items.filter(
                                  (i) => i.path !== item.path
                                ),
                              },
                            },
                          }))
                        }
                        className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.displayConfig.announcements.items.length < 12 && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={uploading}
                      className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs"
                    >
                      {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      {uploading ? 'Uploading…' : 'Add image or video'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WebP up to 4 MB. MP4 or WebM video up to 40 MB.
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void handleSlideUpload(file);
                  }}
                />

                {form.displayConfig.announcements.items.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ann-interval">Show every</Label>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {form.displayConfig.announcements.intervalMin} min
                        </span>
                      </div>
                      <input
                        id="ann-interval"
                        type="range"
                        min={1}
                        max={60}
                        step={1}
                        value={form.displayConfig.announcements.intervalMin}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            displayConfig: {
                              ...prev.displayConfig,
                              announcements: {
                                ...prev.displayConfig.announcements,
                                intervalMin: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ann-seconds">Each image for</Label>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {form.displayConfig.announcements.showSeconds} s
                        </span>
                      </div>
                      <input
                        id="ann-seconds"
                        type="range"
                        min={3}
                        max={60}
                        step={1}
                        value={form.displayConfig.announcements.showSeconds}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            displayConfig: {
                              ...prev.displayConfig,
                              announcements: {
                                ...prev.displayConfig.announcements,
                                showSeconds: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'theme' && (
            <Card>
              <CardHeader>
                <CardTitle>Screen fit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="rotation">Rotation</Label>
                  <Select
                    value={String(form.displayConfig.rotation)}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: { ...prev.displayConfig, rotation: Number(v) as Rotation },
                      }))
                    }
                  >
                    <SelectTrigger id="rotation" className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROTATION_LABELS.map(({ value, label }) => (
                        <SelectItem key={value} value={String(value)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    For wall-mounted TVs whose own picture can&apos;t be rotated.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between sm:w-64">
                    <Label htmlFor="zoom">Zoom</Label>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {Math.round(form.displayConfig.zoom * 100)}%
                    </span>
                  </div>
                  <input
                    id="zoom"
                    type="range"
                    min={80}
                    max={100}
                    step={1}
                    value={Math.round(form.displayConfig.zoom * 100)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        displayConfig: { ...prev.displayConfig, zoom: Number(e.target.value) / 100 },
                      }))
                    }
                    className="w-full sm:w-64 accent-primary"
                  />
                  <p className="text-sm text-muted-foreground">
                    Zoom out if the TV cuts off the edges of the display.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'lock' && <PinCard screenId={screen.id} hasPin={hasPin} />}
        </main>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                tab === id ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
