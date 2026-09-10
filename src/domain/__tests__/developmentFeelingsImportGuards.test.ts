import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const slugs = ['lsn_what_is_development', 'lsn_big_feelings'];
  const unrelatedSlug = 'lesson_unrelated_development_feelings_guard_fixture';
  return {
    slugs,
    unrelatedSlug,
    items: [...slugs, unrelatedSlug].map((slug, index) => ({
      type: index < 2 ? 'unexpected' : 'lesson',
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
  getAuthUserId: vi.fn(async () => 'editor-user'),
}));
vi.mock('../../../convex/seedData.json', () => ({ default: fixtures.items }));
vi.mock('../../../convex/lib/seedPolicy', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../convex/lib/seedPolicy')>(),
  // Exercise even an adversarial future errata manifest, without editing old manifests.
  publishedErrataSlugs: vi.fn(() => [...fixtures.slugs, fixtures.unrelatedSlug]),
}));

import { importSeed } from '../../../convex/library';
import { applyPublishedErrata, run, seedRunSkipsItem } from '../../../convex/seed';
import {
  DEVELOPMENT_FEELINGS_SLUGS,
  isDevelopmentFeelingsSlug,
} from '../../../convex/lib/developmentFeelingsScope';

type Row = Record<string, unknown> & { _id: string };

function context(status = 'clinical_review', includeExisting = true) {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{
      _id: 'profile-editor', userId: 'editor-user', isStaff: true, staffRole: 'content_editor',
    }],
    libraryContent: includeExisting ? fixtures.items.map((item) => ({
      ...item,
      _id: `content-${item.slug}`,
      type: 'lesson',
      version: 1,
      reviewRevision: item.slug === 'lsn_big_feelings' ? 5 : 3,
      clinicalStatus: status,
      data: { body: { en: 'Corrected exact lesson', mm: 'Corrected exact lesson' } },
      reviewerId: 'old-reviewer-summary',
      reviewedAt: 10,
      updatedAt: 20,
    })) : [],
    libraryMedia: fixtures.slugs.map((slug) => ({
      _id: `media-${slug}`, contentSlug: slug, kind: 'illustration', placeholder: true,
    })),
    evidenceLinks: fixtures.slugs.map((slug) => ({
      _id: `link-${slug}`, slug, kind: 'lesson', sourceIds: ['corrected-source'],
    })),
    contentReviews: fixtures.slugs.map((slug) => ({
      _id: `review-${slug}`, contentSlug: slug, reviewRevision: slug === 'lsn_big_feelings' ? 4 : 2,
      contentVersion: slug === 'lsn_big_feelings' ? 4 : 2, dimension: 'evidence', decision: 'approved',
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
    links: ctx.tables.evidenceLinks.filter((row) => fixtures.slugs.includes(String(row.slug))),
    reviews: ctx.tables.contentReviews.filter((row) => fixtures.slugs.includes(String(row.contentSlug))),
  });
}

describe('exact development and feelings correction importer guards', () => {
  it('protects only the exact slug regardless of supplied type', () => {
    expect(DEVELOPMENT_FEELINGS_SLUGS).toEqual(fixtures.slugs);
    for (const slug of fixtures.slugs) {
      expect(isDevelopmentFeelingsSlug(slug)).toBe(true);
      for (const type of ['lesson', 'guide', 'activity', 'story', 'unexpected']) {
        expect(seedRunSkipsItem({ type, slug })).toBe(true);
      }
      expect(isDevelopmentFeelingsSlug(`${slug}_other`)).toBe(false);
    }
    expect(seedRunSkipsItem({ type: 'guide', slug: fixtures.unrelatedSlug })).toBe(false);
    expect(isDevelopmentFeelingsSlug('')).toBe(false);
  });

  it.each(['draft', 'clinical_review', 'approved', 'published'])(
    'library.importSeed leaves exact content, old status and history unchanged in %s',
    async (status) => {
      const ctx = context(status);
      const before = protectedSnapshot(ctx);
      await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 2) })).resolves.toEqual({
        created: 0, updated: 0, skippedApproved: 2, total: 2,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).not.toHaveBeenCalled();
      expect(ctx.db.delete).not.toHaveBeenCalled();
      expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
    },
  );

  it('does not recreate absent protected content or media through library.importSeed', async () => {
    const ctx = context('clinical_review', false);
    const before = protectedSnapshot(ctx);
    await expect(handler(importSeed)(ctx, { items: fixtures.items.slice(0, 2) })).resolves.toEqual({
      created: 0, updated: 0, skippedApproved: 2, total: 2,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.tables.libraryContent).toEqual([]);
    expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
  });

  it('keeps unrelated public import behavior intact', async () => {
    const ctx = context();
    const before = protectedSnapshot(ctx);
    await expect(handler(importSeed)(ctx, { items: fixtures.items })).resolves.toEqual({
      created: 0, updated: 1, skippedApproved: 2, total: 3,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
    expect(ctx.db.patch).toHaveBeenCalledWith(`content-${fixtures.unrelatedSlug}`, expect.objectContaining({
      reviewRevision: 4, reviewerId: undefined,
    }));
  });

  it.each([true, false])('seed.run preserves protected rows or their absence (existing=%s)', async (existing) => {
    const ctx = context('clinical_review', existing);
    const before = protectedSnapshot(ctx);
    await expect(handler(run)(ctx, {})).resolves.toEqual({
      created: existing ? 0 : 1, updated: existing ? 1 : 0, skippedApproved: 2, total: 3,
    });
    expect(protectedSnapshot(ctx)).toEqual(before);
    expect(ctx.db.patch.mock.calls.every(([id]) => id === `content-${fixtures.unrelatedSlug}`)).toBe(true);
    expect(ctx.db.insert.mock.calls.filter(([table]) => table === 'libraryContent').every(([, row]) => row.slug === fixtures.unrelatedSlug)).toBe(true);
  });

  it.each(['2026-07-28-content-remediation', '2026-07-28-myanmar-copy-clarity'])(
    'historical errata %s cannot restore stale lesson copy', async (releaseId) => {
      const ctx = context('published');
      const before = protectedSnapshot(ctx);
      await expect(handler(applyPublishedErrata)(ctx, { releaseId })).resolves.toEqual({
        updated: 1, unchanged: 2, missing: 0, notPublished: 0, total: 3,
      });
      expect(protectedSnapshot(ctx)).toEqual(before);
      expect(ctx.db.patch).toHaveBeenCalledTimes(1);
      expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
      expect(ctx.db.insert.mock.calls.every(([table]) => table === 'auditLogs')).toBe(true);
    },
  );
});
