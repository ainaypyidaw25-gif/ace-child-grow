import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ value: false }));
const network = vi.hoisted(() => ({
  getStatus: vi.fn(),
  addListener: vi.fn(),
  callback: undefined as ((status: { connected: boolean; connectionType: string }) => void) | undefined,
  remove: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.value },
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: network.getStatus,
    addListener: network.addListener,
  },
}));

import { useOnlineStatus } from '../useOnlineStatus';

function setBrowserOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

describe('useOnlineStatus', () => {
  beforeEach(() => {
    native.value = false;
    setBrowserOnline(true);
    network.getStatus.mockReset();
    network.addListener.mockReset();
    network.remove.mockReset();
    network.callback = undefined;
    network.addListener.mockImplementation(async (_event: string, callback: typeof network.callback) => {
      network.callback = callback;
      return { remove: network.remove };
    });
  });

  afterEach(() => cleanup());

  it('uses browser online and offline events on the web', async () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    setBrowserOnline(false);
    act(() => window.dispatchEvent(new Event('offline')));

    await waitFor(() => expect(result.current).toBe(false));
    expect(network.getStatus).not.toHaveBeenCalled();
  });

  it('uses the native network status instead of Android WebView navigator.onLine', async () => {
    native.value = true;
    network.getStatus.mockResolvedValue({ connected: false, connectionType: 'none' });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
    await waitFor(() => expect(network.getStatus).toHaveBeenCalledOnce());
    expect(result.current).toBe(false);
  });

  it('reacts to native airplane-mode connectivity changes', async () => {
    native.value = true;
    network.getStatus.mockResolvedValue({ connected: true, connectionType: 'wifi' });

    const { result, unmount } = renderHook(() => useOnlineStatus());
    await waitFor(() => expect(result.current).toBe(true));

    act(() => network.callback?.({ connected: false, connectionType: 'none' }));
    expect(result.current).toBe(false);

    unmount();
    await waitFor(() => expect(network.remove).toHaveBeenCalledOnce());
  });
});
