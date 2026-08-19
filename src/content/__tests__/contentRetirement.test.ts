import { describe, expect, it, vi } from 'vitest';
import {
  preflightBrightFuturesDuplicateMilestoneRetirement,
  preflightDuplicateMilestoneRetirement,
  preflightSocialEmotionalMilestoneRetirement,
  retireBrightFuturesDuplicateMilestone,
  retireDuplicateMilestones,
  retireSocialEmotionalMilestones,
} from '../../../convex/seed';
import {
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET,
  DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  DUPLICATE_MILESTONE_SLUGS,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS,
} from '../../../convex/lib/contentRetirements';

type Row = Record<string, unknown> & { _id: string };

function retirementContext(rows: Record<string, Row[]>) {
  const patch = vi.fn();
  const insert = vi.fn(async () => 'audit-1');
  const query = vi.fn((table: string) => {
    const clauses: Array<[string, unknown]> = [];
    const matching = () => (rows[table] ?? []).filter((row) =>
      clauses.every(([field, value]) => row[field] === value));
    const terminal = {
      unique: async () => matching()[0] ?? null,
      take: async (limit: number) => matching().slice(0, limit),
    };
    const q = {
      eq(field: string, value: unknown) {
        clauses.push([field, value]);
        return q;
      },
    };
    return {
      withIndex: (_name: string, callback: (builder: typeof q) => unknown) => {
        callback(q);
        return terminal;
      },
    };
  });
  return { db: { query, patch, insert } };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof retirementContext>, args: unknown) => Promise<unknown> })
    ._handler;
}

function contentRows(status?: string): Row[] {
  return DUPLICATE_MILESTONE_SLUGS.map((slug, index) => ({
    _id: `content-${index + 1}`,
    slug,
    titleEn: slug,
    clinicalStatus: status ?? (slug === 'ms_5_6m_speech_1' ? 'clinical_review' : 'published'),
    reviewRevision: slug === 'ms_5_6m_speech_1' ? 2 : undefined,
  }));
}

function exactTargets() {
  return DUPLICATE_MILESTONE_SLUGS.map((slug) => ({
    slug,
    expectedReviewRevision: slug === 'ms_5_6m_speech_1' ? 2 : 1,
  }));
}

describe('duplicate milestone retirement release', () => {
  it('preflights only the exact six slugs without writing', async () => {
    const context = retirementContext({
      libraryContent: contentRows(),
      libraryMedia: [{ _id: 'media-1', contentSlug: DUPLICATE_MILESTONE_SLUGS[0] }],
      evidenceLinks: [{ _id: 'link-1', slug: DUPLICATE_MILESTONE_SLUGS[0] }],
    });
    const result = await handler(preflightDuplicateMilestoneRetirement)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as Array<Record<string, unknown>>;

    expect(result.map((row) => row.slug)).toEqual(DUPLICATE_MILESTONE_SLUGS);
    expect(result.map((row) => row.clinicalStatus)).toEqual([
      'published',
      'clinical_review',
      'published',
      'published',
      'published',
      'published',
    ]);
    expect(result.map((row) => row.reviewRevision)).toEqual([1, 2, 1, 1, 1, 1]);
    expect(result[0]).toMatchObject({ mediaRows: 1, evidenceLinkRows: 1 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('archives all six atomically and records one audit event per exact slug', async () => {
    const context = retirementContext({ libraryContent: contentRows() });
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({
      retired: 6,
      alreadyRetired: 0,
      publishedWithdrawn: 5,
      unpublishedArchived: 1,
      total: 6,
    });

    expect(context.db.patch).toHaveBeenCalledTimes(6);
    for (const [index] of DUPLICATE_MILESTONE_SLUGS.entries()) {
      expect(context.db.patch).toHaveBeenCalledWith(`content-${index + 1}`, expect.objectContaining({
        clinicalStatus: 'archived',
        reviewScope: undefined,
        reviewerId: undefined,
      }));
    }
    expect(context.db.insert).toHaveBeenCalledTimes(6);
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
        action: 'library.duplicate_milestone.retired',
        summary: `${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ${slug}`,
      }));
    }
  });

  it('aborts before every write when any review revision is stale', async () => {
    const context = retirementContext({ libraryContent: contentRows() });
    const targets = exactTargets();
    targets[5] = { ...targets[5], expectedReviewRevision: 999 };
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets,
    })).rejects.toThrow('newer review revision');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('aborts before every write when a target leaves the authorized status set', async () => {
    const rows = contentRows();
    rows[4] = { ...rows[4], clinicalStatus: 'draft' };
    const context = retirementContext({ libraryContent: rows });
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets: exactTargets(),
    })).rejects.toThrow('unexpected status');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('is idempotent after all six rows are already archived', async () => {
    const context = retirementContext({ libraryContent: contentRows('archived') });
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({
      retired: 0,
      alreadyRetired: 6,
      publishedWithdrawn: 0,
      unpublishedArchived: 0,
      total: 6,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});

function socialEmotionalRows(overrides: Partial<Row> = {}): Row[] {
  return SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS.map((target, index) => ({
    _id: `social-emotional-${index + 1}`,
    slug: target.slug,
    titleEn: target.slug,
    clinicalStatus: target.expectedClinicalStatus,
    reviewRevision: target.expectedReviewRevision,
    ...overrides,
  }));
}

describe('social-emotional milestone retirement release', () => {
  it('preflights only the four fixed production preimages without writing', async () => {
    const rows = socialEmotionalRows();
    const firstSlug = SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS[0].slug;
    const context = retirementContext({
      libraryContent: rows,
      libraryMedia: [{ _id: 'social-media-1', contentSlug: firstSlug }],
      evidenceLinks: [{ _id: 'social-link-1', slug: firstSlug }],
    });
    const result = await handler(preflightSocialEmotionalMilestoneRetirement)(context, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as Array<Record<string, unknown>>;

    expect(result.map((row) => row.slug)).toEqual(
      SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS.map((target) => target.slug),
    );
    expect(result.map((row) => row.clinicalStatus)).toEqual([
      'published',
      'clinical_review',
      'clinical_review',
      'clinical_review',
    ]);
    expect(result.map((row) => row.reviewRevision)).toEqual([1, 2, 2, 1]);
    expect(result.every((row) => row.exactState === true)).toBe(true);
    expect(result[0]).toMatchObject({ mediaRows: 1, evidenceLinkRows: 1 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('archives the exact four rows atomically and audits each status transition', async () => {
    const context = retirementContext({ libraryContent: socialEmotionalRows() });
    await expect(handler(retireSocialEmotionalMilestones)(context, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    })).resolves.toEqual({
      retired: 4,
      alreadyRetired: 0,
      publishedWithdrawn: 1,
      unpublishedArchived: 3,
      total: 4,
    });

    expect(context.db.patch).toHaveBeenCalledTimes(4);
    expect(context.db.insert).toHaveBeenCalledTimes(4);
    for (const [index, target] of SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_TARGETS.entries()) {
      expect(context.db.patch).toHaveBeenCalledWith(`social-emotional-${index + 1}`, expect.objectContaining({
        clinicalStatus: 'archived',
        reviewerId: undefined,
        reviewNote: `Retired by ${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID}`,
      }));
      expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
        action: 'library.social_emotional_milestone.retired',
        summary: `${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID} · ${target.slug}`,
      }));
    }
  });

  it('aborts before every write when a target revision or status changed', async () => {
    const staleRevision = socialEmotionalRows();
    staleRevision[3] = { ...staleRevision[3], reviewRevision: 9 };
    const revisionContext = retirementContext({ libraryContent: staleRevision });
    await expect(handler(retireSocialEmotionalMilestones)(revisionContext, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    })).rejects.toThrow('newer review revision');
    expect(revisionContext.db.patch).not.toHaveBeenCalled();
    expect(revisionContext.db.insert).not.toHaveBeenCalled();

    const changedStatus = socialEmotionalRows();
    changedStatus[1] = { ...changedStatus[1], clinicalStatus: 'published' };
    const statusContext = retirementContext({ libraryContent: changedStatus });
    await expect(handler(retireSocialEmotionalMilestones)(statusContext, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    })).rejects.toThrow('unexpected status');
    expect(statusContext.db.patch).not.toHaveBeenCalled();
    expect(statusContext.db.insert).not.toHaveBeenCalled();
  });

  it('accepts only this release archive as an idempotent replay', async () => {
    const correctRows = socialEmotionalRows({
      clinicalStatus: 'archived',
      reviewNote: `Retired by ${SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID}`,
    });
    const context = retirementContext({ libraryContent: correctRows });
    await expect(handler(retireSocialEmotionalMilestones)(context, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    })).resolves.toEqual({
      retired: 0,
      alreadyRetired: 4,
      publishedWithdrawn: 0,
      unpublishedArchived: 0,
      total: 4,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();

    const foreignRows = socialEmotionalRows({
      clinicalStatus: 'archived',
      reviewNote: 'Retired by another release',
    });
    const foreignContext = retirementContext({ libraryContent: foreignRows });
    await expect(handler(retireSocialEmotionalMilestones)(foreignContext, {
      releaseId: SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_RELEASE_ID,
    })).rejects.toThrow('archived outside this release');
    expect(foreignContext.db.patch).not.toHaveBeenCalled();
    expect(foreignContext.db.insert).not.toHaveBeenCalled();
  });
});

function brightFuturesDuplicateRow(overrides: Partial<Row> = {}): Row {
  return {
    _id: 'bright-futures-duplicate',
    slug: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug,
    titleEn: 'Follows rules and takes turns',
    clinicalStatus: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.expectedClinicalStatus,
    reviewRevision: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.expectedReviewRevision,
    ...overrides,
  };
}

describe('Bright Futures duplicate milestone retirement release', () => {
  it('preflights the fixed production preimage without writing', async () => {
    const slug = BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug;
    const context = retirementContext({
      libraryContent: [brightFuturesDuplicateRow()],
      libraryMedia: [{ _id: 'bright-futures-media', contentSlug: slug }],
      evidenceLinks: [{ _id: 'bright-futures-link', slug }],
    });
    await expect(handler(preflightBrightFuturesDuplicateMilestoneRetirement)(context, {
      releaseId: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
    })).resolves.toEqual({
      slug,
      found: true,
      clinicalStatus: 'clinical_review',
      reviewRevision: 5,
      expectedClinicalStatus: 'clinical_review',
      expectedReviewRevision: 5,
      exactState: true,
      mediaRows: 1,
      evidenceLinkRows: 1,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('archives and audits only the exact stale-state target', async () => {
    const context = retirementContext({ libraryContent: [brightFuturesDuplicateRow()] });
    await expect(handler(retireBrightFuturesDuplicateMilestone)(context, {
      releaseId: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
    })).resolves.toEqual({
      retired: 1,
      alreadyRetired: 0,
      publishedWithdrawn: 0,
      unpublishedArchived: 1,
      total: 1,
    });
    expect(context.db.patch).toHaveBeenCalledWith('bright-futures-duplicate', expect.objectContaining({
      clinicalStatus: 'archived',
      reviewerId: undefined,
      reviewNote: `Retired by ${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`,
    }));
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.bright_futures_duplicate_milestone.retired',
      summary: `${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ms_5y_self_help_2`,
    }));
  });

  it('fails closed on status/revision drift and foreign archives', async () => {
    for (const [row, message] of [
      [brightFuturesDuplicateRow({ reviewRevision: 6 }), 'newer review revision'],
      [brightFuturesDuplicateRow({ clinicalStatus: 'published' }), 'unexpected status'],
      [brightFuturesDuplicateRow({ clinicalStatus: 'archived', reviewNote: 'Retired elsewhere' }), 'archived outside this release'],
    ] as const) {
      const context = retirementContext({ libraryContent: [row] });
      await expect(handler(retireBrightFuturesDuplicateMilestone)(context, {
        releaseId: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      })).rejects.toThrow(message);
      expect(context.db.patch).not.toHaveBeenCalled();
      expect(context.db.insert).not.toHaveBeenCalled();
    }
  });

  it('is idempotent only after this exact release archived the row', async () => {
    const context = retirementContext({
      libraryContent: [brightFuturesDuplicateRow({
        clinicalStatus: 'archived',
        reviewNote: `Retired by ${BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID}`,
      })],
    });
    await expect(handler(retireBrightFuturesDuplicateMilestone)(context, {
      releaseId: BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
    })).resolves.toEqual({
      retired: 0,
      alreadyRetired: 1,
      publishedWithdrawn: 0,
      unpublishedArchived: 0,
      total: 1,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
