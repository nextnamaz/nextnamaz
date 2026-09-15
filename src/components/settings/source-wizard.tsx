'use client';

import { useEffect, useState } from 'react';
import { LocateFixed, MapPin, Search, Loader2 } from 'lucide-react';
import { fetchSourceTimes } from '@/lib/actions';
import type { PrayerSourceInput } from '@/lib/actions';
import type { PrayerTimesMap } from '@/types/database';
import type { AdhanCalculationMethod } from '@/types/prayer-config';
import { PRAYER_NAMES } from '@/types/prayer';
import type { DisplayTextConfig } from '@/types/locale';
import { VAKTIJA_LOCATIONS } from '@/lib/prayer-sources/vaktija-ba';
import { VAKTIJA_EU_COUNTRIES } from '@/lib/prayer-sources/vaktija-eu';
import { ISLAMISKA_CITIES } from '@/lib/prayer-sources/islamiska-forbundet';
import { CALCULATION_METHODS } from '@/lib/prayer-sources/adhan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


import {
  bestMatch,
  locateMe,
  normalize,
  rankSources,
  searchCity,
  sourceLabel,
} from '@/lib/prayer-sources/match';
import type { GeoPlace, WizardSource } from '@/lib/prayer-sources/match';

export { sourceLabel };
export type { GeoPlace };

const SOURCE_META: Record<WizardSource, { title: string; subtitle: string }> = {
  vaktija_ba: {
    title: 'Vaktija.ba',
    subtitle: 'Official takvim of the Islamic Community in Bosnia',
  },
  vaktija_eu: {
    title: 'Vaktija.eu',
    subtitle: 'Bosnian takvim for cities across Europe',
  },
  islamiska_forbundet: {
    title: 'Islamiska Förbundet',
    subtitle: 'Official Swedish prayer timetable',
  },
  adhan: {
    title: 'Calculate the times',
    subtitle: 'No external source. Computed astronomically for your exact location.',
  },
};

interface SourceWizardProps {
  translations: DisplayTextConfig;
  onApply: (
    source: PrayerSourceInput,
    config: Record<string, unknown>,
    times: PrayerTimesMap | null
  ) => void;
  onCancel?: () => void;
}

export function SourceWizard({ translations, onApply, onCancel }: SourceWizardProps) {
  const [step, setStep] = useState<'location' | 'source'>('location');
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);

  const [ranked, setRanked] = useState<WizardSource[]>([]);
  const [selected, setSelected] = useState<WizardSource | null>(null);
  const [baId, setBaId] = useState<number | null>(null);
  const [euSlug, setEuSlug] = useState<string | null>(null);
  const [ifCity, setIfCity] = useState<string>('Stockholm');
  const [method, setMethod] = useState<AdhanCalculationMethod>('MuslimWorldLeague');

  const [preview, setPreview] = useState<PrayerTimesMap | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const euCountry = place ? VAKTIJA_EU_COUNTRIES.find((c) => c.code === place.countryCode) : undefined;

  const choosePlace = (p: GeoPlace) => {
    setPlace(p);
    setBaId(bestMatch(VAKTIJA_LOCATIONS, (l) => l.name, p.name)?.id
      ?? VAKTIJA_LOCATIONS.find((l) => normalize(l.name) === 'sarajevo')?.id
      ?? VAKTIJA_LOCATIONS[0]?.id
      ?? null);
    const country = VAKTIJA_EU_COUNTRIES.find((c) => c.code === p.countryCode);
    setEuSlug(country
      ? (bestMatch(country.locations, (l) => l.name, p.name)?.slug ?? country.locations[0]?.slug ?? null)
      : null);
    setIfCity(bestMatch(ISLAMISKA_CITIES, (c) => c, p.name) ?? 'Stockholm');
    const order = rankSources(p);
    setRanked(order);
    // Preselect the recommended source; nothing to preselect if none fit.
    setSelected(order[0] ?? null);
    setStep('source');
  };

  const handleLocate = async () => {
    setLocating(true);
    setGeoError(false);
    try {
      choosePlace(await locateMe());
    } catch {
      setGeoError(true);
    }
    setLocating(false);
  };

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setGeoError(false);
    try {
      setResults(await searchCity(query.trim()));
    } catch {
      setGeoError(true);
    }
    setSearching(false);
  };

  const buildConfig = (source: WizardSource): Record<string, unknown> | null => {
    if (!place) return null;
    switch (source) {
      case 'vaktija_ba': {
        const loc = VAKTIJA_LOCATIONS.find((l) => l.id === baId);
        return loc ? { locationId: loc.id, locationName: loc.name } : null;
      }
      case 'vaktija_eu': {
        const loc = euCountry?.locations.find((l) => l.slug === euSlug);
        return euCountry && loc
          ? { countryCode: euCountry.code, locationSlug: loc.slug, locationName: loc.name }
          : null;
      }
      case 'islamiska_forbundet':
        return { city: ifCity };
      case 'adhan':
        return {
          latitude: place.latitude,
          longitude: place.longitude,
          method,
          madhab: 'shafi',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locationName: place.name,
        };
    }
  };

  // Auto-preview today's times whenever the selection or its config changes.
  useEffect(() => {
    if (step !== 'source' || !selected || !place) return;
    const config = (() => {
      switch (selected) {
        case 'vaktija_ba': {
          const loc = VAKTIJA_LOCATIONS.find((l) => l.id === baId);
          return loc ? { locationId: loc.id, locationName: loc.name } : null;
        }
        case 'vaktija_eu': {
          const country = VAKTIJA_EU_COUNTRIES.find((c) => c.code === place.countryCode);
          const loc = country?.locations.find((l) => l.slug === euSlug);
          return country && loc
            ? { countryCode: country.code, locationSlug: loc.slug, locationName: loc.name }
            : null;
        }
        case 'islamiska_forbundet':
          return { city: ifCity };
        case 'adhan':
          return {
            latitude: place.latitude,
            longitude: place.longitude,
            method,
            madhab: 'shafi' as const,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locationName: place.name,
          };
      }
    })();
    if (!config) return;

    let cancelled = false;
    // Debounced so flipping through options doesn't hammer the providers.
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(false);
      setPreview(null);
      try {
        const res = await fetchSourceTimes(selected, config);
        if (cancelled) return;
        if (res.ok) setPreview(res.times);
        else setPreviewError(true);
      } catch {
        if (!cancelled) setPreviewError(true);
      }
      if (!cancelled) setPreviewLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, selected, place, baId, euSlug, ifCity, method]);

  const apply = () => {
    if (!selected || !preview) return;
    const config = buildConfig(selected);
    if (config) onApply(selected, config, preview);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === 'location' ? 'Where is this screen?' : 'Choose a source'}
        </CardTitle>
        {step === 'location' ? (
          <CardDescription>
            The location decides which prayer time sources fit best.
          </CardDescription>
        ) : (
          place && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {place.name}
              {place.region ? `, ${place.region}` : ''}
              <button type="button" className="underline ml-1" onClick={() => setStep('location')}>
                change
              </button>
            </CardDescription>
          )
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'location' && (
          <>
            <Button className="w-full h-12" onClick={handleLocate} disabled={locating}>
              {locating
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <LocateFixed className="w-4 h-4 mr-2" />}
              Use my location
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or search
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your city…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch} disabled={searching}>
                {searching
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((r) => (
                  <button
                    key={`${r.name}-${r.latitude}-${r.longitude}`}
                    type="button"
                    onClick={() => choosePlace(r)}
                    className="w-full flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:border-primary/50 hover:bg-muted transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground truncate">{r.region}</span>
                  </button>
                ))}
              </div>
            )}

            {geoError && (
              <p className="text-sm text-destructive">
                Couldn&apos;t get a location. Try typing your city instead.
              </p>
            )}
          </>
        )}

        {step === 'source' && place && (
          <>
            <div className="space-y-2">
              {ranked.map((source, i) => {
                const meta = SOURCE_META[source];
                const active = selected === source;
                return (
                  <div
                    key={source}
                    className={cn(
                      'rounded-md border transition-colors',
                      active ? 'border-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(source)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium">{meta.title}</span>
                        {i === 0 && (
                          <span className="text-[10px] font-medium uppercase tracking-wider rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
                    </button>

                    {active && (
                      <div className="px-3 pb-3">
                        {source === 'vaktija_ba' && baId !== null && (
                          <Select value={String(baId)} onValueChange={(v) => setBaId(Number(v))}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VAKTIJA_LOCATIONS.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {source === 'vaktija_eu' && euCountry && euSlug && (
                          <Select value={euSlug} onValueChange={setEuSlug}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {euCountry.locations.map((l) => (
                                <SelectItem key={l.slug} value={l.slug}>{l.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {source === 'islamiska_forbundet' && (
                          <Select value={ifCity} onValueChange={setIfCity}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ISLAMISKA_CITIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {source === 'adhan' && (
                          <Select value={method} onValueChange={(v) => setMethod(v as AdhanCalculationMethod)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CALCULATION_METHODS.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} · {m.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Today's times from this source, right where it's chosen */}
                        <div className="rounded-lg bg-background/80 border p-3 mt-3 min-h-16">
                          {previewLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" /> Fetching today&apos;s times…
                            </div>
                          )}
                          {previewError && (
                            <p className="text-sm text-destructive">
                              Couldn&apos;t fetch times from this source right now.
                            </p>
                          )}
                          {preview && (
                            <div className="grid grid-cols-3 gap-2 text-center">
                              {PRAYER_NAMES.map((p) => (
                                <div key={p}>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {translations.prayers[p]}
                                  </div>
                                  <div className="text-sm font-semibold tabular-nums">{preview[p]}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button className="w-full mt-3" onClick={apply} disabled={!preview}>
                          Use this source
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {onCancel && (
          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
