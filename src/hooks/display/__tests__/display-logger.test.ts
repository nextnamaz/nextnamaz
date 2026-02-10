import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/display-cache', () => ({
  getDeviceId: vi.fn().mockReturnValue('test-device-id'),
}));

// Mock sendBeacon to return true (avoids fetch fallback hitting happy-dom's real network)
const mockSendBeacon = vi.fn().mockReturnValue(true);

describe('createDisplayLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSendBeacon.mockClear();
    Object.defineProperty(navigator, 'sendBeacon', {
      value: mockSendBeacon,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('does nothing when disabled', async () => {
    const { createDisplayLogger } = await import('@/lib/display-logger');
    const logger = createDisplayLogger({ screenId: 'screen-1', slug: 'test', enabled: false });

    logger.logError({
      errorType: 'unhandled_error',
      message: 'Should be ignored',
    });

    logger.flush();
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('batches errors and flushes after debounce', async () => {
    const { createDisplayLogger } = await import('@/lib/display-logger');
    const logger = createDisplayLogger({ screenId: 'screen-1', slug: 'test', enabled: true });

    logger.logError({ errorType: 'unhandled_error', message: 'Error 1' });
    logger.logError({ errorType: 'network_error', message: 'Error 2' });

    // Not flushed yet
    expect(mockSendBeacon).not.toHaveBeenCalled();

    // Advance past debounce
    vi.advanceTimersByTime(5000);

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    const blob: Blob = mockSendBeacon.mock.calls[0][1];
    const text = await blob.text();
    const body = JSON.parse(text);
    expect(body.errors).toHaveLength(2);
    expect(body.errors[0].message).toBe('Error 1');
    expect(body.errors[1].message).toBe('Error 2');
  });

  it('respects max queue size (20)', async () => {
    const { createDisplayLogger } = await import('@/lib/display-logger');
    const logger = createDisplayLogger({ screenId: 'screen-1', slug: 'test', enabled: true });

    for (let i = 0; i < 25; i++) {
      logger.logError({ errorType: 'unhandled_error', message: `Error ${i}` });
    }

    vi.advanceTimersByTime(5000);

    const blob: Blob = mockSendBeacon.mock.calls[0][1];
    const text = await blob.text();
    const body = JSON.parse(text);
    expect(body.errors).toHaveLength(20);
  });

  it('includes screen_id, device_id, and slug in metadata', async () => {
    const { createDisplayLogger } = await import('@/lib/display-logger');
    const logger = createDisplayLogger({ screenId: 'screen-1', slug: 'my-slug', enabled: true });

    logger.logError({ errorType: 'render_crash', message: 'crash!' });
    vi.advanceTimersByTime(5000);

    const blob: Blob = mockSendBeacon.mock.calls[0][1];
    const text = await blob.text();
    const body = JSON.parse(text);
    expect(body.errors[0].screen_id).toBe('screen-1');
    expect(body.errors[0].device_id).toBe('test-device-id');
    expect(body.errors[0].metadata.slug).toBe('my-slug');
  });

  it('flush() sends immediately via sendBeacon', async () => {
    const { createDisplayLogger } = await import('@/lib/display-logger');
    const logger = createDisplayLogger({ screenId: 'screen-1', slug: 'test', enabled: true });

    logger.logError({ errorType: 'unhandled_error', message: 'Immediate' });
    logger.flush();

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon.mock.calls[0][0]).toBe('/api/display/log-error');
  });
});
