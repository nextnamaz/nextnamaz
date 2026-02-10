import { getDeviceId } from '@/lib/display-cache';

export type DisplayErrorType = 'render_crash' | 'unhandled_error' | 'unhandled_rejection' | 'network_error';

export interface DisplayErrorPayload {
  errorType: DisplayErrorType;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

interface QueuedError {
  screen_id: string | null;
  device_id: string;
  error_type: DisplayErrorType;
  message: string;
  stack?: string;
  metadata: Record<string, unknown>;
}

interface DisplayLoggerOptions {
  screenId: string | null;
  slug: string;
  enabled: boolean;
}

interface DisplayLogger {
  logError: (payload: DisplayErrorPayload) => void;
  flush: () => void;
}

const MAX_QUEUE_SIZE = 20;
const FLUSH_DELAY_MS = 5000;

export function createDisplayLogger({ screenId, slug, enabled }: DisplayLoggerOptions): DisplayLogger {
  if (!enabled) {
    return { logError: () => {}, flush: () => {} };
  }

  const queue: QueuedError[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let deviceId: string | null = null;

  function getOrCreateDeviceId(): string {
    if (!deviceId) {
      deviceId = getDeviceId();
    }
    return deviceId;
  }

  function flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, MAX_QUEUE_SIZE);

    const body = JSON.stringify({ errors: batch });

    // Try sendBeacon first (works during page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/display/log-error',
        new Blob([body], { type: 'application/json' }),
      );
      if (sent) return;
    }

    // Fallback to fetch (fire and forget)
    fetch('/api/display/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Logging failure — silently ignore
    });
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, FLUSH_DELAY_MS);
  }

  function logError(payload: DisplayErrorPayload) {
    if (queue.length >= MAX_QUEUE_SIZE) return;

    queue.push({
      screen_id: screenId,
      device_id: getOrCreateDeviceId(),
      error_type: payload.errorType,
      message: payload.message.slice(0, 2000),
      stack: payload.stack?.slice(0, 5000),
      metadata: { slug, ...payload.metadata },
    });

    scheduleFlush();
  }

  // Flush on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
  }

  return { logError, flush };
}
