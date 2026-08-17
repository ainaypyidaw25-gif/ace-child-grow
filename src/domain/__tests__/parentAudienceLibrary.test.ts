import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'staff-1' as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { getBySlug, listByType } from '../../../convex/library';

type Row = Record<string, unknown>;

function context(libraryRows: Row[]) {
  const query = vi.fn((table: string) => {
    const rows = table === 'parentProfiles'
      ? [{ userId: 'staff-1', staffRole: 'owner' }]
      : table === 'libraryContent' ? libraryRows : [];
    const terminal = {
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      unique: async () => rows[0] ?? null,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => { void field; void value; return q; } };
        callback(q);
        return terminal;
      },
    };
  });
  return { auth: {}, db: { query }, storage: { getUrl: vi.fn() } };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

describe('parent-audience library boundary', () => {
  beforeEach(() => { authState.userId = 'staff-1'; });

  it('returns only published rows even when the caller is staff', async () => {
    const rows = [
      { _id: 'draft', slug: 'draft', type: 'lesson', clinicalStatus: 'draft', searchText: 'draft' },
      { _id: 'live', slug: 'live', type: 'lesson', clinicalStatus: 'published', searchText: 'live' },
    ];
    const result = await handler(listByType)(context(rows), { type: 'lesson', audience: 'parent' }) as { staff: boolean; items: Row[] };
    expect(result.staff).toBe(false);
    expect(result.items.map((row) => row.slug)).toEqual(['live']);
  });

  it('keeps the staff workspace behaviour when parent audience is not requested', async () => {
    const rows = [
      { _id: 'draft', slug: 'draft', type: 'lesson', clinicalStatus: 'draft', searchText: 'draft' },
      { _id: 'live', slug: 'live', type: 'lesson', clinicalStatus: 'published', searchText: 'live' },
    ];
    const result = await handler(listByType)(context(rows), { type: 'lesson' }) as { staff: boolean; items: Row[] };
    expect(result.staff).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  it('blocks a staff caller from opening an unpublished row through a parent route', async () => {
    const rows = [{ _id: 'draft', slug: 'draft', type: 'lesson', clinicalStatus: 'draft', searchText: 'draft' }];
    await expect(handler(getBySlug)(context(rows), { slug: 'draft', audience: 'parent' }))
      .resolves.toEqual({ restricted: true });
  });
});
