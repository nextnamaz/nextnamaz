'use client';

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PrayerSourceType,
  PrayerSourceConfig,
  VaktijaBaSourceConfig,
  VaktijaEuSourceConfig,
  IslamiskaForbundetSourceConfig,
} from '@/types/prayer-config';
import type { PrayerTimesMap } from '@/types/database';
import { VAKTIJA_LOCATIONS } from '@/lib/prayer-sources/vaktija-ba';
import { VAKTIJA_EU_COUNTRIES } from '@/lib/prayer-sources/vaktija-eu';
import { ISLAMISKA_CITIES } from '@/lib/prayer-sources/islamiska-forbundet';

interface PrayerSourceSelectorProps {
  source: PrayerSourceType;
  sourceConfig: PrayerSourceConfig;
  onSourceChange: (source: PrayerSourceType) => void;
  onSourceConfigChange: (config: PrayerSourceConfig) => void;
  onTimesFetched: (times: PrayerTimesMap) => void;
}

interface SourceCardDef {
  id: PrayerSourceType;
  name: string;
  description: string;
}

const SOURCES: SourceCardDef[] = [
  { id: 'manual', name: 'Manual Entry', description: 'Enter prayer times by hand' },
  { id: 'vaktija_ba', name: 'Vaktija.ba', description: 'Bosnia & Herzegovina' },
  { id: 'vaktija_eu', name: 'Vaktija.eu', description: '17 European countries' },
  { id: 'islamiska_forbundet', name: 'Islamiska Förbundet', description: 'Sweden' },
];

function isVaktijaBaConfig(config: PrayerSourceConfig): config is VaktijaBaSourceConfig {
  return 'locationId' in config;
}

function isVaktijaEuConfig(config: PrayerSourceConfig): config is VaktijaEuSourceConfig {
  return 'locationSlug' in config;
}

function isIslamiskaConfig(config: PrayerSourceConfig): config is IslamiskaForbundetSourceConfig {
  return 'city' in config;
}

export function PrayerSourceSelector({
  source,
  sourceConfig,
  onSourceChange,
  onSourceConfigChange,
  onTimesFetched,
}: PrayerSourceSelectorProps) {
  const [fetching, setFetching] = useState(false);

  const handleFetch = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/prayer-times/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, config: sourceConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTimesFetched(data.times);
    } catch {
      // Error handled by parent via toast
    } finally {
      setFetching(false);
    }
  };

  const canFetch = source !== 'manual' && (
    (source === 'vaktija_ba' && isVaktijaBaConfig(sourceConfig)) ||
    (source === 'vaktija_eu' && isVaktijaEuConfig(sourceConfig) && sourceConfig.locationSlug) ||
    (source === 'islamiska_forbundet' && isIslamiskaConfig(sourceConfig) && sourceConfig.city)
  );

  return (
    <div className="space-y-6">
      {/* Source cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SOURCES.map((s) => {
          const active = source === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSourceChange(s.id)}
              className={cn(
                'relative flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
              )}
            >
              {active && (
                <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              {s.id === 'manual' ? (
                <Pen className="h-5 w-5 text-muted-foreground mb-1" />
              ) : (
                <div className="h-5 w-5 mb-1 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {s.id === 'vaktija_ba' ? 'BA' : s.id === 'vaktija_eu' ? 'EU' : 'SE'}
                </div>
              )}
              <span className="font-medium text-sm">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.description}</span>
            </button>
          );
        })}
      </div>

      {/* Config for selected source */}
      {source !== 'manual' && (
        <div className="rounded-lg border bg-muted/30 p-5 space-y-5">
          {source === 'vaktija_ba' && (
            <VaktijaBaConfig
              config={isVaktijaBaConfig(sourceConfig) ? sourceConfig : undefined}
              onChange={onSourceConfigChange}
            />
          )}

          {source === 'vaktija_eu' && (
            <VaktijaEuConfig
              config={isVaktijaEuConfig(sourceConfig) ? sourceConfig : undefined}
              onChange={onSourceConfigChange}
            />
          )}

          {source === 'islamiska_forbundet' && (
            <IslamiskaConfig
              config={isIslamiskaConfig(sourceConfig) ? sourceConfig : undefined}
              onChange={onSourceConfigChange}
            />
          )}

          <Button onClick={handleFetch} disabled={fetching || !canFetch} size="default">
            {fetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {fetching ? 'Fetching...' : 'Fetch Prayer Times'}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Vaktija.ba Config ---

function VaktijaBaConfig({
  config,
  onChange,
}: {
  config: VaktijaBaSourceConfig | undefined;
  onChange: (config: VaktijaBaSourceConfig) => void;
}) {
  const locationId = config?.locationId ?? 77;

  return (
    <div className="space-y-2">
      <Label>City</Label>
      <Select
        value={String(locationId)}
        onValueChange={(v) => {
          const loc = VAKTIJA_LOCATIONS.find((l) => l.id === Number(v));
          if (loc) onChange({ locationId: loc.id, locationName: loc.name });
        }}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VAKTIJA_LOCATIONS.map((loc) => (
            <SelectItem key={loc.id} value={String(loc.id)}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// --- Vaktija.eu Config ---

function VaktijaEuConfig({
  config,
  onChange,
}: {
  config: VaktijaEuSourceConfig | undefined;
  onChange: (config: VaktijaEuSourceConfig) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(config?.countryCode ?? '');

  const locations = useMemo(() => {
    if (!selectedCountry) return [];
    return VAKTIJA_EU_COUNTRIES.find((c) => c.code === selectedCountry)?.locations ?? [];
  }, [selectedCountry]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={selectedCountry}
          onValueChange={(code) => {
            setSelectedCountry(code);
            onChange({ countryCode: code, locationSlug: '', locationName: '' });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {VAKTIJA_EU_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCountry && locations.length > 0 && (
        <div className="space-y-2">
          <Label>City</Label>
          <Select
            value={config?.locationSlug ?? ''}
            onValueChange={(slug) => {
              const loc = locations.find((l) => l.slug === slug);
              if (loc) {
                onChange({
                  countryCode: selectedCountry,
                  locationSlug: loc.slug,
                  locationName: loc.name,
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.slug} value={loc.slug}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// --- Islamiska Förbundet Config ---

function IslamiskaConfig({
  config,
  onChange,
}: {
  config: IslamiskaForbundetSourceConfig | undefined;
  onChange: (config: IslamiskaForbundetSourceConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>City</Label>
      <Select
        value={config?.city ?? ''}
        onValueChange={(city) => onChange({ city })}
      >
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder="Select a city" />
        </SelectTrigger>
        <SelectContent>
          {ISLAMISKA_CITIES.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
