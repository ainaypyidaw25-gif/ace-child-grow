import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { list as listChildren, update as updateChild } from '../../../convex/children';
import { importSeed, listByType } from '../../../convex/library';
import { setReview as setEvidenceReview } from '../../../convex/evidence';
import { transition as transitionContent } from '../../../convex/content';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  profile?: Row | null;
} = {}) {
  const patch = vi.fn();
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const terminal = {
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      unique: async () => table === 'parentProfiles' ? options.profile ?? null : rows[0] ?? null,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: () => unknown }) => unknown) => {
        callback({ eq: () => undefined });
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async () => options.get ?? null),
      patch,
      insert: vi.fn(),
    },
    storage: {},
  };
}

function handler(fn: unknown): (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

describe('Convex registered handlers enforce authorization', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('children.list returns no private rows and performs no database read when unauthenticated', async () => {
    const context = ctx({ rows: { children: [{ _id: 'child-1', userId: 'user-1', nickname: 'Private' }] } });
    await expect(handler(listChildren)(context, {})).resolves.toEqual([]);
    expect(context.db.query).not.toHaveBeenCalled();
  });

  it('children.update rejects a different owner and performs no patch', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-2', userId: 'user-2' } });
    await expect(handler(updateChild)(context, {
      id: 'child-2' as never,
      nickname: 'Changed',
      birthDate: '2024-01-01',
      useCorrectedAge: false,
    })).rejects.toThrow('Not found');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('non-staff catalogue response excludes drafts and contains no child/private fields', async () => {
    authState.userId = 'user-1';
    const published = {
      _id: 'content-1',
      slug: 'safe-public',
      type: 'activity',
      clinicalStatus: 'published',
      titleMm: 'အများသုံး',
      titleEn: 'Public',
    };
    const draft = {
      _id: 'content-2',
      slug: 'private-draft',
      type: 'activity',
      clinicalStatus: 'clinical_review',
      titleMm: 'မူကြမ်း',
      titleEn: 'Draft',
    };
    const context = ctx({
      profile: { userId: 'user-1', isStaff: false },
      rows: { libraryContent: [published, draft] },
    });
    const result = await handler(listByType)(context, { type: 'activity' });
    expect(result).toEqual({ staff: false, items: [published] });
    expect(JSON.stringify(result)).not.toMatch(/childId|birthDate|nickname|userId/);
  });

  it('normal users cannot invoke the seed importer', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(importSeed)(context, { items: [] })).rejects.toThrow('Insufficient staff permission');
  });

  it('normal users cannot mutate evidence review state', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(setEvidenceReview)(context, {
      sourceId: 'source-1',
      status: 'in_review',
      reviewer: 'Untrusted',
      reviewerQualification: 'None',
      reviewDate: '2026-07-27',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('normal users cannot transition global clinical content', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(transitionContent)(context, {
      id: 'content-1' as never,
      to: 'clinical_review',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });
});
