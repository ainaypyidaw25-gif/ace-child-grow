import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const slugs = [
    'lsn_talk_more',
    'lsn_making_friends',
    'lsn_creativity',
    'lsn_prepare_preschool',
  ];
  const unrelatedSlug = 'lesson_unrelated_four_successor_guard_fixture';
  return {
    slugs,
    unrelatedSlug,
    items: [...slugs, unrelatedSlug].map((slug, index) => ({
      type: index < 4 ? 'unexpected' : 'lesson',
      slug,
      titleEn: 'Stale lesson title',
      titleMm: 'Stale lesson title',
      tags: [],
      source: 'Old source',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: { body: { en: 'Stale lesson copy', mm: 'Stale lesson copy' } },
      media: [{ kind: 'illustration', placeholder: true }],
      searchText: 'old seed',
    })),
  };
});

vi.mock('@convex-dev/auth/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('@convex-dev/auth/server')>(),
  getAuthUserId: vi.fn(async () => 'owner-user'),
}));
// This guard suite does not exercise parent visibility. Keeping it isolated also
// proves these importer boundaries without depending on any release artifact.
vi.mock('../../../convex/lib/aiPublicationVisibility', () => ({
  activeAiParentReadableContent: vi.fn(async () => ({ byTargetKey: new Map() })),
}));
vi.mock('../../../convex/seedData.json', () => ({ default: fixtures.items }));
vi.mock('../../../convex/lib/seedPolicy', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../convex/lib/seedPolicy')>(),
  // Exercise adversarial future manifests without altering historical ones.
  publishedErrataSlugs: vi.fn(() => [...fixtures.slugs, fixtures.unrelatedSlug]),
}));

import { importSeed } from '../../../convex/library';
import { importLinks, importLinksFromCli } from '../../../convex/evidence';
import { applyPublishedErrata, run, seedRunSkipsItem } from '../../../convex/seed';
import {
  FOUR_LESSON_SUCCESSOR_SLUGS,
  isFourLessonSuccessorLink,
  isFourLessonSuccessorSlug,
} from '../../../convex/lib/fourLessonSuccessorScope';

type Row = Record<string, unknown> & { _id: string };

function context(status = 'clinical_review', includeExisting = true) {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'profile-owner', userId: 'owner-user', isStaff: true, staffRole: 'owner',
    }],
    libraryContent: includeExisting ? fixtures.items.map((item) => ({
      ...item,
      _id: `content-${item.slug}`,
      type: 'lesson',
      version: 1,
      reviewRevision: 7,
      clinicalStatus: status,
      data: { body: { en: 'Corrected exact lesson', mm: 'Corrected exact lesson' } },
      reviewerId: 'historical-reviewer',
      reviewedAt: 10,
      updatedAt: 20,
    })) : [],
    libraryMedia: fixtures.slugs.map((slug) => ({
      _id: `media-${slug}`, contentSlug: slug, kind: 'illustration', placeholder: true,
    })),
    evidenceLinks: fixtures.slugs.map((slug) => ({
      _id: `link-${slug}`, slug, kind: 'lesson', sourceIds: ['corrected-source'],
    })),
    evidenceSources: [],
    contentReviews: fixtures.slugs.map((slug) => ({
      _id: `review-${slug}`, contentSlug: slug, reviewRevision: 6,
      contentVersion: 6, dimension: 'evidence', decision: 'approved',
    })),
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
      withIndex: (_index: string, callback: (q: { eq: (key: string, value: unknown) => unknown }) => unknown) => {
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

describe('exact four-lesson successor importer guards', () => {
  it('protects only the four exact content identities and lesson links', () => {
    expect(FOUR_LESSON_SUCCESSOR_SLUGS).toEqual(fixtures.slugs);
    for (const slug of fixtures.slugs) {
      expect(isFourLessonSuccessorSlug(slug)).toBe(true);
      expect(isFourLessonSuccessorLink('lesson', slug)).toBe(true);
      expect(isFourLessonSuccessorLink('guide', slug)).toBe(false);
      for (const type of ['lesson', 'guide', 'activity', 'story', 'unexpected']) {
        expect(seedRunSkipsItem({ type, slug })).toBe(true);
      }
      expect(isFourLessonSuccessorSlug(`${slug}_other`)).toBe(false);
    }
    expect(seedRunSkipsItem({ type: 'guide', slug: fixtures.unrelatedSlug })).toBe(false);
    expect(isFourLessonSuccessorSlug('')).toBe(false);
  });

  it.each(['draft', 'clinical_review', 'approved', 'published'])(
    'admin content import preserves exact content and history in %s',
    async (status) => {
      const ctx = context(status);
      const before = protectedSnapshot(ctx);
      await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 4) })).resolves.toEqual({
        created: 0, updated: 0, skippedApproved: 4, total: 4,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).not.toHaveBeenCalled();
      expect(ctx.db.delete).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])('CLI seed preserves protected rows or their absence (existing=%s)', async (existing) => {
    const ctx = context('clinical_review', existing);
    const before = protectedSnapshot(ctx);
    await expect(handler(run)(ctx, {})).resolves.toEqual({
      created: existing ? 0 : 1,
      updated: existing ? 1 : 0,
      skippedApproved: 4,
      total: 5,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch.mock.calls.every(([id]) => id === `content-${fixtures.unrelatedSlug}`)).toBe(true);
    expect(ctx.db.insert.mock.calls
      .filter(([table]) => table === 'libraryContent')
      .every(([, row]) => row.slug === fixtures.unrelatedSlug)).toBe(true);
  });

  it.each(['2026-07-28-content-remediation', '2026-07-28-myanmar-copy-clarity'])(
    'historical errata %s cannot restore stale successor copy',
    async (releaseId) => {
      const ctx = context('published');
      const before = protectedSnapshot(ctx);
      await expect(handler(applyPublishedErrata)(ctx, { releaseId })).resolves.toEqual({
        updated: 1, unchanged: 4, missing: 0, notPublished: 0, total: 5,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).toHaveBeenCalledTimes(1);
      expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
    },
  );

  it.each([
    ['admin', importLinks],
    ['CLI', importLinksFromCli],
  ])('%s evidence-link import preserves all four exact link rows', async (_via, fn) => {
    const ctx = context();
    const before = protectedSnapshot(ctx);
    const links = fixtures.slugs.map((slug) => ({
      kind: 'lesson',
      slug,
      sourceIds: ['stale-source'],
    }));
    await expect(handler(fn)(ctx, { links })).resolves.toEqual({
      created: 0,
      updated: 0,
      unchanged: 0,
      invalidatedContentKeys: [],
      skipped: 4,
      failed: 0,
      failedKeys: [],
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
