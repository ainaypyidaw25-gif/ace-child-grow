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
    rows: Array<{
      priority: string;
      priorityReasons: string[];
      riskClass: string;
      warnings: string[];
      latestDecisionAt: number | null;
    }>;
    counts: { p0Remaining: number };
  }>;
})._handler;

function context(reviews: Review[], contentOverrides: Record<string, unknown> = {}) {
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
    ...contentOverrides,
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

  it('does not show a legacy education-scope warning after a current clinical publication decision', async () => {
    const clinicalApproval: Review = {
      ...legacyDecision(300),
      dimension: 'clinical',
      decision: 'approved',
      contentVersion: 12,
      reviewRevision: 12,
    };
    const result = await handler(context([clinicalApproval], {
      clinicalStatus: 'published',
      reviewScope: 'clinical',
      priorityStatus: 'completed',
      data: { note: { mm: 'အဖျား ရှိလျှင်', en: 'If fever appears' } },
    }), {});

    expect(result.rows[0].warnings).not.toContain(
      'parent-visible high-risk wording lacks a current clinical-scope publication decision',
    );
    expect(result.rows[0].priorityReasons).toEqual([
      'parent-visible high-risk record with required reviews completed',
    ]);
  });

  it('keeps the warning when published specialist-risk wording lacks clinical scope', async () => {
    const result = await handler(context([], {
      clinicalStatus: 'published',
      reviewScope: 'education',
      data: { referral: { mm: 'အရေးပေါ်ကုသမှု ချက်ချင်း ရယူပါ', en: 'Seek emergency care immediately' } },
    }), {});

    expect(result.rows[0].warnings).toContain(
      'parent-visible high-risk wording lacks a current clinical-scope publication decision',
    );
    expect(result.rows[0].warnings).toContain(
      'education-scoped review covers general education only, not a specialist safety decision',
    );
  });

  it('does not mislabel an ordinary education-scoped Class C guide as a specialist decision', async () => {
    const result = await handler(context([], {
      type: 'guide',
      clinicalStatus: 'published',
      reviewScope: 'education',
      data: {
        redFlags: { mm: 'စိုးရိမ်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ', en: 'Speak with a health worker if concerned' },
        referral: { mm: 'လိုအပ်ပါက စစ်ဆေးမှုခံယူပါ', en: 'Arrange an assessment if needed' },
      },
    }), {});

    expect(result.rows[0].riskClass).toBe('C');
    expect(result.rows[0].warnings).not.toContain(
      'parent-visible high-risk wording lacks a current clinical-scope publication decision',
    );
    expect(result.rows[0].warnings).not.toContain(
      'education-scoped review covers general education only, not a specialist safety decision',
    );
  });
});
