import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const slugs = [
    'st_little_seed',
    'st_ba_ba_sounds',
    'st_when_i_feel_angry',
    'st_taking_turns',
    'st_goodnight_moon_friend',
    'st_visit_to_doctor',
    'st_sharing_mango',
  ];
  const unrelatedSlug = 'act_unrelated_import_guard_fixture';
  return {
    slugs,
    unrelatedSlug,
    items: [...slugs, unrelatedSlug].map((slug, index) => ({
      // Slug-based protection must also cover a stale or malformed type.
      type: index === 1 ? 'guide' : index === 2 ? 'story' : 'activity',
      slug,
      titleEn: 'Old authored title',
      titleMm: 'Old authored title',
      tags: [],
      source: 'Old broad attribution',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: { evidenceSummary: 'Old unsupported attribution' },
      media: [{ kind: 'illustration', placeholder: true }],
      searchText: 'old seed',
    })),
  };
});
vi.mock('@convex-dev/auth/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('@convex-dev/auth/server')>(),
  getAuthUserId: vi.fn(async () => 'editor-user'),
}));
vi.mock('../../../convex/seedData.json', () => ({ default: fixtures.items }));
vi.mock('../../../convex/lib/seedPolicy', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../convex/lib/seedPolicy')>(),
  // Exercise the skip path for all seven, including an adversarial future
  // manifest, without editing any real historical release definition.
  publishedErrataSlugs: vi.fn(() => [...fixtures.slugs, fixtures.unrelatedSlug]),
}));

import { importSeed } from '../../../convex/library';
import { applyPublishedErrata, run, seedRunSkipsItem } from '../../../convex/seed';
import {
  SEVEN_STORY_CORRECTION_SLUGS,
  isSevenStoryCorrectionSlug,
} from '../../../convex/lib/sevenStoryCorrectionScope';

type Row = Record<string, unknown> & { _id: string };

function context(status = 'clinical_review', includeExisting = true) {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'profile-editor', userId: 'editor-user', isStaff: true, staffRole: 'content_editor',
    }],
    libraryContent: includeExisting ? fixtures.items.map((item) => ({
      ...item,
      _id: `content-${item.slug}`,
      type: 'activity',
      version: 6,
      reviewRevision: 6,
      clinicalStatus: status,
      data: { evidenceSummary: 'Corrected exact attribution' },
      reviewerId: 'historical-reviewer',
      reviewedAt: 10,
      updatedAt: 20,
    })) : [],
    libraryMedia: fixtures.slugs.map((slug) => ({
      _id: `media-${slug}`, contentSlug: slug, kind: 'illustration', placeholder: true,
    })),
    contentReviews: fixtures.slugs.map((slug) => ({
      _id: `review-${slug}`, contentSlug: slug, reviewRevision: 5,
      contentVersion: 5, dimension: 'evidence', decision: 'approved',
    })),
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
    reviews: ctx.tables.contentReviews.filter((row) => fixtures.slugs.includes(String(row.contentSlug))),
  });
}

describe('exact seven-story correction importer guards', () => {
  it('protects only the seven exact slugs, regardless of the supplied type', () => {
    expect(SEVEN_STORY_CORRECTION_SLUGS).toEqual(fixtures.slugs);
    for (const slug of fixtures.slugs) {
      expect(isSevenStoryCorrectionSlug(slug)).toBe(true);
      for (const type of ['activity', 'guide', 'story', 'unexpected']) {
        expect(seedRunSkipsItem({ type, slug })).toBe(true);
      }
      expect(isSevenStoryCorrectionSlug(`${slug}_other`)).toBe(false);
    }
    expect(seedRunSkipsItem({ type: 'activity', slug: fixtures.unrelatedSlug })).toBe(false);
    expect(isSevenStoryCorrectionSlug('')).toBe(false);
  });

  it.each(['draft', 'clinical_review', 'approved', 'published'])(
    'library.importSeed preserves exact content, media and review history in %s',
    async (status) => {
      const ctx = context(status);
      const before = protectedSnapshot(ctx);
      await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 7) })).resolves.toEqual({
        created: 0, updated: 0, skippedApproved: 7, total: 7,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).not.toHaveBeenCalled();
      expect(ctx.db.delete).not.toHaveBeenCalled();
      expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
    },
  );

  it('does not recreate a missing protected row or its media', async () => {
    const ctx = context('clinical_review', false);
    await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 7) })).resolves.toEqual({
      created: 0, updated: 0, skippedApproved: 7, total: 7,
    });
    expect(ctx.tables.libraryContent).toEqual([]);
    expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
  });

  it('retains unrelated library import behaviour while protecting the seven corrections', async () => {
    const ctx = context();
    const before = protectedSnapshot(ctx);
    await expect(handler(importSeed)(ctx, { items: fixtures.items })).resolves.toEqual({
      created: 0, updated: 1, skippedApproved: 7, total: 8,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
    expect(ctx.db.patch).toHaveBeenCalledWith(`content-${fixtures.unrelatedSlug}`, expect.objectContaining({
      reviewRevision: 7, reviewerId: undefined,
    }));
  });

  it('bundled seed.run skips all seven before changing body, media or historical review state', async () => {
    const ctx = context();
    const before = protectedSnapshot(ctx);
    await expect(handler(run)(ctx, {})).resolves.toEqual({
      created: 0, updated: 1, skippedApproved: 7, total: 8,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
    expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
  });

  it.each(['2026-07-28-content-remediation', '2026-07-28-myanmar-copy-clarity'])(
    'historical errata %s cannot restore stale attribution while preserving unrelated behaviour', async (releaseId) => {
      const ctx = context('published');
      const before = protectedSnapshot(ctx);
      await expect(handler(applyPublishedErrata)(ctx, {
        releaseId,
      })).resolves.toEqual({ updated: 1, unchanged: 7, missing: 0, notPublished: 0, total: 8 });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).toHaveBeenCalledTimes(1);
      expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
      expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
    },
  );
});
