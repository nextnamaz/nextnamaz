import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrayerDisplay } from '@/components/display/prayer-display';
import { DisplayErrorBoundary } from '@/components/display/display-error-boundary';
import type { Mosque, Screen as ScreenType, MosqueSettings } from '@/types/database';
import type { PrayerConfigMap } from '@/types/prayer-config';

// --- Mocks ---

// Mock supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    track: vi.fn().mockResolvedValue(undefined),
  };
  return {
    createClient: () => ({
      channel: () => mockChannel,
      removeChannel: vi.fn(),
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null }),
          }),
        }),
      }),
    }),
  };
});

vi.mock('@/lib/display-cache', () => ({
  saveDisplayCache: vi.fn(),
  loadYearlyCache: vi.fn().mockReturnValue({ times: {}, cachedAt: new Date().toISOString() }),
  isYearlyCacheStale: vi.fn().mockReturnValue(false),
  saveYearlyCache: vi.fn(),
  getDeviceId: vi.fn().mockReturnValue('test-device-id'),
  getTodaysPrayerTimes: vi.fn().mockReturnValue({
    fajr: '05:30',
    sunrise: '07:00',
    dhuhr: '13:00',
    asr: '16:00',
    maghrib: '19:30',
    isha: '21:00',
  }),
  todayDateString: vi.fn().mockReturnValue('2026-02-10'),
  getMosqueTimezone: vi.fn().mockReturnValue(undefined),
}));

vi.mock('@/lib/display-logger', () => ({
  createDisplayLogger: vi.fn().mockReturnValue({
    logError: vi.fn(),
    flush: vi.fn(),
  }),
}));

// Mock theme registry with a simple test theme
vi.mock('@/components/display/themes', () => ({
  THEME_REGISTRY: {
    default: {
      id: 'default',
      name: 'Default',
      description: 'Default theme',
      preview: '',
      component: ({ mosqueName, prayers }: { mosqueName: string; prayers: Array<{ name: string; displayName: string; time: string }> }) => (
        <div data-testid="theme">
          <h1>{mosqueName}</h1>
          {prayers.map((p) => (
            <div key={p.name} data-testid={`prayer-${p.name}`}>
              {p.displayName}: {p.time}
            </div>
          ))}
        </div>
      ),
      fields: [],
      defaultConfig: {},
    },
  },
}));

const mockMosque: Mosque = {
  id: 'mosque-1',
  name: 'Integration Mosque',
  slug: 'integration-mosque',
  logo_url: null,
  created_at: '2026-01-01T00:00:00Z',
};

const mockScreen: ScreenType = {
  id: 'screen-1',
  mosque_id: 'mosque-1',
  name: 'Main Screen',
  slug: 'main-screen',
  short_code: 'ABC123',
  theme: 'default',
  theme_config: {},
  rotation: 0,
  zoom: 100,
  brightness: 100,
  created_at: '2026-01-01T00:00:00Z',
};

const mockSettings: MosqueSettings = {
  mosque_id: 'mosque-1',
  prayer_times: {
    fajr: '05:30',
    sunrise: '07:00',
    dhuhr: '13:00',
    asr: '16:00',
    maghrib: '19:30',
    isha: '21:00',
  },
  prayer_source: 'manual',
  prayer_source_config: {} as MosqueSettings['prayer_source_config'],
  prayer_config: {} as PrayerConfigMap,
  locale: 'en',
  display_text: {},
  metadata: {},
  updated_at: '2026-01-01T00:00:00Z',
};

// A theme component that always throws (for error boundary test)
function CrashingTheme() {
  throw new Error('Theme exploded!');
}

describe('PrayerDisplay integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme with correct data', () => {
    render(
      <PrayerDisplay
        mosque={mockMosque}
        screen={mockScreen}
        settings={mockSettings}
        isPreview
      />,
    );

    expect(screen.getByText('Integration Mosque')).toBeDefined();
    expect(screen.getByTestId('prayer-fajr')).toBeDefined();
    expect(screen.getByTestId('prayer-isha')).toBeDefined();
  });

  it('renders all six prayer times', () => {
    render(
      <PrayerDisplay
        mosque={mockMosque}
        screen={mockScreen}
        settings={mockSettings}
        isPreview
      />,
    );

    const prayerNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const name of prayerNames) {
      expect(screen.getByTestId(`prayer-${name}`)).toBeDefined();
    }
  });

  it('shows fallback when theme throws', () => {
    // Suppress React error boundary console output during this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const prayers = [
      { name: 'fajr' as const, displayName: 'Fajr', time: '05:30' },
      { name: 'dhuhr' as const, displayName: 'Dhuhr', time: '13:00' },
    ];

    render(
      <DisplayErrorBoundary mosqueName="Crash Mosque" prayers={prayers}>
        <CrashingTheme />
      </DisplayErrorBoundary>,
    );

    // Fallback should show mosque name and prayer times
    expect(screen.getByText('Crash Mosque')).toBeDefined();
    expect(screen.getByText('Prayer Times')).toBeDefined();
    expect(screen.getByText('Fajr')).toBeDefined();
    expect(screen.getByText('05:30')).toBeDefined();

    consoleSpy.mockRestore();
  });
});
