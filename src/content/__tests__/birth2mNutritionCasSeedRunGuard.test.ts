import { describe, expect, it, vi } from 'vitest';

const staleNutritionSeed = vi.hoisted(() => [{
  type: 'milestone',
  slug: 'ms_birth_2m_nutrition_1',
  titleMm: 'stale',
  titleEn: 'stale',
  tags: ['nutrition', 'birth_2m'],
  source: 'stale or hand-built seed artifact',
  version: 1,
  clinicalStatus: 'clinical_review',
  data: { observeEn: 'unsafe stale wording' },
  media: [{ kind: 'illustration' }],
  searchText: 'stale',
}]);

vi.mock('../../../convex/seedData.json', () => ({ default: staleNutritionSeed }));

import { run } from '../../../convex/seed';

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: Record<string, unknown>, args: Record<string, never>) => Promise<unknown>;
  })._handler;
}

describe('birth-to-2-month nutrition CLI seed boundary', () => {
  it('skips the stale protected target before every catalogue/media read or write', async () => {
    const query = vi.fn((table: string) => {
      if (table === 'clinicalReviewBatches') {
        const terminal = { take: async () => [] as unknown[] };
        return { withIndex: () => terminal };
      }
      throw new Error('protected nutrition item reached a database read');
    });
    const insert = vi.fn(async () => 'audit-1');
    const patch = vi.fn();
    const remove = vi.fn();
    const context = { db: { query, insert, patch, delete: remove } };

    await expect(registeredHandler(run)(context, {})).resolves.toEqual({
      created: 0,
      updated: 0,
      skippedApproved: 1,
      total: 1,
    });
    expect(query).toHaveBeenCalledTimes(5);
    expect(query.mock.calls.every(([table]) => table === 'clinicalReviewBatches')).toBe(true);
    expect(patch).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.seed',
      summary: 'created 0, updated 0, protected 1',
    }));
    expect(insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
  });
});
