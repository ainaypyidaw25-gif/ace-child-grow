import { beforeEach, describe, expect, it, vi } from 'vitest';

// Backend P3 hardening from the production-readiness audit:
//   ACG-AGE-001  server-side gestational-age bound
//   ACG-DATA-002 a soft-deleted child reads as gone
//   ACG-SEC-004  payment-proof upload is validated, not trusted

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { add as addChild, update as updateChild } from '../../../convex/children';
import { list as listGrowth } from '../../../convex/growth';
import { submitPaymentRequest } from '../../../convex/billing';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  getMany?: Record<string, Row | null>;
  storageMeta?: Row | null;
} = {}) {
  const storageDelete = vi.fn(async () => undefined);
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
        const q = { eq: (field: string, value: unknown): unknown => { void field; void value; return q; } };
        cb(q);
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: unknown) => options.getMany?.[String(id)] ?? options.get ?? null),
      patch: vi.fn(),
      insert: vi.fn(async () => 'new-id'),
      system: { get: vi.fn(async () => options.storageMeta ?? null) },
    },
    storage: { delete: storageDelete },
    storageDelete,
  };
}

function handler(fn: unknown): (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> })._handler;
}

beforeEach(() => { authState.userId = 'user-1'; });

describe('ACG-AGE-001 — gestational age is bounded server-side', () => {
  const valid = { nickname: 'Baby', birthDate: '2025-01-01', useCorrectedAge: true };

  it.each([21, 45, 0, -3, 30.5])('rejects %s weeks on add', async (weeks) => {
    await expect(handler(addChild)(ctx(), { ...valid, gestationalWeeks: weeks }))
      .rejects.toThrow(/Gestational age/);
  });

  it.each([21, 45, 30.5])('rejects %s weeks on update', async (weeks) => {
    await expect(handler(updateChild)(ctx({ get: { _id: 'c1', userId: 'user-1' } }), {
      id: 'c1', ...valid, gestationalWeeks: weeks,
    })).rejects.toThrow(/Gestational age/);
  });

  it.each([22, 32, 44])('accepts %s weeks', async (weeks) => {
    await expect(handler(addChild)(ctx({ rows: { children: [] } }), { ...valid, gestationalWeeks: weeks }))
      .resolves.toBeDefined();
  });

  it('still allows corrected age with no gestational weeks recorded', async () => {
    // developmentalAgeMonths falls back to chronological age, so this is valid
    // data — rejecting it would block edits to children that already have it.
    await expect(handler(addChild)(ctx({ rows: { children: [] } }), valid)).resolves.toBeDefined();
  });
});

describe('ACG-DATA-002 — a soft-deleted child reads as gone', () => {
  it('refuses sub-record reads for a child awaiting purge', async () => {
    const context = ctx({ get: { _id: 'c1', userId: 'user-1', deletedAt: Date.now() } });
    await expect(handler(listGrowth)(context, { childId: 'c1' })).rejects.toThrow('Not found');
  });

  it('still allows reads for a live child', async () => {
    const context = ctx({ get: { _id: 'c1', userId: 'user-1' }, rows: { growthRecords: [] } });
    await expect(handler(listGrowth)(context, { childId: 'c1' })).resolves.toEqual([]);
  });
});

describe('ACG-SEC-004 — payment proof is validated, not trusted', () => {
  const args = {
    planId: 'plan-1', paymentMethodId: 'method-1', paymentReference: 'REF12345',
    proofStorageId: 'storage-1',
  };
  const live = {
    'plan-1': { _id: 'plan-1', isActive: true, planKey: 'premium', amount: 1000, currency: 'MMK' },
    'method-1': { _id: 'method-1', isActive: true },
  };

  it('rejects and deletes a non-image upload', async () => {
    const context = ctx({ getMany: live, storageMeta: { contentType: 'application/pdf', size: 1000 } });
    await expect(handler(submitPaymentRequest)(context, args)).rejects.toThrow(/JPG, PNG, or WebP/);
    expect(context.storageDelete).toHaveBeenCalled();
  });

  it('rejects and deletes an oversized image', async () => {
    const context = ctx({ getMany: live, storageMeta: { contentType: 'image/png', size: 6 * 1024 * 1024 } });
    await expect(handler(submitPaymentRequest)(context, args)).rejects.toThrow(/up to 5 MB/);
    expect(context.storageDelete).toHaveBeenCalled();
  });

  it('rejects a storage id with no uploaded file behind it', async () => {
    const context = ctx({ getMany: live, storageMeta: null });
    await expect(handler(submitPaymentRequest)(context, args)).rejects.toThrow(/not found/);
  });
});
