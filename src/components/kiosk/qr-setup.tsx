'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import type { KioskPairedState, PairingBroadcastPayload } from '@/types/pairing';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QrSetupProps {
  onPaired: (state: KioskPairedState) => void;
}

export function QrSetup({ onPaired }: QrSetupProps) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [pairUrl, setPairUrl] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setPairUrl(`${window.location.origin}/connect/${sessionId}`);

    const supabase = createClient();
    const channel = supabase.channel(`pair:${sessionId}`);

    channel
      .on('broadcast', { event: 'screen_selected' }, ({ payload }) => {
        const data = payload as PairingBroadcastPayload;
        onPaired({
          shortCode: data.shortCode,
          screenName: data.screenName,
          mosqueName: data.mosqueName,
          pairedAt: new Date().toISOString(),
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onPaired]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Screen Setup</h1>
      <p className="text-neutral-400 mb-10 text-center max-w-md">
        Scan this QR code with your phone to connect this screen.
      </p>

      {pairUrl && (
        <div className="bg-white p-6 rounded-2xl shadow-2xl mb-8">
          <QRCodeSVG value={pairUrl} size={320} level="M" />
        </div>
      )}

      <p className="text-neutral-500 text-sm text-center max-w-xs">
        Waiting for connection...
      </p>
    </div>
  );
}
