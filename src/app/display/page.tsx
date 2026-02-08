'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrSetup } from '@/components/kiosk/qr-setup';
import type { KioskPairedState } from '@/types/pairing';

const STORAGE_KEY = 'nextnamaz_display_paired';

export default function DisplayPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as KioskPairedState;
      router.replace(`/screen/${state.shortCode}`);
      return;
    }
    setReady(true);
  }, [router]);

  const handlePaired = (state: KioskPairedState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    router.replace(`/screen/${state.shortCode}`);
  };

  if (!ready) return null;

  return <QrSetup onPaired={handlePaired} />;
}
