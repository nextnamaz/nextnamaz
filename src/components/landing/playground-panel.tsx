'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { LANGUAGES } from '@/lib/locale/presets';
import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';

type DisplayCopy = LandingCopy['display'];
export type ThemeChoice = keyof DisplayCopy['themes'];
export type ModeChoice = keyof DisplayCopy['modes'];
export type SchemeChoice = keyof DisplayCopy['schemes'];
export type AccentChoice = keyof DisplayCopy['accents'];

/** Everything the playground's screen shows, as the phone's settings would save it. */
export interface PlaygroundSettings {
  language: SupportedLocale;
  theme: ThemeChoice;
  mode: ModeChoice;
  scheme: SchemeChoice;
  accent: AccentChoice;
  /** Default's footer text, Night's verse. */
  line: string;
  blackout: boolean;
}

/** The control the ghost demo is changing, lit so the visitor sees what did it. */
export type GhostField = 'language' | 'theme' | 'mode' | 'reset';

export const LINE_MAX = 80;

const THEMES: ThemeChoice[] = ['default', 'night'];
const MODES: ModeChoice[] = ['light', 'dark'];

/** Each scheme's next-prayer panel, the biggest block of it on the screen (themes/default.tsx PALETTES). */
const SCHEME_SWATCH: Record<SchemeChoice, string> = {
  classic: '#64748b',
  ocean: '#0e7490',
  emerald: '#047857',
  royal: '#4338ca',
  crimson: '#be123c',
  midnight: '#1e3a5f',
};

/** Night's accent lines (themes/night.tsx ACCENTS). */
const ACCENT_SWATCH: Record<AccentChoice, string> = {
  amber: '#E8A817',
  mint: '#3FE0A2',
  azure: '#4EA8FF',
};

const SCHEMES = Object.keys(SCHEME_SWATCH) as SchemeChoice[];
const ACCENTS = Object.keys(ACCENT_SWATCH) as AccentChoice[];

/** A soft gold halo behind a control while the ghost demo changes it. Opacity only. */
const GHOST_HALO =
  'relative isolate before:pointer-events-none before:absolute before:-inset-2 before:-z-10 before:rounded-2xl before:bg-primary/10 before:ring-1 before:ring-primary/45 before:opacity-0 before:transition-opacity before:duration-500 data-[ghost=true]:before:opacity-100 motion-reduce:before:transition-none';

const FOCUS_RING = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground';

const LABEL = 'text-[13px] leading-none font-medium text-foreground';

interface Choice<T extends string> {
  value: T;
  label: ReactNode;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns: 2 | 3;
  ghost?: boolean;
}

/** Pills over native radios: arrow keys move the choice, as in any radio group. */
function ChoiceGroup<T extends string>({ label, choices, value, onChange, columns, ghost = false }: ChoiceGroupProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} data-ghost={ghost} className={GHOST_HALO}>
      <p id={`${id}-label`} className={LABEL}>
        {label}
      </p>
      <div className={cn('mt-2.5 grid gap-1.5', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {choices.map((choice) => (
          <label key={choice.value} className="block cursor-pointer">
            <input
              type="radio"
              name={id}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-9 items-center justify-center truncate rounded-full border border-border bg-background px-2 text-[13px] text-foreground hover:border-foreground/30',
                'peer-checked:border-primary peer-checked:bg-primary peer-checked:font-semibold peer-checked:text-primary-foreground',
                FOCUS_RING
              )}
            >
              {choice.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface SwatchGroupProps<T extends string> {
  label: string;
  swatches: T[];
  colours: Record<T, string>;
  names: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}

/** Colour dots over native radios. The chosen one's name sits by the label; every dot carries its own. */
function SwatchGroup<T extends string>({ label, swatches, colours, names, value, onChange }: SwatchGroupProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={`${id}-label`} className={LABEL}>
          {label}
        </p>
        <span aria-hidden className="-my-1 min-w-0 truncate py-1 text-[13px] leading-none text-muted-foreground">
          {names[value]}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {swatches.map((swatch) => (
          <label key={swatch} title={names[swatch]} className="relative grid size-10 cursor-pointer place-items-center">
            <input
              type="radio"
              name={id}
              value={swatch}
              checked={swatch === value}
              onChange={() => onChange(swatch)}
              className="peer sr-only"
            />
            <span
              className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
              style={{ backgroundColor: colours[swatch] }}
            />
            {/* The chosen one: a gold ring, clear of the dot. */}
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0.5 rounded-full border-2 border-primary opacity-0 peer-checked:opacity-100',
                FOCUS_RING
              )}
            />
            <span className="sr-only">{names[swatch]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface PlaygroundPanelProps {
  t: DisplayCopy;
  settings: PlaygroundSettings;
  onChange: (change: Partial<PlaygroundSettings>) => void;
  onReset: () => void;
  ghost: GhostField | null;
  /** Any real touch, key or focus in the panel: the ghost demo stops for good. */
  onInteract: () => void;
  className?: string;
}

/**
 * The playground's settings: the same choices as the Theme and Language tabs
 * on the phone, drawn like its cards. Every one is a real form control, and
 * every change reaches the screen at once.
 */
export function PlaygroundPanel({ t, settings, onChange, onReset, ghost, onInteract, className }: PlaygroundPanelProps) {
  const id = useId();
  const c = t.controls;
  const isDefault = settings.theme === 'default';

  const languages: Choice<SupportedLocale>[] = LANGUAGES.map((lang) => ({
    value: lang.code,
    label: (
      <span lang={lang.code} dir={lang.rtl ? 'rtl' : undefined} className="truncate">
        {lang.nativeName}
      </span>
    ),
  }));

  return (
    <div
      aria-labelledby={`${id}-heading`}
      role="group"
      onPointerDown={onInteract}
      onKeyDown={onInteract}
      onFocus={onInteract}
      className={cn(
        'rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(38,24,10,0.05),0_18px_40px_-28px_rgba(38,24,10,0.3)] xl:p-6',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${id}-heading`} className="font-heading text-[17px] font-semibold tracking-[-0.01em]">
          {c.heading}
        </h3>
        <button
          type="button"
          onClick={onReset}
          data-ghost={ghost === 'reset'}
          className={cn(
            GHOST_HALO,
            'before:-inset-1 before:rounded-full',
            '-me-2 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
          )}
        >
          <RotateCcw aria-hidden className="size-3.5 rtl:-scale-x-100" />
          {c.reset}
        </button>
      </div>

      {/* One column beside the set. Under it on a tablet, two across: the settings for the
          whole screen on one side, the theme and its own options on the other. The options
          come last, so the room kept for the taller set falls at the foot of the card. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-x-8 lg:grid-cols-1">
        <div className="grid content-start gap-5">
          <ChoiceGroup
            label={c.language}
            choices={languages}
            value={settings.language}
            onChange={(language) => onChange({ language })}
            columns={3}
            ghost={ghost === 'language'}
          />

          <div>
            <label htmlFor={`${id}-line`} className={cn(LABEL, 'block')}>
              {c.line}
            </label>
            <input
              id={`${id}-line`}
              type="text"
              dir="auto"
              value={settings.line}
              maxLength={LINE_MAX}
              placeholder={c.linePlaceholder}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onChange({ line: e.target.value })}
              className="mt-2.5 h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 sm:text-[15px]"
            />
          </div>

          <div role="group" aria-labelledby={`${id}-prayer`}>
            <p id={`${id}-prayer`} className={LABEL}>
              {c.prayer}
            </p>
            <div className="mt-2 flex min-h-9 items-center justify-between gap-4">
              <label htmlFor={`${id}-blackout`} className="cursor-pointer text-[15px] text-muted-foreground">
                {c.prayerToggle}
              </label>
              <button
                id={`${id}-blackout`}
                type="button"
                role="switch"
                aria-checked={settings.blackout}
                onClick={() => onChange({ blackout: !settings.blackout })}
                className={cn(
                  'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]',
                  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
                  settings.blackout ? 'bg-primary' : 'bg-[#C9C5BB]'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-200 motion-reduce:transition-none',
                    settings.blackout && 'translate-x-4 rtl:-translate-x-4'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-5">
          <ChoiceGroup
            label={c.theme}
            choices={THEMES.map((value) => ({ value, label: t.themes[value] }))}
            value={settings.theme}
            onChange={(theme) => onChange({ theme })}
            columns={2}
            ghost={ghost === 'theme'}
          />

          {/* Each theme's own options share one cell, the taller one sizing it, so the
              panel keeps its height when the theme changes. The hidden set is invisible,
              which also takes it out of the tab order and the accessibility tree. */}
          <div className="grid">
            <div
              className={cn(
                'col-start-1 row-start-1 grid content-start gap-5 transition-[opacity,visibility] duration-200 motion-reduce:transition-none',
                isDefault ? 'visible opacity-100' : 'invisible opacity-0'
              )}
            >
              <ChoiceGroup
                label={c.mode}
                choices={MODES.map((value) => ({ value, label: t.modes[value] }))}
                value={settings.mode}
                onChange={(mode) => onChange({ mode })}
                columns={2}
                ghost={ghost === 'mode'}
              />
              <SwatchGroup
                label={c.colours}
                swatches={SCHEMES}
                colours={SCHEME_SWATCH}
                names={t.schemes}
                value={settings.scheme}
                onChange={(scheme) => onChange({ scheme })}
              />
            </div>
            <div
              className={cn(
                'col-start-1 row-start-1 transition-[opacity,visibility] duration-200 motion-reduce:transition-none',
                isDefault ? 'invisible opacity-0' : 'visible opacity-100'
              )}
            >
              <SwatchGroup
                label={c.accent}
                swatches={ACCENTS}
                colours={ACCENT_SWATCH}
                names={t.accents}
                value={settings.accent}
                onChange={(accent) => onChange({ accent })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
