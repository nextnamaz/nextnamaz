'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { THEME_REGISTRY } from '@/components/display/themes';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerTimesMap } from '@/types/database';
import { setScreenPin } from '@/lib/actions';
import type { PrayerSourceInput } from '@/lib/actions';
import { PIN_RE } from '@/lib/screen-settings';
import { SourceWizard, sourceLabel } from './source-wizard';
import { LanguageTab } from './language-tab';
import { ThemePicker, ThemeSettingsForm } from './theme-settings-form';
import { sourceExplanation } from './settings-shared';
import type { FormState, ThemeConfigMap } from './settings-shared';

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
  const [sourceChosen, setSourceChosen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const currentStep = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const stepIndex = STEPS.indexOf(currentStep);
  const prevStep = STEPS[stepIndex - 1];
  const nextStep = STEPS[stepIndex + 1];
  const themeDef = THEME_REGISTRY[form.theme];

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
    setSourceChosen(true);
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
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-background">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <Logo size="xs" />
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length} · {currentStep.title}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {step === 'times' && !sourceChosen && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1.5">Where should the times come from?</h1>
              <p className="text-muted-foreground">
                Pick your city and we&apos;ll find the right source for its
                prayer times.
              </p>
            </div>
            <SourceWizard translations={form.displayText} onApply={applySource} />
          </>
        )}

        {step === 'times' && sourceChosen && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1.5">Check the times</h1>
              <p className="text-muted-foreground">
                {sourceExplanation(form.prayerSource)}
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">
                    {sourceLabel(form.prayerSource, form.sourceConfig)}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSourceChosen(false)}>
                    Change source
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {PRAYER_NAMES.map((prayer) => (
                    <div key={prayer} className="flex items-center justify-between py-2.5">
                      <span className="text-muted-foreground">
                        {form.displayText.prayers[prayer]}
                      </span>
                      <span className="text-lg font-semibold tabular-nums">
                        {form.times[prayer]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 'language' && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1.5">What language should the TV show?</h1>
              <p className="text-muted-foreground">
                Every word on the display can be changed later, too.
              </p>
            </div>
            <LanguageTab
              locale={form.locale}
              displayText={form.displayText}
              onLocaleChange={(locale) => setForm((prev) => ({ ...prev, locale }))}
              onDisplayTextChange={(displayText) => setForm((prev) => ({ ...prev, displayText }))}
            />
          </>
        )}

        {step === 'theme' && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1.5">Pick a look for your display</h1>
              <p className="text-muted-foreground">
                All themes work in landscape and portrait, on any screen size.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
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
                {themeDef && themeDef.fields.length > 0 && (
                  <div className="pt-4 border-t">
                    <ThemeSettingsForm
                      fields={themeDef.fields}
                      config={form.themeConfig}
                      onChange={(config: ThemeConfigMap) =>
                        setForm((prev) => ({ ...prev, themeConfig: config }))
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {step === 'pin' && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1.5">Lock it with a PIN?</h1>
              <p className="text-muted-foreground">
                Optional. Anyone who scans the code on the TV can open these
                settings; with a PIN they also need a number only you know.
                Leave it empty to skip.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label htmlFor="setup-pin">PIN (4 to 8 digits)</Label>
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
                  placeholder="Leave empty for no PIN"
                  className="max-w-xs text-lg tracking-[0.3em] tabular-nums"
                />
                {pinError && (
                  <p role="alert" className="text-sm text-destructive">
                    {pinError}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  You can add, change or remove it later under Lock in the settings.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step navigation */}
        {(sourceChosen || step !== 'times') && (
          <div className="flex items-center justify-between pt-2">
            {prevStep ? (
              <Button
                variant="ghost"
                onClick={() => setStep(prevStep.id)}
              >
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
            ) : (
              <span />
            )}
            {nextStep ? (
              <Button size="lg" onClick={() => setStep(nextStep.id)}>
                Continue <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              /* Last step saves the screen. */
              <Button size="lg" onClick={finish} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : null}
                Turn on the display
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
