'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!settings) return;
    setLocale(settings.locale as SupportedLocale);
    setDisplayText(parseDisplayText(settings.display_text, settings.locale));
    setLocaleMetadata(parseLocaleMetadata(settings.metadata));
  }, [settings]);

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) return <div className="text-muted-foreground">Settings not found</div>;

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Localization</h1>
        <p className="text-muted-foreground mt-1">Language, date format, and time display settings</p>
      </div>

      <Tabs defaultValue="language" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <TabsContent value="language" className="mt-0">
            <LanguageSettingsCard
              locale={locale}
              displayText={displayText}
              onLocaleChange={setLocale}
              onDisplayTextChange={setDisplayText}
            />
          </TabsContent>

          <TabsContent value="display" className="space-y-8 mt-0">
            <div className="grid gap-8">
              <DateFormatSettingsCard
                dateFormat={localeMetadata.dateFormat}
                onDateFormatChange={(fmt) =>
                  setLocaleMetadata((prev) => ({ ...prev, dateFormat: fmt }))
                }
              />
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
        </div>
      </Tabs>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4">
        <div className="flex items-center justify-between rounded-full bg-background/80 backdrop-blur-xl border shadow-2xl p-2 pl-6">
          <span className="text-sm font-medium text-muted-foreground">
            Unsaved changes
          </span>
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
