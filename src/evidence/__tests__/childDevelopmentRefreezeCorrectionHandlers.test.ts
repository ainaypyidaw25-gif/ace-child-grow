import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflightAt } from '../../../convex/childDevelopmentRefreezeCorrection';
import {
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS,
  CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS,
} from '../../../convex/lib/childDevelopmentRefreezeCorrectionData';
import { CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS } from '../../../convex/lib/childDevelopmentRefreezeCorrectionCopy';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function uniqueRows(rows: readonly Row[]): Row[] {
  return [...new Map(rows.map((row) => [String(row._id), structuredClone(row)])).values()];
}

function exactContext() {
  const fixture = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES;
  const tables: Record<string, Row[]> = {
    libraryContent: uniqueRows(fixture.targets.map((target) => target.content)),
    evidenceLinks: uniqueRows(fixture.targets.map((target) => target.link)),
    evidenceSources: uniqueRows(fixture.targets.flatMap((target) => target.sources)),
    libraryMedia: uniqueRows(fixture.targets.flatMap((target) => target.media)),
    contentReviews: uniqueRows(fixture.targets.flatMap((target) => target.reviews)),
    aiContentAudits: uniqueRows(fixture.targets.flatMap((target) => target.ai.contentAudits)),
    aiEvidenceAudits: uniqueRows(fixture.targets.flatMap((target) => target.ai.evidenceAudits)),
    aiPublicationReleases: uniqueRows(fixture.targets.flatMap((target) => target.ai.releases)),
    clinicalReviewBatches: uniqueRows(fixture.registry.batches),
    clinicalReviewAssignments: uniqueRows(fixture.registry.assignments),
    clinicalReviewBatchReceipts: uniqueRows(fixture.registry.receipts),
    parentProfiles: uniqueRows([fixture.sourceApproval.reviewerProfile]),
    auditLogs: uniqueRows([fixture.sourceApproval.audit, ...fixture.releaseAudits]),
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => ({
      take: async (count: number) => (tables[table] ?? [])
        .filter((row) => conditions.every(([field, value]) => row[field] === value))
        .slice(0, count),
    });
    return {
      ...terminal(),
      withIndex: (_name: string, callback: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown) => {
        const conditions: Array<[string, unknown]> = [];
        const q = {
          eq: (field: string, value: unknown): unknown => {
            conditions.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal(conditions);
      },
    };
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    const id = `${table}:child-development-refreeze:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2_000 + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(String(id));
    if (!row) throw new Error(`missing mock row: ${id}`);
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = structuredClone(next);
    }
  });
  const get = vi.fn(async (id: string) => byId.get(String(id)) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

const beforeExpiry = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT - 60_000;

afterEach(() => vi.restoreAllMocks());

describe('Child-development 14-item refreeze correction handlers', () => {
  it('reports the exact stopped preimage and qualified source approval ready without writes', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflightAt)(state.ctx, {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: beforeExpiry,
    }) as Row;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      fixtureExact: true,
      desiredFixtureExact: true,
      registryExact: true,
      decisionSetExact: true,
      sourceApprovalExact: true,
      releaseAuditRows: 0,
    });
    expect(result.targets).toHaveLength(14);
    expect((result.targets as Row[]).every((target) => (
      target.contentInitialExact
      && target.linkInitialExact
      && target.sourcesExact
      && target.citationsEligible
      && target.mediaExact
      && target.reviewsExact
      && target.aiExact
      && target.desiredRevisionApprovals === 0
      && (target.outstandingRequiredReviews as unknown[]).length === 6
    ))).toBe(true);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['registry row', (state: ReturnType<typeof exactContext>) => {
      state.tables.clinicalReviewBatches[0].status = 'active';
    }],
    ['stopped decision', (state: ReturnType<typeof exactContext>) => {
      const decision = state.tables.contentReviews.find(
        (row) => row.clinicalReviewBatchId
          === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_PREIMAGES.registry.batches
            .find((batch) => batch.status === 'stopped_changes_requested')?.batchId
          && row.decision === 'changes_requested',
      );
      if (!decision) throw new Error('missing stopped decision fixture');
      decision.note = 'drift';
    }],
    ['qualified source approval', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources.find(
        (row) => row.sourceId === 'cdc-positive-parenting-toddlers-2-3-2026',
      )!.reviewerQualification = 'drift';
    }],
    ['source approval audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs.find(
        (row) => row.action === 'evidence.setReview',
      )!.after = 'drift';
    }],
    ['reviewer profile', (state: ReturnType<typeof exactContext>) => {
      state.tables.parentProfiles[0].staffRole = 'support';
    }],
    ['content row', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].summaryMm = 'drift';
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.push({
        _id: 'extra-review', _creationTime: 1, contentSlug: 'gd_5_6m_nutrition',
      });
    }],
    ['AI content audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'unexpected-ai', _creationTime: 1, contentSlug: 'gd_birth_2m_sleep',
      });
    }],
  ])('blocks %s drift before every write', async (_label, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(beforeExpiry);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically advances 14 revisions, changes four semantic rows and two links, and replays', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(beforeExpiry);
    const state = exactContext();
    const initialReviews = structuredClone(state.tables.contentReviews);
    const initialSources = structuredClone(state.tables.evidenceSources);
    const initialMedia = structuredClone(state.tables.libraryMedia);
    const initialAiContent = structuredClone(state.tables.aiContentAudits);
    const initialAiEvidence = structuredClone(state.tables.aiEvidenceAudits);
    const initialAiReleases = structuredClone(state.tables.aiPublicationReleases);
    const initialRegistry = structuredClone({
      batches: state.tables.clinicalReviewBatches,
      assignments: state.tables.clinicalReviewAssignments,
      receipts: state.tables.clinicalReviewBatchReceipts,
    });

    const first = await registeredHandler(apply)(state.ctx, {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(first).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 14,
      semanticContentUpdated: 4,
      revisionOnlyContentUpdated: 10,
      linksUpdated: 2,
      publicationDecisionMade: false,
      updatedAt: beforeExpiry,
    });
    expect(state.patch).toHaveBeenCalledTimes(16);
    expect(state.insert).toHaveBeenCalledTimes(1);
    expect(state.tables.auditLogs.find(
      (row) => row.action === CHILD_DEVELOPMENT_REFREEZE_CORRECTION_ACTION,
    )).toMatchObject({
      summary: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
      result: 'ok',
    });
    expect(state.tables.contentReviews).toEqual(initialReviews);
    expect(state.tables.evidenceSources).toEqual(initialSources);
    expect(state.tables.libraryMedia).toEqual(initialMedia);
    expect(state.tables.aiContentAudits).toEqual(initialAiContent);
    expect(state.tables.aiEvidenceAudits).toEqual(initialAiEvidence);
    expect(state.tables.aiPublicationReleases).toEqual(initialAiReleases);
    expect({
      batches: state.tables.clinicalReviewBatches,
      assignments: state.tables.clinicalReviewAssignments,
      receipts: state.tables.clinicalReviewBatchReceipts,
    }).toEqual(initialRegistry);

    for (const target of CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS) {
      const row = state.tables.libraryContent.find(
        (candidate) => candidate.slug === target.slug,
      )!;
      expect(row).toMatchObject({
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
        updatedAt: beforeExpiry,
        requiredReviewDimensions: [...CHILD_DEVELOPMENT_REFREEZE_REQUIRED_REVIEWS],
      });
      expect(row.reviewerId).toBeUndefined();
      expect(row.reviewerDisplayName).toBeUndefined();
      expect(row.reviewNote).toBeUndefined();
      expect(row.aiPublicationReleaseId).toBe(target.content.aiPublicationReleaseId);
      expect(row.aiPublishedAt).toBe(target.content.aiPublishedAt);
    }
    for (const slug of CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS) {
      const target = CHILD_DEVELOPMENT_REFREEZE_CORRECTION_TARGETS.find(
        (candidate) => candidate.slug === slug,
      )!;
      expect(state.tables.evidenceLinks.find((row) => row.slug === slug)).toMatchObject({
        sourceIds: target.desiredLink.sourceIds,
        updatedAt: beforeExpiry,
      });
    }

    state.patch.mockClear();
    state.insert.mockClear();
    clock.mockReturnValue(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_EXPIRES_AT + 60_000);
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      contentUpdated: 0,
      linksUpdated: 0,
      updatedAt: beforeExpiry,
    });
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
});
