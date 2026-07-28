'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { THEME_REGISTRY } from '@/components/display/themes';
import type { ThemeDefinition, ThemeFieldDefinition } from '@/components/display/themes';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';
import { cn } from '@/lib/utils';

export type ThemeConfigValue = string | number | boolean;
export type ThemeConfigMap = Record<string, ThemeConfigValue>;

// --- Theme picker with live thumbnails ---

/**
 * Themes lay out against a TV-sized viewport: they mix container-query units
 * with fixed type scales, so they only look right at full size. Thumbnails
 * therefore render a real theme at stage size and shrink it with a CSS
 * transform, rather than squeezing it into a small box.
 */
const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 540;

/** Track an element's rendered width so the stage can be scaled to fit it. */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Fires once on observe, so the first measurement arrives here too —
    // no setState in the effect body.
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

interface ThemeThumbnailProps {
  theme: ThemeDefinition;
  config: ThemeConfigMap;
}

function ThemeThumbnail({ theme, config }: ThemeThumbnailProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const nextPrayer = useMemo(() => getNextPrayer(PREVIEW_PRAYERS), []);
  const Preview = theme.component;

  return (
    <div ref={ref} className="relative w-full aspect-video overflow-hidden bg-muted">
      {/* Rendered only once measured, which also keeps the clock-driven
          themes out of the server render and avoids hydration mismatches. */}
      {width > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            containerType: 'size',
            transform: `scale(${width / STAGE_WIDTH})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <Preview
            prayers={PREVIEW_PRAYERS}
            nextPrayer={nextPrayer}
            config={{ ...theme.defaultConfig, ...config }}
            isPortrait={false}
            locale={PREVIEW_LOCALE}
          />
        </div>
      )}
    </div>
  );
}

interface ThemePickerProps {
  value: string;
  /** Live config of the selected theme, so its thumbnail tracks edits. */
  config: ThemeConfigMap;
  onChange: (themeId: string) => void;
}

export function ThemePicker({ value, config, onChange }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.values(THEME_REGISTRY).map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          aria-pressed={value === theme.id}
          className={cn(
            'flex flex-col rounded-xl border-2 text-left transition-colors overflow-hidden',
            value === theme.id
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-muted hover:border-primary/50'
          )}
        >
          <ThemeThumbnail
            theme={theme}
            config={value === theme.id ? config : theme.defaultConfig}
          />
          <div className="px-2.5 py-2 min-w-0">
            <div className="text-sm font-medium truncate">{theme.name}</div>
            <div className="text-xs text-muted-foreground truncate">{theme.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// --- Per-theme option fields ---

interface ThemeSettingsFormProps {
  fields: ThemeFieldDefinition[];
  config: ThemeConfigMap;
  onChange: (config: ThemeConfigMap) => void;
}

/**
 * Fully controlled: the parent owns the config, so switching theme or
 * discarding changes needs no remount. Values are re-checked on the server
 * in saveScreen, so there is no client-side validation layer here.
 */
export function ThemeSettingsForm({ fields, config, onChange }: ThemeSettingsFormProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const id = `theme-field-${field.key}`;
        const value = config[field.key] ?? field.defaultValue;
        const set = (next: ThemeConfigValue) => onChange({ ...config, [field.key]: next });

        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={id}>{field.label}</Label>
            <ThemeField id={id} field={field} value={value} onChange={set} />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ThemeFieldProps {
  id: string;
  field: ThemeFieldDefinition;
  value: ThemeConfigValue;
  onChange: (value: ThemeConfigValue) => void;
}

function ThemeField({ id, field, value, onChange }: ThemeFieldProps) {
  switch (field.type) {
    case 'text':
      return <Input id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return (
        <Textarea
          id={id}
          dir="auto"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case 'switch':
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />;
    case 'select':
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
  }
}
