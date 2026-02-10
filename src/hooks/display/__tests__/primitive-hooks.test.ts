import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../use-online-status';
import { useDocumentVisible } from '../use-document-visible';
import { useInterval } from '../use-interval';

describe('useOnlineStatus', () => {
  it('returns true by default', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false after offline event', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);

    // Restore
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('returns true after online event', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });
});

describe('useDocumentVisible', () => {
  it('returns true by default', () => {
    const { result } = renderHook(() => useDocumentVisible());
    expect(result.current).toBe(true);
  });

  it('returns false after visibility change to hidden', () => {
    const { result } = renderHook(() => useDocumentVisible());

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(false);

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });
});

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires callback at interval', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('pauses when delay is null', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ delay: null });
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses latest callback via ref', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: callback1 } },
    );

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);

    rerender({ cb: callback2 });

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
