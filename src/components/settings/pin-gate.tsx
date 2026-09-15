'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { unlockScreen } from '@/lib/actions';
import { PIN_RE } from '@/lib/screen-settings';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * What a locked screen's settings show until the PIN is entered. On success
 * the server has set the unlock cookie, so a refresh renders the settings.
 */
export function PinGate({ id }: { id: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!PIN_RE.test(pin)) {
      setError('A PIN is 4 to 8 digits');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await unlockScreen(id, pin);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(result.error);
    setBusy(false);
  };

  return (
    <div className="min-h-dvh bg-background flex items-center px-6 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-sm mx-auto flex flex-col items-center text-center gap-6"
      >
        <Logo size="md" />
        <div>
          <h1 className="text-2xl font-bold mb-1.5">This screen is locked</h1>
          <p className="text-muted-foreground">Enter the PIN that was set for it.</p>
        </div>

        <div className="w-full text-left">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="mt-1.5 h-14 text-center text-2xl tracking-[0.4em] tabular-nums"
            autoFocus
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full h-12" disabled={busy}>
          {busy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Lock className="size-4 mr-1.5" />}
          Unlock
        </Button>
      </form>
    </div>
  );
}
