import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { list, add, remove } from '../../../convex/observations';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  getMany?: Record<string, Row | null>;
} = {}) {
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const terminal = {
      collect: async () => rows,
      take: async (n: number) => rows.slice(0, n),
      unique: async () => rows[0] ?? null,
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_n: string, cb: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => {
        const filters: Array<[string, unknown]> = [];
        const q = { eq: (field: string, value: unknown): unknown => { filters.push([field, value]); return q; } };
        cb(q);
        const filtered = rows.filter((row) => filters.every(([field, value]) => row[field] === value));
        return { ...terminal, collect: async () => filtered, take: async (n: number) => filtered.slice(0, n) };
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: unknown) => options.getMany?.[String(id)] ?? options.get ?? null),
      delete: vi.fn(),
      insert: vi.fn(async () => 'new-observation-id'),
    },
  };
}

function handler(fn: unknown): (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> })._handler;
}

beforeEach(() => { authState.userId = 'user-1'; });

describe('observations.list', () => {
  it('throws when signed out', async () => {
    authState.userId = null;
    await expect(handler(list)(ctx(), { childId: 'child-1' })).rejects.toThrow(/authenticated/i);
  });

  it("throws for a child the caller doesn't own", async () => {
    await expect(handler(list)(ctx({ get: { _id: 'child-1', userId: 'someone-else' } }), { childId: 'child-1' }))
      .rejects.toThrow(/Not found/);
  });

  it('returns only the owned child\'s notes, most recent first', async () => {
    const c = ctx({
      get: { _id: 'child-1', userId: 'user-1' },
      rows: {
        observations: [
          { _id: 'o1', childId: 'child-1', observedOn: '2026-07-01', note: 'earlier', createdAt: 1 },
          { _id: 'o2', childId: 'child-1', observedOn: '2026-08-01', note: 'later', createdAt: 2 },
        ],
      },
    });
    const rows = await handler(list)(c, { childId: 'child-1' }) as Row[];
    expect(rows.map((r) => r._id)).toEqual(['o2', 'o1']);
  });
});

describe('observations.add', () => {
  it('rejects a blank note', async () => {
    const c = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(add)(c, { childId: 'child-1', observedOn: '2026-08-01', note: '   ' }))
      .rejects.toThrow(/Note is required/);
  });

  it('trims the note and stores it under the child owner', async () => {
    const c = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await handler(add)(c, { childId: 'child-1', observedOn: '2026-08-01', note: '  said a new word  ' });
    expect(c.db.insert).toHaveBeenCalledWith('observations', expect.objectContaining({
      note: 'said a new word',
      userId: 'user-1',
      childId: 'child-1',
    }));
  });
});

describe('observations.remove', () => {
  it("throws for a note whose child the caller doesn't own", async () => {
    const c = ctx({
      getMany: {
        'obs-1': { _id: 'obs-1', childId: 'child-1' },
        'child-1': { _id: 'child-1', userId: 'someone-else' },
      },
    });
    await expect(handler(remove)(c, { id: 'obs-1' })).rejects.toThrow(/Not found/);
  });

  it('deletes an owned note', async () => {
    const c = ctx({
      getMany: {
        'obs-1': { _id: 'obs-1', childId: 'child-1' },
        'child-1': { _id: 'child-1', userId: 'user-1' },
      },
    });
    await handler(remove)(c, { id: 'obs-1' });
    expect(c.db.delete).toHaveBeenCalledWith('obs-1');
  });
});
