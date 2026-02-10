'use client';

import { useState, useEffect } from 'react';
import type { ConnectionStatus } from '@/lib/display-cache';

const COLORS: Record<ConnectionStatus, string> = {
  connected: '#22c55e',
  reconnecting: '#eab308',
  offline: '#ef4444',
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'connected') {
      const timeout = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
    setVisible(true);
  }, [status]);

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes connection-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 9999,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: COLORS[status],
          animation: status !== 'connected' ? 'connection-pulse 2s infinite' : undefined,
        }}
      />
    </>
  );
}
