import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const protectedSlug = 'lsn_reading_together';
  const unrelatedSlug = 'act_reading_guard_control';
  const item = (slug: string) => ({
    type: 'lesson', slug, titleMm: 'Seed MM', titleEn: 'Seed EN', tags: [],
    source: 'Seed source', version: 1, clinicalStatus: 'clinical_review',
    data: { body: { mm: 'Seed', en: 'Seed' } },
    media: [{ kind: 'illustration', placeholder: true }], searchText: 'seed',
  });
  return { protectedSlug, unrelatedSlug, items: [item(protectedSlug), item(unrelatedSlug)] };
});

vi.mock('@convex-dev/auth/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('@convex-dev/auth/server')>(),
  getAuthUserId: vi.fn(async () => 'editor-user'),
}));
vi.mock('../../../convex/seedData.json', () => ({ default: fixtures.items }));

import { importSeed } from '../../../convex/library';
import { run, seedRunSkipsItem } from '../../../convex/seed';
import { isReadingTogetherAiPublicationSlug } from '../../../convex/lib/aiReadingTogetherPublication20260910Data';

type Row = Record<string, unknown> & { _id: string };
function context() {
  const tables: Record<string, Row[]> = {
    parentProfiles: [{ _id: 'profile', userId: 'editor-user', isStaff: true, staffRole: 'content_editor' }],
    libraryContent: fixtures.items.map((item) => ({
      ...item, _id: `content-${item.slug}`, reviewRevision: 3,
      data: { body: { mm: 'Exact corrected MM', en: 'Exact corrected EN' } }, updatedAt: 10,
    })),
    libraryMedia: [{ _id: 'media-reading', contentSlug: fixtures.protectedSlug, kind: 'illustration', placeholder: true }],
    auditLogs: [], aiPublicationReleases: [], clinicalReviewBatches: [], clinicalReviewAssignments: [],
  };
  const db = {
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const builder = { eq(key: string, value: unknown) { conditions.push([key, value]); return builder; } };
      const matching = () => (tables[table] ?? []).filter((row) => conditions.every(([key, value]) => row[key] === value));
      const query = {
        withIndex(_index: string, callback: (q: typeof builder) => unknown) { callback(builder); return query; },
        async unique() { return matching()[0] ?? null; },
        async take(count: number) { return matching().slice(0, count); },
        async collect() { return matching(); },
      };
      return query;
    },
    insert: vi.fn(async (table: string, value: Record<string, unknown>) => {
      const id = `new-${table}-${tables[table]?.length ?? 0}`;
      (tables[table] ??= []).push({ ...value, _id: id }); return id;
    }),
    patch: vi.fn(async (id: string, value: Record<string, unknown>) => {
      const row = Object.values(tables).flat().find((entry) => entry._id === id);
      if (!row) throw new Error('missing'); Object.assign(row, value);
    }),
    delete: vi.fn(async (id: string) => {
      for (const rows of Object.values(tables)) {
        const index = rows.findIndex((row) => row._id === id); if (index >= 0) rows.splice(index, 1);
      }
    }),
  };
  return { db, auth: {}, tables };
}
const handler = (fn: unknown) => (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;

describe('reading-together staged correction seed guards', () => {
  it('matches only the exact slug independent of supplied type', () => {
    expect(isReadingTogetherAiPublicationSlug(fixtures.protectedSlug)).toBe(true);
    expect(isReadingTogetherAiPublicationSlug(`${fixtures.protectedSlug}_other`)).toBe(false);
    for (const type of ['lesson', 'story', 'unexpected']) {
      expect(seedRunSkipsItem({ type, slug: fixtures.protectedSlug })).toBe(true);
    }
    expect(seedRunSkipsItem({ type: 'activity', slug: fixtures.unrelatedSlug })).toBe(false);
  });

  it.each([['library.importSeed', importSeed, { items: fixtures.items }], ['seed.run', run, {}]] as const)(
    '%s preserves the exact protected content and media while updating an unrelated row',
    async (_name, fn, args) => {
      const ctx = context();
      const protectedBefore = structuredClone({
        content: ctx.tables.libraryContent[0],
        media: ctx.tables.libraryMedia.filter((row) => row.contentSlug === fixtures.protectedSlug),
      });
      await expect(handler(fn)(ctx, args)).resolves.toEqual({ created: 0, updated: 1, skippedApproved: 1, total: 2 });
      expect({
        content: ctx.tables.libraryContent[0],
        media: ctx.tables.libraryMedia.filter((row) => row.contentSlug === fixtures.protectedSlug),
      }).toEqual(protectedBefore);
      expect(ctx.db.patch).toHaveBeenCalledTimes(1);
      expect(ctx.db.patch.mock.calls[0][0]).toBe(`content-${fixtures.unrelatedSlug}`);
    },
  );
});
