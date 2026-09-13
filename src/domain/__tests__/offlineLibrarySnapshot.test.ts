import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userId: 'parent-1' as string | null,
  readable: true,
}));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => state.userId) };
});

vi.mock('../../../convex/lib/publicationVisibility', () => ({
  contentIsParentReadable: vi.fn(async () => state.readable),
}));

import { getAiSnapshot } from '../../../convex/offlineLibrary';

type Row = Record<string, unknown>;

function context(rows: Record<string, Row[]>) {
  const query = vi.fn((table: string) => {
    const clauses: Array<[string, unknown]> = [];
    const matching = () => (rows[table] ?? []).filter((row) => (
      clauses.every(([field, value]) => row[field] === value)
    ));
    const terminal = {
      unique: async () => {
        const found = matching();
        if (found.length > 1) throw new Error('unique() found multiple rows');
        return found[0] ?? null;
      },
      take: async (count: number) => matching().slice(0, count),
    };
    return {
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = {
          eq: (field: string, value: unknown): unknown => {
            clauses.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: { query },
    storage: { getUrl: vi.fn(async () => 'https://storage.example/current') },
  };
}

function handler() {
  return (getAiSnapshot as unknown as {
    _handler: (ctx: ReturnType<typeof context>, args: { slug: string; kind: string }) => Promise<unknown>;
  })._handler;
}

const aiItem = {
  _id: 'content-1',
  slug: 'lsn_early_math',
  type: 'lesson',
  clinicalStatus: 'clinical_review',
  aiPublicationReleaseId: 'release-1',
  titleMm: 'သင်္ချာအသစ်',
  titleEn: 'Fresh early math',
  summaryMm: 'အကျဉ်း',
  summaryEn: 'Summary',
  tags: ['math'],
  data: { body: { mm: 'အသစ်', en: 'fresh' } },
  source: 'controlled import',
};

const source = {
  sourceId: 'naeyc-early-math',
  org: 'NAEYC',
  title: 'Nurturing Early Math Play',
  url: 'https://www.naeyc.org/resources/pubs/yc/fall2022/nurturing-early-math-play',
};

beforeEach(() => {
  state.userId = 'parent-1';
  state.readable = true;
});

describe('atomic AI offline snapshot', () => {
  it('returns current parent-readable content and exact linked citations together', async () => {
    const ctx = context({
      libraryContent: [aiItem],
      evidenceLinks: [{ kind: 'lesson', slug: aiItem.slug, sourceIds: [source.sourceId] }],
      evidenceSources: [source],
    });

    await expect(handler()(ctx, { slug: aiItem.slug, kind: 'lesson' })).resolves.toEqual({
      allowed: true,
      item: {
        _id: aiItem._id,
        slug: aiItem.slug,
        type: aiItem.type,
        clinicalStatus: aiItem.clinicalStatus,
        publicationLane: 'ai_audited',
        titleMm: aiItem.titleMm,
        titleEn: aiItem.titleEn,
        summaryMm: aiItem.summaryMm,
        summaryEn: aiItem.summaryEn,
        ageGroupKey: undefined,
        domainKey: undefined,
        category: undefined,
        tags: aiItem.tags,
        difficulty: undefined,
        durationMinutes: undefined,
        data: aiItem.data,
        source: aiItem.source,
      },
      sources: [source],
      media: [],
    });
  });

  it('returns only approved parent-entitled media from the same snapshot', async () => {
    const freeImage = {
      _id: 'media-free',
      contentSlug: aiItem.slug,
      kind: 'illustration',
      storageId: 'storage-free',
      mimeType: 'image/webp',
      altMm: 'လက်ရှိပုံ',
      altEn: 'Current image',
      placeholder: false,
      reviewStatus: 'approved',
      accessLevel: 'free_sample',
      sortOrder: 2,
    };
    const rows = {
      libraryContent: [aiItem],
      evidenceLinks: [{ kind: 'lesson', slug: aiItem.slug, sourceIds: [source.sourceId] }],
      evidenceSources: [source],
      subscriptions: [],
      familyCaregivers: [],
      libraryMedia: [
        { ...freeImage, _id: 'media-placeholder', placeholder: true, sortOrder: 0 },
        { ...freeImage, _id: 'media-reviewing', reviewStatus: 'in_review', sortOrder: 1 },
        freeImage,
        { ...freeImage, _id: 'media-premium', accessLevel: 'premium', sortOrder: 3 },
      ],
    };
    const ctx = context(rows);

    await expect(handler()(ctx, { slug: aiItem.slug, kind: 'lesson' }))
      .resolves.toMatchObject({
        allowed: true,
        media: [{
          id: freeImage._id,
          kind: freeImage.kind,
          url: null,
          storageUrl: 'https://storage.example/current',
          mimeType: freeImage.mimeType,
          altMm: freeImage.altMm,
          altEn: freeImage.altEn,
          accessLevel: 'free_sample',
        }],
      });
    expect(ctx.storage.getUrl).toHaveBeenCalledWith(freeImage.storageId);
  });

  it('fails closed for unauthenticated, unreadable, wrong-kind and non-AI content', async () => {
    const rows = {
      libraryContent: [aiItem],
      evidenceLinks: [{ kind: 'lesson', slug: aiItem.slug, sourceIds: [source.sourceId] }],
      evidenceSources: [source],
    };

    state.userId = null;
    await expect(handler()(context(rows), { slug: aiItem.slug, kind: 'lesson' }))
      .resolves.toEqual({ allowed: false });

    state.userId = 'parent-1';
    state.readable = false;
    await expect(handler()(context(rows), { slug: aiItem.slug, kind: 'lesson' }))
      .resolves.toEqual({ allowed: false });

    state.readable = true;
    await expect(handler()(context(rows), { slug: aiItem.slug, kind: 'guide' }))
      .resolves.toEqual({ allowed: false });

    await expect(handler()(context({ ...rows, libraryContent: [{
      ...aiItem,
      clinicalStatus: 'published',
      aiPublicationReleaseId: undefined,
    }] }), { slug: aiItem.slug, kind: 'lesson' })).resolves.toEqual({ allowed: false });
  });

  it('fails closed rather than returning a partial citation set', async () => {
    const ctx = context({
      libraryContent: [aiItem],
      evidenceLinks: [{ kind: 'lesson', slug: aiItem.slug, sourceIds: [source.sourceId, 'missing-source'] }],
      evidenceSources: [source],
    });

    await expect(handler()(ctx, { slug: aiItem.slug, kind: 'lesson' }))
      .resolves.toEqual({ allowed: false });
  });

  it('fails closed when multiple links violate the canonical kind/slug identity', async () => {
    const duplicateLink = { kind: 'lesson', slug: aiItem.slug, sourceIds: [source.sourceId] };
    const ctx = context({
      libraryContent: [aiItem],
      evidenceLinks: [duplicateLink, duplicateLink],
      evidenceSources: [source],
    });

    await expect(handler()(ctx, { slug: aiItem.slug, kind: 'lesson' }))
      .resolves.toEqual({ allowed: false });
  });
});
