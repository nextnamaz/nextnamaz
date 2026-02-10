import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDisplayLifecycle } from '../use-display-lifecycle';
import type { Mosque, Screen, MosqueSettings } from '@/types/database';
import type { PrayerConfigMap } from '@/types/prayer-config';

vi.mock('@/lib/display-cache', () => ({
  saveDisplayCache: vi.fn(),
}));

import { saveDisplayCache } from '@/lib/display-cache';

const mockSaveDisplayCache = vi.mocked(saveDisplayCache);

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

describe('useDisplayLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveDisplayCache.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('saves to localStorage on mount', () => {
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false }),
    );

    expect(mockSaveDisplayCache).toHaveBeenCalledWith('main-screen', cacheData);
  });

  it('saves to localStorage when data changes', () => {
    const cacheData1 = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };
    const updatedSettings = { ...mockSettings, updated_at: '2026-02-01T00:00:00Z' };
    const cacheData2 = { screen: mockScreen, mosque: mockMosque, settings: updatedSettings };

    const { rerender } = renderHook(
      ({ data }) => useDisplayLifecycle(data, { slug: 'main-screen', isPreview: false }),
      { initialProps: { data: cacheData1 } },
    );

    expect(mockSaveDisplayCache).toHaveBeenCalledTimes(1);

    rerender({ data: cacheData2 });
    expect(mockSaveDisplayCache).toHaveBeenCalledTimes(2);
    expect(mockSaveDisplayCache).toHaveBeenLastCalledWith('main-screen', cacheData2);
  });

  it('catches global errors and calls onError', () => {
    const onError = vi.fn();
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false, onError }),
    );

    // Simulate global error
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      error: new Error('Test error'),
    });
    window.dispatchEvent(errorEvent);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'unhandled_error',
        message: 'Test error',
      }),
    );
  });

  it('catches unhandled rejections and calls onError', () => {
    const onError = vi.fn();
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false, onError }),
    );

    // Simulate unhandled rejection (happy-dom may not support PromiseRejectionEvent constructor)
    const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejectionEvent, 'reason', { value: new Error('Promise failed') });
    Object.defineProperty(rejectionEvent, 'promise', { value: Promise.resolve() });
    window.dispatchEvent(rejectionEvent);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'unhandled_rejection',
        message: 'Promise failed',
      }),
    );
  });

  it('cleans up listeners on unmount', () => {
    const onError = vi.fn();
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    const { unmount } = renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false, onError }),
    );

    unmount();

    // Error after unmount should not trigger onError
    const errorEvent = new ErrorEvent('error', {
      message: 'After unmount',
      error: new Error('After unmount'),
    });
    window.dispatchEvent(errorEvent);

    expect(onError).not.toHaveBeenCalled();
  });

  it('watchdog reloads when stale > 5 minutes', () => {
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      configurable: true,
      writable: true,
    });

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false }),
    );

    // Advance 6 minutes — watchdog checks every 60s, threshold is 5min
    // But lastRenderTimestamp is set on mount, so we need to freeze it
    // and then advance far enough. The watchdog interval fires at 60s intervals.
    vi.advanceTimersByTime(6 * 60 * 1000);

    expect(mockReload).toHaveBeenCalled();
  });

  it('registers service worker in non-preview mode', () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
    });

    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: false }),
    );

    expect(mockRegister).toHaveBeenCalledWith('/display-sw.js', { scope: '/display/' });
  });

  it('does not register SW in preview mode', () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
    });

    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: true }),
    );

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('does not register error handlers in preview mode', () => {
    const onError = vi.fn();
    const cacheData = { screen: mockScreen, mosque: mockMosque, settings: mockSettings };

    renderHook(() =>
      useDisplayLifecycle(cacheData, { slug: 'main-screen', isPreview: true, onError }),
    );

    const errorEvent = new ErrorEvent('error', {
      message: 'Preview error',
      error: new Error('Preview error'),
    });
    window.dispatchEvent(errorEvent);

    expect(onError).not.toHaveBeenCalled();
  });
});
