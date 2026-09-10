import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const slugs = [
    'act_picture_story_2_5y',
    'act_picture_story_3y',
    'act_picture_story_3_5y',
    'act_picture_story_4y',
    'act_picture_story_4_5y',
    'act_picture_story_5y',
  ];
  const unrelatedSlug = 'activity_unrelated_six_picture_story_guard_fixture';
  return {
    slugs,
    unrelatedSlug,
    items: [...slugs, unrelatedSlug].map((slug, index) => ({
      type: index < 6 ? 'unexpected' : 'activity',
      slug,
      titleEn: 'Stale activity title',
      titleMm: 'Stale activity title',
      tags: [],
      source: 'Old source',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: { instructions: [{ en: 'Stale copy', mm: 'Stale copy' }] },
      media: [
        { kind: 'illustration', placeholder: true, offline: true },
        { kind: 'video', placeholder: true },
      ],
      searchText: 'old seed',
    })),
  };
});

vi.mock('@convex-dev/auth/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('@convex-dev/auth/server')>(),
  getAuthUserId: vi.fn(async () => 'owner-user'),
}));
vi.mock('../../../convex/lib/aiPublicationVisibility', () => ({
  activeAiParentReadableContent: vi.fn(async () => ({ byTargetKey: new Map() })),
}));
vi.mock('../../../convex/seedData.json', () => ({ default: fixtures.items }));
vi.mock('../../../convex/lib/seedPolicy', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../convex/lib/seedPolicy')>(),
  publishedErrataSlugs: vi.fn(() => [...fixtures.slugs, fixtures.unrelatedSlug]),
}));

import { importSeed } from '../../../convex/library';
import { importLinks, importLinksFromCli } from '../../../convex/evidence';
import { applyPublishedErrata, run, seedRunSkipsItem } from '../../../convex/seed';
import {
  SIX_PICTURE_STORY_SUCCESSOR_SLUGS,
  isSixPictureStorySuccessorLink,
  isSixPictureStorySuccessorSlug,
} from '../../../convex/lib/sixPictureStorySuccessorScope';

type Row = Record<string, unknown> & { _id: string };

function context(status = 'clinical_review', includeExisting = true) {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'profile-owner', userId: 'owner-user', isStaff: true, staffRole: 'owner',
    }],
    libraryContent: includeExisting ? fixtures.items.map((item) => ({
      ...item,
      _id: `content-${item.slug}`,
      type: 'activity',
      version: 1,
      reviewRevision: 9,
      clinicalStatus: status,
      data: { instructions: [{ en: 'Frozen exact activity', mm: 'Frozen exact activity' }] },
      updatedAt: 20,
    })) : [],
    libraryMedia: includeExisting ? fixtures.slugs.flatMap((slug) => ([
      {
        _id: `media-illustration-${slug}`, contentSlug: slug,
        kind: 'illustration', placeholder: true, offline: true,
      },
      {
        _id: `media-video-${slug}`, contentSlug: slug,
        kind: 'video', placeholder: true,
      },
    ])) : [],
    evidenceLinks: includeExisting ? fixtures.slugs.map((slug) => ({
      _id: `link-${slug}`, slug, kind: 'activity',
      sourceIds: ['aap-power-of-play-2018', 'cdc-milestones-2026'],
    })) : [],
    evidenceSources: [],
    contentReviews: includeExisting ? fixtures.slugs.map((slug) => ({
      _id: `review-${slug}`, contentSlug: slug, reviewRevision: 5,
      contentVersion: 5, dimension: 'evidence', decision: 'approved',
    })) : [],
    aiPublicationReleases: [],
    auditLogs: [],
  };
  const insert = vi.fn(async (table: string, value: Record<string, unknown>) => {
    const id = `insert-${table}-${tables[table]?.length ?? 0}`;
    (tables[table] ??= []).push({ _id: id, ...value });
    return id;
  });
  const patch = vi.fn(async (id: string, value: Record<string, unknown>) => {
    const row = Object.values(tables).flat().find((candidate) => candidate._id === id);
    if (!row) throw new Error(`Missing fixture: ${id}`);
    Object.assign(row, value);
  });
  const remove = vi.fn(async (id: string) => {
    for (const rows of Object.values(tables)) {
      const index = rows.findIndex((row) => row._id === id);
      if (index !== -1) rows.splice(index, 1);
    }
  });
  const query = vi.fn((table: string) => {
    const clauses: Array<[string, unknown]> = [];
    const matching = () => (tables[table] ?? [])
      .filter((row) => clauses.every(([key, value]) => row[key] === value));
    const terminal = {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      unique: async () => matching()[0] ?? null,
    };
    return {
      ...terminal,
      withIndex: (_index: string, callback: (q: {
        eq: (key: string, value: unknown) => unknown;
      }) => unknown) => {
        const q = { eq: (key: string, value: unknown): unknown => {
          clauses.push([key, value]);
          return q;
        } };
        callback(q);
        return terminal;
      },
    };
  });
  return { tables, db: { query, insert, patch, delete: remove }, auth: {} };
}

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function protectedSnapshot(ctx: ReturnType<typeof context>) {
  return structuredClone({
    content: ctx.tables.libraryContent.filter((row) => fixtures.slugs.includes(String(row.slug))),
    media: ctx.tables.libraryMedia.filter((row) => fixtures.slugs.includes(String(row.contentSlug))),
    links: ctx.tables.evidenceLinks.filter((row) => fixtures.slugs.includes(String(row.slug))),
    reviews: ctx.tables.contentReviews.filter((row) => fixtures.slugs.includes(String(row.contentSlug))),
  });
}

describe('exact six-picture-story successor importer guards', () => {
  it('protects only the six exact content identities and activity links', () => {
    expect(SIX_PICTURE_STORY_SUCCESSOR_SLUGS).toEqual(fixtures.slugs);
    for (const slug of fixtures.slugs) {
      expect(isSixPictureStorySuccessorSlug(slug)).toBe(true);
      expect(isSixPictureStorySuccessorLink('activity', slug)).toBe(true);
      expect(isSixPictureStorySuccessorLink('lesson', slug)).toBe(false);
      for (const type of ['lesson', 'guide', 'activity', 'story', 'unexpected']) {
        expect(seedRunSkipsItem({ type, slug })).toBe(true);
      }
      expect(isSixPictureStorySuccessorSlug(`${slug}_other`)).toBe(false);
    }
    expect(seedRunSkipsItem({ type: 'activity', slug: fixtures.unrelatedSlug })).toBe(false);
    expect(isSixPictureStorySuccessorSlug('')).toBe(false);
  });

  it.each(['draft', 'clinical_review', 'approved', 'published'])(
    'admin content import preserves exact content and history in %s',
    async (status) => {
      const ctx = context(status);
      const before = protectedSnapshot(ctx);
      await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 6) })).resolves.toEqual({
        created: 0, updated: 0, skippedApproved: 6, total: 6,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).not.toHaveBeenCalled();
      expect(ctx.db.delete).not.toHaveBeenCalled();
    },
  );

  it('admin content import also preserves the protected rows when they are absent', async () => {
    const ctx = context('clinical_review', false);
    await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 6) })).resolves.toEqual({
      created: 0, updated: 0, skippedApproved: 6, total: 6,
    });
    expect(protectedSnapshot(ctx)).toEqual({ content: [], media: [], links: [], reviews: [] });
    expect(ctx.db.insert.mock.calls
      .filter(([table]) => table === 'libraryContent')).toEqual([]);
  });

  it.each([true, false])('CLI seed preserves protected rows or their absence (existing=%s)', async (existing) => {
    const ctx = context('clinical_review', existing);
    const before = protectedSnapshot(ctx);
    await expect(handler(run)(ctx, {})).resolves.toEqual({
      created: existing ? 0 : 1,
      updated: existing ? 1 : 0,
      skippedApproved: 6,
      total: 7,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch.mock.calls.every(([id]) => id === `content-${fixtures.unrelatedSlug}`)).toBe(true);
    expect(ctx.db.insert.mock.calls
      .filter(([table]) => table === 'libraryContent')
      .every(([, row]) => row.slug === fixtures.unrelatedSlug)).toBe(true);
  });

  it.each(['2026-07-28-content-remediation', '2026-07-28-myanmar-copy-clarity'])(
    'historical errata %s cannot restore stale picture-story copy',
    async (releaseId) => {
      const ctx = context('published');
      const before = protectedSnapshot(ctx);
      await expect(handler(applyPublishedErrata)(ctx, { releaseId })).resolves.toEqual({
        updated: 1, unchanged: 6, missing: 0, notPublished: 0, total: 7,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).toHaveBeenCalledTimes(1);
      expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
    },
  );

  it.each([
    ['admin', importLinks],
    ['CLI', importLinksFromCli],
  ])('%s evidence-link import cannot restore WHO 2012 or another broad source', async (_via, fn) => {
    const ctx = context();
    const before = protectedSnapshot(ctx);
    const links = fixtures.slugs.map((slug) => ({
      kind: 'activity',
      slug,
      sourceIds: [
        'aap-power-of-play-2018',
        'who-care-for-child-development-2012',
        'cdc-milestones-2026',
      ],
    }));
    await expect(handler(fn)(ctx, { links })).resolves.toEqual({
      created: 0,
      updated: 0,
      unchanged: 0,
      invalidatedContentKeys: [],
      skipped: 6,
      failed: 0,
      failedKeys: [],
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
