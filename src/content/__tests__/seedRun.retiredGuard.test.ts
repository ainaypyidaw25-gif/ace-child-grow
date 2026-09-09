import { describe, expect, it, vi } from 'vitest';

const retiredSeedFixture = vi.hoisted(() => [
  {
    type: 'milestone',
    slug: 'ms_4y_problem_solving_1',
    titleMm: 'retired',
    titleEn: 'retired',
    tags: [],
    source: 'stale seed artifact',
    version: 1,
    clinicalStatus: 'clinical_review',
    data: {},
    media: [{ kind: 'illustration' }],
    searchText: 'retired',
  },
  {
    // The library upsert key is the slug, so lying about the type must not
    // bypass the retirement at the registered internal mutation boundary.
    type: 'guide',
    slug: 'ms_4y_problem_solving_1',
    titleMm: 'retired with wrong type',
    titleEn: 'retired with wrong type',
    tags: [],
    source: 'hand-built stale seed artifact',
    version: 1,
    clinicalStatus: 'clinical_review',
    data: {},
    media: [{ kind: 'video' }],
    searchText: 'retired with wrong type',
  },
  {
    type: 'activity',
    slug: 'prt_flash_cards',
    titleMm: 'retired printable with wrong type',
    titleEn: 'retired printable with wrong type',
    tags: [],
    source: 'hand-built stale seed artifact',
    version: 1,
    clinicalStatus: 'clinical_review',
    data: {},
    media: [{ kind: 'pdf' }],
    searchText: 'retired printable with wrong type',
  },
]);

vi.mock('../../../convex/seedData.json', () => ({ default: retiredSeedFixture }));

import { run } from '../../../convex/seed';

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: Record<string, unknown>, args: Record<string, never>) => Promise<unknown>;
  })._handler;
}

describe('internal seed.run retirement boundary', () => {
  it('skips retired slugs before every catalogue or media read and write', async () => {
    const query = vi.fn((table: string) => {
      if (table === 'clinicalReviewBatches') {
        const terminal = { take: async () => [] as unknown[] };
        return { withIndex: () => terminal };
      }
      throw new Error('retired item reached a database read');
    });
    const insert = vi.fn(async () => 'audit-1');
    const patch = vi.fn();
    const remove = vi.fn();
    const context = {
      db: {
        query,
        insert,
        patch,
        delete: remove,
      },
    };

    await expect(handler(run)(context, {})).resolves.toEqual({
      created: 0,
      updated: 0,
      skippedApproved: retiredSeedFixture.length,
      total: retiredSeedFixture.length,
    });

    expect(query).toHaveBeenCalledTimes(5);
    expect(query.mock.calls.every(([table]) => table === 'clinicalReviewBatches')).toBe(true);
    expect(patch).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.seed',
      summary: 'created 0, updated 0, protected 3',
    }));
    expect(insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
  });
});
