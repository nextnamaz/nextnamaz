'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LANGUAGES, DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { PRAYER_NAMES, PRAYER_DISPLAY_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import type { SupportedLocale, DisplayTextConfig } from '@/types/locale';
import { Check, RotateCcw } from 'lucide-react';

const LABEL_KEYS: { key: keyof DisplayTextConfig['labels']; label: string }[] = [
  { key: 'prayer', label: 'Prayer' },
  { key: 'iqamah', label: 'Iqamah' },
  { key: 'begins', label: 'Begins' },
  { key: 'next', label: 'Next' },
  { key: 'now', label: 'Now' },
  { key: 'until', label: 'In / until' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'elapsed', label: 'Passed' },
  { key: 'today', label: 'Today' },
  { key: 'jumuah', label: "Jumu'ah" },
  { key: 'adhan', label: 'Adhan' },
];

interface LanguagePickerProps {
  value: SupportedLocale;
  onChange: (code: SupportedLocale) => void;
}

/** The display's languages as large tiles: the name in its own script, and in English below. */
export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div role="radiogroup" aria-label="Screen language" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {LANGUAGES.map((lang) => {
        const on = value === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(lang.code)}
            className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
              on ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {lang.flag}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold" dir={lang.rtl ? 'rtl' : 'ltr'}>
                {lang.nativeName}
              </span>
              {lang.name !== lang.nativeName && (
                <span className="block truncate text-xs text-muted-foreground">{lang.name}</span>
              )}
            </span>
            {on && <Check className="absolute top-2 right-2 size-4 text-primary" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

interface LanguageTabProps {
  locale: SupportedLocale;
  displayText: DisplayTextConfig;
  onLocaleChange: (locale: SupportedLocale) => void;
  onDisplayTextChange: (displayText: DisplayTextConfig) => void;
}

export function LanguageTab({
  locale,
  displayText,
  onLocaleChange,
  onDisplayTextChange,
}: LanguageTabProps) {
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
        <CardTitle className="text-lg">Language</CardTitle>
        <CardDescription>The language of the screen. Every word on it can be changed below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LanguagePicker value={locale} onChange={handleLanguageSelect} />

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Customize texts</Label>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              <RotateCcw className="size-3 mr-1" />
              Reset to defaults
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PRAYER_NAMES.map((prayer) => (
              <div key={prayer} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{PRAYER_DISPLAY_NAMES[prayer]}</Label>
                <Input
                  value={displayText.prayers[prayer]}
                  onChange={(e) => handlePrayerChange(prayer, e.target.value)}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
              </div>
            ))}
          </div>

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
