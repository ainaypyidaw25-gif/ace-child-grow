import { describe, expect, it } from 'vitest';
import { queuesSelfTest } from '../../../convex/ownerPriority';

type Review = {
  contentSlug: string;
  dimension: string;
  decision: string;
  reviewerId: string;
  contentVersion: number;
  reviewRevision?: number;
  note?: string;
  reviewedAt: number;
  reviewerDisplayName: string;
};

const handler = (queuesSelfTest as unknown as {
  _handler: (ctx: ReturnType<typeof context>, args: Record<string, never>) => Promise<{
    rows: Array<{ priority: string; warnings: string[]; latestDecisionAt: number | null }>;
    counts: { p0Remaining: number };
  }>;
})._handler;

function context(reviews: Review[]) {
  const content = [{
    _id: 'content-1',
    _creationTime: 1,
    slug: 'lsn_balanced_meals',
    type: 'lesson',
    titleMm: 'ညီညွတ်စားပါ',
    titleEn: 'Balanced meals',
    tags: [],
    data: {},
    source: 'seed',
    version: 1,
    reviewRevision: 12,
    clinicalStatus: 'clinical_review',
    searchText: 'balanced meals',
    createdAt: 1,
    updatedAt: 2,
  }];
  const links = [{
    _id: 'link-1',
    _creationTime: 1,
    kind: 'lesson',
    slug: 'lsn_balanced_meals',
    sourceIds: ['source-1'],
    createdAt: 1,
    updatedAt: 2,
  }];

  return {
    db: {
      query(table: string) {
        if (table === 'libraryContent') return { collect: async () => content };
        if (table === 'evidenceLinks') return { collect: async () => links };
        if (table === 'contentReviews') {
          return {
            order: () => ({ take: async (limit: number) => reviews.slice(0, limit) }),
          };
        }
        if (table === 'contentEditLogs') {
          return {
            order: () => ({ take: async () => [] }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    },
  };
}

const legacyDecision = (reviewedAt: number): Review => ({
  contentSlug: 'lsn_balanced_meals',
  dimension: 'native_myanmar',
  decision: 'in_review',
  reviewerId: 'reviewer-1',
  contentVersion: 7,
  note: '',
  reviewedAt,
  reviewerDisplayName: 'Daw Thidar Aung',
});

describe('owner-priority queue duplicate review integrity', () => {
  it('does not turn immutable duplicate history from an old revision into a current P0', async () => {
    const result = await handler(context([
      legacyDecision(300),
      legacyDecision(200),
      legacyDecision(100),
    ]), {});

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].priority).not.toBe('P0');
    expect(result.rows[0].warnings).not.toContain('duplicate identical review decisions recorded');
    expect(result.rows[0].latestDecisionAt).toBe(300);
    expect(result.counts.p0Remaining).toBe(0);
  });

  it('still reports an exact duplicate at the current revision as P0', async () => {
    const current = (reviewedAt: number): Review => ({
      ...legacyDecision(reviewedAt),
      contentVersion: 12,
      reviewRevision: 12,
    });
    const result = await handler(context([current(300), current(200)]), {});

    expect(result.rows[0].priority).toBe('P0');
    expect(result.rows[0].warnings).toContain('duplicate identical review decisions recorded');
    expect(result.counts.p0Remaining).toBe(1);
  });
});
