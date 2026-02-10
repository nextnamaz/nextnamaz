import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDisplaySync } from '../use-display-sync';
import type { Mosque, Screen, MosqueSettings } from '@/types/database';
import type { PrayerConfigMap } from '@/types/prayer-config';

// --- Mocks ---

interface MockChannel {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  track: ReturnType<typeof vi.fn>;
  _handlers: Record<string, (...args: unknown[]) => void>;
  _subscribeCallback: ((status: string) => void) | null;
}

function createMockChannel(): MockChannel {
  const channel: MockChannel = {
    on: vi.fn(),
    subscribe: vi.fn(),
    track: vi.fn().mockResolvedValue(undefined),
    _handlers: {},
    _subscribeCallback: null,
  };
  channel.on.mockImplementation((eventType: string, _opts: unknown, handler: (...args: unknown[]) => void) => {
    // Store handler keyed by event type (e.g. 'postgres_changes', 'broadcast')
    channel._handlers[eventType] = handler;
    return channel;
  });
  channel.subscribe.mockImplementation((cb?: (status: string) => void) => {
    channel._subscribeCallback = cb ?? null;
    return channel;
  });
  return channel;
}

const mockSettingsChannel = createMockChannel();
const mockScreenChannel = createMockChannel();
const mockCommandChannel = createMockChannel();

let channelIndex = 0;
const channels = [mockSettingsChannel, mockScreenChannel, mockCommandChannel];

const mockRemoveChannel = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: (name: string) => {
      const ch = channels[channelIndex % channels.length];
      channelIndex++;
      return ch;
    },
    removeChannel: mockRemoveChannel,
  }),
}));

vi.mock('@/lib/display-cache', () => ({
  loadYearlyCache: vi.fn().mockReturnValue({ times: {}, cachedAt: new Date().toISOString() }),
  isYearlyCacheStale: vi.fn().mockReturnValue(false),
  saveYearlyCache: vi.fn(),
  getDeviceId: vi.fn().mockReturnValue('test-device-id'),
  todayDateString: vi.fn().mockReturnValue('2026-02-10'),
  getMosqueTimezone: vi.fn().mockReturnValue(undefined),
}));

// Mock online/visible hooks
let mockIsOnline = true;
let mockIsVisible = true;

vi.mock('../use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline,
}));

vi.mock('../use-document-visible', () => ({
  useDocumentVisible: () => mockIsVisible,
}));

const mockMosque: Mosque = {
  id: 'mosque-1',
  name: 'Test Mosque',
  slug: 'test-mosque',
  logo_url: null,
  created_at: '2026-01-01T00:00:00Z',
};

const mockScreen: Screen = {
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

describe('useDisplaySync', () => {
  beforeEach(() => {
    channelIndex = 0;
    mockIsOnline = true;
    mockIsVisible = true;
    mockRemoveChannel.mockClear();
    // Reset captured handlers
    mockSettingsChannel._handlers = {};
    mockScreenChannel._handlers = {};
    mockCommandChannel._handlers = {};
    mockSettingsChannel._subscribeCallback = null;
    mockScreenChannel._subscribeCallback = null;
    mockCommandChannel._subscribeCallback = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial values on mount', () => {
    const { result } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.currentScreen).toEqual(mockScreen);
    expect(result.current.currentTheme).toBe('default');
  });

  it('subscribes to channels on mount', () => {
    renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    expect(mockSettingsChannel.subscribe).toHaveBeenCalled();
    expect(mockScreenChannel.subscribe).toHaveBeenCalled();
    expect(mockCommandChannel.subscribe).toHaveBeenCalled();
  });

  it('updates connectionStatus via settings channel subscribe callback', () => {
    const { result } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    // Simulate SUBSCRIBED status
    act(() => {
      mockSettingsChannel._subscribeCallback?.('SUBSCRIBED');
    });
    expect(result.current.connectionStatus).toBe('connected');

    // Simulate CHANNEL_ERROR
    act(() => {
      mockSettingsChannel._subscribeCallback?.('CHANNEL_ERROR');
    });
    expect(result.current.connectionStatus).toBe('reconnecting');

    // Simulate TIMED_OUT
    act(() => {
      mockSettingsChannel._subscribeCallback?.('TIMED_OUT');
    });
    expect(result.current.connectionStatus).toBe('offline');
  });

  it('cleans up channels on unmount', () => {
    const { unmount } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(3);
  });

  it('sets connectionStatus to offline when not online', () => {
    mockIsOnline = false;

    const { result } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    expect(result.current.connectionStatus).toBe('offline');
  });

  it('updates settings on realtime payload', () => {
    const { result } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    // Simulate a realtime settings update via the postgres_changes handler
    const handler = mockSettingsChannel._handlers['postgres_changes'];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        new: {
          mosque_id: 'mosque-1',
          prayer_times: { fajr: '04:50', sunrise: '06:45', dhuhr: '12:50', asr: '15:50', maghrib: '19:20', isha: '20:50' },
          prayer_source: 'manual',
          prayer_source_config: {},
          prayer_config: {},
          locale: 'en',
          display_text: {},
          metadata: {},
          updated_at: '2026-02-10T12:00:00Z',
        },
      });
    });

    expect(result.current.settings.prayer_times.fajr).toBe('04:50');
  });

  it('updates screen and theme on screen channel payload', () => {
    const { result } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    const handler = mockScreenChannel._handlers['postgres_changes'];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        new: {
          ...mockScreen,
          theme: 'andalus',
          name: 'Updated Screen',
        },
      });
    });

    expect(result.current.currentTheme).toBe('andalus');
    expect(result.current.currentScreen.name).toBe('Updated Screen');
  });

  it('refetches on online recovery (offline → online transition)', () => {
    // Start offline
    mockIsOnline = false;

    const { result, rerender } = renderHook(() =>
      useDisplaySync(mockMosque, mockScreen, mockSettings, 'main-screen', {
        isPreview: false,
      }),
    );

    expect(result.current.connectionStatus).toBe('offline');

    // Come back online — triggers refetch
    act(() => {
      mockIsOnline = true;
    });

    rerender();

    // Should transition to reconnecting (then connected after refetch resolves)
    expect(result.current.connectionStatus).toBe('reconnecting');
  });
});
