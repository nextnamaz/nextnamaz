'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMosqueSettings } from '@/hooks/use-mosque-settings';
import type { Json } from '@/types/database';
import type { SupportedLocale, DisplayTextConfig, LocaleMetadata } from '@/types/locale';
import { parseDisplayText, flattenDisplayText, parseLocaleMetadata } from '@/lib/locale/helpers';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { LanguageSettingsCard } from '@/components/admin/language-settings-card';
import { DateFormatSettingsCard } from '@/components/admin/date-format-settings-card';
import { TimeFormatSettingsCard } from '@/components/admin/time-format-settings-card';

export default function LocalizationPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const { settings, loading, saving, saveSettings } = useMosqueSettings(mosqueId);

  const [locale, setLocale] = useState<SupportedLocale>('en');
  const [displayText, setDisplayText] = useState<DisplayTextConfig>(DEFAULT_TRANSLATIONS.en);
  const [localeMetadata, setLocaleMetadata] = useState<LocaleMetadata>({
    dateFormat: 'DD/MM/YYYY',
    use24Hour: true,
    showSeconds: true,
    timezone: 'auto',
  });

  const savedSnapshot = useRef('');

  useEffect(() => {
    if (!settings) return;
    const parsedLocale = settings.locale as SupportedLocale;
    const parsedText = parseDisplayText(settings.display_text, settings.locale);
    const parsedMeta = parseLocaleMetadata(settings.metadata);

    setLocale(parsedLocale);
    setDisplayText(parsedText);
    setLocaleMetadata(parsedMeta);

    // Build snapshot using the SAME transforms as currentSnapshot
    savedSnapshot.current = JSON.stringify({
      locale: parsedLocale,
      display_text: flattenDisplayText(parsedText),
      dateFormat: parsedMeta.dateFormat,
      use24Hour: parsedMeta.use24Hour,
      showSeconds: parsedMeta.showSeconds,
      timezone: parsedMeta.timezone,
    });
  }, [settings]);

  const changeCount = (() => {
    if (!savedSnapshot.current) return 0;
    const s = JSON.parse(savedSnapshot.current) as Record<string, unknown>;
    const savedText = s.display_text as Record<string, string> | undefined;
    const currentText = flattenDisplayText(displayText);
    let count = 0;
    if (locale !== s.locale) count++;
    // Count each changed display text field individually
    if (savedText) {
      const allKeys = new Set([...Object.keys(currentText), ...Object.keys(savedText)]);
      for (const key of allKeys) {
        if (currentText[key] !== savedText[key]) count++;
      }
    }
    if (localeMetadata.dateFormat !== s.dateFormat) count++;
    if (localeMetadata.use24Hour !== s.use24Hour) count++;
    if (localeMetadata.showSeconds !== s.showSeconds) count++;
    if (localeMetadata.timezone !== s.timezone) count++;
    return count;
  })();
  const dirty = changeCount > 0;

  const handleSave = async () => {
    await saveSettings({
      locale,
      display_text: flattenDisplayText(displayText) as unknown as Json,
      metadata: {
        ...(settings?.metadata ?? {}),
        dateFormat: localeMetadata.dateFormat,
        use24Hour: localeMetadata.use24Hour,
        showSeconds: localeMetadata.showSeconds,
        timezone: localeMetadata.timezone,
      } as unknown as Json,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return <div className="text-muted-foreground">Settings not found</div>;

  return (
    <div className="w-full space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Localization</h1>

      <Tabs defaultValue="language" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="date">Date Format</TabsTrigger>
          <TabsTrigger value="time">Time Format</TabsTrigger>
        </TabsList>

        <TabsContent value="language" className="mt-0">
          <div className="max-w-2xl">
            <LanguageSettingsCard
              locale={locale}
              displayText={displayText}
              onLocaleChange={setLocale}
              onDisplayTextChange={setDisplayText}
            />
          </div>
        </TabsContent>

        <TabsContent value="date" className="mt-0">
          <div className="max-w-2xl">
            <DateFormatSettingsCard
              dateFormat={localeMetadata.dateFormat}
              onDateFormatChange={(fmt) =>
                setLocaleMetadata((prev) => ({ ...prev, dateFormat: fmt }))
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="time" className="mt-0">
          <div className="max-w-2xl">
            <TimeFormatSettingsCard
              use24Hour={localeMetadata.use24Hour}
              showSeconds={localeMetadata.showSeconds}
              timezone={localeMetadata.timezone}
              onUse24HourChange={(v) =>
                setLocaleMetadata((prev) => ({ ...prev, use24Hour: v }))
              }
              onShowSecondsChange={(v) =>
                setLocaleMetadata((prev) => ({ ...prev, showSeconds: v }))
              }
              onTimezoneChange={(v) =>
                setLocaleMetadata((prev) => ({ ...prev, timezone: v }))
              }
            />
          </div>
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
