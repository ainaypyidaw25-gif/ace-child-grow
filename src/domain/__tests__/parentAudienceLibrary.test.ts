import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'staff-1' as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import { getBySlug, listByType, publicationManifest } from '../../../convex/library';

type Row = Record<string, unknown>;

function context(libraryRows: Row[], extraRows: Record<string, Row[]> = {}) {
  const query = vi.fn((table: string) => {
    const rows = table === 'parentProfiles'
      ? [{ userId: 'staff-1', staffRole: 'owner' }]
      : table === 'libraryContent' ? libraryRows : extraRows[table] ?? [];
    const clauses: Array<[string, unknown]> = [];
    const matching = () => rows.filter((row) => clauses.every(([field, value]) => row[field] === value));
    const terminal = {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      unique: async () => matching()[0] ?? null,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => {
          clauses.push([field, value]);
          return q;
        } };
        callback(q);
        return terminal;
      },
    };
  });
  return { auth: {}, db: { query }, storage: { getUrl: vi.fn() } };
}

function currentEvidence(slug: string, kind = 'lesson') {
  return {
    evidenceLinks: [{ kind, slug, sourceIds: [`source-${slug}`] }],
    evidenceSources: [{
      sourceId: `source-${slug}`, reviewStatus: 'approved', evidenceLevel: 'guideline',
      year: 2025, verifiedOn: '2026-08-01', reviewDate: '2026-08-01',
      nextReviewDate: '2028-08-01',
    }],
  };
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
    const result = await handler(listByType)(context(rows, currentEvidence('live')), { type: 'lesson', audience: 'parent' }) as { staff: boolean; items: Row[] };
    expect(result.staff).toBe(false);
    expect(result.items.map((row) => row.slug)).toEqual(['live']);
  });

  it('batches evidence dependencies for a large parent catalogue', async () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      _id: `live-${index}`,
      slug: `live-${index}`,
      type: 'milestone',
      clinicalStatus: 'published',
      searchText: `live ${index}`,
    }));
    const evidence = {
      evidenceLinks: rows.map((row) => ({
        kind: row.type,
        slug: row.slug,
        sourceIds: ['shared-source'],
      })),
      evidenceSources: [{
        sourceId: 'shared-source', reviewStatus: 'approved', evidenceLevel: 'guideline',
        year: 2025, verifiedOn: '2026-08-01', reviewDate: '2026-08-01',
        nextReviewDate: '2028-08-01',
      }],
    };
    const ctx = context(rows, evidence);

    const result = await handler(listByType)(ctx, {
      type: 'milestone',
      audience: 'parent',
    }) as { items: Row[] };

    expect(result.items).toHaveLength(200);
    expect(ctx.db.query.mock.calls.filter(([table]) => table === 'evidenceLinks')).toHaveLength(1);
    expect(ctx.db.query.mock.calls.filter(([table]) => table === 'evidenceSources')).toHaveLength(1);
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

  it.each([
    ['expired', { reviewStatus: 'approved', nextReviewDate: '2026-08-17' }],
    ['retired', { reviewStatus: 'retired', nextReviewDate: '2028-08-01' }],
  ])('withdraws a published row when its evidence becomes %s', async (_case, sourceChange) => {
    const row = { _id: 'live', slug: 'live', type: 'lesson', clinicalStatus: 'published', searchText: 'live' };
    const evidence = currentEvidence('live');
    evidence.evidenceSources[0] = { ...evidence.evidenceSources[0], ...sourceChange };
    const ctx = context([row], evidence);
    const listed = await handler(listByType)(ctx, { type: 'lesson', audience: 'parent' }) as { items: Row[] };
    expect(listed.items).toEqual([]);
    await expect(handler(getBySlug)(ctx, { slug: 'live', audience: 'parent' }))
      .resolves.toEqual({ restricted: true });
    await expect(handler(publicationManifest)(ctx, {}))
      .resolves.toEqual({ complete: true, slugs: [] });
  });

  it.each([
    [
      'per-kind link limit',
      {
        evidenceLinks: Array.from({ length: 5_001 }, (_, index) => ({
          kind: 'lesson',
          slug: index === 0 ? 'live' : `other-${index}`,
          sourceIds: ['source-live'],
        })),
        evidenceSources: currentEvidence('live').evidenceSources,
      },
    ],
    [
      'source limit',
      {
        evidenceLinks: currentEvidence('live').evidenceLinks,
        evidenceSources: Array.from({ length: 2_001 }, (_, index) => ({
          sourceId: index === 0 ? 'source-live' : `other-source-${index}`,
          reviewStatus: 'approved',
          evidenceLevel: 'guideline',
          year: 2025,
          verifiedOn: '2026-08-01',
          reviewDate: '2026-08-01',
          nextReviewDate: '2028-08-01',
        })),
      },
    ],
  ])('marks the offline manifest incomplete on %s overflow', async (_case, evidence) => {
    const row = {
      _id: 'live',
      slug: 'live',
      type: 'lesson',
      clinicalStatus: 'published',
      searchText: 'live',
    };
    await expect(handler(publicationManifest)(context([row], evidence), {}))
      .resolves.toEqual({ complete: false, slugs: [] });
  });
});
