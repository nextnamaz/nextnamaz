'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setScreenPin } from '@/lib/actions';
import { PIN_RE } from '@/lib/screen-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PinCardProps {
  screenId: string;
  hasPin: boolean;
}

/**
 * The Lock tab: set, change or remove the PIN. Talks to the server directly
 * rather than through the save bar, because a PIN is not a setting to be
 * batched with a theme change; it takes effect the moment it is saved.
 */
export function PinCard({ screenId, hasPin }: PinCardProps) {
  const [locked, setLocked] = useState(hasPin);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (next: string | null) => {
    if (next !== null && !PIN_RE.test(next)) {
      toast.error('A PIN is 4 to 8 digits');
      return;
    }
    setBusy(true);
    const result = await setScreenPin(screenId, next);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setLocked(next !== null);
    setPin('');
    toast.success(next === null ? 'PIN removed.' : 'PIN saved.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {locked
            ? 'This screen asks for a PIN before its settings can be changed.'
            : 'Anyone who scans the code on the TV can change these settings. A PIN means they also need a number only you know.'}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="pin">{locked ? 'New PIN' : 'PIN'}</Label>
          <Input
            id="pin"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 to 8 digits"
            className="max-w-xs text-lg tracking-[0.3em] tabular-nums"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => apply(pin)} disabled={busy || pin.length === 0}>
            {busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {locked ? 'Change PIN' : 'Set PIN'}
          </Button>
          {locked && (
            <Button variant="outline" onClick={() => apply(null)} disabled={busy}>
              Remove PIN
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
