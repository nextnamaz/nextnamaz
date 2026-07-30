'use client';

import { useState } from 'react';
import { Clock, Languages, Palette } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { saveScreen } from '@/lib/actions';
import type { ScreenSettingsInput, PrayerSourceInput } from '@/lib/actions';
import { asPrayerTimes, asRecord, asStringRecord } from '@/types/database';
import type { Screen, PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import { parseDisplayText, flattenDisplayText } from '@/lib/locale/helpers';
import { formatTodayDate } from '@/lib/display-locale';
import type { SupportedLocale, DisplayTextConfig } from '@/types/locale';
import { THEME_REGISTRY } from '@/components/display/themes';
import { LanguageTab } from './language-tab';
import { SaveBar } from './save-bar';
import { SourceWizard, sourceLabel } from './source-wizard';
import { ThemePicker, ThemeSettingsForm } from './theme-settings-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ThemeConfigMap = Record<string, string | number | boolean>;

const SOURCE_VALUES: PrayerSourceInput[] = ['manual', 'adhan', 'vaktija_ba', 'vaktija_eu', 'islamiska_forbundet'];

interface FormState {
  times: PrayerTimesMap;
  prayerSource: PrayerSourceInput;
  sourceConfig: Record<string, unknown>;
  locale: SupportedLocale;
  displayText: DisplayTextConfig;
  theme: string;
  themeConfig: ThemeConfigMap;
}

function formFromScreen(screen: Screen): FormState {
  return {
    times: asPrayerTimes(screen.prayer_times),
    prayerSource: SOURCE_VALUES.includes(screen.prayer_source as PrayerSourceInput)
      ? (screen.prayer_source as PrayerSourceInput)
      : 'manual',
    sourceConfig: asRecord(screen.prayer_source_config),
    locale: (screen.locale || 'en') as SupportedLocale,
    displayText: parseDisplayText(asStringRecord(screen.display_text), screen.locale),
    theme: screen.theme in THEME_REGISTRY ? screen.theme : 'default',
    themeConfig: asRecord(screen.theme_config) as ThemeConfigMap,
  };
}

type TabId = 'prayers' | 'language' | 'theme';

const TABS: { id: TabId; label: string; icon: typeof Clock }[] = [
  { id: 'prayers', label: 'Times', icon: Clock },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'theme', label: 'Theme', icon: Palette },
];

interface SettingsFormProps {
  screen: Screen;
}

export function SettingsForm({ screen }: SettingsFormProps) {
  const initial = formFromScreen(screen);
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>('prayers');
  const [wizardOpen, setWizardOpen] = useState(false);

  const dirty = [
    ...PRAYER_NAMES.map((p) => form.times[p] !== saved.times[p]),
    form.prayerSource !== saved.prayerSource,
    JSON.stringify(form.sourceConfig) !== JSON.stringify(saved.sourceConfig),
    form.locale !== saved.locale,
    JSON.stringify(form.displayText) !== JSON.stringify(saved.displayText),
    form.theme !== saved.theme,
    JSON.stringify(form.themeConfig) !== JSON.stringify(saved.themeConfig),
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

  const handleSave = async () => {
    setSaving(true);
    const input: ScreenSettingsInput = {
      prayer_times: form.times,
      prayer_source: form.prayerSource,
      prayer_source_config: form.sourceConfig,
      locale: form.locale,
      display_text: flattenDisplayText(form.displayText),
      theme: form.theme as ScreenSettingsInput['theme'],
      theme_config: form.themeConfig,
    };
    const result = await saveScreen(screen.id, input);
    if (result.ok) {
      setSaved(form);
      toast.success('Saved — the screen updates in a moment');
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDiscard = () => setForm(saved);

  const currentThemeDef = THEME_REGISTRY[form.theme];
  const manual = form.prayerSource === 'manual';

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Controller header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 h-14">
          <Logo size="xs" />
          <p className="min-w-0 text-xs text-muted-foreground truncate">
            {sourceLabel(form.prayerSource, form.sourceConfig)}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-10 flex gap-8">
        {/* Desktop sidebar nav */}
        <nav className="hidden sm:flex flex-col gap-1 w-44 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                tab === id
                  ? 'bg-primary/10 text-primary'
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
                    <p className="text-xs text-muted-foreground">Prayer times source</p>
                    <p className="text-lg font-semibold truncate">
                      {sourceLabel(form.prayerSource, form.sourceConfig)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setWizardOpen(true)}>
                    Change
                  </Button>
                </div>

                <div className="p-4 sm:p-5">
                  {manual ? (
                    <div className="space-y-3">
                      {PRAYER_NAMES.map((prayer) => (
                        <div key={prayer} className="flex items-center justify-between gap-4">
                          <Label htmlFor={`time-${prayer}`} className="text-base">
                            {form.displayText.prayers[prayer]}
                          </Label>
                          <Input
                            id={`time-${prayer}`}
                            type="time"
                            className="w-40 text-base"
                            value={form.times[prayer]}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                times: { ...prev.times, [prayer]: e.target.value },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
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
        </main>
      </div>

      <SaveBar visible={dirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
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
