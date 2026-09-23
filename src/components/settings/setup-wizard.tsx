'use client';

import { useState } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { THEME_REGISTRY } from '@/components/display/themes';
import type { PrayerTimesMap } from '@/types/database';
import { setScreenPin } from '@/lib/actions';
import type { PrayerSourceInput } from '@/lib/actions';
import { PIN_RE } from '@/lib/screen-settings';
import { SourceWizard } from './source-wizard';
import { LanguagePicker } from './language-tab';
import { PinArt } from './setup-art';
import { TvFrame } from '@/components/landing/tv-frame';
import { DemoDisplay } from '@/components/landing/demo-display';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { ThemePicker } from './theme-settings-form';
import type { FormState } from './settings-shared';

/** Each step slides in from the side it was reached from and fades up. Still under reduced motion. */
const SLIDE = `
@media (prefers-reduced-motion: no-preference) {
  .wiz-step { animation: wiz-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .wiz-step > * { animation: wiz-rise 560ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .wiz-step > :nth-child(2) { animation-delay: 60ms; }
  .wiz-step > :nth-child(3) { animation-delay: 120ms; }
  .wiz-step > :nth-child(n + 4) { animation-delay: 170ms; }
}
@keyframes wiz-in { from { opacity: 0; transform: translateX(calc(var(--wiz-dir, 1) * 36px)); } }
@keyframes wiz-rise { from { opacity: 0; transform: translateY(10px); } }
`;

const STEPS = [
  { id: 'times', title: 'Prayer times' },
  { id: 'language', title: 'Language' },
  { id: 'theme', title: 'Theme' },
  { id: 'pin', title: 'PIN' },
] as const;

type StepId = (typeof STEPS)[number]['id'] | 'done';

interface SetupWizardProps {
  screenId: string;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  saving: boolean;
  /** Persists everything; resolves true when the screen saved. */
  onFinish: () => Promise<boolean>;
  /** Leave the wizard for the regular settings view. */
  onExit: () => void;
}

export function SetupWizard({ screenId, form, setForm, saving, onFinish, onExit }: SetupWizardProps) {
  const [step, setStep] = useState<StepId>('times');
  /** Which way the last move went, so the next step slides in from that side. */
  const [dir, setDir] = useState<1 | -1>(1);
  const go = (id: StepId, way: 1 | -1) => {
    setDir(way);
    setStep(id);
  };
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const currentStep = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const stepIndex = STEPS.indexOf(currentStep);
  const prevStep = STEPS[stepIndex - 1];
  const nextStep = STEPS[stepIndex + 1];

  const applySource = (
    source: PrayerSourceInput,
    config: Record<string, unknown>,
    times: PrayerTimesMap | null
  ) => {
    setForm((prev) => ({
      ...prev,
      prayerSource: source,
      sourceConfig: config,
      times: times ?? prev.times,
    }));
    // The times were just shown beside the source; no need to show them again.
    go('language', 1);
  };

  const finish = async () => {
    if (pin && !PIN_RE.test(pin)) {
      setPinError('A PIN is 4 to 8 digits');
      return;
    }
    if (!(await onFinish())) return;
    // The screen is saved; the PIN is separate and optional, so a failure
    // here leaves a working, unlocked screen rather than a broken one.
    if (pin) {
      const result = await setScreenPin(screenId, pin);
      if (!result.ok) toast.error(result.error);
    }
    go('done', 1);
  };

  if (step === 'done') {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-4">
            <span className="inline-flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground">
              <Check className="size-6" />
            </span>
            <h1 className="text-2xl font-bold">Your screen is live</h1>
            <p className="text-muted-foreground leading-relaxed">
              The TV has switched to your prayer display. Keep this page&apos;s
              link. It&apos;s the remote control for that screen, from any
              phone or computer.
            </p>
            <Button onClick={onExit} className="mt-2">
              Open the settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
        <Logo size="xs" />
        {/* Where you are: one dot per step, the current one drawn out. */}
        <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}: ${currentStep.title}`}>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? 'w-6 bg-primary' : i < stepIndex ? 'w-1.5 bg-primary' : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>
      </header>

      <style>{SLIDE}</style>
      <div className="mx-auto max-w-lg space-y-6 px-4 pt-4 pb-8">
        <div key={step} className="wiz-step space-y-6" style={{ '--wiz-dir': dir } as CSSProperties}>
        {step === 'times' && <SourceWizard translations={form.displayText} onApply={applySource} />}

        {step === 'language' && (
          <>
            <div>
              <h1 className="font-heading text-[26px] leading-tight font-semibold tracking-[-0.025em] text-balance mb-2">Which language should the TV show?</h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                The prayer names and labels change; the times stay the same. You can reword anything later in the settings.
              </p>
            </div>
            <LanguagePicker
              value={form.locale}
              onChange={(locale) => setForm((prev) => ({ ...prev, locale, displayText: DEFAULT_TRANSLATIONS[locale] }))}
            />
            {/* The screen as it will read, in the language just picked. */}
            <div className="mx-auto w-full max-w-md pt-2">
              <TvFrame>
                <DemoDisplay locale={resolveDisplayLocale(form.locale)} />
              </TvFrame>
            </div>
          </>
        )}

        {step === 'theme' && (
          <>
            <div>
              <h1 className="font-heading text-[26px] leading-tight font-semibold tracking-[-0.025em] text-balance mb-2">Pick a look for your display</h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Every look works in landscape and portrait. Colours and the line at the bottom can be changed later in the settings.
              </p>
            </div>
            <div>
                <ThemePicker
                  value={form.theme}
                  config={form.themeConfig}
                  onChange={(themeId: string) => {
                    const def = THEME_REGISTRY[themeId];
                    setForm((prev) => ({
                      ...prev,
                      theme: themeId,
                      themeConfig: def ? { ...def.defaultConfig } : {},
                    }));
                  }}
                />
            </div>
          </>
        )}

        {step === 'pin' && (
          <>
            <div>
              <span className="inline-block rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Optional
              </span>
              <h1 className="mt-3 mb-2 font-heading text-[26px] leading-tight font-semibold tracking-[-0.025em] text-balance">
                Lock the settings with a PIN?
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Anyone who scans the code on the TV can open these settings. With a PIN they also need a number only you know.
              </p>
            </div>

            <PinArt />

            <div className="space-y-2">
              <Label htmlFor="setup-pin">PIN, 4 to 8 digits</Label>
              <Input
                id="setup-pin"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setPinError(null);
                }}
                placeholder="No PIN"
                className="h-14 rounded-2xl bg-card text-center text-2xl tracking-[0.4em] tabular-nums placeholder:text-base placeholder:tracking-normal md:text-2xl"
              />
              {pinError && (
                <p role="alert" className="text-sm text-destructive">
                  {pinError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Not sure? Skip it. You can add a PIN any time in the settings.
              </p>
            </div>
          </>
        )}

        </div>

        {/* Step navigation */}
        {step !== 'times' && (
          <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 bg-linear-to-t from-background via-background to-background/0 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {prevStep ? (
              <Button
                variant="ghost"
                className="shrink-0 px-3"
                onClick={() => go(prevStep.id, -1)}
              >
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
            ) : (
              <span />
            )}
            {nextStep ? (
              <Button size="lg" className="h-12 rounded-full px-7 text-[15px]" onClick={() => go(nextStep.id, 1)}>
                Continue <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              /* Last step saves the screen. */
              <Button size="lg" className="h-12 min-w-0 rounded-full px-5 text-[15px] sm:px-7" onClick={finish} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : null}
                <span className="truncate">{pin ? 'Lock and turn on the TV' : 'Skip and turn on the TV'}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
