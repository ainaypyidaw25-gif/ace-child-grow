import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOfflineStorageAvailable, readAllRecords, saveRecords, clearRecords } from '../offlineStore';

// Offline downloads are a convenience. Private browsing, a full disk and
// locked-down Android WebViews all reject IndexedDB, and none of them may stop
// the app rendering — every entry point has to resolve rather than throw.

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('when device storage is unavailable', () => {
  it('reports it rather than assuming it works', () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(isOfflineStorageAvailable()).toBe(false);
  });

  it('reads as empty instead of throwing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(readAllRecords()).resolves.toEqual([]);
  });

  it('reports a failed save instead of throwing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(saveRecords([])).resolves.toBe(false);
  });

  it('reports a failed clear instead of throwing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(clearRecords()).resolves.toBe(false);
  });

  it('survives an indexedDB that throws on open', async () => {
    vi.stubGlobal('indexedDB', {
      open() {
        throw new Error('SecurityError: access denied');
      },
    });
    expect(isOfflineStorageAvailable()).toBe(true);
    await expect(readAllRecords()).resolves.toEqual([]);
    await expect(saveRecords([])).resolves.toBe(false);
  });

  it('treats a blocked open as unavailable rather than hanging', async () => {
    vi.stubGlobal('indexedDB', {
      open() {
        const request: Record<string, unknown> = {};
        queueMicrotask(() => {
          (request.onerror as (() => void) | undefined)?.();
        });
        return request;
      },
    });
    await expect(readAllRecords()).resolves.toEqual([]);
  });
});
