'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Monitor, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import type {
  PairingMosqueResult,
  PairingScreenResult,
  PairingBroadcastPayload,
} from '@/types/pairing';

interface ScreenSelectorProps {
  sessionId: string;
}

type Step = 'loading' | 'pick-mosque' | 'screens' | 'done';

export function ScreenSelector({ sessionId }: ScreenSelectorProps) {
  const [step, setStep] = useState<Step>('loading');
  const [mosques, setMosques] = useState<PairingMosqueResult[]>([]);
  const [selectedMosque, setSelectedMosque] = useState<PairingMosqueResult | null>(null);
  const [screens, setScreens] = useState<PairingScreenResult[]>([]);
  const [sending, setSending] = useState(false);
  const [pairedScreenName, setPairedScreenName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadMosques = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated.');
      return;
    }

    const { data: memberships } = await supabase
      .from('mosque_members')
      .select('mosque_id, mosques(id, name)')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      setError('No mosques linked to your account.');
      return;
    }

    const mosqueList = memberships
      .map((m) => m.mosques as unknown as PairingMosqueResult)
      .filter((m): m is PairingMosqueResult => m != null);

    if (mosqueList.length === 1) {
      // Auto-select the only mosque
      setSelectedMosque(mosqueList[0]);
      await loadScreens(mosqueList[0]);
    } else {
      setMosques(mosqueList);
      setStep('pick-mosque');
    }
  }, []);

  const loadScreens = async (mosque: PairingMosqueResult) => {
    const { data } = await supabase
      .from('screens')
      .select('id, name, short_code')
      .eq('mosque_id', mosque.id);

    setScreens((data as PairingScreenResult[]) ?? []);
    setStep('screens');
  };

  const handleSelectMosque = async (mosque: PairingMosqueResult) => {
    setSelectedMosque(mosque);
    await loadScreens(mosque);
  };

  const handleSelectScreen = async (screen: PairingScreenResult) => {
    if (!selectedMosque) return;
    setSending(true);

    const channel = supabase.channel(`pair:${sessionId}`);
    await channel.subscribe();

    const payload: PairingBroadcastPayload = {
      type: 'screen_selected',
      shortCode: screen.short_code,
      screenName: screen.name,
      mosqueName: selectedMosque.name,
    };

    await channel.send({
      type: 'broadcast',
      event: 'screen_selected',
      payload,
    });

    supabase.removeChannel(channel);
    setPairedScreenName(screen.name);
    setSending(false);
    setStep('done');
  };

  useEffect(() => {
    loadMosques();
  }, [loadMosques]);

  if (error) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
        <p className="text-muted-foreground text-center">{error}</p>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-svh flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-1">Connected</h2>
        <p className="text-muted-foreground text-center">
          Now showing <strong>{pairedScreenName}</strong>.
          <br />You can close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-xl font-bold mb-1">Connect Screen</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 'pick-mosque'
            ? 'Select your mosque to continue.'
            : `Select a screen for ${selectedMosque?.name}.`}
        </p>

        {step === 'pick-mosque' && (
          <div className="space-y-2">
            {mosques.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMosque(m)}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <span className="font-medium">{m.name}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'screens' && (
          <>
            {mosques.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 -ml-2"
                onClick={() => {
                  setStep('pick-mosque');
                  setSelectedMosque(null);
                  setScreens([]);
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}

            <div className="space-y-2">
              {screens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectScreen(s)}
                  disabled={sending}
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <Monitor className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{s.name}</span>
                </button>
              ))}
              {screens.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No screens configured for this mosque.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
