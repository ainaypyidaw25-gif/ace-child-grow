import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regression tests for ACG-GATE-001 / ACG-GATE-002: the media and evidence
// "for content" endpoints must apply the same publication gate as
// library.getBySlug, so a non-staff caller can never read the media or citations
// of content that is not yet published — even when the media/source rows
// themselves are individually 'approved'.

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { listForContent as listMedia } from '../../../convex/media';
import { forContent as evidenceForContent } from '../../../convex/evidence';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: { rows?: Record<string, Row[]>; profile?: Row | null } = {}) {
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const terminal = {
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      unique: async () => (table === 'parentProfiles' ? options.profile ?? null : rows[0] ?? null),
    };
    return {
      ...terminal,
      withIndex: (_name: string, cb: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => { void field; void value; return q; } };
        cb(q);
        return terminal;
      },
    };
  });
  return { auth: {}, db: { query }, storage: { getUrl: vi.fn(async () => 'https://signed/url') } };
}

function handler(fn: unknown): (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (c: ReturnType<typeof ctx>, a: Record<string, unknown>) => Promise<unknown> })._handler;
}

const approvedSource: Row = {
  sourceId: 's1', org: 'WHO', title: 'Reference', authors: null, year: 2020, edition: null,
  country: null, language: 'en', url: 'https://who.int', doi: null, isbn: null, pmid: null,
  evidenceLevel: 'guideline', reviewStatus: 'approved', verifiedOn: '2026-08-01',
  reviewDate: '2026-08-01', nextReviewDate: '2028-08-01',
};

describe('ACG-GATE-001 — media.listForContent gates unpublished content', () => {
  beforeEach(() => { authState.userId = 'parent-1'; });

  it('returns [] for a parent when the content is not published (even with approved media)', async () => {
    const context = ctx({
      profile: null, // non-staff
      rows: {
        libraryContent: [{ slug: 'guide_x', clinicalStatus: 'clinical_review' }],
        libraryMedia: [{ _id: 'm1', kind: 'illustration', reviewStatus: 'approved', placeholder: false, accessLevel: 'free_sample' }],
      },
    });
    await expect(handler(listMedia)(context, { contentSlug: 'guide_x' })).resolves.toEqual([]);
  });

  it('returns [] for a parent when no content row exists for the slug', async () => {
    const context = ctx({ profile: null, rows: { libraryContent: [], libraryMedia: [{ _id: 'm1', reviewStatus: 'approved', placeholder: false }] } });
    await expect(handler(listMedia)(context, { contentSlug: 'ghost' })).resolves.toEqual([]);
  });

  it('returns [] after a published item\'s only evidence expires', async () => {
    const context = ctx({
      profile: null,
      rows: {
        libraryContent: [{ slug: 'guide_x', type: 'guide', clinicalStatus: 'published' }],
        evidenceLinks: [{ kind: 'guide', slug: 'guide_x', sourceIds: ['s1'] }],
        evidenceSources: [{ ...approvedSource, nextReviewDate: '2026-08-17' }],
        libraryMedia: [{ _id: 'm1', kind: 'illustration', reviewStatus: 'approved', placeholder: false, accessLevel: 'free_sample' }],
      },
    });
    await expect(handler(listMedia)(context, { contentSlug: 'guide_x' })).resolves.toEqual([]);
  });

  it('rejects an unauthenticated caller', async () => {
    authState.userId = null;
    await expect(handler(listMedia)(ctx(), { contentSlug: 'guide_x' })).rejects.toThrow();
  });
});

describe('ACG-GATE-002 — evidence.forContent gates unpublished content', () => {
  beforeEach(() => { authState.userId = 'parent-1'; });

  it('returns no sources for a parent when the library content is not published', async () => {
    const context = ctx({
      profile: null,
      rows: {
        libraryContent: [{ slug: 'guide_x', clinicalStatus: 'draft' }],
        evidenceLinks: [{ kind: 'guide', slug: 'guide_x', sourceIds: ['s1'] }],
        evidenceSources: [approvedSource],
      },
    });
    await expect(handler(evidenceForContent)(context, { slug: 'guide_x' })).resolves.toEqual({ allowed: true, sources: [] });
  });

  it('still returns public safety_rule / hope_topic citations (no libraryContent row)', async () => {
    const context = ctx({
      profile: null,
      rows: {
        libraryContent: [], // safety rules are not library content
        evidenceLinks: [{ kind: 'safety_rule', slug: 'sr_choking', sourceIds: ['s1'] }],
        evidenceSources: [approvedSource],
      },
    });
    const result = await handler(evidenceForContent)(context, { slug: 'sr_choking' }) as { allowed: boolean; sources: unknown[] };
    expect(result.allowed).toBe(true);
    expect(result.sources).toHaveLength(1);
  });

  it('staff may see citations of unpublished content', async () => {
    const context = ctx({
      profile: { staffRole: 'owner' },
      rows: {
        libraryContent: [{ slug: 'guide_x', clinicalStatus: 'draft' }],
        evidenceLinks: [{ kind: 'guide', slug: 'guide_x', sourceIds: ['s1'] }],
        evidenceSources: [approvedSource],
      },
    });
    const result = await handler(evidenceForContent)(context, { slug: 'guide_x' }) as { allowed: boolean; sources: unknown[] };
    expect(result.sources).toHaveLength(1);
  });

  it('does not expose a stale approved citation to a parent', async () => {
    const context = ctx({
      profile: null,
      rows: {
        libraryContent: [{ slug: 'guide_x', type: 'guide', clinicalStatus: 'published' }],
        evidenceLinks: [{ kind: 'guide', slug: 'guide_x', sourceIds: ['s1'] }],
        evidenceSources: [{ ...approvedSource, nextReviewDate: '2026-08-17' }],
      },
    });
    await expect(handler(evidenceForContent)(context, { slug: 'guide_x' }))
      .resolves.toEqual({ allowed: true, sources: [] });
  });

  it('returns { allowed: false } for an unauthenticated caller', async () => {
    authState.userId = null;
    await expect(handler(evidenceForContent)(ctx(), { slug: 'guide_x' })).resolves.toEqual({ allowed: false, sources: [] });
  });
});
