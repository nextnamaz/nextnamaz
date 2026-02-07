'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import type { DevicePresenceState } from '@/types/prayer-config';

interface ScreenPresenceProps {
  screenId: string;
  compact?: boolean;
}

interface PresenceDevice extends DevicePresenceState {
  presenceRef: string;
}

export function ScreenPresence({ screenId, compact }: ScreenPresenceProps) {
  const [devices, setDevices] = useState<PresenceDevice[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`screen:${screenId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allDevices: PresenceDevice[] = [];
        for (const [ref, entries] of Object.entries(state)) {
          for (const entry of entries) {
            allDevices.push({ ...(entry as unknown as DevicePresenceState), presenceRef: ref });
          }
        }
        setDevices(allDevices);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId]);

  const count = devices.length;
  const isOnline = count > 0;

  if (compact) {
    if (!isOnline) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {count}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
        {count} device{count !== 1 ? 's' : ''} connected
      </button>

      {expanded && count > 0 && (
        <div className="mt-2 rounded-lg border bg-card p-3 shadow-sm space-y-2 text-xs">
          {devices.map((d) => (
            <div key={d.deviceId} className="flex justify-between gap-4">
              <span className="text-muted-foreground truncate max-w-[200px]">
                {d.screenResolution}
              </span>
              <span className="text-muted-foreground/70 whitespace-nowrap">
                {getConnectedDuration(d.connectedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getConnectedDuration(connectedAt: string): string {
  const diff = Date.now() - new Date(connectedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
