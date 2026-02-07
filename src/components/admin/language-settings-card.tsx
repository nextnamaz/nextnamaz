'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LANGUAGES, DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import type { SupportedLocale, DisplayTextConfig } from '@/types/locale';
import { Check, RotateCcw } from 'lucide-react';

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const LABEL_KEYS: { key: keyof DisplayTextConfig['labels']; label: string }[] = [
  { key: 'prayer', label: 'Prayer' },
  { key: 'iqamah', label: 'Iqamah' },
  { key: 'begins', label: 'Begins' },
  { key: 'next', label: 'Next' },
];

interface LanguageSettingsCardProps {
  locale: SupportedLocale;
  displayText: DisplayTextConfig;
  onLocaleChange: (locale: SupportedLocale) => void;
  onDisplayTextChange: (displayText: DisplayTextConfig) => void;
}

export function LanguageSettingsCard({
  locale,
  displayText,
  onLocaleChange,
  onDisplayTextChange,
}: LanguageSettingsCardProps) {
  const currentLang = LANGUAGES.find((l) => l.code === locale);
  const isRtl = currentLang?.rtl ?? false;

  const handleLanguageSelect = (code: SupportedLocale) => {
    onLocaleChange(code);
    const preset = DEFAULT_TRANSLATIONS[code];
    if (preset) {
      onDisplayTextChange(preset);
    }
  };

  const handlePrayerChange = (prayer: PrayerName, value: string) => {
    onDisplayTextChange({
      ...displayText,
      prayers: { ...displayText.prayers, [prayer]: value },
    });
  };

  const handleLabelChange = (key: keyof DisplayTextConfig['labels'], value: string) => {
    onDisplayTextChange({
      ...displayText,
      labels: { ...displayText.labels, [key]: value },
    });
  };

  const handleReset = () => {
    const preset = DEFAULT_TRANSLATIONS[locale];
    if (preset) {
      onDisplayTextChange(preset);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Language Settings</CardTitle>
        <CardDescription>Choose interface language and customize translations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Picker */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Choose a language</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSelect(lang.code)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  locale === lang.code
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {locale === lang.code && <Check className="size-4" />}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Translations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Customize translations</Label>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              <RotateCcw className="size-3 mr-1" />
              Reset to defaults
            </Button>
          </div>

          {/* Prayer names */}
          <div className="grid grid-cols-2 gap-4">
            {PRAYER_NAMES.map((prayer) => (
              <div key={prayer} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{PRAYER_LABELS[prayer]}</Label>
                <Input
                  value={displayText.prayers[prayer]}
                  onChange={(e) => handlePrayerChange(prayer, e.target.value)}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
            ))}
          </div>

          {/* UI labels */}
          <div className="grid grid-cols-2 gap-4">
            {LABEL_KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  value={displayText.labels[key]}
                  onChange={(e) => handleLabelChange(key, e.target.value)}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
