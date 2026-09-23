'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ChevronRight, LocateFixed, Search, Loader2 } from 'lucide-react';
import { SourceLogo } from './setup-art';
import { MapView } from './map-view';
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
import { ALADHAN_METHODS, defaultAlAdhanMethod } from '@/lib/prayer-sources/aladhan';
import { Button } from '@/components/ui/button';
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
  defaultMadhab,
  locateMe,
  normalize,
  rankSources,
  searchCity,
  sourceLabel,
} from '@/lib/prayer-sources/match';
import type { GeoPlace, WizardSource } from '@/lib/prayer-sources/match';

export { sourceLabel };
export type { GeoPlace };

type Madhab = 'shafi' | 'hanafi';

/** A country's flag, from its two-letter code. */
function flagOf(code: string): string {
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';
}

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
  aladhan: {
    title: 'AlAdhan',
    subtitle: 'Worldwide service with the conventions of 20+ national authorities.',
  },
  adhan: {
    title: 'Calculate the times',
    subtitle: 'No external source. Computed astronomically for your exact location.',
  },
};

/** The part of a calculated source's config that comes from the place itself. */
function placeConfig(place: GeoPlace, madhab: Madhab) {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    madhab,
    timezone: place.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    locationName: place.name,
  };
}

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
  const [alMethod, setAlMethod] = useState<number>(3);
  const [madhab, setMadhab] = useState<Madhab>('shafi');

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
    setAlMethod(defaultAlAdhanMethod(p.countryCode));
    setMadhab(defaultMadhab(p.countryCode));
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

  // Suggest cities while typing. Two characters is the geocoder's minimum.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setGeoError(false);
      try {
        const found = await searchCity(q);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setGeoError(true);
      }
      if (!cancelled) setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) setResults([]);
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
      case 'aladhan':
        return { ...placeConfig(place, madhab), method: alMethod };
      case 'adhan':
        return { ...placeConfig(place, madhab), method };
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
        case 'aladhan':
          return { ...placeConfig(place, madhab), method: alMethod };
        case 'adhan':
          return { ...placeConfig(place, madhab), method };
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
  }, [step, selected, place, baId, euSlug, ifCity, method, alMethod, madhab]);

  const apply = () => {
    if (!selected || !preview) return;
    const config = buildConfig(selected);
    if (config) onApply(selected, config, preview);
  };

  // Every option in view: the recommended one first, then the rest, with the
  // calculation, which needs no outside source, last.
  const shown = ranked.length > 1
    ? [ranked[0] as WizardSource, ...ranked.slice(1).filter((x) => x !== 'adhan'), ...ranked.slice(1).filter((x) => x === 'adhan')]
    : ranked;

  const noResults = !searching && !geoError && query.trim().length >= 3 && results.length === 0;

  const heading = 'font-heading text-[26px] leading-tight font-semibold tracking-[-0.025em] text-balance';

  return (
    <div className="space-y-5 sm:space-y-6">
      {step === 'location' && (
        <div key="location" className="wiz-step space-y-6" style={{ '--wiz-dir': -1 } as CSSProperties}>
          <div>
            <h2 className={heading}>Where is this screen?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              We&apos;ll find the right prayer times for that place.
            </p>
          </div>

          {/* The first match while typing, pinned; before that, Göteborg, where NextNamaz is made. */}
          {results[0] ? (
            <MapView lat={results[0].latitude} lon={results[0].longitude} zoom={12} pinned />
          ) : (
            <MapView lat={57.7089} lon={11.9746} zoom={11.5} pinned={false} />
          )}

          <div>
            <Button size="lg" className="h-14 w-full rounded-full text-base" onClick={handleLocate} disabled={locating}>
              {locating ? <Loader2 className="mr-2 size-5 animate-spin" /> : <LocateFixed className="mr-2 size-5" />}
              Use my location
            </Button>
            <p className="mt-2 text-center text-sm text-muted-foreground">Best when you are at the mosque. Your phone asks first.</p>
            {geoError && (
              <p className="mt-2 text-center text-sm text-destructive">Couldn&apos;t get your location. Type the city below instead.</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or type the city
            <span className="h-px flex-1 bg-border" />
          </div>

          <div>
            <div className="relative">
              <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-14 rounded-2xl bg-card pr-11 pl-12 text-[17px] md:text-[17px]"
                placeholder="Göteborg, Sarajevo, Berlin…"
                // On a phone the keyboard takes half the screen: bring the field to the top so its results show.
                onFocus={(e) => {
                  const el = e.currentTarget;
                  if (window.matchMedia('(max-width: 640px)').matches) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 250);
                }}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
              {searching && (
                <Loader2 className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {results.map((r) => (
                  <li key={`${r.name}-${r.latitude}-${r.longitude}`}>
                    <button
                      type="button"
                      onClick={() => choosePlace(r)}
                      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span className="text-2xl leading-none" aria-hidden>{flagOf(r.countryCode)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{r.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">{r.region}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {noResults && <p className="mt-3 px-1 text-sm text-muted-foreground">No city found. Try another spelling.</p>}
          </div>
        </div>
      )}

      {step === 'source' && place && (
        <div key="source" className="wiz-step space-y-6" style={{ '--wiz-dir': 1 } as CSSProperties}>
          <div>
            <h2 className={heading}>Where should the times come from?</h2>
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted-foreground">
              <span aria-hidden>{flagOf(place.countryCode)}</span>
              <span className="truncate">{place.name}{place.region ? `, ${place.region}` : ''}</span>
              <button type="button" className="shrink-0 font-medium text-foreground underline underline-offset-4" onClick={() => setStep('location')}>
                Change
              </button>
            </p>
          </div>

          <div role="radiogroup" aria-label="Prayer time source" className="space-y-2.5">
            {shown.map((source, i) => {
              const meta = SOURCE_META[source];
              const active = selected === source;
              const calculated = source === 'adhan' || source === 'aladhan';
              return (
                <div
                  key={source}
                  className={cn(
                    'rounded-2xl border bg-card transition-[border-color,box-shadow]',
                    active ? 'border-primary shadow-[0_0_0_1px_var(--color-primary),0_10px_30px_-18px_rgba(184,122,8,0.6)]' : 'border-border hover:border-primary/50'
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(source)}
                    className="flex w-full items-center gap-3.5 p-4 text-left"
                  >
                    <SourceLogo source={source} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[17px] font-semibold">{meta.title}</span>
                        {i === 0 && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-[#8A6206]">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{meta.subtitle}</span>
                    </span>
                    {active && (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    )}
                  </button>

                  {active && (
                    <div className="space-y-3 px-4 pb-4">
                      {source === 'vaktija_ba' && baId !== null && (
                        <Select value={String(baId)} onValueChange={(v) => setBaId(Number(v))}>
                          <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {VAKTIJA_LOCATIONS.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {source === 'vaktija_eu' && euCountry && euSlug && (
                        <Select value={euSlug} onValueChange={setEuSlug}>
                          <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {euCountry.locations.map((l) => (
                              <SelectItem key={l.slug} value={l.slug}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {source === 'islamiska_forbundet' && (
                        <Select value={ifCity} onValueChange={setIfCity}>
                          <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ISLAMISKA_CITIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {source === 'aladhan' && (
                        <Select value={String(alMethod)} onValueChange={(v) => setAlMethod(Number(v))}>
                          <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALADHAN_METHODS.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.name} · {m.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {source === 'adhan' && (
                        <Select value={method} onValueChange={(v) => setMethod(v as AdhanCalculationMethod)}>
                          <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CALCULATION_METHODS.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} · {m.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {calculated && (
                        <Select value={madhab} onValueChange={(v) => setMadhab(v as Madhab)}>
                          <SelectTrigger className="h-11 w-full rounded-xl" aria-label="Asr"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shafi">Asr · Standard (Shafi&apos;i, Maliki, Hanbali)</SelectItem>
                            <SelectItem value="hanafi">Asr · Hanafi (later)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {/* Today's times from this source, right where it's chosen. */}
                      <div className="min-h-[5.5rem] rounded-xl bg-secondary/60 p-3">
                        <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Today</p>
                        {previewLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> Fetching today&apos;s times…
                          </div>
                        )}
                        {previewError && (
                          <p className="text-sm text-destructive">Couldn&apos;t fetch times from this source right now.</p>
                        )}
                        {preview && (
                          <div className="grid grid-cols-3 gap-y-2.5 text-center">
                            {PRAYER_NAMES.map((p) => (
                              <div key={p}>
                                <div className="truncate text-xs text-muted-foreground">{translations.prayers[p]}</div>
                                <div className="text-[17px] font-semibold tabular-nums">{preview[p]}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* The one way on, kept at the bottom of the screen on a phone. */}
          <div className="sticky bottom-0 -mx-4 bg-linear-to-t from-background via-background to-background/0 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button size="lg" className="h-12 w-full rounded-full text-[15px]" onClick={apply} disabled={!preview}>
              Use these times
            </Button>
          </div>
        </div>
      )}

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
