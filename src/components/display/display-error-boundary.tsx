'use client';

import React from 'react';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayErrorPayload } from '@/lib/display-logger';

interface ErrorBoundaryProps {
  mosqueName: string;
  prayers: PrayerTimeEntry[];
  onError?: (payload: DisplayErrorPayload) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;

export class DisplayErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[DisplayErrorBoundary] Theme crashed:', error, errorInfo);

    this.props.onError?.({
      errorType: 'render_crash',
      message: error.message,
      stack: error.stack,
      metadata: { componentStack: errorInfo.componentStack ?? undefined },
    });

    // Clear any existing retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    // Auto-retry up to MAX_RETRIES times
    if (this.state.retryCount < MAX_RETRIES) {
      this.retryTimer = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          retryCount: prev.retryCount + 1,
        }));
      }, RETRY_DELAY_MS);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      return <FallbackDisplay mosqueName={this.props.mosqueName} prayers={this.props.prayers} />;
    }
    return this.props.children;
  }
}

function FallbackDisplay({ mosqueName, prayers }: { mosqueName: string; prayers: PrayerTimeEntry[] }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a1a2e',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#fff' }}>{mosqueName}</h1>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.7 }}>Prayer Times</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', fontSize: '1.4rem' }}>
        {prayers.map((p) => (
          <React.Fragment key={p.name}>
            <span style={{ textAlign: 'right', opacity: 0.8 }}>{p.displayName}</span>
            <span style={{ fontWeight: 'bold' }}>{p.time}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
