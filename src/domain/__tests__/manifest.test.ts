import { describe, it, expect } from 'vitest';
import { buildOfflineManifest, formatBytes, type OfflineItem } from '../offline/manifest';

const item = (id: string, bytes: number, isPublic = true): OfflineItem => ({
  id, kind: 'lesson', title: id, bytes, isPublic,
});

describe('offline manifest', () => {
  it('includes only public items', () => {
    const m = buildOfflineManifest([item('a', 100), item('b', 100, false), item('c', 100)]);
    expect(m.items.map((i) => i.id)).toEqual(['a', 'c']);
    expect(m.skipped.nonPublic).toBe(1);
  });

  it('NEVER caches a non-public (private) item, even alone', () => {
    const m = buildOfflineManifest([item('private', 10, false)]);
    expect(m.items).toEqual([]);
    expect(m.count).toBe(0);
  });

  it('respects the byte budget', () => {
    const m = buildOfflineManifest([item('a', 600), item('b', 600), item('c', 300)], 1000);
    expect(m.items.map((i) => i.id)).toEqual(['a', 'c']); // b skipped, c fits
    expect(m.totalBytes).toBe(900);
    expect(m.skipped.overBudget).toBe(1);
  });

  it('sums total bytes and count', () => {
    const m = buildOfflineManifest([item('a', 100), item('b', 250)]);
    expect(m.totalBytes).toBe(350);
    expect(m.count).toBe(2);
  });

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
