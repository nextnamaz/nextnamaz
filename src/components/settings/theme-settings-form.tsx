'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ThemeDefinition, ThemeFieldDefinition } from '@/components/display/themes';

type ThemeConfigValue = string | number | boolean;
type ThemeConfigMap = Record<string, ThemeConfigValue>;
type FormValues = Record<string, unknown>;

/** Build a Zod schema from the theme's field definitions. */
function buildSchema(fields: ThemeFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'textarea':
        shape[field.key] = z.string();
        break;
      case 'number':
        shape[field.key] = z.coerce.number();
        break;
      case 'switch':
        shape[field.key] = z.boolean();
        break;
      case 'select':
        shape[field.key] = z.string();
        break;
    }
  }

  return z.object(shape);
}

/** Merge saved config with defaults so every field has a value. */
function resolveValues(
  fields: ThemeFieldDefinition[],
  saved: Record<string, unknown>
): ThemeConfigMap {
  const result: ThemeConfigMap = {};
  for (const field of fields) {
    const saved_val = saved[field.key];
    if (saved_val !== undefined && saved_val !== null) {
      result[field.key] = saved_val as ThemeConfigValue;
    } else {
      result[field.key] = field.defaultValue;
    }
  }
  return result;
}

interface ThemeSettingsFormProps {
  theme: ThemeDefinition;
  savedConfig: Record<string, unknown>;
  onChange: (config: ThemeConfigMap) => void;
}

export function ThemeSettingsForm({ theme, savedConfig, onChange }: ThemeSettingsFormProps) {
  const schema = useMemo(() => buildSchema(theme.fields), [theme.fields]);
  const defaults = useMemo(
    () => resolveValues(theme.fields, savedConfig),
    [theme.fields, savedConfig]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Reset form when theme changes
  useEffect(() => {
    form.reset(defaults);
  }, [theme.id, defaults, form]);

  // Notify parent on every valid change
  useEffect(() => {
    const subscription = form.watch((values) => {
      const resolved: ThemeConfigMap = {};
      for (const field of theme.fields) {
        const v = values[field.key];
        resolved[field.key] = v !== undefined && v !== null
          ? (v as ThemeConfigValue)
          : field.defaultValue;
      }
      onChange(resolved);
    });
    return () => subscription.unsubscribe();
  }, [form, theme.fields, onChange]);

  if (theme.fields.length === 0) return null;

  return (
    <Form {...form}>
      <div className="space-y-4">
        {theme.fields.map((fieldDef) => (
          <FormField
            key={fieldDef.key}
            control={form.control}
            name={fieldDef.key}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldDef.label}</FormLabel>
                <FormControl>
                  {renderFieldInput(fieldDef, field)}
                </FormControl>
                {fieldDef.description && (
                  <FormDescription>{fieldDef.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </Form>
  );
}

interface FieldRenderProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  name: string;
}

function renderFieldInput(
  fieldDef: ThemeFieldDefinition,
  field: FieldRenderProps
) {
  switch (fieldDef.type) {
    case 'text':
      return (
        <Input
          name={field.name}
          value={(field.value as string) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
        />
      );
    case 'textarea':
      return (
        <Textarea
          name={field.name}
          value={(field.value as string) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          dir="auto"
        />
      );
    case 'number':
      return (
        <Input
          name={field.name}
          type="number"
          value={(field.value as number) ?? 0}
          onChange={(e) => field.onChange(Number(e.target.value))}
          onBlur={field.onBlur}
        />
      );
    case 'switch':
      return (
        <Switch
          checked={(field.value as boolean) ?? false}
          onCheckedChange={field.onChange}
        />
      );
    case 'select':
      return (
        <Select
          value={(field.value as string) ?? ''}
          onValueChange={field.onChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldDef.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return null;
  }
}
