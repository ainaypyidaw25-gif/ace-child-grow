import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadFailure, recoverStaleChunk } from '../chunkRecovery';

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next;
    }),
  };
}

describe('chunk recovery', () => {
  it('recognises the dynamic import failures emitted by modern browsers', () => {
    expect(isChunkLoadFailure(new TypeError('Failed to fetch dynamically imported module: /assets/Welcome-old.js'))).toBe(true);
    expect(isChunkLoadFailure('Importing a module script failed.')).toBe(true);
    expect(isChunkLoadFailure(new Error('ChunkLoadError: Loading chunk 42 failed'))).toBe(true);
    expect(isChunkLoadFailure(new Error('Network request failed'))).toBe(false);
  });

  it('records and performs the first recovery reload', () => {
    const storage = memoryStorage();
    const reload = vi.fn();

    expect(recoverStaleChunk(storage, reload, 100_000)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('ace:chunk-reload-at', '100000');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('blocks a second reload during the cooldown to prevent a loop', () => {
    const storage = memoryStorage('100000');
    const reload = vi.fn();

    expect(recoverStaleChunk(storage, reload, 120_000)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('allows recovery again after the cooldown for a later deployment', () => {
    const storage = memoryStorage('100000');
    const reload = vi.fn();

    expect(recoverStaleChunk(storage, reload, 160_001)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('still reloads when storage is unavailable', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage denied');
      }),
      setItem: vi.fn(),
    };
    const reload = vi.fn();

    expect(recoverStaleChunk(storage, reload, 100_000)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });
});
