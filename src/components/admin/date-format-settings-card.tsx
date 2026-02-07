'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DATE_FORMAT_OPTIONS } from '@/lib/locale/presets';
import type { DateFormatOption } from '@/types/locale';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

interface DateFormatSettingsCardProps {
  dateFormat: DateFormatOption;
  onDateFormatChange: (format: DateFormatOption) => void;
}

export function DateFormatSettingsCard({
  dateFormat,
  onDateFormatChange,
}: DateFormatSettingsCardProps) {
  const now = new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Format</CardTitle>
        <CardDescription>Choose how dates are displayed on the prayer screen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {DATE_FORMAT_OPTIONS.map((opt) => {
          const isSelected = dateFormat === opt.value;
          let preview: string;
          try {
            preview = format(now, opt.dateFnsFormat);
          } catch {
            preview = opt.value;
          }

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onDateFormatChange(opt.value)}
              className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted'
              }`}
            >
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{preview}</div>
              </div>
              {isSelected && <Check className="size-5 text-primary" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
